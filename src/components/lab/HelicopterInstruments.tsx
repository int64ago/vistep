import { t } from '../../i18n';
import { helicopterBladePitch, type HelicopterState } from '../../models/helicopter';
const copper = '#a96e39',
  teal = '#2e7881',
  ink = '#40545a',
  muted = '#92a09e';
export function HeliArrow({
  a,
  b,
  color = teal,
  dash = false,
}: {
  a: [number, number];
  b: [number, number];
  color?: string;
  dash?: boolean;
}) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    length = Math.hypot(dx, dy);
  if (length < 0.5) return null;
  const nx = dx / length,
    ny = dy / length,
    h = Math.min(8, length * 0.4);
  return (
    <g stroke={color} fill={color} strokeWidth="2" strokeLinecap="round">
      <path d={`M${a}L${b}`} fill="none" strokeDasharray={dash ? '4 5' : undefined} />
      <path
        d={`M${b}L${b[0] - h * nx + 0.45 * h * ny},${b[1] - h * ny - 0.45 * h * nx}L${b[0] - h * nx - 0.45 * h * ny},${b[1] - h * ny + 0.45 * h * nx}Z`}
        stroke="none"
      />
    </g>
  );
}
export function HelicopterTorque({ state, width }: { state: HelicopterState; width: number }) {
  const w = Math.min(width, 650),
    x = 14,
    track = w - 28,
    max = 7000;
  return (
    <div className="helicopter-torque">
      <div className="helicopter-note-row">
        <b>{t('绕主轴的力矩')}</b>
        <span>
          {Math.abs(state.tailBalance - 1) < 0.005
            ? t('尾桨平衡')
            : state.tailBalance < 1
              ? t('尾桨不足')
              : t('尾桨过量')}
        </span>
      </div>
      {[
        { label: '机身反扭矩', value: state.rotorTorque, color: copper },
        { label: '尾桨反向力矩', value: state.tailTorque, color: teal },
      ].map((row) => (
        <div key={row.label} className="helicopter-torque-row" style={{ color: row.color }}>
          <div>
            <span>{t(row.label)}</span>
            <b>{row.value.toFixed(0)} N·m</b>
          </div>
          <svg
            viewBox={`0 0 ${w} 25`}
            role="img"
            aria-label={t('力矩条统一使用零到七千牛米的比例尺')}
          >
            <path d={`M${x} 12H${w - x}`} stroke="#cedbd4" strokeWidth="7" strokeLinecap="round" />
            {row.value > 0.1 && (
              <path
                d={`M${x} 12H${x + (row.value / max) * track}`}
                stroke={row.color}
                strokeWidth="7"
                strokeLinecap="round"
              />
            )}
          </svg>
        </div>
      ))}
    </div>
  );
}

export function HelicopterTrace({
  state,
  phase,
  width,
}: {
  state: HelicopterState;
  phase: number;
  width: number;
}) {
  const angle = ((phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2),
    pad = 16,
    value = helicopterBladePitch(state.collectiveDeg, state.cyclicDeg, angle),
    py = (p: number) => 35 - (p - state.collectiveDeg) * 7,
    x = pad + ((width - 2 * pad) * angle) / (Math.PI * 2);
  return (
    <div className="helicopter-trace">
      <div className="helicopter-note-row">
        <b>
          {t('铜色桨叶')} θ = {value.toFixed(1)}°
        </b>
        <span>{t('一圈')}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} 86`}
        role="img"
        aria-label={t('两片旋翼相隔半圈的桨距与周期波形')}
      >
        <path d={`M${pad},35H${width - pad}`} stroke={muted} strokeDasharray="3 5" />
        <path
          d={Array.from(
            { length: 129 },
            (_, i) =>
              `${i ? 'L' : 'M'}${pad + ((width - pad * 2) * i) / 128},${py(helicopterBladePitch(state.collectiveDeg, state.cyclicDeg, (i / 128) * Math.PI * 2))}`,
          ).join('')}
          stroke={copper}
          strokeWidth="2.2"
          fill="none"
        />
        <path d={`M${x},8V62`} stroke={ink} strokeDasharray="3 5" />
        <circle cx={x} cy={py(value)} r="4" fill={copper} />
        <text x={pad} y="82" fill={ink}>
          0°
        </text>
        <text x={width / 2} y="82" textAnchor="middle" fill={ink}>
          180°
        </text>
        <text x={width - pad} y="82" textAnchor="end" fill={ink}>
          360°
        </text>
      </svg>
    </div>
  );
}
