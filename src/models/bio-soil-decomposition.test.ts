import { it, expect } from 'vitest';
import {
  litterState,
  starchState,
  sampleTransfer,
  assayResult,
  litterRecord,
  reagentDrops,
} from './bio-soil-decomposition';
it('benchmarks exponential litter loss and equal-treatment null comparison', () => {
  expect(litterState(10).remaining).toBeCloseTo(Math.exp(-0.65));
  expect(litterState(28, 0).remaining).toBe(1);
  expect(litterState(28, 1, 0).remaining).toBe(1);
  expect(litterState(28, 1, 1).remaining).toBe(1);
  expect(litterState(28, 0.12).remaining).toBeGreaterThan(litterState(28, 1).remaining);
  expect(litterState(14, 1)).toEqual(litterState(14, 1));
});
it('benchmarks sequential starch hydrolysis, conserves carbon and handles equal rates', () => {
  for (let i = 0; i <= 100; i++) {
    const a = starchState(i * 0.1);
    expect(a.starch + a.reducing + a.used).toBeCloseTo(1);
    expect(a.used).toBeGreaterThanOrEqual(0);
  }
  expect(starchState(2, true, 0).reducing).toBeCloseTo(1 - Math.exp(-1.1));
  expect(starchState(2, true, 0.55).reducing).toBeCloseTo(1.1 * Math.exp(-1.1));
  expect(starchState(7, false)).toEqual({ starch: 1, reducing: 0, used: 0 });
});
it('allows low final reducing sugar despite extensive starch hydrolysis', () => {
  const a = starchState(7, true, 1.2);
  expect(a.starch).toBeLessThan(0.03);
  expect(a.reducing).toBeLessThan(0.06);
  expect(assayResult(7, true, 1.2).precipitate).toBe(0);
  expect(assayResult(7, true, 0.12).precipitate).toBeGreaterThan(0);
});
it('conserves40mL across source, pipette and two separate aliquots', () => {
  for (let i = 0; i <= 1000; i++) {
    const a = sampleTransfer(i / 1000, 240);
    expect(a.source + a.pipette + a.tubes[0] + a.tubes[1]).toBeCloseTo(40);
    expect(a.pipette).toBeGreaterThanOrEqual(-1e-8);
    expect(a.source).toBeGreaterThanOrEqual(20);
  }
  expect(sampleTransfer(1).tubes).toEqual([10, 10]);
  expect(sampleTransfer(1).source).toBe(20);
});
it('raises the pipette above vessel rims before crossing horizontally', () => {
  let prev = sampleTransfer(0, 240);
  for (let i = 1; i <= 1000; i++) {
    const a = sampleTransfer(i / 1000, 240);
    expect(Math.hypot(a.x - prev.x, a.y - prev.y)).toBeLessThan(5);
    if (Math.abs(a.x - prev.x) > 0.01) expect(a.y).toBeLessThanOrEqual(120.001);
    if (a.dispensing) {
      expect(a.y).toBe(150);
      expect(a.x).toBeCloseTo(240 * (a.part === 0 ? 0.57 : 0.82));
    }
    prev = a;
  }
});
it('develops color only after reagent contact, precipitate only after heating', () => {
  expect(reagentDrops(0.1).filter((d) => d.arrived)).toHaveLength(0);
  expect(assayResult(7, false, 0.12, true, 0.1).iodine).toBe(0);
  expect(assayResult(7, false).iodine).toBe(1);
  expect(assayResult(7, true, 0.12, false).precipitate).toBe(0);
  expect(assayResult(7, true, 0.12, true, 0.4).precipitate).toBe(0);
  expect(assayResult().liquidMl).toBeCloseTo(10.3);
});
it('keeps absent observations absent and accepts genuine zero remaining mass', () => {
  expect(litterRecord('', '0')).toBeNull();
  expect(litterRecord('2', '')).toBeNull();
  expect(litterRecord('2', '0')?.loss).toBe(1);
  expect(litterRecord('0', '1')).toBeNull();
});

import { carbonPools, carbonMarker, decomposerPath, soilDirector } from './bio-soil-decomposition';
it('independently integrates the carbon equations, including equal and zero rates', () => {
  for (const k of [0, 0.12, 0.55, 1.2])
    for (const d of [0, 0.12, 0.55, 1.2]) {
      let s = 1,
        r = 0;
      const h = 0.0005;
      // Independent midpoint integration, rather than repeating the closed formula.
      for (let i = 0; i < 14000; i++) {
        const ds = -k * s,
          dr = k * s - d * r,
          sm = s + (ds * h) / 2,
          rm = r + (dr * h) / 2;
        s += -k * sm * h;
        r += (k * sm - d * rm) * h;
      }
      const a = carbonPools(7, k, d);
      expect(a.polymer).toBeCloseTo(s, 6);
      expect(a.soluble).toBeCloseTo(r, 6);
      expect(a.polymer + a.soluble + a.other).toBeCloseTo(1, 12);
    }
  for (const n of [NaN, Infinity, -1])
    expect(Object.values(carbonPools(n, n, n)).every(Number.isFinite)).toBe(true);
  expect(carbonPools(7, 0, 1).polymer).toBe(1);
  expect(carbonPools(7, 0.55, 0).other).toBeCloseTo(0, 12);
});
it('keeps six selected carbon identities, enzyme-before-entry and a single physical membrane opening', () => {
  for (const w of [240, 272, 390, 760]) {
    let prev = decomposerPath(0, w);
    for (let i = 0; i <= 2000; i++) {
      const a = decomposerPath(i / 2000, w);
      expect(a.units.map((u) => u.id)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
      for (let j = 0; j < 6; j++) {
        const u = a.units[j];
        expect(Math.hypot(u.x - prev.units[j].x, u.y - prev.units[j].y)).toBeLessThan(16);
        if (u.y > 143 && u.y < 171) expect(Math.abs(u.x - a.gate.x)).toBeLessThan(0.01);
        if (u.q > 0) expect(a.further).toBe(1);
        for (let k = j + 1; k < 6; k++)
          expect(
            Math.max(Math.abs(u.x - a.units[k].x) - 29, Math.abs(u.y - a.units[k].y) - 23),
          ).toBeGreaterThan(1); // actual stroked 28×22 rectangles, not radius-14.5 circles
      }
      prev = a;
    }
    expect(decomposerPath(1, w).units.every((u) => u.inside)).toBe(true);
    expect(decomposerPath(1, w, false).units.every((u) => !u.inside)).toBe(true);
    expect(decomposerPath(1, w, true, false).units.every((u) => !u.inside)).toBe(true);
  }
});
it('commits marker pools at the same drawn boundary, not before or after entering another band', () => {
  for (let id = 0; id < 200; id++)
    for (const d of [0, 0.12, 0.55, 1.2]) {
      const a = carbonMarker(id, 0, 0.55, d, 272);
      expect(a.id).toBe(`carbon-${id}`);
      for (const t of [
        0,
        1,
        7,
        a.release - 1e-6,
        a.release,
        a.release + 1e-6,
        a.uptake - 1e-6,
        a.uptake,
        a.uptake + 1e-6,
      ].filter((x) => Number.isFinite(x) && x >= 0 && x <= 30)) {
        const m = carbonMarker(id, t, 0.55, d, 272);
        if (m.pool === 'polymer') expect(m.y).toBeLessThanOrEqual(92.5 + 1e-8);
        if (m.pool === 'soluble') {
          expect(m.y).toBeGreaterThanOrEqual(92.5 - 1e-8);
          expect(m.y).toBeLessThanOrEqual(173.5 + 1e-8);
        }
        if (m.pool === 'other') expect(m.y).toBeGreaterThanOrEqual(173.5 - 1e-8);
      }
    }
});
it('finite tracer ensemble approaches independent analytical probabilities without extra dwell time', () => {
  const n = 40000;
  for (const d of [0, 0.12, 1.2])
    for (const t of [1, 7]) {
      const counts = { polymer: 0, soluble: 0, other: 0 };
      for (let i = 0; i < n; i++) counts[carbonMarker(i, t, 0.55, d).pool]++;
      const a = carbonPools(t, 0.55, d);
      for (const key of ['polymer', 'soluble', 'other'] as const)
        expect(counts[key] / n).toBeCloseTo(a[key], 2);
    }
});
it('keeps teaching prediction before the final replay and does not create sugar with cleavage off', () => {
  expect(soilDirector(8, 6).shot).toBe('predict');
  expect(soilDirector(8, 8).reveal).toBe(false);
  expect(soilDirector(8, 25).reveal).toBe(true);
  expect(carbonPools(7, 0, 1.2)).toEqual({
    polymer: 1,
    soluble: 0,
    other: 0,
    hydrolysisFlux: 0,
    useFlux: 0,
  });
});

it('finishes sample A before explicitly starting independent sample B', () => {
  const a = soilDirector(5, 13.9),
    b = soilDirector(5, 14);
  expect(a.group).toBe(0);
  expect(a.progress).toBe(1);
  expect(sampleTransfer(a.progress).tubes).toEqual([10, 10]);
  expect(b.group).toBe(1);
  expect(b.progress).toBe(0);
  expect(sampleTransfer(b.progress).source).toBe(40);
  expect(sampleTransfer(b.progress).tubes).toEqual([0, 0]);
  expect(soilDirector(5, 27).progress).toBe(1);
});
it('clears the entire carbon portion and stroke through the shared gate before lateral motion', () => {
  for (const w of [240, 272, 390, 1000])
    for (let step = 0; step <= 4000; step++) {
      const m = decomposerPath(step / 4000, w),
        g = m.gate;
      const hw = g.markerHalfWidth + g.markerStroke / 2,
        hh = g.markerHalfHeight + g.markerStroke / 2;
      expect(2 * g.half - g.wallStroke).toBeGreaterThanOrEqual(2 * hw + 6);
      for (const u of m.units) {
        if (u.y + hh >= g.top - g.wallStroke / 2 && u.y - hh <= g.bottom + g.wallStroke / 2) {
          expect(g.half - g.wallStroke / 2 - Math.abs(u.x - g.x) - hw).toBeGreaterThanOrEqual(
            3 - 1e-8,
          );
        }
        if (u.q > 0.65 && u.q < 0.85)
          expect(u.y - hh - (g.bottom + g.wallStroke / 2)).toBeGreaterThanOrEqual(3 - 1e-8);
      }
    }
});

it('binds visible counterfactuals and late sampling to measured bilingual phrases', () => {
  for (const locale of ['zh', 'en'] as const) {
    expect(soilDirector(1, 1, locale).shot).toBe('mechanism');
    expect(soilDirector(1, 21, locale).progress).toBe(1);
    expect(soilDirector(1, 27, locale).enzyme).toBe(false);
    expect(soilDirector(4, 15, locale).uptake).toBe(false);
    expect(soilDirector(4, 15, locale).enzyme).toBe(true);
    expect(soilDirector(4, 19, locale).enzyme).toBe(false);
    expect(soilDirector(7, 13, locale).heat).toBe(false);
    expect(soilDirector(7, 17, locale).heat).toBe(true);
    expect(soilDirector(8, 19, locale).day).toBe(7);
    expect(soilDirector(8, 7, locale).day).toBeLessThan(0.2);
  }
});
