# NFC review — 2026-09-10

[简体中文](zh-CN/qa-nfc.md) · [Production brief](examples/nfc-brief.md) · [Review index](README.md#review-records)

This is the final pre-publication record of scene 65 on parent commit `efdc33b`. It records completed numerical, browser, recording and transcription checks separately, with untested conditions stated below. The subsequent main push triggers CI deployment; deployment success and live-site verification are outside this record.

## Completed numerical and source-rendered checks

| Evidence                      | Result and scope                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Model author's checks         | 12 targeted tests passed on 2026-09-10 at 20:17 CST. They cover coaxial elliptic-integral comparison, refined Neumann quadrature, body clearance, phasor KVL, source-work balance, NFC-A coding, all 256 eight-bit patterns, deterministic sampling and invalid inputs. These are model-author checks.                                                                   |
| Separate field calculation    | A Biot–Savart field integrated over the tilted receiving disk agreed with the production Neumann contour integral at 20 poses; maximum relative difference 4.10 × 10⁻⁸. This is an independent numerical method for the same ideal loops, not an error bound against a real spiral antenna.                                                                              |
| Separate circuit calculation  | A real four-variable linear solve checked 2,142 load/envelope/pose states. Maximum phasor absolute difference was 1.39 × 10⁻¹⁷; maximum relative source-power residual was 3.92 × 10⁻¹⁶. Reflected resistance and magnetic-energy definiteness remained positive on the sampled grid.                                                                                    |
| Coding and director audit     | An edge-count decoder independently recovered all 256 eight-bit patterns at three sample rates: 768 cases. All 7,007 sampled chapter states were in bounds and deterministic. The separate ideal capacitor solution differed from the analytical envelope by at most 8.69 × 10⁻⁵ normalized units. Sampling does not prove every continuous state.                       |
| Independent instrument review | The model author, who did not author or repair the experiment/director, wrote 10 passing SVG/instrument tests. Actual markup checks cover induction sign, source and switch connections, rectifier conduction, powerless traces, decoded bits, fixed current magnification and restoration between comparisons. The integrator made the production repairs.              |
| Film and supply regression    | Five tests in `src/models/nfc-film.test.ts` passed: powered arrival before reveal, four alternating load states each held longer than 4 s in their 24 s chapter, complete packet settling, chapter-boundary continuity, and an independent analytical RC reference over three discharge constants and three cycle counts. Maximum allowed normalized RC error is 0.0001. |
| Apparatus author's checks     | Seven geometry/cover tests passed after the final artwork repair. Actual mesh vertices were projected for 486 pose/aspect/orbit/detail/flux-sign combinations; they remained within 0.88 normalized screen extent and the camera planes. This establishes sampled geometry fit, not readability or visual quality.                                                       |
| Type check                    | The final `verify` type check covered 462 files: 0 errors, 0 warnings and 37 hints. It is a source check, not browser acceptance.                                                                                                                                                                                                                                        |

The numerical audit fingerprints are `bf3f790a…` for `src/models/nfc.ts` and `d69d7c17…` for `src/models/nfc-film.ts`. The instrument reviewer recorded renderer hash `25543638…` and regression hash `e845982a…`; the integrator subsequently continued presentation changes. The final 938-test verification includes the affected regressions. Detailed local records are `artifacts/nfc/research-model.md`, `independent-review.md`, `independent-results.json`, `renderer-review.md` and `art-review.md`. These artifacts are ignored local evidence, while this document preserves their substantive results.

## Findings and repairs

| Finding                                                                         | Repair and evidence                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rectifier bridges glowed throughout a half-cycle, including capacitor discharge | Conduction now requires the rectified input to reach the stored voltage; both diode pairs turn off during discharge. Opposite input peaks select the correct pair. Independent actual-markup tests passed.                                                              |
| Source wires and a load-switch return contained small physical gaps             | Bridge wires now reach the source circle terminals; the switch return connects to the resistance. Independent incidence checks passed at narrow and wide instrument widths.                                                                                             |
| A disabled reader field still produced a request envelope                       | The envelope now multiplies by the actual RF source state and becomes flat when off. Independent drawing regression passed.                                                                                                                                             |
| Manual bits could replace the authored film example                             | Watch mode explicitly uses `10110010`, preserving exploratory edits separately. Source review confirmed the distinction.                                                                                                                                                |
| Reply plots normalized every pose to the same ripple height                     | A fixed 10 mA current scale preserves amplitude comparisons. The offered integer grid's maximum was 8.474133 mA; a finer 90,321-pose grid found 8.474271 mA. These are grid bounds, not a continuous extremum proof.                                                    |
| Wide instrument containers could shrink nominal 16 px SVG labels                | Instrument coordinate widths now match their individual CSS width caps. Integrated measurement confirmed 16 px SVG text and matching rendered/viewBox dimensions in the four chapters containing SVG labels; complete player bounds are recorded below.                 |
| A large tilt exposed the back of the tag                                        | The apparatus author changed the viewing direction and rechecked the actual renderer with the inlay visible.                                                                                                                                                            |
| The first cover clipped the reader housing                                      | Its separately composed scale and origin were corrected; the author rechecked 400 px and 290 px raster renders. A decorative indicator dot was removed.                                                                                                                 |
| Reader capacitor topology disagreed with the RF model                           | The art author repaired the reader to a single series source–winding–capacitor loop; the tag retains its parallel capacitor. Connection-graph tests distinguish the circuit topologies. This is an author repair, not independent artwork acceptance.                   |
| The induction close-up needed a model-linked local reference                    | A local flux-linkage arrow now uses the model winding normal and normalized signed flux; it fades at zero. A 16 px HTML label names the annotation. The short-stage fallback measures its actual container, and detail framing remains bounded by real mesh projection. |

## Completed apparatus visual review

The apparatus author inspected the actual shared Three.js Studio renderer in **Chrome 152.0.7977.76 on desktop macOS**, using a temporary Vite server on port 4387 and a separate cache. This was author self-review of the apparatus, not independent acceptance of the full topic page.

- Default 8 mm / 0° at the ordinary desktop viewport and 390×844 / 320×844 viewport overrides: housing, tag, spirals and inner/outer connections were visible.
- 60 mm / 80° at 390 px: the final camera retained the visible inlay and the complete objects.
- Opaque face and exposed inlay at 320 px: both appeared correctly in their selected states.
- Selected 2D fallback at 320 px and the extreme pose: complete apparatus fit. Selecting fallback content is not a forced renderer failure or context-loss test.
- No console errors occurred during those checks. The worker reset the viewport, closed its tab and stopped its own server.

These browser checks predate the final series-capacitor, local-flux-arrow and detail-view addendum. The author subsequently viewed the final 400 px series-capacitor cover and positive/negative flux snapshots from the actual flat geometry; the short fallback apparatus and marker fit a 254×215 art frame. The integrator's later full-page and short-stage checks are recorded separately below. No physical-phone performance measurement, complete integrated film, audio listening or forced WebGL failure was part of that worker's evidence.

The root integrator separately inspected the actual production `dist/social/nfc.png` at 1200×630: the complete tag, reader and copper structure fit without clipping, and the film duration reads 2:48. Actual catalog placement and discovery interactions were checked separately, as recorded below.

## Scientific and timing conventions

The scene illustrates a passive NFC-A tag, not every NFC mode. The carrier is 13.56 MHz, nominal bit rate `fc/128`, and reply subcarrier `fc/16`. Actual Modified Miller and Manchester relationships are retained in an ideal, unframed signal; no payment, credential or authenticated transaction is simulated. The rectifier/capacitor inset is a separate normalized ideal model, not a prediction of the tag chip's DC voltage.

At 8 mm / 0°, closing the extra load increases reader current from about 23.120 to 31.296 mA while chip DC power decreases from about 5.696 to 3.734 mW. Distance and available power are also not universally monotonic because matching matters. A reply requires both load states to meet the assumed 0.6 mW supply threshold and a 0.15 mA reader-current difference. These are teaching assumptions, not certified NFC limits. Tilt raises the tag centre to preserve minimum body clearance.

Seven 24-second windows total 168 seconds. The final chapter increases gap over 0.96–4.80 s, returns over 7.44–10.08 s, tilts over 10.56–13.44 s and restores alignment over 15.36–18.00 s. The final six seconds hold the restored geometry. Both assembled recordings ran against this schedule through the final holds. This establishes playback and source-timing correspondence, not word-level listening evidence.

## Integrated browser and recording review

The integrator used Chrome 152 on desktop macOS and the static preview on port **4355**, rebuilt at **20:44:32 CST**. Chinese at 1440×1000 and English at 390×844 each ran continuously from 0 to 168 seconds, without seeking or reloading, at playback rate 1. At the endpoint both film and audio clocks were 168 seconds and paused. These were full normal-speed runs observed through **sampled screenshots**, not continuous visual observation or native listening. The earlier HMR-reset development run is excluded.

After those runs, the only scene change corrected the bit-button accessible label from named placeholders to the project's indexed `{0}` / `{1}` placeholders. Imagery, timing and recordings were unchanged. The final build and manual checks passed after that correction; the two full films were not rerun for this label-only change.

| Evidence                        | Completed result                                                                                                                                                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recorded assets                 | Both tracks measure 168 s with seven 24 s windows; Chinese clips are 15.39–19.87 s and English clips 14.32–19.47 s. Assets: `nfc-zh-b00c834d60f6.mp3`, `nfc-en-5a0ac639228a.mp3`. Tempo remains 1 with no time stretching.                                                                                                                  |
| Independent transcription       | All 14 clips passed without a language hint or reference prompt. Chinese similarity 0.867–1.000, English 0.943–1.000; tail coverage ≥0.958 and 1.000 respectively. Log: `artifacts/nfc/asr-audit.log`. This does not establish vocal quality.                                                                                               |
| Manual data identity            | Changing the first bit changed `10110010` to `00110010`, and the recovered sequence matched. Returning to the film restored the authored `10110010`.                                                                                                                                                                                        |
| Input boundaries and reset      | At 60 mm the chip lacked power and all eight recovered positions were unknown. At 60 mm / 80°, the complete 2D apparatus remained visible. Turning the reader field off flattened ASK, gave ΔI = 0 and eight unknown reply positions. Reset restored the defaults. Real Home/End key input was exercised.                                   |
| Pause and chapter jump          | At 320 px Chinese, play followed by pause stopped film 60.2 s and audio 60.211597 s together. Selecting the 2:00 reply chapter rebuilt the signal at 120.1 s with its future trace and eight not-yet-read positions.                                                                                                                        |
| Replay and offscreen pause      | Replay was triggered. When the player was wholly offscreen, film time 21.4 s and audio time 21.431308 s paused and stayed unchanged while waiting. Returning to view resumed progress to 34.7 s. This is offscreen evidence, not browser-background evidence.                                                                               |
| Renderer initialization failure | Fixture port 4359 threw only when the built Studio module constructed its renderer, after the startup capability gate passed. The page had 0 canvases and 1 fallback SVG. At 320 px English, the induction arrow and curves were complete and the player measured 745.8 px high. This tests initialization failure, not later context loss. |
| Narration failure and recovery  | Fixture port 4360 returned HTTP 503 for audio; the silent film advanced to 5.8 s and offered retry. After restoring the server, retry reached readyState 4 with no media error; audio 21.09 s matched film 21.1 s and the status disappeared.                                                                                               |
| Saved mute preference           | After explicitly disabling narration and reloading, no audio element was created and the silent film advanced to 6.9 s.                                                                                                                                                                                                                     |
| Catalog and filters             | The actual 320 px cover retained the complete apparatus. English `q=nfc`, category `electricity`, age 12 and short length returned one NFC result. Switching to Chinese preserved all four filters and the same single result.                                                                                                              |
| Social image                    | The actual 1200×630 production PNG contains the complete tag, reader and copper structure, no clipping, and the 2:48 duration.                                                                                                                                                                                                              |

## Measured complete player

Each height includes the current scene, caption and transport. At 320 px width, all seven chapters were measured in both languages:

| Chapter       | English height (px) | Chinese height (px) |
| ------------- | ------------------- | ------------------- |
| 1 — Arrival   | 779.4               | 724.9               |
| 2 — Induction | 745.8               | 708.4               |
| 3 — Supply    | 734.8               | 722.3               |
| 4 — Request   | 748.3               | 707.9               |
| 5 — Load      | 766.8               | 711.9               |
| 6 — Reply     | 786.3               | 745.9               |
| 7 — Coupling  | 801.4               | 748.4               |

At 390 px, the measured Chinese maximum was 784.4 px. At 1440 px, maxima were 810.8 px in English and 813.8 px in Chinese. Body width equaled viewport width throughout. In the four chapters with SVG text, the actual rendered dimensions matched the viewBox and text remained 16 px. Narrow readout/unit wrapping was repaired; the apparatus height at widths ≤360 px is 290 px. These are browser viewport measurements, not physical-phone measurements.

## Final commands, scope and remaining limits

- `pnpm scene:check` passed 18/18 tests.
- `pnpm verify` passed 109 test files / 938 tests, type checking of 462 files with 0 errors / 0 warnings / 37 hints, and 162 Markdown files / 680 local links. Production build audit passed 133 canonical pages, internal links/assets, sitemap, 404 and indexing policy.
- `pnpm build:preview` passed the corresponding 133-page audit with noindex. Logs are `artifacts/nfc/scene-check.log`, `verify.log` and `build-preview.log`.
- Shared metadata for the previous 64 scenes remains unchanged; the new NFC entry does not revise their recordings or chapter data.

Native full-track listening in both languages, physical-phone performance, the system reduced-motion setting, browser-background hiding, independent autoplay-policy rejection, startup browser-capability rejection, and context loss after a renderer was running were **not tested in this review**. Existing shared tests do not replace these missing observations. The initialization-failure fixture and offscreen pause must not be relabeled as those untested cases.

This record ends before publication. The authorized main push triggers CI deployment; its outcome and live-site verification belong to the integrator's final delivery report.
