# Microscope — a real image before a larger view

## Integrated film

The assembled Chinese and English tracks share **182 seconds**. The original 176-second storyboard below is the initial handoff; measured speech determines the final windows here. Authored chapter titles, captions and spoken wording are unchanged. Temporary packet paths below refer to the consumed handoff, not a second registry. `src/data/narration.json`, `film-timeline.json`, `audio-tracks.json` and `audio-manifest.json` are canonical.

| Chapter                                     | Measured window |
| ------------------------------------------- | --------------- |
| 1. The objective brings rays together       | 0–22 s          |
| 2. First, a real inverted image             | 22–44 s         |
| 3. The eyepiece changes viewing angle       | 44–66 s         |
| 4. Focus by moving the specimen stage       | 66–88 s         |
| 5. Different depths come into focus in turn | 88–110 s        |
| 6. Aperture changes point separation        | 110–133.5 s     |
| 7. Aperture also changes depth of field     | 133.5–157.5 s   |
| 8. Enlarging blur adds no detail            | 157.5–182 s     |

Recordings: `/narration/microscope-zh-a708987c59b6.mp3` · `/narration/microscope-en-8fdb346f7bad.mp3`

Full continuous viewing, native bilingual listening and physical-phone performance remain separate pending evidence.

---

[简体中文](../zh-CN/examples/microscope-brief.md)

## Direction

The question is whether a bigger image necessarily contains more detail. Follow one geometric tracer through the objective, a real intermediate plane and the eyepiece, then replace the tracer with a computed fluorescent calibration target. The optical bench establishes where an image forms; the pupil integral establishes how broad that image is.

The scene uses an unfolded indigo optical rail, restrained glass principal-plane symbols, mint/gold ray bundles and a coral intermediate plane. It turns into an eyepiece-like circular field with warm monochrome point images and one relevant instrument. The rendering is SVG/Canvas; there is no perspective camera or decorative 3D. Straight ray segments use the actual model coordinates with different axial/transverse display scales. Lens outlines are explicitly thin-lens symbols, not claimed physical surfaces where refraction is secretly misplaced.

The specimen is two incoherent fluorescent point emitters, or two such rows separated by 20 µm in depth. It is not a stock photograph, biological rendering or image that gets a sharpened replacement when a control changes. Every displayed spot, intensity profile, image position and scale bar comes from the same specimen and pupil calculation. The larger off-axis tracer is a separate declared geometric marker, not a second view of the small calibration pair.

## Frozen eight-chapter film

The draft is **176 seconds**, eight 22-second windows. Chinese and English speech is separately authored. Scripts, titles, captions, cue IDs and director timing are frozen at handoff. No changes to those fields followed the stable-packet notification; the final post-freeze visual correction only moved the focus ruler's unit away from its last tick. Parent integration owns synthesis and measured timing expansion.

| Start | Chapter                                  | Visible causal change                                                                                                                                                                   |
| ----- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 s   | The objective brings rays together       | Five pupil rays from the same off-axis point are progressively revealed until they meet at the real intermediate plane.                                                                 |
| 22 s  | First, a real inverted image             | The tracer moves from +40 to −40 µm; the intermediate image moves oppositely with lateral magnification −19.                                                                            |
| 44 s  | The eyepiece changes viewing angle       | Eyepiece reference power rises from 10× to 20×; its focal length and axial position change together, preserving the front focal-plane condition and parallel outgoing bundle.           |
| 66 s  | Focus by moving the specimen stage       | Stage offset falls from +18 µm to zero at NA 0.22. The same point pair concentrates as its finite-pupil defocus phase disappears.                                                       |
| 88 s  | Different depths come into focus in turn | Two rows at depths 0 and 20 µm exchange sharpness while focus moves between their planes, at NA 0.24.                                                                                   |
| 110 s | Aperture changes point separation        | NA rises from 0.08 to 0.24 at fixed focus and 2.4 µm point spacing. Calculated spots narrow and the summed profile gains a central dip.                                                 |
| 132 s | Aperture also changes depth of field     | Focus stays midway between the two layers while NA falls from 0.24 to 0.08. The axial peak response broadens while lateral pairs merge.                                                 |
| 154 s | Enlarging blur adds no detail            | At fixed NA 0.08, eyepiece power rises from 10× to 25×. The existing merged patch enlarges and the specimen-space scale bar changes, while the objective's resolving scale stays fixed. |

Each chapter is a reproducible experiment selected by `useShowcase` chapter/progress. Smoothstep progress includes short initial/final holds; chapter cuts establish new experiments. No animation history, random state, private clock or speech-padding loop exists.

## Ray model

Rays use millimeters and paraxial slopes. Free propagation is P(L) = [1, L; 0, 1]; a thin lens is L(f) = [1, 0; −1/f, 1]. Their ordered products transfer every ray. Both determinants are one. The objective has f = 8 mm and the fixed intermediate plane v = 160 mm; focused object distance u₀ = 8.4210526 mm gives signed magnification −19. The 160 mm is an optical principal-plane separation, not a commercial mechanical tube-length specification.

For a specimen layer at depth z and stage focus offset F, u = u₀ + (z−F)/1000. Its true geometric image is at 1/(1/f−1/u). A ray selected by pupil fraction a begins at its specimen height, reaches height ar at the objective, refracts by θ′ = θ−y/f, propagates to the eyepiece, and refracts again. The renderer never snaps a ray endpoint to a desired crossing. The pupil radius is r = u₀ NA₀, with the control defining nominal paraxial aperture. Its current paraxial NA is r/u. Exact sine NA is sin(arctan(r/u)); their difference stays below 3% in the supported low-aperture range. This is not a high-NA or immersion objective model.

The eyepiece focal length is 250 mm divided by its reference power; its position is v+fₑ. At focus, each source point gives a parallel outgoing bundle. Signed visual magnification is −v/u × 250/fₑ, referenced to unaided viewing at D = 250 mm. That comparison distance does not mean a real image or retina is drawn there. Eye accommodation is omitted. The fixed-plane centroid uses −v/u even when the best image plane moves, and the geometric blur radius is |r(1+v/u−v/f)|. The 2.5 mm eyepiece clear radius is checked for ray acceptance; supported exploration rays remain inside it.

## Wave image and normalization

The image is calculated at the same fixed intermediate plane, using the same u, v, f and r. For normalized pupil radius ρ, image radius R and wavelength λ = 0.55 µm, the pupil defocus phase is β = πr²(1/u+1/v−1/f)/λ, with consistent length units. The scalar Fresnel intensity is:

`I(R) = |2 ∫₀¹ ρ J₀(2πrRρ/(λv)) exp(iβρ²) dρ|²`.

At β = 0, this becomes the Airy intensity `[2J₁(q)/q]²`. On axis, intensity is `[sin(β/2)/(β/2)]²`. The implementation uses Simpson quadrature with 96 radial intervals and a dimensionless lookup step of 0.05 through q = 36. J₀/J₁ use convergent series below 14 and a 12-term asymptotic expansion above it; tests compare those functions with an independent periodic angular quadrature. The bounded, immutable pupil table is about 0.53 MiB, not frame history. Distant rings beyond the finite kernel are truncated.

Each emitter's intermediate-plane center and transverse scale use its own actual object distance. Intensities of independent emitters add. The specimen image uses 161×161 pixel-center samples and a fixed linear display reference of 1.25 times the clear single-point peak, clipped to the display range. The warm colors are a monochrome display tint. Pupil throughput, photon statistics, chemistry, aberrations, vector polarization, partial coherence, condenser optics and eye/retinal transfer are not modeled. Normalizing to the in-focus point peak explicitly means that brightness across apertures is not a throughput comparison.

The eyepiece sets the angular field: its span is 16 µm × 10/ocular power in nominal object-referred coordinates. It enlarges the point image and its blur together, rather than generating different object detail. The reference Rayleigh distance uses the Airy first zero, 0.6098349456λ/NA. λ/NA² is a declared diffraction depth scale, not a measured full-width-at-half-maximum or universal acceptability threshold. The actual displayed axial curve comes from the integral's on-axis result.

## Primary sources and assets

Read on 2026-09-05:

- [MIT, C. Warde — Geometric Optics](https://web.mit.edu/6.161/www/Geometric-Optics-9-07.pdf): paraxial ray matrices, conjugates and compound microscopy. The explicit pupil rays and finite-conjugate image equations are independently implemented here.
- [Nikon MicroscopyU — The Microscope Optical Train](https://www.microscopyu.com/microscopy-basics/components): intermediate images, eyepieces and the distinction between optical and mechanical tube distances.
- [Nikon MicroscopyU — Resolution](https://www.microscopyu.com/microscopy-basics/resolution): Airy patterns and criterion-dependent aperture/resolution relationships.
- [Nikon MicroscopyU — Depth of Field and Depth of Focus](https://www.microscopyu.com/microscopy-basics/depth-of-field-and-depth-of-focus): object-space depth, image-space focus, diffraction depth scaling and illumination assumptions.
- [Stanford ISETCam — Calculating Defocused Images](https://stanford.edu/~wandell/data/isetcam/optics/s_opticsDefocusWVF.html): pupil/wavefront calculation as a route to physical defocused images. The displayed scalar Fresnel integral is derived for this scene's own finite pupil.
- [Leica Microsystems — What is Empty Magnification?](https://www.leica-microsystems.com/science-lab/microscopy-basics/what-is-empty-magnification/): magnification cannot replace detail limited by the objective and wavelength.

All geometry, specimen data, kernels, curves and cover art are original procedural output. No external visual assets or `public/microscope/` directory are needed.

## Phone, exploration and resources

Desktop opens with one full optical rail, then pairs a circular specimen field with only the current focus ruler or profile. Phone rotates the optical bench into a separate 320×430 coordinate system. Later chapters use the circular field plus a short focus ruler, lateral profile or axial curve; the empty-magnification shot keeps only the field. The desktop aperture inset is omitted on phone. Short mobile headers replace repeated instrument descriptions, while the relevant explanation remains directly below the visual. Main visual height is reserved at 423 CSS px to reduce transport movement.

Exploration provides five visible native ranges per view. Coarse focus (−20…20 µm, 2 µm steps) and fine focus (−2…2 µm, 0.1 µm steps) sum into the same stage position. NA, ocular power and either point separation or geometric tracer height complete the controls. All have explicitly translated `aria-label` values. A toggle adds the second physical layer. Reset restores coarse/fine zero, NA 0.2, ocular 10, separation 2.4 µm, one layer, tracer +40 µm and specimen mode; both presets initialize all values.

SVG is the native ray/scope renderer. Canvas displays the computed raster; unavailable context or failed image-data write leaves an SVG fallback that draws the same sampled colors, merging adjacent equal-color cells only. Context cleanup clears the canvas. No WebGL, audio engine, Worker, private animation loop or timer is created. `useShowcase` supplies reduced-motion, pause and offscreen/background behavior; `useCompact` manages its media-query subscription. This worker did not synthesize or listen to any narration.

## Owned files and packet

- `src/models/microscope.ts`
- `src/models/microscope.test.ts`
- `src/components/experiments/Microscope.tsx`
- `src/components/lab/MicroscopeOptics.tsx`
- `src/styles/microscope.css`
- `src/components/covers/MicroscopeCover.astro`
- `src/content/microscope.mdx`
- `src/content/en/microscope.mdx`
- `docs/examples/microscope-brief.md`
- `docs/zh-CN/examples/microscope-brief.md`
- `src/data/scene-packets/microscope.json`

The temporary packet has the exact requested five top-level keys, no topic number, repository-relative component/cover paths, 80 translations and eight bilingual cues. Existing dictionary wording is preserved, including `3 分钟` → `3 minutes`. Related slugs `camera-lens`, `diffraction` and `optical-fiber` are registered. The parent consumes the packet into canonical registries. The cover is self-contained 400×230 SVG accepting optional `color`, with both rays and specimen pixels calculated from the model. MDX uses native Unicode formula blocks and the `understand`, `try`, `deeper` anchors; no raw TeX or shared math dependency is introduced.

## Evidence and remaining review

- Targeted model suite: **12 tests**, including matrix determinant/conjugacy, independently derived thin-lens crossings, continuity at both principal planes, relaxed-eye output, geometric blur, independent Bessel quadrature, Airy pattern/first zero, analytic axial defocus, pupil scaling, actual two-point contrast, layer focus exchange, unchanged specimen transfer under ocular enlargement, pixel reconstruction, 328 reverse-seek states and 32 endpoint combinations.
- Topic-rooted TypeScript, Astro cover compilation, repository Satteri MDX compilation and targeted formatting pass without a shared build. The actual Astro cover is also rendered to SVG and rasterized in the isolated review tree. That temporary render adapter removes unused legacy compiler metadata to match the installed container runtime; it does not replace the parent's production-pipeline check.
- Independent review tree: `/tmp/microscope-review/`, with its own offline frozen-lockfile dependency install. No `node_modules` symlink is used. Its harness mounts the real scene with `FilmContext` and merges the packet translations only into the copied dictionary. It is not the integrated production player and contains no audio.
- Chrome review inspected the desktop optical bench and 320×900 bilingual phone compositions. All eight chapter-end states in each language were measured: component height **620–702 px**, fixed visual stage 423 px, document width 320 px, caption text 16 px. These are component/harness measurements, not a guarantee of the final parent's full player height or physical-phone performance. Mobile header redundancy was corrected after the first measurement.
- Browser keyboard Home/End/arrow operation changed the actual focus, NA, ocular, separation and tracer values. Reset restored all visible values, second-layer state, display mode and the hidden tracer. Measured ranges were 44 px high, buttons about 44.8 px. No browser console errors were observed during these checks.
- A deliberate Canvas-context failure in the isolated harness displayed 7,155 real SVG color runs for the two-depth sample. The specimen and stage ruler were visually inspected; a tight final tick/unit pairing was corrected by moving the unit into the ruler header. That correction did not change narration or timing.
- Parent review remains: integrated chapter transport and deep links, full silent playback, both complete synthesized tracks and native listening, media `currentTime` versus film time after seek on the delivered host, reduced-motion/offscreen behavior in the full page, and physical-phone performance. No full listening, native audio playback, production build, shared registration or deployment is claimed by this worker.
