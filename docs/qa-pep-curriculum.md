# PEP high-school physics: local review

[简体中文](zh-CN/qa-pep-curriculum.md) · [Review index](README.md#review-records)

2026-10-18. The teaching area covers the audited experimental learning positions in six People's Education Press physics textbooks. This is a **pre-publication review record**. The user authorized committing, pushing and publishing this batch after reviewing the local preview; the resulting release status is recorded in [Actions](https://github.com/int64ago/vistep/actions/workflows/ci.yml?query=branch%3Amain). The source baseline is `8be5cc71f8154a539f932cb65becf23d78d32c1b`, with an uncommitted working tree at the time of review. Browser observations were gathered during successive repairs; the baseline commit alone does not identify all reviewed changes.

## Coverage and learning order

| Book                        | Audited positions | Bound to registered scenes |
| --------------------------- | ----------------: | -------------------------: |
| Compulsory Book 1           |                37 |                         37 |
| Compulsory Book 2           |                31 |                         31 |
| Compulsory Book 3           |                41 |                         41 |
| Selective Compulsory Book 1 |                59 |                         59 |
| Selective Compulsory Book 2 |                38 |                         38 |
| Selective Compulsory Book 3 |                65 |                         65 |
| Total                       |           **271** |                    **271** |

The 271 positions resolve to **109 distinct scenes**: 260 positions use the 98 newly authored scene groups, and 11 reuse existing scenes, including the previously completed Newton-tube sample. The 98 new packets correspond to topic numbers **204–301**; the complete site registry contains **301 topics**. Positions retain book, chapter, section and learning order. Historical references, thought experiments, demonstrations, hands-on activities and research tasks retain their different classifications.

A textbook entry can select a continuous chapter interval in a shared scene, rather than replaying the whole group or introducing later material prematurely. All 260 centralized variant mappings have nonempty, existing, consecutive chapter selections. Reusing an apparatus does not remove its separate textbook learning positions. Coverage here means the audited inventory is connected; it is not a claim that every physical or visual detail has been exhaustively reviewed.

The data audit identified an obsolete Franklin-to-friction entry in the electrostatic-induction packet. The integrator removed that declaration; the live curriculum mapping correctly selects the four chapters in `franklin-electricity-evidence`. The earlier audit remains a record of the discrepancy when it was found.

## Independent review and resulting repairs

Scene authors, other scene owners and the integrator separately examined models, rendered geometry and state transitions. Concrete findings included:

- An independent dimensional benchmark caught a **1000× unit-conversion error in double-slit measurement**. The corrected reference gives a 3.926666667 mm fringe spacing for 589 nm light, 0.18 mm slit separation and a 1.2 m screen distance. Tests check physical units and inference, beyond reproducing the implementation.
- Exploration state could leak into automatic films: examples included optical index and angle, Neptune's perturbing mass, Cavendish's attracting mass, muon speed, flight-clock altitude, Weber comparison signals, H₀ and balloon speed. Returning to a film now restores its authored parameters; actual React transition regressions check the rendered result.
- Geometric checks repaired opposite LIGO arm changes, pulsar Doppler direction, horn elevation, an offscreen torsion pointer, fixed residual scales, physical contact and instrument connections. The model value and the visible apparatus must describe the same state.
- Narrow-screen review reduced repeated headings, explanations and secondary records in watch mode while retaining the apparatus, causal observation and necessary readings. Longer explanations and controls remain available through exploration or reading. Small SVG labels were enlarged at their measured display scale. These changes are specific to each apparatus, not a reduction of the whole page.

Focused model, geometry and state-transition tests establish bounded properties. They do not establish visual finish, intelligibility or the quality of a complete explanation. Detailed local records are in `drafts/pep-curriculum/`, including the optics, astronomy, modern-physics and owned-watch review records.

## Recorded speech and independent ASR

The new groups contain **637 chapters**, with Chinese and English recordings: **196 tracks and 1274 chapter/language records**. The archived ASR batches `artifacts/pep-curriculum/asr-batch-01.json` through `asr-batch-19.json` cover all 98 new scenes, with no missing or duplicate `(scene, language, chapter)` keys. All detected languages match; all 1274 saved automatic checks pass.

The independent local MLX Whisper large-v3-turbo audit used no language or reference-text hint. Its guard requires matching language, normalized similarity ≥0.64 and ending coverage ≥0.4. Minimum similarity was 0.6905 in Chinese and 0.8066 in English; minimum ending coverage was 0.6667 and 0.4074 respectively. Numeric spelling and millimetre/millimeter conversion account for low-scoring examples, but ASR can also misrecognize technical homophones. Passing is not a claim of verbatim accuracy or natural delivery.

Every expected text matches the current packet, integrated narration and audio manifest. All 196 current audio files exist and are nonempty. Re-extracting all **1274 current audio intervals** with the original audit's ffmpeg parameters reproduced **1274/1274 saved SHA-256 hashes**, with zero mismatches. This binds the ASR evidence to the current recordings without treating decoding or hashing as listening. All integrated cue intervals fit their chapters and tracks. Measured speech extended 33 group durations by 0.5–10 seconds; packet planning times are not presented as final playback times.

Batch 19 was copied byte-for-byte from `artifacts/narration-transcription.json`; both files have SHA-256 `efcee0f924fdc16487a6c207e21b00672a4036cdaf98efdd81f933b49daf564b`. The detailed audit is `drafts/pep-curriculum/final-data-audit.md`. This coverage concerns the 98 new groups, not a new listening audit of all 301 site topics.

## Browser observations and their limits

The integrator captured real browser states in five local evidence sets:

| Evidence file under `artifacts/pep-curriculum/` | Records | Purpose                                      |
| ----------------------------------------------- | ------: | -------------------------------------------- |
| `scene-sweep.json`                              |     186 | Initial sampled apparatus and layout sweep   |
| `scene-recheck.json`                            |      87 | Rechecks after identified repairs            |
| `final-repairs.json`                            |      25 | Additional targeted repair checks            |
| `final-scenes.json`                             |      36 | Final scene samples                          |
| `closing-repairs.json`                          |       9 | Final repaired apparatus, labels and layouts |
| Total records                                   | **343** | Includes repeated scenes and states          |

Together these files cover **98 unique new scenes and 196 scene/language pairs**. They contain 183 records at 320 × 844 and 160 at 390 × 844 CSS pixels. They are paused-keyframe browser checks, not 343 unique chapters or complete films. Earlier records include readability observations that motivated later fixes; a structural `passed` field does not mean every visual concern was absent. Viewport emulation does not establish physical-phone performance. The browser version is not populated in these records.

One separate timing check, `artifacts/pep-curriculum/playback-gravity.json`, ran `gravity-measurements` without seeking after start in the local static preview. The 168-second film reached its held final frame; the recorded wall-clock observation was 203.494 seconds after start, with intermediate film readings of 84.6 and 157.5 seconds. Start, middle and end frames were inspected. Audio was deliberately muted. This was unattended continuous playback with sampled observations, **not continuous human viewing or listening**. An earlier development-server attempt was interrupted by HMR and is not counted as a passed playback check.

The final static preview also exercised the 56-second textbook selection for the double-incline lesson: playback stopped at absolute film time 141.5 s (chapter 4), and replay returned to the selected interval at 85.8 s (chapter 3). Search crossed book boundaries, the sixth book showed 65 positions, and both desktop and phone curriculum navigation were inspected. The final SVG cover check caught missing metal bodies in the electrostatic-induction thumbnail; the cover was repaired and both preview and production builds repeated. This cover-only repair followed the full verify run. Evidence: `teaching-variant-static-*.json`, `teaching-mobile-final.png`, `teaching-final.png`, `cover-check-final.png`; the last cover uses the regenerated PNG.

## Final command status

The completed `pnpm verify` passed formatting, the documentation audit (466 Markdown files / 1421 local file links), TypeScript (0 errors / 0 warnings), all **2639 tests in 401 files**, the production build and the build audit. The first attempt's nine failures were repaired: integration fixtures now supply and verify the timeline/variant contracts, and exact bilingual subject names constrain the canonical category before free-text matching. Original assertions remain, with additional regressions.

| Final command          | Recorded status                                                             |
| ---------------------- | --------------------------------------------------------------------------- |
| `pnpm scene:check`     | Passed: 7 files / 36 tests                                                  |
| `pnpm verify`          | Passed; `/tmp/vistep-curriculum-verify-final-02.log`                        |
| `pnpm build:preview`   | Passed; `/tmp/vistep-curriculum-preview-final-02.log`                       |
| Static outputs         | 1152 pages; 1151 canonical pages audited for links, assets, sitemap and 404 |
| Preview indexing       | `dist-preview/` passes noindex policy audit                                 |
| Production publication | Authorized after this review; see Actions                                   |

The final source fingerprint is `4a7766067d4a70b82df1d632bf8f215499ccfad28427ed7094808124cb77d7c5` over 3181 nonignored tracked/untracked files (sorted paths plus per-file SHA-256; documentation, drafts and the two primary READMEs excluded). It includes source, scripts and public recordings. Definition: `artifacts/pep-curriculum/final-source-fingerprint.json`.

## Outstanding acceptance evidence

- Full native listening of every new Chinese and English recording: **not run**.
- Continuous human viewing of every complete new film: **not run**. The single gravity timing check above does not fill this gap.
- Physical-device touch, sustained frame rate and performance checks: **not run**.

The coverage, automated checks, ASR and sampled stills make the work concrete and reviewable. None replaces the remaining auditory, continuous-viewing or device evidence, or guarantees a “master-level” presentation by quantity alone.
