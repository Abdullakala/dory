import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ResponseUtil } from '@/lib/result';
import { withUserAndTeamHandler } from '../../../utils/with-team-handler';
import { handleApiError } from '../../../utils/handle-error';
import { parseJsonBody } from '../../../utils/parse-json';

const reorderSchema = z.object({
    orderedIds: z.array(z.string().min(1)).min(1).max(50),
});

// POST /api/sql-console/saved-query-folders/reorder
export const POST = withUserAndTeamHandler(async ({ req, db, teamId, userId }) => {
    try {
        const payload = await parseJsonBody(req, reorderSchema);
        await db.savedQueryFolders.reorder({
            teamId,
            userId,
            orderedIds: payload.orderedIds,
        });
        return NextResponse.json(ResponseUtil.success({ reordered: true }));
    } catch (err: any) {
        return handleApiError(err);
    }
});
