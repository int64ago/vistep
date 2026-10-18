# Acid–base titration production brief

Status: frozen to root. Own files: chem-acid-base-titration model/test, ChemAcidBaseTitration component/test, scoped CSS, original Astro cover, bilingual MDX, packet. Mapping adds exact targets chem-elective-1-body-p67 and chem-elective-1-activity-2 (19 entries total in this worker's chemistry mapping).

## Source and scope

Read full textbook pp.65–69,90–93, not just headings. Viewed rendered original p.92 (/tmp/chem-titration-page92.png). Body curve: 0.1000 M NaOH into20.00mL0.1000M HCl. Actual activity:0.1000M HCl into20.00mL unknown NaOH, with base burette aliquot and2drops phenolphthalein, endpoint pink→colorless held30s. Discussion requests the opposite NaOH→HCl curve. These directions remain distinct. Traditional acid glass-stopcock and base rubber/glass-ball valve distinguished; article retains PTFE universal exception.

Primary checks: Purdue burette care/readings and titration, Harper procedure, Boston College partial-drop technique. Purdue burette page has a reversed formula line despite correct surrounding prose; our calculation follows final minus initial and the textbook/Harper example. Partial drop touching inner flask wall and rinsing down verified in BC original lab manual search text and La Salle manual corroboration.

## Film

12 chapters,216s planned. Body chapters0–2; activity3–11. Views: full curve, near-equivalence enlargement, indicator ranges, leak/condition, tip purge, measured base aliquot+2indicator drops, acid addition, partial-drop contact+wash+30s observation, magnified meniscus/read difference, actual separate p69 three-run example, location-dependent errors, reverse requested curve. Long limits/real-record forms are explore-only. Watch ignores exploration. Own fields initially blank; no illustrative value injected into them.

Actual-width min240 max640 SVG; 16px text,44px controls. Gentle glass/mineral/sage/pink, no numeric card scaffold. White paper under flask. Meniscus curvature and scale descent match final-minus-initial. Partial-drop geometry explicitly raises and shifts the flask to bring its left inner lip to the tip. After contact, acid remains on the wall until wash; a connected wash-bottle nozzle enters the neck and stream reaches the liquid. Main apparatus is schematically compressed; dedicated meniscus view magnifies the scale.

## Models

Ideal25C strong acid/base charge balance with water, stable near-equivalence quadratic. Independent stoichiometric benchmarks and opposite-direction pH sum14. Phenolphthalein8.2–10 and methyl-orange3.1–4.4 visual interpolation; numerical threshold volumes not equated with exact20mL equivalence. Ignore indicator trace amount/slow high-base fading and real mixing/heating/CO2 effects.

Half-drop0.025mL, wash2mL: formed = hanging + wall + bulk, only bulk changes neutralization; delivered reading can precede bulk arrival. Lip/tip contact atp.28 is geometrically exact. Final pH7 and30s clock reach beforep.95 (not solelyp1); clock explicitly time-compressed. Flask volume follows the actual drawn rounded-base/tapered radius profile, analytic solid-of-revolution integral, normalized50mL at60units height; small fills remain in the rounded bottom instead of creating an inverted liquid polygon. Not a calibrated commercial flask.

Separate errors:1mLwater in50mLstandard givesactual0.098M→inferred0.1020408M;5mLflaskwater leaves equivalence20mL;1mLextra0.1M analyte givesinferred0.105M;initial0.2mLtipbubble givesinferred0.101M. Three rinse cycles each5mL with0.5mLretained film decrease water geometrically. Actual textbook p69 data retained: HCl0.1032M / NaOH25mL / volumes27.84,27.83,27.85 / mean0.11492352M, visibly separate from actual activity and blank own records.

## Validation and remaining acceptance

8 scoped tests passed:6model/2component. Independent charge/stoichiometry/water benchmark, indicator thresholds, partial-drop mass and contact, error direction, reading/blank-record/data benchmark, independent numerical integration of drawn flask geometry,12watch views reconstruction afterexplorechanges, curriculum directvariant,late endpoint. Scoped TS0owned diagnostics. Actual Astro MDX compiled both languages5907/9600chars. Readonly packet integrator420/12chapters, no shared writes.

No browser rendering/screenshots, full playback, generated voice timing, listening, global verify/build, commits or deployment claimed. Root owns integration and these final acceptance checks. Frozen files are returned to root and will not be modified by worker without explicit return.
