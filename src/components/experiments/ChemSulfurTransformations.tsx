import { useId, useMemo, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  copperSulfuric,
  sulfurComproportionation,
  sulfidePermanganate,
  simulateIronSulfur,
  heatFrameAt,
  ironSulfurInventory,
  sulfurTransformDirector,
} from '../../models/chem-sulfur-transformations';
import '../../styles/chem-sulfur-transformations.css';
const routes = [
  ['−2', '0', 'Na₂S → S'],
  ['+4', '0', 'H₂SO₃ → S'],
  ['+6', '+4', 'H₂SO₄ → SO₂'],
  ['0', '−2', 'S → FeS'],
];
export default function ChemSulfurTransformations() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a),
    id = useId().replace(/:/g, ''),
    practical = film.variant === 'sulfur-practical';
  const [view, setView] = useState(
      film.variant === 'copper-acid' ? 'copper' : practical ? 'sulfide' : 'map',
    ),
    [route, setRoute] = useState('sulfurIV'),
    [extent, setExtent] = useState(0.8),
    [lift, setLift] = useState(0),
    [ironRatio, setIronRatio] = useState(1.15),
    [time, setTime] = useState(4),
    [ignite, setIgnite] = useState(true),
    [endpoint, setEndpoint] = useState<'sulfur' | 'sulfate'>('sulfur');
  const d = film.watch
    ? sulfurTransformDirector(film.chapter, film.chapterProgress, practical)
    : {
        chapter:
          view === 'map'
            ? 0
            : view === 'sulfide'
              ? 1
              : view === 'copper-solution'
                ? 5
                : view === 'iron'
                  ? 7
                  : 3,
        progress: extent,
        view,
        sulfideRoute: route,
        extent,
        lift,
        heated: lift < 0.7,
        practical,
        time,
      };
  const frames = useMemo(
      () =>
        simulateIronSulfur({
          ironRatio: film.watch ? 1.15 : ironRatio,
          ignition: film.watch || ignite,
        }),
      [film.watch, ironRatio, ignite],
    ),
    heat = heatFrameAt(frames, d.time),
    mean = heat.reacted.reduce((a, b) => a + b, 0) / heat.reacted.length,
    inventory = ironSulfurInventory(film.watch ? 1.15 : ironRatio, mean);
  const copper = copperSulfuric(
      d.chapter === 4 || d.view === 'copper-solution' ? 0.7 : 0.7 * d.extent,
    ),
    com = sulfurComproportionation(d.extent),
    perm = sulfidePermanganate(film.watch ? 'sulfur' : endpoint, d.extent),
    sulfur = d.sulfideRoute === 'sulfurIV' ? com.sulfur / 3 : perm.sulfur,
    idx = Math.min(3, Math.floor(d.progress * 4)),
    selected = routes[idx];
  const finalInventory = ironSulfurInventory(1.15, 1);
  const gasActive =
    (d.heated && d.lift < 0.7) || (film.watch && d.chapter === 4 && d.progress < 0.38);
  const gasPath = [
      [88, 65],
      [88, 36],
      [238, 36],
      [238, 181],
    ],
    gasPoint = (q: number) => {
      const lengths = [29, 150, 145],
        total = 324;
      let z = (q % 1) * total;
      for (let i = 0; i < 3; i++) {
        if (z <= lengths[i]) {
          const t = z / lengths[i];
          return {
            x: gasPath[i][0] + (gasPath[i + 1][0] - gasPath[i][0]) * t,
            y: gasPath[i][1] + (gasPath[i + 1][1] - gasPath[i][1]) * t,
          };
        }
        z -= lengths[i];
      }
      return { x: 238, y: 181 };
    };
  const coilY = 188 - d.lift * 83,
    coilRadius = 11 * Math.sqrt(copper.copper),
    coil = Array.from(
      { length: 45 },
      (_, i) =>
        `${i ? 'L' : 'M'}${76 + coilRadius * Math.cos((i * Math.PI) / 7)} ${coilY + i * 0.45}`,
    ).join(' ');
  const title =
    d.chapter === 8
      ? say('空气与过量物质', 'Air and excess material')
      : d.view === 'map'
        ? say('硫的价态与转化方向', 'Sulfur oxidation states')
        : d.view === 'sulfide'
          ? d.sulfideRoute === 'sulfurIV'
            ? 'Na₂S ＋ H₂SO₃'
            : say('Na₂S ＋ 酸性KMnO₄', 'Na₂S + acidified KMnO₄')
          : d.view === 'iron'
            ? say('铁粉与硫粉 · 局部点火', 'Iron and sulfur · local ignition')
            : d.view === 'copper-solution'
              ? say('冷却后 · 溶液中的铜', 'After cooling · copper in solution')
              : say(
                  practical ? '铜片与浓硫酸' : '铜丝与浓硫酸',
                  practical
                    ? 'Copper piece + concentrated acid'
                    : 'Copper wire + concentrated acid',
                );
  return (
    <section className="chem-sulfur-transformations">
      <div className="chem-str-title">{title}</div>
      {d.chapter === 8 ? (
        <div className="chem-str-boundaries">
          <div className="chem-str-balance">Fe + S → FeS</div>
          <div className="chem-str-amounts">
            <span>Fe: 1.15</span>
            <span>S: 1</span>
            <span>FeS: {finalInventory.ironSulfide.toFixed(0)}</span>
            <span>
              {say('余Fe: ', 'Fe left: ')}
              {finalInventory.iron.toFixed(2)}
            </span>
          </div>
          <p>{say('相对物质的量 · 主反应账本', 'Relative amounts · main-reaction balance')}</p>
          <div className="chem-str-air">
            <span>＋O₂</span>
            <span>{say('Fe → 铁的氧化物', 'Fe → iron oxides')}</span>
            <span>S → SO₂</span>
          </div>
        </div>
      ) : d.view === 'map' ? (
        <>
          <svg
            className="chem-str-map"
            viewBox="0 0 320 210"
            role="img"
            aria-label={say(
              '硫的负二零正四正六价之间的转化',
              'Transformations among sulfur oxidation states minus two, zero, plus four and plus six',
            )}
          >
            <defs>
              <marker
                id={`${id}-arrow`}
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M0 0L6 3L0 6Z" fill="#9a865b" />
              </marker>
            </defs>
            <line x1="37" y1="110" x2="283" y2="110" stroke="#b9c3ae" strokeWidth="1.5" />
            {['−2', '0', '+4', '+6'].map((v, i) => (
              <g key={v}>
                <circle
                  cx={42 + i * 79}
                  cy="110"
                  r="21"
                  fill={selected.includes(v) ? '#e8ddbd' : '#eef1e7'}
                />
                <text x={42 + i * 79} y="117" fontSize="22" textAnchor="middle" fill="#687650">
                  {v}
                </text>
              </g>
            ))}
            <path
              d={
                idx === 0
                  ? 'M42 85Q80 25 121 85'
                  : idx === 1
                    ? 'M200 85Q160 25 121 85'
                    : idx === 2
                      ? 'M279 85Q240 25 200 85'
                      : 'M121 138Q80 195 42 138'
              }
              fill="none"
              stroke="#9a865b"
              strokeWidth="2"
              markerEnd={`url(#${id}-arrow)`}
            />
            <text x="160" y="202" fontSize="23" textAnchor="middle" fill="#677550">
              {selected[2]}
            </text>
          </svg>
          {d.chapter === 8 && (
            <div className="chem-str-note">
              {say(
                '空气中还可能有铁、硫与O₂的反应',
                'In air, iron and sulfur can also react with O₂',
              )}
            </div>
          )}
        </>
      ) : (
        <svg className="chem-str-stage" viewBox="0 0 320 280" role="img" aria-label={title}>
          <defs>
            <linearGradient id={`${id}-glass`}>
              <stop stopColor="#e0e6d7" stopOpacity=".2" />
              <stop offset=".6" stopColor="#fff" stopOpacity=".05" />
              <stop offset="1" stopColor="#a4b19a" stopOpacity=".2" />
            </linearGradient>
          </defs>
          {d.view === 'sulfide' ? (
            <>
              <path d="M111 260V90H134M97 260H125" stroke="#b0b79f" strokeWidth="3" fill="none" />
              <path
                d="M134 58V225Q134 247 160 247Q186 247 186 225V58"
                fill={`url(#${id}-glass)`}
                stroke="#98a78c"
                strokeWidth="2"
              />
              <path
                d="M138 151V224Q138 243 160 243Q182 243 182 224V151Z"
                fill={
                  d.sulfideRoute === 'permanganate'
                    ? `rgba(153,102,147,${0.06 + 0.4 * (1 - d.extent)})`
                    : '#dfe6c9'
                }
                opacity=".7"
              />
              {Array.from({ length: 36 }, (_, i) => (
                <circle
                  key={i}
                  cx={143 + ((i * 13) % 35)}
                  cy={163 + ((i * 29) % 70)}
                  r={1.5 + 2 * sulfur}
                  fill="#d5c17d"
                  opacity={sulfur * 0.85}
                />
              ))}
              <ellipse cx="160" cy="58" rx="26" ry="4" fill="#f7f8f1" stroke="#98a78c" />
              {d.progress < 0.5 ? (
                <g>
                  <path d="M185 16l17 10-18 34-11-6Z" fill="#cbd5c5" stroke="#94a387" />
                  <circle
                    cx="173"
                    cy={65 + d.progress * 130}
                    r="4"
                    fill={d.sulfideRoute === 'permanganate' ? '#9b6697' : '#cad9bf'}
                  />
                </g>
              ) : (
                <path
                  d="M134 51q8-9 15-4q10-8 17 0q10-7 20 4v12q-11 4-18 0q-10 7-20 0q-8 4-14 0Z"
                  fill="#d7dfca"
                  stroke="#aab798"
                />
              )}
              <path d="M142 77V202" stroke="white" strokeWidth="3" opacity=".7" />
            </>
          ) : d.view === 'iron' ? (
            <>
              <path d="M30 180L70 150H270L292 180V201H30Z" fill="#c9c5b2" stroke="#a9aa94" />
              <path d="M30 180H292" stroke="#a5a58d" />
              {heat.reacted.map((r, i) => {
                const temp = heat.temperature[i],
                  glow = Math.max(0, Math.min(1, (temp - 0.4) / 0.9)),
                  x = 57 + i * 5.8;
                return (
                  <g key={i}>
                    {glow > 0 && (
                      <ellipse
                        cx={x}
                        cy="155"
                        rx="8"
                        ry="12"
                        fill="#c28151"
                        opacity={glow * 0.35}
                      />
                    )}
                    {[0, 1, 2].map((k) => (
                      <circle
                        key={k}
                        cx={x + (k - 1) * 1.5}
                        cy={157 + k * 3 + (i % 3)}
                        r="3.5"
                        fill={
                          glow > 0.05
                            ? `rgb(${Math.round(78 + glow * 139)},${Math.round(74 + glow * 43)},${Math.round(56 + glow * 7)})`
                            : r > 0.5
                              ? '#626a56'
                              : (i + k) % 2
                                ? '#d8c37d'
                                : '#8a9082'
                        }
                      />
                    ))}
                  </g>
                );
              })}
              {d.time < 1.1 && (
                <g
                  transform={`translate(${-Math.max(0, d.time - 0.7) * 70} ${-Math.max(0, d.time - 0.7) * 80})`}
                >
                  <path d="M16 69L58 154" stroke="#b6c1af" strokeWidth="5" strokeLinecap="round" />
                  <path d="M53 144L58 154" stroke="#cb9667" strokeWidth="5" strokeLinecap="round" />
                </g>
              )}
              <text x="160" y="237" textAnchor="middle" fontSize="22" fill="#657452">
                Fe ＋ S → FeS
              </text>
            </>
          ) : d.view === 'copper-solution' ? (
            <>
              <g transform="translate(95 78) rotate(125)">
                <path
                  d="M-14-45V20Q-14 36 0 36Q14 36 14 20V-45"
                  fill={`url(#${id}-glass)`}
                  stroke="#98a78c"
                  strokeWidth="2"
                />
                <path
                  d={`M-11 -42H11V${-42 + (1 - d.progress) * 70}H-11Z`}
                  fill="#a8bcb9"
                  opacity={0.65}
                />
                <ellipse cx="0" cy="-45" rx="14" ry="3" fill="#f3f5ef" stroke="#98a78c" />
              </g>
              {d.progress < 0.98 && (
                <path
                  d="M132 104Q151 115 164 177"
                  fill="none"
                  stroke="#a5c0bf"
                  strokeWidth="3"
                  opacity=".65"
                />
              )}
              <path d="M120 261V144H138M105 261H135" stroke="#b0b79f" strokeWidth="3" fill="none" />
              <path
                d="M138 120V223Q138 247 164 247Q190 247 190 223V120"
                fill={`url(#${id}-glass)`}
                stroke="#98a78c"
                strokeWidth="2"
              />
              <path
                d={`M142 ${190 - d.progress * 36}H186V222Q186 243 164 243Q142 243 142 222Z`}
                fill="#92bcca"
                opacity={0.2 + 0.6 * d.progress}
              />
              <ellipse cx="164" cy="120" rx="26" ry="4" fill="none" stroke="#98a78c" />
              <path d="M146 137V220" stroke="white" strokeWidth="3" opacity=".7" />
              <text x="236" y="198" textAnchor="middle" fontSize="24" fill="#658f9c">
                Cu²⁺
              </text>
            </>
          ) : (
            <>
              <path d="M36 255V85H57M24 255H48" stroke="#b0b79f" strokeWidth="3" fill="none" />
              <path
                d="M56 65V217Q56 240 82 240Q108 240 108 217V65"
                fill={`url(#${id}-glass)`}
                stroke="#98a78c"
                strokeWidth="2"
              />
              <path
                d="M60 151V217Q60 236 82 236Q104 236 104 217V151Z"
                fill="#dfdfc6"
                opacity=".55"
              />
              <path d="M53 59H111L106 76H58Z" fill="#b6a58a" stroke="#998e77" />
              {practical ? (
                <path
                  d={`M70 ${211 - copper.copper * 17}l22 8-4 14-22-7Z`}
                  fill="#b9906f"
                  stroke="#9c775a"
                />
              ) : (
                <>
                  <path
                    d={`M76 ${45 - d.lift * 23}V${coilY}`}
                    fill="none"
                    stroke="#b18a67"
                    strokeWidth="2.8"
                  />
                  <path
                    d={coil}
                    fill="none"
                    stroke="#b18a67"
                    strokeWidth={2 * Math.sqrt(copper.copper) + 0.6}
                  />
                </>
              )}
              <path
                d="M88 65V36H238V181"
                fill="none"
                stroke="#a4b29b"
                strokeWidth="5"
                strokeLinejoin="round"
              />
              <path
                d="M88 65V36H238V181"
                fill="none"
                stroke="#e4eadd"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M212 92V224Q212 248 238 248Q264 248 264 224V92"
                fill={`url(#${id}-glass)`}
                stroke="#98a78c"
                strokeWidth="2"
              />
              <path
                d="M216 159V224Q216 244 238 244Q260 244 260 224V159Z"
                fill={`rgba(185,94,128,${0.05 + 0.55 * (1 - copper.extent / 0.7)})`}
              />
              <path
                d="M211 87q9-8 17-3q10-8 16 0q10-6 20 3v13q-11 4-21 0q-7 6-16 0q-9 5-16 0Z"
                fill="#d7dfca"
                stroke="#aab798"
              />
              <path d="M238 86V181" fill="none" stroke="#a4b29b" strokeWidth="4" />
              {gasActive &&
                Array.from({ length: 5 }, (_, i) => {
                  const p = gasPoint(d.progress + i / 5);
                  return <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#97a689" />;
                })}
              {d.heated && (
                <>
                  <path d="M67 266q0-13 15-13q15 0 15 13" fill="#b6a081" />
                  <path d="M82 252q-10-11 0-21q10 12 0 21" fill="#c4a071" opacity=".7" />
                </>
              )}
            </>
          )}
        </svg>
      )}
      {d.view === 'sulfide' && (
        <div className="chem-str-evidence">
          {say('NaOH湿棉团 · 减少气体逸出', 'NaOH-wetted cotton · gas absorption')}
        </div>
      )}
      {d.view === 'copper' && (
        <div className="chem-str-copper-labels">
          <span>{say('反应管', 'Reaction tube')}</span>
          <span>{say('品红 · NaOH湿棉团', 'Fuchsin · NaOH cotton')}</span>
        </div>
      )}
      {d.view === 'iron' && (
        <div className="chem-str-evidence">
          {!film.watch && !ignite
            ? say('未施加点火', 'No ignition applied')
            : d.time < 0.7
              ? say('局部热源接触', 'Local heat contact')
              : d.time < 1.1
                ? say('热源移开中', 'Withdrawing heat source')
                : say('外部热源已移开', 'External heat removed')}
          {!film.watch && (
            <span>
              {' '}
              FeS {inventory.ironSulfide.toFixed(2)} · Fe {inventory.iron.toFixed(2)}
            </span>
          )}
        </div>
      )}
      {!film.watch && (
        <div className="chem-str-controls">
          <Segments
            label={say('观察装置', 'Apparatus')}
            value={view}
            onChange={setView}
            options={[
              { value: 'map', label: say('价态图', 'Oxidation states') },
              { value: 'sulfide', label: say('硫化物', 'Sulfide') },
              { value: 'copper', label: say('铜与浓硫酸', 'Copper and acid') },
              { value: 'copper-solution', label: say('铜溶液', 'Copper solution') },
              { value: 'iron', label: say('铁与硫', 'Iron and sulfur') },
            ]}
          />
          {view === 'sulfide' && (
            <>
              <Segments
                label={say('加入试剂', 'Reagent')}
                value={route}
                onChange={setRoute}
                options={[
                  { value: 'sulfurIV', label: 'H₂SO₃' },
                  { value: 'permanganate', label: say('酸性KMnO₄', 'Acidified KMnO₄') },
                ]}
              />
              {route === 'permanganate' && (
                <Segments
                  label={say('假设的硫产物（非预测）', 'Assumed sulfur product (not a prediction)')}
                  value={endpoint}
                  onChange={(v) => setEndpoint(v as 'sulfur' | 'sulfate')}
                  options={[
                    { value: 'sulfur', label: 'S' },
                    { value: 'sulfate', label: 'SO₄²⁻' },
                  ]}
                />
              )}
            </>
          )}
          {view === 'iron' ? (
            <>
              <Segments
                label={say('点火条件', 'Ignition')}
                value={ignite ? 'yes' : 'no'}
                onChange={(v) => setIgnite(v === 'yes')}
                options={[
                  { value: 'yes', label: say('局部点火', 'Local ignition') },
                  { value: 'no', label: say('不点火', 'No ignition') },
                ]}
              />
              <Range
                label={say('模型进程（无量纲）', 'Model progress (dimensionless)')}
                value={time}
                min={0}
                max={20}
                step={0.1}
                onChange={setTime}
              />
              <Range
                label={say('Fe/S的物质的量比', 'Fe/S amount ratio')}
                value={ironRatio}
                min={0}
                max={2}
                step={0.05}
                onChange={setIronRatio}
              />
            </>
          ) : (
            <Range
              label={say('观察程度', 'Observation progress')}
              value={extent}
              min={0}
              max={1}
              step={0.01}
              onChange={setExtent}
            />
          )}
          {view === 'copper' && !practical && (
            <Range
              label={say('提起铜丝（停止新增反应）', 'Lift wire (stop further reaction)')}
              value={lift}
              min={0}
              max={1}
              step={0.01}
              onChange={setLift}
            />
          )}
          <details>
            <summary>{say('模型与证据的边界', 'Model and evidence limits')}</summary>
            <p>
              {say(
                '价态与电子账本严格守恒；浓度、反应时间与产率不由颜色读出。高锰酸钾的产物取决于酸度和试剂条件，选项只比较可能的反应账本。铁硫热传播是无量纲教学模型，未拟合真实点火温度或传播速度；空气中还可能出现氧化副反应。',
                'Oxidation states and electron inventories balance, but colour does not measure concentration, time or yield. Permanganate products depend on acidity and reagent conditions; endpoint choices compare possible balances. The iron–sulfur heat front is a dimensionless teaching model, not a fit to ignition temperature or front speed. Air can introduce oxidation side reactions.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
