/** Textbook lamp circuits, lamps approximated by fixed resistances. SI units. */
export function switchOn(time: number, inductance = 6) {
  const source = 6,
    series = 1,
    branch = 8,
    lamp = 6;
  const vThevenin = (source * branch) / (series + branch),
    rThevenin = (series * branch) / (series + branch);
  const maximum = vThevenin / (branch + rThevenin),
    tau = inductance / (branch + rThevenin);
  const iCoil = inductance <= 0 ? maximum : maximum * (1 - Math.exp(-Math.max(0, time) / tau));
  const bus = (source - series * iCoil) / (1 + series / branch),
    iControl = bus / branch;
  return {
    iCoil,
    iControl,
    pCoil: iCoil * iCoil * lamp,
    pControl: iControl * iControl * lamp,
    tau,
    bus,
    energy: 0.5 * Math.max(0, inductance) * iCoil * iCoil,
  };
}
export function switchOff(time: number, windingResistance = 2, inductance = 6) {
  const voltage = 6,
    load = 6,
    r = Math.max(0.5, windingResistance),
    L = Math.max(0.001, inductance);
  const initial = voltage / r,
    beforeLoad = voltage / load,
    tau = L / (r + load);
  const isBefore = time < 0;
  const iCoil = isBefore ? initial : initial * Math.exp(-time / tau);
  const iLoad = isBefore ? beforeLoad : -iCoil;
  const energy = 0.5 * L * iCoil * iCoil;
  return {
    iCoil,
    iLoad,
    initial,
    beforeLoad,
    tau,
    energy,
    loadPower: iLoad * iLoad * load,
    windingPower: iCoil * iCoil * r,
    voltage: Math.abs(iLoad) * load,
    closed: isBefore,
  };
}
export function sensorRise(time: number, inductance = 6) {
  const t = Math.max(0, time),
    maximum = 0.75,
    tau = inductance / 8;
  return inductance <= 0 ? maximum : maximum * (1 - Math.exp(-t / tau));
}
export function selfInductionShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    mode: chapter < 3 ? ('on' as const) : ('off' as const),
    sensor: chapter === 2 || chapter === 6,
    resistance: chapter === 5 ? 10 : 2,
    time:
      chapter === 6
        ? p * 4 - 0.4
        : chapter === 0
          ? 8
          : chapter < 3
            ? p * 4
            : chapter === 3
              ? p < 0.3
                ? -0.1
                : ((p - 0.3) / 0.7) * 3
              : p * 3,
    stage: chapter,
  };
}
