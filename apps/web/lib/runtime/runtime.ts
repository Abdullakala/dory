export type DoryRuntime = 'desktop' | 'web';

function normalizeRuntime(value: string | null | undefined): DoryRuntime | null {
    const runtime = value?.trim().toLowerCase();
    if (!runtime) return null;
    return runtime === 'desktop' ? 'desktop' : 'web';
}

function readRawRuntime(): string {
    if (typeof window === 'undefined') {
        return process.env.DORY_RUNTIME ?? process.env.NEXT_PUBLIC_DORY_RUNTIME ?? '';
    }

    return process.env.NEXT_PUBLIC_DORY_RUNTIME ?? '';
}

export const runtime: DoryRuntime = normalizeRuntime(readRawRuntime()) ?? 'web';

export function isDesktopRuntime(): boolean {
    return runtime === 'desktop';
}

export function getRuntimeForServer(): string | null {
    const raw = process.env.DORY_RUNTIME?.trim() || process.env.NEXT_PUBLIC_DORY_RUNTIME?.trim() || '';
    return raw || null;
}
