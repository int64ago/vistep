# Fifty additional explorations

[简体中文](zh-CN/expansion-50.md) · [Production guide](creating-a-scene.md)

The active objective is **50 additional complete scenes**, taking the 12 scenes in `5b1dca1` to 62. [The ledger](expansion-50.json) reserves exactly 50 distinct subjects. Production continues on `codex/expand-50`; the main site has not received this expansion. A route or passing test is not a completed scene.

## Current implementation

| Scene                       | Direction                                                                                               | Recorded narration                | Status                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------- |
| Camera lenses               | 3D optical bench and adaptive ray view; focus, inversion, refocusing and virtual images share one model | Chinese and English, 160.5 s each | In production; desktop and 320 px key frames inspected                                 |
| Aperture and depth of field | Original layered garden; pupil, exposure, blur, focus, depth band and diffraction inset                 | Chinese and English, 168.0 s each | In production; desktop and English 390/320 px entries inspected                        |
| Four-stroke engine          | Connected 3D cutaway, combustion-chamber views and pressure–volume loop                                 | Chinese and English, 169.5 s each | In production; desktop, English 390/320 px, keyboard dead center and 2D mode inspected |
| Planetary gearing           | Internal involute ring, absolute gear phase and four lock configurations                                | Not produced                      | Scientific model only; [production brief](examples/planetary-brief.md), no route       |

The three integrated scenes have bilingual articles, sources, unique covers, lazy imports, transcripts, social images and sitemap entries. The other 47 subjects remain unregistered: one has a scientific model and 46 are planned. **No new scene is marked fully accepted.**

## Review evidence — 2026-09-05

- `pnpm scene:check`, `pnpm verify` and `pnpm build:preview` passed. The suite has 63 tests in 12 files; type checking covered 105 files without errors, warnings or hints. Static audits checked 33 canonical bilingual pages, assets, sitemap, 404 and the respective indexing policies. The build contains **15 topics**, not 62.
- Optics tests cover ray convergence, virtual/infinite images, depth boundaries, aperture/irradiance/blur relationships and direct chapter reconstruction.
- Engine tests check both rod joints, four strokes, pressure–volume work against heat-based net work, invalid inputs and reconstruction across ignition. Planetary tests check assembly and velocity constraints, then sample every rendered planet-outline vertex against its sun and ring neighbors in four lock configurations. These samples are not manufacturing certification.
- Independent ASR checked all 48 new chapter/language pairs without a reference transcript or language hint. All passed the existing criteria. Minimum similarity: lens 0.942, aperture 0.8696, engine 0.9125. Number formatting and technical homophones still require listening judgment.
- A final script-to-frame review removed outdated positional wording and corrected the engine opening’s movement order. Only affected synthesis inputs were regenerated; the three tracks were re-audited after assembly. Aperture now measures 168.0 s in both languages.
- The first optics ASR attempt received HTTP 401. Refreshing the existing Wrangler login resolved it; scoped retries removed stale outputs and checked returned topic names.
- Browser review corrected a growing lens layout, disconnected object support, screen/ray offsets, faint rays and narrow-screen labels. Manual travel stays on the physical rail. Extreme defocus and virtual images use the adaptive ray view; hit markers only appear on the screen surface.
- Aperture review moved defocus and diffraction enlargements into the main viewfinder, where the current explanation stays visible on a phone. Distance labels alternate rows, unit values stay together, and focus brackets fit the mobile crop. Keyboard extremes reached f/22 at 6 m: 0.8% relative light and 2.33–∞ m acceptable sharpness.
- Engine review added spring seats, separated material finishes, and corrected graph units and a 2D-button/label overlap. In the English mobile UI, keyboard navigation reached 360°: 50 cm³, 7.70 MPa, 0 N·m. End reached 720°; reset returned to intake. Selecting 2D removed the WebGL canvas, and the document had no horizontal overflow at 320 px.
- Deployment snapshots under ignored `artifacts/` are now excluded from TypeScript, keeping compiled vendor bundles out of source diagnostics.

The current runtime does not accept audio input. **No complete listening review or claim about vocal naturalness is recorded.** ASR and browser media behavior are separate evidence. Complete continuous visual viewing, all chapter boundaries, broader accessibility/failure cases, listening and physical-phone performance remain outstanding. A viewport override is not a physical-phone test.

## Preview and next work

The first optics preview used an immutable asset snapshot: version `f39215c2-84aa-4f43-b33e-fd6182b30f79`. An earlier upload was interrupted after detecting that its source directory was being rebuilt; it was not counted as a successful release. Production still has the original 12 scenes.

Continue visual review and the remaining subjects. Before final main publication, accept all 50 additions, verify the full 62-topic collection and recordings, update bilingual catalog documentation, and record preview/production evidence through the existing deployment workflow. Main publication remains outstanding.
