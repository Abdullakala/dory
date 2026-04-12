'use client';

import { useEffect, useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useDatabases } from '@/hooks/use-databases';
import { useSchemas } from '@/hooks/use-schemas';
import { activeDatabaseAtom, activeSchemaAtom, currentConnectionAtom } from '@/shared/stores/app.store';
import { DatabaseSelect } from '../../../components/sql-console-sidebar/database-select';
import { SchemaSelect } from '../../../components/sql-console-sidebar/schema-select';
import { getSidebarConfig } from '../../../components/sql-console-sidebar/sidebar-config';
import { getInitialDatabase, isHiddenDatabase, normalizeOption } from '../../../components/sql-console-sidebar/utils';
import type { SidebarOption } from '../../../components/sql-console-sidebar/types';

type DatabaseSchemaSelectProps = {
    className?: string;
    onDatabaseChange?: (database: string) => void;
    onSchemaChange?: (schema: string) => void;
};

export function DatabaseSchemaSelect({ className, onDatabaseChange, onSchemaChange }: DatabaseSchemaSelectProps) {
    const [activeDatabase, setActiveDatabase] = useAtom(activeDatabaseAtom);
    const [activeSchema, setActiveSchema] = useAtom(activeSchemaAtom);
    const currentConnection = useAtomValue(currentConnectionAtom);
    const { databases } = useDatabases();
    const sidebarConfig = useMemo(() => getSidebarConfig(currentConnection?.connection?.type), [currentConnection?.connection?.type]);
    const { schemas } = useSchemas(activeDatabase, sidebarConfig.supportsSchemas);

    const databaseOptions = useMemo(
        () =>
            (databases ?? [])
                .map(database => normalizeOption(database))
                .filter((database): database is SidebarOption => Boolean(database))
                .filter(database => !isHiddenDatabase(database.value, sidebarConfig)),
        [databases, sidebarConfig],
    );

    useEffect(() => {
        if (!databaseOptions.length) return;

        const initialDatabase = getInitialDatabase(databaseOptions, currentConnection?.connection?.database);
        if (!initialDatabase) return;

        const hasActiveDatabase = activeDatabase && databaseOptions.some(database => database.value === activeDatabase);
        if (hasActiveDatabase) return;

        setActiveDatabase(initialDatabase);
        onDatabaseChange?.(initialDatabase);
    }, [activeDatabase, currentConnection?.connection?.database, databaseOptions, onDatabaseChange, setActiveDatabase]);

    const schemaOptions = useMemo(() => schemas.toSorted((left, right) => left.label.localeCompare(right.label)), [schemas]);

    useEffect(() => {
        if (!sidebarConfig.supportsSchemas) {
            if (!activeSchema) return;
            setActiveSchema('');
            onSchemaChange?.('');
            return;
        }

        if (!activeDatabase) {
            if (!activeSchema) return;
            setActiveSchema('');
            onSchemaChange?.('');
            return;
        }

        if (schemaOptions.length === 0) {
            if (!activeSchema) return;
            setActiveSchema('');
            onSchemaChange?.('');
            return;
        }

        if (activeSchema && schemaOptions.some(schema => schema.value === activeSchema)) {
            return;
        }

        const defaultSchema = schemaOptions.find(schema => schema.value === sidebarConfig.defaultSchemaName)?.value ?? schemaOptions[0]?.value ?? '';
        setActiveSchema(defaultSchema);
        onSchemaChange?.(defaultSchema);
    }, [activeDatabase, activeSchema, onSchemaChange, schemaOptions, setActiveSchema, sidebarConfig.defaultSchemaName, sidebarConfig.supportsSchemas]);

    const handleDatabaseChange = (database: string) => {
        setActiveDatabase(database);
        setActiveSchema('');
        onDatabaseChange?.(database);
        onSchemaChange?.('');
    };

    const handleSchemaChange = (schema: string) => {
        setActiveSchema(schema);
        onSchemaChange?.(schema);
    };

    const selectClassName = 'w-44 border-0 shadow-none text-xs outline-0 focus-visible:ring-0';

    return (
        <div className={className ?? 'flex items-center gap-2'}>
            <DatabaseSelect className={selectClassName} value={activeDatabase} databases={databaseOptions} onChange={handleDatabaseChange} />

            {sidebarConfig.supportsSchemas && schemaOptions.length > 0 ? (
                <SchemaSelect className={selectClassName} value={activeSchema} schemas={schemaOptions} onChange={handleSchemaChange} />
            ) : null}
        </div>
    );
}
