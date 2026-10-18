import { useEffect, useId, useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  oilClamp,
  oilDirector,
  oilDropPhysics,
  oilFallObservation,
  oilTrajectory,
  inferOilCharge,
  oilChanges,
  oilLatticeFit,
  OIL_RETICLE_DISTANCE,
  type OilDirection,
  type OilShot,
  type OilDropParameters,
} from '../../models/oil-drop-lab';
import {
  OIL_HISTORICAL_FALL_SECONDS as FALL,
  OIL_HISTORICAL_RISE as RISE,
} from '../../models/oil-drop-lab-records';
import '../../styles/oil-drop-lab.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const ink = '#354a48',
  green = '#467e73',
  gold = '#a87632',
  blue = '#607f9e',
  pale = '#e4eae2',
  red = '#b07360';
const mean = (a: readonly number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const rates = RISE.map((r) => r.correctedInverseSeconds),
  changes = oilChanges(rates),
  training = changes.slice(0, 8).map((x) => x.magnitude),
  lattice = oilLatticeFit(training);
const shots: readonly OilShot[] = [
  'reticle',
  'radius-candidates',
  'fall-inference',
  'plate-field',
  'force-balance',
  'charge-inference',
  'charge-prediction',
  'historical-times',
  'historical-bridge',
  'lattice',
  'held-out',
];
function shotName(s: OilShot) {
  return {
    reticle: tr('同一油滴，等距计时', 'One drop, one timed distance'),
    'radius-candidates': tr('哪个半径能保持匀速？', 'Which radius permits steady fall?'),
    'fall-inference': tr('下落速度怎样称出重量？', 'How does falling reveal weight?'),
    'plate-field': tr('电场与负电油滴的力', 'Field and force on a negative drop'),
    'force-balance': tr('电压改变，运动怎样改变？', 'What does voltage change?'),
    'charge-inference': tr('悬停电压给出电荷', 'Balance voltage reveals charge'),
    'charge-prediction': tr('电荷翻倍，电压呢？', 'Twice the charge: what voltage?'),
    'historical-times': tr('1913年，同一滴的记录', '1913: records of one drop'),
    'historical-bridge': tr('速度变化为什么对应电荷？', 'Why does speed reveal charge?'),
    lattice: tr('同一小步，容纳多次变化', 'One increment, many changes'),
    'held-out': tr('先预测，再揭最后一次', 'Predict, then open the last record'),
  }[s];
}
function Arrow({
  x,
  y,
  dx = 0,
  dy = 0,
  color = green,
}: {
  x: number;
  y: number;
  dx?: number;
  dy?: number;
  color?: string;
}) {
  const ex = x + dx,
    ey = y + dy,
    a = Math.atan2(dy, dx);
  return (
    <g stroke={color} fill={color} strokeWidth="1.8">
      <path d={`M${x} ${y}L${ex} ${ey}`} />
      {Math.hypot(dx, dy) > 2 && (
        <path
          d={`M${ex} ${ey}L${ex - 6 * Math.cos(a - 0.45)} ${ey - 6 * Math.sin(a - 0.45)}L${ex - 6 * Math.cos(a + 0.45)} ${ey - 6 * Math.sin(a + 0.45)}Z`}
          stroke="none"
        />
      )}
    </g>
  );
}
function Spot({
  x,
  y,
  id = 'teaching-drop',
  r = 5,
}: {
  x: number;
  y: number;
  id?: string;
  r?: number;
}) {
  return (
    <g data-oil-id={id} data-oil-x={x} data-oil-y={y}>
      <circle cx={x} cy={y} r={r + 5} fill="#eccd87" opacity=".12" />
      <circle cx={x} cy={y} r={r + 2} fill="#e9cb8b" opacity=".28" />
      <circle cx={x} cy={y} r={r} fill="#f1d795" />
      <circle cx={x - 1} cy={y - 1} r={r * 0.35} fill="#fff6d2" />
    </g>
  );
}
function Reticle({
  w,
  h,
  d,
  input,
}: {
  w: number;
  h: number;
  d: OilDirection;
  input: Partial<OilDropParameters>;
}) {
  const small = w < 400,
    p = oilDropPhysics(input),
    o = oilFallObservation(input),
    cx = small ? w / 2 : 205,
    cy = small ? 128 : 145,
    rad = small ? 86 : 110,
    top = cy - rad * 0.65,
    bottom = cy + rad * 0.65,
    Y = (m: number) =>
      top + ((m + OIL_RETICLE_DISTANCE / 2) / OIL_RETICLE_DISTANCE) * (bottom - top),
    time = Math.min(d.physicalTime, o.seconds),
    s = oilTrajectory(time, [{ at: 0, voltage: 0 }], input, {
      y: -OIL_RETICLE_DISTANCE / 2,
      v: p.fallSpeed,
    });
  return (
    <g>
      <text x={w / 2} y="19" textAnchor="middle">
        {tr('无电场 · 教学重建', 'No field · teaching reconstruction')}
      </text>
      <circle cx={cx} cy={cy} r={rad} fill="#283c3a" stroke="#b5c4ba" strokeWidth="5" />
      {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
        <path
          key={i}
          d={`M${cx - rad * 0.64} ${top + (bottom - top) * v}h${rad * 1.28}`}
          stroke="#adc4b5"
          opacity={i === 0 || i === 4 ? 0.8 : 0.25}
          strokeDasharray={i === 0 || i === 4 ? undefined : '3 5'}
        />
      ))}
      <path d={`M${cx} ${top - 13}V${bottom + 13}`} stroke="#8caaa0" opacity=".45" />
      <Spot x={cx} y={Y(s.y)} />
      <path
        data-oil-reticle-distance={o.distance}
        d={`M${cx + rad * 0.76} ${top}h8v${bottom - top}h-8`}
        fill="none"
        stroke="#d8e5d6"
      />
      <text x={small ? w / 2 : 455} y={small ? h - 35 : 105} textAnchor="middle">
        D = 0.50 mm
      </text>
      <text
        x={small ? w / 2 : 455}
        y={small ? h - 9 : 145}
        textAnchor="middle"
        data-oil-time={time}
      >
        {tr('计时', 'Time')} {time.toFixed(2)} s
      </text>
      {!small && (
        <text x="455" y="197" textAnchor="middle">
          {tr('亮点不是油滴的真实直径', 'The spot is not the drop diameter')}
        </text>
      )}
    </g>
  );
}
function RadiusCandidates({
  w,
  h,
  input,
}: {
  w: number;
  h: number;
  input: Partial<OilDropParameters>;
}) {
  const small = w < 400,
    p = oilDropPhysics(input),
    scale = 36 / p.weight;
  return (
    <g textAnchor="middle">
      <text x={w / 2} y="23">
        {tr('同一观测速率，不同半径候选', 'Same observed speed; trial radii')}
      </text>
      <text x={w / 2} y="54">
        v↓ = {(p.fallSpeed * 1000).toFixed(4)} mm/s
      </text>
      {[0.75, 1, 1.25].map((n, i) => {
        const q = oilDropPhysics({ ...input, radius: p.radius * n }),
          x = ((i + 0.5) * w) / 3,
          y = 140,
          f = q.drag * p.fallSpeed;
        return (
          <g key={i} data-radius-candidate={q.radius} data-candidate-net={q.weight - f}>
            <text x={x} y="90">
              {(q.radius * 1e6).toFixed(1)} μm
            </text>
            <circle cx={x} cy={y} r={12 * n} fill="#e6c882" stroke={gold} />
            <Arrow x={x - 17} y={y} dy={q.weight * scale} color={gold} />
            <Arrow x={x + 17} y={y} dy={-f * scale} color={blue} />
            <text x={x} y={h - 47}>
              {i === 1 ? 'W = f' : i === 0 ? 'W < f' : 'W > f'}
            </text>
          </g>
        );
      })}
      <text x={w / 2} y={h - 15}>
        {tr('有效重力 W ∝ r³；阻力随 r 增长', 'Weight ∝ r³; drag grows with r')}
      </text>
    </g>
  );
}
function FallInference({
  w,
  h,
  input,
}: {
  w: number;
  h: number;
  input: Partial<OilDropParameters>;
}) {
  const p = oilDropPhysics(input),
    o = oilFallObservation(input),
    small = w < 400,
    cx = small ? w / 2 : 470,
    Y = (t: number) => 68 + (t / o.seconds) * 122;
  return (
    <g>
      <text x={w / 2} y="22" textAnchor="middle">
        {tr('等时段，位移几乎相同', 'Equal times, equal displacement')}
      </text>
      {!small && (
        <g>
          <path d="M145 53V214" stroke="#b4c5ba" />
          {[0, 2, 4, 6].map((t) => (
            <g key={t}>
              <circle cx="145" cy={Y(t)} r="5" fill={gold} />
              <text x="121" y={Y(t) + 6} textAnchor="end">
                {t}s
              </text>
            </g>
          ))}
          <Arrow x={145} y={210} dy={30} />
        </g>
      )}
      <g textAnchor="middle">
        <text x={cx} y={small ? 60 : 78}>
          v↓ = 0.50 / {o.seconds.toFixed(2)}
        </text>
        <text x={cx} y={small ? 91 : 110}>
          = {(o.speed * 1000).toFixed(4)} mm/s
        </text>
        <text x={cx} y={small ? 134 : 151}>
          {tr('阻力 = 有效重力', 'Drag = effective weight')}
        </text>
        <text x={cx} y={small ? 167 : 181}>
          γv↓ = W
        </text>
        <text x={cx} y={small ? 208 : 225}>
          r ≈ {(p.radius * 1e6).toFixed(2)} μm
        </text>
        <text x={cx} y={h - 12}>
          W ≈ {(p.weight / 1e-14).toFixed(2)} × 10⁻¹⁴ N
        </text>
      </g>
    </g>
  );
}
function PlateField({ w, h }: { w: number; h: number }) {
  const small = w < 400,
    cx = small ? 110 : 280,
    left = cx - 76,
    right = cx + 76,
    source = small ? w - 25 : 520,
    top = 55,
    bottom = 215,
    cy = 135;
  return (
    <g>
      <text x={w / 2} y="22" textAnchor="middle">
        {tr('上正下负，电场向下', 'Positive above: field downward')}
      </text>
      <path
        d={`M${left} ${top}H${right}M${left} ${bottom}H${right}`}
        stroke="#708b87"
        strokeWidth="8"
      />
      <path
        d={`M${right} ${top}H${source}V${cy - 22}M${source} ${cy + 22}V${bottom}H${right}`}
        fill="none"
        stroke="#798d83"
        strokeWidth="2"
        data-oil-supply-path="true"
      />
      <rect x={source - 19} y={cy - 22} width="38" height="44" rx="8" fill={pale} stroke={green} />
      <text x={source} y={cy - 5} textAnchor="middle">
        +
      </text>
      <text x={source} y={cy + 15} textAnchor="middle">
        −
      </text>
      <text x={left + 9} y={top - 11}>
        +
      </text>
      <text x={left + 9} y={bottom + 24}>
        −
      </text>
      <Arrow x={cx - 40} y={91} dy={85} color={blue} />
      <text x={cx - 54} y={133}>
        E
      </text>
      <Spot x={cx} y={cy} />
      <Arrow x={cx + 25} y={cy} dy={-43} />
      <text x={cx + 27} y={85}>
        F
      </text>
      <text x={cx - 3} y={cy + 32}>
        −q
      </text>
      <text x={w / 2} y={h - 12} textAnchor="middle">
        {tr('极板间距5 mm · 油滴像放大', '5 mm gap · image magnified')}
      </text>
    </g>
  );
}
function ForceBalance({
  w,
  h,
  d,
  input,
  manual = false,
}: {
  w: number;
  h: number;
  d: OilDirection;
  input: Partial<OilDropParameters>;
  manual?: boolean;
}) {
  const small = w < 400,
    p = oilDropPhysics(input),
    prediction = d.shot === 'charge-prediction',
    base = oilDropPhysics({ ...input, chargeMagnitude: p.chargeMagnitude / (prediction ? 2 : 1) }),
    U = base.balanceVoltage ?? 0,
    events = prediction
      ? d.reveal
        ? [
            { at: 0, voltage: U },
            { at: 3, voltage: U / 2 },
          ]
        : [{ at: 0, voltage: U }]
      : manual
        ? [{ at: 0, voltage: d.voltage }]
        : [
            { at: 0, voltage: 0 },
            { at: 1, voltage: U * 1.45 },
            { at: 3, voltage: U },
          ],
    s = oilTrajectory(
      prediction && !d.reveal ? Math.min(d.physicalTime, 3) : d.physicalTime,
      events,
      input,
      { y: 0, v: prediction ? 0 : p.fallSpeed },
    ),
    f = s.forces,
    cx = small ? 72 : 180,
    cy = 137,
    r = small ? 61 : 102,
    scale = (r * 0.75) / 0.00025,
    sy = cy + s.y * scale;
  const inside = Math.abs(s.y) <= 0.00025,
    vectorX = small ? 167 : 430,
    originY = 137,
    forceScale = Math.min(
      42 / base.weight,
      73 /
        Math.max(
          Math.abs(f.weight),
          Math.abs(f.electric),
          Math.abs(f.viscous),
          Math.abs(f.support),
          1e-30,
        ),
    );
  const fs = [
    { id: 'weight', x: vectorX, value: f.weight, label: 'W', color: gold },
    {
      id: 'electric',
      x: vectorX + (small ? 36 : 70),
      value: f.electric,
      label: '|q|E',
      color: green,
    },
    {
      id: s.contact ? 'support' : 'drag',
      x: vectorX + (small ? 72 : 140),
      value: s.contact ? f.support : f.viscous,
      label: s.contact ? 'N' : 'f',
      color: blue,
    },
  ];
  return (
    <g>
      <text x={w / 2} y="21" textAnchor="middle">
        {prediction
          ? tr('教学试验：同一滴，电荷 ×2', 'Model: same drop, charge ×2')
          : tr('负电油滴 · 显微镜视野', 'Negative drop · microscope view')}
      </text>
      <circle cx={cx} cy={cy} r={r} fill="#283c3a" stroke="#b5c4ba" strokeWidth="4" />
      {[-1, 0, 1].map((i) => (
        <path
          key={i}
          d={`M${cx - r * 0.68} ${cy + i * r * 0.75}h${r * 1.36}`}
          stroke="#a2bcb1"
          opacity={i === 0 ? 0.6 : 0.25}
        />
      ))}
      {inside ? (
        <Spot x={cx} y={sy} />
      ) : (
        <g>
          <path
            d={`M${cx - 6} ${cy + (s.y > 0 ? 1 : -1) * r * 0.75}l6 ${(s.y > 0 ? 1 : -1) * 7}l6 ${(s.y > 0 ? -1 : 1) * 7}`}
            fill="none"
            stroke="#ecd594"
            strokeWidth="2"
          />
          <text x={cx} y={cy + 6} textAnchor="middle" fill="#eff2e8">
            {tr('已离开视野', 'Out of view')}
          </text>
        </g>
      )}
      <g
        data-oil-voltage={s.voltage}
        data-oil-position={s.y}
        data-oil-velocity={s.v}
        data-oil-contact={s.contact ?? 'none'}
        data-oil-net-force={f.net}
      >
        {fs.map((a) => (
          <g key={a.id} data-oil-force={a.id} data-force-newtons={a.value}>
            <text x={a.x} y="58" textAnchor="middle">
              {a.label}
            </text>
            <Arrow
              x={a.x}
              y={originY}
              dy={oilClamp(a.value * forceScale, -73, 73)}
              color={a.color}
            />
            <circle cx={a.x} cy={originY} r="2.5" fill={ink} />
          </g>
        ))}
      </g>
      <text x={w / 2} y={h - 47} textAnchor="middle">
        U = {s.voltage.toFixed(1)} V ·{' '}
        {Math.abs(s.v) < 1e-9
          ? s.contact
            ? tr('接触极板', 'At plate')
            : Math.abs(f.net) < base.weight * 1e-6
              ? tr('悬停', 'Balanced')
              : tr('初始静止', 'Initially still')
          : s.v > 0
            ? tr('下落', 'Falling')
            : tr('上升', 'Rising')}
      </text>
      <text x={w / 2} y={h - 18} textAnchor="middle">
        {prediction && !d.reveal
          ? tr('保持悬停，需要多少电压？', 'What voltage will restore balance?')
          : s.contact
            ? tr('碰到极板，支持力阻止穿越', 'Plate contact stops the drop')
            : tr('同图力箭头等比例；亮点放大', 'One force scale · magnified spot')}
      </text>
    </g>
  );
}
function ChargeInference({
  w,
  h,
  d,
  input,
}: {
  w: number;
  h: number;
  d: OilDirection;
  input: Partial<OilDropParameters>;
}) {
  const p = oilDropPhysics(input),
    u = p.balanceVoltage,
    inv = inferOilCharge(p.fallSpeed, u ?? 0, input),
    x = w / 2;
  return (
    <g textAnchor="middle">
      <text x={x} y="26">
        {tr('同一滴，达到悬停', 'Same drop, now stationary')}
      </text>
      <g transform={`translate(${x} 93)`}>
        <Spot x={0} y={0} />
        <Arrow x={-32} y={0} dy={39} color={gold} />
        <Arrow x={32} y={0} dy={-39} />
        <text x={-54} y="30">
          W
        </text>
        <text x={60} y="-24">
          |q|E
        </text>
      </g>
      <text x={x} y="155">
        |q| U / d = W
      </text>
      <text x={x} y="190">
        U = {u === null ? '—' : u.toFixed(1)} V · d = {(p.gap * 1000).toFixed(0)} mm
      </text>
      <text x={x} y="224">
        |q| = Wd / U
      </text>
      <text x={x} y={h - 12} data-oil-charge-answer={d.reveal ? 'revealed' : 'hidden'}>
        {u === null
          ? tr('不带电，电压不能使它悬停', 'Uncharged: voltage cannot hold it')
          : d.reveal
            ? `≈ ${(inv.chargeMagnitude! / 1e-19).toFixed(2)} × 10⁻¹⁹ C`
            : tr('电荷仍是待求量', 'Charge is still the unknown')}
      </text>
    </g>
  );
}
function HistoricalTimes({
  w,
  h,
  d,
  recordIndex,
}: {
  w: number;
  h: number;
  d: OilDirection;
  recordIndex: number;
}) {
  const small = w < 400,
    left = small ? 44 : 80,
    right = w - 22,
    top = 105,
    bottom = h - 40,
    X = (i: number) => left + ((right - left) * i) / 12,
    Y = (t: number) => bottom - ((bottom - top) * t) / 520,
    idx = Math.round(oilClamp(recordIndex, 0, 11)),
    selected = RISE[idx]!;
  return (
    <g>
      <text x={w / 2} y="21" textAnchor="middle">
        {tr('6号油滴 · 原始计时', 'Drop No. 6 · raw timings')}
      </text>
      <text x={w / 2} y="51" textAnchor="middle">
        {tr('22次下落：均值', '22 falls: mean')} {mean(FALL).toFixed(3)} s
      </text>
      <text x={w / 2} y="79" textAnchor="middle">
        #{selected.id} ↑ {mean(selected.rawSeconds).toFixed(3)} s
      </text>
      <path d={`M${left} ${top}V${bottom}H${right}`} fill="none" stroke="#b0c1b6" />
      <text x={left - 6} y={top + 7} textAnchor="end">
        500
      </text>
      <text x={left - 6} y={bottom + 5} textAnchor="end">
        0
      </text>
      <text x={left - 6} y={top - 12} textAnchor="end">
        s
      </text>
      {RISE.slice(0, 12).map((r, i) => (
        <g key={r.id} data-oil-record={r.id} data-raw-seconds={r.rawSeconds.join(',')}>
          <path d={`M${X(i)} ${bottom}V${Y(mean(r.rawSeconds))}`} stroke="#bfcfc5" />
          {r.rawSeconds.map((s, j) => (
            <circle
              key={j}
              cx={X(i) + (j - (r.rawSeconds.length - 1) / 2) * 2.2}
              cy={Y(s)}
              r={i === idx ? 4.5 : 3.3}
              fill={i === idx ? gold : green}
            />
          ))}
        </g>
      ))}
      <text x={X(12)} y={bottom - 16} textAnchor="middle">
        ?
      </text>
      <text x={left} y={h - 12}>
        1
      </text>
      <text x={X(12)} y={h - 12} textAnchor="middle">
        13
      </text>
      <text x={w / 2} y={h - 12} textAnchor="middle">
        {tr('状态次序', 'State sequence')}
      </text>
    </g>
  );
}
function HistoricalBridge({ w, h }: { w: number; h: number }) {
  const x = w / 2;
  return (
    <g textAnchor="middle">
      <text x={x} y="23">
        {tr('同一滴、同一距离、同一电场', 'Same drop, distance and field')}
      </text>
      <text x={x} y="60">
        W = γv↓
      </text>
      <text x={x} y="97">
        |q|E = W + γv↑
      </text>
      <g transform={`translate(${x} 136)`}>
        <Arrow x={0} y={-12} dy={24} />
      </g>
      <text x={x} y="172">
        |q| = (γD/E)(1/t↓ + 1/t↑)
      </text>
      <text x={x} y="211">
        Δ|q| ∝ Δ(1/t↑)
      </text>
      <text x={x} y={h - 14}>
        {tr('下一图：作者校正后的倒数', 'Next: author-corrected reciprocals')}
      </text>
    </g>
  );
}
function Lattice({ w, h, d }: { w: number; h: number; d: OilDirection }) {
  const small = w < 400,
    left = small ? 30 : 90,
    right = w - 25,
    X = (x: number) => left + ((right - left) * x) / 0.04,
    k = lattice.step * d.candidateScale,
    rows = [2, 3, 0],
    grid = Array.from({ length: Math.floor(0.04 / k) + 1 }, (_, i) => i * k);
  return (
    <g>
      <text x={w / 2} y="21" textAnchor="middle">
        {tr('前8次变化：只拟合步长', 'First 8 changes: fit an increment')}
      </text>
      <text x={w / 2} y="51" textAnchor="middle">
        k = {k.toFixed(6)} s⁻¹
      </text>
      {grid.map((v, i) => (
        <path key={i} d={`M${X(v)} 73V208`} stroke={gold} opacity=".35" strokeDasharray="3 4" />
      ))}
      {rows.map((idx, j) => {
        const c = changes[idx]!,
          y = 87 + j * 51,
          nearest = Math.round(c.magnitude / k) * k;
        return (
          <g key={idx}>
            <path d={`M${left} ${y}H${right}`} stroke="#d8e1d9" />
            <path d={`M${X(nearest)} ${y}H${X(c.magnitude)}`} stroke={red} strokeWidth="3" />
            <circle
              data-oil-fixed-change={idx}
              data-observed-change={c.magnitude}
              cx={X(c.magnitude)}
              cy={y}
              r="5"
              fill={green}
            />
            <circle cx={X(nearest)} cy={y} r="7" fill="none" stroke={gold} />
            <text x={left} y={y + 24}>
              {c.from}→{c.to}: {c.magnitude.toFixed(5)} s⁻¹
            </text>
          </g>
        );
      })}
      <text x={w / 2} y={h - 31} textAnchor="middle">
        {d.candidateScale === 2
          ? tr('两倍步长漏掉小跳变', 'Double steps miss the small jump')
          : d.candidateScale === 0.5
            ? tr('更细步长也能容纳这些点', 'Finer steps also fit')
            : tr('约1、3、6步，点不移动', 'About 1, 3, 6 steps')}
      </text>
      <text x={w / 2} y={h - 7} textAnchor="middle">
        {tr('点：记录；空心圈：候选', 'Dots: records; rings: candidate')}
      </text>
    </g>
  );
}
function HeldOut({ w, h, d }: { w: number; h: number; d: OilDirection }) {
  const prior = RISE[11]!.correctedInverseSeconds,
    pred = prior + 2 * lattice.step,
    actual = RISE[12]!.correctedInverseSeconds,
    x = w / 2;
  return (
    <g textAnchor="middle">
      <text x={x} y="23">
        {tr('最后一次变化未参与拟合', 'Last change was not used to fit')}
      </text>
      <text x={x} y="65">
        (1/t)₁₂ = {prior.toFixed(5)} s⁻¹
      </text>
      <text x={x} y="101">
        {tr('若增加2步', 'If it increases by 2 steps')}
      </text>
      <text x={x} y="139">
        (1/t)₁₃ ≈ {pred.toFixed(5)} s⁻¹
      </text>
      <path d={`M${x - 81} 157h162`} stroke="#bccdc2" />
      <g data-oil-heldout={d.reveal ? 'revealed' : 'hidden'}>
        {d.reveal ? (
          <>
            <text x={x} y="191">
              {tr('记录', 'Record')}: {actual.toFixed(5)} s⁻¹
            </text>
            <text x={x} y="226">
              {tr('差值', 'Difference')}: {(actual - pred).toFixed(5)} s⁻¹
            </text>
          </>
        ) : (
          <text x={x} y="205">
            {tr('第13组记录会落在哪里？', 'Where will record 13 land?')}
          </text>
        )}
      </g>
      <text x={x} y={h - 12}>
        {tr('共同小步 ≠ 单表证明最小单位', 'Shared steps ≠ proof of a minimum')}
      </text>
    </g>
  );
}
export function OilDropArtwork({
  width = 640,
  direction,
  input = {},
  manual = false,
  recordIndex,
  cover = false,
}: {
  width?: number;
  direction?: OilDirection;
  input?: Partial<OilDropParameters>;
  manual?: boolean;
  recordIndex?: number;
  cover?: boolean;
}) {
  const w = cover ? 640 : width,
    h = w < 400 ? 270 : 300,
    d = direction ?? oilDirector(1, 35),
    id = useId(),
    p = { ...input, chargeMagnitude: oilDropPhysics(input).chargeMagnitude * d.chargeScale };
  return (
    <svg
      className="oildrop-art"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={shotName(d.shot)}
      data-oil-shot={d.shot}
      id={id}
    >
      {d.shot === 'reticle' && <Reticle w={w} h={h} d={d} input={p} />}
      {d.shot === 'radius-candidates' && <RadiusCandidates w={w} h={h} input={p} />}{' '}
      {d.shot === 'fall-inference' && <FallInference w={w} h={h} input={p} />}
      {d.shot === 'plate-field' && <PlateField w={w} h={h} />}{' '}
      {(d.shot === 'force-balance' || d.shot === 'charge-prediction') && (
        <ForceBalance w={w} h={h} d={d} input={p} manual={manual} />
      )}
      {d.shot === 'charge-inference' && <ChargeInference w={w} h={h} d={d} input={p} />}
      {d.shot === 'historical-times' && (
        <HistoricalTimes
          w={w}
          h={h}
          d={d}
          recordIndex={recordIndex ?? Math.floor(d.progress * 2.99)}
        />
      )}
      {d.shot === 'historical-bridge' && <HistoricalBridge w={w} h={h} />}
      {d.shot === 'lattice' && <Lattice w={w} h={h} d={d} />}
      {d.shot === 'held-out' && <HeldOut w={w} h={h} d={d} />}
    </svg>
  );
}
export default function OilDropLab() {
  const film = useShowcase(),
    [phone, setPhone] = useState(false),
    [shot, setShot] = useState<OilShot>('reticle'),
    [time, setTime] = useState(0),
    [voltage, setVoltage] = useState(141),
    [charge, setCharge] = useState(6.4),
    [candidateScale, setCandidateScale] = useState(1),
    [reveal, setReveal] = useState(false),
    [record, setRecord] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia('(max-width:640px)'),
      update = () => setPhone(m.matches);
    update();
    m.addEventListener('change', update);
    return () => m.removeEventListener('change', update);
  }, []);
  const d: OilDirection = film.watch
    ? oilDirector(film.chapter, film.chapterTime, browserLocale())
    : {
        shot,
        progress: time / 8,
        physicalTime: time,
        voltage,
        chargeScale: shot === 'charge-prediction' ? 2 : 1,
        reveal,
        candidateScale,
      };
  const choose = (v: OilShot) => {
    setShot(v);
    setReveal(false);
    setTime(0);
  };
  return (
    <div className="oildrop">
      <div className="oildrop-heading">{shotName(d.shot)}</div>
      <OilDropArtwork
        width={phone ? 268 : 640}
        direction={d}
        input={film.watch ? {} : { chargeMagnitude: charge * 1e-19 }}
        manual={!film.watch}
        recordIndex={film.watch ? undefined : record}
      />
      {!film.watch && (
        <div className="oildrop-controls">
          <label>
            {tr('选择因果镜头', 'Choose a causal view')}
            <select value={shot} onChange={(e) => choose(e.target.value as OilShot)}>
              {shots.map((s) => (
                <option key={s} value={s}>
                  {shotName(s)}
                </option>
              ))}
            </select>
          </label>
          {['reticle', 'force-balance', 'charge-prediction'].includes(shot) && (
            <Range
              label={tr('本次试验时间', 'Time in this trial')}
              min={0}
              max={8}
              step={0.02}
              value={time}
              onChange={setTime}
              unit="s"
            />
          )}
          {shot === 'force-balance' && (
            <>
              <Range
                label={tr('极板电压（改变后从刻线重试）', 'Voltage (starts a new trial)')}
                min={-300}
                max={400}
                step={0.1}
                value={voltage}
                unit="V"
                onChange={(v) => {
                  setVoltage(v);
                  setTime(0);
                }}
              />
              <Range
                label={tr('模型电荷大小', 'Model charge magnitude')}
                min={1}
                max={12}
                step={0.1}
                value={charge}
                unit="×10⁻¹⁹ C"
                onChange={(v) => {
                  setCharge(v);
                  setTime(0);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setVoltage(oilDropPhysics({ chargeMagnitude: charge * 1e-19 }).balanceVoltage!);
                  setTime(0);
                }}
              >
                {tr('用当前模型的平衡电压试验', 'Try the model balance voltage')}
              </button>
            </>
          )}
          {['charge-inference', 'charge-prediction', 'held-out'].includes(shot) && (
            <button
              type="button"
              aria-pressed={reveal}
              onClick={() => {
                setReveal(!reveal);
                if (shot === 'charge-prediction') setTime(reveal ? 2 : 6);
              }}
            >
              {reveal ? tr('重新预测', 'Predict again') : tr('揭晓并检验', 'Reveal and test')}
            </button>
          )}
          {shot === 'lattice' && (
            <div className="oildrop-buttons">
              {[0.5, 1, 2].map((n) => (
                <button
                  type="button"
                  key={n}
                  aria-pressed={candidateScale === n}
                  onClick={() => setCandidateScale(n)}
                >
                  {tr('候选步长', 'Candidate step')} ×{n}
                </button>
              ))}
            </div>
          )}
          {shot === 'historical-times' && (
            <>
              <label>
                {tr('选择原始状态（最后一次另揭晓）', 'Recorded state (last revealed separately)')}
                <select value={record} onChange={(e) => setRecord(Number(e.target.value))}>
                  {RISE.slice(0, 12).map((r, i) => (
                    <option key={r.id} value={i}>
                      #{r.id} · {r.rawSeconds.join(' / ')} s
                    </option>
                  ))}
                </select>
              </label>
              <p>
                {tr('原始重复读数', 'Original repeated readings')}:{' '}
                {RISE[record]!.rawSeconds.join(' / ')} s
              </p>
              <p>
                {tr('作者校正倒数', 'Author-corrected reciprocal')}:{' '}
                {RISE[record]!.correctedInverseSeconds} s⁻¹
              </p>
            </>
          )}
          <details>
            <summary>{tr('记录、模型与精度边界', 'Records, model and precision')}</summary>
            <p>
              {tr(
                '前两章是未知电荷的教学试验，不假定电子数。显微镜亮点是散射像，不能直接量油滴直径；滑移修正、浮力、黏度与密度共同参与反求。调电压会从刻线开始新试验，运动按该次电压历史积分。',
                'The first two chapters are a teaching trial with an unknown charge, not an assumed electron count. The microscope spot is scattered light, not a direct diameter measurement. Slip, buoyancy, viscosity and density enter the inverse calculation. A voltage change starts a new marked trial, integrated over its voltage history.',
              )}
            </p>
            <p>
              {tr(
                '历史点取自1913年表IV第6号油滴：第1/4列为原始计时，第5列为作者校正的倒数。本页从第5列重新计算变化，未抄含算术不一致的第6列。前8次变化拟合步长，最后一次教学留出；更细子步长也能容纳有限记录。',
                'Historical points come from 1913 Table IV, Drop No. 6. Columns 1/4 are raw times; column 5 contains author-corrected reciprocals. Changes are recomputed from column 5, rather than copying the arithmetically inconsistent column 6. The first 8 changes fit the step; the last is a teaching holdout. Finer substeps also accommodate finite records.',
              )}
            </p>
            <p>
              {tr(
                '这里不从一张表重新精测元电荷。现代e=1.602176634×10⁻¹⁹ C是SI定义值，不能冒充1913年的测量精度。',
                'This is not a new precision determination of elementary charge from one table. Modern e=1.602176634×10⁻¹⁹ C is an SI defining value, not the precision of a 1913 measurement.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
