import { useId } from 'react';
import { t } from '../../i18n';
import { SUSPENSION_GEOMETRY as G, suspensionPose } from '../../models/suspension';
import type { SuspensionVisual } from '../three/SuspensionStudio';

export default function SuspensionDiagram({
  visual,
  cutaway = false,
}: {
  visual: SuspensionVisual;
  cutaway?: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    p = suspensionPose(visual.state, visual.parameters, visual.road),
    scale = 202;
  const y = (value: number) => 300 - scale * value;
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
    <svg
      className="susp-diagram"
      viewBox="0 0 300 335"
      role="img"
      aria-label={t('二维四分之一车：车身与轮组独立运动，轮胎接触路面，弹簧和减振器端点跟随模型')}
    >
      <defs>
        <linearGradient id={id} x1="0" x2="1">
          <stop stopColor="#b8c4c2" />
          <stop offset=".5" stopColor="#e6e6dc" />
          <stop offset="1" stopColor="#8b9b9d" />
        </linearGradient>
      </defs>
      <path
        d={`M55 ${upper - 8}V${y(p.upperMountY + 0.02 - G.guideLength)}M245 ${upper - 8}V${y(p.upperMountY + 0.02 - G.guideLength)}`}
        stroke="#b9c4c4"
        strokeWidth="4"
      />
      <rect
        x="35"
        y={upper - 40}
        width="230"
        height="40"
        rx="9"
        fill={`url(#${id})`}
        stroke="#91a2a4"
      />
      <text x="150" y={upper - 14} textAnchor="middle">
        mₛ · {visual.parameters.sprungMass} kg
      </text>
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
      <path d={`M150 ${road + 10}V326M56 327H244`} stroke="#b0b9b3" strokeWidth="10" />
    </svg>
  );
}
