import { useId, useMemo, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  bufferColors,
  bufferMaterials,
  bufferShot,
  bufferState,
  type BufferReagent,
} from '../../models/bio-buffer-comparison';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-buffer-comparison.css';
export default function BioBufferComparison() {
  const film = useShowcase(),
    { host, width: w, compact } = useSignalWidth(),
    id = useId();
  const en = browserLocale() === 'en',
    say = (zh: string, eng: string) => (en ? eng : zh);
  const [drops, setDrops] = useState(10),
    [reagent, setReagent] = useState<BufferReagent>('acid');
  const shot = film.watch ? bufferShot(film.chapter, film.chapterProgress) : { drops, reagent };
  const states = bufferMaterials.map((m) => bufferState(m, shot.drops, shot.reagent));
  const curves = useMemo(
    () =>
      bufferMaterials.map((material) =>
        Array.from({ length: 121 }, (_, n) => bufferState(material, n, shot.reagent).pH),
      ),
    [shot.reagent],
  );
  const names = [say('水', 'Water'), say('磷酸盐', 'Phosphate'), say('生物材料', 'Biological')];
  const plotH = compact ? 140 : 166,
    x = (n: number) => 32 + ((w - 46) * n) / 120,
    y = (pH: number) => plotH - 20 - ((plotH - 40) * pH) / 14;
  return (
    <div ref={host} className="bio-buffer">
      <div className="bio-buffer-top">
        <span>{say('三份新鲜样液 · 相同滴加量', 'Fresh aliquots · equal additions')}</span>
        <b>
          {shot.drops.toFixed(0)} {say('滴', 'drops')}
        </b>
      </div>
      <div className="bio-buffer-samples">
        {states.map((s, i) => (
          <div key={s.material}>
            <svg viewBox="0 0 110 132" aria-hidden="true">
              <defs>
                <linearGradient id={`${id}-${i}`} x2="1">
                  <stop stopColor="#f4fbf7" stopOpacity=".5" />
                  <stop offset=".48" stopColor="#fff" stopOpacity=".85" />
                  <stop offset="1" stopColor="#bfd1c6" stopOpacity=".4" />
                </linearGradient>
              </defs>
              <path d="M44 4h20v8l-6 12v17h-8V24l-6-12Z" fill={bufferColors[i]} opacity=".65" />
              {shot.drops > 0 && (
                <path
                  d={`M54 ${42 + (shot.drops % 1) * 20}q-7 9 0 11q7-2 0-11`}
                  fill={shot.reagent === 'acid' ? '#be876c' : '#7d88af'}
                />
              )}
              <path
                d="M22 55v58q0 10 10 10h46q10 0 10-10V55"
                fill={`url(#${id}-${i})`}
                stroke="#9fb9ac"
                strokeWidth="2"
              />
              <path
                d={`M25 ${93 - s.volumeMl * 0.5}h60V111q0 9-9 9H34q-9 0-9-9Z`}
                fill={bufferColors[i]}
                opacity=".25"
              />
              <path d="M29 60v48" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <path d="M77 66v46m-7-36h7m-7 16h7" stroke="#a1b5a8" />
              <path d="M57 58v45" stroke="#87958d" strokeWidth="4" strokeLinecap="round" />
              <circle cx="57" cy="103" r="4" fill="#526c60" />
            </svg>
            <p>{names[i]}</p>
            <strong style={{ color: ['#46677f', '#476e55', '#7d6041'][i] }}>
              pH {s.pH.toFixed(2)}
            </strong>
          </div>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${w} ${plotH}`}
        role="img"
        aria-label={say('三种样液的酸碱滴定曲线', 'Titration curves for three samples')}
      >
        {[0, 7, 14].map((v) => (
          <g key={v}>
            <path d={`M32 ${y(v)}H${w - 14}`} stroke="#e0e7dd" />
            <text x="25" y={y(v) + 5} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <path d={`M32 20V${plotH - 20}H${w - 14}`} fill="none" stroke="#a8b9aa" />
        {states.map((s, i) => (
          <g key={s.material}>
            <path
              d={Array.from(
                { length: 121 },
                (_, n) => `${n ? 'L' : 'M'}${x(n)},${y(curves[i][n])}`,
              ).join(' ')}
              fill="none"
              stroke={bufferColors[i]}
              strokeWidth="2"
              opacity=".45"
            />
            <path
              d={Array.from(
                { length: Math.floor(shot.drops) + 1 },
                (_, n) => `${n ? 'L' : 'M'}${x(n)},${y(curves[i][n])}`,
              ).join(' ')}
              fill="none"
              stroke={bufferColors[i]}
              strokeWidth="3"
            />
            <circle
              cx={x(s.drops)}
              cy={y(s.pH)}
              r="5"
              fill={bufferColors[i]}
              stroke="white"
              strokeWidth="2"
            />
          </g>
        ))}
        <text x="32" y={plotH - 1}>
          0
        </text>
        <text x={w - 14} y={plotH - 1} textAnchor="end">
          120 {say('滴', 'drops')}
        </text>
      </svg>
      <p className="bio-buffer-note">
        {shot.reagent === 'acid' ? 'HCl' : 'NaOH'} · 0.1 mol/L ·{' '}
        {say('每份 25 mL；曲线是模型结果', '25 mL per sample; curves are model output')}
      </p>
      {!film.watch && (
        <div className="bio-buffer-controls">
          <div className="bio-buffer-buttons">
            {(['acid', 'base'] as const).map((r) => (
              <button key={r} aria-pressed={reagent === r} onClick={() => setReagent(r)}>
                {r === 'acid'
                  ? say('加酸 · 新样液', 'Acid · fresh sample')
                  : say('加碱 · 新样液', 'Base · fresh sample')}
              </button>
            ))}
          </div>
          <label htmlFor={`${id}-drops`}>
            {say('滴加数量', 'Drops added')} · {drops}
            <input
              id={`${id}-drops`}
              type="range"
              min="0"
              max="120"
              step="1"
              value={drops}
              onChange={(e) => setDrops(+e.target.value)}
            />
          </label>
          <div className="bio-buffer-buttons">
            <button
              onClick={() => {
                setDrops(0);
                setReagent('acid');
              }}
            >
              {say('重置样液', 'Reset samples')}
            </button>
          </div>
        </div>
      )}
      <details>
        <summary>{say('缓冲物质去了哪里', 'Where the buffer goes')}</summary>
        <p>
          {say(
            '同一对物质在接收或释放氢离子后互相转化。磷酸盐样液中：',
            'The conjugate pair interconverts by accepting or releasing hydrogen ions. In the phosphate sample:',
          )}{' '}
          {states[1].acidMmol.toFixed(3)} mmol HA + {states[1].baseMmol.toFixed(3)} mmol A⁻ ={' '}
          {states[1].totalMmol.toFixed(3)} mmol.
        </p>
        <p>
          {say(
            '理想单缓冲对，25 ℃；每滴 50 μL。磷酸盐与生物材料的有效浓度分别为教学选值 20 和 12 mmol/L，生物材料并非肝匀浆的实测曲线。水忽略矿物质和空气中的二氧化碳，不能预测自来水的精确读数。',
            'Ideal single buffer pair at 25 °C; 50 μL drops. Effective concentrations of 20 and 12 mmol/L are teaching choices. The biological curve is not measured liver homogenate. Water omits minerals and atmospheric carbon dioxide.',
          )}
        </p>
      </details>
    </div>
  );
}
