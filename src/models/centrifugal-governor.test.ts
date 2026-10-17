import { describe, it, expect } from 'vitest';
import { governorDefaults, governorEquilibrium, governorTrajectory } from './centrifugal-governor';
describe('Watt geometry and disclosed feedback approximation', () => {
  it('matches h=g/omega squared and keeps both link lengths exact', () => {
    const g = governorEquilibrium(8);
    expect(g.height).toBeCloseTo(9.81 / 64);
    expect(Math.hypot(g.radius, g.height)).toBeCloseTo(0.25);
    expect(g.rise).toBeCloseTo(0.5 - (2 * 9.81) / 64);
  });
  it('has physical angular stops instead of overlapping balls at zero speed', () => {
    const g = governorEquilibrium(0);
    expect((g.alpha * 180) / Math.PI).toBeCloseTo(12);
    expect(g.radius).toBeGreaterThan(0.05);
    expect((governorEquilibrium(100).alpha * 180) / Math.PI).toBeCloseTo(65);
  });
  it('retains the reference equilibrium without a disturbance', () => {
    const p = { ...governorDefaults(), loadStep: 0 },
      out = governorTrajectory(p);
    expect(out.at(-1)!.rpm).toBeCloseTo(72, 10);
  });
  it('opens the valve after added load and settles with nonzero droop', () => {
    const p = governorDefaults(),
      out = governorTrajectory(p),
      last = out.at(-1)!;
    expect(last.rpm).toBeLessThan(72);
    expect(last.rpm).toBeGreaterThan(65);
    expect(last.valve).toBeGreaterThan(out[0].valve);
    expect(last.torque - last.load - p.drag * last.omega).toBeCloseTo(0, 4);
  });
  it('same load with a disconnected fixed valve stalls; feedback keeps it turning', () => {
    const p = { ...governorDefaults(), feedback: false },
      last = governorTrajectory(p).at(-1)!;
    expect(last.rpm).toBe(0);
    expect(last.valve).toBeCloseTo((5 + (0.2 * 72 * Math.PI) / 30) / 12);
  });
  it('shows greater transient speed excursion with a slower sensor response', () => {
    const quick = governorTrajectory(governorDefaults()),
      slow = governorTrajectory({ ...governorDefaults(), lag: 3 });
    expect(Math.min(...slow.map((s) => s.rpm))).toBeLessThan(
      Math.min(...quick.map((s) => s.rpm)) - 2,
    );
  });
  it('converges on halved time steps and rejects invalid dynamics', () => {
    const p = governorDefaults(),
      a = governorTrajectory(p, 10, 0.01).at(-1)!,
      b = governorTrajectory(p, 10, 0.005).at(-1)!;
    expect(a.rpm).toBeCloseTo(b.rpm, 5);
    expect(() => governorTrajectory({ ...p, lag: 0 })).toThrow();
  });
});
