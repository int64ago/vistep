import {
  DOUBLE_SLIT_DEFAULT,
  doubleSlitAt,
  doubleSlitPhasePosition,
  doubleSlitProfile,
} from './double-slit';

export type DoubleSlitCoverPoint = { x: number; y: number };
export const doubleSlitCoverPath = (points: readonly DoubleSlitCoverPoint[], close = false) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' ') +
  (close ? 'Z' : '');

/** An optical section, deliberately not to scale along the propagation axis.
 * Circular fronts indicate two coherent sources; only the receiving screen is
 * a quantitative field result. Never add a glow layer across its dark nodes. */
export function doubleSlitCover() {
  const parameters = { ...DOUBLE_SLIT_DEFAULT },
    halfSpanM = 0.012,
    centerY = 115,
    separation = 39,
    apertureHeight = (separation * parameters.slitWidthM) / parameters.separationM;
  const openings = [-1, 1].map((side) => ({
    x: 119,
    y: centerY + (side * separation) / 2,
    height: apertureHeight,
  }));
  const segments = [
    { top: 43, bottom: openings[0].y - apertureHeight / 2 },
    { top: openings[0].y + apertureHeight / 2, bottom: openings[1].y - apertureHeight / 2 },
    { top: openings[1].y + apertureHeight / 2, bottom: 187 },
  ];
  const fronts = openings.flatMap((origin, source) =>
    Array.from({ length: 9 }, (_, n) => {
      const radius = 18 + n * 21;
      return {
        source,
        radius,
        points: Array.from({ length: 25 }, (_, i) => {
          const angle = -0.32 + (i * 0.64) / 24;
          return { x: origin.x + radius * Math.cos(angle), y: origin.y + radius * Math.sin(angle) };
        }),
      };
    }),
  );
  const nodes = Array.from({ length: 20 }, (_, i) =>
    doubleSlitPhasePosition(parameters, i - 9.5),
  ).filter((yM): yM is number => yM !== null && Math.abs(yM) < halfSpanM);
  const positions = [...doubleSlitProfile(parameters, 241, halfSpanM).map((p) => p.yM), ...nodes]
    .sort((a, b) => a - b)
    .filter((value, i, all) => !i || value - all[i - 1] > 1e-12);
  const peak = doubleSlitAt(parameters, 0).intensity;
  const screen = { x: 318, y: centerY, width: 36, skew: -12, halfHeight: 71 };
  const projectScreen = (yM: number, depth = 0) => ({
    x: screen.x + depth * screen.width,
    y: screen.y - (yM / halfSpanM) * screen.halfHeight + depth * screen.skew,
  });
  const rows = positions.map((yM, i) => {
    const lowerM = i ? (positions[i - 1] + yM) / 2 : -halfSpanM,
      upperM = i < positions.length - 1 ? (positions[i + 1] + yM) / 2 : halfSpanM,
      intensity = doubleSlitAt(parameters, yM).intensity / peak;
    // A fixed display response lifts weak fringes while retaining exact zeros.
    const level = Math.max(0, Math.min(1, intensity)) ** 0.7;
    return {
      yM,
      lowerM,
      upperM,
      intensity,
      fill: `rgb(${Math.round(6 + 197 * level)},${Math.round(18 + 223 * level)},${Math.round(27 + 157 * level)})`,
      polygon: [
        projectScreen(upperM),
        projectScreen(upperM, 1),
        projectScreen(lowerM, 1),
        projectScreen(lowerM),
      ],
    };
  });
  return {
    parameters,
    openings,
    segments,
    fronts,
    nodes,
    rows,
    halfSpanM,
    target: projectScreen(0),
    screen: [
      projectScreen(halfSpanM),
      projectScreen(halfSpanM, 1),
      projectScreen(-halfSpanM, 1),
      projectScreen(-halfSpanM),
    ],
  };
}
