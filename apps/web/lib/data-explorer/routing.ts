import {
    type DataExplorerDriver,
    type ExplorerListKind,
    type ExplorerObjectKind,
    driverSupportsSchema,
    getDriverCapabilities,
    isSupportedListKind,
    isSupportedObjectKind,
} from './capabilities';

export type ExplorerBaseParams = {
    team: string;
    connectionId: string;
};

export type ExplorerDatabaseResource = {
    kind: 'database';
    database: string;
};

export type ExplorerSchemaResource = {
    kind: 'schema';
    database: string;
    schema: string;
};

export type ExplorerListResource = {
    kind: 'list';
    database: string;
    schema?: string;
    listKind: ExplorerListKind;
};

export type ExplorerObjectResource = {
    kind: 'object';
    database: string;
    schema?: string;
    objectKind: Exclude<ExplorerObjectKind, 'database' | 'schema'>;
    name: string;
};

export type ExplorerResource = ExplorerDatabaseResource | ExplorerSchemaResource | ExplorerListResource | ExplorerObjectResource;

export type BreadcrumbItem = {
    label: string;
    href: string;
};

const DEFAULT_EXPLORER_CATALOG = 'default';

function e(value: string): string {
    return encodeURIComponent(value);
}

function decode(value: string | undefined): string | undefined {
    if (!value) return undefined;
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export function buildExplorerBasePath(params: ExplorerBaseParams): string {
    return `/${e(params.team)}/${e(params.connectionId)}/explorer/catalog/${e(DEFAULT_EXPLORER_CATALOG)}`;
}

export function buildExplorerPath(params: ExplorerBaseParams, resource?: ExplorerResource): string {
    const base = buildExplorerBasePath(params);

    if (!resource) return base;

    switch (resource.kind) {
        case 'database':
            return `${base}/database/${e(resource.database)}`;

        case 'schema':
            return `${base}/database/${e(resource.database)}/schema/${e(resource.schema)}`;

        case 'list': {
            if (resource.schema) {
                return `${base}/database/${e(resource.database)}/schema/${e(resource.schema)}/${e(resource.listKind)}`;
            }
            return `${base}/database/${e(resource.database)}/${e(resource.listKind)}`;
        }

        case 'object': {
            if (resource.schema) {
                return `${base}/database/${e(resource.database)}/schema/${e(resource.schema)}/${e(resource.objectKind)}/${e(resource.name)}`;
            }
            return `${base}/database/${e(resource.database)}/${e(resource.objectKind)}/${e(resource.name)}`;
        }
    }
}

export function buildExplorerDatabasePath(params: ExplorerBaseParams, database: string): string {
    return buildExplorerPath(params, {
        kind: 'database',
        database,
    });
}

export function buildExplorerSchemaPath(params: ExplorerBaseParams, database: string, schema: string): string {
    return buildExplorerPath(params, {
        kind: 'schema',
        database,
        schema,
    });
}

export function buildExplorerListPath(
    params: ExplorerBaseParams,
    options: {
        database: string;
        schema?: string;
        listKind: ExplorerListKind;
    },
): string {
    return buildExplorerPath(params, {
        kind: 'list',
        database: options.database,
        schema: options.schema,
        listKind: options.listKind,
    });
}

export function buildExplorerObjectPath(
    params: ExplorerBaseParams,
    options: {
        database: string;
        schema?: string;
        objectKind: Exclude<ExplorerObjectKind, 'database' | 'schema'>;
        name: string;
    },
): string {
    return buildExplorerPath(params, {
        kind: 'object',
        database: options.database,
        schema: options.schema,
        objectKind: options.objectKind,
        name: options.name,
    });
}

export type ParsedExplorerPath = {
    resource?: ExplorerResource;
    segments: string[];
};

export function parseExplorerPathSegments(segments: string[]): ParsedExplorerPath {
    const safe = segments.filter(Boolean).map(item => decode(item) ?? item);
    const pathSegments = safe[0] === 'catalog' && safe[1] ? safe.slice(2) : safe;

    if (pathSegments.length === 0) {
        return { segments: safe };
    }

    // /database/:database
    if (pathSegments[0] === 'database' && pathSegments[1] && pathSegments.length === 2) {
        return {
            segments: safe,
            resource: {
                kind: 'database',
                database: pathSegments[1],
            },
        };
    }

    // /database/:database/schema/:schema
    if (pathSegments[0] === 'database' && pathSegments[1] && pathSegments[2] === 'schema' && pathSegments[3] && pathSegments.length === 4) {
        return {
            segments: safe,
            resource: {
                kind: 'schema',
                database: pathSegments[1],
                schema: pathSegments[3],
            },
        };
    }

    // /database/:database/:listKind
    if (pathSegments[0] === 'database' && pathSegments[1] && pathSegments[2] && pathSegments.length === 3) {
        const listKind = pathSegments[2];
        return {
            segments: safe,
            resource: {
                kind: 'list',
                database: pathSegments[1],
                listKind: listKind as ExplorerListKind,
            },
        };
    }

    // /database/:database/:objectKind/:name
    if (pathSegments[0] === 'database' && pathSegments[1] && pathSegments[2] && pathSegments[3] && pathSegments.length === 4) {
        const objectKind = pathSegments[2];
        return {
            segments: safe,
            resource: {
                kind: 'object',
                database: pathSegments[1],
                objectKind: objectKind as Exclude<ExplorerObjectKind, 'database' | 'schema'>,
                name: pathSegments[3],
            },
        };
    }

    // /database/:database/schema/:schema/:listKind
    if (pathSegments[0] === 'database' && pathSegments[1] && pathSegments[2] === 'schema' && pathSegments[3] && pathSegments[4] && pathSegments.length === 5) {
        const listKind = pathSegments[4];
        return {
            segments: safe,
            resource: {
                kind: 'list',
                database: pathSegments[1],
                schema: pathSegments[3],
                listKind: listKind as ExplorerListKind,
            },
        };
    }

    // /database/:database/schema/:schema/:objectKind/:name
    if (pathSegments[0] === 'database' && pathSegments[1] && pathSegments[2] === 'schema' && pathSegments[3] && pathSegments[4] && pathSegments[5] && pathSegments.length === 6) {
        const objectKind = pathSegments[4];
        return {
            segments: safe,
            resource: {
                kind: 'object',
                database: pathSegments[1],
                schema: pathSegments[3],
                objectKind: objectKind as Exclude<ExplorerObjectKind, 'database' | 'schema'>,
                name: pathSegments[5],
            },
        };
    }

    return { segments: safe };
}

/**
 * 用于 Next.js catch-all params，例如:
 * params.slug = ['database', 'pagila', 'schema', 'public', 'table', 'actor']
 */
export function parseExplorerPathFromSlug(slug: string[] | undefined): ParsedExplorerPath {
    return parseExplorerPathSegments(slug ?? []);
}

/**
 * 校验当前 resource 是否符合当前 driver 能力
 */
export function isValidExplorerResourceForDriver(driver: DataExplorerDriver | string | undefined | null, resource: ExplorerResource | undefined): boolean {
    if (!resource) return true;

    const capabilities = getDriverCapabilities(driver);

    switch (resource.kind) {
        case 'database':
            return capabilities.supportsDatabase;

        case 'schema':
            return capabilities.supportsSchema;

        case 'list':
            if (resource.schema && !capabilities.supportsSchema) return false;
            return isSupportedListKind(driver, resource.listKind);

        case 'object':
            if (resource.schema && !capabilities.supportsSchema) return false;
            return isSupportedObjectKind(driver, resource.objectKind);
    }
}

export function normalizeExplorerResourceForDriver(driver: DataExplorerDriver | string | undefined | null, resource: ExplorerResource): ExplorerResource {
    const supportsSchema = driverSupportsSchema(driver);

    if (!supportsSchema) {
        if (resource.kind === 'schema') {
            return {
                kind: 'database',
                database: resource.database,
            };
        }

        if (resource.kind === 'list') {
            return {
                ...resource,
                schema: undefined,
            };
        }

        if (resource.kind === 'object') {
            return {
                ...resource,
                schema: undefined,
            };
        }
    }

    return resource;
}

export function buildExplorerBreadcrumbs(params: ExplorerBaseParams, resource?: ExplorerResource): BreadcrumbItem[] {
    const items: BreadcrumbItem[] = [
        {
            label: 'Explorer',
            href: buildExplorerBasePath(params),
        },
    ];

    if (!resource) return items;

    items.push({
        label: resource.database,
        href: buildExplorerDatabasePath(params, resource.database),
    });

    if (resource.kind === 'database') {
        return items;
    }

    if ('schema' in resource && resource.schema) {
        items.push({
            label: resource.schema,
            href: buildExplorerSchemaPath(params, resource.database, resource.schema),
        });
    }

    if (resource.kind === 'schema') {
        return items;
    }

    if (resource.kind === 'list') {
        items.push({
            label: formatListKindLabel(resource.listKind),
            href: buildExplorerListPath(params, {
                database: resource.database,
                schema: resource.schema,
                listKind: resource.listKind,
            }),
        });
        return items;
    }

    if (resource.kind === 'object') {
        items.push({
            label: formatObjectKindLabel(resource.objectKind),
            href: '#',
        });
        items.push({
            label: resource.name,
            href: buildExplorerObjectPath(params, {
                database: resource.database,
                schema: resource.schema,
                objectKind: resource.objectKind,
                name: resource.name,
            }),
        });
    }

    return items;
}

export function formatListKindLabel(kind: ExplorerListKind): string {
    switch (kind) {
        case 'tables':
            return 'Tables';
        case 'views':
            return 'Views';
        case 'materializedViews':
            return 'Materialized Views';
        case 'functions':
            return 'Functions';
        case 'sequences':
            return 'Sequences';
        case 'dictionaries':
            return 'Dictionaries';
        case 'procedures':
            return 'Procedures';
        case 'schemas':
            return 'Schemas';
        default:
            return kind;
    }
}

export function formatObjectKindLabel(kind: Exclude<ExplorerObjectKind, 'database' | 'schema'>): string {
    switch (kind) {
        case 'table':
            return 'Table';
        case 'view':
            return 'View';
        case 'materializedView':
            return 'Materialized View';
        case 'function':
            return 'Function';
        case 'sequence':
            return 'Sequence';
        case 'dictionary':
            return 'Dictionary';
        case 'procedure':
            return 'Procedure';
        default:
            return kind;
    }
}
