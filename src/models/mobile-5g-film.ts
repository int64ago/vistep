import {
  lteEquivalentRate,
  nrPeakRate,
  modulationForSnr,
  type Material,
  type Modulation,
} from './mobile-5g';

export type M5gView = 'box' | 'ofdm' | 'qam' | 'band' | 'path' | 'beam' | 'layers' | 'share';
export const M5G_VIEWS: readonly M5gView[] = [
  'box',
  'ofdm',
  'qam',
  'band',
  'path',
  'beam',
  'layers',
  'share',
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (v: number) => {
  const p = clamp01(v);
  return p * p * (3 - 2 * p);
};
export const ramp = (p: number, start: number, end: number) => smooth((p - start) / (end - start));

/** Rate-box stages: each step changes exactly one factor of the peak-rate formula. */
export function boxStages() {
  const lte = lteEquivalentRate({ bandwidthMHz: 20, layers: 2, modulation: 6 });
  const wide = nrPeakRate({ bandwidthMHz: 100, scsKHz: 30, layers: 2, modulation: 6 });
  const deep = nrPeakRate({ bandwidthMHz: 100, scsKHz: 30, layers: 2, modulation: 8 });
  const tall = nrPeakRate({ bandwidthMHz: 100, scsKHz: 30, layers: 4, modulation: 8 });
  // Widening changes resource elements per second (drawn width) and, separately, the overhead
  // assumption (NR 0.14 vs the LTE-equivalent ≈ 0.19); the chip shows both parts.
  const rePerSecond = (273 * 12 * 28_000) / (100 * 12 * 14_000);
  return [
    { rate: lte, factor: 1 },
    { rate: wide, factor: wide / lte, bandwidth: rePerSecond, overhead: wide / lte / rePerSecond },
    { rate: deep, factor: deep / wide },
    { rate: tall, factor: tall / deep },
  ];
}

export type M5gShot = ReturnType<typeof m5gShot>;

/**
 * Beats as fractions of each measured chapter window. They follow the spoken sentences in BOTH
 * recordings: pause onsets were measured from the zh and en tracks (2026-09-26) and every beat
 * starts on or just after the later of the two sentence boundaries. Re-measured on the final
 * recordings (mobile-5g-zh-64ac1c2ac74c / -en-2f8a7a03ca2c, 227 s).
 */
export const M5G_BEATS = {
  box: { width: [0.58, 0.69], depth: [0.7, 0.77], height: [0.78, 0.85] },
  ofdm: { carriers: [0.08, 0.36], cursor: [0.44, 0.66], grid: [0.68, 0.74], fill: [0.75, 0.95] },
  qam: { m16: 0.3, m64: 0.34, m256: 0.38, snr: [0.53, 0.72], fallback: 0.85 },
  band: { widen: [0.34, 0.5], aggregate: [0.78, 0.86] },
  path: { panel: [0.42, 0.54], glass: [0.74, 0.79], concrete: 0.845 },
  beam: {
    four: 0.21,
    target: [0.42, 0.52],
    steer: [0.45, 0.6],
    sixteen: 0.67,
    planar: [0.8, 0.85],
  },
  layers: {
    two: 0.22,
    four: 0.36,
    slots: [0.5, 0.56],
    rows: [0.56, 0.61, 0.66],
    arrival: [0.66, 0.72],
  },
  share: { users: [0.19, 0.33], backhaul: [0.37, 0.45], snr: [0.52, 0.66], lte: [0.8, 0.88] },
} as const;

/** Chapter-relative and deterministic: every seek selects the entire teaching state. */
export function m5gShot(chapter: number, progress: number) {
  if (![chapter, progress].every(Number.isFinite)) throw new RangeError('Finite film position');
  const c = Math.max(0, Math.min(7, Math.floor(chapter)));
  const p = clamp01(progress);
  const view = M5G_VIEWS[c];
  const B = M5G_BEATS;
  const r = (w: readonly [number, number]) => ramp(p, w[0], w[1]);

  // 01 · rate box: the first frame is already a settled 4G box (reduced-motion resting frame)
  const box = {
    fill: 1,
    width: r(B.box.width),
    depth: r(B.box.depth),
    height: r(B.box.height),
    ghost: r(B.box.width),
  };

  // 02 · OFDM spectra → resource grid
  const ofdm = {
    carriers: 1 + Math.round(6 * r(B.ofdm.carriers)),
    // cursor dwells on each subcarrier centre in turn (in units of Δf)
    cursor: (() => {
      const s = clamp01((p - B.ofdm.cursor[0]) / (B.ofdm.cursor[1] - B.ofdm.cursor[0])) * 6;
      const k = Math.min(5, Math.floor(s));
      return -3 + k + smooth(Math.min(1, (s - k) * 1.8));
    })(),
    cursorOn:
      ramp(p, B.ofdm.cursor[0] - 0.03, B.ofdm.cursor[0]) *
      (1 - ramp(p, B.ofdm.cursor[1], B.ofdm.grid[0])),
    grid: r(B.ofdm.grid),
    filled: r(B.ofdm.fill),
  };

  // 03 · constellation and noise
  const q = B.qam;
  let qamModulation: Modulation = p < q.m16 ? 2 : p < q.m64 ? 4 : p < q.m256 ? 6 : 8;
  const stageStart = p < q.m16 ? 0 : p < q.m64 ? q.m16 : p < q.m256 ? q.m64 : q.m256;
  const snrDb = 32 - 16 * r(q.snr);
  let qamCount = Math.round(
    60 + 400 * ramp(p, stageStart, stageStart + (stageStart === 0 ? 0.16 : 0.1)),
  );
  if (p >= q.fallback) {
    qamModulation = modulationForSnr(16) ?? 2;
    qamCount = Math.round(60 + 400 * ramp(p, q.fallback, q.fallback + 0.08));
  }
  const qam = { modulation: qamModulation, snrDb, count: qamCount };

  // 04 · wider channel
  const band = { widen: r(B.band.widen), aggregate: r(B.band.aggregate) };

  // 05 · path loss and blockage
  let material: Material | null = null;
  if (p >= B.path.glass[0]) material = p < B.path.concrete ? 'glass' : 'concrete';
  const path = {
    panel: r(B.path.panel),
    material,
    wall: r(B.path.glass),
  };

  // 06 · array factor, ending on one row of an 8 × 8 planar panel
  const planar = r(B.beam.planar);
  const elements = p < B.beam.four ? 1 : p < B.beam.sixteen ? 4 : planar >= 0.5 ? 8 : 16;
  const beam = {
    elements,
    steerDeg: 30 * r(B.beam.steer),
    target: 30 * r(B.beam.target),
    planar,
  };

  // 07 · layers, then numerology
  const layers = {
    count: p < B.layers.two ? 1 : p < B.layers.four ? 2 : 4,
    stack: 1,
    slots: r(B.layers.slots),
    rows: B.layers.rows.map((at) => ramp(p, at - 0.03, at + 0.02)),
    arrival: r(B.layers.arrival),
  };

  // 08 · sharing, backhaul and position
  const users = 1 + Math.round(9 * r(B.share.users));
  const share = {
    users,
    backhaul: r(B.share.backhaul),
    snrDb: 30 - 18 * r(B.share.snr),
    lte: r(B.share.lte),
  };

  return { view, p, box, ofdm, qam, band, path, beam, layers, share };
}
