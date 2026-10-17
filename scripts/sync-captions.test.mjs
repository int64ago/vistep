import { expect, it } from 'vitest';
import { syncCaptions } from './sync-captions.mjs';
const narration = {
  scene: {
    duration: 10,
    cues: [
      {
        id: 'one',
        chapterAt: 0,
        at: 0.45,
        title: '标题',
        titleEn: 'Title',
        caption: '改后字幕',
        captionEn: 'Revised caption',
        zh: '不变的口语',
        en: 'Unchanged speech',
      },
    ],
  },
};
const timeline = {
  scene: { duration: 10, chapters: [{ id: 'one', at: 0, title: '旧标题', caption: '旧字幕' }] },
};
it('updates screen copy without changing source speech, clocks or unrelated translations', () => {
  const before = structuredClone({ narration, timeline });
  const result = syncCaptions(narration, timeline, { retained: 'Retained' });
  expect(result.timeline.scene.chapters[0]).toMatchObject({
    at: 0,
    caption: '改后字幕',
    captionEn: 'Revised caption',
  });
  expect(result.dictionary).toMatchObject({ retained: 'Retained', 改后字幕: 'Revised caption' });
  expect({ narration, timeline }).toEqual(before);
  expect(syncCaptions(narration, result.timeline, result.dictionary)).toEqual(result);
});
it('refuses to disguise retiming or mismatched chapter identities as a caption edit', () => {
  const moved = structuredClone(narration);
  moved.scene.cues[0].chapterAt = 1;
  expect(() => syncCaptions(moved, timeline, {})).toThrow(/timing/);
  moved.scene.cues[0].chapterAt = 0;
  moved.scene.cues[0].id = 'different';
  expect(() => syncCaptions(moved, timeline, {})).toThrow(/identity/);
  expect(() => syncCaptions(narration, timeline, {}, ['missing'])).toThrow(/Unknown/);
});
