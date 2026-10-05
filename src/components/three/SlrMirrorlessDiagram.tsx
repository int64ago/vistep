import { useId } from 'react';
import { t } from '../../i18n';
import {
  cameraGeometry as g,
  cameraPathPoint,
  cameraPrism,
  type CameraPose,
} from '../../models/slr-mirrorless';
import {
  cameraElectronics as e,
  cameraSignalPoint,
  cameraSignalRoutes,
} from '../../models/slr-mirrorless-render-geometry';
const X = (x: number) => (x + 3.9) * 72;
const Y = (y: number) => (3.9 - y) * 72;
export default function SlrMirrorlessDiagram({
  pose,
  trace = 1,
  time = 0,
}: {
  pose: CameraPose;
  trace?: number;
  time?: number;
}) {
  const id = useId().replaceAll(':', '');
  const photon = cameraPathPoint(pose.path, trace < 1 ? trace : (time * 0.15) % 1);
  const points = pose.path.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ');
  const dslr = pose.mode !== 'mirrorless';
  const routes = cameraSignalRoutes(dslr);
  const pulse = ((time % 3.6) + 3.6) % 3.6;
  return (
    <svg
      className="slr-section"
      viewBox="0 0 440 302"
      role="img"
      aria-label={t('相机切开视图：光学取景或传感器到电子取景器的真实路径')}
    >
      <defs>
        <linearGradient id={id + 'glass'} x1="0" x2="1">
          <stop stopColor="#d5e9ea" stopOpacity=".8" />
          <stop offset=".5" stopColor="#8db8c4" stopOpacity=".3" />
          <stop offset="1" stopColor="#d5e9ea" stopOpacity=".8" />
        </linearGradient>
        <linearGradient id={id + 'body'} x1="0" x2="0" y2="1">
          <stop stopColor="#667579" />
          <stop offset="1" stopColor="#263940" />
        </linearGradient>
      </defs>
      <path
        d={`M${X(-1.1)},${Y(0.15)}H${X(1.52)}V${Y(1.8)}H${X(-0.9)}V${Y(1.55)}H${X(-1.1)}Z`}
        fill={'url(#' + id + 'body)'}
        opacity=".16"
        stroke="#687d85"
        strokeWidth="2"
      />
      <path
        d={`M${X(-3.45)},${Y(0.36)}H${X(-1.13)}V${Y(0.48)}H${X(-3.45)}ZM${X(-3.45)},${Y(1.64)}H${X(-1.13)}V${Y(1.52)}H${X(-3.45)}Z`}
        fill="#354b52"
      />
      {[-3.2, -2.35, -1.43].map((x, i) => (
        <ellipse
          key={x}
          cx={X(x)}
          cy={Y(1)}
          rx={i === 1 ? 10 : 8}
          ry="43"
          fill={'url(#' + id + 'glass)'}
          stroke="#81aebc"
          strokeWidth="1.5"
        />
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <line
          key={i}
          x1={X(-2.85 + i * 0.065)}
          x2={X(-2.85 + i * 0.065)}
          y1={Y(1.66)}
          y2={Y(1.52)}
          stroke="#667b82"
          strokeWidth="2"
        />
      ))}
      <rect x={X(g.sensor)} y={Y(1.65)} width="9" height={72 * 1.3} rx="2" fill="#d6ae66" />
      {pose.rows.map((row, i) => (
        <rect
          key={i}
          x={X(g.sensor) - 3}
          y={Y(1.65) + (i / 16) * 72 * 1.3}
          width="4"
          height={(72 * 1.3) / 16 - 1}
          fill={pose.live ? '#85c5c2' : '#e5be72'}
          opacity={pose.live ? 0.8 : 0.18 + 0.82 * row}
        />
      ))}
      <rect
        x={X(g.shutter) - 4}
        y={Y(1.65 - 1.3 * pose.curtains.first)}
        width="4"
        height={72 * 1.3 * (1 - pose.curtains.first)}
        fill="#33434a"
      />
      <rect
        x={X(g.shutter) - 8}
        y={Y(1.65)}
        width="4"
        height={72 * 1.3 * pose.curtains.second}
        fill="#4f6068"
      />
      {dslr && (
        <>
          <polygon
            points={cameraPrism.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')}
            fill={'url(#' + id + 'glass)'}
            stroke="#6d8d98"
            strokeWidth="1.5"
          />
          <line
            x1={X(-0.65)}
            x2={X(0.65)}
            y1={Y(g.screen)}
            y2={Y(g.screen)}
            stroke="#c1c7bd"
            strokeWidth="5"
          />
          <line
            x1={X(pose.mirror.pivot.x)}
            y1={Y(pose.mirror.pivot.y)}
            x2={X(pose.mirror.end.x)}
            y2={Y(pose.mirror.end.y)}
            stroke="#4f6670"
            strokeWidth="6"
          />
          <line
            x1={X(pose.mirror.pivot.x)}
            y1={Y(pose.mirror.pivot.y)}
            x2={X(pose.mirror.end.x)}
            y2={Y(pose.mirror.end.y)}
            stroke="#d0e1e4"
            strokeWidth="2"
          />
          <polyline
            points={[pose.mirror.drive, pose.mirror.joint, pose.mirror.attachment]
              .map((p) => `${X(p.x)},${Y(p.y)}`)
              .join(' ')}
            stroke="#ae9065"
            strokeWidth="4"
            fill="none"
          />
          {[pose.mirror.drive, pose.mirror.joint, pose.mirror.pivot].map((p, i) => (
            <circle key={i} cx={X(p.x)} cy={Y(p.y)} r="4" fill="#dde1d9" stroke="#66777d" />
          ))}
        </>
      )}
      <rect
        x={X(1.15)}
        y={Y(2.58)}
        width="43"
        height="34"
        rx="9"
        fill="#ecf0eb"
        stroke="#344950"
        strokeWidth="4"
      />
      <rect
        x={X(1.26)}
        y={Y(2.46)}
        width="20"
        height="17"
        rx="3"
        fill={pose.optical || (!dslr && pose.live) ? '#aacdd0' : '#182c33'}
      />
      <rect x={X(1.6)} y={Y(1.46)} width="15" height="66" rx="5" fill="#344950" />
      <rect
        x={X(1.63)}
        y={Y(1.37)}
        width="8"
        height="51"
        rx="2"
        fill={pose.live ? '#75afb8' : '#263b40'}
      />
      <rect
        x={X(e.board.x - e.board.width / 2)}
        y={Y(e.board.y + e.board.height / 2)}
        width={72 * e.board.width}
        height={72 * e.board.height}
        rx="2"
        fill="#5e8881"
        stroke="#aecbb8"
      />
      <rect
        x={X(e.processor.x - e.processor.width / 2)}
        y={Y(e.processor.y + e.processor.height / 2)}
        width={72 * e.processor.width}
        height={72 * e.processor.height}
        rx="2"
        fill={pose.live && pulse >= 1.1 && pulse <= 1.6 ? '#74b9b8' : '#30484a'}
      />
      {pose.live && (
        <g>
          {routes.map((route, i) => {
            const progress = i === 0 ? pulse / 1.2 : (pulse - 1.5) / 2.1;
            const p = cameraSignalPoint(route, progress);
            return (
              <g key={i}>
                <polyline
                  points={route.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')}
                  fill="none"
                  stroke="#54b7c0"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                {progress >= 0 && progress <= 1 && (
                  <circle cx={X(p.x)} cy={Y(p.y)} r="3.4" fill="#e0ffff" stroke="#54b7c0" />
                )}
              </g>
            );
          })}
        </g>
      )}
      <polyline
        points={points}
        fill="none"
        stroke="#c6a15c"
        strokeWidth="3"
        opacity=".8"
        strokeLinejoin="round"
      />
      <circle
        cx={X(photon.x)}
        cy={Y(photon.y)}
        r="5"
        fill="#fff0b6"
        stroke="#c7a056"
        strokeWidth="2"
      />
      <line x1="20" x2="422" y1={Y(0.06)} y2={Y(0.06)} stroke="#d4dcd7" />
    </svg>
  );
}
