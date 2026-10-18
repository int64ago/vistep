export type ResistanceSpecimen = 'resistor' | 'lamp' | 'human' | 'diode';
export function ohmmeterState(resistance: number, multiplier = 10, zeroGain = 1) {
  if (
    Number.isNaN(resistance) ||
    resistance < 0 ||
    ![multiplier, zeroGain].every(Number.isFinite) ||
    multiplier <= 0 ||
    zeroGain <= 0
  )
    throw new RangeError('Nonnegative resistance and calibrated positive range required.');
  const midpoint = 20 * multiplier,
    internal = midpoint / zeroGain,
    current = Number.isFinite(resistance) ? 1.5 / (internal + resistance) : 0,
    deflection = current / (1.5 / midpoint),
    indicated = deflection > 0 ? midpoint * (1 / deflection - 1) : Infinity;
  return {
    resistance,
    multiplier,
    midpoint,
    internal,
    current,
    deflection,
    indicated,
    zeroGain,
    calibrated: Math.abs(zeroGain - 1) < 0.005,
  };
}
export function diodeOhmmeter(forward = true, multiplier = 10, zeroGain = 1) {
  const base = ohmmeterState(0, multiplier, zeroGain),
    voltage = 1.5,
    is = 1e-9,
    nvt = 0.0517;
  let current = 0,
    drop = 0;
  if (forward) {
    let lo = 0,
      hi = voltage;
    for (let i = 0; i < 80; i++) {
      const vd = (lo + hi) / 2,
        diode = is * Math.expm1(vd / nvt),
        circuit = (voltage - vd) / base.internal;
      if (diode < circuit) lo = vd;
      else hi = vd;
    }
    drop = (lo + hi) / 2;
    current = (voltage - drop) / base.internal;
  } else {
    current = is;
    drop = -(voltage - current * base.internal);
  }
  const deflection = current / (voltage / base.midpoint),
    indicated = base.midpoint * (1 / deflection - 1);
  return { ...base, current, deflection, indicated, drop, forward };
}
export function lampMeter(kind: 'voltage' | 'current', range: number, reversed = false) {
  if (!Number.isFinite(range) || range <= 0) throw new RangeError('Positive range required.');
  const source = 3,
    lamp = 20,
    sourceResistance = 0.5,
    rv = 20000 * range,
    ra = 0.5,
    load = kind === 'voltage' ? 1 / (1 / lamp + 1 / rv) : lamp + ra,
    current = source / (sourceResistance + load),
    voltage = current * load,
    value = (kind === 'voltage' ? voltage : current) * (reversed ? -1 : 1),
    deflection = value / range;
  return {
    source,
    lamp,
    current,
    voltage,
    value,
    range,
    deflection,
    overRange: Math.abs(deflection) > 1,
    reversed,
  };
}
export type CircuitFault = 'battery' | 'wire' | 'switch' | 'socket';
export type FaultProbe = 'battery' | 'wire' | 'switch' | 'lamp';
export function faultProbeState(fault: CircuitFault, probe: FaultProbe, range = 2.5) {
  if (!Number.isFinite(range) || range <= 0)
    throw new RangeError('Positive voltage range required.');
  const source = fault === 'battery' ? 0 : 1.5,
    rv = 20000 * range,
    internal = 0.5,
    wire = fault === 'wire' ? 1e9 : 0.02,
    switchR = fault === 'switch' ? 1e9 : 0.02,
    socket = fault === 'socket' ? 1e9 : 0.02,
    lamp = 10,
    parts = [wire, switchR, socket + lamp],
    total = parts.reduce((a, b) => a + b, 0);
  let voltage = 0,
    lampCurrent = 0;
  if (probe === 'battery') {
    const parallel = 1 / (1 / total + 1 / rv);
    voltage = (source * parallel) / (internal + parallel);
    lampCurrent = voltage / total;
  } else {
    const k = probe === 'wire' ? 0 : probe === 'switch' ? 1 : 2,
      equivalent = 1 / (1 / parts[k] + 1 / rv),
      current = source / (internal + total - parts[k] + equivalent);
    voltage = current * equivalent;
    lampCurrent = k === 2 ? voltage / parts[k] : current;
  }
  return {
    source,
    voltage,
    deflection: voltage / range,
    range,
    lampCurrent,
    lampPower: lampCurrent ** 2 * lamp,
    fault,
    probe,
  };
}
