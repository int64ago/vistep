export function effectivePhase(degrees: number, frequency: number, delayMs: number) {
  return (degrees * Math.PI) / 180 - (2 * Math.PI * frequency * delayMs) / 1000;
}
export function residualAmplitude(amplitude: number, phase: number) {
  return Math.sqrt(Math.max(0, 1 + amplitude * amplitude + 2 * amplitude * Math.cos(phase)));
}
