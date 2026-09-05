import { t } from '../../i18n';
import { ENGINE, engineCycle } from '../../models/four-stroke';
export const strokeNames = ['进气', '压缩', '做功', '排气'];
export const strokeColors = ['#668f96', '#ba9a63', '#c57750', '#8d9290'];
/** Same ignition window as the 3D cutaway; this is a light marker, not a flame solver. */
export function engineIgnition(cycle: number) {
  const burn = cycle - 2 * Math.PI;
  return { visible: burn >= 0 && burn < 0.14, strength: Math.max(0, Math.min(1, 1 - burn / 0.14)) };
}
export default function EngineDiagram({ angle }: { angle: number }) {
  const s = engineCycle(angle),
    scale = 1100,
    origin = 328;
  const pin = origin - s.pinY * scale,
    crown = pin - 22;
  const head =
    origin -
    (ENGINE.rod + ENGINE.crank) * scale -
    22 -
    (2 * ENGINE.crank * scale) / (ENGINE.compression - 1);
  const crankX = 150 + s.crankX * scale,
    crankY = origin - s.crankY * scale,
    ignition = engineIgnition(s.cycle),
    sparkY = head + 5.5,
    sparkRadius = 3 + 1.2 * ignition.strength;
  return (
    <div className="engine-flat-wrap">
      <svg
        className="engine-flat"
        viewBox="0 0 300 410"
        role="img"
        aria-label={t('剖面中的活塞、连杆、曲轴和气门，位置与三维模型相同')}
      >
        <defs>
          <linearGradient id="engine-flat-metal">
            <stop stopColor="#aab9af" />
            <stop offset=".5" stopColor="#e1e8dc" />
            <stop offset="1" stopColor="#92a79b" />
          </linearGradient>
        </defs>
        <path
          d={`M101 ${head}V263M199 ${head}V263M101 ${head}H199`}
          fill="none"
          stroke="#759186"
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <rect
          x="106"
          y={head + 3}
          width="88"
          height={Math.max(0, crown - head - 3)}
          fill={strokeColors[s.stage]}
          opacity=".22"
        />
        <path
          d={`M45 ${head - 15}H125V${head}`}
          fill="none"
          stroke="#78999b"
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <path
          d={`M255 ${head - 15}H175V${head}`}
          fill="none"
          stroke="#adb0a3"
          strokeWidth="10"
          strokeLinejoin="round"
        />
        {[s.intake, s.exhaust].map((lift, i) => (
          <g key={i} transform={`translate(${125 + i * 50} ${head + lift * 10})`}>
            <path d="M0 -38V0" stroke="#738c7b" strokeWidth="5" />
            <path d="M-10 0H10" stroke="#a8b4a1" strokeWidth="5" strokeLinecap="round" />
          </g>
        ))}
        <g data-engine-plug="true">
          <rect
            x="146"
            y={head - 33}
            width="8"
            height="20"
            rx="2"
            fill="#e9e5ce"
            stroke="#89988a"
          />
          <rect x="144.5" y={head - 15} width="11" height="10" rx="2" fill="#819487" />
          <path
            d={`M150 ${head - 5}V${head + 2}M154 ${head - 5}V${head + 3}H152`}
            fill="none"
            stroke="#657d6e"
            strokeWidth="1.5"
          />
        </g>
        {ignition.visible && (
          <g data-engine-ignition="true">
            <circle cx="150" cy={sparkY} r="5" fill="#edb447" opacity=".25" />
            <path
              d={
                Array.from({ length: 16 }, (_, i) => {
                  const a = (i * Math.PI) / 8,
                    r = sparkRadius * (i % 2 ? 0.36 : 1);
                  return `${i ? 'L' : 'M'}${150 + r * Math.cos(a)},${sparkY + r * Math.sin(a)}`;
                }).join(' ') + 'Z'
              }
              fill="#fff5c2"
              stroke="#b78330"
              strokeWidth=".75"
            />
          </g>
        )}
        <rect x="108" y={crown} width="84" height="38" rx="5" fill="url(#engine-flat-metal)" />
        <path d={`M110 ${crown + 7}H190M110 ${crown + 13}H190`} stroke="#678276" strokeWidth="2" />
        <circle
          cx="150"
          cy={origin}
          r="57"
          fill="#799184"
          fillOpacity=".12"
          stroke="#92a393"
          strokeWidth="9"
        />
        <path
          d={`M150 ${origin}L${crankX} ${crankY}`}
          stroke="#758c7d"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <path
          d={`M150 ${pin}L${crankX} ${crankY}`}
          stroke="#baa274"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <path d={`M150 ${pin}L${crankX} ${crankY}`} stroke="#d3c6a7" strokeWidth="4" />
        {[
          [150, pin],
          [crankX, crankY],
          [150, origin],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="7" fill="#e7e8d9" stroke="#617c6d" strokeWidth="3" />
        ))}
      </svg>
      <p>
        <span>
          {t(strokeNames[s.stage])} · {Math.round((s.cycle * 180) / Math.PI)}°
        </span>
        <span
          className="engine-ignition-label"
          data-active={ignition.visible}
          aria-hidden={!ignition.visible}
        >
          {t('点火')}
        </span>
      </p>
    </div>
  );
}
export function PressureVolume({ angle }: { angle: number }) {
  const s = engineCycle(angle),
    ceiling = Math.ceil(s.peakPressure / 1e6),
    x = (v: number) => ((v - s.clearance) / (s.maximum - s.clearance)) * 240,
    y = (p: number) => 160 * (1 - p / (ceiling * 1e6));
  const compression = Array.from({ length: 81 }, (_, i) =>
    engineCycle(Math.PI + (i / 80) * (Math.PI - 1e-6)),
  );
  const expansion = Array.from({ length: 81 }, (_, i) =>
    engineCycle(2 * Math.PI + (i / 80) * (Math.PI - 1e-6)),
  );
  const path =
    [...compression, ...expansion]
      .map((q, i) => `${i ? 'L' : 'M'}${x(q.volume)},${y(q.pressure)}`)
      .join(' ') + 'Z';
  return (
    <div className="engine-pv" role="img" aria-label={t('压力—容积图；包围的面积表示每循环净功')}>
      <div className="engine-pv-unit">MPa</div>
      <div className="engine-pv-plot">
        <div className="engine-pv-ticks">
          <span>{ceiling}</span>
          <span>{ceiling / 2}</span>
          <span>0</span>
        </div>
        <svg viewBox="-6 -6 252 172" preserveAspectRatio="none" aria-hidden="true">
          {[0, 80, 160].map((n) => (
            <path key={n} d={`M0 ${n}H240`} stroke="#81997e" opacity=".3" />
          ))}
          <path d="M0 0V160H240" fill="none" stroke="#8ba18d" />
          <path
            d={path}
            fill="#b79355"
            fillOpacity=".18"
            stroke="#a2814c"
            strokeWidth="1.7"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M${x(s.volume)} 160V${y(s.pressure)}`}
            stroke={strokeColors[s.stage]}
            strokeDasharray="3 4"
          />
          <circle
            cx={x(s.volume)}
            cy={y(s.pressure)}
            r="4"
            fill={strokeColors[s.stage]}
            stroke="#f6f2df"
            strokeWidth="2"
          />
        </svg>
      </div>
      <div className="engine-pv-volume">
        <span>{(s.clearance * 1e6).toFixed(0)}</span>
        <span>cm³</span>
        <span>{(s.maximum * 1e6).toFixed(0)}</span>
      </div>
    </div>
  );
}
