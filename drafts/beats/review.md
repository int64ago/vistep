# Author self-review

2026-10-17 source handoff. Focused tests cover superposition, constructive/destructive phase, unequal-amplitude bounds and deterministic chapter seeking. Full browser playback, speech listening and physical-phone performance remain integration acceptance work. No independent visual review claimed.

## Independent responsive source repair — 2026-10-17

Reviewer/repair owner: signals_imaging (independent of original author). Replaced viewport-selected fixed 360/720/760-unit SVG widths with measured content width; SVG units now match CSS pixels. Removed max-height caps that could scale text a second time. Mobile SVG labels are 16px and longer explanatory labels use wrapping HTML. This fixes the calculable 320px case where a 22-unit label was scaled by roughly 246/360 to 15px. No physical-phone measurement or visual playback is claimed by this source change.

Single-source opening now reports zero observable beats when the second source amplitude is zero. Empty early-score height is reduced before the second signal and sum appear.

## Independent 320 px still review and repair — 2026-10-17

Reviewer/repair owner: information_systems (independent of original author). Actual English 320 px chapter stills showed that the sum waveform crossed “Sum · 50 ms” and the upper envelope crossed “Slow envelope · 2.5 seconds”; the two full-amplitude bands also intersected. Confirming frames were `artifacts/twenty-scenes/stills/beats-en-320-3-stage.png` and `beats-en-320-6-stage.png`.

Repair keeps the model, script and 16px mobile labels unchanged. All component, sum and envelope plots now share 20 CSS px per normalized pressure unit. The sum occupies y=232..312 and its title baseline is 220; the envelope occupies y=354..434 and its title baseline is 342. The two title bands and complete amplitude boundaries are disjoint. The full plot grows only from 430 to 450 CSS px. The current-time guide has separate line segments inside the three fast-wave bands rather than running through label bands.

The single-source opening hid B but still displayed a relative phase of 180 degrees. The phase readout is now conditional on showB; no new copy was added. Existing geometry/model tests and a static render check are recorded with the handoff. Rebuilt browser stills and continuous playback remain for the integrator; these source edits do not establish that reinspection.
