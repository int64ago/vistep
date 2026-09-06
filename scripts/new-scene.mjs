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
    'brief.md': `# ${slug}\n\nStatus: draft · Medium: ${medium} · Target: 2–3 minutes (2–5 permitted)\n\n## The one question / 唯一主问题\n\n## Before → after / 观众原先的直觉与最后能解释的现象\n\n## Follow one object / 全程追踪的对象\n\n## Why this medium / 为什么选择 ${medium}\n\n## Model / 状态、单位、不变量、教学简化\n\n## Sources / 对应关键判断的一手资料\n\n## Three decisive frames / 初始、转折、因果结果的桌面与手机构图\n\n## Optional experiment / 只保留能检验结论的操作\n\n## Fallback / 减少动态与静音；启动能力门禁后的静态可读性；运行时图形失败的后备视图\n`,
    'storyboard.json':
      JSON.stringify(
        { slug, medium, duration: null, chapters: [], targetSeconds: 180, maximumSeconds: 300 },
        null,
        2,
      ) + '\n',
    'narration.json': JSON.stringify({ [slug]: { duration: null, cues: [] } }, null, 2) + '\n',
    'zh.mdx':
      '<h2 id="understand">原理</h2>\n\n<h2 id="try">自己试试</h2>\n\n<h2 id="deeper">深入了解</h2>\n',
    'en.mdx':
      '<h2 id="understand">How it works</h2>\n\n<h2 id="try">Try it</h2>\n\n<h2 id="deeper">A closer look</h2>\n',
    'review.md': `# ${slug} · review evidence\n\nDo not mark a check passed without recording the observation.\n\n| Check | Evidence / browser / viewport / timestamp | Result |\n| --- | --- | --- |\n| Complete silent film, causal turning point | | Pending |\n| Chinese and English narration, full playback | | Pending |\n| Initial / middle / final still frames, labels and geometry | | Pending |\n| Desktop and narrow phone composition | | Pending |\n| Pause, replay, all chapter seeks, exploration, reset and keyboard | | Pending |\n| Model invariants, limits and reproducible input | | Pending |\n| Offscreen, background, reduced motion | | Pending |\n| Startup capability notice and static article/catalog readability | | Pending |\n| Runtime asset/WebGL failure, fallback and resource disposal | | Pending |\n| Build, translations, routes, sitemap and preview | | Pending |\n\n## Remaining limitations\n\n## Preview URL and version\n`,
    'integration.md': `# Integrate ${slug}

This folder is a working brief. It is not registered or shipped to the website.

1. Follow [AGENTS.md](../../AGENTS.md) and [the scene guide](../../docs/creating-a-scene.md), choose the decisive frames, then build one complete causal sequence. For multiple new scenes, assign independent scene work to subagents and coordinate shared files through one integration owner.
2. Implement a pure model in src/models/ where appropriate; design an independent renderer in src/components/experiments/. Do not copy another topic's layout by default.
3. Register metadata in src/data/topics.ts, an explicit lazy import in src/data/experiments.ts, and interest, age and search metadata in src/data/discovery-metadata.ts. Copy zh.mdx and en.mdx into src/content/${slug}.mdx and src/content/en/${slug}.mdx; add metadata and interface translations to src/i18n/en.json.
4. Create scene artwork in src/components/covers/ and wire it into TopicCover.astro. Check ObjectCover.astro, SocialCard.astro and CollectionCard.astro where this scene is rendered; verify catalog, homepage fallback and social framing rather than assuming one entry covers them all.
5. Merge complete chapter IDs, bilingual titles/captions, spoken scripts and planned windows into src/data/narration.json. The integration owner runs .venv-voice/bin/python scripts/generate-narration.py --only ${slug} after voice tooling is set up as described in the scene guide. Review both languages, and keep recordings, audio-manifest.json, film-timeline.json and audio-tracks.json together in the change.
6. Update docs/catalog.md and docs/zh-CN/catalog.md with the measured film duration. The optional packet integration helper does not complete discovery metadata, catalog entries, recordings or review.
7. Run pnpm scene:check, pnpm verify and pnpm build:preview. Complete review.md against the actual build, including listening to both languages. Keep the brief and review with the contribution.
8. Follow the session's publication authorization and [deployment guide](../../docs/deployment.md). Pushing main publishes through Actions; review before that push. Agent-created commits must carry accurate Co-Authored-By trailers as required by AGENTS.md.
`,
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
