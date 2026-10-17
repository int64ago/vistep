import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { threePhase, threePhaseDefaults, threePhaseShot } from '../../models/three-phase-power';
import '../../styles/three-phase-power.css';
const colors = ['#ac996b', '#7e9c83', '#9a9eb8'],
  names = ['A', 'B', 'C'];
export default function ThreePhasePower() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [angle, setAngle] = useState(0),
    [scale, setScale] = useState(1),
    [phaseCount, setPhaseCount] = useState('3'),
    [phase, setPhase] = useState(45),
    c = film.watch ? film.chapter : -1,
    s = film.watch
      ? threePhaseShot(c, film.chapterProgress)
      : threePhase(
          {
            ...threePhaseDefaults(),
            angle: (angle * Math.PI) / 180,
            aScale: scale,
            phases: Number(phaseCount) as 1 | 3,
          },
          (phase * Math.PI) / 180,
        ),
    curves = useMemo(
      () =>
        Array.from({ length: 121 }, (_, i) =>
          threePhase(
            {
              voltage: s.voltage,
              frequency: s.frequency,
              impedance: s.impedance,
              angle: s.angle,
              aScale: s.aScale,
              phases: s.phases,
            },
            (i / 120) * 2 * Math.PI,
          ),
        ),
      [s.voltage, s.frequency, s.impedance, s.angle, s.aScale, s.phases],
    ),
    u = (((s.theta / (2 * Math.PI)) % 1) + 1) % 1,
    px = (v: number) => 43 + v * 278,
    py = (v: number) => 111 - (v / 3000) * 90,
    ax = 170 + (s.phase[0].phasor[0] / s.voltage) * 75,
    ay = 108 - (s.phase[0].phasor[1] / s.voltage) * 75,
    bx = 170 + (s.phase[1].phasor[0] / s.voltage) * 75,
    by = 108 - (s.phase[1].phasor[1] / s.voltage) * 75;
  return (
    <div className="threepower-film" data-watch={film.watch}>
      <p className="threepower-context">
        {c === 0
          ? t('同频率、同幅度，相位依次错开120°')
          : c === 1
            ? t('线电压是两相电压之差')
            : s.phases === 1
              ? t('单相：瞬时功率每周期起伏两次')
              : s.aScale !== 1
                ? t('A相负载加重：平衡被打破')
                : s.angle !== 0
                  ? t('平衡感性负载：各相交换能量，总功率仍恒定')
                  : t('三相平衡：起伏抵消，总功率不变')}
      </p>
      <svg
        className="threepower-main"
        viewBox="0 0 340 222"
        role="img"
        aria-label={t('三相电压、相量差或带中性线的星形负载回路')}
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
            <path d="M0 0L10 5L0 10Z" fill="#7e9677" />
          </marker>
        </defs>
        {c === 0 ? (
          <>
            {s.phase.map((q, k) => (
              <g key={k}>
                <text x="8" y={42 + k * 63} fill={colors[k]}>
                  {names[k]}
                </text>
                <path d={`M43 ${38 + k * 63}H321`} stroke="#d1d8c5" />
                <path
                  d={curves
                    .map(
                      (v, i) =>
                        `${i ? 'L' : 'M'}${px(i / 120)} ${38 + k * 63 - (v.phase[k].voltage / (Math.SQRT2 * s.voltage)) * 24}`,
                    )
                    .join(' ')}
                  stroke={colors[k]}
                  strokeWidth="2.7"
                  fill="none"
                />
                <circle
                  cx={px(u)}
                  cy={38 + k * 63 - (q.voltage / (Math.SQRT2 * s.voltage)) * 24}
                  r="4.5"
                  fill={colors[k]}
                />
              </g>
            ))}
            <path d={`M${px(u)} 9V195`} stroke="#9fae91" strokeDasharray="3 3" />
            <text x="43" y="218">
              0
            </text>
            <text x="320" y="218" textAnchor="end">
              20 ms
            </text>
          </>
        ) : c === 1 ? (
          <>
            <circle cx="170" cy="108" r="75" fill="none" stroke="#d0d8c2" />
            <path d="M77 108H263M170 15V200" stroke="#dbe0d2" />
            {s.phase.map((q, k) => {
              const x = 170 + (q.phasor[0] / s.voltage) * 75,
                y = 108 - (q.phasor[1] / s.voltage) * 75;
              return (
                <g key={k}>
                  <path d={`M170 108L${x} ${y}`} stroke={colors[k]} strokeWidth="2.5" />
                  <circle cx={x} cy={y} r="4" fill={colors[k]} />
                  <text
                    x={170 + (q.phasor[0] / s.voltage) * 98}
                    y={115 - (q.phasor[1] / s.voltage) * 98}
                    textAnchor="middle"
                  >
                    {names[k]}
                  </text>
                </g>
              );
            })}
            <path
              d={`M${bx} ${by}L${ax} ${ay}`}
              stroke="#7e9677"
              strokeWidth="3.3"
              markerEnd={`url(#${id}-arrow)`}
            />
            <text x="16" y="218">
              A − B
            </text>
            <text x="324" y="218" textAnchor="end">
              √3 × 230 V
            </text>
          </>
        ) : (
          <>
            <path
              d="M16 37V202H296V37M16 94H30M16 151H30"
              stroke="#bdc8ae"
              strokeWidth="2"
              fill="none"
            />
            {s.phase.map((q, k) => {
              const y = 37 + k * 57,
                forward = q.current >= 0;
              return (
                <g key={k}>
                  <path
                    d={`M16 ${y}H35M69 ${y}H121M151 ${y}H212M244 ${y}H296`}
                    stroke={colors[k]}
                    strokeWidth="2"
                    fill="none"
                  />
                  <circle cx="52" cy={y} r="17" fill="#e9ecdf" stroke={colors[k]} />
                  <text x="52" y={y + 6} textAnchor="middle">
                    ~
                  </text>
                  <text x="86" y={y - 9}>
                    {names[k]}
                  </text>
                  {q.active ? (
                    <path d={`M121 ${y}H151`} stroke={colors[k]} strokeWidth="2" />
                  ) : (
                    <path d={`M121 ${y}l24 -12`} stroke={colors[k]} strokeWidth="2" />
                  )}
                  <rect
                    x="212"
                    y={y - 9}
                    width="32"
                    height="18"
                    rx="3"
                    fill="#e2e8d7"
                    stroke={colors[k]}
                  />
                  <text x="228" y={y + 6} textAnchor="middle">
                    Z
                  </text>
                  <text x="271" y={y - 12} textAnchor="middle">
                    {q.impedance.toFixed(0)}Ω
                  </text>
                  {q.active && Math.abs(q.current) > 1e-8 && (
                    <path
                      d={forward ? `M166 ${y - 6}l8 6 -8 6` : `M174 ${y - 6}l-8 6 8 6`}
                      fill="none"
                      stroke={colors[k]}
                      strokeWidth="2.4"
                    />
                  )}
                </g>
              );
            })}
            <text x="18" y="222">
              N
            </text>
            <text x="315" y="120">
              Y
            </text>
            <text x="170" y="191" textAnchor="middle">
              iN {Math.abs(s.neutral) < 1e-8 ? '0.00' : s.neutral.toFixed(2)} A
            </text>
            {Math.abs(s.neutral) > 1e-8 && (
              <path
                d={s.neutral > 0 ? 'M195 196l-8 6 8 6' : 'M187 196l8 6 -8 6'}
                fill="none"
                stroke="#8d9e7d"
                strokeWidth="2.5"
              />
            )}
          </>
        )}
      </svg>
      {c === 1 ? (
        <div className="threepower-readings">
          <span>
            {t('相电压RMS')}
            <b>230 V</b>
          </span>
          <span>
            {t('线电压RMS')}
            <b>{s.lineRms.toFixed(1)} V</b>
          </span>
        </div>
      ) : c === 0 ? (
        <p className="threepower-equation">50 Hz · 230 V RMS · 120°</p>
      ) : (
        <>
          <div className="threepower-readings">
            <span>
              {t('瞬时总功率')}
              <b>{(s.power / 1000).toFixed(3)} kW</b>
            </span>
            <span>
              {t('平均有功')}
              <b>{(s.activePower / 1000).toFixed(3)} kW</b>
            </span>
          </div>
          <svg
            className="threepower-plot"
            viewBox="0 0 340 151"
            role="img"
            aria-label={t('各相瞬时功率和总功率在一周期内的变化')}
          >
            <path d="M43 12V132M43 111H321" fill="none" stroke="#c4ceb7" />
            <text x="3" y="18">
              kW
            </text>
            <text x="14" y="35">
              3
            </text>
            <text x="14" y="117">
              0
            </text>
            <text x="43" y="148">
              0
            </text>
            <text x="320" y="148" textAnchor="end">
              20 ms
            </text>
            {s.phase
              .filter((q) => q.active)
              .map((q) => (
                <path
                  key={q.index}
                  d={curves
                    .map((v, i) => `${i ? 'L' : 'M'}${px(i / 120)} ${py(v.phase[q.index].power)}`)
                    .join(' ')}
                  stroke={colors[q.index]}
                  strokeWidth="1.8"
                  fill="none"
                />
              ))}
            {s.phases === 3 && (
              <path
                d={curves.map((v, i) => `${i ? 'L' : 'M'}${px(i / 120)} ${py(v.power)}`).join(' ')}
                stroke="#728f72"
                strokeWidth="3.2"
                fill="none"
              />
            )}
            <path d={`M${px(u)} 12V132`} stroke="#b0bda1" strokeDasharray="3 3" />
            <circle cx={px(u)} cy={py(s.power)} r="4.5" fill="#728f72" />
          </svg>
          <div className="threepower-legend">
            {names.map((v, i) => (
              <span style={{ color: colors[i] }} key={v}>
                {v}
              </span>
            ))}
            <b>Σ</b>
            {s.angle !== 0 && <span>φ {((s.angle * 180) / Math.PI).toFixed(0)}°</span>}
          </div>
        </>
      )}
      {!film.watch && (
        <div className="threepower-controls">
          <Segments
            label={t('接入相数')}
            value={phaseCount}
            options={[
              { value: '1', label: t('仅A相') },
              { value: '3', label: t('三相') },
            ]}
            onChange={setPhaseCount}
          />
          <Range
            label={t('电流滞后角')}
            value={angle}
            min={0}
            max={60}
            step={1}
            unit="°"
            onChange={setAngle}
          />
          <Range
            label={t('A相阻抗倍数')}
            value={scale}
            min={0.5}
            max={2}
            step={0.05}
            onChange={setScale}
          />
          <Range
            label={t('电周期位置')}
            value={phase}
            min={0}
            max={360}
            step={1}
            unit="°"
            onChange={setPhase}
          />
        </div>
      )}
      <details className="threepower-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '理想对称50 Hz电源，星形负载，中性线始终接通。默认每相|Z|=100Ω；改变滞后角时保持|Z|不变。仅正弦稳态，忽略线路阻抗、谐波和开关暂态；每章慢放40 ms。',
          )}
        </p>
      </details>
    </div>
  );
}
