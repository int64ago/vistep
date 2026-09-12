# Creating an exploration

[简体中文](zh-CN/creating-a-scene.md) · [Documentation](README.md)

Build one visible causal argument. Share the production workflow, player and lifecycle infrastructure; choose the representation and composition for the subject.

## Start with a question

With Codex, invoke the [vistep-scene skill](../.agents/skills/vistep-scene/SKILL.md) using a natural-language request. The skill owns research through implementation and review; the requester does not need to fill a template or execute scaffolding commands. Other contributors can follow this guide directly.

Identify the reader's initial intuition, one object to follow, the observation that changes their understanding, and the model's limits. Record primary technical sources. For an induction motor, for example, follow the rotating magnetic field, induced rotor current and torque—not a decorative motor shell.

An optional internal helper creates an unpublished `drafts/<slug>/` workspace:

```sh
pnpm scene:new induction-motor --medium three
```

Supported media are `three`, `svg`, `canvas`, `audio` and `hybrid`. The helper writes `brief.md`, `storyboard.json`, `narration.json`, `zh.mdx`, `en.mdx`, `review.md` and `integration.md`; it refuses to overwrite an existing draft directory. It creates no model, renderer, recording or public registration. Complete the integration requirements below even when starting from a generated draft.

## Storyboard before narration

Plan a **2–5 minute** demonstration, preferably **2–3 minutes**. Five minutes is the limit. Every chapter must add an observation, a causal step or a controlled comparison. Extending narration over the same short loop is unacceptable.

For each chapter specify:

- The object and detail to look at.
- What visibly changes, which model state causes it, and what the change demonstrates.
- Camera or composition, including a separate narrow-screen arrangement.
- A short silent caption and the spoken observation it supports.

Draw the opening, turning point and result before coding. Physical contact and internal pathways benefit from 3D; matrices, waves, pixel blocks, timelines and slices often communicate better directly. See the [bicycle example](examples/bicycle-brief.md) and [retrospective](retrospective.md).

## Implement a complete silent sequence

Keep equations, units and invariants in `src/models/`; expensive work belongs in a Worker. Geometry, numbers and labels must derive from the same state. Verify mechanical pitch, tangency, phase and closure. Simulations preserve object identities and use identical inputs for comparisons.

Use `useShowcase()` for `chapter`, `chapterTime`, `chapterProgress`, `chapters`, `time`, `run`, `watch` and `playing`. Choose shots from chapter-relative state. Use deterministic replay for history-dependent models: jumping backward or forward must agree with continuous playback. Avoid independent timers that advance while the player is paused.

A complete silent sequence comes before optional controls. Explicitly disclose teaching simplifications. Do not present coefficient counts as JPEG file sizes or update model weights during generation.

## Write and produce both languages

Write English and Chinese for speech, separately. Point out the detail on screen, allow a question to settle, then explain the change. Do not read UI text, force literal translations or stretch a short visual with more prose.

Check each spoken reference against desktop, phone and applicable fallback compositions. A new phone view can remove the timing paper or move a graph below its circuit. Name the instruction ID, signal or instrument instead of retaining a direction that no longer exists. Verify the visible referent before accepting a rewritten cue; regenerate only affected speech and remeasure shared windows. Distinguish a moved object from a missing causal view. If the chapter explains cage motion, a receiving screen or an energy input, preserve that visible object in the phone and fallback compositions instead of only deleting the spoken reference.

Narration is requested by default; honor the saved manual choice and the page language. Browser autoplay rejection must leave a clear user-activated retry while the silent film remains usable. The noise experiment’s pure tone still requires a separate explicit action.

The canonical source is `src/data/narration.json`. Each cue includes `id`, `title`, `titleEn`, `caption`, `captionEn`, `zh`, `en`, `seconds` (minimum planned window), `chapterAt` and `at`. The generator measures both voices and derives a shared window with breathing room. It produces `film-timeline.json`, `audio-tracks.json`, `audio-manifest.json` and content-addressed MP3s together. Speech is **never time-stretched**.

```sh
python3 -m venv .venv-voice
.venv-voice/bin/pip install -r scripts/requirements-voice.txt
.venv-voice/bin/python scripts/generate-narration.py --only induction-motor
```

Production uses Microsoft Edge online speech through pinned `edge-tts`; see [provenance](../THIRD_PARTY_NOTICES.md). It needs network access, but ordinary builds and readers do not call it. Revisit the script if the measured film exceeds five minutes. Regenerate only changed scenes and commit scripts, manifests and recordings together.

Listen to both tracks for intelligibility, technical pronunciation, delivery and synchronization. Optional `scripts/audit-narration.py` independently transcribes every recorded chapter with Workers AI, or locally on Apple silicon with `--backend mlx` and the optional `mlx-whisper` package, without a reference prompt or language hint. It can catch wrong-language output, gibberish and truncated endings; it does not certify a natural vocal performance. Its credentials never enter CI or site assets.

For a reviewed batch, both narration tools accept several slugs after `--only` and use a bounded worker pool. The generator updates the selected tracks and measured metadata after assembly; the transcription audit writes its report to ignored `artifacts/narration-transcription.json` and does not update the film or audio manifests. One integration owner coordinates these tools; parallel scene workers do not write shared audio manifests or the same audit report. Cached unchanged speech retains its content hashes. Stop cloud transcription when the daily allocation is exhausted; do not upgrade an account to complete an audit.

## Register the scene

| Integration                                                                         | Required work                                                                                                  |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `src/data/topics.ts`                                                                | Unique slug and number, metadata, sources and related links                                                    |
| `src/data/discovery-metadata.ts`                                                    | One current interest category, a suggested starting age of 8, 10, 12 or 14, and Chinese/English search aliases |
| `src/data/experiments.ts`                                                           | Explicit lazy import of the experiment component                                                               |
| `src/content/<slug>.mdx` and `src/content/en/<slug>.mdx`                            | Complete explanation with `understand`, `try` and `deeper` anchors                                             |
| `src/i18n/en.json`                                                                  | All labels, captions and metadata; preserve interpolation placeholders                                         |
| `src/data/narration.json`, its generated timeline/manifests and `public/narration/` | Both recordings, matching cues and measured timing                                                             |
| `src/components/covers/` and `src/components/TopicCover.astro`                      | Original model-derived artwork wired into the catalog; reuse the geometry in other cover formats where needed  |

Load the dictionary through `src/i18n/english.ts` in server-rendered and English client entry points; keep `en.json` out of the shared Chinese client dependency graph. Shared modules must not translate labels at module initialization; translate them when the component renders.

Classification is defined only in `src/data/discovery-metadata.ts`; do not add a parallel `category` label to `topics.ts`. Choose the main explanatory theme, using the dedicated weapon context for weapon subjects. Heat/fluid topics and Earth/astronomy have separate categories. Existing category IDs remain stable for shared filter links.

Keep the English and Chinese source catalogs in `docs/catalog.md` and `docs/zh-CN/catalog.md` complete. Use the same discovery categories and measured film durations; the metadata regression checks both catalogs against the registry.

Routes, transcripts, schema, reciprocal language links, social PNGs and the sitemap are derived during the build. Inspect the actual cover in the 400×230 catalog, applicable homepage fallback and `SocialCard.astro` output; selected object artwork also appears through `ObjectCover.astro` and `CollectionCard.astro`. Check each composition, contact and paper/chain path, including transparency and repeated SVG IDs. For dense mesh-derived covers, add the slug to `src/data/raster-covers.ts`: the build produces the same artwork as an 800×460 PNG under `/covers/` for lazy collection loading; social cards still render the original geometry. The registry tests catch missing files; they cannot judge communication quality.

When a request adds multiple scenes, agents must proactively use subagents and the available concurrency. Prefer one owner per independent scene, and include its objective, applicable skill, owned files and acceptance requirements in the assignment. Research, model review and visual/interaction review can also run as bounded independent tasks. The main agent coordinates shared files, integrates the work and reviews each scene; a worker's completion report does not replace that review.

Each scene owner works on its model, renderer, style, bilingual article, brief and cover. Handoffs under `src/data/scene-packets/` contain proposed metadata, translations and narration; they do not register a public route. The integration owner reviews each handoff, resolves shared wording, assigns a number and produces the recordings. `node scripts/integrate-scene-packets.mjs <slug> [<slug> ...]` validates without writing; adding `--apply` updates `topics.ts`, `experiments.ts`, `TopicCover.astro`, `en.json` and `narration.json`. It refuses translation conflicts or already registered scenes. It does not add discovery metadata or source catalog entries, generate recordings, run the review or publish. Complete those steps and remove consumed packets so the published registries remain the source of truth.

Workers must not run global formatting, builds, narration generation or deployments against shared outputs. Keep a bounded queue through creation, review and repair: after a frozen handoff, the integration owner takes over those files and assigns the worker another ready, independent task. Freeze scripts before synthesis and allow only one narration writer at a time. Build review snapshots with their own installed dependencies; never share node_modules through a symlink.

## Review and release

For a complete scene, run `pnpm scene:check`, `pnpm verify` and `pnpm build:preview`. The first checks registration, bilingual content and narration contracts; `verify` includes formatting, local documentation links, Astro checks, tests, a production build and its audit. The preview command builds and audits a separate noindex `dist-preview/`. Focused corrections only need the affected checks and assets; do not regenerate unchanged speech. Record the exact version and conditions for these independent reviews:

1. Complete silent playback, pause, replay, all chapter jumps and optional exploration.
2. Both spoken tracks, including buffering, blocked playback, language switching and offscreen pause.
3. Key still frames, physical contacts, closed paths, model limits, label alignment and camera framing.
4. Desktop, 390 px and 320 px layouts; keyboard and touch targets; reduced motion, WebGL failure, Worker failure, deep links and 404.

Test the startup capability gate separately from runtime failures. Missing WebGL 2 or another required capability prevents experiment engines and the homepage object from loading; check the support notice and readable static articles/catalog. After the gate passes, renderer creation or context loss must use the scene's appropriate fallback. A runtime 2D fallback does not establish support for a browser rejected at startup; see [browser support](architecture.md#browser-support).

Body copy is at least 16 px and primary targets at least 44 px. A resized browser is not a real-phone performance test. Keep untested conditions explicit. New findings should improve the workflow, not turn into unrelated checklists.

A handoff includes the actual explanation, preview and review evidence. Finish scientific, visual and narration review before pushing `main`, which automatically publishes production. Follow [deployment](deployment.md) and existing authorization; ordinary contributions do not change domain ownership or repository visibility.

Agent-created or rewritten commits must follow the accurate `Co-Authored-By` trailer requirements in [AGENTS.md](../AGENTS.md), including amend, squash and merge commits. Preserve the original author and valid existing trailers, and inspect the final commit message. See [contributing](../CONTRIBUTING.md#agent-commit-authorship).

Formula markup must match the installed Astro MDX pipeline. Use the existing `formula` blocks and readable inline notation; raw dollar-delimited TeX is not configured and can turn braces into invalid JSX expressions. A standalone MDX compilation does not replace the actual production build.

Check chapter seeking on the delivered asset host, not only the development server: compare the media clock with the film clock after a deep link, a second seek and replay. Some static hosts ignore byte ranges. The shared player falls back to a scoped Blob only when seeking requires it; test abort on navigation and object-URL release. Use a range-capable local preview for normal playback checks and a deliberately non-range server for this fallback. HTTP success and media readiness alone do not prove seeking works.

## Carry reviews into repairs

Keep the same parallel queue active after all requested routes exist. Each handoff identifies its exact source version, owned files, reproducible findings and missing evidence. Assign a concrete repair or another unreviewed group immediately; separate author self-review from cross-review. Once handed off, those files belong to the integrator. Freeze the review source and verify file hashes before copying a repair into a different integration snapshot. A browser or device limitation can defer its specific evidence, while independent model and source review continues.

Measure the whole player, including the longest bilingual caption and transport controls, at every chapter. A short stage can still produce an oversized phone page. Prefer the current causal view over stacked desktop panels. Keep labels in CSS pixels where scaling would make them unreadable. Project the real assembly bounds through the camera, including near corners, thickness and moving parts; a nominal width/height fit is insufficient. Review pause, direct seek and transitions separately.

For caption-only edits, update `narration.json`, its corresponding `film-timeline.json` captions and `en.json` together. Keep spoken scripts, timing, audio manifests and recording hashes unchanged. Do not regenerate speech to shorten screen text. Preserve scientific qualifications in the visible explanation or an accessible detail view.
