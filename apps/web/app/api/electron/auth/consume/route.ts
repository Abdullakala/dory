import { getAuth } from '@/lib/auth';
import { serializeSignedCookie } from 'better-call';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
    ticket: z.string().min(1),
});

function getCloudApiBaseUrl(): string | null {
    const cloudUrl = process.env.DORY_CLOUD_API_URL ?? process.env.NEXT_PUBLIC_DORY_CLOUD_API_URL;
    if (typeof cloudUrl !== 'string' || !cloudUrl.trim()) return null;
    return cloudUrl.trim();
}

async function consumeTicketFromCloud(ticket: string) {
    const baseUrl = getCloudApiBaseUrl();
    if (!baseUrl) {
        return NextResponse.json({ error: 'cloud_api_not_configured' }, { status: 500 });
    }

    const targetUrl = new URL('/api/electron/auth/consume', baseUrl).toString();
    const upstream = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket }),
    });

    if (!upstream.ok) {
        const data = await upstream.json().catch(() => null);
        return NextResponse.json({ error: data?.error ?? 'ticket_exchange_failed' }, { status: upstream.status });
    }

    const data = (await upstream.json().catch(() => null)) as { sessionToken?: string } | null;
    const sessionToken = data?.sessionToken;
    if (!sessionToken) {
        return NextResponse.json({ error: 'missing_session_token' }, { status: 500 });
    }

    const auth = await getAuth();
    const ctx = await auth.$context;
    const maxAge = ctx.sessionConfig?.expiresIn ?? ctx.options.session?.expiresIn;
    const baseAttrs = ctx.authCookies.sessionToken.attributes;
    const adjustedAttrs = {
        ...baseAttrs,
        ...(maxAge ? { maxAge } : {}),
        ...(baseAttrs.secure ? { secure: false } : {}),
        ...(String(baseAttrs.sameSite).toLowerCase() === 'none' ? { sameSite: 'lax' as const } : {}),
    };
    const cookie = await serializeSignedCookie(ctx.authCookies.sessionToken.name, sessionToken, ctx.secret, adjustedAttrs);

    const res = NextResponse.json({ ok: true });
    res.headers.append('set-cookie', cookie);
    return res;
}

async function consumeTicketLocally(ticket: string) {
    const auth = await getAuth();
    const ctx = await auth.$context;

    const verification = await ctx.internalAdapter.findVerificationValue(ticket);
    if (!verification) {
        return NextResponse.json({ error: 'invalid_ticket' }, { status: 401 });
    }

    if (verification.expiresAt < new Date()) {
        await ctx.internalAdapter.deleteVerificationValue(verification.id);
        return NextResponse.json({ error: 'ticket_expired' }, { status: 401 });
    }

    let parsed: { sessionToken?: string } | null = null;
    try {
        parsed = JSON.parse(verification.value) as { sessionToken?: string };
    } catch {
        parsed = null;
    }

    const sessionToken = parsed?.sessionToken;
    if (!sessionToken) {
        await ctx.internalAdapter.deleteVerificationValue(verification.id);
        return NextResponse.json({ error: 'invalid_ticket_payload' }, { status: 400 });
    }

    await ctx.internalAdapter.deleteVerificationValue(verification.id);
    return NextResponse.json({ sessionToken });
}

export async function POST(req: Request) {
    const runtime = process.env.NEXT_PUBLIC_DORY_RUNTIME?.trim();
    const body = bodySchema.parse(await req.json().catch(() => ({})));

    if (runtime === 'desktop') {
        return consumeTicketFromCloud(body.ticket);
    }

    return consumeTicketLocally(body.ticket);
}
