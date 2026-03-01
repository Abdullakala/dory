import { app, BrowserWindow, dialog, ipcMain, nativeTheme, type MessageBoxOptions } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import electronUpdater from 'electron-updater';
import Store from 'electron-store';
import { isDev } from './constants.js';
import type { MainTranslator } from './i18n.js';
import type { LogFn } from './logger.js';
import { getMainWindow, setMainWindowQuitting } from './window.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { autoUpdater } = electronUpdater;

type ProgressInfo = import('electron-updater').ProgressInfo;
type UpdateInfo = import('electron-updater').UpdateInfo;

type UpdateAction = 'dismiss' | 'install-update' | 'cancel-download' | 'restart-now' | 'skip-version' | 'remind-later';

interface AvailableDialogState {
    lang: string;
    title: string;
    message: string;
    detail: string;
    autoDownloadLabel: string;
    autoDownloadChecked: boolean;
    tertiaryLabel: string;
    secondaryLabel: string;
    primaryLabel: string;
}

interface ProgressDialogState {
    lang: string;
    title: string;
    message: string;
    detail: string;
    progress: number | null;
    progressText: string;
    secondaryLabel: string | null;
    primaryLabel: string | null;
    secondaryAction: UpdateAction;
    primaryAction: UpdateAction | null;
}

interface SetupUpdaterOptions {
    log: LogFn;
    logWarn: LogFn;
    logError: LogFn;
    locale: string;
    t: MainTranslator;
}

let availableDialog: BrowserWindow | null = null;
let progressDialog: BrowserWindow | null = null;
let queuedAvailableState: AvailableDialogState | null = null;
let queuedProgressState: ProgressDialogState | null = null;
let isManualCheck = false;
let checkInProgress = false;
let downloadInProgress = false;
let availableVersion: string | null = null;
let currentLocale = 'en-US';
let debugPreviewMode = false;
let debugProgressTimer: NodeJS.Timeout | null = null;
let errorDialogOpen = false;
let lastErrorSignature = '';
let lastErrorAt = 0;
let restartInstallInFlight = false;

const updaterPreferenceStore = new Store<{
    autoDownloadInstall: boolean;
    skippedVersion: string | null;
    remindLaterUntil: number;
}>({
    name: 'updater-preferences',
    defaults: {
        autoDownloadInstall: true,
        skippedVersion: null,
        remindLaterUntil: 0,
    },
});

const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
};

function getDialogHtmlPath(fileName: string) {
    if (isDev) {
        return path.resolve(__dirname, '../../main', fileName);
    }
    return path.join(__dirname, fileName);
}

function getDialogBackgroundColor() {
    return nativeTheme.shouldUseDarkColors ? '#232326' : '#f3f3f5';
}

function getCenteredPosition(width: number, height: number) {
    const main = getMainWindow();
    if (!main || main.isDestroyed()) return {};
    const [mx, my] = main.getPosition();
    const [mw, mh] = main.getSize();
    return {
        x: Math.round(mx + (mw - width) / 2),
        y: Math.round(my + (mh - height) / 2),
    };
}

function compareVersions(a: string, b: string) {
    const clean = (value: string) => value.split('-')[0];
    const pa = clean(a).split('.').map(part => Number(part));
    const pb = clean(b).split('.').map(part => Number(part));
    const length = Math.max(pa.length, pb.length);
    for (let i = 0; i < length; i += 1) {
        const av = Number.isFinite(pa[i]) ? pa[i] : 0;
        const bv = Number.isFinite(pb[i]) ? pb[i] : 0;
        if (av > bv) return 1;
        if (av < bv) return -1;
    }
    return 0;
}

function closeAvailableDialog() {
    if (!availableDialog || availableDialog.isDestroyed()) {
        availableDialog = null;
        return;
    }
    availableDialog.close();
}

function closeProgressDialog() {
    if (!progressDialog || progressDialog.isDestroyed()) {
        progressDialog = null;
        return;
    }
    progressDialog.close();
}

function closeAllDialogs() {
    closeAvailableDialog();
    closeProgressDialog();
}

function stopDebugProgressTimer() {
    if (!debugProgressTimer) return;
    clearInterval(debugProgressTimer);
    debugProgressTimer = null;
}

function cancelActiveDownload(log: LogFn) {
    try {
        const updaterWithCancel = autoUpdater as typeof autoUpdater & {
            cancelDownload?: () => void;
        };
        updaterWithCancel.cancelDownload?.();
    } catch (error) {
        log('[updater] cancelDownload failed:', error);
    }
}

function getAppBundlePath() {
    // /path/MyApp.app/Contents/MacOS/MyApp -> /path/MyApp.app
    return path.resolve(process.execPath, '../../..');
}

function canInstallUpdateInCurrentLocation() {
    if (process.platform !== 'darwin') return true;
    const appBundlePath = getAppBundlePath();
    if (appBundlePath.startsWith('/Volumes/')) return false;
    try {
        fs.accessSync(appBundlePath, fs.constants.W_OK);
        fs.accessSync(path.dirname(appBundlePath), fs.constants.W_OK);
        return true;
    } catch {
        return false;
    }
}

function openAvailableDialog(title: string) {
    if (availableDialog && !availableDialog.isDestroyed()) {
        availableDialog.setTitle(title);
        availableDialog.setMovable(true);
        const pos = getCenteredPosition(534, 180);
        if (typeof pos.x === 'number' && typeof pos.y === 'number') {
            availableDialog.setPosition(pos.x, pos.y);
        }
        availableDialog.show();
        availableDialog.focus();
        return;
    }

    const pos = getCenteredPosition(534, 180);
    availableDialog = new BrowserWindow({
        width: 534,
        height: 180,
        minWidth: 534,
        minHeight: 180,
        resizable: false,
        maximizable: false,
        minimizable: false,
        fullscreenable: false,
        movable: true,
        show: false,
        title,
        ...pos,
        modal: false,
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        backgroundColor: getDialogBackgroundColor(),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    availableDialog.removeMenu();
    availableDialog.loadFile(getDialogHtmlPath('update-available-dialog.html'));

    availableDialog.once('ready-to-show', () => {
        if (!availableDialog || availableDialog.isDestroyed()) return;
        availableDialog.setMovable(true);
        availableDialog.show();
        if (isDev) {
            availableDialog.webContents.openDevTools({ mode: 'detach', activate: false });
        }
        if (queuedAvailableState) {
            availableDialog.webContents.send('updater:available-state', queuedAvailableState);
        }
    });

    availableDialog.on('closed', () => {
        availableDialog = null;
    });
}

function openProgressDialog(title: string) {
    if (progressDialog && !progressDialog.isDestroyed()) {
        progressDialog.setTitle(title);
        progressDialog.setMovable(true);
        const pos = getCenteredPosition(400, 150);
        if (typeof pos.x === 'number' && typeof pos.y === 'number') {
            progressDialog.setPosition(pos.x, pos.y);
        }
        progressDialog.show();
        progressDialog.focus();
        return;
    }

    const pos = getCenteredPosition(400, 150);
    progressDialog = new BrowserWindow({
        width: 400,
        height: 150,
        minWidth: 400,
        minHeight: 150,
        resizable: false,
        maximizable: false,
        minimizable: false,
        fullscreenable: false,
        movable: true,
        show: false,
        title,
        ...pos,
        modal: false,
        titleBarStyle: 'default',
        backgroundColor: getDialogBackgroundColor(),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    progressDialog.removeMenu();
    progressDialog.loadFile(getDialogHtmlPath('update-progress-dialog.html'));

    progressDialog.once('ready-to-show', () => {
        if (!progressDialog || progressDialog.isDestroyed()) return;
        progressDialog.setMovable(true);
        progressDialog.show();
        if (isDev) {
            progressDialog.webContents.openDevTools({ mode: 'detach', activate: false });
        }
        if (queuedProgressState) {
            progressDialog.webContents.send('updater:progress-state', queuedProgressState);
        }
    });

    progressDialog.on('closed', () => {
        progressDialog = null;
    });
}

function showAvailableDialog(state: AvailableDialogState) {
    queuedAvailableState = state;
    openAvailableDialog(state.title);
    if (availableDialog && !availableDialog.isDestroyed()) {
        availableDialog.webContents.send('updater:available-state', state);
    }
    closeProgressDialog();
}

function showProgressDialog(state: ProgressDialogState) {
    queuedProgressState = state;
    openProgressDialog(state.title);
    if (progressDialog && !progressDialog.isDestroyed()) {
        progressDialog.webContents.send('updater:progress-state', state);
    }
    closeAvailableDialog();
}

function showCheckInProgress(locale: string, t: MainTranslator) {
    showProgressDialog({
        lang: locale,
        title: t('updater.title'),
        message: t('updater.checking'),
        detail: t('updater.pleaseWait'),
        progress: null,
        progressText: '',
        secondaryLabel: t('updater.cancel'),
        primaryLabel: null,
        secondaryAction: 'dismiss',
        primaryAction: null,
    });
}

function showUpdateAvailable(locale: string, t: MainTranslator, info: UpdateInfo) {
    showAvailableDialog({
        lang: locale,
        title: t('updater.title'),
        message: t('updater.updateAvailable', { version: info.version }),
        detail: t('updater.updatePrompt', { currentVersion: app.getVersion() }),
        autoDownloadLabel: t('updater.autoDownloadInstall'),
        autoDownloadChecked: updaterPreferenceStore.get('autoDownloadInstall'),
        tertiaryLabel: t('updater.skipVersion'),
        secondaryLabel: t('updater.remindLater'),
        primaryLabel: t('updater.installUpdate'),
    });
}

function showDownloading(locale: string, t: MainTranslator, progress: ProgressInfo) {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setProgressBar(Math.max(0, Math.min(1, progress.percent / 100)));
    }

    showProgressDialog({
        lang: locale,
        title: t('updater.downloadingTitle'),
        message: t('updater.downloading'),
        detail: t('updater.downloadWillPrompt'),
        progress: progress.percent / 100,
        progressText: `${formatBytes(progress.transferred)} / ${formatBytes(progress.total)}`,
        secondaryLabel: t('updater.cancel'),
        primaryLabel: null,
        secondaryAction: 'cancel-download',
        primaryAction: null,
    });
}

function showDownloaded(locale: string, t: MainTranslator, info: UpdateInfo) {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setProgressBar(-1);
    }

    showProgressDialog({
        lang: locale,
        title: t('updater.title'),
        message: t('updater.downloaded', { version: info.version }),
        detail: t('updater.downloadWillPrompt'),
        progress: 1,
        progressText: t('updater.downloadComplete'),
        secondaryLabel: t('updater.restartLater'),
        primaryLabel: t('updater.restartInstall'),
        secondaryAction: 'dismiss',
        primaryAction: 'restart-now',
    });
}

function showDebugDownloading(t: MainTranslator, percent: number) {
    const totalBytes = 157.7 * 1024 * 1024;
    const transferred = (totalBytes * Math.max(0, Math.min(100, percent))) / 100;
    showProgressDialog({
        lang: currentLocale,
        title: t('updater.downloadingTitle'),
        message: t('updater.downloading'),
        detail: t('updater.downloadWillPrompt'),
        progress: percent / 100,
        progressText: `${formatBytes(transferred)} / ${formatBytes(totalBytes)}`,
        secondaryLabel: t('updater.cancel'),
        primaryLabel: null,
        secondaryAction: 'cancel-download',
        primaryAction: null,
    });
}

function startDebugDownloadFlow(log: LogFn, t: MainTranslator) {
    stopDebugProgressTimer();
    downloadInProgress = true;
    let percent = 0;
    showDebugDownloading(t, percent);

    debugProgressTimer = setInterval(() => {
        percent = Math.min(100, percent + 6);
        showDebugDownloading(t, percent);
        if (percent >= 100) {
            stopDebugProgressTimer();
            log('[updater] debug download completed');
            downloadInProgress = false;
            showDownloaded(currentLocale, t, { version: '1.2026.048' } as UpdateInfo);
        }
    }, 160);
}

function showNoUpdateDialog(t: MainTranslator) {
    const options: MessageBoxOptions = {
        type: 'info',
        title: t('updater.title'),
        message: t('updater.latestVersion'),
        buttons: [t('updater.ok')],
        defaultId: 0,
    };

    const parentWindow = getMainWindow();
    if (parentWindow) {
        dialog.showMessageBox(parentWindow, options);
        return;
    }

    dialog.showMessageBox(options);
}

function showUpdateError(logError: LogFn, t: MainTranslator, error: unknown) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const compactRaw = rawMessage.replace(/\s+/g, ' ').trim();
    logError('[updater] update flow failed:', error);

    const isGithubFeedError = /github\.com\/.*releases\.atom/i.test(rawMessage);
    const isServerUnavailable = /\b(502|503|504)\b/.test(rawMessage);
    const isNetworkError = /(ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|network)/i.test(rawMessage);

    let message = t('updater.checkFailedGeneric');
    if (isGithubFeedError && isServerUnavailable) {
        message = t('updater.checkFailedServer');
    } else if (isNetworkError) {
        message = t('updater.checkFailedNetwork');
    } else if (compactRaw.length > 0) {
        message = compactRaw.length > 220 ? `${compactRaw.slice(0, 220)}...` : compactRaw;
    }

    const now = Date.now();
    const signature = message.trim();
    const dedupeWindowMs = 5000;
    if (errorDialogOpen) {
        logError('[updater] suppress duplicate error dialog while one is open:', signature);
        return;
    }
    if (signature === lastErrorSignature && now - lastErrorAt < dedupeWindowMs) {
        logError('[updater] suppress duplicate error dialog in cooldown window:', signature);
        return;
    }
    lastErrorSignature = signature;
    lastErrorAt = now;

    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setProgressBar(-1);
    }
    closeAllDialogs();

    const options: MessageBoxOptions = {
        type: 'error',
        title: t('updater.failed'),
        message,
        buttons: [t('updater.ok')],
        defaultId: 0,
    };

    errorDialogOpen = true;
    const result = mainWindow && !mainWindow.isDestroyed()
        ? dialog.showMessageBox(mainWindow, options)
        : dialog.showMessageBox(options);
    result.finally(() => {
        errorDialogOpen = false;
    });
}

function showInstallLocationBlockedDialog(t: MainTranslator) {
    const options: MessageBoxOptions = {
        type: 'warning',
        title: t('updater.installLocationBlocked'),
        message: t('updater.installLocationBlockedDetail'),
        buttons: [t('updater.ok')],
        defaultId: 0,
    };
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
        void dialog.showMessageBox(mainWindow, options);
        return;
    }
    void dialog.showMessageBox(options);
}

function handleUpdateAction(log: LogFn, t: MainTranslator, action: UpdateAction) {
    switch (action) {
        case 'dismiss': {
            stopDebugProgressTimer();
            closeAllDialogs();
            // "Restart later": keep downloaded update queued for install on app quit.
            break;
        }
        case 'install-update': {
            log('[updater] download requested by user');
            if (debugPreviewMode) {
                startDebugDownloadFlow(log, t);
                break;
            }
            downloadInProgress = true;
            autoUpdater.downloadUpdate().catch((error: unknown) => {
                downloadInProgress = false;
                showUpdateError(log, t, error);
            });
            break;
        }
        case 'cancel-download': {
            log('[updater] user clicked cancel download');
            if (debugPreviewMode) {
                stopDebugProgressTimer();
            } else {
                cancelActiveDownload(log);
            }

            const mainWindow = getMainWindow();
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.setProgressBar(-1);
            }
            downloadInProgress = false;
            closeAllDialogs();
            break;
        }
        case 'restart-now': {
            if (debugPreviewMode) {
                closeAllDialogs();
                break;
            }
            if (!canInstallUpdateInCurrentLocation()) {
                log('[updater] blocked restart install due to app location:', getAppBundlePath());
                showInstallLocationBlockedDialog(t);
                break;
            }
            log('[updater] quitAndInstall');
            log('[updater] restart install path:', getAppBundlePath());
            log('[updater] restart install current version:', app.getVersion());
            closeAllDialogs();
            setMainWindowQuitting(true);
            restartInstallInFlight = true;
            try {
                autoUpdater.quitAndInstall(false, true);
                // Fallback: some environments ignore quitAndInstall silently.
                setTimeout(() => {
                    if (!restartInstallInFlight) return;
                    log('[updater] quitAndInstall fallback -> app.quit()');
                    app.quit();
                }, 1500);
            } catch (error) {
                log('[updater] quitAndInstall failed, fallback to app.quit():', error);
                app.quit();
            }
            break;
        }
        case 'skip-version': {
            if (availableVersion) {
                updaterPreferenceStore.set('skippedVersion', availableVersion);
            }
            closeAvailableDialog();
            break;
        }
        case 'remind-later': {
            const remindLaterMs = 24 * 60 * 60 * 1000;
            updaterPreferenceStore.set('remindLaterUntil', Date.now() + remindLaterMs);
            closeAvailableDialog();
            break;
        }
    }
}

export function setupUpdater({ log, logWarn, logError, locale, t }: SetupUpdaterOptions) {
    currentLocale = locale;
    const updateConfigPath = path.join(process.resourcesPath, 'app-update.yml');
    const hasUpdateConfig = fs.existsSync(updateConfigPath);
    if (!hasUpdateConfig) {
        logWarn('[updater] app-update.yml not found, updater disabled:', updateConfigPath);
    }

    const showNotConfiguredDialog = () => {
        const options: MessageBoxOptions = {
            type: 'warning',
            title: t('updater.notConfigured'),
            message: t('updater.notConfiguredDetail'),
            buttons: [t('updater.ok')],
            defaultId: 0,
        };
        const parentWindow = getMainWindow();
        if (parentWindow) {
            dialog.showMessageBox(parentWindow, options);
            return;
        }
        dialog.showMessageBox(options);
    };

    const clearSkippedVersion = () => {
        updaterPreferenceStore.set('skippedVersion', null);
        availableVersion = null;

        const options: MessageBoxOptions = {
            type: 'info',
            title: t('updater.title'),
            message: t('updater.skipCleared'),
            buttons: [t('updater.ok')],
            defaultId: 0,
        };
        const parentWindow = getMainWindow();
        if (parentWindow) {
            dialog.showMessageBox(parentWindow, options);
            return;
        }
        dialog.showMessageBox(options);
    };

    const openUpdateDialogDebug = () => {
        debugPreviewMode = true;
        showAvailableDialog({
            lang: locale,
            title: t('updater.title'),
            message: t('updater.updateAvailable', { version: '1.2026.048' }),
            detail: t('updater.updatePrompt', { currentVersion: app.getVersion() }),
            autoDownloadLabel: t('updater.autoDownloadInstall'),
            autoDownloadChecked: updaterPreferenceStore.get('autoDownloadInstall'),
            tertiaryLabel: t('updater.skipVersion'),
            secondaryLabel: t('updater.remindLater'),
            primaryLabel: t('updater.installUpdate'),
        });
    };

    ipcMain.on('updater:action', (_event, action: UpdateAction) => {
        handleUpdateAction(log, t, action);
    });

    ipcMain.on('updater:auto-download', (_event, enabled: boolean) => {
        updaterPreferenceStore.set('autoDownloadInstall', Boolean(enabled));
    });

    if (!hasUpdateConfig) {
        return {
            checkForUpdatesFromMenu: async () => {
                debugPreviewMode = false;
                showNotConfiguredDialog();
            },
            clearSkippedVersionFromMenu: () => {
                clearSkippedVersion();
            },
            openUpdateDialogDebug,
        };
    }

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;
    autoUpdater.allowDowngrade = false;

    autoUpdater.on('checking-for-update', () => {
        debugPreviewMode = false;
        log('[updater] checking-for-update');
        checkInProgress = true;
        showCheckInProgress(locale, t);
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
        debugPreviewMode = false;
        log('[updater] update-available:', info.version);
        checkInProgress = false;
        availableVersion = info.version;

        if (compareVersions(info.version, app.getVersion()) <= 0) {
            logWarn('[updater] ignored non-newer version:', info.version, 'current:', app.getVersion());
            closeAllDialogs();
            isManualCheck = false;
            return;
        }

        const skippedVersion = updaterPreferenceStore.get('skippedVersion');
        if (skippedVersion && skippedVersion === info.version) {
            log('[updater] skipped version detected, suppress prompt:', info.version);
            closeAllDialogs();
            isManualCheck = false;
            return;
        }

        const remindLaterUntil = updaterPreferenceStore.get('remindLaterUntil');
        if (!isManualCheck && remindLaterUntil > Date.now()) {
            log('[updater] remind-later active, suppress prompt until:', new Date(remindLaterUntil).toISOString());
            closeAllDialogs();
            return;
        }

        const autoDownloadInstall = updaterPreferenceStore.get('autoDownloadInstall');
        if (autoDownloadInstall) {
            log('[updater] autoDownloadInstall enabled, start download immediately');
            downloadInProgress = true;
            autoUpdater.downloadUpdate().catch((error: unknown) => {
                downloadInProgress = false;
                showUpdateError(logError, t, error);
            });
            return;
        }

        showUpdateAvailable(locale, t, info);
    });

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
        debugPreviewMode = false;
        log('[updater] update-not-available:', info.version);
        checkInProgress = false;
        closeAllDialogs();
        if (isManualCheck) {
            showNoUpdateDialog(t);
        }
        isManualCheck = false;
    });

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
        debugPreviewMode = false;
        if (!downloadInProgress) {
            downloadInProgress = true;
        }
        showDownloading(locale, t, progress);
    });

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
        debugPreviewMode = false;
        log('[updater] update-downloaded:', info.version);
        downloadInProgress = false;
        isManualCheck = false;
        availableVersion = null;
        updaterPreferenceStore.set('remindLaterUntil', 0);
        showDownloaded(locale, t, info);
    });

    autoUpdater.on('error', (error: Error) => {
        debugPreviewMode = false;
        stopDebugProgressTimer();
        checkInProgress = false;
        downloadInProgress = false;
        isManualCheck = false;
        availableVersion = null;
        closeAllDialogs();
        showUpdateError(logError, t, error);
    });

    app.on('before-quit', () => {
        if (restartInstallInFlight) {
            log('[updater] before-quit while restart install in flight');
            restartInstallInFlight = false;
        }
    });

    return {
        checkForUpdatesFromMenu: async () => {
            debugPreviewMode = false;
            if (checkInProgress || downloadInProgress) {
                logWarn('[updater] check ignored: update flow already in progress');
                return;
            }

            try {
                isManualCheck = true;
                await autoUpdater.checkForUpdates();
            } catch (error) {
                stopDebugProgressTimer();
                checkInProgress = false;
                downloadInProgress = false;
                isManualCheck = false;
                availableVersion = null;
                closeAllDialogs();
                showUpdateError(logError, t, error);
            }
        },
        clearSkippedVersionFromMenu: () => {
            clearSkippedVersion();
        },
        openUpdateDialogDebug,
    };
}
