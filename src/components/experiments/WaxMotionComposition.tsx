import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase, ease } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { waxMotion, waxRise, type WaxMode } from '../../models/wax-motion-composition';
import '../../styles/wax-motion-composition.css';
export default function WaxMotionComposition() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [mode, setMode] = useState<WaxMode>('uniform'),
    [time, setTime] = useState(3),
    [vx, setVx] = useState(0.12),
    [vy, setVy] = useState(0.1),
    [ax, setAx] = useState(0.08),
    c = film.chapter,
    p = film.chapterProgress,
    trial = film.watch ? (c === 0 ? 'vertical' : c === 3 ? 'accelerated' : 'uniform') : mode,
    setup = film.watch && c === 0,
    physical = film.watch
      ? setup
        ? Math.max(0, (p - 0.28) / 0.72) * 3
        : Math.min(1, p / 0.82) * (c === 3 ? 4 : 5)
      : Math.min(time, trial === 'accelerated' ? 4 : 5),
    s = waxMotion(
      physical,
      trial,
      film.watch ? 0.12 : vx,
      film.watch ? 0.1 : vy,
      film.watch ? 0.08 : ax,
    ),
    rise = setup ? waxRise(physical) : null,
    x = setup ? 195 : 65 + s.x * 260,
    y = 300 - (rise?.y ?? s.y) * 260,
    rotation = setup ? 180 * (1 - ease(Math.min(1, p / 0.24))) : 0,
    points = Array.from({ length: Math.floor(s.time) + 1 }, (_, i) =>
      waxMotion(i, trial, film.watch ? 0.12 : vx, film.watch ? 0.1 : vy, film.watch ? 0.08 : ax),
    );
  const vectorScale = 185;
  return (
    <section className="wax-motion-lab">
      <header>
        <p>
          {t(
            setup
              ? '倒置密封玻璃管，等蜡块上升趋于稳定'
              : trial === 'accelerated'
                ? '横向加速，纵向匀速，合运动变成曲线'
                : '两个方向同时匀速，蜡块沿斜直线移动',
          )}
        </p>
        <span>{t('玻璃管 · 红蜡块 · 黑板坐标')}</span>
      </header>
      <div className="wax-motion-board">
        <svg
          viewBox="0 0 390 355"
          role="img"
          aria-label={t('密封装水玻璃管水平移动，红蜡块竖直上升，背景坐标记录合运动')}
        >
          <defs>
            <linearGradient id={`${id}glass`}>
              <stop stopColor="#f3f4eb" stopOpacity=".7" />
              <stop offset=".25" stopColor="#d9e9dc" stopOpacity=".28" />
              <stop offset=".7" stopColor="#f3f5ea" stopOpacity=".6" />
              <stop offset="1" stopColor="#b2cbb5" stopOpacity=".6" />
            </linearGradient>
          </defs>
          <rect x="15" y="16" width="360" height="322" rx="17" fill="#e0e5d6" fillOpacity=".64" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i}>
              <path
                d={`M65 ${300 - i * 52}H354M${65 + i * 52} 40V300`}
                stroke="#cbd7bf"
                strokeOpacity=".6"
              />
            </g>
          ))}
          <path
            d="M65 35V300H356m-7-4 7 4-7 4M61 42l4-7 4 7"
            fill="none"
            stroke="#9eaf90"
            strokeWidth="1.5"
          />
          {!setup && (
            <>
              <path
                d={Array.from({ length: 70 }, (_, i) =>
                  waxMotion(
                    (s.time * i) / 69,
                    trial,
                    film.watch ? 0.12 : vx,
                    film.watch ? 0.1 : vy,
                    film.watch ? 0.08 : ax,
                  ),
                )
                  .map((q, i) => `${i ? 'L' : 'M'}${65 + q.x * 260} ${300 - q.y * 260}`)
                  .join(' ')}
                stroke="#b79279"
                strokeWidth="2"
                fill="none"
              />
              {points.map((q, i) => (
                <circle key={i} cx={65 + q.x * 260} cy={300 - q.y * 260} r="3" fill="#b69778" />
              ))}
              <path d={`M65 ${y}H${x}V300`} stroke="#b4c5a4" strokeDasharray="4 5" fill="none" />
            </>
          )}
          <g transform={`rotate(${rotation} ${x} 200)`}>
            <path
              d={`M${x - 14} 326V80Q${x - 14} 70 ${x} 70Q${x + 14} 70 ${x + 14} 80V326Z`}
              fill={`url(#${id}glass)`}
              stroke="#9db89e"
              strokeWidth="1.5"
            />
            <path d={`M${x - 9} 84V314`} stroke="#f9f9ef" strokeOpacity=".8" strokeWidth="2" />
            <rect x={x - 16} y="320" width="32" height="9" rx="3" fill="#b5aa88" stroke="#a29878" />
            <ellipse cx={x} cy={y + 5} rx="8" ry="3" fill="#ab806d" />
            <path d={`M${x - 8} ${y - 4}v9q8 5 16 0v-9Z`} fill="#c39a83" />
            <ellipse cx={x} cy={y - 4} rx="8" ry="3" fill="#dbb49a" />
          </g>
          {!setup && (c >= 2 || !film.watch) && (
            <>
              <path
                d={`M${x} ${y}h${s.vx * vectorScale}v${-s.vy * vectorScale}`}
                stroke="#b8a574"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                fill="none"
              />
              <path
                d={`M${x} ${y}l${s.vx * vectorScale} ${-s.vy * vectorScale}`}
                stroke="#7f9b73"
                strokeWidth="2.3"
              />
              <circle
                cx={x + s.vx * vectorScale}
                cy={y - s.vy * vectorScale}
                r="2.8"
                fill="#7f9b73"
              />
            </>
          )}
          <text x="351" y="325" textAnchor="end" fontSize="21" fill="#7f916f">
            x / m
          </text>
          <text x="42" y="42" fontSize="21" fill="#7f916f">
            y
          </text>
          <text x="42" y="322" fontSize="21" fill="#7f916f">
            0
          </text>
        </svg>
      </div>
      <div className="wax-motion-readings">
        <span>
          {t('水平分速度')} <b>{s.vx.toFixed(2)} m/s</b>
        </span>
        <span>
          {t('竖直分速度')} <b>{(rise?.v ?? s.vy).toFixed(2)} m/s</b>
        </span>
        <span>
          {t('模型时间')} <b>{s.time.toFixed(2)} s</b>
        </span>
      </div>
      {!setup && (
        <div className="wax-motion-equation">
          <span>{trial === 'accelerated' ? 'x = ½aₓt²' : 'x = vₓt'}</span>
          <span>y = vᵧt</span>
          <span>v = √(vₓ² + vᵧ²)</span>
        </div>
      )}
      <p className="wax-motion-cause">
        {t(
          setup
            ? '刚开始上升会加速；后面的合成分析从近似匀速阶段开始。'
            : trial === 'accelerated'
              ? '每秒竖直位移相同，水平位移逐次增大，轨迹随之弯曲。'
              : '同一时刻把水平和竖直位移合起来，才是蜡块相对黑板的位置。',
        )}
      </p>
      {!film.watch && (
        <div className="wax-motion-controls">
          <Segments
            label={t('玻璃管的运动')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'vertical', label: t('保持不动') },
              { value: 'uniform', label: t('横向匀速') },
              { value: 'accelerated', label: t('横向加速') },
            ]}
          />
          {mode === 'accelerated' ? (
            <Range
              label={t('水平加速度')}
              value={ax}
              min={0.02}
              max={0.08}
              step={0.01}
              unit="m/s²"
              onChange={setAx}
            />
          ) : (
            <Range
              label={t('水平分速度')}
              value={vx}
              min={0}
              max={0.18}
              step={0.01}
              unit="m/s"
              onChange={setVx}
            />
          )}
          <Range
            label={t('竖直上升速度')}
            value={vy}
            min={0.06}
            max={0.16}
            step={0.01}
            unit="m/s"
            onChange={setVy}
          />
          <Range
            label={t('模型时间')}
            value={Math.min(time, mode === 'accelerated' ? 4 : s.duration)}
            min={0}
            max={mode === 'accelerated' ? 4 : s.duration}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
      <p className="wax-motion-note">
        {t(
          '终端上升速度作为测得的分运动输入；加速移管时按光滑管壁、竖直运动不变的教材理想条件处理。',
        )}
      </p>
    </section>
  );
}
