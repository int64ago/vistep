# 电解质与电流

Targets: chem-required-1-experiment-1-2; chem-required-1-model-p15. Owner: chemistry worker.

Misconception: ionic solids must conduct, and electricity creates the ions. Prerequisite: positive/negative charges. Distinct treatment: actual two-electrode circuit with detector, local lattice-to-solution projection and electrode polarity. Phone reflows circuit above the local particle view; body text stays at least16px and controls44px.

Claims: source textbook required1 printed14–16 / PDF19–21. OpenStax Electrolytes supports dissociation distinction. UMass Table18.3 provides limiting conductances at25°C. USGS Specific Conductance explains dependence on ion type, concentration and instrument conditions. Numerical model uses sum λc, cellconstant1cm⁻¹, voltage3V. Threshold10µA is explicitly illustrative. No lamp calibration is claimed.

Chapters: dry salt swap; water below threshold with nonzero current; salt dissolution releases existing ions; open then closed circuit changes drift only. The model entry starts on dissolved sodium chloride with the correct apparatus; watch ignores exploration.

Benchmark: 1mmol/LNaCl contributes126.4µS/cm, giving379.2µA at3V in the ideal cell before water background. Boundary: open circuit, immobile crystal, zero added salt, reversed voltage; charge signs retain identity. Short-time local drift prevents invented infinite electrode accumulation. Water molecules, random thermal motion and electrode reactions omitted explicitly.

Checks: scoped Vitest tests passed (4 tests, 2026-10-18); packet validation passed. No browser full playback, audio listening or physical-phone performance claimed. Integrator independently verifies those categories.
