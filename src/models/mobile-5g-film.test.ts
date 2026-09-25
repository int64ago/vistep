import { describe, expect, it } from 'vitest';
import { M5G_VIEWS, boxStages, m5gShot } from './mobile-5g-film';
import { lteEquivalentRate, nrPeakRate } from './mobile-5g';

describe('mobile-5g film director', () => {
  it('maps each chapter to its own instrument and is deterministic under seeking', () => {
    M5G_VIEWS.forEach((view, c) => expect(m5gShot(c, 0.5).view).toBe(view));
    for (const p of [0, 0.13, 0.5, 0.77, 1]) expect(m5gShot(3, p)).toEqual(m5gShot(3, p));
    expect(m5gShot(-3, -1).view).toBe('box');
    expect(m5gShot(40, 9).view).toBe('share');
    expect(() => m5gShot(NaN, 0)).toThrow(RangeError);
  });
  it('rate-box stages change one factor at a time and multiply to the full ratio', () => {
    const s = boxStages();
    expect(s[0].rate).toBeCloseTo(
      lteEquivalentRate({ bandwidthMHz: 20, layers: 2, modulation: 6 }),
      3,
    );
    expect(s[3].rate).toBeCloseTo(
      nrPeakRate({ bandwidthMHz: 100, scsKHz: 30, layers: 4, modulation: 8 }),
      3,
    );
    expect(s[1].factor * s[2].factor * s[3].factor).toBeCloseTo(s[3].rate / s[0].rate, 9);
    expect(s[2].factor).toBeCloseTo(8 / 6, 12);
    expect(s[3].factor).toBeCloseTo(2, 12);
    expect(s[1].bandwidth! * s[1].overhead!).toBeCloseTo(s[1].factor, 12);
    expect(s[1].bandwidth).toBeCloseTo((273 * 2) / 100, 12);
    // one morph at a time, in order: width, then depth, then height
    for (let p = 0; p <= 1; p += 0.01) {
      const b = m5gShot(0, p).box;
      if (b.depth > 0) expect(b.width).toBe(1);
      if (b.height > 0) expect(b.depth).toBe(1);
    }
    expect(m5gShot(0, 0).box).toMatchObject({ fill: 1, width: 0, depth: 0, height: 0 });
    expect(m5gShot(0, 1).box).toMatchObject({ width: 1, depth: 1, height: 1 });
  });
  it('constellation chapter lowers SNR then falls back to a modulation that the SNR supports', () => {
    expect(m5gShot(2, 0).qam.modulation).toBe(2);
    expect(m5gShot(2, 0.5).qam.modulation).toBe(8);
    expect(m5gShot(2, 0.2).qam.modulation).toBe(2);
    expect(m5gShot(2, 0.45).qam.snrDb).toBe(32);
    expect(m5gShot(2, 0.8).qam.snrDb).toBeCloseTo(16, 6);
    expect(m5gShot(2, 0.95).qam.modulation).toBe(4);
  });
  it('beam steers toward the target and grows from one to sixteen elements', () => {
    expect(m5gShot(5, 0).beam.elements).toBe(1);
    expect(m5gShot(5, 0.3).beam.elements).toBe(4);
    expect(m5gShot(5, 0.75).beam.elements).toBe(16);
    expect(m5gShot(5, 1).beam.elements).toBe(8); // one row of the 8 × 8 panel
    expect(m5gShot(5, 1).beam.steerDeg).toBeCloseTo(30, 9);
    expect(m5gShot(5, 1).beam.target).toBeCloseTo(30, 9);
  });
  it('sharing chapter ends with ten users at a cell-edge SNR', () => {
    const s = m5gShot(7, 1).share;
    expect(s.users).toBe(10);
    expect(s.snrDb).toBeCloseTo(12, 9);
    expect(m5gShot(7, 0).share.users).toBe(1);
  });
});
