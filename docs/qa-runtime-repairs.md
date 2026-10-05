# Runtime repairs — 2026-10-05

[简体中文](zh-CN/qa-runtime-repairs.md) · [Architecture](architecture.md) · [Production lessons](retrospective.md)

This record covers the focused repair checkpoint based on `7572018`, before the later authorized commit and push. It is not a new acceptance review of all 74 films. No narration recordings, scripts, timelines or topic registrations changed. At this checkpoint, no commit, push or deployment had been made.

## Repairs

- Narration failures release failed Blob URLs and outstanding requests. A user retry fetches the original asset again with cache reload and seeks to the latest silent-film time. Late fetches, media events and play failures from a disposed track cannot affect its replacement.
- Shared simulation and Three.js render loops cancel scheduled animation frames while offscreen or in the background. Returning starts with a zero delta, without integrating hidden time. Three.js keeps the existing visible-frame pacing and runtime fallback.
- The printer's Three.js canvas inherits `pan-y` while watching and `none` during exploration. Noise and traffic stop continuous drawing when manually paused, but redraw after parameter, selection, reset, resize and film-seek changes. Reduced motion initially pauses their optional manual animation.
- Excavator oil-flow animation pauses offscreen and in the background without resetting its dash positions. Transformer manual training suspends with its remaining steps and optimizer state intact; stop, reset and film mode cancel the old task.
- Cell ownership uses `Uint16Array`, preserving IDs above 255 in a valid 405-cell layout. A shared scheduler debounces each subscription, merges identical inputs and allows one Worker calculation in flight. Superseded pending work is removed. Worker failure uses cancellable generator batches rather than synchronous main-thread queue draining.
- Main-thread cellular results and model route results each have a 24 MiB cache-cost budget with LRU eviction. This bounds accounted result data, not total browser heap. The final hook owner releases the Worker, listeners, timers and main-thread cache. The local fallback checks its approximate 6 ms yield budget after each segment; this is not a measured frame-time guarantee.
- The 404 header's English link goes to the English homepage. Noindex pages omit language-alternate metadata, and the build audit also checks internal links and assets in `404.html`.
- Vitest collects source and script tests explicitly and limits execution to four workers. Ignored rendering artifacts no longer enter the suite; source tests retain their assertions and timeouts.

## Automated evidence

`pnpm verify` passed: formatting, documentation links, 567 type-checked files with zero errors and zero warnings (85 hints), **141 test files / 1194 tests**, production build, and the audit of **151 canonical bilingual pages plus 404**. The first integrated type check exposed one new test's untyped props spread; it was replaced with explicit component props before the passing run.

`pnpm build:preview` passed separately, including preview indexing and local-link audits. Final documentation formatting/link checks and `git diff --check` passed after adding this record.

New regressions exercise corrupted-media retry and disposal, StrictMode and stale RAF callbacks, oil-flow positions, paused canvas redraw, suspended training versus an uninterrupted 50-step reference, high cell IDs against independent RSRP calculations, scheduler cancellation/failure/ownership, cache eviction, and actual transferable buffers. Audio, lifecycle, cellular and shared-runtime changes also received cross-author source review. Renderer and browser-event mocks remain controlled tests, not GPU or physical-device evidence.

## Browser observations

Local Astro development server, Codex in-app browser, **390 × 844 viewport override**:

| View                                       | Observed result                                                                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Printer, paused at 60 s                    | Scene renders; canvas computed touch action changes from `pan-y` to `none` when entering exploration.                                                              |
| Noise, paused at 60 s, exploration         | Changing phase from 180° to 0° immediately redraws the summed wave and changes residual from 0% to 200% (2.00, +6 dB). The separate pure-tone control remains off. |
| Cell handover, paused at 60 s, exploration | Scene and route chart render. Consecutive shadow-strength inputs settle at the latest 2 dB value with updated result readouts.                                     |
| 404 header                                 | Clicking EN reaches `/en/` and the English homepage.                                                                                                               |

No captured error-level console entries appeared in the inspected printer, noise or cellular views. These observations establish the stated states only. Temporary language and viewport overrides were restored and the test tab was closed; the existing development server was left running.

## Evidence still outstanding

This repair pass did not continuously watch all films, listen to complete Chinese and English tracks, measure physical-phone performance, execute physical touch gestures, or inject corrupt audio/network failures in a real browser. Reduced motion, navigation races, hidden-tab scheduling, Worker fallback and media failures have controlled regression evidence; they do not acquire real-device evidence from those tests. The cellular film's synchronous initialization was outside this repair scope. No scene is marked fully accepted from this record.

## CI follow-up after the authorized push

The push of `82c714d` triggered [Actions run 37312292413](https://github.com/int64ago/vistep/actions/runs/37312292413). Verification passed 1193 tests but the existing tidal projection test took 5509 ms, exceeding the default 5000 ms timeout. Production deployment was skipped.

That test originally combined two viewport layouts, eight chapters and three phases into one case. It now uses 16 independent viewport/chapter cases, preserving all 48 states, every vertex and all six projection assertions. The default timeout, numerical tolerances, production model and rendered content are unchanged. This is test granularity, not evidence of improved product performance. The suite now contains 1209 tests; follow-up integrated verification and preview build passed locally before the next push.
