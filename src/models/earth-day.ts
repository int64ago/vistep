const tau = 2 * Math.PI;
const wrap = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));
export function earthDayModel(yearDays = 12, orbit = true, retrograde = false) {
  if (!Number.isFinite(yearDays) || yearDays < 2 || yearDays > 1000)
    throw new RangeError('Year length2–1000 reference days');
  const siderealHours = (24 * yearDays) / (yearDays + 1),
    spinRate = ((retrograde ? -1 : 1) * tau) / siderealHours,
    orbitRate = orbit ? tau / (24 * yearDays) : 0,
    relativeRate = spinRate - orbitRate;
  return {
    yearDays,
    orbit,
    retrograde,
    spinRate,
    orbitRate,
    siderealHours,
    solarHours: tau / Math.abs(relativeRate),
  };
}
export function earthDayState(hours: number, yearDays = 12, orbit = true, retrograde = false) {
  if (!Number.isFinite(hours) || hours < 0 || hours > 100)
    throw new RangeError('Observation hours0–100');
  const model = earthDayModel(yearDays, orbit, retrograde),
    spin = model.spinRate * hours,
    orbital = model.orbitRate * hours;
  return {
    ...model,
    hours,
    spin,
    orbital,
    marker: Math.PI + spin,
    sunDirection: Math.PI + orbital,
    starError: wrap(spin),
    noonError: wrap(spin - orbital),
    sunFacing: Math.cos(spin - orbital),
  };
}
export function earthDayClock(hours: number) {
  if (!Number.isFinite(hours) || hours < 0) throw new RangeError('Positive clock duration');
  const seconds = Math.round(hours * 3600),
    h = Math.floor(seconds / 3600),
    m = Math.floor((seconds % 3600) / 60),
    s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}
