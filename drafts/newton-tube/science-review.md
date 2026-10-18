# Newton tube: independent science and curriculum review

Review owner: `/root/newton_science` (independent of the scene author). Research date: 2026-10-18. This document covers source and model review. It does not certify rendered playback, listening, device performance, or publication.

## Textbook position

Source inspected: the user's local 人教版高中物理·必修第一册 PDF, printed pages 47–48 (PDF pages 52–53), second chapter, section 4, 自由落体运动. The printed demonstration heading is **轻重不同的物体下落快慢的研究**. 牛顿管实验 is a clear scene name and should retain that source heading in the curriculum metadata or article.

Printed page 48 was also rendered and visually inspected: `/tmp/vistep-physics-catalog/newton-tube-source.png`. Figure 2.4-1 shows the same glass tube in the two air conditions and the iron/feather separation, supporting a controlled comparison rather than two unrelated falling-object scenes.

The progression is paper/paper-ball comparison → critique of the heavy-falls-faster intuition → iron sheet and feather in a sealed glass tube with air → the same objects after evacuation → the definition of free fall → timing-tape investigation of its acceleration. Preserve this placement when additional experiments are added. A catalogue of headings alone misses the paper comparison and the controlled-variable argument.

This lesson precedes the fourth chapter's systematic treatment of Newton's laws. Its main film should establish the observation and conditions of free fall; force equations can remain in optional model notes.

## Claims, sources and limits

| Claim                                                                                         | Source and inspected section                                                                                                                                                       | Assumptions and valid range                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| When air resistance is negligible, two objects share gravitational acceleration.              | [NASA Glenn: Motion of Free Falling Object](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/motion-of-free-falling-object/), Free Falling, equations and numerical table. | Near-Earth motion with approximately constant local gravity. Simultaneous arrival additionally requires equal initial height, release time and initial velocity.                                                               |
| The comparison must remove air while retaining the same iron sheet and feather.               | Local textbook, printed page 48, demonstration and explanation.                                                                                                                    | The scene's vacuum is an idealization of a well-evacuated tube; evacuation does not remove gravity or change object mass.                                                                                                      |
| A quadratic drag model gives a useful explanatory approximation.                              | [NASA Glenn: Drag Equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/drag-equation/), Drag, Drag Coefficient and Reference Area.                                   | Use a consistent reference area and coefficient. A real feather's changing orientation, flutter, wall interactions and coefficient variations are excluded; selected parameters are illustrative, not measured apparatus data. |
| The same effect has been observed in an almost airless environment outside a laboratory tube. | [NASA: The Apollo 15 Hammer-Feather Drop](https://science.nasa.gov/resource/the-apollo-15-hammer-feather-drop/), account and Preliminary Science Report excerpt.                   | A qualitative independent observation; lunar gravity differs from Earth's. It cannot calibrate this scene's Earth-based fall time.                                                                                             |

## Recommended independent numerical checks

For downward displacement `y` and downward speed `v`, the illustrative air model is `m dv/dt = mg − kv²`, with `k = ρ Cd A / 2`. From rest its analytic solution is `v = vt tanh(gt/vt)` and `y = (vt²/g) log(cosh(gt/vt))`, where `vt = sqrt(mg/k)`. The zero-density branch should use `v = gt`, `y = gt²/2` directly. The analytic solution is a recommendation to check against, not evidence that the author implemented it correctly.

- Independent benchmark: a 1 m fall from rest at `g = 9.8 m/s²` takes `sqrt(2/9.8) = 0.4517539515 s` and reaches `4.4271887242 m/s`. Both objects must agree in vacuum despite unequal mass.
- Independent solver comparison: compare the implementation with an independently integrated ODE at several air densities and times, before impact. Check position, speed and arrival time separately.
- Boundary counterexample: in air, increasing mass while holding area/coefficient fixed changes the trajectory; a blanket “mass never matters” statement is false outside the free-fall assumptions.
- Boundary limits: density approaching zero converges smoothly to the vacuum trajectory; at time zero, speed and drag are zero; at zero height, the object is already at the floor. Very late times must remain finite and at the floor; impacts may be omitted explicitly but the object must not continue through it.
- Visual time: any slow motion must state the factor, while the physical time readout remains derived from the actual model. Equal model instants must be compared across conditions.

## Review state

Source and curriculum recommendations: **passed**, and communicated to the author and integrator before implementation.

Independent model inspection and numerical comparison: **passed** for `src/models/newton-tube.ts` SHA-256 `a6670d477679d292546965b528db21c18c18c3a376fb882e44efd51507b08508` on source commit `8be5cc71f8154a539f932cb65becf23d78d32c1b` plus the current uncommitted scene work. The implementation uses stable `log(cosh(x))`, an overflow-safe inverse expression for arrival time, an explicit near-vacuum branch and absorbing floor contact.

An independently written RK4 integrator used a 20 μs step, with linear interpolation only for the final arrival event. It checked both registered objects at air densities 0, 0.01, 1.225 and 10 kg/m³, sampling pre-contact position and speed throughout each fall. The largest differences were 5.01 × 10⁻¹² m in position, 4.17 × 10⁻¹² m/s in speed and 7.19 × 10⁻¹¹ s in arrival time. This is numerical verification of the chosen approximation, not validation of feather aerodynamics against measured data.

| 1.4 m drop, g = 9.8 m/s² | Iron sheet arrival | Feather arrival |
| ------------------------ | ------------------ | --------------- |
| Ideal vacuum             | 0.5345224838 s     | 0.5345224838 s  |
| Air, ρ = 1.225 kg/m³     | 0.5395783451 s     | 1.5981898866 s  |

The separate 1 m ballistic benchmark matched 0.4517539515 s for both bodies. At density 10⁻¹⁰ kg/m³, the feather's position at 0.3 s differs from vacuum by 6.23 × 10⁻¹¹ m. Zero height returns contact immediately. The boundary counterexample also holds: doubling the feather mass with fixed area/coefficient shortens its air arrival time from 1.59819 s to 1.17575 s.

Targeted automated check: `pnpm exec vitest run src/models/newton-tube.test.ts` — **passed**, 5 tests, Vitest 5.0.0, Node 24.19.0. Test source SHA-256: `dfee21bc14692ca074b5e3a00a5882d09de8b9fd4b7cec6ebe394a5ff0f091d1`.

The author applied the nonfinite-input recommendation. Source inspection confirms explicit finite guards for mass, area, drag coefficient and gravity. Formatted final model SHA-256: `0d2bf15658aa07765f005885a3b74bf4cfbbf7ed49df796df43af5cb0b4c3cf7`; the analytic formulas are unchanged. Formatted test SHA-256: `8ae1f7271998649a2d7ca4690977ab08fb14282f4c7d6342f5ad18b9080b5b8a`.

Renderer and bilingual article source inspection: **passed**. Initial renderer inspected at SHA-256 `804af95a54148044247bb1efc877d7b27677448d17be4b32b998ea674f044480`; the integration owner then applied the label repair described below.

- Both specimens have a 19-unit half-height. Their common lower-contact release line is y = 76, their floor is y = 304, and both use the same 228-unit displacement map for 1.4 m. The floor position follows directly from the independent model; no final-frame position snap is used.
- The displayed slowdown factor equals the chapter action-window length divided by physical-time duration. Both final-comparison trials use exactly the same physical time. Historical positions are recomputed from the same model at 0.12 s intervals.
- The articles disclose illustrative dimensions, drag parameters, fixed orientation, omitted walls/buoyancy/collisions, and ideal vacuum. Their learning-order sentence was corrected to say the film focuses on the Newton-tube step, rather than claiming it also depicts the preceding paper experiment and following timing-tape experiment. The English definition now explicitly frames this lesson as free fall from rest.
- **Label repair verified:** exploration now has an explicit ordinary-air-density branch displaying “有空气 / With air,” instead of incorrectly labeling it “减少空气 / Reduced air.”
- **Narration refinement verified:** the last Chinese and English cues now identify the ideal-vacuum historical dots before explaining increasing spacing. This makes the intended accelerating-fall evidence explicit.
- Registered NASA Modern Drag Equation URL was checked and supports the implemented formula. The integration owner also added the direct NASA free-fall page to the visible source list, supporting the gravity value and ballistic equations.

## Actual narrow-screen visual sample

**Passed for this still frame only.** The independently inspected image is `/Users/int64ago/workspace/vistep/artifacts/newton-tube/english-320-causal-shot.png`, captured by the integration owner through CUA at a 320 px browser width. It shows English chapter 05 at film time 1:47 of 2:00 and physical time 0.34 s.

Both complete tube drawings remain side by side. The blue iron piece and gold feather keep stable identities across trials. In air, the feather is clearly higher than the iron; in the ideal vacuum, the pair is level. The labels distinguish the conditions, the physical-time readout is legible, and the caption and transport fit without clipping. No misleading contact or object-position discrepancy is visible in this sampled pre-impact state.

The historical position dots are faint at this width. A modest opacity increase was suggested to the integration owner to make the secondary acceleration evidence easier to follow; the main controlled-comparison evidence is already readable. This is a visual refinement, not a numerical-model issue.

Complete rendered playback, all playback controls, impact-state visual review, full bilingual listening, physical-device performance and public delivery: **not run by this reviewer**. The integration owner's ASR result is not used as listening evidence here.
