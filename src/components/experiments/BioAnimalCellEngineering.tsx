import { useEffect, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  animalClamp as clamp,
  cultureGrowth,
  cultureComparison,
  animalMeasuredSnapshot,
  animalCultureDirector,
  type AnimalCellSnapshot,
  bicarbonatePH,
  passageFrame,
  hybridSelection,
  cloneOccupancy,
  donorFusion,
  enucleation,
  hybridFusion,
  type HybridKind,
} from '../../models/bio-animal-cell-engineering';
import '../../styles/bio-animal-cell-engineering.css';
export default function BioAnimalCellEngineering() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const variants = ['bio-elective-3-044-1', 'bio-elective-3-048-1', 'bio-elective-3-052-1'];
  const initialChapter = Math.max(0, variants.indexOf(f.variant ?? '')) * 4;
  const authored = animalMeasuredSnapshot(
    Math.max(f.chapter, initialChapter),
    f.chapterProgress,
    f.chapterTime,
    browserLocale() === 'en',
  );
  const [manual, setManual] = useState<AnimalCellSnapshot | null>(null);
  const state = f.watch ? authored : (manual ?? authored);
  useEffect(() => {
    if (!f.watch) setManual((previous) => previous ?? authored);
  }, [f.watch, f.chapter, f.chapterProgress, f.chapterTime]);
  const put = (patch: Partial<AnimalCellSnapshot>) =>
    setManual((previous) => ({ ...(previous ?? state), ...patch }));
  const mode = Math.min(2, Math.floor(state.chapter / 4)),
    local = state.chapter % 4,
    p = state.progress,
    { adherent: attach, contact: inhibit, co2: gas, hat, lambda, journal } = state,
    growth = cultureGrowth(p * 24, {
      initial: state.initial,
      resources: state.resources,
      adherent: attach,
      contact: inhibit,
    }),
    directed = animalCultureDirector(p),
    comparisons = cultureComparison(directed.growthTime),
    pass = passageFrame(directed.transfer, w),
    enuc = enucleation(p, w),
    fuse = donorFusion(p),
    hybrid = hybridFusion(p),
    occupancy = cloneOccupancy(lambda);
  const titles = [
      s('培养条件与传代', 'Culture conditions and passage'),
      s('杂交瘤的两层筛选', 'Two stages of hybridoma screening'),
      s('核、卵细胞质与孕育来源', 'Nucleus, oocyte and gestation'),
    ],
    views = [
      [
        s('组织分散', 'Tissue dissociation'),
        s('什么让增殖减慢？', 'What slows growth?'),
        s('换液还是分瓶？', 'Feed or split?'),
        s('气体与缓冲', 'Gas and buffering'),
      ],
      [
        s('两类细胞融合', 'Fuse cell types'),
        s('选择培养', 'Selective culture'),
        s('抗体特异性检测', 'Test antibody specificity'),
        s('克隆化与再确认', 'Clone and verify'),
      ],
      [
        s('去除MⅡ复合物', 'Remove MII complex'),
        s('供体细胞融合', 'Fuse donor cell'),
        s('激活与早期发育', 'Activate and develop'),
        s('三个来源', 'Three sources'),
      ],
    ];
  const cell = (x: number, y: number, r = 10, color = '#bfafc2', flat = false, key?: string) => (
    <g key={key} transform={`translate(${x} ${y})`}>
      <ellipse
        rx={flat ? r * 1.4 : r}
        ry={flat ? r * 0.65 : r}
        fill={color}
        stroke="#aa9aab"
        strokeWidth="1.2"
      />
      <ellipse rx={r * 0.35} ry={r * 0.3} fill="#978ba3" />
    </g>
  );
  const antibody = (x: number, y: number, color = '#9687a2', rotate = 0) => (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <path
        d="M0 11V0L-8-10M0 0L8-10"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );
  const arc = (r: number, pore: boolean) => {
    if (!pore) return `M${-r} 0A${r} ${r} 0 1 0 ${r} 0A${r} ${r} 0 1 0 ${-r} 0`;
    const a = Math.asin(-16 / r),
      gap = 0.15;
    return `M${r * Math.cos(a + gap)} ${r * Math.sin(a + gap)} A${r} ${r} 0 1 1 ${r * Math.cos(a - gap)} ${r * Math.sin(a - gap)}`;
  };
  return (
    <div
      className="bio-animal-cell"
      data-watch={f.watch}
      data-snapshot={JSON.stringify(state)}
      ref={host}
    >
      {!f.watch && <div className="bio-animal-cell-head">{titles[mode]}</div>}
      {mode === 0 && (
        <svg
          viewBox={`0 0 ${w} ${local === 1 || local === 2 ? 288 : 308}`}
          role="img"
          aria-label={s(
            '动物细胞分散、生长、分瓶传代与培养液缓冲',
            'Animal-cell dissociation, growth, passage and medium buffering',
          )}
        >
          <text x={w / 2} y="27" textAnchor="middle">
            {views[0][local]}
          </text>
          {local === 0 ? (
            <>
              <ellipse
                cx={w / 2}
                cy="162"
                rx={Math.min(100, w * 0.4)}
                ry="80"
                fill="#f0e8e7"
                stroke="#c8b8bd"
              />
              {Array.from({ length: 16 }, (_, i) => {
                const spacing = 16 + 18 * p;
                return cell(
                  w / 2 + ((i % 4) - 1.5) * spacing,
                  162 + (Math.floor(i / 4) - 1.5) * spacing,
                  8,
                  '#c8b7c9',
                  false,
                  `cell-${i}`,
                );
              })}
              <text x={w / 2} y="282" textAnchor="middle">
                {s('解除组织连接，保留活细胞', 'Release connections, retain cells')}
              </text>
            </>
          ) : local === 1 ? (
            <g data-population={growth.n} data-resources={growth.resources} data-rate={growth.rate}>
              <rect
                x={w / 2 - 112}
                y="54"
                width="224"
                height="145"
                rx="28"
                fill="#f3e7ed"
                stroke="#c9b8c4"
              />
              <path
                d={`M${w / 2 - 106} 181Q${w / 2} 205 ${w / 2 + 106} 181`}
                fill="none"
                stroke="#b9a4b4"
                strokeWidth="2"
              />
              {Array.from({ length: 16 }, (_, i) => (
                <circle
                  key={`resource-${i}`}
                  cx={w / 2 - 90 + i * 12}
                  cy="72"
                  r="3"
                  fill="#a5b38a"
                  opacity={clamp(growth.resources / 2.5 - i)}
                />
              ))}
              {Array.from({ length: 128 }, (_, i) => {
                const angle = i * 2.3999632297,
                  radius = Math.sqrt((i + 0.5) / Math.max(32, growth.n));
                return (
                  <g key={`population-${i}`} opacity={clamp(growth.n - i)}>
                    {cell(
                      w / 2 + 96 * radius * Math.cos(angle),
                      138 + 46 * radius * Math.sin(angle),
                      attach ? 11 : 5,
                      '#c9b5c5',
                      attach,
                    )}
                  </g>
                );
              })}
              <text x={w / 2} y="224" textAnchor="middle">
                {s('表面因子', 'Surface factor')} {Math.round(growth.space * 100)}%
              </text>
              <text x={w / 2} y="248" textAnchor="middle">
                {s('资源因子', 'Resource factor')} {Math.round(growth.nutrient * 100)}% ·{' '}
                {s('教学模型', 'model')}
              </text>
              <text x={w / 2} y="275" textAnchor="middle">
                {s('增殖速率', 'Growth rate')} {growth.rate.toFixed(2)}
              </text>
            </g>
          ) : local === 2 ? (
            directed.compare ? (
              <g data-comparison-time={directed.growthTime}>
                <text x={w / 2} y="49" textAnchor="middle">
                  {s('同细胞总量 · 同培养液总量', 'Same cells · same total medium')}
                </text>
                {comparisons.map((a, i) => {
                  const y = 63 + i * 70,
                    x = w < 420 ? 58 : w * 0.3;
                  const label =
                    i === 0
                      ? s('不处理', 'Unchanged')
                      : i === 1
                        ? s('只换液', 'Fresh medium')
                        : s('分瓶并补液', 'Split + fresh');
                  return (
                    <g
                      key={a.kind}
                      data-case={a.kind}
                      data-n={a.n}
                      data-total={a.total}
                      data-resources={a.resources}
                      data-rate={a.totalRate}
                    >
                      <rect
                        x={x - 45}
                        y={y}
                        width="90"
                        height="45"
                        rx="12"
                        fill="#f2e5eb"
                        stroke="#c6afbf"
                      />
                      {Array.from({ length: 32 }, (_, j) => (
                        <g key={j} opacity={clamp(a.n - j)}>
                          {cell(
                            x - 34 + (j % 8) * 9,
                            y + 17 + Math.floor(j / 8) * 7,
                            3.2,
                            '#b99eb8',
                            true,
                          )}
                        </g>
                      ))}
                      {Array.from({ length: 8 }, (_, j) => (
                        <circle
                          key={j}
                          cx={x - 31 + j * 9}
                          cy={y + 6}
                          r="2"
                          fill="#8caa6e"
                          opacity={clamp(a.resources / 3 - j)}
                        />
                      ))}
                      <text x={x} y={y + 60} textAnchor="middle">
                        {a.vessels === 2 ? s('2瓶 · 面积×2', '2 × area') : s('原面积', 'Same area')}
                      </text>
                      <text x={w < 420 ? 118 : w * 0.53} y={y + 13}>
                        {label}
                      </text>
                      <text x={w < 420 ? 118 : w * 0.53} y={y + 37}>
                        {directed.prediction
                          ? s('预测新增长', 'Predict growth')
                          : `${s('新增', 'Added')} +${(a.total - 28).toFixed(1)}`}
                      </text>
                    </g>
                  );
                })}
                {directed.prediction && (
                  <text x={w - 18} y="271" textAnchor="end" fill="#8d9c72">
                    ?
                  </text>
                )}
              </g>
            ) : (
              <>
                <g transform={`translate(${w * 0.1} 31) scale(.8)`}>
                  <path d={`M${w / 2 - 38} 74v66q38 16 76 0V74`} fill="#f5eeee" stroke="#c1afb8" />
                  <path
                    d={`M${w / 2 - 36} ${143 - pass.sourceMl * 6}h72V140q-36 13-72 0Z`}
                    fill="#e1c8d0"
                  />
                  {[w * 0.25, w * 0.75].map((x, i) => (
                    <g key={i}>
                      <path
                        d={`M${x - 36} 182v69q36 13 72 0v-69`}
                        fill="#f5eeee"
                        stroke="#c1afb8"
                      />
                      <path
                        d={`M${x - 34} ${252 - pass.receivers[i] * 10}h68V250q-34 12-68 0Z`}
                        fill="#e1c8d0"
                      />
                    </g>
                  ))}
                  {pass.cells.map((a) =>
                    cell(a.x, a.y, a.inPipette ? 2.6 : 4.5, '#c4adbf', false, a.id),
                  )}
                  <g transform={`translate(${pass.tip.x} ${pass.tip.y})`}>
                    <path
                      d="M-9-55v43L-3 0h6l6-12v-43"
                      stroke="#9daab0"
                      fill="none"
                      strokeWidth="1.8"
                    />
                    <path d="M-10-57h20" stroke="#a3b1b7" strokeWidth="6" />
                  </g>
                </g>
                <text x={w / 2} y="278" textAnchor="middle">
                  {s('同16个标记 · 分成8与8', 'Same 16 labels → 8 and 8')}
                </text>
              </>
            )
          ) : (
            <>
              <rect
                x="21"
                y="73"
                width={w - 42}
                height="155"
                rx="20"
                fill="#e9e8e0"
                stroke="#bfc4b4"
              />
              <path d={`M${w / 2 - 60} 157v41q60 23 120 0v-41`} fill="#e0c0ca" stroke="#bda1b2" />
              <path d={`M${w / 2 - 58} 164h116`} stroke="#b68e9f" strokeWidth="2" />
              {Array.from({ length: 6 }, (_, i) => (
                <circle
                  key={i}
                  cx={w / 2 - 45 + i * 18}
                  cy={101 + clamp(p * 1.6 - i * 0.1) * 67}
                  r="3"
                  fill="#a9b4b7"
                />
              ))}
              <text x={w / 2} y="51" textAnchor="middle">
                CO₂ {gas.toFixed(1)}%
              </text>
              <text x={w / 2} y="265" textAnchor="middle">
                {s('模型pH', 'Model pH')}: {bicarbonatePH(gas).toFixed(2)}
              </text>
              <text x={w / 2} y="299" textAnchor="middle">
                {s('O₂代谢与CO₂缓冲不同', 'O₂ metabolism ≠ CO₂ buffering')}
              </text>
            </>
          )}
        </svg>
      )}
      {mode === 1 && (
        <svg
          viewBox={`0 0 ${w} 312`}
          role="img"
          aria-label={s(
            '杂交瘤融合、选择培养、抗原结合检测和克隆来源验证',
            'Hybridoma fusion, selective culture, antigen binding and clonal-origin verification',
          )}
        >
          <text x={w / 2} y="27" textAnchor="middle">
            {views[1][local]}
          </text>
          {local === 0 ? (
            <>
              <g transform={`translate(${w / 2} 154)`}>
                {hybrid.connected ? (
                  <path d={hybrid.path} fill="#cfbdcd" stroke="#b3a0b4" strokeWidth="2" />
                ) : (
                  [-1, 1].map((sign) => (
                    <circle
                      key={sign}
                      cx={sign * hybrid.half}
                      r={hybrid.r}
                      fill={sign < 0 ? '#c2bacd' : '#ddc5b9'}
                      stroke="#b3a0b4"
                      strokeWidth="2"
                    />
                  ))
                )}
                {[-1, 1].map((sign) => (
                  <circle
                    key={sign}
                    cx={sign * Math.max(12, hybrid.half)}
                    r="7"
                    fill={sign < 0 ? '#9387a8' : '#ba927b'}
                  />
                ))}
              </g>
              <text x={w * 0.25} y="77" textAnchor="middle">
                {s('B细胞谱系', 'B lineage')}
              </text>
              <text x={w * 0.75} y="77" textAnchor="middle">
                {s('骨髓瘤', 'Myeloma')}
              </text>
              <text x={w / 2} y="272" textAnchor="middle">
                {s('分泌抗体 + 持续增殖潜能', 'Antibody / prolonged growth')}
              </text>
            </>
          ) : local === 1 ? (
            <>
              {(['B', 'M', 'BM-target', 'BM-other'] as HybridKind[]).map((k, i) => {
                const x = w * (i % 2 ? 0.75 : 0.25),
                  y = i < 2 ? 112 : 220,
                  a = hybridSelection(k, p, hat);
                return (
                  <g key={k}>
                    <circle cx={x} cy={y} r="33" fill="#eee6e4" stroke="#c5b4bf" />
                    {cell(x, y, 14, '#c2adc5', false)}
                    <circle cx={x} cy={y} r="16" fill="#eee6e4" opacity={1 - a.survival} />
                    <text x={x} y={y + 55} textAnchor="middle">
                      {k === 'BM-target' ? 'H-A' : k === 'BM-other' ? 'H-B' : k}
                    </text>
                  </g>
                );
              })}
              <text x={w / 2} y="55" textAnchor="middle">
                {hat ? s('选择条件：HAT', 'Selection: HAT') : s('普通培养条件', 'Ordinary culture')}
              </text>
            </>
          ) : local === 2 ? (
            <>
              {[0, 1].map((i) => {
                const x = w * (i ? 0.75 : 0.25),
                  bound = i === 0,
                  q = clamp(p * 1.6);
                return (
                  <g key={i}>
                    <text x={x} y="65" textAnchor="middle">
                      {i ? 'H-B' : 'H-A'}
                    </text>
                    <path d={`M${x - 45} 89v122q45 17 90 0V89`} fill="#f1e8e5" stroke="#c2b2b9" />
                    {[-24, -8, 8, 24].map((v) => (
                      <rect key={v} x={x + v - 3} y="201" width="6" height="6" fill="#9992aa" />
                    ))}
                    {[-16, 16].map((v) => (
                      <g key={v}>
                        {antibody(
                          x + v,
                          110 + q * (bound ? 82 : 45),
                          i ? '#b4957b' : '#9687a2',
                          180,
                        )}
                      </g>
                    ))}
                    <text x={x} y="254" textAnchor="middle">
                      {bound ? s('特异结合', 'Binding') : s('未结合', 'No binding')}
                    </text>
                  </g>
                );
              })}
              <text x={w / 2} y="297" textAnchor="middle">
                {s('选择存活 ≠ 分泌所需抗体', 'Survival ≠ desired specificity')}
              </text>
            </>
          ) : (
            <>
              <g transform={`translate(${w / 2} 108)`}>
                {cell(0, 0, 15)}
                <path
                  d="M0 25v26m0 0-49 29m49-29 49 29"
                  stroke="#b7a2b8"
                  fill="none"
                  opacity={clamp(p * 3)}
                />
                {[-49, 49].map((x) => (
                  <g key={x} opacity={clamp(p * 3 - 0.6)}>
                    {cell(x, 87, 12)}
                    <g opacity={clamp(p * 3 - 1.5)}>{antibody(x, 129)}</g>
                  </g>
                ))}
              </g>
              <text x={w / 2} y="49" textAnchor="middle">
                {s('单细胞来源仍需验证', 'Verify single-cell origin')}
              </text>
              <text x={w / 2} y="275" textAnchor="middle">
                λ {lambda} · P(≥2) {(occupancy.multi * 100).toFixed(1)}%
              </text>
              <text x={w / 2} y="305" textAnchor="middle">
                {s('有限稀释不自动保证单克隆', 'Dilution ≠ monoclonality')}
              </text>
            </>
          )}
        </svg>
      )}
      {mode === 2 && local < 3 && (
        <svg
          viewBox={`0 0 ${w} 310`}
          role="img"
          aria-label={s(
            'MII纺锤体复合物移出，供体细胞在去核卵中融合，随后激活',
            'Remove the MII spindle complex, fuse a donor cell with the enucleated oocyte, then activate',
          )}
        >
          <text x={w / 2} y="27" textAnchor="middle">
            {local === 0
              ? enuc.removed
                ? s('复合物已移出', 'Complex removed')
                : s('去除纺锤体—染色体复合物', 'Remove MII spindle complex')
              : views[2][local]}
          </text>
          <g transform={`translate(${w / 2} 151)`}>
            <path
              d={arc(85, local === 0 && enuc.pore)}
              fill="none"
              stroke="#e1d3c6"
              strokeWidth="7"
            />
            {local === 1 && fuse.connected && !fuse.inside ? (
              <path d={fuse.path} fill="#eadcbe" stroke="#c8b492" strokeWidth="2" />
            ) : (
              <circle
                r={local === 1 ? fuse.R : 55}
                fill="#eadcbe"
                stroke="#c8b492"
                strokeWidth={local === 0 ? 0 : 2}
              />
            )}
            {local === 0 && (
              <path d={arc(55, enuc.pore)} fill="none" stroke="#c8b492" strokeWidth="2" />
            )}
            {enuc.mitochondria.map((a) => (
              <ellipse
                key={a.id}
                cx={a.x - enuc.cx}
                cy={a.y - enuc.cy}
                rx="3.5"
                ry="2"
                fill="#b59e7d"
              />
            ))}
            {local === 1 && (
              <>
                {!fuse.connected && <circle cx={fuse.d} r="8" fill="#c5b1c9" stroke="#aa96b0" />}
                <circle cx={fuse.nucleus.x} cy={fuse.nucleus.y} r="5" fill="#9581a4" />
              </>
            )}
            {local === 2 && (
              <>
                {p < 0.3 ? (
                  <circle cx="20" r="5" fill="#9581a4" />
                ) : p < 0.65 ? (
                  <>
                    <path d="M0 -55V55" fill="none" stroke="#c8b492" strokeWidth="1.5" />
                    {[-1, 1].map((sign) => (
                      <g key={sign}>
                        <circle cx={sign * 21} r="5" fill="#9581a4" />
                      </g>
                    ))}
                  </>
                ) : (
                  <>
                    <path d="M0-55V55M-55 0H55" stroke="#c8b492" strokeWidth="1.5" />
                    {[-1, 1].flatMap((x) =>
                      [-1, 1].map((y) => (
                        <circle key={`${x}-${y}`} cx={x * 20} cy={y * 20} r="5" fill="#9581a4" />
                      )),
                    )}
                  </>
                )}
                <path
                  d="M-12-69l12 7-8 7"
                  stroke="#baa170"
                  strokeWidth="2"
                  fill="none"
                  opacity={1 - clamp(p * 4)}
                />
              </>
            )}
          </g>
          {local === 0 && (
            <>
              <path d={`M9 145H${w / 2 - 85}v12H9`} fill="#e8ece5" stroke="#b1beb1" />
              <path
                d={`M${w} 125H${enuc.tip + 9}L${enuc.tip} 129V141L${enuc.tip + 9} 145H${w}`}
                fill="#f4f2e6"
                fillOpacity=".6"
                stroke="#acb8ae"
                strokeWidth="1.5"
              />
              <g transform={`translate(${enuc.cargo.x} ${enuc.cargo.y})`}>
                <path d="M-10 0Q0-9 10 0Q0 9-10 0" stroke="#a4a17f" fill="none" />
                {[-3, 0, 3].map((y) => (
                  <path key={y} d={`M-2 ${y - 1}l4 2m0-2-4 2`} stroke="#ab8d91" strokeWidth="1.5" />
                ))}
              </g>
            </>
          )}
          <text x={w / 2} y="281" textAnchor="middle">
            {local === 0
              ? s('去核仍保留卵细胞质', 'Egg cytoplasm retained')
              : s('紫：供体核 · 棕：卵细胞器', 'Donor nucleus / egg organelles')}
          </text>
        </svg>
      )}
      {mode === 2 && local === 3 && (
        <svg
          viewBox={`0 0 ${w} 300`}
          role="img"
          aria-label={s(
            '体细胞供体、卵供体与妊娠受体承担不同角色',
            'Somatic donor, oocyte donor and gestational recipient have distinct roles',
          )}
        >
          {[
            s('核遗传信息：体细胞供体', 'Nuclear genome: cell donor'),
            s('线粒体：主要来自卵供体', 'Mitochondria: mainly egg donor'),
            s('孕育环境：受体', 'Gestation: recipient'),
          ].map((t, i) => (
            <g key={i} opacity={clamp(p * 4 - i)}>
              <circle
                cx="39"
                cy={67 + i * 78}
                r="18"
                fill={i === 0 ? '#c6b2cc' : i === 1 ? '#dfccab' : '#d5bfc7'}
              />
              {i === 0 ? (
                <circle cx="39" cy="67" r="7" fill="#9480a2" />
              ) : i === 1 ? (
                <ellipse cx="39" cy="145" rx="9" ry="4" fill="#af9674" />
              ) : (
                <path d="M29 216q10 27 20 0m-10 14v10" stroke="#aa8e9d" fill="none" />
              )}
              <text x="66" y={62 + i * 78}>
                {t.includes('：') ? t.split('：')[0] : t.split(':')[0]}
              </text>
              <text x="66" y={87 + i * 78}>
                {t.includes('：') ? t.split('：')[1] : t.split(':')[1]}
              </text>
            </g>
          ))}
        </svg>
      )}
      {!f.watch && (
        <div className="bio-animal-cell-controls">
          <div className="bio-animal-cell-buttons">
            {titles.map((t, i) => (
              <button
                key={i}
                aria-pressed={mode === i}
                onClick={() => {
                  put({ chapter: i * 4 });
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="bio-animal-cell-buttons">
            {views[mode].map((t, i) => (
              <button
                key={i}
                aria-pressed={local === i}
                onClick={() => put({ chapter: mode * 4 + i })}
              >
                {t}
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
              value={p}
              onChange={(e) => put({ progress: +e.target.value })}
            />
          </label>
          {mode === 0 && local === 1 && (
            <>
              <button aria-pressed={attach} onClick={() => put({ adherent: !attach })}>
                {attach ? s('贴壁培养', 'Adherent') : s('悬浮培养', 'Suspension')}
              </button>
              <label>
                {s('起始细胞量（教学单位）', 'Starting cells (model units)')} {state.initial}
                <input
                  type="range"
                  min="0"
                  max="32"
                  step="1"
                  value={state.initial}
                  onChange={(e) => put({ initial: +e.target.value })}
                />
              </label>
              <label>
                {s('起始资源（教学单位）', 'Starting resources (model units)')} {state.resources}
                <input
                  type="range"
                  min="0"
                  max="64"
                  step="1"
                  value={state.resources}
                  onChange={(e) => put({ resources: +e.target.value })}
                />
              </label>
              {attach && (
                <button aria-pressed={inhibit} onClick={() => put({ contact: !inhibit })}>
                  {inhibit
                    ? s('有接触抑制', 'Contact inhibition')
                    : s('接触抑制减弱的变式', 'Reduced contact inhibition')}
                </button>
              )}
            </>
          )}
          {mode === 0 && local === 2 && (
            <div className="bio-animal-cell-prediction">
              <p>
                {s(
                  '同一拥挤起点，哪种处理新增细胞更多？',
                  'From the same crowded start, which adds more cells?',
                )}
              </p>
              <div className="bio-animal-cell-buttons">
                {comparisons.map((a, i) => (
                  <button
                    key={a.kind}
                    aria-pressed={state.prediction === a.kind}
                    onClick={() => put({ prediction: a.kind, progress: 0.55 })}
                  >
                    {
                      [
                        s('不处理', 'Unchanged'),
                        s('只换液', 'Fresh medium'),
                        s('分瓶并补液', 'Split + fresh'),
                      ][i]
                    }
                  </button>
                ))}
              </div>
              <button onClick={() => put({ progress: 0.95 })}>
                {s('检验预测', 'Test prediction')}
              </button>
              <p>
                {s(
                  '只换液与分瓶组补入等总量的新培养液。分瓶组每瓶液量减半，总表面积加倍；比较两瓶合计。教学模型不预测真实培养率。',
                  'Fresh-medium and split groups receive the same total fresh medium. Each split vessel holds half the liquid; combined surface doubles. Compare both vessels together. This model does not predict real culture rates.',
                )}
              </p>
            </div>
          )}
          {mode === 0 && local === 3 && (
            <label>
              CO₂ {gas.toFixed(1)}%
              <input
                type="range"
                min="1"
                max="10"
                step=".5"
                value={gas}
                onChange={(e) => put({ co2: +e.target.value })}
              />
            </label>
          )}
          {mode === 1 && local === 1 && (
            <button aria-pressed={hat} onClick={() => put({ hat: !hat })}>
              {hat ? s('HAT选择条件', 'HAT selection') : s('普通培养条件', 'Ordinary culture')}
            </button>
          )}
          {mode === 1 && local === 3 && (
            <label>
              {s('每孔平均接种数 λ', 'Mean cells per well λ')} {lambda}
              <input
                type="range"
                min="0"
                max="2"
                step=".1"
                value={lambda}
                onChange={(e) => put({ lambda: +e.target.value })}
              />
            </label>
          )}
          <details>
            <summary>{s('限定条件与过程记录', 'Assumptions and process record')}</summary>
            <p>
              {s(
                '这是技术过程，不是已完成的学生培养或动物实验。接触抑制并非所有细胞都有；HAT需选定的代谢缺陷骨髓瘤。有限稀释要验证克隆来源。MⅡ期去除的是纺锤体—染色体复合物；激活后成功发育并非必然。',
                'These are technical processes, not completed student or animal experiments. Contact inhibition varies by cell type; HAT assumes a chosen deficient myeloma. Dilution needs clonal-origin verification. MII enucleation removes a spindle–chromosome complex; development after activation is not guaranteed.',
              )}
            </p>
            <label>
              {s(
                '材料、条件、对照、观察与出处',
                'Material, conditions, controls, observations and source',
              )}
              <textarea value={journal} onChange={(e) => put({ journal: e.target.value })} />
            </label>
          </details>
        </div>
      )}
    </div>
  );
}
