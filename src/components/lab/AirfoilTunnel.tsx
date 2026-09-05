import { useEffect, useId, useRef, useState } from 'react';
import { t } from '../../i18n';
import {
  airfoilCirculation,
  airfoilField,
  airfoilForcePrefix,
  airfoilGeometry,
  airfoilPair,
  airfoilStreamlines,
  airfoilSurface,
  sampleAirfoilPath,
  type AirfoilShot,
  type AirfoilVector,
} from '../../models/airfoil';

const path = (points: AirfoilVector[], close = false) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ') +
  (close ? 'Z' : '');
const cpColor = (cp: number) =>
  cp < 0
    ? `hsl(187 30% ${64 - Math.min(2.5, -cp) * 8}%)`
    : `hsl(34 51% ${62 - Math.min(1, cp) * 9}%)`;
/** The same shaft/head vertices serve drawing and viewport fitting. */
function arrowPoints(x: number, y: number, dx: number, dy: number) {
  const length = Math.hypot(dx, dy);
  if (length < 0.5) return [];
  const ux = dx / length,
    uy = dy / length,
    head = Math.min(5, length * 0.35);
  const end = { x: x + dx, y: y + dy };
  return [
    { x, y },
    end,
    {
      x: end.x - head * ux - head * 0.6 * uy,
      y: end.y - head * uy + head * 0.6 * ux,
    },
    end,
    {
      x: end.x - head * ux + head * 0.6 * uy,
      y: end.y - head * uy - head * 0.6 * ux,
    },
  ];
}

/** Fit the entire closed measuring path, its moving 5px probe and every arrow head. */
export function fitAirfoilCirculation(
  samples: ReturnType<typeof airfoilCirculation>['samples'],
  width: number,
  height: number,
  arrowScale: number,
  top = 40,
) {
  const frame = {
    left: 20,
    right: width - 20,
    top: top + 8,
    bottom: height - 50,
  };
  const boundsAt = (scale: number) => {
    let left = Infinity,
      right = -Infinity,
      top = Infinity,
      bottom = -Infinity;
    const include = (x: number, y: number, radius: number) => {
      left = Math.min(left, x - radius);
      right = Math.max(right, x + radius);
      top = Math.min(top, y - radius);
      bottom = Math.max(bottom, y + radius);
    };
    samples.forEach((sample, index) => {
      const x = sample.x * scale,
        y = -sample.y * scale;
      include(x, y, 5);
      if (index % 24 === 0)
        arrowPoints(x, y, sample.u * arrowScale, -sample.v * arrowScale).forEach((point) =>
          include(point.x, point.y, 0.65),
        );
    });
    return { left, right, top, bottom };
  };
  const world = boundsAt(1),
    availableWidth = frame.right - frame.left,
    availableHeight = frame.bottom - frame.top;
  let low = 0,
    high =
      Math.max(1, width, height) /
      Math.max(1e-9, Math.min(world.right - world.left - 10, world.bottom - world.top - 10));
  // Bounding width/height are convex in scale; the feasible interval contains zero.
  while (true) {
    const b = boundsAt(high);
    if (b.right - b.left > availableWidth || b.bottom - b.top > availableHeight) break;
    high *= 2;
  }
  for (let i = 0; i < 28; i++) {
    const mid = (low + high) / 2,
      b = boundsAt(mid);
    if (b.right - b.left <= availableWidth && b.bottom - b.top <= availableHeight) low = mid;
    else high = mid;
  }
  const bounds = boundsAt(low),
    cx = (frame.left + frame.right - bounds.left - bounds.right) / 2,
    cy = (frame.top + frame.bottom - bounds.top - bounds.bottom) / 2;
  return {
    scale: low,
    cx,
    cy,
    frame,
    bounds: {
      left: bounds.left + cx,
      right: bounds.right + cx,
      top: bounds.top + cy,
      bottom: bounds.bottom + cy,
    },
  };
}
function Arrow({
  x,
  y,
  dx,
  dy,
  color = '#c5ae7d',
  width = 1.5,
}: {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color?: string;
  width?: number;
}) {
  const points = arrowPoints(x, y, dx, dy);
  if (!points.length) return null;
  return (
    <path
      d={points.map((p, i) => `${i === 0 || i === 2 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
export default function AirfoilTunnel({
  shot,
  probe = 0.25,
  initialWidth = 840,
}: {
  shot: AirfoilShot;
  probe?: number;
  initialWidth?: number;
}) {
  const host = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(initialWidth),
    id = useId().replace(/:/g, '');
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const measure = () => {
      if (el.clientWidth > 0) setWidth(el.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const phone = width < 560,
    W = width,
    H = phone ? 244 : 440,
    windowTop = phone ? 64 : 40,
    m = shot.model,
    p = m.parameters;
  const tail = airfoilGeometry(p, 0),
    kutta = shot.view === 'kutta',
    pairView = shot.view === 'parcels',
    circ = shot.view === 'circulation',
    forces = shot.view === 'forces';
  const contour = circ ? airfoilCirculation(p) : null,
    arrowScale = phone ? 0.65 : 0.9,
    fit = contour ? fitAirfoilCirculation(contour.samples, W, H, arrowScale, windowTop) : null;
  const domain = pairView ? 2.13 : phone ? 1.25 : 1.9;
  const s = fit?.scale ?? (W - (phone ? 32 : 90)) / (domain * p.chord),
    cx = fit?.cx ?? W / 2,
    cy = fit?.cy ?? (phone ? 137 : 240);
  const pos = (v: AirfoilVector): AirfoilVector =>
    kutta
      ? {
          x: W * 0.68 + ((v.x - tail.x) * (W - 40)) / (0.32 * p.chord),
          y: H * 0.5 - ((v.y - tail.y) * (W - 40)) / (0.32 * p.chord),
        }
      : { x: cx + v.x * s, y: cy - v.y * s };
  const lines = !shot.steadyFamily && !kutta && !circ && !forces ? airfoilStreamlines(p) : [];
  const pair = pairView ? airfoilPair(p) : null;
  const selected = airfoilSurface(p, 2 * Math.PI * Math.max(0.002, Math.min(0.998, probe)));
  const partial = airfoilForcePrefix(m, forces ? shot.progress : 1),
    gain = 0.11;
  const grid: React.ReactNode[] = [];
  if (shot.steadyFamily || forces) {
    for (let row = -2; row <= 2; row++)
      for (let col = -4; col <= 4; col++) {
        const point = { x: col * p.chord * 0.145, y: row * p.chord * 0.19 },
          f = airfoilField(p, point);
        if (!f.valid) continue;
        const v = pos(point),
          arrowScale = phone ? 0.55 : 0.85;
        grid.push(
          <Arrow
            key={`${row}-${col}`}
            x={v.x}
            y={v.y}
            dx={f.u * arrowScale}
            dy={-f.v * arrowScale}
            color="#658082"
            width={1}
          />,
        );
      }
  }
  const segments = [];
  for (let i = 0; i < m.surface.length; i += 8) {
    const chunk = m.surface.slice(i, i + 8),
      cp = chunk.reduce((v, a) => v + a.cp, 0) / chunk.length;
    segments.push(
      <path
        key={i}
        d={path(m.outline.slice(i, Math.min(i + 9, m.outline.length)).map(pos))}
        stroke={cpColor(cp)}
        strokeWidth={phone ? 3.2 : 4.1}
        fill="none"
        strokeLinecap="round"
      />,
    );
  }
  return (
    <div ref={host} className="airfoil-tunnel">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('解析速度场中的对称翼型；表面颜色与压力、轨迹与速度、合力与整圈积分一致。')}
      >
        <defs>
          <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#ced8d0" />
            <stop offset=".48" stopColor="#839a99" />
            <stop offset="1" stopColor="#536e73" />
          </linearGradient>
          <linearGradient id={`${id}-pressure`}>
            {Array.from({ length: 71 }, (_, i) => (
              <stop key={i} offset={i / 70} stopColor={cpColor(-2.5 + i * 0.05)} />
            ))}
          </linearGradient>
          <clipPath id={`${id}-window`}>
            <rect x={12} y={windowTop} width={W - 24} height={H - windowTop - 42} rx={14} />
          </clipPath>
        </defs>
        <text x={phone ? 16 : 30} y={25}>
          {t(
            kutta
              ? '尾缘局部'
              : pairView
                ? '同一释放时刻'
                : circ
                  ? '环量的计量路径'
                  : '理想二维观察窗',
          )}
        </text>
        <text x={W - (phone ? 16 : 30)} y={phone ? 49 : 25} textAnchor="end">
          {kutta
            ? 'Kutta'
            : pairView
              ? `${(shot.physicalTime * 1000).toFixed(1)} ms`
              : `α = ${p.angle.toFixed(1)}°`}
        </text>
        <g clipPath={`url(#${id}-window)`}>
          {[0.25, 0.5, 0.75].map((f) => (
            <path
              key={f}
              d={`M12,${windowTop + (H - windowTop - 42) * f}H${W - 12}`}
              stroke="#638081"
              opacity=".1"
              strokeDasharray="2 8"
            />
          ))}
          {lines.map((line, i) => (
            <g key={i}>
              <path
                d={path(line.points.map(pos))}
                stroke="#91aca7"
                strokeOpacity=".39"
                strokeWidth={1.1}
                fill="none"
              />
              {!pairView &&
                Array.from({ length: 13 }, (_, j) => j - 6).map((birth) => {
                  const elapsed = shot.physicalTime - birth * 0.017;
                  if (elapsed < 0) return null;
                  const point = sampleAirfoilPath(line, elapsed);
                  if (!point.visible) return null;
                  const v = pos(point);
                  return (
                    <circle
                      key={birth}
                      cx={v.x}
                      cy={v.y}
                      r={phone ? 1.8 : 2.3}
                      fill="#c4d3bf"
                      opacity=".75"
                    />
                  );
                })}
            </g>
          ))}
          {grid}
          {contour && (
            <>
              <path
                d={path(contour.samples.map(pos), true)}
                stroke="#9fac9a"
                strokeDasharray="4 6"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d={path(
                  contour.samples
                    .slice(0, Math.max(1, Math.round(contour.samples.length * shot.progress)))
                    .map(pos),
                )}
                stroke="#d1b77f"
                strokeWidth="2"
                fill="none"
              />
              {contour.samples
                .filter((_, i) => i % 24 === 0)
                .map((a, i) => {
                  const v = pos(a);
                  return (
                    <Arrow
                      key={i}
                      x={v.x}
                      y={v.y}
                      dx={a.u * arrowScale}
                      dy={-a.v * arrowScale}
                      color="#b3c9c0"
                      width={1.3}
                    />
                  );
                })}
              {(() => {
                const a =
                    contour.samples[
                      Math.min(
                        contour.samples.length - 1,
                        Math.floor(shot.progress * contour.samples.length),
                      )
                    ],
                  v = pos(a);
                return <circle cx={v.x} cy={v.y} r={5} fill="#d3b77d" />;
              })()}
            </>
          )}
          {pair && (
            <>
              <path
                d={`M${pos({ x: tail.x, y: 0 }).x},45V${H - 48}`}
                stroke="#a4b5a9"
                strokeWidth="1"
                strokeDasharray="4 5"
              />
              {pair.map((line, i) => (
                <g key={i}>
                  <path
                    d={path(line.points.map(pos))}
                    stroke={i ? '#d5b478' : '#88c6cf'}
                    strokeOpacity=".5"
                    strokeWidth="1.7"
                    fill="none"
                  />
                  <path
                    d={path(line.points.filter((a) => a.time <= shot.physicalTime).map(pos))}
                    stroke={i ? '#d5b478' : '#88c6cf'}
                    strokeWidth="2.4"
                    fill="none"
                  />
                </g>
              ))}
            </>
          )}
          <path
            d={path(m.outline.map(pos), true)}
            fill={`url(#${id}-metal)`}
            stroke="#bbc8be"
            strokeWidth="1.4"
          />
          {!pairView && segments}
          {forces &&
            m.surface
              .filter((_, i) => i % 16 === 0)
              .map((a, j) => {
                const chunk = m.surface.slice(j * 16, Math.min(j * 16 + 16, partial.count)),
                  f = chunk.reduce((v, a) => ({ x: v.x + a.fx, y: v.y + a.fy }), { x: 0, y: 0 });
                const mid = chunk[Math.floor(chunk.length / 2)] ?? a,
                  v = pos(mid);
                return (
                  <Arrow
                    key={j}
                    x={v.x}
                    y={v.y}
                    dx={f.x * (phone ? 0.9 : 1.2)}
                    dy={-f.y * (phone ? 0.9 : 1.2)}
                    color={cpColor(mid.cp)}
                    width={1.8}
                  />
                );
              })}
          {kutta &&
            [shot.delta, -shot.delta].map((theta, i) => {
              const a = airfoilSurface(p, theta),
                v = pos(a);
              return (
                <g key={i}>
                  <circle
                    cx={v.x}
                    cy={v.y}
                    r={i ? 6 : 3.8}
                    fill="none"
                    stroke={i ? '#d5b478' : '#88c6cf'}
                    strokeWidth="2"
                  />
                  <Arrow
                    x={v.x}
                    y={v.y}
                    dx={a.u * 0.8}
                    dy={-a.v * 0.8}
                    color={i ? '#d5b478' : '#88c6cf'}
                    width={1.8}
                  />
                </g>
              );
            })}
          {pair?.map((line, i) => {
            const a = sampleAirfoilPath(line, shot.physicalTime);
            if (!a.visible) return null;
            const v = pos(a);
            return (
              <circle
                key={i}
                cx={v.x}
                cy={v.y}
                r={phone ? 5 : 6}
                fill={i ? '#d5b478' : '#88c6cf'}
                stroke="#20343d"
                strokeWidth="2"
              />
            );
          })}
          {forces && (
            <circle
              cx={pos(selected).x}
              cy={pos(selected).y}
              r="4.5"
              fill="#f0d8a1"
              stroke="#213943"
              strokeWidth="1.5"
            />
          )}
        </g>
        {kutta ? (
          <g>
            <path
              d={path(
                m.outline.map((v) => ({
                  x: W / 2 + (v.x * 90) / p.chord,
                  y: H - 27 - (v.y * 90) / p.chord,
                })),
                true,
              )}
              fill="#91a8a5"
            />
            <circle
              cx={W / 2 + (tail.x * 90) / p.chord}
              cy={H - 27 - (tail.y * 90) / p.chord}
              r="9"
              fill="none"
              stroke="#dbbe85"
            />
          </g>
        ) : pairView ? (
          <text x={pos({ x: tail.x, y: 0 }).x} y={H - 17} textAnchor="middle">
            {t('翼尾测量线')}
          </text>
        ) : (
          <g>
            <rect
              x={16}
              y={H - 42}
              width={W - 32}
              height={4}
              rx={2}
              fill={`url(#${id}-pressure)`}
            />
            <text x={16} y={H - 17} fill="#86bac4">
              ≤ −2.5
            </text>
            <text x={W / 2} y={H - 17} textAnchor="middle">
              {t('压力系数 Cp')}
            </text>
            <text x={W - 16} y={H - 17} textAnchor="end" fill="#d6b77e">
              +1
            </text>
          </g>
        )}
        {!kutta && !pairView && !circ && (
          <g>
            <circle cx={W - 33} cy={130} r="2" fill="#d8c99f" />
            <Arrow
              x={W - 33}
              y={130}
              dx={partial.x * gain}
              dy={-partial.y * gain}
              color="#e3c68d"
              width={2.3}
            />
          </g>
        )}
      </svg>
    </div>
  );
}
