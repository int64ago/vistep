# Solar cell — production brief

[简体中文](../zh-CN/examples/solar-cell-brief.md)

## Integrated film

The assembled Chinese and English tracks share **199 seconds**. The original 176-second storyboard below is the initial handoff; measured speech determines the final windows here. Authored chapter titles, captions and spoken wording are unchanged. Temporary packet paths below refer to the consumed handoff. `src/data/narration.json`, `film-timeline.json`, `audio-tracks.json` and `audio-manifest.json` are canonical.

| Chapter                        | Measured window |
| ------------------------------ | --------------- |
| 1. Cross the energy threshold  | 0–22 s          |
| 2. Separate a charge pair      | 22–45.5 s       |
| 3. Close the outside path      | 45.5–70.5 s     |
| 4. The load chooses the point  | 70.5–95 s       |
| 5. Two ways to get zero power  | 95–119 s        |
| 6. Light raises the curve      | 119–144.5 s     |
| 7. Hotter is not more powerful | 144.5–171.5 s   |
| 8. Account for every watt      | 171.5–199 s     |

Recordings: `/narration/solar-cell-zh-83fa7f833d33.mp3` · `/narration/solar-cell-en-fd9b3ceea5c8.mp3`

Full continuous viewing, native bilingual listening and physical-phone performance remain separate pending evidence.

---

Status: topic-local implementation complete; frozen integration packet. Parent owns registration, synthesized voices, shared verification and publication. No central files, previous scenes, packages, lockfiles, Git state or deployment outputs were changed.

## Concept and visual direction

The starting intuition is that bright light directly becomes current. The film replaces that shortcut with three connected observations: a photon's energy threshold, one identifiable charge pair's complete path, and the load point of an actually solved cell circuit. A final steady-state ledger accounts for all incoming power without presenting an invented thermal image.

Art direction is a warm silicon cross-section: cobalt n material, copper-toned p material, a narrow pale depletion region, metal contacts and a restrained ochre load line. The surface contact, carrier route and external resistor use the same model coordinates. SVG is the primary medium, not decorative 3D; no camera bounds, WebGL dependency, textures or alternate fallback model are involved. The cover is a self-contained 400×230 SVG with an optional color prop and model-derived paths and curve.

The desktop moves between a three-photon energy comparison, a large layer cutaway, an I–V instrument paired with its equivalent circuit, and a curve/energy-ledger comparison. At 320px, only the chapter's causal instrument is shown. The circuit inset and secondary readouts disappear; photon lanes become separate rows. The scene has one compact stable watch envelope, not a vertical stack of desktop panels. Full explanation is rendered only in exploration; watch captions belong to the shared Showcase.

## Frozen film

Eight chapters, 22 seconds each, total 176 seconds. Cues start at chapter time +0.45 seconds. Chinese and English speech are separately authored; no audio has been synthesized by this worker. English scripts have 52–55 words per cue before the precision correction described below; the corrected temperature cue has 54 words. Actual voice duration remains for measured parent synthesis.

| Start | Chapter                     | Visible causal change                                                                                                                                          |
| ----- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 s   | Cross the energy threshold  | 0.90 eV passes through; selected absorbed 1.55 and 2.55 eV photons each produce one pair and different excess heat.                                            |
| 22 s  | Separate a charge pair      | One 800 nm photon reaches the bulk; equal opposite carriers appear together, separate and reach the contacts.                                                  |
| 44 s  | Close the outside path      | The same electron continues from the front contact, through the modeled wire/load, to the waiting hole at the rear contact. No chapter-boundary position jump. |
| 66 s  | The load chooses the point  | Load rises continuously from 0.01 to 1 Ω; solved intersection and power rectangle pass near the independently calculated maximum.                              |
| 88 s  | Two ways to get zero power  | Open circuit changes to an ideal short; the intercepts and physically appropriate switch/load topology change.                                                 |
| 110 s | Light raises the curve      | Irradiance rises from 0 to 1000 W/m², with fixed temperature, area and load.                                                                                   |
| 132 s | Hotter is not more powerful | Temperature rises from 25 to 65°C. The 25°C reference stays; short-circuit current slightly rises, while open-circuit voltage and peak power fall.             |
| 154 s | Account for every watt      | First collection falls to 0.70; then series resistance increases to four times reference. The ledger and operating point recompute.                            |

Freeze correction, explicitly reported to the parent: after the first packet-ready message, **only cue `temperature`** received a precision change. Its zh/en caption now names **short-circuit current** and **open-circuit voltage**. Its zh speech changes “电流会略微增加” to “短路电流会略微增加”; en changes “Current rises slightly” to “Short-circuit current rises slightly.” The fixed-load current actually decreases, so this distinction matters. Its title, 132 s chapter start, 132.45 s voice start, 22 s duration and director remain unchanged. All other cue fields are unchanged. These corrected texts are now frozen for handoff.

## Model and assumptions

- Electrical reference: the official pvlib CS5P-220M example, using De Soto temperature and irradiance laws. One equivalent cell is obtained from 96 identical series cells; current stays unchanged while voltages, a, resistances and power divide by 96. No new measurement is claimed.
- Incident aperture per equivalent cell is 1.7/96 m², not measured active silicon area. Reference Iₗ=5.114 A, I₀=8.196×10⁻¹⁰ A, a=2.6373/96 V, Rₛ=1.065/96 Ω, Rₛₕ=381.68/96 Ω. At reference conditions the computed maximum is 2.291294 W; at 65°C it is 1.842164 W.
- The implicit diode equation is solved in junction voltage U; the model enforces I=Iₗ−Iᵈ−Iˢʰ and V=U−IRₛ. Passive-load points separately enforce V=IR. Bracketed roots handle open/short/dark conditions. A golden-section search locates maximum power; a separate sampled curve is drawn from the same equation.
- Optical assumptions are declared: three power bins (0.90/1.55/2.55 eV, 22/46/32%), 4% reflection and 90% absorption of the remaining above-gap light. This is not AM1.5 data or a real silicon absorption spectrum. One absorbed above-gap photon produces one pair; excess photon energy thermalizes. A calibrated collection factor matches the electrical reference photocurrent.
- Energy retains nine channels: reflection, transmission, thermalization, precollection recombination, the band-edge/junction-voltage energy residual, diode recombination, shunt loss, I²Rₛ and VI. The display combines reflected/transmitted light and the two recombination channels. The residual is a lumped accounting term, not a spatial heat map or a measured material property.
- Layer thickness, diffusion/drift paths and times are schematic. Only the depletion zone has a drawn field. Equal opposite charges appear together; identities persist; both disappear only at their common recombination position. A selected pair is not a count of macroscopic current or a claim that every photon follows that route.
- Supported inputs: 0–1200 W/m², −10–75°C, 0–10 Ω, 350–1400 nm, collection multiplier 0.5–1, series multiplier 0–5. No reverse breakdown, bypass diodes, local module shading, Poisson/drift-diffusion transport, capacitance, optical interference or thermal/weather solver.

## Exploration and lifecycle

Four views expose the load circuit, a selected carrier pair, the energy ledger and monochromatic threshold. All ranges have translated explicit aria-labels. Native keyboard input changes actual parameters. Reset restores all inputs, spectral mode/wavelength, route, time, view and the disclosure state. Maximum-power matching is disabled if the required load lies beyond 10 Ω; darkness has no unique optimum.

There is no component-local RAF, random stream, audio, Worker or frame history. `useShowcase` supplies chapter/progress; the shared director owns reduced motion, offscreen/background pausing and transport. `useCompact` subscribes through the existing media-query hook. SVG has no graphical context to lose or dispose. Narration and media lifecycle remain the parent's shared integration responsibility.

## Evidence and remaining review

- Node 24.19.0, pnpm 11.25.0, Vitest 5.0.0. `pnpm exec vitest run src/models/solar-cell.test.ts`: **14 passed**. Checks include six independently published pvlib Lambert-W cases, ideal analytic limits, KCL and load law, dark forward bias, monotone curve and independent dense MPP comparison, energy balance across 72 extreme combinations, quantum energy/charge accounting, temperature and loss separation, continuous paths, net charge, threshold crossing, 328 reverse-order director seeks and chapter continuity.
- Topic-rooted TypeScript program: zero diagnostics. Astro cover compiler: zero diagnostics. Both MDX files compiled with the installed Astro Satteri MDX renderer in the isolated review tree; `understand`, `try`, `deeper` anchors exist and no raw TeX is used. This is not a shared production build.
- Packet audit: exact contract, no topic number, 8×22=176 s, 102 translations, 87 Chinese UI literals covered, no shared translation conflicts at audit. Shared wording `3 分钟` → `3 minutes` is preserved.
- Review tree `/tmp/vistep-solar-cell-review` installed its own dependencies with offline frozen-lockfile installation; no shared node_modules link. Its Vite fixture provides the real experiment with a FilmContext director and copied translations, but no shared audio player.
- Actual browser UI control used CUA only. Inspected desktop 1280px stills and 320×900 viewport stills of threshold, junction/circuit, I–V temperature comparison and ledger. All eight chapters in each language had no document horizontal overflow and no SVG text beyond the scene sides. Scene height was 560px for every phone chapter; scene plus fixture caption measured 678px, including the final corrected English temperature caption. Visible ranges measured 44px high and buttons about 44.8px. CUA captured no console errors. These are viewport checks, not physical-phone evidence.
- CUA keyboard checks exercised all seven ranges (including event time), open-circuit zero output, 1400 nm zero photocurrent, and hidden-state reset. A reset returned reference 25°C/1000 W/m², collection 1, series 1, resistance 0.1042 Ω, 800 nm, three-band spectrum, external route and event progress 0.68, with the loss disclosure closed.
- Cover was rendered through an isolated Astro container with a compatibility adapter removing only the legacy compiler metadata export, then rasterized with resvg and visually inspected. Geometry and the color prop were unchanged. This is a static rendering check, not the parent's production pipeline.
- Findings corrected during review: an SVG subpath close introduced a diagonal circuit wire; a transmitted photon extended into the next phone lane; a hidden native disclosure needed reset; a selected recombination route needed its matching manual explanation; load step precision was aligned with 0.1042 Ω. None changes the frozen film timing. Only the temperature wording correction above changes frozen speech/captions.
- Still outstanding for parent: shared registry/player integration, actual production/preview build, complete 176-second viewing in the shared player, full bilingual synthesis and listening, media `currentTime` versus film seek, native playback, physical-phone performance, and shared lifecycle/resource-failure tests. Do not treat test passes, screenshots or a viewport override as those forms of evidence.

## Owned files and integration

- `src/models/solar-cell.ts`
- `src/models/solar-cell.test.ts`
- `src/components/experiments/SolarCell.tsx`
- `src/components/lab/SolarCellBench.tsx`
- `src/styles/solar-cell.css`
- `src/components/covers/SolarCellCover.astro`
- `src/content/solar-cell.mdx`
- `src/content/en/solar-cell.mdx`
- `docs/examples/solar-cell-brief.md`
- `docs/zh-CN/examples/solar-cell-brief.md`
- `src/data/scene-packets/solar-cell.json` — temporary handoff packet, not a second canonical registry.

No external images, fonts beyond the existing site fonts, or generated media were added. All artwork is code-authored geometry.

Primary sources: [DOE cell basics](https://www.energy.gov/cmei/systems/solar-photovoltaic-cell-basics), [DOE efficiency](https://www.energy.gov/cmei/systems/solar-photovoltaic-performance-and-efficiency-basics), [Sandia/NIST single diode](https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/single-diode-equivalent-circuit-models/), [Sandia/NIST De Soto](https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/single-diode-equivalent-circuit-models/de-soto-five-parameter-module-model/), and [official pvlib reference example](https://pvlib-python.readthedocs.io/en/stable/gallery/iv-modeling/plot_singlediode.html).
