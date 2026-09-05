# Public-key cryptography: an open rule and a private return

## Integrated film

The assembled Chinese and English tracks share **196.5 seconds**. The original 176-second storyboard below is the initial handoff; measured speech determines the final windows here. Authored chapter titles, captions and spoken wording are unchanged. Temporary packet paths below refer to the consumed handoff. `src/data/narration.json`, `film-timeline.json`, `audio-tracks.json` and `audio-manifest.json` are canonical.

| Chapter                                         | Measured window |
| ----------------------------------------------- | --------------- |
| 1. Put one key in public view                   | 0–24 s          |
| 2. Where the two exponents come from            | 24–48.5 s       |
| 3. Keep the remainder                           | 48.5–73.5 s     |
| 4. Split the power to compute the ciphertext    | 73.5–98 s       |
| 5. The private exponent brings the message back | 98–122.5 s      |
| 6. Zero and shared factors must work too        | 122.5–147 s     |
| 7. A round-trip is not a security guarantee     | 147–171.5 s     |
| 8. What real systems add                        | 171.5–196.5 s   |

Recordings: `/narration/public-key-zh-a530d4a1e203.mp3` · `/narration/public-key-en-5aff38cf88af.mp3`

Full continuous viewing, native bilingual listening and physical-phone performance remain separate pending evidence.

---

[简体中文](../zh-CN/examples/public-key-brief.md)

Follow the integer **42** through actual, deliberately insecure textbook RSA: public operation gives **15**, private operation returns **42**. The scene explains the public/private distinction without claiming that its tiny keys keep secrets. It ultimately demonstrates the opposite with a real public-key enumeration.

## Composition and eight causal chapters

Warm letter paper, a burgundy public notice, a numbered envelope, and exact handwritten-style integer equations. The object to follow is the same message representative, not an invented stream of bytes. Thin envelope seams and correspondence lines are SVG; all meaningful values are selectable HTML. A short row of successive powers leads into one current multiplication. No 3D camera, generic hardware dashboard or matrix wallpaper is used.

| Start | Chapter    | New visible observation                                                                                                                                                         |
| ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 s   | Publish    | Public `(187,7)` is available to the sender; envelope identity changes from message 42 to ciphertext 15. A model-directed marker follows the route.                             |
| 22 s  | Construct  | `11×17=187`; least common multiple 80; Euclidean divisions and Bézout identity yield private exponent 23.                                                                       |
| 44 s  | Reduce     | Domain 0…186; `42²=1764=9×187+81`. Quotient copies are removed, remainder retained.                                                                                             |
| 66 s  | Encrypt    | Powers 1,2,4 have residues 42,81,16; actual accumulators are 42,36,15.                                                                                                          |
| 88 s  | Decrypt    | Powers 1,2,4,8,16 have residues 15,38,135,86,103. Power eight is not selected; accumulators 15,9,93,93,42.                                                                      |
| 110 s | Boundaries | 0,11,17,186 each round-trip; both prime remainders agree. The whole 187-representative domain is checked.                                                                       |
| 132 s | Failure    | Duplicate messages give duplicate ciphertext. Public guesses 0…42 find ciphertext 15 on attempt 43.                                                                             |
| 154 s | Secure use | A clearly labeled, non-executed hybrid architecture: randomized OAEP protection of a symmetric key, authenticated symmetric content encryption, and separate identity checking. |

**Frozen handoff:** eight 22-second chapters, draft duration 176 seconds. Chinese and English narration are independently authored; each cue begins 0.45 seconds after its chapter. English cues contain 51–56 words, Chinese cues 92–107 characters. Parent owns measured recordings and final integration. Scripts, captions, titles, chapter order/count and timing are frozen; UTF-8 `JSON.stringify(packet.narration)` SHA-256 is `c6a4d828ab38d6e43b16a8682f179a25809160dd265f290d7df47de8b16d3736`. After freeze, only phone composition, duplicated in-scene caption removal, cover layout and evidence documentation changed; the packet narration and captions did not change. The packet is temporary integration data, not a second canonical registry.

## Mathematics, validity and scope

`pkKey` accepts distinct odd primes at most 97, verifies primality by exact trial division, computes `λ=lcm(p−1,q−1)` and obtains a normalized modular inverse using extended Euclid. It checks `3≤e<n` and invertibility. The three UI presets are `(p,q,e)=(11,17,7),(13,19,5),(17,23,3)`, with moduli 187,247,391 and private exponents 23,29,59. Private operations verify the supplied key relation. Public primitives take an already-valid public key and range-check its fields, as in the RFC’s stated precondition; they do not claim public-key certification or identity validation.

All multiplication, squaring, quotient/remainder arithmetic in the modular-power model uses BigInt before bounded number conversion. The trace walks powers from low to high, selecting according to exponent bits. Unselected powers retain the accumulator. Exponent zero returns the empty product one in the generic arithmetic helper; RSA itself only permits the validated positive exponents. Message and ciphertext representatives must be integers from 0 to n−1. The UI accepts canonical decimal digits only, with no silent wrapping, whitespace coercion or text encoding.

The model’s complete-domain check includes 27 non-coprime representatives for n=187, counting zero. The article proves correctness by working modulo each prime separately: zero remains zero, nonzero residues use Fermat, and CRT identifies the unique representative. It does not incorrectly apply Euler’s coprime-only statement to every message.

This code has no OAEP, symmetric cipher, signature, secure randomness, key export, ciphertext download, key-management protocol or claim to secure implementation. Textbook RSA is deterministic; the film actually computes a successful small-domain guessing attack using only n,e,c. It does not equate encryption with authentication, call a signature “private-key encryption,” or imply that public-key availability verifies the sender. Modern use is explicitly conceptual and uses no fake encrypted bytes. Film time is teaching time, not operation or attack cost.

## Phone, accessibility and lifecycle

At 320px the watch stage uses a separate 770px composition. The repeated scene-top film caption is removed; a compact chapter title remains, while the shared Showcase owns the current caption below. Arithmetic is presented as one current squaring and accumulation; all five decryption powers remain identifiable. The final architecture follows one branch at a time on phones, while desktop shows their relationship together. A long shared English translation, “Skipped,” initially collided with the adjacent power. A new topic label “Omit” resolved it without changing shared wording. The initial two-branch phone architecture overlapped the footer; chapter-specific focus corrected it without shrinking text or extending the stage.

All fields have explicit label associations. The range additionally has a translated aria-label and aria-valuetext. There are previous/next buttons and four boundary-message shortcuts. Full reset restores all five states: key preset 0, message 42, encryption, step 0, details closed. Invalid input removes stale arithmetic and the step controls.

`pkShot(chapter,progress)` reconstructs the teaching shot; `pkAt(trace,completed)` copies the exact selected mathematical state. There is no private clock, frame-history simulation or random source. The shared Showcase controls visibility/background pause, reduced-motion playback policy and audio. This topic allocates no WebGL, audio, Worker, timer or object URL. SVG/HTML is its normal 2D path. Topic CSS disables its transitions under reduced motion; that OS preference was not emulated during this CUA review.

## Primary sources and provenance

Consulted 2026-09-06:

- [RFC 8017](https://www.rfc-editor.org/rfc/rfc8017.html), §§3,5.1,6–7: λ-based valid key relation, integer domains, RSA operations, distinction between primitive and scheme, OAEP and key transport.
- [Rivest, Shamir and Adleman, original RSA paper](https://people.csail.mit.edu/rivest/Rsapaper.pdf), §§III,V–VII: public/private roles, integer mapping, all-message correctness including zero prime residues, repeated squaring, public-key substitution concern. Historical parameter/security advice is not presented as current practice.
- [NIST SP 800-56B Rev.2](https://csrc.nist.gov/pubs/sp/800/56/b/r2/final): RSA-based key establishment, separate security assurances and key confirmation.

Model and artwork were authored for this lesson. No third-party implementation or external artwork was copied. No runtime dependency or shared package/lockfile changed. Only the topic-owned files below were written in the repository.

## Exact evidence and remaining review

- `pnpm exec vitest run src/models/public-key.test.ts`: **8 tests passed** with Vitest 5.0.0 / Node 24.19.0. These check Euclidean/Bézout identities, the familiar 65→2790 modulo 3233 arithmetic example, all 825 representatives across three presets against a separately written full-BigInt-power reference, boundaries and shared factors, every trace quotient/remainder, the unused eighth power, public guessing, invalid key/input rejection, and direct/backward seek with copied rows.
- A further **172 valid key/exponent choices** from the small prime set 3,5,7,11,13 receive **13,278 complete message round-trips** inside the model tests.
- Independent Python built-in `pow` checked **825 inputs × encryption/decryption/round-trip**, including inverse relations with `math.lcm`; all matched. No WebCrypto RSA claim is made for these tiny unsupported teaching keys.
- Owned TypeScript program: zero owned-file diagnostics. Static AST extraction checked 80 Chinese component/renderer strings against the packet and existing translations, with no missing entries or shared-wording conflicts. Metadata, exact packet keys, chapter timing and frozen narration hash are checked separately.
- Both MDX files compiled through the installed Astro Sätteri MDX processor, using Unicode/formula blocks. No raw dollar TeX. This is targeted pipeline compilation, not a shared production build.
- Cover compiled with compiler-rs using Astro’s resolvePath/resultScopedSlot/compiler-runtime options, rendered via AstroContainer with optional color, and rasterized at 400×230 with Resvg. Initial direct compiler calls omitted Astro’s resolvePath option and produced legacy metadata imports; matching the real compile options fixed the isolated harness. Final artwork was inspected independently from browser evidence.
- **Browser evidence uses CUA only.** The independent `/tmp/vistep-public-key-review/` tree installed its own React, React DOM, esbuild and font packages, with no node_modules symlink. Node built/served the fixture; all browser control and inspection used CUA’s in-app browser API. No shell Playwright/CDP browser was launched, and no parent browser tab was operated. The viewport override was reset and the worker-created tab closed after review.
- Final CUA measurements after the duplicate-caption removal and compact-stage redesign: **86 static director samples**—54 at320px (both languages, all chapters at 0/.45/1 plus λ, skipped-power and symmetric-branch states), 24 English at1080px (all chapters at 0/.45/1), and 8 Chinese at390px (chapter ends). Every phone watch stage was **770px**, desktop maximum **753.72px**; no measured horizontal overflow or descendant beyond the stage; minimum visible nondecorative text **16px**. Closest measured causal-content/footer gap was **5.25px**, with no overlap. These are sampled DOM bounds, not 86 fully viewed films.
- Selected settled stills were inspected, including encryption, decryption and the phone/desktop hybrid layout. Early captures immediately after navigation showed transient clipped content; a later settled capture plus header/scroll coordinates confirmed the frame. This is explicitly not full watching, listening or a physical-phone test.
- CUA controls changed all five manual states, selected preset n391 and message17, sought decryption using End (step6, recovered17), used ArrowLeft (step5, accumulator153), opened details and reset everything. Out-of-range187 removed old results. The zero shortcut produced 0→0→0. Minimum observed action dimensions were **121×44px**; fields/range were254px wide and at least44px high. One exact label locator missed a nested select; observed role/name targeting worked, and both accessibility snapshots named the field correctly. Tab error logs were empty at the end.
- The fixture contained **zero audio/video elements**. It supplies no media-currentTime, audio-seek, full-track listening, autoplay, physical-phone performance or final shared-player lifecycle evidence. Parent must check those separately, including media time versus film seek. Shared registration, recordings, global checks/builds, release and publication remain parent-owned.

## Owned files

- `src/models/public-key.ts`
- `src/models/public-key.test.ts`
- `src/components/experiments/PublicKey.tsx`
- `src/components/lab/PublicKeyArithmetic.tsx`
- `src/styles/public-key.css`
- `src/components/covers/PublicKeyCover.astro`
- `src/content/public-key.mdx`
- `src/content/en/public-key.mdx`
- `docs/examples/public-key-brief.md`
- `docs/zh-CN/examples/public-key-brief.md`
- `src/data/scene-packets/public-key.json`
