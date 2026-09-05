import type { RainbowPoint, RainbowRay } from '../../models/rainbow';

export function rainbowDropLayout(compact: boolean, fan: boolean) {
  return compact
    ? { width: 340, height: fan ? 254 : 358, radius: fan ? 68 : 91, cx: 212, cy: fan ? 108 : 142 }
    : { width: 820, height: 440, radius: 122, cx: 520, cy: 170 };
}
export type RainbowContactLabel = {
  contacts: number[];
  anchors: RainbowPoint[];
  center: RainbowPoint;
  width: number;
  height: number;
};

/** Contact anchors stay on the exact ray. Only labels may move into the outer gutter. */
export function rainbowContactLabels(
  ray: RainbowRay,
  layout: ReturnType<typeof rainbowDropLayout>,
  reveal: number,
): RainbowContactLabel[] {
  const { width, height, cx, cy, radius } = layout;
  const project = (p: RainbowPoint) => ({ x: cx + p.x * radius, y: cy - p.y * radius });
  const contacts = [ray.entry, ray.reflection, ray.exit].map(project);
  const visible = contacts.map((_, i) => i).filter((i) => reveal >= i + 1);
  const merged =
    visible.includes(2) &&
    Math.hypot(contacts[0].x - contacts[2].x, contacts[0].y - contacts[2].y) < 38;
  const groups = visible
    .filter((i) => !merged || i !== 2)
    .map((i) => (merged && i === 0 ? [0, 2] : [i]));
  const labels: RainbowContactLabel[] = [];
  for (const group of groups) {
    const anchors = group.map((i) => contacts[i]),
      anchor = anchors[0],
      angle = Math.atan2(anchor.y - cy, anchor.x - cx),
      boxWidth = group.length > 1 ? 70 : 32,
      boxHeight = 34;
    const candidates = Array.from({ length: 73 }, (_, i) => {
      const step = i === 0 ? 0 : (Math.ceil(i / 2) * (i % 2 ? 1 : -1) * Math.PI) / 36;
      const a = angle + step;
      return {
        x: Math.max(
          8 + boxWidth / 2,
          Math.min(width - 8 - boxWidth / 2, cx + (radius + 48) * Math.cos(a)),
        ),
        y: Math.max(
          8 + boxHeight / 2,
          Math.min(height - 8 - boxHeight / 2, cy + (radius + 48) * Math.sin(a)),
        ),
      };
    });
    const center = candidates.find((p) => {
      const dx = Math.max(0, Math.abs(p.x - cx) - boxWidth / 2),
        dy = Math.max(0, Math.abs(p.y - cy) - boxHeight / 2);
      return (
        Math.hypot(dx, dy) >= radius + 5 &&
        anchors.every((a) => (p.x - a.x) * (a.x - cx) + (p.y - a.y) * (a.y - cy) >= 0) &&
        labels.every(
          (other) =>
            Math.abs(p.x - other.center.x) >= (boxWidth + other.width) / 2 + 7 ||
            Math.abs(p.y - other.center.y) >= (boxHeight + other.height) / 2 + 7,
        )
      );
    });
    if (!center) throw new RangeError('No clear contact-label gutter');
    labels.push({
      contacts: group.map((i) => i + 1),
      anchors,
      center,
      width: boxWidth,
      height: boxHeight,
    });
  }
  return labels;
}
