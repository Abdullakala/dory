'use client';

import { useAtomValue } from 'jotai';
import { useParams } from 'next/navigation';
import { currentConnectionAtom } from '@/shared/stores/app.store';

export function resolveParam(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
}

export function safeDecode(value?: string | null) {
    if (!value) return value;

    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export function splitQualifiedName(value: string): { schema?: string; name: string } {
    const [schema, ...rest] = value.split('.');
    if (!schema || rest.length === 0) {
        return { name: value };
    }

    return {
        schema,
        name: rest.join('.'),
    };
}

export function useExplorerConnectionContext() {
    const currentConnection = useAtomValue(currentConnectionAtom);
    const params = useParams<{
        team?: string | string[];
        connectionId?: string | string[];
    }>();

    return {
        teamId: resolveParam(params?.team),
        connectionId: resolveParam(params?.connectionId) ?? currentConnection?.connection.id,
    };
}
