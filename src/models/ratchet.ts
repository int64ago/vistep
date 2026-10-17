export type RatchetPoint = { x: number; y: number };
export function ratchetGeometry(teeth = 12) {
  if (![12, 18, 24].includes(teeth)) throw new RangeError('12, 18 or 24 teeth required');
  return {
    teeth,
    pitch: (2 * Math.PI) / teeth,
    root: 0.82,
    radius: 1,
    pawlWidth: 0.075,
    pawlLength: 0.3,
    springAnchor: 1.75,
  };
}
export function ratchetVertices(angle: number, teeth = 12): RatchetPoint[] {
  if (!Number.isFinite(angle)) throw new RangeError('Finite angle required');
  const g = ratchetGeometry(teeth);
  return Array.from({ length: teeth }, (_, i) => {
    const a = angle + i * g.pitch,
      b = a + g.pitch;
    return [
      { x: Math.cos(a), y: Math.sin(a) },
      { x: g.root * Math.cos(b), y: g.root * Math.sin(b) },
    ];
  }).flat();
}
/** Exact highest polygon point under the finite flat pawl. The left edge is
 * excluded: a vertical tooth face touching that edge is not an overlap. */
export function ratchetSeat(angle: number, teeth = 12) {
  const vertices = ratchetVertices(angle, teeth),
    g = ratchetGeometry(teeth);
  let point = { x: 0, y: -Infinity };
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i],
      b = vertices[(i + 1) % vertices.length],
      dx = b.x - a.x;
    if (Math.max(a.x, b.x) < 1e-9 || Math.min(a.x, b.x) > g.pawlWidth) continue;
    let low = 0,
      high = 1;
    if (Math.abs(dx) < 1e-12) {
      if (a.x <= 1e-9) continue;
    } else {
      const t0 = (1e-9 - a.x) / dx,
        t1 = (g.pawlWidth - a.x) / dx;
      low = Math.max(0, Math.min(t0, t1));
      high = Math.min(1, Math.max(t0, t1));
    }
    if (low > high) continue;
    for (const f of [low, high]) {
      const p = { x: a.x + f * dx, y: a.y + f * (b.y - a.y) };
      if (p.y > point.y) point = p;
    }
  }
  if (!Number.isFinite(point.y)) throw new Error('Pawl footprint must intersect the wheel');
  return point;
}
export function ratchetState(advance: number, rollback: number, teeth = 12, lift = 0) {
  if (
    ![advance, rollback, lift].every(Number.isFinite) ||
    advance < 0 ||
    advance > 8 * Math.PI ||
    rollback < 0 ||
    rollback > 4 * Math.PI ||
    lift < 0 ||
    lift > 1
  )
    throw new RangeError('Bounded nonnegative history and lift from zero to one required');
  const g = ratchetGeometry(teeth),
    stop = Math.floor((advance + 1e-10) / g.pitch) * g.pitch,
    request = advance - rollback,
    held = Math.max(request, stop),
    seat = ratchetSeat(Math.PI / 2 + held, teeth),
    pawlBottom = seat.y + 0.36 * lift,
    released = pawlBottom > g.radius + 0.005,
    output = released ? request : held,
    angle = Math.PI / 2 + output,
    contact = ratchetSeat(angle, teeth);
  return {
    ...g,
    advance,
    rollback,
    request,
    output,
    angle,
    stop,
    backlash: advance - stop,
    actualRollback: advance - output,
    blocked: !released && request < stop - 1e-9,
    released,
    lift,
    pawlBottom: lift > 0 ? pawlBottom : contact.y,
    contact,
    vertices: ratchetVertices(angle, teeth),
  };
}
export function ratchetShot(chapter: number, progress: number) {
  const u = Math.min(1, Math.max(0, progress)),
    pitch = Math.PI / 6;
  let advance = 3 * pitch * u,
    rollback = 0,
    teeth = 12,
    lift = 0;
  if (chapter === 1) advance = pitch * (0.02 + 0.98 * u);
  if (chapter === 2) {
    advance = 1.65 * pitch;
    rollback = 0.65 * pitch * u;
  }
  if (chapter === 3) {
    advance = 1.65 * pitch;
    rollback = pitch * (0.65 + 1.1 * u);
  }
  if (chapter === 4) {
    advance = 1.65 * pitch;
    rollback = 0.65 * pitch;
    lift = Math.min(1, u / 0.4);
    if (u > 0.4) rollback += (pitch * (u - 0.4)) / 0.6;
  }
  if (chapter === 5) {
    teeth = u < 0.5 ? 12 : 24;
    advance = (22 * Math.PI) / 180;
    rollback = ((u < 0.5 ? u * 2 : (u - 0.5) * 2) * 30 * Math.PI) / 180;
  }
  return ratchetState(advance, rollback, teeth, lift);
}
