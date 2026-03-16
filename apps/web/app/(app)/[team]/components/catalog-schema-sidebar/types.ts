export type TargetOption = {
    label?: string;
    value?: string;
    name?: string;
    schema?: string;
    [key: string]: unknown;
};

export type GroupState = {
    tables: boolean;
    materializedViews: boolean;
    views: boolean;
    functions: boolean;
};

export type DatabaseObjects = {
    tables: TargetOption[];
    materializedViews: TargetOption[];
    views: TargetOption[];
    functions: TargetOption[];
};

export type SchemaNode = {
    name: string;
    label: string;
    system?: boolean;
};

export const DEFAULT_GROUP_STATE: GroupState = {
    tables: false,
    materializedViews: false,
    views: false,
    functions: false,
};

export const EMPTY_DATABASE_OBJECTS: DatabaseObjects = {
    tables: [],
    materializedViews: [],
    views: [],
    functions: [],
};
