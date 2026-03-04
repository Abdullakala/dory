import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  let locale = (cookieStore.get('locale')?.value || routing.defaultLocale) as Locale;

  if (!routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
