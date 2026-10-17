# Dew point — author production brief

Nine-file source package; six24-second cues144s remain draft. Model checks are authored evidence, not independent visual acceptance. Full browser playback, all key shots, narrow-screen budget, hardware, listening and failure checks await integrator.

## Question, misconceptions and adjacent lessons

A surface being cooler than air is insufficient for dew. Relative humidity is not water mass and can fall without removing water. Dew point is not a universal fixed temperature. This separates ambient-reservoir cold-mirror conditions from constant-pressure parcel cooling with a finite water budget. Related evaporation scene provides reverse mass/latent flux; latent heat explains phase energy; adiabatic scene is a contrasting boundary condition. Age10+, prior knowledge of temperature and ratios.

## Actual reading and claims

Read [NIST documentation](https://emtoolbox.nist.gov/wavelength/documentation.asp), Humidity, AppendixA-I/A-II and Table2: saturation formula, partial-pressure ratio, dewpoint equilibrium; enhancement factor explicitly omitted. Read [NWS dry/wet/dew temperature sections](https://www.weather.gov/source/zhu/ZHU_Training_Page/definitions/dry_wet_bulb_definition/dry_wet_bulb.html), especially the cold-can observation. Do not reuse its unrelated lapse-rate simplifications. Mixing ratio w=.62198e/(P−e) is derived from ideal-gas molar masses per dry-air mass. At fixedP/w before condensation, e stays fixed through warming; fixed-volume warming is deliberately excluded from that claim.

Cold mirror: fixed large ambient reservoir, surface saturation compared with e, droplets condition only—not mass/rate simulation. Parcel: slow externally controlled constantP temperature, retained condensate, gas/liquid equilibrium and exact total-water conservation. No ice, salts, nucleation hysteresis or supersaturation. Heat released by condensation must be externally removed but cooling power is not calculated. Phase-bar widths encode mass, not physical gas/liquid volumes.

## Independent benchmarks and counterexamples

Six tests: NIST rounded saturation2339/7384/12351/101418Pa with±.51Pa; inverse2339Pa≈20°C and7384Pa≈40°C; exact saturation/RH100% dewpoint; threshold±.01K around computed dewpoint; warming20→35°C with fixed pressure and water ratio keeps e/Td/w unchanged while RH falls; water conservation and saturated gas belowdewpoint; a separate5°C published saturation≈872.5Pa mass-ratio check; retained-condensate reheating reverses allocation with no invented water; pressure affects g/kg but not Td for the same e; invalid domains. The0–40°C target and initial20–35°C/RH30–100% avoid frostpoint or below-domain inversions.

## Art direction / evidence progression

A clear saturation-pressure construction is the principal object: blue curved equilibrium locus, gold initial vapour line/intersection, a white temperature cursor and a material phase point. Below it, a luminous cold-mirror strip reveals schematic droplets only past threshold. Last two chapters replace mirror with an exact gas/liquid water-budget bar, keeping the pressure construction and its explicit original line.

1. Cool30→20°C at ambient30°C/RH50%: still above dewpoint.
2. Cross dewpoint20→12°C: condition flips, mirror deposits appear.
3. Mirror fixed15°C; RH30→80% shifts pressure and threshold.
4. Warm ambient20→35°C at fixed e/P/mixing ratio: Td unchanged, RH falls.
5. Slow constantP parcel30→0°C: gas follows saturation and liquid takes the difference.
6. Same retained water parcel0→30°C: liquid re-evaporates; sum remains fixed.

Desktop760×340,290px stage; independent phone340×300,225px stage. Graph labels24units phone,20desktop; DOM16px and44px controls. Bound curve max7.384kPa lies below8kPa graph ceiling, all temperature controls0–40 fit exact axes; saturation and dewpoint endpoints included. Complete phone-player≤740px is a target awaiting root measurement. Shared FilmContext drives deterministic states, no local timers/resources.
