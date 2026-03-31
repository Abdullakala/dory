import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Automation API (/api/automation/*).
 *
 * These tests run against a live Dory instance.
 * They use direct HTTP requests (not browser context) to bypass
 * any client-side rendering issues with the auth setup.
 */

// Skip the browser-based auth setup — we authenticate via API directly.
test.use({ storageState: { cookies: [], origins: [] } });

let sessionCookie: string;
let organizationId: string;
let connectionId: string | null = null;

test.describe.serial('Automation API', () => {
    test('authenticate demo user via API', async ({ request }) => {
        const demoRes = await request.post('/api/auth/demo', {
            headers: { 'Content-Type': 'application/json' },
        });
        expect(demoRes.ok()).toBeTruthy();

        const setCookie = demoRes.headers()['set-cookie'] ?? '';
        const match = setCookie.match(/better-auth\.session_token=([^;]+)/);
        expect(match, 'should receive session cookie').toBeTruthy();
        sessionCookie = `better-auth.session_token=${match![1]}`;

        // Resolve organization ID from session
        const sessionRes = await request.get('/api/auth/get-session', {
            headers: { Cookie: sessionCookie },
        });
        expect(sessionRes.ok()).toBeTruthy();
        const session = await sessionRes.json();
        organizationId = session?.session?.activeOrganizationId;
        expect(organizationId, 'should have an active organization').toBeTruthy();
    });

    test('returns 400 without x-organization-id header', async ({ request }) => {
        const res = await request.get('/api/automation/connections', {
            headers: { Cookie: sessionCookie },
        });
        expect(res.status()).toBe(400);
        const body = await res.json();
        expect(body?.message).toContain('organization');
    });

    test('returns 403 for wrong organization', async ({ request }) => {
        const res = await request.get('/api/automation/connections', {
            headers: {
                Cookie: sessionCookie,
                'x-organization-id': 'nonexistent-org-id',
            },
        });
        expect(res.status()).toBe(403);
    });

    test('GET /api/automation/connections lists connections', async ({ request }) => {
        const res = await request.get('/api/automation/connections', {
            headers: {
                Cookie: sessionCookie,
                'x-organization-id': organizationId,
            },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body?.code).toBe(0);

        const connections = body?.data;
        expect(Array.isArray(connections)).toBe(true);

        if (connections.length > 0) {
            const conn = connections[0];
            expect(conn?.connection?.id).toBeTruthy();
            connectionId = conn.connection.id;
        }
    });

    test('GET /api/automation/schema returns 400 without connectionId', async ({ request }) => {
        const res = await request.get('/api/automation/schema', {
            headers: {
                Cookie: sessionCookie,
                'x-organization-id': organizationId,
            },
        });
        expect(res.status()).toBe(400);
        const body = await res.json();
        expect(body?.message).toContain('connectionId');
    });

    test('POST /api/automation/query/execute returns 400 without connectionId', async ({ request }) => {
        const res = await request.post('/api/automation/query/execute', {
            headers: {
                Cookie: sessionCookie,
                'x-organization-id': organizationId,
                'Content-Type': 'application/json',
            },
            data: { sql: 'SELECT 1' },
        });
        expect(res.status()).toBe(400);
        const body = await res.json();
        expect(body?.message).toContain('connectionId');
    });

    test('POST /api/automation/query/execute returns 400 without sql', async ({ request }) => {
        test.skip(!connectionId, 'no connection available');

        const res = await request.post('/api/automation/query/execute', {
            headers: {
                Cookie: sessionCookie,
                'x-organization-id': organizationId,
                'Content-Type': 'application/json',
            },
            data: { connectionId },
        });
        expect(res.status()).toBe(400);
        const body = await res.json();
        expect(body?.message).toContain('sql');
    });

    test('POST /api/automation/query/execute runs SQL', async ({ request }) => {
        test.skip(!connectionId, 'no connection available');

        const res = await request.post('/api/automation/query/execute', {
            headers: {
                Cookie: sessionCookie,
                'x-organization-id': organizationId,
                'Content-Type': 'application/json',
            },
            data: { connectionId, sql: 'SELECT 1 AS value' },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body?.code).toBe(0);
        expect(body?.data?.results?.length).toBe(1);
        expect(body?.data?.results?.[0]?.ok).toBe(true);
        expect(body?.data?.results?.[0]?.rows?.length).toBeGreaterThan(0);
        expect(body?.data?.summary?.successful).toBe(1);
        expect(body?.data?.summary?.failed).toBe(0);
    });

    test('POST /api/automation/query/execute handles multi-statement SQL', async ({ request }) => {
        test.skip(!connectionId, 'no connection available');

        const res = await request.post('/api/automation/query/execute', {
            headers: {
                Cookie: sessionCookie,
                'x-organization-id': organizationId,
                'Content-Type': 'application/json',
            },
            data: { connectionId, sql: 'SELECT 1 AS a; SELECT 2 AS b' },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body?.data?.results?.length).toBe(2);
        expect(body?.data?.summary?.totalStatements).toBe(2);
        expect(body?.data?.summary?.successful).toBe(2);
    });

    test('POST /api/automation/query/execute stopOnError stops at first failure', async ({ request }) => {
        test.skip(!connectionId, 'no connection available');

        const res = await request.post('/api/automation/query/execute', {
            headers: {
                Cookie: sessionCookie,
                'x-organization-id': organizationId,
                'Content-Type': 'application/json',
            },
            data: {
                connectionId,
                sql: 'SELECT * FROM nonexistent_table_xyz; SELECT 1 AS value',
                stopOnError: true,
            },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body?.data?.results?.length).toBe(1);
        expect(body?.data?.results?.[0]?.ok).toBe(false);
        expect(body?.data?.summary?.failed).toBe(1);
    });
});
