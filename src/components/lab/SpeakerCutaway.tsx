import { useId } from 'react';
import { t } from '../../i18n';
import {
  speakerAir,
  speakerGeometry,
  type SpeakerParameters,
  type SpeakerPoint,
  type SpeakerView,
  type speakerEvaluate,
  type speakerResponse,
} from '../../models/speaker';
type State = ReturnType<typeof speakerEvaluate>;
type Response = ReturnType<typeof speakerResponse>;
const poly = (points: SpeakerPoint[], project: (p: SpeakerPoint) => SpeakerPoint, close = true) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${project(p).join(',')}`).join(' ') + (close ? 'Z' : '');
const cubic = (points: SpeakerPoint[], project: (p: SpeakerPoint) => SpeakerPoint) =>
  `M${project(points[0]).join(',')}C${points
    .slice(1)
    .map((p) => project(p).join(','))
    .join(' ')}`;
function Vector({ a, b, color }: { a: SpeakerPoint; b: SpeakerPoint; color: string }) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    n = Math.hypot(dx, dy);
  if (n < 2) return null;
  const ux = dx / n,
    uy = dy / n;
  const d = `M${a}L${b}m${-6 * ux + 3 * uy},${-6 * uy - 3 * ux}L${b}l${-6 * ux - 3 * uy},${-6 * uy + 3 * ux}`;
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke="#f3f0e5" strokeWidth="4.5" />
      <path d={d} stroke={color} strokeWidth="2" />
    </g>
  );
}

/** A meridional section of one connected driver. The overview faces upward; phone suspension shots isolate one connected side. */
export function SpeakerCutaway({
  state,
  width,
  compact,
  view,
}: {
  state: State;
  width: number;
  compact: boolean;
  view: SpeakerView;
}) {
  const uid = useId().replaceAll(':', ''),
    geometry = speakerGeometry(state.position),
    gap = view === 'gap' || view === 'generator',
    half = compact && view === 'suspension';
  const height = compact ? 212 : 330;
  const bounds = gap
    ? { z0: -31, z1: -3, r0: 7, r1: 23 }
    : half
      ? { z0: -12, z1: 53, r0: 8, r1: 73 }
      : { z0: -42, z1: 54, r0: -74, r1: 74 };
  const vertical = !gap;
  const worldWidth = vertical ? bounds.r1 - bounds.r0 : bounds.z1 - bounds.z0,
    worldHeight = vertical ? bounds.z1 - bounds.z0 : bounds.r1 - bounds.r0;
  const scale = Math.min((width - 34) / worldWidth, (height - 90) / worldHeight);
  const project = (p: SpeakerPoint): SpeakerPoint =>
    vertical
      ? [
          width / 2 + (p[1] - (bounds.r0 + bounds.r1) / 2) * scale,
          height / 2 - (p[0] - (bounds.z0 + bounds.z1) / 2) * scale,
        ]
      : [
          width / 2 + (p[0] - (bounds.z0 + bounds.z1) / 2) * scale,
          height / 2 - (p[1] - (bounds.r0 + bounds.r1) / 2) * scale,
        ];
  const label = (text: string, point: SpeakerPoint, left: boolean, top: boolean) => {
    const dest = project(point),
      reach = Math.min(width / 2 - 7, (worldWidth * scale) / 2 + 65),
      tx = width / 2 + (left ? -reach : reach),
      ty = top ? 22 : height - 9;
    return (
      <g>
        <path
          d={`M${tx},${top ? 29 : height - 30}L${dest}`}
          fill="none"
          stroke="#7f898e"
          strokeWidth="1"
        />
        <circle cx={dest[0]} cy={dest[1]} r="2.4" fill="#63777d" />
        <text x={tx} y={ty} textAnchor={left ? 'start' : 'end'}>
          {t(text)}
        </text>
      </g>
    );
  };
  return (
    <svg
      className="speaker-cutaway"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('扬声器剖面：磁路、音圈、锥盆与连续连接的悬挂')}
    >
      <defs>
        <linearGradient id={`${uid}-steel`} x1="0" x2="1" y1="0" y2=".6">
          <stop stopColor="#dce1df" />
          <stop offset=".45" stopColor="#879393" />
          <stop offset="1" stopColor="#c4cfca" />
        </linearGradient>
        <linearGradient id={`${uid}-magnet`}>
          <stop stopColor="#a16c60" />
          <stop offset=".6" stopColor="#754e49" />
          <stop offset="1" stopColor="#b18873" />
        </linearGradient>
        <linearGradient id={`${uid}-cone`}>
          <stop stopColor="#525b5d" />
          <stop offset=".6" stopColor="#263235" />
          <stop offset="1" stopColor="#76817d" />
        </linearGradient>
        <clipPath id={`${uid}-clip`}>
          <rect x="10" y="40" width={width - 20} height={height - 78} rx="8" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}-clip)`} strokeLinejoin="round" strokeLinecap="round">
        {!gap && (
          <path
            d={poly(
              [
                [bounds.z0, 0],
                [bounds.z1, 0],
              ],
              project,
              false,
            )}
            stroke="#829191"
            strokeOpacity=".25"
            strokeDasharray="3 6"
          />
        )}
        {geometry.halves.map((h) => (
          <g key={h.sign}>
            <path d={poly(h.basket, project)} fill="#a6b0aa" stroke="#7c8a87" strokeWidth="1.1" />
            <path d={poly(h.shelf, project)} fill="#a6b0aa" stroke="#7c8a87" />
            <path d={poly(h.magnet, project)} fill={`url(#${uid}-magnet)`} stroke="#805f52" />
            <path d={poly(h.topPlate, project)} fill={`url(#${uid}-steel)`} stroke="#71817e" />
          </g>
        ))}
        <path d={poly(geometry.backPlate, project)} fill={`url(#${uid}-steel)`} stroke="#71817e" />
        <path d={poly(geometry.pole, project)} fill={`url(#${uid}-steel)`} stroke="#71817e" />
        {geometry.halves.map((h) => (
          <g key={h.sign}>
            {(view === 'assembly' || gap) && (
              <path
                d={poly(h.flux, project, false)}
                fill="none"
                stroke="#468b9a"
                strokeOpacity=".72"
                strokeWidth="1.4"
                strokeDasharray="4 4"
              />
            )}
            <path d={poly(h.bobbin, project)} fill="#d6bf9a" stroke="#a38962" strokeWidth=".7" />
            {h.coil.map((p, i) => {
              const q = project(p);
              return (
                <circle
                  key={i}
                  cx={q[0]}
                  cy={q[1]}
                  r={Math.max(0.7, 0.68 * scale)}
                  fill={state.current >= 0 ? '#c37649' : '#ab603e'}
                  stroke="#704c35"
                  strokeWidth=".5"
                />
              );
            })}
            <path
              d={poly(h.cone, project)}
              fill={`url(#${uid}-cone)`}
              stroke="#465452"
              strokeWidth="1.1"
            />
            <path
              d={poly(h.spider, project, false)}
              fill="none"
              stroke="#a27546"
              strokeWidth={view === 'suspension' ? 3 : 2}
            />
            <path
              d={cubic(h.surround, project)}
              fill="none"
              stroke="#596761"
              strokeWidth={Math.max(3, 2.1 * scale)}
            />
            <path d={cubic(h.lead, project)} fill="none" stroke="#4a4035" strokeWidth="2.5" />
            <path d={cubic(h.lead, project)} fill="none" stroke="#c49b67" strokeWidth="1.1" />
            <path d={poly(h.leadTail, project, false)} stroke="#b98950" strokeWidth="1.3" />
            <circle
              cx={project(h.lead[0])[0]}
              cy={project(h.lead[0])[1]}
              r="3.5"
              fill="#a67c46"
              stroke="#584f3c"
            />
            {gap && h.sign === 1 && (
              <>
                <Vector a={project([-14, 15])} b={project([-14, 11])} color="#387e91" />
                <Vector
                  a={project([-20 + geometry.motion, 13.5])}
                  b={project([-20 + geometry.motion + state.force * 38, 13.5])}
                  color="#ae542d"
                />
              </>
            )}
          </g>
        ))}
        <path
          d={cubic(geometry.dustCap, project)}
          fill={`url(#${uid}-cone)`}
          stroke="#58635d"
          strokeWidth="1.5"
        />
      </g>
      {gap ? (
        <>
          {label('音圈', [-24 + geometry.motion, 13.5], true, true)}
          {label('磁隙', [-14, 12], false, false)}
          <text x={width - 8} y="22" textAnchor="end" fill="#347e91">
            B
          </text>
          <text x="8" y={height - 9} fill="#ae542d">
            F = Bl · i
          </text>
        </>
      ) : view === 'suspension' ? (
        <>
          {label('折环', geometry.halves[1].surround[0], false, true)}
          {label('弹波', geometry.halves[1].spider[24], true, false)}
        </>
      ) : (
        <>
          {label('锥盆', [26 + geometry.motion, 43], true, true)}
          {label('永久磁体', [-28, 28], false, false)}
        </>
      )}
    </svg>
  );
}

export function SpeakerSignal({
  state,
  width,
  kind,
}: {
  state: State;
  width: number;
  kind: 'force' | 'motion' | 'emf';
}) {
  const rows =
    kind === 'force'
      ? [
          {
            symbol: 'i',
            value: state.current * 1000,
            unit: 'mA',
            max: 70,
            color: '#b76640',
          },
          {
            symbol: 'F = Bl · i',
            value: state.force,
            unit: 'N',
            max: 0.28,
            color: '#b76640',
          },
        ]
      : kind === 'emf'
        ? [
            {
              symbol: 'v',
              value: state.velocity * 1000,
              unit: 'mm/s',
              max: 70,
              color: '#487e8b',
            },
            {
              symbol: 'e = Bl · v',
              value: state.backEmf,
              unit: 'V',
              max: 0.28,
              color: '#487e8b',
            },
          ]
        : [
            {
              symbol: 'x',
              value: state.position * 1000,
              unit: 'mm',
              max: 0.4,
              color: '#b76640',
            },
            {
              symbol: '−Kx',
              value: state.springForce,
              unit: 'N',
              max: 0.48,
              color: '#487e8b',
            },
          ];
  const compact = width < 690,
    height = compact ? 110 : 138;
  return (
    <svg
      className="speaker-instrument"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('从同一状态计算的正负读数')}
    >
      {rows.map((r, i) => {
        const y = (compact ? 22 : 26) + i * (compact ? 52 : 67),
          mid = width / 2,
          half = (width - 28) / 2;
        return (
          <g key={r.symbol}>
            <text x="0" y={y}>
              {r.symbol}
            </text>
            <text x={width} y={y} textAnchor="end">
              {r.value.toFixed(r.unit === 'mA' || r.unit === 'mm/s' ? 1 : 3)} {r.unit}
            </text>
            <line x1="14" x2={width - 14} y1={y + 20} y2={y + 20} stroke="#c7cbc4" />
            <line x1={mid} x2={mid} y1={y + 13} y2={y + 27} stroke="#83958f" />
            <line
              x1={mid}
              x2={mid + (r.value / r.max) * half}
              y1={y + 20}
              y2={y + 20}
              stroke={r.color}
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

export function SpeakerPower({ state, width }: { state: State; width: number }) {
  const rows = [
    { name: '输入', v: state.inputPower, color: '#546f70' },
    { name: '铜损', v: state.copperLoss, color: '#b66b42' },
    { name: '机械耗散', v: state.mechanicalLoss, color: '#af9772' },
    { name: '储能变化率', v: state.storedRate, color: '#4e8496' },
  ];
  const max = 0.03,
    axis = width * 0.46,
    available = width - axis - 16;
  return (
    <svg
      className="speaker-instrument"
      width={width}
      height="230"
      viewBox={`0 0 ${width} 230`}
      role="img"
      aria-label={t('瞬时输入功率等于耗散与储能变化率之和')}
    >
      {rows.map((r, i) => {
        const y = 22 + i * 51;
        return (
          <g key={r.name}>
            <text x="0" y={y}>
              {t(r.name)}
            </text>
            <text x={width} y={y} textAnchor="end">
              {(r.v * 1000).toFixed(2)} mW
            </text>
            <line x1="16" x2={width - 16} y1={y + 17} y2={y + 17} stroke="#d5d6cf" />
            <line x1={axis} x2={axis} y1={y + 11} y2={y + 23} stroke="#899a92" />
            <line
              x1={axis}
              x2={axis + (r.v / max) * available}
              y1={y + 17}
              y2={y + 17}
              stroke={r.color}
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
        );
      })}
      <text x="0" y="225" className="speaker-muted">
        {t('储能可增也可减。')}
      </text>
    </svg>
  );
}

export function SpeakerResponsePlot({
  curve,
  width,
  frequency,
  voltage,
  amplitude,
}: {
  curve: Response[];
  width: number;
  frequency: number;
  voltage: number;
  amplitude: number;
}) {
  const pad = 30,
    x = (f: number) => pad + (Math.log(f / 20) / Math.log(20)) * (width - 2 * pad),
    baseline = 160,
    scale = 400;
  const d = curve
    .map(
      (s, i) =>
        `${i ? 'L' : 'M'}${x(s.frequency)},${baseline - s.amplitude * voltage * 1000 * scale}`,
    )
    .join(' ');
  return (
    <svg
      className="speaker-instrument"
      width={width}
      height="222"
      viewBox={`0 0 ${width} 222`}
      role="img"
      aria-label={t('固定峰值电压下的稳态最大行程，不是声压频响')}
    >
      <text x="0" y="20">
        {t('峰值行程')} / mm
      </text>
      {[0.1, 0.2, 0.3].map((v) => (
        <g key={v}>
          <line
            x1={pad}
            x2={width - pad}
            y1={baseline - v * scale}
            y2={baseline - v * scale}
            stroke="#d6d9d0"
          />
          <text x="0" y={baseline - v * scale + 5}>
            {v.toFixed(1)}
          </text>
        </g>
      ))}
      <path d={d} fill="none" stroke="#ac5f3a" strokeWidth="2.5" />
      <line
        x1={x(frequency)}
        x2={x(frequency)}
        y1="32"
        y2={baseline}
        stroke="#9c8a6d"
        strokeDasharray="3 5"
      />
      <circle cx={x(frequency)} cy={baseline - amplitude * 1000 * scale} r="5" fill="#bd7848" />
      {[20, 50, 100, 400].map((f) => (
        <text key={f} x={x(f)} y="187" textAnchor="middle">
          {f}
        </text>
      ))}
      <text x={width} y="213" textAnchor="end">
        Hz
      </text>
    </svg>
  );
}

export function SpeakerAir({
  parameters,
  frequency,
  voltage,
  phase,
  width,
  compact,
}: {
  parameters: SpeakerParameters;
  frequency: number;
  voltage: number;
  phase: number;
  width: number;
  compact: boolean;
}) {
  const air = speakerAir(parameters, frequency, voltage, phase, compact ? 21 : 37),
    height = compact ? 312 : 248;
  const along = (s: number) =>
      compact ? 238 - (s / air.wavelength) * 182 : 42 + (s / air.wavelength) * (width - 84),
    cross = (n: number) => (compact ? width / 2 + n * 18 : 98 + n * 18);
  const pos = (s: number, n: number): SpeakerPoint =>
    compact ? [cross(n), along(s)] : [along(s), cross(n)];
  const color = (value: number) => (value > 0 ? '#a66c4e' : '#668d9b');
  return (
    <svg
      className="speaker-air"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t('一维向外传播的压缩与原位往复的空气质点')}
    >
      <text x="0" y="20">
        {t('一维平面波示意')}
      </text>
      {(() => {
        const q = pos(air.boundary.position, 0);
        return compact ? (
          <rect x={q[0] - 53} y={q[1] - 3} width="106" height="6" rx="3" fill="#5c6b64" />
        ) : (
          <rect x={q[0] - 3} y={q[1] - 53} width="6" height="106" rx="3" fill="#5c6b64" />
        );
      })()}
      {air.particles.flatMap((p, i) =>
        [-2, -1, 0, 1, 2].map((n) => {
          const q = pos(p.position, n);
          return (
            <circle
              key={`${i}-${n}`}
              cx={q[0]}
              cy={q[1]}
              r={compact ? 2.5 : 3}
              fill={color(p.shade)}
              fillOpacity={0.46 + 0.48 * Math.abs(p.shade)}
            />
          );
        }),
      )}
      {(() => {
        const actual = pos(air.tracked.position, 0),
          rest = pos(air.tracked.rest, 0);
        return (
          <g>
            <circle
              cx={rest[0]}
              cy={rest[1]}
              r="12"
              stroke="#c0a66f"
              strokeDasharray="2 4"
              fill="none"
            />
            <circle cx={actual[0]} cy={actual[1]} r="5.5" fill="#d2a64f" stroke="#fff0c5" />
            <text
              x={compact ? actual[0] + 17 : actual[0]}
              y={compact ? actual[1] + 5 : actual[1] - 22}
              textAnchor={compact ? 'start' : 'middle'}
            >
              P
            </text>
          </g>
        );
      })()}
      {compact ? (
        <>
          <Vector a={[width - 22, 125]} b={[width - 22, 66]} color="#5a777b" />
          <text x="0" y="276">
            {t('质点往复。')}
          </text>
          <text x="0" y="301">
            {t('压缩传播。')}
          </text>
        </>
      ) : (
        <>
          <Vector a={[width * 0.38, 192]} b={[width * 0.62, 192]} color="#5a777b" />
          <text x="0" y="238">
            {t('质点往复，压缩向外。')}
          </text>
        </>
      )}
    </svg>
  );
}
