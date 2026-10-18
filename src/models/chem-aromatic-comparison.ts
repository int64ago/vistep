/** Phase partition and acidic side-chain oxidation are separate teaching models. */
export type Arene = 'benzene' | 'toluene' | 'tertbutyl';
export function partition(total = 1, organicVolume = 1, waterVolume = 1, k = 8, contact = 1) {
  const vo = Math.max(0.001, organicVolume),
    vw = Math.max(0.001, waterVolume),
    K = Math.max(0, k),
    f = Math.max(0, Math.min(1, contact));
  const organic = ((total * K * vo) / (K * vo + vw)) * f,
    water = total - organic;
  return {
    organic,
    water,
    organicConcentration: organic / vo,
    waterConcentration: water / vw,
    consumed: 0,
  };
}
export function oxidize(arene: Arene, progress: number, initialMn = 0.6, initialAcid = 3) {
  const extent =
    arene === 'toluene'
      ? Math.min(1 / 5, Math.max(0, initialMn) / 6, Math.max(0, initialAcid) / 18) *
        Math.max(0, Math.min(1, progress))
      : 0;
  return {
    extent,
    arene: 1 - 5 * extent,
    benzoicAcid: 5 * extent,
    permanganate: initialMn - 6 * extent,
    manganeseII: 6 * extent,
    hydrogenIons: initialAcid - 18 * extent,
    water: 14 * extent,
    benzylicH: arene === 'toluene' ? 3 : 0,
  };
}
export function ringGeometry(radius = 43) {
  return Array.from({ length: 6 }, (_, i) => ({
    id: `ring-C${i + 1}`,
    x: 100 + radius * Math.cos((i * Math.PI) / 3),
    y: 100 + radius * Math.sin((i * Math.PI) / 3),
  }));
}
export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export function tracer(contact: number) {
  const p = clamp(contact),
    q = p * p * (3 - 2 * p);
  return {
    x: 100 + 24 * Math.sin(q * Math.PI),
    y: 225 - 115 * q,
    atoms: [
      { id: 'Br-a', offset: -6 },
      { id: 'Br-b', offset: 6 },
    ],
  };
}
export function layerColors(concentration: number, reagent: 'bromine' | 'permanganate') {
  const absorb = 1 - Math.exp(-Math.max(0, concentration) * 2.2);
  const background = [237, 241, 225],
    pigment = reagent === 'bromine' ? [174, 105, 46] : [141, 86, 153];
  return `rgb(${background.map((v, i) => Math.round(v + (pigment[i] - v) * absorb)).join(',')})`;
}
/** Interior: width88, straight wall to y247, two quadratic bottom caps of area2640. */
export function tubeInterface(organicToWater: number) {
  return 60 + ((247 - 60 + 2640 / 88) * organicToWater) / (organicToWater + 1);
}
