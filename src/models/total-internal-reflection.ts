/** Lossless isotropic interface; unpolarized power, vacuum wavelength in nm. */
export function totalReflection(angle = 52, n1 = 1.5, n2 = 1, wavelength = 550) {
  if (
    ![angle, n1, n2, wavelength].every(Number.isFinite) ||
    angle < 0 ||
    angle >= 90 ||
    n1 <= 0 ||
    n2 <= 0 ||
    wavelength <= 0
  )
    throw new RangeError('Invalid total-reflection parameters');
  const i = (angle * Math.PI) / 180,
    s = (n1 / n2) * Math.sin(i),
    critical = n1 > n2 ? (Math.asin(n2 / n1) * 180) / Math.PI : null;
  const regime = s > 1 + 1e-10 ? 'total' : Math.abs(s - 1) <= 1e-10 ? 'critical' : 'transmitted';
  const t = regime === 'total' ? null : Math.asin(Math.min(1, s)),
    ci = Math.cos(i),
    ct = t === null ? 0 : Math.cos(t);
  const rs = regime === 'total' ? 1 : ((n1 * ci - n2 * ct) / (n1 * ci + n2 * ct)) ** 2,
    rp = regime === 'total' ? 1 : ((n2 * ci - n1 * ct) / (n2 * ci + n1 * ct)) ** 2;
  const reflectance = (rs + rp) / 2;
  const penetration =
    regime === 'total'
      ? wavelength / (2 * Math.PI * Math.sqrt(n1 * n1 * Math.sin(i) ** 2 - n2 * n2))
      : null;
  return {
    angle,
    n1,
    n2,
    critical,
    regime,
    transmittedAngle: t === null ? null : (t * 180) / Math.PI,
    reflectance,
    transmittance: 1 - reflectance,
    penetration,
  };
}
export function totalReflectionShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    critical = (Math.asin(1 / 1.5) * 180) / Math.PI;
  if (chapter === 0) return { angle: 25 + 10 * p, n1: 1.5, n2: 1 };
  if (chapter === 1) return { angle: 35 + (critical - 35) * p, n1: 1.5, n2: 1 };
  if (chapter === 2) return { angle: critical + 2 + 8 * p, n1: 1.5, n2: 1 };
  if (chapter === 3) return { angle: 52, n1: 1.5, n2: 1 + 0.4 * p };
  if (chapter === 4) return { angle: 52, n1: 1, n2: 1.5 };
  return { angle: 52 + 8 * p, n1: 1.5, n2: 1 };
}
