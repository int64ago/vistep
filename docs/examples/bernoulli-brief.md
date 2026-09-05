# Bernoulli · one water path

## Direction

The opening asks why a narrow throat carries faster water but a lower pressure column. Follow one material volume, then follow the energy account; do not teach a universal “fast means low pressure” rule. A continuous glass-like Venturi, three connected pressure taps, restrained ochre material bands and pale laboratory paper establish a distinct composition. Original SVG section geometry is more useful here than ornamental 3D: it exposes the complete finite water path, cross-sectional area and pressure connection at once. Both the apparatus and cover derive their sections and material bands from the independent model.

The initial storyboard allotted eight 22-second chapters. Each reconstructs directly from shared chapter/progress, including material identity; no frame history, random particles, private clock or periodic teleporting is used.

| Chapter | Visible causal observation                                                                                 | Phone composition                                                                             |
| ------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1       | The connected throat has larger velocity and a lower pressure column at prescribed steady flow.            | Whole tube and three columns.                                                                 |
| 2       | One conserved volume lengthens and accelerates through the throat.                                         | Equal-scale circular sections replace the columns above the tracked band.                     |
| 3       | A moving probe trades pressure head for velocity head while total head stays constant.                     | One head graph, a small connected tube and three numeric terms.                               |
| 4       | The probe follows the diffuser: velocity decreases and lossless pressure recovers.                         | Tube and columns with local probe pressure and velocity.                                      |
| 5       | A uniform tube rises while both endpoint velocities remain equal; pressure changes with elevation.         | Tilted connected assembly; independent steady states explicitly labeled.                      |
| 6       | Flow is set to zero in the same inclined tube; a moving probe still sees hydrostatic pressure differences. | Stationary bands, level surfaces and local pressure/elevation.                                |
| 7       | A specified Darcy loss lowers total head relative to an otherwise identical lossless reference.            | Head diagram replaces the assembly; cumulative loss follows the probe.                        |
| 8       | Lower prescribed absolute pressure reaches the single-phase boundary.                                      | Sealed taps and a persistent limit panel; rejected and limiting inlet pressures are separate. |

The head graph uses gauge pressure and meters. Open-column free surfaces use the same height scale as centerline elevation. The bore is enlarged for legibility, with relative circular diameters retained. Readings refer to the pipe axis. Low columns, including columns obscured by the enlarged bore drawing, switch to connected sealed absolute-pressure instruments. This avoids fictitious open water columns while stating the display convention.

## Model and limits

Authored baseline: L=1.8m, inlet bore D=0.06m, throat/inlet area ratio 0.36, Q=0.004m³/s, inlet absolute pressure 113100Pa, density 998.2kg/m³, g=9.80665m/s², atmospheric pressure 101325Pa and vapor pressure 2338Pa. Inlet flow and pressure are prescribed by equipment outside the finite domain; outlet pressure is calculated. No atmospheric outlet constraint or invisible closed loop is added.

A(s) varies through smooth cubic contraction and expansion sections. Circular diameter is √(4A/π). The analytic volume coordinate V(s)=∫A ds is invertible; each material boundary advances by V(t)=V(0)+Qt. Thus ds/dt=Q/A and the material volume is conserved. The default whole-tube residence time is 0.946625s; physical motion is slowed for observation, with a labeled physical clock. Apparatus-change chapters are a family of steady solutions and do not advect markers during parameter changes.

The section-mean model uses kinetic correction factor 1 and p/(ρg)+v²/(2g)+z=H for the lossless baseline. The comparison integrates hL=∫f v²/(2gD) ds, with authored Darcy f=0.035. It holds Q, geometry and inlet pressure identical to the f=0 reference. Composite Simpson integration splits at geometry breakpoints. This is an explicit distributed-loss model; it is not a Reynolds-number correlation, measured Venturi calibration or automatic turbulence solver. Separation, local losses, radial profiles, measuring-tube storage, capillarity and surface oscillations are omitted. Mechanical loss is transfer to untracked internal-energy modes, not disappearance of total energy.

A sub-vapor requested state is not exposed. The minimum is refined between spatial nodes, and inlet pressure is shifted to the limiting steady state whose minimum reaches 2338Pa. Requested and limiting pressures are separately labeled, and material motion stops. The model does not predict vapor formation, bubbles, two-phase discharge or rejoining. Reverse flow, invalid geometry, nonfinite inputs and positions beyond the finite domain throw explicit errors.

## Sources and provenance

- [NASA Glenn: Mass Flow Rate](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/mass-flow-rate/): conservation of mass and the area/velocity relation.
- [NASA Glenn: Bernoulli’s Equation](https://www.grc.nasa.gov/www/k-12/airplane/bern.html): energy derivation and restrictions; only the continuum argument is used.
- [US Bureau of Reclamation: Differential Head Flowmeters](https://www.usbr.gov/tsc/techreferences/mands/wmm/chap14_03.html): connected upstream/throat taps, energy balance, calibration and actual meter limitations.
- [US EPA SWMM Hydraulics Reference Manual, §7.3.2](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P100S9AS.txt): Darcy head-loss gradient f v²/(2gD). The scene specifies f rather than implementing SWMM's correlations.
- [NIST water vapor-pressure equation](https://nvlpubs.nist.gov/nistpubs/jres/75A/jresv75An3p213_A1b.pdf): approximate 20°C threshold.

Graphics are original procedural SVG; no external visual assets or third-party image licenses are required. Native SVG is the primary and fallback path, without WebGL, workers or audio resources. ResizeObservers disconnect on unmount. Shared Showcase owns playback, reduced motion, offscreen/background pauses, replay and seeking.

## Evidence

- `pnpm exec vitest run src/models/bernoulli.test.ts`: **12 tests passed**. Checks cover finite connected circular geometry, analytic volume/inversion, Q=Av, independent two-section Bernoulli pressure, recovery, actual material speed and identity, equal-area elevation, Q=0 hydrostatics, analytic constant-diameter Darcy loss, mechanical-power balance, variable-diameter integration convergence, exact vapor equality, between-node vapor minima, deterministic seeking, exploration boundary combinations and rejected domains.
- Baseline checks: inlet velocity 1.414711m/s, throat velocity 3.929752m/s, inlet–throat pressure difference 6708.674Pa, tube volume 3.786499L. Distributed loss is 0.477026761m for f=0.035. Loss integration errors against 1920 segments are 7.61×10⁻⁷, 3.88×10⁻⁸ and 1.43×10⁻⁹m for 60/120/240 segments.
- Targeted TypeScript check of model, experiment and renderer passed. Cover and both MDX documents compiled independently. Packet schema, paths, all static/dynamic Chinese strings, metadata, existing translation wording, registered related topics and eight authored bilingual cues validated.
- Seven manual ranges have explicit translated `aria-label` attributes, verified in rendered markup. Reset restores flow, area ratio, rise, inlet pressure, friction, material time and probe. There is no persistent manual comparison toggle to leave behind. Keyboard interaction itself was not exercised.
- Isolated Chrome 152.0.7977.76 on macOS, using fresh temporary profiles and DevTools device-metric overrides: **54 static SSR cases**, both languages, all chapters and both ends of the vapor chapter. Actual viewport widths 320/390/1080px. Component height ranges: **618–857 / 618–828 / 695–795px** respectively, with zero horizontal overflow and minimum effective SVG text size 16px. These are component bounds, not a claim about the parent transport/caption shell. The QA fixture used repository CSS and system fallback fonts; hydrated font loading still needs integrated review.
- Visually inspected English phone assembly, material close-up, head account, loss comparison, elevation and vapor state; Chinese phone assembly; English desktop assembly. Static browser artifacts and measurements are in `/tmp/vistep-bernoulli-qa/`, outside tracked topic assets. These do not constitute a complete watch-through, manual keyboard test, listening or physical-phone performance measurement.

## Handoff

Topic metadata, translations and narration are integrated in the canonical registries; the temporary handoff has been consumed. `src/data/narration.json` and `src/data/film-timeline.json` own the recorded timing.

## Recorded integration

Both languages run **200.0 seconds**. Actual chapter starts in seconds: 0, 23.0, 46.5, 71.0, 95.5, 120.0, 147.0, 173.5. Authored words are unchanged; measured windows allow breathing room for the longer recording, and the animation reconstructs from the same chapter progress.

zh: `/narration/bernoulli-zh-e68d2a4c80ea.mp3` · en: `/narration/bernoulli-en-965132b7bde2.mp3`
