import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  embryoClamp as clamp,
  fertilizationFrame,
  cleavageState,
  embryoBatch,
  cycleMatch,
  transferFrame,
  transferPath,
  embryoSplit,
  blastocystCells,
} from '../../models/bio-embryo-engineering';
import '../../styles/bio-embryo-engineering.css';
export default function BioEmbryoEngineering() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    uid = useId().replace(/:/g, ''),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const variants = ['bio-elective-3-060-1', 'bio-elective-3-061-1', 'bio-elective-3-062-1'];
  const [mode0, setMode] = useState(Math.max(0, variants.indexOf(f.variant ?? ''))),
    [view, setView] = useState(0),
    [progress, setProgress] = useState(0.7),
    [mature, setMature] = useState(true),
    [cap, setCap] = useState(true),
    [offset, setOffset] = useState(0),
    [bad, setBad] = useState(false),
    [journal, setJournal] = useState('');
  const mode = f.watch ? Math.min(2, Math.floor(f.chapter / 3)) : mode0,
    local = f.watch ? f.chapter % 3 : view,
    p = f.watch ? f.chapterProgress : progress,
    cx = w / 2,
    ivf = fertilizationFrame(p, f.watch ? true : mature, f.watch ? true : cap),
    cleavage = cleavageState(p),
    match = cycleMatch(7, 7 + (f.watch ? 3 * (1 - clamp(p * 1.7)) : offset)),
    transfer = transferFrame(p, w),
    cut = mode === 2 && local === 2 ? (f.watch ? 33 : bad ? 33 : 0) : 0,
    split = embryoSplit(p, cut),
    cells = blastocystCells();
  const titles = [
    s('成熟、获能与体外受精', 'Maturation, capacitation and IVF'),
    s('胚胎来源与受体条件', 'Embryos and recipient conditions'),
    s('分割线与内细胞团', 'The cut and inner cell mass'),
  ];
  const views = [
    [
      s('两项准备', 'Two preparations'),
      s('接触与受精', 'Contact and fertilization'),
      s('早期卵裂', 'Early cleavage'),
    ],
    [
      s('收集与检查', 'Collection and inspection'),
      s('生理同步', 'Physiological synchrony'),
      s('沿通路移植', 'Transfer through a lumen'),
    ],
    [
      s('囊胚结构', 'Blastocyst structure'),
      s('均衡分割', 'Balanced allocation'),
      s('偏移分割线', 'Offset the cut'),
    ],
  ];
  const sperm = (x: number, y: number, tail = true) => (
    <g transform={`translate(${x} ${y})`}>
      <ellipse rx="5" ry="3.5" fill="#a297b5" />
      {tail && <path d="M5 0q7-7 13 0" fill="none" stroke="#b8abc0" strokeWidth="2" />}
    </g>
  );
  const ring = (r: number, open: boolean) =>
    open
      ? `M${r * Math.cos(0.17)} ${r * Math.sin(0.17)}A${r} ${r} 0 1 1 ${r * Math.cos(-0.17)} ${r * Math.sin(-0.17)}`
      : `M${-r} 0A${r} ${r} 0 1 0 ${r} 0A${r} ${r} 0 1 0 ${-r} 0`;
  const blast = (x: number, y: number) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r="55" fill="#f3e9d8" stroke="#cebda1" strokeWidth="2" />
      <circle r="47" fill="none" stroke="#d7c9b1" strokeWidth="12" />
      {cells.map((a) => (
        <circle
          key={a.id}
          cx={a.x}
          cy={a.y}
          r={a.r}
          fill={a.type === 'ICM' ? '#a28ba7' : '#b9a587'}
        />
      ))}
    </g>
  );
  return (
    <div className="bio-embryo" data-watch={f.watch} ref={host}>
      <div className="bio-embryo-head">{titles[mode]}</div>
      {mode === 0 && (
        <svg
          viewBox={`0 0 ${w} 308`}
          role="img"
          aria-label={s(
            '分别准备卵母细胞与精子，受精后早期卵裂',
            'Separate oocyte and sperm preparation, fertilization and early cleavage',
          )}
        >
          <text x={cx} y="27" textAnchor="middle">
            {views[0][local]}
          </text>
          {local === 0 ? (
            <>
              <g transform={`translate(${w * 0.28} 136)`}>
                <circle r="43" fill="#eee0c6" stroke="#d7c6ac" strokeWidth="6" />
                {(f.watch ? p > 0.45 : mature) ? (
                  <>
                    <path d="M-14 0Q0-14 14 0Q0 14-14 0" stroke="#a59d7e" fill="none" />
                    {[-4, 0, 4].map((x) => (
                      <path
                        key={x}
                        d={`M${x - 2} -3l4 6m0-6-4 6`}
                        stroke="#ac8ea1"
                        strokeWidth="2"
                      />
                    ))}
                  </>
                ) : (
                  <circle r="16" fill="#d0b9ce" />
                )}
              </g>
              <g transform={`translate(${w * 0.76} 133)`}>
                {sperm(0, 0)}
                <circle
                  r={20 + 8 * p}
                  fill="none"
                  stroke="#b8b4c9"
                  strokeWidth="2"
                  strokeDasharray="2 5"
                  opacity={f.watch ? clamp(p * 3) : cap ? 1 : 0}
                />
              </g>
              <text x={w * 0.28} y="205" textAnchor="middle">
                {f.watch
                  ? p > 0.45
                    ? 'MⅡ'
                    : s('未成熟', 'Immature')
                  : mature
                    ? 'MⅡ'
                    : s('未成熟', 'Immature')}
              </text>
              <text x={w * 0.76} y="205" textAnchor="middle">
                {(f.watch ? p > 0.3 : cap) ? s('已获能', 'Capacitated') : s('待获能', 'Not ready')}
              </text>
              <text x={cx} y="276" textAnchor="middle">
                {s('两项准备分别完成', 'Prepare each gamete')}
              </text>
            </>
          ) : local === 1 ? (
            <>
              <g transform={`translate(${cx} 153)`}>
                <path d={ring(85, ivf.zonaPassage)} stroke="#ddcdbb" strokeWidth="7" fill="none" />
                <circle r="55" fill="#eee0c6" />
                <path d={ring(55, ivf.membranePore)} stroke="#bdab8f" strokeWidth="2" fill="none" />
                {ivf.pronuclei < 1 && (
                  <g opacity={1 - ivf.pronuclei}>
                    <path d="M-30 0q10-10 20 0q-10 10-20 0" fill="none" stroke="#a58f9d" />
                  </g>
                )}
                <circle cx={ivf.x} r={5 + 7 * ivf.pronuclei} fill="#aa99bb" />
                {!ivf.fused && (
                  <path
                    d={`M${ivf.x + 5} 0q7-7 13 0`}
                    stroke="#baabc4"
                    strokeWidth="2"
                    fill="none"
                  />
                )}
                <circle cx="-20" r={12 * ivf.pronuclei} fill="#c19baa" />
                {sperm(ivf.secondX, -30)}
                <circle cx="-4" cy="-66" r={6 * ivf.polarBody} fill="#c19baa" />
              </g>
              <text x={cx} y="281" textAnchor="middle">
                {ivf.pronuclei > 0.5
                  ? s('雌、雄原核仍分开', 'Two separate pronuclei')
                  : s('先接触，再越过细胞膜', 'Contact before membrane entry')}
              </text>
            </>
          ) : (
            <>
              <g transform={`translate(${cx} 153)`}>
                <circle r="75" fill="#eee1ca" stroke="#d6c4aa" strokeWidth="6" />
                {cleavage.stage >= 1 && <path d="M0-72V72" stroke="#bba789" strokeWidth="2" />}
                {cleavage.stage >= 2 && <path d="M-72 0H72" stroke="#bba789" strokeWidth="2" />}
                {cleavage.stage >= 3 && (
                  <path d="M-51-51L51 51M51-51-51 51" stroke="#bba789" strokeWidth="2" />
                )}
                {Array.from({ length: cleavage.count }, (_, i) => {
                  const a = ((i + (cleavage.count === 2 ? 0 : 0.5)) * Math.PI * 2) / cleavage.count,
                    r = cleavage.count === 1 ? 0 : cleavage.count === 2 ? 32 : 43;
                  return (
                    <circle
                      key={i}
                      cx={r * Math.cos(a)}
                      cy={r * Math.sin(a)}
                      r="7"
                      fill="#a996b2"
                    />
                  );
                })}
              </g>
              <text x={cx} y="270" textAnchor="middle">
                {cleavage.count} {s('细胞 · 总体积模型=1', 'cells · total volume=1')}
              </text>
            </>
          )}
        </svg>
      )}
      {mode === 1 && (
        <svg
          viewBox={`0 0 ${w} 324`}
          role="img"
          aria-label={s(
            '胚胎质量检查、供受体周期同步与牛子宫角移植示意',
            'Embryo inspection, cycle synchrony and schematic transfer into a bovine uterine horn',
          )}
        >
          <text x={cx} y="27" textAnchor="middle">
            {views[1][local]}
          </text>
          {local === 0 ? (
            <>
              {embryoBatch.map((a, i) => {
                const x = (w * ((i % 3) + 1)) / 4,
                  y = 98 + Math.floor(i / 3) * 117,
                  checked = p > (i + 1) / 7;
                return (
                  <g key={a.id} opacity={checked && a.quality !== 'suitable' ? 0.3 : 1}>
                    <circle cx={x} cy={y} r="26" fill="#f1e4ce" stroke="#d0bea2" />
                    {a.quality === 'unfertilized' ? (
                      <circle cx={x} cy={y} r="8" fill="#b6a1ba" />
                    ) : (
                      Array.from({ length: 8 }, (_, j) => {
                        const k = (j * Math.PI) / 4;
                        return (
                          <circle
                            key={j}
                            cx={x + (a.quality === 'degenerate' ? 13 : 10) * Math.cos(k)}
                            cy={y + 10 * Math.sin(k)}
                            r={a.quality === 'degenerate' ? (j % 2 ? 3 : 7) : 6}
                            fill="#b8a4bd"
                          />
                        );
                      })
                    )}
                    <text x={x} y={y + 49} textAnchor="middle">
                      {a.id}
                      {checked ? (a.quality === 'suitable' ? ' ✓' : ' ×') : ''}
                    </text>
                  </g>
                );
              })}
              <text x={cx} y="311" textAnchor="middle">
                {s('形态合格仍不保证妊娠', 'Morphology ≠ pregnancy')}
              </text>
            </>
          ) : local === 1 ? (
            <>
              {[match.embryo, match.recipient].map((day, i) => (
                <g key={i}>
                  <text x="18" y={81 + i * 100}>
                    {i ? s('受体周期', 'Recipient cycle') : s('胚胎日龄', 'Embryo age')}
                  </text>
                  <path
                    d={`M20 ${104 + i * 100}H${w - 20}`}
                    stroke="#d5c7d3"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {[0, 7, 14].map((v) => (
                    <text
                      key={v}
                      x={20 + ((w - 40) * v) / 14}
                      y={137 + i * 100}
                      textAnchor="middle"
                    >
                      {v}
                    </text>
                  ))}
                  <circle
                    cx={20 + ((w - 40) * day) / 14}
                    cy={104 + i * 100}
                    r="10"
                    fill={i ? '#b6bda0' : '#ab94b1'}
                  />
                  <text x={w - 18} y={81 + i * 100} textAnchor="end">
                    {day.toFixed(1)} d
                  </text>
                </g>
              ))}
              <text x={cx} y="291" textAnchor="middle">
                Δ {match.difference.toFixed(1)} d ·{' '}
                {match.exact ? s('对应', 'Matched') : s('存在偏差', 'Offset')}
              </text>
            </>
          ) : (
            <>
              {[-1, 1].map((sign) => (
                <g key={sign} transform={sign < 0 ? `translate(${w} 0) scale(-1 1)` : undefined}>
                  <path
                    d={`${transferPath(1, w)} Q${cx + 56} 95 ${cx + 78} 84`}
                    stroke="#d5b4c0"
                    strokeWidth="38"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d={`${transferPath(1, w)} Q${cx + 56} 95 ${cx + 78} 84`}
                    stroke="#f3e1df"
                    strokeWidth="22"
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
              ))}
              {[242, 254, 266].map((y) => (
                <path
                  key={y}
                  d={`M${cx - 15} ${y}q15-5 30 0`}
                  stroke="#c39aaa"
                  fill="none"
                  strokeWidth="2"
                />
              ))}
              <ellipse cx={cx + 94} cy="71" rx="11" ry="14" fill="#c4b080" stroke="#ac986d" />
              <text x={cx + 94} y="49" textAnchor="middle">
                CL
              </text>
              <path
                d={transferPath(transfer.tipT, w)}
                fill="none"
                stroke="#aab6b2"
                strokeWidth="10"
              />
              <path
                d={transferPath(transfer.tipT, w)}
                fill="none"
                stroke="#e7eee7"
                strokeWidth="8"
              />
              <circle cx={transfer.embryo.x} cy={transfer.embryo.y} r="3.3" fill="#a18aaa" />
              <text x="16" y="60">
                {s('E1 · 放大示意', 'E1 · enlarged')}
              </text>
              <text x={cx} y="318" textAnchor="middle">
                {s('黄体同侧子宫角', 'Uterine horn on CL side')}
              </text>
            </>
          )}
        </svg>
      )}
      {mode === 2 && (
        <svg
          viewBox={`0 0 ${w} 310`}
          role="img"
          aria-label={s(
            '囊胚滋养层、内细胞团与不同分割线的分配',
            'Blastocyst trophectoderm, inner cell mass and allocation by different cuts',
          )}
        >
          <text x={cx} y="27" textAnchor="middle">
            {views[2][local]}
          </text>
          {local === 0 ? (
            <>
              {blast(cx, 150)}
              <path d={`M${cx - 29} 136L${cx - 64} 80H24`} stroke="#aa8ca9" fill="none" />
              <text x="18" y="66">
                ICM
              </text>
              <path d={`M${cx + 45} 143L${cx + 66} 92H${w - 18}`} stroke="#b6a184" fill="none" />
              <text x={w - 18} y="76" textAnchor="end">
                TE
              </text>
              <text x={cx} y="269" textAnchor="middle">
                {s('内细胞团 · 滋养层 · 囊胚腔', 'ICM · trophectoderm · cavity')}
              </text>
            </>
          ) : (
            <>
              <defs>
                {[0, 1].map((half) => (
                  <clipPath key={half} id={`${uid}-half-${half}`}>
                    <rect
                      x="-60"
                      y={half ? split.cut : -60}
                      width="120"
                      height={half ? 60 - split.cut : 60 + split.cut}
                    />
                  </clipPath>
                ))}
              </defs>
              {[0, 1].map((half) => (
                <g
                  key={half}
                  transform={`translate(${cx} ${152 + (half ? 1 : -1) * split.separation})`}
                >
                  <g clipPath={`url(#${uid}-half-${half})`}>
                    <circle r="55" fill="#f3e9d8" stroke="#cebda1" strokeWidth="2" />
                    <circle r="47" fill="none" stroke="#d7c9b1" strokeWidth="12" />
                    {cells
                      .filter((a) => (a.y < split.cut ? 0 : 1) === half)
                      .map((a) => (
                        <circle
                          key={a.id}
                          cx={a.x}
                          cy={a.y}
                          r={a.r}
                          fill={a.type === 'ICM' ? '#a28ba7' : '#b9a587'}
                        />
                      ))}
                  </g>
                  {split.separation > 0 && (
                    <path
                      d={`M${-split.reach} ${split.cut}H${split.reach}`}
                      stroke="#bba58c"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              ))}
              <path
                d={`M${cx - 85} ${152 + split.cut}H${cx + split.bladeX}`}
                fill="none"
                stroke="#8faaa8"
                strokeWidth="2"
                opacity={1 - clamp((p - 0.6) * 6)}
              />
              <path
                d={`M${cx + split.bladeX - 8} ${142 + split.cut}l8 10-8 10Z`}
                fill="#adc1bf"
                opacity={1 - clamp((p - 0.6) * 6)}
              />
              <text x={cx} y="258" textAnchor="middle">
                ICM {split.counts[0].icm} + {split.counts[1].icm}
              </text>
              <text x={cx} y="289" textAnchor="middle">
                {split.hasBoth
                  ? s('两份均保留内细胞团', 'ICM retained in both')
                  : s('一份缺少内细胞团', 'One half lacks ICM')}
              </text>
            </>
          )}
        </svg>
      )}
      {!f.watch && (
        <div className="bio-embryo-controls">
          <div className="bio-embryo-buttons">
            {titles.map((t, i) => (
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
          <div className="bio-embryo-buttons">
            {views[mode].map((t, i) => (
              <button key={i} aria-pressed={local === i} onClick={() => setView(i)}>
                {t}
              </button>
            ))}
          </div>
          <label>
            {s('过程进度', 'Process')}
            <input
              type="range"
              min="0"
              max="1"
              step=".01"
              value={progress}
              onChange={(e) => setProgress(+e.target.value)}
            />
          </label>
          {mode === 0 && local < 2 && (
            <div className="bio-embryo-buttons">
              <button aria-pressed={mature} onClick={() => setMature(!mature)}>
                {s('卵母细胞成熟', 'Mature oocyte')}: {mature ? '✓' : '×'}
              </button>
              <button aria-pressed={cap} onClick={() => setCap(!cap)}>
                {s('精子获能', 'Sperm capacitation')}: {cap ? '✓' : '×'}
              </button>
            </div>
          )}
          {mode === 1 && local === 1 && (
            <label>
              {s('受体周期偏差', 'Recipient cycle offset')} {offset} d
              <input
                type="range"
                min="-3"
                max="3"
                step=".5"
                value={offset}
                onChange={(e) => setOffset(+e.target.value)}
              />
            </label>
          )}
          {mode === 2 && local === 2 && (
            <button aria-pressed={bad} onClick={() => setBad(!bad)}>
              {bad
                ? s('切线偏移', 'Offset cut')
                : s('切线通过内细胞团中部', 'Cut through ICM centre')}
            </button>
          )}
          <details>
            <summary>{s('模型范围与自己的记录', 'Model scope and your observations')}</summary>
            <p>
              {s(
                '家畜教学示意。日龄对应不能预测妊娠；40个来源标记不是实际细胞计数。分割后并非每份都能发育，真实调查和观察记录留空。',
                'Livestock teaching schematic. Cycle alignment does not predict pregnancy. Forty origin markers are not real cell counts. Split portions need not develop; actual observations remain blank.',
              )}
            </p>
            <label>
              {s('观察、条件与证据', 'Observations, conditions and evidence')}
              <textarea value={journal} onChange={(e) => setJournal(e.target.value)} />
            </label>
          </details>
        </div>
      )}
    </div>
  );
}
