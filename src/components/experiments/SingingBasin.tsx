import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  basinAntinodes,
  basinDroplets,
  basinModeValue,
  basinRimPath,
  basinState,
  type BasinMode,
} from '../../models/singing-basin';
import '../../styles/singing-basin.css';

export default function SingingBasin() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [mode, setMode] = useState<BasinMode>(2),
    [strength, setStrength] = useState(1),
    [fill, setFill] = useState(0.5),
    [time, setTime] = useState(8),
    [release, setRelease] = useState(false),
    stage = Math.min(4, film.chapter),
    p = film.chapterProgress,
    currentMode: BasinMode = film.watch ? (stage >= 3 ? 3 : 2) : mode,
    currentTime = film.watch
      ? stage === 0
        ? 0
        : stage === 1
          ? p * 7
          : stage === 4
            ? 8 + p * 7
            : 8 + p * 2
      : time,
    input = {
      mode: currentMode,
      strength: film.watch ? (stage === 0 ? 0 : 1) : strength,
      fill: film.watch ? 0.5 : fill,
      stopAt: (film.watch ? stage === 4 : release) ? 8 : undefined,
    },
    state = basinState(currentTime, input),
    droplets = basinDroplets(currentTime, input),
    radius = 100 * (0.85 + 0.15 * input.fill),
    waterY = 152 + (1 - input.fill) * 20,
    handTravel = state.rubbing ? Math.sin(currentTime * 2.1) * 8 : 0,
    showMode = film.watch ? stage === 2 || stage === 3 : true,
    points = basinAntinodes(currentMode),
    rim = basinRimPath(currentMode, state.amplitude, state.visualPhase),
    status = !state.rubbing
      ? '摩擦供能停止'
      : state.inputPower > state.lossPower * 1.01
        ? '供能超过耗散'
        : state.inputPower < state.lossPower * 0.99
          ? '供能不足以抵消耗散'
          : '供能与耗散平衡';
  return (
    <div className="singing-basin">
      <div className="basin-heading">
        <span>{t('铜盆 · 盆耳 · 清水')}</span>
        <span>{t('振动放慢并放大')}</span>
      </div>
      <svg
        className="basin-apparatus"
        viewBox="0 65 360 205"
        role="img"
        aria-label={t('手掌摩擦两侧盆耳，铜盆模态振动在水面四处或六处形成强烈响应')}
      >
        <defs>
          <linearGradient id={id + 'bronze'} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ddd0a3" />
            <stop offset=".4" stopColor="#ad9866" />
            <stop offset=".7" stopColor="#c6b583" />
            <stop offset="1" stopColor="#817953" />
          </linearGradient>
          <linearGradient id={id + 'water'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d8e2cd" />
            <stop offset="1" stopColor="#b5cdc0" />
          </linearGradient>
          <radialGradient id={id + 'shadow'}>
            <stop stopColor="#899477" stopOpacity=".14" />
            <stop offset="1" stopColor="#899477" stopOpacity="0" />
          </radialGradient>
          <clipPath id={id + 'surface'}>
            <ellipse cx="180" cy={waterY} rx={radius} ry={radius * 0.48} />
          </clipPath>
        </defs>
        <ellipse cx="180" cy="252" rx="141" ry="23" fill={`url(#${id}shadow)`} />
        <path
          d="M56 144Q61 220 110 239Q180 265 250 239Q299 220 304 144Z"
          fill={`url(#${id}bronze)`}
          stroke="#978a61"
          strokeWidth="1.5"
        />
        <path
          d="M70 179Q83 217 116 230Q180 250 244 230Q277 217 290 179"
          stroke="#e1d2a5"
          fill="none"
          opacity=".55"
        />
        <path
          d="M119 236Q180 253 241 236"
          stroke="#92815a"
          strokeWidth="3"
          fill="none"
          opacity=".45"
        />
        <path d={rim} fill="#baaa7b" stroke="#8d825c" strokeWidth="2" />
        <ellipse
          cx="180"
          cy="146"
          rx="114"
          ry="54"
          fill="#b7ad81"
          stroke="#d9cea5"
          strokeWidth="2"
        />
        <ellipse
          cx="180"
          cy={waterY}
          rx={radius}
          ry={radius * 0.48}
          fill={input.fill > 0 ? `url(#${id}water)` : '#baae7f'}
          stroke={input.fill > 0 ? '#94b1a1' : '#a0946b'}
          strokeWidth="1"
        />
        {input.fill > 0 && (
          <g clipPath={`url(#${id}surface)`}>
            {[0.28, 0.5, 0.72, 0.94].map((r) => (
              <ellipse
                key={r}
                cx="180"
                cy={waterY}
                rx={radius * r}
                ry={radius * r * 0.48}
                fill="none"
                stroke="#ecf1df"
                strokeWidth="1"
                opacity=".4"
              />
            ))}
            {showMode &&
              Array.from({ length: currentMode }, (_, i) => {
                const theta = ((i + 1) * Math.PI) / currentMode;
                return (
                  <path
                    key={i}
                    d={`M${180 - radius * Math.cos(theta)} ${waterY - radius * 0.48 * Math.sin(theta)}L${180 + radius * Math.cos(theta)} ${waterY + radius * 0.48 * Math.sin(theta)}`}
                    stroke="#6f9786"
                    strokeDasharray="3 5"
                    opacity=".5"
                  />
                );
              })}
            {points.map((point) => {
              const x = 180 + 0.77 * radius * Math.cos(point.theta),
                y = waterY + 0.77 * radius * 0.48 * Math.sin(point.theta),
                sign = basinModeValue(point.theta, currentMode) * Math.cos(state.visualPhase);
              return (
                <g key={point.index}>
                  <ellipse
                    cx={x}
                    cy={y}
                    rx={9 + 7 * state.amplitude}
                    ry={4 + 3 * state.amplitude}
                    fill={sign > 0 ? '#f0e2ae' : '#82a99b'}
                    opacity={state.amplitude * 0.45}
                  />
                  {[0, 1, 2].map((k) => (
                    <ellipse
                      key={k}
                      cx={x}
                      cy={y}
                      rx={4 + ((currentTime * 8 + k * 5) % 17)}
                      ry={(4 + ((currentTime * 8 + k * 5) % 17)) * 0.48}
                      fill="none"
                      stroke="#f7f7dc"
                      strokeWidth="1.3"
                      opacity={state.amplitude * 0.7 * (1 - ((currentTime * 8 + k * 5) % 17) / 22)}
                    />
                  ))}
                  {showMode && <circle cx={x} cy={y} r="2.8" fill="#a38b53" opacity=".8" />}
                </g>
              );
            })}
          </g>
        )}
        {droplets.map((drop) => (
          <circle
            key={drop.id}
            cx={180 + 0.77 * radius * Math.cos(drop.theta)}
            cy={waterY + 0.77 * radius * 0.48 * Math.sin(drop.theta) - drop.height * 600}
            r={1.6 - drop.age}
            fill="#82ab9d"
            stroke="#dbe9d6"
            strokeWidth=".5"
          />
        ))}
        <path d={rim} fill="none" stroke="#e0d3a6" strokeWidth="3" />
        {[false, true].map((right) => (
          <g key={String(right)} transform={right ? 'translate(360 0) scale(-1 1)' : undefined}>
            <path
              d="M62 133H34Q17 133 17 148Q17 163 34 163H61"
              stroke="#887b51"
              strokeWidth="11"
              fill="none"
            />
            <path
              d="M62 131H34Q20 131 20 146Q20 159 34 159H61"
              stroke="#c6b47c"
              strokeWidth="7"
              fill="none"
            />
            <g transform={`translate(0 ${handTravel})`}>
              <path
                d="M2 83Q12 86 24 100L38 124Q43 137 34 140Q26 142 21 131L13 115L0 108Z"
                fill="#e0c8a5"
                stroke="#b79d78"
                strokeWidth="1.3"
              />
              <path d="M19 114L31 133M24 111L37 130" stroke="#c2a984" strokeWidth="1" fill="none" />
              <path d="M2 83L0 107" stroke="#ebe2cb" strokeWidth="7" />
            </g>
          </g>
        ))}
        <path
          d="M99 211Q180 239 261 211"
          stroke="#827b55"
          strokeWidth="1"
          opacity=".4"
          fill="none"
        />
      </svg>
      <div className="basin-observation">
        <span>{t(showMode ? (currentMode === 2 ? '四处振动腹' : '六处振动腹') : status)}</span>
        <span>
          {t(input.fill === 0 ? '盆中无水' : state.spraySites ? '水花出现' : '水花尚未形成')}
        </span>
      </div>
      <div className="basin-energy" aria-label={t('相对振动能量')}>
        <span>{t('振动能量')}</span>
        <div
          role="meter"
          aria-label={t('相对振动能量')}
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={state.energy}
        >
          <i style={{ width: `${state.energy * 100}%` }} />
        </div>
        <span>{t('相对值')}</span>
      </div>
      <p className="basin-caption">
        {t(
          stage === 0 && film.watch
            ? '还未摩擦盆耳，水面接近平静。'
            : stage === 3 && film.watch
              ? '切换模态，比较水花位置；这不是加快手的往复。'
              : !state.rubbing
                ? '停止供能后，已有振动仍继续衰减。'
                : '摩擦持续供能，水花响应盆与水的耦合振动。',
        )}
      </p>
      {!film.watch && (
        <div className="basin-controls">
          <div className="basin-buttons">
            {([2, 3] as const).map((m) => (
              <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>
                {t(m === 2 ? '四腹模态' : '六腹模态')}
              </button>
            ))}
          </div>
          <div className="basin-buttons">
            {[false, true].map((value) => (
              <button
                key={String(value)}
                aria-pressed={release === value}
                onClick={() => {
                  setRelease(value);
                  setTime(value ? 8 : 0);
                }}
              >
                {t(value ? '摩擦8秒后放开' : '持续摩擦')}
              </button>
            ))}
          </div>
          <Range
            label={t('有效摩擦供能')}
            min={0}
            max={1.5}
            step={0.05}
            value={strength}
            onChange={setStrength}
          />
          <Range label={t('相对水量')} min={0} max={1} step={0.1} value={fill} onChange={setFill} />
          <Range
            label={t('演示经过时间')}
            min={0}
            max={15}
            step={0.05}
            value={time}
            onChange={setTime}
            unit="s"
          />
          <p>
            {t('代表性模态频率')} <strong>{state.frequency.toFixed(0)} Hz</strong>
          </p>
        </div>
      )}
      <details className="basin-note">
        <summary>{t('自激机制与模型范围')}</summary>
        <p>
          {t(
            '摩擦引起的负阻尼可使微小扰动增长，非线性耗散使振幅稳定。这里选择四腹或六腹模态作对照，并未模拟手部弹性如何选模。包络时间、相对能量、100/300赫兹示例和喷水阈值均为教学参数，不预测某个铜盆。虚线是所选盆壁模态的节线投影；水面的实际细波与破碎更复杂。画面放慢并放大盆壁振动，水花只标示强响应区域。',
          )}
        </p>
      </details>
    </div>
  );
}
