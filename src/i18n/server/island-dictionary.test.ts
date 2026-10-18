import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { islandDictionary, readIslandSource, readExperimentLoaders } from './island-dictionary';
import english from '../en.json';
import { topics } from '../../data/topics';
import timeline from '../../data/film-timeline.json';
import { networkSteps } from '../../models/network';

const full = english as Record<string, string>;
const cache = new Map<string, Record<string, string>>();
const sceneDictionary = (slug: string) => {
  if (!cache.has(slug)) cache.set(slug, islandDictionary('experiment', slug));
  return cache.get(slug)!;
};

/** Assert the serialized subset itself. Calling t() here would hide omissions,
 * because the test setup deliberately registers the full English dictionary.
 */
const expectCopy = (subset: Record<string, string>, key: string) => {
  expect(full[key], `Global English copy is missing: ${key}`).toBeTruthy();
  expect(subset[key], `Island copy is missing: ${key}`).toBe(full[key]);
};

describe('scene-scoped English dictionaries', () => {
  it('reads unformatted handoffs and formatted loaders with either quote style', () => {
    expect([
      ...readExperimentLoaders(`
      const unrelated = { hidden: () => import('./Hidden') };
      export const experimentLoaders = {
        "new-scene": () => import("../components/experiments/NewScene"),
        existing: () => import('../components/experiments/Existing'),
        'other-scene': () =>
          import("../components/experiments/OtherScene"),
      };
    `),
    ]).toEqual([
      ['new-scene', '../components/experiments/NewScene'],
      ['existing', '../components/experiments/Existing'],
      ['other-scene', '../components/experiments/OtherScene'],
    ]);
  });
  it.each(topics.map((topic) => topic.slug))(
    'includes the selected film and shared player/error UI for %s',
    (slug) => {
      const subset = sceneDictionary(slug);
      const film = timeline[slug as keyof typeof timeline];
      for (const chapter of film.chapters) {
        expectCopy(subset, chapter.title);
        expectCopy(subset, chapter.caption);
      }
      for (const key of [
        '实验暂时没能打开',
        '重新加载',
        '正在准备实验…',
        '暂停演示',
        '重播演示',
        '播放演示',
        '自己试试',
        '返回演示',
        '开启语音讲解',
        '先静音看',
      ])
        expectCopy(subset, key);
      // A type-only Film import must not drag the collection timeline back in.
      expect(Object.keys(subset).length, slug).toBeLessThan(Object.keys(full).length / 5);
    },
  );

  it('reuses unchanged extraction and invalidates same-size edits for development reloads', () => {
    const directory = mkdtempSync(join(tmpdir(), 'vistep-island-source-'));
    const file = join(directory, 'Scene.tsx');
    const source = (label: string, dependency: string) =>
      [
        `import { value } from '${dependency}';`,
        "import type { Hidden } from './types';",
        `export const label = ready ? '${label}' : '备用';`,
        'export const caption = `第${step}步' + label + '`;',
      ].join('\n');
    const original = source('甲', './first');
    const edited = source('乙', './other');
    expect(Buffer.byteLength(edited)).toBe(Buffer.byteLength(original));
    try {
      writeFileSync(file, original);
      const first = readIslandSource(file);
      expect(readIslandSource(file)).toBe(first);
      expect(first.filter((item) => item.kind === 'dependency')).toEqual([
        { kind: 'dependency', value: './first' },
      ]);
      expect(first).toContainEqual({ kind: 'literal', value: '甲' });
      expect(first.find((item) => item.kind === 'template')?.value.test('第3步甲')).toBe(true);

      writeFileSync(file, edited);
      const modified = new Date(Date.now() + 2_000);
      utimesSync(file, modified, modified);
      const next = readIslandSource(file);
      expect(next).not.toBe(first);
      expect(readIslandSource(file)).toBe(next);
      expect(next.filter((item) => item.kind === 'dependency')).toEqual([
        { kind: 'dependency', value: './other' },
      ]);
      expect(next).toContainEqual({ kind: 'literal', value: '乙' });
      expect(next).not.toContainEqual({ kind: 'literal', value: '甲' });
      const pattern = next.find((item) => item.kind === 'template')?.value;
      expect(pattern?.test('第3步乙')).toBe(true);
      expect(pattern?.test('第3步甲')).toBe(false);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('follows the actual 3D scene into its fallback and shared unavailable-state controls', () => {
    const subset = sceneDictionary('printer');
    for (const key of [
      '激光打印机三维拆解：感光鼓、激光扫描器、传动齿轮、转印辊和定影器',
      '打印机二维剖面，橙色像素沿鼓面转移到纸上',
      '三维视图暂不可用，下方仍可逐步探索原理。',
      '{0}。拖动或用方向键旋转。',
      '返回三维',
      '二维剖面',
      '激光扫描',
      '定影',
    ])
      expectCopy(subset, key);
  });

  it('keeps both branches of conditional UI labels and array-selected labels', () => {
    const subset = sceneDictionary('rainbow');
    for (const key of [
      '只留下同一滴水',
      '让另一滴送来紫光',
      '把太阳升高',
      '回到低太阳',
      '红光和紫光，来自不同位置的水滴。',
      '同一入射位置的紫光沿虚线离开，错过眼睛。',
      '入水',
      '内反射',
      '出水',
      '水滴光路',
      '方向为何集中',
    ])
      expectCopy(subset, key);
  });

  it('includes model-returned copy in every cache/loss branch of the network lesson', () => {
    const subset = sceneDictionary('network');
    for (const dns of [false, true])
      for (const warm of [false, true])
        for (const resource of [false, true])
          for (const loss of [false, true])
            for (const step of networkSteps(100, dns, warm, resource, loss)) {
              expectCopy(subset, step.name);
              expectCopy(subset, step.description);
            }
  });

  it('does not include other lessons through the dynamic engine registry', () => {
    const subset = sceneDictionary('bicycle');
    for (const slug of ['atomic-bomb', 'hydrogen-bomb', 'transformer', 'elevator'] as const)
      for (const chapter of timeline[slug].chapters) {
        expect(subset[chapter.caption], `${slug}: ${chapter.caption}`).toBeUndefined();
      }
  });

  it('includes errors returned by a scene worker and its model', () => {
    const subset = sceneDictionary('transformer');
    for (const key of [
      '模型未能运行。',
      '请输入教学词表中的字符。',
      '训练出现数值异常，请重置模型。',
    ])
      expectCopy(subset, key);
  });

  it('keeps home copy and its printer fallback without loading the collection dictionary', () => {
    const subset = islandDictionary('home');
    for (const key of [
      '首页演示需要受支持的浏览器。',
      '熟悉的外表，',
      '意想不到的内部。',
      '打印机二维剖面，橙色像素沿鼓面转移到纸上',
    ])
      expectCopy(subset, key);
    expect(Object.keys(subset).length).toBeLessThan(Object.keys(full).length / 20);
    for (const slug of ['atomic-bomb', 'transformer', 'traffic'] as const)
      expect(subset[timeline[slug].chapters[0].caption]).toBeUndefined();
  });

  it('rejects unknown scene identities instead of returning an apparently valid partial dictionary', () => {
    expect(() => islandDictionary('experiment', 'missing-scene')).toThrow(
      /No experiment dictionary entry/,
    );
  });
});
