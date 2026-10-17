import { useRef } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import { t } from '../../i18n';
import { screwState, screwThreadVertices, type ScrewParameters } from '../../models/screw-jack';
export default function ScrewJackStudio({
  parameters,
  fallback,
}: {
  parameters: ScrewParameters;
  fallback: React.ReactNode;
}) {
  const live = useRef(parameters);
  live.current = parameters;
  return (
    <Studio
      key={parameters.lead}
      cameraPosition={[6, 4, 9]}
      target={[0, 2.05, 0]}
      span={5.4}
      fitHeight={5.2}
      exposure={0.85}
      label={t('剖开的固定螺母与旋转上升的方牙丝杆')}
      fallback={fallback}
      create={({ root }) => {
        const steel = new THREE.MeshStandardMaterial({
            color: '#93a7aa',
            metalness: 0.8,
            roughness: 0.3,
          }),
          bronze = new THREE.MeshStandardMaterial({
            color: '#b48a52',
            metalness: 0.65,
            roughness: 0.35,
          }),
          base = new THREE.MeshStandardMaterial({
            color: '#49656a',
            metalness: 0.5,
            roughness: 0.4,
          }),
          loadMat = new THREE.MeshStandardMaterial({
            color: '#657c69',
            metalness: 0.2,
            roughness: 0.55,
          });
        const add = (
          g: THREE.BufferGeometry,
          m: THREE.Material,
          parent: THREE.Object3D,
          x = 0,
          y = 0,
          z = 0,
        ) => {
          const mesh = new THREE.Mesh(g, m);
          mesh.position.set(x, y, z);
          mesh.castShadow = mesh.receiveShadow = true;
          parent.add(mesh);
          return mesh;
        };
        add(new THREE.CylinderGeometry(1.5, 1.65, 0.18, 64), base, root, 0, 0.09);
        for (const x of [-1.12, 1.12])
          add(new THREE.BoxGeometry(0.25, 1.4, 0.55), base, root, x, 0.82, -0.18);
        const shape = new THREE.Shape();
        shape.absarc(0, 0, 1.3, Math.PI, Math.PI * 2, false);
        shape.lineTo(0.96, 0);
        shape.absarc(0, 0, 0.96, Math.PI * 2, Math.PI, true);
        shape.closePath();
        const nutGeo = new THREE.ExtrudeGeometry(shape, {
          depth: 1,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 1,
          bevelSize: 0.025,
          bevelThickness: 0.025,
          curveSegments: 48,
        });
        nutGeo.rotateX(Math.PI / 2);
        add(nutGeo, bronze, root, 0, 1.76, 0);
        const makeThread = (
          inner: number,
          outer: number,
          thickness: number,
          start: number,
          end: number,
          offset: number,
          half: boolean,
        ) => {
          const geo = new THREE.BufferGeometry();
          geo.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(
              screwThreadVertices(
                parameters.lead,
                inner,
                outer,
                thickness,
                start,
                end,
                offset,
                half,
              ).map((v) => v * 40),
              3,
            ),
          );
          geo.computeVertexNormals();
          return geo;
        };
        const lead = parameters.lead,
          lower = 0.3 / 40,
          start = Math.ceil((0.76 / 40 - lower - lead * 0.5) / lead),
          end = Math.floor((1.76 / 40 - lower - lead * 0.5) / lead);
        if (end > start)
          add(
            makeThread(0.0185, 0.024, lead * 0.6, start, end, lower + lead * 0.5, true),
            bronze,
            root,
          );
        const spindle = new THREE.Group();
        root.add(spindle);
        add(new THREE.CylinderGeometry(0.72, 0.72, 2.8, 64), steel, spindle, 0, 1.7);
        add(
          makeThread(0.018, 0.022, lead * 0.4, 0, Math.floor(0.065 / lead), lower, false),
          steel,
          spindle,
        );
        add(new THREE.CylinderGeometry(0.88, 0.88, 0.18, 48), steel, spindle, 0, 3.18);
        const handle = add(
          new THREE.CylinderGeometry(0.08, 0.08, parameters.handle * 80, 24),
          bronze,
          spindle,
          0,
          3.2,
        );
        handle.rotation.z = Math.PI / 2;
        for (const x of [-parameters.handle * 40, parameters.handle * 40])
          add(new THREE.SphereGeometry(0.12, 16, 12), bronze, spindle, x, 3.2);
        add(new THREE.CylinderGeometry(0.3, 0.3, 0.14, 32), steel, spindle, 0, 3.32);
        const saddle = new THREE.Group();
        root.add(saddle);
        add(new THREE.CylinderGeometry(0.65, 0.48, 0.2, 48), steel, saddle, 0, 3.45);
        add(new THREE.BoxGeometry(1.3, 0.4, 1.05), loadMat, saddle, 0, 3.75);
        return {
          update() {
            const s = screwState(live.current);
            spindle.rotation.y = -s.rotation;
            spindle.position.y = s.lift * 40;
            saddle.position.y = s.lift * 40;
          },
        };
      }}
    />
  );
}
