export const auxinClamp = (v: number, a = 0, b = 1) =>
  Math.min(b, Math.max(a, Number.isFinite(v) ? v : a));
export type ColeoptileTreatment =
  | 'intact'
  | 'removed'
  | 'tip-covered'
  | 'base-covered'
  | 'agar'
  | 'barrier'
  | 'tip-left'
  | 'tip-right'
  | 'agar-left'
  | 'agar-clean';
export type LightSide = 'left' | 'right' | 'dark';
export function coleoptileGrowth(
  treatment: ColeoptileTreatment,
  progress: number,
  light: LightSide = 'left',
) {
  const p = auxinClamp(progress);
  let left = 0.55,
    right = 0.55;
  const tipPresent = !['removed', 'agar-left', 'agar-clean'].includes(treatment);
  if (['removed', 'barrier', 'agar-clean'].includes(treatment)) {
    left = 0;
    right = 0;
  } else if (treatment === 'tip-left' || treatment === 'agar-left') {
    left = 0.9;
    right = 0.2;
  } else if (treatment === 'tip-right') {
    left = 0.2;
    right = 0.9;
  } else if (light !== 'dark' && treatment !== 'tip-covered') {
    left = light === 'left' ? 0.2 : 0.9;
    right = light === 'left' ? 0.9 : 0.2;
  }
  const leftLength = 105 + 20 * left * p,
    rightLength = 105 + 20 * right * p,
    length = (leftLength + rightLength) / 2,
    width = 24,
    angle = leftLength === rightLength ? 0 : -(rightLength - leftLength) / width;
  const point = (fraction: number, side = 0) => {
    const u = auxinClamp(fraction),
      theta = angle * u,
      x = Math.abs(angle) < 1e-8 ? 0 : (length * (1 - Math.cos(theta))) / angle,
      y = Math.abs(angle) < 1e-8 ? -length * u : (-length * Math.sin(theta)) / angle;
    return {
      x: x + ((side * width) / 2) * Math.cos(theta),
      y: y + ((side * width) / 2) * Math.sin(theta),
      angle: theta,
    };
  };
  return {
    treatment,
    progress: p,
    tipPresent,
    leftSignal: left,
    rightSignal: right,
    leftLength,
    rightLength,
    length,
    width,
    angle,
    point,
  };
}
export function coleoptileOutline(
  treatment: ColeoptileTreatment,
  p: number,
  light: LightSide = 'left',
  from = 0,
  to = 1,
) {
  const state = coleoptileGrowth(treatment, p, light),
    samples = Array.from({ length: 25 }, (_, i) => from + ((to - from) * i) / 24),
    points = [
      ...samples.map((t) => state.point(t, -1)),
      ...samples
        .slice()
        .reverse()
        .map((t) => state.point(t, 1)),
    ];
  return (
    points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' ') + 'Z'
  );
}
export type AuxinOrgan = 'root' | 'bud' | 'stem';
/** Illustrative concentration-response family, not a fit to a specific plant assay. */
export function auxinDoseResponse(concentration: number, organ: AuxinOrgan) {
  const c = auxinClamp(concentration, 0, 1),
    [promote, inhibit] = { root: [1e-11, 1e-8], bud: [1e-9, 1e-6], stem: [1e-6, 1e-3] }[organ];
  return (0.95 * c) / (promote + c) - (1.2 * c * c) / (inhibit * inhibit + c * c);
}
export function agarLoading(progress: number) {
  const remaining = Math.exp(-3 * auxinClamp(progress));
  return { tipAmount: remaining, agarAmount: 1 - remaining, total: 1 };
}
export function auxinTransportAssay(
  progress: number,
  direction: 'baseward' | 'tipward' = 'baseward',
  hypothesis: 'polar' | 'both' = 'polar',
  source = true,
) {
  const t = 3 * auxinClamp(progress),
    rate = direction === 'baseward' || hypothesis === 'both' ? 1 : 0,
    q = rate * t,
    donor = source ? Math.exp(-q) : 0,
    tissue = source ? q * Math.exp(-q) : 0,
    receiver = source ? 1 - (1 + q) * Math.exp(-q) : 0;
  return {
    donor,
    tissue,
    receiver,
    total: donor + tissue + receiver,
    detected: receiver > 0.05,
    direction,
    hypothesis,
  };
}

/** Sixteen persistent representative tracers cross the actual tip/agar contact at y=154.
 * Crossing times are quantiles of the independent first-order loading law. */
export function agarTracerMarkers(progress: number, agarWidth = 205) {
  const p = auxinClamp(progress);
  return Array.from({ length: 16 }, (_, id) => {
    const crossing = -Math.log(1 - (id + 0.5) / 16) / 3;
    const start = { x: -12 + (id % 4) * 8, y: 108 + Math.floor(id / 4) * 10 };
    const contact = { x: start.x, y: 154 };
    const end = { x: agarWidth * (-0.4 + (id % 8) * 0.114), y: 173 + Math.floor(id / 8) * 24 };
    const before = p <= crossing;
    const q = before ? p / crossing : auxinClamp((p - crossing) / Math.max(0.15, 1 - crossing));
    const a = before ? start : contact,
      b = before ? contact : end;
    return { id, x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q, inAgar: !before };
  });
}
