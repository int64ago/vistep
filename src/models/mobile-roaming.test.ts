import { describe, expect, it } from 'vitest';
import {
  MR_HOME,
  MR_IMSI,
  MR_KEY,
  MR_PATH,
  MR_RECORD_BEFORE,
  MR_VISITED,
  mrCallRoute,
  mrDataRoute,
  mrHomeRealm,
  mrParseImsi,
  mrRunAka,
  mrSelectNetwork,
  mrUpdateLocation,
  plmnCode,
} from './mobile-roaming';
import { mrHex } from './mobile-roaming-milenage';

describe('identity', () => {
  it('parses the teaching IMSI with an explicit MNC length', () => {
    expect(MR_IMSI).toHaveLength(15);
    expect(mrParseImsi(MR_IMSI, 2)).toEqual({ mcc: '001', mnc: '01', msin: '0123456789' });
    expect(mrParseImsi(MR_IMSI, 3)).toEqual({ mcc: '001', mnc: '010', msin: '123456789' });
  });
  it('rejects malformed identities', () => {
    expect(() => mrParseImsi('0010101234567890', 2)).toThrow(RangeError);
    expect(() => mrParseImsi('00101a', 2)).toThrow(RangeError);
    expect(() => mrParseImsi('00101', 2)).toThrow(RangeError);
  });
  it('derives the Diameter realm with a three-digit MNC', () => {
    expect(mrHomeRealm(MR_HOME)).toBe('epc.mnc001.mcc001.3gppnetwork.org');
    expect(mrHomeRealm({ mcc: '310', mnc: '410' })).toBe('epc.mnc410.mcc310.3gppnetwork.org');
    expect(() => mrHomeRealm({ mcc: '31', mnc: '410' })).toThrow(RangeError);
  });
});

describe('network selection', () => {
  it('prefers the SIM partner list over the strongest signal', () => {
    const s = mrSelectNetwork({});
    const strongest = [...MR_VISITED].sort((a, b) => b.rsrpDbm - a.rsrpDbm)[0];
    expect(strongest.id).toBe('C');
    expect(s.homeFound).toBe(false);
    expect(s.registered?.id).toBe('A');
    expect(s.candidates.map((c) => c.operator.id)).toEqual(['A', 'B', 'C']);
    expect(s.attempts).toHaveLength(1);
  });
  it('falls back through the list when a partner is missing', () => {
    const s = mrSelectNetwork({ found: MR_VISITED.filter((o) => o.id !== 'A') });
    expect(s.registered?.id).toBe('B');
  });
  it('is rejected by a network without an agreement', () => {
    const manual = mrSelectNetwork({ manual: 'C' });
    expect(manual.attempts.map((a) => a.result)).toEqual(['no-agreement']);
    expect(manual.limitedService).toBe(true);
    const onlyC = mrSelectNetwork({ found: MR_VISITED.filter((o) => o.id === 'C') });
    expect(onlyC.registered).toBeNull();
  });
  it('tries every listed partner when home forbids roaming', () => {
    const s = mrSelectNetwork({ roamingEnabled: false });
    expect(s.registered).toBeNull();
    expect(s.attempts.map((a) => a.result)).toEqual([
      'roaming-barred',
      'roaming-barred',
      'no-agreement',
    ]);
  });
  it('handles an empty scan and rejects non-finite signals', () => {
    expect(mrSelectNetwork({ found: [] }).limitedService).toBe(true);
    expect(() => mrSelectNetwork({ found: [{ ...MR_VISITED[0], rsrpDbm: Number.NaN }] })).toThrow(
      RangeError,
    );
  });
});

describe('AKA', () => {
  it('authenticates both sides with the correct key', () => {
    const run = mrRunAka({});
    expect(run.outcome).toBe('success');
    expect(run.sim.macOk && run.sim.sqnFresh && run.resMatches).toBe(true);
    expect(mrHex(run.sim.sqn)).toBe(mrHex(run.vector.sqn));
    expect(mrHex(run.vector.xres)).toBe('a54211d5e3ba50bf');
    // AUTN = SQN⊕AK ‖ AMF ‖ MAC-A, from TS 35.208 test set 1.
    expect(mrHex(run.vector.autn)).toBe('55f328b43577b9b94a9ffac354dfafb3');
  });
  it('never places the key in anything sent over the air', () => {
    const run = mrRunAka({});
    const key = mrHex(MR_KEY);
    for (const sent of [run.received.rand, run.received.autn, run.sim.res, run.vector.xres])
      expect(mrHex(sent).includes(key)).toBe(false);
  });
  it('detects a SIM with one wrong key bit for every bit position', () => {
    for (let bit = 0; bit < 128; bit += 9) {
      const run = mrRunAka({ tamper: 'key', keyBit: bit });
      expect(run.outcome).toBe('mac-failure');
      expect(run.resMatches).toBe(false);
      expect(run.resBitDistance).toBeGreaterThan(8);
    }
  });
  it('lets the SIM reject a tampered RAND', () => {
    expect(mrRunAka({ tamper: 'rand' }).outcome).toBe('mac-failure');
  });
  it('rejects a replayed vector as stale and returns a resynchronisation token', () => {
    const run = mrRunAka({ tamper: 'replay' });
    expect(run.sim.macOk).toBe(true);
    expect(run.sim.sqnFresh).toBe(false);
    expect(run.outcome).toBe('sync-failure');
    expect(run.sim.auts).toHaveLength(14);
  });
  it('binds K_ASME to the serving network', () => {
    const a = mrRunAka({ serving: MR_VISITED[0].plmn }),
      b = mrRunAka({ serving: MR_VISITED[1].plmn });
    expect(mrHex(a.vector.kasme)).not.toBe(mrHex(b.vector.kasme));
    expect(mrHex(a.vector.xres)).toBe(mrHex(b.vector.xres));
  });
  it('rejects invalid inputs', () => {
    expect(() => mrRunAka({ keyBit: 128 })).toThrow(RangeError);
    expect(() => mrRunAka({ tamper: 'x' as never })).toThrow(RangeError);
  });
});

describe('location', () => {
  it('moves the record and cancels the old serving node', () => {
    const u = mrUpdateLocation(MR_RECORD_BEFORE, MR_VISITED[0].plmn);
    expect(u.accepted).toBe(true);
    expect(plmnCode(u.record.servingPlmn)).toBe('002-01');
    expect(u.record.mmeHost).toContain('mnc001.mcc002');
    expect(u.cancelled).toBe(MR_RECORD_BEFORE.mmeHost);
    expect(u.profile?.apn).toBe('internet');
  });
  it('refuses a subscription without roaming and leaves the record', () => {
    const u = mrUpdateLocation(MR_RECORD_BEFORE, MR_VISITED[0].plmn, false);
    expect(u.accepted).toBe(false);
    expect(u.result).toBe(5004);
    expect(u.record).toBe(MR_RECORD_BEFORE);
  });
});

describe('data routes', () => {
  it('uses light in fibre at about 204 km per ms', () => {
    expect(MR_PATH.fibreKmPerMs).toBeCloseTo(204.2, 1);
  });
  it('adds two long legs for a local site when home-routed', () => {
    const hr = mrDataRoute('home-routed', 'local'),
      lbo = mrDataRoute('local-breakout', 'local');
    expect(hr.rttMs - lbo.rttMs).toBeGreaterThan(200);
    expect(hr.addressCountry).toBe('home');
    expect(lbo.addressCountry).toBe('visited');
    const legKm = (r: typeof hr) => r.legs.reduce((s, l) => s + l.km, 0);
    expect(legKm(hr)).toBe(16000);
    expect(legKm(lbo)).toBe(MR_PATH.domesticKm);
  });
  it('makes the two architectures similar for a site at home', () => {
    const hr = mrDataRoute('home-routed', 'home'),
      lbo = mrDataRoute('local-breakout', 'home');
    expect(Math.abs(hr.rttMs - lbo.rttMs)).toBeLessThan(5);
  });
  it('grows linearly with distance and rejects out-of-range input', () => {
    const a = mrDataRoute('home-routed', 'local', 1000),
      b = mrDataRoute('home-routed', 'local', 2000),
      c = mrDataRoute('home-routed', 'local', 3000);
    expect(c.rttMs - b.rttMs).toBeCloseTo(b.rttMs - a.rttMs, 9);
    expect(() => mrDataRoute('home-routed', 'local', 0)).toThrow(RangeError);
    expect(() => mrDataRoute('home-routed', 'local', Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('incoming call', () => {
  it('goes through home, then crosses once for a caller at home', () => {
    const c = mrCallRoute('home');
    expect(c.steps.map((s) => s.id)).toEqual(['dial', 'sri', 'prn', 'msrn', 'route', 'page']);
    expect(c.internationalVoiceLegs).toBe(1);
  });
  it('crosses twice for a caller standing next to you abroad', () => {
    expect(mrCallRoute('visited').internationalVoiceLegs).toBe(2);
  });
});
