import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { centerMassDefaults, centerMassState, centerMassShot } from '../../models/center-of-mass';
import '../../styles/center-of-mass.css';
export default function CenterOfMass() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [mass, setMass] = useState(60),
    [time, setTime] = useState(1.5),
    [mode, setMode] = useState('rest'),
    c = film.watch ? film.chapter : -1,
    p = {
      ...centerMassDefaults(),
      cargoMass: mass,
      initialSpeed: mode === 'drift' ? 0.35 : 0,
      externalForce: mode === 'pull' ? 36 : 0,
    },
    s = film.watch ? centerMassShot(c, film.chapterProgress) : centerMassState(p, time),
    X = (v: number) => 170 + 80 * v,
    platform = X(s.platform),
    cargo = X(s.cargo),
    cm = X(s.center),
    showDisplacements = c === 2 || c === 3 || !film.watch,
    showPlot = c === 4 || c === 5,
    curve = Array.from({ length: 81 }, (_, i) => {
      const dt = (s.time * i) / 80;
      return `${42 + (dt / 3) * 275},${85 - ((s.initialSpeed * dt + 0.5 * s.acceleration * dt * dt) / 1.2) * 65}`;
    }).join(' ');
  return (
    <div className="com-film" data-watch={film.watch}>
      <p className="com-masses">
        <span>
          {t('平台')} {s.platformMass} kg
        </span>
        <span>
          {t('配重')} {s.cargoMass} kg
        </span>
      </p>
      <svg
        className="com-platform"
        viewBox="0 0 340 240"
        role="img"
        aria-label={t('固定地面刻线、移动平台、配重与系统质心的水平投影')}
      >
        <defs>
          <linearGradient
            id={`${id}-deck`}
            x1="0"
            x2="0"
            y1="170"
            y2="194"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#bed0be" />
            <stop offset="1" stopColor="#85a48d" />
          </linearGradient>
          <marker
            id={`${id}-force`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="#b77c5d" />
          </marker>
        </defs>
        {[0, 1].map((v) => (
          <g key={v}>
            <path d={`M${X(v)} 62V231`} stroke="#d6ddce" strokeDasharray="3 6" />
            <text x={X(v) + 6} y="78">
              {v} m
            </text>
          </g>
        ))}
        <path d="M8 207H332" stroke="#b6c7ad" strokeWidth="3" />
        {showDisplacements && (
          <>
            <rect
              x="74"
              y="175"
              width="192"
              height="18"
              rx="7"
              fill="none"
              stroke="#a5b39b"
              strokeDasharray="4 4"
            />
            <path d="M106 98V167" stroke="#c2ad80" strokeDasharray="4 4" />
          </>
        )}
        <rect
          x={platform - 96}
          y="175"
          width="192"
          height="18"
          rx="7"
          fill={`url(#${id}-deck)`}
          stroke="#92aa92"
        />
        {[-1, 1].map((sign) => (
          <g key={sign}>
            <path d={`M${platform + sign * 67} 192V198`} stroke="#91a98e" strokeWidth="7" />
            <ellipse cx={platform + sign * 67} cy="200" rx="15" ry="4" fill="#a8bea1" />
            <path d={`M${platform + sign * 76} 165V175`} stroke="#a0b49c" strokeWidth="5" />
          </g>
        ))}
        <path
          d={`M${platform - 88} 165H${platform + 88}`}
          stroke="#9daf9c"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <rect x={cargo - 18} y="157" width="36" height="8" rx="3" fill="#9cae94" />
        {Array.from({ length: s.cargoMass / 30 }, (_, i) => (
          <rect
            key={i}
            x={cargo - 15}
            y={145 - i * 12}
            width="30"
            height="12"
            rx="3"
            fill="#c2ab79"
            stroke="#e4d8b6"
            strokeWidth="1.3"
          />
        ))}
        <circle cx={platform} cy="184" r="3.5" fill="#5e846a" />
        <path d={`M${cm} 88V218`} stroke="#aa8c54" strokeWidth="1.8" strokeDasharray="4 4" />
        <path d={`M${cm - 5} 224L${cm} 216L${cm + 5} 224Z`} fill="#aa8c54" />
        <text x="170" y="32" textAnchor="middle">
          {t('金线：质心投影')}
        </text>
        {s.externalForce !== 0 && (
          <path
            d={`M${platform - 18} 184h46`}
            stroke="#b77c5d"
            strokeWidth="3"
            markerEnd={`url(#${id}-force)`}
          />
        )}
      </svg>
      <div className="com-center">
        <span>
          {t('质心ΔX')} (m)<b>{s.centerDisplacement.toFixed(2)}</b>
        </span>
        <span>
          {t('质心V')} (m/s)<b>{s.centerVelocity.toFixed(2)}</b>
        </span>
      </div>
      {showDisplacements && (
        <div className="com-distance">
          <p>
            <span>{t('平台位移')}</span>
            <b>{s.platformDisplacement.toFixed(2)} m</b>
          </p>
          <p>
            <span>{t('配重位移')}</span>
            <b>
              {s.cargoDisplacement >= 0 ? '+' : ''}
              {s.cargoDisplacement.toFixed(2)} m
            </b>
          </p>
          <small>{t('位移均相对地面')}</small>
        </div>
      )}
      {showPlot && (
        <div className="com-plot">
          <svg viewBox="0 0 340 111" role="img" aria-label={t('系统质心位移随时间变化')}>
            <path d="M42 20V85H317" fill="none" stroke="#bbcab2" />
            <polyline points={curve} fill="none" stroke="#a58b58" strokeWidth="3" />
            <circle
              cx={42 + (s.time / 3) * 275}
              cy={85 - (s.centerDisplacement / 1.2) * 65}
              r="4"
              fill="#a58b58"
            />
            <text x="35" y="27" textAnchor="end">
              1.2
            </text>
            <text x="35" y="91" textAnchor="end">
              0
            </text>
            <text x="50" y="18">
              m
            </text>
            <text x="42" y="109">
              0 s
            </text>
            <text x="317" y="109" textAnchor="end">
              3 s
            </text>
          </svg>
          <p>
            {t('水平外合力')} {s.externalForce.toFixed(0)} N
          </p>
        </div>
      )}
      {!film.watch && (
        <div className="com-controls">
          <Segments
            label={t('配重质量')}
            value={String(mass)}
            options={[
              { value: '30', label: '30 kg' },
              { value: '60', label: '60 kg' },
              { value: '120', label: '120 kg' },
            ]}
            onChange={(v) => setMass(Number(v))}
          />
          <Range
            label={t('观察时刻')}
            value={time}
            min={0}
            max={3}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
          <Segments
            label={t('整体运动条件')}
            value={mode}
            options={[
              { value: 'rest', label: t('最初静止') },
              { value: 'drift', label: t('最初匀速') },
              { value: 'pull', label: t('施加外力') },
            ]}
            onChange={setMode}
          />
        </div>
      )}
      <details className="com-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '水平气垫平台，忽略阻力；内部驱动指定配重轨迹。图中质心只标水平投影。平台含导轨的总质量为120 kg；有外力时只作用在平台，并计入整个系统。',
          )}
        </p>
      </details>
    </div>
  );
}
