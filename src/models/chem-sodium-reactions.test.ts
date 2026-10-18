import { describe, it, expect } from 'vitest';
import {
  alkaliWater,
  peroxideWater,
  immersedSphere,
  sodiumDirector,
} from './chem-sodium-reactions';
describe('alkali reaction bookkeeping', () => {
  it('conserves mass for both alkali metals at partial extent', () => {
    for (const metal of ['Na', 'K'] as const)
      for (const x of [0, 0.25, 1]) {
        const s = alkaliWater(x, metal),
          initial = alkaliWater(0, metal).metalMass;
        expect(s.metalMass + s.hydroxideMass + s.hydrogenMass).toBeCloseTo(
          initial + s.waterConsumed,
          10,
        );
      }
  });
  it('keeps hydrogen and oxygen tests distinct', () => {
    expect(alkaliWater(1).hydrogenMoles).toBe(0.5);
    expect(alkaliWater(1).hydroxideMoles).toBe(1);
    expect(peroxideWater(1).oxygenMoles).toBe(0.5);
    expect(peroxideWater(1).hydroxideMoles).toBe(2);
  });
  it('uses displaced volume rather than arbitrary half-submergence', () => {
    expect(immersedSphere(0.5)).toBeCloseTo(0.5, 12);
    const z = immersedSphere(0.97) * 2;
    expect((3 * z * z - z * z * z) / 4).toBeCloseTo(0.97, 10);
    expect(immersedSphere(1)).toBeCloseTo(1, 7);
    expect(immersedSphere(0)).toBeCloseTo(0, 10);
  });
  it('retains zero and full-reaction boundaries and deterministic chapters', () => {
    expect(alkaliWater(0).hydrogenMoles).toBe(0);
    expect(alkaliWater(1).radiusFraction).toBe(0);
    expect(sodiumDirector(5, 0.1).extent).toBe(1);
    expect(sodiumDirector(0, 0.3).oxidation).toBe(0);
  });
});

import {
  sodiumClamp,
  surfaceExposure,
  oxidationAccount,
  sodiumWaterAccount,
  waterAtomGeometry,
  gasEscape,
  dropletGeometry,
  sodiumFilm,
  ALKALI_ATOMS,
  alkaliHydrogen,
} from './chem-sodium-reactions';
describe('causal sodium accounts and independent counterexamples', () => {
  it('conserves every element and net charge for three chemically different water reactions', () => {
    for (const form of ['metal', 'oxide', 'peroxide'] as const)
      for (const n of [0, 2, 4, 7.3])
        for (const x of [0, 0.13, 0.5, 1]) {
          const a = sodiumWaterAccount(form, n, x);
          expect(a.remainingNa + a.aqueousSodium).toBeCloseTo(a.totals.Na, 12);
          expect(a.remainingSolidO + a.remainingWater + a.hydroxide + 2 * a.oxygen).toBeCloseTo(
            a.totals.O,
            12,
          );
          expect(2 * a.remainingWater + a.hydroxide + 2 * a.hydrogen).toBeCloseTo(a.totals.H, 12);
          expect(a.aqueousSodium - a.hydroxide).toBe(0);
          expect(a.lostElectrons).toBe(a.gainedElectrons);
        }
  });
  it('tests the oxide no-gas counterexample on the same four-sodium basis', () => {
    expect(sodiumWaterAccount('metal', 4)).toMatchObject({ hydroxide: 4, hydrogen: 2, oxygen: 0 });
    expect(sodiumWaterAccount('oxide', 4)).toMatchObject({
      hydroxide: 4,
      hydrogen: 0,
      oxygen: 0,
      lostElectrons: 0,
    });
    expect(sodiumWaterAccount('peroxide', 4)).toMatchObject({
      hydroxide: 4,
      hydrogen: 0,
      oxygen: 1,
      lostElectrons: 2,
    });
    expect(sodiumWaterAccount('metal', 4, 1, false)).toMatchObject({
      hydrogen: 0,
      initialWater: 0,
      remainingWater: 0,
      totals: { Na: 4, O: 0, H: 0 },
    });
    expect(sodiumWaterAccount('peroxide', 4, 0).totalSodiumI).toBe(4);
    expect(sodiumWaterAccount('metal', 4, 0).totalSodiumI).toBe(0);
  });
  it('needs twice as much oxygen for peroxide without changing sodium electron loss', () => {
    const oxide = oxidationAccount('oxide', 4),
      peroxide = oxidationAccount('peroxide', 4);
    expect(oxide).toMatchObject({
      oxygenMolecules: 1,
      oxygenAtoms: 2,
      oxygenState: -2,
      electronsLost: 4,
      electronsGained: 4,
    });
    expect(peroxide).toMatchObject({
      oxygenMolecules: 2,
      oxygenAtoms: 4,
      oxygenState: -1,
      electronsLost: 4,
      electronsGained: 4,
    });
  });
  it('keeps complete atom identities during water rearrangements including all water oxygen', () => {
    for (const kind of ['metal', 'oxide', 'peroxide'] as const)
      for (const w of [240, 256, 740])
        for (let i = 0; i <= 20; i++) {
          const g = waterAtomGeometry(kind, w, i / 20);
          expect(new Set(g.atoms.map((a) => a.id)).size).toBe(g.atoms.length);
          for (const element of ['Na', 'O', 'H'] as const)
            expect(g.atoms.filter((a) => a.element === element).length).toBe(g.totals[element]);
          for (const a of g.atoms) {
            expect(a.x).toBeGreaterThan(0);
            expect(a.x).toBeLessThanOrEqual(w);
            expect(a.y).toBeLessThan(g.height);
          }
          expect(
            g.atoms.find(
              (a) =>
                a.id ===
                (kind === 'metal' ? 'water-H-0' : kind === 'oxide' ? 'oxide-O' : 'peroxide-O-0'),
            )?.tracked,
          ).toBe(true);
        }
    const g = waterAtomGeometry('peroxide', 256, 1);
    expect(g.totals).toEqual({ Na: 4, O: 6, H: 4 });
    expect(g.bonds.filter((b) => b.opacity === 1)).toHaveLength(5);
  });
  it('oxygen exclusion stops new oxidation without removing a previous layer', () => {
    expect(surfaceExposure(0.4, false, 0.5)).toBe(0.4);
    expect(surfaceExposure(0.4, true, 0.5)).toBeCloseTo(0.9);
    expect(surfaceExposure(0.9, true, 1)).toBe(1);
  });
  it('conserves displaced volume and separates liquid bubbles from escaped gas', () => {
    const d = dropletGeometry(256, 0.3);
    const h = (d.y + d.radius - d.level) / d.radius;
    expect((3 * h * h - h * h * h) / 4).toBeCloseTo(0.97, 10);
    expect(dropletGeometry(256, 1).radius).toBe(0);
    for (let i = 0; i <= 100; i++) {
      const b = gasEscape(i / 100, 80, 160);
      if (b.phase === 'liquid') expect(b.y).toBeGreaterThanOrEqual(80);
      else expect(b.y).toBeLessThan(80);
    }
  });
  it('keeps gas-atom evidence separate from equal-mole net hydrogen predictions', () => {
    expect(ALKALI_ATOMS.map((a) => a.ionizationEV)).toEqual([5.391719, 5.139076, 4.3406633]);
    for (const atom of ALKALI_ATOMS) expect(atom.shells.at(-1)).toBe(1);
    expect(alkaliHydrogen(2)).toBe(1);
  });
  it('has finite states for malformed numeric input and delays prediction reveals', () => {
    for (const bad of [NaN, Infinity, -Infinity, -1, 0.5, 99]) {
      expect(Number.isFinite(sodiumClamp(bad))).toBe(true);
      expect(sodiumDirector(bad, bad).view).toBeDefined();
      expect(Number.isFinite(alkaliWater(bad).radiusFraction)).toBe(true);
      expect(Number.isFinite(immersedSphere(bad))).toBe(true);
      expect(sodiumFilm(bad, bad).beat).toBeDefined();
    }
    expect(sodiumFilm(1, 20.3).reveal).toBe(false);
    expect(sodiumFilm(1, 30).reveal).toBe(true);
    expect(sodiumFilm(5, 9).beat).toBe('predict');
    expect(sodiumFilm(5, 9).reveal).toBe(false);
  });
});

import { oxidationGeometry } from './chem-sodium-reactions';
it('keeps four distinct electron markers and the same O identities across oxygen-pair allocation', () => {
  for (const form of ['oxide', 'peroxide'] as const)
    for (const p of [0, 0.5, 1]) {
      const g = oxidationGeometry(form, 256, p);
      expect(g.oxygen).toHaveLength(form === 'oxide' ? 2 : 4);
      expect(g.electrons).toHaveLength(4);
      expect(new Set(g.electrons.map((e) => `${e.x.toFixed(5)},${e.y.toFixed(5)}`)).size).toBe(4);
      expect(g.account.electronsLost).toBe(g.electrons.length);
    }
  expect(oxidationGeometry('oxide', 256, 0).pairOpacity).toBe(1);
  expect(oxidationGeometry('oxide', 256, 1).pairOpacity).toBe(0);
  expect(oxidationGeometry('peroxide', 256, 1).pairOpacity).toBe(1);
});

import { SODIUM_MEASURED_EVENTS } from './chem-sodium-reactions';
it('reconstructs measured locale cuts and gives predictions a visible interval', () => {
  for (const locale of ['zh', 'en'] as const) {
    const e = SODIUM_MEASURED_EVENTS[locale];
    expect(sodiumFilm(1, e.oxygenQuestion, locale).reveal).toBe(false);
    expect(sodiumFilm(1, e.oxygenReveal, locale).reveal).toBe(true);
    expect(sodiumFilm(3, e.hydrogenTransfer[0], locale).transfer).toBe(0);
    expect(sodiumFilm(3, e.hydrogenTransfer[1], locale).transfer).toBe(1);
    expect(sodiumFilm(3, e.indicator, locale).beat).toBe('evidence');
    expect(sodiumFilm(6, 1, locale).beat).toBe('shells');
    expect(sodiumFilm(6, e.potassiumBurn, locale).beat).toBe('burn');
    expect(sodiumFilm(7, e.equalMoles, locale).reveal).toBe(false);
    expect(sodiumFilm(7, e.hydrogenReveal, locale).reveal).toBe(true);
  }
});
it('uses each represented shape for buoyancy at equal metal volume', () => {
  for (const metal of ['Na', 'K'] as const) {
    const s = dropletGeometry(256, 0, metal, 'sphere'),
      c = dropletGeometry(256, 0, metal, 'cube');
    expect(Math.pow(2 * c.radius, 3)).toBeCloseTo((4 / 3) * Math.PI * s.radius ** 3, 8);
    expect((c.y + c.radius - c.level) / (2 * c.radius)).toBeCloseTo(
      metal === 'Na' ? 0.97 : 0.89,
      10,
    );
  }
});

it('keeps the traced oxygen pair together when its measured phrase completes before the hydroxide phrase', () => {
  const half = waterAtomGeometry('peroxide', 260, 0.53),
    end = waterAtomGeometry('peroxide', 260, 1);
  expect(half.gasComplete).toBe(true);
  expect(half.complete).toBe(false);
  for (const id of ['peroxide-O-0', 'peroxide-O-1'])
    expect(half.atoms.find((a) => a.id === id)).toEqual(end.atoms.find((a) => a.id === id));
  expect(half.bonds.filter((b) => b.a.id === 'peroxide-O-0' && b.opacity === 1)).toHaveLength(1);
  expect(half.atoms).toHaveLength(14);
});
