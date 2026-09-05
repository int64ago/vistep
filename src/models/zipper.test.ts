import { describe, it, expect } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import {
  ZIP,
  ZIP_GUIDE,
  ZIP_MAX,
  ZIP_MIN,
  ZIP_STOP,
  zipperPath,
  zipperTransform,
  zipperTooth,
  zipperPose,
  zipperProfile,
  zipperArea,
  zipperIntersection,
  zipperLayerParts,
  zipperSection,
  zipperHeadOutline,
  zipperInitial,
  zipperShot,
  zipperCamera,
  zipperLoad,
  zipperComparison,
  type ZipPoint,
} from './zipper';
function overlap(a: ZipPoint[][], b: ZipPoint[][]) {
  let area = 0;
  for (const p of a) for (const q of b) area += zipperArea(zipperIntersection(p, q));
  return area;
}
describe('moulded zipper geometry', () => {
  it('keeps unit-speed bead arc length through both bends', () => {
    const h = 1e-6;
    for (const u of [-1, 0.1, 0.5, 0.9, 1.2, 1.8, 2.1, 2.5, 2.9, 3.5, 14]) {
      const a = zipperPath(u - h),
        b = zipperPath(u + h);
      expect(Math.hypot(b.x - a.x, b.y - a.y) / (2 * h)).toBeCloseTo(1, 7);
    }
    for (const u of [0, 1, 2, 4.5]) {
      const a = zipperPath(u - 1e-9),
        b = zipperPath(u + 1e-9);
      expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThan(3e-9);
      expect(Math.abs(a.angle - b.angle)).toBeLessThan(2e-9);
    }
  });
  it('preserves pitch, half-pitch offset, identity and attachments', () => {
    for (const travel of [0, 0.25, 0.5, 0.75, 1]) {
      const p = zipperPose(travel);
      expect(p.teeth).toHaveLength(26);
      expect(new Set(p.teeth.map((t) => t.id)).size).toBe(26);
      for (let i = 0; i < ZIP.count; i++) {
        expect(p.teeth[i + ZIP.count].s - p.teeth[i].s).toBe(0.5);
        expect(p.teeth[i].root).toEqual(zipperTransform([0, 0], p.teeth[i].s, p.slider, -1));
        if (i) expect(p.teeth[i].s - p.teeth[i - 1].s).toBe(1);
      }
    }
  });
  it('sweeps all finite outer and middle layer parts without penetration, including same-side neighbors', () => {
    let area = 0;
    for (let step = 0; step <= 240; step++) {
      const slider = 4 + step / 240,
        teeth = ([-1, 1] as const).flatMap((side) =>
          Array.from({ length: 8 }, (_, i) => zipperTooth(i + 2, side, slider)),
        );
      for (const layer of ['outer', 'middle'] as const) {
        const parts = teeth.map((t) => t.parts(layer));
        for (let i = 0; i < parts.length; i++)
          for (let j = i + 1; j < parts.length; j++)
            area = Math.max(area, overlap(parts[i], parts[j]));
      }
    }
    expect(area).toBeLessThan(1e-9);
  });
  it('has a real head groove with wing clearance and retaining overlap', () => {
    expect(ZIP.grooveHalfHeight - ZIP.wingHalfDepth).toBeCloseTo(0.012, 12);
    expect(0.3 * 2 - ZIP.pitch / 2).toBeCloseTo(0.1, 12);
    expect(0.93).toBeLessThan(1.18);
    expect(0.5 - 0.3 - 0.12).toBeGreaterThan(0);
    expect(ZIP.boreRadius - ZIP.beadRadius).toBeGreaterThan(0.02);
  });
  it('actually inserts the opposite thin wing into the rounded recess footprint', () => {
    const section = zipperSection();
    expect(section.headTip).toBeGreaterThan(section.oppositeWing[0][0]);
    expect(section.clearance).toBeCloseTo(0.012, 12);
    const head = zipperHeadOutline().map((p) => zipperTransform(p, 6, 8, -1)),
      wing = zipperLayerParts('middle')[3].map((p) => zipperTransform(p, 6.5, 8, 1));
    expect(zipperArea(zipperIntersection(head, wing))).toBeGreaterThan(0.001);
    const r = ZIP.bendLength / ZIP.angle;
    expect(r - Math.sqrt(r * r - 0.23 * 0.23) + ZIP.beadRadius).toBeLessThan(ZIP.boreRadius);
  });
  it('places both shoulder reactions on matching closed faces', () => {
    const left = zipperTooth(6, -1, 8),
      lower = zipperTooth(5, 1, 8),
      upper = zipperTooth(6, 1, 8);
    expect(left.angle).toBe(0);
    for (const neighbour of [lower, upper]) {
      expect(neighbour.angle).toBe(0);
      expect(overlap(left.parts('outer'), neighbour.parts('outer'))).toBeLessThan(1e-12);
    }
    expect(zipperTransform([0.88, 0], 6, 8, -1)[0]).toBeCloseTo(0, 12);
    expect(zipperTransform([0.88, 0], 6.5, 8, 1)[0]).toBeCloseTo(0, 12);
  });
  it('blocks transverse translation with a shoulder, but not the declared counterfactual', () => {
    for (const delta of [0.001, 0.02, 0.08, 0.15]) {
      const a = zipperLayerParts('outer').map((poly) =>
        poly.map(([x, y]) => [x - ZIP.beadHalfGap - delta, y] as ZipPoint),
      );
      const b = zipperLayerParts('outer').map((poly) =>
        poly.map(([x, y]) => [ZIP.beadHalfGap - x + delta, y + 0.5] as ZipPoint),
      );
      expect(overlap(a, b)).toBeGreaterThan(0);
    }
    for (let i = 0; i <= 50; i++) {
      const d = (0.45 * i) / 50,
        a = zipperLayerParts('outer', false).map((poly) =>
          poly.map(([x, y]) => [x - ZIP.beadHalfGap - d, y] as ZipPoint),
        ),
        b = zipperLayerParts('outer', false).map((poly) =>
          poly.map(([x, y]) => [ZIP.beadHalfGap - x + d, y + 0.5] as ZipPoint),
        );
      expect(overlap(a, b)).toBeLessThan(1e-10);
    }
  });
  it('keeps the complete finite tooth sweep within the derived Y tunnel', () => {
    let violation = 0;
    for (let k = 0; k <= 500; k++) {
      const u = -1.5 + k * 0.011,
        poly = zipperProfile().map((p) => zipperTransform(p, u, 0, 1));
      for (const [x, y] of poly) {
        if (y < ZIP.bodyLow || y > ZIP.bodyHigh) continue;
        const index = Math.min(
            73,
            Math.floor(((y - ZIP.bodyLow) / (ZIP.bodyHigh - ZIP.bodyLow)) * 74),
          ),
          a = ZIP_GUIDE.sections[index],
          b = ZIP_GUIDE.sections[index + 1],
          f = (y - a.y) / (b.y - a.y),
          outer = a.outer + (b.outer - a.outer) * f,
          inner = a.inner + (b.inner - a.inner) * f;
        violation = Math.max(violation, x - outer, inner - Math.abs(x));
      }
    }
    expect(violation).toBeLessThan(1e-9);
  });
  it('derives travel limits from connected bottom and top stop contact', () => {
    expect(ZIP_MIN + ZIP.bodyLow).toBeCloseTo(ZIP.bottomStopY + ZIP.bottomStopHalfHeight, 12);
    const inside = ZIP_STOP.map((p) => zipperTransform(p, ZIP.stopS, ZIP_MAX + 0.001, 1)),
      outside = ZIP_STOP.map((p) => zipperTransform(p, ZIP.stopS, ZIP_MAX - 0.001, 1));
    const body = (s: number) => ZIP_GUIDE.outline.map(([x, y]) => [x, y + s] as ZipPoint);
    expect(zipperArea(zipperIntersection(body(ZIP_MAX + 0.001), inside))).toBeGreaterThan(1e-7);
    expect(zipperArea(zipperIntersection(body(ZIP_MAX - 0.001), outside))).toBeLessThan(1e-10);
    expect(ZIP_MAX).toBeGreaterThan(9);
    expect(ZIP_MAX).toBeLessThan(12);
  });
});
describe('load assumptions and director', () => {
  it('balances the declared symmetric normalized load without inventing elastic displacement', () => {
    for (const f of [0, 0.1, 0.5, 1]) {
      const s = zipperLoad(f);
      expect(s.reactions[0] + s.reactions[1]).toBe(f);
      expect(s.reactions[0] - s.reactions[1]).toBe(0);
      expect(s.net).toBe(0);
      expect(s.displacement).toBe(0);
    }
    expect(zipperComparison(0.3)).toEqual({ requested: 0.3, normal: 0, withoutShoulder: 0.3 });
  });
  it('reconstructs direct seek and reverse motion without deleting a tooth', () => {
    for (let ch = 0; ch < 8; ch++) {
      const a = zipperShot(ch, 0.41);
      zipperShot(7 - ch, 0.91);
      const b = zipperShot(ch, 0.41);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      expect(a.pose.teeth.map((t) => t.id)).toEqual(zipperPose(0).teeth.map((t) => t.id));
    }
    const a = zipperShot(3, 0.31).pose,
      b = zipperShot(5, 0.69).pose;
    expect(a.slider).toBeCloseTo(b.slider, 12);
    expect(a.marked.root[0]).toBeCloseTo(b.marked.root[0], 12);
  });
  it('fully resets controls and keeps extreme inputs finite', () => {
    const a = zipperInitial();
    a.travel = 1;
    a.force = 0;
    a.trial = 0.45;
    a.view = 'comparison';
    expect(zipperInitial()).toEqual({ travel: 0.34, force: 0.5, trial: 0.25, view: 'whole' });
    for (const x of [NaN, Infinity, -1, 0, 1, 100]) {
      const p = zipperPose(x);
      expect(p.slider).toBeGreaterThanOrEqual(ZIP_MIN);
      expect(p.slider).toBeLessThanOrEqual(ZIP_MAX);
      expect(JSON.stringify(zipperShot(x, x))).not.toContain('null');
    }
  });
  it('fits actual full-object and labelled macro bounds through the camera projection', () => {
    const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
    for (const a of [0.65, 0.83, 1.7, 2.5])
      for (const focus of ['whole', 'guide', 'tooth', 'capture', 'stops'])
        for (const t of [0, 0.5, 1]) {
          const c = zipperCamera(zipperPose(t), focus, a, t);
          expect(dot(c.up, c.direction)).toBeCloseTo(0, 12);
          for (const p of c.bounds) {
            const v = p.map((x, i) => x - c.target[i]),
              depth = c.distance - dot(v, c.direction);
            expect(Math.abs((dot(v, c.right) * c.cot) / (a * depth))).toBeLessThanOrEqual(0.850001);
            expect(Math.abs((dot(v, c.up) * c.cot) / depth)).toBeLessThanOrEqual(0.850001);
          }
        }
  });
});

it('projects the actual full tape, tooth, slider and stop extents through Three perspective', () => {
  for (const travel of [0, 0.1, 0.5, 0.9, 1]) {
    const pose = zipperPose(travel),
      fit = zipperCamera(pose, 'whole', 2.46, 0.5),
      camera = new PerspectiveCamera(34, 2.46, 0.1, 100);
    camera.position.set(...fit.target).addScaledVector(new Vector3(...fit.direction), fit.distance);
    camera.lookAt(new Vector3(...fit.target));
    camera.updateMatrixWorld();
    const points: ZipPoint[] = [
      ...pose.teeth.flatMap((t) => t.outline),
      ...ZIP_GUIDE.outline.map(([x, y]) => [x, y + pose.slider] as ZipPoint),
      [-1.1, -1.36],
      [1.1, -1.08],
    ];
    for (const side of [-1, 1] as const) {
      points.push(...ZIP_STOP.map((p) => zipperTransform(p, ZIP.stopS, pose.slider, side)));
      for (let i = 0; i <= 120; i++)
        for (const x of [0, -ZIP.tapeWidth])
          points.push(zipperTransform([x, 0], -1.85 + (16.3 * i) / 120, pose.slider, side));
    }
    for (const [x, y] of points)
      for (const z of [-0.24, 0.85]) {
        const p = new Vector3(x, y, z).project(camera);
        expect(Math.abs(p.x)).toBeLessThan(0.86);
        expect(Math.abs(p.y)).toBeLessThan(0.86);
      }
  }
});
