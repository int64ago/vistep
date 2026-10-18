import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  genomeSegmentPoints,
  genomeColors,
  genomeChapters,
  genomeDurations,
  genomesDirector,
  genomeEvidence,
  expressionState,
  foldedFusion,
  visibleGrowth,
  rnaGeometry,
  proteinGeometry,
  type ExpressionInputs,
} from '../../models/bio-engineered-genomes';
import '../../styles/bio-engineered-genomes.css';
const path = (ps: { x: number; y: number }[]) =>
  ps.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
function Note({ children }: { children: React.ReactNode }) {
  return <p className="begx-note">{children}</p>;
}
function DNA({ progress = 1 }: { progress?: number }) {
  const scale = 0.85 + 0.45 * progress,
    cx = mix(175, 90, progress);
  return (
    <g data-dna-id="DNA-1">
      {Array.from({ length: 12 }, (_, id) => (
        <path
          key={id}
          data-segment={id}
          d={path(
            genomeSegmentPoints(id, progress).map((p) => ({
              x: 150 + (p.x - cx) * scale,
              y: 125 + (p.y - 130) * scale,
            })),
          )}
          fill="none"
          stroke={genomeColors[id % 8]}
          strokeWidth="7"
          strokeLinecap="butt"
        />
      ))}
    </g>
  );
}
function Colonies({ markers }: { markers: boolean }) {
  const id = useId().replace(/:/g, '');
  return (
    <div className="begx-observation">
      <div className="begx-colony-pair">
        {[genomeEvidence.control, genomeEvidence.synthetic].map((s, i) => (
          <div key={s.id}>
            <svg viewBox="0 0 140 116" aria-hidden="true">
              <defs>
                <radialGradient id={`${id}-${i}`}>
                  <stop offset="0" stopColor={s.blueColony ? '#345a9d' : '#fcf4df'} />
                  <stop offset=".27" stopColor={s.blueColony ? '#3976ae' : '#f4e8d1'} />
                  <stop offset=".48" stopColor={s.blueColony ? '#87b1c9' : '#eed7c1'} />
                  <stop offset=".7" stopColor="#e9cbb9" />
                  <stop offset="1" stopColor="#e4b498" stopOpacity=".2" />
                </radialGradient>
              </defs>
              <ellipse cx="70" cy="59" rx="61" ry="49" fill="#e7c6af" />
              <ellipse cx="70" cy="59" rx="48" ry="41" fill={`url(#${id}-${i})`} />
              <path
                d="M34 40Q42 27 55 27"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                opacity=".45"
              />
            </svg>
            <strong>{t(i ? '携带合成基因组' : '原研究对照')}</strong>
            {markers && (
              <div className="begx-markers" aria-label={t('来源标记')}>
                {s.markers.map((present, j) => (
                  <span
                    key={j}
                    className={present ? 'begx-mark-on' : ''}
                    aria-label={`WM${j + 1}: ${t(present ? '检出' : '未检出')}`}
                  >
                    <b>{j + 1}</b>
                    {present ? '✓' : '–'}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <Note>{t(markers ? '4个来源标记' : '菌落，不是单个细胞')}</Note>
    </div>
  );
}
function Ribosome({ x = 150, y = 90, muted = false }: { x?: number; y?: number; muted?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} data-machine-id="ribosome-1" opacity={muted ? 0.2 : 1}>
      <path
        d="M-39-16C-41-44-15-48 0-37C19-50 45-33 41-10L28 13C15 18 6 7-2 13C-20 22-41 8-39-16Z"
        fill="#b6a68d"
        stroke="#887c69"
        strokeWidth="2"
      />
      <path d="M-32-19C-17-23 18-22 34-18L30-9C10-3-14-3-31-9Z" fill="#f5f0e6" />
      <path
        d="M-31 1C-33 20-10 33 8 24C24 30 40 16 33 0C17-10-15-10-31 1Z"
        fill="#d6c9b0"
        stroke="#9f917a"
        strokeWidth="2"
      />
      <path d="M5 9L9 31" fill="none" stroke="#f7f2e8" strokeWidth="7" />
    </g>
  );
}
function Cell() {
  return (
    <svg className="begx-svg" viewBox="0 0 300 238" role="img" aria-label={t('移植后解释模型')}>
      <path
        d="M59 35C115 7 219 19 255 77C294 140 264 210 198 222C126 244 38 213 22 160C9 104 20 58 59 35Z"
        fill="#e0e6d4"
        stroke="#94aa8e"
        strokeWidth="4"
      />
      <g transform="translate(15 15) scale(.65)">
        <DNA />
      </g>
      <g transform="translate(184 80) scale(.53)">
        <Ribosome x={0} y={0} />
      </g>
      <g transform="translate(105 180) scale(.43)">
        <Ribosome x={0} y={0} />
      </g>
      <path
        d="M204 159C183 143 185 120 206 120C230 111 244 137 229 157L217 142Z"
        fill="#b4a08a"
        stroke="#887763"
        strokeWidth="2"
      />
      <path d="M163 203L203 178" fill="none" stroke="#73816e" />
      <text x="150" y="225" textAnchor="middle">
        {t('已有机器')}
      </text>
    </svg>
  );
}
function Transcription({ state }: { state: ReturnType<typeof expressionState> }) {
  const rna = rnaGeometry(state.rnaFraction);
  return (
    <svg
      className="begx-svg"
      viewBox="0 0 300 238"
      role="img"
      aria-label={t('DNA保留，新RNA另行合成')}
    >
      <g data-dna-id={state.dnaId}>
        <path
          d="M16 128H88Q111 128 128 141Q150 155 171 128H284M16 142H88Q111 142 128 129Q150 116 171 142H284"
          fill="none"
          stroke="#60988e"
          strokeWidth="5"
        />
        {Array.from({ length: 18 }, (_, i) => (
          <path
            key={i}
            d={`M${19 + i * 15} ${i > 5 && i < 11 ? 136 : 130}v10`}
            stroke="#abc4ac"
            strokeWidth="2"
          />
        ))}
      </g>
      {state.machineryIds.includes('polymerase-1') && (
        <path
          d="M105 153C80 139 87 101 113 94C137 77 162 91 169 113L154 130C144 122 136 121 125 132L127 154Z"
          fill="#baac96"
          stroke="#8c7e68"
          strokeWidth="2"
          data-machine-id="polymerase-1"
        />
      )}
      <path d="M126 129Q127 106 139 89" fill="none" stroke="#f4f1e6" strokeWidth="7" />
      <path
        d={path(rna.filter((p) => p.visible))}
        stroke="#b38192"
        strokeWidth="5"
        fill="none"
        data-rna-id={state.rnaId}
      />
      {rna
        .filter((p) => p.visible)
        .map((p, i) => (
          <circle key={p.id} cx={p.x} cy={p.y} r="3" fill={i % 2 ? '#936b7a' : '#c599a8'} />
        ))}
      <text x="18" y="181">
        DNA
      </text>
      <text x="272" y="30" textAnchor="end">
        {t(state.rnaId.startsWith('existing') ? 'RNA已存在' : '新RNA')}
      </text>
      <path d="M243 36L249 49" fill="none" stroke="#916979" />
      <text x="150" y="216" textAnchor="middle">
        {t(state.machineryIds.includes('polymerase-1') ? '已有转录机器' : '转录机器缺失')}
      </text>
    </svg>
  );
}
function Translation({ state }: { state: ReturnType<typeof expressionState> }) {
  const rna = rnaGeometry(state.rnaFraction, true),
    protein = proteinGeometry(state.proteinFraction, state.proteinRelease);
  return (
    <svg
      className="begx-svg"
      viewBox="0 0 300 238"
      role="img"
      aria-label={t('同一RNA在已有核糖体上合成新蛋白质')}
    >
      {state.machineryIds.includes('ribosome-1') && <Ribosome />}
      <path
        d={path(rna.filter((p) => p.visible))}
        stroke="#b38192"
        strokeWidth="5"
        fill="none"
        data-rna-id={state.rnaId}
      />
      {rna
        .filter((p) => p.visible)
        .map((p, i) => (
          <circle key={p.id} cx={p.x} cy={p.y} r="2.5" fill={i % 2 ? '#936b7a' : '#c599a8'} />
        ))}
      <path
        d={path(protein.filter((p) => p.visible))}
        stroke="#547e9b"
        strokeWidth="4"
        fill="none"
        data-protein-id={state.proteinId}
      />
      {protein.map((p) => (
        <circle key={p.id} data-amino-id={p.id} cx={p.x} cy={p.y} r="3" fill="#668fab" />
      ))}
      <path
        d="M240 138Q208 153 172 132"
        stroke="#8b9d99"
        strokeWidth="2"
        strokeDasharray="4 5"
        fill="none"
      />
      <path d="M176 140L172 132L181 134" stroke="#8b9d99" strokeWidth="2" fill="none" />
      <text x="26" y="103">
        RNA
      </text>
      <text x="283" y="101" textAnchor="end">
        {t('氨基酸')}
      </text>
      <text x="150" y="24" textAnchor="middle">
        {t(state.machineryIds.includes('ribosome-1') ? '已有核糖体' : '核糖体缺失')}
      </text>
      <text x="280" y="220" textAnchor="end">
        {t('新蛋白质')}
      </text>
    </svg>
  );
}
function Enzyme({ x = 84, y = 112 }: { x?: number; y?: number }) {
  return (
    <g transform={`translate(${x} ${y})`} data-protein-id="protein-1">
      <path
        d="M-32-37C-51-15-39 17-13 27C5 48 37 24 39 5L19-7L5 1L-7-13L9-26L30-18C36-42 0-52-14-36Z"
        fill="#a2b6c4"
        stroke="#587b91"
        strokeWidth="2.3"
      />
      <path d="M-24-25Q-35-4-16 10M13 17Q25 26 28 6" stroke="#dce6ed" strokeWidth="4" fill="none" />
    </g>
  );
}
function Reporter({ state }: { state: ReturnType<typeof expressionState> }) {
  return (
    <svg
      className="begx-svg"
      viewBox="0 0 300 238"
      role="img"
      aria-label={t('底物在酶处裂开，释放后经后续步骤显色')}
    >
      {state.proteinRelease > 0 && <Enzyme />}
      <text x="83" y="169" textAnchor="middle">
        {t(state.proteinRelease > 0 ? '酶' : '没有新酶')}
      </text>
      {state.pigment > 0 && (
        <path
          d="M210 135H222"
          fill="none"
          stroke="#3b6cae"
          strokeWidth="5"
          opacity={state.pigment}
          data-product-id="blue-pigment-from-two-units"
        />
      )}
      {state.substratePresent &&
        state.events.map((e, i) => {
          const x = mix(230, 93, e.approach),
            y = mix(47 + i * 28, 89, e.approach);
          const ix = mix(mix(x, 197 + i * 38, e.release), 201 + i * 30, state.pigment),
            iy = mix(y, 135, e.release),
            gx = mix(x + 21, 150 + i * 30, e.release),
            gy = mix(y + 8, 192, e.release);
          const color = `rgb(${mix(195, 59, state.pigment)} ${mix(196, 108, state.pigment)} ${mix(174, 174, state.pigment)})`;
          return (
            <g key={e.id} data-substrate-id={e.substrateId}>
              {e.cut < 1 && (
                <path
                  d={`M${x} ${y}L${x + 21} ${y + 8}`}
                  stroke="#937c65"
                  strokeWidth="3"
                  opacity={1 - e.cut}
                />
              )}
              <path
                d={`M${ix - 9} ${iy - 8}Q${ix} ${iy - 13} ${ix + 10} ${iy - 6}Q${ix + 15} ${iy + 3} ${ix + 6} ${iy + 10}Q${ix - 6} ${iy + 14} ${ix - 12} ${iy + 4}Q${ix - 15} ${iy - 3} ${ix - 9} ${iy - 8}Z`}
                fill={color}
                stroke="#727e77"
                strokeWidth="2"
                data-intermediate-id={e.intermediateId}
              />
              <circle
                cx={gx}
                cy={gy}
                r="8"
                fill="#c8ae77"
                stroke="#9c8258"
                strokeWidth="2"
                data-sugar-id={e.sugarId}
              />
            </g>
          );
        })}
      <path
        d="M185 91Q218 77 253 97M249 89L253 97L244 98"
        fill="none"
        stroke="#9aa8a6"
        strokeWidth="2"
        strokeDasharray="3 4"
      />
      <text x="210" y="24" textAnchor="middle">
        {t('后续步骤')}
      </text>
      <text x="285" y="220" textAnchor="end">
        {t(
          !state.substratePresent
            ? '无检测底物'
            : state.pigment > 0.1
              ? '蓝色产物'
              : state.events.some((e) => e.release > 0)
                ? '释放的中间产物'
                : state.events.some((e) => e.cut > 0)
                  ? '底物在酶处裂开'
                  : '检测底物',
        )}
      </text>
    </svg>
  );
}
function Counter({ answer }: { answer: boolean }) {
  return (
    <div className="begx-counter">
      <svg
        className="begx-svg"
        viewBox="0 0 300 238"
        role="img"
        aria-label={t('同一DNA没有表达机器')}
      >
        <DNA />
        <path d="M39 201H261" stroke="#bdc6b3" strokeWidth="2" fill="none" />
        <text x="150" y="221" textAnchor="middle">
          {t('只有DNA')}
        </text>
      </svg>
      <Note>{t(answer ? '没有自动生成蛋白质' : '没有表达机器，还会产生蛋白质吗？')}</Note>
    </div>
  );
}
function Fusion({ amount }: { amount: number }) {
  const s = foldedFusion(amount);
  return (
    <div className="begx-fusion">
      <div className="begx-tally">
        <span>
          {t('染色体')} <b>{s.chromosomes}</b>
        </span>
        <span>
          {t('代表区段')} <b>16</b>
        </span>
      </div>
      <svg
        className="begx-svg"
        viewBox="0 0 300 250"
        role="img"
        aria-label={t('同一代表区段跨越染色体重排')}
      >
        <rect
          x="16"
          y="16"
          width="268"
          height="219"
          rx="62"
          fill="#e2e7d8"
          stroke="#bcc7af"
          strokeWidth="2"
        />
        {s.joins.map((j) => (
          <path
            key={j.id}
            d={path(j.points)}
            stroke="#7e8c78"
            strokeWidth="6"
            fill="none"
            opacity={j.opacity}
          />
        ))}
        {s.blocks.map((b) => (
          <g key={b.id} data-region-id={b.id}>
            <path
              d={path(b.points)}
              stroke={genomeColors[b.id % 8]}
              strokeWidth={b.id === 6 ? 12 : 8}
              fill="none"
              strokeLinecap="butt"
            />
            <circle
              cx={b.points[6].x}
              cy={b.points[6].y}
              r="3"
              fill="#60496b"
              opacity={b.centromereOpacity}
            />
          </g>
        ))}
        <path d={`M${s.trace.x - 5} ${s.trace.y - 18}l5 7 5-7Z`} fill="#694d6e" />
      </svg>
      <Note>{t(amount < 14.9 ? '跟住箭头标出的同一区段。' : '区段仍在；部分边界序列删除。')}</Note>
    </div>
  );
}
function Growth({ hours }: { hours: number }) {
  const series = visibleGrowth(hours),
    X = (h: number) => 43 + (h / 26) * 232,
    Y = (od: number) => 176 - (od / 6) * 124;
  return (
    <div className="begx-growth">
      <div className="begx-tally">
        <span>WT · 16</span>
        <span>SY14 · 1</span>
      </div>
      <svg
        className="begx-svg"
        viewBox="0 0 300 238"
        role="img"
        aria-label={t('固定发表生长均值，不是模型计算')}
      >
        <text x="42" y="26">
          OD₆₀₀
        </text>
        {[0, 3, 6].map((o) => (
          <g key={o}>
            <path d={`M43 ${Y(o)}H280`} stroke="#d7dfd2" fill="none" />
            <text x="31" y={Y(o) + 6} textAnchor="end">
              {o}
            </text>
          </g>
        ))}
        <path d="M43 45V176H281" fill="none" stroke="#71816e" strokeWidth="2" />
        {[0, 10, 20].map((h) => (
          <text key={h} x={X(h)} y="202" textAnchor="middle">
            {h}
          </text>
        ))}
        <text x="280" y="229" textAnchor="end">
          {t('小时')}
        </text>
        {series.map((s, i) => (
          <g key={s.strain} data-strain={s.strain}>
            <path
              d={path(s.points.map((p) => ({ x: X(p.hours), y: Y(p.od600) })))}
              fill="none"
              stroke={i ? '#b25d7b' : '#497eaa'}
              strokeWidth="2.5"
            />
            {s.points.map((p) =>
              i ? (
                <circle
                  key={p.id}
                  data-observation-id={p.id}
                  cx={X(p.hours)}
                  cy={Y(p.od600)}
                  r="4"
                  fill="#b25d7b"
                />
              ) : (
                <rect
                  key={p.id}
                  data-observation-id={p.id}
                  x={X(p.hours) - 4}
                  y={Y(p.od600) - 4}
                  width="8"
                  height="8"
                  fill="#497eaa"
                />
              ),
            )}
          </g>
        ))}
      </svg>
      <Note>{t('均值；略去误差棒。')}</Note>
    </div>
  );
}
const views = ['来源证据', '信息表达', '染色体重排', '发表生长数据'];
export default function BioEngineeredGenomes() {
  const f = useShowcase(),
    locale =
      typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')
        ? 'en'
        : 'zh';
  const [manual, setManual] = useState<number | null>(null),
    [progress, setProgress] = useState(1),
    [fusion, setFusion] = useState(15),
    [hours, setHours] = useState(26),
    [polymerase, setPolymerase] = useState(true),
    [ribosome, setRibosome] = useState(true),
    [existingRna, setExistingRna] = useState(false),
    [substrate, setSubstrate] = useState(true);
  const chapter = f.watch ? f.chapter : (manual ?? f.chapter),
    d = genomesDirector(
      chapter,
      f.watch ? f.chapterTime : progress * genomeDurations[chapter],
      locale,
    );
  const input: ExpressionInputs = f.watch
    ? {}
    : { polymerase, ribosome, preexistingRna: existingRna, substrate };
  const state = expressionState(f.watch ? d.expressionTime : progress * 29, input),
    amount = f.watch ? d.fusions : fusion;
  let body: React.ReactNode,
    note = '';
  if (chapter === 0) {
    body =
      d.shot === 'colonies' || d.shot === 'markers' ? (
        <Colonies markers={d.shot === 'markers'} />
      ) : (
        <>
          <svg
            className="begx-svg"
            viewBox="0 0 300 238"
            aria-label={t('同一批示意DNA片段连续装配')}
            role="img"
          >
            <DNA progress={d.assembly} />
          </svg>
          <Note>{t('完整DNA不是完整细胞')}</Note>
        </>
      );
  } else if (chapter === 1) {
    const shot = f.watch
      ? d.shot
      : state.time < 8
        ? 'transcription'
        : state.time < 18
          ? 'translation'
          : 'reporter';
    body =
      shot === 'cell' ? (
        <Cell />
      ) : shot === 'transcription' ? (
        <Transcription state={state} />
      ) : shot === 'translation' ? (
        <Translation state={state} />
      ) : shot === 'reporter' ? (
        <Reporter state={state} />
      ) : (
        <Counter answer />
      );
    note =
      shot === 'cell'
        ? '移植后解释模型'
        : shot === 'transcription'
          ? 'DNA保留，新RNA另行合成'
          : shot === 'translation'
            ? 'RNA保留，新蛋白质另行合成'
            : shot === 'reporter'
              ? '释放后显色（合并步骤）'
              : '';
  } else if (chapter === 2) body = <Fusion amount={amount} />;
  else
    body =
      d.shot === 'growth' || !f.watch ? (
        <Growth hours={f.watch ? d.revealHours : hours} />
      ) : (
        <Counter answer={d.shot === 'answer'} />
      );
  return (
    <section className="begx-root" data-genome-shot={d.shot} data-chapter={genomeChapters[chapter]}>
      <div className="begx-era">
        {t(
          chapter === 3 && d.shot !== 'growth' && f.watch
            ? '回到同一段DNA'
            : chapter === 0 && (d.shot === 'colonies' || d.shot === 'markers')
              ? '2010：论文现象图解'
              : chapter < 2
                ? '2010：合成基因组'
                : '2018：酵母染色体重排',
        )}
      </div>
      <div className="begx-stage">{body}</div>
      {note && <Note>{t(note)}</Note>}
      {!f.watch && (
        <div className="begx-controls">
          <Segments
            label={t('观察对象')}
            value={String(chapter)}
            onChange={(v) => setManual(Number(v))}
            options={views.map((label, i) => ({ value: String(i), label: t(label) }))}
          />
          {chapter < 2 && (
            <Range
              label={t('过程进度')}
              value={progress}
              min={0}
              max={1}
              step={0.01}
              onChange={setProgress}
            />
          )}{' '}
          {chapter === 1 && (
            <>
              <div className="begx-toggles">
                {(
                  [
                    [polymerase, setPolymerase, '转录机器'],
                    [ribosome, setRibosome, '翻译机器'],
                    [existingRna, setExistingRna, 'RNA已存在'],
                    [substrate, setSubstrate, '检测底物'],
                  ] as const
                ).map(([v, set, label]) => (
                  <button type="button" key={label} aria-pressed={v} onClick={() => set(!v)}>
                    {t(label)} · {t(v ? '有' : '无')}
                  </button>
                ))}
              </div>
              <p>{t('表达不等于整体活性')}</p>
            </>
          )}
          {chapter === 2 && (
            <Range
              label={t('连续融合次数')}
              value={fusion}
              min={0}
              max={15}
              step={0.01}
              onChange={setFusion}
            />
          )}{' '}
          {chapter === 3 && (
            <Range
              label={t('培养时间')}
              value={hours}
              min={0}
              max={26}
              step={0.1}
              unit="h"
              onChange={setHours}
            />
          )}
        </div>
      )}
    </section>
  );
}
