export type RippleMode =
  'paper' | 'reflection' | 'refraction' | 'diffraction' | 'interference' | 'moving';
export type RippleInput = {
  mode: RippleMode;
  wavelength: number;
  gap: number;
  angle: number;
  depthRatio: number;
  phase: number;
  frequencyDifference: number;
  sourceSpeed: number;
};
export const RIPPLE_SPEED = Math.sqrt(9.8 * 0.008);
export const RIPPLE_DEFAULT: RippleInput = {
  mode: 'reflection',
  wavelength: 0.14,
  gap: 0.08,
  angle: 30,
  depthRatio: 0.5,
  phase: 0,
  frequencyDifference: 0,
  sourceSpeed: 0.1,
};
export function refractionParameters(input: RippleInput) {
  const theta = (input.angle * Math.PI) / 180,
    ratio = Math.sqrt(input.depthRatio),
    transmitted = Math.asin(ratio * Math.sin(theta)),
    c1 = RIPPLE_SPEED,
    c2 = c1 * ratio,
    R =
      (c1 * Math.cos(theta) - c2 * Math.cos(transmitted)) /
      (c1 * Math.cos(theta) + c2 * Math.cos(transmitted));
  return {
    theta,
    transmitted,
    c1,
    c2,
    reflection: R,
    transmission: 1 + R,
    wavelength2: input.wavelength * ratio,
  };
}
export function rippleComplex(
  input: RippleInput,
  x: number,
  y: number,
): [number, number, number, number] {
  const k = (2 * Math.PI) / input.wavelength,
    theta = (input.angle * Math.PI) / 180;
  if (input.mode === 'reflection') {
    if (x > 0.47) return [0, 0, 0, 0];
    const a = k * ((x - 0.47) * Math.cos(theta) + (y - 0.22) * Math.sin(theta)),
      b = k * (-(x - 0.47) * Math.cos(theta) + (y - 0.22) * Math.sin(theta));
    return [Math.cos(a) + Math.cos(b), Math.sin(a) + Math.sin(b), 0, 0];
  }
  if (input.mode === 'refraction') {
    const q = refractionParameters(input),
      ky = k * Math.sin(theta);
    if (x <= 0.3) {
      const a = k * Math.cos(theta) * (x - 0.3) + ky * (y - 0.22),
        b = -k * Math.cos(theta) * (x - 0.3) + ky * (y - 0.22);
      return [
        Math.cos(a) + q.reflection * Math.cos(b),
        Math.sin(a) + q.reflection * Math.sin(b),
        0,
        0,
      ];
    }
    const a =
      ((2 * Math.PI) / q.wavelength2) * Math.cos(q.transmitted) * (x - 0.3) + ky * (y - 0.22);
    return [q.transmission * Math.cos(a), q.transmission * Math.sin(a), 0, 0];
  }
  if (input.mode === 'diffraction') {
    if (x <= 0.23) {
      const a = k * (x - 0.23);
      return [Math.cos(a), Math.sin(a), 0, 0];
    }
    let re = 0,
      im = 0;
    const n = 31,
      dy = input.gap / n;
    for (let i = 0; i < n; i++) {
      const sy = 0.22 - input.gap / 2 + (i + 0.5) * dy,
        dx = x - 0.23,
        r = Math.max(0.002, Math.hypot(dx, y - sy)),
        a = k * r - Math.PI / 4,
        w = (dy * Math.sqrt(k / (2 * Math.PI * r)) * dx) / r;
      re += w * Math.cos(a);
      im += w * Math.sin(a);
    }
    return [re, im, 0, 0];
  }
  if (input.mode === 'interference') {
    const r1 = Math.max(0.015, Math.hypot(x - 0.16, y - 0.14)),
      r2 = Math.max(0.015, Math.hypot(x - 0.16, y - 0.3)),
      k2 =
        (2 * Math.PI * (RIPPLE_SPEED / input.wavelength + input.frequencyDifference)) /
        RIPPLE_SPEED,
      a = k * r1,
      b = k2 * r2 + input.phase,
      amp1 = Math.sqrt(0.12 / r1),
      amp2 = Math.sqrt(0.12 / r2);
    return [amp1 * Math.cos(a), amp1 * Math.sin(a), amp2 * Math.cos(b), amp2 * Math.sin(b)];
  }
  return [0, 0, 0, 0];
}
export function rippleAngularFrequency(input: RippleInput) {
  return (
    (2 * Math.PI * (input.mode === 'diffraction' ? Math.sqrt(9.8 * 0.001) : RIPPLE_SPEED)) /
    input.wavelength
  );
}
export function rippleValue(channels: ArrayLike<number>, time: number, input: RippleInput) {
  const w = rippleAngularFrequency(input),
    w2 = w + 2 * Math.PI * input.frequencyDifference;
  return (
    channels[0] * Math.cos(w * time) +
    channels[1] * Math.sin(w * time) +
    channels[2] * Math.cos(w2 * time) +
    channels[3] * Math.sin(w2 * time)
  );
}
export function rippleGrid(input: RippleInput, width = 96, height = 72) {
  const field = new Float32Array(width * height * 4);
  for (let iy = 0; iy < height; iy++)
    for (let ix = 0; ix < width; ix++) {
      field.set(
        rippleComplex(input, ((ix + 0.5) / width) * 0.6, ((iy + 0.5) / height) * 0.44),
        (iy * width + ix) * 4,
      );
    }
  return field;
}
export function paperRipple(x: number, y: number, time: number, periodic = false) {
  const r = Math.hypot(x - 0.13, y - 0.22),
    tau = time - r / RIPPLE_SPEED,
    frequency = 2,
    omega = 2 * Math.PI * frequency,
    a = 0.0005 * Math.sqrt(0.2 / Math.max(0.025, r));
  if (!periodic && (tau <= 0 || tau >= 1 / frequency)) return { height: 0, radial: 0 };
  const phase = omega * tau;
  if (periodic)
    return {
      height: a * Math.sin(phase),
      radial: ((-a * RIPPLE_SPEED) / (0.008 * omega)) * Math.cos(phase),
    };
  return {
    height: a * Math.sin(phase) ** 3,
    radial:
      ((a * RIPPLE_SPEED) / (0.008 * omega)) *
      (-Math.cos(phase) + Math.cos(phase) ** 3 / 3 + 2 / 3),
  };
}
export function movingRipples(time: number, speed = 0.1, frequency = 3) {
  return Array.from({ length: Math.max(0, Math.floor(time * frequency) + 1) }, (_, i) => {
    const emitted = i / frequency;
    return { emitted, x: 0.08 + speed * emitted, y: 0.22, radius: RIPPLE_SPEED * (time - emitted) };
  });
}
export function movingWavelengths(speed: number, frequency = 3) {
  return { front: (RIPPLE_SPEED - speed) / frequency, back: (RIPPLE_SPEED + speed) / frequency };
}
export function quietProbe(input: RippleInput) {
  let best = { x: 0.43, y: 0.22, amplitude: Infinity };
  for (let j = 0; j <= 150; j++) {
    const y = 0.22 + (0.21 * j) / 150,
      c = rippleComplex({ ...input, frequencyDifference: 0 }, 0.43, y),
      amplitude = Math.hypot(c[0] + c[2], c[1] + c[3]);
    if (amplitude < best.amplitude) best = { x: 0.43, y, amplitude };
  }
  return best;
}
