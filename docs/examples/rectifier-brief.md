# Rectifier — production brief

## Integrated film

The assembled Chinese and English tracks share **199.5 seconds**. The original 176-second storyboard below is the initial handoff; measured speech determines the final windows here. Authored chapter titles, captions and spoken wording are unchanged. Temporary packet paths below refer to the consumed handoff, not a second registry. `src/data/narration.json`, `film-timeline.json`, `audio-tracks.json` and `audio-manifest.json` are canonical.

| Chapter                                      | Measured window |
| -------------------------------------------- | --------------- |
| 1. Two diodes in the positive half-cycle     | 0–23.5 s        |
| 2. A different route, the same direction     | 23.5–47 s       |
| 3. Two output pulses per AC cycle            | 47–73 s         |
| 4. Charging the capacitor for the first time | 73–98 s         |
| 5. Charging happens in short windows         | 98–123 s        |
| 6. Capacitance changes ripple                | 123–148 s       |
| 7. Load demand and recharge frequency        | 148–173 s       |
| 8. Inrush and source resistance              | 173–199.5 s     |

Recordings: `/narration/rectifier-zh-649355d72cde.mp3` · `/narration/rectifier-en-bb4c8534f055.mp3`

Full continuous viewing, native bilingual listening and physical-phone performance remain separate pending evidence.

---

## Visual argument

Follow the two conducting diodes, then discover that a reservoir capacitor changes **when** those paths conduct. The luminous bridge uses a deep blue field, amber positive-half path, blue negative-half path, mint load path, and violet capacitor branch. All four diode orientations, both AC terminals, finite source resistance, parallel C/R, and both output rails remain visible. There are no disconnected arrows or particle streams standing in for current.

The circuit is an unfolded rectangular bridge: D1 A→P, D2 B→P, D3 N→A, D4 N→B. Every diode points upward on its vertical branch. The AC source and its series resistance connect A to B through the middle; the load and capacitor span P to N. Positive conduction uses D1/D4; negative conduction uses D2/D3. The highlighted route closes through the source. Load direction is always P→N. At blocked intervals every diode goes dark, while the capacitor-to-load circuit remains connected.

SVG is both the primary medium and the complete 2D fallback. It is appropriate to the circuit rather than an ornamental 3D enclosure. Diode illumination derives from each computed diode current, capacitor direction from signed capacitor current, and the violet level from `vC/Vpeak`. That level is a voltage indicator, not fluid or an independent effect.

## Frozen film

The temporary packet contains eight authored Chinese/English scripts, captions and titles, initially 22 seconds per chapter, total **176 seconds**. All narration text, captions, titles, chapter count, order and timing are **frozen** at handoff.

| Time      | Computed shot                             | Causal observation                                                            |
| --------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| 0–22 s    | Positive half-cycle, no C                 | D1/D4 form a closed loop; load current goes downward                          |
| 22–44 s   | Negative half-cycle, no C                 | D2/D3 replace that pair; load direction stays the same                        |
| 44–66 s   | A complete AC cycle without C             | Two output pulses per input cycle, including the zero-voltage gaps            |
| 66–88 s   | Initially empty C, three actual AC cycles | Charging begins above threshold, with continuous stored charge                |
| 88–110 s  | One computed periodic filtered cycle      | Source magnitude crosses vC+2VF; charging windows alternate with RC discharge |
| 110–132 s | Periodic 220 µF and 2200 µF comparison    | Ripple decreases on a common voltage scale                                    |
| 132–154 s | R 200→50 Ω, then f 50→100 Hz at 50 Ω      | More demand raises ripple; shorter recharge spacing reduces it                |
| 154–176 s | Crest-started empty C, Rs 0.5 Ω then 5 Ω  | Finite source resistance limits inrush and slows charging                     |

The frequency comparison keeps **20 ms** on the horizontal axis: 100 Hz therefore shows twice as many pulses in the same window. The final shot follows the first 10 ms after crest connection, with a common 18 A current range. Startup and inrush use a deterministic quadratic time mapping to dwell on initial charging. No physical parameter is eased independently of the model. Steady comparisons are not represented as real component-switching transients.

## Declared model

SI state `vC`, source `vs=Vp sin(2πft+φ)`, bridge current `iB=max(0,(|vs|−2VF−vC)/(Rs+2rD))`, load current `iR=vC/R`, and `C dvC/dt=iB−iR`. Bridge conduction and net capacitor charging are distinct: `iB` must exceed `iR` to increase stored charge. Without C the output follows the algebraic divider `(Rs+2rD+R)` and has no storage state.

Default: 12 V **peak**, 50 Hz, C 1000 µF, R 100 Ω, Rs 2 Ω, VF 0.65 V and rD 0.08 Ω per diode. Manual ranges: 1–18 V peak, 25–100 Hz, C 100–2200 µF, R 50–300 Ω, Rs 0.5–8 Ω. The lowest source setting is below the two-diode threshold and correctly gives zero steady output.

Conducting intervals use the exact sinusoidally forced first-order solution; blocked intervals use exponential RC decay. Quarter-cycle partitions fix the forcing sign. Forty-two bisections locate each capacitor/diode conduction event. Recorded steps are at most T/512, subdivided during conduction to at most one-sixteenth of the charging time constant. Power and charge use Simpson quadrature of the same exact state. The scalar dissipative period map is bracketed to obtain its fixed point; no imposed peak-hold capacitor waveform or ripple approximation is used.

Energy ledger: source = load + two-diode heat + source-resistance heat + change in capacitor energy. Charge ledger: bridge charge − load charge = CΔvC. Source current is signed with source voltage; rectified bridge current and individual diode forward currents stay nonnegative.

Default model: mean output about 9.54 V, ripple 0.70 V, conduction fraction 28%. Crest inrush is 16.21 A at Rs 0.5 Ω and 2.07 A at Rs 5 Ω. These are instructional model values, not hardware measurements or ratings. Scope excludes capacitor ESR, source/transformer inductance, diode recovery/junction capacitance, protection, feedback regulation and thermal behavior. This low-voltage scene is not mains wiring or construction guidance.

## Phone and interaction

Desktop and phone use different circuit coordinates (750 versus 300 logical units). Phone keeps both diode pairs visible, uses 22-unit circuit labels, and removes repeated heading/detail text. The current caption sits immediately above the live bridge. One relevant plot is shown below; inrush changes that plot to current. The phone voltage/current plot contains no shrunk SVG text; legends and scales remain 16 CSS px. The stage has a 790 px minimum for stable transport placement and is composed toward a ≤900 px target at 320 px. This target has not been browser-measured in the worker task.

Six native ranges have unique ids, explicit label associations, translated aria-labels, and 44 px interaction heights. All buttons are at least 44 px and expose pressed/disabled states. Reset restores every numeric parameter, C connection, source phase, startup mode, observation view and time using the tested reset factory. Disconnecting C disables its startup controls. Selecting crest connection initiates the empty-capacitor startup state.

The scene takes time only from `useShowcase` or manual sample selection. It creates no timers, RAF, workers, audio objects, canvas or Three.js resources. Shared player visibility/background/reduced-motion behavior remains authoritative. The shared compact-layout hook cleans up its media-query listener. Caches contain a fixed finite set of authored traces, not traversal history.

## Primary references and assets

- [Analog Devices StudentZone: ADALM2000 Diodes and Diode Circuits](https://www.analog.com/en/resources/analog-dialogue/studentzone/studentzone-august-2019.html): bridge topology and diode routing.
- [MIT 6.117 Lecture 3: Power Supplies and Regulation](https://web.mit.edu/6.117/www/lec3.pdf): full-wave rectification, storage filtering and ripple.
- [Analog Devices: Active Rectifiers](https://wiki.analog.com/university/courses/alm1k/alm-active-rectifiers): capacitor filters, source resistance and charging-current pulses. The scene itself uses a passive diode bridge, not that article's active rectifier implementation.

Accessed 2026-09-06. Equations were derived for the declared circuit. All artwork, paths, cover and waveforms are original code; no external imagery or other assets.

## Actual evidence and remaining parent review

- Targeted Vitest: **16/16 passed**, including correct pairs/closed-loop topology, twice-frequency symmetry, event threshold and continuity, exact blocked discharge, instantaneous KCL/energy, periodic/startup charge and energy, independent 120,000-step RK4 comparison, quadrature refinement, ripple response, finite inrush, below-threshold and precharged boundaries, 64 parameter corners in both steady/startup states (128 cases), deterministic chapter seeking, full reset and input rejection.
- Strict TypeScript on the owned model, experiment and renderer passed. Formatting passed for all 11 owned files. Packet audit passed: 55 interface labels, 63 translations, six named ranges, eight 22-second cues, existing related topics, complete metadata, supported formula markup, all MDX anchors, and reset wiring; zero errors.
- Final targeted model run: 2026-09-06 00:13:02 local time, 16/16 passed. Frozen narration SHA-256 of JSON serialization: `a78cb2a36f142028fb68054387619b3a9fb7db2ddcfb4d437b6d9fa5c700f560`.
- No actual browser UI, full-playback, native-media-seek, listening, or physical-phone review was performed. There is no browser evidence to upgrade into those categories. Any subsequent browser inspection must use CUA.
- No shared build, global formatting, registry/audio edit, dependency change, git operation or deployment was performed. Parent owns integration, voices, rendered desktop/320 px review, media `currentTime` checks during seeking, full checks and release.

Temporary packet: `src/data/scene-packets/rectifier.json`. It omits topic number and preserves shared English translations. The parent consumes it into the canonical registries; it is not a second source of published truth.
