import { describe, expect, it } from 'vitest';
import {
  ESIM_ACTIONS,
  ESIM_ACTIVATION,
  ESIM_SEGMENTS,
  esimAdvance,
  esimInitial,
  esimReplay,
  esimShot,
  esimSwitch,
} from './esim';
describe('consumer eSIM provisioning lifecycle', () => {
  it('requires authentication and complete delivery before installing; installation remains disabled', () => {
    const prepared = esimReplay(ESIM_ACTIONS.slice(0, 5));
    const installed = esimAdvance(prepared, 'install');
    expect(installed.installed).toEqual(['home', 'travel']);
    expect(installed.active).toBe('home');
    const enabled = esimAdvance(installed, 'enable');
    expect(enabled.active).toBe('travel');
    expect(enabled.networkAuthenticated).toBe(false);
    expect(esimAdvance(enabled, 'network-auth').networkAuthenticated).toBe(true);
    expect(esimAdvance(esimInitial(), 'install').error).toBe('order');
    expect(esimAdvance(esimReplay(ESIM_ACTIONS.slice(0, 5), 'none', 7), 'install').error).toBe(
      'order',
    );
  });
  it.each(['server', 'recipient', 'integrity', 'offline'] as const)(
    'rejected %s transaction leaves existing service and no partial incoming profile',
    (fault) => {
      const state = esimReplay(ESIM_ACTIONS, fault);
      expect(state.error).toBe(fault);
      expect(state.installed).toEqual(['home']);
      expect(state.active).toBe('home');
      expect(state.networkAuthenticated).toBe(false);
    },
  );
  it('does not authenticate the chip before the server; rejects unbound packages', () => {
    expect(esimAdvance(esimInitial(), 'authenticate-chip').error).toBe('order');
    expect(esimAdvance(esimReplay(['locate', 'authenticate-server']), 'bind').error).toBe('order');
    expect(esimAdvance(esimInitial(), 'receive').error).toBe('order');
  });
  it('is transactional, monotone for segments, and never mutates original states', () => {
    const bound = esimReplay(ESIM_ACTIONS.slice(0, 4)),
      old = JSON.stringify(bound);
    const half = esimAdvance(bound, 'receive', 'none', 4);
    expect(JSON.stringify(bound)).toBe(old);
    expect(esimAdvance(half, 'receive', 'none', 2).received).toBe(4);
    expect(() => esimAdvance(bound, 'receive', 'none', ESIM_SEGMENTS + 1)).toThrow();
  });
  it('switches identities only among installed profiles and requires fresh network authentication', () => {
    const ready = esimReplay(ESIM_ACTIONS);
    const home = esimSwitch(ready, 'home');
    expect(home.active).toBe('home');
    expect(home.networkAuthenticated).toBe(false);
    expect(home.installed).toEqual(ready.installed);
    expect(esimSwitch(esimInitial(), 'travel').error).toBe('order');
  });
  it('activation-code illustration contains neither subscriber identity nor network key', () => {
    expect(Object.keys(ESIM_ACTIVATION)).toEqual(['server', 'token']);
    expect(ESIM_ACTIVATION.server).toMatch(/\.invalid$/);
  });
});
describe('chapter reconstruction', () => {
  it('reconstructs fresh response progress after switching instead of reusing the prior identity response', () => {
    expect(esimShot(5, 0.5).reply).toBe(1);
    const switched = esimShot(5, 0.71);
    expect(switched.state.active).toBe('home');
    expect(switched.switching).toBe(true);
    expect(switched.state.networkAuthenticated).toBe(false);
    expect(switched.reply).toBe(0);
    expect(esimShot(5, 0.79).reply).toBeGreaterThan(0);
    expect(esimShot(5, 0.79).reply).toBeLessThan(1);
    expect(esimShot(5, 0.9).state.networkAuthenticated).toBe(true);
  });
  it.each(['server', 'recipient', 'integrity', 'offline'] as const)(
    'does not draw a successful switch or network response after %s failure',
    (fault) => {
      for (const p of [0.35, 0.71, 0.85, 1]) {
        const shot = esimShot(5, p, fault);
        expect(shot.state.active).toBe('home');
        expect(shot.state.error).toBe(fault);
        expect(shot.switching).toBe(false);
        expect(shot.networkReady).toBe(false);
        expect(shot.reply).toBe(0);
      }
    },
  );
  it('seeks backward/forward to exactly the same complete teaching state', () => {
    const expected = esimShot(4, 0.6);
    for (const c of [5, 1, 4, 0, 3]) for (const p of [0, 0.25, 0.75, 1]) esimShot(c, p);
    expect(esimShot(4, 0.6)).toEqual(expected);
    expect(expected.state.installed).toContain('travel');
    expect(expected.state.active).toBe('home');
    expect(esimShot(4, 0.8).state.active).toBe('travel');
  });
  it('rejects a copied bound package without destroying the original transaction', () => {
    const shot = esimShot(3, 0.8);
    expect(shot.copyProbe).toBe(true);
    expect(shot.copiedAccepted).toBe(false);
    expect(shot.state.error).toBeNull();
    expect(shot.state.received).toBe(ESIM_SEGMENTS);
    expect(esimReplay(ESIM_ACTIONS, 'recipient').installed).toEqual(['home']);
  });
  it('distinguishes the attempted recipient from the original chip and package binding', () => {
    for (const progress of [0.19, 0.2, 0.5, 1]) {
      const rejected = esimShot(3, progress, 'recipient');
      expect(rejected.recipient).toBe('B');
      expect(rejected.state.chip).toBe('A');
      expect(rejected.state.boundTo).toBe('A');
      expect(rejected.state.installed).toEqual(['home']);
      expect(rejected.state.active).toBe('home');
      expect(rejected.state.received).toBe(0);
      expect(rejected.state.error).toBe(progress >= 0.2 ? 'recipient' : null);
    }
    for (const fault of ['none', 'server', 'integrity', 'offline'] as const)
      expect(esimShot(3, 1, fault).recipient).toBe('A');
    expect(esimShot(3, 1).copyProbe).toBe(true);
  });
  it('holds boundary states and invalid positions safely', () => {
    for (let c = 0; c < 6; c++)
      for (const p of [0, 0.001, 0.999, 1]) {
        const s = esimShot(c, p);
        expect(s.state.received).toBeLessThanOrEqual(ESIM_SEGMENTS);
        expect(s.state.installed.includes(s.state.active)).toBe(true);
      }
    expect(esimShot(-2, -3).view).toBe('hardware');
    expect(esimShot(10, 5).view).toBe('network');
    expect(() => esimShot(NaN, 0)).toThrow();
  });
});
