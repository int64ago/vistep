import * as THREE from 'three';
import {
  AK47_ASSEMBLY as A,
  AK47_SURFACES,
  AK47_ROUND_SURFACES,
  AK47_BOX_SURFACES,
  ak47SurfaceGeometry,
  ak47RoundGeometry,
  ak47SpringPoint,
  ak47ArtPosition,
} from './ak47-art';
import { AK47_MODEL, ak47State, type Ak47Sample } from './ak47';
// Painted observation marks and teaching overlays, shared by both renderers.
// Their coordinates are visual proportions, not manufacturing measurements.
export const AK47_OBSERVATION_MARKS = [
  { name: 'carrier-observation-mark', point: [A.carrier - 0.2, A.axisY, 0.158], radius: 0.038 },
  { name: 'piston-observation-mark', point: [A.rodEnd, A.axisY, 0.097], radius: 0.029 },
] as const;
export function ak47TeachingDetails(state: Ak47Sample) {
  const offset = ak47ArtPosition(state.x / AK47_MODEL.maximumX);
  return {
    offset,
    marks: AK47_OBSERVATION_MARKS.map((mark) => ({
      ...mark,
      point: [mark.point[0] + offset, mark.point[1], mark.point[2]] as [number, number, number],
    })),
    arrow: {
      origin: [A.carrier + offset, A.axisY - 0.4, 0.22] as [number, number, number],
      direction: state.velocity > 0 ? -1 : 1,
      visible: Math.abs(state.velocity) > 0.008,
      length: 0.45,
    },
    gas: {
      points: [
        [2.85, 1.79, 0.02],
        [2.72, 2.15, 0.02],
        [2.3, 2.16, 0.02],
        [1.75, A.axisY, 0.02],
      ] as [number, number, number][],
      opacity: (state.drive / 4) * 0.9,
    },
  };
}
type Face = { points: THREE.Vector3[]; color: string; part: string; opacity: number };
const cache = AK47_SURFACES.map((s) => ({
  geometry: ak47SurfaceGeometry(s.key, s.depth, 6),
  color: s.material === 'wood' ? '#98653f' : s.material === 'cover' ? '#596267' : '#535b60',
  part: s.key,
}));
const round = AK47_ROUND_SURFACES.map((s) => ({
  geometry: ak47RoundGeometry(s.radius, s.length, s.position, 20),
  color: '#3c474b',
  part: s.name,
}));
const boxes: { geometry: THREE.BufferGeometry; color: string; part: string }[] =
  AK47_BOX_SURFACES.map((s) => {
    const geometry = new THREE.BoxGeometry(...s.size);
    geometry.translate(...s.position);
    return { geometry, color: '#3c474b', part: s.name };
  });
const sight = new THREE.TorusGeometry(0.09, 0.023, 8, 24);
sight.rotateY(Math.PI / 2);
sight.translate(3.56, 2.225, 0);
boxes.push({ geometry: sight, color: '#3c474b', part: 'front-sight-ring' });
const gasConnection = new THREE.TubeGeometry(
  new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(2.85, 1.79, 0),
      new THREE.Vector3(2.72, 2.15, 0),
      new THREE.Vector3(2.65, 2.165, 0),
    ],
    false,
    'centripetal',
  ),
  32,
  0.072,
  10,
  false,
);
boxes.push({ geometry: gasConnection, color: '#3c474b', part: 'gas-connection' });

function faces(
  geometry: THREE.BufferGeometry,
  color: string,
  part: string,
  opacity = 1,
  offset = new THREE.Vector3(),
): Face[] {
  const p = geometry.attributes.position,
    index = geometry.index,
    out: Face[] = [];
  for (let i = 0; i < (index?.count ?? p.count); i += 3) {
    const points = [0, 1, 2].map((j) =>
      new THREE.Vector3().fromBufferAttribute(p, index ? index.getX(i + j) : i + j).add(offset),
    );
    out.push({ points, color, part, opacity });
  }
  return out;
}
export function ak47ProjectedArt(
  width: number,
  height: number,
  state = ak47State(0.23),
  reveal = 0,
  closeup = false,
  comparison?: Ak47Sample,
  input = false,
) {
  const dir = new THREE.Vector3(
      closeup ? 0.4 : 2.7,
      closeup ? 1 : 3.1,
      closeup ? 10 : 13,
    ).normalize(),
    right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize(),
    up = new THREE.Vector3().crossVectors(dir, right).normalize();
  const center = new THREE.Vector3(
    closeup ? (input ? 0.25 : -0.375) : -0.05,
    closeup ? 2.015 : 1.325,
    0,
  );
  const bound = closeup
    ? [
        [-2.6, input ? 3.1 : 1.85],
        [comparison ? 1.16 : 1.62, comparison ? 2.87 : 2.5],
        [-0.32, 0.32],
      ]
    : [
        [-4.5, 4.4],
        [0, 2.65],
        [-0.43, 0.43],
      ];
  const corners: THREE.Vector3[] = [];
  for (const x of bound[0])
    for (const y of bound[1]) for (const z of bound[2]) corners.push(new THREE.Vector3(x, y, z));
  const aspect = width / height,
    tan = Math.tan((34 * Math.PI) / 360);
  let distance = 2.8 / (2 * tan);
  for (const p of corners) {
    const q = p.clone().sub(center);
    distance = Math.max(
      distance,
      q.dot(dir) + Math.abs(q.dot(right)) / (tan * aspect * 0.87),
      q.dot(dir) + Math.abs(q.dot(up)) / (tan * 0.87),
    );
  }
  const project = (p: THREE.Vector3) => {
    const v = p.clone().sub(center),
      z = distance - v.dot(dir);
    return [
      width / 2 + ((v.dot(right) / z / tan / aspect) * width) / 2,
      height / 2 - ((v.dot(up) / z / tan) * height) / 2,
    ];
  };
  let all: Face[] = [];
  if (!comparison) {
    for (const item of [...cache, ...round, ...boxes]) {
      const fade = ['body', 'cover', 'wood', 'upperWood', 'gas-tube-exterior'].includes(item.part)
        ? 1 - reveal * 0.94
        : 1;
      all.push(...faces(item.geometry, item.color, item.part, fade));
    }
  }
  const paths: {
    d: string;
    fill: string;
    stroke: string;
    opacity: number;
    part: string;
    strokeWidth?: number;
  }[] = [];
  const pathThrough = (points: THREE.Vector3[]) =>
    points
      .map((p, i) => {
        const [x, y] = project(p);
        return `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  for (const [sample, y] of comparison
    ? ([
        [state, 0.46],
        [comparison, -0.46],
      ] as const)
    : ([[state, 0]] as const)) {
    const offset = ak47ArtPosition(sample.x / AK47_MODEL.maximumX),
      at = new THREE.Vector3(0, y, 0);
    const details = ak47TeachingDetails(sample),
      visible = comparison ? 1 : reveal;
    const carrier = new THREE.BoxGeometry(A.carrierLength, 0.265, 0.3);
    carrier.translate(A.carrier + offset, A.axisY, 0);
    const rod = ak47RoundGeometry(
      0.041,
      A.rodEnd - A.carrier,
      [(A.rodEnd + A.carrier) / 2 + offset, A.axisY, 0],
      16,
    );
    const head = ak47RoundGeometry(0.093, 0.16, [A.rodEnd + offset, A.axisY, 0], 20);
    for (const [geometry, part] of [
      [carrier, 'carrier'],
      [rod, 'piston-rod'],
      [head, 'piston'],
    ] as const) {
      all.push(...faces(geometry, '#a9a89e', part, 1, at));
      geometry.dispose();
    }
    const pts = Array.from({ length: 353 }, (_, i) =>
      project(
        new THREE.Vector3(...ak47SpringPoint(i / 352, sample.x / AK47_MODEL.maximumX)).add(at),
      ),
    );
    paths.push({
      d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' '),
      fill: 'none',
      stroke: '#81918e',
      opacity: comparison ? 1 : reveal,
      part: 'spring',
      strokeWidth: 1.5,
    });
    for (const mark of details.marks) {
      const [x, y] = project(new THREE.Vector3(...mark.point).add(at));
      const edge = project(
        new THREE.Vector3(mark.point[0] + mark.radius, mark.point[1], mark.point[2]).add(at),
      );
      const radius = Math.max(2, Math.hypot(edge[0] - x, edge[1] - y));
      paths.push({
        d: `M${x - radius} ${y}a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`,
        fill: '#d9ad6c',
        stroke: '#d9ad6c',
        opacity: visible,
        part: mark.name,
        strokeWidth: 0,
      });
    }
    if (details.arrow.visible) {
      const origin = new THREE.Vector3(...details.arrow.origin).add(at),
        tip = origin
          .clone()
          .add(new THREE.Vector3(details.arrow.direction * details.arrow.length, 0, 0));
      const tailX = tip.x - details.arrow.direction * 0.1;
      paths.push({
        d: `${pathThrough([origin, tip])} ${pathThrough([new THREE.Vector3(tailX, tip.y + 0.05, tip.z), tip, new THREE.Vector3(tailX, tip.y - 0.05, tip.z)])}`,
        fill: 'none',
        stroke: '#688977',
        opacity: visible,
        part: 'velocity-arrow',
        strokeWidth: 2,
      });
    }
    if (input && !comparison && details.gas.opacity > 0) {
      const curve = new THREE.CatmullRomCurve3(
        details.gas.points.map((p) => new THREE.Vector3(...p)),
      );
      paths.push({
        d: pathThrough(curve.getPoints(40)),
        fill: 'none',
        stroke: '#d9ad6c',
        opacity: details.gas.opacity,
        part: 'gas-energy-highlight',
        strokeWidth: 3,
      });
    }
  }
  const light = new THREE.Vector3(-0.4, 1, 0.7).normalize();
  const polygons: typeof paths = all
    .map((face) => {
      const [a, b, c] = face.points,
        normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
      const color = new THREE.Color(face.color).multiplyScalar(
        0.67 + 0.36 * Math.max(0, normal.dot(light)),
      );
      return {
        ...face,
        normal,
        depth: face.points.reduce((s, p) => s + p.dot(dir), 0) / 3,
        fill: `#${color.getHexString()}`,
      };
    })
    .filter((f) => f.normal.dot(dir) > 0)
    .sort((a, b) => a.depth - b.depth)
    .map((f) => ({
      d:
        f.points
          .map((p, i) => {
            const [x, y] = project(p);
            return `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
          })
          .join(' ') + 'Z',
      fill: f.fill,
      stroke: f.fill,
      opacity: f.opacity,
      part: f.part,
    }));
  return { width, height, paths: [...polygons, ...paths] };
}
