import { expect, it } from 'vitest';
import {
  weberResponse,
  binaryPulsar,
  inspiral,
  interferometerStrain,
} from './gravitational-wave-lab';
it('resonant bar response scales with strain and peaks near resonance', () => {
  const r = weberResponse();
  expect(r.amplitude).toBeCloseTo((1.5e-18 * 1000) / 2, 25);
  expect(r.amplitude / weberResponse(1600).amplitude).toBeGreaterThan(50);
  expect(weberResponse(1660, 0).amplitude).toBe(0);
});
it('gives a physically plausible Hulse–Taylor orbital decay and quadratic advance', () => {
  const x = binaryPulsar(30);
  expect(x.pdot).toBeCloseTo(-2.4025e-12, 15);
  expect(x.advance).toBeLessThan(-30);
  expect(binaryPulsar(20).advance / binaryPulsar(10).advance).toBeCloseTo(4);
});
it('inspiral increases frequency and amplitude without pretending to compute merger', () => {
  expect(inspiral(0.29).frequency).toBeGreaterThan(inspiral(0).frequency);
  expect(inspiral(0.29).envelope).toBeGreaterThan(inspiral(0).envelope);
  expect(inspiral(1)).toEqual(inspiral(0.295));
});
it('differential arm length is Lh, with opposite half-strains', () => {
  const x = interferometerStrain(1e-21);
  expect(x.dx).toBeCloseTo(2e-18, 28);
  expect(x.dy).toBe(-x.dx);
  expect(x.difference).toBeCloseTo(4e-18, 28);
});
