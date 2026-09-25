/**
 * 4G/5G radio teaching model: where the downlink rate comes from.
 *
 * Every number the scene draws comes from here: resource-block tables, the 3GPP TS 38.306
 * approximate peak-rate formula, OFDM subcarrier spectra, square QAM with seeded Gaussian noise,
 * free-space loss, TR 38.901 material penetration loss, uniform-array factors and cell sharing.
 * Units are SI unless a name says otherwise (MHz, kHz, GHz, dB, ms).
 */

export const C = 299_792_458;
/** TS 38.306 §4.1.2: highest LDPC code rate used in the approximate peak-rate formula. */
export const R_MAX = 948 / 1024;
/** TS 38.306 §4.1.2 overhead OH^(j). */
export const NR_OVERHEAD = {
  FR1: { DL: 0.14, UL: 0.08 },
  FR2: { DL: 0.18, UL: 0.1 },
} as const;
export type FrequencyRange = keyof typeof NR_OVERHEAD;
export type LinkDirection = 'DL' | 'UL';
export type Modulation = 2 | 4 | 6 | 8;
export const MODULATIONS: readonly Modulation[] = [2, 4, 6, 8];
export const MODULATION_NAME: Record<Modulation, string> = {
  2: 'QPSK',
  4: '16QAM',
  6: '64QAM',
  8: '256QAM',
};

/**
 * Maximum transmission bandwidth configuration N_RB.
 * FR1: TS 38.101-1 Table 5.3.2-1; FR2: TS 38.101-2 Table 5.3.2-1. Keys are channel bandwidth in MHz.
 */
export const NR_RB_TABLE: Record<FrequencyRange, Record<number, Record<number, number>>> = {
  FR1: {
    15: { 5: 25, 10: 52, 15: 79, 20: 106, 25: 133, 30: 160, 40: 216, 50: 270 },
    30: {
      5: 11,
      10: 24,
      15: 38,
      20: 51,
      25: 65,
      30: 78,
      40: 106,
      50: 133,
      60: 162,
      70: 189,
      80: 217,
      90: 245,
      100: 273,
    },
    60: {
      10: 11,
      15: 18,
      20: 24,
      25: 31,
      30: 38,
      40: 51,
      50: 65,
      60: 79,
      70: 93,
      80: 107,
      90: 121,
      100: 135,
    },
  },
  FR2: {
    60: { 50: 66, 100: 132, 200: 264 },
    120: { 50: 32, 100: 66, 200: 132, 400: 264 },
  },
};
/** LTE transmission bandwidth configuration N_RB, TS 36.101 Table 5.6-1. */
export const LTE_RB_TABLE: Record<number, number> = {
  1.4: 6,
  3: 15,
  5: 25,
  10: 50,
  15: 75,
  20: 100,
};
/** Subcarriers per resource block, identical in LTE and NR. */
export const SUBCARRIERS_PER_RB = 12;
export const SYMBOLS_PER_SLOT = 14;

const finite = (...values: number[]) => values.every(Number.isFinite);
const req = (ok: boolean, message: string) => {
  if (!ok) throw new RangeError(message);
};
export const db = (linear: number) => 10 * Math.log10(linear);
export const fromDb = (value: number) => 10 ** (value / 10);

/** NR numerology μ from subcarrier spacing (TS 38.211 §4.2: Δf = 2^μ · 15 kHz). */
export function numerology(scsKHz: number) {
  const mu = Math.log2(scsKHz / 15);
  req(Number.isInteger(mu) && mu >= 0 && mu <= 6, `Unsupported subcarrier spacing ${scsKHz} kHz`);
  const slotMs = 1 / 2 ** mu;
  const usefulSymbolUs = 1000 / scsKHz;
  return {
    mu,
    scsKHz,
    slotMs,
    slotsPerSubframe: 2 ** mu,
    /** Average OFDM symbol duration T_s^μ used by TS 38.306, in seconds (includes cyclic prefix). */
    symbolS: 1e-3 / (SYMBOLS_PER_SLOT * 2 ** mu),
    /** Useful (FFT) part of a symbol, 1/Δf. */
    usefulSymbolUs,
    /** Average cyclic prefix = average symbol − useful part. */
    cyclicPrefixUs: (slotMs * 1000) / SYMBOLS_PER_SLOT - usefulSymbolUs,
    rbWidthKHz: SUBCARRIERS_PER_RB * scsKHz,
  };
}

export function nrResourceBlocks(
  bandwidthMHz: number,
  scsKHz: number,
  range: FrequencyRange = 'FR1',
) {
  const n = NR_RB_TABLE[range]?.[scsKHz]?.[bandwidthMHz];
  req(n !== undefined, `No ${range} N_RB for ${bandwidthMHz} MHz at ${scsKHz} kHz`);
  return n;
}
export function nrBandwidths(scsKHz: number, range: FrequencyRange = 'FR1') {
  return Object.keys(NR_RB_TABLE[range][scsKHz] ?? {})
    .map(Number)
    .sort((a, b) => a - b);
}
export function lteResourceBlocks(bandwidthMHz: number) {
  const n = LTE_RB_TABLE[bandwidthMHz];
  req(n !== undefined, `No LTE N_RB for ${bandwidthMHz} MHz`);
  return n;
}

export type NrCarrier = {
  bandwidthMHz: number;
  scsKHz: number;
  layers: number;
  modulation: Modulation;
  /** Scaling factor f^(j) ∈ {1, 0.8, 0.75, 0.4}. */
  scaling?: number;
  range?: FrequencyRange;
  direction?: LinkDirection;
};

/**
 * TS 38.306 §4.1.2 approximate data rate for one carrier, in bit/s:
 * 1e-6 · v_layers · Q_m · f · R_max · (N_PRB · 12) / T_s^μ · (1 − OH), here kept in bit/s.
 */
export function nrPeakRate(carrier: NrCarrier) {
  const { bandwidthMHz, scsKHz, layers, modulation } = carrier;
  const scaling = carrier.scaling ?? 1,
    range = carrier.range ?? 'FR1',
    direction = carrier.direction ?? 'DL';
  req(Number.isInteger(layers) && layers >= 1 && layers <= 8, 'Layers must be 1–8');
  req(MODULATIONS.includes(modulation), 'Q_m must be 2, 4, 6 or 8');
  req([1, 0.8, 0.75, 0.4].includes(scaling), 'Scaling factor must be 1, 0.8, 0.75 or 0.4');
  const nPrb = nrResourceBlocks(bandwidthMHz, scsKHz, range);
  const { symbolS } = numerology(scsKHz);
  const overhead = NR_OVERHEAD[range][direction];
  return (
    layers * modulation * scaling * R_MAX * ((nPrb * SUBCARRIERS_PER_RB) / symbolS) * (1 - overhead)
  );
}
/** Sum over aggregated carriers j = 1..J, as in TS 38.306 §4.1.2. */
export function nrPeakRateAggregate(carriers: readonly NrCarrier[]) {
  req(carriers.length > 0, 'At least one carrier');
  return carriers.reduce((sum, c) => sum + nrPeakRate(c), 0);
}

/**
 * LTE has no TS 38.306-style formula; its peak is set by transport-block-size tables.
 * Reference points from TS 36.213 Table 7.1.7.2.1-1 (N_PRB = 100, one 1 ms TTI per layer):
 * I_TBS 26 → 75 376 bit (64QAM), I_TBS 33 of the 256QAM table → 97 896 bit.
 */
export const LTE_TBS_PEAK = {
  '2x64QAM': 2 * 75_376 * 1000,
  '4x256QAM': 4 * 97_896 * 1000,
} as const;
/**
 * Teaching overhead for the LTE equivalent: the same formula form with Δf = 15 kHz, 14 symbols per
 * ms and N_RB from TS 36.101, calibrated so 20 MHz, 2 layers and 64QAM equals the 150.752 Mbit/s
 * TBS peak. It lumps CRS, control region and code-rate differences; disclosed, not specified.
 */
export const LTE_EQUIVALENT_OVERHEAD =
  1 - LTE_TBS_PEAK['2x64QAM'] / (2 * 6 * R_MAX * ((100 * SUBCARRIERS_PER_RB) / (1e-3 / 14)));
export function lteEquivalentRate({
  bandwidthMHz,
  layers,
  modulation,
}: {
  bandwidthMHz: number;
  layers: number;
  modulation: Modulation;
}) {
  req(Number.isInteger(layers) && layers >= 1 && layers <= 8, 'Layers must be 1–8');
  req(MODULATIONS.includes(modulation), 'Q_m must be 2, 4, 6 or 8');
  const nRb = lteResourceBlocks(bandwidthMHz);
  return (
    layers *
    modulation *
    R_MAX *
    ((nRb * SUBCARRIERS_PER_RB) / (1e-3 / 14)) *
    (1 - LTE_EQUIVALENT_OVERHEAD)
  );
}

/** Occupied transmission bandwidth N_RB · 12 · Δf, in MHz (guard bands excluded). */
export const occupiedMHz = (nRb: number, scsKHz: number) =>
  (nRb * SUBCARRIERS_PER_RB * scsKHz) / 1000;

/** The same rate expressed as three multiplying dimensions of the scene's "rate box". */
export function rateBox(system: 'LTE' | 'NR', layers: number, modulation: Modulation) {
  const nRb = system === 'LTE' ? 100 : 273,
    scs = system === 'LTE' ? 15 : 30;
  const rate =
    system === 'LTE'
      ? lteEquivalentRate({ bandwidthMHz: 20, layers, modulation })
      : nrPeakRate({ bandwidthMHz: 100, scsKHz: 30, layers, modulation });
  // resource elements delivered per second per layer
  const rePerSecond = (nRb * SUBCARRIERS_PER_RB * 14 * (scs / 15)) / 1e-3;
  return {
    system,
    nRb,
    scsKHz: scs,
    occupiedMHz: occupiedMHz(nRb, scs),
    layers,
    modulation,
    rePerSecond,
    rate,
  };
}

// ---------------------------------------------------------------- OFDM

/** Normalized sinc, sin(πx)/(πx). */
export const sinc = (x: number) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));
/**
 * Amplitude spectrum of subcarrier k (rectangular symbol of length 1/Δf) at frequency offset f,
 * both expressed in units of Δf. Orthogonality: zero at every other integer.
 */
export const subcarrierSpectrum = (k: number, f: number) => sinc(f - k);
/** Inner product of two subcarriers over one useful symbol, numerically (≈ δ_kl). */
export function subcarrierCorrelation(k: number, l: number, samples = 256, offset = 0) {
  req(Number.isInteger(samples) && samples >= 8, 'samples ≥ 8');
  let re = 0,
    im = 0;
  for (let n = 0; n < samples; n++) {
    const t = n / samples;
    const phase = 2 * Math.PI * (k - (l + offset)) * t;
    re += Math.cos(phase);
    im += Math.sin(phase);
  }
  return Math.hypot(re, im) / samples;
}

// ---------------------------------------------------------------- QAM

export type ConstellationPoint = { i: number; q: number; bits: string };
function gray(n: number) {
  return n ^ (n >> 1);
}
/** Square Gray-mapped M-QAM with unit average energy (QPSK = 4-QAM). */
export function constellation(modulation: Modulation): ConstellationPoint[] {
  req(MODULATIONS.includes(modulation), 'Unsupported modulation');
  const side = 2 ** (modulation / 2),
    half = modulation / 2;
  const scale = Math.sqrt((2 * (side * side - 1)) / 3);
  const points: ConstellationPoint[] = [];
  for (let a = 0; a < side; a++)
    for (let b = 0; b < side; b++) {
      const gi = gray(a).toString(2).padStart(half, '0'),
        gq = gray(b).toString(2).padStart(half, '0');
      let bits = '';
      for (let k = 0; k < half; k++) bits += gi[k] + gq[k];
      points.push({ i: (2 * a - side + 1) / scale, q: (2 * b - side + 1) / scale, bits });
    }
  return points;
}
/** Half the minimum distance between neighbouring points at unit average energy. */
export const halfSpacing = (modulation: Modulation) =>
  1 / Math.sqrt((2 * (2 ** modulation - 1)) / 3);

/** Deterministic PRNG (mulberry32) and Box–Muller Gaussian pairs. */
export function seededUniform(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function seededGaussian(seed: number) {
  const uniform = seededUniform(seed);
  return () => {
    const u = Math.max(uniform(), 1e-12),
      v = uniform();
    const r = Math.sqrt(-2 * Math.log(u));
    return [r * Math.cos(2 * Math.PI * v), r * Math.sin(2 * Math.PI * v)] as const;
  };
}

export type ReceivedSymbol = {
  sent: number;
  i: number;
  q: number;
  decided: number;
  error: boolean;
};
/**
 * Received samples for a fixed symbol sequence over AWGN at SNR = Es/N0.
 * Noise per real dimension has variance 1/(2·SNR). A given seed returns the same unit noise
 * for every SNR and modulation, so a comparison changes only the scale, never the draw.
 */
export function receive(modulation: Modulation, snrDb: number, count: number, seed = 5) {
  req(finite(snrDb) && snrDb >= -20 && snrDb <= 60, 'SNR must be −20…60 dB');
  req(Number.isInteger(count) && count >= 0 && count <= 20000, 'count 0–20000');
  const points = constellation(modulation),
    sigma = Math.sqrt(1 / (2 * fromDb(snrDb)));
  const draw = seededGaussian(seed),
    pick = seededUniform(seed ^ 0x9e3779b9);
  const out: ReceivedSymbol[] = [];
  for (let n = 0; n < count; n++) {
    const sent = Math.min(points.length - 1, Math.floor(pick() * points.length));
    const [ni, nq] = draw();
    const i = points[sent].i + sigma * ni,
      q = points[sent].q + sigma * nq;
    const decided = decide(modulation, i, q);
    out.push({ sent, i, q, decided, error: decided !== sent });
  }
  return out;
}
/** Nearest-point decision for square QAM (independent per axis). */
export function decide(modulation: Modulation, i: number, q: number) {
  const side = 2 ** (modulation / 2),
    scale = Math.sqrt((2 * (side * side - 1)) / 3);
  const idx = (v: number) =>
    Math.max(0, Math.min(side - 1, Math.round((v * scale + side - 1) / 2)));
  return idx(i) * side + idx(q);
}
/** Gaussian tail Q(x) via a complementary error function (Abramowitz–Stegun 7.1.26 refinement). */
export function qFunction(x: number) {
  const z = x / Math.SQRT2,
    t = 1 / (1 + 0.5 * Math.abs(z));
  const erfc =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520398 +
                                t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
    );
  return 0.5 * (z >= 0 ? erfc : 2 - erfc);
}
/** Exact symbol error probability of square M-QAM over AWGN at Es/N0 (uncoded). */
export function symbolErrorRate(modulation: Modulation, snrDb: number) {
  const m = 2 ** modulation,
    side = Math.sqrt(m);
  const p = 2 * (1 - 1 / side) * qFunction(Math.sqrt((3 * fromDb(snrDb)) / (m - 1)));
  return 1 - (1 - p) ** 2;
}
/** Teaching threshold: SNR at which uncoded symbol errors fall to the target (bisection). */
export function thresholdSnrDb(modulation: Modulation, target = 0.01) {
  req(target > 0 && target < 0.5, 'target in (0, 0.5)');
  let lo = -10,
    hi = 60;
  for (let n = 0; n < 60; n++) {
    const mid = (lo + hi) / 2;
    if (symbolErrorRate(modulation, mid) > target) lo = mid;
    else hi = mid;
  }
  return hi;
}
/**
 * The densest constellation whose uncoded symbol error stays within the teaching target.
 * Real link adaptation uses coded CQI/MCS tables and lower thresholds; this table is only a
 * visible rule for the scene. Returns null when even QPSK fails.
 */
export function modulationForSnr(snrDb: number, target = 0.01): Modulation | null {
  let best: Modulation | null = null;
  for (const m of MODULATIONS) if (symbolErrorRate(m, snrDb) <= target) best = m;
  return best;
}
/** Shannon capacity bound per resource element, log2(1 + SNR), in bit. */
export const shannonBits = (snrDb: number) => Math.log2(1 + fromDb(snrDb));

// ---------------------------------------------------------------- propagation

/** Free-space path loss between isotropic antennas (Friis), dB. */
export function fsplDb(distanceM: number, frequencyHz: number) {
  req(finite(distanceM, frequencyHz) && distanceM > 0 && frequencyHz > 0, 'Positive d and f');
  return 20 * Math.log10((4 * Math.PI * distanceM * frequencyHz) / C);
}
/** Gain of an ideal aperture of physical area A (efficiency 1): G = 4πA/λ², dBi. */
export function apertureGainDb(areaM2: number, frequencyHz: number) {
  req(areaM2 > 0 && frequencyHz > 0, 'Positive area and f');
  const lambda = C / frequencyHz;
  return db((4 * Math.PI * areaM2) / (lambda * lambda));
}
/** Elements that fit on a square panel of side L at half-wavelength spacing. */
export function elementsOnPanel(sideM: number, frequencyHz: number) {
  const perSide = Math.max(1, Math.floor(sideM / (C / frequencyHz / 2)));
  return { perSide, total: perSide * perSide };
}

export type Material = 'glass' | 'irrGlass' | 'concrete' | 'wood';
/** TR 38.901 Table 7.4.3-1 material penetration loss, f in GHz, result in dB. */
export const MATERIAL_LOSS: Record<Material, (fGHz: number) => number> = {
  glass: (f) => 2 + 0.2 * f,
  irrGlass: (f) => 23 + 0.3 * f,
  concrete: (f) => 5 + 4 * f,
  wood: (f) => 4.85 + 0.12 * f,
};
export function materialLossDb(material: Material, frequencyGHz: number) {
  req(frequencyGHz >= 0.5 && frequencyGHz <= 100, 'TR 38.901 range 0.5–100 GHz');
  return MATERIAL_LOSS[material](frequencyGHz);
}

export type PathProfile = {
  distanceM: number[];
  levelDb: number[];
  wallAt: number | null;
  wallLossDb: number;
};
/**
 * Received level along a straight path, relative to 3.5 GHz isotropic at 1 m (dB).
 * The base-station antenna may add gain; a wall adds its penetration loss beyond wallAt.
 */
export function pathProfile({
  frequencyGHz,
  txGainDb = 0,
  material = null,
  wallAt = 120,
  maxM = 300,
  samples = 121,
}: {
  frequencyGHz: number;
  txGainDb?: number;
  material?: Material | null;
  wallAt?: number;
  maxM?: number;
  samples?: number;
}): PathProfile {
  req(samples >= 2 && maxM > 1, 'samples ≥ 2, maxM > 1');
  const ref = fsplDb(1, 3.5e9),
    wall = material ? materialLossDb(material, frequencyGHz) : 0;
  const distanceM: number[] = [],
    levelDb: number[] = [];
  for (let n = 0; n < samples; n++) {
    const d = 1 + ((maxM - 1) * n) / (samples - 1);
    distanceM.push(d);
    levelDb.push(
      ref - fsplDb(d, frequencyGHz * 1e9) + txGainDb - (material && d > wallAt ? wall : 0),
    );
  }
  return { distanceM, levelDb, wallAt: material ? wallAt : null, wallLossDb: wall };
}

// ---------------------------------------------------------------- arrays

/** Per-element progressive phase (radians) steering a half-λ ULA toward θ0 from broadside. */
export function steeringPhases(elements: number, steerDeg: number, spacingWavelengths = 0.5) {
  req(Number.isInteger(elements) && elements >= 1 && elements <= 256, 'elements 1–256');
  const k = 2 * Math.PI * spacingWavelengths * Math.sin((steerDeg * Math.PI) / 180);
  return Array.from({ length: elements }, (_, n) => -k * (n - (elements - 1) / 2));
}
/** Normalized array factor magnitude |AF(θ)|/N of a uniform linear array (isotropic elements). */
export function arrayFactor(
  elements: number,
  steerDeg: number,
  thetaDeg: number,
  spacingWavelengths = 0.5,
) {
  const psi =
    2 *
    Math.PI *
    spacingWavelengths *
    (Math.sin((thetaDeg * Math.PI) / 180) - Math.sin((steerDeg * Math.PI) / 180));
  let re = 0,
    im = 0;
  for (let n = 0; n < elements; n++) {
    re += Math.cos(n * psi);
    im += Math.sin(n * psi);
  }
  return Math.hypot(re, im) / elements;
}
/** Array gain over one element toward the steered direction (coherent sum, equal power). */
export const arrayGainDb = (elements: number) => db(elements);
/** Numerically measured −3 dB (half-power) beamwidth around the steered direction, degrees. */
export function halfPowerBeamwidth(elements: number, steerDeg: number, spacingWavelengths = 0.5) {
  if (elements === 1) return 180;
  const half = Math.SQRT1_2;
  const edge = (dir: 1 | -1) => {
    let theta = steerDeg;
    while (
      Math.abs(theta) < 90 &&
      arrayFactor(elements, steerDeg, theta, spacingWavelengths) > half
    )
      theta += dir * 0.01;
    return theta;
  };
  return edge(1) - edge(-1);
}
/** Strongest side lobe relative to the main lobe, dB (≈ −13.3 dB for large uniform arrays). */
export function peakSidelobeDb(elements: number, steerDeg = 0, spacingWavelengths = 0.5) {
  if (elements < 3) return -Infinity;
  const values: number[] = [];
  for (let t = -90; t <= 90; t += 0.05)
    values.push(arrayFactor(elements, steerDeg, t, spacingWavelengths));
  const s = Math.sin((steerDeg * Math.PI) / 180),
    null1 = Math.asin(Math.max(-1, Math.min(1, s + 1 / (elements * spacingWavelengths))));
  const nullDeg = (null1 * 180) / Math.PI,
    width = Math.abs(nullDeg - steerDeg);
  let peak = 0;
  values.forEach((v, i) => {
    const t = -90 + i * 0.05;
    if (Math.abs(t - steerDeg) > width * 1.02) peak = Math.max(peak, v);
  });
  return 20 * Math.log10(peak);
}
/**
 * Instantaneous field of a half-λ line array at point (x, y) in wavelengths, elements on the
 * x axis centred at the origin, radiating toward +y. Cylindrical 1/√r spreading (2D picture).
 */
export function arrayField(
  x: number,
  y: number,
  phases: readonly number[],
  wavePhase: number,
  spacingWavelengths = 0.5,
) {
  let re = 0,
    im = 0;
  const n0 = (phases.length - 1) / 2;
  for (let n = 0; n < phases.length; n++) {
    const ex = (n - n0) * spacingWavelengths,
      r = Math.hypot(x - ex, y) + 1e-6;
    const a = 1 / Math.sqrt(r + 0.5),
      p = 2 * Math.PI * r - phases[n];
    re += a * Math.cos(p - wavePhase);
    im += a * Math.sin(p - wavePhase);
  }
  return { re, im };
}

// ---------------------------------------------------------------- spatial layers & slots

/**
 * Spatial multiplexing: at most min(Tx, Rx) layers, and never more than the channel rank.
 * Rank is an input here (a teaching stand-in for how many independent paths exist).
 */
export function usableLayers(txAntennas: number, rxAntennas: number, channelRank = Infinity) {
  req(txAntennas >= 1 && rxAntennas >= 1 && channelRank >= 1, 'Counts ≥ 1');
  return Math.min(txAntennas, rxAntennas, Math.floor(channelRank), 8);
}
/**
 * Wait until the next slot boundary for data that arrives at arrivalMs (scheduling only;
 * processing, HARQ and TDD patterns omitted).
 */
export function waitForSlotMs(arrivalMs: number, scsKHz: number) {
  const { slotMs } = numerology(scsKHz);
  const next = Math.ceil(arrivalMs / slotMs - 1e-9) * slotMs;
  return next - arrivalMs;
}

// ---------------------------------------------------------------- sharing a cell

export type ShareInput = {
  peakBitsPerSecond: number;
  /** Active users sharing the scheduler (round-robin in resource elements). */
  users: number;
  /** Actual fraction of resource elements given to this user; defaults to 1/users. */
  share?: number;
  /** Bits per resource element available at the user's position divided by the peak Q_m. */
  modulationRatio: number;
  /** Transport capacity behind the base station, bit/s, shared by the same users. */
  backhaulBitsPerSecond: number;
};
/** Equal-time share of a cell, then capped by an equally shared backhaul. */
export function userThroughput({
  peakBitsPerSecond,
  users,
  share = 1 / users,
  modulationRatio,
  backhaulBitsPerSecond,
}: ShareInput) {
  req(Number.isInteger(users) && users >= 1, 'users ≥ 1');
  req(share > 0 && share <= 1, 'share in (0, 1]');
  req(modulationRatio >= 0 && modulationRatio <= 1, 'ratio 0–1');
  req(peakBitsPerSecond > 0 && backhaulBitsPerSecond > 0, 'Positive capacities');
  const radio = peakBitsPerSecond * modulationRatio * share;
  const transport = backhaulBitsPerSecond / users;
  return {
    radio,
    transport,
    rate: Math.min(radio, transport),
    limitedBy: radio <= transport ? 'radio' : 'backhaul',
  } as const;
}

export function formatRate(bitsPerSecond: number) {
  if (bitsPerSecond >= 1e9) return { value: (bitsPerSecond / 1e9).toFixed(2), unit: 'Gbit/s' };
  if (bitsPerSecond >= 1e8) return { value: (bitsPerSecond / 1e6).toFixed(0), unit: 'Mbit/s' };
  return { value: (bitsPerSecond / 1e6).toFixed(1), unit: 'Mbit/s' };
}

/**
 * Resource-block groups of a carrier (TS 38.214 Table 5.1.2.2.1-1 nominal size; the last group
 * takes the remainder). Used to draw and count the cells a scheduler hands out.
 */
export function rbGroups(nRb: number, groupSize: number) {
  req(Number.isInteger(nRb) && nRb > 0 && Number.isInteger(groupSize) && groupSize > 0, 'Positive');
  const groups: { start: number; size: number }[] = [];
  for (let start = 0; start < nRb; start += groupSize)
    groups.push({ start, size: Math.min(groupSize, nRb - start) });
  return groups;
}
/**
 * Round-robin allocation of (group, symbol) cells to users in one slot, cell index = symbol·G + group,
 * with the starting user rotated by one every slot. `slotShare` is each user's resource-element
 * share in the drawn slot (it differs slightly because group sizes differ); `share` is the long-run
 * share averaged over `users` consecutive slots, in which every cell visits every user once, so it
 * is exactly equal (1/users) and a 4G/5G comparison with the same users is fair.
 */
export function allocateCells(
  groups: readonly { size: number }[],
  symbols: number,
  users: number,
  slot = 0,
) {
  req(Number.isInteger(users) && users >= 1 && users <= 64, 'users 1–64');
  req(Number.isInteger(symbols) && symbols >= 1, 'symbols ≥ 1');
  req(Number.isInteger(slot) && slot >= 0, 'slot ≥ 0');
  const perSlot = (k: number) => {
    const owner: number[] = [],
      weight = new Array<number>(users).fill(0);
    let total = 0;
    for (let s = 0; s < symbols; s++)
      groups.forEach((g, i) => {
        const u = (s * groups.length + i + k) % users;
        owner.push(u);
        weight[u] += g.size;
        total += g.size;
      });
    return { owner, share: weight.map((w) => w / total) };
  };
  const drawn = perSlot(slot);
  const share = new Array<number>(users).fill(0);
  for (let k = 0; k < users; k++)
    perSlot(slot + k).share.forEach((v, u) => (share[u] += v / users));
  return { owner: drawn.owner, slotShare: drawn.share, share };
}
