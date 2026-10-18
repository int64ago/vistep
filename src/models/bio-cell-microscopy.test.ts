import { describe, expect, it } from 'vitest';
import { microscopeOptics, leafChloroplast, visibleCells } from './bio-cell-microscopy';
describe('microscope specimen coordinates', () => {
  it('matches field number divided by objective and preserves specimen scale', () => {
    expect(microscopeOptics(10).fieldUm).toBe(1800);
    expect(microscopeOptics(40).fieldUm).toBe(450);
    expect(microscopeOptics(40).pixelsPerUm / microscopeOptics(10).pixelsPerUm).toBe(4);
  });
  it('tracks the same chloroplast on a closed peripheral path', () => {
    const a = leafChloroplast(3, 0);
    const b = leafChloroplast(3, (2 * Math.PI) / 0.12);
    expect(b.id).toBe(a.id);
    expect(b.x).toBeCloseTo(a.x);
    expect(b.y).toBeCloseTo(a.y);
    for (let t = 0; t < 100; t += 0.2) {
      const p = leafChloroplast(3, t);
      // Independently check each chloroplast outline against the rendered
      // vacuole boundary and the cell wall, not just its centre's extrema.
      for (let a = 0; a < 2 * Math.PI; a += 0.2) {
        const theta = (p.angle * Math.PI) / 180;
        const x = p.x + 4.6 * Math.cos(a) * Math.cos(theta) - 2.8 * Math.sin(a) * Math.sin(theta);
        const y = p.y + 4.6 * Math.cos(a) * Math.sin(theta) + 2.8 * Math.sin(a) * Math.cos(theta);
        const dx = Math.max(Math.abs(x) - 49.5, 0);
        const dy = Math.max(Math.abs(y) - 6.5, 0);
        expect(Math.hypot(dx, dy)).toBeGreaterThan(16);
        expect(Math.abs(x)).toBeLessThan(77.5);
        expect(Math.abs(y)).toBeLessThan(34.5);
      }
    }
  });
  it('does not move fixed chloroplasts and reveals fewer cells at high power', () => {
    expect(leafChloroplast(0, 30, false)).toEqual(leafChloroplast(0, 0, false));
    expect(visibleCells('leaf', 450).length).toBeLessThan(visibleCells('leaf', 1800).length);
  });
});
