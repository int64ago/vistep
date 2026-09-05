import { describe, expect, it } from 'vitest';
import { resolveLanguage } from './resolve-language';

describe('default language negotiation', () => {
  it('keeps an explicit or saved choice above every inferred signal', () => {
    expect(
      resolveLanguage({ saved: 'en', languages: ['zh-CN'], timeZone: 'Asia/Shanghai' }).locale,
    ).toBe('en');
    expect(resolveLanguage({ explicit: 'zh', saved: 'en', languages: ['en-US'] }).locale).toBe(
      'zh',
    );
  });
  it('respects ordered browser preferences even when regional hints disagree', () => {
    expect(
      resolveLanguage({
        languages: ['en-US', 'zh-CN'],
        formatLocale: 'zh-CN',
        timeZone: 'Asia/Shanghai',
      }).locale,
    ).toBe('en');
    expect(
      resolveLanguage({
        languages: ['zh-TW', 'en'],
        formatLocale: 'en-US',
        timeZone: 'America/New_York',
      }).locale,
    ).toBe('zh');
    expect(resolveLanguage({ languages: ['zh', 'en-US', 'en-GB', 'en-AU'] }).locale).toBe('zh');
  });
  it('uses secondary language, formatting and regional evidence when primary signals are absent', () => {
    expect(resolveLanguage({ languages: ['ja-JP', 'zh-CN'] }).locale).toBe('zh');
    expect(resolveLanguage({ formatLocale: 'zh-Hans' }).locale).toBe('zh');
    expect(resolveLanguage({ timeZone: 'Asia/Taipei' }).locale).toBe('zh');
    expect(resolveLanguage({ language: 'en-US', timeZone: 'Asia/Shanghai' }).locale).toBe('en');
  });
  it('ignores malformed preferences and defaults to English without evidence', () => {
    expect(resolveLanguage({ saved: 'javascript:alert(1)', explicit: 'fr' }).locale).toBe('en');
    expect(resolveLanguage({}).locale).toBe('en');
  });
});
