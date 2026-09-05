import { expect, it } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import scripts from './narration.json';
import manifest from './audio-manifest.json';
import { films } from './films';
type Track = {
  src: string;
  duration: number;
  cues: { at: number; end: number; tempo: number; text: string }[];
};
const audio = manifest as Record<string, Record<'zh' | 'en', Track>>;
it('ships one complete, non-overlapping bilingual soundtrack for each film', () => {
  expect(Object.keys(scripts).sort()).toEqual(Object.keys(films).sort());
  for (const [slug, script] of Object.entries(scripts)) {
    expect(script.duration).toBe(films[slug].duration);
    expect(script.cues.length).toBe(films[slug].chapters.length);
    for (const locale of ['zh', 'en'] as const) {
      const track = audio[slug]?.[locale];
      expect(track, `${slug}/${locale}`).toBeDefined();
      expect(track.duration).toBe(script.duration);
      expect(existsSync(`public${track.src}`)).toBe(true);
      expect(statSync(`public${track.src}`).size).toBeGreaterThan(10000);
      expect(track.cues).toHaveLength(script.cues.length);
      track.cues.forEach((cue, i) => {
        expect(cue.text).toBe(script.cues[i][locale]);
        expect(cue.at).toBe(script.cues[i].at);
        expect(cue.at).toBeGreaterThanOrEqual(films[slug].chapters[i].at);
        expect(cue.end).toBeLessThanOrEqual(script.cues[i + 1]?.at ?? script.duration);
        expect(cue.end).toBeGreaterThan(cue.at + 0.5);
        expect(cue.tempo).toBe(1);
      });
    }
  }
});
