export const soilClamp = (n: number, a = 0, b = 1) =>
  Math.max(a, Math.min(b, Number.isFinite(n) ? n : a));
export function litterState(days: number, activity = 1, moisture = 0.5) {
  const t = soilClamp(days, 0, 60),
    a = soilClamp(activity),
    m = soilClamp(moisture),
    rate = 0.065 * a * 4 * m * (1 - m);
  return { days: t, remaining: Math.exp(-rate * t), rate };
}
/** Carbon equivalents, not equal masses of hydrated starch and glucose. */
export function starchState(days: number, active = true, consumption = 0.12) {
  const t = soilClamp(days, 0, 30),
    k = active ? 0.55 : 0,
    d = active ? soilClamp(consumption, 0, 2) : 0,
    starch = Math.exp(-k * t);
  const reducing =
    k === 0
      ? 0
      : Math.abs(d - k) < 1e-8
        ? k * t * Math.exp(-k * t)
        : (k / (d - k)) * (Math.exp(-k * t) - Math.exp(-d * t));
  return { starch, reducing: soilClamp(reducing), used: soilClamp(1 - starch - reducing) };
}
export function sampleTransfer(progress: number, width = 320) {
  const p = soilClamp(progress),
    z = p * 2,
    part = Math.min(1, Math.floor(z)),
    q = p === 1 ? 1 : z - part,
    sourceX = width * 0.2,
    targetX = width * (part === 0 ? 0.57 : 0.82),
    drawn = 10 * soilClamp(q / 0.18),
    dispensed = 10 * soilClamp((q - 0.54) / 0.24);
  let x = sourceX,
    y = 230;
  if (q >= 0.18 && q < 0.3) y = 230 - (110 * (q - 0.18)) / 0.12;
  if (q >= 0.3 && q < 0.46) {
    x = sourceX + ((targetX - sourceX) * (q - 0.3)) / 0.16;
    y = 120;
  }
  if (q >= 0.46 && q < 0.54) {
    x = targetX;
    y = 120 + (30 * (q - 0.46)) / 0.08;
  }
  if (q >= 0.54 && q < 0.78) {
    x = targetX;
    y = 150;
  }
  if (q >= 0.78 && q < 0.86) {
    x = targetX;
    y = 150 - (30 * (q - 0.78)) / 0.08;
  }
  if (q >= 0.86 && q < 0.94) {
    x = targetX + ((sourceX - targetX) * (q - 0.86)) / 0.08;
    y = 120;
  }
  if (q >= 0.94) y = 120 + (110 * (q - 0.94)) / 0.06;
  const tubes = [part === 0 ? dispensed : 10, part === 1 ? dispensed : 0];
  return {
    part,
    q,
    x,
    y,
    source: 40 - 10 * part - drawn,
    pipette: drawn - dispensed,
    tubes,
    dispensing: q >= 0.54 && q < 0.78,
  };
}
export function reagentDrops(progress: number) {
  const p = soilClamp(progress);
  return Array.from({ length: 3 }, (_, id) => {
    const phase = soilClamp((p - (0.08 + id * 0.1)) / 0.08);
    return { id, phase, arrived: phase === 1, visible: phase > 0 && phase < 1 };
  });
}
export function assayResult(
  days = 7,
  active = true,
  consumption = 0.12,
  heated = true,
  progress = 1,
) {
  const state = starchState(days, active, consumption),
    drops = reagentDrops(progress),
    reagent = drops.filter((x) => x.arrived).length / 3,
    heat = heated ? soilClamp((progress - 0.5) / 0.35) : 0;
  return {
    ...state,
    reagent,
    heat,
    iodine: soilClamp((state.starch - 0.03) / 0.3) * reagent,
    precipitate: state.reducing > 0.06 ? soilClamp(state.reducing * 2) * heat * reagent : 0,
    liquidMl: 10 + 0.3 * reagent,
  };
}
export function litterRecord(initial: string, final: string) {
  if (initial.trim() === '' || final.trim() === '') return null;
  const a = Number(initial),
    b = Number(final);
  return Number.isFinite(a) && Number.isFinite(b) && a > 0 && b >= 0
    ? { initial: a, final: b, loss: (a - b) / a }
    : null;
}
export const leafHoles = Array.from({ length: 10 }, (_, id) => ({
  id,
  x: ((id * 7) % 17) - 8,
  y: -21 + Math.floor(id / 2) * 10,
  r: 2 + (id % 3),
}));

/** Closed carbon-equivalent bookkeeping, not a fit or an assay calibration. */
export function carbonPools(days: number, hydrolysis = 0.55, use = 0.12) {
  const t = soilClamp(days, 0, 30),
    k = soilClamp(hydrolysis, 0, 2),
    d = soilClamp(use, 0, 2);
  const polymer = Math.exp(-k * t);
  const soluble =
    k === 0
      ? 0
      : Math.abs(k - d) < 1e-8
        ? k * t * Math.exp(-k * t)
        : (k / (d - k)) * (Math.exp(-k * t) - Math.exp(-d * t));
  return {
    polymer,
    soluble: soilClamp(soluble),
    other: soilClamp(1 - polymer - soluble),
    hydrolysisFlux: k * polymer,
    useFlux: d * soluble,
  };
}
const ease = (v: number) => {
  const x = soilClamp(v);
  return x * x * (3 - 2 * x);
};
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
/** A schematic selected carbon batch. These blocks are neither molecules nor six free C atoms.
 * Enzyme cleavage is outside the cell. Multiple subsequent reactions are explicitly grouped.
 * Every entering marker crosses the same drawn transporter opening, never solid membrane.
 */
export function decomposerPath(progress: number, width = 272, enzyme = true, uptake = true) {
  const p = soilClamp(progress),
    w = soilClamp(width, 240, 1200),
    gate = {
      x: w / 2,
      y: 157,
      half: 20,
      top: 149,
      bottom: 170,
      wallStroke: 5,
      membraneStroke: 3,
      markerHalfWidth: 14,
      markerHalfHeight: 11,
      markerStroke: 1,
    };
  // Clear the marker’s full outer edge before beginning any lateral travel.
  const exitY =
    gate.bottom + gate.wallStroke / 2 + gate.markerHalfHeight + gate.markerStroke / 2 + 3;
  const cut = enzyme ? ease((p - 0.22) / 0.12) : 0,
    further = enzyme ? ease((p - 0.35) / 0.13) : 0;
  const units = Array.from({ length: 6 }, (_, id) => {
    const start = { x: 24 + (id * (w - 48)) / 5, y: 75 };
    const loose = { x: start.x, y: start.y };
    let x = loose.x,
      y = loose.y;
    const q = enzyme && uptake ? soilClamp((p - (0.5 + id * 0.075)) / 0.11) : 0;
    const end = { x: 44 + (id * (w - 88)) / 5, y: 212 };
    if (q > 0 && q <= 0.15) {
      x = loose.x;
      y = mix(loose.y, 129, ease(q / 0.15));
    } else if (q <= 0.4 && q > 0.15) {
      x = mix(loose.x, gate.x, ease((q - 0.15) / 0.25));
      y = 129;
    } else if (q <= 0.65 && q > 0.4) {
      x = gate.x;
      y = mix(129, exitY, (q - 0.4) / 0.25);
    } else if (q <= 0.85 && q > 0.65) {
      x = mix(gate.x, end.x, ease((q - 0.65) / 0.2));
      y = exitY;
    } else if (q > 0.85) {
      x = end.x;
      y = mix(exitY, end.y, ease((q - 0.85) / 0.15));
    }
    return { id: `C${id + 1}`, x, y, q, inside: y > 169 };
  });
  return {
    units,
    gate,
    cut,
    further,
    enzyme: { x: w / 2, y: mix(40, 63, ease(p / 0.2)) },
    bonds: units.slice(0, 5).map((a, i) => ({
      id: `bond-${i}`,
      a: a.id,
      b: units[i + 1].id,
      intact: i === 2 ? 1 - cut : 1 - further,
    })),
  };
}
const unitRandom = (id: number, salt: number) => {
  let x = Math.imul(Math.floor(id) + 1, 2654435761) ^ salt;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  x ^= x >>> 16;
  return ((x >>> 0) + 0.5) / 4294967296;
};
/** Independent exponential waiting times. A finite selected sample, not the exact analytic fractions. */
export function carbonMarker(id: number, days: number, hydrolysis = 0.55, use = 0.12, width = 272) {
  const t = soilClamp(days, 0, 30),
    k = soilClamp(hydrolysis, 0, 2),
    d = soilClamp(use, 0, 2),
    w = soilClamp(width, 240, 1200);
  const release = k > 0 ? -Math.log(unitRandom(id, 117)) / k : Infinity;
  const uptake = d > 0 ? release - Math.log(unitRandom(id, 7919)) / d : Infinity;
  const x = 24 + ((id % 24) * (w - 48)) / 23;
  // Center motion on each committed event. The center crosses the drawn shared
  // boundary at the exact exponential waiting time; transitions never overlap.
  const gap = uptake - release;
  const halfRelease = Number.isFinite(release)
    ? Math.min(0.2, release / 3, Number.isFinite(gap) ? gap / 3 : 0.2)
    : 1;
  const halfUptake = Number.isFinite(uptake) ? Math.min(0.2, gap / 3) : 1;
  const r = Number.isFinite(release) ? ease((t - release + halfRelease) / (2 * halfRelease)) : 0;
  const u = Number.isFinite(uptake) ? ease((t - uptake + halfUptake) / (2 * halfUptake)) : 0;
  const y = mix(mix(52, 133, r), 214, u);
  return {
    id: `carbon-${id}`,
    x,
    y,
    pool: (t >= uptake ? 'other' : t >= release ? 'soluble' : 'polymer') as
      'polymer' | 'soluble' | 'other',
    release,
    uptake,
  };
}
export const soilChapterSeconds = [28, 31.5, 29, 28.5, 29.5, 27.5, 28, 28, 33] as const;
export function soilDirector(chapter: number, time: number, locale: 'zh' | 'en' = 'zh') {
  const c = Math.round(soilClamp(chapter, 0, 8)),
    t = soilClamp(time, 0, 300),
    p = (a: number, b: number) => soilClamp((t - a) / (b - a));
  let shot = 'pots',
    progress = 0,
    day = 7,
    use = 0.12,
    moisture = 0.5,
    group = 0;
  const en = locale === 'en';
  let enzyme = true,
    uptake = true,
    heat = true;
  if (c === 0) {
    shot = t < 4.2 ? 'litter-question' : 'pots';
    progress = t < 4.2 ? 1 : p(7, 23);
  }
  if (c === 1) {
    shot = 'mechanism';
    // Hold the intact tracked batch while it is named, then cut and pass it.
    const cutAt = en ? 11.3 : 10;
    progress =
      t < cutAt
        ? 0.2 * p(1, 3)
        : t < cutAt + 2
          ? 0.2 + 0.3 * p(cutAt, cutAt + 2)
          : 0.5 + 0.5 * p(cutAt + 2, cutAt + 7);
    // Explicit alternative condition, not a reversal of the original event.
    enzyme = t < (en ? 25.5 : 24.6);
  }
  if (c === 2) {
    const change = en ? 11.7 : 13.9;
    shot = t < change ? 'records' : 'moisture';
    progress = p(change, change + 4);
    moisture = mix(0.5, 0.03, ease(progress));
  }
  if (c === 3) {
    const change = en ? 8.25 : 9.55;
    shot = t < change ? 'puzzle' : 'extract';
    progress = p(change + 1, change + 6);
  }
  if (c === 4) {
    shot = t < 7.2 ? 'pair' : 'starch-mechanism';
    progress = t < 7.2 ? p(0.8, 6.5) : p(7.4, 13.4);
    uptake = t < 13.7;
    enzyme = t < (en ? 17.8 : 17.4);
  }
  if (c === 5) {
    shot = 'split';
    group = t < 14 ? 0 : 1;
    progress = group === 0 ? p(1, 12) : p(14.5, 25.5);
  }
  if (c === 6) {
    shot = 'iodine';
    progress = p(0.5, 8);
  }
  if (c === 7) {
    shot = 'fehling';
    progress = p(0.5, 6.5);
    // Compare fresh unheated aliquots; do not imply precipitate dissolves on cooling.
    heat = t < (en ? 12.2 : 10.3) || t >= (en ? 15.7 : 14.1);
  }
  if (c === 8) {
    shot = t < 6.8 ? 'predict' : 'pools';
    day = 7 * p(6.8, 18.2);
    use = 1.2;
    progress = p(6.8, 18.2);
  }
  return {
    chapter: c,
    shot,
    progress,
    day,
    use,
    moisture,
    group,
    heat,
    enzyme,
    uptake,
    reveal: c === 8 ? t >= 18.2 : true,
  };
}
