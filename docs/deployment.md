# Deployment and rollback

[简体中文](zh-CN/deployment.md) · [Documentation](README.md)

Production uses the existing Cloudflare Worker **`vistep`**, with `vistep.ai` and `www.vistep.ai`. Preview uses **`vistep-preview`** with no production routes. Preserve domain bindings and the Search Console verification TXT.

## Automatic production deployment

Pushes or merges to `main` in `int64ago/vistep` run [CI and deploy](https://github.com/int64ago/vistep/actions/workflows/ci.yml). `codex/**` branches and pull requests run verification only. A manual workflow run on `main` can also redeploy current code.

1. Install the locked dependencies and run formatting, documentation, type, model, content, build and indexing checks.
2. Save the verified `dist/` artifact. The deployment job downloads this same artifact, without rebuilding or using `dist-preview/`.
3. Enter GitHub's `production` environment, restricted to `main`. Query the current main SHA and skip stale runs.
4. Record the current Worker version, then deploy with the commit SHA and Actions run reference.
5. Audit live pages, metadata, all static assets by SHA-256, sitemap, robots, indexing headers and unknown-path 404s.

The run summary records the before/after versions and rollback command. Production artifacts are retained for seven days; deployment records for 90 days. Cloudflare retains its own deployment history. A live-audit failure does not automatically roll back: first establish whether upload failed or a new version was published but failed verification.

An active main deployment is not cancelled by a new push. Only the newest pending run is retained, so rapid pushes may consolidate into one deployment. Complete visual and narration review before merging; CI does not establish those qualities.

## Credentials

Under GitHub **Settings → Environments → production**:

| Setting                | Value                       |
| ---------------------- | --------------------------- |
| Secret                 | `CLOUDFLARE_API_TOKEN`      |
| Variable               | `CLOUDFLARE_ACCOUNT_ID`     |
| Deployment branch rule | Only branch `main`; no tags |

The production token needs Workers Scripts Edit in the intended account, and Workers Routes Edit plus Zone Read for `vistep.ai`. Workers permissions are account-scoped, not limited to one Worker. The token has no DNS-edit, billing or speech permissions. Do not put local Wrangler OAuth, Google credentials or narration credentials into CI.

Rotate with a new token of the same scope, replace the environment secret, verify a main deployment, then revoke the old token. To pause releases, disable **CI and deploy** in Actions; this also pauses that workflow's checks. Re-enable after maintenance.

## Preview and emergency publishing

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm deploy:preview
```

Review [preview](https://vistep-preview.int64ago.workers.dev/), then merge to main for the automatic production release. Do not manually deploy a second time after Actions has published it.

For an emergency local `pnpm deploy`, first pause the workflow and cancel queued/running deployments to avoid concurrent releases. Local deployment needs a valid Wrangler login or environment credentials. GitHub environment secrets cannot be read back into local development.

Production assets live in `dist/`; preview assets in `dist-preview/`. Preview sends `X-Robots-Tag: noindex, nofollow`, permits crawlers to read it and omits the sitemap advertisement from robots.txt. Both builds retain production canonical URLs. Static Assets serves trailing-slash pages and actual 404 responses.

## Rollback

Find **Before** in the relevant Actions summary. Disable the workflow, cancel pending/running deployments, then run the recorded rollback command:

```sh
pnpm exec wrangler rollback VERSION_ID --name vistep
```

Verify against the target version's build. Revert or fix main before resuming automatic deployment, otherwise the next push republishes the defect. List history with `pnpm exec wrangler deployments list --name vistep`.

Historical recovery points:

| Version                                | Meaning                                                  |
| -------------------------------------- | -------------------------------------------------------- |
| `d31022c8-a4ad-446c-898e-19a7298503e1` | Original brand site, before the complete collection      |
| `740c58e2-4c63-488c-b1a5-c7546f89a836` | First complete production collection, based on `259d443` |

Rollback restores code and assets without changing domain bindings. If restoring the original brand site, also restore a valid sitemap response; do not delete domain-verification TXT records. Current history is authoritative in [Actions](https://github.com/int64ago/vistep/actions/workflows/ci.yml) and the [production environment](https://github.com/int64ago/vistep/deployments/activity_log?environments_filter=production).

## Deploying a fork

Forks do not inherit credentials, and the workflow explicitly restricts production to the original repository. Configure your own origin in Astro, `src/data/seo.ts`, the audit scripts, robots.txt, and your own Worker/domain in Wrangler. Adjust repository/branch/Worker guards in CI and `scripts/ci-deploy.mjs`. Verify an isolated preview first. Never claim the original project's domains or reuse its credentials.

References: [Cloudflare GitHub Actions deployment](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), [GitHub deployment controls](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments).
