import { useId } from 'react';
import { t } from '../../i18n';
import {
  differentialMotion,
  differentialPaths,
  differentialBevel,
  differentialPower,
  type DifferentialMotion,
  type differentialTraction,
} from '../../models/differential';
import { useCompact } from '../lab/useCompact';
const colors = ['#d5a576', '#9ec4cd'];
export function DifferentialDial({ angle, color }: { angle: number; color: string }) {
  return (
    <svg viewBox="0 0 60 60" className="diff-dial" width="60" height="60" aria-hidden="true">
      <circle cx="30" cy="30" r="24" fill="none" stroke={color} strokeWidth="5" opacity=".6" />
      <circle cx="30" cy="30" r="7" fill={color} />
      <path
        d={`M30 30L${30 + 21 * Math.sin(angle)} ${30 - 21 * Math.cos(angle)}`}
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx={30 + 24 * Math.sin(angle)} cy={30 - 24 * Math.cos(angle)} r="4" fill="#eef1df" />
    </svg>
  );
}
export function DifferentialReadouts({ motion: m }: { motion: DifferentialMotion }) {
  return (
    <div className="diff-readouts">
      <div>
        <span>{t('左轮')}</span>
        <DifferentialDial angle={m.leftAngle} color={colors[0]} />
        <strong>
          {m.leftRate.toFixed(2)} <small>rad/s</small>
        </strong>
      </div>
      <div className="diff-carrier-readout">
        <span>{t('差速器壳体')}</span>
        <strong>{m.carrierRate.toFixed(2)}</strong>
        <small>rad/s</small>
      </div>
      <div>
        <span>{t('右轮')}</span>
        <DifferentialDial angle={m.rightAngle} color={colors[1]} />
        <strong>
          {m.rightRate.toFixed(2)} <small>rad/s</small>
        </strong>
      </div>
    </div>
  );
}
export function DifferentialRoad({ motion: m }: { motion: DifferentialMotion }) {
  const compact = useCompact(),
    width = compact ? 300 : 760,
    height = compact ? 245 : 270;
  if (m.mode !== 'straight' && m.mode !== 'turn')
    return (
      <div className="diff-road">
        <DifferentialMechanism motion={m} />
        <p>{t('固定车轮与固定壳体属于台架试验，不绘制无侧滑路面轨迹。')}</p>
      </div>
    );
  const complete = differentialMotion(m.mode, m.carrierRate, 8, m.radius, m.turn),
    full = differentialPaths(complete),
    current = differentialPaths(m),
    all = full.flatMap((p) => [p.left, p.right]);
  const minX = Math.min(...all.map((p) => p[0])) - 0.4,
    maxX = Math.max(...all.map((p) => p[0])) + 0.4,
    minY = Math.min(0, ...all.map((p) => p[1])) - 0.45,
    maxY = Math.max(1, ...all.map((p) => p[1])) + 0.5;
  const scale = Math.min((width - 32) / (maxX - minX), (height - 24) / (maxY - minY)),
    x = (a: number) => width / 2 + (a - (maxX + minX) / 2) * scale,
    y = (a: number) => height / 2 - (a - (minY + maxY) / 2) * scale;
  const path = (points: typeof full, key: 'left' | 'right') =>
      points
        .map((p, i) => `${i ? 'L' : 'M'}${x(p[key][0]).toFixed(2)} ${y(p[key][1]).toFixed(2)}`)
        .join(' '),
    last = current.at(-1)!;
  return (
    <div className="diff-road">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t(
          m.mode === 'straight'
            ? '直行时，两侧路程相同。'
            : '同一根车轴转弯时，外侧车轮沿更长的圆弧前进',
        )}
      >
        {(['left', 'right'] as const).map((key, i) => (
          <g key={key}>
            <path
              d={path(full, key)}
              stroke={colors[i]}
              strokeWidth="16"
              opacity=".06"
              fill="none"
            />
            <path
              d={path(full, key)}
              stroke={colors[i]}
              strokeWidth="2"
              opacity=".22"
              strokeDasharray="4 7"
              fill="none"
            />
            <path d={path(current, key)} stroke={colors[i]} strokeWidth="3" fill="none" />
          </g>
        ))}
        <path
          d={`M${x(last.left[0])} ${y(last.left[1])}L${x(last.right[0])} ${y(last.right[1])}`}
          stroke="#d7ded8"
          strokeWidth="5"
        />
        {(['left', 'right'] as const).map((key, i) => (
          <g
            key={key}
            transform={`translate(${x(last[key][0])} ${y(last[key][1])}) rotate(${(-m.yaw * 180) / Math.PI})`}
          >
            <rect
              x={-0.1 * scale}
              y={-0.31 * scale}
              width={0.2 * scale}
              height={0.62 * scale}
              rx="4"
              fill={colors[i]}
            />
            <path d={`M${-0.1 * scale} 0H${0.1 * scale}`} stroke="#172b35" strokeWidth="3" />
          </g>
        ))}
      </svg>
      <div className="diff-distance">
        <span>
          {t('左轮路程')} <strong>{m.leftDistance.toFixed(2)} m</strong>
        </span>
        <span>
          {t('右轮路程')} <strong>{m.rightDistance.toFixed(2)} m</strong>
        </span>
      </div>
      <p>
        {t(m.mode === 'straight' ? '直行时，两侧路程相同。' : '同一段时间，内外侧走过的距离不同。')}
      </p>
    </div>
  );
}
/** Explicit kinematic diagram: cone sections and joints, not a substitute CAD tooth model. */
export function DifferentialMechanism({ motion: m }: { motion: DifferentialMotion }) {
  const id = useId().replace(/:/g, ''),
    s = differentialBevel('side'),
    p = differentialBevel('pinion'),
    sc = 49,
    cx = 150,
    cy = 121;
  const section = (axis: 'x' | 'y', sign: number, g: typeof s) => {
    const pts = [
      [g.inner * Math.cos(g.pitch), -g.inner * Math.sin(g.pitch)],
      [g.outer * Math.cos(g.pitch), -g.outer * Math.sin(g.pitch)],
      [g.outer, 0],
      [g.outer * Math.cos(g.pitch), g.outer * Math.sin(g.pitch)],
      [g.inner * Math.cos(g.pitch), g.inner * Math.sin(g.pitch)],
      [g.inner, 0],
    ];
    return pts
      .map(([a, r]) =>
        axis === 'x'
          ? `${cx + sign * a * sc},${cy + r * sc}`
          : `${cx + r * sc},${cy + sign * a * sc}`,
      )
      .join(' ');
  };
  return (
    <svg
      className="diff-mechanism"
      viewBox="0 0 300 250"
      role="img"
      aria-label={t('二维差速器运动图：两个锥齿轮轴相交，行星齿轮连接左右半轴')}
    >
      <defs>
        <linearGradient id={id}>
          <stop stopColor="#557e87" />
          <stop offset="1" stopColor="#344e59" />
        </linearGradient>
      </defs>
      <path
        d="M72 52H228V190H72Z"
        fill="none"
        stroke="#507781"
        strokeWidth="9"
        strokeLinejoin="round"
      />
      <path d="M150 54V190" stroke="#b6c4c7" strokeWidth="6" />
      <path d="M25 121H93M207 121H275" stroke="#aabdc2" strokeWidth="8" />
      <polygon points={section('x', -1, s)} fill={colors[0]} stroke="#ead0a9" />
      <polygon points={section('x', 1, s)} fill={colors[1]} stroke="#d2e4e2" />
      <polygon points={section('y', -1, p)} fill={`url(#${id})`} stroke="#ba996d" />
      <polygon points={section('y', 1, p)} fill={`url(#${id})`} stroke="#ba996d" />
      <circle cx={150 + 12 * Math.sin(m.pinionAngle)} cy="72" r="4" fill="#f1d19b" />
      <circle cx={150 + 12 * Math.sin(m.pinionAngle)} cy="171" r="4" fill="#f1d19b" />
      <g transform="translate(1 91)">
        <DifferentialDial angle={m.leftAngle} color={colors[0]} />
      </g>
      <g transform="translate(239 91)">
        <DifferentialDial angle={m.rightAngle} color={colors[1]} />
      </g>
      <path
        d="M127 215a24 24 0 0 1 46 0m-6-5 6 5 3-7"
        stroke="#829f9c"
        fill="none"
        strokeWidth="2"
      />
      <circle cx="150" cy="121" r="4" fill="#f0d49d" />
    </svg>
  );
}
export function DifferentialMean({ motion: m }: { motion: DifferentialMotion }) {
  const extent = Math.max(2, Math.abs(m.leftRate), Math.abs(m.rightRate)),
    x = (v: number) => 150 + (120 * v) / extent;
  return (
    <div className="diff-mean">
      <p>{t('一侧比壳体慢多少，另一侧就快多少。')}</p>
      <svg viewBox="0 0 300 142" aria-hidden="true">
        <path d="M30 100H270" stroke="#59747b" />
        <path d={`M${x(m.leftRate)} 66H${x(m.rightRate)}`} stroke="#94adb0" strokeWidth="3" />
        {[
          [m.leftRate, colors[0]],
          [m.carrierRate, '#d7d9b9'],
          [m.rightRate, colors[1]],
        ].map(([v, c], i) => (
          <g key={i}>
            <path
              d={`M${x(v as number)} 100V${i === 1 ? 35 : 55}`}
              stroke={c as string}
              strokeWidth="2"
            />
            <circle cx={x(v as number)} cy={i === 1 ? 35 : 55} r="7" fill={c as string} />
          </g>
        ))}
      </svg>
      <div className="diff-equation">
        {m.leftRate.toFixed(2)} + {m.rightRate.toFixed(2)} = 2 × {m.carrierRate.toFixed(2)}
      </div>
      <p>ωL + ωR = 2ωC</p>
    </div>
  );
}
export function DifferentialTorque({
  motion: m,
  load,
  reference,
  compare,
}: {
  motion: DifferentialMotion;
  load: ReturnType<typeof differentialTraction>;
  reference: ReturnType<typeof differentialTraction>;
  compare: boolean;
}) {
  const power = differentialPower(m, load.sideTorque),
    max = Math.max(400, load.leftCapacity, load.rightCapacity, reference.sideTorque);
  return (
    <div className="diff-torque">
      <p className="diff-load-scope">{t('给定轮胎反作用扭矩上限；转速另行规定。')}</p>
      <div className="diff-torque-pair">
        {[load.leftCapacity, load.rightCapacity].map((capacity, i) => (
          <div key={i}>
            <span>{t(i ? '右侧上限' : '左侧上限')}</span>
            <strong>
              {capacity.toFixed(0)} <small>N·m</small>
            </strong>
            <div className="diff-torque-track">
              <i style={{ width: `${(100 * capacity) / max}%` }} />
              <b style={{ width: `${(100 * load.sideTorque) / max}%`, background: colors[i] }} />
            </div>
            <span>
              {t('实际可维持')} <b>{load.sideTorque.toFixed(0)} N·m</b>
            </span>
          </div>
        ))}
      </div>
      <p className="diff-accepted">
        {t('壳体可接受扭矩')} <strong>{load.acceptedCarrier.toFixed(0)} N·m</strong>
      </p>
      {compare ? (
        <div className="diff-reference">
          <span>{t('同一请求，左右上限充足时')}</span>
          <strong>{reference.acceptedCarrier.toFixed(0)} N·m</strong>
          <p>{t('弱侧上限降低，也限制另一侧；未传出的请求不算已输入扭矩。')}</p>
        </div>
      ) : (
        <div className="diff-power">
          <span>
            {t('左侧功率')} <b>{power.left.toFixed(0)} W</b>
          </span>
          <span>
            {t('右侧功率')} <b>{power.right.toFixed(0)} W</b>
          </span>
          <span>
            {t('输入功率')} <b>{power.input.toFixed(0)} W</b>
          </span>
          <p>{t('理想两侧扭矩相等；转速不同，功率可以不同。')}</p>
        </div>
      )}
    </div>
  );
}
