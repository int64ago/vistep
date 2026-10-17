# Pinhole camera — author brief

Status: source authoring; speech draft until decisive shots are checked. Browser playback, physical phone performance and listening are not-run. Model tests are author numerical checks, not independent acceptance.

Misconception: removing more light must always improve sharpness. Prerequisite: straight-ray geometry; the wave boundary is introduced in the film. Distinct contribution: lens-free directional image formation, unlike `camera-lens`, and an explicit geometry/diffraction tradeoff extending `aperture`.

| Claim                                                                  | Source / section                                                                                                                                                   | Conditions                                                             |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Straight rays through the opening invert the image; magnification −b/a | Similar-triangle derivation in the independent model; [OpenStax ray model](https://openstax.org/books/university-physics-volume-3/pages/1-2-the-law-of-reflection) | Paraxial geometry, zero-thickness opening, planar object and screen    |
| Opposite aperture-edge rays produce diameter d(1+b/a)                  | Derive both endpoint intersections independently in tests                                                                                                          | Geometric optics only; uniform opening                                 |
| Circular far-field first-zero diameter 2.44λb/d                        | [OpenStax §4.5 Circular Apertures and Resolution](https://openstax.org/books/university-physics-volume-3/pages/4-5-circular-apertures-and-resolution)              | Scalar monochromatic far-field scale; not an exact finite-distance PSF |

Independent benchmark: 60 mm object height at a=600 mm and b=100 mm maps to −10 mm. For a 2 mm hole, intersect edge rays independently and obtain a 2.333 mm geometric patch. Boundary counterexample: halve a tiny aperture; geometric width halves, diffraction scale doubles and admitted power quarters. At the scale balance, explicitly test that the Fresnel number is not asymptotically small; do not claim a certified optimum.

Art direction: a cutaway dark camera obscura with three persistent coloured object identities, followed by a receiving-screen close-up. Fixed object distance and a physically linked screen position preserve straight ray geometry. Chapter 1 shows inversion; 2 shrinks the geometric patch; 3 tracks admitted power separately from normalized patches; 4 shows growing diffraction; 5 compares both scales with the approximation disclosed; 6 changes physical screen distance and magnification.

Desktop: long object-side path and short dark chamber; point patches take over the stage for chapters 2–5. Phone: 340-unit ray composition, still carrying all three identities; the close-up uses its own screen composition and CSS labels rather than tiny SVG text. Long qualifications are disclosed. Main controls use the shared keyboard-capable Range and remain in exploration. The synthetic patch is plainly an illustrative width, not a physical intensity profile.

Opening, turning and result: inversion, diffraction counterexample, distance comparison. Full playback, direct-seek framing, actual glyph bounds, exposure-label clarity and both recorded tracks must be reviewed by the integrator before release. No audio assets are produced here.
