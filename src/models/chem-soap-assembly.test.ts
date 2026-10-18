import { describe, it, expect } from 'vitest';
import {
  saponify,
  saltOut,
  washCurd,
  hardWater,
  amphiphile,
  oilLift,
  esterGeometry,
} from './chem-soap-assembly';
describe('soap chemistry and interfaces', () => {
  it('conserves glycerol and three acyl groups through saponification', () => {
    for (const p of [0, 0.3, 1]) {
      const s = saponify(p);
      expect(s.triglyceride + s.glycerol).toBe(1);
      expect(s.triglyceride * 3 + s.soap).toBeCloseTo(3);
      expect(s.soap + s.hydroxide).toBeCloseTo(3);
      for (let i = 0; i < 3; i++)
        expect(esterGeometry(i, p).glycerolOxygen).toEqual(esterGeometry(i, 0).glycerolOxygen);
    }
  });
  it('separates phases without losing soap; removes residual liquor and accounts for calcium', () => {
    for (const salt of [0, 0.3, 1]) {
      const s = saltOut(3, salt);
      expect(s.curd + s.dissolved).toBeCloseTo(3);
    }
    expect(washCurd(3)).toBeLessThan(washCurd(1));
    for (const ca of [0, 0.3, 2]) {
      const h = hardWater(3, ca);
      expect(h.active + 2 * h.calciumSoap).toBeCloseTo(3);
      expect(h.calcium + h.calciumSoap).toBe(ca);
    }
  });
  it('puts heads outside oil and tail ends inside from the very same interface geometry', () => {
    for (const agitation of [0, 0.4, 1]) {
      const o = oilLift(1, agitation, 3);
      for (let i = 0; i < 18; i++) {
        const a = amphiphile(i, 18, 1, o, o.radius);
        expect(Math.hypot(a.head.x - o.x, a.head.y - o.y)).toBeCloseTo(57);
        const tail = a.tail.at(-1)!;
        expect(Math.hypot(tail.x - o.x, tail.y - o.y)).toBeLessThan(o.radius);
      }
    }
    expect(oilLift(1, 1, 0).y).toBe(165);
  });
});
