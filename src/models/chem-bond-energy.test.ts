import { describe, it, expect } from 'vitest';
import {
  bondEnergyBook,
  carbonHess,
  carbonAtoms,
  trackedBondAtoms,
  bondDirector,
} from './chem-bond-energy';
describe('bond and Hess energy accounts', () => {
  it('matches textbook679 input862 output and−183 net without treating bond breaking as release', () => {
    expect(bondEnergyBook(0.5)).toMatchObject({ input: 679, output: 0, net: 679 });
    expect(bondEnergyBook(1)).toMatchObject({ input: 679, output: 862, net: -183 });
    expect(bondEnergyBook(0.25).net).toBeGreaterThan(0);
  });
  it('keeps the four tracked atom identities through both bookkeeping stages', () => {
    for (const p of [0, 0.2, 0.5, 0.8, 1]) {
      const a = trackedBondAtoms(p);
      expect(a.map((x) => x.id)).toEqual([0, 1, 2, 3]);
      expect(a.map((x) => x.element)).toEqual(['H', 'H', 'Cl', 'Cl']);
    }
    const a = trackedBondAtoms(1);
    expect(a[0].y).toBe(a[2].y);
    expect(a[1].y).toBe(a[3].y);
  });
  it('cancels the CO intermediate and conserves carbon/oxygen in every Hess equation', () => {
    const s = carbonHess();
    expect(s.sum).toEqual(s.direct);
    expect(s.sum.coefficients.CO).toBe(0);
    expect(s.unknown).toBe(-110.5);
    for (const q of [s.first, s.second, s.direct])
      expect(carbonAtoms(q)).toEqual({ carbon: 0, oxygen: 0 });
  });
  it('scaling and reversal change equations and enthalpy together', () => {
    for (const n of [0, 0.25, 1, 2])
      for (const reverse of [true, false]) {
        const s = carbonHess(n, reverse);
        expect(s.sum).toEqual(s.direct);
        expect(s.direct.enthalpy).toBeCloseTo(-393.5 * n * (reverse ? -1 : 1));
      }
    expect(bondEnergyBook(1, 0).net).toBe(0);
    expect(bondEnergyBook(1, 2).net).toBe(-366);
  });
  it('clamps progress and reconstructs deterministic seeks', () => {
    expect(bondEnergyBook(8)).toEqual(bondEnergyBook(1));
    expect(bondDirector(2, 0.5).bookProgress).toBe(0.75);
    expect(trackedBondAtoms(0.7)).toEqual(trackedBondAtoms(0.7));
  });
});
