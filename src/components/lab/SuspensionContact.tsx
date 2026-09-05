import { t } from '../../i18n';
import { suspensionPose, SUSPENSION_GEOMETRY as G } from '../../models/suspension';
import type { SuspensionVisual } from '../three/SuspensionStudio';

/** Phone contact shot: keep the contact at full size instead of shrinking the whole test rig. */
export default function SuspensionContact({ visual }: { visual: SuspensionVisual }) {
  const p = suspensionPose(visual.state, visual.parameters, visual.road),
    scale = 148,
    center = 122 - (p.wheelY - p.roadY) * scale;
  const tire =
    Array.from({ length: 97 }, (_, i) => {
      const a = (i * Math.PI * 2) / 96;
      return `${i ? 'L' : 'M'}${150 + G.tireRadius * scale * Math.cos(a)} ${Math.min(122, center + G.tireRadius * scale * Math.sin(a))}`;
    }).join(' ') + 'Z';
  return (
    <svg
      className="susp-phone-contact"
      viewBox="0 0 300 145"
      role="img"
      aria-label={t('轮胎接触特写：法向载荷趋于零时，压缩量也趋于零')}
    >
      <path d="M40 126H260" stroke="#6c8588" strokeWidth="8" strokeLinecap="round" />
      <path d={tire} fill="#344a51" />
      <circle
        cx="150"
        cy={center}
        r={G.rimRadius * scale}
        fill="#bec9c5"
        stroke="#e9eee5"
        strokeWidth="2"
      />
      <circle cx="150" cy={center} r="10" fill="#5c7c84" />
      <path d={`M150 ${center}H225`} stroke="#6c868a" strokeWidth="5" />
    </svg>
  );
}
