import { useId, useMemo } from 'react';
import { t } from '../../i18n';
import {
  brownianCoefficients,
  brownianExtent,
  brownianSample,
  brownianStatistics,
  brownianMSD,
  brownianImpulse,
  type BrownianTrack,
} from '../../models/brownian-motion';

export const brownianColors = ['#bb7936', '#438e91', '#987896'];
export function BrownianLens({
  tracks,
  time,
  width,
  height = 360,
  centroid = false,
  ensemble = false,
  mean = false,
  overdamped = false,
}: {
  tracks: BrownianTrack[];
  time: number;
  width: number;
  height?: number;
  centroid?: boolean;
  ensemble?: boolean;
  mean?: boolean;
  overdamped?: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    extent = useMemo(() => brownianExtent(tracks, centroid), [tracks, centroid]);
  const scale = Math.min(width - 36, height - 90) / (2 * extent),
    cx = width / 2,
    cy = (height - 42) / 2;
  const x = (value: number) => cx + value * scale,
    y = (value: number) => cy - value * scale;
  const stats = brownianStatistics(tracks, time);
  const trail = (tr: BrownianTrack, od = false) => {
    const sample = brownianSample(tr, time),
      end = Math.min(tr.points.length - 1, Math.floor(time / tr.dt));
    const points = tr.points.filter((_, i) => i <= end && i % (ensemble ? 8 : 2) === 0);
    return [...points, sample]
      .map(
        (p, i) =>
          `${i ? 'L' : 'M'}${x(od ? p.ox : p.x).toFixed(2)},${y(od ? p.oy : p.y).toFixed(2)}`,
      )
      .join(' ');
  };
  const means = useMemo(
    () =>
      Array.from({ length: 129 }, (_, i) => ({
        time: (tracks[0].span * i) / 128,
        ...brownianStatistics(tracks, (tracks[0].span * i) / 128),
      })),
    [tracks],
  );
  const scaleUnit = centroid ? 1e-9 : 1e-6;
  const rawBar = extent / scaleUnit / 2,
    power = 10 ** Math.floor(Math.log10(rawBar));
  const bar = (rawBar / power >= 5 ? 5 : rawBar / power >= 2 ? 2 : 1) * power * scaleUnit;
  const barLabel = Number((bar / scaleUnit).toPrecision(2)).toString();
  return (
    <svg
      className="bm-lens"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t(centroid ? '纳米尺度的粒子质心轨迹' : '无边界流体中的布朗轨迹')}
    >
      <defs>
        <radialGradient id={`${id}-field`}>
          <stop stopColor="#fbfcf2" />
          <stop offset=".72" stopColor="#e9efe3" />
          <stop offset="1" stopColor="#cad6c9" />
        </radialGradient>
        <radialGradient id={`${id}-bead`} cx="32%" cy="27%">
          <stop stopColor="#fff8c8" />
          <stop offset=".36" stopColor="#e0b673" />
          <stop offset=".78" stopColor="#a8733c" />
          <stop offset="1" stopColor="#795b3e" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width={width - 2} height={height - 44} rx="24" fill={`url(#${id}-field)`} />
      {[-2, -1, 0, 1, 2].map((i) => (
        <g key={i} stroke="#70867d" opacity={i === 0 ? 0.2 : 0.09} strokeWidth="1">
          <path d={`M${cx + (i * (width - 40)) / 5},18V${height - 63}`} />
          <path d={`M18,${cy + (i * (height - 80)) / 5}H${width - 18}`} />
        </g>
      ))}
      <path d={`M${cx - 6},${cy}h12M${cx},${cy - 6}v12`} stroke="#617969" strokeWidth="1.3" />
      {ensemble && (
        <circle
          cx={cx}
          cy={cy}
          r={Math.sqrt(brownianMSD(tracks[0].parameters, time)) * scale}
          stroke="#547f82"
          strokeDasharray="3 6"
          fill="none"
          opacity=".5"
        />
      )}
      {(ensemble ? tracks.slice(0, mean ? 8 : 6) : tracks).map((tr, i) => (
        <path
          key={i}
          d={trail(tr)}
          stroke={ensemble ? (i === 0 ? brownianColors[0] : '#7d9290') : brownianColors[i % 3]}
          strokeWidth={i === 0 ? 2.1 : 1.5}
          opacity={ensemble && i > 0 ? 0.32 : 0.8}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      {overdamped && (
        <path
          d={trail(tracks[0], true)}
          stroke="#488f99"
          strokeWidth="1.2"
          strokeDasharray="3 4"
          fill="none"
        />
      )}
      {mean && (
        <path
          d={[...means.filter((p) => p.time <= time), { ...stats, time }]
            .map((p, i) => `${i ? 'L' : 'M'}${x(p.x)},${y(p.y)}`)
            .join(' ')}
          stroke="#354e59"
          strokeWidth="2.5"
          fill="none"
        />
      )}
      {stats.samples.map((p, i) => {
        const r = centroid
          ? 6
          : ensemble
            ? i === 0
              ? 6
              : 2.6
            : tracks[i].parameters.radius * scale;
        return (
          <g key={i} opacity={ensemble && i > 0 ? 0.52 : 1}>
            {i === 0 && (
              <circle
                cx={x(p.x)}
                cy={y(p.y)}
                r={r + 4}
                fill="none"
                stroke="#bb7936"
                strokeWidth="1"
                opacity=".55"
              />
            )}
            <circle
              cx={x(p.x)}
              cy={y(p.y)}
              r={Math.max(2, r)}
              fill={i === 0 ? `url(#${id}-bead)` : ensemble ? '#608589' : brownianColors[i % 3]}
              fillOpacity={!ensemble && i > 0 ? 0.12 : 1}
              stroke={i === 0 ? '#8e6f43' : ensemble ? 'none' : brownianColors[i % 3]}
              strokeWidth={!ensemble && i > 0 ? 1.6 : 0.7}
            />
          </g>
        );
      })}
      {mean && (
        <path d={`M${x(stats.x)},${y(stats.y) - 6}l6,6l-6,6l-6,-6Z`} fill="#354e59" stroke="#fff" />
      )}
      <path
        d={`M20,${height - 23}h${bar * scale}m0,-4v8m${-bar * scale},-8v8`}
        stroke="#587268"
        strokeWidth="1.5"
      />
      <text
        x={width < 640 ? 20 : 20 + (bar * scale) / 2}
        y={height - 3}
        textAnchor={width < 640 ? 'start' : 'middle'}
      >
        {barLabel} {centroid ? 'nm' : 'µm'}
      </text>
      <text x={width - 4} y={height - 13} textAnchor="end">
        {centroid ? `${(time * 1e9).toFixed(0)} ns` : `${time.toFixed(2)} s`}
      </text>
    </svg>
  );
}
export function BrownianImpulsePanel({
  track,
  time,
  width,
  compact = false,
}: {
  track: BrownianTrack;
  time: number;
  width: number;
  compact?: boolean;
}) {
  const impulse = brownianImpulse(track, time),
    c = brownianCoefficients(track.parameters);
  const maximum = useMemo(
    () =>
      Math.max(
        1e-20,
        ...track.points.map((_, i) => {
          const a = brownianImpulse(track, i * track.dt);
          return Math.max(Math.abs(a.thermal), Math.abs(a.drag), Math.abs(a.momentum));
        }),
      ),
    [track],
  );
  const center = width / 2,
    half = width * 0.4,
    row = compact ? 52 : 58;
  return (
    <div className="bm-instrument">
      <div className="bm-instrument-title">
        {t(compact ? '完整采样窗' : '最近完整采样窗 · x 方向')}{' '}
        <span>
          {compact && 'x · '}Δt = {(impulse.duration / c.tau).toFixed(1)}τ
        </span>
      </div>
      <svg
        width={width}
        height={row * 3}
        viewBox={`0 0 ${width} ${row * 3}`}
        role="img"
        aria-label={t('热浴冲量与阻力冲量合成动量变化')}
      >
        {(
          [
            ['热浴', impulse.thermal, '#bb7936'],
            ['阻力', impulse.drag, '#49868b'],
            ['动量变化', impulse.momentum, '#3b535e'],
          ] as const
        ).map(([label, value, color], i) => (
          <g key={label}>
            <text x="0" y={20 + i * row}>
              {t(label)}
            </text>
            <text x={width} y={20 + i * row} textAnchor="end" className="bm-muted">
              {(value * 1e18).toFixed(2)} aN·s
            </text>
            <path d={`M${center},${32 + i * row}v20`} stroke="#617c7355" />
            <path
              d={`M${center},${42 + i * row}h${(value / maximum) * half}`}
              stroke={color}
              strokeWidth="9"
              strokeLinecap="round"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
export function BrownianMemory({
  track,
  time,
  width,
  compact = false,
}: {
  track: BrownianTrack;
  time: number;
  width: number;
  compact?: boolean;
}) {
  const c = brownianCoefficients(track.parameters),
    q = Math.min(8, time / c.tau),
    left = 28,
    right = width - 15,
    top = 18,
    bottom = 135;
  return (
    <div className="bm-instrument">
      <div className="bm-instrument-title">
        {compact ? 'T = 0' : t('关闭热噪声后的速度')}
        <span>v / v₀ = {Math.exp(-q).toFixed(3)}</span>
      </div>
      <svg
        width={width}
        height="175"
        viewBox={`0 0 ${width} 175`}
        role="img"
        aria-label={t('速度记忆按指数衰减')}
      >
        <path d={`M${left},${top}V${bottom}H${right}`} fill="none" stroke="#657c7455" />
        <path
          d={Array.from(
            { length: 129 },
            (_, i) =>
              `${i ? 'L' : 'M'}${left + ((right - left) * i) / 128},${bottom - (bottom - top) * Math.exp((-8 * i) / 128)}`,
          ).join(' ')}
          fill="none"
          stroke="#52898d"
          strokeWidth="2"
        />
        <circle
          cx={left + ((right - left) * q) / 8}
          cy={bottom - (bottom - top) * Math.exp(-q)}
          r="5"
          fill="#bd8245"
        />
        <text x="0" y={top + 5}>
          1
        </text>
        <text x="0" y={bottom + 5}>
          0
        </text>
        <text x={left} y="164">
          0
        </text>
        <text x={right} y="164" textAnchor="end">
          8τ
        </text>
      </svg>
    </div>
  );
}
export function BrownianMSDPlot({
  tracks,
  time,
  width,
  compact = false,
  horizon = 4,
}: {
  tracks: BrownianTrack[];
  time: number;
  width: number;
  compact?: boolean;
  horizon?: number;
}) {
  const values = useMemo(
    () =>
      Array.from({ length: 129 }, (_, i) => {
        const t = (horizon * i) / 128,
          s = brownianStatistics(tracks, t);
        return {
          time: t,
          measured: s.msd * 1e12,
          theory: brownianMSD(tracks[0].parameters, t) * 1e12,
          single: (s.samples[0].x ** 2 + s.samples[0].y ** 2) * 1e12,
        };
      }),
    [tracks, horizon],
  );
  const max = Math.max(
      1,
      Math.ceil(Math.max(...values.map((s) => Math.max(s.measured, s.theory, s.single))) * 1.05),
    ),
    l = 38,
    r = width - 10,
    top = 25,
    b = width < 640 ? 128 : 170;
  const x = (t: number) => l + ((r - l) * t) / horizon,
    y = (v: number) => b - ((b - top) * v) / max;
  return (
    <div className="bm-instrument">
      <div className="bm-instrument-title">{t('位移平方 · µm²')}</div>
      <svg
        width={width}
        height={b + 38}
        viewBox={`0 0 ${width} ${b + 38}`}
        role="img"
        aria-label={t('单条轨迹、64 次平均与理论均方位移')}
      >
        <path d={`M${l},${top}V${b}H${r}`} fill="none" stroke="#657c7455" />
        {(
          [
            ['single', '#bc864f', ''],
            ['measured', '#477f86', ''],
            ['theory', '#567269', '4 5'],
          ] as const
        ).map(([key, color, dash]) => (
          <path
            key={key}
            d={values
              .filter((s) => s.time <= time)
              .map((s, i) => `${i ? 'L' : 'M'}${x(s.time)},${y(s[key])}`)
              .join(' ')}
            stroke={color}
            strokeWidth={key === 'measured' ? 2.2 : 1.5}
            strokeDasharray={dash}
            fill="none"
          />
        ))}
        <text x="0" y={top + 5}>
          {max.toFixed(0)}
        </text>
        <text x="15" y={b + 5}>
          0
        </text>
        <text x={l} y={b + 29}>
          0
        </text>
        <text x={r} y={b + 29} textAnchor="end">
          {horizon} s
        </text>
      </svg>
      <div className="bm-legend">
        <span style={{ color: '#ad773d' }}>{t('单条')}</span>
        <span style={{ color: '#477f86' }}>{t(compact ? '平均（64次）' : '64 次平均')}</span>
        <span className={compact ? 'bm-theory-key' : undefined}>
          {t(compact ? '理论' : '虚线：理论')}
        </span>
      </div>
    </div>
  );
}
