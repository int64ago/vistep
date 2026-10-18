import { describe, it, expect } from 'vitest';
import {
  fullGlass,
  tautThread,
  threadLoop,
  sessileDrop,
  floatingNeedle,
} from './surface-tension-lab';
describe('liquid surface experiments', () => {
  it('conserves displaced volume and pins the meniscus rim', () => {
    for (const n of [0, 10, 30, 60]) {
      const s = fullGlass(n);
      expect(s.heldVolume + s.overflow).toBeCloseTo(s.addedVolume, 14);
      expect(s.profile(s.radius)).toBeCloseTo(0, 14);
    }
    expect(fullGlass(60).overflow).toBeGreaterThan(0);
    const a = fullGlass(20);
    const dr = a.radius / 10000;
    let integrated = 0;
    for (let i = 0; i < 10000; i++) {
      const r = (i + 0.5) * dr;
      integrated += 2 * Math.PI * r * a.profile(r) * dr;
    }
    expect(integrated).toBeCloseTo(a.heldVolume, 12);
  });
  it('keeps the thread and loop lengths fixed during shape change', () => {
    for (const p of [0, 0.3, 0.6, 1]) {
      const a = tautThread(p),
        length = a.slice(1).reduce((s, q, i) => s + Math.hypot(q.x - a[i].x, q.y - a[i].y), 0);
      expect(length).toBeCloseTo(230, 8);
      const b = threadLoop(p);
      expect(
        b.reduce((s, q, i) => {
          const z = b[(i + 1) % b.length];
          return s + Math.hypot(q.x - z.x, q.y - z.y);
        }, 0),
      ).toBeCloseTo(2 * Math.PI * 40, 8);
    }
  });
  it('changes contact angle while keeping drop volume fixed', () => {
    for (const angle of [20, 35, 90, 110, 140]) {
      const d = sessileDrop(angle);
      expect(Math.PI * d.height * d.height * (d.radius - d.height / 3)).toBeCloseTo(5e-9, 16);
    }
    expect(sessileDrop(35).base).toBeGreaterThan(sessileDrop(110).base);
  });
  it('loses needle support after the interface is broken', () => {
    expect(floatingNeedle().stable).toBe(true);
    const s = floatingNeedle(0.072, true, 1);
    expect(s.stable).toBe(false);
    expect(s.buoyancy).toBeLessThan(s.weight);
    expect(s.sink).toBeGreaterThan(0);
    expect(floatingNeedle(0.02).stable).toBe(false);
  });
});
