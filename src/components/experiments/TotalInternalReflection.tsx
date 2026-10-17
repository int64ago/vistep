import { useState } from 'react';
import { t } from '../../i18n';
import { totalReflection, totalReflectionShot } from '../../models/total-internal-reflection';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/total-internal-reflection.css';
export default function TotalInternalReflection() {
  const film = useShowcase(),
    phone = useCompact();
  const [angle, setAngle] = useState(52),
    [outside, setOutside] = useState(1);
  const shot = film.watch
    ? totalReflectionShot(film.chapter, film.chapterProgress)
    : { angle, n1: 1.5, n2: outside };
  const s = totalReflection(shot.angle, shot.n1, shot.n2),
    W = phone ? 340 : 760,
    H = phone ? 260 : 360,
    cx = W / 2,
    cy = phone ? 90 : 135,
    L = phone ? 130 : 210,
    i = (s.angle * Math.PI) / 180,
    r = ((s.transmittedAngle ?? 90) * Math.PI) / 180,
    field = film.watch ? film.chapter === 5 : s.regime === 'total';
  const transmittedLength = Math.min(
    L,
    (cy - 15) / Math.max(1e-6, Math.cos(r)),
    (W - cx - 15) / Math.max(1e-6, Math.sin(r)),
  );
  return (
    <section className="tir-study" data-field={field}>
      <header>
        <span>{t('界面变成一面镜子')}</span>
        <b>
          {t(s.regime === 'total' ? '全反射' : s.regime === 'critical' ? '临界' : '反射与透射')}
        </b>
      </header>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('从高折射率一侧射向界面的反射与折射')}
      >
        <rect width={W} height={cy} fill="#e5ede8" />
        <path d={`M0 ${cy}H${W}V${H}H0Z`} fill="#376e7b" />
        <path d={`M${cx} 18V${H - 10}`} stroke="#a7c4c3" strokeDasharray="4 6" />
        <path d={`M0 ${cy}H${W}`} stroke="#a7c4c3" strokeWidth="2" />
        {s.critical !== null &&
          [-1, 1].map((sign) => (
            <path
              key={sign}
              d={`M${cx} ${cy}L${cx + sign * L * Math.sin((s.critical! * Math.PI) / 180)} ${cy + L * Math.cos((s.critical! * Math.PI) / 180)}`}
              stroke="#e3cca3"
              opacity=".4"
              strokeDasharray="3 5"
            />
          ))}
        <path
          d={`M${cx - L * Math.sin(i)} ${cy + L * Math.cos(i)}L${cx} ${cy}`}
          stroke="#efbf78"
          strokeWidth="3"
          fill="none"
        />
        {s.reflectance > 1e-8 && (
          <path
            d={`M${cx} ${cy}L${cx + L * Math.sin(i)} ${cy + L * Math.cos(i)}`}
            stroke="#efbf78"
            strokeWidth={2 + 4 * s.reflectance}
            opacity={0.2 + 0.8 * s.reflectance}
          />
        )}
        {s.regime !== 'total' && (
          <path
            d={`M${cx} ${cy}L${cx + transmittedLength * Math.sin(r)} ${cy - transmittedLength * Math.cos(r)}`}
            stroke="#966a3b"
            strokeWidth={2 + 4 * s.transmittance}
            opacity={s.regime === 'critical' ? 0.5 : 0.15 + 0.85 * s.transmittance}
          />
        )}
        <circle cx={cx - L * Math.sin(i)} cy={cy + L * Math.cos(i)} r="9" fill="#efbf78" />
        <circle cx={cx} cy={cy} r="4" fill="#fff6df" />
        {field &&
          s.penetration &&
          Array.from({ length: 40 }, (_, j) => (
            <path
              key={j}
              d={`M${cx - 70} ${cy - j * 2}H${cx + 70}`}
              stroke="#c08c47"
              strokeWidth="2"
              opacity={0.6 * Math.exp((-j * 12) / s.penetration!)}
            />
          ))}
      </svg>
      <div className="tir-indices">
        <span>n₁ = {s.n1.toFixed(2)}</span>
        <span>n₂ = {s.n2.toFixed(2)}</span>
      </div>
      <div className="tir-reading" hidden={phone && film.watch && field}>
        <span>
          {t('入射角')}
          <b>{s.angle.toFixed(1)}°</b>
        </span>
        <span>
          {t('临界角')}
          <b>{s.critical?.toFixed(1) ?? '—'}°</b>
        </span>
        <span>
          {t('反射功率')}
          <b>{(100 * s.reflectance).toFixed(1)}%</b>
        </span>
      </div>
      {field && s.penetration && (
        <div className="tir-field">
          <span>{t('外侧电场的1/e衰减深度')}</span>
          <b>{s.penetration.toFixed(0)} nm</b>
          <span>{t('近场厚度已放大；没有远离界面的传播光束。')}</span>
        </div>
      )}
      <details>
        <summary>{t('功率与近场条件')}</summary>
        <p>
          {t(
            '平面无吸收界面、非偏振入射光。反射与透射为垂直界面的平均功率；外侧消逝场不代表跨界面向远处传走能量。不含吸收或受抑全反射。',
          )}
        </p>
      </details>
      {!film.watch && (
        <div className="tir-controls">
          <Range label={t('入射角')} value={angle} min={0} max={75} unit="°" onChange={setAngle} />
          <Range
            label={t('外侧折射率')}
            value={outside}
            min={1}
            max={1.6}
            step={0.01}
            onChange={setOutside}
          />
        </div>
      )}
    </section>
  );
}
