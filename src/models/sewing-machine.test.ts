import { describe, it, expect } from 'vitest';
import {
  SEWING as S,
  SEWING_NEEDLE_WINDOW,
  sewingPose,
  sewingNeedle,
  sewingHook,
  sewingDistance,
  sewingCaseClearance,
  sewingShot,
  sewingInitial,
  sewingInterlock,
  sewingCamera,
  type SewingPoint,
} from './sewing-machine';
const sub = (a: SewingPoint, b: SewingPoint) => a.map((x, i) => x - b[i]) as SewingPoint;
const dot = (a: SewingPoint, b: SewingPoint) => a.reduce((v, x, i) => v + x * b[i], 0);
function segmentDistance(p: SewingPoint, q: SewingPoint, a: SewingPoint, b: SewingPoint) {
  // Closest points on closed segments, including degenerate endpoints.
  const d1 = sub(q, p),
    d2 = sub(b, a),
    r = sub(p, a),
    aa = dot(d1, d1),
    e = dot(d2, d2),
    f = dot(d2, r);
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  let s = 0,
    t = 0;
  if (aa < 1e-18 && e < 1e-18) return sewingDistance(p, a);
  if (aa < 1e-18) t = clamp(f / e);
  else {
    const c = dot(d1, r);
    if (e < 1e-18) s = clamp(-c / aa);
    else {
      const bb = dot(d1, d2),
        den = aa * e - bb * bb;
      s = den ? clamp((bb * f - c * e) / den) : 0;
      t = (bb * s + f) / e;
      if (t < 0) {
        t = 0;
        s = clamp(-c / aa);
      } else if (t > 1) {
        t = 1;
        s = clamp((bb - c) / aa);
      }
    }
  }
  return Math.hypot(...p.map((v, i) => v + s * d1[i] - a[i] - t * d2[i]));
}
describe('sewing-machine independent cycle', () => {
  it('preserves the crank radius and rod length over a cycle, including dead centres', () => {
    for (let i = 0; i <= 1000; i++) {
      const n = sewingNeedle(i / 1000);
      expect(sewingDistance(n.crankPin, [0, S.shaftY, S.needleZ])).toBeCloseTo(S.crank, 11);
      expect(sewingDistance(n.crankPin, n.joint)).toBeCloseTo(S.rod, 11);
      expect(n.joint[0]).toBe(0);
    }
    expect(sewingNeedle(0).eye - sewingNeedle(0.5).eye).toBeCloseTo(2 * S.crank, 12);
    expect(sewingNeedle(0).eye).toBeCloseTo(sewingNeedle(1).eye, 12);
  });
  it('makes exactly two hook revolutions for one needle stroke; pickup is on the rise', () => {
    expect(sewingHook(1).angle - sewingHook(0).angle).toBeCloseTo(4 * Math.PI, 12);
    const pass = S.capture - (0.13 + 0.14) / (4 * Math.PI),
      n = sewingNeedle(pass),
      h = sewingHook(pass);
    expect(pass).toBeGreaterThan(0.5);
    expect(n.eye).toBeGreaterThan(sewingNeedle(0.5).eye);
    expect(h.tip[0]).toBeCloseTo(0, 12);
    expect(h.tip[1] - n.eye).toBeGreaterThan(0.06);
    expect(h.tip[1] - n.eye).toBeLessThan(0.2);
    expect(0.575 - h.tip[2]).toBeGreaterThan(S.threadRadius);
  });
  it('keeps the actual captured bight on the moving hook throat', () => {
    for (let i = 0; i <= 200; i++) {
      const p = sewingPose(S.capture + ((S.release - S.capture) * i) / 200);
      expect(sewingDistance(p.core[54], p.hook.throat)).toBeLessThan(1e-12);
    }
  });
  it('advances fabric only with the needle clear and the stitch tightened', () => {
    for (const pitch of [0.35, 0.6, 0.85])
      for (let i = 1; i <= 1000; i++) {
        const p = sewingPose(i / 1000, pitch),
          prev = sewingPose((i - 1) / 1000, pitch);
        if (p.feed > prev.feed + 1e-12) {
          expect(p.needleClear).toBe(true);
          expect(p.complete).toBe(true);
          expect(p.dogTop).toBeCloseTo(-0.01, 10);
        }
        expect(p.feed).toBeGreaterThanOrEqual(prev.feed);
      }
    expect(sewingPose(1, 0.85).feed).toBe(0.85);
    expect(sewingPose(1).dogX).toBeCloseTo(-S.pitch);
  });
  it('threads the real eye and never routes the upper thread through the solid case envelope', () => {
    let clearance = Infinity;
    for (let k = 0; k <= 1000; k++) {
      const p = sewingPose(k / 1000);
      expect(p.eyeFront[1]).toBe(p.needle.eye);
      expect(p.eyeBack[1]).toBe(p.needle.eye);
      expect(p.eyeFront[0]).toBe(0);
      for (let i = 1; i < p.core.length; i++)
        for (let j = 0; j <= 2; j++) {
          const v = p.core[i].map(
            (x, d) => x * (j / 2) + p.core[i - 1][d] * (1 - j / 2),
          ) as SewingPoint;
          clearance = Math.min(clearance, sewingCaseClearance(v));
        }
    }
    expect(clearance).toBeGreaterThan(0.025);
  });
  it('keeps the routed upper loop disjoint from the lower supply and seam', () => {
    let minimum = Infinity,
      phase = 0,
      indices: number[] = [];
    for (let k = 0; k <= 500; k++) {
      const p = sewingPose(k / 500);
      const lower = p.lower.slice(80);
      const upper = [p.eyeBack, ...p.core, p.returnLip, p.clothReturn];
      for (let i = 1; i < upper.length; i++)
        for (let j = 1; j < lower.length; j++) {
          const d = segmentDistance(upper[i - 1], upper[i], lower[j - 1], lower[j]);
          if (d < minimum) {
            minimum = d;
            phase = p.phase;
            indices = [i, j];
          }
        }
    }
    expect(minimum, JSON.stringify({ phase, indices })).toBeGreaterThan(2 * S.threadRadius);
  });
  it('routes the loop outside the supporting rear cup and inside the outer basket', () => {
    for (let k = 0; k <= 1000; k++) {
      const p = sewingPose(k / 1000);
      for (const v of p.core) {
        const r = Math.hypot(v[0], v[1] - S.caseY);
        if (v[2] > -0.55 && v[2] < 0.48) expect(r + S.threadRadius).toBeLessThan(1.1);
        if (v[2] > S.bearingCupRear - S.threadRadius && v[2] < S.bearingCupFront + S.threadRadius)
          expect(r - S.threadRadius).toBeGreaterThan(S.bearingCupRadius);
      }
    }
    expect(S.raceRadius - S.caseRadius).toBeCloseTo(0.005, 12);
    expect(S.bearingCupRear).toBeLessThan(-0.6 + 0.065 / 2);
    for (const phase of SEWING_NEEDLE_WINDOW)
      expect(sewingNeedle(phase).tip).toBeCloseTo(S.fabricTop, 12);
  });
  it('keeps the needle bar inside both guide bores and the take-up arm at constant length', () => {
    for (let k = 0; k <= 200; k++) {
      const p = sewingPose(k / 200);
      for (const y of [1.97, 2.53]) {
        expect(p.needle.eye + 0.4).toBeLessThan(y - 0.09);
        expect(p.needle.eye + 3.8).toBeGreaterThan(y + 0.09);
      }
      expect(sewingDistance(p.takeUpPivot, p.takeUpEye)).toBeCloseTo(0.82, 12);
    }
  });
  it('takes the lower thread outside the bobbin flange and through the matching case slot', () => {
    const p = sewingPose(0.75),
      radial = p.lower[81],
      outlet = p.lower[82];
    expect(Math.hypot(radial[0], radial[1] - S.caseY) - S.threadRadius).toBeGreaterThan(
      S.bobbinFlangeRadius,
    );
    expect(Math.hypot(outlet[0], outlet[1] - S.caseY) + S.threadRadius).toBeLessThan(0.69);
    const angle = Math.atan2(outlet[0], outlet[1] - S.caseY);
    expect(Math.abs(angle - S.caseSlotAngle) + S.threadRadius / outlet[0]).toBeLessThan(
      S.caseSlotHalfAngle,
    );
    expect(radial[2] + S.threadRadius).toBeLessThan(0.2075);
  });
  it('has continuous point identities at pickup, release, case clearance and tightening', () => {
    for (const phase of [S.capture, S.release, S.clearCase, S.tight, S.feedStart, S.feedEnd]) {
      const a = sewingPose(phase - 1e-7),
        b = sewingPose(phase + 1e-7);
      expect(a.upper.length).toBe(b.upper.length);
      expect(Math.max(...a.upper.map((v, i) => sewingDistance(v, b.upper[i])))).toBeLessThan(
        0.0001,
      );
    }
  });
  it('leaves a U interlock around the lower seam and changes only the requested pitch', () => {
    for (const pitch of [0.35, 0.85]) {
      const p = sewingPose(1, pitch);
      for (let i = 0; i < p.core.length; i++)
        expect(
          sewingDistance(p.core[i], sewingInterlock(-0.12 - pitch, i / (p.core.length - 1))),
        ).toBeLessThan(1e-12);
      expect(p.needle).toEqual(sewingPose(1, 0.6).needle);
      expect(p.hook).toEqual(sewingPose(1, 0.6).hook);
    }
    expect(sewingInterlock(0, 0.5)[1]).toBeLessThan(0);
    expect(sewingInterlock(0, 0)[2]).toBeLessThan(0.62);
    expect(sewingInterlock(0, 1)[2]).toBeGreaterThan(0.62);
  });
  it('reconstructs every chapter on direct seek without a history or hidden random state', () => {
    for (let ch = 0; ch < 8; ch++)
      for (const p of [0, 0.19, 0.5, 0.91, 1]) {
        const a = sewingShot(ch, p);
        sewingShot(7, 1);
        sewingShot(0, 0);
        expect(sewingShot(ch, p)).toEqual(a);
      }
    for (let ch = 0; ch < 6; ch++)
      expect(sewingShot(ch, 1).pose).toEqual(sewingShot(ch + 1, 0).pose);
    expect(sewingInitial()).toEqual({ phase: 0, pitch: 0.6, view: 'cutaway' });
  });
  it('fits every declared assembly/cutaway corner through the actual perspective camera', () => {
    const dot = (a: SewingPoint, b: SewingPoint) => a.reduce((sum, v, i) => sum + v * b[i], 0);
    for (const aspect of [280 / 350, 1080 / 475])
      for (let ch = 0; ch < 8; ch++)
        for (const q of [0, 0.5, 1]) {
          const p = sewingShot(ch, q),
            c = sewingCamera(p.pose, p.focus, q, aspect);
          for (const corner of c.corners) {
            const v = sub(corner, c.target),
              depth = c.distance - dot(v, c.direction);
            expect((Math.abs(dot(v, c.right)) * c.cot) / depth / aspect).toBeLessThanOrEqual(
              0.85000001,
            );
            expect((Math.abs(dot(v, c.up)) * c.cot) / depth).toBeLessThanOrEqual(0.85000001);
          }
        }
  });
  it('rejects nonfinite and invalid input and stays finite at all valid extremes', () => {
    for (const args of [
      [NaN, 0.6],
      [Infinity, 0.6],
      [-0.1, 0.6],
      [1.1, 0.6],
      [0, 0],
      [0, 1],
    ])
      expect(() => sewingPose(...(args as [number, number]))).toThrow(RangeError);
    for (const phase of [0, 0.5, 1])
      for (const pitch of [0.35, 0.85])
        for (const p of [...sewingPose(phase, pitch).upper, ...sewingPose(phase, pitch).lower])
          expect(p.every(Number.isFinite)).toBe(true);
  });
});
