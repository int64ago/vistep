import { siphonPoint, type SiphonShot } from '../../models/siphon';

/** Display adapter only. No extra clock, stored history, or continuous-column solve. */
export function siphonOutletFlow(shot: SiphonShot) {
  const s = shot.state,
    length = s.geometry.length;
  const outletWet = s.wet.some(([a, b]) => b >= length - 1e-9 && b > a);
  const branch =
    s.status === 'vented' && outletWet ? Math.max(0, shot.branchFlow?.receiver ?? 0) : 0;
  const sustained = s.flow;
  const rate = sustained > 0 ? sustained : branch;
  return {
    sustained,
    branch,
    // Keep a finite final discharge distinct from zero after three-decimal rounding.
    branchReading: branch > 0 && branch < 1e-6 ? '<0.001' : (branch * 1000).toFixed(3),
    outletWet,
    kind: sustained > 0 ? ('sustained' as const) : branch > 0 ? ('branch' as const) : null,
    // This model has a free outlet and neglects the in-flight stream inventory.
    // Both ends are physical contacts, then projected with the apparatus itself.
    jet:
      rate > 0 && outletWet
        ? {
            from: siphonPoint(s.geometry, length),
            to: { x: s.geometry.outlet.x, y: s.receiverLevel },
          }
        : null,
  };
}
