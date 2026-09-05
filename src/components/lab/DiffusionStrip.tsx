import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import {
  diffusionColor,
  diffusionDiagnostics,
  diffusionField,
  diffusionFlux,
  diffusionGradient,
  diffusionSamples,
  diffusionValue,
  type DiffusionField,
  type DiffusionView,
} from '../../models/diffusion';
export default function DiffusionStrip({
  field,
  second,
  view,
  section = 0.67,
  region = [0.55, 0.85],
}: {
  field: DiffusionField;
  second: DiffusionField | null;
  view: DiffusionView;
  section?: number;
  region?: readonly [number, number];
}) {
  const host = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(700),
    id = useId().replaceAll(':', '');
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(240, el.clientWidth));
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  const mix = view === 'mix',
    compare = !!second,
    variance = view === 'variance',
    small = width < 500,
    W = width,
    left = 24,
    right = W - 24,
    span = right - left,
    domain = Math.max(field.p.length, second?.p.length ?? 0),
    X = (x: number) => left + (span * x) / domain;
  const plotY = compare ? 228 : view === 'reservoir' ? 196 : view === 'budget' ? 194 : 170,
    plotH = small ? 115 : 178,
    H = plotY + plotH + 46,
    top = 40,
    barH = compare ? 46 : 64;
  const b = mix ? diffusionField(field.p, field.time, 'B') : null,
    maximum = mix
      ? 2.12
      : field.p.kind === 'reservoir'
        ? 1.08
        : Math.max(128 / 35 / field.p.length, second ? 128 / 35 / second.p.length : 0) * 1.04;
  const Y = (c: number) => plotY + plotH - (c / maximum) * plotH;
  const points = (f: DiffusionField) =>
    Array.from({ length: 161 }, (_, i) => {
      const x = (f.p.length * i) / 160;
      return `${i ? 'L' : 'M'}${X(x)},${Y(diffusionValue(f, x))}`;
    }).join(' ');
  const cells = useMemo(() => diffusionSamples(field, small ? 80 : 160), [field, small]),
    cellsB = useMemo(() => (b ? diffusionSamples(b, small ? 80 : 160) : null), [b, small]),
    other = useMemo(
      () => (second ? diffusionSamples(second, small ? 80 : 160) : null),
      [second, small],
    );
  const bars = (
    f: DiffusionField,
    samples: ReturnType<typeof diffusionSamples>,
    y: number,
    otherSpecies: ReturnType<typeof diffusionSamples> | null = null,
  ) => (
    <g>
      <rect
        x={X(0) - 5}
        y={y - 5}
        width={X(f.p.length) - X(0) + 10}
        height={barH + 10}
        rx="9"
        fill="#253c49"
        stroke="#a4b7be"
        strokeWidth="1"
      />
      <g clipPath={`url(#${id}-${y})`}>
        {samples.map((s, i) => (
          <rect
            key={i}
            x={X((i * f.p.length) / samples.length)}
            y={y}
            width={(span * f.p.length) / domain / samples.length + 0.3}
            height={barH}
            fill={diffusionColor(s.concentration, otherSpecies?.[i].concentration ?? 0)}
          />
        ))}
      </g>
      <rect
        x={X(0)}
        y={y}
        width={X(f.p.length) - X(0)}
        height={barH}
        rx="5"
        fill={`url(#${id}-shine)`}
      />
      <path
        d={`M${X(0)},${y + 3}v${barH - 6} M${X(f.p.length)},${y + 3}v${barH - 6}`}
        stroke={f.basis === 'sin' ? '#edbd75' : '#d6e5e8'}
        strokeWidth={f.basis === 'sin' ? 2 : 5}
        strokeDasharray={f.basis === 'sin' ? '4 4' : undefined}
      />
    </g>
  );
  const arrow = (x: number, y: number, flux: number) => {
    if (Math.abs(flux) < 1e-10) return <circle cx={x} cy={y} r="3" fill="#f1ce8c" />;
    const sign = Math.sign(flux),
      a = x - 20 * sign,
      z = x + 20 * sign;
    return (
      <path
        d={`M${a},${y}H${z}m${-7 * sign},-5l${7 * sign},5l${-7 * sign},5`}
        fill="none"
        stroke="#f1ce8c"
        strokeWidth="2"
      />
    );
  };
  const titleA = compare
    ? view === 'D'
      ? `D = ${field.p.D.toFixed(3)}`
      : `L = ${field.p.length.toFixed(1)}`
    : field.basis === 'sin'
      ? t('固定浓度边界')
      : mix
        ? t('两种标记，共用静止介质')
        : t('封闭的浓度带');
  const titleB = second
    ? view === 'D'
      ? `D = ${second.p.D.toFixed(3)}`
      : `L = ${second.p.length.toFixed(1)}`
    : '';
  const clipBar = (f: DiffusionField, y: number) => (
    <clipPath id={`${id}-${y}`}>
      <rect x={X(0)} y={y} width={X(f.p.length) - X(0)} height={barH} rx="5" />
    </clipPath>
  );
  const historyEnd = Math.max(18, field.time),
    varianceMax = (field.p.length ** 2 / 12) * 1.1,
    VY = (v: number) => plotY + plotH - (v / varianceMax) * plotH,
    VX = (time: number) => left + (span * time) / historyEnd;
  const history = variance
    ? Array.from({ length: 121 }, (_, i) => {
        const time = (historyEnd * i) / 120;
        return `${i ? 'L' : 'M'}${VX(time)},${VY(diffusionDiagnostics(diffusionField(field.p, time)).variance)}`;
      }).join(' ')
    : '';
  const initialVariance = variance ? diffusionDiagnostics(diffusionField(field.p, 0)).variance : 0,
    refTime =
      field.p.D > 0
        ? Math.min(historyEnd, (field.p.length ** 2 / 12 - initialVariance) / (2 * field.p.D))
        : 0;
  return (
    <div ref={host} className="diffusion-drawing">
      <svg
        className="diffusion-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('浓度带与同一扩散解的截面曲线；箭头表示净通量，不是流体速度。')}
      >
        <defs>
          {clipBar(field, top)}
          {second && clipBar(second, 138)}
          <linearGradient id={`${id}-shine`} x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".18" />
            <stop offset=".4" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#041d2a" stopOpacity=".15" />
          </linearGradient>
          <clipPath id={`${id}-plot`}>
            <rect x={left} y={plotY} width={span} height={plotH + 1} />
          </clipPath>
        </defs>
        <text x={left} y="22" style={compare ? { fill: '#79caef' } : undefined}>
          {titleA}
        </text>
        {!compare && (
          <text x={right} y="22" textAnchor="end" className="diffusion-desktop-coordinate">
            L = {field.p.length.toFixed(1)}
          </text>
        )}
        {bars(field, cells, top, cellsB)}
        {second && other && (
          <>
            <text x={left} y="120" style={{ fill: '#efbf76' }}>
              {titleB}
            </text>
            {bars(second, other, 138)}
          </>
        )}
        {field.basis === 'sin' && (
          <>
            <text x={left} y="132">
              c = 1
            </text>
            <text x={right} y="132" textAnchor="end">
              c = 0
            </text>
            <text x={left} y="156">
              J = {diffusionFlux(field, 0).toFixed(3)}
            </text>
            <text x={right} y="156" textAnchor="end">
              J = {diffusionFlux(field, field.p.length).toFixed(3)}
            </text>
            {arrow(left + 25, 84, diffusionFlux(field, 0))}
            {arrow(right - 25, 84, diffusionFlux(field, field.p.length))}
          </>
        )}
        {view === 'flux' && (
          <>
            <path
              d={`M${X(section * field.p.length)},${top - 5}V${top + barH + 8}`}
              stroke="#ffe4a8"
              strokeWidth="2"
            />
            {arrow(
              X(section * field.p.length),
              133,
              diffusionFlux(field, section * field.p.length),
            )}
          </>
        )}
        {view === 'budget' && (
          <>
            <rect
              x={X(region[0] * field.p.length)}
              y={top - 5}
              width={X(region[1] * field.p.length) - X(region[0] * field.p.length)}
              height={barH + 10}
              fill="#edd19522"
              stroke="#ffe4a8"
              strokeWidth="1"
            />
            {arrow(
              X(region[0] * field.p.length),
              124,
              diffusionFlux(field, region[0] * field.p.length),
            )}
            {arrow(
              X(region[1] * field.p.length),
              124,
              diffusionFlux(field, region[1] * field.p.length),
            )}
            <text x={X(region[0] * field.p.length)} y="149" textAnchor="middle">
              {diffusionFlux(field, region[0] * field.p.length).toFixed(3)}
            </text>
            <text x={X(region[1] * field.p.length)} y="149" textAnchor="middle">
              {diffusionFlux(field, region[1] * field.p.length).toFixed(3)}
            </text>
          </>
        )}
        <text x={left} y={plotY - 12}>
          {t(variance ? '分布方差 σ²' : '浓度 c')}
        </text>
        <path
          d={`M${left},${plotY}V${plotY + plotH}H${right}`}
          stroke="#68818e"
          strokeWidth="1"
          fill="none"
        />
        {[0.5, 1].map((q) => (
          <path
            key={q}
            d={`M${left},${plotY + plotH - q * plotH}H${right}`}
            stroke="#526a77"
            strokeOpacity=".4"
            strokeDasharray="3 6"
          />
        ))}
        {variance ? (
          <>
            <path
              d={`M${left},${VY(field.p.length ** 2 / 12)}H${right}`}
              stroke="#e7c27f"
              strokeDasharray="5 5"
            />
            <path
              d={`M${VX(0)},${VY(initialVariance)}L${VX(refTime)},${VY(initialVariance + 2 * field.p.D * refTime)}`}
              stroke="#839ca8"
              strokeDasharray="3 5"
              fill="none"
            />
            <path d={history} fill="none" stroke="#75c3e8" strokeWidth="2.6" />
            <circle
              cx={VX(field.time)}
              cy={VY(diffusionDiagnostics(field).variance)}
              r="5"
              fill="#b9e5fa"
              stroke="#162f41"
              strokeWidth="2"
            />
            <text x={left} y={H - 12}>
              0
            </text>
            <text x={(left + right) / 2} y={H - 12} textAnchor="middle">
              t*
            </text>
            <text x={right} y={H - 12} textAnchor="end">
              {historyEnd.toFixed(0)}
            </text>
          </>
        ) : (
          <>
            <g clipPath={`url(#${id}-plot)`}>
              {view === 'release' && (
                <path
                  d={points(diffusionField(field.p, 0))}
                  fill="none"
                  stroke="#a4b7be"
                  strokeDasharray="4 5"
                />
              )}
              {view === 'budget' && (
                <path
                  d={`${Array.from({ length: 61 }, (_, i) => {
                    const x = (region[0] + ((region[1] - region[0]) * i) / 60) * field.p.length;
                    return `${i ? 'L' : 'M'}${X(x)},${Y(diffusionValue(field, x))}`;
                  }).join(
                    ' ',
                  )}L${X(region[1] * field.p.length)},${Y(0)}H${X(region[0] * field.p.length)}Z`}
                  fill="#efcf8830"
                />
              )}
              {!second && !mix && view !== 'budget' && (
                <path
                  d={`${points(field)}L${X(field.p.length)},${Y(0)}H${X(0)}Z`}
                  fill="#69b9e318"
                />
              )}
              <path d={points(field)} fill="none" stroke="#79caef" strokeWidth="2.6" />
              {second && <path d={points(second)} fill="none" stroke="#efbf76" strokeWidth="2.6" />}
              {b && (
                <>
                  <path d={points(b)} fill="none" stroke="#efbf76" strokeWidth="2.6" />
                  <path
                    d={`M${left},${Y((2 * field.p.mass) / field.p.length)}H${X(field.p.length)}`}
                    stroke="#dde6dc"
                    strokeWidth="1.5"
                    strokeDasharray="4 5"
                  />
                </>
              )}
              {view === 'flux' &&
                (() => {
                  const x = section * field.p.length,
                    c = diffusionValue(field, x),
                    g = diffusionGradient(field, x),
                    half = small ? 18 : 30;
                  return (
                    <>
                      <path
                        d={`M${X(x)},${plotY}V${plotY + plotH}`}
                        stroke="#efd398"
                        strokeDasharray="3 4"
                      />
                      <path
                        d={`M${X(x) - half},${Y(c - (g * half * domain) / span)}L${X(x) + half},${Y(c + (g * half * domain) / span)}`}
                        stroke="#efd398"
                        strokeWidth="2"
                      />
                      <circle cx={X(x)} cy={Y(c)} r="4" fill="#fff0c5" />
                    </>
                  );
                })()}
            </g>
            <text x={left} y={H - 12}>
              0
            </text>
            <text x={(left + right) / 2} y={H - 12} textAnchor="middle">
              x*
            </text>
            <text x={right} y={H - 12} textAnchor="end">
              {domain.toFixed(1)}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
