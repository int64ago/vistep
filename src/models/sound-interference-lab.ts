export function soundInterferencePoint(x: number, y: number, frequency = 680) {
  const speed = 340,
    k = (2 * Math.PI * frequency) / speed,
    r1 = Math.max(0.15, Math.hypot(x + 2, y)),
    r2 = Math.max(0.15, Math.hypot(x - 2, y)),
    a = 1 / r1,
    b = 1 / r2,
    re = a * Math.cos(k * r1) + b * Math.cos(k * r2),
    im = a * Math.sin(k * r1) + b * Math.sin(k * r2);
  return {
    r1,
    r2,
    pathDifference: r2 - r1,
    phaseDifference: k * (r2 - r1),
    re,
    im,
    amplitude: Math.hypot(re, im),
    intensity: re * re + im * im,
  };
}
export function soundFlagTargets(frequency = 680) {
  return Array.from({ length: 12 }, (_, i) => {
    const group = i < 6 ? 'loud' : 'quiet',
      j = i % 6,
      x0 = ((j % 3) - 1) * 0.75 + (group === 'quiet' ? 0.1 : 0),
      y = group === 'loud' ? (j < 3 ? -0.8 : 0.8) : j < 3 ? -0.3 : 0.3;
    let best = x0,
      bestValue = group === 'loud' ? -Infinity : Infinity;
    for (let n = 0; n <= 320; n++) {
      const x = x0 - 0.16 + n * 0.001,
        value = soundInterferencePoint(x, y, frequency).intensity;
      if (group === 'loud' ? value > bestValue : value < bestValue) {
        best = x;
        bestValue = value;
      }
    }
    return { id: i, group, x0, y, target: best, intensity: bestValue };
  });
}
export function soundIntensityField(frequency: number, width = 100, height = 72) {
  return Float32Array.from({ length: width * height }, (_, i) => {
    const x = (((i % width) + 0.5) / width - 0.5) * 3.4722,
      y = ((Math.floor(i / width) + 0.5) / height - 0.5) * 2.5;
    return soundInterferencePoint(x, y, frequency).intensity;
  });
}
