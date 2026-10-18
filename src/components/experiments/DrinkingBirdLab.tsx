import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { drinkingBirdHistory, birdMilestones, birdStateAt } from '../../models/drinking-bird-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
export default function DrinkingBirdLab() {
  const film = useShowcase(),
    uid = useId().replace(/:/g, ''),
    [humidity, setHumidity] = useState(0.4),
    [wet, setWet] = useState(true),
    [elapsed, setElapsed] = useState(14);
  const rh = film.watch ? 0.4 : humidity,
    isWet = film.watch ? film.chapter !== 0 : wet;
  const history = useMemo(() => drinkingBirdHistory(100, rh, isWet), [rh, isWet]),
    reference = useMemo(() => drinkingBirdHistory(100), []),
    m = useMemo(() => birdMilestones(reference), [reference]);
  const ranges = [
      [0, 20],
      [0, m.rise],
      [m.rise, m.tilt],
      [m.tilt, m.dip],
      [m.dip, m.reset],
      [m.reset, m.nextDip + 8],
    ],
    range = ranges[Math.min(5, film.chapter)],
    time = film.watch ? range[0] + (range[1] - range[0]) * film.chapterProgress : elapsed,
    state = birdStateAt(history, time),
    angle = state.angle,
    c = Math.cos(angle),
    s = Math.sin(angle),
    bodyX = 175 - 49.5 * s,
    bodyY = 183 + 49.5 * c,
    headX = 175 + 104.5 * s,
    headY = 183 - 104.5 * c,
    surfaceY = bodyY - state.surface * 1100,
    entryX = 175 - 62.7 * s,
    entryY = 183 + 62.7 * c;
  return (
    <div className="textbook-em drinking-bird-lab">
      <div className="textbook-em-state">
        <span>{t('蒸发驱动的饮水鸭')}</span>
        <span>{t(isWet ? '湿润的头部' : '干燥的头部')}</span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 320"
        role="img"
        aria-label={t('湿润头部降温、液柱上升与饮水鸭倾倒复位')}
      >
        <defs>
          <clipPath id={uid + 'body'}>
            <circle cx={bodyX} cy={bodyY} r="23" />
          </clipPath>
        </defs>
        <path
          d="M140 285L175 183L210 285M130 285H220"
          stroke="#a9b79d"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M260 181V270Q295 282 330 270V181"
          fill="#f5f6eb"
          stroke="#b6c2ae"
          strokeWidth="2"
        />
        <path d="M262 198Q295 205 328 198V268Q295 279 262 268Z" fill="#c6ddd3" />
        <ellipse cx="295" cy="198" rx="33" ry="6" fill="#deeee5" stroke="#b5d3c4" />
        <g transform={`translate(175 183) rotate(${(angle * 180) / Math.PI})`}>
          <path d="M-5 62.7V-103M5 62.7V-103" stroke="#93aa9b" strokeWidth="2" />
          <rect
            x="-3"
            y={62.7 - state.column * 1100}
            width="6"
            height={state.column * 1100}
            fill="#b66f66"
          />
          <circle
            cx="0"
            cy="49.5"
            r="24.2"
            fill="#e8ede2"
            fillOpacity=".55"
            stroke="#9cac96"
            strokeWidth="2"
          />
          <path d="M-18 57l-25 12 21-26" fill="#aebd99" stroke="#91a383" />
          <circle
            cx="0"
            cy="-104.5"
            r="19"
            fill={isWet ? '#b3ccca' : '#d1cfac'}
            stroke="#9aac9a"
            strokeWidth="2"
          />
          <circle cx="0" cy="-104.5" r="14.5" fill="#e9efdf" fillOpacity=".7" />
          <path d="M14-109L35-104L14-99Z" fill="#c2a472" stroke="#aa8d60" />
          <circle cx="8" cy="-110" r="2.7" fill="#647967" />
          <path
            d="M-20-121H17M-12-122V-135H11V-122"
            fill="#7f9679"
            stroke="#7f9679"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>
        <rect
          x={bodyX - 24}
          y={surfaceY}
          width="48"
          height="48"
          fill="#c17d71"
          clipPath={`url(#${uid}body)`}
        />
        {state.venting && (
          <path
            d={`M${entryX} ${entryY}L${entryX} ${surfaceY + 3}`}
            stroke="#c17d71"
            strokeWidth="3"
            clipPath={`url(#${uid}body)`}
          />
        )}
        <circle cx={bodyX} cy={bodyY} r="24.2" stroke="#9cac96" strokeWidth="2" fill="none" />
        <circle cx="175" cy="183" r="5" fill="#e9eddd" stroke="#819577" strokeWidth="2" />
        {isWet &&
          rh < 1 &&
          [0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${headX - 10 + i * 9} ${headY - 23}q-4-6 1-12t0-12`}
              stroke="#a8c5bc"
              strokeWidth="1.5"
              fill="none"
              opacity={0.2 + 0.4 * ((time * 0.5 + i * 0.3) % 1)}
            />
          ))}
      </svg>
      <div className="lab-inline-legend">
        <span>{t('密封工作液')}</span>
        <span>{t('外部清水')}</span>
      </div>
      <p className="lab-apparatus-caption">
        {t(
          !isWet || rh === 1
            ? '没有蒸发降温'
            : state.venting
              ? '管口露出，压强均衡'
              : state.column > 0.08
                ? '液体上移，鸭身倾倒'
                : '头部冷却，液柱上升',
        )}
      </p>
      <div className="textbook-em-meters">
        <span>
          {t('头部降温')} <b>{(293.15 - state.headTemperature).toFixed(2)} K</b>
        </span>
        <span>
          Δp <b>{state.pressureDifference.toFixed(0)} Pa</b>
        </span>
        <span>
          {t('液柱长度')} <b>{(state.column * 100).toFixed(1)} cm</b>
        </span>
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <div className="textbook-em-tabs">
            {[true, false].map((w) => (
              <button key={String(w)} onClick={() => setWet(w)} aria-pressed={wet === w}>
                {t(w ? '湿润的头部' : '干燥的头部')}
              </button>
            ))}
          </div>
          <Range
            label={t('环境相对湿度')}
            min={0.2}
            max={1}
            step={0.05}
            value={humidity}
            onChange={setHumidity}
          />
          <Range
            label={t('经过时间')}
            min={0}
            max={90}
            step={0.1}
            value={elapsed}
            onChange={setElapsed}
          />
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('机制模型与能源')}</summary>
        <p>
          {t(
            '外部清水只湿润绒布，不流入密封鸭身。模型连接蒸发冷却、代表性挥发液的蒸气压、液柱、重力矩与管口露出后的排液；参数用来说明机制，不预测某一实物的周期或效率。湿头模式假定外部水分持续补充，热源来自环境；饱和空气或干头不会启动。',
          )}
        </p>
      </details>
    </div>
  );
}
