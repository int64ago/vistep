# Escapement — Graham deadbeat

[简体中文](../zh-CN/examples/escapement-brief.md)

## Integrated film

The assembled Chinese and English tracks share **209.5 seconds**. The original 176-second storyboard below is the initial handoff; measured speech determines the final windows here. Authored chapter titles, captions and spoken wording are unchanged. Temporary packet paths below refer to the consumed handoff. `src/data/narration.json`, `film-timeline.json`, `audio-tracks.json` and `audio-manifest.json` are canonical.

| Chapter                                                   | Measured window |
| --------------------------------------------------------- | --------------- |
| 1. The wheel wants to turn; the pendulum gates it         | 0–26 s          |
| 2. The wheel rests while the pendulum moves               | 26–51 s         |
| 3. The tooth crosses the impulse face                     | 51–77 s         |
| 4. The exit pallet catches the next step                  | 77–102.5 s      |
| 5. One full swing, one tooth pitch                        | 102.5–129 s     |
| 6. Replacing losses sustains the swing                    | 129–155.5 s     |
| 7. A longer pendulum releases more slowly                 | 155.5–182.5 s   |
| 8. The weight supplies energy; the pendulum sets the beat | 182.5–209.5 s   |

Recordings: `/narration/escapement-zh-eb626f6a2606.mp3` · `/narration/escapement-en-6d8e79d5be09.mp3`

Full continuous viewing, native bilingual listening and physical-phone performance remain separate pending evidence.

---

Status: **frozen handoff to parent integration**, not release acceptance. Only escapement-owned files were written. The temporary packet is for integration, not an additional canonical narration registry.

## Concept and direction

A small open movement on a muted frame: brass escape wheel, steel anchor, copper-coloured pallets, a rear drum and hanging weight, and a front pendulum on the anchor arbor. Follow one permanently marked tooth. The distinction to retain is that continuous supply, periodic regulation and counting are different jobs.

The eight 22-second chapters have distinct visible actions:

1. Whole connected movement: alternating stops while the weight descends.
2. Entry locking: anchor pivot, concentric construction arc and stationary tooth.
3. Entry impulse: trace the tip from locking corner through the plane to discharge and drop.
4. Exit lock and return impulse: inspect the opposite orientation.
5. Two releases make one pitch: cumulative release count beside smooth pendulum motion.
6. Same initial state and damping: a free pendulum loses energy while fixed-work centre impulses sustain a narrow energy range.
7. Same elapsed time: vary effective length against a 0.70 m reference, showing periods and cumulative releases.
8. Whole movement: weight supplies work, contact gates advance, pendulum sets the approximate period.

The shared Showcase supplies the current caption. The scene does not repeat it as a watch-mode top paragraph. Phone contact chapters replace the desktop assembly/inset pair with one readable instrument. Energy and length chapters each have their own single SVG instrument.

## Model and construction

`src/models/escapement.ts` is the only motion/contact source. Thirty teeth give 12° pitch; a 7.5-pitch span gives a 90° embrace. The tip-circle radius is 1.5 u; wheel and anchor centres are separated by 1.5√2 u. Both locking radii are 1.5 u. The display uses raked finite triangular teeth joined into a root rim; the root radius is 1.12 u. Pallet geometry is generated from contact endpoints, not drawn independently in the renderer.

Entry unlock occurs at anchor +1.5°; discharge occurs at −1.5°, with 5° wheel advance. The exit uses the opposite anchor direction. Line/circle intersection reconstructs every impulse contact. A 1° drop reaches the opposite half-pitch lock. The circular locking faces extend 4°, allowing the declared 3–5° half-amplitude range. Drop occupies 0.018 cycles and uses an accelerating quadratic; its duration and speed are illustrative, not a solved impact.

The wheel, pallet outlines, contact highlights, rear mounting studs, drum clearance, pendulum endpoints, tooth identity and step count derive from the same model. Studs connect to the pallet backs while remaining behind the wheel plane. Bored rear bearing seats support both arbors. The weight cord runs from the drum tangent to the moving weight endpoint. Whole-view cameras fit all meaningful base/support bounds through the actual perspective basis, with an NDC margin of 0.85. Contact close-ups intentionally crop the rest of the clock and are labelled.

**Scope:** prescribed small-angle pendulum kinematics and quasi-static contact; no wheel-train inertia, material compliance, friction, impact, torque or efficiency prediction. The direct drum and shared pendulum/anchor arbor replace an actual clock's gear train, suspension and crutch. Display u is not a production dimension; effective pendulum length is in metres. Locking contact slides even though the wheel rests.

The energy comparison is a **separate** analytic linear pendulum, m = 0.20 kg, g = 9.81 m/s² and γ = 0.025 s⁻¹. It starts at the centre with the velocity corresponding to a 4° undamped amplitude. Between centre crossings it follows the damped analytic solution. At a crossing, velocity retains its direction and kinetic energy increases by Q. The default Q replaces the loss between consecutive centre crossings. Its work/loss ledger is exact within floating-point error. The undriven pendulum is disconnected from the escapement; it does not imply continued unlocking as amplitude vanishes. The graph uses E/E₀; instantaneous readouts use mJ.

## Sources and provenance

All geometry, cover and diagrams are original procedural work; no downloaded image or font assets were added.

- [Princeton TimeTeam — Graham escapement project](https://www.princeton.edu/~timeteam/graham.html): physical project, circular lock, impulse and drop. No historical priority claim or suspension-spring explanation was adopted.
- [Laurie Penman, Clockmaking Elements Part 6, Horological Times, July 2010, pp. 14–18](https://www.awci.com/wp-content/uploads/ht/July2010.pdf): professional horological source for concentric locking surfaces, separate impulse faces and raked tooth tips. The scene's dimensions are its own teaching construction, not the article's manufacturing plan.
- [OpenStax 15.4 — Pendulums](https://openstax.org/books/university-physics-volume-1/pages/15-4-pendulums) and [15.5 — Damped Oscillations](https://openstax.org/books/university-physics-volume-1/pages/15-5-damped-oscillations): small-angle period and damping model.

## Evidence at handoff

- `pnpm exec vitest run src/models/escapement.test.ts`: **15 tests passed**. Covers pitch/span, both impulse directions, finite tooth/pallet area-intersection sweeps at amplitudes 3°, 4°, 5° (601 phases each, all 30 teeth against both pallets), locking without recoil, tooth identity, cycle/drop continuity, rod/cord joints, independent damped-energy limits, work jumps, viscous power, reset/seek determinism, finite inputs, root-outline consistency, axial mounting clearances and perspective projections for overview/locking/entry/exit shots at aspect ratios 0.65, 0.83, 1.6 and 2.5.
- Targeted TypeScript program for owned TS/TSX and test files: zero diagnostics.
- Owned Astro cover compilation and both MDX files through the repository-installed Astro MDX renderer: passed. Required anchors are present; there is no raw TeX.
- Packet exact keys, no topic number, registered related slugs, source presence, 8 cue windows, all authored labels/metadata and shared dictionary overlap preservation: passed. Owned-file Prettier checks passed.
- Isolated fixture `/tmp/vistep-escapement-review` installed its own 379 dependencies offline; no shared `node_modules` link or production build. Browser operation used **CUA only**, Codex in-app browser, at 1100×900 and 320×1000.
- CUA visually inspected the whole assembly, entry impulse, concentric-lock view, exit pallet, energy/length comparisons and 2D fallback. All eight phone chapter midpoint DOM measurements were taken in both languages. Final scene heights: **Chinese 581–645 px; English 587–679 px**, document width **320 px** throughout. These are the owned scene, not the surrounding page/player. Shared transport integration remains parent QA.
- In the compact SVGs, 17 px authored text rendered above 17 px effective size. Named ranges measured **44 px** high. Buttons measured at least **44 px**. Keyboard extremes and full reset were checked, including previously hidden time/drive inputs and return from 2D. Fallback toggle bottom was 8 px above the status row in the final manual check.
- Browser console error/warning query returned empty during the checked state. The private Vite harness logs a deprecated transform helper; it is not shipped code.

Not claimed: uninterrupted full 176-second watch, synthesized audio, listening, native media seek, physical-phone performance, forced WebGL-context loss or runtime disposal instrumentation. The fixture contained no audio/video elements. Lifecycle behavior uses the existing shared Studio (offscreen/background pause, reduced motion, keyboard orbit, disposal), inspected in source. Parent owns final integrated watch, voices, media-currentTime seek checks, build and publication.

## Frozen integration contract

`src/data/scene-packets/escapement.json`: component and cover are repository-relative; related slugs are `pendulum`, `sewing-machine`, `differential`; sources are populated. Narration **duration 176**, eight **22-second** chapter starts, cue `at = chapterAt + 0.45`, `seconds = 21.5`. All zh/en spoken scripts, titles, captions and timing fields are frozen on handoff. Parent may measure/synthesize using the shared pipeline. No shared outputs were generated here.

## Owned paths

- `src/models/escapement.ts`
- `src/models/escapement.test.ts`
- `src/components/experiments/Escapement.tsx`
- `src/components/three/EscapementStudio.tsx`
- `src/components/three/EscapementDiagram.tsx`
- `src/styles/escapement.css`
- `src/components/covers/EscapementCover.astro`
- `src/content/escapement.mdx`
- `src/content/en/escapement.mdx`
- `docs/examples/escapement-brief.md`
- `docs/zh-CN/examples/escapement-brief.md`
- `src/data/scene-packets/escapement.json`
