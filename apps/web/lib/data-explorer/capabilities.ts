export type DataExplorerDriver = 'postgres' | 'clickhouse' | 'mysql' | 'doris' | 'duckdb' | 'sqlite';

export type ExplorerObjectKind =
  | 'database'
  | 'schema'
  | 'table'
  | 'view'
  | 'materializedView'
  | 'function'
  | 'sequence'
  | 'dictionary'
  | 'procedure';

export type ExplorerListKind =
  | 'tables'
  | 'views'
  | 'materializedViews'
  | 'functions'
  | 'sequences'
  | 'dictionaries'
  | 'procedures'
  | 'schemas';

export type DriverCapabilities = {
  driver: DataExplorerDriver;
  supportsSchema: boolean;
  supportsDatabase: boolean;
  listKinds: ExplorerListKind[];
  objectKinds: ExplorerObjectKind[];
};

export const DATA_EXPLORER_CAPABILITIES: Record<DataExplorerDriver, DriverCapabilities> = {
  postgres: {
    driver: 'postgres',
    supportsSchema: true,
    supportsDatabase: true,
    listKinds: ['schemas', 'tables', 'views', 'materializedViews', 'functions', 'sequences'],
    objectKinds: ['database', 'schema', 'table', 'view', 'materializedView', 'function', 'sequence'],
  },

  clickhouse: {
    driver: 'clickhouse',
    supportsSchema: false,
    supportsDatabase: true,
    listKinds: ['tables', 'views', 'materializedViews', 'dictionaries'],
    objectKinds: ['database', 'table', 'view', 'materializedView', 'dictionary'],
  },

  mysql: {
    driver: 'mysql',
    supportsSchema: false,
    supportsDatabase: true,
    listKinds: ['tables', 'views', 'functions', 'procedures'],
    objectKinds: ['database', 'table', 'view', 'function', 'procedure'],
  },

  doris: {
    driver: 'doris',
    supportsSchema: false,
    supportsDatabase: true,
    listKinds: ['tables', 'views', 'materializedViews'],
    objectKinds: ['database', 'table', 'view', 'materializedView'],
  },

  duckdb: {
    driver: 'duckdb',
    supportsSchema: true,
    supportsDatabase: true,
    listKinds: ['schemas', 'tables', 'views', 'functions', 'sequences'],
    objectKinds: ['database', 'schema', 'table', 'view', 'function', 'sequence'],
  },

  sqlite: {
    driver: 'sqlite',
    supportsSchema: false,
    supportsDatabase: false,
    listKinds: ['tables', 'views'],
    objectKinds: ['table', 'view'],
  },
};

export function getDriverCapabilities(driver: string | undefined | null): DriverCapabilities {
  if (!driver) {
    return DATA_EXPLORER_CAPABILITIES.postgres;
  }

  const normalized = driver.toLowerCase() as DataExplorerDriver;
  return DATA_EXPLORER_CAPABILITIES[normalized] ?? DATA_EXPLORER_CAPABILITIES.postgres;
}

export function driverSupportsSchema(driver: string | undefined | null): boolean {
  return getDriverCapabilities(driver).supportsSchema;
}

export function isSupportedListKind(
  driver: string | undefined | null,
  listKind: string | undefined | null,
): listKind is ExplorerListKind {
  if (!listKind) return false;
  return getDriverCapabilities(driver).listKinds.includes(listKind as ExplorerListKind);
}

export function isSupportedObjectKind(
  driver: string | undefined | null,
  objectKind: string | undefined | null,
): objectKind is ExplorerObjectKind {
  if (!objectKind) return false;
  return getDriverCapabilities(driver).objectKinds.includes(objectKind as ExplorerObjectKind);
}