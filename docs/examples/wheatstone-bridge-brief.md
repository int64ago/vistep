# Wheatstone bridge — a null is local

Owner: `/root/hundred_mechanisms`. Medium: instrument schematic and paired potential scales. No simulated moving electrons. Stable IDs A/B, R1–R4 and detector sign survive mobile layout.

Misconception: a zero detector reading means there is no current anywhere. Prerequisites: voltage difference, resistance and a split path. Distinction: develops measurement loading and ratios beyond rectifier/transistor current paths.

Source: [Analog Devices, Resistive Bridge Basics: Part One, Basic Bridge Configurations](https://www.analog.com/en/resources/technical-articles/resistive-bridge-basics-part-one--maxim-integrated.html). Claims: bridge compares divider midpoints; matching ratios null output; resistance change gives sensor output; real measurement limitations. Our naming is R1/R2 left and R3/R4 right, explicitly different from some reference drawings. Loaded model follows Kirchhoff nodal equations, with a finite detector resistance, verified by independent unloaded-divider and energy-conservation checks.

Benchmark: 5 V into four 1 kΩ resistors produces 2.5 V at both nodes, zero detector current and 5 mA supply current. Counterexamples: zero excitation also nulls an unbalanced bridge; low detector resistance changes an unbalanced output. Limits: positive linear resistors, DC steady state, ideal excitation, no parasitics/noise/self-heating.

Six shots: null with supply current; matched midpoint potentials; vary R4; restore ratio by changing R2; scale excitation while preserving null; vary detector resistance to reveal loading. Each chapter changes a computed quantity or exposes a distinct previously hidden relationship.

Wide layout uses a broad circuit with component values away from paths. Phone uses an independent 350-unit view with branches at 75/275, compact detector and separate CSS potential scales. Long narration is kept outside the scene. Cover uses the same model for needle angle.

Author model tests: 6 passed. Visual, complete playback, listening, physical devices, independent review and publication not-run. Proposed narration awaits integrator keyframe review. Inbound suggestions: `rectifier`, `buck-converter`, `body-fat-scale`.
