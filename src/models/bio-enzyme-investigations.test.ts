import { expect, it } from 'vitest';
import {
  energyDensity,
  barrierProbability,
  pathRate,
  reactionPath,
  barrierHeights,
  peroxideReaction,
  thermalTurnover,
  R,
  kelvin,
  damageRate,
  foldedFraction,
  enzymeAssay,
  conditionComparison,
  ionization,
  proteinTrace,
  productiveBinding,
  glucanHydrolysis,
  sucroseSkeleton,
  amylaseDocking,
  glucanCatalyticScene,
  phComparison,
  cellFreeFermentation,
  cagedMeat,
  ureaseEvidence,
  enzymeDirector,
  enzymeDurations,
  thermalConformation,
  chemicalConformation,
} from './bio-enzyme-investigations';
it('integrates the displayed Boltzmann tail to the same crossing probability used by kinetics', () => {
  for (const temp of [5, 25, 90])
    for (const barrier of [9.6, 11.1, 14]) {
      let integral = 0;
      const dx = 0.001;
      for (let e = barrier; e < 60; e += dx) integral += energyDensity(e + dx / 2, temp) * dx;
      expect(integral / barrierProbability(barrier, temp)).toBeCloseTo(1, 6);
    }
});
it('obeys an independent Arrhenius ratio and keeps catalyst endpoints unchanged', () => {
  const a = 25,
    b = 90,
    E = barrierHeights.blank * R * 298.15;
  expect(Math.log(pathRate(b, 14) / pathRate(a, 14))).toBeCloseTo(
    (E / R) * (1 / kelvin(a) - 1 / kelvin(b)),
    10,
  );
  for (const barrier of Object.values(barrierHeights)) {
    expect(reactionPath(0, barrier)).toBe(0);
    expect(reactionPath(1, barrier)).toBe(-3);
    expect(reactionPath(0.5, barrier)).toBe(barrier);
  }
});
it('preserves both hydrogen and oxygen inventories, and a catalyst-independent endpoint', () => {
  for (const mode of ['blank', 'heated', 'iron', 'catalase'] as const)
    for (const time of [0, 1, 10, 5000]) {
      const s = peroxideReaction(time, mode);
      expect(2 * s.substrate + 2 * s.water).toBeCloseTo(2);
      expect(2 * s.substrate + s.water + 2 * s.oxygen).toBeCloseTo(2);
      if (time === 5000) expect(s.oxygen).toBeCloseTo(0.5);
    }
  expect(peroxideReaction(3, 'catalase').oxygen).toBeGreaterThan(
    peroxideReaction(3, 'iron').oxygen,
  );
  expect(peroxideReaction(3, 'catalase', 0).k).toBe(peroxideReaction(3, 'blank').k);
});
it('does not assign a catalyst the heating distribution or consume it as fuel', () => {
  expect(peroxideReaction(1, 'catalase', 3).temperature).toBe(25);
  expect(peroxideReaction(1, 'catalase', 3).k).toBeGreaterThan(peroxideReaction(1, 'catalase').k);
  expect(peroxideReaction(10000, 'catalase', 3).oxygen).toBeCloseTo(0.5);
  expect(thermalTurnover(5)).toBeLessThan(1);
});
it('integrates heat exposure rather than remembering only the maximum temperature', () => {
  const a = foldedFraction([{ temperature: 85, seconds: 10 }]),
    b = foldedFraction([{ temperature: 85, seconds: 120 }]);
  expect(b).toBeLessThan(a);
  expect(
    foldedFraction([
      { temperature: 85, seconds: 20 },
      { temperature: 40, seconds: 30 },
    ]),
  ).toBeCloseTo(Math.exp(-damageRate(85) * 20 - damageRate(40) * 30), 12);
});
it('integrates changing active fraction during the assay, checked by independent numerical quadrature', () => {
  const history = [{ temperature: 85, seconds: 18 }],
    t = 20,
    temp = 60;
  let integral = 0;
  const dt = 0.001;
  for (let s = 0; s < t; s += dt)
    integral += foldedFraction(history) * Math.exp(-damageRate(temp) * (s + dt / 2)) * dt;
  const expected = Math.exp(-0.035 * thermalTurnover(temp) * ionization(7).competent * integral);
  expect(enzymeAssay(t, temp, history).remaining).toBeCloseTo(expected, 7);
});
it('separates pretreatment and fresh-substrate common-temperature assay', () => {
  const states = conditionComparison('recovery', 30);
  expect(states.map((s) => s.assayTemperature)).toEqual([25, 25, 25]);
  expect(states[0].converted).toBeCloseTo(states[1].converted, 2);
  expect(states[2].converted).toBeLessThan(states[0].converted * 0.1);
  for (const s of conditionComparison('recovery', 0)) expect(s.remaining).toBe(1);
});
it('keeps peptide identity and connectivity during unfolding', () => {
  for (const p of [0, 0.25, 0.7, 1]) expect(proteinTrace(p)).toHaveLength(29);
  for (let p = 0; p < 1; p += 0.01)
    proteinTrace(p).forEach((v, i) =>
      expect(
        Math.hypot(v.x - proteinTrace(p + 0.01)[i].x, v.y - proteinTrace(p + 0.01)[i].y),
      ).toBeLessThan(2),
    );
});
it('uses bounded independent protonation fractions without a universal pH optimum', () => {
  expect(ionization(5).aDeprotonated).toBe(0.5);
  expect(ionization(9).bProtonated).toBe(0.5);
  for (const p of [-5, 2, 7, 12, 20]) {
    const s = ionization(p);
    expect(s.aDeprotonated + s.aProtonated).toBeCloseTo(1);
    expect(s.bProtonated + s.bDeprotonated).toBeCloseTo(1);
    expect(s.competent).toBeGreaterThanOrEqual(0);
    expect(s.competent).toBeLessThanOrEqual(1);
  }
  expect(ionization(5, 3, 7).competent).toBeGreaterThan(ionization(7, 3, 7).competent);
});
it('requires matching linkage chemistry and three actual geometrical contacts', () => {
  expect(amylaseDocking(0).productive).toBe(false);
  expect(amylaseDocking(1).productive).toBe(true);
  expect(amylaseDocking(1).contacts).toHaveLength(3);
  expect(amylaseDocking(1).contactCount).toBe(3);
  expect(amylaseDocking(1, 'alpha1-beta2').productive).toBe(false);
  expect(productiveBinding('alpha1-6', [0, 0, 0]).productive).toBe(false);
  expect(productiveBinding('alpha1-4', [0, 0, 9]).productive).toBe(false);
});
it('conserves every displayed reactive atom through net hydrolysis and never adds duplicate OH/H', () => {
  const start = glucanHydrolysis(0),
    end = glucanHydrolysis(1);
  expect(end.atoms.map((a) => a.id)).toEqual(start.atoms.map((a) => a.id));
  expect(end.atoms.filter((a) => a.element === 'H')).toHaveLength(2);
  expect(end.atoms.some((a) => a.label === 'OH')).toBe(false);
  const bonds = end.bonds.filter((b) => (b.opacity ?? 1) > 0.99);
  expect(bonds.some((b) => b.a === 'g0-1' && b.b === 'bridge')).toBe(false);
  expect(bonds.some((b) => b.a === 'bridge' && b.b === 'waterH1')).toBe(true);
  expect(bonds.some((b) => b.a === 'waterO' && b.b === 'g0-1')).toBe(true);
  expect(end.linkedFragments).toBe(2);
});
it('keeps water H/O and rings continuously positioned while only one link is cleaved', () => {
  for (let p = 0; p < 1; p += 0.005) {
    const a = glucanHydrolysis(p),
      b = glucanHydrolysis(p + 0.005);
    a.atoms.forEach((v, i) =>
      expect(Math.hypot(v.x - b.atoms[i].x, v.y - b.atoms[i].y)).toBeLessThan(3),
    );
  }
  expect(sucroseSkeleton().atoms.filter((a) => a.id.startsWith('f')).length).toBe(5);
});
it('keeps classic evidence within its inferential limits and gives urease no gas observable', () => {
  expect(cagedMeat(1).mechanicalAccess).toBe(false);
  expect(cagedMeat(1).fraction).toBeLessThan(cagedMeat(1, false).fraction);
  expect(cellFreeFermentation(10, false).carbonDioxide).toBe(0);
  expect(cellFreeFermentation(10, true, false).ethanol).toBe(0);
  const s = ureaseEvidence(1);
  expect(s.urea + s.carbonEquivalents).toBeCloseTo(1);
  expect(s.ammoniaEquivalents).toBeCloseTo(2 * (1 - s.urea));
  expect(s).not.toHaveProperty('bubbles');
});
it('reconstructs independent chapter shots for direct seeks', () => {
  expect(enzymeDirector(1, 10).shot).toBe('heat-energy');
  expect(enzymeDirector(1, 18).shot).toBe('catalyst-path');
  expect(enzymeDirector(1, 25).shot).toBe('same-endpoint');
  expect(enzymeDirector(6, 14).shot).toBe('protonation');
  expect(enzymeDirector(7, 0).recoveryAssay).toBe(0);
});
it('handles nonfinite energy and invalid contact distances without false productive states', () => {
  expect(energyDensity(NaN)).toBe(0);
  expect(energyDensity(-1)).toBe(0);
  expect(Number.isFinite(barrierProbability(NaN))).toBe(true);
  expect(barrierProbability(-1)).toBe(1);
  expect(productiveBinding('alpha1-4', [-1, 0, 0]).productive).toBe(false);
  for (const value of [NaN, Infinity, -Infinity])
    expect(Number.isFinite(peroxideReaction(value, 'catalase').oxygen)).toBe(true);
});

it('drives representative unfolding and cohort survival from the same exposure hazard', () => {
  const a = thermalConformation(85, 120),
    b = thermalConformation(45, 120);
  expect(a.folded).toBeCloseTo(Math.exp(-a.hazard), 12);
  expect(a.unfolding).toBeGreaterThan(b.unfolding);
  expect(thermalConformation(65, 240).folded).toBeLessThan(thermalConformation(65, 120).folded);
  expect(chemicalConformation(7, 30).unfolding).toBe(0);
  expect(chemicalConformation(11, 30).unfolding).toBeGreaterThan(0);
  expect(conditionComparison('temperature', 30, 120, 65)[2].converted).toBeGreaterThan(
    conditionComparison('temperature', 30, 120, 85)[2].converted,
  );
});

it('uses the same oxygen observation scale and independently matches the derivative of inventory', () => {
  for (const ph of [2, 7, 12]) {
    const t = 2,
      dt = 1e-5,
      a = phComparison(ph, t),
      b = phComparison(ph, t + dt),
      c = phComparison(ph, t - dt);
    expect(a.blankFlux).toBeCloseTo((b.blank - c.blank) / (2 * dt), 7);
    expect(a.enzymeFlux).toBeCloseTo((b.enzyme - c.enzyme) / (2 * dt), 7);
  }
  const extreme = phComparison(12, 2);
  expect(extreme.enzymeFlux / extreme.blankFlux).toBeLessThan(1.1);
});
it('derives every contact endpoint from the rendered atom throughout cleavage and release', () => {
  const docked = glucanCatalyticScene(1, 0, 0);
  expect(docked.contacts.every((c) => c.distance < 1e-10)).toBe(true);
  for (let p = 0; p <= 1; p += 0.02) {
    const state = glucanCatalyticScene(1, p, p);
    for (const c of state.contacts) {
      expect(c.substrate).toEqual(state.atoms.find((a) => a.id === c.atomId));
      expect(c.distance).toBeCloseTo(
        Math.hypot(c.substrate.x - c.site.x, c.substrate.y - c.site.y),
        12,
      );
      if (c.distance >= 8) expect(c.opacity).toBe(0);
    }
  }
  expect(glucanCatalyticScene(1, 1, 1).contacts.every((c) => c.opacity === 0)).toBe(true);
  expect(peroxideReaction(2, 'catalase', 0).oxygen).toBeCloseTo(
    peroxideReaction(2, 'blank').oxygen,
    12,
  );
});

it('keeps tracked water labels distinct during transfer while retaining the O–H pair', () => {
  for (let p = 0; p <= 1; p += 0.002) {
    const a = glucanHydrolysis(p).atoms,
      o = a.find((v) => v.id === 'waterO')!,
      h1 = a.find((v) => v.id === 'waterH1')!,
      h2 = a.find((v) => v.id === 'waterH2')!;
    for (const [x, y] of [
      [o, h1],
      [o, h2],
      [h1, h2],
    ])
      expect(Math.hypot(x.x - y.x, x.y - y.y)).toBeGreaterThan(17);
    expect(Math.hypot(o.x - h2.x, o.y - h2.y)).toBeLessThan(24);
  }
});

it('aligns the measured bilingual evidence cuts while preserving all eight chapter windows', () => {
  expect(enzymeDurations.reduce((a, b) => a + b, 0)).toBe(251);
  expect(enzymeDirector(1, 10.5, 'zh').shot).toBe('heat-energy');
  expect(enzymeDirector(1, 10.5, 'en').shot).toBe('catalyst-path');
  expect(enzymeDirector(1, 21, 'zh').shot).toBe('catalyst-path');
  expect(enzymeDirector(1, 21, 'en').shot).toBe('same-endpoint');
  expect(enzymeDirector(4, 21, 'zh').shot).toBe('sucrose');
  expect(enzymeDirector(4, 21, 'en').shot).toBe('glucan');
  for (const locale of ['zh', 'en'] as const) {
    expect(enzymeDirector(4, 16.5, locale).hydrolysis).toBeGreaterThan(0);
    expect(enzymeDirector(6, 18, locale).shot).toBe('ph-damage');
    expect(enzymeDirector(7, 4, locale).recoveryCommon).toBe(true);
    expect(enzymeDirector(7, 4, locale).recoveryAssay).toBe(0);
    expect(enzymeDirector(7, 12, locale).recoveryAssay).toBe(1);
    expect(enzymeDirector(3, 5.5, locale).proteinEvidence).toBeGreaterThan(0);
    expect(enzymeDirector(3, 5.5, locale).crystal).toBe(0);
    expect(enzymeDirector(0, 8, locale).cage).toBe(1);
  }
});
