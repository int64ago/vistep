# Venturi meter — author brief

Status: source package,6×24s draft speech. Browser, complete play, whole phone player, voice and physical-phone performance not-run. Author tests are not independent acceptance.

## Distinction and misconception

Adds inverse measurement, actual static taps and two-liquid hydrostatics to the existing `bernoulli` energy explanation. Focus: Δp is quadratic in Q, narrow geometry alone does not generate flow, and equal opposite flows share these two pressures. No claim that ideal throat differential is permanent loss or that the inverse square root supplies flow sign. Prerequisite: area, volume rate, static pressure.

## Actually read sources and claims

Read USBR Water Measurement Manual [Chapter2 §14](https://www.usbr.gov/tsc/techreferences/mands/wmm/chap02_14.html), energy derivation, throat/recovery and calibrated inverse flow; [§15](https://www.usbr.gov/tsc/techreferences/mands/wmm/chap02_15.html), coefficient limitations and pressure-tap dependence. Also read OpenStax University Physics1 [§14.6](https://openstax.org/books/university-physics-volume-1/pages/14-6-bernoullis-equation), energy assumptions and static/pitot distinctions. No source graphics or code copied.

| Claim                                                | Boundary                                                     | Independent oracle                                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Continuity plus Bernoulli infer                      | Q                                                            |                                                                                                             | Horizontal full liquid pipe, quasi1D, coefficient1, no loss | 50/25mm,1L/s gives.50930/2.03718m/s and1945.37Pa; inverse recovers.001m³/s |
| U-tube difference uses(ρm−ρ), notρm alone            | Same-height flush ports, two static liquids, equal leg areas | Independently close the pressure path through both interfaces; equal opposite displacements preserve volume |
| Δp scalesQ² and is sign-blind                        | Same geometry ideal opposite steady flows                    | Half Q gives quarterΔp; negative Q has equal inverse magnitude                                              |
| Volume-coordinate markers respect local speed        | Numerical area integral and inverse volume map               | Central finite displacement/time compared with independent Q/A(x), <.3% across convergent/throat/diffuser   |
| Pressure recovery preserves total mechanical density | Lossless horizontal model                                    | Sum p+ρv²/2 constant over complete profile; exit returns wide p; Q0 gives no difference or motion           |

Fixed50mm wide pipe,.65m length; smooth cylindrical taper and diffuser. Waterρ1000,manometerρ13600,wide gauge6000Pa. ExposedQ±1L/s and20–40mm throat keep throat gauge positive. Drawn dense liquid is a density example, not a lab operating procedure. No arbitrary discharge coefficient pretending to be calibration; no claimed accuracy. Full velocity profile, viscosity, turbulence, cavitation and transients omitted.

## Art and shots

Dark cutaway metrology pipe with physically connected side static taps, a sealed U tube and distinct water/dense-liquid interfaces. All geometry, markers, pressures and inverse readout derive from the same area model. Labels1/2 remain tied to wide/throat location, not upstream/downstream, so reverse flow is truthful. One gold fluid identity uses the same seed; reversal sample motion returns continuously without claiming a transient fluid solution.

1. Track motion through all three sections and connect the manometer difference to inverse flow.
2. Fixed Q, narrow throat physically; area—not diameter—controls speed.
3. Fixed geometry, vary Q0→1L/s and expose square-law differential.
4. Swap lower manometer view for three stacked p/kinetic bars: equal total and ideal recovery.
5. Zero flow: narrow shape remains, no marker motion or level difference.
6. Opposite prescribed steady flows, same|Q|: marker direction changes but manometer does not determine sign.

Pipe diameter vertical scale enlarged relative to horizontal length; manometer interface displacement has a separate fixed enlargement. Both explicitly disclosed, zero difference exactly0. Automatic trajectories slow10×. Desktop stage320px/max980px, phone340×270/190px,16px CSS and26unit numbered taps. No tiny inset as the only evidence. Completeplayer≤740px, all six frames and exploration negative/zero/extreme flow remain browser review.

## Checks

Six tests cover independent benchmark, U pressure path, calibration/sign, area-coordinate velocity, energy recovery/zero and valid-domain bounds. Scoped TS/MDX/packet/EN spacing recorded at handoff. Dependency `hydrostatic-pressure` may require the combined same-batch packet dry-run. No shared integration or speech generation by author.
