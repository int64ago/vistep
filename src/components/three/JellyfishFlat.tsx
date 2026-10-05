import { useId } from 'react';
import { t } from '../../i18n';
import { JELLY, jellyVortices, type JellyVortex } from '../../models/jellyfish';
import {
  jellyGonadPoint,
  jellyOralPoint,
  jellyOutline,
  jellyTentaclePoint,
} from '../../models/jellyfish-geometry';
import type { JellyVisual } from './JellyfishStudio';
const path = (points: number[][]) =>
  'M' + points.map((p) => p.map((n) => n.toFixed(2)).join(',')).join(' L');
/** Poloidal circulation in a radial/vertical section of the torus. The two
 * sides have opposite apparent rotation; this is not azimuthal motion around
 * the jellyfish's axis. Core size and tracer speed are visual teaching choices.
 * Both renderers use this geometry, reconstructed from the model's phase. */
export function jellyVortexSection(vortex: JellyVortex, side: -1 | 1, phase: number) {
  const radius = Math.min(0.115, vortex.radius * 0.18);
  const sense = vortex.rotation * side;
  const center = [side * vortex.radius, vortex.y, 0.02];
  const point = (angle: number) => [
    center[0] + radius * Math.cos(angle),
    center[1] + radius * Math.sin(angle),
    center[2],
  ];
  const end = Math.PI / 2,
    span = Math.PI * 1.6;
  const arc = Array.from({ length: 33 }, (_, i) => point(end - sense * span * (1 - i / 32)));
  const tip = point(end),
    backX = tip[0] + sense * radius * 0.55;
  const head = [
    tip,
    [backX, tip[1] + radius * 0.23, center[2]],
    [backX, tip[1] - radius * 0.23, center[2]],
  ];
  return {
    center,
    radius,
    sense,
    arc,
    head,
    marker: point(end + sense * Math.PI * 2 * phase),
  };
}
export default function JellyfishFlat({ visual }: { visual: JellyVisual }) {
  const id = useId().replace(/:/g, ''),
    { frame, shot } = visual,
    r = frame.radius / JELLY.radius,
    scale = 104,
    cx = 200,
    cy = 112;
  return (
    <div className="jelly-flat">
      <svg viewBox="0 0 400 340" role="img" aria-label={t('与三维模型相同姿态的月水母剖面')}>
        <defs>
          <radialGradient id={`${id}-bell`}>
            <stop offset="0" stopColor="#d5f3ef" stopOpacity=".24" />
            <stop offset=".85" stopColor="#6fa9bb" stopOpacity=".13" />
            <stop offset="1" stopColor="#c6e8ed" stopOpacity=".48" />
          </radialGradient>
        </defs>
        {jellyVortices(frame).map((v) => (
          <g key={v.type} opacity={['vortices', 'pressure'].includes(shot.view) ? 1 : 0}>
            <ellipse
              cx={cx}
              cy={cy - v.y * scale}
              rx={v.radius * scale}
              ry="12"
              fill="none"
              stroke={v.type === 'starting' ? '#69a9c3' : '#d2ae72'}
              strokeWidth="3"
              strokeOpacity={v.strength}
            />
            {([-1, 1] as const).map((side) => {
              const section = jellyVortexSection(v, side, frame.phase);
              const project = (p: number[]) => [cx + p[0] * scale, cy - p[1] * scale];
              const color = v.type === 'starting' ? '#69a9c3' : '#d2ae72';
              const marker = project(section.marker);
              return (
                <g
                  key={side}
                  data-vortex-section={`${v.type}:${side}`}
                  data-vortex-sense={section.sense}
                  opacity={0.4 + v.strength * 0.5}
                >
                  <path
                    d={path(section.arc.map(project))}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                  />
                  <path d={`${path(section.head.map(project))} Z`} fill={color} />
                  <circle cx={marker[0]} cy={marker[1]} r="2.4" fill={color} />
                </g>
              );
            })}
          </g>
        ))}
        {shot.view === 'volume' && (
          <path
            d={`${jellyOutline(frame, scale, cx, cy, true)} Z`}
            fill="#75b9c3"
            fillOpacity=".17"
          />
        )}
        {Array.from({ length: 64 }, (_, i) => (
          <path
            key={i}
            d={path(
              Array.from({ length: 13 }, (_, j) => {
                const p = jellyTentaclePoint(i, j / 12, frame);
                return [cx + p[0] * scale, cy - p[1] * scale + p[2] * scale * 0.15];
              }),
            )}
            stroke="#b8d7de"
            strokeOpacity=".32"
            strokeWidth=".7"
            fill="none"
          />
        ))}
        {Array.from({ length: 4 }, (_, arm) => (
          <g key={arm}>
            <path
              d={path(
                Array.from({ length: 33 }, (_, i) => {
                  const p = jellyGonadPoint(arm, i / 32);
                  return [
                    cx + p[0] * r * scale,
                    cy - ((p[1] * frame.height) / JELLY.height) * scale + p[2] * r * scale * 0.25,
                  ];
                }),
              )}
              fill="none"
              stroke="#bca3c4"
              strokeOpacity=".65"
              strokeWidth="5"
            />
            <path
              d={path(
                Array.from({ length: 33 }, (_, i) => {
                  const p = jellyOralPoint(arm, i / 32, 0, frame);
                  return [cx + p[0] * scale, cy - p[1] * scale + p[2] * scale * 0.2];
                }),
              )}
              fill="none"
              stroke="#b0d3d9"
              strokeOpacity=".57"
              strokeWidth="9"
            />
          </g>
        ))}
        <path
          d={`${jellyOutline(frame, scale, cx, cy)} Z`}
          fill={`url(#${id}-bell)`}
          stroke="#b9dfe3"
          strokeOpacity=".65"
          strokeWidth="1.5"
        />
        <ellipse
          cx={cx}
          cy={cy}
          rx={(r + 0.025) * scale}
          ry={(r + 0.025) * scale * 0.15}
          fill="none"
          stroke="#c0dfe2"
          strokeOpacity=".55"
          strokeWidth="2"
        />
        {['volume', 'vortices'].includes(shot.view) &&
          (frame.inflow > 0 || frame.outflow > 0) &&
          [-30, 0, 30].map((x) => (
            <path
              key={x}
              d={
                frame.inflow > 0
                  ? `M${cx + x} ${cy + 57}V${cy + 18}m-5 7 5-7 5 7`
                  : `M${cx + x} ${cy + 18}V${cy + 57}m-5-7 5 7 5-7`
              }
              stroke="#81c8cd"
              strokeWidth="2"
              fill="none"
            />
          ))}
        {shot.view === 'pressure' && frame.recoveryForce > 0 && (
          <path
            d={`M200 ${cy + 25}V${cy - 15}m-7 10 7-10 7 10`}
            stroke="#ddbd83"
            strokeWidth="3"
            fill="none"
          />
        )}
      </svg>
    </div>
  );
}
