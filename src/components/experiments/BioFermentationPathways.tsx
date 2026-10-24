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
  vinegarHistory,
  type ReactorEvent,
  scaleGeometry,
  nitrogenPercentages,
  fermentationDirector,
  nitritePools,
  nitrogenMarker,
  nitriteRecord,
  PICKLE_TEXTBOOK_SERIES,
  fermentationCarbon,
  reactorHistory,
} from '../../models/bio-fermentation-pathways';
import '../../styles/bio-fermentation-pathways.css';
export default function BioFermentationPathways() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    uid = useId(),
    s = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
  const [manualChapter, setManualChapter] = useState<number | null>(null),
    [choices, setChoices] = useState<
      Record<
        number,
        Partial<{
          time: number;
          sealed: boolean;
          salt: number;
          air: boolean;
          stir: boolean;
          cool: boolean;
          scale: number;
          removal: number;
          events: ReactorEvent[];
          vinegarEvents: ReactorEvent[];
        }>
      >
    >({}),
    [absorbance, setAbsorbance] = useState(''),
    [day, setDay] = useState(''),
    [dilution, setDilution] = useState(2),
    [records, setRecords] = useState<NonNullable<ReturnType<typeof nitriteRecord>>[]>([]),
    [journal, setJournal] = useState('');
  const chapter = f.watch ? f.chapter : (manualChapter ?? f.chapter),
    duration = (f.chapters[chapter + 1]?.at ?? f.duration) - (f.chapters[chapter]?.at ?? 0),
    own = choices[chapter] ?? {},
    time = f.watch
      ? f.chapterTime
      : (own.time ?? (manualChapter === null ? f.chapterTime : duration * 0.65)),
    d = fermentationDirector(chapter, time, browserLocale()),
    mode = d.mode,
    local = d.local,
    p = d.p,
    progress = d.process,
    put = (value: Partial<typeof own>) => {
      // The first edit owns the complete visible shot, including its input history.
      // Watch can then reset its clock without moving this separate exploration.
      setManualChapter(chapter);
      setChoices((v) => ({
        ...v,
        [chapter]: {
          time,
          sealed: seal,
          salt,
          air: oxygen,
          stir: mixing,
          cool: cooling,
          scale: Math.cbrt(size.volume),
          removal,
          events: activeEvents.map((event) => ({ ...event })),
          vinegarEvents: vinegarEvents.map((event) => ({ ...event })),
          ...value,
        },
      }));
    },
    inherited = manualChapter === null,
    seal = f.watch ? d.sealed : (own.sealed ?? (inherited ? d.sealed : true)),
    airChoice = f.watch ? d.oxygen : (own.air ?? (inherited ? d.oxygen : true)),
    mixChoice = f.watch ? true : (own.stir ?? true),
    coolChoice = f.watch ? d.cooling : (own.cool ?? (inherited ? d.cooling : true)),
    salt = f.watch
      ? d.saltComparison
        ? 15
        : 5
      : (own.salt ?? (inherited && d.saltComparison ? 15 : 5)),
    removal = f.watch ? d.rate : (own.removal ?? (inherited ? d.rate : 0.48)),
    jar = jarGeometry(w),
    pick = pickleState(p * 14, salt, seal),
    vinegarEvents = f.watch
      ? [{ at: d.vinegarStopAt, air: 0 }]
      : (own.vinegarEvents ?? (inherited ? [{ at: d.vinegarStopAt, air: 0 }] : [])),
    vinegar = vinegarHistory(time, vinegarEvents),
    wine = fermentationState(1, vinegar.extent, true),
    sample = sampleMotion(progress, w),
    assay = nitriteResult(
      f.watch ? '.068' : absorbance,
      0.02,
      0.04,
      50,
      10,
      f.watch ? 2 : dilution,
    ),
    presetEvents: ReactorEvent[] =
      chapter === 10
        ? [{ at: d.airStopAt, air: 0 }]
        : chapter === 11
          ? [
              { at: 0, cool: false },
              { at: d.coolingOnAt, cool: true },
            ]
          : [],
    activeEvents = f.watch ? presetEvents : (own.events ?? (inherited ? presetEvents : [])),
    reactor = reactorHistory(d.reactorTime, { events: activeEvents }),
    oxygen = mode === 4 ? reactor.air > 0 : chapter === 6 ? vinegar.air > 0 : airChoice,
    mixing = mode === 4 ? reactor.mix > 0 : mixChoice,
    cooling = mode === 4 ? reactor.cooling : coolChoice,
    changeDriver = (event: Omit<ReactorEvent, 'at'>) =>
      put({
        events: [
          ...activeEvents.filter((e) => e.at < time - 1e-9),
          { at: time, air: reactor.air, mix: reactor.mix, cool: reactor.cooling, ...event },
        ],
      }),
    size = scaleGeometry(f.watch ? d.scale : (own.scale ?? (inherited ? d.scale : 2)));
  const cx = w * 0.46,
    half = Math.min(65, w * 0.24),
    left = cx - half,
    right = cx + half;
  const pipe = (d: string, color = '#a7b6b1', width = 9) => (
    <>
      <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinejoin="round" />
      <path d={d} stroke="#f7f7ec" strokeWidth={width - 4} fill="none" strokeLinejoin="round" />
    </>
  );
  return (
    <div
      className="bfp21"
      data-watch={f.watch}
      data-chapter={chapter}
      data-shot={d.shot}
      data-time={time}
      data-oxygen={reactor.oxygen}
      data-temperature={reactor.temp}
      data-salt={salt}
      data-lactate={pickleState(10, salt).lactate}
      data-ethanol={wine.ethanol}
      data-acetate={wine.acetate}
      ref={host}
    >
      {mode === 0 && local === 0 && (
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
            {s('盐水浸没菜料', 'Vegetables below brine')}
          </text>
          <text x={w / 2} y="282" textAnchor="middle">
            {local === 0
              ? seal
                ? s('水封完整', 'Water seal present')
                : s('水槽干涸', 'Dry sealing trough')
              : s(
                  `示意乳酸转化 ${(pick.lactate * 100).toFixed(0)}%`,
                  `Illustrative conversion ${(pick.lactate * 100).toFixed(0)}%`,
                )}
          </text>
        </svg>
      )}
      {chapter === 1 && <CarbonPath w={w} p={progress} kind="lactate" s={s} />}
      {chapter === 1 && (
        <div className="bfp21-note">
          {s('固定时间的转化', 'Fixed-time conversion')}:{' '}
          {Math.round(pickleState(10, salt).lactate * 100)}% · {s('盐', 'salt')} {salt}%
        </div>
      )}
      {mode === 1 && (
        <>
          {d.shot === 'sample' ? (
            <svg
              viewBox={`0 0 ${w} 300`}
              role="img"
              aria-label={s('独立时点样品的体积收支', 'Volume account of one time-point sample')}
            >
              <text x={w / 2} y="270" textAnchor="middle">
                {s('同一时点样品', 'One time-point sample')}
              </text>
              {[w * 0.24, w * 0.76].map((x, i) => (
                <g key={i}>
                  <path
                    d={`M${x - 25} 129V214q25 17 50 0V129`}
                    fill="#f4f4e9"
                    stroke="#b4c2b7"
                    strokeWidth="2"
                  />
                  <defs>
                    <clipPath id={`${uid}-sample-${i}`}>
                      <path d={`M${x - 23} 130V213q23 14 46 0V130Z`} />
                    </clipPath>
                  </defs>
                  {(i ? sample.sample : sample.source) > 0 && (
                    <rect
                      data-sample-liquid={i ? 'receiver' : 'source'}
                      x={x - 23}
                      y={i ? 214 - sample.sample * 10 : 214 - sample.source * 1.25}
                      width="46"
                      height={11 + (i ? sample.sample * 10 : sample.source * 1.25)}
                      fill="#c8d7ae"
                      clipPath={`url(#${uid}-sample-${i})`}
                    />
                  )}
                  <text x={x} y="247" textAnchor="middle">
                    {i ? `${sample.sample.toFixed(1)} mL` : `${sample.source.toFixed(1)} mL`}
                  </text>
                </g>
              ))}
              <g transform={`translate(${sample.x} ${sample.y - 24})`}>
                <path d="M-4-57v43L0 0l4-14v-43" fill="#f8f9f0" stroke="#aabbb5" strokeWidth="2" />
                {sample.pipette > 0 && (
                  <path
                    d={`M-2 ${-13 - sample.pipette * 7}v${sample.pipette * 7}l2 9 2-9v${-sample.pipette * 7}Z`}
                    fill="#afc49d"
                  />
                )}
                <ellipse cy="-64" rx="8" ry="13" fill="#9fae9c" />
              </g>
              {progress > 0.75 && progress < 1 && (
                <path
                  d={`M${sample.x} ${sample.y - 24}V${214 - sample.sample * 10}`}
                  stroke="#afc49d"
                  strokeWidth="2"
                  fill="none"
                />
              )}
              <text x={w / 2} y="296" textAnchor="middle">
                {s('示例：10 g 样品 → 50 mL', 'Example: 10 g → 50 mL')}
              </text>
            </svg>
          ) : d.shot === 'records' ? (
            <NitriteRecords w={w} s={s} shown={d.recordsShown} />
          ) : d.shot === 'calibration' ? (
            <Calibration w={w} s={s} assay={assay} reading={f.watch ? '.068' : absorbance} />
          ) : (
            <Nitrogen
              w={w}
              s={s}
              time={d.process * 12}
              removal={removal}
              reveal={d.showPrediction}
              predict={d.shot === 'prediction'}
            />
          )}
        </>
      )}
      {chapter === 4 && <CarbonPath w={w} p={progress} kind="ethanol" s={s} />}
      {mode === 2 && local !== 0 && (
        <svg
          viewBox={`0 0 ${w} 300`}
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
              ? oxygen
                ? s('醋酸菌 · 需氧', 'Acetic bacteria · oxygen')
                : s('停氧：已生成产物保留', 'Oxygen off · products remain')
              : s('酵母 · 排出 CO₂', 'Yeast · CO₂ outlet')}
          </text>
          <text x={w / 2} y="278" textAnchor="middle">
            {local === 2
              ? s(
                  `乙醇 ${wine.ethanol.toFixed(2)} → 乙酸 ${wine.acetate.toFixed(2)}`,
                  `Ethanol ${wine.ethanol.toFixed(2)} → acid ${wine.acetate.toFixed(2)}`,
                )
              : s(`乙醇 2.00 · 二氧化碳 2.00`, `Ethanol 2.00 · CO₂ 2.00`)}
          </text>
          <text x={w / 2} y="297" textAnchor="middle">
            {s('净反应 · mol', 'Net reaction · mol')}
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
          className="bfp21-reactor"
          viewBox={`0 0 ${w} 288`}
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
              d={`M${cx - 29 * Math.cos(reactor.shaftPhase)} ${y - 4}L${cx + 29 * Math.cos(reactor.shaftPhase)} ${y + 4}`}
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
            {local === 2 ? `${reactor.temp.toFixed(1)} °C` : `O₂ ${reactor.oxygen.toFixed(2)} mg/L`}
          </text>
        </svg>
      )}
      {mode === 4 && (
        <div
          className="bfp21-budget"
          data-transferred={reactor.transferred}
          data-consumed={reactor.consumed}
        >
          {local === 2
            ? s('产热 − 移出 = 温度变化', 'Heat in − heat out = change')
            : s('初始 + 传入 − 消耗 = 存量', 'Initial + input − use = stock')}
        </div>
      )}
      {!f.watch && (
        <div className="bfp21-controls">
          <label>
            {s('观察主题', 'View')}
            <select
              value={chapter}
              onChange={(e) => {
                put({});
                setManualChapter(+e.target.value);
              }}
            >
              {f.chapters.map((c, i) => (
                <option key={c.id} value={i}>
                  {browserLocale() === 'en' ? c.titleEn : c.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            {s('本章时间', 'Chapter time')}
            <input
              aria-label={s('本章时间', 'Chapter time')}
              type="range"
              min="0"
              max={duration}
              step=".1"
              value={time}
              onChange={(e) => put({ time: +e.target.value })}
            />
          </label>
          {mode === 0 && (
            <>
              <button aria-pressed={seal} onClick={() => put({ sealed: !seal })}>
                {s('水槽有水', 'Trough filled')}
              </button>
              {local === 1 && (
                <label>
                  {s('示意盐浓度', 'Illustrative salt')} {salt}%
                  <input
                    aria-label={s('示意盐浓度', 'Illustrative salt')}
                    type="range"
                    min="5"
                    max="20"
                    step="1"
                    value={salt}
                    onChange={(e) => put({ salt: +e.target.value })}
                  />
                </label>
              )}
            </>
          )}
          {mode === 1 && (
            <>
              <label>
                {s('后续去除速率', 'Later removal rate')}
                <input
                  aria-label={s('后续去除速率', 'Later removal rate')}
                  type="range"
                  min="0"
                  max="1.2"
                  step=".02"
                  value={removal}
                  onChange={(e) => put({ removal: +e.target.value })}
                />
                <output>{removal.toFixed(2)}</output>
              </label>
              <details>
                <summary>{s('自己的分时记录', 'Your time-point records')}</summary>
                <p>
                  {s(
                    '示例不是你的检测结果。每条记录保留自己的稀释倍数。',
                    'Examples are not your measurements. Each record keeps its own dilution.',
                  )}
                </p>
                <label>
                  {s('取样日', 'Sampling day')}
                  <input
                    type="number"
                    min="0"
                    value={day}
                    onChange={(e) => {
                      put({});
                      setDay(e.target.value);
                    }}
                  />
                </label>
                <label>
                  {s('吸光度', 'Absorbance')}
                  <input
                    type="number"
                    step=".001"
                    value={absorbance}
                    onChange={(e) => {
                      put({});
                      setAbsorbance(e.target.value);
                    }}
                  />
                </label>
                <label>
                  {s('稀释倍数', 'Dilution factor')}
                  <input
                    aria-label={s('稀释倍数', 'Dilution factor')}
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={dilution}
                    onChange={(e) => {
                      put({});
                      setDilution(+e.target.value);
                    }}
                  />
                  <output>{dilution}×</output>
                </label>
                <button
                  onClick={() => {
                    put({});
                    const r = nitriteRecord(`own-${records.length}`, day, absorbance, dilution);
                    if (r) setRecords((v) => [...v, r]);
                  }}
                >
                  {s('保存本次记录', 'Save this record')}
                </button>
                <ul>
                  {records.map((r) => (
                    <li key={r.id} data-record-id={r.id} data-dilution={r.dilution}>
                      {r.day} d ·{' '}
                      {r.result === null
                        ? s('未测或超出校准范围', 'Missing or outside calibration')
                        : `${r.result.toFixed(1)} mg/kg`}{' '}
                      · {r.dilution}×
                    </li>
                  ))}
                </ul>
              </details>
            </>
          )}
          {((mode === 2 && local === 2) || mode === 4) && (
            <button
              aria-pressed={oxygen}
              onClick={() =>
                mode === 4
                  ? changeDriver({ air: Number(!oxygen) })
                  : put({
                      vinegarEvents: [
                        ...vinegarEvents.filter((e) => e.at < time - 1e-9),
                        { at: time, air: Number(!oxygen) },
                      ],
                    })
              }
            >
              {s('供氧开启', 'Oxygen on')}
            </button>
          )}
          {mode === 3 && local === 0 && (
            <label>
              {s('相似罐线性倍数', 'Linear scale factor')}
              <input
                aria-label={s('相似罐线性倍数', 'Linear scale factor')}
                type="range"
                min="1"
                max="4"
                step=".1"
                value={size.volume ** (1 / 3)}
                onChange={(e) => put({ scale: +e.target.value })}
              />
            </label>
          )}
          {mode === 4 && (
            <>
              <p>
                {s(
                  '从本时刻改变后续输入；回拨时间可重看。',
                  'Changes start now; rewind to review history.',
                )}
              </p>
              <button aria-pressed={mixing} onClick={() => changeDriver({ mix: Number(!mixing) })}>
                {s('搅拌开启', 'Mixing on')}
              </button>
              <button aria-pressed={cooling} onClick={() => changeDriver({ cool: !cooling })}>
                {s('冷却开启', 'Cooling on')}
              </button>
            </>
          )}
          <details>
            <summary>{s('模型限定与资料记录', 'Model limits and source notes')}</summary>
            <p>
              {s(
                '路径与参数为教学简化，不是完整菌群、生产设定或食用判断。硝酸盐到其他含氮物质仅追氮收支；不同菌群与条件需要独立检测。',
                'Paths and parameters are teaching simplifications, not a full community, process setting or edibility verdict. The nitrate-to-other-products view tracks nitrogen only; organisms and conditions require independent tests.',
              )}
            </p>
            <label>
              {s('样品与资料出处', 'Sample and source')}
              <textarea
                value={journal}
                onChange={(e) => {
                  put({});
                  setJournal(e.target.value);
                }}
              />
            </label>
          </details>
        </div>
      )}
    </div>
  );
}

type Say = (zh: string, en: string) => string;
function CarbonPath({
  w,
  p,
  kind,
  s,
}: {
  w: number;
  p: number;
  kind: 'lactate' | 'ethanol' | 'acetate';
  s: Say;
}) {
  const atoms = fermentationCarbon(kind, p, w),
    bonds =
      kind === 'lactate'
        ? [
            [0, 1],
            [1, 2],
            [3, 4],
            [4, 5],
          ]
        : [
            [0, 1],
            [4, 5],
          ];
  return (
    <>
      <svg
        viewBox={`0 0 ${w} 238`}
        role="img"
        aria-label={s(
          '同一六个碳的净去向，不是反应中间体',
          'Net destinations of the same six carbons, not reaction intermediates',
        )}
      >
        <text x={w / 2} y="20" textAnchor="middle">
          {s('同一批碳', 'The same carbon batch')}
        </text>
        {p < 0.15 && (
          <text x={w / 2} y="129" textAnchor="middle" opacity={1 - p}>
            {s('葡萄糖', 'Glucose')}
          </text>
        )}
        {(p < 0.15
          ? [
              [0, 1],
              [1, 2],
              [2, 3],
              [3, 4],
              [4, 5],
            ]
          : bonds
        ).map(([a, b]) => (
          <path
            key={`${a}-${b}`}
            d={`M${atoms[a].x} ${atoms[a].y}L${atoms[b].x} ${atoms[b].y}`}
            stroke="#a18d64"
            strokeWidth="3"
            opacity={p < 0.15 ? 1 - p / 0.15 : Math.max(0, (p - 0.7) / 0.3)}
          />
        ))}
        {atoms.map((a) => (
          <g
            key={a.id}
            data-carbon-id={a.id}
            data-product={a.product}
            transform={`translate(${a.x} ${a.y})`}
          >
            <circle
              r="13"
              fill={a.product.startsWith('co2') && p > 0.6 ? '#d1dedb' : '#e2c995'}
              stroke="#a69370"
            />
            <text textAnchor="middle" y="6">
              {a.n}
            </text>
          </g>
        ))}
        {p > 0.15 && (
          <>
            <text x={w / 2} y="231" textAnchor="middle">
              {kind === 'lactate'
                ? s('两份乳酸 · 六个碳', 'Two lactates · six carbons')
                : s('两份乙醇 · 四个碳', 'Two ethanols · four carbons')}
            </text>
            {kind !== 'lactate' && (
              <text x={w / 2} y="76" textAnchor="middle">
                2 CO₂
              </text>
            )}
          </>
        )}
      </svg>
      <div className="bfp21-note">
        {s('净碳图 · 非逐步反应', 'Net carbon map · not reaction steps')}
      </div>
    </>
  );
}
function NitriteRecords({ w, s, shown }: { w: number; s: Say; shown: number }) {
  const left = 42,
    right = w - 19,
    top = 28,
    bottom = 185,
    X = (d: number) => left + ((d - 3) / 10) * (right - left),
    Y = (v: number) => bottom - (v / 24) * (bottom - top);
  return (
    <>
      <div className="bfp21-note">
        {s('教材练习记录 · 读图近似', 'Textbook example · approximate')}
      </div>
      <svg
        viewBox={`0 0 ${w} 235`}
        role="img"
        aria-label={s(
          '第3到13天六个独立时点的亚硝酸盐记录，先升后降',
          'Six separate nitrite observations, days 3 to 13: a rise and fall',
        )}
      >
        <text x={left} y="18">
          mg/kg
        </text>
        <path d={`M${left} ${top}V${bottom}H${right}`} fill="none" stroke="#a9afa1" />
        {[0, 12, 24].map((v) => (
          <g key={v}>
            <path d={`M${left - 4} ${Y(v)}H${right}`} stroke="#deded2" />
            <text x={left - 8} y={Y(v) + 6} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <path
          d={PICKLE_TEXTBOOK_SERIES.slice(0, shown)
            .map((a, i) => `${i ? 'L' : 'M'}${X(a.day)} ${Y(a.mgKg)}`)
            .join(' ')}
          stroke="#81987b"
          strokeWidth="2"
          fill="none"
        />
        {PICKLE_TEXTBOOK_SERIES.map((a, i) => (
          <g key={a.id} data-record-id={a.id} data-day={a.day} data-approx-mgkg={a.mgKg}>
            <text x={X(a.day)} y="209" textAnchor="middle">
              {a.day}
            </text>
            {i < shown && (
              <rect x={X(a.day) - 4} y={Y(a.mgKg) - 4} width="8" height="8" fill="#786387" />
            )}
          </g>
        ))}
        <text x={w / 2} y="233" textAnchor="middle">
          {s('取样日 / d', 'Sampling day / d')}
        </text>
      </svg>
      <div className="bfp21-note">{s('各时点独立样品', 'Separate time-point samples')}</div>
    </>
  );
}
function Calibration({
  w,
  s,
  assay,
  reading,
}: {
  w: number;
  s: Say;
  assay: ReturnType<typeof nitriteResult>;
  reading: string;
}) {
  return (
    <>
      <div className="bfp21-note">{s('独立校准练习', 'Independent calibration exercise')}</div>
      <svg
        viewBox={`0 0 ${w} 210`}
        role="img"
        aria-label={s(
          '同批空白与标准，示例读数扣除空白并保留稀释倍数',
          'Matched blank and standards, blank-corrected example with dilution',
        )}
      >
        <text x={w / 2} y="18" textAnchor="middle">
          mg/L
        </text>
        {[0, 2, 4, 6, 10].map((v, i) => {
          const x = 24 + (i * (w - 48)) / 4;
          return (
            <g key={v}>
              <path d={`M${x - 9} 30V104q9 10 18 0V30`} fill="#f4f4ea" stroke="#a0b2a5" />
              <path d={`M${x - 7} 55V103q7 7 14 0V55Z`} fill="#b56d8c" opacity={0.08 + v * 0.07} />
              <text x={x} y="138" textAnchor="middle">
                {v}
              </text>
            </g>
          );
        })}
        <text x={w / 2} y="168" textAnchor="middle">
          A → mg/L → mg/kg
        </text>
        <text x={w / 2} y="203" textAnchor="middle">
          {assay
            ? `${Number(reading).toFixed(3)} → ${assay.extractMgL.toFixed(1)} → ${assay.foodMgKg.toFixed(1)}`
            : s('尚未测量', 'Not measured')}
        </text>
      </svg>
      <div className="bfp21-note">
        {s('示例：提取与稀释需计入', 'Account for extraction and dilution')}
      </div>
    </>
  );
}
function Nitrogen({
  w,
  s,
  time,
  removal,
  reveal,
  predict,
}: {
  w: number;
  s: Say;
  time: number;
  removal: number;
  reveal: boolean;
  predict: boolean;
}) {
  const m = nitritePools(time, 0.32, removal),
    percent = nitrogenPercentages(m),
    ref = nitritePools(time, 0.32, 0.48),
    labels = [s('硝酸盐', 'Nitrate'), s('亚硝酸盐', 'Nitrite'), s('其他氮', 'Other N')];
  if (predict)
    return (
      <div className="bfp21-predict">
        {s('如果生成不变，而后续去除更快？', 'Same formation, faster removal?')}
        <span>{s('先预测亚硝酸盐的积累', 'Predict nitrite accumulation first')}</span>
      </div>
    );
  return (
    <>
      <div className="bfp21-note">
        {reveal
          ? removal > 0.48
            ? s('新一轮：更快去除', 'New run: faster removal')
            : removal < 0.48
              ? s('新一轮：更慢去除', 'New run: slower removal')
              : s('新一轮：原去除速率', 'New run: same removal')
          : s('选定氮份额 · 收支示意', 'Selected N portions · net account')}
      </div>
      <svg
        viewBox={`0 0 ${w} 230`}
        role="img"
        aria-label={s(
          '同一份氮依次进入和离开亚硝酸盐库',
          'The same nitrogen passes into and out of the nitrite pool',
        )}
      >
        {labels.map((l, i) => (
          <g key={i}>
            <text x={w * [0.15, 0.5, 0.85][i]} y="25" textAnchor="middle">
              {l}
            </text>
            <rect
              x={w * [0.15, 0.5, 0.85][i] - 26}
              y="47"
              width="52"
              height="111"
              rx="22"
              fill={['#e8dfc6', '#ead3dc', '#d8e3d8'][i]}
            />
          </g>
        ))}
        {[m.inRate, m.outRate].map((rate, i) => {
          const from = w * [0.15, 0.5][i] + 29,
            to = w * [0.5, 0.85][i] - 29;
          return (
            <path
              key={i}
              data-nitrogen-flow={i ? 'removal' : 'formation'}
              data-rate={rate}
              d={`M${from} 96H${to}${rate > 1e-8 ? `m-5-5 5 5-5 5` : ''}`}
              fill="none"
              stroke={i ? '#8ba18c' : '#ac97a3'}
              strokeWidth={1 + 5 * clamp(rate / 0.32)}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={rate > 1e-8 ? undefined : '2 4'}
              opacity={rate > 1e-8 ? 0.85 : 0.35}
            />
          );
        })}
        {[0, 5, 10].map((id) => {
          const a = nitrogenMarker(id, time, 0.32, removal, w);
          return (
            <g
              key={a.id}
              data-nitrogen-id={a.id}
              data-pool={a.pool}
              transform={`translate(${a.x} ${58 + (id / 5) * 38})`}
            >
              <circle r="12" fill="#c3a574" stroke="#8c7b61" />
              <text y="6" textAnchor="middle">
                {id / 5 + 1}
              </text>
            </g>
          );
        })}
        {percent.map((v, i) => (
          <text
            key={i}
            data-nitrogen-percent={i}
            x={w * [0.15, 0.5, 0.85][i]}
            y="186"
            textAnchor="middle"
          >
            {v}%
          </text>
        ))}
        <text x={w / 2} y="218" textAnchor="middle">
          {s('连续模型：合计 100%', 'Pool model: total 100%')}
        </text>
      </svg>
      <div
        className="bfp21-note"
        data-in-rate={m.inRate}
        data-out-rate={m.outRate}
        data-nitrite-comparison={reveal ? true : undefined}
      >
        {reveal ? (
          <>
            {s('同一时刻', 'Same time')}: {nitrogenPercentages(ref)[1]}% → {percent[1]}%
          </>
        ) : m.inRate > m.outRate ? (
          s('生成较快：存量上升', 'Formation faster: stock rises')
        ) : (
          s('去除较快：存量下降', 'Removal faster: stock falls')
        )}
      </div>
    </>
  );
}
