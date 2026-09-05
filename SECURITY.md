# Security policy

## Supported versions

Security fixes target the current `main` branch and the deployed version derived from it. This project does not currently maintain multiple release lines or offer a response-time guarantee.

## Report privately

Email **int64ago@gmail.com** with the subject `vistep security report`. This is the maintainer's public contact address. Include the affected URL or commit, the impact, and minimal steps to reproduce. Do not include active credentials or other people's personal information.

Please do not disclose an unpatched vulnerability through a public issue. The maintainer will investigate and coordinate an appropriate fix and disclosure. If a credential is exposed, revoke it with its provider rather than relying on deleting a commit.

## Project boundaries

The published site is static; experiments run in the reader's browser. There are no user accounts, server-side user data or visitor API keys. Cloudflare credentials are used only for deployment and optional narration production. Search Console credentials are local maintenance tools, not site assets. CI runs checks without deployment or speech-provider secrets and does not execute PR code with a write-capable token.

For scientific corrections, layout issues or general bugs, use the normal issue templates. Follow the [Code of Conduct](CODE_OF_CONDUCT.md) for community concerns.

中文：安全漏洞请通过维护者邮箱私下报告，附影响范围和最小复现步骤，勿在公开 Issue 中附未修复漏洞或凭据。当前仅维护 `main` 与其部署版本。
