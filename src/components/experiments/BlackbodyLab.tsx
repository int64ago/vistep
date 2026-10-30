import { useEffect, useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import { Range } from '../lab/Controls';
import {
  blackbodySpectrum,
  blackbodyPeakUM,
  blackbodyShot,
  blackbodyTrial,
  spectrumPath,
  heatPlotScale,
  historyPlotScale,
  textbookSpectrum,
  type BlackbodyState,
} from '../../models/blackbody-lab';
import '../../styles/blackbody-lab.css';
const text = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const warm = '#ac7952',
  classic = '#98718c',
  ink = '#506859',
  pale = '#93aaa1';

export function BlackbodyArtwork({
  state,
  compact = false,
  cover = false,
}: {
  state: BlackbodyState;
  compact?: boolean;
  cover?: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    s = state,
    w = compact ? 280 : 580,
    h = compact
      ? s.chapter === 0
        ? 124
        : s.chapter === 3
          ? 116
          : s.chapter >= 2
            ? 140
            : 164
      : 255;
  const left = compact ? 28 : 45,
    top = 28,
    plotW = w - left - 12,
    plotH = h - top - 30;
  const historic = s.chapter === 0 || s.chapter === 3,
    maxUM = historic ? 8 : 2,
    scale = historic ? historyPlotScale * 1.3 : heatPlotScale * 1.05;
  const px = (um: number) => left + (um / maxUM) * plotW,
    py = (v: number) => top + plotH * (1 - v / scale);
  const probe = blackbodySpectrum(s.probeUM, s.temperature);
  const peak = blackbodyPeakUM(s.temperature),
    overUM = ((2 * 299792458 * 1.380649e-23 * s.temperature * 1e18) / scale) ** 0.25;
  const showPlanck = s.chapter !== 0;
  return (
    <svg
      className="blackbody-plot"
      viewBox={`0 0 ${w} ${h}`}
      role={cover ? undefined : 'img'}
      aria-hidden={cover || undefined}
      aria-label={text(
        '共同刻度的波长谱；空心点为教材图示读数，实线与虚线为理论计算',
        'Wavelength spectra on a common scale; open circles are textbook graph readings, lines are theoretical calculations',
      )}
    >
      <defs>
        <clipPath id={`${id}-plot`}>
          <rect x={left} y={top} width={plotW} height={plotH} />
        </clipPath>
        <linearGradient id={`${id}-visible`}>
          <stop stopColor="#a4a1bb" />
          <stop offset=".45" stopColor="#9fb6a1" />
          <stop offset="1" stopColor="#c7a77f" />
        </linearGradient>
      </defs>
      {!historic && (
        <rect
          x={px(0.38)}
          y={top}
          width={px(0.75) - px(0.38)}
          height={plotH}
          fill={`url(#${id}-visible)`}
          opacity=".13"
        />
      )}
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <path
            d={`M${left} ${top + plotH * (1 - (historic ? f / 1.3 : f))}H${w - 12}`}
            stroke="#c4cec1"
            strokeWidth="1"
            opacity=".45"
          />
          {historic && (
            <text x={left - 5} y={top + plotH * (1 - f / 1.3) + 5} textAnchor="end">
              {f}
            </text>
          )}
        </g>
      ))}
      <path
        d={`M${left} ${top}V${top + plotH}H${w - 10}`}
        fill="none"
        stroke="#94a695"
        strokeWidth="1.3"
      />
      {(historic ? [2, 4, 6, 8] : [0.5, 1, 1.5, 2]).map((um) => (
        <text key={um} x={px(um)} y={h - 6} textAnchor={um === maxUM ? 'end' : 'middle'}>
          {um === maxUM ? `${um} µm` : um}
        </text>
      ))}
      <text x={left} y="21">
        {historic
          ? text('相对强度', 'Relative intensity')
          : text('谱辐亮度 · 同一纵轴', 'Radiance · one scale')}
      </text>
      <g clipPath={`url(#${id}-plot)`}>
        {s.reference &&
          [3000, 5000].map((t) => (
            <path
              key={t}
              d={spectrumPath(t, false, maxUM, scale, plotW, plotH, left, top)}
              fill="none"
              stroke={pale}
              strokeWidth="2"
              opacity=".85"
            />
          ))}
        {s.classical && (
          <path
            data-curve="rayleigh-jeans"
            d={spectrumPath(s.temperature, true, maxUM, scale, plotW, plotH, left, top)}
            fill="none"
            stroke={classic}
            strokeWidth="2.7"
            strokeDasharray="7 5"
          />
        )}
        {showPlanck && (
          <path
            data-curve="planck"
            d={spectrumPath(s.temperature, false, maxUM, scale, plotW, plotH, left, top)}
            fill="none"
            stroke={warm}
            strokeWidth="3"
          />
        )}
        {s.history &&
          textbookSpectrum.map((v, i) => (
            <circle
              key={i}
              data-observation={i}
              cx={px(v.wavelengthUM)}
              cy={top + plotH * (1 - v.relative / 1.3)}
              r={compact ? 2.8 : 4}
              fill="#f7f8f0"
              stroke={ink}
              strokeWidth="1.5"
              opacity={s.chapter !== 0 || v.wavelengthUM >= s.probeUM ? 1 : 0.55}
            />
          ))}
        {s.chapter === 2 &&
          [3000, 5000, 6000].map((t) => (
            <path
              key={t}
              d={`M${px(blackbodyPeakUM(t))} ${py(blackbodySpectrum(blackbodyPeakUM(t), t).planck)}V${top + plotH}`}
              stroke={t === 6000 ? warm : pale}
              strokeDasharray="3 4"
            />
          ))}
        {s.chapter === 3 && s.quantum && (
          <g>
            <path
              d={`M${px(s.probeUM)} ${top}V${top + plotH}`}
              stroke="#adbea8"
              strokeDasharray="3 4"
            />
            <circle cx={px(s.probeUM)} cy={py(probe.planck)} r="4" fill={warm} />
          </g>
        )}
      </g>
      {s.classical && overUM < maxUM && (
        <g data-overflow="classical">
          <path
            d={`M${px(overUM)} ${top + 22}V${top + 2}m-4 6 4-6 4 6`}
            fill="none"
            stroke={classic}
            strokeWidth="2.4"
          />
          <text x={px(overUM) + 8} y={top + 16} fill={classic}>
            {text('继续升高', 'keeps rising')}
          </text>
        </g>
      )}
      {s.chapter === 2 && (
        <text
          x={px(peak) + 7}
          y={Math.max(top + 22, py(blackbodySpectrum(peak, s.temperature).planck) - 8)}
          fill={warm}
        >
          {Math.round(peak * 1000)} nm
        </text>
      )}
    </svg>
  );
}
function Cavity({ scan }: { scan: number }) {
  return (
    <svg className="blackbody-cavity" viewBox="0 0 280 78" aria-hidden="true">
      <defs>
        <radialGradient id="blackbody-cavity-glow">
          <stop stopColor="#efc690" />
          <stop offset=".65" stopColor="#b68d6d" />
          <stop offset="1" stopColor="#7e7161" />
        </radialGradient>
      </defs>
      <path d="M27 14H103Q120 14 120 39T103 64H27Q9 64 9 39T27 14" fill="#b5b5a0" />
      <path
        d="M31 20H100Q114 20 114 39T100 58H31Q17 58 17 39T31 20"
        fill="url(#blackbody-cavity-glow)"
      />
      <path
        d="M26 24L95 55 36 54 106 26 65 48 117 39"
        stroke="#f4d8a5"
        strokeWidth="1.3"
        fill="none"
        opacity=".7"
      />
      <path d="M115 33V45" stroke="#524c43" strokeWidth="5" />
      <path d="M118 35L160 29V49L118 43" fill="#c4ab72" opacity=".25" />
      <path d="M160 17L180 57H143Z" fill="#d5e0cf" stroke="#a4b7a2" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M173 37L238 ${15 + i * 12}`}
          stroke={['#9691b0', '#829ea6', '#92ac8e', '#bcad73', '#c28b6b'][i]}
          strokeWidth="1.5"
          opacity=".7"
        />
      ))}
      <rect x="241" y="9" width="12" height="60" rx="5" fill="#b5c5b0" />
      <circle cx="247" cy={15 + scan * 48} r="6" fill="#8d765a" stroke="#f6f6eb" strokeWidth="2" />
    </svg>
  );
}
export default function BlackbodyLab() {
  const f = useShowcase(),
    compact = useCompact(),
    authored = blackbodyShot(f.chapter, f.chapterProgress, f.chapterTime, browserLocale());
  const [manual, setManual] = useState<BlackbodyState | null>(null),
    s = f.watch ? authored : (manual ?? authored);
  useEffect(() => {
    if (!f.watch) setManual((previous) => previous ?? authored);
  }, [f.watch, authored]);
  const set = (patch: Partial<BlackbodyState>) => setManual(blackbodyTrial(s, patch));
  const probe = blackbodySpectrum(s.probeUM, s.temperature),
    history = s.chapter === 0 || s.chapter === 3;
  return (
    <div
      className="blackbody-lab"
      data-watch={f.watch}
      data-state={JSON.stringify(s)}
      data-ratio={probe.suppression}
      data-quantum={s.quantum}
    >
      <div className="blackbody-heading">
        <span>
          {history
            ? text('历史观测与理论', 'Observation & theory')
            : text('理论温度对照', 'Temperature prediction')}
        </span>
        <strong>{Math.round(s.temperature)} K</strong>
      </div>
      {s.chapter === 0 && <Cavity scan={(s.probeUM - 0.65) / 5.35} />}
      <div className="blackbody-legend">
        {s.history && (
          <span className="bb-observed">
            {compact
              ? text('○ 教材图', '○ Textbook')
              : text('○ 教材图读数', '○ Textbook graph readings')}
          </span>
        )}
        {s.classical && (
          <span className="bb-classical">
            {compact ? '┄ RJ' : text('┄ 瑞利–金斯预测', '┄ Rayleigh–Jeans prediction')}
          </span>
        )}
        {s.chapter !== 0 && (
          <span className="bb-planck">
            {compact ? '━ Planck' : text('━ 普朗克预测', '━ Planck prediction')}
          </span>
        )}
        {s.reference && <span>{text('参照：3000 / 5000 K', 'Reference: 3000 / 5000 K')}</span>}
      </div>
      <BlackbodyArtwork state={s} compact={compact} />
      {s.chapter === 0 && !compact && (
        <p className="blackbody-evidence">
          {text('教材图 4.1-3 · 趋势读数', 'Textbook Fig 4.1-3 · trend readings')}
        </p>
      )}
      {s.chapter === 1 && (
        <p className="blackbody-evidence">
          λmax = {Math.round(blackbodyPeakUM(s.temperature) * 1000)} nm
        </p>
      )}
      {s.chapter === 2 && (
        <div className="blackbody-wien">
          <span>3000 K → 966 nm</span>
          <span>
            {Math.round(s.temperature)} K → {Math.round(blackbodyPeakUM(s.temperature) * 1000)} nm
          </span>
          <strong>
            {s.temperature === 6000
              ? text('温度 ×2，峰值波长 ÷2', 'Double T → halve peak λ')
              : 'λmax T ≈ 2898 µm·K'}
          </strong>
        </div>
      )}
      {s.chapter === 3 && (
        <div className="blackbody-causal">
          {s.quantum ? (
            <div className="blackbody-quantum">
              <div className="blackbody-energy">
                <span>ΔE = hc/λ</span>
                <span>{text('热尺度 kT', 'Thermal scale kT')}</span>
                <i style={{ width: `${Math.min(100, (probe.x / 30) * 100)}%` }} />
                <i style={{ width: `${100 / 30}%` }} />
              </div>
              <div
                className="blackbody-steps"
                aria-label={text(
                  '能级间隔示意，步距与量子能量成比例',
                  'Energy-level schematic, spacing proportional to quantum energy',
                )}
              >
                <span>0</span>
                {[1, 2, 3].map(
                  (n) =>
                    n * probe.x <= 30 && (
                      <i key={n} style={{ left: `${((n * probe.x) / 30) * 100}%` }}>
                        <em>{probe.x >= 3 || n === 3 ? (n === 1 ? 'ε' : `${n}ε`) : ''}</em>
                      </i>
                    ),
                )}
                <b>
                  ε = {probe.x.toFixed(1)} kT{probe.x > 30 ? ' →' : ''}
                </b>
              </div>
              <p>
                {s.probeUM.toFixed(1)} µm · {text('平均能量', 'Mean energy')} ={' '}
                {probe.suppression < 0.0001 ? '<0.01' : (probe.suppression * 100).toFixed(1)}% kT
              </p>
            </div>
          ) : (
            <p className="blackbody-evidence">
              {text(
                '短波端：实测下降，古典预测上升',
                'Short waves: observation falls, classical prediction rises',
              )}
            </p>
          )}
        </div>
      )}
      {!f.watch && (
        <div className="blackbody-controls">
          <div className="blackbody-actions" role="group" aria-label={text('观察视图', 'View')}>
            {[
              text('历史对照', 'Historical comparison'),
              text('温度预测', 'Temperature prediction'),
            ].map((label, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={history === (i === 0)}
                onClick={() =>
                  set({
                    chapter: i === 0 ? 3 : 2,
                    temperature: i === 0 ? 1600 : 6000,
                    history: i === 0,
                    reference: i !== 0,
                    classical: i === 0,
                    quantum: i === 0,
                    reveal: 1,
                    probeUM: 1,
                  })
                }
              >
                {label}
              </button>
            ))}
          </div>
          {!history && (
            <Range
              label={text('黑体温度', 'Blackbody temperature')}
              min={1600}
              max={6500}
              step={1}
              value={s.temperature}
              unit="K"
              onChange={(temperature) => set({ temperature })}
            />
          )}
          {s.chapter === 3 && s.quantum && (
            <Range
              label={text('探测波长', 'Probe wavelength')}
              min={0.2}
              max={8}
              step={0.01}
              value={s.probeUM}
              unit="µm"
              onChange={(probeUM) => set({ probeUM })}
            />
          )}
          <button
            className="blackbody-toggle"
            type="button"
            aria-pressed={s.classical}
            onClick={() => set({ classical: !s.classical })}
          >
            {text('古典预测对照', 'Compare classical prediction')}
          </button>
          <p>
            {text(
              '历史对照固定1600 K。切换温度预测可调温，曲线由理论计算。',
              'The historical comparison stays at 1600 K. Choose temperature prediction to vary the temperature. Curves are theoretical.',
            )}
          </p>
          <details>
            <summary>{text('读图与近似', 'Reading the model')}</summary>
            <p>
              {text(
                '教材图的空心点按图示近似读出，没有原始数据与误差表。历史图用共同相对刻度：两条理论都除以1600 K普朗克峰值，不分别归一化。此比较说明趋势，不作精密拟合。',
                'Open circles are approximate readings from the textbook illustration, without raw records or uncertainties. Both predictions share one relative scale, divided by the 1600 K Planck peak. This compares trends, not a precision fit.',
              )}
            </p>
            <p>
              {text(
                '能级和能量条共用kT为单位；kT是热能尺度，不是固定能量预算。短波激发概率降低但不突然归零。',
                'Levels and bars share kT units. kT is a thermal scale, not a fixed energy budget. Short-wave excitation becomes unlikely, without a sharp cutoff.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
