'use client';

import DatabaseTabs from '@/components/explorer/database/database-tabs';
import type { ExplorerListKind, ExplorerResource } from '@/lib/explorer/types';

type NamespaceViewProps = {
    catalog: string;
    resource: Extract<ExplorerResource, { kind: 'database' | 'list' }>;
};

function resolveInitialTab(resource: Extract<ExplorerResource, { kind: 'database' | 'list' }>) {
    if (resource.kind !== 'list' || resource.schema) {
        return undefined;
    }

    const map: Partial<Record<ExplorerListKind, 'summary' | 'tables' | 'views' | 'materialized-views'>> = {
        tables: 'tables',
        views: 'views',
        materializedViews: 'materialized-views',
    };

    return map[resource.listKind];
}

export function NamespaceView({ catalog, resource }: NamespaceViewProps) {
    return (
        <DatabaseTabs
            catalog={catalog}
            database={resource.database}
            initialTab={resolveInitialTab(resource)}
        />
    );
}
