# Visual storytelling: production lessons

[简体中文](zh-CN/retrospective.md) · [Documentation](README.md)

The collection began as twelve interactive explanations. Review exposed a gap between feature completeness and explanatory quality: repeated layouts, implausible mechanical details, abrupt interactions, excess text and insufficient direction. The production workflow now treats visual communication as a requirement throughout development.

## Findings that change the process

| Failure                                              | Cause                                         | Production response                                                                                        |
| ---------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| A large isolated brand panel                         | Branding treated as a separate feature        | Integrate the name animation into the opening typography; keep its full meaning visible.                   |
| Repeated experiment dashboards                       | Layout chosen for code reuse                  | Storyboard the phenomenon before choosing its medium; share infrastructure, not composition.               |
| Plausible-looking but open belts or mismatched teeth | Shapes and motion adjusted independently      | Derive pitch, tangents, center distance, phase and closure from a shared model.                            |
| A reader must operate controls before understanding  | The page assumes an experimenter              | Direct a complete silent explanation first; move optional experiments into exploration mode.               |
| Abrupt motion and weak alignment                     | Polish deferred until the end                 | Review baseline, spacing, framing and transitions at each stage, on both wide and narrow layouts.          |
| A short animation expanded by narration              | Duration treated as an audio setting          | Every added chapter needs a new visible causal step, close observation or controlled comparison.           |
| Chinese recordings decoded but were unintelligible   | Asset validity confused with language quality | Check actual speech, independently transcribe recorded chapters, then review delivery and synchronization. |
| Passing tests presented as complete quality evidence | Different evidence categories conflated       | Record numerical checks, browser behavior, visual review and listening separately.                         |

## Branding as an entrance

The subsequent homepage review exposed the same branding problem in a different form: enlarging a wordmark and adding a derivation formula still made the name feel like a separate exhibit. Treat the animation as the transition into the page itself. Review arrival, extraction, merging and the final layout as one sequence, including a fresh load and a repeat visit. An initialization resize event can cancel an otherwise correct animation; a successful replay alone does not establish automatic entry. See the [opening review](qa-home-opening.md).

## Model-led geometry

A loop cannot be repaired by snapping its final point to its first. The bicycle uses shared pitch, an even link count and a solved center distance. The printer uses a common gear module, involute profiles and a closed belt. Numerical checks cover constraints, while still frames expose framing, contact and occlusion problems.

The same distinction applies to a system simulation: passenger identities and reproducible arrivals matter more than convincing motion. A comparison must use the same input, reset consistently and finish without losing objects.

## Direction before dialogue

A film is now planned for 2–5 minutes, preferably 2–3, with a five-minute ceiling. This is not a mandate to slow every old motion. Each chapter states what the viewer sees, what changes and why it matters. The silent sequence must carry the argument; speech guides attention and adds context.

Chapter-relative directors replace absolute timestamps tied to the former short films. Recorded speech determines shared windows. Seeking reconstructs model state, including training progress and simulation history. Generation keeps Transformer weights fixed.

## Speech needs semantic evidence

The previous Chinese synthesis produced decodable MP3s but unintelligible speech. Earlier decode and playback records remain valid only as transport evidence. The replacement pipeline uses explicit Chinese and English neural voices, measures actual speech, and never time-stretches recordings.

Independent ASR without a language hint or supplied transcript can detect wrong-language output and substantial omissions. It cannot establish warmth, pacing or natural emphasis. Do not label a transcript check as a listening review.

## Maintainable delivery

Use separate `dist/` and `dist-preview/` outputs. Preview permits crawling so search engines can read noindex. Main publishes only the verified production artifact. Metadata, transcripts, language links and social cards derive from registered content, avoiding hand-maintained parallel catalogs.

Documentation should explain the product and its contribution contract. Put historical implementation details in dated review records. Use authentic images and badges with verifiable meaning; do not imply adoption, performance or accessibility certification from decorative labels.

The historical changes are traceable through [`045f2ce`](https://github.com/int64ago/vistep/commit/045f2ce), [`ade846b`](https://github.com/int64ago/vistep/commit/ade846b), [`8b2cdc1`](https://github.com/int64ago/vistep/commit/8b2cdc1), [`d571587`](https://github.com/int64ago/vistep/commit/d571587) and [`edc3f3b`](https://github.com/int64ago/vistep/commit/edc3f3b). Those commits are historical evidence, not certification of current quality. See the [production guide](creating-a-scene.md) for the current workflow.

## Exported artwork needs its own font review

Browser text looked correct while rasterized documentation artwork showed missing arrows and angle symbols. The export pipeline intentionally excludes system fonts, so its bundled font coverage must include every symbol it renders. Retain the font licenses, inspect the exported PNGs themselves and check both letters and mathematical notation. A successful image build does not establish glyph coverage.

The README hero now has its own motion composition built from the site's models. A page capture compresses the interface into a promotional image without explaining what is distinctive. Original artwork should show the product's mechanisms and ideas directly. Review the encoded GIF itself: a lossy optimization introduced visible grain even though the source frames looked clean. Preserve a still alternative and the renderer so the artwork can evolve with the product.

## Defaults are a maintained product decision

Narration is now requested by default, replacing the earlier muted policy. Carry a changed default through the player, persistence, project instructions, both languages of documentation and the skill. A blocked autoplay attempt must not become a saved manual mute. Preserve the reader's explicit choice and keep pure test tones separately opt-in.

## Inspect the rendered coordinate system

The Moon scene's first phone diagram inherited a desktop SVG viewBox: its apparent 21 px labels became roughly 9 px on screen. Recompose the coordinate system as well as the controls, and inspect rendered glyph bounds. A fixed film height also needs an upper bound on wide SVGs; otherwise a larger desktop viewport can push credits into the caption even though the phone fits. Compare the full child bounds against the stage at every chapter.

A pair of phone readouts exceeded the available flex width by less than one pixel and wrapped into separate rows. Use explicit grid tracks for information that must share a baseline, and include the narrowest supported viewport in the visual review. Rounded range displays should correspond to the actual manual state; keep the more precise scientific constants in the automatic model.

## Parallel ownership and phone composition

Parallel scene production helps when each worker owns a complete topic and one integrator owns registries, translations and recordings. Handoff packets are temporary: consume them into canonical sources and remove them. Generate a selected batch through one bounded speech pool; simultaneous manifest writers can overwrite each other. A cached two-topic regression confirmed that batch selection leaves existing recordings and manifests byte-identical.

No horizontal overflow does not mean a phone film is composed well. The first parallel batch had 1200–1360 px watch stages made from stacked desktop blocks. Review total visual height, repeated labels and where the current causal action sits relative to its caption. Select the instrument needed for each chapter, keep complete state in exploration, and preserve 16 px text instead of shrinking the whole scene. Explicitly associate range labels with inputs: an output inside an implicit label can take the association away from the slider.

### Give isolated reviews their own dependency tree

A review checkout briefly shared `node_modules` with the active workspace. Package-manager validation then rewrote executable shims for different roots, producing transient missing-file warnings while another process was running. Use an independent offline, frozen-lockfile install in each review checkout. Keep the verified source and deployed assets immutable; never reuse a mutable build directory as an upload source.

### Check the end of synthesized speech

A water-hammer English chapter returned a valid MP3 containing only its first three sentences. Overall ASR similarity was 0.6652, above the old 0.64 threshold, despite the missing ending. A targeted resynthesis restored the clip from 13.06 to 23.32 seconds; both language timelines were remeasured. The audit now requires at least 40% matched coverage of the final fifth of normalized script text (at least 24 characters). The real truncated sample scores zero, while all other 95 batch transcripts pass this additional guard. Re-audit the assembled recordings after repair. This rule flags incomplete endings for review; it does not certify diction or naturalness.
