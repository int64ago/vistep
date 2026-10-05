import { MYOPIA_LENSLETS, MYOPIA_OPTICS, myopiaOptics } from './myopia-lens';

/** Original entry art uses the same sampled lenslet positions and traced rays. */
export function myopiaLensCover() {
  const optics = myopiaOptics({ kind: 'dims', angleDeg: 18 });
  const project = (x: number, y: number) => ({ x: 251 + x * 4.35, y: 107 + y * 4.35 });
  return {
    lenslets: MYOPIA_LENSLETS,
    lensletRadius: MYOPIA_OPTICS.lensletDiameterMm / 2,
    retina: project(optics.retinaMm, 0).x,
    rays: optics.rays.map((ray) => ({ ...ray, points: ray.points.map((p) => project(p.x, p.y)) })),
    foci: optics.foci
      .filter((f) => f.admitted)
      .map((f) => ({ ...f, point: project(f.point.x, f.point.y) })),
  };
}
