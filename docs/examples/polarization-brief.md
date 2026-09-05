# Production brief: polarization

[简体中文](../zh-CN/examples/polarization-brief.md) · [Production guide](../creating-a-scene.md)

**Question:** How can adding an absorbing polarizer between two crossed polarizers make the output brighter?

**Track:** The electric field along one continuous optical axis. Travel stays forward while the transverse field is projected onto each transmission axis. The surprise is a brighter final output despite a decrease at every individual filter.

## Direction and composition

An original SVG spatial light installation uses projected circular filter planes, a continuous field trace, an end-on projection view, and a screen at the end of the same optical axis. A restrained navy environment separates the cyan first filter, violet middle filter, and amber final filter. There are no decorative rays, floating optical parts, external image assets, or artificial photon trajectories.

Desktop uses a horizontal optical train and a lower end-on view. Below 620 drawing pixels, the model composes a vertical train with an oblique transverse plane; changing the projection keeps the final electric field distinguishable from the propagation arrow. Labels are positioned directly in the measured SVG coordinate system at 16 CSS pixels. Below 760 viewport pixels, graph chapters use a full-width curve; other chapters retain the compact end-on view beside the formula. This is a new coordinate arrangement, not a scaled desktop diagram.

## Film: eight distinct causal observations

The packet plans **176 seconds: eight 22-second chapters**. The parent measures both authored voices and owns the final shared timeline. The director uses chapter progress, so measured timing changes do not invalidate angle choreography.

| Chapter                    | Visible event and observation                                                                                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 · Travel and oscillation | A linearly polarized field travels on one axis. A marked transverse field and the end-on view separate travel from oscillation.                                                                 |
| 2 · No preferred direction | Replace the source with an illustrative unpolarized signal. The changing field and statistical rose distinguish a distribution of directions from a fixed linear axis or circular polarization. |
| 3 · The first filter       | Add A, rotate its axis 0° → 90° → 0°, and hold the output at 50%. The downstream field turns while mean transmission stays fixed.                                                               |
| 4 · Project, then square   | Add aligned B, then turn it to 60°. The end-on vector shortens; the Malus curve and output distinguish amplitude from intensity.                                                                |
| 5 · Crossed axes           | Turn B from 60° to 90°. Its projection and downstream field vanish; the light before B remains.                                                                                                 |
| 6 · Change the middle      | Establish M parallel to A, then turn it to 45° with the outer axes unchanged. The output grows to 12.5%; A/M/B show 50%/25%/12.5%.                                                              |
| 7 · Account for energy     | Keep the three-filter configuration. Highlight absorption at A, then M, then B, then the transmitted remainder; the four fractions partition one input.                                         |
| 8 · Find the maximum       | Sweep M from 45° to 0°, through 90°, and back to 45°. The curve `⅛ sin²(2β)` connects the two dark endpoints to the maximum.                                                                    |

The shared player provides the current short silent caption, pause, replay, chapters, seeking, narration, and exploration. Exploration adds a keyboard- and pointer-operated angle dial, independently selectable A/M/B, inclusion switches for M/B, two useful presets, and a switch between unpolarized and 0° linearly polarized input. Every change recomputes the field and energy account.

## Independent science model

`src/models/polarization.ts` uses `x` for propagation and `y,z` for transverse electric-field components. The source coherency matrix is `C = I₀/2 · identity` for unpolarized input or `I₀ uuᵀ` for linear input. An ideal polarizer has `P = uuᵀ`; the next matrix is `P C P`, and its trace is the transmitted intensity. The intensity removed at each stage is recorded as absorption. Non-finite inputs, negative intensity, and incorrectly ordered filters are rejected.

The illustrative unpolarized field uses harmonics 3 and 5 in one transverse component, and 4 and 7 in the other. Over one fundamental period they have equal variance and zero cross-correlation. Each drawn downstream field is the same signal projected through the actual preceding filters. Tests integrate mean squares independently and compare them with the matrix model. This signal is a deterministic teaching representation, not a random microscopic source or a photon account.

The projection view uses RMS amplitudes; it preserves the sign of a projected linear field. Screen brightness has a square-root display mapping. Numeric readings and energy bars are linear intensity fractions. Filters are ideal, fully covering, normally incident, and absorbing. Magnetic-field geometry, material microstructure, surface reflection, scattering, diffraction, leakage, and extra real-world losses are omitted and disclosed in both articles. Chapter setup changes do not simulate partial aperture coverage while inserting a sheet.

Primary technical references, inspected 2026-09-05:

- [The Feynman Lectures I, 33–4: Polarizers](https://www.feynmanlectures.caltech.edu/I_33.html): field projection, squared intensity, absorption, and the three-polarizer paradox.
- [OpenStax University Physics III, 1.7: Polarization](https://openstax.org/books/university-physics-volume-3/pages/1-7-polarization): transverse polarization, unpolarized averaging, ideal filtering, and Malus’s law.

The original 400×230 cover derives its three axes, field traces, and 50%/25%/12.5% readings from the model. It accepts an optional `color` prop and contains its own complete SVG. No third-party artwork was copied and no new public assets are required.

## Integration contract

The handoff used a temporary integration packet. It contains only `topic`, `component`, `cover`, `translations`, and `narration`. Topic number is deliberately omitted for parent assignment. Paths are repository-relative. All UI, metadata, chapter titles, and captions have English translations. Existing shared translations are preserved, including `3 分钟` → `3 minutes`.

The component is `Polarization.tsx`; it imports the topic-specific `PolarizationOptics.tsx` renderer and stylesheet. Both MDX articles include `understand`, `try`, and `deeper` anchors. The parent owns shared registration, localization integration, audio generation, production/preview builds, and release.

No independent animation loop or audio element exists in this scene. The shared `useShowcase()` clock drives every field sample and chapter parameter. Paused seeking renders its new state synchronously; exploration uses a fixed field sample. A single `ResizeObserver` is disconnected on unmount. SVG avoids WebGL, Worker, texture, and GPU-disposal dependencies.

## Evidence and limits

- **Model:** `pnpm exec vitest run src/models/polarization.test.ts` passes 11 tests. Coverage includes first-filter half transmission, already-linear input, Malus at arbitrary angles, crossed zero, the three-filter maximum, energy conservation for long stacks and scaled sources, signed projections, field statistics, rejected inputs, chapter continuity, 800 reversed seeks, and geometry bounds at widths 240–1200.
- **Types:** Targeted `tsc --noEmit` over the model, tests, main component, and renderer passes with strict project-compatible ES2023/bundler/React JSX settings.
- **Packet:** A TypeScript AST-based label audit verifies 39 emitted `t()` strings and all 62 packet translations against the existing dictionary. Placeholder parity, zero existing-label conflicts, path keys, and all eight planned chapter windows pass.
- **Isolated rendering:** A temporary in-memory esbuild harness loads only this scene inside `FilmContext`, with the real bundled Manrope and Noto Sans SC fonts and a temporary packet dictionary. A separate headless Chrome 152.0.7977.76 user directory keeps the parent's browser untouched. At 1200, 390, and 320 viewport pixels, both languages and all eight chapters were checked for horizontal overflow, SVG label bounds, minimum rendered font size, and runtime exceptions: 48 combinations passed again on the final code. Selected desktop and narrow stills were actually inspected; review prompted a phone projection correction and shorter travel arrow.
- **Controls:** CDP keyboard input changed M from 45° to 46°; Home set 0° with 0.0% output. CDP pointer input set 45° with 12.5% output. This establishes browser input behavior, not physical-phone ergonomics. The isolated Chrome instance and temporary servers were closed after review.
- **Not established here:** A continuous human viewing of the complete 176-second film, final route/global-player behavior, actual narration or listening, measured voice timing, physical-phone performance, touch ergonomics on hardware, and final production/preview builds. Frame sampling and model tests do not stand in for these reviews. The parent completes integration and these remaining checks.

The assigned workspace resolved to the shared repository; only topic-specific new files were written. No registry, shared manifest, global stylesheet, branch, deployment output, or expansion ledger was changed.

After parent integration preflight began, no narration text, caption, chapter count, or director timing was changed. Remaining edits corrected drawing projection, chart labeling, and documentation.

## Parent integration — 2026-09-05

The packet has been consumed into `src/data/topics.ts`, `src/data/experiments.ts`, `src/i18n/en.json` and `src/data/narration.json`. It is not retained as a duplicate source. Recorded Chinese and English tracks both measure **177.5 seconds**, with eight shared chapter windows. The earlier 176-second table is the pre-recording storyboard, not the final transport timeline. Actual windows are in `src/data/film-timeline.json`.

All 16 chapter/language pairs passed independent ASR, minimum similarity 0.8994. Assets: `polarization-zh-e9cfe95cdce3.mp3` and `polarization-en-03f090bd5756.mp3`. ASR does not establish vocal naturalness or listening. The six-topic parent model run passed 58 tests; route/phone refinements and final shared checks are recorded in the expansion log. Full continuous viewing and physical-phone evidence remain outstanding.
