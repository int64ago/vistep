import { expect, it } from 'vitest';
import { etherFringes, simultaneity, muonFlight, flightClock } from './relativity-experiments';
it('rotating the hypothetical ether apparatus reverses the phase and zero wind removes it', () => {
  expect(etherFringes(0)).toBeCloseTo(0.22, 2);
  expect(etherFringes(Math.PI / 2)).toBeCloseTo(-etherFringes(0));
  expect(etherFringes(0, 0)).toBe(0);
  expect(etherFringes(Math.PI / 4)).toBeCloseTo(0);
});
it('distinguishes reception times from transformed emission times', () => {
  const s = simultaneity(0.6);
  expect(s.arrivalRight).toBeCloseTo(0.3125);
  expect(s.arrivalLeft).toBeCloseTo(1.25);
  expect(s.emissionRightPrime).toBeLessThan(s.emissionLeftPrime);
  expect(simultaneity(0).arrivalLeft).toBe(simultaneity(0).arrivalRight);
});
it('predicts muon survival consistently from either proper time or contracted distance', () => {
  const m = muonFlight();
  expect(m.survival).toBeGreaterThan(0.2);
  expect(m.classical).toBeLessThan(1e-6);
  expect(m.properTime).toBeCloseTo(m.labTime / m.gamma, 12);
  expect(muonFlight(0.995, 10000, 0).survival).toBe(1);
});
it('includes Earth rotation and gravitational contribution to flying-clock differences', () => {
  const e = flightClock(1),
    w = flightClock(-1);
  expect(e.gravity).toBeGreaterThan(0);
  expect(e.kinetic).toBeLessThan(0);
  expect(w.kinetic).toBeGreaterThan(0);
  expect(w.gravity).toBe(e.gravity);
  expect(flightClock(1, 0, 40, 0).total).toBe(0);
});

import {
  centralFlashEvents,
  trainFlashState,
  muonCohort,
  MUON_MEAN_LIFE,
  lightClock,
  relativityDirector,
  RELATIVITY_SPEECH_CUTS,
} from './relativity-experiments';
import { CLOCK_RECORDS, MUON_RECORDS } from './relativity-experiments-records';
it('central flash hits the actual walls and transforms the same two events', () => {
  for (const beta of [-0.8, -0.6, 0, 0.6, 0.8]) {
    const m = centralFlashEvents(beta);
    for (const e of m.events) {
      expect(e.x).toBeCloseTo(beta * e.t + (e.side * m.length) / 2, 12);
      expect(e.xPrime).toBeCloseTo(e.side * 0.5, 12);
      expect(e.tPrime).toBeCloseTo(0.5, 12);
      const at = e.t / m.endGround;
      const before = trainFlashState(beta, 'ground', Math.max(0, at - 1e-5)).pulses.find(
        (v) => v.id === e.id,
      )!;
      const exact = trainFlashState(beta, 'ground', at).pulses.find((v) => v.id === e.id)!;
      expect(before.received).toBe(false);
      expect(exact.received).toBe(true);
      expect(exact.lightX).toBeCloseTo(exact.wallX, 12);
    }
  }
  const e = centralFlashEvents(0.6).events;
  expect(e[0]!.t).toBeCloseTo(0.25, 12);
  expect(e[1]!.t).toBeCloseTo(1, 12);
});
it('equal-time snapshots have correct proper and contracted lengths and reverse ordering', () => {
  expect(trainFlashState(0.6, 'ground', 0.7).length).toBeCloseTo(0.8, 12);
  expect(trainFlashState(0.6, 'train', 0.7).length).toBe(1);
  expect(centralFlashEvents(-0.6).events[0]!.t).toBeGreaterThan(
    centralFlashEvents(-0.6).events[1]!.t,
  );
  expect(centralFlashEvents(0).events[0]!.t).toBe(centralFlashEvents(0).events[1]!.t);
});
it('paired deterministic populations share identities and quantiles, not two random draws', () => {
  for (const beta of [0.9, 0.99, 0.995, 0.999])
    for (const p of [0, 0.25, 0.7, 1]) {
      const m = muonFlight(beta, 10000, p);
      expect(m.classicalCohort.map((x) => [x.id, x.lifetime])).toEqual(
        m.relativeCohort.map((x) => [x.id, x.lifetime]),
      );
      const ids = new Set(m.relativeCohort.filter((x) => x.alive).map((x) => x.id));
      expect(m.classicalCohort.filter((x) => x.alive).every((x) => ids.has(x.id))).toBe(true);
      expect(Math.abs(m.relativeCount - 100 * m.survival)).toBeLessThanOrEqual(0.5);
      expect(muonCohort((m.contractedHeight / (beta * 299792458)) * p).map((x) => x.alive)).toEqual(
        m.relativeCohort.map((x) => x.alive),
      );
    }
  expect(muonFlight(0.99, 10000, 1).relativeCount).toBe(11);
  expect(muonFlight(0.995, 10000, 1).relativeCount).toBe(22);
  expect(muonFlight(0.99, 10000, 1).classicalCount).toBe(0);
});
it('rewinding preserves lifetime identities and half-life differs from mean life', () => {
  const before = muonCohort(0),
    later = muonCohort(MUON_MEAN_LIFE),
    back = muonCohort(0);
  expect(back).toEqual(before);
  expect(later.filter((x) => x.alive).length).toBe(37);
  expect(muonCohort(MUON_MEAN_LIFE * Math.log(2)).filter((x) => x.alive)).toHaveLength(50);
  expect(later.map((x) => x.id)).toEqual(before.map((x) => x.id));
});
it('zero-distance and zero-speed arrivals are explicitly distinguished', () => {
  expect(muonFlight(0, 0, 1).arrives).toBe(true);
  expect(muonFlight(0, 0, 1).relativeCount).toBe(100);
  const no = muonFlight(0, 10000, 1);
  expect(no.arrives).toBe(false);
  expect(no.height).toBe(10000);
  for (const v of [NaN, Infinity, -Infinity]) {
    for (const result of [
      centralFlashEvents(v),
      muonFlight(v, v, v),
      flightClock(v, v, v, v),
      lightClock(v, v),
    ])
      expect(JSON.stringify(result)).not.toMatch(/NaN|Infinity|null/);
    expect(Number.isFinite(etherFringes(v, v, v, v))).toBe(true);
  }
});
it('transverse light-clock geometry uses the same c along both legs', () => {
  const m = lightClock(0.6, 1);
  expect(m.properTime).toBe(2);
  expect(m.groundTime).toBeCloseTo(2.5, 12);
  expect(Math.hypot(m.bounceX, 1) * 2).toBeCloseTo(m.groundTime, 12);
  expect(lightClock(0.6, 0.5).y).toBe(1);
  expect(m.y).toBe(0);
  expect(lightClock(0, 0.3).properTime).toBe(lightClock(0, 0.3).groundTime);
});
it('historical observations stay frozen and differ from the hypothetical interval', () => {
  const records = JSON.stringify([MUON_RECORDS, CLOCK_RECORDS]);
  for (const beta of [0.9, 0.99, 0.995]) muonFlight(beta);
  for (const s of [-1, 1]) for (const h of [0, 10000, 15000]) flightClock(s, h);
  expect(JSON.stringify([MUON_RECORDS, CLOCK_RECORDS])).toBe(records);
  expect(Object.isFrozen(MUON_RECORDS.summit)).toBe(true);
  expect(Object.isFrozen(CLOCK_RECORDS.predicted.east)).toBe(true);
  expect(MUON_RECORDS.summit).toEqual([568, 554, 582, 527, 588, 559]);
  expect(CLOCK_RECORDS.observedWest).toEqual([277, 284, 266, 266]);
  expect(flightClock(1).total).not.toBeCloseTo(CLOCK_RECORDS.predicted.east.net, 0);
});
it('measured train cuts preserve one clock and keep reversal behind the spoken prediction', () => {
  for (const locale of ['zh', 'en'] as const) {
    const c = RELATIVITY_SPEECH_CUTS[locale];
    const [start, arrival, ground, groundStart, rear, front] = c.train;
    expect(relativityDirector(2, start, locale).progress).toBe(0);
    const a = relativityDirector(2, arrival, locale);
    expect(a.frame).toBe('train');
    expect(trainFlashState(a.beta, a.frame, a.progress).pulses.every((p) => p.received)).toBe(true);
    expect(relativityDirector(2, ground, locale).frame).toBe('ground');
    const before = relativityDirector(2, rear - 0.01, locale);
    const exact = relativityDirector(2, rear, locale);
    expect(
      trainFlashState(exact.beta, exact.frame, before.progress).pulses.map((p) => p.received),
    ).toEqual([false, false]);
    expect(
      trainFlashState(exact.beta, exact.frame, exact.progress).pulses.map((p) => p.received),
    ).toEqual([true, false]);
    expect(relativityDirector(2, front, locale).progress).toBe(1);
    expect(relativityDirector(2, groundStart, locale).progress).toBe(0);
    const [prediction, release, reversedEnd, stationary, , stationaryEnd] = c.events;
    expect(relativityDirector(3, prediction, locale)).toMatchObject({
      prediction: true,
      progress: 0,
      beta: -0.6,
    });
    expect(relativityDirector(3, release - 0.01, locale).progress).toBe(0);
    expect(relativityDirector(3, reversedEnd, locale).progress).toBe(1);
    expect(relativityDirector(3, stationary, locale).beta).toBe(0);
    expect(relativityDirector(3, stationaryEnd, locale).progress).toBe(1);
  }
});
it('measured muon views preserve the initial cohort until the narrated trial begins', () => {
  for (const locale of ['zh', 'en'] as const) {
    const c = RELATIVITY_SPEECH_CUTS[locale];
    const [record, cohort, start, arrival] = c.muons;
    expect(relativityDirector(4, record - 0.01, locale).reveal).toBe(false);
    expect(relativityDirector(4, record, locale).reveal).toBe(true);
    for (const time of [cohort, start]) {
      const d = relativityDirector(4, time, locale),
        m = muonFlight(d.beta, 10000, d.progress);
      expect(d.shot).toBe('muon-cohort');
      expect(m.relativeCount).toBe(100);
      expect(m.classicalCount).toBe(100);
    }
    const a = relativityDirector(4, arrival, locale);
    expect(muonFlight(a.beta, 10000, a.progress).relativeCount).toBe(11);
    const [, , , , sameArrival, predict, release, fasterArrival] = c.frames;
    const same = relativityDirector(5, sameArrival, locale);
    expect(same.shot).toBe('muon-frame');
    expect(muonFlight(same.beta, 10000, same.progress).relativeCount).toBe(11);
    for (const time of [predict, release - 0.01])
      expect(relativityDirector(5, time, locale)).toMatchObject({ prediction: true, progress: 0 });
    const faster = relativityDirector(5, fasterArrival, locale);
    expect(faster.prediction).toBe(false);
    expect(muonFlight(faster.beta, 10000, faster.progress).relativeCount).toBe(22);
  }
});
it('measured clock reveals and height changes are reversible and locale specific', () => {
  for (const locale of ['zh', 'en'] as const) {
    const c = RELATIVITY_SPEECH_CUTS[locale];
    for (const [ch, reveal] of [
      [6, c.east[2]],
      [7, c.west[3]],
    ] as const) {
      const before = relativityDirector(ch, reveal - 0.01, locale);
      expect(before).toMatchObject({ shot: 'clock-records', reveal: false });
      expect(relativityDirector(ch, reveal, locale).reveal).toBe(true);
      expect(relativityDirector(ch, reveal - 0.01, locale)).toEqual(before);
    }
    expect(relativityDirector(7, c.west[5], locale).height).toBe(10000);
    expect(relativityDirector(7, c.west[6], locale)).toMatchObject({
      shot: 'clock-model',
      height: 0,
      direction: -1,
    });
  }
  expect(relativityDirector(6, 25, 'zh').reveal).toBe(false);
  expect(relativityDirector(6, 25, 'en').reveal).toBe(true);
  for (const t of [NaN, Infinity, -Infinity])
    expect(JSON.stringify(relativityDirector(t, t))).not.toMatch(/NaN|Infinity|null/);
});
