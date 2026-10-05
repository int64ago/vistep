import { t } from '../../i18n';
import type { BfsShot } from '../../models/body-fat-scale';
import {
  BFS_GEOMETRY as G,
  bfsCurrentPath,
  bfsSensePaths,
  bfsPathPoint,
  bfsMarkerFraction,
  type BfsPoint,
} from '../../models/body-fat-scale-geometry';
export default function BodyFatScaleFlat({ shot, width }: { shot: BfsShot; width: number }) {
  const route = shot.view === 'route',
    w = Math.max(240, width),
    scale = Math.min(72, (w - 32) / 3.7);
  const project = ([x, y, z]: BfsPoint) => [
    w / 2 + x * scale,
    (route ? 287 : shot.view === 'weight' ? 66 : 193) -
      y * (route ? 65 : 50) -
      z * (route ? 28 : shot.view === 'weight' ? 15 : 50),
  ];
  const path = (points: readonly BfsPoint[]) =>
    'M' + points.map((p) => project(p).join(',')).join(' L');
  const plate = (at: readonly number[], size: readonly number[]) =>
    path(
      [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ].map(([x, z]): BfsPoint => [at[0] + (x * size[0]) / 2, at[1], at[2] + (z * size[2]) / 2]),
    ) + 'Z';
  const current = bfsCurrentPath(),
    sense = bfsSensePaths();
  return (
    <svg
      className="bfs-flat"
      viewBox={`0 0 ${w} ${shot.view === 'weight' ? 110 : 320}`}
      role="img"
      aria-label={t('四电极秤与同状态二维等效测量路径')}
    >
      <path
        d={plate(G.deck.at, G.deck.size)}
        fill="#dce3dc"
        stroke="#c3cdc5"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {shot.view === 'weight' &&
        shot.cells.map((c, i) => {
          const [x, y] = project([c.x, 0.25, c.z]);
          return (
            <g key={i} transform={`translate(${x},${y})`}>
              <rect x="-17" y="-8" width="34" height="16" rx="5" fill="#a5b4ac" />
              <path d="M-12 0H12" stroke="#b77b32" strokeWidth="4" />
              <text y="29" textAnchor="middle" fontSize="16" fill="#455d54">
                {c.forceN.toFixed(0)} N
              </text>
            </g>
          );
        })}
      {route && (
        <path
          d={path(current.slice(3, 14))}
          fill="none"
          stroke="#d3ded6"
          strokeWidth="30"
          strokeLinecap="round"
        />
      )}
      {shot.view !== 'weight' &&
        G.electrodes.map((e) => {
          const [x, y] = project(e.at);
          return (
            <g key={e.id}>
              <path
                d={plate(e.at, G.padSize)}
                fill="#bec9c2"
                stroke={e.role === 'current' ? '#b77b32' : '#467f8a'}
                strokeWidth="2"
              />
              <text x={x} y={y + 5} textAnchor="middle" fontSize="16" fill="#344d46">
                {e.id}
              </text>
            </g>
          );
        })}
      {route && shot.contact && (
        <>
          <path
            data-bfs-current="closed"
            d={path(current)}
            fill="none"
            stroke="#b77b32"
            strokeWidth="2.8"
          />
          {Array.from({ length: 12 }, (_, i) => {
            const [x, y] = project(
              bfsPathPoint(current, bfsMarkerFraction(i, 12, shot.phaseCycles)),
            );
            return i / 12 < shot.routeReveal ? (
              <circle key={i} cx={x} cy={y} r="3.3" fill="#e0b574" />
            ) : null;
          })}
          {shot.routeReveal > 0.45 &&
            sense.map((p, i) => (
              <path
                key={i}
                data-bfs-sense={i}
                d={path(p)}
                fill="none"
                stroke="#467f8a"
                strokeWidth="2"
              />
            ))}
        </>
      )}
      {route && (
        <>
          <path d={plate(G.source.at, G.source.size)} fill="#445d52" />
          {G.sourcePorts.map((p, i) => {
            const [x, y] = project(p);
            return <path key={i} d={`M${x} ${y}h${i ? -7 : 7}`} stroke="#a3b9ae" strokeWidth="3" />;
          })}
          {(() => {
            const [x, y] = project(G.source.at);
            return (
              <text x={x} y={y + 5} textAnchor="middle" fill="#f2ebdd" fontSize="20">
                ~
              </text>
            );
          })()}
          <path d={plate(G.amplifier.at, G.amplifier.size)} fill="#467f8a" />
          {!shot.contact && (
            <text x={w / 2} y="29" textAnchor="middle" fontSize="16" fill="#a86f33">
              {t('一只脚离开：电流回路断开')}
            </text>
          )}
          {shot.contact && (
            <text x={w / 2} y="29" textAnchor="middle" fontSize="16" fill="#516b60">
              {t('腿与下躯干的等效路径')}
            </text>
          )}
        </>
      )}
      {!route &&
        shot.view !== 'weight' &&
        [-1, 1].map((s, i) => {
          const [x, y] = project([s * 0.82, 0.445, 0]);
          return (
            <ellipse
              key={s}
              cx={x}
              cy={y - (i && !shot.contact ? 16 : 0)}
              rx={scale * 0.34}
              ry="45"
              fill="#c9aaa0"
              fillOpacity=".4"
              stroke="#ad8d83"
              strokeOpacity=".4"
            />
          );
        })}
      {!route && (
        <text
          x={w / 2}
          y={shot.view === 'weight' ? 103 : 292}
          textAnchor="middle"
          fontSize="20"
          fill="#36584e"
        >
          {(shot.massKg * (shot.view === 'weight' ? shot.loadFraction : 1)).toFixed(1)} kg
        </text>
      )}
    </svg>
  );
}
