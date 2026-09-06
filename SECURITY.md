# Security policy

[简体中文](docs/zh-CN/security.md)

## Supported versions

Security fixes target the current `main` branch and the deployed version derived from it. This project does not currently maintain multiple release lines or offer a response-time guarantee.

## Report privately

Email **int64ago@gmail.com** with the subject `vistep security report`. This is the maintainer's public contact address. Include the affected URL or commit, the impact, and minimal steps to reproduce. Do not include active credentials or other people's personal information.

Please do not disclose an unpatched vulnerability through a public issue. The maintainer will investigate and coordinate an appropriate fix and disclosure. If a credential is exposed, revoke it with its provider rather than relying on deleting a commit.

## Project boundaries

The published site uses Cloudflare Workers Static Assets without a custom Worker runtime script; experiments run in the reader's browser. The application has no visitor accounts, user database or visitor API keys. Language and narration preferences remain in browser storage; temporary playback state is transferred locally when switching languages.

Cloudflare hosts the site and provides aggregate Web Analytics. It injects a browser beacon into production responses; static hosting does not mean the absence of traffic telemetry. Cloudflare describes its Web Analytics as collecting no visitor personal data. Request metrics and browser analytics have different scopes and must not be presented as individual visitor records. See [Cloudflare's Web Analytics description](https://developers.cloudflare.com/web-analytics/about/) and the [analytics operations guide](docs/deployment.md#visitor-analytics-and-search).

Cloudflare credentials support authorized deployment and account maintenance; the optional Cloudflare transcription audit requires separate speech permissions. Search Console credentials are local maintenance tools. None of these credentials is a site asset or a requirement for visitors. CI verification runs without deployment or speech-provider secrets and does not execute PR code with a write-capable token.

Only the production job on the original repository's `main` branch receives a scoped Cloudflare token from the `production` environment. Keep the environment restricted to `main`. The deployment token requires Workers Scripts Edit in the designated account, plus Workers Routes Edit and Zone Read in the `vistep.ai` zone; do not grant DNS-edit, billing or speech permissions. Workers permissions are account-scoped, not restricted to one Worker. Environment rules and actual token scopes are external configuration, not something repository checks can prove. Rotate the token in Cloudflare and replace the encrypted environment secret when needed; never reuse a local Wrangler OAuth token in CI.

For scientific corrections, layout issues or general bugs, use the normal issue templates. Follow the [Code of Conduct](CODE_OF_CONDUCT.md) for community concerns.
