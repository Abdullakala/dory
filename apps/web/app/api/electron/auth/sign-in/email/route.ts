import { getAuth } from '@/lib/auth';
import { serializeSignedCookie } from 'better-call';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getCloudApiBaseUrl(): string | null {
    const cloudUrl = process.env.DORY_CLOUD_API_URL ?? process.env.NEXT_PUBLIC_DORY_CLOUD_API_URL;
    if (typeof cloudUrl !== 'string' || !cloudUrl.trim()) return null;
    return cloudUrl.trim();
}

export async function POST(req: Request) {
    const baseUrl = getCloudApiBaseUrl();
    if (!baseUrl) {
        return NextResponse.json({ error: 'cloud_api_not_configured' }, { status: 500 });
    }

    const body = await req.text();
    const upstreamOrigin = new URL(baseUrl).origin;
    const targetUrl = new URL('/api/auth/sign-in/email', baseUrl).toString();
    const upstream = await fetch(targetUrl, {
        method: 'POST',
        headers: {
            'Content-Type': req.headers.get('content-type') ?? 'application/json',
            Origin: upstreamOrigin,
            Referer: upstreamOrigin,
        },
        body,
    });

    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
        return NextResponse.json(data ?? { error: 'sign_in_failed' }, { status: upstream.status });
    }

    const auth = await getAuth();
    const ctx = await auth.$context;
    const userData = data?.user as { email?: string | null; name?: string | null; image?: string | null; emailVerified?: boolean | null } | null;
    const email = userData?.email ?? null;
    if (!email) {
        return NextResponse.json({ error: 'missing_user_email' }, { status: 500 });
    }

    const existing = await ctx.internalAdapter.findUserByEmail(email, { includeAccounts: false });
    let userId = existing?.user.id;
    if (!userId) {
        const created = await ctx.internalAdapter.createUser({
            email,
            name: userData?.name ?? email,
            image: userData?.image ?? null,
            emailVerified: userData?.emailVerified ?? true,
        });
        userId = created.id;
    }

    const session = await ctx.internalAdapter.createSession(userId, false);
    if (!session) {
        return NextResponse.json({ error: 'failed_to_create_session' }, { status: 500 });
    }

    const maxAge = ctx.sessionConfig?.expiresIn;
    const cookie = await serializeSignedCookie(
        ctx.authCookies.sessionToken.name,
        session.token,
        ctx.secret,
        {
            ...ctx.authCookies.sessionToken.attributes,
            ...(maxAge ? { maxAge } : {}),
        },
    );

    const res = NextResponse.json({ ok: true, user: userData });
    res.headers.append('set-cookie', cookie);

    return res;
}
