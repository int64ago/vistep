const clamp = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
};
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const griffithGroups = [
  { id: 'r', liveR: true, liveS: false, killedS: false, mouseSurvives: true, recoveredS: false },
  { id: 's', liveR: false, liveS: true, killedS: false, mouseSurvives: false, recoveredS: true },
  {
    id: 'killed',
    liveR: false,
    liveS: false,
    killedS: true,
    mouseSurvives: true,
    recoveredS: false,
  },
  { id: 'mixed', liveR: true, liveS: false, killedS: true, mouseSurvives: false, recoveredS: true },
] as const;
export type Treatment = 'none' | 'protease' | 'rnase' | 'lipase' | 'dnase';
export const treatments: Treatment[] = ['none', 'protease', 'rnase', 'lipase', 'dnase'];
export const extractComponents = ['DNA', 'protein', 'RNA', 'lipid'] as const;
export function averyState(treatment: Treatment, receptiveR = true) {
  const target = { none: null, protease: 'protein', rnase: 'RNA', lipase: 'lipid', dnase: 'DNA' }[
    treatment
  ];
  return {
    components: extractComponents.map((id) => ({ id, intact: id !== target })),
    transformed: treatment !== 'dnase' && receptiveR,
    recipientPresent: receptiveR,
  };
}
export type Point = { x: number; y: number };
/** A single material path from the packaged genome through the tail into the host.
 * Its progressive traversal illustrates inferred dominant transport, not a measured trajectory. */
export function phageDnaPoint(index: number, progress: number): Point {
  const p = clamp(progress),
    shift = p * 2;
  const s = clamp(index / 23),
    u = s + shift;
  if (u <= 1) return { x: 175 + 15 * Math.sin(u * 6 * Math.PI), y: 80 + u * 23 };
  if (u <= 2) return { x: 175, y: 103 + (u - 1) * 97 };
  const q = u - 2;
  return { x: 175 + 53 * Math.sin(q * Math.PI * 2), y: 200 + q * 72 };
}
/** Stable capsid landmark goes away from the membrane only after injection. */
export function phageCoatOffset(detachment: number): Point {
  const p = smooth(detachment);
  return { x: 60 * p, y: -27 * p };
}
export type Isotope = 'sulfur' | 'phosphorus';
export const hersheyChaseEvidence = {
  sulfur: {
    releasedByShear: 0.75,
    majorFraction: 'supernatant',
    progeny: { operator: '<', parentalFraction: 0.01 },
  },
  phosphorus: {
    releasedByShear: 0.15,
    majorFraction: 'pellet',
    progeny: { operator: '≥', parentalFraction: 0.3 },
  },
} as const;
/** Same cell and same detached coat identities move into their sedimentation fractions. */
export function fractionPositions(progress: number, blended = true) {
  const p = smooth(progress);
  return {
    cells: Array.from({ length: 4 }, (_, id) => ({
      id: `cell-${id}`,
      x: lerp(117 + (id % 2) * 65, 144 + (id % 2) * 42, p),
      y: lerp(84 + Math.floor(id / 2) * 60, 237 + Math.floor(id / 2) * 18, p),
    })),
    coats: Array.from({ length: 4 }, (_, id) => ({
      id: `coat-${id}`,
      x: lerp(117 + (id % 2) * 65, blended ? 126 + (id % 2) * 70 : 144 + (id % 2) * 42, p),
      y: lerp(
        69 + Math.floor(id / 2) * 60,
        blended ? 90 + Math.floor(id / 2) * 50 : 222 + Math.floor(id / 2) * 18,
        p,
      ),
    })),
    interpretable: blended && p === 1,
  };
}
/** A colony is a population grown from a lineage; symbols are not individual micrograph cells. */
export function colonyPositions(count = 8) {
  return Array.from({ length: count }, (_, id) => ({
    id,
    x: 175 + Math.cos(id * 2.39996) * Math.sqrt(id + 1) * 24,
    y: 125 + Math.sin(id * 2.39996) * Math.sqrt(id + 1) * 18,
  }));
}
