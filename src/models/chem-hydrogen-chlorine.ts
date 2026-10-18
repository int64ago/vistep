/** Stoichiometric closed-portion account; flame and aerosol appearance are qualitative. */
export function hydrogenChlorine(extent: number, moistAir = true) {
  const x = Math.max(0, Math.min(1, Number.isFinite(extent) ? extent : 0));
  return {
    extent: x,
    hydrogen: 1 - x,
    chlorine: 1 - x,
    hydrogenChloride: 2 * x,
    hydrogenAtoms: 2 * (1 - x) + 2 * x,
    chlorineAtoms: 2 * (1 - x) + 2 * x,
    enthalpyKJ: -184.62 * x,
    fog: moistAir && x > 0,
    flame: x > 0 && x < 1,
  };
}
export function hclAtoms(extent: number) {
  const p = Math.max(0, Math.min(1, Number.isFinite(extent) ? extent : 0));
  return [
    { id: 'h1', element: 'H', x: 80 + 40 * p, y: 100 },
    { id: 'h2', element: 'H', x: 110 + 130 * p, y: 100 - 55 * Math.sin(Math.PI * p) },
    { id: 'cl1', element: 'Cl', x: 280 - 130 * p, y: 100 + 55 * Math.sin(Math.PI * p) },
    { id: 'cl2', element: 'Cl', x: 330 - 60 * p, y: 100 },
  ];
}
export function hydrogenChlorineDirector(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  return {
    view: chapter === 0 ? 'flame' : chapter === 1 ? 'fog' : 'molecules',
    extent: chapter === 0 ? 0.05 + 0.9 * p : chapter === 1 ? 1 : p,
    moist: chapter === 1,
    progress: p,
  };
}

/** The same completed portion is kept while moisture changes; identity paths are illustrative. */
export function hydrogenChlorineFilmShot(
  chapter: number,
  time: number,
  locale: 'zh' | 'en' = 'zh',
) {
  const c = Math.max(0, Math.min(2, Math.floor(Number.isFinite(chapter) ? chapter : 0))),
    t = Math.max(0, Number.isFinite(time) ? time : 0),
    en = locale === 'en';
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return {
    view: c === 0 ? 'flame' : c === 1 ? 'fog' : 'molecules',
    extent: c === 0 ? 0.05 + 0.9 * clamp(t / 27) : c === 1 ? 1 : clamp((t - 3.6) / 3.8),
    moist: c === 1 && t < (en ? 17.67 : 18.03),
    progress: clamp(t / (c === 2 ? 32 : c === 1 ? 30 : 28)),
  };
}
