import { describe, it, expect } from 'vitest';
import { stringEllipse, ellipseTrace } from './ellipse-string-lab';
describe('pinned-string ellipse', () => {
  it('keeps both straight thread segments at exactly the same total length', () => {
    for (const d of [0, 0.2, 0.6, 0.95])
      for (let i = 0; i < 100; i++) {
        const q = stringEllipse(i * 0.1, 1, d);
        expect(q.left + q.right).toBeCloseTo(1, 12);
      }
  });
  it('drawn points obey the ellipse equation', () => {
    for (const q of ellipseTrace(1))
      expect((q.x * q.x) / (q.a * q.a) + (q.y * q.y) / (q.b * q.b)).toBeCloseTo(1, 12);
  });
  it('coincident pins make a circle of half the thread length', () => {
    for (const q of ellipseTrace(1, 1, 0)) expect(Math.hypot(q.x, q.y)).toBeCloseTo(0.5);
  });
  it('moving pins closer increases minor axis without changing major axis', () => {
    const a = stringEllipse(1, 1, 0.6),
      b = stringEllipse(1, 1, 0.2);
    expect(a.a).toBe(b.a);
    expect(b.b).toBeGreaterThan(a.b);
  });
  it('completes a closed trace and rejects impossible geometry', () => {
    const p = ellipseTrace(1);
    expect(p[0].x).toBeCloseTo(p.at(-1)!.x);
    expect(p.at(-1)!.y).toBeCloseTo(0);
    expect(() => stringEllipse(0, 1, 1)).toThrow();
    expect(() => stringEllipse(0, Infinity, 0)).toThrow();
  });
});
