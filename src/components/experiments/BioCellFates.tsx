import { useState } from 'react';
import { browserLocale, t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  observedRegeneration,
  regenerationHypothesis,
  differentiationProgram,
  cultureComparison,
  textbookNuclearSwap,
  wormCellFates,
  lineageFrame,
  executionComparison,
  fatesDirector,
  cytoplastEvidence,
  type FatesMode,
} from '../../models/bio-cell-fates';
import '../../styles/bio-cell-fates.css';
const modes: FatesMode[] = ['culture', 'age', 'nuclear', 'limits', 'lineage', 'genes'];
const names = ['再生的证据', '培养比较', '核质来源', '研究边界', '细胞谱系', '命运对照'];
function Fibroblast({
  x,
  y,
  color,
  nucleus,
  scale = 1,
}: {
  x: number;
  y: number;
  color: string;
  nucleus?: string;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M-59 16Q-17-10-9-19Q17-39 58-21Q19 0 12 15Q-9 38-59 16Z"
        fill={color}
        stroke="#999b89"
        strokeWidth="2"
      />
      {nucleus && <ellipse rx="14" ry="9" fill={nucleus} stroke="#f2eddf" />}
    </g>
  );
}

function CultureObservation({ progress }: { progress: number }) {
  const plant = observedRegeneration(progress);
  return (
    <>
      <svg
        className="bcf14-culture"
        viewBox="0 0 370 270"
        role="img"
        aria-label={t('胡萝卜韧皮部细胞经培养增殖，适宜条件下形成根茎叶')}
      >
        <path d="M45 78Q43 170 74 220Q101 162 91 78Z" fill="#c29663" stroke="#a77f55" />
        <path d="M68 82Q32 51 44 33Q69 54 71 75Q84 43 104 41Q99 68 74 83" fill="#8fa56c" />
        <path d="M87 128H138" stroke="#afad8c" strokeWidth="2" />
        <ellipse cx="182" cy="188" rx="49" ry="22" fill="#d5ddbc" stroke="#a0ad88" />
        {Array.from({ length: 16 }, (_, i) => {
          const a = i * 2.399,
            r = Math.sqrt(i) * 7;
          return (
            <g key={i} opacity={Math.min(1, Math.max(0, plant.proliferation * 16 - i))}>
              <rect
                x={177 + Math.cos(a) * r}
                y={180 + Math.sin(a) * r * 0.55}
                width="11"
                height="9"
                rx="3"
                fill="#b5c391"
                stroke="#91a270"
              />
              <circle
                cx={182 + Math.cos(a) * r}
                cy={184 + Math.sin(a) * r * 0.55}
                r="2"
                fill="#8d9780"
              />
            </g>
          );
        })}
        <path d="M234 175H263" stroke="#afad8c" strokeWidth="2" />
        <path
          d={`M297 193Q${290 - plant.root * 15} ${193 + plant.root * 18} ${291 - plant.root * 7} ${193 + plant.root * 47}M297 193Q${307 + plant.root * 12} ${193 + plant.root * 17} ${305 + plant.root * 6} ${193 + plant.root * 39}`}
          fill="none"
          stroke="#bca77e"
          strokeWidth="3"
        />
        <path d={`M297 193V${193 - plant.shoot * 116}`} stroke="#8a9e68" strokeWidth="5" />
        {[-1, 1].map((side) => (
          <path
            key={side}
            d={`M297 ${193 - plant.shoot * 70}Q${297 + side * plant.shoot * 65} ${193 - plant.shoot * 125} ${297 + side * plant.shoot * 42} ${193 - plant.shoot * 61}Q${297 + side * plant.shoot * 15} ${193 - plant.shoot * 45} 297 ${193 - plant.shoot * 70}`}
            fill="#91a86e"
          />
        ))}
        <path d="M269 212H329L321 256H278Z" fill="#c2a486" opacity={plant.shoot} />
      </svg>
      <div className="bcf14-legend">
        <span>{t('韧皮部细胞')}</span>
        <span>{t('细胞团块')}</span>
        <span>{t('根、茎、叶')}</span>
      </div>

      <p className="bcf14-note">{t('经典培养重构')}</p>
    </>
  );
}
function InformationEvidence({ lost }: { lost: boolean }) {
  const s = regenerationHypothesis(lost);
  return (
    <>
      <div className="bcf14-question">{t('发育所需信息，是否已全部丢失？')}</div>
      <svg
        viewBox="0 0 300 150"
        className="bcf14-information"
        role="img"
        aria-label={t('比较必需信息丢失假说与完整植株再生的观察')}
      >
        <path d="M25 43H273M25 69H273" stroke="#b2a2b5" strokeWidth="3" />
        {['growth', 'root', 'shoot'].map((id, i) => (
          <g key={id} data-program-id={id}>
            <rect
              x={36 + i * 84}
              y="38"
              width="60"
              height="36"
              rx="8"
              fill={lost ? '#eeeddd' : '#c9b8cd'}
              stroke="#a592ac"
              strokeWidth="2"
              strokeDasharray={lost ? '4 5' : undefined}
            />
            {lost && (
              <path d={`M${45 + i * 84} 44l40 23m0-23-40 23`} stroke="#b78775" strokeWidth="2" />
            )}
          </g>
        ))}
        <path
          d="M150 82V117"
          stroke="#9eaa8a"
          strokeWidth="2"
          strokeDasharray={lost ? '4 5' : undefined}
        />
        {lost ? (
          <path d="M136 98l28 22m0-22-28 22" stroke="#b78775" strokeWidth="3" />
        ) : (
          <path d="M136 105l11 12 20-27" fill="none" stroke="#829766" strokeWidth="3" />
        )}
      </svg>
      <p className="bcf14-note">
        {t(
          s.compatibleWithObservedResult
            ? '再生支持：所需信息仍可保留。'
            : '全部必需信息丢失，与再生观察不相容。',
        )}
      </p>
      <p className="bcf14-bound">{t('假说比较；不是基因测序。')}</p>
    </>
  );
}
function ExpressionEvidence({
  role,
  progress,
  prediction = false,
  answered = false,
}: {
  role: 'root' | 'shoot';
  progress: number;
  prediction?: boolean;
  answered?: boolean;
}) {
  const s = differentiationProgram(role, progress);
  return (
    <>
      <div className="bcf14-expression-head">
        <span>{t('同一套 DNA')}</span>
        <span>{t(role === 'root' ? '根的发育程序' : '茎叶发育程序')}</span>
      </div>
      <svg
        viewBox="0 0 300 168"
        className="bcf14-expression"
        role="img"
        aria-label={t('DNA程序身份不变，选择表达产生独立RNA与蛋白；现代简化解释')}
      >
        <ellipse cx="64" cy="83" rx="54" ry="70" fill="#ded4df" stroke="#b3a1b8" />
        {s.programs.map((g, i) => (
          <g key={g.id} data-program-id={g.id}>
            <path d={`M29 ${40 + i * 40}H96`} stroke="#9984a1" strokeWidth="2" />
            <rect
              x="40"
              y={30 + i * 40}
              width="44"
              height="20"
              rx="5"
              fill={g.selected ? '#b29cbd' : '#ded4df'}
              stroke="#9984a1"
            />
            {g.selected && (
              <path
                d={`M85 ${40 + i * 40}Q125 83 170 88`}
                fill="none"
                stroke="#9f879d"
                strokeWidth="2"
              />
            )}
          </g>
        ))}
        {s.transcript.visible && (
          <path
            data-transcript-id={s.transcript.id}
            d={`M${s.transcript.x} ${s.transcript.y}l6-6 6 6 6-6 6 6`}
            fill="none"
            stroke="#ac8d67"
            strokeWidth="3"
          />
        )}
        {s.protein.visible && (
          <g data-protein-id={s.protein.id}>
            <path d="M197 88l9-8m-8 1 8-1-1 8" fill="none" stroke="#9eaa8a" strokeWidth="2" />
            <path
              d="M211 79q-14-18 0-25q18-8 26 8q11 17-4 23q-16 7-22-6Z"
              fill="#a6b98b"
              stroke="#829966"
            />
            <path d="M236 94l10 17" stroke="#9eaa8a" strokeWidth="2" />
            {role === 'root' ? (
              <path
                d="M258 103v36m0-20-15 16m15-12 17 20"
                fill="none"
                stroke="#b7a07d"
                strokeWidth="4"
              />
            ) : (
              <path
                d="M258 147V111m0 12q-28-30-27-8q4 18 27 8m0 4q27-32 28-11q-4 19-28 11"
                fill="#9cb77d"
                stroke="#829966"
                strokeWidth="2"
              />
            )}
          </g>
        )}
      </svg>
      <div className="bcf14-molecule-labels">
        <span>DNA</span>
        <span>RNA</span>
        <span>{t('蛋白与结构')}</span>
      </div>
      <p className="bcf14-note">
        {t(
          prediction
            ? answered
              ? '保留信息 ≠ 保证再生'
              : '换了条件，还能保证再生吗？'
            : '保留信息，改变表达。',
        )}
      </p>
      <p className="bcf14-bound">{t('现代解释模型')}</p>
    </>
  );
}
function AgeEvidence({ same }: { same: boolean }) {
  const s = cultureComparison(same);
  return (
    <>
      <p className="bcf14-evidence-label">
        {t(same ? '同条件 · 教材记录' : '改变了培养条件 · 预测问题')}
      </p>
      <div className="bcf14-age">
        {s.rows.map((r, i) => (
          <div key={r.source} data-source={r.source}>
            <span>{t(['胎儿来源', '中年来源', '老年来源'][i])}</span>
            <div className="bcf14-bar">
              <i style={{ width: `${(r.max / 50) * 100}%` }} />
              <b style={{ left: `${(r.min / 50) * 100}%` }} />
            </div>
            <strong>{r.min === r.max ? r.max : `${r.min}–${r.max}`}</strong>
          </div>
        ))}
      </div>
      <p className="bcf14-evidence-label">{t('增殖代数')}</p>
      <div className="bcf14-alive">
        <svg viewBox="0 0 145 85" aria-hidden="true">
          <Fibroblast x={75} y={42} color="#ced8bc" nucleus="#a99ab3" />
        </svg>
        <span>{t('停止增殖 ≠ 已经死亡')}</span>
      </div>
      <p className="bcf14-note">
        {t(s.directlyComparable ? '不能换算个人寿命。' : '条件也改变了，不能只归因于来源。')}
      </p>
    </>
  );
}
function NuclearEvidence({ progress, focus }: { progress: readonly number[]; focus: number }) {
  return (
    <div className="bcf14-swap">
      {[false, true].map((young, i) => {
        const result = textbookNuclearSwap(young, !young),
          transfer = Math.min(1, progress[i] / 0.6),
          division = young ? Math.max(0, (progress[i] - 0.65) / 0.35) : 0,
          color = young ? '#9d92b0' : '#b1a58d';
        return (
          <div key={i} data-active={focus === i}>
            <p>{t(young ? '年轻核 + 衰老质' : '衰老核 + 年轻质')}</p>
            <svg
              viewBox="0 0 340 175"
              role="img"
              aria-label={t('供体核保持身份，受体细胞质保持自己的来源')}
            >
              <Fibroblast x={70} y={90} color={young ? '#c5d6b1' : '#d6c9b2'} />
              <Fibroblast
                x={267}
                y={90 - division * 31}
                scale={1 - division * 0.24}
                color={young ? '#d6c9b2' : '#c5d6b1'}
              />
              <g opacity={division}>
                <Fibroblast
                  x={267}
                  y={90 + division * 31}
                  scale={1 - division * 0.24}
                  color={young ? '#d6c9b2' : '#c5d6b1'}
                  nucleus={color}
                />
              </g>
              <path d="M129 90H209" stroke="#a9b18c" strokeWidth="2" strokeDasharray="4 5" />
              <ellipse
                data-nucleus-origin={young ? 'young' : 'old'}
                cx={70 + transfer * 197}
                cy={90 - 30 * Math.sin(transfer * Math.PI) - division * 31}
                rx="14"
                ry="9"
                fill={color}
                stroke="#f3efdf"
              />
            </svg>
            <p>
              {t(result.textbookProliferation === 'vigorous' ? '教材：分裂旺盛' : '教材：不分裂')}
            </p>
          </div>
        );
      })}
      <p className="bcf14-note">{t('教材对照；下一镜检验适用边界。')}</p>
    </div>
  );
}
function LimitsEvidence({ study }: { study: number }) {
  const evidence = cytoplastEvidence();
  return (
    <div className="bcf14-limits">
      <strong>{study}</strong>
      {study === 1976 ? (
        <>
          <p>{t('年轻核 + 老龄培养物细胞质')}</p>
          <svg
            viewBox="0 0 300 135"
            role="img"
            aria-label={t('培养年龄不同的核与质重组，多数重组细胞仅有限分裂')}
          >
            <Fibroblast x={72} y={62} color="#d6c9b2" nucleus="#9d92b0" scale={0.75} />
            <path d="M121 62H180" stroke="#a2ad8d" strokeWidth="2" strokeDasharray="4 4" />
            <Fibroblast x={225} y={43} color="#d6c9b2" nucleus="#9d92b0" scale={0.62} />
            <Fibroblast x={225} y={94} color="#d6c9b2" nucleus="#9d92b0" scale={0.62} />
          </svg>
          <p>{t('多数仅有限分裂；不是自动恢复年轻状态。')}</p>
        </>
      ) : (
        <>
          <p>{t('衰老细胞质与年轻细胞融合')}</p>
          <div className="bcf14-study-bars">
            <div>
              <span>{t('对照')}</span>
              <i style={{ height: '100%' }} />
              <strong>100%</strong>
            </div>
            <div>
              <span>{t('融合组')}</span>
              <i
                className="bcf14-bound-bar"
                style={{ height: `${100 * evidence.fusionUpperBound}%` }}
              />
              <strong>≤{Math.round(evidence.fusionUpperBound * 100)}%</strong>
            </div>
          </div>
          <p>{t('DNA 合成相对量；原文报告抑制至少 40%。')}</p>
        </>
      )}
      <p className="bcf14-note">{t('不同条件的研究，不能混算。')}</p>
    </div>
  );
}
function LocalLineage({ progress }: { progress: number }) {
  const nodes = lineageFrame(progress);
  const pos = (id: number) => {
    const n = nodes[id],
      first = 2 ** n.level - 1;
    return { x: 20 + ((id - first + 0.5) / 2 ** n.level) * 320, y: 20 + n.level * 49 };
  };
  // The reported totals stay fixed; the fifteen-node teaching branch has its
  // own presentation progress and must not invent an intermediate census.
  const total = wormCellFates(1);
  return (
    <>
      <svg
        className="bcf14-lineage"
        viewBox="0 0 360 190"
        role="img"
        aria-label={t('局部分支结构示意，保留母子关系和细胞身份')}
      >
        {nodes.map((n) => {
          const q = pos(n.id),
            parent = n.parent === null ? null : pos(n.parent);
          return (
            <g key={n.id} opacity={n.birth} data-lineage-id={n.cellId}>
              {parent && (
                <path
                  d={`M${parent.x} ${parent.y}V${q.y - 20}H${q.x}V${q.y}`}
                  fill="none"
                  stroke="#aab690"
                  strokeWidth="2"
                />
              )}
              <circle
                cx={q.x}
                cy={q.y}
                r={8 * (1 - 0.6 * n.death)}
                fill={n.death > 0 ? '#b39b8d' : '#94ad77'}
                opacity={1 - 0.75 * n.death}
              />
              {n.scheduledDeath && n.death > 0.9 && (
                <path
                  d={`M${q.x - 5} ${q.y - 5}l10 10m0-10-10 10`}
                  stroke="#a17e73"
                  strokeWidth="1.5"
                />
              )}
            </g>
          );
        })}
      </svg>
      <p className="bcf14-bound">{t('局部分支示意')}</p>
      <div className="bcf14-totals">
        <span>
          {t('产生')}
          <strong>1090</strong>
        </span>
        <span>
          {t('凋亡')}
          <strong>{total.dead}</strong>
        </span>
        <span>
          {t('保留')}
          <strong>{total.retained}</strong>
        </span>
      </div>
      <p className="bcf14-note">{t('标准体细胞总计')}</p>
    </>
  );
}
function FateCell({ death }: { death: number }) {
  return (
    <svg
      viewBox="0 0 130 140"
      role="img"
      aria-label={t('同一示意细胞，正常执行时凝缩，执行受阻时保留')}
      data-local-cell="local-10"
    >
      <ellipse
        cx="65"
        cy="69"
        rx={43 - 24 * death}
        ry={53 - 30 * death}
        fill="#cdd9ba"
        stroke="#9eaf87"
        strokeWidth="2"
      />
      <ellipse cx="65" cy="66" rx={19 - 11 * death} ry={25 - 17 * death} fill="#b4a0b6" />
    </svg>
  );
}
function GeneEvidence({
  progress,
  ced3,
  ced4,
}: {
  progress: number;
  ced3: boolean;
  ced4: boolean;
}) {
  const { normal, intervention: changed } = executionComparison(progress, ced3, ced4);
  return (
    <>
      <div className="bcf14-gene-pair">
        <div>
          <p>{t('正常执行')}</p>
          <FateCell death={normal.death} />
          <p>{t(normal.death > 0.8 ? '凋亡形态' : '同一示意分支')}</p>
        </div>
        <div>
          <p>{t('干预组')}</p>
          <FateCell death={changed.death} />
          <p>{t(changed.death > 0.8 ? '凋亡形态' : '细胞保留')}</p>
        </div>
      </div>
      <div className="bcf14-genechain">
        <span data-functional={ced4}>CED-4</span>
        <span>→</span>
        <span data-functional={ced3}>CED-3</span>
        <span>→</span>
        <span>{t(ced3 && ced4 ? '执行凋亡' : '执行受阻')}</span>
      </div>
      <p className="bcf14-bound">{t('执行关系简化')}</p>
    </>
  );
}

export default function BioCellFates() {
  const f = useShowcase(),
    d = fatesDirector(f.chapter, f.chapterTime, browserLocale()),
    [mode, setMode] = useState<FatesMode | null>(null),
    [progress, setProgress] = useState<number | null>(null),
    [shot, setShot] = useState<string | null>(null),
    [lost, setLost] = useState<boolean | null>(null),
    [role, setRole] = useState<'root' | 'shoot' | null>(null),
    [same, setSame] = useState(true),
    [study, setStudy] = useState<string | null>(null),
    [swap, setSwap] = useState<string | null>(null),
    [ced3, setCed3] = useState(false),
    [ced4, setCed4] = useState(true),
    [answerShown, setAnswerShown] = useState(false);
  const m = f.watch ? modes[Math.min(5, f.chapter)] : (mode ?? modes[Math.min(5, f.chapter)]),
    cultureShot = f.watch ? d.cultureShot : (shot ?? d.cultureShot),
    informationLost = f.watch ? d.hypothesisLost : (lost ?? d.hypothesisLost),
    programRole = f.watch ? d.programRole : (role ?? d.programRole),
    studyYear = f.watch ? d.study : Number(study ?? d.study),
    swapFocus = f.watch ? d.swapFocus : Number(swap ?? d.swapFocus),
    authoredProgress =
      m === 'culture' && cultureShot === 'expression'
        ? d.programProgress
        : m === 'nuclear'
          ? d.swapProgress[swapFocus]!
          : m === 'genes'
            ? d.geneReveal
            : d.progress,
    p = f.watch ? authoredProgress : (progress ?? authoredProgress),
    prediction = f.watch ? d.culturePrediction : shot === null && d.culturePrediction,
    answered = f.watch ? d.cultureAnswer : answerShown || d.cultureAnswer;
  return (
    <section
      className="bcf14"
      data-mode={m}
      data-watch={f.watch}
      data-fates-shot={m === 'culture' ? cultureShot : m}
      data-study={m === 'limits' ? studyYear : undefined}
      data-nuclear-focus={m === 'nuclear' ? swapFocus : undefined}
      data-program-role={m === 'culture' ? programRole : undefined}
    >
      <p className="bcf14-kind">{t(names[modes.indexOf(m)])}</p>
      {m === 'culture' ? (
        cultureShot === 'observed' ? (
          <CultureObservation progress={p} />
        ) : cultureShot === 'hypothesis' ? (
          <InformationEvidence lost={informationLost} />
        ) : (
          <ExpressionEvidence
            role={programRole}
            progress={f.watch || progress === null ? d.programProgress : p}
            prediction={prediction}
            answered={answered}
          />
        )
      ) : m === 'age' ? (
        <AgeEvidence same={f.watch || same} />
      ) : m === 'nuclear' ? (
        <NuclearEvidence
          progress={f.watch || progress === null ? d.swapProgress : [p, p]}
          focus={swapFocus}
        />
      ) : m === 'limits' ? (
        <LimitsEvidence study={studyYear} />
      ) : m === 'lineage' ? (
        <LocalLineage progress={p} />
      ) : (
        <GeneEvidence
          progress={f.watch || progress === null ? d.geneReveal : p}
          ced3={f.watch ? false : ced3}
          ced4={f.watch || ced4}
        />
      )}
      {!f.watch && (
        <div className="bcf14-controls">
          <Segments
            label={t('研究案例')}
            value={m}
            onChange={(v) => setMode(v as FatesMode)}
            options={modes.map((v, i) => ({ value: v, label: t(names[i]) }))}
          />
          {m === 'culture' && (
            <>
              {prediction && !answered && (
                <button type="button" onClick={() => setAnswerShown(true)}>
                  {t('揭晓再生预测')}
                </button>
              )}
              <Segments
                label={t('证据层级')}
                value={cultureShot}
                onChange={setShot}
                options={[
                  { value: 'observed', label: t('再生观察') },
                  { value: 'hypothesis', label: t('假说比较') },
                  { value: 'expression', label: t('表达解释') },
                ]}
              />
              {cultureShot === 'hypothesis' ? (
                <button
                  type="button"
                  aria-pressed={informationLost}
                  onClick={() => setLost(!informationLost)}
                >
                  {t(informationLost ? '必需信息：假设已丢失' : '必需信息：假设仍保留')}
                </button>
              ) : cultureShot === 'expression' ? (
                <Segments
                  label={t('表达程序')}
                  value={programRole}
                  onChange={setRole}
                  options={[
                    { value: 'root', label: t('根') },
                    { value: 'shoot', label: t('茎叶') },
                  ]}
                />
              ) : null}
            </>
          )}
          {m === 'age' ? (
            <button type="button" aria-pressed={same} onClick={() => setSame(!same)}>
              {t(same ? '保持相同培养条件' : '改为不同培养条件')}
            </button>
          ) : m === 'limits' ? (
            <Segments
              label={t('研究年份')}
              value={String(studyYear)}
              onChange={setStudy}
              options={[
                { value: '1976', label: '1976' },
                { value: '1983', label: '1983' },
              ]}
            />
          ) : (
            <Range
              label={t('示意进度')}
              value={p}
              min={0}
              max={1}
              step={0.01}
              onChange={setProgress}
            />
          )}
          {m === 'nuclear' && (
            <Segments
              label={t('核的来源')}
              value={String(swapFocus)}
              onChange={setSwap}
              options={[
                { value: '0', label: t('衰老核') },
                { value: '1', label: t('年轻核') },
              ]}
            />
          )}
          {m === 'genes' && (
            <>
              <button type="button" aria-pressed={ced3} onClick={() => setCed3(!ced3)}>
                {t(ced3 ? 'CED-3功能正常' : 'CED-3功能缺失')}
              </button>
              <button type="button" aria-pressed={ced4} onClick={() => setCed4(!ced4)}>
                {t(ced4 ? 'CED-4功能正常' : 'CED-4功能缺失')}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
