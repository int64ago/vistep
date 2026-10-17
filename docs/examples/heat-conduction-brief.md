# Heat conduction — author brief

Status: key-shot authoring complete, integration-owner visual review and speech freeze pending. Numerical tests are author checks. Playback, glyph measurement, physical-phone performance and listening are not-run.

Misconception: heat must be a stream of hot material, or a temperature that stops changing means no transfer. Prerequisites: temperature, energy and a difference. This is a solid thermal-gradient explanation, not a recoloured `convection` plume. It compares to `diffusion` without claiming that heat is a conserved material species.

| Claim                                                      | Source section                                                                                           | Conditions                                                     |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Steady conductive power kAΔT/L                             | [OpenStax College Physics 2e §14.5](https://openstax.org/books/college-physics-2e/pages/14-5-conduction) | Homogeneous slab, fixed endpoints, insulated sides, constant k |
| Transient temperature smooths by a diffusion equation      | [MIT OCW Heat Equation help](https://ocw.mit.edu/ans7870/18/18.03/s06/tools/HeatEquationHelp.html)       | One-dimensional homogeneous continuum; no source or convection |
| Internal accumulation equals boundary inflow minus outflow | First-law finite-volume balance, explicitly derived in model                                             | Fixed internal control volumes; bath nodes excluded            |

Independent benchmark: k=20 W/(m·K), A=0.0004 m², ΔT=70 K, L=0.1 m gives 5.6 W and midpoint55°C. Doubling L gives2.8 W. Tests recover the initial field, maximum principle and energy balance at multiple transient times. Counterexample: equal bath temperatures do not imply zero transfer when the interior starts colder. Reversing the gradient must reverse the signed flux. Uniform rod plus equal baths must remove net flux.

Distinct direction: a ceramic-paper thermal atlas. Fixed material sites carry the color field; no tracer is advected. A connected temperature profile and a three-term boundary ledger expose the cause. Seven shots add separate evidence: fixed positions; steep transient gradient; steady nonzero transfer; conductivity comparison at common time; length comparison near steady state; uniform equilibrium; reversed gradient. The fifth chapter keeps a common projection so doubling the physical rod length visibly doubles the path. Other chapters frame the reference rod.

Desktop: a long rod above its profile, with three terms aligned as inflow / storage / outflow. Phone: a vertical rod beside a vertical temperature profile, with true local endpoint temperature labels and CSS 16 px ledger text. It is a reorientation of the argument rather than shrinking desktop labels. Main controls are optional. Disclosed model details separate qualitative bead vibration from quantitative temperatures and fluxes.

The 25-node finite-volume eigenmode model directly reconstructs any requested time; no independent timer or stale history. Fixed k, heat capacity and geometry are named. It does not claim material-specific microscopic dynamics or measured performance. Actual browser alignment, reversed-arrow framing, readout signs and whole-player height remain for the integrator.
