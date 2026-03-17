'use client';

import type { ComponentType } from 'react';
import type { ExplorerBaseParams, ExplorerResolvedRoute, ExplorerResource } from '@/lib/explorer/types';
import { NamespaceView } from './namespace-view';
import { ObjectView } from './object-view';
import { SchemaSummaryView } from './schema-summary-view';
import { PostgresDatabaseView } from './postgres/postgres-database-view';
import { PostgresSchemaView } from './postgres/postgres-schema-view';
import { PostgresTableView } from './postgres/postgres-table-view';

type NamespaceViewComponent = ComponentType<{
    baseParams: ExplorerBaseParams;
    catalog: string;
    resource: Extract<ExplorerResource, { kind: 'database' | 'list' }>;
}>;

type SchemaViewComponent = ComponentType<{
    baseParams: ExplorerBaseParams;
    catalog: string;
    resource: Extract<ExplorerResource, { kind: 'schema' | 'list' }>;
}>;

type ObjectViewComponent = ComponentType<{
    catalog: string;
    resource: Extract<ExplorerResource, { kind: 'object' }>;
}>;

type ExplorerViewRegistry = {
    namespace: NamespaceViewComponent;
    schema: SchemaViewComponent;
    object: ObjectViewComponent;
};

const DEFAULT_VIEW_REGISTRY: ExplorerViewRegistry = {
    namespace: ({ catalog, resource }) => <NamespaceView catalog={catalog} resource={resource} />,
    schema: ({ baseParams, resource }) => <SchemaSummaryView baseParams={baseParams} resource={resource} />,
    object: ({ catalog, resource }) => <ObjectView catalog={catalog} resource={resource} />,
};

const POSTGRES_VIEW_REGISTRY: ExplorerViewRegistry = {
    namespace: PostgresDatabaseView,
    schema: PostgresSchemaView,
    object: ({ catalog, resource }) => {
        if (resource.objectKind === 'table' || resource.objectKind === 'view' || resource.objectKind === 'materializedView') {
            return <PostgresTableView catalog={catalog} resource={resource} />;
        }

        return <ObjectView catalog={catalog} resource={resource} />;
    },
};

export function getExplorerViewRegistry(route: ExplorerResolvedRoute): ExplorerViewRegistry {
    switch (route.driver) {
        case 'postgres':
            return POSTGRES_VIEW_REGISTRY;
        default:
            return DEFAULT_VIEW_REGISTRY;
    }
}
