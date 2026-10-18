import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { dynamicMassState, foldingSupport } from '../../models/dynamic-mass-lab';
import '../../styles/dynamic-mass-lab.css';
export default function DynamicMassLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [mass, setMass] = useState(62),
    [force, setForce] = useState(25),
    [time, setTime] = useState(0.8);
  const c = film.chapter,
    p = film.chapterProgress,
    m = film.watch ? (c === 3 && p > 0.54 ? 82 : 62) : mass,
    F = film.watch ? 25 : force;
  const totalTime = dynamicMassState(0, m, F).endTime;
  const physical = film.watch
    ? c === 0
      ? 0
      : c === 3
        ? Math.min(1, p < 0.54 ? p / 0.48 : (p - 0.54) / 0.4) * totalTime
        : Math.min(1, p / 0.72) * totalTime
    : time;
  const s = dynamicMassState(physical, m, F),
    d = 0.65 - s.position,
    arm = foldingSupport(d),
    wall = 60,
    bx = wall + d * 300,
    ex = wall + arm.midpoint * 300;
  const measured = s.measuredMass !== null,
    showMass = !film.watch || c === 3;
  return (
    <section className="dynamic-mass-lab">
      <header>
        <p>
          {t(
            c === 0 && film.watch
              ? '失重时，质量仍然可以通过加速度测量'
              : c === 2 && film.watch
                ? '相同光栅间距，经过的时间越来越短'
                : '施加已知恒力，记录支架的加速运动',
          )}
        </p>
        <span>{t('太空测质量 · 原理重建')}</span>
      </header>
      <div className="dynamic-mass-layout">
        <div className="dynamic-mass-cabin">
          <svg
            viewBox="0 0 360 278"
            role="img"
            aria-label={t('宇航员固定在折叠支架上，恒力绳牵引支架，固定光栅记录位移')}
          >
            <defs>
              <linearGradient id={`${id}wall`}>
                <stop stopColor="#e0e7df" />
                <stop offset="1" stopColor="#f4f4ec" />
              </linearGradient>
              <linearGradient id={`${id}suit`}>
                <stop stopColor="#e4e8df" />
                <stop offset="1" stopColor="#bccdbd" />
              </linearGradient>
            </defs>
            <path d="M16 20Q16 10 28 10H52V222H28Q16 222 16 210Z" fill={`url(#${id}wall)`} />
            {[37, 73, 109, 145, 181, 210].map((y) => (
              <path key={y} d={`M26 ${y}H42`} stroke="#c5d0c3" strokeWidth="2" />
            ))}
            <path
              d={`M${wall} 118L${ex} ${118 - arm.rise * 300}L${bx} 118L${ex} ${118 + arm.rise * 300}Z`}
              stroke="#a6b7a7"
              strokeWidth="7"
              fill="none"
              strokeLinejoin="round"
            />
            {[
              [wall, 118],
              [ex, 118 - arm.rise * 300],
              [ex, 118 + arm.rise * 300],
              [bx, 118],
            ].map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="5"
                fill="#d4dece"
                stroke="#8ea58f"
                strokeWidth="1.4"
              />
            ))}
            <circle cx="60" cy="118" r="13" fill="#bdcbb5" stroke="#8fa17d" />
            <circle cx="60" cy="118" r="7" stroke="#e5ebdf" fill="none" />
            <path d={`M60 118H${bx}`} stroke="#aa966f" strokeWidth="1.5" />
            <path d={`M${bx} 67V199`} stroke="#829a8c" strokeWidth="8" strokeLinecap="round" />
            <g transform={`translate(${bx} 0)`}>
              <path
                d="M10 98Q32 87 43 103L48 151Q34 167 12 151Z"
                fill={`url(#${id}suit)`}
                stroke="#9caf9b"
              />
              <path
                d="M19 153L33 186L64 195M40 153L55 179L80 184"
                fill="none"
                stroke="#bfd0bf"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M64 195l12 3M80 184l12 3"
                stroke="#829889"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M17 108L38 128L60 118M39 107L58 124"
                stroke="#c8d7c3"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
              />
              <path d="M10 104L42 143M42 102L12 144" stroke="#a29476" strokeWidth="4" />
              <path d="M19 94V84H34V97" fill="#dcc7ab" />
              <ellipse cx="27" cy="71" rx="16" ry="19" fill="#dbc8b1" />
              <path d="M12 69Q8 46 28 50Q46 50 43 68L39 59L19 60Z" fill="#829087" />
              <path d="M0 194V232" stroke="#8ba28f" strokeWidth="3" />
              <rect
                x="-7"
                y="226"
                width="14"
                height="13"
                rx="3"
                fill={s.signal ? '#b6c894' : '#859c83'}
                stroke="#738e77"
              />
            </g>
            <rect x="176" y="241" width="86" height="14" rx="3" fill="#e5dfca" />
            {Array.from({ length: 26 }, (_, i) => (
              <path
                key={i}
                d={`M${255 - i * 3} 243v10`}
                stroke={i % 2 ? '#e6dfcb' : '#8da189'}
                strokeWidth="2"
              />
            ))}
            <path d={`M${bx} 239V248`} stroke="#bb9560" strokeWidth="2" />
            <path d="M255 264H180m5-4-5 4 5 4" stroke="#9db08b" fill="none" />
            {c > 0 || !film.watch ? (
              <path
                d={`M${bx - 14} 118h-35m7-5-7 5 7 5`}
                stroke="#ab895c"
                strokeWidth="2"
                fill="none"
              />
            ) : null}
          </svg>
          <div className="dynamic-mass-caption">
            <span>
              {t('已知恒力')} <b>{F.toFixed(0)} N</b>
            </span>
            <span>
              {t('模型时间')} <b>{s.time.toFixed(3)} s</b>
            </span>
          </div>
        </div>
        <div className="dynamic-mass-record">
          <p>
            {t('光栅记录')} <span>{t('间距')} 2 cm</span>
          </p>
          <svg
            viewBox="0 0 330 150"
            role="img"
            aria-label={t('每过相同距离记录一个时刻，速度随时间上升')}
          >
            <path d="M24 40H311M24 118H311" stroke="#d2d9c3" />
            {s.crossings.map((q, i) => (
              <g key={i}>
                <path
                  d={`M${24 + (q.time / Math.max(1.6, totalTime)) * 284} 40v-22`}
                  stroke="#a39068"
                  strokeWidth="2"
                />
                <circle
                  cx={24 + (q.time / Math.max(1.6, totalTime)) * 284}
                  cy="40"
                  r="3"
                  fill="#a39068"
                />
              </g>
            ))}
            {s.intervals.map((q, i) => (
              <circle
                key={i}
                cx={24 + (q.time / Math.max(1.6, totalTime)) * 284}
                cy={118 - (q.velocity / 0.6) * 58}
                r="3.3"
                fill="#819c83"
              />
            ))}
            <text x="24" y="68" fontSize="21" fill="#7b8d78">
              t / s
            </text>
            <text x="24" y="100" fontSize="21" fill="#7b8d78">
              v / (m/s)
            </text>
          </svg>
          <div className="dynamic-mass-result">
            <span>{t('由记录求加速度')}</span>
            <strong>
              {measured ? s.measuredAcceleration!.toFixed(3) : '—'} <small>m/s²</small>
            </strong>
          </div>
          {showMass && (
            <div className="dynamic-mass-equation">
              <span>{t('扣除随动平台质量')}</span>
              <b>m = F/a − 6 kg</b>
              <strong>{measured ? s.measuredMass!.toFixed(1) : '—'} kg</strong>
            </div>
          )}
          {!measured && <p className="dynamic-mass-wait">{t('先记录至少三个位置时刻')}</p>}
        </div>
      </div>
      <p className="dynamic-mass-cause">
        {t(
          c === 3 && film.watch
            ? '恒力相同，质量较大时加速度较小；失重不等于没有惯性。'
            : '相同距离除以各段时间，先得到平均速度，再从速度的变化求加速度。',
        )}
      </p>
      {!film.watch && (
        <div className="dynamic-mass-controls">
          <Range
            label={t('人体质量')}
            value={mass}
            min={40}
            max={100}
            step={1}
            unit="kg"
            onChange={setMass}
          />
          <Range
            label={t('恒定拉力')}
            value={force}
            min={10}
            max={40}
            step={1}
            unit="N"
            onChange={setForce}
          />
          <Range
            label={t('模型时间')}
            value={time}
            min={0}
            max={2.4}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
      <p className="dynamic-mass-note">
        {t('支架原理示意；连杆质量忽略，平台等效质量6 kg。测量终点停帧，影片按模型秒慢放。')}
      </p>
    </section>
  );
}
