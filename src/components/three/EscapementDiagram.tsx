import { useId } from 'react';
import { t } from '../../i18n';
import { useCompact } from '../lab/useCompact';
import {
  ESC,
  ESC_PALLETS,
  escWorld,
  escapementTooth,
  escapementEnergy,
  escapementPose,
  escapementPeriod,
  type EscPose,
  type EscPoint,
} from '../../models/escapement';
const path = (points: EscPoint[]) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ') + 'Z';
export function EscapementDiagram({ pose, focus }: { pose: EscPose; focus: string }) {
  const clipId = useId(),
    compact = useCompact(),
    w = compact ? 280 : 520,
    h = compact ? 330 : 360,
    macro = focus === 'entry' || focus === 'exit' || focus === 'lock',
    locking = focus === 'lock',
    side = focus === 'exit' ? 1 : 0;
  const scale = locking ? (compact ? 100 : 135) : macro ? (compact ? 250 : 290) : compact ? 54 : 63,
    cx = locking ? -0.42 : macro ? (side ? 1.08 : -1.02) : 0,
    cy = locking ? 1.65 : macro ? 1.04 : 0.5;
  const to = (p: EscPoint): EscPoint => [w / 2 + (p[0] - cx) * scale, h / 2 - (p[1] - cy) * scale];
  const pallet = ESC_PALLETS[side],
    corner = to(escWorld(pallet.corner, pose.anchor)),
    end = to(escWorld(pallet.discharge, pose.anchor));
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('同一接触几何的二维剖面')}
      className="escapement-diagram"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="35" width={w} height={h - 76} rx="16" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {!macro && (
          <>
            <rect x={w / 2 - 100} y={h - 45} width="200" height="9" rx="4" fill="#777160" />
            <path
              d={`M${w / 2 - 90} ${h - 45}V35H${w / 2 + 90}V${h - 45}`}
              stroke="#c5c9c2"
              strokeWidth="7"
              fill="none"
            />
          </>
        )}
        <circle cx={to([0, 0])[0]} cy={to([0, 0])[1]} r={ESC.rootRadius * scale} fill="#c5a971" />
        <circle cx={to([0, 0])[0]} cy={to([0, 0])[1]} r={0.89 * scale} fill="#f3f1e8" />
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i * Math.PI * 2) / 5 - pose.wheel;
          return (
            <line
              key={i}
              x1={to([0, 0])[0]}
              y1={to([0, 0])[1]}
              x2={to([Math.cos(a) * 0.95, Math.sin(a) * 0.95])[0]}
              y2={to([Math.cos(a) * 0.95, Math.sin(a) * 0.95])[1]}
              stroke="#c5a971"
              strokeWidth={0.1 * scale}
            />
          );
        })}
        {Array.from({ length: 30 }, (_, i) => (
          <path
            key={i}
            d={path(escapementTooth(i, pose.wheel).map(to))}
            fill={i === 0 ? '#4e9287' : '#b8985b'}
            stroke="#8f794e"
            strokeWidth=".7"
          />
        ))}
        {ESC_PALLETS.map((p, i) => {
          const mount = to(escWorld(p.attachment, pose.anchor)),
            pivot = to([0, ESC.height]);
          return (
            <g key={i}>
              <line
                x1={pivot[0]}
                y1={pivot[1]}
                x2={mount[0]}
                y2={mount[1]}
                stroke="#6e8a90"
                strokeWidth={macro ? 10 : 7}
              />
              <path
                d={path(p.outline.map((v) => to(escWorld(v, pose.anchor))))}
                fill="#b37164"
                stroke="#804e45"
                strokeWidth=".8"
              />
            </g>
          );
        })}
        {!macro && (
          <>
            <line
              x1={to([0, ESC.height])[0]}
              y1={to([0, ESC.height])[1]}
              x2={to([pose.bob[0], pose.bob[1]])[0]}
              y2={to([pose.bob[0], pose.bob[1]])[1]}
              stroke="#536d73"
              strokeWidth="3"
            />
            <circle
              cx={to([pose.bob[0], pose.bob[1]])[0]}
              cy={to([pose.bob[0], pose.bob[1]])[1]}
              r="15"
              fill="#b8985b"
            />
            <circle cx={to([0, ESC.height])[0]} cy={to([0, ESC.height])[1]} r="5" fill="#536d73" />
          </>
        )}
        {locking && (
          <>
            <path
              d={Array.from({ length: 61 }, (_, i) => {
                const a = ((-180 + i * 1.5) * Math.PI) / 180,
                  v = to([ESC.radius * Math.cos(a), ESC.height + ESC.radius * Math.sin(a)]);
                return `${i ? 'L' : 'M'}${v[0]} ${v[1]}`;
              }).join(' ')}
              fill="none"
              stroke="#6b9f92"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
            <circle cx={to([0, ESC.height])[0]} cy={to([0, ESC.height])[1]} r="5" fill="#367f74" />
          </>
        )}
        {macro && (
          <>
            <path
              d={pallet.lock
                .map((p, i) => {
                  const v = to(escWorld(p, pose.anchor));
                  return `${i ? 'L' : 'M'}${v[0]} ${v[1]}`;
                })
                .join(' ')}
              stroke="#30887b"
              strokeWidth="4"
              fill="none"
            />
            <line
              x1={corner[0]}
              y1={corner[1]}
              x2={end[0]}
              y2={end[1]}
              stroke="#b99240"
              strokeWidth="4"
            />
            <line
              x1={corner[0]}
              y1={corner[1]}
              x2={to([0, ESC.height])[0]}
              y2={to([0, ESC.height])[1]}
              stroke="#759b91"
              strokeWidth="1.5"
              strokeDasharray="5 6"
            />
          </>
        )}
        {pose.contact && (
          <circle
            cx={to(pose.contact)[0]}
            cy={to(pose.contact)[1]}
            r={macro ? 5 : 3}
            fill="#2c857c"
            stroke="#fff"
            strokeWidth="1.5"
          />
        )}
      </g>
      <text x="14" y="25">
        {t(
          locking
            ? '锁面与锚轴同心'
            : macro
              ? side
                ? '出口瓦 · 局部剖面'
                : '入口瓦 · 局部剖面'
              : '摆与擒纵轮，共用同一时刻',
        )}
      </text>
      {macro ? (
        <>
          <circle cx="18" cy={h - 23} r="4" fill="#30887b" />
          <text x="30" y={h - 17}>
            {t('圆弧锁面')}
          </text>
          <circle cx={w * 0.54} cy={h - 23} r="4" fill="#b99240" />
          <text x={w * 0.54 + 12} y={h - 17}>
            {t('平面冲量面')}
          </text>
        </>
      ) : (
        <text x={w / 2} y={h - 12} textAnchor="middle">
          {t('每次完整往返：前进一齿')}
        </text>
      )}
    </svg>
  );
}
export function EscapementEnergy({
  time,
  drive,
  length,
}: {
  time: number;
  drive: number;
  length: number;
}) {
  const compact = useCompact(),
    w = compact ? 280 : 560,
    h = 370,
    a = escapementEnergy(time, 0, length),
    b = escapementEnergy(time, drive, length);
  const trace = (d: number) =>
    Array.from({ length: 261 }, (_, i) => {
      const e = escapementEnergy(i / 10, d, length);
      return `${i ? 'L' : 'M'}${28 + ((w - 44) * i) / 260},${312 - (88 * e.energy) / e.initial}`;
    }).join(' ');
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('同一起点：自由衰减与定量补能')}
      className="escapement-diagram"
    >
      {[a, b].map((s, i) => {
        const x = w * (i ? 0.75 : 0.25),
          r = 95 * length,
          y = 58;
        return (
          <g key={i}>
            <text x={x} y="26" textAnchor="middle">
              {t(i ? '中点补能' : '没有补能')}
            </text>
            <line
              x1={x}
              y1={y}
              x2={x + Math.sin(s.angle) * r}
              y2={y + Math.cos(s.angle) * r}
              stroke={i ? '#388c80' : '#9d7166'}
              strokeWidth="3"
            />
            <circle cx={x} cy={y} r="4" fill="#536c70" />
            <circle
              cx={x + Math.sin(s.angle) * r}
              cy={y + Math.cos(s.angle) * r}
              r="13"
              fill={i ? '#388c80' : '#ad8276'}
            />
            <text x={x} y="196" textAnchor="middle">
              {(s.energy * 1000).toFixed(2)} mJ
            </text>
          </g>
        );
      })}
      <text x={w / 2} y="215" textAnchor="middle">
        E / E₀
      </text>
      <path d={`M28 222V312H${w - 16}`} fill="none" stroke="#c1c9c3" />
      <path d={trace(0)} stroke="#ad8276" fill="none" strokeWidth="2.4" />
      <path d={trace(drive)} stroke="#388c80" fill="none" strokeWidth="2.4" />
      <line
        x1={28 + ((w - 44) * time) / 26}
        x2={28 + ((w - 44) * time) / 26}
        y1="219"
        y2="316"
        stroke="#46646c"
        strokeDasharray="4 4"
      />
      <text x="28" y="339">
        0 s
      </text>
      <text x={w - 16} y="339" textAnchor="end">
        26 s
      </text>
      <text x={w / 2} y="366" textAnchor="middle">
        {t('小角摆 · 理想瞬时补能')}
      </text>
    </svg>
  );
}
export function EscapementPeriod({ time, length }: { time: number; length: number }) {
  const compact = useCompact(),
    w = compact ? 280 : 560,
    h = 360;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('相同经过时间，改变有效摆长')}
      className="escapement-diagram"
    >
      {[0.7, length].map((l, i) => {
        const p = escapementPose(time / escapementPeriod(l), 4, l),
          x = w * (i ? 0.75 : 0.25),
          r = 125 * l;
        return (
          <g key={i}>
            <text x={x} y="25" textAnchor="middle">
              {l.toFixed(2)} m
            </text>
            <line
              x1={x}
              y1="49"
              x2={x + r * Math.sin(p.anchor)}
              y2={49 + r * Math.cos(p.anchor)}
              stroke="#6a8384"
              strokeWidth="3"
            />
            <circle
              cx={x + r * Math.sin(p.anchor)}
              cy={49 + r * Math.cos(p.anchor)}
              r="13"
              fill={i ? '#388c80' : '#bd9b63'}
            />
            <circle cx={x} cy="49" r="4" fill="#536c70" />
            <text x={x} y="229" textAnchor="middle">
              T {p.period.toFixed(2)} s
            </text>
            <text x={x} y="263" textAnchor="middle">
              {p.countedSteps} {t('次放行')}
            </text>
            <circle cx={x} cy="300" r="22" fill="none" stroke="#c5ac7c" strokeWidth="4" />
            <line
              x1={x}
              y1="300"
              x2={x + 20 * Math.sin(p.wheel)}
              y2={300 - 20 * Math.cos(p.wheel)}
              stroke="#618d84"
              strokeWidth="3"
            />
          </g>
        );
      })}
      <text x={w / 2} y="355" textAnchor="middle">
        {t('同一计时窗口')} · {time.toFixed(1)} s
      </text>
    </svg>
  );
}
