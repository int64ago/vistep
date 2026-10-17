import { useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { bridgeDefaults, bridgeShot, bridgeState } from '../../models/wheatstone-bridge';
import '../../styles/wheatstone-bridge.css';
export default function WheatstoneBridge() {
  const film = useShowcase(),
    [manual, setManual] = useState(bridgeDefaults()),
    p = film.watch ? bridgeShot(film.chapter, film.chapterProgress) : manual,
    s = bridgeState(p),
    c = film.watch ? film.chapter : 5;
  const render = (mobile: boolean) => {
    const width = mobile ? 350 : 680,
      left = mobile ? 75 : 165,
      right = mobile ? 275 : 515,
      mid = (left + right) / 2,
      top = 45,
      bottom = 290,
      node = 170;
    const resistor = (x: number, y: number, label: string, value: number, current: number) => (
      <g>
        <path d={`M${x} ${y - 27}V${y + 27}`} stroke="#7caaa1" strokeWidth="5" />
        <rect
          x={x - 8}
          y={y - 21}
          width="16"
          height="42"
          rx="4"
          fill="#e9e3d1"
          stroke="#a99f83"
          strokeWidth="2"
        />
        <text x={x + (x === left ? -19 : 19)} y={y - 6} textAnchor={x === left ? 'end' : 'start'}>
          {label}
        </text>
        <text x={x + (x === left ? -19 : 19)} y={y + 17} textAnchor={x === left ? 'end' : 'start'}>
          {(value / 1000).toFixed(1)}k
        </text>
        <path
          d={`M${x} ${y - 43}v12m-4-5 4 5 4-5`}
          fill="none"
          stroke="#438b7c"
          strokeWidth={Math.max(1, Math.min(4, current * 1000))}
        />
      </g>
    );
    return (
      <svg
        className={mobile ? 'bridge-phone' : 'bridge-wide'}
        viewBox={`0 0 ${width} 340`}
        role="img"
        aria-label={t('两条分压支路与中间的检流计')}
      >
        <path
          d={`M${mid} 22V${top}H${left}V${bottom}H${right}V${top}H${mid}M${mid} ${bottom}V316`}
          fill="none"
          stroke="#a5bbb0"
          strokeWidth="4"
        />
        <text x={mid + 12} y="27" fill="#b57c50">
          +{p.supply.toFixed(1)} V
        </text>
        <text x={mid + 12} y="325">
          0 V
        </text>
        {resistor(left, 103, 'R1', p.r1, s.i1)}
        {resistor(left, 235, 'R2', p.r2, s.i2)}
        {resistor(right, 103, 'R3', p.r3, s.i3)}
        {resistor(right, 235, 'R4', p.r4, s.i4)}
        <path d={`M${left} ${node}H${right}`} stroke="#a08aaf" strokeWidth="2.5" />
        <circle cx={mid} cy={node} r="30" fill="#fbf9f3" stroke="#a08aaf" strokeWidth="2" />
        <path
          d={`M${mid - 21} ${node + 4}Q${mid} ${node - 27} ${mid + 21} ${node + 4}`}
          fill="none"
          stroke="#cbc0ce"
        />
        <line
          x1={mid}
          y1={node + 9}
          x2={mid + Math.max(-20, Math.min(20, s.im * 40000))}
          y2={node - 15}
          stroke="#89669d"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <text x={mid} y={node + 57} textAnchor="middle" fill="#806091">
          {(s.im * 1000).toFixed(3)} mA
        </text>
        <circle cx={left} cy={node} r="6" fill="#438b7c" />
        <circle cx={right} cy={node} r="6" fill="#b78654" />
        <text x={left + 17} y={node - 14} fill="#438b7c">
          A
        </text>
        <text x={right - 17} y={node - 14} textAnchor="end" fill="#aa7a46">
          B
        </text>
        <text x={mid} y="72" textAnchor="middle" fill="#698678">
          {t('电源电流')} {(s.sourceCurrent * 1000).toFixed(2)} mA
        </text>
      </svg>
    );
  };
  return (
    <div className="bridge-film">
      <div className="bridge-circuit">
        {render(false)}
        {render(true)}
      </div>
      <div className="bridge-potentials">
        <div>
          <span>A</span>
          <i style={{ width: `${(s.va / Math.max(0.001, p.supply)) * 100}%` }} />
          <strong>{s.va.toFixed(3)} V</strong>
        </div>
        <div>
          <span>B</span>
          <i style={{ width: `${(s.vb / Math.max(0.001, p.supply)) * 100}%` }} />
          <strong>{s.vb.toFixed(3)} V</strong>
        </div>
        <p>
          {t('两点电势差')} <b>{s.difference.toFixed(3)} V</b>
          {c >= 5 && (
            <small>
              {t('检流计电阻')} {(p.meter / 1000).toFixed(1)} kΩ
            </small>
          )}
        </p>
      </div>
      {!film.watch && (
        <div className="bridge-controls">
          <Range
            label={t('左下支路 R2')}
            value={p.r2}
            min={500}
            max={3000}
            step={100}
            unit="Ω"
            onChange={(r2) => setManual({ ...manual, r2 })}
          />
          <Range
            label={t('右下支路 R4')}
            value={p.r4}
            min={500}
            max={3000}
            step={100}
            unit="Ω"
            onChange={(r4) => setManual({ ...manual, r4 })}
          />
          <Range
            label={t('桥路激励电压')}
            value={p.supply}
            min={0}
            max={10}
            step={0.5}
            unit="V"
            onChange={(supply) => setManual({ ...manual, supply })}
          />
          <Range
            label={t('检流计电阻')}
            value={p.meter}
            min={100}
            max={10000}
            step={100}
            unit="Ω"
            onChange={(meter) => setManual({ ...manual, meter })}
          />
          <button className="btn" onClick={() => setManual(bridgeDefaults())}>
            {t('重置电桥')}
          </button>
        </div>
      )}
      <p className="bridge-limit">{t('直流稳态 · 理想电阻 · 检流计负载纳入计算')}</p>
    </div>
  );
}
