import { useState } from 'react';
import { t } from '../../i18n';
import {
  seismicRock,
  seismicSpeeds,
  seismicParticle,
  seismicArrival,
  seismicShot,
} from '../../models/seismic-waves';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range } from '../lab/Controls';
import '../../styles/seismic-waves.css';
export default function SeismicWaves() {
  const d = useShowcase(),
    { host, width: w, compact } = useSignalWidth();
  const [distance, setDistance] = useState(120),
    [time, setTime] = useState(24),
    [liquid, setLiquid] = useState(false);
  const shot = seismicShot(d.chapter, d.chapterProgress),
    m = d.watch ? shot.material : { ...seismicRock, shear: liquid ? 0 : seismicRock.shear },
    dist = d.watch ? shot.distance : distance * 1000,
    now = d.watch ? shot.time : time,
    v = seismicSpeeds(m),
    a = seismicArrival(m, dist);
  const field = (kind: 'p' | 's', y: number) => {
    const points = Array.from({ length: 205 }, (_, i) => {
      const col = i % 41,
        row = Math.floor(i / 41),
        x = (col / 40) * dist,
        s = seismicParticle(m, kind, x, now);
      return {
        id: i,
        col,
        row,
        ox: 38 + ((w - 76) * col) / 40,
        oy: y + (row - 2) * 18,
        dx: s.x * (compact ? 5 : 10),
        dy: s.y * 14,
      };
    });
    return (
      <g>
        {[0, 1, 2, 3, 4].map((row) => (
          <path
            key={row}
            d={points
              .filter((p) => p.row === row)
              .map((p, i) => `${i ? 'L' : 'M'}${p.ox + p.dx} ${p.oy + p.dy}`)
              .join(' ')}
            stroke="#cfcec3"
            fill="none"
          />
        ))}
        {points.map((p) => (
          <g key={p.id}>
            {p.col === 20 && p.row === 2 && (
              <>
                <circle
                  cx={p.ox}
                  cy={p.oy}
                  r="13"
                  stroke="#c39a59"
                  strokeDasharray="2 3"
                  fill="none"
                />
                <path d={`M${p.ox} ${p.oy}l${p.dx} ${p.dy}`} stroke="#b18b50" />
              </>
            )}
            <circle
              cx={p.ox + p.dx}
              cy={p.oy + p.dy}
              r={p.col === 20 && p.row === 2 ? 5 : 3}
              fill={p.col === 20 && p.row === 2 ? '#bb8e4a' : kind === 'p' ? '#6d8c8a' : '#9e8377'}
            />
          </g>
        ))}
      </g>
    );
  };
  const trace = (kind: 'p' | 's', y: number) =>
    Array.from({ length: 401 }, (_, i) => {
      const sec = (i / 400) * 65,
        s = sec <= now ? seismicParticle(m, kind, dist, sec).signal : 0;
      return `${i ? 'L' : 'M'}${38 + ((w - 76) * i) / 400} ${y - s * 17}`;
    }).join(' ');
  return (
    <div ref={host} className="seismic-scene">
      <div className="seismic-head">
        <span>{t(m.shear ? '均匀岩石 · 位移放大' : '理想液体 · 无剪切刚度')}</span>
        <b>{(dist / 1000).toFixed(0)} km</b>
      </div>
      <svg viewBox={`0 0 ${w} 485`} role="img" aria-label={t('同一岩石点阵中的纵波横波与到达记录')}>
        <text x="28" y="42">
          P · {t('压缩与疏松')}
        </text>
        <text x={w - 28} y="71" textAnchor="end">
          {(v.p / 1000).toFixed(2)} km/s →
        </text>
        {field('p', 127)}
        <text x="28" y="218">
          S · {t('横向剪切')}
        </text>
        <text x={w - 28} y="247" textAnchor="end">
          {v.s ? (v.s / 1000).toFixed(2) + ' km/s →' : t('无法传播')}
        </text>
        {field('s', 300)}
        <text x="28" y="383">
          {t('台站记录 · 同一发震时刻')}
        </text>
        <path d={`M38 414H${w - 38}M38 455H${w - 38}`} stroke="#c8c8bd" />
        <text x="15" y="420">
          P
        </text>
        <text x="15" y="461">
          S
        </text>
        <path d={trace('p', 414)} className="seismic-p" />
        <path d={trace('s', 455)} className="seismic-s" />
        <path d={`M${38 + ((w - 76) * a.p) / 65} 394v31`} stroke="#638b86" strokeDasharray="3 3" />
        {a.s !== null && (
          <path
            d={`M${38 + ((w - 76) * a.s) / 65} 436v31`}
            stroke="#9d8070"
            strokeDasharray="3 3"
          />
        )}
        <path d={`M${38 + ((w - 76) * now) / 65} 395v75`} stroke="#bb985e" strokeWidth="2" />
      </svg>
      <div className="seismic-arrivals">
        <span>
          P <b>{a.p.toFixed(1)} s</b>
        </span>
        <span>
          S <b>{a.s === null ? '—' : a.s.toFixed(1) + ' s'}</b>
        </span>
        <span>
          Δt <b>{a.gap === null ? '—' : a.gap.toFixed(1) + ' s'}</b>
        </span>
      </div>
      <details className="seismic-model-note">
        <summary>{t('模型边界')}</summary>
        <p>{t('金点始终是同一物质点；记录是合成示意，不代表震级或损害。')}</p>
      </details>
      {!d.watch && (
        <div className="seismic-controls">
          <button type="button" aria-pressed={liquid} onClick={() => setLiquid(!liquid)}>
            {t(liquid ? '改为固体' : '改为理想液体')}
          </button>
          <Range
            label={t('传播距离')}
            min={20}
            max={160}
            step={1}
            value={distance}
            unit="km"
            onChange={setDistance}
          />
          <Range
            label={t('发震后的时间')}
            min={0}
            max={60}
            step={0.1}
            value={time}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
    </div>
  );
}
