import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { test } from 'vitest';
import { auditOptions, createLiveCheck } from './live-audit-request.mjs';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const expected = Buffer.from('verified build asset');
const validateAsset = (response, bytes) => {
  assert.equal(response.status, 200);
  assert.equal(digest(bytes), digest(expected), 'asset differs from the verified build');
};

function fixture(replies, options = {}) {
  const state = { time: 0, calls: 0, waits: [], logs: [] };
  const check = createLiveCheck({
    afterDeploy: true,
    now: () => state.time,
    wait: async (ms) => {
      state.waits.push(ms);
      state.time += ms;
    },
    log: (line) => state.logs.push(line),
    fetchImpl: async () => {
      const reply = replies[Math.min(state.calls++, replies.length - 1)];
      if (reply instanceof Error) throw reply;
      return new Response(reply.body, { status: reply.status, headers: reply.headers });
    },
    ...options,
  });
  return { check, state };
}

test('deployment audit waits beyond the old six seconds and still requires exact asset bytes', async () => {
  const { check, state } = fixture([
    { status: 404, body: 'missing', headers: { 'cf-ray': 'test-edge', 'cf-cache-status': 'MISS' } },
    { status: 200, body: 'old build asset' },
    { status: 503, body: 'unavailable' },
    { status: 200, body: expected },
  ]);
  await check('/_astro/asset.js', validateAsset);
  assert.equal(state.calls, 4);
  assert.deepEqual(state.waits, [5000, 10000, 15000]);
  assert.match(
    state.logs[0],
    /asset\.js, attempt 1, 0ms, HTTP 404, cf-ray=test-edge cf-cache-status=MISS/,
  );
  assert.match(state.logs[1], /asset differs from the verified build/);
});

test('stale HTML must recover to the expected metadata', async () => {
  const { check, state } = fixture([
    { status: 200, body: '<title>Old page</title>' },
    { status: 200, body: '<title>Verified page</title>' },
  ]);
  await check('/explore/topic/', (response, bytes) => {
    assert.equal(response.status, 200);
    assert.match(bytes.toString(), /<title>Verified page<\/title>/);
  });
  assert.equal(state.calls, 2);
});

test('network errors can recover inside the deployment window', async () => {
  const { check, state } = fixture([
    new TypeError('fetch failed'),
    { status: 200, body: expected },
  ]);
  await check('/asset.js', validateAsset);
  assert.equal(state.calls, 2);
  assert.match(state.logs[0], /HTTP unavailable: fetch failed/);
});

for (const reply of [
  { status: 404, body: 'missing' },
  { status: 200, body: 'wrong hash' },
  { status: 503, body: 'unavailable' },
]) {
  test(`persistent HTTP ${reply.status} / ${reply.body} fails at the shared deadline`, async () => {
    const { check, state } = fixture([reply], { retryWindowMs: 20_000 });
    await assert.rejects(check('/broken.js', validateAsset), (error) => {
      assert.match(error.message, /^\/broken\.js:/);
      assert(error.cause instanceof assert.AssertionError);
      return true;
    });
    assert.equal(state.time, 20_000);
    assert(state.calls > 1);
  });
}

for (const status of [401, 403]) {
  test(`HTTP ${status} fails without waiting for a hanging body or retrying`, async () => {
    let cancelled = false;
    let read = false;
    const response = new Response(
      new ReadableStream({
        cancel: () => {
          cancelled = true;
        },
      }),
      { status },
    );
    response.arrayBuffer = async () => {
      read = true;
      throw new Error('Must not read the authorization failure body');
    };
    const { check, state } = fixture([], {
      fetchImpl: async () => {
        state.calls++;
        return response;
      },
    });
    await assert.rejects(check('/asset.js', validateAsset), new RegExp(`HTTP status ${status}`));
    assert.equal(state.calls, 1);
    assert.deepEqual(state.waits, []);
    assert.equal(read, false);
    assert.equal(cancelled, true);
  });
}

test('ordinary manual audits retain three attempts and two plus four second waits', async () => {
  const { check, state } = fixture([{ status: 404, body: 'missing' }], { afterDeploy: false });
  await assert.rejects(check('/asset.js', validateAsset), /3 attempts/);
  assert.equal(state.calls, 3);
  assert.deepEqual(state.waits, [2000, 4000]);
});

test('six workers and later URLs cannot start additional readiness windows', async () => {
  let time = 0;
  const pending = [];
  const waits = [];
  const check = createLiveCheck({
    afterDeploy: true,
    now: () => time,
    wait: async (ms) => waits.push(ms),
    log: () => {},
    fetchImpl: () => new Promise((resolve) => pending.push(resolve)),
  });
  const workers = Promise.allSettled(
    Array.from({ length: 6 }, (_, i) => check(`/asset-${i}.js`, validateAsset)),
  );
  time = 180_000;
  pending.splice(0).forEach((resolve) => resolve(new Response('missing', { status: 404 })));
  assert((await workers).every((result) => result.status === 'rejected'));
  assert.deepEqual(waits, []);

  const healthy = check('/later-good.js', validateAsset);
  pending.shift()(new Response(expected));
  await healthy;
  const broken = check('/later-bad.js', validateAsset);
  pending.shift()(new Response('missing', { status: 404 }));
  await assert.rejects(broken, /1 attempts/);
  assert.deepEqual(waits, []);
});

test('the remaining readiness budget also aborts a hanging response body', async () => {
  let bodyStarted = false;
  const server = createServer((request, response) => {
    if (request.url === '/ready') {
      response.end('ready');
      return;
    }
    response.writeHead(200);
    response.write('partial');
    bodyStarted = true;
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    // Warm up the native HTTP client before measuring the body-abort budget.
    await (await fetch(`${origin}/ready`)).arrayBuffer();
    const check = createLiveCheck({
      afterDeploy: true,
      origin,
      retryWindowMs: 1500,
      log: () => {},
    });
    const started = performance.now();
    await assert.rejects(check('/hanging-body', validateAsset), (error) => {
      assert.match(error.cause.name, /AbortError|TimeoutError/);
      return true;
    });
    assert(bodyStarted, 'the response headers and partial body were received');
    assert(performance.now() - started < 8000, 'must not use the ordinary 30 second timeout');
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}, 10_000);

test('CLI accepts the deployment flag before or after the artifact directory', () => {
  assert.deepEqual(auditOptions([]), { directory: 'dist', afterDeploy: false });
  assert.deepEqual(auditOptions(['--after-deploy']), { directory: 'dist', afterDeploy: true });
  for (const args of [
    ['artifact', '--after-deploy'],
    ['--after-deploy', 'artifact'],
  ]) {
    assert.deepEqual(auditOptions(args), { directory: 'artifact', afterDeploy: true });
  }
  assert.throws(() => auditOptions(['--unknown']), /Unknown audit option/);
  assert.throws(() => auditOptions(['one', 'two']), /Usage/);
});
