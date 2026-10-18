# Competition, predation and communities

Owner bio-systems; elective2-014-1,015-1,025-1. Full textbook pp14–17,24–27 read. Nine chapters/198s. Primary sources: Gause1934 data digitized by gauseR authors (2020), Krebs1995 factorial field study, Stenseth1997 discussion of historical record methods, Paine1966 removal study (original PDF at https://faculty.fiu.edu/~trexlerj/Advanced_Ecology/Paine_1966.pdf read). No user PDFs redistributed.

## Data provenance and distinctions

`bio-community-interactions-data.ts` includes63 rows from author repository `adamtclark/gauseR/data/gause_1934_science_f02_03.rda`, read with temporary Python rdata in /tmp (no project dependency). Values are digitized relative size-standardized VOLUME, not cell counts. Mixture P.caudatum at day24=34.58013663 is preserved; it differs from the textbook’s schematic summary of eventual disappearance. Separate model curves are explicitly illustrative, not fitted raw observations.

Supplementary91-year historical series comes from maintainer repository `jarioksa/ecostudy/data/lynxhare.rda`, metadata credits Stevens2009. This is NOT a numerical transcription of the textbook figure and uses different magnitude/coverage. Display each species normalized to its own maximum, label supplementary historical records rather than census. Stenseth1997 notes fur-return versus questionnaire methods in historical hare records, so avoid blanket claims that all series are direct counts or all years identically sampled. Exact record years retained, manual lag alignment/correlation is descriptive only.

Krebs1995 crossed food with mammalian predator reduction in1km² areas: phase-average density ratios1,2,3,11. Additive null would1+(2−1)+(3−1)=4, not11. Mammalian fences did not exclude raptors, hares could cross, combined treatment did not stop decline. No claim that changing toggles instantly multiplies real density.

Paine1966 experimental removal used roughly8×2m shoreline with adjacent retained-star control. Source describes barnacle recruitment then replacement by mussels; microscopic occupancy display is a normalized teaching reconstruction, not exact field geography or measurements. Single limited substrate area conserved with barnacle recruitment6*b*empty and mussel expansion/displacement .65*m*(empty+b+l+c). Limpet/chiton occupied fractions decline through displacement. Control is a held reference baseline rather than a fitted prediction.96 equal-area sample tiles render species occupancy (NOT animal individuals); old and incoming occupants separate in crossfade. Removing star travels continuously out of fixed map. Percentages labeled model, no fabricated measured richness.

## Models and tests

Competition RK4 converges to independent logistic analytic values at overlap0. Strong overlap suppresses caudatum; initial values and parameters declared. Historical numerical fixtures/record range/normalization preserved. Factorial ratios tested. Shore fractions nonnegative and sum1 for101 states, barnacle early share>0.6 and late mussel>0.9, fixed substrate identities and spatial coordinates retained. Watch/explore reconstruction test for all9 chapters.

## Layout / acceptance

Historical records use graphs because the target is evidence analysis, not a substitute for spatial sampling. Sea-star intervention uses an original rocky occupancy view; causal food-web view and factorial view separate.16px at measuredSVG width; controls44px; stage300–315px. Parent/root still owns actual continuous playback,320px fullplayer frames, audio/listening, failures, physical-device performance,global checks and release. Author scopedtests and packetvalidation are not visual acceptance.
