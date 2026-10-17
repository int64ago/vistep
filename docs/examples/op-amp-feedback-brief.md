# Negative feedback: equality is a result, not a rule

Owner `/root/hundred_mechanisms`. Misconceptions: the inputs of any op amp are always equal; a large gain alone makes an accurate amplifier; a feedback wire removes output-voltage and rate limits. Prerequisites: a resistive divider and voltage gain. Adds finite loop gain, nonzero differential error, rail saturation and slew limiting beyond the BJT amplifier.

Sources verified 2026-10-18: Analog Devices MT-033, voltage-feedback gain and bandwidth; ADI electronics chapter2/3, for finite gain; TI [SNOA726](https://www.ti.com/lit/pdf/snoa726) for slew-rate limits. Use exact primary references in packet. Chosen behavioral device A0=100000, dominant pole10Hz, output limit±10V, slew limit0.5V/µs. These are pedagogical parameters rather than a named part's complete specifications.

Hero: non-inverting amplifier with a fully connected output→Rf→minus-input divider node→Rg→ground return. Opening the loop removes the divider and grounds minus. Supplies are explicit; plus/minus input symbols stay distinct from supply terminals. Two voltage bars on a common scale show positive-input voltage, feedback voltage, and residual difference. Step chapters replace bars with a single calibrated output-time trace.

Model: β=Rg/(Rg+Rf), e=Vin−βVout, stationary Vout=A0 Vin/(1+A0β), bounded to rails. One-pole dynamics dVout/dt=ωp[A0e−Vout], limited by slew and projected at output rails. Exact constant-input solution joins a linear slew segment to an exponential tail; no numerical integration jitter or seek dependence. No extra poles, phase-margin failure, overload recovery, input bias/offset, load current limit or high-frequency stability claim. Ideal infinite input impedance and resistive divider. Input equality is only an approximation after settling in the high-loop-gain, unsaturated case.

Six chapters: open-loop1mV drives output toward a rail; closing negative feedback makes a0.5V step settle near5V; changing Rf from10kΩ to90kΩ changes gain2→10 while the divider follows the input; finite A20→100000 shrinks error quantitatively; input beyond1V saturates output and leaves differential error;0.8V vs0.2V input steps share a0.5V/µs slope but have different slew durations.

Phone independent compact340×250 circuit plus about100px comparison/trace; no simultaneous large graph and long notes. All technical labels≥16px actual at320. Model and component execution checks separate from root's visual/playback/voice/physical-device review, all still not-run by author.

Source validation: 6 independent model checks and 1 component execution check pass. The latter renders all6 chapters at start/middle/end plus default exploration, covering structural state reuse and finite SVG attributes; it is not visual acceptance. Strict component TypeScript and packet dry run pass. Planned six chapters /144s.
