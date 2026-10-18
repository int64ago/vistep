import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  LAMINA_SHAPES,
  LAMINA_WEIGHT,
  suspensionState,
  plumbTrace,
  polygonCentroid,
  suspensionHoles,
  suspensionOffset,
} from '../../models/suspension-center-of-gravity';
import '../../styles/suspension-center-of-gravity.css';
export default function SuspensionCenterOfGravity() {
  const film = useShowcase(),
    id = useId().replaceAll(':', '');
  const [shape, setShape] = useState<'irregular' | 'triangle'>('irregular'),
    [pivot, setPivot] = useState(0),
    [mass, setMass] = useState(0);
  const c = film.watch ? film.chapter : 3,
    kind = film.watch ? (c === 3 ? 'triangle' : 'irregular') : shape,
    points = LAMINA_SHAPES[kind],
    holes = suspensionHoles(points),
    chosen = film.watch ? (c < 2 ? 0 : 2) : pivot % points.length,
    added = film.watch ? 0 : mass,
    s = suspensionState(points, chosen, added),
    offset =
      film.watch && (c === 0 || c === 2)
        ? suspensionOffset(points, chosen, film.chapterProgress * 9, added)
        : 0,
    angle = s.angle + offset,
    recorded =
      c === 0
        ? []
        : c === 1 || (film.watch && c === 2 && film.chapterProgress < 0.45)
          ? [0]
          : [0, 2],
    outline = points.map((p) => `${p.x},${p.y}`).join(' '),
    origin = { x: 160, y: 43 },
    scale = 0.96,
    project = (p: { x: number; y: number }) => {
      const dx = p.x - s.pivot.x,
        dy = p.y - s.pivot.y;
      const q = {
        x: dx * Math.cos(angle) - dy * Math.sin(angle),
        y: dx * Math.sin(angle) + dy * Math.cos(angle),
      };
      return { x: origin.x + q.x * scale, y: origin.y + q.y * scale };
    },
    center = project(s.center),
    centroid = polygonCentroid(points);
  return (
    <section className="suspension-lab">
      <header>
        <p>
          {t(
            c === 0
              ? '让薄板自由转动，直到停稳'
              : c === 1
                ? '沿悬线画出第一条铅垂线'
                : c === 2
                  ? '换一个悬点，再画一条线'
                  : '换一种形状，检查同一条平衡规则',
          )}
        </p>
        <span>{t(added > 0 ? '附加配重后，重心会改变' : '均匀薄板 · 自由悬挂')}</span>
      </header>
      <svg
        className="suspension-object"
        viewBox="0 0 320 300"
        role="img"
        aria-label={t('薄板以不同悬点转到平衡，两条记录在板上的铅垂线交于重心')}
      >
        <defs>
          <clipPath id={`${id}clip`}>
            <polygon points={outline} />
          </clipPath>
          <linearGradient id={`${id}board`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#e2d0aa" />
            <stop offset="1" stopColor="#c4ae7f" />
          </linearGradient>
        </defs>
        <path
          d="M38 280H284M60 280V22H161V43"
          stroke="#a8b79b"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        <g
          transform={`translate(${origin.x} ${origin.y}) scale(${scale}) rotate(${(angle * 180) / Math.PI}) translate(${-s.pivot.x} ${-s.pivot.y})`}
        >
          <polygon points={outline} fill={`url(#${id}board)`} stroke="#bca474" strokeWidth="1.3" />
          {holes.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#f4edd7" stroke="#a98f61" />
          ))}
          <g clipPath={`url(#${id}clip)`}>
            {recorded.map((j, i) => {
              const line = plumbTrace(holes[j], s.center);
              return (
                <path
                  key={j}
                  d={`M${line[0].x} ${line[0].y}L${line[1].x} ${line[1].y}`}
                  stroke={i ? '#5e846c' : '#b17f56'}
                  strokeWidth="1.9"
                  strokeDasharray={i ? 'none' : '4 3'}
                />
              );
            })}
            {kind === 'triangle' &&
              points.map((p, i) => {
                const q = points[(i + 1) % 3],
                  r = points[(i + 2) % 3];
                return (
                  <path
                    key={i}
                    d={`M${p.x} ${p.y}L${(q.x + r.x) / 2} ${(q.y + r.y) / 2}`}
                    stroke="#867c60"
                    strokeDasharray="3 4"
                    opacity=".7"
                  />
                );
              })}
          </g>
          {added > 0 && (
            <>
              <circle
                cx={LAMINA_WEIGHT.x}
                cy={LAMINA_WEIGHT.y}
                r={7 + added * 3}
                fill="#83977a"
                stroke="#5f7e63"
              />
              <circle cx={LAMINA_WEIGHT.x} cy={LAMINA_WEIGHT.y} r="3" fill="#becbb0" />
            </>
          )}
          {kind === 'triangle' && (
            <circle cx={centroid.x} cy={centroid.y} r="5" fill="none" stroke="#6d8664" />
          )}
        </g>
        <path d={`M160 43V270`} stroke="#647c64" strokeWidth="1.4" />
        <path d="M160 254L153 270H167Z" fill="#85987b" />
        <circle cx="160" cy="43" r="4" fill="#798e73" />
        {c >= 2 && (!film.watch || film.chapterProgress >= 0.45) && (
          <>
            <circle cx={center.x} cy={center.y} r="5" fill="#5d8068" />
            <circle cx={center.x} cy={center.y} r="11" fill="none" stroke="#668972" opacity=".5" />
          </>
        )}
      </svg>
      <div className="suspension-key">
        <span>
          <i />
          {t('第一次留下的线')}
        </span>
        <span>
          <i />
          {t('第二次留下的线')}
        </span>
      </div>
      <p className="suspension-result">
        {t(
          c < 2
            ? '一条悬线只能确定重心所在的直线。'
            : added > 0
              ? '两条悬线仍交于重心，但不再与几何中心重合。'
              : '两次悬挂的铅垂线，指向同一个板上位置。',
        )}
      </p>
      {!film.watch && (
        <div className="suspension-controls">
          <Segments
            label={t('薄板形状')}
            value={shape}
            onChange={(v) => {
              setShape(v);
              setPivot(0);
            }}
            options={[
              { value: 'irregular', label: t('不规则薄板') },
              { value: 'triangle', label: t('三角形纸板') },
            ]}
          />
          <Range
            label={t('悬挂孔位置')}
            value={pivot % points.length}
            min={0}
            max={points.length - 1}
            onChange={setPivot}
          />
          <Range
            label={t('附加质量与板质量之比')}
            value={mass}
            min={0}
            max={1.5}
            step={0.1}
            onChange={setMass}
          />
        </div>
      )}
      <p className="suspension-note">
        {t('小角度摆动采用阻尼近似；画线取停稳位置，忽略线重和悬点摩擦。')}
      </p>
    </section>
  );
}
