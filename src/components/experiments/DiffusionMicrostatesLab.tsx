import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import {
  dyeHistory,
  dyeFrame,
  dyeBins,
  gasPositions,
  fourParticleStates,
  halfBoxProbability,
} from '../../models/diffusion-microstates-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
const colors = ['#af736a', '#6d9b91', '#ba9e5f', '#8c81a1'];
export default function DiffusionMicrostatesLab() {
  const film = useShowcase(),
    uid = useId().replace(/:/g, ''),
    [view, setView] = useState(film.variant === 'e3-gas-microstates' ? 1 : 0),
    [time, setTime] = useState(10),
    [particles, setParticles] = useState(4),
    [left, setLeft] = useState(2),
    stage = film.watch ? film.chapter : view === 0 ? 1 : view === 1 ? 3 : 5,
    p = film.chapterProgress,
    frames = useMemo(() => dyeHistory(), []),
    dyeTime = film.watch ? (stage === 0 ? p * 2 : 2 + p * 43) : time,
    frame = useMemo(() => dyeFrame(frames, dyeTime), [frames, dyeTime]),
    bins = dyeBins(frame),
    gasTime = film.watch ? (stage === 2 ? p * 4 : 4 + p * 15) : time,
    gas = gasPositions(gasTime, stage === 2),
    states = fourParticleStates(),
    n = film.watch ? (stage === 5 ? Math.round(4 + 996 * p) : 4) : particles,
    selected = film.watch ? Math.min(15, Math.floor(p * 16)) : 0,
    macro = film.watch ? 2 : left,
    prob = halfBoxProbability(n);
  return (
    <div className="textbook-em diffusion-microstates-lab">
      <div className="textbook-em-state">
        <span>
          {t(stage < 2 ? '一滴红色颜料' : stage < 4 ? '撤去气体隔板' : '四个粒子的十六种状态')}
        </span>
        <span>{stage >= 4 ? 'P(A⁴) = 1/16' : t('观察粒子，不追随流体')}</span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 320"
        role="img"
        aria-label={t('染料扩散、气体自由扩散与全部十六种左右分布')}
      >
        {stage < 2 ? (
          <>
            <defs>
              <clipPath id={uid + 'water'}>
                <rect x="70" y="89" width="220" height="170" rx="7" />
              </clipPath>
            </defs>
            <path
              d="M66 75V260Q180 284 294 260V75"
              fill="#e4eee7"
              stroke="#a2b8a4"
              strokeWidth="2"
            />
            <ellipse cx="180" cy="87" rx="112" ry="12" fill="#edf3e9" stroke="#b2c6b6" />
            <g clipPath={`url(#${uid}water)`}>
              {bins.map((count, i) => (
                <rect
                  key={i}
                  x={70 + (i % 8) * 27.5}
                  y={89 + (Math.floor(i / 8) * 170) / 6}
                  width="28"
                  height={170 / 6 + 0.5}
                  fill="#b47975"
                  opacity={Math.min(0.6, count / 32) * 0.22}
                />
              ))}
              {Array.from({ length: frame.length / 2 }, (_, i) => (
                <circle
                  key={i}
                  cx={70 + frame[i * 2] * 220}
                  cy={89 + frame[i * 2 + 1] * 170}
                  r={i === 0 ? 3.6 : 1.5}
                  fill={i === 0 ? '#5c7563' : '#b57970'}
                  opacity={i === 0 ? 1 : 0.45}
                />
              ))}
              <circle
                cx={70 + frame[0] * 220}
                cy={89 + frame[1] * 170}
                r="7"
                fill="none"
                stroke="#718d77"
                strokeWidth="1.5"
              />
            </g>
            <path d="M167 25H193L188 59H172Z" fill="#dce5d6" stroke="#9fb498" />
            <path d="M172 59H188L184 73H176Z" fill="#b4766d" />
          </>
        ) : stage < 4 ? (
          <>
            <rect
              x="30"
              y="80"
              width="300"
              height="174"
              rx="12"
              fill="#edf1e4"
              stroke="#9eae8f"
              strokeWidth="2"
            />
            <line
              x1="180"
              y1="81"
              x2="180"
              y2="253"
              stroke="#b7c5a8"
              strokeDasharray={stage === 2 ? undefined : '5 6'}
              strokeWidth={stage === 2 ? 5 : 1}
            />
            {gas.map((a) => (
              <g key={a.id}>
                <circle cx={40 + a.x * 280} cy={91 + a.y * 152} r="9" fill={colors[a.id]} />
                <text
                  x={40 + a.x * 280}
                  y={96 + a.y * 152}
                  textAnchor="middle"
                  fill="#fff"
                  className="em-small"
                >
                  {a.id + 1}
                </text>
              </g>
            ))}
            <text x="105" y="60" textAnchor="middle">
              A
            </text>
            <text x="255" y="60" textAnchor="middle">
              B
            </text>
          </>
        ) : (
          <>
            {states.map((a, i) => {
              const x = 22 + (i % 4) * 81,
                y = 35 + Math.floor(i / 4) * 57,
                active = stage === 4 ? i === selected : a.left === macro;
              return (
                <g
                  key={i}
                  transform={`translate(${x} ${y})`}
                  opacity={stage === 4 && i > selected ? 0.25 : 1}
                >
                  <rect
                    width="73"
                    height="49"
                    rx="6"
                    fill={active ? '#e1ead4' : '#f0f2e6'}
                    stroke={active ? '#8ea179' : '#d2dcc5'}
                    strokeWidth={active ? 2 : 1}
                  />
                  <line x1="18" x2="68" y1="24.5" y2="24.5" stroke="#d0dbc4" />
                  <text x="5" y="19" className="em-small">
                    A
                  </text>
                  <text x="5" y="40" className="em-small">
                    B
                  </text>
                  {a.sides.map((side, j) => (
                    <circle key={j} cx={25 + j * 12} cy={side ? 36 : 14} r="4" fill={colors[j]} />
                  ))}
                </g>
              );
            })}
            <text x="180" y="290" textAnchor="middle">
              {stage === 4
                ? `${selected + 1} / 16`
                : `${macro} A : ${4 - macro} B  →  ${states.filter((a) => a.left === macro).length}/16`}
            </text>
          </>
        )}
      </svg>
      <p className="lab-apparatus-caption">
        {stage < 2
          ? t('分布变均匀，粒子仍在运动')
          : stage < 4
            ? t(stage === 2 ? '隔板封闭，B内无气体' : '撤去隔板，粒子进入B')
            : null}
      </p>
      <div className="textbook-em-meters">
        {stage < 2 ? (
          <>
            <span>
              {t('示踪粒子')} <b>{frame.length / 2}</b>
            </span>
            <span>
              {t('上半杯比例')}{' '}
              <b>
                {(
                  (100 * Array.from(frame).filter((v, i) => i % 2 && v < 0.5).length) /
                  (frame.length / 2)
                ).toFixed(0)}
                %
              </b>
            </span>
          </>
        ) : stage < 4 ? (
          <>
            <span>
              A <b>{gas.filter((a) => a.x < 0.5).length}</b>
            </span>
            <span>
              B <b>{gas.filter((a) => a.x >= 0.5).length}</b>
            </span>
          </>
        ) : (
          <>
            <span>
              N <b>{n}</b>
            </span>
            <span>
              {t('全部在A的概率')} <b>{n === 4 ? '1/16' : `10^(${prob.log10.toFixed(1)})`}</b>
            </span>
          </>
        )}
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <div className="textbook-em-tabs">
            {['红色颜料', '气体隔板', '微观态'].map((z, i) => (
              <button key={z} aria-pressed={view === i} onClick={() => setView(i)}>
                {t(z)}
              </button>
            ))}
          </div>
          {view < 2 ? (
            <Range
              label={t('模拟进度')}
              min={0}
              max={45}
              step={0.05}
              value={time}
              onChange={setTime}
            />
          ) : (
            <>
              <Range
                label={t('A内的粒子数')}
                min={0}
                max={4}
                step={1}
                value={left}
                onChange={setLeft}
              />
              <Range
                label={t('比较总粒子数')}
                min={4}
                max={1000}
                step={1}
                value={particles}
                onChange={setParticles}
              />
            </>
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('放大、时间与等可能假设')}</summary>
        <p>
          {t(
            '染料用放大的示踪点和反射随机游走表现纯扩散，时间加速，不模拟实际水中的对流、溶解速度或分子尺寸。四粒子图只枚举左右归属，省略位置与动量细节；在相等体积、独立粒子和平衡等可能假设下，16种归属各占1/16。宏观复原概率极小，不等于数学上的零。',
          )}
        </p>
      </details>
    </div>
  );
}
