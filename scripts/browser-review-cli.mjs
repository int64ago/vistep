import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as browsers from 'playwright';
import {
  createReviewPlan,
  readBrowserState,
  runBrowserReview,
  waitForBrowserState,
  REVIEW_SCHEMA_VERSION,
} from './browser-review.mjs';
import { reviewOptions, sourceFingerprint, startStaticPreview } from './browser-review-node.mjs';

export function playwrightTab(page, logs) {
  page.on('console', (message) =>
    logs.push({
      level: message.type(),
      message: message.text(),
      timestamp: new Date().toISOString(),
      url: message.location().url,
    }),
  );
  page.on('pageerror', (error) =>
    logs.push({
      level: 'pageerror',
      message: error.message,
      timestamp: new Date().toISOString(),
      url: page.url(),
    }),
  );
  return {
    goto: (url) => page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 }),
    playwright: {
      evaluate: (fn, arg) => page.evaluate(fn, arg),
      locator: (selector) => page.locator(selector),
      getByRole: (...args) => page.getByRole(...args),
    },
    getScreenshot: () => page.screenshot({ fullPage: false, animations: 'disabled' }),
  };
}

export function browserLaunchOptions(engine, origin) {
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(origin).hostname);
  return {
    headless: true,
    ...(engine === 'chromium' && local
      ? { args: ['--use-gl=angle', '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader'] }
      : {}),
  };
}

async function faultReview(browser, origin, saveScreenshot, locale) {
  const results = [];
  const route = (slug) =>
    new URL(`${locale === 'en' ? '/en' : ''}/explore/${slug}/#t=0`, origin).href;
  for (const fault of ['audio-timeout', 'no-webgl', 'no-worker']) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: fault === 'audio-timeout' ? 'no-preference' : 'reduce',
    });
    const page = await context.newPage();
    const logs = [],
      tab = playwrightTab(page, logs),
      pendingAudio = [];
    const result = {
      name: `${fault}-${locale}`,
      locale,
      fault,
      status: 'not-run',
      startedAt: new Date().toISOString(),
      conditions: {
        kind: 'injected-browser-fault',
        completePlayback: false,
        listening: false,
        physicalDevice: false,
      },
      checks: [],
      console: logs,
    };
    try {
      if (fault === 'audio-timeout') {
        await page.route('**/narration/**', (intercepted) => {
          pendingAudio.push(intercepted);
        });
        await tab.goto(route('network'));
        await waitForBrowserState(tab, (s) => s.bounds.player && s.time === 0);
        const voice = page.locator('.film-voice');
        if ((await voice.getAttribute('aria-pressed')) === 'true') await voice.click();
        await voice.click(); // explicit reader activation; no autoplay-policy bypass
        const silent = await waitForBrowserState(
          tab,
          (s) => s.narration === 'off' && !!s.voiceStatus,
          { timeoutMs: 20_000 },
        );
        await waitForBrowserState(tab, (s) => s.time > silent.time + 0.2);
        const preference = await page.evaluate(() => localStorage.getItem('vistep:narration'));
        if (preference !== 'on') throw new Error('Timeout overwrote the saved manual sound choice');
        result.checks.push({ type: 'timeout-silent-clock-and-preference', status: 'passed' });
        result.timeoutState = silent;
        await page.unroute('**/narration/**');
        for (const intercepted of pendingAudio.splice(0)) await intercepted.abort().catch(() => {});
        await new Promise((done) => setTimeout(done, 150));
        await voice.click();
        result.recoveredState = await waitForBrowserState(
          tab,
          (s) => s.narration === 'on' && !s.audio?.paused && s.audio?.readyState >= 2,
          { timeoutMs: 20_000 },
        );
        result.checks.push({ type: 'user-retry-recovers-audio', status: 'passed' });
      } else if (fault === 'no-webgl') {
        await page.addInitScript(() => {
          const original = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
            return /^(webgl2?|experimental-webgl)$/.test(kind)
              ? null
              : original.call(this, kind, ...args);
          };
        });
        await tab.goto(route('printer'));
        result.fallbackState = await waitForBrowserState(
          tab,
          (s) => s.bounds.player && s.fallbackVisible,
        );
        if (
          result.fallbackState.coreNoticeVisible ||
          result.fallbackState.unsupported ||
          result.fallbackState.errors.length
        )
          throw new Error('Missing WebGL rejected or broke the lesson');
        result.checks.push({ type: 'webgl-2d-fallback', status: 'passed' });
        result.fallbackScreenshot = await saveScreenshot(
          `${result.name}-printer-fallback`,
          await tab.getScreenshot(),
        );
        await tab.goto(route('network'));
        result.svgState = await waitForBrowserState(
          tab,
          (s) => s.bounds.player && s.art.some((a) => a.tag === 'svg'),
        );
        if (result.svgState.coreNoticeVisible || result.svgState.errors.length)
          throw new Error('A pure 2D lesson was rejected without WebGL');
        result.checks.push({ type: 'svg-lesson-without-webgl', status: 'passed' });
      } else {
        await page.addInitScript(() => {
          window.Worker = class {
            constructor() {
              throw new Error('Injected Worker creation failure');
            }
          };
        });
        await tab.goto(route('transformer'));
        await page.locator('.film-mode').click();
        await page
          .getByRole('alert')
          .filter({ hasText: locale === 'zh' ? '后台模型计算' : 'background model' })
          .waitFor({ state: 'visible' });
        result.state = await page.evaluate(readBrowserState);
        if (result.state.unsupported || result.state.errors.length)
          throw new Error('Worker failure escaped the scene error state');
        result.checks.push({ type: 'worker-explicit-readable-error', status: 'passed' });
      }
      result.screenshot = await saveScreenshot(result.name, await tab.getScreenshot());
      if (logs.some((entry) => entry.level === 'pageerror'))
        throw new Error('Unhandled page error during fault injection; see console evidence');
      result.status = 'passed';
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      result.checks.push({ type: fault, status: 'failed', evidence: [error.message] });
      try {
        result.screenshot = await saveScreenshot(result.name, await tab.getScreenshot());
      } catch {}
    } finally {
      result.finishedAt = new Date().toISOString();
      await context.close();
      results.push(result);
    }
  }
  return results;
}

export async function main(argv = process.argv.slice(2)) {
  const options = reviewOptions(argv);
  if (options.help) {
    console.log(
      'Browser smoke review: [--all] [--all-chapters] [--slugs printer,network] [--locale zh,en] [--widths 320,390,1440] [--browser chromium|firefox|webkit] [--no-faults|--faults-only] [--directory dist-preview] [--base-url URL] [--out-dir PATH]',
    );
    return;
  }
  const outDir = resolve(options.outDir);
  mkdirSync(outDir, { recursive: true });
  const report = {
    schemaVersion: REVIEW_SCHEMA_VERSION,
    source: sourceFingerprint(),
    owner: 'browser-review-cli',
    browser: { engine: options.browser, version: null },
    startedAt: new Date().toISOString(),
    publication: 'local',
    status: 'not-run',
    coverage: {
      keyframes: 'paused chapter samples',
      completePlayback: 'not-run',
      humanVisualReview: 'not-run',
      listening: 'not-run',
      physicalDevicePerformance: 'not-run',
      minimumBrowserVersions: 'not-run',
    },
    cases: [],
    faults: [],
    options,
  };
  const save = () =>
    writeFileSync(resolve(outDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  const saveScreenshot = async (name, bytes) => {
    const file = `${name}.png`;
    writeFileSync(resolve(outDir, file), bytes);
    return file;
  };
  let server, browser;
  save();
  if (options.prepareOnly) {
    console.log(`Browser evidence initialized as not-run: ${options.outDir}/report.json`);
    return;
  }
  try {
    server = options.origin ? null : await startStaticPreview(options.directory);
    const origin = options.origin || server.origin;
    report.origin = origin;
    const launchOptions = browserLaunchOptions(options.browser, origin);
    report.browser.graphics = launchOptions.args
      ? 'SwiftShader software WebGL on trusted local preview'
      : 'browser default';
    browser = await browsers[options.browser].launch(launchOptions);
    report.browser.version = browser.version();
    if (!options.faultsOnly) {
      const films = JSON.parse(readFileSync('src/data/film-timeline.json', 'utf8'));
      const plan = createReviewPlan({ films, ...options });
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      try {
        const page = await context.newPage(),
          logs = [];
        const tab = playwrightTab(page, logs);
        await runBrowserReview({
          tab,
          origin,
          plan,
          setViewport: (viewport) => page.setViewportSize(viewport),
          saveScreenshot,
          browserInfo: report.browser,
          getLogs: async () => logs.splice(0),
          onResult: (result, results) => {
            report.cases = results;
            save();
            console.log(`${result.status}: ${result.name}`);
          },
        });
      } finally {
        await context.close();
      }
    }
    if (options.faults)
      for (const locale of options.locales) {
        report.faults.push(...(await faultReview(browser, origin, saveScreenshot, locale)));
        save();
      }
    report.status = [...report.cases, ...report.faults].some((r) => r.status === 'failed')
      ? 'failed'
      : 'passed';
    if (report.status === 'failed') process.exitCode = 1;
  } catch (error) {
    report.status = 'failed';
    report.error = error.message;
    process.exitCode = 1;
  } finally {
    await browser?.close();
    await server?.close();
    report.finishedAt = new Date().toISOString();
    save();
    console.log(
      `Browser smoke ${report.status}: ${options.outDir}/report.json (not complete watching, listening or a physical-device test)`,
    );
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  await main();
