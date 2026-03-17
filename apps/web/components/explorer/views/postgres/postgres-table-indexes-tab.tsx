'use client';

import { TableIndexesTab } from '@/app/(app)/[team]/components/table-browser/components/indexes';
import { useExplorerConnectionContext } from './postgres-shared';

type PostgresTableIndexesTabProps = {
    database: string;
    table: string;
    emptyText: string;
};

export function PostgresTableIndexesTab({ database, table, emptyText }: PostgresTableIndexesTabProps) {
    const { connectionId } = useExplorerConnectionContext();
    return <TableIndexesTab connectionId={connectionId} database={database} table={table} emptyText={emptyText} />;
}
