/** Physical specimen coordinates are micrometres; stage coordinates never change with magnification. */
export type Specimen = 'cork' | 'cheek' | 'leaf';
export function microscopeOptics(objective: number, fieldNumber = 18) {
  const m = Math.max(1, objective);
  return {
    totalMagnification: m * 10,
    fieldUm: (1000 * fieldNumber) / m,
    pixelsPerUm: (320 * m) / (1000 * fieldNumber),
  };
}
export function leafChloroplast(index: number, seconds: number, streaming = true) {
  // The rendered central vacuole is a 131 × 45 μm rounded rectangle.
  // A rounded peripheral path stays in its surrounding cytoplasm; an ellipse
  // would cut through the vacuole between its horizontal and vertical extrema.
  const radius = 13,
    horizontal = 112,
    vertical = 30,
    arc = (Math.PI * radius) / 2;
  const perimeter = 2 * horizontal + 2 * vertical + 4 * arc;
  const turns = index / 18 + (streaming ? (seconds * 0.12) / (2 * Math.PI) : 0);
  let distance = (((turns % 1) + 1) % 1) * perimeter;
  const segments = [
    { length: horizontal, point: (p: number) => ({ x: -56 + p, y: -28, angle: 0 }) },
    {
      length: arc,
      point: (p: number) => ({
        x: 56 + radius * Math.cos(p / radius - Math.PI / 2),
        y: -15 + radius * Math.sin(p / radius - Math.PI / 2),
        angle: ((p / radius) * 180) / Math.PI,
      }),
    },
    { length: vertical, point: (p: number) => ({ x: 69, y: -15 + p, angle: 90 }) },
    {
      length: arc,
      point: (p: number) => ({
        x: 56 + radius * Math.cos(p / radius),
        y: 15 + radius * Math.sin(p / radius),
        angle: 90 + ((p / radius) * 180) / Math.PI,
      }),
    },
    { length: horizontal, point: (p: number) => ({ x: 56 - p, y: 28, angle: 180 }) },
    {
      length: arc,
      point: (p: number) => ({
        x: -56 + radius * Math.cos(p / radius + Math.PI / 2),
        y: 15 + radius * Math.sin(p / radius + Math.PI / 2),
        angle: 180 + ((p / radius) * 180) / Math.PI,
      }),
    },
    { length: vertical, point: (p: number) => ({ x: -69, y: 15 - p, angle: 270 }) },
    {
      length: arc,
      point: (p: number) => ({
        x: -56 + radius * Math.cos(p / radius + Math.PI),
        y: -15 + radius * Math.sin(p / radius + Math.PI),
        angle: 270 + ((p / radius) * 180) / Math.PI,
      }),
    },
  ];
  for (const segment of segments) {
    if (distance <= segment.length) return { id: index, ...segment.point(distance) };
    distance -= segment.length;
  }
  return { id: index, x: -56, y: -28, angle: 0 };
}
export function specimenCells(specimen: Specimen) {
  const cells: { id: number; x: number; y: number; width: number; height: number }[] = [];
  const width = specimen === 'leaf' ? 160 : specimen === 'cork' ? 85 : 65;
  const height = specimen === 'leaf' ? 74 : specimen === 'cork' ? 54 : 55;
  for (let row = -18; row <= 18; row++)
    for (let col = -12; col <= 12; col++) {
      cells.push({
        id: (row + 18) * 25 + col + 12,
        x: col * width + (row % 2) * width * 0.22,
        y: row * height,
        width: width - 5,
        height: height - 5,
      });
    }
  return cells;
}
export function visibleCells(specimen: Specimen, fieldUm: number, offsetX = 0) {
  return specimenCells(specimen).filter(
    (c) =>
      Math.abs(c.x - offsetX) < fieldUm / 2 + c.width && Math.abs(c.y) < fieldUm / 2 + c.height,
  );
}
