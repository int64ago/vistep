import { describe, it, expect } from 'vitest';
import {
  coleoptileGrowth,
  auxinDoseResponse,
  agarLoading,
  agarTracerMarkers,
  auxinTransportAssay,
} from './bio-auxin-evidence';
describe('auxin evidence and geometry', () => {
  it('derives bending direction from edge growth rather than a decorative rotation', () => {
    const left = coleoptileGrowth('intact', 1, 'left'),
      right = coleoptileGrowth('intact', 1, 'right');
    expect(left.rightLength).toBeGreaterThan(left.leftLength);
    expect(left.point(1).x).toBeLessThan(0);
    expect(right.point(1).x).toBeCloseTo(-left.point(1).x, 12);
    const arc = (side: number) => {
      let total = 0,
        prev = left.point(0, side);
      for (let i = 1; i <= 2000; i++) {
        const next = left.point(i / 2000, side);
        total += Math.hypot(next.x - prev.x, next.y - prev.y);
        prev = next;
      }
      return total;
    };
    expect(arc(-1)).toBeCloseTo(left.leftLength, 5);
    expect(arc(1)).toBeCloseTo(left.rightLength, 5);
  });
  it('separates sensing, signal passage and off-center sources', () => {
    expect(coleoptileGrowth('tip-covered', 1).angle).toBe(0);
    expect(coleoptileGrowth('tip-covered', 1).length).toBeGreaterThan(105);
    expect(coleoptileGrowth('removed', 1).length).toBe(105);
    expect(coleoptileGrowth('agar', 1).angle).toBeLessThan(0);
    expect(coleoptileGrowth('barrier', 1).length).toBe(105);
    expect(coleoptileGrowth('tip-left', 1, 'dark').point(1).x).toBeGreaterThan(0);
    expect(coleoptileGrowth('agar-clean', 1, 'dark').length).toBe(105);
  });
  it('preserves zero-dose reference and organ-specific response ranges', () => {
    for (const organ of ['root', 'bud', 'stem'] as const)
      expect(auxinDoseResponse(0, organ)).toBe(0);
    expect(auxinDoseResponse(1e-7, 'root')).toBeLessThan(0);
    expect(auxinDoseResponse(1e-7, 'bud')).toBeGreaterThan(0);
    expect(auxinDoseResponse(0.1, 'stem')).toBeLessThan(0);
  });
  it('closes donor-tissue-receiver and loading inventories', () => {
    for (const p of [0, 0.1, 0.5, 1]) {
      expect(agarLoading(p).tipAmount + agarLoading(p).agarAmount).toBeCloseTo(1, 12);
      expect(auxinTransportAssay(p).total).toBeCloseTo(1, 12);
    }
    expect(auxinTransportAssay(1).receiver).toBeCloseTo(1 - 4 * Math.exp(-3), 12);
    expect(auxinTransportAssay(1, 'tipward', 'polar').receiver).toBe(0);
    expect(auxinTransportAssay(1, 'tipward', 'both').receiver).toBeGreaterThan(0.8);
    expect(auxinTransportAssay(1, 'baseward', 'polar', false).total).toBe(0);
  });
  it('shows that one positive forward result cannot distinguish competing direction hypotheses', () => {
    expect(auxinTransportAssay(1, 'baseward', 'polar').receiver).toBe(
      auxinTransportAssay(1, 'baseward', 'both').receiver,
    );
    expect(auxinTransportAssay(1, 'tipward', 'polar').receiver).not.toBe(
      auxinTransportAssay(1, 'tipward', 'both').receiver,
    );
  });
});

it('keeps each loading tracer inside the tip until it crosses the actual agar interface', () => {
  let previous = agarTracerMarkers(0);
  for (let n = 0; n <= 1000; n++) {
    const markers = agarTracerMarkers(n / 1000, 205);
    expect(markers.map((m) => m.id)).toEqual(previous.map((m) => m.id));
    for (const m of markers) {
      if (m.y < 154) expect(Math.abs(m.x)).toBeLessThanOrEqual(12.001);
      else {
        expect(Math.abs(m.x)).toBeLessThanOrEqual(103);
        expect(m.y).toBeLessThan(227);
      }
      expect(Math.hypot(m.x - previous[m.id].x, m.y - previous[m.id].y)).toBeLessThan(5);
    }
    previous = markers;
  }
  const loaded = agarTracerMarkers(1).filter((m) => m.inAgar).length / 16;
  expect(Math.abs(loaded - agarLoading(1).agarAmount)).toBeLessThan(1 / 16);
});
