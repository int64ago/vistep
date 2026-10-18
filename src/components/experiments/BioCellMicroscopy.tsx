import { useId, useState } from 'react';
import { t, browserLocale } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  cellPlate,
  fixedMicroscopyImage,
  leafChloroplast,
  LEAF_GEOMETRY,
  microscopyDirector,
  microscopeOptics,
  registeredStreaming,
  TARGET_CELL_ID,
  targetVisibility,
  visibleCells,
  WALL_LANDMARK,
  type MovementCondition,
  type Specimen,
} from '../../models/bio-cell-microscopy';
import '../../styles/bio-cell-microscopy.css';

function Leaf({
  seconds = 0,
  tracked = false,
  reference = false,
}: {
  seconds?: number;
  tracked?: boolean;
  reference?: boolean;
}) {
  const g = LEAF_GEOMETRY;
  return (
    <g>
      <rect
        x={-g.width / 2}
        y={-g.height / 2}
        width={g.width}
        height={g.height}
        rx="9"
        fill="#d8e2ab"
        stroke="#698755"
        strokeWidth="2"
      />
      <rect
        x={-g.vacuoleWidth / 2}
        y={-g.vacuoleHeight / 2}
        width={g.vacuoleWidth}
        height={g.vacuoleHeight}
        rx={g.vacuoleRadius}
        fill="#f1f0cf"
        stroke="#adbf88"
        strokeWidth=".8"
      />
      {Array.from({ length: 18 }, (_, i) => leafChloroplast(i, seconds)).map((p) => (
        <g
          key={p.id}
          data-chloroplast-id={p.id}
          transform={`translate(${p.x} ${p.y}) rotate(${p.angle})`}
        >
          <ellipse rx="4.6" ry="2.8" fill={p.id === 3 && tracked ? '#2c673d' : '#658e45'} />
          {p.id === 3 && tracked && (
            <ellipse rx="8" ry="6.5" stroke="#a46b36" strokeWidth="1.4" fill="none" />
          )}
        </g>
      ))}
      {reference && (
        <path
          d={`M${WALL_LANDMARK.x + 7} ${WALL_LANDMARK.y}H${WALL_LANDMARK.x}V${WALL_LANDMARK.y + 7}`}
          fill="none"
          stroke="#746191"
          strokeWidth="3"
        />
      )}
    </g>
  );
}
function Cheek({ width = 65, height = 55 }: { width?: number; height?: number }) {
  return (
    <g>
      <path
        d={`M${-width * 0.48} 0Q${-width * 0.4} ${-height * 0.6} 7 ${-height * 0.4}Q${width * 0.6} -20 ${width * 0.42} 16Q10 ${height * 0.6} ${-width * 0.4} 15Z`}
        fill="#e1d3cc"
        fillOpacity=".8"
        stroke="#a899a2"
        strokeWidth="1.2"
      />
      <ellipse cx="3" cy="2" rx="6" ry="5" fill="#8d809d" opacity=".85" />
    </g>
  );
}
function Field({
  sample = 'leaf',
  objective = 40,
  center = 0,
  target = false,
  seconds = 0,
}: {
  sample?: Specimen;
  objective?: number;
  center?: number;
  target?: boolean;
  seconds?: number;
}) {
  const uid = useId().replace(/:/g, ''),
    optics = microscopeOptics(objective),
    scale = 270 / optics.fieldUm;
  return (
    <svg className="bmx-field" viewBox="0 0 300 300" role="img" aria-label={t('显微视野示意')}>
      <defs>
        <clipPath id={uid}>
          <circle cx="150" cy="150" r="135" />
        </clipPath>
        <radialGradient id={`${uid}-light`}>
          <stop stopColor="#f7f4d7" />
          <stop offset=".85" stopColor="#e7e9c8" />
          <stop offset="1" stopColor="#becdb1" />
        </radialGradient>
      </defs>
      <circle cx="150" cy="150" r="141" fill="#577463" />
      <circle cx="150" cy="150" r="135" fill={`url(#${uid}-light)`} />
      <g clipPath={`url(#${uid})`}>
        <g transform={`translate(150 150) scale(${scale}) translate(${-center} 0)`}>
          {visibleCells(sample, optics.fieldUm, center).map((c) => (
            <g key={c.id} data-cell-id={c.id} transform={`translate(${c.x} ${c.y})`}>
              {sample === 'leaf' ? (
                optics.fieldUm < 800 || c.id === TARGET_CELL_ID ? (
                  <Leaf seconds={seconds} tracked={false} />
                ) : (
                  <rect
                    x={-c.width / 2}
                    y={-c.height / 2}
                    width={c.width}
                    height={c.height}
                    rx="9"
                    fill="#d5deb0"
                    stroke="#8b9e73"
                    strokeWidth="2"
                  />
                )
              ) : sample === 'cheek' ? (
                <Cheek width={c.width} height={c.height} />
              ) : (
                <rect
                  x={-c.width / 2}
                  y={-c.height / 2}
                  width={c.width}
                  height={c.height}
                  rx="4"
                  fill="#dccba1"
                  stroke="#a38c64"
                  strokeWidth="3"
                />
              )}
              {target && c.id === TARGET_CELL_ID && (
                <ellipse
                  data-target-ring="true"
                  rx={c.width / 2 + 10}
                  ry={c.height / 2 + 10}
                  fill="none"
                  stroke="#a66c31"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </g>
          ))}
        </g>
      </g>
      <path d="M143 150H157M150 143V157" stroke="#536b53" opacity=".6" fill="none" />
      <path
        d={`M${267 - 100 * scale} 271H267M${267 - 100 * scale} 268V274M267 268V274`}
        stroke="#385842"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}
function FieldReadout({ objective }: { objective: number }) {
  const optics = microscopeOptics(objective),
    settled = objective === 10 || objective === 40;
  return (
    <div className="bmx-readout">
      <span>{settled ? `${objective}×` : t('换镜过渡')}</span>
      <span>{Math.round(optics.fieldUm)} μm</span>
      <span>
        <i className="bmx-scale-symbol" />
        100 μm
      </span>
    </div>
  );
}
function Tissues() {
  return (
    <div className="bmx-tissues">
      <div>
        <Field sample="leaf" />
        <span>{t('植物叶细胞')}</span>
      </div>
      <div>
        <Field sample="cheek" />
        <span>{t('动物上皮')}</span>
      </div>
      <p className="bmx-shared-scale">
        <i className="bmx-scale-symbol" />
        100 μm · {t('独立样本，同一尺度')}
      </p>
    </div>
  );
}
function Cork({ shot }: { shot: string }) {
  return (
    <div className="bmx-cork">
      <p className="bmx-kicker">{t('木栓切片·示意')}</p>
      {shot === 'cork-field' ? (
        <Field sample="cork" />
      ) : (
        <svg
          className="bmx-cork-detail"
          viewBox="0 0 300 200"
          role="img"
          aria-label={t('隔壁与空腔')}
        >
          <rect x="12" y="15" width="276" height="170" rx="22" fill="#efe4ca" />
          {[
            [-56, -37],
            [30, -37],
            [116, -37],
            [-40, 19],
            [46, 19],
            [132, 19],
            [-56, 75],
            [30, 75],
            [116, 75],
          ].map(([x, y], i) => (
            <rect
              key={i}
              x={x + 50}
              y={y + 35}
              width="82"
              height="52"
              rx="5"
              fill="#e4d3b0"
              stroke="#aa9065"
              strokeWidth="5"
            />
          ))}
          <rect
            x="80"
            y="54"
            width="82"
            height="52"
            rx="5"
            fill="#f5ecd6"
            stroke="#99713e"
            strokeWidth="5"
          />
          <path d="M80 80H47V147M122 80H211V147" stroke="#856a45" strokeWidth="1.5" fill="none" />
          <circle cx="80" cy="80" r="4" fill="#99713e" />
          <circle cx="122" cy="80" r="4" fill="#bba87d" />
        </svg>
      )}
      {shot !== 'cork-field' && (
        <div className="bmx-pair-labels">
          <span>{t('细胞壁')}</span>
          <span>{t('空腔')}</span>
        </div>
      )}
      {shot === 'cork-limit' && (
        <p className="bmx-local-note">
          {t('待比较的材料')} · {t('植物与动物')}
        </p>
      )}
    </div>
  );
}
function Division({ progress, former = false }: { progress: number; former?: boolean }) {
  const s = cellPlate(progress);
  return (
    <div className="bmx-division">
      <p className="bmx-kicker">{t(former ? '旧解释：像结晶一样形成' : '细胞分裂关系示意')}</p>
      <svg
        viewBox="0 0 300 200"
        role="img"
        aria-label={t(former ? '旧解释不是观察结果' : '同一个亲细胞边界')}
      >
        <g transform="translate(150 100)">
          <rect
            x={s.parent.x}
            y={s.parent.y}
            width={s.parent.width}
            height={s.parent.height}
            rx={s.parent.radius}
            fill={former ? '#efe4d0' : '#dfe6bf'}
            stroke={former ? '#ae9979' : '#7d9866'}
            strokeWidth="4"
            strokeDasharray={former ? '7 6' : undefined}
          />
          {former ? (
            <g opacity=".7">
              <path
                d="M-20 20l8 -28 24 -9 20 21 -7 28 -27 6Z"
                fill="#e5d2ae"
                stroke="#a2875d"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <circle cx="4" cy="6" r="7" fill="#b9a0ad" />
            </g>
          ) : (
            <>
              {s.nuclei.map((n) => (
                <g key={n.id} data-nucleus-id={n.id}>
                  <circle cx={n.x} cy={n.y} r={n.radius} fill="#a094b1" />
                  <circle cx={n.x - 2} cy={n.y + 1} r="3" fill="#756783" />
                </g>
              ))}
              {progress > 0 && (
                <path
                  data-cell-plate="true"
                  d={`M0 ${s.plate.y1}V${s.plate.y2}`}
                  stroke="#bd914d"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
              {s.plate.connected && (
                <g fill="#bd914d">
                  <circle cx="0" cy="-50" r="4" />
                  <circle cx="0" cy="50" r="4" />
                </g>
              )}
            </>
          )}
          {!former && (
            <path d="M-90 -65V-72H90V-65" fill="none" stroke="#7d9866" strokeWidth="1.5" />
          )}
        </g>
      </svg>
      <div className="bmx-lineage">
        {former ? (
          <span>{t('旧解释不是观察结果')}</span>
        ) : (
          <>
            <span>A</span>
            <span aria-hidden="true">→</span>
            <span>{s.plate.connected ? 'A1 + A2' : t('同一亲细胞')}</span>
          </>
        )}
      </div>
      {!former && <p className="bmx-local-note">{t('核分裂阶段略去')}</p>}
    </div>
  );
}
function NestedFields() {
  const scale = 0.13;
  return (
    <div className="bmx-nested">
      <p className="bmx-kicker">{t('同一标本的视野范围')}</p>
      <svg viewBox="0 0 300 255" role="img" aria-label={t('目标在高倍视野外')}>
        <g transform={`translate(150 126) scale(${scale})`}>
          <circle r="900" fill="#e5e9c8" stroke="#8ca17a" strokeWidth={2 / scale} />
          <circle r="225" fill="#b9cfaa" stroke="#547d59" strokeWidth={2 / scale} />
          <g transform="translate(480 0)">
            <Leaf />
            <ellipse rx="90" ry="45" fill="none" stroke="#a66c31" strokeWidth={2 / scale} />
          </g>
          <path
            d="M0 50H480"
            stroke="#99713e"
            strokeWidth={1.5 / scale}
            strokeDasharray={`${3 / scale} ${3 / scale}`}
            fill="none"
          />
        </g>
      </svg>
      <div className="bmx-readout">
        <span>10×: 1800 μm</span>
        <span>40×: 450 μm</span>
      </div>
      <p className="bmx-local-note">{t('目标离中心距离')} 480 μm</p>
    </div>
  );
}
function RecordedImage({ zoom }: { zoom: number }) {
  const s = fixedMicroscopyImage,
    size = 112 + 112 * zoom;
  return (
    <div className="bmx-recorded">
      <p className="bmx-kicker">{t('同一图像再放大')}</p>
      <div className="bmx-pixel-stage">
        <svg
          style={{ width: size, height: (size * s.height) / s.width }}
          viewBox={`0 0 ${s.width} ${s.height}`}
          shapeRendering="crispEdges"
          role="img"
          aria-label={t('像变大，数据没有增加')}
        >
          {s.pixels.map((v, i) => (
            <rect
              key={i}
              x={i % s.width}
              y={Math.floor(i / s.width)}
              width="1"
              height="1"
              fill={`rgb(${241 - v * 0.48} ${240 - v * 0.4} ${213 - v * 0.39})`}
            />
          ))}
        </svg>
      </div>
      <div className="bmx-readout">
        <span>24 × 18 px</span>
        <span>
          {t('显示放大')} {(size / 112).toFixed(1)}×
        </span>
      </div>
    </div>
  );
}
function CellCloseup({
  clock = 0,
  drift = { x: 0, y: 0 },
  moving = false,
  landmark = true,
  shot = 'cell-closeup',
}: {
  clock?: number;
  drift?: { x: number; y: number };
  moving?: boolean;
  landmark?: boolean;
  shot?: string;
}) {
  const s = registeredStreaming(clock, moving ? 'flow' : 'drift', drift),
    pointCount = Math.max(2, Math.ceil(clock * 5)),
    points = Array.from({ length: pointCount }, (_, i) =>
      leafChloroplast(3, (clock * i) / (pointCount - 1)),
    );
  return (
    <div className="bmx-closeup">
      <p className="bmx-kicker">
        {t(
          shot === 'drift-only'
            ? '整张装片漂移'
            : shot === 'relative-flow'
              ? '叶绿体相对壁移动'
              : shot === 'shared-drift'
                ? '共同位移抵消'
                : '叶细胞结构近景',
        )}
      </p>
      <svg viewBox="-110 -69 220 138" role="img" aria-label={t('同一颗叶绿体与细胞壁参照')}>
        <g transform={`translate(${s.drift.x} ${s.drift.y})`}>
          <Leaf seconds={moving ? clock : 0} tracked reference={landmark} />
          {shot === 'cell-closeup' && (
            <text className="bmx-vacuole-label" textAnchor="middle" x="0" y="5">
              {t('中央液泡')}
            </text>
          )}
          {moving && clock > 0 && (
            <path
              d={points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ')}
              fill="none"
              stroke="#a46b36"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity=".7"
            />
          )}
          {moving && (
            <ellipse
              cx={s.initial.x - s.drift.x}
              cy={s.initial.y - s.drift.y}
              rx="8"
              ry="6.5"
              fill="none"
              stroke="#a46b36"
              strokeWidth="1"
              opacity=".35"
            />
          )}
        </g>
        <path d="M-75 55H-55M-75 53V57M-55 53V57" fill="none" stroke="#385842" strokeWidth="1.3" />
      </svg>
      <div className="bmx-closeup-bottom">
        <span>
          <i className="bmx-scale-symbol" />
          20 μm
        </span>
        {moving || shot === 'drift-only' ? (
          <span>
            {t('相对变化')} {s.distance.toFixed(1)} μm
          </span>
        ) : (
          <span>{t('显微结构示意')}</span>
        )}
      </div>
      <div className="bmx-markers">
        <span>
          <i className="bmx-marker-wall" />
          {t('壁参照')}
        </span>
        <span>
          <i className="bmx-marker-ring" />
          {t('同一叶绿体')}
        </span>
      </div>
    </div>
  );
}

const names = ['木栓证据', '细胞来源', '视野与目标', '放大与细节', '结构近景', '相对运动'];
export default function BioCellMicroscopy() {
  const film = useShowcase(),
    [chosen, setChosen] = useState<string | null>(null),
    [power, setPower] = useState('10'),
    [center, setCenter] = useState(-480),
    [progress, setProgress] = useState(0.5),
    [time, setTime] = useState(12),
    [condition, setCondition] = useState<MovementCondition>('flow'),
    [zoom, setZoom] = useState(1),
    [comparison, setComparison] = useState('image');
  const chapter = film.watch ? film.chapter : chosen === null ? film.chapter : Number(chosen),
    d = microscopyDirector(chapter, film.chapterTime, browserLocale()),
    objective = film.watch ? d.objective : Number(power),
    offset = film.watch ? d.center : center;
  const shot = film.watch
    ? d.shot
    : chapter === 0
      ? 'cork-detail'
      : chapter === 1
        ? 'division'
        : chapter === 2
          ? 'target-field'
          : chapter === 3
            ? comparison === 'image'
              ? 'fixed-image'
              : 'tissues'
            : chapter === 4
              ? 'cell-closeup'
              : condition === 'drift'
                ? 'drift-only'
                : condition === 'both'
                  ? 'shared-drift'
                  : 'relative-flow';
  const streamTime = film.watch ? d.clock : time,
    exploreStream = registeredStreaming(time, condition),
    drift = film.watch ? d.drift : exploreStream.drift;
  const visibility = targetVisibility(objective, offset);
  return (
    <section
      className="bmx-root"
      data-watch={film.watch || undefined}
      data-microscopy-shot={shot}
      data-chapter={chapter}
    >
      <div className="bmx-stage">
        {chapter === 0 ? (
          <Cork shot={shot} />
        ) : chapter === 1 ? (
          shot === 'tissues' ? (
            <Tissues />
          ) : (
            <Division
              progress={film.watch ? d.progress : progress}
              former={shot === 'former-idea'}
            />
          )
        ) : chapter === 2 ? (
          shot === 'nested-fields' ? (
            <NestedFields />
          ) : (
            <div className="bmx-target">
              <p className="bmx-kicker">
                {t(
                  visibility.fullyOutside
                    ? '目标在高倍视野外'
                    : Math.abs(offset) < 1
                      ? '居中后保留同一目标'
                      : '目标在低倍视野内',
                )}
              </p>
              <Field objective={objective} center={offset} target />
              <FieldReadout objective={objective} />
            </div>
          )
        ) : chapter === 3 ? (
          shot === 'fixed-image' ? (
            <RecordedImage zoom={film.watch ? d.progress : zoom} />
          ) : shot === 'tissues' ? (
            <Tissues />
          ) : (
            <div className="bmx-target">
              <p className="bmx-kicker">{t('同一细胞，尺寸不变')}</p>
              <Field objective={objective} target />
              <FieldReadout objective={objective} />
            </div>
          )
        ) : chapter === 4 && shot === 'selected-cell' ? (
          <div className="bmx-target">
            <p className="bmx-kicker">{t('选定同一个叶细胞')}</p>
            <Field target />
            <FieldReadout objective={40} />
          </div>
        ) : (
          <CellCloseup
            clock={chapter === 5 ? streamTime : 0}
            moving={chapter === 5 && shot !== 'drift-only'}
            drift={chapter === 5 ? drift : { x: 0, y: 0 }}
            shot={shot}
          />
        )}
      </div>
      {!film.watch && (
        <div className="bmx-controls">
          <Segments
            label={t('选择显微证据')}
            value={String(chapter)}
            onChange={setChosen}
            options={names.map((n, i) => ({ value: String(i), label: t(n) }))}
          />
          {chapter === 1 && (
            <Range
              label={t('细胞分裂解释进程')}
              value={progress}
              min={0}
              max={1}
              step={0.01}
              onChange={setProgress}
            />
          )}
          {chapter === 2 && (
            <>
              <Segments
                label={t('物镜倍率')}
                value={power}
                onChange={setPower}
                options={[
                  { value: '10', label: '10×' },
                  { value: '40', label: '40×' },
                ]}
              />
              <Range
                label={t('视野中心横移')}
                value={center}
                min={-600}
                max={600}
                step={10}
                unit="μm"
                onChange={setCenter}
              />
              <button className="bmx-center" onClick={() => setCenter(0)}>
                {t('将同一目标居中')}
              </button>
            </>
          )}
          {chapter === 3 && (
            <>
              <Segments
                label={t('比较内容')}
                value={comparison}
                onChange={setComparison}
                options={[
                  { value: 'image', label: t('同一图像再放大') },
                  { value: 'tissue', label: t('不同细胞') },
                ]}
              />
              {comparison === 'image' && (
                <Range
                  label={t('图像显示倍率')}
                  value={zoom}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setZoom}
                />
              )}
            </>
          )}
          {chapter === 5 && (
            <>
              <Segments
                label={t('运动条件')}
                value={condition}
                onChange={(value) => setCondition(value as MovementCondition)}
                options={[
                  { value: 'drift', label: t('只让装片漂移') },
                  { value: 'flow', label: t('只看内部运动') },
                  { value: 'both', label: t('漂移与内部运动同时发生') },
                ]}
              />
              <Range
                label={t('追踪时间')}
                value={time}
                min={0}
                max={30}
                step={0.1}
                unit="s"
                onChange={setTime}
              />
            </>
          )}
          <p className="bmx-limit">{t('示意重建，非显微照片；尺寸为代表值，流速为教学设定。')}</p>
        </div>
      )}
    </section>
  );
}
