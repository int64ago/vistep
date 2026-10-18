/** Integrate reviewed textbook mappings. --partial is for local batch review only. */
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const partial = process.argv.includes('--partial');
const read = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const variants = await read('src/data/curriculum-variants.json');
const timeline = await read('src/data/film-timeline.json');
const definitions = {
  chemistry: {
    owners: ['chemistry', 'bio-to-organic', 'bio-to-structure', 'systems-to-physical-chemistry'],
    expected: 183,
    books: {
      'required-1': ['必修第一册', 'Compulsory Book 1'],
      'required-2': ['必修第二册', 'Compulsory Book 2'],
      'elective-1': ['选择性必修1 · 化学反应原理', 'Selective Compulsory 1 · Chemical Reactions'],
      'elective-2': [
        '选择性必修2 · 物质结构与性质',
        'Selective Compulsory 2 · Structure and Properties',
      ],
      'elective-3': ['选择性必修3 · 有机化学基础', 'Selective Compulsory 3 · Organic Chemistry'],
    },
  },
  biology: {
    owners: ['bio-foundations', 'bio-systems'],
    expected: 172,
    books: {
      'required-1': ['必修1 · 分子与细胞', 'Compulsory 1 · Molecules and Cells'],
      'required-2': ['必修2 · 遗传与进化', 'Compulsory 2 · Genetics and Evolution'],
      'elective-1': [
        '选择性必修1 · 稳态与调节',
        'Selective Compulsory 1 · Homeostasis and Regulation',
      ],
      'elective-2': [
        '选择性必修2 · 生物与环境',
        'Selective Compulsory 2 · Organisms and Environment',
      ],
      'elective-3': [
        '选择性必修3 · 生物技术与工程',
        'Selective Compulsory 3 · Biotechnology and Engineering',
      ],
    },
  },
};
const pair = (zh, en) => ({ zh, en });
const outputs = [];
for (const [subject, definition] of Object.entries(definitions)) {
  const { targets } = await read(`drafts/pep-sciences/${subject}-targets.json`);
  assert.equal(targets.length, definition.expected, `${subject}: target set changed`);
  const targetIds = new Set(targets.map((target) => target.id));
  assert.equal(targetIds.size, targets.length);
  const mapping = new Map();
  for (const owner of definition.owners) {
    let packet;
    try {
      packet = await read(`drafts/pep-sciences/${owner}-mapping.json`);
    } catch (error) {
      if (partial && error.code === 'ENOENT') continue;
      throw error;
    }
    for (const entry of packet.entries) {
      assert(targetIds.has(entry.targetId), `${owner}: unknown target ${entry.targetId}`);
      assert(!mapping.has(entry.targetId), `${owner}: duplicate target ${entry.targetId}`);
      mapping.set(entry.targetId, entry);
    }
  }
  const missing = targets.filter((target) => !mapping.has(target.id));
  assert(partial || !missing.length, `${subject}: ${missing.length} unmapped textbook positions`);
  const chapters = new Map(),
    sections = new Map(),
    entries = [];
  const stableLabel = (map, key, value) => {
    assert(
      !map.has(key) || map.get(key) === value,
      `${subject}: inconsistent translation for ${key}`,
    );
    map.set(key, value);
  };
  for (const target of targets) {
    const entry = mapping.get(target.id);
    if (!entry) continue;
    for (const key of ['sceneSlug', 'nameEn', 'chapterEn', 'sectionEn'])
      assert(typeof entry[key] === 'string' && entry[key].trim(), `${target.id}: missing ${key}`);
    for (const key of ['goal', 'kind'])
      for (const locale of ['zh', 'en'])
        assert(entry[key]?.[locale]?.trim(), `${target.id}: missing ${key}.${locale}`);
    const film = timeline[entry.sceneSlug];
    if (!film && partial) continue;
    assert(film, `${target.id}: unregistered film ${entry.sceneSlug}`);
    const indices = entry.chapterIds?.map((id) =>
      film.chapters.findIndex((chapter) => chapter.id === id),
    );
    assert(
      indices?.length &&
        indices.every((index, i) => index >= 0 && (!i || index === indices[i - 1] + 1)),
      `${target.id}: invalid film selection`,
    );
    const variant = variants[target.id];
    assert(variant?.sceneSlug === entry.sceneSlug, `${target.id}: missing packet variant`);
    assert.deepEqual(
      variant.chapterIds,
      entry.chapterIds,
      `${target.id}: packet/mapping disagreement`,
    );
    if (entry.sceneVariant) variant.sceneVariant = entry.sceneVariant;
    const chapterKey = `${target.bookId}-${target.chapterNumber}`;
    const sectionKey = `${chapterKey}-${target.sectionNumber}`;
    stableLabel(chapters, chapterKey, entry.chapterEn);
    stableLabel(sections, sectionKey, entry.sectionEn);
    const book = definition.books[target.bookId];
    const original =
      target.source.titleType === 'textbook' || target.source.titleOrigin?.startsWith('教材原名');
    entries.push({
      id: target.id,
      book: { id: target.bookId, order: target.bookOrder, title: pair(...book) },
      chapter: {
        id: `chapter-${target.chapterNumber}`,
        order: target.chapterNumber,
        title: pair(target.chapterTitle, entry.chapterEn),
      },
      section: {
        id: `section-${target.chapterNumber}-${target.sectionNumber}`,
        order: target.sectionNumber,
        title: pair(target.sectionTitle, entry.sectionEn),
      },
      order: target.order,
      page: target.source.printedPage,
      name: pair(target.source.title, entry.nameEn),
      textbookTitle: pair(target.source.title, entry.nameEn),
      titleIsOriginal: Boolean(original),
      goal: entry.goal,
      kind: entry.kind,
      existingSceneSlug: null,
    });
  }
  assert(
    partial || entries.length === definition.expected,
    `${subject}: incomplete integrated coverage`,
  );
  outputs.push([`src/data/${subject}-curriculum-source.json`, entries]);
  console.log(
    `${subject}: ${entries.length}/${targets.length} integrated textbook positions${partial ? ' (local batch review)' : ''}`,
  );
}
for (const [path, data] of outputs)
  await writeFile(resolve(root, path), JSON.stringify(data, null, 2) + '\n');
await writeFile(
  resolve(root, 'src/data/curriculum-variants.json'),
  JSON.stringify(variants, null, 2) + '\n',
);
