import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSceneDraft } from './new-scene.mjs';

describe('scene drafting command', () => {
  it('creates a bilingual draft without publishing or overwriting existing work', () => {
    const root = mkdtempSync(join(tmpdir(), 'vistep-draft-'));
    try {
      const directory = createSceneDraft(root, 'induction-motor', 'three');
      expect(readdirSync(root)).toEqual(['drafts']);
      expect(readdirSync(directory).sort()).toEqual([
        'brief.md',
        'en.mdx',
        'integration.md',
        'narration.json',
        'review.md',
        'storyboard.json',
        'zh.mdx',
      ]);
      const story = JSON.parse(readFileSync(join(directory, 'storyboard.json'), 'utf8'));
      expect(story).toMatchObject({ slug: 'induction-motor', medium: 'three', chapters: [] });
      writeFileSync(join(directory, 'brief.md'), 'Work in progress');
      expect(() => createSceneDraft(root, 'induction-motor', 'svg')).toThrow();
      expect(readFileSync(join(directory, 'brief.md'), 'utf8')).toBe('Work in progress');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
  it('rejects invalid paths and unspecified presentation choices without creating files', () => {
    const root = mkdtempSync(join(tmpdir(), 'vistep-draft-'));
    try {
      for (const slug of ['../escape', '/absolute', 'two words', '', 'Uppercase'])
        expect(() => createSceneDraft(root, slug, 'svg')).toThrow();
      expect(() => createSceneDraft(root, 'motor', 'template')).toThrow();
      expect(readdirSync(root)).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
