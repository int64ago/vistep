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

Supported media are `three`, `svg`, `canvas`, `audio` and `hybrid`. Creating a draft does not register a route or complete an explanation.

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

Narration is requested by default; honor the saved manual choice and the page language. Browser autoplay rejection must leave a clear user-activated retry while the silent film remains usable. The noise experiment’s pure tone still requires a separate explicit action.

The canonical source is `src/data/narration.json`. Each cue includes `id`, `title`, `titleEn`, `caption`, `captionEn`, `zh`, `en`, `seconds` (minimum planned window), `chapterAt` and `at`. The generator measures both voices and derives a shared window with breathing room. It produces `film-timeline.json`, `audio-tracks.json`, `audio-manifest.json` and content-addressed MP3s together. Speech is **never time-stretched**.

```sh
python3 -m venv .venv-voice
.venv-voice/bin/pip install -r scripts/requirements-voice.txt
.venv-voice/bin/python scripts/generate-narration.py --only induction-motor
```

Production uses Microsoft Edge online speech through pinned `edge-tts`; see [provenance](../THIRD_PARTY_NOTICES.md). It needs network access, but ordinary builds and readers do not call it. Revisit the script if the measured film exceeds five minutes. Regenerate only changed scenes and commit scripts, manifests and recordings together.

Listen to both tracks for intelligibility, technical pronunciation, delivery and synchronization. Optional `scripts/audit-narration.py` independently transcribes every recorded chapter with Workers AI, or locally on Apple silicon with `--backend mlx` and the optional `mlx-whisper` package, without a reference prompt or language hint. It can catch wrong-language output, gibberish and truncated endings; it does not certify a natural vocal performance. Its credentials never enter CI or site assets.

For a reviewed batch, both narration tools accept several slugs after `--only`. This shares the bounded worker pool and commits measured metadata after the selected recordings finish. One integration owner runs these tools; parallel scene workers do not write shared audio manifests. Cached unchanged tracks keep their original content hashes.

## Register the scene

| Integration                          | Required work                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| `topics.ts`                          | Unique slug and number, metadata, sources and related links                            |
| `experiments.ts`                     | Explicit lazy import                                                                   |
| Bilingual MDX                        | Complete explanation with `understand`, `try` and `deeper` anchors                     |
| `en.json`                            | All labels, captions and metadata; preserve interpolation placeholders                 |
| Narration source and generated files | Both recordings, matching cues and measured timing                                     |
| Cover artwork                        | A distinct `TopicCover.astro` rendering; selected objects also use `ObjectCover.astro` |

Routes, transcripts, schema, reciprocal language links, social PNGs and the sitemap are derived during the build. Check that new artwork also fits the social card. The registry tests catch missing files; they cannot judge communication quality.

When parallel production is authorized, assign each worker a distinct scene and file set: its model, renderer, style, bilingual article, brief and cover. Handoffs under `src/data/scene-packets/` contain proposed metadata, translations and narration; they do not register a public route. The integration owner reviews each handoff, resolves shared wording, assigns a number and produces the recordings. The internal packet helper validates without writing by default and refuses conflicting translations or existing recorded topics. Remove consumed handoff packets after integration so the published registries remain the source of truth. Workers must not run global formatting, builds, narration generation or deployments against shared outputs. When sustained parallel production is requested, keep a bounded set of workers active: after a frozen handoff, the integration owner takes over those files and immediately assigns that worker a different reserved subject. Do not leave workers idle while the parent generates recordings or reviews a previous batch. Freeze scripts before synthesis and allow only one narration writer at a time. Build review snapshots with their own installed dependencies; never share node_modules through a symlink.

## Review and release

Run `pnpm scene:check`, `pnpm verify` and `pnpm build:preview`. Record the exact version and conditions for these independent reviews:

1. Complete silent playback, pause, replay, all chapter jumps and optional exploration.
2. Both spoken tracks, including buffering, blocked playback, language switching and offscreen pause.
3. Key still frames, physical contacts, closed paths, model limits, label alignment and camera framing.
4. Desktop, 390 px and 320 px layouts; keyboard and touch targets; reduced motion, WebGL failure, Worker failure, deep links and 404.

Body copy is at least 16 px and primary targets at least 44 px. A resized browser is not a real-phone performance test. Keep untested conditions explicit. New findings should improve the workflow, not turn into unrelated checklists.

A handoff includes the actual explanation, preview and review evidence. Finish scientific, visual and narration review before pushing `main`, which automatically publishes production. Follow [deployment](deployment.md) and existing authorization; ordinary contributions do not change domain ownership or repository visibility.

Formula markup must match the installed Astro MDX pipeline. Use the existing `formula` blocks and readable inline notation; raw dollar-delimited TeX is not configured and can turn braces into invalid JSX expressions. A standalone MDX compilation does not replace the actual production build.

Check chapter seeking on the delivered asset host, not only the development server: compare the media clock with the film clock after a deep link, a second seek and replay. Some static hosts ignore byte ranges. The shared player falls back to a scoped Blob only when seeking requires it; test abort on navigation and object-URL release. Use a range-capable local preview for normal playback checks and a deliberately non-range server for this fallback. HTTP success and media readiness alone do not prove seeking works.
