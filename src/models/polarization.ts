/** Ideal, normally incident, absorbing linear polarizers in one homogeneous medium.
 * The beam travels along +x. Angles describe the electric field in the yz plane:
 * 0 degrees is +y; 90 degrees is +z. Intensity is normalized to the source.
 * C is the time-averaged transverse electric-field coherency matrix, with its
 * electromagnetic proportionality constant absorbed into the intensity unit.
 * References: Feynman I.33-4; OpenStax University Physics III, section 1.7.
 */
export type PolarizationSource = 'unpolarized' | 'linear';
export type PolarizationVector = { y: number; z: number };
export type PolarizationCoherency = { yy: number; yz: number; zz: number };
export type PolarizationFilter = { id: 'A' | 'M' | 'B'; angle: number; x: number };
export type PolarizationBeam = {
  matrix: PolarizationCoherency;
  intensity: number;
  axis: number | null;
};
export type PolarizationStage = PolarizationFilter & {
  before: PolarizationBeam;
  after: PolarizationBeam;
  absorbed: number;
  relativeTransmission: number;
};
export type PolarizationState = {
  source: PolarizationSource;
  sourceAngle: number;
  input: PolarizationBeam;
  stages: PolarizationStage[];
  output: PolarizationBeam;
  absorbed: number;
};
export type PolarizationView =
  'direction' | 'ensemble' | 'first' | 'malus' | 'crossed' | 'middle' | 'energy' | 'sweep';

export const POLARIZATION_CHAPTER_SECONDS = 22;
export const POLARIZATION_DURATION = 176;
const finite = (n: number) => {
  if (!Number.isFinite(n)) throw new RangeError('Polarization inputs must be finite');
  return n;
};
const bounded = (n: number) => Math.max(0, Math.min(1, finite(n)));
export const polarizationAxis = (degrees: number): PolarizationVector => {
  const a = ((finite(degrees) % 360) * Math.PI) / 180;
  return { y: Math.cos(a), z: Math.sin(a) };
};
export const projectPolarizationField = (
  field: PolarizationVector,
  angle: number,
): PolarizationVector => {
  const u = polarizationAxis(angle);
  let component = finite(field.y) * u.y + finite(field.z) * u.z;
  if (Math.abs(component) < 1e-14) component = 0;
  return { y: component * u.y, z: component * u.z };
};
export function malusTransmission(deltaDegrees: number) {
  const c = polarizationAxis(deltaDegrees).y;
  return Math.abs(c) < 1e-14 ? 0 : c * c;
}
export function polarizationState(
  filters: PolarizationFilter[],
  source: PolarizationSource = 'unpolarized',
  sourceAngle = 0,
  intensity = 1,
): PolarizationState {
  if (finite(intensity) < 0) throw new RangeError('Intensity cannot be negative');
  if (source !== 'unpolarized' && source !== 'linear') throw new RangeError('Unknown source');
  const axis = polarizationAxis(sourceAngle);
  let beam: PolarizationBeam = {
    matrix:
      source === 'unpolarized'
        ? { yy: intensity / 2, yz: 0, zz: intensity / 2 }
        : {
            yy: intensity * axis.y ** 2,
            yz: intensity * axis.y * axis.z,
            zz: intensity * axis.z ** 2,
          },
    intensity,
    axis: source === 'unpolarized' ? null : sourceAngle,
  };
  const input = beam;
  let lastX = 0;
  const stages = filters.map((filter): PolarizationStage => {
    if (finite(filter.x) <= lastX || filter.x >= 1)
      throw new RangeError('Filters must be ordered within the beam');
    lastX = filter.x;
    const u = polarizationAxis(filter.angle);
    const before = beam;
    const c = before.matrix;
    let transmitted = u.y * u.y * c.yy + 2 * u.y * u.z * c.yz + u.z * u.z * c.zz;
    // Cancellation at ideal crossed axes is exact to numerical precision.
    if (transmitted < intensity * 1e-14) transmitted = 0;
    transmitted = Math.max(0, Math.min(before.intensity, transmitted));
    beam = {
      matrix: {
        yy: transmitted * u.y ** 2,
        yz: transmitted * u.y * u.z,
        zz: transmitted * u.z ** 2,
      },
      intensity: transmitted,
      axis: filter.angle,
    };
    return {
      ...filter,
      before,
      after: beam,
      absorbed: before.intensity - transmitted,
      relativeTransmission: before.intensity > 0 ? transmitted / before.intensity : 0,
    };
  });
  return {
    source,
    sourceAngle,
    input,
    stages,
    output: beam,
    absorbed: stages.reduce((sum, stage) => sum + stage.absorbed, 0),
  };
}

export function polarizationSetup(
  first = 0,
  middle: number | null = null,
  last: number | null = 90,
  source: PolarizationSource = 'unpolarized',
) {
  const filters: PolarizationFilter[] = [{ id: 'A', x: 0.26, angle: first }];
  if (middle !== null) filters.push({ id: 'M', x: 0.52, angle: middle });
  if (last !== null) filters.push({ id: 'B', x: 0.78, angle: last });
  return polarizationState(filters, source);
}

/** A deterministic, illustrative multi-frequency electric field. Its two
 * transverse components have equal variance and zero mean cross-correlation
 * over a fundamental period. It represents unpolarized time statistics, not
 * rotating circular polarization, a photon path, or a microscopic source model.
 * After any filter the field is projected with exactly the same axes as C.
 */
export function polarizationField(
  state: PolarizationState,
  x: number,
  time: number,
): PolarizationVector {
  const phase = 2 * Math.PI * (2 * finite(x) - 0.08 * finite(time));
  const scale = Math.sqrt(state.input.intensity / 2);
  let field: PolarizationVector =
    state.source === 'unpolarized'
      ? {
          y: scale * (Math.sin(3 * phase) + Math.sin(5 * phase + 0.7)),
          z: scale * (Math.sin(4 * phase + 1.1) + Math.sin(7 * phase + 0.3)),
        }
      : { y: 0, z: 0 };
  if (state.source === 'linear') {
    const axis = polarizationAxis(state.sourceAngle);
    const amplitude = Math.sqrt(2 * state.input.intensity) * Math.sin(4 * phase);
    field = { y: axis.y * amplitude, z: axis.z * amplitude };
  }
  for (const stage of state.stages) {
    if (stage.x > x) break;
    field = projectPolarizationField(field, stage.angle);
  }
  return field;
}

const smooth = (p: number) => {
  const v = bounded(p);
  return v * v * (3 - 2 * v);
};
const move = (p: number, from: number, to: number, start: number, end: number) =>
  from + (to - from) * smooth((p - start) / (end - start));
export function polarizationShot(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(7, Math.floor(finite(chapter)))),
    p = bounded(progress);
  const view = (
    ['direction', 'ensemble', 'first', 'malus', 'crossed', 'middle', 'energy', 'sweep'] as const
  )[c];
  let state: PolarizationState;
  if (c < 2) state = polarizationState([], c === 0 ? 'linear' : 'unpolarized');
  else if (c === 2) {
    const first = p < 0.55 ? move(p, 0, 90, 0.16, 0.47) : move(p, 90, 0, 0.59, 0.9);
    state = polarizationSetup(first, null, null);
  } else if (c === 3) state = polarizationSetup(0, null, move(p, 0, 60, 0.18, 0.8));
  else if (c === 4) state = polarizationSetup(0, null, move(p, 60, 90, 0.13, 0.64));
  else if (c === 5) state = polarizationSetup(0, move(p, 0, 45, 0.28, 0.76), 90);
  else if (c === 6) state = polarizationSetup(0, 45, 90);
  else {
    const middle =
      p < 0.3
        ? move(p, 45, 0, 0.03, 0.26)
        : p < 0.72
          ? move(p, 0, 90, 0.34, 0.66)
          : move(p, 90, 45, 0.76, 0.95);
    state = polarizationSetup(0, middle, 90);
  }
  return {
    state,
    view,
    energyStep: Math.min(3, Math.floor(p * 4)),
    middleVisibility: c === 5 ? smooth(p / 0.17) : 1,
  };
}

/** Orthographic, concept-preserving spatial drawing. x is propagation, y/z
 * are transverse coordinates in drawing units. Narrow layouts turn the beam
 * down the screen and give the transverse plane its own horizontal space.
 */
export function polarizationLayout(width: number) {
  const w = Math.max(240, finite(width)),
    phone = w < 620;
  const height = phone ? 418 : 290;
  const radius = phone ? 49 : 62;
  const project = (x: number, y = 0, z = 0) =>
    phone
      ? { x: w / 2 + y + z * 0.48, y: 34 + 348 * x + z * 0.34 }
      : { x: 42 + (w - 84) * x + z * 0.54, y: 133 - y + z * 0.25 };
  const ring = (x: number, r = radius) =>
    Array.from({ length: 81 }, (_, i) => {
      const a = (i / 80) * Math.PI * 2;
      return project(x, r * Math.cos(a), r * Math.sin(a));
    });
  return { width: w, height, phone, radius, project, ring };
}
export const polarizationPath = (points: { x: number; y: number }[], close = false) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ') +
  (close ? 'Z' : '');
