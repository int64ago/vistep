import { useId } from 'react';
import { t } from '../../i18n';
import {
  tidesCamera,
  tidesProject,
  tidesGrid,
  tidesGlyphs,
  tidesDot,
  tidesUnit,
  tidesDirection,
  tidesSurface,
  type TidesState,
  type TidesVector,
} from '../../models/tides';

function Arrow({
  x,
  y,
  dx,
  dy,
  color = '#bddfcf',
  width = 2,
}: {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color?: string;
  width?: number;
}) {
  const length = Math.hypot(dx, dy);
  if (length < 0.3) return <circle cx={x} cy={y} r="2" fill={color} />;
  const ux = dx / length,
    uy = dy / length,
    head = Math.min(7, length * 0.5),
    ex = x + dx,
    ey = y + dy;
  return (
    <g stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${x} ${y}L${ex} ${ey}`} />
      <path
        d={`M${ex - ux * head - uy * head * 0.55} ${ey - uy * head + ux * head * 0.55}L${ex} ${ey}L${ex - ux * head + uy * head * 0.55} ${ey - uy * head - ux * head * 0.55}`}
      />
    </g>
  );
}
export function TidesVectorInset({ state: s }: { state: TidesState }) {
  const axis = tidesUnit(s.bodies[0].position),
    local = tidesDot(s.field.local, axis) * 1e6,
    center = tidesDot(s.field.center, axis) * 1e6,
    difference = tidesDot(s.field.differential, axis) * 1e6;
  const rawScale = 100 / Math.max(0.00001, Math.abs(local), Math.abs(center)),
    differenceScale = 100 / Math.max(2.5, Math.abs(difference));
  return (
    <svg
      className="tides-vector-inset"
      viewBox="0 0 320 230"
      role="img"
      aria-label={t('当地引力减去地心引力，保留朝月球方向的分量')}
    >
      <text x="12" y="22" className="tides-svg-label">
        {t('朝月球的分量')}
      </text>
      <text x="308" y="22" textAnchor="end" className="tides-svg-label">
        µm/s²
      </text>
      {[
        { name: '当地', value: local, y: 53, scale: rawScale, color: '#e9c689' },
        { name: '地心', value: center, y: 113, scale: rawScale, color: '#9faeb6' },
        {
          name: '当地 − 地心',
          value: difference,
          y: 173,
          scale: differenceScale,
          color: '#a6dece',
        },
      ].map((row) => (
        <g key={row.name}>
          <text x="12" y={row.y} className="tides-svg-label">
            {t(row.name)}
          </text>
          <text x="308" y={row.y} textAnchor="end" className="tides-svg-label">
            {row.value >= 0 ? '+' : ''}
            {row.value.toFixed(3)}
          </text>
          <path d={`M160 ${row.y + 11}v17M40 ${row.y + 20}H280`} stroke="#4e6470" strokeWidth="1" />
          <Arrow
            x={160}
            y={row.y + 20}
            dx={row.value * row.scale}
            dy={0}
            color={row.color}
            width={3}
          />
        </g>
      ))}
      <text x="12" y="226" className="tides-svg-label tides-muted">
        {t('差分箭头单独放大')}
      </text>
    </svg>
  );
}

export function TidesProfile({ state: s, compact }: { state: TidesState; compact: boolean }) {
  const width = compact ? 320 : 420,
    left = 43,
    right = width - 14,
    top = 27,
    bottom = 125;
  const x = (angle: number) => left + (angle / 360) * (right - left),
    y = (height: number) => bottom - ((height + 0.5) / 1.5) * (bottom - top);
  const path = (points: typeof s.profile.points) =>
    points.map((p, i) => `${i ? 'L' : 'M'}${x(p.angle)},${y(p.height)}`).join(' ');
  return (
    <svg
      className="tides-profile"
      viewBox={`0 0 ${width} 174`}
      role="img"
      aria-label={t('沿同一纬圈计算的平衡海面高度，不是沿岸潮汐预报')}
    >
      <text x={left + 10} y="19" className="tides-svg-label">
        h / m
      </text>
      {[0, 0.5, 1].map((value) => (
        <g key={value}>
          <path
            d={`M${left} ${y(value)}H${right}`}
            stroke="#58727e"
            strokeOpacity={value === 0 ? 0.8 : 0.25}
          />
          <text x={left - 8} y={y(value) + 6} textAnchor="end" className="tides-svg-label">
            {value}
          </text>
        </g>
      ))}
      {s.focus === 'latitude' && (
        <path
          d={path(s.referenceProfile.points)}
          stroke="#8696a5"
          strokeDasharray="4 5"
          strokeWidth="1.5"
          fill="none"
        />
      )}
      <path d={path(s.profile.points)} stroke="#a9dfcf" strokeWidth="2.4" fill="none" />
      <path d={`M${x(s.config.rotation)} ${top}V${bottom}`} stroke="#e8c88d" strokeOpacity=".55" />
      <circle cx={x(s.config.rotation)} cy={y(s.surface.height)} r="5" fill="#e8c88d" />
      {[0, 180, 360].map((angle) => (
        <text
          key={angle}
          x={x(angle)}
          y="153"
          textAnchor={angle === 0 ? 'start' : angle === 360 ? 'end' : 'middle'}
          className="tides-svg-label"
        >
          {angle}°
        </text>
      ))}
    </svg>
  );
}

export function TidesDistanceGraph({ state: s }: { state: TidesState }) {
  const x = (d: number) => 44 + ((d - 0.8) / 0.6) * 258,
    y = (k: number) => 129 - (k / 2.1) * 101;
  const path = (power: number) =>
    Array.from({ length: 81 }, (_, i) => {
      const d = 0.8 + (0.6 * i) / 80;
      return `${i ? 'L' : 'M'}${x(d)} ${y(d ** -power)}`;
    }).join(' ');
  return (
    <svg
      className="tides-distance-graph"
      viewBox="0 0 320 180"
      role="img"
      aria-label={t('归一化潮汐强度随距离的三次方衰减，对照整体引力的平方衰减')}
    >
      <text x="12" y="20" className="tides-svg-label">
        {t('相对强度')}
      </text>
      <text x="303" y="20" textAnchor="end" className="tides-svg-label">
        D / D₀
      </text>
      {[0, 1, 2].map((k) => (
        <g key={k}>
          <path d={`M44 ${y(k)}H302`} stroke="#526d78" strokeOpacity=".35" />
          <text x="34" y={y(k) + 6} textAnchor="end" className="tides-svg-label">
            {k}
          </text>
        </g>
      ))}
      <path d={path(2)} stroke="#8696a5" strokeWidth="2" strokeDasharray="4 4" fill="none" />
      <path d={path(3)} stroke="#a9dfcf" strokeWidth="2.4" fill="none" />
      <circle cx={x(s.config.moonDistance)} cy={y(s.strengthRatio)} r="5" fill="#e8c88d" />
      {[0.8, 1, 1.4].map((d) => (
        <text
          key={d}
          x={x(d)}
          y="158"
          textAnchor={d === 0.8 ? 'start' : d === 1.4 ? 'end' : 'middle'}
          className="tides-svg-label"
        >
          {d.toFixed(1)}
        </text>
      ))}
    </svg>
  );
}

export function TidesAlignment({ state: s }: { state: TidesState }) {
  const a = (s.config.alignment * Math.PI) / 180,
    moon = { x: 210, y: 102 },
    sun = { x: 156 + 98 * Math.cos(a), y: 102 - 76 * Math.sin(a) };
  return (
    <svg
      className="tides-alignment"
      viewBox="0 0 320 177"
      role="img"
      aria-label={t('日月方向夹角示意，天体距离不按比例')}
    >
      <path
        d="M58 102A98 76 0 0 1 254 102"
        fill="none"
        stroke="#6d8791"
        strokeOpacity=".4"
        strokeDasharray="3 5"
      />
      <path
        d={`M156 102L${moon.x} ${moon.y}M156 102L${sun.x} ${sun.y}`}
        stroke="#c2d7ce"
        strokeWidth="1.5"
        strokeOpacity=".65"
      />
      <circle cx="156" cy="102" r="21" fill="#507483" stroke="#a4c4ca" />
      <circle cx={moon.x} cy={moon.y} r="8" fill="#d4d9d6" />
      <circle cx={sun.x} cy={sun.y} r="11" fill="#e6c184" opacity={0.2 + 0.8 * s.config.sun} />
      <text x={moon.x} y="76" textAnchor="middle" className="tides-svg-label">
        {t('月球')}
      </text>
      <text
        x={sun.x}
        y={sun.y < 60 ? sun.y + 35 : sun.y + 37}
        textAnchor={sun.x < 90 ? 'start' : sun.x > 240 ? 'end' : 'middle'}
        className="tides-svg-label"
      >
        {t('太阳')}
      </text>
      <text x="12" y="23" className="tides-svg-label">
        {s.config.alignment.toFixed(0)}°
      </text>
      <text x="12" y="173" className="tides-svg-label tides-muted">
        {t('赤道面方向投影')}
      </text>
    </svg>
  );
}

function hull(points: { x: number; y: number }[]) {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y),
    cross = (
      a: { x: number; y: number },
      b: { x: number; y: number },
      c: { x: number; y: number },
    ) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const lower: typeof points = [],
    upper: typeof points = [];
  for (const p of sorted) {
    while (lower.length > 1 && cross(lower.at(-2)!, lower.at(-1)!, p) <= 0) lower.pop();
    lower.push(p);
  }
  for (const p of sorted.reverse()) {
    while (upper.length > 1 && cross(upper.at(-2)!, upper.at(-1)!, p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
export function TidesFlat({ state: s, compact }: { state: TidesState; compact: boolean }) {
  const id = useId().replace(/:/g, ''),
    width = compact ? 320 : 600,
    height = compact ? 280 : 420,
    camera = tidesCamera(s, width, height, compact),
    glyph = tidesGlyphs(s, compact);
  const project = (p: TidesVector) => {
    const q = tidesProject(p, camera);
    return { x: ((q.x + 1) * width) / 2, y: ((1 - q.y) * height) / 2, depth: q.depth };
  };
  const grid = tidesGrid(s.bodies, s.gain, s.config.rotation),
    cloud = grid.flatMap((r) => r.points.map((p) => project(p.position))),
    outline = hull(cloud);
  const path = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const marker = project(glyph.marker),
    moon = project(glyph.moon),
    center = project({ x: 0, y: 0, z: 0 });
  const ring = Array.from({ length: 145 }, (_, i) =>
    project(tidesSurface(tidesDirection(s.config.latitude, i * 2.5), s.bodies, s.gain).position),
  );
  const facing = tidesDot(s.pointDirection, camera.view);
  return (
    <svg
      className="tides-flat"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('同一潮汐势构造的二维海面网格与加速度矢量')}
    >
      <defs>
        <radialGradient id={`${id}-ocean`} cx="35%" cy="26%" r="80%">
          <stop stopColor="#709caa" />
          <stop offset="1" stopColor="#203d55" />
        </radialGradient>
      </defs>
      <path d={`${path(outline)}Z`} fill={`url(#${id}-ocean)`} stroke="#a9d9d3" strokeWidth="1.2" />
      {grid.map((r) => (
        <path
          key={r.id}
          d={path(r.points.map((p) => project(p.position)))}
          fill="none"
          stroke="#b4d0d6"
          strokeOpacity=".18"
          strokeWidth=".8"
        />
      ))}
      <path
        d={path(
          Array.from({ length: 145 }, (_, i) =>
            project({ x: Math.cos((i * Math.PI) / 72), y: Math.sin((i * Math.PI) / 72), z: 0 }),
          ),
        )}
        fill="none"
        stroke="#e1d6b5"
        strokeOpacity=".5"
        strokeDasharray="3 5"
      />
      {['rotation', 'latitude'].includes(s.focus) && (
        <path d={path(ring)} fill="none" stroke="#e8c88d" strokeWidth="1.8" />
      )}
      <path
        d={`M${center.x} ${center.y}L${moon.x} ${moon.y}`}
        stroke="#c0d0cc"
        strokeDasharray="3 6"
        strokeOpacity=".35"
      />
      <circle cx={moon.x} cy={moon.y} r={compact ? 4 : 13} fill="#c4cccb" />
      {glyph.arrows.map((a) => {
        const o = project(a.origin),
          end = project(a.tip);
        return (
          <Arrow
            key={a.id}
            x={o.x}
            y={o.y}
            dx={end.x - o.x}
            dy={end.y - o.y}
            color={s.frame === 'absolute' ? '#e9c689' : '#a6dece'}
          />
        );
      })}
      <circle
        cx={marker.x}
        cy={marker.y}
        r={compact ? 5 : 6}
        fill="#f2cc85"
        fillOpacity={facing >= 0 ? 1 : 0.3}
        stroke="#ffdfa4"
        strokeWidth="1.5"
      />
    </svg>
  );
}
