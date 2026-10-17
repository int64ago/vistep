# Telescope — author brief

Status: key-shot source ready; speech **draft** until integration-owner desktop/phone review. Model tests and author inspection are not independent visual acceptance. No full browser play, listening, hardware performance or resource-failure claim.

## Question and addition

What grows when a telescope magnifies, and why can a small eye displacement make the view disappear? Prerequisites: a converging lens forms an image; ray direction versus ray height. `camera-lens` concerns recording an image, `myopia-lens` concerns retinal focus. This scene adds an afocal two-lens system, a real intermediate image, angular inversion and a separately imaged aperture. Never equate exit pupil with star image or imply unlimited useful magnification.

## Read sources and claim boundaries

| Claim                                                                            | Actually read source                                                                                                                                                                     | Conditions                                                                |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Two positive lenses, common focal plane and M=−fO/fE                             | [OpenStax University Physics 3 §2.8, Telescopes](https://openstax.org/books/university-physics-volume-3/pages/2-8-microscopes-and-telescopes)                                            | Distant object, thin-lens paraxial Kepler system, final image at infinity |
| Exit-pupil diameter equals objective diameter divided by magnification magnitude | [Edmund Telescope Optics for Hobbyists, Important considerations, equations 3–4](https://www.edmundoptics.com/knowledge-center/application-notes/optics/telescope-optics-for-hobbyists/) | Clear objective aperture; ideal circular uniform bundle                   |
| Lens separation is fO+fE                                                         | Same Edmund guide, Refractive Telescopes                                                                                                                                                 | Automatic refocus accompanies eyepiece changes                            |

Exit-pupil location is independently derived from thin-lens imaging: object distance L=fO+fE, so zP=fE L/fO. Ray matrix propagation provides a second oracle: at this plane y=−(fE/fO)yObjective, independent of source field angle. An independently evaluated circle-intersection formula checks pupil clipping; equal radii at separation one radius have overlap fraction (2π/3−√3/2)/π.

Benchmark: fO400 mm, fE40 mm, aperture40 mm → separation440 mm, magnification−10, exit diameter4 mm, pupil44 mm after eyepiece. Counterexamples: wrong spacing leaves output bundles nonparallel; moving the eye toward the eyepiece separates off-axis footprints; two4 mm pupils displaced4 mm transmit zero area. Do not extrapolate to diffraction, physical eyepiece field stops or actual brightness/resolution.

## Art direction and chapter evidence

A restrained green-blue optical bench changes into a large pupil cross-section, rather than a telescope illustration beside numbers. Three colours label object directions, never wavelengths.

1. Objective close view: rays from each distant direction intersect the focal plane at one point.
2. Ocular close view on phone / complete bench on desktop: rays continue from the same real image to parallel exit bundles.
3. Change fE with simultaneous refocus: output slope grows while exit diameter shrinks.
4. Pupil cross-section: three field centres coincide and objective aperture is imaged to4 mm.
5. Same circles and eye plane, axial eye displacement separates off-axis centres and clips them.
6. Reset the axial plane and shift eye laterally: circular intersection reaches zero at4 mm.

Phone has its own340-unit230-high optical composition and field-pupil view; automatic controls are hidden and model assumptions disclosed. Whole player budget≤740 px is a target pending browser measurement, not an acceptance claim. Manual phone mode shows the complete bench. All animation is FilmContext-driven; captured fractions and diagram use identical ray parameters. Test full playback,320/390 English labels and exploration contrast after integration.
