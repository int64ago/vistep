/** Horizontal quasi-1D, lossless full water pipe; inverse differential-pressure meter. */
export interface VenturiOptions {
  flow?: number;
  throat?: number;
}
export const venturiConstants = {
  diameter: 0.05,
  length: 0.65,
  density: 1000,
  manometerDensity: 13600,
  gravity: 9.81,
  wideGauge: 6000,
};
export function venturi(o: VenturiOptions = {}) {
  const flow = o.flow ?? 0.0008,
    throat = o.throat ?? 0.025,
    { diameter, density, gravity, manometerDensity, wideGauge } = venturiConstants;
  if (
    !Number.isFinite(flow) ||
    Math.abs(flow) > 0.001 ||
    !Number.isFinite(throat) ||
    throat < 0.02 ||
    throat > 0.04
  )
    throw new RangeError('Signed flow at most 1 L/s and throat 20–40 mm required');
  const area1 = (Math.PI * diameter ** 2) / 4,
    area2 = (Math.PI * throat ** 2) / 4,
    velocity1 = flow / area1,
    velocity2 = flow / area2,
    difference = 0.5 * density * (velocity2 ** 2 - velocity1 ** 2),
    height = difference / ((manometerDensity - density) * gravity),
    throatGauge = wideGauge - difference;
  return {
    flow,
    throat,
    area1,
    area2,
    velocity1,
    velocity2,
    difference,
    height,
    throatGauge,
    wideGauge,
    total: wideGauge + 0.5 * density * velocity1 ** 2,
    measured: venturiFlowFromDifference(difference, throat),
  };
}
export function venturiFlowFromDifference(difference: number, throat = 0.025) {
  if (
    !Number.isFinite(difference) ||
    difference < 0 ||
    !Number.isFinite(throat) ||
    throat <= 0 ||
    throat >= venturiConstants.diameter
  )
    throw new RangeError(
      'Nonnegative wide-to-throat pressure difference and narrower throat required',
    );
  const a1 = (Math.PI * venturiConstants.diameter ** 2) / 4,
    a2 = (Math.PI * throat ** 2) / 4;
  return a2 * Math.sqrt((2 * difference) / (venturiConstants.density * (1 - (a2 / a1) ** 2)));
}
const smooth = (p: number) => {
  const q = Math.max(0, Math.min(1, p));
  return q * q * (3 - 2 * q);
};
export function venturiRadius(x: number, throat = 0.025) {
  const r1 = 0.025,
    r2 = throat / 2;
  if (x < 0.12) return r1;
  if (x < 0.25) return r1 + (r2 - r1) * smooth((x - 0.12) / 0.13);
  if (x < 0.35) return r2;
  if (x < 0.55) return r2 + (r1 - r2) * smooth((x - 0.35) / 0.2);
  return r1;
}
export function venturiProfile(throat = 0.025) {
  venturi({ throat });
  const samples = Array.from({ length: 651 }, (_, i) => {
    const x = i * 0.001,
      radius = venturiRadius(x, throat);
    return { x, radius, area: Math.PI * radius ** 2, volume: 0 };
  });
  for (let i = 1; i < samples.length; i++)
    samples[i].volume = samples[i - 1].volume + (samples[i].area + samples[i - 1].area) * 0.0005;
  return { samples, totalVolume: samples.at(-1)!.volume, throat };
}
export type VenturiProfile = ReturnType<typeof venturiProfile>;
/** Equal-volume coordinate advects labels at local axial mean speed Q/A(x). */
export function venturiMarker(
  profile: VenturiProfile,
  flow: number,
  time: number,
  seed: number,
  lane = 0,
) {
  const volume =
    (((seed * profile.totalVolume + flow * time) % profile.totalVolume) + profile.totalVolume) %
    profile.totalVolume;
  let lo = 0,
    hi = profile.samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (profile.samples[mid].volume < volume) lo = mid;
    else hi = mid;
  }
  const a = profile.samples[lo],
    b = profile.samples[hi],
    x = a.x + ((b.x - a.x) * (volume - a.volume)) / (b.volume - a.volume),
    radius = venturiRadius(x, profile.throat);
  return { x, y: lane * radius, velocity: flow / (Math.PI * radius ** 2), volume };
}
export function venturiPressure(x: number, o: VenturiOptions = {}) {
  const s = venturi(o),
    v = s.flow / (Math.PI * venturiRadius(x, s.throat) ** 2);
  return {
    pressure: s.total - 0.5 * venturiConstants.density * v * v,
    kinetic: 0.5 * venturiConstants.density * v * v,
    velocity: v,
  };
}
export function venturiShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    base = { flow: 0.0008, throat: 0.025, energy: false };
  if (chapter === 1) return { ...base, throat: 0.04 - 0.015 * p };
  if (chapter === 2) return { ...base, flow: 0.001 * p };
  if (chapter === 3) return { ...base, energy: true };
  if (chapter === 4) return { ...base, flow: 0 };
  if (chapter === 5) return { ...base, flow: p < 0.5 ? 0.0008 : -0.0008 };
  return base;
}
