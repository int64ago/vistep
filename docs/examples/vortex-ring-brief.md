# Vortex ring — author production brief

Status: nine-file source package; speech is draft pending the integration owner's decisive desktop and phone review. Browser, full playback, voice listening, phone hardware and resource-failure QA: not run by author. Model checks are not independent acceptance.

## Misconception, scope and portfolio

Question: how can a ring advance while fluid rolls around it? The side section has two oppositely directed cores belonging to one closed vortex, not two smoke rings. Fluid speed at the axis is not ring speed; the ring is not a rigid collection of material points. Prerequisites: velocity, section, signed rotation. Distinct from `viscosity-layers` (viscous momentum diffusion) and `stokes-drag` (creeping flow around a solid): this is a fixed-shape, idealized self-inducing vortex. It deliberately excludes nozzle formation and the smoke concentration field.

## Sources actually read and claim ledger

| Claim                                                                                      | Primary reading                                                                                                                                                                          | Conditions                                                                          |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Directed filament circulation and Biot–Savart velocity                                     | MIT Unified Engineering F6, pp.1–2, [lecture PDF](https://ocw.mit.edu/courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/c1bfd53262231a2e5e77b660b7085c16_f06_0304.pdf) | Ideal filament; right-hand direction                                                |
| A toroidal vortex induces its own translation; local fluid motion differs from translation | Moffatt 2011, §§2–3, pp.2–5, [chapter PDF](https://www.damtp.cam.ac.uk/user/hkm2/PDFs/Moffatt_2011_WorldScientific_Abitvdat_1.pdf)                                                       | Uniform-density incompressible unbounded fluid; core structure matters              |
| Physical core structure changes thin-ring self-speed constants                             | Same chapter, thin-core discussion                                                                                                                                                       | Its uniform-core asymptotic constant is not applied to our smoothed-filament kernel |

Numerical teaching regularization: replace |r|³ with (|r|²+a²)³ᐟ² in the line integral; this is explicitly not a physical uniform-vorticity core. An analytic elliptic-integral evaluation is derived from that same integral. Do not claim all vortex lines in arbitrary flows must form simple closed loops; the reading explicitly discusses more general topology.

## Independent oracles and counterexamples

Tests independently integrate the vector Biot–Savart line integral with 4096 segments at off-axis 3-D points and on the filament, comparing the elliptic implementation at 11 decimal places. On-axis field is separately checked against ΓR²/[2(R²+x²+a²)³ᐟ²]. AGM elliptic integrals match standard m=0.5 constants. Default R=20 mm, Γ=0.001 m²/s, a/R=0.12 gives U-ring≈12.700531 mm/s. Negative circulation reverses all components. Fixed-ratio geometric scaling is Γ/R. A finite-difference divergence check enforces incompressibility away from the filament. RK4 steps 0.02 and 0.01 agree within 1e-5 at dimensionless time 8, and marker velocities agree with u−U-ring. Far-field laboratory velocity tends to zero; zero circulation stops the field. Core widening changes speed at fixed R and Γ, a counterexample to diameter-only explanations.

## Art direction and six new causal views

A restrained blue-grey flow engraving with one gold material marker, pale computed trajectories and luminous core sections. A ring projection rotates into a meridional section. Dot/cross show vorticity direction, not two independent rings. Flow curves come from actual RK4 histories with no endpoint snapping.

1. Closed loop → meridional cut: two opposite sections of one ring.
2. Follow one fluid parcel in the moving frame; compare local centre speed and ring speed.
3. Fixed geometry, circulation increases: velocities scale together.
4. Fixed circulation and relative core width, radius increases: ring slows.
5. Laboratory grid: actual translation added back, with local rolling retained.
6. Same R and Γ, two smoothing widths: core dependence and model boundary.

Desktop 760×360 coordinates in a bounded stage; phone independently uses 340×280, 200 CSS-px stage, DOM labels ≥16 px. Automatic-phone details are hidden. All eight normalized trajectories are cached by core ratio and circulation sign. Clock frames only interpolate markers; radius and circulation magnitude rescale existing histories. Exploration radius 15–30 mm, circulation −0.002…0.002, core ratio .08–.2, elapsed ≤3 s moving /≤1 s lab. The maximum dimensionless time is 26.67, below the integrated history 32. Author geometric bounds keep extrema within both coordinate frames. Full phone player ≤740 px is an integration review target, not a measured author claim.

Narration: six draft 24-second causal chapters (144 seconds); physical motion slowed, not narrated at physical-time speed. Long scientific qualifications stay in details/article. Phone playback and exploration, all chapters, zero/negative circulation, both reference frames and range endpoints await independent browser review.
