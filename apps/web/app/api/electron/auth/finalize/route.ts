import { getAuth } from '@/lib/auth';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEEP_LINK = 'dory://auth-complete';
const TICKET_TTL_MS = 5 * 60 * 1000;

function readCookieValue(cookieHeader: string, name: string): string | null {
    const parts = cookieHeader.split(';').map(part => part.trim());
    for (const part of parts) {
        if (!part.startsWith(`${name}=`)) continue;
        const value = part.slice(name.length + 1);
        return value ? decodeURIComponent(value) : null;
    }
    return null;
}

function normalizeCookieName(name: string): string[] {
    const names = [name];
    if (name.startsWith('__Secure-')) names.push(name.replace(/^__Secure-/, ''));
    if (name.startsWith('__Host-')) names.push(name.replace(/^__Host-/, ''));
    return Array.from(new Set(names));
}

function extractSessionTokenFromRequest(req: Request, cookieName: string): string | null {
    const cookieHeader = req.headers.get('cookie') ?? '';
    if (!cookieHeader) return null;

    for (const name of normalizeCookieName(cookieName)) {
        const value = readCookieValue(cookieHeader, name);
        if (value) return value;
    }

    return null;
}

async function createTicket(auth: Awaited<ReturnType<typeof getAuth>>, sessionToken: string) {
    const ctx = await auth.$context;
    const ticket = `electron-${randomUUID()}`;
    const verification = await ctx.internalAdapter.createVerificationValue({
        value: JSON.stringify({ sessionToken }),
        identifier: ticket,
        expiresAt: new Date(Date.now() + TICKET_TTL_MS),
    });

    if (!verification) {
        throw new Error('failed_to_create_ticket');
    }

    return ticket;
}

export async function GET(req: Request) {
    const auth = await getAuth();

    const ctx = await auth.$context;
    const sessionToken = extractSessionTokenFromRequest(req, ctx.authCookies.sessionToken.name);
    if (!sessionToken) {
        return NextResponse.json({ error: 'missing_session_cookie' }, { status: 401 });
    }

    const ticket = await createTicket(auth, sessionToken);
    const deepLinkUrl = new URL(DEEP_LINK);
    deepLinkUrl.searchParams.set('ticket', ticket);

    const res = new NextResponse(
        `
      <html>
        <body>
          <script>
            window.location.href = "${deepLinkUrl.toString()}";
          </script>
        </body>
      </html>
    `,
        { headers: { 'Content-Type': 'text/html' } },
    );

    return res;
}
