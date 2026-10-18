import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  mitoticState,
  cubeExchange,
  fixedRootField,
  stageCounts,
  type MitoticPhase,
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
export default function BioCellDivision() {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(
      f.variant === 'size' ? 'size' : f.variant === 'fixed' ? 'fixed' : 'mitosis',
    ),
    [progress, setProgress] = useState(2.5),
    [animal, setAnimal] = useState(false),
    [depth, setDepth] = useState(0.5),
    [field, setField] = useState(0),
    [selected, setSelected] = useState(0),
    [preparation, setPreparation] = useState(0.5);
  const p = f.watch ? ease(ramp(f.chapterProgress, 0.05, 0.85)) : preparation,
    m = f.watch
      ? f.chapter < 4
        ? 'mitosis'
        : f.chapter === 4
          ? 'size'
          : f.chapter === 5
            ? 'prepare'
            : 'fixed'
      : mode,
    stage = f.watch
      ? f.chapter === 0
        ? p * 1.5
        : f.chapter === 1
          ? 1.5 + p * 1.5
          : f.chapter === 2
            ? 3 + p
            : f.chapter === 3
              ? 4 + p * 1.999
              : 0
      : progress,
    state = mitoticState(stage),
    isAnimal = !f.watch && animal,
    penetration = f.watch ? 0.5 : depth,
    root = fixedRootField(f.watch ? 0 : field),
    highlight = f.watch ? Math.min(49, Math.floor(p * 50)) : selected,
    counts = stageCounts(f.watch ? 0 : field),
    chosen = root[highlight];
  return (
    <section className="bio-division">
      <p className="bio-division-kind">
        {t(
          m === 'mitosis'
            ? '机制示意：2n = 4；洋葱实际2n = 16'
            : m === 'size'
              ? '表面积与体积的数学模型'
              : '固定装片：不同细胞，分别观察',
        )}
      </p>
      {m === 'mitosis' ? (
        <>
          <svg
            className="bio-division-cell"
            viewBox="0 0 370 270"
            role="img"
            aria-label={t('姐妹染色单体保持身份，着丝粒分开后分别移向两极')}
          >
            {isAnimal ? (
              <path
                d={`M185 ${25 + state.division * 110}C100 0 20 30 22 134C20 237 100 266 185 ${245 - state.division * 110}C270 266 350 237 348 134C350 30 270 0 185 ${25 + state.division * 110}Z`}
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
              <g key={c.id} opacity={c.visible}>
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
              [115, 255].map((x, i) => (
                <ellipse
                  key={i}
                  cx={x}
                  cy="120"
                  rx="43"
                  ry="83"
                  fill="none"
                  stroke="#a398b0"
                  strokeWidth="2"
                  opacity={Math.min(1, stage - 4)}
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
          <div className="bio-division-ledger">
            <span>{t(stageNames[state.phase])}</span>
            <span>
              {t(stage >= 5 ? '每个子细胞染色体' : '当前细胞染色体')} {state.chromosomesPerCell}
            </span>
            <span>
              {t('同一组DNA标记')} {Math.round(state.dnaInWholeSystem)}
            </span>
          </div>
        </>
      ) : m === 'size' ? (
        <>
          <p className="bio-division-note">{t('到达体积')}</p>
          <div className="bio-division-cubes">
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
        <>
          <svg
            className="bio-division-prepare"
            viewBox="0 0 370 240"
            role="img"
            aria-label={t('根尖先解离、漂洗和染色，再压片分散细胞')}
          >
            <path
              d="M43 35Q20 92 50 163Q60 179 67 161Q84 107 60 35"
              fill="#d7cdb6"
              stroke="#aaa086"
              strokeWidth="2"
            />
            <path d="M45 146L69 146" stroke="#a77a78" strokeWidth="3" />
            <path
              d="M106 94H174L159 144H121Z"
              fill="#c3adc3"
              fillOpacity={0.2 + 0.5 * p}
              stroke="#9c8c9e"
              strokeWidth="2"
            />
            <path
              d="M203 178L324 145L358 179L238 213Z"
              fill="#dce1d4"
              stroke="#a4afa0"
              strokeWidth="2"
            />
            {Array.from({ length: 12 }, (_, i) => (
              <rect
                key={i}
                x={239 + (i % 4) * 18 * p}
                y={167 + Math.floor(i / 4) * 8 * p}
                width="8"
                height="6"
                rx="2"
                fill="#ac8da8"
              />
            ))}
            <path
              d={`M224 ${145 - p * 8}L299 ${125 + p * 6}L331 ${153 + p * 6}L256 ${173 - p * 8}Z`}
              fill="#e6e9e0"
              fillOpacity=".4"
              stroke="#a9b3a2"
            />
          </svg>
          <div className="bio-division-ledger">
            <span>{t('解离')}</span>
            <span>{t('漂洗')}</span>
            <span>{t('染色')}</span>
            <span>{t('压片')}</span>
          </div>
        </>
      ) : (
        <>
          <svg
            className="bio-division-field"
            viewBox="0 0 360 215"
            role="img"
            aria-label={t('五十个固定细胞的时期保持不变，只移动观察位置')}
          >
            {root.map((cell, i) => {
              const x = cell.x,
                y = cell.y,
                s = cell.stage;
              return (
                <g key={cell.id} onClick={() => !f.watch && setSelected(i)}>
                  <rect
                    x={x - 13}
                    y={y - 15}
                    width="28"
                    height="34"
                    rx="5"
                    fill={i === highlight ? '#e2d5bd' : '#ebe4d6'}
                    stroke={i === highlight ? '#b18557' : '#c3b9a5'}
                    strokeWidth={i === highlight ? 2 : 1}
                  />
                  {s === 'interphase' ? (
                    <>
                      <ellipse cx={x} cy={y} rx="7" ry="10" fill="#c7aec8" />
                      <path d={`M${x - 4} ${y - 3}q7 5 0 7`} fill="none" stroke="#a58aa9" />
                    </>
                  ) : (
                    Array.from(
                      { length: s === 'anaphase' || s === 'telophase' ? 32 : 16 },
                      (_, j) => {
                        const q = s === 'anaphase' || s === 'telophase',
                          half = j < 16 ? -1 : 1,
                          dx = s === 'metaphase' ? 0 : q ? half * 6 : ((j * 7) % 15) - 7,
                          dy = s === 'metaphase' ? j - 7 : ((j * 5) % 19) - 9;
                        return (
                          <path
                            key={j}
                            d={`M${x + dx - 1} ${y + dy - 1}l2 2-2 2`}
                            fill="none"
                            stroke="#9a779e"
                            strokeWidth="1"
                          />
                        );
                      },
                    )
                  )}
                </g>
              );
            })}
          </svg>
          <div className="bio-division-fixedinfo">
            <span>
              {t('当前观察细胞')} {chosen.id + 1} · {t(stageNames[chosen.stage])}
            </span>
            <span>
              {t('间期')} {counts.interphase}/50 · {t('分裂期')} {50 - counts.interphase}/50
            </span>
          </div>
          <p className="bio-division-note">
            {t('装片细胞已固定；动画移动观察位置，不让同一个死细胞继续分裂。')}
          </p>
        </>
      )}
      {!f.watch && (
        <div className="bio-division-controls">
          <Segments
            label={t('观察对象')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'mitosis', label: t('分裂机制') },
              { value: 'size', label: t('大小模型') },
              { value: 'prepare', label: t('装片制作') },
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
              label={t('制片进程')}
              value={preparation}
              min={0}
              max={1}
              step={0.01}
              onChange={setPreparation}
            />
          )}
          {m === 'fixed' && (
            <>
              <Range
                label={t('观察细胞编号')}
                value={selected}
                min={0}
                max={49}
                step={1}
                onChange={setSelected}
              />
              <button type="button" onClick={() => setField((field + 1) % 2)}>
                {t('移动到另一个固定视野')}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
