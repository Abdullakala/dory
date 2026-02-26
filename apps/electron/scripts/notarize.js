import { notarize } from 'electron-notarize';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenvConfig({ path: resolve(__dirname, '../.env.apple') });
console.log('🔑 Apple Notarization Config Loaded:', {
    APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
    APPLE_ID: process.env.APPLE_ID,
    APPLE_ID_PASSWORD: process.env.APPLE_ID_PASSWORD,
});

export default async function notarizing(context) {
    const { electronPlatformName, appOutDir } = context;
    if (electronPlatformName !== 'darwin') {
        return;
    }
    console.log('🚀 Start Apple notarization...');
    const appName = context.packager.appInfo.productFilename;
    console.log(`appName: ${appName}`);
    try {
        await notarize({
            appPath: `${appOutDir}/${appName}.app`,
            appBundleId: 'com.dory.app',
            appleId: process.env.APPLE_ID,
            appleIdPassword: process.env.APPLE_ID_PASSWORD,
            tool: 'notarytool',
            teamId: process.env.APPLE_TEAM_ID,
        });
    } catch (error) {
        console.error('❌ Apple notarization Failed:', error);
    }
};
