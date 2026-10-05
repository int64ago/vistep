/** Aurelia aurita swimming: geometric continuity plus a deliberately low-order
 * propulsion model. Vortex force is energy-bounded and illustrative, not CFD or
 * a fit to Gemmell et al. 2013 (doi:10.1073/pnas.1306983110).
 */
export type JellyParameters = { amplitude: number; period: number; recovery: boolean };
export const JELLY = {
  radius: 0.02,
  height: 0.009,
  density: 1025,
  contractionEnd: 0.25,
  relaxationEnd: 0.72,
  duration: 8,
  dt: 1 / 240,
} as const;
export const JELLY_DEFAULT: JellyParameters = { amplitude: 0.22, period: 2, recovery: true };
export type JellyShape = {
  phase: number;
  compression: number;
  amplitude: number;
  radius: number;
  height: number;
  volume: number;
  volumeRate: number;
  outflow: number;
  inflow: number;
  stage: 'contract' | 'relax' | 'rest';
};
export type JellyFrame = JellyShape & {
  time: number;
  speed: number;
  distance: number;
  activeForce: number;
  recoveryForce: number;
  drag: number;
  vortexEnergy: number;
  wakeEnergy: number;
  releasedEnergy: number;
  recoveredWork: number;
  motorWork: number;
};
export function jellyValidate(p: JellyParameters) {
  if (
    !Number.isFinite(p.amplitude) ||
    !Number.isFinite(p.period) ||
    p.amplitude < 0 ||
    p.amplitude > 0.35 ||
    p.period < 0.8 ||
    p.period > 4
  )
    throw new RangeError('Finite jellyfish amplitude 0–.35 and period .8–4 seconds required.');
}
export function jellyShape(time: number, p = JELLY_DEFAULT): JellyShape {
  jellyValidate(p);
  if (!Number.isFinite(time) || time < 0)
    throw new RangeError('Jellyfish time must be finite and nonnegative.');
  const phase = (time / p.period) % 1;
  let compression = 0,
    rate = 0;
  if (phase < JELLY.contractionEnd) {
    const u = phase / JELLY.contractionEnd;
    compression = (1 - Math.cos(Math.PI * u)) / 2;
    rate = (Math.PI * Math.sin(Math.PI * u)) / (2 * JELLY.contractionEnd * p.period);
  } else if (phase < JELLY.relaxationEnd) {
    const u = (phase - JELLY.contractionEnd) / (JELLY.relaxationEnd - JELLY.contractionEnd);
    compression = (1 + Math.cos(Math.PI * u)) / 2;
    rate =
      (-Math.PI * Math.sin(Math.PI * u)) /
      (2 * (JELLY.relaxationEnd - JELLY.contractionEnd) * p.period);
  }
  const heightGain = (0.18 * p.amplitude) / 0.22;
  const radius = JELLY.radius * (1 - p.amplitude * compression),
    height = JELLY.height * (1 + heightGain * compression);
  const dr = -JELLY.radius * p.amplitude * rate,
    dh = JELLY.height * heightGain * rate;
  const volume = (2 / 3) * Math.PI * radius ** 2 * height;
  const volumeRate = (2 / 3) * Math.PI * (2 * radius * dr * height + radius ** 2 * dh);
  return {
    phase,
    compression,
    amplitude: p.amplitude,
    radius,
    height,
    volume,
    volumeRate,
    outflow: Math.max(0, -volumeRate),
    inflow: Math.max(0, volumeRate),
    stage: phase < 0.25 ? 'contract' : phase < 0.72 ? 'relax' : 'rest',
  };
}
export function jellyRun(
  p = JELLY_DEFAULT,
  duration = JELLY.duration as number,
  dt = JELLY.dt as number,
): JellyFrame[] {
  jellyValidate(p);
  if (
    !Number.isFinite(duration) ||
    duration < 0 ||
    duration > 16 ||
    !Number.isFinite(dt) ||
    dt <= 0 ||
    dt > 0.02
  )
    throw new RangeError('A bounded duration and integration step are required.');
  const mass = JELLY.density * (2 / 3) * Math.PI * JELLY.radius ** 2 * JELLY.height * 1.8;
  let speed = 0,
    distance = 0,
    vortexEnergy = 0,
    wakeEnergy = 0,
    releasedEnergy = 0,
    recoveredWork = 0,
    motorWork = 0;
  const frames: JellyFrame[] = [];
  let lastTime = 0;
  const count = Math.ceil(duration / dt);
  for (let i = 0; i <= count; i++) {
    const time = Math.min(duration, i * dt),
      h = time - lastTime,
      shape = jellyShape(time, p);
    // Use the same open bell area as the geometry. This bulk flux surrogate
    // omits the oblate animal's spatial pressure distribution and entrainment.
    const aperture = Math.PI * shape.radius ** 2;
    const activeForce = (JELLY.density * shape.outflow ** 2) / aperture;
    const jetPower = (0.5 * JELLY.density * shape.outflow ** 3) / aperture ** 2;
    const deposit = jetPower * h * 0.35;
    wakeEnergy += jetPower * h;
    vortexEnergy += p.recovery ? deposit : 0;
    const u = (shape.phase - JELLY.relaxationEnd) / (1 - JELLY.relaxationEnd);
    const envelope = u > 0 && u < 1 ? Math.sin(Math.PI * u) ** 2 : 0;
    const release = Math.min(vortexEnergy, vortexEnergy * (12 / p.period) * envelope * h);
    const power = h > 0 ? release / h : 0;
    let recoveryForce = power / Math.max(speed, 0.002);
    const drag = 0.5 * JELLY.density * 0.8 * Math.PI * shape.radius ** 2 * speed ** 2;
    let nextSpeed = Math.max(0, speed + ((activeForce + recoveryForce - drag) / mass) * h);
    let nextDistance = distance + 0.5 * (speed + nextSpeed) * h;
    const requestedWork = recoveryForce * (nextDistance - distance);
    if (requestedWork > release) {
      // Use the displayed step displacement, including acceleration, for work.
      // Displacement is monotone in this positive force: reducing the force by
      // this ratio and recomputing motion cannot exceed the released budget.
      // The tiny margin also covers floating-point rounding at equality.
      recoveryForce *= (release / requestedWork) * (1 - 8 * Number.EPSILON);
      nextSpeed = Math.max(0, speed + ((activeForce + recoveryForce - drag) / mass) * h);
      nextDistance = distance + 0.5 * (speed + nextSpeed) * h;
    }
    vortexEnergy -= release;
    releasedEnergy += release;
    recoveredWork += recoveryForce * (nextDistance - distance);
    motorWork += (activeForce * speed + jetPower) * h;
    distance = nextDistance;
    speed = nextSpeed;
    frames.push({
      ...shape,
      time,
      speed,
      distance,
      activeForce,
      recoveryForce,
      drag,
      vortexEnergy,
      wakeEnergy,
      releasedEnergy,
      recoveredWork,
      motorWork,
    });
    lastTime = time;
  }
  return frames;
}
export function jellyFrame(trace: JellyFrame[], time: number): JellyFrame {
  if (!trace.length || !Number.isFinite(time))
    throw new RangeError('A trace and finite seek time are required.');
  let low = 0,
    high = trace.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (trace[mid].time <= time) low = mid;
    else high = mid - 1;
  }
  return trace[low];
}
export type JellyView = 'animal' | 'volume' | 'vortices' | 'pressure' | 'compare';
export type JellyShot = {
  view: JellyView;
  time: number;
  anatomy: boolean;
  section: boolean;
  close: boolean;
};
const clamp = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
export function jellyShot(chapter: number, progress: number): JellyShot {
  const p = clamp(progress),
    range = (a: number, b: number) => a + (b - a) * p;
  if (chapter === 0)
    return { view: 'animal', time: range(0, 4), anatomy: true, section: false, close: false };
  if (chapter === 1)
    return { view: 'volume', time: range(0.02, 0.5), anatomy: false, section: true, close: false };
  if (chapter === 2)
    return {
      view: 'vortices',
      time: range(0.22, 0.58),
      anatomy: false,
      section: true,
      close: true,
    };
  if (chapter === 3)
    return { view: 'vortices', time: range(0.5, 1.44), anatomy: false, section: true, close: true };
  if (chapter === 4)
    return {
      view: 'pressure',
      time: range(1.44, 1.98),
      anatomy: false,
      section: true,
      close: false,
    };
  if (chapter === 5)
    return { view: 'compare', time: range(0, 8), anatomy: false, section: true, close: false };
  // End inside the fully relaxed interval so the final held frame retains the
  // stopping vortex beneath the bell, rather than resetting at the next pulse.
  return { view: 'vortices', time: range(4, 7.8), anatomy: false, section: false, close: false };
}
export type JellyVortex = {
  type: 'starting' | 'stopping';
  radius: number;
  y: number;
  strength: number;
  rotation: 1 | -1;
};
/** Schematic ring locations, linked to the phase but not a solved flow field. */
export function jellyVortices(frame: JellyFrame): JellyVortex[] {
  if (frame.amplitude === 0 || frame.wakeEnergy === 0) return [];
  const p = frame.phase,
    r = frame.radius / JELLY.radius;
  const starting =
    p > 0.08
      ? [
          {
            type: 'starting' as const,
            radius: 0.92 - r * 0.08,
            y: -0.15 - 1.8 * clamp((p - 0.08) / 0.92),
            strength: Math.sin(Math.PI * clamp((p - 0.08) / 0.92)) * 0.72,
            rotation: 1 as const,
          },
        ]
      : [];
  const stopping =
    p > 0.22
      ? [
          {
            type: 'stopping' as const,
            radius: r * (0.93 - 0.3 * clamp((p - 0.22) / 0.5)),
            y: 0.15 - 0.22 * clamp((p - 0.22) / 0.5),
            strength: Math.sin(Math.PI * clamp((p - 0.22) / 0.95)) * 0.85,
            rotation: -1 as const,
          },
        ]
      : [];
  return [...starting, ...stopping];
}
