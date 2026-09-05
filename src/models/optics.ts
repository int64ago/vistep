/** Paraxial thin-lens teaching model. Every length is in millimetres. */
export function thinLens(focal: number, object: number) {
  if (!(focal > 0 && object > 0) || !Number.isFinite(focal + object))
    throw new RangeError('Focal length and object distance must be finite and positive.');
  const vergence = 1 / focal - 1 / object;
  const image = Math.abs(vergence) < 1e-12 ? null : 1 / vergence;
  return { image, magnification: image === null ? null : -image / object, real: vergence > 0 };
}
/** A ray hits the ideal lens at height, from object point (−object, sourceHeight). */
export function lensRay(focal: number, object: number, sourceHeight: number, height: number) {
  const incoming = (height - sourceHeight) / object;
  const outgoing = incoming - height / focal;
  return { incoming, outgoing, at: (x: number) => height + outgoing * x };
}
export function apertureDiameter(focal: number, fNumber: number) {
  if (!(focal > 0 && fNumber > 0)) throw new RangeError('Invalid aperture.');
  return focal / fNumber;
}
/** Defocused point diameter on the sensor, without diffraction or aberrations. */
export function circleOfConfusion(focal: number, fNumber: number, object: number, focus: number) {
  const sensor = thinLens(focal, focus).image;
  if (sensor === null || sensor <= 0) throw new RangeError('Focus must be beyond the focal plane.');
  return apertureDiameter(focal, fNumber) * Math.abs(1 - sensor * (1 / focal - 1 / object));
}
export function depthOfField(focal: number, fNumber: number, focus: number, tolerance = 0.03) {
  if (!(focus > focal && tolerance > 0)) throw new RangeError('Invalid focus or blur tolerance.');
  const span = (tolerance * fNumber * (focus - focal)) / (focal * focal);
  return { near: focus / (1 + span), far: span >= 1 ? Infinity : focus / (1 - span) };
}
/** Relative irradiance at equal focus and shutter; not a camera exposure meter. */
export const relativeLight = (fNumber: number, reference = 2) => (reference / fNumber) ** 2;
export const airyDiameter = (fNumber: number, wavelength = 0.00055) => 2.44 * wavelength * fNumber;
const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};
const blend = (a: number, b: number, p: number) => a + (b - a) * smooth(p);
export function cameraShot(chapter: number, progress: number) {
  let object = 200,
    focal = 50,
    sensor = 92,
    height = 18;
  if (chapter >= 2) sensor = 200 / 3;
  if (chapter === 2) sensor = blend(92, 200 / 3, (progress - 0.15) / 0.65);
  if (chapter === 3) height = blend(18, -18, (progress - 0.1) / 0.75);
  if (chapter === 4) object = blend(200, 110, (progress - 0.1) / 0.65);
  if (chapter === 5) {
    object = 110;
    sensor = blend(200 / 3, 550 / 6, (progress - 0.15) / 0.65);
  }
  if (chapter === 6) {
    focal = blend(40, 65, (progress - 0.15) / 0.7);
    object = 200;
    sensor = thinLens(focal, object).image!;
  }
  if (chapter === 7) {
    object = 30;
    sensor = 92;
  }
  return { object, focal, sensor, height, aperture: 34 };
}
export function apertureShot(chapter: number, progress: number) {
  let fNumber = 2,
    focus = 2000,
    compensate = true;
  if (chapter === 1) fNumber = blend(2, 8, (progress - 0.15) / 0.65);
  if (chapter === 2) {
    fNumber = progress < 0.25 ? 2 : progress < 0.6 ? Math.sqrt(8) : 4;
    compensate = false;
  }
  if (chapter === 3) fNumber = blend(2, 8, (progress - 0.15) / 0.7);
  if (chapter === 4) fNumber = blend(2, 11, (progress - 0.1) / 0.75);
  if (chapter === 5) {
    fNumber = 2.8;
    focus = blend(2000, 6000, (progress - 0.1) / 0.75);
  }
  if (chapter === 6) fNumber = blend(8, 22, (progress - 0.1) / 0.75);
  if (chapter === 7) fNumber = progress < 0.5 ? 2 : 8;
  return { fNumber, focus, compensate, focal: 50 };
}
