# Google Search Console

[简体中文](zh-CN/search-console.md) · [Documentation](README.md)

## Property and ownership

`sc-domain:vistep.ai` covers the domain's protocols and subdomains. Ownership was verified through a root-domain Cloudflare TXT record on 2026-09-05 and rechecked with the local CLI as **siteOwner** on 2026-09-06. Keep the verification TXT: Google can recheck it. Existing Worker and domain bindings were preserved.

Open the [Search Console property](https://search.google.com/search-console?resource_id=sc-domain%3Avistep.ai). The sitemap `https://vistep.ai/sitemap-index.xml` was submitted at `2026-09-05T08:06:10.481Z`. The 2026-09-06 check returned `isPending: false`, zero errors and warnings, and `lastDownloaded: 2026-09-06T05:21:37.344Z`. It has been read; the earlier pending state is historical. Sitemap acceptance and discovered-URL counts do not establish that those pages are indexed or ranking. Use URL Inspection and the Page indexing report for that question.

## Search data versus website visits

Search Console measures Google search impressions, clicks, queries and indexing. It does not count everyone who visits the site, and DNS-verified properties do not need a browser tracking script. For site visits, page views, referrers and countries, use the existing [Cloudflare Web Analytics entry points](deployment.md#visitor-analytics-and-search). Analytics is injected into production responses by Cloudflare, so the absence of a beacon in the repository does not mean it is disabled.

Search reports are not real-time access logs. Google says a newly added site can take up to a week to show data, with collected data normally available after two to three days. A short or incomplete date range, no search activity, and actual indexing problems are different possibilities; inspect the reported dates and page status before choosing an explanation. Query results marked incomplete can change. A sitemap's `indexed` counter alone is not enough to conclude that the entire site is absent from Google.

## Local maintenance

Use [google-search-console-cli](https://github.com/Bin-Huang/google-search-console-cli). Credentials belong in its local configuration or `GOOGLE_APPLICATION_CREDENTIALS`, never in repository files, build artifacts or CI.

```sh
google-search-console-cli site sc-domain:vistep.ai
google-search-console-cli sitemaps sc-domain:vistep.ai
google-search-console-cli inspect sc-domain:vistep.ai https://vistep.ai/en/
google-search-console-cli inspect sc-domain:vistep.ai https://vistep.ai/zh/
```

Adding a property and verifying ownership are separate actions. Existing OAuth supported Search Console, but not Site Verification API scope; ownership verification used the signed-in Google interface and Cloudflare DNS. No visitor tracking script or broader routine CLI permission was required.

## After publishing

Verify the live sitemap index and referenced XML files, plain-text robots.txt, both language routes, canonical/alternate URLs, indexing headers and 404 responses. The build audit cannot replace live HTTP checks; Cloudflare may prepend managed robots rules.

A stable sitemap already submitted to Google does not need resubmitting on every push. Astro regenerates it as topics change. If its location changes or submission needs repair:

```sh
google-search-console-cli sitemap-submit sc-domain:vistep.ai https://vistep.ai/sitemap-index.xml
```

Inspect a homepage and at least one translated topic pair. Monitor indexing exclusions, crawl failures and canonical conflicts before interpreting impressions or click-through rates. URL Inspection's stored result describes Google's index record, not a fresh live fetch. `URL is unknown to Google` means Google has not seen that URL; other non-indexed statuses require reading their specific reason. Even a successful live availability test does not guarantee indexing. Do not treat a successful API call as proof that every page is indexed.

Preview uses noindex headers and is not submitted. See [localization and SEO](localization-and-seo.md) and [deployment](deployment.md).

References: [ownership verification](https://support.google.com/webmasters/answer/9008080), [Search Console data and delays](https://support.google.com/webmasters/answer/96568), [sitemap report semantics](https://support.google.com/webmasters/answer/7451001), [URL Inspection](https://support.google.com/webmasters/answer/9012289), [sitemap submission](https://developers.google.com/webmaster-tools/v1/sitemaps/submit), [noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing).
