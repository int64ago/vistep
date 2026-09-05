# Security policy

[简体中文](docs/zh-CN/security.md)

## Supported versions

Security fixes target the current `main` branch and the deployed version derived from it. This project does not currently maintain multiple release lines or offer a response-time guarantee.

## Report privately

Email **int64ago@gmail.com** with the subject `vistep security report`. This is the maintainer's public contact address. Include the affected URL or commit, the impact, and minimal steps to reproduce. Do not include active credentials or other people's personal information.

Please do not disclose an unpatched vulnerability through a public issue. The maintainer will investigate and coordinate an appropriate fix and disclosure. If a credential is exposed, revoke it with its provider rather than relying on deleting a commit.

## Project boundaries

The published site is static; experiments run in the reader's browser. There are no user accounts, server-side user data or visitor API keys. Cloudflare credentials are used only for deployment and optional independent speech audits. Search Console credentials are local maintenance tools, not site assets. CI verification runs without deployment or speech-provider secrets and does not execute PR code with a write-capable token.

Only the production job on the original repository's `main` branch receives a scoped Cloudflare token from the `production` environment. The environment allows the `main` branch only. The token can edit Workers in the designated account and Workers routes in the `vistep.ai` zone; it has no DNS-edit, billing, or speech permissions. Workers permissions are account-scoped, not restricted to one Worker. Rotate the token in Cloudflare and replace the encrypted environment secret when needed; never reuse a local Wrangler OAuth token in CI.

For scientific corrections, layout issues or general bugs, use the normal issue templates. Follow the [Code of Conduct](CODE_OF_CONDUCT.md) for community concerns.
