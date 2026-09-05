import { describe, expect, it } from 'vitest';
import {
  SIPHON,
  tubeArea,
  siphonGeometry,
  siphonPoint,
  siphonVaporPressure,
  siphonState,
  siphonPressure,
  siphonShot,
  siphonTrial,
} from './siphon';

describe('siphon geometry, pressure and conserved water', () => {
  it('preserves the rigid tube length, both connected mouths, and smooth tangents while lifting the outlet', () => {
    const base = siphonGeometry();
    for (const angle of [0, 0.2, 0.4, 0.6, 0.73]) {
      const g = siphonGeometry(angle);
      expect(g.length).toBe(base.length);
      expect(siphonPoint(g, 0)).toEqual(g.inlet);
      expect(siphonPoint(g, g.length).x).toBeCloseTo(g.outlet.x, 12);
      expect(siphonPoint(g, g.length).y).toBeCloseTo(g.outlet.y, 12);
      expect(siphonPoint(g, g.crestAt).y).toBeCloseTo(g.crest.y, 12);
      let length = 0;
      for (let n = 1; n <= 2000; n++) {
        const a = siphonPoint(g, ((n - 1) * g.length) / 2000),
          b = siphonPoint(g, (n * g.length) / 2000);
        length += Math.hypot(b.x - a.x, b.y - a.y);
        expect(b.y).toBeLessThanOrEqual(g.crest.y + 1e-8);
        // The rotating upstream tube remains inside the open trough until it clears its rim.
        if ((n * g.length) / 2000 < g.crestAt && b.y < 1.2) {
          expect(b.x).toBeGreaterThan(-0.95);
          expect(b.x).toBeLessThan(0.3);
        }
      }
      expect(length).toBeCloseTo(g.length, 5);
      for (const join of [g.leg, g.leg + Math.PI * SIPHON.radius]) {
        const a = siphonPoint(g, join - 1e-5),
          b = siphonPoint(g, join),
          c = siphonPoint(g, join + 1e-5);
        expect(Math.hypot(b.x - a.x - (c.x - b.x), b.y - a.y - (c.y - b.y))).toBeLessThan(2e-10);
      }
    }
  });
  it('balances Bernoulli head and recovers atmospheric pressure at the free outlet', () => {
    for (const top of [1.9, 3, 5, 8, 10]) {
      const s = siphonState({ geometry: siphonGeometry(0, top) });
      expect(s.velocityHead + s.lossHead).toBeCloseTo(s.head, 12);
      expect(siphonPressure(s, s.geometry.length)).toBeCloseTo(s.atmosphere, 8);
      expect(siphonPressure(s, s.geometry.crestAt)).toBeCloseTo(s.crestPressure, 8);
      expect(s.totalVolume).toBeCloseTo(SIPHON.totalVolume, 14);
    }
  });
  it('does not use equal atmospheric pressure as an extra driving head', () => {
    const sea = siphonState(),
      low = siphonState({ atmosphere: 70000 });
    expect(sea.flow).toBe(low.flow);
    expect(sea.crestPressure - low.crestPressure).toBeCloseTo(31325, 9);
    const tallSea = siphonState({ geometry: siphonGeometry(0, 8.5) });
    const tallLow = siphonState({ geometry: siphonGeometry(0, 8.5), atmosphere: 70000 });
    expect(tallSea.status).toBe('flow');
    expect(tallLow.status).toBe('vapor');
    expect(tallLow.flow).toBe(0);
    expect(tallLow.pressureValid).toBe(false);
  });
  it('uses the temperature-dependent NIST fit and a finite crest-pressure limit', () => {
    // The finite-range Antoine fit is within 2 Pa of the NIST 20 °C table (2338.34 Pa).
    expect(Math.abs(siphonVaporPressure(20) - 2338.34)).toBeLessThan(2);
    expect(siphonVaporPressure(29)).toBeGreaterThan(siphonVaporPressure(5));
    const s = siphonState();
    expect((s.atmosphere - s.vaporPressure) / (SIPHON.density * SIPHON.gravity)).toBeGreaterThan(
      10,
    );
    expect(s.crestLimit).toBeLessThan(
      (s.atmosphere - s.vaporPressure) / (SIPHON.density * SIPHON.gravity),
    );
    expect(siphonState({ geometry: siphonGeometry(0, 11.5) }).status).toBe('vapor');
  });
  it('rejects the UI-reachable 7.4 m / 70.250 kPa / 25 °C case before the crest itself reaches vapor pressure', () => {
    const s = siphonTrial({ top: 7.4, atmosphere: 70250, temperature: 25 });
    expect(s.crestPressure).toBeGreaterThan(s.vaporPressure);
    expect(s.minimumPressure).toBeCloseTo(3158.13415052787, 7);
    expect(s.minimumPressureAt - s.geometry.crestAt).toBeCloseTo(0.03819186959, 10);
    expect(s.minimumPressure).toBeLessThan(s.vaporPressure - 8);
    expect(s.status).toBe('vapor');
    expect(s.pressureValid).toBe(false);
    expect(s.velocity).toBe(0);
    expect(s.flow).toBe(0);
    expect(
      siphonTrial({ top: 7.4, atmosphere: 70250, temperature: 25, seconds: 300 }).sourceVolume,
    ).toBe(s.sourceVolume);
    expect(s.totalVolume).toBeCloseTo(SIPHON.totalVolume, 14);
  });
  it('finds the global pressure minimum with an independent dense pressure/energy check on rotated and tall tubes', () => {
    const geometries = [
      ...[0, 0.2, 0.45, 0.7].map((angle) => siphonGeometry(angle)),
      ...[3, 7.4, 8.5, 11.5].map((top) => siphonGeometry(0, top)),
    ];
    for (const geometry of geometries) {
      const s = siphonState({ geometry });
      let sampledMinimum = Infinity;
      for (let i = 0; i <= 2000; i++) {
        const at = (geometry.length * i) / 2000,
          point = siphonPoint(geometry, at),
          bendFraction = Math.max(0, Math.min(1, (at - geometry.leg) / (Math.PI * SIPHON.radius))),
          loss =
            ((0.5 + (0.03 * at) / 0.012 + 0.4 * bendFraction) * s.candidateVelocity ** 2) /
            (2 * SIPHON.gravity);
        const pressure = siphonPressure(s, at);
        const energyHead =
          (pressure - s.atmosphere) / (SIPHON.density * SIPHON.gravity) +
          point.y +
          s.candidateVelocity ** 2 / (2 * SIPHON.gravity) +
          loss;
        expect(energyHead).toBeCloseTo(s.sourceLevel, 10);
        expect(pressure).toBeGreaterThanOrEqual(s.minimumPressure - 1e-8);
        if (s.pressureValid) expect(pressure).toBeGreaterThan(s.vaporPressure);
        sampledMinimum = Math.min(sampledMinimum, pressure);
      }
      expect(sampledMinimum - s.minimumPressure).toBeLessThan(0.2);
      expect(siphonPressure(s, s.minimumPressureAt)).toBe(s.minimumPressure);
      expect(siphonPressure(s, geometry.crestAt)).toBe(s.crestPressure);
      if (s.head >= 0) expect(siphonPressure(s, geometry.length)).toBeCloseTo(s.atmosphere, 8);
    }
  });
  it('stops at the actual minimum-pressure equality, and restores the same flow immediately above it', () => {
    const geometry = siphonGeometry(0, 7.4),
      reference = siphonState({ geometry, temperature: 25 }),
      threshold = reference.atmosphere - reference.minimumPressure + reference.vaporPressure;
    for (const offset of [-0.01, 0, 0.01]) {
      const s = siphonState({ geometry, temperature: 25, atmosphere: threshold + offset });
      expect(s.minimumPressure - s.vaporPressure).toBeCloseTo(offset, 8);
      expect(s.status).toBe(offset > 0 ? 'flow' : 'vapor');
      expect(s.pressureValid).toBe(offset > 0);
      expect(s.flow).toBe(offset > 0 ? reference.flow : 0);
      expect(s.totalVolume).toBeCloseTo(SIPHON.totalVolume, 14);
    }
    const raised = siphonGeometry(0.5),
      still = siphonState({ geometry: raised, sourceVolume: raised.outlet.y * SIPHON.sourceArea });
    expect(still.velocity).toBe(0);
    expect(still.minimumPressureAt).toBeCloseTo(raised.crestAt, 12);
    expect(still.minimumPressure).toBeCloseTo(still.crestPressure, 9);
  });
  it('stops at zero/negative head, air, venting and an uncovered inlet', () => {
    const g = siphonGeometry(0.5),
      equal = siphonState({ geometry: g, sourceVolume: g.outlet.y * SIPHON.sourceArea });
    expect(equal.status).toBe('level');
    expect(equal.flow).toBe(0);
    expect(siphonTrial({ angle: 0.73 }).flow).toBe(0);
    expect(siphonTrial({ primed: false, seconds: 300 }).flow).toBe(0);
    expect(siphonTrial({ vented: true, seconds: 300 }).flow).toBe(0);
    expect(siphonState({ sourceVolume: SIPHON.inlet * SIPHON.sourceArea }).status).toBe(
      'uncovered',
    );
  });
  it('conserves reservoir plus tube volume throughout all eight chapters, including prefill and drainage', () => {
    for (let c = 0; c < 8; c++)
      for (let n = 0; n <= 220; n++) {
        const s = siphonShot(c, n / 220).state;
        expect(s.totalVolume).toBeCloseTo(SIPHON.totalVolume, 10);
        expect(s.tubeVolume).toBeCloseTo(
          s.wet.reduce((sum, [a, b]) => sum + (b - a) * tubeArea, 0),
          12,
        );
        expect(s.sourceVolume).toBeGreaterThan(0);
        expect(s.receiverLevel).toBeLessThan(s.geometry.outlet.y);
        expect(s.sourceLevel).toBeCloseTo(s.sourceVolume / SIPHON.sourceArea, 12);
        expect(Number.isFinite(s.crestPressure)).toBe(true);
      }
    const dry = siphonShot(0, 1).state,
      primed = siphonShot(1, 0.64).state;
    expect(primed.sourceVolume).toBeLessThan(dry.sourceVolume);
    expect(primed.tubeVolume).toBeGreaterThan(dry.tubeVolume);
    const before = siphonShot(5, 0.4).state,
      after = siphonShot(5, 1).state;
    expect(after.sourceVolume).toBeGreaterThan(before.sourceVolume);
    expect(after.receiverVolume).toBeGreaterThan(before.receiverVolume);
    expect(after.tubeVolume).toBeLessThan(before.tubeVolume);
    expect(after.flow).toBe(0);
    expect(siphonShot(4, 0.9).state.flow).toBe(0);
  });
  it('reconstructs a sought shot independently of traversal and maintains main-film chapter boundaries', () => {
    const targets = [
      [1, 0.48],
      [3, 0.87],
      [5, 0.71],
      [7, 0.53],
    ];
    const expected = targets.map(([c, p]) => siphonShot(c, p));
    for (let c = 7; c >= 0; c--) for (let p = 1; p >= 0; p -= 0.023) siphonShot(c, p);
    targets.forEach(([c, p], i) => expect(siphonShot(c, p)).toEqual(expected[i]));
    for (let c = 0; c < 5; c++) {
      const a = siphonShot(c, 1).state,
        b = siphonShot(c + 1, 0).state;
      expect(a.sourceVolume).toBe(b.sourceVolume);
      expect(a.receiverVolume).toBe(b.receiverVolume);
      expect(a.travel).toBe(b.travel);
    }
  });
  it('makes exploration time transfer conserved volume and handles prepared empty-tube equilibrium', () => {
    const start = siphonTrial(),
      later = siphonTrial({ seconds: 120 });
    expect(later.sourceVolume).toBeLessThan(start.sourceVolume);
    expect(later.receiverVolume - start.receiverVolume).toBeCloseTo(
      start.sourceVolume - later.sourceVolume,
      12,
    );
    expect(later.flow).toBeLessThan(start.flow);
    for (const angle of [0, 0.3, 0.6, 0.73]) {
      const dry = siphonTrial({ angle, primed: false });
      expect(siphonPoint(dry.geometry, dry.wet[0][1]).y).toBeCloseTo(dry.sourceLevel, 10);
      expect(dry.totalVolume).toBeCloseTo(SIPHON.totalVolume, 13);
    }
    expect(siphonTrial({ seconds: 120 })).toEqual(later);
  });
  it('rejects unsupported or non-finite inputs instead of displaying invented results', () => {
    expect(() => siphonTrial({ top: NaN })).toThrow();
    expect(() => siphonGeometry(0.9)).toThrow();
    expect(() => siphonVaporPressure(40)).toThrow();
    expect(() => siphonState({ sourceVolume: -1 })).toThrow();
    expect(() => siphonState({ receiverVolume: 0.1 })).toThrow();
    expect(() => siphonState({ wet: [[1, 0]] })).toThrow();
    expect(() =>
      siphonState({
        wet: [
          [0, 2],
          [1, 3],
        ],
      }),
    ).toThrow();
    expect(siphonState({ wet: [[0, 1]] }).flow).toBe(0);
  });
});
