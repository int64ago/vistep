import { describe, expect, it } from 'vitest';
import {
  ultrasoundDefaults as defaults,
  ultrasoundInterface,
  ultrasoundLine,
  ultrasoundColumn,
  ultrasoundPath,
  ultrasoundDepthAtTravelTime,
  ultrasoundPulse,
  ultrasoundPulseDuration,
  ultrasoundSample,
  ultrasoundDepth,
  ultrasoundAxialSupport,
  ultrasoundImage,
  ultrasoundBrightness,
  ultrasoundRegions,
  ultrasoundResolution,
  ultrasoundPackets,
  ultrasoundShot,
  type UltrasoundLayer,
} from './ultrasound';

const config = { ...defaults, attenuation: 0, insertAttenuation: 0 };
const layer = (top: number, bottom: number, impedance: number, speed = 1540): UltrasoundLayer => ({
  top,
  bottom,
  impedance,
  speed,
  attenuation: 0,
  kind: 'middle',
});

describe('Ultrasound: pulse, interfaces and reconstructed data', () => {
  it('uses signed pressure coefficients and impedance-correct intensity conservation', () => {
    for (const z1 of [0.001, 1.5, 3, 8])
      for (const z2 of [0.001, 1.5, 3, 8]) {
        const c = ultrasoundInterface(z1, z2);
        expect(c.forward).toBeCloseTo(1 + c.r, 13);
        expect(c.reflectedEnergy + c.transmittedEnergy).toBeCloseTo(1, 13);
        expect(c.forward * c.reverse).toBeCloseTo(c.transmittedEnergy, 13);
        expect(ultrasoundInterface(z2, z1).r).toBeCloseTo(-c.r, 13);
      }
    expect(ultrasoundInterface(1, 3).forward).toBeGreaterThan(1);
    expect(ultrasoundInterface(3, 1).r).toBeLessThan(0);
  });

  it('places echo centers at actual round-trip times through layers of different speeds', () => {
    const line = ultrasoundLine(
      [layer(0, 10, 1.5, 1000), layer(10, 30, 2, 2000), layer(30, 60, 1.7)],
      config,
    );
    expect(line.echoes[0].time).toBe(20);
    expect(line.echoes[1].time).toBe(40);
    for (const echo of line.echoes) {
      expect(ultrasoundPath(line, echo.depth).time * 2).toBeCloseTo(echo.time, 12);
      expect(ultrasoundDepthAtTravelTime(line, echo.time / 2)).toBeCloseTo(echo.depth, 12);
    }
    expect(ultrasoundSample(line, 20).real).toBeCloseTo(line.echoes[0].r, 12);
  });

  it('includes both pressure transmissions on each overlying interface', () => {
    const line = ultrasoundLine([layer(0, 10, 1), layer(10, 20, 3), layer(20, 60, 2)], config);
    const [a, b] = line.echoes;
    expect(a.amplitude).toBeCloseTo(0.5, 12);
    expect(b.amplitude).toBeCloseTo(((2 - 3) / (2 + 3)) * 1.5 * 0.5, 12);
    expect(b.pathTransmission).toBeCloseTo(1 - a.r * a.r, 12);
  });

  it('uses 20-log pressure attenuation over the complete two-way path', () => {
    const layers = [layer(0, 20, 1.5), layer(20, 60, 2)];
    layers[0].attenuation = 0.5;
    const line = ultrasoundLine(layers, { ...config, frequency: 3 });
    // 0.5 dB/cm/MHz × 3 MHz × 4 cm = 6 dB, not 3 or 12 dB.
    expect(line.echoes[0].amplitude / line.echoes[0].r).toBeCloseTo(10 ** (-6 / 20), 12);
    expect((line.echoes[0].amplitude / line.echoes[0].r) ** 2).toBeCloseTo(10 ** (-6 / 10), 12);
  });

  it('has finite pulse support, preserves reflection sign and gives nonnegative coherent envelopes', () => {
    const half = ultrasoundPulseDuration(config) / 2;
    expect(ultrasoundPulse(half, config).envelope).toBe(0);
    expect(ultrasoundPulse(-half - 0.01, config).real).toBe(0);
    expect(ultrasoundPulse(0, config).real).toBe(1);
    const positive = ultrasoundLine([layer(0, 20, 1), layer(20, 60, 3)], config);
    const negative = ultrasoundLine([layer(0, 20, 3), layer(20, 60, 1)], config);
    const time = positive.echoes[0].time;
    for (let dt = -0.4; dt <= 0.4; dt += 0.02) {
      expect(ultrasoundSample(positive, time + dt).real).toBeCloseTo(
        -ultrasoundSample(negative, time + dt).real,
        12,
      );
      expect(ultrasoundSample(positive, time + dt).envelope).toBeCloseTo(
        ultrasoundSample(negative, time + dt).envelope,
        12,
      );
    }
    expect(ultrasoundSample(positive, time - half - 1e-5).envelope).toBe(0);
  });

  it('produces no echoes in a matched uniform column and does not turn zero signal into brightness', () => {
    const line = ultrasoundLine([layer(0, 10, 1.5), layer(10, 60, 1.5)], config);
    for (let t = -2; t < 90; t += 0.13) expect(ultrasoundSample(line, t).envelope).toBe(0);
    expect(ultrasoundBrightness(0)).toBe(0);
    expect(ultrasoundBrightness(0.25)).toBe(255);
    expect(ultrasoundBrightness(0.025)).toBeLessThan(ultrasoundBrightness(0.1));
  });

  it('changes reconstructed depth without changing acquired echoes when assumed speed changes', () => {
    const a = ultrasoundLine(ultrasoundColumn(0, defaults), defaults);
    const wrong = { ...defaults, assumedSpeed: 1700 };
    const b = ultrasoundLine(ultrasoundColumn(0, wrong), wrong);
    expect(a.echoes).toEqual(b.echoes);
    const echo = a.echoes.find((e) => e.depth === 40)!;
    expect(ultrasoundDepth(echo.time, 1540)).toBeCloseTo(40, 12);
    expect(ultrasoundDepth(echo.time, 1700)).toBeCloseTo((40 * 1700) / 1540, 12);
  });

  it('resolves the known thin slab with a short pulse and merges it with a long pulse', () => {
    const short = ultrasoundResolution({ ...defaults, cycles: 2 });
    const long = ultrasoundResolution({ ...defaults, cycles: 8 });
    expect(short.pair[1].depth - short.pair[0].depth).toBeCloseTo(0.64, 12);
    expect(short.peaks.length).toBe(2);
    expect(long.peaks.length).toBe(1);
    expect(
      ultrasoundAxialSupport({ ...defaults, cycles: 8 }) /
        ultrasoundAxialSupport({ ...defaults, cycles: 2 }),
    ).toBe(4);
    expect(short.support).toBeLessThan(defaults.gap);
    expect(long.support).toBeGreaterThan(defaults.gap);
  });

  it('computes the insert shadow from two-way loss while leaving its near face unchanged', () => {
    const clear = { ...defaults, insertAttenuation: 0 },
      dark = { ...defaults, insertAttenuation: 2.2 };
    const a = ultrasoundLine(ultrasoundColumn(10, clear), clear),
      b = ultrasoundLine(ultrasoundColumn(10, dark), dark);
    expect(b.echoes.find((e) => e.depth === 20)!.amplitude).toBe(
      a.echoes.find((e) => e.depth === 20)!.amplitude,
    );
    const ratio =
      b.echoes.find((e) => e.depth === 56)!.amplitude /
      a.echoes.find((e) => e.depth === 56)!.amplitude;
    expect(ratio).toBeCloseTo(10 ** (-(2 * 2.2 * 3 * 0.8) / 20), 12);
  });

  it('builds every B-mode pixel from its own A-line and the same displayed phantom', () => {
    const image = ultrasoundImage(defaults, 19, 141);
    const regions = ultrasoundRegions(defaults);
    for (let col = 0; col < image.width; col++) {
      const column = image.columns[col];
      for (const l of column.line.layers) {
        const mid = (l.top + l.bottom) / 2;
        const region = regions.find(
          (r) => column.x >= r.left && column.x < r.right && mid >= r.top && mid < r.bottom,
        )!;
        expect(region.impedance).toBe(l.impedance);
        expect(region.attenuation).toBe(l.attenuation);
      }
      for (let row = 0; row < image.height; row++) {
        const time = (((70 * (row + 0.5)) / image.height) * 2000) / defaults.assumedSpeed;
        const brightness = ultrasoundBrightness(ultrasoundSample(column.line, time).envelope);
        expect(image.pixels[(row * image.width + col) * 4]).toBe(brightness);
      }
    }
  });

  it('locates image peaks at independently known depths and shifts them with calibration error', () => {
    for (const assumedSpeed of [1480, 1540, 1700]) {
      const image = ultrasoundImage({ ...defaults, assumedSpeed }, 19, 351);
      const column = 9;
      for (const realDepth of [12, 40, 56]) {
        const expected = (realDepth * assumedSpeed) / 1540;
        const candidates = Array.from({ length: image.height }, (_, row) => ({
          depth: ((row + 0.5) * 70) / image.height,
          value: image.pixels[(row * image.width + column) * 4],
        })).filter((sample) => Math.abs(sample.depth - expected) < 1);
        candidates.sort((a, b) => b.value - a.value);
        expect(candidates[0].value).toBeGreaterThan(0);
        expect(Math.abs(candidates[0].depth - expected)).toBeLessThan(0.22);
      }
    }
  });

  it('puts outgoing and returning packet centers on the same travel path', () => {
    const line = ultrasoundLine(ultrasoundColumn(0, config), config);
    for (let time = 0; time <= 80; time += 0.2) {
      for (const packet of ultrasoundPackets(line, time)) {
        expect(packet.top).toBeLessThanOrEqual(packet.bottom);
        expect(packet.top).toBeGreaterThanOrEqual(0);
        const echo = line.echoes.find((e) => e.id === packet.id);
        const travel = ultrasoundPath(line, packet.center).time;
        if (packet.direction === 'down' && time < ultrasoundPath(line, 64).time)
          expect(travel).toBeCloseTo(time, 10);
        else if (echo && time >= echo.oneWayTime && time <= echo.time)
          expect(travel + time).toBeCloseTo(echo.time, 10);
      }
    }
  });

  it('keeps all exploration endpoints finite and completes the final scan record', () => {
    for (const x of [-18, -15, -8, -3, 0, 6, 10, 15, 18])
      for (const cycles of [2, 8]) {
        for (const insertAttenuation of [0, 3])
          for (const assumedSpeed of [1400, 1700]) {
            const c = { ...defaults, cycles, insertAttenuation, assumedSpeed };
            const line = ultrasoundLine(ultrasoundColumn(x, c), c);
            for (const time of [-1.5, 0, 86]) {
              expect(Number.isFinite(ultrasoundSample(line, time).envelope)).toBe(true);
              for (const packet of ultrasoundPackets(line, time)) {
                expect(
                  [packet.top, packet.bottom, packet.center, packet.amplitude].every(
                    Number.isFinite,
                  ),
                ).toBe(true);
                expect(packet.top).toBeGreaterThanOrEqual(0);
                expect(packet.bottom).toBeLessThanOrEqual(64);
              }
            }
          }
      }
    const complete = ultrasoundShot(4, 1);
    expect(complete.scanColumns).toBe(73);
    expect(complete.x).toBe(18);
    expect(complete.time).toBe(86);
    expect(complete.packets).toEqual([]);
  });

  it('reconstructs chapters and B-mode data on reverse seek without history or random samples', () => {
    const states = Array.from({ length: 8 }, (_, c) =>
      Array.from({ length: 51 }, (_, i) => ultrasoundShot(c, i / 50)),
    );
    for (let c = 7; c >= 0; c--)
      for (let i = 50; i >= 0; i--) expect(ultrasoundShot(c, i / 50)).toEqual(states[c][i]);
    const a = ultrasoundImage(ultrasoundShot(6, 0.63).config, 19, 141);
    ultrasoundImage(ultrasoundShot(7, 0.3).config, 19, 141);
    expect(ultrasoundImage(ultrasoundShot(6, 0.63).config, 19, 141).pixels).toEqual(a.pixels);
    expect(() => ultrasoundInterface(0, 1)).toThrow();
    expect(() => ultrasoundColumn(30, defaults)).toThrow();
    expect(() => ultrasoundColumn(0, { ...defaults, speed: 0 })).toThrow();
  });
});
