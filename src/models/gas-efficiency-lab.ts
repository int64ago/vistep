export const coolingMinutes = [
  0, 10, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300,
];
export const coolingCelsius = [
  101.9, 94.8, 90, 81, 73.5, 66.5, 61.5, 57.5, 53.5, 50.5, 47.5, 45.5, 43.7, 42, 40.8, 39.8, 38.8,
];
export const lowTemperatureTrials = [
  { before: 995.5985, after: 995.6438, volume: 0.0453 },
  { before: 995.6438, after: 995.6716, volume: 0.0278 },
];
export const boilingTrials = [
  { before: 995.9725, after: 996.0608, volume: 0.0883 },
  { before: 996.0608, after: 996.1453, volume: 0.0845 },
  { before: 996.1453, after: 996.2237, volume: 0.0784 },
];
export function coolingReading(minutes: number) {
  const m = Math.max(0, Math.min(300, minutes)),
    i = Math.min(
      coolingMinutes.length - 2,
      Math.max(0, coolingMinutes.findIndex((t) => t > m) - 1),
    );
  if (m === 300) return { temperature: 38.8, index: 16 };
  const f = (m - coolingMinutes[i]) / (coolingMinutes[i + 1] - coolingMinutes[i]);
  return {
    temperature: coolingCelsius[i] + f * (coolingCelsius[i + 1] - coolingCelsius[i]),
    index: i,
  };
}
export function usefulWaterHeat(mass: number, initial: number, final: number) {
  return mass * 4180 * (final - initial);
}
export function measuredEfficiency(
  mass: number,
  initial: number,
  final: number,
  gasVolume: number | null,
  calorificMJ: number,
) {
  if (
    gasVolume === null ||
    !Number.isFinite(gasVolume) ||
    gasVolume <= 0 ||
    mass <= 0 ||
    final <= initial ||
    calorificMJ <= 0
  )
    return null;
  return usefulWaterHeat(mass, initial, final) / (gasVolume * calorificMJ * 1e6);
}
export function fuelSaving(reference: number, comparison: number) {
  return 1 - comparison / reference;
}
export function mixedWaterMass(
  hotMass: number,
  hotTemperature: number,
  coldTemperature: number,
  target: number,
) {
  return hotTemperature <= target || target <= coldTemperature
    ? hotMass
    : (hotMass * (hotTemperature - coldTemperature)) / (target - coldTemperature);
}
export const heaterRoute: [[number, number], ...[number, number][]] = [
  [315, 285],
  [315, 75],
  [100, 75],
  [100, 100],
  [245, 100],
  [245, 125],
  [100, 125],
  [100, 150],
  [245, 150],
  [245, 250],
];
export function heaterFlowPoint(fraction: number) {
  const segments = heaterRoute
      .slice(1)
      .map((b, i) => Math.hypot(b[0] - heaterRoute[i][0], b[1] - heaterRoute[i][1])),
    total = segments.reduce((a, b) => a + b, 0);
  let distance = (((fraction % 1) + 1) % 1) * total;
  for (let i = 0; i < segments.length; i++) {
    if (distance <= segments[i]) {
      const a = heaterRoute[i],
        b = heaterRoute[i + 1],
        q = distance / segments[i];
      return {
        x: a[0] + q * (b[0] - a[0]),
        y: a[1] + q * (b[1] - a[1]),
        warmth: Math.max(
          0,
          Math.min(1, (total * (((fraction % 1) + 1) % 1) - 425) / (total - 525)),
        ),
      };
    }
    distance -= segments[i];
  }
  return { x: 245, y: 250, warmth: 1 };
}
