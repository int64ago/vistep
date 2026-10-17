import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  angularMomentumDefaults,
  angularMomentumState,
  angularMomentumShot,
} from '../../models/angular-momentum';
import '../../styles/angular-momentum.css';
export default function AngularMomentum() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [end, setEnd] = useState(250),
    [time, setTime] = useState(1.5),
    [brake, setBrake] = useState(false),
    c = film.watch ? film.chapter : -1,
    s = film.watch
      ? angularMomentumShot(c, film.chapterProgress)
      : angularMomentumState(
          {
            ...angularMomentumDefaults(),
            endRadius: end / 1000,
            externalTorque: brake ? -0.35 : 0,
          },
          time,
        ),
    energyVisible = c === 3 || c === 5 || !film.watch,
    maxEnergy = Math.max(8, s.energy, s.initialEnergy);
  return (
    <div className="angular-film" data-watch={film.watch}>
      <p className="angular-condition">
        {t('外力矩')} {s.externalTorque.toFixed(2)} N·m <span>· {t('每块1 kg')}</span>
      </p>
      <svg
        className="angular-machine"
        viewBox="0 0 340 260"
        role="img"
        aria-label={t('同一转台上沿径向同步移动的两个质量块')}
      >
        <defs>
          <linearGradient id={`${id}-mass`} x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#c0aa75" />
            <stop offset="1" stopColor="#a28753" />
          </linearGradient>
          <marker
            id={`${id}-torque`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="#af755b" />
          </marker>
        </defs>
        <circle cx="170" cy="125" r="104" fill="#edf1e6" stroke="#d8e0ce" />
        <circle
          cx="170"
          cy="125"
          r={s.startRadius * 150}
          fill="none"
          stroke="#b8c6b1"
          strokeDasharray="4 5"
        />
        <circle
          cx="170"
          cy="125"
          r={s.radius * 150}
          fill="none"
          stroke="#8ba991"
          strokeWidth="1.5"
        />
        <g transform={`translate(170 125) rotate(${(-s.angle * 180) / Math.PI})`}>
          <rect x="-116" y="-14" width="232" height="28" rx="10" fill="#d3ddcd" />
          {[-1, 1].map((sign) => (
            <g key={sign} transform={`scale(${sign} 1)`}>
              <path
                d="M27 -7H111M27 7H111"
                stroke="#98ae9e"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d={`M25 0H${s.radius * 150}`}
                stroke="#b0bba7"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <rect
                x={s.radius * 150 - 10}
                y="-16"
                width="20"
                height="32"
                rx="4"
                fill={`url(#${id}-mass)`}
                stroke="#937d53"
              />
              <path
                d={`M${s.radius * 150 - 6} -10H${s.radius * 150 + 6}`}
                stroke="#dfcca3"
                strokeWidth="2"
              />
            </g>
          ))}
          <circle r="28" fill="#8ca994" stroke="#748e7d" strokeWidth="2" />
          <path d="M0 -23V-12" stroke="#d7c28a" strokeWidth="4" strokeLinecap="round" />
        </g>
        <circle cx="170" cy="125" r="8" fill="#bdcbb5" stroke="#829780" strokeWidth="2" />
        {s.externalTorque !== 0 && (
          <path
            d="M291 90A126 126 0 0 1 291 160"
            stroke="#af755b"
            strokeWidth="3"
            fill="none"
            markerEnd={`url(#${id}-torque)`}
          />
        )}
        <text x="170" y="257" textAnchor="middle">
          r = {(s.radius * 1000).toFixed(0)} mm
        </text>
      </svg>
      <div className="angular-values">
        <span>
          ω (rad/s)<b>{s.omega.toFixed(2)}</b>
        </span>
        <span>
          L (kg·m²/s)<b>{s.momentum.toFixed(2)}</b>
        </span>
      </div>
      <p className="angular-product">
        I = {s.inertia.toFixed(3)} kg·m² <span>· Iω = L</span>
      </p>
      {energyVisible && (
        <div className="angular-energy">
          <div>
            <span>{t('总动能')}</span>
            <b>{s.energy.toFixed(2)} J</b>
            <span>{s.externalTorque === 0 ? t('内部做功') : t('外部做功')}</span>
            <b>
              {(s.externalTorque === 0 ? s.internalWork : s.externalWork) >= 0 ? '+' : ''}
              {(s.externalTorque === 0 ? s.internalWork : s.externalWork).toFixed(2)} J
            </b>
            {!film.watch && s.externalTorque !== 0 && (
              <>
                <span>{t('内部做功')}</span>
                <b>
                  {s.internalWork >= 0 ? '+' : ''}
                  {s.internalWork.toFixed(2)} J
                </b>
              </>
            )}
          </div>
          <div className="angular-energy-track">
            <i style={{ width: `${(s.energy / maxEnergy) * 100}%` }} />
            <em style={{ left: `${(s.initialEnergy / maxEnergy) * 100}%` }} />
          </div>
          <p>{t('刻线：初始动能')}</p>
        </div>
      )}
      {!film.watch && (
        <div className="angular-controls">
          <Range
            label={t('最终半径')}
            value={end}
            min={250}
            max={650}
            step={10}
            unit="mm"
            onChange={setEnd}
          />
          <Range
            label={t('观察时刻')}
            value={time}
            min={0}
            max={4}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
          <Segments
            label={t('外部转矩')}
            value={brake ? 'on' : 'off'}
            options={[
              { value: 'off', label: t('无外力矩') },
              { value: 'on', label: t('施加反向力矩') },
            ]}
            onChange={(v) => setBrake(v === 'on')}
          />
        </div>
      )}
      <details className="angular-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '两块按质点计算，转台固定惯量0.3 kg·m²；径向轨迹由内部执行器指定。总动能包括径向运动。理想轴承无摩擦；有外力矩时单独计入角冲量与做功。',
          )}
        </p>
      </details>
    </div>
  );
}
