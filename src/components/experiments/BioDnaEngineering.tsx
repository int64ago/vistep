import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  dnaClamp as clamp,
  restrictionFrame,
  filtrationFrame,
  precipitationFrame,
  identificationFrame,
  pcrFrame,
  pcrYield,
  plasmidFrame,
  gelFrame,
} from '../../models/bio-dna-engineering';
import '../../styles/bio-dna-engineering.css';
export default function BioDnaEngineering() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z),
    variants = [
      'bio-elective-3-mechanism-25',
      'bio-elective-3-074-1',
      'bio-elective-3-mechanism-26',
      'bio-elective-3-084-1',
    ];
  const [mode0, setMode] = useState(Math.max(0, variants.indexOf(f.variant ?? ''))),
    [view, setView] = useState(0),
    [progress, setProgress] = useState(0.7),
    [blunt, setBlunt] = useState(false),
    [ligase, setLigase] = useState(true),
    [origin, setOrigin] = useState(true),
    [promoter, setPromoter] = useState(true),
    [heat, setHeat] = useState(true),
    [dna, setDna] = useState(true),
    [cycles, setCycles] = useState(10),
    [efficiency, setEfficiency] = useState(1),
    [sample, setSample] = useState<'target' | 'offtarget' | 'none'>('target'),
    [contamination, setContamination] = useState(false),
    [stain, setStain] = useState(true),
    [journal, setJournal] = useState('');
  const mode = f.watch ? (f.chapter < 4 ? 0 : f.chapter < 7 ? 1 : f.chapter < 10 ? 2 : 3) : mode0,
    local = f.watch ? f.chapter - [0, 4, 7, 10][mode] : view,
    p = f.watch ? f.chapterProgress : progress,
    cx = w / 2,
    restriction = restrictionFrame(p, local, f.watch ? false : blunt, f.watch ? true : ligase),
    filter = filtrationFrame(clamp((p - 0.3) / 0.7)),
    precip = precipitationFrame(p),
    ident = identificationFrame(p, f.watch ? true : heat, f.watch ? true : dna),
    pcr = pcrFrame(p),
    yield0 = pcrYield(f.watch ? Math.floor(p * 10) : cycles, f.watch ? 1 : efficiency, true),
    plasmid = plasmidFrame(p, f.watch ? true : promoter, f.watch ? true : origin),
    gel = gelFrame(
      p,
      f.watch ? 'target' : sample,
      f.watch ? false : contamination,
      f.watch ? true : stain,
    );
  const titles = [
      s('切开、连接与载体', 'Cutting, joining and vectors'),
      s('粗提取与鉴定', 'Crude extraction and identification'),
      s('构建、导入与表达', 'Construct, introduce and express'),
      s('扩增与电泳证据', 'Amplification and gel evidence'),
    ],
    views = [
      [
        s('识别与切割', 'Recognition and cleavage'),
        s('末端配对', 'End pairing'),
        s('修复骨架缺口', 'Seal backbone nicks'),
        s('复制原点与标记', 'Origin and marker'),
      ],
      [
        s('研磨与过滤', 'Grind and filter'),
        s('预冷酒精沉淀', 'Cold-alcohol precipitation'),
        s('二苯胺鉴定与空白', 'Diphenylamine and blank'),
      ],
      [
        s('获取与扩增', 'Acquire and amplify'),
        s('表达载体构建', 'Expression construct'),
        s('导入不等于表达', 'Entry is not expression'),
      ],
      [
        s('三步温度循环', 'Three thermal phases'),
        s('循环与理想上限', 'Cycles and ideal yield'),
        s('条带与对照', 'Bands and controls'),
      ],
    ];
  const arc = (r: number, a: number, b: number) =>
    `M${r * Math.cos(a)} ${r * Math.sin(a)}A${r} ${r} 0 ${b - a > Math.PI ? 1 : 0} 1 ${r * Math.cos(b)} ${r * Math.sin(b)}`;
  const circleVector = (r: number, ox = 0) => (
    <g transform={`translate(${ox} 0)`}>
      <circle r={r} fill="none" stroke="#b2bdb4" strokeWidth="4" />
      <path d={arc(r, 2.2, 2.8)} fill="none" stroke="#ba9fb6" strokeWidth="7" />
      <path d={arc(r, 0.7, 1.1)} fill="none" stroke="#b9af83" strokeWidth="7" />
    </g>
  );
  const pcrShot = () => (
    <>
      <text x={cx} y="52" textAnchor="middle">
        {[s('变性', 'Denature'), s('复性', 'Anneal'), s('延伸', 'Extend')][pcr.phase]} ·{' '}
        {pcr.temperature}°C
      </text>
      {[0, 1].map((row) => {
        const y = row ? pcr.bottomY : pcr.topY;
        return (
          <g key={row}>
            <path d={`M29 ${y}H${w - 29}`} stroke="#b0a4be" strokeWidth="3" />
            <text x="15" y={y - 14}>
              {row ? '3′' : '5′'}
            </text>
            <text x={w - 15} y={y - 14} textAnchor="end">
              {row ? '5′' : '3′'}
            </text>
            {Array.from({ length: 10 }, (_, i) => (
              <circle key={i} cx={29 + ((w - 58) * i) / 9} cy={y} r="3" fill="#9383aa" />
            ))}
            {pcr.primer > 0 && (
              <g opacity={pcr.primer}>
                <path
                  d={row ? `M29 ${y - 17}H61` : `M${w - 29} ${y + 17}H${w - 61}`}
                  stroke="#c3aa77"
                  strokeWidth="6"
                />
                {pcr.extension > 0 && (
                  <path
                    d={
                      row
                        ? `M61 ${y - 17}H${61 + (w - 90) * pcr.extension}`
                        : `M${w - 61} ${y + 17}H${w - 61 - (w - 90) * pcr.extension}`
                    }
                    stroke="#8aa99d"
                    strokeWidth="4"
                  />
                )}
                <path
                  d={
                    row
                      ? `M${61 + (w - 90) * pcr.extension - 5} ${y - 22}l6 5-6 5`
                      : `M${w - 61 - (w - 90) * pcr.extension + 5} ${y + 12}l-6 5 6 5`
                  }
                  stroke="#879d8d"
                  fill="none"
                  strokeWidth="2"
                />
              </g>
            )}
          </g>
        );
      })}
      <text x={cx} y="263" textAnchor="middle">
        {s('从引物的3′端延伸', 'Extend from primer 3′ ends')}
      </text>
      <text x={cx} y="292" textAnchor="middle">
        {s('两条新链方向相反', 'New strands run oppositely')}
      </text>
    </>
  );
  return (
    <div className="bio-dna" data-watch={f.watch} ref={host}>
      <div className="bio-dna-head">{titles[mode]}</div>
      {mode === 0 && (
        <svg
          viewBox={`0 0 ${w} 304`}
          role="img"
          aria-label={s(
            '限制酶切断DNA骨架，末端配对后连接酶修复缺口，质粒有复制原点与标记',
            'Restriction enzymes cut the backbone; ligase seals nicks after pairing; vectors have an origin and marker',
          )}
        >
          <text x={cx} y="27" textAnchor="middle">
            {views[0][local]}
          </text>
          {local < 3 ? (
            <>
              <text x={cx} y="69" textAnchor="middle">
                {f.watch || !blunt ? 'EcoRI · G↓AATTC' : 'SmaI · CCC↓GGG'}
              </text>
              <g transform={`translate(${cx} 0)`}>
                {[0, 1].flatMap((row) =>
                  restriction.bases
                    .filter((a) => a.row === row && a.i < 9)
                    .map((a) => {
                      const next = restriction.bases.find((b) => b.row === row && b.i === a.i + 1)!;
                      const nick =
                        a.i === (row ? restriction.bottomCut : restriction.topCut) - 1 &&
                        restriction.cut &&
                        !restriction.joined;
                      return nick ? null : (
                        <path
                          key={`b${a.id}`}
                          d={`M${a.x} ${row ? 190 : 119}H${next.x}`}
                          stroke={restriction.joined ? '#88a89c' : '#b4a5b9'}
                          strokeWidth="3"
                        />
                      );
                    }),
                )}
                {restriction.bases
                  .filter((a) => a.row === 0)
                  .map((a) => {
                    const b = restriction.bases.find((b) => b.row === 1 && b.i === a.i)!;
                    return Math.abs(a.x - b.x) < 1 ? (
                      <path
                        key={`h${a.id}`}
                        d={`M${a.x} 145V160`}
                        stroke="#d1c7bd"
                        strokeDasharray="2 3"
                      />
                    ) : null;
                  })}
                {restriction.bases.map((a) => (
                  <g key={a.id}>
                    <path
                      d={`M${a.x} ${a.row ? 180 : 123}V${a.row ? 190 : 119}`}
                      stroke="#baaabf"
                    />
                    <text
                      x={a.x}
                      y={a.y}
                      textAnchor="middle"
                      style={{ fill: a.left ? '#9689a6' : '#a98d7f' }}
                    >
                      {a.base}
                    </text>
                  </g>
                ))}
              </g>
              <text x={cx + Math.min(...restriction.bases.map((a) => a.x)) - 18} y="101">
                5′
              </text>
              <text
                x={cx + Math.max(...restriction.bases.map((a) => a.x)) + 18}
                y="101"
                textAnchor="end"
              >
                3′
              </text>
              <text x={cx + Math.min(...restriction.bases.map((a) => a.x)) - 18} y="214">
                3′
              </text>
              <text
                x={cx + Math.max(...restriction.bases.map((a) => a.x)) + 18}
                y="214"
                textAnchor="end"
              >
                5′
              </text>
              <text x={cx} y="265" textAnchor="middle">
                {restriction.nicks
                  ? s('骨架缺口', 'Backbone nicks') + `: ${restriction.nicks}`
                  : s('骨架连续', 'Continuous backbone')}
              </text>
            </>
          ) : (
            <>
              <g transform={`translate(${cx} 151)`}>
                {circleVector(61)}
                {!(f.watch || origin) && (
                  <path d={arc(61, 0.7, 1.1)} stroke="#ece9df" strokeWidth="9" fill="none" />
                )}
                <text x="0" y="5" textAnchor="middle">
                  {s('质粒', 'Plasmid')}
                </text>
              </g>
              <text x={cx + 38} y="237" textAnchor="middle">
                ori
              </text>
              <text x={cx - 47} y="231" textAnchor="middle">
                {s('标记', 'Marker')}
              </text>
              <text x={cx} y="283" textAnchor="middle">
                {s('复制示意数量', 'Illustrative copies')}: {plasmid.copies}
              </text>
              <g opacity={p}>
                {Array.from({ length: plasmid.copies - 1 }, (_, i) => (
                  <g key={i} transform={`translate(${cx + (i - 1) * 28} 67)`}>
                    {circleVector(8)}
                  </g>
                ))}
              </g>
            </>
          )}
        </svg>
      )}
      {mode === 1 && (
        <svg
          viewBox={`0 0 ${w} 310`}
          role="img"
          aria-label={s(
            '洋葱研磨液过滤、酒精沉淀和二苯胺空白对照',
            'Onion-extract filtration, alcohol precipitation and diphenylamine blank comparison',
          )}
        >
          <text x={cx} y="27" textAnchor="middle">
            {views[1][local]}
          </text>
          {local === 0 && p < 0.3 ? (
            <>
              <path
                d={`M${cx - 72} 121Q${cx - 62} 213 ${cx} 215Q${cx + 62} 213 ${cx + 72} 121Z`}
                fill="#e0d6c7"
                stroke="#b5a58e"
                strokeWidth="2"
              />
              <ellipse cx={cx} cy="123" rx="72" ry="19" fill="#eee6d6" stroke="#b5a58e" />
              {Array.from({ length: 12 }, (_, i) => (
                <path
                  key={i}
                  d={`M${cx + ((i % 4) - 1.5) * (16 + 10 * p)} ${146 + Math.floor(i / 4) * 13}l8 -4 5 9-8 4Z`}
                  fill="#d6d5ae"
                  stroke="#bbb88f"
                />
              ))}
              <path
                d={`M${cx + 48} ${55 + 6 * Math.sin(p * 60)}L${cx} ${154 + 6 * Math.sin(p * 60)}`}
                stroke="#b9aa91"
                strokeWidth="19"
                strokeLinecap="round"
              />
              <text x={cx} y="272" textAnchor="middle">
                {s('研磨使组织破碎', 'Grinding disrupts tissue')}
              </text>
            </>
          ) : local === 0 ? (
            <>
              <g transform={`translate(${cx} 0)`}>
                <path d={filter.sourcePath} fill="#e4e3c4" />
                <path
                  d="M-48 70L-9 122V150H9V122L48 70"
                  fill="none"
                  stroke="#adb9af"
                  strokeWidth="2"
                />
                <path d="M-47 72H47" stroke="#c2cbc1" />
                <path
                  d="M-32 91L-26 98H-7M7 98H26L32 91"
                  stroke="#c1b49e"
                  strokeWidth="3"
                  fill="none"
                />
                {[-24, -16, -8, 8, 16, 24].map((x) => (
                  <path key={x} d={`M${x} 94v7`} stroke="#b8aa91" />
                ))}
                {[-20, -8, 8, 20].map((x, i) => (
                  <ellipse key={x} cx={x} cy={91 - (i % 2) * 3} rx="6" ry="4" fill="#cbb293" />
                ))}
                <path
                  d="M-46 165V244Q0 258 46 244V165"
                  fill="none"
                  stroke="#b3c1b5"
                  strokeWidth="2"
                />
                <path d={`M-44 ${filter.level}H44V244Q0 254-44 244Z`} fill="#e4e3c4" />
                {p > 0 && p < 1 && (
                  <path d={`M0 150V${filter.level}`} stroke="#d6dfc9" strokeWidth="3" />
                )}
                {filter.particles.map((a) => (
                  <path
                    key={a.id}
                    d={`M${a.x - 2} ${a.y - 4}q4 3 0 6q-3 2 0 4`}
                    stroke="#a9a6b7"
                    strokeWidth="1.5"
                    fill="none"
                  />
                ))}
              </g>
              <text x={cx} y="291" textAnchor="middle">
                {s('粗滤液仍含多类物质', 'Crude filtrate remains mixed')}
              </text>
            </>
          ) : local === 1 ? (
            <>
              <path
                d={`M${cx - 47} 110V240Q${cx} 256 ${cx + 47} 240V110`}
                fill="none"
                stroke="#aabcb3"
                strokeWidth="2"
              />
              <path
                d={`M${cx - 45} ${precip.level}H${cx + 45}V240Q${cx} 252 ${cx - 45} 240Z`}
                fill="#e3e1cf"
              />
              <path
                d={`M${cx - 7} 35V78L${cx} 88L${cx + 7} 78V35`}
                fill="#f4f5ec"
                stroke="#aebdb4"
              />
              <rect
                x={cx - 5}
                y={76 - precip.stock * 2}
                width="10"
                height={precip.stock * 2}
                fill="#d7e1d4"
              />
              {p < 0.5 && p > 0 && (
                <path d={`M${cx} 88V${precip.level}`} stroke="#d8e2d8" strokeWidth="3" />
              )}
              {Array.from({ length: 10 }, (_, i) => (
                <g key={i}>
                  <path
                    d={`M${cx + ((i % 5) - 2) * 12} ${precip.level + 14 + Math.floor(i / 5) * 21}q8 7 0 14q-5 6 0 12`}
                    stroke={precip.precipitate > 0.3 ? '#faf9ed' : '#c3bac6'}
                    strokeWidth={1 + 2 * precip.precipitate}
                    opacity={0.3 + 0.7 * precip.precipitate}
                    fill="none"
                  />
                  <circle
                    cx={cx + ((i % 5) - 2) * 13 + 3}
                    cy={225 - Math.floor(i / 5) * 21}
                    r="2"
                    fill="#bbaa8e"
                  />
                </g>
              ))}
              <text x={cx} y="277" textAnchor="middle">
                20 + {(precip.receiver - 20).toFixed(0)} = {precip.receiver.toFixed(0)} mL
              </text>
              <text x={cx} y="303" textAnchor="middle">
                {s('白色粗提物 ≠ 纯DNA', 'White precipitate ≠ pure DNA')}
              </text>
            </>
          ) : (
            <>
              <path d={`M12 145V253Q${cx} 266 ${w - 12} 253V145`} fill="#e8efec" stroke="#b0c0ba" />
              <path
                d={`M14 164H${w - 14}V250H14Z`}
                fill={`color-mix(in srgb, #e8ded5 ${ident.warmth * 100}%, #e3ebe7)`}
              />
              {[0, 1].map((i) => {
                const x = w * (i ? 0.73 : 0.27),
                  blue = i ? 0 : ident.blue,
                  level = 244 - ident.volume * 9;
                return (
                  <g key={i}>
                    <path
                      d={`M${x - 17} 90V234Q${x} 254 ${x + 17} 234V90`}
                      fill="#fbfbf2"
                      fillOpacity=".8"
                      stroke="#aebdb6"
                      strokeWidth="2"
                    />
                    <path
                      d={`M${x - 15} ${level}H${x + 15}V234Q${x} 251 ${x - 15} 234Z`}
                      fill="#e1e6de"
                    />
                    <path
                      d={`M${x - 15} ${level}H${x + 15}V234Q${x} 251 ${x - 15} 234Z`}
                      fill="#718eb6"
                      opacity={blue}
                    />
                    <path
                      d={`M${x - 5} 44V84L${x} 99L${x + 5} 84V44`}
                      fill="#f3f4ed"
                      stroke="#afbcb5"
                    />
                    <rect
                      x={x - 3}
                      y={82 - ident.stock * 8}
                      width="6"
                      height={ident.stock * 8}
                      fill="#d9dfd2"
                    />
                    {p < 0.35 && p > 0 && (
                      <path d={`M${x} 99V${level}`} stroke="#d5ddcf" strokeWidth="2" />
                    )}
                    <text x={x} y="285" textAnchor="middle">
                      {i ? s('空白', 'Blank') : s('样品', 'Sample')}
                    </text>
                  </g>
                );
              })}
              <text x={cx} y="132" textAnchor="middle">
                {ident.cooled
                  ? s('冷却后比较', 'Compare after cooling')
                  : ident.heated
                    ? s('水浴加热', 'Water bath')
                    : p > 0.85
                      ? s('冷却', 'Cooling')
                      : s('待加热', 'Before heating')}
              </text>
            </>
          )}
        </svg>
      )}
      {mode === 2 && (
        <svg
          viewBox={`0 0 ${w} 308`}
          role="img"
          aria-label={s(
            'PCR获取片段、连接表达元件并区分导入与表达',
            'Acquire DNA by PCR, assemble expression elements and distinguish entry from expression',
          )}
        >
          <text x={cx} y="27" textAnchor="middle">
            {views[2][local]}
          </text>
          {local === 0 ? (
            pcrShot()
          ) : local === 1 ? (
            <>
              <g transform={`translate(${cx} 154)`}>
                <path
                  d={arc(60, 0.7, Math.PI * 2 - 0.7)}
                  fill="none"
                  stroke="#aabbb1"
                  strokeWidth="5"
                />
                <g transform={`translate(${plasmid.insertOffset} 0)`}>
                  <path d={arc(60, -0.7, 0.7)} stroke="#a596b8" strokeWidth="5" fill="none" />
                  <path d={arc(60, -0.55, -0.4)} stroke="#b7a773" strokeWidth="8" fill="none" />
                  <path d={arc(60, -0.3, 0.3)} stroke="#a08cb5" strokeWidth="8" fill="none" />
                  <path d={arc(60, 0.45, 0.58)} stroke="#b78e91" strokeWidth="8" fill="none" />
                </g>
                {plasmid.ligated &&
                  [-0.7, 0.7].map((a) => (
                    <circle
                      key={a}
                      cx={60 * Math.cos(a)}
                      cy={60 * Math.sin(a)}
                      r="4"
                      fill="#84a899"
                    />
                  ))}
                <text x="-12" y="5" textAnchor="middle">
                  ori
                </text>
              </g>
              <text x={cx} y="258" textAnchor="middle">
                P → {s('目的基因', 'Target')} → T
              </text>
              <text x={cx} y="289" textAnchor="middle">
                {s('启动子与终止子都是DNA', 'Promoter and terminator: DNA')}
              </text>
            </>
          ) : (
            <>
              <path
                d={
                  plasmid.pore
                    ? `M${cx + 18} 121A90 60 0 1 1 ${cx - 18} 121`
                    : `M${cx - 90} 180A90 60 0 1 0 ${cx + 90} 180A90 60 0 1 0 ${cx - 90} 180`
                }
                fill="#e7e9d4"
                stroke="#acb99c"
                strokeWidth="4"
              />
              <path
                d={`M${cx - 59} 177q20-26 39 0t38 0q-18 33-40 0t-37 0`}
                stroke="#c0b7a0"
                fill="none"
                strokeWidth="3"
              />
              <g transform={`translate(${cx} ${plasmid.entryY})`}>
                {circleVector(12)}
                <path d={arc(12, -0.6, 0.6)} stroke="#a18bb4" fill="none" strokeWidth="4" />
              </g>
              <path
                d={`M${cx + 15} 182q14 12 28 0`}
                stroke="#bb9c94"
                strokeWidth="2"
                fill="none"
                opacity={plasmid.transcript}
              />
              {[0, 1, 2].map((i) => (
                <circle
                  key={i}
                  cx={cx + 29 + i * 10}
                  cy={210 - (i % 2) * 5}
                  r="3.5"
                  fill="#aa93ac"
                  opacity={plasmid.protein}
                />
              ))}
              <text x={cx} y="276" textAnchor="middle">
                {s('进入、转录、蛋白分别检验', 'Test DNA, RNA and protein')}
              </text>
            </>
          )}
        </svg>
      )}
      {mode === 3 && (
        <svg
          viewBox={`0 0 ${w} 310`}
          className={local === 2 ? 'gel' : undefined}
          role="img"
          aria-label={s(
            'PCR循环与琼脂糖凝胶中分子大小标准、阳性、样品和无模板对照',
            'PCR cycles and a gel with size ladder, positive, sample and no-template controls',
          )}
        >
          {local < 2 && (
            <text x={cx} y="27" textAnchor="middle">
              {views[3][local]}
            </text>
          )}
          {local === 0 ? (
            pcrShot()
          ) : local === 1 ? (
            <>
              <path d={`M26 219H${w - 26}M26 219V75`} fill="none" stroke="#c6c7b5" />
              <path
                d={Array.from({ length: 101 }, (_, i) => {
                  const n = (i / 100) * yield0.cycles;
                  return `${i ? 'L' : 'M'}${26 + ((w - 52) * n) / Math.max(1, yield0.cycles)} ${219 - (130 * (1 + (f.watch ? 1 : efficiency)) ** n) / Math.max(1, yield0.total)}`;
                }).join(' ')}
                stroke="#9f8aae"
                strokeWidth="3"
                fill="none"
              />
              <text x={cx} y="60" textAnchor="middle">
                n={yield0.cycles} · {(f.watch ? 1 : efficiency) * 100}%
              </text>
              <text x={cx} y="258" textAnchor="middle">
                N ={' '}
                {yield0.total >= 1e6
                  ? yield0.total.toExponential(2)
                  : Math.round(yield0.total).toLocaleString()}
              </text>
              <text x={cx} y="289" textAnchor="middle">
                {s('理想模型，不是实测产量', 'Ideal model, not measured yield')}
              </text>
            </>
          ) : (
            <>
              <rect x="8" y="32" width={w - 16} height="253" rx="17" fill="#384a45" />
              {gel.lanes.map((lane, i) => {
                const x = w * (0.28 + i * 0.2);
                return (
                  <g key={lane.id}>
                    <text x={x} y="60" textAnchor="middle">
                      {lane.id}
                    </text>
                    <rect x={x - 9} y="74" width="18" height="8" rx="2" fill="#20332f" />
                    {lane.bands.map((b) => (
                      <g key={b.id}>
                        <rect
                          x={x - 10}
                          y={b.y - 2.5}
                          width="20"
                          height="5"
                          rx="2"
                          fill="#c4e1a4"
                          opacity={b.visible ? 1 : 0}
                        />
                        {i === 0 && p > 0.9 && b.visible && (
                          <text x="15" y={b.y + 5}>
                            {b.bp}
                          </text>
                        )}
                      </g>
                    ))}
                  </g>
                );
              })}
              <path
                d={`M53 ${gel.dyeY}H${w - 17}`}
                stroke="#789fae"
                strokeWidth="1.5"
                strokeDasharray="3 4"
              />
              <text x={w - 20} y="97" textAnchor="end">
                −
              </text>
              <text x={w - 20} y="274" textAnchor="end">
                +
              </text>
              <text x={cx} y="307" textAnchor="middle" style={{ fill: '#62624f' }}>
                {gel.valid
                  ? s('大小相符 ≠ 序列确认', 'Matching size ≠ sequence')
                  : s('无模板对照出现条带', 'Band in no-template control')}
              </text>
            </>
          )}
        </svg>
      )}
      {!f.watch && (
        <div className="bio-dna-controls">
          <div className="bio-dna-buttons">
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
          <div className="bio-dna-buttons">
            {views[mode].map((t, i) => (
              <button key={i} aria-pressed={local === i} onClick={() => setView(i)}>
                {t}
              </button>
            ))}
          </div>
          {!(mode === 3 && local === 1) && (
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
          )}
          {mode === 0 && local < 3 && (
            <div className="bio-dna-buttons">
              <button aria-pressed={blunt} onClick={() => setBlunt(!blunt)}>
                {blunt ? 'SmaI' : 'EcoRI'}
              </button>
              {local === 2 && (
                <button aria-pressed={ligase} onClick={() => setLigase(!ligase)}>
                  {s('连接酶', 'Ligase')}: {ligase ? '✓' : '×'}
                </button>
              )}
            </div>
          )}
          {mode === 0 && local === 3 && (
            <button aria-pressed={origin} onClick={() => setOrigin(!origin)}>
              {s('复制原点', 'Replication origin')}: {origin ? '✓' : '×'}
            </button>
          )}
          {mode === 1 && local === 2 && (
            <div className="bio-dna-buttons">
              <button aria-pressed={heat} onClick={() => setHeat(!heat)}>
                {s('加热', 'Heat')}: {heat ? '✓' : '×'}
              </button>
              <button aria-pressed={dna} onClick={() => setDna(!dna)}>
                {s('样品含DNA', 'DNA in sample')}: {dna ? '✓' : '×'}
              </button>
            </div>
          )}
          {mode === 2 && local === 2 && (
            <button aria-pressed={promoter} onClick={() => setPromoter(!promoter)}>
              {s('可用启动子', 'Functional promoter')}: {promoter ? '✓' : '×'}
            </button>
          )}
          {mode === 3 && local === 1 && (
            <>
              <label>
                {s('循环数', 'Cycles')} {cycles}
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={cycles}
                  onChange={(e) => setCycles(+e.target.value)}
                />
              </label>
              <label>
                {s('每循环示意效率', 'Illustrative efficiency')} {Math.round(efficiency * 100)}%
                <input
                  type="range"
                  min="0"
                  max="1"
                  step=".05"
                  value={efficiency}
                  onChange={(e) => setEfficiency(+e.target.value)}
                />
              </label>
            </>
          )}
          {mode === 3 && local === 2 && (
            <>
              <label>
                {s('人工样品条件', 'Synthetic sample')}
                <select value={sample} onChange={(e) => setSample(e.target.value as typeof sample)}>
                  <option value="target">{s('预期大小', 'Expected size')}</option>
                  <option value="offtarget">{s('非预期多条带', 'Unexpected bands')}</option>
                  <option value="none">{s('无可见产物', 'No visible product')}</option>
                </select>
              </label>
              <div className="bio-dna-buttons">
                <button
                  aria-pressed={contamination}
                  onClick={() => setContamination(!contamination)}
                >
                  {s('无模板对照污染', 'NTC contamination')}: {contamination ? '✓' : '×'}
                </button>
                <button aria-pressed={stain} onClick={() => setStain(!stain)}>
                  {s('核酸染色可见', 'DNA stain visible')}: {stain ? '✓' : '×'}
                </button>
              </div>
            </>
          )}
          <details>
            <summary>{s('模型条件与自己的记录', 'Assumptions and your record')}</summary>
            <p>
              {s(
                '分子与器皿非同一比例；颜色只追踪来源。PCR效率恒定、无平台期仅为教学上限；线性DNA迁移采用对数近似。同大小不等于同序列，粗提物不等于纯DNA。',
                'Molecules and vessels use different scales; colours track origin. Constant PCR efficiency without a plateau is only a teaching model. Linear DNA migration uses a logarithmic approximation. Size does not prove sequence; crude extract is not pure DNA.',
              )}
            </p>
            <label>
              {s('实际材料、条件、条带与对照', 'Actual material, conditions, bands and controls')}
              <textarea value={journal} onChange={(e) => setJournal(e.target.value)} />
            </label>
          </details>
        </div>
      )}
    </div>
  );
}
