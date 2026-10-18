import { useRef } from 'react';
import * as THREE from 'three';
import Studio from './Studio';
import {
  type CarbonMolecule,
  type CarbonPoint,
  rotatePoint,
  carbonPiGuides,
} from '../../models/chem-carbon-frameworks';
export const CHEM_ATOM_COLORS = { C: '#647263', H: '#f0e9d6', Cl: '#98b680' };
const radii = { C: 0.23, H: 0.145, Cl: 0.32 };
export function CarbonMoleculeFlat({
  molecule,
  yaw,
  pitch,
  span,
  showPi = false,
}: {
  molecule: CarbonMolecule;
  yaw: number;
  pitch: number;
  span: number;
  showPi?: boolean;
}) {
  const transform = (p: CarbonPoint) =>
      rotatePoint(rotatePoint(p, { x: 0, y: 1, z: 0 }, yaw), { x: 1, y: 0, z: 0 }, pitch),
    points = molecule.atoms.map((a) => ({ ...a, ...transform(a) })),
    scale = 300 / span;
  return (
    <svg
      viewBox="0 0 320 260"
      role="img"
      aria-label="Same molecular coordinates in a flat projection"
    >
      <g transform="translate(160 130)">
        {showPi &&
          carbonPiGuides(molecule).map((g, i) => {
            const c = transform(g.center),
              u = transform({ x: g.radii.x, y: 0, z: 0 }),
              v = transform({ x: 0, y: g.radii.y, z: 0 }),
              w = transform({ x: 0, y: 0, z: g.radii.z }),
              xx = u.x * u.x + v.x * v.x + w.x * w.x,
              yy = u.y * u.y + v.y * v.y + w.y * w.y,
              xy = -(u.x * u.y + v.x * v.y + w.x * w.y),
              disc = Math.sqrt((xx - yy) ** 2 + 4 * xy * xy),
              theta = Math.atan2(2 * xy, xx - yy) / 2;
            return (
              <ellipse
                key={i}
                cx={c.x * scale}
                cy={-c.y * scale}
                rx={Math.sqrt((xx + yy + disc) / 2) * scale}
                ry={Math.sqrt((xx + yy - disc) / 2) * scale}
                transform={`rotate(${(theta * 180) / Math.PI} ${c.x * scale} ${-c.y * scale})`}
                fill={g.pair === 0 ? '#9daed0' : '#c9ad88'}
                opacity=".25"
              />
            );
          })}

        {molecule.bonds.map((b, i) => {
          const a = points[b.a],
            c = points[b.b],
            dx = c.x - a.x,
            dy = c.y - a.y,
            l = Math.hypot(dx, dy) || 1;
          return Array.from({ length: b.order }, (_, k) => {
            const o = (k - (b.order - 1) / 2) * 6;
            return (
              <line
                key={`${i}-${k}`}
                x1={a.x * scale - (dy / l) * o}
                y1={-a.y * scale - (dx / l) * o}
                x2={c.x * scale - (dy / l) * o}
                y2={-c.y * scale - (dx / l) * o}
                stroke="#b3b7a5"
                strokeWidth="5"
                strokeLinecap="round"
              />
            );
          });
        })}
        {points
          .sort((a, b) => a.z - b.z)
          .map((a) => (
            <circle
              key={a.id}
              cx={a.x * scale}
              cy={-a.y * scale}
              r={radii[a.element] * scale}
              fill={CHEM_ATOM_COLORS[a.element]}
              stroke="#7c8d6f"
              strokeWidth=".8"
            />
          ))}
      </g>
    </svg>
  );
}
export default function ChemMoleculeStudio({
  molecule,
  yaw,
  pitch,
  showPi,
  span,
}: {
  molecule: CarbonMolecule;
  yaw: number;
  pitch: number;
  showPi: boolean;
  span: number;
}) {
  const latest = useRef({ molecule, yaw, pitch, showPi });
  latest.current = { molecule, yaw, pitch, showPi };
  return (
    <Studio
      className="chem-carbon-studio"
      label="Calculated molecular ball-and-stick geometry"
      exposure={1.08}
      cameraPosition={[0, 3.2, 10]}
      target={[0, 2, 0]}
      span={span}
      fitHeight={3.8}
      fallback={
        <CarbonMoleculeFlat
          molecule={molecule}
          yaw={yaw}
          pitch={pitch}
          span={span}
          showPi={showPi}
        />
      }
      create={({ root, scene }) => {
        root.position.y = 2;
        scene.environmentIntensity = 0.5;
        const sphere = new THREE.SphereGeometry(1, 28, 18),
          cylinder = new THREE.CylinderGeometry(1, 1, 1, 14),
          materials = Object.fromEntries(
            Object.entries(CHEM_ATOM_COLORS).map(([key, color]) => [
              key,
              new THREE.MeshStandardMaterial({ color, roughness: 0.47, metalness: 0.03 }),
            ]),
          ) as Record<'C' | 'H' | 'Cl', THREE.MeshStandardMaterial>,
          stick = new THREE.MeshStandardMaterial({ color: '#b9bdab', roughness: 0.66 }),
          piMaterial = new THREE.MeshBasicMaterial({
            color: '#7293bf',
            transparent: true,
            opacity: 0.28,
            depthWrite: false,
          }),
          pi2Material = new THREE.MeshBasicMaterial({
            color: '#c49355',
            transparent: true,
            opacity: 0.28,
            depthWrite: false,
          });
        const atoms = Array.from({ length: 16 }, () => {
          const mesh = new THREE.Mesh(sphere, materials.C);
          mesh.castShadow = true;
          root.add(mesh);
          return mesh;
        });
        const bonds = Array.from({ length: 60 }, () => {
          const mesh = new THREE.Mesh(cylinder, stick);
          mesh.castShadow = true;
          root.add(mesh);
          return mesh;
        });
        const pi = Array.from({ length: 4 }, (_, i) => {
          const mesh = new THREE.Mesh(sphere, i < 2 ? piMaterial : pi2Material);
          root.add(mesh);
          return mesh;
        });
        const yAxis = new THREE.Vector3(0, 1, 0);
        return {
          dispose() {
            for (const material of Object.values(materials)) material.dispose();
            stick.dispose();
            piMaterial.dispose();
            pi2Material.dispose();
          },
          update() {
            const s = latest.current,
              m = s.molecule;
            root.rotation.set(s.pitch, s.yaw, 0);
            atoms.forEach((mesh, i) => {
              const a = m.atoms[i];
              mesh.visible = !!a;
              if (!a) return;
              mesh.position.set(a.x, a.y, a.z);
              mesh.scale.setScalar(radii[a.element]);
              mesh.material = materials[a.element];
            });
            let n = 0;
            for (const b of m.bonds) {
              const a = m.atoms[b.a],
                c = m.atoms[b.b],
                from = new THREE.Vector3(a.x, a.y, a.z),
                to = new THREE.Vector3(c.x, c.y, c.z),
                axis = to.clone().sub(from),
                len = axis.length(),
                side = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 0, 1));
              if (side.length() < 0.001) side.crossVectors(axis, new THREE.Vector3(0, 1, 0));
              side.normalize();
              for (let k = 0; k < b.order; k++) {
                const mesh = bonds[n++];
                mesh.visible = true;
                mesh.position
                  .copy(from)
                  .add(to)
                  .multiplyScalar(0.5)
                  .addScaledVector(side, (k - (b.order - 1) / 2) * 0.16);
                mesh.scale.set(b.order === 1 ? 0.066 : 0.045, len, b.order === 1 ? 0.066 : 0.045);
                mesh.quaternion.setFromUnitVectors(yAxis, axis.normalize());
              }
            }
            for (; n < bonds.length; n++) bonds[n].visible = false;
            const guides = carbonPiGuides(m);
            pi.forEach((mesh, i) => {
              const g = guides[i];
              mesh.visible = !!g && s.showPi;
              if (!mesh.visible || !g) return;
              mesh.position.set(g.center.x, g.center.y, g.center.z);
              mesh.scale.set(g.radii.x, g.radii.y, g.radii.z);
            });
          },
        };
      }}
    />
  );
}
