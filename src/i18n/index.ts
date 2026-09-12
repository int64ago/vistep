import type { Topic } from '../data/topics';
export type Locale = 'zh' | 'en';
/**
 * English copy is registered rather than imported so the 430 KB dictionary only ships to
 * English pages: the server and the English islands import `./english`, Chinese pages never do.
 */
const dictionary: Record<string, string> = {};
export function registerDictionary(entries: Record<string, string>) {
  Object.assign(dictionary, entries);
}
export const browserLocale = (): Locale =>
  typeof document !== 'undefined' && document.documentElement.lang.startsWith('en') ? 'en' : 'zh';
export const localeFromPath = (path: string): Locale => (/^\/en(?:\/|$)/.test(path) ? 'en' : 'zh');
export function translate(source: string, locale: Locale, ...values: unknown[]) {
  const translated = locale === 'en' ? (dictionary[source] ?? source) : source;
  return translated.replace(/\{(\d+)\}/g, (whole, n) => (n in values ? String(values[n]) : whole));
}
/** Client islands read the route's language once; static Astro copy passes its locale explicitly. */
export const t = (source: string, ...values: unknown[]) =>
  translate(source, browserLocale(), ...values);
export function localPath(path: string, locale: Locale) {
  const bare = path.replace(/^\/(en|zh)(?=\/|$)/, '') || '/';
  if (bare === '/' || bare.startsWith('/#') || bare.startsWith('/?')) return `/${locale}${bare}`;
  return locale === 'en' ? `/en${bare.startsWith('/') ? bare : `/${bare}`}` : bare;
}
export function localizedTopic(topic: Topic, locale: Locale): Topic {
  return {
    ...topic,
    ...Object.fromEntries(
      ['name', 'title', 'question', 'description', 'duration', 'tag'].map((key) => [
        key,
        translate(topic[key as keyof Topic] as string, locale),
      ]),
    ),
  };
}
export function tokenLabel(value: string) {
  if (browserLocale() !== 'en') return value;
  return [...value]
    .map((token) => (token === '。' ? '.' : (dictionary[token] ?? token)))
    .join(' ')
    .replace(/\s+\./g, '.');
}
