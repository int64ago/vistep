import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  flywheelDefaults,
  flywheelPeriodic,
  flywheelCoast,
  flywheelStart,
  flywheelShot,
} from '../../models/flywheel';
import '../../styles/flywheel.css';
export default function Flywheel() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [inner, setInner] = useState(55),
    [time, setTime] = useState(0.5),
    [mode, setMode] = useState('periodic'),
    [amplitude, setAmplitude] = useState(18),
    free = { ...flywheelDefaults(), inner: inner / 1000, amplitude },
    shot = flywheelShot(film.chapter, film.chapterProgress),
    p = film.watch ? shot.parameters : free,
    s = film.watch
      ? shot.state
      : mode === 'coast'
        ? flywheelCoast(p, time)
        : mode === 'start'
          ? flywheelStart(p, time)
          : flywheelPeriodic(p, time),
    c = film.watch ? film.chapter : -1,
    ri = p.inner * 360,
    thick = s.thickness * 360,
    comparison = c === 3 || c === 5 || !film.watch,
    phase = ((s.angle * 180) / Math.PI) % 360,
    maxTime = s.mode === 'start' ? 1 : s.mode === 'coast' ? 1.5 : 2,
    yMax = 40,
    curve = (baseline = false) =>
      Array.from({ length: 101 }, (_, i) => {
        const q = baseline ? { ...p, inner: 0.055 } : p,
          at = (i / 100) * maxTime,
          v =
            s.mode === 'start'
              ? flywheelStart(q, at)
              : s.mode === 'coast'
                ? flywheelCoast(q, at)
                : flywheelPeriodic(q, at);
        return `${35 + (i / 100) * 280},${91 - (v.omega / yMax) * 67}`;
      }).join(' '),
    storing = s.power > 1e-7,
    releasing = s.power < -1e-7;
  return (
    <div className="flywheel-film" data-watch={film.watch}>
      <div className="flywheel-view-labels">
        <span>{t('转子正面')}</span>
        <span>{t('轴向剖面')}</span>
      </div>
      <svg
        className="flywheel-rotor"
        viewBox="0 0 340 218"
        role="img"
        aria-label={t('同一飞轮的正面与等比例轴向剖面')}
      >
        <defs>
          <linearGradient
            id={`${id}-metal`}
            x1="-90"
            y1="-90"
            x2="80"
            y2="85"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#c1ccbb" />
            <stop offset=".5" stopColor="#98af9e" />
            <stop offset="1" stopColor="#6c8a7b" />
          </linearGradient>
          <linearGradient id={`${id}-section`} x1="240" x2="280" gradientUnits="userSpaceOnUse">
            <stop stopColor="#b5c5b0" />
            <stop offset="1" stopColor="#7a9987" />
          </linearGradient>
        </defs>
        <path d="M20 109H314" stroke="#c5d0c0" strokeWidth="1" strokeDasharray="4 5" />
        <path d="M260 8V210" stroke="#c5d0c0" strokeWidth="1" strokeDasharray="4 5" />
        <g transform={`translate(111 109) rotate(${-phase})`}>
          {[0, 120, 240].map((a) => (
            <path
              key={a}
              d={`M0 0L${ri * Math.cos((a * Math.PI) / 180)} ${ri * Math.sin((a * Math.PI) / 180)}`}
              stroke="#b9c8b5"
              strokeWidth="7"
              strokeLinecap="round"
            />
          ))}
          <path
            d={`M90 0A90 90 0 1 0 -90 0A90 90 0 1 0 90 0M${ri} 0A${ri} ${ri} 0 1 1 ${-ri} 0A${ri} ${ri} 0 1 1 ${ri} 0`}
            fill={`url(#${id}-metal)`}
            fillRule="evenodd"
            stroke="#819c8a"
            strokeWidth="1.2"
          />
          <path d={`M${ri + 2} 0H87`} stroke="#cba973" strokeWidth="4" strokeLinecap="round" />
          <circle r="12" fill="#c8d0bd" stroke="#8a9d89" strokeWidth="2" />
          <circle r="5" fill="#76907d" />
        </g>
        <rect
          x={260 - thick / 2}
          y="19"
          width={thick}
          height={90 - ri}
          rx=".7"
          fill={`url(#${id}-section)`}
        />
        <rect
          x={260 - thick / 2}
          y={109 + ri}
          width={thick}
          height={90 - ri}
          rx=".7"
          fill={`url(#${id}-section)`}
        />
        <path d={`M${260 - thick / 2} 109H${260 + thick / 2}`} stroke="#b9c8b5" strokeWidth="7" />
        <path d="M249 109H271" stroke="#8a9d89" strokeWidth="10" strokeLinecap="round" />
        <text x="111" y="216" textAnchor="middle">
          20 kg
        </text>
        <text x="260" y="216" textAnchor="middle">
          {(s.thickness * 1000).toFixed(1)} mm
        </text>
      </svg>
      <div className="flywheel-torque" aria-label={t('输入与负载转矩比较')}>
        <span>{t('输入')}</span>
        <div>
          <i style={{ width: `${(s.driveTorque / 40) * 100}%` }} />
        </div>
        <b>{s.driveTorque.toFixed(1)} N·m</b>
        <span>{t('负载')}</span>
        <div>
          <i className="flywheel-load" style={{ width: `${(s.loadTorque / 40) * 100}%` }} />
        </div>
        <b>{s.loadTorque.toFixed(1)} N·m</b>
      </div>
      <div className="flywheel-reading">
        <span>
          <small>{t('角速度')}</small>
          <b>{s.omega.toFixed(1)} rad/s</b>
        </span>
        <span>
          <small>
            {c === 3
              ? t('转动惯量')
              : storing
                ? t('储能增加')
                : releasing
                  ? t('储能减少')
                  : t('转动储能')}
          </small>
          <b>{c === 3 ? `${s.inertia.toFixed(3)} kg·m²` : `${s.energy.toFixed(0)} J`}</b>
        </span>
      </div>
      {comparison && (
        <div className="flywheel-curve">
          <svg viewBox="0 0 340 116" role="img" aria-label={t('相同转矩下两种质量分布的角速度')}>
            <path d="M35 24V91H315" fill="none" stroke="#b8c6af" />
            <polyline
              points={curve(true)}
              fill="none"
              stroke="#b5ba9e"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
            <polyline points={curve()} fill="none" stroke="#668f7d" strokeWidth="2.8" />
            <circle
              cx={35 + (Math.min(maxTime, s.time) / maxTime) * 280}
              cy={91 - (s.omega / yMax) * 67}
              r="4"
              fill="#668f7d"
            />
            <text x="28" y="30" textAnchor="end">
              40
            </text>
            <text x="28" y="97" textAnchor="end">
              0
            </text>
            <text x="42" y="18">
              rad/s
            </text>
            <text x="35" y="113">
              0 s
            </text>
            <text x="315" y="113" textAnchor="end">
              {maxTime} s
            </text>
          </svg>
          <p>{t('虚线：原转子')}</p>
        </div>
      )}
      {!film.watch && (
        <div className="flywheel-controls">
          <Segments
            label={t('飞轮实验')}
            value={mode}
            onChange={(v) => {
              setMode(v);
              setTime(0);
            }}
            options={[
              { value: 'periodic', label: t('周期驱动') },
              { value: 'coast', label: t('切断驱动') },
              { value: 'start', label: t('从静止启动') },
            ]}
          />
          <Range
            label={t('内孔半径')}
            value={inner}
            min={55}
            max={210}
            unit="mm"
            onChange={setInner}
          />
          <Range
            label={t('观察时刻')}
            value={time}
            min={0}
            max={maxTime}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
          {mode === 'periodic' && (
            <Range
              label={t('转矩波动幅度')}
              value={amplitude}
              min={0}
              max={18}
              unit="N·m"
              onChange={setAmplitude}
            />
          )}
        </div>
      )}
      <details className="flywheel-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '恒定20 kg、外半径250 mm。轻轮毂与辐条惯量忽略；时间编程转矩驱动，不是发动机实测波形。周期比较保持相同平均角速度，初始能量随惯量改变。启动实验无阻力负载。',
          )}
        </p>
      </details>
    </div>
  );
}
