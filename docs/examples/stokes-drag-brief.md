# Stokes drag — author brief

Status: source package,6×24s speech draft. Browser key shots, full play, complete phone player, listening and physical-device performance not-run by author. Model tests are not independent visual acceptance.

## Editorial distinction

No inertial wake does not mean zero drag. Low-Re rigid-sphere drag is linear in speed; prescribed speed and terminal settling are different questions. The result must satisfy its own Reynolds-number premise. Prerequisite: velocity, force balance, viscosity. Adds a stated hydrodynamic law to `buoyancy` and contrasts the viscous limit with `bernoulli`.

## Actually read source and independent oracles

Read all6pages of MIT OCW1.63J Chiang C.Mei [Stokes flow past a sphere](https://ocw.mit.edu/courses/1-63-advanced-fluid-dynamics-of-the-environment-fall-2002/359411f0a9d2cd5b7368dab9cc34cdd7_25Stokes.pdf), streamfunction, no slip, fore/aft symmetry, pressure/stress, drag and settling examples. Also read Cambridge Hinch rigid-sphere sedimentation section as crosscheck, but use the MIT stress equations for implemented traction integration. No notes artwork/code/text copied.

| Claim                                                  | Boundary                                                                              | Independent check                                                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| F=6πμaU                                                | Rigid no-slip sphere, unbounded incompressible Newtonian fluid, steady creeping limit | Numerically integrate pressure and shear surface tractions over20000polar bands; sum recovers6π; shear twice pressure contribution |
| Analytic field no-slip and uniform far field           | Full3D axisymmetric solution, meridional slice                                        | 20surfaceangles have both components0; far field approaches prescribed U                                                           |
| Streamfunction contour and timed marker are same field | Non-axis impact lines avoid stagnation endpoint                                       | Independently evaluate invariant at101points; finite marker displacement matches local velocity within4% discretization bound      |
| Terminal force balance includes buoyancy               | Terminal states only, no startup history force                                        | MIT10µm sandρ2500/waterμ.001 gives.327mm/s,Re.00654; B+drag=W; negative density contrast reverses                                  |
| Prescribed drag∝a but terminal speed∝a²                | Same material properties and low-Re validity                                          | Independent ratios2vs4; zero speed gives zero force/motion                                                                         |
| Formula cannot certify high-Re trial                   | ExplicitReusingdiameter                                                               | μ.001,default.3mmsphere trialRe>100 fails; field withheld and speed qualified, not fake turbulent drawing                          |

No Basset/added mass or acceleration history model. Equal parameter changes compare prescribed steady states. Re.1 is a conservative display choice, not a universal precision or turbulence threshold. Default sphere.3mm,μ.1,ρf1000,ρs2500; manualρs800–3000includesneutral/risingcounterexample. All exposed manual states remain lowRe; last automatic chapter deliberately tests a failing trial.

## Art and six observations

A pale microscale sphere with actual3D streamfunction sections, identity-preserving coloured fluid markers and physical force arrows. Symmetric curves are not proof of potential/no-drag flow. No invented downstream vortex or cylinder streamfunction. Sphere radius on a fixed world scale and actual surface condition define every path. Along-path unit-speed time integral, scaled by true U, determines marker position.

1. Slow sphere-relative flow, near-wall no slip and nonzero drag without a large wake.
2. Fixed a/μ, vary prescribed U:linear force.
3. Fixed a/U, vary μ:force rises while contours/velocity boundary stay.
4. Fixed U/μ, double actual a:force doubles, not area×4.
5. Terminal mode:increaseρs, true B/W/drag balance, nonzero relative speed; no startup trajectory claim.
6. Lowerμ logarithmically:conditional terminal trial fails Re premise. Switch to explicit logRe region, not a fabricated high-Re field.

Desktop max980/stage320px, phone340×280/stage200px. Eight contour families avoid clipped curves; small glyphs carry no prose. CSS16px, boundary-log ticks26units. Force glyphs share fixed10px/µN phone/12desktop scale, with short-arrow heads capped; extreme mass/radius must be checked as well as signs. Fullplayer≤740px, field clarity, zero/reverse/neutral manual states remain root browser checks.

## Verification

Six meaningful tests: source benchmark, boundary/far field, independent surface traction quadrature, streamfunction/advection, force/size/sign/zero and applicability rejection. Scoped TS/MDX/packet/EN numeric checks reported on handoff. No shared integration or audio generation by author.
