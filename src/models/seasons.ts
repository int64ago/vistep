/** Circular-orbit, parallel-ray teaching model; hours are local apparent solar time.
 * The geometric horizon is the centre of a point Sun at altitude zero. No refraction,
 * atmosphere, eccentricity, equation of time, thermal storage or weather is modelled.
 * Solar altitude: NOAA GML, https://gml.noaa.gov/grad/solcalc/solareqns.PDF
 * Declination is derived from a fixed axis and this circular orbit, not NOAA's date fit.
 */
export const SEASONS = { tilt: 23.44, latitude: 50, duration: 176 } as const;
export type Vec3 = { x: number; y: number; z: number };
export type DayRegime = 'ordinary' | 'polar-day' | 'polar-night' | 'horizon';
export type SeasonView = 'field' | 'orbit' | 'beam' | 'year';
const RAD = Math.PI / 180;
const clamp = (n: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, n));
export const seasonDot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const scale = (v: Vec3, s: number): Vec3 => ({ x: v.x * s, y: v.y * s, z: v.z * s });
const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const normalize = (v: Vec3) => scale(v, 1 / Math.hypot(v.x, v.y, v.z));
export const seasonWrap = (value: number, cycle: number) => ((value % cycle) + cycle) % cycle;
function validate(latitude: number, tilt: number, longitude: number, hour: number) {
  if (![latitude, tilt, longitude, hour].every(Number.isFinite))
    throw new RangeError('Seasons inputs must be finite.');
  if (Math.abs(latitude) > 90 || tilt < 0 || tilt > 45)
    throw new RangeError('Latitude must be within ±90° and obliquity within 0–45°.');
}

/** Solar longitude: 0 March equinox, 90 June solstice, 180 September, 270 December. */
export function seasonOrbit(longitude: number, tilt = SEASONS.tilt as number) {
  validate(0, tilt, longitude, 12);
  const lambda = seasonWrap(longitude, 360) * RAD;
  const axis = { x: Math.sin(tilt * RAD), y: Math.cos(tilt * RAD), z: 0 };
  const earth = { x: -Math.sin(lambda), y: 0, z: Math.cos(lambda) };
  const sun = scale(earth, -1);
  const sinDeclination = clamp(seasonDot(axis, sun));
  const noon = normalize(add(sun, scale(axis, -sinDeclination)));
  const east = cross(axis, noon);
  return {
    longitude: seasonWrap(longitude, 360),
    axis,
    earth,
    sun,
    noon,
    east,
    declination: Math.asin(sinDeclination) / RAD,
  };
}

/** Integrates max(sin(altitude), 0) over one local solar day, in equivalent hours.
 * At a pole on an equinox the point Sun lies on the horizon all day: not 12 h daylight.
 */
export function seasonDay(latitude: number, declination: number) {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(declination) ||
    Math.abs(latitude) > 90 ||
    Math.abs(declination) > 90
  )
    throw new RangeError('Invalid latitude or declination.');
  const a = Math.sin(latitude * RAD) * Math.sin(declination * RAD);
  const b = Math.cos(latitude * RAD) * Math.cos(declination * RAD);
  let sunsetAngle = 0;
  let regime: DayRegime;
  if (Math.abs(a) < 1e-12 && Math.abs(b) < 1e-12) regime = 'horizon';
  else if (a - b >= -1e-12) {
    regime = 'polar-day';
    sunsetAngle = Math.PI;
  } else if (a + b <= 1e-12) regime = 'polar-night';
  else {
    regime = 'ordinary';
    sunsetAngle = Math.acos(clamp(-a / b));
  }
  const daylight = (24 * sunsetAngle) / Math.PI;
  const equivalentHours = Math.max(
    0,
    (24 / Math.PI) * (a * sunsetAngle + b * Math.sin(sunsetAngle)),
  );
  return {
    regime,
    daylight,
    sunrise: regime === 'ordinary' ? 12 - daylight / 2 : null,
    sunset: regime === 'ordinary' ? 12 + daylight / 2 : null,
    equivalentHours,
    noonAltitude: Math.asin(clamp(a + b)) / RAD,
    midnightAltitude: Math.asin(clamp(a - b)) / RAD,
  };
}

export function seasonSolar(latitude: number, declination: number, hour: number) {
  if (!Number.isFinite(hour)) throw new RangeError('Solar time must be finite.');
  const phi = latitude * RAD,
    delta = declination * RAD;
  const angle = (seasonWrap(hour, 24) - 12) * 15 * RAD;
  const east = -Math.cos(delta) * Math.sin(angle);
  const north = Math.cos(phi) * Math.sin(delta) - Math.sin(phi) * Math.cos(delta) * Math.cos(angle);
  const up = clamp(
    Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(angle),
  );
  const above = up > 1e-10;
  const shadow = above
    ? { east: -east / up, north: -north / up, length: Math.hypot(east, north) / up }
    : null;
  return {
    east,
    north,
    up,
    above,
    shadow,
    altitude: Math.asin(up) / RAD,
    incident: above ? up : 0,
    footprint: above ? 1 / up : null,
  };
}

export function seasonsState(
  longitude: number,
  latitude = SEASONS.latitude as number,
  tilt = SEASONS.tilt as number,
  hour = 12,
) {
  validate(latitude, tilt, longitude, hour);
  const orbit = seasonOrbit(longitude, tilt);
  const H = (seasonWrap(hour, 24) - 12) * 15 * RAD;
  const meridian = add(scale(orbit.noon, Math.cos(H)), scale(orbit.east, Math.sin(H)));
  const normal = add(
    scale(meridian, Math.cos(latitude * RAD)),
    scale(orbit.axis, Math.sin(latitude * RAD)),
  );
  return {
    ...orbit,
    latitude,
    tilt,
    hour: seasonWrap(hour, 24),
    normal,
    solar: seasonSolar(latitude, orbit.declination, hour),
    day: seasonDay(latitude, orbit.declination),
    opposite: seasonDay(-latitude, orbit.declination),
  };
}
export type SeasonsState = ReturnType<typeof seasonsState>;

/** A unit-width beam in the vertical plane containing the Sun. Endpoints are
 * physically unbounded; renderers may clip the image, never bend the rays. */
export function seasonBeam(altitude: number) {
  if (!Number.isFinite(altitude) || Math.abs(altitude) > 90)
    throw new RangeError('Invalid Sun altitude.');
  if (altitude <= 0) return null;
  const a = altitude * RAD,
    sin = Math.sin(a),
    cos = Math.cos(a);
  const distance = Math.max(2.5, 0.55 / Math.tan(a));
  const direction = { x: -cos, y: sin };
  const rays = [-0.5, -0.25, 0, 0.25, 0.5].map((offset) => ({
    top: { x: direction.x * distance + offset * sin, y: direction.y * distance + offset * cos },
    ground: { x: offset / sin, y: 0 },
  }));
  return { rays, direction, footprint: 1 / sin };
}

type BeamPoint = { x: number; y: number };
/** Liang–Barsky clipping keeps the ray direction exact while bounding SVG coordinates. */
export function seasonClipRay(a: BeamPoint, b: BeamPoint): [BeamPoint, BeamPoint] | null {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const p = [-dx, dx, -dy, dy],
    q = [a.x + 3.2, 3.2 - a.x, a.y, 3.4 - a.y];
  let enter = 0,
    leave = 1;
  for (let i = 0; i < 4; i++) {
    if (Math.abs(p[i]) < 1e-14) {
      if (q[i] < 0) return null;
      continue;
    }
    const r = q[i] / p[i];
    if (p[i] < 0) enter = Math.max(enter, r);
    else leave = Math.min(leave, r);
    if (enter > leave) return null;
  }
  if (leave - enter < 1e-14) return null;
  return [
    { x: a.x + enter * dx, y: a.y + enter * dy },
    { x: a.x + leave * dx, y: a.y + leave * dy },
  ];
}
/** Sutherland–Hodgman clipping for the beam's filled footprint section. */
export function seasonClipBeam(polygon: BeamPoint[]) {
  let points = polygon;
  const boundaries: [keyof BeamPoint, number, boolean][] = [
    ['x', -3.2, true],
    ['x', 3.2, false],
    ['y', 0, true],
    ['y', 3.4, false],
  ];
  for (const [axis, bound, greater] of boundaries) {
    const output: BeamPoint[] = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      const insideA = greater ? a[axis] >= bound : a[axis] <= bound,
        insideB = greater ? b[axis] >= bound : b[axis] <= bound;
      if (insideA) output.push(a);
      if (insideA !== insideB) {
        const u = (bound - a[axis]) / (b[axis] - a[axis]);
        output.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
      }
    }
    points = output;
  }
  return points;
}

export function seasonDailyCurve(latitude: number, declination: number) {
  return Array.from({ length: 97 }, (_, i) => ({
    hour: i / 4,
    ...seasonSolar(latitude, declination, i / 4),
  }));
}
export function seasonAnnualCurve(latitude: number, tilt: number) {
  return Array.from({ length: 73 }, (_, i) => ({
    longitude: i * 5,
    ...seasonDay(latitude, seasonOrbit(i * 5, tilt).declination),
  }));
}

/** Earth portrait is an equatorial close-up, camera 55° west of noon and 12° north.
 * Its moving solar-reference camera is distinct from the fixed inertial orbit plate.
 */
export function seasonPortrait(point: Vec3): Vec3 {
  const yaw = 55 * RAD,
    elevation = 12 * RAD;
  const x = point.x * Math.cos(yaw) - point.z * Math.sin(yaw);
  const z = point.x * Math.sin(yaw) + point.z * Math.cos(yaw);
  return {
    x,
    y: point.y * Math.cos(elevation) - z * Math.sin(elevation),
    z: point.y * Math.sin(elevation) + z * Math.cos(elevation),
  };
}
export function seasonSurface(latitude: number, hour: number): Vec3 {
  const p = latitude * RAD,
    H = (hour - 12) * 15 * RAD;
  return { x: Math.cos(p) * Math.sin(H), y: Math.sin(p), z: Math.cos(p) * Math.cos(H) };
}

/** Exact projected sunlit hemisphere boundary; 96 chords approximate each curve. */
export function seasonLightPath(sun: Vec3) {
  const angle = Math.atan2(sun.y, sun.x),
    c = Math.cos(angle),
    s = Math.sin(angle);
  const points: string[] = [];
  const point = (x: number, y: number) =>
    `${(x * c - y * s).toFixed(5)},${(-x * s - y * c).toFixed(5)}`;
  for (let i = 0; i <= 96; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / 96;
    points.push(point(Math.cos(a), Math.sin(a)));
  }
  for (let i = 96; i >= 0; i--) {
    const a = -Math.PI / 2 + (Math.PI * i) / 96;
    points.push(point(-sun.z * Math.cos(a), Math.sin(a)));
  }
  return `M${points.join('L')}Z`;
}

/** Project a metre-scale ENU ground scene. This is display projection, never physics. */
export function seasonFieldPoint(east: number, north: number, up: number, compact = false) {
  const unit = compact ? 42 : 50;
  return {
    x: (compact ? 164 : 224) + unit * (0.9 * east - 0.56 * north),
    y: (compact ? 192 : 201) + unit * (0.32 * east + 0.47 * north - 0.9 * up),
  };
}

const smooth = (x: number) => {
  const p = clamp(x, 0, 1);
  return p * p * (3 - 2 * p);
};
type Keyframe = [progress: number, longitude: number, latitude: number, tilt: number, hour: number];
function between(keys: Keyframe[], progress: number) {
  const p = clamp(progress, 0, 1);
  let index = keys.findIndex((key) => key[0] >= p);
  if (index < 0) index = keys.length - 1;
  if (index === 0) return keys[0].slice(1);
  const a = keys[index - 1],
    b = keys[index],
    u = smooth((p - a[0]) / (b[0] - a[0]));
  return a.slice(1).map((v, i) => v + (b[i + 1] - v) * u);
}
/** No accumulated simulation, timers or random values: a paused seek fully reconstructs. */
export function seasonsShot(chapter: number, progress: number) {
  if (!Number.isInteger(chapter) || !Number.isFinite(progress))
    throw new RangeError('Invalid chapter.');
  const c = Math.max(0, Math.min(7, chapter)),
    T = SEASONS.tilt,
    L = SEASONS.latitude;
  const shots: { view: SeasonView; keys: Keyframe[] }[] = [
    {
      view: 'field',
      keys: [
        [0, 90, L, T, 12],
        [0.18, 90, L, T, 12],
        [0.86, 270, L, T, 12],
        [1, 270, L, T, 12],
      ],
    },
    {
      view: 'orbit',
      keys: [
        [0, 270, L, T, 12],
        [0.15, 270, L, T, 12],
        [0.87, 450, L, T, 12],
        [1, 450, L, T, 12],
      ],
    },
    {
      view: 'beam',
      keys: [
        [0, 450, L, T, 12],
        [0.18, 450, L, T, 12],
        [0.82, 630, L, T, 12],
        [1, 630, L, T, 12],
      ],
    },
    {
      view: 'field',
      keys: [
        [0, 630, L, T, 12],
        [0.12, 630, L, T, 6],
        [0.4, 630, L, T, 18],
        [0.6, 810, L, T, 30],
        [0.94, 810, L, T, 42],
        [1, 810, L, T, 42],
      ],
    },
    {
      view: 'field',
      keys: [
        [0, 810, L, T, 18],
        [0.22, 900, L, T, 30],
        [0.9, 900, L, T, 42],
        [1, 900, L, T, 42],
      ],
    },
    {
      view: 'field',
      keys: [
        [0, 900, L, T, 18],
        [0.2, 810, 75, T, 18],
        [0.58, 810, 75, T, 42],
        [0.8, 990, 75, T, 42],
        [1, 990, 75, T, 48],
      ],
    },
    {
      view: 'year',
      keys: [
        [0, 990, 75, T, 0],
        [0.18, 990, L, T, 12],
        [0.38, 990, L, 0, 12],
        [0.9, 1350, L, 0, 12],
        [1, 1350, L, 0, 12],
      ],
    },
    {
      view: 'year',
      keys: [
        [0, 1350, L, 0, 12],
        [0.18, 1440, L, T, 12],
        [0.9, 1800, L, T, 12],
        [1, 1800, L, T, 12],
      ],
    },
  ];
  const [longitude, latitude, tilt, hour] = between(shots[c].keys, progress);
  return { view: shots[c].view, state: seasonsState(longitude, latitude, tilt, hour) };
}
