import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  cellClamp as clamp,
  acidCell,
  simpleCell,
  daniell,
  saltBridge,
  bridgeIon,
  fuelCycle,
  alongWire,
  type Point,
} from '../../models/chem-galvanic-cells';
import '../../styles/chem-galvanic-cells.css';
export default function ChemGalvanicCells() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z),
    variants = [
      'chem-required-2-experiment-6-3',
      'chem-required-2-inquiry-p37',
      'chem-required-2-activity-6',
      'chem-elective-1-experiment-4-1',
      'chem-elective-1-activity-5',
    ];
  const [mode0, setMode] = useState(Math.max(0, variants.indexOf(f.variant ?? ''))),
    [view, setView] = useState(0),
    [progress, setProgress] = useState(0.6),
    [connected, setConnected] = useState(true),
    [wet, setWet] = useState(true),
    [material, setMaterial] = useState<'Zn' | 'Fe' | 'Cu'>('Zn'),
    [cathode, setCathode] = useState<'Cu' | 'C'>('Cu'),
    [count, setCount] = useState(1),
    [same, setSame] = useState(false),
    [paper, setPaper] = useState(false),
    [lift, setLift] = useState(0),
    [zinc, setZinc] = useState(1),
    [copper, setCopper] = useState(1),
    [load, setLoad] = useState(1000),
    [charge, setCharge] = useState(60),
    [phase, setPhase] = useState<'charge' | 'isolated' | 'discharge'>('discharge'),
    [notes, setNotes] = useState('');
  const mode = f.watch
      ? f.chapter < 3
        ? 0
        : f.chapter < 6
          ? 1
          : f.chapter < 8
            ? 2
            : f.chapter < 11
              ? 3
              : 4
      : mode0,
    starts = [0, 3, 6, 8, 11],
    local = f.watch ? f.chapter - starts[mode] : view,
    p = clamp(f.watch ? f.chapterProgress : progress),
    cx = w / 2,
    cycle = f.watch ? (f.chapterTime * 0.28) % 1 : p;
  const names = [
      s('锌铜与稀酸', 'Zinc–copper in acid'),
      s('设计简易电池', 'Design a simple cell'),
      s('构成要素对照', 'Test cell requirements'),
      s('带盐桥的电池', 'A cell with a salt bridge'),
      s('电解后的燃料电池', 'Fuel cell after electrolysis'),
    ],
    views = [
      [
        s('导线尚未接通', 'Before the wire is connected'),
        s('接通外电路', 'Close the external circuit'),
        s('电子与离子的通路', 'Electron and ion routes'),
      ],
      [
        s('水果提供离子通路', 'Fruit provides an ionic route'),
        s('湿纸与电极材料', 'Wet paper and electrode materials'),
        s('串联与带载能力', 'Series cells and loading'),
      ],
      [s('只有金属接触', 'Metal contact alone'), s('电极材料对照', 'Compare electrode materials')],
      [
        s('两个半电池接通', 'Connect the two half-cells'),
        s('沉积与电荷守恒', 'Deposition and charge balance'),
        s('把盐桥移出液面', 'Lift the bridge above the liquid'),
      ],
      [
        s('外电源驱动电解', 'External power drives electrolysis'),
        s('先断开外电源', 'Disconnect the power supply'),
        s('有限气体驱动放电', 'Finite stored gas powers discharge'),
      ],
    ];
  const aWet = f.watch ? !(mode === 2 && local === 0) : wet,
    aConnected = f.watch ? (mode === 0 ? local > 0 : true) : connected,
    mat = f.watch ? (mode === 2 && local === 1 && p > 0.66 ? 'Cu' : 'Zn') : material,
    cat = f.watch ? (mode === 2 && local === 1 && p > 0.33 ? 'C' : 'Cu') : cathode,
    a = acidCell(mat, cat, aConnected, aWet, p * 120);
  const kind = f.watch
      ? mode === 1 && local === 1
        ? 'paper'
        : 'fruit'
      : paper
        ? 'paper'
        : 'fruit',
    n = f.watch ? (mode === 1 && local === 2 ? 1 + Math.min(2, Math.floor(p * 3)) : 1) : count,
    si = simpleCell(
      n,
      kind,
      f.watch ? true : wet,
      f.watch ? local !== 1 || p < 0.65 : !same,
      f.watch ? 1000 : load,
    ),
    liftNow = f.watch ? (local === 2 ? clamp((p - 0.25) / 0.5) : 0) : lift,
    g = saltBridge(w, liftNow),
    rawD = daniell(
      f.watch ? (local === 0 ? p * 600 : local === 1 ? 600 + p * 3000 : 3600) : p * 3600,
      f.watch ? true : connected,
      g.conducting,
      f.watch ? 1 : zinc,
      f.watch ? 1 : copper,
    ),
    bridgeHeld = daniell(3600, true, true, 1, 1),
    d =
      f.watch && mode === 3 && local === 2
        ? {
            ...bridgeHeld,
            current: g.conducting ? bridgeHeld.current : 0,
            openCircuit: !g.conducting,
          }
        : rawD,
    fuelPhase = f.watch
      ? (['charge', 'isolated', 'discharge'] as const)[local as 0 | 1 | 2]
      : phase,
    fu = fuelCycle(
      f.watch ? (local === 0 ? p * 60 : 60) : charge,
      f.watch ? p * 120 : p * 120,
      fuelPhase,
    );
  const meter = (x: number, y: number, current: number, max = 0.006) => {
    const theta = -0.85 + 1.7 * clamp(current / max);
    return (
      <g>
        <circle cx={x} cy={y} r="23" fill="#f7f8ec" stroke="#bdccc5" strokeWidth="2" />
        <path
          d={`M${x - 15} ${y + 4}Q${x} ${y - 19} ${x + 15} ${y + 4}`}
          stroke="#b1beb9"
          fill="none"
        />
        <path
          d={`M${x} ${y + 8}l${18 * Math.sin(theta)} ${-18 * Math.cos(theta)}`}
          stroke="#708d80"
          strokeWidth="2"
        />
        <text x={x} y={y + 28} textAnchor="middle">
          A
        </text>
      </g>
    );
  };
  const wire = (points: Point[], active: boolean, reverse = false) => (
    <g>
      <polyline
        points={points.map((a) => `${a.x},${a.y}`).join(' ')}
        stroke="#98aaa6"
        strokeWidth="2.5"
        fill="none"
        strokeLinejoin="round"
      />
      {active &&
        Array.from({ length: 6 }, (_, i) => {
          const t = (cycle + i / 6) % 1,
            q = alongWire(points, reverse ? 1 - t : t);
          return <circle key={i} cx={q.x} cy={q.y} r="2.8" fill="#a68fb1" />;
        })}
    </g>
  );
  const bubble = (x: number, y: number, r = 3) => (
    <circle cx={x} cy={y} r={r} fill="#f6faf4" stroke="#a8bfc0" strokeWidth="1.5" />
  );
  const beaker = (x: number, color: string) => (
    <g>
      <path
        d={`M${x - 44} 133V252Q${x - 44} 269 ${x - 28} 269H${x + 28}Q${x + 44} 269 ${x + 44} 252V133`}
        fill="#eff7f1"
        fillOpacity=".35"
        stroke="#b7cecb"
        strokeWidth="2"
      />
      <path
        d={`M${x - 42} 160V252Q${x - 42} 267 ${x - 28} 267H${x + 28}Q${x + 42} 267 ${x + 42} 252V160Z`}
        fill={color}
        fillOpacity=".42"
      />
      <path d={`M${x - 42} 160Q${x} 165 ${x + 42} 160`} stroke="#b1ceca" fill="none" />
    </g>
  );
  const acidShot = () => {
    const left = cx - 51,
      right = aWet ? cx + 51 : cx - 37,
      route = [
        { x: left, y: 111 },
        { x: left, y: 49 },
        { x: cx - 24, y: 49 },
      ],
      route2 = [
        { x: cx + 24, y: 49 },
        { x: right, y: 49 },
        { x: right, y: 111 },
      ];
    return (
      <>
        {aWet && (
          <>
            <path
              d={`M${cx - 92} 128V250Q${cx - 92} 267 ${cx - 76} 267H${cx + 76}Q${cx + 92} 267 ${cx + 92} 250V128`}
              stroke="#b7cdca"
              strokeWidth="2"
              fill="#eef6f1"
              fillOpacity=".4"
            />
            <path
              d={`M${cx - 90} 157V249Q${cx - 90} 265 ${cx - 75} 265H${cx + 75}Q${cx + 90} 265 ${cx + 90} 249V157Z`}
              fill="#c7ded7"
              fillOpacity=".42"
            />
            <text x={cx} y="293" textAnchor="middle">
              {s('稀硫酸', 'Dilute sulfuric acid')}
            </text>
          </>
        )}
        {wire(route, a.external)}
        {wire(route2, a.external)}
        {!aConnected && (
          <>
            <path d={`M${left + 12} 49h15`} stroke="#f8faf2" strokeWidth="7" />
            <path d={`M${left + 12} 49l15 -13`} stroke="#98aaa6" strokeWidth="2.5" />
          </>
        )}
        {meter(cx, 49, a.current)}
        <rect
          x={left - 7}
          y="111"
          width="14"
          height="124"
          rx="3"
          fill={mat === 'Cu' ? '#bb9176' : '#a8b3b4'}
        />
        <rect
          x={right - 7}
          y="111"
          width="14"
          height="124"
          rx="3"
          fill={cat === 'C' ? '#6d7b7a' : '#bb9176'}
        />
        <text x={left} y="101" textAnchor="middle">
          {mat}
          {a.external ? ' −' : ''}
        </text>
        <text x={right + (aWet ? 0 : 27)} y="101" textAnchor="middle">
          {cat}
          {a.external ? ' +' : ''}
        </text>
        {a.localHydrogen > 0 &&
          Array.from({ length: a.external ? 1 : 4 }, (_, i) => {
            const t = (cycle + i / 4) % 1;
            return (
              <g key={i} opacity={Math.sin(t * Math.PI)}>
                {bubble(left - 11 - 3 * Math.sin(t * 2), 229 - 90 * t)}
              </g>
            );
          })}
        {a.external && (
          <>
            {[0, 1].map((i) => {
              const t = cycle;
              return (
                <g key={i}>
                  {i === 0 && (
                    <circle
                      cx={left + 8 + t * 30}
                      cy={218 - i * 24}
                      r="4"
                      fill="#bbc6c5"
                      opacity={1 - t}
                    />
                  )}
                  <circle
                    cx={cx + 5 + i * 16 + (34 - i * 16) * clamp(t / 0.55)}
                    cy={
                      209 +
                      (i ? 1 : -1) * (5 - 2 * clamp((t - 0.5) / 0.2)) -
                      (t > 0.7 ? ((t - 0.7) / 0.3) * 62 : 0)
                    }
                    r="3"
                    fill={t < 0.55 ? '#e5e6cf' : '#f3f8ee'}
                    stroke="#a9beb7"
                  />
                </g>
              );
            })}
            <text x={cx - 20} y="244" textAnchor="middle">
              {mat}²⁺
            </text>
            <text x={right + 28} y="174" textAnchor="middle">
              H₂
            </text>
            {mode === 0 && local === 2 && (
              <>
                <path
                  d={`M${cx - 5} 250h-22m6 -4l-6 4l6 4M${cx + 5} 250h22m-6 -4l6 4l-6 4`}
                  stroke="#a4b69b"
                  fill="none"
                />
                <text x={cx} y="339" textAnchor="middle">
                  SO₄²⁻ ← · → H⁺
                </text>
              </>
            )}
          </>
        )}
        <text x={cx} y={aWet ? 316 : 282} textAnchor="middle">
          {(a.current * 1000).toFixed(1)} mA · {s('示意', 'model')}
        </text>
        {!aWet && (
          <text x={cx} y="261" textAnchor="middle">
            {s('金属相接 · 无电解质', 'Metals touch · no electrolyte')}
          </text>
        )}
      </>
    );
  };
  const fruitShot = () => {
    const fruit = kind === 'fruit',
      ww = Math.min(w - 50, 190),
      xx = cx - 36,
      rr = cx + 36,
      first = 87,
      last = first + (si.count - 1) * 70;
    return (
      <>
        {wire(
          [
            { x: xx, y: first },
            { x: 25, y: first },
            { x: 25, y: 36 },
            { x: cx - 24, y: 36 },
          ],
          (local === 2 ? si.ledCurrent : si.current) > 0,
        )}
        {wire(
          [
            { x: cx + 24, y: 36 },
            { x: w - 16, y: 36 },
            { x: w - 16, y: last },
            { x: rr, y: last },
          ],
          (local === 2 ? si.ledCurrent : si.current) > 0,
        )}
        {meter(cx, 36, local === 2 ? si.ledCurrent : si.current, 0.0005)}
        {local === 2 && (
          <g>
            <circle
              cx={w - 16}
              cy="74"
              r="8"
              fill={`rgba(207,193,111,${0.12 + si.brightness * 0.88})`}
              stroke="#adac82"
            />
            <path d={`M${w - 20} 78l4 -7l4 7Z M${w - 20} 70h8`} stroke="#8e956f" fill="none" />
            <path
              d={`M${w - 26} 69l-7 -7m0 4v-4h4`}
              stroke="#b8b179"
              fill="none"
              opacity={si.brightness}
            />
          </g>
        )}
        {Array.from({ length: si.count }, (_, i) => {
          const y = 115 + i * 70,
            active = f.watch ? local !== 1 || p < 0.65 : !same;
          return (
            <g key={i}>
              {fruit ? (
                <>
                  <ellipse
                    cx={cx}
                    cy={y + 14}
                    rx={Math.min(76, ww / 2)}
                    ry="29"
                    fill="#dddba9"
                    stroke="#c0c58f"
                    strokeWidth="2"
                  />
                  <ellipse
                    cx={cx}
                    cy={y + 14}
                    rx={Math.min(66, ww / 2 - 9)}
                    ry="23"
                    fill="#ebe9c4"
                  />
                  {[-1, 0, 1].map((j) => (
                    <path
                      key={j}
                      d={`M${cx} ${y + 14}l${j * 42} -20`}
                      stroke="#d1d4a2"
                      fill="none"
                    />
                  ))}
                </>
              ) : (
                <>
                  <rect
                    x={cx - 70}
                    y={y + 2}
                    width="140"
                    height="29"
                    rx="10"
                    fill={wet || f.watch ? '#c6d9d2' : '#e6e6d7'}
                    stroke="#afc5bc"
                  />
                  {Array.from({ length: 7 }, (_, k) => (
                    <path
                      key={k}
                      d={`M${cx - 62 + k * 20} ${y + 6}q-5 8 0 19`}
                      stroke="#dce6d8"
                      fill="none"
                    />
                  ))}
                </>
              )}
              {fruit && !f.watch && !wet && (
                <path d={`M${cx} ${y - 7}v42`} stroke="#fafbf0" strokeWidth="7" />
              )}
              <rect
                x={xx - 5}
                y={y - 28}
                width="10"
                height="53"
                rx="2"
                fill={active ? '#a8b4b5' : '#bb927c'}
              />
              <rect x={rr - 5} y={y - 28} width="10" height="53" rx="2" fill="#bb927c" />
              <text x={xx} y={y - 36} textAnchor="middle">
                {active ? 'Zn' : 'Cu'}
              </text>
              <text x={rr} y={y - 36} textAnchor="middle">
                Cu
              </text>
              {i < si.count - 1 &&
                wire(
                  [
                    { x: xx, y: y + 42 },
                    { x: xx, y: y + 39 },
                    { x: w - 30, y: y + 39 },
                    { x: w - 30, y: y - 28 },
                    { x: rr, y: y - 28 },
                  ],
                  (local === 2 ? si.ledCurrent : si.current) > 0,
                )}
            </g>
          );
        })}
        {si.count === 1 && (
          <>
            <text x={cx} y="207" textAnchor="middle">
              {fruit
                ? s('水果电解质', 'Fruit electrolyte')
                : s('盐水浸湿滤纸', 'Saltwater-wet paper')}
            </text>
            <text x={cx} y="240" textAnchor="middle">
              {fruit ? (
                '2H⁺ + 2e⁻ → H₂'
              ) : (
                <>
                  <tspan x={cx}>O₂ + 2H₂O + 4e⁻</tspan>
                  <tspan x={cx} dy="24">
                    → 4OH⁻
                  </tspan>
                </>
              )}
            </text>
          </>
        )}
        <text x={cx} y={si.count === 3 ? 312 : 286} textAnchor="middle">
          {si.emf.toFixed(2)} V · {si.count} × {si.single.toFixed(2)}
        </text>
        {local === 2 ? (
          <>
            <text x={cx} y="344" textAnchor="middle">
              LED {(si.ledCurrent * 1000).toFixed(2)} mA
            </text>
          </>
        ) : (
          <text x={cx} y={si.count === 3 ? 344 : 318} textAnchor="middle">
            {(si.current * 1000).toFixed(2)} mA · r={si.internal} Ω
          </text>
        )}
      </>
    );
  };
  const bridgeShot = () => {
    const lx = g.left - 13,
      rx = g.right + 13;
    return (
      <>
        {beaker(g.left, '#c9dcd3')}
        {beaker(g.right, `rgba(101,158,194,${0.25 + (0.7 * d.cu) / d.cu0})`)}
        {wire(
          [
            { x: lx, y: 113 },
            { x: lx, y: 24 },
            { x: cx - 24, y: 24 },
          ],
          d.current > 0,
        )}
        {wire(
          [
            { x: cx + 24, y: 24 },
            { x: rx, y: 24 },
            { x: rx, y: 113 },
          ],
          d.current > 0,
        )}
        {meter(cx, 24, d.current)}
        <rect
          x={lx - d.zincWidth / 2}
          y="113"
          width={d.zincWidth}
          height="124"
          rx="2"
          fill="#aab7b5"
        />
        <rect
          x={rx - d.copperWidth / 2}
          y="113"
          width={d.copperWidth}
          height="124"
          rx="2"
          fill="#b9947e"
        />
        <text x={lx - 19} y="106" textAnchor="middle">
          Zn −
        </text>
        <text x={rx + 19} y="106" textAnchor="middle">
          Cu +
        </text>
        <g transform={`translate(0 ${g.dy})`}>
          <path d={g.path} stroke="#d4ded5" strokeWidth="13" fill="none" />
          <path d={g.path} stroke="#f3f2de" strokeWidth="8" fill="none" />
        </g>
        {g.conducting &&
          d.current > 0 &&
          (['left', 'right'] as const).map((dir) =>
            Array.from({ length: 3 }, (_, i) => {
              const q = bridgeIon(w, (cycle + i / 3) % 1, dir, liftNow);
              return (
                <circle
                  key={dir + i}
                  cx={q.x}
                  cy={q.y}
                  r="2.5"
                  fill={dir === 'left' ? '#a2ae83' : '#bc9bba'}
                />
              );
            }),
          )}
        <text x={g.left} y="293" textAnchor="middle">
          ZnSO₄
        </text>
        <text x={g.right} y="293" textAnchor="middle">
          CuSO₄
        </text>
        <text x={cx} y="319" textAnchor="middle">
          Cl⁻ ← {s('盐桥', 'bridge')} → K⁺
        </text>
        {local !== 1 && (
          <text x={cx} y="345" textAnchor="middle">
            {(d.current * 1000).toFixed(2)} mA · E={d.emf.toFixed(3)} V
          </text>
        )}
        {local === 1 && (
          <text x={cx} y="345" textAnchor="middle">
            Zn −{(d.zincLoss * 1000).toFixed(2)} mg · Cu +{(d.copperGain * 1000).toFixed(2)} mg
          </text>
        )}
        {local === 1 &&
          d.current > 0 &&
          Array.from({ length: 3 }, (_, i) => {
            const t = (cycle + i / 3) % 1;
            return (
              <g key={i}>
                <circle
                  cx={lx + d.zincWidth / 2 + 4 + t * 17}
                  cy={205 + i * 14}
                  r="3"
                  fill="#acbcb9"
                  opacity={1 - t}
                />
                <circle
                  cx={rx - d.copperWidth / 2 - 3 - (1 - clamp(t / 0.8)) * 20}
                  cy={205 + i * 14}
                  r="3"
                  fill={t < 0.8 ? '#86abc5' : '#b9947e'}
                  opacity={t < 0.8 ? 1 : 1 - (t - 0.8) / 0.2}
                />
              </g>
            );
          })}
      </>
    );
  };
  const fuelShot = () => {
    const L = cx - 54,
      R = cx + 54,
      tube = `M${L} 124V207Q${L} 235 ${cx} 235Q${R} 235 ${R} 207V124`,
      liquid = `M${L} 157V207Q${L} 235 ${cx} 235Q${R} 235 ${R} 207V157`;
    const ratio = fu.storedQ ? fu.qLeft / fu.storedQ : 0;
    return (
      <>
        <path d={tube} stroke="#b9cfca" strokeWidth="52" fill="none" />
        <path d={tube} stroke="#f4f8ec" strokeWidth="48" fill="none" />
        <path d={liquid} stroke="#c8ddd4" strokeWidth="42" fill="none" />
        <path
          d={`M${L} 160V198`}
          stroke="#d59bb3"
          strokeOpacity={Math.min(0.6, fu.ohRemaining * 700)}
          strokeWidth="40"
          fill="none"
        />
        {wire(
          [
            { x: L, y: 105 },
            { x: L, y: 43 },
            { x: cx - 20, y: 43 },
          ],
          fu.K1,
          true,
        )}
        {wire(
          [
            { x: cx + 20, y: 43 },
            { x: R, y: 43 },
            { x: R, y: 105 },
          ],
          fu.K1,
          true,
        )}
        <rect x={cx - 20} y="27" width="40" height="31" rx="7" fill="#e1e7d5" stroke="#b6c7b6" />
        <text x={cx} y="49" textAnchor="middle">
          DC
        </text>
        <text x={cx - 25} y="24" textAnchor="middle">
          −
        </text>
        <text x={cx + 25} y="24" textAnchor="middle">
          +
        </text>
        {wire(
          [
            { x: L, y: 105 },
            { x: L, y: 81 },
            { x: cx - 17, y: 81 },
          ],
          fu.K2,
        )}
        {wire(
          [
            { x: cx + 17, y: 81 },
            { x: R, y: 81 },
            { x: R, y: 105 },
          ],
          fu.K2,
        )}
        <circle cx={cx} cy="81" r="16" fill="#f7f8ec" stroke="#b9cbbf" />
        <text x={cx} y="87" textAnchor="middle">
          A
        </text>
        {[
          { on: fu.K1, y: 43, name: 'K1' },
          { on: fu.K2, y: 81, name: 'K2' },
        ].map((k) => (
          <g key={k.name}>
            <path d={`M${L + 9} ${k.y}h14`} stroke="#f6f9ef" strokeWidth="8" />
            <path d={`M${L + 9} ${k.y}l14 ${k.on ? 0 : -9}`} stroke="#889e95" strokeWidth="2.5" />
            <text x={L + 12} y={k.y - 13} textAnchor="middle">
              {k.name}
            </text>
          </g>
        ))}
        {[L, R].map((x, i) => (
          <g key={i}>
            <rect x={x - 6} y="105" width="12" height="118" rx="3" fill="#627875" />
            <text x={x} y="278" textAnchor="middle">
              {i ? 'O₂' : 'H₂'}
            </text>
            {fu.K1 &&
              Array.from({ length: i ? 2 : 4 }, (_, j) => {
                const t = (cycle + j / (i ? 2 : 4)) % 1;
                return (
                  <g key={j} opacity={Math.sin(t * Math.PI)}>
                    {bubble(x + (i ? -12 : 12), 220 - t * 75, i ? 3 : 2.8)}
                  </g>
                );
              })}
            {!fu.K1 && ratio > 0 && (
              <g opacity={Math.sqrt(ratio)}>
                {bubble(
                  x + (i ? -12 : 12),
                  195,
                  Math.max(0.3, 6 * Math.cbrt(ratio * (i ? 0.5 : 1))),
                )}
              </g>
            )}
          </g>
        ))}
        <text x={cx} y="306" textAnchor="middle">
          {fu.K1 ? 'I = 200 mA' : `I = ${(fu.current * 1000).toFixed(2)} mA`}
        </text>
        <text x={cx} y="334" textAnchor="middle">
          H₂ {(fu.hydrogen * 1e6).toFixed(2)} / O₂ {(fu.oxygen * 1e6).toFixed(2)} µmol
        </text>
      </>
    );
  };
  const height = mode === 1 && (local === 2 || si.count === 3) ? 360 : mode === 3 ? 365 : 350;
  return (
    <div className="chem-galvanic" ref={host} data-mode={mode} data-view={local}>
      <div className="chem-galvanic-head">{views[mode][local]}</div>
      <svg viewBox={`0 0 ${w} ${height}`} role="img" aria-label={views[mode][local]}>
        {mode === 0 || mode === 2
          ? acidShot()
          : mode === 1
            ? fruitShot()
            : mode === 3
              ? bridgeShot()
              : fuelShot()}
      </svg>
      {!f.watch && (
        <div className="chem-galvanic-controls">
          <div className="chem-galvanic-buttons">
            {names.map((v, i) => (
              <button
                key={v}
                aria-pressed={mode === i}
                onClick={() => {
                  setMode(i);
                  setView(0);
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="chem-galvanic-buttons">
            {views[mode].map((v, i) => (
              <button key={v} aria-pressed={local === i} onClick={() => setView(i)}>
                {v}
              </button>
            ))}
          </div>
          <label>
            {s('观察进度', 'Observation progress')}
            <input
              type="range"
              min="0"
              max="1"
              step=".01"
              value={progress}
              onChange={(e) => setProgress(+e.target.value)}
            />
          </label>
          {(mode === 0 || mode === 2) && (
            <>
              <div className="chem-galvanic-buttons">
                {(['Zn', 'Fe', 'Cu'] as const).map((v) => (
                  <button key={v} aria-pressed={material === v} onClick={() => setMaterial(v)}>
                    {v}
                  </button>
                ))}
                {(['Cu', 'C'] as const).map((v) => (
                  <button key={v} aria-pressed={cathode === v} onClick={() => setCathode(v)}>
                    {s('另一个电极', 'Other electrode')} {v}
                  </button>
                ))}
              </div>
            </>
          )}
          {mode !== 4 && (
            <div className="chem-galvanic-buttons">
              {mode !== 1 && (
                <button aria-pressed={connected} onClick={() => setConnected(!connected)}>
                  {s('外电路接通', 'External circuit closed')}
                </button>
              )}
              {mode !== 3 && (
                <button aria-pressed={wet} onClick={() => setWet(!wet)}>
                  {s('有电解质通路', 'Electrolyte path present')}
                </button>
              )}
            </div>
          )}
          {mode === 1 && (
            <>
              <div className="chem-galvanic-buttons">
                <button aria-pressed={!paper} onClick={() => setPaper(false)}>
                  {s('水果', 'Fruit')}
                </button>
                <button aria-pressed={paper} onClick={() => setPaper(true)}>
                  {s('盐水湿纸', 'Saline wet paper')}
                </button>
                <button aria-pressed={same} onClick={() => setSame(!same)}>
                  {s('两端都用铜', 'Copper at both ends')}
                </button>
              </div>
              <label>
                {s('串联数量', 'Series count')} {count}
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="1"
                  value={count}
                  onChange={(e) => setCount(+e.target.value)}
                />
              </label>
              {local !== 2 && (
                <label>
                  {s('电阻负载', 'Resistive load')} {load} Ω
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={load}
                    onChange={(e) => setLoad(+e.target.value)}
                  />
                </label>
              )}
              <p>
                {s(
                  '盐水纸示意采用含氧电解质，正极以氧还原作教学近似；水果示意以酸性介质中析氢作近似。不同材料、钝化和含氧量会改变真实结果。',
                  'The saline-paper example uses oxygen reduction as a teaching approximation; the acidic fruit example uses hydrogen evolution. Real results depend on materials, passivation and oxygen availability.',
                )}
              </p>
            </>
          )}
          {mode === 3 && (
            <>
              <label>
                {s('盐桥抬升', 'Lift the salt bridge')}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step=".01"
                  value={lift}
                  onChange={(e) => setLift(+e.target.value)}
                />
              </label>
              <label>
                Zn²⁺ {zinc.toFixed(2)} mol/L
                <input
                  type="range"
                  min=".01"
                  max="2"
                  step=".01"
                  value={zinc}
                  onChange={(e) => setZinc(+e.target.value)}
                />
              </label>
              <label>
                Cu²⁺ {copper.toFixed(2)} mol/L
                <input
                  type="range"
                  min=".01"
                  max="2"
                  step=".01"
                  value={copper}
                  onChange={(e) => setCopper(+e.target.value)}
                />
              </label>
            </>
          )}
          {mode === 4 && (
            <>
              <div className="chem-galvanic-buttons">
                {(['charge', 'isolated', 'discharge'] as const).map((v, i) => (
                  <button key={v} aria-pressed={phase === v} onClick={() => setPhase(v)}>
                    {
                      [
                        s('接外电源', 'External power'),
                        s('两路断开', 'Both disconnected'),
                        s('接负载', 'Connect load'),
                      ][i]
                    }
                  </button>
                ))}
              </div>
              <label>
                {s('先前电解时长', 'Prior electrolysis time')} {charge}s
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="1"
                  value={charge}
                  onChange={(e) => setCharge(+e.target.value)}
                />
              </label>
            </>
          )}
          <details>
            <summary>{s('电流、粒子与教学简化', 'Current, particles and simplifications')}</summary>
            <p>
              {s(
                '示意电流不是实测数据。稀酸模式保留锌或铁自身析氢，连接后不宣称全部局部反应消失；Cu/C在忽略溶解氧等副反应的稀酸模型中没有所示持续反应。离子在液体与盐桥中迁移，电子沿导体传递，彩点只标方向。',
                'Currents are illustrative, not measured. Acid mode retains local hydrogen evolution at zinc or iron. Cu/C supplies no sustained reaction in the stated acid model, which omits dissolved-oxygen and other side reactions. Ions migrate through electrolyte and bridge; electrons pass through conductors. Coloured markers show direction only.',
              )}
            </p>
            <p>
              {s(
                '盐桥电池采用25°C理想活度近似、每室50mL及220Ω总电阻；反应量按瞬时电势积分，电极初始质量各20mg，厚度夸大但按质量和密度变化。有限气体模型假设电解电流0.2A、留存0.8%，放电电势随剩余电荷下降；不把普通石墨装置当成高效商业燃料电池。',
                'The bridged cell assumes 25°C, ideal activities, 50 mL per chamber and 220 Ω total resistance. Reaction extent integrates instantaneous potential. Both electrodes start at 20 mg; thickness is exaggerated but follows mass and density. The finite-gas example assumes 0.2 A electrolysis and 0.8% retention, with potential decreasing with stored charge. It is not a high-efficiency commercial fuel cell.',
              )}
            </p>
          </details>
          <label>
            {s(
              '自己的观察：材料、连接、液体、读数和对照',
              'Your observations: materials, connections, electrolyte, reading and control',
            )}
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>
      )}
    </div>
  );
}
