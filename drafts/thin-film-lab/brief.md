# Thin-film interference: from paths to a visible sum

Status: isolated Batch17 candidate. No canonical edits, shared integration, recordings, global build or publication. Five existing chapter IDs and the P98 soap/P100 air-wedge windows remain intact.

The baseline had a correct normal-incidence reflectance equation but disconnected phase sketches, two static wedge images crossfaded in place, and fresh Explore defaults. Its 320px full player also extended below the available height. The new explanation follows a film location, resolves continuous reflection/refraction geometry, compares at one outgoing wavefront, and adds field samples on one shared clock. A bright contour moves under a prescribed drainage profile. Three explicitly illustrative spectral samples connect local thickness to color. The air wedge has a persistent contact point and modeled spacer support, with a concealed new fringe strip before testing the halved-gradient prediction.

## Scope and source reading

- Entire relevant P94–101 textbook context read, including preceding reflection/refraction, superposition/coherence, soap experiment P98, phase/color explanation P99, air-wedge problem P100 and following double-slit experiment. Actual P98–100 page images are in `checks/sources/`.
- OpenStax University Physics3 §3.4 for interface reversal and zero-thickness dark reflection. MIT6.974 Chapter2 Fresnel/film treatment and actual printed79 Eq2.191 page for the geometric return series.
- No historical observation table is invented. All colored stripes, drainage and wedge spacers are clearly model inputs; this chapter's evidence is the demonstrated relation between the same field calculation and controlled geometry.

## Scientific contract

`filmOptics` computes lossless symmetric s-polarized Fresnel reflection, Snell angle, complete internal-return series and R+T=1. Inputs outside the bounded propagating-wave domain return null. Matched indices yield zero reflection without color0/0. At a common outgoing wavefront the reference-leg subtraction gives2nd cosθ, rather than twice the internal ray length alone. The plotted amber field includes all returns; only the initial two paths are traced in the section.

The scene does not model surfactant hydrodynamics, true white-light colorimetry, dispersion, absorption, total internal reflection or frustrated transmission. Small-angle air-wedge thickness is hx/L; each40μm spacer and80mm plate length are teaching parameters. Section geometry is uniformly scaled locally; the full wedge angle is explicitly exaggerated. Settling is a geometric transition, not a mechanical simulation.

## Film structure and preservation

Provisional5chapters/168s: soap-yellow44, soap-drain28, soap-white28, wedge-two40, wedge-one28. The zh/en spoken pairs of soap-drain/soap-white/wedge-one are copied byte-for-byte from canonical. The two changed pairs add the missing paths/phase bridge. All8shared cue fields are compared in the packet; preserving spoken text does not imply titles/captions or visuals are unchanged.

- Soap: visible stripes → exact section and reflection reversals → three common-clock fields → zero-thickness question → cancellation → drainage and wavelength transfer.
- Wedge: persistent two-sheet support → glass/air reflection reversal → return to normal-incidence fringe strip → same-type thickness increment → spacer removal with new strip hidden → doubled-spacing test. The question caption does not reveal the answer during the hold.

## Interaction and layout

Fresh Explore starts from the current apparatus, subview, physical inputs and unrevealed question. Nullable overrides preserve explicit choices across Watch; Watch always reconstructs its director state. Paths/fields share thickness, wavelength and angle. Returning to the normal-incidence wedge view clears oblique angle. Changed spacer choices explicitly hide new fringes until the learner reveals them.

Artwork adapts to actual available width and keeps real16px labels. Mobile252px optical views do not stack all experiments. Scene controls are at least44px, with scoped CSS strong enough to survive Base styling. Full-player geometry is measured with real Showcase and all Base CSS; expanded Explore is a scrollable detail flow rather than a forced one-screen fit.

## Verification boundaries

See review.json and ignored `checks/` reports for actual executed model, strict-type, React, MDX, browser and playback results. The first native report preserves real failures: Base CSS reduced segmented labels to10px; personal viewing found sum-field overlap and a rear-phase label/readout collision. Final candidate checks do not replace root's actual-route/static review, recorded-word calibration, subjective listening or a physical-device performance test.
