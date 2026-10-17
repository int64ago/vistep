# Kepler orbits — author brief

Misconception: an ellipse is traversed at constant angle or speed, with the Sun at its center. Prerequisite: compare areas and time intervals. Distinction: seasons explains axial tilt and Moon phases explains viewing geometry; this scene connects orbit geometry to its clock.

Art direction: an overhead orbital atlas in deep blue, with one fixed warm focus, a quiet ellipse and two translucent sweep regions. No decorative starfield or unrelated 3D globe. Geometry is the main evidence. HTML readouts retain CSS-pixel typography. Phone keeps one large orbit and two compact measurements; no stacked instruments. A fixed larger coordinate window is used only for the explicit two-size comparison and exploration, covering a=0.6–1.8 and e=0–0.85; there is no per-frame auto-zoom.

| Claim                                                             | Source / model basis                                                                           | Conditions                                                              |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Focus-centered ellipses, equal-time area and period–size relation | [NASA, Kepler's laws sections](https://science.nasa.gov/solar-system/orbits-and-keplers-laws/) | Ideal bound two-body motion with the same central mass                  |
| Arc-bounded area is linear in mean anomaly                        | Derivation from x=a(cos E−e), y=b sin E and one-half integral of x dy−y dx                     | E is unwrapped across periapsis; finite arcs are not endpoint triangles |
| e changes speed contrast, not period at fixed a                   | Kepler equation and vis-viva with μ=4π²                                                        | AU/normalized-solar-year units; no actual ephemeris                     |

The NASA explainer informally refers to triangles; this implementation uses exact arc sectors for finite intervals and checks their numerical polygon area. No triangle equality is asserted.

Independent benchmarks: circular quarter-turn (x=0,y=1,v=2π); e=0.6 peri/apo radii 0.4/1.6 and speed ratio 4; a=4 period 8. Test conservation of specific energy and angular momentum at 101 phases; compare exact sector area against a separate polygon cross-product. Boundary counterexamples: e=1 rejected, e=0 constant speed, negative/multi-turn anomalies, and high e solver residuals through 0.98 (UI limited to 0.85).

Six shots: circular baseline; focus versus center; near/far speed contrast; two synchronously grown equal-time sectors; fixed-a eccentricity change preserving equal fractions; a=1 versus 1.6 with shared elapsed time and T ratio≈2.02. Planned 23-second windows (138 seconds) await measured voices. Scripts name focus/sector, not screen position.

Category `nature`, age 10; related `seasons`, `moon-phases`, `gps`. Suggested backlinks from seasons' distance misconception and GPS's orbit assumptions. Author numerical/source checks only. Desktop/phone keyframes, complete watching, listening, physical-device performance and independent acceptance remain not-run; speech freeze awaits integration review.
