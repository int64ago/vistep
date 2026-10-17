# Fresnel lens — author brief

Status: source ready for decisive-shot review; narration **draft** until integration-owner browser acceptance. Author tests do not establish visual acceptance, listening, full playback, hardware performance or failure behaviour.

## Misconception, prerequisite and addition

A ring pattern alone does not focus. Surface normals and refractive-index contrast jointly determine deflection. A translated continuous surface is not automatically exact at a new exit position; this model redesigns each curved annulus for its actual position. Prerequisite: Snell refraction from `refraction`. Addition to `camera-lens`: geometric collection, material volume and unequal inter-zone wave phase. It is a refracting annular lens, not a diffraction zone plate.

## Actually read sources and assumptions

| Claim                                                                                          | Read source                                                                                                                                         | Boundary                                                        |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Concentric grooves function as individual refracting surfaces, with a thin lightweight profile | [Edmund, Advantages of Fresnel Lenses, theory](https://www.edmundoptics.eu/knowledge-center/application-notes/optics/advantages-of-fresnel-lenses/) | Generic optical principle; not an efficiency/product prediction |
| Light travels straight in uniform bulk; surface orientation redirects it                       | Same manufacturer note, theory                                                                                                                      | Homogeneous medium, geometric optics                            |
| Relative indices determine refraction at each real normal                                      | [OpenStax §1.3 Refraction](https://openstax.org/books/university-physics-volume-3/pages/1-3-refraction)                                             | Nonabsorbing ideal material n1.49, plane normal entrance        |
| Geometric collection does not establish precision image quality                                | Edmund note, imaging discussion                                                                                                                     | No diffraction PSF, dispersion or ring-edge loss calculation    |

## Independent model evidence

Each curved zone solves n t + hypot(r,F−t)=Kzone with a stable quadratic root. Its derivative defines a real surface normal. Outgoing direction is computed by vector Snell, then its independent axis intersection is checked against F, over3focal distances×3pitches and many radii. Finite differences independently verify the analytic derivative. Uniform surrounding index n gives straight output and no finite focus. Rotational volume2π∫r tdr uses Simpson per annulus and is checked against60000midpoint samples. The continuous comparison is another constant-optical-path asphere, same aperture, focal coordinate and edge base thickness. Different Kzone values expose unequal phases across rings. Tests do not mirror an output direction preassigned to the focus.

## Art direction and causal storyboard

Light parchment and a softly green optical section, warm copper rays, equal physical horizontal/vertical scale. Ring geometry is generated from actual surfaces, including reset walls, and shared by cover and experiment.

1. Continuous thick asphere: distinct local exit slopes converge axial rays.
2. Redesigned thin annuli: same aperture and axial focus with much less bulk.
3. True equal-scale magnification of a selected facet: actual normal and incident/refracted angles.
4. Dashed continuous outline plus two integrated rotational-volume bars.
5. Keep geometry fixed, continuously match outside index: rays become parallel without removing grooves.
6. Restore air, hold geometry fixed and expose relative550nm phase across rings. Static modulo-phase bars avoid rapid artificial phase flicker; no imaging-quality claim is inferred from geometric crossing.

Phone uses a340×220 composed section,205px stage and≥26unit SVG focal label, aiming for≥16px actual text at320screen. Controls and qualifications expand on demand. Full-player≤740px and English label fit remain browser-verification targets. Check close-up entry/exit continuity, index-matched last frame, pitch extremes, phase strip and volume chapter. Speech describes visible consequences; implementation proof remains here.
