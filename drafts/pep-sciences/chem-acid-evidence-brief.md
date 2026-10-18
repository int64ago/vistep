# Weak-acid evidence production brief

Status: frozen to root for integration and actual browser/audio acceptance. Files: chem-acid-evidence model/test, ChemAcidEvidence component/test, scoped CSS, model-derived Astro cover, bilingual MDX, scene packet. Mapping uses the three exact target IDs in systems-to-physical-chemistry-mapping.json.

## Scope and full-text source

PEP Chemistry Elective 1 pp.58–62 read in full; original printed p.61 was rendered and viewed at /tmp/chem-acid-page61.png. Experiment 3-1 compares equal 0.1 M acids by pH, conductivity and equal Mg. The 2 mL / 5 mg quantitative design is an explicitly added teaching choice. Experiment 3-2 adds 1 M sodium carbonate to 2 mL 1 M acetic acid. The body experiment uses 0.05 g Mg and 2 mL 2 M acid in each pressure flask. Textbook Ka = 1.75e-5 at 25 C.

The p.61 graph has a rapid hydrochloric curve and an initially accelerating acetic curve, with similar endpoints. No raw points, headspace or temperature trace are supplied. The parametric curve is prominently a qualitative reconstruction, not an inferred mechanism or digitized experimental dataset. Further ionization explains capacity supply but does not derive acceleration. Sources checked: RSC acidic reactions of ethanoic acid (different concentrations), Purdue weak-acid pH, conductance-measurement primary technical article (search text retrieved; direct access restricted).

## Film and representation

8 chapters, planned 144 s. Experiment 3-1 chapters 0–3; experiment 3-2 chapter 4; pressure body experiment chapters 5–7. Every curriculum window uses exact sceneVariant key and absolute chapter index. Watch reconstructs canonical states independently of explore inputs. Blank student record remains blank.

Actual-width SVG min 240, host max 640. Separate views for electrode beakers, ionized-fraction strip, carbonate addition, sealed injection, pressure plot and total capacity. All figure text >=16 px and controls >=44 px. Thin glass / restrained sage and mineral colors. Probes enter fluid; AC electrodes connect to source; syringe fluid travels down a needle and into the flask; pressure tubes connect to gas space. Model changes fluid volume, Mg remaining and sensor response together. Carbonate gas follows delivered drops; pressure curves keep data and explanatory reconstruction distinct.

## Models and boundary verification

Ideal acid/water charge balance; independent weak-acid quadratic benchmark. Conductivity uses limiting ionic values and fixed 0.1 V / 1 cm^-1 cell; not a calibrated 0.1 M conductivity prediction. Qualitative Mg timing is empirical. Pressure uses 25 C ideal gas, default final headspace 100 mL. Acid supplies 4 mmol H equivalents, so maximal H2 is 2 mmol; Mg initial 2.057 mmol leaves 1.39 mg (not zero). 2 mmol in 100 mL gives 49.579 kPa. Injection tracks 2 mL total liquid and 102 mL initial air, separates air compression from gas production. Later curves use post-injection baseline. A continuous leak fraction conserves produced = retained + lost gas. Carbonate tracks delivered carbon, acid equivalents and volume; ignores detailed bicarbonate/CO2 dissolution equilibria and caps gas at available acid capacity.

Scoped validation: 8 tests passed (6 model + 2 component). Includes weak-acid benchmark, pure-water boundary, dilution fraction/concentration reversal, conductivity nonuniversal ordering, Mg/H/gas/charge conservation, headspace inverse scaling, S-shape ordering, carbonate saturation, injection liquid/volume conservation, all 8 watch chapters independent of exploration, direct variant and late endpoint. Scoped TypeScript: 0 owned diagnostics. Actual Astro MDX compiled both languages (5307 / 8627 chars). Packet readonly integration: topic 416, 8 planned chapters, no shared writes.

Not claimed: real browser rendering, 320px screenshots, complete playback, generated narration timing, human listening, or global verify/build. Root owns those acceptance steps. No shared registrations, voices, global builds, commits or deployment performed here.
