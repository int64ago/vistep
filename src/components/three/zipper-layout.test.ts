import { describe, expect, it } from 'vitest';
import { ZIP_GUIDE, zipperShot } from '../../models/zipper';
import { zipperMarkedLabel, zipperTextSize } from './zipper-layout';

describe('zipper drawing typography and tracked annotation', () => {
  it('keeps 16 screen pixels under width and max-height meet scaling', () => {
    for (const width of [280, 370, 560])
      for (const drawnWidth of [210, 254, 283, 360, 620])
        for (const drawnHeight of [200, 366, 430]) {
          const size = zipperTextSize(width, 360, drawnWidth, drawnHeight);
          expect(size * Math.min(drawnWidth / width, drawnHeight / 360)).toBeCloseTo(16, 12);
        }
  });
  it('places L7 outside the complete guide throughout capture and reverse travel', () => {
    for (const compact of [false, true]) {
      const width = compact ? 280 : 560,
        scale = compact ? 48 : 65,
        minY = Math.min(...ZIP_GUIDE.outline.map((p) => 180 - (p[1] - 0.85) * scale)),
        minX = Math.min(...ZIP_GUIDE.outline.map((p) => width / 2 + p[0] * scale));
      for (const chapter of [3, 5])
        for (let i = 0; i <= 200; i++) {
          const { pose } = zipperShot(chapter, i / 200),
            target = [
              width / 2 + pose.marked.root[0] * scale,
              180 - (pose.marked.root[1] - pose.slider - 0.85) * scale,
            ] as const;
          for (const drawn of compact ? [254, 320] : [283, 560]) {
            const { box, leader } = zipperMarkedLabel(
              width,
              zipperTextSize(width, 360, drawn, (drawn * 360) / width),
              target,
            );
            expect(box.x + box.width < minX - 6 || box.y + box.height < minY - 6).toBe(true);
            expect(box.y).toBeGreaterThan(32);
            expect(box.x + box.width).toBeLessThan(width - 8);
            expect(target[0]).toBeGreaterThan(0);
            expect(target[0]).toBeLessThan(width);
            expect(target[1]).toBeGreaterThan(34);
            expect(target[1]).toBeLessThan(326);
            expect(leader.endsWith(`L${target[0]} ${target[1]}`)).toBe(true);
          }
        }
    }
  });
  it('rejects invalid measurement inputs instead of emitting invalid SVG sizes', () => {
    for (const bad of [0, -1, Infinity, NaN]) {
      expect(() => zipperTextSize(bad, 360, 254, 326)).toThrow(RangeError);
      expect(() => zipperTextSize(280, 360, bad, 326)).toThrow(RangeError);
      expect(() => zipperTextSize(280, 360, 254, bad)).toThrow(RangeError);
    }
  });
});
