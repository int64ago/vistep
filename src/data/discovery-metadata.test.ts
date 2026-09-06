import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import english from '../i18n/en.json';
import { topics } from './topics';
import { discoveryCategories, discoveryMetadata } from './discovery-metadata';
import filmTimeline from './film-timeline.json';

const normalize = (value: string) => value.normalize('NFKC').trim().toLowerCase();

describe('homepage discovery metadata', () => {
  it('keeps both source catalogs complete, correctly categorized and timed', () => {
    for (const locale of ['zh', 'en'] as const) {
      const file = locale === 'zh' ? '../../docs/zh-CN/catalog.md' : '../../docs/catalog.md';
      const text = readFileSync(new URL(file, import.meta.url), 'utf8');
      const seen: string[] = [];
      for (const section of text.split(/^## /m).slice(1)) {
        const heading = section.split('\n')[0].trim();
        const category = discoveryCategories.find((item) => item.label[locale] === heading);
        expect(category, heading).toBeDefined();
        for (const row of section.matchAll(
          /\]\([^\s)]*\/([^/]+)\.mdx\)\s*\|\s*(\d+):(\d{2})\s*\|/g,
        )) {
          const slug = row[1];
          seen.push(slug);
          expect(discoveryMetadata[slug]?.category, slug).toBe(category!.id);
          const film = filmTimeline[slug as keyof typeof filmTimeline];
          expect(film, slug).toBeDefined();
          expect(Number(row[2]) * 60 + Number(row[3]), slug).toBe(Math.floor(film.duration));
        }
      }
      expect(seen.sort(), locale).toEqual(topics.map((topic) => topic.slug).sort());
    }
  });

  it('covers the published registry exactly once without invented slugs', () => {
    const published = topics.map((topic) => topic.slug);
    expect(new Set(published).size).toBe(published.length);
    expect(Object.keys(discoveryMetadata).sort()).toEqual([...published].sort());

    // A repeated object key can silently replace an earlier entry at runtime.
    const declaration = readFileSync(
      new URL('./discovery-metadata.ts', import.meta.url),
      'utf8',
    ).split('export const discoveryMetadata:')[1];
    const declared = [
      ...declaration.matchAll(/^ {2}(?:['"]([^'"]+)['"]|([a-z][a-z0-9-]*)):\s*\{/gm),
    ].map((match) => match[1] || match[2]);
    expect(declared).toHaveLength(published.length);
    expect(new Set(declared).size).toBe(declared.length);
    expect([...declared].sort()).toEqual([...published].sort());
  });

  it('uses only the six bilingual discovery categories', () => {
    const labels = {
      mechanisms: '器物与机械',
      'light-sound': '光与声音',
      electricity: '电与能量',
      computing: '数字与计算',
      nature: '自然与宇宙',
      'math-systems': '数学与系统',
    };
    const ids = discoveryCategories.map((category) => category.id);
    expect(new Set(ids).size).toBe(6);
    expect(ids).toHaveLength(6);
    expect([...ids].sort()).toEqual(Object.keys(labels).sort());
    for (const category of discoveryCategories) {
      expect(category.label.zh).toBe(labels[category.id]);
      expect(category.label.en).toMatch(/[A-Za-z]/);
      expect(category.label.en.trim()).toBe(category.label.en);
      expect(Object.values(discoveryMetadata).some((item) => item.category === category.id)).toBe(
        true,
      );
    }
    for (const item of Object.values(discoveryMetadata)) expect(ids).toContain(item.category);
  });

  it('supplies an allowed editorial age and usable, deduplicated keywords in both languages', () => {
    for (const [slug, item] of Object.entries(discoveryMetadata)) {
      expect([8, 10, 12, 14], slug).toContain(item.minAge);
      for (const locale of ['zh', 'en'] as const) {
        const words = item.keywords[locale];
        expect(words.length, `${slug}/${locale}`).toBeGreaterThanOrEqual(3);
        expect(
          words.every(
            (word) => typeof word === 'string' && word.trim() === word && word.length > 0,
          ),
          slug,
        ).toBe(true);
        expect(new Set(words.map(normalize)).size, `${slug}/${locale}`).toBe(words.length);
      }
      expect(
        item.keywords.zh.some((word) => /\p{Script=Han}/u.test(word)),
        slug,
      ).toBe(true);
      expect(
        item.keywords.en.every((word) => /[A-Za-z]/.test(word) && !/\p{Script=Han}/u.test(word)),
        slug,
      ).toBe(true);
    }
  });

  it('keeps every published Chinese and English name available to a bilingual search index', () => {
    const translations = english as Record<string, string>;
    for (const topic of topics) {
      const item = discoveryMetadata[topic.slug];
      expect(item.keywords.zh.map(normalize), topic.slug).toContain(normalize(topic.name));
      expect(translations[topic.name], topic.slug).toBeTruthy();
      expect(item.keywords.en.map(normalize), topic.slug).toContain(
        normalize(translations[topic.name]),
      );
    }
  });

  it('includes everyday aliases and technical terms for commonly ambiguous names', () => {
    const examples: Record<string, { zh: string[]; en: string[] }> = {
      refrigerator: { zh: ['冰箱', '热泵'], en: ['fridge', 'refrigerant'] },
      speaker: { zh: ['喇叭', '音圈'], en: ['loudspeaker', 'voice coil'] },
      'memory-cache': { zh: ['高速缓存', '缓存行'], en: ['CPU cache', 'cache miss'] },
      'transformer-electric': {
        zh: ['电力变压器', '绕组'],
        en: ['power transformer', 'turns ratio'],
      },
      transformer: { zh: ['大语言模型', '人工智能'], en: ['Transformer', 'inference'] },
      ultrasound: { zh: ['B超', '回声'], en: ['sonography', 'time of flight'] },
      'public-key': { zh: ['公钥', 'RSA'], en: ['public key', 'modular exponentiation'] },
    };
    for (const [slug, languages] of Object.entries(examples)) {
      for (const locale of ['zh', 'en'] as const) {
        const words = discoveryMetadata[slug].keywords[locale].map(normalize);
        for (const alias of languages[locale])
          expect(words, `${slug}/${locale}`).toContain(normalize(alias));
      }
    }
  });
});
