import { useRef } from 'react';
import * as THREE from 'three';
import { t } from '../../i18n';
import { BRAKE, type brakeShot } from '../../models/brake';
import { useShowcase } from '../lab/Showcase';
import BrakeSection from '../lab/BrakeSection';
import Studio from './Studio';
import { box, material, roller, tube } from './parts';
type Shot = ReturnType<typeof brakeShot>;
const TAU = Math.PI * 2,
  scale = 0.025;
export default function BrakeStudio({ shot }: { shot: Shot }) {
  const demo = useShowcase(),
    live = useRef({ shot, demo });
  live.current = { shot, demo };
  return (
    <Studio
      cameraPosition={[5.5, 5, 9]}
      target={[0.2, 2.7, 0]}
      span={8.6}
      fitHeight={5.7}
      label={t('主缸通过连续油管连接对置活塞卡钳，刹车片从两侧夹住碟片')}
      fallback={
        <BrakeSection state={shot.state} view={shot.focus === 'master' ? 'master' : 'caliper'} />
      }
      create={({ root, camera, controls, scene }) => {
        scene.environmentIntensity = 0.8;
        const steel = material('#a7b4b6', 0.86, 0.25),
          black = material('#394345', 0.55, 0.38),
          red = material('#724638', 0.65, 0.31),
          lining = material('#514b41', 0.05, 0.82),
          ivory = material('#d3d4cb', 0.15, 0.6),
          fluid = material('#cf9c47', 0.04, 0.4),
          shell = material('#a6b4b2', 0.6, 0.32);
        shell.transparent = true;
        shell.depthWrite = false;
        const capMaterial = red.clone();
        capMaterial.transparent = true;
        capMaterial.depthWrite = false;
        const hoseMaterial = black.clone();
        hoseMaterial.transparent = true;
        fluid.transparent = true;
        fluid.opacity = 0.65;
        const main = new THREE.Group(),
          master = new THREE.Group();
        root.add(main, master);
        const disk = new THREE.Group();
        main.add(disk);
        const ring = (
          parent: THREE.Object3D,
          outer: number,
          inner: number,
          depth: number,
          z: number,
          mat: THREE.Material,
        ) => {
          const shape = new THREE.Shape();
          shape.absarc(0, 0, outer, 0, TAU, false);
          const hole = new THREE.Path();
          hole.absarc(0, 0, inner, 0, TAU, true);
          shape.holes.push(hole);
          const mesh = new THREE.Mesh(
            new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 128 }),
            mat,
          );
          mesh.position.z = z;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          parent.add(mesh);
          return mesh;
        };
        const rotorShape = new THREE.Shape();
        rotorShape.absarc(0, 0, 2, 0, TAU, false);
        const bore = new THREE.Path();
        bore.absarc(0, 0, 0.52, 0, TAU, true);
        rotorShape.holes.push(bore);
        for (let i = 0; i < 18; i++) {
          const a = (i * TAU) / 18,
            hole = new THREE.Path();
          hole.absarc(1.74 * Math.cos(a), 1.74 * Math.sin(a), 0.075, 0, TAU, true);
          rotorShape.holes.push(hole);
        }
        const brushing = document.createElement('canvas');
        brushing.width = brushing.height = 256;
        const brushingContext = brushing.getContext('2d')!;
        const pixels = brushingContext.createImageData(256, 256);
        for (let y = 0; y < 256; y++)
          for (let x = 0; x < 256; x++) {
            const dx = x - 127.5,
              dy = y - 127.5,
              r = Math.hypot(dx, dy) || 1,
              index = (y * 256 + x) * 4;
            pixels.data[index] = Math.round(127.5 * (1 - dy / r));
            pixels.data[index + 1] = Math.round(127.5 * (1 + dx / r));
            pixels.data[index + 2] = 210;
            pixels.data[index + 3] = 255;
          }
        brushingContext.putImageData(pixels, 0, 0);
        const anisotropyMap = new THREE.CanvasTexture(brushing);
        anisotropyMap.repeat.set(0.25, 0.25);
        anisotropyMap.offset.set(0.5, 0.5);
        const rotorMetal = new THREE.MeshPhysicalMaterial({
          color: '#a3b1b3',
          metalness: 0.9,
          roughness: 0.3,
          anisotropy: 0.7,
          anisotropyMap,
        });
        const rotor = new THREE.Mesh(
          new THREE.ExtrudeGeometry(rotorShape, {
            depth: BRAKE.rotorThickness * scale,
            bevelEnabled: false,
            curveSegments: 128,
          }),
          rotorMetal,
        );
        rotor.position.z = (-BRAKE.rotorThickness * scale) / 2;
        rotor.castShadow = true;
        disk.add(rotor);
        box(disk, [0.095, 0.022, 0.004], [1.94, 0, 0.029], material('#af764b', 0.3, 0.5), 0.004);
        ring(disk, 0.65, 0.22, 0.13, -0.065, black);
        for (let i = 0; i < 6; i++) {
          const a = (i * TAU) / 6;
          const bolt = roller(
            disk,
            0.045,
            0.032,
            [0.4 * Math.cos(a), 0.4 * Math.sin(a), 0.08],
            steel,
          );
          box(bolt, [0.045, 0.008, 0.006], [0, 0, 0.018], black, 0);
        }
        roller(main, 0.17, 0.9, [0, 0, -0.32], steel);
        ring(main, 0.22, 0.174, 0.14, -0.07, steel);
        const foot = box(main, [0.62, 2.4, 0.46], [0, -1.13, -0.68], ivory, 0.1);
        box(main, [2.2, 0.13, 1.5], [0, -2.345, -0.35], ivory, 0.055);
        const masterSupport = box(root, [0.13, 1, 0.13], [0, 0, 0], black, 0.035);
        const masterBase = box(root, [1.2, 0.13, 1.1], [0, 0.005, -0.22], ivory, 0.04);
        const caliper = new THREE.Group();
        caliper.position.y = 1.68;
        main.add(caliper);
        const bridge = box(caliper, [0.92, 0.3, 1.4], [0, 0.57, 0], red, 0.1);
        const cylinders = [-1, 1].map((sign) => {
          const group = new THREE.Group();
          caliper.add(group);
          group.scale.z = sign;
          // A real through bore with a closed rear cap; no solid block occupies the piston.
          const wall = ring(group, 0.34, 0.228, 0.47, 0.12, shell);
          roller(group, 0.34, 0.07, [0, 0, 0.625], capMaterial);
          box(group, [0.48, 0.5, 0.1], [0, 0.38, 0.59], red, 0.055);
          const piston = roller(group, 0.223, 0.27, [0, 0, 0.27], steel);
          const seal = ring(group, 0.232, 0.217, 0.018, 0.14, black);
          const backing = box(group, [0.59, 0.55, 0.04], [0, 0, 0.12], black, 0.07);
          const pad = box(group, [0.55, 0.5, 0.075], [0, 0, 0.07], lining, 0.06);
          const liquid = roller(group, 0.222, 1, [0, 0, 0.5], fluid);
          return { group, wall, piston, seal, backing, pad, liquid };
        });
        const gallery = tube(
          caliper,
          [
            [0, 0, -0.6],
            [0, 0.48, -0.6],
            [0, 0.57, -0.4],
            [0, 0.57, 0.4],
            [0, 0.48, 0.6],
            [0, 0, 0.6],
          ],
          0.035,
          fluid,
        );
        // Caliper bracket carries braking reaction into the stationary axle support.
        const bracket = box(main, [0.25, 1.95, 0.22], [0.4, 1.065, -0.72], black, 0.05);
        box(main, [0.85, 0.22, 0.25], [0.08, 0.12, -0.72], black, 0.04);
        for (const y of [-0.24, 0.25]) {
          box(caliper, [0.28, 0.22, 0.12], [0.35, y, -0.59], red, 0.045);
          roller(caliper, 0.052, 0.12, [0.4, y, -0.57], steel);
        }
        // Master cylinder axis is local x. All piston travel is from the hydraulic model.
        const masterBody = new THREE.Group();
        masterBody.rotation.y = Math.PI / 2;
        master.add(masterBody);
        ring(masterBody, 0.23, 0.125, 1.25, -0.65, shell);
        roller(masterBody, 0.23, 0.1, [0, 0, 0.65], black);
        const masterPiston = roller(masterBody, 0.124, 0.3, [0, 0, -0.4], steel);
        ring(masterPiston, 0.127, 0.108, 0.035, 0.13, black);
        const oil = roller(masterBody, 0.123, 1, [0, 0, 0.15], fluid);
        const pushrod = roller(master, 0.045, 1, [0, 0, 0], steel);
        const reservoir = new THREE.Group();
        master.add(reservoir);
        box(reservoir, [0.54, 0.34, 0.37], [-0.23, 0.4, 0], shell, 0.04);
        box(reservoir, [0.56, 0.045, 0.39], [-0.23, 0.59, 0], black, 0.018);
        box(reservoir, [0.45, 0.23, 0.28], [-0.23, 0.39, 0], fluid, 0.03);
        const port = tube(
          master,
          [
            [-0.234, 0.23, 0],
            [-0.234, 0.36, 0],
          ],
          0.018,
          fluid,
        );
        const pivot = new THREE.Group();
        pivot.position.set(-0.99, 0.11, 0);
        master.add(pivot);
        roller(pivot, 0.09, 0.4, [0, 0, 0], steel);
        roller(pivot, 0.06, 0.14, [-0.14, -0.25, 0], steel);
        const blade = new THREE.Shape();
        blade.moveTo(-0.08, 0.04);
        blade.bezierCurveTo(-0.28, -0.26, -0.38, -0.9, -0.22, -1.34);
        blade.quadraticCurveTo(-0.17, -1.43, -0.08, -1.34);
        blade.bezierCurveTo(-0.18, -0.83, 0.01, -0.22, 0.1, -0.05);
        blade.closePath();
        const lever = new THREE.Mesh(
          new THREE.ExtrudeGeometry(blade, {
            depth: 0.1,
            bevelEnabled: true,
            bevelThickness: 0.018,
            bevelSize: 0.018,
            bevelSegments: 3,
          }),
          black,
        );
        lever.position.z = -0.05;
        pivot.add(lever);
        box(master, [0.3, 0.65, 0.6], [-0.9, 0.41, -0.22], black, 0.09);
        const bubble = new THREE.Mesh(
          new THREE.SphereGeometry(1, 24, 18),
          new THREE.MeshPhysicalMaterial({
            color: '#fbf4d9',
            metalness: 0,
            roughness: 0.07,
            transparent: true,
            opacity: 0.7,
          }),
        );
        master.add(bubble);
        let hose: THREE.Mesh | undefined,
          inside: THREE.Mesh | undefined,
          small: boolean | undefined;
        const target = new THREE.Vector3(),
          desired = new THREE.Vector3(),
          rodStart = new THREE.Vector3(),
          rodEnd = new THREE.Vector3(),
          rodDirection = new THREE.Vector3(),
          rodAxis = new THREE.Vector3(0, 0, 1),
          highPressure = new THREE.Color('#c86637');
        return {
          dispose() {
            anisotropyMap.dispose();
          },
          update(dt, _elapsed, settle) {
            const { shot: s, demo: d } = live.current,
              compact = window.innerWidth < 760;
            if (compact !== small) {
              small = compact;
              main.position.set(compact ? 0 : 1.55, 2.35, 0);
              master.position.set(compact ? -0.15 : -2.4, compact ? 5.25 : 3.55, 0);
              masterBase.position.x = master.position.x - 0.9;
              masterSupport.position.set(
                masterBase.position.x,
                (master.position.y + 0.4 + 0.065) / 2,
                -0.22,
              );
              masterSupport.scale.y = master.position.y + 0.4 - 0.065;
              const points = [
                [master.position.x + 0.69, master.position.y, 0],
                [master.position.x + 1.25, master.position.y + 0.25, -0.1],
                [main.position.x + 1.0, compact ? 5.6 : 4.85, -0.45],
                [main.position.x, 4.6, -0.6],
                [main.position.x, 4.03, -0.6],
              ];
              for (const old of [hose, inside])
                if (old) {
                  root.remove(old);
                  old.geometry.dispose();
                }
              hose = tube(root, points, 0.067, hoseMaterial);
              inside = tube(root, points, 0.039, fluid);
            }
            const state = s.state;
            disk.rotation.z = s.rotation;
            masterPiston.position.z = -0.4 + state.stroke * scale;
            masterPiston.scale.x = state.diameter / 10;
            masterPiston.scale.y = state.diameter / 10;
            masterBody.scale.x = state.diameter / 10;
            masterBody.scale.y = state.diameter / 10;
            // The entire bore changes diameter once; keep the piston matched to that bore.
            masterPiston.scale.x = masterPiston.scale.y = 1;
            const face = -0.25 + state.stroke * scale,
              length = 0.6 - face;
            oil.position.z = (face + 0.6) / 2;
            oil.scale.z = length;
            pivot.rotation.z = -Math.asin(Math.min(0.5, (state.handTravel * scale) / 1.3));
            rodStart
              .set(-0.14, -0.25, 0)
              .applyAxisAngle(rodAxis, pivot.rotation.z)
              .add(pivot.position);
            rodEnd.set(-0.55 + state.stroke * scale, 0, 0);
            rodDirection.copy(rodEnd).sub(rodStart);
            pushrod.position.copy(rodStart).add(rodEnd).multiplyScalar(0.5);
            pushrod.scale.z = rodDirection.length();
            pushrod.quaternion.setFromUnitVectors(rodAxis, rodDirection.normalize());
            port.visible = state.portOpen;
            shell.opacity = 1 - 0.82 * s.cutaway;
            capMaterial.opacity = 1 - 0.94 * s.cutaway;
            inside!.visible = s.cutaway > 0.1;
            hoseMaterial.opacity = 1 - 0.85 * s.cutaway;
            fluid.color.set('#bb904b').lerp(highPressure, Math.min(1, state.pressure / 5));
            cylinders.forEach(({ piston, backing, pad, liquid }) => {
              const gap = (BRAKE.padGap - state.padTravel) * scale,
                padThickness = 0.075 - state.padCompression * scale,
                contact = 0.025 + gap,
                pistonFace = contact + padThickness + 0.04;
              pad.position.z = contact + padThickness / 2;
              pad.scale.z = padThickness / 0.075;
              backing.position.z = contact + padThickness + 0.02;
              piston.position.z = pistonFace + 0.135;
              const rear = pistonFace + 0.27;
              liquid.position.z = (rear + 0.59) / 2;
              liquid.scale.z = Math.max(0.001, 0.59 - rear);
            });
            bubble.visible = state.bubbleVolume > 0 && s.cutaway > 0.1;
            const r = Math.cbrt((state.bubbleRemaining * 3) / (4 * Math.PI)) * scale;
            bubble.scale.setScalar(r);
            bubble.position.set(0.18, 0, 0);
            bridge.visible = foot.visible = bracket.visible = true;
            gallery.visible = s.cutaway > 0.1;
            if (d.watch) {
              const close = s.focus !== 'assembly',
                mix = settle ? 1 : 1 - Math.exp(-dt * 2.2);
              if (s.focus === 'master')
                target.copy(master.position).add(new THREE.Vector3(-0.1, -0.05, 0));
              else if (s.focus === 'caliper')
                target.copy(main.position).add(new THREE.Vector3(0, 1.6, 0));
              else target.set(compact ? 0 : -0.05, compact ? 3.1 : 2.65, 0);
              controls.target.lerp(target, mix);
              const viewHeight = close
                  ? Math.max(
                      (s.focus === 'master' ? 3.1 : 2.6) / camera.aspect,
                      s.focus === 'master' ? 2.9 : 2.5,
                    )
                  : Math.max((compact ? 5.0 : 8.6) / camera.aspect, compact ? 6.4 : 5.8),
                distance = viewHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));
              desired
                .set(
                  s.focus === 'caliper' ? 8 : close ? 4 : 2.5,
                  close ? 2.5 : 2.2,
                  s.focus === 'caliper' ? 3.5 : 8,
                )
                .normalize()
                .multiplyScalar(distance)
                .add(controls.target);
              camera.position.lerp(desired, mix);
            }
          },
        };
      }}
    />
  );
}
