import { describe, expect, it } from 'vitest';
import { discoveryMetadata } from '../data/discovery-metadata';
import { topics } from '../data/topics';
import { localizedTopic } from '../i18n';
import {
  emptyFilters,
  matchingScenes,
  normalizeSearch,
  readFilters,
  writeFilters,
  type SearchableScene,
} from './discovery';
const scenes: SearchableScene[] = [
  {
    slug: 'bicycle',
    name: '自行车变速 Bicycle gears',
    category: 'mechanisms',
    minAge: 8,
    duration: 180,
    keywords: '单车 bike transmission',
    text: '齿轮怎样省力 How gears trade speed for force',
  },
  {
    slug: 'planetary-gears',
    name: '行星齿轮 Planetary gears',
    category: 'mechanisms',
    minAge: 12,
    duration: 180.5,
    keywords: 'gearbox 变速箱',
    text: '太阳轮 行星轮 ring and sun',
  },
  {
    slug: 'light',
    name: '光 Light',
    category: 'light-sound',
    minAge: 10,
    duration: 145,
    keywords: 'photon 光子',
    text: '一束光 how photons travel',
  },
];
describe('catalog discovery', () => {
  it('finds the promised AI topic in the real bilingual catalog without matching the brand URL', () => {
    const catalog = topics.map((topic) => {
      const en = localizedTopic(topic, 'en');
      const meta = discoveryMetadata[topic.slug];
      return {
        slug: topic.slug,
        category: meta.category,
        minAge: meta.minAge,
        duration: 180,
        name: `${topic.name} ${en.name}`,
        keywords: [...meta.keywords.zh, ...meta.keywords.en].join(' '),
        text: `${topic.title} ${topic.description} ${en.title} ${en.description}`,
      };
    });
    expect(
      matchingScenes(catalog, { ...emptyFilters(), query: 'AI' }).map((scene) => scene.slug),
    ).toEqual(['transformer']);
    expect(
      matchingScenes(catalog, { ...emptyFilters(), query: '人工智能' }).map((scene) => scene.slug),
    ).toContain('transformer');
  });
  it('treats short Latin acronyms as words rather than matching inside unrelated names', () => {
    const examples = [
      {
        ...scenes[0],
        slug: 'rainbow',
        name: 'Rainbow',
        keywords: 'rain',
        text: 'A chain of light. Try https://vistep.ai.',
      },
      {
        ...scenes[0],
        slug: 'transformer',
        name: 'Training a model',
        keywords: 'AI LLM',
        text: 'Neural network',
      },
    ];
    expect(matchingScenes(examples, { ...emptyFilters(), query: 'AI' }).map((s) => s.slug)).toEqual(
      ['transformer'],
    );
    expect(
      matchingScenes(examples, { ...emptyFilters(), query: 'rain' }).map((s) => s.slug),
    ).toEqual(['rainbow']);
    expect(matchingScenes(examples, { ...emptyFilters(), query: 'ain' })).toEqual([]);
  });
  it('searches both languages, punctuation, full-width input and intersected terms', () => {
    expect(normalizeSearch(' Ｇｅａｒｓ—BIKE ')).toBe('gears bike');
    expect(
      matchingScenes(scenes, { ...emptyFilters(), query: 'gears 自行车' }).map((s) => s.slug),
    ).toEqual(['bicycle']);
    expect(
      matchingScenes(scenes, { ...emptyFilters(), query: 'planetary-gears' }).map((s) => s.slug),
    ).toEqual(['planetary-gears']);
    expect(matchingScenes(scenes, { ...emptyFilters(), query: '光子' }).map((s) => s.slug)).toEqual(
      ['light'],
    );
  });
  it('combines age, category and measured duration with an exact 3 minute boundary', () => {
    expect(
      matchingScenes(scenes, { ...emptyFilters(), age: 10, category: 'mechanisms' }).map(
        (s) => s.slug,
      ),
    ).toEqual(['bicycle']);
    expect(matchingScenes(scenes, { ...emptyFilters(), length: 'short' })).toHaveLength(2);
    expect(
      matchingScenes(scenes, { ...emptyFilters(), length: 'long' }).map((s) => s.slug),
    ).toEqual(['planetary-gears']);
    expect(matchingScenes(scenes, { ...emptyFilters(), age: 8, category: 'light-sound' })).toEqual(
      [],
    );
  });
  it('retains curated order when scores tie and does not mutate the source', () => {
    const before = JSON.stringify(scenes);
    expect(matchingScenes(scenes, emptyFilters()).map((s) => s.slug)).toEqual(
      scenes.map((s) => s.slug),
    );
    expect(JSON.stringify(scenes)).toBe(before);
    expect(matchingScenes(scenes, { ...emptyFilters(), query: '<script>' })).toEqual([]);
  });
  it('sanitizes external URLs and round trips filters while preserving unrelated params and fragments', () => {
    expect(readFilters('?category=made-up&age=9&length=no&q=%20hi%20', ['mechanisms'])).toEqual({
      ...emptyFilters(),
      query: 'hi',
    });
    const filters = {
      query: '光 & light',
      category: 'light-sound',
      age: 12,
      length: 'short' as const,
    };
    const url = writeFilters(new URL('https://vistep.ai/en/?ref=test#collection'), filters);
    expect(readFilters(url.search, ['light-sound'])).toEqual(filters);
    expect(url.hash).toBe('#collection');
    expect(url.searchParams.get('ref')).toBe('test');
    expect(writeFilters(url, emptyFilters()).href).toBe(
      'https://vistep.ai/en/?ref=test#collection',
    );
  });
});
