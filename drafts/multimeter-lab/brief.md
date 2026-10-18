# Multimeter: one head, three conversions

This is an isolated Batch 13 candidate under `artifacts/teaching-principles/batch-13-staging/physics`. It has not been copied into product source. Root owns shared integration, measured recordings, actual player acceptance, global checks and publication.

## What must become visible

The existing seven-chapter practice window changes probes, ranges and specimens but never shows why the same head can measure three quantities. The existing three-chapter diagnosis window already uses finite meter loading and preserves the distinction between voltage and working current. Keep that causal model and the ten chapter IDs in their present order.

The opening question is why one pointer can read voltage, current or resistance. Track the same 50 µA, 2 kΩ head. In voltage mode, show its series resistor taking most of the applied voltage; in current mode, follow total current splitting between head and shunt and rejoining; in ohms mode, follow the internal battery through the isolated specimen and the return network. A low-ohm multiplier must not imply that a 2 kΩ head alone somehow has a 20 Ω input.

The three conversions use one physical head, not three unrelated normalized needles. The pointer derives from actual head current. Its mechanical stop does not clip the computed overload current. Animated line marks indicate conventional current direction only; they do not encode carrier speed or individual charge count.

## Source reading and retained scope

Read the complete relevant textbook context, Required 3 pages 68–77: conservation in series/parallel circuits; page 70 series/shunt meter conversion; pages 72–73 use and the resistor, filament, hand and diode applications; page 74 fault candidates; pages 75–77 related loading and broken-wire exercises. Original pages 73 and 74 were actually opened as images. The source's page 74 candidate set has three faults; the retained wire case is a declared extension consistent with page 76, not a fourth item attributed to page 74.

Verified the official HIOKI input-resistance FAQ and the complete relevant sections of the downloaded 3007 manual. Its printed page 18 explicitly says black is positive when the ohmmeter is treated as a source; printed pages 19–20 explain range-dependent semiconductor testing. This specific convention stays qualified. The 20 kΩ/V reference is for HIOKI 3030-10/3008; the 3007 specification is different. The proposed 50 µA/2 kΩ network is an explanatory equivalent, not a copied manufacturer schematic. OpenStax supplies the circuit principles, not measured data.

The original implementation and actual development-page baseline remain separate evidence. Four baseline states showed a 631.64–678.44 px player at 320×568, with the fault caption and transport below the screen. The candidate therefore separates the external circuit, internal conversion and applications into compact local views. Candidate frames are not actual player acceptance.

## Narrative and learning windows

Plan 267 seconds, leaving 33 seconds below the five-minute ceiling for measured recordings. Revise only the first four spoken pairs; preserve the last six Chinese/English spoken strings byte-for-byte. Screen captions are independently shortened.

1. `voltage-parallel`, 35 s: external parallel connection → same head and series drop → hold the 10 V range prediction → larger resistance, approximately half deflection at nearly unchanged lamp voltage.
2. `current-series`, 32 s: series insertion → actual branch currents and their sum → predict the smaller range → too much head current, with the mechanical pointer stop separately explained.
3. `ohm-zero`, 30 s: open probes → no closed loop → internal cell/shorted loop → adjust internal resistance to the same full-scale head current.
4. `fixed-resistor`, 23 s: add R₀ → half deflection; predict another external doubling → one third, not one quarter; recover the retained 470 Ω example.
5. `cold-filament`, retained 20 s: cold equivalent and small meter current, without normal incandescence.
6. `hand-contact`, retained measured window 23 s: same person, changed equivalent contact path; no health inference.
7. `diode-direction`, retained 28 s: explicitly modeled black-positive convention; forward/reverse paths and range dependence. Extremely small current reads approximately infinity on the analog scale.
   8–10. `fault-battery`, `fault-switch-wire`, `fault-socket`, retained 24/24/28 s: keep the original inference sequence and finite load model; make meter and filament currents visible separately and mark the actual bad contact.

The practice entrance retains chapters 0–6; the diagnosis entrance retains chapters 7–9. Both have complete question, evidence, explanation and transfer proposals in the packet. No page, original title or curriculum order is changed.

## Independent science and geometry contracts

- At 5 V full scale, 50 µA through 100 kΩ gives 98 kΩ series resistance plus the 2 kΩ head. At 0.5 A, a 0.200020002 Ω shunt leaves 50 µA in the head and 0.49995 A in the shunt.
- Current-mode burden is the derived parallel equivalent, 0.2 Ω on the 0.5 A range, rather than the old arbitrary 0.5 Ω constant. The lamp current and internal branch currents come from the same loaded network.
- Ohms mode: R₀ = 20m, parallel equivalent Rₚ = R₀/15, series part R₀/gain − Rₚ. This passive scheme shares the same head at all four multipliers and is explicitly bounded below its no-shunt limit. Validate KCL, KVL, power and calibrated zero.
- Diode current is solved jointly with the internal source and resistance. Reverse leakage is a finite approximation, not breakdown or infinite resistance.
- Faults use 1 GΩ bad contacts and a 20 kΩ/V input. Branch currents obey KCL and source drops obey KVL. A large measured voltage can coexist with about nanoampere filament current. The node geometry must place probes around the modeled section; the outer socket measurement includes contact and filament.
- Phone and desktop have distinct 268×280 and 640×280 compositions: desktop separates the meter and external object horizontally, expands circuit nodes and puts branch readouts beside their paths; the phone stacks the connected objects. Phone SVG width is capped at 268 px, preserving its 17 px labels. Actual complete 320×568 player geometry is pending integration, not inferred from this isolated size.

## Candidate checks and remaining evidence

The candidate's 19 model/component tests and strict Astro TypeScript options pass; an independent chemistry owner also passed 859 actual-function assertions for the head/range/ohm/loading/fault contracts, without claiming UI, voice or diode acceptance; both articles compile with the installed Astro MDX renderer. Sixty-eight isolated SVG states were checked in each layout iteration. Selected internal circuits, external leads, diode and loaded socket states were personally viewed; they do not establish actual native controls or complete playback. The first visual pass improved a crowded cell label and changed ambiguous current initials to explicit meter/filament names. Manual probe reversal is retained, and a short/open setting no longer leaks into another specimen.

Still required after root copies the exact manifest: actual bilingual desktop and 320×568 player with shared captions, all controls and both fresh textbook entrances, real catalog/social cover consumers, prediction holds/reveals, reduced motion/resource boundaries, measured narration event cuts, uninterrupted native playback, subjective listening if available, and root global verify/build. Physical-device performance is a separate unmeasured category.
