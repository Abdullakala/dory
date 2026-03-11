import Store from 'electron-store';
import type { UpdateChannel, UpdaterPreferences } from './types.js';

export const updaterPreferenceStore = new Store<UpdaterPreferences>({
    name: 'updater-preferences',
    defaults: {
        autoDownloadInstall: true,
        skippedVersion: null,
        remindLaterUntil: 0,
    },
});

export function getDefaultUpdateChannelForVersion(version: string): UpdateChannel {
    return /-beta(?:[.-]|$)/i.test(version) ? 'beta' : 'latest';
}
