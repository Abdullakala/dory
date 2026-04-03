import path from 'node:path';
import fs from 'node:fs';
import { DEMO_SQLITE_CONNECTION_PATH, isDemoSqliteConnectionPath } from './connection-path';

const DEMO_SQLITE_FILENAME = 'demo.sqlite';
const DEMO_SQLITE_DIR = path.join('public', 'resources');
const DEMO_SQLITE_RELATIVE_PATH = path.join(DEMO_SQLITE_DIR, DEMO_SQLITE_FILENAME);

function getDemoSqlitePathCandidates(): string[] {
    return [
        path.resolve(process.cwd(), DEMO_SQLITE_RELATIVE_PATH),
        path.resolve(process.cwd(), 'apps', 'web', DEMO_SQLITE_RELATIVE_PATH),
    ];
}

/**
 * Resolve the absolute path for the bundled demo SQLite file.
 * The file is treated as a fixed app resource rather than a generated runtime artifact.
 */
export function resolveDemoSqlitePath(): string {
    const existingPath = getDemoSqlitePathCandidates().find(candidate => fs.existsSync(candidate));

    if (existingPath) {
        return existingPath;
    }

    // Fall back to the primary monorepo layout for callers that want a deterministic path
    // even before the file has been created or copied into place.
    return path.resolve(process.cwd(), 'apps', 'web', DEMO_SQLITE_RELATIVE_PATH);
}

export function resolveStoredSqlitePath(value: string | null | undefined): string | undefined {
    const normalized = value?.trim();
    if (!normalized) return undefined;
    if (isDemoSqliteConnectionPath(normalized)) {
        return resolveDemoSqlitePath();
    }
    return normalized;
}

/**
 * Get the fixed absolute path for demo.sqlite.
 */
export function getDemoSqlitePath(): string | undefined {
    return resolveDemoSqlitePath();
}
