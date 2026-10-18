# Independent modern-physics model and state review

Date: 2026-10-18. Reviewer: mechanics-scene agent, independent of the original modern-physics implementation.

## Scope and evidence

Reviewed the eleven requested groups: Photoelectric, Blackbody, OilDrop, AtomicScattering, CathodeRay, AtomicSpectrum, MatterWave, RadiationEvidence, DecayMeasurement, NuclearEvidence and ParticleEvidence. This is a source, numerical and React interaction review. It is **not** a browser screenshot review, full playback, narration listening, or physical-device performance acceptance.

The source review traced each exploration state into automatic-film arguments and checked SI conversions, limiting controls, apparatus rays, readouts and explicit model approximations. Independent constants were checked against [NIST 2022 CODATA](https://physics.nist.gov/cuu/pdf/all.pdf). Existing model formulas were cross-checked with independent Python Decimal calculations, numerical quadrature or differential-equation solvers rather than only inverse round trips.

## Confirmed defects repaired

- ParticleEvidence: background-only exploration previously removed the expected resonance peak from replay. Automatic playback now restores signal plus background.
- DecayMeasurement: resampling the simulated ensemble previously changed replay. Automatic playback now restores the authored seed 23.
- Photoelectric zinc: zero intensity previously retained visible light, five emitted electrons and electroscope-leaf closure. Zero photon flux now gives no emission/current, no illuminated beam and unchanged charged leaves; nonzero intensity changes the illustrative rate. The underlying maximum energy remains a frequency/material property. The corresponding dark-state explanation no longer incorrectly says that an above-threshold frequency is below threshold.
- AtomicSpectrum: sodium zoom, solar comparison-line reveal and microwave frequency no longer share the incorrect optical-frequency control label.
- MatterWave: foil scattering rays now use the same outer powder-ring radius and 100 mm distance as the screen model. Laue crystal-angle magnitude uses the same 1.2 rad sweep as the reciprocal-lattice calculation. The reflection-angle arc follows the current angle.
- RadiationEvidence: exactly zero magnetic field no longer shows a direction-symbol grid implying a field.

## Independent numerical checks

| Quantity                      | Independent reference / invariant                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 800 THz, 2.1 eV work function | stopping voltage 1.208534157539 V; dark current zero; zero current at -1.209 V                                                                                                                                                                    |
| 0.8 micrometre oil drop, 4e   | effective weight 1.80494527588×10⁻¹⁴ N; balance 140.819778979 V; unforced terminal descent 66.129365255 micrometres/s                                                                                                                             |
| Blackbody Bλ                  | logarithmic wavelength integration from 50 to 20000 nm agrees within 10⁻⁶ relative with independently integrated dimensionless Planck fraction times σT⁴/π, for 2500, 5800 and 8000 K; local maximum agrees with Wien                             |
| 200 V electron, 1 mT          | radius 47.689118722 mm; crossed-field screen intersections checked with independent 1 ps Lorentz RK4, including electric-only, magnetic-only and balanced endpoint fields                                                                         |
| Rutherford paths              | independent RK4 at dt=0.002 agrees with the production Verlet trajectory within 0.002 display-distance units for all four shown impact parameters                                                                                                 |
| Compton scattering            | 90° shift 2.426310235380 pm; 180° shift 4.852620470761 pm; 71 pm incident beam gives 1117.155754598 eV backscatter recoil                                                                                                                         |
| Balmer / microwave            | Hα 656.469626700 nm, Hβ 486.273797556 nm under the stated reduced-mass Rydberg model; Lorentzian resonance at 1057.8 MHz and half maximum ±50 MHz                                                                                                 |
| Matter waves                  | 2 and 7 kV: λ=27.396924159 and 14.608649660 pm; outer rings at 100 mm: 22.698422944 and 11.940205564 mm; coherent-plane peak and first null; all Laue spots reconstructed from screen direction and reciprocal indices                            |
| Radiation                     | 5 MeV α and 2 MeV β⁻ in 0.3 T: radii 1.073681430 m and 27.335065532 mm; field reversal mirrors paths, zero field is straight; 12 kV X-ray cutoff 103.320165361 pm                                                                                 |
| Expansion chamber             | unexpanded supersaturation 0.9; 1.25 volume ratio gives 268.117951945 K and supersaturation >3                                                                                                                                                    |
| Decay / tracer                | independent three-compartment RK4 over 20 days agrees to 11 decimal places and retains total radioactive survival; 11460-year carbon with 10% modern carbon gives ratio 0.325 and apparent age 9291.128398756 years                               |
| Nuclear reactions             | energy and both momentum components conserved for 0–160° at 2, 7.7 and 10 MeV; maximum 5 MeV neutron energy transfer is 5 MeV to H and 1.244444444 MeV to mass 14; fission A and Z balance                                                        |
| Particle evidence             | pair threshold 1.0219979 MeV; selected Be7 ground-branch recoil 56.951456350 eV; retarding voltage cuts off at the recoil energy per charge; back-to-back 62.5 GeV photons yield 125 GeV/c²; parity hemisphere fractions independently integrated |

## Tests and remaining limits

Added `src/models/modern-independent-benchmarks.test.ts` (12 cases) and `src/components/experiments/modern-control-state.test.tsx` (14 cases). React tests mutate exploration controls then replay all eleven groups and compare actual artwork inputs; additional tests cover dark zinc, control labels and computed foil-ray geometry. These are behavioral tests, not pixel or narration acceptance.

Focused batch on the six existing modern model suites, new numerical/state suites, and the earlier two optics suites: **10 files, 67 tests passed**. No global build, voice generation, shared registration change or commit was performed here.

Disclosed approximations remain: Rutherford trajectories start at finite distance while the ≈ angle readout assumes infinite approach (about 0.7–1.35° difference in the four displayed paths); the MDX explicitly states this. Oil motion/leaf angles and spectrometer geometry use visible display scales. Lorentz trajectories are nonrelativistic at the shown low accelerating voltages. Radiation detector responses, resonance bins and chain expectations are teaching models, not reconstructed experimental datasets. The neutron and reaction models use stated approximate masses. The local plane-phase control is an explicit teaching-state comparison, not an independently adjustable phase in a fixed real crystal.

## Reviewed working-tree hashes

- `src/models/modern-labs.ts`: `3eef0d41b2b11dbc`
- `src/models/matter-wave-lab.ts`: `e1e5e304be8bceba`
- `src/models/radiation-evidence.ts`: `05d8c3821e47cd1f`
- `src/models/decay-measurement.ts`: `0b4aa0325a0564e7`
- `src/models/nuclear-evidence.ts`: `4edfe686b3051819`
- `src/models/particle-evidence.ts`: `c83279fe72a1e35a`
- `src/components/experiments/ModernLab.tsx`: `33fe8b028c6492b5`
- `src/components/experiments/ModernPhysicsSeries.tsx`: `d4f2edc44c0ee829`
- `src/components/experiments/PhotoelectricLab.tsx`: `1e628b0fb10cd595`
- `src/components/experiments/BlackbodyLab.tsx`: `d4c9a32de5df291f`
- `src/components/experiments/OilDropLab.tsx`: `c285e57729a80694`
- `src/components/experiments/AtomicScatteringLab.tsx`: `13715a15de02b3ba`
- `src/components/experiments/CathodeRayLab.tsx`: `85bafad77137a2bb`
- `src/components/experiments/AtomicSpectrumLab.tsx`: `34da2d7cfb5196b5`
- `src/components/experiments/MatterWaveLab.tsx`: `1d45b47f65d99357`
- `src/components/experiments/RadiationEvidenceLab.tsx`: `a6ccd76f182d3aa4`
- `src/components/experiments/DecayMeasurementLab.tsx`: `878537f74428c9cb`
- `src/components/experiments/NuclearEvidenceLab.tsx`: `27227bfe8274a6b2`
- `src/components/experiments/ParticleEvidenceLab.tsx`: `182b25b9de67f91e`
