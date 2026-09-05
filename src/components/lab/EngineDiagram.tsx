import { t } from '../../i18n';
import { ENGINE, engineCycle } from '../../models/four-stroke';
export const strokeNames = ['进气', '压缩', '做功', '排气'];
export const strokeColors = ['#668f96', '#ba9a63', '#c57750', '#8d9290'];
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
    crankY = origin - s.crankY * scale;
  return (
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
      <text x="150" y="397" textAnchor="middle" fill={strokeColors[s.stage]}>
        {t(strokeNames[s.stage])} · {Math.round((s.cycle * 180) / Math.PI)}°
      </text>
    </svg>
  );
}
export function PressureVolume({ angle }: { angle: number }) {
  const s = engineCycle(angle),
    x = (v: number) => 40 + ((v - s.clearance) / (s.maximum - s.clearance)) * 235,
    y = (p: number) => 170 - (p / 1e6) * 19;
  const compression = Array.from({ length: 81 }, (_, i) =>
    engineCycle(Math.PI + (i / 80) * (Math.PI - 0.000001)),
  );
  const expansion = Array.from({ length: 81 }, (_, i) =>
    engineCycle(2 * Math.PI + (i / 80) * (Math.PI - 0.000001)),
  );
  const path =
    [...compression, ...expansion]
      .map((q, i) => `${i ? 'L' : 'M'}${x(q.volume)},${y(q.pressure)}`)
      .join(' ') + 'Z';
  return (
    <svg
      viewBox="0 0 310 210"
      className="engine-pv"
      role="img"
      aria-label={t('压力—容积图；包围的面积表示每循环净功')}
    >
      <path d="M40 15V170H282" fill="none" stroke="#8ba18d" />
      {[0, 3, 6].map((n) => (
        <g key={n}>
          <path d={`M40 ${y(n * 1e6)}H280`} stroke="#81997e" opacity=".15" />
          <text x="31" y={y(n * 1e6) + 4} textAnchor="end">
            {n}
          </text>
        </g>
      ))}
      <path d={path} fill="#b79355" fillOpacity=".18" stroke="#a2814c" strokeWidth="1.7" />
      <path
        d={`M${x(s.volume)} 170V${y(s.pressure)}`}
        stroke={strokeColors[s.stage]}
        strokeDasharray="3 4"
        opacity=".6"
      />
      <circle
        cx={x(s.volume)}
        cy={y(s.pressure)}
        r="5"
        fill={strokeColors[s.stage]}
        stroke="#f6f2df"
        strokeWidth="2"
      />
      <text x="42" y="11">
        MPa
      </text>
      <text x="160" y="207" textAnchor="middle">
        cm³
      </text>
      <text x="40" y="190" textAnchor="middle">
        {(s.clearance * 1e6).toFixed(0)}
      </text>
      <text x="275" y="190" textAnchor="middle">
        {(s.maximum * 1e6).toFixed(0)}
      </text>
    </svg>
  );
}
