# Sewing machine — follow one upper-thread loop

## Integrated film

The assembled Chinese and English tracks share **198.5 seconds**. The original 176-second storyboard below is the initial handoff; measured speech determines the final windows here. Authored chapter titles, captions and spoken wording are unchanged. Temporary packet paths below refer to the consumed handoff, not a second registry. `src/data/narration.json`, `film-timeline.json`, `audio-tracks.json` and `audio-manifest.json` are canonical.

| Chapter                                  | Measured window |
| ---------------------------------------- | --------------- |
| 1. One needle, two threads               | 0–24 s          |
| 2. A small rise makes a loop             | 24–48 s         |
| 3. The hook meets the rising needle      | 48–73 s         |
| 4. The loop travels around the case      | 73–97.5 s       |
| 5. The loop comes off the hook           | 97.5–122 s      |
| 6. Take-up turns the loop into a stitch  | 122–146.5 s     |
| 7. Clear the needle, then move the cloth | 146.5–172 s     |
| 8. A longer feed changes the spacing     | 172–198.5 s     |

Recordings: `/narration/sewing-machine-zh-41fbfc074e4e.mp3` · `/narration/sewing-machine-en-e097012bdc17.mp3`

Full continuous viewing, native bilingual listening and physical-phone performance remain separate pending evidence.

---

[简体中文](../zh-CN/examples/sewing-machine-brief.md)

The scene explains a two-thread type-301 lockstitch. A copper upper thread goes through the moving needle eye, forms a loop on the rise, travels around the stationary bobbin case, clears its rim and tightens around a separate teal lower thread. Feeding then leaves one new stitch in the fabric. The opening is a restrained ivory-and-metal cutaway; the turning point is a slow inspection around the case, followed by take-up and two independently reconstructed seam samples.

## Directed film

Eight authored bilingual chapters use a draft duration of 176 seconds, with 22-second chapter windows. Every state is reconstructed from `useShowcase` chapter and progress. The final comparison replays the feed interval simultaneously for 0.60 u and 0.85 u specimens; it does not stretch an existing seam.

| Chapter      | Visible causal observation                                 | Phone composition                                      |
| ------------ | ---------------------------------------------------------- | ------------------------------------------------------ |
| Two threads  | Follow each supply; needle descends with upper thread      | Compact complete route section                         |
| First rise   | Loop develops behind the eye after bottom dead centre      | Needle-eye detail                                      |
| Pickup       | Hook throat catches the rising needle's loop               | Enlarged eye and hook-point section                    |
| Case passage | Two legs pass on opposite axial sides of the case          | 3D case close-up and slow orbit                        |
| Cast-off     | Rear leg moves outside the rim and forward before collapse | Continuation of the case close-up                      |
| Take-up      | Rigid lever rises while the loop shrinks toward the seam   | Two coordinated detail windows within one 350px visual |
| Feed         | Raised dogs and fabric advance with the needle fully clear | Needle-clear/feed section                              |
| Spacing      | Same phase, two feed strokes, preserved interlocks         | Two seam specimens within one visual                   |

## Independent geometry and scope

`sewing-machine.ts` solves the needle slider-crank with fixed crank and rod lengths. One normalized cycle supplies the hook angle, take-up arm angle, feed-dog trajectory and fabric displacement. The hook turns twice per needle cycle. Needle-entry/exit intervals are solved from the needle-tip position, rather than painted as approximate timing bars. Feeding is confined to the declared needle-clear interval after tightening.

The needle mesh has an actual eye and back relief. The bar stays within two bored guides. A rear drive plate and annular bearing cup support the stationary case through a small declared journal clearance; the case also has an anti-rotation stop attached to the plate structure. The drive shaft stays behind the case. The bobbin has a shaft, flanges and a continuous thread route leaving radially beyond the front flange, through the exposed case opening. The front flange and case are partially cut away, not made transparent to conceal thread intersections.

The upper and lower threads are each a single ordered route, continuing into supply windings and three pre-existing stitches. Fixed point identities preserve continuity through loop formation, pickup, release and tightening. The carried bight is on the model's hook throat. The rear thread leg clears the case and its support before moving in front of the basket; only then does the loop collapse toward a U-shaped interlock. Model clearance checks include the full case/support envelope even where the renderer removes material.

The flexible thread envelope is explicitly prescribed. It is **not** a mass-spring or tension/friction solver, and it does not prove collision freedom for every machine surface. Thread tension, extension, fabric compression, bobbin unwinding dynamics and hidden drive transmission are outside scope. Thread supplies terminate visually in windings and an existing seam, not arbitrary free-floating line ends. The bobbin winding is shown as a supply, not a measured angular payout model. All lengths use display units `u`; no service or production tolerances are claimed. Tightening and feed are separated for clarity even though real timing may overlap. The seam channel is a deliberate longitudinal fabric section.

## Controls, lifecycle and integration

Exploration offers the cycle position, feed distance and section/3D choice. Ranges have explicit translated labels and 44px input height. Reset restores phase 0, pitch 0.60 u and the 3D view, and recreates the local studio so its manual camera/2D state can reset as well. Manual orbit/keyboard support, reduced-motion behavior, visibility/background pause, WebGL fallback and resource disposal use the existing `Studio`; no independent animation clock or retained frame history is introduced.

The temporary packet is `src/data/scene-packets/sewing-machine.json`. It contains metadata without a number, registered related slugs, primary sources, component/cover paths, all new translations, and eight separate Chinese/English scripts with title/caption/timing fields. Shared translations are preserved. Parent ownership begins at frozen handoff; central registration, measured voices, shared manifests and production verification remain with the parent.

The cover is an original self-contained 400×230 SVG accepting `color`. All geometry and artwork are procedural; there are no downloaded assets or additional dependency changes. Bilingual MDX uses supported formula markup and the `understand`, `try`, `deeper` anchors.

## Primary references

- [JUKI — Basic Knowledge of Sewing: Lockstitching](https://www.juki.co.jp/industrial_e/service_e/elearning/detail02.php): manufacturer curriculum linking needle, hook, thread take-up and feed functions.
- [SCHMETZ — Sewing Machine Needle Dictionary](https://www.schmetzneedles.com/pages/sewing-machine-needle-dictionary): eye, scarf and loop stroke terminology.
- [Groz-Beckert — Loop Position Control](https://www.groz-beckert.com/en/news/newsletter/sewing/2010/m2_sewing_lpc.html): loop formation depends on needle geometry, thread and material interaction.
- [JUKI — DDL-8700 instruction manual](https://juki.com/pub/media/wysiwyg/products/DDL-8700_manual.pdf): threading path, needle/hook relationship and feed-timing principles. Its machine-specific adjustment values are not transferred to this display.

The indexed JUKI TL-72 manufacturer manual also describes a twice-rotation hook. Its old official PDF URL currently returns 404, so it is not presented as a live packet source. The mechanism here is an illustrative member of that family, not a reconstruction of one named model.

## Evidence and limits — 2026-09-06

- `pnpm exec vitest run src/models/sewing-machine.test.ts`: **14 tests pass**. Checks cover crank/rod closure and dead centres, two hook revolutions and rising-needle pickup, bight/throat connection, feed gating, case/support and basket clearances, separate thread routes, guide engagement and fixed take-up length, phase continuity, interlock/pitch assumptions, deterministic seeking, declared camera-corner projection bounds and invalid inputs.
- Targeted TypeScript compilation of owned TS/TSX: no diagnostics. Packet shape, cue windows, translation coverage/overlaps and registered related paths pass. The Astro cover compiler and installed Astro MDX renderer accept both authored MDX files; this is not a production-build claim.
- Final UI inspection uses **CUA** on an isolated fixture with its own offline frozen dependency installation. At 320px, all eight Chinese chapter samples measured 720px; English measured 720–723px. No horizontal page overflow was observed. Visible SVG text retains at least 16px effective size. Both manual ranges expose translated accessible names and 44px height; local buttons measure over 44px.
- CUA exercised chapter selection, keyboard range limits, view choice, full input reset and the usable 2D section. Key stills cover eye pickup, case routing, take-up and seam comparison. The perspective fit tests project all declared meaningful bounds with an NDC margin, rather than trusting nominal width/height alone. Enlarged sections are labeled as local cutaways.
- The fixture contains **no audio or video elements**. It provides no listening, native media seek/currentTime, synthesized speech or full narrated-playback evidence. No physical-phone performance, forced WebGL-loss, complete continuous-film watching or independent offscreen/reduced-motion runtime audit is claimed. Parent integration and final browser/audio/build review remain necessary. Earlier draft inspection outside CUA predates the browser-tool clarification and is excluded from this final UI evidence.
