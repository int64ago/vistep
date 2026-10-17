import { useState } from 'react';
import { t } from '../../i18n';
import { beatsDefault, beatsSample, beatsShot, beatsCurve } from '../../models/beats';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range } from '../lab/Controls';
import '../../styles/beats.css';
export default function Beats() {
  const d = useShowcase(),
    { host, width: w } = useSignalWidth();
  const [frequency, setFrequency] = useState(222),
    [time, setTime] = useState(0.25),
    [amplitude, setAmplitude] = useState(1);
  const shot = beatsShot(d.chapter, d.chapterProgress),
    config = d.watch ? shot.config : { ...beatsDefault, f2: frequency, amplitude };
  const now = d.watch ? shot.time : time,
    sample = beatsSample(config, now);
  const wave = beatsCurve(config, now - 0.025, 0.05),
    env = beatsCurve(config, 0, 2.5, 400);
  const path = (key: 'a' | 'b' | 'sum', base: number, scale: number) =>
    wave
      .map(
        (v, i) =>
          `${i ? 'L' : 'M'}${28 + ((w - 56) * i) / (wave.length - 1)} ${base - v[key] * scale}`,
      )
      .join(' ');
  // All four pressure plots use the same 20 CSS-pixels-per-unit scale.
  // Sum: 232..312; envelope: 354..434. Their title baselines (220,342)
  // leave separate text bands even at the maximum possible amplitude of two.
  const envelope = (sign: number) =>
    env
      .map(
        (v, i) =>
          `${i ? 'L' : 'M'}${28 + ((w - 56) * i) / (env.length - 1)} ${394 - sign * v.envelope * 20}`,
      )
      .join(' ');
  const showB = !d.watch || d.chapter > 0,
    showSum = !d.watch || d.chapter > 1;
  return (
    <div ref={host} className="beats-scene">
      <div className="beats-top">
        <span>{t('两个稳定频率，一次缓慢起伏')}</span>
        <b>
          {(config.amplitude === 0 ? 0 : sample.beatFrequency).toFixed(2)} Hz{' '}
          <small>{t('拍频')}</small>
        </b>
      </div>
      <svg
        viewBox={`0 0 ${w} ${showSum ? 450 : showB ? 205 : 112}`}
        role="img"
        aria-label={t('两列声压波形相加产生拍频')}
      >
        <text x="28" y="34" className="beats-a">
          A · {config.f1.toFixed(1)} Hz
        </text>
        <path d={`M28 74H${w - 28}`} className="beats-axis" />
        <path d={path('a', 74, 20)} className="beats-a" />
        {showB && (
          <>
            <text x="28" y="125" className="beats-b">
              B · {config.f2.toFixed(1)} Hz
            </text>
            <path d={`M28 163H${w - 28}`} className="beats-axis" />
            <path d={path('b', 163, 20)} className="beats-b" />
          </>
        )}
        {showSum && (
          <>
            <text x="28" y="220">
              {t('合成声压 · 50 ms')}
            </text>
            <path d={`M28 272H${w - 28}`} className="beats-axis" />
            <path d={path('sum', 272, 20)} className="beats-sum" />
            <path
              d={`M${w / 2} 48V100M${w / 2} 137V189M${w / 2} 226V318`}
              stroke="#b8aca0"
              strokeDasharray="3 5"
            />
            <circle cx={w / 2} cy={272 - sample.sum * 20} r="5" fill="#a77946" />
            <text x="28" y="342">
              {t('慢包络 · 2.5 秒')}
            </text>
            <path d={`M28 394H${w - 28}`} className="beats-axis" />
            <path d={envelope(1)} className="beats-envelope" />
            <path d={envelope(-1)} className="beats-envelope" />
            <path
              d={`M${28 + ((w - 56) * (now % 2.5)) / 2.5} 348V440`}
              stroke="#bd8d52"
              strokeWidth="2"
            />
          </>
        )}
      </svg>
      {showB && (
        <div className="beats-phase">
          <span>{t('两波相位差')}</span>
          <div className="beats-phase-track">
            <i style={{ width: `${((((sample.relative / (2 * Math.PI)) % 1) + 1) % 1) * 100}%` }} />
          </div>
          <b>{(((((sample.relative / (2 * Math.PI)) % 1) + 1) % 1) * 360).toFixed(0)}°</b>
        </div>
      )}
      <details className="beats-model-note">
        <summary>{t('模型边界')}</summary>
        <p className="beats-note">{t('线性叠加；声压归一化。包络不是另一列低频声波。')}</p>
      </details>
      {!d.watch && (
        <div className="beats-controls">
          <Range
            label={t('B 的频率')}
            min={218}
            max={226}
            step={0.1}
            value={frequency}
            unit="Hz"
            onChange={setFrequency}
          />
          <Range
            label={t('B 的相对振幅')}
            min={0}
            max={1}
            step={0.05}
            value={amplitude}
            onChange={setAmplitude}
          />
          <Range
            label={t('观察时刻')}
            min={0}
            max={2.5}
            step={0.001}
            value={time}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
    </div>
  );
}
