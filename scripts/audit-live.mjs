import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { setTimeout } from 'node:timers/promises';

const directory = resolve(process.argv[2] || 'dist');
const origin = 'https://vistep.ai';
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );
const files = walk(directory);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function check(path, validate) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(`${origin}${path}`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(30_000),
      });
      const bytes = Buffer.from(await response.arrayBuffer());
      validate(response, bytes);
      return;
    } catch (error) {
      if (attempt === 2) throw new Error(`${path}: ${error.message}`, { cause: error });
      await setTimeout(2000 * (attempt + 1));
    }
  }
}

const jobs = files
  .filter(
    (file) =>
      !['robots.txt', '_headers', '_redirects'].includes(relative(directory, file)) &&
      !/(^|\/)404\.html$/.test(relative(directory, file)),
  )
  .map((file) => async () => {
    const localPath = relative(directory, file).replaceAll('\\', '/');
    const path = `/${localPath.replace(/(^|\/)index\.html$/, '$1')}`;
    const expected = readFileSync(file);
    await check(path, (response, bytes) => {
      assert.equal(response.status, 200, 'HTTP status');
      assert(!/noindex/i.test(response.headers.get('x-robots-tag') || ''), 'Production is noindex');
      if (localPath.endsWith('.html')) {
        // Cloudflare may add delivery scripts; compare stable page metadata and asset references.
        assert.match(response.headers.get('content-type') || '', /text\/html/);
        const html = bytes.toString();
        for (const tag of expected
          .toString()
          .match(/<title>.*?<\/title>|<link\b[^>]*(?:canonical|hreflang)[^>]*>/g) || []) {
          assert(html.includes(tag), `Missing page metadata: ${tag}`);
        }
        for (const asset of expected
          .toString()
          .matchAll(/(?:src|href)="(\/(?:_astro|narration)\/[^"?#]+)[^"]*"/g)) {
          assert(html.includes(asset[1]), `Stale page asset: ${asset[1]}`);
        }
      } else {
        assert.equal(hash(bytes), hash(expected), 'Published asset differs from verified build');
      }
    });
  });
jobs.push(
  () =>
    check('/robots.txt', (response, bytes) => {
      assert.equal(response.status, 200);
      assert(bytes.toString().includes(`Sitemap: ${origin}/sitemap-index.xml`));
    }),
  ...['/__vistep_missing_page__/', '/en/__vistep_missing_page__/'].map(
    (path) => () =>
      check(path, (response) => assert.equal(response.status, 404, 'Unknown URL must return 404')),
  ),
);
let next = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (next < jobs.length) await jobs[next++]();
  }),
);
console.log(
  `Live audit passed: ${jobs.length} pages, assets, sitemap, robots and 404 checks against the verified build.`,
);
