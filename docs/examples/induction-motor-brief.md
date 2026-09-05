# Induction motor: let the field lead

[简体中文](../zh-CN/examples/induction-motor-brief.md)

Topic metadata, translations and narration are integrated in the canonical registries; the temporary handoff has been consumed. `src/data/narration.json` and `src/data/film-timeline.json` own the recorded timing.

## Causal argument and visual direction

The rotor has no supply leads and no permanent magnets. Follow a calculated rotating field into a complete, short-circuited cage. The turning point is synchronism: catching the field removes rotor induction and driving torque. A loaded induction motor needs a small speed difference, and that difference also determines rotor copper loss.

A sectional sage-grey stator opens onto warm copper bars and complete end rings on a dark teal machine bed. Six actual slot cavities clear three continuous saddle winding bundles, each with three illustrated turns, two separate ends, supply terminals, and a connected star return. The cage has 24 axial bars meeting both rings, a laminated core, continuous shaft, key, bearings, and supports. Conductors are geometric paths rather than emissive particles. The model defines the slot clearance, winding paths, bar endpoints, rings, and terminals. The field proof uses an end-on circular slice instead of a generic collection of metric cards. Startup, stability, and energy chapters replace that slice with the specific evidence they need.

| Time      | Visible change                                                                        | Causal observation                                                                                |
| --------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 0–22 s    | Resolve three phase-axis contributions into the rotating green field; hold the rotor. | Balanced currents create a rotating main field even though the stator is fixed.                   |
| 22–44 s   | Follow two field revolutions past the stationary rotor reference.                     | For this two-pole winding, 50 Hz means 3000 rpm synchronous speed.                                |
| 44–66 s   | Reveal signed cage currents and front-ring return directions.                         | Every bar has a closed current path through both end rings.                                       |
| 66–88 s   | Release the shaft and follow a computed speed curve from rest.                        | Electromagnetic torque accelerates inertia; decreasing slip reduces induction.                    |
| 88–110 s  | Prescribe progressively closer-to-synchronous speeds.                                 | Slip, rotor current, and electromagnetic torque reach exactly zero together.                      |
| 110–132 s | Move the stable load intersection from 1 to 4 N·m.                                    | A little more lag produces more torque on the stable branch.                                      |
| 132–154 s | Restart from rest with A–C–B sequence.                                                | Field rotation and the resulting rotor rotation reverse. No live phase-swap transient is implied. |
| 154–176 s | Vary settled load from 1 to 6 and back to 1 N·m; partition input power.               | Both copper losses and mechanical conversion sum to input; rotor heat fraction equals slip.       |

## Phone composition and interaction

The scene switches composition below 620 px of its own width. The phone camera looks more nearly along the shaft, with its own fitting span and target. The machine is 248 px tall in most chapters, 263 px for the cage detail, and 206 px for power. One chapter-specific instrument appears under it; startup, synchronism, load, and power do not keep an extra field diagram. Repeated instrument titles and secondary curve explanations are removed from the phone watch view. The current explanation remains adjacent to the evidence.

The closed-details watch stage has a minimum height to steady the transport and a design target of approximately 900 px or less at a 320 px viewport. Actual rendered phone height has **not** been measured by this worker. Charts keep text in HTML; the field slice uses a local 300-unit coordinate system with 20 px phase letters. Body and control text stay at least 16 px, and all primary actions and ranges are at least 44 px high. Expanded details and optional exploration add content intentionally.

Exploration offers a stable-load solution or prescribed slip, supply-phase inspection, phase sequence, field/torque/power views, and reset. All controls use native focus and keyboard semantics with explicit slider labels. Three-dimensional camera interaction uses the shared Studio controls. WebGL failure or the 2D switch reveals an axonometric cage, rotor reference, windings, and field; the independent end view and numerical instruments continue to operate.

## Shared model and conventions

The linear per-phase circuit is `R1+jX1` in series with the parallel branches `jXm` and `R2′/s+jX2′`. RMS parameters: phase voltage 120 V; frequency 50 Hz; one pole pair; R1 = 0.65 Ω, X1 = X2′ = 0.9 Ω, Xm = 30 Ω, R2′ = 0.5 Ω. These are illustrative equivalent parameters, not a commercial motor specification or a derivation from the display dimensions. The visible three-turn coils represent winding bundles; physical turn count and slot harmonics are not inferred from the artwork.

`ωsync = 2πf/p`, `s = 1 − |ωrotor|/ωsync`, `frotor = sf`. Positive rotation is about +z in the A–B–C sequence. The opposite sequence changes the signs of both mechanical speed and torque, with positive converted power in both motoring directions.

The solver uses rotor admittance `s/(R2′+jsX2′)`, avoiding a singular division by zero at synchronism. `Pgap = 3|Egap|² R2′ s / (R2′²+(sX2′)²)`; rotor copper loss is `sPgap`; converted power is `(1−s)Pgap`; torque is signed `Pgap/ωsync`. Stator copper loss is `3|I1|²R1`; input real power is independently computed from the terminal voltage and complex stator current. Magnetizing current is `I1−I2`; its balanced three-phase spatial sum determines the main-field arrow. Stator phase readouts show actual instantaneous I1 values, not RMS values.

Cage bar currents use the spatial fundamental, equivalent rotor-current amplitude, sequence sign, and slip-dependent rotor impedance angle. They are normalized relative currents, not physical bar amperes. Front-ring segment currents solve `Kj−Kj−1 = Ibar,j` with zero circulating offset; rear-ring currents reverse. This conserves current at all cage junctions. The constant equivalent rotor resistance includes the effective cage loss rather than separately resolving every bar/end-ring resistance.

The low-slip load root is solved below breakdown slip. At this parameter set breakdown is 25.900074 N·m at slip 0.2647304. The manual load range 0–6 N·m stays on the stable branch; loads at or above breakdown are rejected. The full 0–1 slip curve is still drawn to distinguish the other branch. A 6 N·m load has slip 0.02476271. At zero load the idealized equilibrium reaches synchronism, because mechanical losses are omitted.

Startup integrates `J dω/dt = T−1 N·m`, J = 0.025 kg·m², from rest using a fixed 2 ms RK4 table. At 2 s the rotor is approximately 2988.31 rpm. It is a quasi-steady acceleration envelope, not a switching-transient solution. At every point, converted power splits into load power and kinetic-energy increase. Both directional starts replay this trajectory from rest. Prescribed-speed and settled-load shots are comparisons, not free acceleration claims.

Angular inspection slows rotor and supply angles by the same factor; startup axes retain physical model seconds. Changing-speed inspection angles are integrated rather than computed as endpoint speed times elapsed time. Immutable startup and comparison-angle tables are model data, independent of prior renders. The scene uses only shared chapter/progress state and manual inputs. There are no random phases, independently advancing clocks, or animation histories.

Omissions are explicit: core loss, windage, bearing friction, saturation, skin effect, temperature-dependent resistance, winding space harmonics, and fast electrical transients. Geometry is a sectional teaching assembly, not a manufacturing drawing. Calculated efficiency is not a claim about hardware.

## Sources and asset provenance

- [MIT 6.061, J. L. Kirtley: Analytic Design Evaluation of Induction Machines](https://ocw.mit.edu/courses/6-061-introduction-to-electric-power-systems-spring-2011/01f878366fe651f1b95e9ed7fc24c644_MIT6_061S11_ch10.pdf): balanced three-phase machine, referred equivalent circuit, slip frequency, power, and torque.
- [ABB Softstarter Handbook, About Motors](https://library.e.abb.com/public/2985284834bcff7fc1256f3a00274038/1SFC132002M0201.pdf): synchronous speed, asynchronous operation, and motor starting context.
- [ABB: Changing motor direction](https://new.abb.com/news/detail/116436/stop-swapping-wires-change-motor-direction-in-8-seconds-with-this-trick): reversal by exchanging two motor connections or changing drive direction.

All 3D geometry, plots, vector cover, and prose are original procedural work. No downloaded illustrations, textures, recordings, or image assets were added. The 400×230 SVG cover accepts an optional color prop and draws a self-contained machine without a page/card wrapper.

## Checks and remaining review

Targeted Vitest: **12/12 passing**. Tests independently check balanced phase sums and field magnitude/direction, synchronous and locked-rotor limits, input/gap/copper/mechanical accounting over 1001 slip points in both directions, a separate Thevenin torque formula, stable-root selection and rejected overloads, end-ring KCL, bar-to-ring contacts, continuous winding leads, actual slot clearance, startup work/inertia balance, integrated angular speed, arbitrary seek reconstruction, and invalid/deenergized inputs.

The initial exact-equality assertions exposed floating-point differences at ring coordinates and signed zero; geometry comparisons now use a 13-digit tolerance, and zero torque uses a numerical comparison. No physical model discrepancy was hidden by those changes. Independent startup work quadrature agrees with kinetic-energy increase within the specified 0.03% tolerance.

Targeted strict TypeScript checking passed for the model and all three React entry/render files. The packet validator passed for exact top-level keys, repository-relative component/cover paths, 47 UI labels, 62 translations, metadata, all eight captions/titles, chapter timing, existing related slugs, and bilingual anchors, with no shared dictionary conflicts. Only the owned files were formatted.

The shared Studio handles reduced motion, offscreen/background suspension, camera controls, WebGL failure, and disposal of geometries, materials, renderer, observers, and controls. This topic adds one ResizeObserver, disconnected on unmount, and no textures, audio nodes, workers, network resources, or private frame loop.

No shared build, formatter, narration generation, registry mutation, git operation, or deployment was performed. No isolated browser review, full film viewing, voice listening, physical-phone measurement, or frame-rate measurement was available to this worker. Parent owns final player/voice/UI/build review and publication; these remain distinct from the model-test evidence.

Owned files: `src/models/induction-motor.ts`, `src/models/induction-motor.test.ts`, `src/components/experiments/InductionMotor.tsx`, `src/components/three/InductionMotorStudio.tsx`, `src/components/three/InductionMotorFlat.tsx`, `src/styles/induction-motor.css`, `src/components/covers/InductionMotorCover.astro`, `src/content/induction-motor.mdx`, `src/content/en/induction-motor.mdx`, this brief, `docs/zh-CN/examples/induction-motor-brief.md`, and the temporary packet.

## Recorded integration

Both languages run **184 seconds**. Actual chapter starts in seconds: 0, 22, 44, 67.5, 90, 113, 135.5, 159. Authored words are unchanged; measured windows allow breathing room for the longer recording, and the animation reconstructs from the same chapter progress.

zh: `/narration/induction-motor-zh-e61bd29767f4.mp3` · en: `/narration/induction-motor-en-57a8c703cdf4.mp3`
