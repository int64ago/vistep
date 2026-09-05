# Electrical transformer: a changing field between separate circuits

[简体中文](../zh-CN/examples/transformer-electric-brief.md)

Shared integration now lives in the central registry and narration source. Slug: `transformer-electric`; component: `ElectricTransformer`. This is an electrical transformer, separate from the existing language-model Transformer topic.

The opening intuition is that a voltage must arrive through a connecting wire. Follow the two continuous copper conductors, then the shared core flux. The turning point is a held flux crest: a strong magnetic field produces zero instantaneous induced voltage when its slope is zero. The reader should leave with a causal chain from changing flux to induced voltage, turns ratio, load response and power accounting.

## Composition and silent direction

An exposed laminated steel core, cream insulating bobbins, continuous copper helices, matching terminal dots and two separately connected circuits form the object. The primary and secondary have opposite winding handedness because flux travels in opposite directions in the two limbs. Source and load are connected to the actual helix endpoints. Each rendered turn is one model turn; no representative-turn multiplier is hidden in the numbers.

Desktop places the object and its terminal readings beside aligned flux and voltage traces when scene width reaches 760 px. At intermediate widths, the plots move below. Below 600 px, the source and load physically move below the core, with reconstructed lead routes, a more frontal camera and a taller view volume. This is a separate apparatus composition. Plot labels are HTML at 16 px or larger, outside the SVG coordinate system. Phone plots shorten their graphical lanes without shrinking text. Controls are at least 44 px and appear only in exploration.

The 3D arrows indicate instantaneous field or current direction and magnitude; there are no particles falsely carrying flux around the iron. Closed-path geometry is shared with the 2D fallback. Amber and gray-green loss accents identify locations; they are not computed temperature. The fallback keeps the conductor paths, core loop, polarity dots, switch and paired traces usable without WebGL.

| Planned window | Visible change and causal observation                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–22 s         | Follow the two disconnected electrical circuits; alternating excitation reverses the closed-core field while the open secondary has voltage but no load current.     |
| 22–44 s        | Advance one cycle with holds at the flux crest and zero crossing. The shared cursor directly aligns flux slope with voltage.                                         |
| 44–66 s        | Replace 12 turns with 24 and 48. Deterministic brief fades soften the coil replacement; voltage scales while flux does not. These are steady-state comparisons.      |
| 66–88 s        | Close the secondary load after a quarter of the chapter. Secondary current appears; primary current increases with unchanged lossless core flux.                     |
| 88–110 s       | Compare 2 V into 12 Ω with 8 V into 192 Ω at the same ideal 1/3 W. Excitation and losses are explicitly omitted in this comparison.                                  |
| 110–132 s      | Replace AC with a separate current-limited DC switch-on calculation. Flux rises towards a plateau while secondary voltage decays. Physical time spans −τ through 8τ. |
| 132–154 s      | Return to AC with copper and core loss. Inspect the closed laminated stack, then close the load. The power ribbon separates load, copper and core watts.             |
| 154–176 s      | At fixed voltage and turns, raise frequency from 50 to 100 Hz. Physical cycle time and flux swing halve; secondary voltage remains unchanged.                        |

Film state depends only on `useShowcase().chapter` and `chapterProgress`. No local animation clock advances circuit state. A seek directly reconstructs the AC phasors or analytic DC transient, trace cursor, winding count, switch, opacity and directed pose. Exploration is hand-scrubbed, so it remains still until the user changes a real input. Shared Showcase/Studio infrastructure owns reduced-motion behavior, visibility/background handling, playback, narration and disposal. Geometry replaced during turns changes is disposed immediately.

## Independent electrical model

The model uses SI units and cosine-reference RMS phasors. Positive flux goes up the primary limb. Both top terminals are dotted; voltages run from dotted to undotted terminal, primary current enters its dot and secondary load current leaves its dot. Loop EMF is `−N dΦ/dt`; the ideal winding terminal voltage in these references is `+N dΦ/dt`.

The AC equivalent circuit has perfect coupling, primary series resistance, a primary-referred magnetizing branch, a core-loss resistor, and a secondary series resistor feeding an optional resistive load. It solves the complex core voltage rather than applying losses after an ideal voltage calculation. Finite magnetizing current and instantaneous field energy explain why instantaneous input and output power need not match even without losses. Cycle-average real power equals load power plus copper and core loss.

Teaching constants: 24 primary turns, 12/24/48 secondary turns, 4 V RMS, 40–100 Hz exploration, 8 × 10⁻⁴ m² core area, 0.5 H magnetizing inductance, 4–192 Ω load. Loss mode uses 0.6 Ω primary resistance, 0.0125 Ω per secondary turn and a 400 Ω core-loss equivalent resistance. The ideal power chapter takes infinite magnetizing inductance and zero loss. The chosen linear-model boundary is 1.4 T; offered controls stay below it. Fixed loss resistances are an illustrative equivalent circuit, not a material-frequency fit.

DC is a separate open-secondary RL circuit with a 4 V step and 128 Ω total series resistance, including an external current limiter. Its time constant is 3.90625 ms. Current is `V/R (1−exp(−t/τ))`; flux is `Li/N₁`; secondary voltage is `N₂ dΦ/dt`. It does not extrapolate the AC phasor model to zero frequency or imply that static flux continuously induces voltage.

Core proportions correspond to roughly 0.35 mm pitch across 84 laminations. Gaps are exaggerated for legibility. The model omits leakage flux, saturation, material hysteresis loops, nonlinear or frequency-dependent loss fitting, skin effect, parasitic capacitance, AC inrush and temperature. Separate-limb windings in a real device have leakage flux; perfect coupling is stated as an approximation.

## Primary sources and provenance

Consulted 2026-09-05:

- [MIT 8.02, mutual inductance and transformers](https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/1762da3d55d1798e584c08bddb29235c_summary_w09d3.pdf): shared flux and Faraday induction.
- [OpenStax University Physics, transformers](https://openstax.org/books/university-physics-volume-2/pages/15-6-transformers): ideal voltage/current relationships and resistive loading.
- [OpenStax University Physics, RL circuits](https://openstax.org/books/university-physics-volume-2/pages/14-4-rl-circuits): analytic current growth, time constant and field energy.
- [TDK, Inductors—Part 2](https://www.tdk.com/en/tech-mag/electronics_primer/2): current transients, saturation limits and laminated cores reducing eddy currents.
- [Texas Instruments, Power Transformer Design](https://www.ti.com/lit/ml/slup126/slup126.pdf): excitation, transfer, leakage and distinguishing winding/core loss mechanisms. This source discusses switching-power magnetics; no product-specific material coefficients are transferred into the 50 Hz example.

All geometry, plots, SVG cover and prose are original. No downloaded textures, model files, imagery or audio assets are included. Cover accepts optional `color` and is a complete, self-contained 400 × 230 SVG with no card framing.

## Worker verification and integration boundary

Environment: `/Users/int64ago/workspace/vistep`, Node 24.19.0, Vitest 5.0.0, 2026-09-05. Worker touched only the 12 assigned topic files; no branches, registration, shared localization, narration manifests, builds or deployment outputs were changed.

- `pnpm exec vitest run src/models/transformer-electric.test.ts`: **10 tests passed**. Independent checks cover textbook ratios, numerical differentiation of flux, signed terminal drops, instantaneous/cycle-average energy, opposing load MMF, DC decay, open-load loss, allowed extremes, continuous closed flux geometry, real winding clearance/turn pitch and reconstruction in reverse seek order.
- Targeted `tsc --noEmit`, with strict ESNext/Bundler/React JSX settings and the model plus three TSX entry files: passed without diagnostics. Imported shared code is checked as needed.
- Packet validation: **42 `t()` labels checked**, 65 dictionary entries, all metadata translations, eight 22-second cues and 176 planned seconds, exact top-level keys, no topic number, required paths and bilingual content anchors. No missing labels or shared-dictionary conflicts; `3 分钟` preserves `3 minutes`.
- Prettier is run only on these topic files, not the repository.

**Not established:** browser stills, complete playback, desktop/320/390 px clipping review, touch or keyboard execution, runtime WebGL-failure/reduced-motion/visibility tests, physical-phone performance, or listening to either voice. A standalone Vite preview attempt stopped before any browser opened because `vite` was not directly importable in this pnpm environment. This is not visual evidence. Parent explicitly owns registration, browser review, measured bilingual speech generation, central timeline updates and production/preview checks. No audio is generated in the worker packet; 176 seconds is the planned duration, not a measured recording duration.

Integration inputs are only the packet, topic files and this brief. Register its component/cover paths, merge translations without overriding existing values, assign the number and synthesize/measure both authored scripts. Review each change of turns, the two deliberate phase holds, the DC source before/after its step, losses with the load open/closed, 320/390 px layouts and the lossless equal-power comparison before release.

## Parent integration — 2026-09-05

The packet has been consumed into `src/data/topics.ts`, `src/data/experiments.ts`, `src/i18n/en.json` and `src/data/narration.json`. It is not retained as a duplicate source. Recorded Chinese and English tracks both measure **214.0 seconds**, with eight shared chapter windows. The earlier 176-second table is the pre-recording storyboard, not the final transport timeline. Actual windows are in `src/data/film-timeline.json`.

All 16 chapter/language pairs passed independent ASR, minimum similarity 0.7919. Assets: `transformer-electric-zh-32727b32426c.mp3` and `transformer-electric-en-a364c0514234.mp3`. ASR does not establish vocal naturalness or listening. The six-topic parent model run passed 58 tests; route/phone refinements and final shared checks are recorded in the expansion log. Full continuous viewing and physical-phone evidence remain outstanding.
