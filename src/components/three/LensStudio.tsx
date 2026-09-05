import { useRef } from 'react';
import * as THREE from 'three';
import { t } from '../../i18n';
import { lensRay, thinLens } from '../../models/optics';
import { useShowcase } from '../lab/Showcase';
import LensDiagram, { type LensState } from '../lab/LensDiagram';
import Studio from './Studio';
import { box, material } from './parts';
export default function LensStudio({ state }: { state: LensState }) {
  const demo = useShowcase(),
    current = useRef({ state, demo });
  current.current = { state, demo };
  return (
    <Studio
      label={t('光学台上的凸透镜、物体和可移动成像屏；光线追踪同一物点')}
      cameraPosition={[-3, 4, 10]}
      target={[-1.3, 1.1, 0]}
      span={10.3}
      fitHeight={5.2}
      fallback={<LensDiagram state={state} time={demo.time} />}
      create={({ root, camera, controls }) => {
        const steel = material('#8f9c92', 0.8, 0.26),
          black = material('#263c34', 0.45, 0.38),
          brass = material('#b7985f', 0.7, 0.3);
        box(root, [9.2, 0.16, 1.45], [-1.3, 0.14, 0], black, 0.09);
        for (const z of [-0.43, 0.43])
          box(root, [8.9, 0.045, 0.045], [-1.3, 0.25, z], steel, 0.018);
        for (let x = -5.5; x < 3; x += 0.25)
          box(root, [0.014, 0.008, 0.09], [x, 0.231, 0.64], brass, 0);
        const glass = new THREE.MeshPhysicalMaterial({
          color: '#c8e6db',
          metalness: 0,
          roughness: 0.06,
          transmission: 0.82,
          thickness: 0.35,
          ior: 1.5,
          transparent: true,
          opacity: 0.78,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const points: THREE.Vector2[] = [];
        for (let i = 0; i <= 32; i++) {
          const r = (i / 32) * 0.75;
          points.push(
            new THREE.Vector2(
              r,
              0.025 + Math.sqrt(1.6 ** 2 - r * r) - Math.sqrt(1.6 ** 2 - 0.75 ** 2),
            ),
          );
        }
        for (let i = 32; i >= 0; i--) {
          const r = (i / 32) * 0.75;
          points.push(
            new THREE.Vector2(
              r,
              -0.025 - Math.sqrt(1.6 ** 2 - r * r) + Math.sqrt(1.6 ** 2 - 0.75 ** 2),
            ),
          );
        }
        const lens = new THREE.Mesh(new THREE.LatheGeometry(points, 72), glass);
        lens.rotation.z = Math.PI / 2;
        lens.position.y = 1.75;
        root.add(lens);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.77, 0.045, 16, 96), brass);
        rim.rotation.y = Math.PI / 2;
        rim.position.y = 1.75;
        root.add(rim);
        box(root, [0.11, 0.67, 0.11], [0, 0.65, 0], steel, 0.025);
        box(root, [0.52, 0.16, 1], [0, 0.34, 0], black, 0.04);
        const object = new THREE.Group(),
          screen = new THREE.Group();
        root.add(object, screen);
        for (const holder of [object, screen]) {
          box(holder, [0.5, 0.16, 1], [0, 0.34, 0], black, 0.035);
          box(holder, [0.09, 0.86, 0.09], [0, 0.87, 0], steel, 0.025);
        }
        box(screen, [0.085, 1.7, 1.35], [0, 1.75, 0], black, 0.04);
        box(screen, [0.02, 1.53, 1.18], [-0.055, 1.75, 0], material('#e5e7d6'), 0.01);
        const arrow = new THREE.ArrowHelper(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 1.3, 0),
          0.9,
          0xbda05e,
          0.16,
          0.13,
        );
        object.add(arrow);
        const source = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), material('#e5a75c'));
        object.add(source);
        const rays = Array.from({ length: 7 }, (_, i) => {
          const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(),
            new THREE.Vector3(),
            new THREE.Vector3(),
          ]);
          const line = new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({
              color: i === 3 ? '#b3893c' : '#879b79',
              transparent: true,
              opacity: i === 3 ? 1 : 0.68,
            }),
          );
          root.add(line);
          const photon = new THREE.Mesh(
            new THREE.SphereGeometry(0.022, 10, 8),
            new THREE.MeshBasicMaterial({ color: '#f4d58c' }),
          );
          root.add(photon);
          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.024, 12, 8),
            new THREE.MeshBasicMaterial({ color: '#bf8b49' }),
          );
          root.add(dot);
          return { geometry, photon, dot };
        });
        const virtualGeometry = new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 4 }, () => new THREE.Vector3()),
        );
        const virtual = new THREE.LineSegments(
          virtualGeometry,
          new THREE.LineDashedMaterial({ color: '#a79ac1', dashSize: 0.06, gapSize: 0.045 }),
        );
        root.add(virtual);
        const focus = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 16, 12),
          new THREE.MeshBasicMaterial({ color: '#649b87' }),
        );
        root.add(focus);
        let freeTime = 0;
        return {
          update(dt, _elapsed, settle) {
            const { state: s, demo: d } = current.current;
            if (!d.watch) freeTime += dt;
            const time = d.watch ? d.time : freeTime;
            object.position.x = -s.object / 40;
            screen.position.x = s.sensor / 40 + 0.065;
            lens.scale.y = 50 / s.focal;
            source.position.set(0, 1.75 + s.height / 40, 0);
            const result = thinLens(s.focal, s.object);
            focus.visible = result.image !== null && Math.abs(result.image) < 260;
            if (result.image !== null)
              focus.position.set(
                result.image / 40,
                1.75 + (result.magnification! * s.height) / 40,
                0,
              );
            rays.forEach(({ geometry, photon, dot }, i) => {
              const h = (i / 6 - 0.5) * s.aperture,
                ray = lensRay(s.focal, s.object, s.height, h);
              const p = [
                new THREE.Vector3(-s.object / 40, 1.75 + s.height / 40, 0),
                new THREE.Vector3(0, 1.75 + h / 40, 0),
                new THREE.Vector3(s.sensor / 40, 1.75 + ray.at(s.sensor) / 40, 0),
              ];
              const a = geometry.getAttribute('position') as THREE.BufferAttribute;
              p.forEach((v, k) => a.setXYZ(k, v.x, v.y, v.z));
              a.needsUpdate = true;
              geometry.computeBoundingSphere();
              dot.position.copy(p[2]);
              dot.visible = Math.abs(ray.at(s.sensor)) <= 30.6;
              const proportion = (time * 0.18 + i / 7) % 1,
                len = p[0].distanceTo(p[1]),
                other = p[1].distanceTo(p[2]),
                distance = proportion * (len + other);
              photon.position
                .copy(distance < len ? p[0] : p[1])
                .lerp(
                  distance < len ? p[1] : p[2],
                  distance < len ? distance / len : (distance - len) / other,
                );
            });
            virtual.visible = !result.real && result.image !== null && Math.abs(result.image) < 260;
            if (virtual.visible) {
              const a = virtualGeometry.getAttribute('position') as THREE.BufferAttribute;
              [-0.5, 0.5].forEach((v, i) => {
                a.setXYZ(i * 2, 0, 1.75 + (v * s.aperture) / 40, 0);
                a.setXYZ(
                  i * 2 + 1,
                  result.image! / 40,
                  1.75 + (result.magnification! * s.height) / 40,
                  0,
                );
              });
              a.needsUpdate = true;
              virtualGeometry.computeBoundingSphere();
              virtual.computeLineDistances();
            }
            if (d.watch) {
              const angle = d.chapter === 7 ? -0.16 : d.chapter === 1 ? 0.22 : 0.05;
              const desired = new THREE.Vector3(-3 + angle * 3, 4, 10)
                .sub(new THREE.Vector3(-1.3, 1.1, 0))
                .normalize()
                .multiplyScalar(camera.position.distanceTo(controls.target))
                .add(controls.target);
              camera.position.lerp(desired, settle ? 1 : 1 - Math.exp(-dt * 2));
            }
          },
        };
      }}
    />
  );
}
