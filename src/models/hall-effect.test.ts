import { describe, it, expect } from 'vitest';
import { hallDefaults, hallEffect, HALL_CHARGE, hallDriftDistance, hallShot } from './hall-effect';
describe('single-carrier Hall balance with explicit probe convention', () => {
  it('matches the independent Hall coefficient benchmark and lower-minus-upper probes', () => {
    const s = hallEffect(hallDefaults());
    expect(s.hallVoltage).toBeCloseTo(-0.002496603629784305, 14);
    expect(s.hallVoltage).toBeCloseTo(
      (s.current * s.field) / (s.density * -HALL_CHARGE * s.thickness),
      14,
    );
    expect(s.drift).toBeLessThan(0);
  });
  it('electric and magnetic forces cancel transversely in steady state', () => {
    for (const carrier of [-1, 1] as const) {
      const s = hallEffect({ ...hallDefaults(), carrier });
      expect(s.electricForce + s.magneticForce).toBeCloseTo(0, 30);
      expect(s.magneticForce).toBeLessThan(0);
      expect(s.hallField).toBeCloseTo(s.drift * s.field, 12);
    }
  });
  it('carrier sign flips voltage and drift, but not magnetic force at fixed conventional current', () => {
    const a = hallEffect(hallDefaults()),
      b = hallEffect({ ...hallDefaults(), carrier: 1 });
    expect(a.hallVoltage).toBe(-b.hallVoltage);
    expect(a.drift).toBe(-b.drift);
    expect(a.magneticForce).toBe(b.magneticForce);
  });
  it('reversing either current or magnetic field reverses Hall voltage; reversing both restores it', () => {
    const p = hallDefaults(),
      v = hallEffect(p).hallVoltage;
    expect(hallEffect({ ...p, current: -p.current }).hallVoltage).toBe(-v);
    expect(hallEffect({ ...p, field: -p.field }).hallVoltage).toBe(-v);
    expect(hallEffect({ ...p, current: -p.current, field: -p.field }).hallVoltage).toBe(v);
  });
  it('width cancels from voltage while density and thickness retain inverse scaling', () => {
    const p = hallDefaults(),
      s = hallEffect(p);
    expect(hallEffect({ ...p, width: p.width * 2 }).hallVoltage).toBeCloseTo(s.hallVoltage, 14);
    expect(hallEffect({ ...p, density: p.density * 2 }).hallVoltage).toBeCloseTo(
      s.hallVoltage / 2,
      14,
    );
    expect(hallEffect({ ...p, thickness: p.thickness * 2 }).hallVoltage).toBeCloseTo(
      s.hallVoltage / 2,
      14,
    );
  });
  it('zero field removes the transverse signal but keeps longitudinal conduction', () => {
    const s = hallEffect({ ...hallDefaults(), field: 0 });
    expect(s.hallVoltage).toBe(0);
    expect(s.power).toBeGreaterThan(0);
    expect(hallEffect(s).power).toBe(s.power);
    expect(() => hallEffect({ ...hallDefaults(), density: 0 })).toThrow();
  });
});

it('the tracer distance derivative follows the changing model drift velocity', () => {
  const h = 1e-6;
  for (const u of [0.1, 0.5, 0.9]) {
    const velocity = (hallDriftDistance(5, u + h) - hallDriftDistance(5, u - h)) / (2 * h * 0.02);
    expect(velocity).toBeCloseTo(hallShot(5, u).drift, 8);
  }
});

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FilmContext } from '../components/lab/FilmContext';
import HallEffect from '../components/experiments/HallEffect';
it('executes authored chapter boundaries and default exploration with finite markup', () => {
  for (let chapter = 0; chapter < 6; chapter++)
    for (const progress of [0, 0.5, 1]) {
      const html = renderToStaticMarkup(
        createElement(
          FilmContext.Provider,
          {
            value: {
              watch: true,
              playing: false,
              time: chapter * 24 + progress * 24,
              chapter,
              run: 0,
              duration: 144,
              chapters: [],
              chapterTime: progress * 24,
              chapterProgress: progress,
            },
          },
          createElement(HallEffect),
        ),
      );
      expect(html).not.toMatch(/NaN|Infinity/);
      expect(html).toContain('hall-sample');
    }
  expect(renderToStaticMarkup(createElement(HallEffect))).toContain('hall-controls');
});
