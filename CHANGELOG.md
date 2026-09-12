# Changelog

[简体中文](docs/zh-CN/changelog.md)

Notable changes are recorded here. Commit history remains the source for individual fixes. The package version is not a promise of a published release; no tagged stable release is documented yet.

## Continuous production updates — September 2026

These changes are published through the `main` deployment workflow without a tagged package release. Historical measurements below apply to their individual revisions.

- Refined the keyboard-switch model with molded thin shells and latch windows, a dished keycap and connected socket, stamped contact sheets, and variant-specific spring profiles. Corrected concave-face triangulation, hard-edge normals and scene shadow coverage; added five mesh-helper regressions while preserving the scientific model, film timing and recordings. See the [dated refinement record](docs/qa-keyboard-switch.md).
- Added keyboard switches as scene 71: a 3:33 bilingual cutaway film comparing six representative contact switches, Hall sensing with Rapid Trigger, and a through-light optical switch. Connected spring, cam, leaf, jacket and sensing geometry share a deterministic model; force fits and reset examples are explicitly identified. See the [review record](docs/qa-keyboard-switch.md).
- Added three physical 3D explanations: helicopter (68, 175.5 s), AK-47 (69, 170 s) and landmine (70, 168.5 s), with authored close-ups, shared model/cover geometry, bilingual recordings and runtime 2D alternatives. See the [batch review](docs/qa-helicopter-ak47-landmine.md) for evidence and remaining review conditions.
- Reclassified all 70 topics into eight bilingual categories. Heat and fluids and weapon subjects now have dedicated groups; laser printing follows its electrostatic explanation. Removed the redundant topic category field, synchronized both source catalogs and kept a selected mobile category visible after deep-link restoration.
- Added the atomic bomb as scene 66: a 4:03 bilingual film from a single neutron capture through binding energy, generation growth, leakage from a small sphere, the critical radius, the reactor/bomb comparison and expansion-driven shutdown, with a deterministic neutron random walk, radius/expansion exploration and no weapon-engineering content.
- Added the hydrogen bomb as scene 67: a 3:30 bilingual film from Coulomb repulsion through binding energy, the Maxwell tail and Gamow peak, Bosch–Hale reactivity, fission-driven heating and compression, lithium-deuteride tritium breeding and three confinement routes, with temperature/compression exploration and no device structure.
- Added NFC as scene 65: a 2:48 bilingual film following a battery-free tag through induction, rectification, reader signaling and load-modulated replies, with independently decoded example bits and distance/tilt exploration.
- Added double-slit interference as scene 64: a 2:48 bilingual film connecting optical paths, phasor addition, finite-aperture fringes and reproducible individual detections.
- Rebuilt the excavator (scene 63) from scratch: a 20-tonne-class machine with a gooseneck boom and H-link bucket, the near boom cylinder sectioned in place with visible oil, projected callouts, a live circuit panel (tank, pump, relief valve, spool section and joystick) beside the machine, a Pascal comparison of pump and boom pistons, a pressure gauge with the 37.3 MPa relief band, a 4:05 bilingual film and static-load, joystick, lever-arm and blocked-lift exploration.
- Expanded the collection from 12 to 62 bilingual explanations; [the expansion record](docs/expansion-50.md) separates publication from the remaining visual, listening and physical-device review.
- Rebuilt the bicycle and laser-printer covers from their mechanism geometry for both the catalog and social cards.

- Cut the homepage from 3.2 MB to under 0.8 MB by encoding raster covers as PNG, thinning oversampled cover geometry and rounding served coordinates.
- Stopped shipping the English dictionary to Chinese pages; the experiment chunk shrank from 572 KB to 165 KB.
- Added a GitHub link to the site header.
- When autoplay is refused, the film now shows a prominent on-stage offer to start narration instead of a quiet status line.
- Added a browser support gate: unsupported browsers get one notice naming the missing features instead of a degraded page. The baseline is Chrome 108, Edge 108, Firefox 121 and Safari 15.4; `color-mix()`, container queries and `toReversed` were replaced so the iPhone 6s/7 generation stays in.
- Moved narration recordings to Git LFS across the whole history, shrinking the repository from 429 MB to about 40 MB; CI caches the LFS objects.
- Replaced README screenshots with original model-driven motion artwork and a still alternative.
- Enabled narration by default, with a persistent manual preference and graceful autoplay fallback.
- Expanded the scene skill with a requirement coverage map, homepage and showcase workflows, and the current audio policy.
- Replaced the oversized brand block with an automatic typographic opening that settles into the navigation wordmark.

- Rebuilt the original twelve explanations as chaptered 2–5 minute films, with new close observations and controlled comparisons.
- Replaced unintelligible Chinese recordings and regenerated both languages with measured speech windows and no time stretching.
- Added seeking, chapter links, deterministic simulation replay and expanded Transformer internals.
- Added multi-factor default-language negotiation with explicit manual preference storage.
- Generated structured data, transcripts, social PNGs and reciprocal multilingual sitemap links from content.
- Promoted the name animation into homepage typography and rebuilt English-default bilingual documentation.

## Production foundation — 2026-09-05

- Published the complete bilingual site to `vistep.ai` and `www.vistep.ai`; retained the old brand page as a rollback version and submitted the production sitemap to Search Console.
- Verified the `vistep.ai` Search Console domain property through a Cloudflare DNS TXT record.
- Added a scene production guide, evidence-based retrospective, repository skill and unpublished draft generator.
- Added catalog consistency and static build audits; topic counts now follow the catalog.
- Separated preview output and indexing policy from production assets.
- Added bilingual README files, contribution and security policies, MIT license, asset notices, issue/PR templates and continuous integration.

## Preview milestones — 2026-09-05

- Independent visual treatments for twelve topics, procedural 3D mechanisms and numerical models.
- Softer typography, surfaces, controls and camera transitions.
- Automatic guided demonstrations, continuous chain/belt paths and model-derived gear geometry.
- Chinese and English routes, independent spoken scripts, 24 recordings and synchronized playback.

These milestones describe preview builds. See [deployment records](docs/deployment.md) for actual Worker versions and the production boundary.
