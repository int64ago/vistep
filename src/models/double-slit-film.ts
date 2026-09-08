import {
  DOUBLE_SLIT_DEFAULT,
  doubleSlitPhasePosition,
  type DoubleSlitParameters,
} from './double-slit';

export type DoubleSlitView =
  'opening' | 'paths' | 'phase' | 'spacing' | 'wavelength' | 'width' | 'detections';
const smooth = (v: number) => {
  const x = Math.max(0, Math.min(1, v));
  return x * x * (3 - 2 * x);
};
const ramp = (p: number, a = 0.2, b = 0.8) => smooth((p - a) / (b - a));
/** A chapter-relative director; no accumulated state, timers, or stochastic history. */
export function doubleSlitShot(chapter: number, progress: number) {
  if (!Number.isFinite(chapter) || !Number.isFinite(progress))
    throw new RangeError('Film position must be finite');
  const c = Math.max(0, Math.min(6, Math.floor(chapter))),
    p = Math.max(0, Math.min(1, progress));
  const parameters: DoubleSlitParameters = { ...DOUBLE_SLIT_DEFAULT };
  const views: DoubleSlitView[] = [
    'opening',
    'paths',
    'phase',
    'spacing',
    'wavelength',
    'width',
    'detections',
  ];
  let cycles = 0.5;
  if (c === 0) parameters.slit = p < 0.24 ? 'one' : 'both';
  if (c === 1) cycles = 0.5 * ramp(p, 0.18, 0.45) + 0.5 * ramp(p, 0.55, 0.73);
  if (c === 2) cycles = 1 - 0.5 * ramp(p, 0.28, 0.46);
  if (c === 3) parameters.separationM = (180 + 120 * ramp(p)) * 1e-6;
  if (c >= 4) parameters.separationM = 300e-6;
  if (c === 4) parameters.wavelengthM = (550 + 100 * ramp(p)) * 1e-9;
  if (c >= 5) parameters.wavelengthM = 650e-9;
  if (c === 5) parameters.slitWidthM = (35 + 35 * ramp(p)) * 1e-6;
  if (c === 6) parameters.slitWidthM = 70e-6;
  if (c >= 3) cycles = 0;
  return {
    parameters,
    view: views[c],
    probeM: doubleSlitPhasePosition(parameters, cycles) ?? 0,
    detections: c === 6 ? Math.floor(1200 * Math.max(0, Math.min(1, (p - 0.05) / 0.85))) : 0,
  };
}
