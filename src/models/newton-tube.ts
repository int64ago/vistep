/**
 * One-dimensional fall from rest with constant quadratic drag.
 * Air trials use illustrative fixed Cd*A, not measured feather aerodynamics.
 * Positive y points down from the common release line. Contact is absorbing.
 */
export const NEWTON_GRAVITY = 9.8;
export const NEWTON_HEIGHT = 1.4;
export const NEWTON_AIR_DENSITY = 1.225;
export type FallingObject = { mass: number; area: number; dragCoefficient: number };
export const NEWTON_OBJECTS = {
  iron: { mass: 0.02, area: 0.0012, dragCoefficient: 1.1 },
  feather: { mass: 0.0002, area: 0.0032, dragCoefficient: 1.2 },
} satisfies Record<string, FallingObject>;
export type NewtonBody = keyof typeof NEWTON_OBJECTS;
export type FallState = {
  time: number;
  distance: number;
  speed: number;
  acceleration: number;
  drag: number;
  landed: boolean;
  impactTime: number;
};
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const finite = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);
// log(cosh x), avoiding overflow for large x and cancellation close to zero.
const logCosh = (x: number) =>
  x < 1e-3 ? (x * x) / 2 - x ** 4 / 12 : x + Math.log1p(Math.exp(-2 * x)) - Math.LN2;
export function newtonFall(
  body: FallingObject,
  time: number,
  density = NEWTON_AIR_DENSITY,
  height = NEWTON_HEIGHT,
  gravity = NEWTON_GRAVITY,
): FallState {
  if (
    ![body.mass, body.area, body.dragCoefficient, gravity].every(Number.isFinite) ||
    !(body.mass > 0) ||
    !(body.area >= 0) ||
    !(body.dragCoefficient >= 0) ||
    !(gravity > 0)
  )
    throw new RangeError('Positive mass and gravity, and nonnegative drag geometry are required.');
  const h = Math.max(0, finite(height, NEWTON_HEIGHT));
  const rho = Math.max(0, finite(density, NEWTON_AIR_DENSITY));
  const t = Math.max(0, finite(time, 0));
  const k = (rho * body.dragCoefficient * body.area) / 2;
  // The vacuum limit uses the ballistic expression before divisions become ill-conditioned.
  const vacuum = (k * Math.max(h, 1)) / body.mass < 1e-10;
  const vt = vacuum ? Infinity : Math.sqrt((body.mass * gravity) / k);
  const u = vacuum ? 0 : (gravity * h) / (vt * vt);
  // acosh(exp(u)) = u + log(1 + sqrt(1-exp(-2u))).
  const impactTime =
    h === 0
      ? 0
      : vacuum
        ? Math.sqrt((2 * h) / gravity)
        : (vt / gravity) * (u + Math.log1p(Math.sqrt(-Math.expm1(-2 * u))));
  const fallTime = Math.min(t, impactTime);
  const x = vacuum ? 0 : (gravity * fallTime) / vt;
  const speedBeforeContact = vacuum ? gravity * fallTime : vt * Math.tanh(x);
  const landed = t >= impactTime;
  const distance = landed
    ? h
    : vacuum
      ? (gravity * fallTime ** 2) / 2
      : ((vt * vt) / gravity) * logCosh(x);
  const drag = landed ? 0 : k * speedBeforeContact ** 2;
  return {
    time: t,
    distance: clamp(distance, 0, h),
    speed: landed ? 0 : speedBeforeContact,
    acceleration: landed ? 0 : gravity - drag / body.mass,
    drag,
    landed,
    impactTime,
  };
}
export function newtonPair(time: number, density = NEWTON_AIR_DENSITY) {
  return {
    iron: newtonFall(NEWTON_OBJECTS.iron, time, density),
    feather: newtonFall(NEWTON_OBJECTS.feather, time, density),
  };
}
export function newtonShot(chapter: number, progress: number) {
  const p = clamp(finite(progress, 0));
  const action = clamp((p - 0.18) / 0.56);
  const comparisonTime = 0.56 * action;
  return {
    airTime:
      chapter === 0 ? 0 : chapter === 1 ? 1.7 * action : chapter === 4 ? comparisonTime : 1.7,
    vacuumTime: chapter < 3 ? 0 : chapter === 3 ? 0.56 * action : comparisonTime,
    density:
      chapter < 2 ? NEWTON_AIR_DENSITY : chapter === 2 ? NEWTON_AIR_DENSITY * (1 - action) ** 2 : 0,
    pumping: chapter === 2 && action > 0 && action < 1,
    comparison: chapter === 4,
  };
}
/** Shared shape used by the live apparatus and all generated cover formats. */
export const NEWTON_FEATHER_PATH =
  'M1 -19C-3 -17 -7 -12 -8 -7L-4 -9L-8 -3L-4 -5L-7 2L-3 0L-6 6C-4 9 -2 11 0 12C3 10 6 6 7 2L3 4L8 -2L4 0L8 -6C9 -12 6 -17 1 -19Z';
export const NEWTON_FEATHER_SHAFT = 'M1 -19C-1 -9 -1 7 0 19';
export const NEWTON_FEATHER_BARBS = [
  'M0 -11L-4 -14M0 -11L4 -15',
  'M0 -6L-6 -10M0 -6L6 -11',
  'M0 -1L-6 -5M0 -1L7 -6',
  'M0 4L-5 0M0 4L6 -1',
  'M0 9L-3 6M0 9L4 5',
];
