import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { signalPathPoint } from '../../models/bio-chemical-signals';
import {
  fermentClamp as clamp,
  fermentationState,
  pickleState,
  jarGeometry,
  nitriteResult,
  sampleMotion,
  reactorState,
  scaleGeometry,
} from '../../models/bio-fermentation-pathways';
import '../../styles/bio-fermentation-pathways.css';
export default function BioFermentationPathways() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    uid = useId(),
    s = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
  const variants = [
    'bio-elective-3-006-1',
    'bio-elective-3-006-2',
    'bio-elective-3-007-1',
    'bio-elective-3-008-1',
    'bio-elective-3-mechanism-24',
  ];
  const [mode0, setMode] = useState(Math.max(0, variants.indexOf(f.variant ?? ''))),
    [view, setView] = useState(0),
    [progress, setProgress] = useState(0.65),
    [sealed, setSealed] = useState(true),
    [salt, setSalt] = useState(5),
    [air, setAir] = useState(true),
    [stir, setStir] = useState(true),
    [cool, setCool] = useState(true),
    [scale, setScale] = useState(2),
    [absorbance, setAbsorbance] = useState(''),
    [journal, setJournal] = useState('');
  const mode = f.watch
      ? f.chapter < 2
        ? 0
        : f.chapter < 4
          ? 1
          : f.chapter < 7
            ? 2
            : f.chapter < 9
              ? 3
              : 4
      : mode0,
    local = f.watch ? f.chapter - [0, 2, 4, 7, 9][mode] : Math.min(view, [1, 1, 2, 1, 2][mode]),
    p = f.watch ? f.chapterProgress : progress;
  const seal = f.watch ? true : sealed,
    oxygen = f.watch ? (mode === 4 && local === 1 ? p < 0.5 : true) : air,
    mixing = f.watch ? true : stir,
    cooling = f.watch ? (local === 2 ? p >= 0.5 : true) : cool;
  const jar = jarGeometry(w),
    pick = pickleState(p * 14, f.watch ? 5 : salt, seal),
    wine = fermentationState(local === 0 ? p : 1, local === 2 ? p : 0, oxygen),
    sample = sampleMotion(p, w),
    assay = nitriteResult(f.watch ? '.068' : absorbance),
    reactor = reactorState(p * 20, oxygen ? 1 : 0, mixing ? 1 : 0, cooling),
    size = scaleGeometry(f.watch ? 1 + p * 3 : scale);
  const cx = w * 0.46,
    half = Math.min(65, w * 0.24),
    left = cx - half,
    right = cx + half;
  const titles = [
    s('泡菜：液面与水封', 'Pickles: brine and seal'),
    s('亚硝酸盐：取样与校准', 'Nitrite: sample and calibration'),
    s('果酒 → 果醋', 'Wine → vinegar'),
    s('从小瓶到生产罐', 'From bottle to production'),
    s('发酵罐：连接与调控', 'Reactor: paths and control'),
  ];
  const labels = [
    [s('水封剖面', 'Water seal'), s('糖与乳酸', 'Sugar and lactate')],
    [s('移取提取液', 'Transfer extract'), s('同批标准与空白', 'Standards and blank')],
    [
      s('酒精发酵', 'Alcoholic fermentation'),
      s('留出排气通路', 'Provide a gas outlet'),
      s('换成有氧条件', 'Supply oxygen'),
    ],
    [s('几何放大', 'Geometric scaling'), s('流程调查', 'Process investigation')],
    [
      s('通气与搅拌', 'Air and mixing'),
      s('供氧对照', 'Oxygen comparison'),
      s('冷却对照', 'Cooling comparison'),
    ],
  ];
  const pipe = (d: string, color = '#a7b6b1', width = 9) => (
    <>
      <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinejoin="round" />
      <path d={d} stroke="#f7f7ec" strokeWidth={width - 4} fill="none" strokeLinejoin="round" />
    </>
  );
  return (
    <div className="bio-ferment" data-watch={f.watch} ref={host}>
      <div className="bio-ferment-head">{titles[mode]}</div>
      {mode === 0 && (
        <svg
          viewBox={`0 0 ${w} 300`}
          role="img"
          aria-label={s(
            '菜料浸没在盐水下，坛盖裙边插入外侧水槽',
            'Vegetables under brine; lid skirt submerged in the outer water trough',
          )}
        >
          <defs>
            <clipPath id={`${uid}-jar`}>
              <path d={`${jar.body}Z`} />
            </clipPath>
          </defs>
          <path d={`${jar.body}Z`} fill="#e5d9b8" stroke="#b4a487" strokeWidth="3" />
          <g clipPath={`url(#${uid}-jar)`}>
            <rect x={jar.left} y="138" width={jar.half * 2} height="115" fill="#ccdbc0" />
            {Array.from({ length: 11 }, (_, i) => (
              <g
                key={i}
                transform={`translate(${jar.cx - jar.half + 18 + (i % 3) * (jar.half - 18)} ${159 + Math.floor(i / 3) * 23}) rotate(${i % 2 ? 18 : -16})`}
              >
                <rect width="12" height="24" rx="6" fill={i % 3 ? '#b0bf85' : '#d8b68c'} />
                <path d="M6 3v18" stroke="#e5e8c9" />
              </g>
            ))}
            <path d={`M${jar.left} 138H${jar.right}`} stroke="#93af9c" strokeWidth="2" />
          </g>
          {/* Annular trough is seen in two connected cross-sections, separate from food brine. */}
          {[jar.cx - 50, jar.cx + 34].map((x, i) => (
            <g key={i}>
              <path d={`M${x} 78v28h16V78`} stroke="#b4a487" strokeWidth="5" fill="#ede2c6" />
              <path d={`M${x + 3} 92h10v11h-10Z`} fill={seal ? '#a9c9c5' : '#ede2c6'} />
            </g>
          ))}
          <path
            d={`M${jar.cx - 42} 98V76Q${jar.cx} 45 ${jar.cx + 42} 76V98`}
            fill="#eee2c4"
            stroke="#b4a487"
            strokeWidth="4"
          />
          <path d={`M${jar.cx - 8} 58q0-13 16 0`} fill="none" stroke="#b4a487" strokeWidth="5" />
          <text x={w / 2} y="28" textAnchor="middle">
            {s('菜料浸没 · 上方留空间', 'Food submerged · headspace')}
          </text>
          <text x={w / 2} y="282" textAnchor="middle">
            {local === 0
              ? seal
                ? s('水封完整', 'Water seal present')
                : s('水槽干涸：增加空气暴露', 'Dry trough: air exposure')
              : s(
                  `示意乳酸转化 ${(pick.lactate * 100).toFixed(0)}%`,
                  `Illustrative conversion ${(pick.lactate * 100).toFixed(0)}%`,
                )}
          </text>
          {local === 1 && (
            <g>
              <rect
                x={jar.left + 8}
                y="244"
                width={(jar.half * 2 - 16) * (1 - pick.lactate)}
                height="5"
                rx="2"
                fill="#e4c78a"
              />
              <rect
                x={jar.left + 8 + (jar.half * 2 - 16) * (1 - pick.lactate)}
                y="244"
                width={(jar.half * 2 - 16) * pick.lactate}
                height="5"
                rx="2"
                fill="#a986a4"
              />
            </g>
          )}
        </svg>
      )}
      {mode === 1 && (
        <svg
          viewBox={`0 0 ${w} ${local === 0 ? 348 : 300}`}
          role="img"
          aria-label={s(
            '提取液移取、同批空白标准和吸光度换算',
            'Extract transfer, matched blank and standards, and absorbance calculation',
          )}
        >
          {local === 0 ? (
            <>
              <text x={w / 2} y="302" textAnchor="middle">
                {s('提取液的定量移取', 'Transfer a measured aliquot')}
              </text>
              {[w * 0.24, w * 0.76].map((x, i) => (
                <g key={i}>
                  <path
                    d={`M${x - 25} 153V238q25 17 50 0V153`}
                    fill="#f4f4e9"
                    stroke="#b4c2b7"
                    strokeWidth="2"
                  />
                  <path
                    d={`M${x - 23} ${i ? 238 - sample.sample * 10 : 238 - sample.source * 1.25}H${x + 23}V237q-23 14-46 0Z`}
                    fill="#c8d7ae"
                  />
                  <text x={x} y="273" textAnchor="middle">
                    {i ? `${sample.sample.toFixed(1)} mL` : `${sample.source.toFixed(1)} mL`}
                  </text>
                </g>
              ))}
              <g transform={`translate(${sample.x} ${sample.y})`}>
                <path d="M-4-57v43L0 0l4-14v-43" fill="#f8f9f0" stroke="#aabbb5" strokeWidth="2" />
                <path
                  d={`M-2 ${-13 - sample.pipette * 7}v${sample.pipette * 7}l2 9 2-9v${-sample.pipette * 7}Z`}
                  fill="#afc49d"
                />
                <ellipse cy="-64" rx="8" ry="13" fill="#9fae9c" />
              </g>
              <text x={w / 2} y="330" textAnchor="middle">
                {s('示例：10 g 样品 → 50 mL', 'Example: 10 g → 50 mL')}
              </text>
            </>
          ) : (
            <>
              <text x={w / 2} y="26" textAnchor="middle">
                {s('示例标准：以 NO₂⁻ 计', 'Standards as NO₂⁻')}
              </text>
              {[0, 2, 4, 6, 10].map((c, i) => {
                const x = 28 + (i * (w - 56)) / 4;
                return (
                  <g key={i}>
                    <path d={`M${x - 9} 64v82q9 10 18 0V64`} fill="#f6f6ed" stroke="#aab8ad" />
                    <path
                      d={`M${x - 7} 95v50q7 7 14 0V95Z`}
                      fill="#b56d8c"
                      opacity={0.08 + c * 0.07}
                    />
                    <text x={x} y="177" textAnchor="middle">
                      {c}
                    </text>
                  </g>
                );
              })}
              <text x={w / 2} y="204" textAnchor="middle">
                mg/L · A = 0.020 + 0.040 C
              </text>
              <text x={w / 2} y="241" textAnchor="middle">
                {assay
                  ? `A ${f.watch ? '0.068' : absorbance} → ${assay.foodMgKg.toFixed(1)} mg/kg`
                  : s('个人吸光度：尚未记录', 'No personal reading yet')}
              </text>
              <text x={w / 2} y="278" textAnchor="middle">
                {s('提取液另稀释 2 倍', 'Extract additionally diluted ×2')}
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
            '果酒二氧化碳沿瓶颈和排气管逸出；果醋氧气通过纱布进入',
            'Wine carbon dioxide exits through the neck and airlock; oxygen enters through gauze for vinegar',
          )}
        >
          <defs>
            <clipPath id={`${uid}-wine`}>
              <path d={`${jar.body}Z`} />
            </clipPath>
          </defs>
          <path d={`${jar.body}Z`} fill="#f2f0dd" stroke="#b7bca6" strokeWidth="2" />
          <g clipPath={`url(#${uid}-wine)`}>
            <rect
              x={jar.left}
              y="152"
              width={jar.half * 2}
              height="100"
              fill={local === 2 ? '#d6ad83' : '#b88d9b'}
            />
            <path d={`M${jar.left} 152H${jar.right}`} stroke="#a37788" />
          </g>
          {local < 2 ? (
            <>
              <rect x={jar.cx - 32} y="84" width="64" height="9" rx="3" fill="#beb59a" />
              {pipe(`M${jar.cx} 102V64H${jar.cx + 30}V88H${jar.cx + 49}V49`)}
              <path
                d={`M${jar.cx + 30} 80V88H${jar.cx + 49}V80`}
                fill="none"
                stroke="#acc8c3"
                strokeWidth="5"
              />
              {Array.from({ length: 5 }, (_, i) => {
                const q = clamp((p - i * 0.1) / 0.55),
                  point = signalPathPoint(jar.gas, q);
                return (
                  <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r="2.4"
                    stroke="#fbf6e8"
                    fill="#cddbd1"
                    opacity={q > 0 && q < 1 ? 1 : 0}
                  />
                );
              })}
            </>
          ) : (
            <>
              <path
                d={`M${jar.cx - 33} 86h66`}
                stroke="#c3c8b7"
                strokeWidth="8"
                strokeDasharray={oxygen ? '3 2' : undefined}
              />
              {oxygen &&
                Array.from({ length: 5 }, (_, i) => {
                  const q = clamp((p - i * 0.1) / 0.55);
                  return (
                    <circle
                      key={i}
                      cx={jar.cx - 20 + i * 10}
                      cy={45 + q * 117}
                      r="3"
                      fill="#8eafb5"
                      opacity={q > 0 && q < 1 ? 1 : 0}
                    />
                  );
                })}
              <text x={jar.cx + 52} y="60">
                {oxygen ? 'O₂' : ''}
              </text>
            </>
          )}
          <text x={w / 2} y="27" textAnchor="middle">
            {local === 2
              ? s('醋酸菌 · 通气', 'Acetic acid bacteria · air')
              : s('酵母 · 产气并排气', 'Yeast · generate and vent CO₂')}
          </text>
          <text x={w / 2} y="278" textAnchor="middle">
            {local === 2
              ? s(
                  `乙醇 ${wine.ethanol.toFixed(2)} → 乙酸 ${wine.acetate.toFixed(2)}`,
                  `Ethanol ${wine.ethanol.toFixed(2)} → acid ${wine.acetate.toFixed(2)}`,
                )
              : s(
                  `葡萄糖 ${wine.glucose.toFixed(2)} → 乙醇 ${wine.ethanol.toFixed(2)}`,
                  `Glucose ${wine.glucose.toFixed(2)} → ethanol ${wine.ethanol.toFixed(2)}`,
                )}
          </text>
          <text x={w / 2} y="303" textAnchor="middle">
            {s('物质的量 / mol · 理想反应', 'Amount / mol · ideal reaction')}
          </text>
        </svg>
      )}
      {mode === 3 && (
        <svg
          viewBox={`0 0 ${w} 285`}
          role="img"
          aria-label={s(
            '放大后体积与散热面积变化，以及生产流程调查',
            'Scaling changes volume relative to heat-transfer area; investigate the production process',
          )}
        >
          {local === 0 ? (
            <>
              {[1, Math.cbrt(size.volume)].map((v, i) => {
                const x = i ? w * 0.7 : w * 0.23,
                  h = 34 * v,
                  b = h * 0.6;
                return (
                  <g key={i}>
                    <rect
                      x={x - b / 2}
                      y={210 - h}
                      width={b}
                      height={h}
                      rx={8 * v}
                      fill="#d1c8ad"
                      stroke="#a8a68d"
                    />
                    <rect
                      x={x - b / 2 + 4}
                      y={210 - h * 0.7}
                      width={b - 8}
                      height={h * 0.65}
                      rx="6"
                      fill="#c0ccab"
                    />
                    <path d={`M${x} ${210 - h}v${-6 * v}`} stroke="#a8a68d" strokeWidth="4" />
                    <text x={x} y="247" textAnchor="middle">
                      {i ? `${size.volume.toFixed(1)} ×` : '1.0 ×'}
                    </text>
                  </g>
                );
              })}
              <text x={w / 2} y="30" textAnchor="middle">
                {s('放大：面积增长慢于体积', 'Area grows slower than volume')}
              </text>
              <text x={w / 2} y="277" textAnchor="middle">
                A/V: {(size.areaPerVolume / 6).toFixed(2)} ×
              </text>
            </>
          ) : (
            <>
              {[
                s('菌种与种子培养', 'Strain and seed culture'),
                s('培养基与设备灭菌', 'Medium / sterilization'),
                s('发酵与过程控制', 'Fermentation / control'),
                s('分离、提纯、质量检验', 'Recovery / quality checks'),
              ].map((label, i) => (
                <g key={i} opacity={0.35 + 0.65 * clamp(p * 4 - i)}>
                  <path d={`M24 ${51 + i * 58}H${w - 24}`} stroke="#d5d7c2" strokeWidth="2" />
                  <circle cx="24" cy={51 + i * 58} r="5" fill="#a9ba94" />
                  <text x="38" y={44 + i * 58}>
                    {label}
                  </text>
                </g>
              ))}
            </>
          )}
        </svg>
      )}
      {mode === 4 && (
        <svg
          viewBox={`0 0 ${w} 308`}
          role="img"
          aria-label={s(
            '空气从底部散气器进入，电机轴连接叶轮，冷却夹套与培养液分离',
            'Air enters through a bottom sparger; a motor shaft joins impellers; cooling jacket is separate from broth',
          )}
        >
          <defs>
            <clipPath id={`${uid}-reactor`}>
              <rect x={left} y="89" width={half * 2} height="153" rx="19" />
            </clipPath>
          </defs>
          <rect
            x={left - 10}
            y="102"
            width={half * 2 + 20}
            height="146"
            rx="8"
            fill={cooling ? '#cee0da' : '#ebe6d5'}
            stroke="#b3c6bc"
          />
          <rect
            x={left}
            y="89"
            width={half * 2}
            height="153"
            rx="19"
            fill="#f8f7e9"
            stroke="#aab8a4"
            strokeWidth="2"
          />
          <g clipPath={`url(#${uid}-reactor)`}>
            <rect x={left} y="142" width={half * 2} height="101" fill="#c4cda8" />
          </g>
          {pipe(`M20 258H${cx - 22}V223H${cx + 24}`)}
          <path d={`M${cx - 18} 222h38`} stroke="#94aaa0" strokeWidth="5" strokeDasharray="2 5" />
          {pipe(`M${cx + 28} 103V69H${w - 18}V52`)}
          <rect x={cx - 15} y="56" width="30" height="25" rx="5" fill="#a6b8a4" />
          <path d={`M${cx} 81V213`} stroke="#91a491" strokeWidth="4" />
          {[165, 198].map((y) => (
            <path
              key={y}
              d={`M${cx - 29 * Math.cos(p * (mixing ? 18 : 0))} ${y - 4}L${cx + 29 * Math.cos(p * (mixing ? 18 : 0))} ${y + 4}`}
              stroke="#8d9f88"
              strokeWidth="8"
              strokeLinecap="round"
            />
          ))}
          {oxygen &&
            Array.from({ length: 12 }, (_, i) => {
              const q = (p * 0.9 + i / 12) % 1,
                points = [
                  { x: cx - 18 + (i % 6) * 7, y: 220 },
                  { x: cx - 18 + (i % 6) * 7, y: 145 },
                  { x: cx + 28, y: 110 },
                  { x: cx + 28, y: 69 },
                  { x: w - 18, y: 69 },
                  { x: w - 18, y: 52 },
                ],
                a = signalPathPoint(points, q);
              return <circle key={i} cx={a.x} cy={a.y} r="2.1" fill="#eff8e9" stroke="#94b4b0" />;
            })}
          <path
            d={`M${right + 6} 233H${w - 12}M${left - 5} 119H13`}
            fill="none"
            stroke={cooling ? '#8eb7bf' : '#c8c7b4'}
            strokeWidth="6"
          />
          {cooling &&
            [0, 0.2, 0.4, 0.6, 0.8].map((offset, i) => {
              const a = signalPathPoint(
                [
                  { x: w - 12, y: 233 },
                  { x: right + 6, y: 233 },
                  { x: right + 6, y: 244 },
                  { x: left - 6, y: 244 },
                  { x: left - 6, y: 119 },
                  { x: 13, y: 119 },
                ],
                (p + offset) % 1,
              );
              return <circle key={i} cx={a.x} cy={a.y} r="2" fill="#6fa1ac" />;
            })}
          <path d={`M${right + 12} 178H${right - 14}`} stroke="#b49c86" strokeWidth="3" />
          <circle cx={right - 14} cy="178" r="4" fill="#b49c86" />
          <text x={w / 2} y="27" textAnchor="middle">
            {local === 1
              ? oxygen
                ? s('通气开启', 'Air supplied')
                : s('停止通气', 'Air stopped')
              : local === 2
                ? cooling
                  ? s('冷却开启', 'Cooling on')
                  : s('冷却关闭', 'Cooling off')
                : s('气路、叶轮、夹套各自连通', 'Connected flow paths')}
          </text>
          <text x={w / 2} y="281" textAnchor="middle">
            DO {reactor.oxygen.toFixed(2)} mg/L · {reactor.temp.toFixed(1)} °C
          </text>
          <text x={w / 2} y="305" textAnchor="middle">
            {s('示意参数 · 非生产设定', 'Illustrative, not process settings')}
          </text>
        </svg>
      )}
      {!f.watch && (
        <div className="bio-ferment-controls">
          <div className="bio-ferment-buttons">
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
          <div className="bio-ferment-buttons">
            {labels[mode].map((t, i) => (
              <button key={i} aria-pressed={local === i} onClick={() => setView(i)}>
                {t}
              </button>
            ))}
          </div>
          <label>
            {s('过程位置', 'Process position')}
            <input
              aria-label={s('过程位置', 'Process position')}
              type="range"
              min="0"
              max="1"
              step=".005"
              value={progress}
              onChange={(e) => setProgress(+e.target.value)}
            />
          </label>
          {mode === 0 && (
            <>
              <button aria-pressed={sealed} onClick={() => setSealed(!sealed)}>
                {sealed ? s('水槽有水', 'Trough filled') : s('水槽干涸', 'Trough dry')}
              </button>
              {local === 1 && (
                <label>
                  {s('示意盐浓度', 'Illustrative salt')} {salt}%
                  <input
                    type="range"
                    min="5"
                    max="20"
                    step="1"
                    value={salt}
                    onChange={(e) => setSalt(+e.target.value)}
                  />
                </label>
              )}
            </>
          )}
          {mode === 1 && (
            <label>
              {s('个人样品吸光度（空白 0.020）', 'Own sample absorbance (blank 0.020)')}
              <input
                type="number"
                min=".02"
                max=".42"
                step=".001"
                value={absorbance}
                onChange={(e) => setAbsorbance(e.target.value)}
                placeholder={s('尚未测量', 'Not measured')}
              />
            </label>
          )}
          {((mode === 2 && local === 2) || mode === 4) && (
            <button aria-pressed={air} onClick={() => setAir(!air)}>
              {air ? s('供氧开启', 'Oxygen on') : s('供氧关闭', 'Oxygen off')}
            </button>
          )}
          {mode === 3 && local === 0 && (
            <label>
              {s('相似罐线性倍数', 'Linear scale factor')} {scale.toFixed(1)}
              <input
                type="range"
                min="1"
                max="4"
                step=".1"
                value={scale}
                onChange={(e) => setScale(+e.target.value)}
              />
            </label>
          )}
          {mode === 4 && (
            <div className="bio-ferment-buttons">
              <button aria-pressed={stir} onClick={() => setStir(!stir)}>
                {stir ? s('搅拌开启', 'Mixing on') : s('搅拌关闭', 'Mixing off')}
              </button>
              <button aria-pressed={cool} onClick={() => setCool(!cool)}>
                {cool ? s('冷却开启', 'Cooling on') : s('冷却关闭', 'Cooling off')}
              </button>
            </div>
          )}
          <details>
            <summary>{s('实验条件与个人记录', 'Conditions and own records')}</summary>
            <p>
              {s(
                '反应计量、比色参数和传质参数是教学简化。果酒图采用可控排气装置示意，教材原图为定期松盖瓶。亚硝酸盐色度校准以 NO₂⁻ 计，示例不等于食品标准方法、真实检测或可食用判断。',
                'Stoichiometry, color calibration and transport parameters are simplified. The wine view uses an airlock; the textbook uses scheduled cap loosening. Nitrite calibration is expressed as NO₂⁻; this example is neither an official food method nor a measurement or edibility assessment.',
              )}
            </p>
            <label>
              {s('样品、时间、条件、方法与资料出处', 'Sample, date, conditions, method and source')}
              <textarea
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                placeholder={s('自己的记录从这里开始', 'Start your own record here')}
              />
            </label>
          </details>
        </div>
      )}
    </div>
  );
}
