import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  proteinClamp as clamp,
  insulinEvidence,
  backTranslation,
  enzymeEvidence,
  association,
  projectedInsulin,
  matureComparison,
  segmentEvidence,
  parseProteinFasta,
  globalAlignment,
} from '../../models/bio-protein-design';
import '../../styles/bio-protein-design.css';
export default function BioProteinDesign() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const variants = ['bio-elective-3-mechanism-27', 'bio-elective-3-095-1', 'bio-elective-3-096-1'];
  const [mode0, setMode] = useState(Math.max(0, variants.indexOf(f.variant ?? ''))),
    [view, setView] = useState(0),
    [progress, setProgress] = useState(0.7),
    [choice, setChoice] = useState(0),
    [temp, setTemp] = useState(70),
    [angle, setAngle] = useState(0.7),
    [analogue, setAnalogue] = useState(false),
    [conc, setConc] = useState(1),
    [species, setSpecies] = useState(2),
    [window, setWindow] = useState(0),
    [aText, setA] = useState(''),
    [bText, setB] = useState(''),
    [notes, setNotes] = useState('');
  const mode = f.watch ? Math.min(2, Math.floor(f.chapter / 3)) : mode0,
    local = f.watch ? f.chapter % 3 : view,
    p = clamp(f.watch ? f.chapterProgress : progress),
    cx = w / 2;
  const index = f.watch ? Math.min(31, Math.floor(p * 32)) : choice,
    T = f.watch ? 20 + 50 * p : temp,
    C = f.watch ? 0.1 + 4.9 * p : conc,
    sp = f.watch ? (p < 0.45 ? 1 : 2) : species,
    wi = f.watch ? (p < 0.5 ? 0 : 1) : window;
  const codons = backTranslation(index),
    points = projectedInsulin(w, f.watch ? 0.3 + p * 1.2 : angle, f.watch ? false : analogue),
    records = insulinEvidence.sequences,
    record = records[sp],
    comparison = matureComparison(sp);
  const names = [
      s('设计与验证', 'Design and validation'),
      s('胰岛素改造证据', 'Insulin-engineering evidence'),
      s('网络序列分析', 'Sequence evidence online'),
    ],
    views = [
      [
        s('从目标到验证', 'From objective to test'),
        s('一种肽，多种DNA', 'One peptide, many DNAs'),
        s('条件改变评价', 'Conditions change the ranking'),
      ],
      [
        s('真实结构坐标', 'Measured structure coordinates'),
        s('B28与B29', 'B28 and B29'),
        s('关联与浓度', 'Association and concentration'),
      ],
      [
        s('版本与成熟链', 'Versions and mature chains'),
        s('同源位置比较', 'Compare homologous positions'),
        s('一致性与覆盖度', 'Identity and coverage'),
      ],
    ];
  const plot = (kind: 'enzyme' | 'association') => {
    const left = 38,
      right = w - 22,
      top = 55,
      bottom = 222,
      max = kind === 'enzyme' ? 0.55 : 1,
      x = (n: number) => left + (right - left) * n,
      y = (n: number) => bottom - ((bottom - top) * n) / max,
      colors = ['#a78eb1', '#8ca67c'];
    const value = (j: number, n: number) =>
      kind === 'enzyme'
        ? enzymeEvidence(n * 20, T)[j].activity
        : association(0.001 + n * 9.999, j === 0 ? 4 : 0.4).monomerFraction!;
    const mark = kind === 'enzyme' ? p : C / 10;
    return (
      <>
        <path d={`M${left} ${top}V${bottom}H${right}`} stroke="#c9c7b7" fill="none" />
        <text x={left} y="30">
          {kind === 'enzyme'
            ? s('相对活性 · 合成数据', 'Activity · synthetic')
            : s('单体所占比例 · 示意', 'Monomer fraction')}
        </text>
        {[0, 1].map((j) => (
          <g key={j}>
            <path
              d={Array.from(
                { length: 101 },
                (_, i) => `${i ? 'L' : 'M'}${x(i / 100)} ${y(value(j, i / 100))}`,
              ).join(' ')}
              fill="none"
              stroke={colors[j]}
              strokeWidth="3"
            />
            <circle cx={x(mark)} cy={y(value(j, mark))} r="5" fill={colors[j]} />
            <text x={left + j * (right - left) * 0.53} y="278" style={{ fill: colors[j] }}>
              {kind === 'enzyme'
                ? `${j ? 'B' : 'A'}: ${value(j, mark).toFixed(3)}`
                : `K=${j ? 0.4 : 4}`}
            </text>
          </g>
        ))}
        <path d={`M${x(mark)} ${top}V${bottom}`} stroke="#b9b9a4" strokeDasharray="3 4" />
        <text x={left} y="244">
          0
        </text>
        <text x={right} y="244" textAnchor="end">
          {kind === 'enzyme' ? '20 min' : s('10 浓度单位', '10 conc. units')}
        </text>
        <text x={cx} y="310" textAnchor="middle">
          {kind === 'enzyme'
            ? `${T.toFixed(0)} °C · t=${(p * 20).toFixed(1)} min`
            : `C = ${C.toFixed(2)} · C = M + 2D`}
        </text>
      </>
    );
  };
  const sequence = (a: string, b: string, start: number, chain: string) => {
    const n = 10,
      dx = Math.min(23, (w - 54) / n),
      left = cx - dx * 4.5;
    return (
      <>
        {[a, b].map((seq, row) => (
          <g key={row}>
            <text x={left - dx * 0.44} y={92 + row * 108}>
              {row === 0 ? s('人', 'Human') : s(sp === 1 ? '猪' : '牛', sp === 1 ? 'Pig' : 'Cow')} ·{' '}
              {chain}
            </text>
            {seq
              .slice(start, start + n)
              .split('')
              .map((v, i) => (
                <g key={i}>
                  <rect
                    x={left + i * dx - dx * 0.44}
                    y={108 + row * 108}
                    width={dx * 0.88}
                    height="34"
                    rx="7"
                    fill={a[start + i] === b[start + i] ? '#ecebdc' : '#dbd2aa'}
                  />
                  <text x={left + i * dx} y={131 + row * 108} textAnchor="middle">
                    {v}
                  </text>
                  {row === 0 && (
                    <text x={left + i * dx} y="167" textAnchor="middle" style={{ fontSize: 16 }}>
                      {i + start + 1}
                    </text>
                  )}
                </g>
              ))}
          </g>
        ))}
        <text x={cx} y="282" textAnchor="middle">
          {comparison.matches}/{comparison.length} · {(comparison.identity * 100).toFixed(2)}%
        </text>
      </>
    );
  };
  const ownA = parseProteinFasta(aText),
    ownB = parseProteinFasta(bText),
    own = ownA && ownB ? globalAlignment(ownA, ownB) : null;
  return (
    <div className="bio-protein" ref={host} data-mode={mode} data-view={local}>
      <div className="bio-protein-head">{views[mode][local]}</div>
      <svg viewBox={`0 0 ${w} 330`} role="img" aria-label={views[mode][local]}>
        {mode === 0 && local === 0 && (
          <>
            {[
              s('预期功能', 'Desired function'),
              s('结构与氨基酸假设', 'Structure / sequence'),
              s('基因设计与表达', 'Design and expression'),
              s('实测功能与修正', 'Measure and revise'),
            ].map((text, i) => (
              <g key={text} opacity={p * 4 >= i ? 1 : 0.3}>
                <rect
                  x="24"
                  y={21 + i * 72}
                  width={w - 48}
                  height="48"
                  rx="24"
                  fill={i === 3 ? '#e3e5cd' : '#efeee2'}
                />
                <text x={cx} y={51 + i * 72} textAnchor="middle">
                  {text}
                </text>
                {i < 3 && (
                  <path
                    d={`M${cx} ${73 + i * 72}v15m-4 -4l4 4l4 -4`}
                    stroke="#a7ae8e"
                    fill="none"
                  />
                )}
              </g>
            ))}
          </>
        )}
        {mode === 0 && local === 1 && (
          <>
            <text x={cx} y="35" textAnchor="middle">
              Ala · Trp · Lys · Glu · Phe
            </text>
            {codons.codons.map((c, i) => {
              const row = w < 410 ? Math.floor(i / 3) : 0,
                col = w < 410 ? i % 3 : i,
                columns = w < 410 ? (row ? 2 : 3) : 5,
                dx = Math.min(95, (w - 32) / columns),
                x = cx + (col - (columns - 1) / 2) * dx;
              return (
                <g key={i}>
                  <text x={x} y={86 + row * 100} textAnchor="middle">
                    {'AWKEF'[i]}
                  </text>
                  <path d={`M${x} ${96 + row * 100}v16`} stroke="#b3b69b" />
                  <rect
                    x={x - 31}
                    y={118 + row * 100}
                    width="62"
                    height="34"
                    rx="12"
                    fill="#e4e5cf"
                  />
                  <text x={x} y={141 + row * 100} textAnchor="middle">
                    {c}
                  </text>
                </g>
              );
            })}
            <text x={cx} y="290" textAnchor="middle">
              {s('编码链', 'Coding strand')} 5′ → 3′
            </text>
            <text x={cx} y="318" textAnchor="middle">
              {index + 1} / {codons.possibilities}
            </text>
          </>
        )}
        {mode === 0 && local === 2 && plot('enzyme')}
        {mode === 1 && local === 0 && (
          <>
            <text x={cx} y="28" textAnchor="middle">
              {f.watch || !analogue ? '1TRZ' : '1LPH'} · A:21 / B:30
            </text>
            {(['A', 'B'] as const).map((chain) => {
              const a = points.filter((x) => x.chain === chain && x.atom === 'CA');
              return (
                <polyline
                  key={chain}
                  points={a.map((x) => `${x.x},${x.y}`).join(' ')}
                  stroke={chain === 'A' ? '#9dae91' : '#b09bb9'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              );
            })}
            {[
              ['A6', 'A11'],
              ['A7', 'B7'],
              ['A20', 'B19'],
            ].map(([a, b]) => {
              const A = points.find((x) => x.id === a + '-SG')!,
                B = points.find((x) => x.id === b + '-SG')!;
              return (
                <g key={a}>
                  <path d={`M${A.x} ${A.y}L${B.x} ${B.y}`} stroke="#c2a458" strokeWidth="3" />
                  {[A, B].map((v) => {
                    const ca = points.find((x) => x.id === v.chain + v.residue + '-CA')!;
                    return (
                      <path
                        key={v.id}
                        d={`M${ca.x} ${ca.y}L${v.x} ${v.y}`}
                        stroke="#c2a458"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                    );
                  })}
                </g>
              );
            })}
            {points
              .filter((a) => a.chain === 'B' && a.atom === 'CA' && [28, 29].includes(a.residue))
              .map((a) => (
                <circle
                  key={a.id}
                  cx={a.x}
                  cy={a.y}
                  r="7"
                  fill="#d8bd72"
                  stroke="#fcfbef"
                  strokeWidth="2"
                />
              ))}
            <text x={cx} y="287" textAnchor="middle">
              {s('三条二硫键 · 金色', 'Three disulfides · gold')}
            </text>
            <text x={cx} y="316" textAnchor="middle">
              {s('Cα骨架投影', 'Cα backbone projection')}
            </text>
          </>
        )}
        {mode === 1 && local === 1 && (
          <>
            {[records[0].b, 'FVNQHLCGSHLVEALYLVCGERGFFYTKPT'].map((seq, row) => {
              const dx = Math.min(38, (w - 48) / 6);
              return (
                <g key={row}>
                  <text x={cx} y={52 + row * 126} textAnchor="middle">
                    {row
                      ? s('赖脯胰岛素 · 1LPH', 'Insulin lispro · 1LPH')
                      : s('人胰岛素 · 1TRZ', 'Human insulin · 1TRZ')}
                  </text>
                  {seq
                    .slice(24)
                    .split('')
                    .map((v, i) => (
                      <g key={i} opacity={row === 0 || p > 0.2 ? 1 : 0.2}>
                        <rect
                          x={cx + (i - 2.5) * dx - dx * 0.44}
                          y={72 + row * 126}
                          width={dx * 0.88}
                          height="42"
                          rx="11"
                          fill={[3, 4].includes(i) ? '#e2d5a9' : '#efeddf'}
                        />
                        <text x={cx + (i - 2.5) * dx} y={99 + row * 126} textAnchor="middle">
                          {v}
                        </text>
                        {row === 0 && (
                          <text x={cx + (i - 2.5) * dx} y="140" textAnchor="middle">
                            {i + 25}
                          </text>
                        )}
                      </g>
                    ))}
                </g>
              );
            })}
            <text x={cx} y="301" textAnchor="middle">
              B28: P → K · B29: K → P
            </text>
          </>
        )}
        {mode === 1 && local === 2 && plot('association')}
        {mode === 2 && local === 0 && (
          <>
            <text x={cx} y="30" textAnchor="middle">
              {record.accession}
            </text>
            <text x={cx} y="62" textAnchor="middle">
              {s('前体', 'Precursor')}: {record.precursor.length} aa
            </text>
            {[
              ['B', record.bRange, record.b.length],
              ['A', record.aRange, record.a.length],
            ].map(([chain, range, length], i) => {
              const r = range as number[];
              return (
                <g key={String(chain)}>
                  <rect x="20" y={100 + i * 93} width={w - 40} height="26" rx="12" fill="#eeecdf" />
                  <rect
                    x={20 + ((w - 40) * (r[0] - 1)) / record.precursor.length}
                    y={100 + i * 93}
                    width={((w - 40) * (r[1] - r[0] + 1)) / record.precursor.length}
                    height="26"
                    rx="12"
                    fill={i ? '#aab99b' : '#b8a2bf'}
                  />
                  <text x={cx} y={154 + i * 93} textAnchor="middle">
                    {String(chain)}: {r[0]}–{r[1]} → {String(length)} aa
                  </text>
                </g>
              );
            })}
            <text x={cx} y="299" textAnchor="middle">
              {s('成熟链分别对齐', 'Align mature chains separately')}
            </text>
          </>
        )}
        {mode === 2 &&
          local === 1 &&
          sequence(
            wi ? records[0].b : records[0].a,
            wi ? record.b : record.a,
            wi ? 20 : 0,
            wi ? 'B' : 'A',
          )}
        {mode === 2 && local === 2 && (
          <>
            {[20, 30].map((n, i) => {
              const v = segmentEvidence(records[0].b, records[2].b, n);
              return (
                <g key={n} opacity={i === 0 || p > 0.35 ? 1 : 0.25}>
                  <text x="22" y={42 + i * 140}>
                    {s('人–牛 B链', 'Human–cow B')} · {n}/30 aa
                  </text>
                  <rect x="22" y={60 + i * 140} width={w - 44} height="22" rx="11" fill="#e9e8d7" />
                  <rect
                    x="22"
                    y={60 + i * 140}
                    width={(w - 44) * v.coverage!}
                    height="22"
                    rx="11"
                    fill="#b3bb96"
                  />
                  <text x="22" y={108 + i * 140}>
                    {s('一致性', 'Identity')} {(v.identity! * 100).toFixed(1)}%
                  </text>
                  <text x="22" y={133 + i * 140}>
                    {s('覆盖度', 'Coverage')} {(v.coverage! * 100).toFixed(1)}%
                  </text>
                </g>
              );
            })}
          </>
        )}
      </svg>
      {!f.watch && (
        <div className="bio-protein-controls">
          <div className="bio-protein-buttons">
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
          <div className="bio-protein-buttons">
            {views[mode].map((v, i) => (
              <button key={v} aria-pressed={local === i} onClick={() => setView(i)}>
                {v}
              </button>
            ))}
          </div>
          <label>
            {s('观察进度', 'Observation progress')}
            <input
              type="range"
              min="0"
              max="1"
              step=".01"
              value={progress}
              onChange={(e) => setProgress(+e.target.value)}
            />
          </label>
          {mode === 0 && local === 1 && (
            <label>
              {s('编码方案', 'Coding choice')} {choice + 1}/32
              <input
                type="range"
                min="0"
                max="31"
                step="1"
                value={choice}
                onChange={(e) => setChoice(+e.target.value)}
              />
            </label>
          )}
          {mode === 0 && local === 2 && (
            <label>
              {s('合成测定温度', 'Synthetic assay temperature')} {temp} °C
              <input
                type="range"
                min="20"
                max="80"
                step="1"
                value={temp}
                onChange={(e) => setTemp(+e.target.value)}
              />
            </label>
          )}
          {mode === 1 && local === 0 && (
            <>
              <label>
                {s('结构转角', 'Structure rotation')}
                <input
                  type="range"
                  min="0"
                  max="6.28"
                  step=".01"
                  value={angle}
                  onChange={(e) => setAngle(+e.target.value)}
                />
              </label>
              <div className="bio-protein-buttons">
                <button aria-pressed={!analogue} onClick={() => setAnalogue(false)}>
                  1TRZ
                </button>
                <button aria-pressed={analogue} onClick={() => setAnalogue(true)}>
                  1LPH
                </button>
              </div>
            </>
          )}
          {mode === 1 && local === 2 && (
            <label>
              {s('示意总浓度', 'Illustrative total concentration')} {conc.toFixed(2)}
              <input
                type="range"
                min=".1"
                max="10"
                step=".01"
                value={conc}
                onChange={(e) => setConc(+e.target.value)}
              />
            </label>
          )}
          {mode === 2 && local < 2 && (
            <>
              <div className="bio-protein-buttons">
                {[s('人', 'Human'), s('猪', 'Pig'), s('牛', 'Cow')].map((v, i) => (
                  <button key={v} aria-pressed={species === i} onClick={() => setSpecies(i)}>
                    {v}
                  </button>
                ))}
              </div>
              {local === 1 && (
                <div className="bio-protein-buttons">
                  <button aria-pressed={window === 0} onClick={() => setWindow(0)}>
                    A1–10
                  </button>
                  <button aria-pressed={window === 1} onClick={() => setWindow(1)}>
                    B21–30
                  </button>
                </div>
              )}
            </>
          )}
          <details>
            <summary>{s('数据来源与模型范围', 'Data provenance and model limits')}</summary>
            <p>
              {s(
                '结构采用PDB 1TRZ及1LPH中的A/B链Cα和硫原子坐标，省略侧链和水。两个结构未经叠合，不把切换当成形变轨迹。单体—二聚体曲线只解释质量作用定律，常数为示意，未模拟锌、六聚体或给药过程。酶活性数据是独立的合成测定，不是胰岛素数据。',
                'Structures use A/B-chain Cα and sulfur coordinates from PDB 1TRZ and 1LPH, omitting side chains and water. The structures are not superposed; switching is not a deformation trajectory. The monomer–dimer curves illustrate mass action with arbitrary constants and omit zinc, hexamers and administration. Enzyme-activity data are a separate synthetic assay, not insulin measurements.',
              )}
            </p>
            <p>
              {s(
                '2026-10-18取得的固定记录：人NP_000198.1、猪NP_001103242.1为RefSeq；牛P01317.2来自UniProtKB/Swiss-Prot，并由NCBI Protein收录。这里没有执行实时BLAST。',
                'Fixed records retrieved 2026-10-18: human NP_000198.1 and pig NP_001103242.1 are RefSeq; bovine P01317.2 originates in UniProtKB/Swiss-Prot and is also indexed by NCBI Protein. No live BLAST search is performed.',
              )}
            </p>
          </details>
          {mode === 2 && (
            <details>
              <summary>{s('自己的序列与来源记录', 'Your sequences and provenance')}</summary>
              <p>
                {s(
                  '输入同源、同范围的蛋白质序列；每条最多160个标准氨基酸字母或X。可含单条FASTA标题。留空不生成实验结果。',
                  'Enter homologous protein regions of matching scope, up to 160 standard amino-acid letters or X each. A single FASTA header is accepted. Blank inputs produce no result.',
                )}
              </p>
              <label>
                {s('序列一', 'Sequence one')}
                <textarea value={aText} onChange={(e) => setA(e.target.value)} />
              </label>
              <label>
                {s('序列二', 'Sequence two')}
                <textarea value={bText} onChange={(e) => setB(e.target.value)} />
              </label>
              {own ? (
                <div className="bio-protein-alignment">
                  <code>{own.a}</code>
                  <code>{own.b}</code>
                  <p>
                    {own.matches}/{own.length} · {(own.identity! * 100).toFixed(2)}% ·{' '}
                    {s('全局比对，非BLAST', 'Global alignment, not BLAST')}
                  </p>
                </div>
              ) : aText || bText ? (
                <p>
                  {s(
                    '请检查两条序列及长度；尚无有效比较。',
                    'Check both sequences and their lengths; no valid comparison yet.',
                  )}
                </p>
              ) : null}
              <label>
                {s(
                  '数据库、物种、登录号版本、范围、检索日期与原始链接',
                  'Database, species, accession.version, region, retrieval date and original link',
                )}
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </label>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
