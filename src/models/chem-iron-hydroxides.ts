const unit = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
/** Amounts in mmol. Ideal textbook precipitation, then oxygen-limited oxidation. */
export function ironHydroxides(oh = 3, oxygen = 0.25, extent = 1, add = 1) {
  const hydroxide = Math.max(0, Math.min(4, Number.isFinite(oh) ? oh : 0)) * unit(add);
  const ferrousSolid = Math.min(1, hydroxide / 2);
  const ferricSolid = Math.min(1, hydroxide / 3);
  const oxidized =
    Math.min(ferrousSolid, 4 * Math.max(0, Number.isFinite(oxygen) ? oxygen : 0)) * unit(extent);
  return {
    hydroxide,
    ferricSolid,
    ferricDissolved: 1 - ferricSolid,
    ferrousDissolved: 1 - ferrousSolid,
    ferrousRemaining: ferrousSolid - oxidized,
    oxidized,
    oxygenUsed: oxidized / 4,
    waterUsed: oxidized / 2,
    fraction: ferrousSolid ? oxidized / ferrousSolid : 0,
    totalFerrousIron: 1 - ferrousSolid + ferrousSolid - oxidized + oxidized,
  };
}
/** Four persistent inventory shares, each 0.25 mmol of the SAME initial 1 mmol Fe.
 * Sector areas express amounts, never fractions of an individual atom. */
export function hydroxideIronSlots(oh = 3, oxygen = 0.25, extent = 1, add = 1) {
  const m = ironHydroxides(oh, oxygen, extent, add),
    capacity = 0.25;
  const solid = m.oxidized + m.ferrousRemaining;
  const overlap = (lo: number, hi: number, left: number, right: number) =>
    Math.max(0, Math.min(hi, right) - Math.max(lo, left));
  return Array.from({ length: 4 }, (_, i) => {
    const left = i * capacity,
      right = left + capacity;
    const solidIII = overlap(0, m.oxidized, left, right);
    const solidII = overlap(m.oxidized, solid, left, right);
    const aqueousII = capacity - solidIII - solidII;
    return {
      id: `Fe-${i}`,
      capacity,
      solidIII,
      solidII,
      aqueousII,
      sectors: [
        { phase: 'solidIII', amount: solidIII, start: 0, end: solidIII / capacity },
        {
          phase: 'solidII',
          amount: solidII,
          start: solidIII / capacity,
          end: (solidIII + solidII) / capacity,
        },
        { phase: 'aqueousII', amount: aqueousII, start: (solidIII + solidII) / capacity, end: 1 },
      ],
    };
  });
}
/** Filled sector geometry shares the inventory's cumulative amount boundaries. */
export function hydroxideSectorPath(start: number, end: number, radius = 24) {
  const a = unit(start),
    b = Math.max(a, unit(end));
  if (b - a < 1e-12) return '';
  const point = (q: number) => [
    radius * Math.cos(2 * Math.PI * q - Math.PI / 2),
    radius * Math.sin(2 * Math.PI * q - Math.PI / 2),
  ];
  const [x, y] = point(a),
    [u, v] = point(b);
  if (b - a >= 1 - 1e-12)
    return `M0 ${-radius}A${radius} ${radius} 0 1 1 0 ${radius}A${radius} ${radius} 0 1 1 0 ${-radius}Z`;
  return `M0 0L${x} ${y}A${radius} ${radius} 0 ${b - a > 0.5 ? 1 : 0} 1 ${u} ${v}Z`;
}
export function hydroxideColour(fraction: number) {
  const p = unit(fraction),
    stops = [
      [227, 232, 215],
      [135, 154, 124],
      [161, 94, 60],
    ];
  const t = p < 0.25 ? p * 4 : (p - 0.25) / 0.75,
    i = p < 0.25 ? 0 : 1;
  return `rgb(${stops[i].map((a, j) => Math.round(a + (stops[i + 1][j] - a) * t)).join(',')})`;
}
function originalHydroxideDirector(chapter: number, progress: number) {
  const p = unit(progress);
  return {
    oh: 3,
    oxygen: 0.25,
    extent: chapter === 0 ? 0 : chapter === 1 || chapter === 2 ? p : 1,
    add: chapter === 0 ? p : 1,
    micro: chapter === 2,
    compare: chapter === 3,
    progress: p,
  };
}

/** Existing bilingual words govern these explanatory comparisons, not kinetic time. */
export function hydroxideDirector(chapter: number, progress: number, time?: number, locale = 'zh') {
  if (time === undefined)
    return { ...originalHydroxideDirector(chapter, progress), comparison: 'normal' };
  const c = Math.max(0, Math.min(3, Math.round(Number.isFinite(chapter) ? chapter : 0))),
    t = Math.max(0, Number.isFinite(time) ? time : 0),
    en = locale === 'en',
    r = (a: number, b: number) => {
      const p = unit((t - a) / (b - a));
      return p * p * (3 - 2 * p);
    };
  let q = { ...originalHydroxideDirector(c, 0), comparison: 'normal' };
  if (c === 0) q = { ...q, add: r(en ? 5.39 : 4.49, en ? 8.51 : 9.25) };
  if (c === 1) q = { ...q, extent: r(0.8, 5.8) };
  if (c === 2) {
    q = { ...q, extent: r(en ? 6.57 : 6.41, en ? 11.01 : 10.31) };
    if (t >= (en ? 15.73 : 14.27))
      q = { ...q, oxygen: 0.125, extent: 1, comparison: 'limited-oxygen' };
    if (t >= (en ? 19.15 : 17.91)) q = { ...q, oh: 0, comparison: 'no-precipitate' };
  }
  if (c === 3) q = { ...q, extent: r(en ? 8.47 : 6.99, en ? 12.53 : 10.93) };
  return q;
}
