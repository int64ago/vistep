/** One continuous, inextensible, massless rope over frictionless massless sheaves.
 * The moving assembly contains 0, 1 or 2 sheaves. Quasi-static SI calculation. */
export type PulleySegments = 1 | 2 | 4;
export function pulleyState(
  segments: PulleySegments,
  load: number,
  lift: number,
  movingWeight = 0,
) {
  if (
    ![1, 2, 4].includes(segments) ||
    !Number.isFinite(load) ||
    load < 0 ||
    !Number.isFinite(lift) ||
    lift < 0 ||
    lift > 0.4 ||
    !Number.isFinite(movingWeight) ||
    movingWeight < 0 ||
    (segments === 1 && movingWeight !== 0)
  )
    throw new RangeError('Use 1, 2 or 4 supporting strands, nonnegative load and 0–0.4 m lift');
  const tension = (load + movingWeight) / segments,
    pull = segments * lift;
  return {
    segments,
    load,
    movingWeight,
    lift,
    tension,
    pull,
    support: segments * tension,
    inputWork: tension * pull,
    outputWork: load * lift,
    blockWork: movingWeight * lift,
  };
}
/** Drawing coordinates preserve tangent contacts and constant rope length. The
 * free end moves n times the load. No end is snapped to close the rope. */
export function pulleyGeometry(segments: PulleySegments, lift: number) {
  pulleyState(segments, 0, lift);
  const scale = 90,
    radius = 25,
    top = 74,
    lower = 218 - lift * scale;
  const count = segments / 2,
    start = segments === 4 ? 35 : 105;
  const moving: { x: number; y: number }[] = [],
    fixed: { x: number; y: number }[] = [];
  let path = '',
    ropeLength = 0;
  const freeY = 170 + segments * lift * scale;
  if (segments === 1) {
    fixed.push({ x: 165, y: top });
    path = `M140 ${lower}V${top}A${radius} ${radius} 0 0 1 190 ${top}V${freeY}`;
    ropeLength = lower - top + Math.PI * radius + freeY - top;
  } else {
    path = `M${start} 43V${lower}`;
    ropeLength = lower - 43;
    for (let i = 0; i < count; i++) {
      const x = start + radius + i * radius * 4;
      moving.push({ x, y: lower });
      fixed.push({ x: x + 2 * radius, y: top });
      path += `A${radius} ${radius} 0 0 0 ${x + radius} ${lower}V${top}A${radius} ${radius} 0 0 1 ${x + 3 * radius} ${top}`;
      ropeLength += 2 * Math.PI * radius + lower - top;
      if (i < count - 1) {
        path += `V${lower}`;
        ropeLength += lower - top;
      }
    }
    path += `V${freeY}`;
    ropeLength += freeY - top;
  }
  return {
    radius,
    top,
    lower,
    freeY,
    freeX: segments === 1 ? 190 : start + segments * radius * 2,
    moving,
    fixed,
    path,
    ropeLength,
    loadX: segments === 1 ? 140 : start + (segments - 1) * radius,
    supportX:
      segments === 1 ? [140] : Array.from({ length: segments }, (_, i) => start + i * radius * 2),
  };
}
export function pulleyShot(chapter: number, progress: number) {
  const u = Math.max(0, Math.min(1, progress)),
    e = u * u * (3 - 2 * u);
  const segments: PulleySegments = chapter === 0 ? 1 : chapter < 3 ? 2 : 4;
  const lift =
    chapter === 5 ? 0.35 : chapter === 0 || chapter === 2 || chapter === 4 ? 0.35 * e : 0;
  return {
    ...pulleyState(segments, 120, lift, chapter === 5 ? 40 * e : 0),
    geometry: pulleyGeometry(segments, lift),
  };
}
