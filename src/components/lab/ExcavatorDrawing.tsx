import {
  EXCAVATOR_BUCKET,
  EXCAVATOR_CYLINDERS,
  bucketPath,
  excavatorPose,
} from '../../models/excavator';
import { t } from '../../i18n';
export default function ExcavatorDrawing({
  boom,
  stick,
  curl,
  closeup = false,
}: {
  boom: number;
  stick: number;
  curl: number;
  closeup?: boolean;
}) {
  const p = excavatorPose(boom, stick, curl);
  return (
    <svg
      viewBox={closeup ? `${p.wrist.x - 1.35} ${-p.wrist.y - 1.4} 2.8 2.8` : '-2 -5 8 5.8'}
      role="img"
      aria-label={t('挖掘机的动臂、斗杆和铲斗连杆')}
    >
      <g transform="scale(1,-1)" strokeLinecap="round" strokeLinejoin="round">
        <rect x="-1.8" y=".1" width="2.5" height=".6" rx=".25" fill="#46575b" />
        <rect x="-1.6" y=".9" width="1.8" height=".6" rx=".15" fill="#d8a445" />
        <rect x=".1" y="1.06" width=".66" height=".3" rx=".07" fill="#d8a445" />
        <rect x="-1.2" y="1.4" width=".8" height="1.1" rx=".12" fill="#8daeb3" />
        <path
          d={`M${p.origin.x} ${p.origin.y}L${p.elbow.x} ${p.elbow.y}L${p.wrist.x} ${p.wrist.y}`}
          stroke="#d8a445"
          strokeWidth=".25"
          fill="none"
        />
        {p.cylinderMounts.map(({ a, b }, i) => (
          <path key={i} d={`M${a.x} ${a.y}L${b.x} ${b.y}`} stroke="#d8a445" strokeWidth=".18" />
        ))}
        <path
          d={`M${p.rockerPin.x} ${p.rockerPin.y}L${p.joint.x} ${p.joint.y}L${p.bucketPin.x} ${p.bucketPin.y}`}
          stroke="#60797f"
          strokeWidth=".08"
          fill="none"
        />
        {p.cylinders.map(({ a, b }, i) => (
          <g key={i}>
            <path d={`M${a.x} ${a.y}L${b.x} ${b.y}`} stroke="#9aabb0" strokeWidth=".07" />
            <path
              d={`M${a.x} ${a.y}L${a.x + (b.x - a.x) * (EXCAVATOR_CYLINDERS[i].housing / Math.hypot(b.x - a.x, b.y - a.y))} ${a.y + (b.y - a.y) * (EXCAVATOR_CYLINDERS[i].housing / Math.hypot(b.x - a.x, b.y - a.y))}`}
              stroke="#4e6065"
              strokeWidth=".14"
            />
          </g>
        ))}
        <g
          transform={`translate(${p.wrist.x} ${p.wrist.y}) rotate(${(p.bucketAngle * 180) / Math.PI})`}
        >
          <path d={bucketPath(EXCAVATOR_BUCKET.ear)} fill="#bf8b39" />
          <path d={bucketPath(EXCAVATOR_BUCKET.side)} fill="#bf8b39" />
          <path d={bucketPath(EXCAVATOR_BUCKET.tooth)} fill="#667d83" />
        </g>
        {[p.origin, p.elbow, p.wrist, p.rockerPin, p.joint, p.bucketPin].map((q, i) => (
          <circle
            key={i}
            cx={q.x}
            cy={q.y}
            r=".075"
            fill="#e7ebe3"
            stroke="#52696e"
            strokeWidth=".03"
          />
        ))}
      </g>
    </svg>
  );
}
