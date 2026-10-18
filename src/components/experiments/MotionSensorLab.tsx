import { useState } from 'react';
import { t, browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  sonicMeasurement,
  motionSensorShot,
  sonicPulse,
  sensorVelocity,
  type SensorMethod,
} from '../../models/motion-sensor-lab';
import '../../styles/motion-sensor-lab.css';
export default function MotionSensorLab() {
  const film = useShowcase(),
    [manualMethod, setMethod] = useState<SensorMethod | null>(null),
    [phase, setPhase] = useState(0.6),
    [velocity, setVelocity] = useState(0.3),
    c = film.chapter,
    shot = motionSensorShot(c, film.chapterTime, browserLocale()),
    method: SensorMethod = manualMethod ?? (c === 3 ? 'reflection' : 'active'),
    kind = film.watch ? shot.method : method,
    v = film.watch ? 0.3 : velocity,
    recording = film.watch && c === 2,
    global = recording ? shot.recordTime : 0.8,
    emission = recording ? Math.floor(global / 0.02) * 0.02 : 0.8,
    measure = sonicMeasurement(kind, emission, v),
    fraction = film.watch ? shot.fraction : phase,
    elapsed = recording ? global - emission : fraction * measure.flight,
    s = sonicPulse(kind, emission, elapsed, v),
    cx = 45 + s.target * 125,
    wx = 45 + s.wave * 125,
    show = s.arrived,
    records = Array.from({ length: Math.floor(global / 0.02) + 1 }, (_, i) =>
      sonicMeasurement(kind, i * 0.02, v),
    ).filter((q) => q.received <= global),
    pair = records.length > 1 ? sensorVelocity(kind, records.at(-2)!.emission, v) : null;
  return (
    <section
      className="motion-sensor-lab"
      data-sensor={kind}
      data-shot={recording ? 'samples' : 'pulse'}
      data-arrived={show}
      data-record-count={records.length}
    >
      <header>
        <p>
          {t(
            recording
              ? '连续测位置，再用位移除以时间'
              : kind === 'active'
                ? '红外线先到，超声波后到'
                : '同一个探头发射，再等待回声',
          )}
        </p>
        <span>
          {t(kind === 'active' ? '移动发射器 A · 固定接收器 B' : '固定收发器 C · 移动反射物 D')}
        </span>
      </header>
      <div className="motion-sensor-apparatus">
        <svg
          viewBox="0 55 390 210"
          role="img"
          aria-label={t(
            kind === 'active'
              ? '小车上的发射器同时发射红外与超声，固定接收器连到计算机'
              : '固定探头发出超声，波在移动小车上反射后返回同一探头',
          )}
        >
          <path d="M22 168H368M22 175H368" stroke="#c1cbb0" strokeWidth="3" />
          <path d="M48 175V195M346 175V195" stroke="#d1d8bf" strokeWidth="5" />
          <rect x="20" y="93" width="25" height="67" rx="6" fill="#bdc9ac" stroke="#92a37e" />
          <ellipse cx="45" cy="122" rx="4" ry="15" fill="#d7dfc6" stroke="#8eaa88" />
          {kind === 'active' && <circle cx="43" cy="102" r="3" fill="#b5a078" />}
          <path d="M23 151Q8 180 41 200H95" stroke="#aab59d" strokeWidth="2" fill="none" />
          <g transform={`translate(${cx} 0)`}>
            <rect x="-5" y="145" width="45" height="16" rx="5" fill="#c7d2b6" stroke="#98ae8a" />
            <circle cx="5" cy="164" r="7" fill="#9fb08f" />
            <circle cx="30" cy="164" r="7" fill="#9fb08f" />
            <path d="M5 164h5M30 164h5" stroke="#dce4ce" />
            {kind === 'active' ? (
              <>
                <rect x="0" y="91" width="24" height="54" rx="5" fill="#b8c7aa" stroke="#8ca47f" />
                <ellipse cx="0" cy="122" rx="4" ry="13" fill="#dce6ce" stroke="#8ca47f" />
                <circle cx="0" cy="102" r="3" fill="#b5a078" />
              </>
            ) : (
              <path d="M0 84V146" stroke="#a2b89d" strokeWidth="6" strokeLinecap="round" />
            )}
          </g>
          {kind === 'active' && (
            <>
              <path
                d={`M45 102H${45 + measure.distance * 125}`}
                stroke="#c7a679"
                strokeWidth="1.5"
                strokeDasharray="4 5"
                opacity={fraction > 0 || recording ? 0.75 : 0.25}
              />
              {(fraction > 0 || recording) && (
                <circle cx="44" cy="102" r="6" fill="#c7a679" opacity=".45" />
              )}
            </>
          )}
          <path
            d={`M45 122H${45 + measure.reflectionDistance * 125}`}
            stroke="#d9e2cf"
            strokeWidth="1"
          />
          {!show && (
            <g transform={`translate(${wx} 122)`}>
              {[-5, 0, 5].map((z, i) => (
                <path
                  key={i}
                  d={`M${z} -13Q${z + (kind === 'reflection' && s.time < s.flight / 2 ? 7 : -7)} 0 ${z} 13`}
                  fill="none"
                  stroke="#93b298"
                  strokeWidth={i === 1 ? 2 : 1}
                  opacity={i === 1 ? 1 : 0.5}
                />
              ))}
            </g>
          )}
          <path
            d={`M45 72V65H${45 + measure.reflectionDistance * 125}V72`}
            stroke="#a3b395"
            fill="none"
          />
          <rect x="95" y="196" width="105" height="61" rx="7" fill="#d2d9c5" stroke="#9eb18f" />
          <rect x="102" y="203" width="91" height="45" rx="4" fill="#f0f2e7" />
          <path d="M109 239H185M109 239V210" stroke="#c5d0b8" />
          <path
            d={`M112 235h${Math.min(1, s.time / s.flight) * 66}`}
            stroke="#a1b38c"
            strokeWidth="3"
          />
          <path d="M88 259H207" stroke="#a7b597" strokeWidth="5" strokeLinecap="round" />
          <path
            d={`M${cx + 2} 186h${v * 70}m${v >= 0 ? -6 : 6} -4l${v >= 0 ? 6 : -6} 4 ${v >= 0 ? -6 : 6} 4`}
            fill="none"
            stroke="#a28e66"
            opacity={Math.abs(v) > 0.001 ? 1 : 0}
          />
        </svg>
        <div className="motion-sensor-key">
          <span>
            <i />
            {t('超声脉冲')}
          </span>
          {kind === 'active' && (
            <span>
              <i />
              {t('红外计时参考')}
            </span>
          )}
          <span>{t('脉冲传播显著慢放')}</span>
        </div>
      </div>
      {recording ? (
        <div className="motion-sensor-samples">
          <p>{t('计算机记录：采样间隔0.02 s')}</p>
          <svg
            viewBox="0 0 390 150"
            role="img"
            aria-label={t('每次测距转成位置点，连续两点求得平均速度')}
          >
            <path d="M36 15V116H358" stroke="#c9d5bb" fill="none" />
            {records.map((q, i) => (
              <circle
                key={i}
                cx={36 + (q.positionTime / 1.5) * 322}
                cy={111 - (q.measured - 1.1) * 110}
                r="2.4"
                fill="#8fa581"
              />
            ))}
            <text x="36" y="22" fontSize="21" fill="#839574">
              x / m
            </text>
            <text x="358" y="145" textAnchor="end" fontSize="21" fill="#839574">
              t / s
            </text>
          </svg>
          <p className="motion-sensor-pair">
            Δx = {pair ? (pair.b.measured - pair.a.measured).toFixed(3) : '—'} m · Δt ={' '}
            {pair ? (pair.b.positionTime - pair.a.positionTime).toFixed(3) : '—'} s
          </p>
          <p className="motion-sensor-value">
            v = Δx/Δt = <b>{pair ? pair.velocity.toFixed(3) : '—'} m/s</b>
          </p>
        </div>
      ) : (
        <div className="motion-sensor-timing">
          <div>
            <span>{t(kind === 'active' ? '红外到达后计时' : '从发射开始计时')}</span>
            <strong>
              {(Math.max(0, s.time - (kind === 'active' ? s.light : 0)) * 1000).toFixed(3)}{' '}
              <small>ms</small>
            </strong>
          </div>
          <div>
            <span>{t(show ? '本次距离' : '等待超声到达')}</span>
            <strong>
              {show ? measure.textbookApproximation.toFixed(3) : '—'} <small>m</small>
            </strong>
          </div>
          <p>{kind === 'active' ? 'x ≈ c Δt' : 'x = c Δt / 2'}</p>
        </div>
      )}
      <p className="motion-sensor-cause">
        {t(
          recording
            ? '两次位置的差除以采样时间，得到该小段平均速度。'
            : kind === 'active'
              ? '超声只走单程；红外传播时间相对很小。'
              : '超声走了一个来回；距离计算必须除以二。',
        )}
      </p>
      {!film.watch && (
        <div className="motion-sensor-controls">
          <Segments
            label={t('传感器类型')}
            value={method}
            onChange={setMethod}
            options={[
              { value: 'active', label: t('发射器与接收器') },
              { value: 'reflection', label: t('反射式') },
            ]}
          />
          <Range
            label={t('小车速度')}
            value={velocity}
            min={-0.4}
            max={0.4}
            step={0.05}
            unit="m/s"
            onChange={setVelocity}
          />
          <Range
            label={t('一次脉冲的进度')}
            value={phase}
            min={0}
            max={1}
            step={0.01}
            onChange={setPhase}
          />
        </div>
      )}
      <p className="motion-sensor-note">
        {t(
          '声速示例343 m/s；小车在波传播期间继续运动。反射式距离对应反射时刻，空气温度与多次回声误差未模拟。',
        )}
      </p>
    </section>
  );
}
