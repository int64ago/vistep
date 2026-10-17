import { useId, useState } from 'react';
import { t } from '../../i18n';
import { prismRay, prismShot, prismColor } from '../../models/prism-dispersion';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/prism-dispersion.css';
export default function PrismDispersion() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [wavelength, setWavelength] = useState(550),
    [rotation, setRotation] = useState(-20),
    [white, setWhite] = useState(true),
    [dispersive, setDispersive] = useState(true);
  const shot = film.watch
    ? prismShot(film.chapter, film.chapterProgress)
    : { wavelength, rotation, white, dispersive };
  const selected = prismRay(shot.wavelength, shot.rotation, shot.dispersive),
    rays = (
      shot.white && shot.dispersive
        ? [...new Set([430, 470, 510, 550, 590, 630, 680, shot.wavelength])]
        : [shot.wavelength]
    ).map((w) => prismRay(w, shot.rotation, shot.dispersive));
  const W = phone ? 340 : 760,
    H = phone ? 260 : 360,
    scale = Math.min((W - 36) / 6.2, (H - 25) / 4.3),
    xy = (p: { x: number; y: number }) => `${W * 0.46 + p.x * scale},${H * 0.3 - p.y * scale}`,
    beamColor = (w: number) => (shot.white && !shot.dispersive ? '#f1ebd6' : prismColor(w));
  return (
    <section className="prism-study">
      <header>
        <span>{t('玻璃选择方向，不创造颜色')}</span>
        <b>N-BK7</b>
      </header>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('同一三棱镜中不同波长的两次折射')}>
        <defs>
          <linearGradient id={`${id}glass`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#b9d1cd" stopOpacity=".6" />
            <stop offset="1" stopColor="#6d8b8f" stopOpacity=".15" />
          </linearGradient>
        </defs>
        <polygon
          points={selected.vertices.map(xy).join(' ')}
          fill={`url(#${id}glass)`}
          stroke="#bdc9bd"
          strokeWidth="1.5"
        />
        {rays.map((ray) => (
          <polyline
            key={ray.wavelength}
            points={ray.points.map(xy).join(' ')}
            stroke={beamColor(ray.wavelength)}
            strokeWidth={shot.white ? 2 : 3}
            fill="none"
            opacity=".85"
          />
        ))}
        {shot.white && shot.dispersive && (
          <path
            d={`M${xy({ x: -3, y: 0 })}L${xy(selected.entry.point)}`}
            stroke="#f1ebd6"
            strokeWidth="4"
          />
        )}
      </svg>
      <div className="prism-spectrum">
        <span>{t('出射偏向角（局部放大）')}</span>
        <div>
          {rays.map((ray) => (
            <i
              key={ray.wavelength}
              style={{
                left: `${(((ray.deviation ?? 39) - 35) / 10) * 100}%`,
                background: beamColor(ray.wavelength),
              }}
            />
          ))}
          <b style={{ left: `${(((selected.deviation ?? 39) - 35) / 10) * 100}%` }} />
        </div>
        <p>
          <span>35°</span>
          <span>40°</span>
          <span>45°</span>
        </p>
      </div>
      <div className="prism-values">
        <span>λ {shot.wavelength.toFixed(0)} nm</span>
        <span>n {selected.index.toFixed(5)}</span>
        <span>δ {selected.deviation?.toFixed(2)}°</span>
      </div>
      <details>
        <summary>{t('材料与颜色条件')}</summary>
        <p>
          {t(
            '使用SCHOTT N-BK7的Sellmeier公式与两次矢量斯涅尔折射，忽略吸收和反射损失。彩色线只表示若干波长取样；角度条局部放大，不表示平面屏上的等距位置。',
          )}
        </p>
      </details>
      {!film.watch && (
        <div className="prism-controls">
          <Range
            label={t('跟踪波长')}
            value={wavelength}
            min={430}
            max={680}
            unit="nm"
            onChange={setWavelength}
          />
          <Range
            label={t('棱镜转角')}
            value={rotation}
            min={-30}
            max={-10}
            unit="°"
            onChange={setRotation}
          />
          <button type="button" aria-pressed={white} onClick={() => setWhite(!white)}>
            {t(white ? '改用单色光' : '改用白光取样')}
          </button>
          <button
            type="button"
            aria-pressed={!dispersive}
            onClick={() => setDispersive(!dispersive)}
          >
            {t(dispersive ? '假设材料没有色散' : '恢复真实材料色散')}
          </button>
        </div>
      )}
    </section>
  );
}
