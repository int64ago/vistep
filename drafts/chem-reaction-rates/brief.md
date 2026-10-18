# Reaction rates — four textbook positions

Owner: teaching_subject_fit. Unique scene files only. Frozen handoff transfers ownership to root; shared registry/audio/review remain root tasks.

## Question and direction

Misconception: a larger final gas volume, more bubbles at an arbitrary moment, or any collision proves a faster reaction. Prerequisites: molarity, conservation and a controlled comparison. Track one fixed gas-volume endpoint, then four fixed atom identities. The scene adds the measurement bridge between qualitative test tubes and elementary collision mechanisms.

Separate apparatus views: matched tubes in water baths; fixed-path cloudiness; three catalyst/blank tubes; flask + closed dropping funnel + horizontal gas syringe copied from the supplied textbook's actual p26 figure; volume curves; atom identities; generic reaction-coordinate profiles. No generic dashboard.

Desktop and phone use actual host-width SVG coordinates, not scaled desktop geometry. Two tubes have fixed radii with responsive spacing; three catalyst tubes distribute across the width. The quantitative instrument is one connected vertical composition, independent of the chart chapter. Stage height 332 px plus a wrapping HTML title. Text 16 px; controls 44 px. Browser measurement remains pending.

## Source and evidence

- Required 2 pp43–44: read extracted full pages, peroxide/FeCl3 cold/hot bath and materials for concentration design. Acid/marble quantities in our model are explicitly an added design.
- Required 2 pp57–58: complete activity 7 recipes. Two thiosulfate mixtures have equal final 4 mL; 0.05 and 0.025 M initial concentrations. Catalyst blank + MnO2 + FeCl3, no universal ranking from unequal doses.
- Elective 1 pp26–29: full text read. p26 PDF page31 rendered/viewed at `/tmp/chem-rates-page26.png`: apparatus uses a horizontal gas syringe, not water displacement. 2 g Zn, 40 mL 1 M or 4 M H2SO4, 10 mL endpoint. pp27–29: HI first produces H2 + two iodine radicals, followed by I2.
- RSC Monitoring reactions: https://edu.rsc.org/cpd/monitoring-reactions-teaching-practical-science/3009854.article — gas measurement and zinc/sulfuric acid.
- RSC temperature experiment: https://edu.rsc.org/experiments/the-effect-of-temperature-on-reaction-rate/448.article — controlled turbidity endpoint. RSC uses HCl; our textbook uses H2SO4. Article explicitly separates these.
- IUPAC catalyst https://goldbook.iupac.org/terms/view/C00876 and activation energy https://goldbook.iupac.org/terms/view/A00102 — catalysis and empirical Arrhenius definition. Search retrieval used when direct pages returned 403.

## Chapters and causal changes

0 Equal peroxide/FeCl3, different water-bath temperatures → time-matched gas production.
1 Fixed marble mass/area and acid volume, different HCl concentration → initial rate differs; final acid-limited yield may differ too.
2 Equal final 4 mL, different thiosulfate concentrations → sulfur masks the same added viewing target.
3 Same recipe, different bath temperatures → different cloudiness at the same time.
4 Blank vs MnO2 solid vs FeCl3 in solution → two catalyzed runs differ from blank; illustrative rates intentionally equal, no rank claimed.
5 Elective qualitative design shows diluted and undiluted controls and requires complete condition records.
6 Two successive 1 M/4 M trials drive a connected gas syringe to 10 mL; common endpoint, different elapsed times.
7 Volume curves separate rate from yield; exploration leak fraction partitions produced/collected/escaped gas; real-time input fields remain blank.
8 Same favorable orientation, inadequate vs sufficient energy; original H1/I1/H2/I2 identities survive and form H2, two radicals, then I2.
9 Same energy, wrong vs favorable orientation; unsuccessful collision rebounds without changing bonds.
10 Generic catalytic and uncatalyzed energy profiles share endpoints; barrier differs. Not a measured HI energy surface.

## Independent model assumptions / boundaries

- Peroxide first-order model, 2 mL and density≈1 g/mL, k25 blank=.0005 s^-1, catalyzed=.015 s^-1, Ea35 kJ/mol. Both catalyst cases share one illustrative k; no measured efficiency claim. Nremaining+2NO2=N0. Zero initial peroxide gives zero yield. Late hotter instantaneous rate may fall below cooler rate after depletion.
- Marble 2 mL acid, 1 mmol CaCO3, k=.04*surface s^-1, capped by solid and acid. Eight half-radius spheres preserve volume and double surface. Initial and total yields explicitly distinguished. Bubble movement uses instantaneous modeled production and stops if solid exhausts.
- Turbidity: fixed-acid pseudo-first-order, k25=.035, Ea45 kJ/mol, T=exp(-40cS). Independent threshold ln2/40, concentrations below it never reach T=.5. Optical law and rates are teaching parameters, not collected results.
- Zn: ideal dry gas25C/101.325kPa gives24.4654 L/mol, Zn65.38 g/mol. Both acid supplies exceed Zn demand, final~748mL. k1 calibrated to10mL/30s, k4=4k1 →7.5s: assumption, not experimentally established acid order. Post-addition common baseline ignores mixing, displaced air, vapor, dead volume and piston friction. Small syringe depicts only first10mL; no assertion whole reaction fits it. Leak=1 gives no endpoint but reaction may proceed.
- Collision continuously preserves four atoms at bond-change p=.45. I-I bond appears only on actual center separation=24, touching two radius12 spheres. Two-dimensional deterministic criterion is illustrative. No use of collision energy as measured Arrhenius Ea.
- Watch chooses all its own conditions. Absolute chapter indices [0,2,5,8] remain correct for clipped curriculum variants. Changing any exploration control cannot contaminate watch.

## Checks

Scoped model tests and component reconstruction tests: 8 passing, including ideal gas independent benchmark, material/leak conservation, endpoint/null boundary, low-concentration optical threshold, late-time counterexample, atom continuity and bounds at widths240/320/800, energy endpoints and syringe scale, watch reconstruction after exploration mutation. Actual dual-language Astro MDX compilation, packet dry-run, and scoped TypeScript diagnostics run before freeze. Browser playback, narrow rendering, real-phone performance, audio generation and listening are root integration gaps, not certified by these tests.
