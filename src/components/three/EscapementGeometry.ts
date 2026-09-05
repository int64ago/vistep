import * as THREE from 'three';
import { ESC, type EscPose, type EscVec3 } from '../../models/escapement';

/** Display-unit hardware only. Pendulum/contact/energy laws remain in the model. */
export const ESC_HARDWARE = {
  beamWidth: 3.5,
  beamHeight: 0.15,
  beamDepth: 0.18,
  beamBack: -0.94,
  bearingOuter: 0.2,
  bearingBore: 0.095,
  bearingDepth: 0.3,
  bossRadius: 0.27,
  shaftRadius: 0.09,
  shaftFront: 0.15,
  eyeOuter: 0.05,
  eyeInner: 0.024,
  eyeDepth: 0.07,
  weightWidth: 0.28,
  weightHeight: 0.57,
  weightTop: -0.085,
  baseWidth: 3.8,
  baseBottom: -2.21,
  baseTop: -1.96,
} as const;

/** A continuous beam/boss contour with a real bore for the bearing's outer race. */
export function escapementSupportGeometry() {
  const h = ESC_HARDWARE,
    half = h.beamHeight / 2,
    a = Math.asin(half / h.bossRadius),
    x = Math.sqrt(h.bossRadius ** 2 - half ** 2),
    shape = new THREE.Shape();
  shape.moveTo(-h.beamWidth / 2, -half);
  shape.lineTo(-x, -half);
  shape.absarc(0, 0, h.bossRadius, Math.PI + a, 2 * Math.PI - a, false);
  shape.lineTo(h.beamWidth / 2, -half);
  shape.lineTo(h.beamWidth / 2, half);
  shape.lineTo(x, half);
  shape.absarc(0, 0, h.bossRadius, a, Math.PI - a, false);
  shape.lineTo(-h.beamWidth / 2, half);
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, h.bearingOuter, 0, 2 * Math.PI, true);
  shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, {
    depth: h.beamDepth,
    bevelEnabled: false,
    curveSegments: 64,
  });
}

export function escapementSupport() {
  const h = ESC_HARDWARE,
    bearingBack = ESC.bearingFront - h.bearingDepth,
    shaftBack = bearingBack + 0.01;
  return {
    bearingBack,
    shaftBack,
    shaftLength: h.shaftFront - shaftBack,
    shaftCentre: (h.shaftFront + shaftBack) / 2,
  };
}

/** The rope's lower end touches the closed eye's upper rim at one shared point. */
export function escapementHanger(pose: Pick<EscPose, 'weightTop'>) {
  const h = ESC_HARDWARE,
    attachment: EscVec3 = [ESC.drumRadius, pose.weightTop, ESC.drumZ],
    drumTangent: EscVec3 = [ESC.drumRadius, 0, ESC.drumZ];
  return {
    attachment,
    drumTangent,
    eyeCentre: [attachment[0], attachment[1] - h.eyeOuter, attachment[2]] as EscVec3,
    bodyTop: attachment[1] + h.weightTop,
    bodyBottom: attachment[1] + h.weightTop - h.weightHeight,
    bodyCentre: attachment[1] + h.weightTop - h.weightHeight / 2,
    ropeCentre: (drumTangent[1] + attachment[1]) / 2,
    ropeLength: drumTangent[1] - attachment[1],
  };
}

/** Frontal mechanism section; the two arbor depths are projected obliquely so
 * the rear drive and front pendulum remain individually traceable. */
export function escapementOverviewFrame(compact: boolean) {
  const width = compact ? 280 : 520,
    height = compact ? 330 : 360,
    top = 35,
    bottom = height - 41,
    minY = ESC_HARDWARE.baseBottom,
    maxY = 2.65,
    scale = Math.min((width - 32) / ESC_HARDWARE.baseWidth, (bottom - top - 24) / (maxY - minY)),
    cy = (maxY + minY) / 2;
  const to = ([x, y]: readonly number[], z = 0): [number, number] => [
    width / 2 + (x + 1.5 * z) * scale,
    (top + bottom) / 2 - (y - cy) * scale,
  ];
  return { width, height, top, bottom, scale, to };
}
