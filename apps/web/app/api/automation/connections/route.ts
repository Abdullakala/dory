import { NextResponse } from 'next/server';
import { ResponseUtil } from '@/lib/result';
import { withAutomationHandler } from '../with-automation-handler';
import { ensureDemoConnection } from '@/lib/demo/ensure-demo-connection';

/**
 * GET /api/automation/connections
 *
 * List all database connections for the organization.
 * Returns metadata only (no passwords or secrets).
 */
export const GET = withAutomationHandler(async ({ db, userId, organizationId }) => {
    let data = await db.connections.list(organizationId);

    if (data.length === 0) {
        try {
            await ensureDemoConnection(db, userId, organizationId);
            data = await db.connections.list(organizationId);
        } catch (err) {
            console.warn('[automation/connections] failed to create demo connection:', err);
        }
    }

    return NextResponse.json(ResponseUtil.success(data));
});
