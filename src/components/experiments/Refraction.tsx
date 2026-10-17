import { useId, useState } from 'react';
import { t } from '../../i18n';
import { refraction, refractionShot } from '../../models/refraction';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/refraction.css';
export default function Refraction() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [angle, setAngle] = useState(45),
    [index, setIndex] = useState(1.5);
  const options = film.watch
    ? refractionShot(film.chapter, film.chapterProgress)
    : { angle, n1: 1, n2: index };
  const s = refraction(options.angle, options.n1, options.n2),
    W = phone ? 340 : 760,
    H = phone ? 260 : 400,
    cx = W / 2,
    cy = H / 2,
    L = phone ? 118 : 185,
    i = (s.angle * Math.PI) / 180,
    r = ((s.transmitted ?? 0) * Math.PI) / 180,
    phase = (film.time / 2) % 1;
  const fronts = (theta: number, n: number) =>
    Array.from({ length: 29 }, (_, j) => {
      const distance = ((j - 14 + phase) * 42) / n,
        x = cx + Math.sin(theta) * distance,
        y = cy + Math.cos(theta) * distance;
      return (
        <path
          key={j}
          d={`M${x - 240 * Math.cos(theta)} ${y + 240 * Math.sin(theta)}L${x + 240 * Math.cos(theta)} ${y - 240 * Math.sin(theta)}`}
          stroke="#42635f"
          strokeWidth="1.3"
          opacity=".8"
        />
      );
    });
  return (
    <section className="refraction-study" data-watch={film.watch}>
      <header>
        <span>{t('同一节拍，不同波长')}</span>
        <b>
          n₁ {s.n1.toFixed(2)} → n₂ {s.n2.toFixed(2)}
        </b>
      </header>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('相接的平面波前与折射光路')}>
        <defs>
          <clipPath id={`${id}upper`}>
            <rect width={W} height={cy} />
          </clipPath>
          <clipPath id={`${id}lower`}>
            <rect y={cy} width={W} height={cy} />
          </clipPath>
        </defs>
        <rect width={W} height={cy} fill="#f2efe3" />
        <rect y={cy} width={W} height={cy} fill="#a3c8c6" />
        <g clipPath={`url(#${id}upper)`}>{fronts(i, s.n1)}</g>
        {!s.total && <g clipPath={`url(#${id}lower)`}>{fronts(r, s.n2)}</g>}
        <path d={`M0 ${cy}H${W}`} stroke="#527e7c" strokeWidth="2" />
        <path d={`M${cx} 14V${H - 14}`} stroke="#587e7d" strokeDasharray="4 6" />
        <path
          d={`M${cx - Math.sin(i) * L} ${cy - Math.cos(i) * L}L${cx} ${cy}`}
          stroke="#ba804a"
          strokeWidth="4"
        />
        {!s.total && (
          <path
            d={`M${cx} ${cy}L${cx + Math.sin(r) * L} ${cy + Math.cos(r) * L}`}
            stroke="#ba804a"
            strokeWidth="4"
          />
        )}
        <circle cx={cx} cy={cy} r="5" fill="#fff8dc" />
        <path
          d={`M${cx} ${cy - 48}A48 48 0 0 0 ${cx - 48 * Math.sin(i)} ${cy - 48 * Math.cos(i)}`}
          stroke="#5a7e7c"
          strokeWidth="2"
          fill="none"
        />
        {!s.total && (
          <path
            d={`M${cx} ${cy + 48}A48 48 0 0 0 ${cx + 48 * Math.sin(r)} ${cy + 48 * Math.cos(r)}`}
            stroke="#5a7e7c"
            strokeWidth="2"
            fill="none"
          />
        )}
      </svg>
      <div className="refraction-angles">
        <span>
          {t('入射角')}
          <b>{s.angle.toFixed(1)}°</b>
        </span>
        <span>
          {t('折射角')}
          <b>{s.transmitted?.toFixed(1) ?? '—'}°</b>
        </span>
      </div>
      <div className="refraction-rhythm">
        <span>{t('真空波长')} 550 nm</span>
        <span>
          λ₁ {s.wavelength1.toFixed(0)} → λ₂ {s.wavelength2.toFixed(0)} nm
        </span>
      </div>
      <details>
        <summary>{t('模型与波前说明')}</summary>
        <p>
          {t(
            '各向同性、无吸收的单色平面波；界面静止，频率不变。波前间距按λ/n，运动仅示意相位，不按真实光速播放。未画出较弱的界面反射。',
          )}
        </p>
      </details>
      {!film.watch && (
        <div className="refraction-controls">
          <Range label={t('入射角')} value={angle} min={0} max={70} unit="°" onChange={setAngle} />
          <Range
            label={t('第二介质折射率')}
            value={index}
            min={1}
            max={2}
            step={0.01}
            onChange={setIndex}
          />
        </div>
      )}
    </section>
  );
}
