/** Millimetre coordinates shared by the anatomical section, probe detail and cover.
 * This is an illustrative adult-sized 2D section, not patient anatomy or a device drawing. */
export type EarPoint = { x: number; y: number };
export const EAR_GEOMETRY = {
  upper: [
    { x: 0, y: 4.4 },
    { x: 5, y: 3.6 },
    { x: 10, y: 3.25 },
    { x: 15, y: 4.3 },
    { x: 21, y: 4.2 },
    { x: 25, y: 3.5 },
  ],
  lower: [
    { x: 0, y: -4.4 },
    { x: 5, y: -3.6 },
    { x: 10, y: -3.4 },
    { x: 15, y: -3.8 },
    { x: 21, y: -4.5 },
    { x: 26, y: -3.5 },
  ],
  tip: { x: 4, y: 0 },
  guideLengthMm: 5,
  apertureRadiusMm: 0.65,
  detectorHalfMm: 0.24,
  // A sleeve wider than the entrance stop admits the modeled direct paths.
  guideRearRadiusMm: 0.85,
  probeOutline:
    'M0 -.92L-4.8 -1.65Q-6 -1.9-6.8 -2.5L-10.5 -3.6Q-13.9 -4.3-14.5 -1.2L-14.5 1.2Q-13.9 4.3-10.5 3.6L-6.8 2.5Q-6 1.9-4.8 1.65L0 .92Z',
  tissueOutline: 'M-3 -13C-8 -13-9 -7-7 -.5C-8 5-6 12-2 13Q3 14 5 9L29 13L29 -13L5 -9Q1 -14-3 -13Z',
  pinnaFold: 'M-3 -10C-6 -9-6 -4-4 -1Q-2 2-4 5Q-5 9-1 10Q3 9 2 5',
} as const;
export function earPolyline(points: readonly EarPoint[], close = false) {
  return `M${points.map((p) => `${p.x},${p.y}`).join('L')}${close ? 'Z' : ''}`;
}
export const EAR_CANAL_PATH = earPolyline(
  [...EAR_GEOMETRY.upper, ...[...EAR_GEOMETRY.lower].reverse()],
  true,
);
export const EAR_GUIDE_PATH = `M0 -${EAR_GEOMETRY.apertureRadiusMm}L-${EAR_GEOMETRY.guideLengthMm} -${EAR_GEOMETRY.guideRearRadiusMm}L-${EAR_GEOMETRY.guideLengthMm} ${EAR_GEOMETRY.guideRearRadiusMm}L0 ${EAR_GEOMETRY.apertureRadiusMm}Z`;
export const EAR_SENSOR_PACKAGE = { x: -6.35, y: -1.24, width: 1.55, height: 2.48 };
export const EAR_ADC = { x: -8.52, y: -0.75, width: 1.2, height: 1.5 };
// Alternating material legs form one connected series chain. Its two terminals
// leave the cold frame for the two signal inputs; the separate thermistor has
// its own two leads. Microstructure is enlarged and schematic.
export const EAR_THERMOPILE_JUNCTIONS: EarPoint[] = [
  { x: -6.1, y: 1.03 },
  { x: -5.4, y: 0.3 },
  { x: -6.25, y: 0.7 },
  { x: -5.4, y: 0.15 },
  { x: -6.25, y: 0.4 },
  { x: -5.4, y: 0 },
  { x: -6.25, y: -0.4 },
  { x: -5.4, y: -0.15 },
  { x: -6.25, y: -0.7 },
  { x: -5.4, y: -0.3 },
  { x: -6.1, y: -1.03 },
];
export const EAR_SIGNAL_ROUTES: EarPoint[][] = [
  [EAR_THERMOPILE_JUNCTIONS[0], { x: -6.7, y: 1.03 }, { x: -6.7, y: 0.15 }, { x: -7.32, y: 0.15 }],
  [
    EAR_THERMOPILE_JUNCTIONS.at(-1)!,
    { x: -6.85, y: -1.03 },
    { x: -6.85, y: -0.15 },
    { x: -7.32, y: -0.15 },
  ],
];
export const EAR_REFERENCE_ROUTES: EarPoint[][] = [
  [
    { x: -6.26, y: 1.24 },
    { x: -7, y: 1.24 },
    { x: -7, y: 0.5 },
    { x: -7.32, y: 0.5 },
  ],
  [
    { x: -5.92, y: 1.24 },
    { x: -6.6, y: 1.5 },
    { x: -7.1, y: 1.5 },
    { x: -7.1, y: 0.65 },
    { x: -7.32, y: 0.65 },
  ],
];
export const EAR_PROBE_ANCHORS = [
  { number: 1, part: { x: -7.92, y: 0 }, label: { x: -7.92, y: -1.95 }, color: '#697f69' },
  { number: 2, part: { x: -6.1, y: 1.24 }, label: { x: -6.5, y: 1.95 }, color: '#6297a2' },
  { number: 3, part: { x: -5.05, y: 0 }, label: { x: -4.3, y: -1.95 }, color: '#c17e4f' },
  { number: 4, part: { x: 0.04, y: 0 }, label: { x: 0.9, y: 1.95 }, color: '#9aa881' },
];
export function earCalibrationPath(offsetMm: number): [EarPoint, EarPoint, EarPoint] {
  const source = { x: 10, y: offsetMm },
    entranceX = EAR_GEOMETRY.tip.x,
    detector = { x: entranceX - EAR_GEOMETRY.guideLengthMm, y: 0 };
  return [
    source,
    { x: entranceX, y: (offsetMm * (entranceX - detector.x)) / (source.x - detector.x) },
    detector,
  ];
}
export function earProbePoint(local: EarPoint, angleDeg: number): EarPoint {
  const a = (angleDeg * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a);
  return {
    x: EAR_GEOMETRY.tip.x + c * local.x - s * local.y,
    y: EAR_GEOMETRY.tip.y + s * local.x + c * local.y,
  };
}
export function earLocalPoint(world: EarPoint, angleDeg: number): EarPoint {
  const a = (-angleDeg * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a),
    x = world.x - EAR_GEOMETRY.tip.x,
    y = world.y - EAR_GEOMETRY.tip.y;
  return { x: c * x - s * y, y: s * x + c * y };
}
export function earPointOnPath(points: readonly EarPoint[], fraction: number): EarPoint {
  const distances = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y)),
    total = distances.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, fraction)) * total;
  for (let i = 0; i < distances.length; i++) {
    if (d <= distances[i]) {
      const t = distances[i] ? d / distances[i] : 0;
      return {
        x: points[i].x + t * (points[i + 1].x - points[i].x),
        y: points[i].y + t * (points[i + 1].y - points[i].y),
      };
    }
    d -= distances[i];
  }
  return { ...points.at(-1)! };
}
