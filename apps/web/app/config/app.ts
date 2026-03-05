import { isDesktopRuntime } from '@/lib/runtime/runtime';

export const X_CONNECTION_ID_KEY = 'X-Connection-ID';

export const USE_CLOUD_AI = isDesktopRuntime();
