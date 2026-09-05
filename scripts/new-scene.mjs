#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const media = ['three', 'svg', 'canvas', 'audio', 'hybrid'];
export function createSceneDraft(root, slug, medium) {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug ?? ''))
    throw new Error('Use a lowercase URL slug, e.g. induction-motor.');
  if (!media.includes(medium)) throw new Error(`Choose --medium ${media.join('|')}.`);
  const directory = resolve(root, 'drafts', slug);
  mkdirSync(resolve(root, 'drafts'), { recursive: true });
  // Exclusive creation protects an existing draft, including its uncommitted edits.
  mkdirSync(directory);
  const files = {
    'brief.md': `# ${slug}\n\nStatus: draft · Medium: ${medium}\n\n## The one question / 唯一主问题\n\n## Before → after / 观众原先的直觉与最后能解释的现象\n\n## Follow one object / 全程追踪的对象\n\n## Why this medium / 为什么选择 ${medium}\n\n## Model / 状态、单位、不变量、教学简化\n\n## Sources / 对应关键判断的一手资料\n\n## Three decisive frames / 初始、转折、因果结果的桌面与手机构图\n\n## Optional experiment / 只保留能检验结论的操作\n\n## Fallback / 减少动态效果、无声音、无 WebGL 时仍能看懂什么\n`,
    'storyboard.json':
      JSON.stringify({ slug, medium, duration: null, chapters: [] }, null, 2) + '\n',
    'narration.json': JSON.stringify({ [slug]: { duration: null, cues: [] } }, null, 2) + '\n',
    'zh.mdx':
      '<h2 id="understand">原理</h2>\n\n<h2 id="try">自己试试</h2>\n\n<h2 id="deeper">深入了解</h2>\n',
    'en.mdx':
      '<h2 id="understand">How it works</h2>\n\n<h2 id="try">Try it</h2>\n\n<h2 id="deeper">A closer look</h2>\n',
    'review.md': `# ${slug} · review evidence\n\nDo not mark a check passed without recording the observation.\n\n| Check | Evidence / browser / viewport / timestamp | Result |\n| --- | --- | --- |\n| Complete silent film, causal turning point | | Pending |\n| Chinese and English narration, full playback | | Pending |\n| Initial / middle / final still frames, labels and geometry | | Pending |\n| Desktop and narrow phone composition | | Pending |\n| Pause, replay, exploration, reset and keyboard | | Pending |\n| Model invariants, limits and reproducible input | | Pending |\n| Offscreen, background, reduced motion | | Pending |\n| Asset failure, WebGL fallback, resource disposal | | Pending |\n| Build, translations, routes, sitemap and preview | | Pending |\n\n## Remaining limitations\n\n## Preview URL and version\n`,
    'integration.md': `# Publish ${slug}\n\nThis folder is a working brief. It is not registered or shipped to the website.\n\n1. Follow [the scene guide](../../docs/creating-a-scene.md), choose the decisive frames, then build one complete causal sequence.\n2. Implement a pure model in src/models/ where appropriate; design an independent renderer in src/components/experiments/. Do not copy another topic's layout by default.\n3. Register metadata in src/data/topics.ts and an explicit lazy import in src/data/experiments.ts. Add an original cover in TopicCover.astro (and ObjectCover.astro only if featured).\n4. Integrate storyboard chapters into src/data/films.ts; copy zh.mdx and en.mdx into src/content/${slug}.mdx and src/content/en/${slug}.mdx.\n5. Add metadata, labels and caption translations to src/i18n/en.json. Merge the finished narration into src/data/narration.json, render --only ${slug}, and commit its manifest and audio together.\n6. Run pnpm scene:check, pnpm verify and pnpm build:preview. Complete review.md against the actual build, including listening to both languages.\n7. Publish only after the working film and its evidence are complete. Keep the brief and review with the contribution.\n`,
  };
  for (const [name, content] of Object.entries(files))
    writeFileSync(resolve(directory, name), content, { flag: 'wx' });
  return directory;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [slug, flag, medium, ...extra] = process.argv.slice(2);
  if (slug === '--help') {
    console.log('pnpm scene:new <slug> --medium <three|svg|canvas|audio|hybrid>');
  } else {
    try {
      if (flag !== '--medium' || extra.length)
        throw new Error('Usage: pnpm scene:new <slug> --medium <three|svg|canvas|audio|hybrid>');
      console.log(
        `Created ${createSceneDraft(process.cwd(), slug, medium)}\nStart with brief.md. Nothing has been published.`,
      );
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
