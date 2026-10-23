const clamp = (x: number) => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
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

/** Presentation cuts follow the unchanged recorded speech; time is local chapter seconds.
 * Separate samples reset between assays. Geometry remains a reconstruction, not molecular footage. */
export function materialFilmState(chapter: number, time: number, locale = 'zh') {
  const c = Math.max(0, Math.min(7, Math.floor(Number.isFinite(chapter) ? chapter : 0)));
  const t = Math.max(0, Number.isFinite(time) ? time : 0),
    en = locale === 'en';
  const span = (a: number, b: number) => clamp((t - a) / (b - a));
  let p = 0,
    selected = 0,
    treatment: Treatment = 'none',
    isotope: Isotope = 'sulfur';
  let blended = true,
    phase: 'process' | 'detachment' | 'fractions' | 'counterexample' = 'process';
  let sample = 'historical-reconstruction';
  if (c === 0)
    selected = t < (en ? 4.9 : 5) ? 0 : t < (en ? 6.2 : 7.5) ? 1 : t < (en ? 8.4 : 11.2) ? 2 : 3;
  if (c === 1) p = span(en ? 2.2 : 5.8, en ? 6.5 : 11.1);
  if (c === 2) p = span(en ? 6.4 : 7.1, en ? 9.8 : 12.2);
  if (c === 3) {
    const cuts = en ? [2.3, 4.4, 6.3, 9.9] : [2.3, 4.1, 5.8, 9.5];
    const i = t < cuts[1] ? 0 : t < cuts[2] ? 1 : t < cuts[3] ? 2 : 3;
    treatment = treatments[i + 1];
    p = span(
      cuts[i],
      i === 3 ? (en ? 14.2 : 14.2) : i === 0 ? cuts[1] : i === 1 ? cuts[2] : en ? 9.3 : 8.8,
    );
    sample = `extract-${treatment}`;
  }
  if (c === 4) {
    isotope = t < (en ? 10.5 : 14.45) ? 'sulfur' : 'phosphorus';
    p = span(en ? 3 : 4.3, en ? 6.6 : 10.7);
    sample = `label-${isotope}`;
  }
  if (c === 5) {
    isotope = t < (en ? 6.6 : 7.2) ? 'sulfur' : 'phosphorus';
    p = span(en ? 6.6 : 7.2, en ? 10.1 : 11.2);
    sample = 'inferred-dominant-path';
  }
  if (c === 6) {
    const counter = t >= (en ? 19.1 : 19.7);
    if (counter) {
      blended = false;
      phase = 'counterexample';
      p = span(en ? 19.6 : 20.2, en ? 24.7 : 27.3);
      sample = 'fresh-unblended-control';
    } else if (t < (en ? 5.8 : 5.6)) {
      phase = 'detachment';
      p = span(1.4, en ? 5.3 : 5.5);
      sample = 'blended-sulfur';
    } else {
      phase = 'fractions';
      p = span(en ? 5.8 : 5.6, en ? 8.7 : 8.5);
      sample = 'blended-sulfur';
    }
    isotope = t < (en ? 11.7 : 11.4) ? 'sulfur' : 'phosphorus';
    if (counter) isotope = 'sulfur';
  }
  if (c === 7) {
    isotope = t < 8.3 ? 'sulfur' : 'phosphorus';
    p = span(3, 4.6);
    sample = `progeny-${isotope}`;
  }
  return {
    chapter: c,
    p,
    selected,
    treatment,
    isotope,
    blended,
    phase,
    sample,
    reveal: c !== 7 || t >= 3.4,
  };
}
