'use client';

import { useTranslations } from 'next-intl';
import DatabaseSummary from '@/components/explorer/database/database-summary';
import type { ExplorerBaseParams, ExplorerListKind, ExplorerResource } from '@/lib/explorer/types';
import { PostgresExtensionListTab } from './postgres-extension-list-tab';
import { PostgresSchemaListTab } from './postgres-schema-list-tab';
import { PostgresSearchTab } from './postgres-search-tab';
import { PostgresTabsShell, type PostgresExplorerTab } from './postgres-tabs-shell';

type DatabaseTab = 'summary' | 'schemas' | 'search' | 'extensions';

type PostgresDatabaseViewProps = {
    baseParams: ExplorerBaseParams;
    catalog: string;
    resource: Extract<ExplorerResource, { kind: 'database' | 'list' }>;
};

function resolveInitialTab(resource: Extract<ExplorerResource, { kind: 'database' | 'list' }>): DatabaseTab {
    if (resource.kind !== 'list') {
        return 'summary';
    }

    const map: Partial<Record<ExplorerListKind, DatabaseTab>> = {
        schemas: 'schemas',
        tables: 'search',
        views: 'search',
        materializedViews: 'search',
        functions: 'search',
        sequences: 'search',
    };

    return map[resource.listKind] ?? 'summary';
}

export function PostgresDatabaseView({ baseParams, catalog, resource }: PostgresDatabaseViewProps) {
    const t = useTranslations('PostgresExplorer');
    const initialTab = resolveInitialTab(resource);
    const tabs: PostgresExplorerTab<DatabaseTab>[] = [
        {
            value: 'summary',
            label: t('Tabs.summary'),
            content: <DatabaseSummary catalog={catalog} database={resource.database} />,
        },
        {
            value: 'schemas',
            label: t('Tabs.schemas'),
            content: (
                <PostgresSchemaListTab
                    baseParams={baseParams}
                    database={resource.database}
                    searchPlaceholder={t('Schemas.SearchPlaceholder')}
                    emptyText={t('Schemas.Empty')}
                    filteredEmptyText={t('Schemas.FilteredEmpty')}
                />
            ),
        },
        {
            value: 'search',
            label: t('Tabs.search'),
            content: <PostgresSearchTab baseParams={baseParams} database={resource.database} placeholder={t('Search.Placeholder')} emptyText={t('Search.Empty')} />,
        },
        {
            value: 'extensions',
            label: t('Tabs.extensions'),
            content: (
                <PostgresExtensionListTab
                    database={resource.database}
                    searchPlaceholder={t('Extensions.SearchPlaceholder')}
                    emptyText={t('Extensions.Empty')}
                    filteredEmptyText={t('Extensions.FilteredEmpty')}
                />
            ),
        },
    ];

    return <PostgresTabsShell initialTab={initialTab} tabs={tabs} resetKey={`${resource.database}:${resource.kind === 'list' ? resource.listKind : 'summary'}`} />;
}
