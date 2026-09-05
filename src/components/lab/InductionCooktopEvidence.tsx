import { t } from '../../i18n';
import {
  INDUCTION as G,
  inductionDepthLoss,
  inductionGeometry,
  inductionBounds,
  inductionThermalAdvance,
  inductionThermalProgram,
  type InductionPoint,
  type InductionShot,
} from '../../models/induction-cooktop';
export function InductionCooktopFlat({ shot, width }: { shot: InductionShot; width: number }) {
  const g = inductionGeometry(shot.input.lift),
    height = width < 680 ? (shot.view === 'skin' ? 210 : 270) : 380;
  const project = ([x, y, z]: InductionPoint) => [x - 0.32 * z, -y + 0.58 * z];
  const bounds = inductionBounds(shot.input.lift, shot.view === 'flux').map(project);
  const xs = bounds.map((p) => p[0]),
    ys = bounds.map((p) => p[1]),
    left = Math.min(...xs),
    right = Math.max(...xs),
    top = Math.min(...ys),
    bottom = Math.max(...ys);
  const scale = Math.min((width - 20) / (right - left), (height - 132) / (bottom - top));
  const xy = (point: InductionPoint) => {
    const p = project(point);
    return [
      width / 2 + (p[0] - (left + right) / 2) * scale,
      45 + (height - 132) / 2 + (p[1] - (top + bottom) / 2) * scale,
    ];
  };
  const path = (ps: InductionPoint[], closed = false) =>
    ps.map((p, i) => `${i ? 'L' : 'M'}${xy(p)}`).join(' ') + (closed ? 'Z' : '');
  const base = Array.from({ length: 65 }, (_, i): InductionPoint => [
    G.panRadius * Math.cos((i / 64) * 2 * Math.PI),
    g.panBottom,
    G.panRadius * Math.sin((i / 64) * 2 * Math.PI),
  ]);
  const glass: InductionPoint[] = [
    [-0.14, G.glassTop, -0.125],
    [0.14, G.glassTop, -0.125],
    [0.14, G.glassTop, 0.125],
    [-0.14, G.glassTop, 0.125],
  ];
  const p = xy([0, g.panBottom + 0.025, 0]);
  return (
    <svg
      className="ic-flat"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('二维电磁炉：同一闭合线圈、锅底回路和真实间距')}
    >
      <path d={path(g.supply)} stroke="#8d6c49" fill="none" strokeWidth="2" />
      <path d={path(g.returnPath)} stroke="#8d6c49" fill="none" strokeWidth="2" />
      <path d={path(g.spiral)} stroke="#ac714f" fill="none" strokeWidth="2.2" />
      <path d={path(glass, true)} fill="#9cbdba" fillOpacity=".17" stroke="#769e99" />
      <path d={path(base, true)} fill="#bbc0b5" fillOpacity=".3" stroke="#788e80" />
      <path
        d={path(g.loop)}
        stroke="#328497"
        strokeWidth="3"
        fill="none"
        strokeOpacity={shot.on ? 1 : 0.25}
      />
      <path d={path([g.terminalB, g.terminalA])} stroke="#d8cbb0" strokeWidth="18" />
      <path d={path([g.terminalB, g.terminalA])} stroke="#556e65" strokeWidth="1.5" />
      <text x="0" y="25">
        {t('闭合线圈 · 玻璃 · 锅底')}
      </text>
      <text x="0" y={height - 60}>
        {t('等效涡流回路')}
      </text>
      {shot.view === 'flux' && (
        <g>
          <line
            x1={p[0]}
            x2={p[0]}
            y1={p[1] - 24}
            y2={p[1] + 24}
            stroke="#4b8d9c"
            strokeWidth="2"
          />
          <text x={p[0] + 8} y={p[1] - 20}>
            Φ
          </text>
        </g>
      )}
    </svg>
  );
}
export function InductionSkinPlot({ shot, width }: { shot: InductionShot; width: number }) {
  const r = shot.response,
    limit = r.skin.depth < 0.001 ? 0.001 : G.panThickness,
    left = 14,
    right = width - 17,
    top = 42,
    bottom = 150,
    max = inductionDepthLoss(r, 0);
  const x = (z: number) => left + (z / limit) * (right - left),
    y = (q: number) => bottom - (bottom - top) * q;
  const d = Array.from({ length: 97 }, (_, i) => {
    const z = (limit * i) / 96;
    return `${i ? 'L' : 'M'}${x(z)},${y(max > 0 ? inductionDepthLoss(r, z) / max : 0)}`;
  }).join(' ');
  return (
    <svg
      className="ic-skin"
      width={width}
      height="208"
      viewBox={`0 0 ${width} 208`}
      role="img"
      aria-label={t('从锅底入射面向内的归一化周期平均电损耗密度')}
    >
      <text x="0" y="20">
        {t('电损耗沿深度衰减')}
      </text>
      <path d={`${d}L${right},${bottom}L${left},${bottom}Z`} fill="#c38d50" fillOpacity=".14" />
      <path d={d} stroke="#b8783d" strokeWidth="2.5" fill="none" />
      <line x1={left} x2={right} y1={bottom} y2={bottom} stroke="#94a79c" />
      <line
        x1={x(Math.min(limit, r.skin.depth))}
        x2={x(Math.min(limit, r.skin.depth))}
        y1={top}
        y2={bottom}
        stroke="#3a8795"
        strokeDasharray="3 4"
      />
      {[0, 0.5, 1].map((q) => (
        <text
          key={q}
          x={x(limit * q)}
          y="176"
          textAnchor={q === 0 ? 'start' : q === 1 ? 'end' : 'middle'}
        >
          {(limit * q * 1000).toFixed(1)}
        </text>
      ))}
      <text x="0" y="203">
        δ = {(r.skin.depth * 1000).toFixed(3)} mm
      </text>
      <text x={width} y="203" textAnchor="end">
        {t('深度')} / mm
      </text>
    </svg>
  );
}
export function InductionFluxReadout({ shot, width }: { shot: InductionShot; width: number }) {
  const z = shot.instant,
    rows = [
      { name: 'Φ', value: z.flux * 1e6, unit: 'µWb', max: 65 },
      { name: '−dΦ/dt', value: z.emf, unit: 'V', max: 10 },
      { name: 'i₂', value: z.i2, unit: 'A', max: 210 },
    ];
  return (
    <svg
      className="ic-flux"
      width={width}
      height="165"
      viewBox={`0 0 ${width} 165`}
      role="img"
      aria-label={t('磁通、感应电动势与锅底等效电流的相位关系')}
    >
      {rows.map((r, i) => {
        const y = 23 + i * 51,
          mid = width / 2;
        return (
          <g key={r.name}>
            <text x="0" y={y}>
              {r.name}
            </text>
            <text x={width} y={y} textAnchor="end">
              {r.value.toFixed(1)} {r.unit}
            </text>
            <line x1="10" x2={width - 10} y1={y + 14} y2={y + 14} stroke="#c9d2c5" />
            <line x1={mid} x2={mid} y1={y + 9} y2={y + 19} stroke="#8ba091" />
            <line
              x1={mid}
              x2={mid + Math.max(-1, Math.min(1, r.value / r.max)) * (width / 2 - 12)}
              y1={y + 14}
              y2={y + 14}
              stroke={i === 2 ? '#b07a45' : '#4a8994'}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}
export function InductionDutyPlot({ shot, width }: { shot: InductionShot; width: number }) {
  const duration = 24,
    start = shot.time > 24 ? Math.floor((shot.time - 1e-9) / 24) * 24 : 0,
    pad = 8,
    x = (time: number) => pad + ((width - 2 * pad) * time) / duration;
  return (
    <svg
      className="ic-duty"
      width={width}
      height="92"
      viewBox={`0 0 ${width} 92`}
      role="img"
      aria-label={t('四秒包络中的通电与停顿，载波周期另行慢放')}
    >
      <text x="0" y="20">
        {t('通电')} {Math.round(shot.input.duty * 100)}%
      </text>
      <text x={width} y="20" textAnchor="end">
        {shot.time.toFixed(1)} s
      </text>
      {Array.from({ length: 6 }, (_, i) => (
        <rect
          key={i}
          x={x(i * 4)}
          y="37"
          width={Math.max(0, x(4 * shot.input.duty) - pad)}
          height="26"
          rx="3"
          fill="#b6854c"
          fillOpacity=".7"
        />
      ))}
      <line
        x1={x(shot.time - start)}
        x2={x(shot.time - start)}
        y1="31"
        y2="76"
        stroke="#426f76"
        strokeWidth="2"
      />
      <line x1={pad} x2={width - pad} y1="64" y2="64" stroke="#859b8e" />
    </svg>
  );
}
export function InductionThermalView({ shot, width }: { shot: InductionShot; width: number }) {
  const cooling = shot.view === 'cooling',
    duration = cooling ? 240 : Math.max(180, shot.time),
    r = shot.response,
    warm = inductionThermalProgram(shot.input, 180, r);
  const samples = Array.from({ length: 61 }, (_, i) => {
    const time = (duration * i) / 60;
    return cooling
      ? inductionThermalAdvance(shot.input, warm, 0, time)
      : inductionThermalProgram(shot.input, time, r);
  });
  const topTemp =
    Math.ceil(Math.max(50, ...samples.map((p) => p.pan), ...samples.map((p) => p.glass)) / 10) * 10;
  const x = (time: number) => 28 + ((width - 46) * time) / duration,
    y = (temp: number) => 365 - ((temp - 20) / (topTemp - 20)) * 128;
  const curve = (key: 'pan' | 'glass') =>
    samples.map((p, i) => `${i ? 'L' : 'M'}${x((duration * i) / 60)},${y(p[key])}`).join(' ');
  const glow = Math.max(0, Math.min(1, (shot.thermal.pan - 20) / 60)),
    glassGlow = Math.max(0, Math.min(1, (shot.thermal.glass - 20) / 60));
  return (
    <svg
      className="ic-thermal"
      width={width}
      height="426"
      viewBox={`0 0 ${width} 426`}
      role="img"
      aria-label={t('锅与玻璃的温度、相互传热及加热或冷却曲线')}
    >
      <rect x="10" y="24" width={width - 20} height="44" rx="12" fill="#d4d1be" />
      <rect x="10" y="24" width={width - 20} height="44" rx="12" fill="#c79054" opacity={glow} />
      <text x="22" y="52">
        {t('锅体')}
      </text>
      <text x={width - 22} y="52" textAnchor="end">
        {shot.thermal.pan.toFixed(1)} °C
      </text>
      <line
        x1={width / 2}
        x2={width / 2}
        y1="77"
        y2="105"
        stroke="#ae8552"
        strokeWidth={2 + Math.min(6, Math.abs(shot.heat.toGlass) / 10)}
        strokeLinecap="round"
      />
      {Math.abs(shot.heat.toGlass) > 0.01 && (
        <path
          d={
            shot.heat.toGlass > 0 ? `M${width / 2 - 5} 99l5 7 5-7` : `M${width / 2 - 5} 83l5-7 5 7`
          }
          stroke="#ae8552"
          fill="none"
          strokeWidth="2"
        />
      )}
      <text x={width - 5} y="94" textAnchor="end">
        {shot.heat.toGlass.toFixed(1)} W
      </text>
      <rect x="10" y="119" width={width - 20} height="37" rx="10" fill="#c2d9d3" />
      <rect
        x="10"
        y="119"
        width={width - 20}
        height="37"
        rx="10"
        fill="#d0aa74"
        opacity={glassGlow}
      />
      <text x="22" y="145">
        {t('玻璃')}
      </text>
      <text x={width - 22} y="145" textAnchor="end">
        {shot.thermal.glass.toFixed(1)} °C
      </text>
      <text x="0" y="194">
        {t('储存的热量')}
      </text>
      <text x={width} y="194" textAnchor="end">
        {(shot.heat.energy / 1000).toFixed(1)} kJ
      </text>
      {[20, (20 + topTemp) / 2, topTemp].map((temp) => (
        <g key={temp}>
          <line x1="28" x2={width - 18} y1={y(temp)} y2={y(temp)} stroke="#cad3c6" />
          <text x="0" y={y(temp) + 5}>
            {temp.toFixed(0)}
          </text>
        </g>
      ))}
      <path d={curve('pan')} fill="none" stroke="#b27e47" strokeWidth="2.5" />
      <path d={curve('glass')} fill="none" stroke="#4f9293" strokeWidth="2.5" />
      <line
        x1={x(Math.min(duration, shot.time))}
        x2={x(Math.min(duration, shot.time))}
        y1="229"
        y2="365"
        stroke="#879886"
        strokeDasharray="3 5"
      />
      <circle cx={x(Math.min(duration, shot.time))} cy={y(shot.thermal.pan)} r="4" fill="#b27e47" />
      <circle
        cx={x(Math.min(duration, shot.time))}
        cy={y(shot.thermal.glass)}
        r="4"
        fill="#4f9293"
      />
      <text x="28" y="391">
        0
      </text>
      <text x={width - 18} y="391" textAnchor="end">
        {duration} s
      </text>
      <text x="0" y="420">
        {t('棕色：锅体；蓝色：玻璃')}
      </text>
    </svg>
  );
}
