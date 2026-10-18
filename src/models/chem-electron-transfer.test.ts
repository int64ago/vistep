import { describe, it, expect } from 'vitest';
import {
  electronLedger,
  transferPosition,
  bondDensity,
  electronDirector,
} from './chem-electron-transfer';
describe('electron allocation', () => {
  it('preserves eight tracked valence electrons and neutral total charge', () => {
    for (const type of ['ionic', 'polar'] as const)
      for (const formed of [false, true]) {
        const s = electronLedger(type, formed);
        expect(s.assignedLeft + s.assignedRight).toBe(8);
        expect(s.leftOxidation + s.rightOxidation).toBe(0);
      }
  });
  it('distinguishes covalent sharing from ionic transfer despite equal formal oxidation states', () => {
    const ionic = electronLedger('ionic', true),
      polar = electronLedger('polar', true);
    expect(polar.sharedPair).toBe(2);
    expect(ionic.sharedPair).toBe(0);
    expect(polar.leftOxidation).toBe(1);
    expect(polar.rightOxidation).toBe(-1);
  });
  it('preserves tracked electron endpoints and a bounded schematic cloud', () => {
    expect(transferPosition(0).x).toBe(163);
    expect(transferPosition(1).x).toBe(402);
    expect(bondDensity(0.64, 1)).toBe(1);
    expect(bondDensity(0.75, 1)).toBeGreaterThan(bondDensity(0.25, 1));
    expect(electronDirector(2, 0.5).bond).toBe('polar');
  });
});

import {
  ionicAllocation,
  ionicGeometry,
  ironCopperAccount,
  ironCopperTransfer,
  ironCopperGeometry,
  electronFilm,
  ELECTRON_MEASURED_EVENTS,
} from './chem-electron-transfer';
describe('whole-reaction counts and an independent iron–copper prediction', () => {
  it('keeps all16 valence units and totalcharge0 through each twoNa/twoCl transfer', () => {
    for (let i = 0; i <= 100; i++) {
      const s = ionicAllocation(i / 100, 2);
      expect(s.donorElectrons + s.recipientElectrons + s.ledgerElectrons).toBe(16);
      expect(s.chargeIncludingLedger).toBe(0);
      const g = ionicGeometry(256, i / 100, 2, true);
      expect(g.rows).toHaveLength(2);
      expect(g.rows.reduce((n, r) => n + r.chlorine.length + 1, 0)).toBe(16);
      for (const r of g.rows) {
        expect(r.moving.x).toBeGreaterThan(0);
        expect(r.moving.x).toBeLessThan(256);
        expect(r.moving.y).toBeGreaterThan(0);
      }
    }
  });
  it('predicts onecopper from oneiron and twocopperII, rather than matching oneelectron to eachcopper', () => {
    const s = ironCopperAccount(1, 2);
    expect(s).toMatchObject({
      ironII: 1,
      ironRemaining: 0,
      copperMetal: 1,
      copperII: 1,
      electronsLost: 2,
      electronsGained: 2,
    });
    expect(ironCopperAccount(2, 1)).toMatchObject({
      ironRemaining: 1,
      copperMetal: 1,
      copperII: 0,
      electronsLost: 2,
    });
  });
  it('conserves Fe,Cu,charge and a paired electron ledger without inventingFeI orCuI', () => {
    for (let fe = 0; fe <= 2; fe++)
      for (let cu = 0; cu <= 2; cu++)
        for (let i = 0; i <= 50; i++) {
          const s = ironCopperTransfer(fe, cu, i / 50),
            g = ironCopperGeometry(256, fe, cu, i / 50, true);
          expect(s.ironII + s.ironRemaining).toBe(fe);
          expect(s.copperII + s.copperMetal).toBe(cu);
          expect(s.chargeIncludingLedgerAndSulfate).toBe(0);
          expect(2 * s.ironII).toBe(2 * s.copperMetal + s.ledgerElectrons);
          for (const a of g.atoms) expect([0, 2]).toContain(a.charge);
          expect(g.atoms.filter((a) => a.kind === 'Cu' && a.charge === 0)).toHaveLength(
            s.copperMetal,
          );
        }
  });
  it('preserves the firstreduced copper identity when the secondiron is added', () => {
    const before = ironCopperGeometry(256, 1, 2, 1),
      after = ironCopperGeometry(256, 2, 2, 0.5);
    expect(before.atoms.find((a) => a.id === 'Cu-0')?.charge).toBe(0);
    expect(after.atoms.find((a) => a.id === 'Cu-0')?.charge).toBe(0);
    expect(after.atoms.find((a) => a.id === 'Cu-1')?.charge).toBe(2);
    expect(after.state.rows[1].phase).toBe('donor');
  });
  it('handles finite and nonfinite boundaries without NaN or phantomreactions', () => {
    for (const p of [-1, 0, 1, 2, NaN, Infinity, -Infinity]) {
      for (const v of Object.values(transferPosition(p))) expect(Number.isFinite(v)).toBe(true);
      expect(Number.isFinite(bondDensity(NaN, p))).toBe(true);
      const g = ionicGeometry(NaN, p, NaN, true);
      expect(g.width).toBe(240);
      expect(g.state.totalElectrons).toBe(8);
      const s = ironCopperTransfer(NaN, 2, p);
      expect(s.copperMetal).toBe(0);
      expect(s.ledgerElectrons).toBe(0);
    }
  });
  it('holds both spoken predictions and preserves copper identity when the second iron arrives', () => {
    for (const locale of ['zh', 'en'] as const) {
      const events = ELECTRON_MEASURED_EVENTS[locale];
      // Both spoken questions end after 17.8 s. Neither answer may appear at 17.5 s.
      expect(electronFilm(3, 17.5, locale)).toMatchObject({
        predictReveal: false,
        progress: 0,
        iron: 1,
      });
      expect(electronFilm(3, 23, locale)).toMatchObject({
        predictReveal: true,
        progress: 1,
        iron: 1,
      });
      const added = electronFilm(3, events.secondIron, locale);
      expect(added).toMatchObject({ predictReveal: true, progress: 0.5, iron: 2 });
      const picture = ironCopperGeometry(256, added.iron, added.copper, added.progress);
      expect(picture.atoms.find((a) => a.id === 'Cu-0')?.charge).toBe(0);
      expect(picture.atoms.find((a) => a.id === 'Cu-1')?.charge).toBe(2);
      expect(electronFilm(3, 29, locale)).toMatchObject({ progress: 1, iron: 2 });
    }
  });
  it('keeps measured cue references visible without chapter-duration proportional timing', () => {
    expect(electronFilm(0, 6.8, 'zh').progress).toBeGreaterThan(0);
    expect(electronFilm(0, 6.8, 'en').progress).toBe(0);
    for (const locale of ['zh', 'en'] as const) {
      expect(electronFilm(1, 8, locale).progress).toBe(0);
      expect(electronFilm(1, 16, locale).progress).toBe(1);
      expect(electronFilm(2, 9, locale)).toMatchObject({ progress: 1, formal: false });
      expect(electronFilm(2, 13, locale)).toMatchObject({ progress: 1, formal: true });
      for (const t of [NaN, Infinity, -Infinity]) {
        expect(electronFilm(3, t, locale)).toMatchObject({ progress: 0, iron: 1 });
      }
    }
  });
});
