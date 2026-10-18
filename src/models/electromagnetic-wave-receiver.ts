export const EM_C = 299792458;
/** A finite, illustrative spark-excited RF packet; time in nanoseconds. */
export function sparkPacket(timeNs: number) {
  if (!Number.isFinite(timeNs)) throw new RangeError('Finite time required');
  const duration = 120,
    envelope = timeNs > 0 && timeNs < duration ? Math.sin((Math.PI * timeNs) / duration) ** 2 : 0;
  return { envelope, field: envelope * Math.sin(2 * Math.PI * 0.05 * timeNs) };
}
export function receivedWave(timeNs: number, distance: number, enabled = true) {
  if (!Number.isFinite(distance) || distance < 4 || !Number.isFinite(timeNs))
    throw new RangeError('Far-field comparison requires finite distance ≥4m');
  const delay = (distance / EM_C) * 1e9,
    retarded = timeNs - delay,
    s = sparkPacket(retarded),
    amplitude = enabled ? 4 / distance : 0,
    electric = s.field * amplitude;
  return { delay, retarded, envelope: s.envelope * amplitude, electric, magnetic: electric / EM_C };
}
/** Square-law detector followed by a 40ns response, not a bare DC ammeter. */
export function receiverIndication(timeNs: number, distance: number, enabled = true) {
  const w = receivedWave(timeNs, distance, enabled),
    tau = 40,
    dt = 0.5,
    end = Math.max(0, w.retarded);
  let response = 0;
  for (let u = dt / 2; u < Math.min(end, 120); u += dt) {
    const env = sparkPacket(u).envelope;
    response += (env * env * Math.exp(-(end - u) / tau) * dt) / tau;
  }
  return { ...w, response: enabled ? response * (4 / distance) ** 2 : 0 };
}
