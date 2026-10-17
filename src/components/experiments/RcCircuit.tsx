import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { rcDefaults, rcState, rcShot, rcCurve } from '../../models/rc-circuit';
import '../../styles/rc-circuit.css';
export default function RcCircuit() {
  const film = useShowcase(),
    [manual, setManual] = useState(rcDefaults()),
    [time, setTime] = useState(1),
    shot = film.watch
      ? rcShot(film.chapter, film.chapterProgress)
      : { parameters: manual, state: rcState(manual, time) },
    p = shot.parameters,
    s = shot.state,
    c = film.watch ? film.chapter : 6,
    discharge = p.target === 0,
    maxV = 5;
  const graph = (mobile: boolean) => {
    const width = mobile ? 340 : 680,
      height = mobile ? 135 : 210,
      l = mobile ? 34 : 42,
      r = width - 20,
      top = 20,
      bottom = height - 32,
      duration = 5,
      curve = rcCurve(p, duration);
    const point = (v: { time: number; voltage: number }) =>
      `${l + ((r - l) * v.time) / duration},${bottom - ((bottom - top) * v.voltage) / maxV}`;
    return (
      <svg
        className={mobile ? 'rc-phone-chart' : 'rc-wide-chart'}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t('电容电压随物理时间变化的曲线')}
      >
        <path d={`M${l} ${top}V${bottom}H${r}`} stroke="#acb9ad" fill="none" />
        <path d={`M${l} ${top}H${r}`} stroke="#d2d8cb" strokeDasharray="3 5" />
        <text x={l - 7} y={top + 6} textAnchor="end">
          5
        </text>
        <text x={l - 7} y={bottom + 6} textAnchor="end">
          0
        </text>
        <text x={r} y={height - 6} textAnchor="end">
          5 s
        </text>
        <text x={l + 9} y={top + 4}>
          V
        </text>
        {(c === 3 || c === 4) && (
          <polyline
            points={rcCurve(rcDefaults(), duration).map(point).join(' ')}
            stroke="#c4c9bf"
            strokeWidth="2"
            strokeDasharray="4 5"
            fill="none"
          />
        )}
        <polyline
          points={curve.map(point).join(' ')}
          stroke="#8e77a3"
          strokeWidth="3"
          fill="none"
        />
        <line
          x1={l + ((r - l) * s.time) / duration}
          y1={top}
          x2={l + ((r - l) * s.time) / duration}
          y2={bottom}
          stroke="#bda6ce"
        />
        <circle
          cx={l + ((r - l) * s.time) / duration}
          cy={bottom - ((bottom - top) * s.voltage) / maxV}
          r="5"
          fill="#8e77a3"
        />
        <text
          x={s.time / duration > 0.78 ? r : l + ((r - l) * s.time) / duration + 8}
          y={bottom - 9}
          textAnchor={s.time / duration > 0.78 ? 'end' : 'start'}
        >
          {s.time.toFixed(2)} s
        </text>
      </svg>
    );
  };
  return (
    <div className="rc-film">
      <div className="rc-apparatus">
        <svg
          className="rc-circuit"
          viewBox="0 0 350 205"
          role="img"
          aria-label={t('电阻与电容串联，电荷积累在两块极板上')}
        >
          <path
            d="M55 110V48H131M190 48H288V101M288 134V196H55V145"
            stroke="#9eb2a3"
            strokeWidth="4"
            fill="none"
          />
          {discharge ? (
            <path d="M55 110V145" stroke="#9eb2a3" strokeWidth="4" />
          ) : (
            <>
              <path d="M37 112H73M44 142H66" stroke="#b18c59" strokeWidth="4" />
              <text x="29" y="91">
                5 V
              </text>
            </>
          )}
          <rect
            x="131"
            y="39"
            width="59"
            height="18"
            rx="4"
            fill="#e9dfc8"
            stroke="#a7906b"
            strokeWidth="2"
          />
          <text x="160" y="29" textAnchor="middle">
            R {(p.resistance / 1000).toFixed(1)} kΩ
          </text>
          <path d="M261 101H315M261 134H315" stroke="#8e77a3" strokeWidth="5" />
          <rect
            x="264"
            y="106"
            width="48"
            height="23"
            rx="4"
            fill="#b59fc7"
            opacity={0.04 + (0.35 * s.voltage) / 5}
          />
          {Array.from({ length: 5 }, (_, i) => (
            <g key={i} opacity={s.voltage / 5}>
              <path d={`M${269 + i * 10} 85v8m-4-4h8`} stroke="#b87e57" strokeWidth="1.5" />
              <path d={`M${265 + i * 10} 150h8`} stroke="#7195a5" strokeWidth="1.5" />
            </g>
          ))}
          <text x="287" y="178" textAnchor="middle">
            C {(p.capacitance * 1000).toFixed(1)} mF
          </text>
          <path
            d={discharge ? 'M105 74H75m6-5-6 5 6 5' : 'M75 74H105m-6-5 6 5-6 5'}
            stroke="#5e9486"
            strokeWidth={1 + Math.abs(s.current) * 600}
            fill="none"
          />
          <text x="160" y="107" textAnchor="middle" fill="#547e70">
            I {(s.current * 1000).toFixed(2)} mA
          </text>
          <text x="160" y="145" textAnchor="middle" fill="#806294">
            VC {s.voltage.toFixed(2)} V
          </text>
        </svg>
        <div className="rc-voltage-budget">
          <span>{discharge ? t('储能释放') : t('五伏如何分配')}</span>
          <div className={discharge ? 'rc-discharge-bars' : 'rc-voltage-stack'}>
            <i style={{ width: `${(Math.abs(s.resistorVoltage) / 5) * 100}%` }} />
            <b style={{ width: `${(s.voltage / 5) * 100}%` }} />
          </div>
          <p>
            <span>VR {s.resistorVoltage.toFixed(2)} V</span>
            <span>VC {s.voltage.toFixed(2)} V</span>
          </p>
          <p>
            <span>{discharge ? t('电源移除') : t('直流电源')}</span>
            <span>τ = {s.tau.toFixed(2)} s</span>
          </p>
        </div>
      </div>
      <div className="rc-chart">
        {graph(false)}
        {graph(true)}
      </div>
      {c >= 6 && (
        <div className="rc-energy">
          <span>
            {discharge ? t('初始储能') : t('电源供能')}
            <b>{((s.sourceEnergy + s.initialEnergy) * 1000).toFixed(1)} mJ</b>
          </span>
          <i>=</i>
          <span>
            {t('电场储能')}
            <b>{(s.energy * 1000).toFixed(1)} mJ</b>
          </span>
          <i>+</i>
          <span>
            {t('电阻热量')}
            <b>{(s.heat * 1000).toFixed(1)} mJ</b>
          </span>
        </div>
      )}
      {!film.watch && (
        <div className="rc-controls">
          <Segments
            label={t('充电或放电')}
            value={discharge ? 'discharge' : 'charge'}
            options={[
              { value: 'charge', label: t('从空电容充电') },
              { value: 'discharge', label: t('从五伏放电') },
            ]}
            onChange={(v) => {
              setManual({
                ...manual,
                target: v === 'charge' ? 5 : 0,
                initial: v === 'charge' ? 0 : 5,
              });
              setTime(0);
            }}
          />
          <Range
            label={t('串联电阻')}
            value={p.resistance}
            min={500}
            max={5000}
            step={100}
            unit="Ω"
            onChange={(resistance) => setManual({ ...manual, resistance })}
          />
          <Range
            label={t('电容容量')}
            value={p.capacitance * 1000}
            min={0.5}
            max={2}
            step={0.1}
            unit="mF"
            onChange={(v) => setManual({ ...manual, capacitance: v / 1000 })}
          />
          <Range
            label={t('物理取样时间')}
            value={s.time}
            min={0}
            max={5}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
      <details className="rc-limit">
        <summary>{t('模型条件')}</summary>
        <p>{t('理想线性电阻与电容 · 影片慢放，曲线保留秒的单位')}</p>
      </details>
    </div>
  );
}
