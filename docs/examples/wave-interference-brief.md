# Wave interference: a string can be straight and still carry energy

[简体中文](../zh-CN/examples/wave-interference-brief.md)

Current recording revision (2026-09-06): both tracks run **179.5 seconds**. See [the refinement record](../qa-expansion-refinements.md) for the updated windows and review limits. Earlier recording names, timings and review results below describe the preceding version.

## Direction

The tracked object is a gold material marker, P. The initial intuition to challenge is that canceled displacement means vanished waves or energy. A midnight-blue string installation uses pale solid displacement, blue/coral component curves, physical material dots, and restrained velocity arrows. It is deliberately different from the aperture and phasor optics of diffraction. There are no particle paths or decorative wave sources.

The initial storyboard allotted 176 seconds in eight 22-second windows; physical time is slowed deliberately, and phase/amplitude changes explicitly compare different inputs. Playback and seeking use the shared chapter/progress director. Every state is evaluated analytically without previous-frame state.

| Chapter                 | Visible causal change                                                                                                          | Evidence and phone focus                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| 0 · Follow the material | Two compact pulses approach; P begins moving while its horizontal coordinate remains fixed.                                    | Full encounter window and the complete time trace at P.                                           |
| 1 · Cancellation        | Opposite pulse profiles approach exact alignment; their pointwise sum becomes exactly zero.                                    | Shorter labeled string window and the three displacement columns at P.                            |
| 2 · Energy              | Hold the straight string with nonzero velocity arrows, then advance until shape reappears.                                     | String plus kinetic/potential density; defer duplicate time/displacement readouts.                |
| 3 · Passage             | Pulses separate with their original shapes and directions; P returns to rest.                                                  | Full encounter window and point trace.                                                            |
| 4 · Phase               | Fixed equal amplitudes, co-propagating waves; phase difference sweeps 0–180°.                                                  | Phone replaces the long string with the same-point sum and amplitude-versus-phase curve.          |
| 5 · Amplitude           | Keep opposite phase and reduce the second amplitude to one half, leaving a 2 mm resultant.                                     | Same-point evidence, with the changed input stated explicitly.                                    |
| 6 · Formation           | Two smooth finite-front wave trains enter from opposite sides and establish an overlapping standing field.                     | Actual propagating fronts and contributions at P, not an opacity reveal.                          |
| 7 · Nodes               | The fully established field traverses half a physical period; stationary nodes coexist with changing kinetic/potential energy. | One wavelength on the phone; node rings, velocity arrows, linear energy density and window total. |

## Independent model

`src/models/wave-interference.ts` solves the linear lossless string analytically. Tension is 1 N, linear density 0.01 kg/m, speed 10 m/s, individual amplitude 4 mm, compact pulse half-width 0.4 m, and harmonic wavelength 1.6 m. Pulse shape is cos⁴ inside its compact support, zero outside, with C3 joins. Wave-train envelopes use a traveling quintic smoothstep, with analytic product-rule derivatives. Their completed field matches the standing-wave shot exactly.

The model returns displacement, spatial/time first and second derivatives, mixed derivative, kinetic/potential density, and signed instantaneous energy flux. Energy is computed from derivatives of the summed displacement. A bounded trapezoidal integral covers the 3.2 m observation window. Contained pulses have constant window energy; entering trains satisfy the boundary-flux balance. A single pulse has analytic energy 5π²TA²/(16w), approximately 0.12337 mJ. Two equal pulses retain approximately 0.24674 mJ, including exact cancellation.

Equal counterpropagating harmonics give 2A sin(kx) cos(ωt), nodes at nλ/2, and antinodes midway between them. Unequal amplitudes remove permanent nodes and the renderer removes their rings. Mean standing-wave flux is zero; instantaneous local flux generally is not. Phase/amplitude controls compare separately specified inputs and do not purport to conserve energy across those changes.

Limits: constant tension, small slopes, no damping, dispersion, longitudinal motion or fixed-end reflection. Displayed vertical displacement is enlarged; physical slopes are not screen angles. Material dots do not add discrete masses. The string continues outside the observation window. Arrows are derivatives/energy flux, not material trajectories. Energy graphs use linear scales.

Primary sources: [Caltech I–49](https://www.feynmanlectures.caltech.edu/I_49.html), [UT Austin energy conservation](https://farside.ph.utexas.edu/teaching/315/Waveshtml/node43.html), and [Caltech I–47](https://www.feynmanlectures.caltech.edu/I_47.html). Geometry and the SVG cover are authored from this model; no new external assets or asset licenses are needed.

## Lifecycle and exploration

Native ranges expose explicit accessible names, keyboard adjustment, reversible model time, amplitude ratio, phase and material-point position. Presets select full overlap, node and antinode; reset restores the pulse experiment. SVG is the primary 2D path and requires no WebGL, images, audio resources or Worker. The component has no independent timer or animation loop. One ResizeObserver is disconnected on unmount. Shared Showcase owns offscreen/background pause, reduced motion, replay and narration policy. Samples are bounded at 641 per model call; the renderer uses bounded material markers and flux arrows.

Phone composition changes the domain and evidence, retaining native 16 px labels rather than scaling desktop SVG coordinates. All tested phone chapters have the same 820 px scene height; shared caption/transport are outside this measurement. Controls stay optional and can extend the page after entering exploration.

In the focused phone energy/standing chapters, both the string and energy graph use the same ±0.8 m window and the displayed total integrates that window. Exploration retains the full ±1.6 m window so its initial separated pulses remain visible.

## Evidence and handoff

Worker evidence on 2026-09-05:

- Targeted Vitest: 12 tests passed. Includes analytic pulse energy, finite-difference derivatives and local continuity, integrated boundary flux, exact cancellation, same-sign and unequal-amplitude limits, waveform passage, standing nodes, wavefront-to-standing equivalence, bounded invalid inputs, and 808 reverse-order direct seeks.
- Targeted strict TypeScript check passed for the model, test, experiment and renderer.
- Targeted packet audit passed: exact top-level/topic/cue keys, 71 translations with no shared-wording conflicts or missing component/metadata labels, 8 × 22-second cues, both article anchor sets, existing component/cover paths, and successful Astro compilation of the cover. Formatting was limited to the 11 owned files.
- Isolated Chrome 152.0.7977.76, temporary in-memory component harness with bundled Manrope/Noto fonts and packet translations: 48 chapter/locale/viewport states at 1200, 390 and 320 px. At 320 px every chapter in both languages measured 820 px. No horizontal overflow, undersized SVG text, clipped SVG labels or runtime exceptions in this audit. Inspected key stills for cancellation, energy, phase, formation and nodes. Temporary evidence is in `/tmp/wave-interference-review/`.
- Native keyboard evidence: time −0.080 → −0.079 → −0.080 with right/left arrows; Home −0.100, End +0.100. Overlap returns 0 mm. Equal standing waves show five nodes in the full exploration window; reducing the ratio to 0.95 removes them. Phase 180° returns 0 mm resultant. Reset restores [−0.08 s, −1 ratio, 0.2 m probe]. Tested primary controls are at least 44 px high.

The initial isolated phone energy stage was too tall. The delivered view removes repeated headings/readouts, shortens the energy key and keeps its explanatory evidence together. No narration, captions or timing changed during that correction.

Topic metadata, translations and narration are integrated in the canonical registries; the temporary handoff has been consumed. `src/data/narration.json` and `src/data/film-timeline.json` own the recorded timing.

Remaining parent review: integrated CSS/player behavior and total page composition, complete continuous silent playback, synthesized voices and full listening, real-phone performance/touch, resource-failure behavior, global verification/build and publication. Worker stills, viewport emulation, numerical tests and keyboard checks do not establish those unperformed evidence types. No shared build, voice generator, registry, existing topic file or git operation was used by this worker.

## Recorded integration

Both languages run **179.5 seconds**. Actual chapter starts in seconds: 0, 22.5, 44.5, 67, 90, 112.5, 134.5, 157. Authored words are unchanged; measured windows allow breathing room for the longer recording, and the animation reconstructs from the same chapter progress.

zh: `/narration/wave-interference-zh-0f6d6f510e2c.mp3` · en: `/narration/wave-interference-en-0ab08873878d.mp3`
