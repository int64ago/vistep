# Suspension: keep the ink, change the evidence

Status: principle-first batch 4 implementation; author visual/control checks are distinct from root acceptance, measured speech and final static review.

The misconception is that rotating a lamina changes its centre, or that its geometric centre remains the combined centre after loading. The tracked object is one rigid board with permanent material-coordinate ink. The decisive evidence is a second independently observed vertical, followed by a loading prediction and two fresh records. SVG preserves the planar mark/vertical distinction; the board has a thin edge, pin, holes, a contacting clamp and a separate plumb bob.

The original four chapter IDs (`settle`, `first`, `second`, `triangle`) and P58 textbook entry remain intact. P61's triangular-card exercise supplies the median prediction, without changing the registered primary page. All statements needed for the entry question and transfer answer occur inside its four-chapter window. No new shared registrations are owned by this worker.

## Causal direction

1. A visible clamp holds an offset board. The weight line and perpendicular lever arm are visible. Release causes nonlinear damped rotation; the lever arm changes sign through overshoot. Only stable rest gets the upward static support arrow. A turning point is not called equilibrium.
2. Transfer the world vertical into permanent ink. Three candidate positions keep the one-line ambiguity visible; do not reveal the calculated centre as a measurement.
3. Rehang with the original ink intact. The board turns while the plumb stays vertical. A second observed line gives an intersection. The shape and mass distribution did not change.
4. Predict the uniform triangle's centre from medians before adding independent marks. Clamp before loading. At three-quarters board mass, leave the question open without a new centre or weight arrow. Then reveal a hollow mass-weighted prediction, release, record, rehang and record again. The new blue intersection moves; all old material marks remain unchanged.

Prediction at chapter-3 progress .34–.43 intentionally hides the new point. Progress .43–.48 identifies a hollow prediction explicitly; the weight arrow starts with release at .48. These are provisional cuts pending actual bilingual word times. The speech packet contains the complete scripts, captions and mapping.

## Scientific contract

Uniform polygon lamina; uniform gravity; fixed freely rotating pin; added disc represented as a point mass. Board mass is 0.10 kg and each material unit is 0.003 m. Polygon integrals supply centroid and central second moment; the parallel-axis theorem gives pin inertia. Clockwise-positive gravity torque is total mass × g × signed horizontal centre offset. Nonlinear RK4 integrates `I θ″ = τg − 2γIθ′`, with γ in s⁻¹. Geometry, velocity, lever arm, torque and readouts share this state. No dynamic claim that support equals weight is made.

Records inverse-transform the observed vertical at a settled simulated pose; their function does not receive a centre. Immutable endpoints retain identity when loading changes. Intersections use the records, while area integrals and mass weighting supply a separate predicted centre. These are model-generated observations, not real measurements. Zero damping, unstable above-pin equilibrium, neutral central-pivot motion, overdamping, coincident/parallel/zero-length/nonfinite records are explicit boundaries.

Independent preparation evidence: `artifacts/teaching-principles/physics-next-suspension/benchmark.py` and its results use a right-triangle exact benchmark, separate midpoint-grid polygon integration and a separate nonlinear integrator. The 15 production tests actually execute against the implementation. The right-triangle pivot second moment is 0.075 m², with centroid (0.2, 0.1) m. Loading the scene's triangle by 0.75 board mass predicts (22.5238095, 19.0476190) material units, three sevenths toward the added mass.

## Composition and review

The desktop has one larger board and a short mark/lever-arm legend. Phone uses a separate coordinate layout, a 200 px watch drawing and one 16 px local cue, with geometry scaled independently of labels. The triangle gets its own fixed scale; it is not continuously reframed as it moves. Exploration has a taller drawing to include every hole/load release pose. The unique CSS prefix is `suspension-cg-` throughout.

Actual browser runs use dev4325 with narration manually off and reduced motion, both languages, 320×568, 390×844 and 1100×900. The full player includes captions, transport and chapter selector. The initial review's top82 framing exposed excess height; short cues and recomposition fixed it. Subsequent reviews use actual top16 framing because the site header scrolls away, and also record conservative bottom-at82 values. Model checks, DOM geometry, paused keyframes, real control actions, complete playback, listening and physical-device performance remain separate evidence types.

Control geometry must transform actual polygon vertices with `getScreenCTM`; `getBoundingClientRect` on a rotated polygon transforms its entire local bounding rectangle and can falsely report protruding corners that are not on the object. Initial false reports are retained rather than overwritten. Record/clear, all holes, two shapes, loading endpoints, release/settled endpoints, zero damping, keyboard time and watch/explore persistence are exercised with actual UI actions.

## Sources

- Local PEP Physics Required Book 1, printed P58 and P61; prepared excerpts and personally viewed P58 image in `artifacts/teaching-principles/physics-next-suspension/`.
- [OpenStax, physical pendulums](https://openstax.org/books/university-physics-volume-1/pages/15-4-pendulums): gravity torque and inertia; the implementation retains nonlinear sine instead of extrapolating the small-angle formula.
- [OpenStax, static equilibrium](https://openstax.org/books/university-physics-volume-1/pages/12-1-conditions-for-static-equilibrium): force and torque equilibrium.
- [OpenStax, centre of mass](https://openstax.org/books/university-physics-volume-1/pages/9-6-center-of-mass): mass-weighted position.
- [OpenStax, stability](https://openstax.org/books/college-physics/pages/9-3-stability): stable, unstable and neutral cases.

Root owns shared integrations, new speech, independent acceptance, complete global checks, static build and publication. No worker build, audio generation, staging or commit is performed.

## Measured speech calibration

Root generated 149.5 s tracks: ZH `b1d326b37d4a`, EN `a60530b2a6d8`, with chapter starts 0/34/62.5/99.5. All eight independent word-time files were read. `suspensionTimedShot` now uses actual chapter seconds and locale; the earlier normalized fractions are causal phases, not the recording clock. Initial release is ZH9.25s/EN11.10s. Second records are ZH12.73–15.47s/EN12.69–14.27s. The loading question hides the new answer, a direction-only segment appears at ZH21.4s/EN20.0s, and the predicted hollow point follows at ZH25.65s/EN22.1s. Release occurs at ZH29.55s/EN27.8s; the new two-line intersection is visible at ZH36.6s/EN35.5s. Motion follows the same nonlinear trajectory with deliberate observation-time remapping so overshoot remains visible during its spoken explanation. No recording or shared source was edited by this worker.

The final affected run (`suspension-review-06`) contains108 actual silent paused frames, both languages and three viewports; source hashes remained fixed. Eight representative images were opened for author visual inspection, separately from automated geometry and predicted-point visibility checks.18 model tests and scoped TypeScript passed. Complete continuous playback, subjective listening and physical-phone performance remain separate root acceptance work.
