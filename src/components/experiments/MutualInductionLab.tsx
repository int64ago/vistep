import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  mutualShot,
  ringResponse,
  audioResponse,
  type MutualMode,
} from '../../models/mutual-induction-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
const wire = (x: number, y: number, width: number, height: number, turns = 10) =>
  Array.from({ length: turns * 36 + 1 }, (_, i) => {
    const q = i / (turns * 36);
    return `${i ? 'L' : 'M'}${x + width * q + 5 * Math.cos(q * turns * 2 * Math.PI)} ${y + height * Math.sin(q * turns * 2 * Math.PI)}`;
  }).join(' ');
export default function MutualInductionLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, '');
  const [mode, setMode] = useState<MutualMode>(film.variant?.includes('audio') ? 'audio' : 'ring'),
    [action, setAction] = useState('close'),
    [time, setTime] = useState(0.12),
    [insertion, setInsertion] = useState(0.9),
    [phase, setPhase] = useState(0.2),
    [frequency, setFrequency] = useState(440);
  const signalFrequency = film.watch ? 440 : frequency;
  const shot = film.watch
    ? mutualShot(film.chapter, film.chapterProgress)
    : {
        mode,
        action: action as 'close' | 'steady' | 'open',
        time: mode === 'ring' ? time : phase / signalFrequency,
        insertion,
      };
  const state =
    shot.mode === 'ring'
      ? ringResponse(shot.time, shot.action)
      : audioResponse(shot.time, shot.insertion, signalFrequency);
  const emf = state.emf,
    needle = Math.max(-0.85, Math.min(0.85, emf * 0.42));
  const chart = (kind: 'current' | 'emf') =>
    Array.from({ length: 181 }, (_, i) => {
      const q = i / 180;
      const s =
        shot.mode === 'ring'
          ? ringResponse(q * 0.85, shot.action)
          : audioResponse((q * 3) / signalFrequency, shot.insertion, signalFrequency);
      return `${i ? 'L' : 'M'}${30 + q * 300} ${kind === 'current' ? 44 - s.current * (shot.mode === 'ring' ? 19 : 650) : 107 - s.emf * (shot.mode === 'ring' ? 13 : 22)}`;
    }).join(' ');
  return (
    <div className="textbook-em mutual-induction-lab">
      <div className="textbook-em-state">
        <span>{t(shot.mode === 'ring' ? '法拉第铁环' : '套入线圈的音频信号')}</span>
        <span>
          {shot.mode === 'ring'
            ? t(
                shot.action === 'close'
                  ? '接通电源'
                  : shot.action === 'steady'
                    ? '保持直流'
                    : '断开电源',
              )
            : `f = ${signalFrequency} Hz`}
        </span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 285"
        role="img"
        aria-label={t('彼此绝缘的两套电路通过变化的磁通传递信号')}
      >
        <defs>
          <linearGradient id={`${id}-iron`}>
            <stop stopColor="#b9c5b2" />
            <stop offset=".5" stopColor="#e1e6d8" />
            <stop offset="1" stopColor="#9ba88f" />
          </linearGradient>
        </defs>
        {shot.mode === 'ring' ? (
          <>
            <circle
              cx="180"
              cy="111"
              r="63"
              fill="none"
              stroke={`url(#${id}-iron)`}
              strokeWidth="30"
            />
            <circle
              cx="180"
              cy="111"
              r="62"
              fill="none"
              stroke="#8ca486"
              strokeWidth="2"
              strokeDasharray="6 8"
              opacity={0.12 + (0.7 * state.current) / 1.5}
            />
            <path d={wire(101, 108, 28, 45, 9)} fill="none" stroke="#b78f53" strokeWidth="3" />
            <path d={wire(230, 108, 28, 45, 9)} fill="none" stroke="#6f917c" strokeWidth="3" />
            <path
              d="M106 108H45V194M134 108V220H96M45 210V220H64"
              fill="none"
              stroke="#b49662"
              strokeWidth="2"
            />
            <path
              d="M225 108H205V220H263M263 108H316V220H297"
              fill="none"
              stroke="#75947d"
              strokeWidth="2"
            />
            <path d="M35 194H55M39 204H51" stroke="#b49662" strokeWidth="3" />
            <circle cx="64" cy="220" r="3" fill="#a88b55" />
            <circle cx="96" cy="220" r="3" fill="#a88b55" />
            <path
              d={shot.action === 'open' ? 'M64 220L92 203' : 'M64 220H96'}
              stroke="#9a8c62"
              strokeWidth="2.5"
            />
            <circle cx="280" cy="220" r="20" fill="#f6f7ec" stroke="#a9b99e" />
            <path
              d={`M280 231l${Math.sin(needle) * 16} ${-Math.cos(needle) * 27}`}
              stroke="#ac8d57"
              strokeWidth="2"
            />
            <text x="280" y="264" textAnchor="middle">
              G
            </text>
            <text x="180" y="118" textAnchor="middle">
              Φ
            </text>
            <text x="74" y="61" textAnchor="middle">
              I₁
            </text>
            <text x="290" y="61" textAnchor="middle">
              ε₂
            </text>
          </>
        ) : (
          <>
            <rect x="140" y="83" width="140" height="100" rx="26" fill="#e8ecdf" stroke="#bccab0" />
            <path d={wire(144, 133, 130, 46, 13)} fill="none" stroke="#a8bda3" strokeWidth="2.5" />
            <g transform={`translate(${shot.insertion * 88} 0)`}>
              <rect
                x="54"
                y="105"
                width="110"
                height="55"
                rx="13"
                fill="#ede1c8"
                stroke="#cfb587"
              />
              <path d={wire(58, 133, 102, 25, 13)} fill="none" stroke="#b69052" strokeWidth="2.4" />
              <path
                d={`M63 133H${25 - shot.insertion * 88}V220M165 133V230H${55 - shot.insertion * 88}`}
                fill="none"
                stroke="#b49662"
                strokeWidth="2"
              />
            </g>
            <rect x="17" y="212" width="46" height="34" rx="8" fill="#e5e9da" stroke="#b5c3a8" />
            <path d="M24 229q8-17 16 0t16 0" fill="none" stroke="#a58b5b" strokeWidth="2" />
            <path
              d="M149 133H122V264H302V242M279 133H326V220H317"
              stroke="#77947a"
              fill="none"
              strokeWidth="2"
            />
            <path d="M293 213H303L317 202V246L303 235H293Z" fill="#bdcbb2" stroke="#7c9477" />
            <path
              d={`M324 208Q${331 + Math.abs(emf) * 3} 224 324 241`}
              stroke="#8fa57e"
              strokeWidth="2"
              fill="none"
              opacity={Math.min(1, 0.2 + Math.abs(emf))}
            />
            <text x="180" y="53" textAnchor="middle">
              M = {(state.mutual * 1000).toFixed(1)} mH
            </text>
          </>
        )}
      </svg>
      <div className="textbook-em-meters">
        <span>
          I₁ <b>{state.current.toFixed(3)} A</b>
        </span>
        <span>
          ε₂ <b>{emf.toFixed(3)} V</b>
        </span>
      </div>
      <svg
        className="textbook-em-chart"
        viewBox="0 0 360 140"
        role="img"
        aria-label={t('原线圈电流与副线圈电动势的波形')}
      >
        <path d="M30 44H330M30 107H330" stroke="#d5dfca" />
        <path d={chart('current')} fill="none" stroke="#b39156" strokeWidth="2" />
        <path d={chart('emf')} fill="none" stroke="#70947a" strokeWidth="2" />
        <text x="5" y="36">
          I₁
        </text>
        <text x="5" y="99">
          ε₂
        </text>
        <path
          d={`M${30 + (shot.mode === 'ring' ? shot.time / 0.85 : ((shot.time * signalFrequency) % 3) / 3) * 300} 8v120`}
          stroke="#9dab93"
          strokeDasharray="3 4"
        />
      </svg>
      {!film.watch && (
        <div className="textbook-em-controls">
          <Segments
            label={t('选择互感装置')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'ring', label: t('法拉第铁环') },
              { value: 'audio', label: t('套入线圈的音频信号') },
            ]}
          />
          {mode === 'ring' ? (
            <>
              <Segments
                label={t('电源状态')}
                value={action}
                onChange={setAction}
                options={[
                  { value: 'close', label: t('接通电源') },
                  { value: 'steady', label: t('保持直流') },
                  { value: 'open', label: t('断开电源') },
                ]}
              />
              <Range
                label={t('开关动作后的时间')}
                value={time}
                min={0}
                max={0.85}
                step={0.01}
                unit="s"
                onChange={setTime}
              />
            </>
          ) : (
            <>
              <Range
                label={t('线圈套入程度')}
                value={insertion}
                min={0}
                max={1}
                step={0.01}
                onChange={setInsertion}
              />
              <Range
                label={t('信号频率')}
                value={frequency}
                min={100}
                max={1000}
                step={20}
                unit="Hz"
                onChange={setFrequency}
              />
              <Range
                label={t('信号相位')}
                value={phase}
                min={0}
                max={3}
                step={0.01}
                unit="T"
                onChange={setPhase}
              />
            </>
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('互感模型与慢放')}</summary>
        <p>
          {t(
            '副线圈采用高阻测量，忽略它对原线圈的反作用。铁环电流按0.12秒时间常数变化，电动势由同一电流的导数计算。音频波形被慢放，套入程度决定静态耦合系数；比较的是停止移动后的信号，不计移动线圈产生的附加电动势。绕组仅绘代表匝，铁芯不计饱和与磁滞。',
          )}
        </p>
      </details>
    </div>
  );
}
