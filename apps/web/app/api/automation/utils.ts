/**
 * Pure utility functions for the Automation API.
 * Kept free of framework imports (@/, Next.js) so they can be tested directly.
 */

/**
 * Resolves organization ID from headers (in priority order):
 * 1. x-organization-id header
 * 2. x-org-id header (shorthand)
 */
export function resolveOrganizationIdFromHeaders(headers: Headers): string | null {
    return headers.get('x-organization-id') ?? headers.get('x-org-id') ?? null;
}

/**
 * Classify a SQL statement by its leading keyword.
 */
export function parseSqlOp(s: string): string {
    const first = s.trim().split(/\s+/)[0]?.toUpperCase() || 'SQL';
    if (['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'REPLACE'].includes(first)) return first;
    if (['CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'RENAME'].includes(first)) return 'DDL';
    if (['BEGIN', 'START', 'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'RELEASE'].includes(first)) return 'TXN';
    return first;
}

/**
 * Check whether a SQL statement is read-only (safe for AI execution).
 */
export function isReadOnlyQuery(sql: string): boolean {
    return /^(select|show|describe|desc|explain|with)\b/i.test(sql.trim());
}

/** Maximum SQL statements per automation execute request. */
export const MAX_STATEMENTS = 100;

/** Maximum rows returned from AI SQL runner. */
export const AI_ROW_LIMIT = 200;
