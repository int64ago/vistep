import { useId } from 'react';
import { t } from '../../i18n';
import { BRAKE, type brakeState } from '../../models/brake';
import { useCompact } from './useCompact';
type State = ReturnType<typeof brakeState>;
/** Cross-section display coordinates: radial dimensions follow the same diameter.
 * Longitudinal travel remains deliberately enlarged by 14 px/mm. */
export function brakeMasterSection(diameter: number, stroke: number) {
  const axis = 114,
    radius = (22 * diameter) / BRAKE.masterDiameter,
    boreTop = axis - radius,
    boreBottom = axis + radius,
    outerTop = boreTop - 10,
    outerBottom = boreBottom + 10,
    reservoirBottom = outerTop - 20;
  return {
    axis,
    radius,
    boreTop,
    boreBottom,
    outerTop,
    outerBottom,
    reservoirBottom,
    reservoirTop: reservoirBottom - 25,
    face: 70 + stroke * 14,
  };
}
export default function BrakeSection({
  state,
  view,
  readouts = true,
}: {
  state: State;
  view: 'master' | 'caliper';
  readouts?: boolean;
}) {
  const compact = useCompact(),
    id = useId().replace(/:/g, ''),
    w = compact ? 320 : 430,
    center = w / 2;
  const gap = (BRAKE.padGap - state.padTravel) * 80,
    compression = state.padCompression * 6;
  const master = brakeMasterSection(state.diameter, state.stroke),
    face = master.face;
  return (
    <div className="brake-section">
      <div className="brake-section-title">
        <span>{t(view === 'master' ? '主缸与补偿孔' : '两侧同时接近')}</span>
        <small>{t('位移放大示意')}</small>
      </div>
      <svg
        viewBox={`0 0 ${w} ${view === 'master' ? 172 : 164}`}
        role="img"
        aria-label={t(
          view === 'master'
            ? '活塞越过补偿孔后，排液进入封闭的制动油路'
            : '两个活塞等量向碟片移动，接触后共同建立夹紧力',
        )}
      >
        <defs>
          <linearGradient id={`${id}-oil`}>
            <stop stopColor="#e5c78a" />
            <stop offset="1" stopColor={state.pressure > 1 ? '#d59762' : '#e1c699'} />
          </linearGradient>
          <pattern id={`${id}-metal`} width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M0 5L5 0" stroke="#aeb7ad" strokeWidth=".6" />
          </pattern>
        </defs>
        {view === 'master' ? (
          <g transform={compact ? undefined : `translate(${(w - 430) / 2} 0)`}>
            <path
              d={`M57 ${master.reservoirBottom}V${master.reservoirTop}H119V${master.reservoirBottom}`}
              stroke="#8d9a91"
              strokeWidth="2"
              fill="#e8e7d9"
            />
            <rect
              x="62"
              y={master.reservoirBottom - 18}
              width="52"
              height="18"
              fill={`url(#${id}-oil)`}
            />
            <path
              d={`M75.6 ${master.reservoirBottom}V${master.boreTop}`}
              stroke={state.portOpen ? '#c59148' : '#6f7e72'}
              strokeWidth="5"
            />
            <rect
              x="42"
              y={master.outerTop}
              width={compact ? 216 : 338}
              height={master.outerBottom - master.outerTop}
              rx="8"
              fill={`url(#${id}-metal)`}
              stroke="#9ba79b"
            />
            <rect
              x="48"
              y={master.boreTop}
              width={compact ? 205 : 326}
              height={2 * master.radius}
              rx="3"
              fill="#e1e6dc"
            />
            <rect
              x={face}
              y={master.boreTop}
              width={(compact ? 253 : 374) - face}
              height={2 * master.radius}
              fill={`url(#${id}-oil)`}
            />
            <path d={`M16 ${master.axis}H${face - 18}`} stroke="#8b9991" strokeWidth="8" />
            <rect
              x={face - 20}
              y={master.boreTop}
              width="20"
              height={2 * master.radius}
              rx="2"
              fill="#77897f"
            />
            <rect
              data-master-seal="true"
              x={face - 4}
              y={master.boreTop}
              width="4"
              height={2 * master.radius}
              rx="1"
              fill="#455d50"
            />
            <path
              d={`M${compact ? 253 : 374} ${master.axis}H${compact ? 294 : 414}`}
              stroke="#cd9b57"
              strokeWidth="7"
            />
            <path
              d={`M75.6 ${master.outerTop}V${master.boreTop}`}
              stroke={state.portOpen ? '#d4a562' : '#a7b09e'}
              strokeWidth="4"
            />
            {state.bubbleVolume > 0 && (
              <ellipse
                cx={compact ? 210 : 300}
                cy={master.axis - 3}
                rx={Math.cbrt(state.bubbleRemaining) * 3.1}
                ry={Math.cbrt(state.bubbleRemaining) * 2.4}
                fill="#faf5df"
                stroke="#b9925d"
              />
            )}
            <path d={`M75.6 ${master.outerBottom + 1}V169`} stroke="#9ba899" fill="none" />
          </g>
        ) : (
          <g>
            <rect x={center - 4} y="24" width="8" height="136" rx="1" fill="#7f9190" />
            {[-1, 1].map((sign) => {
              const near = center + sign * (4 + gap),
                padW = 17 - compression,
                pistonX = near + sign * (padW + 4);
              return (
                <g key={sign}>
                  <rect
                    x={sign < 0 ? center - 132 : pistonX + 27}
                    y="45"
                    width={sign < 0 ? pistonX - 27 - (center - 132) : center + 132 - (pistonX + 27)}
                    height="67"
                    rx="3"
                    fill={`url(#${id}-oil)`}
                  />
                  <path
                    d={`M${center + sign * 132} 123V34H${center + sign * 35}`}
                    stroke="#9eafa1"
                    strokeWidth="8"
                    fill="none"
                  />
                  <rect
                    x={Math.min(pistonX, pistonX + sign * 27)}
                    y="44"
                    width="27"
                    height="69"
                    rx="3"
                    fill="#8c9e95"
                  />
                  <rect
                    x={sign < 0 ? near - padW : near}
                    y="44"
                    width={padW}
                    height="69"
                    rx="3"
                    fill="#695f50"
                  />
                  <path
                    d={`M${center + sign * 111} 79h${-sign * 35}m${sign * 9} -5l${-sign * 9} 5l${sign * 9} 5`}
                    fill="none"
                    stroke="#9a6c42"
                    strokeWidth="2"
                    opacity={0.35 + Math.min(1, state.pressure) / 2}
                  />
                </g>
              );
            })}
          </g>
        )}
      </svg>
      <div className="brake-section-copy">
        {view === 'master' ? (
          <>
            <div className="brake-port-state">
              <span>{t('储液腔')}</span>
              <strong>{t(state.portOpen ? '补偿孔开启' : '补偿孔关闭')}</strong>
            </div>
            <p>
              {state.stroke.toFixed(2)} mm · {state.pressure.toFixed(2)} MPa
            </p>
          </>
        ) : (
          <>
            {readouts && (
              <div className="brake-pad-readouts">
                <span>{state.padForce.toFixed(0)} N</span>
                <span>{state.padForce.toFixed(0)} N</span>
              </div>
            )}
            <p>{state.contact ? t('接触后，压力与夹紧力一起上升') : t('先消除间隙')}</p>
          </>
        )}
      </div>
    </div>
  );
}
