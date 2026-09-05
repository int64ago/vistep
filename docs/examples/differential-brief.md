# Differential — different paths, one constrained mean

[简体中文](../zh-CN/examples/differential-brief.md)

## Argument and visual direction

The first observation is a turning axle: the outside wheel follows a longer arc in the same time. A cutaway then connects that road requirement to two different motions of a spider pinion. It orbits with the carrier in straight travel and also spins on its own shaft when the side speeds differ. The speed constraint leads into a separate torque-capacity experiment; a slow wheel is not automatically the wheel with greater torque.

The scene is a machined bench differential in teal, bronze and cool steel. Two spherical-involute side gears and two pinions share an apex. Half-shafts end before the intersecting cross pin, and connect the gears to two wheels. Four carrier bridges join the end plates and central cross-pin support. Hollow trunnions run inside fixed plain journal bearings mounted on a pedestal. Pinions have integral hubs and rear support surfaces. Input is applied directly to the carrier; the final-drive gear pair and production axle casing are explicitly omitted.

This is an original procedural object with closed conical tooth solids, not cylinders with decorative teeth. The tooth flanks, contact highlights, gear phases, shafts and wheel markers all use the independent model. The cover projects the same local bevel model into a complete 400 × 230 SVG; it accepts an optional color. No external assets, manufacturer CAD, textures, photographs or generated imagery are used.

Phone chapters choose one causal view. Wheel paths, the mean-speed diagram and torque limits replace the 3D stage when they carry the explanation. Mechanical chapters use a separate central-gear close-up; the caption identifies half-shafts continuing to wheels outside the close-up. Secondary details stay collapsed. This avoids stacking the whole desktop assembly, chart and repeated readouts on a narrow page.

## Storyboard and narration handoff

The packet requests 176 seconds: eight 22-second windows with 21.5-second spoken cues beginning 0.45 seconds into each window. Chinese and English scripts are separately authored. Their final recorded lengths and the shared timeline belong to the parent. The scene reads chapter/progress, so measured voice timing does not change its mechanism constraints.

| Window    | Visible causal change                                                                                                    | Observation                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| 0–22 s    | One axle advances along two concentric road arcs; traveled lengths grow.                                                 | The outside wheel needs more rotation in the same time.        |
| 22–44 s   | Equal wheel speeds carry both pinions around without local spin.                                                         | Orbit and spin are different motions.                          |
| 44–66 s   | Differential speed introduces local pinion spin; common pitch cones appear briefly, then conjugate contact marks remain. | Intersecting shafts and tapered teeth connect the two outputs. |
| 66–88 s   | The carrier rate stays fixed while an analytic speed-difference pulse grows and recedes.                                 | One side loses exactly the speed the other gains.              |
| 88–110 s  | A bench constraint holds the left wheel; the right turns at twice carrier speed.                                         | Holding a wheel is different from locking the differential.    |
| 110–132 s | Equal side torques appear beside unequal side powers.                                                                    | Equal torque does not imply equal speed or power.              |
| 132–154 s | The left reaction ceiling falls from 300 to 60 N·m with identical prescribed speeds and request.                         | The weaker reaction limits both side torques.                  |
| 154–176 s | Return to the connected assembly and ordinary turning motion.                                                            | Different paths coexist with one mean-speed constraint.        |

Topic metadata, translations and narration are integrated in canonical registries; the temporary handoff has been consumed. `src/data/narration.json` and `src/data/film-timeline.json` own the recorded timing.

## Independent model and geometric derivation

Use one spatial positive axle direction for the two wheel speeds and carrier. For equal side gears, `ωL = ωC − Δω`, `ωR = ωC + Δω`. With 24-tooth side gears and 16-tooth pinions, each pinion's outward local spin is `−(24/16)Δω`. Its stationary-frame angular velocity also includes carrier rotation. Gear frames are proper orthonormal bases; all axes intersect at the origin before a single carrier rotation is applied.

The road model uses track `b = 1.6 m`, wheel rolling radius `rw = 0.31 m` and a signed turn direction. With axle-center turn radius `R`, `Δω/ωC = ±b/(2R)`. Shared yaw produces both wheel paths, with the axle staying exactly one track width long. At `R = b/2`, the inside wheel stops. This is a valid limiting case of the two-wheel rolling-axle model, not a steering or safety claim for a complete car. Held-wheel and held-carrier modes are bench tests and do not generate road paths.

For the 90° bevel pair, `δS = atan(24/16)` and `δP = atan(16/24)`. The cone angles add to 90°. Circular pitch at cone distance `r` is `2πr sin(δ)/z`, identical for both gears and tapering toward the apex. Pressure angle is 25°; the base cone obeys `sin(δb) = sin(δ) cos(25°)`.

The spherical involute is independently derived by unwinding a tangent great-circle arc from a base circle on the unit sphere. For polar angle `θ`, let `L = acos(cos θ / cos δb)` and `invS(θ) = L/sin δb − atan2(sin L, sin δb cos L)`. Tooth half-width in azimuth is `π/(2z) + invS(δ) − invS(θ)`. Scaling each ray through the apex produces the tooth flank between cone distances 0.86 and 1.36 in illustration units. Reduced addendum avoids a contact interval below the base cone; the root extension is radial. Tooth surfaces are numerically sampled for rendering, while contact is solved on the analytic flank.

Both pinions start half a pinion-tooth pitch from their corresponding side-gear phase. The even 24:16 counts make the opposite pair consistent too. Active contact solves zero relative normal velocity and checks the companion flank location. Continuous contact tests cover a full tooth cycle; bidirectional surface samples check all four meshes. These checks establish the declared ideal geometry at their stated sampling density, not a production CAD collision or machining certificate. Root fillets, tool generation, backlash, elastic contact and friction are absent.

Angles normally use rate times absolute model time. Chapter four instead analytically integrates its changing differential rate, `Δω = 0.9 × 0.7 sin²(πp)`, over eight model seconds. This avoids incorrect angles from multiplying the current rate by elapsed time. All chapter state reconstructs without a separate frame history or random input.

## Torque assumptions and exploration

The load calculation is an ideal quasistatic capacity model, separate from prescribed motion. With negligible gear inertia, friction and losses, equal side torques follow pinion balance. Given a nonnegative carrier request and two declared tire reaction ceilings, `Tside = min(Trequest/2, CL, CR)` and `TC,accepted = 2Tside`. A request of 400 N·m with one ceiling at 60 N·m supports 60 N·m per side and 120 N·m at the carrier. The unmet 280 N·m is not treated as delivered input or dissipated power.

Power uses `PL = Tside ωL`, `PR = Tside ωR`, `PC = 2Tside ωC`; the signed balance also holds during reverse and carrier-held motion. The model does not predict wheel acceleration, tire slip, vehicle acceleration or exact real-road traction. Tire ceilings are teaching inputs, not measured coefficients. It avoids the incorrect explanation that all torque is sent to the weak wheel. Limited-slip, locking and brake-control systems are outside scope.

Exploration changes inspection time, carrier/right-side input speed, turning radius/direction, wheel constraints, torque request and both capacity limits. Comparisons retain the same request, prescribed speeds and time. Every range has a stable explicit label association. Reset restores every input plus mode, view, direction and time. The 2D fallback preserves the gear topology, common apex, wheel phases and numeric speed/torque arguments, while clearly remaining a kinematic schematic rather than a CAD tooth drawing.

## Primary sources and provenance

Researched 2026-09-05. Sources support the principles; the equations and procedural implementation are independently authored.

- [MathWorks — Differential](https://www.mathworks.com/help/sdl/ref/differential.html): speeds relative to the carrier and ideal power balance.
- [MathWorks — Custom Gear Library](https://www.mathworks.com/help/sdl/ug/custom-gear-library.html): ideal differential mean speed and equal side torques.
- [Eaton — Open differential](https://www.eaton.com/gb/en-gb/products/differentials-traction-control/open-differential.html): turning function and traction limitations. Marketing shorthand about the weak wheel is not used as the torque equation.
- [KHK — Bevel gears](https://khkgears.net/product-category/bevel-gears/): intersecting shafts and tapered bevel geometry.
- [Lee, Lee & Chung, 2010](https://journals.sagepub.com/doi/10.1243/09544062JMES1624): spherical-involute bevel kinematics; the accessible abstract was consulted, not a claimed full-paper review.
- [US20160047454A1](https://patents.google.com/patent/US20160047454A1/en): primary published spherical-involute geometry, base-cone relation and great-circle construction.

## Verification and remaining review

- `pnpm exec vitest run src/models/differential.test.ts`: **12 passed**, Vitest 5.0.0 / Node 24.19.0. Covers mean speed and angles, straight/held/reverse/zero limits, exact circular-path joints and sampled arc lengths, tapered pitch and shaft frames, 181 contact phases, 73 phases of bidirectional active-flank sampling across all four meshes, torque ceilings, signed power, deterministic seeks, the analytic speed-sweep derivative and invalid inputs.
- Repository strict TypeScript options over the five topic TS/TSX entry files: zero diagnostics, no emitted files. Packet validation checks exact root/cue keys, required related slugs and sources, file paths, bounded cue windows, all UI/metadata translations and no shared-dictionary conflicts. Astro cover compiler: zero diagnostics. Both MDX files compile through the installed Astro Satteri renderer.
- An isolated Vite 8.2.2 harness and a private Chrome 152 headless profile rendered this scene without touching shared registrations or the parent's browser. Desktop mechanism stills and phone mechanism/torque stills were visually inspected. At 320 CSS px, all eight Chinese watch chapters measured 700–766.1 px high; English measured 700–882.1 px. Document and scene widths remained 320 px. These are CSS viewport measurements, not physical-phone evidence. The shared transport is outside this harness measurement.
- Chrome's accessibility tree reported translated names for all six manual ranges; each range measured 44 px high. Keyboard End changed all six values to their maxima. After changing direction, constraint and view, reset restored time 0 s, input 0.9 rad/s, radius 2 m, request 400 N·m, limits 60/300 N·m, turning left and the mechanism view. A straight-path check confirmed the explanation switches to equal distances. Deliberately losing WebGL produced the 2D mechanism without runtime exceptions, at 796.5 px scene height and 320 px document width; its still was inspected.
- Shared `Studio` supplies reduced-motion support, offscreen/background behavior, WebGL loss fallback and disposal of geometries, materials, controls and renderer. The topic adds no independent animation timer. Lifecycle support is established by reuse and source inspection; the isolated interaction test specifically exercised context loss, not a device performance or disposal-memory profile.

Not claimed: full uninterrupted 176-second viewing, measured voice synthesis, bilingual listening, physical-phone performance, final integrated routes/player controls or release verification. Parent owns those checks and all shared build, narration, registration and publication outputs. No production/preview build, shared audio generation, shared formatting or git operation was run by this worker.

## Recorded integration

Both languages run **192.0 seconds**. Chapter starts in seconds: 0, 24.0, 47.5, 71.0, 95.0, 119.0, 143.0, 168.5. Authored words are unchanged; animation reconstructs from the same chapter progress.

zh: `/narration/differential-zh-f93aef315542.mp3` · en: `/narration/differential-en-189d55e877ed.mp3`
