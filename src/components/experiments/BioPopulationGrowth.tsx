import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  binaryPopulation,
  logisticPopulation,
  growthClamp,
  chamberConcentration,
  yeastCells,
  inCountingSquare,
  flaskCells,
  chamberFill,
  canopyClosure,
  canopyEvidence,
  recordedMeans,
  yeastExampleCounts,
} from '../../models/bio-population-growth';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-population-growth.css';
export default function BioPopulationGrowth() {
  const film = useShowcase(),
    { host, width: w, compact } = useSignalWidth(),
    id = useId(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const variants = [
    'bio-elective-2-007-1',
    'bio-elective-2-009-1',
    'bio-elective-2-011-1',
    'bio-elective-2-013-1',
  ];
  const [chosen, setChosen] = useState(Math.max(0, variants.indexOf(film.variant ?? ''))),
    [phase, setPhase] = useState(1),
    [view, setView] = useState(0),
    [capacity, setCapacity] = useState(375),
    [day, setDay] = useState(3),
    [replicate, setReplicate] = useState(1),
    [dilution, setDilution] = useState(10),
    [own, setOwn] = useState(false),
    [records, setRecords] = useState<(number | null)[][]>(
      Array.from({ length: 8 }, () => [null, null, null]),
    ),
    [species, setSpecies] = useState(0);
  const mode = film.watch
    ? film.chapter < 2
      ? 0
      : film.chapter < 4
        ? 1
        : film.chapter < 8
          ? 2
          : 3
    : chosen;
  const local = film.watch ? film.chapter - [0, 2, 4, 8][mode] : Math.min(view, [1, 1, 3, 1][mode]),
    p = film.watch ? film.chapterProgress : phase;
  const age = Math.floor(growthClamp(p / 0.78) * 5),
    days = film.watch ? Math.min(7, Math.floor(p * 9)) : day,
    currentDay = film.watch ? 3 : day,
    rep = film.watch ? 1 : replicate,
    dil = film.watch ? 10 : dilution;
  const cells = yeastCells(currentDay, rep),
    count = cells.filter(inCountingSquare).length,
    concentration = chamberConcentration(count, dil)!,
    real = !film.watch && own;
  const means = recordedMeans(real ? records : yeastExampleCounts.map((n) => [n - 1, n, n + 1]));
  const chartMax = Math.max(
    100,
    ...means.map((row) =>
      row.mean === null
        ? 0
        : Math.ceil(chamberConcentration(row.mean, dil)!.cellsPerMl / 1e6 / 50) * 50,
    ),
  );
  const k = film.watch ? 375 : capacity,
    lx = (t: number) => 44 + (t * (w - 66)) / 7,
    ly = (n: number) => 237 - (n / 500) * 188;
  const titles = [
    s('从分裂规则到预测', 'From division to prediction'),
    s('历史观察与理想模型', 'Observation and model'),
    s('取样 · 计数 · 记录', 'Sample · count · record'),
    s('从调查资料判断', 'Read survey evidence'),
  ];
  const yeast = (x: number, y: number, key: number, include = true) => (
    <g key={key} opacity={include ? 1 : 0.35}>
      <ellipse
        cx={x}
        cy={y}
        rx="4"
        ry="5.5"
        fill={include ? '#c7ad7b' : '#d6cbbb'}
        stroke="#927d57"
        strokeWidth="1"
      />
      <circle cx={x - 0.8} cy={y} r="1.2" fill="#a18c68" />
    </g>
  );
  const graphAxes = (max: number, label: string) => (
    <>
      <path d={`M44 45v192h${w - 66}`} fill="none" stroke="#b2bba6" />
      {[0, max / 2, max].map((n) => (
        <g key={n}>
          <path d={`M40 ${237 - (n / max) * 188}h${w - 62}`} stroke="#dce2d3" />
          <text x="36" y={242 - (n / max) * 188} textAnchor="end">
            {n >= 1000 ? n.toExponential(0) : n}
          </text>
        </g>
      ))}
      <text x="44" y="26">
        {label}
      </text>
    </>
  );
  return (
    <div className="bio-growth" data-watch={film.watch} ref={host}>
      <div className="bio-growth-head">{titles[mode]}</div>
      {mode === 0 && local === 0 && (
        <svg viewBox={`0 0 ${w} 294`} role="img" aria-label={titles[0]}>
          <text x={w / 2} y="25" textAnchor="middle">
            {s('谱系示意 · 每代20 min', 'Lineage · 20 min / generation')}
          </text>
          {Array.from({ length: 6 }, (_, g) => {
            const n = 2 ** g,
              y = 57 + g * 35;
            return (
              <g key={g} opacity={g <= age ? 1 : 0.12}>
                {Array.from({ length: n }, (_, j) => {
                  const x = 42 + ((j + 0.5) * (w - 80)) / n;
                  return (
                    <g key={j}>
                      {g > 0 && (
                        <path
                          d={`M${42 + ((Math.floor(j / 2) + 0.5) * (w - 80)) / (n / 2)} ${y - 28}L${x} ${y - 5}`}
                          stroke="#acb69c"
                          fill="none"
                        />
                      )}
                      <ellipse
                        cx={x}
                        cy={y}
                        rx={Math.min(8, ((w - 80) / n) * 0.3)}
                        ry="5"
                        fill={g === age ? '#8ba47b' : '#b9c6a9'}
                      />
                    </g>
                  );
                })}
                <text x={w - 12} y={y + 5} textAnchor="end">
                  {n}
                </text>
              </g>
            );
          })}
          <text x={w / 2} y="279" textAnchor="middle">
            {s('亮色为当前一代', 'Highlighted = current generation')}
          </text>
        </svg>
      )}
      {mode === 0 && local === 1 && (
        <svg
          viewBox={`0 0 ${w} 285`}
          role="img"
          aria-label={s('离散倍增预测', 'Discrete doubling prediction')}
        >
          <text x={w / 2} y="33" textAnchor="middle">
            N = N₀ × 2ⁿ
          </text>
          {[0, 1, 2, 3, 4].map((g) => (
            <g key={g} opacity={g / 5 <= p ? 1 : 0.2}>
              <text x={w * 0.24} y={79 + g * 31} textAnchor="middle">
                {g * 20} min
              </text>
              <path
                d={`M${w * 0.37} ${74 + g * 31}h${Math.max(2, (2 ** g * (w * 0.32)) / 16)}`}
                stroke="#8da77a"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <text x={w * 0.83} y={79 + g * 31} textAnchor="end">
                {binaryPopulation(g * 20).population}
              </text>
            </g>
          ))}
          <text x={w / 2} y="250" textAnchor="middle">
            72 h → 2²¹⁶ ≈ 1.05 × 10⁶⁵
          </text>
          <text x={w / 2} y="300" textAnchor="middle">
            {s('假设推演，仍须验证', 'Prediction still needs testing')}
          </text>
        </svg>
      )}
      {mode === 1 && local === 0 && (
        <svg
          viewBox={`0 0 ${w} 288`}
          role="img"
          aria-label={s('高斯培养证据重建', 'Reconstructed Gause culture evidence')}
        >
          {[5, 375].map((n, j) => {
            const x = w * (j ? 0.73 : 0.27),
              vw = Math.min(170, w * 0.39);
            return (
              <g key={j} opacity={j === 0 ? 1 : growthClamp(p / 0.45)}>
                <text x={x} y="31" textAnchor="middle">
                  {j ? s('约第5天后', 'After ~day 5') : s('开始', 'Start')}
                </text>
                <path
                  d={`M${x - vw / 2} 65v145q0 14 14 14h${vw - 28}q14 0 14-14V65`}
                  fill="#edf0df"
                  stroke="#afbda4"
                  strokeWidth="2"
                />
                <path
                  d={`M${x - vw / 2 + 2} 87h${vw - 4}v122q0 12-12 12h${-(vw - 28)}q-12 0-12-12Z`}
                  fill="#dbe6d0"
                />
                {Array.from({ length: n }, (_, i) => (
                  <ellipse
                    key={i}
                    cx={
                      j
                        ? x - vw / 2 + 7 + ((i % 25) * (vw - 14)) / 24
                        : x + (i % 2 ? 1 : -1) * vw * 0.17
                    }
                    cy={j ? 95 + Math.floor(i / 25) * 7.8 : 115 + i * 18}
                    rx={j ? 1.35 : 6}
                    ry={j ? 2.6 : 12}
                    fill="#8d9f72"
                    transform={
                      j
                        ? undefined
                        : `rotate(${i * 19 - 40} ${x + (i % 2 ? 1 : -1) * vw * 0.17} ${115 + i * 18})`
                    }
                  />
                ))}
                <text x={x} y="250" textAnchor="middle">
                  {j ? '≈375' : 5}
                  {s('个', ' cells')}
                </text>
              </g>
            );
          })}
          <text x={w / 2} y="280" textAnchor="middle">
            {s('0.5 mL · 教材证据重建', '0.5 mL · textbook reconstruction')}
          </text>
        </svg>
      )}
      {mode === 1 && local === 1 && (
        <svg
          viewBox={`0 0 ${w} 285`}
          role="img"
          aria-label={s('独立的逻辑斯谛模型', 'Separate logistic model')}
        >
          {graphAxes(500, s('数量 / 个（模型）', 'Count (model)'))}
          <path d={`M44 ${ly(k)}H${w - 22}`} stroke="#c3ac70" strokeDasharray="5 5" />
          <text x={w - 25} y={ly(k) - 8} textAnchor="end">
            K = {k}
          </text>
          <path
            d={Array.from({ length: 101 }, (_, i) => {
              const t = (i / 100) * 7 * growthClamp(p / 0.8);
              return `${i ? 'L' : 'M'}${lx(t)},${ly(logisticPopulation(t, 5, k).value)}`;
            }).join(' ')}
            fill="none"
            stroke="#82996f"
            strokeWidth="3"
          />
          {[0, 2, 4, 6].map((t) => (
            <text key={t} x={lx(t)} y="261" textAnchor="middle">
              {t}
            </text>
          ))}
          <text x={w - 12} y="281" textAnchor="end">
            {s('天 · 非原始测量点', 'days · illustrative model')}
          </text>
        </svg>
      )}
      {mode === 2 && local === 0 && (
        <svg
          viewBox={`0 0 ${w} 288`}
          role="img"
          aria-label={s('取样前轻摇培养液', 'Mix culture before sampling')}
        >
          <text x={w / 2} y="30" textAnchor="middle">
            {s('10 mL 培养液 · 固定示踪细胞', '10 mL culture · fixed cell tracers')}
          </text>
          <g transform={`translate(${w / 2} 0)`}>
            <path
              d="M-16 66v39L-58 240q0 10 12 10h92q12 0 12-10L16 105V66"
              stroke="#a0b39c"
              strokeWidth="2"
              fill="#eff3e7"
            />
            <path d="M-29.85 150H29.85L56 235q3 12-10 12h-92q-13 0-10-12Z" fill="#dbe6bc" />
            {flaskCells(growthClamp(p / 0.7)).map((c) => yeast(c.x, c.y, c.id))}
            <path d="M-21 67h42" stroke="#879b81" strokeWidth="4" strokeLinecap="round" />
            <path
              d="M-73 177q-20 25 0 48m146-48q20 25 0 48"
              fill="none"
              stroke="#b9bc8b"
              strokeWidth="2"
              strokeDasharray="6 5"
              opacity={p > 0.05 && p < 0.7 ? 1 : 0.2}
            />
          </g>
          <text x={w / 2} y="280" textAnchor="middle">
            {p < 0.7
              ? s('轻摇混匀', 'Gently mix')
              : s('再取有代表性的小样', 'Then take a representative aliquot')}
          </text>
        </svg>
      )}
      {mode === 2 && local === 1 && (
        <svg
          viewBox={`0 0 ${w} 278`}
          role="img"
          aria-label={s('盖片先放置，再沿边缘加样', 'Place coverslip, then load its edge')}
        >
          <defs>
            <linearGradient id={`${id}-glass`} x2="0" y2="1">
              <stop stopColor="#eff4ef" />
              <stop offset="1" stopColor="#b6c8bd" />
            </linearGradient>
          </defs>
          <text x={w / 2} y="30" textAnchor="middle">
            {s('计数室侧面放大', 'Counting chamber · side section')}
          </text>
          <rect x="28" y="181" width={w - 56} height="29" rx="5" fill={`url(#${id}-glass)`} />
          <rect x="60" y="145" width={w - 92} height="16" rx="3" fill={`url(#${id}-glass)`} />
          <path d={`M${w - 32} 160h-20v21h20`} fill="#bdcec1" />
          <rect x="60" y="161" width={(w - 112) * chamberFill(p)} height="20" fill="#d6d8a1" />
          <path d="M48 53h12v46l-6 25-6-25Z" fill="#d9e4dc" stroke="#93aa9b" />
          <path d="M52 76h4v23l-2 9-2-9Z" fill="#b3c78f" />
          <path
            d={`M54 ${126 + Math.min(1, p / 0.25) * 25}q-8 10 0 10q8 0 0-10`}
            fill="#b7c68e"
            opacity={p < 0.3 ? 1 : 0}
          />
          <path d="M60 161q-13-13-13-2q1 12 13 12Z" fill="#d6d8a1" opacity={p >= 0.23 ? 1 : 0} />
          <path d={`M${w - 17} 161v20m-4-20h8m-8 20h8`} stroke="#8c9f89" />
          <text x={w / 2} y="238" textAnchor="middle">
            {s('室深 0.1 mm · 毛细充液', 'Depth 0.1 mm · capillary filling')}
          </text>
          <text x={w / 2} y="269" textAnchor="middle">
            {s('盖片已就位；不要将液滴压入', 'Coverslip in place before loading')}
          </text>
        </svg>
      )}
      {mode === 2 && local === 2 && (
        <svg
          viewBox={`0 0 ${w} 338`}
          role="img"
          aria-label={s('用已知体积计数', 'Count a known volume')}
        >
          <text x={w / 2} y="23" textAnchor="middle">
            {s('第', 'Day ')}
            {currentDay}
            {s('天 · 第', ' · repeat ')}
            {rep + 1}
            {s('次', '')}
          </text>
          {(() => {
            const size = Math.min(w - 90, 176),
              x = (w - size) / 2,
              y = 53;
            return (
              <>
                <rect
                  x={x - 14}
                  y={y - 14}
                  width={size + 28}
                  height={size + 28}
                  rx="18"
                  fill="#f1eddf"
                />
                {Array.from({ length: 5 }, (_, i) => (
                  <g key={i}>
                    <path
                      d={`M${x + (i * size) / 4} ${y}v${size}M${x} ${y + (i * size) / 4}h${size}`}
                      stroke={i === 0 ? '#8c996f' : '#cac5ae'}
                      strokeWidth={i === 0 ? 2 : 1}
                    />
                  </g>
                ))}
                {cells.map((c) => yeast(x + c.x * size, y + c.y * size, c.id, inCountingSquare(c)))}
                <text x={w / 2} y={y + size + 36} textAnchor="middle">
                  0.2 × 0.2 × 0.1 mm³
                </text>
              </>
            );
          })()}
          <text x={w / 2} y="300" textAnchor="middle">
            {count}
            {s('个', ' cells')} × {dil} ÷ (4 × 10⁻⁶ mL)
          </text>
          <text x={w / 2} y="328" textAnchor="middle">
            {(concentration.cellsPerMl / 1e6).toFixed(1)} × 10⁶ {s('个/mL', 'cells/mL')}
          </text>
        </svg>
      )}
      {mode === 2 && local === 3 && (
        <svg
          viewBox={`0 0 ${w} 285`}
          role="img"
          aria-label={s('由每日计数形成记录', 'Daily counts become a record')}
        >
          {graphAxes(chartMax, s('百万个 / mL', 'Million cells / mL'))}
          {means.map((row, d) => {
            const v =
              row.mean === null ? null : chamberConcentration(row.mean, dil)!.cellsPerMl / 1e6;
            return (
              <g key={d}>
                <text x={lx(d)} y="261" textAnchor="middle">
                  {d}
                </text>
                {v !== null && (!film.watch || d <= days) && (
                  <>
                    <path
                      d={`M${lx(d)} 237V${237 - (v / chartMax) * 188}`}
                      stroke="#b8c1a4"
                      strokeDasharray="3 4"
                    />
                    <circle cx={lx(d)} cy={237 - (v / chartMax) * 188} r="5" fill="#91a578" />
                  </>
                )}
              </g>
            );
          })}
          <text x={w - 16} y="282" textAnchor="end">
            {real
              ? s('天 · 输入记录', 'days · entered records')
              : s('天 · 计数练习示例', 'days · illustrative counts')}
          </text>
        </svg>
      )}
      {mode === 3 && local === 0 && (
        <svg
          viewBox={`0 0 ${w} 292`}
          role="img"
          aria-label={s('教材郁闭度调查资料', 'Textbook canopy survey evidence')}
        >
          {(() => {
            const selected = film.watch ? Math.min(2, Math.floor(p * 3)) : species,
              data = canopyEvidence[selected],
              px = (i: number) => 44 + (i * (w - 68)) / 5,
              py = (v: number) => 230 - (v / 16) * 155;
            return (
              <>
                <text x={w / 2} y="25" textAnchor="middle">
                  {s(data.zh, data.en)}
                </text>
                <text x="44" y="56">
                  {s('平均株数 / m²', 'Mean plants / m²')}
                </text>
                <path d={`M44 69v161h${w - 68}`} stroke="#b4bba7" fill="none" />
                {[0, 8, 16].map((v) => (
                  <text key={v} x="35" y={py(v) + 5} textAnchor="end">
                    {v}
                  </text>
                ))}
                {data.values.map((v, i) => (
                  <g key={i}>
                    <path d={`M${px(i)} 230V${py(v)}`} stroke="#d0d6c2" />
                    <circle cx={px(i)} cy={py(v)} r="5" fill={data.color} />
                    <text x={px(i)} y={py(v) - 12} textAnchor="middle">
                      {v}
                    </text>
                    <text x={px(i)} y="254" textAnchor="middle">
                      {canopyClosure[i]}
                    </text>
                  </g>
                ))}
                <text x={w / 2} y="282" textAnchor="middle">
                  {s('郁闭度（教材调查数据）', 'Canopy closure (textbook data)')}
                </text>
              </>
            );
          })()}
        </svg>
      )}
      {mode === 3 && local === 1 && (
        <svg
          viewBox={`0 0 ${w} 286`}
          role="img"
          aria-label={s('多个因素共同变化', 'Multiple factors change together')}
        >
          <text x={w / 2} y="27" textAnchor="middle">
            {s('季节', 'Season')}
          </text>
          {[s('降水', 'Rain'), s('温度', 'Temperature'), s('日长', 'Day length')].map((t, i) => {
            const x = compact ? w / 2 : (w * (i + 1)) / 4,
              y = compact ? 65 + i * 34 : 95;
            return (
              <g key={i}>
                <path
                  d={compact ? `M${w * 0.2} 37V${y - 6}H${x - 60}` : `M${w / 2} 37L${x} 72`}
                  stroke="#c0c9b2"
                  fill="none"
                />
                <text x={x} y={y} textAnchor="middle">
                  {t}
                </text>
                <path
                  d={
                    compact
                      ? `M${x + 65} ${y - 6}H${w * 0.85}V149L${w / 2} 155`
                      : `M${x} 106L${w / 2} 155`
                  }
                  stroke="#c0c9b2"
                  fill="none"
                  strokeDasharray={p < 0.45 ? '4 5' : undefined}
                />
              </g>
            );
          })}
          <ellipse cx={w / 2} cy="179" rx={Math.min(w * 0.4, 130)} ry="29" fill="#e0e8d1" />
          <text x={w / 2} y="185" textAnchor="middle">
            {s('资源 · 出生 · 死亡', 'Resources · births · deaths')}
          </text>
          <path d={`M${w / 2} 208v32`} stroke="#a7b69a" />
          <text x={w / 2} y="266" textAnchor="middle">
            {s('种群数量变化', 'Population change')}
          </text>
        </svg>
      )}
      {!film.watch && (
        <div className="bio-growth-controls">
          <div className="bio-growth-buttons">
            {titles.map((t, i) => (
              <button
                key={i}
                aria-pressed={mode === i}
                onClick={() => {
                  setChosen(i);
                  setView(0);
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="bio-growth-buttons">
            {[...Array([2, 2, 4, 2][mode])].map((_, i) => (
              <button key={i} aria-pressed={local === i} onClick={() => setView(i)}>
                {s('观察', 'View ')}
                {i + 1}
              </button>
            ))}
          </div>
          <label>
            {s('过程位置', 'Progress')}
            <input
              type="range"
              min="0"
              max="1"
              step=".01"
              value={phase}
              onChange={(e) => setPhase(+e.target.value)}
            />
          </label>
          {mode === 1 && local === 1 && (
            <label>
              K = {capacity}
              <input
                type="range"
                min="150"
                max="450"
                step="25"
                value={capacity}
                onChange={(e) => setCapacity(+e.target.value)}
              />
            </label>
          )}
          {mode === 2 && local >= 2 && (
            <>
              <label>
                {s('观察日', 'Observation day')} {day}
                <input
                  type="range"
                  min="0"
                  max="7"
                  step="1"
                  value={day}
                  onChange={(e) => setDay(+e.target.value)}
                />
              </label>
              <label>
                {s('重复', 'Repeat')} {replicate + 1}
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="1"
                  value={replicate}
                  onChange={(e) => setReplicate(+e.target.value)}
                />
              </label>
              <label>
                {s('稀释倍数', 'Dilution factor')} {dilution}
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={dilution}
                  onChange={(e) => setDilution(+e.target.value)}
                />
              </label>
              {local === 3 && (
                <>
                  <button aria-pressed={own} onClick={() => setOwn(!own)}>
                    {s('使用我的计数记录', 'Use my count records')}
                  </button>
                  {own && (
                    <div className="bio-growth-records">
                      {records[day].map((v, r) => (
                        <label key={r}>
                          {s('第', 'Repeat ')}
                          {r + 1}
                          {s('次计数', '')}
                          <input
                            type="number"
                            min="0"
                            value={v ?? ''}
                            placeholder={s('未记录', 'Not recorded')}
                            onChange={(e) => {
                              const next = records.map((row) => [...row]);
                              next[day][r] =
                                e.target.value === '' ? null : growthClamp(+e.target.value, 0, 1e6);
                              setRecords(next);
                            }}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
          {mode === 3 && local === 0 && (
            <div className="bio-growth-buttons">
              {canopyEvidence.map((d, i) => (
                <button key={i} aria-pressed={species === i} onClick={() => setSpecies(i)}>
                  {s(d.zh, d.en)}
                </button>
              ))}
            </div>
          )}
          <details>
            <summary>
              {s('模型、计数规则与证据边界', 'Models, counting rules and evidence')}
            </summary>
            <p>
              {s(
                '细菌假设每20分钟同步分裂，资源无限且无死亡。高斯历史观察与独立逻辑斯谛曲线分开：曲线不是补造的原始记录。酵母格为0.2×0.2 mm、深0.1 mm，按细胞中心计上左、不计下右；示例只画单细胞。三个重复先求平均再按稀释倍数换算，计数未区分死活。自己的记录从空白开始；缺测不按零处理。超过可辨数量时应重新稀释计数。',
                'Bacteria divide synchronously every 20 min with unlimited resources and no mortality. The logistic curve is separate from historical observations, not invented raw data. Count the 0.2 × 0.2 mm square at 0.1 mm depth: include top/left cell centers, exclude bottom/right. Only single cells are shown. Average three repeats and apply dilution. This count does not establish viability. Personal records start blank; missing is not zero. Dilute and recount overcrowded chambers.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
