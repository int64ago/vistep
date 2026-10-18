/** Textbook idealization: fixed gas amount/volume after hot sealing; pressure in Pa. */
export function sealedBowls(
  temperatureC: number,
  sealedAtC = 149.5,
  radius = 0.1,
  pull = 0,
  vented = false,
) {
  const ambient = 100000,
    cold = temperatureC + 273.15,
    hot = sealedAtC + 273.15,
    inside = vented ? ambient : (ambient * cold) / hot,
    area = Math.PI * radius * radius,
    holding = Math.max(0, ambient - inside) * area;
  return {
    inside,
    ambient,
    area,
    holding,
    opens: pull >= holding && pull > 0,
    people: holding / 200,
  };
}
export function inferSealTemperature(force = 1000, coldC = 15, radius = 0.1) {
  const fraction = force / (100000 * Math.PI * radius * radius);
  return fraction >= 1 ? null : (coldC + 273.15) / (1 - fraction) - 273.15;
}
