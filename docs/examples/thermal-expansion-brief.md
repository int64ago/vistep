# Thermal expansion — author brief

Status: source package, 6×24s speech **draft**. No independent visual acceptance. Full play, browser key shots, complete phone player, listening, failure and device performance not-run by author.

## Misconception / prerequisites / difference

A uniformly heated hole grows rather than being filled inward; both components in a fit need their own temperatures; a restrained rod can have zero size change with nonzero thermal strain. Prior knowledge: length, temperature difference and simple elastic compression. Adds geometry and compatibility to `heat-conduction` and the density change underlying `convection`. No false claim that atoms enlarge or every locally heated hole grows.

## Actual read source and independent checks

Actually read [OpenStax University Physics 2 §1.3](https://openstax.org/books/university-physics-volume-2/pages/1-3-thermal-expansion), including linear expansion, coefficients, holes, 3D approximation and thermal stress. No figures/text copied.

| Claim                                                               | Conditions                                                           | Evidence / counterexample                                                                            |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Every material coordinate scales with1+αΔT, including hole boundary | Isotropic, uniform temperature, free plate, constant α, small strain | Independently transform three circle points; all recover larger hole radius; equal inner/outer scale |
| ΔL=αL₀ΔT                                                            | Same approximation                                                   | Independent1275m steel/55K bridge benchmark →0.8415m                                                 |
| A cold plug and equally hot plug leave different gaps               | No contact force, same aluminium coefficients                        | Radii20mm/19.98mm;100K gives70μm cold or20.05μm hot; latter gap scales with whole body               |
| Fully restrained rod satisfies ε_elastic+ε_thermal=0                | One-dimensional linear elasticity, no buckling/yield                 | Steel100K,200GPa gives−240MPa; cooling reverses sign; free rod stress0                               |
| Volume and density change reciprocally at fixed mass                | Three-axis scale model                                               | Product1; compare exact cubic with first-order3αΔT, not equated as exact                             |

E values70/200GPa are representative linear elastic parameters, not specimen measurements. No atomistic derivation is claimed; molecular anharmonicity is outside this scene's implemented model. Fixed rod is not a real bridge stress predictor.

## Art and shots

A pale machined-metal annulus with initial dashed rims and identity markers, then a fixed-scale microscope gap between blue-grey cold plug and gold rim. Final chapters become a physical clamped-rod apparatus with actual support contact, unchanged reference endpoint and signed force arrows. Plate/rod shape magnifies only thermal increments×100; readouts remain real. Fixed micro camera independently traces actual radii, not exaggerated ring geometry.

1. Uniform heated plate: both rims expand.
2. Cold plug stays while hole rim retreats.
3. Hold plate, heat matching plug: clearance decreases toward scaled initial clearance.
4. Left-located/free-right rod grows on fixed scale.
5. Reset reference, clamp both ends, heat: length fixed and compressive stress builds.
6. Reset reference, same restraints, cool: tensile stress builds.

Desktop stage300px and max-width980px. Separate phone340×235 /190px stage; all text CSS16px, no SVG labels. Qualifications hidden in phone watch, exploration controls44px. Full-player≤740px and longest English/Chinese caption are explicit pending browser checks.

## Checks

Six meaningful model tests cover independent benchmark, circle geometry, mass, fit, compatibility/sign and physical-vs-display magnification; invalid inputs. Scoped TypeScript, MDX compilation and packet dry-run recorded on handoff. Root owns integrated changes and voice after this handoff.
