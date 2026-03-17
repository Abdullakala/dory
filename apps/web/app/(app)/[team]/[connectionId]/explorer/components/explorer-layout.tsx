'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAtom } from 'jotai';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useTranslations } from 'next-intl';

import { activeDatabaseAtom } from '@/shared/stores/app.store';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/registry/new-york-v4/ui/breadcrumb';
import { CatalogSchemaSidebar } from '../../../components/catalog-schema-sidebar/catalog-schema-sidebar';
import { useDataExplorerLayout } from '../../catalog/hooks/use-layout';

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

export function ExplorerLayout({
    defaultLayout = [25, 85],
    database,
    table,
    children,
}: ExplorerLayoutProps) {
    const { normalizedLayout, onLayout } = useDataExplorerLayout(defaultLayout);
    const horizontalLayout = useMemo(() => normalizeHorizontalLayout(normalizedLayout), [normalizedLayout]);
    const [activeDatabase] = useAtom(activeDatabaseAtom);
    const router = useRouter();
    const t = useTranslations('Catalog');
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

            router.push(
                `/${encodeURIComponent(team)}/${encodeURIComponent(connectionId)}/explorer/database/${encodeURIComponent(dbName)}`,
            );
        },
        [activeDatabase, connectionId, resolvedDatabase, router, team],
    );

    const handleSelectDatabase = useCallback(
        (dbName: string) => {
            if (!team || !connectionId || !dbName) return;

            setSelectedDatabase(dbName);
            router.push(`/${encodeURIComponent(team)}/${encodeURIComponent(connectionId)}/explorer/database/${encodeURIComponent(dbName)}`);
        },
        [connectionId, router, team],
    );

    const breadcrumbItems = useMemo(() => {
        if (!team || !connectionId) return [];

        const base = `/${encodeURIComponent(team)}/${encodeURIComponent(connectionId)}/explorer`;
        const items: { label: string; href: string }[] = [];

        items.push({
            label: 'Explorer',
            href: base,
        });

        if (resolvedDatabase) {
            items.push({
                label: resolvedDatabase,
                href: `${base}/database/${encodeURIComponent(resolvedDatabase)}`,
            });
        }

        if (resolvedTable && resolvedDatabase) {
            items.push({
                label: resolvedTable,
                href: `${base}/database/${encodeURIComponent(resolvedDatabase)}`,
            });
        }

        return items;
    }, [connectionId, resolvedDatabase, resolvedTable, team]);

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
                    <div className="flex h-full min-h-0 flex-col">
                        {breadcrumbItems.length ? (
                            <div className="border-b px-6 py-3">
                                <Breadcrumb>
                                    <BreadcrumbList>
                                        {breadcrumbItems.map((item, index) => (
                                            <BreadcrumbItem key={`${item.label}-${item.href}`}>
                                                <BreadcrumbLink asChild>
                                                    <Link href={item.href}>{item.label}</Link>
                                                </BreadcrumbLink>
                                                {index < breadcrumbItems.length - 1 ? <BreadcrumbSeparator /> : null}
                                            </BreadcrumbItem>
                                        ))}
                                    </BreadcrumbList>
                                </Breadcrumb>
                            </div>
                        ) : null}
                        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
                    </div>
                </Panel>
            </PanelGroup>
        </main>
    );
}
