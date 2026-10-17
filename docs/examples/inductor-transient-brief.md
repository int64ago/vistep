# Inductor transient — the loop changes, current does not jump

Owner:`/root/hundred_mechanisms`. An explicit low-side switched RL circuit with a visible alternate clamp path. The circuit path, current direction, voltage polarity and energy ledger are the hero, not a decorative coil mesh. A generic constant-voltage clamp is used rather than pretending a specific semiconductor curve; its two terminal drops are0.7V or30V. The circuit symbol is schematic, not an asserted winding geometry.

Misconceptions: opening a switch instantly erases inductor current; inductors always oppose current rather than its change; a low-voltage freewheel path and a high-voltage clamp have the same release time; stored energy disappears. Distinction from RC: current continuity and magnetic energy with voltage reversal at switching, rather than capacitor voltage continuity.

Primary sources: OpenStax University Physics2 RL circuits (14.4) for L di/dt and RL response; manufacturer TI [SNVAA45](https://www.ti.com/document-viewer/lit/html/snvaa45) (checked 2026-10-18) for higher clamp voltage/faster current decay and switch-voltage tradeoff.

Model: supply6V, series R20Ω, ideal L0.1H (comparison0.2H). On: i=Vs/R(1−exp(−Rt/L)), VL=Vs−Ri. Off starts from a separately prepared steady0.3A state; current recirculates from coil bottom through clamp to the source's positive bus, through R and L, with zero source-branch current. i=(I0+Vc/R)exp(−Rt/L)−Vc/R until first zero, then clamped at zero. VL=−Ri−Vc; open-switch node voltage=Vs+Vc while conducting, then Vs. Integrated resistor and clamp heat plus .5Li² equals initial4.5mJ.

Six chapters: current builds from zero; initial coil voltage moves toward zero while resistor takes supply; double L slows approach but leaves steady current; open switch and follow same current through low clamp; high clamp causes a larger voltage excursion and faster release; track magnetic energy into R and clamp. No parasitic capacitance, saturation, winding losses or unsafe no-path switching prediction. Different chapters prepare explicit initial conditions instead of implying continuous parameter jumps are physical.

Phone circuit has a dedicated compact closed path and a single time trace; labels≥16px. Watch-mode long assumptions hidden, explanatory article retained. Target complete player≤740px.

Author source validation: 6 model tests pass (KVL, numerical derivative, time scaling, switch-voltage reference, current continuity/non-reversal, independently integrated energy); strict component TypeScript and packet dry run pass. Six chapters / 144 s planned. Browser/full playback/voice/physical device:not-run. Inbound:rc-circuit,capacitor-fields,relay.
