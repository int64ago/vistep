export const SURVEY_MU0 = 4e-7 * Math.PI;
export type FieldPattern = 'bar' | 'horseshoe' | 'straight' | 'loop' | 'solenoid';
export type FieldVector = { bx: number; by: number; bz: number };
export function loopMagneticField(
  x: number,
  y: number,
  z: number,
  current = 5,
  radius = 0.075,
  centerX = 0,
  steps = 64,
): FieldVector {
  if (
    ![x, y, z, current, radius, centerX].every(Number.isFinite) ||
    radius <= 0 ||
    !Number.isInteger(steps) ||
    steps < 16
  )
    throw new RangeError('Finite loop geometry and adequate quadrature required.');
  let bx = 0,
    by = 0,
    bz = 0;
  const da = (2 * Math.PI) / steps;
  for (let i = 0; i < steps; i++) {
    const a = (i + 0.5) * da,
      cy = radius * Math.cos(a),
      cz = radius * Math.sin(a),
      dy = -radius * Math.sin(a) * da,
      dz = radius * Math.cos(a) * da,
      rx = x - centerX,
      ry = y - cy,
      rz = z - cz,
      r = Math.hypot(rx, ry, rz),
      f = (SURVEY_MU0 * current) / (4 * Math.PI * Math.max(r, 0.0015) ** 3);
    bx += f * (dy * rz - dz * ry);
    by += f * dz * rx;
    bz -= f * dy * rx;
  }
  return { bx, by, bz };
}
function dipole(x: number, y: number, px: number, py: number, mx: number, my: number): FieldVector {
  const dx = x - px,
    dy = y - py,
    r = Math.max(0.008, Math.hypot(dx, dy)),
    dot = mx * dx + my * dy,
    f = 1e-7;
  return {
    bx: f * ((3 * dx * dot) / r ** 5 - mx / r ** 3),
    by: f * ((3 * dy * dot) / r ** 5 - my / r ** 3),
    bz: 0,
  };
}
export function surveyField(pattern: FieldPattern, x: number, y: number, current = 5): FieldVector {
  if (![x, y, current].every(Number.isFinite))
    throw new RangeError('Finite probe and current required.');
  if (pattern === 'straight') {
    const r2 = Math.max(2e-6, x * x + y * y),
      f = (SURVEY_MU0 * current) / (2 * Math.PI * r2);
    return { bx: -f * y, by: f * x, bz: 0 };
  }
  if (pattern === 'loop') return loopMagneticField(x, y, 0, current);
  if (pattern === 'solenoid') {
    const result = { bx: 0, by: 0, bz: 0 };
    for (let i = 0; i < 7; i++) {
      const b = loopMagneticField(x, y, 0, current, 0.06, -0.09 + i * 0.03);
      result.bx += b.bx;
      result.by += b.by;
      result.bz += b.bz;
    }
    return result;
  }
  const out = { bx: 0, by: 0, bz: 0 },
    segments =
      pattern === 'bar'
        ? [[-0.09, 0, 0.09, 0]]
        : [
            [0.09, -0.07, -0.09, -0.07],
            [-0.09, -0.07, -0.09, 0.07],
            [-0.09, 0.07, 0.09, 0.07],
          ];
  for (const [x1, y1, x2, y2] of segments) {
    const n = 12,
      dx = x2 - x1,
      dy = y2 - y1,
      length = Math.hypot(dx, dy),
      m = (0.7 * length) / 0.18 / n;
    for (let i = 0; i < n; i++) {
      const p = (i + 0.5) / n,
        b = dipole(x, y, x1 + p * dx, y1 + p * dy, (m * dx) / length, (m * dy) / length);
      out.bx += b.bx;
      out.by += b.by;
    }
  }
  return out;
}
export function surveyInsideSource(pattern: FieldPattern, x: number, y: number) {
  if (pattern === 'bar') return Math.abs(x) < 0.105 && Math.abs(y) < 0.025;
  if (pattern === 'horseshoe')
    return (
      ((Math.abs(y - 0.07) < 0.022 || Math.abs(y + 0.07) < 0.022) && x > -0.112 && x < 0.11) ||
      (Math.abs(x + 0.09) < 0.022 && Math.abs(y) < 0.09)
    );
  if (pattern === 'straight') return Math.hypot(x, y) < 0.017;
  if (pattern === 'loop') return Math.abs(x) < 0.012 && Math.abs(Math.abs(y) - 0.075) < 0.018;
  return Math.abs(x) < 0.127 && Math.abs(Math.abs(y) - 0.06) < 0.018;
}
export function oerstedCompass(current: number, height = 0.02, earth = 25e-6) {
  if (![current, height, earth].every(Number.isFinite) || height <= 0 || earth <= 0)
    throw new RangeError('Positive wire height and Earth field required.');
  const wire = current === 0 ? 0 : (-SURVEY_MU0 * current) / (2 * Math.PI * height);
  return { wire, earth, angle: Math.atan2(wire, earth), magnitude: Math.hypot(wire, earth) };
}
export function filingAngle(initial: number, bx: number, by: number, settle: number) {
  const b = Math.hypot(bx, by);
  if (b < 1e-15) return initial;
  const target = Math.atan2(by, bx),
    delta = initial - target;
  return (
    target +
    Math.atan(Math.tan(delta) * Math.exp(-8 * Math.max(0, settle) * Math.min(1, b / 20e-6)))
  );
}
