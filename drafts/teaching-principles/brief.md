# Teaching collection: from experiments to explanations

The user authorized rebuilding the **whole** teaching collection in reviewed batches, not stopping after the first three demonstrations. Keep textbook order, original titles, page references and stable scene URLs. The tracking source is `rebuild-plan.json`; unreviewed items are not accepted by default.

Each learning entry should carry an observable question, visible evidence, the causal bridge to a principle, and a new prediction. Move apparatus procedures into optional detail when they do not carry the explanation. A well-designed procedure that exposes conservation or a controlled comparison can already be good explanatory content; retain it after reading the actual film. Do not substitute longer speech, more scenes or changed headings for a visible causal argument.

## Batch 1

- `newton-second-law-lab`: balanced push and resistance, velocity gained in equal time, independent force and mass comparisons, coasting and braking, hanging-mass approximation.
- `chem-colloid-light`: rear screens distinguish transmission from visibility; a side blocker tests the route to the eye; driven charge response explains scattering; dilution, color and window light test transfer.
- `bio-osmosis`: individual random motion versus population change; mixing and pressure contribute to water potential; two-way exchange and cell volume; wall-supported turgor; aquaporin and energy-coupled transport comparisons.

The landing page begins with questions. Reviewed textbook entries carry their own question, concise principle and an expandable transfer question with explanation. Textbook titles remain visible. Red-cell and plant-cell routes include the necessary osmotic lead-in instead of showing only their final consequence.

## Review and delivery status

Batch 1 is reviewed for publication, with the listening and physical-device limitations below. Subsequent batches remain active. Shared draft timelines are not acceptance evidence. Replaced narration must be generated and measured, then checked against the actual subshots. Complete-playback telemetry, still-frame inspection, independent transcription, subjective listening and physical-device performance are different evidence types. Available tooling has not provided subjective audio listening or a physical phone; do not mark either passed.

The current work branch is `codex/teaching-principles`. Existing authorization permits publication after review through the repository's normal main/Actions flow. The remaining collection stays in the queue until each scene and its actual textbook playback windows receive a content decision. A first-batch release does not complete the whole request.

## Integration finding

Production CSS combines scene styles. The new Newton cart reused `.newton-trials` and `.newton-trial` from Newton’s tube: the single cart inherited an unrelated two-column grid, making the apparatus small and wrapping its readouts. Rename the cart selectors to `.newton-cart-trials` and `.newton-cart-trial`; inspect the built asset, not only the isolated development component. Final voice timing was separately corrected from measured bilingual speech timestamps; each scene packet records the superseding root revision.

## Collection content audit

All 243 distinct scenes and 626 textbook entries now have a source-content decision in the three `*-content-review.json` files. Decisions come from actual film scripts, rendering/model branches, articles and the selected chapter windows, not titles. There are 157 retain, 79 targeted-revision and 7 core-rebuild decisions after deduplicating the shared DNA scene. These decisions are not new visual, listening or device acceptance. Root owns the shared source/variant corrections queued for batch 2.
