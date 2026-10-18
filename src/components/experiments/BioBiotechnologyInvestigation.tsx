import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  investigationClamp as clamp,
  certificateExamples,
  compareCertificate,
  trainingSample,
  surveySummary,
  labelEvidence,
  marketingInference,
  planCompleteness,
  type LabelObservation,
  type SurveyRow,
} from '../../models/bio-biotechnology-investigation';
import '../../styles/bio-biotechnology-investigation.css';
export default function BioBiotechnologyInvestigation() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const [mode0, setMode] = useState(f.variant === 'bio-elective-3-105-1' ? 1 : 0),
    [view, setView] = useState(0),
    [progress, setProgress] = useState(0.7),
    [doc, setDoc] = useState(0),
    [identity, setIdentity] = useState('MON87427'),
    [use, setUse] = useState('processing'),
    [region, setRegion] = useState('South-China'),
    [date, setDate] = useState('2026-10-18'),
    [category, setCategory] = useState<'soy-oil' | 'cotton-fibre' | 'unknown'>('soy-oil'),
    [provenance, setProvenance] = useState<'gm' | 'non-gm' | 'unknown'>('gm'),
    [statement, setStatement] = useState<LabelObservation>('gm-statement'),
    [comparison, setComparison] = useState(false),
    [rows, setRows] = useState<SurveyRow[]>([
      { id: 'own-1', product: '', observation: 'not-recorded', source: '', date: '' },
    ]),
    [plan, setPlan] = useState({
      audience: '',
      question: '',
      evidence: '',
      limits: '',
      format: '',
    });
  const mode = f.watch ? (f.chapter < 3 ? 0 : 1) : mode0,
    local = f.watch ? (f.chapter < 3 ? f.chapter : f.chapter - 3) : view,
    p = clamp(f.watch ? f.chapterProgress : progress),
    di = f.watch ? (mode === 0 && local === 0 && p > 0.5 ? 1 : 0) : doc,
    d = certificateExamples[di],
    back = f.watch ? p > 0.4 : p > 0.5;
  const query = f.watch
      ? {
          id: d.id,
          use: p < 0.45 ? d.use : 'production',
          region: 'South-China',
          date: '2026-10-18',
        }
      : { id: identity, use, region, date },
    match = compareCertificate(di, query),
    summary = surveySummary(trainingSample),
    own = surveySummary(rows),
    label = labelEvidence(
      f.watch ? 'soy-oil' : category,
      f.watch ? 'gm' : provenance,
      f.watch ? (back ? 'gm-statement' : 'not-recorded') : statement,
    ),
    inference = marketingInference(true, f.watch ? false : comparison),
    cx = w / 2;
  const headings = [
      [
        s('读到具体条目', 'Read the specific record'),
        s('用途与日期的边界', 'Purpose and date boundaries'),
        s('生产过程的来源证据', 'Evidence of manufacturing origin'),
      ],
      [
        s('翻看包装与原料信息', 'Inspect packaging and ingredients'),
        s('保留缺失与抽样范围', 'Retain missing data and sample scope'),
        s('营销说法需要额外证据', 'Marketing claims need evidence'),
        s('把调查变成科普计划', 'Turn an inquiry into a plan'),
      ],
    ],
    fieldNames = [
      s('对象标识', 'Event identity'),
      s('用途', 'Purpose'),
      s('区域', 'Region'),
      s('日期', 'Date'),
    ];
  const stateText = {
    'within-record': s('四项与所选文件匹配', 'Four fields match this document'),
    mismatch: s('存在超出文件的推断', 'An inference exceeds this record'),
    incomplete: s('缺少核对信息', 'Comparison information is missing'),
  };
  const labelText = {
    'need-provenance': s('先补充原料与类别证据', 'Establish ingredient provenance first'),
    'outside-selected-catalogue': s(
      '不在本页所核对目录项内',
      'Outside the catalogue items checked here',
    ),
    'need-label-review': s('需要继续核查标识', 'Further label review needed'),
    'compare-wording-and-scope': s('继续核对用语与适用范围', 'Check wording and applicable scope'),
  };
  const updateRow = (id: string, field: keyof SurveyRow, value: string) =>
    setRows((a) => a.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  return (
    <div className="bio-biotech" ref={host} data-mode={mode} data-view={local}>
      <div className="bio-biotech-head">{headings[mode][local]}</div>
      <div className="bio-biotech-stage">
        {mode === 0 && local === 0 && (
          <div className="bio-biotech-paper">
            <strong>
              {d.id} · {s(d.cropZh, d.cropEn)}
            </strong>
            <p>{s('固定历史条目 · 2024', 'Archived record · 2024')}</p>
            {[
              s('农基安证字', 'Certificate') + ' ' + d.number,
              d.use === 'processing'
                ? s('进口 · 加工原料', 'Import · processing input')
                : s('生产应用 · 华南适宜生态区', 'Production · suitable South China zones'),
              d.from + ' → ' + d.to,
            ].map((v, i) => (
              <div className="bio-biotech-field" key={v} data-active={Math.floor(p * 6) % 3 === i}>
                {v}
              </div>
            ))}
            <p>{s('原始发布：农业农村部', 'Original publisher: MARA')}</p>
          </div>
        )}
        {mode === 0 && local === 1 && (
          <div className="bio-biotech-paper">
            <strong>{d.id}</strong>
            <p>
              {s('待检用途', 'Proposed use')}:{' '}
              {query.use === 'processing'
                ? s('加工原料', 'Processing')
                : s('生产 / 种植', 'Production / planting')}
            </p>
            {match.checks.map((c, i) => (
              <div className="bio-biotech-check" key={c.field}>
                <span
                  className="bio-biotech-mark"
                  data-state={c.match === null ? 'unknown' : String(c.match)}
                >
                  {c.match === null ? '?' : c.match ? '✓' : '×'}
                </span>
                {fieldNames[i]}
              </div>
            ))}
            <p>{stateText[match.state as keyof typeof stateText]}</p>
          </div>
        )}
        {mode === 0 && local === 2 && (
          <div className="bio-biotech-paper">
            <strong>{s('重组人胰岛素', 'Recombinant human insulin')}</strong>
            <p>FDA · 1982-10-28</p>
            {[
              s('生产方法：重组DNA', 'Method: recombinant DNA'),
              s('生产用细菌 → 胰岛素', 'Bacterial production → insulin'),
              s('产品：经制备的人胰岛素', 'Product: prepared human insulin'),
            ].map((v, i) => (
              <div
                key={v}
                className="bio-biotech-field"
                data-active={i === Math.min(2, Math.floor(p * 3))}
              >
                {v}
              </div>
            ))}
            <p>{s('历史产品资料 · 非家庭调查', 'Historical source · not a household survey')}</p>
          </div>
        )}
        {mode === 1 && local === 0 && (
          <>
            <svg
              viewBox={`0 0 ${w - 36} 250`}
              role="img"
              aria-label={s(
                '虚构包装，观察正面与背面记录',
                'Fictional packaging with front and back observations',
              )}
            >
              <path
                d={`M${cx - 87} 25 Q${cx - 18} 17 ${cx + 51} 25 L${cx + 61} 226 Q${cx - 18} 236 ${cx - 97} 226 Z`}
                fill="#ecebd4"
                stroke="#c2caae"
                strokeWidth="2"
              />
              <path d={`M${cx - 84} 35H${cx + 48}`} stroke="#b8c2a2" strokeWidth="3" />
              <text x={cx - 18} y="67" textAnchor="middle">
                {s('示意包装', 'Example package')}
              </text>
              <text x={cx - 18} y="112" textAnchor="middle">
                {f.watch || category === 'soy-oil'
                  ? s('大豆油', 'Soybean oil')
                  : category === 'cotton-fibre'
                    ? s('棉纤维', 'Cotton fibre')
                    : s('类别待核对', 'Category unknown')}
              </text>
              {back ? (
                <>
                  {(f.watch || statement === 'gm-statement'
                    ? [
                        s('加工原料为', 'Ingredient:'),
                        f.watch || category === 'soy-oil'
                          ? s('转基因大豆', 'GM soybean')
                          : category === 'cotton-fibre'
                            ? s('转基因棉花', 'GM cotton')
                            : s('原料待核对', 'Ingredient unknown'),
                      ]
                    : statement === 'non-gm-claim'
                      ? [s('非转基因宣称', 'Non-GM claim')]
                      : [s('尚未记录', 'Not recorded')]
                  ).map((v, i) => (
                    <text key={v} x={cx - 18} y={159 + i * 28} textAnchor="middle">
                      {v}
                    </text>
                  ))}
                </>
              ) : (
                <>
                  <path d={`M${cx - 34} 194q-20 -35 16 -54q22 37 -16 54`} fill="#b3c29a" />
                  <path d={`M${cx - 34} 194l16 -38`} stroke="#8da17b" fill="none" />
                </>
              )}
            </svg>
            <div>
              {back
                ? labelText[label]
                : s('外观不能确定生产方法', 'Appearance does not establish the production method')}
            </div>
          </>
        )}
        {mode === 1 && local === 1 && (
          <>
            <svg
              viewBox={`0 0 ${w - 36} 186`}
              role="img"
              aria-label={s('八条教学样本记录', 'Eight teaching sample records')}
            >
              {trainingSample.map((r, i) => {
                const ww = w - 36,
                  dx = Math.min(70, (ww - 20) / 4),
                  x = ww / 2 + ((i % 4) - 1.5) * dx,
                  y = 36 + Math.floor(i / 4) * 88,
                  col =
                    r.observation === 'gm-statement'
                      ? '#a9b88e'
                      : r.observation === 'non-gm-claim'
                        ? '#b9a9be'
                        : '#dcddd4';
                return (
                  <g key={r.id} opacity={i < Math.floor(p * 8) + 1 ? 1 : 0.2}>
                    <rect x={x - 20} y={y - 19} width="40" height="47" rx="8" fill={col} />
                    <path d={`M${x - 13} ${y - 24}h26`} stroke="#c5ccb6" strokeWidth="5" />
                    <text x={x} y={y + 8} textAnchor="middle">
                      {r.id}
                    </text>
                    <text x={x} y={y + 52} textAnchor="middle">
                      {r.observation === 'not-recorded'
                        ? '?'
                        : r.observation === 'gm-statement'
                          ? 'G'
                          : 'N'}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="bio-biotech-counters">
              {[
                [summary.labelled, s('G标识', 'G label')],
                [summary.claimed, s('N宣称', 'N claim')],
                [summary.unrecorded, s('未记录', 'Missing')],
              ].map(([n, t]) => (
                <div key={String(t)}>
                  <strong>{n}</strong>
                  {t}
                </div>
              ))}
            </div>
            <div>{s('教学样本 n=8 · 不外推市场', 'Teaching sample n=8 · no market inference')}</div>
          </>
        )}
        {mode === 1 && local === 2 && (
          <div className="bio-biotech-paper">
            <strong>{s('“非转基因，所以更安全”？', '“Non-GM, therefore safer”?')}</strong>
            <div className="bio-biotech-field">{s('包装宣称', 'Package claim')}</div>
            <div className="bio-biotech-check">
              <span className="bio-biotech-mark" data-state="unknown">
                ?
              </span>
              {s('比较对象与可比条件', 'Comparator and matched conditions')}
            </div>
            <div className="bio-biotech-check">
              <span className="bio-biotech-mark" data-state="unknown">
                ?
              </span>
              {s('风险指标与测定结果', 'Risk endpoint and measured results')}
            </div>
            <div className="bio-biotech-field" data-active={p > 0.4}>
              {inference === 'inspect-comparison-design'
                ? s('有资料仍需审查设计', 'Assess the supplied study design')
                : s('仅凭这句话不能得出比较', 'The wording alone cannot establish this comparison')}
            </div>
          </div>
        )}
        {mode === 1 && local === 3 && (
          <div className="bio-biotech-paper">
            <strong>{s('科普行动草案', 'Communication draft')}</strong>
            {[
              s('观察：如实记录包装', 'Observe: record the package'),
              s('证据：链接原始资料', 'Evidence: link original sources'),
              s('边界：说明日期与范围', 'Limits: state dates and scope'),
              s('反馈：保留疑问与纠错', 'Feedback: questions and corrections'),
            ].map((v, i) => (
              <div
                key={v}
                className="bio-biotech-field"
                data-active={i === Math.min(3, Math.floor(p * 4))}
              >
                {v}
              </div>
            ))}
            <p>{s('自己的方案在探索区填写', 'Write your plan in exploration')}</p>
          </div>
        )}
      </div>
      {!f.watch && (
        <div className="bio-biotech-controls">
          <div className="bio-biotech-buttons">
            {[
              s('证书与应用调查', 'Certificates and applications'),
              s('标识与科普调查', 'Labels and communication'),
            ].map((v, i) => (
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
          <div className="bio-biotech-buttons">
            {headings[mode].map((v, i) => (
              <button key={v} aria-pressed={local === i} onClick={() => setView(i)}>
                {v}
              </button>
            ))}
          </div>
          <label>
            {s('观察进度 / 包装翻面', 'Progress / package side')}
            <input
              type="range"
              min="0"
              max="1"
              step=".01"
              value={progress}
              onChange={(e) => setProgress(+e.target.value)}
            />
          </label>
          {mode === 0 && local < 2 && (
            <>
              <div className="bio-biotech-buttons">
                {certificateExamples.map((r, i) => (
                  <button
                    key={r.id}
                    aria-pressed={di === i}
                    onClick={() => {
                      setDoc(i);
                      setIdentity(r.id);
                      setUse(r.use);
                    }}
                  >
                    {r.id}
                  </button>
                ))}
              </div>
              {local === 1 && (
                <>
                  <label>
                    {s('待核对对象标识', 'Event identity to compare')}
                    <input value={identity} onChange={(e) => setIdentity(e.target.value)} />
                  </label>
                  <label>
                    {s('待核对用途', 'Proposed use')}
                    <select value={use} onChange={(e) => setUse(e.target.value)}>
                      <option value="processing">
                        {s('进口加工原料', 'Imported processing input')}
                      </option>
                      <option value="production">
                        {s('生产 / 种植', 'Production / planting')}
                      </option>
                    </select>
                  </label>
                  <label>
                    {s('待核对地区', 'Region')}
                    <select value={region} onChange={(e) => setRegion(e.target.value)}>
                      <option value="South-China">{s('华南', 'South China')}</option>
                      <option value="North-China">{s('华北', 'North China')}</option>
                      <option value="Other">{s('中国境外', 'Outside China')}</option>
                    </select>
                  </label>
                  <label>
                    {s('待核对日期', 'Date to compare')}
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </label>
                </>
              )}
            </>
          )}
          {mode === 1 && local === 0 && (
            <>
              <label>
                {s('产品类别', 'Product category')}
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as typeof category)}
                >
                  <option value="soy-oil">{s('大豆油', 'Soybean oil')}</option>
                  <option value="cotton-fibre">{s('棉纤维', 'Cotton fibre')}</option>
                  <option value="unknown">{s('尚未核对', 'Unknown')}</option>
                </select>
              </label>
              <label>
                {s('原料来源证据', 'Ingredient provenance evidence')}
                <select
                  value={provenance}
                  onChange={(e) => setProvenance(e.target.value as typeof provenance)}
                >
                  <option value="gm">{s('已核对为转基因来源', 'Verified GM origin')}</option>
                  <option value="non-gm">
                    {s('已核对为非转基因来源', 'Verified non-GM origin')}
                  </option>
                  <option value="unknown">{s('尚未核对', 'Unknown')}</option>
                </select>
              </label>
              <label>
                {s('包装记录', 'Package observation')}
                <select
                  value={statement}
                  onChange={(e) => setStatement(e.target.value as LabelObservation)}
                >
                  <option value="gm-statement">
                    {s('有转基因原料标识', 'GM ingredient statement')}
                  </option>
                  <option value="non-gm-claim">{s('非转基因宣称', 'Non-GM claim')}</option>
                  <option value="not-recorded">{s('尚未记录', 'Not recorded')}</option>
                </select>
              </label>
            </>
          )}
          {mode === 1 && local === 2 && (
            <button aria-pressed={comparison} onClick={() => setComparison(!comparison)}>
              {s('是否补充比较研究资料', 'Comparative study supplied')}:{' '}
              {comparison ? s('有', 'Yes') : s('无', 'No')}
            </button>
          )}
          <details>
            <summary>{s('固定资料及推断边界', 'Fixed sources and inference limits')}</summary>
            <p>
              {s(
                '两份证书条目来自2024年10月11日公布的清单，页面核对日期为2026-10-18。字段匹配仅是读文件练习，不判断后来是否变更、续发或撤销，不替代品种审定及其他许可。YK1601原文还限定华南适宜生态区。',
                'Both certificate entries come from lists published 11 October 2024, checked for this page on 18 October 2026. Field matching is a document-reading exercise; it does not establish later changes, renewal or revocation, variety registration or other permissions. YK1601 is additionally limited to suitable ecological zones in South China.',
              )}
            </p>
            <p>
              {s(
                '标识练习依据农业农村部所载2017年修订文本及其第一批目录。棉纤维不等于目录中的棉花种子；不在选定目录项内不等于豁免所有规定。包装、便利样本与营销语句都不自动构成安全性比较证据。',
                'The label exercise uses the ministry-hosted 2017 revision and its first catalogue. Cotton fibre is not the listed cotton seed; being outside selected items does not establish exemption from every rule. Packaging, convenience samples and marketing wording do not automatically establish comparative safety.',
              )}
            </p>
            <a href={d.url} target="_blank" rel="noreferrer">
              {s('查看所选证书原始清单', 'Open the selected original certificate list')}
            </a>
          </details>
          <details>
            <summary>
              {s('自己的实地记录（初始为空）', 'Your field records (initially blank)')}
            </summary>
            <p>
              {s(
                '只录入实际查到的信息。未记录与“非转基因”分开；相同产品不同照片不要重复当作独立产品。这里不会上传或自动保存记录。',
                'Enter only information actually observed. Missing data are separate from non-GM claims; duplicate photographs of one product are not independent products. Records are neither uploaded nor saved automatically.',
              )}
            </p>
            {rows.map((r, i) => (
              <div key={r.id} className="bio-biotech-record">
                <label>
                  {s('产品 / 批次', 'Product / batch')} {i + 1}
                  <input
                    value={r.product}
                    onChange={(e) => updateRow(r.id, 'product', e.target.value)}
                  />
                </label>
                <label>
                  {s('观察分类', 'Observation')}
                  <select
                    value={r.observation}
                    onChange={(e) => updateRow(r.id, 'observation', e.target.value)}
                  >
                    <option value="not-recorded">{s('未记录', 'Not recorded')}</option>
                    <option value="gm-statement">{s('有GM标识', 'GM statement')}</option>
                    <option value="non-gm-claim">{s('有非GM宣称', 'Non-GM claim')}</option>
                  </select>
                </label>
                <label>
                  {s('调查日期', 'Observation date')}
                  <input
                    type="date"
                    value={r.date}
                    onChange={(e) => updateRow(r.id, 'date', e.target.value)}
                  />
                </label>
                <label>
                  {s(
                    '标签原文、原料、出处与待核对处',
                    'Exact label, ingredient, provenance and uncertainties',
                  )}
                  <textarea
                    value={r.source}
                    onChange={(e) => updateRow(r.id, 'source', e.target.value)}
                  />
                </label>
              </div>
            ))}
            <button
              onClick={() =>
                setRows((a) => [
                  ...a,
                  {
                    id: 'own-' + (a.length + 1),
                    product: '',
                    observation: 'not-recorded',
                    source: '',
                    date: '',
                  },
                ])
              }
            >
              {s('增加实际记录', 'Add an observed record')}
            </button>
            <p>
              {s('实际已录入产品', 'Products entered')}: {own.total} ·{' '}
              {s('含来源与日期', 'With source and date')}: {own.documented}
            </p>
            <p>
              G: {own.labelled} · N: {own.claimed} · ?: {own.unrecorded}
            </p>
          </details>
          {mode === 1 && (
            <details>
              <summary>
                {s('自己的科普计划（初始为空）', 'Your communication plan (initially blank)')}
              </summary>
              {(['audience', 'question', 'evidence', 'limits', 'format'] as const).map((key, i) => (
                <label key={key}>
                  {
                    [
                      s('面向谁', 'Audience'),
                      s('要解释的问题', 'Question'),
                      s('原始证据与链接', 'Original evidence and links'),
                      s('结论范围和未解决问题', 'Scope and unresolved questions'),
                      s('呈现形式、地点与反馈方式', 'Format, setting and feedback'),
                    ][i]
                  }
                  <textarea
                    value={plan[key]}
                    onChange={(e) => setPlan((a) => ({ ...a, [key]: e.target.value }))}
                  />
                </label>
              ))}
              <p>
                {s('尚未填写的项目', 'Unfilled fields')}: {planCompleteness(plan).length}/5
              </p>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
