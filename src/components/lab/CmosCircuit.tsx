import { t } from '../../i18n';
import { type CmosSample, type CmosShot } from '../../models/logic-gates';

const copper = '#a96d45',
  blue = '#3f859b',
  quiet = '#a9b8bb';
type DeviceState = CmosSample['network']['devices'][number];
function Mos({
  device,
  x,
  y,
  label = true,
}: {
  device: DeviceState;
  x: number;
  y: number;
  label?: boolean;
}) {
  const color = device.type === 'p' ? copper : blue;
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${x - 14} ${y - 14}V${y + 14}`} stroke={color} strokeWidth="2.5" />
      {device.type === 'p' && (
        <>
          <circle cx={x - 23} cy={y} r="4" fill="#f7f5ef" stroke={color} strokeWidth="2" />
          <path d={`M${x - 19} ${y}H${x - 14}`} stroke={color} strokeWidth="2" />
        </>
      )}
      <path
        d={`M${x} ${y - 16}V${y + 16}`}
        stroke={device.on ? color : quiet}
        strokeWidth={device.on ? 4 : 2.5}
        strokeDasharray={device.on ? undefined : '5 6'}
      />
      {label && (
        <text x={x + 13} y={y + 7} fill={device.on ? color : '#647b83'} fontSize="20" stroke="none">
          {device.id}
        </text>
      )}
    </g>
  );
}
function Capacitor({
  x,
  outputY,
  groundY,
  voltage,
  vdd,
}: {
  x: number;
  outputY: number;
  groundY: number;
  voltage: number;
  vdd: number;
}) {
  const topPlate = outputY + (groundY - outputY) * 0.39,
    bottomPlate = topPlate + 13;
  const h = Math.min(50, (groundY - outputY) * 0.25) * Math.max(0, Math.min(1, voltage / vdd));
  return (
    <g fill="none" stroke="#86759f" strokeWidth="2.5">
      <path
        d={`M${x} ${outputY}V${topPlate}M${x} ${bottomPlate}V${groundY}M${x - 12} ${topPlate}H${x + 12}M${x - 12} ${bottomPlate}H${x + 12}`}
      />
      <rect
        x={x - 23}
        y={groundY - 14 - h}
        width="7"
        height={h}
        rx="3"
        fill="#a291bf"
        stroke="none"
        opacity=".7"
      />
      <text
        x={x + 15}
        y={bottomPlate + 22}
        textAnchor="middle"
        fontSize="21"
        fill="#86759f"
        stroke="none"
      >
        C
      </text>
    </g>
  );
}
export default function CmosCircuit({ shot, compact }: { shot: CmosShot; compact: boolean }) {
  const sample = shot.sample,
    kind = shot.trace.kind,
    p = shot.trace.parameters;
  const width = compact ? 310 : 740,
    center = compact ? 156 : 340,
    cap = compact ? 277 : 642;
  const left = compact ? 90 : 242,
    right = compact ? 216 : 442;
  const top = 28,
    bottom = 310,
    out = kind === 'nor' ? 161 : 145;
  const busA = compact ? 22 : 84,
    busB = compact ? 108 : 280;
  const nodes: Record<string, [number, number]> = {
    VDD: [center, top],
    GND: [center, bottom],
    Y: [center, out],
    N1: [center, 227],
    P1: [center, 90],
  };
  const locations: Record<string, [number, number]> =
    kind === 'inverter'
      ? { pA: [center, 84], nA: [center, 235] }
      : kind === 'nand'
        ? { pA: [left, 84], pB: [right, 84], nA: [center, 190], nB: [center, 271] }
        : { pA: [center, 62], pB: [center, 119], nA: [left, 232], nB: [right, 232] };
  const wires = sample.network.devices.map((d) => {
    const [x, y] = locations[d.id],
      a = nodes[d.a],
      b = nodes[d.b];
    return { d, path: `M${a[0]} ${a[1]}H${x}V${y - 16}M${x} ${y + 16}V${b[1]}H${b[0]}` };
  });
  const inputWires = ([0, 1] as const).map((input) => {
    const devices = sample.network.devices.filter((d) => d.input === input);
    if (!devices.length) return null;
    const bus = input ? busB : busA,
      ys = devices.map((d) => locations[d.id][1]),
      first = Math.min(...ys),
      last = Math.max(...ys);
    const crossings =
      input === 1
        ? [out, ...(kind === 'nand' ? [locations.nA[1]] : [])]
            .filter((y) => y > first && y < last)
            .sort((a, b) => a - b)
        : [];
    let path = `M${bus} ${first - 10}`;
    for (const y of crossings) path += `V${y - 6}Q${bus + 10} ${y} ${bus} ${y + 6}`;
    path += `V${last}`;
    const color = sample.inputs[input] ? '#527d91' : '#a48668';
    return (
      <g key={input} stroke={color} strokeWidth="1.7" fill="none">
        <path d={path} />
        {devices.map((d) => {
          const [x, y] = locations[d.id];
          return <path key={d.id} d={`M${bus} ${y}H${x - (d.type === 'p' ? 27 : 14)}`} />;
        })}
        <circle cx={bus} cy={first - 10} r="3" fill={color} stroke="none" />
        <text x={bus} y={first - 20} fill={color} textAnchor="middle" fontSize="22" stroke="none">
          {input ? 'B' : 'A'}
        </text>
      </g>
    );
  });
  return (
    <svg
      className="cmos-circuit"
      viewBox={`0 0 ${width} 338`}
      role="img"
      aria-label={t('从电源、晶体管沟道到输出电容和地的完整 CMOS 网络；栅极控制线与沟道绝缘')}
    >
      <g fill="none" stroke={quiet} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        {wires.map((w) => (
          <path key={w.d.id} d={w.path} />
        ))}
        {wires
          .filter((w) => w.d.on)
          .map((w) => (
            <path
              key={w.d.id}
              d={w.path}
              stroke={w.d.type === 'p' ? copper : blue}
              opacity={0.3 + 0.7 * Math.min(1, Math.abs(w.d.current) / 0.00024)}
              strokeWidth="3.4"
            />
          ))}
        <path d={`M${center} ${out}H${cap}M${center} ${bottom}H${cap}`} stroke="#718b93" />
        <path
          d={`M${center - 21} ${top}H${center + 21}M${center - 21} ${bottom}H${center + 21}M${center - 13} ${bottom + 7}H${center + 13}M${center - 5} ${bottom + 14}H${center + 5}`}
          stroke="#748a92"
        />
        <circle cx={center} cy={out} r="4" fill="#748a92" stroke="none" />
      </g>
      <Capacitor x={cap} outputY={out} groundY={bottom} voltage={sample.voltage} vdd={p.vdd} />
      {inputWires}
      {sample.network.devices.map((device) => (
        <Mos
          key={device.id}
          device={device}
          x={locations[device.id][0]}
          y={locations[device.id][1]}
          label={false}
        />
      ))}
      <g fontSize="22" fill="#425e69" fontFamily="inherit">
        <text x={center} y="19" textAnchor="middle">
          VDD
        </text>
        <text x={cap} y={out - 11} textAnchor="middle">
          Y
        </text>
        {!compact && (
          <>
            <text x={cap + 24} y={out + 5}>
              {sample.voltage.toFixed(2)} V
            </text>
            <text x={cap + 20} y="303">
              {Math.round(p.capacitance * 1e15)} fF
            </text>
          </>
        )}
      </g>
    </svg>
  );
}

/** A close view of the same inverter, with shorter wires rather than scaled text. */
export function CmosChargeCircuit({ shot }: { shot: CmosShot }) {
  const s = shot.sample,
    p = shot.trace.parameters;
  return (
    <svg
      className="cmos-charge-circuit"
      viewBox="0 0 280 186"
      role="img"
      aria-label={t('从电源、晶体管沟道到输出电容和地的完整 CMOS 网络；栅极控制线与沟道绝缘')}
    >
      <g fill="none" stroke={quiet} strokeWidth="2.3" strokeLinecap="round">
        <path d="M125 24V36M125 68V114M125 146V164H225M125 92H225M105 24H145M105 164H145M114 171H136" />
        <path d="M35 52H98M35 52V130H111" stroke={s.inputs[0] ? blue : copper} />
        <circle cx="125" cy="92" r="3" fill={quiet} />
        {s.network.devices[0].on && <path d="M125 24V36M125 68V92H225" stroke={copper} />}
        {s.network.devices[1].on && <path d="M225 92H125V114M125 146V164" stroke={blue} />}
      </g>
      <Mos device={s.network.devices[0]} x={125} y={52} label={false} />
      <Mos device={s.network.devices[1]} x={125} y={130} label={false} />
      <Capacitor x={225} outputY={92} groundY={164} voltage={s.voltage} vdd={p.vdd} />
      <g fontSize="20" fill="#425e69" textAnchor="middle">
        <text x="125" y="18">
          VDD
        </text>
        <text x="35" y="36">
          A
        </text>
        <text x="225" y="81">
          Y
        </text>
      </g>
    </svg>
  );
}

export function CmosCascadeCircuit({ shot, compact }: { shot: CmosShot; compact: boolean }) {
  if (!shot.secondSample) return null;
  const s1 = shot.sample,
    s2 = shot.secondSample,
    p = shot.trace.parameters;
  const width = compact ? 310 : 740;
  const stages = compact
    ? [
        { x: 80, top: 33, py: 64, out: 101, ny: 143, bottom: 176, cap: 126 },
        { x: 224, top: 33, py: 64, out: 101, ny: 143, bottom: 176, cap: 280 },
      ]
    : [
        { x: 200, top: 30, py: 83, out: 157, ny: 231, bottom: 304, cap: 280 },
        { x: 520, top: 30, py: 83, out: 157, ny: 231, bottom: 304, cap: 664 },
      ];
  const xBus = compact ? 171 : 400,
    first = stages[0],
    second = stages[1];
  return (
    <svg
      className="cmos-circuit cmos-cascade"
      viewBox={`0 0 ${width} ${compact ? 208 : 337}`}
      role="img"
      aria-label={t('两级反相器：第一级输出以连续导线连接第二级的两个绝缘栅极')}
    >
      <g
        fill="none"
        stroke="#758d96"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d={`M${first.x} ${first.out}H${xBus}M${xBus} ${Math.min(first.out, second.py)}V${second.ny}M${xBus} ${second.py}H${second.x - 27}M${xBus} ${second.ny}H${second.x - 14}`}
          stroke="#9c83b0"
        />
        <path d={`M22 ${first.py}H${first.x - 27}M22 ${first.py}V${first.ny}H${first.x - 14}`} />
        {stages.map((s, i) => (
          <g key={i}>
            <path
              d={`M${s.x} ${s.top}V${s.py - 16}M${s.x} ${s.py + 16}V${s.ny - 16}M${s.x} ${s.ny + 16}V${s.bottom}H${s.cap}M${s.x} ${s.out}H${s.cap}`}
            />
            <path
              d={`M${s.x - 14} ${s.top}H${s.x + 14}M${s.x - 14} ${s.bottom}H${s.x + 14}M${s.x - 8} ${s.bottom + 6}H${s.x + 8}`}
            />
            <circle cx={s.x} cy={s.out} r="3.5" fill="#9c83b0" stroke="none" />
          </g>
        ))}
        <circle cx={xBus} cy={second.py} r="3" fill="#9c83b0" stroke="none" />
      </g>
      {stages.map((s, i) => {
        const sample = i ? s2 : s1;
        return (
          <g key={i}>
            <Capacitor
              x={s.cap}
              outputY={s.out}
              groundY={s.bottom}
              voltage={sample.voltage}
              vdd={p.vdd}
            />
            <Mos device={sample.network.devices[0]} x={s.x} y={s.py} label={false} />
            <Mos device={sample.network.devices[1]} x={s.x} y={s.ny} label={false} />
            <text x={s.x} y={s.top - 10} textAnchor="middle" fontSize="21" fill="#425e69">
              VDD
            </text>
            <text x={s.cap} y={s.out - 11} textAnchor="middle" fontSize="22" fill="#86759f">
              {i ? 'Y₂' : 'Y₁'}
            </text>
          </g>
        );
      })}
      <text x="22" y={first.py - 14} textAnchor="middle" fontSize="22" fill="#425e69">
        A
      </text>
    </svg>
  );
}
