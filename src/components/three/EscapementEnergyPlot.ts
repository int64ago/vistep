/** With d∈[0,1.5], post-impulse E/E₀=d+(1-d)rⁿ ≤1.5;
 * energy decreases between impulses. This domain therefore covers every allowed
 * length/time/drive, without clamping away genuine energy changes. */
export const ESC_ENERGY_PLOT = { top: 208, bottom: 284, maximum: 1.6 } as const;
export function escapementEnergyY(ratio: number) {
  return (
    ESC_ENERGY_PLOT.bottom -
    (ratio / ESC_ENERGY_PLOT.maximum) * (ESC_ENERGY_PLOT.bottom - ESC_ENERGY_PLOT.top)
  );
}
