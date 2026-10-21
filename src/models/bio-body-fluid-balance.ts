const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, Number.isFinite(v) ? v : a));
export function extracellularTracer(time: number, lymphOpen = true) {
  const end = clamp(time, 0, 40),
    dt = 0.02,
    volume = [3, 12, 1];
  let amount = [1, 0, 0];
  for (let t = 0; t < end - 1e-8; t += dt) {
    const step = Math.min(dt, end - t),
      c = amount.map((m, i) => m / volume[i]);
    const bt = 0.4 * c[0],
      tb = (lymphOpen ? 0.3 : 0.4) * c[1],
      tl = lymphOpen ? 0.1 * c[1] : 0,
      lb = lymphOpen ? 0.1 * c[2] : 0;
    amount = [
      amount[0] + (-bt + tb + lb) * step,
      amount[1] + (bt - tb - tl) * step,
      amount[2] + (tl - lb) * step,
    ];
  }
  return {
    amount,
    volume,
    concentration: amount.map((m, i) => m / volume[i]),
    total: amount.reduce((a, b) => a + b, 0),
  };
}
export const practiceTemperatureRecords = [36.3, 36.4, 36.5, 36.8, 36.9, 36.7, 36.6];
export const practiceHousehold = [
  practiceTemperatureRecords,
  [36.2, 36.3, 36.5, 36.7, 36.8, 36.6, 36.4],
  [36.5, 36.5, 36.7, 37, 37.1, 36.9, 36.7],
];
export const practiceAirTemperature = [18, 21, 25, 28, 25, 22, 20];
export const temperatureTimes = [6, 9, 12, 15, 18, 21, 23];
export function temperatureSummary(records: (number | null)[]) {
  const valid = records.filter((v): v is number => v !== null && Number.isFinite(v));
  return {
    count: valid.length,
    mean: valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null,
    range: valid.length ? Math.max(...valid) - Math.min(...valid) : null,
  };
}
export function thermalRegulation(time: number, heat = 1, feedback = true) {
  const end = clamp(time, 0, 12),
    dt = 0.02;
  let deviation = 0,
    removed = 0,
    input = 0;
  for (let t = 0; t < end - 1e-8; t += dt) {
    const step = Math.min(dt, end - t),
      drive = clamp(heat, -1, 2) * (t < 4 ? 0.5 : 0),
      response = (feedback ? 0.65 : 0.08) * deviation;
    input += drive * step;
    removed += response * step;
    deviation += (drive - response) * step;
  }
  return {
    deviation,
    removed,
    input,
    drive: clamp(heat, -1, 2) * (end < 4 ? 0.5 : 0),
    response: (feedback ? 0.65 : 0.08) * deviation,
  };
}
/** Selected terminal delivery and reabsorption, in relative amount per teaching-time.
 * This is not GFR or a whole-nephron clearance calculation. Water permeability
 * needs a maintained osmotic driving difference; sodium throughput needs a pump. */
export function renalPartition(signal: number, response = true, driver = 1) {
  const h = Math.max(0, Number.isFinite(signal) ? signal : 0),
    activation = response ? h / (1 + h) : 0,
    delivery = 0.1,
    capacity = 0.075 + 0.025 * activation,
    reabsorbed = capacity * clamp(driver),
    urine = delivery - reabsorbed;
  return { delivery, capacity, activation, reabsorbed, urine };
}
export function waterRegulation(time: number, loss = 1, response = true, gradient = 1) {
  const end = clamp(time, 0, 10),
    dt = 0.02;
  let water = 1,
    urineTotal = 0,
    lossTotal = 0,
    intakeTotal = 0,
    delivered = 0,
    reabsorbedTotal = 0;
  for (let t = 0; t < end - 1e-8; t += dt) {
    const step = Math.min(dt, end - t),
      signal = Math.max(0, 1 / water - 1) * 8,
      route = renalPartition(signal, response, gradient),
      external = clamp(loss, 0, 2) * (t < 3 ? 0.04 : 0),
      intake = 0.025;
    // Domain bounds keep water >= .01 even at maximum loss and zero gradient.
    // Do not clamp stock after integration: that would manufacture unaccounted water.
    water += (intake - external - route.urine) * step;
    urineTotal += route.urine * step;
    lossTotal += external * step;
    intakeTotal += intake * step;
    delivered += route.delivery * step;
    reabsorbedTotal += route.reabsorbed * step;
  }
  const osmolarity = 1 / water,
    signal = Math.max(0, osmolarity - 1) * 8,
    route = renalPartition(signal, response, gradient);
  return {
    water,
    osmolarity,
    signal,
    urine: route.urine,
    urineTotal,
    lossTotal,
    intakeTotal,
    delivered,
    reabsorbedTotal,
    route,
  };
}
/** Fixed water isolates a sodium amount ledger. Deficit is a feedback proxy;
 * it is NOT a direct adrenal sodium sensor or a model of the renin/angiotensin/K system. */
export function sodiumRegulation(time: number, loss = 1, response = true, pump = true) {
  const end = clamp(time, 0, 10),
    dt = 0.02;
  let sodium = 1,
    intake = 0,
    externalLoss = 0,
    urineTotal = 0,
    delivered = 0,
    reabsorbedTotal = 0;
  for (let t = 0; t < end - 1e-8; t += dt) {
    const step = Math.min(dt, end - t),
      signal = Math.max(0, 1 - sodium) * 12,
      route = renalPartition(signal, response, pump ? 1 : 0),
      external = clamp(loss, 0, 2) * (t < 3 ? 0.04 : 0);
    sodium += (0.025 - external - route.urine) * step;
    intake += 0.025 * step;
    externalLoss += external * step;
    urineTotal += route.urine * step;
    delivered += route.delivery * step;
    reabsorbedTotal += route.reabsorbed * step;
  }
  const signal = Math.max(0, 1 - sodium) * 12,
    route = renalPartition(signal, response, pump ? 1 : 0);
  return {
    sodium,
    signal,
    urine: route.urine,
    intake,
    externalLoss,
    urineTotal,
    delivered,
    reabsorbedTotal,
    route,
  };
}
const smooth = (p: number) => {
  const x = clamp(p);
  return x * x * (3 - 2 * x);
};
export const FLUID_IDS = [
  'plasma-tissue',
  'lymph-return',
  'temperature-record',
  'temperature-compare',
  'heat-balance',
  'water-adh',
  'sodium-aldosterone',
] as const;
/** Shared epithelial geometry. The lumen is left; body-side interstitium is right. */
export function renalGeometry(width = 280) {
  const w = clamp(width, 250, 720);
  return { w, apical: w * 0.27, basal: w * 0.72, top: 44, bottom: 216, centerY: 132 };
}
/** Geometric membrane-fusion explanation, not a molecular trajectory reconstruction.
 * A single tagged AQP2 stays in one vesicle membrane and then the same apical membrane. */
export function aqpInsertion(progress: number, width = 280) {
  const g = renalGeometry(width),
    p = clamp(progress),
    r = 18,
    contact = smooth(p / 0.62),
    flatten = smooth((p - 0.62) / 0.38),
    cx = g.apical + 40 * (1 - contact),
    cy = g.centerY,
    dx = Math.max(0, cx - g.apical),
    halfGap = dx < r ? Math.sqrt(r * r - dx * dx) : 0,
    theta = dx < r ? Math.acos(-dx / r) : Math.PI,
    rx = r * (1 - flatten),
    arc = Array.from({ length: 65 }, (_, i) => {
      const a = -theta + (2 * theta * i) / 64;
      return { x: cx + rx * Math.cos(a), y: cy + r * Math.sin(a) };
    });
  // Once flattened, the complete apical line and embedded channel replace the arc.
  return {
    ...g,
    p,
    r,
    cx,
    cy,
    rx,
    halfGap: p >= 1 ? 0 : halfGap,
    arc,
    channel: { id: 'AQP2-tag-1', x: cx + rx, y: cy },
    inserted: p >= 1,
  };
}
/** Trace two selected water markers in opposite directions. They are not a flow counter.
 * The selected trajectories use the same teaching speed in either condition; they are not a statistical flux sample.
 * The separate bulk partition gives exactly zero NET reabsorption without a driver. */
export function waterMarkers(time: number, _gradient = 1, width = 280) {
  const g = renalGeometry(width),
    t = clamp(time),
    forward = smooth(t),
    reverse = smooth(t),
    left = 22,
    right = g.w - 22;
  return [
    { id: 'water-A', direction: 1, x: left + (right - left) * forward, y: g.centerY - 5 },
    { id: 'water-B', direction: -1, x: right - (right - left) * reverse, y: g.centerY + 5 },
  ];
}
/** One selected pump cycle, not a nephron's continuous ion population.
 * Three Na cross lumen→cell→body; two K cross body→cell. ATP coupling is a net event.
 * Inhibiting the pump retains the Na in the cell after passive entry; no sustained throughflow is claimed. */
export function sodiumCycle(progress: number, pump = true, width = 280) {
  const g = renalGeometry(width),
    p = clamp(progress),
    entry = smooth(p / 0.3),
    exit = pump ? smooth((p - 0.34) / 0.28) : 0,
    potassium = pump ? smooth((p - 0.67) / 0.28) : 0,
    inside = (g.apical + g.basal) / 2,
    ions = [
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `Na-${i}`,
        species: 'Na' as const,
        x: 22 + (inside - 22) * entry + (g.w - 22 - inside) * exit,
        y: 82 + i * 50,
        compartment:
          22 + (inside - 22) * entry + (g.w - 22 - inside) * exit < g.apical
            ? 'lumen'
            : 22 + (inside - 22) * entry + (g.w - 22 - inside) * exit > g.basal
              ? 'body'
              : 'cell',
      })),
      ...Array.from({ length: 2 }, (_, i) => ({
        id: `K-${i}`,
        species: 'K' as const,
        x: g.w - 22 + (inside - (g.w - 22)) * potassium,
        y: 107 + i * 50,
        compartment: g.w - 22 + (inside - (g.w - 22)) * potassium > g.basal ? 'body' : 'cell',
      })),
    ];
  return {
    ...g,
    p,
    ions,
    entry,
    exit,
    potassium,
    atpUsed: pump && p >= 0.34 ? 1 : 0,
    naToBody: exit >= 1 ? 3 : 0,
    kToCell: potassium >= 1 ? 2 : 0,
    pump,
  };
}
/** Chapter-local measured speech times include the .45 s cue lead-in.
 * First five retained cuts are unchanged. Renal shot, local cell progress and driver
 * share this director so paused seeking and a fresh Explore have the same state.
 * Time remaps only presentation: the independent transport/balance models are unchanged. */
export function fluidDirector(chapter: number, time: number, locale: 'zh' | 'en' = 'zh') {
  const c = Math.round(clamp(chapter, 0, 6)),
    t = clamp(time, 0, 300);
  if (c === 0) {
    const start = locale === 'zh' ? 7.6 : 3.6,
      end = locale === 'zh' ? 13 : 9.4;
    return {
      chapter: c,
      shot: 'exchange',
      progress: clamp((t - start) / (end - start)),
      cell: 0,
      driver: true,
    };
  }
  if (c === 1)
    return { chapter: c, shot: 'exchange', progress: clamp((t - 0.5) / 18), cell: 0, driver: true };
  if (c === 2) {
    const start = locale === 'zh' ? 2.5 : 3.1,
      end = locale === 'zh' ? 8.8 : 6.7;
    return {
      chapter: c,
      shot: 'records',
      progress: clamp((t - start) / (end - start)),
      cell: 0,
      driver: true,
    };
  }
  if (c === 3) return { chapter: c, shot: 'compare', progress: 1, cell: 0, driver: true };
  if (c === 4) {
    const start = locale === 'zh' ? 3.1 : 1.8,
      stop = locale === 'zh' ? 9.6 : 8.3,
      end = locale === 'zh' ? 15 : 13.8;
    const time =
      t < stop ? 4 * clamp((t - start) / (stop - start)) : 4 + 8 * clamp((t - stop) / (end - stop));
    return { chapter: c, shot: 'heat', progress: time / 12, cell: 0, driver: true };
  }
  const ramp = (a: number, b: number) => clamp((t - a) / (b - a));
  if (c === 5) {
    const zh = locale === 'zh',
      signal = zh ? 4 : 5.35,
      close = zh ? 8.8 : 11,
      insert = zh ? 10.25 : 13.15,
      inserted = zh ? 13.65 : 17.35,
      flow = zh ? 14.15 : 17.5,
      arrived = zh ? 19.55 : 23.25,
      remove = zh ? 21.7 : 25.65,
      compare = zh ? 26.95 : 30.15,
      result = zh ? 31.3 : 34.6,
      shot =
        t < signal
          ? 'loss'
          : t < close
            ? 'signal'
            : t < remove
              ? 'water-cell'
              : t < compare
                ? 'no-gradient'
                : 'budget';
    // The same selected water markers reverse after removal of the gradient;
    // the channel stays inserted. They are not a statistical flux sample.
    const cell =
      shot === 'no-gradient'
        ? 1 - ramp(remove, compare - 0.3)
        : t < inserted
          ? 0.38 * ramp(insert, inserted)
          : t < flow
            ? 0.38 + 0.04 * ramp(inserted, flow)
            : 0.42 + 0.5 * ramp(flow, arrived);
    return {
      chapter: c,
      shot,
      cell,
      progress: shot === 'budget' ? ramp(compare, result) : ramp(0.45, signal),
      driver: shot !== 'no-gradient',
    };
  }
  const zh = locale === 'zh',
    signal = zh ? 2.6 : 2.95,
    close = zh ? 9.35 : 8.1,
    enter = zh ? 10.85 : 10.45,
    entered = zh ? 13.4 : 12.8,
    pump = zh ? 13.65 : 13,
    exported = zh ? 16.2 : 17.25,
    potassium = zh ? 19.6 : 22,
    imported = zh ? 22 : 24.65,
    partition = zh ? 22.45 : 25,
    stop = zh ? 25.75 : 28.15,
    stopEntry = zh ? 28.85 : 30.7,
    finish = zh ? 31.2 : 32.8,
    shot =
      t < signal
        ? 'salt-loss'
        : t < close
          ? 'adrenal'
          : t < partition
            ? 'sodium-cell'
            : t < stop
              ? 'salt-budget'
              : t < finish
                ? 'pump-off'
                : 'salt-budget';
  // Normal cycle: entry -> sodium export (ATP coupled) -> potassium import.
  // Explicitly new stopped-pump comparison: entry can proceed; export cannot.
  const cell =
    shot === 'pump-off'
      ? t < stopEntry
        ? 0.3 * ramp(stop, stopEntry)
        : 0.3 + 0.35 * ramp(stopEntry, finish)
      : t < entered
        ? 0.3 * ramp(enter, entered)
        : t < pump
          ? 0.3 + 0.04 * ramp(entered, pump)
          : t < exported
            ? 0.34 + 0.28 * ramp(pump, exported)
            : t < potassium
              ? 0.62 + 0.05 * ramp(exported, potassium)
              : 0.67 + 0.28 * ramp(potassium, imported);
  return {
    chapter: c,
    shot,
    cell,
    progress: ramp(0.45, signal),
    driver: shot !== 'pump-off',
  };
}
