import { getDBService } from '@/lib/database';
import { shouldProxyAuthRequest } from '@/lib/auth/auth-proxy';
import { getSessionFromRequest } from '@/lib/auth/session';

export async function getTeamBySlugOrId(slugOrId: string, userId: string) {
    const db = await getDBService();
    if (!db) throw new Error('Database service not initialized');

    if (shouldProxyAuthRequest()) {
        const session = await getSessionFromRequest();
        const defaultTeamId = session?.user?.defaultTeamId ?? null;

        if (!defaultTeamId || slugOrId !== defaultTeamId) {
            return null;
        }

        const team = await db.teams.getTeamBySlugOrId(defaultTeamId);
        return team ?? ({ id: defaultTeamId, slug: defaultTeamId, name: defaultTeamId } as any);
    }

    const team = await db.teams.getTeamBySlugOrId(slugOrId);
    if (!team) {
        return null;
    }

    const member = await db.teams.isUserInTeam(userId, team.id);
    if (!member) {
        return null;
    }

    return team;
}
