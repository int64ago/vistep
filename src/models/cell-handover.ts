import { ByteCache } from './byte-cache';

/**
 * Cellular coverage and connected-mode handover — an independent teaching model.
 *
 * Geometry and propagation follow the 3GPP macro evaluation layout (TR 36.814 Annex A.2.1.1):
 * hexagonal three-sector sites, 500 m inter-site distance, 2 GHz macro path loss
 * `128.1 + 37.6·log10(R km)`, the parabolic horizontal antenna pattern with a 70° beamwidth and
 * 25 dB front-to-back limit, and log-normal shadowing with 50 m decorrelation distance and 0.5
 * correlation between sites. The shadowing field is a deterministic, seeded lattice, so every run,
 * chapter and comparison sees exactly the same terrain.
 *
 * Connected-mode mobility follows the RRC measurement framework (TS 36.331 §5.5): layer-3
 * filtering `F = (1−a)F + aM`, `a = 1/2^(k/4)` specified at a 200 ms sample rate, and event A3
 * `Mn − Hys > Ms + Off` held for `timeToTrigger`. Radio-link failure uses a simplified
 * out-of-sync threshold and T310 timer. Idle reselection follows the TS 36.304 ranking
 * criterion `Rn > Rs` with `Rs = Qs + Qhyst` for `Treselection`.
 *
 * Teaching simplifications (disclosed in the article): no vertical antenna pattern, no fast-fading
 * simulation (its residue after L1 averaging is a small seeded fluctuation), SINR assumes every
 * cell fully loaded, handover execution is a fixed delay, and there is one carrier frequency.
 */

export const CH_TTT_MS = [
  0, 40, 64, 80, 100, 128, 160, 256, 320, 480, 512, 640, 1024, 1280, 2560, 5120,
] as const;

const log10 = Math.log10;
export const CH = {
  widthM: 2000,
  heightM: 1150,
  isdM: 500,
  /** 46 dBm over 10 MHz = 600 subcarriers: power per resource element. */
  macroReDbm: 46 - 10 * log10(600),
  macroGainDbi: 14,
  /** The handset rides a bus: O2I car penetration loss, mean value (TR 38.901 §7.4.3.2). */
  vehicleLossDb: 9,
  theta3dBDeg: 70,
  frontBackDb: 25,
  minDistanceM: 35,
  mastHeightM: 32,
  handsetHeightM: 1.5,
  /** Thermal noise per 15 kHz subcarrier + 9 dB UE noise figure. */
  noiseDbm: -174 + 10 * log10(15000) + 9,
  shadowSigmaDb: 6,
  shadowDecorrM: 50,
  siteCorrelation: 0.5,
  latticeM: 10,
  seed: 20260925,
  stepS: 0.04,
  l3K: 4,
  measSigmaDb: 1.6,
  measTauS: 0.3,
  qOutDb: -8,
  t310S: 1,
  hoExecS: 0.06,
  reestablishS: 1,
  pingPongS: 1,
  prbs: 50,
  rsrpMin: -140,
  rsrpMax: -44,
} as const;

export type ChSite = { id: number; name: string; x: number; y: number; ta: number };
export type ChCell = {
  id: number;
  site: number;
  label: string;
  /** Boresight in degrees, measured from +x towards +y (screen clockwise). */
  azimuth: number;
};
export type ChLayout = { sites: ChSite[]; cells: ChCell[]; isdM: number };

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/** Sector boresights for a flat-top hexagonal tiling whose cell side is ISD/3. */
export const CH_SECTORS = [0, 120, 240] as const;

/**
 * Hexagonal three-sector sites anchored at (250, 142) m. `isdM = 500` is the TR 36.814 case;
 * halving the spacing is the controlled "more, smaller cells" comparison.
 */
export function chLayout(isdM: number = CH.isdM): ChLayout {
  if (!(isdM >= 150 && isdM <= 1000)) throw new RangeError('Site spacing out of range');
  const sites: ChSite[] = [];
  const rowH = (isdM * Math.sqrt(3)) / 2,
    margin = isdM * 0.45;
  const r0 = Math.ceil((-margin - 142) / rowH),
    r1 = Math.floor((CH.heightM + margin - 142) / rowH);
  for (let row = r0; row <= r1; row++) {
    const y = 142 + row * rowH,
      shift = ((row % 2) + 2) % 2 ? -isdM / 2 : 0;
    const k0 = Math.ceil((-1 - 250 - shift) / isdM),
      k1 = Math.floor((CH.widthM + 1 - 250 - shift) / isdM);
    for (let k = k0; k <= k1; k++) {
      const id = sites.length;
      sites.push({
        id,
        name: id < 26 ? letters[id] : `${letters[id % 26]}${Math.floor(id / 26)}`,
        x: 250 + shift + k * isdM,
        y,
        ta: 250 + shift + k * isdM < 880 ? 0 : 1,
      });
    }
  }
  const cells: ChCell[] = [];
  for (const site of sites)
    CH_SECTORS.forEach((azimuth, k) =>
      cells.push({ id: cells.length, site: site.id, label: `${site.name}${k + 1}`, azimuth }),
    );
  return { sites, cells, isdM };
}

/** Flat-top hexagon of the textbook picture for one sector (the site sits at one vertex). */
export function chTextbookHex(layout: ChLayout, cell: ChCell) {
  const site = layout.sites[cell.site],
    r = layout.isdM / 3;
  const a = (cell.azimuth * Math.PI) / 180,
    cx = site.x + r * Math.cos(a),
    cy = site.y + r * Math.sin(a);
  return Array.from({ length: 6 }, (_, k) => {
    const v = (k * Math.PI) / 3;
    return [cx + r * Math.cos(v), cy + r * Math.sin(v)] as [number, number];
  });
}

// ——— deterministic randomness ———
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussian(rand: () => number) {
  const u = Math.max(1e-12, rand()),
    v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Unit-variance spatially correlated fields on a lattice, one per site plus a common field.
 * Forward/backward first-order smoothing gives ≈ `(1 + d/L)·e^(−d/L)` correlation with
 * L = 50 m. Site fields combine the common and own parts with correlation 0.5.
 */
export type ChShadow = {
  cols: number;
  rows: number;
  origin: number;
  step: number;
  fields: Float32Array[];
};
const shadowCache = new Map<string, ChShadow>();
export function chShadow(fieldCount: number, seed: number = CH.seed): ChShadow {
  const key = `${fieldCount}:${seed}`;
  const cached = shadowCache.get(key);
  if (cached) return cached;
  const step = CH.latticeM,
    origin = -200;
  const cols = Math.ceil((CH.widthM + 400) / step) + 1,
    rows = Math.ceil((CH.heightM + 400) / step) + 1;
  const rho = Math.exp(-step / CH.shadowDecorrM);
  const make = (s: number) => {
    const rand = mulberry32(s);
    const f = new Float32Array(cols * rows);
    for (let i = 0; i < f.length; i++) f[i] = gaussian(rand);
    const pass = (start: number, count: number, stride: number) => {
      let v = f[start];
      for (let k = 1; k < count; k++) {
        const i = start + k * stride;
        v = rho * v + (1 - rho) * f[i];
        f[i] = v;
      }
      v = f[start + (count - 1) * stride];
      for (let k = count - 2; k >= 0; k--) {
        const i = start + k * stride;
        v = rho * v + (1 - rho) * f[i];
        f[i] = v;
      }
    };
    for (let r = 0; r < rows; r++) pass(r * cols, cols, 1);
    for (let c = 0; c < cols; c++) pass(c, rows, cols);
    let sum = 0,
      sq = 0;
    for (const v of f) {
      sum += v;
      sq += v * v;
    }
    const mean = sum / f.length,
      sd = Math.sqrt(sq / f.length - mean * mean) || 1;
    for (let i = 0; i < f.length; i++) f[i] = (f[i] - mean) / sd;
    return f;
  };
  const common = make(seed);
  const a = Math.sqrt(CH.siteCorrelation),
    b = Math.sqrt(1 - CH.siteCorrelation);
  const fields = Array.from({ length: fieldCount }, (_, k) => {
    const own = make(seed + 7919 * (k + 1));
    const out = new Float32Array(own.length);
    for (let i = 0; i < out.length; i++) out[i] = a * common[i] + b * own[i];
    return out;
  });
  const shadow = { cols, rows, origin, step, fields };
  shadowCache.set(key, shadow);
  return shadow;
}
export function chShadowAt(shadow: ChShadow, field: number, x: number, y: number) {
  const f = shadow.fields[field];
  const gx = Math.max(0, Math.min(shadow.cols - 1.001, (x - shadow.origin) / shadow.step)),
    gy = Math.max(0, Math.min(shadow.rows - 1.001, (y - shadow.origin) / shadow.step));
  const i = Math.floor(gx),
    j = Math.floor(gy),
    u = gx - i,
    v = gy - j,
    k = j * shadow.cols + i;
  return (
    (f[k] * (1 - u) + f[k + 1] * u) * (1 - v) +
    (f[k + shadow.cols] * (1 - u) + f[k + shadow.cols + 1] * u) * v
  );
}

/** TR 36.814 horizontal pattern, relative to boresight gain (dB, ≤ 0). */
export function chAntennaDb(offBoresightDeg: number) {
  if (!Number.isFinite(offBoresightDeg)) throw new RangeError('Finite angle required');
  let phi = ((((offBoresightDeg + 180) % 360) + 360) % 360) - 180;
  if (phi === -180) phi = 180;
  return -Math.min(12 * (phi / CH.theta3dBDeg) ** 2, CH.frontBackDb);
}
/**
 * Macro path loss at 2 GHz (TR 25.814 Table A.2.1.1-3) over the 3D distance between a 32 m mast
 * and a 1.5 m handset, with the table's 35 m minimum ground distance.
 */
export function chPathLossDb(distanceM: number) {
  if (!(distanceM >= 0)) throw new RangeError('Distance must be non-negative');
  const d3 = Math.hypot(Math.max(distanceM, CH.minDistanceM), CH.mastHeightM - CH.handsetHeightM);
  return 128.1 + 37.6 * log10(d3 / 1000);
}
export const chDbmToMw = (dbm: number) => 10 ** (dbm / 10);

/**
 * Long-term RSRP (dBm) of every cell at one point: transmit power per resource element, antenna
 * gain and pattern, path loss and the site's shadowing. Writes into `out` (length = cells).
 */
let scratchLoss = new Float64Array(64),
  scratchBearing = new Float64Array(64);
export function chRsrpAt(
  layout: ChLayout,
  x: number,
  y: number,
  sigmaDb: number,
  out = new Float64Array(layout.cells.length),
  seed: number = CH.seed,
) {
  if (![x, y, sigmaDb].every(Number.isFinite) || sigmaDb < 0)
    throw new RangeError('Invalid RSRP query');
  const shadow = chShadow(layout.sites.length, seed);
  if (scratchLoss.length < layout.sites.length) {
    scratchLoss = new Float64Array(layout.sites.length);
    scratchBearing = new Float64Array(layout.sites.length);
  }
  const siteLoss = scratchLoss,
    siteBearing = scratchBearing;
  for (const s of layout.sites) {
    const dx = x - s.x,
      dy = y - s.y;
    siteLoss[s.id] = chPathLossDb(Math.hypot(dx, dy)) + sigmaDb * chShadowAt(shadow, s.id, x, y);
    siteBearing[s.id] = (Math.atan2(dy, dx) * 180) / Math.PI;
  }
  for (const c of layout.cells) {
    out[c.id] =
      CH.macroReDbm +
      CH.macroGainDbi -
      CH.vehicleLossDb +
      chAntennaDb(siteBearing[c.site] - c.azimuth) -
      siteLoss[c.site];
  }
  return out;
}

/** Downlink SINR proxy: serving RSRP over all other cells (full load, one carrier) plus noise. */
export function chSinrDb(rsrp: ArrayLike<number>, serving: number) {
  if (serving < 0 || serving >= rsrp.length) throw new RangeError('Unknown serving cell');
  let interference = chDbmToMw(CH.noiseDbm);
  for (let c = 0; c < rsrp.length; c++) if (c !== serving) interference += chDbmToMw(rsrp[c]);
  return rsrp[serving] - 10 * log10(interference);
}

export type ChRect = { x: number; y: number; w: number; h: number };
export type ChField = {
  rect: ChRect;
  cols: number;
  rows: number;
  step: number;
  best: Uint16Array;
  bestDbm: Float32Array;
  /** Best minus second-best RSRP (dB): 0 on a boundary. */
  marginDb: Float32Array;
};
/** Best-server map on a regular grid over `rect` (sample centres at rect + (i+0.5)·step). */
export function* chFieldSteps(
  layout: ChLayout,
  sigmaDb: number,
  step = 5,
  rect: ChRect = { x: 0, y: 0, w: CH.widthM, h: CH.heightM },
): Generator<void, ChField, void> {
  if (!(step >= 0.5) || !Number.isFinite(step)) throw new RangeError('Invalid field step');
  if (!(sigmaDb >= 0) || !Number.isFinite(sigmaDb)) throw new RangeError('Invalid shadowing');
  if (![rect.x, rect.y, rect.w, rect.h].every(Number.isFinite) || rect.w <= 0 || rect.h <= 0)
    throw new RangeError('Invalid field rectangle');
  const cols = Math.ceil(rect.w / step),
    rows = Math.ceil(rect.h / step);
  if (cols * rows > 2_000_000) throw new RangeError('Field too large');
  const best = new Uint16Array(cols * rows),
    bestDbm = new Float32Array(cols * rows),
    marginDb = new Float32Array(cols * rows);
  const shadow = chShadow(layout.sites.length);
  // A site more than 2.6 ISD away is ≥ 24 dB weaker in median path loss than the nearest one;
  // skipping it cannot change the strongest cell except in pathological shadowing draws.
  const cutoff = 2.6 * layout.isdM,
    tx = CH.macroReDbm + CH.macroGainDbi - CH.vehicleLossDb;
  for (let j = 0; j < rows; j++) {
    const y = rect.y + (j + 0.5) * step;
    const near = layout.sites.filter((s) => Math.abs(s.y - y) <= cutoff);
    for (let i = 0; i < cols; i++) {
      const x = rect.x + (i + 0.5) * step;
      let b = -1,
        first = -Infinity,
        second = -Infinity;
      for (const s of near) {
        const dx = x - s.x,
          dy = y - s.y,
          d = Math.hypot(dx, dy);
        if (d > cutoff) continue;
        const loss = chPathLossDb(d) + sigmaDb * chShadowAt(shadow, s.id, x, y),
          bearing = (Math.atan2(dy, dx) * 180) / Math.PI;
        for (let k = 0; k < 3; k++) {
          const v = tx + chAntennaDb(bearing - CH_SECTORS[k]) - loss;
          if (v > first) {
            second = first;
            first = v;
            b = s.id * 3 + k;
          } else if (v > second) second = v;
        }
      }
      const idx = j * cols + i;
      best[idx] = b;
      bestDbm[idx] = first;
      marginDb[idx] = first - second;
      if ((idx + 1) % 1024 === 0) yield;
    }
  }
  return { cols, rows, step, rect, best, bestDbm, marginDb };
}

/** Consume the same ordered calculation synchronously in Workers and static artwork. */
function chComplete<T>(steps: Generator<void, T, void>): T {
  let part = steps.next();
  while (!part.done) part = steps.next();
  return part.value;
}
export function chField(layout: ChLayout, sigmaDb: number, step = 5, rect?: ChRect): ChField {
  return chComplete(chFieldSteps(layout, sigmaDb, step, rect));
}

// ——— the route ———
/** A street crossing the city from west to east (metres). */
export const CH_ROUTE_POINTS: readonly [number, number][] = [
  [70, 690],
  [300, 655],
  [520, 560],
  [700, 505],
  [900, 500],
  [1080, 540],
  [1260, 620],
  [1450, 640],
  [1650, 575],
  [1930, 470],
];
export type ChRoute = {
  points: readonly [number, number][];
  cumulative: number[];
  length: number;
  at: (s: number) => { x: number; y: number; heading: number };
};
/** Centripetal-free Catmull-Rom smoothing sampled densely, then arc-length parameterised. */
export function chRoute(points = CH_ROUTE_POINTS): ChRoute {
  if (points.length < 2) throw new RangeError('A route needs two points');
  const dense: [number, number][] = [];
  const get = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))];
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [get(i - 1), get(i), get(i + 1), get(i + 2)];
    for (let k = 0; k < 24; k++) {
      const t = k / 24,
        t2 = t * t,
        t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 *
        (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      dense.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  dense.push([...points[points.length - 1]] as [number, number]);
  const cumulative = [0];
  for (let i = 1; i < dense.length; i++)
    cumulative.push(
      cumulative[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]),
    );
  const length = cumulative[cumulative.length - 1];
  const at = (s: number) => {
    const d = Math.max(0, Math.min(length, Number.isFinite(s) ? s : 0));
    let lo = 0,
      hi = cumulative.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] <= d) lo = mid;
      else hi = mid;
    }
    const span = cumulative[hi] - cumulative[lo] || 1,
      u = (d - cumulative[lo]) / span;
    const [ax, ay] = dense[lo],
      [bx, by] = dense[hi];
    return { x: ax + (bx - ax) * u, y: ay + (by - ay) * u, heading: Math.atan2(by - ay, bx - ax) };
  };
  return { points: dense, cumulative, length, at };
}

// ——— connected-mode simulation ———
export type ChParams = {
  hysDb: number;
  offsetDb: number;
  tttMs: number;
  speedKmh: number;
  sigmaDb: number;
};
export const CH_DEFAULT: ChParams = {
  hysDb: 3,
  offsetDb: 0,
  tttMs: 320,
  speedKmh: 30,
  sigmaDb: CH.shadowSigmaDb,
};
export const CH_EAGER: ChParams = { ...CH_DEFAULT, hysDb: 0, tttMs: 0 };

export type ChEvent = {
  /** Sample index at which the event takes effect. */
  i: number;
  kind: 'report' | 'handover' | 'failure' | 'reestablish';
  from: number;
  to: number;
  /** Handover back to the cell just left within 1 s (TR 36.839 ping-pong). */
  pingPong?: boolean;
};
export type ChRun = {
  params: ChParams;
  layout: ChLayout;
  route: ChRoute;
  dt: number;
  count: number;
  speed: number;
  cells: number;
  /** Long-term RSRP without measurement fluctuation (dBm), sample-major. */
  truth: Float32Array;
  /** Layer-3 filtered measurements (dBm), sample-major. */
  filtered: Float32Array;
  /** Serving cell per sample (−1 while the link is lost). */
  serving: Int16Array;
  sinr: Float32Array;
  /** A3 time-to-trigger progress (0–1) of the leading candidate. */
  trigger: Float32Array;
  candidate: Int16Array;
  events: ChEvent[];
  handovers: number;
  pingPongs: number;
  failures: number;
};

export function chValidParams(p: ChParams) {
  return (
    Number.isFinite(p.hysDb) &&
    p.hysDb >= 0 &&
    p.hysDb <= 15 &&
    Number.isFinite(p.offsetDb) &&
    Math.abs(p.offsetDb) <= 15 &&
    (CH_TTT_MS as readonly number[]).includes(p.tttMs) &&
    Number.isFinite(p.speedKmh) &&
    p.speedKmh >= 1 &&
    p.speedKmh <= 200 &&
    Number.isFinite(p.sigmaDb) &&
    p.sigmaDb >= 0 &&
    p.sigmaDb <= 12
  );
}

/** Bulk arrays dominate route storage; include an allowance for events and geometry. */
export function chRunBytes(run: ChRun) {
  return (
    run.truth.byteLength +
    run.filtered.byteLength +
    run.serving.byteLength +
    run.sinr.byteLength +
    run.trigger.byteLength +
    run.candidate.byteLength +
    run.events.length * 64 +
    run.route.points.length * 24 +
    (run.layout.cells.length + run.layout.sites.length) * 64 +
    1024
  );
}
export const CH_RUN_CACHE_BYTES = 24 * 1024 * 1024;
const runCache = new ByteCache<string, ChRun>(CH_RUN_CACHE_BYTES, chRunBytes);
/** Cooperative batches preserve the synchronous model's arithmetic and random sequence. */
export function* chSimulateSteps(p: ChParams = CH_DEFAULT): Generator<void, ChRun, void> {
  if (!chValidParams(p)) throw new RangeError('Invalid handover parameters');
  const key = JSON.stringify([p.hysDb, p.offsetDb, p.tttMs, p.speedKmh, p.sigmaDb]);
  const hit = runCache.get(key);
  if (hit) return hit;
  const layout = chLayout(),
    route = chRoute(),
    n = layout.cells.length,
    dt = CH.stepS;
  const speed = p.speedKmh / 3.6,
    count = Math.floor(route.length / (speed * dt)) + 1;
  const truth = new Float32Array(count * n),
    filtered = new Float32Array(count * n),
    serving = new Int16Array(count),
    sinr = new Float32Array(count),
    trigger = new Float32Array(count),
    candidate = new Int16Array(count).fill(-1);
  // L3 filter coefficient, adapted from its 200 ms definition to the 40 ms step (TS 36.331 §5.5.3.2).
  const a = 1 - (1 - 1 / 2 ** (CH.l3K / 4)) ** (dt / 0.2);
  const rho = Math.exp(-dt / CH.measTauS),
    innov = Math.sqrt(1 - rho * rho) * CH.measSigmaDb;
  const noiseRand = Array.from({ length: n }, (_, c) => mulberry32(CH.seed + 104729 * (c + 1)));
  const noise = new Float64Array(n).map((_, c) => gaussian(noiseRand[c]) * CH.measSigmaDb);
  const rsrp = new Float64Array(n),
    measured = new Float64Array(n),
    held = new Float64Array(n).fill(-1);
  const events: ChEvent[] = [];
  let current = -1,
    pending = -1,
    pendingAt = -1,
    t310 = 0,
    reestablishAt = -1,
    lastHandover: { i: number; from: number } | null = null;
  const ttt = p.tttMs / 1000;
  for (let i = 0; i < count; i++) {
    const pos = route.at(i * speed * dt);
    chRsrpAt(layout, pos.x, pos.y, p.sigmaDb, rsrp);
    for (let c = 0; c < n; c++) {
      if (i) noise[c] = rho * noise[c] + innov * gaussian(noiseRand[c]);
      measured[c] = rsrp[c] + noise[c];
      truth[i * n + c] = rsrp[c];
      filtered[i * n + c] = i ? (1 - a) * filtered[(i - 1) * n + c] + a * measured[c] : measured[c];
    }
    const F = (c: number) => filtered[i * n + c];
    const strongest = () => {
      let b = 0;
      for (let c = 1; c < n; c++) if (F(c) > F(b)) b = c;
      return b;
    };
    if (i === 0) current = strongest();
    if (pending >= 0 && i >= pendingAt) {
      const pingPong =
        !!lastHandover &&
        lastHandover.from === pending &&
        (i - lastHandover.i) * dt <= CH.pingPongS;
      events.push({ i, kind: 'handover', from: current, to: pending, pingPong });
      lastHandover = { i, from: current };
      current = pending;
      pending = -1;
      held.fill(-1);
    }
    if (current < 0 && i >= reestablishAt) {
      const to = strongest();
      events.push({ i, kind: 'reestablish', from: -1, to });
      current = to;
      t310 = 0;
      held.fill(-1);
    }
    if (current >= 0) {
      sinr[i] = chSinrDb(measured, current);
      t310 = sinr[i] < CH.qOutDb ? t310 + dt : 0;
      if (t310 >= CH.t310S - 1e-9) {
        events.push({ i, kind: 'failure', from: current, to: -1 });
        current = -1;
        pending = -1;
        reestablishAt = i + Math.round(CH.reestablishS / dt);
        held.fill(-1);
      }
    } else sinr[i] = -Infinity;
    serving[i] = current;
    if (current >= 0 && pending < 0) {
      let lead = -1;
      for (let c = 0; c < n; c++) {
        if (c === current) continue;
        const entering = F(c) - p.hysDb > F(current) + p.offsetDb;
        held[c] = entering ? (held[c] < 0 ? 0 : held[c] + dt) : -1;
        if (held[c] >= 0 && (lead < 0 || F(c) > F(lead))) lead = c;
      }
      if (lead >= 0) {
        candidate[i] = lead;
        trigger[i] = ttt ? Math.min(1, held[lead] / ttt) : 1;
        let chosen = -1;
        for (let c = 0; c < n; c++)
          if (c !== current && held[c] >= ttt - 1e-9 && (chosen < 0 || F(c) > F(chosen)))
            chosen = c;
        if (chosen >= 0) {
          events.push({ i, kind: 'report', from: current, to: chosen });
          pending = chosen;
          pendingAt = i + Math.round(CH.hoExecS / dt);
        }
      }
    } else if (pending >= 0) {
      candidate[i] = pending;
      trigger[i] = 1;
    }
    if ((i + 1) % 128 === 0) yield;
  }
  const run: ChRun = {
    params: { ...p },
    layout,
    route,
    dt,
    count,
    speed,
    cells: n,
    truth,
    filtered,
    serving,
    sinr,
    trigger,
    candidate,
    events,
    handovers: events.filter((e) => e.kind === 'handover').length,
    pingPongs: events.filter((e) => e.pingPong).length,
    failures: events.filter((e) => e.kind === 'failure').length,
  };
  runCache.set(key, run);
  return run;
}
export function chSimulate(p: ChParams = CH_DEFAULT): ChRun {
  return chComplete(chSimulateSteps(p));
}

/** Sample index nearest to a fraction of the route. */
export const chIndexAt = (run: ChRun, fraction: number) =>
  Math.max(
    0,
    Math.min(
      run.count - 1,
      Math.round((Number.isFinite(fraction) ? fraction : 0) * (run.count - 1)),
    ),
  );

/** Cells ranked by filtered RSRP at a sample. */
export function chRanked(run: ChRun, i: number, limit = 4) {
  const k = Math.max(0, Math.min(run.count - 1, i));
  return Array.from({ length: run.cells }, (_, c) => c)
    .sort((a, b) => run.filtered[k * run.cells + b] - run.filtered[k * run.cells + a])
    .slice(0, limit);
}

/**
 * The controlled comparison window: the densest cluster of eager (0 dB, 0 ms) handovers, extended
 * to include the first handover the tuned settings make there. Both runs share one route and one
 * shadowing field, so the window is the same stretch of street for both.
 */
export function chCompareWindow(eager: ChRun, tuned: ChRun, padS = 2.5) {
  if (eager.count !== tuned.count) throw new RangeError('Runs must share the same route sampling');
  const hs = eager.events
    .filter((e) => e.kind === 'handover' && e.i * eager.dt > 3)
    .map((e) => e.i);
  const gap = Math.round(4 / eager.dt);
  let best: number[] = [],
    cluster: number[] = [];
  for (const i of hs) {
    if (cluster.length && i - cluster[cluster.length - 1] > gap) cluster = [];
    cluster.push(i);
    if (cluster.length > best.length) best = [...cluster];
  }
  if (!best.length) return null;
  const first = best[0],
    last = best[best.length - 1];
  const tunedHo = tuned.events.find(
    (e) => e.kind === 'handover' && e.i >= first - gap && e.i <= last + 3 * gap,
  );
  const pad = Math.round(padS / eager.dt);
  const start = Math.max(0, first - pad),
    end = Math.min(eager.count - 1, Math.max(last, tunedHo?.i ?? last) + pad);
  const inside = (run: ChRun) =>
    run.events.filter((e) => e.kind === 'handover' && e.i >= start && e.i <= end);
  const cells = new Map<number, number>();
  for (const e of inside(eager)) {
    cells.set(e.from, (cells.get(e.from) ?? 0) + 1);
    cells.set(e.to, (cells.get(e.to) ?? 0) + 1);
  }
  const pair = [...cells.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c)
    .slice(0, 2);
  return {
    start: start / (eager.count - 1),
    end: end / (eager.count - 1),
    startIndex: start,
    endIndex: end,
    eager: inside(eager),
    tuned: inside(tuned),
    pair,
  };
}

/** Handovers of a run between two route fractions. */
export function chEventsBetween(run: ChRun, from: number, to: number) {
  const a = from * (run.count - 1),
    b = to * (run.count - 1);
  return run.events.filter((e) => e.i >= a && e.i <= b);
}

// ——— idle mode ———
export type ChIdle = {
  camped: Int16Array;
  reselections: number[];
  updates: { i: number; ta: number }[];
  registeredTa: Int16Array;
};
/**
 * Idle reselection by the R criterion: the best neighbour must beat `Qs + Qhyst` for
 * Treselection, and the UE must have camped at least 1 s. A tracking-area update is sent only when
 * the new cell's TA is not the registered one. Shares the connected run's measurements.
 */
export function chIdle(run: ChRun, qHystDb = 4, treselectionS = 1): ChIdle {
  if (!(qHystDb >= 0) || !(treselectionS >= 0)) throw new RangeError('Invalid idle parameters');
  const n = run.cells,
    camped = new Int16Array(run.count),
    registeredTa = new Int16Array(run.count);
  const reselections: number[] = [],
    updates: { i: number; ta: number }[] = [];
  const taOf = (c: number) => run.layout.sites[run.layout.cells[c].site].ta;
  let cur = 0;
  for (let c = 1; c < n; c++) if (run.filtered[c] > run.filtered[cur]) cur = c;
  let ta = taOf(cur),
    since = 0,
    lead = -1,
    held = 0;
  for (let i = 0; i < run.count; i++) {
    const F = (c: number) => run.filtered[i * n + c];
    let best = -1;
    for (let c = 0; c < n; c++) if (c !== cur && (best < 0 || F(c) > F(best))) best = c;
    if (best >= 0 && F(best) > F(cur) + qHystDb) {
      held = best === lead ? held + run.dt : 0;
      lead = best;
    } else {
      lead = -1;
      held = 0;
    }
    if (lead >= 0 && held >= treselectionS - 1e-9 && since >= 1) {
      cur = lead;
      reselections.push(i);
      since = 0;
      lead = -1;
      held = 0;
      if (taOf(cur) !== ta) {
        ta = taOf(cur);
        updates.push({ i, ta });
      }
    }
    since += run.dt;
    camped[i] = cur;
    registeredTa[i] = ta;
  }
  return { camped, reselections, updates, registeredTa };
}

// ——— spectrum sharing ———
export type ChUser = { id: number; x: number; y: number };
/** Fixed people: some gather along the main street and in a few squares, the rest are spread. */
export function chUsers(count = 120, seed: number = CH.seed + 17): ChUser[] {
  if (!Number.isInteger(count) || count < 1 || count > 2000) throw new RangeError('Invalid users');
  const rand = mulberry32(seed),
    route = chRoute();
  return Array.from({ length: count }, (_, id) => {
    if (id % 3 === 0) {
      const p = route.at(rand() * route.length),
        r = 60 * Math.sqrt(rand()),
        a = rand() * Math.PI * 2;
      return { id, x: p.x + r * Math.cos(a), y: p.y + r * Math.sin(a) };
    }
    return { id, x: 40 + rand() * (CH.widthM - 80), y: 40 + rand() * (CH.heightM - 80) };
  });
}
/** Each person joins the strongest cell; every cell shares the whole carrier (reuse-1). */
export function chAssign(layout: ChLayout, users: ChUser[], sigmaDb: number = CH.shadowSigmaDb) {
  const out = new Float64Array(layout.cells.length);
  const cellOf = users.map((u) => {
    chRsrpAt(layout, u.x, u.y, sigmaDb, out);
    let b = 0;
    for (let c = 1; c < out.length; c++) if (out[c] > out[b]) b = c;
    return b;
  });
  const members = layout.cells.map((c) => cellOf.flatMap((cell, u) => (cell === c.id ? [u] : [])));
  return {
    cellOf,
    members,
    prbsPerUser: (cell: number) => CH.prbs / Math.max(1, members[cell].length),
  };
}

/** The nearest site is not always the strongest cell: find a clear example on the route. */
/**
 * A clear example on the route: the strongest cell's site is at least `minRatio` times as far as
 * the nearest site, and the strongest cell beats every cell of the nearest site by `minMarginDb`.
 */
export function chNearestNotStrongest(run: ChRun, minMarginDb = 4, minRatio = 1.3) {
  const { layout, route } = run;
  let best: {
    i: number;
    nearest: number;
    nearestCell: number;
    strongest: number;
    margin: number;
  } | null = null;
  for (let i = 0; i < run.count; i += 5) {
    const pos = route.at(i * run.speed * run.dt);
    let nearest = 0;
    for (const s of layout.sites)
      if (
        Math.hypot(s.x - pos.x, s.y - pos.y) <
        Math.hypot(layout.sites[nearest].x - pos.x, layout.sites[nearest].y - pos.y)
      )
        nearest = s.id;
    let strongest = 0,
      nearestCell = -1;
    for (let c = 0; c < run.cells; c++) {
      if (run.truth[i * run.cells + c] > run.truth[i * run.cells + strongest]) strongest = c;
      if (
        layout.cells[c].site === nearest &&
        (nearestCell < 0 || run.truth[i * run.cells + c] > run.truth[i * run.cells + nearestCell])
      )
        nearestCell = c;
    }
    if (layout.cells[strongest].site === nearest) continue;
    const far = layout.sites[layout.cells[strongest].site];
    const ratio =
      Math.hypot(far.x - pos.x, far.y - pos.y) /
      Math.hypot(layout.sites[nearest].x - pos.x, layout.sites[nearest].y - pos.y);
    if (ratio < minRatio) continue;
    const margin = run.truth[i * run.cells + strongest] - run.truth[i * run.cells + nearestCell];
    if (margin >= minMarginDb && (!best || margin > best.margin))
      best = { i, nearest, nearestCell, strongest, margin };
  }
  return best;
}

/**
 * Identity colours for cells: a greedy colouring of the textbook hexagon adjacency, so cells that
 * normally meet never share a colour. Colour marks identity only; every cell uses the same carrier.
 */
export function chCellColors(layout: ChLayout, palette = 6, reach = 3.1) {
  const r = layout.isdM / 3;
  const centres = layout.cells.map((c) => {
    const s = layout.sites[c.site],
      a = (c.azimuth * Math.PI) / 180;
    return [s.x + r * Math.cos(a), s.y + r * Math.sin(a)];
  });
  const colors: number[] = [];
  layout.cells.forEach((c, i) => {
    const used = new Set<number>();
    for (let j = 0; j < i; j++)
      if (Math.hypot(centres[i][0] - centres[j][0], centres[i][1] - centres[j][1]) < r * reach)
        used.add(colors[j]);
    let k = (c.site * 2 + layout.cells.indexOf(c)) % palette;
    for (let n = 0; n < palette && used.has(k); n++) k = (k + 1) % palette;
    colors.push(k);
  });
  return colors;
}

/**
 * Boundaries as vector segments (x1, y1, x2, y2 in metres), by marching squares over the sample
 * grid. Where two neighbouring samples belong to different regions, the crossing is placed where
 * the leading cells tie, interpolated from each sample's margin over its runner-up. Squares with
 * three or four crossings (junctions) join them at their centroid. `groupOf` merges cells into
 * regions, e.g. tracking areas.
 */
export function* chContourSteps(
  field: ChField,
  groupOf?: ArrayLike<number>,
): Generator<void, Float32Array, void> {
  const { cols, rows, step, rect, best, marginDb } = field;
  const label = (k: number) => (groupOf ? groupOf[best[k]] : best[k]);
  const out: number[] = [];
  const cx = (i: number) => rect.x + (i + 0.5) * step,
    cy = (j: number) => rect.y + (j + 0.5) * step;
  const pts: number[] = [];
  const cross = (ka: number, kb: number, ax: number, ay: number, bx: number, by: number) => {
    if (label(ka) === label(kb)) return;
    const ma = Math.max(0, marginDb[ka]),
      mb = Math.max(0, marginDb[kb]);
    const u = ma + mb > 1e-6 ? ma / (ma + mb) : 0.5;
    pts.push(ax + (bx - ax) * u, ay + (by - ay) * u);
  };
  for (let j = 0; j + 1 < rows; j++)
    for (let i = 0; i + 1 < cols; i++) {
      if ((j || i) && (j * (cols - 1) + i) % 2048 === 0) yield;
      const k0 = j * cols + i,
        k1 = k0 + 1,
        k2 = k0 + cols + 1,
        k3 = k0 + cols;
      const x0 = cx(i),
        x1 = cx(i + 1),
        y0 = cy(j),
        y1 = cy(j + 1);
      pts.length = 0;
      cross(k0, k1, x0, y0, x1, y0);
      cross(k1, k2, x1, y0, x1, y1);
      cross(k3, k2, x0, y1, x1, y1);
      cross(k0, k3, x0, y0, x0, y1);
      const n = pts.length / 2;
      if (n === 2) out.push(pts[0], pts[1], pts[2], pts[3]);
      else if (n > 2) {
        let mx = 0,
          my = 0;
        for (let q = 0; q < n; q++) {
          mx += pts[2 * q] / n;
          my += pts[2 * q + 1] / n;
        }
        for (let q = 0; q < n; q++) out.push(pts[2 * q], pts[2 * q + 1], mx, my);
      }
    }
  return new Float32Array(out);
}
export function chContours(field: ChField, groupOf?: ArrayLike<number>) {
  return chComplete(chContourSteps(field, groupOf));
}

export type ChFieldSet = { field: ChField; cellEdges: Float32Array; taEdges: Float32Array };
/** A best-server field with its cell and tracking-area boundaries. */
export function* chFieldSetSteps(
  isdM: number,
  sigmaDb: number,
  step: number,
  rect?: ChRect,
): Generator<void, ChFieldSet, void> {
  const layout = chLayout(isdM);
  const field = yield* chFieldSteps(layout, sigmaDb, step, rect);
  const ta = layout.cells.map((c) => layout.sites[c.site].ta);
  const cellEdges = yield* chContourSteps(field);
  const taEdges = yield* chContourSteps(field, ta);
  return { field, cellEdges, taEdges };
}
export function chFieldSet(isdM: number, sigmaDb: number, step: number, rect?: ChRect): ChFieldSet {
  return chComplete(chFieldSetSteps(isdM, sigmaDb, step, rect));
}
export function chFieldSetBytes(set: ChFieldSet) {
  return (
    set.field.best.byteLength +
    set.field.bestDbm.byteLength +
    set.field.marginDb.byteLength +
    set.cellEdges.byteLength +
    set.taEdges.byteLength +
    128
  );
}
