# Lever — perpendicular distance, then work

Owner: `/root/hundred_mechanisms`. Medium: SVG side elevation of a brass laboratory balance; not a general rigid-body dynamics simulation.

Misconception: distance along the bar is always the moment arm; using less force also uses less work. Prerequisite: force, distance, multiplication. Adds the geometric definition of torque before the collection's gears, bicycle and excavator. Track the same 120 N load throughout.

## Claims and boundaries

| Claim                                                                      | Primary teaching source                                                                                         | Assumptions and range                                                      |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Torque follows the cross product; arm is shortest distance to a force line | [OpenStax University Physics 1 §10.6](https://openstax.org/books/university-physics-volume-1/pages/10-6-torque) | Planar force and fixed pivot; actual vector projection, including zero arm |
| Force advantage trades for displacement                                    | [OpenStax College Physics 2e §9.5](https://openstax.org/books/college-physics-2e/pages/9-5-simple-machines)     | Massless rod, no bearing friction, vertical forces in the work shot        |

No copied textbook figures or prose. Geometry is authored from the model. Benchmark: 120 N at 1 m balances 60 N at 2 m. Counterexample: at 60° away from down the 2 m input arm becomes 1 m, so 60 N no longer balances. At 90° the arm is zero and no finite effort balances a nonzero load. Finite work uses vertical displacement, not arc length. Manual mode holds the rod horizontal and reports moment imbalance, not invented dynamic rotation.

## Causal direction

1. Equal arms: equal forces and opposing moments.
2. Slide the input attachment out: required force falls while load stays fixed.
3. Tilt the input force: violet perpendicular segment shrinks with unchanged attachment distance.
4. Restore balance by doubling force: moment readouts meet again.
5. Align force with the rod: its line crosses the pivot and its moment vanishes.
6. Quasi-static lift: the input end travels twice as far; both work calculations agree.

Wide: long horizontal apparatus, explanatory distances above; torque/work equation below. Phone: independent 330×310 coordinate system, shorter projection with 19-unit type (≥16 px at supported 320 px viewport), current geometric evidence only. No side panel. Force arrows terminate at the point of application; extended force line and perpendicular foot expose the geometry.

## Acceptance status

Author model tests: 6 passed. Browser keyframes, full playback, both voices, independent source review, physical phone and publication: not-run. Scripts are proposed until the integrator checks decisive shots at chapters 2 and 5. Existing scenes suggested for inbound links: `planetary-gears`, `bicycle`, `excavator`.
