'use client';

import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { GroupState, TargetOption } from './types';

export type GroupConfig = {
    key: keyof GroupState;
    label: string;
    icon: LucideIcon;
    emptyLabel: string;
};

type ObjectGroupProps = {
    scopeKey: string;
    dbName: string;
    group: GroupConfig;
    isExpanded: boolean;
    isLoading: boolean;
    entries: TargetOption[];
    normalized: string;
    selectedDatabase?: string;
    selectedTable?: string;
    onToggle: () => void;
    onSelectObject: (payload: { database: string; tableName: string; tabLabel?: string }) => void;
    onOpenObject: (payload: { database: string; tableName: string; tabLabel?: string }) => void;
};

const resolveEntryValue = (entry: TargetOption) => (entry.value ?? entry.label ?? entry.name ?? '').toString();
const resolveEntryLabel = (entry: TargetOption) => (entry.label ?? entry.value ?? entry.name ?? '').toString();

export function ObjectGroup({
    scopeKey,
    dbName,
    group,
    isExpanded,
    isLoading,
    entries,
    normalized,
    selectedDatabase,
    selectedTable,
    onToggle,
    onSelectObject,
    onOpenObject,
}: ObjectGroupProps) {
    const t = useTranslations('CatalogSchemaSidebar');

    return (
        <div className="space-y-1">
            <button
                type="button"
                onClick={onToggle}
                className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
                {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                )}
                <span>{`${group.label} (${entries.length})`}</span>
            </button>

            {isExpanded ? (
                <div className="ml-6 space-y-1">
                    {entries.length ? (
                        entries
                            .map(entry => ({ entry, value: resolveEntryValue(entry) }))
                            .filter((item): item is { entry: TargetOption; value: string } => Boolean(item.value))
                            .map(item => (
                                <ObjectItem
                                    key={`${scopeKey}-${group.key}-${item.value}`}
                                    dbName={dbName}
                                    entry={item.entry}
                                    icon={group.icon}
                                    selectedDatabase={selectedDatabase}
                                    selectedTable={selectedTable}
                                    onSelectObject={onSelectObject}
                                    onOpenObject={onOpenObject}
                                />
                            ))
                    ) : (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            {normalized ? t('No matching items') : group.emptyLabel}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}

function ObjectItem({
    dbName,
    entry,
    icon: Icon,
    selectedDatabase,
    selectedTable,
    onSelectObject,
    onOpenObject,
}: {
    dbName: string;
    entry: TargetOption;
    icon: LucideIcon;
    selectedDatabase?: string;
    selectedTable?: string;
    onSelectObject: (payload: { database: string; tableName: string; tabLabel?: string }) => void;
    onOpenObject: (payload: { database: string; tableName: string; tabLabel?: string }) => void;
}) {
    const entryValue = resolveEntryValue(entry);
    const entryLabel = resolveEntryLabel(entry);
    const isSelected = selectedTable === entryValue && selectedDatabase === dbName;

    return (
        <button
            type="button"
            className={cn(
                'flex w-full items-center gap-2 truncate rounded px-2 py-1 text-left text-sm',
                isSelected ? 'bg-primary/10 text-foreground ring-1 ring-primary/30' : 'text-muted-foreground hover:bg-muted/50',
            )}
            onClick={() =>
                onSelectObject({
                    database: dbName,
                    tableName: entryValue,
                    tabLabel: entryLabel,
                })
            }
            onDoubleClick={() =>
                onOpenObject({
                    database: dbName,
                    tableName: entryValue,
                    tabLabel: entryLabel,
                })
            }
            title={entryLabel}
        >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{entryLabel}</span>
        </button>
    );
}
