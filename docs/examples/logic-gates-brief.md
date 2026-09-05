# Logic gates — production brief

[简体中文](../zh-CN/examples/logic-gates-brief.md)

Current recording revision (2026-09-06): both tracks run **177.0 seconds**. See [the refinement record](../qa-expansion-refinements.md) for the updated windows and review limits. Earlier recording names, timings and review results below describe the preceding version.

## Integrated film

The assembled Chinese and English tracks share **177 seconds**. The original 176-second storyboard below is the initial handoff; measured speech determines the final windows here. Authored chapter titles, captions and spoken wording are unchanged. Temporary packet paths below refer to the consumed handoff. `src/data/narration.json`, `film-timeline.json`, `audio-tracks.json` and `audio-manifest.json` are canonical.

| Chapter                                    | Measured window |
| ------------------------------------------ | --------------- |
| 1. A low input opens the pull-up path      | 0–22 s          |
| 2. A high input opens the pull-down path   | 22–44 s         |
| 3. NAND needs both pull-down switches      | 44–66 s         |
| 4. NOR needs only one pull-down path       | 66–88 s         |
| 5. Voltage crosses an uncertain region     | 88–110 s        |
| 6. More capacitance takes longer           | 110–132 s       |
| 7. A transition travels through two stages | 132–154 s       |
| 8. Where does switching energy go?         | 154–177 s       |

Recordings: `/narration/logic-gates-zh-3ce71e9ca146.mp3` · `/narration/logic-gates-en-ea24bedaa57a.mp3`

Full continuous viewing, native bilingual listening and physical-phone performance remain separate pending evidence.

---

## Visual argument

Follow one output node as complementary transistor paths move its charge. A warm, pale circuit drawing uses copper pMOS, blue nMOS, and violet capacitance. The main object is the connected network itself: insulated gate controls, enabled/disabled channels, supply, ground and output capacitor. A voltage trace directly underneath follows the same state. This is transistor-level CMOS, distinct from the existing binary-adder's Boolean carry dependencies.

SVG is the primary medium and the complete 2D fallback. No ornamental transistor package or particle flow is used. Channel solidity encodes enabled state; branch emphasis also uses calculated branch current. The capacitor's small violet column indicates normalized voltage. Gates remain insulated from the channel, control-wire crossings use bridge hops where needed, and output junctions have dots. Two-stage exploration is restricted to inverters, matching the drawing.

The shared Showcase supplies the current caption below the scene. Watch mode has a short title, live input/output state, circuit, one trace and a chapter-specific readout. It does not repeat the full caption in a scene-top paragraph. Long interpretation and controls appear only in exploration.

## Frozen film

Eight chapters, initially 22 seconds each: **176 seconds**. Chinese and English speech are separately authored, with 50–55 English words per cue. Narration wording, captions, titles, order, count and director timing are frozen at handoff. Measured bilingual recordings and central integration belong to the parent.

| Window    | Calculated action                                           | New observation                                                                     |
| --------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 0–22 s    | Initially empty inverter output, A=0; 600 ps charging       | A pull-up changes voltage continuously through finite resistance                    |
| 22–44 s   | Charged inverter output, A=1; 600 ps discharging            | The complementary lower path releases stored charge                                 |
| 44–66 s   | NAND inputs 00→10→11→01→00 over 2400 ps                     | Only both series nMOS enabled complete a pull-down                                  |
| 66–88 s   | NOR, same sequence and time span                            | Parallel nMOS need only one high input; series pMOS slow the final rise             |
| 88–110 s  | Close observation of the inverter fall                      | Actual voltage passes through X; 50% marker measures a different boundary           |
| 110–132 s | Inverter C=10 fF, then C=40 fF, both on a 600 ps axis       | Four times the capacitance produces four times the half-voltage delay               |
| 132–154 s | First inverter falls; calculated crossing triggers the next | The continuous interstage wire carries voltage; the second capacitor responds later |
| 154–176 s | 1200 ps charging then 1200 ps discharging                   | Supply energy becomes stored energy and channel heat, then all becomes heat         |

Each 600 ps close observation uses `time=600 ps × progress²`. The load comparison resets its initial capacitor for each independent trial; it is not a capacitor-swapping transient. The energy chapter uses a cubic time map within each half to dwell on charging and release. NAND/NOR inputs change at 450, 900, 1350 and 1800 ps. All presentation changes are derived from chapter/progress; no private animation clock, random state or frame history exists. Seeking reconstructs a requested state directly.

## Independent model

Each enabled pMOS/nMOS channel is a positive resistor; each disabled channel is open. The inverter, NAND and NOR are explicit node/edge graphs. Graph reachability enforces one output-to-rail path, never both. A nodal KCL solve obtains internal potentials and equivalent output resistance; floating nodes are `null`, not silently grounded. Branch currents, heat and displayed connection state use those same edges.

For each input-event segment, `C dV/dt=(Vtarget−V)/Req`. The exact response is `V=Vtarget+(Vinitial−Vtarget)exp(−t/ReqC)`. The next segment starts at the previous final voltage. Signed transferred charge is `CΔV`. Source energy, channel heat and capacitor energy use analytic integrals, with instantaneous and cumulative closure: `Psupply=ΣI²R+d(½CV²)/dt` and `Esupply=Eheat+ΔEcapacitor`.

Defaults: VDD=1.2 V, C=20 fF, each enabled p/n channel=5 kΩ. The inverter has τ=100 ps, half-voltage delay 69.3147 ps and settled cycle supply energy 28.8 fJ. Fully charging stores 14.4 fJ and dissipates 14.4 fJ; full discharging dissipates the stored half. The film allows twelve τ per energy half-cycle, leaving a small finite-time difference from the asymptotic CVDD² result. No energy is artificially snapped to the limit.

The display labels V≤0.3VDD as 0, V≥0.7VDD as 1, and intermediate voltage X. A separate 0.5VDD selector determines the next ideal inverter's input events. Its response can start while Y₁ is still marked X. A pulse failing to reach 0.5VDD generates no second-stage event. These are declared teaching boundaries, not universal MOS threshold voltages, input/output guarantees or a datasheet propagation-delay specification.

The model omits nonlinear MOSFET I–V, gate-source/body effects, leakage, simultaneous partial conduction, channel capacitance and internal-node capacitance. It treats the first output's C as including wire and next-gate capacitance; the cascade does not double-count that load. Input driver energy is excluded. Equal p/n resistance is an authored comparison condition. Ideal steady CMOS draws no permanent DC current here; real chips retain leakage and other losses.

Manual domain: 0.8–1.8 V, C=5–80 fF, both channel resistances=2–20 kΩ, observation=0–1200 ps. Each input pair is selected independently. A missing crossing inside the window is labeled explicitly. Reset restores gate kind, both input pairs, supply, capacitance, both resistances, sample time and cascade state.

## Phone, accessibility and lifecycle

Desktop uses a 740-unit circuit. Phone uses a separate 310-unit arrangement, and folds the two inverters diagonally while retaining the connecting wire and both capacitors. Circuit text is 21–22 SVG units; ordinary labels remain 16 CSS px. The plot leaves scale text in HTML, so it does not shrink with the SVG. Only one relevant evidence block follows the trace. There is no oversized stage minimum or stack of secondary panels. The 320 px stage target is ≤900 px; actual chapter heights and label extents still require the parent's browser review.

Four ranges have explicit translated aria-labels, unique ids and matching labels. Inputs and buttons are at least 44 px. Buttons expose selected/disabled states, keyboard focus is visible, and reset uses the tested factory. The cascade toggle is disabled for NAND/NOR; changing gate type exits cascade view.

The scene uses `useShowcase` and the shared compact-layout hook. It creates no timer, animation frame loop, audio object, WebGL context, observer or worker. Shared visibility/background/reduced-motion handling remains authoritative. The media-query listener is disposed by the shared hook. The model cache is a bounded collection of authored event traces, independent of playback traversal. SVG does not require WebGL or external render assets.

## Primary references and provenance

- [MIT 6.004: CMOS Technology — Annotated Slides](https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c3/c3s1/): complementary pull-up/down networks, NAND topology, lumped RC timing and voltage guarantees.
- [Texas Instruments: CMOS Power Consumption and CPD Calculation](https://www.ti.com/lit/an/scaa035b/scaa035b.pdf): capacitive switching energy, real leakage and overlap contributions.

Accessed 2026-09-06. Equations and event integration were independently implemented for the declared teaching circuit. All SVG geometry, cover, CSS and traces are original code. No external images, fonts or other topic assets were added.

## Evidence and handoff boundary

Targeted Vitest passed **16/16 tests** at 2026-09-06 00:33:24 local time (219 ms run): all gate/input combinations, exclusive rail connectivity, unequal series/parallel resistances, internal KCL/floating nodes, analog/logic separation, RC limits and delay, event voltage continuity, instantaneous and integrated energy/charge, zero ideal steady draw, parameter scaling, cascade crossing and short-pulse suppression, 96 parameter corners, deterministic eight-chapter reconstruction, complete reset and invalid inputs.

Strict TypeScript passed for the owned model, experiment and renderer. Prettier passed for all 11 files. The packet audit passed with zero errors: 40 interface labels, 55 translations, four explicitly named ranges, existing related topics, all MDX anchors and supported formula markup, exact packet metadata and eight 22-second cues. Frozen narration SHA-256 of JSON serialization: `29c4884ff5544eaf2dfbfdad1c2ea8e2a8c7042c68dfe14df8b72f5baef73864`.

No browser UI review, full film viewing, native-media seeking, bilingual listening or physical-phone test was performed in this worker task. Static/model checks do not establish those forms of evidence. Any actual browser work must use CUA. Parent owns central integration, synthesis, media `currentTime` checks, desktop/320 px visual review, full builds and publication. No shared files, package/lockfiles, dependency links, audio outputs, git operations or deployment were changed.

Temporary packet: `src/data/scene-packets/logic-gates.json`. It uses the exact helper contract, omits topic number and preserves existing English translations. The parent consumes it into canonical registries; it is not a second permanent source of truth.
