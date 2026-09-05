import { useId, useMemo } from 'react';
import { t } from '../../i18n';
import { rainbowContactLabels, rainbowDropLayout } from './rainbowLayout';
import {
  rainbowAdd,
  rainbowAngle,
  rainbowColor,
  rainbowConcentration,
  rainbowMiss,
  rainbowObserverDrop,
  rainbowReveal,
  rainbowScale,
  rainbowSky,
  rainbowStationary,
  traceRainbow,
  type RainbowPoint,
  type RainbowRay,
} from '../../models/rainbow';

const path = (points: RainbowPoint[]) =>
  points.length > 1
    ? points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(3)},${p.y.toFixed(3)}`).join('')
    : undefined;
const arc = (at: RainbowPoint, from: RainbowPoint, to: RainbowPoint, radius: number) => {
  const start = Math.atan2(from.y, from.x);
  let span = Math.atan2(to.y, to.x) - start;
  while (span > Math.PI) span -= 2 * Math.PI;
  while (span < -Math.PI) span += 2 * Math.PI;
  return Array.from({ length: 25 }, (_, i) => ({
    x: at.x + radius * Math.cos(start + (span * i) / 24),
    y: at.y + radius * Math.sin(start + (span * i) / 24),
  }));
};

export function RainbowDrop({
  ray,
  reveal,
  normal,
  fan = false,
  spectrum = false,
  compact,
}: {
  ray: RainbowRay;
  reveal: number;
  normal: number;
  fan?: boolean;
  spectrum?: boolean;
  compact: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const layout = rainbowDropLayout(compact, fan || (compact && spectrum));
  const { width, height, radius, cx, cy } = layout;
  const labels = rainbowContactLabels(ray, layout, reveal);
  const project = (p: RainbowPoint) => ({ x: cx + p.x * radius, y: cy - p.y * radius });
  const actual = rainbowReveal(ray.points, reveal),
    packet = project(actual[actual.length - 1]);
  const contact = [ray.entry, ray.reflection, ray.exit][Math.max(0, normal - 1)];
  const spectrumWaves = [400, 450, 500, 550, 600, 650, 700];
  const fanRays = useMemo(
    () => Array.from({ length: 25 }, (_, i) => traceRainbow(0.69 + i * 0.011, ray.wavelengthNm)),
    [ray.wavelengthNm],
  );
  const incidenceArc = arc(ray.entry, { x: -1, y: 0 }, ray.entry, 0.24);
  const refractionArc = arc(ray.entry, rainbowScale(ray.entry, -1), ray.inside, 0.19);
  return (
    <svg
      className="rainbow-drop-svg"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('水滴剖面：逐段追踪入水、一次内反射与出水光路')}
    >
      <defs>
        <radialGradient id={`${id}-water`} cx="32%" cy="26%" r="77%">
          <stop stopColor="#729dba" stopOpacity=".15" />
          <stop offset=".62" stopColor="#3d6f89" stopOpacity=".05" />
          <stop offset=".92" stopColor="#a8d6e4" stopOpacity=".14" />
          <stop offset="1" stopColor="#aecedb" stopOpacity=".32" />
        </radialGradient>
        <radialGradient id={`${id}-halo`}>
          <stop offset=".75" stopColor="#9ac5d9" stopOpacity="0" />
          <stop offset=".94" stopColor="#9ac5d9" stopOpacity=".05" />
          <stop offset="1" stopColor="#9ac5d9" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-frame`}>
          <rect x="3" y="3" width={width - 6} height={height - 6} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={radius * 1.13} fill={`url(#${id}-halo)`} />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={`url(#${id}-water)`}
        stroke="#a5c1cd"
        strokeOpacity=".57"
        strokeWidth="1.15"
      />
      <path
        d={path(
          arc({ x: 0, y: 0 }, { x: -0.8, y: 0.6 }, { x: -0.3, y: 0.954 }, 0.988).map(project),
        )}
        fill="none"
        stroke="#c3e3ed"
        strokeOpacity=".6"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d={`M${compact ? 16 : 62},${cy}H${cx + radius}`}
        stroke="#b1c3c7"
        strokeOpacity=".17"
        strokeDasharray="3 7"
      />
      <circle cx={cx} cy={cy} r="2.4" fill="#91a8b5" />
      <g clipPath={`url(#${id}-frame)`}>
        {fan &&
          fanRays.map((r, i) => (
            <path
              key={i}
              d={path(r.points.map(project))}
              fill="none"
              stroke={rainbowColor(ray.wavelengthNm)}
              strokeOpacity=".12"
              strokeWidth="1.15"
            />
          ))}
        {spectrum &&
          spectrumWaves.map((w) => (
            <path
              key={w}
              d={path(traceRainbow(ray.impact, w).points.map(project))}
              fill="none"
              stroke={rainbowColor(w)}
              strokeWidth="1.7"
              strokeOpacity=".57"
            />
          ))}
        {reveal >= 2 &&
          !fan &&
          !spectrum &&
          ray.branches.map((branch, i) => (
            <path
              key={i}
              d={path([branch.a, branch.b].map(project))}
              fill="none"
              stroke="#d6e5e9"
              strokeWidth="1.3"
              strokeOpacity={i === 1 ? 0.4 : 0.18}
              strokeDasharray="4 5"
            />
          ))}
        <path
          d={path(actual.map(project))}
          fill="none"
          stroke={rainbowColor(ray.wavelengthNm)}
          strokeWidth="6"
          strokeOpacity=".1"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={path(actual.map(project))}
          fill="none"
          stroke={rainbowColor(ray.wavelengthNm)}
          strokeWidth="2.7"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={path(rainbowReveal(ray.points, Math.min(1, reveal)).map(project))}
          fill="none"
          stroke="#ebedf0"
          strokeWidth="2.5"
        />
        {normal > 0 && (
          <path
            d={path([rainbowScale(contact, 0.57), rainbowScale(contact, 1.38)].map(project))}
            stroke="#d6dccc"
            strokeWidth="1"
            strokeDasharray="4 5"
          />
        )}
        {normal === 1 && (
          <>
            <path
              d={path(incidenceArc.map(project))}
              stroke="#efddb4"
              strokeWidth="1.1"
              fill="none"
            />
            <path
              d={path(refractionArc.map(project))}
              stroke="#a7d5de"
              strokeWidth="1.1"
              fill="none"
            />
          </>
        )}
        {[ray.entry, ray.reflection, ray.exit].map((p, i) => {
          const q = project(p);
          return reveal >= i + 1 ? <circle key={i} cx={q.x} cy={q.y} r="4" fill="#ecddb5" /> : null;
        })}
        <circle cx={packet.x} cy={packet.y} r="5.5" fill="#fff0c9" />
      </g>
      {labels.map((label) => (
        <g
          key={label.contacts.join('-')}
          className="rainbow-contact-label"
          data-contacts={label.contacts.join('/')}
        >
          {label.anchors.map((anchor, i) => (
            <path
              key={i}
              d={`M${anchor.x},${anchor.y}L${label.center.x},${label.center.y}`}
              fill="none"
              stroke="#b6cbd2"
              strokeOpacity=".65"
              strokeWidth="1"
            />
          ))}
          <rect
            x={label.center.x - label.width / 2}
            y={label.center.y - label.height / 2}
            width={label.width}
            height={label.height}
            rx="16"
            fill="#203441"
            stroke="#829ead"
            strokeOpacity=".6"
          />
          <text x={label.center.x} y={label.center.y + 8} textAnchor="middle">
            {label.contacts.join(' / ')}
          </text>
        </g>
      ))}
      <path
        d={`M${cx - radius - 22},${cy}V${cy - ray.impact * radius}m-5 0h10m-10 ${ray.impact * radius}h10`}
        stroke="#c9d4c8"
        strokeWidth="1.1"
        strokeOpacity=".6"
      />
      {!compact && (
        <text x={cx - radius - 38} y={cy - (ray.impact * radius) / 2 + 7} textAnchor="end">
          b
        </text>
      )}
    </svg>
  );
}

export function RainbowConcentration({ ray, compact }: { ray: RainbowRay; compact: boolean }) {
  const clipId = useId().replace(/:/g, '');
  const density = useMemo(() => rainbowConcentration(ray.wavelengthNm), [ray.wavelengthNm]);
  const width = compact ? 340 : 380,
    left = 40,
    right = width - 17,
    top = 20,
    bottom = 136;
  const x = (b: number) => left + ((b - 0.6) / 0.399) * (right - left),
    y = (angle: number) => bottom - ((angle - 29) / 15) * (bottom - top);
  const curve = Array.from({ length: 150 }, (_, i) => {
    const b = 0.6 + (i * 0.399) / 149;
    return { x: x(b), y: y(rainbowAngle(b, ray.index)) };
  });
  const crop = density.bins.filter((b) => b.angle >= 36 && b.angle <= 44),
    peak = Math.max(...crop.map((b) => b.power));
  return (
    <div className="rainbow-concentration">
      {!compact && (
        <div>
          <p>{t('入口移动，出射方向先增后减')}</p>
          <svg
            viewBox={`0 0 ${width} 174`}
            role="img"
            aria-label={t('入射偏移与主虹角的曲线，驻值处斜率为零')}
          >
            <path
              d={`M${left},${top}V${bottom}H${right}`}
              stroke="#7994a3"
              strokeOpacity=".6"
              fill="none"
            />
            <path
              d={`M${left},${y(42)}H${right}`}
              stroke="#b4c7bc"
              strokeOpacity=".15"
              strokeDasharray="3 6"
            />
            <defs>
              <clipPath id={`${clipId}-curve`}>
                <rect x={left} y={top} width={right - left} height={bottom - top} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${clipId}-curve)`}>
              <path d={path(curve)} fill="none" stroke="#dcc69c" strokeWidth="2.4" />
              <path
                d={`M${x(ray.stationary.impact)},${top}V${bottom}`}
                stroke="#b5cad1"
                strokeOpacity=".4"
                strokeDasharray="3 5"
              />
              <circle
                cx={x(ray.impact)}
                cy={y(ray.angle)}
                r="5"
                fill={rainbowColor(ray.wavelengthNm)}
              />
            </g>
            <text x="4" y={y(42) + 5}>
              42°
            </text>
            <text x="4" y={bottom + 5}>
              29°
            </text>
            <text x={left} y="168">
              0.60
            </text>
            <text x={right} y="168" textAnchor="end">
              1.00 b/R
            </text>
          </svg>
        </div>
      )}
      <div>
        <p>{t('等入射面积，集中到相邻角度')}</p>
        <svg
          viewBox={`0 0 ${width} 174`}
          role="img"
          aria-label={t('按入射面积加权的出射角分箱，非天空亮度预报')}
        >
          <path d={`M${left},${bottom}H${right}`} stroke="#7994a3" strokeOpacity=".6" />
          {crop.map((bin) => {
            const bx = left + ((bin.angle - 36) / 8) * (right - left),
              h = (bin.power / peak) * 102;
            return (
              <rect
                key={bin.angle}
                x={bx}
                y={bottom - h}
                width={((right - left) / 32) * 0.82}
                height={h}
                fill={rainbowColor(ray.wavelengthNm)}
                opacity={Math.abs(bin.angle - ray.stationary.angle) < 0.4 ? 0.94 : 0.43}
              />
            );
          })}
          <text x={left} y="168">
            36°
          </text>
          <text x={right} y="168" textAnchor="end">
            44°
          </text>
          <text x={right} y="25" textAnchor="end">
            Δα = 0.25°
          </text>
        </svg>
      </div>
    </div>
  );
}

export function RainbowSpectrum({ wavelength, compact }: { wavelength: number; compact: boolean }) {
  const width = compact ? 340 : 760,
    left = compact ? 26 : 38,
    right = width - left;
  const x = (angle: number) => left + ((angle - 40) / 3) * (right - left);
  return (
    <div className="rainbow-spectrum">
      <p>{t('不同波长的集中方向（真实角度差）')}</p>
      <svg
        viewBox={`0 0 ${width} 108`}
        role="img"
        aria-label={t('紫光的主虹角较小，红光的主虹角较大')}
      >
        <path d={`M${left},63H${right}`} stroke="#9aafba" strokeOpacity=".4" />
        {Array.from({ length: 31 }, (_, i) => 400 + i * 10).map((w) => (
          <path
            key={w}
            d={`M${x(rainbowStationary(w).angle)},32V62`}
            stroke={rainbowColor(w)}
            strokeWidth="3"
            strokeOpacity=".7"
          />
        ))}
        <circle
          cx={x(rainbowStationary(wavelength).angle)}
          cy="29"
          r="6"
          fill={rainbowColor(wavelength)}
        />
        {[40, 41, 42, 43].map((a) => (
          <text key={a} x={x(a)} y="96" textAnchor="middle">
            {a}°
          </text>
        ))}
      </svg>
    </div>
  );
}

export function RainbowObserver({
  sunAltitude,
  twoDrops,
  revealSecond = 1,
  compact,
}: {
  sunAltitude: number;
  twoDrops: boolean;
  revealSecond?: number;
  compact: boolean;
}) {
  const width = compact ? 340 : 820,
    height = compact ? 350 : 460;
  const red = rainbowObserverDrop(700, sunAltitude),
    violet = rainbowObserverDrop(400, sunAltitude),
    miss = rainbowMiss(red, 400, sunAltitude);
  const incomingStart = (drop: typeof red) =>
    rainbowAdd(drop.entry, rainbowScale(drop.direction, -20));
  // Fit the full offered solar-altitude range, including the incoming segments.
  // The phone uses its separately composed portrait coordinates.
  const bounds = [
    { x: 0, y: 0 },
    rainbowScale(red.direction, -12),
    miss.atEyePlane,
    ...[red, violet].flatMap((drop) => [
      ...drop.points,
      incomingStart(drop),
      { x: drop.centre.x, y: drop.centre.y + 1 },
      { x: drop.centre.x, y: drop.centre.y - 1 },
    ]),
  ];
  const low = Math.min(...bounds.map((p) => p.y)),
    high = Math.max(...bounds.map((p) => p.y)),
    scale = compact ? 3.18 : Math.min(7.5, (height - 122) / (high - low)),
    origin = {
      x: compact ? 54 : 148,
      y: compact ? 254 : 64 + high * scale + (height - 122 - (high - low) * scale) / 2,
    };
  const project = (p: RainbowPoint) => ({ x: origin.x + p.x * scale, y: origin.y - p.y * scale });
  const antisolar = project(rainbowScale(red.direction, compact ? 28 : 31));
  const sun = project(rainbowScale(red.direction, compact ? -9 : -12));
  const rayLine = (a: RainbowPoint, b: RainbowPoint) => path([a, b].map(project));
  const eye = project({ x: 0, y: 0 });
  const alphaArc = arc(
    { x: 0, y: 0 },
    red.direction,
    rainbowScale(red.outgoing, -1),
    compact ? 13 : 12,
  ).map(project);
  const drops = twoDrops ? [red, violet] : [red];
  return (
    <svg
      className="rainbow-observer-svg"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('太阳在观察者身后；不同位置的水滴将不同颜色送入同一只眼睛')}
    >
      <path
        d={`M${compact ? 10 : 30},${origin.y}H${width - 16}`}
        stroke="#6e8998"
        strokeOpacity=".25"
      />
      <path d={path([eye, antisolar])} stroke="#bac9c1" strokeOpacity=".6" strokeDasharray="4 6" />
      <path d={path(alphaArc)} fill="none" stroke="#b9c7bb" strokeOpacity=".55" />
      <text x={eye.x + (compact ? 37 : 82)} y={eye.y - (compact ? 18 : 23)}>
        {red.ray.angle.toFixed(1)}°
      </text>
      <circle cx={sun.x} cy={sun.y} r={compact ? 8 : 12} fill="#e5d2ad" />
      <circle cx={sun.x} cy={sun.y} r={compact ? 14 : 21} fill="#e5d2ad" fillOpacity=".06" />
      <path
        d={`M${eye.x - 13},${eye.y}Q${eye.x},${eye.y - 12} ${eye.x + 13},${eye.y}Q${eye.x},${eye.y + 12} ${eye.x - 13},${eye.y}`}
        fill="#1b3140"
        stroke="#d8d9cb"
        strokeWidth="1.5"
      />
      <circle cx={eye.x} cy={eye.y} r="3.7" fill="#e5dfc9" />
      {drops.map((drop, i) => {
        const c = project(drop.centre),
          end = project(drop.exit),
          entry = project(drop.entry),
          colour = rainbowColor(drop.wavelengthNm);
        return (
          <g key={drop.wavelengthNm} opacity={i === 1 ? revealSecond : 1}>
            <path
              d={rayLine(incomingStart(drop), drop.entry)}
              stroke="#e8e7de"
              strokeWidth="1.3"
              strokeOpacity=".55"
            />
            <circle
              cx={c.x}
              cy={c.y}
              r={scale}
              fill="#4c7790"
              fillOpacity=".3"
              stroke={colour}
              strokeWidth="1.1"
            />
            <path d={path(drop.points.map(project))} stroke={colour} fill="none" strokeWidth="1" />
            <path d={path([end, eye])} stroke={colour} strokeWidth="2" strokeOpacity=".85" />
            <circle cx={entry.x} cy={entry.y} r="1.2" fill="#edf1e7" />
            <text x={c.x + 18} y={c.y + (i === 0 ? -13 : 26)} fill={colour}>
              {i === 0 ? 'A' : 'B'}
            </text>
          </g>
        );
      })}
      {!twoDrops && (
        <>
          <path
            d={rayLine(miss.exit, miss.atEyePlane)}
            stroke={rainbowColor(400)}
            strokeWidth="1.6"
            strokeDasharray="5 5"
          />
          <circle
            cx={project(miss.atEyePlane).x}
            cy={project(miss.atEyePlane).y}
            r="4"
            fill="none"
            stroke={rainbowColor(400)}
          />
        </>
      )}
      <text x={antisolar.x} y={antisolar.y + 24} textAnchor="end">
        α = 0°
      </text>
    </svg>
  );
}

export function RainbowSky({ sunAltitude, compact }: { sunAltitude: number; compact: boolean }) {
  const width = compact ? 340 : 820,
    height = compact ? 292 : 390,
    cx = width / 2,
    cy = compact ? 211 : 328,
    scale = compact ? 157 : 327;
  const horizon = cy - scale * Math.tan((sunAltitude * Math.PI) / 180);
  const line = (w: number, onlyVisible: boolean) => {
    const p = rainbowSky(w, sunAltitude, 0),
      r = p.y * scale;
    if (!onlyVisible)
      return `M${cx - r},${cy}A${r},${r} 0 1 1 ${cx + r},${cy}A${r},${r} 0 1 1 ${cx - r},${cy}`;
    if (!p.visible) return undefined;
    const half = Math.acos(Math.max(-1, Math.min(1, p.horizon / p.y)));
    const dx = r * Math.sin(half),
      y = cy - r * Math.cos(half);
    if (dx < 0.0001) return undefined;
    return `M${cx - dx},${y}A${r},${r} 0 0 1 ${cx + dx},${y}`;
  };
  const id = useId().replace(/:/g, '');
  return (
    <svg
      className="rainbow-sky-svg"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('主虹围绕反太阳方向成圆；只有地平线以上的部分可见')}
    >
      <defs>
        <linearGradient id={`${id}-sky`} x2="0" y2="1">
          <stop stopColor="#324758" />
          <stop offset="1" stopColor="#1c303b" />
        </linearGradient>
        <clipPath id={`${id}-sky-frame`}>
          <rect width={width} height={height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-sky-frame)`}>
        <rect width={width} height={height} fill={`url(#${id}-sky)`} opacity=".6" />
        <path
          d={line(550, false)}
          fill="none"
          stroke="#a8bcc6"
          strokeOpacity=".2"
          strokeDasharray="3 8"
        />
        <rect
          x="0"
          y={Math.max(0, horizon)}
          width={width}
          height={Math.max(0, height - horizon)}
          fill="#0d202b"
          fillOpacity=".65"
        />
        {Array.from({ length: 41 }, (_, i) => 700 - i * 7.5).map((w) => (
          <path
            key={w}
            d={line(w, true)}
            fill="none"
            stroke={rainbowColor(w)}
            strokeWidth={compact ? 1.6 : 2}
            strokeOpacity=".68"
          />
        ))}
        <path d={`M0,${horizon}H${width}`} stroke="#bdd0ce" strokeOpacity=".37" />
        <path
          d={`M${cx - 8},${cy}H${cx + 8}M${cx},${cy - 8}V${cy + 8}`}
          stroke="#cad6cb"
          strokeOpacity=".8"
        />
      </g>
    </svg>
  );
}
