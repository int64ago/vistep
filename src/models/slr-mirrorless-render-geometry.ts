/**
 * Representative exposed electronics, not the PCB layout of a named camera.
 * +z is the removed side of the cutaway. The sensor, processor and displays
 * have physical terminals here; the cyan overlays run on the exposed flex.
 * Optical and shutter geometry remain in the independent camera model.
 */
export type CameraSignalPoint = { x: number; y: number; z: number };
export const cameraElectronics = {
  cutZ: 0.22,
  traceZ: 0.72,
  board: { x: 1.48, y: 0.56, z: 0.66, width: 0.43, height: 0.7, depth: 0.04 },
  processor: { x: 1.465, y: 0.535, z: 0.735, width: 0.23, height: 0.21, depth: 0.07 },
  sensorTerminal: { x: 1.265, y: 0.84, z: 0.57 },
  inputTerminal: { x: 1.465, y: 0.675, z: 0.72 },
  outputTerminal: { x: 1.61, y: 0.535, z: 0.72 },
  rearTerminal: { x: 1.642, y: 1, z: 0.49 },
  finderTerminal: { x: 1.255, y: 2.35, z: 0.145 },
} as const;

export function cameraSignalRoutes(dslr: boolean): readonly CameraSignalPoint[][] {
  const e = cameraElectronics;
  const input = [
    e.sensorTerminal,
    { ...e.sensorTerminal, z: e.traceZ },
    { x: e.inputTerminal.x, y: e.sensorTerminal.y, z: e.traceZ },
    e.inputTerminal,
  ];
  const rear = [
    e.outputTerminal,
    { x: 1.71, y: e.outputTerminal.y, z: e.traceZ },
    { x: 1.71, y: e.rearTerminal.y, z: e.traceZ },
    { ...e.rearTerminal, z: e.traceZ },
    e.rearTerminal,
  ];
  const finder = [
    e.outputTerminal,
    { x: 1.71, y: e.outputTerminal.y, z: e.traceZ },
    { x: 1.71, y: e.rearTerminal.y, z: e.traceZ },
    { x: 1.71, y: e.finderTerminal.y, z: e.traceZ },
    { ...e.finderTerminal, z: e.traceZ },
    e.finderTerminal,
  ];
  // The chip is a real node: input and output terminate at its package pins.
  // No decorative line passes through the opaque processor package.
  return dslr ? [input, rear] : [input, rear, finder];
}

export function cameraSignalPoint(route: readonly CameraSignalPoint[], progress: number) {
  const lengths = route
    .slice(1)
    .map((p, i) => Math.hypot(p.x - route[i].x, p.y - route[i].y, p.z - route[i].z));
  let remaining = Math.max(0, Math.min(1, progress)) * lengths.reduce((sum, n) => sum + n, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const q = lengths[i] ? remaining / lengths[i] : 0,
        a = route[i],
        b = route[i + 1];
      return { x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q, z: a.z + (b.z - a.z) * q };
    }
    remaining -= lengths[i];
  }
  return route[0];
}
