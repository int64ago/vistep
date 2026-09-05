/** SI units. Linear current-driven coupled loops + one-sided conducting slab + two thermal nodes. */
export type InductionPoint = [number, number, number];
export type InductionMaterial = 'steel' | 'stainless' | 'aluminum';
export const INDUCTION_MATERIALS = {
  steel: { name: '磁性钢', conductivity: 6e6, muR: 40, density: 7800, specificHeat: 500 },
  stainless: {
    name: '非磁性不锈钢',
    conductivity: 1.4e6,
    muR: 1,
    density: 8000,
    specificHeat: 500,
  },
  aluminum: { name: '铝', conductivity: 3.5e7, muR: 1, density: 2700, specificHeat: 900 },
} as const;
export const INDUCTION = {
  mu0: 4e-7 * Math.PI,
  turns: 12,
  inner: 0.025,
  outer: 0.105,
  wireRadius: 0.0018,
  panRadius: 0.118,
  panThickness: 0.003,
  panWall: 0.002,
  panHeight: 0.035,
  loopRadius: 0.075,
  loopWidth: 0.04,
  glassTop: 0.0065,
  glassThickness: 0.004,
  coilResistance: 0.04,
  primaryL: 30e-6,
  secondaryL: 0.28e-6,
  ambient: 20,
  glassCapacity: 500,
  panAmbient: 2.2,
  glassAmbient: 1.1,
  period: 4,
  duration: 176,
};
export type InductionInput = {
  material: InductionMaterial;
  frequency: number;
  current: number;
  lift: number;
  duty: number;
};
export const INDUCTION_DEFAULT: InductionInput = {
  material: 'steel',
  frequency: 25000,
  current: 28,
  lift: 0,
  duty: 1,
};
const finite = (...n: number[]) => n.every(Number.isFinite);
export function inductionValidate(s: InductionInput) {
  if (
    !INDUCTION_MATERIALS[s.material] ||
    !finite(s.frequency, s.current, s.lift, s.duty) ||
    s.frequency < 0 ||
    s.frequency > 2e6 ||
    s.current < 0 ||
    s.current > 60 ||
    s.lift < 0 ||
    s.lift > 0.1 ||
    s.duty < 0 ||
    s.duty > 1
  )
    throw new RangeError('Invalid induction model input');
}
export type InductionComplex = { re: number; im: number };
const C = (re: number, im = 0): InductionComplex => ({ re, im });
const mul = (a: InductionComplex, b: InductionComplex) =>
  C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const add = (a: InductionComplex, b: InductionComplex) => C(a.re + b.re, a.im + b.im);
const divide = (a: InductionComplex, b: InductionComplex) => {
  const d = b.re * b.re + b.im * b.im;
  return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
const norm = (a: InductionComplex) => Math.hypot(a.re, a.im);
const instant = (a: InductionComplex, p: number) =>
  Math.SQRT2 * (a.re * Math.cos(p) - a.im * Math.sin(p));
export function inductionSpiral(t: number): InductionPoint {
  const r = INDUCTION.inner + (INDUCTION.outer - INDUCTION.inner) * t,
    a = t * 2 * Math.PI * INDUCTION.turns;
  return [r * Math.cos(a), 0, r * Math.sin(a)];
}
/** Round only the route corners; the same sampled centerline drives field integration and drawing. */
export function inductionRoundedRoute(points: InductionPoint[]) {
  const result: InductionPoint[] = [[...points[0]]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1],
      b = points[i],
      c = points[i + 1],
      la = Math.hypot(...a.map((v, k) => v - b[k])),
      lc = Math.hypot(...c.map((v, k) => v - b[k])),
      radius = Math.min(0.004, la / 3, lc / 3),
      entry = b.map((v, k) => v + ((a[k] - v) * radius) / la) as InductionPoint,
      exit = b.map((v, k) => v + ((c[k] - v) * radius) / lc) as InductionPoint;
    result.push(entry);
    for (let j = 1; j <= 8; j++) {
      const q = j / 8;
      result.push(
        entry.map(
          (v, k) => (1 - q) ** 2 * v + 2 * q * (1 - q) * b[k] + q * q * exit[k],
        ) as InductionPoint,
      );
    }
  }
  result.push([...points[points.length - 1]]);
  return result;
}
export function inductionGeometry(lift = 0, count = 385) {
  if (!finite(lift, count) || lift < 0 || lift > 0.1) throw new RangeError('Invalid geometry');
  const n = Math.max(49, Math.min(769, Math.round(count)));
  const terminalA: InductionPoint = [-0.145, -0.018, 0.084],
    terminalB: InductionPoint = [-0.145, -0.018, 0.116];
  const spiral = Array.from({ length: n }, (_, i) => inductionSpiral(i / (n - 1)));
  const supply = inductionRoundedRoute([
    terminalA,
    [-0.125, -0.018, 0.084],
    [0.025, -0.018, 0.084],
    [0.025, -0.018, 0],
    spiral[0],
  ]);
  const returnPath = inductionRoundedRoute([
    spiral[n - 1],
    [0.127, 0, 0],
    [0.132, -0.018, 0],
    [0.132, -0.018, 0.116],
    terminalB,
  ]);
  const circuit = [...supply, ...spiral.slice(1), ...returnPath.slice(1), terminalA];
  const panBottom = INDUCTION.glassTop + lift,
    loopY = panBottom + INDUCTION.panThickness / 2;
  const loop = Array.from({ length: 97 }, (_, i): InductionPoint => {
    const a = (i / 96) * 2 * Math.PI;
    return [INDUCTION.loopRadius * Math.cos(a), loopY, INDUCTION.loopRadius * Math.sin(a)];
  });
  // The source's internal branch closes the primary. The secondary loop is physically closed.
  loop[loop.length - 1] = [...loop[0]];
  return { spiral, supply, returnPath, circuit, terminalA, terminalB, panBottom, loopY, loop };
}
/** Meaningful physical bounds for deterministic perspective fitting, in model coordinates. */
export function inductionBounds(lift: number, flux = false) {
  if (!finite(lift) || lift < 0 || lift > 0.1) throw new RangeError('Invalid bound spacing');
  const points: InductionPoint[] = [];
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => {
    for (const x of [x0, x1])
      for (const y of [y0, y1]) for (const z of [z0, z1]) points.push([x, y, z]);
  };
  box(-0.155, 0.155, -0.0255, -0.0225, -0.135, 0.135);
  box(
    -0.1405,
    0.1405,
    INDUCTION.glassTop - INDUCTION.glassThickness,
    INDUCTION.glassTop,
    -0.125,
    0.125,
  );
  box(-0.1595, -0.1305, -0.026, -0.01, 0.0765, 0.1235);
  for (const y of [INDUCTION.glassTop + lift, INDUCTION.glassTop + lift + INDUCTION.panHeight])
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * 2 * Math.PI;
      points.push([INDUCTION.panRadius * Math.cos(a), y, INDUCTION.panRadius * Math.sin(a)]);
    }
  if (flux)
    box(
      -0.008,
      0.008,
      INDUCTION.glassTop + lift - 0.012,
      INDUCTION.glassTop + lift + 0.084,
      -0.008,
      0.008,
    );
  return points;
}
const segments = (ps: InductionPoint[]) =>
  ps.slice(1).map((b, i) => ({
    mid: ps[i].map((v, k) => (v + b[k]) / 2) as InductionPoint,
    delta: b.map((v, k) => v - ps[i][k]) as InductionPoint,
  }));
/** Neumann mutual inductance in air, with closed lead/source return geometry included. */
export function inductionMutual(lift: number, detail = 1) {
  if (!finite(lift, detail) || lift < 0 || lift > 0.1 || detail < 1 || detail > 4)
    throw new RangeError('Invalid quadrature');
  const g = inductionGeometry(lift, Math.round(288 * detail) + 1),
    a = segments(g.circuit);
  const count = Math.round(80 * detail),
    loop = Array.from({ length: count + 1 }, (_, i): InductionPoint => {
      const t = (i / count) * 2 * Math.PI;
      return [INDUCTION.loopRadius * Math.cos(t), g.loopY, INDUCTION.loopRadius * Math.sin(t)];
    });
  const b = segments(loop);
  let integral = 0;
  for (const x of a)
    for (const y of b) {
      const d = Math.hypot(...x.mid.map((v, k) => v - y.mid[k]));
      integral += x.delta.reduce((s, v, k) => s + v * y.delta[k], 0) / d;
    }
  return (INDUCTION.mu0 / (4 * Math.PI)) * integral;
}
/** Finite one-sided slab: Zs = gamma/sigma coth(gamma*t), gamma=(1+j)/delta. */
export function inductionSkin(material: InductionMaterial, frequency: number) {
  const m = INDUCTION_MATERIALS[material];
  if (!m || !finite(frequency) || frequency < 0 || frequency > 2e6)
    throw new RangeError('Invalid skin input');
  const t = INDUCTION.panThickness;
  if (frequency === 0)
    return { depth: Infinity, resistance: 1 / (m.conductivity * t), reactance: 0 };
  const depth = Math.sqrt(1 / (Math.PI * frequency * INDUCTION.mu0 * m.muR * m.conductivity)),
    u = t / depth,
    base = 1 / (m.conductivity * depth);
  if (u > 20) return { depth, resistance: base, reactance: base };
  if (u < 0.001)
    return {
      depth,
      resistance: base * (1 / u + (4 * u ** 3) / 45),
      reactance: base * ((2 * u) / 3 - (16 * u ** 5) / 945),
    };
  const denominator = Math.cosh(2 * u) - Math.cos(2 * u);
  return {
    depth,
    resistance: (base * (Math.sinh(2 * u) + Math.sin(2 * u))) / denominator,
    reactance: (base * (Math.sinh(2 * u) - Math.sin(2 * u))) / denominator,
  };
}
export function inductionResponse(input: InductionInput, mutual = inductionMutual(input.lift)) {
  inductionValidate(input);
  if (!finite(mutual) || mutual < 0 || mutual ** 2 >= INDUCTION.primaryL * INDUCTION.secondaryL)
    throw new RangeError('Non-passive coupling');
  const omega = 2 * Math.PI * input.frequency,
    skin = inductionSkin(input.material, input.frequency),
    squares = (2 * Math.PI * INDUCTION.loopRadius) / INDUCTION.loopWidth;
  const panR = skin.resistance * squares,
    panX = omega * INDUCTION.secondaryL + skin.reactance * squares;
  const secondary = divide(C(0, -omega * mutual * input.current), C(panR, panX));
  const primaryVoltage = add(
    mul(C(INDUCTION.coilResistance, omega * INDUCTION.primaryL), C(input.current)),
    mul(C(0, omega * mutual), secondary),
  );
  const panPower = panR * norm(secondary) ** 2,
    coilPower = INDUCTION.coilResistance * input.current ** 2,
    inputPower = primaryVoltage.re * input.current;
  return {
    input,
    omega,
    mutual,
    skin,
    panR,
    panX,
    secondaryL: input.frequency === 0 ? INDUCTION.secondaryL : panX / omega,
    secondary,
    primaryVoltage,
    secondaryRMS: norm(secondary),
    voltageRMS: norm(primaryVoltage),
    panPower,
    coilPower,
    inputPower,
    averagePan: input.duty * panPower,
    averageInput: input.duty * inputPower,
    efficiency: inputPower > 0 ? panPower / inputPower : 0,
  };
}
export type InductionResponse = ReturnType<typeof inductionResponse>;
export function inductionInstant(r: InductionResponse, phase: number, on = true) {
  if (!finite(phase)) throw new RangeError('Invalid phase');
  const i1 = on ? Math.SQRT2 * r.input.current * Math.cos(phase) : 0,
    di1 = on ? -Math.SQRT2 * r.input.current * r.omega * Math.sin(phase) : 0;
  const i2 = on ? instant(r.secondary, phase) : 0,
    di2 = on ? instant(mul(C(0, r.omega), r.secondary), phase) : 0,
    u = on ? instant(r.primaryVoltage, phase) : 0;
  const flux = r.mutual * i1,
    emf = -r.mutual * di1;
  const stored =
    0.5 * INDUCTION.primaryL * i1 * i1 + 0.5 * r.secondaryL * i2 * i2 + r.mutual * i1 * i2;
  const storageRate =
    INDUCTION.primaryL * i1 * di1 + r.secondaryL * i2 * di2 + r.mutual * (di1 * i2 + i1 * di2);
  return {
    i1,
    i2,
    di1,
    di2,
    u,
    flux,
    emf,
    stored,
    storageRate,
    inputPower: u * i1,
    panLoss: r.panR * i2 * i2,
    coilLoss: INDUCTION.coilResistance * i1 * i1,
  };
}
/** Depth-resolved cycle-average Joule density, not incandescence or a thermal CFD solution. */
export function inductionDepthLoss(r: InductionResponse, depth: number) {
  if (!finite(depth) || depth < 0 || depth > INDUCTION.panThickness)
    throw new RangeError('Invalid depth');
  const m = INDUCTION_MATERIALS[r.input.material],
    d = r.skin.depth,
    K = r.secondaryRMS / INDUCTION.loopWidth,
    t = INDUCTION.panThickness;
  if (!Number.isFinite(d) || t / d < 0.001) return (K * K) / (m.conductivity * t * t);
  const u = t / d,
    v = (t - depth) / d;
  const ratio =
    u > 20
      ? Math.exp((-2 * depth) / d)
      : (Math.cosh(2 * v) + Math.cos(2 * v)) / (Math.cosh(2 * u) - Math.cos(2 * u));
  return ((2 * K * K) / (m.conductivity * d * d)) * ratio;
}
export function inductionThermalParameters(input: InductionInput) {
  inductionValidate(input);
  const m = INDUCTION_MATERIALS[input.material],
    g = INDUCTION;
  const volume =
    Math.PI * g.panRadius ** 2 * g.panThickness +
    2 * Math.PI * g.panRadius * g.panWall * g.panHeight;
  return {
    panCapacity: volume * m.density * m.specificHeat,
    glassCapacity: g.glassCapacity,
    contact: 1.6 / (1 + input.lift / 0.0006) + 0.08,
    panAmbient: g.panAmbient,
    glassAmbient: g.glassAmbient,
  };
}
export type InductionThermal = { pan: number; glass: number };
export function inductionThermalRate(input: InductionInput, s: InductionThermal, power: number) {
  if (!finite(s.pan, s.glass, power) || power < 0) throw new RangeError('Invalid thermal state');
  const p = inductionThermalParameters(input),
    a = INDUCTION.ambient;
  const toGlass = p.contact * (s.pan - s.glass),
    panAmbient = p.panAmbient * (s.pan - a),
    glassAmbient = p.glassAmbient * (s.glass - a),
    panRate = (power - toGlass - panAmbient) / p.panCapacity,
    glassRate = (toGlass - glassAmbient) / p.glassCapacity;
  return {
    panRate,
    glassRate,
    toGlass,
    panAmbient,
    glassAmbient,
    storageRate: p.panCapacity * panRate + p.glassCapacity * glassRate,
    energy: p.panCapacity * (s.pan - a) + p.glassCapacity * (s.glass - a),
  };
}
/** Closed-form 2x2 exponential; constant heating per burst segment, no frame integration. */
export function inductionThermalAdvance(
  input: InductionInput,
  s: InductionThermal,
  power: number,
  time: number,
): InductionThermal {
  if (!finite(time) || time < 0 || time > 3600) throw new RangeError('Invalid thermal duration');
  inductionThermalRate(input, s, power);
  if (time === 0) return { ...s };
  const p = inductionThermalParameters(input),
    a = -(p.panAmbient + p.contact) / p.panCapacity,
    b = p.contact / p.panCapacity,
    c = p.contact / p.glassCapacity,
    d = -(p.glassAmbient + p.contact) / p.glassCapacity;
  const determinant = a * d - b * c,
    eq1 = (-d * power) / p.panCapacity / determinant,
    eq2 = (c * power) / p.panCapacity / determinant;
  const center = (a + d) / 2,
    root = Math.hypot((a - d) / 2, Math.sqrt(b * c)),
    plus = Math.exp((center + root) * time),
    minus = Math.exp((center - root) * time),
    v = (plus - minus) / (2 * root),
    u = (plus + minus) / 2;
  const x = s.pan - INDUCTION.ambient - eq1,
    y = s.glass - INDUCTION.ambient - eq2;
  return {
    pan: INDUCTION.ambient + eq1 + (u + v * (a - center)) * x + v * b * y,
    glass: INDUCTION.ambient + eq2 + v * c * x + (u + v * (d - center)) * y,
  };
}
export function inductionGate(duty: number, time: number) {
  return duty >= 1 || (duty > 0 && time % INDUCTION.period < duty * INDUCTION.period);
}
export function inductionThermalProgram(
  input: InductionInput,
  time: number,
  response = inductionResponse(input),
) {
  if (!finite(time) || time < 0 || time > 600)
    throw new RangeError('Thermal program is bounded to ten minutes');
  let state: InductionThermal = { pan: INDUCTION.ambient, glass: INDUCTION.ambient },
    elapsed = 0,
    onTime = 0;
  const period = INDUCTION.period;
  if (input.duty === 0 || input.duty === 1) {
    state = inductionThermalAdvance(input, state, response.panPower * input.duty, time);
    onTime = time * input.duty;
  } else
    while (elapsed < time - 1e-10) {
      const on = Math.min(input.duty * period, time - elapsed);
      state = inductionThermalAdvance(input, state, response.panPower, on);
      elapsed += on;
      onTime += on;
      const off = Math.min(period * (1 - input.duty), time - elapsed);
      state = inductionThermalAdvance(input, state, 0, off);
      elapsed += off;
    }
  return {
    ...state,
    onTime,
    inputEnergy: onTime * response.panPower,
    on: inductionGate(input.duty, time),
  };
}
const ease = (p: number, a = 0.08, b = 0.9) => {
  const q = Math.max(0, Math.min(1, (p - a) / (b - a)));
  return q * q * (3 - 2 * q);
};
export type InductionView =
  'assembly' | 'flux' | 'skin' | 'spacing' | 'material' | 'duty' | 'warming' | 'cooling';
export function inductionShot(chapter: number, progress: number) {
  const c = finite(chapter) ? Math.max(0, Math.min(7, Math.floor(chapter))) : 0,
    p = finite(progress) ? Math.max(0, Math.min(1, progress)) : 0,
    q = ease(p),
    input = { ...INDUCTION_DEFAULT };
  const views: InductionView[] = [
    'assembly',
    'flux',
    'skin',
    'spacing',
    'material',
    'duty',
    'warming',
    'cooling',
  ];
  let phase = 2 * Math.PI * q,
    time = 0,
    on = true;
  if (c === 0) input.current = 28 * q;
  if (c === 2) input.frequency = 15000 + 45000 * q;
  if (c === 3) input.lift = 0.015 * q;
  if (c === 4) input.material = p < 1 / 3 ? 'steel' : p < 2 / 3 ? 'stainless' : 'aluminum';
  if (c === 5) {
    input.duty = 0.35;
    time = 24 * q;
    on = inductionGate(input.duty, time);
  }
  if (c === 6) time = 180 * q;
  if (c === 7) {
    time = 240 * q;
    on = false;
  }
  const response = inductionResponse(input);
  let thermal: InductionThermal = { pan: 20, glass: 20 };
  if (c === 5 || c === 6) thermal = inductionThermalProgram(input, time, response);
  if (c === 7)
    thermal = inductionThermalAdvance(
      input,
      inductionThermalProgram(input, 180, response),
      0,
      time,
    );
  const heat = inductionThermalRate(input, thermal, on ? response.panPower : 0);
  return {
    view: views[c],
    input,
    response,
    instant: inductionInstant(response, phase, on),
    phase,
    time,
    on,
    thermal,
    heat,
  };
}
export type InductionShot = ReturnType<typeof inductionShot>;
