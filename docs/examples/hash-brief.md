# Hash: one bit enters a chain of computation

## Integrated film

The assembled Chinese and English tracks share **185.5 seconds**. The original 176-second storyboard below is the initial handoff; measured speech determines the final windows here. Authored chapter titles, captions and spoken wording are unchanged. Temporary packet paths below refer to the consumed handoff, not a second registry. `src/data/narration.json`, `film-timeline.json`, `audio-tracks.json` and `audio-manifest.json` are canonical.

| Chapter                                    | Measured window |
| ------------------------------------------ | --------------- |
| 1. Start with bytes                        | 0–22 s          |
| 2. Give the message an exact ending        | 22–44 s         |
| 3. Expand sixteen words into sixty-four    | 44–69 s         |
| 4. Slow down one round                     | 69–91 s         |
| 5. Eight state words, sixty-four rounds    | 91–114 s        |
| 6. Add the starting state back             | 114–140 s       |
| 7. Longer messages, the same digest length | 140–163 s       |
| 8. Change one bit and calculate again      | 163–185.5 s     |

Recordings: `/narration/hash-zh-f6acc235db7c.mp3` · `/narration/hash-en-5da1a9550a60.mp3`

Full continuous viewing, native bilingual listening and physical-phone performance remain separate pending evidence.

---

[简体中文](../zh-CN/examples/hash-brief.md)

The scene follows `a`’s lowest bit in `abc` into a real SHA-256 computation. It begins with literal byte/word identity, then changes to a controlled counterfactual: rerun the same bytes with exactly one bit flipped. After mixing operations, the visual claims an observed influence, not that an output mark is the original bit travelling through a machine.

## Direction and eight causal chapters

The visual language is a quiet typographic score on cool paper: a letter, byte strokes, a padded ribbon, four tributaries forming a schedule word, two compression paths, eight compact state lines, and an explicit return addition. Gold marks the tracked input or measured XOR differences. Fine curves show algorithm dependencies, not physical wires. There is no hardware cabinet, decorative QR matrix, or invented device timing.

| Start | Chapter            | Visible causal step                                                                                           |
| ----- | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| 0 s   | Bytes              | UTF-8 `61 62 63`; `a`’s b0 becomes bit 24 of big-endian W[0].                                                 |
| 22 s  | Padding            | Append set bit, zeros, and the original 64-bit length field; complete a 512-bit block.                        |
| 44 s  | Schedule           | Compute W[16], W[17], W[18], and W[63] from their four actual operands.                                       |
| 66 s  | One round          | Reveal T1, T2, then a′ and e′, with exact first-round numbers and shift assignments.                          |
| 88 s  | 64 rounds          | Advance the eight actual working words alongside the current W and K.                                         |
| 110 s | Feed-forward       | Add each of the eight final working words back to its incoming state word.                                    |
| 132 s | Two blocks         | Use NIST’s 56-byte example; pass all eight words from block one to block two, then hold the final digest.     |
| 154 s | One-bit comparison | Compare entering, round, and feed-forward states for `61 62 63` versus `60 62 63`; final distance is 112/256. |

Eight 22-second windows make a **176-second draft**. Authored Chinese and English speech are independent. Cue speech starts at chapter start + 0.45 seconds. Chinese scripts contain 89–100 characters; English scripts contain 48–55 whitespace-delimited words. Parent measures voices and owns final recorded timing.

Narration scripts, captions, titles, chapter order/count, and draft timing are **frozen** at handoff. SHA-256 of UTF-8 `JSON.stringify(packet.narration)` is `5ac6c4903062f7db806d74aab05049f7bd692e1f562291641bd62ae20f708253`. Subsequent worker edits affected accessibility labels, text contrast and the cover, not frozen fields. The packet is temporary handoff data, not a second canonical registry.

## Model and limits

The independent TypeScript implementation follows FIPS 180-4 SHA-256: UTF-8 conversion at the UI boundary, big-endian 64-bit original bit length, byte-aligned padding, 512-bit blocks, 16-to-64 word schedule, all 64 standard K constants, eight initial words, 64 compression rounds per block, modulo-2³² arithmetic, feed-forward, and big-endian digest concatenation. Small sigma functions include a shift; large sigma functions contain rotations only. Ch and Maj operate bitwise. New round state is computed entirely from old state.

The original default digest is `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`. Flipping only byte index 0, bit 0 produces `89f900390e14d37c405c75244fb086aa35b54c0fb6ec3638c1c21451d4743d11`. The selected input bit changes W[0] and W[16] by XOR 0x01000000. First-round T1 changes while T2 remains identical. The subsequent state-distance sequence begins `0, 3, 23, 48, 80, 109`; later decreases are retained. No artificial monotone ramp or forced 128-bit ending is used.

Detailed traces are limited to 1024 UTF-8 bytes, at most 17 padded blocks. Empty input is valid and disables bit flipping. Malformed Unicode surrogates are rejected; no normalization or replacement is silently applied. Comparison flips raw bytes, which may cease to be valid UTF-8. A separate digest path retains no per-round trace and was tested on one million bytes. This is not a streaming or general bit-oriented API, despite the standard allowing non-byte-aligned messages.

Fixed output length entails possible collisions; this does not show how to find one. The scene distinguishes hashing from text encoding and encryption, shows no reversible recovery, and makes no collision-resistance, preimage-resistance, password-strength, or security-certification claim. Its avalanche display is a measured pair of computations, not a proof or guarantee of exactly half the bits changing.

## Phone, accessibility and lifecycle

The phone view is composed by chapter. Repeated chapter headings are omitted. Feed-forward and two-block chapters retain word values but remove secondary bit textures. The final comparison expands only the first two numeric pairs and packs all eight XOR strokes into a compact arrangement; every underlying word retains a translated accessible group name containing both values. This preserves the full 256-bit comparison without stacking two large matrices. All main-stage body/label text stays at least 16px.

Exploration provides named text, byte, bit and block fields; the range has both explicit label association and a translated `aria-label`/`aria-valuetext`. Previous/Next buttons allow step control without dragging. Full reset restores text `abc`, byte 0, bit 0, flip enabled, block 0, step 65, and details closed. Invalid input removes stale results. Complete digests and intermediate Σ/Ch/Maj values are optional details.

`hashShot(chapter, progress)` selects teaching states. `hashAt(run, block, step)` selects mathematical states: 0 incoming, 1–64 after a round, 65 after feed-forward. No private clock, random state, mutable playback history, or frame-dependent integration is used. Mathematical round traces are recomputed from the same bytes, independent of seeking. Shared Showcase owns offscreen/background pause and narration. Only playing-state tick colors transition, and reduced motion disables them. No WebGL, Worker, audio object, timer, or object URL is allocated by this topic. SVG/HTML is its ordinary 2D rendering path; there is no perspective camera to fit.

## Primary sources and provenance

Consulted 2026-09-05:

- [NIST FIPS 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf), §§4–6: actual constants, bit functions, padding, schedule, rounds and feed-forward.
- [NIST SHA-256 intermediate examples](https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/documents/examples/SHA256.pdf): `abc`, the 56-byte two-block message, published intermediate states and final digests.
- [NIST secure-hashing validation guidance](https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/secure-hashing): informal test vectors do not constitute CAVP validation.

The model and SVG/CSS artwork were authored for this topic; no encoder source or external artwork was copied. NIST numeric constants and reference values are attributed in the model/tests. No runtime dependency, asset, font, or shared package/lockfile was added. The attempt to fetch the larger CAVP vector ZIP received HTTP 403; it is not counted as a completed test suite. Validation uses the available NIST PDF examples plus the independent APIs below.

## Exact targeted evidence

- `pnpm exec vitest run src/models/hash.test.ts`: **10 tests passed** on Vitest 5.0.0 / Node 24.19.0. Both NIST digests, five published complete round states, the published first-block chaining value, byte lengths 0–129, seven Unicode cases, one million `a` bytes, boundaries 0/55/56/63/64/119/120/1024, separate BigInt rotation/modular arithmetic, all eight one-bit Ch/Maj truth-table combinations, all 24 one-bit perturbations of `abc`, exact distances, multi-block propagation, direct/backward seek states, invalid input and immutability.
- WebCrypto SHA-256 reference calls inside the tests: **162 inputs** (130 byte lengths + 7 Unicode cases + 1 million-byte case + 24 perturbations), all matched.
- Separate Node `createHash('sha256')` validation: **1,031 inputs** matched, comprising every byte length 0–1024 and six Unicode/standard-example strings. Runtime Node 24.19.0, OpenSSL 3.5.7. WebCrypto and Node crypto are independent from this implementation; they may share OpenSSL internally and are not claimed as two independently designed cryptographic cores.
- The independent review tree at `/tmp/vistep-hash-review/` uses its own installed dependencies and copied sources; no shared `node_modules` symlink or configuration was changed. Its static fixture injects packet translations in memory and uses real shared styles and FilmContext, without the shared player or audio.
- **Current CUA evidence:** a worker-created Codex in-app tab inspected English chapter 4 (one compression round), Chinese chapter 7 (two-block chaining), and English chapter 8 (one-bit comparison) at an actual **320×900 browser viewport**. CUA DOM reads measured all three stages at **830px**, with document width **320px**. The final comparison exposed all eight exact word pairs to accessibility, including the six visually compact pairs. English chapter 6 feed-forward was also inspected at **1080×900**. These are four key stills, not a complete watch-through or all chapter/progress combinations. The viewport override was reset and only the worker-created tab was closed.
- **CUA controls:** loaded the 56-byte example, changed byte index to 1, bit to 3 and block to 1, pressed Home then ArrowRight on the explicitly named range (observed step 1), disabled the flip (observed 0/256), and opened complete digest/round details. Reset visibly restored `abc`, byte 0, bit 0, block 0, step 65, flip enabled, details closed and 112/256. A role-based locator missed the toggle; the observed accessibility control then worked. This is not a component failure or a claimed successful keyboard toggle test.
- **Historical evidence, excluded from current CUA acceptance:** before the browser constraint reminder, shell-launched Playwright/headless Chrome 152.0.7977.76 sampled 336 combinations and exercised empty/oversized input, reduced motion and keyboard controls. Its recorded maximum phone stage height was 830px. Those earlier records and screenshots are retained only as historical development evidence; they are not CUA results and are not counted as current browser acceptance. No shell browser automation ran after the reminder. The current CUA fixture was built/served through Node, with all browser inspection and control through CUA.
- The final 400×230 model-derived cover compiled with Astro compiler-rs and rendered via AstroContainer and Resvg. This is SVG/render evidence, not browser or phone evidence.
- Owned TypeScript program has zero owned-file diagnostics. Both MDX files process with the installed Sätteri pipeline using Unicode and formula blocks, no raw TeX. Cover compiles with Astro compiler-rs and renders via AstroContainer with optional `color`. Owned-file formatting and packet label/metadata/overlap checks pass.

**Audio evidence boundary:** the component harness contains no media player, so it provides no media `currentTime`, audio-seek, native playback or listening evidence. Parent’s final player review must check media time as well as the film slider, including Range/Blob-fallback behavior. Parent owns recording, full bilingual viewing/listening, physical-phone performance, shared build/verification and publication. None of those is claimed here. No previous-topic or shared audio/registry/style/guide/git/deployment file was edited.

## Owned paths

- `src/models/hash.ts`
- `src/models/hash.test.ts`
- `src/components/experiments/Hash.tsx`
- `src/components/lab/HashWords.tsx`
- `src/styles/hash.css`
- `src/components/covers/HashCover.astro`
- `src/content/hash.mdx`
- `src/content/en/hash.mdx`
- `docs/examples/hash-brief.md`
- `docs/zh-CN/examples/hash-brief.md`
- `src/data/scene-packets/hash.json`
