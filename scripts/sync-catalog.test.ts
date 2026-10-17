import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { catalogTables, readLiteralExport } from './sync-catalog.mjs';

const fixture = () => ({
  topics: [{ slug: 'phase', name: '相位', question: '波峰 | 波谷\n如何相遇？' }],
  categories: [{ id: 'waves', label: { zh: '波与声音', en: 'Waves & sound' } }],
  discovery: { phase: { category: 'waves' } },
  films: { phase: { duration: 119.6 } },
  translations: { 相位: 'Phase', '波峰 | 波谷\n如何相遇？': 'How do crests | troughs\nmeet?' },
});

describe('source catalog generation', () => {
  it('uses measured time, localized content and relative links in both languages', () => {
    const data = fixture();
    expect(catalogTables(data, 'en')).toContain(
      '| [Phase](../src/content/en/phase.mdx) | 2:00 | How do crests &#124; troughs meet? |',
    );
    expect(catalogTables(data, 'zh')).toContain(
      '| [相位](../../src/content/phase.mdx) | 2:00 | 波峰 &#124; 波谷 如何相遇？ |',
    );
  });

  it('rejects a topic that would disappear from category tables', () => {
    const data = fixture();
    data.discovery.phase.category = 'unknown';
    expect(() => catalogTables(data, 'en')).toThrow('unknown discovery category: phase');
  });

  it('refuses missing timings and translations instead of publishing incomplete rows', () => {
    const data = fixture();
    data.films.phase.duration = NaN;
    expect(() => catalogTables(data, 'en')).toThrow('Missing measured film: phase');
    data.films.phase.duration = 120;
    data.translations.相位 = '';
    expect(() => catalogTables(data, 'en')).toThrow('Missing en catalog text: 相位');
  });

  it('reads literals without running source code and rejects computed values', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vistep-catalog-'));
    const path = join(dir, 'data.ts');
    try {
      writeFileSync(path, `export const rows = [{slug: 'one', age: 10, visible: true}];`);
      expect(readLiteralExport(path, 'rows')).toEqual([{ slug: 'one', age: 10, visible: true }]);
      writeFileSync(path, 'export const rows = dangerousCall();');
      expect(() => readLiteralExport(path, 'rows')).toThrow('unsupported nonliteral');
      writeFileSync(path, 'export const rows = {one: 1, one: 2};');
      expect(() => readLiteralExport(path, 'rows')).toThrow('duplicate property');
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
