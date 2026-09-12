# Landmines — production brief

[简体中文](../zh-CN/examples/landmine-brief.md) · [Scene production](../creating-a-scene.md)

The scene follows a realistic, sealed landmine exterior through opaque soil, close views and changing vegetation. Original procedural geometry takes its visible reference from the [Smithsonian National Museum of American History's Model 43 Tellermine](https://americanhistory.si.edu/collections/nmah_407167). It reconstructs a circular casing, closed top cover, rolled edges and attached carrying handle. It is an exterior reference, with no manufacturing scale or working internal mechanism.

The initial ordinary ground hides the object completely. A teaching observation section opens while the mine stays fixed. A full-width soil base remains, with its contact height derived from the casing's lowest point. Uncut soil, grass and leaves share one clipping plane. Close views fit the complete exterior and handle; local soft contact shading replaces a large lighting-dependent receiver plane. Top surfaces use planar texture coordinates to avoid radial camouflage-like repeats, with restrained, fixed coating wear.

The final plan is **7 × 24 seconds = 2:48**, before measured speech. Each chapter has a distinct observation:

| Chapter                                | Visible observation                                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Under the surface                      | An opaque soil section reveals the fixed casing without removing its supporting layer.                                                          |
| A closer exterior view                 | A continuous camera move exposes the closed profile, rolled edges and side handle.                                                              |
| Still outside, energy stored           | A slow exterior orbit accompanies a short qualitative distinction between triggering and stored energy. No pressure action or explosion occurs. |
| Cover changes; the object remains      | The camera returns to the same soil and persistent vegetation positions as cover changes.                                                       |
| Time is not safety evidence            | Four time stages advance while the casing remains and its safety state stays unknown.                                                           |
| Wear is not an answer                  | The camera approaches fixed coating wear and dirt; these details supply no safety verdict.                                                      |
| Keep observation from becoming contact | The view returns to the soil with the basic non-contact and professional-reporting message.                                                     |

The old concept token, three-node main diagram and normalized-energy waveform were removed following the user's explicit request for realistic objects. The scientific model now governs deterministic observation, object identity, continuous camera transitions and persistent uncertainty. It does not predict reactions, blast dynamics, injury ranges, device condition or age-dependent danger. Interaction changes only the exterior view, soil observation layer, vegetation or teaching time.

Both 3D and projected artwork use the same exterior profiles. Narrow screens keep 16 px HTML labels outside the model stage and use 44 px observation controls. The stage is 320 px high at viewport widths of 361–600 px and 250 px high at widths of 360 px or less. The museum reference does not make the illustration a device-identification guide. The planned discovery category is **Weapons & safety**, with a suggested starting age of 12 as editorial guidance.

Primary science and risk sources are [ICRC's enduring-hazard explanation](https://www.icrc.org/en/article/landmines-and-explosive-remnants-enduring-human-cost-measured-decades), [ICRC's community-impact account](https://www.icrc.org/en/article/landmines-impact-communities) and [UNMAS risk education](https://unmas.org/en/news/unmas-south-sudan-provides-life-saving-risk-education-to-sudanese-refugees), accessed 2026-09-12. The closing advice is not to approach or touch suspicious objects and to contact local authorities or professional mine-action organizations.

Targeted checks cover the sealed casing's position below the uncut surface, supporting-soil contact, unchanged identity, replay determinism, camera continuity and projected complete-assembly bounds across desktop and 244/314 px model widths. Root's browser review separately identified and prompted repairs to missing soil support, radial UV artifacts and an oversized shadow-receiver plane. Recorded speech, complete film playback, actual player measurements, resource failures and publication remain integrator responsibilities; no source test certifies native listening or physical-phone performance.
