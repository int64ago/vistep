import { describe, it, expect } from 'vitest';
import { fuseDefaults, fuseRun, fuseAt, FUSE_SILVER } from './electric-fuse';
describe('spatial thermal pre-arcing fuse model', () => {
  it('conserves the independently accumulated electrical and thermal energy', () => {
    for (const current of [1, 2.2, 4]) {
      const r = fuseRun({ ...fuseDefaults(), current });
      for (const s of r.frames) expect(s.supplied - s.escaped).toBeCloseTo(s.stored, 11);
    }
  });
  it('conducting ends stay cooler than the middle and the symmetric wire stays symmetric', () => {
    const r = fuseRun(fuseDefaults()),
      s = r.frames.at(-1)!;
    expect(s.temperature[0]).toBeLessThan(s.maximum / 5);
    for (let i = 0; i < s.temperature.length; i++)
      expect(s.temperature[i]).toBeCloseTo(s.temperature.at(-1 - i)!, 10);
    expect(s.maximum).toBeCloseTo(FUSE_SILVER.melting, 8);
  });
  it('moderate current approaches thermal balance without melting', () => {
    const r = fuseRun({ ...fuseDefaults(), current: 1, duration: 1 }),
      s = r.frames.at(-1)!;
    expect(r.meltingTime).toBeNull();
    expect(s.joule).toBeCloseTo(s.loss, 4);
  });
  it('a short pulse cools without melting while sustained current reaches melting', () => {
    const p = { ...fuseDefaults(), current: 4, duration: 0.15 },
      pulse = fuseRun({ ...p, pulse: 0.008 }),
      held = fuseRun(p);
    expect(pulse.meltingTime).toBeNull();
    expect(held.meltingTime).not.toBeNull();
    expect(pulse.frames.at(-1)!.maximum).toBeLessThan(fuseAt(pulse, 0.008).maximum);
    expect(pulse.frames.at(-1)!.i2t).toBeCloseTo(16 * 0.008, 10);
  });
  it('ambient temperature and diameter change the thermal result at the same current', () => {
    const a = fuseRun(fuseDefaults()),
      hot = fuseRun({ ...fuseDefaults(), ambient: 80 }),
      thick = fuseRun({ ...fuseDefaults(), diameter: 70e-6 });
    expect(hot.meltingTime!).toBeLessThan(a.meltingTime!);
    expect(thick.meltingTime).toBeNull();
  });
  it('short high-current heating approaches constant pre-arcing I²t', () => {
    const a = fuseRun({ ...fuseDefaults(), current: 4 }),
      b = fuseRun({ ...fuseDefaults(), current: 8 });
    expect(Math.abs(a.meltingI2t! / b.meltingI2t! - 1)).toBeLessThan(0.05);
    expect(a.meltingTime! / b.meltingTime!).toBeCloseTo(4, 0);
  });
  it('grid refinement converges on the melting time and never invents post-melting current clearing', () => {
    const a = fuseRun(fuseDefaults()),
      b = fuseRun({ ...fuseDefaults(), cells: 80 });
    expect(Math.abs(a.meltingTime! / b.meltingTime! - 1)).toBeLessThan(0.02);
    const stopped = fuseAt(a, 100);
    expect(stopped.time).toBe(a.meltingTime);
    expect(stopped.current).toBe(a.parameters.current);
  });
});
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FilmContext } from '../components/lab/FilmContext';
import ElectricFuse from '../components/experiments/ElectricFuse';
it('executes all film chapters and exploration without invalid thermal or plot output', () => {
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
      expect(
        renderToStaticMarkup(
          createElement(FilmContext.Provider, { value }, createElement(ElectricFuse)),
        ),
      ).not.toMatch(/NaN|Infinity/);
    }
  expect(renderToStaticMarkup(createElement(ElectricFuse))).not.toMatch(/NaN|Infinity/);
});

it('converges to the independent absolute steady temperature with linear resistivity and isothermal ends', () => {
  const p = { ...fuseDefaults(), current: 1, duration: 2 },
    m = FUSE_SILVER,
    area = Math.PI * (p.diameter / 2) ** 2,
    kappa = (p.current / area) * Math.sqrt((m.resistivity * m.alpha) / m.conductivity);
  const exact = 20 + (1 / Math.cos((kappa * m.length) / 2) - 1) / m.alpha;
  const coarse = fuseRun(p).frames.at(-1)!.maximum,
    fine = fuseRun({ ...p, cells: 80 }).frames.at(-1)!.maximum;
  expect(exact).toBeCloseTo(212.864184886, 6);
  expect(Math.abs(coarse - exact)).toBeLessThan(0.1);
  expect(Math.abs(fine - exact)).toBeLessThan(0.03);
  expect(Math.abs(fine - exact)).toBeLessThan(Math.abs(coarse - exact) / 3.5);
});
