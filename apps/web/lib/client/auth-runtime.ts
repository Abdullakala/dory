export function getAuthBaseUrl(): string | null {
    const runtime = process.env.NEXT_PUBLIC_DORY_RUNTIME?.trim() || '';
    const cloudUrl = process.env.NEXT_PUBLIC_DORY_CLOUD_API_URL?.trim() || '';

    if (runtime === 'desktop') return null;
    return cloudUrl || null;
}

export function isAuthPath(pathname: string): boolean {
    return pathname.startsWith('/api/auth') || pathname.startsWith('/api/electron/auth');
}
