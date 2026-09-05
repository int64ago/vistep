import { t } from '../../i18n';
import {
  interferenceAt,
  interferenceSamples,
  samePointAmplitude,
  standingNodes,
  type InterferenceInput,
  type InterferenceView,
} from '../../models/wave-interference';

export const STRING_COLORS = {
  first: '#87cbd6',
  second: '#e8aa91',
  sum: '#fff1cd',
  kinetic: '#9cbedf',
  potential: '#d8b18b',
  muted: '#8a9dba',
};
type Sample = ReturnType<typeof interferenceAt>;
const path = (samples: Sample[], x: (n: number) => number, y: (s: Sample) => number) =>
  samples.map((s, i) => `${i ? 'L' : 'M'}${x(s.x).toFixed(2)},${y(s).toFixed(2)}`).join(' ');
function Arrow({
  x,
  y,
  dx,
  dy,
  color,
}: {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
}) {
  const length = Math.hypot(dx, dy);
  if (length < 2) return null;
  const ux = dx / length,
    uy = dy / length,
    ex = x + dx,
    ey = y + dy;
  return (
    <path
      d={`M${x},${y}L${ex},${ey}m${-ux * 5 - uy * 3},${-uy * 5 + ux * 3}L${ex},${ey}l${-ux * 5 + uy * 3},${-uy * 5 - ux * 3}`}
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  );
}
export function WaveInterferenceString({
  input,
  width,
  compact,
  view,
}: {
  input: InterferenceInput;
  width: number;
  compact: boolean;
  view: InterferenceView;
}) {
  const span = compact && !['material', 'pass', 'formation'].includes(view) ? 0.8 : 1.6;
  const min = -span,
    max = span,
    pad = 27,
    x = (n: number) => pad + ((n - min) / (max - min)) * (width - 2 * pad);
  const cy = 141,
    scale = 8800,
    samples = interferenceSamples(input, min, max, compact ? 241 : 401);
  const velocities = view === 'energy' || view === 'nodes';
  const points = Array.from({ length: Math.round(span / 0.1) + 1 }, (_, i) => -span + i * 0.2).map(
    (n) => interferenceAt(input, n),
  );
  const probe = interferenceAt(input, input.probe),
    nodes =
      input.mode === 'standing' && input.ratio === 1 ? standingNodes(min, max, input.phase) : [];
  return (
    <svg
      className="wi-string-svg"
      width={width}
      height="274"
      viewBox={`0 0 ${width} 274`}
      role="img"
      aria-label={t('绳上的两列波、合位移与固定物质点')}
    >
      <text x="0" y="19" fill={STRING_COLORS.first}>
        A →
      </text>
      <text x={width} y="19" textAnchor="end" fill={STRING_COLORS.second}>
        {input.mode === 'phase' ? 'B →' : '← B'}
      </text>
      <line
        x1={pad}
        x2={width - pad}
        y1={cy}
        y2={cy}
        stroke="#a8b5c1"
        strokeOpacity=".22"
        strokeDasharray="3 6"
      />
      <text x="0" y="50" className="wi-svg-muted">
        y / mm
      </text>
      {[8, -8].map((value) => (
        <g key={value}>
          <line
            x1={pad - 4}
            x2={pad + 4}
            y1={cy - value * 0.001 * scale}
            y2={cy - value * 0.001 * scale}
            stroke="#64768b"
          />
          <text x="0" y={cy - value * 0.001 * scale + 5} className="wi-svg-muted">
            {value > 0 ? '+8' : '−8'}
          </text>
        </g>
      ))}
      {nodes.map((n) => (
        <g key={n}>
          <line
            x1={x(n)}
            x2={x(n)}
            y1="65"
            y2="218"
            stroke="#bdc9d0"
            strokeOpacity=".2"
            strokeDasharray="2 5"
          />
          <circle cx={x(n)} cy={cy} r="10" fill="none" stroke="#becbcf" strokeOpacity=".7" />
        </g>
      ))}
      <path
        d={path(samples, x, (s) => cy - s.first.y * scale)}
        fill="none"
        stroke={STRING_COLORS.first}
        strokeWidth="1.8"
        strokeDasharray="5 5"
        opacity=".74"
      />
      <path
        d={path(samples, x, (s) => cy - s.second.y * scale)}
        fill="none"
        stroke={STRING_COLORS.second}
        strokeWidth="1.8"
        strokeDasharray="2 5"
        opacity=".82"
      />
      <path
        d={path(samples, x, (s) => cy - s.y * scale + 2)}
        fill="none"
        stroke="#000"
        strokeOpacity=".3"
        strokeWidth="7"
      />
      <path
        d={path(samples, x, (s) => cy - s.y * scale)}
        fill="none"
        stroke={STRING_COLORS.sum}
        strokeWidth="3.3"
        strokeLinecap="round"
      />
      <path
        d={path(samples, x, (s) => cy - s.y * scale - 0.7)}
        fill="none"
        stroke="#fff"
        strokeOpacity=".58"
        strokeWidth=".7"
      />
      {points.map((s) => (
        <g key={s.x}>
          <circle
            cx={x(s.x)}
            cy={cy - s.y * scale}
            r="2.5"
            fill="#173047"
            stroke="#ece4d4"
            strokeWidth="1.2"
          />
          {velocities && (
            <Arrow
              x={x(s.x)}
              y={cy - s.y * scale}
              dx={0}
              dy={-s.dt * 160}
              color={STRING_COLORS.kinetic}
            />
          )}
        </g>
      ))}
      <line
        x1={x(input.probe)}
        x2={x(input.probe)}
        y1="61"
        y2="236"
        stroke="#f3cf7e"
        strokeOpacity=".36"
        strokeDasharray="2 5"
      />
      <circle
        cx={x(input.probe)}
        cy={cy - probe.y * scale}
        r="6"
        fill="#e9c66f"
        stroke="#fff4ce"
        strokeWidth="1.5"
      />
      <text x={x(input.probe)} y="257" textAnchor="middle" fill="#efd391">
        P
      </text>
      <text x={pad} y="239" className="wi-svg-muted">
        {min.toFixed(1)} m
      </text>
      <text x={width - pad} y="239" textAnchor="end" className="wi-svg-muted">
        +{max.toFixed(1)} m
      </text>
      <path
        d={`M8,133l7,8-7,8M${width - 8},133l-7,8 7,8`}
        fill="none"
        stroke="#7d92a5"
        strokeOpacity=".5"
      />
    </svg>
  );
}

export function WaveInterferencePoint({
  input,
  width,
  view,
}: {
  input: InterferenceInput;
  width: number;
  view: InterferenceView;
}) {
  const state = interferenceAt(input, input.probe),
    cy = 90,
    scale = 7700,
    pad = 32;
  const positions = [pad, width / 2, width - pad],
    values = [state.first.y, state.second.y, state.y];
  return (
    <svg
      className="wi-evidence-svg"
      width={width}
      height="207"
      viewBox={`0 0 ${width} 207`}
      role="img"
      aria-label={t('同一物质点的两项位移与它们的和')}
    >
      <line x1="12" x2={width - 12} y1={cy} y2={cy} stroke="#b4c6d6" strokeOpacity=".23" />
      {values.map((v, i) => (
        <g key={i}>
          <line
            x1={positions[i]}
            x2={positions[i]}
            y1="26"
            y2="151"
            stroke="#8198ae"
            strokeOpacity=".2"
          />
          <line
            x1={positions[i]}
            x2={positions[i]}
            y1={cy}
            y2={cy - v * scale}
            stroke={Object.values(STRING_COLORS)[i]}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <circle
            cx={positions[i]}
            cy={cy - v * scale}
            r="5"
            fill={Object.values(STRING_COLORS)[i]}
          />
          <text x={positions[i]} y="176" textAnchor="middle" fill={Object.values(STRING_COLORS)[i]}>
            {(v * 1000).toFixed(1)}
          </text>
          <text x={positions[i]} y="19" textAnchor="middle" className="wi-svg-muted">
            {['A', 'B', 'A + B'][i]}
          </text>
        </g>
      ))}
      <text
        x={(positions[0] + positions[1]) / 2}
        y={cy + 5}
        textAnchor="middle"
        className="wi-svg-muted"
      >
        +
      </text>
      <text
        x={(positions[1] + positions[2]) / 2}
        y={cy + 5}
        textAnchor="middle"
        className="wi-svg-muted"
      >
        =
      </text>
      <text x={width} y="196" textAnchor="end" className="wi-svg-muted">
        mm
      </text>
      {view === 'cancel' && (
        <text x="0" y="196" className="wi-svg-muted">
          P · x = {input.probe.toFixed(1)} m
        </text>
      )}
    </svg>
  );
}

export function WaveInterferenceEnergy({
  input,
  width,
  span,
}: {
  input: InterferenceInput;
  width: number;
  span: number;
}) {
  const samples = interferenceSamples(input, -span, span, 321),
    pad = 27,
    x = (n: number) => pad + ((n + span) / (2 * span)) * (width - 2 * pad);
  const scale = 60000,
    base = 104;
  const area = (key: 'kinetic' | 'potential') =>
    `${path(samples, x, (s) => base - s[key] * scale)}L${x(span)},${base}L${x(-span)},${base}Z`;
  return (
    <svg
      className="wi-evidence-svg"
      width={width}
      height="178"
      viewBox={`0 0 ${width} 178`}
      role="img"
      aria-label={t('沿绳的动能、形变能密度与瞬时能流')}
    >
      <text x="0" y="18" className="wi-svg-muted">
        mJ / m
      </text>
      <line x1={pad} x2={width - pad} y1={base} y2={base} stroke="#91a4b8" strokeOpacity=".35" />
      <path
        d={area('potential')}
        fill={STRING_COLORS.potential}
        fillOpacity=".18"
        stroke={STRING_COLORS.potential}
        strokeWidth="1.5"
      />
      <path
        d={area('kinetic')}
        fill={STRING_COLORS.kinetic}
        fillOpacity=".23"
        stroke={STRING_COLORS.kinetic}
        strokeWidth="1.5"
      />
      <text x="0" y={base - 60 + 5} className="wi-svg-muted">
        1
      </text>
      {Array.from({ length: 8 }, (_, i) => -span + ((i + 0.5) * span) / 4).map((n) => {
        const s = interferenceAt(input, n);
        return <Arrow key={n} x={x(n)} y={137} dx={s.flux * 1400} dy={0} color="#d5e0e8" />;
      })}
      <text x={pad} y="169" className="wi-svg-muted">
        −{span.toFixed(1)} m
      </text>
      <text x={width - pad} y="169" textAnchor="end" className="wi-svg-muted">
        +{span.toFixed(1)} m
      </text>
    </svg>
  );
}

export function WaveInterferenceTrace({
  input,
  width,
}: {
  input: InterferenceInput;
  width: number;
}) {
  const min = -0.12,
    max = 0.12,
    n = 161,
    pad = 24,
    x = (time: number) => pad + ((time - min) / (max - min)) * (width - 2 * pad),
    cy = 75,
    scale = 9000;
  const samples = Array.from({ length: n }, (_, i) => {
    const time = min + ((max - min) * i) / (n - 1);
    return { time, y: interferenceAt({ ...input, time }, input.probe).y };
  });
  const point = interferenceAt(input, input.probe);
  return (
    <svg
      className="wi-evidence-svg"
      width={width}
      height="144"
      viewBox={`0 0 ${width} 144`}
      role="img"
      aria-label={t('物质点 P 的完整时间轨迹，不随波峰前进')}
    >
      <text x="0" y="18" className="wi-svg-muted">
        P · x = {input.probe.toFixed(1)} m
      </text>
      <line x1={pad} x2={width - pad} y1={cy} y2={cy} stroke="#91a4b8" strokeOpacity=".3" />
      <path
        d={samples.map((s, i) => `${i ? 'L' : 'M'}${x(s.time)},${cy - s.y * scale}`).join(' ')}
        fill="none"
        stroke="#e8cc8c"
        strokeWidth="2"
      />
      <line
        x1={x(input.time)}
        x2={x(input.time)}
        y1="32"
        y2="117"
        stroke="#e8cc8c"
        strokeOpacity=".4"
      />
      <circle cx={x(input.time)} cy={cy - point.y * scale} r="5" fill="#e8cc8c" />
      <text x={pad} y="139" className="wi-svg-muted">
        −0.12 s
      </text>
      <text x={width - pad} y="139" textAnchor="end" className="wi-svg-muted">
        +0.12 s
      </text>
    </svg>
  );
}

export function WaveInterferencePhase({
  input,
  width,
}: {
  input: InterferenceInput;
  width: number;
}) {
  const pad = 30,
    max = width - pad,
    min = pad,
    base = 107,
    scale = 8500;
  const curve = Array.from({ length: 129 }, (_, i) => {
    const phase = (Math.PI * i) / 128;
    return `${i ? 'L' : 'M'}${min + ((max - min) * i) / 128},${base - samePointAmplitude(input.ratio, phase) * scale}`;
  }).join(' ');
  const amplitude = samePointAmplitude(input.ratio, input.phase);
  return (
    <svg
      className="wi-evidence-svg"
      width={width}
      height="150"
      viewBox={`0 0 ${width} 150`}
      role="img"
      aria-label={t('相位差改变合振幅，反相也需要等振幅才能全消')}
    >
      <text x="0" y="18" className="wi-svg-muted">
        {t('合振幅')} / mm
      </text>
      <line x1={min} x2={max} y1={base} y2={base} stroke="#91a4b8" strokeOpacity=".3" />
      <path d={curve} fill="none" stroke={STRING_COLORS.sum} strokeWidth="2" />
      <circle
        cx={min + ((max - min) * input.phase) / Math.PI}
        cy={base - amplitude * scale}
        r="5"
        fill={STRING_COLORS.sum}
      />
      <text x={min} y="142" textAnchor="middle" className="wi-svg-muted">
        0°
      </text>
      <text x={max} y="142" textAnchor="middle" className="wi-svg-muted">
        180°
      </text>
      <text x="0" y={base - 0.008 * scale + 5} className="wi-svg-muted">
        8
      </text>
    </svg>
  );
}
