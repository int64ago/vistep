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
