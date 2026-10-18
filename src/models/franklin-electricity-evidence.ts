export function evidenceCharge(voltage: number, time: number, discharging = false) {
  if (![voltage, time].every(Number.isFinite) || time < 0)
    throw new RangeError('Finite voltage and nonnegative time required.');
  const capacitance = 1e-9,
    tau = discharging ? 0.8 : 1,
    charge =
      capacitance * voltage * (discharging ? Math.exp(-time / tau) : -Math.expm1(-time / tau)),
    outerCharge = -charge,
    energy = charge ** 2 / (2 * capacitance),
    foilCharge = 0.002 * charge,
    mass = 1e-5,
    length = 0.03,
    k = 8.9875517923e9;
  let lo = 0,
    hi = Math.PI / 2 - 1e-7;
  const target = (k * foilCharge ** 2) / (4 * mass * 9.81 * length ** 2);
  for (let i = 0; i < 70; i++) {
    const m = (lo + hi) / 2;
    if (Math.tan(m) * Math.sin(m) ** 2 < target) lo = m;
    else hi = m;
  }
  return {
    charge,
    outerCharge,
    energy,
    voltage: charge / capacitance,
    angle: (lo + hi) / 2,
    capacitance,
    tau,
  };
}
