import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { signalPathPoint } from '../../models/bio-chemical-signals';
import {
  cultureClamp as clamp,
  plateGeometry,
  streakState,
  pureCulture,
  dilutionTransfer,
  cfuEstimate,
  colonySites,
  screeningWells,
  screeningRank,
  samplingUnits,
} from '../../models/bio-microbial-culture';
import '../../styles/bio-microbial-culture.css';
export default function BioMicrobialCulture() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    uid = useId(),
    s = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
  const variants = [
    'bio-elective-3-012-1',
    'bio-elective-3-015-1',
    'bio-elective-3-018-1',
    'bio-elective-3-020-1',
  ];
  const [mode0, setMode] = useState(Math.max(0, variants.indexOf(f.variant ?? ''))),
    [view, setView] = useState(0),
    [progress, setProgress] = useState(0.7),
    [sterile, setSterile] = useState(true),
    [contaminated, setContaminated] = useState(false),
    [blank, setBlank] = useState(false),
    [perBiomass, setPerBiomass] = useState(false),
    [exponent, setExponent] = useState(5),
    [counts, setCounts] = useState(['', '', '']),
    [rep, setRep] = useState(0),
    [medium, setMedium] = useState(0),
    [kind, setKind] = useState<'air' | 'water' | 'milk' | 'soil'>('air'),
    [active, setActive] = useState(true),
    [journal, setJournal] = useState('');
  const mode = f.watch ? (f.chapter < 3 ? 0 : f.chapter < 5 ? 1 : f.chapter < 9 ? 2 : 3) : mode0,
    local = f.watch ? f.chapter - [0, 3, 5, 9][mode] : Math.min(view, [2, 1, 3, 2][mode]),
    p = f.watch ? f.chapterProgress : progress;
  const st = streakState(p, w, f.watch ? true : sterile),
    g = plateGeometry(w),
    isBlank = f.watch ? local === 2 && p > 0.55 : blank,
    contam = f.watch ? false : contaminated,
    pure = pureCulture(
      local === 2 ? clamp(p * 2) : p,
      w,
      f.watch ? true : sterile,
      isBlank,
      contam,
    ),
    dil = dilutionTransfer(p, 3),
    degree = f.watch ? 5 : exponent,
    cr = cfuEstimate(f.watch ? ['96', '103', '101'] : counts, degree),
    current = f.watch ? Math.min(2, Math.floor(p * 3)) : rep,
    n = f.watch ? [96, 103, 101][current] : counts[current].trim() === '' ? 0 : +counts[current],
    ranking = screeningRank(local === 1, f.watch ? false : perBiomass);
  const sampleKind = f.watch ? (local === 0 ? 'air' : local === 1 ? 'water' : 'soil') : kind,
    vol = sampleKind === 'air' ? 100 : sampleKind === 'soil' ? 0.000001 : 0.1,
    count = sampleKind === 'air' ? 12 : sampleKind === 'soil' ? 100 : 80,
    unit = samplingUnits(
      sampleKind,
      count,
      vol,
      sampleKind === 'milk' ? 100 : 1,
      f.watch ? true : active,
    );
  const titles = [
      s('把细胞分散成菌落', 'From cells to colonies'),
      s('并行筛选，再复筛', 'Screen in parallel, then retest'),
      s('选择、稀释与计数', 'Selection, dilution and counts'),
      s('检测对象决定单位', 'Sampling determines units'),
    ],
    views = [
      [
        s('培养基与倒平板', 'Medium and pouring'),
        s('逐段划线', 'Streaking'),
        s('培养与空白', 'Growth and blank'),
      ],
      [s('初筛', 'Initial screen'), s('重复复筛', 'Replicated retest')],
      [
        s('选择培养基', 'Selective medium'),
        s('十倍稀释', 'Tenfold dilution'),
        s('重复平板', 'Replicate plates'),
        s('结果边界', 'Result limits'),
      ],
      [s('空气', 'Air'), s('水与牛奶', 'Water and milk'), s('土壤', 'Soil')],
    ];
  const plate = (
    <>
      <circle cx={g.cx} cy={g.cy} r={g.r + 4} fill="#f6f4e6" stroke="#bdc6b0" strokeWidth="2" />
      <circle cx={g.cx} cy={g.cy} r={g.r} fill="#e8dfb5" stroke="#c4c5a8" />
      <path
        d={`M${g.cx - g.r * 0.8} ${g.cy - g.r * 0.45}A${g.r} ${g.r} 0 0 1 ${g.cx + g.r * 0.35} ${g.cy - g.r * 0.88}`}
        stroke="#fbf8e9"
        strokeWidth="3"
        fill="none"
      />
    </>
  );
  return (
    <div className="bio-culture" data-watch={f.watch} ref={host}>
      <div className="bio-culture-head">{titles[mode]}</div>
      {mode === 0 && (
        <svg
          viewBox={`0 0 ${w} 304`}
          role="img"
          aria-label={s(
            '培养基倒入平板，冷却接种环逐段划线并与未接种平板比较',
            'Pour medium, streak with a cooled loop, and compare an uninoculated plate',
          )}
        >
          {local === 0 ? (
            <>
              <defs>
                <clipPath id={`${uid}-flask`}>
                  <path
                    transform={`translate(${w * 0.28} 90) rotate(120)`}
                    d="M-9-60V-28L-28 10Q-31 20-18 25H18Q31 20 28 10L9-28V-60Z"
                  />
                </clipPath>
              </defs>
              <path
                transform={`translate(${w * 0.28} 90) rotate(120)`}
                d="M-9-60V-28L-28 10Q-31 20-18 25H18Q31 20 28 10L9-28V-60"
                fill="#f4f3e4"
                stroke="#aabbab"
                strokeWidth="2"
              />
              <rect
                clipPath={`url(#${uid}-flask)`}
                x="0"
                y={92 + p * 19}
                width={w}
                height="70"
                fill="#d8c685"
              />
              <ellipse cx={w / 2} cy="220" rx="76" ry="17" fill="#ede8d1" stroke="#afbaa9" />
              <path d={`M${w / 2 - 76} 214v8q76 31 152 0v-8`} stroke="#afbaa9" fill="#f5f0dd" />
              <ellipse
                cx={w / 2}
                cy="216"
                rx={8 + p * 64}
                ry={2 + p * 11}
                fill="#d8c685"
                opacity={clamp(p * 4)}
              />
              {p > 0.02 && p < 0.98 && (
                <path
                  d={`M${w * 0.28 + 52} 120Q${w / 2 + 15} 153 ${w / 2} 213`}
                  fill="none"
                  stroke="#d8c685"
                  strokeWidth="3"
                />
              )}
              <text x={w / 2} y="28" textAnchor="middle">
                {s('已灭菌 · 冷却后倒平板', 'Sterilized · cooled medium')}
              </text>
              <text x={w / 2} y="273" textAnchor="middle">
                {s(
                  `示意转移 ${(15 * p).toFixed(1)} mL`,
                  `Illustrative transfer ${(15 * p).toFixed(1)} mL`,
                )}
              </text>
            </>
          ) : (
            <>
              {plate}
              {(local === 1 ? st.seeds.filter((a) => a.visible) : pure).map((a) => (
                <circle
                  key={a.id}
                  cx={a.x}
                  cy={a.y}
                  r={'r' in a ? a.r : 1.2}
                  fill="#b6aa79"
                  opacity=".8"
                />
              ))}
              <text x={w / 2} y="27" textAnchor="middle">
                {local === 1
                  ? s(
                      `第 ${st.zone + 1} 段：${st.hot ? '处理' : st.cooling ? '冷却' : st.depositing ? '划线' : '移动'}`,
                      `Streak ${st.zone + 1}: ${st.hot ? 'sterilize' : st.cooling ? 'cool' : st.depositing ? 'deposit' : 'move'}`,
                    )
                  : isBlank
                    ? s('未接种平板', 'Uninoculated plate')
                    : s('接种平板 · 示意培养结果', 'Inoculated · example growth')}
              </text>
              {local === 1 && (
                <>
                  <path d="M25 264q-15-15 0-35q15 20 0 35" fill="#e5bd84" />
                  <rect x="15" y="266" width="20" height="18" rx="6" fill="#c7c4ac" />
                  <path d={`M${w - 32} 234v38q9 8 18 0v-38`} fill="#f4f3e4" stroke="#aebbaf" />
                  <path d={`M${w - 30} 248v23q7 6 14 0v-23Z`} fill="#d7b4a8" />
                  <g transform={`translate(${st.loop.x} ${st.loop.y})`}>
                    <path d="M0-5l14-36" stroke="#a6aa99" strokeWidth="3" />
                    <circle
                      r="4"
                      fill="none"
                      stroke={st.hot ? '#ce845c' : '#8f9b8d'}
                      strokeWidth="2"
                    />
                  </g>
                  <text x={w / 2} y="292" textAnchor="middle">
                    {s('每段先冷却，再带出少量菌体', 'Cool, then take inoculum')}
                  </text>
                </>
              )}
              {local === 2 && (
                <text x={w / 2} y="277" textAnchor="middle">
                  {isBlank
                    ? contam
                      ? s('对照污染：需查明来源', 'Control contaminated')
                      : s('空白无菌落 · 仍需检查纯度', 'Clear blank · check purity')
                    : s('单菌落不等于完成菌种鉴定', 'Colony ≠ identification')}
                </text>
              )}
            </>
          )}
        </svg>
      )}
      {mode === 1 && (
        <svg
          viewBox={`0 0 ${w} 300`}
          role="img"
          aria-label={s(
            '24孔教学筛选板及同一候选的三次复筛',
            '24-well teaching screen and three repeated measurements per candidate',
          )}
        >
          <text x={w / 2} y="25" textAnchor="middle">
            {local === 0
              ? s('24 孔示例 · 指标须一致', '24-well example · same metric')
              : s('同一候选，独立重复', 'Same candidate, new replicates')}
          </text>
          {local === 0 ? (
            <>
              <rect
                x="16"
                y="51"
                width={w - 32}
                height="182"
                rx="18"
                fill="#ebebdc"
                stroke="#bcc4ad"
              />
              {['A', 'B', 'C', 'D'].map((v, i) => (
                <text key={v} x="1" y={84 + i * 45}>
                  {v}
                </text>
              ))}
              {[1, 2, 3, 4, 5, 6].map((v, i) => (
                <text key={v} x={32 + (i * (w - 72)) / 5} y="49">
                  {v}
                </text>
              ))}
              {screeningWells.map((a, i) => {
                const x = 36 + ((i % 6) * (w - 72)) / 5,
                  y = 78 + Math.floor(i / 6) * 45;
                return (
                  <g key={a.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r={Math.min(14, (w - 72) / 13)}
                      fill="#e2ddbd"
                      stroke="#b1bb9e"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={Math.min(11, (w - 72) / 15)}
                      fill="#a99d6d"
                      opacity={clamp(a.initial / 3.5) * clamp(p * 3)}
                    />
                    {a.id === ranking[0].id && (
                      <circle
                        cx={x}
                        cy={y}
                        r={Math.min(16, (w - 72) / 11)}
                        fill="none"
                        stroke="#8c9d83"
                        strokeWidth="2"
                      />
                    )}
                  </g>
                );
              })}
              <text x={w / 2} y="272" textAnchor="middle">
                {s(`初筛首位 ${ranking[0].id}`, `Initial leader ${ranking[0].id}`)}
              </text>
            </>
          ) : (
            <>
              {['B3', 'A4', 'D5'].map((id, i) => {
                const a = screeningWells.find((a) => a.id === id)!;
                return (
                  <g key={id}>
                    <text x="20" y={75 + i * 66}>
                      {id}
                    </text>
                    {a.retest.map((v, j) => (
                      <g key={j}>
                        <rect
                          x={60 + (j * (w - 80)) / 3}
                          y={82 + i * 66 - v * 19 * clamp(p * 2)}
                          width={(w - 104) / 3}
                          height={v * 19 * clamp(p * 2)}
                          rx="4"
                          fill={id === 'B3' ? '#c6b08c' : '#a7ba92'}
                        />
                        <text x={72 + (j * (w - 80)) / 3} y={104 + i * 66}>
                          {v.toFixed(1)}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })}
              <text x={w / 2} y="288" textAnchor="middle">
                {s(
                  `复筛首位 ${ranking[0].id} · 示例产量`,
                  `Retest leader ${ranking[0].id} · example yield`,
                )}
              </text>
            </>
          )}
        </svg>
      )}
      {mode === 2 && (
        <svg
          viewBox={`0 0 ${w} 302`}
          role="img"
          aria-label={s(
            '选择培养基、等比稀释、重复计数与CFU单位',
            'Selective media, serial dilution, replicate counts and CFU units',
          )}
        >
          {local === 0 ? (
            <>
              <text x={w / 2} y="27" textAnchor="middle">
                {(f.watch ? Math.min(2, Math.floor(p * 3)) : medium) === 0
                  ? s('尿素为唯一氮源', 'Urea as sole nitrogen source')
                  : (f.watch ? Math.min(2, Math.floor(p * 3)) : medium) === 1
                    ? s('普通含氮培养基', 'General nitrogen medium')
                    : s('无氮源对照', 'No-nitrogen control')}
              </text>
              {plate}
              {Array.from({ length: 18 }, (_, i) => {
                const a = colonySites(18, w)[i],
                  m = f.watch ? Math.min(2, Math.floor(p * 3)) : medium,
                  grows = m === 1 || (m === 0 && i % 3 !== 0);
                return (
                  <g key={i}>
                    <circle
                      cx={a.x}
                      cy={a.y}
                      r={grows ? 5 : 1}
                      fill={i % 3 ? '#a5b28b' : '#c5a28b'}
                    />
                  </g>
                );
              })}
              <text x={w / 2} y="280" textAnchor="middle">
                {s('生长条件筛选，尚未鉴定', 'Selection ≠ identification')}
              </text>
            </>
          ) : local === 1 ? (
            <>
              <text x={w / 2} y="28" textAnchor="middle">
                {s('充分混匀后，每次转移 1 mL', 'Mix, then transfer 1 mL')}
              </text>
              {[w * 0.25, w * 0.75].map((x, i) => (
                <g key={i}>
                  <path d={`M${x - 20} 132v96q20 17 40 0v-96`} fill="#f5f5e8" stroke="#b4bfa9" />
                  <path
                    d={`M${x - 18} ${229 - (i ? dil.receiverMl : dil.sourceMl) * 7}h36V228q-18 13-36 0Z`}
                    fill="#c1cba4"
                    opacity={i ? 0.5 : 0.9}
                  />
                  <text x={x} y="270" textAnchor="middle">
                    {(i ? dil.receiverMl : dil.sourceMl).toFixed(1)} mL
                  </text>
                </g>
              ))}
              {(() => {
                const pt =
                  p < 0.3
                    ? { x: w * 0.25, y: 190 }
                    : p < 0.45
                      ? { x: w * 0.25, y: 190 - ((p - 0.3) / 0.15) * 90 }
                      : p < 0.6
                        ? { x: w * 0.25 + ((p - 0.45) / 0.15) * w * 0.5, y: 100 }
                        : p < 0.7
                          ? { x: w * 0.75, y: 100 + ((p - 0.6) / 0.1) * 40 }
                          : { x: w * 0.75, y: 140 };
                return (
                  <g transform={`translate(${pt.x} ${pt.y})`}>
                    <path d="M-3-55v42L0 0l3-13v-42" fill="#f4f5e9" stroke="#a6b8aa" />
                    <path
                      d={`M-2 ${-12 - dil.pipetteMl * 40}h4v${dil.pipetteMl * 40}l-2 8-2-8Z`}
                      fill="#a1b589"
                    />
                  </g>
                );
              })()}
              {p > 0.7 && p < 1 && (
                <path
                  d={`M${w * 0.75} 143V${229 - dil.receiverMl * 7}`}
                  stroke="#a1b589"
                  strokeWidth="2"
                />
              )}
              <text x={w / 2} y="62" textAnchor="middle">
                10⁻³ g/mL → 10⁻⁴ g/mL
              </text>
            </>
          ) : local === 2 ? (
            <>
              {plate}
              {colonySites(n, w).map((a) => (
                <circle
                  key={a.id}
                  cx={a.x}
                  cy={a.y}
                  r="2.1"
                  fill="#b1a17b"
                  opacity={f.watch ? 1 : clamp(p * 3)}
                />
              ))}
              <text x={w / 2} y="28" textAnchor="middle">
                {s(
                  `平板 ${current + 1} · ${f.watch || counts[current].trim() !== '' ? n : '—'} CFU`,
                  `Plate ${current + 1} · ${f.watch || counts[current].trim() !== '' ? n : '—'} CFU`,
                )}
              </text>
              <text x={w / 2} y="276" textAnchor="middle">
                0.1 mL × 10⁻{degree} g/mL
              </text>
            </>
          ) : (
            <>
              <text x={w / 2} y="29" textAnchor="middle">
                {f.watch
                  ? s('示例：96、103、101 个菌落', 'Example: 96, 103, 101 colonies')
                  : s('个人重复计数', 'Own replicate counts')}
              </text>
              <text x={w / 2} y="78" textAnchor="middle">
                {cr?.acceptable
                  ? `${cr.cfuPerGram.toExponential(2)} CFU/g`
                  : s('个人重复计数尚未完成', 'Own counts missing')}
              </text>
              <g transform={`translate(${w / 2} 160)`}>
                {[-5, 5].map((x, i) => (
                  <ellipse key={i} cx={x} rx="8" ry="12" fill="#b6c39c" stroke="#879d7e" />
                ))}
                <path
                  d="M-25 36h50"
                  stroke="#b9ab83"
                  strokeWidth={3 + clamp(p * 2) * 12}
                  strokeLinecap="round"
                />
              </g>
              <text x={w / 2} y="239" textAnchor="middle">
                {s('相连细胞可形成一个菌落', 'A cell cluster may form 1 CFU')}
              </text>
              <text x={w / 2} y="279" textAnchor="middle">
                {s('培养条件限定可检测范围', 'Culture limits recovery')}
              </text>
            </>
          )}
        </svg>
      )}
      {mode === 3 && (
        <svg
          viewBox={`0 0 ${w} 300`}
          role="img"
          aria-label={s(
            '空气采样体积、水奶接种体积和土壤质量分别对应计数单位',
            'Air volume, liquid aliquots and soil mass define different count units',
          )}
        >
          <text x={w / 2} y="28" textAnchor="middle">
            {s(
              { air: '空气', water: '水', milk: '牛奶', soil: '土壤' }[sampleKind],
              { air: 'Air', water: 'Water', milk: 'Milk', soil: 'Soil' }[sampleKind],
            )}
          </text>
          {sampleKind === 'air' ? (
            <>
              {(f.watch || active) && (
                <rect
                  x={w / 2 - 55}
                  y="101"
                  width="110"
                  height="116"
                  rx="15"
                  fill="#d5ddca"
                  stroke="#a3b59e"
                />
              )}
              {(f.watch || active) && (
                <path d={`M${w / 2 - 44} 113h88`} stroke="#8d9c84" strokeWidth="5" />
              )}
              {(f.watch || active) &&
                [0, 1, 2, 3, 4].map((i) => (
                  <circle key={i} cx={w / 2 - 32 + i * 16} cy="113" r="3.1" fill="#f1f2e5" />
                ))}
              <ellipse cx={w / 2} cy="148" rx="43" ry="10" fill="#dacd9d" />
              {Array.from({ length: 12 }, (_, i) => {
                const y = 55 + clamp(p * 1.5 - i * 0.08) * 90;
                return (
                  <circle key={i} cx={w / 2 - 32 + (i % 5) * 16} cy={y} r="2" fill="#ad9b79" />
                );
              })}
              {(f.watch || active) && (
                <path
                  d={`M${w / 2} 166V194H${w / 2 + 70}m-8-6 8 6-8 6`}
                  stroke="#91a99b"
                  fill="none"
                />
              )}
              <text x={w / 2} y="240" textAnchor="middle">
                {f.watch || active ? '100 L' : s('沉降：记录面积与时间', 'Settling: area and time')}
              </text>
            </>
          ) : sampleKind === 'soil' ? (
            <>
              <path d={`M28 149Q${w / 2} 122 ${w - 28} 149V215H28Z`} fill="#c7b796" />
              <path d={`M${w / 2 - 15} 132v45h30v-45`} fill="#dbcdae" stroke="#a39072" />
              <path d={`M${w / 2 + 15} 150l24-47`} stroke="#b1b5a4" strokeWidth="7" />
              <text x={w / 2} y="244" textAnchor="middle">
                {s('记录取样质量与完整稀释链', 'Keep mass / dilution chain')}
              </text>
            </>
          ) : (
            <>
              <path
                d={`M${w / 2 - 35} 75v136q35 18 70 0V75`}
                fill="#eff3e7"
                stroke="#afbfac"
                strokeWidth="2"
              />
              <path
                d={`M${w / 2 - 33} 135h66v74q-33 16-66 0Z`}
                fill={sampleKind === 'milk' ? '#eee5ce' : '#c7dbcf'}
              />
              <text x={w / 2} y="245" textAnchor="middle">
                {s('记录体积、稀释、培养方法', 'Volume / dilution / method')}
              </text>
            </>
          )}
          <text x={w / 2} y="281" textAnchor="middle">
            {unit ? `${unit.value.toExponential(1)} ${unit.unit}` : ''}
          </text>
        </svg>
      )}
      {!f.watch && (
        <div className="bio-culture-controls">
          <div className="bio-culture-buttons">
            {titles.map((x, i) => (
              <button
                key={i}
                aria-pressed={mode === i}
                onClick={() => {
                  setMode(i);
                  setView(0);
                }}
              >
                {x}
              </button>
            ))}
          </div>
          <div className="bio-culture-buttons">
            {views[mode].map((x, i) => (
              <button
                key={i}
                aria-pressed={local === i}
                onClick={() => {
                  setView(i);
                  if (mode === 3) setKind(i === 0 ? 'air' : i === 1 ? 'water' : 'soil');
                }}
              >
                {x}
              </button>
            ))}
          </div>
          <label>
            {s('过程位置', 'Process position')}
            <input
              type="range"
              min="0"
              max="1"
              step=".005"
              value={progress}
              onChange={(e) => setProgress(+e.target.value)}
            />
          </label>
          {mode === 0 && local > 0 && (
            <>
              <button aria-pressed={sterile} onClick={() => setSterile(!sterile)}>
                {sterile
                  ? s('每段重新处理接种环', 'Treat loop between streaks')
                  : s('不重新处理接种环', 'No treatment between streaks')}
              </button>
              {local === 2 && (
                <>
                  <button aria-pressed={blank} onClick={() => setBlank(!blank)}>
                    {blank
                      ? s('查看未接种对照', 'Show uninoculated control')
                      : s('查看接种平板', 'Show inoculated plate')}
                  </button>
                  {blank && (
                    <button
                      aria-pressed={contaminated}
                      onClick={() => setContaminated(!contaminated)}
                    >
                      {contaminated
                        ? s('对照出现污染', 'Contaminated control')
                        : s('对照保持空白', 'Clear control')}
                    </button>
                  )}
                </>
              )}
            </>
          )}
          {mode === 1 && (
            <button aria-pressed={perBiomass} onClick={() => setPerBiomass(!perBiomass)}>
              {perBiomass
                ? s('按单位菌体产量排序', 'Rank per biomass')
                : s('按总产量排序', 'Rank total product')}
            </button>
          )}
          {mode === 2 && local === 0 && (
            <div className="bio-culture-buttons">
              {[s('尿素氮源', 'Urea N'), s('普通氮源', 'General N'), s('无氮源', 'No N')].map(
                (v, i) => (
                  <button key={i} aria-pressed={medium === i} onClick={() => setMedium(i)}>
                    {v}
                  </button>
                ),
              )}
            </div>
          )}
          {mode === 2 && local >= 2 && (
            <>
              <label>
                {s('相对原土样的指数', 'Exponent relative to soil')} 10⁻{exponent}
                <input
                  type="range"
                  min="3"
                  max="7"
                  step="1"
                  value={exponent}
                  onChange={(e) => setExponent(+e.target.value)}
                />
              </label>
              <div className="bio-culture-records">
                {counts.map((v, i) => (
                  <label key={i}>
                    {s(`平板 ${i + 1} 菌落数`, `Plate ${i + 1} colonies`)}
                    <input
                      type="number"
                      min="0"
                      max="400"
                      step="1"
                      value={v}
                      onFocus={() => setRep(i)}
                      onChange={(e) => {
                        setCounts(counts.map((x, j) => (j === i ? e.target.value : x)));
                        setRep(i);
                      }}
                    />
                  </label>
                ))}
              </div>
              {cr && !cr.acceptable && (
                <p>
                  {s(
                    '有平板超出本教材的30—300范围，先核查稀释与数据。',
                    'A plate is outside the textbook range of30–300; review dilution and records.',
                  )}
                </p>
              )}
            </>
          )}
          {mode === 3 && (
            <>
              <div className="bio-culture-buttons">
                {(['air', 'water', 'milk', 'soil'] as const).map((k) => (
                  <button key={k} aria-pressed={sampleKind === k} onClick={() => setKind(k)}>
                    {s(
                      { air: '空气', water: '水', milk: '牛奶', soil: '土壤' }[k],
                      { air: 'Air', water: 'Water', milk: 'Milk', soil: 'Soil' }[k],
                    )}
                  </button>
                ))}
              </div>
              {sampleKind === 'air' && (
                <button aria-pressed={active} onClick={() => setActive(!active)}>
                  {active
                    ? s('已知体积的主动采样', 'Known-volume active sampling')
                    : s('被动沉降平板', 'Passive settle plate')}
                </button>
              )}
            </>
          )}
          <details>
            <summary>{s('实验条件与调查记录', 'Conditions and investigation record')}</summary>
            <p>
              {s(
                '数字和菌落位置为教学例子，不能替代培养记录。选择培养不等于菌种鉴定，单菌落也可能源自细胞团。空气沉降无已知体积；水、牛奶和土壤须各自记录取样方法及适用标准。',
                'Numbers and colonies are teaching examples. Selection is not identification, and a colony may arise from a cell cluster. Settling provides no known air volume. Retain methods and applicable criteria for each sample type.',
              )}
            </p>
            <label>
              {s(
                '样品、方法、条件、观察与出处',
                'Sample, method, conditions, observations and source',
              )}
              <textarea value={journal} onChange={(e) => setJournal(e.target.value)} />
            </label>
          </details>
        </div>
      )}
    </div>
  );
}
