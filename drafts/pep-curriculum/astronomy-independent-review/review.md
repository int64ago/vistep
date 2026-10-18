# Independent review: astronomy and contact impulse

Scope: `celestial-observations`, `gravity-measurements`, `relativity-experiments`, `gravitational-wave-lab`, `cosmology-observations`, `impulse-contact-lab`. Reviewed independently by the science worker on 2026-10-18. Existing tests were read but were not treated as acceptance evidence by themselves.

## Corrections made

- All six renderers now select authored film parameters independently of retained exploration state. Seven real React transition regressions change Neptune mass, attractor mass, muon speed, flight height, Weber common-signal state, H₀ or balloon speed, then return to the film and compare the entire rendered output with its original authored state.
- The LIGO vertical and horizontal arms now use the model's opposite signed half-strains. The moving end mirrors occupy the corresponding optical endpoints. Previously both drawn arms lengthened for positive strain even though the readout and text described differential strain.
- The horn's physical boresight now points upward at the same 30–90° elevation used in the atmospheric model; calibration holds 60°. The receiver cable is transformed with the receiver endpoint. Its retained raw temperature is marked TΣ; the article already explains that this raw value remains visible while the main readout subtracts known components.
- Cavendish's enlarged indicator now uses a fixed 4500 px/rad scale. The former 18000 px/rad placed the default equilibrium indicator at x≈376 (outside the 340-wide SVG). Both signs and exposed 79–200 kg mass limits remain within the fixed displayed scale, including the transient overshoot.
- Neptune residuals now share one fixed vertical scale across mass changes. The old automatic normalization largely canceled the intended control effect. The zero-mass numerical drift is less than 0.1 displayed pixel; doubled mass produces about twice the residual amplitude.
- Jupiter's disk and the nightly comparison disk use the same radius scale as the moon occultation criterion; no enlarged disk silently changes transit/occultation geometry.
- Binary pulsar Doppler sign now matches the observer on the right: motion toward that observer shortens the received period. The published convention Pobs=P₀(1+v_r/c) remains unchanged, with positive v_r explicitly defined as recession.
- The flying-clock aircraft's nose is tangent to its actual direction of travel for both eastbound and westbound paths.
- The catching hand follows the balloon's compressed horizontal surface rather than the original uncompressed radius.

No narration, shared registry, global translations or prose physics definitions were changed. No global build, browser operation, audio generation, commit or deployment was performed by this reviewer.

## Independent quantitative checks

`src/models/astronomy-impulse-benchmarks.test.ts` adds independent checks:

- The four-sphere torque at zero deflection agrees with 2GMml[1/d² − d/(4l²+d²)^(3/2)], retaining the distant spheres rather than only the nearer pair.
- A 9.5 km/s noncircular Earth orbit conserves specific orbital energy to relative error below 10⁻⁵. Circular speed at 300 km is approximately 7.7299 km/s.
- For β=0.995 and 10 km, independent decimal arithmetic gives γ=10.0125234864, lab time=33.5240296682 μs, and survival=0.2178377313 using the PDG mean lifetime. East/west flight-clock subtraction recovers the analytic 2v_ground u t/c² difference.
- Binary pulsar approach/recession is checked against a numerical derivative of its actual plotted x coordinate. The orbital shortening is approximately 75.8 μs/year.
- A numerical derivative of inspiral phase equals 2π times the stated instantaneous frequency at early, intermediate and late inspiral times.
- Halley's high-eccentricity Kepler solution satisfies Kepler's equation at 999 phases, including near perihelion.
- At both exposed crash-duration limits (0.04 and 0.16 s), integrated vehicle force equals its momentum change within 0.02%, and integrated restraint force agrees with the occupant's independent momentum change. No negative stopped vehicle velocity or nonfinite response is generated.

The original 22 model tests plus the new 19 transition, geometry and benchmark tests pass: 41 tests in eight files. TypeScript syntactic and semantic diagnostics were checked for the six components and changed/new tests/model (not merely syntax transpilation).

## Primary references consulted

- [JPL astrodynamic parameters](https://ssd.jpl.nasa.gov/astro_par.html): GM units and terrestrial/solar reference magnitudes. Small differences between fixed educational constants and current ephemeris values are not represented as observational precision.
- [PDG muon listing](https://pdg.lbl.gov/2025/listings/rpp2025-list-muon.pdf): 2.1969811 μs is the mean lifetime, not the half-life.
- [Nobel Committee's 1993 scientific account](https://www.nobelprize.org/prizes/physics/1993/press-release/%26lang%3Den/): measured orbital-period decrease is about 75 millionths of a second per year.
- [LIGO interferometer explanation](https://www.ligo.caltech.edu/LA/page/what-is-interferometer) and [LIGO FAQ](https://www.ligo.caltech.edu/LA/page/faq): perpendicular arms change in opposite directions; the readout responds to their difference.
- [NASA COBE science](https://science.nasa.gov/mission/cobe/science/): 2.725 K mean CMB temperature. The scene labels its anisotropy map as synthetic and its antenna background calculation as a teaching model.

## Evidence limits and handoff

Actual saved CUA stills viewed: `gravity-measurements-zh-390-chapter-4-sweep.png`, `cosmology-observations-en-390-chapter-4-mid.png`, and `cosmology-observations-zh-390-chapter-3-sweep.png`. These predate this correction batch. The gravity still confirms the missing/offscreen scale indicator. The English cosmology still is covered by the autoplay-permission card and is not accepted as apparatus visual evidence.

The current correction batch is verified by model and actual SVG/React-state tests. New real-browser stills, complete playback, bilingual voice listening and device performance remain the root acceptance responsibility. No such evidence is claimed here.
