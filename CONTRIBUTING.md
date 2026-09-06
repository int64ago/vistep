# Contributing

[简体中文](docs/zh-CN/contributing.md)

Thank you for helping make mechanisms easier to see. Contributions may improve explanations, models, rendering, accessibility, translation or new topics. Start with an issue when the change needs discussion; small fixes can go directly to a pull request.

## Development

1. Install [Git LFS](https://git-lfs.com/), then fork and clone the repository. Use Node 24 and `pnpm@11.25.0`. Narration MP3s under `public/narration/` are LFS objects; a clone without LFS gets pointer files and the build audit fails.
2. Run `pnpm install --frozen-lockfile`, then `pnpm dev`.
3. Make a focused branch. Keep unrelated formatting or generated artifacts out of the change.
4. Run `pnpm verify` and `pnpm build:preview` for a complete scene or shared runtime change. For prose-only changes, run Prettier on the changed files and `pnpm audit:docs`; this audit checks local file links, so inspect changed heading anchors and external references separately. CI still validates the repository.
5. Open a PR with the problem, resulting behavior and actual validation evidence.

`package.json` is private to prevent accidental npm publishing; this does not restrict the MIT license. Normal builds require no credentials. Do not commit `.env`, Cloudflare state, voice caches, tokens, or local credential files.

## New or revised scenes

Use [the production guide](docs/creating-a-scene.md) and [retrospective](docs/retrospective.md). When using Codex, describe the scene to `$vistep-scene`; it handles the complete production workflow. The draft generator is an optional internal helper, not the user-facing entry point. The guide is available in English and Chinese.

For requests adding multiple scenes, agents must proactively use subagents, preferably with an independent owner for each scene. Assign the objective, skill, owned files and acceptance requirements. The main agent coordinates shared files, integrates the results and reviews each scene; a subagent's completion message is not acceptance evidence. Follow [AGENTS.md](AGENTS.md) and the guide's handoff workflow.

Scenes must have their own appropriate visual form. A complete, understandable 2–5 minute silent demonstration comes before extra controls. Every chapter needs visible explanatory work; additional narration alone does not extend a scene. Derive geometry and numbers from the same model. Explain simplifications and cite technical sources. Keep Chinese and English content complete, with spoken scripts written for observation rather than reciting UI text.

For scene changes, include desktop and phone key frames, the preview URL if available, full-playback observations in both languages, and relevant model checks. Record untested conditions explicitly. A successful build is not evidence of visual or vocal quality.

## Tests and assets

Use independent numerical expectations, conservation laws, finite differences or reproducible system inputs. Do not add tests that merely repeat implementation constants. Do not call external speech services from CI. Regenerate only affected speech when the spoken script or voice changes, or the recording needs repair; caption-only edits do not require new audio. Commit narration source, measured timeline, audio manifests and recordings together, and remove unreferenced old tracks. The generator performs the metadata and old-track updates for selected scenes; transcription reports remain local review evidence.

Original assets must have documented provenance. Include source, author and license for new third-party material in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Avoid copying diagrams, code, models or audio without the applicable permission. Contributions are distributed under the project's MIT license unless a clearly documented compatible third-party license applies. No CLA is required.

## Agent commit authorship

Every commit created or rewritten by an agent, including amend, squash and merge commits, must end with accurate `Co-Authored-By: Name <email>` trailers separated from the body by a blank line. Use the actual contributing agent/model and its provider address; do not guess a model, write only `GPT`, or copy an unrelated historical signature. GPT-6 Astra uses `Co-Authored-By: GPT-6 Astra <noreply@openai.com>`; Claude uses the actual Claude model name and `<noreply@anthropic.com>`. List each actual contributor, preserve the original author and existing correct trailers, and inspect the final commit message for missing or duplicate signatures. [AGENTS.md](AGENTS.md) is the maintained rule.

## Review and release

Maintainers review scientific accuracy, visual communication and implementation separately. Pushing or merging to `main` automatically deploys production after CI passes. Complete the appropriate scene review before merging; automated checks do not replace it. Branch and PR checks never receive deployment credentials. Keep the production domain and preview distinct. See [deployment and rollback](docs/deployment.md).

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md). Report vulnerabilities privately through [SECURITY.md](SECURITY.md), not in a public issue.
