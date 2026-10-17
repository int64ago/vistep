# Helmholtz resonator — author brief

Status: source package; speech **draft**. Browser review, complete player measurement, playback, listening and device performance are not-run by this author. Author tests are not independent acceptance.

## Editorial purpose

Resolve “the entire bottle contains a short standing wave” and “more moving mass always lowers pitch.” Prerequisites: compression raises pressure; inertia carries motion through equilibrium. Distinct from `organ-pipe`: approximately uniform cavity pressure and lumped neck inertia, not distributed pressure nodes. The water is a static volume setting, not a water oscillator.

## Read evidence and explicit assumptions

Actually read [UNSW Music Acoustics: Helmholtz Resonance](https://newt.phys.unsw.edu.au/jw/Helmholtz.html), including Analysing, Complications and guitar qualifications. Did not count a timed-out Physclips compliance page as read.

| Claim                                                                 | Source and condition                                          | Oracle / counterexample                                                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Compact cavity supports nearly uniform pressure; neck air is inertial | UNSW Analysing; wavelength much longer than body, rigid walls | λ readout compared with fixed 15.8 cm body; not a distributed-pipe model                                                  |
| Small adiabatic pressure is proportional to swept volume              | Same derivation, small displacement                           | Independent finite-volume P(V+Sx)^γ law approaches linear p; finite-difference acceleration equals pS/m                   |
| f = c/(2π) √[S/(VL_eff)]                                              | Same derivation                                               | Source's 1 L, 3 cm², 5 cm effective neck gives about 130 Hz (calculated 133.7 at c=343); test without end correction      |
| External and internal air add inertia beyond geometric neck           | UNSW Complications, approximate 0.6r outside plus 1r inside   | Fixed geometry, add correction: mass increases and f falls; widening adds mass but raises f, so mass-only reasoning fails |

Air c=343 m/s, γ=1.4, P₀=101325 Pa and consistent ρ=γP₀/c². Cylinder radius 0.055 m and maximum cavity 1.5 L; a stationary water plane determines actual air volume. Neck radius 8–15 mm, length 20–80 mm, V=0.5–1.5 L. No excitation, wall/water motion, damping, losses, nonlinear jet or higher cavity modes. End constants are approximate, not a precision bottle tuner. Gold air motion ×80; pressure fill illustrates true signed pressure with normalized contrast.

## Independent form and six new observations

Dark glass laboratory vessel, air and liquid in one fixed physical scale. The neck is integrated into the lid; no detached decorative spring. Particle rows occupy the effective moving air and translate together. A uniform cavity-pressure tint, a connected signed pressure column and paired energy strip are driven from the same state.

1. Outward air displacement lowers cavity pressure; inward raises it.
2. Quarter-cycle: zero pressure at equilibrium coincides with maximum kinetic energy.
3. Static water rises: true remaining air volume shrinks and f rises.
4. Neck physically lengthens at fixed radius and cavity; inertia increases.
5. Neck physically widens; pressure restoring effect changes with swept volume and force area.
6. Same vessel, effective-air outline grows beyond both ends and f decreases.

Desktop bounded 980 px wide / 310 px stage. Phone has separate 340×310 viewBox and 230 px stage, no SVG text, CSS labels ≥16 px. Two compact readouts and a seven-pixel energy track; long qualifications hidden during phone watch. Longest bilingual caption + transport full-player measurement remains integrator work. No independent visual acceptance is claimed.

## Verification

Six model tests cover independent numerical benchmark, geometric scaling, exact adiabatic small-displacement limit, Newton equation, phase-invariant energy, end correction and invalid inputs. Scoped TS, MDX and packet validation to be recorded on handoff. Exploration geometry and automatic chapters use identical functions. No audio or publication performed by this author.
