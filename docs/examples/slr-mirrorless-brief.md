# SLR and mirrorless — one lens, two viewing routes

[简体中文](../zh-CN/examples/slr-mirrorless-brief.md) · [Production guide](../creating-a-scene.md)

## Causal question

Why does a conventional DSLR finder briefly turn black when the shutter is pressed, and what replaces that viewing route in a mirrorless camera? Track one yellow central lens ray. The turning point is the raised mirror: the finder route disappears **before** sensor exposure begins. The concluding distinction separates a reflex mirror from a mechanical shutter.

## Sources and boundaries

Primary sources checked on 2026-10-05: [Canon DSLR technology](https://global.canon/en/technology/canon-tech/tech/dslr/), [Canon mirrorless technology](https://global.canon/en/technology/canon-tech/tech/mcamera/), [Nikon DSLR/mirrorless anatomy](https://www.nikonusa.com/learn-and-explore/c/products-and-innovation/mirrorless-versus-dslr-exploring-key-differences), and [Sony shutter explanation](https://www.sony.com/electronics/support/e-mount-body-ilce-9-series/articles/00018997).

Representative conventional DSLR optical viewing is compared with mirrorless sensor live viewing. DSLR live view is an explicit third state, with its electronic path ending at the rear display and the optical eyepiece dark. A representative fully mechanical mirrorless capture closes the initially open shutter before exposure; mirrorless does not mean electronic-only shutter or blackout-free viewing. No camera recommendation or model ranking is implied.

The connected four-bar mirror actuator is a teaching mechanism, not a manufacturer teardown. The sagittal pentaprism has two actual reflecting facets, but transverse roof reflections and orientation correction are not modeled. Focusing-screen scattering, autofocus hardware, lens aberrations and real light speed are omitted. Illustrative thick lens profiles do not claim a real lens prescription. Exposure compensation is a display brightness factor, not a full autoexposure simulation.

## Film and composition

Seven planned chapters, 168 seconds before measured recordings. Each state's rendering comes from `cameraShot(chapter, progress)` and `cameraPose`; paused seeks do not inherit previous simulation state.

| Chapter                      | Planned window | Visible cause                                                                                         | Desktop                                      | Phone                                                                    |
| ---------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| One lens, two routes         | 0–24 s         | The same central ray enters the same lens assembly; the two routes differ inside the body             | Two parallel cutaway objects                 | DSLR first, then mirrorless, each occupying the whole object viewport    |
| Follow the optical route     | 24–48 s        | The ray reaches the 45° mirror, focusing screen and two prism reflections before the eyepiece         | One cutaway with complete vertical path      | The same complete section with CSS-sized labels outside the canvas       |
| The mirror clears the path   | 48–76 s        | Mirror linkage raises; optical view blacks out; first then second curtain traverse the sensor         | Fixed mechanical section and enlarged finder | Same assembly, fixed projection; curtain opening and mirror status below |
| DSLR live view               | 76–100 s       | Returned mirror restores optical viewing, then raised mirror and open shutter supply the rear display | Connected rear-display circuit visible       | Same rear-display route, no fictitious electronic optical eyepiece       |
| A display emits new light    | 100–124 s      | Sensor readout goes through the processor and EVF; compensation changes electronic brightness         | Mirrorless cutaway and finder image          | Single mirrorless object and finder image                                |
| Mirrorless can have curtains | 124–148 s      | Open live-view shutter closes before two-curtain capture; no mirror exists or moves                   | Actual same two curtain boundaries           | Same sensor, curtains, finder blackout and reopening                     |
| Separate the definitions     | 148–168 s      | Optical brightness remains independent of electronic preview compensation                             | Two complete cameras, no numerical dashboard | DSLR followed by mirrorless, current view kept full size                 |

The primary medium is a physical 3D cutaway. A procedural SVG runtime fallback derives the mirror, linkage, prism and path from the same model. The enlarged finder is intentionally illustrative, not a traced lens image. Cyan is electrical readout; yellow is the optical chief-ray route. Fallbacks retain the rear display and the interrupted finder cause. Shared Studio owns offscreen/background pause, reduced-motion behavior, keyboard exploration and disposal. Manual phase sliders provide repeatable static capture states without a private timer.

## Model acceptance and evidence

Author's numerical checks cover mirror reflection, both prism reflection directions, exact hinge and four-bar lengths through the full lift, mirror clearance before exposure, equal exposure windows for every row, live-view path, deterministic seeks and finite extreme inputs. Seven model tests pass, including readout blocked until curtains fully reopen. One additional framing regression projects every visible mesh vertex through the actual camera at sampled capture phases, for both desktop arrangements and a 296×292 px object viewport inside a 320 px phone layout. It caught and repaired a clipped near lens in the initial paired view. A second renderer regression probes actual opaque occluders along every exposed sensor/processor/display connection in all five layouts. The two targeted files now pass nine tests; the owned TypeScript dependency closure also passes a strict ES2023 no-emit check.

This source handoff is author self-review. Full browser stills, normal-speed film observation, native listening to both tracks, physical-phone performance and integrated build checks belong to the integrator's acceptance record; they are not claimed by these model tests.
