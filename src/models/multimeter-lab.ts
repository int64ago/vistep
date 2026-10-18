/** SI equivalent circuit of one moving-coil head; not a manufacturer schematic. */
export const METER_HEAD = Object.freeze({
  resistance: 2000,
  fullScaleCurrent: 50e-6,
  fullScaleVoltage: 0.1,
});
export type ResistanceSpecimen = 'resistor' | 'lamp' | 'human' | 'diode';
export type CircuitFault = 'battery' | 'wire' | 'switch' | 'socket';
export type FaultProbe = 'battery' | 'wire' | 'switch' | 'lamp';
export type MeterMode = 'voltage' | 'current' | 'resistance' | 'fault';
const finite = (x: number, lo: number, hi: number, name: string) => {
  if (!Number.isFinite(x) || x < lo || x > hi)
    throw new RangeError(`${name} outside supported finite range`);
  return x;
};
const resistanceInput = (r: number) => {
  if (Number.isNaN(r) || r < 0 || r === -Infinity)
    throw new RangeError('Nonnegative resistance required');
  return r;
};
export function voltageNetwork(range: number, voltage: number) {
  finite(range, 0.1, 1200, 'Voltage range');
  finite(voltage, -2400, 2400, 'Voltage');
  const totalResistance = range / METER_HEAD.fullScaleCurrent;
  const seriesResistance = totalResistance - METER_HEAD.resistance;
  const headCurrent = voltage / totalResistance;
  const headVoltage = headCurrent * METER_HEAD.resistance;
  return {
    range,
    voltage,
    totalResistance,
    seriesResistance,
    headCurrent,
    headVoltage,
    seriesVoltage: voltage - headVoltage,
    deflection: headCurrent / METER_HEAD.fullScaleCurrent,
  };
}
export function currentNetwork(range: number, current: number) {
  finite(range, METER_HEAD.fullScaleCurrent, 10, 'Current range');
  finite(current, -20, 20, 'Current');
  const totalResistance = METER_HEAD.fullScaleVoltage / range;
  const shuntResistance =
    range === METER_HEAD.fullScaleCurrent
      ? Infinity
      : METER_HEAD.fullScaleVoltage / (range - METER_HEAD.fullScaleCurrent);
  const voltage = current * totalResistance;
  const headCurrent = voltage / METER_HEAD.resistance;
  return {
    range,
    current,
    totalResistance,
    shuntResistance,
    voltage,
    headCurrent,
    shuntCurrent: current - headCurrent,
    deflection: headCurrent / METER_HEAD.fullScaleCurrent,
  };
}
/** Switchable shunt + series resistor realize the historical scale with the SAME head.
 *  Rparallel=R0/15, Rseries=R0/gain-Rparallel; supported multipliers <=1000.
 *  1500 is the no-shunt passive limit for this 1.5V/2kohm/50uA head, not an extra UI range.
 */
export function ohmNetwork(multiplier = 10, zeroGain = 1) {
  finite(multiplier, 0.1, 1000, 'Ohms multiplier');
  finite(zeroGain, 0.05, 5, 'Zero adjustment');
  const midpoint = 20 * multiplier,
    internal = midpoint / zeroGain,
    battery = 1.5;
  const parallelResistance = (METER_HEAD.fullScaleVoltage * midpoint) / battery;
  const shuntResistance =
    (parallelResistance * METER_HEAD.resistance) / (METER_HEAD.resistance - parallelResistance);
  const seriesResistance = internal - parallelResistance;
  return {
    multiplier,
    zeroGain,
    midpoint,
    internal,
    battery,
    parallelResistance,
    shuntResistance,
    seriesResistance,
  };
}
const ohmFromCurrent = (net: ReturnType<typeof ohmNetwork>, current: number) => {
  const headVoltage = current * net.parallelResistance;
  const headCurrent = headVoltage / METER_HEAD.resistance;
  const deflection = headCurrent / METER_HEAD.fullScaleCurrent;
  return {
    ...net,
    current,
    headCurrent,
    headVoltage,
    shuntCurrent: current - headCurrent,
    seriesVoltage: current * net.seriesResistance,
    specimenVoltage: net.battery - current * net.internal,
    deflection,
    indicated: deflection > 0 ? net.midpoint * (1 / deflection - 1) : Infinity,
    calibrated: Math.abs(net.zeroGain - 1) < 0.005,
  };
};
export function ohmmeterState(resistance: number, multiplier = 10, zeroGain = 1) {
  resistanceInput(resistance);
  const net = ohmNetwork(multiplier, zeroGain);
  return {
    ...ohmFromCurrent(
      net,
      Number.isFinite(resistance) ? net.battery / (net.internal + resistance) : 0,
    ),
    resistance,
  };
}
export function diodeOhmmeter(forward = true, multiplier = 10, zeroGain = 1) {
  const net = ohmNetwork(multiplier, zeroGain),
    is = 1e-9,
    nvt = 0.0517;
  let current = 0,
    drop = 0;
  if (forward) {
    let lo = 0,
      hi = net.battery;
    for (let i = 0; i < 80; i++) {
      const vd = (lo + hi) / 2;
      if (is * Math.expm1(vd / nvt) < (net.battery - vd) / net.internal) lo = vd;
      else hi = vd;
    }
    drop = (lo + hi) / 2;
    current = (net.battery - drop) / net.internal;
  } else {
    current = is;
    drop = -(net.battery - current * net.internal);
  }
  return { ...ohmFromCurrent(net, current), drop, forward, resistance: Math.abs(drop) / current };
}
export function lampMeter(kind: 'voltage' | 'current', range: number, reversed = false) {
  const source = 3,
    lamp = 20,
    sourceResistance = 0.5;
  const rv = kind === 'voltage' ? voltageNetwork(range, 0).totalResistance : Infinity;
  const ra = kind === 'current' ? currentNetwork(range, 0).totalResistance : 0;
  const load = kind === 'voltage' ? 1 / (1 / lamp + 1 / rv) : lamp + ra;
  const sourceCurrent = source / (sourceResistance + load);
  const terminalVoltage = sourceCurrent * load;
  const lampVoltage = kind === 'voltage' ? terminalVoltage : sourceCurrent * lamp;
  const lampCurrent = lampVoltage / lamp;
  const value = (kind === 'voltage' ? lampVoltage : sourceCurrent) * (reversed ? -1 : 1);
  const network = kind === 'voltage' ? voltageNetwork(range, value) : currentNetwork(range, value);
  return {
    source,
    lamp,
    sourceResistance,
    current: sourceCurrent,
    sourceCurrent,
    voltage: terminalVoltage,
    lampCurrent,
    lampVoltage,
    meterCurrent: kind === 'voltage' ? lampVoltage / rv : sourceCurrent,
    value,
    range,
    deflection: network.deflection,
    overRange: Math.abs(network.deflection) > 1,
    reversed,
    network,
    burden: ra,
    unmeteredCurrent: source / (sourceResistance + lamp),
  };
}
/** Finite bad contacts and finite input resistance. Probe lamp includes socket+filament. */
export function faultProbeState(fault: CircuitFault, probe: FaultProbe, range = 2.5) {
  const rv = voltageNetwork(range, 0).totalResistance;
  const source = fault === 'battery' ? 0 : 1.5,
    internal = 0.5;
  const parts = [
    fault === 'wire' ? 1e9 : 0.02,
    fault === 'switch' ? 1e9 : 0.02,
    fault === 'socket' ? 1e9 : 0.02,
    10,
  ];
  const measured =
    probe === 'battery' ? [0, 1, 2, 3] : probe === 'wire' ? [0] : probe === 'switch' ? [1] : [2, 3];
  const sectionResistance = measured.reduce((s, i) => s + parts[i], 0);
  const rest = parts.reduce((s, r, i) => s + (measured.includes(i) ? 0 : r), 0);
  const equivalent = 1 / (1 / sectionResistance + 1 / rv);
  const sourceCurrent = source / (internal + rest + equivalent);
  const voltage = sourceCurrent * equivalent;
  const meterCurrent = voltage / rv,
    sectionCurrent = voltage / sectionResistance;
  const partCurrents = parts.map((_, i) => (measured.includes(i) ? sectionCurrent : sourceCurrent));
  const partVoltages = parts.map((r, i) => r * partCurrents[i]);
  const nodeVoltages = [partVoltages.reduce((a, b) => a + b, 0)];
  for (const v of partVoltages) nodeVoltages.push(nodeVoltages.at(-1)! - v);
  const lampCurrent = partCurrents[3];
  return {
    source,
    voltage,
    deflection: voltage / range,
    range,
    lampCurrent,
    lampPower: lampCurrent ** 2 * parts[3],
    fault,
    probe,
    rv,
    internal,
    sourceCurrent,
    meterCurrent,
    sectionCurrent,
    partCurrents,
    partVoltages,
    nodeVoltages,
    parts,
    measured,
    sectionResistance,
    unmeteredCurrent: source / (internal + parts.reduce((a, b) => a + b, 0)),
  };
}
export function meterNeedle(fraction: number) {
  finite(fraction, -1e8, 1e8, 'Deflection');
  const angle = ((-65 + 130 * Math.max(-0.05, Math.min(1.05, fraction))) * Math.PI) / 180;
  return { angle, x: Math.sin(angle), y: -Math.cos(angle) };
}
export type MeterShot =
  | 'voltage-external'
  | 'voltage-core'
  | 'voltage-predict'
  | 'current-external'
  | 'current-core'
  | 'current-predict'
  | 'ohm-core'
  | 'ohm-scale'
  | 'cold'
  | 'contact'
  | 'diode'
  | 'fault';
export type MeterDirection = {
  shot: MeterShot;
  mode: MeterMode;
  range: number;
  resistance: number;
  multiplier: number;
  gain: number;
  forward: boolean;
  fault: CircuitFault;
  probe: FaultProbe;
  reveal: boolean;
  progress: number;
  reversed: boolean;
};
export const METER_CHAPTER_SECONDS = Object.freeze([35, 34.5, 33.5, 28, 20, 23, 28, 24, 24, 28]);
export function multimeterDirector(
  chapter: number,
  time: number,
  locale: 'zh' | 'en' = 'zh',
): MeterDirection {
  const c = Math.max(0, Math.min(9, Number.isFinite(chapter) ? Math.floor(chapter) : 0)),
    t = Number.isFinite(time) ? Math.max(0, time) : 0,
    p = Math.min(1, t / METER_CHAPTER_SECONDS[c]);
  const d: MeterDirection = {
    shot: 'voltage-external',
    mode: 'voltage',
    range: 5,
    resistance: 470,
    multiplier: 10,
    gain: 1,
    forward: true,
    fault: 'switch',
    probe: 'battery',
    reveal: true,
    progress: p,
    reversed: false,
  };
  const en = locale === 'en';
  // Actual word timing, including each cue's 0.45s lead-in.
  if (c === 0) {
    const core = en ? 8.4 : 8.3,
      ask = en ? 16.8 : 21.25,
      answer = en ? 20.7 : 27.0;
    d.shot = t < core ? 'voltage-external' : t < ask ? 'voltage-core' : 'voltage-predict';
    d.reveal = t < ask || t >= answer;
    d.range = t >= answer ? 10 : 5;
  }
  if (c === 1) {
    const core = en ? 5.85 : 9.1,
      ask = en ? 18.75 : 24.2,
      answer = en ? 22.0 : 27.65;
    d.mode = 'current';
    d.range = t >= answer ? 0.1 : 0.5;
    d.shot = t < core ? 'current-external' : t < ask ? 'current-core' : 'current-predict';
    d.reveal = t < ask || t >= answer;
  }
  if (c === 2) {
    const open = en ? 12.7 : 15.4,
      short = en ? 16.7 : 18.8,
      zero = en ? 20.4 : 22.3,
      done = en ? 25.3 : 26.0;
    d.mode = 'resistance';
    d.shot = 'ohm-core';
    d.resistance = t >= open && t < short ? Infinity : 0;
    d.gain = 0.86 + 0.14 * Math.max(0, Math.min(1, (t - zero) / (done - zero)));
  }
  if (c === 3) {
    const ask = en ? 6.5 : 7.6,
      answer = en ? 12.75 : 12.6,
      specimen = en ? 22.15 : 22.2;
    d.mode = 'resistance';
    d.shot = 'ohm-scale';
    d.resistance = t < answer ? 200 : t < specimen ? 400 : 470;
    d.reveal = t < ask || t >= answer;
  }
  if (c === 4) {
    d.mode = 'resistance';
    d.shot = 'cold';
    d.resistance = 15;
    d.multiplier = 1;
  }
  if (c === 5) {
    d.mode = 'resistance';
    d.shot = 'contact';
    d.resistance = t < (en ? 8.45 : 9.1) ? 50000 : 100000;
    d.multiplier = 1000;
  }
  if (c === 6) {
    d.mode = 'resistance';
    d.shot = 'diode';
    d.forward = t < (en ? 12.5 : 12.6);
  }
  if (c >= 7) {
    d.mode = 'fault';
    d.shot = 'fault';
    d.range = 2.5;
    if (c === 7) {
      d.fault = t < (en ? 9.5 : 11.0) ? 'battery' : 'switch';
      d.probe = 'battery';
    }
    if (c === 8) {
      const badContact = en ? 5.3 : 5.7,
        wire = en ? 9.05 : 9.75;
      // The dark-lamp comparison begins with a good switch and bad socket.
      d.fault = t < badContact ? 'socket' : t < wire ? 'switch' : 'wire';
      d.probe = t < wire ? 'switch' : 'wire';
    }
    if (c === 9) {
      d.fault = 'socket';
      d.probe = t < (en ? 5.5 : 5.8) ? 'switch' : 'lamp';
    }
  }
  return d;
}
