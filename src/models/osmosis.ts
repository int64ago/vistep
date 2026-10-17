/** Dilute, non-electrolyte two-chamber osmosis. Volumes m³; pressure Pa. */
export type OsmosisConfig = {
  molesLeft: number;
  molesRight: number;
  temperature: number;
  external: number;
  permeability: number;
};
export const osmosisDefault: OsmosisConfig = {
  molesLeft: 0,
  molesRight: 0.00002,
  temperature: 298,
  external: 0,
  permeability: 2e-8,
};
export const osmosisVolume = 0.0002,
  osmosisArea = 0.005;
export function osmosisForTransfer(c: OsmosisConfig, transfer: number) {
  const left = osmosisVolume - transfer,
    right = osmosisVolume + transfer;
  const osmotic = 8.314462618 * c.temperature * (c.molesRight / right - c.molesLeft / left),
    head = (2 * transfer) / osmosisArea,
    hydrostatic = 1000 * 9.81 * head,
    drive = osmotic - hydrostatic - c.external;
  return {
    transfer,
    left,
    right,
    osmotic,
    head,
    hydrostatic,
    drive,
    flux: c.permeability * drive,
    heightLeft: left / osmosisArea,
    heightRight: right / osmosisArea,
  };
}
function validate(c: OsmosisConfig, time: number) {
  if (
    ![...Object.values(c), time].every(Number.isFinite) ||
    c.molesLeft < 0 ||
    c.molesRight < 0 ||
    c.temperature <= 0 ||
    c.permeability <= 0 ||
    time < 0 ||
    time > 180
  )
    throw new RangeError('Finite dilute-solution settings and 0–180 seconds required');
}
export function osmosisFrame(c: OsmosisConfig, time: number) {
  validate(c, time);
  let q = 0;
  const steps = Math.max(1, Math.ceil(time / 0.02)),
    dt = time / steps;
  for (let i = 0; i < steps; i++) {
    const a = osmosisForTransfer(c, q).flux,
      b = osmosisForTransfer(c, q + (dt * a) / 2).flux;
    q = Math.max(-0.9 * osmosisVolume, Math.min(0.9 * osmosisVolume, q + dt * b));
  }
  return { ...osmosisForTransfer(c, q), time, config: c };
}
export function osmosisEquilibrium(c: OsmosisConfig) {
  validate(c, 0);
  let a = -0.9 * osmosisVolume,
    b = 0.9 * osmosisVolume;
  for (let i = 0; i < 70; i++) {
    const mid = (a + b) / 2;
    if (osmosisForTransfer(c, mid).drive > 0) a = mid;
    else b = mid;
  }
  return osmosisForTransfer(c, (a + b) / 2);
}
export function osmosisShot(chapter: number, progress: number) {
  const i = Math.max(0, Math.min(7, chapter)),
    p = Math.max(0, Math.min(1, progress)),
    config = { ...osmosisDefault };
  let time = p * 30;
  if (i === 0) config.molesRight = 0;
  if (i === 1) time = p * 2;
  if (i === 2) time = 1 + p * 5;
  if (i === 3) time = 3 + p * 25;
  if (i === 4) time = 6 + p * 40;
  if (i === 5) time = 75 + p * 20;
  if (i === 6) {
    config.molesRight = 0.00004;
    time = p * 75;
  }
  if (i === 7) {
    config.external = 500;
    time = p * 65;
  }
  return { ...osmosisFrame(config, time), focus: i };
}
export function osmosisWaterTracers(transfer: number) {
  const count = 30,
    n = (transfer / osmosisVolume) * count;
  return Array.from({ length: count * 2 }, (_, id) => {
    const fromLeft = id < count,
      index = fromLeft ? id : id - count,
      travel = fromLeft
        ? Math.max(0, Math.min(1, n - index))
        : Math.max(0, Math.min(1, -n - index));
    return { id, fromLeft, travel };
  });
}
