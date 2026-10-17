import { useState } from 'react';
import { t } from '../../i18n';
import {
  standingDefault,
  standingWave,
  standingNodes,
  standingShot,
} from '../../models/standing-wave';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range } from '../lab/Controls';
import '../../styles/standing-wave.css';
export default function StandingWave() {
  const d = useShowcase(),
    { host, width: w } = useSignalWidth();
  const [mode, setMode] = useState(2),
    [tension, setTension] = useState(4),
    [cycles, setCycles] = useState(0.25);
  const shot = standingShot(d.chapter, d.chapterProgress),
    c = d.watch ? shot.config : { ...standingDefault, mode, tension };
  const frequency = standingWave(c, 0, 0).frequency,
    time = d.watch ? shot.time : cycles / frequency;
  const samples = Array.from({ length: 241 }, (_, i) =>
    standingWave(c, (c.length * i) / 240, time),
  );
  const path = (key: 'incident' | 'reflected' | 'displacement', y: number, scale: number) =>
    samples
      .map((s, i) => `${i ? 'L' : 'M'}${28 + ((w - 56) * i) / 240} ${y - s[key] * scale}`)
      .join(' ');
  const nodes = standingNodes(c),
    isFirst = d.watch && d.chapter === 0,
    showParts = !d.watch || d.chapter < 3;
  const kinetic =
      (samples.reduce((a, s) => a + 0.5 * c.density * s.velocity * s.velocity, 0) /
        samples.length) *
      c.length,
    potential =
      (samples.reduce((a, s) => a + 0.5 * c.tension * s.slope * s.slope, 0) / samples.length) *
      c.length;
  return (
    <div ref={host} className="standing-scene">
      <div className="standing-title">
        <span>{t('固定端弦 · 行波的相遇')}</span>
        <b>{frequency.toFixed(1)} Hz</b>
      </div>
      <svg
        viewBox={`0 0 ${w} ${showParts ? 456 : 356}`}
        role="img"
        aria-label={t('反向行波相加形成固定节点')}
      >
        {showParts && (
          <>
            <text x="28" y="35">
              {t('向前的波')}
            </text>
            <path d={path('incident', 78, 470)} className="standing-incident" />
            {!isFirst && (
              <>
                <text x="28" y="127">
                  {t('返回的波')}
                </text>
                <path d={path('reflected', 165, 470)} className="standing-return" />
              </>
            )}
          </>
        )}
        <g transform={`translate(0 ${showParts ? 0 : -100})`}>
          <path d={`M28 292H${w - 28}`} className="standing-axis" />
          {!isFirst && (
            <>
              <rect x="20" y="261" width="8" height="64" rx="4" fill="#c2bca9" />
              <rect x={w - 28} y="261" width="8" height="64" rx="4" fill="#c2bca9" />
              {nodes.map((n, i) => (
                <g key={i}>
                  <circle
                    cx={28 + ((w - 56) * n) / c.length}
                    cy="292"
                    r="9"
                    fill="#f4f0e5"
                    stroke="#8f8a72"
                  />
                  <circle cx={28 + ((w - 56) * n) / c.length} cy="292" r="3" fill="#726e57" />
                </g>
              ))}
            </>
          )}
          <path
            d={path(isFirst ? 'incident' : 'displacement', 292, 850)}
            className="standing-string"
          />
          {!isFirst &&
            Array.from({ length: c.mode }, (_, i) => {
              const at = ((i + 0.5) * c.length) / c.mode,
                s = standingWave(c, at, time);
              return (
                <circle
                  key={i}
                  cx={28 + ((w - 56) * at) / c.length}
                  cy={292 - s.displacement * 850}
                  r="6"
                  fill="#bd9356"
                  stroke="#fff8ed"
                  strokeWidth="2"
                />
              );
            })}

          <rect x="28" y="399" width={w - 56} height="12" rx="6" fill="#e0ddd0" />
          <rect
            x="28"
            y="399"
            width={((w - 56) * kinetic) / (kinetic + potential)}
            height="12"
            rx="6"
            fill="#4d8a91"
          />
          <text x="28" y="437">
            {t('动能')}
          </text>
          <text x={w - 28} y="437" textAnchor="end">
            {t('弹性势能')}
          </text>
        </g>
      </svg>
      <p className="standing-caption">{t('能量在速度与形变之间交换')}</p>
      <p className="standing-caption">{t(isFirst ? '先分开看一个行波' : '同一根弦上的合成位移')}</p>
      <div className="standing-notes">
        <span>{t('节点：固定不动')}</span>
        <span>{t('金点：波腹')}</span>
      </div>
      <details className="standing-model-note">
        <summary>{t('模型边界')}</summary>
        <p>{t('理想小振幅弦，慢放显示；两个分量与合成使用同一相位。')}</p>
      </details>
      {!d.watch && (
        <div className="standing-controls">
          <div className="standing-modes" role="group" aria-label={t('选择谐波阶数')}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} aria-pressed={mode === n} onClick={() => setMode(n)}>
                n = {n}
              </button>
            ))}
          </div>
          <Range
            label={t('弦的张力')}
            min={1}
            max={16}
            step={0.1}
            value={tension}
            unit="N"
            onChange={setTension}
          />
          <Range
            label={t('周期中的位置')}
            min={0}
            max={2}
            step={0.01}
            value={cycles}
            unit="T"
            onChange={setCycles}
          />
        </div>
      )}
    </div>
  );
}
