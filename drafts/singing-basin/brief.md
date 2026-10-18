# Singing bronze basin

Owner: teaching_shell. This is author self-review, not independent acceptance.

## Textbook and misconception

`e1-water-spraying-basin`: 人教版高中物理，选择性必修第一册，第二章，第6节“受迫振动 共振”，第54页（PDF第59页）的开篇问题。全文核查来自 `/tmp/vistep-physics-catalog/人教版高中物理-选择性必修第一册-layout.txt`，form-feed页索引58。保留铜盆“洗”、两侧盆耳、慢慢摩擦、嗡嗡声与水花。

The misconception is that the slow rate of hand strokes must equal the audible frequency of the basin. The experiment belongs to this textbook section but the specific apparatus is friction-driven self-excitation, not simply an external periodic force of the hand-stroke frequency. No extra user action is needed for the automatic demonstration.

## Evidence and limits

| Claim                                                                                             | Primary evidence                                                                                                       | Assumptions and valid range                                                                   |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Dry friction can excite the coupled shell–liquid system; four/six spray sites relate to its modes | [Liu et al., 1995 abstract](https://pubs-en.cstam.org.cn/article/id/ams_128837)                                        | Qualitative mechanism, not a calibrated model of the pictured basin                           |
| Elastic hand dynamics participate in coupled self-excitation                                      | [Acta Mechanica Sinica, 1998 abstract](https://pubs-en.cstam.org.cn/article/id/ams_128878)                             | A hand’s elastic natural frequency is distinct from its rubbing rate                          |
| Four/six fountain examples and high-frequency basin vibration are experimentally documented       | [Wang, 2005, Section 3, printed pp13–15](https://journals.ub.ovgu.de/index.php/techmech/article/download/890/866/2444) | 100/300 Hz are example scales from particular systems, not universal basin values             |
| Growth, saturation and release follow a reproducible energy balance                               | Independent normalized envelope in `src/models/singing-basin.ts`                                                       | This is an explicitly reduced teaching model; fluid breakup and mode selection are not solved |

The 1995 and1998 full PDFs were unavailable from their publisher download endpoints during research. Their primary abstracts were read. The2005 full primary PDF was available and its Section3 was read. The papers describe richer nonlinear dynamics than this illustration.

## Directed sequence

Five continuous chapters,26 seconds each planned,130 seconds total. Measured speech timing remains integrator-owned.

1. `basin-still`: handled bronze bowl and nearly still water; distinguish slow hand motion from fast vibration.
2. `basin-growth`: rubbing starts; an analytic energy envelope grows and saturates; wall displacement and water response follow its amplitude.
3. `basin-four`: highlight four alternating antinodes and the shell-mode nodal-line projection; four response regions.
4. `basin-six`: controlled comparison with six antinodes; explicitly not a guarantee that moving hands faster selects that mode.
5. `basin-release`: retain the six-antinode mode, remove the supply at model time8s, and decay existing vibration and droplets.

The curriculum variant covers all five chapter IDs, in order. The only variant is `e1-water-spraying-basin`.

## Model and controls

Normalized modal energy solves `E′ = 2(g−d)E − 2gE²` analytically; `A = sqrt(E)`. Effective gain is `g=1.05×strength`, loss is `d=0.4`, and the initial disturbance energy is0.0004. The formula handles the zero-net-gain limit explicitly. After release, energy decays at2d and amplitude atd. Input and loss readouts derive from this same equation.

Modes `n=2/3` use `cos[n(θ−π/(2n))]`, with four/six antinodes. Water mass changes the illustrative mode frequency using a mass–stiffness ratio. Rubbing strength changes gain, not that frequency. Fluid surface breakup is not computed: spray markers are emitted at antinodes above an illustrative amplitude threshold, then follow ballistic trajectories until they return. A dry basin cannot produce spray. Nodal lines refer to the shell mode, not exact capillary-wave nodes.

Exploration changes mode, gain, water load, elapsed time, and continuous input versus release at8s. All controls alter calculation or a stated experiment condition. Directed playback ignores previous exploration settings. No synthetic tone is added; authored narration remains under the shared player.

## Art and responsive composition

An oblique bronze basin with two handles and contacting palms carries the argument. The shell outline is the model’s mode shape, shared with the cover. Water regions and droplets use the model’s antinode positions; the final release retains the same selected apparatus. The viewBox crops unused space around the object, not moving parts. Arms intentionally enter from the sides.

All prose and numeric labels are wrapping HTML at16px or larger; the drawing contains no tiny SVG text. Phone controls stack, and mode selectors retain44px targets. Static author raster evidence is in `artifacts/pep-curriculum/author/singing-basin-chapter-*.png`. This is not a full-player screenshot or a physical-phone performance measurement.

## Verification and handoff

- Five model tests compare the analytic envelope with independent numerical integration, check the gain boundary/saturation, continuous release, nodal geometry, added mass, no-water and invalid-time cases.
- Two stateful React tests verify six-mode release, active controls and return from exploration to the same directed render.
- Both MDX documents compile using the installed Astro Sätteri processor. Owned TS/TSX files have no syntax diagnostics.
- `node scripts/integrate-scene-packets.mjs singing-basin` validates the packet without writing shared files.
- The integrator still owns registered routes, discovery, translations, measured bilingual voice generation/listening, full browser playback and responsive acceptance, `pnpm verify`, `pnpm build:preview`, and publication.

Precise file hashes and per-evidence statuses are in `review.json`. No audio, global registry changes, browser automation, global build or commit was performed by this worker.
