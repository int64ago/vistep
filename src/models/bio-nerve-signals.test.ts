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
