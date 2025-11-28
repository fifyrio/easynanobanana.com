export const locales = ['en', 'zh', 'de', 'fr', 'ja', 'pt', 'es', 'it', 'ru', 'ko', 'th', 'id', 'vi'] as const;
export const defaultLocale = 'en';

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  de: 'Deutsch',
  fr: 'Français',
  ja: '日本語',
  pt: 'Português',
  es: 'Español',
  it: 'Italiano',
  ru: 'Русский',
  ko: '한국어',
  th: 'ไทย',
  id: 'Bahasa Indonesia',
  vi: 'Tiếng Việt'
};