# Diffraction grating — author brief

Status: key shots and model authored; browser review and speech freeze pending. Numerical evidence is author self-review. Complete playback, physical-device performance and listening are not-run.

Misconceptions: more slits move the maxima; every integer order must be bright; normalized curves represent fixed exposure. Prerequisites: coherent wave addition, slit spacing and wavelength. Distinct contribution beyond `double-slit`: finiteN narrowing explained by phasor closure, physically scaled aperture growth, and finite-width missing orders. Same-batch `prism-dispersion` provides a reasoned spectral comparison with a different mechanism and visible wavelength ordering.

| Claim                                              | Technical source                                                                                          | Conditions                                           |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Principal directions d sinθ=mλ and narrowing withN | [OpenStax §4.4](https://openstax.org/books/university-physics-volume-3/pages/4-4-diffraction-gratings)    | Coherent equal-amplitude periodic sources; far field |
| Finite-width slit envelope multiplies interference | [OpenStax §4.3](https://openstax.org/books/university-physics-volume-3/pages/4-3-double-slit-diffraction) | Uniform rectangular slits, scalar Fraunhofer limit   |
| Physical order requires                            | mλ/d                                                                                                      | ≤1                                                   | Direct propagating-angle condition | Real observation angle |

Independent benchmarks: the N=2 sum matches cos²(πd sinθ/λ);N=1 reproduces the single-slit envelope; the first cancellation at sinθ=(1+1/N)λ/d closes the finite phasor polygon. For a=d/2, order2 vanishes and order1 intensity is4/π² after normalization. Tests compare fast analytic curve sampling to a separately evaluated finite complex sum. Counterexamples: increasingN does not move principal directions; an integer order can lie outside the propagation cone or be cancelled by the envelope.

Direction: a compact spectrograph atlas. Actual finite-width slits grow on a common scale, an angular spectrum supplies the evidence, and selected chapters replace the spectrum with a phasor instrument. Seven chapters add two-slit baseline, increasedN, aligned contributions, first-null closure, wavelength comparison, spacing/order bound and finite-width missing order. The query marker is driven by the same sine used for numerical intensity and phasor sums.

Desktop: a physical slit strip, normalized angular plot and optional square-root exposure strip. Phone: its own340-unit graph, CSS16 px axes and compact μm dimensions; watch mode removes the redundant exposure strip so the full player can fit near the740 px target including captions and transport. Phasor chapters keep only the current instrument. Long normalization and scalar-approximation details are disclosed. Pattern arrays are memoized; analytic sampling avoids per-pixel phasor allocations.

No claims about real blaze efficiency, near-field propagation or calibrated colour are made. The source of raw N² growth and normalization is explicit. All future related slugs must be batch dry-run together if not registered. Browser peak visibility, missing-order marker alignment, phasor endpoint clearance and both tracks remain for the integrator.
