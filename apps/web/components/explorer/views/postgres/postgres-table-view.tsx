'use client';

import { DriverTableBrowser } from '@/app/(app)/[team]/components/table-browser/driver-table-browser';
import type { ExplorerResource } from '@/lib/explorer/types';
import { useExplorerConnectionContext } from './postgres-shared';

type PostgresTableViewProps = {
    catalog: string;
    resource: Extract<ExplorerResource, { kind: 'object' }>;
};

export function PostgresTableView({ catalog, resource }: PostgresTableViewProps) {
    const { connectionId } = useExplorerConnectionContext();
    const qualifiedName = resource.schema ? `${resource.schema}.${resource.name}` : resource.name;

    return <DriverTableBrowser driver="postgres" connectionId={connectionId} databaseName={resource.database} tableName={qualifiedName} />;
}
