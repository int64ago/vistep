import { it, expect, vi } from 'vitest';
import * as T from 'three';
import { renderToStaticMarkup } from 'react-dom/server';
const film = vi.hoisted(() => ({ chapter: 3, progress: 0 }));
vi.mock('react', async (original) => {
  const react = await original<typeof import('react')>();
  return {
    ...react,
    useRef: (current: unknown) => ({ current }),
    useState: (initial: unknown) => react.useState(initial === 760 ? 278 : initial),
  };
});
vi.mock('../lab/Showcase', () => ({
  useShowcase: () => ({
    watch: true,
    chapter: film.chapter,
    chapterProgress: film.progress,
    run: 0,
  }),
}));
import Mot from './InductionMotorStudio';
import Gen from './ElectricGeneratorStudio';
import Transformer from './ElectricTransformerStudio';
import ElectricTransformer from '../experiments/ElectricTransformer';
import { generatorShot } from '../../models/electric-generator';
import { electricShot } from '../../models/transformer-electric';
import {
  motorShot,
  motorWindingPoint,
  motorTerminal,
  MOTOR as M,
  MOTOR_GEOMETRY as D,
} from '../../models/induction-motor';
import { motorWindingCurve, motorRoundedConductor } from './motor-conductor-geometry';
import { motorWindingLead } from '../../models/induction-motor';
// Closest points on finite segments, including endpoint clamps (Ericson).
function closest(p: T.Vector3, q: T.Vector3, a: T.Vector3, b: T.Vector3) {
  const d1 = q.clone().sub(p),
    d2 = b.clone().sub(a),
    r = p.clone().sub(a),
    aa = d1.dot(d1),
    ee = d2.dot(d2),
    f = d2.dot(r),
    c = d1.dot(r),
    bb = d1.dot(d2),
    den = aa * ee - bb * bb;
  let s = den !== 0 ? T.MathUtils.clamp((bb * f - c * ee) / den, 0, 1) : 0,
    t = (bb * s + f) / ee;
  if (t < 0) {
    t = 0;
    s = T.MathUtils.clamp(-c / aa, 0, 1);
  } else if (t > 1) {
    t = 1;
    s = T.MathUtils.clamp((bb - c) / aa, 0, 1);
  }
  const x = p.clone().addScaledVector(d1, s),
    y = a.clone().addScaledVector(d2, t);
  return { distance: x.distanceTo(y), x, y };
}
function joint(a: number, b: number) {
  for (let p = 0; p < 3; p++) {
    for (let e = 0; e < 2; e++)
      if (a === 3 * p && b === 3 * p + 1 + e) return motorWindingPoint(p, e);
    if (a === 3 * p + 2 && b === 9) return motorTerminal(p, 1);
    if (a === 3 * p + 1 && b === 10 + p) return motorTerminal(p, 0);
  }
  return null;
}
it('full actual tube segments are disjoint outside the declared electrical junctions', () => {
  vi.stubGlobal('document', { documentElement: { lang: 'zh' } });
  const e = Mot({ shot: motorShot(0, 0), narrow: false }),
    root = new T.Group(),
    camera = new T.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(6, 4.7, 10);
  const controls: any = {
    target: new T.Vector3(0, 1.7, 0),
    enabled: false,
    addEventListener() {},
    removeEventListener() {},
  };
  const o = e.props.create({ root, camera, controls } as any);
  o.update!(0, 0, true);
  root.updateMatrixWorld(true);
  const tubes: any[] = [];
  root.traverse((m: any) => {
    if (m.isMesh && m.geometry.type === 'TubeGeometry') {
      const p = m.geometry.parameters,
        pos = m.geometry.getAttribute('position'),
        points = [];
      let radius = 0;
      for (let i = 0; i <= p.tubularSegments; i++) {
        const v = new T.Vector3();
        for (let j = 0; j < p.radialSegments; j++)
          v.add(new T.Vector3().fromBufferAttribute(pos, i * (p.radialSegments + 1) + j));
        v.divideScalar(p.radialSegments);
        for (let j = 0; j < p.radialSegments; j++)
          radius = Math.max(
            radius,
            v.distanceTo(new T.Vector3().fromBufferAttribute(pos, i * (p.radialSegments + 1) + j)),
          );
        points.push(v.applyMatrix4(m.matrixWorld));
      }
      tubes.push({ points, radius });
    }
  });
  const failures = [],
    pairs = [];
  let candidates = 0;
  for (let a = 0; a < tubes.length; a++)
    for (let b = a + 1; b < tubes.length; b++) {
      const A = tubes[a],
        B = tubes[b],
        rs = A.radius + B.radius,
        J = joint(a, b),
        j = J ? new T.Vector3(...J).add(new T.Vector3(0, M.axisY + D.axisLift, 0)) : null;
      let min = Infinity,
        witness: any;
      for (let i = 0; i < A.points.length - 1; i++)
        for (let k = 0; k < B.points.length - 1; k++) {
          const p = A.points[i],
            q = A.points[i + 1],
            r = B.points[k],
            s = B.points[k + 1];
          const limit = rs + 0.02;
          if (
            Math.max(p.x, q.x) + limit < Math.min(r.x, s.x) ||
            Math.min(p.x, q.x) - limit > Math.max(r.x, s.x) ||
            Math.max(p.y, q.y) + limit < Math.min(r.y, s.y) ||
            Math.min(p.y, q.y) - limit > Math.max(r.y, s.y) ||
            Math.max(p.z, q.z) + limit < Math.min(r.z, s.z) ||
            Math.min(p.z, q.z) - limit > Math.max(r.z, s.z)
          )
            continue;
          candidates++;
          const d = closest(p, q, r, s);
          if (j && d.x.distanceTo(j) < 0.12 && d.y.distanceTo(j) < 0.12) continue;
          const clearance = d.distance - rs;
          if (clearance < min) {
            min = clearance;
            witness = { i, k, pointA: d.x.toArray(), pointB: d.y.toArray() };
          }
        }
      pairs.push({ a, b, min: Number.isFinite(min) ? min : null, witness });
      if (min < -0.000002) failures.push(pairs.at(-1));
    }

  const self = [];
  for (const index of [0, 3, 6]) {
    const A = tubes[index];
    const arc = [0];
    for (let i = 1; i < A.points.length; i++)
      arc.push(arc[i - 1] + A.points[i].distanceTo(A.points[i - 1]));
    let minimum = Infinity;
    for (let i = 0; i < A.points.length - 1; i++)
      for (let k = i + 2; k < A.points.length - 1; k++) {
        if (arc[k] - arc[i + 1] < 0.25) continue;
        const p = A.points[i],
          q = A.points[i + 1],
          r = A.points[k],
          s = A.points[k + 1],
          limit = 2 * A.radius + 0.02;
        if (
          Math.max(p.x, q.x) + limit < Math.min(r.x, s.x) ||
          Math.min(p.x, q.x) - limit > Math.max(r.x, s.x) ||
          Math.max(p.y, q.y) + limit < Math.min(r.y, s.y) ||
          Math.min(p.y, q.y) - limit > Math.max(r.y, s.y) ||
          Math.max(p.z, q.z) + limit < Math.min(r.z, s.z) ||
          Math.min(p.z, q.z) - limit > Math.max(r.z, s.z)
        )
          continue;
        minimum = Math.min(minimum, closest(p, q, r, s).distance - 2 * A.radius);
      }
    self.push({ index, minimum });
    expect(minimum).toBeGreaterThan(0.004);
  }
  const boxes: T.Box3[] = [];
  root.traverse((m: any) => {
    if (
      m.isMesh &&
      m.geometry.type === 'BoxGeometry' &&
      [0.64, 4.55].includes(m.geometry.parameters.width)
    )
      boxes.push(new T.Box3().setFromObject(m));
  });
  for (const A of tubes)
    for (const b of boxes) {
      const box = b.clone().expandByScalar(A.radius);
      for (let i = 0; i < A.points.length - 1; i++) {
        const a = A.points[i],
          end = A.points[i + 1],
          length = a.distanceTo(end),
          ray = new T.Ray(a, end.clone().sub(a).normalize()),
          hit = ray.intersectBox(box, new T.Vector3());
        expect(box.containsPoint(a)).toBe(false);
        if (hit) expect(hit.distanceTo(a)).toBeGreaterThan(length);
      }
    }
  // Finite local curvature of rounded corners must clear the tube radius.
  const bends = [];
  for (let p = 0; p < 3; p++)
    for (const [kind, curve, radius] of [
      ['coil', motorWindingCurve(p), D.windingRadius],
      ['lead0', motorRoundedConductor(motorWindingLead(p, 0)), D.leadRadius],
      ['lead1', motorRoundedConductor(motorWindingLead(p, 1)), D.leadRadius],
    ] as const) {
      let min = Infinity;
      for (const sub of curve.curves)
        if (sub instanceof T.QuadraticBezierCurve3) {
          const dd = sub.v2.clone().add(sub.v0).addScaledVector(sub.v1, -2).multiplyScalar(2);
          for (let k = 0; k <= 20; k++) {
            const t = k / 20,
              d = sub.v1
                .clone()
                .sub(sub.v0)
                .multiplyScalar(2 * (1 - t))
                .add(
                  sub.v2
                    .clone()
                    .sub(sub.v1)
                    .multiplyScalar(2 * t),
                ),
              cross = d.clone().cross(dd).length();
            if (cross > 1e-10) min = Math.min(min, d.length() ** 3 / cross);
          }
        }
      bends.push({ phase: p, kind, min, radius });
    }
  expect(failures.length).toBe(0);
  for (const b of bends) expect(b.min).toBeGreaterThan(b.radius);
  o.dispose!();
}, 30000);

it('keeps real conductor endpoints, axial slot clearance and the raised bed connected', () => {
  for (let phase = 0; phase < 3; phase++) {
    const coil = motorWindingCurve(phase);
    for (const end of [0, 1]) {
      const lead = motorRoundedConductor(motorWindingLead(phase, end));
      expect(coil.getPoint(end).distanceTo(lead.getPoint(0))).toBeLessThan(1e-12);
      expect(lead.getPoint(1).distanceTo(new T.Vector3(...motorTerminal(phase, end)))).toBeLessThan(
        1e-12,
      );
    }
    for (let i = 0; i <= 3000; i++) {
      const p = coil.getPoint(i / 3000);
      if (Math.abs(p.z) < 1.03) {
        expect(Math.hypot(p.x, p.y) + D.windingRadius).toBeLessThan(1.43);
        expect(Math.hypot(p.x, p.y) - D.windingRadius).toBeGreaterThan(1.0);
        const angle = Math.atan2(p.y, p.x),
          error =
            Math.abs(
              Math.atan2(Math.sin(6 * (angle - Math.PI / 6)), Math.cos(6 * (angle - Math.PI / 6))),
            ) / 6;
        expect(error + Math.asin(D.windingRadius / Math.hypot(p.x, p.y))).toBeLessThan(
          (Math.PI / 3) * 0.067,
        );
      }
    }
  }
});
it('joins transformer feet to the core and generator insulating spokes to actual coil faces', () => {
  vi.stubGlobal('document', {
    documentElement: { lang: 'zh' },
    createElement: () => ({ width: 128, height: 128, getContext: () => ({ fillText() {} }) }),
  });
  for (const narrow of [false, true])
    for (const [component, shot] of [
      [Transformer, electricShot(0, 0)],
      [Gen, generatorShot(0, 0)],
    ] as const) {
      const element = (component as any)({ shot, narrow }),
        root = new T.Group(),
        camera = new T.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.fromArray(element.props.cameraPosition);
      const controls: any = {
        target: new T.Vector3(...element.props.target),
        enabled: false,
        addEventListener() {},
        removeEventListener() {},
      };
      const object = element.props.create({ root, camera, controls });
      object.update(0, 0, true);
      root.updateMatrixWorld(true);
      const meshes: T.Mesh[] = [];
      root.traverse((m) => {
        if (m instanceof T.Mesh) meshes.push(m);
      });
      if (component === Transformer) {
        const core = meshes.find((m) => m instanceof T.InstancedMesh)!;
        const lower = new T.Box3().setFromObject(core).min.y;
        for (const foot of meshes.filter(
          (m) => m.geometry.type === 'BoxGeometry' && (m.geometry as any).parameters.width === 1.1,
        ))
          expect(new T.Box3().setFromObject(foot).max.y).toBeCloseTo(lower, 6);
      } else {
        const coil = meshes.find(
            (m) =>
              m.geometry.type === 'TubeGeometry' &&
              (m.geometry as any).parameters.tubularSegments === 480,
          )!,
          vertices = coil.geometry.getAttribute('position');
        const spokes = meshes.filter(
          (m) => m.geometry.type === 'BoxGeometry' && (m.geometry as any).parameters.width === 0.1,
        );
        for (const sign of [-1, 1]) {
          let inner = Infinity;
          for (let i = 0; i < vertices.count; i++) {
            const p = new T.Vector3().fromBufferAttribute(vertices, i);
            if (sign * p.y > 1.1 && Math.abs(p.x) < 0.05 && Math.abs(p.z) < 0.12)
              inner = Math.min(inner, sign * p.y);
          }
          const spoke = spokes.find((m) => sign * m.position.y > 0)!;
          spoke.geometry.computeBoundingBox();
          const bound = spoke.geometry.boundingBox!;
          const edge = sign * spoke.position.y + (sign > 0 ? bound.max.y : -bound.min.y);
          expect(edge).toBeCloseTo(inner, 6);
        }
      }
      object.dispose();
    }
});
it('preserves both phone load currents in native 2D', () => {
  vi.stubGlobal('document', { documentElement: { lang: 'en' } });
  for (const progress of [0, 0.5]) {
    film.progress = progress;
    const html = renderToStaticMarkup(<ElectricTransformer />);
    const row = html.match(/<div class="electric-load-current"[^>]*>([\s\S]*?)<\/div>/)![1];
    expect(row).toContain('I₁');
    expect(row).toContain('I₂');
    expect(row).toContain('mA RMS');
    expect(row).toContain(progress ? '87.1' : '25.5');
    expect(row).toContain(progress ? '166.7' : '0.0');
  }
});
