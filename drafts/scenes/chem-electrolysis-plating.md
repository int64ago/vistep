# Electrolysis and copper plating — worker handoff

Owner: teaching_subject_fit. Status: frozen to root after scoped checks. Root owns integration, recorded voices, browser acceptance and release.

## Coverage and direction

Two exact targets are mapped in `drafts/pep-sciences/systems-to-physical-chemistry-mapping.json`: `chem-elective-1-experiment-4-2` (cues 0–3) and `chem-elective-1-activity-4` (cues 4–10). The 11-cue bilingual plan is 198 seconds before speech measurement. Course variants start at the U-tube or iron preparation respectively.

The distinctive objects are the liquid-filled U-tube with actual curved ionic lane, the gas path from the positive carbon surface to moist paper, one iron specimen moving above separate vessel rims, and a connected plating bath with magnified coating section. At 240 px host width, apparatus coordinates are composed around the local center, not scaled from a desktop drawing. Main coating is indicated by surface color; micrometer thickness is only quantitative in the magnified view.

Every chapter introduces a causal change: closing the carbon-electrode circuit; separate electronic and ionic carrier paths; gas arrival before paper response; charge and product benchmark; abrasion/degreasing/rinse; acid rust removal/rinse; correct plating polarity and spacing; balanced copper transfer; reversed iron dissolution; local displacement with an open external circuit; equal-charge deposition across clean versus masked area.

## Evidence and assumptions

Read the supplied elective-1 source at printed pp. 103–111 and 122–123. Experiment 4-2 specifies 25% CuCl₂, carbon electrodes and moist KI–starch paper. Activity 4 specifies abrasion, 1 M NaOH degreasing, rinse, 20% HCl rust removal, another rinse, iron negative/copper positive, 2–3 V, approximately 5 cm spacing and 5–10 minutes. The ammonia option is acknowledged as complex chemistry outside the calculation.

Primary external sources: RSC microscale electrolysis, University of Arizona copper electrolysis, and University of Wisconsin metal displacement (linked in the articles and packet). Wisconsin corroborates the important open-circuit iron/copper-ion displacement counterexample. The chloride paper observation is consistent with chlorine under known conditions and is not claimed to be universally specific.

Independent model uses F = 96485.33212 C/mol, ideal current efficiency, mass conservation and explicit geometry. At 0.20 A for 600 s, 120 C deposits 39.52 mg copper. Plating area 6.7 cm² gives 6.58 μm at density 8.96 g/cm³. Chloride calculation adds 20 g of 25% solution and a carbon rod with radius 0.25 cm and 3 cm immersed length. Plating adds 50 mL at 0.2 M total copper. These are labeled supplementary conditions. Mean current is an input, never inferred from 2.5 V.

Normal plating conserves total bath copper; reversal dissolves iron and consumes bath copper. Open external circuit sets external charge to zero while allowing an explicitly illustrative local cementation rate. Chlorine aqueous/escaped partition is illustrative and does not predict gas volume or pH. The 24-patch surface model conserves deposited mass while redistributing it across unmasked area; it does not predict adhesion or industrial quality. Wire and liquid markers show flow directions, not literal particle counts.

## Completed checks

- Scoped Prettier completed for owned files only.
- Vitest: 9 tests passed (7 model and 2 component).
- Benchmarks cover Faraday yield and chlorine/copper conservation; normal versus reversed plating; local open-circuit displacement; masked-area mass conservation; 1,001-point preparation transfer clearance; 1,001-point U-channel geometry; gas wet/dry geometric boundary; non-finite and zero-current boundaries.
- Component tests reconstruct all 11 chapters after exploration changes and verify activity initial state plus the open-circuit counterexample.
- Owned TypeScript diagnostics: 0.
- Both actual Astro MDX compilation paths succeeded: Chinese code length 4,733; English 7,947.
- Read-only packet validator succeeded: prospective topic 430, 11 planned chapters, no shared files changed.

## Remaining root acceptance

Not performed by this worker: actual browser rendering, full film viewing, narrow-screen caption/player fit, voice generation or listening, physical-phone performance, global verify/build, integration or publication. Source/test/code inspection is not visual acceptance. Check especially the U-tube paper contact, preparation transfer, external wire paths and reversed labels, magnified patch thickness, and all English narrow labels. The observation record is blank and is never used by watch mode.
