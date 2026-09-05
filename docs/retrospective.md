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
