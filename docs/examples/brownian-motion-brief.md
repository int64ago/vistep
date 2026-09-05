# Brownian motion — production brief

[简体中文](../zh-CN/examples/brownian-motion-brief.md)

## Integrated film

The assembled Chinese and English tracks share **182 seconds**. The original 176-second storyboard below is the initial handoff; measured speech determines the final windows here. Authored chapter titles, captions and spoken wording are unchanged. Temporary packet paths below refer to the consumed handoff. `src/data/narration.json`, `film-timeline.json`, `audio-tracks.json` and `audio-manifest.json` are canonical.

| Chapter                             | Measured window |
| ----------------------------------- | --------------- |
| 1. Follow just this one             | 0–22 s          |
| 2. A nanosecond observation         | 22–44 s         |
| 3. Inertia loses its memory         | 44–67.5 s       |
| 4. Return to seconds                | 67.5–90 s       |
| 5. Change temperature alone         | 90–112.5 s      |
| 6. Drag changes the wandering scale | 112.5–135 s     |
| 7. Repeat the observation           | 135–159 s       |
| 8. The mean is not a particle       | 159–182 s       |

Recordings: `/narration/brownian-motion-zh-d59bac9464bb.mp3` · `/narration/brownian-motion-en-c4c2039f8276.mp3`

Full continuous viewing, native bilingual listening and physical-phone performance remain separate pending evidence.

---

## A microscope, not a concentration map

Follow one gold spherical tracer. Its irregular path is the subject; independent repeats enter only when the film asks a statistical question. This topic is separate from the concentration PDE in diffusion and mean fluid flow in convection. No decorative bath molecules, random bouncing balls, photon paths or concentration cloud are invented.

The image uses a soft, native SVG microscope field, a physical scale bar and a fixed origin. The opening magnifies the first second of the same long observation. A separate nanosecond experiment magnifies centroid displacement, explicitly replacing the physical sphere with a position glyph. On returning to seconds, the overdamped and inertial paths share an integrated bath realization. Parameter comparisons use translucent physical-radius outlines so one trial cannot hide another.

The field boundary is only a camera window. The model has no walls, wrapping or teleportation. Fixed framing encloses the full selected run and particle radii with 20% radial margin. Frame grids are reference marks, not resolved fluid structures. Graphs and labels use native-width coordinates, keeping all text at least 16 px.

## Frozen 176-second film

Eight 22-second chapters; narration starts 0.45 seconds after each chapter start. Chinese and English speech were authored separately, with English cues of 46–52 words. **All cue text, captions, titles, chapter count and timing are frozen.** No recordings were made by this worker. Final refinements to opacity, instrument spacing and chart horizon did not change narration.

| Film time | Visible action                                                                                           | New observation                                                                                                                         |
| --------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 0–22      | Gold sphere traverses 0–1 physical seconds; first-second framing.                                        | One finite observation is irregular even without mean flow.                                                                             |
| 22–44     | Separate centroid experiment advances through 12τ, about 700 ns. Complete half-τ impulse windows update. | Bath plus drag impulse closes the actual momentum change. No instantaneous white-noise force is displayed.                              |
| 44–66     | Disable classical thermal noise, preserve initial velocity, advance through 8τ.                          | Speed decays exponentially rather than disappearing instantly. T = 0 is a mathematical control.                                         |
| 66–88     | Advance a 4-second inertial path and its coupled overdamped counterpart.                                 | Inertia becomes negligible for position at long times; a finite nanometer endpoint difference remains.                                  |
| 88–110    | Compare 300 and 450 K for three seconds with fixed radius and viscosity.                                 | D scales with temperature; displacement scales with its square root.                                                                    |
| 110–132   | Compare baseline, triple viscosity and double radius for three seconds.                                  | Both changes reduce D, while radius also changes mass and inertial time.                                                                |
| 132–154   | Repeat from a common origin, 64 independent trials, 0–2 seconds.                                         | Single squared displacement fluctuates; the finite-sample average approaches the theoretical MSD scale. The chart horizon is 2 seconds. |
| 154–176   | Continue those same trials from 2–4 seconds; reveal their mean-position diamond.                         | The mean can stay near the origin while RMS displacement grows. The diamond is not a particle.                                          |

`useShowcase` supplies chapter and progress. An authored smooth time map leaves brief initial/final holds, without additional simulation history. Each seek selects the same immutable observations. There is no repeated scene-top caption; Showcase owns that sentence.

## Independent numerical model

SI units internally. Defaults: T = 300 K, η = 0.001 Pa·s, radius a = 0.5 µm and density 1050 kg/m³. Boltzmann’s constant is exactly 1.380649 × 10⁻²³ J/K. The model derives m = 4πρa³/3, γ = 6πηa, τ = m/γ and D = kBT/γ. Defaults give D = 0.439474226 µm²/s and τ = 58.333333 ns.

Each observed coordinate satisfies `m dv = −γv dt + √(2γkBT) dW`, `dx = v dt`. Initial positions are zero; velocities are independent equilibrium Gaussians with variance kBT/m. The zero-temperature control retains the reference initial velocity as a deliberate nonequilibrium initial condition.

Exact joint Gaussian position–velocity transitions avoid Euler timestep bias. With h = Δt/τ, A = exp(−h), B = 1−A, the dimensionless conditional noise covariance is:

- Qvv = 1−A².
- Qxv = B².
- Qxx = 2h−2B−B².

Velocity units are √(kBT/m), position units τ√(kBT/m). A small-h series and `expm1` avoid cancellation; a Cholesky factor generates the correlated noise. Counter-addressed hashed Box–Muller samples depend on seed and index, with no global random cursor. Long observations use 512 intervals over four seconds; the inertial shot uses 384 over 12τ. The last complete 16-step impulse window has duration 0.5τ. Drag impulse is −γΔx; bath impulse is mΔv + γΔx. This identity comes from the integrated equation, not unrelated decorative bars.

Integrating that same equation gives the coupled overdamped coordinate `xOD = x + τ(v−v0)`. The model uses this identity for the comparison, without trying to resolve billions of nanosecond steps over a second.

For two displayed coordinates, the equilibrium MSD is `4D[t−τ(1−exp(−t/τ))]`. Short-time behavior is `2(kBT/m)t²`; long-time behavior is `4Dt`. Three-dimensional MSD would use a different coefficient. Mean position, sample MSD and RMS displacement are computed from the same 64 trajectories. The theory ring is an RMS scale, not a containment probability or boundary.

Exact transitions describe the stochastic model at observation points. Linear exposure interpolation and trail decimation do not resolve the path between them. The overdamped mathematical path is nonsmooth; the inertial model’s position has velocity, so do not extend the nonsmooth claim to arbitrarily short inertial motion.

## Scientific limits and resources

Classical, free, isotropic, dilute no-slip spheres in a uniform bath. No mean flow, force, walls, interactions, gravity, confinement, fluid added mass, hydrodynamic memory, finite molecular collision time or instrument noise. Position spreads without a normalizable stationary free-space distribution; velocity can remain thermal. Real liquid short-time motion requires hydrodynamic corrections, so the nanosecond chapter explicitly explains an ideal Markov model. Temperature and viscosity are independent teaching inputs, not a real liquid’s temperature curve. Zero kelvin and 450 K do not imply that a reference liquid exists there.

The scene is natively two-dimensional SVG; it does not need WebGL, a 3D camera or a separate degraded drawing. No audio context, Worker, asset request, interval or animation loop is created. Memoized bounded trajectories and at most 129 statistical display samples avoid per-frame regeneration. A single ResizeObserver is disconnected on unmount. Reduced motion and offscreen/background pause come from the existing Showcase director; the topic does not advance its own clock. CSS transitions are disabled under reduced motion.

The phone uses a 345 px single-particle field, 265 px centroid field or 252 px ensemble field, followed only by that chapter’s instrument. At 320 px, the closed watch stage measured 663.039–852.383 px in the final bilingual audit. Exploration is intentionally longer and optional. Buttons measured 46.398 px high and ranges 44 px; every range has an explicit translated name. Reset restores 300 K, 1 mPa·s, 0.5 µm, seed 137, trace view, 2 seconds and the separate 6τ inertia-time default.

## Evidence — 2026-09-06

- Targeted Vitest: **14 passed**, one file, 420 ms reported run duration. Checks cover SI/scaling, exact zero time, zero-temperature stationarity and velocity decay, independent numerical covariance integration, positive covariance at extreme h, timestep subdivision at 1/2/8/128 steps, ballistic and long-time limits, 8192 independent long-time MSD/equipartition trials, 16384 velocity-correlation trials, momentum closure, complete windows without future samples, coupled overdamped paths, 169 direct seeks, independent histories, bounds and rejected inputs. Statistical tolerances are explicit; finite-sample checks are not exact identities.
- Targeted strict TypeScript passed. Both articles passed the actual Astro 7.3.1 / @astrojs/mdx 8 transform and prerender pipeline. Native anchor elements and formula blocks are used; there is no raw dollar-delimited TeX. Cover compilation has zero diagnostics. Astro container default/custom-color SVG rendering and 400×230 Resvg rasterization passed; the cover raster was inspected.
- Packet checks passed exact keys, no topic number, metadata, 56 Chinese source literals, shared translation preservation, eight cues and 176 seconds. The packet is temporary integration input.
- All actual browser control and inspection used **CUA**, on an owned localhost fixture at port 4834. `/tmp/brownian-review-env` had its own offline frozen-lockfile install of 379 packages, without a node_modules symlink. Source was bundled in memory; no shared build outputs were created. The fixture substituted only the director context and packet translations in memory.
- A final 48-case layout audit covered eight chapters × two languages × 1200/390/320 px at progress 0.65. It found no horizontal overflow, SVG text overlap or rendered SVG text below 16 px. Largest stage across all widths: 860.992 px. After the final MSD horizon adjustment, six additional language/width endpoint checks passed. The impulse label/value collision found in the initial audit was corrected and rechecked.
- Visually inspected desktop opening, phone impulse, ensemble/MSD and radius/viscosity comparison, plus cover. CUA also checked zero-temperature MSD rendering without NaN, all four input types, seed change, keyboard Home/End/ArrowRight, complete reset including hidden inertia time, and a visible SVG direct-seek identity. Unmount left zero ResizeObservers and zero topic SVGs; console error/warning logs were empty.

**Not claimed:** a complete continuous 176-second integrated watch, generated voices, native listening, audio seeking/currentTime validation, physical-phone/touch performance, FPS, actual reduced-motion runtime emulation, full shared build or publication. There were no media elements. Parent review owns those integration and release checks. No shared or earlier frozen scene files were edited.

## Primary references and provenance

- [NIST — SI defining constants](https://www.nist.gov/pml/special-publication-330/sp-330-section-2): exact Boltzmann constant and units.
- [Padova / INFN — Langevin lecture notes](https://userswww.pd.infn.it/~orlandin/fisica_sis_comp/langevin.pdf): Langevin dynamics, equilibrium velocity statistics and diffusion relation.
- [Li et al., Science 2010](https://pubmed.ncbi.nlm.nih.gov/20488989/): primary instantaneous-velocity experiment in optically trapped glass beads in air; it is not a parameter fit for this liquid illustration.
- [Li and Raizen — short-time Brownian motion](https://arxiv.org/abs/1211.1458): limits of white-noise and simple inertial descriptions in liquids.
- [Florin — ballistic Brownian motion](https://meetings-archive.aps.org/mar/2012/t48/7/): primary experimental account emphasizing fluid inertia and hydrodynamic memory.

All artwork, geometry and scripts are original. No image, texture or audio assets were downloaded. The cover is a self-contained 400×230 SVG accepting `color`, generated from seeded model paths rather than random decoration.
