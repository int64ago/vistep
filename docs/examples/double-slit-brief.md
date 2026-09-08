# Double-slit interference

[简体中文](../zh-CN/examples/double-slit-brief.md)

## Question and causal argument

Why can opening a second slit make parts of a screen darker? Follow one screen point from path difference to field phase, then add the fields and square their resultant. Separate the fine interference fringes set mainly by slit separation from the diffraction envelope set by each slit’s width. End with discrete detections sampled from the same distribution, without drawing photon trajectories.

## Visual direction

An optical instrument combines an aperture cross-section, a marked screen point P, a luminous screen strip and its quantitative intensity curve. The phase chapter replaces the path view with two complex-amplitude arrows added head to tail. The screen coordinate and intensity reference connect the views. Distinct line colours identify the two contributions; both represent the same optical wavelength and polarization.

Desktop gives the apparatus and screen room to breathe. A narrow screen gives the current causal step priority, keeping its probe, phase or pattern legible instead of shrinking every view together. Parameter chapters keep a millimetre ruler visible. Only the detection chapter accumulates dots, all on the receiving screen. Paths are geometric guides; slowed oscillation is a teaching cue.

## Measured film

Both generated language tracks measure **168 seconds**, with seven shared 24-second chapter windows. The timings below follow `src/data/film-timeline.json`; duration measurement does not establish listening quality.

| Measured window | Chapter                          | Visible causal change                                                                                         |
| --------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 0–24 s          | Another slit, yet less light     | One slit becomes two on the same 0–4 intensity scale; a selected dark position loses light.                   |
| 24–48 s         | Follow one screen point          | P moves through path differences 0, λ/2 and λ.                                                                |
| 48–72 s         | Add fields, then find intensity  | Head-to-tail complex amplitudes move from agreement to opposition; resultant squared follows intensity.       |
| 72–96 s         | Wider separation, closer fringes | d increases from 180 to 300 μm; a stays at 35 μm and λ at 550 nm.                                             |
| 96–120 s        | Longer wavelength, wider fringes | λ increases from 550 to 650 nm, retaining d = 300 μm and a = 35 μm.                                           |
| 120–144 s       | Wider slits, a narrower envelope | a increases from 35 to 70 μm, retaining d = 300 μm and λ = 650 nm; identify the changing intensity reference. |
| 144–168 s       | One detection at a time          | Retain the final 300 μm / 650 nm / 70 μm configuration and accumulate its screen detections.                  |

The parameter chapters carry the preceding chapter’s final configuration forward, so each comparison changes only one physical input. Free exploration still offers the wider ranges d = 120–300 μm, λ = 450–650 nm and a = 20–70 μm.

Defaults are λ = 550 nm, d = 180 μm, a = 35 μm and L = 1 m. The film’s screen spans ±10 mm; the exploration probe stays within ±8 mm. Near-axis fringe spacing is about 3.056 mm. The first interference zero is about 1.528 mm from centre; at one wavelength of path difference, y ≈ 3.056 mm and I/I₀ ≈ 3.527. This is an in-phase position, not the exact peak of the envelope-modulated curve.

## Model and interpretation

The scene uses a scalar Fraunhofer model of two identical, uniformly illuminated rectangular slits with coherent, normally incident monochromatic light and matching polarization:

`θ = atan(y/L)`, `β = πa sinθ/λ`, `φ = 2πd sinθ/λ`, `I/I₀ = 4 sinc²β cos²(φ/2)`, with `sinc 0 = 1`.

`I₀` is the central intensity of one open slit at the **current width**. Opening the second slit holds this reference fixed, so central intensity changes from 1 to 4. Changing width changes the reference: the chapter compares normalized shapes, not absolute transmitted power. The single-slit first envelope zero is outside the default screen at about ±15.716 mm. At a = 70 μm it lies at about ±7.857 mm for 550 nm light, or ±9.286 mm for the film’s final 650 nm light. The fine interference factor and broad envelope multiply; neither replaces the other.

The phase uses the far-field path difference d sinθ. The drawn paths are not measured to obtain an exact distance difference. The model neglects near-field propagation, finite slit height and thickness, material boundaries and polarization coupling. With full aperture span D = d + a, the most demanding specified combination (d = 300 μm, a = 70 μm, λ = 450 nm, L = 1 m) gives D²/(λL) ≈ 0.3042 and an omitted axial edge phase of about 0.239 rad. This is an approximation diagnostic, not a claim of uniformly negligible error or the single-slit scene’s separate 0.1 display guard.

Detection sampling divides the intensity in each screen interval by its integral over the displayed screen. It describes arrival probability **conditioned on detection within that window**; a chosen dot count does not encode source brightness or throughput. Under ideal coherent single-photon conditions without distinguishable path information and with uniform detection efficiency, the same spatial intensity profile gives normalized detection probability. The scene does not simulate photon paths, path measurement, detector noise or quantum state collapse. Repeated dots are simulated samples, not recorded experimental events.

## Sources and original work

- [UT Austin, Two-Slit Interference](https://farside.ph.utexas.edu/teaching/315/Waves/node91.html): path geometry, far-field expansion and relative phase.
- [OpenStax, Intensity in Single-Slit Diffraction](https://openstax.org/books/university-physics-volume-3/pages/4-2-intensity-in-single-slit-diffraction): integrated slit field, sinc amplitude and squared intensity.
- [OpenStax, Double-Slit Diffraction](https://openstax.org/books/university-physics-volume-3/pages/4-3-double-slit-diffraction): envelope times interference, missing orders and the slight shift of composite maxima.
- [William & Mary, Single-Photon Interference laboratory guide](https://saaubi.people.wm.edu/TeachingWebPages/Physics251_Fall2024/Week10/single-photon-interference.pdf): the 4I₀ normalization and comparison of bright-light and photon-counting measurements.
- [Feynman Lectures III.1, Quantum Behavior](https://www.feynmanlectures.caltech.edu/III_01.html): adding probability amplitudes and interpreting individual detections.

These references support the physics. The explanatory prose, choreography, apparatus drawing, plotted graphics and cover are original scene work; source figures are not reproduced.

## Integration and review status

The model lives in `src/models/double-slit.ts`, chapter direction in `src/models/double-slit-film.ts`, and the experiment in `src/components/experiments/DoubleSlit.tsx`. The cover samples the same physical intensity model. Both articles use `understand`, `try` and `deeper` anchors. The integration owner registers both languages and consumes the temporary narration proposal into the canonical script and generated shared timeline.

This brief records production intent, model conventions and the measured shared audio timeline. Model tests, independent transcription, desktop and narrow-screen stills, full playback, resource-failure checks and reduced-motion review require separate evidence from the integration owner. Automated transcription does not establish listening quality. No native full-track listening, physical-phone performance or successful publication is claimed here.
