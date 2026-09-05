/** Primary rainbow: spherical nonabsorbing water, collimated sunlight, geometrical optics.
 * Dispersion: IAPWS R9-97 Eq. 1 / Table 1, https://iapws.org/documents/release/Rindex.download
 * Default water: 293.15 K, 998.2 kg/m³. Vacuum indices are used with outside n=1;
 * the difference between air and vacuum is a declared teaching approximation.
 */
export const RAINBOW = {
  temperature: 293.15,
  density: 998.2,
  duration: 176,
  minWave: 400,
  maxWave: 700,
} as const;
export type RainbowPoint = { x: number; y: number };
export const rainbowDot = (a: RainbowPoint, b: RainbowPoint) => a.x * b.x + a.y * b.y;
export const rainbowAdd = (a: RainbowPoint, b: RainbowPoint) => ({ x: a.x + b.x, y: a.y + b.y });
export const rainbowScale = (a: RainbowPoint, k: number) => ({ x: a.x * k, y: a.y * k });
const length = (v: RainbowPoint) => Math.hypot(v.x, v.y);
const unit = (v: RainbowPoint) => rainbowScale(v, 1 / length(v));
const clamp = (x: number, a = -1, b = 1) => Math.max(a, Math.min(b, x));
const RAD = Math.PI / 180;

export function waterIndex(
  wavelengthNm: number,
  temperature = RAINBOW.temperature as number,
  density = RAINBOW.density as number,
) {
  if (
    ![wavelengthNm, temperature, density].every(Number.isFinite) ||
    wavelengthNm < 200 ||
    wavelengthNm > 1100 ||
    temperature < 261.15 ||
    temperature > 773.15 ||
    density < 0 ||
    density > 1060
  )
    throw new RangeError(
      'Outside this implementation’s IAPWS wavelength, temperature or density range.',
    );
  const l = wavelengthNm / 589,
    T = temperature / 273.15,
    rho = density / 1000;
  const f =
    rho *
    (0.244257733 +
      0.00974634476 * rho -
      0.00373234996 * T +
      0.000268678472 * l * l * T +
      0.0015892057 / (l * l) +
      0.00245934259 / (l * l - 0.229202 ** 2) +
      0.90070492 / (l * l - 5.432937 ** 2) -
      0.0166626219 * rho * rho);
  return Math.sqrt((1 + 2 * f) / (1 - f));
}
/** Fresnel power fractions for a lossless dielectric, keeping s/p channels separate. */
export function rainbowFresnel(cosIncidence: number, from: number, to: number) {
  if (
    ![cosIncidence, from, to].every(Number.isFinite) ||
    cosIncidence < 0 ||
    cosIncidence > 1 ||
    from <= 0 ||
    to <= 0
  )
    throw new RangeError('Invalid interface.');
  const sin2 = (from / to) ** 2 * (1 - cosIncidence * cosIncidence);
  if (sin2 >= 1) return { s: 1, p: 1, transmittedCos: 0, tir: true };
  const ct = Math.sqrt(Math.max(0, 1 - sin2));
  const rs = (from * cosIncidence - to * ct) / (from * cosIncidence + to * ct);
  const rp = (to * cosIncidence - from * ct) / (to * cosIncidence + from * ct);
  return { s: rs * rs, p: rp * rp, transmittedCos: ct, tir: false };
}
/** Normal must face the incident medium. */
export function rainbowRefract(
  direction: RainbowPoint,
  normal: RainbowPoint,
  from: number,
  to: number,
) {
  const cosI = clamp(-rainbowDot(direction, normal), 0, 1),
    eta = from / to;
  const k = 1 - eta * eta * (1 - cosI * cosI);
  if (k < 0) return null;
  return unit(
    rainbowAdd(rainbowScale(direction, eta), rainbowScale(normal, eta * cosI - Math.sqrt(k))),
  );
}
export function rainbowReflect(direction: RainbowPoint, normal: RainbowPoint) {
  return rainbowAdd(direction, rainbowScale(normal, -2 * rainbowDot(direction, normal)));
}
const nextSphereHit = (at: RainbowPoint, direction: RainbowPoint) =>
  rainbowAdd(at, rainbowScale(direction, -2 * rainbowDot(at, direction)));
function validateRay(impact: number, wavelength: number) {
  if (
    !Number.isFinite(impact) ||
    Math.abs(impact) >= 1 ||
    !Number.isFinite(wavelength) ||
    wavelength < 400 ||
    wavelength > 700
  )
    throw new RangeError('Require |b/R| < 1 and 400–700 nm.');
}
export function rainbowAngle(impact: number, index: number) {
  const b = Math.abs(impact);
  if (!Number.isFinite(b) || b >= 1 || !Number.isFinite(index) || index <= 1 || index >= 2)
    throw new RangeError('Invalid rainbow geometry.');
  return (4 * Math.asin(b / index) - 2 * Math.asin(b)) / RAD;
}
export function rainbowStationary(wavelengthNm: number) {
  validateRay(0, wavelengthNm);
  const index = waterIndex(wavelengthNm),
    impact = Math.sqrt((4 - index * index) / 3);
  return { impact, index, angle: rainbowAngle(impact, index) };
}
export function rainbowPower(impact: number, index: number) {
  const f = rainbowFresnel(Math.sqrt(1 - impact * impact), 1, index);
  const s = 1 - f.s,
    p = 1 - f.p;
  return {
    entryReflection: (f.s + f.p) / 2,
    entered: (s + p) / 2,
    zeroOrder: (s * s + p * p) / 2,
    reflectedInside: (s * f.s + p * f.p) / 2,
    primary: (s * s * f.s + p * p * f.p) / 2,
    remaining: (s * f.s * f.s + p * f.p * f.p) / 2,
  };
}

export function traceRainbow(impact: number, wavelengthNm = 550) {
  validateRay(impact, wavelengthNm);
  const index = waterIndex(wavelengthNm),
    incoming = { x: 1, y: 0 };
  const entry = { x: -Math.sqrt(1 - impact * impact), y: impact };
  const inside = rainbowRefract(incoming, entry, 1, index)!;
  const reflection = nextSphereHit(entry, inside);
  const reflected = rainbowReflect(inside, reflection);
  const exit = nextSphereHit(reflection, reflected);
  const outgoing = rainbowRefract(reflected, rainbowScale(exit, -1), index, 1)!;
  const zeroDirection = rainbowRefract(inside, rainbowScale(reflection, -1), index, 1)!;
  const entryDirection = rainbowReflect(incoming, entry);
  const power = rainbowPower(impact, index);
  const points = [
    { x: -3.7, y: impact },
    entry,
    reflection,
    exit,
    rainbowAdd(exit, rainbowScale(outgoing, 1.55)),
  ];
  const branches = [
    {
      a: entry,
      b: rainbowAdd(entry, rainbowScale(entryDirection, 1.25)),
      power: power.entryReflection,
    },
    {
      a: reflection,
      b: rainbowAdd(reflection, rainbowScale(zeroDirection, 1.15)),
      power: power.zeroOrder,
    },
  ];
  return {
    impact,
    wavelengthNm,
    index,
    entry,
    reflection,
    exit,
    incoming,
    inside,
    reflected,
    outgoing,
    zeroDirection,
    points,
    branches,
    power,
    incidence: Math.asin(Math.abs(impact)) / RAD,
    refraction: Math.asin(Math.abs(impact) / index) / RAD,
    angle: Math.acos(clamp(-outgoing.x)) / RAD,
    stationary: rainbowStationary(wavelengthNm),
  };
}
export type RainbowRay = ReturnType<typeof traceRainbow>;
/** Direct segment-relative reveal; no accumulated simulation time or random photon history. */
export function rainbowReveal(points: RainbowPoint[], progress: number) {
  const p = clamp(progress, 0, points.length - 1),
    index = Math.floor(p),
    part = p - index;
  const result = points.slice(0, index + 1);
  if (index < points.length - 1)
    result.push({
      x: points[index].x + (points[index + 1].x - points[index].x) * part,
      y: points[index].y + (points[index + 1].y - points[index].y) * part,
    });
  return result;
}

/** Equal incident cross-sectional area sampling (b=sqrt(u)), not equally weighted ray heights.
 * Output is power in 0.25° annular angular bins, NOT sky radiance or a wave-optical intensity.
 */
export function rainbowConcentration(wavelengthNm: number, samples = 4096) {
  validateRay(0, wavelengthNm);
  if (!Number.isInteger(samples) || samples < 64 || samples > 65536)
    throw new RangeError('Invalid sample count.');
  const index = waterIndex(wavelengthNm),
    binWidth = 0.25;
  const bins = Array.from({ length: 180 }, (_, i) => ({
    angle: (i + 0.5) * binWidth,
    power: 0,
    count: 0,
  }));
  let total = 0;
  for (let i = 0; i < samples; i++) {
    const b = Math.sqrt((i + 0.5) / samples),
      angle = rainbowAngle(b, index),
      power = rainbowPower(b, index).primary / samples;
    const bin = bins[Math.max(0, Math.min(bins.length - 1, Math.floor(angle / binWidth)))];
    bin.power += power;
    bin.count++;
    total += power;
  }
  return {
    bins,
    total,
    binWidth,
    samples,
    peak: bins.reduce((a, b) => (a.power > b.power ? a : b)),
    stationary: rainbowStationary(wavelengthNm),
  };
}

export const rainbowRotate = (v: RainbowPoint, degrees: number) => ({
  x: v.x * Math.cos(degrees * RAD) - v.y * Math.sin(degrees * RAD),
  y: v.x * Math.sin(degrees * RAD) + v.y * Math.cos(degrees * RAD),
});
/** Place a finite sphere on x=distance so this exact exiting ray intersects the eye at (0,0). */
export function rainbowObserverDrop(wavelengthNm: number, sunAltitude = 12, distance = 70) {
  if (
    !Number.isFinite(sunAltitude) ||
    sunAltitude < 0 ||
    sunAltitude > 55 ||
    !Number.isFinite(distance) ||
    distance < 10 ||
    distance > 1000
  )
    throw new RangeError('Invalid observer geometry.');
  const ray = traceRainbow(rainbowStationary(wavelengthNm).impact, wavelengthNm);
  const exit = rainbowRotate(ray.exit, -sunAltitude),
    out = rainbowRotate(ray.outgoing, -sunAltitude);
  const travel = (-distance - exit.x) / out.x;
  const centre = { x: distance, y: -exit.y - out.y * travel };
  const world = (p: RainbowPoint) => rainbowAdd(centre, rainbowRotate(p, -sunAltitude));
  const contact = world(ray.exit);
  return {
    wavelengthNm,
    ray,
    centre,
    exit: contact,
    outgoing: out,
    travel,
    points: ray.points.slice(1, 4).map(world),
    entry: world(ray.entry),
    eye: { x: 0, y: 0 },
    direction: { x: Math.cos(sunAltitude * RAD), y: -Math.sin(sunAltitude * RAD) },
  };
}
/** Other wavelengths traversing the SAME physical sphere at the SAME impact parameter. */
export function rainbowMiss(
  drop: ReturnType<typeof rainbowObserverDrop>,
  wavelengthNm: number,
  sunAltitude = 12,
) {
  const ray = traceRainbow(drop.ray.impact, wavelengthNm),
    exit = rainbowAdd(drop.centre, rainbowRotate(ray.exit, -sunAltitude)),
    outgoing = rainbowRotate(ray.outgoing, -sunAltitude);
  const travel = -exit.x / outgoing.x;
  return {
    ray,
    exit,
    outgoing,
    atEyePlane: { x: 0, y: exit.y + outgoing.y * travel },
    entry: rainbowAdd(drop.centre, rainbowRotate(ray.entry, -sunAltitude)),
  };
}
/** Directions on the primary cone. Gnomonic projection around the antisolar axis
 * yields a circle of radius tan(angle), with a straight horizon at y=tan(sun altitude).
 */
export function rainbowSky(wavelengthNm: number, sunAltitude: number, azimuth: number) {
  if (
    !Number.isFinite(sunAltitude) ||
    sunAltitude < 0 ||
    sunAltitude > 55 ||
    !Number.isFinite(azimuth)
  )
    throw new RangeError('Invalid sky direction.');
  const angle = rainbowStationary(wavelengthNm).angle * RAD,
    h = sunAltitude * RAD,
    phi = azimuth * RAD;
  const x = Math.cos(h) * Math.cos(angle) + Math.sin(h) * Math.sin(angle) * Math.cos(phi);
  const y = -Math.sin(h) * Math.cos(angle) + Math.cos(h) * Math.sin(angle) * Math.cos(phi);
  const z = Math.sin(angle) * Math.sin(phi);
  return {
    direction: { x, y, z },
    x: Math.tan(angle) * Math.sin(phi),
    y: Math.tan(angle) * Math.cos(phi),
    visible: y >= -1e-12,
    angle: angle / RAD,
    horizon: Math.tan(h),
  };
}
/** Display palette only: not colorimetry, a solar spectrum or perceived brightness. */
export function rainbowColor(wavelengthNm: number) {
  const stops: [number, number, number, number][] = [
    [400, 151, 130, 245],
    [450, 117, 158, 242],
    [500, 110, 215, 204],
    [550, 168, 213, 139],
    [590, 239, 208, 122],
    [630, 239, 165, 120],
    [700, 230, 118, 130],
  ];
  const w = clamp(wavelengthNm, 400, 700),
    i = Math.max(
      1,
      stops.findIndex((s) => s[0] >= w),
    );
  const a = stops[i - 1],
    b = stops[i],
    p = (w - a[0]) / (b[0] - a[0]);
  return `rgb(${a
    .slice(1)
    .map((v, j) => Math.round(v + (b[j + 1] - v) * p))
    .join(' ')})`;
}
export type RainbowView = 'drop' | 'concentration' | 'dispersion' | 'observer' | 'sky';
const ease = (x: number) => {
  const p = clamp(x, 0, 1);
  return p * p * (3 - 2 * p);
};
const mix = (a: number, b: number, p: number) => a + (b - a) * ease(p);
export function rainbowShot(chapter: number, progress: number) {
  if (!Number.isInteger(chapter) || chapter < 0 || chapter > 7 || !Number.isFinite(progress))
    throw new RangeError('Invalid film state.');
  const p = clamp(progress, 0, 1),
    star = rainbowStationary(550).impact;
  let view: RainbowView = 'drop',
    impact = 0.86,
    wavelength = 550,
    reveal = 4,
    sunAltitude = 12,
    twoDrops = false,
    normal = 0;
  if (chapter === 0) {
    reveal = mix(0, 1.65, (p - 0.08) / 0.7);
    normal = 1;
  }
  if (chapter === 1) {
    reveal = mix(1.65, 2.7, (p - 0.12) / 0.7);
    normal = 2;
  }
  if (chapter === 2) {
    reveal = mix(2.7, 4, (p - 0.1) / 0.65);
    normal = 3;
  }
  if (chapter === 3) {
    view = 'concentration';
    impact = p < 0.64 ? mix(0.64, 0.96, p / 0.64) : mix(0.96, star, (p - 0.64) / 0.26);
  }
  if (chapter === 4) {
    view = 'dispersion';
    impact = star;
    wavelength = mix(700, 400, (p - 0.15) / 0.65);
  }
  if (chapter === 5) {
    view = 'observer';
    wavelength = 700;
  }
  if (chapter === 6) {
    view = 'observer';
    wavelength = 700;
    twoDrops = true;
  }
  if (chapter === 7) {
    view = 'sky';
    sunAltitude = p < 0.6 ? mix(12, 50, (p - 0.12) / 0.4) : mix(50, 12, (p - 0.6) / 0.3);
  }
  return {
    view,
    impact,
    wavelength,
    reveal,
    sunAltitude,
    twoDrops,
    normal,
    ray: traceRainbow(impact, wavelength),
    revealSecond: twoDrops ? ease((p - 0.12) / 0.5) : 0,
  };
}
