/** Conditional evidence model. Progress is not reaction time or predicted yield. */
export type Route = 'bromoethane' | 'bromobutane' | 'ethanol';
export type Washer = 'water' | 'base' | 'none';
export type Gas = 'alkene' | 'ethanol' | 'sulfurDioxide';
export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export function hydrolysis(progress: number, aqueous = true) {
  const x = aqueous ? clamp(progress) : 0;
  return { halide: 1 - x, alcohol: x, bromide: x, hydroxide: 1.4 - x };
}
export function silverTest(progress: number, acidified: boolean, waterLayer = true) {
  const r = hydrolysis(progress);
  const bromide = waterLayer ? r.bromide : 0;
  const silver = 1.5;
  const agBr = Math.min(bromide, silver);
  const ag2O = acidified || !waterLayer ? 0 : Math.min(r.hydroxide / 2, (silver - agBr) / 2);
  return { agBr, ag2O, silverRemaining: silver - agBr - 2 * ag2O };
}
export function gasEvidence(
  route: Route,
  washer: Washer,
  alkene = true,
  impurity = true,
  detector: 'mn' | 'br' = 'mn',
) {
  const input = {
    alkene: alkene ? 1 : 0,
    ethanol: route === 'bromobutane' && impurity ? 0.4 : 0,
    sulfurDioxide: route === 'ethanol' && impurity ? 0.3 : 0,
  };
  // Ideal effective traps. Water is assigned ethanol uptake; sufficient alkali removes acidic SO2.
  const output = {
    alkene: input.alkene,
    ethanol: washer === 'water' ? 0 : input.ethanol,
    sulfurDioxide: washer === 'base' ? 0 : input.sulfurDioxide,
  };
  const falsePositive =
    detector === 'mn' ? output.ethanol > 0 || output.sulfurDioxide > 0 : output.sulfurDioxide > 0;
  return {
    input,
    output,
    positive: output.alkene > 0 || falsePositive,
    falsePositive,
    validAlkeneEvidence: output.alkene > 0 && !falsePositive,
  };
}
export type Point = { x: number; y: number };
export function apparatus(mobile: boolean) {
  const source = mobile ? { x: 68, y: 85 } : { x: 70, y: 140 };
  const wash = mobile ? { x: 70, y: 250 } : { x: 270, y: 160 };
  const test = mobile ? { x: 230, y: 250 } : { x: 440, y: 160 };
  const feed: Point[] = mobile
    ? [
        { x: source.x + 12, y: source.y - 12 },
        { x: source.x + 12, y: 12 },
        { x: 150, y: 12 },
        { x: 150, y: 150 },
        { x: wash.x - 12, y: 150 },
        { x: wash.x - 12, y: wash.y + 12 },
      ]
    : [
        { x: source.x + 12, y: source.y - 12 },
        { x: source.x + 12, y: 50 },
        { x: wash.x - 12, y: 50 },
        { x: wash.x - 12, y: wash.y + 12 },
      ];
  const outlet: Point[] = [
    { x: wash.x + 12, y: wash.y - 38 },
    { x: wash.x + 12, y: wash.y - 82 },
    { x: test.x - 10, y: wash.y - 82 },
    { x: test.x - 10, y: test.y + 12 },
  ];
  const bubbles: Point[] = [
    { x: wash.x - 12, y: wash.y + 12 },
    { x: wash.x - 8, y: wash.y - 10 },
    { x: wash.x + 12, y: wash.y - 38 },
  ];
  return {
    source,
    wash,
    test,
    feed,
    outlet,
    bubbles,
    path: [...feed, ...bubbles.slice(1), ...outlet.slice(1)],
  };
}
export const polyline = (points: Point[]) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
export function along(points: Point[], t: number) {
  const lengths = points.slice(1).map((b, i) => Math.hypot(b.x - points[i].x, b.y - points[i].y));
  let d = clamp(t) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (d <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] ? d / lengths[i] : 0;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * f,
        y: points[i].y + (points[i + 1].y - points[i].y) * f,
      };
    }
    d -= lengths[i];
  }
  return points[0];
}
export function gasMarker(mobile: boolean, progress: number, gas: Gas, washer: Washer) {
  const a = apparatus(mobile),
    captured =
      (gas === 'ethanol' && washer === 'water') || (gas === 'sulfurDioxide' && washer === 'base');
  // Split travel at the inlet end, so every captured marker stops at the actual wash liquid.
  const p = clamp(progress);
  const point =
    p < 0.55
      ? along(a.feed, p / 0.55)
      : captured
        ? a.feed.at(-1)!
        : along([a.feed.at(-1)!, ...a.bubbles.slice(1), ...a.outlet.slice(1)], (p - 0.55) / 0.45);
  return { ...point, captured: captured && p >= 0.55 };
}
export function netChange(kind: 'substitution' | 'elimination', p: number) {
  const q = clamp(p),
    C1 = { x: 110, y: 100 },
    C2 = { x: 185, y: 100 };
  return {
    C1,
    C2,
    Br: { x: 260 + 25 * q, y: 100 - 70 * q },
    OH: kind === 'substitution' ? { x: 280 - 20 * q, y: 30 + 70 * q } : { x: 280, y: 175 },
    H: { x: 110 + 130 * q, y: 45 + 130 * q },
    cBr: 1 - q,
    cO: kind === 'substitution' ? q : 0,
    pi: kind === 'elimination' ? q : 0,
    cH: kind === 'elimination' ? 1 - q : 1,
  };
}
