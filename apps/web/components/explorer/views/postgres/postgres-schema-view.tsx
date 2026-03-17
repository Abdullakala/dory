'use client';

import { useTranslations } from 'next-intl';
import DatabaseSummary from '@/components/explorer/database/database-summary';
import type { ExplorerBaseParams, ExplorerListKind, ExplorerResource } from '@/lib/explorer/types';
import { PostgresFunctionListTab } from './postgres-function-list-tab';
import { PostgresObjectListTab } from './postgres-object-list-tab';
import { PostgresTabsShell, type PostgresExplorerTab } from './postgres-tabs-shell';

type SchemaTab = 'summary' | 'tables' | 'views' | 'functions' | 'sequences';

type PostgresSchemaViewProps = {
    baseParams: ExplorerBaseParams;
    catalog: string;
    resource: Extract<ExplorerResource, { kind: 'schema' | 'list' }>;
};

function resolveInitialTab(resource: Extract<ExplorerResource, { kind: 'schema' | 'list' }>): SchemaTab {
    if (resource.kind !== 'list') {
        return 'summary';
    }

    const map: Partial<Record<ExplorerListKind, SchemaTab>> = {
        tables: 'tables',
        views: 'views',
        materializedViews: 'views',
        functions: 'functions',
        sequences: 'sequences',
    };

    return map[resource.listKind] ?? 'summary';
}

export function PostgresSchemaView({ baseParams, catalog, resource }: PostgresSchemaViewProps) {
    const t = useTranslations('PostgresExplorer');
    const schemaName = resource.kind === 'schema' ? resource.schema : resource.schema;
    const initialTab = resolveInitialTab(resource);
    const tabs: PostgresExplorerTab<SchemaTab>[] = [
        {
            value: 'summary',
            label: t('Tabs.summary'),
            content: <DatabaseSummary catalog={catalog} database={resource.database} schema={schemaName} />,
        },
        {
            value: 'tables',
            label: t('Tabs.tables'),
            content: (
                <PostgresObjectListTab
                    baseParams={baseParams}
                    database={resource.database}
                    schema={schemaName}
                    endpoint="tables"
                    objectKind="table"
                    searchPlaceholder={t('Tables.SearchPlaceholder')}
                    emptyText={t('Tables.Empty')}
                    filteredEmptyText={t('Tables.FilteredEmpty')}
                />
            ),
        },
        {
            value: 'views',
            label: t('Tabs.views'),
            content: (
                <PostgresObjectListTab
                    baseParams={baseParams}
                    database={resource.database}
                    schema={schemaName}
                    endpoint="views"
                    objectKind="view"
                    searchPlaceholder={t('Views.SearchPlaceholder')}
                    emptyText={t('Views.Empty')}
                    filteredEmptyText={t('Views.FilteredEmpty')}
                />
            ),
        },
        {
            value: 'functions',
            label: t('Tabs.functions'),
            content: (
                <PostgresFunctionListTab
                    database={resource.database}
                    schema={schemaName}
                    searchPlaceholder={t('Functions.SearchPlaceholder')}
                    emptyText={t('Functions.Empty')}
                    filteredEmptyText={t('Functions.FilteredEmpty')}
                />
            ),
        },
        {
            value: 'sequences',
            label: t('Tabs.sequences'),
            content: (
                <PostgresObjectListTab
                    baseParams={baseParams}
                    database={resource.database}
                    schema={schemaName}
                    endpoint="sequences"
                    objectKind="sequence"
                    searchPlaceholder={t('Sequences.SearchPlaceholder')}
                    emptyText={t('Sequences.Empty')}
                    filteredEmptyText={t('Sequences.FilteredEmpty')}
                />
            ),
        },
    ];

    return <PostgresTabsShell initialTab={initialTab} tabs={tabs} resetKey={`${resource.database}:${schemaName}:${resource.kind === 'list' ? resource.listKind : 'summary'}`} />;
}
