'use client';

import { ChevronDown, ChevronRight, Layers, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ObjectGroup } from './catalog-object-group';
import { DEFAULT_GROUP_STATE } from './types';
import type { DatabaseObjects, GroupState, SchemaNode, TargetOption } from './types';
import type { GroupConfig } from './catalog-object-group';

type SchemaNodeRowProps = {
    dbName: string;
    schema: SchemaNode;
    scopeKey: string;
    isExpanded: boolean;
    expandedGroups: Record<string, GroupState>;
    groupConfigs: GroupConfig[];
    objects: DatabaseObjects;
    loadingState: GroupState;
    normalized: string;
    selectedDatabase?: string;
    selectedTable?: string;
    onToggleSchema: (database: string, schema: string) => void;
    onToggleGroup: (scopeKey: string, group: keyof GroupState) => void;
    onSelectObject: (payload: { database: string; tableName: string; tabLabel?: string }) => void;
    onOpenObject: (payload: { database: string; tableName: string; tabLabel?: string }) => void;
    filterEntries: (entries: TargetOption[]) => TargetOption[];
};

export function SchemaNodeRow({
    dbName,
    schema,
    scopeKey,
    isExpanded,
    expandedGroups,
    groupConfigs,
    objects,
    loadingState,
    normalized,
    selectedDatabase,
    selectedTable,
    onToggleSchema,
    onToggleGroup,
    onSelectObject,
    onOpenObject,
    filterEntries,
}: SchemaNodeRowProps) {
    const t = useTranslations('CatalogSchemaSidebar');
    const groupState = expandedGroups[scopeKey] ?? DEFAULT_GROUP_STATE;
    const isLoading = Object.values(loadingState).some(Boolean);

    return (
        <div className="space-y-1">
            <button
                type="button"
                onClick={() => onToggleSchema(dbName, schema.name)}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                aria-label={`${isExpanded ? t('Collapse') : t('Expand')} ${schema.label}`}
            >
                {isExpanded && isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                )}
                <Layers className="h-3.5 w-3.5" />
                <span className="truncate">{schema.label}</span>
            </button>

            {isExpanded ? (
                <div className="ml-6 space-y-1">
                    {!isLoading ? (
                        groupConfigs.map(group => (
                            <ObjectGroup
                                key={`${scopeKey}-${group.key}`}
                                scopeKey={scopeKey}
                                dbName={dbName}
                                group={group}
                                isExpanded={groupState[group.key]}
                                isLoading={loadingState[group.key]}
                                entries={normalized ? filterEntries(objects[group.key]) : objects[group.key]}
                                normalized={normalized}
                                selectedDatabase={selectedDatabase}
                                selectedTable={selectedTable}
                                onToggle={() => onToggleGroup(scopeKey, group.key)}
                                onSelectObject={onSelectObject}
                                onOpenObject={onOpenObject}
                            />
                        ))
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
