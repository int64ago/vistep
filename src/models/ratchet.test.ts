import { describe, it, expect } from 'vitest';
import { ratchetState, ratchetSeat, ratchetVertices } from './ratchet';
describe('finite sliding-pawl ratchet', () => {
  it('has independently known 12-tooth pitch and rollback before the last stop', () => {
    const s = ratchetState((49.5 * Math.PI) / 180, (40 * Math.PI) / 180);
    expect((s.pitch * 180) / Math.PI).toBeCloseTo(30);
    expect((s.output * 180) / Math.PI).toBeCloseTo(30);
    expect((s.actualRollback * 180) / Math.PI).toBeCloseTo(19.5);
    expect(s.blocked).toBe(true);
  });
  it('allows a partial reverse within backlash, but no passage through the last tooth', () => {
    const s = ratchetState(0.7, 0.1);
    expect(s.output).toBeCloseTo(0.6);
    expect(s.blocked).toBe(false);
    for (let a = 0.01; a < 7; a += 0.037) {
      const s = ratchetState(a, Math.PI);
      expect(s.output).toBeGreaterThanOrEqual(s.stop);
      expect(s.backlash).toBeLessThan(s.pitch + 1e-10);
    }
  });
  it('changes lost motion at the same 22 degree history with 12 versus 24 teeth', () => {
    const a = (22 * Math.PI) / 180,
      b = Math.PI / 6;
    expect(ratchetState(a, b, 12).output).toBeCloseTo(0);
    expect(ratchetState(a, b, 24).output).toBeCloseTo(Math.PI / 12);
  });
  it('releases only after the finite pawl clears the whole tooth-tip envelope', () => {
    const a = 0.7,
      b = 0.5,
      s = ratchetState(a, b, 12, 1);
    expect(s.released).toBe(true);
    expect(s.pawlBottom).toBeGreaterThan(1);
    expect(s.output).toBeCloseTo(a - b);
    expect(ratchetState(a, b).released).toBe(false);
  });
  it('keeps the flat pawl above every edge inside its footprint while touching one edge', () => {
    for (const n of [12, 18, 24])
      for (let a = 0.002; a < 2 * Math.PI; a += 0.021) {
        const p = ratchetSeat(a, n),
          v = ratchetVertices(a, n);
        let min = Infinity;
        for (let i = 0; i < v.length; i++) {
          const A = v[i],
            B = v[(i + 1) % v.length];
          for (let j = 0; j <= 40; j++) {
            const f = j / 40,
              x = A.x + (B.x - A.x) * f,
              y = A.y + (B.y - A.y) * f;
            if (x > 1e-8 && x < 0.075) expect(y).toBeLessThanOrEqual(p.y + 1e-8);
          }
          const dx = B.x - A.x,
            dy = B.y - A.y,
            f = Math.max(
              0,
              Math.min(1, ((p.x - A.x) * dx + (p.y - A.y) * dy) / (dx * dx + dy * dy)),
            );
          min = Math.min(min, Math.hypot(p.x - A.x - f * dx, p.y - A.y - f * dy));
        }
        expect(min).toBeLessThan(1e-10);
      }
  });
  it('has a real vertical locking face overlapping the pawl and rejects invalid state', () => {
    const s = ratchetState(Math.PI / 6, 1);
    const candidates = s.vertices.filter((p) => Math.abs(p.x) < 1e-9 && p.y > 0);
    expect(candidates.some((p) => Math.abs(p.y - 1) < 1e-9)).toBe(true);
    expect(candidates.some((p) => Math.abs(p.y - 0.82) < 1e-9)).toBe(true);
    expect(s.pawlBottom).toBeLessThan(1);
    expect(s.pawlBottom + s.pawlLength).toBeGreaterThan(1);
    expect(() => ratchetState(-1, 0)).toThrow();
    expect(() => ratchetState(1, 0, 11)).toThrow();
  });
});
