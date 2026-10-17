# Evaporative cooling — author production brief

Source package ready; six24-second cues are draft until independent key-shot review. Author model tests are not independent visual acceptance. Browser playback, phone hardware, narration listening and failure paths remain not-run by author.

## Misconception and collection position

Evaporation need not wait for boiling. A steady water temperature does not mean zero evaporation. More airflow need not keep lowering the equilibrium without bound. Distinct from `latent-heat` (pure-substance phase platform), this follows an open surface with coupled sensible heat input and mass loss. `convection` supplies the external heat pathway; the water is not cooled by arbitrary wind arrows. Prerequisites: temperature, power, latent heat; intended age10+.

## Read sources and claim boundaries

Actually read [NIST metrology documentation](https://emtoolbox.nist.gov/wavelength/documentation.asp), §V, AppendixA-I/TableA1 and Table2, for IAPWS saturation pressure and independent rounded examples. Actually read [NWS dry/wet bulb/dew point](https://www.weather.gov/source/zhu/ZHU_Training_Page/definitions/dry_wet_bulb_definition/dry_wet_bulb.html), dry/wet/dew sections: evaporative depression depends on humidity and disappears at saturation when film and air are initially equal-temperature. Do not repeat the NIST page's apparent pressure-unit rendering problems in its uncertainty prose; the explicit Table2 benchmark values are in Pa.

Our additional pressure-based transfer law is an explicitly selected lumped teaching model: ṁ=K A(psat−eair), sensible heat=h A(Tair−Tw), liquid mcp dTw/dt=sensible−Lṁ, dm/dt=−ṁ. h=8 W/(m²K), K=4e−8 kg/(m²sPa), A=.02m², initial mass=.02kg, cp4180 and L2.43MJ/kg. Exchange multiplies both coefficients, so equilibrium independence follows from this assumption, not a universal wind theorem. Not calibrated wet-bulb temperature, medical thermoregulation, fan flow or molecular kinetics. No “air holds water” capacity metaphor.

## Independent checks and reverse process

Six tests: NIST published2339/7384/12351/101418Pa rounded points; initially equal-temperature evaporation with humidity below100%; saturated and disabled-path zero flux; dry/humid equilibrium ordering and zero net-power root; flow multiplier transient-versus-equilibrium contrast; independently integrated open-volume energy Δ(mcpT)=Qin−Qlatent−H-sensible-out and mass balance; cold-surface condensation with mass gain and inward latent heat; RK4 step refinement; domain checks. No weakened benchmark tolerance: published values are rounded to nearestPa, hence ±.51Pa. Model validates positive remaining mass. User range10–35°C initial, RH10–100%, flow.4–3 and0–900s stays liquid and wet; no freezing/drying prediction.

## Direction and construction

A warm grey-green laboratory water film with credible immersed temperature probe and shallow metal edge. Left is the actual specimen; right is a fixed0–40°C,0–15min computed temperature history. Gold follows the selected case; pale dashed line/point identifies a controlled comparison. Horizontal sensible heat and vertical phase mass/latent pathway share the current state; **both reverse by sign**, and zero flux hides the arrow. Full future curves are model trajectories, current-time markers seek to exact integrated time.

1. Equal temperature but evaporation cools without boiling.
2. RH20% versus80%, otherwise identical.
3. Exchange.5 versus2, both heat and mass coefficients scaled.
4. Approaching equilibrium, heat input balances latent loss while mass still leaves.
5. Disable mass exchange only, retaining heat transfer; compare evaporating reference.
6. Initially12°C in30°C/RH80% air: condensation, mass gain and latent heating.

Desktop760×330, bounded980px; specimen is separately enlarged1.35×. Phone340×250,208CSS-px stage; all DOM text16px, graph ticks24units. Long details hidden only for phone automatic mode; exploration controls44px targets and readable contrast. Complete phone-player≤740px remains integrator measurement. Curves are memoized per physical configuration, FilmContext only samples histories; no owned timer/audio/worker.
