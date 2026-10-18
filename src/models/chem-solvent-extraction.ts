const clamp = (n: number, a = 0, b = 1) => (Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : a);
export function liquidPartition(
  ratio: number,
  organicVolume: number,
  waterVolume = 100,
  solute = 1,
) {
  const D = clamp(ratio, 0, 20),
    Vo = clamp(organicVolume, 0, 200),
    Vw = clamp(waterVolume, 1, 200),
    mass = clamp(solute, 0, 100),
    organic = (mass * D * Vo) / (Vw + D * Vo),
    aqueous = mass - organic;
  return {
    D,
    Vo,
    Vw,
    organic,
    aqueous,
    organicConcentration: Vo ? organic / Vo : 0,
    aqueousConcentration: aqueous / Vw,
  };
}
export function repeatedExtraction(ratio: number, solvent: number, portions: number) {
  const n = Math.floor(clamp(portions, 1, 6)),
    v = clamp(solvent, 0, 200) / n;
  let remaining = 1;
  const extracts: number[] = [];
  for (let j = 0; j < n; j++) {
    const m = liquidPartition(ratio, v, 100, remaining);
    extracts.push(m.organic);
    remaining = m.aqueous;
  }
  return { remaining, extracts, recovered: 1 - remaining, portionVolume: v };
}
export const funnelWidth = (y: number) =>
  5 + 52 * Math.pow(Math.sin((Math.PI * (clamp(y, 40, 190) - 40)) / 150), 0.78);
const slices = Array.from({ length: 300 }, (_, i) => ({
  y: 40 + (i + 0.5) * 0.5,
  area: Math.PI * funnelWidth(40 + (i + 0.5) * 0.5) ** 2 * 0.5,
}));
const area = slices.reduce((a, b) => a + b.area, 0);
const pixelsPerMetre = Math.cbrt(area / 220e-6);
/** Same pear profile supplies wall geometry and volume/level conversion. */
export function funnelLevel(volume: number) {
  const target = (area * clamp(volume, 0, 220)) / 220;
  let accumulated = 0;
  for (let i = slices.length - 1; i >= 0; i--) {
    if (accumulated + slices[i].area >= target)
      return slices[i].y + 0.25 - (0.5 * (target - accumulated)) / slices[i].area;
    accumulated += slices[i].area;
  }
  return 40;
}
export const funnelShape = `M155 20H165V40${Array.from({ length: 61 }, (_, i) => {
  const y = 40 + i * 2.5;
  return `L${160 + funnelWidth(y)} ${y}`;
}).join('')}V211H155V190${Array.from({ length: 61 }, (_, i) => {
  const y = 190 - i * 2.5;
  return `L${160 - funnelWidth(y)} ${y}`;
}).join('')}V20Z`;
/** Closed-headspace maximum outflow from Boyle pressure and hydrostatic balance. */
export function closedDrainLimit(totalVolume: number, lowerDensity: number, lowerVolume = 100) {
  const v = clamp(totalVolume, 0, 200),
    rho = clamp(lowerDensity, 700, 1600),
    head = 220 - v;
  let lo = 0,
    hi = Math.min(v, lowerVolume);
  for (let i = 0; i < 50; i++) {
    const out = (lo + hi) / 2,
      gas = (101325 * head) / (head + out),
      split = funnelLevel(Math.max(0, lowerVolume - out)),
      lowerHeight = (190 - split) / pixelsPerMetre,
      upperHeight = (split - funnelLevel(v - out)) / pixelsPerMetre,
      drive = gas - 101325 + 9.81 * (rho * lowerHeight + (rho > 1000 ? 1000 : 800) * upperHeight);
    if (drive > 0) lo = out;
    else hi = out;
  }
  return (lo + hi) / 2;
}
export function drainFunnel(
  ratio: number,
  heavy: boolean,
  progress: number,
  vented: boolean,
  valve = true,
) {
  const m = liquidPartition(ratio, 50),
    lowerVolume = heavy ? 50 : 100,
    upperVolume = heavy ? 100 : 50,
    requested = lowerVolume * clamp(progress),
    drained = valve
      ? Math.min(
          requested,
          vented ? lowerVolume : closedDrainLimit(150, heavy ? 1300 : 1000, lowerVolume),
        )
      : 0,
    lowerSolute = heavy ? m.organic : m.aqueous,
    upperSolute = heavy ? m.aqueous : m.organic,
    collectedSolute = (lowerSolute * drained) / lowerVolume;
  return {
    drained,
    remainingVolume: 150 - drained,
    lowerVolume: lowerVolume - drained,
    upperVolume,
    lowerSolute: lowerSolute - collectedSolute,
    upperSolute,
    collectedSolute,
    lowerPhase: heavy ? 'organic' : 'water',
    headPressure: vented ? 101325 : (101325 * 70) / (70 + drained),
  };
}
export function solidExtraction(progress: number, capacity = 0.75) {
  const dissolved = clamp(capacity) * clamp(progress);
  return { initialSolute: 1, dissolved, residualSolute: 1 - dissolved, inertMatrix: 1 };
}
export function extractionDirector(chapter: number, progress: number) {
  const c = Math.floor(clamp(chapter, 0, 6)),
    p = clamp(progress);
  return {
    chapter: c,
    p,
    ratio: 4,
    transfer: c === 0 ? 0 : c === 1 ? p : 1,
    drain: c === 3 ? p : c === 4 ? p : 0,
    vented: c !== 4,
    heavy: false,
    portions: 3,
  };
}
