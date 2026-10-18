import { useEffect, useState } from 'react';
import { browserLocale } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  METER_HEAD,
  currentNetwork,
  voltageNetwork,
  ohmmeterState,
  diodeOhmmeter,
  lampMeter,
  faultProbeState,
  meterNeedle,
  multimeterDirector,
  type MeterDirection,
  type MeterShot,
  type MeterMode,
  type CircuitFault,
  type FaultProbe,
} from '../../models/multimeter-lab';
import '../../styles/multimeter-lab.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const ink = '#3e5350',
  green = '#4b8175',
  gold = '#aa7941',
  red = '#b27361',
  black = '#596b65',
  pale = '#e9eee4';
const shots: MeterShot[] = [
  'voltage-external',
  'voltage-core',
  'voltage-predict',
  'current-external',
  'current-core',
  'current-predict',
  'ohm-core',
  'ohm-scale',
  'cold',
  'contact',
  'diode',
  'fault',
];
const name = (s: MeterShot) =>
  ({
    'voltage-external': tr('灯泡电压，表内的电流', 'Lamp voltage, current inside'),
    'voltage-core': tr('串联电阻分担电压', 'A series resistor shares voltage'),
    'voltage-predict': tr('换大量程，指针怎样变？', 'A larger range: what changes?'),
    'current-external': tr('让支路电流经过电表', 'Put the meter in the branch'),
    'current-core': tr('大电流绕过敏感表头', 'Most current bypasses the head'),
    'current-predict': tr('换小量程，会超量程吗？', 'Will the smaller range overflow?'),
    'ohm-core': tr('谁向待测物提供电流？', 'What supplies the test current?'),
    'ohm-scale': tr('电阻加倍，偏转减半吗？', 'Double resistance, half deflection?'),
    cold: tr('冷灯丝与热灯丝不同', 'A cold filament is different'),
    contact: tr('同一个人，不同接触路径', 'Same person, different contact'),
    diode: tr('同一二极管，交换表笔', 'Same diode, swapped probes'),
    fault: tr('不亮的灯，哪里有电压？', 'Dark lamp: where is the voltage?'),
  })[s];
const ohms = (r: number) =>
  r < 0
    ? '—'
    : !Number.isFinite(r)
      ? '∞'
      : r > 1e8
        ? '≈∞'
        : r === 0
          ? '0 Ω'
          : r >= 1000
            ? `${(r / 1000).toFixed(r >= 10000 ? 0 : 1)} kΩ`
            : `${r.toFixed(r < 1 ? 3 : 0)} Ω`;
const amps = (i: number) =>
  Math.abs(i) < 1e-6
    ? `${(i * 1e9).toFixed(1)} nA`
    : Math.abs(i) < 0.001
      ? `${(i * 1e6).toFixed(1)} µA`
      : `${(i * 1000).toFixed(2)} mA`;
function Route({
  d,
  current = 0,
  progress = 0,
  color = green,
  kind = 'wire',
}: {
  d: string;
  current?: number;
  progress?: number;
  color?: string;
  kind?: string;
}) {
  return (
    <g data-meter-route={kind} data-current={current}>
      <path d={d} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      {Math.abs(current) > 1e-15 && (
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray="1 15"
          strokeDashoffset={-progress * 100 * Math.sign(current)}
          opacity=".65"
        />
      )}
    </g>
  );
}
function Resistor({
  x,
  y,
  vertical = false,
  color = green,
}: {
  x: number;
  y: number;
  vertical?: boolean;
  color?: string;
}) {
  return (
    <rect
      x={x - (vertical ? 7 : 21)}
      y={y - (vertical ? 21 : 7)}
      width={vertical ? 14 : 42}
      height={vertical ? 42 : 14}
      rx="3"
      fill="#f7f7ef"
      stroke={color}
      strokeWidth="2"
    />
  );
}
function Head({ x, y, fraction, r = 25 }: { x: number; y: number; fraction: number; r?: number }) {
  const n = meterNeedle(fraction);
  return (
    <g
      data-meter-head="same-50uA-2kohm"
      data-head-current={fraction * METER_HEAD.fullScaleCurrent}
      data-deflection={fraction}
    >
      <circle cx={x} cy={y} r={r} fill="#f4efe1" stroke={gold} strokeWidth="2" />
      <path
        d={`M${x - r * 0.65} ${y + 3}l5-8 5 8 5-8 5 8 5-8 5 8`}
        fill="none"
        stroke={gold}
        strokeWidth="1.4"
        opacity=".6"
      />
      <path
        data-meter-needle="head"
        d={`M${x} ${y + 4}L${x + n.x * (r - 5)} ${y + 4 + n.y * (r - 5)}`}
        stroke={gold}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={x} cy={y + 4} r="3" fill={gold} />
      <text x={x} y={y + r + 20} textAnchor="middle">
        G
      </text>
    </g>
  );
}
function Dial({
  x,
  y,
  fraction,
  resistance = false,
  r = 65,
}: {
  x: number;
  y: number;
  fraction: number;
  resistance?: boolean;
  r?: number;
}) {
  const n = meterNeedle(fraction),
    point = (f: number, k: number) => ({
      x: x + Math.sin(((-65 + 130 * f) * Math.PI) / 180) * k,
      y: y - Math.cos(((-65 + 130 * f) * Math.PI) / 180) * k,
    });
  const a = point(0, r),
    b = point(1, r);
  return (
    <g data-meter-dial="same-head" data-deflection={fraction}>
      <path d={`M${a.x} ${a.y}A${r} ${r} 0 0 1 ${b.x} ${b.y}`} fill="none" stroke="#b3bfa9" />
      {Array.from({ length: 11 }, (_, j) => {
        const q = point(j / 10, r),
          v = point(j / 10, r - 6);
        return <path key={j} d={`M${q.x} ${q.y}L${v.x} ${v.y}`} stroke={gold} />;
      })}
      {[0, 0.5, 1].map((f) => {
        const q = point(f, r + 18);
        return (
          <text key={f} x={q.x} y={q.y + 5} textAnchor="middle">
            {resistance
              ? f === 0
                ? '∞'
                : f === 1
                  ? '0'
                  : '20'
              : f === 0
                ? '0'
                : f === 1
                  ? '50'
                  : '25'}
          </text>
        );
      })}
      <path
        data-meter-needle="dial"
        d={`M${x} ${y}L${x + n.x * (r - 7)} ${y + n.y * (r - 7)}`}
        stroke={gold}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx={x} cy={y} r="4" fill={gold} />
      <text x={x} y={y + 23} textAnchor="middle">
        {resistance ? 'Ω' : 'µA'}
      </text>
    </g>
  );
}
function Bulb({ x, y, power = 0 }: { x: number; y: number; power?: number }) {
  return (
    <g data-meter-lamp-power={power}>
      <circle cx={x} cy={y} r="20" fill={power > 0.04 ? '#f0df9c' : pale} stroke="#a6b29c" />
      <path
        d={`M${x - 20} ${y}h8l4-6 5 12 5-12 4 6h14`}
        fill="none"
        stroke={gold}
        strokeWidth="2"
      />
      <path d={`M${x - 10} ${y + 20}h20m-17 4h14`} stroke="#9ba890" strokeWidth="2" />
    </g>
  );
}
function Battery({ x, y, source = 1.5 }: { x: number; y: number; source?: number }) {
  return (
    <g data-meter-battery={source}>
      <path
        d={`M${x - 8} ${y - 12}v24m16-18v12`}
        stroke={source ? gold : '#9aa69c'}
        strokeWidth="3"
      />
      <text x={x - 21} y={y - 14} textAnchor="middle">
        +
      </text>
      <text x={x + 21} y={y - 14} textAnchor="middle">
        −
      </text>
    </g>
  );
}
function External({ d, w }: { d: MeterDirection; w: number }) {
  const current = d.mode === 'current',
    s = lampMeter(current ? 'current' : 'voltage', d.range, d.reversed),
    wide = w > 400,
    cx = w / 2,
    face = wide ? 140 : cx,
    fy = wide ? 139 : 111,
    portY = wide ? 164 : 136;
  const x0 = wide ? 337 : cx - 104,
    x1 = wide ? 609 : cx + 104,
    lampX = wide ? 551 : cx + 57,
    cellX = wide ? 473 : cx,
    top = wide ? 89 : 174,
    bottom = wide ? 226 : 227,
    gapA = wide ? 365 : cx - 61,
    gapB = wide ? 420 : cx - 20;
  let redTarget: [number, number] = current ? [gapA, top] : [lampX - 20, top],
    blackTarget: [number, number] = current ? [gapB, top] : [lampX + 20, top];
  if (d.reversed) [redTarget, blackTarget] = [blackTarget, redTarget];
  const probe = (start: [number, number], end: [number, number], color: string, kind: string) => (
    <Route
      d={
        wide
          ? `M${start}C${start[0]} ${start[1] + 35} ${end[0] - 65} ${end[1] + 55} ${end}`
          : `M${start}C${start[0]} 157 ${end[0]} 147 ${end}`
      }
      color={color}
      current={s.meterCurrent * (d.reversed ? -1 : 1)}
      progress={d.progress}
      kind={kind}
    />
  );
  return (
    <>
      <text x={cx} y="20" textAnchor="middle">
        {current ? 'I' : 'U'} = {s.value.toFixed(3)} {current ? 'A' : 'V'} · {d.range}{' '}
        {current ? 'A' : 'V'}
      </text>
      <rect x={face - 94} y={fy - 79} width="188" height="108" rx="22" fill={pale} />
      <Dial x={face} y={fy} fraction={s.deflection} r={48} />
      <Route
        d={`M${cellX - 8} ${bottom}H${x0}V${top}H${current ? gapA : lampX - 20}`}
        current={s.sourceCurrent}
        progress={d.progress}
        kind="external-source"
      />
      {current && (
        <Route d={`M${gapB} ${top}H${lampX - 20}`} current={s.lampCurrent} progress={d.progress} />
      )}
      <Route
        d={`M${lampX + 20} ${top}H${x1}V${bottom}H${cellX + 8}`}
        current={s.sourceCurrent}
        progress={d.progress}
        kind="external-return"
      />
      <Bulb x={lampX} y={top} power={s.lampCurrent ** 2 * 20} />
      <Battery x={cellX} y={bottom} source={3} />
      {probe(redTarget, [face - 55, portY], red, 'red-probe')}
      {probe([face + 55, portY], blackTarget, black, 'black-probe')}
      <circle cx={face - 55} cy={portY} r="4" fill={red} />
      <circle cx={face + 55} cy={portY} r="4" fill={black} />
      <text x={wide ? 473 : cx} y="263" textAnchor="middle">
        {tr('电源', 'Source')} 3 V · r = 0.5 Ω
      </text>
    </>
  );
}
function VoltageCore({ d, w }: { d: MeterDirection; w: number }) {
  const s = lampMeter('voltage', d.range, d.reversed),
    n = voltageNetwork(d.range, s.value),
    wide = w > 400,
    cx = w / 2,
    a = wide ? 65 : cx - 108,
    b = wide ? 372 : cx + 88,
    rs = wide ? 207 : cx - 24;
  return (
    <>
      <text x={cx} y="20" textAnchor="middle">
        {d.range} V · R = {ohms(n.seriesResistance)}
      </text>
      <Route
        d={`M${a} 90H${rs - 21}M${rs + 21} 90H${b - 25}M${b + 25} 90V192H${a}`}
        current={n.headCurrent}
        progress={d.progress}
        kind="series"
      />
      <Resistor x={rs} y={90} />
      <Head x={b} y={90} fraction={n.deflection} />
      <circle cx={a} cy="90" r="4" fill={red} />
      <circle cx={a} cy="192" r="4" fill={black} />
      <path d={`M${a - 11} 92V190`} stroke={red} strokeWidth="1.4" />
      <text x={wide ? 207 : cx - 49} y="145" textAnchor="middle">
        Uᴿ = {n.seriesVoltage.toFixed(3)} V
      </text>
      <text x={wide ? 515 : cx + 26} y={wide ? 100 : 173} textAnchor="middle">
        Uᴳ = {n.headVoltage.toFixed(3)} V
      </text>
      <text x={wide ? 207 : cx} y="222" textAnchor="middle">
        U = {s.value.toFixed(3)} V
      </text>
      <text x={wide ? 515 : cx} y={wide ? 169 : 251} textAnchor="middle">
        {!d.reveal ? (
          tr('换到 10 V，先预测', 'Predict the 10 V range')
        ) : (
          <>Iᴳ = {amps(n.headCurrent)}</>
        )}
      </text>
    </>
  );
}
function CurrentCore({ d, w }: { d: MeterDirection; w: number }) {
  const s = lampMeter('current', d.range, d.reversed),
    n = currentNetwork(d.range, s.value),
    wide = w > 400,
    cx = w / 2,
    left = wide ? 70 : cx - 85,
    right = wide ? 370 : cx + 98,
    h = wide ? 230 : cx + 30;
  return (
    <>
      <text x={cx} y="20" textAnchor="middle">
        {d.range} A · Rˢ = {ohms(n.shuntResistance)}
      </text>
      <Route d={`M${left - 22} 122H${left}`} current={s.value} progress={d.progress} kind="total" />
      <Route
        d={`M${left} 122V76H${h - 25}M${h + 25} 76H${right}V122`}
        current={n.headCurrent}
        progress={d.progress}
        kind="head-branch"
      />
      <Route
        d={`M${left} 122V166H${h - 21}M${h + 21} 166H${right}V122`}
        current={n.shuntCurrent}
        progress={d.progress}
        kind="shunt-branch"
      />
      <Route d={`M${right} 122h16`} current={s.value} progress={d.progress} kind="total-return" />
      <Head x={h} y={76} fraction={n.deflection} />
      <Resistor x={h} y={166} />
      <circle cx={left} cy="122" r="4" fill={green} />
      <circle cx={right} cy="122" r="4" fill={green} />
      <text x={wide ? 505 : cx} y={wide ? 82 : 48} textAnchor="middle">
        Iᴳ = {amps(n.headCurrent)}
      </text>
      <text x={wide ? 505 : cx} y={wide ? 172 : 202} textAnchor="middle">
        Iˢ = {amps(n.shuntCurrent)}
      </text>
      <text x={cx} y="231" textAnchor="middle">
        I = Iᴳ + Iˢ = {amps(s.value)}
      </text>
      <text x={cx} y="260" textAnchor="middle">
        {!d.reveal
          ? tr('换到 0.1 A，先预测', 'Predict the 0.1 A range')
          : s.overRange
            ? tr('表头电流超过满偏', 'Head current exceeds full scale')
            : tr('同一表头只承受小电流', 'The head carries little current')}
      </text>
    </>
  );
}
function OhmCore({ d, w }: { d: MeterDirection; w: number }) {
  const n = ohmmeterState(d.resistance, d.multiplier, d.gain),
    wide = w > 400,
    cx = w / 2,
    rx = wide ? 55 : cx - 106,
    a = wide ? 160 : cx - 49,
    b = wide ? 421 : cx + 102,
    g = wide ? 318 : cx + 45,
    cellX = wide ? 280 : cx;
  const i = n.current;
  return (
    <>
      <text x={cx} y="20" textAnchor="middle">
        {Number.isFinite(d.resistance)
          ? `Rˣ = ${ohms(d.resistance)}`
          : tr('表笔分开：回路未闭合', 'Open probes: no closed loop')}
      </text>
      <Route
        d={`M${cellX - 8} 218H${a}V201M${a} 159H${rx}V141`}
        current={i}
        progress={d.progress}
        kind="battery-to-black"
      />
      <Resistor x={a} y={180} vertical />
      {Number.isFinite(d.resistance) ? (
        d.resistance === 0 ? (
          <Route d={`M${rx} 141V99`} current={i} progress={d.progress} kind="short" />
        ) : (
          <>
            <Route d={`M${rx} 141V134M${rx} 106V99`} current={i} progress={d.progress} />
            <rect x={rx - 7} y="106" width="14" height="28" rx="3" fill="#e1d2b1" stroke={gold} />
          </>
        )
      ) : (
        <path d={`M${rx} 141V133M${rx} 107V99`} stroke="#a8b7a4" strokeWidth="2" />
      )}
      <Route d={`M${rx} 99V76H${a}`} current={i} progress={d.progress} kind="red-to-split" />
      <Route
        d={`M${a} 76H${g - 25}M${g + 25} 76H${b}`}
        current={n.headCurrent}
        progress={d.progress}
        kind="ohm-head"
      />
      <Route
        d={`M${a} 76V136H${g - 21}M${g + 21} 136H${b}V76`}
        current={n.shuntCurrent}
        progress={d.progress}
        kind="ohm-shunt"
      />
      <Route
        d={`M${b} 76V218H${cellX + 8}`}
        current={i}
        progress={d.progress}
        kind="battery-return"
      />
      <Head x={g} y={76} fraction={n.deflection} />
      <Resistor x={g} y={136} />
      <Battery x={cellX} y={218} />
      <circle cx={rx} cy="159" r="4" fill={black} />
      <circle cx={rx} cy="76" r="4" fill={red} />
      <text x={wide ? 280 : cx + 30} y="182" textAnchor="middle">
        E = 1.5 V
      </text>
      <path
        d={`M${a - 13} 192L${a + 13} 168m-6 0h6v6`}
        stroke={gold}
        strokeWidth="1.6"
        fill="none"
      />
      <text x={wide ? 530 : cx} y={wide ? 115 : 253} textAnchor="middle">
        Iᴳ = {amps(n.headCurrent)}
        {wide ? (
          <tspan x="530" dy="32">
            {n.calibrated ? tr('已调零', 'Zeroed') : tr('正在调零', 'Adjust zero')}
          </tspan>
        ) : (
          <> · {n.calibrated ? tr('已调零', 'Zeroed') : tr('正在调零', 'Adjust zero')}</>
        )}
      </text>
    </>
  );
}
function Scale({ d, w }: { d: MeterDirection; w: number }) {
  const n = ohmmeterState(d.resistance, d.multiplier, d.gain),
    wide = w > 400,
    cx = w / 2;
  return (
    <>
      <text x={cx} y="22" textAnchor="middle">
        Rˣ = {ohms(d.resistance)} · ×{d.multiplier}
      </text>
      <Dial
        x={wide ? 180 : cx}
        y={wide ? 195 : 161}
        fraction={n.deflection}
        resistance
        r={wide ? 100 : 75}
      />
      <text x={wide ? 450 : cx} y={wide ? 135 : 218} textAnchor="middle">
        {!d.reveal
          ? tr('再加倍，先预测指针', 'Predict one more doubling')
          : d.resistance === 470
            ? '47 × 10 = 470 Ω'
            : `Iᴳ / 50 µA = ${n.deflection.toFixed(3)}`}
      </text>
      <text x={wide ? 450 : cx} y={wide ? 175 : 251} textAnchor="middle">
        {tr('电池与内阻仍在回路中', 'Battery and internal R remain')}
      </text>
    </>
  );
}
function Specimen({ d, w }: { d: MeterDirection; w: number }) {
  const n =
      d.shot === 'diode'
        ? diodeOhmmeter(d.forward, d.multiplier, d.gain)
        : ohmmeterState(d.resistance, d.multiplier, d.gain),
    wide = w > 400,
    cx = wide ? 475 : w / 2,
    face = wide ? 150 : cx,
    faceY = wide ? 150 : 110,
    portY = wide ? 172 : 132;
  const left = cx - 64,
    right = cx + 64,
    forward = d.shot !== 'diode' || d.forward;
  const redEnd = forward ? right : left,
    blackEnd = forward ? left : right;
  return (
    <>
      <text x={w / 2} y="20" textAnchor="middle">
        {ohms(n.indicated)} · {amps(n.current)}
      </text>
      <rect x={face - 98} y={faceY - 78} width="196" height="104" rx="20" fill={pale} />
      <Dial x={face} y={faceY} fraction={n.deflection} resistance r={48} />
      <Route
        d={`M${blackEnd} 205C${blackEnd} ${wide ? 95 : 166} ${face + 61} ${wide ? 95 : 166} ${face + 61} ${portY}`}
        color={black}
        current={-n.current}
        progress={d.progress}
        kind="black-positive"
      />
      <Route
        d={`M${face - 61} ${portY}C${face - 61} ${wide ? 252 : 166} ${redEnd} ${wide ? 252 : 166} ${redEnd} 205`}
        color={red}
        current={-n.current}
        progress={d.progress}
        kind="red-return"
      />
      {d.shot === 'cold' ? (
        <>
          <Route
            d={`M${left} 205H${cx - 20}M${cx + 20} 205H${right}`}
            current={n.current}
            progress={d.progress}
          />
          <Bulb x={cx} y={205} />
        </>
      ) : d.shot === 'diode' ? (
        <>
          <Route
            d={`M${left} 205H${cx - 25}M${cx + 25} 205H${right}`}
            current={d.forward ? n.current : -n.current}
            progress={d.progress}
          />
          <rect x={cx - 25} y="193" width="50" height="24" rx="8" fill="#607b70" />
          <path d={`M${cx + 13} 194v22`} stroke="#efead5" strokeWidth="5" />
          <text x={cx - 35} y="238" textAnchor="middle">
            A
          </text>
          <text x={cx + 35} y="238" textAnchor="middle">
            K
          </text>
        </>
      ) : (
        <g data-meter-person="same-person">
          <rect x={cx - 18} y="186" width="36" height="48" rx="12" fill="#a6b7a6" />
          <circle cx={cx} cy="167" r="16" fill="#d6c8a9" />
          <path
            d={`M${cx - 12} 232v-37Q${cx - 40} 180 ${left} 205M${cx + 12} 232v-37Q${cx + 40} 180 ${right} 205`}
            fill="none"
            stroke="#a6b7a6"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <circle cx={left} cy="205" r={d.resistance <= 50000 ? 9 : 6} fill="#d6c8a9" />
          <circle cx={right} cy="205" r={d.resistance <= 50000 ? 9 : 6} fill="#d6c8a9" />
        </g>
      )}
      <text x={w / 2} y="265" textAnchor="middle">
        {d.shot === 'diode'
          ? d.forward
            ? tr('黑笔 → A，红笔 → K', 'Black → A; red → K')
            : tr('黑笔 → K，红笔 → A', 'Black → K; red → A')
          : d.shot === 'cold'
            ? tr('小测试电流，未正常发光', 'Test current; no normal glow')
            : tr('只表示等效接触电阻', 'Equivalent contact model')}
      </text>
    </>
  );
}
function Fault({ d, w }: { d: MeterDirection; w: number }) {
  const s = faultProbeState(d.fault, d.probe, d.range),
    wide = w > 400,
    cx = w / 2,
    left = wide ? 60 : cx - 105,
    right = wide ? 580 : cx + 105,
    sy = 65,
    by = 207,
    sw0 = wide ? 160 : cx - 57,
    sw1 = wide ? 220 : cx - 17,
    sk = wide ? 400 : cx + 34,
    bulb = wide ? 500 : cx + 75;
  const parts = [
    `M${cx - 8} ${by}H${left}V${sy}H${sw0}`,
    `M${sw0} ${sy}H${sw1}`,
    `M${sw1} ${sy}H${bulb - 20}`,
    `M${bulb + 20} ${sy}H${right}V${by}H${cx + 8}`,
  ];
  const probes: Record<FaultProbe, [[number, number], [number, number]]> = {
    battery: [
      [cx - 8, by],
      [cx + 8, by],
    ],
    wire: [
      [left, by],
      [sw0, sy],
    ],
    switch: [
      [sw0, sy],
      [sw1, sy],
    ],
    lamp: [
      [sk - 11, sy],
      [right, sy],
    ],
  };
  const [r, k] = probes[d.probe];
  return (
    <>
      <text x={cx} y="20" textAnchor="middle">
        U = {s.voltage.toFixed(3)} V · {d.range} V
      </text>
      {parts.map((p, j) => (
        <Route
          key={j}
          d={p}
          current={s.partCurrents[j]}
          progress={d.progress}
          kind={`fault-part-${j}`}
        />
      ))}
      <circle cx={sw0} cy={sy} r="4" fill={gold} />
      <circle cx={sw1} cy={sy} r="4" fill={gold} />
      {d.fault === 'wire' && (
        <>
          <path d={`M${left} 121v24`} stroke="#fafbf6" strokeWidth="7" />
          <Resistor x={left} y={133} vertical color={red} />
        </>
      )}
      {d.fault === 'switch' && (
        <>
          <path d={`M${sw0 + 9} ${sy}h22`} stroke="#fafbf6" strokeWidth="7" />
          <rect x={sw0 + 9} y={sy - 5} width="22" height="10" rx="3" fill="#eddcc9" stroke={red} />
        </>
      )}
      <rect
        x={sk - 11}
        y={sy - 7}
        width="22"
        height="14"
        rx="4"
        fill={d.fault === 'socket' ? '#eddcc9' : pale}
        stroke={d.fault === 'socket' ? red : green}
      />
      <Bulb x={bulb} y={sy} power={s.lampPower} />
      <Battery x={cx} y={by} source={s.source} />
      <text x={(sw0 + sw1) / 2} y="43" textAnchor="middle">
        S
      </text>
      <Route
        d={`M${r}Q${cx - 70} 130 ${cx - 27} 143`}
        color={red}
        current={s.meterCurrent * (d.reversed ? -1 : 1)}
        progress={d.progress}
        kind="fault-red"
      />
      <Route
        d={`M${cx + 27} 143Q${cx + 70} 130 ${k}`}
        color={black}
        current={s.meterCurrent * (d.reversed ? -1 : 1)}
        progress={d.progress}
        kind="fault-black"
      />
      <Head x={cx} y={143} fraction={s.deflection} r={27} />
      <text x={wide ? 178 : cx} y={wide ? 260 : 241} textAnchor="middle">
        {tr('表内电流', 'Meter current')} {amps(s.meterCurrent)}
      </text>
      <text x={wide ? 466 : cx} y={wide ? 260 : 268} textAnchor="middle">
        {tr('灯丝电流', 'Filament current')} {amps(s.lampCurrent)}
      </text>
    </>
  );
}
export function MultimeterArtwork({
  direction,
  narrow = false,
  cover = false,
}: {
  direction: MeterDirection;
  narrow?: boolean;
  cover?: boolean;
}) {
  const w = narrow ? 268 : 640;
  return (
    <svg
      viewBox={cover ? `${w / 2 - 130} 30 260 165` : `0 0 ${w} 280`}
      className="mm2-art"
      data-meter-shot={direction.shot}
      data-cover={cover || undefined}
      role="img"
      aria-label={name(direction.shot)}
    >
      {direction.shot === 'voltage-external' || direction.shot === 'current-external' ? (
        <External d={direction} w={w} />
      ) : direction.shot === 'voltage-core' || direction.shot === 'voltage-predict' ? (
        <VoltageCore d={direction} w={w} />
      ) : direction.shot === 'current-core' || direction.shot === 'current-predict' ? (
        <CurrentCore d={direction} w={w} />
      ) : direction.shot === 'ohm-core' ? (
        <OhmCore d={direction} w={w} />
      ) : direction.shot === 'ohm-scale' ? (
        <Scale d={direction} w={w} />
      ) : direction.shot === 'fault' ? (
        <Fault d={direction} w={w} />
      ) : (
        <Specimen d={direction} w={w} />
      )}
    </svg>
  );
}
export default function MultimeterLab() {
  const film = useShowcase(),
    [narrow, setNarrow] = useState(false),
    [manualShot, setShot] = useState<MeterShot | null>(null),
    [range, setRange] = useState('5'),
    [aRange, setARange] = useState('0.5'),
    [resistance, setResistance] = useState(470),
    [multiplier, setMultiplier] = useState('10'),
    [gain, setGain] = useState(1),
    [short, setShort] = useState(false),
    [open, setOpen] = useState(false),
    [forward, setForward] = useState(true),
    [reversed, setReversed] = useState(false),
    [contact, setContact] = useState(50),
    [fault, setFault] = useState<CircuitFault>('switch'),
    [probe, setProbe] = useState<FaultProbe>('battery');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = matchMedia('(max-width:600px)'),
      set = () => setNarrow(q.matches);
    set();
    q.addEventListener('change', set);
    return () => q.removeEventListener('change', set);
  }, []);
  const authored = multimeterDirector(film.chapter, film.chapterTime, browserLocale());
  const shot = manualShot ?? (film.variant === 'r3-multimeter-faults' ? 'fault' : authored.shot);
  const mode: MeterMode =
    shot === 'fault'
      ? 'fault'
      : shot.startsWith('voltage')
        ? 'voltage'
        : shot.startsWith('current')
          ? 'current'
          : 'resistance';
  const manual: MeterDirection = {
    shot,
    mode,
    range: mode === 'fault' ? 2.5 : mode === 'current' ? Number(aRange) : Number(range),
    resistance:
      shot === 'cold'
        ? 15
        : shot === 'contact'
          ? contact * 1000
          : shot === 'diode'
            ? 470
            : open
              ? Infinity
              : short
                ? 0
                : resistance,
    multiplier: shot === 'cold' ? 1 : shot === 'contact' ? 1000 : Number(multiplier),
    gain,
    forward,
    fault,
    probe,
    reveal: true,
    progress: 0,
    reversed,
  };
  const d = film.watch ? authored : manual;
  return (
    <section className="mm2" data-watch={film.watch || undefined} data-chapter={film.chapter}>
      <div className="mm2-title">{name(d.shot)}</div>
      <MultimeterArtwork direction={d} narrow={narrow} />
      {!film.watch && (
        <div className="mm2-controls">
          <label>
            {tr('观察路径', 'View')}
            <select value={shot} onChange={(e) => setShot(e.target.value as MeterShot)}>
              {shots.map((s) => (
                <option key={s} value={s}>
                  {name(s)}
                </option>
              ))}
            </select>
          </label>
          {mode === 'voltage' || mode === 'current' ? (
            <>
              <Segments
                label={tr('量程', 'Range')}
                value={mode === 'voltage' ? range : aRange}
                onChange={mode === 'voltage' ? setRange : setARange}
                options={(mode === 'voltage' ? ['2.5', '5', '10'] : ['0.1', '0.5']).map((v) => ({
                  value: v,
                  label: `${v} ${mode === 'voltage' ? 'V' : 'A'}`,
                }))}
              />
              <button onClick={() => setReversed(!reversed)}>
                {tr('交换两表笔', 'Swap probes')}
              </button>
            </>
          ) : mode === 'fault' ? (
            <>
              <Segments
                label={tr('模拟故障', 'Fault')}
                value={fault}
                onChange={setFault}
                options={[
                  { value: 'battery', label: tr('电池耗尽', 'Depleted cell') },
                  { value: 'wire', label: tr('导线断路', 'Broken wire') },
                  { value: 'switch', label: tr('开关接触不良', 'Bad switch') },
                  { value: 'socket', label: tr('灯座接触不良', 'Bad socket') },
                ]}
              />
              <Segments
                label={tr('表笔测哪里', 'Probe location')}
                value={probe}
                onChange={setProbe}
                options={[
                  { value: 'battery', label: tr('电池', 'Battery') },
                  { value: 'wire', label: tr('导线', 'Wire') },
                  { value: 'switch', label: tr('开关', 'Switch') },
                  { value: 'lamp', label: tr('灯座', 'Socket') },
                ]}
              />
            </>
          ) : (
            <>
              {shot === 'contact' ? (
                <Range
                  label={tr('接触电阻模型', 'Contact model')}
                  value={contact}
                  min={20}
                  max={200}
                  step={5}
                  unit="kΩ"
                  onChange={setContact}
                />
              ) : shot === 'diode' ? (
                <button onClick={() => setForward(!forward)}>
                  {tr('交换两表笔', 'Swap probes')}
                </button>
              ) : (
                shot !== 'cold' && (
                  <Range
                    label={tr('待测电阻', 'Specimen resistance')}
                    value={resistance}
                    min={0}
                    max={1000}
                    step={10}
                    unit="Ω"
                    onChange={setResistance}
                  />
                )
              )}
              {shot !== 'cold' && shot !== 'contact' && (
                <Segments
                  label={tr('欧姆倍率', 'Ohms multiplier')}
                  value={multiplier}
                  onChange={(v) => {
                    setMultiplier(v);
                    setGain(0.86);
                  }}
                  options={['1', '10', '100', '1000'].map((v) => ({ value: v, label: `×${v}` }))}
                />
              )}
              {(shot === 'ohm-core' || shot === 'ohm-scale') && (
                <div className="mm2-buttons">
                  <button
                    aria-pressed={short}
                    onClick={() => {
                      setShort(!short);
                      setOpen(false);
                    }}
                  >
                    {tr('短接表笔', 'Short probes')}
                  </button>
                  <button
                    aria-pressed={open}
                    onClick={() => {
                      setOpen(!open);
                      setShort(false);
                    }}
                  >
                    {tr('分开表笔', 'Open probes')}
                  </button>
                </div>
              )}
              <Range
                label={tr('欧姆调零', 'Ohm zero')}
                value={gain}
                min={0.7}
                max={1.1}
                step={0.01}
                onChange={setGain}
              />
              <button
                onClick={() => {
                  setGain(1);
                  if (shot === 'ohm-core' || shot === 'ohm-scale') {
                    setShort(true);
                    setOpen(false);
                  }
                }}
              >
                {tr('校准至右端零欧姆', 'Calibrate right-hand zero')}
              </button>
            </>
          )}
          <details>
            <summary>{tr('模型、极性与诊断范围', 'Model, polarity and diagnosis')}</summary>
            <p>
              {tr(
                '同一表头：50 µA 满偏，内阻 2 kΩ。电路为教学等效模型，并非某款仪表的完整电路。线纹只示传统电流方向，长度与速度不编码电流大小。欧姆挡自带 1.5 V 电源，仅此表型黑笔为内部正极；待测物已与外部电源分离。灯丝和手部为等效电阻，二极管不模拟击穿。故障仅比较给定的单一故障，不能排除灯丝断裂等其他原因。',
                'One 50 µA, 2 kΩ head. This is a teaching equivalent circuit, not a full manufacturer schematic. Wire marks indicate conventional current direction, not magnitude or charge speed. A 1.5 V cell powers ohms mode; only this modeled type supplies positive potential at the black lead. The specimen is isolated from external power. Filament and hands use equivalent resistances; diode breakdown is excluded. Diagnosis compares the specified single faults, without excluding a broken filament or other faults.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
