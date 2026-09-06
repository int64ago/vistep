# Deployment and rollback

[简体中文](zh-CN/deployment.md) · [Documentation](README.md)

Production uses the existing Cloudflare Worker **`vistep`**, with `vistep.ai` and `www.vistep.ai`. Preview uses **`vistep-preview`** with no production routes. Preserve domain bindings and the Search Console verification TXT.

## Automatic production deployment

Pushes or merges to `main` in `int64ago/vistep` run [CI and deploy](https://github.com/int64ago/vistep/actions/workflows/ci.yml). `codex/**` branches and pull requests run verification only. A manual workflow run on `main` can also redeploy current code.

1. Fetch the Git LFS narration recordings, install the locked dependencies, run `pnpm verify`, and build and audit the separate preview with `pnpm build:preview`. LFS objects are cached by their object IDs; a missing recording still fails verification.
2. Save the verified `dist/` artifact. The deployment job downloads this same artifact, without rebuilding or using `dist-preview/`.
3. Enter GitHub's `production` environment. The workflow and deployment script both restrict publishing to the original repository's `main`; configure the environment's branch rule the same way. Query the current main SHA and skip stale runs.
4. Record the current Worker version, then deploy with the commit SHA and Actions run reference.
5. Run `scripts/audit-live.mjs`: check page titles, canonical/alternate links and built asset references in live HTML; compare non-HTML assets by SHA-256; check production indexing headers, the sitemap advertisement in robots.txt, and unknown-path 404s. HTML is not compared byte for byte because Cloudflare can inject delivery and analytics scripts. Transient HTTP failures are retried twice.

The run summary records the before/after versions and rollback command. Production artifacts are retained for seven days; deployment records for 90 days. Cloudflare retains its own deployment history. A live-audit failure does not automatically roll back: first establish whether upload failed or a new version was published but failed verification.

An active main deployment is not cancelled by a new push. Only the newest pending run is retained, so rapid pushes may consolidate into one deployment. Complete visual and narration review before merging; CI does not establish those qualities.

## Credentials

Required configuration under GitHub **Settings → Environments → production** (environment rules and token scopes live outside the repository):

| Setting                | Value                       |
| ---------------------- | --------------------------- |
| Secret                 | `CLOUDFLARE_API_TOKEN`      |
| Variable               | `CLOUDFLARE_ACCOUNT_ID`     |
| Deployment branch rule | Only branch `main`; no tags |

The production token needs Workers Scripts Edit in the intended account, and Workers Routes Edit plus Zone Read for `vistep.ai`. Workers permissions are account-scoped, not limited to one Worker. Do not grant DNS-edit, billing or speech permissions. Do not put local Wrangler OAuth, Google credentials or narration credentials into CI.

Rotate with a new token of the same scope, replace the environment secret, verify a main deployment, then revoke the old token. To pause releases, disable **CI and deploy** in Actions; this also pauses that workflow's checks. Re-enable after maintenance.

## Preview and emergency publishing

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm deploy:preview
```

Review [preview](https://vistep-preview.int64ago.workers.dev/), then merge to main for the automatic production release. Do not manually deploy a second time after Actions has published it.

For an emergency local `pnpm deploy`, first pause the workflow and cancel queued/running deployments to avoid concurrent releases. Run `pnpm verify` and complete review first: `pnpm deploy` itself only builds and deploys. Local deployment needs a valid Wrangler login or environment credentials. GitHub environment secrets cannot be read back into local development.

Production assets live in `dist/`; preview assets in `dist-preview/`. Preview sends `X-Robots-Tag: noindex, nofollow`, permits crawlers to read it and omits the sitemap advertisement from robots.txt. Its sitemap files and HTML sitemap link still exist; do not submit the preview host to Google. Both builds retain production canonical URLs. Static Assets serves trailing-slash pages and actual 404 responses, with no custom Worker runtime script. Both environments currently enable their `workers.dev` address; only the production Worker has the two custom-domain routes.

## Visitor analytics and search

Cloudflare Web Analytics is enabled for `vistep.ai`, confirmed on 2026-09-06. Cloudflare injects `static.cloudflareinsights.com/beacon.min.js` into the delivered production HTML; there is no corresponding script in `src/layouts/Base.astro`. Its configuration lives in Cloudflare, so searching repository source alone cannot establish whether analytics is active. Do not add a second beacon to the layout.

Signed-in maintainers can open [visits](https://dash.cloudflare.com/221bc02d2824802216740354699556c8/vistep.ai/analytics/web/overview/visits) or [page views](https://dash.cloudflare.com/221bc02d2824802216740354699556c8/vistep.ai/analytics/web/overview/page-views). Use the date range and country, path, referrer, device and browser filters for aggregate traffic analysis. Record the date range and filters with any exported report rather than keeping a live counter in this guide.

- **Visits** count entries from an external referrer or a direct link. One visit can contain multiple page views; visits are not a count of distinct people.
- **Web Analytics** measures browser activity through the beacon. Ad blockers, disabled JavaScript or failed delivery can cause missing data. It offers the previous six months of collected data; data beyond seven days is aggregated and queries may be sampled. Enabling it cannot recreate earlier browser reports that were never sent.
- **HTTP traffic** measures requests received at Cloudflare, including resources and automated traffic. **Workers metrics** measure Worker invocations; static assets can be served without executing a Worker. Neither request total is a substitute for visits or page views.
- **Search Console** reports Google search visibility and indexing, not all website visits. The domain property is verified through DNS and needs no front-end tracking script. See [Search Console operations](search-console.md).

The build and live audits check delivery and indexing contracts, not successful beacon ingestion or dashboard counts. If analytics appears empty, check the selected site, date range, production script, browser request and dashboard separately. Reference: Cloudflare [metrics](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/), [dimensions](https://developers.cloudflare.com/web-analytics/data-metrics/dimensions/), [collection and limits](https://developers.cloudflare.com/web-analytics/faq/) and [Workers metrics](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/).

## Rollback

Find **Before** in the relevant Actions summary. Disable the workflow, cancel pending/running deployments, then run the recorded rollback command:

```sh
pnpm exec wrangler rollback VERSION_ID --name vistep
```

Verify against the target version's build. Revert or fix main before resuming automatic deployment, otherwise the next push republishes the defect. List history with `pnpm exec wrangler deployments list --name vistep`.

Historical recovery points, not the current release:

| Version                                | Meaning                                                    |
| -------------------------------------- | ---------------------------------------------------------- |
| `d31022c8-a4ad-446c-898e-19a7298503e1` | Original brand site, before the complete collection        |
| `740c58e2-4c63-488c-b1a5-c7546f89a836` | First complete production collection, published 2026-09-05 |

Rollback restores code and assets without changing domain bindings. If restoring the original brand site, also restore a valid sitemap response; do not delete domain-verification TXT records. Current history is authoritative in [Actions](https://github.com/int64ago/vistep/actions/workflows/ci.yml) and the [production environment](https://github.com/int64ago/vistep/deployments/activity_log?environments_filter=production).

Earlier preview-only statements describe their dated builds, not today's production status. See the historical [automatic-demo review](qa-automatic-demos.md), [bilingual narration review](qa-bilingual-narration.md) and [first production review](qa-production.md).

## Deploying a fork

Forks do not inherit credentials, and the workflow explicitly restricts production to the original repository. Configure your own origin in Astro, `src/data/seo.ts`, the audit scripts, robots.txt, and your own Worker/domain in Wrangler. Adjust repository/branch/Worker guards in CI and `scripts/ci-deploy.mjs`. Verify an isolated preview first. Never claim the original project's domains or reuse its credentials.

References: [Cloudflare GitHub Actions deployment](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), [GitHub deployment controls](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments).
