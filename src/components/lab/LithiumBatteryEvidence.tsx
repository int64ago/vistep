import { useMemo } from 'react';
import { t } from '../../i18n';
import {
  lithiumAdvance,
  lithiumGeometry,
  lithiumTracer,
  lithiumReadout,
  lithiumChemicalEnergy,
  type LithiumPoint,
  type LithiumShot,
} from '../../models/lithium-battery';
export function LithiumBatteryFlat({
  shot,
  width,
  detail = false,
}: {
  shot: LithiumShot;
  width: number;
  detail?: boolean;
}) {
  const g = lithiumGeometry(),
    height = detail
      ? 350
      : width < 680
        ? shot.view === 'power' || shot.view === 'inventory'
          ? 224
          : 294
        : 340,
    scale = Math.min((width - 24) / 3.24, (height - (detail ? 90 : 104)) / 3.61),
    xy = ([x, y]: LithiumPoint) => [width / 2 + x * scale, 10 + (2.27 - y) * scale],
    path = (points: LithiumPoint[]) => points.map((p, i) => `${i ? 'L' : 'M'}${xy(p)}`).join(' '),
    cellTop = xy([0, 1.25, 0])[1],
    cellBottom = xy([0, -1.25, 0])[1],
    port = xy([0, 2.05, 0]),
    hero = lithiumTracer(0, shot.state.soc);
  return (
    <svg
      className="lb-flat"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('同一组示踪点：离子穿过湿润孔道，电子沿外部导线')}
    >
      <rect
        x={xy([-1.28, 0, 0])[0]}
        y={cellTop}
        width={2.56 * scale}
        height={cellBottom - cellTop}
        fill="#c8d8d0"
        fillOpacity=".32"
        rx="4"
      />
      <rect
        x={xy([-0.12, 0, 0])[0]}
        y={cellTop}
        width={0.24 * scale}
        height={cellBottom - cellTop}
        fill="#ded8bd"
      />
      {Array.from({ length: 6 }, (_, i) => (
        <rect
          key={i}
          x={xy([-0.12, 0, 0])[0]}
          y={xy([0, -0.84 + i * 0.4, 0])[1] - 0.075 * scale}
          width={0.24 * scale}
          height={0.15 * scale}
          rx="2"
          fill="#b6d2c9"
        />
      ))}
      {g.negative.map((p, i) => (
        <g key={i}>
          <path d={path([[-1.25, p[1], 0], p])} stroke="#657474" strokeWidth="1.5" />
          {[-0.08, 0, 0.08].map((q) => (
            <line
              key={q}
              x1={xy([p[0] - 0.13, p[1] + q, 0])[0]}
              x2={xy([p[0] + 0.13, p[1] + q, 0])[0]}
              y1={xy([0, p[1] + q, 0])[1]}
              y2={xy([0, p[1] + q, 0])[1]}
              stroke="#475860"
              strokeWidth="2.5"
            />
          ))}
        </g>
      ))}
      {g.positive.map((p, i) => (
        <g key={i}>
          <path d={path([[1.25, p[1], 0], p])} stroke="#657474" strokeWidth="1.5" />
          <circle cx={xy(p)[0]} cy={xy(p)[1]} r={0.155 * scale} fill="#85a58e" stroke="#5c857a" />
        </g>
      ))}
      <path
        d={path([
          [-1.25, -1.25, 0],
          [-1.25, 1.5, 0],
        ])}
        stroke="#b4815e"
        strokeWidth="4"
      />
      <path
        d={path([
          [1.25, -1.25, 0],
          [1.25, 1.5, 0],
        ])}
        stroke="#8ba7b0"
        strokeWidth="4"
      />
      <path
        d={path(g.external)}
        fill="none"
        stroke="#6b9195"
        strokeWidth="2.7"
        strokeLinejoin="round"
      />
      <rect
        x={port[0] - 0.34 * scale}
        y={port[1] - 0.16 * scale}
        width={0.68 * scale}
        height={0.32 * scale}
        rx="5"
        fill={shot.state.current < 0 ? '#76aaa1' : '#a8b7a2'}
      />
      <text x={port[0]} y={port[1] + 6} textAnchor="middle">
        e⁻
      </text>
      <path d={path(hero.ionPath)} stroke="#be984b" strokeWidth="1.5" fill="none" />
      {Array.from({ length: 18 }, (_, i) => {
        const m = lithiumTracer(i, shot.state.soc);
        return (
          <g key={i}>
            <circle cx={xy(m.ion)[0]} cy={xy(m.ion)[1]} r={i === 0 ? 5.5 : 3} fill="#c59b43" />
            {m.moving && (
              <circle
                cx={xy(m.electron)[0]}
                cy={xy(m.electron)[1]}
                r={i === 0 ? 5 : 3}
                fill="#377e99"
              />
            )}
          </g>
        );
      })}
      <circle
        cx={xy(hero.ion)[0]}
        cy={xy(hero.ion)[1]}
        r="9"
        stroke="#c59b43"
        strokeWidth="1.5"
        fill="none"
      />
      <text x="0" y={height - (detail ? 43 : 62)}>
        Li⁺
      </text>
      <text x={width} y={height - (detail ? 43 : 62)} textAnchor="end">
        {t('固定身份 · 可逆路径')}
      </text>
      {detail && (
        <text x={width / 2} y={height - 9} textAnchor="middle">
          {t('隔膜阻断电子。')}
        </text>
      )}
    </svg>
  );
}
export function LithiumInventory({ shot, width }: { shot: LithiumShot; width: number }) {
  const n = shot.values.inventory,
    rows = [
      { label: '石墨中的锂', fraction: n.x, symbol: 'x', color: '#758885' },
      { label: 'LFP 中的锂', fraction: n.y, symbol: 'y', color: '#b3aa75' },
    ];
  return (
    <svg
      width={width}
      height="155"
      viewBox={`0 0 ${width} 155`}
      role="img"
      aria-label={t('两个宿主的平均含锂比例，总锂量守恒')}
    >
      {rows.map((r, i) => (
        <g key={r.symbol}>
          <text x="0" y={22 + i * 65}>
            {t(r.label)}
          </text>
          <text x={width} y={22 + i * 65} textAnchor="end">
            {r.symbol} = {r.fraction.toFixed(3)}
          </text>
          <rect x="0" y={34 + i * 65} width={width} height="15" rx="7.5" fill="#e2e5d9" />
          <rect
            x="0"
            y={34 + i * 65}
            width={width * r.fraction}
            height="15"
            rx="7.5"
            fill={r.color}
          />
        </g>
      ))}
      <text x="0" y="150">
        x + y = {(n.x + n.y).toFixed(3)}
      </text>
      <text x={width} y="150" textAnchor="end">
        {t('总量不变')}
      </text>
    </svg>
  );
}
export function LithiumPower({ shot, width }: { shot: LithiumShot; width: number }) {
  const a = shot.values,
    max = Math.max(3.7, a.ocv, a.voltage),
    scale = (width - 4) / max,
    drop = Math.abs(a.ocv - a.voltage);
  return (
    <svg
      className="lb-power"
      width={width}
      height="172"
      viewBox={`0 0 ${width} 172`}
      role="img"
      aria-label={t('开路电压与端电压，差值由内阻和极化决定')}
    >
      <text x="0" y="22">
        {t('开路近似')}
      </text>
      <text x={width} y="22" textAnchor="end">
        {a.ocv.toFixed(3)} V
      </text>
      <rect x="0" y="35" width={a.ocv * scale} height="18" rx="5" fill="#98aaa1" />
      <text x="0" y="86">
        {t('端电压')}
      </text>
      <text x={width} y="86" textAnchor="end">
        {a.voltage.toFixed(3)} V
      </text>
      <rect x="0" y="99" width={Math.max(0, a.voltage) * scale} height="18" rx="5" fill="#56899b" />
      <rect
        x={Math.min(a.ocv, a.voltage) * scale}
        y="99"
        width={drop * scale}
        height="18"
        fill="#c2a061"
      />
      <text x="0" y="157">
        {t('内阻压降')} {Math.abs(a.ohmicDrop).toFixed(3)} V
      </text>
      <text x={width} y="157" textAnchor="end">
        p = {a.polarizationDrop.toFixed(3)} V
      </text>
    </svg>
  );
}
export function LithiumRest({ shot, width }: { shot: LithiumShot; width: number }) {
  const samples = useMemo(
      () =>
        Array.from({ length: 61 }, (_, i) =>
          lithiumReadout(lithiumAdvance(shot.before, 0, (shot.span * i) / 60)),
        ),
      [shot.before.soc, shot.before.polarization, shot.span],
    ),
    minimum = Math.floor(Math.min(...samples.map((s) => s.voltage)) * 50) / 50,
    maximum = Math.ceil(samples[0].ocv * 50) / 50 + 0.01,
    left = 42,
    right = width - 9,
    top = 48,
    bottom = 200,
    x = (time: number) => left + ((right - left) * time) / (shot.span || 1),
    y = (voltage: number) => bottom - ((bottom - top) * (voltage - minimum)) / (maximum - minimum),
    d = samples
      .map((s, i) => `${i ? 'L' : 'M'}${x((shot.span * i) / 60)},${y(s.voltage)}`)
      .join(' '),
    now = shot.values,
    initial = lithiumReadout(shot.before);
  return (
    <svg
      width={width}
      height="363"
      viewBox={`0 0 ${width} 363`}
      role="img"
      aria-label={t('休息时端电压回升，荷电状态不增加，极化储能转为热')}
    >
      <text x="0" y="22">
        {t('休息时的电压')} / V
      </text>
      {[minimum, (minimum + maximum) / 2, maximum].map((tick) => (
        <g key={tick}>
          <text x="0" y={y(tick) + 5}>
            {tick.toFixed(2)}
          </text>
          <line x1={left} x2={right} y1={y(tick)} y2={y(tick)} stroke="#dce2d6" />
        </g>
      ))}
      <line
        x1={left}
        x2={right}
        y1={y(now.ocv)}
        y2={y(now.ocv)}
        stroke="#93a699"
        strokeDasharray="4 5"
      />
      <path d={d} stroke="#54879b" strokeWidth="3" fill="none" />
      <circle
        cx={x(Math.min(shot.span, shot.localTime))}
        cy={y(now.voltage)}
        r="5"
        fill="#c49e50"
      />
      <text x={left} y="225">
        0
      </text>
      <text x={right} y="225" textAnchor="end">
        {shot.span} s
      </text>
      <text x="0" y="270">
        SOC
      </text>
      <text x={width} y="270" textAnchor="end">
        {(shot.state.soc * 100).toFixed(2)}% → {(shot.state.soc * 100).toFixed(2)}%
      </text>
      <text x="0" y="310">
        {t('极化储能')}
      </text>
      <text x={width} y="310" textAnchor="end">
        {now.polarizationEnergy.toFixed(2)} J
      </text>
      <text x="0" y="350">
        {t('休息释放的热')}
      </text>
      <text x={width} y="350" textAnchor="end">
        {Math.max(0, initial.polarizationEnergy - now.polarizationEnergy).toFixed(2)} J
      </text>
    </svg>
  );
}
export function LithiumLedger({
  shot,
  width,
  initialSoc = 0.85,
}: {
  shot: LithiumShot;
  width: number;
  initialSoc?: number;
}) {
  const initial = lithiumChemicalEnergy(initialSoc),
    s = shot.state,
    v = shot.values,
    total = initial + s.energyIn,
    stored = v.chemicalEnergy + v.polarizationEnergy,
    rows = [
      { label: '初始储能 + 充入', value: total, color: '#789e98' },
      { label: '仍储存在电芯', value: stored, color: '#8fa27c' },
      { label: '输出到外部', value: s.energyOut, color: '#51849a' },
      { label: '内部累计放热', value: s.heat, color: '#ba985e' },
    ];
  return (
    <svg
      width={width}
      height="272"
      viewBox={`0 0 ${width} 272`}
      role="img"
      aria-label={t('输入、输出、储存和内部热量的完整能量账目')}
    >
      {rows.map((r, i) => (
        <g key={r.label}>
          <text x="0" y={22 + i * 63}>
            {t(r.label)}
          </text>
          <text x={width} y={22 + i * 63} textAnchor="end">
            {(r.value / 3600).toFixed(3)} Wh
          </text>
          <rect x="0" y={32 + i * 63} width={width} height="11" rx="5" fill="#e0e5d8" />
          <rect
            x="0"
            y={32 + i * 63}
            width={total > 0 ? (width * r.value) / total : 0}
            height="11"
            rx="5"
            fill={r.color}
          />
        </g>
      ))}
      <text x="0" y="269">
        {t('输入 = 储存 + 输出 + 热')}
      </text>
    </svg>
  );
}
