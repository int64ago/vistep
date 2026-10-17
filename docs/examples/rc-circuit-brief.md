# RC circuit — a shrinking rate builds a growing state

Owner: `/root/hundred_mechanisms`. Medium: circuit with charge-separated plates, voltage budget, time trace and final energy ledger. Track the capacitor voltage at every chapter; no charge crosses the dielectric in the image.

Misconception: decreasing current means capacitor voltage must decrease; one time constant means fully charged. Prerequisites: voltage difference and a resistor. Distinction from rectifier: isolates the exact transient, R versus C intervention and energy balance without diode switching.

Primary reference: [OpenStax University Physics 2 §10.5 RC Circuits](https://openstax.org/books/university-physics-volume-2/pages/10-5-rc-circuits). Claims: exponential first-order transient; τ = RC; 63.2% at one τ; reverse current on discharge. Energy follows the same state and I²R integration, tested for arbitrary nonnegative initial and target voltages. Original diagram and narration, no reused figures.

Benchmark: 5 V, 1 kΩ, 1 mF at 1 s gives VC = 3.160602794 V and I = 1.839397206 mA. Boundaries: finite initial current, voltage continuity on switch, zero time energy, R = 0 rejected, arbitrary initial energy included in conservation. Limits: ideal positive linear R/C, ideal DC source, no leakage/ESR/inductance/dielectric absorption or breakdown.

Seven causal chapters: initial finite current; voltage budget trade; one versus five time constants; vary R at fixed physical time; vary C at the same fixed time; discharge after source removal; full energy balance. R comparison and C comparison include the unchanged default trace. Auto states reconstruct analytically from shared chapter progress, with no timer.

Desktop circuit and voltage budget sit side by side, followed by a wide trace. Phone preserves a complete circuit at 350 units with 21-unit glyphs, then a compact voltage strip and a separate 340-unit trace. Both use physical seconds and name the same components in speech. Cover geometry is original and its curve and marker use the same model.

Author model tests: 7 passed. Browser stills, continuous playback, independent review, full listening, physical phone and publication: not-run. Speech is proposed until integrator reviews the decisive shots. Inbound suggestions: `rectifier`, `lithium-battery`, `buck-converter`.
