import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';

export function auditOptions(args) {
  const directories = args.filter((arg) => !arg.startsWith('--'));
  assert(directories.length <= 1, 'Usage: audit-live.mjs [directory] [--after-deploy]');
  assert(
    args.every((arg) => !arg.startsWith('--') || arg === '--after-deploy'),
    'Unknown audit option',
  );
  return { directory: directories[0] || 'dist', afterDeploy: args.includes('--after-deploy') };
}

// One readiness window for the whole audit, rather than a new window for each URL.
export function createLiveCheck({
  afterDeploy = false,
  origin = 'https://vistep.ai',
  fetchImpl = fetch,
  wait = setTimeout,
  now = () => performance.now(),
  log = console.warn,
  retryWindowMs = 180_000,
} = {}) {
  const started = now(),
    deadline = started + retryWindowMs;
  return async function check(path, validate) {
    let attempt = 0,
      lastError;
    const fail = () => {
      throw new Error(`${path}: ${lastError.message} (${attempt} attempts)`, { cause: lastError });
    };
    for (;;) {
      if (attempt && afterDeploy && now() >= deadline) fail();
      const remaining = deadline - now();
      // URLs first reached after the readiness window still receive their normal check.
      // They cannot start a fresh retry window. In-window requests and bodies share its deadline.
      const timeout = afterDeploy && remaining > 0 ? Math.min(30_000, remaining) : 30_000;
      let response;
      attempt++;
      try {
        response = await fetchImpl(`${origin}${path}`, {
          redirect: 'manual',
          signal: AbortSignal.timeout(Math.max(1, Math.floor(timeout))),
        });
        if (afterDeploy && [401, 403].includes(response.status)) {
          await response.body?.cancel();
          throw new Error(`HTTP status ${response.status}`);
        }
        const bytes = Buffer.from(await response.arrayBuffer());
        validate(response, bytes);
        return;
      } catch (error) {
        lastError = error;
        const status = response?.status,
          retryable =
            status === undefined ||
            status === 200 ||
            status === 404 ||
            status === 408 ||
            status === 429 ||
            status >= 500;
        const details = ['cf-ray', 'cf-cache-status', 'age']
          .map((key) => [key, response?.headers.get(key)])
          .filter(([, value]) => value)
          .map(([key, value]) => `${key}=${value}`)
          .join(' ');
        log(
          `Live audit: ${path}, attempt ${attempt}, ${Math.round(now() - started)}ms, ` +
            `HTTP ${status ?? 'unavailable'}${details ? `, ${details}` : ''}: ${error.message}`,
        );
        if (afterDeploy) {
          const left = deadline - now();
          if (!retryable || left <= 0) fail();
          await wait(Math.min(15_000, attempt * 5000, Math.max(1, Math.floor(left / 2))));
        } else {
          if (attempt === 3) fail();
          await wait(2000 * attempt);
        }
      }
    }
  };
}
