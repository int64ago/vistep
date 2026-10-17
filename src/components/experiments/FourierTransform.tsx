import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth, signalPath } from '../lab/SignalFigure';
import {
  dft,
  fourierSamples,
  fourierShot,
  fourierSignal,
  fourierProjection,
  inverseReal,
  FOURIER_DEFAULT,
} from '../../models/fourier-transform';
import '../../styles/signal-studies.css';
export default function FourierTransform() {
  const d = useShowcase(),
    { host, width: w, compact } = useSignalWidth(),
    [manual, setManual] = useState(FOURIER_DEFAULT);
  const shot = fourierShot(d.chapter, d.chapterProgress),
    s = d.watch ? shot.input : manual,
    c = d.watch ? shot.view : 7,
    samples = useMemo(() => fourierSamples(s), [s.third, s.phase, s.frequency]),
    bins = useMemo(() => dft(samples), [samples]);
  const x = (v: number) => 24 + v * (w - 48),
    wave = (v: number, cy: number, scale = 35) => cy - v * scale;
  const terms = [1, 3, 5],
    colors = ['#9bd5e4', '#eda891', '#c6b5ed'],
    nTerms = d.watch ? shot.terms : 3;
  const corr = fourierProjection(samples, shot.k, shot.scan),
    h = c === 4 ? 310 : c === 5 ? 330 : 350;
  return (
    <div className="signal-study fourier-study" ref={host}>
      <div className="signal-head">
        <span>{t(c === 4 ? '与试探频率相乘' : '同一秒的六十四个样本')}</span>
        <strong>
          {c === 4 ? `k = ${shot.k}` : c === 7 ? `${s.frequency.toFixed(2)} Hz` : `${nTerms} / 3`}
        </strong>
      </div>
      {c === 4 && <p className="signal-note">{t('乘积逐点累加')}</p>}
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={t('谐波分解与离散傅里叶频谱')}>
        {c === 4 ? (
          <>
            <path d={`M24 132H${w - 24}`} stroke="#7894a5" opacity=".3" />
            <path
              d={signalPath(
                (v) => fourierSignal(v, s) * Math.sin(2 * Math.PI * shot.k * v),
                x,
                (v) => 132 - v * 45,
                shot.scan,
              )}
              fill="none"
              stroke="#eda891"
              strokeWidth="2.5"
            />
            <path d={`M${x(shot.scan)} 45V210`} stroke="#f2d89c" strokeDasharray="3 5" />
            <rect
              x="24"
              y="274"
              width={Math.max(0, -corr.im) * (w - 48)}
              height="9"
              rx="4.5"
              fill="#f2d89c"
            />
          </>
        ) : c === 5 ? (
          <>
            <circle cx={w / 2} cy="83" r="55" fill="none" stroke="#8ea8ba" strokeOpacity=".22" />
            <path
              d={`M${w / 2 - 65} 83H${w / 2 + 65}M${w / 2} 18V148`}
              stroke="#8ea8ba"
              opacity=".25"
            />
            <path
              d={`M${w / 2} 83L${w / 2 + Math.cos(bins[3].phase) * 55} ${83 - Math.sin(bins[3].phase) * 55}`}
              stroke="#eda891"
              strokeWidth="3"
            />
            <circle
              cx={w / 2 + Math.cos(bins[3].phase) * 55}
              cy={83 - Math.sin(bins[3].phase) * 55}
              r="6"
              fill="#f2d89c"
            />
            <text x={w / 2} y="182" textAnchor="middle">
              {t('三次谐波')} · A={bins[3].amplitude.toFixed(2)}
            </text>
            <text x="24" y="217">
              {t('时间波形')}
            </text>
            <path d={`M24 271H${w - 24}`} stroke="#8ea8ba" opacity=".2" />
            <path
              d={signalPath(
                (v) => fourierSignal(v, { ...s, phase: 0 }),
                x,
                (v) => 271 - v * 24,
              )}
              fill="none"
              stroke="#8ea8ba"
              strokeWidth="1.5"
              opacity=".35"
            />
            <path
              d={signalPath(
                (v) => inverseReal(bins, 64, v),
                x,
                (v) => 271 - v * 24,
              )}
              fill="none"
              stroke="#f2d89c"
              strokeWidth="2.5"
            />
          </>
        ) : (
          <>
            {(c >= 1 && c <= 3 ? [0, 1, 2] : []).map((j) => (
              <g key={j} opacity={j < nTerms ? 1 : 0.15}>
                <path d={`M24 ${42 + j * 57}H${w - 24}`} stroke="#849baa" opacity=".18" />
                <path
                  d={signalPath(
                    (v) => inverseReal([bins[terms[j]]], 64, v),
                    x,
                    (v) => wave(v, 42 + j * 57, 25),
                  )}
                  fill="none"
                  stroke={colors[j]}
                  strokeWidth="2"
                />
                <text x={w - 24} y={31 + j * 57} textAnchor="end">
                  {terms[j]} Hz
                </text>
              </g>
            ))}
            <text x="24" y={c >= 1 && c <= 3 ? 207 : 28}>
              {t(c >= 1 && c <= 3 ? '逐项重建' : '时间波形')}
            </text>
            <path
              d={signalPath(
                (v) => fourierSignal(v, s),
                x,
                (v) => wave(v, c >= 1 && c <= 3 ? 267 : 105, compact ? 33 : 40),
              )}
              fill="none"
              stroke="#8ea8ba"
              strokeWidth="1.5"
              opacity=".45"
            />
            <path
              d={signalPath(
                (v) => inverseReal(bins, 64, v, c >= 6 ? Infinity : terms[nTerms - 1]),
                x,
                (v) => wave(v, c >= 1 && c <= 3 ? 267 : 105, compact ? 33 : 40),
                c === 0 ? shot.scan : 1,
              )}
              fill="none"
              stroke="#f2d89c"
              strokeWidth="2.5"
            />
            {!(c >= 1 && c <= 3) && (
              <>
                <text x="24" y="205">
                  {t('幅度频谱')}
                </text>
                {bins.slice(0, 11).map((b) => (
                  <g key={b.k}>
                    <rect
                      x={24 + (b.k * (w - 48)) / 11}
                      y={310 - b.amplitude * 82}
                      width={Math.max(4, (w - 48) / 11 - 5)}
                      height={Math.max(0.5, b.amplitude * 82)}
                      rx="3"
                      fill={b.k === 3 ? '#eda891' : '#9bd5e4'}
                    />
                    {b.k % 2 === 0 && (
                      <text x={29 + (b.k * (w - 48)) / 11} y="337" textAnchor="middle">
                        {b.k}
                      </text>
                    )}
                  </g>
                ))}
                <text x={w - 24} y="205" textAnchor="end">
                  Hz
                </text>
              </>
            )}
          </>
        )}
      </svg>
      {c === 4 && (
        <div className="signal-head">
          <span>{t('累计正弦投影')}</span>
          <strong>{(-corr.im).toFixed(3)}</strong>
        </div>
      )}
      <div className="signal-legend">
        <span>
          <i style={{ background: '#f2d89c' }} />
          {t(c === 4 ? '相关累加' : '重建结果')}
        </span>
        <span>
          <i />
          {t(c === 5 ? '幅度不变' : '频率分量')}
        </span>
      </div>
      {!d.watch && (
        <div className="signal-explore">
          <Range
            label={t('三次分量幅度')}
            value={s.third}
            min={0}
            max={1}
            step={0.05}
            onChange={(third) => setManual((m) => ({ ...m, third }))}
          />
          <Range
            label={t('三次分量相位')}
            value={(s.phase * 180) / Math.PI}
            min={0}
            max={360}
            unit="°"
            onChange={(phase) => setManual((m) => ({ ...m, phase: (phase * Math.PI) / 180 }))}
          />
          <Range
            label={t('分量频率')}
            value={s.frequency}
            min={2.5}
            max={3.5}
            step={0.05}
            unit="Hz"
            onChange={(frequency) => setManual((m) => ({ ...m, frequency }))}
          />
        </div>
      )}
      <details>
        <summary>{t('这里计算的是 DFT')}</summary>
        <p>
          {t(
            '对一秒内六十四个无噪声样本直接做离散傅里叶变换；未调用快速算法。整数频率恰好落在频点上；非整数频率使用矩形观察窗，因此能量散布到多个频点。旋转相位改变波形，不改变该分量的幅度。',
          )}
        </p>
      </details>
    </div>
  );
}
