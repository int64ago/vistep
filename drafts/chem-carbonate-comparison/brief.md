# 两种碳酸盐的对照

Owner: chemistry_inventory. Targets: `chem-required-1-experiment-2-4` and `chem-required-1-experiment-2-5`. This revision changes the explanation from a procedure sequence into a causal argument grounded in the textbook. The five existing chapter IDs remain in order; three explanatory chapters are inserted. Root owns registration, curricula, translations, narration and audio.

The opening asks why similar white salts give different temperature and indicator responses, and why a salt named bicarbonate can still be alkaline. The tracked objects are the original sample, one marked hydrogen, the carbon inventory and the atoms/products of thermal decomposition. A title, formula or narration alone does not count as the causal shot.

## Eight visible steps

1. `water`: compare the original textbook samples, their remaining solid and opposite qualitative temperature changes.
2. `solvation-energy`: separate old ionic neighbours, orient water toward the anion and distinguish energy required from energy released; then compare the net heat directions.
3. `indicator`: separate the qualitative textbook recipe from a new equal-concentration dilute-solution comparison.
4. `proton-balance`: follow a hydrogen from water to carbonate, retain spectator sodium, show bicarbonate accepting and donating a proton, and visibly connect carbonic acid to the dissolved-CO₂ pool.
5. `dilution-prediction`: add only water, conserve total carbon and show a colourless but still alkaline counterexample.
6. `carbonate-heat`: use the continuous heated-tube/gas-detector arrangement to establish the carbonate control.
7. `bicarbonate-heat`: connect gas and condensation evidence to the same twelve atoms distributed among carbonate, water and carbon dioxide.
8. `mass`: predict the residue after complete conversion, compare partial conversion, then distinguish further possible mass loss from a claim of purity.

The P38 lesson contains the first five chapters. P39 independently contains the final three. Exploration retains the samples, energy, proton routes, equilibrium, dilution, heating, atom map and mass prediction; changing exploration does not alter the watch director.

## Models and scientific limits

Independent models solve dilute carbonate equilibria using total carbon, sodium, water autoionization and charge balance. The numerical pH comparison is an ideal, closed 25°C system at 0.010 mol/L, not a measurement of the textbook’s approximately 1 g samples with 5 mL of water. Phenolphthalein tone is qualitative. K₁* = 10⁻⁶·³⁵ describes the combined CO₂(aq)/H₂CO₃ pool; it is not the intrinsic dissociation constant of pure carbonic acid. The visible pool connection preserves that distinction.

Proton paths are net material maps with fixed atom identities and a shared geometry, not molecular trajectories or transition states. Bond lines indicate adjacency and omit bond order and electron distribution. Hydration arrows express direction without a calibrated heat scale. The dissolution endpoint is a room-temperature approximation; no numerical temperature or kinetic law is invented.

Thermal decomposition uses 2 NaHCO₃ → Na₂CO₃ + H₂O + CO₂. Twelve stable atom IDs preserve 2 Na, 2 C, 2 H and 6 O. The molar masses predict 0.630836 g residue from 1 g after complete conversion and 0.815418 g at half conversion; all unreacted solid and escaping products remain in the mass balance. Reaction extent is not inferred from heating time. Carbonate stability and limewater’s small-CO₂ response are restricted to the illustrated conditions. Constant mass does not independently establish purity.

## Sources actually consulted

The supplied Required Book 1 PDF, pages 43–44, corresponds to printed P38–39; the full surrounding context P37–41 and the original experimental page images were read. The textbook supplies the sample comparisons and heating experiment; equal-concentration pH and weighing are explicitly added explanations/predictions.

[ACS Lesson 5.9](https://www.acs.org/middleschoolchemistry/lessonplans/chapter5/lesson9.html) supports the energy-direction explanation. The [USGS carbonate speciation method](https://water.usgs.gov/water-resources/memos/memo.php?id=2098) supports the dilute equilibrium constants and water contribution. The indexed primary text of [Pines and colleagues](https://pmc.ncbi.nlm.nih.gov/articles/PMC5747581/) distinguishes the apparent CO₂-inclusive constant from intrinsic carbonic-acid dissociation; the owner did not claim a successful direct full-text fetch. [RSC’s indicator demonstration](https://edu.rsc.org/experiments/indicators-and-dry-ice-demonstration/703.article) supports the indicator boundary. The [Alameda thermal-decomposition manual](https://alameda.edu/hubfs/Chem-1A-Exp.-7-Decomposition-of-Sodium-Carbonate.pdf) supports residue testing; its actual document title is bicarbonate despite the URL filename. None of their different recipes is presented as a PEP measurement.

## Evidence and remaining review

The silent author review passed independent model benchmarks, conservation and finite-input boundaries, component state regressions, targeted TypeScript diagnostics and scoped formatting. Actual screenshots were inspected on desktop and simulated narrow viewports. Seventy-two paused layout cases passed, including all eight chapters in both languages at 320 and 1440 px and the decisive proton, pool, atom and mass subshots; the tallest measured phone player ended at 828.58 px in a 320 × 844 viewport. Fourteen real UI click/keyboard operations passed with no page errors. Root independently inspected the decisive screenshots. These checks are recorded separately in the ignored `artifacts/teaching-principles/carbonate-implementation/acceptance.json`.

Root subsequently generated new Chinese and English audio, then expanded the two bicarbonate transfers to make each route observable. The resulting shared timeline measures 202 s, including a 34 s proton chapter. The director uses actual chapter seconds and independent word timestamps, including the 0.45 s narration lead-in. Each bicarbonate transfer takes three seconds and holds its endpoint briefly before changing shots. The two languages have different bicarbonate accept/donate sentence times, so only those internal shot boundaries are localized; scientific inputs and models remain the same. The mass chapter shows the full-conversion prediction before the spoken 0.631 g value, then partial conversion and reheating comparisons. The thermal atom map remains visible through its spoken mechanism qualification.

The original 178 s silent timeline is not evidence of synchronization. After timing repair, 60 measured-event layout cases passed; the expanded proton cue then passed 24 fresh bilingual desktop/phone cases. The owner visually inspected the changed mass stages, thermal atom limits, energy and dilution states, and both revised proton-transfer midpoints/endpoints. These timing checks and their exact source hashes are recorded in `artifacts/teaching-principles/carbonate-implementation/measured-sync-review.json`. Complete playback still requires separate root review. Independent ASR is not subjective listening. Full bilingual listening, physical-phone performance, production CSS/build checks and publication are separate root-owned acceptance items; this brief does not mark them passed.
