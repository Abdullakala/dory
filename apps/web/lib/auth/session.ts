// lib/auth/session.ts

import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { createSessionResolver } from '@dory/auth-core';
import { getAuth } from '../auth';
import { createAuthProxyHeaders, shouldProxyAuthRequest } from './auth-proxy';

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
    getRuntime: () => process.env.NEXT_PUBLIC_DORY_RUNTIME?.trim() ?? null,
});

export async function getSessionFromRequest(req?: NextRequest) {
    const reqHeaders = req ? req.headers : await headers();
    return resolveSession({
        headers: reqHeaders,
        url: req?.url ?? null,
    });
}
