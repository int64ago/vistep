# Retroreflector — author brief

Status: key-shot source ready; bilingual speech **draft**, pending integration-owner browser review. Independent acceptance, full playback, listening, device performance and resource failure checks are not-run. Author model tests are mathematical evidence only.

## Misconception and editorial place

A corner cube does not promise that each ray retraces the same line, nor that every possible finite-entry ray hits three faces. Prerequisites: reflection flips the normal direction component; three dimensions. This adds nonsequential finite ray tracing and offset to `total-internal-reflection` and provides return-target context for `lidar-ranging`; it does not repeat TIR or model a vehicle lamp's full photometry.

## Read sources and conditions

| Claim                                                                                | Actually read source                                                                                                                                                                                   | Conditions and limits                                                                                                       |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Three perpendicular faces give a sourceward return; a ray can be laterally displaced | [Ansys Optics, How to model corner-cube retroreflectors, polygon object and finite array sections](https://optics.ansys.com/hc/en-us/articles/43071088719763-How-to-model-corner-cube-retroreflectors) | Requires actual three-face encounters. Their real glass model includes refraction/polarization, ours intentionally does not |
| Finite apertures can produce rays without all three encounters                       | Same article, tilted finite array example                                                                                                                                                              | Entry and incidence must be traced, not assumed to succeed                                                                  |
| Solid glass corner-cube products use three internal reflecting faces                 | [Edmund N-BK7 Corner Cube Retroreflectors](https://www.edmundoptics.com/f/n-bk7-corner-cube-retroreflectors/12447/)                                                                                    | Context only: no product acceptance specification is attributed to this hollow ideal model                                  |

Independent oracle: unfold all three planes. For a normalized successful incident direction d and entrance sum1, total internal length is −2/(dx+dy+dz), and exit point is −pEntry−length·d. This independently checks event-order tracing, its total distance and final coordinates. Every real hit has its plane coordinate zero, preserves tangential components and flips the normal component. Counterexamples: removing one face leaves a component unchanged; entry(.8,.1,.1), direction(−1,−1,−1) exits after two reflections with nonzero return error. Offset is |(pExit−pEntry)×d|, not projected separation.

## Independent visual direction

Three softly shaded triangular mirrors make a hollow trihedral cavity. A fixed orthographic camera sees all faces; dashed entrance edges separate the aperture from mirror boundaries. A single gold/pale/blue polyline comes from actual hit points. Numbered bounces, direction chevrons derived from segment tangents, and a slow point sampled by real cumulative path length make propagation traceable. The point is a teaching tracer, not a light-speed claim.

1. One reflecting face isolates one component reversal; other faces remain open.
2. Add a second face with exactly the same ray, showing a remaining 3D error.
3. Add the third face; all components reverse and error becomes zero.
4. Vary aim, moving all hit points while retaining three reflections.
5. Hold aim and vary entry: parallel return can have a nonzero lateral offset.
6. Finite-edge counterexample leaves through the entrance after two encounters.

Phone is a separately sized340×240 scene with185px rendered height, 16px interface text and hidden manual controls. Complete player≤740px remains a browser-verification target. No independently timed animation; FilmContext chapter time drives the tracer. Primary review shots: chapter3 successful three-bounce path, chapter5 offset, chapter6 finite failure, manual aim/entry extremes,320/390 English labels and dark controls.

Revision after integration-owner320px review: fixed orthographic camera now looks along(1,3,10), with nominal incident projection horizontal. Entry(.15,.45,.4) separates the parallel external paths. Successful three-bounce external segments retain1.3L of the actual ray; one/two-bounce examples retain0.9L, with no independently redrawn return. All six chapters and manual gridaim±15°,entry.15–.50 were numerically checked against the fixed phone and desktop frame; browser re-review pending. Watch-mode phone suppresses redundant disclosure, short readouts are Return error / Path offset, and numbered SVG encounters use26units with dark halo.
