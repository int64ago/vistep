import {
  nfcArtPath,
  nfcArtTagPoint,
  nfcBoxFaces,
  nfcCircle,
  nfcConnections,
  nfcProject,
  nfcSpiralPoint,
  nfcFluxArrow,
  NFC_ART,
  type NfcPoint,
  type NfcVisual,
} from './nfc-geometry';

export type NfcArtworkPath = {
  d: string;
  fill: string;
  stroke?: string;
  width?: number;
  opacity?: number;
  part: string;
};

/** Both flat renderer and exported artwork use the same continuous copper routes
 * as the physical apparatus. Each format has its own physical-to-page scale. */
export function nfcArtwork(width: number, height: number, visual: NfcVisual, cover = false) {
  const paths: NfcArtworkPath[] = [],
    project = (p: NfcPoint) => nfcProject(p, width, height, visual, cover),
    lineWidth = cover ? 1.15 : Math.min(width / 87, height / 116) * 0.36,
    add = (
      points: readonly NfcPoint[],
      fill: string,
      part: string,
      stroke?: string,
      weight?: number,
      opacity = 1,
      close = true,
    ) =>
      paths.push({
        d: nfcArtPath(points, project, close),
        fill,
        part,
        stroke,
        width: weight,
        opacity,
      });
  add(nfcCircle(35, -9.1), '#d6cbb8', 'shadow', undefined, undefined, 0.3);
  for (const which of ['reader', 'tag'] as const) {
    const tag = which === 'tag',
      radius = tag ? NFC_ART.tagRadiusMm : NFC_ART.readerRadiusMm,
      bottom = tag ? -NFC_ART.tagHalfThicknessMm : NFC_ART.readerBottomMm,
      top = tag ? NFC_ART.tagHalfThicknessMm : NFC_ART.readerTopMm,
      transform = (p: NfcPoint) => (tag ? nfcArtTagPoint(p, visual) : p),
      tx = (p: readonly NfcPoint[]) => p.map(transform),
      copper = tag ? '#b46935' : '#d8a06b',
      wiring = nfcConnections(which),
      wire = (
        p: readonly NfcPoint[],
        part: string,
        color = copper,
        weight = lineWidth,
        opacity = 1,
      ) => add(tx(p), 'none', part, color, weight, opacity, false);
    // Back face, continuous side wall, top face: opaque support hides apparatus below.
    add(tx(nfcCircle(radius, bottom)), tag ? '#b7ae9e' : '#232d30', `${which}-bottom`);
    const side = nfcCircle(radius, top)
      .slice(0, 49)
      .concat(nfcCircle(radius, bottom).slice(0, 49).reverse());
    add(tx(side), tag ? '#cbc1ae' : '#263238', `${which}-side`);
    add(
      tx(nfcCircle(radius, top)),
      tag ? '#efe7d7' : '#344247',
      `${which}-top`,
      tag ? '#c1b59f' : '#516166',
      0.8,
    );
    if (!tag) add(tx(nfcCircle(28.5, top + 0.02)), '#273639', 'reader-board', '#69776d', 0.6);
    const visibility = tag ? visual.showInternals : 1;
    wire(
      Array.from({ length: 769 }, (_, i) => nfcSpiralPoint(which, i / 768)),
      `${which}-spiral`,
      copper,
      lineWidth * 1.2,
      visibility,
    );
    wire(wiring.inner, `${which}-inner`, copper, lineWidth, visibility);
    wiring.capWires.forEach((p, i) =>
      wire(p, `${which}-cap-wire-${i}`, copper, lineWidth, visibility),
    );
    const device = (name: string, spec: { center: NfcPoint; size: NfcPoint }, colors: string[]) =>
      nfcBoxFaces(spec.center, spec.size).forEach((face, i) =>
        add(tx(face), colors[i], `${which}-${name}-${i}`, undefined, undefined, visibility),
      );
    wire(
      [wiring.left, wiring.right],
      `${which}-chip-terminals`,
      '#d9ba7c',
      lineWidth * 3,
      visibility,
    );
    wire(
      [wiring.capLeft, wiring.capRight],
      `${which}-capacitor-terminals`,
      '#b5b4a7',
      lineWidth * 2.2,
      visibility,
    );
    device('chip', wiring.chip, [
      tag && visual.powered ? '#465e56' : '#34423e',
      '#172825',
      '#23332f',
    ]);
    device('capacitor', wiring.capacitor, ['#d4bd8a', '#9d8d69', '#c1ab7c']);
    wire(wiring.insulation, `${which}-insulation`, '#e2d7be', lineWidth * 3.6, visibility);
    wire(wiring.outer, `${which}-outer`, copper, lineWidth, visibility);
  }
  const flux = nfcFluxArrow(visual.fluxNormalized);
  if (visual.fluxNormalized !== undefined && flux.visible) {
    add(
      [flux.from, flux.base].map((p) => nfcArtTagPoint(p, visual)),
      'none',
      'local-flux-shaft',
      '#236f72',
      Math.max(1.6, lineWidth * 1.65),
      flux.opacity,
      false,
    );
    add(
      flux.head.map((p) => nfcArtTagPoint(p, visual)),
      '#236f72',
      'local-flux-tip',
      undefined,
      undefined,
      flux.opacity,
    );
  }
  return { width, height, visual, paths };
}

export function nfcCover() {
  return nfcArtwork(
    400,
    230,
    {
      gapMm: 19,
      tiltDeg: 12,
      phase: 1,
      powered: true,
      fieldOn: true,
      loadOn: false,
      showInternals: 1,
    },
    true,
  );
}
