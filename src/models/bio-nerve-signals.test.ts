import { describe, it, expect } from 'vitest';
import {
  nerveSurface,
  nerveRecordingTime,
  synapseState,
  bioelectricEvidence,
} from './bio-nerve-signals';
describe('neural evidence models', () => {
  it('carries one excitation through the recording chapters without restarting', () => {
    expect(nerveRecordingTime(0, 1)).toBe(nerveRecordingTime(1, 0));
    expect(nerveSurface(nerveRecordingTime(0, 1.75 / 2.25)).difference).toBeLessThan(-11.9);
    expect(nerveSurface(nerveRecordingTime(1, 0.5 / 3.75)).difference).toBeGreaterThan(11.9);
  });
  it('derives opposite electrode deflections from a single traveling pulse', () => {
    const a = nerveSurface(35 / 20),
      b = nerveSurface(55 / 20);
    expect(a.atA).toBe(-12);
    expect(a.difference).toBeLessThan(-11.9);
    expect(b.difference).toBeGreaterThan(11.9);
    expect((b.b - b.a) / b.speed).toBe(1);
    expect(nerveSurface(2, 20, 0).difference).toBe(0);
  });
  it('changes delay rather than amplitude when conduction speed changes', () => {
    expect(nerveSurface(35 / 10, 10).difference).toBeCloseTo(
      nerveSurface(35 / 20, 20).difference,
      10,
    );
    expect(nerveSurface(0).difference).toBeCloseTo(0, 8);
  });
  it('separates transmitter availability from receptor response', () => {
    expect(synapseState(0.1).amount).toBe(0);
    expect(synapseState(0.3, false).voltage).toBe(-70);
    expect(synapseState(0.5, true, false).atReceptor).toBeGreaterThan(0);
    expect(synapseState(0.5, true, false).voltage).toBe(-70);
    expect(synapseState(1).bound).toBeLessThan(synapseState(0.5).bound);
  });
  it('opens sodium entry before potassium exit in either propagation direction', () => {
    for (const reverse of [false, true]) {
      const samples = Array.from({ length: 801 }, (_, i) => nerveSurface(i / 100, 20, 20, reverse));
      const peak = (f: 'sodiumEntry' | 'potassiumExit') =>
        samples.reduce((best, s) => (s[f](35) > best[f](35) ? s : best)).timeMs;
      expect(peak('potassiumExit') - peak('sodiumEntry')).toBeCloseTo(0.45, 2);
    }
  });
  it('preserves all 18 identities from vesicle through fusion pore to extracellular receptors', () => {
    const frames = Array.from({ length: 1001 }, (_, i) => synapseState(i / 1000));
    for (const frame of frames) {
      expect(frame.molecules.map((m) => m.id)).toEqual(Array.from({ length: 18 }, (_, i) => i));
      for (const m of frame.molecules) {
        expect(m.y).toBeLessThanOrEqual(205);
        if (Math.abs(m.y - 165) < 1) {
          expect(frame.vesicles[m.vesicle].fused).toBe(true);
          expect(Math.abs(m.offset)).toBeLessThan(frame.vesicles[m.vesicle].poreHalfWidth);
        }
        if (m.stage === 'vesicle') {
          expect(Math.hypot(m.offset, m.y - frame.vesicles[m.vesicle].y)).toBeLessThanOrEqual(
            5.000001,
          );
        }
      }
    }
    for (let i = 1; i < frames.length; i++)
      for (let j = 0; j < 18; j++) {
        const a = frames[i - 1].molecules[j],
          b = frames[i].molecules[j];
        expect(Math.hypot(a.offset - b.offset, a.y - b.y)).toBeLessThan(0.5);
      }
    expect(synapseState(0.18).vesicles[0].y + 13).toBe(165);
    expect(synapseState(0.25).vesicles[0].poreHalfWidth).toBeGreaterThan(10);
    expect(
      synapseState(1, false).molecules.every((m) => m.opacity === 1 && m.stage === 'vesicle'),
    ).toBe(true);
  });
  it('does not treat a metal bridge as proof of a uniquely biological source', () => {
    expect(bioelectricEvidence('metal', 0.5).inference).toBe('ambiguous');
    expect(bioelectricEvidence('tissue', 0.5).contraction).toBeGreaterThan(0.99);
    expect(bioelectricEvidence('broken', 0.5).contraction).toBe(0);
  });
});

import {
  membraneCharge,
  membraneChargeStep,
  membraneConductances,
  membraneMarkers,
  capacitiveIonFraction,
  nerveDirector,
} from './bio-nerve-signals';
describe('local capacitive membrane teaching patch', () => {
  it('has an independent analytic constant-conductance benchmark', () => {
    const s = membraneChargeStep(-70, 1, 2, 0, 1);
    expect(s.voltage).toBeCloseTo(60 - 130 * Math.exp(-2), 10);
    expect(s.sodiumIn).toBeCloseTo(s.voltage + 70, 10);
    expect(s.potassiumOut).toBe(0);
    expect(membraneChargeStep(-70, 2, 0, 0).voltage).toBe(-70);
  });
  it('derives voltage from conserved inner/outer charge in every intervention', () => {
    for (const sodium of [false, true])
      for (const potassium of [false, true])
        for (const capacitance of [0.5, 1, 2])
          for (let i = 0; i <= 60; i++) {
            const q = membraneCharge(i / 10, { sodium, potassium, capacitance });
            expect(q.insideCharge + q.outsideCharge).toBeCloseTo(0, 10);
            expect(q.voltage).toBeCloseTo(q.insideCharge / capacitance, 10);
            expect(q.deltaCharge).toBeCloseTo(q.sodiumIn - q.potassiumOut, 10);
            expect(q.voltage).toBeGreaterThanOrEqual(-90 - 1e-9);
            expect(q.voltage).toBeLessThanOrEqual(60 + 1e-9);
            if (!sodium) expect(q.sodiumIn).toBe(0);
            if (!potassium) expect(q.potassiumOut).toBe(0);
          }
  });
  it('changes the trace when permeability or capacitance changes rather than replaying one wave', () => {
    expect(membraneCharge(0).voltage).toBe(-70);
    expect(membraneCharge(1.4).voltage).toBeGreaterThan(30);
    expect(membraneCharge(6).voltage).toBeGreaterThan(-73);
    expect(membraneCharge(1.4, { sodium: false }).voltage).toBeLessThan(-70);
    expect(membraneCharge(6, { potassium: false }).voltage).toBeGreaterThan(0);
    expect(membraneCharge(1, { capacitance: 2 }).voltage).toBeLessThan(membraneCharge(1).voltage);
    expect(membraneCharge(6, { sodium: false, potassium: false }).voltage).toBe(-70);
  });
  it('preserves selected ion identity and uses each actual channel path', () => {
    let prior = membraneMarkers(membraneCharge(0), 280);
    for (let i = 1; i <= 600; i++) {
      const state = membraneCharge(i / 100),
        markers = membraneMarkers(state, 280);
      expect(markers.map((m) => m.id)).toEqual(['Na-selected', 'K-selected']);
      markers.forEach((m, j) => {
        expect(m.x).toBeCloseTo(280 * (j === 0 ? 0.32 : 0.68));
        expect(Math.abs(m.y - prior[j].y)).toBeLessThan(8);
        expect(m.progress).toBeGreaterThanOrEqual(prior[j].progress);
      });
      prior = markers;
    }
    expect(membraneMarkers(membraneCharge(6, { sodium: false }), 280)[0].progress).toBe(0);
  });
  it('checks small net charge against an independently defined reservoir', () => {
    const q = capacitiveIonFraction();
    expect(q.capacitanceFarad).toBeCloseTo(12.566370614e-12, 20);
    expect(q.chargeCoulomb).toBeCloseTo(1.2566370614e-12, 20);
    expect(q.fraction).toBeCloseTo(2.072853931e-5, 13);
    expect(capacitiveIonFraction(20).fraction).toBeCloseTo(q.fraction / 2, 13);
  });
  it('keeps finite outputs for clamped limits and null stimulation paths', () => {
    for (const t of [NaN, -10, Infinity, 1e9]) {
      const s = membraneCharge(t, { capacitance: NaN });
      expect(Object.values(s).every(Number.isFinite)).toBe(true);
    }
    expect(membraneConductances(0.2).sodiumGate).toBe(0);
  });
  it('aligns retained recordings without discontinuously restarting the surface pulse', () => {
    expect(nerveDirector(0, 22).surfaceTime).toBe(nerveDirector(1, 0).surfaceTime);
    for (const l of ['zh', 'en'] as const) {
      expect(nerveDirector(2, 3, l).membraneTime).toBe(0);
      expect(nerveDirector(2, 14, l).membraneTime).toBe(6);
      expect(nerveDirector(3, 22, l).synapseProgress).toBe(nerveDirector(4, 0, l).synapseProgress);
      expect(nerveDirector(4, 16, l).receptorCounterexample).toBe(true);
    }
  });
});

it('retains a finite zero-scale limit when the exact step exponent underflows', () => {
  const q = membraneChargeStep(-70, Number.MIN_VALUE, 0.001, 0.001);
  expect(Object.values(q).every(Number.isFinite)).toBe(true);
  expect(q.voltage).toBe(-70);
});
