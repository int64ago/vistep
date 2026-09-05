# Buck converter — production brief

## Integrated film

The assembled Chinese and English tracks share **196 seconds**. The original 176-second storyboard below is the initial handoff; measured speech determines the final windows here. Authored chapter titles, captions and spoken wording are unchanged. Temporary packet paths below refer to the consumed handoff, not a second registry. `src/data/narration.json`, `film-timeline.json`, `audio-tracks.json` and `audio-manifest.json` are canonical.

| Chapter                                    | Measured window |
| ------------------------------------------ | --------------- |
| 1. From pulses to a steady output          | 0–24.5 s        |
| 2. The first path: switch on               | 24.5–49 s       |
| 3. The second path: freewheeling           | 49–72.5 s       |
| 4. Balancing inductor volt-seconds         | 72.5–96.5 s     |
| 5. The capacitor takes the difference      | 96.5–122 s      |
| 6. A sudden increase in load               | 122–146.5 s     |
| 7. A third interval at zero current        | 146.5–169.5 s   |
| 8. Accounting for every part of the energy | 169.5–196 s     |

Recordings: `/narration/buck-converter-zh-fa21ba0c6685.mp3` · `/narration/buck-converter-en-f7e00330902e.mp3`

Full continuous viewing, native bilingual listening and physical-phone performance remain separate pending evidence.

---

## Concept and visual direction

Follow the same inductor current through a switch opening. The opening question is why a disconnected source does not immediately interrupt output current. A warm, editorial circuit drawing carries the explanation: copper-colored source loop, teal diode loop, violet capacitor branch, a connected four-lobe inductor, explicit nodes, and a single energy guide. This is deliberately a circuit-and-waveform film, not a physical enclosure or a dashboard.

SVG is the primary renderer and the concept-preserving 2D path. It needs no WebGL, external textures, font-specific equations, renderer allocation, RAF, or audio resources. The current guide follows the exact same sampled coil centerline as the circuit ink. Its progress is normalized integrated energy in the current mode (source input, decreasing inductor energy, or decreasing capacitor energy), and its opacity vanishes at mode changes. It does not represent electrons or energy quantization. The capacitor-current arrow derives from signed branch current.

## Frozen director and narration

Eight chapters, 22 seconds each, total 176 seconds. Chinese and English speech are separately authored in the temporary packet. Titles, captions, spoken scripts, chapter count, order, and timing are **frozen** for parent voice production.

| Time      | Shot and computed change                                          | Observation                                                     |
| --------- | ----------------------------------------------------------------- | --------------------------------------------------------------- |
| 0–22 s    | One ideal 20 kHz cycle, displayed slowly                          | Switch voltage jumps; inductor current remains continuous       |
| 22–44 s   | Isolate the on interval, advancing its actual state               | Source loop closes; positive inductor voltage raises current    |
| 44–66 s   | Continue from the same peak into freewheeling                     | Diode loop replaces source loop without a current jump          |
| 66–88 s   | Settled duty comparison: 30% then 60%                             | Signed inductor volt-seconds still cancel at a different output |
| 88–110 s  | Settled 47 µF then 220 µF comparison                              | Smaller output ripple on the same ±80 mV window; charge balance |
| 110–132 s | Actual nonideal 8 Ω → 3 Ω step after five cycles, 24 cycles total | Capacitor supplies shortfall; voltage dips; inductor follows    |
| 132–154 s | Settled nonideal loads 8, 12, then 40 Ω                           | Zero-current idle fraction appears and grows                    |
| 154–176 s | Ideal then nonideal 4 Ω load at unchanged duty                    | Input splits into load energy and the declared conduction heat  |

Steady comparisons are explicitly identified as such. Only the load-step shot is a transient between conditions. Gate switching is greatly slowed for display; the plot time and frequency stay in physical SI-derived units. There is no hidden secondary animation clock or frame-history simulation. The director maps `useShowcase` chapter/progress to a deterministic trace and sample.

## Independent numerical model

State: inductor current `i` and ideal capacitor voltage `vC`. The capacitor ESR algebra gives `iC = (R i − vC)/(R+rC)`, `vO = vC+rC iC`. On-state `L di/dt = Vin−(rS+rL)i−vO`; diode state `L di/dt = −VF−(rD+rL)i−vO`. After diode cutoff, `i=0`, `di/dt=0`, and the capacitor continues to discharge through R. In all modes `C dvC/dt=iC`.

Default: 12 V, 20 kHz, duty 0.45, 150 µH, 100 µF, 4 Ω. Nonideal: switch 0.12 Ω, winding 0.15 Ω, diode 0.45 V + 0.05 Ω, capacitor ESR 0.04 Ω. These are chosen instructional values, not product measurements. Manual domain: duty 0.20–0.70, L 75–300 µH, C 22–220 µF, R 2–60 Ω, switching frequency 10–40 kHz. Load-step mode explicitly overrides R with 8 → 3 Ω.

Piecewise RK4 uses a maximum T/128 step, exact gate boundaries, and 38 bisections to locate diode zero crossing. The period-map fixed point is accelerated with a numerical Jacobian after 20 settling cycles; every map evaluation still integrates the switched ODE. The 64 tested parameter corners settle within 62 outer iterations. Trace samples interpolate the computed storage states; instantaneous circuit values are then recomputed from those states.

Source/load and four loss channels are integrated with the same RK4 intermediate states. Checks retain `Δ(½Li²+½CvC²)`, rather than assuming steady energy balance during the load step. Positive/negative volt-seconds and capacitor charge are integrated separately. Ideal default: mean 5.4 V, roughly 0.853 A minimum current, 62.1 mV ripple. Nonideal 40 Ω: approximately 33.9% zero-current time and 7.94 V mean output, demonstrating why D·Vin is not imposed in DCM.

Limits: open loop, positive forward supply range, linear L/C and declared conduction losses only. No feedback, startup protection, saturation, core loss, switching transition losses, reverse recovery, parasitic ringing, thermal dynamics, or measured product efficiency. The schematic groups each component's internal resistance into that component's model.

## Phone, accessibility, and lifecycle

At ≤760 px the circuit uses independently chosen 300-unit node coordinates; the desktop circuit is 680 units wide. Phone component symbols use 20-unit text and the circuit has no redundant parameter labels. The chapter caption sits directly above the circuit. A phone shows only its relevant waveform; the final energy chapter replaces the waveform with the energy account. The redundant heading/kicker disappears. A 775 px minimum stage seeks a stable transport location; the intended 320 px stage ceiling is approximately 900 px, not yet browser-measured. Text stays at least 16 CSS px, actions/ranges 44 px. Global container padding still requires parent viewport inspection.

All six native ranges have unique ids, explicit label associations, and translated aria-labels. Toggle buttons expose pressed state; disabled controls communicate the temporary load override. Reset restores all five numeric parameters, ideal/nonideal state, time, comparison mode, and observation view. Native controls support keyboard operation. The shared player owns reduced motion, offscreen/background pauses, seeking, replay, and narration. The scene allocates no animation timer; the shared compact-layout hook removes its media-query listener on disposal. Bounded film traces are cached only for fixed authored configurations, never as playback history.

## Primary research and asset provenance

- [Analog Devices AN-140, Henry Zhang](https://www.analog.com/en/resources/app-notes/an-140.html): buck on/off topology, volt-second balance, distinction between conduction and switching losses.
- [MIT 6.200 Buck Converter Laboratory](https://circuits.mit.edu/F25/labs/buck): switched LC circuit, practical waveforms, duty and load behavior.
- [Analog Devices, Practical Design Techniques for Power and Thermal Management, Section 3](https://www.analog.com/media/en/training-seminars/design-handbooks/power-thermal-mgmt-sect3.pdf): asynchronous buck current paths and discontinuous conduction.

Accessed 2026-09-05. Equations were derived for the declared model. All circuit, cover, waveform and route geometry is original code; no external assets or copied diagrams.

## Worker evidence and parent review boundary

- `pnpm exec vitest run src/models/buck-converter.test.ts`: 14/14 passed. Includes three refinement cases (CCM, DCM, transient), 64 steady corners, 32 load-step corners, energy conservation/loss signs, diode cutoff, storage continuity, capacitor ripple, balance, invalid-input guards, geometry, and all chapter deterministic seeks.
- Targeted strict TypeScript check of model, experiment, and renderer: passed again after final formatting.
- `pnpm exec prettier --check` on all 11 owned files: passed. Packet/localization/content contract audit: 58 interface labels, 66 translations, six named ranges, eight 22-second cues, registered related slugs, all reset setters, supported formula markup and three MDX anchors; zero errors.
- Final targeted model run: 2026-09-05 23:48:34 local time, 14/14 passed. Frozen narration SHA-256 (JSON serialization): `65d636d8fb3bdf6ba2fd3ba19d3dcadfc9bee1cf9388972f3f2980e4ed51579d`.
- No shared production/preview build, global formatter, audio synthesis, dependency installation, registration, git operation, or deployment was run.
- No browser-rendered stills, full visual playback, native audio seeking, bilingual listening, or physical-phone performance measurements were performed. Parent owns those checks, including actual media `currentTime` during seeking. No viewport calculation is claimed as a viewing test.

Temporary integration packet: `src/data/scene-packets/buck-converter.json`; it is a handoff transport, not a second canonical registry. It has no topic number and preserves all existing English dictionary values. Parent owns registration, voices, final player/UI review, full checks, and release.
