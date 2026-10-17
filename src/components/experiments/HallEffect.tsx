import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { hallDefaults, hallEffect, hallShot, hallDriftDistance } from '../../models/hall-effect';
import '../../styles/hall-effect.css';
export default function HallEffect() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [current, setCurrent] = useState(10),
    [field, setField] = useState(0.2),
    [density, setDensity] = useState(1),
    [carrier, setCarrier] = useState('-1'),
    [phase, setPhase] = useState(0.5),
    c = film.watch ? film.chapter : -1,
    s = film.watch
      ? hallShot(c, film.chapterProgress)
      : hallEffect({
          ...hallDefaults(),
          current: current / 1000,
          field,
          density: density * 1e22,
          carrier: Number(carrier) as -1 | 1,
        }),
    distance = film.watch ? hallDriftDistance(c, film.chapterProgress) : s.drift * 0.02 * phase,
    shift = (distance / s.length) * 260,
    magDirection = -Math.sign(s.magneticForce),
    electricDirection = -Math.sign(s.electricForce),
    showElectric = c >= 2 || !film.watch,
    polarity = Math.sign(s.hallVoltage),
    chargeOpacity = Math.min(1, Math.abs(s.hallField) / 0.4),
    sign = (x: number, y: number, positive: boolean) => (
      <path
        d={`M${x - 4} ${y}h8${positive ? `M${x} ${y - 4}v8` : ''}`}
        stroke={positive ? '#b29460' : '#789f95'}
        strokeWidth="1.6"
      />
    );
  return (
    <div className="hall-film" data-watch={film.watch}>
      <p className="hall-state">
        {s.carrier < 0 ? t('电子：漂移与传统电流相反') : t('正载流子：漂移与传统电流同向')}
      </p>
      <svg
        className="hall-sample"
        viewBox="0 0 340 222"
        role="img"
        aria-label={t('霍尔样品俯视图、磁场方向和固定上下探针')}
      >
        <defs>
          <linearGradient id={`${id}-sample`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#e0e7d3" />
            <stop offset=".5" stopColor="#edf0e0" />
            <stop offset="1" stopColor="#dce5d0" />
          </linearGradient>
          <marker
            id={`${id}-force`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="#ad9365" />
          </marker>
          <marker
            id={`${id}-electric`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="#7c9f91" />
          </marker>
        </defs>
        <text x="125" y="20" textAnchor="middle">
          I {Math.abs(s.current * 1000).toFixed(0)} mA
        </text>
        {s.current !== 0 && (
          <path
            d={s.current > 0 ? 'M60 29H195' : 'M195 29H60'}
            stroke="#a58c61"
            strokeWidth="2"
            markerEnd={`url(#${id}-force)`}
          />
        )}
        <text x="328" y="25" textAnchor="end">
          B {s.field === 0 ? '0' : s.field > 0 ? '⊙' : '⊗'} {Math.abs(s.field).toFixed(2)} T
        </text>
        <rect
          x="20"
          y="55"
          width="260"
          height="104"
          rx="7"
          fill={`url(#${id}-sample)`}
          stroke="#b6c3a6"
        />
        <rect x="16" y="70" width="8" height="74" rx="2" fill="#b2baa2" />
        <rect x="276" y="70" width="8" height="74" rx="2" fill="#b2baa2" />
        {s.field !== 0 &&
          [48, 98, 198, 250].flatMap((px) =>
            [80, 133].map((py) => (
              <g key={`${px}-${py}`} opacity={0.2 + (0.25 * Math.abs(s.field)) / 0.3}>
                <circle cx={px} cy={py} r="5" stroke="#88a696" fill="none" />
                {s.field > 0 ? (
                  <circle cx={px} cy={py} r="1.4" fill="#88a696" />
                ) : (
                  <path d={`M${px - 2.5} ${py - 2.5}l5 5m-5 0 5 -5`} stroke="#88a696" />
                )}
              </g>
            )),
          )}
        {Array.from({ length: 14 }, (_, j) => {
          const px = 27 + (((((j % 7) * 36 + shift + (j >= 7 ? 18 : 0)) % 246) + 246) % 246),
            py = j < 7 ? 91 : 124;
          return (
            <g key={j} opacity=".6">
              <circle
                cx={px}
                cy={py}
                r="3.5"
                fill={s.carrier < 0 ? '#87a99a' : '#efebd7'}
                stroke={s.carrier < 0 ? '#87a99a' : '#b59f6b'}
                strokeWidth="1.2"
              />
              {s.carrier > 0 && (
                <path d={`M${px - 2} ${py}h4M${px} ${py - 2}v4`} stroke="#b59f6b" />
              )}
            </g>
          );
        })}
        {polarity !== 0 &&
          [42, 76, 110, 144, 178, 212, 246].map((px) => (
            <g key={px} opacity={chargeOpacity}>
              {sign(px, 60, polarity < 0)}
              {sign(px, 154, polarity > 0)}
            </g>
          ))}
        <circle
          cx="145"
          cy="107"
          r="7"
          fill={s.carrier < 0 ? '#85a497' : '#eadfbd'}
          stroke="#91a489"
          strokeWidth="1.5"
        />
        {sign(145, 107, s.carrier > 0)}
        {s.drift !== 0 && (
          <>
            <path
              d={s.drift > 0 ? 'M156 107H201' : 'M134 107H89'}
              stroke="#8ba58c"
              strokeWidth="2"
              markerEnd={`url(#${id}-electric)`}
            />
            <text x={s.drift > 0 ? 201 : 89} y="98" textAnchor="middle">
              v
            </text>
          </>
        )}
        {magDirection !== 0 && (
          <>
            <path
              d={`M145 ${107 + magDirection * 10}V${107 + magDirection * 35}`}
              stroke="#ad9365"
              strokeWidth="2.5"
              markerEnd={`url(#${id}-force)`}
            />
            <text x="160" y={magDirection > 0 ? 144 : 82}>
              FB
            </text>
            {showElectric && (
              <>
                <path
                  d={`M145 ${107 + electricDirection * 10}V${107 + electricDirection * 35}`}
                  stroke="#7c9f91"
                  strokeWidth="2.5"
                  markerEnd={`url(#${id}-electric)`}
                />
                <text x="104" y={electricDirection > 0 ? 144 : 82}>
                  FE
                </text>
              </>
            )}
          </>
        )}
        <path d="M170 55V43H310V83" fill="none" stroke="#9caa92" strokeWidth="2" />
        <path d="M170 159V171H310V125" fill="none" stroke="#b49476" strokeWidth="2" />
        <circle cx="170" cy="55" r="3" fill="#91a089" />
        <circle cx="170" cy="159" r="3" fill="#b49476" />
        <circle cx="310" cy="104" r="21" fill="#f3f3e7" stroke="#b7c3a9" strokeWidth="1.5" />
        <text x="310" y="112" textAnchor="middle">
          V
        </text>
        <text x="330" y="84" textAnchor="end">
          −
        </text>
        <text x="330" y="145" textAnchor="end">
          +
        </text>
        <text x="150" y="201" textAnchor="middle">
          {t('俯视：厚度0.5 mm')}
        </text>
      </svg>
      <div className="hall-meter">
        <span>{t('下边缘 − 上边缘')}</span>
        <b>
          {(s.hallVoltage * 1000).toFixed(2)} <small>mV</small>
        </b>
      </div>
      <div className="hall-readings">
        <span>
          v <b>{s.drift.toFixed(2)} m/s</b>
        </span>
        <span>
          n <b>{(s.density / 1e22).toFixed(2)} ×10²²/m³</b>
        </span>
      </div>
      {showElectric && <p className="hall-balance">FB + FE = 0 · {t('横向力平衡')}</p>}
      {!film.watch && (
        <div className="hall-controls">
          <Segments
            label={t('载流子符号')}
            value={carrier}
            options={[
              { value: '-1', label: t('电子') },
              { value: '1', label: t('正载流子') },
            ]}
            onChange={setCarrier}
          />
          <Range
            label={t('传统电流')}
            value={current}
            min={-20}
            max={20}
            step={1}
            unit="mA"
            onChange={setCurrent}
          />
          <Range
            label={t('垂直磁场')}
            value={field}
            min={-0.3}
            max={0.3}
            step={0.01}
            unit="T"
            onChange={setField}
          />
          <Range
            label={t('载流子密度')}
            value={density}
            min={0.5}
            max={2}
            step={0.05}
            unit="×10²²/m³"
            onChange={setDensity}
          />
          <Range
            label={t('慢放漂移位置')}
            value={phase}
            min={0}
            max={1}
            step={0.01}
            onChange={setPhase}
          />
        </div>
      )}
      <details className="hall-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '均匀单载流子模型；长20 mm、宽8 mm、厚0.5 mm。红表笔接下边缘，黑表笔接上边缘；箭头仅表示方向。粒子是选取的示踪载流子，每章慢放20 ms漂移；横向电场已处于稳态，不模拟积累瞬态。',
          )}
        </p>
      </details>
    </div>
  );
}
