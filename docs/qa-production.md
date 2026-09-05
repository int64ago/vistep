# First production release

[简体中文](zh-CN/qa-production.md) · [Review index](README.md#review-records)

Historical record: 2026-09-05. Worker version `740c58e2-4c63-488c-b1a5-c7546f89a836`. This record applies only to that revision.

The complete collection, based on `259d443`, was deployed to the existing `vistep` Worker and both `vistep.ai` and `www.vistep.ai`. The original brand version `d31022c8-a4ad-446c-898e-19a7298503e1` remained available for rollback.

Before publishing, full verification passed: formatting, local documentation links, types, 36 tests, build and artifact audit. The production build had 26 localized content pages and a 404 without noindex headers.

The deployment uploaded 191 static assets. All 161 scripts, fonts, icons, licenses and recordings were downloaded and SHA-256 compared with the build. All 26 content pages returned 200 with correct canonical and alternate links. Both sitemap files returned XML, and robots.txt advertised the production sitemap. Unknown paths returned 404; missing slashes redirected with 307; www used the main-domain canonical. Preview remained noindex.

Chrome opened the live homepage and printer, observed clock advancement to the end, entered the Chinese audio playing state and switched to English. This was a deployment smoke check, not proof of natural speech or real-phone performance.

Search Console accepted the sitemap at `2026-09-05T08:06:10.481Z`; initial state was pending with zero errors/warnings. Indexing was not claimed. Rollback procedure is in [deployment](deployment.md).
