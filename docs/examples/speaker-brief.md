# Speaker — current, motion and air

A 187.5-second film and optional experiment. Canonical narration is in `src/data/narration.json`; scene metadata is in `src/data/topics.ts`. Narration, captions, eight chapters and director timing are frozen for handoff.

## The observation

A speaker is a reciprocal motor. Current produces axial force; coil velocity produces back EMF. Follow a copper winding into a bonded cone assembly, then watch its supports flex without any disconnected endpoints. Cutting the applied voltage to zero while keeping the circuit closed reveals the reverse conversion. The final air view distinguishes a traveling compression pattern from a material point that stays nearby.

## Visual direction

The main medium is an original SVG meridional section: brushed steel, a warm permanent magnet, copper windings, a graphite cone, rolled surround, corrugated spider and two flexible leads. SVG is the primary concept-preserving 2D path; no WebGL or external model is needed. Mechanical motion is magnified uniformly eight times. Actual readouts remain in SI-derived units.

The overview faces upward, with short nearby callouts. A gap close-up makes the stationary radial field and changing axial force legible. The phone suspension shot projects one connected side at its own scale; it does not shrink the whole desktop drawing. Power, response and air chapters replace the mechanism with their causal evidence. The current explanation remains adjacent to that evidence. Notes and manual controls are disclosed on demand.

The director uses `useShowcase().chapter` and `chapterProgress`. Smooth progress maps introduce holds, a DC start, current reversal, suspension flex, a closed-circuit release, one power cycle, settled frequency/damping comparisons and one air cycle. There is no component clock, animation history or random state. Changes between different physical experiments are authored cuts, not a claim that those experiments share a continuous initial state.

## Eight shots

| Time      | Change on screen                                                                          | Causal observation                                                                   |
| --------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 0–22 s    | A 0.35 V step starts the initially resting assembly; physical time advances through 18 ms | Current and force move one bonded assembly; the magnetic circuit remains fixed       |
| 22–44 s   | At 35 Hz, phase advances by half a cycle in the gap close-up                              | The permanent field stays fixed while current and axial force reverse together       |
| 44–66 s   | One additional cycle at 35 Hz; the suspension is prominent                                | Moving endpoints share cone displacement; spring force opposes displacement          |
| 66–88 s   | From DC equilibrium, terminal voltage becomes zero; reconstruct 35 ms of release          | Motion produces back EMF while the coil circuit remains closed through resistance    |
| 88–110 s  | One 50 Hz cycle of instantaneous power                                                    | Input equals nonnegative losses plus the signed rate of stored energy                |
| 110–132 s | Compare separately settled 20–160 Hz responses at 0.35 V peak                             | Excursion and electrical impedance depend on frequency; this is not an SPL curve     |
| 132–154 s | At 50 Hz, compare mechanical damping from 0.3 to 2.5 N·s/m                                | Reduced motion alters both the excursion peak and back-EMF contribution to impedance |
| 154–176 s | One cycle drives a retarded plane-wave illustration; track gold point P                   | Material air motion oscillates; the compression pattern travels outward              |

Each cue is 22 seconds, starts at `chapterAt + 0.45`, and has separately authored Chinese and English speech. No component-generated test tone or narration generation is included. Parent owns measured recordings, final synchronization and playback policy.

## Independent model and units

State is current `i` in A, displacement `x` in m and velocity `v` in m/s. Constant teaching parameters are `R = 6 Ω`, `L = 0.5 mH`, `Bl = 4 N/A`, `M = 12 g`, `K = 1200 N/m`, `D = 0.8 N·s/m`. These are not a commercial driver’s measurements. Mass and suspension properties represent the combined assembly.

- Electrical: `u = Ri + L di/dt + Blv`.
- Mechanical: `M dv/dt = Bli − Kx − Dv`, with `dx/dt = v`.
- Reciprocal conversion: `(Blv)i = (Bli)v`.
- Storage: `E = ½Li² + ½Mv² + ½Kx²`.
- Power: `ui = Ri² + Dv² + dE/dt`.

The constant-voltage transient uses a 3×3 matrix exponential with scaling/squaring and 28 bounded Taylor terms, directly evaluated from the initial state. Propagation is bounded to two seconds, with finite input validation and a matrix-norm limit. Direct seeks never accumulate numerical integration history.

Sinusoidal peak phasors use `Zₑ = R + jωL`, `Q = K − Mω² + jωD`, `X = BlU / [ZₑQ + jω(Bl)²]`, and `I = UQ / [ZₑQ + jω(Bl)²]`. Impedance is computed from unit-voltage current, so a zero-voltage exploration still reports the same impedance. Period-average powers use the factor ½ appropriate to peak phasors. Frequency and damping shots compare separate settled states, not transient parameter changes. The curve is sampled at 161 logarithmic frequencies, with a hard maximum of 321.

The undamped mechanical natural frequency is about 50.3 Hz. The full excursion peak also depends on electrical coupling, damping and inductance. The zero-force-factor limit leaves only the passive R–L electrical branch; zero drive produces zero motion and energy.

## Connected geometry and honest air

All moving coordinates derive from `speakerGeometry(x)`. The bobbin, winding, cone and dust cap share one axial offset. The spider begins at the cone neck and ends at a fixed shelf; the surround begins at the cone rim and ends at the fixed flange. Flexible leads join fixed terminals to the moving winding. The steel back plate, pole, annular magnet and top plate form a closed magnetic topology. A clearance remains between coil/bobbin, pole and top plate throughout supported excursions. Winding sections are grouped schematic sections, and flux paths are topology, not finite-element field strength.

The air view is explicitly **one-way kinematic illustration**, not a coupled acoustic simulation. It uses `ξ(s,t) = x(t − s/cₐ)`, `cₐ = 343 m/s`, with compression `−∂ξ/∂s = v(t − s/cₐ)/cₐ`. Boundary and particles use the same phasor. All particles have stable rest positions; the gold point is independently tracked. Display gain is bounded to preserve particle ordering; color is normalized by compression phase. No Pa, SPL, radiation efficiency or inverse-distance claim is made.

Air loading is not fed back into the driver. Mechanical damping is not equated with total radiated sound power. The lumped model omits magnetic nonlinearities, coil heating, lossy frequency-dependent inductance, cone breakup, the enclosure and spatial acoustic radiation. These limits appear in both articles and the scene notes, with the air limitation also visible in its chapter.

## Controls and lifecycle

Optional exploration has explicitly translated range names for peak voltage (0–0.4 V), frequency (20–400 Hz), phase (0–360°), and damping (0.3–2.5 N·s/m). Arrow keys, Home and End work through native ranges. A half-cycle action changes phase by 180°. Reset restores all four inputs and the assembly inspection; there is no independent manual time to reset.

One `ResizeObserver` is disconnected on unmount. SVG and bounded pure calculations allocate no audio, WebGL, Worker, RAF or timer resources. Reduced-motion, background/offscreen pause, shared transport and narration are provided by the parent’s Showcase integration. This component adds no transition animation except optional button feedback, disabled under reduced motion.

## Sources and provenance

- [KLIPPEL: Small-Signal Modeling](https://klippel.de/manuals/transducer-parameter-identification/fastlsi/fastlsi.html): constant-parameter electrical/mechanical model, force factor, back EMF, and model limits.
- [COMSOL: Loudspeaker Driver, Frequency-Domain Analysis](https://doc.comsol.com/6.4/doc/com.comsol.help.models.aco.loudspeaker_driver/loudspeaker_driver.html): magnet, yoke, pole, gap, coil and suspension anatomy; distinction between lumped and spatial models.
- [COMSOL: Loudspeaker Driver, Transient Analysis](https://doc.comsol.com/6.3/doc/com.comsol.help.models.aco.loudspeaker_driver_transient/loudspeaker_driver_transient.html): reciprocal motor/generator behavior.
- [Caltech: The Feynman Lectures, I–47](https://www.feynmanlectures.caltech.edu/I_47.html): longitudinal material displacement, compression and acoustic propagation.

All geometry, cover, styles, articles and scripts are authored for this scene. No downloaded visual assets, external 3D models or generated audio are included. The 400×230 SVG cover accepts optional `color` and is self-contained.

## Delivery evidence and limits

Targeted checks, not a shared build:

- `pnpm exec vitest run src/models/speaker.test.ts`: **13 tests passed**. The suite includes reciprocal powers, independent finite differences of state and stored energy, quadrature of average power, an independent 20,000-step RK4 comparison, semigroup/DC/zero limits, passive release, resonance/inductance limits, all connection endpoints, material air motion, input bounds and 808 reverse-ordered director reconstructions.
- Strict TypeScript checks target only the speaker model/test and two TSX files, with ES2023, bundler resolution and React JSX. Shared imports are read, not edited.
- Targeted Prettier checks cover the eleven owned files.
- Independent installation in `/tmp/speaker-review-env` from the lockfile using offline frozen-lockfile installation; no symlink to the repository’s dependency tree. The real Astro 7.3.1 / MDX 8 default Satteri transform and prerender postprocess passed both articles. They contain readable Unicode formula blocks and inline code, no raw TeX. The actual Astro compile function passed the cover with zero diagnostics; Astro Container rendered its default and custom-color variants, and Resvg rasterized the 400×230 result. The cover still was inspected. This is not a whole-site production build.
- Packet audit verifies exact top-level keys, required metadata, all 59 Chinese source string occurrences, preserved existing translations, and the 176-second/eight-cue contract.
- A separate headless Chrome 152.0.7977.76 profile loaded an in-memory bundle with a stub Showcase context and packet translations. Forty-eight sampled watch states cover 1200, 390 and 320 CSS px, Chinese and English, all eight chapters. At 320 px the component stage is 760 px in every chapter; the shared page and transport are excluded. No horizontal overflow, clipped SVG labels, SVG text under 16 px or runtime exceptions were found in those samples. Largest sampled stage at any width was 780.18 px.
- Still-image inspection included full assembly, gap, suspension, reverse-conversion view, power, damping and air. It led to a wider desktop projection, closer callouts, a force-arrow contrast improvement and removal of redundant phone content.
- Browser interaction checks verified named 44 px ranges, arrow-key reversal, Home/End limits, all inspection modes, half-cycle phase change and full reset. Buttons/summary measured at least 45.59 px. Reset restored identical initial geometry; a direct seek to release progress 0.37 reconstructed identical geometry after another chapter. React-generated SVG resource IDs were normalized only for comparison. Observer count changed from one to zero on unmount.

Artifacts are temporary local evidence under `/tmp/speaker-review/`; they are not product assets. Viewport overrides and selected stills are not full continuous viewing, physical-phone performance or listening evidence. Shared autoplay, reduced-motion/offscreen transport behavior, integrated audio synchronization, complete bilingual listening, whole-site checks and publication remain with the parent. No shared registry, dictionary, audio manifest, build output, previous scene file, package, lockfile, git state or deployment was edited by this delivery.

## Measured integration

Both recordings are 187.5 seconds. Earlier 176-second storyboards describe the production draft; the measured chapter windows below are authoritative. The film director follows these chapter windows and the media clock. Full integrated viewing and native listening remain separate review tasks.

Chinese: `/narration/speaker-zh-aae356fb044c.mp3`. English: `/narration/speaker-en-239233566bfe.mp3`.

| Chapter | Window (s) | Focus                               |
| ------- | ---------- | ----------------------------------- |
| 1       | 0–22       | The coil moves the assembly         |
| 2       | 22–45      | Reversal in the gap                 |
| 3       | 45–68.5    | Connections that flex               |
| 4       | 68.5–92    | Motion also generates voltage       |
| 5       | 92–117     | Where the power goes                |
| 6       | 117–140.5  | Each frequency responds differently |
| 7       | 140.5–164  | Damping changes the response        |
| 8       | 164–187.5  | Air does not travel with the wave   |
