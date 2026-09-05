import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const build = spawnSync('pnpm', ['exec', 'astro', 'build', '--outDir', 'dist-preview'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (build.status !== 0) process.exit(build.status ?? 1);
const headers = readFileSync('dist-preview/_headers', 'utf8');
writeFileSync(
  'dist-preview/_headers',
  headers.replace('/*\n', '/*\n  X-Robots-Tag: noindex, nofollow\n'),
);
// Allow crawling so search engines can see the noindex response header.
// No sitemap advertisement on the preview host.
writeFileSync('dist-preview/robots.txt', 'User-agent: *\nAllow: /\n');
console.log('Preview built in dist-preview/ with X-Robots-Tag: noindex, nofollow.');
