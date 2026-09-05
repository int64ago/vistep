import { useId } from 'react';
import { t } from '../../i18n';
import {
  diffractionColor,
  diffractionPartial,
  diffractionPath,
  type DiffractionState,
  type DiffractionView,
  type DiffractionSample,
} from '../../models/diffraction';

export function DiffractionAperture({
  state,
  width,
  time,
  activePair,
  compact = false,
}: {
  state: DiffractionState;
  width: number;
  time: number;
  activePair: number;
  compact?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const cy = 120,
    slitX = width * 0.28,
    gap = state.parameters.slitUm * 0.66;
  const distanceRatio = Math.max(
    0,
    Math.min(1, Math.log(state.parameters.distanceM / 0.005) / Math.log(200)),
  );
  const screenX = slitX + 54 + (width - slitX - 78) * distanceRatio;
  const targetY = cy - (state.sample.yMm / state.spanMm) * 78;
  const color = diffractionColor(state.parameters.wavelengthNm),
    spacing = (state.parameters.wavelengthNm / 550) * 18;
  if (compact) {
    const cx = width / 2,
      apertureY = 57,
      screenY = 111 + distanceRatio * 36;
    const targetX = cx + (state.sample.yMm / state.spanMm) * (width / 2 - 24);
    return (
      <svg
        className="diffraction-aperture"
        width={width}
        height="185"
        viewBox={`0 0 ${width} 185`}
        role="img"
        aria-label={t('手机剖面：平面波向下通过横向狭缝，抵达下方的屏幕。')}
      >
        <defs>
          <linearGradient id={`${id}-phone-metal`} x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#6c7870" />
            <stop offset="1" stopColor="#2d4239" />
          </linearGradient>
        </defs>
        {Array.from({ length: 4 }, (_, i) => (
          <line
            key={i}
            x1="20"
            x2={width - 20}
            y1={5 + (i + ((time * 0.25) % 1)) * (spacing * 0.55)}
            y2={5 + (i + ((time * 0.25) % 1)) * (spacing * 0.55)}
            stroke={color}
            strokeOpacity=".32"
            strokeWidth="1.3"
          />
        ))}
        <rect
          x="13"
          y={apertureY - 4}
          width={cx - gap / 2 - 13}
          height="9"
          rx="3"
          fill={`url(#${id}-phone-metal)`}
        />
        <rect
          x={cx + gap / 2}
          y={apertureY - 4}
          width={width - 13 - cx - gap / 2}
          height="9"
          rx="3"
          fill={`url(#${id}-phone-metal)`}
        />
        <line
          x1={cx}
          x2={cx}
          y1="69"
          y2={screenY}
          stroke="#8b9c8c"
          strokeDasharray="3 5"
          strokeOpacity=".4"
        />
        {state.contributions.map((part, i) => {
          const from = cx + part.midpoint * gap,
            active = i === activePair || i === activePair + 4;
          return (
            <g key={i}>
              {state.validity.usable && (
                <line
                  x1={from}
                  y1={apertureY + 6}
                  x2={targetX}
                  y2={screenY}
                  stroke={i < 4 ? '#528b83' : '#b1775c'}
                  strokeOpacity={active ? 0.8 : 0.22}
                  strokeWidth={active ? 1.8 : 1}
                />
              )}
              <circle
                cx={from}
                cy={apertureY}
                r={active ? 3.4 : 2.2}
                fill={i < 4 ? '#528b83' : '#b1775c'}
              />
            </g>
          );
        })}
        <rect x="20" y={screenY - 4} width={width - 40} height="9" rx="4" fill="#324639" />
        {state.validity.usable ? (
          <circle cx={targetX} cy={screenY} r="5" fill="none" stroke="#b47753" strokeWidth="2" />
        ) : (
          <text x={cx} y={screenY + 6} textAnchor="middle" fill="#e6e6d4">
            ?
          </text>
        )}
        <path
          d={`M${width - 9} ${apertureY + 10}V${screenY - 8}`}
          stroke="#95a28e"
          strokeWidth="1"
        />
        <text x={width - 15} y={(apertureY + screenY) / 2 + 5} textAnchor="end">
          L
        </text>
        <text x={cx} y="48" textAnchor="middle">
          a
        </text>
        <text x={cx} y="179" textAnchor="middle">
          {t('屏幕位置')} y
        </text>
      </svg>
    );
  }
  return (
    <svg
      className="diffraction-aperture"
      width={width}
      height="248"
      viewBox={`0 0 ${width} 248`}
      role="img"
      aria-label={t('均匀平面波照亮单个狭缝，各段共同决定同一屏幕位置的电场。')}
    >
      <defs>
        <linearGradient id={`${id}-metal`}>
          <stop stopColor="#596866" />
          <stop offset=".6" stopColor="#293b3a" />
          <stop offset="1" stopColor="#7d8580" />
        </linearGradient>
        <clipPath id={`${id}-input`}>
          <rect x="4" y="30" width={slitX - 12} height="170" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-input)`}>
        {Array.from({ length: 24 }, (_, i) => (
          <line
            key={i}
            x1={slitX - 15 - i * spacing + ((time * 0.33) % 1) * spacing}
            x2={slitX - 15 - i * spacing + ((time * 0.33) % 1) * spacing}
            y1="38"
            y2="202"
            stroke={color}
            strokeWidth="1.4"
            strokeOpacity=".32"
          />
        ))}
      </g>
      <line
        x1="5"
        x2={screenX}
        y1={cy}
        y2={cy}
        stroke="#788983"
        strokeOpacity=".25"
        strokeDasharray="3 6"
      />
      <rect
        x={slitX - 5}
        y="28"
        width="11"
        height={cy - gap / 2 - 28}
        rx="3"
        fill={`url(#${id}-metal)`}
      />
      <rect
        x={slitX - 5}
        y={cy + gap / 2}
        width="11"
        height={208 - cy - gap / 2}
        rx="3"
        fill={`url(#${id}-metal)`}
      />
      <line
        x1={slitX}
        x2={slitX}
        y1={cy - gap / 2}
        y2={cy + gap / 2}
        stroke={color}
        strokeWidth="4"
        strokeOpacity=".32"
      />
      {state.contributions.map((part, i) => {
        const y = cy - part.midpoint * gap,
          active = i === activePair || i === activePair + 4;
        return (
          <g key={i}>
            {state.validity.usable && (
              <line
                x1={slitX + 6}
                y1={y}
                x2={screenX}
                y2={targetY}
                stroke={i < 4 ? '#528b83' : '#b1775c'}
                strokeOpacity={active ? 0.8 : 0.15}
                strokeWidth={active ? 1.8 : 1}
              />
            )}
            <circle cx={slitX} cy={y} r={active ? 3.5 : 2} fill={i < 4 ? '#528b83' : '#b1775c'} />
          </g>
        );
      })}
      <rect x={screenX - 5} y="38" width="10" height="164" rx="5" fill="#253c38" />
      {state.validity.usable &&
        Array.from({ length: 81 }, (_, i) => {
          const yMm = (1 - i / 40) * state.spanMm;
          const beta =
            ((Math.PI * state.units.a) / state.units.lambda) *
            Math.sin(Math.atan2(yMm * 1e-3, state.units.L));
          // The phasor integral itself supplies the tiny screen's intensity too.
          const field = diffractionPartial(beta, 1),
            intensity = field.re ** 2 + field.im ** 2;
          return (
            <rect
              key={i}
              x={screenX - 4}
              y={39 + i * 2}
              width="8"
              height="2.1"
              fill={color}
              opacity={intensity ** 0.35}
            />
          );
        })}
      {state.validity.usable ? (
        <circle cx={screenX} cy={targetY} r="6" fill="none" stroke="#b56f4f" strokeWidth="2" />
      ) : (
        <text x={screenX} y={cy + 5} textAnchor="middle" fill="#dde4d9">
          ?
        </text>
      )}
      <text x={slitX} y="20" textAnchor="middle">
        a
      </text>
      <path
        d={`M${slitX + 12} 222H${screenX - 8}M${slitX + 12} 218v8M${screenX - 8} 218v8`}
        stroke="#798d83"
        strokeOpacity=".55"
      />
      <text x={(slitX + screenX) / 2} y="244" textAnchor="middle">
        L = {state.parameters.distanceM.toFixed(3)} m
      </text>
    </svg>
  );
}

export function DiffractionPhasors({
  state,
  width,
  reveal,
  activePair,
  view,
  compact = false,
}: {
  state: DiffractionState;
  width: number;
  reveal: number;
  activePair: number;
  view: DiffractionView;
  compact?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const fullCurve = Array.from({ length: 129 }, (_, i) =>
    diffractionPartial(state.sample.beta, i / 128),
  );
  const minRe = Math.min(...fullCurve.map((v) => v.re)),
    maxRe = Math.max(...fullCurve.map((v) => v.re));
  const minIm = Math.min(...fullCurve.map((v) => v.im)),
    maxIm = Math.max(...fullCurve.map((v) => v.im));
  const scale = Math.min(
    600,
    Math.min(width - 48, 300) / Math.max(0.01, maxRe - minRe),
    (compact ? 84 : 127) / Math.max(0.01, maxIm - minIm),
  );
  const ox = width / 2 - ((minRe + maxRe) / 2) * scale,
    oy = (compact ? 112 : 111) + ((minIm + maxIm) / 2) * scale;
  const point = (v: { re: number; im: number }) => ({ x: ox + v.re * scale, y: oy - v.im * scale });
  const trace = Array.from({ length: 101 }, (_, i) =>
    point(diffractionPartial(state.sample.beta, (i / 100) * reveal)),
  );
  const end = point(diffractionPartial(state.sample.beta, reveal));
  return (
    <svg
      className="diffraction-phasors"
      width={width}
      height={compact ? 200 : 248}
      viewBox={`0 0 ${width} ${compact ? 200 : 248}`}
      role="img"
      aria-label={t(
        '首尾相加的箭头是各段狭缝的电场贡献，合成电场为中心的 {0}。',
        state.sample.amplitude.toFixed(3),
      )}
    >
      <defs>
        <marker
          id={`${id}-arrow`}
          viewBox="0 0 8 8"
          refX="6"
          refY="4"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M1 1L7 4L1 7" fill="none" stroke="context-stroke" strokeWidth="1.4" />
        </marker>
      </defs>
      {compact && (
        <g>
          <path
            d={`M16 43H${width / 2 - state.parameters.slitUm * 0.33}M${width / 2 + state.parameters.slitUm * 0.33} 43H${width - 16}`}
            stroke="#798977"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {state.contributions.map((part, i) => (
            <circle
              key={i}
              cx={width / 2 + part.midpoint * state.parameters.slitUm * 0.66}
              cy="43"
              r={i === activePair || i === activePair + 4 ? 3.5 : 2.1}
              fill={i < 4 ? '#49867b' : '#b17459'}
            />
          ))}
        </g>
      )}
      <line x1="12" y1={oy} x2={width - 12} y2={oy} stroke="#83948a" strokeOpacity=".18" />
      <line
        x1={ox}
        y1={compact ? 65 : 38}
        x2={ox}
        y2={compact ? 158 : 182}
        stroke="#83948a"
        strokeOpacity=".18"
      />
      {state.contributions.map((part, i) => {
        const a = point(part.start),
          b = point(part.end),
          active = i === activePair || i === activePair + 4;
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={i < 4 ? '#49867b' : '#b17459'}
            strokeWidth={active ? 3.2 : 1.7}
            strokeOpacity={part.hi + 0.5 <= reveal + 1e-8 ? 0.85 : 0.18}
            markerEnd={`url(#${id}-arrow)`}
          />
        );
      })}
      <path
        d={diffractionPath(trace)}
        fill="none"
        stroke="#406f64"
        strokeWidth="1.2"
        strokeOpacity=".4"
      />
      <line
        x1={ox}
        y1={oy}
        x2={end.x}
        y2={end.y}
        stroke="#bd7852"
        strokeWidth="3.2"
        markerEnd={Math.hypot(end.x - ox, end.y - oy) > 8 ? `url(#${id}-arrow)` : undefined}
      />
      <circle cx={ox} cy={oy} r="3" fill="#5e7568" />
      <circle cx={end.x} cy={end.y} r="4" fill="#bd7852" />
      <text x={width / 2} y="22" textAnchor="middle">
        {view === 'sum' && reveal < 1
          ? t('已相加 {0} / 8 段', Math.floor(reveal * 8))
          : `E / E₀ = ${state.sample.amplitude.toFixed(3)}`}
      </text>
      <path
        d={`M${width / 2 - scale / 8} ${compact ? 170 : 208}H${width / 2 + scale / 8}`}
        stroke="#879582"
        strokeWidth="2"
      />
      <text x={width / 2} y={compact ? 195 : 241} textAnchor="middle">
        {t('标尺')} 0.25 E₀
      </text>
    </svg>
  );
}

export function DiffractionDistance({
  state,
  width,
  compact = false,
}: {
  state: DiffractionState;
  width: number;
  compact?: boolean;
}) {
  const y = (desktop: number, phone: number) => (compact ? phone : desktop);
  const n = state.validity.fullWidthFresnel;
  const left = 22,
    right = width - 22,
    at = left + Math.min(1, n) * (right - left);
  const threshold = left + 0.1 * (right - left);
  return (
    <svg
      width={width}
      height={y(248, 185)}
      viewBox={`0 0 ${width} ${y(248, 185)}`}
      className="diffraction-distance"
      role="img"
      aria-label={t('以完整缝宽定义 N = a² / (λL)，当前为 {0}。', n.toFixed(3))}
    >
      <text x={width / 2} y={y(46, 27)} textAnchor="middle">
        N = a² / (λL)
      </text>
      <text x={width / 2} y={y(94, 71)} textAnchor="middle" className="diffraction-svg-large">
        {n.toFixed(3)}
      </text>
      <path
        d={`M${left} ${y(136, 106)}H${right}`}
        stroke="#9ca99a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d={`M${left} ${y(136, 106)}H${threshold}`}
        stroke="#588b75"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d={`M${threshold} ${y(123, 93)}V${y(150, 119)}`} stroke="#5b7e69" strokeWidth="1" />
      <circle
        cx={at}
        cy={y(136, 106)}
        r="6"
        fill={state.validity.farField ? '#4c856f' : '#b17355'}
      />
      <text x={left} y={y(181, 151)}>
        0
      </text>
      <text x={threshold + 7} y={y(162, 132)}>
        0.1
      </text>
      <text x={right} y={y(181, 151)} textAnchor="end">
        1
      </text>
      <text x={width / 2} y={y(223, 178)} textAnchor="middle">
        {t('边缘相位误差')} {state.validity.edgePhaseError.toFixed(3)} rad
      </text>
    </svg>
  );
}

export function DiffractionScreen({
  state,
  profile,
  width,
  field,
  compact = false,
}: {
  state: DiffractionState;
  profile: DiffractionSample[];
  width: number;
  field: boolean;
  compact?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const pad = 21,
    span = width - 2 * pad,
    base = compact ? 112 : 166,
    gain = compact ? 60 : 82,
    stripHeight = compact ? 30 : 47,
    height = compact ? (field ? 170 : 151) : field ? 230 : 211;
  const x = (yMm: number) => pad + ((yMm / state.spanMm + 1) / 2) * span;
  const color = diffractionColor(state.parameters.wavelengthNm);
  const min = state.firstMinimum,
    minima = min && min.yMm <= state.spanMm ? [-min.yMm, min.yMm] : [];
  return (
    <svg
      className="diffraction-screen"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('屏幕横坐标以毫米表示；光强曲线按当前中央峰归一化。')}
    >
      <defs>
        <clipPath id={`${id}-strip`}>
          <rect x={pad} y="4" width={span} height={stripHeight} rx="8" />
        </clipPath>
      </defs>
      <rect x={pad} y="4" width={span} height={stripHeight} rx="8" fill="#233a34" />
      <g clipPath={`url(#${id}-strip)`}>
        {profile.map((sample, i) => (
          <rect
            key={i}
            x={x(sample.yMm) - span / profile.length / 2}
            y="4"
            width={span / (profile.length - 1) + 0.5}
            height={stripHeight}
            fill={color}
            opacity={sample.intensity ** 0.35}
          />
        ))}
      </g>
      {minima.map((yMm) => (
        <g key={yMm}>
          <path
            d={`M${x(yMm)} 2v${stripHeight + 6}M${x(yMm)} ${base - gain - 10}v${gain + 10}`}
            stroke="#9e8c70"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        </g>
      ))}
      <line x1={pad} x2={width - pad} y1={base} y2={base} stroke="#8da08d" strokeOpacity=".5" />
      <line
        x1={pad}
        x2={width - pad}
        y1={base - gain}
        y2={base - gain}
        stroke="#8da08d"
        strokeOpacity=".13"
      />
      <text x="1" y={base - gain + 6}>
        1
      </text>
      <text x="1" y={base + 5}>
        0
      </text>
      {field && (
        <path
          d={diffractionPath(profile.map((p) => ({ x: x(p.yMm), y: base - p.amplitude * gain })))}
          stroke="#b77858"
          strokeWidth="1.6"
          strokeDasharray="5 4"
          fill="none"
        />
      )}
      <path
        d={diffractionPath(profile.map((p) => ({ x: x(p.yMm), y: base - p.intensity * gain })))}
        fill="none"
        stroke="#477d68"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d={`M${x(state.sample.yMm)} 0V${compact ? (field ? 136 : 126) : field ? 193 : 181}`}
        stroke="#b37451"
        strokeWidth="1.2"
        strokeOpacity=".62"
      />
      <circle
        cx={x(state.sample.yMm)}
        cy={base - state.sample.intensity * gain}
        r="4"
        fill="#477d68"
      />
      {field && (
        <circle
          cx={x(state.sample.yMm)}
          cy={base - state.sample.amplitude * gain}
          r="3.5"
          fill="#b77858"
        />
      )}
      <text x={pad} y={height - 6}>
        −{state.spanMm.toFixed(state.spanMm < 2 ? 1 : 0)}
      </text>
      <text x={width / 2} y={height - 6} textAnchor="middle">
        0
      </text>
      <text x={width - pad} y={height - 6} textAnchor="end">
        +{state.spanMm.toFixed(state.spanMm < 2 ? 1 : 0)} mm
      </text>
    </svg>
  );
}

export function DiffractionLimits({ ratio, width }: { ratio: number; width: number }) {
  const x = (r: number) => 30 + (r / 1.25) * (width - 54),
    y = (theta: number) => 215 - (theta / (Math.PI / 2)) * 150;
  const theta = ratio <= 1 ? Math.asin(ratio) : null;
  return (
    <div className="diffraction-limits">
      <p>{t('只检查零点方程；不模拟亚波长狭缝。')}</p>
      <div className="diffraction-limit-equation">
        <b>sin θ₁ = λ / a</b>
        <span>λ / a = {ratio.toFixed(3)}</span>
      </div>
      <svg
        width={width}
        height="268"
        viewBox={`0 0 ${width} 268`}
        role="img"
        aria-label={t('当波长与缝宽之比达到一，零点方向趋向 90°；超过一，方程没有实数解。')}
      >
        <rect x={x(1)} y="40" width={x(1.25) - x(1)} height="175" rx="8" fill="#b9785810" />
        <path d={`M30 48V215H${width - 24}`} stroke="#91a38f" fill="none" />
        <path
          d={diffractionPath(
            Array.from({ length: 121 }, (_, i) => ({ x: x(i / 120), y: y(Math.asin(i / 120)) })),
          )}
          fill="none"
          stroke="#52846d"
          strokeWidth="2.6"
        />
        <path d={`M${x(1)} 40V223`} stroke="#ba8d6d" strokeDasharray="4 5" />
        <line
          x1={x(ratio)}
          x2={x(ratio)}
          y1="215"
          y2={theta === null ? 65 : y(theta)}
          stroke="#b47250"
          strokeDasharray="3 4"
        />
        {theta !== null && <circle cx={x(ratio)} cy={y(theta)} r="5" fill="#b47250" />}
        <text x="1" y="219">
          0°
        </text>
        <text x="1" y="56">
          90°
        </text>
        <text x={x(0)} y="244" textAnchor="middle">
          0
        </text>
        <text x={x(0.5)} y="244" textAnchor="middle">
          0.5
        </text>
        <text x={x(1)} y="244" textAnchor="middle">
          1
        </text>
        <text x={width - 24} y="267" textAnchor="end">
          λ / a
        </text>
      </svg>
      <div className="diffraction-limit-result">
        <strong>
          {theta === null ? t('没有实数角度解') : `θ₁ = ${((theta * 180) / Math.PI).toFixed(1)}°`}
        </strong>
        <span>
          {t(ratio >= 1 ? '没有有限屏幕上的第一零点。' : '零点随 λ / a 增大而移向侧方。')}
        </span>
      </div>
      <p>{t('这不表示衍射消失。接近波长时，还需要真实孔径的电磁边界模型。')}</p>
    </div>
  );
}
