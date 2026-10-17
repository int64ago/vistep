# Adiabatic compression — author brief

Status: source package;6×24s bilingual scripts draft. No browser, fullplayer, full playback, voice listening or physical-phone measurement by author. Automated checks are not independent visual acceptance.

## Misconception and portfolio addition

No heat transfer does not mean no energy transfer, isothermal compression still requires work, and adiabatic alone does not imply pV^γ. Prerequisite: gas state variables, force/work and energy. Adds actual process boundaries and an energy ledger to `ideal-gas`; links piston work with `refrigerator` without attributing all compression heating to friction.

## Actually read primary textbook material

OpenStax University Physics 2 [§3.6](https://openstax.org/books/university-physics-volume-2/pages/3-6-adiabatic-processes-for-an-ideal-gas), including the explicit free-expansion exception, quasi-static derivation and6:1 benchmark; [§3.3](https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics), heat/work sign convention and state/path distinction. No source art/code/text copied. UI deliberately uses work **on** positive, the algebraic inverse of textbook work **by** positive, with explicit first-law statement.

| Claim                                                  | Conditions                                                   | Independent oracle and counterexample                                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Insulated piston compression raises T through work     | Ideal, frictionless, quasistatic, constant heat capacity     | Source6:1,240cm³,293K,100kPa →599.97K,1.2286MPa,62.86J input                                                         |
| Work depends on path p(V), not final pressure only     | Same assumptions                                             | Independent midpoint integral over10000pressure samples for compression/expansion and both modes matches closed form |
| pV^γ and entropy constant on reversible adiabatic path | γ>1, constant heat capacity                                  | EOS/invariant/entropy checks; reverse path returns initial p/T and exactly opposite cumulative work                  |
| Isothermal work leaves as negative heat input          | Reversible ideal reservoir                                   | ΔU0, Q_in=−W_on; work differs from adiabat for equal final V                                                         |
| Free expansion Q0,W0 need not cool ideal gas           | Rigid insulated vacuum expansion, equilibrium endpoints only | V doubles,p halves,T fixed,entropy increases; does not follow reversible invariant                                   |

Piston area0.01m², true circular diameter derived from area, fixed physical height scale. No friction, moving-particle decoration, piston inertia, heat transfer rate or real heat capacity variation. Temperature tint is schematic, not glow.

## Independent art and six visible additions

A softly lit ceramic/metal cylinder with continuous rod, piston contact, integral insulation and a conducting-wall alternative. The same volume places the piston, sets EOS and locates the pV point. Work area is integrated from the same path; cumulative Q/W/ΔU are signed and share one reference.

1. Insulated piston1→.5L: temperature rises while Q0.
2. Same path in pV focus: true shaded work area and ledger equality, not final-p times full travel.
3. Conducting reservoir boundary: same compression, T fixed, negative Q balances W.
4. Same initial state and ratio, γ1.4 vs5/3: heat capacity changes temperature/pressure.
5. Compressed initial reference expands back adiabatically; negative W equals ΔU.
6. Rigid two-chamber comparison before/after partition removal: Q/W0 and T constant. No invented equilibrium trajectory through the irreversible middle.

Desktop bounded980px with cylinder and pV diagram,320px stage. Phone uses piston-only or plot-only camera in340×260/200px stage; the designated work chapter opens the pV view. SVG ticks26units, all prose CSS16px. Free mode controls toggle two actual endpoints; no ineffective continuous volume or gamma control. Watch phone hides assumptions. Fullplayer≤740px and longest bilingual caption remain root browser checks.

## Verification

Six tests cover independent numerical source benchmark, pressure-work integration, first law/invariants, reversed path, vacuum counterexample, heat capacities and invalid inputs. Scoped TS/MDX/packet and numeric-English spacing reported on handoff. No shared registry, audio generation or publication by author.
