# Atomic bomb: the fission chain reaction

[简体中文](../zh-CN/examples/atomic-bomb-brief.md)

## Question and causal argument

Why does a lump of uranium explode once it is big enough? Follow one neutron: it is absorbed, the nucleus splits like a charged drop, fragments land higher on the binding-energy curve and the surplus becomes about 173 MeV of motion. Each fission frees two or three neutrons; if k of them cause another fission, generation g holds k^g neutrons about 10 ns apart. Production grows with volume while leakage grows with surface, so k rises with size and crosses 1 at a critical radius. A reactor holds k near 1 and relies on delayed neutrons for time; an explosive chain uses prompt neutrons and stops itself when the heated material expands and its density falls.

The scene stays with textbook physics. It gives no material sizes, masses, assembly methods or device layouts; all lengths are in neutron mean free paths, and the collision ratios are illustrative.

## Visual direction

A dark cloud-chamber stage with warm, luminous traces. Chapter views:

- Chapter 1: a liquid-drop nucleus (SVG) absorbs a neutron, deforms with a smooth waist, necks and separates into Ba-141 and Kr-92 with three prompt neutrons; fragment radii scale with A^(1/3).
- Chapter 2: the binding-energy curve from the semi-empirical mass formula (pairing term omitted), with measured markers for Fe-56, U-235, Ba-141 and Kr-92 and a bracket showing the per-nucleon gain.
- Chapter 3: a family tree of the no-leakage walk, seven generations of real fission and capture events, beside a log plot of k∞^g to 80 generations.
- Chapters 4, 5 and 7: a sphere section drawn on canvas, a three-dimensional random walk projected onto the picture plane with fission bursts, capture dots and blue leak marks with short outward tails, beside the one-group k(R) gauge with the critical radius and a marker at the current radius.
- Chapter 6: a log–log plot of neutron number against time for k = 1.001 with prompt neutrons only, k = 1.001 with delayed neutrons and k = 1.5 with 10 ns generations.

Desktop puts the sphere or tree beside its gauge or graph; the phone stacks the current causal view above a compact gauge. Text stays 16 px in CSS pixels and controls are 44 px high.

## Planned film

Seven chapters with 24 s planned windows (168 s); the generator remeasures both languages.

| Window    | Chapter                     | Visible causal change                                                                                   |
| --------- | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| 0–24 s    | One neutron, one drop       | Neutron approaches, absorption, deformation 0 → 1, fragments and three neutrons fly apart, 173 MeV.     |
| 24–48 s   | Energy from binding energy  | Curve draws, markers appear, the per-nucleon gain bracket and the chemical comparison.                  |
| 48–72 s   | Generation after generation | Tree grows generation by generation (1, 2, 2, 5, 12, 25, 55), then the log graph extends to 80.         |
| 72–96 s   | Small sphere: neutrons leak | R = 1.6 λ, k ≈ 0.67; the prepared walk dies after four generations (counts 1, 2, 2, 2) with four leaks. |
| 96–120 s  | Large sphere: past critical | R grows 1.6 → 4.5 λ along the gauge; marker crosses k = 1 at 2.5 λ; the walk grows past 300 neutrons.   |
| 120–144 s | Reactor and bomb            | Three growth curves reveal along the log time axis.                                                     |
| 144–168 s | Why it stops                | Finished traces ride the expanding sphere (×1.6), the marker slides back below k = 1, a new walk dies.  |

## Model

- Binding: Bethe–Weizsäcker coefficients 15.75, 17.8, 0.711, 23.7, 11.18 MeV (Rohlf); markers from AME2020 masses. Q for n + U-235 → Ba-141 + Kr-92 + 3n = 173.28 MeV, 0.079% of the mass.
- Multiplication: per collision 0.72 scatter, 0.25 fission, 0.03 capture, ν = 2.4 → k∞ = 2.143, L² = 1.190 λ², d = 0.71 λ, R꜀ = 2.496 λ; k(1.6) = 0.669, k(4.5) = 1.496.
- Walk: exponential flights, isotropic scattering, counter-addressed random numbers (seed, neutron, step); children start at the parent's fission point; deterministic seed search for the film's three chains. Power-iteration transport estimate at 4.5 λ: k ≈ 1.51–1.54 depending on the sample (seed 23, 500 histories × 8 batches gives 1.544) versus 1.50 from diffusion.
- Growth: k^g; delayed group β = 0.0065, τd = 12.5 s, prompt lifetime 10⁻⁴ s (thermal reactor) → effective 0.081 s; explosive regime 10⁻⁸ s.
- Expansion: fixed mass, radius in λ scales as 1/s²; stopping scale for 4.5 λ is 1.343.

## Sources

- [OpenStax, Nuclear Binding Energy](https://openstax.org/books/university-physics-volume-3/pages/10-2-nuclear-binding-energy)
- [OpenStax, Fission](https://openstax.org/books/university-physics-volume-3/pages/10-5-fission)
- [MIT OCW 22.05 lecture notes](https://ocw.mit.edu/courses/22-05-neutron-science-and-reactor-physics-fall-2009/pages/lecture-notes/)
- [Delayed neutrons](https://www.nuclear-power.com/nuclear-power/fission/delayed-neutrons/)
- [AME2020 atomic masses](https://www-nds.iaea.org/amdc/ame2020/mass_1.mas20.txt)

## Status

Model, director, instrument and cover tests exist; rasterized stills of every chapter at 860 px and 360 px were inspected by the author. Integration, recordings, browser playback, listening and physical-device review are separate work.
