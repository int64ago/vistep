import { useLayoutEffect, useId, useRef, useState } from 'react';
import { t } from '../../i18n';
import {
  bernoulliAt,
  bernoulliGeometry,
  bernoulliParcels,
  type BernoulliShot,
} from '../../models/bernoulli';

export function useBernoulliWidth(initialWidth = 840) {
  const ref = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(initialWidth);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (el.clientWidth > 0) setWidth(el.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width, phone: width < 540 };
}
const curve = (points: { x: number; y: number }[], close = false) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ') +
  (close ? 'Z' : '');
const colors = {
  water: '#618e97',
  ink: '#304c53',
  gold: '#b57932',
  pressure: '#557f91',
  height: '#88948a',
  loss: '#aa6759',
};
export default function BernoulliTube({
  shot,
  initialWidth = 840,
}: {
  shot: BernoulliShot;
  initialWidth?: number;
}) {
  const { ref, width, phone } = useBernoulliWidth(initialWidth),
    id = useId().replace(/:/g, '');
  const run = shot.run,
    p = run.parameters,
    parcelView = shot.view === 'parcel';
  const W = width,
    H = phone ? (parcelView ? 292 : 274) : 400,
    pad = phone ? 24 : 65;
  const span = W - 2 * pad,
    base = phone ? (parcelView ? 213 : 195) : 285,
    radius = phone ? 23 : 38;
  const taps = [0.08, 0.45, 0.92].map((w) => bernoulliAt(run, w * p.length));
  const headScale = (phone ? 95 : 182) / Math.max(1.35, ...taps.map((s) => s.hydraulicHead + 0.15));
  const pos = (s: number) => {
    const g = bernoulliGeometry(p, s);
    return {
      x: pad + (g.x / p.length) * span,
      y: base - g.z * headScale,
      r: (radius * g.diameter) / p.diameter,
    };
  };
  const shape = (a: number, b: number) => {
    const points = Array.from({ length: 65 }, (_, i) => pos(a + ((b - a) * i) / 64));
    return curve(
      [
        ...points.map((v) => ({ x: v.x, y: v.y - v.r })),
        ...points.toReversed().map((v) => ({ x: v.x, y: v.y + v.r })),
      ],
      true,
    );
  };
  const top = run.stations.map((s) => {
      const v = pos(s.s);
      return { x: v.x, y: v.y - v.r };
    }),
    bottom = run.stations.map((s) => {
      const v = pos(s.s);
      return { x: v.x, y: v.y + v.r };
    });
  const parcels = bernoulliParcels(run, shot.physicalTime, parcelView);
  const openColumns = taps.every(
    (s) => base - s.hydraulicHead * headScale < pos(s.s).y - pos(s.s).r - 8,
  );
  const probe = pos(shot.probe),
    inlet = pos(0),
    outlet = pos(p.length);
  return (
    <div ref={ref} className="bernoulli-tube">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('连续文丘里管、三个相连测压口与守恒的水体标记。')}
      >
        <defs>
          <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#9fbcbc" stopOpacity=".58" />
            <stop offset=".42" stopColor="#779da5" stopOpacity=".72" />
            <stop offset="1" stopColor="#cbdad2" stopOpacity=".68" />
          </linearGradient>
          <linearGradient id={`${id}-metal`} x1="0" x2="1">
            <stop stopColor="#81938c" />
            <stop offset=".35" stopColor="#e3e5d8" />
            <stop offset="1" stopColor="#9baaa0" />
          </linearGradient>
          <clipPath id={`${id}-bore`}>
            <path d={shape(0, p.length)} />
          </clipPath>
        </defs>
        <path
          d={`M${pad},${base + (phone ? 40 : 62)}H${W - pad}`}
          stroke="#c9cebe"
          strokeWidth="1"
        />
        {parcelView ? (
          <g>
            {[taps[0], taps[1]].map((s, i) => {
              const x = W * (i ? 0.75 : 0.25),
                r = ((phone ? 29 : 42) * s.diameter) / p.diameter;
              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={70}
                    r={r}
                    fill="#afc9c9"
                    stroke={colors.water}
                    strokeWidth="2"
                  />
                  <text x={x} y={phone ? 126 : 133} textAnchor="middle">
                    {(s.area * 1e4).toFixed(1)} cm²
                  </text>
                  <text x={x} y={phone ? 153 : 161} textAnchor="middle">
                    {s.velocity.toFixed(2)} m/s
                  </text>
                </g>
              );
            })}
            <path
              d={`M${W * 0.42},70H${W * 0.58}m-6-4 6 4-6 4`}
              stroke={colors.gold}
              fill="none"
              strokeWidth="1.8"
            />
            <text x={W / 2} y={phone ? 178 : 200} textAnchor="middle" fill={colors.gold}>
              {t('同一体积')} · {(run.totalVolume * 0.065 * 1000).toFixed(3)} L
            </text>
          </g>
        ) : (
          <g>
            <text x={pad} y={24}>
              {openColumns ? t('开口水柱 · 表压') : t('密闭测压口 · 绝对压力')}
            </text>
            {taps.map((s, i) => {
              const v = pos(s.s),
                topY = base - s.hydraulicHead * headScale,
                stem = v.y - v.r;
              return (
                <g key={i}>
                  <text x={v.x} y={52} textAnchor="middle">
                    {['A', 'B', 'C'][i]}
                  </text>
                  <text x={v.x} y={77} textAnchor="middle">
                    {((s.pressure - (openColumns ? p.ambient : 0)) / 1000).toFixed(1)}
                  </text>
                  {openColumns ? (
                    <>
                      <path
                        d={`M${v.x - 5},91V${stem}H${v.x + 5}V91`}
                        stroke="#839a94"
                        strokeWidth="1.4"
                        fill="#f6f6ec"
                        fillOpacity=".6"
                      />
                      <path
                        d={`M${v.x},${Math.max(91, topY)}V${stem + 2}`}
                        stroke={colors.water}
                        strokeWidth="7"
                      />
                      <path
                        d={`M${v.x - 5},${Math.max(91, topY)}h10`}
                        stroke={colors.water}
                        strokeWidth="2"
                      />
                    </>
                  ) : (
                    <>
                      <path d={`M${v.x},129V${stem + 2}`} stroke="#829994" strokeWidth="7" />
                      <path d={`M${v.x},129V${stem + 2}`} stroke="#c4d6ce" strokeWidth="3" />
                      <circle
                        cx={v.x}
                        cy={115}
                        r={14}
                        fill="#e7ebe0"
                        stroke={colors.water}
                        strokeWidth="2"
                      />
                      <path d={`M${v.x - 6},121l10-11`} stroke={colors.gold} strokeWidth="2" />
                    </>
                  )}
                  <circle cx={v.x} cy={stem} r="4" fill="#476d74" />
                </g>
              );
            })}
            <text x={W - pad} y={24} textAnchor="end">
              kPa
            </text>
          </g>
        )}
        <path
          d={shape(0, p.length)}
          fill={`url(#${id}-water)`}
          stroke="#738d88"
          strokeWidth="1.5"
        />
        <g clipPath={`url(#${id}-bore)`}>
          {parcels.map((parcel) => (
            <path
              key={parcel.id}
              d={shape(parcel.start, parcel.end)}
              fill={parcelView ? '#c6924c' : '#d0aa65'}
              fillOpacity={parcelView ? 0.8 : 0.49}
              stroke="#a97935"
              strokeWidth={parcelView ? 1.3 : 0.65}
            />
          ))}
          {[-0.6, 0, 0.6].map((frac) => (
            <path
              key={frac}
              d={curve(
                run.stations.map((s) => {
                  const v = pos(s.s);
                  return { x: v.x, y: v.y + frac * v.r };
                }),
              )}
              fill="none"
              stroke="#537d86"
              strokeOpacity=".28"
              strokeWidth="1"
            />
          ))}
          {p.flow > 0 &&
            run.status === 'valid' &&
            [0.08, 0.25, 0.45, 0.68, 0.9].map((f) => {
              const s = bernoulliAt(run, p.length * f),
                v = pos(s.s),
                length = Math.min(phone ? 20 : 34, 5 + s.velocity * (phone ? 4 : 7));
              return (
                <path
                  key={f}
                  d={`M${v.x - length / 2},${v.y}h${length}m-5-3 5 3-5 3`}
                  fill="none"
                  stroke="#365e67"
                  strokeWidth="1.5"
                />
              );
            })}
        </g>
        <path d={curve(top)} fill="none" stroke="#eef3e6" strokeWidth="3" />
        <path d={curve(bottom)} fill="none" stroke="#607f7e" strokeWidth="2" />
        {[inlet, outlet].map((v, i) => (
          <g key={i}>
            <ellipse
              cx={v.x}
              cy={v.y}
              rx={5}
              ry={v.r + 5}
              fill="none"
              stroke={`url(#${id}-metal)`}
              strokeWidth="5"
            />
            <ellipse
              cx={v.x}
              cy={v.y}
              rx={3}
              ry={v.r}
              fill="none"
              stroke="#698888"
              strokeWidth="1"
            />
          </g>
        ))}
        {!parcelView && (
          <g>
            <path
              d={`M${probe.x},${probe.y + probe.r + 4}V${base + (phone ? 34 : 56)}`}
              stroke={colors.gold}
              strokeDasharray="3 3"
            />
            <circle cx={probe.x} cy={probe.y} r="4" fill={colors.gold} />
          </g>
        )}
        <text x={pad} y={H - 17}>
          {t('入口')}
        </text>
        <text x={W / 2} y={H - 17} textAnchor="middle">
          {parcelView ? 'Q = Av' : p.flow === 0 ? 'Q = 0' : `Q = ${(p.flow * 1000).toFixed(1)} L/s`}
        </text>
        <text x={W - pad} y={H - 17} textAnchor="end">
          {t('出口')}
        </text>
      </svg>
    </div>
  );
}

export function BernoulliHeads({
  shot,
  initialWidth = 840,
}: {
  shot: BernoulliShot;
  initialWidth?: number;
}) {
  const { ref, width, phone } = useBernoulliWidth(initialWidth),
    run = shot.run,
    p = run.parameters;
  const W = width,
    H = phone ? 270 : 345,
    left = phone ? 36 : 60,
    right = W - (phone ? 20 : 50),
    bottom = phone ? 180 : 245;
  const ymin = Math.min(-0.05, ...run.stations.map((s) => Math.min(s.z, s.hydraulicHead))),
    ymax = Math.max(1.45, ...run.stations.map((s) => s.totalHead + 0.1));
  const y = (v: number) => bottom - ((v - ymin) / (ymax - ymin)) * (bottom - 50),
    x = (s: number) => left + (s / p.length) * (right - left);
  const local = bernoulliAt(run, shot.probe),
    px = x(local.s);
  const line = (field: 'totalHead' | 'hydraulicHead' | 'z', reference = false) =>
    curve((reference ? shot.reference! : run).stations.map((s) => ({ x: x(s.s), y: y(s[field]) })));
  return (
    <div ref={ref} className="bernoulli-heads">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('沿管的总水头、测压管水头和高程；测点将压强、速度与高度放在同一能量账本。')}
      >
        <text x={left} y={25}>
          {t('水头账本')} · m
        </text>
        <text x={right} y={25} textAnchor="end">
          {shot.view === 'loss'
            ? `f = ${p.friction.toFixed(3)}`
            : phone
              ? 'H'
              : 'H = p/ρg + v²/2g + z'}
        </text>
        {(ymax - ymin > 3
          ? [Math.ceil(ymin), Math.round((ymax + ymin) / 2), Math.floor(ymax)]
          : [0, 0.5, 1]
        ).map((v) => (
          <g key={v}>
            <path d={`M${left},${y(v)}H${right}`} stroke="#d6d9cb" strokeWidth="1" />
            <text x={left - 7} y={y(v) + 5} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {shot.reference && (
          <>
            <path
              d={line('totalHead', true)}
              stroke="#8c9990"
              strokeDasharray="5 5"
              strokeWidth="2"
              fill="none"
            />
            <path
              d={line('hydraulicHead', true)}
              stroke="#b4bcb0"
              strokeDasharray="4 5"
              strokeWidth="1.5"
              fill="none"
            />
          </>
        )}
        <path d={line('totalHead')} stroke={colors.gold} strokeWidth="2.5" fill="none" />
        <path d={line('hydraulicHead')} stroke={colors.pressure} strokeWidth="2.5" fill="none" />
        <path d={line('z')} stroke={colors.height} strokeWidth="2" fill="none" />
        <path
          d={`M${px},${y(local.z)}V${y(local.hydraulicHead)}`}
          stroke={colors.pressure}
          strokeWidth="10"
          strokeOpacity=".65"
        />
        <path
          d={`M${px},${y(local.hydraulicHead)}V${y(local.totalHead)}`}
          stroke={colors.gold}
          strokeWidth="10"
          strokeOpacity=".7"
        />
        <circle cx={px} cy={y(local.totalHead)} r="4" fill={colors.gold} />
        {shot.reference && (
          <path
            d={`M${px + 10},${y(shot.reference.stations[0].totalHead)}V${y(local.totalHead)}`}
            stroke={colors.loss}
            strokeWidth="4"
          />
        )}
        <path d={`M${px},${y(local.z)}V${H - 44}`} stroke={colors.gold} strokeDasharray="3 3" />
        {[-1, 1].map((sign) => (
          <path
            key={sign}
            d={curve(
              run.stations.map((s) => ({
                x: x(s.s),
                y: H - 42 + (sign * 12 * s.diameter) / p.diameter,
              })),
            )}
            stroke="#6c8d8a"
            strokeWidth="2"
            fill="none"
          />
        ))}
        <circle cx={px} cy={H - 42} r="4" fill={colors.gold} />
        <text x={left} y={H - 7}>
          0
        </text>
        <text x={right} y={H - 7} textAnchor="end">
          {p.length.toFixed(1)} m
        </text>
      </svg>
      <div className="bernoulli-head-key">
        <span>
          <i style={{ background: colors.pressure }} />
          {t('压力水头')}
          <b>{local.pressureHead.toFixed(2)} m</b>
        </span>
        <span>
          <i style={{ background: colors.gold }} />
          {t('速度水头')}
          <b>{local.velocityHead.toFixed(2)} m</b>
        </span>
        <span>
          <i style={{ background: colors.height }} />
          {t('高程')}
          <b>{local.z.toFixed(2)} m</b>
        </span>
      </div>
      {shot.reference && (
        <p className="bernoulli-loss-note">
          {t('灰虚线：无损对照')} · {t('累计损失')} {local.loss.toFixed(3)} m
        </p>
      )}
    </div>
  );
}
