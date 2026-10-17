import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  surfaceWave,
  surfaceParcel,
  surfaceElevation,
  surfaceBeat,
  surfaceShot,
} from '../../models/surface-waves';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/surface-waves.css';
export default function SurfaceWaves() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [wavelength, setWavelength] = useState(6),
    [depth, setDepth] = useState(6),
    [amplitude, setAmplitude] = useState(0.06),
    [probe, setProbe] = useState(0.05),
    [elapsed, setElapsed] = useState(0),
    [group, setGroup] = useState(false);
  const shot = film.watch
      ? surfaceShot(film.chapter, film.chapterProgress)
      : { wavelength, depth, amplitude, probe, group },
    s = surfaceWave(shot),
    b = surfaceBeat(0, 0, shot),
    time = film.watch
      ? film.chapterProgress * Math.min(5, (shot.group ? 2 * s.wavelength : 10) / s.c)
      : elapsed,
    W = phone ? 340 : 760,
    H = phone ? 280 : 330,
    left = 18,
    right = W - 18,
    span = shot.group ? 6 * s.wavelength : 18,
    px = (x: number) => left + (x / span) * (right - left),
    wave = (kind: 'one' | 'two' | 'sum' | 'single', base: number) =>
      Array.from({ length: 241 }, (_, i) => {
        const x = (i / 240) * span,
          eta =
            kind === 'single' ? surfaceElevation(x, time, shot) : surfaceBeat(x, time, shot)[kind];
        return `${px(x)},${base - eta * (phone ? 210 : 300)}`;
      }).join(' '),
    q = surfaceParcel(2, -s.depth * shot.probe, time, shot),
    cx = phone ? 190 : 480,
    cy = phone ? 188 : 205,
    mag = phone ? 620 : 800,
    railTop = phone ? 116 : 115,
    railBottom = H - 20,
    crest = 2 + s.c * time;
  return (
    <section className="surface-study">
      <header>
        {t(shot.group ? '包络和内部波峰，各有自己的速度' : '波峰向前走，跟住同一颗水质点')}
      </header>
      <svg
        className="surface-section"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t(
          shot.group
            ? '两个有限水深重力波的分量与叠加，标记包络和内部相位'
            : '行进波的剖面与选定深度的局部质点轨道',
        )}
      >
        <defs>
          <linearGradient id={`${id}water`} x2="0" y2="1">
            <stop stopColor="#8bb6bf" stopOpacity=".26" />
            <stop offset="1" stopColor="#8bb6bf" stopOpacity=".02" />
          </linearGradient>
        </defs>
        {shot.group ? (
          <>
            {(['one', 'two', 'sum'] as const).map((kind, i) => {
              const y = phone ? 48 + i * 88 : 55 + i * 100;
              return (
                <g key={kind}>
                  <path d={`M${left} ${y}H${right}`} stroke="#8caeb6" opacity=".25" />
                  <polyline
                    points={wave(kind, y)}
                    fill="none"
                    stroke={i === 2 ? '#e0bc78' : '#9dc4c6'}
                    strokeWidth={i === 2 ? 2.8 : 1.7}
                  />
                </g>
              );
            })}
            {[1, -1].map((sign) => (
              <polyline
                key={sign}
                points={Array.from({ length: 241 }, (_, i) => {
                  const x = (i / 240) * span;
                  return `${px(x)},${(phone ? 224 : 255) - sign * Math.abs(surfaceBeat(x, time, shot).envelope) * (phone ? 210 : 300)}`;
                }).join(' ')}
                fill="none"
                stroke="#e0bc78"
                strokeDasharray="4 5"
                opacity=".55"
              />
            ))}
            <path
              d={`M${px(b.origin + b.group * time)} ${phone ? 191 : 215}v65`}
              stroke="#dfc28a"
              strokeWidth="2"
            />
            <circle
              cx={px(b.origin + b.carrier * time)}
              cy={
                (phone ? 224 : 255) -
                surfaceBeat(b.origin + b.carrier * time, time, shot).sum * (phone ? 210 : 300)
              }
              r="5"
              fill="#bfdbd2"
            />
          </>
        ) : (
          <>
            <path d={`M${left} 48H${right}`} stroke="#a7c3c6" strokeDasharray="3 5" opacity=".35" />
            <polygon
              points={`${left},90 ${wave('single', 48)} ${right},90`}
              fill={`url(#${id}water)`}
            />
            <polyline points={wave('single', 48)} fill="none" stroke="#b0d5d4" strokeWidth="2.5" />
            <circle
              cx={px(crest)}
              cy={48 - s.amplitude * (phone ? 210 : 300)}
              r="5"
              fill="#e1bf7d"
            />
            <path
              d={`M35 ${railTop}V${railBottom}m-10 0h20M25 ${railTop}h20`}
              stroke="#8eaeb5"
              strokeWidth="2"
            />
            <path
              d={`M35 ${railTop + shot.probe * (railBottom - railTop)}H${phone ? 92 : 165}`}
              stroke="#dfc18b"
              strokeDasharray="3 4"
            />
            <circle
              cx="35"
              cy={railTop + shot.probe * (railBottom - railTop)}
              r="5"
              fill="#dfc18b"
            />
            <path
              d={`M${cx - 135} ${cy}h270M${cx} ${cy - 65}v130`}
              stroke="#83a3ad"
              opacity=".25"
            />
            {q.b > 1e-12 ? (
              <ellipse
                cx={cx}
                cy={cy}
                rx={q.a * mag}
                ry={q.b * mag}
                fill="none"
                stroke="#a3c9c6"
                strokeWidth="1.5"
              />
            ) : (
              <path
                d={`M${cx - q.a * mag} ${cy}H${cx + q.a * mag}`}
                stroke="#a3c9c6"
                strokeWidth="1.5"
              />
            )}
            <circle cx={cx + q.dx * mag} cy={cy - q.dz * mag} r="5" fill="#e2c286" />
            <circle cx={cx} cy={cy} r="2" fill="#9bb6bc" />
          </>
        )}
      </svg>
      <div className="surface-legend">
        {shot.group ? (
          <>
            <span>{t('上两条：两个分量；下：叠加')}</span>
            <span>{t('金线：包络峰；浅点：内部相位')}</span>
          </>
        ) : (
          <>
            <span>{t('上：行进波；下：局部轨道放大')}</span>
            <span>
              {t('质点平均深度')} −{(s.depth * shot.probe).toFixed(2)} m
            </span>
          </>
        )}
      </div>
      <div className="surface-velocities">
        <div>
          <b>{(shot.group ? b.carrier : s.c).toFixed(2)} m/s</b>
          <span>{t('相位速度')}</span>
        </div>
        <div>
          <b>{(shot.group ? b.group : s.cg).toFixed(2)} m/s</b>
          <span>{t(shot.group ? '两分量包络速度' : '窄带群速度')}</span>
        </div>
      </div>
      <div className="surface-scale">
        h {s.depth.toFixed(2)} m · λ {s.wavelength.toFixed(1)} m
        {!shot.group && (
          <>
            {' '}
            · {t('轨道半轴')} {(q.a * 1000).toFixed(0)} / {(q.b * 1000).toFixed(0)} mm
          </>
        )}
      </div>
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('小振幅轨道与真实水面波的边界')}</summary>
          <p>
            {t(
              '水平均匀、无流、无黏、无旋的有限水深重力波；忽略表面张力、破碎与二阶斯托克斯漂移。轨道按平均位置的一阶速度积分，故闭合只是一阶结论。上方波高与下方局部位移分别放大，不能从图上读取水深比例。水深或波长变化是在比较各自均匀水域，不模拟海岸传播和浅化增幅。包络由两条真实色散关系分量叠加，读数使用两分量的有限差分速度；窄带极限才等于导数群速度。运动慢放。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="surface-controls">
          <Range
            label={t('水深')}
            value={depth}
            min={0.6}
            max={6}
            step={0.1}
            unit="m"
            onChange={setDepth}
          />
          <Range
            label={t('水面波长')}
            value={wavelength}
            min={4}
            max={12}
            step={0.2}
            unit="m"
            onChange={setWavelength}
          />
          <Range
            label={t('水面振幅')}
            value={amplitude}
            min={0}
            max={0.06}
            step={0.005}
            unit="m"
            onChange={setAmplitude}
          />
          <Range
            label={t('平均深度占水深')}
            value={probe}
            min={0}
            max={1}
            step={0.05}
            onChange={setProbe}
          />
          <Range
            label={t('模型经过时间')}
            value={elapsed}
            min={0}
            max={3}
            step={0.01}
            unit="s"
            onChange={setElapsed}
          />
          <button type="button" aria-pressed={group} onClick={() => setGroup(!group)}>
            {t(group ? '查看水质点轨道' : '叠加两种波长')}
          </button>
        </div>
      )}
    </section>
  );
}
