# Color mixing — author brief

Status: source/key shots ready for integration-owner review. Seven22s chapters are **draft** until reviewed. Author numerical tests are not independent acceptance. Browser complete play, phone measurements, listening and device performance not-run.

## Misconception and scope

Lights do not mix by averaging encoded RGB, and filters do not add their visible colours to white. A yellow percept does not prove a yellow wavelength. Adds to `printer` the distinction between radiant addition and ideal serial transmission; unlike `prism-dispersion`, it combines stimuli instead of separating rays. Prerequisite: independent light channels. Ideal filter results must not be presented as paint predictions.

## Actual readings

| Claim                                                                                    | Read source                                                                                                                                  | Boundary                                                                                 |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Spectral energies add, while serial filter transmissions multiply                        | [Stanford CS178, Additive versus subtractive color mixing, Marc Levoy](https://graphics.stanford.edu/courses/cs178/applets/colormixing.html) | Three-channel idealization here, not arbitrary continuous spectral multiplication in RGB |
| Red+green can match yellow without the same spectrum; illumination and perception matter | [Exploratorium ColorFest, What Is Color?](https://annex.exploratorium.edu/colorfest/whatiscolor.html)                                        | Display reference primaries and normal matching, no individual percept prediction        |
| Linear-light sRGB requires nonlinear encoding before display                             | [W3C CSS Color4, conversion code](https://www.w3.org/TR/css-color-4/#color-conversion-code)                                                  | Encoding and luminance coefficients, not absolute calibrated luminance                   |

Independent benchmarks: sRGB transfer of linear0.5rounds to188; code-domain averaging128would be wrong. UnitRGB add to white; unitCMY serially reject all channels. Cyan+yellow retain only green under white, but reject red-only input. Partial(.5,.25,.75)filter strengths yield(.5,.75,.25)from white, with independent stage checks. Beam has exactly unit plateau through0.75radius, zero outside unit radius and half intensity at0.875radius.

## Art and causal sequence

Dark, softly luminous finite light pools are computed pixelwise with precomputed spatial masks and a display LUT. The readout matches the shared plateau, not a random bright pixel. The second half changes to an actual serial optical path, three horizontal channels and three CMY plates. Remaining energy controls each segment width; ghost lines are disclosed references.

1. Red plus increasing green gives yellow in the shared region.
2. Add blue, reaching reference white only in the common region.
3. Halve all intensities: neutral half-luminance, encoded188.
4. One white beam through cyan rejects red.
5. Add yellow: green is the shared surviving channel.
6. Add magenta: the final channel goes to zero.
7. Cyan/yellow retained, white input moves toward red: missing green cannot be manufactured.

Phone has a distinct pool geometry,190px stage, vertical energy bars and16px readouts. Automatic phone hides model disclosure; all controls are opt-in. Filter SVG text26units aims≥16actual at320. Whole player≤740remains pending browser measurement. Canvas updates only from FilmContext/control state, no independent timer. Canvas failure leaves an explicit status and channel outputs. Check full transitions, zero/all channels, dark controls, input switch and real phone paint performance. Cover computes exact overlap colours from the same linear RGB model; it uses flat-topped disks as a still, not CSS screen blending.
