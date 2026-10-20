# Sound interference: add pressures at one receiver

## Root integration — measured Batch 16

Current source is integrated for final verification. The canonical bilingual film is 116 seconds. The final narration, measured director and review are recorded in `../teaching-principles/batch-16-review.json`. Earlier candidate notes below describe the author handoff; their provisional timings and pending states are superseded by the root integration record. Subjective audition and physical-phone performance are not claimed.

## Historical author handoff

Batch 16 isolated candidate only. All proposed product files live in `artifacts/teaching-principles/batch-16-staging/physics/`. No actual product/shared file, recording, deployment or index was changed. Root retains integration, actual measured speech, static routes, global verification and publication.

## Question, evidence and inference

Why can switching on a second coherent speaker make one place quieter? The old scene calculated the spatial pattern but did not show the two contributions adding at that place. Track one receiver and a common clock: two retarded pressure waves produce a sum. A half-wavelength path difference gives opposite phases; unequal 1/r amplitudes leave a residual. Students' local searches map the same computed field. Keep their old positions when frequency changes to test a prediction.

The previous `intensity` value was pressure-phasor magnitude squared. In an opposing-wave field it cannot automatically be called net acoustic intensity. The UI now calls it normalized mean-square pressure. It is not W/m², dB or perceived loudness. The legacy model property remains only as a compatibility alias; consumers in this candidate use `meanSquare`.

## Sources and textbook scope

Read the complete relevant textbook passage, Elective Book 1, P74–78, including superposition, coherent water-wave evidence, the P77 sound activity and adjacent active noise control, and the P78 path-difference silencer exercise. P77/PDF82 was rendered and personally inspected; its two student groups and local listening instructions are preserved. P79 begins a separate Doppler topic; frequency changes here are changes of the common driving frequency, not receiver motion/Doppler shifts.

Downloaded and read the relevant original manufacturer technical guide, Brüel & Kjær _Sound Intensity_ (BR0476), printed pp3–9: pressure, vector energy flux, active/reactive fields, pressure and particle velocity. OpenStax Section16.5 supplies the independent linear-superposition/phase explanation. Links and scope are in the packet; local source evidence is under `checks/sources/`. The textbook supplies a procedure and qualitative evidence, not a table of observed student coordinates. No simulated positions are called actual observations.

## Four retained IDs and the single complete window

The original `e1-sound-interference` entrance still selects all four IDs in their original order, at printed P77. Original lesson title, page and source order are not rewritten.

1. `speakers-common`, planned 26s. One-source steady field (0–4s) versus two-source steady field (4–11s) at the same receiver: adding the second coherent source weakens pressure. Common generator and actually connected speaker leads → two propagation paths. A close-up uses one metre scale and one slowed phase clock; ray endpoints have the same retarded phase as the receiver model. Unit-height waves on the distance strips depict phase, with received amplitudes separately labelled.
2. `speakers-receiver`, planned 34s. Same receiver moves from the bisector to x=.125m; then three same-scale traces show p₁, p₂ and p₁+p₂, one time cursor, nonzero residual. Desktop adds instantaneous signed pressure values; the phone spends its width on the three traces. This is the only replaced spoken pair.
3. `speakers-flags`, retained spoken 26s. Twelve fixed student IDs search their own ±.16m intervals, then raise flags at local extrema. The display explicitly identifies a model search, not measured student data.
4. `speakers-frequency`, planned 30s with unchanged spoken text. Preserve the 680Hz flags and selected quiet point. Ask at 6–13s before changing to340Hz over13–18s. The same location changes from Δr/λ≈−.50 to≈−.25; the old quiet flag now has greater mean-square pressure. Returning to an earlier seek reconstructs the same old positions. Fresh Explore preserves the question until an explicit test or manual intervention.

Chinese and English spoken strings for IDs0,2,3 are byte-identical to the current canonical baseline. Screen titles and captions are revised independently. Planned total116s is provisional; root must measure both old/new recordings and recalibrate local cuts. No TTS or listening claim is made by this candidate.

## Model and geometric contracts

- Sources at x=±2m; sound speed340m/s. pᵢ=Aᵢcos(2πcycles−krᵢ+φᵢ), Aᵢ=1/rᵢ. Sum instantaneously before averaging.
- Midpoint in-phase amplitudes .5+.5 give cycle mean .5; divide all cycle means by this reference. Hence displayed meanSquare=A₁²+A₂²+2A₁A₂cosΔφ. At x=.125,y=0,680Hz the value is (1/2.125−1/1.875)², not zero. At340Hz the cross term vanishes and the value is 1/2.125²+1/1.875².
- Source reversal changes phase byπ, not source identity or distance. Source-off removes only the second contribution. Optional audio uses resulting amplitude, remains opt-in and inherits offscreen/disposal cleanup.
- Twelve immutable old flags retain their680Hz coordinates through every frequency/source control. A visible receiver marker continues to follow x/y controls even with flags visible. No static selected flag is allowed to stand in for a different controlled receiver.
- Pressure traces share scale and clock. The visual acoustic period is deliberately slowed, not realtime680Hz. Separate ray strips share metres and depict phase rather than lossless amplitude propagation. Finite input guards and bounded field allocations are tested; near-source regularization is an excluded-domain guard, not a physical near-field model.
- The model represents steady fields at each chosen frequency, not the transient turn-on process, diffraction, reflections, loudspeaker directivity or a psychophysical loudness scale. Real room results need observation.

## Native candidate review and limits

The candidate harness imports the actual React Showcase and shared CSS/fonts, but supplies candidate captions and the provisional116s film. It is not an actual Astro route, server-rendered lesson anchor or integrated audio test. The initial run exposed bottom label bounds and English captions not registered in the isolated dictionary; those failures remain recorded. Personal review then caught overly close path labels and an absent receiver marker when flags were visible; both were corrected.

Final scoped model/component checks, strict Astro compiler options, MDX compilation, screenshots, true React input events, optional-audio failure handling and muted native clock progression are recorded separately in `review.json`. Author visual review is not independent review. A chemistry peer independently integrated96 parameter cases and checked fixed-point/source-off/reversal invariants, without claiming UI, source transcription or listening acceptance.

The 320×568 complete candidate player reserves space for its longest actual bilingual caption and transport. SVG units track CSS pixels, keeping text16px; all primary controls are44px or larger. Desktop uses extra width for a signed instantaneous-pressure comparison; phone retains only the essential aligned traces. Exploration can scroll vertically and is not claimed to fit every optional slider into a single screen. Actual site headers/fragment navigation, production cover consumers, measured speech, full static playback, subjective listening and physical-phone performance remain root integration work.
