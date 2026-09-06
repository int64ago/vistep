# Excavator — one sectioned cylinder, one machine

[简体中文](../zh-CN/examples/excavator-brief.md) · [Production guide](../creating-a-scene.md)

## Question and direction

How does a stream of oil lift a bucket of earth? The reader's first intuition is that the pump "pushes hard". The scene separates the questions a hydraulic machine answers with different quantities: **flow** (where the oil comes from and how fast it arrives, set by the operator's lever through the spool), **pressure** (how hard, set by the load and shared by every connected piston, Pascal's principle) and **leverage** (where that push acts relative to the pivot). Two objects are followed together: the near boom cylinder, opened along its axis in place on the machine, and the boom section of the main control valve in a live circuit panel beside it, driven by the right joystick.

The apparatus is an original 20-tonne-class teaching excavator: crawler undercarriage, revolving frame with cab and counterweight, gooseneck box boom, tapered stick, bucket with H-link linkage, two boom cylinders, one stick cylinder and one bucket cylinder. Cylinder bores and rods, the implement relief setting and the pump flow follow the Komatsu PC200-8 brochure; member lengths, barrel lengths, masses and body dimensions are teaching values. The machine sits on the site's plain ground with a soft shadow; the only scenery is a boulder in the final chapter. Warm painted steel, chrome rods and dark barrels keep the connections readable; the oil is amber.

Callouts are projected from the model pins into CSS pixels with leader lines, so they stay legible on phones and never scale with the scene. The circuit panel (tank, engine-driven pump, main relief valve, one spool section with P/T/A/B ports, the boom cylinder and the joystick) is an SVG whose geometry never changes: the spool travel, the uncovered port width, the moving dashes and the chamber colours all come from the same model state as the 3D machine. On desktop it overlays the left of the stage while the camera slides the cylinder into the remaining width; on phones it stacks above the stage. Instruments sit under the stage: one pressure gauge with the relief band, then force, flow-to-speed and load/lever-arm measures, each fading when it is not the current subject.

## Eight directed chapters

Both recordings share one measured **245.5-second, eight-chapter film**. Windows below come from the generated timeline (`film-timeline.json`), not from assumptions.

| Window        | Observation                                  | Model and composition                                                                                                                                                        |
| ------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–24 s        | A dig cycle: curl, crowd, lift.              | Three cylinders change length while the members keep theirs. Wide three-quarter view fitted by projecting the machine's extreme points.                                      |
| 24–50.5 s     | The near boom cylinder opens along its axis. | A clipping plane sweeps through the barrel. The joystick at 23 % meters 30 L/min into the cap end; the boom angle is integrated from that flow.                              |
| 50.5–77 s     | One closed circuit.                          | The circuit panel appears: tank → pump → spool (P→A, B→T) → cylinder → tank, dashes moving at the metered rate while the boom rises at 25 % lever.                           |
| 77–114 s      | Pressure follows the load; Pascal.           | Lever at 16 %; payload 300 → 1800 kg; 6.5 → 9.5 MPa. The panel then shows a Ø20 mm pump piston and the Ø120 mm boom piston at one pressure: 2.9 kN against 106 kN.           |
| 114–146.5 s   | Lever travel sets speed.                     | 31 % then 77 % travel opens the spool port wider: 40 then 100 L/min, 2.9 then 7.4 cm/s. The boom rise is integrated and holds at the top of the range.                       |
| 146.5–180 s   | Side elevation: the lever arm.               | Line of action and perpendicular arm drawn in 3D from the cylinder pins; boom sweeps 0.45 → 1.0 rad; required pressure 8.6 → 7.8 MPa at the same 1200 kg.                    |
| 180–212.5 s   | The bucket four-bar.                         | Close view of the stick tip; curl −0.3 → 2.25 rad as the bucket cylinder extends; rocker and link solved from circle intersection with fixed lengths.                        |
| 212.5–245.5 s | Teeth under a boulder: relief, then release. | Lifting against an immovable obstacle ramps pressure to 37.3 MPa; the panel's relief valve opens and dashes divert to tank; releasing the lever traps only the gravity load. |

Phone composition uses a taller stage, a more frontal overview yaw and the same projection fit; the cylinder and bucket views scale their visible height by aspect. The 2D runtime fallback draws the same pose in side elevation with the boom cylinder sectioned. Callouts are hidden in that flat view because the drawing carries its own pins.

## Model contract

- Metres, radians, kilograms, pascals and newtons. World x points from cab to bucket; the boom chord, stick and bucket frames are defined in `src/models/excavator.ts`. Curl is clockwise in side view: extending the bucket cylinder rolls the cutting edge toward the cab, verified across the whole range.
- Every renderer, drawing and cover reads `excavatorPose`; cylinders are placed from their pin positions and their piston position is `length − rodLength`. A regression sweeps all poses to keep each piston inside its barrel with rod overlap.
- Gravity pressure: `2 · p · A · d = Σ m g x` about the boom foot with the pin-derived lever arm `d`. Piston area uses the 120 mm bore (113 cm²). Speed: `v = Q / (2A)`; boom rate `v / d`, negative when lowering. Joystick travel −1 … 1 meters `|x| · 130 L/min` (a teaching full-lever flow) and selects lift, hold or lower; every chapter's flow and valve state derive from that travel, and the moving chapters integrate the boom angle deterministically so seeking agrees with playback.
- Pascal comparison: a Ø20 mm teaching pump piston and the boom piston at the same pressure give an area ratio of 36 and the same force ratio. Real pumps, pilot control, load sensing and flow sharing among actuators are stated omissions.
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
