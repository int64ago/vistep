export type MrView = 'select' | 'identity' | 'ask' | 'prove' | 'record' | 'data' | 'call';
export type MrLocale = 'zh' | 'en';
export const MR_VIEWS: MrView[] = ['select', 'identity', 'ask', 'prove', 'record', 'data', 'call'];

type Window = readonly [number, number];
type BeatTable = {
  select: Record<'land' | 'home' | 'scan' | 'match' | 'choose', Window>;
  identity: Record<'read' | 'split' | 'realm' | 'route' | 'key', Window>;
  ask: Record<'attach' | 'air' | 'agree' | 'gen' | 'aia', Window>;
  prove: Record<'forward' | 'mac' | 'res' | 'back' | 'compare' | 'flip' | 'diff', Window>;
  record: Record<'ulr' | 'write' | 'cancel' | 'ula' | 'accept', Window>;
  data: Record<'hr' | 'hrRtt' | 'lbo' | 'lboRtt' | 'compare', Window>;
  call: Record<'dial' | 'sri' | 'prn' | 'msrn' | 'route' | 'page' | 'local', Window>;
};

/**
 * Chapter-relative beat windows (fractions of the measured chapter window), set from the
 * sentence pauses measured in each recorded narration track, so a picture changes while the
 * matching sentence is spoken. Seeking only needs chapter, progress and page language.
 */
export const MR_BEATS: Record<MrLocale, BeatTable> = {
  zh: {
    select: {
      land: [0, 0.08],
      home: [0.11, 0.2],
      scan: [0.22, 0.4],
      match: [0.53, 0.66],
      choose: [0.69, 0.77],
    },
    identity: {
      read: [0.12, 0.26],
      split: [0.29, 0.5],
      realm: [0.6, 0.72],
      route: [0.7, 0.78],
      key: [0.79, 0.95],
    },
    ask: {
      attach: [0.02, 0.14],
      air: [0.17, 0.44],
      agree: [0.48, 0.6],
      gen: [0.64, 0.8],
      aia: [0.8, 0.9],
    },
    prove: {
      forward: [0.06, 0.26],
      mac: [0.31, 0.45],
      res: [0.48, 0.58],
      back: [0.58, 0.62],
      compare: [0.62, 0.7],
      flip: [0.75, 0.8],
      diff: [0.83, 0.93],
    },
    record: {
      ulr: [0.03, 0.17],
      write: [0.2, 0.36],
      cancel: [0.44, 0.56],
      ula: [0.62, 0.78],
      accept: [0.84, 0.92],
    },
    data: {
      hr: [0.1, 0.42],
      hrRtt: [0.5, 0.62],
      lbo: [0.68, 0.82],
      lboRtt: [0.8, 0.9],
      compare: [0.92, 0.97],
    },
    call: {
      dial: [0.03, 0.22],
      sri: [0.26, 0.36],
      prn: [0.38, 0.44],
      msrn: [0.44, 0.5],
      route: [0.5, 0.58],
      page: [0.6, 0.7],
      local: [0.74, 0.9],
    },
  },
  en: {
    select: {
      land: [0, 0.08],
      home: [0.1, 0.2],
      scan: [0.25, 0.36],
      match: [0.51, 0.62],
      choose: [0.64, 0.72],
    },
    identity: {
      read: [0.12, 0.23],
      split: [0.25, 0.42],
      realm: [0.44, 0.58],
      route: [0.56, 0.64],
      key: [0.64, 0.84],
    },
    ask: {
      attach: [0.02, 0.12],
      air: [0.15, 0.38],
      agree: [0.41, 0.5],
      gen: [0.52, 0.68],
      aia: [0.68, 0.8],
    },
    prove: {
      forward: [0.08, 0.33],
      mac: [0.37, 0.53],
      res: [0.56, 0.66],
      back: [0.66, 0.7],
      compare: [0.71, 0.76],
      flip: [0.82, 0.86],
      diff: [0.88, 0.96],
    },
    record: {
      ulr: [0.03, 0.17],
      write: [0.2, 0.38],
      cancel: [0.45, 0.58],
      ula: [0.62, 0.78],
      accept: [0.83, 0.9],
    },
    data: {
      hr: [0.05, 0.4],
      hrRtt: [0.47, 0.6],
      lbo: [0.64, 0.76],
      lboRtt: [0.76, 0.86],
      compare: [0.9, 0.96],
    },
    call: {
      dial: [0.03, 0.2],
      sri: [0.23, 0.33],
      prn: [0.36, 0.46],
      msrn: [0.46, 0.53],
      route: [0.54, 0.62],
      page: [0.63, 0.68],
      local: [0.7, 0.88],
    },
  },
};

export const mrSmooth = (v: number) => {
  const p = Math.max(0, Math.min(1, v));
  return p * p * (3 - 2 * p);
};
/** Linear progress inside a window, for things that travel at a steady pace (message capsules). */
export const mrLinear = (p: number, [a, b]: Window) => Math.max(0, Math.min(1, (p - a) / (b - a)));

export function mrShot(chapter: number, progress: number, locale: MrLocale = 'zh') {
  if (!Number.isFinite(chapter) || !Number.isFinite(progress))
    throw new RangeError('Finite film position required');
  const c = Math.max(0, Math.min(MR_VIEWS.length - 1, Math.floor(chapter)));
  const p = Math.max(0, Math.min(1, progress));
  const view = MR_VIEWS[c];
  const table = MR_BEATS[locale === 'en' ? 'en' : 'zh'][view] as Record<string, Window>;
  const beats = Object.fromEntries(
    Object.entries(table).map(([name, w]) => [name, mrLinear(p, w)]),
  ) as Record<string, number>;
  return { view, chapter: c, p, beats };
}

/** Exploration shows each view settled: every beat complete. */
export function mrSettled(view: MrView) {
  return Object.fromEntries(Object.keys(MR_BEATS.zh[view]).map((k) => [k, 1])) as Record<
    string,
    number
  >;
}
