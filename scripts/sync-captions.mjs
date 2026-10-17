#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Synchronize screen copy only. Reject timeline mismatches instead of silently retiming audio. */
export function syncCaptions(narration, timeline, dictionary, slugs = Object.keys(narration)) {
  const next = structuredClone(timeline),
    english = { ...dictionary };
  for (const slug of slugs) {
    const source = narration[slug],
      film = next[slug];
    if (!source || !film) throw new Error(`Unknown scene: ${slug}`);
    if (source.duration !== film.duration || source.cues.length !== film.chapters.length)
      throw new Error(`${slug}: timing changed; regenerate and review its speech first`);
    source.cues.forEach((cue, i) => {
      const chapter = film.chapters[i];
      if (cue.id !== chapter.id || cue.chapterAt !== chapter.at)
        throw new Error(`${slug}/${cue.id}: chapter identity or timing changed`);
      for (const [key, translation] of [
        ['title', 'titleEn'],
        ['caption', 'captionEn'],
      ]) {
        if (!cue[key] || !cue[translation])
          throw new Error(`${slug}/${cue.id}: missing bilingual ${key}`);
        chapter[key] = cue[key];
        chapter[translation] = cue[translation];
        english[cue[key]] = cue[translation];
      }
    });
  }
  return { timeline: next, dictionary: english };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2),
    write = args.includes('--write');
  if (args.some((arg) => arg.startsWith('--') && !['--write', '--check'].includes(arg)))
    throw new Error('Usage: pnpm scene:captions [--check | --write] [slug ...]');
  const slugs = args.filter((arg) => !arg.startsWith('--'));
  const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
  const timelinePath = 'src/data/film-timeline.json',
    dictionaryPath = 'src/i18n/en.json';
  const timeline = read(timelinePath),
    dictionary = read(dictionaryPath);
  const result = syncCaptions(
    read('src/data/narration.json'),
    timeline,
    dictionary,
    slugs.length ? slugs : undefined,
  );
  const changes = [
    [timelinePath, timeline, result.timeline],
    [dictionaryPath, dictionary, result.dictionary],
  ].filter(([, a, b]) => JSON.stringify(a) !== JSON.stringify(b));
  if (write)
    for (const [path, , value] of changes)
      writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
  else if (changes.length) {
    console.error(
      'Screen copy is out of sync. Run pnpm scene:captions --write for the affected scenes.',
    );
    process.exitCode = 1;
  }
  console.log(
    `${write ? 'Synchronized' : 'Checked'} screen copy; ${changes.length} changed file(s). Speech and recordings are untouched.`,
  );
}
