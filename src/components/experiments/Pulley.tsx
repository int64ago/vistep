import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { pulleyGeometry, pulleyShot, pulleyState, type PulleySegments } from '../../models/pulley';
import '../../styles/pulley.css';
export default function Pulley() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [n, setN] = useState<PulleySegments>(2),
    [lift, setLift] = useState(0.15);
  const s = film.watch
      ? pulleyShot(film.chapter, film.chapterProgress)
      : { ...pulleyState(n, 120, lift), geometry: pulleyGeometry(n, lift) },
    g = s.geometry,
    c = film.watch ? film.chapter : 5;
  return (
    <div className="pulley-film" data-watch={film.watch} data-shot={c}>
      <div className="pulley-observation">
        <svg viewBox="0 0 330 355" role="img" aria-label={t('一根连续绳索与随负载上升的滑轮组')}>
          <defs>
            <linearGradient id={`${id}-wheel`}>
              <stop stopColor="#526a70" />
              <stop offset=".5" stopColor="#b9c8c7" />
              <stop offset="1" stopColor="#6e878b" />
            </linearGradient>
          </defs>
          <rect x="19" y="20" width="292" height="18" rx="6" fill="#8b9c96" />
          {g.fixed.map((w, i) => (
            <g key={`f${i}`}>
              <path d={`M${w.x} 38V${w.y}`} stroke="#6a7c76" strokeWidth="8" />
              <circle cx={w.x} cy={w.y} r={g.radius - 3} fill={`url(#${id}-wheel)`} />
              <circle cx={w.x} cy={w.y} r="8" fill="#f3f1e6" />
              <path
                d={`M${w.x - 14} ${w.y}H${w.x + 14}M${w.x} ${w.y - 14}V${w.y + 14}`}
                stroke="#596f73"
                strokeWidth="2"
              />
            </g>
          ))}
          {g.moving.map((w, i) => (
            <g key={`m${i}`}>
              <circle cx={w.x} cy={w.y} r={g.radius - 3} fill={`url(#${id}-wheel)`} />
              <circle cx={w.x} cy={w.y} r="8" fill="#f3f1e6" />
              <path d={`M${w.x} ${w.y}V${g.lower + 39}`} stroke="#718783" strokeWidth="7" />
            </g>
          ))}
          {s.segments > 1 && (
            <>
              <circle cx={g.supportX[0]} cy="43" r="5" fill="#b5844b" />
              <path
                d={`M${g.moving[0].x} ${g.lower + 39}H${g.moving.at(-1)!.x}M${g.loadX} ${g.lower + 39}V${g.lower + 52}`}
                stroke="#718783"
                strokeWidth="7"
                strokeLinecap="round"
              />
            </>
          )}
          {s.movingWeight > 0 && (
            <g>
              <path
                d={`M${g.moving[0].x} ${g.lower + 39}L${g.moving[0].x - 16} ${g.lower + 113}H${g.loadX - 34}`}
                stroke="#a59076"
                strokeDasharray="3 4"
                fill="none"
              />
              <text x={g.loadX} y={g.lower + 120} textAnchor="middle" fill="#795a44">
                +{s.movingWeight.toFixed(0)} N
              </text>
            </g>
          )}
          <path d={g.path} stroke="#b48950" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d={g.path} stroke="#f2d8a5" strokeWidth="1" fill="none" />
          <rect
            x={g.loadX - 30}
            y={s.segments === 1 ? g.lower : g.lower + 52}
            width="60"
            height="40"
            rx="10"
            fill="#426574"
          />
          <text
            x={g.loadX}
            y={(s.segments === 1 ? g.lower : g.lower + 52) + 27}
            textAnchor="middle"
            fill="#fff"
          >
            120 N
          </text>
          <rect x={g.freeX - 13} y={g.freeY} width="26" height="12" rx="5" fill="#c78b55" />
          <path
            d={`M${g.freeX} ${g.freeY + 19}v17m-5-5 5 5 5-5`}
            stroke="#b16c3c"
            strokeWidth="2.5"
            fill="none"
          />
          {c !== 0 &&
            g.supportX.map((x, i) => (
              <g key={i}>
                <path
                  d={`M${x} 171V137m-5 6 5-6 5 6`}
                  stroke="#7f9a89"
                  strokeWidth="2.5"
                  fill="none"
                />
                <text x={x} y="123" textAnchor="middle" fill="#526f5d">
                  T
                </text>
              </g>
            ))}
          <text
            x={Math.min(280, g.freeX + 35)}
            y={Math.min(340, g.freeY + 46)}
            textAnchor="middle"
            fill="#9b663d"
          >
            {s.tension.toFixed(0)} N
          </text>
        </svg>
        <div className="pulley-story">
          <span className="pulley-kicker">{t('承重绳段')}</span>
          <div className="pulley-sum">
            {Array.from({ length: s.segments }, (_, i) => (
              <span key={i}>
                {s.tension.toFixed(0)}
                <small>N</small>
                {i < s.segments - 1 && <i>+</i>}
              </span>
            ))}
            <b>= {(120 + s.movingWeight).toFixed(0)} N</b>
          </div>
          <div className="pulley-travel">
            <div>
              <span>{t('负载上升')}</span>
              <strong>{s.lift.toFixed(2)} m</strong>
              <i style={{ width: `${(s.lift / 1.4) * 100}%` }} />
            </div>
            <div>
              <span>{t('拉出绳长')}</span>
              <strong>{s.pull.toFixed(2)} m</strong>
              <i style={{ width: `${(s.pull / 1.4) * 100}%` }} />
            </div>
          </div>
          {c >= 4 && (
            <p className="pulley-work">
              {s.tension.toFixed(0)} N × {s.pull.toFixed(2)} m = <b>{s.inputWork.toFixed(1)} J</b>
              <br />
              120 N × {s.lift.toFixed(2)} m = <b>{s.outputWork.toFixed(1)} J</b>
              {s.movingWeight > 0 && (
                <>
                  <br />
                  {t('提升动滑轮组')} = <b>{s.blockWork.toFixed(1)} J</b>
                </>
              )}
            </p>
          )}
        </div>
      </div>
      {!film.watch && (
        <div className="pulley-controls">
          <Segments
            label={t('承重绳段数')}
            value={String(n)}
            options={[
              { value: '1', label: t('一段') },
              { value: '2', label: t('两段') },
              { value: '4', label: t('四段') },
            ]}
            onChange={(v) => setN(Number(v) as PulleySegments)}
          />
          <Range
            label={t('负载提升距离')}
            value={lift}
            min={0}
            max={0.35}
            step={0.01}
            unit="m"
            onChange={setLift}
          />
        </div>
      )}
      <details className="pulley-limit">
        <summary>{t('模型条件')}</summary>
        <p>{t('理想绳无质量、不可伸长；轮组自重单独计入。')}</p>
      </details>
    </div>
  );
}
