import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  camDefaults,
  camConstraint,
  camTrajectory,
  camSample,
  camShot,
} from '../../models/cam-follower';
import '../../styles/cam-follower.css';
export default function CamFollower() {
  const film = useShowcase(),
    [manual, setManual] = useState(camDefaults()),
    [angle, setAngle] = useState(0),
    shot = film.watch
      ? camShot(film.chapter, film.chapterProgress)
      : { parameters: manual, angle, time: angle / ((manual.rpm * Math.PI) / 30) },
    p = shot.parameters,
    q = camConstraint(p, shot.angle),
    c = film.watch ? film.chapter : 5;
  const trajectory = useMemo(
    () => (c >= 4 ? camTrajectory(p) : null),
    [p.radius, p.roller, p.eccentricity, p.rpm, p.mass, p.spring, p.preload, c >= 4],
  );
  const actual = trajectory
    ? camSample(trajectory, shot.time)
    : {
        height: q.height,
        velocity: q.velocity,
        contact: true,
        normal: Math.max(0, q.requiredNormal),
        gap: 0,
      };
  const x = 170,
    y = 238,
    k = 1900,
    rollerY = y - actual.height * k,
    camX = x + q.cam.x * k,
    camY = y - q.cam.y * k,
    collar = y - (actual.height + 0.025) * k,
    ceiling = y - 0.09 * k;
  const spring = Array.from(
    { length: 19 },
    (_, i) =>
      `${x + (i === 0 || i === 18 ? 0 : i % 2 ? 14 : -14)},${ceiling + ((collar - ceiling) * i) / 18}`,
  ).join(' ');
  return (
    <div className="cam-film">
      <div className="cam-stage">
        <svg
          viewBox="0 0 340 310"
          role="img"
          aria-label={t('偏心圆凸轮、滚子、导向杆与保持接触的弹簧')}
        >
          <path d="M85 302H255M110 302V66H230V302" stroke="#d6ddcf" strokeWidth="9" fill="none" />
          <path d={`M140 ${ceiling}H200`} stroke="#728b80" strokeWidth="9" />
          <path d={`M170 ${rollerY}V${rollerY - 0.067 * k}`} stroke="#9aabaa" strokeWidth="8" />
          <polyline
            points={spring}
            fill="none"
            stroke="#a58c63"
            strokeWidth="3"
            opacity={p.spring ? 1 : 0.14}
          />
          <path d={`M148 ${collar}H192`} stroke="#7f9692" strokeWidth="6" />
          <circle
            cx={camX}
            cy={camY}
            r={p.radius * k}
            fill="#bd9a63"
            stroke="#8f744c"
            strokeWidth="3"
          />
          <circle
            cx={camX + Math.cos(shot.angle) * p.radius * k * 0.55}
            cy={camY - Math.sin(shot.angle) * p.radius * k * 0.55}
            r="6"
            fill="#eadac0"
          />
          <circle cx={x} cy={y} r="10" fill="#7c9695" stroke="#f2f4e9" strokeWidth="4" />
          <circle
            cx={x}
            cy={rollerY}
            r={p.roller * k}
            fill="#b7c9c8"
            stroke="#6e898d"
            strokeWidth="3"
          />
          <circle cx={x} cy={rollerY} r="5" fill="#edf1e7" />
          {actual.contact ? (
            <circle cx={x + q.contact.x * k} cy={y - q.contact.y * k} r="4" fill="#566d61" />
          ) : (
            <path
              d={`M${x + 26} ${y - q.height * k}h9V${rollerY}h-9`}
              stroke="#b65d45"
              strokeWidth="3"
              fill="none"
            />
          )}
          <path
            d={`M${x - 68} ${y - q.min * k}H${x - 56}M${x - 62} ${y - q.min * k}V${y - q.max * k}M${x - 68} ${y - q.max * k}H${x - 56}`}
            stroke="#8b789f"
            strokeWidth="2"
          />
          <text x="32" y="35">
            {t('偏心距')} {(p.eccentricity * 1000).toFixed(1)} mm
          </text>
          <text x="308" y="35" textAnchor="end">
            {p.rpm.toFixed(0)} rpm
          </text>
          <text x="32" y="115" fill="#8b789f">
            {t('升降行程')}
          </text>
          <text x="32" y="140" fill="#8b789f">
            {(q.stroke * 1000).toFixed(1)} mm
          </text>
          <text x="235" y="115">
            k = {p.spring.toFixed(0)}
          </text>
          <text x="235" y="140">
            N/m
          </text>
        </svg>
        <div className="cam-instrument">
          <span>
            {c >= 4 ? t('实际接触力') : t('滚子升降速度')}
            <b>
              {c >= 4
                ? `${actual.normal.toFixed(2)} N`
                : `${(actual.velocity * 1000).toFixed(1)} mm/s`}
            </b>
          </span>
          <span>
            {actual.contact ? t('保持接触') : t('已分离')}
            <b>
              {t('间隙')} {(actual.gap * 1000).toFixed(2)} mm
            </b>
          </span>
        </div>
      </div>
      {c === 3 && (
        <div className="cam-velocity">
          <svg viewBox="0 0 340 110" role="img" aria-label={t('匀速转动对应非匀速升降')}>
            <path d="M20 47H320" stroke="#c5ccbd" />
            <text x="20" y="19">
              mm/s
            </text>
            <text x="14" y="54" textAnchor="end">
              0
            </text>
            <text x="20" y="102">
              0°
            </text>
            <text x="320" y="102" textAnchor="end">
              360°
            </text>
            <polyline
              points={Array.from(
                { length: 121 },
                (_, i) =>
                  `${20 + i * 2.5},${47 - camConstraint(p, (i / 120) * Math.PI * 2).velocity * 250}`,
              ).join(' ')}
              fill="none"
              stroke="#8b789f"
              strokeWidth="3"
            />
            <circle
              cx={20 + (shot.angle / (Math.PI * 2)) * 300}
              cy={47 - q.velocity * 250}
              r="5"
              fill="#8b789f"
            />
          </svg>
        </div>
      )}
      {!film.watch && (
        <div className="cam-controls">
          <Range
            label={t('凸轮转角')}
            value={(angle * 180) / Math.PI}
            min={0}
            max={720}
            unit="°"
            onChange={(v) => setAngle((v * Math.PI) / 180)}
          />
          <Range
            label={t('偏心距')}
            value={p.eccentricity * 1000}
            min={0}
            max={10}
            step={0.5}
            unit="mm"
            onChange={(v) => setManual({ ...manual, eccentricity: v / 1000 })}
          />
          <Range
            label={t('凸轮转速')}
            value={p.rpm}
            min={60}
            max={600}
            step={30}
            unit="rpm"
            onChange={(rpm) => setManual({ ...manual, rpm })}
          />
          <Range
            label={t('弹簧刚度')}
            value={p.spring}
            min={0}
            max={500}
            step={20}
            unit="N/m"
            onChange={(spring) => setManual({ ...manual, spring })}
          />
        </div>
      )}
      <details className="cam-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '偏心圆凸轮、无摩擦滚子、竖直导向；质量0.2 kg，弹簧预压6 mm；分离后按重力和弹簧运动，再接触按完全非弹性处理。',
          )}
        </p>
      </details>
    </div>
  );
}
