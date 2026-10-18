import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  electroClamp as clamp,
  electrolysisState,
  electrodePreparation,
  surfacePlating,
  uChannelPoint,
  chlorinePath,
  polylinePoint,
} from '../../models/chem-electrolysis-plating';
import '../../styles/chem-electrolysis-plating.css';
export default function ChemElectrolysisPlating() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    uid = useId().replaceAll(':', ''),
    cx = w / 2,
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const [view, setView] = useState(f.variant === 'chem-elective-1-activity-4' ? 4 : 0),
    [progress, setProgress] = useState(0.75),
    [current, setCurrent] = useState(0.2),
    [closed, setClosed] = useState(true),
    [reverse, setReverse] = useState(false),
    [wet, setWet] = useState(true),
    [clean, setClean] = useState(true),
    [notes, setNotes] = useState('');
  const v = f.watch ? f.chapter : view,
    p = clamp(f.watch ? f.chapterProgress : progress),
    q = clamp(p / 0.9),
    kind = v < 4 ? 'chloride' : 'plating',
    on = f.watch ? v !== 9 && (v !== 0 || p > 0.2) : closed,
    rev = kind === 'plating' && (f.watch ? v === 8 : reverse),
    paperWet = f.watch ? true : wet,
    I = f.watch ? 0.2 : current,
    t = (v === 0 ? clamp((p - 0.2) / 0.65) : q) * (v === 6 ? 300 : 600),
    a = electrolysisState(kind, t, I, on, rev),
    left = cx - 60,
    right = cx + 60;
  const names = [
    s('石墨电极与直流电源', 'Carbon electrodes and direct current'),
    s('导线传电子，溶液传离子', 'Electrons in wires; ions in solution'),
    s('阳极气体接触湿试纸', 'Anode gas reaches moist paper'),
    s('电量决定理想产量', 'Charge determines the ideal yield'),
    s('打磨、除油、冲洗', 'Abrade, degrease and rinse'),
    s('除锈之后再次冲洗', 'Remove rust, then rinse again'),
    s('铁接负极，铜接正极', 'Iron negative, copper positive'),
    s('铜阳极补充溶液中的铜', 'Copper anode replenishes the bath'),
    s('接反后，铁成为阳极', 'Reversal makes iron the anode'),
    s('断路仍可能发生置换', 'Displacement can occur without external current'),
    s('表面清洁改变镀层分布', 'Cleanliness changes coating distribution'),
  ];
  const heading =
    v === 4 || v === 5
      ? names[v]
      : v === 2 && !paperWet
        ? s('阳极产气，干试纸不显蓝', 'Anode gas; dry paper does not turn blue')
        : kind === 'plating' && !on
          ? s('外电路断开：仍可能局部置换', 'Open circuit: local displacement remains possible')
          : v === 7 && rev
            ? s('铁阳极溶解，溶液中的铜减少', 'Iron dissolves; bath copper decreases')
            : kind === 'plating' && v >= 6 && v <= 9
              ? rev
                ? s('铁接正极，铜接负极', 'Iron positive, copper negative')
                : v === 7
                  ? names[7]
                  : names[6]
              : names[v];
  const selectView = (next: number) => {
    setView(next);
    setClosed(next !== 9);
    setReverse(next === 8);
    setWet(true);
    setClean(true);
  };
  const tx = (x: number, y: number, t: string, anchor: 'middle' | 'start' | 'end' = 'middle') => (
    <text x={x} y={y} textAnchor={anchor}>
      {t}
    </text>
  );
  const wire = (side: 'left' | 'right') => {
    const x = side === 'left' ? left : right,
      negative = side === 'left' ? !rev : rev,
      terminal = cx + (negative ? -24 : 24),
      height = rev ? (side === 'left' ? 83 : 105) : 95;
    const pts = [
        { x, y: 143 },
        { x, y: height },
        { x: terminal, y: height },
        { x: terminal, y: 71 },
      ],
      path = pts.map((a, i) => `${i ? 'L' : 'M'}${a.x} ${a.y}`).join(' ');
    return (
      <g>
        <path d={path} stroke="#f7f7ef" strokeWidth="7" fill="none" />
        <path d={path} stroke={negative ? '#628a91' : '#b17c63'} strokeWidth="3" fill="none" />
        {on &&
          a.I > 0 &&
          [0, 1, 2].map((i) => {
            const pos = polylinePoint(negative ? [...pts].reverse() : pts, (q * 3 + i / 3) % 1);
            return <circle key={i} cx={pos.x} cy={pos.y} r="3" fill="#efdf9b" stroke="#8f8059" />;
          })}
      </g>
    );
  };
  const cell = () => (
    <>
      <rect x={cx - 45} y="24" width="90" height="47" rx="13" fill="#e4e8dd" stroke="#b2c3b4" />
      {tx(cx, 45, kind === 'plating' ? '2.5 V' : 'DC')}
      {tx(cx - 24, 65, '−')}
      {tx(cx + 24, 65, '+')}
      {wire('left')}
      {wire('right')}
      {!on && (
        <>
          <path d={`M${left - 3} 110h6v16h-6Z`} fill="#f7f8ef" />
          {tx(cx, 120, s('外电路断开', 'Circuit open'))}
        </>
      )}
      {kind === 'chloride' ? (
        <>
          <defs>
            <clipPath id={`${uid}-water`}>
              <rect x="0" y="183" width={w} height="130" />
            </clipPath>
          </defs>
          <path
            d={`M${left} 150V250A30 30 0 0 0 ${left + 30} 280H${right - 30}A30 30 0 0 0 ${right} 250V150`}
            fill="none"
            stroke="#a8c0b9"
            strokeWidth="44"
          />
          <path
            d={`M${left} 150V250A30 30 0 0 0 ${left + 30} 280H${right - 30}A30 30 0 0 0 ${right} 250V150`}
            fill="none"
            stroke="#edf4e9"
            strokeWidth="40"
          />
          <path
            d={`M${left} 150V250A30 30 0 0 0 ${left + 30} 280H${right - 30}A30 30 0 0 0 ${right} 250V150`}
            clipPath={`url(#${uid}-water)`}
            fill="none"
            stroke="#b9d8c9"
            strokeWidth="38"
          />
          {[left, right].map((x) => (
            <rect key={x} x={x - 6} y="143" width="12" height="112" rx="3" fill="#515f5c" />
          ))}
          <path
            d={`M${left - 6} 183V252Q${left} 258 ${left + 6} 252V183`}
            fill="none"
            stroke="#b66e4c"
            strokeWidth="2"
            opacity={clamp(a.depositMass / 0.02)}
          />
          {v === 1 &&
            on &&
            Array.from({ length: 8 }, (_, i) => {
              const c = i < 4,
                phase = (q * 1.2 + (i % 4) / 4) % 1,
                pos = uChannelPoint(c ? 1 - phase : phase, w);
              return (
                <g key={i}>
                  <circle cx={pos.x} cy={pos.y} r="3" fill={c ? '#679f9a' : '#d2b25d'} />
                </g>
              );
            })}
          {v !== 1 &&
            a.chlorine > 0 &&
            Array.from({ length: 6 }, (_, i) => {
              const phase = (q - i * 0.09) / 0.36,
                pos = chlorinePath(phase, w);
              return phase >= 0 && phase <= 1 ? (
                <circle
                  key={i}
                  cx={pos.x}
                  cy={pos.y}
                  r={pos.water ? 3 : 2.5}
                  fill={pos.water ? '#eef2d4' : '#c6cc92'}
                  stroke="#a5b88f"
                />
              ) : null;
            })}
          <rect
            x={right + 14}
            y="132"
            width="24"
            height="14"
            rx="2"
            fill={paperWet && q > 0.36 && a.chlorine > 0 ? '#626a9a' : '#ece4c6'}
            stroke="#b7b49a"
          />
          {tx(
            cx,
            321,
            v === 1
              ? 'Cu²⁺ ← · Cl⁻ →'
              : s(
                  paperWet ? '25% CuCl₂ · 湿 KI–淀粉' : '25% CuCl₂ · 干 KI–淀粉',
                  paperWet ? '25% CuCl₂ · moist KI–starch' : '25% CuCl₂ · dry KI–starch',
                ),
          )}
        </>
      ) : (
        <>
          <path
            d={`M${cx - 91} 155V276Q${cx - 91} 289 ${cx - 78} 289H${cx + 78}Q${cx + 91} 289 ${cx + 91} 276V155`}
            fill="#eff5e9"
            stroke="#a6beb4"
            strokeWidth="2"
          />
          <path
            d={`M${cx - 88} 183V275Q${cx - 88} 286 ${cx - 76} 286H${cx + 76}Q${cx + 88} 286 ${cx + 88} 275V183Z`}
            fill="#bfd9d6"
          />
          <rect
            x={left - 12}
            y="143"
            width="24"
            height="112"
            rx="3"
            fill="#a4afa6"
            stroke="#7f948b"
          />
          <rect
            x={right - 12}
            y="143"
            width="24"
            height="112"
            rx="3"
            fill="#bc835d"
            stroke="#a16b4f"
          />
          <path
            d={`M${(on && rev ? right : left) - 12} 183V253H${(on && rev ? right : left) + 12}V183`}
            stroke="#b9754d"
            strokeWidth="3"
            fill="none"
            opacity={clamp((a.depositMass + a.cementedMass) / 0.02)}
          />
          {on &&
            Array.from({ length: 6 }, (_, i) => {
              const ph = (q * 1.5 + i / 6) % 1;
              return (
                <circle
                  key={i}
                  cx={rev ? left + 16 + 88 * ph : right - 16 - 88 * ph}
                  cy={206 + (i % 3) * 20}
                  r="3"
                  fill={rev && i < 3 ? '#8d9f75' : '#679f9a'}
                />
              );
            })}
          {a.cementation > 0 &&
            Array.from({ length: 9 }, (_, i) => (
              <circle key={i} cx={left + 12} cy={190 + i * 7} r={1.2 + 1.5 * q} fill="#a66a48" />
            ))}
          {tx(left, 134, !on ? 'Fe' : rev ? 'Fe +' : 'Fe −')}
          {tx(right, 134, !on ? 'Cu' : rev ? 'Cu −' : 'Cu +')}
          <path d={`M${left} 270v6m0-3H${right}m0-3v6`} stroke="#899f93" />
          {tx(cx, 266, '5 cm')}
          {tx(
            cx,
            321,
            !on
              ? s('Fe + Cu²⁺ → Fe²⁺ + Cu', 'Fe + Cu²⁺ → Fe²⁺ + Cu')
              : `I ${a.I.toFixed(2)} A · t ${Math.round(t)} s`,
          )}
        </>
      )}
    </>
  );
  const preparation = () => {
    const prep = electrodePreparation(q, v === 5),
      gap = Math.min(60, w * 0.235),
      x = cx - gap + 2 * gap * prep.x;
    return (
      <>
        {[0, 1].map((i) => {
          const bx = cx + (i ? gap : -gap);
          return (
            <g key={i}>
              <path
                d={`M${bx - 36} 150V260Q${bx - 36} 274 ${bx - 23} 274H${bx + 23}Q${bx + 36} 274 ${bx + 36} 260V150`}
                fill="#f0f4e9"
                stroke="#afc0b2"
                strokeWidth="2"
              />
              <path
                d={`M${bx - 34} 180V260Q${bx - 34} 272 ${bx - 23} 272H${bx + 23}Q${bx + 34} 272 ${bx + 34} 260V180Z`}
                fill={i ? '#d9e8df' : '#e0dfc6'}
              />
              {tx(bx, 302, i ? s('蒸馏水', 'Distilled water') : v === 5 ? '20% HCl' : '1 M NaOH')}
            </g>
          );
        })}
        <rect x={x - 14} y={prep.y} width="28" height="80" rx="4" fill="#a1ada6" stroke="#7d9288" />
        {Array.from({ length: 10 }, (_, i) => (
          <g key={i}>
            <circle
              cx={x - 9 + (i % 3) * 9}
              cy={prep.y + 10 + Math.floor(i / 3) * 17}
              r="3"
              fill="#9d6f4f"
              opacity={prep.oxide}
            />
            <circle
              cx={x - 6 + (i % 2) * 12}
              cy={prep.y + 13 + Math.floor(i / 2) * 13}
              r="4"
              fill="#777b51"
              opacity={prep.oil * 0.6}
            />
          </g>
        ))}
        {v === 4 && q < 0.3 && (
          <rect
            x={x + 10}
            y={prep.y + 18 + 10 * Math.sin(q * 90)}
            width="25"
            height="45"
            rx="3"
            fill="#ac9779"
            stroke="#8b8168"
          />
        )}
        {tx(
          cx,
          26,
          v === 5
            ? s('除锈 → 水洗', 'Rust removal → rinse')
            : s('打磨 → 除油 → 水洗', 'Abrade → degrease → rinse'),
        )}
        {tx(
          cx,
          327,
          prep.rinse > 0
            ? s('同一铁件，单独水洗', 'Same iron piece; separate rinse')
            : s('取出后才横向移入另一杯', 'Lift clear before transfer'),
        )}
      </>
    );
  };
  const coating = () => {
    const multi = v === 10,
      rows = multi ? [true, false] : [f.watch ? true : clean];
    return (
      <>
        {tx(cx, 27, `Q ${a.Q.toFixed(1)} C · Cu ${(a.depositMass * 1000).toFixed(1)} mg`)}
        {rows.map((isClean, row) => {
          const b = surfacePlating(t, I, isClean, kind, on, rev),
            y = multi ? 109 + row * 144 : 185,
            scale = multi ? 2 : 2.5,
            start = cx - Math.min(100, w * 0.42),
            width = 2 * Math.min(100, w * 0.42),
            unit = width / 24;
          return (
            <g key={row}>
              {tx(
                cx,
                y - 55,
                multi
                  ? isClean
                    ? s('清洁表面', 'Clean surface')
                    : s('部分被油污遮挡', 'Partly oil-masked')
                  : s('镀层厚度放大剖面', 'Magnified coating section'),
              )}
              <rect x={start} y={y} width={width} height={multi ? 20 : 29} rx="3" fill="#a5b3a8" />
              {b.cells.map((c) => (
                <g key={c.id}>
                  <rect
                    x={start + c.id * unit}
                    y={y - c.thicknessUm * scale}
                    width={unit + 0.1}
                    height={c.thicknessUm * scale}
                    fill="#bd865c"
                  />
                  {!c.active && (
                    <rect
                      x={start + c.id * unit}
                      y={y - 4}
                      width={unit}
                      height="4"
                      fill="#75794f"
                    />
                  )}
                </g>
              ))}
              {tx(
                cx,
                y + (multi ? 44 : 53),
                `${b.cells.find((c) => c.active)!.thicknessUm.toFixed(2)} μm`,
              )}
            </g>
          );
        })}
        {v === 3 && tx(cx, 300, `n(Cu) = n(Cl₂) = ${(a.extent * 1000).toFixed(3)} mmol`)}
        {v === 7 && (
          <>
            {tx(
              cx,
              280,
              !on
                ? s(
                    `局部置换 Cu ${(a.cementedMass * 1000).toFixed(1)} mg`,
                    `Local Cu: ${(a.cementedMass * 1000).toFixed(1)} mg`,
                  )
                : rev
                  ? `Fe: −${(a.anodeFe * 55.845 * 1000).toFixed(1)} mg`
                  : `Cu anode: −${(a.anodeCu * 63.546 * 1000).toFixed(1)} mg`,
            )}
            {tx(
              cx,
              309,
              on && !rev
                ? s('溶液总铜保持不变', 'Total bath copper unchanged')
                : s(
                    `溶液铜减少 ${((a.initialCu - a.copperInSolution) * 1000).toFixed(3)} mmol`,
                    `Bath Cu: −${((a.initialCu - a.copperInSolution) * 1000).toFixed(3)} mmol`,
                  ),
            )}
          </>
        )}
      </>
    );
  };
  return (
    <div className="chem-electrolysis" ref={host}>
      <div className="chem-electrolysis-head">{heading}</div>
      <svg viewBox={`0 0 ${w} 342`} role="img" aria-label={heading}>
        {v === 4 || v === 5 ? preparation() : v === 3 || v === 7 || v === 10 ? coating() : cell()}
      </svg>
      {!f.watch && (
        <div className="chem-electrolysis-controls">
          <label>
            {s('观察环节', 'Observation')}
            <select value={view} onChange={(e) => selectView(+e.target.value)}>
              {names.map((n, i) => (
                <option key={n} value={i}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            {s('过程', 'Progress')}
            <input
              type="range"
              min="0"
              max="1"
              step=".001"
              value={progress}
              onChange={(e) => setProgress(+e.target.value)}
            />
          </label>
          {v !== 4 && v !== 5 && (
            <>
              <label>
                {s('观测或设定的平均电流', 'Observed or assumed mean current')} {current.toFixed(2)}{' '}
                A
                <input
                  type="range"
                  min="0.05"
                  max="0.4"
                  step=".01"
                  value={current}
                  onChange={(e) => setCurrent(+e.target.value)}
                />
              </label>
              <div className="chem-electrolysis-buttons">
                {[
                  [closed, setClosed, s('电路闭合', 'Circuit closed')],
                  ...(kind === 'plating'
                    ? [[reverse, setReverse, s('电镀反接', 'Reverse plating')]]
                    : []),
                  ...(kind === 'chloride' ? [[wet, setWet, s('试纸湿润', 'Moist paper')]] : []),
                  ...(v === 3 || v === 7
                    ? [[clean, setClean, s('清洁表面', 'Clean surface')]]
                    : []),
                ].map(([val, set, label]) => (
                  <button
                    key={String(label)}
                    aria-pressed={Boolean(val)}
                    onClick={() => (set as (v: boolean) => void)(!val)}
                  >
                    {String(label)}
                  </button>
                ))}
              </div>
            </>
          )}
          <p>
            {s(
              '电流是输入条件，不由 2.5 V 自动推算。液体中的点表示离子迁移方向；导线中的亮点表示电子流方向，不代表逐个计数。',
              'Current is an input, not inferred from 2.5 V. Liquid markers indicate ionic migration; wire markers indicate electron flow, rather than counting particles.',
            )}
          </p>
          <details>
            <summary>{s('数量模型与实验边界', 'Quantitative model and limits')}</summary>
            <p>
              {s(
                '理想电量效率 100%；25% CuCl₂ 另取 20 g 溶液。电镀另定总铜浓度 0.2 M、50 mL，不计算氨络合与过电位。断路铁片置换速率、氯的水相/逸出分配和表面屏蔽是示意。干试纸不显蓝不能否定氯气生成。',
                'Ideal current efficiency is 100%. The 25% CuCl₂ calculation additionally assumes 20 g of solution. Plating assumes 50 mL at 0.2 M total copper, without ammonia speciation or overpotentials. Open-circuit displacement rate, chlorine partition and surface masking are illustrative. Dry paper failing to turn blue does not exclude chlorine production.',
              )}
            </p>
          </details>
          <label>
            {s('自己的观察记录（初始为空）', 'Your observations (initially blank)')}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={s('条件、时间、观察结果……', 'Conditions, time, observations…')}
            />
          </label>
        </div>
      )}
    </div>
  );
}
