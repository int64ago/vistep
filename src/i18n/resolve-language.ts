export type LanguageSignals = {
  explicit?: string | null;
  saved?: string | null;
  languages?: readonly string[];
  language?: string;
  formatLocale?: string;
  timeZone?: string;
  referrerLocale?: string;
};

/** Local, explainable negotiation. Region is a weak hint, never a language override. */
export function resolveLanguage(signals: LanguageSignals) {
  const supported = (value?: string | null): 'zh' | 'en' | undefined => {
    const primary = value?.toLowerCase().split(/[-_]/)[0];
    return primary === 'zh' || primary === 'en' ? primary : undefined;
  };
  const explicit = supported(signals.explicit);
  const saved = supported(signals.saved);
  if (explicit || saved)
    return { locale: (explicit || saved)!, reason: explicit ? 'explicit' : 'saved' };

  const scores = { zh: 0, en: 0 };
  const seen = new Set<string>();
  (signals.languages || []).forEach((value, index) => {
    const locale = supported(value);
    // Multiple variants of the same language are one preference, not extra votes.
    if (locale && !seen.has(locale)) {
      scores[locale] += 16 / (index + 1) ** 2;
      seen.add(locale);
    }
  });
  const primary = supported(signals.language);
  if (primary && !seen.has(primary)) scores[primary] += 8;
  const format = supported(signals.formatLocale);
  if (format) scores[format] += 2;
  const referrer = supported(signals.referrerLocale);
  if (referrer) scores[referrer] += 3;
  if (
    /^Asia\/(Shanghai|Chongqing|Harbin|Urumqi|Hong_Kong|Macau|Taipei)$/.test(signals.timeZone || '')
  )
    scores.zh += 1;
  if (
    /^(America\/(New_York|Chicago|Denver|Los_Angeles)|Europe\/London|Australia\/|Pacific\/Auckland)/.test(
      signals.timeZone || '',
    )
  )
    scores.en += 1;
  return { locale: scores.zh > scores.en ? ('zh' as const) : ('en' as const), reason: 'signals' };
}

/** Inlined in the neutral entry page so negotiation happens before painting the hero. */
export function bootLanguage(resolve: typeof resolveLanguage) {
  if (location.pathname !== '/') return;
  let saved: string | null = null;
  try {
    saved = localStorage.getItem('vistep:language');
  } catch {}
  let settings: Intl.ResolvedDateTimeFormatOptions | undefined;
  try {
    settings = Intl.DateTimeFormat().resolvedOptions();
  } catch {}
  let referrerLocale: string | undefined;
  try {
    const previous = new URL(document.referrer);
    if (previous.origin === location.origin) {
      if (previous.pathname.startsWith('/en/')) referrerLocale = 'en';
      else if (previous.pathname.startsWith('/zh/') || previous.pathname.startsWith('/explore/'))
        referrerLocale = 'zh';
    }
  } catch {}
  const result = resolve({
    explicit: new URLSearchParams(location.search).get('lang'),
    saved,
    languages: navigator.languages,
    language: navigator.language,
    formatLocale: settings?.locale,
    timeZone: settings?.timeZone,
    referrerLocale,
  });
  location.replace(`/${result.locale}/` + location.search + location.hash);
}
