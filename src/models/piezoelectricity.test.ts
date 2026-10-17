import { describe, it, expect } from 'vitest';
import {
  piezoDefaults,
  piezoSensor,
  piezoActuator,
  piezoVoltageSegment,
  piezoShot,
} from './piezoelectricity';
describe('reciprocal small-signal piezo plate with parallel leakage', () => {
  it('ideal isolation converts force into charge and voltage independent of ramp time', () => {
    for (const ramp of [0.1, 4]) {
      const p = { ...piezoDefaults(), resistance: Infinity, ramp },
        s = piezoSensor(p, ramp);
      expect(s.voltage).toBeCloseTo(15, 10);
      expect(s.sourceCharge).toBeCloseTo(s.storedCharge, 18);
      expect(s.leakedCharge).toBeCloseTo(0, 18);
    }
  });
  it('held force stays constant while voltage decays with RC', () => {
    const p = piezoDefaults(),
      a = piezoSensor(p, p.ramp),
      b = piezoSensor(p, p.ramp + 2);
    expect(b.force).toBe(a.force);
    expect(b.voltage / a.voltage).toBeCloseTo(Math.exp(-1), 12);
  });
  it('charge source balances stored plus integrated resistor charge', () => {
    const p = piezoDefaults(),
      end = 6.5,
      n = 50000,
      dt = end / n;
    let charge = 0;
    for (let i = 0; i < n; i++) charge += piezoSensor(p, (i + 0.5) * dt).current * dt;
    const s = piezoSensor(p, end);
    expect(s.sourceCharge - s.storedCharge).toBeCloseTo(charge, 12);
  });
  it('release after a hold reverses voltage without tensile force', () => {
    const p = piezoDefaults(),
      s = piezoSensor(p, 6.3);
    expect(s.force).toBeCloseTo(0, 9);
    expect(s.voltage).toBeLessThan(-13);
  });
  it('slower force changes and lower input resistance reduce the sensed peak', () => {
    const p = piezoDefaults(),
      fast = piezoSensor(p, 0.1);
    expect(piezoSensor({ ...p, ramp: 4 }, 4).voltage).toBeLessThan(fast.voltage / 2);
    expect(piezoSensor({ ...p, resistance: 1e8 }, 1).voltage).toBeLessThan(
      piezoSensor(p, 1).voltage / 10,
    );
  });
  it('reciprocal displacement, stiffness and ODE share the same coefficients', () => {
    const p = piezoDefaults(),
      a = piezoActuator(p, 20),
      b = piezoActuator(p, -20);
    expect(a.compression).toBeCloseTo(-b.compression, 18);
    expect(a.compression).toBeCloseTo(-6e-9, 18);
    const s = piezoSensor(p, 0.05),
      h = 1e-7,
      derivative = (piezoSensor(p, 0.05 + h).voltage - piezoSensor(p, 0.05 - h).voltage) / (2 * h);
    expect(p.capacitance * derivative + s.voltage / p.resistance).toBeCloseTo(
      p.d * s.forceRate,
      12,
    );
    expect(s.compression).toBeCloseTo(s.force / p.stiffness - p.d * s.voltage, 18);
    expect(piezoSensor(s, 0.05).voltage).toBeCloseTo(s.voltage, 12);
  });
  it('rejects unstable coupling and has continuous ramp/hold/release boundaries', () => {
    const p = piezoDefaults();
    expect(() => piezoSensor({ ...p, d: 1 }, 1)).toThrow();
    for (const q of [0.1, 6.1, 6.3])
      expect(
        Math.abs(piezoSensor(p, q - 1e-9).voltage - piezoSensor(p, q + 1e-9).voltage),
      ).toBeLessThan(1e-6);
    expect(piezoVoltageSegment(2, 0, 0, p)).toBe(2);
  });
});
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FilmContext } from '../components/lab/FilmContext';
import Piezoelectricity from '../components/experiments/Piezoelectricity';
it('executes all film chapters and exploration without invalid geometry', () => {
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
        createElement(FilmContext.Provider, { value }, createElement(Piezoelectricity)),
      );
      expect(html).not.toMatch(/NaN|Infinity/);
      expect(86 + piezoShot(chapter, progress).compression * 9.75e8).toBeLessThan(151);
    }
  expect(renderToStaticMarkup(createElement(Piezoelectricity))).not.toMatch(/NaN|Infinity/);
});
