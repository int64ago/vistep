import { describe, expect, it } from 'vitest';
import {
  WATER_HAMMER,
  hammerParameters,
  hammerValve,
  hammerOpening,
  simulateWaterHammer,
  sampleWaterHammer,
  hammerEnergy,
  waterHammerShot,
} from './water-hammer';

describe('linear elastic water hammer and characteristic boundaries', () => {
  it('combines water and wall compliance, and approaches both analytic stiff limits', () => {
    const p = hammerParameters(),
      soft = hammerParameters({ young: 20e9 });
    expect(p.waveSpeed).toBeCloseTo(
      1 / Math.sqrt(p.density * (1 / p.bulk + p.diameter / (p.young * p.thickness))),
      10,
    );
    expect((p.dt * p.waveSpeed) / p.dx).toBeCloseTo(1, 14);
    expect(soft.waveSpeed).toBeLessThan(p.waveSpeed);
    expect(soft.joukowsky).toBeLessThan(p.joukowsky);
    expect(hammerParameters({ support: 0 }).waveSpeed).toBeCloseTo(
      Math.sqrt(p.bulk / p.density),
      10,
    );
    expect(hammerParameters({ young: 1e25 }).waveSpeed).toBeCloseTo(
      Math.sqrt(p.bulk / p.density),
      8,
    );
  });
  it('resolves the actual orifice boundary instead of equating handle travel with flow', () => {
    const p = hammerParameters();
    for (const opening of [0.1, 0.4, 0.8, 1])
      for (const incoming of [-2, 0, 1, 2]) {
        const v = hammerValve(incoming, opening, p);
        expect(v.velocity + (v.pressure - p.pressure) / p.impedance).toBeCloseTo(incoming, 12);
        const expected =
          (opening ** 2 * p.speed ** 2 * (v.pressure - p.downstream)) / (p.pressure - p.downstream);
        expect(v.velocity * Math.abs(v.velocity)).toBeCloseTo(expected, 12);
      }
    const half = hammerValve(p.speed, 0.5, p);
    expect(half.velocity).not.toBeCloseTo(p.speed * 0.5, 2);
    expect(hammerOpening(0, 0.8)).toBe(1);
    expect(hammerOpening(0.8, 0.8)).toBe(0);
  });
  it('recovers the instantaneous Joukowsky rise and a front travelling at a, not at water speed', () => {
    const run = simulateWaterHammer({ closure: 0, horizon: 0.4 }),
      p = run.parameters;
    const s = sampleWaterHammer(run, p.transit / 2);
    expect(s.valveRise).toBeCloseTo(p.joukowsky, 7);
    expect(s.pressure[Math.round(p.cells * 0.25)]).toBeCloseTo(p.pressure, 7);
    expect(s.velocity[Math.round(p.cells * 0.25)]).toBeCloseTo(p.speed, 12);
    expect(s.pressure[Math.round(p.cells * 0.75)]).toBeCloseTo(p.pressure + p.joukowsky, 7);
    expect(s.velocity[Math.round(p.cells * 0.75)]).toBeCloseTo(0, 12);
    expect(p.waveSpeed / p.speed).toBeGreaterThan(1000);
  });
  it('keeps reservoir pressure fixed and reflects at the closed valve after the round trip', () => {
    const run = simulateWaterHammer({ closure: 0, horizon: 0.4 }),
      p = run.parameters;
    for (const frame of run.frames) {
      expect(frame.pressure[0]).toBe(p.pressure);
      expect(frame.velocity[p.cells]).toBe(0);
    }
    const reflected = sampleWaterHammer(run, 1.5 * p.transit);
    expect(reflected.pressure[Math.round(p.cells * 0.25)]).toBeCloseTo(p.pressure, 7);
    expect(reflected.velocity[Math.round(p.cells * 0.25)]).toBeCloseTo(-p.speed, 12);
    const low = sampleWaterHammer(run, 2.5 * p.transit);
    expect(low.valveRise).toBeCloseTo(-p.joukowsky, 7);
    expect(sampleWaterHammer(run, 4.5 * p.transit).valveRise).toBeCloseTo(p.joukowsky, 7);
  });
  it('conserves discrete linear-system energy after an instantaneous lossless closure', () => {
    const run = simulateWaterHammer({ closure: 0, horizon: 0.8 }),
      p = run.parameters;
    for (const frame of run.frames) {
      const e = hammerEnergy(frame, p);
      expect(e.total / p.initialEnergy).toBeCloseTo(1, 10);
    }
    const first = sampleWaterHammer(run, 0.9 * p.transit).energy;
    expect(first.fluid).toBeGreaterThan(first.kinetic);
    expect(first.wall / first.fluid).toBeCloseTo(p.wallCompliance / p.fluidCompliance, 12);
  });
  it('balances compression/expansion storage with the boundary-flow integral', () => {
    const run = simulateWaterHammer({ closure: 0.03, horizon: 0.5 }),
      p = run.parameters;
    let volume = 0;
    for (let i = 1; i < run.frames.length; i++) {
      const a = run.frames[i - 1],
        b = run.frames[i];
      volume +=
        p.area *
        0.5 *
        (a.velocity[0] - a.velocity[p.cells] + (b.velocity[0] - b.velocity[p.cells])) *
        (b.time - a.time);
      expect(hammerEnergy(b, p).storage).toBeCloseTo(volume, 10);
    }
  });
  it('reduces the modeled peak for slow closure using exactly the same initial pipe and flow', () => {
    const fast = simulateWaterHammer({ closure: 0.02, horizon: 1.2 }),
      slow = simulateWaterHammer({ closure: 0.9, horizon: 1.2 });
    const peak = (r: typeof fast) =>
      Math.max(...r.frames.map((f) => f.pressure[r.parameters.cells] - r.parameters.pressure));
    expect(fast.parameters.speed).toBe(slow.parameters.speed);
    expect(fast.parameters.length).toBe(slow.parameters.length);
    expect(fast.parameters.waveSpeed).toBe(slow.parameters.waveSpeed);
    expect(peak(fast)).toBeCloseTo(fast.parameters.joukowsky, 6);
    expect(peak(slow)).toBeLessThan(peak(fast) * 0.4);
  });
  it('converges on a non-grid-aligned gradual-closure/reflection snapshot', () => {
    const setup = { closure: 0.073, horizon: 0.33 },
      at = 0.27183;
    const reference = sampleWaterHammer(simulateWaterHammer({ ...setup, cells: 1024 }), at);
    const error = (cells: number) => {
      const s = sampleWaterHammer(simulateWaterHammer({ ...setup, cells }), at);
      let total = 0;
      for (let i = 0; i <= cells; i++)
        total += Math.abs(s.pressure[i] - reference.pressure[(i * 1024) / cells]);
      return total / (cells + 1) / reference.parameters.joukowsky;
    };
    const coarse = error(32),
      medium = error(64),
      fine = error(128);
    expect(medium).toBeLessThan(coarse * 0.7);
    expect(fine).toBeLessThan(medium * 0.7);
    expect(fine).toBeLessThan(0.003);
  });
  it('terminates at vapor pressure and never exposes a below-vapor continuation', () => {
    const run = simulateWaterHammer({ pressure: 0.8e6, horizon: 1.2 }),
      p = run.parameters;
    expect(run.failure).not.toBeNull();
    expect(run.failure!.time).toBeGreaterThan(p.transit);
    for (const f of run.frames)
      expect(Math.min(...f.pressure)).toBeGreaterThanOrEqual(p.vapor - 1e-7);
    const stop = sampleWaterHammer(run, run.failure!.time),
      later = sampleWaterHammer(run, 1.2);
    expect(stop.minPressure).toBeCloseTo(p.vapor, 7);
    expect(later.pressure).toEqual(stop.pressure);
    expect(later.time).toBe(run.failure!.time);
    expect(later.failure?.kind).toBe('vapor');
  });
  it('reconstructs every directed shot independently of seek order', () => {
    const target = waterHammerShot(3, 0.617);
    for (let c = 7; c >= 0; c--)
      for (const q of [0, 0.25, 0.5, 0.75, 1]) {
        const shot = waterHammerShot(c, q);
        expect(shot.state.minPressure).toBeGreaterThanOrEqual(WATER_HAMMER.vapor - 1e-6);
        expect(shot.state.parameters.cells).toBe(96);
      }
    expect(waterHammerShot(3, 0.617)).toEqual(target);
  });
  it('stops when a reflected wave lands exactly on vapor pressure at a grid endpoint', () => {
    // With rigid walls, rho=1000 and K=1e9, a=1000 and Z=1e6 exactly.
    // Initial absolute pressure Z*U0+pv gives p_low=pv without rounding below it.
    const run = simulateWaterHammer({
      closure: 0,
      support: 0,
      density: 1000,
      bulk: 1e9,
      pressure: 1002338,
      cells: 24,
      horizon: 0.4,
    });
    expect(run.parameters.impedance).toBe(1e6);
    expect(run.failure).not.toBeNull();
    expect(run.failure!.time).toBeCloseTo(run.parameters.roundTrip, 14);
    expect(run.frames.at(-1)!.pressure[24]).toBe(run.parameters.vapor);
    expect(run.frames.at(-1)!.time).toBe(run.failure!.time);
    expect(sampleWaterHammer(run, 0.4).time).toBe(run.failure!.time);
  });
  it('has the zero-flow limit and rejects unsupported numerical inputs', () => {
    const run = simulateWaterHammer({ speed: 0, horizon: 0.3 });
    for (const f of run.frames) {
      expect([...f.velocity].every((v) => v === 0)).toBe(true);
      expect([...f.pressure].every((v) => v === run.parameters.pressure)).toBe(true);
    }
    expect(() => hammerParameters({ cells: 97.5 })).toThrow();
    expect(() => hammerParameters({ young: NaN })).toThrow();
    expect(() => hammerParameters({ pressure: 1000 })).toThrow();
    expect(() => sampleWaterHammer(run, Infinity)).toThrow();
  });
});
