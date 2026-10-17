/** Two immiscible Newtonian layers between infinite no-slip plates, zero pressure gradient. */
export interface LayerOptions {
  height?: number;
  fraction?: number;
  lowerViscosity?: number;
  upperViscosity?: number;
  lowerSpeed?: number;
  upperSpeed?: number;
}
export function viscosityLayers(o: LayerOptions = {}) {
  const height = o.height ?? 0.01,
    fraction = o.fraction ?? 0.5,
    lowerViscosity = o.lowerViscosity ?? 0.1,
    upperViscosity = o.upperViscosity ?? 0.4,
    lowerSpeed = o.lowerSpeed ?? 0,
    upperSpeed = o.upperSpeed ?? 0.01;
  if (
    ![height, lowerViscosity, upperViscosity].every((v) => Number.isFinite(v) && v > 0) ||
    !Number.isFinite(fraction) ||
    fraction <= 0 ||
    fraction >= 1 ||
    ![lowerSpeed, upperSpeed].every(Number.isFinite)
  )
    throw new RangeError('Physical gap, viscosities, interface fraction and plate speeds required');
  const h1 = height * fraction,
    h2 = height - h1,
    resistance = h1 / lowerViscosity + h2 / upperViscosity,
    shear = (upperSpeed - lowerSpeed) / resistance,
    interfaceSpeed = lowerSpeed + (shear * h1) / lowerViscosity,
    power = shear * (upperSpeed - lowerSpeed);
  return {
    height,
    fraction,
    lowerViscosity,
    upperViscosity,
    lowerSpeed,
    upperSpeed,
    h1,
    h2,
    resistance,
    shear,
    interfaceSpeed,
    power,
  };
}
export function layerVelocity(y: number, o: LayerOptions = {}) {
  const s = viscosityLayers(o);
  const tolerance = 8 * Number.EPSILON * s.height;
  if (y < -tolerance || y > s.height + tolerance || !Number.isFinite(y))
    throw new RangeError('Coordinate must lie in the gap');
  y = Math.max(0, Math.min(s.height, y));
  return y <= s.h1
    ? s.lowerSpeed + (s.shear * y) / s.lowerViscosity
    : s.interfaceSpeed + (s.shear * (y - s.h1)) / s.upperViscosity;
}
/** Uniform-fluid impulsive startup, excluding t=0 wall-stress singularity. */
export function couetteStart(
  y: number,
  time: number,
  height = 0.01,
  speed = 0.01,
  viscosity = 0.1,
  density = 1000,
) {
  if (
    ![height, viscosity, density].every((v) => Number.isFinite(v) && v > 0) ||
    !Number.isFinite(time) ||
    time < 0 ||
    !Number.isFinite(y) ||
    y < -8 * Number.EPSILON * height ||
    y > height + 8 * Number.EPSILON * height ||
    !Number.isFinite(speed)
  )
    throw new RangeError('Physical startup state required');
  y = Math.max(0, Math.min(height, y));
  if (time === 0)
    return { velocity: y === height ? speed : 0, displacement: 0, topShear: null, bottomShear: 0 };
  const nu = viscosity / density;
  let velocity = (speed * y) / height,
    displacement = velocity * time,
    top = 1,
    bottom = 1;
  for (let n = 1; n <= 100; n++) {
    const wave = (n * Math.PI) / height,
      lambda = nu * wave ** 2,
      decay = Math.exp(-lambda * time),
      coefficient = ((((2 * speed) / Math.PI) * (n % 2 ? -1 : 1)) / n) * Math.sin(wave * y);
    velocity += coefficient * decay;
    displacement += (coefficient * -Math.expm1(-lambda * time)) / lambda;
    top += 2 * decay;
    bottom += 2 * (n % 2 ? -1 : 1) * decay;
  }
  return {
    velocity,
    displacement,
    topShear: ((viscosity * speed) / height) * top,
    bottomShear: ((viscosity * speed) / height) * bottom,
  };
}
export function layersShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress)),
    base = {
      height: 0.01,
      fraction: 0.5,
      lowerViscosity: 0.1,
      upperViscosity: 0.1,
      lowerSpeed: 0,
      upperSpeed: 0.01,
      startup: false,
      elapsed: 2,
      swapped: false,
      powerView: false,
    };
  if (chapter === 0) return { ...base, startup: true, elapsed: 0.01 + 1.99 * p };
  if (chapter === 1) return { ...base, elapsed: 2 * p };
  if (chapter === 2) return { ...base, upperViscosity: 0.1 + 0.3 * p };
  if (chapter === 3) return { ...base, upperViscosity: 0.4, height: 0.005 + 0.01 * p };
  if (chapter === 4)
    return {
      ...base,
      upperViscosity: p < 0.5 ? 0.4 : 0.1,
      lowerViscosity: p < 0.5 ? 0.1 : 0.4,
      swapped: p >= 0.5,
    };
  if (chapter === 5) return { ...base, upperViscosity: 0.4, powerView: true, elapsed: 2 * p };
  if (chapter === 6)
    return { ...base, upperViscosity: 0.4, lowerSpeed: 0.01, elapsed: 2 * p, powerView: true };
  return base;
}
