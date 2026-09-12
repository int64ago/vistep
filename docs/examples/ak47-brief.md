# AK-47: one energy path

[简体中文](../zh-CN/examples/ak47-brief.md)

## Question and visual direction

How does a pulse of gas become a return journey? Begin with a convincing physical object: dark steel, shaped wood, the curved magazine and the gas tube above the barrel. Reveal the casing around the linked gas piston and carrier, then move closer to follow their motion and the continuous return spring. The important observation is that energy input can stop before motion does. The spring stores energy and later gives it back.

The main presentation is a physical 3D object with authored exterior contours, softened edges, metal seams and reinforcing ribs, irregular wood grain and subtle surface roughness. Later chapters intentionally crop the exterior around a declared close view of the moving assembly. The same surface contours and body geometry feed a projected SVG runtime fallback and a separately framed cover. The exterior is a visual reconstruction rather than manufacturing geometry; omitted operating systems cannot be inferred from it.

Phone framing prioritizes the whole object during identification and the connected assembly in later chapters. The comparison places two copies of the physical assembly in one close view, at equal displacement but opposite movement directions. Their two energy strips share the same scale. All explanatory labels are HTML at 16 CSS pixels. Spoken cues name parts and energy colors, rather than desktop-relative directions.

## Planned film

Seven planned 24-second windows total 168 seconds. Recording measurement owns the eventual shared timeline; this table is the authored causal sequence.

| Window    | Chapter                         | New visible observation                                                                                           |
| --------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 0–24 s    | One energy path                 | The complete object reveals the piston rod's fixed connection to the carrier.                                     |
| 24–48 s   | Gas does work                   | A gas-tube highlight accompanies brief energy input and the beginning of movement.                                |
| 48–72 s   | Moving as one                   | Piston rod and carrier move together with constant relative offsets.                                              |
| 72–96 s   | Storing the motion              | Input ends, rearward motion continues and the return spring compresses as elastic energy grows.                   |
| 96–120 s  | Giving energy back              | The spring expands and moves the linked assembly forward, without new input.                                      |
| 120–144 s | Same place, different direction | Two reconstructed states have equal compression and elastic energy, opposite velocity signs and different losses. |
| 144–168 s | One energy journey              | The full excursion ends at a boundary; remaining motion is dissipated and the scene holds.                        |

The exterior begins becoming transparent at chapter progress 0.23 and reaches its inspection state at 0.48. Camera changes ease between views during playback; paused seeks settle directly. Spring geometry is rebuilt from its anchored endpoints and disposed when replaced. The shared Studio owns renderer, visibility and controls lifecycle; the scene releases its procedural textures and listeners.

## Scope and independent calculation

The content is a non-operational mechanical overview. Major connected parts are visible, but feeding, firing, locking, ammunition, real pressures, real operating times, ballistics and firing controls are omitted. Exploration selects observation times or equal-displacement comparisons; it never adjusts weapon performance. Suggested age 12 concerns the prerequisites—motion, stored energy and direction—and is not a rating.

`src/models/ak47.ts` uses a dimensionless generic mass–spring approximation behind the visual explanation, `x″ = f(τ) − x − c x′`. A smooth, single input ends before maximum displacement. Motion, work and damping losses use the same RK4 stages. An exactly located non-rebounding boundary stops the return, with remaining kinetic energy accounted for as dissipation. This is not a firearm impact or operating-cycle prediction.

All energy strips use the same final input work as a fixed denominator and obey `input work = kinetic + elastic + dissipation`. The two comparison times are independently solved for the same displacement. The real-time geometry uses one displacement for the connected carrier and rod; the return spring remains attached at both ends. Gas-tube and piston axes coincide in the authored object, without reproducing calibrated hardware dimensions.

## Sources and provenance

- [Smithsonian National Museum of American History, AK-47 Automatic Rifle](https://americanhistory.si.edu/collections/object/nmah_439260): postwar historical context and gas-operated description. The direct page returned 500 during research on 2026-09-12, while the exact-ID indexed museum text returned the complete historical description.
- [Smithsonian, Soviet AK-47 second model](https://americanhistory.si.edu/collections/nmah_1067460): institution-owned exterior image reference for material separation and silhouette. No photograph is reproduced in the scene.
- [Royal Museums Greenwich, AK-47 family collection object](https://www.rmg.co.uk/collections/objects/rmgc-object-227949): gas operation and wood/metal appearance. This is a Type 56 family object, not a source for exact part geometry.
- [Historical Breechloading Smallarms Association, AKM classification](https://hbsa-uk.org/knowledge-and-research/hbsa-dvd-index-and-content/hbsa-historic-machine-guns-dvd/akm-7-62x39mm-automatic-rifle/): classification of the AK-family long-stroke mechanism; other specifications are outside the scene's scope.
- [OpenStax University Physics Volume 1, §15.2](https://openstax.org/books/university-physics-volume-1/pages/15-2-energy-in-simple-harmonic-motion): general kinetic and elastic energy relationships.

Contours, surface detail, textures and choreography are original code-native art. No museum image or mechanism drawing is copied. Static cover rendering is projected from the same exterior surface and round-part geometry used by the main scene, with a separate camera fit.

## Review boundaries

Author tests cover energy balance, finite-difference velocity and force, non-driven return, equal-displacement comparison, deterministic seeking, finite exterior geometry, spring endpoint connections and projection of actual mesh vertices across full/detail/phone compositions. These are model and geometry evidence. The integration owner separately checks browser stills, complete player height, silent runtime, catalog and social images, recordings and publication. Native listening and physical-device performance must remain explicitly unverified until those checks actually occur.
