import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  rateClamp as clamp,
  peroxide,
  marble,
  turbidity,
  zincGas,
  observedRate,
  collision,
  collisionTrial,
  energyProfile,
  syringeGeometry,
} from '../../models/chem-reaction-rates';
import '../../styles/chem-reaction-rates.css';
export default function ChemReactionRates() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const variants = [
    'chem-required-2-inquiry-p43',
    'chem-required-2-activity-7',
    'chem-elective-1-inquiry-p26',
    'chem-elective-1-model-p28',
  ];
  const [mode0, setMode] = useState(Math.max(0, variants.indexOf(f.variant ?? ''))),
    [view, setView] = useState(0),
    [progress, setProgress] = useState(0.6),
    [temp, setTemp] = useState(50),
    [surface, setSurface] = useState(1),
    [acid, setAcid] = useState(1),
    [leak, setLeak] = useState(0),
    [energy, setEnergy] = useState(true),
    [orientation, setOrientation] = useState(true),
    [time1, setTime1] = useState(''),
    [time4, setTime4] = useState(''),
    [notes, setNotes] = useState('');
  const mode = f.watch ? (f.chapter < 2 ? 0 : f.chapter < 5 ? 1 : f.chapter < 8 ? 2 : 3) : mode0,
    starts = [0, 2, 5, 8],
    local = f.watch ? f.chapter - starts[mode] : view,
    p = clamp(f.watch ? f.chapterProgress : progress),
    cx = w / 2;
  const titles = [
    s('控制一个因素', 'Change one factor'),
    s('比较三个因素', 'Three controlled comparisons'),
    s('用气体体积计时', 'Time a gas volume'),
    s('碰撞与反应路径', 'Collisions and pathways'),
  ];
  const views = [
    [
      s('温度与分解', 'Temperature and decomposition'),
      s('浓度与接触面积', 'Concentration and surface area'),
    ],
    [
      s('浓度：总体积相同', 'Concentration: equal total volume'),
      s('温度：配方相同', 'Temperature: same recipe'),
      s('催化剂与空白', 'Catalysts and blank'),
    ],
    [
      s('定性方案中的对照', 'Controls in a qualitative design'),
      s('到达同一气体终点', 'Reach the same gas endpoint'),
      s('时间、漏气与记录', 'Time, leaks and records'),
    ],
    [
      s('碰撞的能量条件', 'Collision energy'),
      s('碰撞的取向条件', 'Collision orientation'),
      s('催化改变反应路径', 'Catalysis changes the pathway'),
    ],
  ];
  const aTemp = f.watch ? 50 : temp,
    seconds = p * 40,
    thio = (mode === 1 && local < 2) || (mode === 2 && local === 0),
    catalysts = mode === 1 && local === 2,
    marbleView = mode === 0 && local === 1,
    tubeView = mode < 2 || (mode === 2 && local === 0);
  const stagedCollision = collisionTrial(p),
    trial = f.watch ? stagedCollision.trial : 1,
    cp = f.watch ? stagedCollision.progress : p,
    enough = f.watch ? (local === 0 ? trial === 1 : true) : energy,
    oriented = f.watch ? (local === 1 ? trial === 1 : true) : orientation,
    coll = collision(w, cp, enough, oriented);
  const acidNow = f.watch ? (p < 0.5 ? 1 : 4) : acid,
    gasP = f.watch ? clamp(p < 0.5 ? p * 2 : (p - 0.5) * 2) : p,
    gas = zincGas(0, acidNow, f.watch ? 0 : leak),
    gasTime = (gas.endpoint ?? 40) * gasP,
    gasState = zincGas(gasTime, acidNow, f.watch ? 0 : leak),
    g = syringeGeometry(w, gasState.volumeMl);
  const count = catalysts ? 3 : 2;
  const tubes = Array.from({ length: count }, (_, i) => {
    const x = catalysts ? ((i + 0.5) * w) / 3 : cx + (i ? 1 : -1) * Math.min(80, w * 0.23),
      temperature = (thio && local === 0) || catalysts || marbleView ? 25 : i ? aTemp : 20;
    const stock = thio && local === 0 && i === 1 ? 1 : 2,
      catalyst = catalysts ? (['none', 'Mn', 'Fe'] as const)[i] : 'Fe';
    const h = peroxide(seconds, temperature, catalyst, catalysts ? 10 : 5),
      m = marble(seconds, i ? 1 : 0.1, f.watch ? 1 : surface),
      t = turbidity(seconds, stock, temperature);
    const rate = marbleView ? m.rate : h.rate,
      n = Math.min(14, Math.ceil(rate * 200000));
    return { x, temperature, stock, catalyst, h, m, t, n };
  });
  const tt = (
    x: number,
    y: number,
    value: string,
    anchor: 'middle' | 'start' | 'end' = 'middle',
  ) => (
    <text x={x} y={y} textAnchor={anchor}>
      {value}
    </text>
  );
  return (
    <div className="chem-rates" ref={host}>
      <div className="chem-rates-head">{views[mode][local]}</div>
      <svg viewBox={`0 0 ${w} 332`} role="img" aria-label={views[mode][local]}>
        {tubeView ? (
          <>
            {tubes.map((a, i) => (
              <g key={i}>
                {tt(
                  a.x,
                  29,
                  thio
                    ? local === 0
                      ? `${a.stock} mL`
                      : `${a.temperature} °C`
                    : catalysts
                      ? ['—', 'MnO₂', 'FeCl₃'][i]
                      : marbleView
                        ? `${i ? 1 : 0.1} M`
                        : `${a.temperature} °C`,
                )}
                {tt(
                  a.x,
                  52,
                  thio
                    ? local === 0
                      ? s('原液', 'stock')
                      : s('相同配方', 'same recipe')
                    : catalysts
                      ? '10%'
                      : marbleView
                        ? 'HCl'
                        : '5% H₂O₂',
                )}
                {!marbleView && !catalysts && !(thio && local === 0) && (
                  <>
                    <path
                      d={`M${a.x - 38} 160V270Q${a.x - 38} 282 ${a.x - 28} 282H${a.x + 28}Q${a.x + 38} 282 ${a.x + 38} 270V160`}
                      fill={a.temperature > 30 ? '#f3d7bf' : '#c9dfe7'}
                      fillOpacity=".6"
                      stroke="#b3c6c4"
                    />
                    <path d={`M${a.x - 37} 177H${a.x + 37}`} stroke="#a9c8cd" />
                  </>
                )}
                <path
                  d={`M${a.x - 20} 83V246Q${a.x - 20} 265 ${a.x} 265Q${a.x + 20} 265 ${a.x + 20} 246V83`}
                  fill="#f4f8f0"
                  fillOpacity=".55"
                  stroke="#a2b8b1"
                  strokeWidth="2"
                />
                {thio && (
                  <path
                    d={`M${a.x - 10} 211l20 20m0 -20l-20 20`}
                    stroke="#52645d"
                    strokeWidth="4"
                    opacity={a.t.transmission}
                  />
                )}
                <path
                  d={`M${a.x - 18} 155V246Q${a.x - 18} 263 ${a.x} 263Q${a.x + 18} 263 ${a.x + 18} 246V155Z`}
                  fill={
                    thio ? '#f5edc8' : a.catalyst === 'Fe' && !marbleView ? '#e1d6a0' : '#c6dfd9'
                  }
                  fillOpacity={thio ? 1 - a.t.transmission : 0.6}
                />
                <path
                  d={`M${a.x - 18} 155Q${a.x} 162 ${a.x + 18} 155`}
                  fill="none"
                  stroke="#9dbbb0"
                />
                {marbleView ? (
                  <>
                    {Array.from({ length: f.watch || surface === 1 ? 1 : 8 }, (_, j) => {
                      const fragmented = !f.watch && surface > 1,
                        rad = (fragmented ? 4 : 8) * Math.cbrt(a.m.solidLeft / 0.001),
                        x = a.x + (fragmented ? ((j % 4) - 1.5) * 8 : 0),
                        y = fragmented ? 251 - Math.floor(j / 4) * 8 : 253;
                      return (
                        <circle key={j} cx={x} cy={y} r={rad} fill="#ddd9c7" stroke="#bcb8aa" />
                      );
                    })}
                  </>
                ) : a.catalyst === 'Mn' ? (
                  Array.from({ length: 7 }, (_, j) => (
                    <circle
                      key={j}
                      cx={a.x - 12 + j * 4}
                      cy={255 + (j % 2) * 2}
                      r="2.8"
                      fill="#65675e"
                    />
                  ))
                ) : null}
                {!thio &&
                  Array.from({ length: a.n }, (_, j) => {
                    const phase = (seconds * (0.04 + a.n * 0.003) + j / a.n) % 1,
                      x = a.x + ((j * 7) % 23) - 11,
                      y = 247 - phase * 87;
                    return (
                      <circle
                        key={j}
                        cx={x}
                        cy={y}
                        r={2 + phase}
                        fill="#f6fbf1"
                        stroke="#9eb7af"
                        opacity={1 - clamp((phase - 0.8) / 0.2)}
                      />
                    );
                  })}
                {thio
                  ? tt(a.x, 301, `${Math.round((1 - a.t.transmission) * 100)}%`)
                  : catalysts
                    ? tt(a.x, 301, i ? s('加催化剂', 'catalyst') : s('空白', 'blank'))
                    : tt(
                        a.x,
                        301,
                        marbleView
                          ? `${a.m.volume.toFixed(1)} mL`
                          : `${a.h.oxygenMl.toFixed(1)} mL`,
                      )}
              </g>
            ))}
            {tt(
              cx,
              329,
              thio
                ? s('遮光比例 · 教学模型', 'Light blocked · teaching model')
                : s(
                    `t = ${seconds.toFixed(0)} s · 示意气泡`,
                    `t = ${seconds.toFixed(0)} s · schematic bubbles`,
                  ),
            )}
          </>
        ) : mode === 2 && local === 1 ? (
          <>
            {tt(cx, 23, `${acidNow} M H₂SO₄ · 40 mL`)}
            <rect
              x={g.x0 - 1}
              y="62"
              width={g.span + 2}
              height="24"
              rx="3"
              fill="#eff5e9"
              stroke="#a2b6aa"
              strokeWidth="2"
            />
            <rect x={g.x0} y="64" width={Math.max(0, g.piston - g.x0)} height="20" fill="#d0dfba" />
            <rect x={g.piston - 2} y="63" width="4" height="22" rx="1" fill="#879f94" />
            <path
              d={`M${g.piston + 2} 74H${g.piston + 47}m0 -10v20`}
              stroke="#a1b6aa"
              strokeWidth="3"
            />
            {[0, 10, 20].map((v) => (
              <g key={v}>
                <path d={`M${g.x0 + (g.span * v) / 20} 61V54`} stroke="#91a69b" />
                {tt(g.x0 + (g.span * v) / 20, 48, String(v))}
              </g>
            ))}
            {tt(cx, 109, s('气体注射器 / mL', 'Gas syringe / mL'))}
            <path
              d={`M${cx - 10} 180V126H${g.x0 - 17}V74H${g.x0}`}
              fill="none"
              stroke="#a4bab4"
              strokeWidth="7"
            />
            <path
              d={`M${cx - 10} 180V126H${g.x0 - 17}V74H${g.x0}`}
              fill="none"
              stroke="#e5eece"
              strokeWidth="3"
            />
            <path
              d={`M${cx - 17} 164V193L${cx - 62} 269Q${cx - 66} 279 ${cx - 54} 279H${cx + 54}Q${cx + 66} 279 ${cx + 62} 269L${cx + 17} 193V164Z`}
              fill="#eff6ed"
              fillOpacity=".6"
              stroke="#9eb6ad"
              strokeWidth="2"
            />
            <path
              d={`M${cx - 35} 225L${cx - 60} 270Q${cx - 61} 277 ${cx - 53} 277H${cx + 53}Q${cx + 61} 277 ${cx + 60} 270L${cx + 35} 225Z`}
              fill="#c4dcd2"
              fillOpacity=".8"
            />
            <rect x={cx - 18} y="162" width="36" height="10" rx="3" fill="#bda88d" />
            <path
              d={`M${cx - 6} 117H${cx + 22}L${cx + 8} 141V184`}
              fill="#f1f5ed"
              fillOpacity=".8"
              stroke="#a3b7ae"
              strokeWidth="2"
            />
            <path d={`M${cx + 1} 153h14`} stroke="#8b9d8f" strokeWidth="3" />
            {Array.from({ length: 6 }, (_, j) => (
              <ellipse
                key={j}
                cx={cx - 25 + j * 10}
                cy={271 - (j % 2) * 3}
                rx={4 * Math.cbrt(1 - gasState.produced / (2 / 65.38))}
                ry={3 * Math.cbrt(1 - gasState.produced / (2 / 65.38))}
                fill="#99a8a1"
              />
            ))}
            {Array.from({ length: 5 }, (_, j) => {
              const q = (gasTime * 0.2 + j / 5) % 1;
              return (
                <circle
                  key={j}
                  cx={cx - 14 + j * 6}
                  cy={263 - q * 34}
                  r="2.5"
                  fill="#f9fcf3"
                  stroke="#9db7ae"
                  opacity={gasState.produced > 0 ? 1 : 0}
                />
              );
            })}
            {tt(cx, 205, 'Zn · 2 g')}
            {tt(cx, 307, `${gasState.volumeMl.toFixed(1)} mL · ${gasTime.toFixed(1)} s`)}
          </>
        ) : mode === 2 ? (
          <>
            {tt(cx, 28, s('同一终点：10 mL', 'Same endpoint: 10 mL'))}
            <path d={`M38 55V263H${w - 22}`} fill="none" stroke="#a3b4ab" />
            {[10, 20, 30, 40].map((v) => (
              <g key={v}>
                <path
                  d={`M38 ${263 - v * 5}H${w - 22}`}
                  stroke="#dce5d9"
                  strokeDasharray={v === 10 ? '5 5' : undefined}
                />
                {tt(32, 268 - v * 5, String(v), 'end')}
              </g>
            ))}
            {[1, 4].map((c, i) => {
              const maxTime = p * 30;
              const pts = Array.from({ length: 61 }, (_, j) => {
                const t = (maxTime * j) / 60;
                return `${38 + (t / 30) * (w - 60)},${263 - Math.min(40, zincGas(t, c, f.watch ? 0 : leak).volumeMl) * 5}`;
              }).join(' ');
              return (
                <g key={c}>
                  <polyline
                    points={pts}
                    fill="none"
                    stroke={i ? '#b99166' : '#759e8c'}
                    strokeWidth="3"
                  />
                  <text
                    x={52 + (i * (w - 100)) / 2}
                    y="291"
                    textAnchor="middle"
                    style={{ fill: i ? '#9d754a' : '#5d8b78' }}
                  >
                    {c} M
                  </text>
                </g>
              );
            })}
            {tt(cx, 321, s('时间 / s · 模型曲线', 'Time / s · model curves'))}
            {tt(w - 24, 282, '30', 'end')}
            {tt(39, 47, 'mL', 'start')}
          </>
        ) : local < 2 ? (
          <>
            {tt(cx, 29, enough ? 'E ≥ Eₐ' : 'E < Eₐ')}
            {tt(
              cx,
              54,
              oriented
                ? s('氢端相向', 'H ends face each other')
                : s('取向未满足', 'Unfavorable orientation'),
            )}
            {(
              [
                [0, 1, coll.hi],
                [2, 3, coll.hi],
                [0, 2, coll.hh],
                [1, 3, coll.ii],
              ] as [number, number, boolean][]
            ).map(
              ([a, b, visible], i) =>
                visible && (
                  <line
                    key={i}
                    x1={coll.atoms[a].x}
                    y1={coll.atoms[a].y}
                    x2={coll.atoms[b].x}
                    y2={coll.atoms[b].y}
                    stroke="#98a59c"
                    strokeWidth="4"
                  />
                ),
            )}
            {coll.atoms.map((a) => (
              <g key={a.id}>
                <circle
                  cx={a.x}
                  cy={a.y}
                  r={a.r}
                  fill={a.element === 'H' ? '#e1dfbf' : '#b49cbd'}
                  stroke={a.element === 'H' ? '#b9b899' : '#99829f'}
                />
                {a.element === 'I' && (
                  <text x={a.x} y={a.y + 6} textAnchor="middle">
                    I
                  </text>
                )}
              </g>
            ))}
            {tt(cx, 254, coll.hi ? '2 HI' : coll.ii ? 'H₂ + I₂' : 'H₂ + 2 I·')}
            {tt(cx, 292, s('小球 H · 大球 I', 'Small: H · large: I'))}
          </>
        ) : (
          <>
            {tt(cx, 25, s('同一反应的两条路径', 'Two paths, same reaction'))}
            <text x={cx - 56} y={52} textAnchor="middle" style={{ fill: '#b99166' }}>
              {s('无催化', 'Uncatalyzed')}
            </text>
            <text x={cx + 56} y={52} textAnchor="middle" style={{ fill: '#759f8a' }}>
              {s('有催化', 'Catalyzed')}
            </text>
            <path d={`M35 55V260H${w - 20}`} stroke="#a0b2a8" fill="none" />
            {[false, true].map((c, i) => {
              const pts = Array.from({ length: 101 }, (_, j) => {
                const q = j / 100;
                return `${40 + q * (w - 65)},${205 - energyProfile(q, c) * 2}`;
              }).join(' ');
              const q = p;
              return (
                <g key={i}>
                  <polyline
                    points={pts}
                    stroke={c ? '#759f8a' : '#bc936d'}
                    strokeWidth="3"
                    fill="none"
                  />
                  <circle
                    cx={40 + q * (w - 65)}
                    cy={205 - energyProfile(q, c) * 2}
                    r="5"
                    fill={c ? '#759f8a' : '#bc936d'}
                  />
                </g>
              );
            })}
            {tt(43, 192, 'R', 'start')}
            {tt(w - 23, 266, 'P', 'end')}
            {tt(cx, 286, s('ΔH 相同 · 能垒降低', 'Same ΔH · lower barrier'))}
            {tt(cx, 317, s('通用能量图 · 非实测', 'Generic profile · not measured'))}
          </>
        )}
      </svg>
      {!f.watch && (
        <div className="chem-rates-controls">
          <div className="chem-rates-buttons">
            {titles.map((t, i) => (
              <button
                key={t}
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
          <label>
            {s('观察位置', 'View')}
            <select value={view} onChange={(e) => setView(+e.target.value)}>
              {views[mode].map((t, i) => (
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
          {(mode === 0 && local === 0) || (mode === 1 && local === 1) ? (
            <label>
              {s('第二组温度', 'Second group temperature')} · {temp} °C
              <input
                type="range"
                min="20"
                max="60"
                step="5"
                value={temp}
                onChange={(e) => setTemp(+e.target.value)}
              />
            </label>
          ) : null}
          {marbleView && (
            <label>
              {s(
                '两组接触面积倍率（固体总量相同）',
                'Surface factor in both groups (same total solid)',
              )}
              <select value={surface} onChange={(e) => setSurface(+e.target.value)}>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </label>
          )}
          {mode === 2 && local > 0 && (
            <>
              <label>
                {s('硫酸浓度', 'Sulfuric acid concentration')}
                <select value={acid} onChange={(e) => setAcid(+e.target.value)}>
                  <option value="1">1 M</option>
                  <option value="4">4 M</option>
                </select>
              </label>
              <label>
                {s('未收集比例：漏气', 'Uncollected fraction: leak')} · {Math.round(leak * 100)}%
                <input
                  type="range"
                  min="0"
                  max="1"
                  step=".1"
                  value={leak}
                  onChange={(e) => setLeak(+e.target.value)}
                />
              </label>
              <p>
                {s('模型到 10 mL 的时间', 'Model time to 10 mL')}：
                {gas.endpoint === null
                  ? s('无法达到', 'not reached')
                  : `${gas.endpoint.toFixed(1)} s`}
              </p>
              <label>
                {s('实测：1 M 收集 10 mL 的秒数', 'Measured seconds to 10 mL, 1 M')}
                <input
                  inputMode="decimal"
                  value={time1}
                  onChange={(e) => setTime1(e.target.value)}
                />
              </label>
              <label>
                {s('实测：4 M 收集 10 mL 的秒数', 'Measured seconds to 10 mL, 4 M')}
                <input
                  inputMode="decimal"
                  value={time4}
                  onChange={(e) => setTime4(e.target.value)}
                />
              </label>
              <p>
                {s('实测平均收集速率', 'Measured average collection rate')}：
                {observedRate(time1)?.toFixed(3) ?? '—'} / {observedRate(time4)?.toFixed(3) ?? '—'}{' '}
                mL/s
              </p>
            </>
          )}
          {mode === 3 && local < 2 && (
            <div className="chem-rates-buttons">
              <button aria-pressed={energy} onClick={() => setEnergy(!energy)}>
                {s('达到能量条件', 'Enough energy')}: {energy ? s('是', 'yes') : s('否', 'no')}
              </button>
              <button aria-pressed={orientation} onClick={() => setOrientation(!orientation)}>
                {s('有利取向', 'Favorable orientation')}:{' '}
                {orientation ? s('是', 'yes') : s('否', 'no')}
              </button>
            </div>
          )}
          <label>
            {s(
              '自己的条件、观察和证据（初始为空）',
              'Your conditions, observations and evidence (initially blank)',
            )}
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <details>
            <summary>{s('模型条件与读数口径', 'Model conditions and readouts')}</summary>
            <p>
              {s(
                '所有时间和曲线是教学参数，不是教材实测结果。气体按 25 ℃、101.325 kPa 的干气近似计算；锌实验从加液结束的共同基线计时，忽略混合、加液排气和活塞摩擦。气泡仅提示产气强弱，数量不代表分子数。',
                'All times and curves use teaching parameters, not textbook measurements. Gas uses a dry-gas approximation at 25 °C and 101.325 kPa. Zinc runs start at a common post-addition baseline, neglecting mixing, displaced air and piston friction. Bubbles indicate gas evolution, not molecule counts.',
              )}
            </p>
            <p>
              {s(
                '硫代硫酸钠原液为 0.1 M，总液量 4 mL：2 或 1 mL 原液用水补足至 2 mL，再加 2 mL 0.1 M 硫酸。遮光比例由生成硫和固定光程计算，十字仅是添加的观察靶。催化剂两组使用相同示意速率常数，不能据此比较催化效率。',
                'The 0.1 M thiosulfate stock is diluted to 2 mL, then mixed with 2 mL of 0.1 M sulfuric acid: 4 mL total. The cross is an added viewing target; attenuation depends on sulfur and a fixed path length. Both catalyst runs use the same illustrative rate constant, so their efficiencies cannot be ranked.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
