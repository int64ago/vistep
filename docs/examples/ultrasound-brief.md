# Ultrasound — a pulse-echo imaging bench

[简体中文](../zh-CN/examples/ultrasound-brief.md)

## Question and art direction

How can a returning sound become a location, and how can many such locations become an image? This scene follows a finite pulse from a credible probe section through a known manufactured phantom, then connects the same delayed echoes to an A-line and a mechanically acquired B-mode cross section.

The bench uses a pale sage phantom, an ink-teal scope, gold envelopes and mint returning packets. The probe has connected backing, piezoelectric element, matching face, coupling strip and cable. These are a schematic of ideal matched contact, not an electromechanical transducer simulation. The phantom is deliberately rectangular: its horizontal interfaces are exactly the interfaces supported by the normal-incidence model. Vertical walls are drawn only in the known specimen, and are explicitly excluded from the calculated scan. No anatomy, speckle texture, fake depth decoration or unrelated 3D geometry is used.

The composition changes with the question: pulse and travel ruler; an energy split; center-aligned RF returns; a growing scan; two resolution traces; attenuation shadow; calibration error. A single current explanation stays beside the relevant instrument. The film remains explanatory without narration audio.

## Frozen film

Eight 22-second chapters form a **176-second** film. The packet's separately authored Chinese and English scripts, captions, cue IDs, chapter count and director timing are frozen. No narration, caption or timing changes were made after the stable-packet notification. Parent integration owns synthesis and any measured expansion of chapter windows.

| Start | Chapter                                   | Visible causal observation                                                                                                                                                                      |
| ----- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 s   | Send a finite pulse                       | A two-cycle, 3 MHz pulse leaves the matched probe; the carrier's finite support matches the moving packet. The first boundary return reaches the probe.                                         |
| 22 s  | Locate a boundary by its delay            | Three returns accumulate at the actual delays for the 12, 40 and 56 mm interfaces. The physical packet and the A-line use the same travel-time calculation.                                     |
| 44 s  | Reflect some, transmit the rest           | At the first interface, a returning packet separates from the transmitted packet. Intensity fractions show about 1.38% reflection and 98.62% transmission.                                      |
| 66 s  | A negative echo can still be bright       | The positive 12 mm echo and negative 40 mm echo are aligned at their centers. RF reverses sign while both coherent envelopes remain nonnegative.                                                |
| 88 s  | One A-line becomes one image column       | Seventy-three stationary probe positions, spaced 0.5 mm apart, each finish a record before its column is revealed. Foil faces and insert boundaries emerge from calculated data.                |
| 110 s | Shorten the pulse to separate neighbors   | An eight-cycle reference stays above a pulse shortening from eight to two cycles. The same 0.64 mm foil changes from a merged return to two envelope peaks.                                     |
| 132 s | A bright face with a darker region behind | Extra insert loss increases from zero to 2.2 dB/(cm·MHz). Its near-face echo stays fixed while returns from behind it lose amplitude on both legs.                                              |
| 154 s | An assumed speed moves the image          | Actual phantom speed is 1480 m/s. Correcting the reconstruction speed from 1700 to 1480 moves the 56 mm interface from 64.32 mm back to its true depth without changing any acquired echo time. |

Every chapter is an independently reconstructible teaching experiment. Smoothstep chapter progress includes short entry and exit holds. Changes between chapters are editorial cuts, not claims that the phantom spontaneously changes properties. The scan uses deterministic sample-and-hold probe positions; its final record stays complete. There is no accumulated frame history, randomness, separate playback loop or narration-length padding.

## Independent physical model

Units are mm, µs, MHz, MRayl, m/s and dB/(cm·MHz). The manufactured phantom has horizontal interfaces at depths 12, 40 and 56 mm, within a 64 mm model extent. Impedances from top to bottom are 1.5, 1.9, 1.6 and 2.3 MRayl. A foil occupies x from −15 to −3 mm and depths 27 to 27.64 mm, with impedance 2.7 MRayl. An insert occupies x from 6 to 15 mm and depths 20 to 28 mm, with impedance 4.8 MRayl. Ordinary chapters use the same actual speed, 1540 m/s, in every material. These illustrative materials are not asserted measured tissue properties; equal speed and different impedance imply different densities.

Each probe position uses one independent vertical column. The model retains primary interface reflections and all forward/return pressure transmissions. It omits propagation between columns, vertical-wall scattering, refraction, diffraction, finite beamwidth, beamforming, speckle and multiple reflections. The direct image of the specimen is generated from the same column function as the echoes. This is a single-scattering teaching model of a manufactured test piece, not a clinical image simulator.

For a boundary between Z₁ and Z₂, signed pressure reflection is r = (Z₂−Z₁)/(Z₂+Z₁), forward pressure transmission is t₁₂ = 2Z₂/(Z₁+Z₂), and reverse transmission is t₂₁ = 2Z₁/(Z₁+Z₂). Reflected intensity fraction R = r² and transmitted fraction T = (Z₁/Z₂)t₁₂² = t₁₂t₂₁ satisfy R + T = 1 at the lossless boundary. A pressure transmission coefficient above one does not violate this energy convention.

For interface j, its echo-center delay is twice the sum of each preceding layer's thickness divided by its actual speed. Its amplitude is rⱼ multiplied by t₁₂t₂₁ for every overlying boundary, then by 10^(−2D/20), where D is one-way accumulated attenuation in dB. Background attenuation is 0.35 dB/(cm·MHz); the insert adds the chosen extra value. These are declared teaching parameters. Attenuation is evaluated at the 3 MHz carrier frequency and held constant across pulse bandwidth. Thus a 6 dB two-way loss multiplies pressure by 10^(−6/20), and intensity by 10^(−6/10).

The pulse is a finite Hann-windowed carrier with support duration τ = cycles/frequency. Time zero is the **transmit envelope center**, so its leading half occurs at negative time. This convention avoids a half-pulse depth offset. The received RF is the sum of signed, delayed pulse replicas. Envelope magnitude is calculated after coherent addition of ideal known quadratures; it is not a sum of absolute echo amplitudes, and is not claimed to be the exact Hilbert transform of a compact real pulse. Packet extents and positions use inverse integrated travel time on this same column, including early/late finite pulse edges and returns at the probe face.

The foil comparison keeps peak transmitted pressure fixed, not total pulse energy. Its nominal support-based separation scale cτ/2 is 0.513 mm for two cycles and 2.053 mm for eight. The actual sampled coherent envelope has two peaks for the former and one for the latter with this foil's thickness and phase. The scale is not a universal resolution or FWHM promise: envelope, phase, bandwidth and noise also matter. No signal-to-noise or clinical performance claim is made.

## Image reconstruction

Each of 73 columns represents a complete A-line at x = −18 + 0.5k mm. Each of 351 image rows represents a depth-cell center in a fixed 0–70 mm display range. Sample time is twice that depth divided by the assumed reconstruction speed. Pixel brightness is the same line's coherent envelope converted with 20 log₁₀, a fixed pressure reference of 0.25 and a 45 dB display range. Zero signal is black. No per-column normalization, arbitrary phantom paint, automatic gain, imported texture or noise is added.

The image axis extends half a lateral sample beyond the outermost probe centers, so probe, image columns and selected cursor align at pixel centers. Scanning reveals completed columns from the same complete deterministic buffer; it does not synthesize an independent animation of an image. The attenuation comparison changes the insert's physical loss only. The speed comparison changes the depth interpretation only; its original echo records remain unchanged.

Canvas draws that pixel buffer without smoothing. If a 2D context or image-data write is unavailable, SVG draws the same 8-bit gray pixels, merging only adjacent cells with identical values. This is a real equivalent data fallback, not an empty panel or explanatory placeholder. The cover uses a smaller reconstruction from the same model alongside its known phantom.

## Primary technical sources and assets

Read during production on 2026-09-05:

- [University of Michigan — Ultrasound and Photoacoustic Imaging](https://socr.umich.edu/BPAD1/BPAD1_notes/BPAD1_Chap03_UltrasoundPhotoacoustic.html): signed pressure reflection, impedance-correct energy transmission, pressure-versus-intensity decibel convention, pulse echo and envelope imaging.
- [University of Washington — BEE 531 Ultrasound Pulse-echo](https://staff.washington.edu/mbruce/pres/pulse_echo.html): pulse-duration/axial-separation relation, RF/IQ signal path and log-compressed B-mode display.
- [Evident — A-scans and Cross-sectional B-scans](https://ims.evidentscientific.com/en/learn/ndt-tutorials/instrumententation/phased-array-scans): complete A-scan records mapped by probe position into brightness/depth cross sections. This scene uses the mechanically scanned cross-section concept, not phased-array beamforming.

All art, geometry and signal traces are original procedural output. No third-party visual assets, downloaded media or `public/ultrasound/` assets are required.

## Phone, exploration and lifecycle

Desktop pairs specimen and scope/scan, then uses a wide instrument for the two-pulse comparison. Phone has its own 320-unit layout: pulse/range/split pair a compact 277-unit specimen with a short scope or energy readout; polarity shows only its aligned echoes; scan/shadow/speed show only the scan with its probe-position strip; resolution shows only the two-row comparison. Secondary instruments disappear rather than stacking. The stage reserves 423 CSS px, with the current explanation and compact measurement below. The intended whole watch-stage budget is below roughly 900 px at a 320 px viewport. This is a design budget, not a measured browser or physical-phone result.

Body text is at least 16 px and primary targets at least 44 px. Native ranges use explicitly translated accessible labels through the existing `Range` component. Five parameter families cover probe position, cycle count, insert attenuation, assumed speed and observation time. Only inputs relevant to the selected view are shown: default manual bench shows four named ranges, the insert loss appears when its column is relevant, and resolution focuses on cycle count. Arrow keys, Home and End retain native behavior. Reset restores all values and view: x = 0, two cycles, extra loss 2.2, assumed speed 1540, time 18 µs and bench mode. Both experiment presets also start from a complete reset. The model disclosure explains conventions and omissions.

`useShowcase` supplies chapter and normalized progress; seeking and replay reconstruct the scene without frame history. Shared playback supplies pause, reduced motion and offscreen/background suspension. No scene audio engine, timer, animation loop, WebGL context or Worker is created. Canvas cleanup clears its context; `useCompact` owns and removes its shared media-query listener. SVG remains a complete fallback.

## Implementation and integration

- `src/models/ultrasound.ts`
- `src/models/ultrasound.test.ts`
- `src/components/experiments/Ultrasound.tsx`
- `src/components/lab/UltrasoundBench.tsx`
- `src/styles/ultrasound.css`
- `src/components/covers/UltrasoundCover.astro`
- `src/content/ultrasound.mdx`
- `src/content/en/ultrasound.mdx`
- `docs/examples/ultrasound-brief.md`
- `docs/zh-CN/examples/ultrasound-brief.md`
- `src/data/narration.json`

The scene is registered in `src/data/topics.ts`, with authored bilingual cues in `src/data/narration.json`, measured windows in `src/data/film-timeline.json` and assets in `src/data/audio-tracks.json`. Authored wording was frozen before synthesis; measured integration is recorded below.

## Evidence and remaining review

- `pnpm exec vitest run src/models/ultrasound.test.ts`: **14 passed** on Node 24.19.0 / Vitest 5.0.0. Checks cover pressure sign, energy conservation, heterogeneous-speed arrival times, both transmissions, two-way dB conventions, finite support and coherent polarity, zero signal, speed-assumption error, actual foil peak separation, insert shadow, all calculated image pixels, independently known image depths, packet travel geometry, 216 exploration endpoint combinations and 408 reverse-seek film states. The final scan is checked for 73 completed records without restarting a pulse.
- A TypeScript program rooted only in the four topic TS/TSX files reports zero diagnostics. The cover compiles with Astro; both MDX files compile with the repository's Satteri renderer and native formulas. Only topic paths receive Prettier. No shared build, package change, registry or audio generation is performed.
- Packet checks cover exact keys, eight 22-second windows, translations for metadata and static/dynamic labels, registered related slugs and zero conflicting shared translations.
- React SSR checks start/midpoint/end of all eight chapters for finite output, and explicit accessible labels in the manual bench. Actual SVG instruments and the calculated SVG image fallback are rasterized for static inspection. These checks found and corrected unit-label clipping, close waveform/readout spacing and the probe-cable junction. They are **static instrument evidence**, not page-layout, continuous playback or listening evidence.
- A local Node-only benchmark of 40 full 73×351 reconstructions averaged about 0.96 ms per image. This is algorithm timing, not browser frame rate or mobile-device performance.
- Parent review remains: both page languages, all chapter seeks, continuous playback, actual 320 px watch height, keyboard/touch interactions, canvas failure in a browser, autoplay/buffering behavior, synthesized voices and full listening, and physical-phone performance. No isolated browser was used; no complete viewing, audio listening, global verification/build or deployment is claimed.

Work was performed directly in the assigned shared repository. Only the new ultrasound files above were edited; previous scenes and shared files remain parent-owned. Transient static checks use `/tmp/ultrasound-qa/` with a separate Vite cache and no dependency symlinks.

## Measured integration

Both recordings are 182.5 seconds. Earlier 176-second storyboards describe the production draft; the measured chapter windows below are authoritative. The film director follows these chapter windows and the media clock. Full integrated viewing and native listening remain separate review tasks.

Chinese: `/narration/ultrasound-zh-60ab152444e4.mp3`. English: `/narration/ultrasound-en-a141b7c9c3da.mp3`.

| Chapter | Window (s)  | Focus                                     |
| ------- | ----------- | ----------------------------------------- |
| 1       | 0–22        | Send a finite pulse                       |
| 2       | 22–45       | Locate a boundary by its delay            |
| 3       | 45–67       | Reflect some, transmit the rest           |
| 4       | 67–90       | A negative echo can still be bright       |
| 5       | 90–113.5    | One A-line becomes one image column       |
| 6       | 113.5–137.5 | Shorten the pulse to separate neighbors   |
| 7       | 137.5–160   | A bright face with a darker region behind |
| 8       | 160–182.5   | An assumed speed moves the image          |
