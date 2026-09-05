# Wireless charging: power across a gap

[简体中文](../zh-CN/examples/wireless-charging-brief.md)

Slug `wireless-charging`, component `WirelessCharging`. Canonical narration: `src/data/narration.json`. The scene is registered in `src/data/topics.ts`. Eight authored 22-second chapters, 176 planned seconds. Chinese and English scripts, captions, chapter order, and director timing were frozen before handoff. Related existing topics are `transformer-electric` and `electric-generator`.

## Causal direction

An unwired receiver can have induced voltage without delivering power. Follow two complete copper windings from that open-circuit observation to a closed AC load, then change separation, alignment, frequency, magnetic backing, and winding resistance. The decisive distinction is between current circulating in the transmitter and power actually delivered across the gap.

The composition is a pale ceramic charging pad with an exposed receiver above it, seen through a sectional support and translucent ferrite backing. The whole width belongs to the approaching and shifting assembly. A narrow evidence strip below changes by chapter: current waveforms, flux linkage and induced voltage, geometry, frequency response, or a continuous power ribbon. It does not reuse the motor's sectional-cylinder layout.

| Time      | Directed visible event                                                    | Observation                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0–22 s    | Build the transmitter AC amplitude with the receiver switch open.         | Alternating current is established in a separate, connected transmitter circuit.                                                                                   |
| 22–44 s   | Trace one electrical phase cycle of shared linkage and induced EMF.       | Induced voltage is minus the linkage derivative, not proportional to static linkage.                                                                               |
| 44–66 s   | Close the real receiver switch at 35% chapter progress.                   | Receiver current and load power appear, while reflected loading changes transmitter current.                                                                       |
| 66–88 s   | Bring aligned coils from 20 mm to 3 mm apart.                             | Coupling rises and load power increases in the deliberately chosen operating range.                                                                                |
| 88–110 s  | Hold a 4 mm gap and move the receiver sideways by 30 mm.                  | Misalignment reduces coupling even without changing height.                                                                                                        |
| 110–132 s | Sweep from 85 to 150 kHz with the coils fixed.                            | Compensation changes reactance, current, and load power. The curve is solved, not drawn to an assumed resonance peak.                                              |
| 132–154 s | Compare ferrite-backed and unbacked steady circuits at the halfway point. | Removing the assigned backing changes both inductance and coupling; unchanged capacitors now tune differently. Closed return guides remain, including through air. |
| 154–176 s | Raise both winding resistances to 3.5× their defaults.                    | Copper-loss share rises and delivered power falls, while all watts remain accounted for.                                                                           |

Switch and ferrite changes compare settled states. The scene does not imply that a frequency-domain phasor solver resolves their switching transients. The ferrite comparison is deliberately a before/after cut, not a simulated material-removal trajectory. Its dashed reference curve is labeled with the original 6.8 µH inductances.

## Geometry, phone, and interaction

Each winding is one continuous Archimedean spiral: 8 turns, inner radius 8.5 mm, radial pitch 1.6 mm, outer-terminal radius 21.3 mm, wire radius 0.45 mm. The inner lead crosses to the outside on an insulated layer 1.5 mm away from the coil plane. The insulation and wire clear both the other turns and the ferrite backing. Outer leads, capacitor electrodes, the transmitter source block, receiver switch and AC resistor are explicitly connected. There are no hidden extra turns or decorative unattached spirals.

Ferrite backs, support rims, a ceramic pad, receiver frame and circuit boards accompany the coils. Receiver transparency is a cutaway convention. Coil-current colors and the receiver load's subtle emphasis are driven by computed current and power, not a temperature model. Four closed return-path guides derive from the same deterministic geometry, with sign and emphasis from transmitter-linked flux linkage. These guides are explicitly qualitative; they are not finite-element field lines or measurements of B.

Below 620 px of scene width, the camera looks more nearly along the pad's depth axis. Lateral displacement is shown along −z instead of +x, preserving its actual Euclidean length for rotationally symmetric coils. Thus a 30 mm offset stays a 30 mm offset without creating a much wider phone diagram. The 2D fallback uses an independent 300×330 coordinate system, with continuous windings, crossovers, capacitors, the switch, AC load and closed return guides.

Phone watch composition selects just the relevant evidence. The assembly is 304 px tall for phase/current chapters, 346 px for approach, 252 px for alignment/tuning/ferrite, and 265 px for power. Redundant headings and scale endpoints are removed where the figure already conveys them. A 770 px minimum closed-details stage limits transport movement; the target is approximately 900 px or less at 320 px. **Actual browser height has not been measured here.** Plot labels are HTML at 16 px or more; action and slider heights are at least 44 px.

All six ranges have both explicit `htmlFor`/`id` associations and translated `aria-label` values. Reset restores gap, offset, frequency, load, resistance multiplier, sampled phase, connection, ferrite and observation mode. The shared player handles replay, pause and chapter seeking. Exploration uses static sampled phase, with no private animation timer.

## Declared electrical model

Both inner terminals are dotted, and positive coil current runs inner→outer with winding normal +y. Phasors are RMS with time convention `Re(√2 I exp(jωt))`. The passive series-series equations are:

`Vs = Z1 I1 + jωM I2`; `0 = jωM I1 + Z2 I2`.

`Z1 = Rs+R1+j(ωL1−1/ωC1)`; `Z2 = R2+RL+j(ωL2−1/ωC2)`.

The closed receiver reflects `Zref=(ωM)²/Z2`; `I1=Vs/(Z1+Zref)` and `I2=−jωM I1/Z2`. Open circuit sets I2 and load power to zero while preserving induced EMF `E2=−jωM I1`. The waveform quantity is transmitter-linked linkage `λ2←1=M I1`, in Wb·turn, rather than total receiver linkage or a spatial B-field value.

Defaults: Vs = 2 V, Rs = 0.5 Ω, R1 = 0.25 Ω, R2 = 0.28 Ω, RL = 3 Ω. With ferrite, L1 = L2 = 6.8 µH; without it, both are assigned 4.2 µH. Fixed C1 = C2 = 165.5574896 nF gives individual self-resonance at 150 kHz with backing and 190.862703 kHz without it. Coupled-system power peaks are not asserted to coincide exactly with isolated self-resonance. Resistances are equivalent teaching parameters, not derived copper material properties for the illustrated wire.

The authored coupling proxy is `k=k0/[1+(d/0.015)²]^(3/2) × exp[−(x/0.022)²]`, with k0 = 0.22 backed and 0.1364 unbacked; `M=k√(L1L2)`. The axial envelope is geometry-inspired; the lateral Gaussian and ferrite coefficients are explicit approximations. No Neumann integral, ferrite field solution, measured calibration, or Qi product efficiency is claimed. The narrow and wide arrangements use the same d, x, k and circuit solution.

Real source power is independently computed as `Re(Vs I1*)`. It closes against `|I1|²Rs + |I1|²R1 + |I2|²R2 + |I2|²RL`. Positive resistances and `M²≤L1L2` ensure a passive inductance matrix. Resonance may magnify voltage or circulating current but supplies no active gain. The tests also verify instantaneous balance using magnetic energy `½L1i1²+½L2i2²+Mi1i2` and both capacitor energies. At settled DC, the series capacitors block current; the response is zero without pretending their reactance is finite.

Examples from the model: closing the default receiver gives about 0.975 W at the AC load. The 20→3 mm aligned approach raises load power from about 0.171 to 1.187 W. At a 4 mm gap, a 30 mm offset reduces it from about 1.167 to 0.075 W. These are consequences of the declared parameters, not hardware measurements.

Scope exclusions: switching harmonics and transients, ferrite hysteresis/eddy loss, frequency-dependent skin/proximity losses, temperature, foreign metal, rectifier, regulation, battery state, communication and protection. The source resistance is a specified series loss, not a claim to model complete inverter efficiency. Only an AC resistor is numerically loaded; no uncomputed battery charge or rectifier animation is added.

## Sources and provenance

- [Analog Devices AN-138, Wireless Power User Guide](https://www.analog.com/en/resources/app-notes/an-138fc.html): transmitter/receiver structure, reflected receiver loading, resonant circuits and the distinction between a coil link and battery-charging electronics.
- [Texas Instruments BQ500210 datasheet](https://www.ti.com/lit/ds/slusal8c/slusal8c.pdf): opposing coils with ferrite shields and practical feedback/protection context. This historical device documentation is not presented as the latest Qi specification.
- [Wireless Power Consortium, Magnetic Induction](https://www.wirelesspowerconsortium.com/knowledge-base/magnetic-induction/): charging-system context. The page opened during research; a later text-position request returned an internal browsing error. No unsupported current protocol claim is made.

All geometry, SVG artwork, curves and prose are original procedural work. No downloaded textures, image assets or audio were added. The standalone 400×230 cover accepts optional color and uses the model's spiral, wiring and closed magnetic-path geometry without an outer card frame.

## Evidence and remaining review

Targeted model tests: **12/12 passed**. They check bounded distance/alignment coupling, zero mutual coupling, open-circuit voltage versus load power, independent complex KVL residuals, real-power closure across placement/frequency/ferrite combinations, reciprocal port exchange and reversed mutual polarity, instantaneous stored-energy balance, Faraday sign by differentiation, self-resonance and ferrite detuning, exact eight-turn geometry and crossover clearance, phone/desktop displacement equivalence, arbitrary seek reconstruction, invalid passive parameters, zero source and DC limits.

Targeted strict TypeScript checking passed for the model and the experiment plus both renderers. Packet validation found 47 UI labels and 62 translations, with no shared-dictionary conflicts; exact top-level keys, paths, metadata, related slugs, eight cue titles/captions, 176-second timing and bilingual anchors passed. The initial code checks caught an exponentiation-parenthesis syntax error and a missing public constructor on a Three.js curve subclass; both were fixed before these passes. Only owned files were formatted.

Shared Studio owns visibility/background pauses, reduced-motion handling, WebGL fallback, renderer/control disposal and all scene geometries/materials. The topic disconnects its ResizeObserver and creates no texture, audio node, worker, network resource or independent frame loop. Flux-line buffers are reused when poses change.

No shared build, global formatter, audio generation, canonical registry edit, dependency-tree manipulation, git operation or deployment was run. No isolated browser review, complete watching, narration listening, physical-phone performance or measured viewport height is claimed. Parent owns those independent reviews, voice generation, integration, global checks and release. Narration/captions/chapters/director timing remained unchanged after freeze.

Implementation and registration: `src/models/wireless-charging.ts`, `src/models/wireless-charging.test.ts`, `src/components/experiments/WirelessCharging.tsx`, `src/components/three/WirelessChargingStudio.tsx`, `src/components/three/WirelessChargingFlat.tsx`, `src/styles/wireless-charging.css`, `src/components/covers/WirelessChargingCover.astro`, `src/content/wireless-charging.mdx`, `src/content/en/wireless-charging.mdx`, this brief, `docs/zh-CN/examples/wireless-charging-brief.md`, and `src/data/narration.json`.

## Measured integration

Both recordings are 189 seconds. Earlier 176-second storyboards describe the production draft; the measured chapter windows below are authoritative. The film director follows these chapter windows and the media clock. Full integrated viewing and native listening remain separate review tasks.

Chinese: `/narration/wireless-charging-zh-01a46ffd23d3.mp3`. English: `/narration/wireless-charging-en-c2e6f31ed467.mp3`.

| Chapter | Window (s) | Focus                            |
| ------- | ---------- | -------------------------------- |
| 1       | 0–22       | Start with alternating current   |
| 2       | 22–44      | Changing linkage induces voltage |
| 3       | 44–66.5    | Close the receiver circuit       |
| 4       | 66.5–91    | Bring the coils closer           |
| 5       | 91–113.5   | Same gap, weaker alignment       |
| 6       | 113.5–138  | Tune with capacitors             |
| 7       | 138–163    | Flux needs a return path         |
| 8       | 163–189    | Account for every watt           |
