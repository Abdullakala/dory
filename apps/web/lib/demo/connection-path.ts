export const DEMO_SQLITE_CONNECTION_PATH = 'dory://demo-sqlite';

export function isDemoSqliteConnectionPath(value: string | null | undefined): boolean {
    return value?.trim() === DEMO_SQLITE_CONNECTION_PATH;
}
