import { createOpenAI } from '@ai-sdk/openai';

export type OpenAIProviderOptions = {
    apiKey?: string;
    baseURL?: string;
    organization?: string;
    project?: string;
};

function normalizeBaseURL(baseURL: string) {
    const trimmed = baseURL.trim().replace(/\/+$/, '');
    return trimmed.replace(/\/chat\/completions$/i, '');
}

export function createOpenAIProvider(options: OpenAIProviderOptions = {}) {
    const apiKey = options.apiKey ?? process.env.DORY_AI_API_KEY;
    if (!apiKey) {
        throw new Error('DORY_AI_API_KEY is required');
    }

    const rawBaseURL = options.baseURL ?? process.env.DORY_AI_URL;
    const baseURL = rawBaseURL ? normalizeBaseURL(rawBaseURL) : undefined;

    const organization = options.organization;
    const project = options.project;

    const provider = createOpenAI({
        apiKey,
        baseURL,
        organization,
        project,
    });

    return {
        chatModel: (modelName: string) => provider.chat(modelName),
    };
}
