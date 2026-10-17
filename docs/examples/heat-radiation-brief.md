# Heat radiation — author brief

Status: source package, six 24 s narration chapters **draft**. Browser key shots, full playback, complete-player measurement, listening and physical-device performance are not-run. Tests are author checks, not independent visual acceptance.

## Misconceptions and distinct purpose

Equilibrium is not zero emission; emission is not net heat loss; low emissivity is not a one-way heat valve; visible colour is not thermal-IR absorptivity. Prerequisite: temperature and an energy rate. Adds radiation through vacuum to `heat-conduction` and `convection`, and explains the emission feeding `ear-thermometer`. No greenhouse/climate extrapolation or body-temperature simulator.

## Actually read claims and boundaries

Read OpenStax University Physics 2 [§1.6 Radiation](https://openstax.org/books/university-physics-volume-2/pages/1-6-mechanisms-of-heat-transfer), specifically emission, grey-body net exchange and wavelength-dependent qualifications, plus University Physics 3 [§6.1](https://openstax.org/books/university-physics-volume-3/pages/6-1-blackbody-radiation), Wien, Stefan and Planck law.

| Claim                                                               | Condition                                                                                | Independent check                                                                                           |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| P=εσAT⁴; incoming absorbed power uses the same ε                    | Small opaque diffuse-grey sphere in much larger black isothermal enclosure, view factor1 | 306 K/295 K, A1.5m², ε.97 →98.54 W net-out, compared with source ≈99 W benchmark                            |
| Equal T means equal positive powers; swap temperatures reverses net | Same surface and environment geometry                                                    | Equality and antisymmetry tests; ε0 perfectly reflecting boundary gives no exchange                         |
| Absolute T doubled means emission×16                                | Area and ε fixed                                                                         | Independent ratio check; not a claim about the net ratio                                                    |
| Planck exitance integrates to σT⁴; Wien locates peak                | Ideal wavelength-independent grey factor                                                 | Log-wavelength numerical integration at300/600 K; peak checked on both sides, not a rendered curve snapshot |

Source images/text/code are not copied. Equations are independently implemented. Visible white/black shortcuts in the introductory source are not generalized beyond the grey approximation; wavelength qualification is retained.

## Art and causal shots

A still pewter sphere inside a dark sliced enclosure, alternating warm emission and cool absorbed-ray families. Direction glyphs are schematic and have constant width; common fixed-scale power tracks and true numbers carry magnitude. No fictitious flame, flowing hot matter or visible glow at300K. Radius derives from actual spherical surface area.

1. Hot sphere: emission minus absorbed return gives net loss through vacuum.
2. Warm enclosure to same temperature: two positive equal powers, net zero.
3. Sphere300→600K:16× emission at fixed A/ε and a distinct net difference.
4. Lower ε: both powers shrink together.
5. Enclosure crosses above sphere: net reverses but emission remains.
6. Infrared spectrum on a separate composed view;300K dashed reference and moving current peak. Both curves normalized to own peak to isolate peak location, explicitly not power/area comparison.

Desktop bounded980px stage300px. Phone340×245 viewport at190px; spectral tick labels26units≈18px after320-screen fit, all prose CSS16px. Watch phone hides long qualifications; exploration has readable controls and real model inputs. Fullplayer≤740px including bilingual captions remains integration-owner browser check.

## Verification

Six model tests: independent benchmark, positive equilibrium exchange, incident energy partition, temperature reversal, kelvin scaling, Planck integration/peak and invalid input. Scoped TS/MDX/packet checks are recorded at handoff. No voice generated or shared registries changed by author.
