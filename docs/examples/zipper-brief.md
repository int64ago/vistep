# Zipper — one tooth through a Y guide

[简体中文](../zh-CN/examples/zipper-brief.md)

## Integrated film

The assembled Chinese and English tracks share **201.5 seconds**. The original 176-second storyboard below is the initial handoff; measured speech determines the final windows here. Authored chapter titles, captions and spoken wording are unchanged. Temporary packet paths below refer to the consumed handoff. `src/data/narration.json`, `film-timeline.json`, `audio-tracks.json` and `audio-manifest.json` are canonical.

| Chapter                                     | Measured window |
| ------------------------------------------- | --------------- |
| 1. A moving slider, a lasting join          | 0–23 s          |
| 2. A recess inside the broad head           | 23–47.5 s       |
| 3. The Y guide turns the tapes              | 47.5–71.5 s     |
| 4. Follow L7 into engagement                | 71.5–98 s       |
| 5. Why a sideways pull is resisted          | 98–124.5 s      |
| 6. The same tooth follows the reverse route | 124.5–149 s     |
| 7. Stops bound the journey                  | 149–175 s       |
| 8. Remove the shoulder, change the result   | 175–201.5 s     |

Recordings: `/narration/zipper-zh-c557b6e27baf.mp3` · `/narration/zipper-en-7e6b0218126a.mp3`

Full continuous viewing, native bilingual listening and physical-phone performance remain separate pending evidence.

---

Status: **frozen handoff to parent integration**, not release acceptance. Only zipper-owned source was written. The temporary scene packet is an integration input, not a second canonical registry.

## Concept and art direction

The misconception is that a slider somehow fastens teeth by squeezing two rows directly together. Follow permanently green **L7** through a curved route instead. A muted blue woven-tape ribbon, cream and ochre moulded teeth, and a silver window-cut slider make the contacts legible. The pull tab has a bored hinge on a transverse pin, carried by crown ears attached to the remaining upper-plate bridge. The lower plate, outer flanges, tape exit slots and central diamond remain physical connected parts.

The selected structure is a **discrete moulded mushroom head**, narrow neck, middle wings and a horizontal recess between head lips. It is a **closed-end zipper with a non-locking slider**. Tooth retention is distinct from an automatic slider lock. No third-party image assets were added: tooth geometry, fabric, stitching, slider, stops, cover and diagrams are original procedural work.

Eight 22-second beats, initial total 176 seconds:

1. The whole zipper closes; the two tapes and every tooth retain their identity.
2. Cut L7's upper lip; the thickness section follows a real overlap with the opposite wing.
3. Inspect the Y guide, turning bead paths and finite plate/tape clearances.
4. Follow L7 from the open branch to the straight, engaged chain.
5. Apply normalized sideways load to a symmetric three-tooth section; two reactions balance it.
6. Follow L7 along the exact inverse route as the slider opens the chain.
7. The upper and lower stop contacts define the slider's actual allowed journey.
8. A counterfactual narrows the head shoulders. Under the same attempted shift, ordinary shoulders retain while narrow heads withdraw.

The shared Showcase supplies current captions; no explanatory top paragraph repeats them. Desktop anatomy pairs the physical cutaway with a precise section. Phone anatomy replaces that pair with one plan-and-thickness instrument; other physical chapters track a labelled local area. Loading and comparison each use a single compact instrument. Model-driven camera motion is gentle, and manual travel translates the camera with the guide while preserving the chosen orbit.

## Independent model and geometry

`src/models/zipper.ts` owns shapes, paths, stops, load assumptions, comparisons and the chapter director. Bead arc-length coordinate `s` is measured in display units `u`; pitch `p = 1 u`. Each row has 13 permanent IDs, with right positions `i + 0.5`. Each rigid tooth follows the bead position and tangent. The root contains a bore and open cloth slot, so the continuous bead and tape are not passed through a solid block.

From the joined segment, the bead route comprises a circular turn from 0 to 0.65 rad over 1 u, a 1 u straight branch and a gentler return to parallel over 2.5 u. These segments integrate a unit tangent exactly. The longer return bend was selected after a same-row finite-layer sweep exposed interference in a tighter prototype. Tape mesh, bead, stitched seam and rigid tooth roots all use this one coordinate map. It preserves bead arc length, not a complete woven-cloth constitutive law.

The head has a true semicircular outline of radius 0.30 u and a narrow neck of half-width 0.12 u. Its two lips occupy z = ±[0.04, 0.12] u; the thin middle wing occupies z = ±0.028 u. The recess has 0.012 u clearance per side. The wing lies at tooth-local x = 0.68–0.80 u so it **actually enters the rounded recess**, rather than just a rectangular envelope. A thickness cut at L7's along-chain offset 0.275 u computes the head extent with the circle equation and intersects the same wing. The upper lip is a labelled cutaway; it is not a tooth disappearing during engagement.

In the straight chain, head back faces meet at x = 0 and shoulders overlap by 0.10 u along the chain. Finite outer and middle layers are tested separately, including every same-row and opposing-row pair within the sampled transition. Their conservative rectangular envelopes contain the rounded rendered solids. A sampled finite-tooth sweep generates the slider Y envelope with 0.032 u allowance. Plate inner faces are z = ±0.17 u, and flange slots leave the cloth exit open. This is a geometrically prescribed clearance path, **not a contact-force solver**.

The bottom bridge joins both beads and meets the slider's lower edge at the lower limit. Bored top stops are taller than the mouth opening; bisection of their transformed polygon contact with the upper plate establishes the upper limit. Upper teeth may remain inside the guide at that limit, which the text explicitly states.

The load instrument is separate from the moving zipper: one rigid tooth, symmetric frictionless contacts and normalized F. Equal moment arms give R₁ = R₂ = F/2. Zero load has no force arrows; arrow lengths derive from the computed individual forces. No strain or load redistribution is invented. The counterfactual removes the broad head shoulder while preserving pitch and nose reach; it does not simulate material failure. It compares the same requested outward displacement and holds ordinary heads at their blocking contact.

**Limits:** teaching proportions, not production tolerances. No woven-fibre shear/stretch solver, anchorage stress, friction, drive force, wear, chain-wide load distribution, strength or failure threshold. No claimed continuous analytic collision proof or real-product collision-free certification. Numerical sweep evidence covers the declared model and sampled ranges. The head/wing thickness test checks actual curved geometry in addition to conservative sweep bounds.

Whole-view bounds include tape endpoints, finite tooth outlines, slider and stops. Tests project those actual extents through a Three.js PerspectiveCamera, not just a nominal object width. Labelled close-ups intentionally crop the remaining tape; their relevant bounds also have a 0.85 NDC margin. No physical base is invented for this flexible article.

## Sources and provenance

- [YKK — The Craftsmanship of YKK, Vol. 1](https://www.ykk.com/english/ykk/tech/01.html): elements, tapes, slider and Y-shaped operating passage.
- [YKK — Zipper Usage Instruction Manual](https://ykkamericas.com/wp-content/uploads/2021/10/ykk-zipper-instruction-manual-compressed.pdf): closed-end component relationships, top stops, bottom stop, body, crown and pull tab.
- [US3886634 — Zip-fastener, New Japan Slide Fastener Manufacturing Co., 1975](https://www.freepatentsonline.com/3886634.html): manufacturer's primary description of mushroom heads, neck wings and head recesses. The scene is a separate teaching construction; it does not reproduce the patent's skirt geometry or claim its flexibility improvements.
- [YKK — Asia Slider Catalogue](https://ykk.pl/wp-content/uploads/2021/02/asia-slider-catalog.pdf): slider body, diamond, flanges, tape gap and distinction between non-locking and automatic-locking sliders.

## Evidence at handoff

- `pnpm exec vitest run src/models/zipper.test.ts`: **14 tests passed**. Unit-speed path and joins; pitch and persistent IDs; 241-phase outer/middle finite-layer sweep including same-row neighbours; actual rounded groove/wing entry; bore bend clearance; shoulder contacts and blocking; counterfactual passage; 501-sample Y guide bounds; actual top/bottom stop contacts; normalized force balance; deterministic reverse/seek/reset and extreme inputs; meaningful macro projections; actual full-object extents through Three perspective.
- Targeted TypeScript program covering owned TS/TSX and tests: zero diagnostics. Exact packet schema, cue windows, required related slugs/sources, every authored label/metadata and shared translation overlap preservation: passed.
- Owned cover through Astro compiler; both MDX files through the installed Astro MDX renderer; `understand`, `try`, `deeper` anchors and no raw TeX: passed. Owned-file Prettier checks passed.
- Independent review tree `/tmp/vistep-zipper-review` installed its own 379 dependencies offline. No shared node_modules symlink or production/preview build. All actual browser operation used **CUA**, Codex in-app browser, 1100×900 and 320×1000.
- CUA keyframes inspected: whole assembly, upper-lip/thickness section, guide, upper/lower stops, force instrument, shoulder comparison and functional 2D mode. The first unavailable-connection error page blocked reuse; the documented new-tab API recovered the session. No alternative browser automation was used.
- At 320 px, all eight chapter midpoint scene measurements were **600 px Chinese; 600–600.2 px English**, document width **320 px**. This is the owned scene; the parent's integrated surrounding player/caption layout remains to be checked. These are viewport measurements, not a physical phone.
- Named ranges were **44 px** high; action buttons **44 px or more**. Keyboard End reached travel 1, load 1, attempted shift 0.45. Full reset returned travel 0.34, force 0.5, shift 0.25, whole view and 3D mode. The manual camera follows changing travel without throwing away the chosen orbit. Fallback preserves finite profiles, tape route and stops; anatomy retains its computed thickness section.
- Browser error/warning query was empty at the checked state. The private Vite harness has a deprecated transform-helper warning, not shipped scene code. Shared Studio supplies reduced-motion handling, offscreen/background pause, keyboard orbit and disposal; these were reviewed in source.

**Not claimed:** uninterrupted full-film viewing, synthesized or listened-to audio, native media seeking, real-phone frame rate, forced WebGL context loss or instrumented runtime disposal. The private fixture contained no audio/video elements. Parent owns integrated full-watch review, bilingual synthesis/listening, media-currentTime seek checks, shared checks/builds and publication.

## Frozen packet

`src/data/scene-packets/zipper.json` contains exact required keys, repository-relative imports, no topic number, four primary sources and related slugs `sewing-machine`, `lock`, `escapement`. Duration is **176**; chapter starts every **22 seconds**; cue starts at chapter +0.45 seconds, with 21.5-second windows. All spoken scripts, chapter titles, captions and timing fields are **frozen at handoff** for parent synthesis. No shared registrations or audio outputs were written.

## Owned paths

- `src/models/zipper.ts`
- `src/models/zipper.test.ts`
- `src/components/experiments/Zipper.tsx`
- `src/components/three/ZipperStudio.tsx`
- `src/components/three/ZipperDiagram.tsx`
- `src/styles/zipper.css`
- `src/components/covers/ZipperCover.astro`
- `src/content/zipper.mdx`
- `src/content/en/zipper.mdx`
- `docs/examples/zipper-brief.md`
- `docs/zh-CN/examples/zipper-brief.md`
- `src/data/scene-packets/zipper.json`
