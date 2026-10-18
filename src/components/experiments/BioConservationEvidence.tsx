import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  conservationClamp,
  waterSites,
  waterReading,
  crossingPosition,
  nitrogenMarkers,
  plantEstablishment,
  nutrientCapacity,
  courtyardMarkers,
  carbonPlot,
  carbonStrata,
  carbonAnnual,
  type NutrientPool,
} from '../../models/bio-conservation-evidence';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-conservation-evidence.css';
export default function BioConservationEvidence() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    id = useId(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const variants = [
    'bio-elective-2-087-1',
    'bio-elective-2-094-1',
    'bio-elective-2-mechanism-23',
    'bio-elective-2-108-1',
    'bio-elective-2-110-1',
  ];
  const [mode0, setMode] = useState(Math.max(0, variants.indexOf(f.variant ?? ''))),
    [view, setView] = useState(0),
    [progress, setProgress] = useState(1),
    [site, setSite] = useState(0),
    [water, setWater] = useState(['', '', '']),
    [environmentNote, setEnvironmentNote] = useState(''),
    [biodiversityNote, setBiodiversityNote] = useState(''),
    [visitNote, setVisitNote] = useState(''),
    [connected, setConnected] = useState(true),
    [evidence, setEvidence] = useState(2),
    [reuse, setReuse] = useState(true),
    [moisture, setMoisture] = useState(0.25),
    [input, setInput] = useState(10),
    [capacity, setCapacity] = useState(6),
    [area, setArea] = useState(400),
    [depth, setDepth] = useState(30),
    [nPlots, setNPlots] = useState(3),
    [weighted, setWeighted] = useState(true),
    [co2, setCo2] = useState(false);
  const mode = f.watch
      ? f.chapter < 2
        ? 0
        : f.chapter < 4
          ? 1
          : f.chapter < 6
            ? 2
            : f.chapter < 8
              ? 3
              : 4
      : mode0,
    local = f.watch ? f.chapter - [0, 2, 4, 6, 8][mode] : Math.min(view, mode === 4 ? 2 : 1),
    p = f.watch ? f.chapterProgress : progress,
    activeSite = f.watch ? Math.min(2, Math.floor(p * 3)) : site;
  const link = f.watch || connected,
    bear = crossingPosition(p, w, link),
    level = f.watch ? Math.min(2, Math.floor(p * 3)) : evidence,
    N = nitrogenMarkers(p, f.watch || reuse),
    m = f.watch ? 0.2 + 0.65 * p : moisture,
    cap = nutrientCapacity(f.watch ? 10 : input, f.watch ? 6 : capacity),
    court = courtyardMarkers(p, w),
    carbon = carbonPlot(2000, 500, f.watch ? 400 : area, 0.47, f.watch ? 30 : depth),
    strata = carbonStrata(f.watch ? Math.min(9, 1 + Math.floor(p * 9)) : nPlots),
    annual = carbonAnnual(!f.watch && co2);
  const titles = [
    s('本地环境调查', 'Local environment survey'),
    s('保护措施的证据', 'Evidence for conservation'),
    s('循环、自生与协调', 'Cycling and ecological fit'),
    s('庭院生态系统参观', 'A courtyard-system visit'),
    s('从样方到碳汇研究', 'From plots to carbon research'),
  ];
  const centers: Record<NutrientPool, { x: number; y: number }> = {
    soil: { x: w * 0.25, y: 210 },
    crop: { x: w * 0.25, y: 60 },
    animal: { x: w * 0.75, y: 60 },
    treatment: { x: w * 0.75, y: 210 },
    product: { x: w * 0.5, y: 130 },
    loss: { x: w * 0.86, y: 274 },
    stored: { x: w * 0.5, y: 274 },
  };
  const point = (pool: NutrientPool, n: number) => ({
    x: centers[pool].x + ((n % 4) - 1.5) * 7,
    y: centers[pool].y + (Math.floor(n / 4) - 2.5) * 5,
  });
  const plant = (x: number, y: number, h = 30, wet = false) => (
    <g>
      <path
        d={`M${x} ${y}v${-h}m0 ${h * 0.65}q-15-7-15-${h * 0.5}m15 ${h * 0.25}q17-9 16-${h * 0.55}`}
        fill="none"
        stroke={wet ? '#7fa58e' : '#a4a878'}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );
  const pathD = (points: { x: number; y: number }[]) =>
    points.map((q, i) => `${i === 0 ? 'M' : 'L'}${q.x} ${q.y}`).join(' ');
  return (
    <div className="bio-conserve" data-watch={f.watch} ref={host}>
      <div className="bio-conserve-head">{titles[mode]}</div>
      {mode === 0 && local === 0 && (
        <svg
          viewBox={`0 0 ${w} 302`}
          role="img"
          aria-label={s(
            '记录同一湖泊的采样位置与条件',
            'Record sampling locations and conditions around one lake',
          )}
        >
          <path
            d={`M${w * 0.3} 43C${w * 0.81} 29 ${w * 0.91} 130 ${w * 0.71} 205S${w * 0.15} 289 ${w * 0.15} 203S${w * 0.07} 83 ${w * 0.3} 43Z`}
            fill="#d8e8dc"
            stroke="#b0c8b4"
            strokeWidth="2"
          />
          {waterSites.map((q, i) => (
            <g key={q.id}>
              <circle
                cx={w * q.x}
                cy={q.y}
                r={i === activeSite ? 11 : 7}
                fill={i === activeSite ? '#a3b485' : '#c2cfae'}
                stroke="#8eaa83"
              />
              <text x={w * q.x + 16} y={q.y + 5}>
                {q.id}
              </text>
            </g>
          ))}
          <text x={w / 2} y="25" textAnchor="middle">
            {s('同日同一时段 · 示例位置', 'Matched timing · example sites')}
          </text>
          <text x={w / 2} y="283" textAnchor="middle">
            {s('位置 + 时间 + 方法 + 重复', 'Site + time + method + repeats')}
          </text>
        </svg>
      )}
      {mode === 0 && local === 1 && (
        <svg
          viewBox={`0 0 ${w} 294`}
          role="img"
          aria-label={s('保留原始指标和评价口径', 'Keep raw indicators and assessment scope')}
        >
          <text x={w / 2} y="25" textAnchor="middle">
            {f.watch
              ? s('示例溶解氧 / mg·L⁻¹', 'Example oxygen / mg·L⁻¹')
              : s('我的溶解氧 / mg·L⁻¹', 'My oxygen / mg·L⁻¹')}
          </text>
          {waterSites.map((q, i) => {
            const v = f.watch ? q.example : waterReading(water[i]);
            return (
              <g key={q.id}>
                <text x="16" y={77 + i * 55}>
                  {q.id}
                </text>
                {v === null ? (
                  <text x="49" y={77 + i * 55}>
                    {s('未记录', 'Not recorded')}
                  </text>
                ) : (
                  <>
                    <path
                      d={`M49 ${72 + i * 55}H${49 + ((w - 107) * v) / Math.max(10, ...water.map((x) => waterReading(x) ?? 0))}`}
                      stroke="#a7bb9b"
                      strokeWidth="13"
                      strokeLinecap="round"
                    />
                    <text x={w - 16} y={77 + i * 55} textAnchor="end">
                      {v.toFixed(1)}
                    </text>
                  </>
                )}
              </g>
            );
          })}
          <text x={w / 2} y="249" textAnchor="middle">
            {s('单项读数 ≠ 综合水质等级', 'One indicator ≠ overall class')}
          </text>
          <text x={w / 2} y="281" textAnchor="middle">
            GB 3838—2002
          </text>
        </svg>
      )}
      {mode === 1 && local === 0 && (
        <svg
          viewBox={`0 0 ${w} 302`}
          role="img"
          aria-label={s(
            '同一个体通过跨越道路的生态通道',
            'The same animal crosses over the road on a wildlife bridge',
          )}
        >
          <rect x="12" y="44" width={w - 24} height="228" rx="28" fill="#dfe8d2" />
          <rect x={w * 0.45} y="44" width={w * 0.1} height="228" fill="#bbbbaa" />
          <path d={`M${w * 0.5} 44v228`} stroke="#e3e1cf" strokeDasharray="7 9" />
          {[0, 0.5].map((o, i) => {
            const y = 45 + ((p + o) % 1) * 224;
            return (
              <rect
                key={i}
                x={w * 0.47}
                y={y}
                width={w * 0.045}
                height="13"
                rx="3"
                fill="#8b9c91"
              />
            );
          })}
          <path
            d={`M${w * 0.44} 44V135m0 50v87M${w * 0.56} 44V135m0 50v87`}
            stroke="#9baa8d"
            strokeWidth="2"
          />
          {link && (
            <>
              <path
                d={`M${w * 0.34} 138Q${w / 2} 127 ${w * 0.66} 138v44q-${w * 0.16} 11-${w * 0.32} 0Z`}
                fill="#a7bc8c"
                stroke="#8fa47e"
                strokeWidth="2"
              />
              <path
                d={`M${w * 0.35} 146Q${w / 2} 138 ${w * 0.65} 146m-${w * 0.3} 27q${w * 0.15} 8 ${w * 0.3} 0`}
                fill="none"
                stroke="#c7d4b1"
              />
            </>
          )}
          <g transform={`translate(${bear.x} ${bear.y})`}>
            <ellipse rx="12" ry="8" fill="#958c75" />
            <circle cx="11" cy="-3" r="6" fill="#958c75" />
            <circle cx="10" cy="-8" r="3" fill="#958c75" />
            <path d="M-8 5v7m15-7v7" stroke="#958c75" strokeWidth="4" />
            <circle cx="14" cy="-3" r="1" fill="#5c6854" />
          </g>
          <text x={w / 2} y="25" textAnchor="middle">
            {s('保护案例 · 班夫研究启示', 'Conservation case · Banff')}
          </text>
          <text x={w / 2} y="299" textAnchor="middle">
            {s('通行记录尚不等于基因交流', 'Crossing alone ≠ gene flow')}
          </text>
        </svg>
      )}
      {mode === 1 && local === 1 && (
        <svg
          viewBox={`0 0 ${w} 294`}
          role="img"
          aria-label={s(
            '通行、个体和亲子遗传证据分层',
            'Distinguish movement, identity and parentage evidence',
          )}
        >
          {[
            s('通行影像', 'Crossing images'),
            s('个体鉴定', 'Individual identity'),
            s('亲子与遗传结构', 'Parentage and genetics'),
          ].map((t, i) => (
            <g key={i} opacity={i <= level ? 1 : 0.25}>
              <circle cx="31" cy={61 + i * 75} r="13" fill="#d5dfbf" />
              <text x="31" y={67 + i * 75} textAnchor="middle">
                {i + 1}
              </text>
              <text x="55" y={57 + i * 75}>
                {t}
              </text>
              <text x="55" y={82 + i * 75}>
                {
                  [
                    s('使用了通道', 'Used the crossing'),
                    s('是哪只个体', 'Which individual'),
                    s('繁殖与基因交流', 'Breeding and gene flow'),
                  ][i]
                }
              </text>
            </g>
          ))}
          <text x={w / 2} y="289" textAnchor="middle">
            {s('保留来源、年代、方法', 'Source, date, method')}
          </text>
        </svg>
      )}
      {mode === 2 && local === 0 && (
        <svg
          viewBox={`0 0 ${w} 310`}
          role="img"
          aria-label={s(
            '二十四个氮标记保留身份并经过回用或输出',
            'Twenty-four nitrogen labels retain identity through reuse and outputs',
          )}
        >
          {[
            ['soil', 'crop'],
            ['crop', 'animal'],
            ['crop', 'product'],
            ['animal', 'treatment'],
            ['treatment', 'soil'],
            ['treatment', f.watch || reuse ? 'loss' : 'stored'],
          ].map(([a, b], i) => {
            const x = centers[a as NutrientPool],
              y = centers[b as NutrientPool];
            return (
              <path
                key={i}
                d={`M${x.x} ${x.y}L${y.x} ${y.y}`}
                stroke="#d1c9aa"
                fill="none"
                strokeWidth="2"
              />
            );
          })}
          {(
            [
              'soil',
              'crop',
              'animal',
              'treatment',
              'product',
              f.watch || reuse ? 'loss' : 'stored',
            ] as NutrientPool[]
          ).map((k) => (
            <g key={k}>
              <ellipse
                cx={centers[k].x}
                cy={centers[k].y}
                rx="32"
                ry="21"
                fill={k === 'soil' ? '#d9cfad' : '#e4e8ce'}
              />
              <text x={centers[k].x} y={centers[k].y + 35} textAnchor="middle">
                {
                  {
                    soil: s('土壤', 'Soil'),
                    crop: s('作物', 'Crop'),
                    animal: s('饲养', 'Livestock'),
                    treatment: s('处理', 'Treatment'),
                    product: s('收获', 'Harvest'),
                    loss: s('损失', 'Loss'),
                    stored: s('未回用', 'Stored'),
                  }[k]
                }
              </text>
            </g>
          ))}
          {N.map((n) => {
            const a = point(n.from, n.id),
              b = point(n.to, n.id);
            return (
              <circle
                key={n.id}
                cx={a.x + (b.x - a.x) * n.phase}
                cy={a.y + (b.y - a.y) * n.phase}
                r="2.3"
                fill="#93a578"
                stroke="#758a66"
                strokeWidth=".5"
              />
            );
          })}
          <text x={w / 2} y="18" textAnchor="middle">
            {s('氮元素的迁移与输出', 'Nitrogen transfers and outputs')}
          </text>
        </svg>
      )}
      {mode === 2 && local === 1 && (
        <svg
          viewBox={`0 0 ${w} 310`}
          role="img"
          aria-label={s(
            '功能性状匹配环境，回用量仍受容量限制',
            'Traits must fit conditions, and reuse has capacity limits',
          )}
        >
          <text x={w / 2} y="25" textAnchor="middle">
            {s('同一水分条件', 'Shared moisture')} {m.toFixed(2)}
          </text>
          {[false, true].map((wet, i) => {
            const a = plantEstablishment(1, m, wet),
              x = w * (i === 0 ? 0.27 : 0.73);
            return (
              <g key={i}>
                <ellipse cx={x} cy="161" rx="36" ry="9" fill="#b4a582" />
                {plant(x, 158, 8 + 75 * a.amount, wet)}
                <text x={x} y="194" textAnchor="middle">
                  {wet ? s('耐湿型', 'Wet type') : s('耐旱型', 'Dry type')}
                </text>
              </g>
            );
          })}
          <text x={w / 2} y="231" textAnchor="middle">
            {s('养分输入 / 可利用 / 剩余', 'Input / uptake / excess')}
          </text>
          <text x={w / 2} y="261" textAnchor="middle">
            {cap.input} / {cap.used} / {cap.excess}
          </text>
          <text x={w / 2} y="300" textAnchor="middle">
            {s('功能群与数量为教学假设', 'Illustrative traits and quantities')}
          </text>
        </svg>
      )}
      {mode === 3 && local === 0 && (
        <svg
          viewBox={`0 0 ${w} 308`}
          role="img"
          aria-label={s(
            '厌氧池内液体和沼气沿各自连接通路移动',
            'Slurry and biogas follow distinct connected digester routes',
          )}
        >
          <text x={w / 2} y="24" textAnchor="middle">
            {s('参观路径重建 · 非施工图', 'Visit reconstruction')}
          </text>
          <path d={`M12 161H${w - 12}`} stroke="#c6c5a8" strokeWidth="2" />
          <path d={`M${court.left - 17} 104V75l17-15 17 15v29Z`} fill="#dadcc4" stroke="#a5af94" />
          <text x={court.left} y="49" textAnchor="middle">
            {s('厕舍', 'Inputs')}
          </text>
          <path
            d={`M${court.c - 45} 230v-35q45-46 90 0v35q-45 30-90 0Z`}
            fill="#dbe3d2"
            stroke="#9cac90"
            strokeWidth="2"
          />
          <path d={`M${court.c - 43} 205h86v24q-43 28-86 0Z`} fill="#b9b58e" />
          <path
            d={pathD(court.inlet.slice(0, -1))}
            stroke="#9fac94"
            strokeWidth="10"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d={pathD(court.inlet.slice(0, -1))}
            stroke="#d7d8bb"
            strokeWidth="6"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d={pathD(court.slurry.slice(1))}
            stroke="#9fac94"
            strokeWidth="10"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d={pathD(court.slurry.slice(1))}
            stroke="#d7d8bb"
            strokeWidth="6"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d={pathD(court.gas.slice(2))}
            stroke="#aeb49a"
            strokeWidth="8"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d={pathD(court.gas.slice(2))}
            stroke="#e7e5ca"
            strokeWidth="5"
            strokeLinejoin="round"
            fill="none"
          />
          <path d={`M${w * 0.76 - 15} 98h30v-10h-30Z`} fill="#b7bd9f" />
          <path
            d={`M${w * 0.76} 87q-9-13 0-19q9 12 0 19`}
            fill="#c8ad72"
            opacity={conservationClamp((p - 0.65) / 0.15)}
          />
          <text x={w * 0.76} y="52" textAnchor="middle">
            {s('用气', 'Gas use')}
          </text>
          <path d={`M${w - 39} 233v28h28v-28`} fill="#e2e7d5" stroke="#9caf95" />
          <path d={`M${w - 37} 246h24v13h-24Z`} fill="#bac5a4" />
          {court.nitrogen.map((n) => (
            <circle key={n.id} cx={n.x} cy={n.y} r="1.7" fill="#879e6d" />
          ))}
          {court.gasMarkers
            .filter((q) => q.visible)
            .map((q) => (
              <circle
                key={q.id}
                cx={q.x}
                cy={q.y}
                r="2"
                fill="#c8b877"
                stroke="#b3a369"
                strokeWidth=".6"
              />
            ))}
          <text x={court.c} y="275" textAnchor="middle">
            {s('绿：液中氮 · 金：沼气', 'Green: slurry N · gold: biogas')}
          </text>
          <text x={w / 2} y="304" textAnchor="middle">
            {s('沼液收集后评估处理与利用', 'Collect digestate for managed use')}
          </text>
        </svg>
      )}
      {mode === 3 && local === 1 && (
        <svg
          viewBox={`0 0 ${w} 290`}
          role="img"
          aria-label={s(
            '参观记录将观察、资料和建议分开',
            'Visit notes distinguish observation, sources and proposals',
          )}
        >
          {[
            s('设施与连接路径', 'Structures and links'),
            s('用量、成本与管理', 'Quantities, costs, management'),
            s('待核实的效果', 'Effects to verify'),
            s('结合本地条件', 'Local conditions'),
          ].map((t, i) => (
            <g key={i}>
              <circle cx="27" cy={51 + i * 61} r="7" fill="#a9b58d" />
              <text x="45" y={56 + i * 61}>
                {t}
              </text>
              <path d={`M45 ${75 + i * 61}H${w - 16}`} stroke="#d8dcc7" />
            </g>
          ))}
        </svg>
      )}
      {mode === 4 && local === 0 && (
        <svg
          viewBox={`0 0 ${w} 310`}
          role="img"
          aria-label={s(
            '样方面积和不同碳库共同决定碳密度',
            'Plot area and distinct pools determine carbon density',
          )}
        >
          <text x={w / 2} y="23" textAnchor="middle">
            {s('教学样方', 'Illustrative plot')} {carbon.area} m²
          </text>
          <path
            d={`M24 141L${w * 0.4} 115L${w - 24} 141L${w * 0.6} 167Z`}
            fill="#dce5ca"
            stroke="#a6b48e"
          />
          {plant(w * 0.4, 131, 52)}
          {plant(w * 0.6, 149, 60, true)}
          <path
            d={`M24 141L${w * 0.6} 167V210L24 184Z M${w * 0.6} 167L${w - 24} 141V184L${w * 0.6} 210Z`}
            fill="#c3b497"
            stroke="#b2a386"
          />
          <path d={`M${w * 0.43} 169l-8 18m8-18 12 18`} stroke="#947f62" />
          <text x="15" y="242">
            {s('植被与凋落物', 'Biomass + litter')}
          </text>
          <text x={w - 15} y="242" textAnchor="end">
            {(carbon.above + carbon.roots + carbon.litter).toFixed(1)}
          </text>
          <text x="15" y="270">
            {s('土壤', 'Soil')}
          </text>
          <text x={w - 15} y="270" textAnchor="end">
            {carbon.soil.toFixed(1)}
          </text>
          <text x={w / 2} y="302" textAnchor="middle">
            {carbon.total.toFixed(1)} Mg C/ha
          </text>
        </svg>
      )}
      {mode === 4 && local === 1 && (
        <svg
          viewBox={`0 0 ${w} 310`}
          role="img"
          aria-label={s(
            '按生态系统面积而非样方数量加权',
            'Weight by landscape area rather than sampled plot count',
          )}
        >
          <text x={w / 2} y="24" textAnchor="middle">
            {s('教学区域 · 共100 ha', 'Illustrative region · 100 ha')}
          </text>
          {strata.strata.map((r, i) => (
            <g key={r.name}>
              <text x="16" y={65 + i * 62}>
                {[s('森林', 'Forest'), s('草地', 'Grass'), s('农田', 'Crops')][i]} · {r.areaHa} ha
              </text>
              <text x={w - 16} y={65 + i * 62} textAnchor="end">
                {r.n}
                {s('样方', ' plots')}
              </text>
              <rect
                x="16"
                y={78 + i * 62}
                width={((w - 32) * r.areaHa) / 100}
                height="14"
                rx="7"
                fill={['#a0b284', '#b7c59d', '#cdc497'][i]}
              />
            </g>
          ))}
          <text x={w / 2} y="259" textAnchor="middle">
            {f.watch || weighted
              ? s('按面积加权', 'Area-weighted')
              : s('错误：按样方个数', 'Biased: by plot count')}
          </text>
          <text x={w / 2} y="291" textAnchor="middle">
            {(f.watch || weighted ? strata.weighted : strata.naive).toFixed(1)} Mg C/ha
          </text>
        </svg>
      )}
      {mode === 4 && local === 2 && (
        <svg
          viewBox={`0 0 ${w} 306`}
          role="img"
          aria-label={s(
            '历史研究按样本口径和统计年代解释',
            'Interpret historical research by sample scope and time interval',
          )}
        >
          <text x={w / 2} y="26" textAnchor="middle">
            2011–2015 · {s('野外调查', 'Field campaign')}
          </text>
          <text x={w / 2} y="65" textAnchor="middle">
            17,090 {s('项目样方', 'project plots')}
          </text>
          <text x={w / 2} y="96" textAnchor="middle">
            14,371 {s('碳库存子集', 'stock subset')}
          </text>
          <path d={`M25 124H${w - 25}`} stroke="#d1d8bf" />
          <text x={w / 2} y="158" textAnchor="middle">
            2001–2010 · {s('年均碳汇', 'Annual sink')}
          </text>
          <text x={w / 2} y="195" textAnchor="middle">
            {annual.value.toFixed(1)} {annual.unit}
          </text>
          <text x={w / 2} y="230" textAnchor="middle">
            {s('2018发表 · 综合估计', 'Published 2018 · synthesis')}
          </text>
          <text x={w / 2} y="294" textAnchor="middle">
            {s('库存 ≠ 年变化 · C ≠ CO₂', 'Stock ≠ annual change · C ≠ CO₂')}
          </text>
        </svg>
      )}
      {!f.watch && (
        <div className="bio-conserve-controls">
          <div className="bio-conserve-buttons">
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
          <div className="bio-conserve-buttons">
            {Array.from({ length: mode === 4 ? 3 : 2 }, (_, i) => (
              <button key={i} aria-pressed={local === i} onClick={() => setView(i)}>
                {s('观察', 'View ')}
                {i + 1}
              </button>
            ))}
          </div>
          {((mode === 1 && local === 0) ||
            (mode === 2 && local === 0) ||
            (mode === 3 && local === 0)) && (
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
          {mode === 0 && (
            <>
              {local === 0 ? (
                <div className="bio-conserve-buttons">
                  {waterSites.map((q, i) => (
                    <button key={i} aria-pressed={site === i} onClick={() => setSite(i)}>
                      {q.id}
                    </button>
                  ))}
                </div>
              ) : (
                waterSites.map((q, i) => (
                  <label key={i}>
                    {q.id} · {s('溶解氧 mg/L', 'Oxygen mg/L')}
                    <input
                      type="number"
                      min="0"
                      max="30"
                      step=".1"
                      value={water[i]}
                      placeholder={s('未测量', 'Not measured')}
                      onChange={(e) => {
                        const n = [...water];
                        n[i] = e.target.value;
                        setWater(n);
                      }}
                    />
                  </label>
                ))
              )}
              <label>
                {s(
                  '地点、时间、方法、评价依据与行动计划',
                  'Location, time, methods, criteria and action plan',
                )}
                <textarea
                  value={environmentNote}
                  onChange={(e) => setEnvironmentNote(e.target.value)}
                />
              </label>
            </>
          )}
          {mode === 1 && (
            <>
              {local === 0 ? (
                <button aria-pressed={connected} onClick={() => setConnected(!connected)}>
                  {s('生态通道连通', 'Crossing connected')}
                </button>
              ) : (
                <label>
                  {s('证据层次', 'Evidence level')}
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="1"
                    value={evidence}
                    onChange={(e) => setEvidence(+e.target.value)}
                  />
                </label>
              )}
              <label>
                {s('资料来源、年份、方法和本地保护建议', 'Source, date, method and local proposal')}
                <textarea
                  value={biodiversityNote}
                  onChange={(e) => setBiodiversityNote(e.target.value)}
                />
              </label>
            </>
          )}
          {mode === 2 && local === 0 && (
            <button aria-pressed={reuse} onClick={() => setReuse(!reuse)}>
              {s('养分回用', 'Nutrient reuse')}
            </button>
          )}
          {mode === 2 && local === 1 && (
            <>
              <label>
                {s('环境水分', 'Environmental moisture')} {moisture.toFixed(2)}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step=".01"
                  value={moisture}
                  onChange={(e) => setMoisture(+e.target.value)}
                />
              </label>
              <label>
                {s('养分输入示意量', 'Illustrative nutrient input')} {input}
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={input}
                  onChange={(e) => setInput(+e.target.value)}
                />
              </label>
              <label>
                {s('利用容量示意量', 'Illustrative uptake capacity')} {capacity}
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={capacity}
                  onChange={(e) => setCapacity(+e.target.value)}
                />
              </label>
            </>
          )}
          {mode === 3 && local === 1 && (
            <label>
              {s(
                '参观地点日期、设施路径、访谈与改进计划',
                'Visit date, structures, interviews and improvement plan',
              )}
              <textarea value={visitNote} onChange={(e) => setVisitNote(e.target.value)} />
            </label>
          )}
          {mode === 4 && local === 0 && (
            <>
              <label>
                {s('样方面积/m²', 'Plot area/m²')} {area}
                <input
                  type="range"
                  min="100"
                  max="800"
                  step="100"
                  value={area}
                  onChange={(e) => setArea(+e.target.value)}
                />
              </label>
              <label>
                {s('土层深度/cm', 'Soil depth/cm')} {depth}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={depth}
                  onChange={(e) => setDepth(+e.target.value)}
                />
              </label>
            </>
          )}
          {mode === 4 && local === 1 && (
            <>
              <label>
                {s('森林样方数', 'Forest plot count')} {nPlots}
                <input
                  type="range"
                  min="1"
                  max="9"
                  step="1"
                  value={nPlots}
                  onChange={(e) => setNPlots(+e.target.value)}
                />
              </label>
              <button aria-pressed={weighted} onClick={() => setWeighted(!weighted)}>
                {s('按面积加权', 'Weight by area')}
              </button>
            </>
          )}
          {mode === 4 && local === 2 && (
            <button aria-pressed={co2} onClick={() => setCo2(!co2)}>
              {s('换算为CO₂质量', 'Convert to CO₂ mass')}
            </button>
          )}
          <details>
            <summary>{s('证据口径与教学假设', 'Evidence scopes and assumptions')}</summary>
            <p>
              {s(
                '环境数值为练习示例，不能仅由一个指标判综合水质等级或指定污染来源。通道图非真实GPS，通行不等于成功繁殖；保护资料需补充方法、年代和当地证据。氮标记不进入沼气；回用有收获输出与损失，不代表能量循环。庭院剖面不是施工设计，沼液须按条件评估后处理利用。碳样方输入为教学值：地上2000kg、根500kg、凋落80kg、面积400m²，碳比例0.47/0.45；土壤容重1.2g/cm³、碳比例0.02、石砾比例0.1。库存和年碳汇不同，历史201.1TgC/yr对应2001–2010综合估计，非当前年度数字。',
                'Environmental values are practice examples, not overall classifications or source attribution. The corridor is not real GPS; crossing does not prove breeding. Nitrogen never enters the biogas route, and nutrient reuse is not energy cycling. The courtyard is not a construction design. Plot inputs are illustrative: 2000 kg aboveground, 500 kg roots, 80 kg litter, 400 m²; carbon fractions 0.47/0.45, soil bulk density 1.2 g/cm³, soil carbon 0.02 and rock fraction 0.1. Stocks differ from annual sinks. The historical 201.1 Tg C/yr estimate covers 2001–2010, not the current year.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
