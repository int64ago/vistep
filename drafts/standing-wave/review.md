# Author self-review

2026-10-17 source handoff. Numerical tests cover exact endpoint cancellation, stationary nodes, component superposition, harmonic scaling and energy conservation. Browser complete playback, rendered labels, speech listening and physical-device performance are not certified by this source review. Integration acceptance remains required.

## Independent responsive source repair — 2026-10-17

Reviewer/repair owner: signals_imaging (independent of original author). Replaced viewport-selected fixed 360/720/760-unit SVG widths with measured content width; SVG units now match CSS pixels. Removed max-height caps that could scale text a second time. Mobile SVG labels are 16px and longer explanatory labels use wrapping HTML. This fixes the calculable 320px case where a 22-unit label was scaled by roughly 246/360 to 15px. No physical-phone measurement or visual playback is claimed by this source change.
