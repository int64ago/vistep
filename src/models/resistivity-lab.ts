export type WireMaterial = 'copper' | 'nickel-copper' | 'nichrome';
export const WIRE_MATERIALS = {
  copper: { rho: 1.7e-8, alpha: 0.0039 },
  'nickel-copper': { rho: 5e-7, alpha: 0.00003 },
  nichrome: { rho: 1e-6, alpha: 0.0004 },
};
export function wireState(
  length = 0.5,
  diameter = 0.2,
  material: WireMaterial = 'nickel-copper',
  temperature = 20,
) {
  if (
    ![length, diameter, temperature].every(Number.isFinite) ||
    length <= 0 ||
    diameter <= 0 ||
    temperature < 0 ||
    temperature > 400 ||
    !WIRE_MATERIALS[material]
  )
    throw new RangeError('Physical uniform wire parameters required.');
  const m = WIRE_MATERIALS[material],
    area = (Math.PI * (diameter / 1000) ** 2) / 4,
    rho = m.rho * (1 + m.alpha * (temperature - 20)),
    resistance = (rho * length) / area;
  return { length, diameter, material, temperature, area, rho, resistance };
}
export function seriesWireComparison(sourceVoltage = 6, seriesResistance = 10) {
  const wires = [
      wireState(0.25, 0.2),
      wireState(0.5, 0.2),
      wireState(0.25, 0.2 * Math.SQRT2),
      wireState(0.25, 0.2, 'nichrome'),
    ],
    current = sourceVoltage / (seriesResistance + wires.reduce((sum, w) => sum + w.resistance, 0));
  return {
    current,
    wires: wires.map((w) => ({ ...w, voltage: current * w.resistance })),
    sourceVoltage,
    seriesResistance,
  };
}
export type MeterConnection = 'external' | 'internal';
export function wireMeasurement(
  wire = wireState(),
  sourceVoltage = 3,
  seriesResistance = 10,
  connection: MeterConnection = 'external',
  ammeterResistance = 0.2,
  voltmeterResistance = 1000,
) {
  if (
    ![sourceVoltage, seriesResistance, ammeterResistance, voltmeterResistance].every(
      Number.isFinite,
    ) ||
    sourceVoltage < 0 ||
    seriesResistance < 0 ||
    ammeterResistance < 0 ||
    voltmeterResistance <= 0
  )
    throw new RangeError('Physical circuit and meter parameters required.');
  const r = wire.resistance,
    branch = connection === 'external' ? r : r + ammeterResistance,
    parallel = 1 / (1 / branch + 1 / voltmeterResistance),
    totalCurrent =
      sourceVoltage /
      (seriesResistance + parallel + (connection === 'external' ? ammeterResistance : 0)),
    voltage = totalCurrent * parallel,
    wireCurrent = voltage / branch,
    ammeterCurrent = connection === 'external' ? totalCurrent : wireCurrent,
    voltmeterCurrent = voltage / voltmeterResistance,
    apparentResistance =
      sourceVoltage === 0
        ? connection === 'external'
          ? parallel
          : branch
        : voltage / ammeterCurrent,
    apparentRho = (apparentResistance * wire.area) / wire.length;
  return {
    ...wire,
    sourceVoltage,
    seriesResistance,
    connection,
    totalCurrent,
    voltage,
    wireVoltage: wireCurrent * r,
    wireCurrent,
    ammeterCurrent,
    voltmeterCurrent,
    apparentResistance,
    apparentRho,
    relativeError: (apparentRho - wire.rho) / wire.rho,
    ammeterResistance,
    voltmeterResistance,
  };
}
export function fitWireSamples(
  wire = wireState(),
  connection: MeterConnection = 'external',
  ammeterResistance = 0.2,
  voltmeterResistance = 1000,
) {
  const samples = [0.6, 1.2, 1.8, 2.4, 3].map((e) =>
      wireMeasurement(wire, e, 10, connection, ammeterResistance, voltmeterResistance),
    ),
    slope =
      samples.reduce((s, p) => s + p.ammeterCurrent * p.voltage, 0) /
      samples.reduce((s, p) => s + p.ammeterCurrent ** 2, 0);
  return { samples, slope, rho: (slope * wire.area) / wire.length };
}
export function heatedFilament(temperature = 20) {
  if (!Number.isFinite(temperature) || temperature < 20 || temperature > 300)
    throw new RangeError('Teaching range is 20–300 °C.');
  const filamentResistance = 10 * (1 + 0.0045 * (temperature - 20)),
    lampResistance = 20,
    current = 6 / (filamentResistance + lampResistance),
    lampPower = current ** 2 * lampResistance,
    baselinePower = (6 / 30) ** 2 * 20;
  return {
    temperature,
    filamentResistance,
    lampResistance,
    current,
    lampPower,
    relativeLampPower: lampPower / baselinePower,
  };
}
export function inferResistivity(
  resistance: number,
  measuredLength: number,
  measuredDiameter: number,
) {
  if (
    ![resistance, measuredLength, measuredDiameter].every(Number.isFinite) ||
    resistance < 0 ||
    measuredLength <= 0 ||
    measuredDiameter <= 0
  )
    throw new RangeError('Positive measured dimensions required.');
  return (resistance * Math.PI * (measuredDiameter / 1000) ** 2) / (4 * measuredLength);
}
