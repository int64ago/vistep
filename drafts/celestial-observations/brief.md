# Celestial evidence: fixed records before a model verdict

This focused batch changes `position-records`, `orbit-residuals`, `uranus-residual` and `neptune-check`. All eight chapter IDs and five textbook windows remain in place. The telescope optical paths and Halley JSX retain their existing geometry; all four spoken cues remain unchanged. Independent review found the legacy moon-record rows moved with progress. The final correction freezes five synthetic snapshots at elapsed days 0–4, reveals only observations already reached, and drives the live view and readout from the same four-day clock. The cover still consumes exported `CelestialArtwork` mode 1; actual cover and social-image consumers have been opened and inspected.

The question is whether a missed position indicts the record, the model or an omitted cause. The reader must see an observation remain fixed when a candidate changes, a hypothesis make a locked prediction, and an unused record be revealed independently. A curve generated from the same candidate cannot serve as confirmation.

The first window uses explicitly synthetic Mars angles. Five rows select starting phase under an identical grid for a circle and specified ellipse. Two fixed rows are reserved. It does not reproduce Tycho's original table, all historical circle/equant hypotheses, the famous 8′, or a unique derivation of Kepler's laws.

The second window uses a fixed synthetic Uranus residual table and a restricted mass/phase grid. A force shot visibly separates the acceleration of Uranus from that of the Sun; its gold relative vector is derived by subtraction, with one fixed arrow scale across candidates. The plot then locks a candidate before revealing three unused records. The residual is heliocentric; it is not a measured 1846 geocentric residual.

The historical chapter clears those axes. Encke's independently transcribed 1846 report first supplies calculated and observed geocentric longitudes at the same epoch. A separate local sky chart uses actual three-night RA/Dec, projected with the cosine of declination and equal angular scales. First two nights support a retrospective classroom extrapolation before the third fixed row appears. It is expressly not Le Verrier's historical inverse calculation.

## Sources and independent benchmarks

- `artifacts/teaching-principles/physics-next-celestial/ready-brief.json`: textbook original passages, primary scans and claim boundaries.
- Kepler 1609 Chapter XIX pp. 113–114, ETH original: https://doi.org/10.3931/e-rara-558
- Encke 1846 AN 25 no. 580 cols. 49–52: https://articles.adsabs.harvard.edu/pdf/1846AN.....25...49E
- Independent Python benchmark uses bisection for Kepler's equation and a separately authored RK4 restricted dynamics implementation. Its fixed outputs are in `benchmark-results.json`; historical rows in `historical-neptune-records.json`.
- The initial ten targeted model tests passed on the calibrated director: fit/holdout references, immutable records, Earth subtraction, wrapped angles, differential gravity, zero mass, step convergence, historical arithmetic, hidden-record timing and finite boundaries. This is model evidence, not visual acceptance.

## Visual and interaction contract

New classes use the globally unused `celestial-evidence-` prefix. SVG coordinates use measured CSS width, preserving 16px labels. A short phone receives a separately bounded plot height, not a reduced desktop SVG. The same gold point IDs persist; hollow predictions appear before reserved records. Every candidate change clears the lock/reveal state. The user can fit only the training rows, lock, reveal and reset; historical controls separately step through real nights.

The packet supplies complete bilingual cues and translations for root integration. Measured total 274 s includes 112 s of unchanged spoken cues. Revised cuts use actual language-specific chapter seconds, including the 0.45 s recording lead-in. Author keyframes, whole-player, real textbook controls and cover checks are recorded separately in `review.json`; root independent static playback and final global verification remain pending. No full listening or physical-device evidence is claimed. Root owns shared metadata, speech, final global checks and independent acceptance.
