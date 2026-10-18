# PEP high-school chemistry and biology: local review

[简体中文](zh-CN/qa-pep-sciences.md) · [Review index](README.md#review-records)

2026-10-18. This is a **pre-publication review record**, closed after the local verification and builds. The source baseline is `2b2deb0603dd6ad60775bc56e4744c44526b9786`; the reviewed working tree includes subsequent uncommitted changes. The baseline alone does not identify the final reviewed source. Publication remains subject to the existing user authorization and completed release checks; no deployment result is claimed here.

## Coverage and learning order

| Book                   | Chemistry positions | Biology positions |
| ---------------------- | ------------------: | ----------------: |
| Compulsory 1           |                  36 |                55 |
| Compulsory 2           |                  39 |                33 |
| Selective Compulsory 1 |                  29 |                30 |
| Selective Compulsory 2 |                  33 |                27 |
| Selective Compulsory 3 |                  46 |                27 |
| Total                  |             **183** |           **172** |

The batch adds **134 scenes: 84 chemistry and 50 biology**, bringing the registry to **435 topics**. Chemistry's 183 positions use 85 scene families because its DNA entry also uses `bio-dna-structure`; this is the same family used by biology, not an additional authored scene. With the existing 271 physics positions, the teaching area contains **626 learning positions**.

The inventory was derived from textbook contents, retaining the distinctions between student experiments, historical evidence, surveys, structural models and mechanisms. Learning positions are not a count of formal experiment columns or their individual substeps. The textbooks and extracted full texts are local research material and are not redistributed.

An independent final static audit checked all **355 chemistry/biology positions** against the target inventories and six owner mappings. It found no missing or duplicate positions, hierarchy/page discrepancies, page-order reversals within a book, inconsistent English chapter/section names, unregistered scenes, missing bilingual articles, or empty/invalid/nonconsecutive film selections. All apparatus keys agree with the centralized variants. The integrator's strict curriculum synchronization also passed. This establishes inventory consistency, not exhaustive scientific or visual acceptance.

## Independent findings and repairs

Final entry/playback findings were reproduced and repaired:

- **Periodic practical entry:** exploration ignored the selected textbook apparatus. The period-three entry now starts with magnesium in cold water; the chapter practical starts with the sodium-halide spotting tile. Watch-to-explore regressions also preserve subsequent reader choices.
- **Delayed native pause:** an old queued audio `pause` event could arrive after playback resumed and stop the film again. The handler now verifies that the audio is still paused. A regression reproduces offscreen pause, resumed playback, then delayed event delivery. This does not establish the cause of every earlier native interruption.
- **Lazy scene variant:** `Experiment` passed the selection to the player but omitted the optional `variant` prop consumed by some scene components. The biology reviewer identified 33 positions across 14 components, including 19 nondefault apparatus selections. The boundary now passes the prop; real lazy-component regressions check phenol/FeCl₃, molecular-formula evidence, argon density and the ordinary full-scene default.

The integrator also read the independent scientific models and inspected actual desktop and narrow-browser keyframes over successive repair rounds. Three examples in `artifacts/pep-sciences/partial-acceptance.json` are enzyme bubbles tied to instantaneous reaction rate, the food-iron funnel path and arrival-based counts, and a petroleum residue outlet corrected consistently in model, rendering and cover. These are causal/model or geometric repairs, separate from layout adjustments. Earlier failed observations remain in the record; a later fix does not retroactively turn the earlier observation into a pass.

Final visual inspection also caught small inherited segmented-control text, undersized A/B/C buttons, and selects that expanded their grid tracks and were clipped by the enclosing player. Chemistry/biology segmented controls now use 16 px text and 44 px minimum targets; the affected biology grids allow their controls to shrink. A 2 px native range margin was removed within these scenes. The browser audit was strengthened to inspect actual clipping ancestors after a screenshot exposed a viewport-only false negative. Corrosion hydrogen bubbles now derive their upper position from the liquid surface and fade there; a regression checks 202 connected/iron-only states.

## Separate evidence and remaining limits

| Evidence                                  | Final local result                                                                                                                                                                                                                                                                           |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model and visual review                   | Independent model reading and actual paused desktop/narrow inspection across the rounds in `partial-acceptance.json`; bounded states, not a claim that every possible state was viewed.                                                                                                      |
| Navigation                                | Both locales, all five books per subject, search, hashes and no-JavaScript access passed. The 435-topic catalog also passed combined-filter, reload, empty-state and reset checks.                                                                                                           |
| Continuous playback                       | All **134** new scenes completed technical uninterrupted playback. Media-clock checkpoints are not continuous human viewing.                                                                                                                                                                 |
| Independent ASR and current audio binding | **1988/1988** bilingual chapter records passed, with no missing current clips. Their re-extracted SHA hashes, text and status match the saved independent ASR results. No language hint or reference transcript was supplied. This does not establish natural delivery or exact terminology. |
| Narrow exploration                        | Initial **268 pages / 1378 states**, followed after repairs by **48 pages / 548 states** with stronger clipping checks. The root reviewed the 32 long-control representative images and targeted repair screenshots separately.                                                              |
| Built native-media boundaries             | **4 cases / 28 checks** passed for nonzero chemistry/biology intervals in both languages; start, real audio clock, end stop, replay, chapters and URL clamps. The root inspected 12 stills. Output was muted; this is not listening.                                                         |
| Browser smoke and faults                  | **132 cases and 6 injected resource-failure cases** passed on the final built preview.                                                                                                                                                                                                       |
| Listening                                 | **Not run: unavailable.** The tool omitted attempted audio input; `listening-capability.json` records the gap.                                                                                                                                                                               |
| Physical phones                           | **Not run.** Emulated viewports do not establish real touch, frame-rate or thermal performance.                                                                                                                                                                                              |
| Complete human viewing                    | **Not run for every film.** Paused inspection and technical continuous playback remain separate evidence.                                                                                                                                                                                    |

The incremental acceptance log retains earlier failed observations and pending notes as history. The final structured summary is [review.json](../drafts/pep-sciences/review.json). Counts, tests and screenshots do not independently certify “master-level” presentation.

## Final command and source record

`pnpm scene:check` passed **38 tests**. `pnpm verify` passed **3400 tests in 571 files**, with **0 Astro errors and 0 warnings** (604 hints). The last CSS-only repairs were additionally checked with scoped formatting, fresh production and preview builds and actual browser checks. Production and preview audits each passed **2133 canonical pages**, internal links/assets, sitemap and 404 checks; the separate preview retains `noindex, nofollow`.

Final source SHA-256: `d52ca8865d13455d54cda75195a04f1637dbe8bfb6bb4c84718461daba83b19d`. Its explicitly bounded domain is `src/`, `scripts/`, `public/`, `.github/` and the listed build/runtime/hosting configuration files, using actual asset bytes. The local manifest contains **4420 files**; docs/drafts are excluded to avoid a self-referential hash. The baseline commit remains the one above; the fingerprint identifies the later reviewed source.

Publication is deliberately separate from this pre-push record. The existing user authorization permits the main push; [Actions](https://github.com/int64ago/vistep/actions/workflows/ci.yml?query=branch%3Amain) provides the subsequent verification, deployment and live-site result.
