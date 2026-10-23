import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  binaryPopulation,
  logisticPopulation,
  growthClamp as clamp,
  chamberConcentration,
  yeastCells,
  inCountingSquare,
  flaskCells,
  canopyClosure,
  canopyEvidence,
  foodShareFrame,
  densityRates,
  changedCapacity,
  renewalCohort,
  concentrationRecord,
  observation,
  practiceObservations,
  nutrientPrediction,
  populationDirector,
  type CountObservation,
} from '../../models/bio-population-growth';
import '../../styles/bio-population-growth.css';

function Paramecium({
  x,
  y,
  split = 0,
  opacity = 1,
  label,
}: {
  x: number;
  y: number;
  split?: number;
  opacity?: number;
  label?: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      {[0, 1].map((j) => (
        <g
          key={j}
          transform={`translate(${(j ? 1 : -1) * split * 13} 0)`}
          opacity={j === 0 ? 1 : split}
        >
          <ellipse
            rx={11 - 3 * split}
            ry={21 - 5 * split}
            fill="#c6d8af"
            stroke="#6f8c60"
            strokeWidth="1.4"
          />
          <ellipse cx="1" cy="-2" rx="3" ry="5" fill="#829b70" />
          <path d="M5-9Q-3 0 5 9" fill="none" stroke="#94ad80" />
          {[-12, -5, 3, 10].map((v, i) => (
            <path key={i} d={`M-10 ${v}l-4-2M10 ${v}l4-2`} stroke="#829b70" />
          ))}
        </g>
      ))}
      {label && (
        <text y="43" textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}
function Yeast({
  x,
  y,
  bud = 0,
  label,
  dim = false,
}: {
  x: number;
  y: number;
  bud?: number;
  label?: string;
  dim?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={dim ? 0.32 : 1}>
      <ellipse rx="7" ry="9" fill="#d3b985" stroke="#9e8052" />
      <circle cx="-1" cy="1" r="2" fill="#a78b5d" />
      {bud > 0 && (
        <ellipse
          cx={9 + 5 * bud}
          cy={-7 - 2 * bud}
          rx={7 * bud}
          ry={9 * bud}
          fill="#d3b985"
          stroke="#9e8052"
        />
      )}
      {label && (
        <text y="31" textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}
function FoodShare({ w, p, crowded, en }: { w: number; p: number; crowded: boolean; en: boolean }) {
  const n = crowded ? 12 : 3,
    m = foodShareFrame(p, n, w);
  return (
    <svg
      viewBox={`0 0 ${w} 222`}
      role="img"
      aria-label={
        en
          ? 'Same 24 food identities shared among different numbers of consumers'
          : '同样24份供给由不同数量个体分享'
      }
      data-food-total={m.foods.length}
      data-food-consumers={m.cells.length}
    >
      <text x={w / 2} y="23" textAnchor="middle">
        24 {en ? 'food units' : '份供给'} · {m.cells.length} {en ? 'individuals' : '个体'}
      </text>
      <path d={`M${w * 0.4} 48v132`} stroke="#dce3d0" strokeDasharray="3 4" />
      {m.cells.map((c) => (
        <g key={c.id} data-consumer={c.id}>
          <ellipse
            cx={c.x}
            cy={c.y}
            rx={c.rx}
            ry={c.ry}
            fill={c.id === 'C1' ? '#d9e6e7' : '#d2dfbd'}
            stroke={c.id === 'C1' ? '#628b94' : '#91a87a'}
          />
          <ellipse cx={c.x + 2} cy={c.y + c.ry - 4} rx="2" ry="3" fill="#a6b88f" />
        </g>
      ))}
      {m.foods.map((f) => (
        <circle
          key={f.id}
          data-food={f.id}
          data-target={f.consumer}
          cx={f.x}
          cy={f.y}
          r={f.id === 'F1' ? 3 : 2.5}
          fill={f.id === 'F1' ? '#477d91' : '#b79753'}
        />
      ))}
      <text x={w / 2} y="198" textAnchor="middle">
        {en ? 'Mean share' : '平均份额'}: 24 ÷ {m.cells.length} ={' '}
        {m.averageShare.toFixed(m.averageShare % 1 ? 1 : 0)}
      </text>
      <text x={w / 2} y="222" textAnchor="middle">
        {en ? 'Allocation example; not rate data' : '分配示意；不是速率测量'}
      </text>
    </svg>
  );
}
function RateView({ w, density, en }: { w: number; density: number; en: boolean }) {
  const r = densityRates(density * 100, 100),
    max = 2.3;
  return (
    <svg
      viewBox={`0 0 ${w} 220`}
      role="img"
      aria-label={en ? 'Density changes the two expected rates' : '密度改变两种期望率'}
    >
      <text x={w / 2} y="24" textAnchor="middle">
        {en ? 'Same environment' : '同一环境'} · N/K = {density.toFixed(1)}
      </text>
      <g transform={`translate(${w * 0.2} 71)`}>
        {Array.from({ length: Math.round(3 + density * 14) }, (_, i) => (
          <ellipse
            key={i}
            cx={((i % 5) - 2) * 13}
            cy={Math.floor(i / 5) * 14}
            rx="4"
            ry="6"
            fill="#9bb287"
          />
        ))}
      </g>
      {[
        ['出生', 'Births', r.birthRate, '#7d9b6c'],
        ['死亡', 'Deaths', r.deathRate, '#b4947b'],
      ].map((a, i) => (
        <g key={i}>
          <text x={w * 0.42} y={68 + i * 56}>
            {en ? a[1] : a[0]}
          </text>
          <path
            d={`M${w * 0.42} ${83 + i * 56}h${(Number(a[2]) / max) * (w * 0.51)}`}
            stroke={String(a[3])}
            strokeWidth="10"
            strokeLinecap="round"
          />
          <text x={w - 8} y={68 + i * 56} textAnchor="end">
            {Number(a[2]).toFixed(2)}
          </text>
        </g>
      ))}
      <text x={w / 2} y="180" textAnchor="middle">
        {en ? 'Expected per individual / day' : '每个个体每天的期望率'}
      </text>
      <text x={w / 2} y="210" textAnchor="middle">
        {Math.abs(r.birthRate - r.deathRate) < 1e-9
          ? en
            ? 'Births = deaths; net = 0'
            : '出生 = 死亡；净增为 0'
          : r.birthRate > r.deathRate
            ? en
              ? 'Births exceed deaths'
              : '出生多于死亡'
            : en
              ? 'Deaths exceed births'
              : '死亡多于出生'}
      </text>
    </svg>
  );
}
function LogisticPlot({
  w,
  k,
  initial,
  days,
  change = false,
  reveal = true,
  en,
}: {
  w: number;
  k: number;
  initial: number;
  days: number;
  change?: boolean;
  reveal?: boolean;
  en: boolean;
}) {
  const max = 700,
    px = (t: number) => 38 + (t * (w - 58)) / 9,
    py = (n: number) => 179 - (n / max) * 140;
  const state = change
    ? changedCapacity(days, k, 5, initial)
    : logisticPopulation(days, initial, k);
  return (
    <svg
      viewBox={`0 0 ${w} 224`}
      role="img"
      aria-label={en ? 'Expected population under a stated rate model' : '指定速率模型的期望数量'}
      data-population={state.value}
      data-capacity={k}
    >
      <text x="38" y="22">
        {en ? 'Expected count' : '期望数量'} · N ≈ {state.value.toFixed(0)}
      </text>
      <path d={`M38 37v142h${w - 58}`} fill="none" stroke="#a6b497" />
      {[0, 375, 600].map((n) => (
        <g key={n}>
          <text x="32" y={py(n) + 5} textAnchor="end">
            {n}
          </text>
          <path d={`M38 ${py(n)}H${w - 20}`} stroke="#dde3d3" />
        </g>
      ))}
      <path
        d={Array.from({ length: 101 }, (_, i) => {
          const t = (i / 100) * days,
            n = change
              ? changedCapacity(t, k, 5, initial).value
              : logisticPopulation(t, initial, k).value;
          return `${i ? 'L' : 'M'}${px(t)} ${py(n)}`;
        }).join(' ')}
        fill="none"
        stroke="#718d60"
        strokeWidth="3"
      />
      <circle cx={px(days)} cy={py(state.value)} r="5" fill="#718d60" />
      {change && (
        <>
          <path d={`M${px(5)} 40v139`} stroke="#bca16d" strokeDasharray="4 4" />
          <text x={w - 21} y="50" textAnchor="end">
            K: 375 → {reveal ? k : '?'}
          </text>
        </>
      )}
      {[0, 3, 6, 9].map((t) => (
        <text key={t} x={px(t)} y="201" textAnchor="middle">
          {t}
        </text>
      ))}
      <text x={w - 20} y="223" textAnchor="end">
        {en ? 'Model days · not observations' : '模型天数 · 非测量点'}
      </text>
    </svg>
  );
}
function Renewal({ w, p, density, en }: { w: number; p: number; density: number; en: boolean }) {
  const m = renewalCohort(p, density);
  return (
    <svg
      viewBox={`0 0 ${w} 216`}
      role="img"
      aria-label={
        en
          ? 'Persistent individuals in one possible renewal interval'
          : '一个可能更新片段中的个体身份'
      }
      data-cohort-count={m.count}
    >
      <text x={w / 2} y="24" textAnchor="middle">
        {en ? 'One possible short interval' : '一个可能的短时片段'}
      </text>
      {m.events.map((e, i) => (
        <g key={e.parent} data-parent={e.parent} data-event={e.type}>
          <Paramecium
            x={(w * (i + 0.5)) / 4}
            y={100}
            split={e.type === 'birth' ? e.phase : 0}
            opacity={e.type === 'death' ? 1 - e.phase : 1}
          />
          <text x={(w * (i + 0.5)) / 4} y="159" textAnchor="middle">
            {e.type === 'birth' && e.phase === 1 ? `${i + 1}a · ${i + 1}b` : e.parent}
          </text>
          {e.type === 'death' && e.phase === 1 && (
            <path d={`M${(w * (i + 0.5)) / 4 - 12} 91l24 18m-24 0l24-18`} stroke="#b4947b" />
          )}
        </g>
      ))}
      <text x={w / 2} y="204" textAnchor="middle">
        4 + {m.births} − {m.deaths} = {m.count}
      </text>
    </svg>
  );
}
export default function BioPopulationGrowth() {
  const film = useShowcase(),
    { host, width: w, compact } = useSignalWidth(),
    id = useId(),
    en = browserLocale() === 'en';
  const s = (zh: string, english: string) => (en ? english : zh);
  const [selected, setSelected] = useState<number | null>(null),
    [times, setTimes] = useState<Record<number, number>>({});
  const [k, setK] = useState<number | null>(null),
    [initial, setInitial] = useState<number | null>(null),
    [cause, setCause] = useState<'nutrient' | 'other'>('nutrient');
  const [day, setDay] = useState(3),
    [replicate, setReplicate] = useState(1),
    [dilution, setDilution] = useState(10),
    [own, setOwn] = useState(false);
  const [records, setRecords] = useState<(CountObservation | null)[][]>(
    Array.from({ length: 8 }, () => [null, null, null]),
  );
  const [species, setSpecies] = useState<number | null>(null);
  const chapter = film.watch ? film.chapter : (selected ?? film.chapter);
  const inherit = selected === null || selected === film.chapter;
  const localDuration = Math.max(
    0.1,
    (film.chapters[chapter + 1]?.at ?? film.duration) - (film.chapters[chapter]?.at ?? 0),
  );
  const time = film.watch
    ? film.chapterTime
    : (times[chapter] ?? (inherit ? film.chapterTime : localDuration * 0.7));
  const d = populationDirector(chapter, time, localDuration, en ? 'en' : 'zh');
  const activeK = film.watch ? d.capacity : (k ?? (inherit ? d.capacity : 375)),
    activeInitial = film.watch ? 5 : (initial ?? 5);
  const activeSpecies = film.watch ? d.species : (species ?? (inherit ? d.species : 0));
  const title = [
    s('一代怎样变成下一代？', 'How does one generation become the next?'),
    s('倍增能一直持续吗？', 'Can doubling continue forever?'),
    s('增长为什么慢下来？', 'Why does growth slow?'),
    s('数量稳定，生命活动停止了吗？', 'Does a stable count mean no turnover?'),
    s('一滴能代表整瓶吗？', 'Can one drop represent a flask?'),
    s('为什么必须知道室深？', 'Why does chamber depth matter?'),
    s('看到多少，才能换算多少？', 'What does a counted field represent?'),
    s('曲线能告诉我们原因吗？', 'Does the curve reveal its cause?'),
    s('三种植物回答相同吗？', 'Do three species respond alike?'),
    s('共同变化就是因果吗？', 'Does association establish cause?'),
  ];
  const currentDay = film.watch ? 3 : day,
    rep = film.watch ? 1 : replicate,
    cells = yeastCells(currentDay, rep),
    count = cells.filter(inCountingSquare).length;
  const c = chamberConcentration(count, 10)!;
  const rows = concentrationRecord(!film.watch && own ? records : practiceObservations);
  const chartMax = Math.max(100, ...rows.map((r) => Math.ceil((r.mean ?? 0) / 1e6 / 50) * 50));
  const renewalState = renewalCohort(d.renewal, 375 / activeK);
  const renewalNet = renewalState.births - renewalState.deaths;
  const note =
    chapter === 3
      ? d.shot === 'curve'
        ? s('曲线描述变化，解释仍需检验。', 'Describe first; test the explanation.')
        : d.shot === 'food'
          ? s('同样供给，更多个体分享。', 'Same supply, more consumers.')
          : d.shot === 'rates'
            ? s('密度改变人均出生与死亡。', 'Density changes per-capita rates.')
            : d.shot === 'renewal'
              ? renewalNet === 0
                ? s('本段净增为 0，继续追踪个体。', 'Net change is 0; follow the individuals.')
                : renewalNet > 0
                  ? s('本段出生多于死亡。', 'Births exceed deaths in this interval.')
                  : s('本段死亡多于出生。', 'Deaths exceed births in this interval.')
              : s('环境先改变速率，数量连续。', 'Rates change first; count stays continuous.')
      : chapter === 7
        ? d.shot === 'record'
          ? s('这些是计数练习数据。', 'These are illustrative count records.')
          : d.shot === 'split'
            ? s('同源分样，等量加入。', 'Same culture; equal additions.')
            : cause === 'nutrient' || film.watch
              ? s('营养限制假说：补给应恢复出芽。', 'If nutrients limit growth: more budding.')
              : s('若另有抑制，补营养未必恢复。', 'Other inhibition may persist after feeding.')
        : chapter === 2
          ? s('教材端点，非补造测量。', 'Textbook endpoints; no invented data.')
          : chapter === 6
            ? s('练习样品：稀释十倍。', 'Practice sample: diluted ×10.')
            : chapter === 8
              ? s('调查关联，尚非因果。', 'Survey association, not causation.')
              : chapter === 9
                ? s('用对照区分替代解释。', 'Use controls to distinguish causes.')
                : '';
  return (
    <div
      className="bpg19"
      ref={host}
      data-watch={film.watch}
      data-chapter={chapter}
      data-shot={d.shot}
    >
      {!film.watch && <div className="bpg19-heading">{title[chapter]}</div>}
      <div className="bpg19-scene">
        {chapter === 0 && (
          <svg
            viewBox={`0 0 ${w} 226`}
            role="img"
            aria-label={s('细菌固定谱系示意', 'Fixed bacterial lineage')}
          >
            <text x={w / 2} y="21" textAnchor="middle">
              {s('每代 20 min；无死亡', '20 min per generation; no deaths')}
            </text>
            {Array.from({ length: 6 }, (_, g) => {
              const n = 2 ** g,
                age = d.lineageGeneration,
                y = 49 + g * 29;
              return (
                <g key={g} opacity={g <= age ? 1 : 0.12}>
                  {Array.from({ length: n }, (_, j) => {
                    const x = 22 + ((j + 0.5) * (w - 62)) / n;
                    return (
                      <g key={j} data-lineage={`${g}-${j}`}>
                        {g > 0 && (
                          <path
                            d={`M${22 + ((Math.floor(j / 2) + 0.5) * (w - 62)) / (n / 2)} ${y - 23}L${x} ${y - 5}`}
                            stroke="#b7c6a9"
                            fill="none"
                          />
                        )}
                        <ellipse
                          cx={x}
                          cy={y}
                          rx={Math.min(8, ((w - 62) / n) * 0.32)}
                          ry="5"
                          fill={g === age ? '#789b62' : '#c6d4b8'}
                        />
                      </g>
                    );
                  })}
                  <text x={w - 4} y={y + 5} textAnchor="end">
                    {n}
                  </text>
                </g>
              );
            })}
            <text x={w / 2} y="223" textAnchor="middle">
              {s('亮色：当前一代', 'Highlighted: current generation')}
            </text>
          </svg>
        )}
        {chapter === 1 && (
          <svg viewBox={`0 0 ${w} 226`} role="img" aria-label={title[1]}>
            <text x={w / 2} y="26" textAnchor="middle">
              N = N₀ × 2ⁿ
            </text>
            {[0, 1, 2, 3, 4].map((g) => (
              <g key={g} opacity={g <= d.exponentGeneration ? 1 : 0.15}>
                <text x="12" y={62 + g * 26}>
                  {20 * g} min
                </text>
                <path
                  d={`M${w * 0.35} ${57 + g * 26}h${(2 ** g / 16) * w * 0.42}`}
                  stroke="#8da77a"
                  strokeWidth="9"
                  strokeLinecap="round"
                />
                <text x={w - 14} y={62 + g * 26} textAnchor="end">
                  {binaryPopulation(g * 20).population}
                </text>
              </g>
            ))}
            <text x={w / 2} y="203" textAnchor="middle">
              {d.extrapolationReveal ? '72 h → 2²¹⁶ ≈ 1.05 × 10⁶⁵' : '72 h → ?'}
            </text>
            <text x={w / 2} y="225" textAnchor="middle">
              {s('假设外推，仍须检验', 'Extrapolation still needs testing')}
            </text>
          </svg>
        )}
        {chapter === 2 && (
          <svg
            viewBox={`0 0 ${w} 222`}
            role="img"
            aria-label={s('高斯原记录的教材端点', 'Textbook endpoints of Gause observations')}
          >
            {[5, 375].map((n, j) => {
              const x = w * (j ? 0.74 : 0.26),
                vw = Math.min(210, w * 0.43);
              return (
                <g key={j} opacity={j ? d.lateObservation : 1}>
                  <text x={x} y="24" textAnchor="middle">
                    {j ? s('约第 5 天后', 'After ~day 5') : s('初始', 'Initially')}
                  </text>
                  <path
                    d={`M${x - vw / 2} 43v112q0 13 13 13h${vw - 26}q13 0 13-13V43`}
                    fill="#e8eedb"
                    stroke="#a2b290"
                  />
                  {Array.from({ length: n }, (_, i) => (
                    <ellipse
                      key={i}
                      cx={
                        j
                          ? x - vw / 2 + 7 + ((i % 25) * (vw - 14)) / 24
                          : x + (i % 2 ? 1 : -1) * vw * 0.18
                      }
                      cy={j ? 55 + Math.floor(i / 25) * 7 : 58 + i * 20}
                      rx={j ? 1.2 : 5}
                      ry={j ? 2 : 9}
                      fill="#8ca471"
                    />
                  ))}
                  <text x={x} y="195" textAnchor="middle">
                    {j ? '≈375' : '5'}
                  </text>
                </g>
              );
            })}
            <text x={w / 2} y="221" textAnchor="middle">
              0.5 mL
            </text>
          </svg>
        )}
        {chapter === 3 &&
          (d.shot === 'curve' ? (
            <LogisticPlot w={w} k={activeK} initial={activeInitial} days={d.growthDay} en={en} />
          ) : d.shot === 'food' ? (
            <FoodShare w={w} p={d.foodProgress} crowded={d.foodCrowded} en={en} />
          ) : d.shot === 'rates' ? (
            <RateView w={w} density={(375 * d.rateDensity) / activeK} en={en} />
          ) : d.shot === 'renewal' ? (
            <Renewal w={w} p={d.renewal} density={375 / activeK} en={en} />
          ) : (
            <LogisticPlot
              w={w}
              k={activeK}
              initial={activeInitial}
              days={5 + d.prediction * 4}
              change
              reveal={d.reveal}
              en={en}
            />
          ))}
        {chapter === 4 && (
          <svg viewBox={`0 0 ${w} 225`} role="img" aria-label={title[4]}>
            <text x={w / 2} y="23" textAnchor="middle">
              10 mL · {s('32 个示踪标记', '32 selected tracers')}
            </text>
            <g transform={`translate(${w / 2} -37)`}>
              <path
                d="M-16 66v39L-58 240q0 10 12 10h92q12 0 12-10L16 105V66"
                fill="#eef2e5"
                stroke="#a1b393"
                strokeWidth="2"
              />
              <path d="M-29.85 150H29.85L56 235q3 12-10 12h-92q-13 0-10-12Z" fill="#dbe6bc" />
              {flaskCells(d.mixing).map((v) => (
                <g key={v.id} data-tracer={v.id}>
                  <ellipse cx={v.x} cy={v.y} rx="3.5" ry="5" fill="#baa675" />
                </g>
              ))}
            </g>
          </svg>
        )}
        {chapter === 5 && (
          <svg viewBox={`0 0 ${w} 225`} role="img" aria-label={title[5]}>
            <defs>
              <linearGradient id={`${id}-glass`} x2="0" y2="1">
                <stop stopColor="#eef3ed" />
                <stop offset="1" stopColor="#bdcdbf" />
              </linearGradient>
            </defs>
            <text x={w / 2} y="23" textAnchor="middle">
              {s('侧面剖视 · 毛细充液', 'Side section · capillary filling')}
            </text>
            <rect x="24" y="146" width={w - 48} height="27" rx="5" fill={`url(#${id}-glass)`} />
            <rect x="56" y="110" width={w - 86} height="16" rx="3" fill={`url(#${id}-glass)`} />
            <path d={`M${w - 30} 126h-20v20h20`} fill="#bdcec1" />
            <rect x="56" y="126" width={(w - 106) * d.fill} height="20" fill="#d5d9a0" />
            <path d="M44 39h12v36l-6 23-6-23Z" fill="#e1e9df" stroke="#98ae98" />
            <path
              d={`M50 ${99 + d.drop * 20}q-8 10 0 10q8 0 0-10`}
              fill="#b7c68e"
              opacity={time < 3.8 ? 1 : 0}
            />
            <path d={`M${w - 15} 126v20m-4-20h8m-8 20h8`} stroke="#8c9f89" />
            <text x={w / 2} y="197" textAnchor="middle">
              {s('室深', 'Depth')} 0.1 mm
            </text>
            <text x={w / 2} y="224" textAnchor="middle">
              {s('盖片先就位', 'Coverslip in place first')}
            </text>
          </svg>
        )}
        {chapter === 6 && (
          <div className="bpg19-count">
            <svg viewBox={`0 0 ${w} 154`} role="img" aria-label={title[6]}>
              <text x={w / 2} y="22" textAnchor="middle">
                {s('第', 'Day ')}
                {currentDay}
                {s('天 · 重复', ' · repeat ')}
                {rep + 1}
              </text>
              {(() => {
                const size = 105,
                  x = (w - size) / 2,
                  y = 35;
                return (
                  <>
                    <rect
                      x={x - 12}
                      y={y - 12}
                      width={size + 24}
                      height={size + 24}
                      rx="15"
                      fill="#f0eddf"
                    />
                    {Array.from({ length: 5 }, (_, i) => (
                      <path
                        key={i}
                        d={`M${x + (i * size) / 4} ${y}v${size}M${x} ${y + (i * size) / 4}h${size}`}
                        stroke={i === 0 ? '#879b6c' : '#cbc6b0'}
                        strokeWidth={i === 0 ? 2 : 1}
                      />
                    ))}
                    {cells.map((v) => (
                      <ellipse
                        key={v.id}
                        data-cell-id={v.id}
                        data-counted={inCountingSquare(v)}
                        cx={x + v.x * size}
                        cy={y + v.y * size}
                        rx="3.5"
                        ry="5"
                        fill="#bea16f"
                        opacity={inCountingSquare(v) ? 1 : 0.27}
                      />
                    ))}
                  </>
                );
              })()}
            </svg>
            <div
              className="bpg19-equation"
              style={{ visibility: d.countVolume ? 'visible' : 'hidden' }}
            >
              0.2 × 0.2 × 0.1 mm³
            </div>
            <div
              className="bpg19-equation"
              style={{ visibility: d.countConversion ? 'visible' : 'hidden' }}
              data-count={count}
            >
              {count} × 10 ÷ (4 × 10⁻⁶ mL)
            </div>
            <div
              className="bpg19-equation"
              style={{ visibility: d.countResult ? 'visible' : 'hidden' }}
            >
              {(c.cellsPerMl / 1e6).toFixed(1)} × 10⁶ {s('个/mL', 'cells/mL')}
            </div>
          </div>
        )}
        {chapter === 7 && d.shot === 'record' && (
          <svg
            viewBox={`0 0 ${w} 224`}
            role="img"
            aria-label={s('每次记录保留自己的稀释倍数', 'Each observation keeps its own dilution')}
          >
            <text x="36" y="22">
              10⁶ {s('个/mL', 'cells/mL')}
            </text>
            <path d={`M36 38v139h${w - 51}`} fill="none" stroke="#a9b599" />
            {[0, chartMax / 2, chartMax].map((v) => (
              <text key={v} x="30" y={182 - (v / chartMax) * 125} textAnchor="end">
                {v > 999 ? v.toExponential(0) : v}
              </text>
            ))}
            {rows.map((r, i) => {
              const x = 36 + (i * (w - 51)) / 7,
                y = 177 - ((r.mean ?? 0) / 1e6 / chartMax) * 125;
              return (
                <g
                  key={i}
                  data-day={i}
                  data-mean={r.mean ?? 'missing'}
                  data-repeats={r.n}
                  opacity={film.watch && i > d.recordDay ? 0 : 1}
                >
                  {r.mean !== null && (
                    <>
                      <path d={`M${x} 177V${y}`} stroke="#ced5bd" />
                      <circle cx={x} cy={y} r="5" fill="#8ba572" />
                    </>
                  )}
                  <text x={x} y="199" textAnchor="middle">
                    {i}
                  </text>
                </g>
              );
            })}
            <text x={w - 10} y="223" textAnchor="end">
              {!film.watch && own
                ? s('天 · 输入记录', 'days · entered records')
                : s('天；每个点 3 次重复', 'days; 3 repeats per example')}
            </text>
          </svg>
        )}
        {chapter === 7 && d.shot !== 'record' && (
          <svg
            viewBox={`0 0 ${w} 222`}
            role="img"
            aria-label={s(
              '同源分样的条件预测，不是测得结果',
              'Conditional prediction for split samples, not measured results',
            )}
          >
            <text x={w / 2} y="22" textAnchor="middle">
              {s('同源分样 · 条件预测', 'Split samples · prediction')}
            </text>
            {[false, true].map((fed, j) => {
              const x = w * (j ? 0.75 : 0.25),
                m = nutrientPrediction(fed, film.watch ? 'nutrient' : cause, d.prediction);
              return (
                <g key={j} data-fed={fed} data-expected-count={m.count}>
                  <path
                    d={`M${x - w * 0.21} 46v115q0 12 12 12h${w * 0.42 - 24}q12 0 12-12V46`}
                    fill="#efeddd"
                    stroke="#aeb795"
                  />
                  <path d={`M${x - w * 0.21 + 3} 74h${w * 0.42 - 6}`} stroke="#c4ccaf" />
                  {m.events.map((e, i) => (
                    <g key={e.id} data-yeast={e.id}>
                      <Yeast
                        x={x + (i % 2 ? 1 : -1) * w * 0.068}
                        y={99 + Math.floor(i / 2) * 39}
                        bud={e.bud}
                      />
                    </g>
                  ))}
                  <text x={x} y="199" textAnchor="middle">
                    {fed ? s('补营养', 'Nutrient') : s('等量对照', 'Control')}
                  </text>
                </g>
              );
            })}
            <text x={w / 2} y="222" textAnchor="middle">
              {s('比较出芽/活性，不能只看总数', 'Compare budding or viability')}
            </text>
          </svg>
        )}
        {chapter === 8 && (
          <svg viewBox={`0 0 ${w} 228`} role="img" aria-label={title[8]}>
            <text x={w / 2} y="22" textAnchor="middle">
              {s(canopyEvidence[activeSpecies].zh, canopyEvidence[activeSpecies].en)}
            </text>
            <text x="36" y="47">
              {s('平均株数/m²', 'Mean plants/m²')}
            </text>
            <path d={`M36 61v112h${w - 52}`} fill="none" stroke="#aab59c" />
            {[0, 8, 16].map((v) => (
              <text key={v} x="30" y={178 - v * 6.5} textAnchor="end">
                {v}
              </text>
            ))}
            {canopyEvidence[activeSpecies].values.map((v, i) => {
              const x = 36 + (i * (w - 52)) / 5,
                y = 173 - v * 6.5;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="5" fill={canopyEvidence[activeSpecies].color} />
                  <text x={x} y={y - 9} textAnchor="middle">
                    {v}
                  </text>
                  <text x={x} y="198" textAnchor="middle">
                    {canopyClosure[i]}
                  </text>
                </g>
              );
            })}
            <text x={w / 2} y="226" textAnchor="middle">
              {s('郁闭度 · 教材调查', 'Canopy closure · textbook survey')}
            </text>
          </svg>
        )}
        {chapter === 9 && (
          <svg viewBox={`0 0 ${w} 226`} role="img" aria-label={title[9]}>
            <text x={w / 2} y="24" textAnchor="middle">
              {s('季节', 'Season')}
            </text>
            {[s('降水', 'Rain'), s('温度', 'Temperature'), s('日长', 'Day length')].map((v, i) => {
              const x = compact ? w * 0.46 : (w * (i + 1)) / 4,
                y = compact ? 57 + i * 31 : 82;
              return (
                <g key={i}>
                  <path
                    d={compact ? `M${w * 0.18} 31V${y - 6}H${x - 50}` : `M${w / 2} 33L${x} 59`}
                    fill="none"
                    stroke="#bdc9b1"
                  />
                  <text x={x} y={y} textAnchor="middle">
                    {v}
                  </text>
                  <path
                    d={
                      compact
                        ? `M${x + 63} ${y - 6}H${w * 0.86}V139H${w / 2}`
                        : `M${x} 90L${w / 2} 139`
                    }
                    fill="none"
                    stroke="#bdc9b1"
                  />
                </g>
              );
            })}
            <text x={w / 2} y="166" textAnchor="middle">
              {s('资源 → 出生与死亡', 'Resources → births and deaths')}
            </text>
            <path d={`M${w / 2} 176v20`} stroke="#9eb28e" />
            <text x={w / 2} y="222" textAnchor="middle">
              {s('种群数量', 'Population size')}
            </text>
          </svg>
        )}
      </div>
      {note && <p className="bpg19-note">{note}</p>}
      {!film.watch && (
        <div className="bpg19-controls">
          <label>
            {s('观察主题', 'View')}
            <select
              aria-label={s('观察主题', 'View')}
              value={chapter}
              onChange={(e) => setSelected(+e.target.value)}
            >
              {title.map((v, i) => (
                <option value={i} key={i}>
                  {i + 1}. {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            {s('过程位置', 'Progress')}
            <input
              aria-label={s('过程位置', 'Progress')}
              type="range"
              min="0"
              max={localDuration}
              step=".1"
              value={time}
              onChange={(e) => setTimes((v) => ({ ...v, [chapter]: +e.target.value }))}
            />
          </label>
          {chapter === 3 && d.shot !== 'food' && (
            <>
              <label>
                {s('环境容纳量（模型）', 'Capacity (model)')}
                <output>{activeK}</output>
                <input
                  aria-label={s('环境容纳量（模型）', 'Capacity (model)')}
                  type="range"
                  min="200"
                  max="650"
                  step="25"
                  value={activeK}
                  onChange={(e) => setK(+e.target.value)}
                />
              </label>
              {(d.shot === 'curve' || d.shot === 'prediction') && (
                <label>
                  {s('初始数量（模型）', 'Initial count (model)')}
                  <output>{activeInitial}</output>
                  <input
                    aria-label={s('初始数量（模型）', 'Initial count (model)')}
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={activeInitial}
                    onChange={(e) => setInitial(+e.target.value)}
                  />
                </label>
              )}
            </>
          )}
          {(chapter === 6 || chapter === 7) && (
            <>
              <label>
                {s('观察日', 'Observation day')}
                <output>{day}</output>
                <input
                  aria-label={s('观察日', 'Observation day')}
                  type="range"
                  min="0"
                  max="7"
                  step="1"
                  value={day}
                  onChange={(e) => setDay(+e.target.value)}
                />
              </label>
              {chapter === 6 && (
                <label>
                  {s('重复', 'Repeat')}
                  <output>{replicate + 1}</output>
                  <input
                    aria-label={s('重复', 'Repeat')}
                    type="range"
                    min="0"
                    max="2"
                    step="1"
                    value={replicate}
                    onChange={(e) => setReplicate(+e.target.value)}
                  />
                </label>
              )}
            </>
          )}
          {chapter === 7 && (
            <>
              <div className="bpg19-buttons">
                {(['nutrient', 'other'] as const).map((v) => (
                  <button key={v} aria-pressed={cause === v} onClick={() => setCause(v)}>
                    {v === 'nutrient'
                      ? s('营养限制假说', 'Nutrient limitation')
                      : s('另有抑制假说', 'Other inhibition')}
                  </button>
                ))}
              </div>
              <button aria-pressed={own} onClick={() => setOwn(!own)}>
                {s('使用我的计数记录', 'Use my count records')}
              </button>
              {own && (
                <>
                  <label>
                    {s('本次样品稀释倍数', 'Current sample dilution')}
                    <input
                      aria-label={s('本次样品稀释倍数', 'Current sample dilution')}
                      type="number"
                      min="1"
                      max="1000"
                      value={dilution}
                      onChange={(e) => setDilution(clamp(+e.target.value, 1, 1000))}
                    />
                  </label>
                  <div className="bpg19-records">
                    {records[day].map((v, r) => (
                      <label key={r}>
                        {s('重复', 'Repeat ')} {r + 1}
                        <input
                          aria-label={`${s('计数', 'Count ')}${r + 1}`}
                          type="number"
                          min="0"
                          value={v?.count ?? ''}
                          placeholder={s('未记录', 'Missing')}
                          onChange={(e) =>
                            setRecords((old) =>
                              old.map((row, i) =>
                                i === day
                                  ? row.map((item, j) =>
                                      j === r
                                        ? e.target.value === ''
                                          ? null
                                          : observation(clamp(+e.target.value, 0, 1e6), dilution)
                                        : item,
                                    )
                                  : row,
                              ),
                            )
                          }
                        />
                        <span>{v ? `× ${v.dilution}` : '—'}</span>
                      </label>
                    ))}
                  </div>
                  <p data-record-summary>
                    {s('有效重复', 'Valid repeats')}: {rows[day].n};{' '}
                    {rows[day].mean === null
                      ? s('缺测', 'Missing')
                      : `${(rows[day].mean! / 1e6).toFixed(2)} × 10⁶ /mL`}
                  </p>
                  <p>
                    {s('10 mL 总量估计', 'Estimate in 10 mL')}:{' '}
                    {rows[day].cultureCells === null
                      ? '—'
                      : rows[day].cultureCells!.toExponential(2)}
                  </p>
                </>
              )}
            </>
          )}
          {chapter === 8 && (
            <div className="bpg19-buttons">
              {canopyEvidence.map((v, i) => (
                <button key={i} aria-pressed={activeSpecies === i} onClick={() => setSpecies(i)}>
                  {s(v.zh, v.en)}
                </button>
              ))}
            </div>
          )}
          <details>
            <summary>{s('模型与证据边界', 'Model and evidence limits')}</summary>
            <p>
              {s(
                '高斯教材端点保持不变。期望数量模型把密度作用写成出生/死亡率，不是逐个个体实测，也不能由S形唯一确定原因。四个示踪个体只是同一率模型的一种短时实现。计数练习固定为十倍稀释；个人记录按每次采样的稀释倍数分别换算后求平均，修改当前倍数不会改旧样品。总计数不区分死活。补营养图是条件预测，不是已有实验结果。',
                'Gause’s textbook endpoints remain fixed. Expected population follows a density-dependent birth/death model, not measured individual histories; an S-shaped curve does not identify a unique cause. Four tracked individuals show one possible short realization of those rates. Practice counts use tenfold dilution. Personal observations retain their own dilution before averaging; changing the current dilution does not rewrite old samples. Total counts do not establish viability. Nutrient addition shows a conditional prediction, not an observed result.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
