import { describe, expect, it } from 'vitest';
import {
  CH_DEFAULT,
  CH_RUN_CACHE_BYTES,
  chContourSteps,
  chField,
  chFieldSet,
  chFieldSetBytes,
  chFieldSetSteps,
  chLayout,
  chRsrpAt,
  chRunBytes,
  chSimulate,
  chSimulateSteps,
  type ChField,
} from './cell-handover';

describe('cellular calculation boundaries and cooperative execution', () => {
  it('preserves every strongest-cell ID in the legal 150 m, 405-cell layout', () => {
    const layout = chLayout(150),
      field = chField(layout, 0, 50);
    expect(layout.cells).toHaveLength(405);
    expect(field.best).toBeInstanceOf(Uint16Array);
    const powers = new Float64Array(layout.cells.length);
    let highIds = 0;
    for (let j = 0; j < field.rows; j++) {
      for (let i = 0; i < field.cols; i++) {
        chRsrpAt(layout, (i + 0.5) * field.step, (j + 0.5) * field.step, 0, powers);
        const strongest = powers.indexOf(Math.max(...powers));
        expect(field.best[j * field.cols + i]).toBe(strongest);
        if (strongest > 255) highIds++;
      }
    }
    expect(highIds).toBeGreaterThan(300);
  });

  it('yields throughout field and contour calculation and returns the same numerical result', () => {
    const parts = chFieldSetSteps(500, 6, 20);
    let segment = parts.next(),
      yields = 0;
    while (!segment.done) {
      yields++;
      segment = parts.next();
    }
    expect(yields).toBeGreaterThan(8);
    expect(segment.value).toEqual(chFieldSet(500, 6, 20));
    const set = segment.value;
    expect(chFieldSetBytes(set)).toBe(
      set.field.best.byteLength +
        set.field.bestDbm.byteLength +
        set.field.marginDb.byteLength +
        set.cellEdges.byteLength +
        set.taEdges.byteLength +
        128,
    );
  });

  it('also yields while contouring a large homogeneous region that produces no edges', () => {
    const size = 256;
    const field: ChField = {
      rect: { x: 0, y: 0, w: size, h: size },
      cols: size,
      rows: size,
      step: 1,
      best: new Uint16Array(size * size),
      bestDbm: new Float32Array(size * size),
      marginDb: new Float32Array(size * size).fill(10),
    };
    const steps = chContourSteps(field);
    let segment = steps.next(),
      yields = 0;
    while (!segment.done) {
      yields++;
      segment = steps.next();
    }
    expect(yields).toBeGreaterThan(30);
    expect(segment.value).toHaveLength(0);
  });

  it('yields a route with the same seeded powers and valid completed handovers', () => {
    const steps = chSimulateSteps({ ...CH_DEFAULT, hysDb: 3.25, speedKmh: 120 });
    let segment = steps.next(),
      yields = 0;
    while (!segment.done) {
      yields++;
      segment = steps.next();
    }
    expect(yields).toBeGreaterThan(8);
    const run = segment.value;
    for (const i of [0, 250, 650, run.count - 1]) {
      const point = run.route.at(i * run.speed * run.dt);
      const powers = chRsrpAt(run.layout, point.x, point.y, run.params.sigmaDb);
      expect([...run.truth.slice(i * run.cells, (i + 1) * run.cells)]).toEqual(
        [...powers].map(Math.fround),
      );
    }
    expect(run.events.filter((event) => event.kind === 'handover')).toHaveLength(run.handovers);
  });

  it('limits retained slow routes by bytes and keeps a recently reused route', () => {
    const params = { ...CH_DEFAULT, speedKmh: 5 };
    const first = chSimulate({ ...params, hysDb: 2.1 });
    const middle = chSimulate({ ...params, hysDb: 2.2 });
    expect(chRunBytes(first)).toBeGreaterThan(CH_RUN_CACHE_BYTES / 3);
    expect(chRunBytes(first) + chRunBytes(middle)).toBeLessThan(CH_RUN_CACHE_BYTES);
    expect(chSimulate(first.params) === first).toBe(true);
    chSimulate({ ...params, hysDb: 2.3 });
    expect(chSimulate(first.params) === first).toBe(true);
    expect(chSimulate(middle.params) === middle).toBe(false);
  });
});
