# Showcase artwork

This is an original SVG composition rendered directly to PNG and GIF. Seven mechanisms remain visible and change together. It uses no website capture, browser rendering, stock image, or image-generation service.

The export is **1280 × 860**, **8 seconds**, **20 fps**, with **160 frames** and an infinite loop. The PNG poster is the unquantized first frame. The GIF uses a shared 256-color palette without dithering, retaining clean lettering and controlling file size (6,088,701 bytes; poster 366,395 bytes).

## Models and presentation

| Mechanism            | Source and calculated state                                                                                                                                                                   | Deliberate presentation choices                                                                                                                                                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gears                | [`mechanisms.ts`](../../src/models/mechanisms.ts): 32/20-tooth involute outlines, common module 0.08, exact center distance and `meshedAngle`                                                 | Driver turns half a revolution per loop. Driven wheel turns −0.8 revolution. Tooth and unmarked bolt symmetries close the image continuously. Fixed orthographic view.                                                                                                                                                                              |
| Slider–crank         | [`four-stroke.ts`](../../src/models/four-stroke.ts): `pistonGeometry`, 0.04 m crank, 0.14 m rod, 0.08 m bore                                                                                  | One rotation per loop; one uniform geometric scale. This is a kinematic cutaway with a transparent guide, without a combustion or thermodynamic claim.                                                                                                                                                                                              |
| Induction            | [`electric-generator.ts`](../../src/models/electric-generator.ts): rotating conductor, rotor leads, slip rings, fixed brushes, connected external load; flux, EMF, current and resistor power | Existing 360 rpm / 0.8 T / 8 Ω load and 0.4 Ω internal resistance. One physical rotation is displayed over 8 seconds (48× slower). Translucent field faces expose the coil. The trace uses computed EMF; load color uses computed power.                                                                                                            |
| Light                | [`optics.ts`](../../src/models/optics.ts): `thinLens` and `lensRay`, focal length 60 mm, object distance 180 mm, source height 24 mm, three aperture heights −38/0/38 mm                      | An ideal paraxial thin-lens slope model, not a traced glass surface or aberration prediction. Lens curvature is symbolic. Visible pulses advance by geometric arc length at 75 mm per display second with 150 mm spacing, with entry/absorption fades. Glass optical phase delay is outside this illustration; different path lengths are retained. |
| A fourth dimension   | [`dimensions.ts`](../../src/models/dimensions.ts): all 16 hypercube vertices and 32 edges, rotation in the x–w plane, 4D perspective then fixed 3D orthographic projection                    | One full 4D rotation per loop; constant framing across every phase.                                                                                                                                                                                                                                                                                 |
| Image reconstruction | [`jpeg.ts`](../../src/models/jpeg.ts): actual DCT of `sampleBlock('edge')` and inverse DCT with smooth weights in `frequencyOrder`                                                            | A periodic coefficient-selection control moves between the DC term and all 64 terms. Display intensity is clamped to 0–255, and is mapped to tile color/height. It does not estimate an encoded JPEG file size.                                                                                                                                     |
| Waves add            | [`wave-interference.ts`](../../src/models/wave-interference.ts): two opposite harmonic waves, their exact sum, material displacement and stationary nodes                                     | One 0.16-second model period is shown over 8 seconds (50× slower). Vertical displacement is enlarged for legibility; this is an observation window on an ideal small-slope string.                                                                                                                                                                  |

Each mechanism is a pure function of the export time, with its own model conversion and phase. There are no chapter transitions, visibility switches, stateful simulation histories or cameras that resize on every frame. The independently computed unwrapped end states match the opening; the half-turn gear image closes through its physical pattern symmetries. Optical pulses enter and leave finite ray domains rather than jumping across the picture.

## Fonts and rendering

The renderer reuses the repository's bundled `Manrope.ttf`, `ManropeGreek.ttf` and `NotoArrow.ttf`. System fonts are disabled. Their existing licenses are in [`scripts/assets`](../../scripts/assets/). The artwork is hand-authored vector geometry and gradients, with the repository models providing its states.

Tested with Node 24.19.0, Resvg 2.6.2 and FFmpeg 7.1. No new package or lockfile changes are required. Install FFmpeg or point `VISTEP_FFMPEG` to an executable. An existing `imageio_ffmpeg` environment is also detected; the renderer does not generate or alter narration.

```sh
# Inspect a composition before rendering the animation.
node scripts/render-showcase.mjs --frame 0 --output /tmp/showcase-first.png

# Export the still only.
node scripts/render-showcase.mjs --poster

# Export GIF + poster; --keep-frames retains the temporary PNG sequence.
node scripts/render-showcase.mjs --keep-frames

# Focused mathematical and renderer regressions.
pnpm exec vitest run scripts/render-showcase.test.mjs
```

## Evidence boundaries

Nine focused tests cover tooth nonintersection and phase closure, rod/joint geometry and guide clearance, generator connectivity and energy, lens paths, finite hypercube framing, actual DCT reconstruction, wave superposition/energy, deterministic full-loop composition, and native raster arrow direction. All 160 GIF frames were decoded and their timing checked. Independent raster probes checked object and text bounds over all 160 phases for each mechanism. All 43 text codepoints are covered by the bundled fonts.

The opening, intermediate poses and final loop frame were inspected as offline raster images, including frames decoded from the final GIF. This establishes static exported-image evidence. It does **not** claim full-speed native animation viewing, GitHub browser acceptance, audio listening, or physical-phone performance. The earlier fluids review retains its Mac-lock browser limitation. No README, homepage, topic data, shared translation, model, or recording was edited for this artwork.
