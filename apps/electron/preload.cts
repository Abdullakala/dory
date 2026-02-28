import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    platform: process.platform,
    isPackaged: process.env.NODE_ENV === 'production' || process.env.ELECTRON_IS_PACKAGED === 'true',
});

contextBridge.exposeInMainWorld('authBridge', {
    openExternal: (url: string) => ipcRenderer.invoke('auth:openExternal', url),
    onCallback: (callback: (url: string) => void) => {
        const listener = (_event: unknown, url: string) => {
            console.log('[electron][preload] auth callback url:', url);
            callback(url);
        };
        ipcRenderer.on('auth:callback', listener);
        return () => ipcRenderer.removeListener('auth:callback', listener);
    },
});

contextBridge.exposeInMainWorld('themeBridge', {
    getTheme: () => ipcRenderer.invoke('theme:get'),
    setTheme: (theme: 'light' | 'dark' | 'system') => ipcRenderer.invoke('theme:set', theme),
    onThemeChanged: (callback: (theme: 'light' | 'dark' | 'system') => void) => {
        const listener = (_event: unknown, theme: 'light' | 'dark' | 'system') => {
            callback(theme);
        };
        ipcRenderer.on('theme:changed', listener);
        return () => ipcRenderer.removeListener('theme:changed', listener);
    },
});
