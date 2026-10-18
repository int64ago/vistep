import { it, expect } from 'vitest';
import {
  NO_UNITS,
  nitrogenEquilibrium,
  nitrogenRelax,
  syringeChange,
  ammoniaDynamic,
  haber,
  ironMixture,
  chromium,
  copper,
  deliveredDrops,
} from './chem-equilibrium-response';
it('pressure shot separates instantaneous dilution and chemical return at fixed optical path', () => {
  const start = syringeChange(true, 0),
    instant = syringeChange(true, 0.25),
    end = syringeChange(true, 1);
  expect(instant.concentration).toBeCloseTo(start.concentration / 2);
  expect(end.concentration).toBeGreaterThan(instant.concentration);
  expect(end.concentration).toBeLessThan(start.concentration);
  const a = syringeChange(false, 0),
    b = syringeChange(false, 0.25),
    c = syringeChange(false, 1);
  expect(b.concentration).toBeCloseTo(2 * a.concentration);
  expect(c.concentration).toBeLessThan(b.concentration);
  expect(c.concentration).toBeGreaterThan(a.concentration);
  for (let i = 0; i <= 100; i++) {
    const n = syringeChange(true, i / 100);
    expect(n.monomer + 2 * n.dimer).toBeCloseTo(NO_UNITS, 12);
  }
});
it('NO equilibrium obeys K and mass balance; heat increases NO2 and cooling reverses it', () => {
  for (const T of [0, 25, 60]) {
    const n = nitrogenEquilibrium(20, T);
    expect((n.monomer / n.V) ** 2 / (n.dimer / n.V)).toBeCloseTo(n.K, 10);
    const s = nitrogenRelax(n.monomer, 20, T, 20);
    expect(s.forward).toBeCloseTo(s.reverse, 10);
  }
  const cold = nitrogenEquilibrium(20, 0),
    hot = nitrogenEquilibrium(20, 60);
  expect(hot.monomer).toBeGreaterThan(cold.monomer);
  expect(nitrogenRelax(hot.monomer, 20, 0, 300).monomer).toBeCloseTo(cold.monomer, 7);
});
it('ammonia dynamic equilibrium retains both nonzero rates and atom inventories from either initial condition', () => {
  const a = ammoniaDynamic(160),
    b = ammoniaDynamic(160, true);
  expect(a.x).toBeCloseTo(b.x, 7);
  expect(a.forward).toBeCloseTo(a.reverse, 7);
  expect(a.forward).toBeGreaterThan(0);
  for (const t of [0, 1, 20, 160]) {
    const n = ammoniaDynamic(t);
    expect(2 * n.nitrogen + n.ammonia).toBeCloseTo(2);
    expect(2 * n.hydrogen + 3 * n.ammonia).toBeCloseTo(6);
  }
  expect(ammoniaDynamic(160, false, 5).x).toBeCloseTo(a.x, 7);
});
it('Haber independent table benchmark and catalyst endpoint', () => {
  expect(haber(400, 20, 0)?.equilibrium).toBe(0.382);
  expect(haber(500, 20, 0)?.equilibrium).toBe(0.191);
  expect(haber(400, 20, 10, true)?.observed).toBeGreaterThan(haber(400, 20, 10, false)!.observed);
  expect(haber(400, 20, 1e5, true)?.observed).toBe(haber(400, 20, 1e5, false)?.observed);
  expect(haber(450, 20, 1)).toBeNull();
});
it('iron addition deepens color; iron metal removal of FeIII reduces it with iron atom balance', () => {
  const a = ironMixture('none', 0);
  for (const add of ['Fe', 'SCN'] as const) {
    const b = ironMixture(add, 5),
      c = ironMixture(add, 5, 1);
    expect(b.opacity).toBeGreaterThan(a.opacity);
    expect(c.opacity).toBeLessThan(b.opacity);
    expect(c.FeFree + c.complex + c.FeII + c.solidLeft).toBeCloseTo(c.Fe0 + c.solidAdded, 12);
  }
});
it('Cr and Cu models conserve atom totals without pretending pure product color', () => {
  const a = chromium(0, 0),
    b = chromium(8, 0),
    c = chromium(8, 8);
  expect(b.fraction).toBeLessThan(a.fraction);
  expect(c.fraction).toBeGreaterThan(b.fraction);
  for (const n of [a, b, c]) expect(n.chromate + 2 * n.dichromate).toBeCloseTo(0.0004, 12);
  const cold = copper(25),
    hot = copper(75);
  expect(hot.chloro).toBeGreaterThan(cold.chloro);
  expect(hot.aqua).toBeGreaterThan(0);
  expect(hot.aqua + hot.chloro).toBeCloseTo(0.5);
  expect(hot.chloride + 4 * hot.chloro).toBeCloseTo(1);
  expect(deliveredDrops(0, 5).delivered).toBe(0);
  expect(deliveredDrops(1, 5).delivered).toBe(5);
});
it('flask exchange clears bath rims and preserves complete sealed geometry on narrow layouts', async () => {
  const { flaskExchange } = await import('./chem-equilibrium-response');
  for (const w of [240, 320, 800])
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000,
        a = flaskExchange(w, p, 0),
        b = flaskExchange(w, p, 1);
      for (const q of [a, b]) {
        expect(q.x - 30).toBeGreaterThan(0);
        expect(q.x + 30).toBeLessThan(w);
        expect(q.y - 58).toBeGreaterThanOrEqual(0);
        expect(q.y + 30).toBeLessThan(291);
      }
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(60);
      for (const [circle, neck] of [
        [a, b],
        [b, a],
      ]) {
        const dx = Math.max(Math.abs(circle.x - neck.x) - 11, 0),
          dy = Math.max(neck.y - 58 - circle.y, 0, circle.y - (neck.y - 29));
        expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(30);
      }
      if (p > 0.32 && p < 0.58) {
        expect(a.y + 30).toBeLessThan(195);
        expect(b.y + 30).toBeLessThan(195);
      }
    }
});
it('ideal separation and three finite recycle passes preserve both elements and exceed single-pass collection', async () => {
  const { ammoniaRecycle } = await import('./chem-equilibrium-response');
  for (let i = 0; i <= 1000; i++) {
    const a = ammoniaRecycle(i / 1000);
    expect(2 * a.nitrogen + a.ammoniaGas + a.removed).toBeCloseTo(2, 12);
    expect(2 * a.hydrogen + 3 * (a.ammoniaGas + a.removed)).toBeCloseTo(6, 12);
  }
  expect(ammoniaRecycle(1).removed).toBeGreaterThan(ammoniaRecycle(1 / 3).removed);
  expect(ammoniaRecycle(1).removed).toBeLessThan(2);
  expect(ammoniaRecycle(1 / 3 - 1e-8).removed).toBeCloseTo(ammoniaRecycle(1 / 3).removed, 7);
});
