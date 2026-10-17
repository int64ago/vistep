import { describe, it, expect } from 'vitest';
import { eddySheet, eddyBrake, eddyDefaults, eddyShot, eddyTravel } from './eddy-current-brake';
describe('quasistatic moving-sheet finite-volume current loops', () => {
  it('conserves charge at each node and across every isolated lane', () => {
    for (const lanes of [1, 2, 4, 8]) {
      const s = eddySheet(lanes);
      expect(s.residual).toBeLessThan(2e-12);
      for (const e of s.edges) {
        if (e.b - e.a === s.nx) expect((Math.floor(e.a / s.nx) + 1) % (s.ny / lanes)).not.toBe(0);
      }
      expect(Math.max(...s.stream.map((row) => Math.abs(row.at(-1)!)))).toBeLessThan(1e-11);
    }
  });
  it('independently sums Joule heat and Lorentz force to equal mechanical braking power', () => {
    for (const lanes of [1, 4, 8])
      for (const velocity of [-0.03, 0.02]) {
        const s = eddyBrake({ ...eddyDefaults(), lanes, velocity });
        expect(s.joule).toBeGreaterThan(0);
        expect(s.joule).toBeCloseTo(-s.force * velocity, 10);
        expect(s.force * velocity).toBeLessThan(0);
      }
  });
  it('reversing speed reverses current and force; reversing field reverses current only', () => {
    const p = eddyDefaults(),
      a = eddyBrake(p),
      v = eddyBrake({ ...p, velocity: -p.velocity }),
      b = eddyBrake({ ...p, field: -p.field });
    expect(v.force).toBeCloseTo(-a.force, 12);
    expect(b.force).toBeCloseTo(a.force, 12);
    expect(v.currents[100]).toBeCloseTo(-a.currents[100], 12);
    expect(b.currents[100]).toBeCloseTo(-a.currents[100], 12);
  });
  it('doubling field quadruples low-speed drag and heating', () => {
    const p = eddyDefaults(),
      a = eddyBrake({ ...p, field: 0.1 }),
      b = eddyBrake({ ...p, field: 0.2 });
    expect(b.force / a.force).toBeCloseTo(4, 12);
    expect(b.joule / a.joule).toBeCloseTo(4, 12);
  });
  it('longitudinal insulating cuts reduce drag without changing conductivity or total metal thickness', () => {
    const a = eddyBrake(eddyDefaults()),
      b = eddyBrake({ ...eddyDefaults(), lanes: 8 });
    expect(Math.abs(b.force)).toBeLessThan(Math.abs(a.force) / 5);
    expect(b.sheet.length * b.sheet.width).toBe(a.sheet.length * a.sheet.width);
  });
  it('has no holding force at zero velocity and prescribed travel differentiates to velocity', () => {
    const p = eddyDefaults(),
      s = eddyBrake({ ...p, velocity: 0 });
    expect(s.joule).toBe(0);
    expect(Math.abs(s.force)).toBe(0);
    for (const chapter of [2, 3]) {
      const u = 0.3,
        h = 1e-6,
        derivative = (eddyTravel(chapter, u + h) - eddyTravel(chapter, u - h)) / (16 * h);
      expect(derivative).toBeCloseTo(eddyShot(chapter, u).velocity, 10);
    }
    expect(eddyBrake(s).joule).toBe(0);
  });
});

it('a uniform field admits a conservative potential and no steady eddy drag', () => {
  const s = eddyBrake({ ...eddyDefaults(), fieldShape: 'uniform' });
  expect(Math.max(...s.currents.map(Math.abs))).toBeLessThan(1e-10);
  expect(Math.abs(s.force)).toBeLessThan(1e-10);
  expect(s.joule).toBeLessThan(1e-20);
});

import { eddyContours } from './eddy-current-brake';
it('stream contours remain closed and cannot bridge insulating slits', () => {
  for (const lanes of [1, 8]) {
    const s = eddySheet(lanes),
      max = Math.max(...s.stream.flat().map(Math.abs)),
      paths = eddyContours(
        s,
        [-0.7, -0.35, 0.35, 0.7].map((v) => v * max),
      );
    expect(paths.length).toBeGreaterThan(1);
    for (const path of paths) {
      expect(path.at(-1)![0]).toBeCloseTo(path[0][0], 9);
      expect(path.at(-1)![1]).toBeCloseTo(path[0][1], 9);
      const bands = path.map((q) => Math.floor((q[1] + s.width / 2) / (s.width / lanes)));
      expect(Math.max(...bands)).toBe(Math.min(...bands));
    }
  }
});

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FilmContext } from '../components/lab/FilmContext';
import EddyCurrentBrake from '../components/experiments/EddyCurrentBrake';
it('executes every film chapter and the exploratory render without nonfinite output', () => {
  for (let chapter = 0; chapter < 6; chapter++)
    for (const progress of [0, 0.5, 1]) {
      const value = {
        watch: true,
        playing: false,
        time: chapter * 24 + progress * 24,
        chapter,
        run: 0,
        duration: 144,
        chapters: [],
        chapterTime: progress * 24,
        chapterProgress: progress,
      };
      const html = renderToStaticMarkup(
        createElement(FilmContext.Provider, { value }, createElement(EddyCurrentBrake)),
      );
      expect(html).not.toMatch(/NaN|Infinity/);
    }
  expect(renderToStaticMarkup(createElement(EddyCurrentBrake))).not.toMatch(/NaN|Infinity/);
});
