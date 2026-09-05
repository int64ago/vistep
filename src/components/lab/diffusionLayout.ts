import type { DiffusionField, DiffusionView } from '../../models/diffusion';

/** Fixed across time within a comparison, including the conserved sum of both species. */
export function diffusionPlotMaximum(field: DiffusionField, second: DiffusionField | null = null) {
  const bound = (f: DiffusionField) =>
    f.p.kind === 'mix'
      ? (2 * f.p.mass) / f.p.length
      : f.p.kind === 'reservoir'
        ? 1
        : ((128 / 35) * f.p.mass) / f.p.length;
  return (
    Math.max(bound(field), second ? bound(second) : 0) *
    (field.p.kind === 'reservoir' ? 1.08 : 1.06)
  );
}

export function diffusionPlotLayout(
  width: number,
  view: DiffusionView,
  compare: boolean,
  phoneFilm: boolean,
) {
  const small = width < 500,
    compact = phoneFilm && small;
  const top = compact ? 34 : 40,
    barH = compact ? (compare ? 28 : 40) : compare ? 46 : 64;
  const plotY = compact
    ? compare
      ? 160
      : view === 'reservoir'
        ? 176
        : view === 'budget'
          ? 166
          : view === 'flux'
            ? 150
            : 130
    : compare
      ? 228
      : view === 'reservoir'
        ? 196
        : view === 'budget'
          ? 194
          : 170;
  const plotH = compact ? 110 : small ? 115 : 178;
  return {
    top,
    barH,
    plotY,
    plotH,
    height: plotY + plotH + (compact ? 40 : 46),
    secondTitle: compact ? 84 : 120,
    secondTop: compact ? 96 : 138,
    boundaryLabel: compact ? 108 : 132,
    boundaryFlux: compact ? 132 : 156,
    fluxArrow: compact ? 104 : 133,
    budgetArrow: compact ? 98 : 124,
    budgetValue: compact ? 123 : 149,
    reservoirArrow: compact ? 58 : 84,
  };
}
