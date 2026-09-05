# QR Code: a byte becomes a place

[简体中文](../zh-CN/examples/qr-code-brief.md)

Follow one bit of the `v` in `https://vistep.ai` from text into a real, scannable QR Code. The misconception to overturn is that every black module simply means an original one. The tracked bit starts as one but prints white after reversible masking. Its byte, bitstream index, codeword index, and grid coordinates remain explicit.

## Art direction and film

A close view of warm paper, precise black modules, quiet sea-green typography, and a single muted gold tracking outline. The opening is a typographic portrait of `v`. The paper then becomes a bitstream, a moving polynomial remainder, an architectural reservation map, a weaving placement route, and finally an unobstructed QR Code. There is no cabinet, station layout, faux hardware, or decorative data texture. All module rectangles are generated from the independent model.

| Start | Chapter              | Visible causal change                                                                                    |
| ----- | -------------------- | -------------------------------------------------------------------------------------------------------- |
| 0 s   | Follow v             | Reveal byte 118 as 01110110; retain b6, the second bit from the left.                                    |
| 22 s  | Reading instructions | Add mode, count, payload, and terminator. Compare actual EC/11 padding for shorter `vistep.ai`.          |
| 44 s  | RS checks            | Advance through 19 inputs; show each actual seven-byte prefix remainder, ending at D2 B9 37 2B E9 51 39. |
| 66 s  | Reserve structure    | Finder/separator shapes, then timing, then format reservations leave 208 positions.                      |
| 88 s  | Placement            | Trace alternating pairs of columns. The same bit reaches (13, 11), then all 208 positions fill.          |
| 110 s | Eight masks          | Cycle all candidates and their actual penalties, settle on mask 3, and retain the tracked XOR.           |
| 132 s | Format instructions  | Show L/mask bits, BCH remainder, and final word 0x789D; outline each format copy in turn.                |
| 154 s | Scan                 | Recover the tracked raw bit; remove all overlays after 38% chapter progress and hold the scannable URL.  |

The initial storyboard used eight 22-second windows, **176 seconds** total, with speech offsets at chapter start + 0.45 seconds. Chinese and English scripts are authored independently, not generated from interface labels. Narration, captions, chapter count/order, and director timing are frozen at handoff.

On phones, the current explanation accompanies only the current causal view. Redundant chapter headings disappear; the bitstream hides its secondary codeword strip, RS omits its long polynomial, and mask comparison omits its secondary score decomposition. The underlying calculation stays identical. The matrix keeps full quiet margins and no tiny SVG text. At 320px with actual 20px lesson gutters, every sampled bilingual chapter has the same **820px** main stage, stabilizing the subsequent transport position. No body text is shrunk below 16px.

## Scientific and implementation contract

- Real QR Code Model 2, Version 1-L, one byte segment. ASCII messages support 1–17 bytes without ECI. Non-ASCII messages use UTF-8 with ECI assignment 26, limiting the payload to 16 bytes. Empty input and malformed Unicode are rejected. No other versions/levels, mode optimization, or multipart messages are implemented.
- Default 17-byte URL: mode 4 bits, count 8 bits, payload 136 bits, terminator 4 bits = 152 bits / 19 data codewords. Short input gets byte alignment and alternating hexadecimal EC/11 pads. Byte and codeword indices are different because the default header has 12 bits.
- RS over GF(256), reduction polynomial 0x11D, roots α⁰ through α⁶ with α = 2. One block has 19 data + 7 parity codewords. Polynomial long division and prefix remainders are real computations, not arbitrary counters or backup bytes.
- 233 reserved function modules and 208 one-to-one placement positions. Version 1 has no alignment pattern or version-information area. Both 15-bit BCH format copies are computed using 0x537 and XOR 0x5412; function modules are never data-masked.
- All eight masks are scored on completed candidate matrices, including their own format words. Penalties include runs, squares, full finder-like ratios with light context, and balance. Lowest mask number breaks equal scores. The URL selects mask 3, penalty 1087.
- Payload byte 9, bit b6 is bitstream index 77, codeword index 9 (zero-based), and coordinate (13, 11). Original 1 XOR mask 1 = printed 0. The quiet zone is excluded from coordinate numbering.
- No damaged-code decoder, corruption experiment, logo-recovery promise, or area-to-error-rate claim. The MDX explains the mathematical three-unknown-codeword limit for this block, conditional on correct symbol acquisition. Format BCH and data RS are distinct protection layers.

`qrShot(chapter, progress)` derives every presentation state from the shared director. There is no local animation clock, random state, or frame history. Masks change on exact chapter thresholds and settle directly when seeking. Only playing-state codeword color transitions animate; reduced motion disables them. The shared Showcase owns offscreen/background pause, replay, seeking, and narration. This scene allocates no WebGL, audio, Worker, timer, or object URL resources; its SVG is also the baseline 2D renderer.

Exploration recalculates text and masks, exposes byte/bit tracking and exact codewords, and exports a clean SVG independently of teaching highlights. Invalid input removes the previous code. Full reset restores URL, auto mask, byte index 8, bit index 1, and inspection off. Inputs/selects have stable explicit translated labels; no topic-owned range is used. Button/Space activation and native select typeahead are supported.

## Primary sources and provenance

Consulted 2026-09-05:

- [DENSO WAVE: versions and capacity](https://www.qrcode.com/en/about/version.html): Version 1 geometry and bounded capacity.
- [DENSO WAVE: creating a code](https://www.qrcode.com/en/howto/code.html): four-module quiet zone on every side.
- [DENSO WAVE: error correction](https://www.qrcode.com/en/about/error_correction.html): Reed–Solomon, eight-bit codewords, and restoration limits.
- [Project Nayuki: author’s QR generator notes](https://www.nayuki.io/page/qr-code-generator-library) and [official reference source](https://github.com/nayuki/QR-Code-generator/blob/master/python/qrcodegen.py): mask evaluation, format layout, finite-field construction, and fixed-mask independent comparison.
- [ZXing: CharacterSetECI](https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/common/CharacterSetECI.java): UTF-8 assignment 26.

Model and SVG/CSS artwork were authored for this scene. No external artwork, fonts, copied encoder source, runtime dependency, or public asset was added. The validation-only Nayuki package is MIT licensed; it was installed in an isolated `/tmp` Python environment and is not shipped. Fixed reference codeword values and matrix hashes are embedded in the owned tests.

## Targeted evidence — 2026-09-05

- `pnpm exec vitest run src/models/qr-code.test.ts`: **11 passing tests**. Five independent reference payloads × eight fixed-mask SHA-256 matrices (40), known full codeword arrays and penalties; all 65,536 GF byte products against separate carryless polynomial arithmetic; generator roots; BCH copies; reservations; 208 unique bit placements; unmasking/tracker identity; quiet zone; byte limits, malformed inputs, and 801 reverse/shuffled director samples.
- Isolated Python 3.14 environment with `qrcodegen 1.8.0`, `zxing-cpp 3.1.1`, and Pillow 12.3.0: **69 payloads × 8 masks = 552 matrices** matched every module and penalty against Nayuki. All 69 automatic mask choices and full codeword blocks matched. Explicit byte segments, L level, min/max version 1, `boostecl=False`, and optional ECI 26 ensured a fair comparison. All **552 clean symbols decoded** to the original text through ZXing. Cases include the URL, shorter ASCII, Chinese, four emoji, maximum-length ASCII, and 64 deterministic ASCII strings spanning lengths 1–17. This is a finite test set, not exhaustive payload coverage.
- Separate headless Chrome **152.0.7977.76** with real `.lesson-wrap`/`.experiment` gutters, actual shared CSS/FilmContext, and packet translations injected in memory: **336 sampled states**, two languages × 320/390/1080 viewports × eight chapters × seven progress values. No document horizontal overflow or page errors. Maximum stage heights: 820px at 320, 852.99px at 390, 825.38px at 1080. Minimum visible DOM body/label/code text: 16px; smallest measured manual target: 126.17px wide × 44px high.
- Opening, RS, placement, mask, format, and final-result stills were inspected at phone/desktop sizes. ZXing decoded the actual clean renderer screenshots at all three widths, the actual 400×230 cover render, and the downloaded SVG rasterized at 290px: **5/5 read the exact URL**. These are clean screenshot decodes, not physical camera or damage tests.
- Browser checks confirm full reset of all five inputs/state values, rejection of 18-byte ASCII/non-ASCII inputs without stale matrices, explicit accessible names, Space toggling, and select typeahead (`b5` selects bit index 2). Native ArrowUp did not commit in the macOS headless popup automation; no passing arrow-key claim is made. Real native-select keyboard interaction remains part of parent review. Reduced-motion transition duration is 0s.
- Owned TypeScript program: zero owned-file diagnostics. Both MDX files process through the installed Sätteri pipeline; they use Unicode/inline code/formula blocks, no raw TeX. Cover compiles with Astro compiler-rs and renders through AstroContainer with optional color. Neither is a claim that the shared production build was run.
- Packet labels and metadata were checked against the current shared dictionary: no missing labels or conflicting overlaps. Existing `3 分钟 → 3 minutes` and other overlaps are preserved. Only explicit owned paths were formatted.

Temporary validation outputs are under `/tmp/vistep-qr-validation/` and `/tmp/vistep-qr-code-qa/`; they are not site assets. Parent owns measured voice production, full bilingual listening and player viewing, physical-phone performance, full native-input review, integration, shared verification/builds, and publication. This worker did not operate the parent's browser, run global builds/audio generation, or change shared/previous-topic files.

## Implementation references

- `src/models/qr-code.ts`
- `src/models/qr-code.test.ts`
- `src/components/experiments/QrCode.tsx`
- `src/components/lab/QrCodeMatrix.tsx`
- `src/styles/qr-code.css`
- `src/components/covers/QrCodeCover.astro`
- `src/content/qr-code.mdx`
- `src/content/en/qr-code.mdx`
- `docs/examples/qr-code-brief.md`
- `docs/zh-CN/examples/qr-code-brief.md`
- `src/data/narration.json`

## Measured integration

Both recordings are 214.5 seconds. Earlier 176-second storyboards describe the production draft; the measured chapter windows below are authoritative. The film director follows these chapter windows and the media clock. Full integrated viewing and native listening remain separate review tasks.

Chinese: `/narration/qr-code-zh-0cf361f52ad9.mp3`. English: `/narration/qr-code-en-0f16c6e2c01f.mp3`.

| Chapter | Window (s)  | Focus                           |
| ------- | ----------- | ------------------------------- |
| 1       | 0–26.5      | Follow one v from the URL       |
| 2       | 26.5–53     | Tell the reader how to read     |
| 3       | 53–80       | Calculate seven check codewords |
| 4       | 80–107.5    | Reserve orientation and scale   |
| 5       | 107.5–133.5 | Place bits in pairs of columns  |
| 6       | 133.5–159.5 | Compare all eight masks         |
| 7       | 159.5–187.5 | Write the reading guide twice   |
| 8       | 187.5–214.5 | Now it can be scanned           |
