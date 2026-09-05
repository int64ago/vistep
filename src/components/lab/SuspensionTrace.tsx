import { useId, useMemo } from 'react';
import { t } from '../../i18n';
import { suspensionForces, type SuspensionTrace as Trace } from '../../models/suspension';
import { useSuspensionPlotWidth } from './SuspensionLayout';

export default function SuspensionTrace({
  a,
  b,
  time,
  focus,
}: {
  a: Trace;
  b: Trace | null;
  time: number;
  focus: string;
}) {
  const { ref, width } = useSuspensionPlotWidth(),
    compact = width < 600,
    height = compact ? (b ? 250 : focus === 'contact' ? 152 : 220) : 174,
    left = compact ? 58 : 54,
    right = width - 16,
    top = 20,
    bottom = height - 35;
  const id = useId().replace(/:/g, '');
  const duration = Math.min(a.states.at(-1)!.time, b?.states.at(-1)!.time ?? Infinity);
  const kind = focus === 'contact' ? 'normal' : focus === 'tradeoff' ? 'acceleration' : 'position';
  const series = useMemo(() => {
    const take = (trace: Trace, key: 'body' | 'wheel' | 'road' | 'normal' | 'acceleration') =>
      trace.states
        .filter(
          (s, i) => (i % 8 === 0 || i === trace.states.length - 1) && s.time <= duration + 1e-9,
        )
        .map((s) => {
          const f = suspensionForces(s, trace.parameters, trace.road);
          return {
            time: s.time,
            value:
              key === 'normal'
                ? f.normalLoad / 1000
                : key === 'acceleration'
                  ? f.bodyAcceleration
                  : key === 'road'
                    ? f.road * 1000
                    : s[key] * 1000,
          };
        });
    return kind === 'normal'
      ? [{ color: '#597f83', points: take(a, 'normal') }]
      : b
        ? [
            {
              color: '#b57651',
              points: take(a, kind === 'acceleration' ? 'acceleration' : 'body'),
            },
            {
              color: '#497b84',
              points: take(b, kind === 'acceleration' ? 'acceleration' : 'body'),
            },
          ]
        : [
            { color: '#b57651', points: take(a, 'body') },
            { color: '#497b84', points: take(a, 'wheel') },
            { color: '#84918d', points: take(a, 'road') },
          ];
  }, [a, b, duration, kind]);
  const all = series.flatMap((s) => s.points.map((p) => p.value));
  const max = Math.max(kind === 'normal' ? 4 : 1, ...all.map(Math.abs)) * 1.12,
    min = kind === 'normal' ? 0 : -max;
  const x = (v: number) => left + ((right - left) * v) / Math.max(0.01, duration),
    y = (v: number) => bottom - ((v - min) / (max - min)) * (bottom - top);
  const path = (points: { time: number; value: number }[]) =>
    points
      .map((p, i) => `${i ? 'L' : 'M'}${x(p.time).toFixed(2)} ${y(p.value).toFixed(2)}`)
      .join(' ');
  const label =
    kind === 'normal'
      ? t('轮胎法向载荷 / kN')
      : kind === 'acceleration'
        ? t('车身加速度 / m/s²')
        : t('相对静态位置 / mm');
  return (
    <div className="susp-trace">
      <div className="susp-trace-heading">
        <span>{label}</span>
        {b && <span>{t('相同路面 · 相同时间')}</span>}
      </div>
      <div className="susp-trace-plot" ref={ref}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={label}
        >
          <defs>
            <clipPath id={id}>
              <rect x={left} y="0" width={Math.max(0, x(time) - left)} height={height} />
            </clipPath>
          </defs>
          {[min, 0, max]
            .filter((v, i, array) => array.indexOf(v) === i)
            .map((v) => (
              <g key={v}>
                <path
                  d={`M${left} ${y(v)}H${right}`}
                  stroke={kind === 'normal' && v === 0 ? '#b77861' : '#c7cdc5'}
                  strokeWidth="1"
                  strokeDasharray={v ? '3 5' : undefined}
                />
                <text x={left - 8} y={y(v) + 5} textAnchor="end">
                  {v.toFixed(kind === 'normal' || kind === 'acceleration' ? 1 : 0)}
                </text>
              </g>
            ))}
          {series.map((s, i) => (
            <g key={i}>
              <path
                d={path(s.points)}
                fill="none"
                stroke={s.color}
                opacity=".15"
                strokeWidth="1.5"
              />
              <path
                d={path(s.points)}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                clipPath={`url(#${id})`}
              />
            </g>
          ))}
          <path d={`M${x(time)} ${top}V${bottom}`} stroke="#5e767b" strokeWidth="1" />
          <text x={left} y={height - 9}>
            0 s
          </text>
          <text x={right} y={height - 9} textAnchor="end">
            {duration.toFixed(1)} s
          </text>
        </svg>
      </div>
      {kind === 'position' && !b && (
        <div className="susp-legend">
          <span>
            <i className="susp-orange" />
            {t('车身')}
          </span>
          <span>
            <i className="susp-blue" />
            {t('轮组')}
          </span>
          <span>
            <i className="susp-grey" />
            {t('路面输入')}
          </span>
        </div>
      )}
    </div>
  );
}
