import { useState } from 'react';
import { t } from '../../i18n';
import { conduction, conductionShot, conductionColor } from '../../models/heat-conduction';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/heat-conduction.css';
const heatColor = conductionColor;
export default function HeatConduction() {
  const film = useShowcase(),
    phone = useCompact();
  const [seconds, setSeconds] = useState(300),
    [k, setK] = useState(20),
    [length, setLength] = useState(0.1),
    [delta, setDelta] = useState(70);
  const s = conduction(
    film.watch
      ? conductionShot(film.chapter, film.chapterProgress)
      : { seconds, conductivity: k, length, hot: 20 + delta, cold: 20, initial: 20 },
  );
  const W = phone ? 340 : 760,
    H = phone ? 300 : 310,
    extent = (phone ? 220 : 680) * (film.watch && film.chapter !== 4 ? 1 : s.L / 0.2),
    start = phone ? (H - extent) / 2 : (W - extent) / 2,
    rod = phone ? 90 : 110;
  const at = (i: number, row: number) =>
    phone
      ? { x: rod + (row - 1) * 19, y: start + (extent * i) / 24 }
      : { x: start + (extent * i) / 24, y: rod + (row - 1) * 21 };
  const low = Math.min(s.hot, s.cold, 20),
    span = Math.max(1, Math.max(s.hot, s.cold, 20) - low);
  const graph = s.temperature
    .map((T, i) =>
      phone
        ? `${164 + ((T - low) / span) * 130},${start + (extent * i) / 24}`
        : `${start + (extent * i) / 24},${275 - ((T - low) / span) * 90}`,
    )
    .join(' ');
  return (
    <section className="conduction-study">
      <header>
        <span>{t('物质留在原处，能量向前传')}</span>
        <b>{s.seconds.toFixed(0)} s</b>
      </header>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('固定晶格、沿杆温度与传导通量')}>
        <text
          x={phone ? 35 : start}
          y={phone ? start - 12 : 60}
          fontSize={phone ? 24 : 18}
          fill={heatColor(s.hot)}
        >
          {s.hot}°C
        </text>
        <text
          x={phone ? 35 : start + extent}
          y={phone ? start + extent + 28 : 60}
          textAnchor={phone ? 'start' : 'end'}
          fontSize={phone ? 24 : 18}
          fill={heatColor(s.cold)}
        >
          {s.cold}°C
        </text>
        <path
          d={
            phone
              ? `M${rod - 37} ${start}V${start + extent}`
              : `M${start} ${rod - 37}H${start + extent}`
          }
          stroke="#c8bd9950"
          strokeWidth="2"
        />
        {s.temperature.map((T, i) =>
          [0, 1, 2].map((row) => {
            const p = at(i, row),
              osc = Math.sin(i * 2.3 + row * 4 + film.time * 3) * (0.8 + ((T + 50) / 140) * 2);
            return (
              <g key={`${i}-${row}`}>
                <circle cx={p.x} cy={p.y} r="5" fill="#a59a7930" />
                <circle
                  cx={p.x + osc}
                  cy={p.y + Math.cos(i + film.time * 2) * 1.7}
                  r="6"
                  fill={heatColor(T)}
                />
              </g>
            );
          }),
        )}
        {[2, 6, 10, 14, 18, 22].map((i) => {
          const a = at(i, 1),
            magnitude = Math.min(1, Math.abs(s.flux[i]) / 14000);
          return (
            <path
              key={i}
              d={
                phone
                  ? `M${a.x + 42} ${a.y - 9}v18l-4 -5m4 5l4 -5`
                  : `M${a.x - 9} ${a.y + 43}h18l-5 -4m5 4l-5 4`
              }
              stroke="#bf925b"
              strokeWidth={1 + 2 * magnitude}
              opacity={magnitude < 1e-8 ? 0 : 0.25 + 0.75 * magnitude}
              transform={
                s.flux[i] < 0
                  ? `rotate(180 ${phone ? a.x + 42 : a.x} ${phone ? a.y : a.y + 43})`
                  : undefined
              }
            />
          );
        })}
        <polyline points={graph} stroke="#7a6a53" strokeWidth="2.5" fill="none" />
        <path
          d={phone ? `M164 ${start}V${start + extent}H294` : `M${start} 180V275H${start + extent}`}
          stroke="#a3998055"
          fill="none"
        />
      </svg>
      <div className="conduction-baths">
        <span style={{ color: heatColor(s.hot) }}>
          {t('恒温端')} {s.hot}°C
        </span>
        <span>{t('温度剖面')}</span>
        <span style={{ color: heatColor(s.cold) }}>{s.cold}°C</span>
      </div>
      <p className="conduction-parameters">
        k = {s.k} W/(m·K) · L = {s.L.toFixed(2)} m
      </p>
      <div className="conduction-ledger">
        <span>
          {t('流入')}
          <b>{s.inputPower.toFixed(2)} W</b>
        </span>
        <span>
          {t('杆内储能变化')}
          <b>{s.energyRate.toFixed(2)} W</b>
        </span>
        <span>
          {t('流出')}
          <b>{s.outputPower.toFixed(2)} W</b>
        </span>
      </div>
      <details>
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '一维固体，侧面绝热；端点恒温。晶格振动为定性示意，位置不随热流迁移。箭头表示净能量通量。',
          )}
        </p>
      </details>
      {!film.watch && (
        <div className="conduction-controls">
          <Range
            label={t('模型时间')}
            value={seconds}
            min={0}
            max={4000}
            step={10}
            unit="s"
            onChange={setSeconds}
          />
          <Range label={t('导热率')} value={k} min={5} max={40} unit="W/(m·K)" onChange={setK} />
          <Range
            label={t('杆长')}
            value={length}
            min={0.05}
            max={0.2}
            step={0.01}
            unit="m"
            onChange={setLength}
          />
          <Range
            label={t('端点温差')}
            value={delta}
            min={-70}
            max={70}
            unit="K"
            onChange={setDelta}
          />
        </div>
      )}
    </section>
  );
}
