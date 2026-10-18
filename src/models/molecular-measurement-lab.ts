import { brownianNormal } from './brownian-motion';
export function waterViscosity(kelvin: number) {
  return 2.414e-5 * 10 ** (247.8 / (Math.max(273.15, Math.min(353.15, kelvin)) - 140));
}
export function carbonDiffusion(kelvin = 293.15, radius = 0.5e-6) {
  return (
    (1.380649e-23 * kelvin) / (6 * Math.PI * waterViscosity(kelvin) * Math.max(0.1e-6, radius))
  );
}
export function carbonTrack(seed: number, kelvin = 293.15, radius = 0.5e-6, seconds = 300) {
  const scale = Math.sqrt(2 * carbonDiffusion(kelvin, radius)) * 1e6,
    points = [{ x: 0, y: 0 }];
  for (let i = 0; i < Math.floor(seconds); i++) {
    const p = points[i];
    points.push({
      x: p.x + scale * brownianNormal(seed, i * 2),
      y: p.y + scale * brownianNormal(seed, i * 2 + 1),
    });
  }
  return points;
}
/** Representative near-room-temperature 50+50 mL demonstration, not general mixture thermodynamics. */
export function waterAlcoholMix(progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    poured = Math.min(1, p / 0.6),
    settled = Math.max(0, (p - 0.6) / 0.4);
  return {
    water: 50 * (1 - poured),
    ethanol: 50,
    mixture: 50 + 50 * poured - 4 * settled,
    contraction: 4 * settled,
    totalMass: 50 * 0.998 + 50 * 0.789,
  };
}
export function oilFilm(totalMl = 1, drops = 50, dilution = 500, areaCm2 = 200) {
  const volumeMl = Math.max(0, totalMl) / Math.max(1, drops) / Math.max(1, dilution),
    volumeM3 = volumeMl * 1e-6,
    areaM2 = Math.max(1e-8, areaCm2) * 1e-4;
  return {
    dropMl: totalMl / Math.max(1, drops),
    volumeMl,
    volumeM3,
    areaM2,
    thickness: volumeM3 / areaM2,
  };
}
export function oilBoundary(areaCm2 = 200) {
  const raw = Array.from({ length: 96 }, (_, i) => {
    const a = (i / 96) * 2 * Math.PI,
      r = 1 + 0.1 * Math.sin(3 * a) + 0.06 * Math.cos(5 * a);
    return { x: r * Math.cos(a), y: r * Math.sin(a) };
  });
  const unit =
      Math.abs(
        raw.reduce((sum, p, i) => {
          const q = raw[(i + 1) % raw.length];
          return sum + p.x * q.y - q.x * p.y;
        }, 0),
      ) / 2,
    scale = Math.sqrt(Math.max(1, areaCm2) / unit);
  return raw.map((p) => ({ x: p.x * scale, y: p.y * scale }));
}
export function molecularShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    mode: chapter < 2 ? ('brownian' as const) : chapter < 4 ? ('mix' as const) : ('oil' as const),
    temperature: chapter === 1 ? 323.15 : 293.15,
    time: p * 300,
    progress: p,
    mixed: chapter === 3,
    oilStage: chapter - 4,
  };
}
