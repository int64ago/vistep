# Water hammer · production brief

[简体中文](../zh-CN/examples/water-hammer-brief.md)

## Concept and film

Current recording revision (2026-09-06): both tracks run **189.0 seconds**. See [the refinement record](../qa-expansion-refinements.md) for the updated windows and review limits. Earlier recording names, timings and review results below describe the preceding version.

A longitudinal pressure-wave bench replaces the usual tank-and-slider arrangement. A connected reservoir, transparent elastic pipe, probe and terminal gate show where flow has actually changed. Warm and cool fields encode pressure increments; arrow direction and length encode the same solver's velocity. The 176-second silent-readable film has eight 22-second chapters: local valve closure; upstream propagation; water compression and wall strain; reservoir reflection; closed-valve reflection; fast/slow closure; stiff/compliant wall; first vapor-pressure encounter. Each shot reconstructs from chapter/progress, independent of previous playback or seeking. Separate authored Chinese and English scripts are in the packet for parent-owned measured voice synthesis.

The phone layout reorients the horizontal pipe's distance axis vertically, explicitly labels that convention, and selects one causal view per chapter. The elastic chapter replaces the assembly with a local material view; comparison chapters replace it with paired fields. Only the closure comparison retains a watch-mode history chart on phones. Redundant headers and clock panels are hidden rather than stacked. Body copy stays at 16px and controls at least 44px. Final compact phone stage height has **not** been browser-measured; integrated 320px bilingual review remains with the parent. SVG dimensions respond through a disposed ResizeObserver; there is no WebGL dependency or missing-asset fallback. The shared Showcase controls motion, reduced-motion behavior and offscreen/background pausing. Run caches are bounded and released on unmount.

## Model

The independent solver implements linear, frictionless, one-dimensional elastic water hammer: p′_t + ρa²u_x = 0 and u_t + p′_x/ρ = 0. Compliance C = 1/K + cD/(Ee), wave speed a = 1/√(ρC), and characteristic impedance Z = ρa. Method-of-characteristics steps use aΔt/Δx = 1. All displayed pressure, speed, wall strain, water strain, displacement, transit times and energy follow this model; temporal interpolation is presentation only.

Authored defaults: L=120m, D=0.08m, e=0.004m, ρ=998.2kg/m³, K=2.2GPa, E=200GPa, c=1, U₀=1m/s, upstream absolute pressure 1.8MPa, downstream 0.101325MPa, and vapor threshold 2338Pa. There are 96 spatial cells. The schematic reservoir is a prescribed-pressure boundary, not a hydrostatic conversion of the drawn liquid height. Fast/slow trials change only closure time (0.02/0.90s); stiffness trials change only E (200/20GPa).

The upstream reservoir fixes p′=0. The downstream boundary solves the arriving characteristic together with a signed pressure-dependent orifice law, u|u|=τ²U₀²(p_valve−p_down)/(p₀−p_down), where τ=1−3r²+2r³ during closure. Fully closed means u=0. Gate aperture represents this authored effective coefficient, not a universal valve motion curve. Fixed pressure reverses the reflected pressure disturbance; fixed velocity preserves its pressure sign. Joukowsky Δp=−ρaΔu describes the first rapid-change wave, not every possible network peak.

At the first p≤p_vapor, the model interpolates to the boundary and terminates. It never continues a liquid-only solution below vapor pressure. The exact equality endpoint is covered by a regression with Z=10⁶ and p₀=Z U₀+2338Pa: the returning wave reaches precisely 2338Pa at 2L/a. The regression failed before the first-event comparison was corrected, then passed. Cavity growth, collapse, gas, viscoelasticity, friction, convection, support vibration and nonlinear material response are outside scope. Main wall displacement is enlarged 500 times and local strains 800 times, explicitly labeled.

## Sources and provenance

- [USACE HEC: Pressurized Pipe Flow](https://www.hec.usace.army.mil/confluence/rasdocs/ras1dtechref/6.5/overview-of-optional-capabilities/pressurized-pipe-flow): governing equations, characteristics and elastic-wall wave-speed correction. The scene's restraint factor is an authored choice.
- [Simpson and Wylie, 1991](https://digital.library.adelaide.edu.au/dspace/handle/2440/80903): experiments and analysis showing why column separation and rejoining require care beyond a simple Joukowsky bound.
- [Bergant, Simpson and Tijsseling](https://research.tue.nl/files/2010395/587547.pdf): primary research review of column separation and associated modeling limits.
- [NIST water vapor-pressure equation](https://nvlpubs.nist.gov/nistpubs/jres/75A/jresv75An3p213_A1b.pdf): approximate 20°C vapor threshold.

All apparatus and cover graphics are original procedural SVG. There are no external assets or third-party image licenses.

## Evidence and handoff

- `pnpm exec vitest run src/models/water-hammer.test.ts`: 12 tests passed. Coverage includes finite wave speed and Joukowsky amplitude, orifice/characteristic residuals, both reflection boundaries, exact discrete energy, boundary-volume/storage balance, same-condition slow closure, 32/64/128-cell convergence against 1024 cells, first vapor crossing and exact equality, deterministic seeks, zero-flow/rigid limits, and invalid inputs.
- Targeted TypeScript check of the model, experiment and bench passed with React JSX, bundler resolution and ES2023.
- Static SVG raster review was performed for wide and phone pipe, elastic and comparison views. It exposed segment seams and a gate-motion issue, both corrected. The subsequent compact phone layout still needs final browser review; these raster checks are not a complete playback or physical-phone performance test.
- Packet schema, all directly called translation labels, existing translation preservation, component/cover paths and eight 22-second cues checked. Related topics are siphon and hydraulic-brake. Stable packet: the central topic, narration and translation registries.
- No shared build, global formatter, registry modification, audio generator, git operation or deployment was run. No listening or physical-device evidence is claimed. Parent owns registration, synthesis, integrated player/browser review and publish.

## Measured integration

Both language tracks measure 189.5 seconds, sharing eight chapter windows. Assets: `/narration/water-hammer-zh-c934d8fad577.mp3` and `/narration/water-hammer-en-d7d1afed8d12.mp3`. The parent confirmed all existing 26 narration, manifest, track and timeline entries remain semantically unchanged. The temporary packet has been consumed; canonical scripts now live in `src/data/narration.json`. Independent transcription and final browser review are in progress. Native listening and physical-phone measurements remain outstanding.

Final independent transcription: all 16 chapter/language pairs passed; minimum similarity 0.9341, minimum ending coverage 0.8750. This is not a listening judgment about natural delivery.
