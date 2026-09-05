# Seasons — a solar observatory

[简体中文](../zh-CN/examples/seasons-brief.md)

## Question and direction

Why does a tilted axis produce opposite seasons? Track one one-metre brass post at 50° north and connect its shadow to the gold marker on an illuminated globe. The reader should leave with two causal factors: the Sun's height changes the horizontal footprint of a beam, and daylight duration changes how long the input accumulates.

The visual language is a dark teal astronomical instrument with restrained brass markings. An orthographically projected globe carries an exact geometric terminator, latitude circles and an observing point. Beside it, an obliquely projected metre-scale field carries a physically connected post, shadow, solar path and compass. The orbit plate and beam section take over the field's location for two focused chapters. The energy trace is an instrument strip below the objects. There is no third-party texture, ornamental land map, weather animation or dashboard of unrelated values.

Opening: the north/south daylight ribbons trade lengths while the post's noon shadow grows. Turning point: an equal-width beam visibly spreads over the ground. Ending: remove tilt, complete an orbit with invariant noon geometry, restore tilt and compare the two annual curves with the zero-tilt reference.

## Eight distinct chapters

Each planned chapter is 22 seconds, for a 176-second silent film. `seasonsShot(chapter, chapterProgress)` reconstructs the full state, with smooth interpolation and observation holds. All chapter boundaries preserve the physical state; view changes are editorial cuts between instruments. Speech does not extend a repeating animation.

| Start | Observation                 | Visible cause and result                                                                                                      |
| ----- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 0 s   | One orbit, opposite seasons | June to December at 50° N; both latitude ribbons and the noon shadow reverse.                                                 |
| 22 s  | A fixed axis                | The orbital Earth moves from December through March to June; four ghost axes remain parallel in the inertial view.            |
| 44 s  | Spread the beam             | At solar noon, June moves to December; five truly parallel rays retain a unit cross-section while their footprint expands.    |
| 66 s  | Give sunlight time          | A winter day is followed by a summer day; a solar-time cursor, sky path, turning shadow and input curve reconstruct each day. |
| 88 s  | Equinox                     | Move to September's equinox and traverse daylight; declination reaches zero and both ribbons show twelve hours.               |
| 110 s | Polar day and night         | Move to 75° N, follow a complete solar rotation including midnight near June, then advance to December's polar night.         |
| 132 s | Remove tilt                 | Return to 50° N/noon, reduce tilt to zero, complete a full orbit; shadow, daylight and annual geometric input remain fixed.   |
| 154 s | Restore the cause           | Restore Earth's tilt and complete a year; opposite annual curves, shadow and the zero-tilt baseline close the argument.       |

The Chinese and English spoken scripts are authored separately in the packet. Narration synthesis, measured shared chapter windows and listening are parent integration work. No speech recordings were generated or listened to by this worker.

## Model and sources

- [NASA Space Place — What Causes the Seasons?](https://spaceplace.nasa.gov/seasons/en/): tilted axis, opposing hemispheres and the distinction from orbital distance. Read during production on 2026-09-05.
- [NOAA GML — General Solar Position Calculations](https://gml.noaa.gov/grad/solcalc/solareqns.PDF): local solar hour angle and altitude equation. This scene deliberately substitutes a geometric 90° zenith horizon for the observed-sunrise correction of 90.833°.
- [NASA Science — Earth Facts](https://science.nasa.gov/earth/facts/): terrestrial axial tilt and the broad seasonal mechanism.

The circular orbital position and a fixed inertial axis produce declination by a dot product: sin δ = sin ε sin λ. Solar longitude starts at the March equinox. Obliquity is measured from the orbit normal, not the orbital plane. The model does not approximate calendar dates with a sinusoid or use NOAA's date-based declination fit.

Local solar time defines H = 15°(hour − 12). The ENU vector toward the Sun produces solar altitude, power fraction and shadow. The one-metre post's shadow tip is (−E/U, −N/U). A unit perpendicular beam footprint is 1/U; renderer clipping never changes ray direction or the true readout. Long shadows stop at the plate boundary, explicitly labelled as extending beyond it.

The analytic daily integral computes ∫ max(sin α, 0) dt, in equivalent perpendicular-input hours Q/S₀. Polar day, polar night and the exact-pole/equinox horizon state are separate branches. This is incident geometry with no atmosphere, cloud, surface absorption, albedo, thermal storage or temperature/weather model. The real orbit is not claimed to be circular.

The globe close-up uses a moving solar-reference camera so its latitude circles and terminator remain readable. The orbit plate alone retains a fixed inertial orientation, with orthographic foreshortening applied to both its orbit and axes. Sizes between the orbit, globe and field are not to scale.

## Interaction, layout and lifecycle

The shared `Showcase` owns playback, narration preference, autoplay recovery, pause, replay, chapters and seeking. The component uses only its chapter and progress, with no private animation loop, audio, textures, WebGL context, Worker or accumulated history. Offscreen, background and reduced-motion behavior come from the shared clock. `useCompact` is the shared media-query subscription with disposal.

Exploration controls change real longitude, signed latitude, tilt and solar hour. Instrument tabs choose a field, orbit or beam view; presets advance half an orbit, compare upright/terrestrial axes or visit midnight at 75° N. Model explanations are in an expandable disclosure. All CSS is scoped to this topic, body copy is 16 px and controls have 44 px minimum targets.

Desktop places the globe and field side by side. Phones stack them, use a distinct 340-unit instrument viewBox and reproject the field with different origin and scale. The year/day trace switches from 760 to 340 units with fewer, larger ticks. Narrow browser layout and physical-phone performance still require parent review.

## Assets and integration

All SVG geometry, material gradients, instrument marks and cover artwork are original procedural work from this topic's independent model. There are no downloaded assets, external image requests or public asset directories. The complete 400×230 cover accepts an optional `color` prop and imports only the seasons model.

The handoff used a temporary integration packet. It contains metadata without a number, repository-relative component/cover paths, all new UI and metadata translations and eight bilingual cues. Shared translations are preserved from `src/i18n/en.json`, including `3 分钟` → `3 minutes`. No registry, central narration, deployment, lockfile or expansion ledger was edited.

## Evidence and remaining review

- Targeted `pnpm exec vitest run src/models/seasons.test.ts`: **8 tests passed** on Node 24.19.0 / Vitest 5.0.0. Covers inertial invariants, local/global illumination agreement, opposing hemispheres, numeric versus analytic daily integrals, poles/horizons, zero tilt, beam parallelism down to 0.00001° altitude, deterministic reconstruction of 808 film samples and continuous chapter states.
- Targeted Prettier completed for all 12 topic files. A TypeScript program rooted in the five topic TypeScript/TSX files produced zero diagnostics, including imported dependencies. The cover compiled with zero Astro errors. Both MDX files compiled through the repository's Satteri MDX renderer. The packet has exactly the requested five top-level keys, 81 translations, no missing topic labels and no conflicts with shared translations.
- Twenty-four complete component states (start, midpoint and end of each chapter) rendered through React SSR with no non-finite SVG values. An extreme low-Sun resvg failure led to bounded Liang–Barsky ray and Sutherland–Hodgman polygon clipping, preserving physical ray direction; rerasterization succeeded at noon altitudes 16.56°, 0.56°, 0.01° and 0.00001°. This is a renderer regression check, not a browser performance measurement.
- Actual React/SVG components were rendered through an isolated in-process Vite SSR loader and rasterized with resvg. Inspected winter, beam-winter, polar-midnight and orbital stills; this caught orbit-label collisions and informed the degree-marker/HTML-legend correction. Later stills were rerendered after the correction. These are static instrument reviews, not browser playback or a full-page layout check.
- No isolated browser was available; the parent's browser was not operated. Complete playback, keyboard/touch and fresh-entry behavior, English/Chinese page layout, narration asset/autoplay failure, both voice tracks, physical-phone performance and full shared production/preview verification remain parent integration checks. This worker did not run the shared build or audio generator.

Workspace limitation: the assigned cwd resolved to the shared repository `/Users/int64ago/workspace/vistep`; only the seasons-specific source/content/packet/brief/cover files were edited. Transient raster QA outputs were kept outside the repository in `/tmp/seasons-qa/`.

## Parent integration — 2026-09-05

The packet has been consumed into `src/data/topics.ts`, `src/data/experiments.ts`, `src/i18n/en.json` and `src/data/narration.json`. It is not retained as a duplicate source. Recorded Chinese and English tracks both measure **181.5 seconds**, with eight shared chapter windows. The earlier 176-second table is the pre-recording storyboard, not the final transport timeline. Actual windows are in `src/data/film-timeline.json`.

All 16 chapter/language pairs passed independent ASR, minimum similarity 0.9317. Assets: `seasons-zh-dd9e53694f3a.mp3` and `seasons-en-03c664b59c2a.mp3`. ASR does not establish vocal naturalness or listening. The six-topic parent model run passed 58 tests; route/phone refinements and final shared checks are recorded in the expansion log. Full continuous viewing and physical-phone evidence remain outstanding.
