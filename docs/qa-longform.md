# Long-form explanation review

[简体中文](zh-CN/qa-longform.md) · [Documentation](README.md)

Historical record: this review covers the original twelve scenes' September 2026 revision to directed chapters, narration, language selection and search metadata. Its counts, timings and checks describe that source snapshot, not the later 62-scene collection. See the [expansion record](expansion-50.md) for the later release and its review limits.

## What changed

In the reviewed snapshot, the original twelve demonstrations have 12 chapters, except the Transformer explanation, which has 14. Each chapter pairs a visual observation with bilingual captions and a recorded cue. Generated timings are measured from both audio tracks and constrained to 120–300 seconds. The reviewed durations range from roughly three to four minutes.

The visual revision includes printer surface magnification; gearing and pedal-force comparisons; pendulum force and energy views; refrigeration heat balance; cancellation phase, amplitude and delay experiments; satellite geometry comparisons; request-stage playback; JPEG reconstruction errors, chroma samples and coefficient scanning; spatial projections and slices; actual model gradients and weight updates; repeatable elevator journeys; and traffic-density and headway comparisons.

## Automated evidence

The reviewed local run passed 45 tests across eight files, type checking of 88 source files, both builds and their artifact audits. All 292 Chinese/English spoken chapters passed independent language and transcript checks. The speech report contains per-cue scores rather than a claim of perfect transcription.

- Type checking, model tests and content contracts cover chapter boundaries, bilingual labels, deterministic backward seeking, conservation and geometry invariants, JPEG coefficients, optimizer updates and frozen inference.
- Every recorded chapter is independently transcribed without a supplied language or reference transcript. A failed language or text-similarity check blocks the audio audit. The report is local because running this optional audit requires authenticated speech-recognition service access.
- Build checks cover canonical routes, reciprocal language alternatives, the generated sitemap, structured data, transcript anchors, referenced assets and 1200 × 630 PNG share images.
- Documentation checks cover relative links and scene instructions. Production and preview outputs are audited separately.

The exact test output and speech report belong to the reviewed working tree. Successful MP3 decoding is not evidence of intelligibility. Speech recognition supports pronunciation/content review but does not establish naturalness or listening comfort.

## Browser review

Review is performed against the built site in Chrome, with desktop and narrow viewport layouts. Checks include chapter seeking, start/middle/end frames, mobile composition, caption alignment, playback controls and language switching. Findings and fixes include:

- Paused chapter seeking previously left three-dimensional covers and cameras in their initial positions. Presentation state now settles when seeking while simulation values remain tied to the selected time.
- The printer detail panel overlapped its main view on a phone. Positive spacing now separates the views.
- JPEG detail panels used overly small labels on phones. Their narrow layout now places the third image below the first pair.

The narrow sweep opened all twelve Chinese experiments at 320 px and verified their requested chapter, absence of horizontal page overflow, 16 px captions and at least 44 px primary player controls. A separate 1440 px sweep opened the final chapter of all twelve English experiments without browser warnings or errors. Representative still frames were also examined at 390 px.

Chinese printer playback ran continuously from 0 to 181 seconds. Its audio and visual clocks ended together. Switching to English loaded the English track. Manual English selection survived a return to the neutral root; an explicit `?lang=zh` selected Chinese. The 320 px homepage retained its complete brand phrase without horizontal overflow. A 2D spatial view released its canvas and responded to an arrow-key angle change from 25 to 26 degrees.

All 146 chapter buttons were subsequently exercised in alternating forward/backward order through the visible player, pausing after each jump. Every requested chapter matched the displayed chapter, with no browser warnings or errors. English JPEG playback reached 201.5 seconds continuously and stopped with matching media and visual clocks. After replay, moving the entire film out of view paused its audio at 15.19 seconds; returning to the film resumed from that position.

## Scope of evidence

A viewport override does not certify physical-device performance. Automated transcription is separate from a person listening to both full recordings. Sampled frames are separate from continuously watching a full film. Reduced-motion preferences, unavailable WebGL, blocked audio and storage restrictions must remain explicit review cases. Do not replace unperformed checks with a general claim that all visual or audio quality is verified.
