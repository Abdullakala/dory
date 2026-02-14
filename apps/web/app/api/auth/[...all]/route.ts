// app/api/auth/[...all]/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getAuth } from '@/lib/auth';
import { proxyAuthRequest, shouldProxyAuthRequest } from '@/lib/auth/auth-proxy';

export async function GET(req: Request) {
    if (shouldProxyAuthRequest()) {
        return proxyAuthRequest(req);
    }
    const auth = await getAuth();
    return auth.handler(req);
}

export async function POST(req: Request) {
    if (shouldProxyAuthRequest()) {
        return proxyAuthRequest(req);
    }
    const auth = await getAuth();
    return auth.handler(req);
}
