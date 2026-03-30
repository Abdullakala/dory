import { routing, type Locale } from './routing';

export type ElectronLocale = 'en-US' | 'zh-CN';

const LOCALE_COOKIE_NAME = 'locale';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function isLocale(value: string): value is Locale {
    return routing.locales.includes(value as Locale);
}

export function normalizeLocale(value: string | null | undefined, fallback: Locale = routing.defaultLocale): Locale {
    return value && isLocale(value) ? value : fallback;
}

export function readLocaleCookie(): Locale | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`));
    const value = match ? decodeURIComponent(match[1]) : '';
    return isLocale(value) ? value : null;
}

export function writeLocaleCookie(locale: Locale) {
    document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
    document.documentElement.lang = locale;
}

export function electronLocaleToWebLocale(locale: ElectronLocale): Locale {
    return locale === 'zh-CN' ? 'zh' : 'en';
}

export function webLocaleToElectronLocale(locale: Locale): ElectronLocale {
    return locale === 'zh' ? 'zh-CN' : 'en-US';
}
