# Maintenance and search setup

[简体中文](zh-CN/qa-maintenance.md) · [Review index](README.md#review-records)

Historical record: 2026-09-05. Worker version `06c011e9-7589-49f0-b924-0145b601209b`. This record applies only to that revision.

The domain property was verified through a Cloudflare TXT record. Google showed Ownership verified; the CLI returned siteOwner. At this stage the homepage was unknown to Google and the sitemap list was empty. Production still served the original brand page, so no invalid HTML sitemap was submitted.

Type checking was clean; six test files and 36 tests passed. New checks covered registry consistency, article anchors, related links, timelines and safe draft creation. Production and preview audits each covered 26 canonical pages plus 404, with separate indexing policies. The skill validator passed, and workflow, Dependabot and issue form YAML parsed.

A local Chrome homepage/printer smoke check confirmed loading, clock advancement, audio state and language switching. It did not repeat all visual or listening reviews. The full verify command passed; documentation checks covered 21 Markdown files and 81 local links. The registry audit reported no known production dependency vulnerabilities at that time, not a future guarantee.

Thirty preview HTTP responses had the intended status and noindex headers. [Ubuntu CI run 33952470175](https://github.com/int64ago/vistep/actions/runs/33952470175) passed from locked dependencies without deployment, Google or speech credentials. GitHub recognized MIT and community files; the 100% community profile measured file coverage only. Issue forms were opened and the duplicate security contact entry removed.

No private credentials were committed. No new scene, common scene template, real-device frame-rate measurement or complete listening review was introduced in this maintenance change.
