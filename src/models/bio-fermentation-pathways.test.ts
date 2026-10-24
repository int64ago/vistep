import { it, expect } from 'vitest';
import {
  fermentationState,
  pickleState,
  jarGeometry,
  nitriteResult,
  sampleMotion,
  reactorState,
  scaleGeometry,
} from './bio-fermentation-pathways';
it('balances carbon and mass across wine then oxygen-fed vinegar', () => {
  for (let i = 0; i <= 100; i++)
    for (const air of [true, false]) {
      const s = fermentationState(i / 100, i / 100, air);
      expect(s.carbon).toBeCloseTo(6);
      expect(s.massOut).toBeCloseTo(s.massIn);
    }
  const s = fermentationState(1, 1);
  expect(s.acetate).toBe(2);
  expect(s.oxygenUsed).toBe(2);
  expect(s.massOut).toBe(244);
  expect(fermentationState(1, 1, false).ethanol).toBe(2);
  expect(fermentationState(0, 1).acetate).toBe(0);
});
it('never presents missing oxygen as killing all lactic bacteria', () => {
  expect(pickleState(10, 5, false).lactate).toBe(pickleState(10, 5, true).lactate);
  expect(pickleState(10, 20).lactate).toBeLessThan(pickleState(10, 5).lactate);
  expect(pickleState(0).sugar).toBe(1);
});
it('converts a synthetic matched-matrix nitrite calibration with explicit dilution', () => {
  expect(nitriteResult('.068')!.foodMgKg).toBeCloseTo(12);
  expect(nitriteResult('')).toBeNull();
  expect(nitriteResult('.01')).toBeNull();
  expect(nitriteResult('.43')).toBeNull();
  expect(nitriteResult('.02')!.foodMgKg).toBe(0);
  expect(nitriteResult('.068', 0.02, 0.04, 50, 10, 1)!.foodMgKg).toBeCloseTo(6);
});
it('withdraws before traversing and delivers after the pipette reaches the tube', () => {
  for (let i = 0; i <= 1000; i++) {
    const s = sampleMotion(i / 1000, 240);
    expect(s.source + s.pipette + s.sample).toBeCloseTo(50);
    if (s.x > 57.6 + 0.001 && s.x < 182.4 - 0.001) expect(s.y).toBe(100);
    if (s.sample > 0) expect(s.y).toBe(156);
  }
  expect(sampleMotion(1, 240).sample).toBe(5);
});
it('keeps the gas path inside liquid, neck and connected airlock', () => {
  for (const w of [240, 320, 800]) {
    const g = jarGeometry(w);
    expect(g.gas[0].y).toBeGreaterThan(g.water);
    expect(g.gas[1].x).toBeGreaterThan(g.neckLeft);
    expect(g.gas[1].x).toBeLessThan(g.neckRight);
    expect(g.right).toBeLessThan(w);
  }
});
it('balances dissolved oxygen and heat in the independently integrated reactor', () => {
  for (const a of [0, 1])
    for (const m of [0, 1])
      for (const c of [false, true]) {
        const s = reactorState(20, a, m, c);
        expect(s.oxygen).toBeCloseTo(6 + s.transferred - s.consumed, 9);
        expect(s.temp).toBeCloseTo(28 + s.heatInput - s.heatRemoved, 9);
        expect(s.oxygen).toBeGreaterThanOrEqual(0);
      }
  expect(reactorState(20, 0).oxygen).toBeLessThan(0.01);
  expect(reactorState(20, 1, 1).oxygen).toBeGreaterThan(reactorState(20, 1, 0).oxygen);
  expect(reactorState(20, 1, 1, false).temp).toBeGreaterThan(reactorState(20).temp);
});
it('scaling volume eightfold only quadruples surface', () => {
  expect(scaleGeometry(2).volume / scaleGeometry(1).volume).toBe(8);
  expect(scaleGeometry(2).area / scaleGeometry(1).area).toBe(4);
  expect(scaleGeometry(2).areaPerVolume).toBe(3);
});
import {
  nitritePools,
  nitrogenMarker,
  nitriteRecord,
  PICKLE_TEXTBOOK_SERIES,
  fermentationCarbon,
  reactorHistory,
  fermentationDirector,
  fermentationSpeechAnchors,
} from './bio-fermentation-pathways';
it('independently integrates sequential N pools and closes the N-only account at zero/equal rates', () => {
  for (const a of [0, 0.1, 0.32, 0.48])
    for (const b of [0, 0.1, 0.48, 0.96])
      for (const t of [0, 1, 4, 12]) {
        let x = 1,
          y = 0,
          z = 0;
        const dt = t / 10000;
        for (let i = 0; i < 10000; i++) {
          const k1 = [-a * x, a * x - b * y, b * y],
            k2 = [
              -a * (x + (k1[0] * dt) / 2),
              a * (x + (k1[0] * dt) / 2) - b * (y + (k1[1] * dt) / 2),
              b * (y + (k1[1] * dt) / 2),
            ],
            k3 = [
              -a * (x + (k2[0] * dt) / 2),
              a * (x + (k2[0] * dt) / 2) - b * (y + (k2[1] * dt) / 2),
              b * (y + (k2[1] * dt) / 2),
            ],
            k4 = [
              -a * (x + k3[0] * dt),
              a * (x + k3[0] * dt) - b * (y + k3[1] * dt),
              b * (y + k3[1] * dt),
            ];
          x += (dt * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])) / 6;
          y += (dt * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])) / 6;
          z += (dt * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])) / 6;
        }
        const s = nitritePools(t, a, b);
        expect(s.nitrate).toBeCloseTo(x, 9);
        expect(s.nitrite).toBeCloseTo(y, 9);
        expect(s.other).toBeCloseTo(z, 9);
        expect(s.total).toBeCloseTo(1, 12);
      }
  expect(nitritePools(8, 0.32, 0.96).nitrite).toBeLessThan(nitritePools(8, 0.32, 0.48).nitrite);
  expect(nitritePools(8, 0.32, 0).other).toBe(0);
});
it('preserves selected nitrogen identities and continuous positions, not a count-derived analytical curve', () => {
  for (const rates of [
    [0, 0.4],
    [0.32, 0],
    [0.32, 0.48],
    [0.32, 1.2],
  ])
    for (const id of [0, 5, 10]) {
      let previous = nitrogenMarker(id, 0, ...rates);
      let samples = 0,
        failedChecks = 0;
      let firstViolation:
        | {
            condition: string;
            sample: number;
            current: ReturnType<typeof nitrogenMarker>;
            previous: ReturnType<typeof nitrogenMarker>;
            maxStep: number;
          }
        | undefined;
      const recordViolation = (
        condition: string,
        sample: number,
        current: ReturnType<typeof nitrogenMarker>,
        before: ReturnType<typeof nitrogenMarker>,
        maxStep: number,
      ) => {
        failedChecks++;
        firstViolation ??= { condition, sample, current, previous: before, maxStep };
      };
      for (let i = 0; i <= 12000; i++) {
        const n = nitrogenMarker(id, i / 1000, ...rates);
        const gap = n.leave - n.enter,
          hin = Number.isFinite(n.enter)
            ? Math.min(0.3, n.enter / 3, Number.isFinite(gap) ? gap / 3 : 0.3)
            : 0.3,
          hout = Number.isFinite(gap) ? Math.min(0.3, gap / 3) : 0.3,
          maxSpeed = 98 / (2 * Math.min(hin, hout)),
          maxStep = maxSpeed * 0.001 + 1e-8;
        // Preserve every matcher condition, including rejection of NaN comparisons.
        if (!Object.is(n.id, previous.id)) recordViolation('identity', i, n, previous, maxStep);
        if (!(Math.abs(n.x - previous.x) <= maxStep))
          recordViolation('continuity', i, n, previous, maxStep);
        if (!(n.x >= 42)) recordViolation('lower bound', i, n, previous, maxStep);
        if (!(n.x <= 238)) recordViolation('upper bound', i, n, previous, maxStep);
        samples++;
        previous = n;
      }
      expect(
        { samples, failedChecks, firstViolation },
        `rates=${rates.join(',')}; id=${id}`,
      ).toEqual({
        samples: 12001,
        failedChecks: 0,
        firstViolation: undefined,
      });
    }
});
it('records missing independently from measured zero and never reuses a new dilution for an old sample', () => {
  expect(nitriteRecord('a', '3', '', 2)?.result).toBeNull();
  expect(nitriteRecord('b', '5', '.020', 2)?.result).toBe(0);
  const a = nitriteRecord('c', '7', '.068', 2)!;
  nitriteRecord('d', '9', '.068', 4);
  expect(a.result).toBeCloseTo(12);
  expect(a.dilution).toBe(2);
  expect(Object.isFrozen(a)).toBe(true);
  expect(nitriteRecord('e', '', '.068', 2)).toBeNull();
  expect(nitriteResult('.068', NaN)).toBeNull();
  expect(nitriteResult('.068', 0.02, NaN)).toBeNull();
  expect(PICKLE_TEXTBOOK_SERIES.map((x) => x.day)).toEqual([3, 5, 7, 9, 11, 13]);
  expect(Object.isFrozen(PICKLE_TEXTBOOK_SERIES[0])).toBe(true);
});
it('holds six carbon identities and accounts for both the liquid and gas destinations', () => {
  for (const w of [240, 288, 760])
    for (const kind of ['lactate', 'ethanol', 'acetate'] as const) {
      for (let i = 0; i <= 100; i++) {
        const a = fermentationCarbon(kind, i / 100, w);
        expect(a.map((x) => x.id)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
        expect(a.every((x) => x.x > 10 && x.x < w - 10)).toBe(true);
      }
      const a = fermentationCarbon(kind, 1, w);
      expect(a.filter((x) => x.product.startsWith('co2'))).toHaveLength(kind === 'lactate' ? 0 : 2);
    }
});
it('carries exactly the same existing oxygen and heat stocks across intervention time', () => {
  for (const boundary of [0, 4, 8, 13]) {
    const before = reactorHistory(boundary, { airOffAt: boundary }),
      control = reactorHistory(boundary);
    expect(before.oxygen).toBeCloseTo(control.oxygen, 9);
    expect(before.transferred).toBeCloseTo(control.transferred, 9);
    const after = reactorHistory(boundary + 0.001, { airOffAt: boundary });
    expect(Math.abs(after.oxygen - before.oxygen)).toBeLessThan(0.001);
    expect(after.transferred).toBeCloseTo(before.transferred, 9);
  }
  for (const options of [
    { airOffAt: 8 },
    { air: 0 },
    { mix: 0 },
    { coolOnAt: 8 },
    { cool: false },
  ]) {
    const r = reactorHistory(20, options);
    expect(r.oxygen).toBeCloseTo(6 + r.transferred - r.consumed, 10);
    expect(r.temp).toBeCloseTo(28 + r.heatInput - r.heatRemoved, 10);
    expect(r.oxygen).toBeGreaterThanOrEqual(0);
  }
  expect(reactorHistory(20, { airOffAt: 8 }).oxygen).toBeGreaterThan(
    reactorHistory(20, { air: 0 }).oxygen,
  );
  const thermalBefore = reactorHistory(8, { coolOnAt: 8 }),
    thermalControl = reactorHistory(8, { cool: false });
  expect(thermalBefore.temp).toBeCloseTo(thermalControl.temp, 9);
});
it('makes the faster-removal prediction before starting a separately labelled rerun', () => {
  for (const lang of ['zh', 'en']) {
    const a = fermentationSpeechAnchors(lang);
    expect(fermentationDirector(3, (a.predictionStart + a.rerunStart) / 2, lang).shot).toBe(
      'prediction',
    );
    expect(fermentationDirector(3, a.predictionStart, lang).showPrediction).toBe(false);
    expect(fermentationDirector(3, a.rerunStart, lang).process).toBe(0);
    expect(fermentationDirector(3, a.rerunStart + 9, lang).process).toBe(1);
    const rise = nitritePools(fermentationDirector(3, a.riseEnd, lang).process * 12);
    const fall = nitritePools(fermentationDirector(3, a.fallAt + 0.5, lang).process * 12);
    expect(rise.inRate).toBeGreaterThan(rise.outRate);
    expect(fall.outRate).toBeGreaterThan(fall.inRate);
    for (const t of [a.riseEnd, a.fallAt])
      expect(
        Math.abs(
          fermentationDirector(3, t + 0.00001, lang).process -
            fermentationDirector(3, t - 0.00001, lang).process,
        ),
      ).toBeLessThan(0.00001);
  }
});
import { nitrogenPercentages } from './bio-fermentation-pathways';
it('rounds valid continuous nitrogen pools without displaying 99 or101 percent total', () => {
  for (let i = 0; i <= 120; i++)
    for (const rate of [0, 0.02, 0.48, 0.96, 1.2]) {
      const p = nitritePools(i / 10, 0.32, rate),
        labels = nitrogenPercentages(p);
      expect(labels.reduce((a, b) => a + b, 0)).toBe(100);
      labels.forEach((v, j) =>
        expect(Math.abs(v - [p.nitrate, p.nitrite, p.other][j] * 100)).toBeLessThan(1),
      );
    }
});
it('an exploration event preserves all past inventory and only changes subsequent derivatives', () => {
  const before = reactorHistory(10),
    cut = reactorHistory(10, { events: [{ at: 10, air: 0 }] }),
    later = reactorHistory(10.001, { events: [{ at: 10, air: 0 }] });
  expect(cut.oxygen).toBeCloseTo(before.oxygen, 10);
  expect(cut.transferred).toBeCloseTo(before.transferred, 10);
  expect(later.transferred).toBeCloseTo(cut.transferred, 10);
  expect(later.oxygen).toBeLessThan(cut.oxygen);
  const resumed = reactorHistory(14, {
      events: [
        { at: 10, air: 0 },
        { at: 13, air: 1 },
      ],
    }),
    stopped = reactorHistory(14, { events: [{ at: 10, air: 0 }] });
  expect(resumed.oxygen).toBeGreaterThan(stopped.oxygen);
  expect(resumed.oxygen).toBeCloseTo(6 + resumed.transferred - resumed.consumed, 10);
});
import { vinegarHistory } from './bio-fermentation-pathways';
it('stopping oxygen preserves previously formed vinegar products and resuming only changes the future', () => {
  const a = vinegarHistory(8),
    b = vinegarHistory(8, [{ at: 8, air: 0 }]),
    c = vinegarHistory(12, [{ at: 8, air: 0 }]);
  expect(b.extent).toBe(a.extent);
  expect(c.extent).toBe(a.extent);
  expect(c.air).toBe(0);
  expect(
    vinegarHistory(13, [
      { at: 8, air: 0 },
      { at: 12, air: 1 },
    ]).extent,
  ).toBeGreaterThan(c.extent);
  expect(vinegarHistory(20, [{ at: 0, air: 0 }]).extent).toBe(0);
});
it('matches an independent high-resolution RK4 oxygen integration and analytic constant-cooling solution', () => {
  for (const off of [0, 2.2, 8, Infinity])
    for (const mix of [0, 1]) {
      let c = 6;
      const dt = 0.0005;
      for (let i = 0; i < 40000; i++) {
        const t = i * dt,
          f = (x: number, at: number) =>
            (at < off ? 0.08 + 0.52 * mix : 0) * (8 - x) - (0.65 * x) / (0.5 + x),
          k1 = f(c, t),
          k2 = f(c + (k1 * dt) / 2, t + dt / 2),
          k3 = f(c + (k2 * dt) / 2, t + dt / 2),
          k4 = f(c + k3 * dt, t + dt);
        c += (dt * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
      }
      expect(Math.abs(reactorHistory(20, { airOffAt: off, mix }).oxygen - c)).toBeLessThan(0.006);
    }
  for (const cool of [true, false]) {
    const h = cool ? 0.32 : 0.025,
      exact = 26 + 0.7 / h + (28 - 26 - 0.7 / h) * Math.exp(-h * 20);
    expect(Math.abs(reactorHistory(20, { cool }).temp - exact)).toBeLessThan(0.003);
  }
  const events = [{ at: 10, mix: 0 }],
    a = reactorHistory(10, { events }),
    b = reactorHistory(20, { events });
  expect(b.shaftPhase).toBe(a.shaftPhase);
});
