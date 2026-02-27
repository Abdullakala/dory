import { getAuth } from '@/lib/auth';
import { schema } from '@/lib/database/schema';
import { getClient } from '@/lib/database/postgres/client';
import type { PostgresDBClient } from '@/types';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEEP_LINK = 'dory://auth-complete';
const TICKET_TTL_MS = 5 * 60 * 1000;

type TicketUser = {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    emailVerified: boolean;
    defaultTeamId?: string | null;
};

function normalizeCookieName(name: string): string[] {
    const baseName = name.replace(/^__Secure-/, '').replace(/^__Host-/, '');
    return Array.from(new Set([baseName, `__Secure-${baseName}`, `__Host-${baseName}`]));
}

function extractSessionTokenFromRequest(req: Request, cookieName: string): string | null {
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) return null;

    const cookieNames = normalizeCookieName(cookieName);
    for (const part of cookieHeader.split(';')) {
        const [rawName, ...rest] = part.split('=');
        const name = rawName?.trim();
        if (!name || !cookieNames.includes(name)) continue;
        const value = rest.join('=').trim();
        if (!value) return null;
        return decodeURIComponent(value);
    }

    return null;
}

function listRequestCookieNames(req: Request): string[] {
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) return [];

    return cookieHeader
        .split(';')
        .map(part => part.split('=')[0]?.trim())
        .filter((name): name is string => Boolean(name));
}

function getSetCookies(headers: Headers): string[] {
    const anyHeaders = headers as unknown as { getSetCookie?: () => string[] };
    if (typeof anyHeaders.getSetCookie === 'function') {
        return anyHeaders.getSetCookie();
    }

    const raw = headers.get('set-cookie');
    if (!raw) return [];
    return [raw];
}

function readCookieValueFromSetCookie(setCookie: string, name: string): string | null {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = setCookie.match(new RegExp(`^${escapedName}=([^;]+)`));
    return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function extractSessionTokenFromSetCookieHeaders(headers: Headers, cookieName: string): string | null {
    const cookieNames = normalizeCookieName(cookieName);
    for (const cookie of getSetCookies(headers)) {
        for (const name of cookieNames) {
            const value = readCookieValueFromSetCookie(cookie, name);
            if (value) return value;
        }
    }
    return null;
}

function buildDeepLinkUrl(params: Record<string, string | undefined | null>) {
    const deepLinkUrl = new URL(DEEP_LINK);
    for (const [key, value] of Object.entries(params)) {
        if (value) {
            deepLinkUrl.searchParams.set(key, value);
        }
    }
    return deepLinkUrl.toString();
}

function createDeepLinkResponse(deepLinkUrl: string) {
    return new NextResponse(
        `
      <html>
        <body>
          <script>
            window.location.href = ${JSON.stringify(deepLinkUrl)};
          </script>
        </body>
      </html>
    `,
        { headers: { 'Content-Type': 'text/html' } },
    );
}

async function createTicket(auth: Awaited<ReturnType<typeof getAuth>>, payload: { user: TicketUser }) {
    const ctx = await auth.$context;
    const ticket = `electron-${randomUUID()}`;
    const verification = await ctx.internalAdapter.createVerificationValue({
        value: JSON.stringify(payload),
        identifier: ticket,
        expiresAt: new Date(Date.now() + TICKET_TTL_MS),
    });

    if (!verification) {
        throw new Error('failed_to_create_ticket');
    }

    return ticket;
}

export async function GET(req: Request) {
    const url = new URL(req.url);
    const error = url.searchParams.get('error');
    if (error) {
        const deepLinkUrl = buildDeepLinkUrl({
            error,
            error_description: url.searchParams.get('error_description') ?? undefined,
        });
        return createDeepLinkResponse(deepLinkUrl);
    }

    const auth = await getAuth();
    const ctx = await auth.$context;
    console.log('[electron-auth][finalize] request summary', {
        hasCode: Boolean(url.searchParams.get('code')),
        hasState: Boolean(url.searchParams.get('state')),
        cookieNames: listRequestCookieNames(req),
        sessionCookieName: ctx.authCookies.sessionToken.name,
    });

    let sessionToken = extractSessionTokenFromRequest(req, ctx.authCookies.sessionToken.name);
    if (!sessionToken && url.searchParams.get('code') && url.searchParams.get('state')) {
        const response = await auth.api.callbackOAuth({
            headers: req.headers,
            params: { id: 'github' },
            query: Object.fromEntries(url.searchParams),
            asResponse: true,
        });
        sessionToken = extractSessionTokenFromSetCookieHeaders(response.headers ?? new Headers(), ctx.authCookies.sessionToken.name);
    }

    if (!sessionToken) {
        return NextResponse.json({ error: 'missing_session_cookie' }, { status: 401 });
    }

    const session = await ctx.internalAdapter.findSession(sessionToken);
    if (!session) {
        return NextResponse.json({ error: 'missing_session' }, { status: 401 });
    }

    const db = (await getClient()) as PostgresDBClient;
    const [dbUser] = await db.select().from(schema.user).where(eq(schema.user.id, session.user.id));
    const user = {
        id: dbUser?.id ?? session.user.id,
        email: dbUser?.email ?? session.user.email ?? null,
        name: dbUser?.name ?? session.user.name ?? null,
        image: dbUser?.image ?? session.user.image ?? null,
        emailVerified: dbUser?.emailVerified ?? session.user.emailVerified ?? false,
        defaultTeamId: dbUser?.defaultTeamId ?? (session.user as TicketUser).defaultTeamId ?? null,
    } satisfies TicketUser;
    const ticket = await createTicket(auth, { user });
    const deepLinkUrl = buildDeepLinkUrl({ ticket });

    return createDeepLinkResponse(deepLinkUrl);
}
