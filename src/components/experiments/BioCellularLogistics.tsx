import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range } from '../lab/Controls';
import { useShowcase, ramp, ease } from '../lab/FilmContext';
import {
  secretoryPopulation,
  cellProjection,
  erLumen,
  golgiLumen,
  membraneSegments,
  fusionGeometry,
  transportCenter,
  groupTime,
  VESICLE_RADIUS,
  type Point3,
} from '../../models/bio-cellular-logistics';
import '../../styles/bio-cellular-logistics.css';
export default function BioCellularLogistics() {
  const f = useShowcase(),
    uid = useId().replace(/:/g, ''),
    [minutes, setMinutes] = useState(17),
    [angle, setAngle] = useState(0),
    [cut, setCut] = useState(true),
    [closeup, setCloseup] = useState(false);
  const p = ease(ramp(f.chapterProgress, 0.08, 0.85)),
    modelMode = f.watch ? f.chapter === 4 : f.variant === 'structure',
    time = f.watch
      ? f.chapter === 0
        ? 3
        : f.chapter === 1
          ? 3 + 14 * p
          : f.chapter === 2
            ? 17 + 78 * p
            : f.chapter === 3
              ? 95 + 25 * p
              : 17
      : minutes,
    rotation = f.watch ? (modelMode ? -25 + 50 * p : 0) : angle,
    opened = f.watch ? true : cut,
    state = secretoryPopulation(time),
    project = (x: number, y: number, z = 0) => {
      const q = cellProjection(x, y, z, rotation);
      return { x: 175 + q.x, y: 130 + q.y, depth: q.depth };
    };
  const nucleus = project(-62, 45),
    mito = project(15, 65, 15);
  const path = (points: Point3[]) =>
    points
      .map((v, i) => {
        const p = project(v.x, v.y, v.z);
        return `${i ? 'L' : 'M'}${p.x} ${p.y}`;
      })
      .join(' ');
  const cellOutline = membraneSegments(0)[0];
  const zoom = f.watch
    ? f.chapter === 3
      ? ease(ramp(f.chapterProgress, 0.02, 0.2)) * (1 - ease(ramp(f.chapterProgress, 0.88, 1)))
      : 0
    : closeup
      ? 1
      : 0;
  return (
    <section className="bio-logistics">
      <div className="bio-logistics-cutaway">
        {zoom > 0.5 && <span className="bio-logistics-viewlabel">{t('放大：分泌出口')}</span>}
        <svg
          viewBox={`${245 * zoom} ${50 * zoom} ${370 - 245 * zoom} ${260 - 70 * zoom}`}
          role="img"
          aria-label={t('真核细胞剖视，标记蛋白经过内质网、高尔基体与分泌囊泡')}
        >
          <defs>
            <radialGradient id={`${uid}-cell`}>
              <stop stopColor="#e8eacb" />
              <stop offset="1" stopColor="#c5d5ad" />
            </radialGradient>
          </defs>
          <path d={path(cellOutline) + 'Z'} fill={`url(#${uid}-cell)`} />
          {membraneSegments(time).map((points, i) => (
            <path
              key={`membrane-${i}`}
              d={path(points)}
              fill="none"
              stroke="#829d77"
              strokeWidth="3"
            />
          ))}
          {[0, 1, 2, 3].map((group) => {
            const g = fusionGeometry(group, time);
            return g.active ? (
              <path
                key={`fusion-${group}`}
                d={path(g.arc)}
                fill="none"
                stroke="#829d77"
                strokeWidth="3"
              />
            ) : null;
          })}
          <g opacity={opened ? 1 : 0.12}>
            <path
              d={`M${project(-25, 10).x} ${project(-25, 10).y}Q${project(-30, 20).x} ${project(-30, 20).y} ${project(-33, 29).x} ${project(-33, 29).y}`}
              stroke="#adb692"
              strokeWidth="8"
              fill="none"
            />
            <ellipse
              cx={nucleus.x}
              cy={nucleus.y}
              rx="32"
              ry="29"
              fill="#b9afbf"
              stroke="#8d839c"
              strokeWidth="3"
            />
            <ellipse
              cx={nucleus.x}
              cy={nucleus.y}
              rx="27"
              ry="24"
              fill="none"
              stroke="#d4cbd6"
              strokeWidth="2"
            />
            <ellipse cx={nucleus.x + 7} cy={nucleus.y - 5} rx="9" ry="8" fill="#94869f" />
            {[0, 1, 2, 3].map((lane) => {
              const points = Array.from({ length: 41 }, (_, i) => erLumen(lane, i / 40));
              return (
                <g key={`er-${lane}`}>
                  <path
                    d={path(points)}
                    stroke="#adb692"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d={path(points)}
                    stroke="#e7e5bd"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {Array.from({ length: 8 }, (_, i) => {
                    const v = erLumen(lane, 0.05 + i * 0.12),
                      q = project(v.x, v.y - 7, v.z);
                    return <circle key={i} cx={q.x} cy={q.y} r="2" fill="#7e8f76" />;
                  })}
                </g>
              );
            })}
            {[0, 1, 2, 3].map((lane) => {
              const points = Array.from({ length: 41 }, (_, i) => golgiLumen(lane, i / 40));
              return (
                <g key={`golgi-${lane}`}>
                  <path
                    d={path(points)}
                    stroke="#baab82"
                    strokeWidth="7"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d={path(points)}
                    stroke="#e7ddbc"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}
            <g transform={`translate(${mito.x} ${mito.y}) rotate(-20)`}>
              <ellipse rx="27" ry="14" fill="#bdab8e" stroke="#9a8c73" strokeWidth="2" />
              <path
                d="M-20 0q5-18 10 0t10 0t10 0t10 0"
                stroke="#eee2c0"
                strokeWidth="2"
                fill="none"
              />
            </g>
            {[0, 1, 2, 3].map((group) => {
              const local = groupTime(group, time);
              if (!((local >= 8 && local < 14) || (local >= 35 && local <= 108))) return null;
              const center = transportCenter(group, time),
                points = Array.from({ length: 49 }, (_, i) => ({
                  x: center.x + VESICLE_RADIUS * Math.cos((i / 48) * Math.PI * 2),
                  y: center.y + VESICLE_RADIUS * Math.sin((i / 48) * Math.PI * 2),
                  z: center.z,
                }));
              return (
                <path
                  key={`vesicle-${group}`}
                  d={path(points)}
                  fill="#e1dcbd"
                  stroke="#a4ae88"
                  strokeWidth="1.5"
                />
              );
            })}
            {state.cargo
              .toSorted((a, b) => project(a.x, a.y, a.z).depth - project(b.x, b.y, b.z).depth)
              .map((c) => {
                const q = project(c.x, c.y, c.z);
                return (
                  <g key={c.id}>
                    <path
                      d={`M${q.x - 2} ${q.y - 2}l2-1 2 2-1 3-3-1Z`}
                      fill={c.id === 0 ? '#ad6f50' : '#b99167'}
                    />
                    {c.id === 0 && (
                      <circle
                        cx={q.x}
                        cy={q.y}
                        r="10"
                        fill="none"
                        stroke="#b07f47"
                        strokeWidth="1.5"
                      />
                    )}
                  </g>
                );
              })}
          </g>
          {!opened && <path d={path(cellOutline) + 'Z'} fill="#b9cca7" opacity=".5" />}
        </svg>
      </div>
      <div className="bio-logistics-labels">
        <span>
          {t('内质网标记')} <b>{state.counts.er}</b>
        </span>
        <span>
          {t('高尔基体标记')} <b>{state.counts.golgi}</b>
        </span>
        <span>
          {t('囊泡内标记')} <b>{state.counts.vesicle}</b>
        </span>
        <span>
          {t('胞外标记')} <b>{state.counts.outside}</b>
        </span>
      </div>
      <p className="bio-logistics-time">
        {t('示踪时间')} {Math.round(time)} min · {t('保留同一批24个标记')}
      </p>
      {!f.watch && (
        <div className="bio-logistics-controls">
          <Range
            label={t('示踪时间')}
            value={minutes}
            min={0}
            max={120}
            unit="min"
            onChange={setMinutes}
          />
          <Range
            label={t('剖面观察角度')}
            value={angle}
            min={-40}
            max={40}
            unit="°"
            onChange={setAngle}
          />
          <button type="button" aria-pressed={closeup} onClick={() => setCloseup(!closeup)}>
            {t(closeup ? '返回细胞全景' : '放大分泌出口')}
          </button>
          <button type="button" aria-pressed={cut} onClick={() => setCut(!cut)}>
            {t(cut ? '打开细胞剖面' : '合上细胞表面')}
          </button>
          <p>{t('三维坐标的剖视投影；颜色、颗粒数与转运轨迹是示意。')}</p>
        </div>
      )}
    </section>
  );
}
