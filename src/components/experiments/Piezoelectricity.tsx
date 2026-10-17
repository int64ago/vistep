import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  piezoDefaults,
  piezoSensor,
  piezoActuator,
  piezoShot,
} from '../../models/piezoelectricity';
import '../../styles/piezoelectricity.css';
export default function Piezoelectricity() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [mode, setMode] = useState('sensor'),
    [force, setForce] = useState(100),
    [ramp, setRamp] = useState(0.1),
    [resistance, setResistance] = useState(1),
    [time, setTime] = useState(0.1),
    [voltage, setVoltage] = useState(20),
    c = film.watch ? film.chapter : -1,
    parameters = { ...piezoDefaults(), peakForce: force, ramp, resistance: resistance * 1e9 },
    s = film.watch
      ? piezoShot(c, film.chapterProgress)
      : mode === 'sensor'
        ? piezoSensor(parameters, time)
        : piezoActuator(parameters, voltage),
    top = 86 + s.compression * 9.75e8,
    bottom = 151,
    actuator = s.mode === 'actuator',
    plotEnd = c === 0 ? 1 : c === 4 ? 4 : 8,
    curve = useMemo(
      () =>
        Array.from({ length: 161 }, (_, i) =>
          piezoSensor(
            {
              ...piezoDefaults(),
              d: s.d,
              capacitance: s.capacitance,
              stiffness: s.stiffness,
              resistance: s.resistance,
              peakForce: s.peakForce,
              ramp: s.ramp,
              hold: s.hold,
              release: s.release,
            },
            (i / 160) * plotEnd,
          ),
        ),
      [
        s.d,
        s.capacitance,
        s.stiffness,
        s.resistance,
        s.peakForce,
        s.ramp,
        s.hold,
        s.release,
        plotEnd,
      ],
    ),
    reference = useMemo(
      () =>
        c === 3 || c === 4
          ? Array.from({ length: 161 }, (_, i) => piezoSensor(piezoDefaults(), (i / 160) * plotEnd))
          : [],
      [c, plotEnd],
    ),
    px = (x: number) => 43 + (x / plotEnd) * 278,
    py = (v: number) => 63 - (v / 30) * 43;
  return (
    <div className="piezo-film" data-watch={film.watch}>
      <p className="piezo-context">
        {actuator
          ? t('逆效应：电压驱动自由伸缩')
          : c === 0
            ? t('理想开路：电荷变化建立电压')
            : t('实际读数：电荷通过电阻慢慢流失')}
      </p>
      <svg
        className="piezo-plate"
        viewBox="0 0 340 233"
        role="img"
        aria-label={t('双电极压电陶瓷的剖面、施力压头和外部测量回路')}
      >
        <defs>
          <linearGradient id={`${id}-ceramic`} x1="0" x2="1">
            <stop stopColor="#dce4d0" />
            <stop offset=".5" stopColor="#e7e9d9" />
            <stop offset="1" stopColor="#c7d4bb" />
          </linearGradient>
          <marker
            id={`${id}-arrow`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="#9e9b71" />
          </marker>
        </defs>
        <path d="M42 151H192V164H42Z" fill="#adb99d" />
        <path d="M32 174H202" stroke="#bfcaaf" strokeWidth="2" />
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${40 + i * 19} 164l-7 10`} stroke="#bfcaaf" />
        ))}
        <rect x="52" y={top} width="132" height={bottom - top} fill={`url(#${id}-ceramic)`} />
        {Array.from({ length: 15 }, (_, i) => {
          const x = 65 + (i % 5) * 26,
            y = top + 13 + (Math.floor(i / 5) * (bottom - top - 25)) / 2;
          return (
            <path
              key={i}
              d={`M${x - 5} ${y}l3 -4 5 1 2 5 -4 3 -5 -2Z`}
              fill="none"
              stroke="#adbe9f"
              opacity=".5"
            />
          );
        })}
        <path d={`M47 ${top}H189M47 151H189`} stroke="#a69b79" strokeWidth="6" />
        <path d={`M47 86H189`} stroke="#c2bca3" strokeDasharray="4 4" opacity=".7" />
        {!actuator && (
          <>
            <rect x="72" y={top - 17} width="92" height="17" rx="3" fill="#c6cdb9" />
            {s.force > 1e-8 && (
              <path
                d={`M118 38V${top - 24}`}
                stroke="#9e9b71"
                strokeWidth="2.3"
                markerEnd={`url(#${id}-arrow)`}
              />
            )}
            <text x="118" y="25" textAnchor="middle">
              F {s.force.toFixed(0)} N
            </text>
          </>
        )}
        <path
          d={`M189 ${top}H284V104M189 151H284V140`}
          stroke="#a0af90"
          fill="none"
          strokeWidth="2"
        />
        {actuator ? (
          <>
            <circle cx="284" cy="122" r="18" fill="#e1e7d6" stroke="#a0af90" />
            <text x="284" y="129" textAnchor="middle">
              V
            </text>
          </>
        ) : s.resistance === Infinity ? (
          <text x="284" y="128" textAnchor="middle">
            ∞
          </text>
        ) : (
          <>
            <rect x="277" y="103" width="14" height="37" rx="2" fill="#e2e7d8" stroke="#a0af90" />
            <text x="307" y="129">
              R
            </text>
          </>
        )}
        <path d={`M221 ${top}V54H323V195H221V151`} stroke="#bec7b1" fill="none" />
        <rect x="235" y="32" width="80" height="44" rx="8" fill="#e1e7d6" />
        <text x="275" y="60" textAnchor="middle">
          {s.voltage.toFixed(1)} V
        </text>
        <text x="206" y={top - 5}>
          {s.voltage >= 0 ? '+' : '−'}
        </text>
        <text x="206" y="174">
          {s.voltage >= 0 ? '−' : '+'}
        </text>
        <text x="17" y="213">
          {t('形变放大')} ×15,000
        </text>
      </svg>
      <div className="piezo-readings">
        <span>
          {t('压缩量')}
          <b>{(s.compression * 1e9).toFixed(1)} nm</b>
        </span>
        <span>
          {actuator ? t('驱动电压') : t('电压')}
          <b>{s.voltage.toFixed(2)} V</b>
        </span>
        {!actuator && (
          <span>
            τ<b>{s.tau === Infinity ? '∞' : s.tau.toFixed(1)} s</b>
          </span>
        )}
      </div>
      {!actuator ? (
        <div className="piezo-trace">
          <svg viewBox="0 0 340 128" role="img" aria-label={t('压电电压随真实秒数变化的曲线')}>
            <path d="M43 15V108M43 63H321" stroke="#c3ccb5" fill="none" />
            <text x="5" y="17">
              V
            </text>
            <text x="3" y="47">
              15
            </text>
            <text x="3" y="91">
              −15
            </text>
            <text x="3" y="68">
              0
            </text>
            <text x="40" y="125">
              0
            </text>
            <text x="321" y="125" textAnchor="end">
              {plotEnd} s
            </text>
            {reference.length > 0 && (
              <path
                d={reference
                  .map((q, i) => `${i ? 'L' : 'M'}${px(q.time)} ${py(q.voltage)}`)
                  .join(' ')}
                stroke="#b9ab7d"
                strokeDasharray="4 4"
                fill="none"
                strokeWidth="2"
              />
            )}
            <path
              d={curve.map((q, i) => `${i ? 'L' : 'M'}${px(q.time)} ${py(q.voltage)}`).join(' ')}
              stroke="#829c83"
              fill="none"
              strokeWidth="2.5"
            />
            <circle cx={px(Math.min(s.time, plotEnd))} cy={py(s.voltage)} r="4" fill="#7e987b" />
          </svg>
          {(c === 3 || c === 4) && (
            <p>{c === 3 ? t('虚线：1 GΩ；实线：0.1 GΩ') : t('虚线：0.1秒加力；实线：4秒加力')}</p>
          )}
        </div>
      ) : (
        <p className="piezo-equation">F = 0 · x = −dV</p>
      )}
      {!film.watch && (
        <div className="piezo-controls">
          <Segments
            label={t('压电模式')}
            value={mode}
            options={[
              { value: 'sensor', label: t('力传感') },
              { value: 'actuator', label: t('电驱动') },
            ]}
            onChange={setMode}
          />
          {actuator ? (
            <Range
              label={t('驱动电压')}
              value={voltage}
              min={-30}
              max={30}
              step={1}
              unit="V"
              onChange={setVoltage}
            />
          ) : (
            <>
              <Range
                label={t('峰值压力')}
                value={force}
                min={0}
                max={150}
                step={5}
                unit="N"
                onChange={setForce}
              />
              <Range
                label={t('加力时间')}
                value={ramp}
                min={0.1}
                max={4}
                step={0.1}
                unit="s"
                onChange={setRamp}
              />
              <Range
                label={t('等效漏电阻')}
                value={resistance}
                min={0.1}
                max={10}
                step={0.1}
                unit="GΩ"
                onChange={setResistance}
              />
              <Range
                label={t('观察时间')}
                value={time}
                min={0}
                max={8}
                step={0.01}
                unit="s"
                onChange={setTime}
              />
            </>
          )}
        </div>
      )}
      <details className="piezo-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '一维小信号陶瓷：d=300 pC/N，C=2 nF，刚度5 GN/m，厚1 mm。压缩为正；形变放大15000倍。忽略惯性、谐振、迟滞、温漂与去极化；电阻包括材料和仪表漏电。',
          )}
        </p>
      </details>
    </div>
  );
}
