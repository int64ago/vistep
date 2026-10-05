# Instant camera: the darkroom inside the sheet

[简体中文](../zh-CN/examples/instant-camera-brief.md)

## Question and chosen system

Is an instant photograph printed by the camera, or does the sheet make its own image? Follow one **Polaroid color i-Type integral sheet** through exposure, a mechanical picker and ejection, pod rupture, reagent spreading, dye migration and elapsed chemical time. The tracked identity is the same exposed sheet; the late dirty/clean comparison replays identical exposure under two processing conditions rather than repairing a damaged print.

This is a color integral Polaroid architecture, not Instax, peel-apart film, monochrome silver-transfer chemistry or an electronic thermal printer. Suggested age 10: the main film needs a distinction between recording light, processing the recorded sheet and waiting for chemistry. Microscopic inventory equations are optional.

## Art direction and independent phone composition

The original cream-polymer camera is opened on its near side. It preserves a continuous folded chief-ray path to the horizontal film plane, a cassette holding successive sheets, an initial picker touching the trailing edge, a co-axial motor/roller shaft and two metal rollers contacting the same moving sheet. The body is an explanatory assembly rather than a dimensional replica of a particular model. The film surface does not display a finished photo during exposure.

After the transport, representation changes to the sheet itself: a plan view shows a front determined by paper coordinate at the nip; an enlarged layer section reveals where the dyes end up; a minute clock accompanies gradual formation of the original red-cup still life. The final controlled comparison uses the same deterministic still life, feeding a single roller spot whose repeats are exactly one circumference apart.

Phone composition keeps the cutaway full-width and gives the nip its own announced close shot. Later chapters use a 160 px sheet plan, full-width layer section, compact print with adjacent chemical clock, or two 110–118 px comparison prints. Labels stay in CSS pixels rather than being scaled with physical geometry. The art occupies 318 px; heading and one current object-state line add roughly 100 px. The integrator must measure the complete bilingual player at 320/390 px and inspect rendered camera corners and contacts.

`InstantCameraDiagram` uses the same paper coordinates, nip centers, pod compression and roller phase as the Three scene. It handles runtime renderer creation/context failure and explicit 2D exploration. It is not evidence that the site's rejected startup browsers run the experiment. The scene has no remote images, live chemistry service or Worker. Studio pauses offscreen and disposes geometry/materials; the scene additionally disposes its generated film texture.

## Planned shared film

Seven 24-second windows plan 168 seconds. The integrator measures both spoken tracks and writes the actual canonical timeline. Chemical elapsed time is explicitly compressed and is independent of film playback seconds.

| Window    | Visible causal event                                                                                                                                                               |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–24 s    | Shutter opens; folded light path reaches the same film through its transparent cover; closure leaves an invisible latent image.                                                    |
| 24–48 s   | Picker initially moves the sheet until the leading edge reaches the nip; rollers take over and the sealed pod approaches contact.                                                  |
| 48–72 s   | Close view shows opposite roller phase, geometric compression and rupture of that same pod; travel continues.                                                                      |
| 72–96 s   | Reagent front grows from the pod edge along the image as the remaining sheet passes the nip.                                                                                       |
| 96–120 s  | Layer section distinguishes transparent cover, receiving layer, processing paste and the negative's CMY systems; inventories move between source, immobilized and receiver states. |
| 120–144 s | Original cup image forms as the displayed chemical clock advances from three to fifteen minutes.                                                                                   |
| 144–168 s | Same exposure is replayed with a single roller spot; repeated poor-coverage marks appear; guidance is to clean before shooting and keep developing film flat/shielded.             |

Feed distances match at chapter boundaries: 0 → 20 → 58 → 130 mm. Rupture occurs at travel 23 mm when the pod center reaches the nip. The finite foil pod sits above the sheet: each profile vertex uses the smallest upper-roller clearance across its adjacent segments, keeping even interpolated faces outside the circular cylinder. Compression shape and the center-at-nip rupture threshold are teaching approximations, not a material or rupture-pressure calculation. The roller chapter therefore begins before rupture. Film clock changes reconstruct the entire state without an independent timer; paused seeks immediately settle camera framing. Physical frame fitting solves perspective bounds for the near body corners, complete paper travel and the explicit nip view at each aspect ratio.

## Geometry and conserved quantities

Published Polaroid dimensions provide an 88.47 × 107.52 mm frame and 76.801 × 78.94 mm image. This teaching sheet uses 21.4 mm of leading wide border, a pod center 9 mm behind its leading edge, 0.32 mm total thickness, 8 mm roller radius and a nominal 0.08 mm reagent layer with 6% reserve. Border position, radius, thickness, reserve, camera dimensions and picker path are teaching choices.

A point on the same sheet is `x = initialLead + travel − u`, `y = filmPlane`, `z = v − width/2`. Opposite roller angles are ±`travel/r`. Nip centers sit at `filmPlane ± (r + thickness/2)`, so their surfaces are tangent to opposite sheet faces. The local gap derives from circular cross-sections; the pod's displayed extra height never exceeds that available gap. Once the pod center reaches the nip, its liquid moves to the spreading bead and sheet; remaining reagent reaches the trailing trap. Pod, bead, spread layer and trap sum to the same total illustrative volume, including the missing coverage in the dirty case.

The dirty spot is tied to a physical roller phase. Its sheet marks fall at `u = 30 mm + n·2πr`; a 4 × 4 mm region loses coverage in this simplified fault. That is a causal example of recurring marks, not a prediction of all roller contamination.

## Chemical model and boundaries

Per-channel CMY inventory starts at 1. Normalized exposure selects an immobilized fraction; its complement can migrate into the receiving layer. Exponential teaching rates (80/180 s), an opacifying veil (160 s) and a late neutralization indicator illustrate different functions while preserving fixed + received + remaining = 1. Unwetted regions never develop. This is not a reaction network or proprietary color recipe, and the color mixing is illustrative. Actual timing, temperature effects, spectral response, aging, lateral diffusion and many sublayers are omitted.

The official color i-Type development range is 10–15 minutes. Keep the film's “chemical elapsed” display visible when compressing that wait. The shield is translucent in the explanatory cutaway, but real freshly ejected film should stay protected from strong light. Do not shake, bend, squeeze or peel it. The scene does not portray shaking as an accelerator. Cleaning is a preparation for another exposure, not a repair for damage already recorded in a print.

## Primary sources

- [Polaroid, process after loading a film pack](https://support.polaroid.com/hc/en-us/articles/115012396647-What-happens-when-I-insert-a-Polaroid-film-pack-into-my-camera): exposure through transparent cover, latent image, roller/pod handling, paste ingredients and dye migration.
- [Polaroid, film construction](https://support.polaroid.com/hc/en-us/articles/115012554908-What-s-inside-a-Polaroid-film-box): negative, transparent cover and bottom-border foil pod.
- [Polaroid, Reclaimed Blue chemistry](https://www.polaroid.com/en_gb/blog/journal/the-reclaimed-blue-story): modern film layer systems and CMY developer layers; this scene does not use the experimental blue formulation.
- [Polaroid Corporation, US 5,449,586](https://patents.justia.com/patent/5449586): integral diffusion transfer, exposure-dependent dye immobilization and receiving-layer image. Historical mechanism reference, not a claim to reproduce current proprietary chemistry.
- [Polaroid, color i-Type specification](https://shop-us.polaroid.com/products/color-itype-instant-film): 10–15 minute development and battery-free i-Type format.
- [Polaroid, precise film dimensions](https://support.polaroid.com/hc/en-us/articles/115012363647-What-are-Polaroid-photo-dimensions): frame and image sizes used in the model.
- [Polaroid, roller cleaning](https://support.polaroid.com/hc/en-us/articles/115012564148-How-do-I-clean-my-camera-rollers): uneven chemistry and repeating defects.
- [Polaroid, shielding and handling](https://support.polaroid.com/hc/en-us/articles/115012519828-How-to-get-the-most-out-of-Polaroid-film), [shaking/pressure defects](https://support.polaroid.com/hc/en-us/articles/4507821657106-Why-do-my-photos-have-distortions-and-blobs-on-them): light sensitivity and wet-layer handling.

Object artwork, still life, choreography and text are original. No source image is copied. Targeted geometry, chemistry, replay and perspective tests are author evidence. Independent browser inspection, continuous playback, both native listening tracks and physical-device performance remain separate integrator evidence.
