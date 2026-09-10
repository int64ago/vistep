import { NFC, nfcTagPoint, nfcGeometry } from './nfc';

/** Physical artwork uses millimetres; the electrical model uses metres. */
export type NfcPoint = [number, number, number];
export type NfcVisual = {
  gapMm: number;
  tiltDeg: number;
  /** A deliberately slowed phase, in radians, supplied by the shared film clock. */
  phase: number;
  /** Actual instantaneous currents; the reader current drives the colour cue. */
  readerCurrentA?: number;
  tagCurrentA?: number;
  /** Signed flux linkage divided by its fixed peak; optional local annotation. */
  fluxNormalized?: number;
  /** Continuous director-controlled detail framing. */
  closeup?: number;
  powered: boolean;
  fieldOn: boolean;
  loadOn: boolean;
  showInternals: number;
};
export const NFC_ART = {
  scale: 0.08,
  readerRadiusMm: 32,
  readerBottomMm: -8.4,
  readerTopMm: -0.4,
  tagRadiusMm: NFC.tagHalfWidthM * 1000,
  tagHalfThicknessMm: NFC.tagHalfThicknessM * 1000,
  floorOffsetMm: 8.5,
  wireRadiusMm: 0.18,
} as const;

export function nfcArtPose(visual: Pick<NfcVisual, 'gapMm' | 'tiltDeg'>) {
  return { gapM: visual.gapMm / 1000, tiltDeg: visual.tiltDeg };
}
export function nfcArtTagPoint(
  point: NfcPoint,
  visual: Pick<NfcVisual, 'gapMm' | 'tiltDeg'>,
): NfcPoint {
  return nfcTagPoint(point.map((v) => v / 1000) as NfcPoint, nfcArtPose(visual)).map(
    (v) => v * 1000,
  ) as NfcPoint;
}
export function nfcArtCenterMm(visual: Pick<NfcVisual, 'gapMm' | 'tiltDeg'>) {
  return nfcGeometry(nfcArtPose(visual)).tagCenterM[1] * 1000;
}

/** Continuous printed spiral, not independent concentric rings. The equivalent
 * electrical loop ignores the finite 4 mm winding width and copper-layer height. */
export function nfcSpiralPoint(which: 'reader' | 'tag', progress: number): NfcPoint {
  const tag = which === 'tag',
    mean = (tag ? NFC.tagRadiusM : NFC.readerRadiusM) * 1000,
    turns = tag ? NFC.tagTurns : NFC.readerTurns,
    radius = mean - 2 + progress * 4,
    angle = progress * turns * Math.PI * 2;
  return [radius * Math.cos(angle), tag ? 0.7 : -0.18, radius * Math.sin(angle)];
}

/** A two-terminal coil and IC: reader tuning is series, tag tuning is parallel.
 * The outer coil end
 * crosses other turns on a visibly insulated upper layer; it never shorts them. */
export function nfcConnections(which: 'reader' | 'tag') {
  const inner = nfcSpiralPoint(which, 0),
    outer = nfcSpiralPoint(which, 1),
    y = inner[1],
    raised = y + 1.1,
    right: NfcPoint = [2.8, y, 0],
    left: NfcPoint = [-2.8, y, 0],
    capRight: NfcPoint = [2.8, y, -7],
    capLeft: NfcPoint = [-2.8, y, -7];
  return {
    right,
    left,
    capRight,
    capLeft,
    inner: [inner, right] as NfcPoint[],
    outer: [
      outer,
      [outer[0], raised, outer[2]],
      [outer[0], raised, -3.4],
      [-2.8, raised, -3.4],
      [-2.8, y, -3.4],
      which === 'tag' ? left : capLeft,
    ] as NfcPoint[],
    insulation: [
      [outer[0], raised, -3.4],
      [-2.8, raised, -3.4],
    ] as NfcPoint[],
    capWires: (which === 'tag'
      ? [
          [right, capRight],
          [left, capLeft],
        ]
      : [[left, [-5, y, 0], [-5, y, -10], [5, y, -10], [5, y, -7], capRight]]) as NfcPoint[][],
    chip: { center: [0, y + 0.45, 0] as NfcPoint, size: [4.6, 0.9, 4.2] as NfcPoint },
    capacitor: { center: [0, y + 0.3, -7] as NfcPoint, size: [4.1, 0.6, 2.1] as NfcPoint },
  };
}

/** A local flux-linkage direction marker, not a field line. The winding's
 * x=rcosθ,z=rsinθ parameterization has positive normal −y. */
export function nfcFluxArrow(normalized = 0) {
  const amount = Math.max(-1, Math.min(1, normalized)),
    magnitude = Math.abs(amount),
    direction = amount >= 0 ? -1 : 1,
    length = 16 * magnitude,
    headLength = Math.min(3.2, length * 0.36),
    headRadius = headLength * 0.48,
    from: NfcPoint = [-9, (-direction * length) / 2, 6],
    tip: NfcPoint = [-9, (direction * length) / 2, 6],
    base: NfcPoint = [-9, tip[1] - direction * headLength, 6];
  return {
    amount,
    visible: magnitude > 0.025,
    opacity: Math.max(0, Math.min(1, (magnitude - 0.025) / 0.15)),
    length,
    headLength,
    headRadius,
    direction,
    from,
    tip,
    base,
    head: [
      tip,
      [base[0] - headRadius, base[1], base[2]],
      [base[0] + headRadius, base[1], base[2]],
    ] as NfcPoint[],
  };
}

export const nfcCircle = (radius: number, y: number, samples = 96): NfcPoint[] =>
  Array.from({ length: samples + 1 }, (_, i) => {
    const a = (i / samples) * Math.PI * 2;
    return [radius * Math.cos(a), y, radius * Math.sin(a)];
  });

/** Reusable orthographic projection for the static cover and runtime fallback. */
export function nfcProject(
  point: NfcPoint,
  width: number,
  height: number,
  visual: Pick<NfcVisual, 'gapMm' | 'tiltDeg' | 'closeup'>,
  cover = false,
) {
  const closeup = Math.max(0, Math.min(1, visual.closeup ?? 0)),
    // The expanded view never assumes that an extreme manual pose still fits.
    centerHeight = nfcArtCenterMm(visual),
    requiredHeight = Math.max(82, 66 + centerHeight * 0.86),
    scale = cover
      ? 3.1
      : Math.min(width / 87, height / Math.max(122 - 40 * closeup, requiredHeight)),
    originX = width * 0.5,
    center = cover ? 12 : nfcArtCenterMm(visual) * 0.5 - 2,
    originY = height * (cover ? 0.42 : 0.49),
    [x, y, z] = point;
  return [
    originX + scale * (x * 0.93 + z * 0.36),
    originY + scale * (z * 0.59 - x * 0.23 - (y - center) * 0.77),
  ];
}
export function nfcArtPath(
  points: readonly NfcPoint[],
  project: (p: NfcPoint) => number[],
  close = false,
) {
  return (
    points
      .map(
        (p, i) =>
          `${i ? 'L' : 'M'}${project(p)
            .map((v) => v.toFixed(3))
            .join(' ')}`,
      )
      .join(' ') + (close ? 'Z' : '')
  );
}

export function nfcBoxFaces(center: NfcPoint, size: NfcPoint) {
  const corners = [-1, 1].flatMap((x) =>
    [-1, 1].flatMap((y) =>
      [-1, 1].map(
        (z) =>
          [
            center[0] + (x * size[0]) / 2,
            center[1] + (y * size[1]) / 2,
            center[2] + (z * size[2]) / 2,
          ] as NfcPoint,
      ),
    ),
  );
  return [
    [2, 3, 7, 6],
    [0, 2, 6, 4],
    [4, 6, 7, 5],
  ].map((face) => face.map((i) => corners[i]));
}
