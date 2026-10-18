# Follow charge through a measured current area

PEP Required 3 §10.4 pp.39–40. Four shots: sensor records discharge, replay with current-area accumulation, share A with identical empty B, remove B and share A with a new empty C. The source capacitor stays identifiable, and B remains accounted for in the second comparison. Sensor and charge-sharing variants use different circuit topology and apparatus paths; they are not caption swaps.

Source/model: ideal RC discharge and capacitor energy from OpenStax University Physics 2 §10.6/§8.3; textbook supplies current-sensor method and consecutive sharing. The current trace, voltage, charge and sampled trapezoidal area all derive from one state. Sampling is simulated at 0.05 s, not a claimed physical acquisition. Color strip is a symbolic charge cue on an opaque capacitor, not a fluid level. Charge-sharing relaxation includes a small resistance; equal final charges do not imply conserved field energy.

Desktop: physical capacitor/sensor loop over an I–t trace. Narrow view stacks the same circuit and chart, keeping numeric readings in >=16px CSS; tick labels scale separately. Sharing mode replaces sensor/chart with two capacitors and an explicit removed-B state for round two.

Independent benchmark: C=1mF,R=2kΩ,U₀=6V gives τ=2s and I(τ)=3/e mA. Sampled area at8s differs from C(U₀−U) by under0.006%. Boundary counterexample: finite-time residual charge is strictly positive; capacitor sharing loses half of the initial field energy despite charge conservation. Five targeted tests passed. Packet validation (4 contiguous chapters, 96 planned seconds) and TSX syntax check passed. Rendered visual review, full playback and listening remain not run until root integration.
