import { useId } from 'react';
import { t } from '../../i18n';
import { type BridgeDiode, type RectifierSample } from '../../models/rectifier';

// A common, bounded visual scale for all three branches; zero current is exactly dark.
export const rectifierCurrentOpacity = (current: number) =>
  Math.min(1, Math.sqrt(Math.abs(current) / 0.4));

export default function RectifierBridge({
  sample,
  compact,
}: {
  sample: RectifierSample;
  compact: boolean;
}) {
  const id = useId(),
    s = sample.state,
    p = sample.parameters;
  const a = compact ? 60 : 142,
    b = compact ? 170 : 338,
    cap = compact ? 222 : 518,
    load = compact ? 281 : 686;
  const source = compact ? 131 : 266,
    resistor = compact ? 83 : 190;
  const top = 38,
    bottom = 236,
    middle = 140,
    upper = 85,
    lower = 190;
  const width = compact ? 300 : 750;
  const positive = s.mode === 'positive',
    conducting = s.mode !== 'blocked';
  const ac = s.source >= 0 ? '#ffc08a' : '#8bd6ff',
    dc = '#a1e0c5',
    dim = '#5d7882';
  const currentOpacity = rectifierCurrentOpacity(s.bridgeCurrent);
  const outputOpacity = rectifierCurrentOpacity(s.loadCurrent);
  const capacitorOpacity = p.capacitor ? rectifierCurrentOpacity(s.capacitorCurrent) : 0;
  const capacitorLevel = Math.max(0, Math.min(1, s.output / Math.max(0.1, p.peak)));
  // The shared rails stop at the capacitor nodes, before the load-only segments.
  // This remains a valid split point when the capacitor is disconnected.
  const upperPath = `M${positive ? a : b} ${middle}V${top}H${cap}`;
  const lowerPath = `M${cap} ${bottom}H${positive ? b : a}V${middle}`;
  const loadPath = `M${cap} ${top}H${load}V94M${load} 181V${bottom}H${cap}`;
  const capPath = `M${cap} ${top}V117M${cap} 131V${bottom}`;
  const sourcePath = `M${a} ${middle}H${resistor - 9}M${resistor + 9} ${middle}H${source - 18}M${source + 18} ${middle}H${b}`;
  const diode = (name: BridgeDiode, x: number, y: number) => {
    const lit = s.diodes[name] > 1e-12,
      color = lit ? ac : dim;
    return (
      <g key={name}>
        <path
          d={`M${x - 11} ${y + 12}H${x + 11}L${x} ${y - 9}Z M${x - 12} ${y - 13}H${x + 12}`}
          stroke={color}
          fill={lit ? `${ac}35` : '#122c39'}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <text x={x - 17} y={y + 6} textAnchor="end" fill={lit ? ac : '#9ab3bd'}>
          {name}
        </text>
      </g>
    );
  };
  return (
    <div className="rectifier-bridge">
      <div className="rectifier-state">
        <span style={{ color: ac }}>
          {t(
            s.mode === 'positive'
              ? 'D1、D4 导通'
              : s.mode === 'negative'
                ? 'D2、D3 导通'
                : '四只二极管均截止',
          )}
        </span>
        <span>
          v<sub>out</sub> <b>{s.output.toFixed(2)}</b> V
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} 260`}
        role="img"
        aria-label={t(
          '完整桥式整流电路；上桥臂指向正输出，下桥臂指向交流端；各支路按自己的电流显示亮度',
        )}
      >
        <defs>
          <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <g fill="none" stroke={dim} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path
            d={`M${a} ${top}H${load}V94M${load} 181V${bottom}H${a}M${a} ${top}V${upper - 13}M${a} ${upper + 12}V${lower - 13}M${a} ${lower + 12}V${bottom}M${b} ${top}V${upper - 13}M${b} ${upper + 12}V${lower - 13}M${b} ${lower + 12}V${bottom}`}
          />
          {conducting && (
            <g
              data-current-branch="bridge"
              data-current={s.bridgeCurrent}
              stroke={ac}
              opacity={currentOpacity}
            >
              <path d={`${upperPath} ${lowerPath}`} filter={`url(#${id}-glow)`} strokeWidth="8" />
              <path d={`${upperPath} ${lowerPath}`} strokeWidth="3" />
            </g>
          )}
          <path d={sourcePath} />
          <path d={sourcePath} stroke={ac} opacity={currentOpacity} />
          <rect
            x={resistor - 9}
            y={middle - 6}
            width="18"
            height="12"
            rx="2"
            fill="#122c39"
            stroke={dim}
          />
          <rect
            x={resistor - 9}
            y={middle - 6}
            width="18"
            height="12"
            rx="2"
            stroke={ac}
            opacity={currentOpacity}
          />
          <circle cx={source} cy={middle} r="18" fill="#122c39" stroke={ac} />
          <path
            d={`M${source - 11} ${middle}C${source - 7} ${middle - 15} ${source - 3} ${middle - 15} ${source} ${middle}S${source + 7} ${middle + 15} ${source + 11} ${middle}`}
            stroke={ac}
            strokeWidth="2"
          />
          <rect x={load - 9} y="94" width="18" height="87" rx="3" fill="#173945" stroke={dim} />
          <g
            data-current-branch="load"
            data-current={s.loadCurrent}
            stroke={dc}
            opacity={outputOpacity}
          >
            <path d={loadPath} filter={`url(#${id}-glow)`} strokeWidth="7" />
            <path d={loadPath} strokeWidth="3.5" />
            <rect x={load - 9} y="94" width="18" height="87" rx="3" />
          </g>
          {p.capacitor && (
            <>
              <path d={capPath} stroke={dim} />
              <path
                d={`M${cap - 13} 117H${cap + 13}M${cap - 13} 131H${cap + 13}`}
                stroke="#867eab"
                strokeWidth="4"
              />
              <g
                data-current-branch="capacitor"
                data-current={s.capacitorCurrent}
                stroke="#c5b8f1"
                opacity={capacitorOpacity}
              >
                <path d={capPath} filter={`url(#${id}-glow)`} strokeWidth="7" />
                <path d={capPath} strokeWidth="3.5" />
                <path
                  d={`M${cap - 13} 117H${cap + 13}M${cap - 13} 131H${cap + 13}`}
                  strokeWidth="4"
                />
              </g>
              <path
                d={
                  s.capacitorCurrent > 0
                    ? `M${cap - 12} 75v25m-4-6 4 6 4-6`
                    : `M${cap - 12} 100V75m-4 6 4-6 4 6`
                }
                stroke="#c5b8f1"
                strokeWidth="2"
                opacity={capacitorOpacity}
              />
              <rect
                x={cap + 12}
                y="148"
                width="9"
                height="65"
                rx="4"
                stroke="none"
                fill="#c5b8f115"
              />
              <rect
                x={cap + 12}
                y={213 - 65 * capacitorLevel}
                width="9"
                height={65 * capacitorLevel}
                rx="4"
                stroke="none"
                fill="#c5b8f1"
                opacity=".7"
              />
            </>
          )}
          <path
            d={`M${load - 18} 104v31m-4-6 4 6 4-6`}
            stroke={dc}
            strokeWidth="2"
            opacity={outputOpacity}
          />
          {[a, b].flatMap((x) =>
            [top, middle, bottom].map((y) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#b6d6de" stroke="none" />
            )),
          )}
          {p.capacitor &&
            [top, bottom].map((y) => (
              <circle key={y} cx={cap} cy={y} r="3" fill="#c5b8f1" stroke="none" />
            ))}
        </g>
        <g fontFamily="inherit" fontSize="22" fill="#d4e4e8">
          {diode('D1', a, upper)}
          {diode('D2', b, upper)}
          {diode('D3', a, lower)}
          {diode('D4', b, lower)}
          <text x={a - 15} y={middle + 7} textAnchor="end" fill={ac}>
            A
          </text>
          <text x={b + 10} y={middle + 7} fill={ac}>
            B
          </text>
          <text x={resistor} y={middle - 18} textAnchor="middle">
            Rₛ
          </text>
          <text x={load} y="27" textAnchor="middle" fill={dc}>
            +
          </text>
          <text x={load} y="257" textAnchor="middle" fill={dc}>
            −
          </text>
          <text x={load} y="210" textAnchor="middle" fill={dc}>
            R
          </text>
          {p.capacitor && (
            <text x={cap - 13} y="183" textAnchor="end" fill="#c5b8f1">
              C
            </text>
          )}
          {!compact && (
            <>
              <text x={source} y="180" textAnchor="middle" fill={ac}>
                {s.source.toFixed(2)} V
              </text>
              <text x={cap} y="27" textAnchor="middle" fill="#c5b8f1">
                {p.capacitor ? `${Math.round(p.capacitance * 1e6)} µF` : 'C = ∅'}
              </text>
              <text x={load + 21} y="152">
                {p.load} Ω
              </text>
            </>
          )}
        </g>
      </svg>
      <div className="rectifier-bridge-key">
        <span style={{ color: ac }}>
          v<sub>AC</sub> {s.source.toFixed(2)} V
        </span>
        <span style={{ color: '#c5b8f1' }}>
          {t(
            !p.capacitor
              ? '未接储能电容'
              : s.capacitorCurrent > 1e-9
                ? '电容正在充电'
                : s.capacitorCurrent < -1e-9
                  ? '电容正在供电'
                  : '电容电荷暂时不变',
          )}
        </span>
      </div>
    </div>
  );
}
