/** Representative collisionless point particles: elastic box walls, isotropic second moment. */
export const gasConstants = {
  k: 1.380649e-23,
  NA: 6.02214076e23,
  R: 8.31446261815324,
  ambient: 101325,
};
export interface GasOptions {
  temperature?: number;
  volume?: number;
  groups?: number;
  neon?: boolean;
}
export function idealGas(o: GasOptions = {}) {
  const temperature = o.temperature ?? 300,
    volume = o.volume ?? 0.001,
    groups = o.groups ?? 2,
    molarMass = o.neon ? 0.0201797 : 0.004002602;
  if (
    ![temperature, volume].every((v) => Number.isFinite(v) && v > 0) ||
    !Number.isInteger(groups) ||
    groups < 0 ||
    groups > 10
  )
    throw new RangeError('Positive kelvins and volume, integer groups in [0,10] required');
  const count = 24 * groups,
    moles = count / 1200,
    mass = molarMass / gasConstants.NA,
    weight = gasConstants.NA / 1200,
    componentSpeed = Math.sqrt((gasConstants.R * temperature) / molarMass),
    lx = volume / 0.01,
    ly = 0.1,
    lz = 0.1,
    pressure = (moles * gasConstants.R * temperature) / volume;
  return {
    temperature,
    volume,
    groups,
    molarMass,
    count,
    moles,
    mass,
    weight,
    componentSpeed,
    lx,
    ly,
    lz,
    pressure,
    gauge: pressure - gasConstants.ambient,
    rms: Math.sqrt(3) * componentSpeed,
    energy: 1.5 * moles * gasConstants.R * temperature,
  };
}
const fract = (v: number) => v - Math.floor(v);
export function gasInitial(index: number, o: GasOptions = {}) {
  const s = idealGas(o),
    i = index % 24,
    permutation = Math.floor(i / 8),
    sign = i % 8,
    base = [0.6, 1, Math.sqrt(1.64)],
    v = [0, 1, 2].map(
      (a) => base[(a + permutation) % 3] * ((sign >> a) & 1 ? 1 : -1) * s.componentSpeed,
    ),
    q = [
      fract((index + 1) * 0.61803398875),
      fract((index + 1) * 0.41421356237),
      fract((index + 1) * 0.73205080757),
    ];
  return { q, v };
}
export function boxCoordinate(position: number, velocity: number, time: number, length: number) {
  const u = position + velocity * time,
    period = 2 * length,
    folded = ((u % period) + period) % period;
  return {
    position: folded <= length ? folded : period - folded,
    velocity: folded < length ? velocity : -velocity,
  };
}
export function gasParticle(index: number, time: number, o: GasOptions = {}) {
  const s = idealGas(o),
    { q, v } = gasInitial(index, o),
    lengths = [s.lx, s.ly, s.lz],
    state = q.map((a, j) => boxCoordinate(a * lengths[j], v[j], time, lengths[j]));
  return {
    position: state.map((a) => a.position),
    velocity: state.map((a) => a.velocity),
    initial: q,
    v0: v,
  };
}
/** Number of visits to the right wall during (start,end], using unfolded trajectories. */
export function rightWallHits(x: number, vx: number, length: number, start: number, end: number) {
  const a = x + vx * start,
    b = x + vx * end,
    startIndex = (a / length - 1) / 2,
    endIndex = (b / length - 1) / 2;
  return Math.max(
    0,
    vx >= 0
      ? Math.floor(endIndex) - Math.floor(startIndex)
      : Math.ceil(startIndex) - Math.ceil(endIndex),
  );
}
export function gasWallMeasurement(time: number, window = 0.01, o: GasOptions = {}) {
  if (!Number.isFinite(time) || !Number.isFinite(window) || window <= 0)
    throw new RangeError('Finite time and positive averaging window required');
  const s = idealGas(o);
  let impulse = 0,
    hits = 0;
  for (let i = 0; i < s.count; i++) {
    const { q, v } = gasInitial(i, o),
      n = rightWallHits(q[0] * s.lx, v[0], s.lx, time - window, time);
    hits += n;
    impulse += n * 2 * s.mass * Math.abs(v[0]) * s.weight;
  }
  return { pressure: impulse / (window * s.ly * s.lz), impulse, hits, window };
}
export function lastRightHit(index: number, time: number, o: GasOptions = {}) {
  const s = idealGas(o),
    { q, v } = gasInitial(index, o),
    u = q[0] * s.lx + v[0] * time,
    k = v[0] > 0 ? Math.floor((u / s.lx - 1) / 2) : Math.ceil((u / s.lx - 1) / 2),
    at = ((2 * k + 1) * s.lx - q[0] * s.lx) / v[0];
  const state = gasParticle(index, at, o);
  return {
    at,
    position: [s.lx, state.position[1], state.position[2]],
    impulse: 2 * s.mass * Math.abs(v[0]) * s.weight,
  };
}
export function idealGasShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    base = { temperature: 300, volume: 0.001, groups: 2, neon: false, gaugeView: false };
  if (chapter === 1) return { ...base, temperature: 300 + 300 * p };
  if (chapter === 2) return { ...base, volume: 0.0015 - 0.00075 * p };
  if (chapter === 3) return { ...base, groups: p < 1 / 3 ? 1 : p < 2 / 3 ? 2 : 3 };
  if (chapter === 4) return { ...base, temperature: 300 + 300 * p, gaugeView: true };
  if (chapter === 5) return { ...base, neon: p >= 0.5 };
  return base;
}
