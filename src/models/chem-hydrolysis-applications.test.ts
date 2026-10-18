import { expect, it } from 'vitest';
import {
  saltHydrolysis,
  ferricHydrolysis,
  flocculationState,
  mudParticle,
  colloidPreparation,
  oilCleaning,
  pourTube,
  polygonArea,
  rinseOilTube,
} from './chem-hydrolysis-applications';
it('all six salts satisfy charge and element balance, with neutral, basic and acidic classes', () => {
  for (const salt of ['NaCl', 'KNO3', 'Na2CO3', 'NaAc', 'NH4Cl', 'AmSulfate'] as const) {
    const a = saltHydrolysis(salt);
    expect(
      a.h + a.Na + a.nh4 - a.oh - a.Cl - a.acetate - a.hco3 - 2 * a.co3 - a.hso4 - 2 * a.so4,
    ).toBeCloseTo(0, 10);
    expect(a.nh4 + a.nh3).toBeCloseTo(a.N, 12);
    expect(a.so4 + a.hso4).toBeCloseTo(a.S, 12);
    expect(a.co3 + a.hco3 + a.h2co3).toBeCloseTo(a.carbon, 12);
  }
  expect(saltHydrolysis('NaCl').pH).toBeCloseTo(7, 10);
  expect(saltHydrolysis('KNO3').pH).toBeCloseTo(7, 10);
  expect(saltHydrolysis('NaAc').pH).toBeCloseTo(8.88, 1);
  expect(saltHydrolysis('NH4Cl').pH).toBeCloseTo(5.13, 1);
  expect(saltHydrolysis('Na2CO3').pH).toBeGreaterThan(11);
  expect(saltHydrolysis('AmSulfate').pH).toBeLessThan(7);
  expect(saltHydrolysis('Na2CO3', 0).pH).toBeCloseTo(7);
});
it('restricted ferric model preserves Fe/S/charge, correctly separates dilution fraction and concentration', () => {
  const a = ferricHydrolysis(),
    b = ferricHydrolysis(0.00005, 10),
    c = ferricHydrolysis(0.00005, 5, 70),
    d = ferricHydrolysis(0.00005, 6, 25, 0.0001);
  expect(b.fraction).toBeGreaterThan(a.fraction);
  expect(b.hydrolyzed).toBeLessThan(a.hydrolyzed);
  expect(c.fraction).toBeGreaterThan(a.fraction);
  expect(d.fraction).toBeLessThan(a.fraction);
  for (const x of [a, b, c, d]) {
    expect(x.h + 3 * x.aquo + 2 * x.hydrolyzed - x.oh - x.hso4 - 2 * x.so4).toBeCloseTo(0, 10);
    expect(x.aquo + x.hydrolyzed).toBeCloseTo(x.F, 12);
    expect(x.hso4 + x.so4).toBeCloseTo(x.S, 12);
    expect((x.h * x.hydrolyzed) / x.aquo).toBeCloseTo(x.K, 10);
  }
});
it('Stokes settling benchmark is independent; post-dose acid conditions can prevent aggregation', () => {
  expect(flocculationState(0, 'none').velocity).toBeCloseTo(0.000872, 6);
  expect(flocculationState(300, 'Al', 6.5).distance).toBeGreaterThan(50);
  expect(flocculationState(300, 'Al', 3).distance).toBeLessThan(1);
  expect(flocculationState(300, 'Fe', 6.5, false).distance).toBeLessThan(
    flocculationState(300, 'Fe', 6.5, true).distance,
  );
  for (let j = 0; j < 36; j++)
    for (const t of [0, 60, 300]) {
      const a = mudParticle(j, t, 'Fe');
      expect(a.id).toBe(j);
      expect(Math.abs(a.x)).toBeLessThan(0.85);
      expect(a.depth).toBeLessThan(60);
      expect(a.depth).toBeGreaterThan(0);
    }
});
it('colloid formation has no iron before addition, conserves normalized Fe and generates three acid equivalents', () => {
  expect(colloidPreparation(0).ironTotal).toBe(0);
  for (let i = 0; i <= 100; i++) {
    const a = colloidPreparation(i / 100);
    expect(a.aqueous + a.colloid).toBeCloseTo(a.ironTotal, 10);
    expect(a.acidEquivalents).toBeCloseTo(3 * a.colloid);
    expect(a.volumeMl).toBeCloseTo(40 + a.delivered * 0.05);
  }
  expect(colloidPreparation(0.95).delivered).toBe(6);
  expect(colloidPreparation(0.95).heating).toBe(false);
});
it('oil equivalent is retained or converted/removed; hotter example leaves less film after rinse', () => {
  for (const hot of [false, true]) {
    const a = oilCleaning(hot);
    expect(a.wallAfter + a.wasteOil + a.converted).toBeCloseTo(a.initial, 12);
    expect(a.wallBefore).toBeGreaterThan(a.wallAfter);
  }
  expect(oilCleaning(true).wallAfter).toBeLessThan(oilCleaning(false).wallAfter);
});
it('tilted tube uses actual lip and polygon capacity; drain/rinse conserves all liquid', () => {
  expect(pourTube(0, 5).retained).toBeCloseTo(5);
  expect(pourTube(115, 5).retained).toBeCloseTo(0);
  for (let i = 0; i <= 100; i++) {
    const a = rinseOilTube(i / 100, true);
    expect(a.geometry.retained + a.waste).toBeCloseTo(5 + a.waterInput, 9);
    expect(a.geometry.retained).toBeGreaterThanOrEqual(0);
    expect((polygonArea(a.geometry.liquid) / polygonArea(a.geometry.points)) * 10).toBeCloseTo(
      a.geometry.retained,
      9,
    );
    for (const pt of a.geometry.points) {
      expect(pt.x).toBeGreaterThan(0);
      expect(pt.x).toBeLessThan(240);
      expect(pt.y).toBeGreaterThan(50);
      expect(pt.y).toBeLessThan(300);
    }
  }
});
