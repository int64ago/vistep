import { useRef } from 'react';
import * as THREE from 'three';
import Studio, { type StudioContext } from './Studio';
import { material, box } from './parts';
import { useShowcase } from '../lab/Showcase';
import { t } from '../../i18n';
import {
  ZIP,
  ZIP_GUIDE,
  zipperPath,
  zipperTransform,
  zipperHeadOutline,
  zipperIntersection,
  zipRect,
  zipperCamera,
  type ZipperPose,
  type ZipPoint,
} from '../../models/zipper';
import { ZipperDiagram } from './ZipperDiagram';
function shape(points: ZipPoint[]) {
  const s = new THREE.Shape();
  points.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return s;
}
function extrude(points: ZipPoint[], depth: number) {
  return new THREE.ExtrudeGeometry(shape(points), {
    depth,
    bevelEnabled: false,
    curveSegments: 40,
  });
}
function rootSection(x0 = -0.13, x1 = 0.34, h = 0.12) {
  const r = ZIP.boreRadius,
    gap = 0.027,
    angle = Math.PI - Math.asin(gap / r),
    points: ZipPoint[] = [
      [x0, -h],
      [x1, -h],
      [x1, h],
      [x0, h],
      [x0, gap],
      [r * Math.cos(angle), gap],
    ];
  for (let i = 1; i <= 64; i++) {
    const a = angle - (2 * angle * i) / 64;
    points.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  points.push([x0, -gap]);
  return points;
}
export default function ZipperStudio({
  pose,
  focus,
  progress,
}: {
  pose: ZipperPose;
  focus: string;
  progress: number;
}) {
  const film = useShowcase(),
    live = useRef({ pose, focus, progress, watch: film.watch });
  live.current = { pose, focus, progress, watch: film.watch };
  const create = ({ root, camera, controls }: StudioContext) => {
    const assembly = new THREE.Group();
    assembly.position.y = 2;
    root.add(assembly);
    const leftMat = material('#a4936f', 0.1, 0.55),
      rightMat = material('#8f632c', 0.18, 0.48),
      markedMat = material('#174f49', 0.15, 0.48),
      clothMat = material('#263e49', 0, 0.97),
      metal = material('#9eaeb0', 0.82, 0.29),
      dark = material('#526d74', 0.58, 0.35),
      edge = material('#829594', 0, 0.93);
    clothMat.side = THREE.DoubleSide;
    const mesh = (
      g: THREE.BufferGeometry,
      m: THREE.Material,
      parent: THREE.Object3D = assembly,
      x = 0,
      y = 0,
      z = 0,
    ) => {
      const a = new THREE.Mesh(g, m);
      a.position.set(x, y, z);
      a.castShadow = true;
      a.receiveShadow = true;
      parent.add(a);
      return a;
    };
    const rootGeo = extrude(rootSection(), 0.46),
      neckGeo = extrude(zipRect(0.34, 0.88, -0.12, 0.12), 0.24),
      headGeo = extrude(zipperHeadOutline(), ZIP.toothHalfDepth - ZIP.grooveHalfHeight),
      webGeo = extrude(
        zipperIntersection(zipperHeadOutline(), zipRect(0.88, 0.93, -0.4, 0.4)),
        2 * ZIP.grooveHalfHeight,
      ),
      wingGeo = extrude(zipRect(0.68, 0.8, -0.24, 0.24), 2 * ZIP.wingHalfDepth);
    const teeth = pose.teeth.map((t) => {
      const group = new THREE.Group();
      assembly.add(group);
      const m = t.side === -1 ? (t.index === ZIP.marked ? markedMat : leftMat) : rightMat;
      const mount = mesh(rootGeo, m, group, 0, 0.23, 0);
      mount.rotation.x = Math.PI / 2;
      mesh(neckGeo, m, group, 0, 0, -0.12);
      mesh(headGeo, m, group, 0, 0, -0.12);
      const lip = mesh(headGeo, m, group, 0, 0, 0.04);
      mesh(webGeo, m, group, 0, 0, -0.04);
      mesh(wingGeo, m, group, 0, 0, -0.028);
      return { group, lip };
    });
    const sides = ([-1, 1] as const).map((side) => {
      const stations = 220,
        verts = new Float32Array((stations + 1) * 4 * 3),
        indices: number[] = [];
      for (let i = 0; i < stations; i++) {
        const a = i * 4,
          b = a + 4;
        for (const [j, k] of [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 0],
        ])
          indices.push(a + j, b + j, a + k, b + j, b + k, a + k);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(verts, 3).setUsage(THREE.DynamicDrawUsage),
      );
      geometry.setIndex(indices);
      const tape = mesh(geometry, clothMat);
      const rings = 12,
        beadVerts = new Float32Array((stations + 1) * rings * 3),
        beadIndices: number[] = [];
      for (let i = 0; i < stations; i++)
        for (let j = 0; j < rings; j++) {
          const a = i * rings + j,
            b = i * rings + ((j + 1) % rings);
          beadIndices.push(a, a + rings, b, a + rings, b + rings, b);
        }
      const beadG = new THREE.BufferGeometry();
      beadG.setAttribute(
        'position',
        new THREE.BufferAttribute(beadVerts, 3).setUsage(THREE.DynamicDrawUsage),
      );
      beadG.setIndex(beadIndices);
      mesh(beadG, edge);
      const seams = new Float32Array(360 * 2 * 3),
        seamG = new THREE.BufferGeometry();
      seamG.setAttribute(
        'position',
        new THREE.BufferAttribute(seams, 3).setUsage(THREE.DynamicDrawUsage),
      );
      const stitching = new THREE.LineSegments(
        seamG,
        new THREE.LineBasicMaterial({ color: '#a3b2ab', transparent: true, opacity: 0.42 }),
      );
      assembly.add(stitching);
      return { side, stations, geometry, verts, tape, beadG, beadVerts, rings, seams, seamG };
    });
    const slider = new THREE.Group();
    assembly.add(slider);
    mesh(
      extrude(ZIP_GUIDE.outline, ZIP.plateThickness),
      metal,
      slider,
      0,
      0,
      -ZIP.guideHalfHeight - ZIP.plateThickness,
    );
    // Upper plate is deliberately window-cut; a perimeter and crown bridge remain connected.
    const roof = shape(ZIP_GUIDE.outline),
      window = new THREE.Path();
    const cut = ZIP_GUIDE.sections.slice(3, -6);
    const windowPoints: ZipPoint[] = [
      ...cut.map((v) => [-v.outer + 0.04, v.y] as ZipPoint),
      ...cut
        .slice()
        .reverse()
        .map((v) => [v.outer - 0.04, v.y] as ZipPoint),
    ];
    windowPoints.forEach(([x, y], i) => (i ? window.lineTo(x, y) : window.moveTo(x, y)));
    window.closePath();
    roof.holes.push(window);
    mesh(
      new THREE.ExtrudeGeometry(roof, { depth: ZIP.plateThickness, bevelEnabled: false }),
      metal,
      slider,
      0,
      0,
      ZIP.guideHalfHeight,
    );
    for (const side of [-1, 1]) {
      const rail: ZipPoint[] = [
        ...ZIP_GUIDE.sections.map((v) => [side * v.outer, v.y] as ZipPoint),
        ...ZIP_GUIDE.sections
          .slice()
          .reverse()
          .map((v) => [side * (v.outer + ZIP.railThickness), v.y] as ZipPoint),
      ];
      mesh(extrude(rail, ZIP.guideHalfHeight - 0.035), metal, slider, 0, 0, 0.035);
      mesh(extrude(rail, ZIP.guideHalfHeight - 0.035), metal, slider, 0, 0, -ZIP.guideHalfHeight);
    }
    mesh(
      extrude(ZIP_GUIDE.diamond, 2 * ZIP.guideHalfHeight),
      dark,
      slider,
      0,
      0,
      -ZIP.guideHalfHeight,
    );
    // Two crown ears and a transverse pin carry the pull tab.
    const ear = new THREE.Shape();
    ear.absarc(0, 0, 0.115, 0, 2 * Math.PI, false);
    const bore = new THREE.Path();
    bore.absarc(0, 0, 0.073, 0, 2 * Math.PI, true);
    ear.holes.push(bore);
    for (const x of [-0.22, 0.15]) {
      const o = mesh(
        new THREE.ExtrudeGeometry(ear, { depth: 0.07, bevelEnabled: false }),
        metal,
        slider,
        x,
        2.04,
        0.34,
      );
      o.rotation.y = Math.PI / 2;
      box(slider, [0.07, 0.14, 0.115], [x + 0.035, 2.04, 0.24], metal, 0.014);
    }
    const pin = mesh(
      new THREE.CylinderGeometry(0.068, 0.068, 0.59, 24),
      dark,
      slider,
      0,
      2.04,
      0.34,
    );
    pin.rotation.z = Math.PI / 2;
    const pull = new THREE.Group();
    pull.position.set(0, 2.04, 0.34);
    pull.rotation.x = -0.35;
    slider.add(pull);
    const hingeShape = new THREE.Shape();
    hingeShape.absarc(0, 0, 0.12, 0, 2 * Math.PI, false);
    const pinBore = new THREE.Path();
    pinBore.absarc(0, 0, 0.069, 0, 2 * Math.PI, true);
    hingeShape.holes.push(pinBore);
    const hinge = mesh(
      new THREE.ExtrudeGeometry(hingeShape, { depth: 0.3, bevelEnabled: false }),
      metal,
      pull,
      -0.15,
      0,
      0,
    );
    hinge.rotation.y = Math.PI / 2;
    const handle = shape([
        [-0.16, -0.1],
        [0.16, -0.1],
        [0.23, -0.35],
        [0.23, -1.13],
        [0.15, -1.25],
        [-0.15, -1.25],
        [-0.23, -1.13],
        [-0.23, -0.35],
      ]),
      hole = new THREE.Path();
    hole.moveTo(-0.1, -0.4);
    hole.lineTo(0.1, -0.4);
    hole.lineTo(0.1, -1.08);
    hole.lineTo(-0.1, -1.08);
    hole.closePath();
    handle.holes.push(hole);
    mesh(
      new THREE.ExtrudeGeometry(handle, { depth: 0.045, bevelEnabled: false }),
      metal,
      pull,
      0,
      0,
      -0.0225,
    );
    // Closed-end bottom bridge and bored top stops wrap the same continuous bead.
    box(assembly, [2.2, 2 * ZIP.bottomStopHalfHeight, 0.28], [0, ZIP.bottomStopY, 0], metal, 0.055);
    const stops = ([-1, 1] as const).map((side) => {
      const g = new THREE.Group();
      assembly.add(g);
      const s = mesh(extrude(rootSection(-0.17, 0.43, 0.225), 0.4), metal, g, 0, 0.2, 0);
      s.rotation.x = Math.PI / 2;
      return { side, group: g };
    });
    let oldFocus = '',
      oldAspect = 0,
      manual = false;
    const lastTarget = new THREE.Vector3();
    return {
      update: () => {
        const s = live.current,
          p = s.pose;
        for (let i = 0; i < teeth.length; i++) {
          const tooth = p.teeth[i],
            o = teeth[i];
          o.group.position.set(tooth.root[0], tooth.root[1], 0);
          o.group.rotation.z = -tooth.side * tooth.angle;
          o.group.scale.x = -tooth.side;
          o.lip.visible = !(s.focus === 'tooth' && tooth.side === -1 && tooth.index === ZIP.marked);
        }
        slider.position.y = p.slider;
        for (const stop of stops) {
          const a = zipperPath(ZIP.stopS - p.slider),
            point = zipperTransform([0, 0], ZIP.stopS, p.slider, stop.side);
          stop.group.position.set(point[0], point[1], 0);
          stop.group.rotation.z = -stop.side * a.angle;
          stop.group.scale.x = -stop.side;
        }
        for (const strip of sides) {
          const { side, stations, verts, geometry, beadG, beadVerts, rings, seams, seamG } = strip;
          for (let i = 0; i <= stations; i++) {
            const coordinate = -1.85 + ((ZIP.count + 3.3) * i) / stations,
              a = zipperPath(coordinate - p.slider);
            for (let j = 0; j < 4; j++) {
              const localX = j === 0 || j === 3 ? 0 : -ZIP.tapeWidth,
                point = zipperTransform([localX, 0], coordinate, p.slider, side),
                k = (i * 4 + j) * 3;
              verts[k] = point[0];
              verts[k + 1] = point[1];
              verts[k + 2] = j < 2 ? 0.018 : -0.018;
            }
            const centre = zipperTransform([0, 0], coordinate, p.slider, side);
            for (let j = 0; j < rings; j++) {
              const angle = (j * 2 * Math.PI) / rings,
                radial = ZIP.beadRadius * Math.cos(angle),
                k = (i * rings + j) * 3;
              beadVerts[k] = centre[0] - side * Math.cos(a.angle) * radial;
              beadVerts[k + 1] = centre[1] + Math.sin(a.angle) * radial;
              beadVerts[k + 2] = ZIP.beadRadius * Math.sin(angle);
            }
          }
          for (let i = 0; i < 360; i++) {
            const coordinate = -1.8 + ((ZIP.count + 3.2) * i) / 360;
            for (let j = 0; j < 2; j++) {
              const point = zipperTransform(
                  [-0.54 + (j ? -0.03 : 0.03), 0],
                  coordinate + j * 0.02,
                  p.slider,
                  side,
                ),
                k = (i * 2 + j) * 3;
              seams[k] = point[0];
              seams[k + 1] = point[1];
              seams[k + 2] = 0.021;
            }
          }
          geometry.attributes.position.needsUpdate = true;
          geometry.computeVertexNormals();
          geometry.computeBoundingSphere();
          beadG.attributes.position.needsUpdate = true;
          beadG.computeVertexNormals();
          beadG.computeBoundingSphere();
          seamG.attributes.position.needsUpdate = true;
          seamG.computeBoundingSphere();
        }
        const changed = oldFocus !== s.focus || Math.abs(oldAspect - camera.aspect) > 0.001;
        const fit = zipperCamera(p, s.focus, camera.aspect, s.progress),
          goal = new THREE.Vector3(...fit.target).add(new THREE.Vector3(0, 2, 0));
        if (s.watch || !manual || changed) {
          controls.target.copy(goal);
          camera.position
            .copy(goal)
            .addScaledVector(new THREE.Vector3(...fit.direction), fit.distance);
          camera.lookAt(controls.target);
          oldFocus = s.focus;
          oldAspect = camera.aspect;
          manual = true;
        } else {
          const delta = goal.clone().sub(lastTarget);
          controls.target.add(delta);
          camera.position.add(delta);
        }
        lastTarget.copy(goal);
      },
    };
  };
  return (
    <Studio
      create={create}
      label={t('注塑蘑菇头拉链三维剖面')}
      fallback={<ZipperDiagram pose={pose} focus={focus} />}
      className="zipper-studio"
      exposure={0.82}
      span={8}
      fitHeight={17}
      cameraPosition={[2, 8, 20]}
      target={[0, 8, 0]}
    />
  );
}
