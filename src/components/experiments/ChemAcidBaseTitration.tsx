import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  titrationClamp as clamp,
  strongTitration,
  endpointVolume,
  halfDropState,
  rinseCarryover,
  titrationErrors,
  titrationFlaskGeometry,
  TITRATION_TEXTBOOK_RUNS,
  textbookTitrationMean,
  studentTitrationRows,
  type TitrationDirection,
  type TitrationError,
} from '../../models/chem-acid-base-titration';
import '../../styles/chem-acid-base-titration.css';
export default function ChemAcidBaseTitration() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const [view, setView] = useState(f.variant === 'chem-elective-1-activity-2' ? 3 : 0),
    [progress, setProgress] = useState(0.5),
    [volume, setVolume] = useState(20),
    [direction, setDirection] = useState<TitrationDirection>('base-into-acid'),
    [error, setError] = useState<TitrationError>('none'),
    [initial, setInitial] = useState(0),
    [rows, setRows] = useState(Array.from({ length: 3 }, () => ({ initial: '', final: '' }))),
    [notes, setNotes] = useState('');
  const v = f.watch ? f.chapter : view,
    p = clamp(f.watch ? f.chapterProgress : progress),
    cx = w / 2;
  const labels = [
    s('碱滴入酸的 pH 曲线', 'pH as base enters acid'),
    s('靠近当量点', 'Near equivalence'),
    s('指示剂的变色范围', 'Indicator transition ranges'),
    s('检漏与润洗', 'Leak check and conditioning'),
    s('排气泡，再读初始值', 'Clear bubbles, then read'),
    s('量取待测碱并加指示剂', 'Deliver analyte and indicator'),
    s('盐酸滴入待测碱', 'Add acid to the unknown base'),
    s('半滴、冲洗与终点观察', 'Half-drop, rinse and endpoint'),
    s('终读数减去初读数', 'Final reading minus initial'),
    s('三次结果与平均值', 'Three runs and their mean'),
    s('水加在不同的位置', 'Water in different locations'),
    s('按问题要求绘制反向曲线', 'Plot the requested reverse curve'),
  ];
  const text = (x: number, y: number, t: string, a: 'middle' | 'start' | 'end' = 'middle') => (
    <text x={x} y={y} textAnchor={a}>
      {t}
    </text>
  );
  const pink = (a: number) =>
    `rgb(${Math.round(223 + 9 * a)},${Math.round(234 - 91 * a)},${Math.round(218 - 40 * a)})`;
  const flask = (x: number, dy: number, ml: number, color: number) => {
    const g = titrationFlaskGeometry(ml),
      level = g.level,
      hw = g.radius;
    return (
      <>
        <rect x={cx - 65} y="281" width="130" height="8" rx="3" fill="#fffdf5" />
        <g transform={`translate(${x} ${dy})`}>
          <path
            d="M-22 167V193L-55 268Q-57 280 -45 280H45Q57 280 55 268L22 193V167"
            fill="#f1f6e9"
            stroke="#9fb4a7"
            strokeWidth="2"
          />
          {ml > 0 && (
            <path
              d={
                g.height >= 10
                  ? `M${-hw} ${level}L-52 267Q-54 277 -44 277H44Q54 277 52 267L${hw} ${level}Z`
                  : `M${-hw} ${level}Q${-g.cornerControl} 277 -44 277H44Q${g.cornerControl} 277 ${hw} ${level}Z`
              }
              fill={pink(color)}
            />
          )}
          <path d="M-25 167H25" stroke="#a8baaa" strokeWidth="2" />
        </g>
      </>
    );
  };
  const burette = (x: number, read: number, base = false, tip = 147) => {
    const top = 35,
      bottom = 112,
      meniscus = top + (clamp(read, -2, 50) / 50) * (bottom - top);
    return (
      <g>
        <path
          d={`M${x - 8} 30V112L${x - 3} 118V${tip}H${x + 3}V118L${x + 8} 112V30`}
          fill="#edf4e6"
          stroke="#a1b7a9"
          strokeWidth="2"
        />
        <path
          d={`M${x - 6} ${meniscus}Q${x} ${meniscus + 3} ${x + 6} ${meniscus}V111L${x + 2} 118V${tip - 2}H${x - 2}V118L${x - 6} 111Z`}
          fill="#bfd6c9"
        />
        {[0, 10, 20, 30, 40, 50].map((n) => (
          <g key={n}>
            <path d={`M${x + 8} ${top + (n / 50) * (bottom - top)}h7`} stroke="#96ac9d" />
            {text(x + 20, top + (n / 50) * (bottom - top) + 5, String(n), 'start')}
          </g>
        ))}
        {base ? (
          <>
            <rect x={x - 5} y="119" width="10" height="17" rx="4" fill="#bca78c" />
            <circle cx={x} cy="127" r="4" fill="#d8deca" />
          </>
        ) : (
          <>
            <rect x={x - 12} y="121" width="24" height="9" rx="4" fill="#b7c7b4" />
            <path d={`M${x} 119V132`} stroke="#819f8b" strokeWidth="3" />
          </>
        )}
      </g>
    );
  };
  const graph = [0, 1, 2, 11].includes(v),
    dir = f.watch ? 'base-into-acid' : direction,
    delivered = f.watch
      ? v === 1
        ? 19.9 + 0.2 * clamp(p / 0.85)
        : 40 * clamp(p / 0.88)
      : clamp(volume, v === 1 ? 19.8 : 0, v === 1 ? 20.2 : 40),
    st = strongTitration(dir, delivered),
    lo = v === 1 ? 19.8 : 0,
    hi = v === 1 ? 20.2 : 40,
    gx = (value: number) => 39 + ((value - lo) / (hi - lo)) * (w - 61),
    gy = (ph: number) => 267 - (ph / 14) * 218;
  const errors: TitrationError[] = [
      'none',
      'burette-water',
      'flask-water',
      'flask-sample',
      'tip-bubble',
    ],
    err = f.watch ? errors[1 + Math.min(2, Math.floor(p * 3))] : error,
    e = titrationErrors(err);
  const errNames = {
    none: s('正确条件', 'Correct conditions'),
    'burette-water': s('滴定管中残水', 'Water in the burette'),
    'flask-water': s('锥形瓶中有蒸馏水', 'Water in the flask'),
    'flask-sample': s('用待测液润洗锥形瓶', 'Rinsing flask with analyte'),
    'tip-bubble': s('尖嘴气泡被液体补满', 'Liquid fills a tip bubble'),
  };
  const parsed = studentTitrationRows(rows);
  return (
    <div className="chem-titration" ref={host}>
      <div className="chem-titration-head">{v === 10 ? errNames[err] : labels[v]}</div>
      <svg viewBox={`0 0 ${w} 340`} role="img" aria-label={labels[v]}>
        {graph ? (
          <>
            {v === 2 &&
              [
                [8.2, 10, '#e6c1cc'],
                [3.1, 4.4, '#e4cda1'],
              ].map(([a, b, color], i) => (
                <rect
                  key={i}
                  x="39"
                  y={gy(Number(b))}
                  width={w - 61}
                  height={gy(Number(a)) - gy(Number(b))}
                  fill={String(color)}
                  opacity=".7"
                />
              ))}
            <path d={`M39 43V267H${w - 22}`} fill="none" stroke="#9bb2a3" />
            {[2, 7, 12].map((n) => (
              <g key={n}>
                <path d={`M39 ${gy(n)}H${w - 22}`} stroke="#dbe5d5" />
                {text(32, gy(n) + 5, String(n), 'end')}
              </g>
            ))}
            <polyline
              points={Array.from({ length: 241 }, (_, j) => {
                const x = lo + ((hi - lo) * j) / 240;
                return `${gx(x)},${gy(strongTitration(dir, x).pH)}`;
              }).join(' ')}
              fill="none"
              stroke="#89ad97"
              strokeWidth="3"
            />
            <path d={`M${gx(20)} 43V267`} stroke="#bfac8c" strokeDasharray="4 5" />
            <circle cx={gx(delivered)} cy={gy(st.pH)} r="5" fill="#b28e69" />
            {text(cx, 25, `pH ${st.pH.toFixed(2)} · ${delivered.toFixed(3)} mL`)}
            {[lo, 20, hi].map((n) => (
              <g key={n}>{text(gx(n), 292, n.toFixed(v === 1 ? 1 : 0))}</g>
            ))}
            {text(
              cx,
              329,
              v === 2
                ? s('酚酞 8.2–10 · 甲基橙 3.1–4.4', 'PhPh 8.2–10 · MO 3.1–4.4')
                : dir === 'base-into-acid'
                  ? 'V(NaOH) / mL'
                  : 'V(HCl) / mL',
            )}
          </>
        ) : v === 3 ? (
          <>
            {p < 0.25 ? (
              <>
                {burette(cx - 20, 10)}
                <path
                  d={`M${cx - 45} 195V259Q${cx - 45} 270 ${cx - 32} 270H${cx + 32}Q${cx + 45} 270 ${cx + 45} 259V195`}
                  fill="#f2f6e9"
                  stroke="#a4b9a9"
                />
                {text(cx, 308, s('阀关闭 · 尖嘴保持干燥', 'Valve shut · dry tip'))}
              </>
            ) : (
              <>
                {(() => {
                  const phase = clamp((p - 0.25) / 0.7) * 3,
                    cycle = Math.min(3, Math.floor(phase)),
                    r = phase - Math.floor(phase),
                    bx = cx - 22,
                    angle = cycle < 3 ? -18 * Math.sin(Math.PI * clamp(r / 0.55)) : 0,
                    rad = (angle * Math.PI) / 180,
                    tx = bx - 67 * Math.sin(rad),
                    ty = 80 + 67 * Math.cos(rad);
                  return (
                    <>
                      {text(cx, 25, `${s('润洗', 'Rinse')} ${Math.min(3, cycle + 1)}/3 · 5 mL`)}
                      <g transform={`rotate(${angle} ${bx} 80)`}>
                        <path
                          d={`M${bx - 8} 40V111L${bx - 3} 118V147H${bx + 3}V118L${bx + 8} 111V40`}
                          fill="#f0f5e7"
                          stroke="#a1b5a5"
                          strokeWidth="2"
                        />
                        <path
                          d={`M${bx - 5} 43V109M${bx + 5} 43V109`}
                          stroke="#b2cfb9"
                          strokeWidth="3"
                        />
                        <rect x={bx - 12} y="120" width="24" height="8" rx="3" fill="#b6c9ae" />
                        <path
                          d={`M${bx - 18} 67q-10 16 0 30m-7 -6 7 6 2 -9`}
                          fill="none"
                          stroke="#a1b69d"
                        />
                      </g>
                      {r > 0.55 && cycle < 3 && (
                        <path
                          d={`M${tx} ${ty}V${269 - (cycle + clamp((r - 0.55) / 0.45)) * 17}`}
                          fill="none"
                          stroke="#afcdb9"
                          strokeWidth="2"
                        />
                      )}
                      <path
                        d={`M${cx - 55} 200V268Q${cx - 55} 279 ${cx - 43} 279H${cx + 24}Q${cx + 36} 279 ${cx + 36} 268V200`}
                        fill="#f0f6e7"
                        stroke="#a4b9a7"
                      />
                      <path
                        d={`M${cx - 53} ${276 - (cycle + clamp((r - 0.55) / 0.45)) * 17}V268Q${cx - 53} 277 ${cx - 43} 277H${cx + 24}Q${cx + 34} 277 ${cx + 34} 268V${276 - (cycle + clamp((r - 0.55) / 0.45)) * 17}Z`}
                        fill="#c4d9c4"
                      />
                      {text(
                        cx,
                        307,
                        `${s('残水比例', 'Water fraction')}: ${(rinseCarryover(cycle).waterFraction * 100).toFixed(3)}%`,
                      )}
                      {text(cx, 329, s('润洗液从下口弃去', 'Rinse out through the tip'))}
                    </>
                  );
                })()}
              </>
            )}
          </>
        ) : v === 4 ? (
          <>
            {burette(cx - 25, -1 + clamp(p / 0.65))}
            <path
              d={`M${cx - 25} 147V210`}
              stroke="#bed7c4"
              strokeWidth="2"
              opacity={p < 0.65 ? 1 : 0}
            />
            {p < 0.55 && (
              <ellipse
                cx={cx - 25}
                cy={138 + 9 * clamp(p / 0.55)}
                rx="2"
                ry="5"
                fill="#fbfbed"
                stroke="#9eb6a7"
              />
            )}
            <path
              d={`M${cx - 60} 205V268Q${cx - 60} 280 ${cx - 47} 280H${cx + 12}Q${cx + 25} 280 ${cx + 25} 268V205`}
              fill="#eff5e7"
              stroke="#a1b8a8"
            />
            <path
              d={`M${cx - 58} ${276 - 12 * clamp(p / 0.65)}V269Q${cx - 58} 278 ${cx - 47} 278H${cx + 12}Q${cx + 23} 278 ${cx + 23} 269V${276 - 12 * clamp(p / 0.65)}Z`}
              fill="#c4dcc8"
            />
            {text(
              cx,
              321,
              p < 0.65
                ? s('先排气泡 · 流出液弃去', 'Purge first · discard liquid')
                : s('重新调至 0.00 mL', 'Reset and read 0.00 mL'),
            )}
          </>
        ) : v === 5 ? (
          <>
            {(() => {
              const amount = 20 * clamp(p / 0.65),
                indicator = Math.min(2, Math.floor(clamp((p - 0.7) / 0.2) * 2));
              return (
                <>
                  {burette(cx, amount, true)}
                  {flask(cx, 0, amount, indicator ? 1 : 0)}
                  {p < 0.65 && (
                    <circle
                      cx={cx}
                      cy={150 + ((p * 13) % 1) * (titrationFlaskGeometry(amount).level - 154)}
                      r="3"
                      fill="#b2cfbd"
                    />
                  )}
                  {p > 0.7 && p < 0.9 && (
                    <>
                      <path d={`M${cx + 48} 132L${cx + 5} 157`} stroke="#b6bd9e" strokeWidth="6" />
                      <circle
                        cx={cx + 3}
                        cy={160 + (((p - 0.7) * 10) % 1) * 90}
                        r="3"
                        fill="#e4d3bd"
                      />
                    </>
                  )}
                  {text(cx, 307, `${amount.toFixed(2)} mL NaOH`)}
                  {text(
                    cx,
                    333,
                    `${s('酚酞', 'Phenolphthalein')}: ${indicator}/2 ${s('滴', 'drops')}`,
                  )}
                </>
              );
            })()}
          </>
        ) : v === 6 ? (
          <>
            {(() => {
              const a = 19.975 * clamp(p / 0.86),
                q = strongTitration('acid-into-base', a);
              return (
                <>
                  {burette(cx, a)}
                  {flask(cx, 0, q.totalMl, q.pink)}
                  {p < 0.86 && (
                    <circle
                      cx={cx}
                      cy={150 + ((p * 22) % 1) * (titrationFlaskGeometry(q.totalMl).level - 154)}
                      r="3"
                      fill="#b8d0bc"
                    />
                  )}
                  <path
                    d={`M${cx - 30} 294q30 11 60 0m-7 -4 7 4 -7 5`}
                    fill="none"
                    stroke="#a6b9a5"
                  />
                  {text(cx, 311, `HCl: ${a.toFixed(3)} mL`)}
                  {text(cx, 334, `pH ${q.pH.toFixed(2)}`)}
                </>
              );
            })()}
          </>
        ) : v === 7 ? (
          <>
            {(() => {
              const a = halfDropState(p),
                fx = cx + a.flaskDx;
              return (
                <>
                  <path
                    d={`M${cx - 6} 39V98L${cx - 2} 108V125H${cx + 2}V108L${cx + 6} 98V39`}
                    fill="#e5efdf"
                    stroke="#a0b7a3"
                    strokeWidth="2"
                  />
                  <path
                    d={`M${cx - 4} 56V98L${cx} 107V123`}
                    fill="none"
                    stroke="#b5d0b9"
                    strokeWidth="3"
                  />
                  <rect x={cx - 15} y="95" width="30" height="9" rx="4" fill="#b5c8ad" />
                  {a.hanging > 0 && (
                    <ellipse
                      cx={cx}
                      cy="128"
                      rx={3 * Math.cbrt(a.hanging / 0.025)}
                      ry={4 * Math.cbrt(a.hanging / 0.025)}
                      fill="#b1cbb6"
                    />
                  )}
                  {flask(fx, a.flaskDy, a.state.totalMl, a.state.pink)}
                  {a.wall > 0 && (
                    <path
                      d={`M${fx - 19} ${170 + a.flaskDy}V${193 + a.flaskDy}L${fx - 34} ${228 + a.flaskDy}`}
                      stroke="#97b99f"
                      strokeWidth="3"
                      opacity={a.wall / 0.025}
                      fill="none"
                    />
                  )}
                  {p > 0.5 && p < 0.78 && (
                    <>
                      <rect
                        x={w - 44}
                        y="87"
                        width="28"
                        height="43"
                        rx="8"
                        fill="#e4edda"
                        stroke="#a2b79f"
                      />
                      <path
                        d={`M${w - 29} 87V76L${cx + 12} 148V178`}
                        fill="none"
                        stroke="#aec5ad"
                        strokeWidth="4"
                      />
                      {p > 0.55 && (
                        <path
                          d={`M${cx + 12} 178Q${cx - 18} 195 ${cx - 31} ${titrationFlaskGeometry(a.state.totalMl).level + 1}`}
                          fill="none"
                          stroke="#bbd6c2"
                          strokeWidth="2"
                        />
                      )}
                    </>
                  )}
                  {text(cx, 26, `HCl ${a.reading.toFixed(3)} mL`)}
                  {text(cx, 308, `pH ${a.state.pH.toFixed(2)} · ${a.clock.toFixed(0)} / 30 s`)}
                  {text(cx, 335, s('观察计时 · 压缩播放', 'Clock · compressed time'))}
                </>
              );
            })()}
          </>
        ) : v === 8 ? (
          <>
            {(() => {
              const read = (f.watch ? 0 : initial) + 20,
                y = 150;
              return (
                <>
                  <rect
                    x={cx - 25}
                    y="34"
                    width="50"
                    height="208"
                    rx="9"
                    fill="#edf4e4"
                    stroke="#a2b8a5"
                  />
                  <path
                    d={`M${cx - 23} ${y - 6}Q${cx} ${y + 6} ${cx + 23} ${y - 6}V240H${cx - 23}Z`}
                    fill="#c0d8be"
                  />
                  {Array.from({ length: 9 }, (_, j) => {
                    const yy = y + (j - 4) * 22,
                      n = read + (j - 4) * 0.1;
                    return (
                      <g key={j}>
                        <path d={`M${cx - 25} ${yy}h${j % 2 ? 11 : 18}`} stroke="#8ea68f" />
                        {j % 2 === 0 && text(cx - 32, yy + 5, n.toFixed(1), 'end')}
                      </g>
                    );
                  })}
                  <path d={`M${cx + 27} ${y}H${w - 24}`} stroke="#b4a58a" strokeDasharray="3 4" />
                  {text(
                    cx,
                    270,
                    `${read.toFixed(2)} − ${(f.watch ? 0 : initial).toFixed(2)} = 20.00 mL`,
                  )}
                  {text(cx, 305, 'c(NaOH) = 0.1000 M')}
                  {text(cx, 334, s('弯月面最低点 · 平视', 'Meniscus · eye level'))}
                </>
              );
            })()}
          </>
        ) : v === 9 ? (
          <>
            {text(cx, 26, s('教材第 69 页例题数据', 'Textbook example · p.69'))}
            {text(cx, 53, 'HCl 0.1032 M')}
            {text(cx, 78, 'NaOH 25.00 mL')}
            {TITRATION_TEXTBOOK_RUNS.map((n, i) => (
              <g key={n}>
                <path d={`M24 ${95 + i * 50}H${w - 24}`} stroke="#d7e2d0" />
                {text(35, 126 + i * 50, String(i + 1))}
                {text(cx, 126 + i * 50, `${n.toFixed(2)} mL`)}
                {text(w - 25, 126 + i * 50, ((0.1032 * n) / 25).toFixed(4), 'end')}
              </g>
            ))}
            {text(cx, 283, `${s('平均', 'Mean')}: ${textbookTitrationMean().toFixed(4)} mol/L`)}
            {text(cx, 329, s('不是你的实验记录', 'Textbook data · not yours'))}
          </>
        ) : (
          <>
            {burette(cx, e.indicated)}
            {flask(cx, 0, e.sampleMl + e.actualDelivered + e.waterMl, 0)}
            {err === 'burette-water' && (
              <path d={`M${cx - 5} 56V96`} stroke="#a4c6d3" strokeWidth="4" />
            )}
            {err === 'flask-water' && (
              <path
                d={`M${cx - 35} 247Q${cx} 232 ${cx + 35} 247`}
                stroke="#a7c7d0"
                strokeWidth="4"
                fill="none"
              />
            )}
            {err === 'flask-sample' && (
              <path
                d={`M${cx - 18} 174V193L${cx - 34} 229`}
                stroke="#c998ae"
                strokeWidth="3"
                fill="none"
              />
            )}
            {err === 'tip-bubble' &&
              text(cx, 159, s('初始气泡已被液体补满', 'Initial bubble now filled'))}
            {text(cx, 307, `${s('读数体积', 'Indicated')}: ${e.indicated.toFixed(3)} mL`)}
            {text(cx, 334, `${s('算得浓度', 'Inferred')}: ${e.inferredC.toFixed(4)} M`)}
          </>
        )}
      </svg>
      {!f.watch && (
        <div className="chem-titration-controls">
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
          {graph && (
            <>
              <label>
                {s('滴定方向', 'Titration direction')}
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as TitrationDirection)}
                >
                  <option value="base-into-acid">NaOH → HCl</option>
                  <option value="acid-into-base">HCl → NaOH</option>
                </select>
              </label>
              <label>
                {s('加入体积', 'Delivered volume')}: {volume.toFixed(3)} mL
                <input
                  type="range"
                  min={lo}
                  max={hi}
                  step=".001"
                  value={volume}
                  onChange={(e) => setVolume(+e.target.value)}
                />
              </label>
              {v === 2 && (
                <p>
                  {s(
                    '酚酞下界对应的模型体积',
                    'Model volume at the lower phenolphthalein boundary',
                  )}
                  : {endpointVolume(direction, 8.2).toFixed(5)} mL; {s('当量点', 'equivalence')}:
                  20.00000 mL.
                </p>
              )}
            </>
          )}
          {v === 8 && (
            <label>
              {s('初读数', 'Initial reading')}: {initial.toFixed(2)} mL
              <input
                type="range"
                min="0"
                max="10"
                step=".05"
                value={initial}
                onChange={(e) => setInitial(+e.target.value)}
              />
            </label>
          )}
          {v === 10 && (
            <label>
              {s('改变的条件', 'Changed condition')}
              <select value={error} onChange={(e) => setError(e.target.value as TitrationError)}>
                {errors.map((x) => (
                  <option key={x} value={x}>
                    {errNames[x]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <details>
            <summary>{s('记录自己的三次滴定', 'Record your three titrations')}</summary>
            <p>
              {s(
                '标准 HCl 0.1000 M，待测 NaOH 每次 20.00 mL。空白字段没有示范值；请自行判断异常并重复实验。',
                'Standard HCl 0.1000 M; 20.00 mL NaOH per run. Fields contain no example values. Evaluate anomalies and repeat trials yourself.',
              )}
            </p>
            {rows.map((row, i) => (
              <fieldset key={i}>
                <legend>
                  {s('第', 'Run ')} {i + 1} {s('次', '')}
                </legend>
                {(['initial', 'final'] as const).map((k) => (
                  <label key={k}>
                    {k === 'initial'
                      ? s('初读数 / mL', 'Initial / mL')
                      : s('终读数 / mL', 'Final / mL')}
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step=".01"
                      value={row[k]}
                      onChange={(e) =>
                        setRows(rows.map((r, j) => (j === i ? { ...r, [k]: e.target.value } : r)))
                      }
                    />
                  </label>
                ))}
                <p>
                  {parsed.parsed[i]
                    ? `${parsed.parsed[i]!.volume.toFixed(2)} mL · ${parsed.parsed[i]!.concentration.toFixed(4)} M`
                    : '—'}
                </p>
              </fieldset>
            ))}
            <p>
              {s('三次有效记录的平均值', 'Mean of three valid records')}:{' '}
              {parsed.mean === null ? '—' : `${parsed.mean.toFixed(4)} M`}
            </p>
            <textarea
              aria-label={s('测量条件和异常记录', 'Conditions and anomalies')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </details>
          <details>
            <summary>{s('模型与实验边界', 'Model and experiment boundaries')}</summary>
            <p>
              {s(
                '强酸强碱采用 25 ℃ 理想电荷守恒，包含水自解离。示范用 20.00 mL 0.1000 M 样品和 0.1000 M 滴定剂；活动中未知样品的浓度不能靠动画预先确定。颜色按教材变色范围插值，指示剂终点不严格等于 pH 7。',
                'The ideal 25 °C strong-acid/base model includes water dissociation and charge balance. Demonstrations use a 20.00 mL 0.1000 M sample and 0.1000 M titrant. Animation cannot determine your unknown sample concentration. Color interpolates textbook transition ranges; indicator endpoint does not strictly mean pH 7.',
              )}
            </p>
            <p>
              {s(
                '半滴示意取 0.025 mL，冲洗用 2 mL 水；液滴体积与混合时间并非仪器校准。滴定管主图压缩了全量程，读数镜头另作局部放大。润洗液膜、混合和 30 秒观察使用压缩时间；所有气泡应在正式取读数之前排除。',
                'The half-drop is 0.025 mL with a 2 mL water rinse; drop size and mixing times are not calibrated. Main apparatus compresses the burette scale; the reading view is magnified separately. Conditioning, mixing and the 30-second observation are time compressed. Clear bubbles before taking formal readings.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
