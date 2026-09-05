import { t } from '../../i18n';
import {
  interferenceAt,
  interferenceEnergy,
  interferenceSamples,
  samePointAmplitude,
  standingNodes,
  type InterferenceInput,
  type InterferenceView,
} from '../../models/wave-interference';
import { STRING_COLORS as color } from './WaveInterferenceString';

/** Phone coordinates are rendered pixels. The string and its current evidence share one sheet. */
export const WAVE_PHONE_HEIGHT = 382;
export function WaveInterferencePhone({
  input,
  view,
  width,
}: {
  input: InterferenceInput;
  view: InterferenceView;
  width: number;
}) {
  const phase = view === 'phase' || view === 'amplitude';
  const energy = view === 'energy' || view === 'nodes';
  const span = ['material', 'pass', 'formation'].includes(view) ? 1.6 : 0.8;
  const pad = 27,
    x = (p: number) => pad + ((p + span) / (2 * span)) * (width - 2 * pad);
  const samples = interferenceSamples(input, -span, span, 241);
  const path = (key: 'y' | 'first' | 'second', baseline = 100, scale = 6000) =>
    samples
      .map(
        (s, i) => `${i ? 'L' : 'M'}${x(s.x)},${baseline - (key === 'y' ? s.y : s[key].y) * scale}`,
      )
      .join('');
  const point = interferenceAt(input, input.probe);
  const positions = [32, width / 2, width - 32];
  const components = [point.first.y, point.second.y, point.y];
  const arrow = (px: number, py: number, dx: number, dy: number, stroke: string) => {
    const length = Math.hypot(dx, dy);
    if (length < 2) return null;
    const ux = dx / length,
      uy = dy / length,
      ex = px + dx,
      ey = py + dy;
    return (
      <path
        d={`M${px},${py}L${ex},${ey}m${-ux * 5 - uy * 3},${-uy * 5 + ux * 3}L${ex},${ey}l${-ux * 5 + uy * 3},${-uy * 5 - ux * 3}`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    );
  };
  const columns = (top: number, baseline: number, numberY: number) => (
    <>
      <path d={`M12,${baseline}H${width - 12}`} stroke="#8c9dad" strokeOpacity=".35" />
      {components.map((v, i) => (
        <g key={i}>
          <text
            x={positions[i]}
            y={top}
            textAnchor="middle"
            fill={[color.first, color.second, color.sum][i]}
          >
            {['A', 'B', 'A + B'][i]}
          </text>
          <path
            d={`M${positions[i]},${baseline}v${-v * 5000}`}
            stroke={[color.first, color.second, color.sum][i]}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle
            cx={positions[i]}
            cy={baseline - v * 5000}
            r="4"
            fill={[color.first, color.second, color.sum][i]}
          />
          <text x={positions[i]} y={numberY} textAnchor="middle">
            {(v * 1000).toFixed(1)}
          </text>
        </g>
      ))}
      <text x={(positions[0] + positions[1]) / 2} y={baseline + 5} textAnchor="middle">
        +
      </text>
      <text x={(positions[1] + positions[2]) / 2} y={baseline + 5} textAnchor="middle">
        =
      </text>
    </>
  );
  const totals = energy ? interferenceEnergy(input, -span, span) : null;
  const trace = Array.from({ length: 161 }, (_, i) => {
    const time = -0.12 + (i * 0.24) / 160;
    return { time, y: interferenceAt({ ...input, time }, input.probe).y };
  });
  const tx = (time: number) => 24 + ((time + 0.12) / 0.24) * (width - 48);
  const ampPath = Array.from({ length: 129 }, (_, i) => {
    const p = (Math.PI * i) / 128;
    return `${i ? 'L' : 'M'}${30 + (i / 128) * (width - 60)},${293 - samePointAmplitude(input.ratio, p) * 7500}`;
  }).join('');
  return (
    <svg
      className="wi-phone-instrument"
      width={width}
      height={WAVE_PHONE_HEIGHT}
      viewBox={`0 0 ${width} ${WAVE_PHONE_HEIGHT}`}
      role="img"
      aria-label={t(phase ? '同一物质点的两项位移与它们的和' : '绳上的两列波、合位移与固定物质点')}
    >
      {phase ? (
        <>
          <text x="0" y="18">
            P · x = {input.probe.toFixed(1)} m
          </text>
          <text x={width} y="18" textAnchor="end">
            mm
          </text>
          {columns(46, 111, 179)}
          <text x="0" y="216">
            {t('合振幅')} / mm
          </text>
          <path d={`M30,293H${width - 30}`} stroke="#8198ae" />
          <path d={ampPath} fill="none" stroke={color.sum} strokeWidth="2" />
          <circle
            cx={30 + (input.phase / Math.PI) * (width - 60)}
            cy={293 - samePointAmplitude(input.ratio, input.phase) * 7500}
            r="5"
            fill={color.sum}
          />
          <text x="0" y="239">
            8
          </text>
          <text x="30" y="319" textAnchor="middle">
            0°
          </text>
          <text x={width - 30} y="319" textAnchor="middle">
            180°
          </text>
          <text x="0" y="366">
            Δφ {Math.round((input.phase * 180) / Math.PI)}°
          </text>
          <text x={width} y="366" textAnchor="end">
            {(samePointAmplitude(input.ratio, input.phase) * 1000).toFixed(2)} mm
          </text>
        </>
      ) : (
        <>
          <text x="0" y="18" fill={color.first}>
            A →
          </text>
          <text x={width} y="18" textAnchor="end" fill={color.second}>
            ← B
          </text>
          <text x={width / 2} y="18" textAnchor="middle">
            {t('实际绳形')}
          </text>
          <text x="0" y="43">
            y / mm
          </text>
          <path
            d={`M${pad},100H${width - pad}`}
            stroke="#8198ae"
            strokeDasharray="3 6"
            strokeOpacity=".35"
          />
          {[8, -8].map((v) => (
            <g key={v}>
              <path d={`M${pad - 3},${100 - v * 6}h6`} stroke="#8198ae" />
              <text x="0" y={105 - v * 6}>
                {v > 0 ? '+8' : '−8'}
              </text>
            </g>
          ))}
          {view === 'nodes' &&
            input.ratio === 1 &&
            standingNodes(-span, span, input.phase).map((n) => (
              <g key={n}>
                <path
                  d={`M${x(n)},49V155`}
                  stroke="#8b9dad"
                  strokeDasharray="2 5"
                  strokeOpacity=".4"
                />
                <circle cx={x(n)} cy="100" r="9" fill="none" stroke="#bdc9d0" />
              </g>
            ))}
          <path
            d={path('first')}
            fill="none"
            stroke={color.first}
            strokeDasharray="5 5"
            strokeWidth="1.6"
          />
          <path
            d={path('second')}
            fill="none"
            stroke={color.second}
            strokeDasharray="2 5"
            strokeWidth="1.6"
          />
          <path d={path('y')} fill="none" stroke={color.sum} strokeWidth="3" />
          {Array.from({ length: Math.round(span / 0.1) + 1 }, (_, i) => -span + 0.2 * i).map(
            (n) => {
              const s = interferenceAt(input, n),
                y = 100 - s.y * 6000;
              return (
                <g key={n}>
                  <circle cx={x(n)} cy={y} r="2.5" fill="#173047" stroke={color.sum} />
                  {energy && arrow(x(n), y, 0, -s.dt * 110, color.kinetic)}
                </g>
              );
            },
          )}
          <path
            d={`M${x(input.probe)},47V164`}
            stroke="#e9c66f"
            strokeOpacity=".45"
            strokeDasharray="2 5"
          />
          <circle cx={x(input.probe)} cy={100 - point.y * 6000} r="5" fill="#e9c66f" />
          <text x={pad} y="179">
            −{span.toFixed(1)} m
          </text>
          <text x={width - pad} y="179" textAnchor="end">
            +{span.toFixed(1)} m
          </text>
          <text x={x(input.probe)} y="199" textAnchor="middle" fill="#efd391">
            P
          </text>
          <path d={`M0,207H${width}`} stroke="#8b9dad" strokeOpacity=".25" />
          {['material', 'pass'].includes(view) ? (
            <>
              <text x="0" y="233">
                P · x = {input.probe.toFixed(1)} m
              </text>
              <path d={`M24,278H${width - 24}`} stroke="#8b9dad" strokeOpacity=".45" />
              <path
                d={trace
                  .map((s, i) => `${i ? 'L' : 'M'}${tx(s.time)},${278 - s.y * 6500}`)
                  .join('')}
                fill="none"
                stroke="#e8cc8c"
                strokeWidth="2"
              />
              <path d={`M${tx(input.time)},245V320`} stroke="#e8cc8c" strokeOpacity=".45" />
              <circle cx={tx(input.time)} cy={278 - point.y * 6500} r="4" fill="#e8cc8c" />
              <text x="24" y="337">
                −0.12 s
              </text>
              <text x={width - 24} y="337" textAnchor="end">
                +0.12 s
              </text>
              <text x="0" y="369">
                t = {input.time.toFixed(3)} s
              </text>
            </>
          ) : energy ? (
            <>
              <text x="0" y="228" fill={color.kinetic}>
                {t('动能')}
              </text>
              <text x={width} y="228" textAnchor="end" fill={color.potential}>
                {t('形变能')}
              </text>
              <text x={width} y="251" textAnchor="end">
                mJ / m
              </text>
              <path d={`M${pad},292H${width - pad}`} stroke="#8b9dad" />
              {(['potential', 'kinetic'] as const).map((key) => (
                <path
                  key={key}
                  d={`${samples.map((s, i) => `${i ? 'L' : 'M'}${x(s.x)},${292 - s[key] * 48000}`).join('')}L${x(span)},292H${x(-span)}Z`}
                  fill={color[key]}
                  fillOpacity=".2"
                  stroke={color[key]}
                  strokeWidth="1.5"
                />
              ))}
              <text x="0" y="249">
                1
              </text>
              {Array.from({ length: 8 }, (_, i) => -span + ((i + 0.5) * span) / 4).map((n) => (
                <g key={n}>
                  {arrow(x(n), 313, interferenceAt(input, n).flux * 1400, 0, '#d5e0e8')}
                </g>
              ))}
              <text x={width / 2} y="340" textAnchor="middle">
                {t('瞬时能流')}
              </text>
              <text x="0" y="369">
                {t('观察窗内')}
              </text>
              <text x={width} y="369" textAnchor="end">
                {(totals!.total * 1000).toFixed(3)} mJ
              </text>
            </>
          ) : (
            <>
              {columns(236, 286, 351)}
              <text x="0" y="376">
                P · x = {input.probe.toFixed(1)} m
              </text>
              <text x={width} y="376" textAnchor="end">
                mm
              </text>
            </>
          )}
        </>
      )}
    </svg>
  );
}
