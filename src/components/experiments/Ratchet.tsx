import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { ratchetState, ratchetShot } from '../../models/ratchet';
import '../../styles/ratchet.css';
export default function Ratchet() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [advance, setAdvance] = useState(49.5),
    [rollback, setRollback] = useState(0),
    [teeth, setTeeth] = useState(12),
    [lift, setLift] = useState(false),
    s = film.watch
      ? ratchetShot(film.chapter, film.chapterProgress)
      : ratchetState((advance * Math.PI) / 180, (rollback * Math.PI) / 180, teeth, lift ? 1 : 0),
    c = film.watch ? film.chapter : -1;
  const wheel = s.vertices.map((p) => `${p.x},${p.y}`).join(' '),
    coils = Array.from(
      { length: 13 },
      (_, i) =>
        `${s.pawlWidth / 2 + (i === 0 || i === 12 ? 0 : i % 2 ? 0.055 : -0.055)},${s.pawlBottom + s.pawlLength + ((s.springAnchor - s.pawlBottom - s.pawlLength) * i) / 12}`,
    ).join(' ');
  const machinery = (detail = false) => (
    <g>
      <polygon
        points={wheel}
        fill={`url(#${id}-wheel)`}
        stroke="#7b8f83"
        strokeWidth=".015"
        strokeLinejoin="round"
      />
      <circle r=".61" fill="#e3e8da" stroke="#a8b8a5" strokeWidth=".025" />
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M0 0L${0.67 * Math.cos(s.angle + (i * 2 * Math.PI) / 3)} ${0.67 * Math.sin(s.angle + (i * 2 * Math.PI) / 3)}`}
          stroke="#9fb2a2"
          strokeWidth=".1"
          strokeLinecap="round"
        />
      ))}
      <path
        d={`M0 0L${0.75 * Math.cos(s.angle - Math.PI / 2)} ${0.75 * Math.sin(s.angle - Math.PI / 2)}`}
        stroke="#b98a4c"
        strokeWidth=".05"
        strokeLinecap="round"
      />
      {!detail && s.rollback > 0 && (
        <path
          d={`M0 0L${1.1 * Math.cos(s.request)} ${1.1 * Math.sin(s.request)}`}
          stroke="#b98a4c"
          strokeWidth=".018"
          strokeDasharray=".04 .035"
        />
      )}
      <circle r=".17" fill="#c9d4c5" stroke="#798f80" strokeWidth=".025" />
      <circle r=".065" fill="#7c9184" />
      <path
        d="M-.16 1.13V1.82H.24V1.13"
        fill="none"
        stroke="#b6c2b3"
        strokeWidth=".12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d={`M${s.pawlWidth / 2} 1.75V1.82`} stroke="#8b968b" strokeWidth=".03" />
      <polyline
        points={coils}
        fill="none"
        stroke="#969d88"
        strokeWidth=".02"
        strokeLinejoin="round"
      />
      <path
        d={`M-.065 ${s.pawlBottom + s.pawlLength}H.14`}
        stroke="#b68b58"
        strokeWidth=".045"
        strokeLinecap="round"
      />
      <rect
        x="0"
        y={s.pawlBottom}
        width={s.pawlWidth}
        height={s.pawlLength}
        rx=".006"
        fill="#bf9863"
        stroke="#94774f"
        strokeWidth=".012"
      />
      {!s.released && s.lift === 0 && (
        <circle cx={s.contact.x} cy={s.contact.y} r=".018" fill="#724e32" />
      )}
      {s.blocked && (
        <path
          d={`M-.11 ${Math.min(1, s.pawlBottom + 0.12)}H-.015`}
          stroke="#ba755c"
          strokeWidth=".025"
          strokeLinecap="round"
        />
      )}
    </g>
  );
  return (
    <div className="ratchet-film">
      <div className="ratchet-heading">
        <span>{t('径向滑动棘爪')}</span>
        <strong>{s.released ? t('已抬起') : s.blocked ? t('反向挡住') : t('弹簧压紧')}</strong>
      </div>
      <svg
        className="ratchet-mechanism"
        viewBox="0 0 340 285"
        role="img"
        aria-label={t('非对称齿轮、径向滑动棘爪和压紧弹簧')}
      >
        <defs>
          <linearGradient
            id={`${id}-wheel`}
            x1="-1"
            x2="1"
            y1="1"
            y2="-1"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#b6c8b4" />
            <stop offset=".6" stopColor="#91ac98" />
            <stop offset="1" stopColor="#6d8c7b" />
          </linearGradient>
          <clipPath id={`${id}-close`}>
            <circle cx="270" cy="163" r="49" />
          </clipPath>
        </defs>
        <g transform="translate(127 180) scale(78 -78)">{machinery()}</g>
        {(c === 1 || c === 3) && (
          <>
            <circle cx="270" cy="163" r="51" fill="#fafbf3" stroke="#d4ddca" />
            <g clipPath={`url(#${id}-close)`}>
              <g
                transform={`translate(${270 - 0.04 * 270} ${163 + s.pawlBottom * 270}) scale(270 -270)`}
              >
                {machinery(true)}
              </g>
            </g>
            <text x="270" y="235" textAnchor="middle">
              {t('接触近看')}
            </text>
          </>
        )}
        <text x="127" y="281" textAnchor="middle">
          {s.teeth} {t('齿')} · {(360 / s.teeth).toFixed(0)}°
        </text>
      </svg>
      <div className="ratchet-travel">
        <span>
          {c === 0 || c === 1 ? t('正向转角') : t('尝试回退')}
          <b>{(((c === 0 || c === 1 ? s.advance : s.rollback) * 180) / Math.PI).toFixed(1)}°</b>
        </span>
        <span>
          {c === 0 || c === 1 ? t('每齿角度') : t('实际回退')}
          <b>{(((c === 0 || c === 1 ? s.pitch : s.actualRollback) * 180) / Math.PI).toFixed(1)}°</b>
        </span>
      </div>
      {s.rollback > 0 && <p className="ratchet-legend">{t('虚线：尝试回退的目标')}</p>}
      {!film.watch && (
        <div className="ratchet-controls">
          <Segments
            label={t('棘轮齿数')}
            value={String(teeth)}
            options={[12, 18, 24].map((n) => ({ value: String(n), label: String(n) }))}
            onChange={(v) => setTeeth(Number(v))}
          />
          <Range
            label={t('先前正向转角')}
            value={advance}
            min={0}
            max={180}
            step={0.5}
            unit="°"
            onChange={setAdvance}
          />
          <Range
            label={t('尝试回退角')}
            value={rollback}
            min={0}
            max={90}
            step={0.5}
            unit="°"
            onChange={setRollback}
          />
          <Segments
            label={t('棘爪位置')}
            value={lift ? 'up' : 'down'}
            options={[
              { value: 'down', label: t('压紧') },
              { value: 'up', label: t('抬起') },
            ]}
            onChange={(v) => setLift(v === 'up')}
          />
        </div>
      )}
      <details className="ratchet-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '径向滑动棘爪的准静态教学构型；刚体、无摩擦，弹簧即时回位；忽略冲击、弹性和强度。正向能量由外部驱动提供。',
          )}
        </p>
      </details>
    </div>
  );
}
