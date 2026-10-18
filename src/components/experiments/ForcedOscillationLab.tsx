import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  motorOscillator,
  measuredDriveFrequency,
  coupledPendulumTrajectory,
  sampleCoupled,
} from '../../models/forced-oscillation-lab';
import '../../styles/forced-oscillation-lab.css';
function spring(x: number, y: number, length: number, n = 12) {
  return Array.from({ length: n * 12 + 1 }, (_, i) => {
    const q = i / (n * 12);
    return `${i ? 'L' : 'M'}${x + (q < 0.04 || q > 0.96 ? 0 : 9 * Math.sin(q * n * Math.PI * 2))},${y + q * length}`;
  }).join(' ');
}
export default function ForcedOscillationLab() {
  const film = useShowcase(),
    [selected, setSelected] = useState(
      film.variant === 'e1-resonance-pendulums' ? 'beam' : 'motor',
    ),
    [frequency, setFrequency] = useState(1),
    [driverLength, setDriverLength] = useState(0.35),
    [time, setTime] = useState(0),
    c = film.chapter,
    p = film.chapterProgress,
    mode = film.watch ? (c < 2 ? 'motor' : 'beam') : selected,
    f = film.watch ? (c === 1 ? 1.5 : 1) : frequency,
    L = film.watch ? (c === 4 ? 0.27 : 0.35) : driverLength,
    seconds = film.watch
      ? c === 0
        ? 14 * p
        : c === 1
          ? 20 + 10 * p
          : c === 2
            ? 12 * p
            : c === 3
              ? 20 + 16 * p
              : 36 * p
      : time,
    path = useMemo(() => coupledPendulumTrajectory(L), [L]),
    state = sampleCoupled(path, seconds),
    a = motorOscillator(seconds, f, 12),
    b = motorOscillator(seconds, f, 26),
    freqs = useMemo(() => [measuredDriveFrequency(f, 12), measuredDriveFrequency(f, 26)], [f]),
    caption =
      mode === 'motor'
        ? seconds < 12
          ? '电机带动同一个滑槽横梁，两个弹簧的暂态响应不同'
          : '暂态衰减后，两组不同弹簧都跟随电机频率'
        : c === 4 && film.watch
          ? '缩短重摆 D 后，响应较强的轻摆随之改变'
          : '重摆通过同一横梁传递能量，同长轻摆在观察窗口内响应较强',
    beamX = state.beam * 600,
    baseY = 52 + 400 * a.base;
  return (
    <section className="fr-film" data-watch={film.watch || undefined} data-chapter={film.chapter}>
      <p className="fr-caption">{t(caption)}</p>
      {mode === 'motor' ? (
        <svg
          viewBox="0 0 400 310"
          className="fr-apparatus"
          role="img"
          aria-label={t('电机曲柄的销钉在横槽中滑动，横梁上下移动并驱动两组不同的弹簧钩码')}
        >
          <path
            d="M61 285V21H339V285M47 285h31m246 0h30"
            fill="none"
            stroke="#b4c1a8"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="200" cy="52" r="27" fill="#d1dac2" />
          <circle cx="200" cy="52" r="4" fill="#87997b" />
          <path
            d={`M200 52L${200 + 400 * a.amplitude * Math.sin(a.w * seconds)} ${baseY}`}
            stroke="#a58a61"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path d={`M95 ${baseY}H305`} stroke="#9faf8d" strokeWidth="9" strokeLinecap="round" />
          <rect
            x="175"
            y={baseY - 7}
            width="50"
            height="14"
            rx="7"
            fill="#e4e9da"
            stroke="#a6b493"
          />
          <circle
            cx={200 + 400 * a.amplitude * Math.sin(a.w * seconds)}
            cy={baseY}
            r="4"
            fill="#a58a61"
          />
          {[a, b].map((s, i) => {
            const x = i ? 286 : 114,
              y = baseY + 400 * (s.equilibrium + s.q);
            return (
              <g key={i}>
                <path
                  d={spring(x, baseY, y - baseY, i ? 8 : 12)}
                  fill="none"
                  stroke={i ? '#b89a6c' : '#829878'}
                  strokeWidth={i ? 3.5 : 2.5}
                />
                <path d={`M${x} ${y}v8`} stroke="#87927e" strokeWidth="3" />
                {[0, 1, 2].map((j) => (
                  <rect
                    key={j}
                    x={x - 16}
                    y={y + 8 + j * 7}
                    width="32"
                    height="7"
                    rx="3"
                    fill={i ? '#b89a6c' : '#829878'}
                  />
                ))}
                <text x={x} y="270" textAnchor="middle">
                  k = {s.k} N/m
                </text>
                <text x={x} y="302" textAnchor="middle">
                  f₀ = {s.naturalFrequency.toFixed(2)} Hz
                </text>
              </g>
            );
          })}
        </svg>
      ) : (
        <>
          <svg
            viewBox="0 0 420 310"
            className="fr-apparatus"
            role="img"
            aria-label={t('A 至 G 七个摆共用可微移的横梁，D 为重摆，摆长相同者响应较强')}
          >
            <path
              d="M14 281V32m392 0v249M5 281h23m365 0h26"
              stroke="#acbba0"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d={`M14 53l5-5 5 10 5-10 5 10 6-5M${380 + beamX} 53l5-5 5 10 5-10 5 10 6-5`}
              stroke="#9eac91"
              strokeWidth="2"
              fill="none"
            />
            <path
              d={`M${40 + beamX} 53H${380 + beamX}`}
              stroke="#afbd9d"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {state.angles.map((angle, i) => {
              const pivot = 44 + i * 55 + beamX,
                length = path.L[i] * 330,
                x = pivot + length * Math.sin(angle),
                y = 53 + length * Math.cos(angle);
              return (
                <g key={i}>
                  <path d={`M${pivot} 53L${x} ${y}`} stroke="#8b9d7e" strokeWidth="1.8" />
                  <circle
                    cx={x}
                    cy={y}
                    r={i === 3 ? 15 : 7}
                    fill={
                      i === 3 ? '#b69867' : Math.abs(path.L[i] - L) < 0.001 ? '#92a978' : '#b5c2a7'
                    }
                  />
                  <text x={44 + i * 55} y="28" textAnchor="middle">
                    {'ABCDEFG'[i]}
                  </text>
                  <text x={44 + i * 55} y="274" textAnchor="middle">
                    {Math.round(path.L[i] * 100)}
                  </text>
                </g>
              );
            })}
            <text x="210" y="306" textAnchor="middle">
              {t('摆长 / cm · D 为重摆')}
            </text>
          </svg>
          <div className="fr-inset">
            <span>{t('横梁微动放大 20 倍')}</span>
            <svg viewBox="0 0 260 45" role="img" aria-label={t('放大的横梁水平位移')}>
              <path d="M130 3v38" stroke="#c1cbb6" strokeDasharray="3 4" />
              <rect
                x={76 + state.beam * 12000}
                y="15"
                width="108"
                height="12"
                rx="6"
                fill="#a8b98f"
              />
            </svg>
          </div>
        </>
      )}
      <div className="fr-readings">
        <span>
          {t('模型时间')} {seconds.toFixed(1)} s
        </span>
        {mode === 'motor' ? (
          <>
            <span>f = {f.toFixed(2)} Hz</span>
            <span>
              {t('稳态测频')}{' '}
              {seconds >= 20 ? freqs.map((x) => x?.toFixed(2)).join(' / ') : '— / —'} Hz
            </span>
          </>
        ) : (
          <span>
            {t('系统机械能')} {(state.energy * 1000).toFixed(1)} mJ
          </span>
        )}
      </div>
      {mode === 'beam' && (
        <p className="fr-note">
          {t('重摆释放后没有持续补能；能量会交换并衰减，不把暂态当作永久稳态。')}
        </p>
      )}
      {!film.watch && (
        <div className="fr-controls">
          <Segments
            label={t('选择驱动装置')}
            value={selected}
            options={[
              { value: 'motor', label: t('电机与弹簧') },
              { value: 'beam', label: t('共振摆') },
            ]}
            onChange={(v) => {
              setSelected(v);
              setTime(0);
            }}
          />
          {mode === 'motor' ? (
            <Range
              label={t('电机频率')}
              value={frequency}
              min={0.6}
              max={2}
              step={0.05}
              unit="Hz"
              onChange={setFrequency}
            />
          ) : (
            <Segments
              label={t('重摆 D 的长度')}
              value={String(driverLength)}
              options={[
                { value: '.27', label: '27 cm' },
                { value: '.35', label: '35 cm' },
                { value: '.44', label: '44 cm' },
              ].map((o) => ({ ...o, value: String(Number(o.value)) }))}
              onChange={(v) => {
                setDriverLength(Number(v));
                setTime(0);
              }}
            />
          )}
          <Range
            label={t('模型时间')}
            value={time}
            min={0}
            max={mode === 'motor' ? 30 : 36}
            step={0.05}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
      <details className="fr-details">
        <summary>{t('驱动、耦合与边界')}</summary>
        <p>
          {t(
            '电机通过滑槽横梁给弹簧上端规定周期位移；计算包含起动暂态与阻尼，稳态频率由后段实际过零时刻读取。共振摆采用小角度、可水平微移的公共横梁，联立求解全部七个摆和横梁，包含重摆反作用与能量交换。轻摆并非独立接收一条预设正弦波。横梁局部图放大位移，主图保留统一尺度。',
          )}
        </p>
      </details>
    </section>
  );
}
