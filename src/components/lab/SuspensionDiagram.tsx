import { useId } from 'react';
import { useSuspensionDiagramSize } from './SuspensionLayout';
import { t } from '../../i18n';
import { SUSPENSION_GEOMETRY as G, suspensionPose } from '../../models/suspension';
import { suspensionDiagramFrame, suspensionGuideEnds } from '../three/suspension-geometry';
import type { SuspensionVisual } from '../three/SuspensionStudio';

export default function SuspensionDiagram({
  visual,
  cutaway = false,
}: {
  visual: SuspensionVisual;
  cutaway?: boolean;
}) {
  const { ref, width, height } = useSuspensionDiagramSize(),
    fit = Math.min(width / 300, (height - 30) / 320),
    left = (width - 300 * fit) / 2,
    id = useId().replace(/:/g, ''),
    p = suspensionPose(visual.state, visual.parameters, visual.road),
    frame = suspensionDiagramFrame(p),
    { scale, y } = frame;
  const wheel = y(p.wheelY),
    road = y(p.roadY),
    lower = y(p.lowerSpringY),
    upper = y(p.upperMountY),
    damperBottom = y(p.lowerDamperY),
    cylinderTop = y(p.lowerDamperY + G.damperTubeLength),
    piston = y(p.upperMountY - G.damperRodLength);
  const coil = Array.from(
    { length: 121 },
    (_, i) =>
      `${i ? 'L' : 'M'}${98 + Math.sin((i / 120) * Math.PI * 12) * 15} ${lower + ((upper - lower) * i) / 120}`,
  ).join(' ');
  const tire =
    Array.from({ length: 121 }, (_, i) => {
      const angle = (i * Math.PI * 2) / 120;
      return `${i ? 'L' : 'M'}${150 + G.tireRadius * scale * Math.cos(angle)} ${Math.min(wheel + G.tireRadius * scale * Math.sin(angle), road)}`;
    }).join(' ') + 'Z';
  return (
    <div ref={ref} className="susp-diagram-wrap">
      <svg
        className="susp-diagram"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t('二维四分之一车：车身与轮组独立运动，轮胎接触路面，弹簧和减振器端点跟随模型')}
      >
        <g transform={`translate(${left} 0) scale(${fit})`}>
          <defs>
            <linearGradient id={id} x1="0" x2="1">
              <stop stopColor="#b8c4c2" />
              <stop offset=".5" stopColor="#e6e6dc" />
              <stop offset="1" stopColor="#8b9b9d" />
            </linearGradient>
          </defs>
          <path
            d={`M55 ${y(suspensionGuideEnds(p).top)}V${y(suspensionGuideEnds(p).bottom)}M245 ${y(suspensionGuideEnds(p).top)}V${y(suspensionGuideEnds(p).bottom)}`}
            stroke="#b9c4c4"
            strokeWidth="4"
          />
          <rect
            x="35"
            y={y(p.upperMountY + 0.2)}
            width="230"
            height={scale * 0.2}
            rx="9"
            fill={`url(#${id})`}
            stroke="#91a2a4"
          />

          <path
            d={`M55 ${wheel}H245M98 ${wheel}V${lower}M202 ${wheel}V${damperBottom}`}
            stroke="#5a747b"
            strokeWidth="8"
            strokeLinejoin="round"
          />
          <path d={coil} fill="none" stroke="#b87c58" strokeWidth="4" strokeLinecap="round" />
          <path d={`M78 ${lower}H118M78 ${upper}H118`} stroke="#4f6269" strokeWidth="5" />
          <rect
            x="191"
            y={cylinderTop}
            width="22"
            height={damperBottom - cylinderTop}
            rx="3"
            fill="#7ea2a4"
            stroke="#4d747b"
            strokeWidth="2"
          />
          <rect
            x="196"
            y={cylinderTop + 3}
            width="12"
            height={damperBottom - cylinderTop - 6}
            fill="#d3dfd0"
          />
          <path d={`M202 ${upper}V${piston}`} stroke="#b2bab7" strokeWidth="5" />
          <path d={`M196 ${piston}H208`} stroke="#ac7352" strokeWidth="6" />
          <path d={tire} fill="#35454b" opacity={cutaway ? 0.18 : 1} />
          <circle
            cx="150"
            cy={wheel}
            r={G.rimRadius * scale}
            fill={`url(#${id})`}
            stroke="#eef0e8"
            strokeWidth="2"
          />
          <circle cx="150" cy={wheel} r="13" fill="#5c747d" />
          <path d={`M30 ${road + 5}H270`} stroke="#697f83" strokeWidth="10" strokeLinecap="round" />
          <path
            d={`M150 ${road + 10}V${y(-0.25)}M56 ${y(-0.25)}H244`}
            stroke="#b0b9b3"
            strokeWidth="10"
          />
        </g>
        <text x={width / 2} y={(upper - 9) * fit} textAnchor="middle" style={{ fontSize: 16 }}>
          mₛ · {visual.parameters.sprungMass} kg
        </text>
        <text x={width / 2} y={height - 9} textAnchor="middle" style={{ fontSize: 16 }}>
          {t('导向件位于台板后方')}
        </text>
      </svg>
    </div>
  );
}
