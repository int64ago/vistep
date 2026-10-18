import { expect, it } from 'vitest';
import {
  diffuseInk,
  cellOsmosis,
  funnelOsmosis,
  transportState,
  transportParticle,
} from './bio-osmosis';
it('conserves dye in a reflecting container and spreads from its initial peak', () => {
  for (const t of [0, 0.2, 1]) expect(diffuseInk(t).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  expect(diffuseInk(1)[25]).toBeLessThan(diffuseInk(0.1)[25]);
});
it('conserves impermeant amount while changing volume, with a lysis boundary', () => {
  const shrink = cellOsmosis(2, 20);
  expect(shrink.volume).toBeCloseTo(0.5, 3);
  expect(shrink.inside * shrink.volume).toBeCloseTo(1);
  expect(cellOsmosis(1, 20).volume).toBe(1);
  expect(cellOsmosis(0.05, 20).lysed).toBe(true);
  expect(cellOsmosis(0.05, 20, true).lysed).toBe(false);
});
it('restores a plasmolyzed viable plant protoplast and limits turgid expansion', () => {
  const shrink = cellOsmosis(1.8, 10, true);
  const restored = cellOsmosis(0.3, 10, true, 0.35, shrink.volume);
  expect(shrink.volume).toBeLessThan(0.65);
  expect(restored.volume).toBeGreaterThan(1);
  expect(restored.volume).toBeLessThan(1.1);
  expect(restored.pressure).toBeGreaterThan(0);
});
it('stops net funnel flow at osmotic/hydrostatic balance; gauze and matched solutions do not rise', () => {
  const end = funnelOsmosis(80);
  expect(end.osmotic).toBeCloseTo(end.hydrostatic, 5);
  expect(end.flux).toBeCloseTo(0, 5);
  expect(funnelOsmosis(40, false).height).toBe(0);
  expect(funnelOsmosis(40, true, 1).height).toBe(0);
});
it('channels alter rate while ATP changes the ability to pump against a gradient', () => {
  expect(cellOsmosis(2, 1, false, 0.8).volume).toBeLessThan(cellOsmosis(2, 1, false, 0.04).volume);
  for (const m of ['simple', 'carrier', 'active'] as const) {
    const s = transportState(10, m);
    expect(s.inside + s.outside).toBeCloseTo(2);
  }
  expect(transportState(20, 'simple').inside).toBeLessThan(1);
  expect(transportState(20, 'active').inside).toBeGreaterThan(1.5);
  expect(transportState(20, 'active', false).inside).toBe(1.5);
});

it('bounds integration work and preserves finite states for invalid inputs', () => {
  expect(cellOsmosis(2, 1e9)).toEqual(cellOsmosis(2, 120));
  expect(funnelOsmosis(Infinity)).toEqual(funnelOsmosis(0));
  expect(transportState(NaN, 'active')).toEqual(transportState(0, 'active'));
  const cell = cellOsmosis(NaN, 5, false, Infinity, -1);
  expect(Object.values(cell).every((v) => typeof v === 'boolean' || Number.isFinite(v))).toBe(true);
});

it('keeps every carrier and pump cargo in the protein while crossing the bilayer', () => {
  for (const mode of ['carrier', 'active'] as const)
    for (let id = 0; id < 24; id++)
      for (let q = 0; q <= 1; q += 0.005) {
        const p = transportParticle(id, (id + q) / 12, mode);
        if (p.y >= 109 && p.y <= 141) expect(p.x).toBe(125);
        expect(p.id).toBe(id);
        const next = transportParticle(id, (id + q + 0.001) / 12, mode);
        expect(Math.hypot(next.x - p.x, next.y - p.y)).toBeLessThan(0.5);
      }
});

import {
  waterExchange,
  plantGeometry,
  particleWalk,
  membraneSegmentAllowed,
  aquaporinComparison,
  equilibriumTransportParticle,
} from './bio-osmosis';
it('keeps positive opposing exchange at zero net flow, including an unequal-concentration pressure balance', () => {
  for (const [osmotic, pressure] of [
    [0, 0],
    [0.7, 0.7],
  ]) {
    const rates = waterExchange(osmotic, pressure);
    expect(rates.inward).toBeGreaterThan(0);
    expect(rates.outward).toBe(rates.inward);
    expect(rates.net).toBe(0);
  }
  expect(waterExchange(0.5, 0.8).net).toBeLessThan(0);
  expect(waterExchange(0.5, 0).net).toBeGreaterThan(0);
  expect(waterExchange(2, 0, 0)).toEqual({ inward: 0, outward: 0, net: 0 });
});
it('conserves both reservoir volumes and retained solutes in the funnel', () => {
  for (const time of [0, 1, 10, 80])
    for (const c of [0, 0.5, 1, 2]) {
      const f = funnelOsmosis(time, true, c);
      expect(f.volume + f.outsideVolume).toBe(9);
      expect(f.insideConcentration * f.volume).toBeCloseTo(1, 10);
      expect(f.outsideConcentration * f.outsideVolume).toBeCloseTo(c * 8, 10);
      expect(f.height).toBeCloseTo((f.volume - 1) * (1 / 0.3 + 1 / 6), 10);
    }
  // External pressure larger than the initial osmotic drive reverses the flow.
  expect(funnelOsmosis(0.01, true, 0, 1.5).volume).toBeLessThan(1);
  const end = funnelOsmosis(100);
  const rates = waterExchange(end.osmotic, end.hydrostatic);
  expect(Math.abs(rates.net)).toBeLessThan(1e-8);
  expect(rates.inward).toBeGreaterThan(0.3);
});
it('derives plant contact, gap and slightly elastic wall from the same volume', () => {
  for (let v = 0.12; v < 1.2; v += 0.01) {
    const g = plantGeometry(v);
    expect(g.halfWidth).toBeLessThan(g.wallHalfWidth);
    expect(g.halfHeight).toBeLessThan(g.wallHalfHeight);
    expect(g.gap).toBeGreaterThanOrEqual(0);
    if (v < 1) expect(g.wallHalfWidth).toBe(131);
    else expect(g.gap).toBe(0);
  }
});
it('uses reproducible unbiased particle walks with continuous identity and reflecting obstacles', () => {
  let forward = 0,
    backward = 0;
  for (const kind of ['dye', 'water', 'solute'] as const)
    for (let id = 0; id < 40; id++) {
      let old = particleWalk(id, 0, kind);
      for (let time = 0.1; time <= 70; time += 0.1) {
        const p = particleWalk(id, time, kind);
        expect(p.id).toBe(id);
        expect(p.x).toBeGreaterThanOrEqual(10);
        expect(p.x).toBeLessThanOrEqual(310);
        expect(Math.hypot(p.x - old.x, p.y - old.y)).toBeLessThan(17);
        if (kind === 'water') {
          expect(membraneSegmentAllowed(old, p)).toBe(true);
          if (old.x < 160 && p.x >= 160) forward++;
          if (old.x > 160 && p.x <= 160) backward++;
        }
        if (kind === 'solute') expect(p.x < 160).toBe(id % 2 === 0);
        old = p;
      }
      expect(particleWalk(id, 32, kind)).toEqual(particleWalk(id, 32, kind));
    }
  expect(forward).toBeGreaterThan(5);
  expect(backward).toBeGreaterThan(5);
});
it('a channel speeds uptake AND loss without changing the equilibrium volume', () => {
  const low = aquaporinComparison(4, 0.7),
    high = aquaporinComparison(4, 1.8);
  expect(low[1].volume).toBeGreaterThan(low[0].volume);
  expect(high[1].volume).toBeLessThan(high[0].volume);
  for (const k of [0.05, 0.5])
    expect(cellOsmosis(1.8, 120, false, k).volume).toBeCloseTo(1 / 1.8, 4);
});
it('shows continued passive exchange through the carrier at macroscopic equilibrium', () => {
  for (const kind of ['simple', 'carrier'] as const)
    for (const id of [0, 23]) {
      let previous = equilibriumTransportParticle(id, 75, kind),
        minY = previous.y,
        maxY = previous.y;
      for (let time = 75.01; time <= 110; time += 0.01) {
        const p = equilibriumTransportParticle(id, time, kind);
        expect(Math.hypot(p.x - previous.x, p.y - previous.y)).toBeLessThan(2);
        if (kind === 'carrier' && p.y >= 109 && p.y <= 141) expect(p.x).toBe(125);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
        previous = p;
      }
      expect(maxY - minY).toBeGreaterThan(110);
    }
});
it('matches independent analytic equilibria instead of only checking self-consistency', () => {
  const pressureCoefficient = 0.5 * (1 / 0.3 + 1 / 6);
  const funnelEquilibrium = (1 + Math.sqrt(1 + 4 / pressureCoefficient)) / 2;
  expect(funnelOsmosis(100).volume).toBeCloseTo(funnelEquilibrium, 8);
  const plantEquilibrium = (11.7 + Math.sqrt(11.7 ** 2 + 48)) / 24;
  expect(cellOsmosis(0.3, 100, true).volume).toBeCloseTo(plantEquilibrium, 8);
  const left = particleWalk(10, 69, 'water'),
    right = particleWalk(10, 69.5, 'water'),
    back = particleWalk(10, 70, 'water');
  expect(left.x < 160).not.toBe(right.x < 160);
  expect(back.x < 160).toBe(left.x < 160);
});
it('bounds the added particle and flow helpers for invalid or extremely large times', () => {
  expect(particleWalk(0, 1e9)).toEqual(particleWalk(0, 100));
  expect(particleWalk(0, NaN)).toEqual(particleWalk(0, 0));
  expect(equilibriumTransportParticle(0, Infinity, 'carrier')).toEqual(
    equilibriumTransportParticle(0, 0, 'carrier'),
  );
  expect(waterExchange(NaN, Infinity).net).toBe(0);
});

import { waterPotential, potentialDifference } from './bio-osmosis';
it('derives the inward drive from mixing and pressure contributions to water potential', () => {
  expect(waterPotential(1)).toBeLessThan(waterPotential(0));
  expect(waterPotential(1, 0.4)).toBeGreaterThan(waterPotential(1, 0));
  for (const time of [0, 1, 5, 20, 100]) {
    const f = funnelOsmosis(time),
      p = potentialDifference(f.insideConcentration, f.outsideConcentration, f.hydrostatic);
    expect(p.inwardDrive * 0.2).toBeCloseTo(f.flux, 10);
    expect(p.inside).toBeCloseTo(p.mixingInside + p.pressureContribution, 10);
  }
  const f = funnelOsmosis(100),
    p = potentialDifference(f.insideConcentration, f.outsideConcentration, f.hydrostatic);
  expect(p.inside).toBeCloseTo(p.outside, 8);
  expect(f.insideConcentration).toBeGreaterThan(f.outsideConcentration);
});
