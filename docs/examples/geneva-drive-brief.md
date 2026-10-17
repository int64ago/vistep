# Geneva drive — pin indexing and positive dwell are different constraints

Owner: `/root/hundred_mechanisms`. Original top-view mechanism with a lower crank, raised drive pin, relief-cut locking disc and slotted output plate. Expose the actual planar contacts instead of adding perspective that hides the slot. Phone composes two wheels horizontally within a 340×250 drawing, with one timing band beneath. Optional controls and geometry assumptions remain collapsed.

Misconception: intermittent output means intermittent motor input; removing the pin alone positively locks the output. Track the gold drive pin, then transfer attention to the mating locking arc. Prior knowledge: turns and angle. This adds index/dwell timing and physical position locking beyond continuous gear and cam transmission.

Source: [NPTEL Drives and Mechanisms, Lecture 5, Geneva mechanism](https://archive.nptel.ac.in/content/storage2/courses/112103174/module4/lec5/2.html), checked October 18, 2026. Supports continuous-to-intermittent motion, radial pin/slot engagement, separate locking disc, 360°/n indexing and external engagement smaller than 180°. [Applications](https://archive.nptel.ac.in/content/storage2/courses/112103174/module4/lec5/3.html) supports stop-and-advance transport. Geometry and contours are independently derived, not copied diagrams.

Causal sequence: complete intermittent cycle; tangent entry into the slot; advance through a whole index; lock during dwell; compare four and six slots; speed up the input while preserving angular fractions. Each new chapter changes the observed constraint or a controlled variable.

Standard external geometry: normalized center distance c=1, crank radius r=sin(π/n), engagement half-angle α=π/2−π/n. While engaged, slot direction relative to −X is q=atan2(−r sinθ,1−r cosθ); outside, it is held at ±π/n. Turns are continuously unwrapped and each entry advances the next slot. The derivative vanishes at both engagement ends and peaks at magnitude r/(1−r). Fractions: index 1/2−1/n and dwell 1/2+1/n. Four slots therefore index for 90° of input and dwell for 270°.

Fabrication dimensions are explicit teaching choices: pin radius .025c, radial slot width .055c, locking disc radius .83r. Output outer radius cos(π/n)+.025c; matching concave recesses are centered c from the output axis, midway between slots. A circular relief on the driving lock disc is centered c along the pin direction, with radius outputRadius+.012c. Model tests sample the actual solid contours for clearance in addition to independent kinematic checks. The lower crank runs in a separate plane beneath the output plate.

Limits: ideal rigid kinematics, no impact/inertia, clearance dynamics, contact stress, bearing load or allowable speed prediction. Animation is slowed; speed readings use the displayed reference input. Locking assumes matching circular faces, not friction. Reversing a motor would reverse indexing; this is not a one-way ratchet.

Author model tests: 6 passed. Targeted TypeScript: passed. Browser/full playback, both speech tracks, independent visual review, physical-phone performance and publication: not-run. Proposed inbound links: cam-follower, escapement, sewing-machine.
