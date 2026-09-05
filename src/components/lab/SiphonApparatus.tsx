import { useId, useLayoutEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import { SIPHON, siphonPoint, siphonPressure, type SiphonShot } from '../../models/siphon';
import { siphonOutletFlow } from './siphonBranchFlow';

/** Hybrid apparatus: a depth-shaded orthographic vessel section with an exact planar tube. */
export default function SiphonApparatus({
  shot,
  flat = false,
  compact = false,
  initialWidth = 880,
}: {
  shot: SiphonShot;
  flat?: boolean;
  compact?: boolean;
  initialWidth?: number;
}) {
  const host = useRef<HTMLDivElement>(null),
    id = useId().replace(/:/g, '');
  const [width, setWidth] = useState(initialWidth);
  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const s = shot.state,
    g = s.geometry,
    phone = width < 620;
  const tight = phone && compact,
    tall = shot.view === 'height',
    pressureFocus = tight && (tall || shot.view === 'pressure'),
    height = phone ? (tight ? (pressureFocus ? 214 : 288) : 365) : 490;
  const scaleX = phone ? (width - 88) / 2.25 : Math.min(210, (width - 220) / 3.2);
  const originX = phone ? 44 + scaleX * 0.55 : width / 2 - scaleX * 0.55;
  const ground = phone ? (tight ? 164 : 235) : 348,
    scaleY = phone ? (tight ? 56 : 84) : 143;
  const project = (p: { x: number; y: number }) => ({
    x: originX + p.x * scaleX,
    y:
      ground -
      (tall && p.y > 1.25 ? 1.25 * scaleY + (p.y - 1.25) * (tight ? 6 : 10) : p.y * scaleY),
  });
  const at = (distance: number) => project(siphonPoint(g, distance));
  const points = Array.from({ length: 181 }, (_, n) => at((g.length * n) / 180));
  const path = (from = 0, to = g.length) =>
    Array.from({ length: 121 }, (_, n) => {
      const p = at(from + ((to - from) * n) / 120);
      return `${n ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    }).join(' ');
  // Closed wall silhouette from a common normal offset, never independent disconnected elbows.
  const side = (sign: number) =>
    points.map((p, i) => {
      const a = points[Math.max(0, i - 1)],
        b = points[Math.min(points.length - 1, i + 1)];
      const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      return {
        x: p.x - (sign * 8 * (b.y - a.y)) / length,
        y: p.y + (sign * 8 * (b.x - a.x)) / length,
      };
    });
  const outline =
    [...side(1), ...side(-1).reverse()].map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ') +
    ' Z';
  const source = project({ x: 0, y: s.sourceLevel }),
    receiver = project({ x: g.outlet.x, y: s.receiverLevel });
  const crest = at(g.crestAt),
    minimum = at(s.minimumPressureAt),
    inlet = at(0),
    outlet = at(g.length);
  const vessel = (
    x: number,
    floor: number,
    top: number,
    level: number,
    radius: number,
    key: string,
  ) => {
    const center = project({ x, y: 0 }).x,
      bottom = project({ x, y: floor }).y;
    const rim = project({ x, y: top }).y,
      surface = project({ x, y: level }).y;
    const rx = radius * scaleX,
      ry = flat ? 0 : 7,
      dx = flat ? 0 : 8;
    return (
      <g key={key}>
        <ellipse
          cx={center}
          cy={bottom + 7}
          rx={rx * 1.32}
          ry={ry * 0.64}
          fill="#264d4a"
          opacity=".07"
        />
        <path
          d={`M${center - rx},${rim}V${bottom}H${center + rx}V${rim}l${dx},${-ry}V${bottom - ry}l${-dx},${ry}`}
          fill={flat ? '#f4f7ef' : `url(#${id}-glass)`}
          stroke="#91aaa2"
          strokeWidth="1.5"
        />
        <path
          d={`M${center - rx + 2},${surface}V${bottom - 2}H${center + rx - 2}V${surface}Z`}
          fill={`url(#${id}-water)`}
          opacity=".84"
        />
        <path
          d={`M${center - rx + 2},${surface}h${2 * rx - 4}l${dx},${-ry}h${-2 * rx + 4}Z`}
          fill="#a8d2bb"
          stroke="#588d7d"
          strokeWidth="1.3"
        />
        <path
          d={`M${center - rx},${rim}h${2 * rx}l${dx},${-ry}h${-2 * rx}Z`}
          fill="none"
          stroke="#9cae9f"
          strokeWidth="2"
        />
        {!flat && (
          <path
            d={`M${center - rx + 6},${rim + 9}V${bottom - 9}`}
            stroke="#fff"
            opacity=".85"
            strokeWidth="3"
          />
        )}
        {Array.from({ length: 5 }, (_, n) => {
          const y = rim + ((bottom - rim) * (n + 1)) / 6;
          return <path key={n} d={`M${center + rx - 10},${y}h7`} stroke="#6b8a7d" opacity=".65" />;
        })}
      </g>
    );
  };
  const marked = s.status === 'flow' && shot.view !== 'height';
  const focus = at(shot.focus);
  const gap = s.status === 'vapor';
  // Vapor glyphs flag invalid single-phase physics; no invented gas volume is subtracted.
  const waterIntervals = s.wet;
  const outflow = siphonOutletFlow(shot);
  const jet = outflow.jet && { from: project(outflow.jet.from), to: project(outflow.jet.to) };
  const headX = phone ? width - 18 : Math.min(width - 55, outlet.x + 92);
  return (
    <div className="siphon-apparatus" ref={host} data-flat={flat} data-compact={compact}>
      <div className="siphon-apparatus-note">
        {tall ? (
          <>
            {!compact && (
              <span>
                {t('顶部抬升')} {(g.crest.y - s.sourceLevel).toFixed(2)} m
              </span>
            )}
            <span>{t(compact ? '上段压缩 · 管径放大' : '上段高度压缩显示')}</span>
          </>
        ) : (
          <span>{t(compact ? '管径放大 · 刚性弯管' : '管径放大显示 · 刚性弯管')}</span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t('虹吸装置：水源、连续弯管与接水容器，水位由体积守恒计算。')}
      >
        <defs>
          <linearGradient id={`${id}-glass`}>
            <stop stopColor="#e0ebe3" stopOpacity=".48" />
            <stop offset=".3" stopColor="#fff" stopOpacity=".12" />
            <stop offset=".85" stopColor="#fafef9" stopOpacity=".7" />
            <stop offset="1" stopColor="#adc3b8" stopOpacity=".35" />
          </linearGradient>
          <linearGradient id={`${id}-water`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#aed7bf" />
            <stop offset=".52" stopColor="#79ae9c" />
            <stop offset="1" stopColor="#518e80" />
          </linearGradient>
          <linearGradient id={`${id}-tube`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#f6fffa" />
            <stop offset=".5" stopColor="#dae9db" />
            <stop offset="1" stopColor="#b1c7b5" />
          </linearGradient>
        </defs>
        {!pressureFocus && (
          <path d={`M24,${ground + 82}H${width - 24}`} stroke="#bdc8b4" strokeWidth="1" />
        )}
        {vessel(-0.325, 0, 1.2, s.sourceLevel, 0.625, 'source')}
        {vessel(g.outlet.x, SIPHON.receiverFloor, 0.12, s.receiverLevel, 0.325, 'receiver')}
        <path
          d={outline}
          fill={`url(#${id}-tube)`}
          stroke="#849e92"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path d={path()} fill="none" stroke="#f9fcf3" strokeWidth="10" strokeLinecap="butt" />
        {waterIntervals.map(
          ([a, b], n) =>
            b > a && (
              <path
                key={n}
                d={path(a, b)}
                fill="none"
                stroke={s.status === 'vapor' ? '#8daf9f' : '#68aa98'}
                strokeWidth="8"
                strokeLinecap="butt"
              />
            ),
        )}
        <path d={path()} fill="none" stroke="#fff" opacity=".26" strokeWidth="2" />
        {marked &&
          Array.from({ length: 13 }, (_, n) => {
            const distance =
              (((s.travel * 0.22 + (n * g.length) / 13) % g.length) + g.length) % g.length;
            const q = at(distance);
            return <circle key={n} cx={q.x} cy={q.y} r="2.1" fill="#f1fae5" />;
          })}
        {jet && (
          <path
            data-siphon-jet={outflow.kind}
            d={`M${jet.from.x},${jet.from.y}L${jet.to.x},${jet.to.y}`}
            stroke="#6cae9b"
            strokeWidth="4"
            opacity=".8"
            strokeLinecap="round"
          />
        )}
        <ellipse cx={inlet.x} cy={inlet.y} rx="6" ry="2.8" fill="#428779" stroke="#e4f2dc" />
        <ellipse
          data-siphon-outlet={outflow.outletWet ? 'wet' : 'dry'}
          cx={outlet.x}
          cy={outlet.y}
          rx="6"
          ry="2.8"
          fill={outflow.outletWet ? '#428779' : '#fafaf0'}
          stroke="#819d89"
        />
        <g transform={`translate(${crest.x},${crest.y})`}>
          <path d="M0,-7V-19" stroke="#849e92" strokeWidth="6" />
          <path d="M0,-7V-19" stroke={s.vent ? '#f1e0af' : '#e2ead8'} strokeWidth="3" />
          <path
            d={s.vent ? 'M-7,-26L7,-22' : 'M-7,-19H7'}
            stroke="#a48958"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
        {s.vent && (
          <g stroke="#b99957" fill="none">
            <path d={`M${crest.x - 21},${crest.y - 40}q21,-10 21,19`} strokeWidth="1.5" />
            <circle cx={crest.x} cy={crest.y - 6} r="3" />
            <circle cx={crest.x + 7} cy={crest.y + 1} r="2" />
          </g>
        )}
        {gap && (
          <g fill="#f5e9bb" stroke="#aa925f">
            <circle cx={minimum.x - 8} cy={minimum.y} r="4" />
            <circle cx={minimum.x + 3} cy={minimum.y + 1} r="5" />
            <circle cx={minimum.x + 11} cy={minimum.y + 2} r="3" />
          </g>
        )}
        {s.pump && (
          <g>
            <path
              d={`M${outlet.x},${outlet.y + 2}v24h-28`}
              fill="none"
              stroke="#798a75"
              strokeWidth="5"
            />
            <ellipse
              cx={outlet.x - 43}
              cy={outlet.y + 26}
              rx="19"
              ry="12"
              fill="#a18a62"
              stroke="#897250"
            />
            <text x={outlet.x - 8} y={outlet.y + 62} textAnchor="end">
              {t('手动预充')}
            </text>
          </g>
        )}
        <g className="siphon-reference" fill="none" stroke="#6f8877" strokeWidth="1">
          <path
            d={`M${source.x + 12},${source.y}H${headX}M${outlet.x + 10},${outlet.y}H${headX}`}
            strokeDasharray="3 5"
          />
          <path
            d={`M${headX},${source.y}V${outlet.y}m-4,-2l4,2 4,-2M${headX - 4},${source.y + 2}l4,-2 4,2`}
          />
        </g>
        <text
          x={headX - 8}
          y={(source.y + outlet.y) / 2 - 8}
          textAnchor="end"
          className="siphon-delta"
        >
          Δh {s.head.toFixed(2)} m
        </text>
        {!pressureFocus && (
          <text x={project({ x: -0.325, y: 0 }).x} y={ground + 31} textAnchor="middle">
            {t('水源')}
          </text>
        )}
        {!pressureFocus && (
          <text
            x={project({ x: -0.325, y: 0 }).x}
            y={ground + 54}
            textAnchor="middle"
            className="siphon-amount"
          >
            {(s.sourceVolume * 1000).toFixed(1)} L
          </text>
        )}
        {!pressureFocus && (
          <text
            x={phone ? width - 10 : receiver.x}
            y={ground + 111}
            textAnchor={phone ? 'end' : 'middle'}
          >
            {t('已接收')} {(s.receiverVolume * 1000).toFixed(1)} L
          </text>
        )}
        {tall ? (
          <>
            {[0, 1.6].map((x) => {
              const q = project({ x, y: 1.3 });
              return (
                <path
                  key={x}
                  d={`M${q.x - 12},${q.y - 3}l24,-7m-24,16l24,-7`}
                  stroke="#f2f4e9"
                  strokeWidth="3"
                />
              );
            })}
          </>
        ) : null}
        {shot.view === 'pressure' && (
          <g>
            <circle
              cx={crest.x}
              cy={crest.y}
              r="13"
              fill="none"
              stroke="#aa8951"
              strokeWidth="1.5"
            />
            <path d={`M${crest.x + 14},${crest.y}h${phone ? 20 : 55}`} stroke="#aa8951" />
            <text x={crest.x + (phone ? 20 : 57)} y={crest.y - 12} textAnchor="middle">
              {(s.crestPressure / 1000).toFixed(1)} kPa
            </text>
          </g>
        )}
        {shot.focus > 0 && shot.view === 'apparatus' && (
          <circle cx={focus.x} cy={focus.y} r="8" fill="none" stroke="#b69a53" strokeWidth="2" />
        )}
      </svg>
      {shot.view === 'pressure' && (
        <div className="siphon-pressure-strip">
          <div>
            <span>{t('沿管绝对压力')}</span>
            <span>
              {t('水源')} → {t('顶部')} → {t('出口')}
            </span>
          </div>
          <svg
            viewBox={`0 0 ${width} ${tight ? 90 : 115}`}
            role="img"
            aria-label={t('沿管压力先下降，在下行段恢复；出口回到大气压。')}
          >
            <path d={`M24,32H${width - 24}`} stroke="#a1ad99" strokeDasharray="3 5" />
            <text x={width - 25} y={24} textAnchor="end">
              {t('大气压')}
            </text>
            <path
              d={Array.from(
                { length: 121 },
                (_, i) =>
                  `${i ? 'L' : 'M'}${24 + ((width - 48) * i) / 120},${32 + (s.atmosphere - siphonPressure(s, (g.length * i) / 120)) / (tight ? 400 : 270)}`,
              ).join(' ')}
              fill="none"
              stroke="#478c7d"
              strokeWidth="2.5"
            />
            <circle
              cx={24 + ((width - 48) * g.crestAt) / g.length}
              cy={32 + (s.atmosphere - s.crestPressure) / (tight ? 400 : 270)}
              r="4"
              fill="#ac8a4d"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
