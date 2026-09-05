# Doppler — an emission field and an arrival ruler

[简体中文](../zh-CN/examples/doppler-brief.md)

## Question and visual direction

Why can a steady source produce a changing pitch? Follow an individual crest from its emission position to its meeting with a receiver. The core distinction is between the source's unchanged emission period, crest spacing in the air, and the interval between actual arrivals.

The composition is a pale acoustic field with blue ink wavefronts, a coral point source S and a teal receiver O. A compact two-row arrival ruler sits directly underneath. The upper row is the source clock; the lower row is solved reception time on exactly the same axis. A gold bracket measures forward or rearward wavelength. For the off-axis pass, a gold ray replaces that bracket and connects the receiver to the past emission position P; a faint dashed ray connects current positions. If P lies outside the field, a directional P marker makes that clipping explicit.

The main objects are diagrams of physical phase fronts, not a decorative vehicle or an unrelated 3D scene. Concentric fronts, changing centers, intersecting trajectories and pulse responses provide the motion. The picture remains explanatory without sound. No separate tone generator is included.

## Film and frozen narration

Eight planned 22-second chapters make a **176-second** film. Narration, captions, chapter count, cue IDs and director timing were frozen together at handoff. Parent integration owns recording and any measured expansion of chapter windows. The scripts are separately authored Chinese and English; they were not synthesized or listened to by this worker.

| Start | Shot                                 | Visible causal change                                                                                                                                           |
| ----- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 s   | A steady source beat                 | Fixed S and O; circles propagate across a 4.3 cT₀ gap. The two rulers have a visible phase delay but identical spacing.                                         |
| 22 s  | Centers stay behind                  | S moves at 0.45 c; dots retain earlier emission positions while each associated circle expands around its own dot.                                              |
| 44 s  | Closer crests ahead                  | S moves at 0.55 c toward a fixed collinear O. The bracket reads 0.45 cT₀ and arrivals occur at 2.22 f₀.                                                         |
| 66 s  | Longer waits behind                  | O is placed behind the same 0.55 c source. Rear spacing is 1.55 cT₀ and arrival frequency is about 0.65 f₀.                                                     |
| 88 s  | Walk into the crests                 | S stops; O moves toward it at 0.40 c. Equally spaced circles remain fixed around S, but reception rises to 1.40 f₀.                                             |
| 110 s | Move together                        | Both bodies move rightward at 0.35 c. The 0.65 cT₀ forward wavelength coexists with exactly 1.00 f₀ reception.                                                  |
| 132 s | Sound comes from an earlier position | S passes a receiver 1.5 cT₀ to the side. The true travel ray turns, the current-position ray differs, and successive arrival intervals change through the pass. |
| 154 s | Approaching the sonic boundary       | A separate 0.85 c run produces 0.15 cT₀ forward spacing and 6.67 f₀ reception. The visual stops within the subsonic domain.                                     |

Each chapter is an independent constant-velocity experiment. A short smooth start and end hold shape its model clock; all objects and both rulers use that clock. Chapter cuts reset the experiment, rather than claiming an unmodeled acceleration. The source has already been emitting before the selected time origin, so negative crest IDs denote earlier emissions. There is no repeating mini-loop stretched by narration.

## Independent model

Time is normalized by the constant source period T₀, distance by cT₀. The scene uses c = 1 and T₀ = 1 in these units, with no asserted audible test-tone frequency. Both velocity vectors refer to stationary air. Every crest has integer identity k, emission time kT₀, center S(kT₀) and radius c(t−kT₀). The renderer culls circles by exact intersection with its rectangular field without moving any centers or changing radii.

For an emission at tₑ, put r = O(tₑ)−S(tₑ) and let τ be travel time. The arrival condition is |r+vₒτ| = cτ. With A = c²−|vₒ|², B = r·vₒ and C = |r|², solve Aτ²−2Bτ−C = 0. The positive root is (B+√(B²+AC))/A; for negative B, the equivalent C/(√(B²+AC)−B) avoids cancellation. The actual contact is O(tₑ+τ).

Backtracing from reception time uses the corresponding equation with source velocity. This gives the past emission position and the real direction n of sound travel. Differentiating this retarded time gives the local frequency ratio (c−n·vₒ)/(c−n·vₛ). The UI deliberately reports the average T₀/Δt between the two discrete arrivals bracketing now. Its value updates at an arrival; it is not mislabeled as an instantaneous derivative. The corresponding fronts and lower-ruler ticks share identities and highlight colors.

Exact sonic and supersonic velocities are rejected for either body, with no clamping through the singular boundary. A coincident source/receiver event has zero delay but undefined ray direction; the model returns a null local frequency there. Exploration keeps a positive lateral distance. Close subsonic roots remain available through the exact arrival solver; the drawing rejects requests exceeding 2,048 fronts rather than allocating an unbounded array or silently dropping identities. The supported exploration endpoints stay below 460 candidate fronts before geometric culling.

Assumptions: uniform stationary air, straight constant-velocity trajectories, a point source, and a planar section of spherical constant-phase fronts. Pressure amplitude, loudness, air-particle displacement, reflections, absorption, wind and dispersion are not simulated. No supersonic Mach cone or light/relativistic Doppler effect is implied.

## Primary technical sources

Read during production on 2026-09-05:

- [OpenStax — The Doppler Effect, University Physics 17.7](https://openstax.org/books/university-physics-volume-1/pages/17-7-the-doppler-effect): separate moving-source and moving-receiver equations, unchanged sound speed in the medium, the collinear limit and the same-velocity example.
- [UNSW Physclips — The Doppler Effect](https://www.animations.physics.unsw.edu.au/jw/doppler.htm): university-authored experiments and explanations distinguishing source motion, observer motion, pitch and loudness.
- [OpenStax — Shock Waves, University Physics 17.8](https://openstax.org/books/university-physics-volume-1/pages/17-8-shock-waves): the separate regime reached at and beyond the sonic boundary.

The vector arrival solver and its retarded derivative are independently derived from the travel-distance equation above. The model tests compare them with textbook collinear formulas and a separate numerical root search.

## Phone composition, exploration and lifecycle

Desktop uses a 900×370 field and a 900×124 ruler. The phone field uses its own 320×306 coordinate system and a 320×133 ruler, with larger labels, relocated framing for the off-axis shot and fewer visible annotations. It shows one causal visual at a time: emission-center dots, the relevant wavelength bracket, moving receiver or retarded ray. The desktop speed/spacing footer is deferred on phones. There is no extra inset or chart stack. The explanation has a minimum reserved text height to reduce transport movement. The design targets a main phone watch stage below 900 px at a 320 px viewport; this is a design budget, **not a browser measurement**.

Body text is at least 16 px; primary controls have 44 px minimum targets. Four native ranges have explicit translated `aria-label` values supplied by the existing `Range` component, including its keyboard operation. Reset restores all four manual values: source velocity 0.55 c, receiver velocity zero, lateral distance 1.5 cT₀ and time 4 T₀. Both presets also set every value. A quarter-period button advances the exact model clock. Longer derivation and assumptions are in a disclosure.

`useShowcase` supplies chapter/progress, replay, seeking and the shared playback clock. There is no independent animation loop, accumulated history, audio context, WebGL context, Worker or downloaded asset. Pausing, offscreen/background suspension and reduced-motion behavior are delegated to that clock. The shared `useCompact` media-query subscription removes its listener on disposal. SVG is the native complete rendering path, so no WebGL fallback is needed.

## Owned files and integration

Only the following new topic files are part of this handoff:

- `src/models/doppler.ts`
- `src/models/doppler.test.ts`
- `src/components/experiments/Doppler.tsx`
- `src/components/lab/DopplerField.tsx`
- `src/styles/doppler.css`
- `src/components/covers/DopplerCover.astro`
- `src/content/doppler.mdx`
- `src/content/en/doppler.mdx`
- `docs/examples/doppler-brief.md`
- `docs/zh-CN/examples/doppler-brief.md`

The temporary packet has the exact five requested top-level keys, no topic number, repository-relative component/cover paths, 58 translations and eight bilingual cues. Existing translation wording is preserved, including `3 分钟` → `3 minutes`. Related slugs are registered topics: `noise`, `diffraction`, `pendulum`. The parent should consume and remove the packet after integration; it is not a second canonical narration source.

The cover is a self-contained 400×230 procedural SVG accepting optional `color`. It uses the same wave/arrival model. All artwork and geometry are original; there are no third-party visual assets or public asset directories.

## Evidence and remaining review

- `pnpm exec vitest run src/models/doppler.test.ts`: **11 tests passed**, Node 24.19.0 / Vitest 5.0.0. Covers stationary and analytic collinear limits, exact contact geometry, translation/rotation invariance, independent bisection, retarded derivative and off-axis continuity, equal-velocity motion, exact sonic rejection, near-boundary numerical roots, wave spacing, 90 exploration endpoints and deterministic reconstruction of 808 film samples in reverse seek order.
- TypeScript program rooted only in the four topic TS/TSX files: zero diagnostics, including imported dependencies. Astro compilation of the cover: zero errors. Both MDX files compiled through the repository's Satteri renderer and contain all three required anchors. Targeted Prettier was used, with no global formatter or shared build.
- Packet checks confirmed exact keys, duration, eight windows, all literal and dynamic Chinese labels, metadata translations, registered related slugs and zero shared-dictionary conflicts.
- Twenty-four whole component states (start/midpoint/end of eight chapters) rendered through React SSR without non-finite SVG values. Eight actual field/ruler stills were rasterized with resvg; inspected emission-center, forward-spacing, off-axis and dense-front stills. This led to explicit off-field P direction markers, separate vertical placement from the S label, and larger phone unit labels. Final SSR also confirmed explicit nonempty accessible labels on all four manual ranges. These are static instrument checks, **not** full-page browser layout or continuous playback evidence.
- Browser playback, every paused chapter jump, keyboard/touch operation, both page languages, real 320 px page height, narration buffering/autoplay failure, both full voice tracks and physical-phone performance remain parent review. No voice recording, full listening, browser review, global build, registration or deployment was performed by this worker.

The working directory is the shared repository `/Users/int64ago/workspace/vistep`, as assigned. Only topic-owned source/content/brief/packet files were edited. Transient static checks used `/tmp/doppler-qa/`. Previous scenes and shared registries remain parent-owned.

## Recorded integration

Both languages run **177.5 seconds**. Actual chapter starts in seconds: 0, 22, 44, 66, 88, 110, 132, 154.5. Authored words are unchanged; measured windows allow breathing room for the longer recording, and the animation reconstructs from the same chapter progress.

zh: `/narration/doppler-zh-9c5198776b2e.mp3` · en: `/narration/doppler-en-c3ed16b9acfb.mp3`
