# Hydrogen bomb: thermonuclear fusion

[简体中文](../zh-CN/examples/hydrogen-bomb-brief.md)

## Question and causal argument

Fusing two light nuclei releases far more energy per nucleon than fission, so why does lighting fusion need a fission explosion first? Follow one tritium nucleus toward a deuterium nucleus: the Coulomb barrier turns it back at every attainable temperature, tunnelling gives a tiny, steeply energy-dependent chance of passing through, and the Maxwell tail multiplied by that chance forms the Gamow peak. The reactivity ⟨σv⟩ therefore climbs by thousands over a few times in temperature. A chemical flame is zero on that scale; only a fission fireball reaches the required temperature and radiation, and compression makes the fuel burn before it flies apart. The fuel breeds its own tritium from lithium-6, and the same reaction can be confined by gravity, magnetic fields or inertia.

## Content boundary

The scene explains textbook nuclear and plasma physics. It states the public concept that a fission primary's radiation heats and compresses separately placed fusion fuel, and nothing more: no geometry, dimensions, materials, radiation channels, stage structure, yields or fuel quantities. The compression model fixes an arbitrary fuel mass at cryogenic D–T density and describes scaling only.

## Visual direction

A luminous plasma language on a deep blue-violet ground, distinct from the fission scene's dark chamber. Every chapter has one instrument:

1. **Barrier**: the Coulomb hill sampled from the model on a logarithmic separation axis (1 fm to 10⁷ fm), a tritium nucleus rolling out and back on a distance rail and on the hill, the energy line at 3kT/2, the turning point, and a faint tunnelled twin with its probability.
2. **Binding**: the binding-energy curve on a logarithmic A axis; D and T lifted to helium-4; per-nucleon bars for D–T versus uranium fission.
3. **Distribution**: the Maxwell energy distribution normalised to its peak, the tunnelling probability on a logarithmic right axis, and their product forming the Gamow peak; a needle stands in for the flame's invisible spike.
4. **Rate**: ⟨σv⟩ on a log–log chart with D–T and D–D curves, a moving marker, and reference lines for the Sun's core and 10⁸ K.
5. **Compression**: a logarithmic temperature ladder (flame, Sun's core, fission fireball), a fuel sphere shrinking as C^(−1/3), and readouts for density, rate ∝ n² and the burned fraction.
6. **Fuel**: the reaction chain D + T → ⁴He + n, the tracked 14 MeV neutron, n + ⁶Li → T + ⁴He, and the new tritium returning.
7. **Confinement**: density against confinement time on log axes with the 10 keV ignition line, revealing tokamak, inertial and solar points.

Desktop uses a 440 px stage with side labels and kelvin equivalents; the phone composition (below 600 px) uses a 372 px stage, moves the temperature ladder to a horizontal rail, drops secondary tick labels and keeps 16 px SVG text. Exploration offers the seven views, D–T/D–D, a logarithmic temperature slider from 3000 K to 100 keV and a compression slider from ×1 to ×1000.

## Measured film

Seven chapters were planned at 24 s each; the recorded speech measured **210 s** in both languages, with chapter starts at 0, 27, 56.5, 84.5, 113, 145 and 175.5 s (`src/data/film-timeline.json`). Duration measurement does not establish listening quality.

| Chapter | Visible causal change                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1       | Three approaches at 3000 K, the Sun's core and 10 keV each turn back farther than contact; the tunnelled twin appears with its probability |
| 2       | D and T marked on the curve, lifted to ⁴He with 17.59 MeV, then per-nucleon comparison with fission                                        |
| 3       | Temperature rises from a needle at 3000 K through the Sun's core to 10 keV; the tunnelling curve and the Gamow peak appear                 |
| 4       | The rate marker climbs from 1 keV to 30 keV past the Sun's core and 10⁸ K references                                                       |
| 5       | The flame marker stays put; the fireball reaches 10 keV; the same fuel is compressed ×1000 and its burned share rises                      |
| 6       | The tracked neutron leaves the D–T reaction, breeds tritium from ⁶Li, and the new tritium returns                                          |
| 7       | Tokamak, inertial and solar points appear against the ignition line                                                                        |

## Model

- Binding energies from AME2020: Q(D + T) = 17.59 MeV, neutron 14.05 MeV, alpha 3.54 MeV; Q(n + ⁶Li) = 4.78 MeV.
- Coulomb potential 1.44 MeV·fm / r; contact at 1.2(2^{1/3} + 3^{1/3}) = 3.24 fm; barrier 0.444 MeV.
- Gamow energy E_G = 2 m_r c² (πα)² = 1182 keV (D–T), 986 keV (D–D); tunnelling exp(−√(E_G/E)).
- Maxwell relative-energy density and its tail as the incomplete gamma function; Gamow peak E₀ = (E_G (kT)²/4)^{1/3}.
- Reactivity: Bosch & Hale 1992 parametrisation, checked against the published table at 1, 2, 5, 10, 20, 50 and 100 keV; below 0.2 keV extrapolated with T^{−2/3} exp(−3E₀/kT) anchored at 0.2 keV.
- Burn: f = ρR/(ρR + H_B), H_B = 8 m_i c_s/⟨σv⟩ with c_s = √(2kT/m_i); the same mass compressed by C gives ρR ∝ C^{2/3}.
- Lawson reference nTτ ≈ 3×10²¹ keV·s/m³ at 10 keV; example points are order-of-magnitude public figures.

## Sources

- [NRL Plasma Formulary](https://library.psfc.mit.edu/catalog/online_pubs/NRL_FORMULARY_19.pdf)
- [Bosch & Hale, Nuclear Fusion 32 (1992) 611](https://doi.org/10.1088/0029-5515/32/4/I07)
- [OpenStax University Physics 3, 10.6](https://openstax.org/books/university-physics-volume-3/pages/10-6-nuclear-fusion)
- [IAEA AMDC, AME2020](https://www-nds.iaea.org/amdc/)
- [LLNL, NIF ignition](https://www.llnl.gov/news/national-ignition-facility-achieves-fusion-ignition)
- Atzeni & Meyer-ter-Vehn, _The Physics of Inertial Fusion_, chapter 2 (burn fraction).

## Integration and review status

Model in `src/models/hydrogen-bomb.ts`, director in `src/models/hydrogen-bomb-film.ts`, cover geometry in `src/models/hydrogen-bomb-cover.ts`, experiment in `src/components/experiments/HydrogenBomb.tsx`. The integration owner registers the packet, records speech, measures the timeline and performs browser review. Author self-review is recorded in `drafts/hydrogen-bomb/review.md`; no browser stills, listening or physical-device evidence is claimed here.
