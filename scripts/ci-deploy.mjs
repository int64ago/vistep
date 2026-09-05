import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';

// Only the production job receives credentials. PRs never run this script.
assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Run through GitHub Actions');
assert.equal(process.env.GITHUB_REPOSITORY, 'int64ago/vistep');
assert.equal(process.env.GITHUB_REF, 'refs/heads/main');
assert(['push', 'workflow_dispatch'].includes(process.env.GITHUB_EVENT_NAME));
const commit = process.env.GITHUB_SHA;
assert.match(commit || '', /^[a-f0-9]{40}$/);
const record = {
  commit,
  url: 'https://vistep.ai/',
  run: `https://github.com/int64ago/vistep/actions/runs/${process.env.GITHUB_RUN_ID}`,
  startedAt: new Date().toISOString(),
  status: 'preparing',
  before: null,
  after: null,
};
mkdirSync('artifacts', { recursive: true });
const save = () =>
  writeFileSync('artifacts/deployment.json', JSON.stringify(record, null, 2) + '\n');
function currentDeployment() {
  const deployments = JSON.parse(
    execFileSync(
      'pnpm',
      ['exec', 'wrangler', 'deployments', 'list', '--name', 'vistep', '--json'],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
      },
    ),
  );
  const latest = deployments.sort((a, b) => a.created_on.localeCompare(b.created_on)).at(-1);
  assert(latest, 'Cannot capture the current production version');
  return { id: latest.id, createdAt: latest.created_on, versions: latest.versions };
}

try {
  for (const key of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'GH_TOKEN']) {
    assert(process.env[key], `Missing production environment setting: ${key}`);
  }
  const response = await fetch('https://api.github.com/repos/int64ago/vistep/git/ref/heads/main', {
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
    signal: AbortSignal.timeout(30_000),
  });
  assert(response.ok, `Cannot verify main: HTTP ${response.status}`);
  if ((await response.json()).object.sha !== commit) {
    record.status = 'skipped: a newer main commit exists';
    console.log(record.status);
  } else {
    record.before = currentDeployment();
    record.status = 'deploying';
    save(); // Preserve the rollback target even if the runner is interrupted.
    execFileSync(
      'pnpm',
      ['exec', 'wrangler', 'deploy', '--tag', commit.slice(0, 12), '--message', record.run],
      { stdio: 'inherit' },
    );
    record.after = currentDeployment();
    record.status = 'published; checking live site';
    save();
    // The HTTP audit has no need for either provider's credentials.
    const auditEnv = { ...process.env };
    delete auditEnv.CLOUDFLARE_API_TOKEN;
    delete auditEnv.GH_TOKEN;
    execFileSync(process.execPath, ['scripts/audit-live.mjs'], { stdio: 'inherit', env: auditEnv });
    record.status = 'success';
  }
} catch (error) {
  record.status = `failed during ${record.status}`;
  console.error(error.message);
  // A failed domain update can follow a successful upload; record actual state if available.
  if (record.before && !record.after) {
    try {
      record.after = currentDeployment();
    } catch {
      console.error('Could not read the final deployment; check Cloudflare before retrying.');
    }
  }
  process.exitCode = 1;
} finally {
  record.finishedAt = new Date().toISOString();
  save();
  const describe = (deployment) =>
    deployment?.versions.map((v) => `${v.version_id} (${v.percentage}%)`).join(', ') ||
    'Unavailable';
  const previous = record.before?.versions;
  const rollback =
    previous?.length === 1 && previous[0].percentage === 100
      ? `\nRollback: \`pnpm exec wrangler rollback ${previous[0].version_id} --name vistep\`\n`
      : '\nSee the deployment record for the previous traffic allocation.\n';
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Production deployment\n\nStatus: **${record.status}**\n\n` +
        `Site: ${record.url}\n\nCommit: \`${commit}\`\n\n` +
        `Before: ${describe(record.before)}\n\nAfter: ${describe(record.after)}\n${rollback}\n` +
        'For rollback, cancel queued releases and disable this workflow first; otherwise the next main push will publish again.\n',
    );
  }
}
