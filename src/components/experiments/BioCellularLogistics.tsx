import { useId, useState } from 'react';
import { t, browserLocale } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  cellProjection,
  erLumen,
  golgiLumen,
  membraneSegments,
  fusionPort,
  transportCenter,
  VESICLE_RADIUS,
  historicalLocalization,
  transportModel,
  membraneSegmentsFromFusions,
  cellBoundaryFromFusions,
  lumenHandoff,
  logisticsChapters,
  logisticsDurations,
  logisticsDirector,
  type Point3,
  type LogisticsChapter,
  type ExportGate,
} from '../../models/bio-cellular-logistics';
import '../../styles/bio-cellular-logistics.css';
type ModelState = ReturnType<typeof transportModel>;
const line = (points: { x: number; y: number }[]) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' ');
const names = ['定位证据', '推断路径', '膜怎样交接', '阻断与恢复', '检验连接'];
function Cargo({
  x,
  y,
  ring = false,
  size = 3,
}: {
  x: number;
  y: number;
  ring?: boolean;
  size?: number;
}) {
  return (
    <g>
      <path
        d={`M${x - size} ${y - size}l${size} ${-size * 0.45} ${size} ${size} ${-size * 0.3} ${size * 1.6} ${-size * 1.5} ${-size * 0.1}Z`}
        fill={ring ? '#a36b4e' : '#b38c65'}
      />
      {ring && <circle cx={x} cy={y} r={size + 4} fill="none" stroke="#9f6b45" strokeWidth="1.5" />}
    </g>
  );
}
function CellDrawing({
  sample,
  state,
  angle = 0,
}: {
  sample?: number;
  state?: ModelState;
  angle?: number;
}) {
  const uid = useId().replace(/:/g, ''),
    project = (v: Point3) => {
      const p = cellProjection(v.x, v.y, v.z, angle);
      return { x: 175 + p.x, y: 130 + p.y, depth: p.depth };
    },
    path = (points: Point3[]) => line(points.map(project));
  const snapshot = sample === undefined ? undefined : historicalLocalization(sample),
    outline = state ? cellBoundaryFromFusions(state.fusions) : membraneSegments(0)[0],
    nucleus = project({ x: -62, y: 45, z: 0 }),
    mito = project({ x: 15, y: 65, z: 15 });
  return (
    <svg
      className="blp-cell"
      viewBox="0 0 370 260"
      role="img"
      aria-label={t(
        snapshot ? '不同时间样本的教材定位图解' : '解释模型：同一批货物在膜围成的空间转运',
      )}
    >
      <defs>
        <radialGradient id={uid}>
          <stop stopColor="#edf0dc" />
          <stop offset="1" stopColor="#d8e1c7" />
        </radialGradient>
      </defs>
      <path d={path(outline) + 'Z'} fill={`url(#${uid})`} />
      {(state?.membranes ?? [outline]).map((ps, i) => (
        <path key={i} d={path(ps)} fill="none" stroke="#859b79" strokeWidth="3" />
      ))}
      {state?.fusions
        .filter((g) => g.active)
        .map((g) => (
          <path key={g.group} d={path(g.arc)} fill="none" stroke="#859b79" strokeWidth="3" />
        ))}
      <ellipse
        cx={nucleus.x}
        cy={nucleus.y}
        rx="32"
        ry="29"
        fill="#c2b8c7"
        stroke="#9b91a5"
        strokeWidth="2"
      />
      <ellipse
        cx={nucleus.x}
        cy={nucleus.y}
        rx="27"
        ry="24"
        fill="none"
        stroke="#e0d8e2"
        strokeWidth="2"
      />
      <ellipse cx={nucleus.x + 7} cy={nucleus.y - 5} rx="9" ry="8" fill="#a397ae" />
      {[0, 1, 2, 3].map((lane) => (
        <g key={`er${lane}`}>
          <path
            d={path(Array.from({ length: 41 }, (_, i) => erLumen(lane, i / 40)))}
            fill="none"
            stroke="#a5b28b"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d={path(Array.from({ length: 41 }, (_, i) => erLumen(lane, i / 40)))}
            fill="none"
            stroke="#eeeacb"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {Array.from({ length: 8 }, (_, i) => {
            const v = erLumen(lane, 0.05 + i * 0.12),
              q = project({ ...v, y: v.y - 7 });
            return <circle key={i} cx={q.x} cy={q.y} r="2" fill="#7d8b71" />;
          })}
        </g>
      ))}
      {[0, 1, 2, 3].map((lane) => (
        <g key={`golgi${lane}`}>
          <path
            d={path(Array.from({ length: 41 }, (_, i) => golgiLumen(lane, i / 40)))}
            fill="none"
            stroke="#b7a785"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d={path(Array.from({ length: 41 }, (_, i) => golgiLumen(lane, i / 40)))}
            fill="none"
            stroke="#eee3c6"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      ))}
      <g transform={`translate(${mito.x} ${mito.y}) rotate(-20)`}>
        <ellipse rx="27" ry="14" fill="#c5b89b" stroke="#a7977a" strokeWidth="2" />
        <path d="M-20 0q5-18 10 0t10 0t10 0t10 0" stroke="#eee6cb" strokeWidth="2" fill="none" />
      </g>
      {state?.groups.map((g) => {
        if (!((g.clock >= 8 && g.clock < 14) || (g.clock >= 35 && g.clock <= 108)) || g.blocked)
          return null;
        const center = transportCenter(g.group, g.legacyTime);
        return (
          <path
            key={g.group}
            d={path(
              Array.from({ length: 49 }, (_, i) => ({
                x: center.x + VESICLE_RADIUS * Math.cos((i / 48) * Math.PI * 2),
                y: center.y + VESICLE_RADIUS * Math.sin((i / 48) * Math.PI * 2),
                z: center.z,
              })),
            )}
            fill="#e8e2c9"
            stroke="#9ba784"
            strokeWidth="1.5"
          />
        );
      })}
      {snapshot?.minutes === 117 &&
        [0, 1, 2, 3].map((g) => {
          const c = transportCenter(g, 108 + g * 0.2);
          return (
            <path
              key={g}
              d={path(
                Array.from({ length: 49 }, (_, i) => ({
                  x: c.x + 7 * Math.cos((i / 48) * Math.PI * 2),
                  y: c.y + 7 * Math.sin((i / 48) * Math.PI * 2),
                  z: c.z,
                })),
              )}
              fill="#e8e2c9"
              stroke="#9ba784"
              strokeWidth="1.5"
            />
          );
        })}
      {snapshot?.spots.map((c, i) => {
        const q = project(c);
        return (
          <path
            key={c.id}
            d={`M${q.x - 3} ${q.y - 2}l5 ${i % 2 ? 3 : -2}`}
            stroke="#8f705b"
            strokeWidth="3"
            strokeLinecap="round"
          />
        );
      })}
      {state?.cargo
        .toSorted((a, b) => project(a).depth - project(b).depth)
        .map((c) => {
          const p = project(c);
          return <Cargo key={c.id} x={p.x} y={p.y} ring={c.id === 0} size={2.5} />;
        })}
    </svg>
  );
}
function PulseBand({ chase = false }: { chase?: boolean }) {
  return (
    <div className="blp-pulse">
      <div className="blp-pulse-labels">
        <span>{t('短时标记')}</span>
        <span>{t('换成未标记原料')}</span>
      </div>
      <div className="blp-pulse-track">
        <i />
        <b />
        {Array.from({ length: 8 }, (_, i) => (
          <span
            key={i}
            style={{ left: `${i * 11 + 5}%`, background: i < 2 ? '#af815d' : '#aab69a' }}
          />
        ))}
      </div>
      {chase && <span className="blp-note">{t('后续没有再次加入标记')}</span>}
    </div>
  );
}
function HistoryView({ sample, summary = false }: { sample: number; summary?: boolean }) {
  const s = historicalLocalization(sample),
    locations = ['粗面内质网', '高尔基体', '近膜囊泡与胞外'];
  return (
    <div className="blp-history">
      <div className="blp-evidence-title">
        <strong>{s.minutes} min</strong>
        <span>
          {t('独立样本')} {['A', 'B', 'C'][sample]}
        </span>
      </div>
      <CellDrawing sample={sample} />
      <div className="blp-location">{t(locations[sample])}</div>
      {summary && (
        <div className="blp-evidence-strip">
          {[3, 17, 117].map((m, i) => (
            <div key={m}>
              <b>{m} min</b>
              <span>{t(['内质网', '高尔基体', '囊泡 / 胞外'][i])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function Inference({ shot, progress }: { shot: string; progress: number }) {
  const inferred = shot === 'inferred-route';
  return (
    <div className="blp-inference">
      <PulseBand chase />
      <div className="blp-order">
        {['内质网', '高尔基体', '囊泡 / 胞外'].map((n, i) => (
          <div key={n}>
            <strong>{[3, 17, 117][i]} min</strong>
            <span>{t(n)}</span>
            {i < 2 && inferred && (
              <svg viewBox="0 0 52 20" aria-hidden="true" style={{ opacity: progress }}>
                <path
                  d="M2 10H46m-8-6 8 6-8 6"
                  fill="none"
                  stroke="#9d865e"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
              </svg>
            )}
          </div>
        ))}
      </div>
      {shot === 'fresh-label-counterexample' ? (
        <div className="blp-counter">
          <span className="blp-strike">{t('在高尔基体重新加标记')}</span>
          <span>{t('与追踪条件不符')}</span>
        </div>
      ) : (
        <span className="blp-note">
          {t(inferred ? '支持的先后路径；不是连续录像' : '追踪同一批新合成的蛋白质')}
        </span>
      )}
    </div>
  );
}
function Handoff({ kind, progress }: { kind: 'bud' | 'fuse'; progress: number }) {
  const s = lumenHandoff(kind, progress),
    er = kind === 'bud',
    left = er ? 18 : s.wall,
    width = er ? s.wall - 18 : 302 - s.wall;
  return (
    <div className="blp-handoff">
      <div className="blp-two-labels">
        <span>{t(er ? '内质网腔' : '载体腔')}</span>
        <span>{t(er ? '细胞质' : '高尔基体腔')}</span>
      </div>
      <svg
        viewBox="0 0 320 215"
        role="img"
        aria-label={t('同一交点确定膜颈开口和载体膜，货物沿接通的腔室移动')}
      >
        <rect
          x={left}
          y="38"
          width={width}
          height="166"
          rx="14"
          fill={er ? '#e1e5c6' : '#e9dec5'}
        />
        <circle cx={s.center.x} cy={s.center.y} r={s.radius} fill={er ? '#e1e5c6' : '#e9dec5'} />
        <path
          d={`M${er ? 18 : 302} 38H${s.wall}V${s.low}M${s.wall} ${s.high}V204H${er ? 18 : 302}`}
          fill="none"
          stroke={er ? '#96a47e' : '#b3a07b'}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d={line(s.arc)}
          fill="none"
          stroke={er ? '#96a47e' : '#b3a07b'}
          strokeWidth="4"
          strokeLinecap="round"
        />
        {er &&
          Array.from({ length: 5 }, (_, i) => (
            <circle key={i} cx={30 + i * 18} cy="30" r="4" fill="#798970" />
          ))}
        <Cargo x={s.cargo.x} y={s.cargo.y} ring size={5} />
        {s.opening > 2 && (
          <path
            d={`M${s.wall} ${s.low + 3}V${s.high - 3}`}
            stroke="#b99461"
            strokeWidth="3"
            strokeDasharray="3 4"
          />
        )}
      </svg>
      <span className="blp-note">
        {t(
          er
            ? s.closedCarrier
              ? '膜颈闭合，载体独立'
              : '膜围成同一个空间'
            : s.connected
              ? '融合孔接通两个腔室'
              : '货物保留在膜内',
        )}
      </span>
    </div>
  );
}
function SurfaceView({
  progress,
  allowed = true,
  angle = 0,
}: {
  progress: number;
  allowed?: boolean;
  angle?: number;
}) {
  const state = transportModel(progress, {}, allowed),
    g = state.fusions[0],
    port = fusionPort(0),
    center = transportCenter(0, state.groups[0].legacyTime),
    project = (v: Point3) => {
      const q = cellProjection(v.x - port.boundary.x, v.y - port.boundary.y, v.z, angle);
      return { x: 170 + q.x * 5, y: 105 + q.y * 5 };
    },
    path = (ps: Point3[]) => line(ps.map(project)),
    outline = cellBoundaryFromFusions([g]);
  return (
    <div className="blp-surface">
      <div className="blp-two-labels">
        <span>{t('细胞内')}</span>
        <span>{t('胞外')}</span>
      </div>
      <svg
        viewBox="0 0 320 210"
        role="img"
        aria-label={t('货物只能通过同一几何形成的融合孔释放，完整膜时仍留在囊泡腔')}
      >
        <path d={path(outline) + 'Z'} fill="#dce5c9" />
        {membraneSegmentsFromFusions([g]).map((ps, i) => (
          <path key={i} d={path(ps)} fill="none" stroke="#879d7a" strokeWidth="3" />
        ))}
        {g.active ? (
          <path d={path(g.arc)} fill="none" stroke="#879d7a" strokeWidth="3" />
        ) : (
          <path
            d={path(
              Array.from({ length: 65 }, (_, i) => ({
                x: center.x + 7 * Math.cos((i / 64) * Math.PI * 2),
                y: center.y + 7 * Math.sin((i / 64) * Math.PI * 2),
                z: center.z,
              })),
            )}
            fill="#e8e3c9"
            stroke="#879d7a"
            strokeWidth="3"
          />
        )}
        {state.cargo
          .filter((c) => c.group === 0)
          .map((c) => {
            const q = project(c);
            return <Cargo key={c.id} x={q.x} y={q.y} ring={c.id === 0} size={3} />;
          })}
      </svg>
      <span className="blp-note">
        {t(!allowed ? '接触不等于连通' : g.progress < 1 ? '融合孔逐渐打开' : '囊泡膜并入细胞膜')}
      </span>
    </div>
  );
}
function Distribution({ state }: { state: ModelState }) {
  return (
    <svg viewBox="0 0 320 92" aria-hidden="true">
      <path
        d="M9 13Q54 3 103 13M9 34Q54 24 103 34M9 55Q54 45 103 55M9 76Q54 66 103 76"
        fill="none"
        stroke="#9da985"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path d="M221 2Q202 45 221 90" fill="none" stroke="#879d7a" strokeWidth="3" />
      {state.cargo.map((c) => {
        const region = c.compartment === 'er' ? 0 : c.compartment === 'outside' ? 2 : 1,
          slot = c.id;
        const x = [18, 123, 239][region] + (slot % 6) * 11,
          y = 16 + Math.floor(slot / 6) * 19;
        return <Cargo key={c.id} x={x} y={y} size={2.4} ring={c.id === 0} />;
      })}
    </svg>
  );
}
function BlockView({
  time,
  gate,
  question = false,
}: {
  time: number;
  gate: ExportGate;
  question?: boolean;
}) {
  const states = [transportModel(time), transportModel(time, gate)];
  return (
    <div className="blp-block">
      <div className="blp-ledger-head">
        <span>{t('内质网')}</span>
        <span>{t('转运中')}</span>
        <span>{t('胞外')}</span>
      </div>
      {states.map((s, i) => (
        <div className="blp-comparison-row" key={i}>
          <div className="blp-condition">
            <strong>
              {t(
                i
                  ? gate.reopenAt !== undefined
                    ? '阻断后恢复'
                    : (gate.closeAt ?? 0) > 0
                      ? '晚期阻断'
                      : '只阻断内质网出口'
                  : '正常对照',
              )}
            </strong>
            <span>
              {question
                ? '?'
                : `${s.counts.er} / ${s.counts.golgi + s.counts.vesicle} / ${s.counts.outside}`}
            </span>
          </div>
          <Distribution state={s} />
        </div>
      ))}
      <span className="blp-note">
        {t(question ? '同一起点，先作预测' : '24 个教学标记的位置统计')}
      </span>
    </div>
  );
}
export default function BioCellularLogistics() {
  const f = useShowcase(),
    [chosen, setChosen] = useState<LogisticsChapter | null>(null),
    [progress, setProgress] = useState(0.65),
    [angle, setAngle] = useState(0),
    [gateChoice, setGateChoice] = useState('early'),
    [fusionAllowed, setFusionAllowed] = useState(false),
    [sample, setSample] = useState(0);
  const index = f.watch
      ? Math.min(4, Math.max(0, f.chapter))
      : logisticsChapters.indexOf(chosen ?? logisticsChapters[Math.min(4, Math.max(0, f.chapter))]),
    mode = logisticsChapters[index],
    time = f.watch ? f.chapterTime : progress * logisticsDurations[index],
    d = logisticsDirector(index, time, browserLocale()),
    shot = d.shot,
    gate: ExportGate =
      gateChoice === 'normal'
        ? {}
        : gateChoice === 'late'
          ? { closeAt: 0.245 }
          : gateChoice === 'resume'
            ? { closeAt: 0, reopenAt: 0.8 }
            : { closeAt: 0 };
  return (
    <section className="blp-root" data-logistics-chapter={mode} data-logistics-shot={shot}>
      <div className={`blp-scene blp-shot-${shot}`}>
        {mode === 'pulse' ? (
          f.watch && shot === 'pulse-label' ? (
            <>
              <PulseBand />
              <CellDrawing sample={0} />
              <span className="blp-note">{t('标记的是新合成的一批蛋白质')}</span>
            </>
          ) : (
            <HistoryView
              sample={f.watch ? d.sample : sample}
              summary={f.watch && shot === 'sample-summary'}
            />
          )
        ) : mode === 'golgi' ? (
          shot === 'explanatory-cargo' ? (
            <>
              <CellDrawing state={transportModel(d.route)} angle={f.watch ? 0 : angle} />
              <span className="blp-note">{t('解释模型；跟住带环货物')}</span>
            </>
          ) : (
            <Inference shot={shot} progress={d.inference} />
          )
        ) : mode === 'vesicles' ? (
          shot === 'budding' || shot === 'golgi-fusion' ? (
            <Handoff kind={shot === 'budding' ? 'bud' : 'fuse'} progress={d.handoff} />
          ) : (
            <>
              <CellDrawing state={transportModel(d.route)} angle={f.watch ? 0 : angle} />
              <span className="blp-note">
                {t(
                  shot === 'separate-compartments'
                    ? '分离的腔室，由载体交接'
                    : '分泌载体接近细胞表面',
                )}
              </span>
            </>
          )
        ) : mode === 'release' ? (
          f.watch && shot === 'surface-fusion' ? (
            <SurfaceView progress={d.fusion} angle={f.watch ? 0 : angle} />
          ) : (
            <BlockView
              question={f.watch && shot === 'block-question'}
              time={
                f.watch ? (shot === 'late-block' ? d.lateComparison : d.comparison) : progress * 1.7
              }
              gate={f.watch ? (shot === 'late-block' ? { closeAt: 0.245 } : { closeAt: 0 }) : gate}
            />
          )
        ) : f.watch && shot === 'model-carriers' ? (
          <>
            <CellDrawing state={transportModel(0.29)} angle={f.watch ? d.rotation : angle} />
            <span className="blp-note">{t('没有永久连接内质网和高尔基体的管道')}</span>
          </>
        ) : (
          <SurfaceView
            progress={f.watch ? d.structureFusion : 0.88 + 0.12 * progress}
            allowed={f.watch ? shot === 'connected-fusion' : fusionAllowed}
            angle={f.watch ? d.rotation : angle}
          />
        )}
      </div>
      {!f.watch && (
        <div className="blp-controls">
          <Segments
            label={t('选择证据')}
            value={mode}
            onChange={(v) => setChosen(v as LogisticsChapter)}
            options={logisticsChapters.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          {mode !== 'pulse' && (
            <Range
              label={t('解释进程')}
              value={progress}
              min={0}
              max={1}
              step={0.01}
              onChange={setProgress}
            />
          )}
          {mode === 'pulse' && (
            <Segments
              label={t('选择独立样本')}
              value={String(sample)}
              onChange={(v) => setSample(Number(v))}
              options={[3, 17, 117].map((m, i) => ({ value: String(i), label: `${m} min` }))}
            />
          )}
          {mode === 'release' && (
            <Segments
              label={t('出口条件')}
              value={gateChoice}
              onChange={setGateChoice}
              options={[
                { value: 'normal', label: t('正常') },
                { value: 'early', label: t('早期阻断') },
                { value: 'late', label: t('晚期阻断') },
                { value: 'resume', label: t('阻断后恢复') },
              ]}
            />
          )}
          {mode === 'model' && (
            <button
              type="button"
              aria-pressed={fusionAllowed}
              onClick={() => setFusionAllowed(!fusionAllowed)}
            >
              {t(fusionAllowed ? '关闭融合通路' : '允许膜融合')}
            </button>
          )}
          {(mode === 'model' ||
            (mode === 'golgi' && shot === 'explanatory-cargo') ||
            (mode === 'vesicles' && !['budding', 'golgi-fusion'].includes(shot))) && (
            <Range
              label={t('剖面观察角度')}
              value={angle}
              min={-35}
              max={35}
              unit="°"
              onChange={setAngle}
            />
          )}
          <p>{t('模型进度不是分钟；颗粒数、尺寸与速度为教学示意。')}</p>
        </div>
      )}
    </section>
  );
}
