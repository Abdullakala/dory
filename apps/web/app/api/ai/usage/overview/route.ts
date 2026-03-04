import { withUserAndTeamHandler } from '@/app/api/utils/with-team-handler';

export const runtime = 'nodejs';

export const GET = withUserAndTeamHandler(async ({ req, db, teamId }) => {
    const from = req.nextUrl.searchParams.get('from');
    const to = req.nextUrl.searchParams.get('to');
    const feature = req.nextUrl.searchParams.get('feature');
    const userId = req.nextUrl.searchParams.get('userId');
    const model = req.nextUrl.searchParams.get('model');

    if (!db?.aiUsage) {
        throw new Error('AI usage repository not available');
    }

    const data = await db.aiUsage.getOverview({
        teamId,
        from,
        to,
        feature,
        userId,
        model,
    });

    return Response.json(data);
});
