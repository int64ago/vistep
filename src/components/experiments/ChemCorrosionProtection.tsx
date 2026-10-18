import { useId, useMemo, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  corrosionClamp as clamp,
  oxygenColumn,
  zincAcid,
  protectionState,
  sampleTransfer,
  gelZones,
  warmerModel,
} from '../../models/chem-corrosion-protection';
import '../../styles/chem-corrosion-protection.css';
export default function ChemCorrosionProtection() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    cx = w / 2,
    id = useId().replaceAll(':', ''),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const [view, setView] = useState(
      f.variant === 'chem-elective-1-practice-p116'
        ? 9
        : f.variant === 'chem-elective-1-experiment-4-4'
          ? 3
          : 0,
    ),
    [progress, setProgress] = useState(0.7),
    [wet, setWet] = useState(true),
    [leak, setLeak] = useState(false),
    [contact, setContact] = useState(true),
    [iron, setIron] = useState(5),
    [water, setWater] = useState(3),
    [air, setAir] = useState(1),
    [salt, setSalt] = useState(true),
    [carbon, setCarbon] = useState(true),
    [loss, setLoss] = useState(0.08),
    [notes, setNotes] = useState('');
  const v = f.watch ? f.chapter : view,
    p = clamp(f.watch ? f.chapterProgress : progress),
    q = clamp(p / 0.9),
    moist = f.watch || !(v === 0 || (v >= 6 && v < 9)) ? true : wet,
    joined = f.watch ? true : contact;
  const opts = f.watch
      ? { iron: 5, water: 3, air: 1, salt: true, carbon: true, loss: 0.08 }
      : { iron, water, air, salt, carbon, loss },
    warm = warmerModel((v < 10 ? 0 : v === 10 ? clamp((p - 0.2) / 0.7) : q) * 3600, opts),
    full = useMemo(
      () => warmerModel(3600, opts),
      [opts.iron, opts.water, opts.air, opts.salt, opts.carbon, opts.loss],
    );
  const names = [
    s('耗氧让水柱上升', 'Oxygen uptake lifts the water column'),
    s('两组锌先在相同酸中', 'Two zinc samples start in equal acid'),
    s('铜沉积后，析氢加快', 'Copper deposition accelerates hydrogen release'),
    s('锌供电子，铁受保护', 'Zinc supplies electrons and protects iron'),
    s('从铁附近取样检验', 'Test an aliquot from near the iron'),
    s('制备凝胶观察环境', 'Prepare the gel observation medium'),
    s('裹锌铁钉：阴极附近变粉红', 'Zinc-wrapped nail: pink at cathodic regions'),
    s('缠铜铁钉：铁附近出现蓝色', 'Copper-wrapped nail: blue near the iron'),
    s('金属接触也是必要条件', 'Metallic contact also matters'),
    s('暖贴研究：先确定变量', 'Warmer research starts with variables'),
    s('透气内袋让氧进入', 'Oxygen enters the permeable inner pouch'),
    s('温升取决于放热与散热', 'Temperature follows heating and heat loss'),
    s('保留缺氧与缺水对照', 'Keep oxygen-limited and dry controls'),
  ];
  const heading = f.watch
    ? names[v]
    : v === 0 && !moist
      ? leak
        ? s('干燥且漏气的对照', 'Dry and leaking control')
        : s('干燥对照：水柱保持原位', 'Dry control: unchanged water level')
      : v === 0 && leak
        ? s('漏气对照：水柱不持续升高', 'Leaking control: no sustained rise')
        : (v === 3 || v === 4) && !joined
          ? v === 3
            ? s('仅 Fe 对照：无锌保护', 'Iron-only control: no zinc protection')
            : s('仅 Fe 对照：检验 Fe²⁺', 'Iron-only control: test for Fe²⁺')
          : v >= 6 && v < 9 && !moist
            ? s('干燥对照：未形成指示剂色区', 'Dry control: no indicator zones')
            : v >= 6 && v < 9 && !joined
              ? s('金属分离：观察铁自身腐蚀', 'Separated metals: observe iron corrosion')
              : names[v];
  const tx = (x: number, y: number, t: string, a: 'middle' | 'start' | 'end' = 'middle') => (
    <text x={x} y={y} textAnchor={a}>
      {t}
    </text>
  );
  const tube = (x: number, level: number, color = '#dee8d9') => (
    <>
      <path
        d={`M${x - 20} 115V264Q${x - 20} 282 ${x} 282Q${x + 20} 282 ${x + 20} 264V115`}
        fill="#f3f6eb"
        stroke="#a8beb1"
        strokeWidth="2"
      />
      <path
        d={`M${x - 18} ${level}V264Q${x - 18} 280 ${x} 280Q${x + 18} 280 ${x + 18} 264V${level}Z`}
        fill={color}
      />
    </>
  );
  const nail = (x: number, y: number, length = 100) => (
    <g>
      <path
        d={`M${x - length / 2} ${y - 4}H${x + length / 2 - 10}L${x + length / 2} ${y}L${x + length / 2 - 10} ${y + 4}H${x - length / 2}Z`}
        fill="#9aa9a3"
        stroke="#788f84"
      />
      <path
        d={`M${x - length / 2} ${y - 9}V${y + 9}`}
        stroke="#7c9387"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </g>
  );
  const column = () => {
    const a = oxygenColumn(q * 600, moist, f.watch ? false : leak),
      x = cx - 64,
      pipe = cx + 68,
      level = 240 - a.riseMm,
      bath = 240 + a.fallMm;
    return (
      <>
        <path
          d={`M${x - 21} 85V258Q${x - 21} 280 ${x} 280Q${x + 21} 280 ${x + 21} 258V85Z`}
          fill="#edf2e5"
          stroke="#a8bdb1"
          strokeWidth="2"
        />
        <rect x={x - 23} y="77" width="46" height="16" rx="4" fill="#b7ae8b" />
        <path
          d={`M${x + 20} 116H${pipe - 10}Q${pipe} 116 ${pipe} 126V287`}
          fill="none"
          stroke="#a2bcb2"
          strokeWidth="7"
        />
        <path
          d={`M${x + 20} 116H${pipe - 10}Q${pipe} 116 ${pipe} 126V287`}
          fill="none"
          stroke="#f1f5e9"
          strokeWidth="3"
        />
        <path
          d={`M${pipe - 34} 224V292Q${pipe - 34} 300 ${pipe - 26} 300H${pipe + 26}Q${pipe + 34} 300 ${pipe + 34} 292V224`}
          fill="none"
          stroke="#aac0b2"
          strokeWidth="2"
        />
        <path
          d={`M${pipe - 32} ${bath}V292Q${pipe - 32} 298 ${pipe - 26} 298H${pipe + 26}Q${pipe + 32} 298 ${pipe + 32} 292V${bath}Z`}
          fill="#ccdfd0"
        />
        <path d={`M${pipe} ${level}V287`} stroke="#8fb7aa" strokeWidth="3" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${x - 9 + i * 8} 265) rotate(${i % 2 ? 8 : -6})`}>
            <path
              d="M0 0V-65m-4 0h8"
              fill="none"
              stroke={moist ? '#7a9a8d' : '#869487'}
              strokeWidth="4"
            />
            {moist && <path d="M3-63V-2" stroke="#bbd4c1" strokeWidth="1" />}
          </g>
        ))}
        {moist &&
          [0, 1, 2].map((i) => {
            const ph = clamp((q - i * 0.2) / 0.3);
            return ph < 1 ? (
              <circle key={i} cx={x + (-1 + i) * 7} cy={145 + 50 * ph} r="3" fill="#b5c9aa" />
            ) : null;
          })}
        {tx(x, 49, '50 mL')}
        {tx(pipe, 49, `${a.riseMm.toFixed(1)} mm`)}
        {tx(cx, 322, `O₂ ${(a.usedOxygen * 1e6).toFixed(1)} μmol ↓`)}
        <path d={`M${pipe + 12} ${level}h8m-4 0V${bath}m-4 0h8`} stroke="#7e9c8b" />
      </>
    );
  };
  const zinc = () => {
    const time = v === 1 ? q * 110 : 100 + q * 500;
    return (
      <>
        {[false, true].map((cu, i) => {
          const x = cx + (i ? 1 : -1) * Math.min(61, w * 0.25),
            a = zincAcid(time, cu && v === 2),
            copper = a.copper / 1e-5;
          return (
            <g key={i}>
              {tx(x, 30, i && v === 2 ? '+ CuSO₄' : s('Zn + 稀 HCl', 'Zn + HCl'))}
              {tube(x, 190 - (a.volumeMl - 5) * 18)}
              {[0, 1].map((j) => (
                <g key={j}>
                  <ellipse
                    cx={x + (j ? 8 : -8)}
                    cy={260 + j * 5}
                    rx="8"
                    ry="6"
                    fill="#a1aea1"
                    stroke="#889c8b"
                  />
                  <path
                    d={`M${x + (j ? 8 : -8) - 5} ${256 + j * 5}l6-1 3 2`}
                    stroke="#b77e54"
                    strokeWidth="3"
                    opacity={copper}
                  />
                </g>
              ))}
              {Array.from({ length: Math.max(2, Math.round(a.rate * 1e6 * 2)) }, (_, j) => {
                const phase = (q * 4 + j * 0.163) % 1;
                return (
                  <circle
                    key={j}
                    cx={x + (j % 2 ? 9 : -9)}
                    cy={253 - phase * 125}
                    r="2.5"
                    fill="#f1f4df"
                    stroke="#9bb59d"
                  />
                );
              })}
              {cu &&
                v === 2 &&
                [120, 130].map((arrival, j) => {
                  const ph = (time - (arrival - 10)) / 10;
                  return ph >= 0 && ph < 1 ? (
                    <g key={arrival}>
                      <path
                        d={`M${x - 4} 60V94L${x} 106L${x + 4} 94V60`}
                        fill="#e6eee5"
                        stroke="#a7beb1"
                      />
                      <circle cx={x} cy={108 + ph * 82} r="3" fill="#79a9ac" />
                    </g>
                  ) : null;
                })}
              {tx(x, 310, `${(a.hydrogen * 1000).toFixed(3)} mmol`)}
            </g>
          );
        })}
        {tx(cx, 334, s('H₂ · 示意动力学', 'H₂ · illustrative kinetics'))}
      </>
    );
  };
  const protection = (sampling = false) => {
    const trial = sampling ? (p < 0.5 ? 0 : 1) : 0,
      local = sampling ? clamp((p < 0.5 ? p : p - 0.5) / 0.5 / 0.92) : q,
      protectedIron = f.watch ? trial === 0 : joined,
      a = protectionState(sampling ? 600 : q * 600, protectedIron, moist),
      left = sampling ? cx - 53 : cx,
      fe = left - 25,
      zn = left + 25,
      tr = sampleTransfer(local),
      tipX = fe + (cx + 73 - fe) * tr.x,
      sampleX = cx + 73,
      liquidTop = 190 + (sampling ? 50 - tr.sourceMl : 0) * 1.5;
    return (
      <>
        {tx(
          cx,
          26,
          sampling
            ? protectedIron
              ? s('独立试验：Fe—Zn', 'Separate trial: Fe—Zn')
              : s('独立试验：仅 Fe', 'Separate trial: iron only')
            : s('酸化的 3% NaCl', 'Acidified 3% NaCl'),
        )}
        <path
          d={`M${left - 53} 140V264Q${left - 53} 280 ${left - 38} 280H${left + 38}Q${left + 53} 280 ${left + 53} 264V140`}
          fill="#f1f5e8"
          stroke="#a9bfb0"
          strokeWidth="2"
        />
        <path
          d={`M${left - 51} ${liquidTop}V264Q${left - 51} 278 ${left - 38} 278H${left + 38}Q${left + 51} 278 ${left + 51} 264V${liquidTop}Z`}
          fill="#d9e3ce"
        />
        <rect x={fe - 7} y="130" width="14" height="120" rx="2" fill="#96aaa0" />
        {tx(fe, 121, 'Fe')}
        {protectedIron && (
          <>
            <rect x={zn - 7} y="130" width="14" height="120" rx="2" fill="#bcc7ac" />
            {tx(zn, 121, 'Zn')}
            <path d={`M${fe} 130V64H${zn}V130`} fill="none" stroke="#7f9c87" strokeWidth="2.5" />
            {!sampling && (
              <>
                <circle cx={left} cy="64" r="23" fill="#e9edda" stroke="#acbba2" />
                <path d={`M${left} 74l${a.I ? 14 : -12} -20`} stroke="#9c8f63" strokeWidth="2" />
                {tx(left, 58, 'A')}
              </>
            )}
            {!sampling &&
              a.I > 0 &&
              [0, 1].map((i) => (
                <circle
                  key={i}
                  cx={zn - 50 * ((q * 3 + i * 0.5) % 1)}
                  cy="64"
                  r="3"
                  fill="#e4cc8b"
                />
              ))}
          </>
        )}
        {!sampling &&
          moist &&
          [0, 1, 2].map((i) => {
            const phase = (q * 3 + i / 3) % 1,
              surfaceCenter = liquidTop + 3.5;
            return (
              <circle
                key={i}
                data-process="hydrogen-bubble"
                cx={fe + 10}
                cy={244 - (244 - surfaceCenter) * phase}
                r="3"
                fill="#eef0d9"
                stroke="#abc1a3"
                opacity={clamp(phase / 0.08) * clamp((1 - phase) / 0.16)}
              />
            );
          })}
        {sampling && (
          <>
            {tube(
              sampleX,
              280 - 16 * (tr.sampleMl + tr.reagentMl),
              tr.reagentDrops ? (a.ironLost > 0 ? '#7886ac' : '#e1dfba') : '#dee8d9',
            )}
            {local < 0.64 && (
              <path
                d={`M${tipX - 5} ${tr.tipY - 54}V${tr.tipY - 12}L${tipX} ${tr.tipY}L${tipX + 5} ${tr.tipY - 12}V${tr.tipY - 54}`}
                fill="#e9eee0"
                stroke="#a9bfad"
                strokeWidth="1.5"
              />
            )}
            {tr.pipetteMl > 0 && (
              <path
                d={`M${tipX} ${tr.tipY - 14}V${tr.tipY - 14 - 26 * tr.pipetteMl}`}
                stroke="#abc4ae"
                strokeWidth="6"
              />
            )}
            {local > 0.5 && local < 0.62 && (
              <path
                d={`M${sampleX} ${tr.tipY}V${280 - 16 * tr.sampleMl}`}
                stroke="#afc9b5"
                strokeWidth="2"
              />
            )}
            {[0.72, 0.84].map((end) => {
              const d = (local - end + 0.07) / 0.07;
              return d >= 0 && d < 1 ? (
                <g key={end}>
                  <path
                    d={`M${sampleX - 4} 52V82L${sampleX} 94L${sampleX + 4} 82V52`}
                    fill="#e5e7ce"
                    stroke="#b5bda2"
                  />
                  <circle
                    cx={sampleX}
                    cy={96 + d * (280 - 16 * tr.sampleMl - 96)}
                    r="3"
                    fill="#c6bd7b"
                  />
                </g>
              ) : null;
            })}
            {tx(sampleX, 310, `${(tr.sampleMl + tr.reagentMl).toFixed(1)} mL`)}
            {tx(cx, 336, s('K₃[Fe(CN)₆] · 2 滴', 'K₃[Fe(CN)₆] · 2 drops'))}
          </>
        )}
        {!sampling && (
          <>
            {tx(
              cx,
              310,
              protectedIron
                ? s('Zn 氧化 · Fe 表面还原', 'Zn oxidation · reduction at Fe')
                : s('Fe 氧化 · H⁺ 还原', 'Fe oxidation · H⁺ reduction'),
            )}
            {tx(
              cx,
              334,
              protectedIron
                ? s('同一溶液 + 金属连接', 'Electrolyte + metal contact')
                : s('无锌保护', 'No zinc protection'),
            )}
          </>
        )}
      </>
    );
  };
  const agar = () => {
    const boil = p > 0.25 && p < 0.65,
      dissolve = clamp((p - 0.25) / 0.25);
    return (
      <>
        {tx(cx, 24, s('1 g 琼脂 · 200 mL 混合液', '1 g agar · 200 mL mixture'))}
        <path
          d={`M${cx - 62} 101V258Q${cx - 62} 272 ${cx - 48} 272H${cx + 48}Q${cx + 62} 272 ${cx + 62} 258V101`}
          fill="#f1f5e9"
          stroke="#a6bdac"
          strokeWidth="2"
        />
        <path
          d={`M${cx - 60} 165V258Q${cx - 60} 270 ${cx - 48} 270H${cx + 48}Q${cx + 60} 270 ${cx + 60} 258V165Z`}
          fill="#d7dfc4"
        />
        <path
          d={`M${cx - 30} 80L${cx + 15 + Math.sin(q * 20) * 8} 240`}
          stroke="#9ab4a3"
          strokeWidth="5"
        />
        {Array.from({ length: 9 }, (_, i) => {
          const ph = clamp((p - i * 0.015) / 0.2);
          return (
            <circle
              key={i}
              cx={cx + 25 + (i % 3) * 7}
              cy={90 + 110 * ph + (i % 3) * 7}
              r="3"
              fill="#e1d7b4"
              opacity={1 - dissolve}
            />
          );
        })}
        {boil &&
          Array.from({ length: 7 }, (_, i) => (
            <circle
              key={i}
              cx={cx - 40 + i * 12}
              cy={250 - 80 * ((q * 6 + i / 7) % 1)}
              r="3"
              fill="#edf1d7"
              stroke="#b5c3a3"
            />
          ))}
        <rect
          x={cx - 63}
          y="275"
          width="126"
          height="20"
          rx="7"
          fill={boil ? '#d1a373' : '#b7c2a6'}
        />
        {tx(
          cx,
          325,
          p < 0.65
            ? s('搅拌、加热溶解', 'Stir and heat to dissolve')
            : s('稍冷后分装，加指示剂', 'Cool slightly; portion and add indicators'),
        )}
      </>
    );
  };
  const gel = () => {
    const metal = v === 7 ? 'copper' : 'zinc',
      touch = v === 8 ? (f.watch ? p >= 0.5 : joined) : joined,
      gp = v === 8 ? clamp((p < 0.5 ? p : p - 0.5) / 0.42) : q,
      a = gelZones(metal, touch, moist, gp),
      cy = 174,
      r = Math.min(101, w * 0.43),
      yMetal = touch ? cy : cy - 38;
    return (
      <>
        <defs>
          <clipPath id={`${id}-dish`}>
            <circle cx={cx} cy={cy} r={r - 4} />
          </clipPath>
          <radialGradient id={`${id}-blue`}>
            <stop stopColor="#5279b1" stopOpacity=".9" />
            <stop offset=".4" stopColor="#5279b1" stopOpacity=".65" />
            <stop offset="1" stopColor="#5279b1" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-pink`}>
            <stop stopColor="#d17c9f" stopOpacity=".95" />
            <stop offset=".4" stopColor="#d17c9f" stopOpacity=".7" />
            <stop offset="1" stopColor="#d17c9f" stopOpacity="0" />
          </radialGradient>
        </defs>
        {tx(
          cx,
          28,
          metal === 'copper'
            ? touch
              ? s('Fe 接触 Cu', 'Fe touching Cu')
              : s('Fe 与 Cu 分离', 'Fe separated from Cu')
            : touch
              ? s('Fe 接触 Zn', 'Fe touching Zn')
              : s('Fe 与 Zn 分离', 'Fe separated from Zn'),
        )}
        {tx(cx, 52, s('已加入两种指示剂的凝胶', 'Gel containing both indicators'))}
        <circle cx={cx} cy={cy} r={r} fill="#edf0dc" stroke="#abbda2" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={r - 5} fill="#e1e7c8" />
        <g clipPath={`url(#${id}-dish)`}>
          {a.blueSites.map((x) => (
            <ellipse
              key={`b${x}`}
              cx={cx + x}
              cy={cy}
              rx={a.radius * 1.4}
              ry={a.radius}
              fill={`url(#${id}-blue)`}
              opacity={a.blue}
            />
          ))}
          {a.pinkSites.map((x) => (
            <ellipse
              key={`p${x}`}
              cx={cx + x}
              cy={cy}
              rx={a.radius * 1.35}
              ry={a.radius}
              fill={`url(#${id}-pink)`}
              opacity={a.pink}
            />
          ))}
        </g>
        {nail(cx, cy, 118)}
        {metal === 'zinc' ? (
          <rect
            x={cx - 11}
            y={yMetal - 9}
            width="22"
            height="18"
            rx="2"
            fill="#bdc6a6"
            stroke="#8f9f85"
          />
        ) : (
          <path
            d={`M${cx - 13} ${yMetal - 8}q7 0 6 16m1-16q7 0 6 16m1-16q7 0 6 16m1-16q7 0 6 16`}
            fill="none"
            stroke="#b5825f"
            strokeWidth="3"
          />
        )}
        {touch &&
          moist &&
          [0, 1].map((i) => {
            const ph = (gp * 3 + i * 0.5) % 1,
              x =
                metal === 'zinc'
                  ? cx + (i ? -1 : 1) * (12 + 40 * ph)
                  : cx + (i ? -1 : 1) * (52 - 40 * ph);
            return <circle key={i} cx={x} cy={cy} r="2.5" fill="#e7d390" />;
          })}
        {tx(cx, 304, s('蓝：Fe²⁺ 证据', 'Blue: Fe²⁺ evidence'))}
        {tx(cx, 328, s('粉红：局部 OH⁻', 'Pink: local OH⁻'))}
      </>
    );
  };
  const recipe = () => {
    const items = [
      ['Fe', `${opts.iron} g`, '#8d9d8a'],
      ['C', opts.carbon ? '2 g' : '0 g', '#6e7766'],
      ['NaCl', opts.salt ? '0.2 g' : '0 g', '#d5d9be'],
      ['H₂O', `${opts.water} mL`, '#b2d0bd'],
      [s('蛭石', 'Vermiculite'), '1 g', '#c1ad81'],
    ];
    return (
      <>
        {items.map(([label, amount, col], i) => {
          const x = cx + (i % 2 ? 1 : -1) * 61,
            y = 35 + Math.floor(i / 2) * 100;
          return (
            <g key={label}>
              <path
                d={`M${x - 40} ${y}v35q0 8 8 8h64q8 0 8-8v-35`}
                fill="#edf1de"
                stroke="#b1bea3"
              />
              {Array.from({ length: amount.startsWith('0 ') ? 0 : 6 }, (_, j) => (
                <circle
                  key={j}
                  cx={x - 27 + (j % 3) * 24}
                  cy={y + 17 + Math.floor(j / 3) * 13}
                  r="5"
                  fill={col}
                />
              ))}
              {tx(x, y - 9, label)}
              {tx(x, y + 61, amount)}
            </g>
          );
        })}
        {tx(cx + 61, 248, s('虚拟配方', 'Virtual formula'))}
        {tx(cx, 328, s('每次只改变一个条件', 'Change one factor per trial'))}
      </>
    );
  };
  const pouch = () => {
    const open = f.watch ? p > 0.15 : opts.air > 0,
      opening = clamp((p - 0.15) / 0.2),
      oxidized = (warm.initialIron - warm.remaining) / Math.max(0.001, warm.initialIron);
    return (
      <>
        {tx(cx, 26, s('内袋剖面 · 示意', 'Inner-pouch section · schematic'))}
        <rect
          x={cx - 91}
          y="113"
          width="182"
          height="147"
          rx="21"
          fill="#e3dcc0"
          stroke="#b2b092"
          strokeWidth="2"
          strokeDasharray="3 4"
        />
        {Array.from({ length: 24 }, (_, i) => (
          <circle
            key={i}
            cx={cx - 71 + (i % 6) * 28}
            cy={136 + Math.floor(i / 6) * 31}
            r="7"
            fill={i / 24 < oxidized ? '#b2835c' : '#859780'}
          />
        ))}
        {Array.from({ length: opts.carbon ? 10 : 0 }, (_, i) => (
          <circle
            key={`c${i}`}
            data-material="carbon"
            cx={cx - 61 + (i % 5) * 31}
            cy={153 + Math.floor(i / 5) * 62}
            r="3"
            fill="#5f6e5b"
          />
        ))}
        <path
          d={`M${cx - 100} ${104 - 70 * opening}H${cx + 100}V${268 - 70 * opening}H${cx - 100}Z`}
          fill="none"
          stroke="#b7c9ad"
          strokeWidth="2"
          opacity={1 - opening}
        />
        {open &&
          [0, 1, 2].map((i) => {
            const ph = clamp((q - 0.2 - i * 0.1) / 0.4);
            return ph < 1 ? (
              <g key={i}>
                <circle cx={cx - 57 + i * 57} cy={61 + 73 * ph} r="4" fill="#a5b99b" />
                <circle cx={cx - 51 + i * 57} cy={61 + 73 * ph} r="4" fill="#a5b99b" />
              </g>
            ) : null;
          })}
        <path d={`M${cx + 72} 174V289`} stroke="#8e9d82" strokeWidth="4" />
        <circle cx={cx + 72} cy="175" r="5" fill="#baa071" />
        {tx(cx, 308, `${warm.temp.toFixed(1)} °C`)}
        {tx(cx, 332, s('模型温度，不是实测', 'Model temperature; not measured'))}
      </>
    );
  };
  const heat = () => {
    const compare = v === 12,
      fulls = compare
        ? [full, warmerModel(3600, { ...opts, air: 0 }), warmerModel(3600, { ...opts, water: 0 })]
        : [full],
      max = Math.max(60, Math.ceil(Math.max(...fulls.map((x) => x.peak)) / 10) * 10),
      x0 = 43,
      x1 = w - 15,
      y0 = 48,
      y1 = 259;
    return (
      <>
        {[25, 40, max].map((temp) => (
          <g key={temp}>
            <path
              d={`M${x0} ${y1 - ((temp - 20) / (max - 20)) * (y1 - y0)}H${x1}`}
              stroke="#d5dfc9"
            />
            {tx(x0 - 8, y1 - ((temp - 20) / (max - 20)) * (y1 - y0) + 5, String(temp), 'end')}
          </g>
        ))}
        <path d={`M${x0} ${y0}V${y1}H${x1}`} stroke="#a4b69c" fill="none" />
        {tx(x0, 24, '°C')}
        {tx(x1, y1 + 24, '60 min', 'end')}
        {fulls.map((a, i) => {
          const pts = a.trace.filter((z) => z.time <= q * 3600),
            col = ['#b0875d', '#7e9b8b', '#b7a8b4'][i];
          return (
            <path
              key={i}
              d={pts
                .map(
                  (z, j) =>
                    `${j ? 'L' : 'M'}${x0 + ((x1 - x0) * z.time) / 3600} ${y1 - ((z.temp - 20) / (max - 20)) * (y1 - y0)}`,
                )
                .join(' ')}
              fill="none"
              stroke={col}
              strokeWidth="2.5"
            />
          );
        })}
        {compare ? (
          <>
            {tx(cx, 307, s('棕：设定 · 绿：封闭', 'Brown: current · green: sealed'))}
            {tx(cx, 331, s('灰紫：无水 · 均为模型', 'Mauve: dry · model trials'))}
          </>
        ) : (
          <>
            {tx(cx, 307, `${warm.temp.toFixed(1)} °C · ${(warm.generated / 1000).toFixed(2)} kJ`)}
            {tx(cx, 331, s('放热 = 储热 + 散热', 'Released heat = stored + lost heat'))}
          </>
        )}
      </>
    );
  };
  return (
    <div className="chem-corrosion" ref={host}>
      <div className="chem-corrosion-head">{heading}</div>
      <svg viewBox={`0 0 ${w} 350`} role="img" aria-label={heading}>
        {v === 0
          ? column()
          : v === 1 || v === 2
            ? zinc()
            : v === 3 || v === 4
              ? protection(v === 4)
              : v === 5
                ? agar()
                : v < 9
                  ? gel()
                  : v === 9
                    ? recipe()
                    : v === 10
                      ? pouch()
                      : heat()}
      </svg>
      {!f.watch && (
        <div className="chem-corrosion-controls">
          <label>
            {s('观察环节', 'Observation')}
            <select value={view} onChange={(e) => setView(+e.target.value)}>
              {names.map((n, i) => (
                <option key={n} value={i}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            {s('进度', 'Progress')}
            <input
              type="range"
              min="0"
              max="1"
              step=".001"
              value={progress}
              onChange={(e) => setProgress(+e.target.value)}
            />
          </label>
          {v < 9 ? (
            <div className="chem-corrosion-buttons">
              {[
                ...(v === 0 || v >= 6 ? [[wet, setWet, s('湿润', 'Moist')]] : []),
                ...(v === 0 ? [[leak, setLeak, s('气路漏气', 'Gas leak')]] : []),
                ...(v === 3 || v === 4 || v >= 6
                  ? [[contact, setContact, s('金属相连', 'Metallic contact')]]
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
          ) : (
            <>
              {[
                [s('铁粉', 'Iron'), iron, setIron, 2, 8, 0.5, 'g'],
                [s('水', 'Water'), water, setWater, 0, 6, 0.5, 'mL'],
                [s('透气系数', 'Air transfer'), air, setAir, 0, 2, 0.1, ''],
                [s('散热系数', 'Heat-loss coefficient'), loss, setLoss, 0.04, 0.2, 0.01, 'W/K'],
              ].map(([label, val, set, min, max, step, unit]) => (
                <label key={String(label)}>
                  {String(label)} {Number(val).toFixed(2)} {String(unit)}
                  <input
                    type="range"
                    min={Number(min)}
                    max={Number(max)}
                    step={Number(step)}
                    value={Number(val)}
                    onChange={(e) => (set as (v: number) => void)(+e.target.value)}
                  />
                </label>
              ))}
              <div className="chem-corrosion-buttons">
                <button aria-pressed={salt} onClick={() => setSalt(!salt)}>
                  {s('含盐', 'Salt present')}
                </button>
                <button aria-pressed={carbon} onClick={() => setCarbon(!carbon)}>
                  {s('含活性炭', 'Activated carbon')}
                </button>
              </div>
            </>
          )}
          <details>
            <summary>{s('实验条件与模型边界', 'Experimental conditions and model limits')}</summary>
            <p>
              {s(
                '水柱计算另设 50 mL 气相、25°C、气密与恒温；耗氧速率仅示意。电极电流与锌的加速动力学是另定教学参数。蓝色对应 Fe²⁺ 与铁氰化钾的检验，粉红对应酚酞附近的碱性；凝胶色团不是浓度测量。暖贴采用集总热容和供氧模型，配方、温度曲线均非实际产品性能。',
                'Manometry additionally assumes a 50 mL headspace at 25°C, sealed and isothermal, with illustrative uptake kinetics. Electrode current and zinc acceleration are assumed teaching parameters. Blue indicates ferrous-ion testing with ferricyanide; pink indicates local alkalinity with phenolphthalein. Gel fields are not concentration measurements. Warmer composition and lumped thermal curves do not predict an actual product.',
              )}
            </p>
          </details>
          <label>
            {s('实验与研究记录（初始为空）', 'Experiment and research record (initially blank)')}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={s(
                '资料来源、配比、控制变量、温度/时间、改进与处置……',
                'Sources, composition, controls, temperature/time, improvements and disposal…',
              )}
            />
          </label>
        </div>
      )}
    </div>
  );
}
