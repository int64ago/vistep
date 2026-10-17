import { describe, it, expect } from 'vitest';
import { genevaState, genevaDriverContains, genevaWheelContains } from './geneva-drive';
describe('external Geneva pin, slot and locking geometry', () => {
  it('has the independent four-slot 90 degree index and 270 degree dwell', () => {
    const s = genevaState(0);
    expect(s.step).toBeCloseTo(Math.PI / 2);
    expect(s.entry * 2).toBeCloseTo(Math.PI / 2);
    expect(s.dwellFraction).toBe(0.75);
    expect(genevaState(0, 6).step).toBeCloseTo(Math.PI / 3);
    expect(genevaState(0, 6).indexFraction).toBeCloseTo(1 / 3);
  });
  it('keeps the pin on the active radial slot with sufficient radial depth', () => {
    for (const n of [4, 5, 6])
      for (let a = -8; a < 8; a += 0.037) {
        const s = genevaState(a, n);
        if (!s.engaged) continue;
        const dx = s.pin.x - 1,
          dy = s.pin.y,
          phi = Math.PI + s.output + s.activeSlot * s.step;
        expect(dx * Math.sin(phi) - dy * Math.cos(phi)).toBeCloseTo(0, 10);
        expect(Math.hypot(dx, dy) - s.pinRadius).toBeGreaterThanOrEqual(s.slotInner - 1e-12);
      }
  });
  it('enters and leaves with zero output velocity and matches the angle derivative', () => {
    const s = genevaState(0);
    expect(genevaState(-s.entry).ratio).toBeCloseTo(0);
    expect(genevaState(s.entry).ratio).toBeCloseTo(0);
    expect(s.ratio).toBeCloseTo(-(1 + Math.SQRT2));
    const h = 1e-6;
    expect(genevaState(0.3).ratio).toBeCloseTo(
      (genevaState(0.3 + h).output - genevaState(0.3 - h).output) / (2 * h),
      7,
    );
  });
  it('holds output across dwell and advances exactly one slot each input revolution', () => {
    expect(genevaState(1.2).output).toBeCloseTo(genevaState(5).output);
    for (const n of [4, 5, 6])
      expect(genevaState(0.2 + 2 * Math.PI, n).output - genevaState(0.2, n).output).toBeCloseTo(
        (-2 * Math.PI) / n,
      );
  });
  it('keeps the fixed-profile locking disc clear of the output plate through a full turn', () => {
    for (const n of [4, 5, 6])
      for (let i = 0; i < 96; i++) {
        const s = genevaState(-Math.PI + (i * 2 * Math.PI) / 96, n);
        for (let r = 0.02; r < s.lockRadius - 0.002; r += 0.023)
          for (let j = 0; j < 90; j++) {
            const a = (j * 2 * Math.PI) / 90,
              x = r * Math.cos(a),
              y = r * Math.sin(a);
            expect(genevaDriverContains(x, y, s) && genevaWheelContains(x, y, s)).toBe(false);
          }
      }
  });
  it('shows matching locking surfaces in dwell and rejects unsupported geometry', () => {
    const s = genevaState(Math.PI);
    expect(genevaDriverContains(s.lockRadius - 0.001, 0, s)).toBe(true);
    expect(genevaWheelContains(s.lockRadius + 0.001, 0, s)).toBe(true);
    expect(genevaWheelContains(s.lockRadius - 0.001, 0, s)).toBe(false);
    expect(() => genevaState(0, 3)).toThrow();
    expect(() => genevaState(NaN)).toThrow();
  });
});
