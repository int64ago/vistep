import { useEffect, useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  plantCellClamp as clamp,
  fusionGeometry,
  plantCellDirector,
  plantCellMeasuredDirector,
  regenerationSequence,
  regenerationResponse,
  regenerationIntervention,
  type PlantCellSnapshot,
  hormoneResponse,
  explantRate,
} from '../../models/bio-plant-cell-engineering';
import '../../styles/bio-plant-cell-engineering.css';
export default function BioPlantCellEngineering() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    uid = useId(),
    s = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
  const variants = ['bio-elective-3-035-1', 'bio-elective-3-036-1', 'bio-elective-3-037-1'];
  const [manual, setManual] = useState<PlantCellSnapshot | null>(null);
  const initialChapter =
    !f.watch && f.chapter === 0 && f.variant
      ? [0, 4, 8][Math.max(0, variants.indexOf(f.variant))]
      : f.chapter;
  const directed = plantCellMeasuredDirector(
      initialChapter,
      f.chapterProgress,
      f.chapterTime,
      browserLocale() === 'en',
    ),
    state = f.watch ? directed : (manual ?? directed),
    put = (patch: Partial<PlantCellSnapshot>) => setManual({ ...state, ...patch }),
    {
      chapter,
      progress: p,
      contaminated: contamination,
      competence,
      aux,
      cyt,
      total,
      shootCount,
      rootCount,
      journal,
      prediction,
    } = state,
    mode = chapter < 4 ? 0 : chapter < 8 ? 1 : 2,
    local = chapter - [0, 4, 8][mode],
    sequence = regenerationSequence(p, competence),
    resultProgress = local === 3 ? clamp((p - 0.45) / 0.55) : clamp((p - 0.25) / 0.75),
    revealed = local !== 3 || p >= 0.45,
    g = fusionGeometry(
      w,
      local === 0 ? 0 : local === 1 ? p : 1,
      local === 2 ? p : local > 2 ? 1 : 0,
    ),
    wall = local === 0 ? 1 - p : local === 2 ? clamp((p - 0.5) * 2) : 0;
  useEffect(() => {
    if (!f.watch && manual === null) setManual({ ...directed });
  }, [f.watch, manual, directed]);
  const selectChapter = (next: number) =>
    put({ ...plantCellDirector(next, p), total, shootCount, rootCount, journal });
  const titles = [
      s('再生与细胞状态', 'Regeneration and cell state'),
      s('从原生质体到杂种证据', 'Protoplasts and hybrid evidence'),
      s('配比之外，还看浓度', 'Ratio and absolute concentration'),
    ],
    views = [
      [
        s('再生现象', 'Regeneration'),
        s('比较解释', 'Compare explanations'),
        s('条件与分化', 'Conditions and fate'),
        s('预测与检验', 'Predict and compare'),
      ],
      [
        s('去除细胞壁', 'Remove walls'),
        s('原生质体融合', 'Protoplast fusion'),
        s('核融合与再生壁', 'Nuclei and new walls'),
        s('验证与性状', 'Evidence and traits'),
      ],
      [
        s('无外源激素对照', 'No added hormones'),
        s('改变配比', 'Change the ratio'),
        s('相同比例，不同浓度', 'Same ratio, different doses'),
      ],
    ];
  const leaf = (x: number, y: number, side: number, scale = 1) => (
    <g transform={`translate(${x} ${y}) scale(${side * scale} ${scale})`}>
      <path d="M0 0Q19-22 30-12Q22 4 0 0Z" fill="#9cb180" />
      <path d="M0 0l24-11" stroke="#dce4c6" fill="none" />
    </g>
  );
  const plant = (x: number, y: number, shoot: number, root: number, callus: number, scale = 1) => (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {Array.from({ length: 15 }, (_, i) => {
        const a = i * 2.4,
          r = Math.sqrt((i + 0.5) / 15) * 20 * callus;
        return (
          <ellipse
            key={i}
            cx={r * Math.cos(a)}
            cy={r * 0.6 * Math.sin(a)}
            rx={4 + callus * 3}
            ry={3 + callus * 3}
            opacity={clamp(callus * 8)}
            fill={i % 2 ? '#c3c58d' : '#d0cd99'}
            stroke="#b3ba86"
          />
        );
      })}
      <path
        d={`M0 0Q${-5 * shoot} ${-36 * shoot} ${3 * shoot} ${-91 * shoot}`}
        stroke="#8da878"
        strokeWidth="4"
        fill="none"
      />
      {shoot > 0.05 && (
        <>
          {leaf(0, -30 * shoot, -1, shoot)}
          {leaf(0, -53 * shoot, 1, shoot)}
          {leaf(2 * shoot, -76 * shoot, -1, shoot * 0.7)}
        </>
      )}
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M0 8Q${(i - 2) * 7 * root} ${25 * root + 8} ${(i - 2) * 12 * root} ${48 * root + 8}m${-(i - 2) * 2 * root} ${-14 * root}l${(i % 2 ? 7 : -7) * root} ${7 * root}`}
          fill="none"
          stroke="#baa57e"
          strokeWidth="1.5"
        />
      ))}
    </g>
  );
  return (
    <div
      className="bio-plant-cell"
      data-watch={f.watch}
      data-chapter={chapter}
      data-snapshot={JSON.stringify(state)}
      ref={host}
    >
      <div className="bio-plant-cell-head">{mode === 2 ? views[2][local] : titles[mode]}</div>
      {mode === 0 && (
        <svg
          viewBox={`0 0 ${w} 288`}
          role="img"
          data-tissue-shot={local}
          aria-label={s(
            '从再生证据比较遗传信息与表达状态，再用相同来源材料检验条件改变的预测',
            'Use regeneration evidence to distinguish information from its use, then compare matched tissue under changed conditions',
          )}
        >
          {local === 0 && (
            <>
              <text x={w / 2} y="24" textAnchor="middle">
                {s('一段组织，长出芽和根', 'One explant, new organs')}
              </text>
              <path
                d={`M${w / 2 - 48} 54v26l-17 24v119q0 14 14 14h102q14 0 14-14V104l-17-24V54`}
                fill="#f3f4e6"
                stroke="#afbea5"
                strokeWidth="2"
              />
              <path d={`M${w / 2 - 63} 192h126v30q0 12-12 12h-102q-12 0-12-12Z`} fill="#dce0bc" />
              <path
                d={`M${w / 2 - 48} 53h96`}
                stroke="#bfceb1"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path d={`M${w / 2 - 4} 159h8v37h-8Z`} fill="#93aa7a" />
              {plant(w / 2, 186, sequence.shoot, sequence.root * 0.67, sequence.callus)}
              <g data-lineage="L1">
                <circle cx={w / 2} cy="189" r="5" fill="#a8874e" />
                <path d={`M${w / 2 + 5} 189h26`} stroke="#a8874e" />
                <text x={w / 2 + 35} y="194">
                  L1
                </text>
              </g>
              <text x={w / 2} y="263" textAnchor="middle">
                {sequence.phase === 'callus'
                  ? s('形成愈伤组织', 'Callus forms')
                  : sequence.phase === 'shoot'
                    ? s('条件改变，诱导生芽', 'New conditions: shoots')
                    : s('再诱导生根，得到幼苗', 'Root induction: a plantlet')}
              </text>
            </>
          )}
          {local === 1 && (
            <>
              <text x={w / 2} y="24" textAnchor="middle">
                {s('先比较两种假说', 'Compare two hypotheses')}
              </text>
              {[0, 1].map((i) => {
                const x = w * (i ? 0.75 : 0.25),
                  active = clamp((p - 0.35) / 0.5);
                return (
                  <g key={i} data-candidate={i ? 'retained-information' : 'necessary-loss'}>
                    <text x={x} y="57" textAnchor="middle">
                      {i
                        ? s('改变使用状态', 'Different use')
                        : s('必然丢失信息', 'Information lost')}
                    </text>
                    <ellipse cx={x} cy="103" rx="57" ry="32" fill="#e9ebdb" stroke="#b7bca3" />
                    {['I1', 'I2', 'I3'].map((id, k) => (
                      <g key={id} data-information={id}>
                        <circle
                          cx={x + (k - 1) * 31}
                          cy="103"
                          r="13"
                          fill={i || k === 0 ? '#d4dbc2' : '#eee9dd'}
                          stroke="#9fa992"
                        />
                        <text x={x + (k - 1) * 31} y="109" textAnchor="middle">
                          {id}
                        </text>
                        {!i && k > 0 && (
                          <path
                            d={`M${x + (k - 1) * 31 - 10} 92l20 22`}
                            stroke="#b48573"
                            strokeWidth="2"
                          />
                        )}
                      </g>
                    ))}
                    <path
                      d={`M${x} 141v8m-5-5 5 5 5-5`}
                      fill="none"
                      stroke="#aeb59e"
                      strokeWidth="2"
                    />
                    {i ? (
                      plant(x, 210, active * 0.58, active * 0.25, 0.55)
                    ) : (
                      <path d={`M${x - 4} 184h8v34h-8Z`} fill="#acb998" />
                    )}
                    <text x={x} y="249" textAnchor="middle" opacity={clamp((p - 0.52) * 6)}>
                      {i
                        ? s('与再生相容', 'Fits regeneration')
                        : s('无法解释再生', 'Does not explain')}
                    </text>
                  </g>
                );
              })}
              <text x={w / 2} y="277" textAnchor="middle">
                {s('不能证明每个细胞都全能', 'Not proof for every cell')}
              </text>
            </>
          )}
          {local >= 2 && (
            <>
              <text x={w / 2} y="24" textAnchor="middle">
                {s('生长素 : 细胞分裂素', 'Auxin : cytokinin')}
              </text>
              {[0, 1].map((i) => {
                const x = w * (i ? 0.75 : 0.25),
                  a = i ? aux : 0.5,
                  c = i ? cyt : 3,
                  response =
                    local === 3
                      ? regenerationIntervention(a, c, resultProgress, competence)
                      : regenerationResponse(a, c, resultProgress, competence),
                  shown = i === 0 || revealed,
                  activity = clamp(p / 0.25);
                return (
                  <g
                    key={i}
                    data-cohort={i ? 'comparison' : 'control'}
                    data-aux={a}
                    data-cyt={c}
                    data-shoot={response.shoot}
                    data-root={response.root}
                  >
                    <text x={x} y="52" textAnchor="middle">
                      {i ? s('同源 B', 'Matched B') : s('同源 A', 'Matched A')}
                    </text>
                    <text x={x} y="76" textAnchor="middle">
                      {a} : {c}
                    </text>
                    {response.information.map((id, k) => (
                      <g key={id} data-information={id} data-expression={response.expression[k]}>
                        <rect
                          x={x + (k - 1) * 31 - 12}
                          y="93"
                          width="24"
                          height="23"
                          rx="7"
                          fill="#e8ecdc"
                          stroke="#acb698"
                        />
                        <rect
                          x={x + (k - 1) * 31 - 12}
                          y="93"
                          width="24"
                          height="23"
                          rx="7"
                          fill={k === 2 ? '#bda57d' : '#90a578'}
                          opacity={response.expression[k] * activity}
                        />
                        <text x={x + (k - 1) * 31} y="110" textAnchor="middle">
                          {id}
                        </text>
                      </g>
                    ))}
                    <path
                      d={`M${x} 125v15m-5-5 5 5 5-5`}
                      fill="none"
                      stroke="#aeb59e"
                      strokeWidth="2"
                    />
                    <path d={`M${x - 49} 220h98v12q-49 15-98 0Z`} fill="#e0e1c4" />
                    {shown ? (
                      plant(x, 210, response.shoot * 0.86, response.root * 0.63, response.callus)
                    ) : (
                      <>
                        {plant(
                          x,
                          210,
                          regenerationIntervention(a, c, 0, competence).initialShoot * 0.86,
                          0,
                          0.55,
                        )}
                        <text x={x + 41} y="182" textAnchor="middle" className="pc-question">
                          ?
                        </text>
                      </>
                    )}
                    <circle cx={x} cy="212" r="4" fill="#a8874e" />
                    <text x={x} y="260" textAnchor="middle">
                      {!shown
                        ? s('先预测', 'Predict first')
                        : competence === 0
                          ? s('无新生器官', 'No new organs')
                          : local === 3
                            ? response.root >
                              regenerationIntervention(0.5, 3, resultProgress, competence).root +
                                1e-6
                              ? s('根较多', 'More new roots')
                              : s('根较少', 'Few new roots')
                            : response.shoot > response.root
                              ? s('偏向芽', 'Shoot tendency')
                              : s('偏向根', 'Root tendency')}
                    </text>
                  </g>
                );
              })}
              <text x={w / 2} y="277" textAnchor="middle">
                {local === 2
                  ? s('I2：芽 · I3：根（表达示意）', 'I2: shoots · I3: roots (model)')
                  : s('器官形成 ≠ 移栽成活', 'Organs ≠ transplant survival')}
              </text>
            </>
          )}
          {contamination && (
            <g>
              <rect x="8" y="130" width={w - 16} height="48" rx="14" fill="#f1e6d7" opacity=".96" />
              <text x={w / 2} y="160" textAnchor="middle">
                {s('污染：不能作有效推断', 'Contaminated: no valid inference')}
              </text>
            </g>
          )}
        </svg>
      )}
      {mode === 1 && local < 3 && (
        <svg
          viewBox={`0 0 ${w} 302`}
          role="img"
          aria-label={s(
            '两来源原生质体先接触再形成连续膜，核来源标记保持在细胞内',
            'Two protoplasts contact before forming a continuous membrane; nuclear origin labels remain inside',
          )}
        >
          <text x={w / 2} y="27" textAnchor="middle">
            {local === 0
              ? s('去壁仍保留细胞膜', 'Remove walls, retain membranes')
              : local === 1
                ? s('先接触，再形成共同边界', 'Contact, then a common boundary')
                : s('核来源与细胞壁再生', 'Nuclear origin and wall regrowth')}
          </text>
          <g transform={`translate(${g.cx} ${g.cy}) rotate(${g.vertical ? 90 : 0})`}>
            {!g.body.connected ? (
              [-1, 1].map((sign) => (
                <circle
                  key={sign}
                  cx={sign * g.body.half}
                  r={g.body.r}
                  fill={sign < 0 ? '#d9e3bb' : '#e1d5bc'}
                  stroke="#9cb38c"
                  strokeWidth="2"
                />
              ))
            ) : (
              <path d={g.body.path} fill="#dce1bd" stroke="#9cb38c" strokeWidth="2" />
            )}
            {wall > 0 &&
              (!g.body.connected ? (
                [-1, 1].map((sign) => (
                  <circle
                    key={sign}
                    cx={sign * g.body.half}
                    r={g.body.r + 5}
                    stroke="#bdc6a1"
                    strokeWidth="6"
                    strokeDasharray={local === 0 && p > 0.2 ? '7 4' : undefined}
                    fill="none"
                    opacity={wall}
                  />
                ))
              ) : (
                <path
                  d={g.body.path}
                  transform="scale(1.1)"
                  stroke="#bdc6a1"
                  strokeWidth="7"
                  fill="none"
                  opacity={wall}
                />
              ))}
            {g.organelles.map((a) => (
              <ellipse
                key={a.id}
                cx={a.localX}
                cy={a.localY}
                rx="4"
                ry="2.4"
                fill={a.group ? '#b2a879' : '#95ae7e'}
              />
            ))}
            {g.nuc.connected ? (
              <path d={g.nuc.path} fill="#d2c6c6" stroke="#b7a8b4" />
            ) : (
              [-1, 1].map((sign) => (
                <circle
                  key={sign}
                  cx={sign * g.ns}
                  r="9"
                  fill={sign < 0 ? '#c5c3d4' : '#dcc1b3'}
                  stroke="#b5a3b3"
                />
              ))
            )}
            {g.markers.map((a) => (
              <path
                key={a.id}
                d={`M${a.localX - 2} ${a.localY - 2}q4 2 0 4`}
                stroke={a.group ? '#b28a74' : '#918da9'}
                strokeWidth="2"
                fill="none"
              />
            ))}
          </g>
          <text x={w / 2} y="281" textAnchor="middle">
            {s('两种颜色：核内来源标记', 'Two colours: nuclear-origin labels')}
          </text>
        </svg>
      )}
      {mode === 1 && local === 3 && (
        <svg
          viewBox={`0 0 ${w} 298`}
          role="img"
          aria-label={s(
            '核来源证据与期待整株性状分别判断',
            'Nuclear-source evidence is distinct from desired whole-plant traits',
          )}
        >
          <text x={w / 2} y="27" textAnchor="middle">
            {s('融合成功 ≠ 性状如愿组合', 'Fusion ≠ desired trait combination')}
          </text>
          {plant(w / 2, 195, 0.85 * clamp(p * 2), 0.85 * clamp(p * 2), 0.4)}
          <rect x={w / 2 - 48} y="223" width="96" height="30" rx="8" fill="#e7e4d0" />
          {[0, 1].map((i) => (
            <g key={i}>
              <circle cx={w / 2 - 22 + i * 44} cy="238" r="7" fill={i ? '#b28a74' : '#918da9'} />
              <text x={w / 2 - 22 + i * 44} y="279" textAnchor="middle">
                {i ? 'B' : 'A'}
              </text>
            </g>
          ))}
          <text x={w / 2} y="61" textAnchor="middle">
            {s('核编码产物证据：两亲本', 'Nuclear products: both parents')}
          </text>
        </svg>
      )}
      {mode === 2 && (
        <svg
          viewBox={`0 0 ${w} 300`}
          role="img"
          aria-label={s(
            '不同激素配比和总浓度的教学响应对照',
            'Illustrative responses to hormone ratio and total concentration',
          )}
        >
          <text x={w / 2} y="25" textAnchor="middle">
            {s('生长素 / 细胞分裂素', 'Auxin / cytokinin')}
          </text>
          {(local === 2
            ? [
                [0, 0],
                [0.1, 0.1],
                [1, 1],
                [aux, cyt],
              ]
            : [
                [0, 0],
                [1, 1],
                [3, 0.5],
                [aux, cyt],
              ]
          )
            .filter((_, i) => local !== 0 || i < 2)
            .map(([a, c], i) => {
              const x = w * (i % 2 ? 0.75 : 0.25),
                y = local === 0 ? 165 : i < 2 ? 124 : 248,
                v = hormoneResponse(a, c),
                amount = clamp(p * 2);
              return (
                <g key={i}>
                  <path
                    d={`M${x - 38} ${y - 77}v84q38 16 76 0v-84`}
                    fill="#f1f3e4"
                    stroke="#b8c3aa"
                  />
                  <path d={`M${x - 36} ${y - 7}h72v12q-36 12-72 0Z`} fill="#d7dcb6" />
                  {plant(x, y - 14, v.shoot * amount, v.root * amount, v.callus * amount, 0.52)}
                  <text x={x} y={y + 36} textAnchor="middle">
                    {a} / {c}
                  </text>
                </g>
              );
            })}
        </svg>
      )}
      {!f.watch && (
        <div className="bio-plant-cell-controls">
          <div className="bio-plant-cell-buttons">
            {titles.map((x, i) => (
              <button
                key={i}
                aria-pressed={mode === i}
                onClick={() => {
                  selectChapter([0, 4, 8][i]);
                }}
              >
                {x}
              </button>
            ))}
          </div>
          <div className="bio-plant-cell-buttons">
            {views[mode].map((x, i) => (
              <button
                key={i}
                aria-pressed={local === i}
                onClick={() => {
                  selectChapter([0, 4, 8][mode] + i);
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
              value={p}
              onChange={(e) => put({ progress: +e.target.value })}
            />
          </label>
          {mode === 0 && (
            <button
              aria-pressed={contamination}
              onClick={() => put({ contaminated: !contamination })}
            >
              {contamination
                ? s('污染观察变式', 'Contaminated observation')
                : s('清洁培养变式', 'Clean culture example')}
            </button>
          )}
          {((mode === 2 && local > 0) || (mode === 0 && local >= 2)) && (
            <>
              <label>
                {s('比较组：生长素（相对浓度）', 'Comparison: auxin (relative dose)')} {aux}
                <input
                  type="range"
                  min="0"
                  max="12"
                  step=".1"
                  value={aux}
                  onChange={(e) => put({ aux: +e.target.value })}
                />
              </label>
              <label>
                {s('比较组：细胞分裂素', 'Comparison: cytokinin')} {cyt}
                <input
                  type="range"
                  min="0"
                  max="12"
                  step=".1"
                  value={cyt}
                  onChange={(e) => put({ cyt: +e.target.value })}
                />
              </label>
              <div className="bio-plant-cell-records">
                {[
                  [total, 'total', s('实际接种总数', 'Actual explants')],
                  [shootCount, 'shootCount', s('生芽外植体数', 'Explants with shoots')],
                  [rootCount, 'rootCount', s('生根外植体数', 'Explants with roots')],
                ].map(([v, set, label], i) => (
                  <label key={i}>
                    {label as string}
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={v as string}
                      onChange={(e) => put({ [set as string]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
              <p>
                {s('个人生芽 / 生根比例', 'Own shoot / root fractions')}:{' '}
                {explantRate(shootCount, total)?.toFixed(2) ?? '—'} /{' '}
                {explantRate(rootCount, total)?.toFixed(2) ?? '—'}
              </p>
            </>
          )}
          {mode === 0 && local >= 2 && (
            <>
              <button
                aria-pressed={competence === 0}
                onClick={() => put({ competence: competence === 0 ? 1 : 0 })}
              >
                {competence === 0
                  ? s('示意材料：响应不足', 'Illustrative tissue: unresponsive')
                  : s('示意材料：可响应', 'Illustrative tissue: responsive')}
              </button>
              {local === 3 && (
                <div className="bio-plant-cell-prediction">
                  <p>
                    {s(
                      '同来源、同营养、同培养时长；只改比较组的激素条件。',
                      'Match source, nutrition and culture duration; change only the comparison signals.',
                    )}
                  </p>
                  <div className="bio-plant-cell-buttons">
                    {(['shoot', 'root'] as const).map((choice) => (
                      <button
                        key={choice}
                        aria-pressed={prediction === choice}
                        onClick={() => put({ prediction: choice, progress: 0.3 })}
                      >
                        {choice === 'shoot'
                          ? s('预测根较少', 'Predict few roots')
                          : s('预测根较多', 'Predict more roots')}
                      </button>
                    ))}
                    <button onClick={() => put({ progress: 1 })}>
                      {s('检验预测', 'Test prediction')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          <details>
            <summary>{s('模型边界与培养记录', 'Model boundaries and records')}</summary>
            <p>
              {s(
                'I1、I2、I3 是遗传信息的示意符号，色深表示示意表达状态，不是三个真实基因的测量。组织再生不能证明其中每个细胞都全能；愈伤组织也并非回到完全相同的空白状态。过程压缩不代表固定天数。配比响应是教学假设，不是菊花的剂量处方；相同比例还受绝对浓度、外植体和基因型影响。融合图守恒的是二维图示面积，颜色是来源标记，不是真实染料、染色体数量或测量结果。',
                'I1, I2 and I3 are information symbols; shading illustrates expression rather than measurements of three real genes. Regeneration of tissue does not establish that each cell is totipotent, and callus is not a uniform blank state. Compressed stages are not fixed durations. Hormone responses are illustrative, not a chrysanthemum recipe. Absolute dose, explant and genotype also matter. Fusion conserves illustrated2-D area; colours mark origin, not actual dyes, chromosome numbers or measurements.',
              )}
            </p>
            <label>
              {s(
                '材料、条件、污染、分化与移栽记录',
                'Materials, conditions, contamination, differentiation and transplant record',
              )}
              <textarea value={journal} onChange={(e) => put({ journal: e.target.value })} />
            </label>
          </details>
        </div>
      )}
    </div>
  );
}
