import { finiteClamp } from './modern-labs';
export function hubbleSpectrum(distance = 100, H0 = 70) {
  const d = finiteClamp(distance, 5, 200),
    h = finiteClamp(H0, 50, 90),
    velocity = d * h,
    z = velocity / 299792.458;
  return {
    distance: d,
    H0: h,
    velocity,
    z,
    lines: [434.05, 486.13, 656.28].map((rest) => ({ rest, observed: rest * (1 + z) })),
  };
}
export function antennaTemperature(elevation = 60) {
  const angle = (finiteClamp(elevation, 30, 90) * Math.PI) / 180,
    sky = 2.725,
    receiver = 3,
    atmosphere = 1 / Math.sin(angle);
  return { sky, receiver, atmosphere, total: sky + receiver + atmosphere };
}
/** Synthetic low-order angular modes, explicitly not Planck observations. Zero monopole. */
export function skyFluctuation(longitude: number, latitude: number) {
  const c = Math.cos(latitude),
    s = Math.sin(latitude);
  return (
    38 * c * c * Math.cos(2 * longitude) +
    26 * c * c * c * Math.sin(3 * longitude) +
    (21 * (3 * s * s - 1)) / 2 +
    12 * c * s * Math.cos(longitude)
  );
}
export function mollweide(longitude: number, latitude: number) {
  let theta = latitude;
  if (Math.abs(latitude) >= Math.PI / 2 - 1e-8) theta = (Math.sign(latitude) * Math.PI) / 2;
  else
    for (let i = 0; i < 16; i++)
      theta -=
        (2 * theta + Math.sin(2 * theta) - Math.PI * Math.sin(latitude)) /
        (2 + 2 * Math.cos(2 * theta));
  return {
    x: 170 + ((150 * longitude) / Math.PI) * Math.cos(theta),
    y: 178 - 75 * Math.sin(theta),
  };
}
