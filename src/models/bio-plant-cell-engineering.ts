export const plantCellClamp = (x: number, a = 0, b = 1) =>
  Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
export function unionArea(r: number, d: number) {
  if (d >= 2 * r) return 2 * Math.PI * r * r;
  const h = Math.sqrt(Math.max(0, 4 * r * r - d * d));
  return 2 * Math.PI * r * r - (2 * r * r * Math.acos(d / (2 * r)) - (d * h) / 2);
}
/** Conserves illustrated cross-sectional area, not a claim about real 3-D volume. */
export function fusionOutline(progress: number, r0 = 34, gap = 22) {
  const p = plantCellClamp(progress),
    fuse = plantCellClamp((p - 0.25) / 0.75),
    d = p < 0.25 ? 2 * r0 + 2 * gap * (1 - p / 0.25) : 2 * r0 * (1 - fuse),
    target = 2 * Math.PI * r0 * r0;
  let lo = r0,
    hi = r0 * Math.SQRT2;
  if (fuse > 0)
    for (let i = 0; i < 55; i++) {
      const mid = (lo + hi) / 2;
      if (unionArea(mid, d) > target) hi = mid;
      else lo = mid;
    }
  const r = fuse > 0 ? (lo + hi) / 2 : r0,
    h = Math.sqrt(Math.max(0, r * r - (d * d) / 4));
  return {
    p,
    fuse,
    d,
    r,
    half: d / 2,
    h,
    area: unionArea(r, d),
    path: `M0 ${-h} A${r} ${r} 0 1 0 0 ${h} A${r} ${r} 0 1 0 0 ${-h} Z`,
    connected: fuse > 1e-7,
  };
}
export function fusionGeometry(w: number, progress: number, nuclear = 0) {
  const vertical = w < 420,
    r0 = vertical ? 32 : 43,
    cx = w / 2,
    cy = 151,
    body = fusionOutline(progress, r0, vertical ? 18 : 25),
    np = plantCellClamp(nuclear),
    nuc = fusionOutline(np, 9, 5),
    ns =
      Math.max(14, body.half) * (1 - plantCellClamp(np / 0.25)) +
      nuc.half * plantCellClamp(np / 0.25);
  const map = (x: number, y: number) =>
    vertical ? { x: cx - y, y: cy + x } : { x: cx + x, y: cy + y };
  const markers = Array.from({ length: 4 }, (_, i) => {
    const group = i < 2 ? 0 : 1,
      sign = group === 0 ? -1 : 1,
      x = sign * ns + sign * 3 * np,
      y = i % 2 ? 3 : -3;
    return { id: `${group ? 'B' : 'A'}${(i % 2) + 1}`, group, ...map(x, y), localX: x, localY: y };
  });
  const organelles = Array.from({ length: 12 }, (_, i) => {
    const sign = i < 6 ? -1 : 1,
      angle = ((i % 6) / 6) * Math.PI * 2 + (i < 6 ? 0 : Math.PI / 6);
    const x = sign * body.half + body.r * 0.67 * Math.cos(angle),
      y = body.r * 0.67 * Math.sin(angle);
    return { id: `org-${i}`, group: i < 6 ? 0 : 1, ...map(x, y), localX: x, localY: y };
  });
  return { vertical, cx, cy, r0, body, nuc, ns, map, markers, organelles, nuclear: np };
}
export function insideFusion(
  x: number,
  y: number,
  g: ReturnType<typeof fusionOutline>,
  margin = 0,
) {
  return Math.min(Math.hypot(x - g.half, y), Math.hypot(x + g.half, y)) <= g.r - margin + 1e-7;
}
export function tissueState(stage: number, progress: number, contaminated = false) {
  const p = plantCellClamp(progress),
    valid = !contaminated;
  return {
    callus: valid ? (stage === 0 ? p : 1) : 0,
    shoot: valid ? (stage < 1 ? 0 : stage === 1 ? p : 1) : 0,
    root: valid ? (stage < 2 ? 0 : stage === 2 ? p : 1) : 0,
    acclimatized: valid && stage === 3 ? p : 0,
    contaminated,
    stemOpacity: 1 - (stage === 0 ? p : 1) * 0.6,
  };
}
export function hormoneResponse(auxin: number, cytokinin: number) {
  const a = plantCellClamp(auxin, 0, 20),
    c = plantCellClamp(cytokinin, 0, 20),
    total = a + c;
  if (total === 0) return { root: 0, shoot: 0, callus: 0.08, vigor: 0.08, ratio: null, total };
  const log = Math.log((a + 0.08) / (c + 0.08)),
    vigor = (1 - Math.exp(-total / 2)) * Math.exp(-Math.max(0, total - 6) / 5),
    sig = (x: number) => 1 / (1 + Math.exp(-2 * x));
  return {
    root: vigor * sig(log - 0.65),
    shoot: vigor * sig(-log - 0.65),
    callus: vigor * Math.exp((-log * log) / 0.8),
    vigor,
    ratio: c === 0 ? Infinity : a / c,
    total,
  };
}
export function explantRate(success: string, total: string) {
  if (
    success.trim() === '' ||
    total.trim() === '' ||
    !Number.isInteger(+success) ||
    !Number.isInteger(+total) ||
    +total <= 0 ||
    +success < 0 ||
    +success > +total
  )
    return null;
  return +success / +total;
}
export const hybridEvidence = {
  tomato: { nuclear: ['A'], plastid: 'A' },
  potato: { nuclear: ['B'], plastid: 'B' },
  hybrid: { nuclear: ['A', 'B'], plastid: 'one-parent' },
} as const;

export type PlantCellSnapshot = {
  chapter: number;
  progress: number;
  contaminated: boolean;
  competence: number;
  aux: number;
  cyt: number;
  prediction: 'none' | 'shoot' | 'root';
  total: string;
  shootCount: string;
  rootCount: string;
  journal: string;
};
/** All visible teaching state is reconstructible and can be inherited by Explore. */
export function plantCellDirector(chapter: number, progress: number): PlantCellSnapshot {
  const ch = Math.round(plantCellClamp(chapter, 0, 10));
  return {
    chapter: ch,
    progress: plantCellClamp(progress),
    contaminated: false,
    competence: 1,
    aux: ch === 10 ? 10 : ch === 2 || ch === 3 ? 3 : 0.5,
    cyt: ch === 10 ? 10 : ch === 2 || ch === 3 ? 0.5 : 3,
    prediction: 'none',
    total: '',
    shootCount: '',
    rootCount: '',
    journal: '',
  };
}
/** Map measured spoken landmarks to the same process coordinate Explore stores.
 * Times include the 0.45 s spoken lead-in. This is film direction, not culture time. */
export function plantCellMeasuredDirector(
  chapter: number,
  progress: number,
  chapterTime: number,
  en: boolean,
): PlantCellSnapshot {
  const state = plantCellDirector(chapter, progress);
  if (state.chapter > 3) return state;
  const landmarks: Array<[number, number]> =
    state.chapter === 0
      ? en
        ? [
            [0, 0],
            [2.2, 0.3],
            [3.8, 0.65],
            [5.3, 1],
          ]
        : [
            [0, 0],
            [4.5, 0.3],
            [5.7, 0.65],
            [6.3, 1],
          ]
      : state.chapter === 1
        ? en
          ? [
              [0, 0],
              [8.4, 0.35],
              [10.6, 0.6],
              [14.9, 0.85],
              [16, 1],
            ]
          : [
              [0, 0],
              [7.3, 0.35],
              [10.2, 0.6],
              [14.6, 0.85],
              [16, 1],
            ]
        : state.chapter === 2
          ? en
            ? [
                [0, 0],
                [5.4, 0.1],
                [11.8, 0.25],
                [16.8, 1],
              ]
            : [
                [0, 0],
                [5.9, 0.1],
                [12.8, 0.25],
                [18.1, 1],
              ]
          : en
            ? [
                [0, 0],
                [7.1, 0.25],
                [12.4, 0.449],
                [12.6, 0.45],
                [17.5, 1],
              ]
            : [
                [0, 0],
                [7.7, 0.25],
                [12, 0.449],
                [12.5, 0.45],
                [17.8, 1],
              ];
  const time = Number.isFinite(chapterTime) ? Math.max(0, chapterTime) : 0;
  let mapped = 1;
  for (let i = 1; i < landmarks.length; i++) {
    const [start, a] = landmarks[i - 1],
      [end, b] = landmarks[i];
    if (time <= end) {
      mapped = a + (b - a) * plantCellClamp((time - start) / (end - start));
      break;
    }
  }
  return { ...state, progress: mapped };
}
const ease = (p: number) => {
  const t = plantCellClamp(p);
  return t * t * (3 - 2 * t);
};
/** One successful organogenesis route, not a schedule or a claim about every cell. */
export function regenerationSequence(progress: number, competence = 1) {
  const p = plantCellClamp(progress),
    c = plantCellClamp(competence);
  return {
    lineage: 'L1',
    callus: ease(p / 0.3) * c,
    shoot: ease((p - 0.3) / 0.35) * c,
    root: ease((p - 0.65) / 0.35) * c,
    phase: p < 0.3 ? 'callus' : p < 0.65 ? 'shoot' : 'root',
  };
}
/** Information blocks are schematic, not measured genes or expression data. */
export function regenerationResponse(
  auxin: number,
  cytokinin: number,
  progress = 1,
  competence = 1,
) {
  const r = hormoneResponse(auxin, cytokinin),
    c = plantCellClamp(competence),
    amount = ease(progress) * c;
  return {
    information: ['I1', 'I2', 'I3'] as const,
    expression: [0.35 * c, r.shoot * c, r.root * c],
    shoot: r.shoot * amount,
    root: r.root * amount,
    callus: (0.25 + r.callus * 0.65) * c,
    response: r,
    responsive: c > 0,
  };
}

/** Change induction after shoots exist; a new condition does not erase existing organs. */
export function regenerationIntervention(
  auxin: number,
  cytokinin: number,
  progress: number,
  competence = 1,
) {
  const initial = regenerationResponse(0.5, 3, 1, 1),
    next = regenerationResponse(auxin, cytokinin, progress, competence);
  return {
    ...next,
    shoot: initial.shoot + (1 - initial.shoot) * next.shoot,
    callus: initial.callus,
    initialShoot: initial.shoot,
  };
}
