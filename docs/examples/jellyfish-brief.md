# Jellyfish — production brief

[简体中文](../zh-CN/examples/jellyfish-brief.md) · [Production guide](../creating-a-scene.md)

## Object and turning point

Follow one pulse of Aurelia aurita, then track its warm-colored stopping vortex. The initial intuition is “contraction pushes the animal, then inertia does the rest.” The turning point is renewed acceleration while the bell is fully relaxed: fluid motion can still create pressure against the inner bell surface. There is no free energy; prior work established that flow.

The source hierarchy is [Gemmell et al. 2013](https://doi.org/10.1073/pnas.1306983110), its [2014 high-speed imaging/DPIV follow-up](https://pmc.ncbi.nlm.nih.gov/articles/PMC4203578/), and official/academic morphology references. The [aquarium page](https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/moon-jelly) names A. labiata, a related species, rather than the A. aurita specimen; that distinction is disclosed. No external photograph or video is redistributed.

The art is a quiet, lit, translucent biological specimen in blue-green water. Its paired bell surfaces, four horseshoe gonads, radial canals, central four pleated oral arms and short marginal tentacle fringe establish the organism. Rings identify mechanisms rather than decorate the water with generic particles. No generic dashboard surrounds the specimen.

## Scientific model

The cavity is a half ellipsoid, initially R=0.02 m and H=0.009 m. A cosine compression variable drives both dimensions, volume and analytic flux. The 3D inner bell surface is exactly that cavity; the tissue surface sits 0.0005 m outside it. Zero amplitude freezes both dimensions. Expelled and refilled volume balance over a pulse.

The mechanical model is deliberately uncalibrated. It uses the real modeled opening `A=πR²`, a bulk momentum-flux surrogate `ρQout²/A`, quadratic drag with coefficient 0.8 and an effective mass of 1.8 times the resting displaced-water mass. It omits the flattened bell's pressure distribution, entrainment and fluid–structure coupling. A budget of 35% of the surrogate outgoing kinetic-energy flux supports a delayed force during full relaxation. Cumulative recovered work never exceeds released energy; released plus remaining energy never exceeds the deposited budget. The coefficient is a teaching choice, not a paper's percentage or efficiency result.

Ring centers and rotation are schematic, linked to pulse phase. They do not solve Navier–Stokes, measure pressure or reconstruct historical wake interactions. No ring or propulsion appears at zero amplitude. Flexible-appendage deflection depends on the same flux and speed rather than drifting independently. The comparison removes only the model's recovery term and retains input geometry, initial state and active force/drag law.

## Seven chapters, 170 planned seconds

| Start | On-screen cause                                                                          | Composition and spoken cue                                                                                                                   |
| ----- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 s   | One transparent organism pulses.                                                         | Oblique anatomy view; name the bell, gonads, oral arms and fringe without making appendages into oars.                                       |
| 24 s  | Cavity volume drops and outflow rises.                                                   | A half-bell view and arrows share analytic dimensions/flux; one inline volume reading.                                                       |
| 48 s  | Starting ring forms and moves into the wake.                                             | Side/cutaway view; blue ring retains its identity.                                                                                           |
| 70 s  | Elastic reopening refills the cavity and repositions the counter-rotating stopping ring. | Same specimen and view; warm ring moves toward the underside.                                                                                |
| 96 s  | Bell motion is zero but bounded secondary thrust remains.                                | The warm ring and forward arrow stay visible with a zero-volume-change reading.                                                              |
| 122 s | Same motion, recovery versus no recovery.                                                | Model-derived small specimens traverse two distance rails; matched speed curves mark fully relaxed intervals. No measured-performance claim. |
| 146 s | Reconnect contraction, refill and post-relaxation flow.                                  | Return to the complete translucent specimen with both current-cycle rings, preserving the final spoken referent.                             |

The shared Showcase clock selects physical time from chapter-relative progress. Fixed-step deterministic trajectories are created once per parameter choice and looked up on every seek. There is no private animation timer. The shared Studio renderer owns rendering, offscreen/background suspension, paused-seek settling, reduced-motion handling, context-loss fallback and disposal. Camera presentation uses Studio's render delta; it does not advance the physics. View changes settle directly on paused seeks.

Phone framing uses a 326 px water window (310 px at 320 px width), a stable full-motion camera envelope and CSS-pixel legends outside the geometry. Comparison switches composition rather than stacking a desktop scene, two specimens and chart. The 2D path uses the same bell, oral-arm and fringe points; it leaves room for the lowest current-cycle starting ring. Diagram body text is 16 px and controls have 44 px targets. Species kicker lettering is ornamental, not body explanation.

## Author self-review and integration evidence

Key samples: chapter 1 progress 0.5 has positive outflow; chapter 3 progress 0.6 places the stopping ring near the underside; chapter 4 progress 0.5 has exactly zero volume flux while recovery force is positive; chapter 5 progress 1 compares four default pulses. The final chapter keeps rings mounted so its spoken reference is present. The cover is derived from a fully relaxed recovery frame, including real model ring coordinates and a force arrow only while recovery is positive.

Regression evidence checks analytic volume derivatives, balanced flux, no free motion/rings at zero amplitude, energy bounds, timestep convergence, backwards seek, extreme amplitude/period inputs, nondegenerate periodic meshes and attachment locations. Renderer tests sweep poses and cutaways, verify finite buffers and complete restoration, and guard against camera-distance drift. Presentation tests directly seek the relaxed-thrust chapter and alter the actual model to all-zero deformation without nonfinite comparison geometry.

This is author self-review. It does not certify browser material appearance, independent scientific review, complete playback, generated speech, native listening or a physical phone. The integration owner must inspect both languages at desktop/390/320 px, the whole player, ring/body bounds, cutaway transitions, startup rejection versus runtime WebGL failure, catalog/social cover composition and both tracks. No deployment or speech manifests were changed by the scene worker. Remove the temporary packet after canonical integration.
