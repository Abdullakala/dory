import { UIMessage } from 'ai';

type SupportedPromptLocale = 'en' | 'zh' | 'ja' | 'es';

export function extractMessageText(message: UIMessage | null | undefined): string {
    if (!message || !Array.isArray(message.parts)) return '';

    return message.parts
        .filter((part: any) => part?.type === 'text' && typeof part.text === 'string')
        .map((part: any) => part.text.trim())
        .filter(Boolean)
        .join('\n')
        .trim();
}

export function inferPromptLocaleFromText(text: string, fallbackLocale?: string | null): SupportedPromptLocale {
    const normalizedText = text.trim();

    if (/[ぁ-ゟ゠-ヿ]/u.test(normalizedText)) {
        return 'ja';
    }

    if (/[\u4E00-\u9FFF]/u.test(normalizedText)) {
        return 'zh';
    }

    if (/[¿¡]/u.test(normalizedText) || /\b(el|la|los|las|un|una|por|para|con|sin|consulta|tabla|usuarios?)\b/i.test(normalizedText)) {
        return 'es';
    }

    if (fallbackLocale === 'zh' || fallbackLocale === 'ja' || fallbackLocale === 'es') {
        return fallbackLocale;
    }

    return 'en';
}

export function buildUserLanguageInstruction(text: string, fallbackLocale?: string | null): string {
    const locale = inferPromptLocaleFromText(text, fallbackLocale);

    if (locale === 'zh') {
        return 'Response Language\n请使用与用户最新消息一致的语言回复。本次用户最新消息是简体中文，所以必须使用简体中文回复；不要切换到英文。SQL、表名、列名、代码标识符保持原样。';
    }

    if (locale === 'ja') {
        return 'Response Language\nUse the same language as the user\'s latest message. The latest message is in Japanese, so reply in Japanese. Keep SQL, table names, column names, and code identifiers unchanged.';
    }

    if (locale === 'es') {
        return 'Response Language\nUse the same language as the user\'s latest message. The latest message is in Spanish, so reply in Spanish. Keep SQL, table names, column names, and code identifiers unchanged.';
    }

    return 'Response Language\nUse the same language as the user\'s latest message. The latest message is in English, so reply in English. Keep SQL, table names, column names, and code identifiers unchanged.';
}

export function normalizeMessage(msg: any): any {
    if (msg.parts) return msg; // Already a new format
    if (msg.content) {
        const content = Array.isArray(msg.content)
            ? msg.content.map((c: any) =>
                  typeof c === 'string' ? { type: 'text', text: c } : { type: 'text', text: c?.text ?? JSON.stringify(c) },
              )
            : [{ type: 'text', text: String(msg.content) }];

        return { ...msg, parts: content };
    }
    return msg;
}

export function deriveTitle(messages: UIMessage[]) {
    for (const message of messages) {
        if (message.role !== 'user' || !Array.isArray(message.parts)) continue;
        const textParts = message.parts.filter((part: any) => part?.type === 'text' && typeof part.text === 'string');
        if (!textParts.length) continue;

        const combined = textParts
            .map((part: any) => part.text.trim())
            .join(' ')
            .trim();

        if (!combined) continue;
        return combined.length > 60 ? `${combined.slice(0, 60)}…` : combined;
    }
    return null;
}
