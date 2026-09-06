---
name: vistep-scene
description: Create or refine vistep.ai visual explanations from a natural-language request, covering research, independent art direction, scientific models, automatic films, bilingual narration, integration and review. Also use for the site's brand animation and original showcase artwork when part of this production workflow.
---

# vistep scene production

Deliver a finished visual explanation from the user's natural-language brief. Choose the medium, model, composition and implementation; do not return a template for the user to fill or a command for them to run. A plan, scaffolding or passing test suite does not replace the requested result.

Work from the vistep repository. Read `AGENTS.md` and [the production guide](../../../docs/creating-a-scene.md), and consult [production lessons](../../../docs/retrospective.md) before choosing an approach. These are project requirements, not rules for unrelated work. The user's current instructions and existing publication authorization take precedence.

## Choose the scope

- **New or substantially revised topic:** carry research, direction, implementation, bilingual writing and speech, registration, review and authorized delivery through to completion.
- **Focused correction:** follow the same scientific and visual standard, but rebuild only affected scenes and assets. Do not regenerate unchanged recordings or retest unrelated films without a concrete reason.
- **Homepage or promotional artwork:** use the brand and communication requirements below. The 2–5 minute topic duration does not apply to a short opening or README loop.

Use the [coverage map](references/coverage.md) to locate less frequent requirements and close a substantial revision. It connects current decisions to their source of truth rather than making another parallel specification.

## Direct the explanation

The quality bar is “大师级的演示”: convincing objects, deliberate typography and framing, restrained materials and light, precise alignment, and continuous, gentle interaction. Do not substitute topic count, 3D ornament, a dashboard layout or test totals for communication quality. Reuse infrastructure; choose a distinct visual language for each phenomenon.

Identify the initial intuition, one object to track, the observation that changes the reader's understanding and the model's limits. Research primary technical sources. Sketch the opening, turning point and result, with a separately composed phone view, before implementation. Use physical 3D where internal structure, contact or spatial relations require it; use waves, slices, matrices, images or timelines where they explain more clearly.

Plan a **2–5 minute** topic film, preferably **2–3 minutes**, with five minutes as the ceiling. Every chapter must add a visible causal step, close observation or controlled comparison. Record what changes on screen and what it demonstrates before producing speech. Never stretch a short loop with longer narration.

Default to a directed demonstration when visible. The user should understand it while watching, with one short current explanation and minimal required interaction. Keep pause, replay, chapters, seeking and optional exploration. Longer reasoning, equations and controls belong in progressive disclosure. The silent film must remain understandable even though spoken narration is requested by default.

## Make the model and image agree

Keep equations, units and invariants in independent models. Derive geometry, movement, readouts and captions from their shared state. Tooth pitch, meshing phase, tangents, closed chains and belts, shaft connections, fluid paths and paper transport must be geometrically credible. Do not repair them with decorative approximations or a final point snapped into place.

Preserve object identities and reproducible inputs in system comparisons. JPEG reconstruction must use actual transforms; coefficient estimates are not file sizes. Training must expose real errors, gradients and updates; generation keeps weights frozen. State teaching simplifications and cite their technical basis.

Use the chapter director and shared clock. Seeking reconstructs simulation history and training progress, not just the caption. On a paused seek, camera and presentation transitions settle to the requested state. Expensive image/model work belongs in Workers. Pause offscreen and in the background; release renderers, audio, observers, timers and Workers on disposal.

## Produce both languages and voices

Author Chinese and English explanation and spoken scripts separately. Speech should be natural, lively and paced around the visible event: point to a detail, leave room to notice it, then explain the change. Do not read UI text or force literal translations. Preserve the shared chapter timeline and measure both recordings; never time-stretch speech.

Check every spoken reference against both desktop and phone shots, including fallback views. Name the tracked object or signal when responsive layouts move it; directions such as “on the right” are valid only when both compositions preserve them. After changing a shot, recheck its spoken cues before synthesis. If a removed object carries the chapter’s causal step, restore a suitable view of it; rewriting speech alone does not repair the missing visual.

Use the existing offline narration pipeline and commit its scripts, recordings and generated manifests together. Ordinary builds and readers need no speech credentials or live AI service. Do not substitute browser text-to-speech for the authored recordings.

**Narration defaults on.** Honor a saved manual on/off choice. Follow the page language. Attempt playback only when the film is visible and playing; respect reduced motion and browser autoplay restrictions. If permission or an asset is unavailable, show a clear user-activated retry and keep the silent explanation usable. Never bypass autoplay policy, play hidden lessons, or unmute a user who chose silence. The noise experiment's pure test tone is a separate opt-in control.

Listen to both full tracks for intelligibility, terminology, rhythm, warmth and synchronization. Independent transcription without a language hint or reference transcript can expose wrong-language or unintelligible synthesis; it does not establish a natural vocal performance. Record those evidence types separately.

## Integrate the finished work

Use the production guide's file map for the topic registry, lazy experiment import, models/renderers, bilingual MDX, labels, narration and covers. Routes, transcripts, schema, social images and sitemaps derive from this content. Preserve canonical URLs, reciprocal language alternatives and the existing multi-factor language resolver; manual language choices take precedence and persist locally.

Register discovery metadata alongside every topic: one of the existing interest categories, bilingual everyday and technical search aliases, and a suggested starting age (8, 10, 12 or 14). Base the age on the main film's conceptual prerequisites, not its optional equations. This is editorial guidance, not a certified rating or access restriction. Check the catalog in both languages with combined search/category/age/duration filters; its no-JavaScript links must still expose every scene. Keep measured durations derived from the film, and keep the catalog lightweight as it grows. Update both source catalogs in `docs/catalog.md` and `docs/zh-CN/catalog.md`; their regression checks every registered scene, discovery category and measured film duration.

The optional `pnpm scene:new` helper creates an unpublished draft only. It is internal scaffolding, not the skill's interface or proof of completion. Do not publish placeholders to fill the catalog.

For homepage work, preserve the full meaning **Visualize Every Step with AI** and the exact extraction and adjacent-s merge that forms **vistep.ai**. Make it an automatic entrance within the homepage typography, with a natural final position, a readable phone composition, reduced-motion fallback and replay. Do not reintroduce an isolated brand panel, a printed derivation formula or sentimental lettering copy. Review fresh entry as well as replay.

For README/showcase work, create an original motion composition from the project's mechanisms, information processes and spatial ideas. Do not use a page screenshot or screen recording as the hero. Use the actual bundled fonts, inspect an informative first frame, intermediate frames and the loop boundary, control file size, and retain a still alternative and reproducible source. Promotional geometry must be as credible as the scene itself. Keep English-default documentation, the Chinese counterpart, asset provenance and truthful badges current.

## Sustain parallel work

When sustained subagents are requested, keep a bounded queue across creation, review and repair. After each frozen handoff, the integrator owns those files and assigns the worker another independent scene group or concrete repair. Disclose author self-review; do not label it independent review. Keep shared translations, narration and manifests under one writer. A blocked browser check leaves an explicit evidence gap while independent model, source or document work continues. See the [parallel workflow](../../../docs/creating-a-scene.md#register-the-scene).

## Review and deliver

Run the checks appropriate to the change. Complete topics require `pnpm scene:check`, `pnpm verify` and `pnpm build:preview`. Independently inspect complete playback, key stills and contacts, both spoken tracks, chapter/seek boundaries, extreme inputs, desktop and narrow layouts, keyboard/touch operation, reduced motion and applicable resource failures. Measure the complete player, including its longest caption and transport, in both languages. Inspect actual rendered text size after SVG scaling, perspective near corners and moving assembly bounds; distinguish intentional close-ups from accidental cropping. Body text is at least 16 px; primary touch targets are at least 44 px. Test deep links and 404s; keep a concept-preserving 2D path for unavailable WebGL.

Record actual conditions, versions, findings and untested limits. A viewport override is not a physical-phone performance measurement; test results are not visual review, ASR is not listening, and a timed-out audit is not a pass. Favor approximately 60 fps on desktop and stable 30 fps on ordinary phones, without claiming measurements that were not taken.

Finish necessary work before asking for missing external authorization. Follow [deployment](../../../docs/deployment.md) and the authorization already present in the conversation: preview and production are separate, preview is noindex, and pushing main publishes through Actions. Review before that push, wait for the resulting deployment and check the actual site. Do not manually redeploy after a successful Actions release, change domain ownership, expose credentials or change repository visibility for ordinary content work. Deliver the actual result with concise evidence and material limitations.
