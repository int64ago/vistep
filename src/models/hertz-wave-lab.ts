export const LIGHT_SPEED = 299792458;
export function hertzPulse(time: number, distance = 0, angle = 0, frequency = 1e8) {
  const delay = Math.max(0, distance) / LIGHT_SPEED,
    local = time - delay;
  const emitted = (u: number) =>
    u < 0 ? 0 : Math.exp(-u / 25e-9) * Math.sin(2 * Math.PI * frequency * u);
  return {
    source: emitted(time),
    received: (emitted(local) * Math.cos(angle)) / (1 + Math.max(0, distance)),
    delay,
    wavelength: LIGHT_SPEED / frequency,
    local,
  };
}
export function standingField(x: number, time: number, wall = 6, frequency = 1e8) {
  const k = (2 * Math.PI * frequency) / LIGHT_SPEED,
    w = 2 * Math.PI * frequency;
  return Math.sin(w * time - k * x) - Math.sin(w * time + k * x - 2 * k * wall);
}
export function snellAngle(incident: number, index = 1.5) {
  return Math.asin(Math.sin(incident) / Math.max(1, index));
}
export function slitIntensity(angle: number, width = 1.2, wavelength = 1) {
  const b = (Math.PI * width * Math.sin(angle)) / wavelength;
  return Math.abs(b) < 1e-8 ? 1 : (Math.sin(b) / b) ** 2;
}
export function hertzShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    mode: Math.min(5, chapter),
    time: p * 120e-9,
    angle: chapter === 4 ? (p * Math.PI) / 2 : 0,
    incident: ((20 + p * 35) * Math.PI) / 180,
    width: chapter === 5 ? (p < 0.5 ? 2 : 0.7) : 1.2,
  };
}
