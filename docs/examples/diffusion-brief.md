# Diffusion — production brief

[简体中文](../zh-CN/examples/diffusion-brief.md)

## Integrated film

The assembled Chinese and English tracks share **185.5 seconds**. The original 176-second storyboard below is the initial handoff; measured speech determines the final windows here. Authored chapter titles, captions and spoken wording are unchanged. Temporary packet paths below refer to the consumed handoff. `src/data/narration.json`, `film-timeline.json`, `audio-tracks.json` and `audio-manifest.json` are canonical.

| Chapter                         | Measured window |
| ------------------------------- | --------------- |
| 1. From a peak to a spread      | 0–22 s          |
| 2. The slope sets net flux      | 22–45 s         |
| 3. A local mass budget          | 45–67 s         |
| 4. Boundaries limit the spread  | 67–90 s         |
| 5. Change diffusivity           | 90–112.5 s      |
| 6. The square of the length     | 112.5–135.5 s   |
| 7. Mixing without disappearance | 135.5–160 s     |
| 8. A steady state with flux     | 160–185.5 s     |

Recordings: `/narration/diffusion-zh-bef6a86a4e66.mp3` · `/narration/diffusion-en-c336a33c8df9.mp3`

Full continuous viewing, native bilingual listening and physical-phone performance remain separate pending evidence.

---

## Causal argument and art direction

A still, sealed concentration ribbon replaces the flowing glass cell of convection. There are **no particles, prescribed trajectories or bulk velocity**. A pale blue concentration field sits in a slim dark glass sleeve; the matching profile below makes falling peak height and preserved area visible. The curve, ribbon segment averages, section gradients, signed fluxes, region amounts and time history all come from the independent exact solution.

The chapter instrument changes with the question: an initial-profile trace, a fixed section and tangent, a highlighted subvolume with two flux readings, a bounded variance history, two D values, actual unequal physical lengths, two conserved label fields, and finally ideal reservoir endpoints. A dark blue ground, restrained cyan/amber lines and quiet glass edges distinguish this from the warm convection apparatus. The cover is a complete 400 × 230 SVG with an optional color prop, using the same model; there are no external assets.

Phone geometry is recomputed for the actual container width. Text remains 16px and the profile has an independently chosen 150px vertical span. Comparisons use two thin concentration strips and **one shared profile plot**, rather than two complete stacked instrument panels. Length comparisons preserve the true 2:1 strip ratio. The shared Showcase owns the current caption; there is no repeated large watch-mode sentence. Only experiment-specific boundary, scale and symbol notes remain inside the scene.

## Eight 22-second chapters

| Chapter     | Visible computed change                                                                                             | Model time |
| ----------- | ------------------------------------------------------------------------------------------------------------------- | ---------- |
| Release     | The initial pulse broadens; the initial outline and total amount remain visible                                     | 0–0.8      |
| Flux        | A fixed section at 0.67L tracks a flattening gradient and decreasing rightward net flux                             | 0.15–2.5   |
| Budget      | The 0.55L–0.85L region first accumulates and then loses material as its two fluxes cross                            | 0.3–3.5    |
| Variance    | Replace the concentration plot with variance history, early 2Dt reference and finite uniform limit                  | 0.1–18     |
| Diffusivity | D 0.01 versus 0.02, otherwise identical initial field, amount, length and time                                      | 0–6        |
| Length      | L 1 versus 2, D 0.015, geometrically scaled initial profiles and amount 1 in each                                   | 0–8        |
| Mixing      | Independent A/B fields overlap, preserving each amount and their constant sum                                       | 0–30       |
| Reservoir   | Explicit new initial/boundary problem; cumulative boundary exchange changes stored amount while steady flux remains | 0–35       |

The draft film is 176 seconds. Chinese and English scripts are separately authored at roughly 46–53 English words per chapter. `useShowcase` chapter/progress alone selects the requested solution; there is no separate renderer clock or frame history. Film seconds are deliberately distinct from dimensionless model time. Parent integration owns measured voices and the shared transport.

## Exact finite-domain model

The cross-sectional area is 1. Concentration is uniform across it, the medium has no bulk motion, D is constant and nonnegative, and there are no sources or reactions. The governing laws are `J = −D cₓ`, `cₜ = −Jₓ = D cₓₓ`.

The sealed initial pulse is `(M/L)(128/35) sin⁸(πx/L)`, exactly represented by a constant M/L and four cosine modes n = 2, 4, 6, 8 with coefficients `(M/L)[−1.6, 0.8, −8/35, 1/35]`. Each coefficient is multiplied by `exp[−D(nπ/L)²t]`. This is an exact finite-mode solution for this smooth authored initial condition, not a Fourier truncation of a step or a numerical time integrator. Sealed ends satisfy cₓ = J = 0.

Analytic integrals give total mass, local amount, first/second moments and concentration nonuniformity. The symmetric pulse variance satisfies `dσ²/dt = 2D − DL[c(0)+c(L)]/M` and tends to `L²/12`; the infinite-domain 2Dt increase is only an early reference. Squared nonuniformity decays with the independently derived diffusion dissipation rate. Macroscopic smoothing is not a claim that molecules slow or stop, nor a simulation of microscopic reversibility.

Two-label mixing uses `(1 ± 0.95 cos(πx/L))/L`, with the same D. Each amount is 1, and their sum is exactly 2/L at every position and time. The model is for dilute, independent, nonreacting labels; it does not solve a real multicomponent mixture with cross-diffusion, volume change or concentration-dependent transport.

The reservoir chapter deliberately restarts from `1 − x/L − 0.2 sin(πx/L)`, with fixed c(0)=1 and c(L)=0. Its sine term decays at `D(π/L)²`; the linear background remains. Analytic cumulative endpoint fluxes close the changing mass budget. Steady flux is D/L, not zero. This is not a comparison claiming identical initial conditions to the sealed pulse. A total-mass input is rejected for this prescribed-concentration problem if it differs from the default, because the reservoirs determine the inventory.

Default D=0.015, L=1, M=1. Supported model D is 0–0.1, L is 0.5–2, M is 0.1–2 for sealed problems and time is 0–120. Manual time is 0–40 and D is 0–0.04; doubling comparisons remain within the domain and length is visibly capped at 2. Negative time, reverse integration intervals, invalid positions/parameters and inappropriate species are rejected. A displayed negative zero is normalized; the analytic concentration itself is not clipped to fake conservation. Roundoff-sized negatives at an exact zero are tolerated only by the illustrative color mapping.

Ribbon cells use exact interval-average concentrations. Their absorption palette is authored, not a real dye spectrum. Flux arrows show **direction only**; nearby numbers supply magnitude. The model does not turn net flux into particle speed. No advection, Brownian-path solver, membrane transport, reaction or non-Fickian physics is implied.

## Controls, fallback and resources

Reset restores all state: D 0.015, L 1, time 0, sealed pulse, section 0.67, flux instrument, comparison off. Changing initial/boundary type clears comparison. All ranges use explicit translated accessible names; controls use 44px minimum targets. The same-model HTML table exposes numerical values independently of SVG appearance.

SVG is the primary two-dimensional renderer, requiring no WebGL, Canvas, audio, Worker or textures. A ResizeObserver recomposes the coordinates; its absence uses a window resize listener instead. Both paths remove listeners/observers on unmount. There is no animation timer to advance outside the shared director. Parent lifecycle review must still exercise integrated offscreen, background and reduced-motion behavior.

## Evidence and remaining review

Targeted model suite: **15 tests passed**, covering normalized initial data; sealed mass and end flux; positivity/maximum principle; gradient and flux sign; PDE checks by independent spatial/temporal differences; subvolume budget; monotonic bounded variance and wall correction; dissipation; D/time/length² scaling; two-species conservation; reservoir exchange and steady flux; convergence to an independent conservative finite-volume solver at 32/64/128 cells; interval-average mass and moment quadrature; static D=0 and history-independent seek/reset; invalid domains.

Representative outputs at default parameters: initial variance 0.01121235; at time 18, variance 0.08333143 versus the limit 0.08333333. Region accumulation changes from +0.0576507 at time 0.3 to −0.0094311 at time 3.5 while total amount stays 1. At time 1, the section flux at 0.67L is +0.0849889. These are exact-solution model outputs, not laboratory measurements.

CUA operated an isolated Vite fixture with independently installed dependencies and a minimal shared-director context. All eight English chapter stills at progress 0.65 were inspected at 320px. The budget clearance, variance legend and A+B sum legend were corrected and reinspected. Scene-only heights are approximately **670–753px**, excluding the fixture toolbar and integrated player/caption. No horizontal overflow was found in those frames. Chinese budget and length phone frames, plus Chinese initial pulse and length comparison at 1080px, were inspected. This is selected-frame review, not a complete uninterrupted film watch-through.

CUA keyboard End set all four ranges to 40, 0.04, 2 and 0.9. The variance time axis correctly extended to 40. Instrument/comparison changes and a separate reservoir selection were reset to the complete defaults. Ranges measured 44px high; buttons measured 44.8px. The budget chapter was sought to its start and end and showed the expected positive/negative accumulation. No duplicate watch paragraph is rendered.

With ResizeObserver deliberately unavailable, CUA inspected the reservoir SVG at 320px, resized to 390px, and verified matching 362px drawing/viewBox width, no overflow and the same-model HTML table. Unmount removed the scene nodes. CUA console review returned no warning/error entries during this fallback check; it was not a memory or observer-count profile. There were no audio/video elements, so this does **not** verify native media currentTime, delivered audio seeking or listening.

Final owned checks include targeted TypeScript, actual installed Astro Sätteri MDX compilation for both articles, Astro cover compilation, exact packet/translation contract validation and formatting of only the 11 owned files. No global production/preview build, shared registry/audio change, git operation or deployment belongs to this handoff.

Parent review remains: integrated complete playback and final transport/caption heights; full offscreen/background/reduced-motion checks; measured bilingual audio, native seeking/currentTime and listening; final cover/social rendering and physical-phone performance. Viewport measurements are not device testing. Narration/caption/title/timing freeze is recorded at handoff; subsequent changes belong to the parent.

## Primary sources and provenance

- [MIT, Conceptual Model for Diffusion](https://web.mit.edu/1.061/www/diffuse/theory.htm): net flux versus molecular crossings, down-gradient Fickian transport and unbounded spreading. The scene itself does not simulate those random paths.
- [MIT 3.21 instructor solution, finite-body diffusion](https://ocw.mit.edu/courses/3-21-kinetic-processes-in-materials-spring-2006/633e72338764b7247cf43e481d546e2a_exam1_sol.pdf): sealed mass conservation, uniform equilibrium and cosine eigenfunctions. The authored smooth pulse is independently derived, not its rectangular example.
- [MIT 3.185 recitation notes](https://ocw.mit.edu/courses/3-185-transport-phenomena-in-materials-engineering-fall-2003/d9abff527d0533d61bfc5a2987c531ce_recitation3.pdf): separation of variables and explicit distinction between fixed concentration and fixed flux.

All assets are procedural. `src/data/scene-packets/diffusion.json` is a temporary integration packet, not a second canonical registry. Both related topics, convection and Bernoulli, were registered at final packet validation.

## Frozen handoff

All eight Chinese/English scripts, captions, chapter titles, 22-second chapter windows, cue offsets and the 176-second draft duration are frozen. The packet has 85 translations, with existing shared wording preserved. Narration SHA-256 (sorted compact UTF-8 JSON): `ba430b85b53eb1f373d47726016db018d8b594f3dba42ba59d8fae8ae0850623`.

Final model command: `pnpm exec vitest run src/models/diffusion.test.ts` — 15/15 passed, 288ms reported duration. Targeted TypeScript passed; both Astro Sätteri MDX files compiled; the cover compiled with zero diagnostics; all 11 owned files passed Prettier; exact packet and translation checks passed. No parent-action blocker.
