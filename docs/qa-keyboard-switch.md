# Keyboard switches review — 2026-09-12

[简体中文](zh-CN/qa-keyboard-switch.md) · [Review index](README.md#review-records)

This addition to parent `bab34d2` is scene 71, a 213.5-second bilingual explanation of six representative contact switches plus Hall and optical sensing. The model, physical artwork and bilingual writing had separate owners. The integrator authored the instruments, coordinated registration and recordings, and reviewed the actual browser output. The [brief](examples/keyboard-switch-brief.md) records sources, initial direction and teaching limits.

## Scientific and structural review

The six contact examples use CHERRY MX2A nominal actuation force and travel. Brown's 45 cN actuation force is distinct from its 55 cN tactile peak; Blue separates 50 cN from 60 cN. Continuous force paths, return thresholds, internal display dimensions and Hall/optical settings are teaching examples. The force plot identifies its fit, the travel ruler labels its illustrative reset, and the optical ruler labels teaching travel. The film explains click-making structures without claiming recorded switch sounds or latency measurements.

Independent review checked 38,784 contact-history states and 300 sparse/dense Rapid Trigger histories. A partial press that never actuates cannot produce an electrical connection merely by reversing. The model reconstructs history on seeking. Red and Black comparisons retain the same displacement, with two force markers. The Silver comparison uses one physical travel scale for both activation markers. Hall fixed-threshold and Rapid Trigger outputs share the exact input history.

Physical geometry and its 2D projection share the same solids. Review repairs addressed the actual cam/follower meeting point, Blue jacket guides and connected stops, both silent end cushions, a clear Hall magnet/sensor path, and an optical slot that actually transmits the beam after activation through the rest of travel. Contact faces meet at the model's zero gap; the spring remains seated while its length changes. Deliberate close views remove the keycap and board from some frames to make the causal parts readable. They do not represent manufacturing drawings.

## Recorded speech

Two static recordings were generated with unchanged playback rate. Measured Chinese and English speech share a **213.5 s** timeline. All **18 chapters** passed independent transcription language, content and ending checks. This is ASR evidence, not native listening. All 140 prior MP3 files and 280 prior per-topic metadata entries were compared against the parent snapshot and remained unchanged.

## Browser and delivery evidence

The browser review uses Chrome on macOS and explicit 320/390 px viewport overrides. Early actual-page observations prompted tighter mechanism close-ups, a shared Silver/Red travel instrument, shorter equivalent English captions and reduced duplicate Hall labels. The language switch retained the paused 49.1-second observation. The automatic player keeps the authored speech and independent force/detection model on a shared clock.

`pnpm scene:check` passed 20 checks. Final `pnpm verify` passed type checking, formatting, documentation links, 1,055 local tests and the production build audit. The local count includes 12 ignored review-only tests; the committed suite contains 1,043 tests, including 12 new model tests. Both production and preview contain 146 generated pages, with 145 canonical pages passing asset, link and indexing audits. Preview remains separately built and noindex. A final Chinese emphasis-only MDX correction was rebuilt and audited in both outputs.

The complete Chinese film reached 213.5 s at playback rate 1, with sampled model/media clocks aligned within 0.05 s and the media reporting its ended state. This observation used periodic stills and clock readings. After the final silent-switch camera change, its upper and lower cushions were reviewed again in the actual 390 px 3D view. Whole views retain the keycap and board; causal close-ups intentionally frame the working parts.

The final English preview also played from zero to the 213.5 s ended state at rate 1; sampled clock differences stayed below 0.1 s. The final Chinese Silent segment was replayed from 127.1 s into the following Hall chapter. Offscreen review held film time at 155 s and media time at 155.045 s across separate readings; returning to the experiment resumed both.

Maximum measured complete-player heights, with disclosures closed and all nine chapters plus the Silver/Silent transition sampled:

| Viewport | Chinese |  English |
| -------- | ------: | -------: |
| 320 px   |  826 px | 850.5 px |
| 390 px   |  821 px | 843.5 px |

All samples had zero horizontal page overflow. Rendered body and instrument text remained at least 16 px, and primary controls at least 44 px. Manual exploration exercised all eight switches through both cycle endpoints; Hall initial-depth and Rapid Trigger-distance extremes changed the actual outputs. Paused language changes preserved the observation time.

Resource cases were exercised separately using local fault fixtures:

- A runtime renderer exception after the capability gate produced the shared 2D geometry. The first check found an SVG intrinsic-height overflow; after repair, both stage and fallback measured 340 px, with no overlap of the instruments. Blue, Silent Red, Hall and optical key frames were inspected.
- An MP3 HTTP 503 kept the silent film advancing and exposed an explicit retry. Restoring the resource and activating that control resumed narration on the film clock at rate 1.
- Reduced motion held the initial clock at zero with audio paused; an explicit play action started it.
- Startup rejection of WebGL 2 displayed the compatibility notice and did not claim to run the experiment. Both the complete chapter transcript and sourced article remained readable when expanded.

The generated 800 × 460 collection cover (61,879 bytes) and 1200 × 630 social image were visually inspected for mechanism visibility and framing. Existing narration assets were preserved as described above.

The actual Chinese catalog combined “磁轴”, mechanisms, age 10 and 3–5 minutes into one matching card. English “rapid trigger” with the same filters also returned the card; changing the duration to at most three minutes excluded it. The card showed the actual cover, 3:33 duration and suggested age 10. Static catalog links remain generated for all 71 scenes and were covered by the build audit.

## Evidence limits

Viewport overrides establish responsive composition, not physical-phone performance. Native full-track listening and physical-device performance were unavailable in this review environment. The recordings' existence, transcription results and media-clock playback must not be presented as those missing forms of evidence. Geometry CPU checks are separate from browser frame-rate measurements. No manufacturer CAD or recorded typing sound is included.

## Model-detail revision from parent `9d7f0a7` — 2026-09-12

The sections above retain the initial release's evidence. This revision responds to the user's feedback that the keyboard model lacked detail; earlier browser, playback and build results do not certify these new meshes. The geometry author (`/root/helicopter`), independent renderer reviewer (`/root/ak47`) and independent reference reviewer (`/root/landmine`) have separate evidence below. All three used GPT-6 Astra; the root integrator retains final browser and delivery acceptance.

The reference reviewer downloaded CHERRY's three official exploded animations and inspected their 2.015-second frames, an assembled Blue frame and a Brown opening frame, plus the Silent exploded still and a Blue product image. The [updated brief](examples/keyboard-switch-brief.md) preserves the earlier URL-only record and these later observations. Official MX2A pages confirm barrel springs for Red, Black, Brown, Speed Silver and Silent Red, with Blue excluded. The revised cover, Brown fallback and Blue fallback images received a separate static comparison; no blocking shape/source mismatch was found. This is frame inspection, not physical measurement, manufacturer CAD validation or browser playback.

The geometry now uses continuous tapered thin shells, latch windows, a dished thin keycap with connected socket supports, one shaped cross stem, and broad stamped contact sheets with actual slots and bent sections. Spring end coils remain seated; barrel shape follows the applicable variants. High and reduced detail preserve the same causal parts, movement and contact gap. The author's numerical review covered mesh closure/winding, eight variants across 25 travel states at both detail levels, and bounded upper-shell/contact collision probes. Its combined targeted run passed 29 checks, including existing checks; this is author evidence, not an independent visual verdict.

Five new production tests in [keyboard-switch-mesh.test.ts](../src/components/three/keyboard-switch-mesh.test.ts) cover concave Brown cap triangulation, planar board normals, smooth cylinder sides with hard end caps, a planar stem crown beside a bevel, and topology/attribute/UV reuse during spring deformation. Independent integration review checked 559,308 actual rendered corners across 15 poses against source geometry and the fitted shadow frustum. Another 80 structural states retained spring seating, leaf separation, Silent cushions, Hall clearance and the optical slot; 56,576 lower-shell probes and 96 explicit support-intersection checks tested clearances and attachments. The independent targeted run passed 22 checks, comprising five ignored integration checks, the five production helper tests and twelve existing model tests. These runs overlap and must not be added together. The probes are bounded numerical evidence, not an exhaustive collision proof. CPU update measurements exclude WebGL drawing, transmission and shadows, and do not establish device frame rate.

Source comparison with parent `9d7f0a7` found the core scientific model, shared timeline, spoken scripts and both audio metadata files unchanged. All **142 existing MP3s** matched the parent's Git LFS object hashes (or committed bytes). This revision does not regenerate narration or change the 213.5-second film. Detailed local evidence is retained under ignored `artifacts/keyboard-switch-refinement-2026-09-12/`: `reference-review.md`, `geometry-author-review.md`, `render-path-review.md` and their numerical snapshots.

### Final integrated validation

After the product files were frozen, `pnpm verify` and `pnpm build:preview` passed: formatting, documentation links, zero type errors, 1,069 local checks (1,048 production checks and 21 ignored review checks), and both 145-canonical-page build audits. Both outputs contain 146 generated pages; preview retains noindex. The first aggregate run exceeded the five-second timeout in two older ignored image-rendering reviews under concurrent load. Their local-only timeout was increased to twenty seconds and the entire verification rerun passed; no production assertion or timeout was changed. Documentation-only completion was formatted and link-audited afterward.

The integrator reloaded the frozen 3D scene in the Codex in-app browser on macOS and inspected whole-object and contact close-ups. The Chinese film then played from zero to 213.5 seconds at rate 1, with periodic screenshots across its chapters. Sampled film/media clocks differed by less than 0.1 seconds; the media finished at 213.5 with `ended=true`. This is complete timeline playback with sampled visual observations, not native full-track listening. No normal-preview console errors were observed.

The separately built preview was checked in both languages at 320 and 390 px across ten chapter/variant moments; all forty samples had zero horizontal page overflow. Stage heights were 215 and 230 px. Actual stills covered Brown's contact at 320 px, Blue return, Silver whole view, Silent bottom cushions and the English optical light path at 390 px. Paused language switching retained 199.1 seconds. Deliberate mechanism close-ups crop the cap or board, while whole views retain both. These viewport overrides do not establish physical-phone performance.

A runtime renderer exception in a local fixture produced the shared SVG fallback with no canvas. Brown, Blue, Silent Red, Hall and optical stills were inspected at 390 px; fallback and stage both measured 230 px with no horizontal overflow. The desktop whole view measured 400 px for both, matching the new desktop stage. The regenerated 800 × 460 cover (64,378 bytes) and 1200 × 630 social image (91,822 bytes) were also visually inspected. Unchanged audio-failure and reduced-motion behavior retains the earlier, separately identified evidence; those cases were not rerun for this geometry-only revision. Native listening and physical-device/GPU performance remain unmeasured. The root's local observations and clocks are recorded in `root-browser-review.md` alongside the earlier review artifacts.
