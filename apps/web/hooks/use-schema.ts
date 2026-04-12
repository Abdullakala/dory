import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { schemaCacheAtom } from '@/shared/stores/schema.store';

export function useSchema(connectionId?: string, database?: string) {
    const [schemaCache, setSchemaCache] = useAtom(schemaCacheAtom);
    const cacheKey = connectionId ? `${connectionId}::${database ?? ''}` : '';

    useEffect(() => {
        if (!connectionId || schemaCache[cacheKey]) {
            return;
        }

        const url = database ? `/api/connection/${connectionId}/schema?database=${encodeURIComponent(database)}` : `/api/connection/${connectionId}/schema`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setSchemaCache(prev => ({ ...prev, [cacheKey]: data }));
            });
    }, [cacheKey, connectionId, database, schemaCache]);

    const refresh = async () => {
        if (!connectionId) return;
        const url = database ? `/api/connection/${connectionId}/schema?database=${encodeURIComponent(database)}` : `/api/connection/${connectionId}/schema`;
        const res = await fetch(url);
        const data = await res.json();
        setSchemaCache(prev => ({ ...prev, [cacheKey]: data }));
    };

    return {
        schema: schemaCache[cacheKey],
        refresh,
    };
}
