# Production example: bicycle gearing

[简体中文](../zh-CN/examples/bicycle-brief.md) · [Production guide](../creating-a-scene.md)

**Question:** Why does changing gear alter speed and required pedal force at the same cadence?

**Object to follow:** One gold chain link. Its complete return path connects tooth pitch, crank movement and rear-axle rotation. A two-shaft 3D test rig exposes these relationships without unrelated bicycle details.

## Chapter sequence

| Chapters | Visible evidence                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1–4      | Follow a closed loop, inspect matching pitch, count teeth, connect tooth ratio to rear rotation.                         |
| 5–6      | Switch to a smaller rear sprocket; compare speed and required pedal force at the same cadence.                           |
| 7–9      | Select a larger rear sprocket, increase slope, then vary cadence. Each experiment changes the corresponding calculation. |
| 10–12    | Compare work and power, show the model's limits, and revisit three gearing choices.                                      |

Actual timing comes from [the generated chapter timeline](../../src/data/film-timeline.json), not duplicated seconds in this document. The director integrates cadence into pedal turns. Geometry and measured values share the tooth counts, while independent parameter changes are presented as a new steady-state setup.

## Composition and constraints

The overview retains both shafts, crank, chain and return run. Close views make tooth engagement inspectable. Phone framing must preserve the complete loop. A gear change switches between tensioned configurations; it does not claim to model derailleur movement.

The [steady-state model](../../src/models/bicycle.ts) includes gradient, rolling resistance, drag and 96% drivetrain efficiency. It computes the power needed to maintain a chosen cadence; it does not assume unlimited rider power. The comparison bars use the same cadence and road gradient for each gearing option.

The [geometry model](../../src/models/mechanisms.ts) uses common pitch and an even link count. Existing tests enumerate front tooth counts 34/50, rear counts 11–34 and eight phases. The adjacent-roller tolerance is 1.5% of pitch: a sampled teaching-geometry check, not an analytical proof of contact at every phase.

## Review evidence

Model or geometry changes require invariant checks and extreme-setting frames. Camera changes require wide and narrow compositions. Narration changes require both language tracks and synchronized playback. A previous review does not automatically cover a new camera, audio track or timeline.

Implementation: [Bicycle.tsx](../../src/components/experiments/Bicycle.tsx), [BicycleStudio.tsx](../../src/components/three/BicycleStudio.tsx).
