import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  inductorDefaults,
  inductorOn,
  inductorOff,
  inductorShot,
} from '../../models/inductor-transient';
import '../../styles/inductor-transient.css';
export default function InductorTransient() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [mode, setMode] = useState('on'),
    [inductance, setInductance] = useState(100),
    [time, setTime] = useState(5),
    [clamp, setClamp] = useState('.7'),
    c = film.watch ? film.chapter : -1,
    p = { ...inductorDefaults(), inductance: inductance / 1000, clamp: Number(clamp) },
    s = film.watch
      ? inductorShot(c, film.chapterProgress)
      : mode === 'on'
        ? inductorOn(p, time / 1000)
        : inductorOff(p, time / 1000),
    off = s.mode === 'off',
    active = s.current > 1e-6,
    mainColor = active ? '#9b855f' : '#c2c7b9',
    branchColor = off && active ? '#719d92' : '#d4d8ca',
    duration = off ? Math.max(0.012, inductorOff({ ...s, clamp: 0.7 }, 0).stopTime * 1.05) : 0.03,
    x = (tm: number) => 43 + (tm / duration) * 275,
    y = (i: number) => 84 - (i / 0.3) * 61,
    curve = (high: boolean) =>
      Array.from({ length: 121 }, (_, j) => {
        const tm = (duration * j) / 120,
          q = { ...s, ...(high ? { clamp: 30 } : {}) };
        return `${x(tm)},${y(off ? inductorOff(q, tm).current : inductorOn(q, tm).current)}`;
      }).join(' '),
    reference = Array.from({ length: 121 }, (_, j) => {
      const tm = (duration * j) / 120;
      return `${x(tm)},${y(off ? inductorOff({ ...s, clamp: 0.7 }, tm).current : inductorOn({ ...s, inductance: 0.1 }, tm).current)}`;
    }).join(' '),
    energyView = c === 5;
  return (
    <div className="inductor-film" data-watch={film.watch}>
      <p className="inductor-state">
        {off ? t('断开：从稳态0.30 A释放') : t('闭合：从零电流建立')}
      </p>
      <svg
        className="inductor-circuit"
        viewBox="0 0 340 235"
        role="img"
        aria-label={t('低侧开关电路和跨越电阻电感的续流钳位路径')}
      >
        <defs>
          <marker
            id={`${id}-arrow`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="context-stroke" />
          </marker>
        </defs>
        <path
          d="M55 65V100M55 148V215H220V202"
          stroke={off ? '#d4d8ca' : mainColor}
          strokeWidth="2.5"
          fill="none"
        />
        <circle
          cx="55"
          cy="124"
          r="24"
          fill="#f2f3e9"
          stroke={off ? '#c9d0c3' : mainColor}
          strokeWidth="2"
        />
        <text x="55" y="121" textAnchor="middle">
          +
        </text>
        <text x="55" y="141" textAnchor="middle">
          −
        </text>
        <text x="12" y="174">
          6 V
        </text>
        <path
          d="M55 65H104l6 -8 10 16 10 -16 10 16 10 -16 10 16 6 -8H220V80"
          stroke={mainColor}
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M220 80c-17 0 -17 15 0 15c-17 0 -17 15 0 15c-17 0 -17 15 0 15c-17 0 -17 15 0 15V166"
          stroke={mainColor}
          strokeWidth="3"
          fill="none"
        />
        <text x="143" y="48" textAnchor="middle">
          20 Ω
        </text>
        <text x="127" y="124" textAnchor="middle">
          {(s.inductance * 1000).toFixed(0)} mH
        </text>
        <text x="240" y="88">
          +
        </text>
        <text x="240" y="151">
          −
        </text>
        <path
          d="M220 166H300V113M300 72V25H55V65"
          fill="none"
          stroke={branchColor}
          strokeWidth="2.5"
        />
        <rect
          x="289"
          y="72"
          width="22"
          height="41"
          rx="5"
          fill={off && active ? '#e3ece0' : '#f2f3e9'}
          stroke={branchColor}
          strokeWidth="2"
        />
        <text x="279" y="48" textAnchor="middle">
          {s.clamp} V
        </text>
        <path
          d={off ? 'M220 166L200 194M220 202V215' : 'M220 166V215'}
          fill="none"
          stroke={off ? '#b2bbae' : mainColor}
          strokeWidth="2.5"
        />
        <circle cx="220" cy="166" r="3.5" fill={mainColor} />
        <circle cx="220" cy="202" r="3.5" fill="#a1b29d" />
        <circle cx="55" cy="65" r="3.5" fill={mainColor} />
        <text x="143" y="198" textAnchor="middle">
          {off ? t('断开') : t('闭合')}
        </text>
        {active && (
          <>
            <path
              d="M220 144v15"
              stroke={mainColor}
              strokeWidth="2"
              markerEnd={`url(#${id}-arrow)`}
            />
            {off ? (
              <>
                <path
                  d="M300 151v-22M195 25H175"
                  stroke={branchColor}
                  strokeWidth="2"
                  markerEnd={`url(#${id}-arrow)`}
                />
              </>
            ) : (
              <path
                d="M55 92V77M180 215H160"
                stroke={mainColor}
                strokeWidth="2"
                markerEnd={`url(#${id}-arrow)`}
              />
            )}
          </>
        )}
      </svg>
      {energyView && s.mode === 'off' ? (
        <div className="inductor-energy">
          <div
            className="inductor-energy-bar"
            role="img"
            aria-label={t('剩余磁能、电阻热和钳位热守恒')}
          >
            <i style={{ width: `${(100 * s.energy) / s.initialEnergy}%`, background: '#ac946c' }} />
            <i
              style={{
                width: `${(100 * s.resistorHeat) / s.initialEnergy}%`,
                background: '#84a69a',
              }}
            />
            <i
              style={{ width: `${(100 * s.clampHeat) / s.initialEnergy}%`, background: '#b9bda2' }}
            />
          </div>
          <div>
            <span>
              {t('磁能')} {(s.energy * 1000).toFixed(2)}
            </span>
            <span>R {(s.resistorHeat * 1000).toFixed(2)}</span>
            <span>
              {t('钳位')} {(s.clampHeat * 1000).toFixed(2)}
            </span>
          </div>
          <p>
            {t('总计')} {(s.initialEnergy * 1000).toFixed(2)} mJ
          </p>
        </div>
      ) : (
        <svg
          className="inductor-curve"
          viewBox="0 0 340 116"
          role="img"
          aria-label={t('电感电流随时间的变化')}
        >
          <path d="M43 19V84H318" fill="none" stroke="#bbc6af" />
          <text x="7" y="17">
            0.30 A
          </text>
          <text x="17" y="91">
            0
          </text>
          <text x="43" y="109">
            0
          </text>
          <text x="318" y="109" textAnchor="end">
            {(duration * 1000).toFixed(0)} ms
          </text>
          {(c === 2 || c === 4) && (
            <polyline
              points={reference}
              fill="none"
              stroke="#9bb7a8"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}
          <polyline points={curve(false)} fill="none" stroke="#aa8d60" strokeWidth="3" />
          <circle cx={x(Math.min(s.time, duration))} cy={y(s.current)} r="4" fill="#aa8d60" />
          {(c === 2 || c === 4) && (
            <text x="190" y="21" textAnchor="middle">
              {c === 2 ? '100 → 200 mH' : '0.7 → 30 V'}
            </text>
          )}
        </svg>
      )}
      <div className="inductor-readings">
        <span>
          i (A)<b>{s.current.toFixed(3)}</b>
        </span>
        <span>
          V<sub>L</sub> (V)<b>{s.coilVoltage.toFixed(2)}</b>
        </span>
        <span>
          {off ? 'Vsw (V)' : 'VR (V)'}
          <b>{(off ? s.switchVoltage : s.resistorVoltage).toFixed(2)}</b>
        </span>
      </div>
      {!film.watch && (
        <div className="inductor-controls">
          <Segments
            label={t('开关实验')}
            value={mode}
            options={[
              { value: 'on', label: t('建立电流') },
              { value: 'off', label: t('从稳态释放') },
            ]}
            onChange={setMode}
          />
          <Range
            label={t('电感')}
            value={inductance}
            min={50}
            max={200}
            step={10}
            unit="mH"
            onChange={setInductance}
          />
          <Range
            label={t('经过时间')}
            value={time}
            min={0}
            max={30}
            step={0.05}
            unit="ms"
            onChange={setTime}
          />
          {off && (
            <Segments
              label={t('钳位压降')}
              value={clamp}
              options={[
                { value: '.7', label: '0.7 V' },
                { value: '30', label: '30 V' },
              ]}
              onChange={setClamp}
            />
          )}
        </div>
      )}
      <details className="inductor-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '理想电感与20 Ω电阻串联，6 V电源。每次释放独立地从0.30 A稳态开始。钳位按固定压降近似；不含寄生电容、磁饱和或开关电弧。Vsw相对下方回线测量。',
          )}
        </p>
      </details>
    </div>
  );
}
