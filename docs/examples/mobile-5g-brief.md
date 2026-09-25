# 4G and 5G: where the speed comes from

[简体中文](../zh-CN/examples/mobile-5g-brief.md)

## Question and scope

Where does 5G's speed come from? The reader's starting intuition is that 5G is a "stronger signal", or that a higher generation number is simply faster. The decisive observation is that the downlink rate is a product: resource elements per second (bandwidth) × bits per resource element (limited by SNR) × parallel spatial layers × (1 − overhead). 5G keeps OFDM, mainly widens the channel, reaches higher bands, and uses large arrays to aim beams and run parallel layers. Higher frequencies lose more between single antennas and are blocked more easily; an array of the same physical size wins back the free-space difference but not wall penetration.

The tracked object is one user's data: its resource elements on the time–frequency grid, the constellation point one element carries, and finally that user's share of a shared carrier. Cell selection, handover and paging belong to `cell-handover`; SIM identity, authentication and roaming routes belong to `mobile-roaming`. The suggested starting age is 12: the film needs multiplication, the idea of noise, and waves adding or cancelling; the formula and the decibel arithmetic stay optional.

## Visual direction

A dark signal-laboratory stage with a restrained palette: lavender for 5G/NR and the 3.5 GHz band, sage teal for 4G/LTE, ice blue for 28 GHz, amber for "your" data, and a soft red only for misread symbols. Each chapter shows one instrument, drawn from computed data rather than a shared dashboard: an isometric rate box, sinc spectra folding into a resource grid, a constellation plate with a bits-versus-SNR staircase, a common MHz axis on which the carrier literally widens, a received-level profile along a street with a wall, a computed interference field of an antenna array, stacked spatial layers and a slot timeline, and the shared grid of one carrier.

Desktop and phone are composed separately. SVGs use a 1:1 viewBox measured from the container, so rendered text stays at 16 px; phone variants move labels into stacked rows or legends rather than shrinking the drawing (for example the rate-box factor table, the propagation legend with per-band wall loss, and the two-line sharing result). The beam field is a canvas under an SVG overlay.

## Chapter storyboard

Windows are measured from the recordings; beats are fractions of each window aligned to sentence pauses measured in both tracks (`M5G_BEATS` in the director). The director (`src/models/mobile-5g-film.ts`) is chapter-relative and deterministic.

| Chapter                               | Instrument                      | What changes (model state)                                                                                                                                                                                       | Demonstrates                                                                                                          |
| ------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 01 One phone, two speeds              | Rate box                        | Width 18 → 98.28 MHz occupied (100 → 273 RB), depth 6 → 8 bit/RE, height 2 → 4 layers, each step separately; rate and × factors from the peak-rate formula (151 Mbit/s → 876 Mbit/s → 1.17 Gbit/s → 2.34 Gbit/s) | Rate is a product of three dimensions; the side face is one resource element (bits × layers)                          |
| 02 Cutting the band into subcarriers  | Spectrum → grid                 | Seven sinc spectra appear; a sampling cursor dwells on each centre showing "other subcarriers: 0.00"; the grid (12 subcarriers × 14 symbols) fills with your elements                                            | OFDM orthogonality and the LTE resource block                                                                         |
| 03 A cleaner signal carries more bits | Constellation + staircase       | QPSK → 16 → 64 → 256QAM at 32 dB; SNR 32 → 16 dB with the same seeded noise; red misread points; fallback to 16QAM                                                                                               | Bits per element are limited by SNR; Shannon bound for reference                                                      |
| 04 A wider channel                    | Common MHz axis                 | Your carrier widens 20 → 100 MHz (15 → 30 kHz, 100 → 273 RB); 4G reference shows 5 × 20 MHz aggregation ≈ 2.01 Gbit/s                                                                                            | Wider carrier is the largest factor: ×5.81 = ×5.46 resource elements/s × 1.06 lower NR overhead; honest CA comparison |
| 05 Higher frequency, harder to reach  | Level profile + street          | Single antennas: 28 GHz 18.1 dB lower; same-size base-station panel (16 vs 1024 elements): curves coincide; glass then concrete wall (TR 38.901)                                                                 | Aperture gain cancels free-space frequency loss; penetration does not                                                 |
| 06 An antenna array aims at you       | Field map + computed lobe       | 1 → 4 elements, steer 0 → 30° following the phone, 8 → 16 elements; 8 × 8 = 64 elements = +18.1 dB                                                                                                               | Per-element phase shifts form and steer a beam; gain 10·log₁₀N                                                        |
| 07 Parallel layers and shorter slots  | Layer stack, then slot timeline | 1 → 2 → 4 layers with rate; then 15/30/120 kHz slots with waits 0.70/0.20/0.075 ms for data arriving at 0.3 ms                                                                                                   | Spatial multiplexing (limited by rank); numerology shortens slots                                                     |
| 08 What else limits speed             | Shared carrier grid + shares    | Users 1 → 10 (your long-run share exactly 10%: the first user rotates each slot), 1 Gbit/s backhaul shared, SNR 30 → 12 dB (QPSK), 4G under same conditions                                                      | 58.4 Mbit/s for you vs 10.1 Mbit/s for the 4G estimate; peak ≠ experience                                             |

Speech names the instruments and signals (rate box, level lines, constellation, beam) rather than screen directions.

## Model and conventions

`src/models/mobile-5g.ts` is independent of the drawing:

- TS 38.306 §4.1.2 approximate rate: `v_layers · Q_m · f · R_max · (N_PRB · 12) / T_s^μ · (1 − OH)`, `R_max = 948/1024`, `T_s^μ = 10⁻³/(14 · 2^μ)`, OH 0.14/0.08 (FR1 DL/UL) and 0.18/0.10 (FR2). N_RB from TS 38.101-1/-2 tables; carrier aggregation sums carriers. Test: 100 MHz, 30 kHz, 4 layers, 256QAM = 2337.0 Mbit/s.
- LTE equivalent: same form, 15 kHz, N_RB from TS 36.101, overhead calibrated (≈ 0.192) so 20 MHz, 2 layers, 64QAM = 150.752 Mbit/s (TS 36.213 TBS 75 376 × 2). Against the 4-layer 256QAM TBS peak of 391.656 Mbit/s it gives 402.0 Mbit/s (< 3%, tested). Disclosed as an estimate, not a specification formula.
- OFDM: sinc spectra of rectangular symbols; numerical inner products confirm orthogonality and leakage with offset.
- QAM: Gray-mapped square constellations at unit energy; AWGN with a seeded mulberry32/Box–Muller generator, the same unit draw at every SNR; nearest-point decisions. The teaching modulation threshold is the SNR where the exact uncoded symbol error rate reaches 1% (8.2/15.7/22.1/28.2 dB). Shannon `log₂(1 + SNR)`.
- Propagation: Friis free-space loss; ideal aperture gain `4πA/λ²`; panel side of four half-wavelengths at 3.5 GHz (16 vs 1024 elements); TR 38.901 Table 7.4.3-1 material losses. Levels are relative dB, not a link budget.
- Arrays: half-wavelength ULA factor, steering phases, measured half-power beamwidth, peak sidelobe (≈ −13 dB). The field picture is 2D with cylindrical spreading, equal total power and display-only distance compensation.
- Layers limited by min(Tx, Rx, rank); slot wait to next boundary only.
- Sharing: RB groups (16 RB for 273 RB, 4 for 100 RB) allocated round-robin over 14 symbols; the user's exact share, modulation ratio from the SNR threshold, and an equally shared backhaul; the smaller of radio and backhaul shares wins.

## Model limits

No channel coding, MCS/CQI tables, HARQ, TDD patterns, control-channel scheduling, uplink, channel estimation, multipath fading, rank adaptation, diffraction, rain, body or foliage blockage. The phone has one antenna in the propagation chapter. Layers are an input, not derived from a channel matrix. The sharing view is a comparable teaching model and does not predict measured speed.

## Sources

- [3GPP TS 38.306](https://www.3gpp.org/DynaReport/38306.htm) §4.1.2 — approximate peak data rate.
- [3GPP TS 38.211](https://www.3gpp.org/DynaReport/38211.htm) — numerology, resource grid, modulation mapping.
- [3GPP TS 38.101-1](https://www.3gpp.org/DynaReport/38101-1.htm) / [38.101-2](https://www.3gpp.org/DynaReport/38101-2.htm) — N_RB tables.
- [3GPP TS 36.211](https://www.3gpp.org/DynaReport/36211.htm), [36.213](https://www.3gpp.org/DynaReport/36213.htm), [36.101](https://www.3gpp.org/DynaReport/36101.htm) — LTE grid, TBS tables, N_RB.
- [3GPP TR 38.901](https://www.3gpp.org/DynaReport/38901.htm) — material penetration loss.
- [ITU-R M.2410](https://www.itu.int/pub/R-REP-M.2410) — IMT-2020 peak and user-experienced rate requirements.
- [Ericsson, Advanced antenna systems for 5G networks](https://www.ericsson.com/en/reports-and-papers/white-papers/advanced-antenna-systems-for-5g-networks) — beamforming and MIMO.

The illustrations, choreography and text are original; no source figures are reproduced.

## Evidence

Model tests (`mobile-5g.test.ts`, `mobile-5g-film.test.ts`, `mobile-5g-cover.test.ts`) check formulas and invariants; they are not visual review. Author self-review covered headless-Chrome stills per chapter at 1280, 390 and 320 px in both languages, and exploration views; recordings, listening, full-length playback and physical-device performance are not yet established.
