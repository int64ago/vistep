# Siphon — a connected column, a net drop

[简体中文](../zh-CN/examples/siphon-brief.md)

## Question and direction

How can water climb a crest without a running pump? Follow one gold tracer through a transparent U tube, then remove one enabling condition at a time. The turning point is the vent: the outlet is still lower, but admitting air interrupts sustained flow. The final comparison separates the role of ambient pressure in the energy balance from its role in keeping the column feasible.

The visual language is a quiet, orthographic laboratory cutaway, with shaded transparent troughs, a pale green water column, a brass crest vent and restrained pressure annotations. This is a hybrid depth drawing, not WebGL. The fully outlined tube and its water share a single arc-length centerline. Its two mouths are deliberately open; a siphon is not a closed circulation loop. “Closed path” applies to the tube-wall silhouette and leak-free connection across its crest, not a fictitious return pipe.

The broad source trough allows the rigid tube to pivot about its immersed inlet without crossing a vessel wall. The receiver follows the outlet horizontally. Taller rigs remain upright and are explicitly prepared comparisons with different straight-leg lengths. Their water inventory includes each tube's capacity. No hose stretches and no water is created by changing geometry.

## Authored film: eight causal chapters, 176 seconds

| Window    | Visible observation                                                                               | Causal work                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 0–22 s    | Source-connected water stops below the air-filled crest; a ring locates the interruption.         | A low outlet alone cannot prime an ordinary empty tube.                                                               |
| 22–44 s   | A connected hand primer advances the water front; it is removed only after filling.               | Priming supplies external work; sustained flow subsequently uses the drop.                                            |
| 44–66 s   | A single gold parcel crosses the crest and leaves; both reservoir levels and inventories change.  | The rising leg is part of a net downhill journey; volume is conserved.                                                |
| 66–88 s   | The crest tap and a pressure trace accompany continued discharge.                                 | Elevation, speed and accumulated losses share the same energy equation.                                               |
| 88–110 s  | The fixed-length tube pivots, its outlet rises to the source surface, and tracers stop.           | Free-outlet head decreases to zero without changing tube length.                                                      |
| 110–132 s | The outlet lowers; flow resumes, then a crest vent opens and two water fronts retreat.            | Air can destroy continuity while a favorable head remains. Water draining from each leg is assigned to its reservoir. |
| 132–154 s | Separately primed taller rigs reduce the crest-pressure margin.                                   | The ordinary-water, single-phase model fails at its vapor-pressure boundary.                                          |
| 154–176 s | A fixed 8.5 m rig is compared at decreasing ambient pressure. Flow stays unchanged until failure. | Equal atmospheric pressures cancel from driving head but set absolute-pressure feasibility.                           |

Chinese and English speech were authored independently in the packet. Each cue has a 22 s planned window and a 0.45 s lead-in. Parent synthesis must measure both tracks, adjust shared windows as needed, and review actual delivery; there is no generated speech or listening claim in this handoff. Chapter progress, not measured voice seconds, reconstructs the model's authored clock.

## Scientific model and explicit limits

- SI units; free outlet; constant 12 mm bore; quasi-steady, one-dimensional Bernoulli plus losses. Darcy factor 0.03, entrance K = 0.5 and bend K = 0.4 are authored fixed values. Reservoir-surface speed, startup inertia, water hammer, Reynolds-dependent friction and two-phase dynamics are omitted.
- Water density 998.2 kg/m³, g = 9.80665 m/s². Temperature changes only the NIST saturation-pressure fit. The UI stays between 5 and 29 °C.
- Source area 0.06 m², receiver area 0.12 m², total liquid 0.063 m³. Source width/depth are 1.25 m / 0.048 m; receiver width/depth are 0.65 m / approximately 0.185 m. Illustrated depth is compressed. The receiver floor is at −0.5 m; its rim is fixed at 0.12 m, below the default outlet at 0.2 m.
- Exact analytic line–semicircle–line geometry supplies length, top location, pressure taps, liquid intervals and tracer positions. Tube bore is enlarged in the image. Dot speed is 22% of model speed; the single gold parcel exits rather than teleporting back upstream.
- A lazy fixed-step cache advances the first six chapters at 0.1 s resolution. Seeking interpolates conserved reservoir inventories and wet intervals. Manual trial time replays the same equations from its prepared starting condition.
- Prefill and vent drainage use prescribed teaching progress, while their segment volumes balance exactly. The first chapter shows the static source-connected meniscus. Manual venting starts a new drained trial; it does not claim to continue an arbitrary prior manipulation.
- Crest pressure reaching vapor pressure is the stated ordinary-water failure criterion. It is not a two-phase prediction, an exact failure location/time, or a universal claim about specially degassed liquids under tension. Gold bubbles are a warning glyph over the last single-phase inventory, not a calculated gas volume. After failure, the displayed pressure is the hypothetical continuous-column demand; flow output stops.

## Phone, interaction and fallback

`ResizeObserver` gives the SVG an actual-pixel coordinate system. Narrow stages change horizontal geometry spacing, annotation anchors and composition while keeping a 16 px SVG type size; they do not scale a desktop viewBox down. At 300 px stage width, the source trough remains wide enough for the rotating leg and the receiver caption anchors to the right edge. Model values and long explanations use normal HTML flow. Primary actions and range targets are at least 44 px.

The shared `useShowcase` player owns motion, visibility, background pause, reduced-motion behavior, replay, chapter seeking and narration. There is no independent animation timer, network media or Worker. The only observer is disconnected on disposal. The linework button removes vessel depth cues using the same model; the complete explanation already works without WebGL, textures or audio.

## Evidence and handoff boundaries

- Targeted model command: `pnpm exec vitest run src/models/siphon.test.ts` — 9 tests passed. They check rigid length, mouth connections, bend tangency, trough clearance, energy/head closure, outlet pressure, atmospheric cancellation, vapor-pressure range, no-flow conditions, all-chapter volume conservation, deterministic seeks, manual transfer and invalid inputs.
- Targeted TypeScript command: `pnpm exec tsc --noEmit --jsx react-jsx --module esnext --moduleResolution bundler --target es2023 --resolveJsonModule --allowSyntheticDefaultImports --skipLibCheck src/models/siphon.ts src/components/experiments/Siphon.tsx src/components/lab/SiphonApparatus.tsx` — passed.
- Integration checks passed: exact packet keys and relative paths, metadata coverage, all 74 label translations, no conflicts with the existing dictionary, and eight 22 s cue windows. The installed Astro compiler accepted the cover, and the installed Astro/Satteri MDX processor compiled both content files. Targeted Prettier checks passed for all eleven assigned files.
- Static visual evidence: React server rendering plus `@resvg/resvg-js`, at 880 px and 300 px apparatus widths. Flow, pressure, raised-outlet and vapor-limit stills were inspected. Initial inspection found a cropped receiver caption and top labels crossing a raised tube; these were corrected by extending the canvas and moving explanatory labels into HTML.
- Corrected narrow stills were re-rendered and inspected, including English flow and priming labels substituted from the packet. This substitution checks the SVG text layout before shared locale integration; it does not establish browser language switching.
- This is not browser playback, computed-layout, keyboard/touch, listening or physical-phone performance evidence. No isolated browser was established. Parent owns integration, complete playback, resource-failure review, measured bilingual speech, browser review, shared builds and release.
- No shared registry, locale file, audio manifest, global style, lockfile, deployment file or expansion ledger was edited. Shared translation values are preserved verbatim in the packet.

The handoff used a temporary integration packet. It contains exactly `topic`, `component`, `cover`, `translations`, and `narration`; the topic number is omitted. The cover accepts optional `color` and owns a complete 400 × 230 SVG. No external imagery or downloaded assets are used; apparatus and cover are original procedural artwork.

## Primary references

1. [US Bureau of Reclamation — Small Tubes or Siphons](https://www.usbr.gov/tsc/techreferences/mands/wmm/chap14_14.html): free/submerged outlet distinction and air locking.
2. [OpenStax — Bernoulli's Equation](https://openstax.org/books/university-physics-volume-1/pages/14-6-bernoullis-equation): pressure, velocity and elevation energy; free-jet pressure boundary.
3. [NIST Chemistry WebBook — Water, Antoine parameters](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Mask=4&Type=ANTOINE&Plot=on): the 273–303 K coefficient set, with pressure converted from bar to Pa.
4. [NIST — Vapor pressure equation for water, 0–100 °C](https://nvlpubs.nist.gov/nistpubs/jres/75A/jresv75An3p213_A1b.pdf): an independent numerical check near 20 °C. The finite-range Antoine fit agrees within 2 Pa.

References checked 2026-09-05. No source text or figures were copied into the artwork.

## Parent integration — 2026-09-05

The packet has been consumed into `src/data/topics.ts`, `src/data/experiments.ts`, `src/i18n/en.json` and `src/data/narration.json`. It is not retained as a duplicate source. Recorded Chinese and English tracks both measure **183.0 seconds**, with eight shared chapter windows. The earlier 176-second table is the pre-recording storyboard, not the final transport timeline. Actual windows are in `src/data/film-timeline.json`.

All 16 chapter/language pairs passed independent ASR, minimum similarity 0.9186. Assets: `siphon-zh-7c464b365c2d.mp3` and `siphon-en-1cbc7c635788.mp3`. ASR does not establish vocal naturalness or listening. The six-topic parent model run passed 58 tests; route/phone refinements and final shared checks are recorded in the expansion log. Full continuous viewing and physical-phone evidence remain outstanding.
