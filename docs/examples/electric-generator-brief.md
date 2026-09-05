# Electric generator: turn the loop, account for the work

[简体中文](../zh-CN/examples/electric-generator-brief.md)

Packet: the central topic, narration and translation registries. Slug: `electric-generator`. Component: `ElectricGenerator`. Planned film: eight 22-second chapters, 176 seconds. Related topics already registered when checked: `transformer-electric` and `ball-bearing`.

## Causal argument and direction

The initial intuition is that a magnet might provide the electrical energy. Follow one copper turn from the rotor through its two leads, complete slip rings and stationary brushes. The important change is closing the load: current appears, magnetic forces create a braking torque, and maintaining speed now requires shaft work. The final revolution accounts for that work as load energy and internal loss.

This composition uses a full-width, exposed generator in a dark blue machine space, with warm copper and a pale waveform strip below. It does not reuse the transformer's two-column arrangement. The rotating armature, cantilever shaft, insulating spokes, separate rings, radial graphite contacts, bearing supports, crank and load all have explicit geometry. The front-center conductor gap clears the shaft; bearings sit beyond the slip rings so stationary bearing material does not obstruct the rotating leads. The small return wire and resistor are lifted clear of the phone baseplate.

The contact chapter replaces the waveform with an end-on pair of complete rings. Colored solder points rotate, while brushes remain fixed. Field arrows identify the air-gap direction, not field particles; force arrows follow the sign of the actual current and field. The field-area overlay uses the conductor boundary. The load is a resistor, with no uncomputed bulb temperature or glowing-light claim.

| Chapter                   | Visible event                                                                 | Observation                                                                               |
| ------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 0–22 s: start turning     | Hold the shaft still, then gently build rotation.                             | Existing flux does not by itself produce sustained EMF; its time variation does.          |
| 22–44 s: quarter turn     | Reveal the bounded area and normal; hold at aligned and edge-on orientations. | Flux extremum gives zero instantaneous EMF; zero flux gives peak EMF magnitude.           |
| 44–66 s: sliding contacts | Reveal the shaft and show both rings end-on with moving solder points.        | Each rotating lead retains its own stationary brush connection.                           |
| 66–88 s: polarity         | Follow one revolution with a signed voltage trace.                            | Polarity reverses every half turn; complete rings do not rectify the waveform.            |
| 88–110 s: faster shaft    | Preserve a dashed 360 rpm trace while speed rises to 720 rpm.                 | Amplitude doubles and physical period halves. The plotted horizontal coordinate is angle. |
| 110–132 s: load           | Close the resistor circuit after 30% of the chapter.                          | Current and opposing electromagnetic torque appear; the drive holds speed.                |
| 132–154 s: reverse        | Reduce speed smoothly through zero and reverse it.                            | Voltage/current signs reverse at a given angle; torque still opposes actual rotation.     |
| 154–176 s: work           | Integrate a complete forward revolution.                                      | Shaft work equals load energy plus internal resistive loss at every frame.                |

## Phone direction, rather than a stacked desktop

Below 620 px of scene width the camera and load wiring are separately arranged for a portrait view. Phone watch chapters then select the relevant evidence:

- Orientation, loading and reversal show the machine with compact EMF/current or EMF/flux samples; the waveform is not mounted in those chapters.
- The ring chapter gives priority to its end-on contact view and a 210 px machine reference.
- Polarity and speed use a 240 px machine reference with the waveform.
- The final chapter uses a 210 px machine reference and energy curves.
- Repeated title/readout lines and secondary period information are hidden unless needed for the speed comparison. Redundant explanatory rows are omitted where the chapter caption or contact explanation already carries that point.

The closed-details phone watch scene has a 700 px minimum height to reduce transport movement. The design target is approximately 900 px or less at 320 px without shrinking 16 px body text; **actual rendered height has not been measured by this worker**. Labels remain HTML outside the compressed curve coordinates. Input targets are at least 44 px. Expanded model details and manual controls are intentionally additional content.

## Shared independent model

Geometry uses 0.05 m per scene unit. The single rounded rectangular turn is 0.12 m wide, 0.18 m long, with 0.009 m corners. Its area is `0.12×0.18 − (4−π)×0.009² = 0.021530469… m²`. No unseen turns multiplier is used. Independent numerical line integrals over the drawn centerline verify its area, motional EMF and magnetic torque.

Positive rotation is about +z. At θ = 0 the loop normal and field are +x. Following the conductor A→B defines the positive normal. Voltage is brush B minus brush A; positive current leaves B into the load and returns to A.

`Φ = BA cosθ`, `e = −dΦ/dt = BAω sinθ`, `i = e/(R+r)` with the load connected, and `τem = −BAi sinθ`. External torque is `−τem`, so `Pshaft = −τemω = ei = i²R + i²r`. The sign convention holds in both directions. Open circuit has EMF but no load current or modeled electromagnetic drag. Shaft work is integrated analytically using the integral of `sin²θ`, and checked against independent time quadrature.

Defaults: B = 0.8 T, 360 rpm, load 8 Ω, equivalent internal resistance 0.4 Ω. Exploration offers −720…720 rpm, 0…0.8 T and 2…32 Ω. Internal resistance includes winding and brush-contact loss; it is a teaching value, not inferred from rendered copper thickness. The uniform field is an air-gap approximation. Rotating leads/rings, outside the active gap, contribute no additional modeled EMF. Fringing, armature reaction, inductance, arcing, inertia, magnetic-material losses, bearing/brush mechanical friction and temperature are omitted.

The drive prescribes speed, including the smoothly reconstructed speed comparisons. With inertia neglected, only the electromagnetic reaction is included in required drive torque. Observational frame holds freeze an instant, rather than changing the physical speed parameter. The stopped-shaft case explicitly sets speed to zero. This avoids conflating a paused film, a sampled angle and a stopped machine.

## Lifecycle and fallback

`useShowcase().chapter` and `chapterProgress` reconstruct every shot. Speed ramps have analytic phase integrals; there is no history-dependent stepping. Manual exploration changes angle, speed, field and load through keyboard-compatible native range controls and buttons. It has no separate animation clock. The shared player retains pause, replay, chapters and narration behavior.

Shared Studio handles reduced motion, visibility/background gating, WebGL failure, controls and renderer disposal. The topic releases its generated N/S textures; Studio releases geometry and materials. The 2D fallback follows the same conductor, lead, ring, brush, switch and load coordinates and rotor angle, with the same voltage/energy instrument. No external images, textures, meshes, audio assets or runtime services are required by the topic.

## Primary sources and provenance

Consulted 2026-09-05:

- [MIT 8.02, Faraday's law](https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/ce1720fd4b21def8c2189ff4779f27f7_cha10faraday_law.pdf): induction, generators and mechanical/electrical energy conversion.
- [OpenStax University Physics, generators and back EMF](https://openstax.org/books/university-physics-volume-2/pages/13-6-electric-generators-and-back-emf): rotating-loop flux, sinusoidal EMF, speed/frequency relationship, complete rings versus commutation.
- [OpenStax University Physics, force and torque on a current loop](https://openstax.org/books/university-physics-volume-2/pages/11-5-force-and-torque-on-a-current-loop): magnetic moment and torque direction.
- [Moog, Slip Ring FAQs](https://www.moog.com/products/slip-rings/slip-ring-faqs.html): rotating rings, stationary sliding brushes and separate conducting paths. No manufacturer's product dimensions or performance ratings are adopted.

All geometry, SVG artwork, calculations and writing are original. Cover accepts optional `color` and renders a self-contained 400 × 230 SVG without card framing.

## Worker evidence and handoff

Environment: `/Users/int64ago/workspace/vistep`, Node 24.19.0, Vitest 5.0.0, 2026-09-05. Only the 12 generator-specific files were authored. Transformer files and shared registrations, dictionaries, scripts, manifests and build outputs were not changed.

- `pnpm exec vitest run src/models/electric-generator.test.ts`: **9 tests passed**. Covers independently differentiated Faraday EMF, 9,600-segment motional-EMF and magnetic-force integrals, 16,000-segment area integration, open/load behavior, reversal, instantaneous/accumulated energy, speed/field scaling, invalid inputs, physical contact continuity, bore clearance and reverse-order reconstruction of all chapters.
- Targeted strict ESNext/Bundler/React JSX `tsc --noEmit` on the model and three TSX entry files: passed.
- Packet validation: **38 `t()` labels, 61 translations, eight 22-second cues, 176 planned seconds**, exact top-level contract, no number, existing related slugs, metadata translations, content anchors and files. No missing translation or shared-dictionary overwrite. `3 分钟` remains `3 minutes`.
- Formatting is limited to these topic files. No global formatter, build, audio generator or publishing command is run.

Browser stills, full playback, runtime reduced-motion/offscreen/WebGL-failure checks, physical-phone performance, measured 320/390 px heights and listening are **not worker evidence**. Parent owns integration, measured bilingual recordings, final browser/player/voice review, builds and release. The 176-second value is a planned narration window, not measured recording duration.

The narration, captions, chapter count and director timing were declared stable after packet validation. Subsequent topic edits only refine presentation/contact geometry and documentation. Before release, inspect phone chapter-specific views and transport placement, both frame holds, stationary contact points throughout rotation, reversal through zero, and final energy agreement.

## Measured integration

Both language tracks measure 207.5 seconds, sharing eight chapter windows. Assets: `/narration/electric-generator-zh-bf8eec8addaf.mp3` and `/narration/electric-generator-en-1de0a8aa9a47.mp3`. The parent confirmed all existing 26 narration, manifest, track and timeline entries remain semantically unchanged. The temporary packet has been consumed; canonical scripts now live in `src/data/narration.json`. Independent transcription and final browser review are in progress. Native listening and physical-phone measurements remain outstanding.

Final independent transcription: all 16 chapter/language pairs passed; minimum similarity 0.9401, minimum ending coverage 0.9167. This is not a listening judgment about natural delivery.
