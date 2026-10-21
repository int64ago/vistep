import { describe, it, expect } from 'vitest';
import {
  filmOptics,
  filmRayGeometry,
  fieldAt,
  brightThickness,
  soapContour,
  soapThickness,
  wedgeSpacing,
  wedgeThickness,
  filmColor,
  thinFilmDirector,
} from './thin-film-lab';
describe('lossless symmetric optical film', () => {
  it('has a quarter-wave maximum and no interface at zero thickness', () => {
    const n = 4 / 3,
      r = (1 - n) / (1 + n),
      max = (4 * r * r) / (1 + r * r) ** 2;
    expect(filmOptics(600 / (4 * n), 600, n)!.R).toBeCloseTo(max, 13);
    for (const a of [0, 15, 30]) {
      expect(filmOptics(0, 600, n, 1, a)!.R).toBeLessThan(1e-28);
      expect(filmOptics(0, 600, n, 1, a)!.T).toBeCloseTo(1, 14);
    }
  });
  it('assigns the phase reversal to the higher-index reflection', () => {
    expect(filmOptics(100)!).toMatchObject({ frontFlip: true, backFlip: false });
    expect(filmOptics(100, 589, 1, 1.5)!).toMatchObject({ frontFlip: false, backFlip: true });
  });
  it('conserves power at both orientations and finite oblique angles', () => {
    for (const [n, n0] of [
      [1.333, 1],
      [1, 1.5],
      [1, 1],
    ])
      for (const a of [0, 13, 35])
        for (const d of [0, 50, 113, 400, 50000]) {
          const q = filmOptics(d, 589, n, n0, a)!;
          expect(q.R + q.T).toBeCloseTo(1, 12);
          expect(q.R).toBeGreaterThanOrEqual(0);
          expect(q.R).toBeLessThanOrEqual(1);
        }
  });
  it('sums all internal returns, rather than labeling the first two-ray approximation exact', () => {
    const s = filmOptics(123, 589, 1.333, 1, 25)!;
    let re = 0,
      im = 0;
    for (let j = 0; j < 30; j++) {
      const a = -s.r * (1 - s.r * s.r) * Math.pow(s.r * s.r, j),
        p = (j + 1) * s.beta;
      re += a * Math.cos(p);
      im += a * Math.sin(p);
    }
    expect(s.returned.re).toBeCloseTo(re, 14);
    expect(s.returned.im).toBeCloseTo(im, 14);
    let avg = 0;
    for (let j = 0; j < 1024; j++) {
      const p = (2 * Math.PI * j) / 1024;
      const a = fieldAt(s.front, p),
        b = fieldAt(s.returned, p);
      expect(a + b).toBeCloseTo(fieldAt(s.total, p), 13);
      avg += (a + b) ** 2 / 1024;
    }
    expect(2 * avg).toBeCloseTo(s.R, 12);
  });
  it('uses the same outgoing wavefront and Snell geometry, including the reference leg', () => {
    for (const angle of [-35, -12, 0, 25, 35])
      for (const [n, n0] of [
        [1.333, 1],
        [1, 1.5],
      ]) {
        const s = filmOptics(180, 589, n, n0, angle)!,
          g = filmRayGeometry(180, n, n0, angle, 290, 168)!;
        const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
          Math.hypot(a.x - b.x, a.y - b.y) / g.scale;
        expect(distance(g.A, g.B) + distance(g.B, g.C)).toBeCloseTo(360 / Math.cos(s.theta1), 10);
        expect(n * g.internalLength - n0 * g.referenceLength).toBeCloseTo(
          360 * n * Math.cos(s.theta1),
          10,
        );
        const u = { x: Math.sin(s.theta0), y: -Math.cos(s.theta0) };
        expect((g.C.x - g.D.x) * u.x + (g.C.y - g.D.y) * u.y).toBeCloseTo(0, 10);
        expect(g.A.y).toBeCloseTo(g.C.y, 10);
        expect(g.B.y).toBeCloseTo(g.bottom, 10);
      }
  });
  it('rejects unsupported inputs and evanescent incidence explicitly', () => {
    for (const x of [NaN, Infinity, -1, 200001]) expect(filmOptics(x)).toBeNull();
    for (const [d, w, n, n0, a] of [
      [1, 0, 1, 1, 0],
      [1, 589, NaN, 1, 0],
      [1, 589, 1, 1.5, 50],
    ])
      expect(filmOptics(d, w, n, n0, a)).toBeNull();
    expect(filmOptics(600, 589, 1, 1)!.R).toBe(0);
    expect(filmColor(600, true, 589, 1, 1)).not.toMatch(/NaN/);
  });
  it('locates the same bright contour as the prescribed film drains', () => {
    for (const drain of [0.4, 0.8, 1.2]) {
      const y = soapContour(1, drain)!;
      expect(soapThickness(y, drain)).toBeCloseTo((3 * 589) / (4 * 1.333), 11);
    }
  });
  it('predicts doubled air-wedge spacing with one sheet and fixed wavelength', () => {
    expect(wedgeSpacing(589, 2)).toBeCloseTo(0.2945, 12);
    expect(wedgeSpacing(589, 1)).toBeCloseTo(0.589, 12);
    for (const sheets of [1, 1.5, 2]) {
      const dx = wedgeSpacing(589, sheets);
      expect(wedgeThickness(dx, sheets)).toBeCloseTo(589 / 2, 12);
      expect(filmOptics(wedgeThickness(dx, sheets), 589, 1, 1.5)!.R).toBeLessThan(1e-28);
    }
  });
  it('moves the same bright order to larger thickness when the angle increases', () => {
    expect(brightThickness(0, 589, 1.333, 1, 35)!).toBeGreaterThan(brightThickness(0)!);
  });
  it('holds predictions before revealing and restores them on rewind', () => {
    expect(thinFilmDirector(0, 0, 34)).toMatchObject({ reveal: false, stage: 1 });
    expect(thinFilmDirector(0, 0, 41).thickness).toBe(0);
    expect(thinFilmDirector(4, 0, 10)).toMatchObject({ sheets: 1, reveal: false });
    expect(thinFilmDirector(4, 0, 18).reveal).toBe(true);
    expect(thinFilmDirector(4, 0, 10).reveal).toBe(false);
  });
});

import { FILM_CUTS, FILM_SECONDS } from './thin-film-lab';
it('uses measured chapter durations while retaining the three original 28 s windows', () => {
  expect([...FILM_SECONDS]).toEqual([46, 28, 28, 43.5, 28]);
  expect(FILM_SECONDS.reduce((a, b) => a + b, 0)).toBe(173.5);
});
it('follows measured language-specific optical reveals without leaking prediction results', () => {
  for (const locale of ['zh', 'en'] as const) {
    const k = FILM_CUTS[locale],
      shot = (c: number, t: number) => thinFilmDirector(c, 0, t, locale);
    expect(shot(0, k.soap.paths - 0.01).view).toBe('observation');
    expect(shot(0, k.soap.paths + 0.01)).toMatchObject({ view: 'paths', pathStep: 0 });
    for (const [name, step] of [
      ['internal', 1],
      ['frontPhase', 2],
      ['backPhase', 3],
      ['wavefront', 4],
    ] as const) {
      expect(shot(0, k.soap[name] - 0.01).pathStep).toBe(step - 1);
      expect(shot(0, k.soap[name] + 0.01).pathStep).toBe(step);
    }
    expect(shot(0, k.soap.sum + 0.01).view).toBe('sum');
    const held = shot(0, k.soap.collapse - 0.01);
    expect(held).toMatchObject({ stage: 1, reveal: false });
    expect(held.thickness).toBeCloseTo(brightThickness(0, 589, 1.333, 1, 25)!);
    expect(shot(0, k.soap.collapse + 0.01).reveal).toBe(true);
    expect(shot(0, k.soap.dark).thickness).toBe(0);
    expect(shot(0, k.soap.collapse - 0.01)).toEqual(held);
    expect(shot(1, k.drain.end).drain).toBeCloseTo(0.4);
    expect(shot(1, k.drain.sum + 0.01).view).toBe('sum');
    expect(shot(1, k.drain.dark).thickness).toBe(0);
    expect(shot(3, k.wedge.normal - 0.01).view).toBe('paths');
    expect(shot(3, k.wedge.normal + 0.01)).toMatchObject({ view: 'wedge', angle: 0 });
    expect(shot(3, k.wedge.question + 0.01)).toMatchObject({ sheets: 2, reveal: false });
    expect(shot(4, k.remove.withdrawn)).toMatchObject({
      sheets: 2,
      sheetWithdrawal: 1,
      reveal: false,
    });
    expect(shot(4, k.remove.settled).sheets).toBe(1);
    expect(shot(4, k.remove.reveal - 0.01).reveal).toBe(false);
    expect(shot(4, k.remove.reveal + 0.01).reveal).toBe(true);
    expect(shot(4, k.remove.reveal - 0.01).reveal).toBe(false);
    // Presentation transitions are finite and continuous at every movement endpoint.
    for (const [c, at, field] of [
      [0, k.soap.collapse, 'thickness'],
      [0, k.soap.dark, 'thickness'],
      [1, k.drain.start, 'drain'],
      [1, k.drain.end, 'drain'],
      [4, k.remove.withdrawn, 'sheets'],
      [4, k.remove.settled, 'sheets'],
    ] as const)
      expect(Math.abs(shot(c, at + 1e-6)[field] - shot(c, at - 1e-6)[field])).toBeLessThan(1e-7);
  }
  for (const bad of [NaN, Infinity, -Infinity, -1e6, 1e6])
    expect(JSON.stringify(thinFilmDirector(bad, bad, bad, 'en'))).not.toMatch(/null|NaN|Infinity/);
});
