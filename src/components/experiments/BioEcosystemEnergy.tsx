import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  ecoClamp,
  lakeBudget,
  energyBudget,
  carbonMarkers,
  carbonLedger,
  contaminantUptake,
  trophicContaminant,
  supportedFoodLinks,
  farmLinks,
  feedingStage,
  type CarbonPool,
  type FieldEvidence,
} from '../../models/bio-ecosystem-energy';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-ecosystem-energy.css';
// Trim each connector to the two displayed ellipse boundaries so its arrowhead remains visible.
function poolConnector(
  a: { x: number; y: number },
  b: { x: number; y: number },
  rx: number,
  ry: number,
) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const t = 1 / Math.hypot(dx / (rx + 3), dy / (ry + 3));
  return `M${a.x + dx * t} ${a.y + dy * t}L${b.x - dx * t} ${b.y - dy * t}`;
}
export default function BioEcosystemEnergy() {
  const film = useShowcase(),
    { host, width: w } = useSignalWidth(),
    id = useId(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const variants = ['bio-elective-2-056-1', 'bio-elective-2-059-1', 'bio-elective-2-mechanism-21'];
  const [chosen, setChosen] = useState(Math.max(0, variants.indexOf(film.variant ?? ''))),
    [view, setView] = useState(0),
    [progress, setProgress] = useState(1),
    [level, setLevel] = useState(0),
    [evidence, setEvidence] = useState<FieldEvidence[]>(Array(4).fill('unknown')),
    [note, setNote] = useState(''),
    [reuse, setReuse] = useState(true),
    [burn, setBurn] = useState(true),
    [exchange, setExchange] = useState(true),
    [tracked, setTracked] = useState(0),
    [elimination, setElimination] = useState(0.08),
    [retention, setRetention] = useState(0.8),
    [mass, setMass] = useState(1);
  const mode = film.watch ? (film.chapter < 3 ? 0 : film.chapter < 5 ? 1 : 2) : chosen,
    local = film.watch ? film.chapter - [0, 3, 5][mode] : Math.min(view, [2, 1, 3][mode]),
    p = film.watch ? film.chapterProgress : progress;
  const lev = film.watch ? Math.min(2, Math.floor(p * 3)) : level,
    budget = energyBudget(lev),
    ev: FieldEvidence[] = film.watch ? ['observed', 'inferred', 'interview', 'unknown'] : evidence,
    links = supportedFoodLinks(ev);
  const markers = carbonMarkers(p, local === 1, film.watch || exchange, film.watch || burn),
    ledger = carbonLedger(markers),
    focus = film.watch
      ? local === 1
        ? p < 0.45
          ? 0
          : 10
        : p < 0.28
          ? 0
          : p < 0.45
            ? 6
            : p < 0.66
              ? 9
              : p < 0.82
                ? 8
                : 10
      : tracked;
  const uptake = contaminantUptake(p * 12, film.watch ? 0.08 : elimination),
    feed = feedingStage(p),
    load = trophicContaminant(
      feed.consumedFraction,
      film.watch ? 0.8 : retention,
      film.watch ? 1 : mass,
    );
  const titles = [
    s('湖泊能量账本', 'The lake’s energy budget'),
    s('从调查建立关系', 'Build relationships from evidence'),
    s('碳循环与污染物积累', 'Carbon and contaminants'),
  ];
  const poolCenters: Record<CarbonPool, { x: number; y: number }> =
    local === 1
      ? {
          air: { x: w / 2, y: 55 },
          ocean: { x: w * 0.25, y: 210 },
          fossil: { x: w * 0.75, y: 210 },
          plant: { x: 0, y: 0 },
          animal: { x: 0, y: 0 },
          soil: { x: 0, y: 0 },
        }
      : {
          air: { x: w / 2, y: 48 },
          plant: { x: w * 0.25, y: 143 },
          animal: { x: w * 0.75, y: 143 },
          soil: { x: w / 2, y: 239 },
          ocean: { x: 0, y: 0 },
          fossil: { x: 0, y: 0 },
        };
  const point = (pool: CarbonPool, n: number) => ({
    x: poolCenters[pool].x + ((n % 4) - 1.5) * 8,
    y: poolCenters[pool].y + (Math.floor(n / 4) - 1) * 8,
  });
  const arrow = (path: string, color = '#c2b06b', width = 2, dashed = false) => (
    <path
      d={path}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dashed ? '5 5' : undefined}
      markerEnd={`url(#${id}-arrow)`}
    />
  );
  const defs = (
    <defs>
      <marker
        id={`${id}-arrow`}
        markerWidth="6"
        markerHeight="6"
        refX="5.5"
        refY="3"
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <path d="M0 0L6 3 0 6" fill="#9ba387" />
      </marker>
    </defs>
  );
  const plant = (x: number, y: number, scale = 1) => (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M0 20v-41M0 9q-23-4-18-18Q-3-7 0 2M0-7q21-9 17-22Q3-24 0-11"
        fill="#91a974"
        stroke="#788f65"
        strokeWidth="2"
      />
      <path d="M-13 22h26" stroke="#9e9e7e" strokeWidth="3" />
    </g>
  );
  const fish = (x: number, y: number, scale = 1, fill = '#a3b9ae', faceLeft = false) => (
    <g transform={`translate(${x} ${y}) scale(${faceLeft ? -scale : scale} ${scale})`}>
      <path
        d="M-32 0l-17-16v32l17-16Q-8-25 30-13L44-3l-9 3 9 3-14 10Q-8 25-32 0Z"
        fill={fill}
        stroke="#7e9d91"
        strokeWidth="1.5"
      />
      <circle cx="27" cy="-6" r="2" fill="#4f7165" />
      <path d="M13-13q-7 13 0 26" fill="none" stroke="#7e9d91" />
    </g>
  );
  const groupNames = [
      s('传给下一级', 'Next level'),
      s('呼吸散失', 'Respiration'),
      s('分解者利用', 'Decomposers'),
      s('本期未利用', 'Unutilized'),
    ],
    groupColors = ['#a1b68a', '#cba984', '#9aafaa', '#d5d0b3'];
  const farmPositions = {
    crop: { x: w * 0.24, y: 64 },
    insect: { x: w * 0.75, y: 64 },
    bird: { x: w * 0.75, y: 202 },
    livestock: { x: w * 0.24, y: 202 },
    soil: { x: w / 2, y: 278 },
  };
  return (
    <div className="bio-energy" data-watch={film.watch} ref={host}>
      <div className="bio-energy-head">{titles[mode]}</div>
      {mode === 0 && local === 0 && (
        <svg
          viewBox={`0 0 ${w} 300`}
          role="img"
          aria-label={s(
            '三个营养级固定与同化的能量',
            'Energy fixed and assimilated at three trophic levels',
          )}
        >
          {defs}
          <path d={`M12 81q${w * 0.2}-14 ${w * 0.45} 0t${w * 0.5} 0v183H12Z`} fill="#e1ece2" />
          <path
            d={`M12 81q${w * 0.2}-14 ${w * 0.45} 0t${w * 0.5} 0`}
            stroke="#bbcec0"
            fill="none"
          />
          {plant(w * 0.2, 66, 0.7)}
          {arrow(`M${w * 0.32} 88L${w * 0.46} 140`)}
          <g opacity={ecoClamp((p - 0.15) / 0.2)}>
            <ellipse cx={w * 0.5} cy="157" rx="13" ry="19" fill="#c7c5a4" stroke="#a1ac89" />
            <path
              d={`M${w * 0.5 - 8} 151l-12-5m12 11-12 6m28-11 12-5m-12 11 12 6`}
              stroke="#a1ac89"
            />
            {arrow(`M${w * 0.58} 177L${w * 0.71} 214`)}
          </g>
          <g opacity={ecoClamp((p - 0.4) / 0.2)}>{fish(w * 0.77, 233, 0.7)}</g>
          {lakeBudget.map((b, i) => (
            <g key={i} opacity={ecoClamp((p - i * 0.2) / 0.2)}>
              <text
                x={w * (i === 0 ? 0.55 : i === 1 ? 0.23 : 0.35)}
                y={40 + i * 90}
                textAnchor="middle"
              >
                {s(b.zh, b.en)}
              </text>
              <text
                x={w * (i === 0 ? 0.55 : i === 1 ? 0.23 : 0.35)}
                y={65 + i * 90}
                textAnchor="middle"
              >
                {b.input}
              </text>
            </g>
          ))}
          <text x={w / 2} y="291" textAnchor="middle">
            J/(cm²·a)
          </text>
        </svg>
      )}
      {mode === 0 && local === 1 && (
        <svg
          viewBox={`0 0 ${w} 302`}
          role="img"
          aria-label={s('按来源拆分同一份能量', 'Partition the same energy input')}
        >
          <text x={w / 2} y="25" textAnchor="middle">
            {s(budget.zh, budget.en)} · {budget.input}
          </text>
          {(() => {
            let x = 16;
            return [
              budget.transfer,
              budget.respiration,
              budget.decomposer,
              budget.unused,
              budget.remainder,
            ].map((v, i) => {
              const width = ((w - 32) * v) / budget.input,
                old = x;
              x += width;
              return (
                <rect
                  key={i}
                  x={old}
                  y="53"
                  width={width}
                  height="30"
                  fill={groupColors[i] ?? '#ac8f80'}
                />
              );
            });
          })()}
          {[budget.transfer, budget.respiration, budget.decomposer, budget.unused].map((v, i) => (
            <g key={i}>
              <circle cx="25" cy={116 + i * 37} r="5" fill={groupColors[i]} />
              <text x="41" y={121 + i * 37}>
                {groupNames[i]}
              </text>
              <text x={w - 17} y={121 + i * 37} textAnchor="end">
                {budget.trace && i === 2 ? s('微量', 'Trace') : v.toFixed(1)}
              </text>
            </g>
          ))}
          {budget.trace && (
            <text x={w / 2} y="275" textAnchor="middle">
              {s('微量／取整余项 0.1', 'Unassigned 0.1')}
            </text>
          )}
          <text x={w / 2} y="299" textAnchor="middle">
            J/(cm²·a)
          </text>
        </svg>
      )}
      {mode === 0 && local === 2 && (
        <svg
          viewBox={`0 0 ${w} 294`}
          role="img"
          aria-label={s('传递效率与总体收支', 'Transfer efficiencies and total accounting')}
        >
          <text x={w / 2} y="27" textAnchor="middle">
            62.8 ÷ 464.6 = 13.5%
          </text>
          <text x={w / 2} y="57" textAnchor="middle">
            12.6 ÷ 62.8 = 20.1%
          </text>
          {[
            { name: s('呼吸散失', 'Respiration'), v: 122.6, color: groupColors[1] },
            { name: s('分解者利用', 'Decomposers'), v: 14.6, color: groupColors[2] },
            { name: s('本期未利用', 'Unutilized'), v: 327.3, color: groupColors[3] },
          ].map((r, i) => (
            <g key={i}>
              <text x="15" y={101 + i * 52}>
                {r.name}
              </text>
              <text x={w - 15} y={101 + i * 52} textAnchor="end">
                {r.v}
              </text>
              <rect
                x="15"
                y={110 + i * 52}
                width={((w - 30) * r.v) / 464.6}
                height="13"
                rx="6"
                fill={r.color}
              />
            </g>
          ))}
          <text x={w / 2} y="267" textAnchor="middle">
            122.6 + 14.6 + 327.3 + 0.1
          </text>
          <text x={w / 2} y="292" textAnchor="middle">
            = 464.6 J/(cm²·a)
          </text>
        </svg>
      )}
      {mode === 1 && local === 0 && (
        <svg
          viewBox={`0 0 ${w} 310`}
          role="img"
          aria-label={s('由记录形成食物关系', 'Food relationships built from records')}
        >
          {defs}
          {links.map((l, i) => {
            const a = farmPositions[l.from],
              b = farmPositions[l.to];
            return (
              <g key={i} opacity={film.watch ? ecoClamp((p - i * 0.16) / 0.15) : 1}>
                {arrow(
                  poolConnector(a, b, 38, 25),
                  l.supported ? '#a0b086' : '#c4cab8',
                  2,
                  !l.supported,
                )}
              </g>
            );
          })}
          {Object.entries(farmPositions).map(([name, pt]) => (
            <g key={name}>
              <ellipse
                cx={pt.x}
                cy={pt.y}
                rx="38"
                ry="25"
                fill={name === 'soil' ? '#ded7bf' : '#e7eddb'}
              />
              <text x={pt.x} y={pt.y + 5} textAnchor="middle">
                {
                  {
                    crop: s('作物', 'Crops'),
                    insect: s('昆虫', 'Insects'),
                    bird: s('食虫鸟', 'Birds'),
                    livestock: s('牲畜', 'Livestock'),
                    soil: s('分解', 'Decay'),
                  }[name]
                }
              </text>
            </g>
          ))}
          <text x={w / 2} y="19" textAnchor="middle">
            {film.watch
              ? s('调查记录示例', 'Example investigation')
              : s('我的证据关系图', 'My evidence map')}
          </text>
          <text x={w / 2} y="125" textAnchor="middle">
            {s('虚线：待核实', 'Dashed: verify')}
          </text>
        </svg>
      )}
      {mode === 1 && local === 1 && (
        <svg
          viewBox={`0 0 ${w} 310`}
          role="img"
          aria-label={s('物质回田与能量多级利用', 'Nutrient return and successive energy use')}
        >
          {defs}
          {plant(w * 0.23, 57, 0.7)}
          <text x={w * 0.23} y="103" textAnchor="middle">
            {s('作物', 'Crop')}
          </text>
          <path
            d={`M${w * 0.72 - 23} 49h41l8 11-9 13h-37l-7-9Zm4 24v18m28-18v18`}
            fill="#bbad90"
            stroke="#9b917c"
          />
          <text x={w * 0.74} y="111" textAnchor="middle">
            {s('牲畜', 'Livestock')}
          </text>
          {arrow(`M${w * 0.34} 66H${w * 0.63}`)}
          {arrow(`M${w * 0.72} 116L${w / 2 + 15} 159`)}
          <path d={`M${w / 2 - 36} 199v-25q36-32 72 0v25Z`} fill="#bcc9ab" stroke="#8fa47e" />
          <text x={w / 2} y="222" textAnchor="middle">
            {s('有机物处理', 'Organic treatment')}
          </text>
          {(film.watch || reuse) && (
            <>
              {arrow(`M${w / 2 + 33} 190L${w * 0.8} 257`)}
              <path
                d={`M${w * 0.8 - 18} 282v-15h36v15Zm5-22q-6-16 8-20q12 14 0 20`}
                fill="#ccb887"
                stroke="#ab9a72"
              />
              <text x={w * 0.8} y="306" textAnchor="middle">
                {s('供能', 'Energy use')}
              </text>
              {arrow(`M${w / 2 - 35} 186Q${w * 0.09} 191 ${w * 0.18} 107`, '#9aa995', 2, true)}
              <text x={w * 0.17} y="247" textAnchor="middle">
                {s('养分回田', 'Nutrients')}
              </text>
            </>
          )}
          {!(film.watch || reuse) && (
            <>
              <path d={`M${w / 2} 202v66`} stroke="#bdb9a4" strokeDasharray="5 5" />
              <text x={w / 2} y="298" textAnchor="middle">
                {s('未安排后续利用', 'No further use specified')}
              </text>
            </>
          )}
          <text x={w / 2} y="22" textAnchor="middle">
            {s('黄线：能量 · 灰线：养分', 'Gold: energy · gray: nutrients')}
          </text>
        </svg>
      )}
      {mode === 2 && local < 2 && (
        <svg
          viewBox={`0 0 ${w} 300`}
          role="img"
          aria-label={s('保留身份的碳元素标记', 'Carbon labels retain their identities')}
        >
          {defs}
          {[...new Set(markers.filter((m) => m.to !== m.from).map((m) => `${m.from}:${m.to}`))].map(
            (pair) => {
              const [from, to] = pair.split(':') as CarbonPool[],
                a = poolCenters[from],
                b = poolCenters[to];
              return <g key={pair}>{arrow(poolConnector(a, b, 41, 23), '#c9b899', 1.5)}</g>;
            },
          )}
          {(local === 1 ? ['air', 'ocean', 'fossil'] : ['air', 'plant', 'animal', 'soil']).map(
            (pool) => {
              const k = pool as CarbonPool,
                c = poolCenters[k];
              return (
                <g key={pool}>
                  <ellipse
                    cx={c.x}
                    cy={c.y}
                    rx="41"
                    ry="23"
                    fill={k === 'ocean' ? '#dce9e1' : k === 'fossil' ? '#d7d2bf' : '#e5e9d4'}
                  />
                  <text x={c.x} y={c.y - 29} textAnchor="middle">
                    {
                      {
                        air: 'CO₂',
                        plant: s('植物碳', 'Plant C'),
                        animal: s('动物碳', 'Animal C'),
                        soil: s('土壤碳', 'Soil C'),
                        ocean: s('海洋碳', 'Ocean C'),
                        fossil: s('化石碳', 'Fossil C'),
                      }[k]
                    }
                  </text>
                  <text x={c.x} y={c.y + 41} textAnchor="middle">
                    {ledger[k]} C
                  </text>
                </g>
              );
            },
          )}
          {markers.map((m) => {
            const a = point(m.from, m.id),
              b = point(m.to, m.id),
              q = m.phase;
            return (
              <circle
                key={m.id}
                cx={a.x + (b.x - a.x) * q}
                cy={a.y + (b.y - a.y) * q}
                r={m.id === focus ? 5 : 3}
                fill={m.id === focus ? '#ad885d' : '#c0a780'}
                stroke={m.id === focus ? '#806849' : '#aa9879'}
                strokeWidth={m.id === focus ? 1.5 : 0.5}
              />
            );
          })}
          <text x={w / 2} y="299" textAnchor="middle">
            {s('共12个C标记', '12 carbon labels in total')}
          </text>
        </svg>
      )}
      {mode === 2 && local === 2 && (
        <svg
          viewBox={`0 0 ${w} 310`}
          role="img"
          aria-label={s(
            '摄入与排出共同决定体内积累',
            'Uptake and elimination determine body burden',
          )}
        >
          {defs}
          <rect x="12" y="53" width={w - 24} height="184" rx="20" fill="#e1ece5" />
          <rect
            x="12"
            y="53"
            width={w - 24}
            height="184"
            rx="20"
            fill="#b79b71"
            opacity={uptake.waterConcentration / 24}
          />
          <text x={w / 2} y="24" textAnchor="middle">
            {s('持久性污染物 · 示意量', 'Persistent pollutant · model')}
          </text>
          {fish(
            w / 2,
            142,
            Math.min(1.4, (w - 90) / 93),
            `rgb(${181 - Math.round(uptake.bodyConcentration * 1.1)},${185 - Math.round(uptake.bodyConcentration * 1.5)},${153 - Math.round(uptake.bodyConcentration * 1.2)})`,
          )}
          {arrow(
            `M${w * 0.24} 206Q${w * 0.15} 145 ${w * 0.35} 125`,
            '#b6a074',
            uptake.uptakeFlux * 0.7,
          )}
          {arrow(
            `M${w * 0.66} 159Q${w * 0.82} 180 ${w * 0.7} 215`,
            '#a2b79a',
            uptake.eliminationFlux * 0.7,
          )}
          <text x="24" y="225">
            {s('摄入', 'Uptake')}
          </text>
          <text x={w - 24} y="225" textAnchor="end">
            {s('排出', 'Elimination')}
          </text>
          <text x={w / 2} y="265" textAnchor="middle">
            {s('体内', 'Body')} {uptake.bodyConcentration.toFixed(1)} µg/kg
          </text>
          <text x={w / 2} y="293" textAnchor="middle">
            {s('水中', 'Water')} {uptake.waterConcentration.toFixed(2)} µg/kg
          </text>
        </svg>
      )}
      {mode === 2 && local === 3 && (
        <svg
          viewBox={`0 0 ${w} 305`}
          role="img"
          aria-label={s(
            '累计摄食与保留量决定营养级放大',
            'Cumulative feeding and retention determine magnification',
          )}
        >
          <text x={w / 2} y="24" textAnchor="middle">
            {s('累计摄食模型', 'Cumulative feeding model')}
          </text>
          {fish(w * 0.7, 133, 1, '#a4b59b', true)}
          {feed.portion < 10 && (
            <ellipse
              key={feed.portion}
              cx={32 + (w * 0.7 - 44 - 32) * feed.travel + 9 * feed.contact}
              cy="133"
              rx={4 * (1 - feed.contact)}
              ry={1.5 * (1 - feed.contact)}
              fill="#b7a479"
            />
          )}
          <text x="18" y="91">
            {s('食物份量', 'Food portions')}
          </text>
          <text x={w / 2} y="194" textAnchor="middle">
            {s('已摄食', 'Consumed')} {load.foodMassKg.toFixed(1)} kg
          </text>
          <text x={w / 2} y="224" textAnchor="middle">
            {s('保留', 'Retained')} {load.retained.toFixed(1)} µg · {s('未保留', 'Other')}{' '}
            {load.rejected.toFixed(1)} µg
          </text>
          <text x={w / 2} y="258" textAnchor="middle">
            {s('食物', 'Food')} 2 → {s('体内', 'Body')} {load.concentration.toFixed(1)} µg/kg
          </text>
          <text x={w / 2} y="289" textAnchor="middle">
            {s('浓度比', 'Concentration ratio')} {load.magnification.toFixed(1)}×
          </text>
        </svg>
      )}
      {!film.watch && (
        <div className="bio-energy-controls">
          <div className="bio-energy-buttons">
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
          <div className="bio-energy-buttons">
            {Array.from({ length: [3, 2, 4][mode] }, (_, i) => (
              <button key={i} aria-pressed={local === i} onClick={() => setView(i)}>
                {s('观察', 'View ')}
                {i + 1}
              </button>
            ))}
          </div>
          {(mode === 2 || (mode === 0 && local === 0)) && (
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
          {mode === 0 && local === 1 && (
            <div className="bio-energy-buttons">
              {lakeBudget.map((b, i) => (
                <button key={i} aria-pressed={level === i} onClick={() => setLevel(i)}>
                  {s(b.zh, b.en)}
                </button>
              ))}
            </div>
          )}
          {mode === 1 && local === 0 && (
            <>
              {farmLinks.map((l, i) => (
                <label key={i}>
                  {s(l.zh, l.en)}
                  <select
                    value={evidence[i]}
                    onChange={(e) => {
                      const n = [...evidence];
                      n[i] = e.target.value as FieldEvidence;
                      setEvidence(n);
                    }}
                  >
                    <option value="unknown">{s('未核实', 'Unverified')}</option>
                    <option value="observed">{s('直接观察', 'Direct observation')}</option>
                    <option value="interview">{s('访谈资料', 'Interview')}</option>
                    <option value="inferred">{s('推测', 'Hypothesis')}</option>
                  </select>
                </label>
              ))}
              <label>
                {s('地点、时间与证据备注', 'Place, time and evidence notes')}
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={s(
                    '尚未记录；关系图不自动生成能量测量值',
                    'No records yet; links do not establish measured energy flows',
                  )}
                />
              </label>
            </>
          )}
          {mode === 1 && local === 1 && (
            <button aria-pressed={reuse} onClick={() => setReuse(!reuse)}>
              {s('安排有机物后续利用', 'Plan further organic-matter use')}
            </button>
          )}
          {mode === 2 && local < 2 && (
            <label>
              {s('跟踪碳标记', 'Track carbon label')} {tracked + 1}
              <input
                type="range"
                min="0"
                max="11"
                step="1"
                value={tracked}
                onChange={(e) => setTracked(+e.target.value)}
              />
            </label>
          )}
          {mode === 2 && local === 1 && (
            <div className="bio-energy-buttons">
              <button aria-pressed={exchange} onClick={() => setExchange(!exchange)}>
                {s('海气交换', 'Ocean–air exchange')}
              </button>
              <button aria-pressed={burn} onClick={() => setBurn(!burn)}>
                {s('释放化石碳', 'Release fossil carbon')}
              </button>
            </div>
          )}
          {mode === 2 && local === 2 && (
            <label>
              {s('排出速率系数', 'Elimination coefficient')} {elimination.toFixed(2)}
              <input
                type="range"
                min="0"
                max="1"
                step=".01"
                value={elimination}
                onChange={(e) => setElimination(+e.target.value)}
              />
            </label>
          )}
          {mode === 2 && local === 3 && (
            <>
              <label>
                {s('污染物保留比例', 'Contaminant retention')} {retention.toFixed(2)}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step=".01"
                  value={retention}
                  onChange={(e) => setRetention(+e.target.value)}
                />
              </label>
              <label>
                {s('消费者体重', 'Consumer body mass')} {mass} kg
                <input
                  type="range"
                  min=".5"
                  max="5"
                  step=".5"
                  value={mass}
                  onChange={(e) => setMass(+e.target.value)}
                />
              </label>
            </>
          )}
          <details>
            <summary>{s('单位、证据与教学简化', 'Units, evidence and simplifications')}</summary>
            <p>
              {s(
                '湖泊采用教材年收支J/(cm²·a)，0.1余项属于微量/取整差，不补造实测分解者数据；未利用不全是热。调查图以证据类型标边，不能自动推出kJ数值。碳点是普通碳元素的教学标记，不是同位素实验或完整CO₂分子，含转移中总数守恒。污染物取24µg、水10kg、体重1kg，摄入系数0.3，时间是示意单位。营养级图累计10kg食物、2µg/kg，消费者体重作为给定分析量，未模拟生长或真实DDT动力学；保留率低或稀释强时不一定出现放大。',
                'Lake values use the textbook’s annual J/(cm²·year) budget. The 0.1 residual is trace/rounding, not invented decomposer data; unutilized energy is not all heat. Evidence-tagged links do not establish measured kJ. Carbon dots are ordinary-carbon teaching labels, not an isotope experiment or intact CO₂ molecules. Pollutant examples use 24 µg, 10 kg water, 1 kg body mass and uptake coefficient 0.3 with arbitrary time. Trophic transfer considers 10 kg cumulative food at 2 µg/kg and a specified consumer mass; it does not simulate growth or measured DDT kinetics. Low retention or dilution need not magnify concentrations.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
