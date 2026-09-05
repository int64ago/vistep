import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { topics } from './topics';
import { films } from './films';
import { experimentLoaders } from './experiments';
import narration from './narration.json';
import audio from './audio-manifest.json';

describe('published scene contracts', () => {
  const slugs = topics.map((topic) => topic.slug);
  it('connects every published topic to exactly one film, engine and bilingual recording', () => {
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(topics.map((topic) => topic.number)).size).toBe(slugs.length);
    for (const registry of [films, experimentLoaders, narration, audio])
      expect(Object.keys(registry).sort()).toEqual([...slugs].sort());
  });
  it('keeps routes, related links, sources and reading anchors complete', () => {
    for (const topic of topics) {
      expect(topic.slug).toMatch(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
      expect(topic.sources.length).toBeGreaterThan(0);
      for (const source of topic.sources) expect(new URL(source.url).protocol).toBe('https:');
      expect(new Set(topic.related).size).toBe(topic.related.length);
      for (const related of topic.related) {
        expect(slugs).toContain(related);
        expect(related).not.toBe(topic.slug);
      }
      for (const language of ['', 'en/']) {
        const mdx = readFileSync(`src/content/${language}${topic.slug}.mdx`, 'utf8');
        for (const anchor of ['understand', 'try', 'deeper'])
          expect(mdx).toContain(`id="${anchor}"`);
      }
    }
  });
  it('starts every film at zero with strictly ordered chapters inside its duration', () => {
    for (const film of Object.values(films)) {
      expect(film.chapters.length).toBeGreaterThan(1);
      expect(film.chapters[0].at).toBe(0);
      film.chapters.forEach((chapter, i) => {
        expect(chapter.caption.trim()).not.toBe('');
        expect(chapter.at).toBeLessThan(film.duration);
        if (i) expect(chapter.at).toBeGreaterThan(film.chapters[i - 1].at);
      });
    }
  });
});
