import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  eqClamp as clamp,
  nitrogenEquilibrium,
  nitrogenRelax,
  syringeChange,
  ammoniaDynamic,
  HABER_P,
  HABER_T,
  haber,
  ironMixture,
  chromium,
  copper,
  deliveredDrops,
  flaskExchange,
  ammoniaRecycle,
} from '../../models/chem-equilibrium-response';
import '../../styles/chem-equilibrium-response.css';
export default function ChemEquilibriumResponse() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const variants = [
    'chem-elective-1-model-p32',
    'chem-elective-1-experiment-2-2',
    'chem-elective-1-experiment-2-3',
    'chem-elective-1-model-p46',
    'chem-elective-1-activity-1',
  ];
  const [mode0, setMode] = useState(Math.max(0, variants.indexOf(f.variant ?? ''))),
    [view, setView] = useState(0),
    [progress, setProgress] = useState(0.6),
    [catalyst, setCatalyst] = useState(false),
    [temp, setTemp] = useState(400),
    [pressure, setPressure] = useState(20),
    [baseDrops, setBase] = useState(8),
    [acidDrops, setAcid] = useState(8),
    [notes, setNotes] = useState('');
  const mode = f.watch
      ? f.chapter < 2
        ? 0
        : f.chapter < 4
          ? 1
          : f.chapter < 5
            ? 2
            : f.chapter < 8
              ? 3
              : 4
      : mode0,
    starts = [0, 2, 4, 5, 8],
    local = f.watch ? f.chapter - starts[mode] : view,
    p = clamp(f.watch ? f.chapterProgress : progress),
    cx = w / 2;
  const names = [
    s('动态平衡', 'Dynamic equilibrium'),
    s('改变气体体积', 'Change gas volume'),
    s('气体冷热对照', 'Hot and cold gas'),
    s('合成氨条件', 'Ammonia conditions'),
    s('平衡实验活动', 'Equilibrium activities'),
  ];
  const views = [
    [
      s('由反应物走近平衡', 'Approach from reactants'),
      s('由生成物走近平衡', 'Approach from products'),
    ],
    [
      s('拉出：稀释后再变化', 'Expand: dilute, then react'),
      s('推入：浓缩后再变化', 'Compress: concentrate, then react'),
    ],
    [s('相同气体，冷热分开', 'Same gas, different baths')],
    [
      s('速率与平衡组成', 'Rate and equilibrium composition'),
      s('压强与设备约束', 'Pressure and equipment constraints'),
      s('分离产物，循环原料', 'Separate product, recycle reactants'),
    ],
    [
      s('增加铁盐或硫氰酸盐', 'Add iron salt or thiocyanate'),
      s('继续加入铁粉', 'Then add iron powder'),
      s('先加碱，再加酸', 'Add base, then acid'),
      s('铜盐先热后冷', 'Heat and cool copper solution'),
      s('两只烧瓶交换水浴', 'Exchange the two flasks'),
    ],
  ];
  const text = (x: number, y: number, v: string, anchor: 'middle' | 'start' | 'end' = 'middle') => (
    <text x={x} y={y} textAnchor={anchor}>
      {v}
    </text>
  );
  const d = ammoniaDynamic(p * 100, local === 1, f.watch ? 1 : catalyst ? 5 : 1),
    n = syringeChange(local === 0, p),
    span = Math.min(200, w - 100),
    piston = 35 + (span * n.volume) / 40;
  const reaction = f.watch ? clamp((p - 0.12) / 0.88) : p,
    drop = deliveredDrops(p, 5),
    isCr = mode === 4 && local === 2,
    base = f.watch ? 8 : baseDrops,
    acid = f.watch ? 8 : acidDrops,
    crDrop = deliveredDrops(p < 0.5 ? p * 2 : (p - 0.5) * 2, p < 0.5 ? base : acid),
    cr = chromium(p < 0.5 ? crDrop.delivered : base, p < 0.5 ? 0 : crDrop.delivered);
  const cuTemperature = p < 0.5 ? 25 + 50 * clamp(p * 2) : 75 - 50 * clamp((p - 0.5) * 2),
    cu = copper(cuTemperature),
    hotCold = mode === 2 || (mode === 4 && local === 4);
  const flask = (x: number, y: number, id: number, opacity: number) => (
    <g>
      <path
        d={`M${x - 9} ${y - 54}V${y - 29}A30 30 0 1 0 ${x + 9} ${y - 29}V${y - 54}Z`}
        fill="#f2f6e8"
        stroke="#9eb3a8"
        strokeWidth="2"
      />
      <path
        d={`M${x - 7} ${y - 51}V${y - 28}A28 28 0 1 0 ${x + 7} ${y - 28}V${y - 51}Z`}
        fill="#aa5738"
        fillOpacity={opacity}
      />
      <rect x={x - 11} y={y - 58} width="22" height="8" rx="2" fill="#b6a38e" />
      {text(x, y + 5, String(id))}
    </g>
  );
  const bath = (x: number, T: number) => (
    <g>
      <path
        d={`M${x - 43} 195V276Q${x - 43} 290 ${x - 30} 290H${x + 30}Q${x + 43} 290 ${x + 43} 276V195`}
        fill={T > 25 ? '#f0d6bf' : '#c5dde4'}
        fillOpacity=".55"
        stroke="#adc3b9"
      />
      <path d={`M${x - 42} 218H${x + 42}`} stroke={T > 25 ? '#d5b294' : '#a9c4ce'} />
      {text(x, 316, `${T} °C`)}
    </g>
  );
  const pipette = (
    x: number,
    y: number,
    fill: string,
    delivered: number,
    total: number,
    fall: number,
    visible: boolean,
    liquidY: number,
  ) => (
    <g>
      <path
        d={`M${x - 5} ${y}V${y + 27}L${x} ${y + 35}L${x + 5} ${y + 27}V${y}Z`}
        fill="#eff6ed"
        stroke="#9fb6ab"
      />
      <rect
        x={x - 3}
        y={y + 3 + (20 * delivered) / Math.max(1, total)}
        width="6"
        height={20 * (1 - delivered / Math.max(1, total))}
        fill={fill}
      />
      {visible && (
        <ellipse cx={x} cy={y + 38 + fall * (liquidY - y - 42)} rx="2.5" ry="4" fill={fill} />
      )}
    </g>
  );
  return (
    <div className="chem-equilibrium" ref={host}>
      <div className="chem-equilibrium-head">{views[mode][local]}</div>
      <svg viewBox={`0 0 ${w} 340`} role="img" aria-label={views[mode][local]}>
        {mode === 0 ? (
          <>
            {text(cx, 25, 'N₂ + 3H₂ ⇌ 2NH₃')}
            {text(cx, 47, s('浓度 / mol·L⁻¹', 'Concentration / mol·L⁻¹'))}
            <path
              d={`M${cx - 74} 51H${cx + 74}Q${cx + 90} 51 ${cx + 90} 68V207Q${cx + 90} 224 ${cx + 74} 224H${cx - 74}Q${cx - 90} 224 ${cx - 90} 207V68Q${cx - 90} 51 ${cx - 74} 51Z`}
              fill="#f2f6ec"
              stroke="#b0c2b2"
            />
            {[
              { label: 'N₂', n: d.nitrogen, max: 1, color: '#a8bdd0' },
              { label: 'H₂', n: d.hydrogen, max: 3, color: '#d4d3b2' },
              { label: 'NH₃', n: d.ammonia, max: 2, color: '#91b6a0' },
            ].map((a, i) => (
              <g key={a.label}>
                <rect
                  x={cx - 65 + i * 50}
                  y={204 - (a.n / 3) * 112}
                  width="30"
                  height={(a.n / 3) * 112}
                  rx="8"
                  fill={a.color}
                />
                {text(cx - 50 + i * 50, 78, a.label)}
                {text(cx - 50 + i * 50, 246, a.n.toFixed(2))}
              </g>
            ))}
            <path
              d={`M${cx - 70} 276H${cx + 70}l-8 -5m8 5l-8 5M${cx + 70} 311H${cx - 70}l8 -5m-8 5l8 5`}
              fill="none"
              stroke="#9cb3a2"
              strokeWidth="2"
            />
            {[0, 1].map((i) => {
              const rate = i ? d.reverse : d.forward,
                q = ((f.watch ? f.chapterTime : p * 20) * rate * 6) % 1;
              return (
                <circle
                  key={i}
                  cx={cx + (i ? 1 : -1) * 70 + (i ? -1 : 1) * 140 * q}
                  cy={i ? 311 : 276}
                  r="4"
                  fill={i ? '#ba9c7a' : '#7caa8d'}
                  opacity={rate > 1e-8 ? 1 : 0}
                />
              );
            })}
            {text(cx, 268, `${s('正向', 'Forward')} ${d.forward.toFixed(3)}`)}
            {text(cx, 334, `${s('逆向', 'Reverse')} ${d.reverse.toFixed(3)}`)}
          </>
        ) : mode === 1 ? (
          <>
            {text(cx, 28, '2 NO₂ ⇌ N₂O₄')}
            {text(cx, 58, s('侧视：光程固定', 'Side view: fixed optical path'))}
            <g transform={`translate(${cx - (35 + span / 2)} 0)`}>
              <rect
                x="34"
                y="104"
                width={span + 4}
                height="68"
                rx="6"
                fill="#f0f6ea"
                stroke="#a2b6a9"
                strokeWidth="2"
              />
              <rect
                x="36"
                y="106"
                width={Math.max(0, piston - 36)}
                height="64"
                fill="#a35235"
                opacity={n.opacity}
              />
              <path d={`M34 125H18V150H34`} fill="#ecebdc" stroke="#a2b6a9" />
              <rect x="12" y="122" width="10" height="31" rx="3" fill="#b19c83" />
              <rect x={piston - 3} y="105" width="6" height="66" rx="2" fill="#9bb1a3" />
              <path
                d={`M${piston + 3} 138H${piston + 40}m0 -20v40`}
                stroke="#9fb4a6"
                strokeWidth="5"
              />
              {[20, 40].map((v) => (
                <g key={v}>
                  <path d={`M${35 + (span * v) / 40} 104V95`} stroke="#9eb4a4" />
                  {text(35 + (span * v) / 40, 87, `${v}`)}
                </g>
              ))}
            </g>
            {text(cx, 213, `${n.volume.toFixed(0)} mL`)}
            {text(
              cx,
              248,
              n.phase === 'volume'
                ? s('先改变体积', 'Volume changes first')
                : s('体积固定，组成继续变化', 'Composition relaxes'),
            )}
            {text(cx, 285, `c(NO₂) = ${n.concentration.toFixed(4)} M`)}
            {text(cx, 320, s('封闭体系 · 示意参数', 'Closed · model parameters'))}
          </>
        ) : hotCold ? (
          <>
            {(() => {
              const L = cx - Math.min(85, w * 0.23),
                R = cx + Math.min(85, w * 0.23),
                swap = mode === 4;
              return (
                <>
                  {bath(L, 60)}
                  {bath(R, 0)}
                  {[0, 1].map((i) => {
                    const initial = nitrogenEquilibrium(20, swap ? (i ? 0 : 60) : 25),
                      T = swap && p >= 0.7 ? (i ? 60 : 0) : i ? 0 : 60,
                      state = nitrogenRelax(
                        initial.monomer,
                        20,
                        T,
                        swap ? Math.max(0, p - 0.7) * 180 : p * 60,
                      ),
                      position = swap ? flaskExchange(w, p, i) : { x: i ? R : L, y: 220 };
                    return <g key={i}>{flask(position.x, position.y, i + 1, state.opacity)}</g>;
                  })}
                  {text(
                    cx,
                    338,
                    swap
                      ? s('保留瓶号，比较交换前后', 'Keep the same flask IDs')
                      : s('封闭后分别置于水浴', 'Seal before separate baths'),
                  )}
                </>
              );
            })()}
          </>
        ) : mode === 3 ? (
          <>
            {local === 0 ? (
              <>
                {text(cx, 26, '20 MPa · NH₃ / %')}
                <path d={`M37 56V251H${w - 24}`} fill="none" stroke="#a3b5a7" />
                {[0.1, 0.2, 0.3, 0.4].map((v) => (
                  <g key={v}>
                    <path d={`M37 ${251 - v * 440}H${w - 24}`} stroke="#d9e3d5" />
                    {text(31, 256 - v * 440, `${Math.round(v * 100)}`, 'end')}
                  </g>
                ))}
                {[400, 500].map((T, i) => {
                  const points = Array.from({ length: 81 }, (_, j) => {
                      const t = (p * 60 * j) / 80,
                        a = haber(T, 20, t, f.watch ? false : catalyst)!;
                      return `${37 + (t / 60) * (w - 61)},${251 - a.observed * 440}`;
                    }).join(' '),
                    eq = haber(T, 20, 0)!;
                  return (
                    <g key={T}>
                      <path
                        d={`M37 ${251 - eq.equilibrium * 440}H${w - 24}`}
                        stroke={i ? '#bd996b' : '#789f8a'}
                        strokeDasharray="4 5"
                      />
                      <polyline
                        points={points}
                        stroke={i ? '#bd996b' : '#789f8a'}
                        strokeWidth="3"
                        fill="none"
                      />
                      {text(cx + (i ? 1 : -1) * 55, 290, `${T} °C`)}
                    </g>
                  );
                })}
                {text(37, 268, '0')}
                {text(w - 24, 268, '60')}
                {text(cx, 315, s('虚线：教材平衡值', 'Dashes: textbook equilibrium'))}
                {text(cx, 337, s('示意时间 / s', 'Illustrative time / s'))}
              </>
            ) : local === 1 ? (
              <>
                {text(cx, 27, `${f.watch ? 400 : temp} °C`)}
                {HABER_P.filter((v) => v >= 10 && v <= 60).map((P, i) => {
                  const a = haber(f.watch ? 400 : temp, P, 0)!,
                    x = 35 + (i * (w - 70)) / 3,
                    h = a.equilibrium * 200;
                  return (
                    <g key={P}>
                      <rect
                        x={x - 14}
                        y={238 - h * clamp(p * 1.4)}
                        width="28"
                        height={h * clamp(p * 1.4)}
                        rx="8"
                        fill={P === (f.watch ? 20 : pressure) ? '#86ad94' : '#c1d2b9'}
                      />
                      {text(x, 260, String(P))}
                      {text(x, 219 - h * clamp(p * 1.4), `${(a.equilibrium * 100).toFixed(1)}`)}
                    </g>
                  );
                })}
                {text(cx, 295, s('压强 / MPa · 含氨量 / %', 'Pressure / MPa · NH₃ / %'))}
                {text(cx, 330, s('高压：设备与能耗约束', 'Pressure has practical costs'))}
              </>
            ) : (
              <>
                {(() => {
                  const a = ammoniaRecycle(p),
                    L = cx - 55,
                    R = cx + 55,
                    level = 273 - (a.removed / 2) * 30;
                  return (
                    <>
                      {text(cx, 24, s(`第 ${a.round} 次通过`, `Pass ${a.round}`))}
                      <path
                        d={`M${R} 107V48H${L}V107M${L + 22} 136H${R - 22}M${R} 174V236`}
                        stroke="#9cb3a2"
                        strokeWidth="7"
                        fill="none"
                      />
                      <path
                        d={`M${R} 107V48H${L}V107M${L + 22} 136H${R - 22}M${R} 174V236`}
                        stroke="#e4ebcf"
                        strokeWidth="3"
                        fill="none"
                      />
                      <rect
                        x={L - 22}
                        y="107"
                        width="44"
                        height="67"
                        rx="17"
                        fill="#d6ddc3"
                        stroke="#9aae95"
                      />
                      {[0, 1, 2, 3].map((i) => (
                        <path
                          key={i}
                          d={`M${L - 15} ${121 + i * 12}H${L + 15}`}
                          stroke="#9baa82"
                          strokeWidth="4"
                        />
                      ))}
                      <rect
                        x={R - 22}
                        y="107"
                        width="44"
                        height="67"
                        rx="17"
                        fill="#c4dce1"
                        stroke="#9db6b3"
                      />
                      <path
                        d={`M${R} 109v12q-15 6 0 12q15 6 0 12q-15 6 0 12v15`}
                        stroke="#8dafb0"
                        strokeWidth="3"
                        fill="none"
                      />
                      {text(L, 96, s('催化床', 'Catalyst'))}
                      {text(R, 96, s('冷凝', 'Condenser'))}
                      <path
                        d={`M${R - 24} 230V271Q${R - 24} 280 ${R - 15} 280H${R + 15}Q${R + 24} 280 ${R + 24} 271V230`}
                        fill="#edf3e8"
                        stroke="#a0b9a7"
                      />
                      <path
                        d={`M${R - 22} ${level}V271Q${R - 22} 278 ${R - 14} 278H${R + 14}Q${R + 22} 278 ${R + 22} 271V${level}Z`}
                        fill="#9abf9b"
                      />
                      {a.phase === 'separate' && (
                        <circle
                          cx={R}
                          cy={174 + clamp((a.q - 0.35) / 0.35) * (level - 174)}
                          r="4"
                          fill="#85aa83"
                        />
                      )}
                      {a.phase === 'recycle' && (
                        <circle
                          cx={R - 110 * clamp((a.q - 0.7) / 0.3)}
                          cy="48"
                          r="4"
                          fill="#b6b997"
                        />
                      )}
                      {a.phase === 'react' && (
                        <circle
                          cx={L + 22 + 66 * clamp(a.q / 0.35)}
                          cy="136"
                          r="4"
                          fill="#a0b88b"
                        />
                      )}
                      {text(L, 213, 'N₂ + H₂')}
                      {text(L, 240, s('返回原料', 'Recycle gas'))}
                      {text(cx, 307, `NH₃(l): ${a.removed.toFixed(2)} mol`)}
                      {text(
                        cx,
                        337,
                        s('有限投料 · 理想分离示意', 'Finite batch · ideal separation'),
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </>
        ) : mode === 4 && local < 2 ? (
          <>
            {text(cx, 25, s('三份相同的初始混合液', 'Three equal initial aliquots'))}
            {(['Fe', 'SCN', 'none'] as const).map((add, i) => {
              const x = ((i + 0.5) * w) / 3,
                amount = local === 0 ? drop.delivered : 5,
                iron = local === 1 && i < 2 ? reaction : 0,
                a = ironMixture(add, amount, iron),
                level = 258 - (a.volume / 0.004) * 108;
              return (
                <g key={add}>
                  {text(x, 54, i === 0 ? 'Fe³⁺' : i === 1 ? 'SCN⁻' : s('对照', 'Ref.'))}
                  <path
                    d={`M${x - 20} 108V246Q${x - 20} 263 ${x} 263Q${x + 20} 263 ${x + 20} 246V108`}
                    fill="#f1f5e8"
                    stroke="#a5b9a9"
                    strokeWidth="2"
                  />
                  <path
                    d={`M${x - 18} ${level}V246Q${x - 18} 261 ${x} 261Q${x + 18} 261 ${x + 18} 246V${level}Z`}
                    fill="#a93626"
                    opacity={a.opacity}
                  />
                  {i < 2 &&
                    local === 0 &&
                    pipette(
                      x,
                      66,
                      i ? '#b7d6c7' : '#ddc78c',
                      drop.delivered,
                      5,
                      drop.fall,
                      drop.visible,
                      level,
                    )}
                  {i < 2 &&
                    local === 1 &&
                    Array.from({ length: 6 }, (_, j) => (
                      <circle
                        key={j}
                        cx={x - 11 + j * 4.3}
                        cy={85 + clamp(p / 0.25) * 169 + (j % 2) * 2}
                        r={2.6 * Math.cbrt(Math.max(0, 1 - reaction))}
                        fill="#747b6e"
                      />
                    ))}
                  {text(x, 290, `${(a.volume * 1000).toFixed(2)}`)}
                </g>
              );
            })}
            {text(cx, 328, s('液量 / mL · 红色物种示意', 'Volume / mL · red-species model'))}
          </>
        ) : isCr ? (
          <>
            {text(cx, 28, p < 0.5 ? 'NaOH · 6 M' : 'H₂SO₄ · 6 M')}
            {pipette(
              cx,
              49,
              p < 0.5 ? '#c6d5be' : '#c4d3e0',
              crDrop.delivered,
              p < 0.5 ? base : acid,
              crDrop.fall,
              crDrop.visible,
              250 - (cr.volume / 0.003) * 110,
            )}
            <path
              d={`M${cx - 29} 101V243Q${cx - 29} 269 ${cx} 269Q${cx + 29} 269 ${cx + 29} 243V101`}
              fill="#f3f6e8"
              stroke="#a7b9a9"
              strokeWidth="2"
            />
            <path
              d={`M${cx - 27} ${250 - (cr.volume / 0.003) * 110}V243Q${cx - 27} 267 ${cx} 267Q${cx + 27} 267 ${cx + 27} 243V${250 - (cr.volume / 0.003) * 110}Z`}
              fill={`rgb(232 ${Math.round(208 - 76 * cr.fraction)} 63)`}
            />
            {text(cx, 293, `${s('已滴入', 'Added')}: ${crDrop.delivered} ${s('滴', 'drops')}`)}
            {text(cx, 315, s('黄：铬酸根', 'Yellow: chromate'))}
            {text(cx, 334, s('橙：重铬酸根', 'Orange: dichromate'))}
          </>
        ) : (
          <>
            {text(cx, 25, 'CuCl₂ · 0.5 M · 2 mL')}
            {[0, 1].map((i) => {
              const x = cx + (i ? 1 : -1) * Math.min(70, w * 0.23),
                state = i ? copper(25) : cu;
              return (
                <g key={i}>
                  {i === 0 && p >= 0.5 && (
                    <path
                      d={`M${x - 36} 146V246Q${x - 36} 257 ${x - 26} 257H${x + 26}Q${x + 36} 257 ${x + 36} 246V146`}
                      fill="#c7dfe3"
                      fillOpacity={clamp((p - 0.5) * 8) * 0.6}
                      stroke="#a7bdba"
                    />
                  )}
                  <path
                    d={`M${x - 19} 72V198Q${x - 19} 218 ${x} 218Q${x + 19} 218 ${x + 19} 198V72`}
                    fill="#eff6ed"
                    stroke="#a2b6aa"
                    strokeWidth="2"
                  />
                  <path
                    d={`M${x - 17} 134V198Q${x - 17} 216 ${x} 216Q${x + 17} 216 ${x + 17} 198V134Z`}
                    fill={state.color}
                  />
                  {i === 0 && p < 0.5 && (
                    <>
                      <ellipse cx={x} cy="274" rx="24" ry="18" fill="#d6dcd0" stroke="#acb9a8" />
                      <rect x={x - 7} y="249" width="14" height="16" rx="2" fill="#a4ab99" />
                      <path
                        d={`M${x} 218Q${x - 17} 246 ${x} 250Q${x + 15} 244 ${x} 218`}
                        fill="#e5b677"
                      />
                    </>
                  )}
                  {text(x, 310, i ? s('室温对照', 'Reference') : `${cuTemperature.toFixed(0)} °C`)}
                </g>
              );
            })}
            {text(cx, 338, s('混合物颜色，不是纯黄色', 'Mixture color, not pure yellow'))}
          </>
        )}
      </svg>
      {!f.watch && (
        <div className="chem-equilibrium-controls">
          <div className="chem-equilibrium-buttons">
            {names.map((v, i) => (
              <button
                key={v}
                aria-pressed={mode === i}
                onClick={() => {
                  setMode(i);
                  setView(0);
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <label>
            {s('观察位置', 'View')}
            <select value={view} onChange={(e) => setView(+e.target.value)}>
              {views[mode].map((v, i) => (
                <option key={v} value={i}>
                  {v}
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
          {(mode === 0 || (mode === 3 && local === 0)) && (
            <button aria-pressed={catalyst} onClick={() => setCatalyst(!catalyst)}>
              {s('催化加速', 'Catalytic acceleration')}:{' '}
              {catalyst ? s('开启', 'on') : s('关闭', 'off')}
            </button>
          )}
          {mode === 3 && local === 1 && (
            <>
              <label>
                {s('温度', 'Temperature')}
                <select value={temp} onChange={(e) => setTemp(+e.target.value)}>
                  {HABER_T.map((t) => (
                    <option key={t} value={t}>
                      {t} °C
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {s('高亮压强', 'Highlight pressure')}
                <select value={pressure} onChange={(e) => setPressure(+e.target.value)}>
                  {[10, 20, 30, 60].map((v) => (
                    <option key={v} value={v}>
                      {v} MPa
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          {isCr && (
            <>
              {[
                [s('碱滴数', 'Base drops'), baseDrops, setBase],
                [s('酸滴数', 'Acid drops'), acidDrops, setAcid],
              ].map(([label, val, set]) => (
                <label key={label as string}>
                  {label as string}
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={val as number}
                    onChange={(e) => (set as (n: number) => void)(+e.target.value)}
                  />
                </label>
              ))}
            </>
          )}
          <label>
            {s(
              '自己的条件、观察与证据（初始为空）',
              'Your conditions, observations and evidence (initially blank)',
            )}
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <details>
            <summary>
              {s('模型条件与颜色口径', 'Model conditions and color interpretation')}
            </summary>
            <p>
              {s(
                '所有动态时间、光学系数和除教材表外的平衡常数均为教学参数。NO₂装置封闭，观察光程固定；浓缩和稀释先发生，随后在新体积下重新平衡。水浴按气体迅速达到设定温度近似。',
                'Dynamic times, optical coefficients and equilibrium constants outside the textbook table are teaching parameters. The NO₂ apparatus is sealed with a fixed optical path. Compression or dilution precedes relaxation at the new volume. Bath views approximate rapid thermal equilibration.',
              )}
            </p>
            <p>
              {s(
                '铁红色物种使用 FeSCN²⁺ 的单配体近似；铜盐采用蓝色水合物种与黄色氯配物种的混合颜色，实际还存在中间配合物。铬模型只保留铬酸根和重铬酸根，省略氢铬酸根；计算酸度不作为实测 pH 报告。每滴体积假设 0.05 mL。',
                'The red iron model approximates one FeSCN²⁺ species. Copper color combines aqua and chloro species; real solutions also contain intermediate complexes. Chromium retains chromate and dichromate but omits hydrogen chromate. Its calculated acidity is not reported as measured pH. Each drop is assumed to be 0.05 mL.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
