# Helicopter production brief

[简体中文](../zh-CN/examples/helicopter-brief.md) · [Production guide](../creating-a-scene.md)

Follow one copper blade to answer: how can wings lift an aircraft whose cabin stays in one place? The reader first sees a complete original civil helicopter, then watches pitch, force direction and tail compensation change on that same aircraft. The appearance is generic and is not presented as a certified aircraft model.

## Direction and source basis

Use a restrained sage-painted fuselage, smoked blue glazing, connected skids and tail boom, a visible teetering hub, and one copper tracking blade. Painted skin and glass share a continuous loft and exact boundary vertices, with real window rims, a windshield mullion, door seams, seats and an instrument panel. The engine enclosure is a separate connected faceted fairing with ventilation detail. No intersecting ellipsoids create the windshield.

The aircraft or its real connected assembly remains the principal object in all seven chapters. The actual blade is cut at 0.75R for a macro view; the next chapters move in to connected roots and track the copper root around one turn. A fixed whole-aircraft location guide remains in the corner, while one short pitch curve accompanies the moving root. Thrust, weight and tail thrust are anchored on the aircraft. There is no invented trajectory, atmospheric particle field or flight-dynamics animation.

Primary references:

- [FAA Helicopter Flying Handbook, Chapter 2](https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch02.pdf): aerodynamic forces and relative wind.
- [FAA Chapter 3](https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch03.pdf): collective, cyclic and antitorque controls.
- [NASA NDARC Theory Appendix 3, §11-4.1](https://rotorcraft.arc.nasa.gov/Publications/files/NASA%20TP-2009-215402-app3.pdf): ideal induced velocity and uniform-inflow momentum theory.

The cyclic waveform is separate from prescribed disk tilt. The film does not turn a particular mechanical or gyroscopic phase angle into a universal rotor rule.

## Planned film

Seven 24-second minimum windows, 2:48 before measured narration. Shared chapter windows must be remeasured after recording.

| Chapter         | Physical observation                                                  | Changing state                                                        | Phone composition                                                          |
| --------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Rotating wing   | Complete civil aircraft; follow the copper blade around the mast      | Shared slow azimuth; fixed computed rotor speed                       | Whole assembly, force key and two readings                                 |
| Pitch and air   | Copper blade plus a local section magnification                       | Pitch 6° → 10° → 6°; solved inflow changes with lift                  | Actual section macro view, small location guide and 16 px angle labels     |
| Collective      | Both connected blades increase pitch together                         | Hover pitch → +1.8° → hover, constant speed                           | Connected hub/root close-up, thrust/weight pair and one collective reading |
| Cyclic          | Same copper blade at successive positions                             | Cyclic amplitude 0° → 3°, opposite blade half a turn away             | Camera follows the copper root; one short pitch trace                      |
| Tilt            | The same attached teetering rotor follows a prescribed tip-path plane | Disk tilt 0° → 20°, constant collective                               | Aircraft-mounted thrust arrow and two component readings                   |
| Tail rotor      | Sideways arrow begins at the actual tail rotor                        | Compensation 1 → 0 → 1; two moment bars share a fixed 7,000 N·m scale | Aircraft above two wrapping HTML readings and compact bars                 |
| Restore balance | Tilt remains while both blades gain a little collective               | Collective solves T cos β = mg                                        | Aircraft and component readings; horizontal thrust remains                 |

Every chapter’s physical state is a function of chapter progress and the shared film clock. No local animation timer advances the rotor when paused.

## Scientific model and invariants

The near-hover model integrates linear blade-element lift for two untwisted rectangular blades and solves the same uniform induced velocity against `T = 2ρAvi²`. Inputs are collective 4–13°, cyclic amplitude 0–3°, prescribed disk tilt 0–25°, and tail compensation 0–1.4. Rotor radius is 4.5 m, root radius 0.7 m, chord 0.32 m, angular speed 42 rad/s, and mass 1,000 kg. Ideal induced power is `Tvi`, and modeled main-rotor torque is that ideal power divided by angular speed.

The tail rotor’s 4.7 m longitudinal arm is shared by geometry and force calculation. Both opposing blade roots meet the same mast anchor through a rotating teetering hub. With prescribed disk tilt β, each radial axis obeys `y − ymast = −x tan β`. This is connected pose geometry, not a computed flapping response. Profile drag, stall, high-speed forward-flight effects, engine response, lateral trim and full flight dynamics are explicitly omitted.

Meaningful author tests check momentum closure, radial convergence, inverse thrust, vector magnitude, opposite cyclic departures, tail compensation, invalid bounds, deterministic seeks, mast/root contact, static flat-view pixels and complete swept perspective bounds. The renderer and static artwork share surfaces and transformations; exported covers retain their own composition.

## Acceptance record

Targeted author model and geometry checks are recorded in `artifacts/helicopter/`. Rasterized 400×230 and 290×167 cover inspections are author artwork checks. They do not establish browser interaction quality. The integration owner owns actual browser playback, phone viewport measurements, resource failure checks, full validation, bilingual speech production and final release records. Native listening and physical-phone performance require separate evidence.
