export const cytochromeDifferences = [
  ['黑猩猩', 0],
  ['猕猴', 1],
  ['狗', 11],
  ['鸡', 13],
  ['响尾蛇', 14],
  ['金枪鱼', 21],
  ['果蝇', 27],
  ['天蚕蛾', 31],
  ['链孢霉', 43],
  ['酵母菌', 44],
] as const;
export function selectionYears(darkChange = 0.1, lightChange = -0.1, years = 10) {
  let ss = 10,
    het = 20,
    light = 70;
  return Array.from({ length: years }, (_, i) => {
    if (i) {
      ss *= 1 + darkChange;
      het *= 1 + darkChange;
      light *= 1 + lightChange;
    }
    const total = ss + het + light;
    return {
      year: i + 1,
      counts: [ss, het, light],
      frequencies: [ss / total, het / total, light / total],
      S: (2 * ss + het) / (2 * total),
      s: (2 * light + het) / (2 * total),
      total,
    };
  });
}
export type Limb = 'human' | 'bat' | 'whale' | 'cat';
export type Bone = {
  id: string;
  group: number;
  a: [number, number];
  b: [number, number];
  width: number;
};
export function limbBones(limb: Limb) {
  const human = limb === 'human',
    bat = limb === 'bat',
    whale = limb === 'whale';
  const elbow: [number, number] = [100, human ? 83 : bat ? 65 : whale ? 53 : 91],
    wrist: [number, number] = [100, human ? 139 : bat ? 105 : whale ? 100 : 156];
  const bones: Bone[] = [
    { id: 'humerus', group: 0, a: [100, 17], b: elbow, width: 12 },
    { id: 'radius', group: 1, a: [elbow[0] - 7, elbow[1]], b: [wrist[0] - 8, wrist[1]], width: 7 },
    {
      id: 'ulna',
      group: 2,
      a: [elbow[0] + 7, elbow[1]],
      b: [wrist[0] + 8, wrist[1]],
      width: bat ? 3 : 7,
    },
  ];
  for (let i = 0; i < 6; i++)
    bones.push({
      id: `carpal-${i}`,
      group: 3,
      a: [85 + (i % 3) * 15, wrist[1] + 7 + Math.floor(i / 3) * 9],
      b: [89 + (i % 3) * 15, wrist[1] + 7 + Math.floor(i / 3) * 9],
      width: 8,
    });
  for (let d = 0; d < 5; d++) {
    const angle = (d - 2) * (bat ? 0.32 : whale ? 0.16 : 0.23) + (d === 0 ? -0.25 : 0);
    const x = 85 + d * 7.5,
      y = wrist[1] + 18;
    const met = bat ? (d === 0 ? 20 : 48) : whale ? 22 : human ? 28 : 18;
    const end: [number, number] = [x + Math.sin(angle) * met, y + Math.cos(angle) * met];
    bones.push({ id: `metacarpal-${d}`, group: 4, a: [x, y], b: end, width: 5 });
    let a = end;
    const count = whale ? [3, 5, 7, 6, 4][d] : d === 0 ? 2 : 3;
    const lengths = bat ? (d === 0 ? 10 : 25) : whale ? 10 : human ? (d === 0 ? 13 : 16) : 9;
    for (let j = 0; j < count; j++) {
      const len = lengths * (1 - j * 0.09);
      const b: [number, number] = [a[0] + Math.sin(angle) * len, a[1] + Math.cos(angle) * len];
      bones.push({ id: `digit-${d}-${j}`, group: 5, a, b, width: 4.5 });
      a = b;
    }
  }
  return bones;
}
export const diskCenters = [
  { id: 'blank', x: 98, y: 98, drug: false },
  { id: 'a', x: 202, y: 98, drug: true },
  { id: 'b', x: 98, y: 202, drug: true },
  { id: 'c', x: 202, y: 202, drug: true },
];
export function concentration(distance: number) {
  return Math.exp((-distance * distance) / (2 * 18 * 18));
}
export function inhibitionRadius(threshold: number) {
  if (threshold >= 1) return 8;
  return Math.max(8, 18 * Math.sqrt(-2 * Math.log(Math.max(0.001, threshold))));
}
export function discSelection(passage: number, preexisting = true) {
  const selected = passage >= 1 && preexisting;
  const threshold = selected ? 0.5 : 0.12;
  const diameters = [0.98, 1, 1.02].map((f) => 2 * inhibitionRadius(threshold * f));
  return {
    selected,
    threshold,
    radius: inhibitionRadius(threshold),
    blankRadius: 8,
    lineage: selected ? 'R-3' : 'mixed',
    diameters,
    meanDiameter: diameters.reduce((sum, x) => sum + x, 0) / 3,
  };
}
export function isolatedPopulations(generations: number, migration: number) {
  let a = 0.5,
    b = 0.5;
  const out = [{ generation: 0, a, b }];
  for (let i = 1; i <= generations; i++) {
    const sa = (a * 1.15) / (a * 1.15 + (1 - a) * 0.85);
    const sb = (b * 0.85) / (b * 0.85 + (1 - b) * 1.15);
    a = (1 - migration) * sa + migration * sb;
    b = (1 - migration) * sb + migration * sa;
    out.push({ generation: i, a, b });
  }
  return out;
}
export function geneFlow(geographicBarrier: boolean, reproductiveBarrier: boolean) {
  return !geographicBarrier && !reproductiveBarrier;
}
