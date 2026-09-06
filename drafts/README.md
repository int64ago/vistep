# Scene drafts

This folder holds unpublished working drafts. With Codex, describe the topic to the [vistep-scene skill](../.agents/skills/vistep-scene/SKILL.md); the agent handles production and can use the helper internally.

The optional `pnpm scene:new <slug> --medium <three|svg|canvas|audio|hybrid>` command runs at the repository root. It creates `drafts/<slug>/` with `brief.md`, `storyboard.json`, `narration.json`, `zh.mdx`, `en.mdx`, `review.md` and `integration.md`. Use a lowercase, hyphen-separated slug. An existing draft directory is never overwritten.

The helper creates no model, renderer, recordings or public route. Draft narration and MDX remain separate from `src/data/narration.json` and `src/content/`; editing them does not update the site. Complete the registration checklist in [the scene guide](../docs/creating-a-scene.md), including discovery metadata, both source catalogs, cover entry points and measured bilingual recordings. Generated instructions are a starting checklist, not validation or publication.

Keep completed briefs and evidence with the contribution when useful. Nothing in this folder is included in the deployed website.
