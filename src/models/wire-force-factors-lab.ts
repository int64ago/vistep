export type WireContacts = 'inner' | 'outer';
export function activeWireLength(contacts: WireContacts, offset = 0) {
  if (!Number.isFinite(offset)) throw new RangeError('Finite offset required.');
  const half = contacts === 'inner' ? 0.04 : 0.12,
    start = offset - half,
    end = offset + half,
    left = Math.max(-0.12, start),
    right = Math.min(0.12, end),
    effective = Math.max(0, right - left);
  return { start, end, left, right, effective, total: 2 * half };
}
export function wireForceFactors(
  current: number,
  field = 0.08,
  contacts: WireContacts = 'outer',
  offset = 0,
) {
  if (![current, field].every(Number.isFinite))
    throw new RangeError('Finite current and field required.');
  const length = activeWireLength(contacts, offset),
    force = current * field * length.effective,
    mass = 0.012,
    gravity = 9.81,
    suspension = 0.25,
    angle = Math.atan2(force, mass * gravity),
    z = suspension * Math.sin(angle),
    rise = suspension * (1 - Math.cos(angle));
  return { ...length, current, field, force, mass, gravity, suspension, angle, z, rise };
}
export function wireForceProjection(x: number, y: number, z: number) {
  return [200 + 500 * x + 200 * z, 190 - 600 * y + 180 * z] as const;
}
