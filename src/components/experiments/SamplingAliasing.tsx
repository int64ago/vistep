import { useState } from 'react';
import { t } from '../../i18n';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import { useSignalWidth, signalPath } from '../lab/SignalFigure';
import {
  aliasFrequency,
  samplingPoints,
  samplingShot,
  samplingValue,
  SAMPLING_DEFAULT,
} from '../../models/sampling-aliasing';
import '../../styles/signal-studies.css';
export default function SamplingAliasing() {
  const d = useShowcase(),
    { host, width: w, compact } = useSignalWidth(),
    [manual, setManual] = useState(SAMPLING_DEFAULT);
  const shot = samplingShot(d.chapter, d.chapterProgress),
    s = d.watch ? shot.input : manual,
    c = d.watch ? shot.view : 3;
  const end = compact ? 1 : 2,
    x = (v: number) => 28 + (v / end) * (w - 56),
    y = (v: number) => 139 - v * 50;
  const points = samplingPoints(s, end),
    alias = aliasFrequency(s.frequency, s.sampleRate),
    showAlias = c >= 2,
    fade = c === 3 ? 0.28 : 1;
  return (
    <div ref={host} className="signal-study sampling-study">
      <div className="signal-head">
        <span>
          {t('每秒取样')} · {s.sampleRate.toFixed(1)} Hz
        </span>
        <strong>
          {s.frequency.toFixed(1)} → {Math.abs(alias).toFixed(1)} Hz
        </strong>
      </div>
      <svg viewBox={`0 0 ${w} 280`} role="img" aria-label={t('连续波、采样点与混叠波对照')}>
        {[89, 139, 189].map((v) => (
          <path key={v} d={`M28 ${v}H${w - 28}`} stroke="#829aab" strokeOpacity=".15" />
        ))}
        <text x="28" y="26">
          {t(c === 6 ? '滤波前后 · 保留低频' : '同一组采样点')}
        </text>
        {c === 6 && (
          <path
            d={signalPath(
              (v) => Math.cos(Math.PI * 14 * v) + 0.5 * Math.cos(Math.PI * 2 * v),
              x,
              y,
              end,
            )}
            stroke="#7c8c98"
            strokeWidth="1.5"
            opacity=".35"
            fill="none"
          />
        )}
        <path
          d={signalPath((v) => samplingValue(s, v), x, y, end)}
          stroke="#9bd5e4"
          opacity={fade}
          strokeWidth="2.4"
          fill="none"
        />
        {showAlias && (
          <path
            d={signalPath((v) => samplingValue(s, v, true), x, y, end)}
            stroke="#eda891"
            strokeWidth="2.2"
            strokeDasharray="7 5"
            fill="none"
          />
        )}
        {points
          .filter((p) => p.time <= end * (d.watch ? shot.reveal : 1))
          .map((p) => (
            <g key={p.n}>
              <path d={`M${x(p.time)} 210V${y(p.value)}`} stroke="#f2d89c" strokeOpacity=".2" />
              <circle cx={x(p.time)} cy={y(p.value)} r="4.2" fill="#f2d89c" />
            </g>
          ))}
        <path d={`M28 210H${w - 28}`} stroke="#8ba1b2" strokeOpacity=".4" />
        <text x="28" y="242">
          0
        </text>
        <text x={w - 28} y="242" textAnchor="end">
          {end} s
        </text>
      </svg>
      {c === 5 ? (
        <div className="signal-equation">
          f = fₛ / 2 · {t('相位')} {((s.phase * 180) / Math.PI).toFixed(0)}°
        </div>
      ) : (
        <div className="signal-equation">fₛ / 2 = {(s.sampleRate / 2).toFixed(1)} Hz</div>
      )}
      <div className="signal-legend">
        <span>
          <i />
          {t('真实输入')}
        </span>
        <span>
          <i style={{ background: '#f2d89c' }} />
          {t('实际采样')}
        </span>
        {showAlias && (
          <span>
            <i style={{ background: '#eda891' }} />
            {t('低频解释')}
          </span>
        )}
      </div>
      {!d.watch && (
        <>
          <div className="signal-explore">
            <Range
              label={t('输入频率')}
              value={manual.frequency}
              min={0.5}
              max={10}
              step={0.1}
              unit="Hz"
              onChange={(frequency) => setManual((m) => ({ ...m, frequency }))}
            />
            <Range
              label={t('采样频率')}
              value={manual.sampleRate}
              min={4}
              max={24}
              step={0.5}
              unit="Hz"
              onChange={(sampleRate) => setManual((m) => ({ ...m, sampleRate }))}
            />
            <Range
              label={t('输入相位')}
              value={(manual.phase * 180) / Math.PI}
              min={0}
              max={180}
              unit="°"
              onChange={(phase) => setManual((m) => ({ ...m, phase: (phase * Math.PI) / 180 }))}
            />
          </div>
          <div className="signal-buttons">
            <button onClick={() => setManual(SAMPLING_DEFAULT)}>{t('恢复混叠例子')}</button>
            <button
              onClick={() =>
                setManual((m) => ({ ...m, frequency: 6, sampleRate: 12, phase: Math.PI / 2 }))
              }
            >
              {t('观察边界相位')}
            </button>
          </div>
        </>
      )}
      <details>
        <summary>{t('采样模型与边界')}</summary>
        <p>
          {t(
            '理想瞬时采样；连线用于比较连续函数，采样点之间没有被测量。混叠曲线用带符号的折叠频率计算，保持同一相位。滤波章移除高频分量，只示范理想低通，不模拟真实滤波器过渡带。',
          )}
        </p>
      </details>
    </div>
  );
}
