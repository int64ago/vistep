# Principle-first revision: worker handoff

Owned implementation and articles are frozen for root review. Existing six chapter IDs and the textbook selection are unchanged; the meanings of `compensate`, `tape` and `paired` have changed as documented in the packet. The original apparatus methods remain optional material.

## Implemented evidence

- An already moving cart has equal nonzero push/resistance, zero net force and constant velocity.
- Two identical carts receive exact tensions of 0.12/0.24 N. After 1 s their velocity gains are 0.20/0.40 m/s.
- Carts of 0.40/0.80 kg receive the same actual tension 0.16 N. After 1 s their velocities are 0.40/0.20 m/s. Hanging mass is adjusted explicitly; fixed weight is not claimed to fix tension.
- A continuous push/coast/brake trajectory preserves position and velocity at force changes. The withdrawn pusher remains behind. Braking stops at rest, without reverse motion or a nonzero displayed horizontal braking force at rest.
- Both bodies obey their own equations. Heavy-hanger comparison shows T = 1.47 N versus mg = 1.96 N; the m/M approximation error is 33.3%.
- The rope has a tangent pulley entry, a continuous arc and a vertical hanging segment. Its total length is constant for all tested displacements/angles; hanging descent equals cart travel.
- Setup angle and optional equal-time paper dots share the same uncompensated cart model. Zero tilt gives decreasing spacings; compensated tilt gives equal spacings; 3° gives increasing spacings.

## Executed checks

- `pnpm exec vitest run src/models/newton-second-law-lab.test.ts`: 14 tests passed. Benchmarks include independent two-body force balance, constant-velocity motion, exact control variables, continuous release/braking and rope-length/tangency boundaries.
- Scoped TypeScript command for the component and model passed. Scoped Prettier and `git diff --check` passed. Global verify/build/preview was not run by this worker.
- `artifacts/newton-principle-first/review-03/report.json`: 348 inspected browser states, comprising 60 keyframes and 288 endpoint combinations across Chinese/English at 320/390/1100 px. No console errors, document overflow, SVG bounding-box overflow over 2 px, or control size/font failures. This pass temporarily injected the packet’s captions for layout measurement only.
- `artifacts/newton-principle-first/review-05-final/report.json`: 60 final keyframes with actual root-integrated captions and provisional 187 s timeline, no caption injection. No runtime/geometry/layout/target failures. Final caption-source audio was muted.
- `artifacts/newton-principle-first/comparison-handoff/report.json`: 20 explicit comparison timing and watch→explore state handoffs passed, including early motion and completed one-second results. Readings, masses, tensions and clock are preserved across the switch.
- `artifacts/newton-principle-first/optional-tape/report.json`: 6 conditions passed, covering both languages at default, 0° and 3° compensation settings.

## Mobile player size

At an 844 px browser viewport height, the complete final player (scene, caption, transport and collapsed chapter entry) reaches these measured maximum heights:

| Viewport |  Chinese |  English |
| -------- | -------: | -------: |
| 320px    | 736.73px | 777.33px |
| 390px    | 756.45px | 756.45px |

The highest scene-to-transport extent is 728.33 px. The complete player fits the 779 px region remaining after the review’s 65 px top offset. This is browser emulation, not physical-phone or mobile-browser-toolbar validation. An earlier English 320 layout reached 897.94 px; that failing history remains in review-02 rather than being overwritten.

I personally inspected representative mobile and desktop frames for balanced forces, double force, double mass, coasting, braking and hanging-force imbalance, plus the expanded tape. The final contact sheets are in `artifacts/newton-principle-first/review-05-final/`. These sampled inspections are not a claim of uninterrupted human viewing.

## Still belongs to root

Regenerate and verify bilingual narration, align its intervention words to normalized beats, independently review the complete film and perform required project-wide checks. No new voice listening, physical-device performance, audio-failure run or independent full-film acceptance is claimed here. The final c1 cue adds the necessary compensated-resistance condition; root must use the packet’s latest first sentence when generating audio. Shared source registration, i18n, curriculum and audio were not edited by this worker.
