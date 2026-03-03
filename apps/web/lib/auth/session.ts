// lib/auth/session.ts

import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { getAuth } from '../auth';
import { createAuthProxyHeaders, shouldProxyAuthRequest } from './auth-proxy';

function getCloudApiBaseUrl(): string | null {
    const cloudUrl = process.env.DORY_CLOUD_API_URL ?? process.env.NEXT_PUBLIC_DORY_CLOUD_API_URL;
    if (typeof cloudUrl !== 'string' || !cloudUrl.trim()) return null;
    return cloudUrl.trim();
}

function getCloudAuthSessionUrl(): string | null {
    const base = getCloudApiBaseUrl();
    if (!base) return null;
    return new URL('/api/auth/get-session', base).toString();
}


export async function getSessionFromRequest(req?: NextRequest) {
    const auth = await getAuth();
    const reqHeaders = req ? req.headers : await headers();

    if (shouldProxyAuthRequest()) {
        const sessionUrl = getCloudAuthSessionUrl();
        const cloudBase = getCloudApiBaseUrl();
        if (sessionUrl && cloudBase) {
            try {
                const res = await fetch(sessionUrl, {
                    headers: createAuthProxyHeaders(reqHeaders, cloudBase),
                    cache: 'no-store',
                });
                if (res.ok) {
                    const session = (await res.json()) as ReturnType<typeof auth.api.getSession>;
                    if (session) return session;
                }
            } catch {
                // ignore
            }
        }
    }

    const session = await auth.api
        .getSession({
            headers: reqHeaders,
        })
        .catch(() => null);

    if (session) return session;

    return null;
}
