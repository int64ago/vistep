import { electronWavelengthPM, finiteClamp } from './modern-labs';
export { electronWavelengthPM };
/** Finite, equally spaced coherent planes; normalized elastic-scattering intensity. */
export function planeIntensity(theta: number, wavelengthPM: number, spacingPM = 213, planes = 8) {
  const phase = (2 * Math.PI * 2 * spacingPM * Math.sin(theta)) / wavelengthPM;
  let re = 0,
    im = 0;
  for (let n = 0; n < planes; n++) {
    re += Math.cos(n * phase);
    im += Math.sin(n * phase);
  }
  return (re * re + im * im) / planes ** 2;
}
export function powderRadii(voltage: number, distanceMM = 100) {
  const lambda = electronWavelengthPM(voltage);
  return [213, 123].map((d) => distanceMM * Math.tan(2 * Math.asin(lambda / (2 * d))));
}
/** A simple-cubic, single-atom basis. k is in cycles/pm. Elastic Laue condition is exact. */
export function laueSpots(rotation: number, spacingPM = 400) {
  const angle = finiteClamp(rotation, -0.8, 0.8),
    a = 0.17;
  const spots: {
    x: number;
    y: number;
    wavelengthPM: number;
    residual: number;
    h: number;
    k: number;
    l: number;
  }[] = [];
  for (let h = -5; h <= 5; h++)
    for (let k = -5; k <= 5; k++)
      for (let l = -5; l <= 5; l++) {
        if (!h && !k && !l) continue;
        const hx = h * Math.cos(a) - k * Math.sin(a),
          ky = h * Math.sin(a) + k * Math.cos(a);
        const gx = (hx * Math.cos(angle) + l * Math.sin(angle)) / spacingPM,
          gy = ky / spacingPM,
          gz = (-hx * Math.sin(angle) + l * Math.cos(angle)) / spacingPM;
        const g2 = gx * gx + gy * gy + gz * gz,
          lambda = (-2 * gz) / g2;
        const sx = lambda * gx,
          sy = lambda * gy,
          sz = 1 + lambda * gz;
        if (lambda < 40 || lambda > 220 || sz < 0.35) continue;
        const x = sx / sz,
          y = sy / sz;
        if (Math.abs(x) > 1.15 || Math.abs(y) > 1.15) continue;
        if (spots.some((p) => Math.hypot(p.x - x, p.y - y) < 0.015)) continue;
        spots.push({
          x,
          y,
          wavelengthPM: lambda,
          residual: Math.abs(sx * sx + sy * sy + sz * sz - 1),
          h,
          k,
          l,
        });
      }
  return spots;
}
/** Biprism-equivalent two coherent sources. x is in fringe periods at the reference voltage. */
export function electronInterference(x: number, voltage: number) {
  const ratio = electronWavelengthPM(voltage) / electronWavelengthPM(2000);
  return Math.exp((-x * x) / 12) * Math.cos((Math.PI * x) / ratio) ** 2;
}
export function interferenceHits(voltage: number, count = 250) {
  const samples = 601,
    weights = Array.from({ length: samples }, (_, i) =>
      electronInterference(-5 + (10 * i) / (samples - 1), voltage),
    );
  const sum = weights.reduce((a, b) => a + b, 0);
  let cumulative = 0;
  const cdf = weights.map((w) => (cumulative += w / sum));
  return Array.from({ length: count }, (_, i) => {
    const q = ((i + 1) * 0.61803398875) % 1,
      j = cdf.findIndex((x) => x >= q);
    return { x: -5 + (10 * j) / (samples - 1), y: ((((i + 1) * 0.754877666) % 1) - 0.5) * 2 };
  });
}
