import * as THREE from 'three';
import type { SwitchSolid } from '../../models/keyboard-switch-geometry';

type ShadedSolid = SwitchSolid & { smooth?: boolean };
type CompiledSwitchMesh = {
  sourceCount: number;
  faces: number[][];
  smooth: boolean;
  /** Nonindexed output corners refer to the original, shared solid vertices. */
  sourceForCorner: Uint32Array;
  faceForCorner: Uint32Array;
  incidentFaces: number[][];
  faceNormals: Float64Array;
};
const compiledMeshes = new WeakMap<THREE.BufferGeometry, CompiledSwitchMesh>();
const CREASE_DOT = Math.cos(Math.PI / 3);

/** Newell's area normal treats the polygon as one face, independent of whatever
 * triangulation the GPU needs. This avoids fan-area-dependent shading of planes. */
function faceNormal(solid: ShadedSolid, face: readonly number[]): [number, number, number] {
  let x = 0,
    y = 0,
    z = 0;
  for (let i = 0; i < face.length; i++) {
    const a = solid.vertices[face[i]],
      b = solid.vertices[face[(i + 1) % face.length]];
    x += (a[1] - b[1]) * (a[2] + b[2]);
    y += (a[2] - b[2]) * (a[0] + b[0]);
    z += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const length = Math.hypot(x, y, z);
  return length > 1e-12 ? [x / length, y / length, z / length] : [0, 0, 0];
}
function dominantAxis(normal: readonly number[]) {
  return Math.abs(normal[0]) > Math.abs(normal[1])
    ? Math.abs(normal[0]) > Math.abs(normal[2])
      ? 0
      : 2
    : Math.abs(normal[1]) > Math.abs(normal[2])
      ? 1
      : 2;
}
function projectedPoint(point: readonly number[], axis: number): [number, number] {
  // Cyclic projection preserves orientation relative to the dropped normal axis.
  return axis === 0
    ? [point[1], point[2]]
    : axis === 1
      ? [point[2], point[0]]
      : [point[0], point[1]];
}
function sameTopology(solid: ShadedSolid, compiled: CompiledSwitchMesh) {
  if (
    solid.vertices.length !== compiled.sourceCount ||
    Boolean(solid.smooth) !== compiled.smooth ||
    solid.faces.length !== compiled.faces.length
  )
    return false;
  for (let i = 0; i < solid.faces.length; i++) {
    if (solid.faces[i].length !== compiled.faces[i].length) return false;
    for (let j = 0; j < solid.faces[i].length; j++)
      if (solid.faces[i][j] !== compiled.faces[i][j]) return false;
  }
  return true;
}
function compileGeometry(geometry: THREE.BufferGeometry, solid: ShadedSolid) {
  const sources: number[] = [],
    facesForCorners: number[] = [],
    uv: number[] = [],
    incidentFaces = Array.from({ length: solid.vertices.length }, () => [] as number[]),
    faceNormals = new Float64Array(solid.faces.length * 3);
  for (let faceIndex = 0; faceIndex < solid.faces.length; faceIndex++) {
    const face = solid.faces[faceIndex];
    if (face.length < 3) continue;
    for (const index of new Set(face)) {
      if (!solid.vertices[index] || !solid.vertices[index].every(Number.isFinite))
        throw new Error(`Invalid switch vertex in ${solid.id}`);
      incidentFaces[index].push(faceIndex);
    }
    const normal = faceNormal(solid, face),
      axis = dominantAxis(normal);
    faceNormals.set(normal, faceIndex * 3);
    const contour = face.map(
      (index) => new THREE.Vector2(...projectedPoint(solid.vertices[index], axis)),
    );
    for (const triangle of THREE.ShapeUtils.triangulateShape(contour, [])) {
      const corners = triangle.map((index) => face[index]),
        a = solid.vertices[corners[0]],
        b = solid.vertices[corners[1]],
        c = solid.vertices[corners[2]];
      const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
        ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const facing =
        (ab[1] * ac[2] - ab[2] * ac[1]) * normal[0] +
        (ab[2] * ac[0] - ab[0] * ac[2]) * normal[1] +
        (ab[0] * ac[1] - ab[1] * ac[0]) * normal[2];
      if (Math.abs(facing) < 1e-14) continue;
      if (facing < 0) [corners[1], corners[2]] = [corners[2], corners[1]];
      for (const source of corners) {
        sources.push(source);
        facesForCorners.push(faceIndex);
        const p = projectedPoint(solid.vertices[source], axis);
        // Original material coordinates survive both deformation and translation.
        uv.push(p[0] * 0.2, p[1] * 0.2);
      }
    }
  }
  const compiled: CompiledSwitchMesh = {
    sourceCount: solid.vertices.length,
    faces: solid.faces.map((face) => [...face]),
    smooth: Boolean(solid.smooth),
    sourceForCorner: Uint32Array.from(sources),
    faceForCorner: Uint32Array.from(facesForCorners),
    incidentFaces,
    faceNormals,
  };
  geometry.setIndex(null);
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(sources.length * 3), 3),
  );
  geometry.setAttribute(
    'normal',
    new THREE.BufferAttribute(new Float32Array(sources.length * 3), 3),
  );
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  compiledMeshes.set(geometry, compiled);
  return compiled;
}

/** Concave polygon topology is compiled once. Flat solids retain each original
 * face normal; explicitly smooth solids blend only adjacent faces within 60°,
 * keeping cylinder caps and the edges of thin metal leaves distinct. */
export function createSwitchGeometry(solid: ShadedSolid): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const compiled = compileGeometry(geometry, solid);
  updatePositionsAndNormals(geometry, solid, compiled);
  return geometry;
}

/** Same topology reuses triangulation, adjacency, UV and GPU attributes. The
 * caller can handle rigid translations with mesh.position and skip this work.
 * Changing the polygon topology recompiles this existing geometry in place. */
export function updateSwitchGeometry(geometry: THREE.BufferGeometry, solid: ShadedSolid): void {
  let compiled = compiledMeshes.get(geometry);
  if (!compiled || !sameTopology(solid, compiled)) compiled = compileGeometry(geometry, solid);
  updatePositionsAndNormals(geometry, solid, compiled);
}

function updatePositionsAndNormals(
  geometry: THREE.BufferGeometry,
  solid: ShadedSolid,
  compiled: CompiledSwitchMesh,
) {
  const position = geometry.getAttribute('position') as THREE.BufferAttribute,
    normal = geometry.getAttribute('normal') as THREE.BufferAttribute,
    normals = compiled.faceNormals;
  for (let i = 0; i < solid.faces.length; i++) {
    const value = faceNormal(solid, solid.faces[i]);
    // Keep the previous finite normal if a deforming face momentarily collapses.
    if (Math.hypot(...value) > 0) normals.set(value, i * 3);
  }
  for (let corner = 0; corner < compiled.sourceForCorner.length; corner++) {
    const source = compiled.sourceForCorner[corner],
      face = compiled.faceForCorner[corner],
      offset = face * 3,
      p = solid.vertices[source];
    position.setXYZ(corner, p[0], p[1], p[2]);
    let x = normals[offset],
      y = normals[offset + 1],
      z = normals[offset + 2];
    // Multi-corner end caps remain one planar face even if a neighboring
    // molding bevel falls inside the smoothing angle. Rounded surfaces are
    // represented by the loft's quad strips, not by smoothing across its cap.
    if (compiled.smooth && compiled.faces[face].length <= 4) {
      x = y = z = 0;
      for (const adjacent of compiled.incidentFaces[source]) {
        if (compiled.faces[adjacent].length > 4) continue;
        const a = adjacent * 3;
        if (
          normals[offset] * normals[a] +
            normals[offset + 1] * normals[a + 1] +
            normals[offset + 2] * normals[a + 2] >
          CREASE_DOT
        ) {
          x += normals[a];
          y += normals[a + 1];
          z += normals[a + 2];
        }
      }
      const length = Math.hypot(x, y, z) || 1;
      x /= length;
      y /= length;
      z /= length;
    }
    normal.setXYZ(corner, x, y, z);
  }
  position.needsUpdate = true;
  normal.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}
