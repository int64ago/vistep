# Suspension — take the bump, control the bounce

[简体中文](../zh-CN/examples/suspension-brief.md)

Current recording revision (2026-09-06): both tracks run **185.5 seconds**. See [the refinement record](../qa-expansion-refinements.md) for the updated windows and review limits. Earlier recording names, timings and review results below describe the preceding version.

## Causal argument and visual direction

A soft suspension sounds comfortable, but storing energy and dissipating it are different jobs. Follow road displacement through tire compression, unsprung motion and body motion. Isolate stiffness, then damping, with the same initial state, road and inspection time. The final contact chapter stops at the edge of the linear tire model instead of inventing an airborne continuation.

The object is a finely finished quarter-car vertical shaker rig: ceramic-colored body slab, copper spring, sectioned teal damper, dark tire, machined rim, carrier, vertical guides and bolted shaker pedestal. The wheel does not spin because the test input is vertical. Guides explicitly represent a laboratory constraint, not automotive wishbones. Spring seats, damper eyes, piston and rod remain connected to their modeled attachments. The tire contact follows calculated compression. The energy shot fades the tire to expose the cylinder window and piston.

Phone composition changes by chapter. Connection chapters keep the complete rig and one useful observation. Stiffness/damping comparisons give the shared-axis trace the main stage, with concise colored parameter keys; they do not stack two assemblies. The contact chapter uses a compact tire cross-section with the load curve. Secondary assumptions stay collapsed. The 2D fallback is a separately authored connected mechanism using the same model pose. No remote images, textures or manufacturer CAD are used.

## Film before measured audio integration

The packet requests 176 seconds: eight 22-second chapters, with independently authored Chinese and English speech beginning 0.45 seconds into each window and a minimum 21.5-second window. The parent owns measured synthesis and central timeline updates. Each chapter uses `useShowcase` chapter/progress, so a revised shared duration preserves the event sequence.

| Window    | Visible event                                                                      | Causal observation                                                 |
| --------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 0–22 s    | Smooth road bump enters a complete connected rig.                                  | Tire, wheel and body respond differently.                          |
| 22–44 s   | Damper coefficient is zero; the bump passes and motion persists.                   | An ideal spring returns stored energy.                             |
| 44–66 s   | 12 and 30 kN/m springs receive the same bump, both undamped.                       | Softer changes static sag and oscillation timing, not dissipation. |
| 66–88 s   | The same spring is shown with zero and 1.4 kN·s/m damping.                         | Damping lets oscillation energy leave.                             |
| 88–110 s  | Body released from 40 mm on a fixed road; tire fades for damper inspection.        | Mechanical energy falls as integrated dissipation grows.           |
| 110–132 s | 1.4 and 6.5 kN·s/m dampers traverse the same bump; acceleration traces share axes. | Stronger damping can transmit rapid input more strongly.           |
| 132–154 s | A windowed 10.4 Hz ripple approaches zero tire load, then holds the boundary.      | Linear contact cannot continue as a tensile tire.                  |
| 154–176 s | Complete default rig returns for a final shared input.                             | Body response, travel and contact are separate outcomes.           |

The contact chapter maps its first 84% to the calculated contact-limit time and holds only its final 16%. The release chapter inspects three physical seconds; other chapters inspect one eight-second physical response over the chapter window. No repeated loop is stretched under narration.

## Model and limits

Upward body and wheel displacements `zs, zu` are measured from static equilibrium. The passive equations are `ms*zs'' = -ks*(zs-zu)-c*(zs'-zu')` and `mu*zu'' = ks*(zs-zu)+c*(zs'-zu')-kt*(zu-r)`. Total normal load is `N=(ms+mu)*g+kt*(r-zu)`. Defaults: sprung mass 300 kg, unsprung mass 45 kg, spring stiffness 18 kN/m, damping coefficient 1.4 kN·s/m, tire stiffness 180 kN/m. These are teaching choices, not manufacturer-fit data or a vehicle recommendation.

A fixed 1/600 s RK4 grid integrates positions, velocities, damper dissipation and road work. Seeks take the stored preceding state plus a fractional RK4 step; render cadence never changes the response. Paired runs share the same road and initial displacement, and both stop at the earliest zero-normal-load event. Boundary refinement uses 32 bisections. The linear tire is valid only before that event; there is no flight, impact or recontact prediction.

The smooth bump lasts 0.48 s starting at 0.8 s. The ripple uses a five-second sine-squared envelope with an analytic derivative. Inputs are road-platen displacement, not vehicle speed. Energy is the positive quadratic perturbation energy relative to static equilibrium: mass kinetic terms plus spring and tire incremental elastic terms. Damper power is `c*(vs-vu)^2`; road power is `kt*(r-zu)*r'`. The numerical balance is `E+D=Einitial+Wroad`. The fixed-road release gives the clean `Wroad=0` demonstration. Cumulative joules are not oil temperature.

Spring free length remains 640 mm; static compression is `ms*g/ks`. The rendered installed length adds relative displacement to that equilibrium length. The drawn coil identifies a linear spring but does not compute stiffness from wire geometry. Tire free radius is 340 mm and static compression is `(ms+mu)*g/kt`. Bottom contact vertices flatten to the modeled road level. The fixed-length damper cylinder is 550 mm and rod 550 mm; piston insertion follows the two attachment positions. Damping never changes the part dimensions. Pitch, roll, friction, tire damping, travel stops and nonlinear valves are excluded. No exact safety, stopping-distance or grip claims are made.

## Primary sources and provenance

Research date: 2026-09-05. Equations and all artwork are authored within this topic; no external assets were copied.

- [MathWorks quarter-car equations](https://www.mathworks.com/help/mpc/ug/admm-based-mpc-control-for-quarter-car-suspension.html): sprung/unsprung masses, spring/damper/tire forces; this scene sets the active actuator force to zero.
- [MathWorks suspension design through system simulation](https://www.mathworks.com/company/technical-articles/optimizing-vehicle-suspension-design-through-system-level-simulation.html): compare body acceleration, suspension travel and road cases rather than asserting one universal setting.
- [Monroe shocks and struts](https://www.monroe.com/technical-resources/shocks-101/shocks-vs-struts.html): relative-motion damping and hydraulic conversion of mechanical energy to heat; dampers do not normally provide the spring's static support role.
- [MathWorks automotive suspension](https://www.mathworks.com/help/simulink/slref/automotive-suspension.html): model simplifications and velocity-dependent nonlinear damping in more detailed models.

## Integration and evidence

Packet: the central topic, narration and translation registries. Exact top-level keys are `topic`, `component`, `cover`, `translations`, `narration`. Topic includes primary sources and omits the parent-assigned number; related slugs are registered pendulum, hydraulic brake and four-stroke engine. Shared translation values are preserved. The self-contained 400 × 230 SVG cover accepts an optional `color` prop. Spoken scripts are fully authored; the parent owns all audio generation, shared registration, builds and release.

The scene has no independent motion timer. Shared `Studio` provides reduced-motion handling, offscreen/background rendering pause, WebGL failure and user-selected 2D fallback, plus Three.js disposal. Showcase supplies the shared clock, transport and chapter state. Manual exploration recomputes bounded eight-second traces when a parameter changes, not on each animation frame.

Targeted review results follow. Audio listening, physical-phone performance and final integrated route/player behavior are separate parent review items; a headless viewport cannot establish those.

### Final targeted review — 2026-09-05

- `pnpm exec vitest run src/models/suspension.test.ts`: **13 tests passed**, Vitest 5.0.0 / Node 24.19.0. Coverage includes static equilibrium, analytic uncoupled tire/free-body limits, undamped energy conservation, damper and road-work balance, force signs, analytic road derivatives, seek determinism, step refinement, equal-input/time comparisons, zero-load stopping, spring/tire geometry, piston and guide overlap, decay, invalid inputs and a pose-only zero-stiffness guard. The solver still accepts the valid zero-stiffness dynamical limit; static geometry explicitly rejects it.
- The hardware regression spans 81 ripple combinations, including low-frequency resonance: three stiffnesses, three damping coefficients and nine frequencies. It checks piston clearance, cylinder-to-upper-attachment clearance and guide overlap. Exploration offers 5–45 mm isolated bumps and 5–25 mm repeated ripples. Review found that 45 mm undamped ripples could exceed the original illustrated damper stroke; the final range, fixed 550 mm cylinder/rod and 980 mm guides are verified together. The lower damper attachment sits 150 mm below the wheel center.
- TypeScript `createProgram`, repository strict options, all seven topic TS/TSX entries: **zero diagnostics**, no emitted files. The cover compiled with the Astro compiler with zero diagnostics; both MDX articles compiled through the installed Astro Satteri renderer.
- Packet validation passed exact keys, four sources, three registered related slugs, component/cover paths, eight bounded cue windows, UI and metadata translations, and no conflicting shared translations. All 14 owned files received explicit-list Prettier formatting. No shared build, audio generator, formatter, git or deployment operation was run.
- An isolated Vite 8.2.2 harness used a separate headless Chrome 152.0.7977.76 process and temporary browser profile, not the parent's browser. Key desktop 3D frames and all eight chapter layouts in Chinese/English at 320 px were checked. The final main scene measured **720 px in Chinese** and **720–776.33 px in English** with collapsed assumptions; the English contact-limit notice measured **769.14 px**. Scene and document widths stayed at 320 px. A 720 px minimum reduces movement of the parent transport; its integrated surrounding chrome still needs parent review.
- At 390 px, a real arrow-key event advanced the inspection slider from 0 to 0.01 s. All scene ranges measured 44 px high, and action buttons at least 44 px. Selecting ripples bounded amplitude to 25 mm. Calling the isolated WebGL context's loss extension removed the canvas and produced the connected, transparent-tire 2D energy view without a runtime exception. A fallback sizing issue found in that review was corrected with topic-scoped bounds and checked again.

Remaining evidence: complete uninterrupted final playback, the measured bilingual audio and listening, integrated transport/autoplay behavior, physical-phone rendering performance, final route/404 behavior and production/preview builds belong to the parent handoff. Reduced motion and offscreen/background pause use the shared infrastructure but were not independently timed in this scene review. The narration packet is stable for synthesis.

## Measured integration

Both language tracks measure 185.5 seconds, sharing eight chapter windows. Assets: `/narration/suspension-zh-273b77854e47.mp3` and `/narration/suspension-en-dd0c4886439b.mp3`. The parent confirmed all existing 26 narration, manifest, track and timeline entries remain semantically unchanged. The temporary packet has been consumed; canonical scripts now live in `src/data/narration.json`. Independent transcription and final browser review are in progress. Native listening and physical-phone measurements remain outstanding.

Final independent transcription: all 16 chapter/language pairs passed; minimum similarity 0.9101, minimum ending coverage 0.9167. This is not a listening judgment about natural delivery.
