# Spherical aberration — author brief

Status: source/key shots ready; six 24 s bilingual chapters **draft** until integration-owner browser review. Author model tests are not independent visual acceptance. Full play, physical phone performance, listening and resource-failure checks not-run.

## Misconceptions and collection position

Spherical aberration is not just defocus, nor chromatic dispersion. Smaller pupil reduces geometric blur at an accepted-area cost, without unlimited real sharpness. On-axis parabolic correction does not eliminate off-axis coma. Prerequisite: a surface normal determines reflection. Adds finite-pupil exact optics to `camera-lens` and `telescope`; unlike `fresnel-lens`, it uses a reflective surface and a three-dimensional pupil spot.

## Actual readings and claims

| Claim                                                                                        | Actually read source                                                                                                                                              | Conditions                                                                                       |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Large spherical-mirror pupils fail to focus all axial parallel rays together; paraxial f≈R/2 | [OpenStax University Physics 3 §2.2, curved mirrors and spherical aberration](https://openstax.org/books/university-physics-volume-3/pages/2-2-spherical-mirrors) | Exact normals here rather than a thin paraxial mirror formula                                    |
| Reducing diameter reduces spherical aberration, and it differs from colour aberration        | [Nikon Sport Optics Guide, Spherical Aberration and Chromatic Aberration](https://imaging.nikon.com/sport-optics/guide/binoculars/technologies/technologies_08/)  | Qualitative connection; this scene isolates a mirror rather than claiming Nikon lens performance |
| A parabola focuses axial parallel rays, while off-axis coma can remain                       | OpenStax §2.2, Coma section, explicitly including parabolic mirrors                                                                                               | No claim that all fields, all real wave effects or real instruments are perfect                  |

## Independent model and benchmarks

Sphere sag z=−R+sqrt(R²−r²), parabola z=−r²/(2R). Continuous correction interpolates actual sag and its derivative, then computes the rotational normal and exact 3D specular reflection. This changes a true geometric surface rather than assigning output rays to a focus. Independent spherical axial-intercept oracle R²/(2sqrt(R²−r²))−R is tested at five radii and the paraxial limit. Unit direction, equal normal reversal and preserved tangent components are checked in 3D. Parabolic axial focus is independently fixed at −R/2 for every radius and all pupil azimuths.

Circular-pupil points use equal-area annular samples. The least-squares on-axis receiving plane is obtained by solving the quadratic spot error in screen coordinate with 128 radial quadrature samples; independent screen perturbations check a strict minimum. At R = 100 mm and A = 40 mm, marginal intercept is −45.4455 mm, minimum-RMS plane about −46.9088 mm, geometric spot RMS about 0.724 mm. A = 10 mm reduces geometric RMS to about 0.0085 mm but only 6.25% of the reference area remains. Full-aperture parabolic axial RMS is numerical zero, while 3° off-axis produces a nonzero asymmetric spot. No wave PSF, diffraction or detector model is claimed.

## Independent visual direction and evidence

A brushed slate mirror section with pale central rays and warm marginal rays, changing to an equal-scale caustic close-up. A real 3D ray-hit plot uses a fixed ±10 mm window following the chief ray; its RMS is about its own centroid. The screen is an explicitly diagnostic plane, not a physical obstruction in the incident bundle.

1. Full mirror shows continuous incoming and returning rays at distinct pupil heights.
2. Equal-scale focal close-up separates paraxial and marginal axial crossings.
3. Scan the screen, shrinking then expanding a real 3D footprint without obtaining one point.
4. Full mirror support stays fixed; reduce the pale effective pupil and refocus, trading blur for accepted area.
5. Restore full pupil, continuously change real sag toward a parabola. An explicit vertically enlarged departure curve links small surface changes to the collapsing caustic; same screen and paraxial focal length.
6. Keep parabola, tilt axial illumination to 3° and reveal off-axis nonzero asymmetric spot.

Scene max-width 980 px prevents unlimited desktop growth. Phone has a 175 px optical stage and 96 px fixed-scale spot beside compact 16 px readouts. Correction profile is only present when causally needed. Automatic phone hides disclosure; complete-player ≤740 px and English fit remain browser-verification targets. Check the full sequence, all manual extrema, off-axis hit bounds, and the diagnostic-plane interpretation. No own animation clocks or external resources. Narration/captions received an additional English number-and-unit spacing review before handoff.
