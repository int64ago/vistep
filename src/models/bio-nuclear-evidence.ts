export type NuclearCase =
  'cow' | 'axolotl' | 'constriction' | 'amoeba' | 'alga' | 'monkey' | 'frog';
const clamp = (x: number) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);
const smooth = (x: number) => {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
};
export function nuclearTransfer(progress: number, hasDonor = true) {
  const p = clamp(progress),
    q = smooth(p / 0.4),
    transferred = hasDonor && p >= 0.4;
  return {
    p,
    donorNucleus: hasDonor && !transferred,
    recipientNucleus: transferred,
    nuclearOrigin: transferred ? 'donor' : null,
    cytoplasmicOrigin: 'egg',
    surrogateOrigin: 'gestation',
    outcomeVisible: transferred && p > 0.72,
    outcomeProgress: hasDonor ? smooth((p - 0.72) / 0.28) : 0,
    nucleusPosition: { x: 75 + 185 * q, y: 70 - 27 * Math.sin(Math.PI * q) },
    nucleusId: 'donor-nucleus',
  };
}
/** The developmental timeline is illustrative; the textbook transfer occurs after 16–32 cells. */
export function constrictedEmbryo(progress: number, transfer = true) {
  const p = clamp(progress),
    leftStage = Math.min(4, (p / 0.43) * 4),
    rightStage = transfer ? Math.max(0, Math.min(3, ((p - 0.68) / (1 - 0.68)) * 3)) : 0,
    q = transfer ? smooth((p - 0.48) / 0.18) : 0;
  // A nucleus from a near-bridge blastomere passes through the open cytoplasmic bridge.
  const source = cleavageRegions(16, 106, 126)[7].nucleus,
    moving = transfer && p >= 0.48 && p < 0.66,
    point =
      q < 0.3
        ? { x: source.x + ((174 - source.x) * q) / 0.3, y: source.y + ((126 - source.y) * q) / 0.3 }
        : q < 0.5
          ? { x: 174 + ((188 - 174) * (q - 0.3)) / 0.2, y: 126 }
          : { x: 188 + ((238 - 188) * (q - 0.5)) / 0.5, y: 126 };
  return {
    leftStage,
    rightStage,
    leftCells: 2 ** Math.floor(leftStage),
    rightCells: 2 ** Math.floor(rightStage),
    rightNucleus: transfer && p >= 0.66,
    movingNucleus: moving,
    sourceVacated: transfer && p >= 0.48,
    nucleusPoint: point,
    nucleusId: 'bridge-nucleus',
  };
}
export function cleavageRegions(count: number, cx: number, cy: number) {
  const columns = Math.ceil(Math.sqrt(count)),
    rows = Math.ceil(count / columns),
    size = 108,
    w = size / columns,
    h = size / rows;
  return Array.from({ length: count }, (_, id) => {
    const dx = -54 + ((id % columns) + 0.5) * w,
      dy = -54 + (Math.floor(id / columns) + 0.5) * h,
      k = Math.min(1, 47 / Math.max(1, Math.hypot(dx, dy)));
    return {
      id,
      x: cx - 54 + (id % columns) * w,
      y: cy - 54 + Math.floor(id / columns) * h,
      width: w,
      height: h,
      nucleus: { x: cx + dx * k, y: cy + dy * k },
    };
  });
}
export function amoebaFragment(progress: number, nucleus: boolean, rescue = true) {
  const p = clamp(progress),
    rescueProgress = !nucleus && rescue ? smooth((p - 0.42) / 0.23) : 0,
    restored = !nucleus && rescue && p >= 0.65,
    restoration = !nucleus && rescue ? smooth((p - 0.65) / 0.35) : 0;
  const residual = 1 - (rescue ? Math.min(p, 0.65) : p) * 0.65,
    maintenance = nucleus ? 1 : residual + (1 - residual) * restoration;
  return {
    nucleus: nucleus || restored,
    active: nucleus || restored,
    rescued: restored,
    rescueProgress,
    rescueVisible: !nucleus && rescue && p >= 0.38,
    digestionRemaining: Math.max(0, 1 - p),
    maintenance,
    activity: nucleus ? 1 : restoration,
    nucleusPosition: {
      x: 145 + (85 - 9 * maintenance - 145) * rescueProgress,
      y: 25 + (110 - 6 * maintenance - 25) * rescueProgress,
    },
    nucleusId: nucleus ? 'original-nucleus' : 'rescue-nucleus',
  };
}
/** Smooth outline changes retain the same sampled membrane points. */
export function amoebaOutline(activity: number) {
  return (
    Array.from({ length: 65 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2,
        r = 48 + (4 + 9 * activity) * Math.sin(5 * a) + 4 * Math.cos(3 * a);
      return `${i ? 'L' : 'M'}${Math.cos(a) * r},${Math.sin(a) * r}`;
    }).join(' ') + 'Z'
  );
}
export function algaRegeneration(
  progress: number,
  nucleus: 'umbrella' | 'daisy',
  graft: 'umbrella' | 'daisy',
) {
  const p = clamp(progress);
  return {
    nucleus,
    stem: graft,
    cap: p < 0.55 ? null : nucleus,
    regrowth: Math.max(0, (p - 0.55) / 0.45),
  };
}
export const macaqueOutcomes = {
  surrogates: 21,
  pregnancies: 6,
  healthyInfants: 2,
  nuclearDNA: 'fibroblast donor',
  mitochondrialDNA: 'oocyte donor',
} as const;

function filmProgress(seconds: number, points: readonly (readonly [number, number])[]) {
  const t = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  for (let i = 1; i < points.length; i++) {
    if (t <= points[i][0]) {
      const [a, x] = points[i - 1],
        [b, y] = points[i];
      return x + (y - x) * smooth((t - a) / (b - a));
    }
  }
  return points[points.length - 1][1];
}

/** Chapter-local seconds, including the measured 0.45 s audio lead-in.
 * These are presentation cues, not biological rates or experimental measurements. */
export function nuclearFilmProgress(chapter: number, seconds: number, locale: string) {
  const en = locale === 'en';
  const cues: (readonly (readonly [number, number])[])[] = [
    [
      [0, 0],
      [3.5, 0],
      [en ? 8.5 : 7.8, 0.4],
      [en ? 13.5 : 11, 0.72],
      [en ? 15.4 : 13.5, 1],
    ],
    [
      [0, 0],
      [2, 0],
      [en ? 7.5 : 6.4, 0.4],
      [en ? 8 : 7, 0.72],
      [en ? 9.7 : 8.5, 1],
    ],
    [
      [0, 0],
      [3.5, 0],
      [en ? 7.1 : 6.5, 0.43],
      [en ? 7.6 : 7.1, 0.48],
      [en ? 9.8 : 9.4, 0.66],
      [12.6, 1],
    ],
    [
      [0, 0],
      [3, 0],
      [en ? 11.9 : 11.6, 0.38],
      [en ? 14.2 : 14.6, 0.65],
      [en ? 16.2 : 17, 1],
    ],
    [
      [0, 0],
      [en ? 5.5 : 4.4, 0],
      [en ? 9.2 : 7.8, 0.55],
      [en ? 12.5 : 11.3, 1],
    ],
    [
      [0, 0],
      [en ? 5.6 : 6.8, 0.2],
      [en ? 8.5 : 10.2, 0.4],
      [en ? 10.2 : 12.1, 0.65],
      [en ? 11.8 : 14.9, 1],
    ],
    [
      [0, 0],
      [en ? 6.1 : 5.5, 0],
      [en ? 8.5 : 7.4, 0.4],
      [en ? 9 : 8, 0.72],
      [en ? 12.2 : 10.3, 1],
    ],
  ];
  return filmProgress(seconds, cues[Math.min(6, Math.max(0, Math.floor(chapter) || 0))]);
}
