/** Newtonian external gravity in a translating, nonrotating, freely falling
 * geocentric frame. W is POSITIVE tide-generating potential: delta a = grad W.
 * h=W/g is a first-order equilibrium ocean, not a dynamical/coastal prediction.
 * Constants: JPL DE440 GM values; spherical Earth and fixed reference distances.
 */
export type TidesVector = { x: number; y: number; z: number };
export type TidesBody = { id: string; mu: number; position: TidesVector };
export type TidesConfig = {
  moonDistance: number;
  moon: number;
  sun: number;
  alignment: number;
  declination: number;
  latitude: number;
  rotation: number;
};
export const tidesConstants = {
  radius: 6_371_000,
  g: 9.80665,
  moonGM: 4.902800118e12,
  sunGM: 1.32712440041279419e20,
  moonDistance: 384_400_000,
  sunDistance: 149_597_870_700,
  exaggeration: 2_000_000,
};
export const tidesDefaults: TidesConfig = {
  moonDistance: 1,
  moon: 1,
  sun: 0,
  alignment: 0,
  declination: 0,
  latitude: 0,
  rotation: 60,
};
export const tidesAdd = (a: TidesVector, b: TidesVector): TidesVector => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});
export const tidesScale = (a: TidesVector, k: number): TidesVector => ({
  x: a.x * k,
  y: a.y * k,
  z: a.z * k,
});
export const tidesDot = (a: TidesVector, b: TidesVector) => a.x * b.x + a.y * b.y + a.z * b.z;
export const tidesNorm = (a: TidesVector) => Math.hypot(a.x, a.y, a.z);
export const tidesCross = (a: TidesVector, b: TidesVector): TidesVector => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
export function tidesUnit(a: TidesVector) {
  const n = tidesNorm(a);
  if (!Number.isFinite(n) || n === 0) throw new RangeError('Finite nonzero direction required');
  return tidesScale(a, 1 / n);
}
const zero = (): TidesVector => ({ x: 0, y: 0, z: 0 });
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const rad = (angle: number) => (angle * Math.PI) / 180;
export function tidesDirection(latitude: number, longitude: number): TidesVector {
  const p = rad(latitude),
    l = rad(longitude);
  return { x: Math.cos(p) * Math.cos(l), y: Math.sin(p), z: Math.cos(p) * Math.sin(l) };
}
export function validateTides(c: TidesConfig) {
  if (
    !Object.values(c).every(Number.isFinite) ||
    c.moonDistance < 0.8 ||
    c.moonDistance > 1.4 ||
    c.moon < 0 ||
    c.moon > 1 ||
    c.sun < 0 ||
    c.sun > 1 ||
    c.alignment < 0 ||
    c.alignment > 180 ||
    Math.abs(c.declination) > 30 ||
    Math.abs(c.latitude) > 80 ||
    c.rotation < 0 ||
    c.rotation > 360
  )
    throw new RangeError('Outside the supported equilibrium-tide experiment');
}
export function tidesBodies(c: TidesConfig): TidesBody[] {
  validateTides(c);
  return [
    {
      id: 'moon',
      mu: tidesConstants.moonGM * c.moon,
      position: tidesScale(
        tidesDirection(c.declination, 0),
        tidesConstants.moonDistance * c.moonDistance,
      ),
    },
    {
      id: 'sun',
      mu: tidesConstants.sunGM * c.sun,
      position: tidesScale(tidesDirection(0, c.alignment), tidesConstants.sunDistance),
    },
  ];
}
export function tidesAcceleration(point: TidesVector, body: TidesBody): TidesVector {
  if (
    ![point.x, point.y, point.z, body.mu, body.position.x, body.position.y, body.position.z].every(
      Number.isFinite,
    ) ||
    body.mu < 0
  )
    throw new RangeError('Invalid external gravity input');
  if (body.mu === 0) return zero();
  const d = tidesAdd(body.position, tidesScale(point, -1)),
    r = tidesNorm(d);
  if (r === 0) throw new RangeError('Point-mass singularity');
  return tidesScale(d, body.mu / r ** 3);
}
export function tidesField(point: TidesVector, bodies: TidesBody[]) {
  let local = zero(),
    center = zero(),
    quadrupole = zero();
  for (const body of bodies) {
    local = tidesAdd(local, tidesAcceleration(point, body));
    center = tidesAdd(center, tidesAcceleration(zero(), body));
    if (body.mu === 0) continue;
    const d = tidesNorm(body.position),
      n = tidesScale(body.position, 1 / d);
    quadrupole = tidesAdd(
      quadrupole,
      tidesScale(
        tidesAdd(tidesScale(n, 3 * tidesDot(n, point)), tidesScale(point, -1)),
        body.mu / d ** 3,
      ),
    );
  }
  const differential = tidesAdd(local, tidesScale(center, -1));
  const radial = tidesNorm(point) ? tidesDot(differential, tidesUnit(point)) : 0;
  const tangential = tidesNorm(point)
    ? tidesAdd(differential, tidesScale(tidesUnit(point), -radial))
    : zero();
  return { local, center, differential, quadrupole, radial, tangential };
}
/** Algebraically stable evaluation of GM[1/|D-r|-1/D-(D·r)/D³].
 * The usual direct subtraction loses precision for the distant Sun. This form
 * starts at second order in r/D and retains the same exact external potential.
 */
export function tidesPotential(point: TidesVector, bodies: TidesBody[], quadrupole = false) {
  if (![point.x, point.y, point.z].every(Number.isFinite))
    throw new RangeError('Finite potential position required');
  let w = 0;
  for (const body of bodies) {
    if (![body.mu, body.position.x, body.position.y, body.position.z].every(Number.isFinite))
      throw new RangeError('Finite potential source required');
    if (body.mu === 0) continue;
    const d = tidesNorm(body.position),
      q = tidesScale(point, 1 / d),
      n = tidesScale(body.position, 1 / d),
      u = tidesDot(n, q),
      z = tidesDot(q, q);
    if (!Number.isFinite(d) || body.mu < 0 || d <= tidesNorm(point))
      throw new RangeError('Potential requires an external point mass');
    if (quadrupole) {
      w += ((body.mu / d) * (3 * u * u - z)) / 2;
      continue;
    }
    const s = Math.sqrt(1 - 2 * u + z);
    const remainder = ((u * (2 * u - z)) / (1 + s) + 2 * u * u - (1 + u) * z) / (s * (1 + s));
    w += (body.mu / d) * remainder;
  }
  return w;
}
export const tidesHeight = (direction: TidesVector, bodies: TidesBody[], quadrupole = false) =>
  tidesPotential(tidesScale(tidesUnit(direction), tidesConstants.radius), bodies, quadrupole) /
  tidesConstants.g;
export function tidesSurface(
  direction: TidesVector,
  bodies: TidesBody[],
  gain = tidesConstants.exaggeration,
) {
  if (!Number.isFinite(gain) || gain < 0 || gain > tidesConstants.exaggeration)
    throw new RangeError('Unsupported visual magnification');
  const unit = tidesUnit(direction),
    height = tidesHeight(unit, bodies),
    radius = 1 + (height * gain) / tidesConstants.radius;
  return { unit, height, radius, position: tidesScale(unit, radius) };
}
export function tidesProfile(c: TidesConfig, count = 181) {
  if (!Number.isInteger(count) || count < 5 || count > 721)
    throw new RangeError('Unsupported profile sampling');
  const bodies = tidesBodies(c);
  const points = Array.from({ length: count }, (_, i) => {
    const angle = (360 * i) / (count - 1);
    return {
      id: `longitude-${i}`,
      angle,
      height: tidesHeight(tidesDirection(c.latitude, angle), bodies),
    };
  });
  const min = Math.min(...points.map((p) => p.height)),
    max = Math.max(...points.map((p) => p.height));
  return { points, min, max, range: max - min };
}
export function tidesGrid(bodies: TidesBody[], gain: number, rotation = 0) {
  const rings: { id: string; points: ReturnType<typeof tidesSurface>[] }[] = [];
  for (const latitude of [-60, -30, 0, 30, 60])
    rings.push({
      id: `latitude-${latitude}`,
      points: Array.from({ length: 97 }, (_, i) =>
        tidesSurface(tidesDirection(latitude, (360 * i) / 96 + rotation), bodies, gain),
      ),
    });
  for (let longitude = 0; longitude < 360; longitude += 30)
    rings.push({
      id: `meridian-${longitude}`,
      points: Array.from({ length: 49 }, (_, i) =>
        tidesSurface(tidesDirection(-90 + (180 * i) / 48, longitude + rotation), bodies, gain),
      ),
    });
  return rings;
}
export function tidesStrength(body: TidesBody) {
  const d = tidesNorm(body.position);
  return body.mu === 0 ? 0 : body.mu / d ** 3;
}
export type TidesFocus =
  | 'gravity'
  | 'subtract'
  | 'equilibrium'
  | 'distance'
  | 'solar'
  | 'alignment'
  | 'rotation'
  | 'latitude';
export function tidesState(
  config: TidesConfig,
  focus: TidesFocus = 'equilibrium',
  progress = 1,
  gain = tidesConstants.exaggeration,
  pointDirection = tidesDirection(config.latitude, config.rotation),
) {
  const bodies = tidesBodies(config),
    point = tidesScale(pointDirection, tidesConstants.radius),
    field = tidesField(point, bodies),
    surface = tidesSurface(pointDirection, bodies, gain),
    moonAxis = tidesUnit(bodies[0].position);
  return {
    config,
    bodies,
    focus,
    progress,
    gain,
    pointDirection,
    point,
    field,
    surface,
    profile: tidesProfile(config),
    referenceProfile: tidesProfile({ ...config, latitude: 0, declination: 0 }),
    near: tidesHeight(moonAxis, bodies),
    far: tidesHeight(tidesScale(moonAxis, -1), bodies),
    lunarStrength: tidesStrength(bodies[0]),
    solarStrength: tidesStrength(bodies[1]),
    separation:
      (Math.acos(
        clamp(tidesDot(tidesUnit(bodies[0].position), tidesUnit(bodies[1].position)), -1, 1),
      ) *
        180) /
      Math.PI,
    strengthRatio:
      (tidesConstants.moonDistance / (config.moonDistance * tidesConstants.moonDistance)) ** 3 *
      config.moon,
    frame: focus === 'gravity' ? ('absolute' as const) : ('falling' as const),
  };
}
const focusNames: TidesFocus[] = [
  'gravity',
  'subtract',
  'equilibrium',
  'distance',
  'solar',
  'alignment',
  'rotation',
  'latitude',
];
export function tidesShot(chapter: number, progress: number) {
  const c = clamp(Math.floor(Number.isFinite(chapter) ? chapter : 0), 0, 7),
    q = clamp(((Number.isFinite(progress) ? progress : 0) - 0.05) / 0.9, 0, 1),
    p = q * q * (3 - 2 * q),
    config = { ...tidesDefaults, rotation: 0 };
  let gain = tidesConstants.exaggeration,
    point = tidesDirection(0, 0);
  if (c === 0 || c === 1) {
    const angle = Math.PI * (c === 0 ? p : 1 - p);
    point = { x: Math.cos(angle), y: Math.sin(angle), z: 0 };
    gain = 0;
  }
  if (c === 2) gain = tidesConstants.exaggeration * p;
  if (c === 3) config.moonDistance = clamp(1.2 - 0.4 * p, 0.8, 1.2);
  if (c === 4) config.sun = p;
  if (c === 5) {
    config.sun = 1;
    config.alignment = 180 * p;
  }
  if (c === 6) {
    config.rotation = 360 * p;
    point = tidesDirection(0, config.rotation);
  }
  if (c === 7) {
    config.latitude = 45 + 30 * Math.max(0, 2 * p - 1);
    config.declination = 25 * Math.min(1, 2 * p);
    config.rotation = 0;
    point = tidesDirection(config.latitude, 0);
  }
  return tidesState(config, focusNames[c], p, gain, point);
}
export type TidesState = ReturnType<typeof tidesState>;

/** Display geometry shares physical directions while compressing body distance.
 * The ocean uses one declared exaggeration; no simulated water velocity is drawn.
 */
export function tidesGlyphs(s: TidesState, compact: boolean) {
  const fieldMode =
    s.focus === 'gravity' ? 'absolute' : s.focus === 'equilibrium' ? 'tangent' : 'tidal';
  const absoluteScale = 0.43 / Math.max(3.3e-5, tidesNorm(s.field.center));
  const arrows = ['gravity', 'subtract', 'equilibrium'].includes(s.focus)
    ? Array.from({ length: 12 }, (_, i) => {
        const angle = ((i + 0.5) * Math.PI) / 6,
          origin = { x: Math.cos(angle), y: Math.sin(angle), z: 0 },
          f = tidesField(tidesScale(origin, tidesConstants.radius), s.bodies);
        const vector =
            fieldMode === 'absolute'
              ? f.local
              : fieldMode === 'tangent'
                ? f.tangential
                : f.differential,
          scale = fieldMode === 'absolute' ? absoluteScale : 310_000;
        return {
          id: `field-${i}`,
          origin,
          tip: tidesAdd(origin, tidesScale(vector, scale)),
          vector,
        };
      })
    : [];
  const moon = tidesScale(
    tidesUnit(s.bodies[0].position),
    compact ? 1.2 + 0.4 * s.config.moonDistance : 2.1 * s.config.moonDistance,
  );
  return {
    arrows,
    moon,
    moonRadius: compact ? 0.065 : 0.2727,
    fieldMode,
    marker: tidesScale(s.surface.position, 1.018),
  };
}
export function tidesBounds(s: TidesState, compact: boolean) {
  // Project a conservative ocean sphere AND the Moon's box corners, force tips
  // and tracked site. Actual mesh vertices are independently checked in tests.
  const glyphs = tidesGlyphs(s, compact),
    r = 1.31;
  const points: TidesVector[] = [];
  for (let lat = -90; lat <= 90; lat += 10)
    for (let lon = 0; lon < 360; lon += 10) points.push(tidesScale(tidesDirection(lat, lon), r));
  const mr = glyphs.moonRadius;
  for (const x of [-mr, mr])
    for (const y of [-mr, mr])
      for (const z of [-mr, mr]) points.push(tidesAdd(glyphs.moon, { x, y, z }));
  for (const arrow of glyphs.arrows) points.push(arrow.origin, arrow.tip);
  points.push(glyphs.marker);
  return points;
}
export function tidesCamera(s: TidesState, width: number, height: number, compact: boolean) {
  if (width <= 0 || height <= 0 || !Number.isFinite(width + height))
    throw new RangeError('Positive viewport dimensions required');
  const view = tidesUnit({ x: 0.08, y: 0.36, z: 1 }),
    right = tidesUnit(tidesCross({ x: 0, y: 1, z: 0 }, view)),
    up = tidesCross(view, right);
  const target = { x: compact ? 0.1 : 0.8, y: 0.06, z: 0 },
    fov = 34,
    tan = Math.tan(rad(fov / 2)),
    aspect = width / height,
    margin = 0.86;
  // Reserve bounds across the entire experiment for stable camera scale.
  const bounds = tidesBounds({ ...s, config: { ...s.config, moonDistance: 1.4 } }, compact);
  let distance = 3;
  for (const p of bounds) {
    const q = tidesAdd(p, tidesScale(target, -1));
    distance = Math.max(
      distance,
      tidesDot(q, view) +
        Math.max(
          Math.abs(tidesDot(q, right)) / (tan * aspect * margin),
          Math.abs(tidesDot(q, up)) / (tan * margin),
        ),
    );
  }
  return {
    view,
    right,
    up,
    target,
    fov,
    tan,
    aspect,
    distance,
    position: tidesAdd(target, tidesScale(view, distance)),
    near: 0.1,
    far: 40,
  };
}
export type TidesCamera = ReturnType<typeof tidesCamera>;
export function tidesProject(point: TidesVector, c: TidesCamera) {
  const q = tidesAdd(point, tidesScale(c.target, -1)),
    depth = c.distance - tidesDot(q, c.view);
  return {
    x: tidesDot(q, c.right) / (depth * c.tan * c.aspect),
    y: tidesDot(q, c.up) / (depth * c.tan),
    depth,
    visible: depth > c.near && depth < c.far,
  };
}
