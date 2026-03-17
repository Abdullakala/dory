'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAtom } from 'jotai';
import { useParams, useRouter } from 'next/navigation';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { activeDatabaseAtom } from '@/shared/stores/app.store';
import { CatalogSchemaSidebar } from '../../../components/catalog-schema-sidebar/catalog-schema-sidebar';
import { useDataExplorerLayout } from '../../catalog/hooks/use-layout';
import { buildExplorerDatabasePath } from '@/lib/explorer/build-path';

function normalizeHorizontalLayout(layout: readonly number[] | undefined): [number, number] {
    if (!Array.isArray(layout) || layout.length === 0) return [25, 85];

    const left = layout[0] ?? 25;
    const middle = layout[1] ?? 100 - left;
    const total = left + middle;

    if (total <= 0) return [25, 85];

    const normalizedLeft = (left / total) * 100;
    return [normalizedLeft, 100 - normalizedLeft];
}

type ExplorerLayoutProps = {
    defaultLayout?: number[] | undefined;
    database?: string;
    table?: string;
    children?: ReactNode;
};

function resolveParam(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
}

export function ExplorerLayout({ defaultLayout = [25, 85], database, table, children }: ExplorerLayoutProps) {
    const { normalizedLayout, onLayout } = useDataExplorerLayout(defaultLayout);
    const horizontalLayout = useMemo(() => normalizeHorizontalLayout(normalizedLayout), [normalizedLayout]);
    const [activeDatabase] = useAtom(activeDatabaseAtom);
    const router = useRouter();
    const params = useParams<{
        team?: string | string[];
        connectionId?: string | string[];
        database?: string | string[];
        table?: string | string[];
    }>();
    const team = resolveParam(params?.team);
    const connectionId = resolveParam(params?.connectionId);
    const resolvedDatabase = database ?? resolveParam(params?.database);
    const resolvedTable = table ?? resolveParam(params?.table);
    const [selectedDatabase, setSelectedDatabase] = useState(resolvedDatabase);
    const [selectedTable, setSelectedTable] = useState(resolvedTable);

    useEffect(() => {
        setSelectedDatabase(resolvedDatabase);
    }, [resolvedDatabase]);

    useEffect(() => {
        setSelectedTable(resolvedTable);
    }, [resolvedTable]);

    const handleSelectTable = useCallback(
        (payload: { database?: string; tableName: string }) => {
            const dbName = payload.database ?? resolvedDatabase ?? activeDatabase;
            if (!team || !connectionId || !dbName || !payload.tableName) return;

            setSelectedDatabase(dbName);
            setSelectedTable(payload.tableName);

            router.push(buildExplorerDatabasePath({ team, connectionId }, dbName));
        },
        [activeDatabase, connectionId, resolvedDatabase, router, team],
    );

    const handleSelectDatabase = useCallback(
        (dbName: string) => {
            if (!team || !connectionId || !dbName) return;

            setSelectedDatabase(dbName);
            router.push(buildExplorerDatabasePath({ team, connectionId }, dbName));
        },
        [connectionId, router, team],
    );

    return (
        <main className="relative h-full w-full">
            <PanelGroup direction="horizontal" autoSaveId="sql-console-horizontal" onLayout={onLayout}>
                <Panel defaultSize={horizontalLayout[0]} minSize={15} maxSize={40}>
                    <div className="flex h-full min-h-0 flex-col bg-card">
                        <CatalogSchemaSidebar
                            catalogName="default"
                            onSelectTable={handleSelectTable}
                            onSelectDatabase={handleSelectDatabase}
                            selectedDatabase={selectedDatabase}
                            selectedTable={selectedTable}
                        />
                    </div>
                </Panel>

                <PanelResizeHandle className="w-1.5 bg-border transition-colors data-[resize-handle-active=true]:bg-foreground/30" />

                <Panel defaultSize={horizontalLayout[1]} minSize={40}>
                    <div className="flex h-full min-h-0 flex-col">{children}</div>
                </Panel>
            </PanelGroup>
        </main>
    );
}
