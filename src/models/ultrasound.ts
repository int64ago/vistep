/** Normal-incidence pulse echo in independent vertical columns of a manufactured
 * phantom. Units: mm, µs, MHz, MRayl, m/s, dB/(cm·MHz). Single reflections only;
 * through-transmission is retained on both legs. No beamforming or speckle.
 */
export type UltrasoundConfig = {
  frequency: number;
  cycles: number;
  speed: number;
  assumedSpeed: number;
  attenuation: number;
  insertAttenuation: number;
  gap: number;
};
export type UltrasoundLayer = {
  top: number;
  bottom: number;
  impedance: number;
  speed: number;
  attenuation: number;
  kind: 'upper' | 'middle' | 'lower' | 'base' | 'foil' | 'insert';
};
export const ultrasoundDefaults: UltrasoundConfig = {
  frequency: 3,
  cycles: 2,
  speed: 1540,
  assumedSpeed: 1540,
  attenuation: 0.35,
  insertAttenuation: 2.2,
  gap: 0.64,
};
export const ultrasoundClamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

export function ultrasoundInterface(z1: number, z2: number) {
  if (![z1, z2].every((z) => Number.isFinite(z) && z > 0))
    throw new RangeError('Positive finite impedances required');
  const r = (z2 - z1) / (z2 + z1),
    forward = (2 * z2) / (z1 + z2),
    reverse = (2 * z1) / (z1 + z2);
  return {
    r,
    forward,
    reverse,
    reflectedEnergy: r * r,
    transmittedEnergy: (z1 / z2) * forward * forward,
  };
}
export function validateUltrasound(config: UltrasoundConfig) {
  if (
    !Object.values(config).every(Number.isFinite) ||
    config.frequency <= 0 ||
    config.frequency > 20 ||
    config.cycles < 1 ||
    config.cycles > 16 ||
    config.speed <= 0 ||
    config.assumedSpeed <= 0 ||
    config.attenuation < 0 ||
    config.insertAttenuation < 0 ||
    config.gap <= 0 ||
    config.gap > 6
  )
    throw new RangeError('Invalid ultrasound teaching configuration');
}
export const ultrasoundPulseDuration = (config: UltrasoundConfig) =>
  config.cycles / config.frequency;
export const ultrasoundAxialSupport = (config: UltrasoundConfig) =>
  ((config.speed / 1000) * ultrasoundPulseDuration(config)) / 2;
export const ultrasoundDepth = (time: number, speed: number) => (time * speed) / 2000;

/** Compact Hann-windowed carrier, centered at transmit time zero. The known
 * quadrature pair implements an ideal coherent envelope, not a claimed exact
 * Hilbert transform of a compact real pulse. */
export function ultrasoundPulse(time: number, config: UltrasoundConfig) {
  const duration = ultrasoundPulseDuration(config);
  if (Math.abs(time) >= duration / 2) return { real: 0, imaginary: 0, envelope: 0 };
  const envelope = 0.5 * (1 + Math.cos((2 * Math.PI * time) / duration));
  return {
    real: envelope * Math.cos(2 * Math.PI * config.frequency * time),
    imaginary: envelope * Math.sin(2 * Math.PI * config.frequency * time),
    envelope,
  };
}

export function ultrasoundColumn(
  x: number,
  config: UltrasoundConfig = ultrasoundDefaults,
): UltrasoundLayer[] {
  validateUltrasound(config);
  if (!Number.isFinite(x) || Math.abs(x) > 20)
    throw new RangeError('Probe must remain within the phantom');
  const foil = x >= -15 && x < -3,
    insert = x >= 6 && x < 15;
  const depths = [
    0,
    12,
    40,
    56,
    64,
    ...(foil ? [27, 27 + config.gap] : []),
    ...(insert ? [20, 28] : []),
  ].sort((a, b) => a - b);
  return depths.slice(0, -1).map((top, i) => {
    const bottom = depths[i + 1],
      mid = (top + bottom) / 2;
    let kind: UltrasoundLayer['kind'] =
      mid < 12 ? 'upper' : mid < 40 ? 'middle' : mid < 56 ? 'lower' : 'base';
    if (foil && mid > 27 && mid < 27 + config.gap) kind = 'foil';
    if (insert && mid > 20 && mid < 28) kind = 'insert';
    const impedance = { upper: 1.5, middle: 1.9, lower: 1.6, base: 2.3, foil: 2.7, insert: 4.8 }[
      kind
    ];
    return {
      top,
      bottom,
      kind,
      impedance,
      speed: config.speed,
      attenuation: config.attenuation + (kind === 'insert' ? config.insertAttenuation : 0),
    };
  });
}

export function ultrasoundLine(layers: UltrasoundLayer[], config: UltrasoundConfig) {
  validateUltrasound(config);
  if (!layers.length || layers[0].top !== 0)
    throw new RangeError('A column must start at the probe face');
  layers.forEach((layer, i) => {
    if (
      ![layer.top, layer.bottom, layer.impedance, layer.speed, layer.attenuation].every(
        Number.isFinite,
      ) ||
      layer.bottom <= layer.top ||
      layer.impedance <= 0 ||
      layer.speed <= 0 ||
      layer.attenuation < 0 ||
      (i && layers[i - 1].bottom !== layer.top)
    )
      throw new RangeError('Layers must be finite, positive and contiguous');
  });
  let oneWayTime = 0,
    oneWayDb = 0,
    forwardPressure = 1,
    returnPressure = 1;
  const echoes = layers.slice(0, -1).map((layer, index) => {
    oneWayTime += ((layer.bottom - layer.top) * 1000) / layer.speed;
    oneWayDb += (layer.attenuation * config.frequency * (layer.bottom - layer.top)) / 10;
    const coefficients = ultrasoundInterface(layer.impedance, layers[index + 1].impedance);
    const incident = forwardPressure * 10 ** (-oneWayDb / 20);
    const amplitude =
      coefficients.r * forwardPressure * returnPressure * 10 ** ((-2 * oneWayDb) / 20);
    const echo = {
      id: `${layer.kind}-${layers[index + 1].kind}-${layer.bottom}`,
      index,
      depth: layer.bottom,
      time: 2 * oneWayTime,
      oneWayTime,
      oneWayDb,
      incident,
      amplitude,
      pathTransmission: forwardPressure * returnPressure,
      z1: layer.impedance,
      z2: layers[index + 1].impedance,
      ...coefficients,
    };
    forwardPressure *= coefficients.forward;
    returnPressure *= coefficients.reverse;
    return echo;
  });
  return { layers, config, echoes };
}
export type UltrasoundLine = ReturnType<typeof ultrasoundLine>;

export function ultrasoundPath(line: UltrasoundLine, depth: number) {
  const z = ultrasoundClamp(depth, 0, line.layers.at(-1)!.bottom);
  let time = 0,
    lossDb = 0,
    pressure = 1;
  for (let i = 0; i < line.layers.length; i++) {
    const layer = line.layers[i];
    const distance = Math.max(0, Math.min(z, layer.bottom) - layer.top);
    time += (distance * 1000) / layer.speed;
    lossDb += (layer.attenuation * line.config.frequency * distance) / 10;
    if (z > layer.bottom && i < line.echoes.length) pressure *= line.echoes[i].forward;
  }
  return { time, lossDb, pressure: pressure * 10 ** (-lossDb / 20) };
}

export function ultrasoundDepthAtTravelTime(line: UltrasoundLine, time: number) {
  let remaining = Math.max(0, time);
  for (const layer of line.layers) {
    const travel = ((layer.bottom - layer.top) * 1000) / layer.speed;
    if (remaining <= travel) return layer.top + (remaining * layer.speed) / 1000;
    remaining -= travel;
  }
  return line.layers.at(-1)!.bottom;
}

export function ultrasoundPackets(line: UltrasoundLine, time: number) {
  if (!Number.isFinite(time)) throw new RangeError('Finite display time required');
  const half = ultrasoundPulseDuration(line.config) / 2;
  const total = ultrasoundPath(line, line.layers.at(-1)!.bottom).time;
  const packets: {
    id: string;
    direction: 'down' | 'up';
    top: number;
    bottom: number;
    center: number;
    amplitude: number;
  }[] = [];
  if (time + half > 0 && time - half < total) {
    const center = ultrasoundDepthAtTravelTime(line, time);
    packets.push({
      id: 'transmit',
      direction: 'down',
      center,
      top: ultrasoundDepthAtTravelTime(line, time - half),
      bottom: ultrasoundDepthAtTravelTime(line, time + half),
      amplitude: ultrasoundPath(line, center).pressure,
    });
  }
  for (const echo of line.echoes) {
    const returningTime = echo.time - time;
    if (returningTime + half <= 0 || returningTime - half >= echo.oneWayTime || echo.r === 0)
      continue;
    const center = ultrasoundDepthAtTravelTime(
      line,
      ultrasoundClamp(returningTime, 0, echo.oneWayTime),
    );
    const path = ultrasoundPath(line, center);
    let returning = echo.incident * echo.r;
    for (let i = 0; i < echo.index; i++)
      if (center <= line.echoes[i].depth) returning *= line.echoes[i].reverse;
    returning *= 10 ** (-(echo.oneWayDb - path.lossDb) / 20);
    packets.push({
      id: echo.id,
      direction: 'up',
      center,
      top: ultrasoundDepthAtTravelTime(line, Math.max(0, returningTime - half)),
      bottom: ultrasoundDepthAtTravelTime(line, Math.min(echo.oneWayTime, returningTime + half)),
      amplitude: returning,
    });
  }
  return packets;
}

export function ultrasoundSample(line: UltrasoundLine, time: number) {
  let real = 0,
    imaginary = 0;
  const half = ultrasoundPulseDuration(line.config) / 2;
  for (const echo of line.echoes) {
    if (Math.abs(time - echo.time) >= half) continue;
    const pulse = ultrasoundPulse(time - echo.time, line.config);
    real += echo.amplitude * pulse.real;
    imaginary += echo.amplitude * pulse.imaginary;
  }
  return { real, imaginary, envelope: Math.hypot(real, imaginary) };
}

export function ultrasoundSignal(line: UltrasoundLine, start: number, end: number, count = 900) {
  if (
    !Number.isFinite(start + end) ||
    end <= start ||
    !Number.isInteger(count) ||
    count < 2 ||
    count > 10000
  )
    throw new RangeError('Invalid signal sample range');
  return Array.from({ length: count }, (_, i) => {
    const time = start + ((end - start) * i) / (count - 1);
    return { time, ...ultrasoundSample(line, time) };
  });
}

/** Fixed pressure reference and 45 dB display range: no per-column normalization. */
export function ultrasoundBrightness(envelope: number, reference = 0.25, dynamicRange = 45) {
  if (envelope <= 0) return 0;
  return Math.round(
    255 * ultrasoundClamp(1 + (20 * Math.log10(envelope / reference)) / dynamicRange, 0, 1),
  );
}

export function ultrasoundImage(config: UltrasoundConfig, width = 73, height = 351) {
  validateUltrasound(config);
  if (![width, height].every((n) => Number.isInteger(n) && n >= 2 && n <= 600))
    throw new RangeError('Invalid image size');
  const pixels = new Uint8ClampedArray(width * height * 4);
  const columns = Array.from({ length: width }, (_, col) => {
    const x = -18 + (36 * col) / (width - 1);
    return { x, line: ultrasoundLine(ultrasoundColumn(x, config), config) };
  });
  for (let row = 0; row < height; row++) {
    const depth = (70 * (row + 0.5)) / height;
    const time = (depth * 2000) / config.assumedSpeed;
    for (let col = 0; col < width; col++) {
      const value = ultrasoundBrightness(ultrasoundSample(columns[col].line, time).envelope);
      const at = (row * width + col) * 4;
      pixels[at] = value;
      pixels[at + 1] = value;
      pixels[at + 2] = value;
      pixels[at + 3] = 255;
    }
  }
  const halfCell = 18 / (width - 1);
  return { width, height, pixels, columns, depth: 70, left: -18 - halfCell, right: 18 + halfCell };
}
export type UltrasoundImage = ReturnType<typeof ultrasoundImage>;

/** Geometric phantom regions are generated from precisely the column function
 * used by the image, including explicit ignored vertical walls at their joins. */
export function ultrasoundRegions(config: UltrasoundConfig) {
  const boundaries = [-20, -15, -3, 6, 15, 20];
  return boundaries.slice(0, -1).flatMap((left, i) =>
    ultrasoundColumn((left + boundaries[i + 1]) / 2, config).map((layer) => ({
      left,
      right: boundaries[i + 1],
      ...layer,
    })),
  );
}

export function ultrasoundResolution(config: UltrasoundConfig) {
  const line = ultrasoundLine(ultrasoundColumn(-8, config), config);
  const pair = line.echoes.filter((echo) => echo.depth >= 27 && echo.depth <= 27 + config.gap);
  const start = pair[0].time - 2,
    end = pair[1].time + 2;
  const samples = ultrasoundSignal(line, start, end, 1201);
  const max = Math.max(...samples.map((sample) => sample.envelope));
  const peaks = samples.filter(
    (sample, i) =>
      i > 0 &&
      i < samples.length - 1 &&
      sample.envelope > max * 0.4 &&
      sample.envelope > samples[i - 1].envelope &&
      sample.envelope >= samples[i + 1].envelope,
  );
  return { line, pair, start, end, samples, peaks, support: ultrasoundAxialSupport(config) };
}

export type UltrasoundFocus =
  'pulse' | 'range' | 'split' | 'envelope' | 'scan' | 'resolution' | 'shadow' | 'speed';
const focuses: UltrasoundFocus[] = [
  'pulse',
  'range',
  'split',
  'envelope',
  'scan',
  'resolution',
  'shadow',
  'speed',
];
export function ultrasoundShot(chapter: number, progress: number) {
  const index = ultrasoundClamp(Math.floor(Number.isFinite(chapter) ? chapter : 0), 0, 7);
  const q = ultrasoundClamp(((Number.isFinite(progress) ? progress : 0) - 0.06) / 0.86, 0, 1);
  const p = q * q * (3 - 2 * q);
  const config = { ...ultrasoundDefaults };
  let x = 0,
    time = 80,
    scanColumns = 73;
  switch (index) {
    case 0:
      time = -0.4 + p * 20;
      break;
    case 1:
      time = p * 82;
      break;
    case 2:
      time = 5 + p * 14;
      break;
    case 3:
      time = 80;
      break;
    case 4: {
      const cursor = p * 73;
      scanColumns = Math.floor(cursor);
      const column = Math.min(72, scanColumns);
      x = -18 + column * 0.5;
      time = cursor >= 73 ? 86 : (cursor - Math.floor(cursor)) * 86;
      break;
    }
    case 5:
      x = -8;
      config.cycles = 8 - 6 * p;
      break;
    case 6:
      x = 10;
      config.insertAttenuation = 2.2 * p;
      break;
    case 7:
      config.speed = 1480;
      config.assumedSpeed = 1700 - 220 * p;
      break;
  }
  const line = ultrasoundLine(ultrasoundColumn(x, config), config);
  return {
    config,
    x,
    time,
    scanColumns,
    progress: p,
    focus: focuses[index],
    line,
    packets: ultrasoundPackets(line, time),
  };
}
export type UltrasoundShot = ReturnType<typeof ultrasoundShot>;
