import { finiteClamp } from './modern-labs';
export function mechanicalPolarizer(x: number, time: number, angle = 0, longitudinal = false) {
  const theta = (angle * Math.PI) / 180,
    u = { y: Math.cos(theta), z: Math.sin(theta) },
    incoming = Math.sin(2 * Math.PI * (x - time)),
    back = Math.sin(2 * Math.PI * (-x - time));
  if (longitudinal) return { x: x + 0.045 * incoming, y: 0, z: 0, transmission: 1 };
  return {
    x,
    y: x < 0 ? incoming - (1 - u.y * u.y) * back : u.y * u.y * incoming,
    z: x < 0 ? u.y * u.z * back : u.y * u.z * incoming,
    transmission: u.y * u.y,
  };
}
export function dielectricReflection(angle = 56.31, index = 1.5) {
  const i = (finiteClamp(angle, 0, 80) * Math.PI) / 180,
    n = finiteClamp(index, 1.2, 1.8),
    r = Math.asin(Math.sin(i) / n),
    c = Math.cos(i),
    d = Math.cos(r),
    rs = (c - n * d) / (c + n * d),
    rp = (n * c - d) / (n * c + d);
  return { Rs: rs * rs, Rp: rp * rp, brewster: (Math.atan(n) * 180) / Math.PI };
}
export function observedPolarization(
  source: 'window' | 'glass' | 'table' | 'lcd',
  analyzer = 0,
  incidence = 56.31,
) {
  const theta = (analyzer * Math.PI) / 180;
  if (source === 'window') return { intensity: 0.5, degree: 0, sourceFraction: 1 };
  if (source === 'lcd') {
    const p = 0.98,
      a = (25 * Math.PI) / 180;
    return {
      intensity: 0.5 * (1 - p) + p * Math.cos(theta - a) ** 2,
      degree: p,
      sourceFraction: 1,
    };
  }
  const f = dielectricReflection(incidence, source === 'glass' ? 1.5 : 1.45),
    sum = f.Rs + f.Rp,
    p = sum > 0 ? (f.Rs - f.Rp) / sum : 0,
    diffuse = source === 'table' ? 0.12 : 0;
  return {
    intensity:
      ((1 - diffuse) * (f.Rs * Math.cos(theta) ** 2 + f.Rp * Math.sin(theta) ** 2)) / sum +
      diffuse * 0.5,
    degree: (1 - diffuse) * p,
    sourceFraction: sum / 2,
  };
}
