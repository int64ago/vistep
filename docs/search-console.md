# Google Search Console

[简体中文](zh-CN/search-console.md) · [Documentation](README.md)

## Property and ownership

`sc-domain:vistep.ai` is verified through a root-domain Cloudflare TXT record. The Google interface showed **Ownership verified**, and the local CLI returned **siteOwner** on 2026-09-05. Keep the verification TXT: Google can recheck it. Existing Worker and domain bindings were preserved.

Open the [Search Console property](https://search.google.com/search-console?resource_id=sc-domain%3Avistep.ai). The sitemap `https://vistep.ai/sitemap-index.xml` was submitted at `2026-09-05T08:06:10.481Z`. Its initial response was pending with zero errors and warnings. This records submission, not indexing or ranking. Before production release, the homepage inspection reported that the URL was unknown to Google.

## Local maintenance

Use [google-search-console-cli](https://github.com/Bin-Huang/google-search-console-cli). Credentials belong in its local configuration or `GOOGLE_APPLICATION_CREDENTIALS`, never in repository files, build artifacts or CI.

```sh
google-search-console-cli site sc-domain:vistep.ai
google-search-console-cli sitemaps sc-domain:vistep.ai
google-search-console-cli inspect sc-domain:vistep.ai https://vistep.ai/en/
```

Adding a property and verifying ownership are separate actions. Existing OAuth supported Search Console, but not Site Verification API scope; ownership verification used the signed-in Google interface and Cloudflare DNS. No visitor tracking script or broader routine CLI permission was required.

## After publishing

Verify the live sitemap index and referenced XML files, plain-text robots.txt, both language routes, canonical/alternate URLs, indexing headers and 404 responses. The build audit cannot replace live HTTP checks; Cloudflare may prepend managed robots rules.

A stable sitemap already submitted to Google does not need resubmitting on every push. Astro regenerates it as topics change. If its location changes or submission needs repair:

```sh
google-search-console-cli sitemap-submit sc-domain:vistep.ai https://vistep.ai/sitemap-index.xml
```

Inspect a homepage and at least one translated topic pair. Monitor indexing exclusions, crawl failures and canonical conflicts before interpreting impressions or click-through rates. Reports can lag publication. Do not treat a successful API call as proof that every page is indexed.

Preview uses noindex headers and is not submitted. See [localization and SEO](localization-and-seo.md) and [deployment](deployment.md).

References: [ownership verification](https://support.google.com/webmasters/answer/9008080), [sitemap submission](https://developers.google.com/webmaster-tools/v1/sitemaps/submit), [noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing).
