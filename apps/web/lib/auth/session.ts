// lib/auth/session.ts

import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { createSessionResolver } from '@dory/auth-core';
import { getAuth } from '../auth';
import { createAuthProxyHeaders, shouldProxyAuthRequest } from './auth-proxy';
import { getRuntimeForServer } from '@/lib/runtime/runtime';

function getCloudApiBaseUrl(): string | null {
    const cloudUrl = process.env.DORY_CLOUD_API_URL ?? process.env.NEXT_PUBLIC_DORY_CLOUD_API_URL;
    if (typeof cloudUrl !== 'string' || !cloudUrl.trim()) return null;
    return cloudUrl.trim();
}

const resolveSession = createSessionResolver({
    getAuth,
    shouldProxyAuthRequest,
    createAuthProxyHeaders,
    getCloudApiBaseUrl,
    getRuntime: getRuntimeForServer,
});

function normalizeSessionCookieHeader(headers: Headers): Headers {
    const next = new Headers(headers);
    const cookie = next.get('cookie');
    if (!cookie) return next;

    const parts = cookie
        .split(';')
        .map(part => part.trim())
        .filter(Boolean);
    const hasPlain = parts.some(part => part.startsWith('better-auth.session_token='));
    const hasSecure = parts.some(part => part.startsWith('__Secure-better-auth.session_token='));

    if (hasPlain && !hasSecure) {
        const plain = parts.find(part => part.startsWith('better-auth.session_token='));
        if (plain) {
            parts.push(plain.replace('better-auth.session_token=', '__Secure-better-auth.session_token='));
            next.set('cookie', parts.join('; '));
        }
    }

    return next;
}

export async function getSessionFromRequest(req?: NextRequest) {
    const reqHeaders = req ? req.headers : await headers();
    const normalizedHeaders = normalizeSessionCookieHeader(reqHeaders);
    return resolveSession({
        headers: normalizedHeaders,
        url: req?.url ?? null,
    });
}
