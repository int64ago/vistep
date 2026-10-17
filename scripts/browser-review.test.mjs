import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, test } from 'vitest';
import {
  createReviewPlan,
  layoutFindings,
  readBrowserState,
  sampleIsReady,
} from './browser-review.mjs';
import { parseByteRange, reviewOptions, startStaticPreview } from './browser-review-node.mjs';
import { browserLaunchOptions } from './browser-review-cli.mjs';

const film = {
  duration: 180.5,
  chapters: Array.from({ length: 12 }, (_, i) => ({ id: `step-${i}`, at: i * 15 })),
};
test('the default smoke plan covers both languages, three widths and changed scenes plus home', () => {
  const films = Object.fromEntries(
    [
      'printer',
      'network',
      'pendulum',
      'excavator',
      'radar-ranging',
      'database-index',
      'cell-handover',
    ].map((slug) => [slug, film]),
  );
  const plan = createReviewPlan({ films });
  assert.equal(plan.length, 132);
  assert.equal(plan.filter((sample) => sample.slug === 'home').length, 6);
  assert.deepEqual([...new Set(plan.map((sample) => sample.viewport.width))], [320, 390, 1440]);
  assert.deepEqual([...new Set(plan.map((sample) => sample.locale))], ['zh', 'en']);
  assert(
    plan
      .filter((sample) => sample.slug !== 'home')
      .every((sample) => sample.time === film.chapters[sample.chapter].at),
  );
});
test('all scenes/all chapters and a focused plan are explicit, valid coverage', () => {
  const films = { printer: film, another: film };
  assert.equal(
    createReviewPlan({
      films,
      all: true,
      allChapters: true,
      locales: ['en'],
      viewports: [{ width: 390, height: 844 }],
    }).length,
    25,
  );
  assert.equal(
    createReviewPlan({
      films,
      slugs: ['another'],
      locales: ['zh'],
      viewports: [{ width: 320, height: 844 }],
    }).length,
    3,
  );
  assert.throws(() => createReviewPlan({ films, slugs: ['typo'] }), /Unknown review scene/);
});
test('layout findings distinguish broken runtime from observations needing visual review', () => {
  const state = {
    horizontalOverflow: 0,
    unsupported: null,
    errors: [],
    invalidPaths: 0,
    chapter: 1,
    time: 15,
    bounds: { player: { height: 900 }, stage: {} },
    viewport: { height: 844 },
    fontSamples: [{ effectivePx: 10, text: 'label' }],
    controls: [{ bounds: { height: 44, width: 44 } }],
  };
  const result = layoutFindings(state, { slug: 'printer', chapter: 1, time: 15 });
  assert.equal(result.failures.length, 0);
  assert.equal(result.smallFonts.length, 1);
  assert.equal(result.observations.length, 2);
  const broken = layoutFindings(
    { ...state, horizontalOverflow: 12, errors: ['engine failed'], invalidPaths: 1, time: NaN },
    { slug: 'printer', chapter: 1, time: 15 },
  );
  assert.equal(broken.failures.length, 4);
});
test('a matching director behind an asynchronous scene loading message is not ready or passed', () => {
  const state = {
    bounds: { player: {}, stage: {} },
    chapter: 0,
    time: 0,
    fontsReady: true,
    sceneLoading: true,
    horizontalOverflow: 0,
    unsupported: null,
    errors: [],
    invalidPaths: 0,
    fontSamples: [],
    controls: [],
    viewport: { height: 844 },
  };
  const sample = { slug: 'cell-handover', chapter: 0, time: 0 };
  assert.equal(sampleIsReady(state, sample), false);
  assert.equal(layoutFindings(state, sample).failures.length, 1);
  assert.equal(sampleIsReady({ ...state, sceneLoading: false }, sample), true);
  assert.equal(sampleIsReady({ ...state, sceneLoading: false, time: NaN }, sample), false);
});
test('the shared browser callback only inspects DOM-backed state', () => {
  assert.doesNotMatch(
    readBrowserState.toString(),
    /\b(?:Element|parseFloat|location|innerWidth|innerHeight|navigator)\b/,
  );
  assert.doesNotMatch(
    readBrowserState.toString(),
    /localStorage|dispatchEvent|scrollIntoView|\.click\(|requestAnimationFrame/,
  );
});
test('software WebGL is scoped to the trusted local Chromium preview', () => {
  assert(
    browserLaunchOptions('chromium', 'http://127.0.0.1:4325').args.includes(
      '--enable-unsafe-swiftshader',
    ),
  );
  assert.equal(browserLaunchOptions('chromium', 'https://vistep.ai').args, undefined);
  assert.equal(browserLaunchOptions('firefox', 'http://127.0.0.1:4325').args, undefined);
});
test('CLI parsing rejects misspelled or unsafe selections without launching a browser', () => {
  assert.deepEqual(reviewOptions(['--locale', 'en', '--widths', '320,1440']).viewports, [
    { width: 320, height: 844 },
    { width: 1440, height: 1000 },
  ]);
  assert.equal(reviewOptions(['--prepare-only']).prepareOnly, true);
  assert.throws(() => reviewOptions(['--widths', 'NaN']), /Viewport/);
  assert.throws(() => reviewOptions(['--browser', 'unknown']), /Browser/);
  assert.throws(() => reviewOptions(['--locale', 'de']), /Locales/);
  assert.throws(() => reviewOptions(['--faults-only', '--no-faults']), /cannot/);
  assert.throws(() => reviewOptions(['--slugs']), /needs a value/);
});
test('single audio byte ranges include open and suffix ranges and reject invalid intervals', () => {
  assert.deepEqual(parseByteRange('bytes=5-', 20), { start: 5, end: 19 });
  assert.deepEqual(parseByteRange('bytes=-5', 20), { start: 15, end: 19 });
  assert.deepEqual(parseByteRange('bytes=5-99', 20), { start: 5, end: 19 });
  for (const header of ['bytes=20-', 'bytes=9-2', 'bytes=-0', 'bytes=-', 'bytes=1-2,3-4'])
    assert.equal(parseByteRange(header, 20), null);
});
let server, directory;
afterEach(async () => {
  await server?.close();
  server = null;
  if (directory) rmSync(directory, { recursive: true, force: true });
});
test('the preview server preserves real audio ranges, HEAD, 404 and preview noindex', async () => {
  directory = mkdtempSync(resolve(tmpdir(), 'vistep-browser-server-'));
  writeFileSync(resolve(directory, 'index.html'), '<h1>preview</h1>');
  writeFileSync(resolve(directory, '404.html'), '<h1>not found</h1>');
  writeFileSync(resolve(directory, 'sample.mp3'), '0123456789');
  server = await startStaticPreview(directory);
  const range = await fetch(server.origin + '/sample.mp3', { headers: { Range: 'bytes=2-4' } });
  assert.equal(range.status, 206);
  assert.equal(await range.text(), '234');
  assert.equal(range.headers.get('content-range'), 'bytes 2-4/10');
  assert.equal(range.headers.get('x-robots-tag'), 'noindex, nofollow');
  const head = await fetch(server.origin + '/sample.mp3', { method: 'HEAD' });
  assert.equal(head.headers.get('content-length'), '10');
  assert.equal(await head.text(), '');
  assert.equal((await fetch(server.origin + '/missing/')).status, 404);
  assert.equal(
    (await fetch(server.origin + '/sample.mp3', { headers: { Range: 'bytes=99-' } })).status,
    416,
  );
});
