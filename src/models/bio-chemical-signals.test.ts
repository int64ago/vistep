import { describe, it, expect } from 'vitest';
import {
  heartTransfer,
  heartFilmCondition,
  secretinEvidence,
  heartTransferMarkers,
  signalPathPoint,
  secretinMarkerPhases,
} from './bio-chemical-signals';
describe('chemical signaling evidence', () => {
  it('directs two distinct negative controls in the final heart chapter', () => {
    const noTransfer = heartFilmCondition(2, 0.4),
      noStim = heartFilmCondition(2, 0.9);
    expect(noTransfer).toMatchObject({ stimulated: true, transferred: false });
    expect(noStim).toMatchObject({ stimulated: false, transferred: true });
    expect(heartFilmCondition(2, 1).progress).toBe(1);
    const a = heartTransfer(noTransfer.progress, noTransfer.stimulated, noTransfer.transferred),
      b = heartTransfer(noStim.progress, noStim.stimulated, noStim.transferred);
    expect(a.rateA).toBeLessThan(1);
    expect(a.rateB).toBe(1);
    expect(a.moved).toBe(0);
    expect(b.rateA).toBe(1);
    expect(b.rateB).toBe(1);
    expect(b.moved).toBeGreaterThan(0);
  });

  it('accounts for delayed arrival and keeps a fixed cohort on the connected route', () => {
    expect(heartTransfer(0.46).amountB).toBe(0);
    expect(heartTransfer(0.46).amountPath).toBeGreaterThan(0);
    const path = [
      { x: 0, y: 210 },
      { x: 0, y: 49 },
      { x: 100, y: 49 },
      { x: 100, y: 210 },
    ];
    expect(signalPathPoint(path, 0)).toEqual(path[0]);
    expect(signalPathPoint(path, 1)).toEqual(path[3]);
    for (let p = 0; p <= 1; p += 0.002) {
      const markers = heartTransferMarkers(p);
      expect(markers).toHaveLength(20);
      for (const m of markers) {
        const point = signalPathPoint(path, m.phase);
        expect(point.x === 0 || point.x === 100 || Math.abs(point.y - 49) < 1e-8).toBe(true);
      }
    }
    expect(heartTransferMarkers(1).filter((m) => m.phase === 1)).toHaveLength(8);
    expect(heartTransferMarkers(1, true, false).every((m) => m.phase === 0)).toBe(true);
  });
  it('places injection before messenger arrival and secretion', () => {
    expect(secretinEvidence('gut', 0.2).signal).toBe(0);
    expect(secretinEvidence('gut', 0.59).secretion).toBe(0);
    expect(secretinMarkerPhases('gut', 0.2).every((m) => m.signal === 0)).toBe(true);
    expect(secretinMarkerPhases('blood-acid', 1).every((m) => !m.chemical)).toBe(true);
    expect(secretinEvidence('extract', 1).injection).toBe('extract-blood');
  });

  it('conserves the same marked fluid and its decaying signal during transfer', () => {
    for (const p of [0, 0.2, 0.45, 0.5, 0.65, 1]) {
      const f = heartTransfer(p);
      expect(f.volumeA + f.volumeB + f.volumePath).toBeCloseTo(2, 12);
      expect(f.amountA + f.amountB + f.amountPath + f.cleared).toBeCloseTo(f.initialAmount, 12);
    }
  });
  it('independently calculates recipient dilution at the end of transfer', () => {
    const f = heartTransfer(0.75, true, true, 0.4),
      expected = (0.4 * Math.exp(-(0.75 - 0.18) * 0.8)) / 1.4;
    expect(f.concentrationB).toBeCloseTo(expected, 12);
    expect(f.rateB).toBeCloseTo(1 / (1 + 2 * expected), 12);
    expect(f.rateA).toBeLessThan(f.rateB);
    expect(f.rateB).toBeLessThan(1);
  });
  it('keeps the unstimulated transfer and missing-transfer controls distinct', () => {
    expect(heartTransfer(0.8, false, true).rateB).toBe(1);
    expect(heartTransfer(0.8, true, false).rateB).toBe(1);
    expect(heartTransfer(0.8, true, false).rateA).toBeLessThan(1);
    expect(heartTransfer(0.8, true, true, 0).rateB).toBe(1);
  });
  it('tests a transported chemical signal without claiming neural control does not exist', () => {
    expect(secretinEvidence('blood-acid', 1).secretion).toBe(0);
    expect(secretinEvidence('denervated', 1)).toMatchObject({ nerve: false, secretion: 1 });
    expect(secretinEvidence('extract', 1)).toMatchObject({ mucosa: false, secretion: 1 });
    expect(secretinEvidence('gut', 0).secretion).toBe(0);
  });
});
