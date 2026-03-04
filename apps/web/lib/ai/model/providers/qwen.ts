import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export type QwenOptions = {
    apiKey?: string;
    baseURL?: string;
};

export function createQwenProvider(opts: QwenOptions = {}) {
    const baseURL =
        opts.baseURL ??
        process.env.DORY_AI_URL ??
        'https://dashscope.aliyuncs.com/compatible-mode/v1';

    const apiKey = opts.apiKey ?? process.env.DORY_AI_API_KEY;

    if (!apiKey) {
        throw new Error('DORY_AI_API_KEY is required');
    }

    return createOpenAICompatible({
        baseURL,
        name: 'qwen',
        apiKey,
        // For OpenAI-compatible streaming responses, usage is only returned
        // when stream_options.include_usage is enabled.
        includeUsage: true,
    });
}
