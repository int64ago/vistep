import * as THREE from 'three';
import { motorWindingPoint, type MotorPoint } from '../../models/induction-motor';

/** Bounded corner fillets: unlike a free Catmull spline these cannot overshoot
 * the conductor's allocated channel. Both actual endpoints are retained. */
export function motorRoundedConductor(points: readonly MotorPoint[], trim = 0.045) {
  const path = new THREE.CurvePath<THREE.Vector3>();
  const vertices = points.map((p) => new THREE.Vector3(...p));
  let previous = vertices[0];
  for (let i = 1; i < vertices.length - 1; i++) {
    const p = vertices[i];
    const before = Math.min(trim, p.distanceTo(vertices[i - 1]) * 0.4);
    const after = Math.min(trim, p.distanceTo(vertices[i + 1]) * 0.4);
    const a = p.clone().lerp(vertices[i - 1], before / p.distanceTo(vertices[i - 1]));
    const b = p.clone().lerp(vertices[i + 1], after / p.distanceTo(vertices[i + 1]));
    path.add(new THREE.LineCurve3(previous, a));
    path.add(new THREE.QuadraticBezierCurve3(a, p, b));
    previous = b;
  }
  path.add(new THREE.LineCurve3(previous, vertices.at(-1)!));
  return path;
}

export function motorWindingCurve(phase: number) {
  return motorRoundedConductor(
    Array.from({ length: 289 }, (_, i) => motorWindingPoint(phase, i / 288)),
    0.065,
  );
}

/** CurvePath.getPoints subdivides every subcurve; use one bounded global sample count. */
export function sampleMotorConductor(
  curve: THREE.CurvePath<THREE.Vector3>,
  count: number,
): MotorPoint[] {
  return Array.from(
    { length: count + 1 },
    (_, i) => curve.getPoint(i / count).toArray() as MotorPoint,
  );
}
