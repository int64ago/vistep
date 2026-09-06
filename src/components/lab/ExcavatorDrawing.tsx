import { t } from '../../i18n';
import { DRAWING_BOUNDS, excavatorDrawing, type Primitive } from '../../models/excavator-drawing';
import type { ExcavatorVisual } from '../three/ExcavatorStudio';

/** Side elevation used when WebGL fails at runtime and as the optional flat view. */
export default function ExcavatorDrawing({ visual }: { visual: ExcavatorVisual }) {
  const { primitives, pose } = excavatorDrawing(visual.pose, {
    section: true,
    payload: visual.payload,
  });
  const b = DRAWING_BOUNDS;
  const lever = visual.lever ? leverLines(pose) : null;
  return (
    <svg
      className="excavator-drawing"
      viewBox={`${b.x} ${-(b.y + b.height)} ${b.width} ${b.height}`}
      role="img"
      aria-label={t('液压挖掘机侧视图，动臂缸剖开显示活塞与两个油腔')}
    >
      <g transform="scale(1,-1)" strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${b.x} 0H${b.x + b.width}`} stroke="#d5d8cf" strokeWidth="0.03" />
        {visual.rock && (
          <path d="M9.3 0L9.55 0.95L10.2 1.62L10.9 1.35L11.15 0.6L10.85 0Z" fill="#8f8b83" />
        )}
        {primitives.map((s, i) => (
          <Shape key={i} s={s} />
        ))}
        {lever && (
          <>
            <path d={lever.line} stroke="#5a6a70" strokeWidth="0.025" strokeDasharray="0.12 0.08" />
            <path d={lever.arm} stroke="#d8742f" strokeWidth="0.06" />
          </>
        )}
      </g>
    </svg>
  );
}
function Shape({ s }: { s: Primitive }) {
  if (s.kind === 'circle')
    return (
      <circle cx={s.c.x} cy={s.c.y} r={s.r} fill={s.fill} stroke={s.stroke} strokeWidth={s.width} />
    );
  return (
    <path
      d={s.d}
      fill={s.fill ?? 'none'}
      stroke={s.stroke}
      strokeWidth={s.width}
      opacity={s.opacity}
    />
  );
}
function leverLines(pose: ReturnType<typeof excavatorDrawing>['pose']) {
  const { a, b } = pose.cylinders.boom;
  const len = Math.hypot(b.x - a.x, b.y - a.y),
    ux = (b.x - a.x) / len,
    uy = (b.y - a.y) / len;
  const along = (pose.foot.x - a.x) * ux + (pose.foot.y - a.y) * uy;
  const px = a.x + ux * along,
    py = a.y + uy * along;
  return {
    line: `M${a.x - ux * 1.2} ${a.y - uy * 1.2}L${b.x + ux * 2.2} ${b.y + uy * 2.2}`,
    arm: `M${pose.foot.x} ${pose.foot.y}L${px} ${py}`,
  };
}
