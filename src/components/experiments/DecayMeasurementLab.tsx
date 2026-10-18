import { useMemo, useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  RADON_HALF_DAYS,
  decaySample,
  remainingAtoms,
  tracerCompartments,
  carbonDate,
} from '../../models/decay-measurement';
import '../../styles/modern-labs.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
export function DecayArtwork({
  mode = 0,
  value = 0.5,
  seed = 23,
  contamination = 0,
}: {
  mode?: number;
  value?: number;
  seed?: number;
  contamination?: number;
}) {
  const lifetimes = useMemo(() => decaySample(160, seed), [seed]),
    halves = value * 4,
    remain = remainingAtoms(lifetimes, halves),
    tracer = tracerCompartments(value * 20),
    carbon = carbonDate(value * 24000, contamination);
  return (
    <svg
      className="modern-apparatus"
      viewBox="0 0 340 276"
      role="img"
      aria-label={tr('衰变、示踪和测年的不同测量装置', 'Decay, tracer and dating measurements')}
    >
      {mode === 0 && (
        <>
          <rect x="22" y="25" width="142" height="112" rx="15" fill="#edf0e7" stroke="#a6b8a5" />
          {lifetimes.map((t, j) => (
            <circle
              key={j}
              cx={31 + (j % 16) * 8.3}
              cy={37 + Math.floor(j / 16) * 9.5}
              r="2.2"
              fill={t > halves ? '#8ca391' : '#d8ded2'}
            />
          ))}

          <path
            d="M173 80H232"
            fill="none"
            stroke="#9dad9b"
            strokeWidth="2"
            strokeDasharray="3 4"
          />
          <rect x="247" y="23" width="73" height="50" rx="10" fill="#e0e7dc" />
          <text x="263" y="55" fontSize="22" fill="#5c7964">
            {remain}
          </text>
          <text x="283" y="101" textAnchor="middle" fontSize="18" fill="#647c69">
            {tr('模型余量', 'Model N')}
          </text>
          <path d="M35 159V251H311" fill="none" stroke="#aab7a6" />
          <path
            d={Array.from(
              { length: 101 },
              (_, j) => `${j ? 'L' : 'M'}${35 + j * 2.7} ${251 - 90 * 2 ** (-j / 25)}`,
            ).join(' ')}
            fill="none"
            stroke="#a7b397"
            strokeWidth="2"
          />
          {Array.from({ length: 17 }, (_, j) => (
            <circle
              key={j}
              cx={35 + (j * 270) / 16}
              cy={251 - (90 * remainingAtoms(lifetimes, j / 4)) / 160}
              r="2.5"
              fill="#ac8b69"
              opacity={j / 4 <= halves ? 1 : 0.1}
            />
          ))}
          <text x="36" y="275" fontSize="18" fill="#687e6a">
            0
          </text>
          <text x="268" y="275" fontSize="18" fill="#687e6a">
            4T½
          </text>
        </>
      )}
      {mode === 1 && (
        <>
          <path d="M37 184H174L161 260H54Z" fill="#b9ae91" />
          <path d="M40 191H171" stroke="#a19578" strokeWidth="4" />
          <path
            d="M105 205V75M105 112Q65 77 57 104Q66 126 105 119M105 90Q149 50 154 78Q142 101 105 99"
            stroke="#879f7c"
            fill="#b3c1a1"
            strokeWidth="5"
          />
          <path
            d="M105 197L86 225L74 242M105 197L126 228L145 240M105 210V247"
            stroke="#dac6a2"
            fill="none"
            strokeWidth="4"
          />
          {[tracer.soil, tracer.root, tracer.leaf].map((f, j) => (
            <g key={j}>
              <rect x="206" y={49 + j * 62} width="108" height="18" rx="7" fill="#e2e9da" />
              <rect
                x="206"
                y={49 + j * 62}
                width={108 * f}
                height="18"
                rx="7"
                fill={['#b5a580', '#a2b28f', '#779f81'][j]}
              />
              <text x="204" y={39 + j * 62} fontSize="18" fill="#647d65">
                {[tr('土壤', 'Soil'), tr('根', 'Roots'), tr('茎叶', 'Shoots')][j]}{' '}
                {(f * 100).toFixed(0)}%
              </text>
            </g>
          ))}
          {Array.from({ length: 12 }, (_, j) => {
            const y = 246 - value * 165 + j * 10;
            return y > 80 && y < 245 ? (
              <circle key={j} cx={105 + Math.sin(j * 2) * 3} cy={y} r="2" fill="#c5b16d" />
            ) : null;
          })}
          <text x="199" y="250" fontSize="18" fill="#677f65">
            {tr('相对初始活度', 'Relative activity')}
          </text>
        </>
      )}
      {mode === 2 && (
        <>
          <ellipse cx="88" cy="92" rx="62" ry="58" fill="#cbbd9f" />
          {[16, 25, 34, 43, 52].map((r) => (
            <ellipse
              key={r}
              cx="88"
              cy="92"
              rx={r}
              ry={r * 0.9}
              fill="none"
              stroke="#b09c78"
              strokeWidth="1.5"
            />
          ))}
          <path d="M88 92L136 55L143 71Z" fill="#e8e1d0" />
          <path d="M146 95H191" stroke="#b7c2b0" strokeDasharray="5 5" strokeWidth="2" />
          <path
            d="M211 48V133Q211 151 229 151H260Q278 151 278 133V48"
            fill="#e4eade"
            stroke="#9daf99"
          />
          <path d="M216 127H273V138H216Z" fill="#a89c7f" />
          <rect x="195" y="178" width="113" height="20" rx="8" fill="#dde5d5" />
          <rect x="195" y="178" width={113 * carbon.measured} height="20" rx="8" fill="#8aab87" />
          <text x="25" y="202" fontSize="18" fill="#647d65">
            ¹⁴C / ¹²C
          </text>
          <text x="195" y="232" fontSize="22" fill="#647d65">
            {(carbon.measured * 100).toFixed(1)}%
          </text>
          <text x="25" y="265" fontSize="18" fill="#687e6a">
            {tr('归一化同位素比例', 'Normalized isotope ratio')}
          </text>
        </>
      )}
    </svg>
  );
}
const variants = ['e3-radon-half-life', 'e3-phosphorus-tracer', 'e3-radiocarbon-dating'];
export default function DecayMeasurementLab() {
  const film = useShowcase(),
    [modeManual, setMode] = useState(Math.max(0, variants.indexOf(film.variant ?? ''))),
    [manual, setManual] = useState(0.5),
    [seed, setSeed] = useState(23),
    [contamination, setContamination] = useState(0);
  const mode = film.watch ? Math.floor(film.chapter / 2) : modeManual,
    phase = film.chapter % 2,
    p = film.chapterProgress;
  const value = film.watch
    ? mode === 0 && phase === 0
      ? p / 4
      : mode === 2 && phase === 1
        ? 0.5
        : p
    : manual;
  const polluted = film.watch ? (mode === 2 && phase === 1 ? 0.1 * p : 0) : contamination;
  const carbon = carbonDate(value * 24000, polluted),
    tracer = tracerCompartments(value * 20);
  const names = [
    ['氡衰变', 'Radon decay'],
    ['磷示踪', 'Phosphorus tracer'],
    ['碳14测年', 'Carbon dating'],
  ];
  return (
    <div className="modern-lab modern-series">
      {!film.watch && (
        <div className="modern-paths">
          {names.map((n, i) => (
            <button key={i} type="button" aria-pressed={mode === i} onClick={() => setMode(i)}>
              {n[browserLocale() === 'en' ? 1 : 0]}
            </button>
          ))}
        </div>
      )}
      <div className="modern-readout">
        {mode === 0
          ? `t = ${(value * 4 * RADON_HALF_DAYS).toFixed(2)} ${tr('天', 'days')} · N/N₀ ≈ ${(2 ** (-value * 4)).toFixed(3)}`
          : mode === 1
            ? `t = ${(value * 20).toFixed(1)} ${tr('天', 'days')} · ${tr('已吸收比例', 'Uptake fraction')} ${(tracer.uptakeFraction * 100).toFixed(1)}%`
            : `${tr('理想年龄', 'True model age')} ${Math.round(value * 24000)} → ${tr('推断', 'inferred')} ${Math.round(carbon.apparentYears)} ${tr('年', 'years')}`}
      </div>
      <DecayArtwork
        mode={mode}
        value={value}
        seed={film.watch ? 23 : seed}
        contamination={polluted}
      />
      <p className="modern-key">
        {
          [
            tr(
              '单个核何时衰变不可预报，群体比例具有统计规律。',
              'Individual decay times vary; the ensemble follows a statistical law.',
            ),
            tr(
              '示踪信号同时受到迁移和衰变影响。',
              'Tracer signals reflect both transport and radioactive decay.',
            ),
            tr(
              '现代碳污染会把古样品的理想推断年龄拉低。',
              'Modern-carbon contamination lowers the inferred age.',
            ),
          ][mode]
        }
      </p>
      {!film.watch && (
        <div className="modern-explore">
          <Range
            label={tr('经过时间', 'Elapsed time')}
            value={manual}
            min={0}
            max={1}
            step={0.01}
            onChange={setManual}
          />
          {mode === 0 && (
            <div className="modern-paths">
              <button type="button" onClick={() => setSeed(seed + 1)}>
                {tr('换一组模拟原子', 'Sample another ensemble')}
              </button>
            </div>
          )}
          {mode === 2 && (
            <Range
              label={tr('现代碳污染比例', 'Modern-carbon fraction')}
              value={contamination}
              min={0}
              max={0.2}
              step={0.005}
              onChange={setContamination}
            />
          )}
        </div>
      )}
    </div>
  );
}
