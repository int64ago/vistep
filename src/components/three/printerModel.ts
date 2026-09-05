import * as THREE from 'three';
import { box, roller, screw, tube, gear, material } from './parts';
import type { StudioContext, StudioObject } from './Studio';
import { fadingCover, scalarTransition, softEase } from './motion';
export type PrinterVisualState = {
  progress: number;
  exploded: boolean;
  pattern: string[];
  selected: number;
  charges: boolean;
  view: 'perspective' | 'top';
  focus?: boolean;
};
export function createPrinter(
  context: StudioContext,
  read: () => PrinterVisualState,
): StudioObject {
  const { root, camera, controls, reducedMotion } = context;
  const ivory = material('#e8e8e1', 0.08, 0.29),
    graphite = material('#252d34', 0.25, 0.4),
    rubber = material('#141b20', 0.05, 0.85);
  const silver = material('#aeb9bf', 0.88, 0.25),
    white = material('#fcfcf5', 0.03, 0.6),
    black = material('#10191d', 0.1, 0.6);
  const copper = material('#b46632', 0.8, 0.27),
    green = material('#147e75', 0.55, 0.24),
    blue = material('#283e70', 0.7, 0.3);
  const amber = material('#ff9b35', 0.28, 0.28);
  amber.emissive.set('#bd4c0a');
  amber.emissiveIntensity = 0.4;
  const base = new THREE.Group();
  root.add(base);
  box(base, [7.5, 0.22, 4.15], [0, 0.14, 0], graphite, 0.1);
  box(base, [7.1, 0.045, 3.8], [0, 0.275, 0], silver, 0.025);
  for (const x of [-3.25, 3.25])
    for (const z of [-1.7, 1.7]) {
      box(base, [0.6, 0.17, 0.5], [x, 0, z], rubber, 0.06);
      screw(base, [x, 0.315, z], silver);
    }
  for (const z of [-1.5, 1.5]) {
    box(base, [6.8, 0.08, 0.16], [0, 0.53, z], silver, 0.02);
    for (const x of [-2.9, -1.5, 0.4, 2.6]) {
      box(base, [0.18, 0.5, 0.25], [x, 0.43, z], graphite);
      screw(base, [x, 0.7, z], silver);
    }
  }
  // The paper path is continuous under the drum and through the fusing nip.
  box(base, [7.45, 0.035, 2.85], [0, 0.61, 0], white, 0.012);
  for (const x of [-3, -2.35, 0.8, 3.1]) {
    const assembly = roller(base, 0.105, 3.25, [x, 0.76, 0], rubber);
    for (const z of [-1.72, 1.72]) {
      roller(assembly, 0.055, 0.2, [0, 0, z], silver);
    }
  }
  const drum = roller(base, 0.64, 3.2, [-0.65, 1.29, 0], green);
  for (const z of [-1.64, 1.64]) {
    roller(drum, 0.65, 0.12, [0, 0, z], graphite);
    roller(drum, 0.17, 0.4, [0, 0, z], silver);
  }
  // Circumferential hairlines and metal endcaps make the OPC coating legible.
  for (const z of [-1.42, 1.42]) roller(drum, 0.645, 0.015, [0, 0, z], silver);
  const charge = roller(base, 0.16, 3.15, [-1.16, 1.92, 0], rubber);
  const developer = roller(base, 0.24, 3.15, [0.16, 1.56, 0], graphite);
  const transfer = roller(base, 0.2, 3.15, [-0.65, 0.39, 0], rubber);
  for (const cylinder of [charge, developer, transfer])
    for (const z of [-1.65, 1.65]) roller(cylinder, 0.075, 0.18, [0, 0, z], silver);
  const toner = new THREE.Group();
  base.add(toner);
  box(toner, [1.05, 0.8, 3.45], [0.72, 2.02, 0], graphite, 0.09);
  box(toner, [0.82, 0.05, 3.17], [0.72, 2.45, 0], black);
  for (let z = -1.3; z <= 1.3; z += 0.18)
    box(toner, [0.72, 0.025, 0.026], [0.72, 2.49, z], rubber, 0.006);
  box(toner, [0.42, 0.22, 0.08], [0.72, 2.05, 1.78], blue);
  box(toner, [0.28, 0.13, 0.008], [0.72, 2.08, 1.827], silver, 0.005);
  const fuserTop = roller(base, 0.28, 3.05, [2.14, 0.955, 0], copper);
  const fuserBottom = roller(base, 0.25, 3.05, [2.14, 0.38, 0], rubber);
  roller(base, 0.1, 3.25, [2.14, 0.955, 0], amber);
  for (const z of [-1.7, 1.7]) {
    box(base, [0.72, 1.12, 0.16], [2.14, 0.75, z], graphite, 0.05);
    roller(base, 0.095, 0.21, [2.14, 0.955, z], silver);
    roller(base, 0.08, 0.21, [2.14, 0.38, z], silver);
  }
  const fuserGuard = new THREE.Group();
  root.add(fuserGuard);
  box(fuserGuard, [1.05, 0.1, 3.55], [2.14, 1.47, 0], ivory, 0.04);
  for (let z = -1.35; z <= 1.35; z += 0.18)
    box(fuserGuard, [0.72, 0.012, 0.04], [2.14, 1.528, z], black, 0.008);
  // Laser scanner: housing, rotating polygon mirror, focusing lens, beam.
  const scanner = new THREE.Group();
  root.add(scanner);
  box(scanner, [2.18, 0.21, 3.18], [-1.86, 2.61, 0], graphite, 0.05);
  box(scanner, [1.96, 0.04, 2.98], [-1.86, 2.74, 0], silver, 0.01);
  for (const z of [-1.37, 1.37])
    for (const x of [-2.72, -1.0]) screw(scanner, [x, 2.79, z], graphite);
  const polygon = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.16, 6), silver);
  polygon.position.set(-1.85, 2.86, 0);
  scanner.add(polygon);
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.23, 32),
    material('#3883a4', 0.4, 0.08),
  );
  lens.rotation.z = Math.PI / 2;
  lens.position.set(-2.57, 2.86, 0);
  scanner.add(lens);
  box(scanner, [0.4, 0.23, 0.37], [-2.8, 2.86, 0], graphite);
  const beamMaterial = new THREE.MeshBasicMaterial({
    color: '#ff4b24',
    transparent: true,
    opacity: 0.8,
  });
  const beam = new THREE.Group();
  root.add(beam);
  tube(
    beam,
    [
      [-2.65, 2.88, 0],
      [-1.85, 2.88, 0],
      [-0.62, 2.9, 0],
      [-0.62, 1.935, 0],
    ],
    0.013,
    beamMaterial,
  );
  const beamPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 0.95),
    new THREE.MeshBasicMaterial({
      color: '#ff5d34',
      transparent: true,
      opacity: 0.055,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  beamPlane.rotation.y = Math.PI / 2;
  beamPlane.position.set(-0.62, 2.42, 0);
  beam.add(beamPlane);
  box(base, [0.075, 0.45, 3.2], [-1.29, 1.17, 0], silver, 0.01).rotation.z = -0.55;
  box(base, [0.44, 0.24, 3.25], [-1.65, 1.0, 0], graphite, 0.04);
  // Exposed transmission on the front service side.
  const gears: THREE.Mesh[] = [];
  [
    [-0.65, 1.29, 0.39, 22],
    [-1.18, 1.89, 0.21, 16],
    [0.13, 1.54, 0.28, 20],
    [0.62, 0.86, 0.29, 20],
    [1.22, 0.96, 0.28, 18],
    [2.14, 0.95, 0.28, 18],
    [-2.1, 0.7, 0.19, 14],
  ].forEach(([x, y, r, n], i) => {
    gears.push(gear(base, r, n, [x, y, 1.92], i === 0 ? ivory : silver, 0.1));
    roller(base, 0.055, 0.25, [x, y, 1.97], graphite);
  });
  tube(
    base,
    [
      [0.67, 0.85, 1.8],
      [1.0, 0.5, 1.8],
      [2.14, 0.55, 1.8],
      [2.43, 0.94, 1.8],
      [2.14, 1.29, 1.8],
      [1.05, 1.3, 1.8],
      [0.67, 0.85, 1.8],
    ],
    0.045,
    rubber,
  );
  const motor = roller(base, 0.38, 0.65, [1.17, 0.7, -1.72], silver);
  box(motor, [0.42, 0.4, 0.06], [0, 0, -0.4], graphite);
  // Circuit board, components, fan and cable harness are visible through the opened housing.
  const pcb = new THREE.Group();
  root.add(pcb);
  box(pcb, [1.65, 0.08, 2.98], [-2.65, 0.89, -0.05], material('#163f38', 0.25, 0.45));
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 4; j++)
      box(pcb, [0.12, 0.005, 0.014], [-3.25 + i * 0.25, 0.935, -1.23 + j * 0.68], copper, 0);
  for (let i = 0; i < 8; i++) {
    box(
      pcb,
      [0.24, 0.08, 0.2],
      [-3.15 + (i % 3) * 0.37, 0.98, -1 + Math.floor(i / 3) * 0.56],
      black,
      0.012,
    );
    for (let j = 0; j < 4; j++)
      box(
        pcb,
        [0.025, 0.02, 0.3],
        [-3.22 + (i % 3) * 0.37 + j * 0.045, 0.956, -1 + Math.floor(i / 3) * 0.56],
        silver,
        0,
      );
  }
  for (let i = 0; i < 4; i++) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.3, 16), graphite);
    cap.position.set(-2.15, 1.05, -0.95 + i * 0.48);
    pcb.add(cap);
  }
  tube(
    base,
    [
      [-3.05, 1.12, 1.42],
      [-3.3, 1.22, 1.6],
      [-3.33, 1.4, -1.7],
      [-1.5, 1.5, -1.83],
      [1.16, 0.75, -1.85],
    ],
    0.025,
    material('#b96629'),
  );
  tube(
    base,
    [
      [-3.05, 1.08, 1.5],
      [-3.4, 1.18, 1.7],
      [-3.43, 1.35, -1.8],
      [-1.5, 1.42, -1.88],
    ],
    0.025,
    blue,
  );
  const back = new THREE.Group();
  root.add(back);
  box(back, [7.2, 2.4, 0.13], [0, 1.4, -2.05], ivory, 0.06);
  for (let x = -3; x <= -1; x += 0.15)
    box(back, [0.055, 0.85, 0.014], [x, 1.55, -2.124], graphite, 0.01);
  box(back, [0.34, 0.23, 0.04], [2.9, 0.67, -2.14], black);
  box(back, [0.19, 0.19, 0.04], [2.38, 0.67, -2.14], silver);
  const shell = new THREE.Group();
  root.add(shell);
  box(shell, [7.2, 0.25, 4.18], [0, 3.02, 0], ivory, 0.11);
  box(shell, [4.2, 0.045, 2.72], [0.2, 3.167, 0.12], graphite, 0.09);
  box(shell, [3.8, 0.025, 2.22], [0.2, 3.197, 0.3], material('#394148', 0.1, 0.53), 0.08);
  for (let x = -1.35; x <= 1.7; x += 0.28)
    box(shell, [0.028, 0.035, 1.8], [x, 3.223, 0.3], black, 0.012);
  box(shell, [1.2, 0.065, 0.45], [-2.25, 3.19, 1.26], graphite, 0.04);
  box(shell, [0.67, 0.014, 0.27], [-2.36, 3.228, 1.26], material('#445857', 0.3, 0.23), 0.018);
  box(shell, [0.15, 0.014, 0.15], [-1.78, 3.235, 1.26], material('#39826b'), 0.04);
  const front = new THREE.Group();
  root.add(front);
  box(front, [7.2, 2.4, 0.18], [0, 1.55, 2.02], ivory, 0.08);
  box(front, [2.35, 0.15, 0.025], [-1.75, 2.08, 2.124], graphite, 0.035);
  box(front, [0.62, 0.08, 0.025], [2.53, 2.4, 2.129], blue, 0.015);
  const side = new THREE.Group();
  root.add(side);
  for (const x of [-3.6, 3.6]) box(side, [0.16, 2.4, 3.92], [x, 1.5, 0], ivory, 0.05);
  const paper = new THREE.Group();
  root.add(paper);
  box(paper, [1.78, 0.018, 2.42], [0, 0, 0], white, 0.008);
  const printPixels: THREE.Mesh[] = [];
  for (let i = 0; i < 64; i++)
    printPixels.push(
      box(
        paper,
        [0.15, 0.004, 0.18],
        [(Math.floor(i / 8) - 3.5) * 0.18, 0.014, ((i % 8) - 3.5) * 0.22],
        black,
        0,
      ),
    );
  const tonerPixels: THREE.Mesh[] = [];
  for (let i = 0; i < 64; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), black);
    base.add(m);
    tonerPixels.push(m);
  }
  const trackingMaterial = new THREE.MeshStandardMaterial({
    color: '#ff692b',
    emissive: '#f04a12',
    emissiveIntensity: 0.7,
    roughness: 0.28,
  });
  const pixel = new THREE.Mesh(new THREE.SphereGeometry(0.065, 24, 16), trackingMaterial);
  root.add(pixel);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 40), trackingMaterial);
  root.add(halo);
  const charges = new THREE.Group();
  root.add(charges);
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 14; col++) {
      const a = (col / 14) * Math.PI * 2;
      const mark = box(
        charges,
        [0.065, 0.012, 0.015],
        [-0.65 + Math.cos(a) * 0.66, 1.29 + Math.sin(a) * 0.66, (row - 2.5) * 0.45],
        material('#c0eee0'),
        0,
      );
      mark.rotation.z = a + Math.PI / 2;
    }
  const positions = [
    new THREE.Vector3(-1.11, 1.77, 1.1),
    new THREE.Vector3(-0.64, 1.96, 1.1),
    new THREE.Vector3(-0.02, 1.47, 1.1),
    new THREE.Vector3(-0.65, 0.64, 1.1),
    new THREE.Vector3(2.14, 0.665, 1.1),
    new THREE.Vector3(-1.3, 1.3, 1.1),
  ];
  const open = scalarTransition(read().exploded ? 1 : 0, 1.15);
  const covers = [shell, front, side].map(fadingCover);
  let lastView = read().view,
    lastFocus = false,
    lastPhase = -1,
    transition = 1;
  let overview: THREE.Vector3 | null = null;
  const overviewTarget = controls.target.clone();
  const destination = new THREE.Vector3(),
    destinationTarget = new THREE.Vector3(),
    departure = new THREE.Vector3(),
    departureTarget = new THREE.Vector3();
  const interrupt = () => {
    transition = 1;
  };
  controls.addEventListener('start', interrupt);
  return {
    update(dt, elapsed) {
      const state = read(),
        phase = Math.min(5, Math.floor(state.progress)),
        frac = state.progress - phase;
      const openness = open(state.exploded ? 1 : 0, dt, reducedMotion.matches);
      shell.position.y = openness * 1.25;
      shell.rotation.z = openness * -0.045;
      front.position.z = openness * 1.8;
      front.position.y = -openness * 0.1;
      covers.forEach((cover, i) =>
        cover.opacity(1 - THREE.MathUtils.smoothstep(openness, i === 2 ? 0.12 : 0.3, 0.97)),
      );
      back.position.z = -openness * 0.2;
      scanner.position.y = openness * 0.22;
      fuserGuard.position.y = openness * 0.35;
      drum.rotation.z = state.progress * 0.8;
      charge.rotation.z = -state.progress * 3;
      developer.rotation.z = -state.progress * 2;
      gears.forEach((g, i) => (g.rotation.z = state.progress * (i % 2 ? -2 : 2)));
      polygon.rotation.y = elapsed * 2;
      fuserTop.rotation.z = state.progress;
      fuserBottom.rotation.z = -state.progress;
      beam.visible = openness > 0.5 && phase === 1;
      beam.position.z = Math.sin(elapsed * 12) * 1.1;
      charges.visible = state.charges && openness > 0.5 && phase < 3;
      charges.children.forEach((m, i) => {
        m.visible = !(phase >= 1 && i % 14 >= 2 && i % 14 <= 5);
      });
      paper.position.set(
        phase < 2
          ? -2.55
          : phase === 2
            ? -2.55 + frac
            : phase === 3
              ? -1.55 + frac * 1.8
              : phase === 4
                ? 0.25 + frac * 2.9
                : 3.15,
        0.646,
        0,
      );
      printPixels.forEach((m, i) => {
        m.visible =
          state.pattern[Math.floor(i / 8)]?.[i % 8] === '1' &&
          phase >= 3 &&
          m.position.x + paper.position.x >= -0.65;
        m.material = i === state.selected ? trackingMaterial : black;
      });
      tonerPixels.forEach((m, i) => {
        const a =
          -Math.PI / 2 + (Math.floor(i / 8) - 3.5) * 0.06 + Math.max(0, 3 - state.progress) * 1.2;
        m.position.set(
          -0.65 + Math.cos(a) * 0.652,
          1.29 + Math.sin(a) * 0.652,
          ((i % 8) - 3.5) * 0.22,
        );
        m.visible =
          phase >= 2 &&
          phase < 4 &&
          !printPixels[i].visible &&
          state.pattern[Math.floor(i / 8)]?.[i % 8] === '1';
        m.material = i === state.selected ? trackingMaterial : black;
      });
      pixel.position.copy(positions[phase]);
      if (phase < 3) pixel.position.lerp(positions[phase + 1], frac);
      if (phase === 2 || phase === 3) pixel.position.copy(tonerPixels[state.selected].position);
      if (phase >= 3 && printPixels[state.selected].visible)
        pixel.position.copy(printPixels[state.selected].position).add(paper.position);
      pixel.position.z = ((state.selected % 8) - 3.5) * 0.22;
      pixel.visible = openness > 0.7;
      halo.position.copy(pixel.position);
      halo.visible = pixel.visible;
      halo.scale.setScalar(1 + Math.sin(elapsed * 3) * 0.08);
      halo.lookAt(camera.position);
      if (!overview) overview = camera.position.clone();
      if (
        state.view !== lastView ||
        !!state.focus !== lastFocus ||
        (state.focus && phase !== lastPhase)
      ) {
        lastView = state.view;
        lastFocus = !!state.focus;
        lastPhase = phase;
        transition = 0;
        departure.copy(camera.position);
        departureTarget.copy(controls.target);
        destinationTarget.copy(state.focus ? positions[phase] : overviewTarget);
        const direction = new THREE.Vector3(
          ...((state.view === 'top' ? [0.1, 14, 0.9] : [8, 6.5, 10]) as [number, number, number]),
        ).normalize();
        const distance = state.focus
          ? Math.max(5.5, 5.5 / camera.aspect)
          : overview.distanceTo(overviewTarget);
        destination.copy(destinationTarget).addScaledVector(direction, distance);
      }
      if (transition < 1) {
        transition = reducedMotion.matches ? 1 : Math.min(1, transition + dt / 1.05);
        const amount = softEase(transition);
        controls.target.lerpVectors(departureTarget, destinationTarget, amount);
        camera.position.lerpVectors(departure, destination, amount);
      }
    },
    dispose() {
      controls.removeEventListener('start', interrupt);
      covers.forEach((cover) => cover.dispose());
    },
  };
}
