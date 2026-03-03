import { createAiGateway } from 'ai-gateway-provider';
import { createUnified } from 'ai-gateway-provider/providers/unified';

export type CloudflareGatewayOptions = {
    accountId?: string;
    gateway?: string;
    apiKey?: string;
    cfAigToken?: string;
    defaultProvider?: string;
    baseURL?: string;
};

type CloudflareGatewayConfig = {
    accountId: string;
    gateway: string;
    token: string;
    defaultProvider: string;
};

function parseGatewayUrl(baseURL?: string | null) {
    if (!baseURL) return null;
    try {
        const url = new URL(baseURL);
        const parts = url.pathname
            .split('/')
            .map(part => part.trim())
            .filter(Boolean);
        const v1Index = parts.findIndex(part => part.toLowerCase() === 'v1');
        if (v1Index < 0) return null;
        const accountId = parts[v1Index + 1];
        const gateway = parts[v1Index + 2];
        if (!accountId || !gateway) return null;
        return { accountId, gateway };
    } catch {
        return null;
    }
}

function resolveConfig(options: CloudflareGatewayOptions): CloudflareGatewayConfig {
    const parsed = parseGatewayUrl(options.baseURL ?? process.env.DORY_AI_URL ?? null);
    const accountId =
        options.accountId ??
        process.env.DORY_AI_CF_ACCOUNT_ID ??
        process.env.DORY_AI_CLOUDFLARE_ACCOUNT_ID ??
        parsed?.accountId ??
        '';
    const gateway =
        options.gateway ??
        process.env.DORY_AI_CF_GATEWAY ??
        process.env.DORY_AI_CLOUDFLARE_GATEWAY ??
        parsed?.gateway ??
        '';
    const token =
        options.cfAigToken ??
        options.apiKey ??
        process.env.DORY_AI_CF_AIG_TOKEN ??
        process.env.DORY_AI_API_KEY ??
        '';
    const defaultProvider =
        options.defaultProvider ??
        process.env.DORY_AI_CLOUDFLARE_DEFAULT_PROVIDER ??
        'openai';

    if (!accountId) {
        throw new Error('DORY_AI_CF_ACCOUNT_ID is required (or set DORY_AI_URL with /v1/{account}/{gateway}/compat)');
    }
    if (!gateway) {
        throw new Error('DORY_AI_CF_GATEWAY is required (or set DORY_AI_URL with /v1/{account}/{gateway}/compat)');
    }
    if (!token) {
        throw new Error('DORY_AI_CF_AIG_TOKEN is required');
    }

    return { accountId, gateway, token, defaultProvider };
}

export function createCloudflareGatewayProvider(options: CloudflareGatewayOptions = {}) {
    const { accountId, gateway, token, defaultProvider } = resolveConfig(options);
    const aiGateway = createAiGateway({
        accountId,
        gateway,
        apiKey: token,
    });
    const unified = createUnified();

    return {
        chatModel: (modelName: string) => {
            const normalized = modelName.includes('/') ? modelName : `${defaultProvider}/${modelName}`;
            return aiGateway(unified(normalized));
        },
    };
}
