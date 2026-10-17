# Buoyancy — author brief

Status: source and6×24s scripts draft. Browser, full playback, whole-player phone measurements, voice and physical-device performance not-run by author. Model checks are not independent visual acceptance.

## Purpose and prerequisites

Resolve “sinking means no buoyancy,” “deeper always means more buoyancy,” and “denser liquid gives excess force even at floating equilibrium.” Prior knowledge: gravity and volume. Connects `convection` and `hydraulic-brake` to pressure forces, rather than recycling their fluid paths or machinery.

## Actually read authority

[OpenStax University Physics 1 §14.4](https://openstax.org/books/university-physics-volume-1/pages/14-4-archimedes-principle-and-buoyancy), pressure derivation, displaced liquid, density and apparent weight. No source art/code/text copied.

| Claim                                              | Conditions                                                  | Independent evidence                                                                                                |
| -------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Upper/lower pressure difference givesρgV_sub       | Upright prism, uniform incompressible liquid, air neglected | Direct face pressures versus independent displaced-volume formula across dry/partial/full positions                 |
| Full immersion makes force depth-independent       | Fixed body volume, constantρ                                | Both face pressures rise while force stays11.772N at.14/.24m bottom depth                                           |
| Floating draft depends on mass/ρ                   | Static force balance, no tension                            | .84kg/1.2L body in1000kg/m³ gives70% immersion;1.14kg gives.114m draft                                              |
| Release follows net force, not a prescribed motion | Linear phenomenological damping18N·s/m                      | Independent closed-form damped fully submerged heavy trajectory matches RK4; light body approaches.084m equilibrium |
| Sinking still has positive buoyancy                | Body heavier than displaced liquid                          | 1.44kg exceeds1.2kg liquid support; positive B<mg; denser liquid changes equilibrium draft, not weight              |

A large fixed-level reservoir avoids silently ignoring a small-tank water rise. No bottom contact, free-surface capillarity, added mass or turbulence. Linear damping is explicitly a teaching approximation, not a hydrodynamic prediction.

## Art, tracking and new causal evidence

A warm wood/composite prism with inner load, a rigid positioning rod connected to its top when held, a clear liquid plane and a true submerged-height bracket. Same physical depth drives top/bottom gauge pressure arrows, side cancellation, displaced volume and force. Two restrained resultant arrows agree with legend colours. No material stream is invented as buoyancy.

1. Lower held body: V_sub and B grow.
2. Deeper full immersion: individual pressures grow, B constant.
3. Release light body: integrated rise to partial immersion and B=mg.
4. Compare loaded equilibria at unchanged envelope: deeper draft.
5. Release heavy body: down motion with still-positive B below mg.
6. Compare same light mass in denser liquids: less displacement, unchanged equilibrium B.

Desktop max980px/stage330px. Phone340×310/210px; CSS16px, no SVG small text. Long qualifications hidden in watch. Control depth only when held; released mode exposes actual time from fixed fully submerged initial state. Extremes and fullplayer≤740px remain browser review, not assumed from stage size.

## Checks

Six meaningful model tests: pressure integration, depth invariance, independent equilibrium benchmark, exact damped trajectory, release convergence, density/load counterexamples and invalid inputs. Scoped TS/MDX/packet/EN numeric spacing reported at handoff. No generated voice or shared integration changes by author.
