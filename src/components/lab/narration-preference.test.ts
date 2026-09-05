import { describe, expect, it } from 'vitest';
import { narrationPreference, rememberNarration } from './narration-preference';

const store = (initial: string | null = null) => {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next;
    },
  };
};
const unavailable = () => {
  throw new Error('Storage denied');
};

describe('narration preferences', () => {
  it('requests narration for first visits and unavailable storage', () => {
    expect(narrationPreference([() => store()])).toBe(true);
    expect(narrationPreference([unavailable])).toBe(true);
  });
  it('honors a saved mute over an old per-tab enabled preference', () => {
    expect(narrationPreference([() => store('off'), () => store('on')])).toBe(false);
  });
  it('preserves a legacy manual mute when no durable choice exists', () => {
    expect(narrationPreference([() => store(), () => store('off')])).toBe(false);
  });
  it('saves explicit choices and falls back when durable storage is blocked', () => {
    const session = store();
    rememberNarration(false, [unavailable, () => session]);
    expect(narrationPreference([unavailable, () => session])).toBe(false);
    rememberNarration(true, [() => session]);
    expect(narrationPreference([() => session])).toBe(true);
  });
});
