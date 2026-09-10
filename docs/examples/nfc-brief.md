# NFC: an answer without a battery

[简体中文](../zh-CN/examples/nfc-brief.md)

## Question and scope

How does a tag answer without a battery? Follow one passive tag coil from energy harvesting to the reader's detected reply. The decisive observation is that the tag can send information by switching a load while the reader continues to provide the carrier. Power direction and data direction are different parts of the explanation.

The scope is a passive NFC tag in reader/writer mode, illustrated with an NFC-A 106 kbit/s coding subset. It is not a complete protocol exchange, an implementation of phone card emulation, an antenna design tool, or a payment demonstration. The suggested starting age is 12: the main film requires an intuition for changing fields and binary signals, while circuit equations remain optional.

## Original visual direction

A reader surface and a thin tag form the physical opening. Reveal the tag's copper spiral, its two chip connections and the corresponding reader antenna. Keep the tag's identity through induction, supply and load-switch close-ups. The turning point moves into the circuit: a switch on the tag changes the reader's measured current without introducing another carrier source. The final signal view follows the same `10110010` sequence through the tag switch, reader-current trace and recovered bits.

Desktop can show the object and its current instrument together. A phone gives priority to the causal instrument for that chapter, retaining the coil or chip identity and a short caption instead of stacking a reduced desktop dashboard. Spoken cues name the reader, tag, switch and signal rather than screen directions. The main scene, runtime fallback and cover must preserve the visible coil connections; the integrator reviews actual rendered frames separately.

## Shared film windows

Both assembled language tracks measure **168 seconds**, with seven shared 24-second chapter windows. The canonical `src/data/film-timeline.json` determines the scene's duration. Recording measurement does not establish listening quality; the [NFC review](../qa-nfc.md) keeps that evidence separate.

| Shared window | Chapter                                | New visible observation                                                                                                              |
| ------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 0–24 s        | An answer without a battery            | Gap reduces from 60 to 8 mm; the same tag gains sufficient power, then its internal coil is revealed.                                |
| 24–48 s       | Changing flux induces a voltage        | Track the changing field through the tag coil and the resulting alternating voltage; identify the slowed carrier.                    |
| 48–72 s       | Turn the induced voltage into a supply | Ideal full-wave rectification changes polarity, then stored energy buffers the output between peaks.                                 |
| 72–96 s       | The reader asks through the envelope   | A short Modified Miller example positions carrier pauses; the tag can observe the changing envelope.                                 |
| 96–120 s      | Answer by switching a load             | Hold geometry and carrier fixed; connect and disconnect the tag's extra resistance and compare reader current.                       |
| 120–144 s     | Follow the same bits                   | Manchester-gated subcarrier bursts control the load; corresponding current changes yield the same `10110010` sequence.               |
| 144–168 s     | Why closeness and alignment matter     | Increase gap, restore it, then tilt and restore the tag. Keep the two comparisons distinct and show both power and reply conditions. |

Chapter 7 holds the coils parallel while the gap changes from 8 to 60 mm and returns to 8 mm. It then holds the **minimum body clearance** at 8 mm while tilt changes from 0° to 80° and back. Tilting lifts the centre to prevent contact; the second comparison changes orientation and centre separation together. Do not describe it as rotation about a fixed centre or claim all close NFC arrangements share one cosine law.

Within that last chapter, the gap increases over 0.96–4.80 seconds and returns over 7.44–10.08 seconds. Tilt increases over 10.56–13.44 seconds and returns over 15.36–18.00 seconds. The final six seconds hold the restored geometry for the closing qualification. These positions use chapter progress windows 0.04–0.20 / 0.31–0.42 and 0.44–0.56 / 0.64–0.75 respectively; they establish the visual schedule, not word-level alignment of recorded speech.

## Geometry, circuit and numerical conventions

The physical reader and tag spirals have three and four turns. The mutual-inductance calculation represents them by equal-radius turn equivalents with mean radii 24 and 16 mm. Neumann quadrature integrates their transformed geometry, then multiplies by the turn counts. It neglects spiral pitch, lead fields, copper-layer offsets, finite wire thickness, ferrites, metal and electric-field coupling.

The tag body has a 22 mm half-width and 0.5 mm half-thickness. Its centre height above the reader plane is `gap + 22 mm·sin(tilt) + 0.5 mm·cos(tilt)`. Manual inputs cover 4–60 mm minimum clearance and 0–80° tilt. The default is 8 mm and 0°.

The electrical model uses RMS phasors at 13.56 MHz, with a series-tuned reader and a tag coil feeding a parallel tuning capacitor, a 2 kΩ chip-equivalent RF load and an optional 2.5 kΩ switched load. Reader/tag inductances are 1.4/1.7 μH, resistances are 15/2 Ω, source voltage is 1 V RMS, and both unloaded tuning capacitors follow `C = 1/(ω²L)`. It solves the coupled circuit rather than prescribing an arbitrary signal-strength curve. For the full secondary-loop impedance `Z₂`, the reflected impedance is `(ωM)²/Z₂`. Input power is accounted for by reader loss, tag-coil loss and the two resistive loads.

Chip DC power is **assumed** to equal 45% of the RF power dissipated in the 2 kΩ equivalent load. Both load states must reach the teaching threshold of 0.6 mW, and the magnitude of the two reader RMS-current levels' difference must reach 0.15 mA. These are educational choices, not IC specifications or certification limits. At the default geometry, the model gives about 5.696/3.734 mW DC with the extra load disconnected/connected and an 8.176 mA current difference. Closing the extra load increases reader current from about 23.120 to 31.296 mA while **decreasing** the chip branch's available power; those two quantities must not share an assumed direction of change. At 60 mm parallel clearance, DC powers become about 0.134/0.048 mW and the current difference is 0.142 mA. At 8 mm clearance and 80° tilt, they are about 0.161/0.058 mW and 0.171 mA: a possible signal amplitude alone does not mean the tag has enough power to generate it.

The unloaded DC power can initially increase as the tag moves from 8 to 15 mm because matching also matters. Therefore the film may say coupling weakens and the distant link fails, but must not claim every displayed electrical quantity decreases monotonically with distance.

The supply close-up is a **separate ideal teaching model**, not the nonlinear chip power calculation. It uses a normalized sine, absolute-value full-wave rectification and an ideal peak-charged capacitor with exponential discharge between peaks. It omits diode drops, source impedance and nonlinear load current. Supply storage across the reader's actual ASK gaps is not integrated into the RF link solution.

## Coding and detection

The carrier is 13.56 MHz. Bit rate is `fc/128 = 105,937.5 bit/s`, conventionally called 106 kbit/s; the subcarrier is `fc/16 = 847.5 kHz`. Thus one bit lasts about 9.4395 μs and spans eight subcarrier cycles. A response 1 gates four cycles in its first half-bit; a 0 gates four in its second half-bit. The load switch itself oscillates at the subcarrier rate.

The reader example uses ideal Modified Miller pauses: a 1 has a pause in the middle, a 0 following a 0 has one at the start, and a 0 following a 1 has none. Ideal quarter-bit pauses expose the coding relation while omitting physical edge shaping. `10110010` is transmitted in the displayed time order and does not claim to be a framed command or an NDEF byte.

Response current traces select the actual loaded/unloaded RMS levels on a fixed **10 mA full scale**, preserving the same magnification across different geometries. A separate detector compares the variation in the two half-bit windows at known bit timing; absent or ambiguous symbols remain undecoded. It is a deterministic, noise-free, quasi-static envelope model. It does not solve resonator ring-down, sideband transfer, receiver synchronization, gain control, CRC, parity, framing, selection, anticollision or authentication. Reading data alone does not prove identity or complete payment.

## Primary sources and provenance

- [NFC Forum, NFC Technology](https://nfc-forum.org/learn/nfc-technology/): operating modes, base frequency and passive power transfer.
- [STMicroelectronics, TN1216 ST25 NFC guide](https://www.st.com/resource/en/technical_note/dm00190233-st25-nfc-guide-stmicroelectronics.pdf), §§3.4–3.5: inductive coupling, load modulation, NFC-A envelope signaling, Modified Miller and Manchester/subcarrier coding.
- [NXP, NTAG213/215/216 data sheet](https://www.nxp.com/docs/en/data-sheet/NTAG213_215_216.pdf), §§1.1, 8.1–8.3: antenna-powered chip functions, rectification, field pauses and communication integrity.
- [NXP, PN7150 data sheet](https://www.nxp.com/docs/en/data-sheet/PN7150.pdf): nominal 106 kbit/s as `fc/128`, and the `fc/16` Manchester-coded return subcarrier.
- [Richard Fletcher, MIT thesis](https://cba.mit.edu/docs/theses/02.09.fletcher.pdf), Fig. 67: the Neumann contour integral used for ideal filamentary mutual inductance.
- [NXP, OM29263ADK antenna design explanation](https://community.nxp.com/t5/NXP-Designs-Knowledge-Base/Design-your-NFC-Antenna-with-NXP-s-OM29263ADK-development-kit/ta-p/1122234): geometry, mutual inductance and coupling.
- [Texas Instruments, NFC/RFID reader operation](https://www.ti.com/document-viewer/lit/html/SSZTCT7/GUID-956584C2-772D-4CBA-B5F0-8D661F90763F): passive power, reader commands and tag load modulation.
- [Texas Instruments, Antenna Design Guide for the TRF79xxA](https://www.ti.com/lit/an/sloa241b/sloa241b.pdf), §1: antenna bandwidth, metal, ferrite and final-enclosure tuning limits.

These sources support the engineering. The choreography, text, object artwork and signal illustrations are original work; source figures are not reproduced. Circuit component values, thresholds and capacitor visual constants are disclosed teaching choices rather than copied hardware specifications.

## Integration and evidence

`src/models/nfc.ts` owns the coupled circuit and coding; `src/models/nfc-film.ts` owns chapter state and the ideal rectifier inset; `src/models/nfc-geometry.ts` owns the physical spiral paths. Both articles have `understand`, `try` and `deeper` anchors. The integration owner coordinates registration, discovery metadata, translations, narration, covers and source catalogs.

This brief records the explanation and conventions. Model tests, actual browser stills, complete playback, recorded speech, independent transcription, native listening and physical-device performance are separate evidence categories. None is established by the production plan; the [NFC review](../qa-nfc.md) records completed checks and remaining limits before the authorized release.
