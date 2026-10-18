import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import {
  soundInterferencePoint,
  soundFlagTargets,
  soundIntensityField,
} from '../../models/sound-interference-lab';
import { useLabTone } from './useLabTone';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
import '../../styles/sound-interference-lab.css';
export default function SoundInterferenceLab() {
  const film = useShowcase(),
    root = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    [frequency, setFrequency] = useState(680),
    [x, setX] = useState(0.125),
    [y, setY] = useState(0),
    [flags, setFlags] = useState(true),
    stage = film.chapter,
    p = film.chapterProgress,
    f = film.watch ? (stage === 3 ? 340 + 510 * p : 680) : frequency,
    receiverX = film.watch ? (stage === 1 ? -1.1 + 2.2 * p : 0.125) : x,
    receiverY = film.watch ? 0 : y,
    state = soundInterferencePoint(receiverX, receiverY, f),
    targetFrequency = film.watch ? 680 : f,
    targets = useMemo(() => soundFlagTargets(targetFrequency), [targetFrequency]),
    field = useMemo(() => soundIntensityField(f), [f]),
    showFlags = film.watch ? stage >= 2 : flags,
    phase = film.watch ? p * 6 * Math.PI : 0,
    tone = useLabTone(root, f, 0.04 * state.amplitude, !film.watch);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(100, 72);
    for (let i = 0; i < field.length; i++) {
      const a = Math.min(1, Math.sqrt(field[i]) * 0.65);
      img.data[i * 4] = 239 - 57 * a;
      img.data[i * 4 + 1] = 242 - 42 * a;
      img.data[i * 4 + 2] = 224 - 62 * a;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [field]);
  const px = (q: number) => 180 + 72 * q,
    py = (q: number) => 170 + 72 * q;
  return (
    <div ref={root} className="textbook-em sound-interference-lab">
      <div className="textbook-em-state">
        <span>{t('同一信号源的两个扬声器')}</span>
        <span>{t('颜色表示相对声强')}</span>
      </div>
      <div className="sound-field-visual">
        <canvas ref={canvas} width="100" height="72" aria-hidden="true" />
        <svg
          viewBox="0 12 360 310"
          role="img"
          aria-label={t('同源双扬声器、移动接收点与学生举起的强弱标旗')}
        >
          <rect
            x="146"
            y="24"
            width="68"
            height="35"
            rx="7"
            fill="#d0dac0"
            stroke="#9caf88"
            strokeWidth="2"
          />
          <text x="180" y="46" textAnchor="middle" className="em-small">
            {f.toFixed(0)} Hz
          </text>
          <path d="M146 41H36V148M214 41H324V148" stroke="#a9b58e" strokeWidth="2" fill="none" />
          {[false, true].map((right) => (
            <g key={String(right)} transform={right ? 'translate(360 0) scale(-1 1)' : ''}>
              <rect
                x="12"
                y="144"
                width="24"
                height="52"
                rx="5"
                fill="#b6c5a2"
                stroke="#91a780"
                strokeWidth="2"
              />
              <path
                d={`M23 159L${36 + Math.sin(phase) * 1.5} 151V189L23 181Z`}
                fill="#dae2c8"
                stroke="#91a780"
                strokeWidth="1.5"
              />
              <path d="M16 198V210H35" stroke="#a6b692" strokeWidth="3" fill="none" />
            </g>
          ))}
          {showFlags &&
            targets.map((a) => {
              const progress = film.watch && stage === 2 ? Math.min(1, p / 0.65) : 1,
                pos = a.x0 + (a.target - a.x0) * progress,
                xx = px(pos),
                yy = py(a.y),
                raised = progress === 1;
              return (
                <g key={a.id}>
                  <circle cx={xx} cy={yy} r="4.5" fill="#a9b995" stroke="#829a77" />
                  <path
                    d={`M${xx - 5} ${yy + 7}q5-4 10 0`}
                    stroke="#829a77"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    d={`M${xx + 6} ${yy + 6}V${yy - (raised ? 18 : 4)}`}
                    stroke="#9c9d7d"
                    strokeWidth="1.5"
                  />
                  {raised && (
                    <path
                      d={`M${xx + 6} ${yy - 18}h10l-3 7h-7Z`}
                      fill={a.group === 'loud' ? '#faf8e7' : '#667a65'}
                      stroke="#8e9c7d"
                    />
                  )}
                </g>
              );
            })}
          <path d="M89 170H271" stroke="#bcc9ad" strokeDasharray="4 5" />
          <g transform={`translate(${px(receiverX)} ${py(receiverY)})`}>
            <circle r="8" fill="#f2e6c1" stroke="#b19563" strokeWidth="2" />
            <path d="M-3-3q6-3 6 3t-4 5" stroke="#a68d62" fill="none" />
          </g>

          <rect x="85" y="307" width="190" height="8" rx="4" fill="#e0e6cf" />
          <rect
            x="85"
            y="307"
            width={190 * Math.min(1, state.intensity / 1.5)}
            height="8"
            rx="4"
            fill="#a8b887"
          />
        </svg>
      </div>
      <p className="lab-apparatus-caption">
        {t(
          showFlags
            ? film.watch && stage === 3
              ? '保留旧旗位，再改变频率'
              : '白旗：强处 · 黑旗：弱处'
            : '沿同一条线移动接收点',
        )}
      </p>
      <div className="textbook-em-meters">
        <span>
          Δr <b>{state.pathDifference.toFixed(3)} m</b>
        </span>
        <span>
          λ <b>{(340 / f).toFixed(3)} m</b>
        </span>
        <span>
          {t('相对声强')} <b>{state.intensity.toFixed(3)}</b>
        </span>
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <Range
            label={t('同源频率')}
            min={340}
            max={1000}
            step={10}
            unit="Hz"
            value={frequency}
            onChange={setFrequency}
          />
          <Range
            label={t('接收点横向位置')}
            min={-1.2}
            max={1.2}
            step={0.005}
            unit="m"
            value={x}
            onChange={setX}
          />
          <Range
            label={t('接收点纵向位置')}
            min={-1}
            max={1}
            step={0.01}
            unit="m"
            value={y}
            onChange={setY}
          />
          <div className="segmented">
            <button aria-pressed={flags} onClick={() => setFlags(!flags)}>
              {t('显示学生的强弱标旗')}
            </button>
            <button aria-pressed={tone.on} onClick={tone.toggle}>
              {t(tone.on ? '停止接收点试听' : '试听接收点的合成声音')}
            </button>
          </div>
          {tone.unavailable && <p>{t('声音不可用，声强图与读数仍可观察。')}</p>}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('相干声源与简化声场')}</summary>
        <p>
          {t(
            '两个理想同相点声源相距4米，声速340米每秒。用传播路程和1/r振幅衰减叠加，不计房间反射与扬声器方向性。相对声强以中点同相增强为1；弱处振幅不完全相等时不会归零。标旗位置来自每位学生附近的实际场值搜索，最后一幕保留原旗位检验频率改变。可选试听只模拟该接收点的合成幅度，不是实际房间的测量。',
          )}
        </p>
      </details>
    </div>
  );
}
