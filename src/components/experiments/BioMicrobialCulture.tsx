import { useEffect, useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
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
  cultureDirector,
  nitrogenPathway,
  nitrogenDisplay,
  nitrogenTracers,
  type CultureSnapshot,
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
  const [manual, setManual] = useState<CultureSnapshot | null>(null);
  const initialChapter =
    !f.watch && f.chapter === 0 && f.variant
      ? [0, 3, 5, 9][Math.max(0, variants.indexOf(f.variant))]
      : f.chapter;
  const directed = cultureDirector(
      initialChapter,
      f.chapterProgress,
      browserLocale(),
      f.chapterTime,
    ),
    state = f.watch ? directed : (manual ?? directed),
    put = (patch: Partial<CultureSnapshot>) =>
      setManual({
        ...state,
        counts: [...state.counts],
        prediction: Object.keys(patch).some((k) => k !== 'journal') ? false : state.prediction,
        ...patch,
      }),
    {
      chapter,
      progress,
      nitrogenProgress,
      cultureGrowth,
      sterile,
      contaminated,
      blank,
      perBiomass,
      exponent,
      counts,
      rep,
      medium,
      kind,
      active,
      journal,
      hydrolysis,
      assimilation,
      compare,
      prediction,
    } = state,
    mode = chapter < 3 ? 0 : chapter < 5 ? 1 : chapter < 9 ? 2 : 3,
    local = chapter - [0, 3, 5, 9][mode],
    p = progress,
    st = streakState(p, w, sterile),
    g = plateGeometry(w),
    isBlank = blank,
    contam = contaminated,
    pure = pureCulture(cultureGrowth, w, sterile, isBlank, contam),
    dil = dilutionTransfer(p, 3),
    degree = exponent,
    cr = cfuEstimate(counts, degree),
    current = rep,
    n = counts[current].trim() === '' ? 0 : +counts[current],
    ranking = screeningRank(local === 1, perBiomass),
    sampleKind = kind,
    vol = sampleKind === 'air' ? 100 : sampleKind === 'soil' ? 0.000001 : 0.1,
    count = sampleKind === 'air' ? 12 : sampleKind === 'soil' ? 100 : 80,
    unit = samplingUnits(sampleKind, count, vol, sampleKind === 'milk' ? 100 : 1, active),
    nitrogen = nitrogenPathway(nitrogenProgress, medium, hydrolysis, assimilation),
    nitrogenLabels = nitrogenDisplay(nitrogen),
    tracers = nitrogenTracers(nitrogenProgress, medium, hydrolysis, assimilation);
  useEffect(() => {
    if (!f.watch && manual === null) {
      setManual({ ...directed, counts: [...directed.counts] });
    }
  }, [f.watch, manual, directed]);
  const titles = [
      s('把细胞分散成菌落', 'From cells to colonies'),
      s('并行筛选，再复筛', 'Screen in parallel, then retest'),
      s('选择、稀释与计数', 'Selection, dilution and counts'),
      s('检测对象决定单位', 'Sampling determines units'),
    ],
    views = [
      [
        s('从细胞到菌落', 'Cells to colonies'),
        s('逐段划线', 'Streaking'),
        s('培养与空白', 'Growth and blank'),
      ],
      [s('初筛', 'Initial screen'), s('重复复筛', 'Replicated retest')],
      [
        s('氮源与生长', 'Nitrogen and growth'),
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
    <div
      className="bio-culture"
      data-watch={f.watch}
      data-chapter={chapter}
      data-progress={p}
      data-blank={isBlank}
      data-contaminated={contam}
      data-valid={!(isBlank && contam)}
      data-medium={medium}
      data-hydrolysis={hydrolysis}
      data-assimilation={assimilation}
      data-comparison={compare}
      data-prediction={prediction}
      data-sample={kind}
      data-active={active}
      data-snapshot={JSON.stringify(state)}
      ref={host}
    >
      <div className="bio-culture-head">{titles[mode]}</div>
      {mode === 0 && (
        <svg
          viewBox={`0 0 ${w} 292`}
          role="img"
          aria-label={s(
            '培养基倒入平板，冷却接种环逐段划线并与未接种平板比较',
            'Pour medium, streak with a cooled loop, and compare an uninoculated plate',
          )}
        >
          {local === 0 ? (
            <>
              {plate}
              <text x={w / 2} y="27" textAnchor="middle">
                {s('生长放大了原来的落点', 'Growth reveals the starting sites')}
              </text>
              {[
                { id: 'A', x: -0.42, y: -0.23 },
                { id: 'B', x: 0.37, y: -0.14 },
                { id: 'C', x: -0.1, y: 0.42 },
              ].map((a, i) => {
                const cx = g.cx + a.x * g.r,
                  cy = g.cy + a.y * g.r,
                  growth = clamp((p - 0.12) / 0.68);
                return (
                  <g key={a.id} data-lineage={a.id}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={3 + 19 * growth}
                      fill={i === 1 ? '#d6b995' : '#b9c49d'}
                      opacity=".65"
                    />
                    {Array.from({ length: 7 }, (_, j) => (
                      <ellipse
                        key={j}
                        data-cell={`${a.id}-${j}`}
                        cx={cx + (j ? Math.cos(j * 2.4) * 13 * growth : 0)}
                        cy={cy + (j ? Math.sin(j * 2.4) * 13 * growth : 0)}
                        rx="3"
                        ry="4.5"
                        fill={i === 1 ? '#b89265' : '#80966c'}
                        opacity={j ? clamp(growth * 7 - j + 1) : 1}
                      />
                    ))}
                    <text x={cx} y={cy + 40} textAnchor="middle">
                      {a.id}
                    </text>
                  </g>
                );
              })}
              <text x={w / 2} y="277" textAnchor="middle">
                {s('相同营养、温度与时间', 'Same nutrients, temperature, time')}
              </text>
            </>
          ) : (
            <>
              {plate}
              {(local === 1 ? st.seeds.filter((a) => a.visible) : pure).map((a) => (
                <circle
                  key={a.id}
                  data-colony={a.id}
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
                  <text x={w / 2} y="284" textAnchor="middle">
                    {s('每段先冷却，再带出少量菌体', 'Cool, then take inoculum')}
                  </text>
                </>
              )}
              {local === 2 && (
                <text x={w / 2} y="277" textAnchor="middle">
                  {isBlank
                    ? contam
                      ? s('空白长菌：本批判读无效', 'Blank grows: batch invalid')
                      : s('同条件空白：暂未见菌落', 'Matched blank: no growth yet')
                    : s('单菌落不等于完成菌种鉴定', 'Colony ≠ identification')}
                </text>
              )}
            </>
          )}
        </svg>
      )}
      {mode === 1 && (
        <svg
          viewBox={`0 0 ${w} 292`}
          role="img"
          aria-label={s(
            '24孔教学筛选板及同一候选的三次复筛',
            '24-well teaching screen and three repeated measurements per candidate',
          )}
        >
          <text x={w / 2} y="25" textAnchor="middle">
            {local === 0
              ? perBiomass
                ? s('单位菌体产量 · A4 领先', 'Per biomass: A4 leads')
                : s('24 孔示例 · 总产量', '24-well example · total output')
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
              <text x={w / 2} y="261" textAnchor="middle">
                {perBiomass
                  ? 'B3: 3.4 / 3.0 = 1.13'
                  : s('总产量：B3 3.4 · A4 2.1', 'Total: B3 3.4 · A4 2.1')}
              </text>
              <text x={w / 2} y="284" textAnchor="middle">
                {perBiomass
                  ? 'A4: 2.1 / 0.8 = 2.63'
                  : s(`初筛首位 ${ranking[0].id}`, `Initial leader ${ranking[0].id}`)}
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
              <text x={w / 2} y="284" textAnchor="middle">
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
          viewBox={`0 0 ${w} 292`}
          role="img"
          aria-label={s(
            '选择培养基、等比稀释、重复计数与CFU单位',
            'Selective media, serial dilution, replicate counts and CFU units',
          )}
        >
          {local === 0 ? (
            <>
              {prediction ? (
                <>
                  <text x={w / 2} y="48" textAnchor="middle">
                    {s('先用机制预测', 'Predict from the pathway')}
                  </text>
                  <ellipse cx={w / 2} cy="111" rx="10" ry="14" fill="#bc9878" />
                  <text x={w / 2} y="157" textAnchor="middle">
                    {s('B 不能水解尿素', 'B cannot hydrolyze urea')}
                  </text>
                  <text x={w / 2} y="194" textAnchor="middle">
                    {s('直接供给可用氮，会怎样？', 'Supply usable N: what changes?')}
                  </text>
                  <text x={w / 2} y="271" textAnchor="middle">
                    {s('其他生长条件保持相同', 'Keep other conditions the same')}
                  </text>
                </>
              ) : compare ? (
                <>
                  <text x={w / 2} y="25" textAnchor="middle">
                    {s('同一候选，只换氮源', 'Same candidates, change N')}
                  </text>
                  {[s('尿素', 'Urea N'), s('普通氮', 'Other N'), s('无氮', 'No N')].map(
                    (label, m) => (
                      <g key={m}>
                        <text x={((m + 0.5) * w) / 3} y="62" textAnchor="middle">
                          {label}
                        </text>
                        {[true, false].map((hasUrease, i) => {
                          const a = nitrogenPathway(1, m, hasUrease && hydrolysis, assimilation);
                          const x = ((m + 0.5) * w) / 3,
                            y = 119 + i * 91;
                          return (
                            <g
                              key={i}
                              data-candidate={i ? 'B' : 'A'}
                              data-n-source={m}
                              data-growth={a.growth}
                            >
                              <circle cx={x} cy={y} r="31" fill="#f3f0df" stroke="#d4d6bd" />
                              {Array.from({ length: 7 }, (_, j) => (
                                <ellipse
                                  key={j}
                                  data-cell={`${i ? 'B' : 'A'}-${j}`}
                                  cx={x + (j ? Math.cos(j * 2.4) * 15 : 0)}
                                  cy={y + (j ? Math.sin(j * 2.4) * 15 : 0)}
                                  rx="3.5"
                                  ry="5"
                                  fill={i ? '#bc9878' : '#879e71'}
                                  opacity={j ? a.growth : 1}
                                />
                              ))}
                            </g>
                          );
                        })}
                      </g>
                    ),
                  )}
                  <text x={w / 2} y="166" textAnchor="middle">
                    {hydrolysis
                      ? s('A · 可水解尿素', 'A · urea hydrolysis')
                      : s('A · 水解关闭', 'A · hydrolysis disabled')}
                  </text>
                  <text x={w / 2} y="257" textAnchor="middle">
                    {s('B · 不能水解尿素', 'B · no urea hydrolysis')}
                  </text>
                  <text x={w / 2} y="284" textAnchor="middle">
                    {s('示例能力 ≠ 菌种鉴定', 'Model abilities ≠ identification')}
                  </text>
                </>
              ) : (
                <>
                  <text x={w / 2} y="25" textAnchor="middle">
                    {
                      [
                        s('尿素供氮的教学路径', 'A model of urea nitrogen'),
                        s('直接提供可用氮', 'Available N supplied'),
                        s('无氮源对照', 'No nitrogen supplied'),
                      ][medium]
                    }
                  </text>
                  <path
                    d={`M${w * 0.55} 77V213`}
                    stroke="#d3dac5"
                    strokeWidth="7"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M${w * 0.55 - 5} 108l5 7 5-7m-10 69 5 7 5-7`}
                    stroke="#92a080"
                    strokeWidth="2"
                    fill="none"
                  />
                  <ellipse cx={w * 0.55} cy="71" rx="36" ry="20" fill="#e2d8b9" stroke="#b8ad8c" />
                  <ellipse cx={w * 0.55} cy="143" rx="36" ry="20" fill="#dce3c8" stroke="#b0bc97" />
                  <ellipse
                    cx={w * 0.55}
                    cy="219"
                    rx={27 + nitrogen.growth * 13}
                    ry="23"
                    fill="#cad8b8"
                    stroke="#8b9f78"
                    strokeWidth="2"
                  />
                  <text x="8" y="76">
                    {s('尿素', 'Urea')}
                  </text>
                  <text x="8" y="148">
                    {s('可用氮', 'Usable N')}
                  </text>
                  <text x="8" y="224">
                    {s('菌体', 'Biomass')}
                  </text>
                  <text x={w - 5} y="76" textAnchor="end" data-n-pool="urea">
                    {nitrogenLabels.urea.toFixed(1)} N
                  </text>
                  <text x={w - 5} y="148" textAnchor="end" data-n-pool="available">
                    {nitrogenLabels.available.toFixed(1)} N
                  </text>
                  <text x={w - 5} y="224" textAnchor="end" data-n-pool="biomass">
                    {nitrogenLabels.biomass.toFixed(1)} N
                  </text>
                  <text x="8" y="107">
                    {hydrolysis ? s('脲酶水解', 'Hydrolysis') : s('水解关闭', 'Hydrolysis off')}
                  </text>
                  <text x="8" y="181">
                    {assimilation
                      ? s('摄取、同化', 'Assimilation')
                      : s('同化关闭', 'Assimilation off')}
                  </text>
                  {tracers
                    .filter((a) => a.visible)
                    .map((a, i) => {
                      const y = 71 + 72 * a.released + 76 * a.incorporated;
                      return (
                        <g
                          key={a.id}
                          data-tracer={a.id}
                          data-n-stage={a.stage}
                          transform={`translate(${w * 0.55 + (i ? 15 : -15)} ${y})`}
                        >
                          <circle r="13" fill={i ? '#b2a3c6' : '#d3af73'} stroke="#f8f5e9" />
                          <text x="0" y="6" textAnchor="middle">
                            {a.id}
                          </text>
                        </g>
                      );
                    })}
                  <text x={w / 2} y="265" textAnchor="middle">
                    {s('氨 / 铵 → 含氮物质', 'Ammonia / ammonium → cell N')}
                  </text>
                  <text x={w / 2} y="284" textAnchor="middle">
                    {s('碳源、能量等条件充足', 'Carbon, energy, other needs met')}
                  </text>
                </>
              )}
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
                  <text x={x} y="260" textAnchor="middle">
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
              <text x={w / 2} y="284" textAnchor="middle">
                10⁻³ g/mL → 10⁻⁴ g/mL
              </text>
            </>
          ) : local === 2 ? (
            <>
              {plate}
              {colonySites(n, w).map((a) => (
                <circle key={a.id} cx={a.x} cy={a.y} r="2.1" fill="#b1a17b" opacity="1" />
              ))}
              <text x={w / 2} y="28" textAnchor="middle">
                {s(
                  `平板 ${current + 1} · ${counts[current].trim() !== '' ? n : '—'} CFU`,
                  `Plate ${current + 1} · ${counts[current].trim() !== '' ? n : '—'} CFU`,
                )}
              </text>
              <text x={w / 2} y="276" textAnchor="middle">
                0.1 mL × 10⁻{degree} g/mL
              </text>
            </>
          ) : (
            <>
              <text x={w / 2} y="29" textAnchor="middle">
                {counts.join(',') === '96,103,101'
                  ? s('示例：96、103、101 个菌落', 'Example: 96, 103, 101 colonies')
                  : s('当前重复计数', 'Current replicate counts')}
              </text>
              <text x={w / 2} y="78" textAnchor="middle">
                {cr?.acceptable
                  ? `${cr.cfuPerGram.toExponential(2)} CFU/g`
                  : s('个人重复计数尚未完成', 'Own counts missing')}
              </text>
              {cr?.acceptable && (
                <text x={w / 2} y="110" textAnchor="middle">
                  {cr.mean.toFixed(1)} ÷ (0.1 × 10⁻{degree})
                </text>
              )}
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
          viewBox={`0 0 ${w} 292`}
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
              {active && (
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
              {active && <path d={`M${w / 2 - 44} 113h88`} stroke="#8d9c84" strokeWidth="5" />}
              {active &&
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
              {active && (
                <path
                  d={`M${w / 2} 166V194H${w / 2 + 70}m-8-6 8 6-8 6`}
                  stroke="#91a99b"
                  fill="none"
                />
              )}
              <text x={w / 2} y="240" textAnchor="middle">
                {active ? '100 L' : s('沉降：记录面积与时间', 'Settling: area and time')}
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
                {s(
                  `80 CFU · 0.1 mL · ${sampleKind === 'milk' ? '稀释100倍' : '未稀释'}`,
                  `80 CFU · 0.1 mL · ${sampleKind === 'milk' ? '1:100' : 'undiluted'}`,
                )}
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
                  put({ chapter: [0, 3, 5, 9][i], kind: 'air' });
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
                  put({
                    chapter: [0, 3, 5, 9][mode] + i,
                    ...(mode === 3 ? { kind: i === 0 ? 'air' : i === 1 ? 'water' : 'soil' } : {}),
                  });
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
              value={chapter === 5 ? nitrogenProgress : chapter === 2 ? cultureGrowth : progress}
              onChange={(e) =>
                put({
                  progress: +e.target.value,
                  nitrogenProgress: +e.target.value,
                  cultureGrowth: +e.target.value,
                })
              }
            />
          </label>
          {mode === 0 && local > 0 && (
            <>
              <button aria-pressed={sterile} onClick={() => put({ sterile: !sterile })}>
                {sterile
                  ? s('每段重新处理接种环', 'Treat loop between streaks')
                  : s('不重新处理接种环', 'No treatment between streaks')}
              </button>
              {local === 2 && (
                <>
                  <button aria-pressed={blank} onClick={() => put({ blank: !blank })}>
                    {blank
                      ? s('查看未接种对照', 'Show uninoculated control')
                      : s('查看接种平板', 'Show inoculated plate')}
                  </button>
                  {blank && (
                    <button
                      aria-pressed={contaminated}
                      onClick={() => put({ contaminated: !contaminated })}
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
            <button aria-pressed={perBiomass} onClick={() => put({ perBiomass: !perBiomass })}>
              {perBiomass
                ? s('按单位菌体产量排序', 'Rank per biomass')
                : s('按总产量排序', 'Rank total product')}
            </button>
          )}
          {mode === 2 && local === 0 && (
            <div className="bio-culture-buttons">
              <button aria-pressed={compare} onClick={() => put({ compare: !compare })}>
                {compare
                  ? s('查看氮的去向', 'Trace nitrogen')
                  : s('比较同条件培养', 'Compare matched cultures')}
              </button>
              <button aria-pressed={hydrolysis} onClick={() => put({ hydrolysis: !hydrolysis })}>
                {hydrolysis ? s('水解开启', 'Hydrolysis on') : s('水解关闭', 'Hydrolysis off')}
              </button>
              <button
                aria-pressed={assimilation}
                onClick={() => put({ assimilation: !assimilation })}
              >
                {assimilation
                  ? s('同化开启', 'Assimilation on')
                  : s('同化关闭', 'Assimilation off')}
              </button>
              {[s('尿素氮源', 'Urea N'), s('普通氮源', 'General N'), s('无氮源', 'No N')].map(
                (v, i) => (
                  <button key={i} aria-pressed={medium === i} onClick={() => put({ medium: i })}>
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
                  onChange={(e) => put({ exponent: +e.target.value })}
                />
              </label>
              <p>
                {s(
                  '示例可继承；自己的原始记录请另存。',
                  'Inherited values are examples; keep original records separately.',
                )}
              </p>
              <button onClick={() => put({ counts: ['', '', ''], rep: 0 })}>
                {s('清空三个计数', 'Clear three counts')}
              </button>
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
                      onFocus={() => put({ rep: i })}
                      onChange={(e) => {
                        put({
                          counts: counts.map((x, j) => (j === i ? e.target.value : x)),
                          rep: i,
                        });
                      }}
                    />
                  </label>
                ))}
              </div>
              {cr && !cr.acceptable && (
                <p>
                  {s(
                    '有平板超出本教材的30—300范围，先核查稀释与数据。',
                    'A plate is outside the textbook range of 30–300; review dilution and records.',
                  )}
                </p>
              )}
            </>
          )}
          {mode === 3 && (
            <>
              <div className="bio-culture-buttons">
                {(['air', 'water', 'milk', 'soil'] as const).map((k) => (
                  <button key={k} aria-pressed={sampleKind === k} onClick={() => put({ kind: k })}>
                    {s(
                      { air: '空气', water: '水', milk: '牛奶', soil: '土壤' }[k],
                      { air: 'Air', water: 'Water', milk: 'Milk', soil: 'Soil' }[k],
                    )}
                  </button>
                ))}
              </div>
              {sampleKind === 'air' && (
                <button aria-pressed={active} onClick={() => put({ active: !active })}>
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
              <textarea value={journal} onChange={(e) => put({ journal: e.target.value })} />
            </label>
          </details>
        </div>
      )}
    </div>
  );
}
