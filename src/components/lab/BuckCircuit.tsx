import { t } from '../../i18n';
import { buckCoilPoints, buckRoutePoint, type BuckSample } from '../../models/buck-converter';

export default function BuckCircuit({ sample, compact }: { sample: BuckSample; compact: boolean }) {
  const { state: s, mode, parameters: p, packetProgress } = sample;
  const source = compact ? 28 : 44,
    pivot = compact ? 65 : 130,
    contact = compact ? 95 : 180;
  const diode = compact ? 106 : 216,
    l0 = compact ? 122 : 250,
    l1 = compact ? 202 : 390;
  const cap = compact ? 224 : 458,
    load = compact ? 276 : 622,
    top = 82,
    bottom = 236;
  const width = compact ? 300 : 680;
  const coilPoints = buckCoilPoints(l0, l1, top);
  const color = mode === 'on' ? '#b56334' : mode === 'diode' ? '#287887' : '#78689a';
  const route: [number, number][] =
    mode === 'on'
      ? [
          [source, 156],
          [source, top],
          [l0, top],
          ...coilPoints,
          [load, top],
          [load, bottom],
          [source, bottom],
          [source, 156],
        ]
      : mode === 'diode'
        ? [
            [diode, bottom],
            [diode, top],
            [l0, top],
            ...coilPoints,
            [load, top],
            [load, bottom],
            [diode, bottom],
          ]
        : [
            [cap, 146],
            [cap, top],
            [load, top],
            [load, bottom],
            [cap, bottom],
            [cap, 160],
          ];
  const packet = buckRoutePoint(route, packetProgress);
  const coil = coilPoints.map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join(' ');
  const active = (part: string) =>
    (
      part === 'source'
        ? mode === 'on'
        : part === 'diode'
          ? mode === 'diode'
          : part === 'inductor'
            ? mode !== 'idle'
            : true
    )
      ? color
      : '#acb5b6';
  const currentArrow =
    s.ic >= 0 ? `M${cap - 12} 112v17m-4-5 4 5 4-5` : `M${cap - 12} 129v-17m-4 5 4-5 4 5`;
  return (
    <div className="buck-circuit">
      <div className="buck-circuit-status">
        <span style={{ color }}>
          {t(
            mode === 'on'
              ? '开关闭合 · 输入供能'
              : mode === 'diode'
                ? '开关断开 · 二极管续流'
                : '电感电流为零 · 电容供能',
          )}
        </span>
        <span className="buck-desktop-only">
          i<sub>L</sub> = {s.i.toFixed(2)} A
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${compact ? 245 : 274}`}
        role="img"
        aria-label={t('降压电路：输入、开关、续流二极管、电感、电容与电阻负载连接成闭合回路')}
      >
        <g
          fill="none"
          stroke="#bec7c7"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d={`M${source} 134V${top}H${pivot}M${contact} ${top}H${l0}M${l1} ${top}H${load}V132M${load} 196V${bottom}H${source}V178`}
          />
          <path
            d={`M${diode} ${top}V145M${diode} 177V${bottom}M${cap} ${top}V146M${cap} 160V${bottom}`}
          />
          <path d={coil} stroke={active('inductor')} strokeWidth="4" />
          <path
            d={`M${source} 134V${top}H${pivot}M${contact} ${top}H${diode}`}
            stroke={active('source')}
          />
          <path d={`M${diode} ${top}H${l0}M${l1} ${top}H${cap}`} stroke={active('inductor')} />
          <path d={`M${cap} ${top}H${load}V132M${load} 196V${bottom}H${cap}`} stroke={color} />
          <path d={`M${diode} ${top}V145M${diode} 177V${bottom}H${cap}`} stroke={active('diode')} />
          <path d={`M${source} 178V${bottom}H${diode}`} stroke={active('source')} />
          <path
            d={`M${pivot} ${top}L${contact} ${mode === 'on' ? top : top - 23}`}
            stroke={active('source')}
            strokeWidth="4"
          />
          <circle cx={pivot} cy={top} r="3" fill="#f8f6f0" />
          <circle cx={contact} cy={top} r="3" fill="#f8f6f0" />
          <circle cx={source} cy="156" r="22" stroke={active('source')} fill="#fffdf7" />
          <path
            d={`M${source - 5} 148h10m-5-5v10M${source - 5} 166h10`}
            stroke={active('source')}
            strokeWidth="2"
          />
          <path
            d={`M${diode - 12} 177H${diode + 12}L${diode} 149Z M${diode - 13} 145H${diode + 13}`}
            stroke={active('diode')}
            fill={mode === 'diode' ? '#dcebed' : '#f4f4ef'}
          />
          <path
            d={`M${cap - 15} 146H${cap + 15}M${cap - 15} 160H${cap + 15}`}
            stroke="#78689a"
            strokeWidth="4"
          />
          <path d={`M${cap} ${top}V146M${cap} 160V${bottom}`} stroke="#78689a" strokeWidth="2.5" />
          <rect x={load - 10} y="132" width="20" height="64" rx="3" stroke={color} fill="#fffdf7" />
          <path d={currentArrow} stroke="#78689a" strokeWidth="2" />
          {[diode, cap, load].map((x) => (
            <circle key={x} cx={x} cy={top} r="3.5" fill="#6c8286" stroke="none" />
          ))}
          {[diode, cap].map((x) => (
            <circle key={x} cx={x} cy={bottom} r="3.5" fill="#6c8286" stroke="none" />
          ))}
          <circle
            cx={packet[0]}
            cy={packet[1]}
            r="8"
            fill={color}
            stroke="#fffdf7"
            strokeWidth="3"
            opacity={Math.sin(Math.PI * packetProgress) ** 2 * 0.94}
          />
        </g>
        <g fill="#344c52" fontSize={compact ? 20 : 18} fontFamily="inherit" textAnchor="middle">
          <text x={source} y="211">
            {p.vin} V
          </text>
          <text x={(pivot + contact) / 2} y="43">
            S
          </text>
          <text x={(l0 + l1) / 2} y="43">
            L
          </text>
          <text x={diode - 24} y="165">
            D
          </text>
          <text x={cap + (compact ? -23 : 28)} y="181">
            C
          </text>
          <text x={load} y="120">
            R
          </text>
          {!compact && (
            <>
              <text x="337" y="120">
                {Math.round(p.inductance * 1e6)} µH
              </text>
              <text x={cap} y="268">
                {Math.round(p.capacitance * 1e6)} µF
              </text>
              <text x={load} y="268">
                {p.resistance} Ω
              </text>
            </>
          )}
        </g>
      </svg>
      <div className="buck-circuit-foot">
        <span>{t(compact ? '光点是能量示意，不是电子' : '光点按本段能量前进，不代表电子')}</span>
        <span className="buck-desktop-only">
          S · {Math.round(p.frequency / 1000)} kHz → {t('画面慢放')}
        </span>
      </div>
    </div>
  );
}
