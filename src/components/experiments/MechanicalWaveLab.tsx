import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import {
  mechanicalDisplacement,
  sourceDisplacement,
  springMaterialPoint,
  springHelix,
  humanWavePose,
  type RopeDrive,
} from '../../models/mechanical-wave-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
export default function MechanicalWaveLab() {
  const film = useShowcase(),
    [mode, setMode] = useState(
      film.variant === 'e1-human-wave' ? 1 : film.variant === 'e1-spring-longitudinal-wave' ? 2 : 0,
    ),
    [drive, setDrive] = useState<RopeDrive>('train'),
    [time, setTime] = useState(4.2),
    [frequency, setFrequency] = useState(0.8),
    stage = film.watch ? film.chapter : mode === 0 ? 2 : mode === 1 ? 4 : 6,
    p = film.chapterProgress,
    kind = stage < 3 ? 0 : stage < 5 ? 1 : 2,
    action = film.watch ? (stage === 0 ? 'up' : stage === 1 ? 'down' : 'train') : drive,
    f = film.watch ? 0.8 : frequency,
    times = [
      [0, 5.4],
      [0, 5.4],
      [0, 7],
      [0, 4],
      [4, 8],
      [0, 5],
      [5, 9],
    ],
    range = times[Math.min(6, stage)],
    clock = film.watch ? range[0] + p * (range[1] - range[0]) : time,
    redY = 160 - 200 * mechanicalDisplacement(4, clock, action, f),
    sourceY = 160 - 200 * sourceDisplacement(clock, action, f),
    spring = useMemo(() => springHelix(clock, f), [clock, f]),
    mark = springMaterialPoint(4, clock, f),
    people = Array.from({ length: 13 }, (_, i) => humanWavePose(i, clock)),
    pulseX = 45 + 35 * 2 * (clock - 0.5 / f),
    crest = 2 * (clock - 1.25 / f),
    crestX = 45 + 35 * crest;
  return (
    <div className="textbook-em mechanical-wave-lab">
      <div className="textbook-em-state">
        <span>
          {t(kind === 0 ? '软绳上的红色标记' : kind === 1 ? '手挽手的人浪' : '光滑平面上的软弹簧')}
        </span>
        <span>{t(kind === 2 ? '纵向振动' : '横向振动')}</span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 45 360 245"
        role="img"
        aria-label={t('跟踪绳、学生和弹簧圈的局部运动与传播状态')}
      >
        <path d="M105 69H260m-7-5 7 5-7 5" fill="none" stroke="#a3b18c" strokeWidth="2" />

        {kind === 0 ? (
          <>
            <path d="M45 160H340M185 113V208" stroke="#cbd6bc" strokeDasharray="4 6" />
            <path
              d={`M${Array.from({ length: 281 }, (_, i) => {
                const x = i / 35;
                return `${45 + i},${160 - 200 * mechanicalDisplacement(x, clock, action, f)}`;
              }).join('L')}`}
              stroke="#af9c71"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M8 ${sourceY - 11}h15l8 6h14v9H29L17 ${sourceY + 15}H8`}
              fill="#d3b995"
              stroke="#b99e7b"
              strokeWidth="2"
            />
            <circle cx="185" cy={redY} r="6" fill="#b4756d" stroke="#f6f2df" strokeWidth="2" />
            {(action === 'train' ? crestX : pulseX) > 45 &&
              (action === 'train' ? crestX : pulseX) < 326 && (
                <circle
                  cx={action === 'train' ? crestX : pulseX}
                  cy={action === 'down' ? 184 : 136}
                  r="9"
                  fill="none"
                  stroke="#8da477"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
              )}
          </>
        ) : kind === 1 ? (
          <>
            <path d="M23 252H338" stroke="#becbac" strokeWidth="2" />
            {people.slice(0, -1).map((a, i) => {
              const b = people[i + 1],
                x = 34 + i * 24,
                y = 173 + a.crouch * 25,
                y2 = 173 + b.crouch * 25;
              return (
                <path
                  key={i}
                  d={`M${x} ${y}L${x + 12} ${(y + y2) / 2 + 5}L${x + 24} ${y2}`}
                  stroke="#b4a580"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}
            {people.map((a, i) => {
              const x = 34 + i * 24,
                head = 141 + a.crouch * 25,
                hip = 199 + a.crouch * 18,
                selected = i === 6;
              return (
                <g key={i}>
                  <circle cx={x} cy={head} r="7" fill="#c8b58e" />
                  <path
                    d={`M${x} ${head + 10}V${hip}`}
                    stroke={selected ? '#b7776f' : '#96aa82'}
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M${x} ${hip}l${-7 - a.crouch * 3} ${22 - a.crouch * 9}L${x - 7} 247M${x} ${hip}l${7 + a.crouch * 3} ${22 - a.crouch * 9}L${x + 7} 247`}
                    fill="none"
                    stroke="#829879"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {selected && (
                    <path d={`M${x - 10} 259H${x + 10}`} stroke="#b7776f" strokeWidth="3" />
                  )}
                </g>
              );
            })}
          </>
        ) : (
          <>
            <path d="M27 185H340" stroke="#c1ccad" strokeWidth="5" strokeLinecap="round" />
            <polyline
              points={spring.map((a) => `${45 + a.x * 35},${154 + a.y * 21}`).join(' ')}
              fill="none"
              stroke="#9da98a"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d={`M9 141H${36 + 35 * sourceDisplacement(clock, 'train', f, 0.2)}l9 8v11h-25l-11 8Z`}
              fill="#d2b994"
              stroke="#b79f7c"
              strokeWidth="2"
            />
            <circle
              cx={45 + mark.position * 35}
              cy="154"
              r="5.5"
              fill="#b67970"
              stroke="#f3f1df"
              strokeWidth="1.5"
            />
            <path d="M145 252H215M180 236V269" stroke="#c3ceb3" strokeWidth="1.5" />
            <path d="M151 242H209m-5-4 5 4-5 4m-49-8-5 4 5 4" stroke="#9daa88" fill="none" />
            <circle cx={180 + mark.displacement * 140} cy="252" r="6" fill="#b67970" />
          </>
        )}
      </svg>
      <p className="lab-apparatus-caption">
        {t(kind === 0 ? '标记没有沿绳移动' : kind === 1 ? '每个人的脚仍在原位' : '标记圈局部放大')}
      </p>
      <div className="textbook-em-meters">
        <span>
          {t('介质标记的位移')}{' '}
          <b>
            {kind === 1
              ? t('原地起蹲')
              : `${(100 * (kind === 0 ? mechanicalDisplacement(4, clock, action, f) : mark.displacement)).toFixed(1)} cm`}
          </b>
        </span>
        <span>
          {t('波形传播')} <b>→</b>
        </span>
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <div className="textbook-em-tabs">
            {['绳波', '人浪', '弹簧纵波'].map((z, i) => (
              <button key={z} aria-pressed={mode === i} onClick={() => setMode(i)}>
                {t(z)}
              </button>
            ))}
          </div>
          {mode === 0 && (
            <div className="textbook-em-tabs">
              {(['up', 'down', 'train'] as const).map((z, i) => (
                <button key={z} aria-pressed={drive === z} onClick={() => setDrive(z)}>
                  {t(['向上抖一次', '向下抖一次', '连续抖动'][i])}
                </button>
              ))}
            </div>
          )}
          <Range
            label={t('观察时间')}
            min={0}
            max={10}
            step={0.01}
            value={time}
            onChange={setTime}
          />
          {mode !== 1 && (
            <Range
              label={t(mode === 0 && drive !== 'train' ? '单次动作时长' : '振源频率')}
              min={mode === 0 && drive !== 'train' ? 1 / 1.2 : 0.4}
              max={mode === 0 && drive !== 'train' ? 2.5 : 1.2}
              step={0.01}
              value={mode === 0 && drive !== 'train' ? 1 / frequency : frequency}
              onChange={(v) => setFrequency(mode === 0 && drive !== 'train' ? 1 / v : v)}
            />
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('传播模型与类比范围')}</summary>
        <p>
          {t(
            '绳和弹簧使用同一振源历史延迟x/v后的行波解，速度示例为2米每秒，只观察边界反射返回前的传播。软绳采用小斜率横波近似，竖直振幅放大；弹簧圈的位置从轴向位移推导，线圈不互相穿越。人浪表现延迟起蹲与固定脚位，是状态传播的类比，并不把人体当作绳的弹性模型。',
          )}
        </p>
      </details>
    </div>
  );
}
