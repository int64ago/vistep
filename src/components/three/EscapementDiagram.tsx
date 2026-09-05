import { ESC_ENERGY_PLOT, escapementEnergyY } from './EscapementEnergyPlot';
import { ESC_HARDWARE as H, escapementHanger, escapementOverviewFrame } from './EscapementGeometry';
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
  const overview = escapementOverviewFrame(compact),
    hanger = escapementHanger(pose),
    scale = locking ? (compact ? 100 : 135) : macro ? (compact ? 250 : 290) : overview.scale,
    cx = locking ? -0.42 : macro ? (side ? 1.08 : -1.02) : 0,
    cy = locking ? 1.65 : macro ? 1.04 : 0.5;
  const to = (p: EscPoint, z = 0): EscPoint =>
    macro ? [w / 2 + (p[0] - cx) * scale, h / 2 - (p[1] - cy) * scale] : overview.to(p, z);
  const baseLeft = to([-H.baseWidth / 2, H.baseTop]),
    baseRight = to([H.baseWidth / 2, H.baseBottom]),
    drum = to([0, 0], ESC.drumZ),
    ropeStart = to([hanger.drumTangent[0], hanger.drumTangent[1]], hanger.drumTangent[2]),
    ropeEnd = to([hanger.attachment[0], hanger.attachment[1]], hanger.attachment[2]),
    eye = to([hanger.eyeCentre[0], hanger.eyeCentre[1]], hanger.eyeCentre[2]),
    weightTop = to([hanger.attachment[0] - H.weightWidth / 2, hanger.bodyTop], ESC.drumZ),
    wheelCentre = to([0, 0]),
    circlePath = (radius: number) => {
      const [x, y] = wheelCentre,
        r = radius * scale;
      return `M${x + r},${y}A${r},${r} 0 1 0 ${x - r},${y}A${r},${r} 0 1 0 ${x + r},${y}Z`;
    };
  const pallet = ESC_PALLETS[side],
    corner = to(escWorld(pallet.corner, pose.anchor)),
    end = to(escWorld(pallet.discharge, pose.anchor));
  return (
    <div className="escapement-section-content" role="img" aria-label={t('同一接触几何的二维剖面')}>
      <p className="escapement-section-title">
        {t(
          locking
            ? '锁面与锚轴同心'
            : macro
              ? side
                ? '出口瓦 · 局部剖面'
                : '入口瓦 · 局部剖面'
              : '摆与擒纵轮，共用同一时刻',
        )}
      </p>
      <svg viewBox={`0 35 ${w} ${h - 76}`} aria-hidden="true" className="escapement-diagram">
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="35" width={w} height={h - 76} rx="16" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {!macro && (
            <>
              <rect
                data-esc-base="true"
                x={baseLeft[0]}
                y={baseLeft[1]}
                width={baseRight[0] - baseLeft[0]}
                height={baseRight[1] - baseLeft[1]}
                rx="3"
                fill="#777160"
              />
              <path
                d={`M${to([-1.72, H.baseTop]).join(' ')}V${to([-1.72, 2.48])[1]}H${to([1.72, 2.48])[0]}V${to([1.72, H.baseTop])[1]}`}
                stroke="#c5c9c2"
                strokeWidth="7"
                fill="none"
              />
              <g data-esc-drive="true">
                <line
                  x1={drum[0]}
                  y1={drum[1]}
                  x2={wheelCentre[0]}
                  y2={wheelCentre[1]}
                  stroke="#647d7d"
                  strokeWidth="4"
                />
                <circle
                  cx={drum[0]}
                  cy={drum[1]}
                  r={0.315 * scale}
                  fill="#c5a166"
                  stroke="#8e774c"
                  strokeWidth="1"
                />
                <circle cx={drum[0]} cy={drum[1]} r={ESC.drumRadius * scale} fill="#6b6d5b" />
                <line
                  x1={drum[0]}
                  y1={drum[1]}
                  x2={
                    to(
                      [
                        ESC.drumRadius * Math.sin(pose.wheel),
                        ESC.drumRadius * Math.cos(pose.wheel),
                      ],
                      ESC.drumZ,
                    )[0]
                  }
                  y2={
                    to(
                      [
                        ESC.drumRadius * Math.sin(pose.wheel),
                        ESC.drumRadius * Math.cos(pose.wheel),
                      ],
                      ESC.drumZ,
                    )[1]
                  }
                  stroke="#e4c991"
                  strokeWidth="2"
                />
                <line
                  data-esc-rope="true"
                  x1={ropeStart[0]}
                  y1={ropeStart[1]}
                  x2={ropeEnd[0]}
                  y2={ropeEnd[1]}
                  stroke="#645d4a"
                  strokeWidth={Math.max(1, 0.018 * scale)}
                />
                <rect
                  data-esc-weight="true"
                  x={weightTop[0]}
                  y={weightTop[1]}
                  width={H.weightWidth * scale}
                  height={H.weightHeight * scale}
                  rx={0.055 * scale}
                  fill="#b8985b"
                  stroke="#8f794e"
                  strokeWidth=".8"
                />
                <circle
                  data-esc-eye="true"
                  cx={eye[0]}
                  cy={eye[1]}
                  r={((H.eyeOuter + H.eyeInner) / 2) * scale}
                  fill="none"
                  stroke="#927747"
                  strokeWidth={(H.eyeOuter - H.eyeInner) * scale}
                />
              </g>
            </>
          )}
          <path
            d={circlePath(ESC.rootRadius) + circlePath(0.89)}
            fill="#c5a971"
            fillRule="evenodd"
            fillOpacity={macro ? 1 : 0.55}
          />
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
              d={path(escapementTooth(i, pose.wheel).map((p) => to(p)))}
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
                x2={to([0, ESC.height], pose.bob[2])[0]}
                y2={to([0, ESC.height], pose.bob[2])[1]}
                stroke="#536d73"
                strokeWidth="4"
              />
              <line
                x1={to([0, ESC.height], pose.bob[2])[0]}
                y1={to([0, ESC.height], pose.bob[2])[1]}
                x2={to([pose.bob[0], pose.bob[1]], pose.bob[2])[0]}
                y2={to([pose.bob[0], pose.bob[1]], pose.bob[2])[1]}
                stroke="#536d73"
                strokeWidth="3"
              />
              <circle
                cx={to([pose.bob[0], pose.bob[1]], pose.bob[2])[0]}
                cy={to([pose.bob[0], pose.bob[1]], pose.bob[2])[1]}
                r={0.3 * scale}
                fill="#b8985b"
              />
              <circle
                cx={to([0, ESC.height], pose.bob[2])[0]}
                cy={to([0, ESC.height], pose.bob[2])[1]}
                r="5"
                fill="#536d73"
              />
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
              <circle
                cx={to([0, ESC.height])[0]}
                cy={to([0, ESC.height])[1]}
                r="5"
                fill="#367f74"
              />
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
      </svg>
      {macro ? (
        <div className="escapement-section-legend">
          <span>
            <i style={{ background: '#30887b' }} />
            {t('圆弧锁面')}
          </span>
          <span>
            <i style={{ background: '#b99240' }} />
            {t('平面冲量面')}
          </span>
        </div>
      ) : (
        <p className="escapement-instrument-note escapement-drive-key">
          {t('重锤 → 卷筒 → 擒纵轮')}
        </p>
      )}
    </div>
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
    a = escapementEnergy(time, 0, length),
    b = escapementEnergy(time, drive, length);
  const trace = (d: number) =>
    Array.from({ length: 261 }, (_, i) => {
      const e = escapementEnergy(i / 10, d, length);
      return `${i ? 'L' : 'M'}${32 + ((w - 48) * i) / 260},${escapementEnergyY(e.energy / e.initial)}`;
    }).join(' ');
  return (
    <div className="escapement-instrument-content">
      <svg
        viewBox={`0 0 ${w} 322`}
        role="img"
        aria-label={t('同一起点：自由衰减与定量补能')}
        className="escapement-diagram"
      >
        {[a, b].map((s, i) => {
          const x = w * (i ? 0.75 : 0.25),
            r = 70 * length,
            y = 42;
          return (
            <g key={i}>
              <text x={x} y="22" textAnchor="middle">
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
                r="12"
                fill={i ? '#388c80' : '#ad8276'}
              />
              <text x={x} y="163" textAnchor="middle">
                {(s.energy * 1000).toFixed(2)} mJ
              </text>
            </g>
          );
        })}
        <text x={w / 2} y="191" textAnchor="middle">
          E / E₀
        </text>
        <path d={`M32 ${ESC_ENERGY_PLOT.top}V284H${w - 16}`} fill="none" stroke="#c1c9c3" />
        {[0, 1, 1.5].map((n) => (
          <g key={n}>
            <text x="26" y={escapementEnergyY(n) + 5} textAnchor="end">
              {n}
            </text>
            <path d={`M32 ${escapementEnergyY(n)}H${w - 16}`} stroke="#c1c9c3" opacity=".35" />
          </g>
        ))}
        <path d={trace(0)} stroke="#ad8276" fill="none" strokeWidth="2.4" />
        <path d={trace(drive)} stroke="#388c80" fill="none" strokeWidth="2.4" />
        <line
          x1={32 + ((w - 48) * time) / 26}
          x2={32 + ((w - 48) * time) / 26}
          y1="208"
          y2="287"
          stroke="#46646c"
          strokeDasharray="4 4"
        />
        <text x="32" y="312">
          0 s
        </text>
        <text x={w - 16} y="312" textAnchor="end">
          26 s
        </text>
      </svg>
      <p className="escapement-instrument-note">{t('小角摆 · 理想瞬时补能')}</p>
    </div>
  );
}
export function EscapementPeriod({ time, length }: { time: number; length: number }) {
  const compact = useCompact(),
    w = compact ? 280 : 560,
    h = 333;
  return (
    <div className="escapement-instrument-content">
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
      </svg>
      <p className="escapement-instrument-note">
        {t('同一计时窗口')} · {time.toFixed(1)} s
      </p>
    </div>
  );
}
