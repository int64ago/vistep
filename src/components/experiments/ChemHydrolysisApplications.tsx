import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  hydroClamp as clamp,
  saltHydrolysis,
  ferricHydrolysis,
  mudParticle,
  colloidPreparation,
  oilCleaning,
  rinseOilTube,
  type HydroSalt,
} from '../../models/chem-hydrolysis-applications';
import '../../styles/chem-hydrolysis-applications.css';
export default function ChemHydrolysisApplications() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z),
    cx = w / 2;
  const [view, setView] = useState(
      f.variant === 'chem-elective-1-inquiry-p75'
        ? 3
        : f.variant === 'chem-elective-1-activity-3'
          ? 7
          : 0,
    ),
    [progress, setProgress] = useState(0.5),
    [concentration, setC] = useState(0.1),
    [postPH, setPH] = useState(6.5),
    [mix, setMix] = useState(true),
    [waterControl, setWater] = useState(false),
    [hot, setHot] = useState(true),
    [notes, setNotes] = useState('');
  const v = f.watch ? f.chapter : view,
    p = clamp(f.watch ? f.chapterProgress : progress),
    C = f.watch ? 0.1 : concentration,
    measuredPH = f.watch ? 6.5 : postPH,
    stir = f.watch ? true : mix,
    matched = f.watch ? false : waterControl;
  const labels = [
    s('中性盐：先观察', 'Neutral salts: observe first'),
    s('强碱弱酸盐', 'Salts of weak acids'),
    s('强酸弱碱盐', 'Salts of weak bases'),
    s('硫酸铁：改变温度', 'Ferric sulfate: temperature'),
    s('加水：比例与浓度分开看', 'Dilution: fraction versus concentration'),
    s('加晶体：总量也改变', 'Crystals change the total amount'),
    s('加酸：抑制水解', 'Added acid suppresses hydrolysis'),
    s('晶体入水，再加入浓酸', 'Dissolve crystals, then add acid'),
    s('泥水、铁盐、铝盐与空白', 'Muddy water, coagulants and reference'),
    s('凝聚之后，颗粒才更快沉降', 'Aggregation makes settling faster'),
    s('沸水中逐滴制备胶体', 'Prepare colloid dropwise in boiling water'),
    s('冷热纯碱中的油污', 'Oil in cold and heated carbonate'),
    s('倒掉并冲洗后，比较内壁', 'Compare the walls after draining and rinsing'),
  ];
  const text = (x: number, y: number, t: string, a: 'middle' | 'start' | 'end' = 'middle') => (
    <text x={x} y={y} textAnchor={a}>
      {t}
    </text>
  );
  const colorPH = (ph: number) => (ph < 6 ? '#d9b391' : ph > 8 ? '#9cb1a2' : '#c6cbb0');
  const tube = (x: number, ml: number, color = '#d7e3ce') => {
    const level = 270 - ml * 12;
    return (
      <>
        <path
          d={`M${x - 24} 141V263Q${x - 24} 277 ${x - 12} 277H${x + 12}Q${x + 24} 277 ${x + 24} 263V141`}
          fill="#f3f6e8"
          stroke="#a1b7a5"
          strokeWidth="2"
        />
        <path
          d={`M${x - 22} ${level}V262Q${x - 22} 275 ${x - 11} 275H${x + 11}Q${x + 22} 275 ${x + 22} 262V${level}Z`}
          fill={color}
        />
      </>
    );
  };
  const dropper = (x: number, tip: number) => (
    <path
      d={`M${x - 5} ${tip - 42}V${tip - 13}L${x} ${tip}L${x + 5} ${tip - 13}V${tip - 42}`}
      fill="#edf3e4"
      stroke="#a2b9a5"
      strokeWidth="2"
    />
  );
  const pairs: HydroSalt[][] = [
    ['NaCl', 'KNO3'],
    ['Na2CO3', 'NaAc'],
    ['NH4Cl', 'AmSulfate'],
  ];
  const saltNames: Record<HydroSalt, string> = {
    NaCl: 'NaCl',
    KNO3: 'KNO₃',
    Na2CO3: 'Na₂CO₃',
    NaAc: 'CH₃COONa',
    NH4Cl: 'NH₄Cl',
    AmSulfate: '(NH₄)₂SO₄',
  };
  return (
    <div className="chem-hydrolysis" ref={host}>
      <div className="chem-hydrolysis-head">{labels[v]}</div>
      <svg viewBox={`0 0 ${w} 340`} role="img" aria-label={labels[v]}>
        {v < 3 ? (
          <>
            {pairs[v].map((salt, i) => {
              const x = cx + (i ? 1 : -1) * Math.min(83, w * 0.235),
                a = saltHydrolysis(salt, C),
                tip = 230 - 145 * clamp((p - 0.15) / 0.45),
                read = p >= 0.6;
              return (
                <g key={salt}>
                  {text(x, 25, saltNames[salt])}
                  {text(x, 49, `${C.toPrecision(2)} M`)}
                  {tube(x, 5)}
                  <rect
                    x={x - 30}
                    y="80"
                    width="60"
                    height="16"
                    rx="3"
                    fill={read ? colorPH(a.pH) : '#eee2bd'}
                    stroke="#cfccad"
                  />
                  <path
                    d={`M${x} ${tip - 55}V${tip}`}
                    stroke="#adbfaf"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  {p > 0.15 && !read && <circle cx={x} cy={tip + 2} r="3" fill="#bad1bb" />}
                  {text(x, 128, read ? `pH ≈ ${Math.round(a.pH)}` : '—')}
                </g>
              );
            })}
            {text(cx, 320, s('玻璃棒点样 · 干燥 pH 试纸', 'Rod sample · dry pH paper'))}
          </>
        ) : v < 7 ? (
          <>
            {([0, 1] as const).map((i) => {
              const x = cx + (i ? 1 : -1) * Math.min(83, w * 0.235),
                q = clamp(p / 0.85),
                T = i && v === 3 ? 25 + 45 * q : 25,
                V = i ? (v === 4 ? 5 + 5 * q : v === 6 ? 5 + q : 5) : 5,
                n = i && v === 5 ? 0.00005 * (1 + Math.floor(q * 4) / 4) : 0.00005,
                acid = i && v === 6 ? 0.0001 * q : 0,
                a = ferricHydrolysis(n, V, T, acid),
                brown = 1 - Math.exp(-(a.aquo * 0.8 + a.hydrolyzed * 25));
              return (
                <g key={i}>
                  {text(x, 24, i ? s('改变条件', 'Changed') : s('参照', 'Reference'))}
                  {v === 3 && (
                    <>
                      <rect
                        x={x - 36}
                        y="191"
                        width="72"
                        height="89"
                        rx="9"
                        fill={i ? '#ecdac1' : '#d5e2da'}
                        stroke="#b2c2af"
                      />
                      {text(x, 120, `${T.toFixed(0)} °C`)}
                    </>
                  )}
                  {tube(
                    x,
                    V,
                    `rgb(${Math.round(221 - 35 * brown)},${Math.round(223 - 74 * brown)},${Math.round(184 - 84 * brown)})`,
                  )}
                  {i && v === 4 && p < 0.85 && (
                    <>
                      {dropper(x, 122)}
                      <path d={`M${x} 123V${270 - V * 12}`} stroke="#b5cfbf" strokeWidth="2" />
                    </>
                  )}
                  {i && v === 5 && p < 0.85 && (
                    <>
                      <path d={`M${x + 10} 91L${x - 10} 119`} stroke="#b0bba4" strokeWidth="5" />
                      <path
                        d={`M${x - 3} ${125 + ((q * 4) % 1) * 81}l6 3 -3 6 -6 -3Z`}
                        fill="#b6b08e"
                      />
                    </>
                  )}
                  {i && v === 6 && p < 0.85 && (
                    <>
                      {dropper(x, 122)}
                      <path d={`M${x} 123V${270 - V * 12}`} stroke="#b4c8b1" strokeWidth="2" />
                    </>
                  )}
                  {text(x, 303, `${s('模型 pH', 'Model pH')} ${a.pH.toFixed(2)}`)}
                  {text(x, 329, `${(a.fraction * 100).toFixed(1)}% FeOH²⁺`)}
                </g>
              );
            })}
          </>
        ) : v === 7 ? (
          <>
            {(() => {
              const dissolved = clamp(p / 0.3),
                added = 2 * clamp((p - 0.4) / 0.4),
                V = 5 + added,
                a = ferricHydrolysis(0.00005 * dissolved, V, 25, added * 0.018),
                brown = clamp(a.fraction * 0.9),
                level = 270 - V * 12;
              return (
                <>
                  {text(cx, 26, s('浓酸阶段只作定性示意', 'Concentrated acid: qualitative'))}
                  {tube(
                    cx,
                    V,
                    `rgb(${Math.round(224 - 40 * brown)},${Math.round(223 - 75 * brown)},${Math.round(184 - 85 * brown)})`,
                  )}
                  {[0, 1, 2, 3].map((j) => (
                    <path
                      key={j}
                      d={`M${cx - 13 + j * 7} 262l5 3 -3 5 -5 -3Z`}
                      fill="#b29e72"
                      opacity={1 - dissolved}
                    />
                  ))}
                  {p > 0.4 && p < 0.8 && (
                    <>
                      {dropper(cx, 122)}
                      <path d={`M${cx} 124V${level}`} stroke="#b5cdb7" strokeWidth="2" />
                    </>
                  )}
                  {text(cx, 304, `H₂SO₄: ${added.toFixed(1)} mL`)}
                  {text(cx, 330, `${s('总体积', 'Total volume')}: ${V.toFixed(1)} mL`)}
                </>
              );
            })()}
          </>
        ) : v < 10 ? (
          <>
            {(['none', 'Fe', 'Al'] as const).map((kind, i) => {
              const x = cx + (i - 1) * Math.min(91, w * 0.3),
                added = v === 8 ? 2 * clamp((p - 0.12) / 0.7) : 2,
                V = 5 + (kind === 'none' ? (matched ? added : 0) : added),
                level = 270 - V * 14,
                time = v === 9 ? 300 * clamp(p / 0.9) : 0,
                fluid = kind === 'Fe' ? '#d7d6b2' : '#d9e2cc';
              return (
                <g key={kind}>
                  {text(
                    x,
                    31,
                    kind === 'none' ? s('空白', 'Blank') : kind === 'Fe' ? 'FeCl₃' : 'Al₂(SO₄)₃',
                  )}
                  <path
                    d={`M${x - 21} 108V265Q${x - 21} 275 ${x - 12} 275H${x + 12}Q${x + 21} 275 ${x + 21} 265V108`}
                    fill="#f3f6e7"
                    stroke="#a0b6a2"
                    strokeWidth="2"
                  />
                  <path
                    d={`M${x - 19} ${level}V264Q${x - 19} 273 ${x - 11} 273H${x + 11}Q${x + 19} 273 ${x + 19} 264V${level}Z`}
                    fill={fluid}
                  />
                  {kind !== 'none' && v === 8 && p > 0.12 && p < 0.82 && (
                    <>
                      {dropper(x, 83)}
                      <path d={`M${x} 84V${level}`} stroke="#c0d0af" strokeWidth="2" />
                    </>
                  )}
                  {Array.from({ length: 36 }, (_, j) => {
                    const a = mudParticle(j, time, kind, measuredPH, stir);
                    return (
                      <circle
                        key={j}
                        cx={x + 19 * a.x}
                        cy={level + ((269 - level) * a.depth) / 60}
                        r="1.8"
                        fill="#927f60"
                        opacity=".74"
                      />
                    );
                  })}
                  {text(x, 306, `${V.toFixed(1)} mL`)}
                </g>
              );
            })}
            {text(
              cx,
              334,
              v === 8
                ? s('每组起始泥水 5 mL', 'Start with 5 mL muddy water')
                : s(
                    `假设加料后 pH ${measuredPH} · ${(5 * clamp(p / 0.9)).toFixed(1)} min`,
                    `Assumed pH ${measuredPH} · ${(5 * clamp(p / 0.9)).toFixed(1)} min`,
                  ),
            )}
          </>
        ) : v === 10 ? (
          <>
            {(() => {
              const a = colloidPreparation(p),
                level = 263 - a.volumeMl * 2.2,
                shade = 1 - Math.exp(-a.colloid * 0.2);
              return (
                <>
                  {text(cx, 26, '40 mL H₂O · 100 °C')}
                  {dropper(cx, 86)}
                  {text(cx - 49, 74, 'FeCl₃')}
                  {text(cx + 49, 74, `${a.delivered}/6 ${s('滴', 'drops')}`)}
                  {a.dropping && (
                    <circle cx={cx} cy={90 + a.phase * (level - 93)} r="3" fill="#bda773" />
                  )}
                  <path
                    d={`M${cx - 64} 102V248Q${cx - 64} 266 ${cx - 49} 266H${cx + 49}Q${cx + 64} 266 ${cx + 64} 248V102`}
                    fill="#f0f5e5"
                    stroke="#a1b59c"
                    strokeWidth="2"
                  />
                  <path
                    d={`M${cx - 62} ${level}V248Q${cx - 62} 264 ${cx - 48} 264H${cx + 48}Q${cx + 62} 264 ${cx + 62} 248V${level}Z`}
                    fill={`rgb(${Math.round(224 - 37 * shade)},${Math.round(223 - 79 * shade)},${Math.round(182 - 91 * shade)})`}
                  />
                  {Array.from({ length: a.delivered * 4 }, (_, j) => (
                    <circle
                      key={j}
                      cx={cx - 47 + ((j * 31) % 94) + 2 * Math.sin(p * 13 + j)}
                      cy={level + 12 + ((j * 17) % 55) + 2 * Math.cos(p * 17 + j)}
                      r="1.6"
                      fill="#a58252"
                      opacity={(a.colloid / Math.max(1, a.ironTotal)) * 0.7}
                    />
                  ))}
                  {a.heating &&
                    [0, 1, 2, 3, 4, 5].map((j) => {
                      const q = (p * 9 + j / 6) % 1;
                      return (
                        <circle
                          key={j}
                          cx={cx - 43 + j * 17}
                          cy={255 - q * (255 - level - 4)}
                          r={2 + q * 2}
                          fill="#eff2de"
                          stroke="#c0c4a4"
                          opacity={1 - q * 0.7}
                        />
                      );
                    })}
                  <path
                    d={`M${cx - 68} 268H${cx + 68}M${cx - 45} 268L${cx - 53} 315M${cx + 45} 268L${cx + 53} 315`}
                    stroke="#9ead93"
                    strokeWidth="3"
                  />
                  {a.heating && (
                    <path
                      d={`M${cx - 10} 313Q${cx - 16} 294 ${cx} 278Q${cx + 16} 295 ${cx + 10} 313Z`}
                      fill="#d9bd85"
                    />
                  )}
                  {text(
                    cx,
                    337,
                    a.heating
                      ? s('继续煮沸 · 过程示意', 'Continue boiling · illustration')
                      : s('红褐色后停止加热', 'Stop heating after red-brown forms'),
                  )}
                </>
              );
            })()}
          </>
        ) : v === 11 ? (
          <>
            {[false, true].map((heated, i) => {
              const x = cx + (i ? 1 : -1) * Math.min(84, w * 0.235),
                a = oilCleaning(heated, 3 * clamp(p / 0.9));
              return (
                <g key={String(heated)}>
                  {text(x, 25, heated ? s('加热煮沸', 'Heated') : s('不加热', 'Unheated'))}
                  {text(x, 54, 'Na₂CO₃ · 5 mL')}
                  {tube(x, 5)}
                  <ellipse
                    cx={x}
                    cy="210"
                    rx={19 * Math.sqrt(a.unreacted / 0.15)}
                    ry="3"
                    fill="#c3b16e"
                    opacity=".75"
                  />
                  {Array.from({ length: 12 }, (_, j) => (
                    <rect
                      key={j}
                      x={x + (j % 2 ? 18 : -21)}
                      y={207 + Math.floor(j / 2) * 9}
                      width="3"
                      height="7"
                      rx="1"
                      fill="#baa15f"
                      opacity={a.wallBefore / 0.06}
                    />
                  ))}
                  {heated && (
                    <path
                      d={`M${x - 10} 314Q${x - 15} 297 ${x} 285Q${x + 15} 298 ${x + 10} 314Z`}
                      fill="#d9bc83"
                    />
                  )}
                  {text(
                    x,
                    335,
                    `${s('模型油膜', 'Model film')}: ${((a.wallBefore / 0.06) * 100).toFixed(0)}%`,
                  )}
                </g>
              );
            })}
          </>
        ) : (
          <>
            {(() => {
              const heated = f.watch ? p >= 0.5 : hot,
                q = f.watch ? clamp((p - (heated ? 0.5 : 0)) / 0.48) : p,
                a = rinseOilTube(q, heated, cx - 35),
                points = (p: { x: number; y: number }[]) => p.map((x) => `${x.x},${x.y}`).join(' '),
                shape = [
                  a.geometry.points[0],
                  ...a.geometry.points.slice(2).reverse(),
                  a.geometry.points[1],
                ],
                wy = 278 - a.waste * 5;
              return (
                <>
                  {text(
                    cx,
                    25,
                    heated
                      ? s('加热组 · 冲洗过程', 'Heated sample · rinse')
                      : s('未加热组 · 冲洗过程', 'Unheated sample · rinse'),
                  )}
                  <path
                    d={`M${cx + 18} 211V280H${cx + 103}V211`}
                    strokeLinejoin="round"
                    fill="#f1f5e5"
                    stroke="#a2b8a2"
                  />
                  {a.waste > 0 && (
                    <path d={`M${cx + 20} ${wy}V278H${cx + 101}V${wy}Z`} fill="#d7d8b7" />
                  )}
                  <polygon points={points(a.geometry.points)} fill="#f1f5e6" fillOpacity=".7" />
                  <polygon points={points(a.geometry.liquid)} fill="#ceddc7" />
                  <path
                    d={shape.map((pt, j) => `${j ? 'L' : 'M'}${pt.x} ${pt.y}`).join(' ')}
                    fill="none"
                    stroke="#9eb39f"
                    strokeWidth="2"
                  />
                  <g transform={`translate(${cx - 35} 160) rotate(${a.angle})`}>
                    {Array.from({ length: 12 }, (_, j) => (
                      <rect
                        key={j}
                        x={j % 2 ? 16 : -19}
                        y={-28 + Math.floor(j / 2) * 12}
                        width="3"
                        height="8"
                        rx="1"
                        fill="#b69d5c"
                        opacity={a.film / 0.06}
                      />
                    ))}
                  </g>
                  {a.stream && (
                    <path
                      d={`M${a.geometry.lip.x} ${a.geometry.lip.y}V${wy}`}
                      stroke="#c3d0af"
                      strokeWidth="3"
                    />
                  )}
                  {a.adding && (
                    <>
                      {dropper(cx - 35, 83)}
                      <path
                        d={`M${cx - 35} 84V${a.geometry.level}`}
                        stroke="#b9d1be"
                        strokeWidth="2"
                      />
                    </>
                  )}
                  {text(
                    cx,
                    306,
                    `${s('余留油膜', 'Remaining film')}: ${((a.film / 0.06) * 100).toFixed(1)}%`,
                  )}
                  {text(cx, 334, s('去油比例是教学示意', 'Removal fraction is illustrative'))}
                </>
              );
            })()}
          </>
        )}
      </svg>
      {!f.watch && (
        <div className="chem-hydrolysis-controls">
          <label>
            {s('观察位置', 'View')}
            <select value={view} onChange={(e) => setView(+e.target.value)}>
              {labels.map((t, i) => (
                <option key={t} value={i}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            {s('过程进度', 'Progress')}
            <input
              type="range"
              min="0"
              max="1"
              step=".005"
              value={progress}
              onChange={(e) => setProgress(+e.target.value)}
            />
          </label>
          {v < 3 && (
            <label>
              {s('盐的分析浓度', 'Salt analytical concentration')}: {concentration.toFixed(3)} M
              <input
                type="range"
                min=".001"
                max=".2"
                step=".001"
                value={concentration}
                onChange={(e) => setC(+e.target.value)}
              />
            </label>
          )}
          {(v === 8 || v === 9) && (
            <>
              <label>
                {s('加料后测得或假设的 pH', 'Measured or assumed pH after dosing')}:{' '}
                {postPH.toFixed(1)}
                <input
                  type="range"
                  min="2"
                  max="10"
                  step=".1"
                  value={postPH}
                  onChange={(e) => setPH(+e.target.value)}
                />
              </label>
              <button aria-pressed={mix} onClick={() => setMix(!mix)}>
                {mix ? s('已充分混合', 'Mixed') : s('混合不足', 'Insufficient mixing')}
              </button>
              <button aria-pressed={waterControl} onClick={() => setWater(!waterControl)}>
                {waterControl
                  ? s('空白另加 2 mL 水', 'Blank receives 2 mL water')
                  : s('教材空白不加料', 'Textbook blank: no addition')}
              </button>
            </>
          )}
          {v === 12 && (
            <button aria-pressed={hot} onClick={() => setHot(!hot)}>
              {hot
                ? s('查看加热组', 'Show heated sample')
                : s('查看未加热组', 'Show unheated sample')}
            </button>
          )}
          <label>
            {s(
              '自己的条件、观察与解释（初始为空）',
              'Your conditions, observations and explanation (initially blank)',
            )}
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <details>
            <summary>{s('模型与证据边界', 'Model and evidence boundaries')}</summary>
            <p>
              {s(
                '六盐示范另定为 25 ℃、0.1 M，pH 纸只显示约整数。硫酸铁视图仅求第一步水解与硫酸氢根平衡，忽略硫酸根络合、多核物种和固相；所示 pH 和比例不是实际仪器读数。温度系数用于教学，不是硫酸铁溶液的实测拟合。',
                'The six-salt demonstration adds 25 °C and 0.1 M conditions; paper shows only approximate integer pH. Ferric views retain only first hydrolysis and bisulfate, omitting sulfate complexes, polymeric species and solids. pH and fractions are model outputs. The thermal coefficient is illustrative, not a fit to ferric-sulfate measurements.',
              )}
            </p>
            <p>
              {s(
                '泥水未给出酸碱缓冲能力，不能从教材加料量保证除浊。沉降视图明确假设加料后 pH 为 6.5，探索可改为酸性条件；凝聚速率、颗粒大小和去油比例均为示意。变清不能证明水可饮用。浓硫酸阶段不输出精密 pH。',
                'The muddy water buffering capacity is unspecified, so textbook doses do not guarantee clarification. The settling view explicitly assumes pH 6.5 after dosing; exploration can test acidic conditions. Aggregation rates, particle sizes and oil-removal fractions are illustrative. Clarity does not establish drinking-water safety. The concentrated-acid view gives no precise pH.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
