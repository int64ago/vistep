# Excavator — one sectioned cylinder, one machine

[简体中文](../zh-CN/examples/excavator-brief.md) · [Production guide](../creating-a-scene.md)

## Question and direction

How does a stream of oil lift a bucket of earth? The reader's first intuition is that the pump "pushes hard". The scene separates three questions that a hydraulic machine answers with three different quantities: **pressure** (how hard, set by the load), **flow** (how fast, set by the operator's valve) and **leverage** (where that push acts relative to the pivot). The object to follow is the near boom cylinder: it stays in place on the machine and is opened along its axis so the piston, both chambers and the oil can be watched while the boom actually moves.

The apparatus is an original 20-tonne-class teaching excavator: crawler undercarriage, revolving frame with cab and counterweight, gooseneck box boom, tapered stick, bucket with H-link linkage, two boom cylinders, one stick cylinder and one bucket cylinder. Cylinder bores and rods, the implement relief setting and the pump flow follow the Komatsu PC200-8 brochure; member lengths, barrel lengths, masses and body dimensions are teaching values. The machine sits on the site's plain ground with a soft shadow; the only scenery is a boulder in the final chapter. Warm painted steel, chrome rods and dark barrels keep the connections readable; the oil is amber.

Callouts are projected from the model pins into CSS pixels with leader lines, so they stay legible on phones and never scale with the scene. Instruments sit under the stage: one pressure gauge with the relief band, then force, flow-to-speed and load/lever-arm measures, each fading when it is not the current subject.

## Seven directed chapters

Both recordings share one measured **216-second, seven-chapter film**. Windows below come from the generated timeline (`film-timeline.json`), not from assumptions.

| Window      | Observation                                           | Model and composition                                                                                                                                         |
| ----------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–24 s      | A dig cycle: curl, crowd, lift.                       | Three cylinders change length while the members keep theirs. Wide three-quarter view fitted by projecting the machine's extreme points.                       |
| 24–50.5 s   | The near boom cylinder opens along its axis.          | A clipping plane sweeps through the barrel. Oil enters the cap end at 30 L/min; the boom angle is integrated from that flow, so the piston and boom agree.    |
| 50.5–83 s   | Same pose, heavier bucket: pressure follows the load. | Valve held; payload 300 → 1800 kg; cap-end pressure 6.5 → 9.5 MPa; force arrow on the piston scales with p·A (108 kN).                                        |
| 83–117 s    | Flow sets speed.                                      | 40 then 100 L/min shared by two cylinders: 2.9 then 7.4 cm/s. The boom rise is integrated from the flow and holds at the top of the range.                    |
| 117–150.5 s | Side elevation: the lever arm.                        | Line of action and perpendicular arm drawn in 3D from the cylinder pins; boom sweeps 0.45 → 1.0 rad; required pressure 8.6 → 7.8 MPa at the same 1200 kg.     |
| 150.5–183 s | The bucket four-bar.                                  | Close view of the stick tip; curl −0.3 → 2.25 rad as the bucket cylinder extends; rocker and link solved from circle intersection with fixed lengths.         |
| 183–216 s   | Teeth under a boulder: relief, then release.          | Lifting against an immovable obstacle ramps pressure to 37.3 MPa; relief pellets divert at the manifold; releasing the lever traps only the gravity pressure. |

Phone composition uses a taller stage, a more frontal overview yaw and the same projection fit; the cylinder and bucket views scale their visible height by aspect. The 2D runtime fallback draws the same pose in side elevation with the boom cylinder sectioned. Callouts are hidden in that flat view because the drawing carries its own pins.

## Model contract

- Metres, radians, kilograms, pascals and newtons. World x points from cab to bucket; the boom chord, stick and bucket frames are defined in `src/models/excavator.ts`. Curl is clockwise in side view: extending the bucket cylinder rolls the cutting edge toward the cab, verified across the whole range.
- Every renderer, drawing and cover reads `excavatorPose`; cylinders are placed from their pin positions and their piston position is `length − rodLength`. A regression sweeps all poses to keep each piston inside its barrel with rod overlap.
- Gravity pressure: `2 · p · A · d = Σ m g x` about the boom foot with the pin-derived lever arm `d`. Piston area uses the 120 mm bore (113 cm²). Speed: `v = Q / (2A)`; boom rate `v / d`. The flow chapters integrate the boom angle deterministically so seeking agrees with playback.
- Lifting against an obstacle: required pressure is unbounded, the displayed pressure ramps to the 37.3 MPa relief setting, the relief flag opens the pump-side return, and speed is zero. Holding traps only the gravity pressure.
- Omitted: friction, inertia, oil compressibility, leakage, return-line pressure, soil forces, swing, travel, structural stress and stability. Nothing here is a lifting chart.

## Sources and what they support

- Komatsu, PC200/PC200LC-8 brochure AESS688-01: boom 120 × 85 mm, arm 135 × 95 mm, bucket 115 × 80 mm cylinders; implement relief 37.3 MPa; maximum pump flow 439 L/min; boom 5.7 m, arm 2.925 m; boom holding valve as standard equipment.
- Bosch Rexroth, Hydraulics Basic Principles: pressure builds only as required by resistance; a relief valve limits working pressure.
- Parker, Mobile Cylinder Products HY18-1000: effective areas, force and flow/speed relations for single-rod cylinders.
- Caterpillar, CA2175409C, Excavator bucket linkage: H-link and idler link four-bar; extending the bucket cylinder curls the bucket.
- Bosch Rexroth, Check and metering valves: boom holding and hose-burst protection under ISO 8643.

Sources were checked on 2026-09-06. Component masses were not available from the manufacturer and are teaching estimates.

Implementation: [excavator.ts](../../src/models/excavator.ts), [excavator-drawing.ts](../../src/models/excavator-drawing.ts), [Excavator.tsx](../../src/components/experiments/Excavator.tsx), [ExcavatorStudio.tsx](../../src/components/three/ExcavatorStudio.tsx).
