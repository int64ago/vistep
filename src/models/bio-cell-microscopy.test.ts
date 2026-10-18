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

import {
  cellPlate,
  targetVisibility,
  fixedMicroscopyImage,
  enlargeRecordedImage,
  registeredStreaming,
  microscopyDirector,
  microscopyDurations,
  specimenCells,
} from './bio-cell-microscopy';

describe('microscopic evidence and inference', () => {
  it('loses a whole fixed target at 480 micrometres and recovers that same ID by centering', () => {
    const before = specimenCells('leaf');
    expect(targetVisibility(10, -480).fullyInside).toBe(true);
    expect(targetVisibility(40, -480).fullyOutside).toBe(true);
    expect(targetVisibility(40, 0).fullyInside).toBe(true);
    expect(targetVisibility(40, 0).id).toBe(targetVisibility(10, -480).id);
    expect(specimenCells('leaf')).toEqual(before);
    // Counterexample: the old 180 µm center-only displacement cannot lose this target.
    expect(targetVisibility(40, -180).fullyOutside).toBe(false);
  });
  it('extends a central plate to the original wall, with two pre-separated nuclei and conserved space', () => {
    const start = cellPlate(0),
      end = cellPlate(1);
    expect(start.plate.y1).toBe(-0);
    expect(start.plate.y2).toBe(0);
    expect(end.plate.y1).toBe(end.parent.y);
    expect(end.plate.y2).toBe(end.parent.y + end.parent.height);
    expect(end.separatedArea! * 2).toBeCloseTo(start.parentArea, 12);
    for (let p = 0; p <= 1; p += 0.01) {
      const s = cellPlate(p);
      expect(s.parent).toEqual(start.parent);
      expect(s.nuclei).toEqual(start.nuclei);
      expect(s.nuclei[0].x + s.nuclei[0].radius).toBeLessThan(s.plate.x);
      expect(s.nuclei[1].x - s.nuclei[1].radius).toBeGreaterThan(s.plate.x);
      expect(s.plate.y1).toBeGreaterThanOrEqual(start.parent.y);
      expect(s.plate.y2).toBeLessThanOrEqual(start.parent.y + start.parent.height);
    }
  });
  it('enlarges exactly the same recorded pixels, without adding an artificial resolved valley', () => {
    const src = fixedMicroscopyImage,
      snapshot = [...src.pixels];
    for (const z of [1, 2, 4, 6]) {
      const enlarged = enlargeRecordedImage(z);
      for (let y = 0; y < src.height; y++)
        for (let x = 0; x < src.width; x++) {
          for (let dy = 0; dy < z; dy++)
            for (let dx = 0; dx < z; dx++)
              expect(enlarged.pixels[(y * z + dy) * enlarged.width + x * z + dx]).toBe(
                src.pixels[y * src.width + x],
              );
        }
      expect(new Set(enlarged.pixels)).toEqual(new Set(src.pixels));
    }
    expect(src.pixels).toEqual(snapshot);
    const row = src.pixels.slice(8 * src.width, 9 * src.width);
    expect(row[11]).toBeGreaterThan(row[10]);
    expect(row[12]).toBeGreaterThan(row[13]);
    expect(row[11]).toBe(row[12]);
  });
  it('cancels arbitrary common drift for every persistent chloroplast', () => {
    for (let time = 0; time < 55; time += 0.7) {
      const fixed = registeredStreaming(time, 'flow'),
        moved = registeredStreaming(time, 'both', { x: 31.6, y: -22.9 });
      expect(moved.chloroplasts.map((c) => c.id)).toEqual(Array.from({ length: 18 }, (_, i) => i));
      for (let i = 0; i < 18; i++) {
        expect(moved.chloroplasts[i].x - moved.wall.x).toBeCloseTo(
          fixed.chloroplasts[i].x - fixed.wall.x,
          10,
        );
        expect(moved.chloroplasts[i].y - moved.wall.y).toBeCloseTo(
          fixed.chloroplasts[i].y - fixed.wall.y,
          10,
        );
      }
      expect(moved.distance).toBeCloseTo(fixed.distance, 10);
      expect(registeredStreaming(time, 'drift').distance).toBeCloseTo(0, 10);
    }
    expect(registeredStreaming(12, 'flow').distance).toBeGreaterThan(10);
  });
  it('uses measured cuts whose target visibility and parent endpoint match the visible claim', () => {
    const lost = microscopyDirector(2, 8),
      recovered = microscopyDirector(2, 24);
    expect(targetVisibility(lost.objective, lost.center).fullyOutside).toBe(true);
    expect(targetVisibility(recovered.objective, recovered.center).fullyInside).toBe(true);
    expect(cellPlate(microscopyDirector(1, 30).progress).plate.connected).toBe(true);
    expect(microscopyDirector(3, 23).shot).toBe('fixed-image');
    expect(microscopyDirector(3, 4).shot).toBe('cell-scale');
    for (let chapter = 0; chapter < 6; chapter++) {
      const later = microscopyDirector(chapter, microscopyDurations[chapter]);
      microscopyDirector(chapter, 0);
      expect(microscopyDirector(chapter, microscopyDurations[chapter])).toEqual(later);
    }
  });
  it('does not show division before the voice introduces an existing cell in either language', () => {
    for (const [locale, former, parent, growing, complete] of [
      ['zh', 17.8, 20, 24, 26],
      ['en', 18.9, 21, 25.3, 27],
    ] as const) {
      expect(microscopyDirector(1, former, locale).shot).toBe('former-idea');
      const s = microscopyDirector(1, parent, locale);
      expect(s.shot).toBe('division');
      expect(s.progress).toBe(0);
      expect(cellPlate(s.progress).nuclei).toHaveLength(2);
      expect(microscopyDirector(1, growing, locale).progress).toBeGreaterThan(0);
      expect(microscopyDirector(1, growing, locale).progress).toBeLessThan(1);
      expect(cellPlate(microscopyDirector(1, complete, locale).progress).plate.connected).toBe(
        true,
      );
    }
  });
  it('aligns loss, explanation, return, and fixed-image evidence with the separate voice cues', () => {
    for (const [locale, lostAt, diagramAt, centeredAt, recoveredAt, imageAt] of [
      ['zh', 6, 11, 18, 19.3, 22.2],
      ['en', 4.5, 9, 16.2, 17.5, 20.2],
    ] as const) {
      const lost = microscopyDirector(2, lostAt, locale),
        centered = microscopyDirector(2, centeredAt, locale),
        recovered = microscopyDirector(2, recoveredAt, locale);
      expect(lost.shot).toBe('target-field');
      expect(targetVisibility(lost.objective, lost.center).fullyOutside).toBe(true);
      expect(microscopyDirector(2, diagramAt, locale).shot).toBe('nested-fields');
      expect(centered.objective).toBe(10);
      expect(centered.center).toBe(-0);
      expect(recovered.objective).toBe(40);
      expect(targetVisibility(recovered.objective, recovered.center).fullyInside).toBe(true);
      expect(microscopyDirector(3, imageAt - 0.3, locale).shot).toBe('tissues');
      expect(microscopyDirector(3, imageAt, locale).shot).toBe('fixed-image');
      expect(microscopyDirector(3, imageAt, locale).progress).toBe(0);
    }
  });
  it('holds relative motion at zero during common drift, then preserves continuity when both move', () => {
    for (const [locale, registeredAt, flowingAt, sharedAt] of [
      ['zh', 9.8, 14, 23],
      ['en', 8.7, 13, 20],
    ] as const) {
      const registered = microscopyDirector(5, registeredAt, locale);
      expect(registered.shot).toBe('drift-only');
      expect(registered.clock).toBe(0);
      expect(registered.drift.x).toBe(0);
      const flow = microscopyDirector(5, flowingAt, locale),
        both = microscopyDirector(5, sharedAt, locale);
      expect(flow.shot).toBe('relative-flow');
      expect(flow.drift.x).toBe(0);
      expect(both.shot).toBe('shared-drift');
      expect(both.drift.x).toBeGreaterThan(0);
      const moved = registeredStreaming(both.clock, 'both', both.drift),
        reference = registeredStreaming(both.clock, 'flow');
      expect(moved.distance).toBeCloseTo(reference.distance, 10);
      for (let time = 0.01; time <= 30; time += 0.01) {
        const a = microscopyDirector(5, time - 0.01, locale),
          b = microscopyDirector(5, time, locale);
        expect(Math.abs(a.drift.x - b.drift.x)).toBeLessThan(0.1);
        expect(b.clock - a.clock).toBeGreaterThanOrEqual(0);
        expect(b.clock - a.clock).toBeLessThanOrEqual(0.010000001);
      }
    }
  });
  it('keeps finite outputs for invalid numeric inputs', () => {
    for (const invalid of [NaN, Infinity, -Infinity, -1e10]) {
      for (const v of Object.values(microscopeOptics(invalid, invalid)))
        expect(Number.isFinite(v)).toBe(true);
      expect(Number.isFinite(leafChloroplast(invalid, invalid).x)).toBe(true);
      expect(Number.isFinite(registeredStreaming(invalid, 'both').distance)).toBe(true);
      expect(Number.isFinite(cellPlate(invalid).plate.y2)).toBe(true);
      expect(Number.isFinite(microscopyDirector(invalid, invalid).objective)).toBe(true);
      expect(enlargeRecordedImage(invalid).pixels.length).toBeGreaterThan(0);
    }
  });
});
