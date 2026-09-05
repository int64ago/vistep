import { useId } from 'react';
import { t } from '../../i18n';
import {
  solarCellGeometry as g,
  solarCellCurve,
  solarCellParameters,
  type SolarCellShot,
  type SolarCellXY,
} from '../../models/solar-cell';

export function SolarCellThresholdView({
  shot,
  compact,
}: {
  shot: SolarCellShot;
  compact: boolean;
}) {
  const width = compact ? 320 : 760,
    height = compact ? 440 : 360;
  const mono = shot.config.spectrum === 'mono',
    bands = mono ? [shot.threshold[0]] : shot.threshold;
  return (
    <svg
      className="solar-cell-threshold"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('逐个光子的带隙门槛与热化能量')}
    >
      <text x={compact ? 18 : 24} y="28" className="solar-cell-svg-label">
        {t('带隙')} E<tspan baselineShift="sub">g</tspan> = {shot.p.optical.eg.toFixed(3)} eV
      </text>
      {bands.map((band, i) => {
        const x = compact ? 16 : 24 + i * 250,
          y = compact ? 50 + i * 125 : 66;
        const energyWidth = ((compact ? 154 : 190) * band.energy) / 3.55;
        const gapWidth = ((compact ? 154 : 190) * band.eg) / 3.55;
        const px = x + (compact ? 231 : 105),
          py = y + (compact ? 15 : 117);
        const photonY = band.photon ? py + (band.photon.y + 0.5) * (compact ? 56 : 93) : py + 48;
        const impactY = py + 0.8 * (compact ? 56 : 93);
        return (
          <g key={i}>
            <text x={x} y={y + 18} className="solar-cell-svg-number">
              {band.energy.toFixed(2)} eV
            </text>
            <rect x={x} y={y + 34} width={energyWidth} height="13" rx="4" fill="#cf9340" />
            {band.energy > band.eg && (
              <rect
                x={x + gapWidth}
                y={y + 34}
                width={energyWidth - gapWidth}
                height="13"
                fill="#b66652"
              />
            )}
            <path d={`M${x + gapWidth} ${y + 29}v23`} stroke="#314e67" strokeWidth="2" />
            <path
              d={`M${px} ${py}V${py + (compact ? 94 : 146)}`}
              stroke="#c8c3b4"
              strokeWidth="2"
              strokeDasharray="3 5"
            />
            <path d={`M${px - 25} ${impactY}h50`} stroke="#7f9ead" strokeWidth="8" opacity=".35" />
            {band.photon && (
              <g>
                <circle cx={px} cy={photonY} r="12" fill="#e4b654" opacity=".16" />
                <circle cx={px} cy={photonY} r="5" fill="#ba7d22" />
              </g>
            )}
            {band.pairs > 0 && (
              <g>
                <circle cx={px - 12} cy={impactY} r="9" fill="#3c7091" />
                <circle cx={px + 12} cy={impactY} r="9" fill="#b26f50" />
                <path
                  d={`M${px - 16} ${impactY}h8M${px + 8} ${impactY}h8M${px + 12} ${impactY - 4}v8`}
                  stroke="#fffaf1"
                  strokeWidth="1.5"
                />
              </g>
            )}
            <text x={x} y={y + (compact ? 76 : 235)} className="solar-cell-svg-label">
              {band.pairs ? t('一对电荷') : band.transmitted ? t('穿过电池') : t('光子入射')}
            </text>
            {band.pairs > 0 && (
              <text
                x={x}
                y={y + (compact ? 103 : 265)}
                className="solar-cell-svg-label solar-cell-heat"
              >
                {t('热化')} {band.thermalized.toFixed(2)} eV
              </text>
            )}
            {!band.eligible && band.transmitted > 0 && (
              <text x={x} y={y + (compact ? 103 : 265)} className="solar-cell-svg-label">
                {t('不产生电荷对')}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function SolarCellJunction({ shot, compact }: { shot: SolarCellShot; compact: boolean }) {
  const id = useId().replace(/:/g, ''),
    w = compact ? 320 : 540,
    h = compact ? 424 : 400;
  const sx = compact ? 170 : 300,
    sy = compact ? 165 : 185,
    ox = compact ? 28 : 34,
    oy = compact ? 149 : 124;
  const xy = (p: SolarCellXY) => ({ x: ox + p.x * sx, y: oy + p.y * sy });
  const path = (points: SolarCellXY[]) =>
    points.map((p, i) => `${i ? 'L' : 'M'}${xy(p).x},${xy(p).y}`).join(' ');
  const e = shot.episode,
    selected = ['pair', 'circuit'].includes(shot.focus),
    abs = xy(g.absorption);
  const ep = xy(g.front),
    rear = xy(g.rear);
  return (
    <svg
      className="solar-cell-junction"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('太阳能电池层截面与连续外电路')}
    >
      <defs>
        <linearGradient id={`${id}-n`} x2="0" y2="1">
          <stop stopColor="#789caf" />
          <stop offset="1" stopColor="#4e748d" />
        </linearGradient>
        <linearGradient id={`${id}-p`} x2="0" y2="1">
          <stop stopColor="#cba58c" />
          <stop offset="1" stopColor="#b87e5d" />
        </linearGradient>
      </defs>
      <text x={ox} y="25" className="solar-cell-svg-label">
        {t('层厚与运动时间示意')}
      </text>
      {selected && (
        <text x={ox} y="53" className="solar-cell-svg-label">
          {t('跟住一个被吸收的光子')}
        </text>
      )}
      <rect x={ox} y={oy} width={sx} height={sy} rx="5" fill={`url(#${id}-p)`} />
      <path d={`M${ox} ${oy}h${sx}v${sy * 0.2}h${-sx}Z`} fill={`url(#${id}-n)`} />
      <rect x={ox} y={oy + sy * 0.2} width={sx} height={sy * 0.12} fill="#ece2bb" />
      <path d={`M${ox} ${oy - 4}h${sx}`} stroke="#9ebbbc" strokeWidth="7" />
      <path d={`M${ep.x - 14} ${oy}h28M${ox} ${oy + sy}h${sx}`} stroke="#586471" strokeWidth="8" />
      <path
        d={path(g.external)}
        stroke="#59636c"
        strokeWidth="4"
        fill="none"
        strokeLinejoin="round"
      />
      <path d={`M${rear.x} ${rear.y}V${oy + sy}`} stroke="#59636c" strokeWidth="5" />
      <text
        x={ox + 8}
        y={oy + sy * 0.15}
        className="solar-cell-svg-label"
        style={{ fill: '#faf5e9' }}
      >
        n
      </text>
      <text x={ox + 8} y={oy + sy * 0.78} className="solar-cell-svg-label" fill="#432e27">
        p
      </text>
      <text x={ep.x + 9} y={oy - 15} className="solar-cell-svg-label">
        −
      </text>
      <text x={rear.x + 15} y={oy + sy + 29} className="solar-cell-svg-label">
        +
      </text>
      {[0.16, 0.32, 0.62, 0.78].map((x) => (
        <g key={x} stroke="#726944" strokeWidth="1.1">
          <path
            d={`M${ox + x * sx - 3} ${oy + 0.235 * sy}h6M${ox + x * sx} ${oy + 0.235 * sy - 3}v6M${ox + x * sx - 3} ${oy + 0.29 * sy}h6`}
          />
        </g>
      ))}
      <path
        d={`M${ox + 0.89 * sx} ${oy + 0.2 * sy}v${0.11 * sy}m-4 -5l4 5 4-5`}
        stroke="#705a38"
        strokeWidth="2"
        fill="none"
      />
      <text x={ox + 0.98 * sx + 4} y={oy + 0.3 * sy + 4} className="solar-cell-svg-label">
        E
      </text>
      <text x={ox + 1.45 * sx} y={oy + 0.55 * sy} className="solar-cell-svg-label">
        R
      </text>
      <text x={ox} y={h - 28} className="solar-cell-svg-label">
        {t('电子')} − <tspan fill="#a96946">　{t('空穴')} +</tspan>
      </text>
      {selected && (
        <>
          <path
            d={path(e.photonPath)}
            stroke="#c29237"
            strokeWidth="2"
            strokeDasharray="3 5"
            opacity=".45"
            fill="none"
          />
          {e.absorbed && (
            <>
              <path
                d={path(e.electronPath)}
                stroke="#376c91"
                strokeWidth="2"
                strokeDasharray="3 4"
                fill="none"
              />
              <path
                d={path(e.holePath)}
                stroke="#fff2ba"
                strokeWidth="2"
                strokeDasharray="3 4"
                fill="none"
              />
            </>
          )}
          {e.photon && (
            <g>
              <circle
                {...{ cx: xy(e.photon).x, cy: xy(e.photon).y }}
                r="14"
                fill="#d8a645"
                opacity=".15"
              />
              <circle cx={xy(e.photon).x} cy={xy(e.photon).y} r="5" fill="#ba7d22" />
            </g>
          )}
          {e.absorbed && (
            <circle
              cx={abs.x}
              cy={abs.y}
              r="17"
              fill="#eac158"
              opacity={Math.max(0, 0.5 - (e.progress - 0.2) * 2)}
            />
          )}
          {e.carriers.map((c) => (
            <g key={c.id}>
              <circle
                cx={xy(c.position).x}
                cy={xy(c.position).y}
                r="10"
                fill={c.charge < 0 ? '#285d86' : '#fff2b4'}
                stroke={c.charge < 0 ? '#e0edf0' : '#9d6346'}
                strokeWidth="1.5"
              />
              <path
                d={`M${xy(c.position).x - 4} ${xy(c.position).y}h8${c.charge > 0 ? `M${xy(c.position).x} ${xy(c.position).y - 4}v8` : ''}`}
                stroke={c.charge < 0 ? 'white' : '#865630'}
                strokeWidth="1.5"
              />
            </g>
          ))}
          {e.complete && (
            <circle
              cx={xy(e.route === 'external' ? g.rear : { x: 0.49, y: 0.65 }).x}
              cy={xy(e.route === 'external' ? g.rear : { x: 0.49, y: 0.65 }).y}
              r="13"
              stroke="#b48c40"
              fill="none"
              strokeWidth="2"
            />
          )}
        </>
      )}
      {!compact && (
        <>
          <text x="390" y="352" className="solar-cell-svg-label">
            {t('外电路')}
          </text>
          <path d="M420 306v-35m-5 7 5-7 5 7" stroke="#a4783c" strokeWidth="2" fill="none" />
          <text x="437" y="292" className="solar-cell-svg-label">
            I
          </text>
        </>
      )}
    </svg>
  );
}

export function SolarCellIV({ shot, compact }: { shot: SolarCellShot; compact: boolean }) {
  const w = compact ? 320 : 600,
    h = compact ? 398 : 390,
    l = compact ? 43 : 55,
    r = w - 24,
    top = 48,
    bottom = compact ? 301 : 294;
  const maxI = Math.max(6, Math.ceil(shot.p.il / 2) * 2),
    maxV = 0.8;
  const x = (v: number) => l + ((r - l) * v) / maxV,
    y = (i: number) => bottom - ((bottom - top) * i) / maxI;
  const line = (points: typeof shot.curve) =>
    points.map((p, i) => `${i ? 'L' : 'M'}${x(p.voltage)},${y(p.current)}`).join(' ');
  const ghost = ['temperature', 'light'].includes(shot.focus)
    ? solarCellCurve(
        solarCellParameters({
          ...shot.config,
          irradiance: shot.focus === 'light' ? 1000 : shot.config.irradiance,
          temperature: 25,
        }),
      )
    : null;
  const { point, maximum: m } = shot;
  const resistance = shot.config.mode === 'short' ? 0 : shot.config.resistance;
  const loadEnd =
    shot.config.mode === 'open'
      ? { v: maxV, i: 0 }
      : resistance === 0
        ? { v: 0, i: maxI }
        : { v: Math.min(maxV, resistance * maxI), i: Math.min(maxI, maxV / resistance) };
  return (
    <svg
      className="solar-cell-iv"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={t('由单二极管方程求解的电流电压曲线与负载交点')}
    >
      <text x={l} y="25" className="solar-cell-svg-label">
        I / A
      </text>
      <text x={r} y="25" textAnchor="end" className="solar-cell-svg-label">
        Pₘₐₓ = {m.power.toFixed(2)} W
      </text>
      {[0, maxI / 2, maxI].map((i) => (
        <g key={i}>
          <path d={`M${l} ${y(i)}H${r}`} stroke="#d9d6ca" />
          <text x={l - 12} y={y(i) + 6} textAnchor="end" className="solar-cell-svg-label">
            {i}
          </text>
        </g>
      ))}
      {[0, 0.4, 0.8].map((v) => (
        <g key={v}>
          <path d={`M${x(v)} ${bottom}v5`} stroke="#82908c" />
          <text x={x(v)} y={bottom + 28} textAnchor="middle" className="solar-cell-svg-label">
            {v}
          </text>
        </g>
      ))}
      <rect
        x={l}
        y={y(point.current)}
        width={Math.max(0, x(point.voltage) - l)}
        height={Math.max(0, bottom - y(point.current))}
        fill="#dfbc6a"
        opacity=".26"
      />
      {ghost && (
        <path d={line(ghost)} stroke="#a9afaa" strokeWidth="2" strokeDasharray="5 5" fill="none" />
      )}
      <path
        d={`M${l} ${top - 5}V${bottom}H${r + 6}`}
        stroke="#61746f"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d={`M${l} ${bottom}L${x(loadEnd.v)} ${y(loadEnd.i)}`}
        stroke="#b37b40"
        strokeWidth="2"
        fill="none"
      />
      <path d={line(shot.curve)} stroke="#365e7a" strokeWidth="3" fill="none" />
      {shot.p.il > 0 && (
        <circle
          cx={x(m.voltage)}
          cy={y(m.current)}
          r="6"
          fill="#f6f0df"
          stroke="#446b77"
          strokeWidth="2"
        />
      )}
      <circle
        cx={x(point.voltage)}
        cy={y(point.current)}
        r="8"
        fill="#b87330"
        stroke="#fff9e8"
        strokeWidth="2"
      />
      <text x={r} y={bottom + 58} textAnchor="end" className="solar-cell-svg-label">
        V / V
      </text>
      <text x={l} y={h - 14} className="solar-cell-svg-label">
        {ghost
          ? shot.focus === 'light'
            ? t('虚线：满光照')
            : t('虚线：25°C')
          : t('空心点：最大功率')}
      </text>
    </svg>
  );
}

export function SolarCellLedger({ shot }: { shot: SolarCellShot }) {
  const i = shot.items;
  const rows = [
    { label: '未吸收', value: i.reflection + i.transmission, color: '#a2aaa2' },
    { label: '光子热化', value: i.thermalization, color: '#c68f58' },
    {
      label: '电荷复合',
      value: i.collectionRecombination + i.junctionRecombination,
      color: '#b9765f',
    },
    { label: '结电压能量差', value: i.voltageDeficit, color: '#9a8b74' },
    { label: '并联漏电', value: i.shunt, color: '#86998c' },
    { label: '串联发热', value: i.series, color: '#bd734b' },
    { label: '负载输出', value: i.output, color: '#416c7f' },
  ];
  return (
    <div className="solar-cell-ledger" aria-label={t('单电池稳态能量账本')}>
      <div className="solar-cell-ledger-total">
        <span>{t('入射光功率')}</span>
        <strong>{shot.incident.toFixed(2)} W</strong>
      </div>
      {rows.map((row) => (
        <div className="solar-cell-ledger-row" key={row.label}>
          <span>{t(row.label)}</span>
          <output>{row.value.toFixed(2)} W</output>
          <i>
            <b
              style={{
                width: `${shot.incident ? (100 * row.value) / shot.incident : 0}%`,
                background: row.color,
              }}
            />
          </i>
        </div>
      ))}
      <p>{t('各项相加 = 入射光功率')}</p>
    </div>
  );
}

export function SolarCellEquivalent({ shot }: { shot: SolarCellShot }) {
  const mode = shot.config.mode;
  return (
    <svg
      className="solar-cell-equivalent"
      viewBox="0 0 420 270"
      role="img"
      aria-label={t('电流源、二极管和漏电支路共用同一对节点')}
    >
      <path
        d="M65 70H269M311 70h54v140H65V70M165 70v49m0 39v52M239 70v48m0 42v50"
        fill="none"
        stroke="#879286"
        strokeWidth="2"
      />
      <path
        d="M269 70l5-6 6 12 6-12 6 12 6-12 6 12 7-6M239 118l-6 6 12 6-12 6 12 6-12 6 6 12"
        stroke="#a6754d"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="65" cy="140" r="25" fill="#eee8d9" stroke="#738875" strokeWidth="2" />
      <path
        d="M65 153v-26m-6 7 6-7 6 7M150 120h30l-15 34ZM150 156h30"
        fill="none"
        stroke="#657e6d"
        strokeWidth="2"
      />
      {mode === 'open' ? (
        <>
          <path d="M365 116v45" stroke="#eee8d9" strokeWidth="7" />
          <path d="M365 116l-15 40" stroke="#879286" strokeWidth="2" />
          <circle cx="365" cy="161" r="3" fill="#879286" />
        </>
      ) : mode === 'load' ? (
        <rect
          x="355"
          y="119"
          width="20"
          height="40"
          rx="2"
          fill="#eee8d9"
          stroke="#a6754d"
          strokeWidth="2"
        />
      ) : null}
      <text x="65" y="49" textAnchor="middle" className="solar-cell-svg-label">
        I<tspan baselineShift="sub">L</tspan>
      </text>
      <text x="165" y="20" textAnchor="middle" className="solar-cell-svg-label">
        {t('复合')}
      </text>
      <text x="165" y="49" textAnchor="middle" className="solar-cell-svg-label">
        I<tspan baselineShift="sub">d</tspan>
      </text>
      <text x="239" y="49" textAnchor="middle" className="solar-cell-svg-label">
        R<tspan baselineShift="sub">sh</tspan>
      </text>
      <text x="290" y="49" textAnchor="middle" className="solar-cell-svg-label">
        R<tspan baselineShift="sub">s</tspan>
      </text>
      <text x="350" y="245" textAnchor="middle" className="solar-cell-svg-label">
        {mode === 'open' ? t('开路') : mode === 'short' ? t('短路') : t('负载')}
      </text>
      <text x="33" y="245" className="solar-cell-svg-label">
        I = I<tspan baselineShift="sub">L</tspan> − I<tspan baselineShift="sub">d</tspan> − I
        <tspan baselineShift="sub">sh</tspan>
      </text>
    </svg>
  );
}
