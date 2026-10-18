import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  replicationGeneration,
  densityBands,
  replicationFork,
  type ReplicationHypothesis,
  type ForkBase,
} from '../../models/bio-dna-replication';
import '../../styles/bio-dna-replication.css';
type Mode =
  'label' | 'first' | 'second' | 'dispersive' | 'lineage' | 'unwind' | 'extend' | 'finish';
const modes: Mode[] = [
  'label',
  'first',
  'second',
  'dispersive',
  'lineage',
  'unwind',
  'extend',
  'finish',
];
const names = [
  '稳定同位素与提取',
  '第一代区分预测',
  '第二代出现两带',
  '扩展：分散复制预测',
  '追踪两条原有链',
  '解开模板与起始',
  '5′到3′的延伸',
  '引物替换与连接',
];
const hypothesisNames = {
  semiconservative: '半保留复制',
  conservative: '全保留复制',
  dispersive: '分散复制',
};
function GradientTube({
  generation,
  hypothesis,
  progress = 1,
}: {
  generation: number;
  hypothesis: ReplicationHypothesis;
  progress?: number;
}) {
  const id = useId().replace(/:/g, '');
  const bands = densityBands(generation, hypothesis);
  return (
    <svg
      viewBox="0 0 145 270"
      className="bio-replication-tube"
      role="img"
      aria-label={t('DNA在氯化铯密度梯度中形成条带，不是细菌沉淀')}
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#f3f2e7" />
          <stop offset="1" stopColor="#bec7b3" />
        </linearGradient>
      </defs>
      <path
        d="M30 18V222Q30 251 73 251Q116 251 116 222V18"
        fill={`url(#${id})`}
        stroke="#a5b09c"
        strokeWidth="2"
      />
      {[0, 0.5, 1].map((f) => (
        <path key={f} d={`M120 ${65 + f * 160}H129`} stroke="#949b85" />
      ))}
      {bands.map((b) => (
        <g key={b.heavyFraction} opacity={progress}>
          <rect
            x="33"
            y={b.y - 6}
            width="80"
            height="12"
            rx="6"
            fill="#698494"
            opacity={0.25 + 0.65 * b.fraction}
          />
          <path d={`M34 ${b.y}H112`} stroke="#536d83" strokeWidth="3" opacity={b.fraction} />
        </g>
      ))}
      <g fontSize="22" fill="#727963">
        <text x="5" y="70">
          L
        </text>
        <text x="5" y="150">
          I
        </text>
        <text x="5" y="230">
          H
        </text>
      </g>
    </svg>
  );
}
function Predictions({
  generation,
  hypothesis,
  progress,
}: {
  generation: number;
  hypothesis: ReplicationHypothesis;
  progress: number;
}) {
  return (
    <>
      <div className="bio-replication-comparison">
        <div>
          <p>{t('教材定性结果')}</p>
          <GradientTube
            generation={generation}
            hypothesis="semiconservative"
            progress={ease(ramp(progress, 0.05, 0.35))}
          />
        </div>
        <div>
          <p>
            {t(hypothesisNames[hypothesis])} · {t('预测')}
          </p>
          <GradientTube
            generation={generation}
            hypothesis={hypothesis}
            progress={ease(ramp(progress, 0.25, 0.65))}
          />
        </div>
      </div>
      <p className="bio-replication-note">{t('H：重；I：中间；L：轻。条带图为理想化重建。')}</p>
    </>
  );
}
function Lineage({
  generation,
  hypothesis,
}: {
  generation: number;
  hypothesis: ReplicationHypothesis;
}) {
  const molecules = replicationGeneration(generation, hypothesis).sort(
    (a, b) =>
      Number(b.strands.some((s) => s.id.startsWith('H-'))) -
      Number(a.strands.some((s) => s.id.startsWith('H-'))),
  );
  return (
    <>
      <div
        className="bio-replication-molecules"
        style={{ gridTemplateColumns: `repeat(4,minmax(0,1fr))` }}
      >
        {molecules.map((m) => (
          <div key={m.id}>
            <svg viewBox="0 0 104 116" aria-hidden="true">
              {m.strands.map((s, j) => (
                <g key={s.id}>
                  <path
                    d={`M${34 + j * 36} 20V94`}
                    stroke="#c4c1a7"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {s.segments.map((heavy, i) => (
                    <path
                      key={i}
                      d={`M${34 + j * 36} ${20 + i * 2.3}v2.4`}
                      stroke={heavy ? '#718da4' : '#b6a172'}
                      strokeWidth="6"
                    />
                  ))}
                </g>
              ))}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="38"
                  x2="66"
                  y1={26 + i * 14}
                  y2={26 + i * 14}
                  stroke="#c3baa4"
                  strokeWidth="2"
                />
              ))}
            </svg>
            <p className="bio-replication-origin">
              {m.strands
                .filter((s) => s.id.startsWith('H-'))
                .map((s) => s.id.replace('H-', ''))
                .join(' + ') || '·'}
            </p>
          </div>
        ))}
      </div>
      <div className="bio-replication-key">
        <span>
          <i style={{ background: '#718da4' }} />
          {t('起始重标记链A、B')}
        </span>
        <span>
          <i style={{ background: '#b6a172' }} />
          {t('后续合成的轻链')}
        </span>
      </div>
      <p className="bio-replication-note">
        {t('原有重标记总量保持，含重标记的分子比例逐代改变。')}
      </p>
    </>
  );
}
function NewBase({ base }: { base: ForkBase }) {
  const x = base.x + (1 - base.visible) * 15,
    y = 150 + (base.y - 150) * base.visible;
  const primer = base.id.startsWith('new-leading') ? base.index === 0 : base.index % 2 === 1;
  const oldOpacity = primer ? 1 - base.replacement : 0;
  return (
    <g opacity={base.visible}>
      <g transform={`translate(${x} ${y})`}>
        <g opacity={1 - oldOpacity}>
          <rect x="-13" y="-11" width="26" height="22" rx="7" fill="#b6a172" />
          <text y="8" textAnchor="middle" fontSize="22" fill="#fff">
            {base.base}
          </text>
        </g>
        {primer && (
          <g
            opacity={oldOpacity}
            transform={`translate(${-24 * base.replacement} ${-18 * base.replacement})`}
          >
            <path d="M-15 0L0 -13L15 0L0 13Z" fill="#a28eae" />
            <text y="7" textAnchor="middle" fontSize="24" fill="#fff">
              {base.base === 'T' ? 'U' : base.base}
            </text>
          </g>
        )}
      </g>
    </g>
  );
}
function Fork({
  time,
  polymerase,
  primers,
}: {
  time: number;
  polymerase: boolean;
  primers: boolean;
}) {
  const s = replicationFork(time, polymerase, primers);
  const smooth = (v: number) => ease(Math.min(1, Math.max(0, v)));
  const path = (upper: boolean) =>
    Array.from({ length: 61 }, (_, i) => {
      const x = 24 + i * 5;
      return `${x},${upper ? 120 - 54 * smooth((s.forkX - x) / 38) : 145 + 71 * smooth((s.forkX - x) / 38)}`;
    }).join(' ');
  return (
    <>
      <svg
        className="bio-replication-fork"
        viewBox="0 0 350 300"
        role="img"
        aria-label={t('母链连续分离，新链只按5′到3′合成，后随链分段连接')}
      >
        <polyline points={path(true)} fill="none" stroke="#718da4" strokeWidth="4" />
        <polyline points={path(false)} fill="none" stroke="#718da4" strokeWidth="4" />
        {s.top.map((base, i) => (
          <g key={base.id}>
            <g transform={`translate(${base.x} ${base.y})`}>
              <rect x="-13" y="-11" width="26" height="22" rx="6" fill="#718da4" />
              <text y="8" textAnchor="middle" fontSize="22" fill="#fff">
                {base.base}
              </text>
            </g>
            {base.x > s.forkX && (
              <path
                d={`M${base.x} ${base.y + 11}V${s.bottom[i].y - 11}`}
                stroke="#c6baa3"
                strokeDasharray="3 2"
              />
            )}
          </g>
        ))}
        {s.bottom.map((base) => (
          <g key={base.id} transform={`translate(${base.x} ${base.y})`}>
            <rect x="-13" y="-11" width="26" height="22" rx="6" fill="#718da4" />
            <text y="8" textAnchor="middle" fontSize="22" fill="#fff">
              {base.base}
            </text>
          </g>
        ))}
        {s.leading.slice(1).map((base, i) => {
          const previous = s.leading[i];
          return (
            <line
              key={base.id}
              x1={previous.x + 13}
              y1={previous.y}
              x2={base.x - 13}
              y2={base.y}
              stroke="#b6a172"
              strokeWidth="3"
              opacity={Math.min(previous.visible, base.visible)}
            />
          );
        })}
        {s.lagging.slice(1).map((base, i) => {
          const previous = s.lagging[i],
            boundary = i % 2 === 1;
          return (
            <line
              key={base.id}
              x1={previous.x + 13}
              y1={previous.y}
              x2={base.x - 13}
              y2={base.y}
              stroke="#b6a172"
              strokeWidth="3"
              opacity={Math.min(previous.visible, base.visible) * (boundary ? s.ligated : 1)}
            />
          );
        })}
        {[...s.leading, ...s.lagging].map((b) => (
          <NewBase key={b.id} base={b} />
        ))}
        {polymerase &&
          primers &&
          s.time > 1.4 &&
          s.time < 6.9 &&
          (() => {
            const step = Math.max(0, s.time - 1),
              whole = Math.floor(step),
              fraction = step - whole;
            const x = 64 + 44 * Math.min(5, whole + smooth((fraction - 0.65) / 0.35)),
              y = 146 - 54 * smooth((s.forkX - x) / 38);
            return (
              <g
                transform={`translate(${x} ${y})`}
                opacity={smooth((s.time - 1.4) * 4) * (1 - smooth((s.time - 6.6) / 0.3))}
              >
                <path
                  d="M-21 -16Q0 -28 22 -11L17 17Q-8 26 -23 7L-10 0Z"
                  fill="#b99a92"
                  fillOpacity=".62"
                  stroke="#9e7d77"
                  strokeWidth="1.5"
                />
              </g>
            );
          })()}
        {polymerase &&
          primers &&
          [0, 1, 2].map((j) => {
            const start = 3 + j * 2,
              q = smooth((s.time - (start - 0.3)) / 0.3),
              x = 64 + (j * 2 + 1 - q) * 44,
              y = 190;
            return (
              <g
                key={j}
                transform={`translate(${x} ${y})`}
                opacity={
                  smooth((s.time - (start - 0.25)) * 5) *
                  (1 - smooth((s.time - (start + 0.65)) / 0.25))
                }
              >
                <path
                  d="M-21 -16Q0 -28 22 -11L17 17Q-8 26 -23 7L-10 0Z"
                  fill="#b99a92"
                  fillOpacity=".62"
                  stroke="#9e7d77"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
        {s.time < 6.6 && (
          <g transform={`translate(${s.forkX} 132)`}>
            <path
              d="M-13 -18Q10 -27 18 -10L14 15Q-2 26 -17 10Z"
              fill="#c2bc8e"
              stroke="#9c986d"
              strokeWidth="2"
            />
            <path d="M-3 -9L7 0L-3 9" stroke="#8f8b65" strokeWidth="2" fill="none" />
          </g>
        )}
        <g fill="#6a6959" fontSize="22">
          <text x="8" y="57">
            3′
          </text>
          <text x="319" y="57">
            5′
          </text>
          <text x="8" y="243">
            5′
          </text>
          <text x="319" y="243">
            3′
          </text>
        </g>
        <path d="M74 34H265l-8 -5m8 5l-8 5" fill="none" stroke="#a79772" strokeWidth="2" />
        <text x="175" y="23" textAnchor="middle" fontSize="24" fill="#8e805e">
          5′ → 3′
        </text>
        {[0, 1, 2].map((i) => (
          <g key={i} opacity={s.lagging[i * 2 + 1].visible}>
            <path
              d={`M${105 + i * 88} 264H${69 + i * 88}l8 -5m-8 5l8 5`}
              fill="none"
              stroke="#a79772"
              strokeWidth="2"
            />
          </g>
        ))}
        <text x="175" y="291" textAnchor="middle" fontSize="24" fill="#8e805e">
          3′ ← 5′
        </text>
      </svg>
      <div className="bio-replication-key">
        <span>
          <i style={{ background: '#718da4' }} />
          {t('模板')}
        </span>
        <span>
          <i style={{ background: '#b6a172' }} />
          {t('新DNA')}
        </span>
        <span>
          <i style={{ background: '#a28eae' }} />
          {t('RNA引物')}
        </span>
      </div>
      <p className="bio-replication-note">
        {t(
          s.complete
            ? '每条子代保留一条母链；缺口连接后成为连续骨架。'
            : !primers
              ? '缺少引物，DNA聚合酶不能从头起始。'
              : !polymerase
                ? '有引物但缺少DNA聚合酶，不能延伸为新DNA。'
                : '方向与连接的局部示意；引物和片段长度有意压缩。',
        )}
      </p>
    </>
  );
}
export default function BioDnaReplication() {
  const f = useShowcase();
  const [mode, setMode] = useState<Mode>(() =>
      modes.includes(f.variant as Mode) ? (f.variant as Mode) : 'label',
    ),
    [generation, setGeneration] = useState(2),
    [hypothesis, setHypothesis] = useState<ReplicationHypothesis>('semiconservative'),
    [progress, setProgress] = useState(0.8),
    [polymerase, setPolymerase] = useState(true),
    [primers, setPrimers] = useState(true);
  const m = f.watch ? modes[Math.min(7, f.chapter)] : mode,
    p = f.watch ? f.chapterProgress : progress;
  const g = f.watch
    ? m === 'first'
      ? 1
      : m === 'second' || m === 'dispersive'
        ? 2
        : m === 'lineage'
          ? Math.min(3, 1 + Math.floor(p * 3))
          : 0
    : generation;
  const h = f.watch
    ? m === 'first'
      ? 'conservative'
      : m === 'dispersive'
        ? 'dispersive'
        : 'semiconservative'
    : hypothesis;
  const forkTime = f.watch
    ? m === 'unwind'
      ? p * 3
      : m === 'extend'
        ? 3 + p * 5
        : 8 + p * 2
    : p * 10;
  return (
    <div className="bio-dna-replication" data-watch={f.watch} data-mode={m}>
      <p className="bio-replication-kind">
        {t(
          ['unwind', 'extend', 'finish'].includes(m)
            ? '机制示意；真实复制还包含更多酶与调控。'
            : '历史证据重建；¹⁵N与¹⁴N都是稳定同位素。',
        )}
      </p>
      {m === 'label' ? (
        <>
          <div className="bio-replication-label">
            <svg
              viewBox="0 -18 260 208"
              role="img"
              aria-label={t('先标记细菌中的DNA，再提取DNA用于密度梯度分析')}
            >
              <rect
                x="32"
                y="30"
                width="190"
                height="84"
                rx="42"
                fill="#d5ddbf"
                stroke="#99a780"
                strokeWidth="2"
              />
              <path
                d="M60 67q20 -25 40 0t40 0t40 0M60 77q20 25 40 0t40 0t40 0"
                fill="none"
                stroke="#718da4"
                strokeWidth="4"
              />
              <path d="M125 120V153l-7 -9m7 9l7 -9" stroke="#a9a58b" strokeWidth="2" fill="none" />
              <path d="M73 169H179M73 179H179" stroke="#718da4" strokeWidth="4" />
              <text x="127" y="20" textAnchor="middle" fontSize="36" fill="#718da4">
                ¹⁵NH₄Cl
              </text>
            </svg>
            <div>
              <p>{t('提取后的DNA')}</p>
              <GradientTube generation={0} hypothesis="semiconservative" progress={ease(p)} />
            </div>
          </div>
          <p className="bio-replication-note">
            {t('DNA停在与自身浮力密度相等的位置；不是沉到管底。')}
          </p>
        </>
      ) : ['first', 'second', 'dispersive'].includes(m) ? (
        <Predictions generation={g} hypothesis={h} progress={p} />
      ) : m === 'lineage' ? (
        <Lineage generation={g} hypothesis={h} />
      ) : (
        <Fork time={forkTime} polymerase={f.watch || polymerase} primers={f.watch || primers} />
      )}{' '}
      {!f.watch && (
        <div className="bio-replication-controls">
          <label>
            {t('观察过程')}
            <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              {modes.map((v, i) => (
                <option key={v} value={v}>
                  {t(names[i])}
                </option>
              ))}
            </select>
          </label>
          {['first', 'second', 'dispersive', 'lineage'].includes(m) && (
            <>
              <Segments
                label={t('复制假说')}
                value={hypothesis}
                onChange={(value) => setHypothesis(value as ReplicationHypothesis)}
                options={(
                  ['semiconservative', 'conservative', 'dispersive'] as ReplicationHypothesis[]
                ).map((v) => ({ value: v, label: t(hypothesisNames[v]) }))}
              />
              <Range
                label={t('转入轻氮后的代数')}
                min={0}
                max={3}
                value={generation}
                onChange={setGeneration}
              />
            </>
          )}
          {['unwind', 'extend', 'finish'].includes(m) && (
            <>
              <button onClick={() => setPrimers(!primers)}>
                {t(primers ? '引物：有' : '引物：无')}
              </button>
              <button onClick={() => setPolymerase(!polymerase)}>
                {t(polymerase ? 'DNA聚合酶：有' : 'DNA聚合酶：无')}
              </button>
            </>
          )}
          {m !== 'lineage' && (
            <Range
              label={t('过程进度')}
              min={0}
              max={1}
              step={0.01}
              value={progress}
              onChange={setProgress}
            />
          )}
        </div>
      )}
    </div>
  );
}
