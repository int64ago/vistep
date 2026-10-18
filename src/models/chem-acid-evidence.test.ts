import { it, expect } from 'vitest';
import {
  ACETIC_KA,
  acidInjection,
  acidSpeciation,
  acidMeter,
  acidCurve,
  magnesiumPressure,
  qualitativeMagnesium,
  carbonateAddition,
} from './chem-acid-evidence';
it('pH and Ka agree with independent weak-acid quadratic and water boundary', () => {
  const a = acidSpeciation('HAc', 0.1),
    x = (2 * ACETIC_KA * 0.1) / (Math.sqrt(ACETIC_KA ** 2 + 4 * ACETIC_KA * 0.1) + ACETIC_KA);
  expect(a.h).toBeCloseTo(x, 10);
  expect(a.pH).toBeCloseTo(2.881, 2);
  expect((a.h * a.anion) / a.molecular).toBeCloseTo(ACETIC_KA, 10);
  expect(acidSpeciation('HCl', 0.1).pH).toBeCloseTo(1, 10);
  expect(acidSpeciation('HAc', 0).pH).toBeCloseTo(7);
  expect(acidSpeciation('HCl', 0).pH).toBeCloseTo(7);
});
it('dilution increases dissociation fraction but decreases ion concentration; strength alone does not order conductivity', () => {
  const a = acidSpeciation('HAc', 0.1),
    b = acidSpeciation('HAc', 0.001);
  expect(b.fraction).toBeGreaterThan(a.fraction);
  expect(b.h).toBeLessThan(a.h);
  expect(acidSpeciation('HCl', 0.0001).conductivity).toBeLessThan(a.conductivity);
  expect(acidMeter('HCl', 0.1, false).currentMa).toBe(0);
  expect(acidMeter('HCl', 0.1, false).reading).toBeNull();
});
it('book quantities make acid slightly limiting; both curves reach 2mmol H2 with Mg remaining', () => {
  const a = magnesiumPressure('HCl', 2000),
    b = magnesiumPressure('HAc', 2000);
  expect(a.hydrogen).toBeCloseTo(0.002, 12);
  expect(b.hydrogen).toBeCloseTo(0.002, 12);
  expect(a.mgMassLeft).toBeCloseTo(0.00139, 7);
  expect(a.deltaP).toBeCloseTo(49.579, 2);
  expect(a.deltaP).toBeCloseTo(b.deltaP);
  expect(magnesiumPressure('HAc', 2000, 50).deltaP).toBeCloseTo(2 * a.deltaP);
});
it('empirical weak-acid S curve initially accelerates then slows without claiming ionization caused it', () => {
  expect(acidCurve('HAc', 60).derivative).toBeGreaterThan(acidCurve('HAc', 0).derivative);
  expect(acidCurve('HAc', 200).derivative).toBeLessThan(acidCurve('HAc', 70).derivative);
  expect(acidCurve('HCl', 0).derivative).toBeGreaterThan(acidCurve('HAc', 0).derivative);
  for (let t = 0; t < 400; t += 3) {
    const a = magnesiumPressure('HAc', t, 100, 0.3);
    expect(a.hydrogen + a.mgLeft).toBeCloseTo(a.initialMg, 12);
    expect(2 * a.hydrogen + a.protonCapacity).toBeCloseTo(0.004, 12);
    expect(a.collected + a.escaped).toBeCloseTo(a.hydrogen, 12);
    expect(a.speciation.h + (2 * a.hydrogen) / 0.002).toBeCloseTo(
      a.speciation.anion + a.speciation.oh,
      9,
    );
  }
});
it('carbonate addition retains carbon and acid equivalents, saturates when acid capacity is spent', () => {
  for (let i = 0; i <= 100; i++) {
    const a = carbonateAddition(i / 100, 30);
    expect(a.gas + a.carbonateLeft).toBeCloseTo(a.carbonate, 12);
    expect(a.acidLeft + a.acetate).toBeCloseTo(0.002, 12);
    expect(a.gas).toBeLessThanOrEqual(0.001);
    expect(a.volume).toBeCloseTo(0.002 + a.delivered * 0.00005);
  }
  expect(carbonateAddition(1, 0).gas).toBe(0);
  expect(carbonateAddition(1, 30).gas).toBeCloseTo(0.001, 10);
  expect(qualitativeMagnesium('HCl', 20).hydrogen).toBeGreaterThan(
    qualitativeMagnesium('HAc', 20).hydrogen,
  );
});

it('syringe delivery conserves liquid and gas space, separates compression from hydrogen pressure', () => {
  for (const kind of ['HCl', 'HAc'] as const)
    for (let i = 0; i <= 100; i++) {
      const a = acidInjection(kind, i / 100);
      expect(a.liquidMl + a.remainingMl).toBeCloseTo(2, 12);
      expect(a.headspaceMl + a.liquidMl).toBeCloseTo(102, 12);
      expect(a.hydrogen * 24.305 + a.mgMassLeft).toBeCloseTo(0.05, 12);
      expect(a.deltaP).toBeCloseTo(a.airRise + a.gasRise, 12);
      expect(a.hydrogen * 2).toBeLessThanOrEqual(a.liquidMl * 0.002);
    }
  expect(acidInjection('HCl', 0).deltaP).toBe(0);
  expect(acidInjection('HCl', 1).airRise).toBeCloseTo(2.0265, 5);
});
