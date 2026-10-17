import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  eddyDefaults,
  eddyBrake,
  eddyShot,
  eddyTravel,
  eddyContours,
  eddyStreamDirection,
  eddyFieldProfile,
} from '../../models/eddy-current-brake';
import '../../styles/eddy-current-brake.css';
export default function EddyCurrentBrake() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [speed, setSpeed] = useState(30),
    [field, setField] = useState(0.2),
    [lanes, setLanes] = useState('1'),
    [shape, setShape] = useState('patch'),
    [position, setPosition] = useState(0.4),
    c = film.watch ? film.chapter : -1,
    s = film.watch
      ? eddyShot(c, film.chapterProgress)
      : eddyBrake({
          ...eddyDefaults(),
          velocity: speed / 1000,
          field,
          lanes: Number(lanes),
          fieldShape: shape as 'patch' | 'uniform',
        }),
    sheet = s.sheet,
    travel = film.watch ? eddyTravel(c, film.chapterProgress) : s.velocity * 8 * position,
    px = (x: number) => 170 + x * 1000,
    py = (y: number) => 130 - y * 1000,
    contours = useMemo(() => {
      const max = Math.max(...sheet.stream.flat().map(Math.abs));
      return max < 1e-10
        ? []
        : eddyContours(
            sheet,
            [-0.75, -0.5, -0.25, -0.1, 0.1, 0.25, 0.5, 0.75].map((v) => v * max),
          );
    }, [sheet]),
    intensity = Math.min(1, Math.abs(s.velocity * s.field) / 0.006),
    nonzero = Math.abs(s.force) > 1e-9,
    forceText = Math.abs(s.force) < 1e-9 ? '0.00' : (s.force * 1000).toFixed(2),
    reference = useMemo(() => eddyBrake({ ...eddyDefaults(), lanes: 1 }), []),
    brakeRatio = Math.abs(s.force / reference.force);
  return (
    <div className="eddy-film" data-watch={film.watch}>
      <p className="eddy-context">
        {s.fieldShape === 'uniform'
          ? t('均匀磁场：稳态没有涡流')
          : s.lanes > 1
            ? t('纵向切缝：大回路被分开')
            : t('局部磁场：电流在金属内闭合')}
      </p>
      <svg
        className="eddy-sheet"
        viewBox="0 0 340 248"
        role="img"
        aria-label={t('移动金属薄片、固定磁场区域与计算得到的闭合涡流')}
      >
        <defs>
          <linearGradient id={`${id}-metal`} x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#e3e8da" />
            <stop offset=".5" stopColor="#f0f1e7" />
            <stop offset="1" stopColor="#d8e1d0" />
          </linearGradient>
          <clipPath id={`${id}-sheet`}>
            <rect x="10" y="50" width="320" height="160" rx="5" />
          </clipPath>
          <marker
            id={`${id}-v`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="#aa9363" />
          </marker>
          <marker
            id={`${id}-f`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="#7a9b8b" />
          </marker>
        </defs>
        <rect
          x="10"
          y="50"
          width="320"
          height="160"
          rx="5"
          fill={`url(#${id}-metal)`}
          stroke="#b6c2a7"
        />
        <g clipPath={`url(#${id}-sheet)`}>
          {Array.from({ length: sheet.nx * sheet.ny }, (_, index) => {
            const i = index % sheet.nx,
              j = Math.floor(index / sheet.nx),
              x = -sheet.length / 2 + (i + 0.5) * sheet.dx,
              y = -sheet.width / 2 + (j + 0.5) * sheet.dy,
              b = s.fieldShape === 'uniform' ? 1 : eddyFieldProfile(x, y);
            return b > 0.002 ? (
              <rect
                key={index}
                x={px(x - sheet.dx / 2)}
                y={py(y + sheet.dy / 2)}
                width={sheet.dx * 1000 + 0.15}
                height={sheet.dy * 1000 + 0.15}
                fill="#c1b27d"
                opacity={((b * Math.abs(s.field)) / 0.3) * 0.3}
              />
            ) : null;
          })}
          {Array.from({ length: 18 }, (_, j) => {
            const x = 10 + (((j % 6) * 58 + travel * 1000 + 3200) % 320),
              y = 72 + Math.floor(j / 6) * 58;
            return (
              <path key={j} d={`M${x} ${y}h9`} stroke="#aeba9f" strokeWidth="1" opacity=".35" />
            );
          })}
          {[-0.12, -0.06, 0, 0.06, 0.12].flatMap((x) =>
            [-0.06, 0, 0.06].map((y) => {
              const b = s.fieldShape === 'uniform' ? 1 : eddyFieldProfile(x, y);
              return b > 0.25 && s.field !== 0 ? (
                <g key={`${x}-${y}`} opacity=".55">
                  <circle cx={px(x)} cy={py(y)} r="4" fill="none" stroke="#a89d70" />
                  {s.field > 0 ? (
                    <circle cx={px(x)} cy={py(y)} r="1.2" fill="#a89d70" />
                  ) : (
                    <path d={`M${px(x) - 2} ${py(y) - 2}l4 4m-4 0 4 -4`} stroke="#a89d70" />
                  )}
                </g>
              ) : null;
            }),
          )}
          {contours.map((path, index) => {
            const d = path.map(([x, y], i) => `${i ? 'L' : 'M'}${px(x)} ${py(y)}`).join(' ') + 'Z';
            return (
              <g key={index} opacity={intensity * 0.8}>
                <path
                  d={d}
                  fill="none"
                  stroke="#799e8d"
                  strokeWidth={s.lanes > 1 ? 1.4 : 1.8}
                  strokeLinejoin="round"
                />
                {[0.24, 0.68].map((f) => {
                  const k = Math.floor((path.length - 1) * f),
                    point = path[k],
                    next = path[k + 1],
                    v = eddyStreamDirection(sheet, point[0], point[1]),
                    dx = next[0] - point[0],
                    dy = next[1] - point[1],
                    direction = (dx * v[0] + dy * v[1]) * s.currentScale >= 0 ? 1 : -1,
                    angle = (Math.atan2(-dy * direction, dx * direction) * 180) / Math.PI;
                  return (
                    <path
                      key={f}
                      d="M-4 -2.5L1 0L-4 2.5"
                      fill="none"
                      stroke="#749884"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      transform={`translate(${px(point[0])} ${py(point[1])}) rotate(${angle})`}
                    />
                  );
                })}
              </g>
            );
          })}
          {Array.from({ length: s.lanes - 1 }, (_, j) => (
            <path
              key={j}
              d={`M10 ${50 + ((j + 1) * 160) / s.lanes}H330`}
              stroke="#f7f8ef"
              strokeWidth="2.5"
            />
          ))}
        </g>
        <path
          d="M8 79l4 -4 -4 -5 4 -4M328 175l4 -4 -4 -5 4 -4"
          fill="none"
          stroke="#f9faf2"
          strokeWidth="3"
        />
        <text x="32" y="35">
          v
        </text>
        {s.velocity !== 0 && (
          <path
            d={s.velocity > 0 ? 'M62 29H126' : 'M126 29H62'}
            stroke="#aa9363"
            strokeWidth="2.2"
            markerEnd={`url(#${id}-v)`}
          />
        )}
        <text x="318" y="35" textAnchor="end">
          B {s.field >= 0 ? '⊙' : '⊗'} {Math.abs(s.field).toFixed(2)} T
        </text>
        <text x="150" y="238">
          F
        </text>
        {nonzero ? (
          <path
            d={s.force < 0 ? 'M280 231H189' : 'M189 231H280'}
            stroke="#7a9b8b"
            strokeWidth="2.4"
            markerEnd={`url(#${id}-f)`}
          />
        ) : (
          <text x="220" y="238" textAnchor="middle">
            = 0
          </text>
        )}
      </svg>
      <div className="eddy-readings">
        <span>
          v (mm/s)<b>{(s.velocity * 1000).toFixed(0)}</b>
        </span>
        <span>
          F (mN)<b>{forceText}</b>
        </span>
        <span>
          {t('发热')} (mW)<b>{(s.joule * 1000).toFixed(2)}</b>
        </span>
      </div>
      {c === 4 && (
        <p className="eddy-conclusion">
          {t('同速同场：制动力为整片的{0}%', (brakeRatio * 100).toFixed(1))}
        </p>
      )}
      {c === 5 && (
        <div className="eddy-energy">
          <span>−Fv {(s.brakingPower * 1000).toFixed(2)} mW</span>
          <span>
            = {t('焦耳热')} {(s.joule * 1000).toFixed(2)} mW
          </span>
        </div>
      )}
      {!film.watch && (
        <div className="eddy-controls">
          <Segments
            label={t('磁场分布')}
            value={shape}
            options={[
              { value: 'patch', label: t('局部磁场') },
              { value: 'uniform', label: t('均匀磁场') },
            ]}
            onChange={setShape}
          />
          <Range
            label={t('规定速度')}
            value={speed}
            min={-50}
            max={50}
            step={1}
            unit="mm/s"
            onChange={setSpeed}
          />
          <Range
            label={t('峰值磁感应强度')}
            value={field}
            min={-0.3}
            max={0.3}
            step={0.01}
            unit="T"
            onChange={setField}
          />
          <Segments
            label={t('纵向导电条数')}
            value={lanes}
            options={[
              { value: '1', label: t('整片') },
              { value: '4', label: '4' },
              { value: '8', label: '8' },
            ]}
            onChange={setLanes}
          />
          <Range
            label={t('材料标记位置')}
            value={position}
            min={0}
            max={1}
            step={0.01}
            onChange={setPosition}
          />
        </div>
      )}
      <details className="eddy-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '1 mm铝片，低速准静态模型；320×160 mm窗口，远端无穿出电流。切缝忽略宽度。忽略自感与感应磁场反馈；矢量只表示方向。速度由外部规定，画面不模拟自由减速质量。',
          )}
        </p>
      </details>
    </div>
  );
}
