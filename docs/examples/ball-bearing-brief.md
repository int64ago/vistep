# Ball bearing — follow the loaded contact

[简体中文](../zh-CN/examples/ball-bearing-brief.md)

Current recording revision (2026-09-06): both tracks run **179.5 seconds**. See [the refinement record](../qa-expansion-refinements.md) for the updated windows and review limits. Earlier recording names, timings and review results below describe the preceding version.

## Causal argument and visual direction

The initial intuition is that the ball simply goes around with the shaft. Follow one gold ball with a dark surface mark and discover that two simultaneous no-slip conditions determine both its orbit and its backward spin. The cage follows the ball centers. A fixed load zone then separates the motion of the balls from the direction of the external load. The final macro inspection explains why ideal rolling is not a zero-loss claim.

The object is an open, single-row radial bearing on a short shaft and a bolted housing pedestal. Cool machined steel, warm cage fingers and a restrained dark inspection background provide depth without floating components. A front inspection sector fades away while the full rear raceway remains. The grooves are circular arcs, the balls are spheres and the crown cage has concave spherical fingers joined to a continuous rear backbone. No remote textures, fonts or generated images are required by this scene.

The wide layout places the bearing beside a changing inspection detail. On narrow screens the model and detail occupy separate rows; each SVG has its own compact coordinate system, with full-size HTML labels and controls. The sliding comparison is stacked rather than reducing two diagrams into tiny columns; on phones its two contact views take the stage in place of the redundant overall bearing. Exploration uses an absolute angle slider, so there is no separate clock that can drift from the player.

## Film: 176 seconds before measured voice integration

Eight chapter windows are 22 seconds each. Cues request 21.5 seconds beginning 0.45 seconds into each window. The parent owns measured bilingual synthesis and the resulting shared timeline. Camera pose, cutaway amount, cage emphasis, ball positions and detail state use chapter and progress, so changed audio durations retain the same argument.

| Window    | Visible event                                                                                | Observation                                                                     |
| --------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 0–22 s    | Shaft and housing remain connected; a front sector fades away; axial groove section appears. | Load has a path through the two races and the ball.                             |
| 22–44 s   | Follow the marked ball; inspect the two circular race contacts and surface-speed arrows.     | Translation cancels spin outside and adds to spin inside.                       |
| 44–66 s   | Crown cage becomes prominent; world-frame ball marks rotate opposite the cage.               | Cage orbit and ball spin are different, constrained motions.                    |
| 66–88 s   | Compare the same center speed with ideal spin and artificially prevented spin.               | Suppressing spin creates a speed mismatch at both interfaces.                   |
| 88–110 s  | The marked ball passes through a fixed downward load zone.                                   | Balls take turns in the loaded region; the zone does not orbit.                 |
| 110–132 s | A qualitative contact patch opens from a small mark to a finite region.                      | Loaded contact differs from a rigid geometric point.                            |
| 132–154 s | Contact, microslip, lubricant and optional seal illustrations are selected in sequence.      | Several mechanisms can contribute losses; none receives an invented percentage. |
| 154–176 s | Return to the bearing and restore the front material.                                        | Coordinated contacts support a rotating shaft.                                  |

## Model and limitations

Let pitch radius be `R = 1.75`, ball radius `a = 0.34` and inner contact radius `ri = R − a`. All lengths are illustration units. With a fixed outer ring and zero contact angle, `ωc R + ωb a = 0` and `ωc R − ωb a = ωi ri`. Therefore `ωc/ωi = ri/(2R)` and `ωb/ωi = −ri/(2a)`. World-frame spin is used by the renderer. Cage-relative spin is `ωb − ωc`, and the content explicitly distinguishes the reference frames.

Ten equally spaced balls share one cage phase. The axial groove radius is 0.36, greater than the ball radius; both race sections are tangent at the radial contact. Cage fingers have 0.025 clearance to the balls, are cut away from the radial race-contact directions, and remain clear of the grooved shoulders. The bearing OD and bore match the housing and shaft seats. Rendering depth bias resolves coplanar fit surfaces without moving those seats.

The overall geometry assumes rigid balls, zero radial clearance, zero contact angle and ideal no-slip motion. It is not an SKF product CAD model. The crown cage is a simplified ball-guided structure. The main assembly is unsealed; the optional seal appears only in its explanatory section. Load brightness uses `max(0, cos θ)^(3/2)` with a fixed imposed direction. This is expressly an assumed weight, not a Hertz/contact-clearance equilibrium solution. The macro contact patch and lubricant film are exaggerated qualitative drawings and do not change the rigid global geometry. There are no friction coefficients, efficiency percentages, newton readouts, temperature, fatigue or rating predictions. Pure elastic deformation is not equated with dissipation.

## Primary sources and provenance

Researched 2026-09-05. All artwork and geometry are authored for this scene; no manufacturer images or CAD assets are copied.

- [SKF rolling bearings catalogue](https://www.skf.com/binaries/pub12/Images/0901d196802809de-Rolling-bearings---17000_1-EN_tcm_12-121486.pdf): bearing components, mounting context and categories of bearing friction.
- [SKF, Wear and surface fatigue in rolling bearings](https://evolution.skf.com/wear-and-surface-fatigue-in-rolling-bearings/): nominal radial rolling can still include local slip through contact geometry and deformation.
- [SKF, Using a friction model as an engineering tool](https://evolution.skf.com/en/using-a-friction-model-as-an-engineering-tool-3/): friction depends on operating conditions; rolling, sliding, seals and drag are not one universal coefficient.
- [SKF, Grease lubrication mechanisms in rolling bearing systems](https://evolution.skf.com/grease-lubrication-mechanisms-in-rolling-bearing-systems/): film replenishment, shear and churning, with no implication that more lubricant always improves operation.
- [Schaeffler technical pocket guide](https://www.schaeffler.com/remotemedien/media/_shared_media/08_media_library/01_publications/schaeffler_2/catalogue_1/downloads_6/stt_de_en.pdf): cage separation and guidance functions.

The motion equations are an explicit independent derivation from the two no-slip constraints. The qualitative source claims are kept separate from that ideal calculation.

## Integration and review evidence

The handoff used a temporary integration packet. It contains topic metadata without a number, the component and cover paths, all topic labels and metadata translations, and eight separately authored Chinese/English spoken cues. Shared translations are preserved. The cover accepts optional `color` and is a complete 400 × 230 SVG.

- `pnpm exec vitest run src/models/ball-bearing.test.ts`: 9 tests passed under Vitest 5.0.0 / Node 24.19.0. Tests cover both no-slip velocities, reversed and zero input, world/cage-relative spin, circular tangencies through 301 phases, axial groove clearance, spherical pocket clearance, cage phase, material-point velocity, deterministic chapter seeks, load assumptions and nonfinite rejection.
- TypeScript `createProgram` with repository strict options over the six topic TS/TSX entry files: zero diagnostics. It emits no files.
- Isolated Vite 8.2.2 development harness at port 4389, in an agent-created hidden tab: desktop opening, contact and cage stills inspected. The first review found coplanar race/housing striping, corrected with depth bias and checked again. Independent 390 px and 320 px iframe viewports exposed a shared-style specificity issue collapsing the canvas; topic-scoped selectors corrected it. The 320 px bearing fits, and the stacked sliding diagrams have 16.36 px effective SVG labels with scene scroll width equal to 320 px. This is a layout check, not a physical-phone measurement. The harness does not edit shared registrations.
- All 13 assigned files were formatted with an explicit Prettier file list. Packet validation passed: exact keys, no assigned number, eight bounded cue windows, no missing UI/metadata translations and no shared-dictionary conflicts. Astro compiler reported no cover diagnostics. Both MDX files compiled through the installed Astro 8 Satteri renderer. The parent owns repository-wide checks and production/preview artifacts.

Not claimed: full uninterrupted playback review, synthesized voice listening, physical-phone performance, final integrated route/404 behavior or integrated narration/autoplay failure review. The shared `Studio` supplies offscreen/background throttling, WebGL loss fallback, reduced-motion handling and geometry/material/renderer disposal; the topic uses the shared Showcase chapter clock and has no independent animation timers. The parent must review the final integrated player, both recorded tracks and responsive layouts before release.

## Parent integration — 2026-09-05

The packet has been consumed into `src/data/topics.ts`, `src/data/experiments.ts`, `src/i18n/en.json` and `src/data/narration.json`. It is not retained as a duplicate source. Recorded Chinese and English tracks both measure **179.5 seconds**, with eight shared chapter windows. The earlier 176-second table is the pre-recording storyboard, not the final transport timeline. Actual windows are in `src/data/film-timeline.json`.

All 16 chapter/language pairs passed independent ASR, minimum similarity 0.9158. Assets: `ball-bearing-zh-cd4587ea6dbb.mp3` and `ball-bearing-en-e367517442df.mp3`. ASR does not establish vocal naturalness or listening. The six-topic parent model run passed 58 tests; route/phone refinements and final shared checks are recorded in the expansion log. Full continuous viewing and physical-phone evidence remain outstanding.
