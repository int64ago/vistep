# Helicopter, AK-47 and landmine review — 2026-09-12

[简体中文](zh-CN/qa-helicopter-ak47-landmine.md) · [Review index](README.md#review-records)

This record covers three additions to parent commit `c57baf2`: helicopter (68), AK-47 (69) and landmine (70). Separate scene authors prepared the models, artwork, bilingual articles and scripts; the integration owner coordinates shared registration, recordings and acceptance. The evidence below distinguishes author checks, independent review, browser observations and recording analysis.

## Scope and scientific limits

- **Helicopter:** a generic civil helicopter near hover. Blade-element lift and uniform-inflow momentum theory share the thrust state. Collective pitch, a cyclic-pitch waveform, tilted thrust and opposing torque are teaching views; the scene is not a full flight-dynamics model or flight training.
- **AK-47:** a detailed exterior and connected large parts, with a dimensionless teaching calculation behind their movement and energy display. The calculation is not firearm dynamics, without weapon operation, manufacturing geometry, firing or locking mechanisms, ammunition or performance parameters.
- **Landmine:** a sealed exterior in a soil cutaway, with surface wear, changing cover and persistent-risk reasoning. Surface appearance and elapsed seasons never determine safety. No working trigger, construction, placement, sensitivity, damage-radius or clearance model is present.

## Evidence ledger

- Three independent scene owners authored the initial work. Cross-review subsequently identified and repaired missing causal objects in runtime fallbacks, ineffective landmine exploration controls, the distinction between accumulated input and dissipation in an AK-47 comparison, and phone camera collisions. Author checks are not counted as independent review.
- The AK-47 equation was independently solved using Duhamel convolution and Simpson quadrature, without calling the production RK4 integrator. Across 401 times, maximum position/velocity differences were 2.61e−13 / 5.52e−13. The energy residual was 2.49e−13. The controlled comparison now starts at 30% travel, after input ends in both states.
- The landmine review scanned 7,007 chapter states: object identity and unknown safety state persisted. Soil contact, ground occlusion and chapter boundaries were inspected separately. Seasonal cover is shared by the actual 3D and 2D renderers; elapsed time supplies no safety inference.
- Static synthesis produced six content-hashed recordings. Both languages share measured durations: helicopter **175.5 s**, AK-47 **170 s**, landmine **168.5 s**. All 42 independently transcribed chapters passed the language/content/end checks. This establishes transcription evidence, not a listening review.
- Compared with the parent revision, all **268 metadata entries** for the older 67 films and the SHA-256 hashes of all **134 existing MP3s** were unchanged.
- `pnpm scene:check`: **20 tests passed**. The first preview build and its audit passed: 143 canonical bilingual pages, linked assets, sitemap, 404 and preview indexing policy. The release check also passed: **1,035 tests across 125 files**, Astro with **0 errors / 0 warnings** (38 existing hints), production build and its asset/link/indexing audit. One initial geometry check exceeded its five-second budget under the full suite; aggregating extrema retained every sampled vertex while removing millions of assertion allocations.

## Reclassification

Every registered topic was reviewed against its main explanation. One canonical taxonomy in `src/data/discovery-metadata.ts` now drives the collection, breadcrumbs and related-topic labels; the unused `Topic.category` field was removed. Existing category IDs remain stable for shared URLs.

| Category                  | Topics |
| ------------------------- | -----: |
| Mechanisms & motion       |     14 |
| Electricity & magnetism   |     11 |
| Light & waves             |     13 |
| Heat & fluids             |      8 |
| Computing & communication |     13 |
| Earth & astronomy         |      3 |
| Math & systems            |      4 |
| Weapons & safety          |      4 |

Heat/fluid subjects no longer share a catch-all category with astronomy. Weapon subjects have a dedicated context. Laser printing moved to electricity because electrostatic image formation is its main causal explanation. GPS remains with mathematical constraints and estimation; NFC remains with induction and load modulation. Related links and bilingual search preserve cross-disciplinary access. Both source catalogs contain exactly 70 entries and match the taxonomy and measured durations. The three dense physical covers now load as build-generated 800×460 PNGs, derived from the same cover geometry and totaling about 121 kB. Chinese `/zh/` collection HTML fell from 2,242,990 to 1,307,844 bytes; social images retain their original geometry.

## Browser evidence

Review environment: Chrome **152.0.7977.84** on macOS, using actual rendered pages and explicit 320 / 390 px viewport overrides as well as the normal desktop viewport. Early isolated artwork review was used to repair glass/skin intersections, rigid-looking materials, soil contact and unwanted shadow planes. The repaired blade-section locator, connected AK-47 comparison assemblies, landmine soil contact and local shadow were inspected on actual pages. All three final catalog PNGs and generated social images were also inspected.

All six films reached their measured endpoints at playback rate 1 in the browser, with sampled screenshots and audio/film clocks recorded separately. Helicopter ended at 175.5 s, AK-47 at 170 s and landmine at 168.5 s. The shared director pauses the latter films at their exact endpoint before the media element necessarily emits `ended`; this is not treated as a missing ending. Pause, seek, replay and AK-47 comparison exploration at its 30% / 90% limits were exercised.

Seven chapter stops per language and scene were measured after the final mobile repairs (42 stops total). English used 320×852; Chinese used 390×852. No horizontal overflow was observed and visible paragraph text remained at least 16 px. The common primary transport controls measured 44×44 px. Complete-player maximum heights were:

| Scene      | English, 320 px | Chinese, 390 px |
| ---------- | --------------: | --------------: |
| Helicopter |        806.8 px |        769.1 px |
| AK-47      |        802.2 px |        694.1 px |
| Landmine   |        817.4 px |        764.2 px |

These measurements cover the directed film with disclosures closed. Optional exploration and reading panels can extend the page. Final phone repairs moved the helicopter section below its locator and reduced unused model-stage space in the AK-47 comparison and the ≤360 px landmine view.

Local test servers injected failures without changing production code. A renderer-construction failure after the startup gate produced usable 2D views in all three scenes; the blade-section forces, connected assemblies with opposite direction arrows, and landmine soil/cover state remained present. An audio 503 on landmine displayed an explicit retry message while silent progress continued; restoring the resource and using the sound control resumed synchronized audio at ready state 4. Offscreen playback stopped at 15.858 s and stayed there on a later observation; scrolling back resumed it. A real browser autoplay rejection was separately recovered with the visible listen button. A reduced-motion media-query fixture started helicopter paused, and its play control worked. A startup WebGL rejection fixture displayed the compatibility notice and readable article/transcript disclosures; it did not run the experiment.

The Chinese heat/fluid deep link selected and revealed its category in the narrow horizontal strip. Combined weapons/safety, ages 12–13 and under-three-minute filters returned AK-47 and landmine; adding the Chinese Kalashnikov alias returned AK-47. The language link retained the filter query. Independent source review checked all 70 entries, bilingual catalogs and static topic links. One detached browser tab interrupted the last language-link check. A fresh tab then verified the English combined filters and the return to Chinese with the same query and result. The selected category was visible on a fresh 320 px English entry; a resize listener also preserves that visibility after a viewport change.

## Remaining conditions

Native bilingual listening and physical-phone performance require their own observations. Transcription is not listening, viewport measurements are not physical-phone measurements, and a normal-speed run observed through sampled screenshots is not continuous visual observation.

This record ends before publication. The authorized main push triggers the existing Actions deployment; its outcome and live-site check belong to the final delivery report.
