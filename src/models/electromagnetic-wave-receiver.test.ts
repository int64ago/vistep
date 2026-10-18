import { describe, it, expect } from 'vitest';
import {
  EM_C,
  sparkPacket,
  receivedWave,
  receiverIndication,
} from './electromagnetic-wave-receiver';
describe('radiative packet reception', () => {
  it('nothing arrives before the light-speed propagation delay', () => {
    const d = 8,
      delay = (d / EM_C) * 1e9;
    expect(receivedWave(delay - 1, d).envelope).toBe(0);
    expect(receiverIndication(delay - 1, d).response).toBe(0);
    expect(receiverIndication(delay + 60, d).response).toBeGreaterThan(0);
  });
  it('doubling distance halves field and quarters detected indication at equal retarded time', () => {
    const a = receiverIndication((4 / EM_C) * 1e9 + 65, 4),
      b = receiverIndication((8 / EM_C) * 1e9 + 65, 8);
    expect(a.electric / b.electric).toBeCloseTo(2, 12);
    expect(a.response / b.response).toBeCloseTo(4, 12);
  });
  it('E and B share phase and satisfy E=cB', () => {
    const w = receivedWave(90, 8);
    expect(w.electric).toBeCloseTo(EM_C * w.magnetic, 14);
  });
  it('source cessation does not erase a packet already in transit; detector then decays', () => {
    expect(sparkPacket(130).envelope).toBe(0);
    expect(receivedWave(130, 8).envelope).toBeGreaterThan(0);
    const a = receiverIndication(200, 8),
      b = receiverIndication(240, 8);
    expect(b.response / a.response).toBeCloseTo(Math.exp(-1), 10);
    expect(receiverIndication(100, 8, false).response).toBe(0);
  });
});
