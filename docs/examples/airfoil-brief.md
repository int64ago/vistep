# Airfoil — air has no appointment at the trailing edge

## Production intent

An intimate wind-tunnel-style observation window, with one precisely mapped symmetric section at its center. Slate blue, oxidized silver, quiet cyan and ochre replace a generic instrument dashboard. The window is editorial framing: the mathematical fluid is unbounded and has no simulated tunnel walls. SVG is the primary medium and the WebGL-independent fallback. No downloaded or generated assets are used.

The guiding question is whether parcels separated upstream must reunite downstream. The answer emerges from actual trajectories, surrounded by three mutually consistent computations: velocity, surface pressure and force. Bernoulli converts the already-determined velocity field into pressure; it does not independently select the field. Neither surface length nor an equal-transit assumption enters the velocity calculation.

The initial silent-readable storyboard used eight 22-second chapters. Bilingual narration is authored in `src/data/narration.json`; synthesis and measured timing are recorded below. Integrated review remains the parent task’s responsibility.

## Authored sequence

| Time      | Shot                     | Visible causal change                                                                                                                 |
| --------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| 0–22 s    | Symmetric reference      | Real streamline tracers pass both sides; mirrored pressure loads give zero lift.                                                      |
| 22–44 s   | Change incidence         | Raise incidence from 0° to +6°, solving each steady field; velocity vectors, pressure and lift change together.                       |
| 44–66 s   | Trailing-edge close-up   | Two surface probes approach the cusp; their measured speeds approach the same separately calculated finite limit.                     |
| 66–88 s   | Surface force tour       | Reveal pressure contributions around the complete section; partial horizontal/vertical sums become the full force only at completion. |
| 88–110 s  | Two simultaneous tracers | Integrate two nearby upstream seeds, retaining their shared physical clock and unequal arrival times.                                 |
| 110–132 s | Circulation contour      | Traverse a mathematical integration contour and compare its velocity integral with pressure-integrated lift.                          |
| 132–154 s | Reverse incidence        | Solve +6° through zero to −6°; mirrored pressure produces reversed lift.                                                              |
| 154–176 s | Speed scaling            | Compare 15–30 m/s at fixed +6°; unchanged Cp, doubled circulation and fourfold lift.                                                  |

Parameter sweeps are families of steady solutions, explicitly labeled. They do not simulate rotation or acceleration. The force-reveal sequence is an integration explanation, not force building with time. The circulation dot is a mathematical sample position, not a parcel. Parcel and streamline markers use the computed field and physical time, with a disclosed visual slowdown; exiting tracers do not wrap around.

## Independent scientific model

Symmetric Joukowski map `z = ζ + a²/ζ`, auxiliary circle center `−εa`, radius `R = (1+ε)a`, ε = 0.1, chord 1 m. The circle passes through ζ = a; its other mapping critical point is internal. Translation and rotation put the actual section in a horizontal wind. Physical geometry, surface tangents/normals, sampling locations and velocity are derived from the same map. The exterior inverse branch is selected explicitly.

The complex potential derivative consists of uniform flow, a doublet and a circulation term, divided by the mapping derivative. The Kutta condition selects `Γ = −4πRU∞ sin α` (counterclockwise positive). Surface impermeability and far-field flow provide independent checks. The exact cusp, solid interior and mapping pole are excluded; the cusp is checked with the common analytic limit `U∞ cos α/(1+ε)`, not a numerical zero-over-zero. The physical cusp is guarded before inverse mapping because square-root inversion amplifies roundoff there.

`Cp = 1 − (v/U∞)²`, `p = p∞ + ½ρU∞² Cp`. Midpoint periodic quadrature over 512 elements computes `F′ = −∮(p−p∞) n ds`; a separate exterior contour integrates circulation and verifies `L′ = −ρU∞Γ`. Removing uniform ambient pressure leaves the same total closed-surface force. Outward gauge-load increments represent reduced inward pressure, not negative absolute pressure pulling the wing.

Authored defaults: density 1.225 kg/m³, ambient pressure 101325 Pa, +6°, 25 m/s. The film/reference geometry is fixed. Manual controls: −8° to +8°, 10–35 m/s, tracer time 0–180 ms and surface-probe position. The model API rejects zero/reverse speed, nonfinite or unsupported inputs, degenerate geometry and exact-cusp velocity requests. These are teaching-domain guards, not stall predictions. Incompressibility, two dimensions and inviscid steady potential flow omit boundary layers, separation, stall, viscous drag, induced drag and startup circulation dynamics. Ideal pressure drag is zero; real wing drag is not.

RK4 tracer integration uses a physical step proportional to chord/U, with guarded step halving at excluded geometry. Paths are immutable, cached with a finite eight-entry cap and sampled by binary search at the requested time. The paired seeds share x = −0.85 chord, with equal ±0.035-chord offsets about the upstream dividing streamline. The measurement plane passes through the physical trailing edge and is perpendicular to the free stream. At defaults, arrival times are 49.6967 and 59.8559 ms. These selected times are not universal properties of airfoils.

Default lift is 274.276819812645 N/m, agreeing with the circulation formula; CL = 0.716478223184. At the difficult tested corner (8°, ε = 0.08), pressure-integration lift errors for 64, 128 and 256 elements are approximately 0.00467, 1.63e−7 and 4.55e−13 N/m. Numerical convergence supports the implementation, not the validity of ideal flow outside its stated domain.

## Composition, interaction and lifecycle

Desktop has a 440px coordinate window with a broad foil; the phone window is 320px tall, retains isotropic geometry, and changes its domain for the pressure view, paired release and circulation. The tail chapter uses a dedicated close-up with a small full-section locator. Only the current chapter's two measurements are shown. There are no stacked charts or repeated chart titles. Phone captions remain 18px, SVG text 16px and body text at least 16px. All ranges have explicit translated aria-labels through the shared Range component and 44px targets. Mode/reset buttons exceed 44px.

Native keyboard range controls change the physical model/time/probe. The reset restores **all** inputs: +6°, 25 m/s, 0 ms, probe 0.25, surface-load mode. Independent authored chapter/progress coordinates from useShowcase reconstruct every film frame and replay/seek deterministically. No local animation clock, random state or frame history exists. Parent transport provides offscreen/background pause and reduced-motion behavior; local transitions respect reduced motion. ResizeObserver disconnects and path caches clear on unmount. There are no Three.js, Worker or audio resources here.

Pressure colors saturate at Cp ≤ −2.5 and +1; readouts remain untransformed. Pressure-load and velocity arrows use separate display scales. The net-force arrow is placed beyond the section's phone bounding box so negative lift does not cross the foil. SVG has no external graphics dependency; native DOM/SVG remains available with WebGL unavailable.

## Sources and provenance

Research checked 2026-09-05. Source-specific interpretation matters: the Cambridge-hosted material's parenthetic wording about trailing-edge vorticity is not used as a definition; this scene uses the finite-velocity Kutta condition.

- [NASA Glenn — Incorrect Lift Theory](https://www.grc.nasa.gov/WWW/k-12/VirtualAero/BottleRocket/airplane/wrong1.html): equal-transit fallacy, symmetric wing counterexample, independent velocity calculation.
- [NASA Glenn — Bernoulli and Newton](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/bernoulli-and-newton/): conservation laws and the contribution of both surfaces.
- [University of Sydney material hosted by Cambridge — Joukowski Transformations and Aerofoils](https://www-mdp.eng.cam.ac.uk/web/library/enginfo/aerothermal_dvd_only/aero/jouk/jouk.html): conformal geometry, mapped velocity, circulation and lift.
- [Complex Analysis — The Joukowski Airfoil](https://complexanalysis.org/web/sec_joukowski-airfoil.html): mapping branches, circular flow and circulation potential.

All geometry, paths, colors and cover are procedural. No third-party assets or fake CFD outputs.

## Verification and honest limits

- Targeted Vitest: **14 tests passed**, covering closed finite geometry/inversion, surface impermeability, explicit cusp/solid guards, Kutta cancellation/two-sided limit, pressure symmetry, zero/reversed lift, pressure integration vs circulation, pressure-quadrature convergence, ideal drag, U²/density/chord scaling, contour invariance, far field, unequal/symmetric parcel arrivals, RK4 convergence/local velocity, deterministic seeking and invalid requests.
- Targeted TypeScript compilation with ES2023, React JSX, bundler resolution and no emit: passed. An initial ES2022 invocation hit the shared Showcase's ES2023 findLastIndex requirement; using the repository-compatible library target resolved it without editing shared code.
- Both MDX files passed the actual installed Astro Sätteri MDX processor, not merely a generic MDX parser. They use native formula divs/Unicode, without raw TeX. AirfoilCover passed the installed Astro compiler with no diagnostics. No shared build was run.
- Isolated browser fixture used **its own offline-installed dependency tree**, copied scene/shared Range/style files, packet translations and a minimal Showcase context provider. No shared node_modules symlink, registry or narration change. A private headless Chrome profile rendered the actual hydrated Airfoil component with packaged fonts.
- 68 sampled watch states: both languages, 320/390/1080 widths, all chapter midpoints and selected chapter boundaries. No horizontal overflow, SVG text collision or offscreen SVG text. SVG text stayed 16px. At 320px the measured component stage was **678.8–787.0px**, excluding the parent's site shell/transport.
- Images inspected: all eight English 320px chapter midpoints, Chinese desktop force/parcel shots and the manual view. Low-contrast inherited range styling was corrected locally; the phone frame was shortened. Four translated ranges were exercised with keyboard End (8°, 35 m/s, 180 ms, probe 0.995), then mode changed and full reset checked. Range heights 44px; buttons approximately 45.6–64.8px. No browser runtime exceptions in the sampled fixture.
- Evidence files are temporary under `/tmp/vistep-airfoil-review/`: measurements.json, screenshots and isolated fixture scripts. These are not production assets or a second canonical content source.

**Still parent review:** the actual registered page and transport, complete continuous silent playback, authored narration synthesis and full bilingual listening, real device performance, integrated offscreen/background/reduced-motion behavior and full site build. Static/sample measurements are not full viewing or physical-phone evidence. The cover is compiler-checked; complete integrated cover/page visual review remains with the parent.

## Handoff contract

The scene is registered in `src/data/topics.ts`, with authored bilingual cues in `src/data/narration.json`, measured windows in `src/data/film-timeline.json` and assets in `src/data/audio-tracks.json`. Authored wording was frozen before synthesis; measured integration is recorded below.

Implementation and registration: `src/models/airfoil.ts`, `src/models/airfoil.test.ts`, `src/components/experiments/Airfoil.tsx`, `src/components/lab/AirfoilTunnel.tsx`, `src/styles/airfoil.css`, `src/components/covers/AirfoilCover.astro`, `src/content/airfoil.mdx`, `src/content/en/airfoil.mdx`, `docs/examples/airfoil-brief.md`, `docs/zh-CN/examples/airfoil-brief.md`, `src/data/narration.json`.

## Measured integration

Both recordings are 188 seconds. Earlier 176-second storyboards describe the production draft; the measured chapter windows below are authoritative. The film director follows these chapter windows and the media clock. Full integrated viewing and native listening remain separate review tasks.

Chinese: `/narration/airfoil-zh-abaeb64d1cc4.mp3`. English: `/narration/airfoil-en-f8fdadcce5b1.mp3`.

| Chapter | Window (s)  | Focus                        |
| ------- | ----------- | ---------------------------- |
| 1       | 0–22        | Begin with symmetry          |
| 2       | 22–45       | Change incidence             |
| 3       | 45–67.5     | The trailing-edge condition  |
| 4       | 67.5–90     | Sum the whole surface        |
| 5       | 90–114.5    | No appointment downstream    |
| 6       | 114.5–139.5 | An independent contour check |
| 7       | 139.5–162   | Reverse the lift             |
| 8       | 162–188     | The square of wind speed     |
