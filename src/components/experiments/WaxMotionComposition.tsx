import { useId, useState } from 'react';
import { t, browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  waxMotion,
  waxRise,
  waxFilmState,
  type WaxSceneState,
  type WaxMode,
} from '../../models/wax-motion-composition';
import '../../styles/wax-motion-composition.css';
export default function WaxMotionComposition() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    en = browserLocale() === 'en',
    say = (zh: string, english: string) => (en ? english : zh),
    authored = waxFilmState(film.chapter, film.chapterProgress);
  const [manual, setManual] = useState<WaxSceneState | null>(null);
  const state = film.watch ? authored : (manual ?? authored),
    trial = state.mode,
    setup = state.startup,
    physical = Math.min(state.time, trial === 'accelerated' ? 4 : 5),
    s = waxMotion(physical, trial, state.horizontal, state.vertical, state.acceleration),
    rise = setup ? waxRise(s.time, state.vertical) : null,
    x = setup ? 195 : 65 + s.x * 260,
    y = 300 - (rise?.y ?? s.y) * 260,
    rotation = state.rotation,
    points = Array.from({ length: Math.floor(s.time) + 1 }, (_, i) =>
      waxMotion(i, trial, state.horizontal, state.vertical, state.acceleration),
    ),
    set = (patch: Partial<WaxSceneState>) => setManual({ ...state, time: s.time, ...patch });
  const vectorScale = 185;
  return (
    <section
      className="wax-motion-lab"
      data-watch={film.watch}
      data-mode={trial}
      data-time={s.time}
      data-startup={setup}
      data-rotation={rotation}
      data-horizontal={state.horizontal}
      data-vertical={state.vertical}
      data-acceleration={state.acceleration}
    >
      <header>
        <span>
          {say(
            setup
              ? '从启动到稳定'
              : trial === 'accelerated'
                ? '每秒的间隔'
                : state.vectors
                  ? '速度合成'
                  : '一块蜡，两个方向',
            setup
              ? 'From rest to steady rise'
              : trial === 'accelerated'
                ? 'One-second gaps'
                : state.vectors
                  ? 'Vector sum'
                  : 'One float, two directions',
          )}
        </span>
        <strong>t = {s.time.toFixed(2)} s</strong>
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
                    state.horizontal,
                    state.vertical,
                    state.acceleration,
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
          {!setup && (state.vectors || !film.watch) && (
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
          vₓ <b>{s.vx.toFixed(2)} m/s</b>
        </span>
        <span>
          vᵧ <b>{(rise?.v ?? s.vy).toFixed(2)} m/s</b>
        </span>
      </div>
      {!setup && ((state.vectors && trial !== 'accelerated') || !film.watch) && (
        <div className="wax-motion-equation">
          <span>{trial === 'accelerated' ? 'x = ½aₓt²' : 'x = vₓt'}</span>
          <span>y = vᵧt</span>
        </div>
      )}
      {!setup && trial === 'accelerated' && (
        <div
          className="wax-motion-increments"
          aria-label={say(
            '各一秒的水平位移，单位厘米',
            'Horizontal travel per second, in centimetres',
          )}
        >
          <span>Δx / cm</span>
          {[1, 2, 3, 4].map((second) => {
            const previous = waxMotion(
                second - 1,
                trial,
                state.horizontal,
                state.vertical,
                state.acceleration,
              ),
              next = waxMotion(second, trial, state.horizontal, state.vertical, state.acceleration);
            return (
              <b
                key={second}
                data-reached={s.time >= second}
                style={{ opacity: s.time >= second ? 1 : 0.3 }}
              >
                {Math.round((next.x - previous.x) * 100)}
              </b>
            );
          })}
        </div>
      )}
      {!film.watch && (
        <div className="wax-motion-controls">
          <Segments
            label={t('玻璃管的运动')}
            value={setup ? 'startup' : trial}
            onChange={(value) =>
              set({
                mode: value === 'startup' ? 'vertical' : (value as WaxMode),
                startup: value === 'startup',
                rotation: 0,
                vectors: true,
              })
            }
            options={[
              { value: 'startup', label: say('启动上升', 'Starting rise') },
              { value: 'vertical', label: t('保持不动') },
              { value: 'uniform', label: t('横向匀速') },
              { value: 'accelerated', label: t('横向加速') },
            ]}
          />
          {trial === 'accelerated' ? (
            <Range
              label={t('水平加速度')}
              value={state.acceleration}
              min={0.02}
              max={0.08}
              step={0.01}
              unit="m/s²"
              onChange={(acceleration) => set({ acceleration })}
            />
          ) : (
            <Range
              label={t('水平分速度')}
              value={state.horizontal}
              min={0}
              max={0.18}
              step={0.01}
              unit="m/s"
              onChange={(horizontal) => set({ horizontal })}
            />
          )}
          <Range
            label={t('竖直上升速度')}
            value={state.vertical}
            min={0.06}
            max={0.16}
            step={0.01}
            unit="m/s"
            onChange={(vertical) => set({ vertical })}
          />
          <Range
            label={t('模型时间')}
            value={s.time}
            min={0}
            max={trial === 'accelerated' ? 4 : s.duration}
            step={0.01}
            unit="s"
            onChange={(time) => set({ time, rotation: 0 })}
          />
        </div>
      )}
      {!film.watch && (
        <details className="wax-motion-note">
          <summary>{say('模型条件与速度合成', 'Assumptions and vector speed')}</summary>
          <p>v = √(vₓ² + vᵧ²)</p>
          <p>
            {t(
              '终端上升速度作为测得的分运动输入；加速移管时按光滑管壁、竖直运动不变的教材理想条件处理。',
            )}
          </p>
        </details>
      )}
    </section>
  );
}
