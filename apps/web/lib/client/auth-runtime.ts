import { isDesktopRuntime } from '@/lib/runtime/runtime';

export function getAuthBaseUrl(): string | null {
    const cloudUrl = process.env.NEXT_PUBLIC_DORY_CLOUD_API_URL?.trim() || '';

    if (isDesktopRuntime()) return null;
    return cloudUrl || null;
}

export function isAuthPath(pathname: string): boolean {
    return pathname.startsWith('/api/auth') || pathname.startsWith('/api/electron/auth');
}
