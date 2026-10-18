import { useState } from 'react';
import { browserLocale, t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  mitoticState,
  animalCytokinesis,
  cubeExchange,
  fixedRootField,
  type MitoticPhase,
  divisionDirector,
  FIXED_FEATURES,
  liveRecordAt,
} from '../../models/bio-cell-division';
import '../../styles/bio-cell-division.css';
type Mode = 'mitosis' | 'size' | 'prepare' | 'fixed';
const stageNames: Record<MitoticPhase, string> = {
  interphase: '间期',
  prophase: '前期',
  metaphase: '中期',
  anaphase: '后期',
  telophase: '末期',
  daughter: '子细胞',
};
function Cube({ edge, depth }: { edge: number; depth: number }) {
  const scale = 12,
    proj = (x: number, y: number, z: number) =>
      `${25 + (x * 0.8 + z * 0.42) * scale},${50 + (y * 0.8 - z * 0.32) * scale}`,
    face = (x: number, y: number, z: number, l: number) =>
      [proj(x, y, z), proj(x + l, y, z), proj(x + l, y + l, z), proj(x, y + l, z)].join(' '),
    d = Math.min(depth, edge / 2),
    core = edge - 2 * d;
  return (
    <svg
      viewBox="0 0 155 145"
      role="img"
      aria-label={t('立方体外层与尚未到达的内部核心按同一扩散深度绘制')}
    >
      <polygon
        points={[proj(0, 0, 0), proj(edge, 0, 0), proj(edge, 0, edge), proj(0, 0, edge)].join(' ')}
        fill="#d6c7a2"
        stroke="#ad9d7b"
      />
      <polygon
        points={[
          proj(edge, 0, 0),
          proj(edge, 0, edge),
          proj(edge, edge, edge),
          proj(edge, edge, 0),
        ].join(' ')}
        fill="#bea985"
        stroke="#ad9d7b"
      />
      <polygon points={face(0, 0, 0, edge)} fill="#d9c9a6" fillOpacity=".55" stroke="#ad9d7b" />
      {core > 0 && (
        <>
          <polygon points={face(d, d, d, core)} fill="#a98777" fillOpacity=".7" />
          <polygon
            points={[
              proj(d, d, d),
              proj(d + core, d, d),
              proj(d + core, d, d + core),
              proj(d, d, d + core),
            ].join(' ')}
            fill="#a98777"
            fillOpacity=".5"
          />
        </>
      )}
    </svg>
  );
}
function FixedGlyph({
  stage,
  x = 0,
  y = 0,
  scale = 1,
}: {
  stage: MitoticPhase;
  x?: number;
  y?: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect
        x="-25"
        y="-32"
        width="50"
        height="64"
        rx="8"
        fill="#e9e0d5"
        stroke="#b8a89b"
        strokeWidth="1.5"
      />
      {stage === 'interphase' ? (
        <>
          <ellipse rx="14" ry="18" fill="#cab2cc" />
          <path d="M-8 -8Q12 -2 -2 9T10 12" fill="none" stroke="#a081a5" strokeWidth="2" />
        </>
      ) : stage === 'telophase' ? (
        <>
          <ellipse cx="-13" rx="9" ry="19" fill="#c9afc9" />
          <ellipse cx="13" rx="9" ry="19" fill="#c9afc9" />
          <path d="M0 -27V27" stroke="#9c9487" strokeWidth="2" />
        </>
      ) : (
        Array.from({ length: stage === 'anaphase' ? 32 : 16 }, (_, j) => {
          const x =
            stage === 'metaphase'
              ? (j % 2) * 6 - 3
              : stage === 'anaphase'
                ? (j < 16 ? -13 : 13) + (j % 2) * 5 - 2.5
                : ((j * 11) % 32) - 16;
          const y =
            stage === 'metaphase'
              ? Math.floor(j / 2) * 5 - 18
              : stage === 'anaphase'
                ? Math.floor((j % 16) / 2) * 5 - 18
                : ((j * 7) % 39) - 19;
          const d =
            stage === 'anaphase'
              ? `M${x + (j < 16 ? 2 : -2)} ${y - 2}L${x} ${y}L${x + (j < 16 ? 2 : -2)} ${y + 2}`
              : `M${x - 2} ${y - 2}l4 4m0-4l-4 4`;
          return (
            <path
              key={j}
              d={d}
              fill="none"
              stroke="#98739e"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          );
        })
      )}
    </g>
  );
}
function PreparationEvidence({ progress }: { progress: number }) {
  const field = fixedRootField(0),
    cells = [0, 2, 20, 32, 41, 5, 7, 11, 14, 23, 38, 49].map((i) => field[i]);
  return (
    <>
      <svg
        viewBox="0 0 300 205"
        className="bcd13-preparation"
        role="img"
        aria-label={t('同十二个固定细胞，分散与染色只改变可见性，不让细胞继续分裂')}
      >
        <rect x="7" y="7" width="286" height="190" rx="18" fill="#e5e7da" stroke="#b7bca8" />
        {cells.map((cell, i) => (
          <g
            key={cell.id}
            opacity={0.25 + 0.75 * progress}
            data-fixed-cell={cell.id}
            data-fixed-stage={cell.stage}
          >
            <FixedGlyph
              stage={cell.stage}
              scale={0.62}
              x={145 + (38 + (i % 4) * 74 - 145) * progress}
              y={97 + (39 + Math.floor(i / 4) * 63 - 97) * progress}
            />
          </g>
        ))}
      </svg>
      <p className="bcd13-note">{t('形态固定；分散后看清。')}</p>
    </>
  );
}
function Field({
  field,
  selected,
  synchronized = false,
}: {
  field: number;
  selected: number;
  synchronized?: boolean;
}) {
  const cells = fixedRootField(field, synchronized),
    chosen = cells[selected] ?? cells[0];
  return (
    <>
      <svg
        viewBox="0 0 360 215"
        className="bcd13-field"
        role="img"
        aria-label={t('合成固定视野；每个细胞的阶段保持不变')}
      >
        {cells.map((c, i) => (
          <g key={c.id} data-fixed-cell={c.id} data-fixed-stage={c.stage}>
            <FixedGlyph stage={c.stage} x={c.x} y={c.y} scale={0.51} />
            {i === selected && (
              <rect
                x={c.x - 15}
                y={c.y - 18}
                width="30"
                height="37"
                rx="5"
                fill="none"
                stroke="#a6784d"
                strokeWidth="2"
              />
            )}
          </g>
        ))}
      </svg>
      <p className="bcd13-note">
        {t('细胞')} {chosen.id + 1} · {t(stageNames[chosen.stage])}
      </p>
    </>
  );
}
function FeatureComparison({ active }: { active: number }) {
  const cells = fixedRootField(0);
  return (
    <>
      <div className="bcd13-features">
        {FIXED_FEATURES.map((f, i) => (
          <div
            key={f.cell}
            className={i === active ? 'bcd13-active' : ''}
            data-fixed-cell={f.cell}
            data-fixed-stage={cells[f.cell].stage}
          >
            <svg viewBox="0 0 80 76" role="img" aria-label={t(f.feature)}>
              <FixedGlyph stage={cells[f.cell].stage} x={40} y={38} />
            </svg>
            <p className="bcd13-feature-id">{f.cell + 1}</p>
            <p className="bcd13-feature-detail">
              {f.cell + 1} · {t(stageNames[f.stage])}
            </p>
            <p className="bcd13-feature-detail">{t(f.feature)}</p>
          </div>
        ))}
      </div>
      <p className="bcd13-phone-feature">
        {t(stageNames[FIXED_FEATURES[active].stage])} · {t(FIXED_FEATURES[active].feature)}
      </p>
      <p className="bcd13-note">{t('不同细胞的形态，提示候选次序。')}</p>
    </>
  );
}
function LiveRecord({ index }: { index: number }) {
  const r = liveRecordAt(index),
    two = index >= 2,
    late = index === 4;
  return (
    <>
      <div className="bcd13-record-head">
        <span>{t('同一活细胞')}</span>
        <strong>{r.minute} min</strong>
      </div>
      <svg
        viewBox="0 0 300 185"
        className="bcd13-record"
        role="img"
        aria-label={t('已发表的同一拟南芥细胞时序，形态概括而非显微照片')}
        data-record-cell={r.cellId}
        data-record-minute={r.minute}
      >
        <rect x="55" y="7" width="190" height="169" rx="24" fill="#e3e7da" stroke="#b7b6a8" />
        {index === 0 && (
          <>
            <path d="M72 91H105M195 91H228" stroke="#ad83a9" strokeWidth="6" />
            <ellipse cx="150" cy="91" rx="30" ry="34" fill="#88a17c" />
            <ellipse cx="150" cy="91" rx="18" ry="22" fill="#e3e7da" />
          </>
        )}
        {index > 0 && index < 4 && (
          <g stroke="#a786ac" fill="none" strokeWidth="2">
            {[-27, -14, 0, 14, 27].map((dx) => (
              <path
                key={dx}
                d={`M150 28Q${150 + dx * 2} 60 ${150 + dx} 91Q${150 + dx * 2} 122 150 155`}
              />
            ))}
          </g>
        )}
        {index === 1 && <ellipse cx="150" cy="91" rx="33" ry="8" fill="#789d70" />}
        {two &&
          [-1, 1].map((side) => (
            <g key={side}>
              <ellipse
                cx="150"
                cy={91 + side * (late ? 48 : index === 3 ? 37 : 27)}
                rx={late ? 26 : 29}
                ry={late ? 21 : 9}
                fill="#789d70"
              />
              {late && <ellipse cx="150" cy={91 + side * 48} rx="15" ry="11" fill="#d7e1ce" />}
            </g>
          ))}
      </svg>
      <p className="bcd13-note">{t('拟南芥 · 2013 · 时序概括')}</p>
    </>
  );
}
function CountComparison({ synchronized }: { synchronized: boolean }) {
  const groups = [fixedRootField(0), fixedRootField(0, synchronized)];
  return (
    <>
      <div className="bcd13-populations">
        {groups.map((cells, g) => (
          <div key={g}>
            <p>{t(g === 0 ? '不同步群体' : synchronized ? '同步群体' : '相同群体')}</p>
            <svg
              viewBox="0 0 130 95"
              role="img"
              aria-label={t('五十个合成细胞，中期用紫色标出')}
              data-metaphase-count={cells.filter((c) => c.stage === 'metaphase').length}
            >
              {cells.map((c, i) => (
                <rect
                  key={c.id}
                  x={2 + (i % 10) * 13}
                  y={4 + Math.floor(i / 10) * 18}
                  width="10"
                  height="14"
                  rx="3"
                  fill={c.stage === 'metaphase' ? '#98739e' : '#d8d2c2'}
                />
              ))}
            </svg>
            <p>
              {t('中期')} {cells.filter((c) => c.stage === 'metaphase').length}/50
            </p>
          </div>
        ))}
      </div>
      <p className="bcd13-note">{t('周期设定相同；只改变起点分布。')}</p>
    </>
  );
}
export default function BioCellDivision() {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode | null>(null),
    [fixedView, setFixedView] = useState('field'),
    [synchronized, setSynchronized] = useState(false),
    [recordIndex, setRecordIndex] = useState(0),
    [featureIndex, setFeatureIndex] = useState(0),
    [progress, setProgress] = useState(2.5),
    [animal, setAnimal] = useState(false),
    [depth, setDepth] = useState(0.5),
    [field, setField] = useState(0),
    [selected, setSelected] = useState(0),
    [preparation, setPreparation] = useState(0.5);
  const directed = divisionDirector(f.chapter, f.chapterTime, browserLocale()),
    defaultMode: Mode =
      f.chapter < 4 ? 'mitosis' : f.chapter === 4 ? 'size' : f.chapter === 5 ? 'prepare' : 'fixed',
    m = f.watch ? defaultMode : (mode ?? defaultMode),
    p = f.watch ? directed.preparation : preparation,
    stage = f.watch ? directed.mitosis : progress,
    state = mitoticState(stage),
    animalEnvelope = animalCytokinesis(stage),
    isAnimal = !f.watch && animal,
    penetration = f.watch ? directed.depth : depth,
    fixedShot = f.watch ? directed.fixedShot : fixedView,
    activeFeature = f.watch ? directed.feature : featureIndex,
    liveIndex = f.watch ? directed.recordIndex : recordIndex;
  return (
    <section
      className={`bcd13 bcd13-${f.watch ? 'watch' : 'explore'}`}
      data-division-mode={m}
      data-division-shot={m === 'fixed' ? fixedShot : m}
    >
      <p className="bcd13-kind">
        {t(
          m === 'mitosis'
            ? '分裂模型 · 2n = 4'
            : m === 'size'
              ? '表面积与体积的数学模型'
              : m === 'prepare'
                ? '固定装片，保留不同阶段'
                : fixedShot === 'live-record'
                  ? '独立证据：活细胞时序'
                  : '固定视野 · 合成示意',
        )}
      </p>
      {m === 'mitosis' ? (
        <>
          <svg
            className="bcd13-cell"
            viewBox="0 0 370 270"
            role="img"
            aria-label={t('姐妹染色单体保持身份，着丝粒分开后分别移向两极')}
          >
            {isAnimal ? (
              <path
                d={animalEnvelope.path}
                data-animal-split={animalEnvelope.split}
                data-membrane-gap={animalEnvelope.gap}
                fill="#e0d3cc"
                stroke="#a99b98"
                strokeWidth="3"
              />
            ) : (
              <rect
                x="24"
                y="24"
                width="322"
                height="222"
                rx="18"
                fill="#e4dfcf"
                stroke="#aaa48d"
                strokeWidth="4"
              />
            )}
            {stage < 2 && (
              <ellipse
                cx="185"
                cy="130"
                rx="89"
                ry="80"
                fill="#cec4d2"
                stroke="#9c8da7"
                strokeWidth="2"
                opacity={1 - Math.max(0, stage - 1)}
              />
            )}{' '}
            {stage >= 1 &&
              stage < 4.8 &&
              state.chromatids.map((c) => (
                <path
                  key={`sp-${c.id}`}
                  d={`M${c.sister === 0 ? 53 : 317} 130L${c.x} ${c.y}`}
                  stroke="#b9b19b"
                  strokeWidth="1"
                  opacity={Math.min(1, stage - 1)}
                />
              ))}
            {state.chromatids.map((c) => (
              <g
                key={c.id}
                opacity={c.visible}
                data-chromatid-id={c.id}
                data-original-chromosome={c.chromosome}
              >
                <path
                  d={Array.from({ length: 25 }, (_, j) => {
                    const u = j / 12 - 1,
                      relax = stage < 1 ? 1 - stage : Math.min(1, Math.max(0, stage - 4));
                    return `${j ? 'L' : 'M'}${c.x + c.armOffset * Math.abs(u) + relax * 5 * Math.sin(u * Math.PI * 3)} ${c.y + u * (14 + relax * 9)}`;
                  }).join(' ')}
                  fill="none"
                  stroke={c.color}
                  strokeWidth={
                    stage < 1 ? 1.5 + stage * 2.5 : 4 - 2.5 * Math.min(1, Math.max(0, stage - 4))
                  }
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx={c.x} cy={c.y} r="2.5" fill="#706779" opacity={Math.min(1, stage)} />
              </g>
            ))}
            {stage >= 4 &&
              animalEnvelope.nuclei.map((n, i) => (
                <ellipse
                  key={i}
                  cx={n.cx}
                  cy={n.cy}
                  rx={n.rx}
                  ry={n.ry}
                  fill="none"
                  stroke="#a398b0"
                  strokeWidth="2"
                  opacity={n.opacity}
                  data-daughter-nucleus={i}
                />
              ))}
            {!isAnimal && (
              <path
                d={`M185 ${135 - state.division * 109}V${135 + state.division * 109}`}
                stroke="#a6a089"
                strokeWidth="5"
                opacity={state.division > 0 ? 1 : 0}
              />
            )}
            <circle
              cx="53"
              cy="130"
              r="4"
              fill="#9a9f88"
              opacity={Math.max(0, Math.min(1, stage - 1, 5 - stage))}
            />
            <circle
              cx="317"
              cy="130"
              r="4"
              fill="#9a9f88"
              opacity={Math.max(0, Math.min(1, stage - 1, 5 - stage))}
            />
          </svg>
          <div className="bcd13-ledger">
            <span>{t(stageNames[state.phase])}</span>
            <span>
              {t(stage >= 5 ? '每个子细胞染色体' : '当前细胞染色体')} {state.chromosomesPerCell}
            </span>
            <span>
              {t(stage >= 5 ? '两子细胞合计 DNA' : '全细胞 DNA')} {stage < 1 ? '4 → 8' : 8}
            </span>
          </div>
        </>
      ) : m === 'size' ? (
        <>
          <p className="bcd13-note">{t('到达体积')}</p>
          <div className="bcd13-cubes">
            {[2, 4, 8].map((edge) => {
              const s = cubeExchange(edge, penetration);
              return (
                <div key={edge}>
                  <Cube edge={edge} depth={penetration} />
                  <p>{edge} mm</p>
                  <p>S/V = {s.areaPerVolume} mm⁻¹</p>
                  <p>{(s.fraction * 100).toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
        </>
      ) : m === 'prepare' ? (
        <PreparationEvidence progress={p} />
      ) : fixedShot === 'field' ? (
        <Field field={f.watch ? 0 : field} selected={f.watch ? 20 : selected} />
      ) : fixedShot === 'features' ? (
        <FeatureComparison active={activeFeature} />
      ) : fixedShot === 'live-record' ? (
        <LiveRecord index={liveIndex} />
      ) : (
        <CountComparison synchronized={f.watch ? directed.synchronized : synchronized} />
      )}
      {!f.watch && (
        <div className="bcd13-controls">
          <Segments
            label={t('观察对象')}
            value={m}
            onChange={(v) => setMode(v as Mode)}
            options={[
              { value: 'mitosis', label: t('分裂机制') },
              { value: 'size', label: t('大小模型') },
              { value: 'prepare', label: t('制片证据') },
              { value: 'fixed', label: t('固定视野') },
            ]}
          />
          {m === 'mitosis' && (
            <>
              <Range
                label={t('细胞周期进程')}
                value={progress}
                min={0}
                max={5.999}
                step={0.01}
                onChange={setProgress}
              />
              <button type="button" aria-pressed={animal} onClick={() => setAnimal(!animal)}>
                {t(animal ? '动物细胞' : '植物细胞')}
              </button>
            </>
          )}
          {m === 'size' && (
            <Range
              label={t('从每个表面向内的深度')}
              value={depth}
              min={0}
              max={1}
              step={0.05}
              unit="mm"
              onChange={setDepth}
            />
          )}{' '}
          {m === 'prepare' && (
            <Range
              label={t('分散与显色')}
              value={preparation}
              min={0}
              max={1}
              step={0.01}
              onChange={setPreparation}
            />
          )}
          {m === 'fixed' && (
            <>
              <Segments
                label={t('证据镜头')}
                value={fixedView}
                onChange={setFixedView}
                options={[
                  { value: 'field', label: t('固定视野') },
                  { value: 'features', label: t('形态比较') },
                  { value: 'live-record', label: t('活体记录') },
                  { value: 'counterexample', label: t('统计反例') },
                ]}
              />
              {fixedView === 'field' && (
                <Range
                  label={t('观察细胞编号')}
                  value={selected + 1}
                  min={1}
                  max={50}
                  step={1}
                  onChange={(v) => setSelected(v - 1)}
                />
              )}
              {fixedView === 'features' && (
                <Range
                  label={t('比较形态')}
                  value={featureIndex + 1}
                  min={1}
                  max={4}
                  step={1}
                  onChange={(v) => setFeatureIndex(v - 1)}
                />
              )}
              {fixedView === 'field' && (
                <button type="button" onClick={() => setField((field + 1) % 2)}>
                  {t('另一个合成视野')}
                </button>
              )}
              {fixedView === 'live-record' && (
                <Range
                  label={t('发表记录帧')}
                  value={recordIndex}
                  min={0}
                  max={4}
                  step={1}
                  onChange={setRecordIndex}
                />
              )}
              {fixedView === 'counterexample' && (
                <button
                  type="button"
                  aria-pressed={synchronized}
                  onClick={() => setSynchronized(!synchronized)}
                >
                  {t(synchronized ? '同步群体' : '不同步群体')}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
