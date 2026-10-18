import { expect, it } from 'vitest';
import {
  ELECTROLYSIS_F,
  electrolysisState,
  surfacePlating,
  electrodePreparation,
  uChannelPoint,
  polylinePoint,
  chlorinePath,
} from './chem-electrolysis-plating';
it('Faraday benchmark gives 39.517mg copper per120C and equal molar chloride products', () => {
  const a = electrolysisState('chloride', 600, 0.2);
  expect(a.Q).toBeCloseTo(120, 10);
  expect(a.depositMass).toBeCloseTo(0.039517, 5);
  expect(a.extent).toBeCloseTo(120 / (2 * 96485.33212), 12);
  expect(a.chlorine).toBeCloseTo(a.cathodeCu);
  expect(a.chlorideLeft + 2 * a.dissolvedChlorine + 2 * a.escapedChlorine).toBeCloseTo(
    2 * a.initialCu,
    12,
  );
  expect(a.copperInSolution + a.cathodeCu).toBeCloseTo(a.initialCu, 12);
  expect(electrolysisState('chloride', 600, 0.2, false).extent).toBe(0);
  expect(electrolysisState('chloride', 600, 0.2, true, false, false).extent).toBe(0);
});
it('copper-anode plating preserves bath copper; reversal dissolves iron and consumes bath copper', () => {
  const a = electrolysisState('plating', 600),
    b = electrolysisState('plating', 600, 0.2, true, true);
  expect(a.copperInSolution).toBeCloseTo(a.initialCu, 12);
  expect(4.18 - a.anodeCopperMass).toBeCloseTo(a.depositMass, 12);
  expect(a.ironMass).toBeCloseTo(3.675);
  expect(b.anodeFe).toBeCloseTo(b.cathodeCu, 12);
  expect(b.copperInSolution + b.cathodeCu).toBeCloseTo(b.initialCu, 12);
  expect(b.ironMass + 55.845 * b.ironInSolution).toBeCloseTo(3.675, 12);
  expect(b.anodeCopperMass).toBe(4.18);
});
it('open-circuit chemical displacement can occur locally without external charge', () => {
  const a = electrolysisState('plating', 600, 0.2, false);
  expect(a.Q).toBe(0);
  expect(a.cementation).toBeGreaterThan(0);
  expect(a.copperInSolution + a.cementation).toBeCloseTo(a.initialCu, 12);
  expect(a.ironMass + 55.845 * a.ironInSolution).toBeCloseTo(3.675, 12);
});
it('masked surface conserves deposited mass while increasing thickness at active sites', () => {
  const a = surfacePlating(600, 0.2, true),
    b = surfacePlating(600, 0.2, false);
  expect(a.cells.reduce((s, x) => s + x.mass, 0)).toBeCloseTo(a.state.depositMass, 12);
  expect(b.cells.reduce((s, x) => s + x.mass, 0)).toBeCloseTo(b.state.depositMass, 12);
  expect(b.cells.filter((x) => !x.active)).toHaveLength(8);
  expect(b.cells.find((x) => x.active)!.thicknessUm).toBeGreaterThan(a.cells[0].thicknessUm);
});
it('sample transfers clear the vessel rims before lateral travel; chemicals act only after immersion', () => {
  for (const acid of [false, true])
    for (let i = 0; i <= 1000; i++) {
      const a = electrodePreparation(i / 1000, acid);
      if (a.x > 0 && a.x < 1) expect(a.y + 80).toBeLessThanOrEqual(150);
      if (acid && a.acid > 0 && a.acid < 1) expect(a.chemicalContact).toBe(true);
      if (!acid && a.degrease > 0 && a.degrease < 1) expect(a.chemicalContact).toBe(true);
    }
});
it('U-channel lane stays within the liquid conduit and outside the carbon rods', () => {
  for (let i = 0; i <= 1000; i++) {
    const p = uChannelPoint(i / 1000),
      left = 60,
      right = 180;
    let d;
    if (p.x < 90 && p.y >= 250) d = Math.abs(Math.hypot(p.x - 90, p.y - 250) - 30);
    else if (p.x > 150 && p.y >= 250) d = Math.abs(Math.hypot(p.x - 150, p.y - 250) - 30);
    else if (p.y >= 250) d = Math.abs(p.y - 280);
    else d = Math.min(Math.abs(p.x - left), Math.abs(p.x - right));
    expect(d).toBeLessThanOrEqual(12.00001);
    expect(p.y).toBeGreaterThan(183);
    expect(!(p.y < 255 && (Math.abs(p.x - left) < 9 || Math.abs(p.x - right) < 9))).toBe(true);
  }
  const a = polylinePoint(
    [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 20, y: 10 },
    ],
    0.5,
  );
  expect(a).toEqual({ x: 5, y: 10 });
  expect(chlorinePath(1)).toMatchObject({ x: 204, y: 139, water: false });
  expect(ELECTROLYSIS_F).toBeGreaterThan(96485);
});
it('finite input boundaries and immersed area remain consistent across the magnified views', () => {
  for (const kind of ['chloride', 'plating'] as const) {
    const a = electrolysisState(kind, NaN, Infinity);
    expect(a.Q).toBe(0);
    expect(a.depositMass).toBe(0);
    expect(a.copperInSolution).toBeGreaterThan(0);
  }
  expect(electrolysisState('plating', 600, 0).cementation).toBeGreaterThan(0);
  const c = surfacePlating(600, 0.2, true, 'chloride');
  expect(c.cells[0].thicknessUm).toBeCloseTo(c.state.thicknessUm, 10);
  const b = surfacePlating(600, 0.2, true, 'plating', false);
  expect(b.cells.every((x) => x.thicknessUm === 0)).toBe(true);
  for (let i = 0; i <= 1000; i++) {
    const g = chlorinePath(i / 1000);
    expect(g.water).toBe(g.y >= 183);
  }
});
