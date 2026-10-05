/** Paraxial reduced-angle ray transfer in SI units. A 60 D equivalent eye and a flat
 * retinal image plane illustrate optics; neither anatomy nor eye growth is predicted. */
export type MyopiaLensKind = 'none' | 'single' | 'dims';
export type MyopiaPoint = { x: number; y: number };
export type MyopiaRay = {
  points: MyopiaPoint[];
  admitted: boolean;
  kind: 'clear' | 'defocus';
};
export const MYOPIA_OPTICS = {
  eyePower: 60,
  vitreousIndex: 1.336,
  vertexM: 0.012,
  pupilRadiusM: 0.0035,
  clearDiameterMm: 9,
  treatmentDiameterMm: 33,
  lensletDiameterMm: 1.03,
} as const;
const smooth = (x: number) => {
  const v = Math.max(0, Math.min(1, x));
  return v * v * (3 - 2 * v);
};
export function myopiaLenslets() {
  const points: MyopiaPoint[] = [];
  // A sampled hexagonal layout, not a manufacturing map of a commercial product.
  const pitch = 1.42,
    radius = MYOPIA_OPTICS.lensletDiameterMm / 2;
  for (let row = -13; row <= 13; row++)
    for (let col = -13; col <= 13; col++) {
      const x = pitch * (col + (Math.abs(row) % 2) / 2),
        y = (row * pitch * Math.sqrt(3)) / 2;
      const r = Math.hypot(x, y);
      if (
        r >= MYOPIA_OPTICS.clearDiameterMm / 2 + radius &&
        r <= MYOPIA_OPTICS.treatmentDiameterMm / 2 - radius
      )
        points.push({ x, y });
    }
  return points;
}
export const MYOPIA_LENSLETS = myopiaLenslets();
export const MYOPIA_SELECTED_LENSLET = MYOPIA_LENSLETS.reduce((best, p) =>
  Math.hypot(p.x, p.y + 6) < Math.hypot(best.x, best.y + 6) ? p : best,
);
// The traced plane contains the optical axis and this lenslet centre. Its signed
// radial height is not the y-coordinate of a longitudinal projection.
export const MYOPIA_SLICE_LENSLET_MM = -Math.hypot(
  MYOPIA_SELECTED_LENSLET.x,
  MYOPIA_SELECTED_LENSLET.y,
);
export function myopiaOptics({
  myopiaD = 3,
  kind = 'dims',
  addD = 3.5,
  angleDeg = 18,
}: { myopiaD?: number; kind?: MyopiaLensKind; addD?: number; angleDeg?: number } = {}) {
  if (
    ![myopiaD, addD, angleDeg].every(Number.isFinite) ||
    myopiaD < 1 ||
    myopiaD > 5 ||
    addD < 0 ||
    addD > 4 ||
    Math.abs(angleDeg) > 20 ||
    !['none', 'single', 'dims'].includes(kind)
  )
    throw new RangeError('Unsupported teaching optics input');
  const { eyePower: E, vitreousIndex: n, vertexM: v, pupilRadiusM } = MYOPIA_OPTICS;
  const retinaM = n / (E - myopiaD);
  // Vertex correction: P/(1-vP) is the spectacle vergence at the eye.
  const correctionD = -myopiaD / (1 - v * myopiaD);
  const baseD = kind === 'none' ? 0 : correctionD;
  const theta = (angleDeg * Math.PI) / 180;
  const clearCentreM = (-v * theta) / (1 - v * baseD);
  const centres: { kind: 'clear' | 'defocus'; centreM: number; power: number; add: number }[] = [
    { kind: 'clear', centreM: clearCentreM, power: baseD, add: 0 },
  ];
  if (kind === 'dims')
    centres.push({
      kind: 'defocus',
      centreM: MYOPIA_SLICE_LENSLET_MM / 1000,
      power: baseD + addD,
      add: addD,
    });
  const rays: MyopiaRay[] = [],
    foci: { kind: 'clear' | 'defocus'; point: MyopiaPoint; admitted: boolean }[] = [];
  for (const bundle of centres) {
    const derivativeH = 1 - v * bundle.power;
    const derivativeU = -(bundle.power + E * derivativeH);
    const focusM = (-n * derivativeH) / derivativeU;
    let admitted = false;
    const centreAngle = theta - baseD * bundle.centreM;
    const centreEyeH = bundle.centreM + v * centreAngle;
    const centreEyeU = centreAngle - E * centreEyeH;
    const focusY = centreEyeH + (focusM * centreEyeU) / n;
    // The clear aperture is much wider than a single lenslet. Sample a 5.2 mm
    // central bundle, clipped to the actual 9 mm clear zone at oblique gaze;
    // the annular bundle remains inside its 1.03 mm lenslet. These sampling
    // widths change neither lens power nor the pupil's admission test.
    const centreMm = bundle.centreM * 1000,
      halfWidthMm = bundle.kind === 'clear' ? 2.6 : 0.36,
      lowMm =
        bundle.kind === 'clear'
          ? Math.max(-MYOPIA_OPTICS.clearDiameterMm / 2, centreMm - halfWidthMm)
          : centreMm - halfWidthMm,
      highMm =
        bundle.kind === 'clear'
          ? Math.min(MYOPIA_OPTICS.clearDiameterMm / 2, centreMm + halfWidthMm)
          : centreMm + halfWidthMm;
    for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
      const h = (lowMm + (highMm - lowMm) * fraction) / 1000;
      const u = theta - baseD * h - bundle.add * (h - bundle.centreM);
      const eyeH = h + v * u,
        eyeU = u - E * eyeH;
      const passes = Math.abs(eyeH) <= pupilRadiusM;
      admitted ||= passes;
      const points = [
        { x: -19, y: 1000 * (h - 0.007 * theta) },
        { x: -v * 1000, y: h * 1000 },
        { x: 0, y: eyeH * 1000 },
      ];
      if (passes) points.push({ x: retinaM * 1000, y: 1000 * (eyeH + (retinaM * eyeU) / n) });
      rays.push({ points, admitted: passes, kind: bundle.kind });
    }
    foci.push({ kind: bundle.kind, point: { x: focusM * 1000, y: focusY * 1000 }, admitted });
  }
  return {
    kind,
    myopiaD,
    addD,
    angleDeg,
    correctionD,
    baseD,
    retinaMm: retinaM * 1000,
    rays,
    foci,
    defocusMm: foci.length === 2 ? retinaM * 1000 - foci[1].point.x : 0,
  };
}
export const MYOPIA_TRIAL = {
  years: 2,
  enrolled: 183,
  completed: 160,
  dims: { n: 79, axialMm: 0.21, axialSeMm: 0.02, progressionD: -0.38, progressionSeD: 0.06 },
  single: { n: 81, axialMm: 0.53, axialSeMm: 0.03, progressionD: -0.93, progressionSeD: 0.06 },
  source: 'https://ira.lib.polyu.edu.hk/bitstream/10397/82284/1/Lam_DIMS_Spectacle_Lenses.pdf',
} as const;
export function myopiaShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const kind: MyopiaLensKind = chapter === 0 ? 'none' : chapter < 3 ? 'single' : 'dims';
  const angleDeg = chapter < 3 ? 0 : chapter === 3 ? 18 * smooth((p - 0.04) / 0.22) : 18;
  const view =
    chapter === 2 ? 'lens' : chapter === 4 ? 'focus' : chapter === 5 ? 'evidence' : 'eye';
  const optics = myopiaOptics({
    kind,
    angleDeg,
    myopiaD: chapter === 0 ? 1 + 2 * smooth(p / 0.55) : 3,
  });
  return { optics, view, reveal: smooth(p / 0.24) };
}
