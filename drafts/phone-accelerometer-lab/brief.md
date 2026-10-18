# Phone accelerometer — principle-first reconstruction

Owner: teaching_subject_fit. Status: implemented, author review in progress; speech and final static review remain with root. Six original chapter IDs and both original textbook selections remain unchanged.

The opening is a paradox: a still phone reports g, while a falling phone reports almost zero. Follow the same gold-marked proof mass through case support, suspension deformation, electrode gaps and displacement-calibrated output. The intended change is a visible cause, not a longer explanation of how to operate an app.

Research and independent plan review: `artifacts/teaching-principles/phone-accelerometer-ready/ready-brief.md`, `chemistry-independent-review.json`. The PEP required-1 PDF printed pages 49–50 and 111–112 were read; primary technical sources are linked in both articles and the packet. An equivalent single-axis mechanism is drawn, not an exact phone chip. Its 500 Hz natural frequency, critical damping and 4 μm neutral electrode gaps are illustrative choices.

## Causal sequence

1. `supported`: actual palm → case/chip → enlarged suspension → displaced mass/electrode imbalance. A still supported instrument is not a speedometer.
2. `fall`: continuous withdrawal, explicitly slowed 0–3.5 ms relaxation, then falling with gravity retained. Dynamic signal and geometry share the same physical clock.
3. `corrected`: persistent catching palm, contact at exactly 0.7 s, then slowing case and additional proof-mass displacement. Downward velocity and upward acceleration coexist. The same-time raw signal is transformed by subtracting g.
4. `lift`: independent sensor introduction. Entire cabin/support/phone moves together. Desktop pairs cabin and internal section; phone alternates each phase's internal evidence and world motion. Starting, cruising and braking produce distinct settled signals despite all travelling upward.
5. `lift-correction`: same-time +1/0/−1 inference, with a held prediction before revealing the braking sign.
6. `spring-meter`: a real roof/hook/case/spring/mass connection. Settled stage snapshots avoid fictitious instantaneous macroscopic spring dynamics. Recover acceleration with known mass, then eliminate mass from two readings under the textbook's equal-magnitude condition.

## Model and visual contracts

`phoneMotion` retains the original continuous external trajectory. `phoneSensor` reconstructs a critical response analytically for arbitrary seeks. Position and relative velocity are continuous at acceleration steps. Raw signal is −ω²q; corrected signal is raw−g. Prescribed casing acceleration is separate, and only after settling do they coincide. Elastic arrows exclude damping; total suspension/mass is separately exposed and can briefly reverse.

Every electrode edge and gap comes from the same q, including plate thickness. The moving mark keeps its identity. A single persistent catch surface is derived from the phone's contact height; it has positive clearance before contact and shares the phone trajectory afterward. The original support withdraws continuously. Intentional hand entrances/exits are clipped to the world camera frame.

Force-meter comparisons are explicitly settled snapshots. They do not reuse the microsecond/millisecond sensor response or claim instantaneous macroscopic vibration. The two-force inference fails when starting and braking acceleration magnitudes differ.

The `phone-sensor-` CSS namespace is unique to this scene. SVG coordinate width equals measured CSS width, preserving 16 px labels. Phone composition uses a 196 px diagram instead of shrinking the desktop. Shared-player layout adjustments are scoped to this slug within its owned stylesheet. The longest real integrated caption, transport and closed chapter drawer are included in phone height checks.

## Evidence and remaining work

Initial targeted numerical tests: 17 passed, including independent analytic benchmarks, damping reversal, continuity, signal consistency, electrode clearance, inference limits and contact geometry. Scoped TypeScript passed. Author review 01 exposed excessive full-player height; review 02 verifies a 479.1 px maximum player at 320×568 with new captions, bottom approximately 561 px when top is below navigation at 82 px. These are browser viewport measurements, not physical-phone performance.

Further exact-contact frames, controls, bilingual article rendering, final covers and all decisive states are recorded in the accompanying review record when complete. Spoken scripts remain provisional until those decisive frames are approved. Root owns synthesized tracks, measured word timing, final global checks, static build, independent review and release. No listening, final speech synchronization, continuous human viewing, physical-device performance, global verification or publication is claimed by this brief.
