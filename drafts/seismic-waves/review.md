# Author self-review

2026-10-17. Focused numerical checks cover elastic-wave speed, P before S, distance-dependent gap, displacement direction, compact-support pulse and fluid rejection of S waves. This handoff does not certify browser full playback, independent visual review, recorded voice listening or physical-device performance.

## Independent source review and repair — 2026-10-17

Reviewer: signals_imaging scene owner (did not author this scene). A 41-column particle field used physical x=col/40×distance but display x=38+(width−76)×col/20. Thus the last column reached 1406 in the 760-unit desktop view and 606 in the 360-unit phone view; half the field was outside the viewBox and the tracked middle material point appeared at its far edge. Corrected the display denominator to 40. The gold marker remains col=20, a middle material point, agreeing with narration that tracks a material identity rather than a station. The separate receiver trace still samples x=distance. The authored narration has no inconsistent left/right referent and needs no change.

A source-render regression renders all 8 chapters at three stops and verifies every particle circle remains inside the SVG horizontal field. This is a geometry bound check, not visual playback or physical-device performance evidence.

## Independent responsive source repair — 2026-10-17

Reviewer/repair owner: signals_imaging (independent of original author). Replaced viewport-selected fixed 360/720/760-unit SVG widths with measured content width; SVG units now match CSS pixels. Removed max-height caps that could scale text a second time. Mobile SVG labels are 16px and longer explanatory labels use wrapping HTML. This fixes the calculable 320px case where a 22-unit label was scaled by roughly 246/360 to 15px. No physical-phone measurement or visual playback is claimed by this source change.
