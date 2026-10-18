const clamp = (x: number) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);
const ease = (x: number) => {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
};
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export type MeiosisChromatid = {
  id: string;
  pair: number;
  homolog: number;
  sister: number;
  cell: number;
  x: number;
  y: number;
  arm: number;
  length: number;
  visibility: number;
  proximalOrigin: number;
  distalOrigin: number;
};
/** Two homologous pairs; the two divisions preserve eight tracked replicated chromatids. */
export function meiosisState(time: number, crossover = true, orientation: 0 | 1 = 0) {
  const stage = Number.isFinite(time) ? Math.min(4, Math.max(0, time)) : 0,
    replication = ease(stage / 0.6),
    pairing = ease((stage - 0.6) / 0.6),
    first = ease(stage - 1.5),
    secondAlignment = ease((stage - 2.5) / 0.5),
    second = ease(stage - 3);
  const chromatids: MeiosisChromatid[] = [];
  for (let pair = 0; pair < 2; pair++)
    for (let homolog = 0; homolog < 2; homolog++)
      for (let sister = 0; sister < 2; sister++) {
        const side = homolog === (pair === 0 ? 0 : orientation) ? 0 : 1,
          cell = side * 2 + sister;
        const startX = homolog === 0 ? 90 + pair * 20 : 245 - pair * 10,
          startY = pair === 0 ? 90 + homolog * 10 : 220 - homolog * 10;
        let x = lerp(startX, 175 + (side ? 24 : -24), pairing),
          y = lerp(startY, 112 + pair * 76, pairing);
        x = lerp(x, side ? 255 : 95, first);
        x = lerp(x, (side ? 255 : 95) + (pair - 0.5) * 40, secondAlignment);
        y = lerp(y, 150, secondAlignment);
        y += (sister ? 70 : -70) * second;
        const exchanged =
          crossover &&
          stage >= 1.5 &&
          pair === 0 &&
          ((homolog === 0 && sister === 1) || (homolog === 1 && sister === 0));
        chromatids.push({
          id: `p${pair}-h${homolog}-s${sister}`,
          pair,
          homolog,
          sister,
          cell,
          x,
          y,
          arm: (sister ? 1 : -1) * 8 * replication * (1 - second),
          length: pair === 0 ? 28 : 19,
          visibility: sister ? replication : 1,
          proximalOrigin: homolog,
          distalOrigin: exchanged ? 1 - homolog : homolog,
        });
      }
  return {
    stage,
    replication,
    first,
    secondAlignment,
    second,
    chromatids,
    cellCount: stage < 2.5 ? 1 : stage < 4 ? 2 : 4,
    finalChromosomesPerGamete: 2,
    totalDNAInC: 2 + 2 * replication,
  };
}
export function meioticGametes(crossover = true, orientation: 0 | 1 = 0) {
  const all = meiosisState(4, crossover, orientation).chromatids;
  return Array.from({ length: 4 }, (_, cell) => all.filter((c) => c.cell === cell));
}
/** Chromatid identity follows its material segment through the shared exchange junction. */
export function exchangeGeometry(progress: number) {
  const p = clamp(progress),
    approach = ease(p / 0.4),
    separate = ease((p - 0.6) / 0.4),
    exchange = ease((p - 0.4) / 0.6);
  const left = lerp(155, 175, approach) - 20 * separate,
    right = lerp(195, 175, approach) + 20 * separate;
  return [0, 1, 2, 3].map((id) => {
    const originalX = [138, 155, 195, 212][id],
      origin = id < 2 ? 0 : 1,
      inner = id === 1 || id === 2;
    if (!inner)
      return {
        id,
        origin,
        proximal: `M${originalX} 58V214`,
        distal: null,
        centromere: { x: originalX, y: 109 },
        distalEndpoint: { x: originalX, y: 214 },
      };
    const proximalJunction = id === 1 ? left : right,
      distalJunction =
        id === 1
          ? lerp(155, 175, approach) + 20 * separate
          : lerp(195, 175, approach) - 20 * separate,
      distalEnd = lerp(originalX, id === 1 ? 195 : 155, exchange);
    return {
      id,
      origin,
      proximal: `M${originalX} 58V109Q${originalX} 141 ${proximalJunction} 151`,
      distal: `M${distalJunction} 151Q${distalEnd} 169 ${distalEnd} 214`,
      centromere: { x: originalX, y: 109 },
      distalEndpoint: { x: distalEnd, y: 214 },
    };
  });
}
export const fixedMeioticCells = Array.from({ length: 12 }, (_, id) => ({
  id,
  stage: [1.2, 1.4, 1.7, 2.1, 2.5, 2.8, 3.05, 3.5, 4, 1.7, 2.1, 3.5][id],
  x: 55 + (id % 4) * 80,
  y: 50 + Math.floor(id / 4) * 83,
}));
export function fixedMeioticSelection(index: number) {
  return fixedMeioticCells[
    Math.min(11, Math.max(0, Math.floor(Number.isFinite(index) ? index : 0)))
  ];
}
export function restoredPloidy(maternalPairs: number, paternalPairs: number) {
  return {
    maternal: maternalPairs,
    paternal: paternalPairs,
    total: maternalPairs + paternalPairs,
    balanced: maternalPairs === paternalPairs,
  };
}

function filmProgress(seconds: number, points: readonly (readonly [number, number])[]) {
  const t = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  for (let i = 1; i < points.length; i++) {
    if (t <= points[i][0]) {
      const [a, x] = points[i - 1],
        [b, y] = points[i];
      return x + (y - x) * ease((t - a) / (b - a));
    }
  }
  return points[points.length - 1][1];
}

/** Presentation cues calibrated to each language; the chromatid model remains independent. */
export function meiosisFilmProgress(chapter: number, seconds: number, locale: string) {
  const en = locale === 'en';
  const cues: (readonly (readonly [number, number])[])[] = [
    [
      [0, 0],
      [8, 0],
      [en ? 10.8 : 13.4, 0.5],
      [en ? 14 : 17.3, 1],
    ],
    [
      [0, 0],
      [2, 0],
      [en ? 3.8 : 4.9, 0.4],
      [en ? 5.5 : 7.1, 0.6],
      [en ? 12.2 : 14.4, 1],
    ],
    [
      [0, 0],
      [en ? 4 : 5.8, 0],
      [en ? 9 : 11.2, 1],
    ],
    [
      [0, 0],
      [4.1, 1 / 3],
      [en ? 8 : 11, 1],
    ],
    [
      [0, 0],
      [5, 0.4],
      [15, 1],
    ],
    [
      [0, 0],
      [en ? 4.2 : 3.2, 0],
      [8.8, 1],
    ],
    [
      [0, 0],
      [3, 0],
      [7, 0.28],
      [11, 0.55],
      [15, 0.8],
      [19, 1],
    ],
    [
      [0, 1],
      [en ? 7 : 9, 1],
      [en ? 9 : 11, 0],
      [en ? 10 : 12, 0],
      [en ? 12.5 : 14.2, 1],
    ],
  ];
  return filmProgress(seconds, cues[Math.min(7, Math.max(0, Math.floor(chapter) || 0))]);
}
