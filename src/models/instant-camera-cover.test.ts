import { describe, expect, it } from 'vitest';
import { IC, IC_CAMERA_GEOMETRY as hardware } from './instant-camera';
import {
  instantCameraCover,
  instantCameraCoverProject,
  type IcArtworkPoint,
} from './instant-camera-cover';

const eye = [4, 8, 10].map((v) => v / Math.hypot(4, 8, 10));
const depth = (p: IcArtworkPoint) => p.reduce((sum, v, i) => sum + v * eye[i], 0);

describe('physical instant-camera SVG cover', () => {
  it('retains real hollow barrel cut faces, the far nip support and a bounded native SVG', () => {
    const paths = instantCameraCover();
    expect(paths.length).toBeLessThan(2500);
    const svg = paths
      .map(
        (p) =>
          `<path d="${p.d}" fill="${p.fill}" stroke="${p.stroke ?? ''}" stroke-width="${p.strokeWidth}" opacity="${p.opacity}" stroke-linejoin="round"/>`,
      )
      .join('');
    expect(Buffer.byteLength(svg)).toBeLessThan(400000);
    const sections = [
      ...hardware.barrels.map((b, i) => ({
        part: `barrel-${i}-cut`,
        inner: b.radius - hardware.wallThickness,
      })),
      { part: 'lens-mount-cut', inner: hardware.mount.innerRadius },
    ];
    for (const section of sections) {
      const caps = paths.filter((p) => p.part === section.part);
      expect(caps.length).toBeGreaterThan(0);
      for (const cap of caps)
        for (const p of cap.points) {
          expect(p[2]).toBe(0);
          expect(Math.abs(p[1] - IC.lens.y)).toBeGreaterThanOrEqual(section.inner - 1e-7);
        }
    }
    expect(paths.some((p) => p.part === 'roller-bracket-0')).toBe(true);
    expect(paths.some((p) => p.part === 'roller-bracket-1')).toBe(false);
    expect(paths.some((p) => p.part === 'frame-cut-0-section')).toBe(true);
    const paper = paths.filter((p) => p.part === 'transported-sheet').flatMap((p) => p.points);
    expect(Math.min(...paper.map((p) => p[0]))).toBeLessThan(0);
    expect(Math.max(...paper.map((p) => p[0]))).toBeGreaterThan(0);
  });

  it('paints the nearest actual face throughout the nip, with both physical rollers visible', () => {
    const faces = instantCameraCover()
      .filter((p) => p.opacity === 1)
      .map((face) => {
        const points = face.points.map(instantCameraCoverProject);
        const a = points[0];
        let b = points[1],
          c = points[2],
          determinant = 0;
        for (let i = 1; i < points.length - 1; i++) {
          b = points[i];
          c = points[i + 1];
          determinant = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
          if (Math.abs(determinant) > 1e-8) break;
        }
        const indexB = points.indexOf(b),
          indexC = points.indexOf(c);
        const da = depth(face.points[0]),
          db = depth(face.points[indexB]),
          dc = depth(face.points[indexC]);
        return {
          ...face,
          points,
          bounds: [
            Math.min(...points.map((p) => p[0])),
            Math.max(...points.map((p) => p[0])),
            Math.min(...points.map((p) => p[1])),
            Math.max(...points.map((p) => p[1])),
          ],
          at: (x: number, y: number) => {
            const u = ((x - a[0]) * (c[1] - a[1]) - (y - a[1]) * (c[0] - a[0])) / determinant;
            const v = ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0])) / determinant;
            return da + u * (db - da) + v * (dc - da);
          },
        };
      });
    const rollerPoints = faces
      .filter((f) => f.part.startsWith('roller-0-') || f.part.startsWith('roller-1-'))
      .flatMap((f) => f.points);
    const minX = Math.min(...rollerPoints.map((p) => p[0])),
      maxX = Math.max(...rollerPoints.map((p) => p[0]));
    const minY = Math.min(...rollerPoints.map((p) => p[1])),
      maxY = Math.max(...rollerPoints.map((p) => p[1]));
    const visible = [0, 0];
    let sampled = 0,
      worstError = 0;
    for (let x = minX + 0.43; x < maxX; x += 1.1)
      for (let y = minY + 0.37; y < maxY; y += 1.1) {
        let nearest = -Infinity,
          paintedDepth = -Infinity,
          paintedPart = '';
        for (const face of faces) {
          if (x < face.bounds[0] || x > face.bounds[1] || y < face.bounds[2] || y > face.bounds[3])
            continue;
          let positive = false,
            negative = false;
          for (let i = 0; i < face.points.length; i++) {
            const a = face.points[i],
              b = face.points[(i + 1) % face.points.length];
            const sign = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
            if (sign > 1e-7) positive = true;
            if (sign < -1e-7) negative = true;
          }
          if (positive && negative) continue;
          paintedDepth = face.at(x, y);
          if (!Number.isFinite(paintedDepth)) continue;
          nearest = Math.max(nearest, paintedDepth);
          paintedPart = face.part;
        }
        if (!Number.isFinite(nearest)) continue;
        sampled++;
        worstError = Math.max(worstError, nearest - paintedDepth);
        if (paintedPart.startsWith('roller-0-')) visible[0]++;
        if (paintedPart.startsWith('roller-1-')) visible[1]++;
      }
    expect(sampled).toBeGreaterThan(1000);
    expect(worstError).toBeLessThan(0.03);
    expect(visible[0]).toBeGreaterThan(20);
    expect(visible[1]).toBeGreaterThan(20);
  });
});
