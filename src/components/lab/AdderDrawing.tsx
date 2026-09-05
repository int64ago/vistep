import { t } from '../../i18n';
import {
  known,
  type AdderStage,
  type GateKind,
  type LogicSignal,
  type rippleAdder,
} from '../../models/adder';
import { useCompact } from './useCompact';
type Point = { x: number; y: number };
const ink = (signal: LogicSignal, time: number) =>
  known(signal, time) === null ? '#626b59' : signal.value ? '#8f5339' : '#52694c';
const value = (signal: LogicSignal, time: number) => known(signal, time) ?? '·';
export function AdderColumns({
  model,
  time,
  signed,
  compareSigned,
  truncate,
}: {
  model: ReturnType<typeof rippleAdder>;
  time: number;
  signed: boolean;
  compareSigned: boolean;
  truncate: boolean;
}) {
  const compact = useCompact(),
    width = compact ? 320 : 860,
    n = model.width,
    left = compact ? 55 : 130,
    right = width - (compact ? 22 : 85),
    step = (right - left) / n;
  const x = (bit: number) => right - step * (bit + 0.5),
    rows = [88, 139, 223],
    finished = time >= model.settled;
  return (
    <div className="adder-columns">
      <div className="adder-expression">
        <span>{signed ? model.signedA : model.a}</span>
        <i>+</i>
        <span>{signed ? model.signedB : model.b}</span>
        <i>{signed || truncate ? '→' : '='}</i>
        <strong>
          {finished ? (signed ? model.signedSum : truncate ? model.sum : model.complete) : '·'}
        </strong>
      </div>
      <svg
        viewBox={`0 0 ${width} 270`}
        role="img"
        aria-label={t('按位对齐的二进制竖式，进位从低位流向高位')}
      >
        {truncate && (
          <rect
            x={left - 17}
            y="193"
            width={right - left + 25}
            height="49"
            rx="12"
            fill="#d7dfc7"
            stroke="#98ad87"
            strokeWidth="1"
          />
        )}
        <text
          x={compact ? 12 : 35}
          y="35"
          fill="#56654f"
          fontSize={compact ? 12 : 14}
          visibility={
            (compact && n === 8) || (model.carry.value && known(model.carry, time) !== null)
              ? 'hidden'
              : 'visible'
          }
        >
          {t('位权')}
        </text>
        {model.stages.map((s, i) => (
          <g key={i}>
            <text x={x(i)} y="35" textAnchor="middle" fill="#58694f" fontSize={compact ? 11 : 15}>
              {signed && i === n - 1 ? -(2 ** i) : 2 ** i}
            </text>
            <path
              d={`M${x(i)} 48V244`}
              stroke="#a6b49b"
              strokeOpacity=".18"
              strokeDasharray="2 5"
            />
            <text x={x(i)} y={rows[0]} textAnchor="middle" className="adder-digit">
              {s.a.value}
            </text>
            <text x={x(i)} y={rows[1]} textAnchor="middle" className="adder-digit">
              {s.b.value}
            </text>
            <text
              x={x(i)}
              y={rows[2]}
              textAnchor="middle"
              className="adder-digit adder-sum"
              fill={ink(s.sum, time)}
            >
              {value(s.sum, time)}
            </text>
            {i < n - 1 && (
              <g>
                <path
                  d={`M${x(i) - 3} 180C${x(i) - step * 0.2} 157 ${x(i) - step * 0.7} 157 ${x(i + 1) + 3} 180`}
                  stroke={ink(s.cout, time)}
                  fill="none"
                  strokeWidth={s.cout.value && time >= s.cout.ready ? 2.2 : 1.2}
                  opacity={time >= s.cout.ready ? (s.cout.value ? 1 : 0.25) : 0.3}
                />
                <text
                  x={(x(i) + x(i + 1)) / 2}
                  y="160"
                  textAnchor="middle"
                  fill={ink(s.cout, time)}
                  fontSize={compact ? 12 : 16}
                >
                  {time >= s.cout.ready && s.cout.value ? 1 : ''}
                </text>
              </g>
            )}
          </g>
        ))}
        <text x={left - 28} y={rows[1]} fill="#5d6b52" fontSize="24">
          +
        </text>
        <path d={`M${left - 18} 188H${right}`} stroke="#819377" strokeWidth="1.4" />
        {model.carry.value === 1 && known(model.carry, time) !== null && (
          <g>
            <text
              x={left - 26}
              y="35"
              textAnchor="middle"
              fontSize={compact ? 11 : 15}
              fill="#8f5339"
            >
              {2 ** n}
            </text>
            <text
              x={left - 26}
              y={rows[2]}
              textAnchor="middle"
              className="adder-digit adder-sum"
              fill="#b76e4f"
            >
              1
            </text>
            <path d={`M${left - 13} 198V235`} stroke="#bb8868" strokeDasharray="2 4" />
          </g>
        )}
        <text x={right} y="265" textAnchor="end" fill="#5d6e53" fontSize={compact ? 12 : 14}>
          {t(truncate ? '只保留低八位' : '二进制')}
        </text>
      </svg>
      {compareSigned && (
        <div className="adder-interpretation">
          <span data-selected={!signed}>
            {t('无符号读法')} <b>{model.sum}</b>
          </span>
          <span data-selected={signed}>
            {t('有符号读法')} <b>{model.signedSum}</b>
          </span>
        </div>
      )}
      {model.width === 8 && (
        <div className="adder-flags">
          <span data-on={known(model.carry, time) === 1}>
            {t('最高位进位')} <b>{value(model.carry, time)}</b>
          </span>
          <span data-on={finished && model.overflow === 1}>
            {t('有符号溢出')} <b>{finished ? model.overflow : '·'}</b>
          </span>
        </div>
      )}
    </div>
  );
}
export function AdderCircuit({
  stage,
  time,
  half,
}: {
  stage: AdderStage;
  time: number;
  half: boolean;
}) {
  const compact = useCompact(),
    width = compact ? 320 : 860,
    height = compact ? (half ? 300 : 500) : 380,
    vertical = compact && !half;
  const positions: Record<string, Point> = compact
    ? {
        a: { x: 60, y: 40 },
        b: { x: 140, y: 40 },
        cin: { x: 260, y: 40 },
        p: { x: 94, y: 125 },
        g: { x: 218, y: 125 },
        h: { x: 218, y: 255 },
        sum: { x: 94, y: 255 },
        cout: { x: 156, y: 380 },
      }
    : {
        a: { x: 70, y: 65 },
        b: { x: 70, y: 125 },
        cin: { x: 70, y: 305 },
        p: { x: 265, y: 105 },
        g: { x: 265, y: 250 },
        h: { x: 500, y: 255 },
        sum: { x: 500, y: 90 },
        cout: { x: 710, y: 235 },
      };
  if (half && compact) {
    positions.p = { x: 218, y: 115 };
    positions.g = { x: 218, y: 225 };
    positions.a = { x: 44, y: 85 };
    positions.b = { x: 44, y: 170 };
  }
  const kinds: Record<string, GateKind> = { p: 'XOR', g: 'AND', h: 'AND', sum: 'XOR', cout: 'OR' };
  const signals: Record<string, LogicSignal> = { ...stage };
  const gatePort = (name: string, port: number): Point =>
    vertical
      ? { x: positions[name].x + (port ? -10 : 10), y: positions[name].y - 36 }
      : { x: positions[name].x - 36, y: positions[name].y + (port ? 10 : -10) };
  const source = (name: string): Point =>
    kinds[name]
      ? vertical
        ? { x: positions[name].x, y: positions[name].y + 36 }
        : { x: positions[name].x + 36, y: positions[name].y }
      : positions[name];
  const wires = half
    ? ([
        ['a', 'p', 0],
        ['b', 'p', 1],
        ['a', 'g', 0],
        ['b', 'g', 1],
      ] as const)
    : ([
        ['a', 'p', 0],
        ['b', 'p', 1],
        ['a', 'g', 0],
        ['b', 'g', 1],
        ['p', 'sum', 0],
        ['cin', 'sum', 1],
        ['p', 'h', 0],
        ['cin', 'h', 1],
        ['g', 'cout', 0],
        ['h', 'cout', 1],
      ] as const);
  const wirePath = (from: string, to: string, port: number) => {
    const a = source(from),
      b = gatePort(to, port);
    if (vertical) {
      if (from === 'a')
        return to === 'p'
          ? `M${a.x} ${a.y}V60H104V${b.y}`
          : `M${a.x} ${a.y}V60H134Q140 68 146 60H228V${b.y}`;
      if (from === 'b')
        return to === 'p'
          ? `M${a.x} ${a.y}V75H110Q104 83 98 75H84V${b.y}`
          : `M${a.x} ${a.y}V75H208V${b.y}`;
      if (from === 'p') return `M${a.x} ${a.y}V195H${b.x}V${b.y}`;
      if (from === 'cin')
        return to === 'sum'
          ? `M${a.x} ${a.y}H278Q286 40 286 48V202Q286 210 278 210H256Q250 218 244 210H234Q228 218 222 210H110Q104 218 98 210H84V${b.y}`
          : `M${a.x} ${a.y}H278Q286 40 286 48V202Q286 210 278 210H256Q250 218 244 210H234Q228 218 222 210H208V${b.y}`;
      if (from === 'g')
        return `M${a.x} ${a.y}V182Q218 190 226 190H242Q250 190 250 198V324Q250 332 242 332H174Q166 332 166 340V${b.y}`;
      if (from === 'h') return `M${a.x} ${a.y}V308Q218 316 210 316H154Q146 316 146 324V${b.y}`;
    }
    if (from === 'cin')
      return `M${a.x} ${a.y}H424Q440 ${a.y} 440 ${a.y - 16}V${b.y + 15}Q440 ${b.y} 455 ${b.y}H${b.x}`;
    if (from === 'g' && to === 'cout')
      return `M${a.x} ${a.y}H330Q345 ${a.y} 345 ${a.y - 15}V185Q345 170 360 170H635Q650 170 650 185V${b.y - 15}Q650 ${b.y} 665 ${b.y}H${b.x}`;
    const dx = (b.x - a.x) * 0.55;
    return `M${a.x} ${a.y}C${a.x + dx} ${a.y} ${b.x - dx} ${b.y} ${b.x} ${b.y}`;
  };
  const shown = half ? ['p', 'g'] : ['p', 'g', 'h', 'sum', 'cout'];
  return (
    <div className="adder-circuit">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t(
          half ? '异或门给出本位和，与门给出进位' : '两个异或门、两个与门和一个或门构成全加器',
        )}
      >
        {wires.map(([from, to, port], i) => {
          const signal = signals[from],
            progress = Math.min(
              1,
              Math.max(0, (time - signal.ready) / Math.max(1, signals[to].ready - signal.ready)),
            ),
            d = wirePath(from, to, port);
          return (
            <g key={i}>
              <path d={d} stroke="#eff0e5" strokeWidth="5" fill="none" strokeLinejoin="round" />
              <path d={d} stroke="#a5b198" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
              <path
                d={d}
                stroke={ink(signal, time)}
                strokeWidth="2"
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset={1 - progress}
                fill="none"
              />
            </g>
          );
        })}
        {vertical &&
          [
            [104, 60, 'a'],
            [140, 75, 'b'],
            [104, 195, 'p'],
            [208, 210, 'cin'],
          ].map(([x, y, name]) => (
            <circle
              key={String(name)}
              cx={Number(x)}
              cy={Number(y)}
              r="2.5"
              fill={ink(signals[String(name)], time)}
            />
          ))}
        {['a', 'b', ...(!half ? ['cin'] : [])].map((name) => (
          <g key={name} transform={`translate(${positions[name].x} ${positions[name].y})`}>
            <circle r="16" fill="#eeefe4" stroke="#bcc7b0" />
            <text
              textAnchor="middle"
              y="6"
              fontSize={compact ? 22 : 19}
              fill={ink(signals[name], time)}
            >
              {signals[name].value}
            </text>
            <text x="0" y="-23" textAnchor="middle" fontSize={compact ? 16 : 13} fill="#58694f">
              {name === 'cin' ? 'Cin' : name.toUpperCase()}
            </text>
          </g>
        ))}
        {shown.map((name) => {
          const k = kinds[name],
            sig = signals[name],
            p = positions[name];
          return (
            <g key={name} transform={`translate(${p.x} ${p.y})`}>
              <g transform={vertical ? 'rotate(90)' : undefined}>
                <path d="M-36 -10H-22M-36 10H-22M30 0H36" stroke="#72866b" fill="none" />
                <path
                  d={
                    k === 'AND'
                      ? 'M-30 -22H8A22 22 0 0 1 8 22H-30Z'
                      : 'M-30 -22Q8 -22 30 0Q8 22 -30 22Q-14 0 -30 -22Z'
                  }
                  fill="#f5f5ea"
                  stroke={ink(sig, time)}
                  strokeWidth="1.6"
                />
                {k === 'XOR' && (
                  <path
                    d="M-37 -22Q-21 0 -37 22"
                    fill="none"
                    stroke={ink(sig, time)}
                    strokeWidth="1.4"
                  />
                )}
              </g>
              <text x="0" y={compact ? 6 : 4} textAnchor="middle" fill="#566d4f" fontSize="18">
                {k}
              </text>
              <g transform={vertical ? 'translate(0 48)' : 'translate(47.5 0)'}>
                <rect x="-10" y="-11" width="20" height="24" rx="8" fill="#eff0e5" />
                <text
                  x="0"
                  y="6"
                  textAnchor="middle"
                  fontSize={compact ? 22 : 17}
                  fill={ink(sig, time)}
                >
                  {value(sig, time)}
                </text>
              </g>
              {(half || name === 'sum' || name === 'cout') && (
                <text
                  x="0"
                  y={vertical ? 84 : 43}
                  textAnchor="middle"
                  fill="#586e50"
                  fontSize={compact ? 20.5 : 16}
                >
                  {t(name === 'g' || name === 'cout' ? '进位' : '本位和')}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p>{half ? 'S = A XOR B · C = A AND B' : 'S = A XOR B XOR Cin'}</p>
    </div>
  );
}
