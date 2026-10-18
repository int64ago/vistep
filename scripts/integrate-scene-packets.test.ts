import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const fixtures: string[] = [];
afterEach(() => {
  for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true });
});

/** Run the real integration command against an isolated, complete handoff.
 * No published registry, translation source or recording in this checkout is written.
 */
function fixture(duration: number | null = 90) {
  const root = mkdtempSync(join(tmpdir(), 'vistep-short-packet-'));
  fixtures.push(root);
  const write = (path: string, text: string) => {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, text);
  };
  write(
    'scripts/integrate-scene-packets.mjs',
    readFileSync(resolve('scripts/integrate-scene-packets.mjs'), 'utf8'),
  );
  write(
    'src/data/topics.ts',
    "export const topics: Topic[] = [\n{slug:'existing', number:'1'}\n];\n",
  );
  write('src/data/experiments.ts', 'export const experimentLoaders = {\n};\n');
  write(
    'src/data/discovery-metadata.ts',
    "export const discoveryCategories = [{id: 'mechanisms'}];\nexport const discoveryMetadata: Record<string, DiscoveryMetadata> = {\n};\n",
  );
  write('src/components/TopicCover.astro', '---\n---\n<svg></svg>\n');
  write('src/i18n/en.json', '{}\n');
  write('src/data/narration.json', JSON.stringify({ existing: { duration: 180, cues: [] } }));
  write(
    'src/data/film-timeline.json',
    JSON.stringify({ existing: { duration: 180, chapters: [] } }),
  );
  write(
    'src/data/curriculum-variants.json',
    JSON.stringify({
      'existing-experiment': {
        sceneSlug: 'existing',
        chapterIds: ['existing-step'],
        label: { zh: '已有实验', en: 'Existing experiment' },
      },
    }),
  );
  write(
    'src/components/experiments/ShortExplanation.tsx',
    'export default function ShortExplanation() { return null; }\n',
  );
  write('src/components/covers/ShortExplanationCover.astro', '<svg></svg>\n');
  const article =
    '<h2 id="understand">Observation</h2>\n<h2 id="try">Comparison</h2>\n<h2 id="deeper">Model</h2>\n';
  write('src/content/short-explanation.mdx', article);
  write('src/content/en/short-explanation.mdx', article);
  const packet = {
    topic: {
      slug: 'short-explanation',
      name: '短片',
      title: '一次完整的解释',
      question: '什么发生了变化？',
      description: '两个可见步骤形成一个完整因果解释。',
      color: '#668877',
      tag: '观察与比较',
      // Older handoffs may still contain these; neither may become another source of truth.
      duration: '3 分钟',
      category: '生活器物',
      related: ['existing'],
      sources: [{ title: 'Reference', url: 'https://openstax.org/' }],
    },
    component: 'src/components/experiments/ShortExplanation.tsx',
    cover: 'src/components/covers/ShortExplanationCover.astro',
    translations: { 短片: 'Short explanation' },
    discovery: {
      category: 'mechanisms',
      minAge: 10,
      keywords: {
        zh: ['短片', '实验', '观察'],
        en: ['Short explanation', 'experiment', 'observation'],
      },
    },
    curriculumVariants: {
      'short-textbook-experiment': {
        chapterIds: ['step-0', 'step-1'],
        label: { zh: '短实验', en: 'Short experiment' },
      },
    },
    narration: {
      duration,
      cues: [0, 45].map((at, i) => ({
        id: `step-${i}`,
        title: `步骤${i}`,
        titleEn: `Step ${i}`,
        caption: `观察${i}`,
        captionEn: `Observation ${i}`,
        zh: `这是第${i}个可见变化。`,
        en: `This is visible change ${i}.`,
        seconds: 40,
        chapterAt: at,
        at,
      })),
    },
  };
  write('src/data/scene-packets/short-explanation.json', JSON.stringify(packet));
  const run = (...args: string[]) =>
    spawnSync(
      process.execPath,
      ['scripts/integrate-scene-packets.mjs', 'short-explanation', ...args],
      { cwd: root, encoding: 'utf8' },
    );
  return { root, run };
}

describe('short explanation integration', () => {
  it('validates a complete 90-second packet without writing, then integrates that same film', () => {
    const { root, run } = fixture();
    const registryPaths = [
      'src/data/topics.ts',
      'src/data/experiments.ts',
      'src/components/TopicCover.astro',
      'src/i18n/en.json',
      'src/data/narration.json',
      'src/data/discovery-metadata.ts',
      'src/data/film-timeline.json',
      'src/data/curriculum-variants.json',
    ];
    const before = registryPaths.map((path) => readFileSync(join(root, path), 'utf8'));
    const dry = run();
    expect(dry.status, dry.stderr).toBe(0);
    expect(dry.stdout).toContain('Validation only; no shared files changed.');
    expect(registryPaths.map((path) => readFileSync(join(root, path), 'utf8'))).toEqual(before);
    const apply = run('--apply');
    expect(apply.status, apply.stderr).toBe(0);
    const scripts = JSON.parse(readFileSync(join(root, 'src/data/narration.json'), 'utf8'));
    expect(scripts['short-explanation']).toMatchObject({
      duration: 90,
      cues: [{ chapterAt: 0 }, { chapterAt: 45 }],
    });
    const topics = readFileSync(join(root, 'src/data/topics.ts'), 'utf8');
    expect(topics).toContain('"slug": "short-explanation"');
    expect(topics).not.toContain('"duration"');
    expect(topics).not.toContain('"category"');
    expect(readFileSync(join(root, 'src/data/discovery-metadata.ts'), 'utf8')).toContain(
      '"short-explanation"',
    );
    const timeline = JSON.parse(readFileSync(join(root, 'src/data/film-timeline.json'), 'utf8'));
    expect(timeline.existing).toEqual({ duration: 180, chapters: [] });
    expect(timeline['short-explanation']).toMatchObject({
      duration: 90,
      chapters: [
        { id: 'step-0', at: 0 },
        { id: 'step-1', at: 45 },
      ],
    });
    const variants = JSON.parse(
      readFileSync(join(root, 'src/data/curriculum-variants.json'), 'utf8'),
    );
    expect(variants['existing-experiment']).toEqual({
      sceneSlug: 'existing',
      chapterIds: ['existing-step'],
      label: { zh: '已有实验', en: 'Existing experiment' },
    });
    expect(variants['short-textbook-experiment']).toEqual({
      sceneSlug: 'short-explanation',
      chapterIds: ['step-0', 'step-1'],
      label: { zh: '短实验', en: 'Short experiment' },
    });
  });

  it.each([0, -1, 300.01, null])(
    'rejects invalid film duration %s without publishing it',
    (duration) => {
      const { root, run } = fixture(duration);
      const before = readFileSync(join(root, 'src/data/topics.ts'), 'utf8');
      const result = run('--apply');
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('invalid planned film');
      expect(readFileSync(join(root, 'src/data/topics.ts'), 'utf8')).toBe(before);
    },
  );

  it('preserves an apparatus key independently of the textbook location', () => {
    const { root, run } = fixture();
    const packetPath = join(root, 'src/data/scene-packets/short-explanation.json');
    const packet = JSON.parse(readFileSync(packetPath, 'utf8'));
    packet.curriculumVariants['chem-new-book-location'] = {
      chapterIds: ['step-1'],
      sceneVariant: 'shared-apparatus',
      label: { zh: '同一装置的新学习位置', en: 'A new context for the same apparatus' },
    };
    writeFileSync(packetPath, JSON.stringify(packet));
    const result = run('--apply');
    expect(result.status, result.stderr).toBe(0);
    const variants = JSON.parse(
      readFileSync(join(root, 'src/data/curriculum-variants.json'), 'utf8'),
    );
    expect(variants['chem-new-book-location']).toMatchObject({
      sceneSlug: 'short-explanation',
      chapterIds: ['step-1'],
      sceneVariant: 'shared-apparatus',
    });
    expect(variants['existing-experiment'].sceneVariant).toBeUndefined();
  });

  it('keeps the five-minute ceiling inclusive', () => {
    const { run } = fixture(300);
    const result = run();
    expect(result.status, result.stderr).toBe(0);
  });

  it('rejects missing discovery metadata before changing any registry', () => {
    const { root, run } = fixture();
    const packetPath = join(root, 'src/data/scene-packets/short-explanation.json');
    const packet = JSON.parse(readFileSync(packetPath, 'utf8'));
    delete packet.discovery;
    writeFileSync(packetPath, JSON.stringify(packet));
    const before = readFileSync(join(root, 'src/data/topics.ts'), 'utf8');
    const result = run('--apply');
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('discovery category');
    expect(readFileSync(join(root, 'src/data/topics.ts'), 'utf8')).toBe(before);
  });

  it('rejects an English search index that omits the translated scene name', () => {
    const { root, run } = fixture();
    const packetPath = join(root, 'src/data/scene-packets/short-explanation.json');
    const packet = JSON.parse(readFileSync(packetPath, 'utf8'));
    packet.discovery.keywords.en[0] = 'A different name';
    writeFileSync(packetPath, JSON.stringify(packet));
    const result = run('--apply');
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('exact Chinese and English topic names');
  });

  it.each([['step-1', 'step-0'], ['step-0', 'step-0'], ['missing']])(
    'rejects an invalid textbook chapter window %j without writing its timeline or mapping',
    (...chapterIds) => {
      const { root, run } = fixture();
      const packetPath = join(root, 'src/data/scene-packets/short-explanation.json');
      const packet = JSON.parse(readFileSync(packetPath, 'utf8'));
      packet.curriculumVariants['short-textbook-experiment'].chapterIds = chapterIds;
      writeFileSync(packetPath, JSON.stringify(packet));
      const paths = [
        'src/data/topics.ts',
        'src/data/film-timeline.json',
        'src/data/curriculum-variants.json',
      ];
      const before = paths.map((path) => readFileSync(join(root, path), 'utf8'));
      const result = run('--apply');
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('curriculum chapters must exist in consecutive order');
      expect(paths.map((path) => readFileSync(join(root, path), 'utf8'))).toEqual(before);
    },
  );
});
