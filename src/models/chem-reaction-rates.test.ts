import { it, expect } from 'vitest';
import {
  GAS_ML,
  peroxide,
  marble,
  turbidity,
  zincGas,
  observedRate,
  collision,
  collisionTrial,
  energyProfile,
  syringeGeometry,
} from './chem-reaction-rates';
it('ideal gas benchmark and Zn stoichiometry agree independently', () => {
  expect(GAS_ML).toBeCloseTo(24465.4, 0);
  expect(zincGas(0, 1).endpoint).toBeCloseTo(30, 8);
  expect(zincGas(0, 4).endpoint).toBeCloseTo(7.5, 8);
  expect(zincGas(0, 1).finalMl).toBeCloseTo(zincGas(0, 4).finalMl);
  expect(zincGas(30, 1).volumeMl).toBeCloseTo(10, 8);
  const z = zincGas(30, 1, 0.5);
  expect(z.collected + z.leaked).toBeCloseTo(z.produced, 12);
  expect(zincGas(30, 1, 1).endpoint).toBeNull();
  expect(zincGas(30, 0).volumeMl).toBe(0);
  expect(observedRate('')).toBeNull();
  expect(observedRate('0')).toBeNull();
  expect(observedRate('NaN')).toBeNull();
  expect(observedRate('20')).toBe(0.5);
});
it('temperature and catalyst change speed but not stoichiometric yield; late-time rate can reverse', () => {
  const a = peroxide(10, 20, 'Fe'),
    b = peroxide(10, 50, 'Fe');
  expect(b.oxygen).toBeGreaterThan(a.oxygen);
  expect(a.remaining + 2 * a.oxygen).toBeCloseTo(a.n0, 12);
  expect(peroxide(1e9, 25, 'Fe').oxygen).toBeCloseTo(peroxide(1e9, 25, 'none').oxygen, 12);
  expect(peroxide(1000, 50, 'Fe').rate).toBeLessThan(peroxide(1000, 20, 'Fe').rate);
  expect(peroxide(10, 25, 'Mn').rate).toBe(peroxide(10, 25, 'Fe').rate);
});
it('equal total volume separates initial concentration and optical endpoint assumptions', () => {
  const a = turbidity(0, 2, 25),
    b = turbidity(0, 1, 25);
  expect(a.c0).toBe(0.05);
  expect(b.c0).toBe(0.025);
  expect(a.volumeMl).toBe(b.volumeMl);
  expect(turbidity(a.endpoint!, 2, 25).transmission).toBeCloseTo(0.5, 10);
  expect(b.endpoint!).toBeGreaterThan(a.endpoint!);
  expect(turbidity(1000, 0.2, 25).endpoint).toBeNull();
  expect(turbidity(0, 2, 50).endpoint!).toBeLessThan(a.endpoint!);
});
it('marble acid limitation means total gas is not a speed measurement', () => {
  expect(marble(1e6, 0.1).volume).toBeCloseTo(GAS_ML * 0.0001);
  expect(marble(1e6, 1).volume).toBeCloseTo(GAS_ML * 0.001);
  expect(marble(0, 0.1, 2).initialRate).toBeCloseTo(2 * marble(0, 0.1, 1).initialRate);
});
it('collision preserves atom identities, contacts and continuous trajectories at bond change', () => {
  for (const w of [240, 320, 800])
    for (const oriented of [true, false])
      for (const enough of [true, false])
        for (let n = 0; n <= 100; n++) {
          const c = collision(w, n / 100, enough, oriented);
          expect(c.atoms.map((a) => a.id)).toEqual(['H1', 'I1', 'H2', 'I2']);
          for (const a of c.atoms) {
            expect(a.x - a.r).toBeGreaterThanOrEqual(0);
            expect(a.x + a.r).toBeLessThanOrEqual(w);
          }
        }
  const a = collision(320, 0.45, true, true),
    b = collision(320, 0.450001, true, true);
  a.atoms.forEach((x, i) => {
    expect(Math.abs(x.x - b.atoms[i].x)).toBeLessThan(0.001);
    expect(Math.abs(x.y - b.atoms[i].y)).toBeLessThan(0.001);
  });
  expect(collision(320, 1, true, true).ii).toBe(true);
  expect(collision(320, 1, false, true).hi).toBe(true);
  expect(collision(320, 1, true, false).hi).toBe(true);
});
it('catalysis keeps endpoints and syringe displacement shares its scale', () => {
  for (const c of [true, false]) {
    expect(energyProfile(0, c)).toBeCloseTo(0);
    expect(energyProfile(1, c)).toBeCloseTo(-20);
  }
  expect(energyProfile(0.5, true)).toBeLessThan(energyProfile(0.5, false));
  for (const w of [240, 320, 800]) {
    const g = syringeGeometry(w, 10);
    expect(g.piston).toBe(g.tick10);
    expect(g.x0).toBeGreaterThan(0);
    expect(g.stop + 38).toBeLessThan(w);
  }
});

it('film holds both trial endpoints so the completed iodine molecule remains observable', () => {
  for (const p of [0.43, 0.47, 0.49]) {
    const trial = collisionTrial(p);
    expect(trial.trial).toBe(0);
    expect(collision(320, trial.progress, false, true).hi).toBe(true);
  }
  for (const p of [0.93, 0.96, 0.99]) {
    const trial = collisionTrial(p);
    const final = collision(320, trial.progress, true, true);
    expect(trial.trial).toBe(1);
    expect(final.ii).toBe(true);
    expect(final.radicals).toBe(false);
    expect(final.atoms[3].x - final.atoms[1].x).toBe(24);
  }
});
