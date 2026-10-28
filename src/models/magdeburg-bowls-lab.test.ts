import { describe, it, expect } from 'vitest';
import {
  sealedBowls,
  inferSealTemperature,
  bowlsShot,
  bowlsTrial,
  bowlPressureArrow,
} from './magdeburg-bowls-lab';
describe('sealed hot bowls', () => {
  it('has no pressure difference at sealing or after venting, without removing atmospheric pressure', () => {
    expect(sealedBowls(149.5).holding).toBe(0);
    const vented = sealedBowls(15, 149.5, 0.1, 0, true);
    expect(vented.holding).toBe(0);
    expect(vented.outsideForce).toBeCloseTo(3141.592653589793, 10);
    expect(vented.insideForce).toBe(vented.outsideForce);
    expect(vented.amountRatio).toBeGreaterThan(1);
  });
  it('uses projected area and the pull on one side, not both summed', () => {
    const t = inferSealTemperature()!;
    expect(sealedBowls(15, t).holding).toBeCloseTo(1000, 9);
    expect(sealedBowls(15, t).people).toBeCloseTo(5, 9);
    const s = sealedBowls(15, 149.5, 0.1, 800);
    expect(s.opens).toBe(false);
    expect(s.contact + s.pull).toBeCloseTo(s.holding, 10);
    expect(sealedBowls(15, 149.5, 0.1, 1000).opens).toBe(true);
    expect(sealedBowls(15, 149.5, 0.1, s.holding).opens).toBe(false);
  });
  it('independently integrates uniform pressure over the curved hemisphere to projected area', () => {
    const n = 10000,
      r = 0.1,
      p = 100000,
      dt = Math.PI / 2 / n;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const theta = (i + 0.5) * dt;
      sum += p * Math.cos(theta) * 2 * Math.PI * r * r * Math.sin(theta) * dt;
    }
    expect(sum).toBeCloseTo(sealedBowls(15).outsideForce, 4);
    for (const side of [-1, 1] as const)
      for (const a of [0.3, 0.65, 1.15]) {
        const up = bowlPressureArrow(side, a, 0, p, false),
          down = bowlPressureArrow(side, -a, 0, p, false);
        expect(up.ny + down.ny).toBeCloseTo(0, 12);
        expect(Math.hypot(up.x2 - up.x1, up.y2 - up.y1)).toBeCloseTo(18, 12);
        expect((up.x2 - up.x1) * side).toBeLessThan(0);
        const inside = bowlPressureArrow(side, a, 0, p, true);
        expect((inside.x2 - inside.x1) * side).toBeGreaterThan(0);
      }
  });
  it('scales with radius squared and rejects impossible inverse data', () => {
    expect(sealedBowls(15, 149.5, 0.2).holding / sealedBowls(15).holding).toBeCloseTo(4, 12);
    for (const args of [
      [4000, 15, 0.1],
      [1000, -273.15, 0.1],
      [1000, 15, 0],
      [NaN, 15, 0.1],
      [1000, Infinity, 0.1],
    ])
      expect(inferSealTemperature(...(args as [number, number, number]))).toBeNull();
  });
  it('keeps the matched prediction at 15 C and 800 N as pressure and force fall monotonically', () => {
    let previous = Infinity;
    for (let i = 0; i <= 100; i++) {
      const s = bowlsShot(3, i / 100),
        p = sealedBowls(s.temperature, 149.5, 0.1, s.pull, s.exchange);
      expect(s.temperature).toBe(15);
      expect(s.pull).toBe(800);
      expect(p.holding).toBeLessThanOrEqual(previous);
      previous = p.holding;
    }
    expect(previous).toBe(0);
    const sealed = bowlsTrial(bowlsShot(3, 1), { exchange: 0 });
    expect(sealed.gap).toBe(0);
    expect(sealed.exchange).toBe(0);
    expect(bowlsTrial(sealed, { exchange: 1 }).gap).toBeGreaterThan(0);
  });
  it('keeps the full supported domain finite and nonnegative, including malformed inputs', () => {
    for (const temp of [NaN, Infinity, -Infinity, -300, -273.149, 15, 149.5, 200])
      for (const vent of [-1, 0, 0.5, 1, 2, NaN]) {
        const p = sealedBowls(temp, 149.5, 0.1, 800, vent);
        for (const v of Object.values(p))
          if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
        expect(p.inside).toBeGreaterThanOrEqual(0);
        expect(p.holding).toBeGreaterThanOrEqual(0);
      }
  });
});

it('puts causal transitions at measured speech times without jumping physical values', () => {
  expect(bowlsShot(0, 0.5, 4.8).gap).toBe(0);
  expect(bowlsShot(1, 0.5, 10.8).temperature).toBe(15);
  const critical = bowlsShot(2, 0.5, 16),
    onset = bowlsShot(2, 0.5, 22.5),
    opened = bowlsShot(2, 0.5, 24);
  expect(critical.pull).toBeCloseTo(sealedBowls(15).holding, 10);
  expect(critical.gap).toBe(0);
  expect(onset.gap).toBe(0);
  expect(opened.gap).toBe(2);
  expect(opened.pull).toBe(1000);
  expect(bowlsShot(3, 0.5, 8.8).exchange).toBe(0);
  expect(bowlsShot(3, 0.5, 15.7).exchange).toBe(1);
  for (const [c, time] of [
    [0, 3.2],
    [0, 4.8],
    [1, 0.8],
    [1, 10.8],
    [2, 9.2],
    [2, 16],
    [2, 22.5],
    [2, 23.2],
    [3, 9.2],
    [3, 15.7],
  ]) {
    const left = bowlsShot(c, 0.5, time - 1e-6),
      right = bowlsShot(c, 0.5, time + 1e-6);
    for (const key of ['temperature', 'pull', 'exchange', 'gap'] as const)
      expect(Math.abs(left[key] - right[key])).toBeLessThan(0.00001);
  }
});
