import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  acidClamp as clamp,
  acidSpeciation,
  acidMeter,
  qualitativeMagnesium,
  magnesiumPressure,
  carbonateAddition,
  acidInjection,
  type AcidKind,
} from '../../models/chem-acid-evidence';
import '../../styles/chem-acid-evidence.css';
export default function ChemAcidEvidence() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const variants = [
    'chem-elective-1-experiment-3-1',
    'chem-elective-1-experiment-3-2',
    'chem-elective-1-body-p61',
  ];
  const [mode0, setMode] = useState(Math.max(0, variants.indexOf(f.variant ?? ''))),
    [view, setView] = useState(0),
    [progress, setProgress] = useState(0.6),
    [logHcl, setHcl] = useState(-1),
    [logHac, setHac] = useState(-1),
    [contact, setContact] = useState(true),
    [drops, setDrops] = useState(10),
    [headspace, setHead] = useState(100),
    [leak, setLeak] = useState(0),
    [notes, setNotes] = useState('');
  const mode = f.watch ? (f.chapter < 4 ? 0 : f.chapter < 5 ? 1 : 2) : mode0,
    starts = [0, 4, 5],
    local = f.watch ? f.chapter - starts[mode] : view,
    p = clamp(f.watch ? f.chapterProgress : progress),
    cx = w / 2;
  const names = [
    s('相同浓度的三种证据', 'Three same-concentration tests'),
    s('醋酸与碳酸钠', 'Acetic acid and carbonate'),
    s('压强曲线与总产量', 'Pressure curves and total yield'),
  ];
  const views = [
    [
      s('先比较 pH', 'Compare pH first'),
      s('再比较导电响应', 'Compare electrical response'),
      s('同量镁条的产气', 'Gas from equal magnesium'),
      s('电离比例与离子浓度', 'Fraction versus concentration'),
    ],
    [s('滴入碳酸钠溶液', 'Add carbonate solution')],
    [
      s('封闭装置中的注入', 'Injection into sealed apparatus'),
      s('比较压强增量曲线', 'Compare pressure increments'),
      s('同终点，不同起始离子量', 'Same endpoint, different initial ions'),
    ],
  ];
  const hcl = f.watch ? 0.1 : 10 ** logHcl,
    hac = f.watch ? (mode === 0 && local === 3 ? 10 ** (-1 - 2 * p) : 0.1) : 10 ** logHac,
    vol = f.watch ? 100 : headspace,
    loss = f.watch ? 0 : leak;
  const text = (x: number, y: number, v: string, anchor: 'middle' | 'start' | 'end' = 'middle') => (
    <text x={x} y={y} textAnchor={anchor}>
      {v}
    </text>
  );
  const c = carbonateAddition(p, f.watch ? 10 : drops),
    cl = 267 - (c.volume / 0.0035) * 95,
    maxP = Math.ceil(magnesiumPressure('HCl', 2000, vol).deltaP / 20) * 20,
    pressureScale = 180 / maxP;
  return (
    <div className="chem-acid" ref={host}>
      <div className="chem-acid-head">{views[mode][local]}</div>
      <svg viewBox={`0 0 ${w} 335`} role="img" aria-label={views[mode][local]}>
        {mode === 0 && local < 3 ? (
          <>
            {(['HCl', 'HAc'] as AcidKind[]).map((kind, i) => {
              const x = cx + (i ? 1 : -1) * Math.min(85, w * 0.235),
                C = i ? hac : hcl,
                tip = f.watch
                  ? local === 0
                    ? 160 + 60 * clamp(p / 0.35)
                    : 220
                  : contact
                    ? 220
                    : 160,
                wet = tip > 175,
                a = acidMeter(kind, C, wet),
                mg = qualitativeMagnesium(kind, p * 40, C),
                bubbleN = Math.min(10, Math.ceil(mg.rate * 1e6));
              return (
                <g key={kind}>
                  {text(x, 25, kind)}
                  {text(x, 49, `${C.toPrecision(2)} M`)}
                  <path
                    d={`M${x - 38} 153V248Q${x - 38} 265 ${x - 27} 265H${x + 27}Q${x + 38} 265 ${x + 38} 248V153`}
                    fill="#f0f6ea"
                    stroke="#9fb7ab"
                    strokeWidth="2"
                  />
                  <path
                    d={`M${x - 36} 175V248Q${x - 36} 263 ${x - 26} 263H${x + 26}Q${x + 36} 263 ${x + 36} 248V175Z`}
                    fill="#c6dcd0"
                    fillOpacity=".65"
                  />
                  <path d={`M${x - 36} 175Q${x} 180 ${x + 36} 175`} stroke="#9ebcb0" fill="none" />
                  {local === 0 ? (
                    <>
                      <rect
                        x={x - 30}
                        y="69"
                        width="60"
                        height="42"
                        rx="10"
                        fill="#e5ecdb"
                        stroke="#a3b6a2"
                      />
                      {text(x, 96, a.reading === null ? '—' : a.pH.toFixed(2))}
                      <path
                        d={`M${x + 22} 111V123H${x}V${tip - 47}`}
                        fill="none"
                        stroke="#91a69b"
                        strokeWidth="3"
                      />
                      <rect x={x - 5} y={tip - 48} width="10" height="43" rx="4" fill="#b7c7b8" />
                      <circle cx={x} cy={tip - 5} r="5" fill="#e1e8cf" stroke="#9caf99" />
                      {text(x, 293, 'pH')}
                    </>
                  ) : local === 1 ? (
                    <>
                      <circle cx={x} cy="94" r="19" fill="#e6edda" stroke="#a7bba6" />
                      <path
                        d={`M${x - 11} 94q6 -12 11 0t11 0`}
                        stroke="#86a798"
                        fill="none"
                        strokeWidth="2"
                      />
                      <path
                        d={`M${x - 19} 94H${x - 23}V${tip - 55}M${x + 19} 94H${x + 23}V${tip - 55}`}
                        fill="none"
                        stroke="#98aea1"
                        strokeWidth="3"
                      />
                      {[-23, 23].map((dx) => (
                        <rect
                          key={dx}
                          x={x + dx - 3}
                          y={tip - 55}
                          width="6"
                          height="55"
                          rx="2"
                          fill="#889e8b"
                        />
                      ))}
                      {text(x, 293, `${a.currentMa.toFixed(3)}`)}
                    </>
                  ) : (
                    <>
                      <rect
                        x={x - 14}
                        y="244"
                        width={(28 * mg.mgLeft) / mg.initialMg}
                        height="5"
                        rx="2"
                        fill="#a1b0a6"
                      />
                      {Array.from({ length: bubbleN }, (_, j) => {
                        const q = (p * 3 + j / bubbleN) % 1;
                        return (
                          <circle
                            key={j}
                            cx={x - 12 + (24 * (j + 0.5)) / Math.max(1, bubbleN)}
                            cy={239 - q * 60}
                            r={2 + q}
                            fill="#f4f8ec"
                            stroke="#9fb5a6"
                            opacity={1 - clamp((q - 0.8) / 0.2)}
                          />
                        );
                      })}
                      {text(x, 293, `${mg.volume.toFixed(2)} mL`)}
                    </>
                  )}
                </g>
              );
            })}
            {text(
              cx,
              329,
              local === 1
                ? s('AC · 0.1 V · 电流 / mA', 'AC · 0.1 V · current / mA')
                : local === 2
                  ? s('Mg 各 5 mg · 模型产氢', '5 mg Mg each · model H₂')
                  : s('HAc = CH₃COOH · 理想模型', 'HAc = CH₃COOH · ideal model'),
            )}
          </>
        ) : mode === 0 ? (
          <>
            {(['HCl', 'HAc'] as AcidKind[]).map((kind, i) => {
              const C = i ? hac : hcl,
                a = acidSpeciation(kind, C),
                y = 70 + i * 133;
              return (
                <g key={kind}>
                  {text(cx, y, `${kind} · ${C.toPrecision(2)} M`)}
                  <rect x="25" y={y + 17} width={w - 50} height="24" rx="10" fill="#ddceb4" />
                  <rect
                    x="25"
                    y={y + 17}
                    width={(w - 50) * a.fraction}
                    height="24"
                    rx={Math.min(10, ((w - 50) * a.fraction) / 2)}
                    fill="#8cb49d"
                  />
                  {text(cx, y + 70, `${s('电离', 'Ionized')}: ${(a.fraction * 100).toFixed(2)}%`)}
                  {text(cx, y + 98, `[H⁺] = ${a.h.toExponential(2)} M`)}
                </g>
              );
            })}
            {text(cx, 331, s('电离比例增大，浓度仍可降低', 'Fraction can rise as [H⁺] falls'))}
          </>
        ) : mode === 1 ? (
          <>
            {text(cx, 24, 'Na₂CO₃ · 1 M')}
            <path
              d={`M${cx - 6} 43V79L${cx} 91L${cx + 6} 79V43Z`}
              fill="#f1f6e9"
              stroke="#a3b8a8"
            />
            <rect
              x={cx - 4}
              y={46 + (28 * c.delivered) / Math.max(1, f.watch ? 10 : drops)}
              width="8"
              height={28 * (1 - c.delivered / Math.max(1, f.watch ? 10 : drops))}
              fill="#c2d9c8"
            />
            {c.dropping && (
              <ellipse cx={cx} cy={95 + c.fall * (cl - 99)} rx="3" ry="4" fill="#a9c8b5" />
            )}
            <path
              d={`M${cx - 27} 106V251Q${cx - 27} 275 ${cx} 275Q${cx + 27} 275 ${cx + 27} 251V106`}
              fill="#f3f6ea"
              stroke="#a2b7a7"
              strokeWidth="2"
            />
            <path
              d={`M${cx - 25} ${cl}V251Q${cx - 25} 273 ${cx} 273Q${cx + 25} 273 ${cx + 25} 251V${cl}Z`}
              fill="#c9ddce"
            />
            {Array.from({ length: Math.min(8, Math.ceil(c.rate * 1e5)) }, (_, j) => {
              const q = (p * 12 + j / 8) % 1;
              return (
                <circle
                  key={j}
                  cx={cx - 16 + ((j * 11) % 32)}
                  cy={cl + 37 - q * 33}
                  r={2 + q}
                  fill="#f7f9ec"
                  stroke="#9fb7a8"
                  opacity={c.acidLeft > 1e-6 ? 1 - q * 0.6 : 0}
                />
              );
            })}
            {text(cx, 300, `CO₂: ${c.gasMl.toFixed(1)} mL`)}
            {text(cx, 331, s('2 mL 1 M 醋酸 · 开放体系', '2 mL 1 M HAc · open system'))}
          </>
        ) : local === 0 ? (
          <>
            {(['HCl', 'HAc'] as AcidKind[]).map((kind, i) => {
              const x = cx + (i ? 1 : -1) * Math.min(85, w * 0.235),
                a = acidInjection(kind, p, vol),
                level = 268 - 22 * a.injected,
                piston = 66 + 36 * a.injected;
              return (
                <g key={kind}>
                  {text(x, 25, kind)}
                  <circle cx={x - 18} cy="76" r="24" fill="#e7ecdc" stroke="#a4b8a6" />
                  {text(x - 18, 82, a.deltaP.toFixed(1))}
                  <path
                    d={`M${x - 18} 100V141H${x - 9}V183`}
                    fill="none"
                    stroke="#9eb3a7"
                    strokeWidth="5"
                  />
                  <path
                    d={`M${x - 18} 100V141H${x - 9}V183`}
                    fill="none"
                    stroke="#e0e8cd"
                    strokeWidth="2"
                  />
                  <rect
                    x={x + 8}
                    y="64"
                    width="12"
                    height="40"
                    rx="2"
                    fill="#f1f6ec"
                    stroke="#9db3a6"
                  />
                  <rect
                    x={x + 10}
                    y={piston}
                    width="8"
                    height={Math.max(0, 102 - piston)}
                    fill="#bed8c8"
                  />
                  <path
                    d={`M${x + 14} ${piston}V${piston - 26}m-8 0h16`}
                    stroke="#9db2a5"
                    strokeWidth="3"
                  />
                  <path d={`M${x + 9} ${piston}H${x + 19}`} stroke="#839b8b" strokeWidth="3" />
                  <path d={`M${x + 14} 104V185`} stroke="#9fb7aa" strokeWidth="2" />
                  <path
                    d={`M${x - 17} 164V191L${x - 42} 262Q${x - 45} 275 ${x - 33} 275H${x + 33}Q${x + 45} 275 ${x + 42} 262L${x + 17} 191V164Z`}
                    fill="#eef5e7"
                    fillOpacity=".55"
                    stroke="#a0b6a5"
                    strokeWidth="2"
                  />
                  <rect x={x - 18} y="164" width="36" height="10" rx="3" fill="#baa68b" />
                  {a.injected > 0 && (
                    <path
                      d={`M${x - 35} ${level}L${x - 40} 264Q${x - 41} 273 ${x - 31} 273H${x + 31}Q${x + 41} 273 ${x + 40} 264L${x + 35} ${level}Z`}
                      fill="#c6dcca"
                    />
                  )}
                  {a.injected > 0 && a.injected < 1 && (
                    <path d={`M${x + 14} 184V${level}`} stroke="#aecfbb" strokeWidth="2" />
                  )}
                  <rect
                    x={x - 13}
                    y="265"
                    width={(26 * a.mgMassLeft) / 0.05}
                    height="4"
                    rx="1"
                    fill="#98aa9c"
                  />
                  {a.hydrogen > 0 &&
                    a.injected > 0.35 &&
                    [0, 1, 2].map((j) => {
                      const q = (p * 8 + j / 3) % 1;
                      return (
                        <circle
                          key={j}
                          cx={x - 10 + j * 10}
                          cy={263 - q * Math.max(0, 263 - level - 3)}
                          r="2"
                          fill="#f7f9ee"
                          stroke="#9cb5a4"
                        />
                      );
                    })}
                  {text(x, 302, `${a.liquidMl.toFixed(1)} mL`)}
                </g>
              );
            })}
            {text(cx, 332, s('传感器压强增量 / kPa', 'Sensor pressure rise / kPa'))}
          </>
        ) : local === 1 ? (
          <>
            {text(cx, 25, s('教材趋势的定性重建', 'Textbook trend reconstruction'))}
            <path d={`M39 55V256H${w - 20}`} fill="none" stroke="#9fb4a4" />
            {[maxP / 3, (2 * maxP) / 3, maxP].map((v) => (
              <g key={v}>
                <path d={`M39 ${256 - v * pressureScale}H${w - 20}`} stroke="#dae4d6" />
                {text(32, 261 - v * pressureScale, v.toFixed(0), 'end')}
              </g>
            ))}
            {(['HCl', 'HAc'] as AcidKind[]).map((kind, i) => {
              const pts = Array.from({ length: 121 }, (_, j) => {
                const t = (p * 300 * j) / 120,
                  a = magnesiumPressure(kind, t, vol, i ? loss : 0);
                return `${39 + (t / 300) * (w - 59)},${256 - a.deltaP * pressureScale}`;
              }).join(' ');
              return (
                <g key={kind}>
                  <polyline
                    points={pts}
                    fill="none"
                    stroke={i ? '#75a78e' : '#c49a6c'}
                    strokeWidth="3"
                  />
                  {text(cx + (i ? 1 : -1) * 50, 292, kind)}
                </g>
              );
            })}
            {text(39, 278, '0')}
            {text(w - 21, 278, '300', 'end')}
            {text(cx, 328, s('时间 / s · ΔP / kPa', 'Time / s · ΔP / kPa'))}
          </>
        ) : (
          <>
            {text(cx, 26, 'Mg 0.05 g · acid 4 mmol')}
            {(['HCl', 'HAc'] as AcidKind[]).map((kind, i) => {
              const a = magnesiumPressure(kind, p * 500, vol, i ? loss : 0),
                initial = acidSpeciation(kind, 2),
                y = 72 + i * 119;
              return (
                <g key={kind}>
                  {text(25, y, kind, 'start')}
                  <rect x="25" y={y + 14} width={w - 50} height="22" rx="8" fill="#d9ccb0" />
                  <rect
                    x="25"
                    y={y + 14}
                    width={(w - 50) * (1 - a.protonCapacity / 0.004)}
                    height="22"
                    rx="8"
                    fill="#9cbea3"
                  />
                  {text(cx, y + 64, `H₂: ${(a.hydrogen * 1000).toFixed(3)} mmol`)}
                  {text(
                    cx,
                    y + 92,
                    `${s('初始 H⁺', 'Initial H⁺')}: ${(initial.h * 0.002 * 1000).toFixed(3)} mmol`,
                  )}
                </g>
              );
            })}
            {text(cx, 331, s('终点仍余 Mg ≈ 1.39 mg', 'Endpoint leaves Mg ≈ 1.39 mg'))}
          </>
        )}
      </svg>
      {!f.watch && (
        <div className="chem-acid-controls">
          <div className="chem-acid-buttons">
            {names.map((a, i) => (
              <button
                key={a}
                aria-pressed={mode === i}
                onClick={() => {
                  setMode(i);
                  setView(0);
                }}
              >
                {a}
              </button>
            ))}
          </div>
          <label>
            {s('观察位置', 'View')}
            <select value={view} onChange={(e) => setView(+e.target.value)}>
              {views[mode].map((a, i) => (
                <option key={a} value={i}>
                  {a}
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
          {mode === 0 && (
            <>
              <label>
                HCl · {hcl.toPrecision(2)} M
                <input
                  type="range"
                  min="-4"
                  max="-1"
                  step=".25"
                  value={logHcl}
                  onChange={(e) => setHcl(+e.target.value)}
                />
              </label>
              <label>
                HAc · {hac.toPrecision(2)} M
                <input
                  type="range"
                  min="-4"
                  max="-1"
                  step=".25"
                  value={logHac}
                  onChange={(e) => setHac(+e.target.value)}
                />
              </label>
              {local < 2 && (
                <button aria-pressed={contact} onClick={() => setContact(!contact)}>
                  {contact ? s('探头浸入', 'Probe immersed') : s('探头提起', 'Probe lifted')}
                </button>
              )}
            </>
          )}
          {mode === 1 && (
            <label>
              {s('碳酸钠滴数', 'Carbonate drops')}: {drops}
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={drops}
                onChange={(e) => setDrops(+e.target.value)}
              />
            </label>
          )}
          {mode === 2 && (
            <>
              <label>
                {s('注入后气相体积', 'Headspace after injection')}: {headspace} mL
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="10"
                  value={headspace}
                  onChange={(e) => setHead(+e.target.value)}
                />
              </label>
              {local > 0 && (
                <label>
                  {s('醋酸组漏气比例', 'Acetic run: leaked fraction')}: {Math.round(leak * 100)}%
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step=".1"
                    value={leak}
                    onChange={(e) => setLeak(+e.target.value)}
                  />
                </label>
              )}
            </>
          )}
          <label>
            {s(
              '自己的条件、测量与解释（初始为空）',
              'Your conditions, measurements and interpretation (initially blank)',
            )}
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <details>
            <summary>{s('模型与证据边界', 'Model and evidence boundaries')}</summary>
            <p>
              {s(
                'pH 使用 25 ℃ 理想电离与水自解离平衡，醋酸 Ka 为 1.75×10⁻⁵；电导用无限稀释离子迁移率近似。图中读数不是实际仪器校准。定性镁实验的 2 mL 溶液和 5 mg 镁是本片设计用量。',
                'pH uses ideal 25 °C acid and water equilibria with acetic Ka = 1.75×10⁻⁵. Conductance uses limiting ionic mobilities. Readouts are not instrument calibrations. The qualitative magnesium view uses an added design of 2 mL solution and 5 mg Mg.',
              )}
            </p>
            <p>
              {s(
                '压强曲线是教材定性形状的参数化重建，没有逐点实测数据。两组均按 2 mL 2 M 单元酸、0.05 g 镁、25 ℃ 计算理想氢气压强增量。弱酸曲线的先加速后减速不能仅由“继续电离”推导；真实温升、表面状态等需另行测量。注入镜头包含挤压空气效应，后续曲线相对加液后的共同基线。',
                'Pressure curves parametrically reconstruct the textbook qualitative shapes without pointwise measured data. Both use 2 mL of 2 M monoprotic acid, 0.05 g Mg and ideal hydrogen at 25 °C. Continued ionization alone does not derive the weak-acid acceleration: temperature and surface conditions require separate evidence. Injection includes air compression; later curves use a common post-addition baseline.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
