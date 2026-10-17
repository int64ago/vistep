# Cam follower — contact is a constraint, not an animation promise

Owner: `/root/hundred_mechanisms`. Original SVG mechanism in its actual plane of motion; physical 3D is not needed to reveal these contacts. Track one finite-radius roller along a guided rod, with visible spring ends and a fixed support.

Misconception: uniform rotation means uniform follower motion; a cam can always force the same trajectory at any speed. Prerequisites: position/speed and a pushing contact. Adds unilateral contact and force feasibility beyond crank/engine views.

Sources: [NPTEL Drives and Mechanisms, Lecture 3, introduction and radial cams](https://archive.nptel.ac.in/content/storage2/courses/112103174/module4/lec3/1.html); [force-closed follower discussion](https://archive.nptel.ac.in/content/storage2/courses/112103174/module4/lec3/3.html). Claims: cam-follower contact transfers prescribed motion; an external force/spring maintains force closure. The specific eccentric-circle tangency and dynamics are independently derived in the model, not copied textbook artwork.

Benchmarks: stroke 2e; finite-circle contact distances exactly R and r; analytic first/second derivatives checked against finite differences. Boundary counterexamples: zero eccentricity gives zero stroke; at 600 rpm with no spring the follower separates, so required negative normal is not applied. The 400 N/m, 6 mm preload comparison is verified to maintain contact. Free flight uses exact linear-oscillator propagation and re-contact is perfectly inelastic. Event convergence is checked at 1440/2880 steps per turn. Limits: frictionless contact, rigid geometry, massless spring, no roller spin inertia or stress.

Six shots: concentric circle; introduce offset and stroke; follow the actual moving tangent point; nonuniform speed; high-speed separation without spring; same speed with preloaded spring. The free-flight shot displays actual gap and zero actual contact force, rather than keeping a visually constrained but physically impossible follower.

Phone 340×310 mechanism keeps the spring, guide, shaft, roller and contact in one picture; actual labels use 21-unit glyphs. Only the velocity chapter adds a compact 110-unit plot. Desktop places two computed observations beside the mechanism. Full-player acceptance remains integrator work. Cover contact uses the exact same model.

Author model tests: 6 passed; targeted TypeScript passed. Browser, full playback, both recorded tracks, independent review, physical phone and publication: not-run. Inbound suggestions: `four-stroke-engine`, `sewing-machine`, `escapement`.
