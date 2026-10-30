import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  fieldAt,
  fieldFragments,
  fieldLines,
  fieldSources,
  fragmentAngle,
  potentialContours,
  type FieldArrangement,
} from '../../models/electric-field-mapping';
import '../../styles/electric-field-mapping.css';
const x = (v: number) => 220 + v * 1050,
  y = (v: number) => 165 - v * 1050;
const modes: FieldArrangement[] = ['single', 'dipole', 'like', 'plates'];
export default function ElectricFieldMapping() {
  const film = useShowcase(),
    id = useId().replaceAll(':', '');
  const p = Math.max(0, Math.min(1, (film.chapterProgress - 0.1) / 0.65)),
    authored = {
      mode: modes[Math.min(3, film.chapter)],
      time: p * 100,
      lines: p > 0.7,
      contours: false,
      probe: { x: 0.04, y: 0.05 },
    },
    [manual, setManual] = useState<typeof authored | null>(null),
    [wasWatching, setWasWatching] = useState(film.watch);
  if (film.watch !== wasWatching) {
    setWasWatching(film.watch);
    if (!film.watch && manual === null) setManual(authored);
  }
  const state = film.watch || !manual ? authored : manual,
    change = (patch: Partial<typeof authored>) => setManual({ ...state, ...patch }),
    { mode, time, lines, contours, probe } = state,
    active = mode,
    elapsed = time * 1.2,
    showLines = lines,
    paths = useMemo(() => fieldLines(active), [active]),
    equipotentials = useMemo(() => potentialContours(active), [active]),
    field = fieldAt(active, probe.x, probe.y),
    norm = Math.hypot(field.ex, field.ey);
  const moveProbe = (nx: number, ny: number) =>
    change({
      probe: { x: Math.max(-0.165, Math.min(0.165, nx)), y: Math.max(-0.13, Math.min(0.13, ny)) },
    });
  return (
    <section
      className="fieldmap-film"
      data-watch={film.watch || undefined}
      data-chapter={film.chapter}
      data-mode={mode}
      data-time={time}
      data-lines={lines}
      data-contours={contours}
      data-probe-x={probe.x}
      data-probe-y={probe.y}
    >
      <p className="fieldmap-kicker">
        {t(
          active === 'single'
            ? '先让碎屑告诉我们方向'
            : active === 'dipole'
              ? '异号电荷之间，取向连成一束'
              : active === 'like'
                ? '同号电荷之间，取向向外弯开'
                : '平行板中部，碎屑近似平行',
        )}
      </p>
      <div className="fieldmap-tray">
        <svg
          viewBox="0 0 440 330"
          role="img"
          aria-label={t('油盘中的头发碎屑随电场取向；点按可放置虚拟探针')}
          onPointerDown={(e) => {
            if (film.watch) return;
            const r = e.currentTarget.getBoundingClientRect();
            moveProbe(
              (((e.clientX - r.left) / r.width) * 440 - 220) / 1050,
              (165 - ((e.clientY - r.top) / r.height) * 330) / 1050,
            );
          }}
        >
          <defs>
            <radialGradient id={`${id}-oil`}>
              <stop stopColor="#f7efcb" stopOpacity=".8" />
              <stop offset="1" stopColor="#dbd7ae" stopOpacity=".5" />
            </radialGradient>
            <radialGradient id={`${id}-electrode`} cx=".3" cy=".2">
              <stop stopColor="#fff6d8" />
              <stop offset="1" stopColor="#a5a58a" />
            </radialGradient>
            <marker
              id={`${id}-arrow`}
              markerWidth="5"
              markerHeight="5"
              refX="3"
              refY="2.5"
              orient="auto"
            >
              <path d="M0 0L4 2.5 0 5" fill="none" stroke="#83947e" strokeWidth=".8" />
            </marker>
          </defs>
          <rect
            x="22"
            y="13"
            width="396"
            height="304"
            rx="58"
            fill="#c5d1bb"
            fillOpacity=".26"
            stroke="#b9c7b0"
          />
          <rect
            x="30"
            y="21"
            width="380"
            height="288"
            rx="50"
            fill={`url(#${id}-oil)`}
            stroke="#c1c8a8"
          />
          <path
            d="M44 80Q44 37 85 35H349"
            fill="none"
            stroke="#fffdf0"
            strokeWidth="3"
            opacity=".8"
          />
          {contours && !film.watch && (
            <g opacity=".7" stroke="#a49fbe" strokeWidth="1.3" strokeDasharray="3 4">
              {equipotentials.map((q, i) => (
                <path key={i} d={`M${x(q.a.x)} ${y(q.a.y)}L${x(q.b.x)} ${y(q.b.y)}`} />
              ))}
            </g>
          )}
          <g opacity={showLines ? 0.5 : 0} fill="none" stroke="#83947e" strokeWidth="1.1">
            {paths.map((path, i) => {
              const mid = Math.floor((path.length - 1) / 2);
              const a = path[mid],
                b = path[Math.min(path.length - 1, mid + 1)];
              const mx = (a.x + b.x) / 2,
                my = (a.y + b.y) / 2;
              const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
              const dx = ((b.x - a.x) / length) * 0.004,
                dy = ((b.y - a.y) / length) * 0.004;
              return (
                <g key={i}>
                  <path d={path.map((v, j) => `${j ? 'L' : 'M'}${x(v.x)} ${y(v.y)}`).join(' ')} />
                  <path
                    d={`M${x(mx - dx)} ${y(my - dy)}L${x(mx + dx)} ${y(my + dy)}`}
                    markerEnd={`url(#${id}-arrow)`}
                  />
                </g>
              );
            })}
          </g>
          <g stroke="#77734e" strokeWidth="2.4" strokeLinecap="round">
            {fieldFragments.map((grain, i) => {
              const f = fieldAt(active, grain.x, grain.y);
              if (
                !f.valid ||
                fieldSources(active).some((s) => Math.hypot(grain.x - s.x, grain.y - s.y) < 0.023)
              )
                return null;
              const angle = fragmentAngle(grain.initial, f.ex, f.ey, elapsed),
                dx = 0.0042 * Math.cos(angle),
                dy = 0.0042 * Math.sin(angle);
              return (
                <path
                  key={i}
                  d={`M${x(grain.x - dx)} ${y(grain.y - dy)}L${x(grain.x + dx)} ${y(grain.y + dy)}`}
                  opacity=".66"
                />
              );
            })}
          </g>
          {active === 'plates'
            ? [-1, 1].map((sign) => (
                <g key={sign}>
                  <rect
                    x={x(sign * 0.11) - 6}
                    y="32"
                    width="12"
                    height="266"
                    rx="6"
                    fill={sign < 0 ? '#c9b28a' : '#91b0b3'}
                    stroke="#a8ad91"
                  />
                  <text x={x(sign * 0.11)} y="169" textAnchor="middle">
                    {sign < 0 ? '+' : '−'}
                  </text>
                </g>
              ))
            : fieldSources(active).map((s, i) => (
                <g key={i}>
                  <circle
                    cx={x(s.x)}
                    cy={y(s.y)}
                    r="15"
                    fill={`url(#${id}-electrode)`}
                    stroke={s.q > 0 ? '#b79765' : '#809da7'}
                    strokeWidth="2"
                  />
                  <text
                    x={x(s.x)}
                    y={y(s.y) + 5}
                    textAnchor="middle"
                    fill={s.q > 0 ? '#9e794e' : '#63858e'}
                  >
                    {s.q > 0 ? '+' : '−'}
                  </text>
                </g>
              ))}
          {!film.watch && field.valid && (
            <g data-exploration-tool="probe" transform={`translate(${x(probe.x)} ${y(probe.y)})`}>
              <circle r="7" fill="#fdfcf0" fillOpacity=".9" stroke="#6b897b" strokeWidth="1.5" />
              <path d="M-10 0H-5M5 0H10M0 -10V-5M0 5V10" stroke="#6b897b" strokeWidth="1" />
              {norm > 1e-6 && (
                <path
                  d={`M0 0L${(field.ex / norm) * 28} ${(-field.ey / norm) * 28}`}
                  stroke="#6b897b"
                  strokeWidth="2"
                  markerEnd={`url(#${id}-arrow)`}
                />
              )}
            </g>
          )}
        </svg>
      </div>
      <div className="fieldmap-key">
        <i />
        {t('碎屑显示轴向，本身没有正负箭头')}
      </div>
      {showLines && <div className="fieldmap-line-note">{t('细线为计算叠加，并非油中实物。')}</div>}
      {active === 'plates' && (
        <div className="fieldmap-line-note">{t('中央区域作匀强场近似。')}</div>
      )}
      {!film.watch && (
        <>
          <div
            className="fieldmap-probe"
            tabIndex={0}
            role="group"
            aria-label={t('虚拟探针，方向键移动')}
            onKeyDown={(e) => {
              const step = 0.005;
              if (e.key.startsWith('Arrow')) e.preventDefault();
              if (e.key === 'ArrowLeft') moveProbe(probe.x - step, probe.y);
              if (e.key === 'ArrowRight') moveProbe(probe.x + step, probe.y);
              if (e.key === 'ArrowUp') moveProbe(probe.x, probe.y + step);
              if (e.key === 'ArrowDown') moveProbe(probe.x, probe.y - step);
            }}
          >
            <span>{t('虚拟探针')}</span>
            <strong>{field.valid ? `${norm.toFixed(0)} N/C` : '—'}</strong>
            <span>V = {field.valid ? field.potential.toFixed(1) : '—'} V</span>
          </div>
          <div className="fieldmap-controls">
            <Segments
              label={t('选择电极排列')}
              value={mode}
              onChange={(v) => change({ mode: v as FieldArrangement })}
              options={[
                { value: 'single', label: t('单电荷') },
                { value: 'dipole', label: t('异号双电荷') },
                { value: 'like', label: t('同号双电荷') },
                { value: 'plates', label: t('平行板') },
              ]}
            />
            <Range
              label={t('碎屑取向过程')}
              value={time}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(time) => change({ time })}
            />
            <div className="fieldmap-toggles">
              <button type="button" aria-pressed={lines} onClick={() => change({ lines: !lines })}>
                {t('显示计算电场线')}
              </button>
              <button
                type="button"
                aria-pressed={contours}
                onClick={() => change({ contours: !contours })}
              >
                {t('显示计算等势线')}
              </button>
            </div>
            <p>{t('点按油盘移动探针；聚焦读数后，也可使用方向键。')}</p>
          </div>
        </>
      )}
      <details className="fieldmap-details">
        <summary>{t('实验图样与模型边界')}</summary>
        <p>
          {t(
            '头发碎屑极化后受力矩而转向，显示的是局部轴向；正试探电荷受力方向才定义电场方向。模型只保留黏性阻尼下的转动，忽略碎屑平移和相互作用。点电荷场由库仑定律叠加，平行板仅模拟中部均匀场。虚拟探针和等势线是计算辅助，并非教材油盘实验中的实测仪器。点电荷电势以无穷远为零，平行板以中央为零。',
          )}
        </p>
      </details>
    </section>
  );
}
