/** 2D Boussinesq teaching solver. Dimensionless x∈[0,1.5], y∈[0,1].
 * Streamfunction/vorticity enforce incompressibility; conservative face fluxes carry heat and dye.
 * Impermeable free-slip walls, insulated sides, prescribed plate temperatures. Not no-slip glass CFD.
 */
export type ConvectionOptions = {
  nx?: number;
  ny?: number;
  buoyancy?: number;
  viscosity?: number;
  diffusivity?: number;
  heating?: 'below' | 'above';
  seed?: number;
  initial?: 'linear' | 'uniform';
  offAt?: number | null;
};
export type ConvectionParameters = {
  nx: number;
  ny: number;
  width: number;
  height: number;
  dx: number;
  dy: number;
  buoyancy: number;
  viscosity: number;
  diffusivity: number;
  dyeDiffusivity: number;
  heating: 'below' | 'above';
  seed: number;
  initial: 'linear' | 'uniform';
  offAt: number | null;
  dt: number;
};
export type ConvectionParticle = { x: number; y: number; id: number };
export type ConvectionState = {
  p: ConvectionParameters;
  step: number;
  temperature: Float64Array;
  dye: Float64Array;
  omega: Float64Array;
  psi: Float64Array;
  particles: ConvectionParticle[];
  heatExchange: number;
  initialHeat: number;
  initialDye: number;
  maxCourant: number;
  maxBudgetError: number;
};
export function convectionParameters(o: ConvectionOptions = {}): ConvectionParameters {
  const nx = o.nx ?? 30,
    ny = o.ny ?? 20,
    buoyancy = o.buoyancy ?? 1,
    viscosity = o.viscosity ?? 0.02,
    diffusivity = o.diffusivity ?? 0.01,
    seed = o.seed ?? 0.02,
    offAt = o.offAt ?? null;
  if (
    ![nx, ny, buoyancy, viscosity, diffusivity, seed].every(Number.isFinite) ||
    !Number.isInteger(nx) ||
    !Number.isInteger(ny) ||
    nx < 12 ||
    nx > 48 ||
    ny < 8 ||
    ny > 32 ||
    buoyancy < 0 ||
    buoyancy > 1.5 ||
    viscosity < 0.015 ||
    viscosity > 0.06 ||
    diffusivity < 0.006 ||
    diffusivity > 0.025 ||
    seed < 0 ||
    seed > 0.04 ||
    (offAt !== null && (!Number.isFinite(offAt) || offAt < 0 || offAt > 60)) ||
    (o.heating !== undefined && !['below', 'above'].includes(o.heating)) ||
    (o.initial !== undefined && !['linear', 'uniform'].includes(o.initial))
  )
    throw new RangeError('Unsupported convection teaching domain');
  // A fixed per-configuration time grid makes checkpoints/replays independent of requested frames.
  const dx = 1.5 / nx,
    dy = 1 / ny,
    dt = Math.min(
      0.0125,
      0.35 / (viscosity * (1 / dx ** 2 + 1 / dy ** 2)),
      0.35 / (diffusivity * (1 / dx ** 2 + 1 / dy ** 2)),
    );
  return {
    nx,
    ny,
    width: 1.5,
    height: 1,
    dx,
    dy,
    buoyancy,
    viscosity,
    diffusivity,
    dyeDiffusivity: 0.0005,
    heating: o.heating ?? 'below',
    seed,
    initial: o.initial ?? 'linear',
    offAt,
    dt,
  };
}
export function convectionPlates(p: ConvectionParameters, time: number) {
  if (p.offAt !== null && time >= p.offAt) return { bottom: 0.5, top: 0.5 };
  return p.heating === 'below' ? { bottom: 1, top: 0 } : { bottom: 0, top: 1 };
}
const sum = (a: Float64Array) => a.reduce((s, v) => s + v, 0);
export function createConvection(o: ConvectionOptions = {}): ConvectionState {
  const p = convectionParameters(o),
    { nx, ny, dx, dy } = p,
    n = nx * ny,
    temperature = new Float64Array(n),
    dye = new Float64Array(n),
    plates = convectionPlates(p, 0);
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const x = (i + 0.5) * dx,
        y = (j + 0.5) * dy,
        base = p.initial === 'uniform' ? 0.5 : plates.bottom + (plates.top - plates.bottom) * y;
      temperature[i + nx * j] =
        base - p.seed * Math.cos((2 * Math.PI * x) / p.width) * Math.sin(Math.PI * y);
      dye[i + nx * j] = Math.exp(-((x - 0.55) ** 2 / 0.035 + (y - 0.2) ** 2 / 0.012));
    }
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: 0.12 + (i % 6) * 0.25,
    y: 0.13 + Math.floor(i / 6) * 0.23,
  }));
  return {
    p,
    step: 0,
    temperature,
    dye,
    omega: new Float64Array((nx + 1) * (ny + 1)),
    psi: new Float64Array((nx + 1) * (ny + 1)),
    particles,
    heatExchange: 0,
    initialHeat: sum(temperature) * dx * dy,
    initialDye: sum(dye) * dx * dy,
    maxCourant: 0,
    maxBudgetError: 0,
  };
}
export function cloneConvection(s: ConvectionState): ConvectionState {
  return {
    ...s,
    p: { ...s.p },
    temperature: s.temperature.slice(),
    dye: s.dye.slice(),
    omega: s.omega.slice(),
    psi: s.psi.slice(),
    particles: s.particles.map((p) => ({ ...p })),
  };
}
type PoissonPlan = { sx: Float64Array; sy: Float64Array; lambda: Float64Array };
const poissonPlans = new Map<string, PoissonPlan>();
function poissonPlan(p: ConvectionParameters) {
  const key = `${p.nx}/${p.ny}`,
    prior = poissonPlans.get(key);
  if (prior) return prior;
  const { nx, ny, dx, dy } = p,
    sx = new Float64Array(nx * nx),
    sy = new Float64Array(ny * ny),
    lambda = new Float64Array(nx * ny);
  for (let k = 1; k < nx; k++)
    for (let i = 1; i < nx; i++) sx[k * nx + i] = Math.sin((Math.PI * k * i) / nx);
  for (let l = 1; l < ny; l++)
    for (let j = 1; j < ny; j++) sy[l * ny + j] = Math.sin((Math.PI * l * j) / ny);
  for (let l = 1; l < ny; l++)
    for (let k = 1; k < nx; k++)
      lambda[k + nx * l] =
        (4 * Math.sin((Math.PI * k) / (2 * nx)) ** 2) / dx ** 2 +
        (4 * Math.sin((Math.PI * l) / (2 * ny)) ** 2) / dy ** 2;
  const plan = { sx, sy, lambda };
  if (poissonPlans.size >= 8) poissonPlans.delete(poissonPlans.keys().next().value!);
  poissonPlans.set(key, plan);
  return plan;
}
/** Direct separable sine solve of −Δ_h ψ = ω, ψ=0 at all four walls. */
export function convectionPoisson(p: ConvectionParameters, omega: Float64Array) {
  const { nx, ny } = p;
  if (omega.length !== (nx + 1) * (ny + 1)) throw new RangeError('Vorticity grid size mismatch');
  const { sx, sy, lambda } = poissonPlan(p),
    a = new Float64Array(nx * ny),
    b = new Float64Array(nx * ny),
    c = new Float64Array(nx * ny),
    out = new Float64Array((nx + 1) * (ny + 1));
  for (let j = 1; j < ny; j++)
    for (let k = 1; k < nx; k++) {
      let v = 0;
      for (let i = 1; i < nx; i++) v += omega[i + (nx + 1) * j] * sx[k * nx + i];
      a[k + nx * j] = v;
    }
  for (let k = 1; k < nx; k++)
    for (let l = 1; l < ny; l++) {
      let v = 0;
      for (let j = 1; j < ny; j++) v += a[k + nx * j] * sy[l * ny + j];
      b[k + nx * l] = ((v / lambda[k + nx * l]) * 4) / (nx * ny);
    }
  for (let k = 1; k < nx; k++)
    for (let j = 1; j < ny; j++) {
      let v = 0;
      for (let l = 1; l < ny; l++) v += b[k + nx * l] * sy[l * ny + j];
      c[k + nx * j] = v;
    }
  for (let j = 1; j < ny; j++)
    for (let i = 1; i < nx; i++) {
      let v = 0;
      for (let k = 1; k < nx; k++) v += c[k + nx * j] * sx[k * nx + i];
      out[i + (nx + 1) * j] = v;
    }
  return out;
}
/** Face-normal velocity is an exact discrete curl, giving zero cell divergence algebraically. */
export function convectionFaces(p: ConvectionParameters, psi: Float64Array) {
  const { nx, ny, dx, dy } = p,
    u = new Float64Array((nx + 1) * ny),
    v = new Float64Array(nx * (ny + 1)),
    stride = nx + 1;
  for (let j = 0; j < ny; j++)
    for (let i = 0; i <= nx; i++)
      u[i + stride * j] = (psi[i + stride * (j + 1)] - psi[i + stride * j]) / dy;
  for (let j = 0; j <= ny; j++)
    for (let i = 0; i < nx; i++)
      v[i + nx * j] = -(psi[i + 1 + stride * j] - psi[i + stride * j]) / dx;
  return { u, v };
}
export function convectionVelocity(
  p: ConvectionParameters,
  psi: Float64Array,
  x: number,
  y: number,
) {
  if (!Number.isFinite(x + y) || x < 0 || x > p.width || y < 0 || y > 1)
    throw new RangeError('Point outside the closed fluid cell');
  const i = Math.min(p.nx - 1, Math.floor(x / p.dx)),
    j = Math.min(p.ny - 1, Math.floor(y / p.dy)),
    fx = x / p.dx - i,
    fy = y / p.dy - j,
    k = i + (p.nx + 1) * j;
  const a = psi[k],
    b = psi[k + 1],
    c = psi[k + p.nx + 1],
    d = psi[k + p.nx + 2];
  return {
    u: ((1 - fx) * (c - a) + fx * (d - b)) / p.dy,
    v: -((1 - fy) * (b - a) + fy * (d - c)) / p.dx,
  };
}
export function convectionScalar(p: ConvectionParameters, a: Float64Array, x: number, y: number) {
  if (!Number.isFinite(x + y) || x < 0 || x > p.width || y < 0 || y > 1)
    throw new RangeError('Scalar probe outside cell');
  const gx = Math.max(0, Math.min(p.nx - 1, x / p.dx - 0.5)),
    gy = Math.max(0, Math.min(p.ny - 1, y / p.dy - 0.5)),
    i = Math.floor(gx),
    j = Math.floor(gy),
    ii = Math.min(i + 1, p.nx - 1),
    jj = Math.min(j + 1, p.ny - 1),
    fx = gx - i,
    fy = gy - j;
  return (
    (1 - fy) * ((1 - fx) * a[i + p.nx * j] + fx * a[ii + p.nx * j]) +
    fy * ((1 - fx) * a[i + p.nx * jj] + fx * a[ii + p.nx * jj])
  );
}
function transport(
  p: ConvectionParameters,
  a: Float64Array,
  u: Float64Array,
  v: Float64Array,
  diff: number,
  dt: number,
  plates: { bottom: number; top: number } | null,
) {
  const { nx, ny, dx, dy } = p,
    fx = new Float64Array((nx + 1) * ny),
    fy = new Float64Array(nx * (ny + 1));
  for (let j = 0; j < ny; j++)
    for (let i = 1; i < nx; i++) {
      const k = i + (nx + 1) * j,
        vel = u[k],
        lo = a[i - 1 + nx * j],
        hi = a[i + nx * j];
      fx[k] = vel * (vel >= 0 ? lo : hi) - (diff * (hi - lo)) / dx;
    }
  for (let j = 1; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const k = i + nx * j,
        vel = v[k],
        lo = a[i + nx * (j - 1)],
        hi = a[k];
      fy[k] = vel * (vel >= 0 ? lo : hi) - (diff * (hi - lo)) / dy;
    }
  if (plates)
    for (let i = 0; i < nx; i++) {
      fy[i] = (-2 * diff * (a[i] - plates.bottom)) / dy;
      fy[i + nx * ny] = (-2 * diff * (plates.top - a[i + nx * (ny - 1)])) / dy;
    }
  const next = new Float64Array(a.length);
  let bottom = 0,
    top = 0;
  for (let i = 0; i < nx; i++) {
    bottom += fy[i] * dx;
    top += fy[i + nx * ny] * dx;
  }
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const k = i + nx * j;
      next[k] =
        a[k] -
        dt * ((fx[i + 1 + (nx + 1) * j] - fx[i + (nx + 1) * j]) / dx + (fy[k + nx] - fy[k]) / dy);
    }
  return { next, exchange: dt * (bottom - top) };
}
function advectParticle(
  p: ConvectionParameters,
  psi: Float64Array,
  a: ConvectionParticle,
  dt: number,
): ConvectionParticle {
  const v = convectionVelocity(p, psi, a.x, a.y),
    x = a.x + (v.u * dt) / 2,
    y = a.y + (v.v * dt) / 2;
  if (x < 0 || x > p.width || y < 0 || y > 1) throw new RangeError('Tracer CFL boundary violation');
  const mid = convectionVelocity(p, psi, x, y),
    out = { ...a, x: a.x + mid.u * dt, y: a.y + mid.v * dt };
  if (out.x < 0 || out.x > p.width || out.y < 0 || out.y > 1)
    throw new RangeError('Tracer left closed fluid domain');
  return out;
}
/** One fixed deterministic explicit step. Refuses unsafe CFL rather than clipping field values. */
export function stepConvection(s: ConvectionState): ConvectionState {
  const p = s.p,
    { nx, ny, dx, dy, dt } = p,
    time = s.step * dt,
    { u, v } = convectionFaces(p, s.psi),
    stride = nx + 1;
  let maxRate = 0;
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++)
      maxRate = Math.max(
        maxRate,
        Math.max(Math.abs(u[i + stride * j]), Math.abs(u[i + 1 + stride * j])) / dx +
          Math.max(Math.abs(v[i + nx * j]), Math.abs(v[i + nx * (j + 1)])) / dy,
      );
  const courant = maxRate * dt,
    omegaRate = dt * (maxRate + 2 * p.viscosity * (1 / dx ** 2 + 1 / dy ** 2)),
    tempRate = dt * (maxRate + p.diffusivity * (2 / dx ** 2 + 3 / dy ** 2));
  if (Math.max(omegaRate, tempRate) > 0.98 || !Number.isFinite(maxRate))
    throw new RangeError('Convection stability bound exceeded');
  const omega = new Float64Array(s.omega.length),
    temp = s.temperature;
  for (let j = 1; j < ny; j++)
    for (let i = 1; i < nx; i++) {
      const k = i + stride * j,
        o = s.omega[k],
        ux = (s.psi[k + stride] - s.psi[k - stride]) / (2 * dy),
        vy = -(s.psi[k + 1] - s.psi[k - 1]) / (2 * dx);
      const adv =
        ux * (ux >= 0 ? (o - s.omega[k - 1]) / dx : (s.omega[k + 1] - o) / dx) +
        vy * (vy >= 0 ? (o - s.omega[k - stride]) / dy : (s.omega[k + stride] - o) / dy);
      const lap =
        (s.omega[k - 1] - 2 * o + s.omega[k + 1]) / dx ** 2 +
        (s.omega[k - stride] - 2 * o + s.omega[k + stride]) / dy ** 2;
      const tx =
        (temp[i + nx * j] -
          temp[i - 1 + nx * j] +
          temp[i + nx * (j - 1)] -
          temp[i - 1 + nx * (j - 1)]) /
        (2 * dx);
      omega[k] = o + dt * (-adv + p.viscosity * lap + p.buoyancy * tx);
    }
  const heat = transport(p, temp, u, v, p.diffusivity, dt, convectionPlates(p, time)),
    dye = transport(p, s.dye, u, v, p.dyeDiffusivity, dt, null).next;
  if (
    heat.next.some((v) => !Number.isFinite(v) || v < -1e-10 || v > 1 + 1e-10) ||
    dye.some((v) => !Number.isFinite(v) || v < -1e-10 || v > 1 + 1e-10) ||
    omega.some((v) => !Number.isFinite(v))
  )
    throw new RangeError('Convection bounded-field guard');
  const psi = convectionPoisson(p, omega),
    mid = s.psi.map((a, i) => (a + psi[i]) / 2),
    particles = s.particles.map((a) => advectParticle(p, mid, a, dt));
  const budgetError = Math.abs((sum(heat.next) - sum(temp)) * dx * dy - heat.exchange);
  return {
    ...s,
    step: s.step + 1,
    temperature: heat.next,
    dye,
    omega,
    psi,
    particles,
    heatExchange: s.heatExchange + heat.exchange,
    maxCourant: Math.max(s.maxCourant, courant),
    maxBudgetError: Math.max(s.maxBudgetError, budgetError),
  };
}
export function convectionDiagnostics(s: ConvectionState) {
  const p = s.p,
    { nx, ny, dx, dy } = p,
    { u, v } = convectionFaces(p, s.psi),
    plates = convectionPlates(p, s.step * p.dt);
  let divergence = 0,
    energy = 0,
    maxSpeed = 0,
    convective = 0,
    conductive = 0,
    kineticDissipation = 0;
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const k = i + nx * j,
        ux = (u[i + (nx + 1) * j] + u[i + 1 + (nx + 1) * j]) / 2,
        vy = (v[k] + v[k + nx]) / 2;
      energy += (ux * ux + vy * vy) * 0.5 * dx * dy;
      maxSpeed = Math.max(maxSpeed, Math.hypot(ux, vy));
      divergence = Math.max(
        divergence,
        Math.abs((u[i + 1 + (nx + 1) * j] - u[i + (nx + 1) * j]) / dx + (v[k + nx] - v[k]) / dy),
      );
    }
  const j = Math.floor(ny / 2);
  for (let i = 0; i < nx; i++) {
    const vel = v[i + nx * j],
      a = s.temperature[i + nx * (j - 1)],
      b = s.temperature[i + nx * j];
    convective += (vel * (vel >= 0 ? a : b)) / nx;
    conductive += (-p.diffusivity * (b - a)) / dy / nx;
  }
  for (let j = 1; j < ny; j++)
    for (let i = 1; i < nx; i++)
      kineticDissipation += p.viscosity * s.omega[i + (nx + 1) * j] ** 2 * dx * dy;
  let bottomFlux = 0,
    topFlux = 0;
  for (let i = 0; i < nx; i++) {
    bottomFlux += (2 * p.diffusivity * (plates.bottom - s.temperature[i])) / dy / nx;
    topFlux += (2 * p.diffusivity * (s.temperature[i + nx * (ny - 1)] - plates.top)) / dy / nx;
  }
  return {
    time: s.step * p.dt,
    energy,
    maxSpeed,
    divergence,
    convective,
    conductive,
    totalFlux: convective + conductive,
    bottomFlux,
    topFlux,
    heat: sum(s.temperature) * dx * dy,
    heatResidual: sum(s.temperature) * dx * dy - s.initialHeat - s.heatExchange,
    dyeResidual: sum(s.dye) * dx * dy - s.initialDye,
    minTemperature: Math.min(...s.temperature),
    maxTemperature: Math.max(...s.temperature),
    kineticDissipation,
  };
}
export function convectionTargetStep(p: ConvectionParameters, time: number) {
  if (!Number.isFinite(time) || time < 0 || time > 60)
    throw new RangeError('Requested model time outside [0,60]');
  return Math.floor(time / p.dt + 1e-8);
}
/** Bounded checkpoints accelerate deterministic replay; they never define the simulation clock. */
export class ConvectionRun {
  readonly initial: ConvectionState;
  private checkpoints = new Map<number, ConvectionState>();
  constructor(options: ConvectionOptions = {}) {
    this.initial = createConvection(options);
    this.checkpoints.set(0, this.initial);
  }
  nearest(time: number) {
    const target = convectionTargetStep(this.initial.p, time);
    let best = 0;
    for (const k of this.checkpoints.keys()) if (k <= target && k > best) best = k;
    return cloneConvection(this.checkpoints.get(best)!);
  }
  remember(s: ConvectionState) {
    if (s.step % 40 === 0) {
      if (this.checkpoints.size >= 130) {
        const key = [...this.checkpoints.keys()].find((k) => k !== 0);
        if (key !== undefined) this.checkpoints.delete(key);
      }
      this.checkpoints.set(s.step, cloneConvection(s));
    }
  }
  at(time: number) {
    let s = this.nearest(time),
      target = convectionTargetStep(s.p, time);
    while (s.step < target) {
      s = stepConvection(s);
      this.remember(s);
    }
    return s;
  }
  clear() {
    this.checkpoints.clear();
    this.checkpoints.set(0, this.initial);
  }
}
export type ConvectionShot = {
  chapter: number;
  time: number;
  primary: ConvectionOptions;
  comparison: ConvectionOptions | null;
  view: 'conduction' | 'seed' | 'plume' | 'dye' | 'transport' | 'above' | 'cooldown' | 'grid';
};
export function convectionShot(chapter: number, progress: number): ConvectionShot {
  if (!Number.isFinite(chapter + progress)) throw new RangeError('Finite director state required');
  const c = Math.max(0, Math.min(7, Math.floor(chapter))),
    q = Math.max(0, Math.min(1, progress));
  const primary: ConvectionOptions =
    c === 0 ? { initial: 'uniform', seed: 0 } : c === 6 ? { offAt: 24 } : {};
  const time =
    c === 0
      ? 8 * q
      : c === 1
        ? 8 * q
        : c === 2
          ? 8 + 14 * q
          : c === 3
            ? 22 + 14 * q
            : c === 4
              ? 28 * q
              : c === 5
                ? 28 * q
                : c === 6
                  ? 24 + 28 * q
                  : 20 + 12 * q;
  const comparison: ConvectionOptions | null =
    c === 4
      ? { buoyancy: 0 }
      : c === 5
        ? { heating: 'above' }
        : c === 7
          ? { nx: 42, ny: 28 }
          : null;
  return {
    chapter: c,
    time,
    primary,
    comparison,
    view: (
      ['conduction', 'seed', 'plume', 'dye', 'transport', 'above', 'cooldown', 'grid'] as const
    )[c],
  };
}
