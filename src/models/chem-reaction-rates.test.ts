import { it, expect } from 'vitest';
import {
  GAS_ML,
  peroxide,
  marble,
  turbidity,
  zincGas,
  observedRate,
  collision,
  collisionTrial,
  energyProfile,
  syringeGeometry,
} from './chem-reaction-rates';
it('ideal gas benchmark and Zn stoichiometry agree independently', () => {
  expect(GAS_ML).toBeCloseTo(24465.4, 0);
  expect(zincGas(0, 1).endpoint).toBeCloseTo(30, 8);
  expect(zincGas(0, 4).endpoint).toBeCloseTo(7.5, 8);
  expect(zincGas(0, 1).finalMl).toBeCloseTo(zincGas(0, 4).finalMl);
  expect(zincGas(30, 1).volumeMl).toBeCloseTo(10, 8);
  const z = zincGas(30, 1, 0.5);
  expect(z.collected + z.leaked).toBeCloseTo(z.produced, 12);
  expect(zincGas(30, 1, 1).endpoint).toBeNull();
  expect(zincGas(30, 0).volumeMl).toBe(0);
  expect(observedRate('')).toBeNull();
  expect(observedRate('0')).toBeNull();
  expect(observedRate('NaN')).toBeNull();
  expect(observedRate('20')).toBe(0.5);
});
it('temperature and catalyst change speed but not stoichiometric yield; late-time rate can reverse', () => {
  const a = peroxide(10, 20, 'Fe'),
    b = peroxide(10, 50, 'Fe');
  expect(b.oxygen).toBeGreaterThan(a.oxygen);
  expect(a.remaining + 2 * a.oxygen).toBeCloseTo(a.n0, 12);
  expect(peroxide(1e9, 25, 'Fe').oxygen).toBeCloseTo(peroxide(1e9, 25, 'none').oxygen, 12);
  expect(peroxide(1000, 50, 'Fe').rate).toBeLessThan(peroxide(1000, 20, 'Fe').rate);
  expect(peroxide(10, 25, 'Mn').rate).toBe(peroxide(10, 25, 'Fe').rate);
});
it('equal total volume separates initial concentration and optical endpoint assumptions', () => {
  const a = turbidity(0, 2, 25),
    b = turbidity(0, 1, 25);
  expect(a.c0).toBe(0.05);
  expect(b.c0).toBe(0.025);
  expect(a.volumeMl).toBe(b.volumeMl);
  expect(turbidity(a.endpoint!, 2, 25).transmission).toBeCloseTo(0.5, 10);
  expect(b.endpoint!).toBeGreaterThan(a.endpoint!);
  expect(turbidity(1000, 0.2, 25).endpoint).toBeNull();
  expect(turbidity(0, 2, 50).endpoint!).toBeLessThan(a.endpoint!);
});
it('marble acid limitation means total gas is not a speed measurement', () => {
  expect(marble(1e6, 0.1).volume).toBeCloseTo(GAS_ML * 0.0001);
  expect(marble(1e6, 1).volume).toBeCloseTo(GAS_ML * 0.001);
  expect(marble(0, 0.1, 2).initialRate).toBeCloseTo(2 * marble(0, 0.1, 1).initialRate);
});
it('collision preserves atom identities, contacts and continuous trajectories at bond change', () => {
  for (const w of [240, 320, 800])
    for (const oriented of [true, false])
      for (const enough of [true, false])
        for (let n = 0; n <= 100; n++) {
          const c = collision(w, n / 100, enough, oriented);
          expect(c.atoms.map((a) => a.id)).toEqual(['H1', 'I1', 'H2', 'I2']);
          for (const a of c.atoms) {
            expect(a.x - a.r).toBeGreaterThanOrEqual(0);
            expect(a.x + a.r).toBeLessThanOrEqual(w);
          }
        }
  const a = collision(320, 0.45, true, true),
    b = collision(320, 0.450001, true, true);
  a.atoms.forEach((x, i) => {
    expect(Math.abs(x.x - b.atoms[i].x)).toBeLessThan(0.001);
    expect(Math.abs(x.y - b.atoms[i].y)).toBeLessThan(0.001);
  });
  expect(collision(320, 1, true, true).ii).toBe(true);
  expect(collision(320, 1, false, true).hi).toBe(true);
  expect(collision(320, 1, true, false).hi).toBe(true);
});
it('catalysis keeps endpoints and syringe displacement shares its scale', () => {
  for (const c of [true, false]) {
    expect(energyProfile(0, c)).toBeCloseTo(0);
    expect(energyProfile(1, c)).toBeCloseTo(-20);
  }
  expect(energyProfile(0.5, true)).toBeLessThan(energyProfile(0.5, false));
  for (const w of [240, 320, 800]) {
    const g = syringeGeometry(w, 10);
    expect(g.piston).toBe(g.tick10);
    expect(g.x0).toBeGreaterThan(0);
    expect(g.stop + 38).toBeLessThan(w);
  }
});

it('film holds both trial endpoints so the completed iodine molecule remains observable', () => {
  for (const p of [0.43, 0.47, 0.49]) {
    const trial = collisionTrial(p);
    expect(trial.trial).toBe(0);
    expect(collision(320, trial.progress, false, true).hi).toBe(true);
  }
  for (const p of [0.93, 0.96, 0.99]) {
    const trial = collisionTrial(p);
    const final = collision(320, trial.progress, true, true);
    expect(trial.trial).toBe(1);
    expect(final.ii).toBe(true);
    expect(final.radicals).toBe(false);
    expect(final.atoms[3].x - final.atoms[1].x).toBe(24);
  }
});

import {
  thermalTrials,
  encounterWindow,
  opticalCriterion,
  rateFilm,
  RATE_BOOK_EVIDENCE,
  ratePrediction,
} from './chem-reaction-rates';
it('new thermal cases use absolute temperature with fixed identity and threshold, not empirical population counts', () => {
  const cold = thermalTrials(20),
    hot = thermalTrials(50);
  expect(cold.map((a) => a.id)).toEqual(hot.map((a) => a.id));
  cold.forEach((a, i) => {
    expect(hot[i].energy / a.energy).toBeCloseTo(323.15 / 293.15, 12);
    expect(hot[i].threshold).toBe(35);
  });
  expect(cold.filter((a) => a.eligible).length).toBe(2);
  expect(hot.filter((a) => a.eligible).length).toBe(5);
  expect(thermalTrials(50, 0)).toEqual(cold);
});
it('equal selection rule doubles opportunities, not energetic fraction', () => {
  const a = encounterWindow(1, 1),
    b = encounterWindow(2, 1);
  expect([a.arrived, a.effective, b.arrived, b.effective]).toEqual([6, 2, 12, 4]);
  expect(a.fraction).toBe(b.fraction);
  expect(b.events.slice(0, 6).map((e) => e.id)).toEqual(a.events.map((e) => e.id));
  for (const p of [0, 0.1, 0.5, 1]) {
    const x = encounterWindow(2, p);
    expect(x.effective).toBeLessThanOrEqual(x.arrived);
  }
});
it('a finite amount may never reach the same optical endpoint', () => {
  const a = opticalCriterion(0.2, 25);
  expect(a.maximum).toBeCloseTo(0.005);
  expect(a.target).toBeCloseTo(Math.log(2) / 40);
  expect(a.reachable).toBe(false);
  expect(a.time).toBeNull();
  const b = opticalCriterion(1, 25);
  expect(b.time).toBeGreaterThan(0);
  expect(turbidity(b.time!, 1, 25).transmission).toBeCloseTo(0.5);
});
it('all independent macro inputs keep finite outputs at nonfinite and limiting times', () => {
  for (const t of [NaN, Infinity, -Infinity, -1, 0, 1e9])
    for (const c of [NaN, Infinity, -Infinity, 0, 70])
      for (const obj of [peroxide(t, c, 'Fe'), marble(t, c), turbidity(t, c, c), zincGas(t, c, c)])
        for (const v of Object.values(obj)) {
          if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
        }
  expect(RATE_BOOK_EVIDENCE.zinc.endpointMl).toBe(10);
  expect(RATE_BOOK_EVIDENCE.thiosulfate.totalMl).toBe(4);
});
it('measured questions hide answers until the actual answer phrase and hide again on backward seek', () => {
  const timing = {
    zh: [
      [18.85, 23.85],
      [17.35, 21.8],
      [14.5, 20.25],
      [16.55, 20.15],
      [19.45, 23.45],
    ],
    en: [
      [16.95, 21.6],
      [17.25, 21.8],
      [14.05, 19.25],
      [16.2, 19.2],
      [18.85, 22.2],
    ],
  } as const;
  for (const lang of ['zh', 'en'] as const)
    for (let ch = 0; ch < 5; ch++) {
      const [question, answer] = timing[lang][ch];
      expect(answer - question).toBeGreaterThanOrEqual(3);
      expect(rateFilm(ch, question, lang).question).toBe(true);
      expect(rateFilm(ch, answer - 0.01, lang).reveal).toBe(false);
      expect(rateFilm(ch, answer, lang).reveal).toBe(true);
      expect(rateFilm(ch, question, lang).reveal).toBe(false);
    }
});
it('the thiosulfate target returns for the spoken cloudiness evidence; catalyst tubes stay for the complete comparison', () => {
  for (const lang of ['zh', 'en'] as const) {
    expect(rateFilm(2, 7.5, lang).shot).toBe('encounters');
    expect(rateFilm(2, 11, lang).shot).toBe('observation');
    expect(rateFilm(2, 14, lang).progress).toBe(1);
    expect(rateFilm(4, 11.9, lang).shot).toBe('observation');
    expect(rateFilm(4, 14, lang).shot).toBe('pathway');
  }
});
it('tenfold dilution refers to the same diluted one-milliliter stock sample and preserves its solute budget', () => {
  const stockM = 0.1,
    originalStockLiters = 1e-3,
    totalLiters = 4e-3;
  const originalMoles = stockM * originalStockLiters;
  const next = ratePrediction(2);
  expect(next.kind).toBe('too-dilute');
  if ('maximum' in next) {
    expect(next.maximum).toBeCloseTo(originalMoles / 10 / totalLiters, 12);
    expect(next.maximum * totalLiters * 10).toBeCloseTo(originalMoles, 12);
    expect(next.maximum).toBeCloseTo(0.0025, 12);
    expect(next.reachable).toBe(false);
  }
});
it('retained collision words have an actual radical intermediate and a completed iodine endpoint in both languages', () => {
  for (const [lang, first, radical, joined] of [
    ['zh', 5.9, 11.0, 14.0],
    ['en', 7.0, 12.7, 15.3],
  ] as const) {
    const a = rateFilm(8, first, lang),
      b = rateFilm(8, radical, lang),
      c = rateFilm(8, joined, lang);
    expect(a.trial).toBe(0);
    expect(collision(320, a.trialProgress, false, true).hi).toBe(true);
    expect(b.trial).toBe(1);
    expect(collision(320, b.trialProgress, true, true).radicals).toBe(true);
    expect(collision(320, c.trialProgress, true, true).ii).toBe(true);
  }
});
it('director handles invalid seeks and chapter limits without nonfinite state', () => {
  for (const ch of [NaN, -Infinity, Infinity, -1, 11, 0, 10])
    for (const t of [NaN, -Infinity, Infinity, -1, 0, 90]) {
      const f = rateFilm(ch, t);
      for (const v of Object.values(f))
        if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
    }
});
