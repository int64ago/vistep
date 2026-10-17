# Pressure cooker — author production brief

Source package, six24-second draft chapters144s. Browser key shots, full playback, narrow-screen budget, performance, narration and failure QA remain for independent integration review. Model tests are author evidence, not independent acceptance.

## Question and portfolio

Misconceptions: boiling is always100°C, a lid creates heat, higher heater power must keep increasing regulated temperature, gauge pressure alone fixes boiling temperature. Distinct from `latent-heat`: a credible weighted valve links phase equilibrium, forces and open mass/energy. `hydrostatic-pressure` supplies differential-pressure force; `ideal-gas` is only the approximate steam-volume relation, not the saturation law. Prior knowledge: force/area, pressure and latent heat; age12+.

## Actual primary reading and claim ledger

Read [IAPWS-IF97 official release](https://iapws.org/technical-guidance/release/IF97-Rev.download), §8 pp.33–36, Eq29–31/Table34–36: exact saturation relation, coefficients, domain and program-verification points. NIST [steam-table saturation excerpt](https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=906704) retrieved for100/110/120°C pressure and latent-heat values; no claim of reading all its scanned pages. Read Presto [component descriptions](https://www.gopresto.com/content/pressure-cooking/pressure-cooking-how-to-use), regulator/vent/seal/air-vent functions, for credible connected construction; its user operating steps are not reproduced. Read NASA Glenn [Mass Flow Choking](https://www.grc.nasa.gov/www/k-12/airplane/mflchk.html), Eqs10/19 and sonic-flow discussion, for ideal-gas nozzle capacity. It is adapted with steam R461.526, fixedγ1.3 and chosenCd.7, not calibrated manufacturer behaviour.

## Model and explicit simplifications

Start after air removal at ambient-pressure liquid/vapour coexistence; no cold-start trapped-air error. Rigid insulated2L vessel, total water1kg, liquid vl=.001m³/kg, ul=4180T, ideal vapour vg=RT/P, latent heat L=2.2564MJ/kg−2715(T−100)J/kg. hv=ul+L+Pvl; uv=ul+L−P(vg−vl). Phase masses follow fixed total volume exactly. Saturation P(T) is IAPWS, but phase caloric properties and vapour density are explicit approximations around user range90–125°C, not full IAPWS enthalpies.

Closed stage solves U(T,M=1)=Ustart+Q by bisection. At regulated P/T, internal energy is linear in remaining total mass; outflow=Qafter/[hv−(∂U/∂M)T,V]. This includes additional vapour occupying the newly emptied liquid volume; vent rate is slightly lower than evaporation rateQ/L. Ideal valve set pressure is ambient+mg/A with seat radius1mm. Gap comes from required mass flow divided by compressible nozzle flux and seat circumference, including choked/subcritical continuity. Available gap≤r/2 so annular throat never exceeds inlet area across supported corners. Gap is enlarged vertically; no rocking, friction, inertial transients, calibrated valve lift, heat leakage or food kinetics. Model weights are hypothetical variables, not appliance modification instructions.

## Independent verification

Seven tests: official Table35 at300/500/600K and Table36 at.1/1/10MPa; independent NIST120°C≈198.67kPa; differential-force equilibriummg; closed-stage internal-energy input and fixed total mass; regulated full mass/volume and open energyQ=ΔU+mout hv; changing heater300→900W triples flow/lift without changing regulatedP/T; zero input; ambient decrease keeps gauge but lowers absoluteP/T; nozzle zero flow, choked limit, continuous branch crossing; allowed ambient/weight/power corners; invalid phase and power domains. Source values retained at their published precision. User0–900s/0–900W avoids dryout; model rejects absent-phase states rather than inventing further liquid.

## Independent visual direction and chapters

A muted olive/copper laboratory cutaway with thick connected metal lid, gasket segments, liquid surface, headspace and vent tube. Regulator underside follows computed lift; outgoing paths pass through the actual same gap. Pressure and gravity arrows share force magnitudes. Desktop adds an enlarged cut of the same valve; phone uses one larger vessel. Liquid level comes from phase volume. Heat input disappears at0W; no cold-start steam is invented.

1. Open ambient-pressure boiling: heat becomes phase change, not risingT.
2. Seated weighted valve: heat raises saturationP/T before lifting.
3. Pressure-area force reaches weight; continuous surface→tube→gap→exterior path.
4. Same set pressure,300→900W: flow/lift increase, T/P hold.
   5.20→40g hypothetical weight at fixed seat area: higher set differentialP/T.
5. Ambient101.325→70kPa: same gauge pressure, lower absoluteP/T.

Desktop760×300,300CSS-px stage, max-width980; phone340×300,215CSS-px stage and DOM16px labels. Main pressure/force/mass/power readings do not rely on tiny SVG text. Valve cap and path endpoints derive from one lift state; no arrow-character substitute for steam path. Details hidden in automatic phone mode. Complete player≤740px target awaits root measurement. Shared FilmContext clock drives trace progression; no owned timer/audio/Worker. Draft scripts refer to physical objects and quantities, not production self-validation.
