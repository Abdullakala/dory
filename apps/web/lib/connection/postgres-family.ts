import type { ConnectionType } from '@/types/connections';

export type PostgresFamilyConnectionType = 'postgres' | 'neon';

export function isPostgresFamilyConnectionType(value?: string | null): value is PostgresFamilyConnectionType {
    return value === 'postgres' || value === 'neon';
}

export function normalizePostgresFamilyConnectionType(value?: string | null): ConnectionType | 'unknown' {
    return isPostgresFamilyConnectionType(value) ? 'postgres' : ((value ?? 'unknown') as ConnectionType | 'unknown');
}
