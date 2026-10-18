const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, Number.isFinite(x) ? x : 0));
export type FountainOptions = {
  airFraction?: number;
  trigger?: boolean;
  open?: boolean;
  partition?: number;
};
export type FountainState = {
  time: number;
  water: number;
  gasVolume: number;
  gasAmmonia: number;
  dissolvedAmmonia: number;
  air: number;
  pressure: number;
  flow: number;
  speed: number;
  jetHeight: number;
};
export const FOUNTAIN = {
  pressure: 101325,
  density: 998.2,
  g: 9.80665,
  lift: 0.173,
  sphereRadius: Math.cbrt((0.001 * 3) / (4 * Math.PI)),
  reservoirDepthPerL: 0.033,
  capacity: 1,
  area: 6e-6,
  discharge: 0.18,
};
/** 1 L normalized flask; gas inventory in initial ambient-pressure litre equivalents.
 * Effective partition and mass transfer are teaching parameters, not a Henry-law fit. */
export function ammoniaFountain(time: number, options: FountainOptions = {}): FountainState {
  const air = clamp(options.airFraction ?? 0.03, 0, 0.9),
    totalNH3 = 1 - air,
    trigger = options.trigger ?? true,
    open = options.open ?? true,
    k = clamp(options.partition ?? 700, 0, 1000);
  const end = clamp(time, 0, 120),
    dt = 0.005;
  let water = trigger ? 0.002 : 0,
    gasNH3 = totalNH3,
    flow = 0,
    speed = 0;
  for (let t = 0; t < end - 1e-9; t += dt) {
    const step = Math.min(dt, end - t),
      v = Math.max(0.001, 1 - water);
    const equilibrium = (totalNH3 * v) / (v + k * water),
      rate = water > 0 ? Math.min(12, 3 * Math.sqrt(water / 0.002)) : 0;
    gasNH3 += (equilibrium - gasNH3) * (1 - Math.exp(-rate * step));
    const pressure = ((air + gasNH3) / v) * FOUNTAIN.pressure;
    const drive = Math.max(
      0,
      FOUNTAIN.pressure -
        pressure -
        FOUNTAIN.density *
          FOUNTAIN.g *
          (FOUNTAIN.lift +
            water * FOUNTAIN.reservoirDepthPerL +
            Math.max(
              0,
              fountainLiquidHeight(water, FOUNTAIN.sphereRadius) - FOUNTAIN.sphereRadius,
            )),
    );
    speed = open ? FOUNTAIN.discharge * Math.sqrt((2 * drive) / FOUNTAIN.density) : 0;
    flow = 1000 * FOUNTAIN.area * speed;
    water = Math.min(0.999, water + flow * step);
  }
  const gasVolume = 1 - water,
    pressure = ((air + gasNH3) / gasVolume) * FOUNTAIN.pressure;
  return {
    time: end,
    water,
    gasVolume,
    gasAmmonia: gasNH3,
    dissolvedAmmonia: totalNH3 - gasNH3,
    air,
    pressure,
    flow,
    speed,
    jetHeight: (speed * speed) / (2 * FOUNTAIN.g),
  };
}
/** Spherical flask: h^2(3R-h)/(4R^3) = filled volume fraction. */
export function fountainLiquidHeight(fraction: number, radius = 72) {
  const f = clamp(fraction),
    r = Math.max(0.1, radius);
  return r * (1 + 2 * Math.sin(Math.asin(2 * f - 1) / 3));
}
export function fountainDirector(chapter: number, p: number) {
  const c = Math.max(0, Math.min(4, chapter)),
    t = clamp(p);
  return {
    chapter: c,
    progress: t,
    time: c === 0 ? 0 : c === 1 ? t * 0.8 : c === 2 ? 1 + t * 26 : c === 3 ? 27 + t * 35 : 120,
    trigger: c !== 0,
    open: true,
    airFraction: c === 4 ? 0.4 : 0.03,
    view: c === 3 ? 'solution' : c === 4 ? 'comparison' : 'apparatus',
  };
}
