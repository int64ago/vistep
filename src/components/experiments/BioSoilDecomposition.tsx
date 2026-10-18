import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  soilClamp,
  litterState,
  starchState,
  sampleTransfer,
  assayResult,
  reagentDrops,
  litterRecord,
  leafHoles,
} from '../../models/bio-soil-decomposition';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-soil-decomposition.css';
export default function BioSoilDecomposition() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    uid = useId(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const [mode0, setMode] = useState(f.variant === 'bio-elective-2-066-1' ? 1 : 0),
    [view, setView] = useState(0),
    [progress, setProgress] = useState(1),
    [activity, setActivity] = useState(0.12),
    [moisture, setMoisture] = useState(0.5),
    [days, setDays] = useState(7),
    [consume, setConsume] = useState(0.12),
    [heat, setHeat] = useState(true),
    [group, setGroup] = useState(0),
    [records, setRecords] = useState(['', '', '', '']),
    [notes, setNotes] = useState('');
  const mode = f.watch ? (f.chapter < 3 ? 0 : 1) : mode0,
    local = f.watch ? f.chapter - (mode === 0 ? 0 : 3) : Math.min(view, mode === 0 ? 2 : 5),
    p = f.watch ? f.chapterProgress : progress;
  const a = f.watch ? 0.12 : activity,
    m = f.watch ? 0.5 : moisture,
    d = f.watch ? 7 : days,
    c = f.watch ? (local === 5 ? 0.12 + 1.08 * p : 0.12) : consume,
    heated = f.watch || heat,
    which = f.watch ? Math.min(1, Math.floor(p * 2)) : group,
    partP = f.watch ? (p === 1 ? 1 : (p * 2) % 1) : p;
  const transfer = sampleTransfer(partP, w),
    leafDays = local === 0 ? 0 : p * 28;
  const leaf = (x: number, y: number, remaining: number, key: string, scale = 1) => (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <mask id={`${uid}-${key}`}>
          <path d="M0-40Q36-14 0 42Q-32 5 0-40Z" fill="white" />
          {leafHoles.map((h) => (
            <circle
              key={h.id}
              cx={h.x}
              cy={h.y}
              r={h.r * Math.sqrt(1 - remaining) * 3}
              fill="black"
            />
          ))}
        </mask>
      </defs>
      <path d="M0-40Q36-14 0 42Q-32 5 0-40Z" fill="#a58d59" mask={`url(#${uid}-${key})`} />
      <path
        d="M0 42V-34m0 25 10-12M0 9l-10-10m10 20 9-9"
        fill="none"
        stroke="#c1b17e"
        strokeWidth="1.5"
      />
    </g>
  );
  const tube = (x: number, name: string, ml: number, color: string, precip = 0) => (
    <g>
      <path
        d={`M${x - 16} 101v119q0 18 16 18t16-18V101`}
        fill="#f1f5e9"
        stroke="#aab7a0"
        strokeWidth="2"
      />
      <path d={`M${x - 14} ${238 - ml * 7.5}h28V220q0 16-14 16t-14-16Z`} fill={color} />
      <ellipse cx={x} cy="101" rx="16" ry="3" fill="none" stroke="#aab7a0" />
      {Array.from({ length: 36 }, (_, i) => {
        const xx = -7.5 + (i % 6) * 3,
          yy = 228 + Math.floor(i / 6) * 1.1;
        return (
          <circle
            key={i}
            cx={x + xx}
            cy={yy}
            r="1.5"
            fill="#ad6844"
            opacity={soilClamp(precip * 36 - i)}
          />
        );
      })}
      <text x={x} y="282" textAnchor="middle">
        {name}
      </text>
    </g>
  );
  const title =
    mode === 0
      ? s('落叶与土壤微生物', 'Litter and soil microbes')
      : s('土壤浸出液与淀粉', 'Soil extract and starch');
  return (
    <div ref={host} className="bio-soil" data-watch={f.watch}>
      <div className="bio-soil-head">{title}</div>
      {mode === 0 && local < 2 && (
        <svg
          viewBox={`0 0 ${w} 302`}
          role="img"
          aria-label={s(
            '相同落叶与土层的处理对照',
            'Matched litter and soil under contrasting treatments',
          )}
        >
          {[0, 1].map((i) => {
            const x = w * (i === 0 ? 0.27 : 0.73),
              r = litterState(leafDays, i === 0 ? a : 1, m).remaining;
            return (
              <g key={i}>
                <path d={`M${x - 43} 112h86v106q-43 18-86 0Z`} fill="#e5dfcb" stroke="#c1b89c" />
                <path d={`M${x - 41} 163h82v54q-41 15-82 0Z`} fill="#9c8b6b" />
                <ellipse cx={x} cy="164" rx="41" ry="8" fill="#b0a17e" />
                {Array.from({ length: 16 }, (_, j) => (
                  <circle
                    key={j}
                    cx={x - 32 + (j % 5) * 15}
                    cy={178 + Math.floor(j / 5) * 13}
                    r="1.5"
                    fill="#c1b291"
                  />
                ))}
                {leaf(x, 142, r, `leaf${i}`, 0.66)}
                <text x={x} y="255" textAnchor="middle">
                  {i === 0 ? s('处理土', 'Treated') : s('自然土', 'Natural')}
                </text>
                {local === 0 && i === 0 && (
                  <text x={x} y="281" textAnchor="middle">
                    60°C · 1 h
                  </text>
                )}
              </g>
            );
          })}
          <text x={w / 2} y="28" textAnchor="middle">
            {local === 0
              ? s('相同落叶 · 各5 cm土层', 'Matched litter · 5 cm soil')
              : s(
                  `形态示意 · 第${Math.round(leafDays)}天`,
                  `Illustration · day ${Math.round(leafDays)}`,
                )}
          </text>
          {local === 1 && (
            <text x={w / 2} y="291" textAnchor="middle">
              {s('同温同湿 · 处理不等于无菌', 'Matched conditions; not sterile')}
            </text>
          )}
        </svg>
      )}
      {mode === 0 && local === 2 && (
        <svg
          viewBox={`0 0 ${w} 280`}
          role="img"
          aria-label={s(
            '观察记录与模型示例明确分开',
            'Separate measured records from model examples',
          )}
        >
          <text x={w / 2} y="25" textAnchor="middle">
            {f.watch
              ? s('模型练习记录', 'Illustrative model record')
              : s('我的干质量记录', 'My dry-mass records')}
          </text>
          {[0, 1].map((i) => {
            const r = litterRecord(records[i * 2], records[i * 2 + 1]);
            return (
              <g key={i}>
                <text x="16" y={70 + i * 102}>
                  {i === 0 ? s('处理土', 'Treated soil') : s('自然土', 'Natural soil')}
                </text>
                <text x="16" y={101 + i * 102}>
                  {f.watch
                    ? `2.00 → ${(2 * litterState(28, i === 0 ? 0.12 : 1).remaining).toFixed(2)} g`
                    : r
                      ? `${r.initial} → ${r.final} g`
                      : s('尚未填写', 'No observation yet')}
                </text>
                {f.watch && (
                  <path
                    d={`M16 ${116 + i * 102}H${16 + (w - 32) * litterState(28, i === 0 ? 0.12 : 1).remaining}`}
                    stroke="#a2a77e"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}
          <text x={w / 2} y="274" textAnchor="middle">
            {s('空白≠零 · 统一称量条件', 'Blank ≠ zero · matched drying')}
          </text>
        </svg>
      )}
      {mode === 1 && local === 0 && (
        <svg
          viewBox={`0 0 ${w} 310`}
          role="img"
          aria-label={s(
            '纱布和土壤移出后保留浸出液',
            'Lift gauze and soil while retaining the extract',
          )}
        >
          <text x={w / 2} y="24" textAnchor="middle">
            {s('蒸馏水搅拌 → 取出纱布', 'Mix with water → lift gauze')}
          </text>
          <path
            d={`M${w / 2 - 64} 118v152h128V118`}
            fill="#edf2e7"
            stroke="#abb9a1"
            strokeWidth="2"
          />
          <path d={`M${w / 2 - 62} 174h124v94h-124Z`} fill="#c8ba8b" opacity=".65" />
          <g transform={`translate(${w / 2} ${-100 * soilClamp((p - 0.45) / 0.5)})`}>
            <path
              d="M-47 130q-12 79 47 79t47-79"
              fill="#e7e0c9"
              fillOpacity=".5"
              stroke="#afa98e"
              strokeWidth="2"
            />
            <path d="M-43 156q-7 47 43 47t43-47Z" fill="#9b8963" />
            {Array.from({ length: 10 }, (_, j) => (
              <path
                key={j}
                d={`M${-45 + j * 10} 133v${70 - Math.abs(-45 + j * 10) * 0.8}`}
                stroke="#c7c0a6"
                strokeWidth="1"
              />
            ))}
            <path d="M-46 130l-17-13m109 13 17-13" stroke="#aaa58b" strokeWidth="2" />
          </g>
          {p < 0.4 && (
            <path
              d={`M${w / 2 + 25 + 8 * Math.sin(p * 45)} 86L${w / 2 + 10 + 8 * Math.sin(p * 45)} 183`}
              stroke="#a1b5a5"
              strokeWidth="5"
              strokeLinecap="round"
            />
          )}
          {Array.from({ length: 12 }, (_, i) => (
            <circle
              key={i}
              cx={w / 2 - 50 + (i % 6) * 20}
              cy={228 + Math.floor(i / 6) * 18}
              r="1.4"
              fill="#9c9e6c"
              opacity={soilClamp(p * 3)}
            />
          ))}
          <text x={w / 2} y="303" textAnchor="middle">
            {s('浸出液仍可含微生物与可溶物', 'Extract: microbes and solutes')}
          </text>
        </svg>
      )}
      {mode === 1 && local === 1 && (
        <svg
          viewBox={`0 0 ${w} 310`}
          role="img"
          aria-label={s(
            '等量淀粉糊分别加入浸出液或水',
            'Equal starch paste receives extract or distilled water',
          )}
        >
          <text x={w / 2} y="24" textAnchor="middle">
            {which === 0
              ? s('A · 土壤浸出液', 'A · Soil extract')
              : s('B · 蒸馏水', 'B · Distilled water')}
          </text>
          <path d={`M${w / 2 - 15} 40v75l10 10v9h10v-9l10-10V40`} fill="#edf1e5" stroke="#a9b59d" />
          {partP < 1 && (
            <path
              d={`M${w / 2 - 13} ${115 - 70 * (1 - partP)}h26v3l-9 9h-8l-9-9Z`}
              fill={which === 0 ? '#c8ba8e' : '#cee1d8'}
            />
          )}
          {partP > 0 && partP < 1 && (
            <path
              d={`M${w / 2} 134V${250 - (10 + 30 * partP) * 1.8}`}
              stroke={which === 0 ? '#bcac7b' : '#a8c9bd'}
              strokeWidth="3"
            />
          )}
          <path d={`M${w / 2 - 52} 155v97h104V155`} fill="none" stroke="#a6b69a" strokeWidth="2" />
          <path
            d={`M${w / 2 - 50} ${250 - (10 + 30 * partP) * 1.8}h100V250H${w / 2 - 50}Z`}
            fill={which === 0 ? '#d7cca5' : '#e5e4ca'}
          />
          <text x={w / 2} y="280" textAnchor="middle">
            {s('等量淀粉糊 + 30 mL', 'Equal paste + 30 mL')}
          </text>
          <text x={w / 2} y="306" textAnchor="middle">
            20°C · 7 d
          </text>
        </svg>
      )}
      {mode === 1 && local === 2 && (
        <svg
          viewBox={`0 0 ${w} 305`}
          role="img"
          aria-label={s(
            '移液管将同一培养液分成两份',
            'Pipette separate aliquots from the same incubation',
          )}
        >
          <text x={w / 2} y="24" textAnchor="middle">
            {which === 0 ? 'A' : 'B'} · {s('分开检测，不混加试剂', 'Separate tests')}
          </text>
          <path
            d={`M${w * 0.2 - 27} 150v107h54V150`}
            fill="none"
            stroke="#a4b19c"
            strokeWidth="2"
          />
          <path d={`M${w * 0.2 - 25} ${255 - transfer.source * 1.4}h50V255h-50Z`} fill="#d5cba5" />
          {transfer.tubes.map((v, i) => {
            const x = w * (i === 0 ? 0.57 : 0.82);
            return (
              <g key={i}>
                <path
                  d={`M${x - 13} 150v93q0 12 13 12t13-12v-93`}
                  stroke="#a4b19c"
                  fill="#f3f6eb"
                  strokeWidth="2"
                />
                {v > 0 && (
                  <rect
                    x={x - 11}
                    y={255 - v * 5}
                    width="22"
                    height={v * 5}
                    fill="#d5cba5"
                    clipPath={`url(#${uid}-sample${i})`}
                  />
                )}
                <defs>
                  <clipPath id={`${uid}-sample${i}`}>
                    <path d={`M${x - 11} 151v92q0 10 11 10t11-10v-92Z`} />
                  </clipPath>
                </defs>
                <text x={x} y="281" textAnchor="middle">
                  {which === 0 ? 'A' : 'B'}
                  {i + 1}
                </text>
              </g>
            );
          })}
          {transfer.dispensing && (
            <path
              d={`M${transfer.x} ${transfer.y}V${255 - transfer.tubes[transfer.part] * 5}`}
              stroke="#c6b98d"
              strokeWidth="2"
            />
          )}
          <g transform={`translate(${transfer.x} ${transfer.y})`}>
            <path d="M-5-65v51l3 9v5h4v-5l3-9v-51" fill="#eef3e6" stroke="#9eae94" />
            {transfer.pipette > 0 && (
              <path
                d={`M-3 ${-14 - transfer.pipette * 4.9}h6v${transfer.pipette * 4.9}l-2 8h-2l-2-8Z`}
                fill="#b9b38c"
              />
            )}
            <ellipse cy="-72" rx="9" ry="10" fill="#a2b19a" />
          </g>
          <text x={w * 0.2} y="281" textAnchor="middle">
            {transfer.source.toFixed(0)} mL
          </text>
          <text x={w / 2} y="304" textAnchor="middle">
            {s('从40 mL中分取两份10 mL', '2 × 10 mL from 40 mL')}
          </text>
        </svg>
      )}
      {mode === 1 && (local === 3 || local === 4) && (
        <svg
          viewBox={`0 0 ${w} 301`}
          role="img"
          aria-label={
            local === 3
              ? s('碘液检测残留淀粉', 'Iodine tests remaining starch')
              : s(
                  '加热的斐林试剂检测还原物质',
                  'Heated Fehling reagent detects reducing substances',
                )
          }
        >
          {local === 4 && (
            <>
              <path
                d={`M${w * 0.3 - 29} 166h${w * 0.4 + 58}v86H${w * 0.3 - 29}Z`}
                fill="#e2ebe1"
                stroke="#b9c5b0"
              />
              <path
                d={`M${w * 0.3 - 27} 186h${w * 0.4 + 54}v64H${w * 0.3 - 27}Z`}
                fill={heated && p > 0.5 ? '#e4dfc4' : '#d5e5dd'}
              />
              <rect
                x={w * 0.3 - 35}
                y="253"
                width={w * 0.4 + 70}
                height="10"
                rx="5"
                fill={heated && p > 0.5 ? '#c6a274' : '#aeb8a2'}
              />
            </>
          )}
          {[0, 1].map((i) => {
            const x = w * (i === 0 ? 0.3 : 0.7),
              r = assayResult(d, i === 0, c, heated, p),
              blue = r.iodine,
              col =
                local === 3
                  ? r.reagent === 0
                    ? '#d5cba5'
                    : `rgb(${Math.round(202 - 129 * blue)},${Math.round(171 - 100 * blue)},${Math.round(108 + 2 * blue)})`
                  : r.reagent
                    ? '#91b7c5'
                    : '#d5cba5';
            return (
              <g key={i}>
                {tube(
                  x,
                  `${i === 0 ? 'A' : 'B'}${local === 3 ? 1 : 2}`,
                  r.liquidMl,
                  col,
                  local === 4 ? r.precipitate : 0,
                )}
                <path
                  d={`M${x - 5} 53v31l3 7h4l3-7V53`}
                  fill={local === 3 ? '#b79a61' : '#9ab8bf'}
                  stroke="#929d85"
                />
                {reagentDrops(p)
                  .filter((z) => z.visible)
                  .map((z) => (
                    <circle
                      key={z.id}
                      cx={x}
                      cy={91 + (238 - r.liquidMl * 7.5 - 91) * z.phase}
                      r="2.6"
                      fill={local === 3 ? '#a98140' : '#77a8ba'}
                    />
                  ))}
                <text x={x} y="31" textAnchor="middle">
                  {i === 0 ? s('浸出液组', 'Extract') : s('水组', 'Water')}
                </text>
              </g>
            );
          })}
          <text x={w / 2} y="298" textAnchor="middle">
            {local === 3
              ? s('碘液：观察残留淀粉', 'Iodine: remaining starch')
              : heated && p > 0.5
                ? s('水浴加热 → 观察沉淀', 'Heat → inspect precipitate')
                : s('先加新配斐林试剂', 'Add fresh Fehling reagent')}
          </text>
        </svg>
      )}
      {mode === 1 && local === 5 && (
        <svg
          viewBox={`0 0 ${w} 302`}
          role="img"
          aria-label={s(
            '还原糖生成后仍可能被微生物利用',
            'Microbes can consume reducing products after hydrolysis',
          )}
        >
          <text x={w / 2} y="25" textAnchor="middle">
            {s('淀粉 → 还原性产物 → 利用', 'Starch → sugars → use')}
          </text>
          {(() => {
            const r = starchState(d, true, c);
            return [r.starch, r.reducing, r.used].map((v, i) => (
              <g key={i}>
                <text x="16" y={73 + i * 63}>
                  {
                    [
                      s('残留淀粉', 'Starch'),
                      s('还原性产物', 'Reducing products'),
                      s('转入其他去向', 'Other carbon pools'),
                    ][i]
                  }
                </text>
                <rect
                  x="16"
                  y={84 + i * 63}
                  width={(w - 32) * v}
                  height="17"
                  rx="8"
                  fill={['#8a85a3', '#bdad76', '#9eaf8c'][i]}
                />
              </g>
            ));
          })()}
          <text x={w / 2} y="273" textAnchor="middle">
            {s('碳当量模型 · 不是实测曲线', 'Carbon-equivalent model')}
          </text>
          <text x={w / 2} y="300" textAnchor="middle">
            {assayResult(d, true, c).precipitate > 0
              ? s('此时可出现砖红沉淀', 'Precipitate can form')
              : s('糖被利用后可能不显阳性', 'Low sugar can test negative')}
          </text>
        </svg>
      )}
      {!f.watch && (
        <div className="bio-soil-controls">
          <div className="bio-soil-buttons">
            {[s('落叶对照', 'Litter controls'), s('淀粉分解', 'Starch breakdown')].map((t, i) => (
              <button
                key={i}
                aria-pressed={mode === i}
                onClick={() => {
                  setMode(i);
                  setView(0);
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="bio-soil-buttons">
            {Array.from({ length: mode === 0 ? 3 : 6 }, (_, i) => (
              <button key={i} aria-pressed={local === i} onClick={() => setView(i)}>
                {s('观察', 'View ')}
                {i + 1}
              </button>
            ))}
          </div>
          {!(mode === 0 && local === 2) && !(mode === 1 && local === 5) && (
            <label>
              {s('过程位置', 'Progress')}
              <input
                type="range"
                min="0"
                max="1"
                step=".001"
                value={progress}
                onChange={(e) => setProgress(+e.target.value)}
              />
            </label>
          )}
          {mode === 0 && local < 2 && (
            <>
              <label>
                {s('处理后残留活性（假设）', 'Residual activity assumption')} {activity.toFixed(2)}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step=".01"
                  value={activity}
                  onChange={(e) => setActivity(+e.target.value)}
                />
              </label>
              <label>
                {s('共同水分条件', 'Shared moisture')}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step=".01"
                  value={moisture}
                  onChange={(e) => setMoisture(+e.target.value)}
                />
              </label>
            </>
          )}
          {mode === 0 && local === 2 && (
            <>
              <div className="bio-soil-records">
                {records.map((v, i) => (
                  <label key={i}>
                    {
                      [
                        s('处理组初始/g', 'Treated initial/g'),
                        s('处理组末次/g', 'Treated final/g'),
                        s('自然组初始/g', 'Natural initial/g'),
                        s('自然组末次/g', 'Natural final/g'),
                      ][i]
                    }
                    <input
                      type="number"
                      min="0"
                      step=".01"
                      value={v}
                      placeholder={s('未记录', 'Missing')}
                      onChange={(e) => {
                        const n = [...records];
                        n[i] = e.target.value;
                        setRecords(n);
                      }}
                    />
                  </label>
                ))}
              </div>
              <label>
                {s('时间、温湿度与重复记录', 'Timing, conditions and replicates')}
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </label>
            </>
          )}
          {mode === 1 && (local === 1 || local === 2) && (
            <div className="bio-soil-buttons">
              {['A', 'B'].map((v, i) => (
                <button key={i} aria-pressed={group === i} onClick={() => setGroup(i)}>
                  {v} · {i === 0 ? s('浸出液', 'Extract') : s('蒸馏水', 'Water')}
                </button>
              ))}
            </div>
          )}
          {mode === 1 && local >= 3 && (
            <>
              <label>
                {s('培养时间/天', 'Incubation days')} {days}
                <input
                  type="range"
                  min="0"
                  max="14"
                  step="1"
                  value={days}
                  onChange={(e) => setDays(+e.target.value)}
                />
              </label>
              <label>
                {s('产物利用系数（假设）', 'Product-use coefficient')} {consume.toFixed(2)}
                <input
                  type="range"
                  min="0"
                  max="1.2"
                  step=".01"
                  value={consume}
                  onChange={(e) => setConsume(+e.target.value)}
                />
              </label>
              {local === 4 && (
                <button aria-pressed={heat} onClick={() => setHeat(!heat)}>
                  {s('水浴加热', 'Water-bath heating')}
                </button>
              )}
            </>
          )}
          <details>
            <summary>{s('处理、检测与模型限制', 'Treatments, tests and limits')}</summary>
            <p>
              {s(
                '教材示例以60°C处理1h尽可能减弱微生物作用，不能保证无菌或理化性质完全不变。落叶形态与活性参数是假设，不代替长期重复记录。淀粉案例为A加30mL浸出液、B加30mL水，约20°C放7天；此图选等量10mL淀粉糊，总40mL，再各取20mL分成两份10mL。碘液与斐林试剂不加到同一份中；后者新配后加热。浸出液自身色素、还原物质和残留酶也可能干扰，额外空白与初始检测能加强结论。糖可以被继续利用，不保证第7天必显砖红色。',
                'The textbook’s 60°C, 1 h treatment reduces microbial effects; it does not guarantee sterility or unchanged chemistry. Litter shape and activity parameters are illustrative. A receives 30 mL extract and B 30 mL water at about 20°C for 7 days. This reconstruction chooses 10 mL equal starch paste, then splits 20 mL into separate 10 mL aliquots. Iodine and fresh heated Fehling reagent test separate aliquots. Extract pigments, reducing substances and extracellular enzymes can interfere; blanks and initial tests strengthen inference. Products can be consumed, so day 7 need not yield a positive sugar test.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
