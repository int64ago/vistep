import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';

const directory = resolve(process.argv[2] || 'dist');
const preview = process.argv.includes('--preview');
const origin = 'https://vistep.ai';
const headers = readFileSync(join(directory, '_headers'), 'utf8');
assert.equal(
  /X-Robots-Tag:.*noindex/i.test(headers),
  preview,
  'Wrong indexing policy for deployment target',
);
const robots = readFileSync(join(directory, 'robots.txt'), 'utf8');
assert(!/Disallow:\s*\//.test(robots), 'Crawlers must be able to read indexing directives');
assert.equal(robots.includes(`Sitemap: ${origin}/sitemap-index.xml`), !preview);
const index = readFileSync(join(directory, 'sitemap-index.xml'), 'utf8');
assert(index.includes('<sitemapindex'), 'Sitemap index is not XML');
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const maps = locs(index);
assert(maps.length > 0, 'Missing sitemap files');
const urls = maps.flatMap((map) => {
  const url = new URL(map);
  assert.equal(url.origin, origin);
  const xml = readFileSync(join(directory, url.pathname), 'utf8');
  assert(xml.includes('<urlset'), 'Child sitemap is not XML');
  return locs(xml);
});
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
  );
const pages = files(directory).filter((file) => basename(file) === 'index.html');
assert.equal(pages.length, urls.length, 'Sitemap omits or invents pages');
function attr(tag, name) {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}
for (const entry of urls) {
  const url = new URL(entry);
  assert.equal(url.origin, origin);
  assert(url.pathname.endsWith('/'));
  assert(!url.pathname.includes('404'));
  const html = readFileSync(join(directory, url.pathname, 'index.html'), 'utf8');
  const links = html.match(/<link\b[^>]*>/g) || [];
  assert.equal(
    attr(links.find((tag) => attr(tag, 'rel') === 'canonical') || '', 'href'),
    entry,
    `Canonical: ${entry}`,
  );
  const description = (html.match(/<meta\b[^>]*>/g) || []).find(
    (tag) => attr(tag, 'name') === 'description',
  );
  assert((attr(description || '', 'content') || '').length > 15, `Description: ${entry}`);
  assert(
    html.includes(`<html lang="${url.pathname.startsWith('/en/') ? 'en' : 'zh-CN'}"`),
    `Language: ${entry}`,
  );
  for (const language of ['zh-CN', 'en', 'x-default']) {
    const alternate = attr(links.find((tag) => attr(tag, 'hreflang') === language) || '', 'href');
    assert(urls.includes(alternate), `Broken ${language} alternate: ${entry}`);
  }
  for (const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
    const path = decodeURI(match[1]);
    assert(
      existsSync(join(directory, path)) || existsSync(join(directory, path, 'index.html')),
      `Broken asset/link ${path} in ${entry}`,
    );
  }
  assert(!/TODO|PLACEHOLDER/.test(html), `Unfinished content in ${entry}`);
}
assert(existsSync(join(directory, '404.html')), 'Missing static 404');
console.log(
  `Build audit passed: ${urls.length} canonical bilingual pages, internal links/assets, sitemap, 404 and ${preview ? 'preview noindex' : 'production indexing'} policy.`,
);
