import { describe, it, expect } from 'vitest';
import {
  evaporationSaturation,
  evaporationParameters,
  evaporationFlux,
  evaporationEquilibrium,
  evaporationHistory,
} from './evaporative-cooling';
describe('evaporating liquid control volume', () => {
  it('matches independently published rounded NIST saturation examples', () => {
    for (const [t, p] of [
      [20, 2339],
      [40, 7384],
      [50, 12351],
      [100, 101418],
    ])
      expect(Math.abs(evaporationSaturation(t) - p)).toBeLessThan(0.51);
  });
  it('starts cooling below boiling, while saturation and a closed mass path are exact counterexamples', () => {
    expect(evaporationFlux(30).net).toBeLessThan(0);
    expect(evaporationFlux(30, { humidity: 1 })).toMatchObject({
      massRate: 0,
      heat: 0,
      latent: 0,
      net: 0,
    });
    expect(evaporationHistory({ open: false }).at(-1)!.temperature).toBe(30);
  });
  it('equilibrium lies between dewpoint and dry temperature, humid air reduces depression', () => {
    const dry = evaporationEquilibrium({ humidity: 0.2 }),
      wet = evaporationEquilibrium({ humidity: 0.8 });
    expect(dry).toBeLessThan(wet);
    expect(wet).toBeLessThan(30);
    expect(evaporationFlux(dry, { humidity: 0.2 }).net).toBeCloseTo(0, 10);
    expect(evaporationSaturation(dry)).toBeGreaterThan(0.2 * evaporationSaturation(30));
  });
  it('coupled heat/mass flow multiplier changes transient speed but not equilibrium', () => {
    expect(evaporationEquilibrium({ flow: 0.5 })).toBeCloseTo(
      evaporationEquilibrium({ flow: 2 }),
      12,
    );
    const slow = evaporationHistory({ flow: 0.5 }, 300).at(-1)!,
      fast = evaporationHistory({ flow: 2 }, 300).at(-1)!;
    expect(fast.temperature).toBeLessThan(slow.temperature);
  });
  it('conserves integrated open-volume energy and mass independently', () => {
    const o = { humidity: 0.2 },
      p = evaporationParameters(o),
      q = evaporationHistory(o, 900, 0.5).at(-1)!;
    const deltaU = p.cp * (q.mass * q.temperature - p.mass * p.initial);
    expect(deltaU - (q.heat - q.latent - q.sensibleOut)).toBeCloseTo(0, 5);
    expect(p.mass - q.mass).toBeCloseTo(q.latent / p.latent, 12);
    expect(q.mass).toBeGreaterThan(0);
    expect(q.temperature).toBeGreaterThan(evaporationEquilibrium(o));
  });
  it('cold wet surface condenses, gains mass and receives latent heat; RK4 converges', () => {
    const o = { initial: 12, humidity: 0.8 },
      f = evaporationFlux(12, o);
    expect(f.massRate).toBeLessThan(0);
    expect(f.latent).toBeLessThan(0);
    expect(f.net).toBeGreaterThan(0);
    const a = evaporationHistory(o, 180, 2).at(-1)!,
      b = evaporationHistory(o, 180, 1).at(-1)!;
    expect(a.temperature).toBeGreaterThan(12);
    expect(a.mass).toBeGreaterThan(0.02);
    expect(a.temperature).toBeCloseTo(b.temperature, 7);
    expect(() => evaporationParameters({ humidity: 2 })).toThrow();
    expect(() => evaporationSaturation(-1)).toThrow();
  });
});
