# Viscous layers — author brief

Status: source package,7×22s scripts draft. Independent visual acceptance, full playback, complete-player phone measurement, voice and physical-phone performance not-run. Tests are author evidence.

## Misconceptions and distinct form

Viscosity contrast is not a velocity discontinuity. Constant plate speed still needs power in shear. Bulk translation can have zero shear. Prerequisites: velocity gradients, momentum and work. Complements `stokes-drag` by revealing shear between plates; relates momentum diffusion to `diffusion` and `heat-conduction` without equating transported quantities.

## Actually read source

Cambridge DAMTP John Hinch [Fluid Dynamics II](https://www.damtp.cam.ac.uk/user/examples/D23Le.pdf), §3.1 plane Couette, wall tractions and dissipation, §3.2 interface continuity qualifications and §3.3 momentum diffusion. Steady two-fluid solution follows directly by equal stress and no-slip/interface compatibility. Finite-gap startup Fourier series is independently derived from the same diffusion PDE, not copied from the source's semi-infinite erfc image.

| Claim                                                         | Boundary                                                                                | Independent evidence                                                                                                         |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Steady u and μu_y continuous at interface                     | Infinite plates, zero p gradient, no interface slip/stress, immiscible Newtonian layers | h1=h2=.005m,μ.1/.4,U.01 givesτ.16Pa,ui.008m/s; finite differences recover same stress both sides                             |
| ∫μu_y²dy equals boundary power                                | Same steady conditions                                                                  | Numerical10000strip dissipation quadrature againstτ(Ut−Ub), including reversed lower plate                                   |
| Gap doubles halve τ; equal layers swap preserve τ but alterui | Fixed layer fraction and plate speeds                                                   | τ×.5, swapui.008→.002; both plates at.01 givesu.01 everywhere andτ/power0                                                    |
| Startup momentum obeys diffusion and wall traction imbalance  | Uniform fluid, no pressure gradient, rho1000                                            | Independent finite derivatives recover PDE; integratedρu_t matchesτtop−τbottom; time derivative of dye displacement matchesu |
| Startup goes to Couette profile                               | Same top/bottom no slip                                                                 | Explicit plate boundaries, long-time linear interior; t0stressnullable rather than a false finite value                      |

Steady geometry changes are separate prescribed-state comparisons, not unmodelled squeeze flow. Steady marker displacement is u(y)t from a common reference. Startup displacement analytically integrates each exponentially decaying Fourier term.100terms, shown≥.01s. No mixing, interface deformation, Marangoni, turbulence or thermal evolution. No solid isolated slabs passing without momentum transfer.

## Direction and new evidence per chapter

A pale physical shear cell, moving plate material marks, one continuous gold material line and same-height green velocity profile. Explicit fixed initial dashed reference. Layer colours follow identities when swapped. Gap changes actual vertical geometry on a fixed scale; material and graph come from one profile. No generic numeric cards as the main mechanism.

1. Uniform startup:upper influence diffuses, transient material line curves.
2. Steady uniform:dye line slants linearly from actualu(y)t.
3. Increase topμ:continuous line with slope kink, equal stress across interface.
4. Compare fixed gaps5→15mm at same speeds and fractions:gradient/stress decrease.
5. Swap equal-thickness identities:ui and kink change,τsame.
6. Continue steady motion:plate power equals actual integrated dissipation, no pretend temperature solver.
7. Both plates translate:vertical material line moves without tilt,τanddissipation0 despiteflow.

Desktop max980px/stage320px; phone340×270/stage190px. All prose CSS16px, no SVG text. Dyes are kept inside cell at manual±20mm/s,2s; graph spans negative and positive speeds. Manual startup hides irrelevant upperμ and layer-fraction controls. Fullplayer≤740px, startup/zero/reverse signs and actual layer clarity remain root browser review.

## Verification

Six model tests cover independent benchmark, interface finite derivatives, dissipation quadrature, gap/order/rigid counterexamples, startup PDE/momentum/displacement and boundaries. Scoped TS/MDX/packet/EN numeric spacing reported at handoff. No shared integration or audio generation by author.
