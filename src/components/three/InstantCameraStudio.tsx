import { useRef } from 'react';
import * as THREE from 'three';
import { t } from '../../i18n';
import {
  IC,
  IC_CAMERA_GEOMETRY as hardware,
  icCameraFrame,
  icImagePixels,
  type IcShot,
} from '../../models/instant-camera';
import { useShowcase } from '../lab/Showcase';
import Studio, { type StudioContext } from './Studio';
import { box, material, roller } from './parts';
import InstantCameraDiagram from './InstantCameraDiagram';
const S = 1 / 50;
function line(parent: THREE.Object3D, points: THREE.Vector3[], color: string) {
  const group = new THREE.Group();
  group.name = 'chief-ray';
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92 });
  for (let i = 1; i < points.length; i++) {
    const direction = points[i].clone().sub(points[i - 1]);
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, direction.length(), 8),
      mat,
    );
    tube.position
      .copy(points[i])
      .add(points[i - 1])
      .multiplyScalar(0.5);
    tube.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    group.add(tube);
  }
  parent.add(group);
  return group;
}
export default function InstantCameraStudio({ shot, width }: { shot: IcShot; width: number }) {
  const state = useRef(shot),
    film = useShowcase(),
    watch = useRef(film.watch);
  state.current = shot;
  watch.current = film.watch;
  const create = ({ root, camera, controls }: StudioContext) => {
    const shell = material('#e2d8c0', 0.12, 0.48),
      black = material('#30403a', 0.18, 0.48),
      steel = material('#b6bcb0', 0.86, 0.23),
      amber = material('#bda574', 0.62, 0.37),
      paper = material('#f6efdd', 0.05, 0.62);
    // Manufactured shell is opened on its near side; lens, mirror, cassette and nip remain connected.
    // The aperture and nip are genuine openings between the retained solids.
    for (const solid of [...hardware.shell, ...hardware.frontFrame])
      box(
        root,
        solid.size.map((v) => v * S),
        solid.at.map((v) => v * S),
        shell,
        solid.radius * S,
      );
    // Optical barrel along the x axis. The plane film exposure follows the folded chief ray.
    function cutFaces(
      x: number,
      inner: number,
      outer: number,
      length: number,
      mat: THREE.Material,
      name: string,
    ) {
      for (const sign of [-1, 1]) {
        // Half-Lathe does not cap its angular limits. This genuine cut face
        // closes z=0 with an outward +z normal while leaving the pupil empty.
        const cap = new THREE.Mesh(new THREE.PlaneGeometry(length * S, (outer - inner) * S), mat);
        cap.name = name;
        cap.position.set(x * S, (IC.lens.y + (sign * (inner + outer)) / 2) * S, 0);
        cap.castShadow = true;
        cap.receiveShadow = true;
        root.add(cap);
      }
    }
    for (const dimensions of hardware.barrels) {
      const x = dimensions.x * S,
        r = dimensions.radius * S,
        len = dimensions.length * S;
      const barrel = new THREE.Mesh(
        new THREE.LatheGeometry(
          [
            [r - hardware.wallThickness * S, -len / 2],
            [r, -len / 2],
            [r, len / 2],
            [r - hardware.wallThickness * S, len / 2],
            [r - hardware.wallThickness * S, -len / 2],
          ].map(([radius, y]) => new THREE.Vector2(radius, y)),
          48,
          Math.PI / 2,
          Math.PI,
        ),
        black,
      );
      barrel.name = 'optical-barrel';
      barrel.rotation.z = -Math.PI / 2;
      barrel.position.set(x, IC.lens.y * S, 0);
      root.add(barrel);
      cutFaces(
        dimensions.x,
        dimensions.radius - hardware.wallThickness,
        dimensions.radius,
        dimensions.length,
        black,
        'optical-barrel-cut',
      );
    }
    const flange = new THREE.Mesh(
      new THREE.LatheGeometry(
        [
          [hardware.mount.innerRadius * S, (-hardware.mount.length * S) / 2],
          [hardware.mount.outerRadius * S, (-hardware.mount.length * S) / 2],
          [hardware.mount.outerRadius * S, (hardware.mount.length * S) / 2],
          [hardware.mount.innerRadius * S, (hardware.mount.length * S) / 2],
          [hardware.mount.innerRadius * S, (-hardware.mount.length * S) / 2],
        ].map(([r, y]) => new THREE.Vector2(r, y)),
        48,
        Math.PI / 2,
        Math.PI,
      ),
      shell,
    );
    flange.name = 'lens-mount';
    flange.rotation.z = -Math.PI / 2;
    flange.position.set(hardware.mount.x * S, IC.lens.y * S, 0);
    root.add(flange);
    cutFaces(
      hardware.mount.x,
      hardware.mount.innerRadius,
      hardware.mount.outerRadius,
      hardware.mount.length,
      shell,
      'lens-mount-cut',
    );
    const glass = new THREE.MeshPhysicalMaterial({
      color: '#a8c9c4',
      metalness: 0.05,
      roughness: 0.06,
      transparent: true,
      opacity: 0.62,
      transmission: 0.35,
      thickness: 0.09,
    });
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(
        hardware.lens.frontRadius * S,
        hardware.lens.backRadius * S,
        hardware.lens.length * S,
        48,
      ),
      glass,
    );
    lens.rotation.z = -Math.PI / 2;
    lens.position.set(hardware.lens.x * S, IC.lens.y * S, 0);
    root.add(lens);
    const mirror = box(
      root,
      hardware.mirrorSize.map((v) => v * S),
      [IC.mirror.x * S, IC.mirror.y * S, 0],
      steel,
      0.015,
    );
    mirror.rotation.z = Math.PI / 4;
    box(
      root,
      hardware.mirrorSupport.size.map((v) => v * S),
      hardware.mirrorSupport.at.map((v) => v * S),
      black,
      hardware.mirrorSupport.radius * S,
    );
    box(
      root,
      hardware.cassette.size.map((v) => v * S),
      hardware.cassette.at.map((v) => v * S),
      black,
      hardware.cassette.radius * S,
    );
    for (let i = 0; i < 4; i++)
      box(
        root,
        [IC.length * S, 0.009, IC.width * S],
        [(IC.initialLead - IC.length / 2) * S, (IC.plane - 1.2 - i * 0.6) * S, 0],
        paper,
        0.004,
      );
    box(root, [0.48, 0.025, 0.15], [-2.32, (IC.plane - 2) * S, 0.74], steel, 0.007);
    const picker = box(root, [0.035, 0.08, 0.19], [-2.44, IC.plane * S, 0.74], amber, 0.004);
    const moving = new THREE.Group();
    root.add(moving);
    const sheet = box(
      moving,
      [IC.length * S, IC.thickness * S, IC.width * S],
      [0, 0, 0],
      paper,
      0.001,
    );
    const negative = box(
      moving,
      [IC.length * S, 0.002, IC.width * S],
      [0, (-IC.thickness * S) / 2 - 0.002, 0],
      black,
      0,
    );
    // Extrude the finite, compressed cross-section from the same nip model as SVG.
    const podGeometry = new THREE.BufferGeometry();
    const podPositions = new Float32Array(state.current.transport.podProfile.length * 12);
    const podIndices: number[] = [];
    for (let i = 0; i < state.current.transport.podProfile.length - 1; i++) {
      const a = i * 4,
        b = a + 4;
      podIndices.push(
        a,
        b,
        b + 1,
        a,
        b + 1,
        a + 1,
        a + 2,
        a + 3,
        b + 3,
        a + 2,
        b + 3,
        b + 2,
        a + 1,
        b + 1,
        b + 3,
        a + 1,
        b + 3,
        a + 3,
        a,
        a + 2,
        b + 2,
        a,
        b + 2,
        b,
      );
    }
    const end = (state.current.transport.podProfile.length - 1) * 4;
    podIndices.push(0, 1, 3, 0, 3, 2, end, end + 2, end + 3, end, end + 3, end + 1);
    podGeometry.setAttribute('position', new THREE.BufferAttribute(podPositions, 3));
    podGeometry.setIndex(podIndices);
    const pod = new THREE.Mesh(podGeometry, amber);
    moving.add(pod);
    const data = icImagePixels(state.current.feedMm, state.current.seconds, state.current.dirty);
    const texture = new THREE.DataTexture(data, 48, 48, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    const imageMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.48,
      metalness: 0.04,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    // Plane local horizontal axis maps portrait width to z; image top is the trailing edge.
    const imageGeometry = new THREE.BufferGeometry();
    const halfL = (IC.imageLength * S) / 2,
      halfW = (IC.imageWidth * S) / 2;
    imageGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [-halfL, 0, -halfW, -halfL, 0, halfW, halfL, 0, halfW, halfL, 0, -halfW],
        3,
      ),
    );
    imageGeometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
    imageGeometry.setIndex([0, 1, 2, 0, 2, 3]);
    imageGeometry.computeVertexNormals();
    const image = new THREE.Mesh(imageGeometry, imageMat);
    image.position.y = (IC.thickness * S) / 2;
    moving.add(image);
    const top = roller(
      root,
      IC.rollerRadius * S,
      (IC.width + hardware.rollerExtraWidth) * S,
      [0, (IC.plane + IC.rollerRadius + IC.thickness / 2) * S, 0],
      steel,
    );
    const bottom = roller(
      root,
      IC.rollerRadius * S,
      (IC.width + hardware.rollerExtraWidth) * S,
      [0, (IC.plane - IC.rollerRadius - IC.thickness / 2) * S, 0],
      steel,
    );
    for (const r of [top, bottom]) {
      box(
        r,
        [0.07, 0.015, (IC.width + hardware.rollerExtraWidth) * S],
        [0, IC.rollerRadius * S + 0.003, 0],
        black,
        0.004,
      );
      const axle = roller(
        r,
        hardware.axleRadius * S,
        (IC.width + hardware.axleExtraWidth) * S,
        [0, 0, 0],
        amber,
      );
      axle.rotation.z = 0;
    }
    roller(root, 0.1, 0.29, [0, bottom.position.y, -1.23], black);
    for (const bracket of hardware.rollerBrackets) {
      const z = bracket.at[2] * S;
      box(
        root,
        bracket.size.map((v) => v * S),
        bracket.at.map((v) => v * S),
        black,
        bracket.radius * S,
      );
      for (const y of [top.position.y, bottom.position.y])
        box(root, [0.15, 0.15, 0.17], [0, y, z + 0.02 * Math.sign(z)], steel, 0.025);
    }
    const dirt = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 12, 12),
      material('#8b583c', 0.05, 0.65),
    );
    top.add(dirt);
    const rays = line(
      root,
      [
        new THREE.Vector3(0.9, IC.lens.y * S, 0),
        new THREE.Vector3(IC.mirror.x * S, IC.mirror.y * S, 0),
        new THREE.Vector3(IC.mirror.x * S, IC.plane * S, 0),
      ],
      '#b67d2d',
    );
    const shutter = box(root, [0.02, 0.71, 0.75], [0.02, IC.lens.y * S, 0], black, 0);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: '#3c4740',
      roughness: 0.85,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const shield = box(root, [1, 0.009, IC.width * S], [0, (IC.plane + 4) * S, 0], shieldMat, 0);
    let last = '';
    let lastView: IcShot['view'] | undefined;
    const update = (dt: number, _elapsed: number, settle: boolean) => {
      const s = state.current,
        f = s.transport;
      picker.position.set(
        f.pickerX * S - 0.0175,
        (IC.plane + (f.pickerEngaged ? 0.025 : -2.1)) * S,
        0.74,
      );
      moving.position.set((f.lead - IC.length / 2) * S, IC.plane * S, 0);
      image.position.x = (IC.length / 2 - (IC.imageStart + IC.imageLength / 2)) * S;
      pod.position.x = (IC.length / 2 - IC.podCenter) * S;
      pod.position.y = (IC.thickness * S) / 2;
      f.podProfile.forEach(({ localX, height }, i) => {
        const x = localX * S,
          z = (IC.imageWidth * S) / 2,
          h = height * S;
        podPositions.set([x, 0, -z, x, 0, z, x, h, -z, x, h, z], i * 12);
      });
      podGeometry.attributes.position.needsUpdate = true;
      podGeometry.computeVertexNormals();
      top.rotation.z = f.topAngle;
      bottom.rotation.z = f.bottomAngle;
      dirt.visible = s.dirty;
      dirt.position.set(
        Math.cos(-Math.PI / 2 - (IC.dirtFirstU - IC.initialLead) / IC.rollerRadius) *
          (IC.rollerRadius + 0.3) *
          S,
        Math.sin(-Math.PI / 2 - (IC.dirtFirstU - IC.initialLead) / IC.rollerRadius) *
          (IC.rollerRadius + 0.3) *
          S,
        (IC.dirtV - IC.width / 2) * S,
      );
      rays.visible = s.shutterOpen;
      shutter.visible = !s.shutterOpen;
      shield.visible = s.lightShield && f.lead > 0;
      shield.scale.x = Math.max(0.001, Math.min(f.lead, IC.length) * S);
      shield.position.x = (Math.max(0, Math.min(f.lead, IC.length)) * S) / 2;
      const key = `${s.feedMm.toFixed(2)}:${s.seconds.toFixed(1)}:${s.dirty}`;
      if (key !== last) {
        texture.image.data.set(icImagePixels(s.feedMm, s.seconds, s.dirty));
        texture.needsUpdate = true;
        last = key;
      }
      if (watch.current || lastView !== s.view) {
        const framing = icCameraFrame(camera.aspect, s.view === 'rollers');
        const target = new THREE.Vector3(...(framing.target as [number, number, number]));
        const desired = new THREE.Vector3(...(framing.position as [number, number, number]));
        const a = settle || !watch.current ? 1 : 1 - Math.exp(-dt * 7);
        controls.target.lerp(target, a);
        camera.position.lerp(desired, a);
        camera.lookAt(controls.target);
      }
      lastView = s.view;
      sheet.visible = true;
      negative.visible = true;
    };
    update(0, 0, true);
    return { update, dispose: () => texture.dispose() };
  };
  return (
    <Studio
      create={create}
      className="instant-studio"
      label={t('积分式相纸相机切面：镜头、反射光路、同一张相纸、药囊与相切滚轮')}
      fallback={<InstantCameraDiagram shot={shot} width={width} />}
      cameraPosition={[5, 3.8, 7]}
      target={[-0.85, 1.04, 0]}
      span={6.95}
      fitHeight={3.45}
      exposure={1.1}
    />
  );
}
