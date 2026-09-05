# Convection — production brief

[简体中文](../zh-CN/examples/convection-brief.md)

## Integrated film

The assembled Chinese and English tracks share **186 seconds**. The original 176-second storyboard below is the initial handoff; measured speech determines the final windows here. Authored chapter titles, captions and spoken wording are unchanged. Temporary packet paths below refer to the consumed handoff. `src/data/narration.json`, `film-timeline.json`, `audio-tracks.json` and `audio-manifest.json` are canonical.

| Chapter                           | Measured window |
| --------------------------------- | --------------- |
| 1. Conduction comes first         | 0–22 s          |
| 2. Disturb the temperature layer  | 22–44.5 s       |
| 3. A rising warm current          | 44.5–67 s       |
| 4. Follow the return flow         | 67–89 s         |
| 5. Remove buoyancy, keep the heat | 89–113.5 s      |
| 6. Put warmth above               | 113.5–136.5 s   |
| 7. After the contrast is removed  | 136.5–160 s     |
| 8. What the grid can tell us      | 160–186 s       |

Recordings: `/narration/convection-zh-b5d89bbf8fd9.mp3` · `/narration/convection-en-26f915fd2f30.mp3`

Full continuous viewing, native bilingual listening and physical-phone performance remain separate pending evidence.

---

## Concept and composition

A warm, quiet glass cell makes the distinction between **heat moving** and **fluid carrying heat** visible. The computed field is the main object: steel-blue and copper plates enclose a continuous 1.5:1 fluid domain, with a soft temperature field and 24 persistent material tracers. One tracer is picked out during the dye chapter. There are no prescribed roll paths, decorative vortices, fake streamlines, external image assets or 3D camera. Plate colors and temperatures, arrows, dye, particle coordinates and readouts all come from the same independent model.

Desktop comparisons place two cells side by side. At 320px the film shows one comparison cell at a time, switching at chapter progress 0.52, while preserving both transport readings. It does not stack two assemblies and charts. The single-cell layout keeps its geometric aspect ratio; labels remain at least 16px. Exploration has an explicit phone comparison switch. Method details are folded away.

## Film and timing

The draft is 176 seconds, eight 22-second chapters. The scene consumes the shared `useShowcase` chapter/progress director. Film time is mapped to dimensionless model time; it is not physical elapsed time in a cup of water. Each comparison reconstructs both cases from their specified initial state.

| Chapter           | Computed observation                                                                   | Model time |
| ----------------- | -------------------------------------------------------------------------------------- | ---------- |
| 1 · Diffusion     | Uniform resting fluid develops conductive boundary layers without lateral flow         | 0–8        |
| 2 · Seed          | Restart from a conductive profile with a prescribed sideways perturbation              | 0–8        |
| 3 · Plumes        | Continue the same coupled heat/flow solution into rising and returning currents        | 8–22       |
| 4 · Return        | Advect dye and a persistent material tracer, displaying its changing local temperature | 22–36      |
| 5 · Transport     | Compare active buoyancy with zero buoyancy, same initial temperature and elapsed time  | 0–28       |
| 6 · Heating above | Exchange the hot/cold plates with all other parameters held fixed                      | 0–28       |
| 7 · Cooldown      | Set both plates to 0.5 at model time 24; stored heat and motion decay                  | 24–52      |
| 8 · Resolution    | Show actual cells and compare 30 × 20 against 42 × 28                                  | 20–32      |

The packet contains independently authored Chinese and English speech, captions, chapter names and timestamps. No narration generation or shared audio edits belong to this handoff. Parent measurement may require timing integration; wording changes after freeze require coordination.

## Independent model and boundaries

The solver advances dimensionless two-dimensional Boussinesq vorticity and temperature. Density variation affects only buoyancy. With upward y, `ω = ∂v/∂x − ∂u/∂y`, `u = ∂ψ/∂y`, `v = −∂ψ/∂x`:

- `ωₜ + u · ∇ω = ν∇²ω + B ∂T/∂x`.
- `−∇²ψ = ω`; a separable discrete sine transform solves this equation.
- `Tₜ + u · ∇T = κ∇²T`.
- Dye is a passive advected/diffused scalar with no wall flux.

All four walls are impermeable and **free-slip**, with zero wall streamfunction/vorticity. This is explicitly different from real glass no-slip friction. Sides are insulated; top and bottom are prescribed-temperature boundaries with half-cell diffusive distances. Plates have no modeled heat capacity. Default width/height is 1.5/1, `B = 1`, `ν = 0.02`, `κ = 0.01`, dye diffusivity 0.0005. Parameters and outputs are authored dimensionless quantities, not water material properties, Celsius, watts or real seconds.

The default temperature is a conductive linear profile plus `−0.02 cos(2πx/1.5) sin(πy)`; there is no random seed. The opening instead uses uniform temperature 0.5 with no disturbance. In exact lateral symmetry the code retains the motionless solution. That does not mean a laboratory has no ambient perturbations.

Face velocities are the discrete curl of a single streamfunction, giving zero discrete divergence algebraically. Temperature and dye use conservative face fluxes with first-order upwinding and explicit central diffusion. Vorticity also uses upwind transport. **Numerical diffusion and momentum dissipation are additional to the specified coefficients.** Stability checks reject unsafe states; temperature/dye are not clipped to hide instability. Tracers use midpoint integration through the derivative of bilinear streamfunction. Normal velocity is continuous across faces; tangential interpolation can jump, so trajectory checks include refinement across faces rather than demanding a smooth-velocity identity at every crossing.

Heat storage is balanced against accumulated plate flux, and dye mass remains conserved. The displayed advective flux uses the same upwind face temperature as the heat update. Positive flux is upward; explicit conduction is signed separately. Dye opacity is amplified eightfold and saturated only for display; all budgets use unmodified concentrations. Canvas interpolates computed temperature colors; the grid chapter and SVG fallback reveal cells. There is no prediction of a critical Rayleigh number, three-dimensional turbulence, boiling, phase change or free-surface motion.

## Determinism, controls and resources

`ConvectionRun` has fixed initial data and per-configuration time steps, bounded checkpoints and exact reconstruction after backwards seeks. Chapter changes use pure shot definitions. There is no renderer clock or frame-history-dependent random state. A dedicated Worker handles reconstruction; stale replies are ignored. Worker failure falls back to cancellable main-thread chunks of the same solver. Unmount terminates the Worker, clears timers/checkpoints and disconnects the canvas resize observer. Offscreen/background/reduced-motion playback uses the existing shared director; no local animation loop bypasses it.

The four ranges have explicit translated accessible names and 44px targets. Reset restores all inputs: lower heating, B 1, ν 0.02, disturbance 0.02, time zero, temperature view, comparison off, baseline phone focus. Canvas failure draws the same field and tracer positions as SVG. No audio element is created by this scene.

## Verification and limits of the evidence

Targeted Vitest: **17 tests** cover manufactured discrete Poisson data; exact impermeable walls/discrete divergence; unperturbed conduction; uniform-layer diffusion; growth below versus decay above; advective versus conductive flux; nonzero heat budget and dye conservation; strong-forcing boundedness/CFL; material identity/closed-domain motion; tracer time refinement; analytic heat spatial refinement; qualitative finer-grid agreement; kinetic dissipation and finite cooldown; exact seek/reset reconstruction; retained-state immutability; and invalid/unsafe domains.

Representative independent model results at `t* = 28`: default max speed 0.29914 and upward advective flux 0.032879; zero-buoyancy advective flux exactly 0, conductive flux 0.010000. Finer-grid advective flux is 0.033547. Heating-above max speed is about 2.08 × 10⁻⁸. After setting both plates to 0.5 at time 24, kinetic energy falls to about 2.26 × 10⁻¹² by time 52. These are outputs of this solver, not experimental measurements. Default full reconstruction to time 52 measured roughly 0.48s in Node on this workstation; this is not browser FPS or phone performance evidence.

Current visual evidence uses **CUA** with a private Vite fixture, its own installed dependencies and a minimal shared-director context. Eight English chapter stills at progress 0.65 were inspected at 320px; after removing the duplicate watch-mode explanation, scene-only heights ranged 616.9–680.7px, with no horizontal overflow. Chinese dye and heating-above comparison start/end frames were inspected at 320px before the final removal of duplicated captions and contrast adjustment. The final Chinese grid frame was reinspected at 320px: height 653.9px, visible text 16/22px, no overflow. Chinese desktop plume and reversed-heating comparison were inspected at 1080px. The final compact comparison was reinspected at 1080px: both cells appeared, no overflow, height 807.4px. The scene has no repeated large watch-mode caption; the shared Showcase owns the current sentence. Readouts, full field bounds, dye visibility, equal-temperature plate state and phone focus were reviewed. No perspective projection is involved. Earlier shell-driven browser samples were superseded and are not used as current browser evidence.

CUA keyboard checks used End on all four named ranges, obtaining 52, 1.5, 0.06 and 0.04; then changed heating, dye, comparison and phone focus. Reset returned 0, 1, 0.02 and 0.02, lower heating, no dye/comparison and baseline focus. Actual targets measured 44px for ranges and at least 44px for buttons. With both Worker and Canvas forced unavailable, CUA inspected the completed SVG at `t* = 22`, with speed 0.3009 and advective flux 0.0334, matching the normal solver and without horizontal overflow. Unmount removed the scene nodes; this is not a live-worker count or memory profile. The isolated fixture contains no media, so it provides no native audio currentTime or listening evidence.

Remaining parent review: integrated transport position and full uninterrupted watch-through; integrated offscreen/background/reduced-motion behavior; measured bilingual voice timing, native media seeking/currentTime and actual listening; production pages and physical-phone performance. Isolated viewport measurements and selected screenshots do not establish those outcomes. No shared production/preview build, global formatter, registry change or deployment was run by this worker.

## Sources and provenance

- [University College Dublin, Rayleigh–Bénard convection notes](https://maths.ucd.ie/~onaraigh/acm40740/acm_40890_jan2018_v2.pdf): Boussinesq equations, conductive base state and boundary dependence of stability.
- [Dedalus, 2D Rayleigh–Bénard example](https://dedalus-project.readthedocs.io/en/latest/pages/examples/ivp_2d_rayleigh_benard.html): primary implementation reference for the coupled equations. Its periodic lateral/no-slip setup differs; it is not a numerical validation of this cell.
- [Bridson and Müller-Fischer, Fluid Simulation notes](https://www.cs.ubc.ca/~rbridson/fluidsimulation/fluids_notes.pdf): incompressibility, advection and conservation principles. This implementation uses streamfunction inversion rather than their projection workflow.

All artwork is procedural. The self-contained 400 × 230 cover accepts an optional color prop and samples this solver at model time 18. The temporary integration packet is `src/data/scene-packets/convection.json`; it is not a second canonical registry.

## Final owned checks and freeze

- `pnpm exec vitest run src/models/convection.test.ts`: 17/17 passed (5.60s), including strongest forcing through the full manual time range, 52.
- Targeted `tsc --noEmit` over the model, experiment, renderer, hook and Worker: passed.
- Installed Astro Sätteri MDX processor compiled both owned MDX files; installed Astro compiler compiled the cover with zero diagnostics. No standalone-only MDX compiler claim and no shared site build.
- Targeted Prettier over all 13 owned files and exact packet/translation/registered-related checks: passed.

Handoff freezes all eight bilingual narration scripts, captions, chapter titles, 22-second chapter lengths, cue offsets and the 176-second draft duration. The final caption-duplication fix changed presentation only; narration stayed unchanged. The 83 translations include two short computation-status labels and preserve existing dictionary values. Parent owns integration and subsequent changes.
