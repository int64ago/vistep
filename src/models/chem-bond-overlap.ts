export type Vec3 = { x: number; y: number; z: number };
export type OverlapKind = 'ss' | 'sp' | 'sigma' | 'pi';
export const GAUSSIAN_ALPHA = 0.8;
/** Normalized Gaussian angular-symmetry basis, not atom-specific radial wavefunctions. */
export function basisValue(p: Vec3, axis: Vec3 | null, alpha = GAUSSIAN_ALPHA) {
  const n = ((2 * alpha) / Math.PI) ** 0.75,
    base = n * Math.exp(-alpha * (p.x * p.x + p.y * p.y + p.z * p.z));
  return axis ? base * 2 * Math.sqrt(alpha) * (p.x * axis.x + p.y * axis.y + p.z * axis.z) : base;
}
export function basisAxes(kind: OverlapKind, angle = 0): [Vec3 | null, Vec3 | null] {
  return kind === 'ss'
    ? [null, null]
    : kind === 'sp'
      ? [null, { x: -1, y: 0, z: 0 }]
      : kind === 'sigma'
        ? [
            { x: 1, y: 0, z: 0 },
            { x: -1, y: 0, z: 0 },
          ]
        : [
            { x: 0, y: 1, z: 0 },
            { x: Math.sin(angle), y: Math.cos(angle), z: 0 },
          ];
}
export function gaussianOverlap(kind: OverlapKind, distance: number, angle = 0) {
  const r = Math.max(0.2, distance),
    a = GAUSSIAN_ALPHA,
    g = Math.exp((-a * r * r) / 2),
    [u, v] = basisAxes(kind, angle);
  if (!u && !v) return g;
  if (!u && v) return -Math.sqrt(a) * r * v.x * g;
  return (u!.x * v!.x + u!.y * v!.y + u!.z * v!.z - a * r * r * u!.x * v!.x) * g;
}
export function overlapField(
  kind: OverlapKind,
  r: number,
  x: number,
  y: number,
  z = 0,
  angle = 0,
  combined = true,
) {
  const [u, v] = basisAxes(kind, angle),
    a = basisValue({ x: x + r / 2, y, z }, u),
    b = basisValue({ x: x - r / 2, y, z }, v),
    s = gaussianOverlap(kind, r, angle);
  return combined ? (a + b) ** 2 / (2 * (1 + s)) : (a * a + b * b) / 2;
}
export function ionicBookkeeping(transferred: boolean) {
  return {
    naElectrons: transferred ? 10 : 11,
    clElectrons: transferred ? 18 : 17,
    naCharge: transferred ? 1 : 0,
    clCharge: transferred ? -1 : 0,
    totalElectrons: 28,
  };
}
export const ROCK_SALT_NEIGHBORS: Vec3[] = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
];
export function projectNeighbor(p: Vec3, turn = 0.6) {
  const c = Math.cos(turn),
    s = Math.sin(turn);
  return {
    x: 90 * (c * p.x + s * p.z),
    y: 90 * (0.85 * p.y + 0.38 * (-s * p.x + c * p.z)),
    depth: -s * p.x + c * p.z - 0.4 * p.y,
  };
}
export function bondDirector(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    chapter,
    progress: chapter === 0 || chapter === 2 || chapter === 3 ? Math.min(1, p / 0.6) : p,
    kind: (chapter === 4
      ? 'ss'
      : chapter === 5
        ? 'sp'
        : chapter === 6
          ? 'sigma'
          : 'pi') as OverlapKind,
    distance: chapter < 7 ? 3.4 - 1.6 * p : 1.8,
    angle: chapter === 8 ? (p * Math.PI) / 2 : 0,
    combined: chapter >= 4 && p > 0.25,
    transferred: p >= 0.6,
  };
}
