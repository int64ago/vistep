# Rayleigh scattering — author brief

Status: key-shot source ready; bilingual narration **draft** until integration-owner review. Model tests are not independent visual acceptance. Full playback, listening, device performance and failure checks not-run.

## Misconceptions, prerequisites and editorial addition

Scattering selects existing wavelengths; it does not turn red into blue. All energy removed from the direct beam is not delivered to a single observer. Unpolarized90degree scattering is nonzero. Violet preference of the cross-section alone does not determine perceived colour. Prerequisites: wavelength and a spectrum. `rainbow` describes directional sorting by large droplets; `prism-dispersion` sorts via refraction. This scene adds small-particle spectral attenuation, a normalized angular density, energy bookkeeping and explicit visual matching.

## Actual readings and claim conditions

| Claim                                                                            | Actually read source                                                                                                                                              | Conditions                                                                                  |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Elastic scattered light keeps wavelength; cross-section scales approximately λ⁻⁴ | [NASA GSFC Rayleigh Scattering, electron response and cross-sections](https://acd-ext.gsfc.nasa.gov/anonftp/acd/daac_ozone/Lecture4/Text/Lecture_4/rayleigh.html) | Small structures, no resonance; not aerosol Mie scattering                                  |
| Blue-violet spectral selection alone does not specify human sky colour           | [NASA Wave Behaviors, Scatter](https://science.nasa.gov/ems/03_behaviors/)                                                                                        | Incoming spectrum and visual matching must also enter                                       |
| Unpolarized angular shape is1+cos²θ                                              | [AMS Rayleigh phase function](https://glossary.ametsoc.org/wiki/rayleigh-phase-function/)                                                                         | Their mean-one convention is divided by4π here to make a unit-integral density              |
| Convert spectra through CIE XYZ matching functions                               | [Wyman, Sloan & Shirley2013, equations1 and4, Table1](https://jcgt.org/published/0002/02/01/paper.pdf)                                                            | Analytic1931 fits,5nm sampling; not individual cone curves or calibrated display prediction |
| Blackbody spectral source form and Wien peak                                     | [OpenStax §6.1 Blackbody Radiation, Planck law](https://openstax.org/books/university-physics-volume-3/pages/6-1-blackbody-radiation)                             | 5778K is an illustrative source, not measured solar spectrum                                |

## Model, independent oracles and boundaries

τ550=.12 per relative unit column; τλ=τ550m(550/λ)^4, direct=S exp(−τ), removed=S−direct. Removed energy is the first-event pool distributed by P=3(1+cos²θ)/(16π). Subsequent attenuation and multiple scattering are explicitly omitted, so long-column scattered colour must not be sold as final sky radiance. The direct budget remains correct for unscattered radiation in this ideal nonabsorbing column.

Tests: independent exact ratio450/650=(13/9)^4=28561/6561; Simpson integration over sphere gives phase integral1, forward/back equality and90degree half-forward. Verify per-wavelength energy conservation and zero optical depth; long path increases direct650/450ratio. A monochromatic650source leaves exactly that wavelength after scattering. Source peak agrees with Wien displacement; CIE555nmY≈1 and450nmZ≈1.772 anchors check coefficients. Display independently normalizes each RGB swatch and clips negative/out-of-gamut components; no brightness claim.

## Independent art direction and six causal shots

A blue-grey spectral ledger, not an arbitrary painted sky. The object is the light budget: warm direct area and cool removed area stack to one common pale input outline at every wavelength.

1. Spectral accounting with unequal short/long removal.
2. Two equal-input450/650bars expose a4.35cross-section ratio without solar-spectrum confounding.
3. A true normalized polar angular curve and moving selected radius expose direction shares, nonzero90degree response and forward/back symmetry.
4. Increase column1→8 while keeping the same source and axes: direct hue warms and short-wave direct area contracts.
5. Three CIE matching curves plus integrated swatches distinguish spectral strength from perceived hue.
6. Only650nm source: all nonzero channels remain red; no wavelength conversion.

Phone has a separately composed340×220plot rendered195px,≥26unit SVG labels, CSS16px legends and hue swatches. Main controls and limits expand on demand. Complete-player≤740px and320/390 English fit remain browser-verification targets. Model/plot recompute from FilmContext, no independent animation timer. Inspect zero-column black scattered swatch, mono spectral line, moving angle, long-column last frame, source legend stacking and exploration contrast.
