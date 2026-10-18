const clamp = (x: number) => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
/** Reaction bookkeeping per one initial sucrose unit. Selected pathways, not a measured product distribution. */
export function sugarCarbonization(dehydration: number, oxidizedFraction = 0, porosity = 0) {
  const d = clamp(dehydration),
    f = clamp(oxidizedFraction),
    phi = Math.min(0.88, clamp(porosity)),
    oxidizedCarbon = 12 * d * f;
  const amounts = {
    sucrose: 1 - d,
    carbon: 12 * d - oxidizedCarbon,
    water: 11 * d + 2 * oxidizedCarbon,
    carbonDioxide: oxidizedCarbon,
    sulfurDioxide: 2 * oxidizedCarbon,
    acidConsumed: 2 * oxidizedCarbon,
  };
  // Unit solid volume is illustrative: sucrose 1, fully dehydrated carbon skeleton 0.45.
  const solidVolume = amounts.sucrose + 0.45 * (amounts.carbon / 12),
    bulkVolume = amounts.sucrose + (0.45 * (amounts.carbon / 12)) / (1 - phi);
  return {
    dehydration: d,
    oxidizedFraction: f,
    porosity: bulkVolume > 0 ? 1 - solidVolume / bulkVolume : 0,
    carbonPorosity: phi,
    amounts,
    solidVolume,
    bulkVolume,
    voidVolume: bulkVolume - solidVolume,
    initialAtoms: {
      C: 12,
      H: 22 + 2 * amounts.acidConsumed,
      O: 11 + 4 * amounts.acidConsumed,
      S: amounts.acidConsumed,
    },
    finalAtoms: {
      C: 12 * amounts.sucrose + amounts.carbon + amounts.carbonDioxide,
      H: 22 * amounts.sucrose + 2 * amounts.water,
      O:
        11 * amounts.sucrose +
        amounts.water +
        2 * amounts.carbonDioxide +
        2 * amounts.sulfurDioxide,
      S: amounts.sulfurDioxide,
    },
  };
}
export function sugarColour(d: number) {
  const p = clamp(d),
    stops = [
      [231, 222, 197],
      [173, 138, 77],
      [61, 64, 57],
    ],
    a = p < 0.5 ? 0 : 1,
    t = p < 0.5 ? p * 2 : (p - 0.5) * 2;
  return `rgb(${stops[a].map((v, i) => Math.round(v + (stops[a + 1][i] - v) * t)).join(',')})`;
}
export function carbonColumnOutline(height: number, center = 160, bottom = 246, halfWidth = 47) {
  if (height <= 0) return '';
  const h = Math.max(0, height),
    top = bottom - h,
    w = halfWidth;
  return `M${center - w} ${bottom} C${center - w - 6} ${bottom - h * 0.25} ${center - w + 6} ${bottom - h * 0.55} ${center - w + 2} ${top + 12} Q${center - w + 3} ${top - 3} ${center} ${top} Q${center + w - 1} ${top - 5} ${center + w} ${top + 10} C${center + w - 4} ${bottom - h * 0.5} ${center + w + 5} ${bottom - h * 0.8} ${center + w} ${bottom}Z`;
}
function grainRandom(i: number) {
  let v = Math.imul(i ^ 0x9e3779b9, 0x45d9f3b);
  v = Math.imul(v ^ (v >>> 16), 0x45d9f3b);
  return ((v ^ (v >>> 16)) >>> 0) / 4294967296;
}
export const SUGAR_GRAINS = Array.from({ length: 91 }, (_, i) => ({
  id: i,
  x: grainRandom(i * 3 + 1),
  y: grainRandom(i * 3 + 2),
  r: 1.4 + grainRandom(i * 3 + 3) * 1.1,
}));
export function sugarDirector(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(4, chapter)),
    p = clamp(progress);
  return {
    chapter: c,
    progress: p,
    view: c === 1 ? 'ledger' : c === 3 ? 'oxidation' : 'column',
    dehydration: c === 0 ? Math.min(1, p / 0.82) : 1,
    oxidizedFraction: c === 3 ? 0.12 * Math.min(1, p / 0.8) : 0,
    porosity:
      c === 2
        ? 0.88 * Math.min(1, p / 0.85)
        : c === 4
          ? 0.88 * Math.min(1, p / 0.9)
          : c >= 3
            ? 0.88
            : 0,
    showGas: c === 2 || c === 3,
    showAcid: c === 0 && p < 0.18,
  };
}
