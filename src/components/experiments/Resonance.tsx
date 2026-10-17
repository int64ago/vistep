import { useState } from 'react';
import { t } from '../../i18n';
import {
  resonanceFrame,
  resonanceShot,
  resonanceAmplitude,
  springPoints,
} from '../../models/resonance';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range } from '../lab/Controls';
import '../../styles/resonance.css';
/** Fixed projection per content width; reserves wall, spring and cart margins at all UI extrema. */
export function resonanceProjection(width: number) {
  const compact = width < 560;
  return {
    rest: compact ? width / 2 + 19 : width / 2,
    scale: compact ? Math.min(33, (width - 118) / 7.2) : 48,
  };
}
export default function Resonance() {
  const d = useShowcase(),
    { host, width: w, compact } = useSignalWidth();
  const [ratio, setRatio] = useState(1),
    [damping, setDamping] = useState(0.08),
    [time, setTime] = useState(8);
  const f = d.watch
    ? resonanceShot(d.chapter, d.chapterProgress)
    : resonanceFrame({ ratio, damping, force: 0.2, initial: 0 }, time);
  const projection = resonanceProjection(w);
  const mid = w / 2,
    x = projection.rest + f.x * projection.scale,
    y = 132,
    plotY = compact ? 288 : 290;
  const curve = (z: number) =>
    Array.from({ length: 181 }, (_, i) => {
      const r = 0.2 + i / 100;
      return `${i ? 'L' : 'M'}${34 + ((w - 68) * i) / 180},${plotY + 90 - Math.min(3.5, resonanceAmplitude(r, z)) * 28}`;
    }).join(' ');
  return (
    <div ref={host} className="resonance-scene">
      <div className="resonance-heading">
        <span>{t('弹簧振子 · 同样的推力')}</span>
        <strong>
          {f.ratio.toFixed(2)} <small>f / f₀</small>
        </strong>
      </div>
      <svg
        viewBox={`0 0 ${w} ${compact ? 420 : 420}`}
        role="img"
        aria-label={t('弹簧振子、驱动力与频率响应')}
      >
        <defs>
          <linearGradient id="res-mass" x2="1" y2="1">
            <stop stopColor="#d5e2dd" />
            <stop offset=".55" stopColor="#f5f9f3" />
            <stop offset="1" stopColor="#9eb6af" />
          </linearGradient>
        </defs>
        <path d={`M26 174H${w - 26}`} stroke="#b7c7bf" strokeWidth="3" />
        <path
          d={`M30 85V174m-7-82 7 7m-7 7 7 7m-7 7 7 7m-7 7 7 7m-7 7 7 7`}
          stroke="#9caeaa"
          strokeWidth="3"
        />
        <path
          d={springPoints(32, x - 30, y)
            .map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`)
            .join(' ')}
          fill="none"
          stroke="#3a756c"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d={`M${projection.rest} 69V180`} stroke="#aebeb8" strokeDasharray="4 5" />
        <rect
          x={x - 30}
          y={y - 28}
          width="60"
          height="62"
          rx="12"
          fill="url(#res-mass)"
          stroke="#7f9e94"
        />
        <circle cx={x - 17} cy="169" r="5" fill="#7b948b" />
        <circle cx={x + 17} cy="169" r="5" fill="#7b948b" />
        <circle cx={x} cy={y} r="4" fill="#2e685d" />
        <path
          d={`M${x} 79h${f.applied * 2.5}`}
          stroke="#c28946"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx={x + f.applied * 2.5} cy="79" r="4" fill="#c28946" />
        <text x={mid} y="40" textAnchor="middle">
          {t('金色：驱动力')}
        </text>
        <text x="28" y="218">
          {t('瞬时输入功率')}
        </text>
        <path
          d={`M${mid} 242H${mid + Math.max(-1, Math.min(1, f.power / 70)) * (w / 2 - 30)}`}
          stroke={f.power >= 0 ? '#d4a657' : '#8c9fa3'}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path d={`M${mid} 229v26`} stroke="#65867c" />
        <path d={`M34 ${plotY + 90}H${w - 34}`} stroke="#acbdb5" />
        <path d={curve(0.08)} fill="none" stroke="#93b6aa" strokeWidth="2" />
        <path d={curve(f.damping)} fill="none" stroke="#337d69" strokeWidth="3" />
        <circle
          cx={34 + ((w - 68) * (f.ratio - 0.2)) / 1.8}
          cy={plotY + 90 - Math.min(3.5, f.amplitude) * 28}
          r="6"
          fill="#c49347"
          stroke="#fff"
          strokeWidth="2"
        />
        <text x="34" y={plotY + 120}>
          0.2 f₀
        </text>
        <text x={w - 34} y={plotY + 120} textAnchor="end">
          2.0 f₀
        </text>
      </svg>
      <p className="resonance-note">
        {t(d.chapter === 4 ? '阻尼增加，峰值降低' : '稳态振幅 · 频率扫描')}
      </p>
      <details className="resonance-model-note">
        <summary>{t('模型边界')}</summary>
        <p className="resonance-note">
          {t('线性弹簧；运动放大显示。扫描图比较各自稳态，不是连续扫频历史。')}
        </p>
      </details>
      {!d.watch && (
        <div className="resonance-controls">
          <Range
            label={t('驱动频率比')}
            min={0.2}
            max={2}
            step={0.01}
            value={ratio}
            onChange={setRatio}
          />
          <Range
            label={t('阻尼比')}
            min={0.03}
            max={0.35}
            step={0.01}
            value={damping}
            onChange={setDamping}
          />
          <Range
            label={t('从静止驱动的时间')}
            min={0}
            max={25}
            step={0.05}
            value={time}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
    </div>
  );
}
