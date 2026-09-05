# Error correction: the parity weave

[简体中文](../zh-CN/examples/error-correction-brief.md)

The question is how a receiver can locate a flipped bit without an original copy. Follow message `1011` and preserve numbered positions across encoding, transmission and decoding. The turning point is an actual double-error miscorrection: checks pass after repair, yet the message changes. Adding overall parity turns the same double error into a refusal to guess.

## Art direction and causal shots

Three fine overlapping loops in sea green, muted gold and mauve form an open parity weave on warm paper. The seven numbered nodes occupy the seven membership regions, calculated to match C1, C2, C4 exactly. A red underline identifies a channel flip; a green tick marks a decoder change. Color is accompanied by labels, bit values and parity results. The lines represent sets, not physical wiring or paths along which information travels.

| Chapter / start        | Visible change and observation                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| Four data bits / 0 s   | Keep data at 3,5,6,7; fill P1, P2, P4 in turn.                                                  |
| Overlap / 22 s         | Focus each loop; show why position 6 participates in C2 and C4 only.                            |
| Channel / 44 s         | Align sent/received words; change only position 6 from 1 to 0.                                  |
| Syndrome / 66 s        | Reveal C1, C2, C4 results; order 110 as binary position 6.                                      |
| Repair / 88 s          | Hold the received word, then flip 6; extract restored payload.                                  |
| Ambiguity / 110 s      | Flip 3 and 5, then let ordinary decoding wrongly flip 6; show wrong payload.                    |
| Overall parity / 132 s | Add position 8; apply the same two flips; s≠0, q=0 blocks delivery.                             |
| Limits / 154 s         | Deterministically cycle no error, single 6, single 8, double 3+5; highlight the four decisions. |

The eight authored chapters have 22-second windows, 176 seconds total. Chinese and English speech are independently written. Cue offsets are chapter start + 0.45 seconds. Narration, captions, chapter count and timing are frozen for parent recording; the packet is a temporary integration handoff, not another canonical registry.

On desktop, the large weave is paired with an aligned received-word and decoder explanation. The phone composition retains the weave and current inference, removes the cumulative construction sidebar and secondary membership lists, and exposes sent/received rows only for the transmission chapter. Later chapters pair syndrome with the relevant correction or withheld payload. Text remains at least 16 px and manual actions at least 44 px. On phones, the redundant chapter heading is also omitted so the current explanation stays next to the weave. The page heading and shared chapter transport retain navigation context. Final measurements below include the actual lesson gutters.

## Scientific contract

The independent model implements binary systematic Hamming(7,4) and even-overall-parity extended Hamming(8,4). `c=dG`, `s=Hr`, `HGᵀ=0`; data columns are 3,5,6,7. The decoder accepts received bits only, never the teaching-side message or chosen flip count. It returns no corrected word or payload when extended decoding detects a double error. The model supports arbitrary selected subsets to expose behavior beyond the guarantee.

Ordinary syndrome-only detection can flag all double errors, but ordinary single-error correction cannot distinguish their syndrome from a single-error syndrome. Extended SECDED corrects all single errors and detects all double errors; it does not reliably correct doubles. Hamming distance counts differing positions, whereas parity is XOR over a set. Triple flips 1,2,3 and quadruple flips 1,2,3,8 provide explicit miscorrection and missed-error counterexamples. No model claims about a physical memory device, real fault rates or decoding speed are made.

Primary sources, consulted 2026-09-05:

- [R. W. Hamming, Error Detecting and Error Correcting Codes, 1950, §§3–5](https://ineffectivetheory.com/edu/papers/hamming-codes-1950.pdf): original construction, extension and distance argument.
- [MIT 6.02, Error Correction Codes](https://web.mit.edu/6.02/www/s2010/handouts/lectures/L6.pdf): distance and bounded correction/detection.
- [MIT 6.111, information-theory tutorial answers](https://web.mit.edu/6.111/www/f2004/tutprobs/temp/info.htm): the ambiguity of double errors and overall-parity logic.

All artwork is authored SVG/CSS, with its bit states derived from the model. No external bitmap, font or media asset is added. The SVG path works without WebGL, canvas, workers or network requests.

## Model, lifecycle and review evidence

`ecShot(chapter, progress)` reconstructs the entire shot from the shared director. There is no private clock, random generator, mutable frame history or resource allocation. The shared Showcase owns background/offscreen pausing, playback, narration, replay and seeking. CSS transitions run only while the shared director is playing and are disabled for reduced motion; paused seeks settle directly. Exploration is keyboard-operable and resettable, with explicit no/single/double presets and all 16 messages.

The targeted Vitest suite independently enumerates valid words from explicit parity equations rather than reusing G, H or the production encoder. It verifies all 16 uncorrupted messages, all 240 single flips across the two codes, 336 ordinary-code double flips, 448 extended-code double flips, all 256 received extended words, all 120 valid-word pairs per code, beyond-guarantee counterexamples, malformed inputs, input immutability and 801 reverse/shuffled director samples. Eleven tests pass, including a geometry check that each node belongs to precisely its mathematical parity regions.

Parent owns central registration, measured bilingual recordings, complete player/audio playback, real-phone testing, shared verification and production/preview builds. No full listening or physical-phone evidence is claimed by this worker. The targeted evidence below is complete; full player and voice review remains parent-owned.

## Final targeted evidence — 2026-09-05

- `pnpm exec vitest run src/models/error-correction.test.ts`: **11 tests passed** (Vitest 5.0.0, Node 24.19.0).
- A TypeScript 5.9.3 program restricted to the owned model, test and experiment has **zero owned-file diagnostics**. Both MDX documents compile with the installed Sätteri MDX processor. The cover compiles with Astro's compiler options and renders through `AstroContainer` with its optional color prop; its actual 400×230 output was visually inspected.
- An isolated, ephemeral HTTP harness bundled only this experiment, the real FilmContext, global/editorial/showcase/language/experiment styles and the real `.lesson-wrap` gutters. Packet translations were injected in memory. It used a separate headless **Chrome 152.0.7977.76**, not the parent's browser. It sampled 336 states: two languages × 320/390/1080 CSS-pixel viewports × eight chapters × seven progress values.
- With 320px viewport and actual 20px lesson gutters, the component measured **820–880.5px** across both languages; no horizontal overflow was observed. Minimum DOM body/label text was **16px**. SVG text, accounting for rendered viewBox scale, stayed **at least 16.93px**. Manual targets were at least **57.5px wide × 44px high**. Selected opening, syndrome, miscorrection, extended-code and final-decision frames were inspected. These are component stills and geometry measurements, not a complete film viewing or a physical-phone performance claim.
- Browser checks confirmed extended double-error output is withheld, ordinary double-error output is `0101` rather than original `1011`, and keyboard Space toggles position 6. After changing message, code and flips, Reset restores value 11 (`1011`), extended mode and flip 6. Both selects are discoverable by their translated accessible names. No range input exists. Reduced-motion transition duration is `0s`; no page errors occurred.
- Temporary review artifacts live under `/tmp/vistep-error-correction-qa/` on the worker host. They are not production assets. Model/packet/MDX/cover/style/component/brief files received targeted formatting only. No shared registries, manifests, builds, audio generation, git operations or previous topic files were changed.

Topic metadata, translations and narration are integrated in the canonical registries; the temporary handoff has been consumed. `src/data/narration.json` and `src/data/film-timeline.json` own the recorded timing.

## Recorded integration

Both languages run **211.0 seconds**. Actual chapter starts in seconds: 0, 26.0, 51.0, 77.0, 103.0, 129.5, 155.0, 182.5. Authored words are unchanged; measured windows allow breathing room for the longer recording, and the animation reconstructs from the same chapter progress.

zh: `/narration/error-correction-zh-3060b3d30cf6.mp3` · en: `/narration/error-correction-en-c504f1cd2b00.mp3`
