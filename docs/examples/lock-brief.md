# Pin-tumbler lock — six interfaces, one boundary

[简体中文](../zh-CN/examples/lock-brief.md)

## Causal argument and visual direction

The opening tracks one driver pin bridging the plug and fixed shell. A complete matching key enters along one continuous path, lifts the stacks through rounded-tip contact, aligns all six interfaces, turns the plug, returns home and withdraws. The misconception to resolve is that every lower pin must rise to an identical height. Their lengths differ; their interfaces must clear one common boundary.

The object is an original cutaway cylinder in muted blue-grey housing metal, brass plug material, pale nickel key and pins, and one copper-colored tracked key pin. Rear shell and plug material remain. Half-bore guides, a keyway floor, housing supports, a common spring cap and a rear actuator provide connected structure. Key profiles are closed continuous solids with a tapered leading end, a shoulder, neck and bow. No copied manufacturer CAD, raster assets, external textures or generated images are used. A self-contained 400 × 230 SVG cover accepts an optional color and uses the same profile, pin heights and spring endpoints.

Desktop shots alternate the full insertion path, a closer pin-contact inspection, neutral key comparison and a near-axial turning view. The overview camera derives its center and span from both the key's insertion offset and the fixed assembly bounds. On a phone, the main instrument changes: a single-stack longitudinal section explains insertion and matching, two short sections compare keys, and an end-on 3D shot explains rotation and return. It does not stack a miniature full lock, inset, chart and controls. The longitudinal section has its own coordinates and measured readable text.

## Eight-beat silent film

The initial storyboard proposed 176 seconds, eight 22-second chapters. Each bilingual cue requests 21.5 seconds, beginning 0.45 seconds into its chapter. Chinese speech is 104–113 characters per chapter, English 55–58 words. Scripts are independently authored; parent owns measured synthesis and final shared timing. Scene state uses chapter/progress, not hardcoded audio lengths or an independent clock.

| Window    | Visible event                                                                 | Causal observation                                                       |
| --------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 0–22 s    | Track the first stack with the key absent; a requested angle remains blocked. | A driver bridges plug and shell.                                         |
| 22–44 s   | Insert the first 54% of the key travel.                                       | A leading ramp establishes contact and lifts each stack continuously.    |
| 44–66 s   | Finish insertion while following stack four and its contact point.            | A rounded nose follows a support envelope; both spring ends stay seated. |
| 66–88 s   | Inspect all six interfaces in order with the shoulder seated.                 | Different cuts and pin lengths complement each other.                    |
| 88–110 s  | Compare two seated keys at the same home angle, differing only at cut three.  | One mismatched stack defeats the all-stack clearance condition.          |
| 110–132 s | Turn the matching key and plug through 75°.                                   | Lower pins follow the plug; drivers remain supported in the shell.       |
| 132–154 s | Keep the key seated during a withdrawal request, then return the plug home.   | The removal condition is an orientation constraint.                      |
| 154–176 s | Withdraw the key along the reverse insertion path.                            | Drivers re-enter the plug and restore the initial barrier.               |

The comparison is a separately identified pair of complete keys at identical insertion and home-angle conditions, not a key morphing inside a loaded lock. Inspection time is encoded by absolute insertion and angle; every direct seek reconstructs the same geometry.

## Independent contact and clearance model

All lengths are illustration units `u`, not a manufacturer's key code or production dimensions. Six fixed stations have six distinct matching land heights and corresponding immutable key-pin lengths. The key is a continuous piecewise-linear upper profile with lands wider than the rounded nose diameter, plus a tapered leading tip and one fixed lower edge. Two alternative complete keys shift only the third land by ±0.18 u.

A pin center at longitudinal position x contacts the translated profile h through the exact rounded-tip support envelope: `ycenter = max(h(u) + sqrt(r² − (u − x)²))`, also bounded below by the keyway floor. For each line segment of slope a, the analytic optimum is `u = x + ra/sqrt(1 + a²)`, clamped to the available segment. Checking every segment includes corners and the leading ramp. Contact is not a point sampled directly beneath the center. The key moves as one rigid profile and the lower pin follows that calculated support; the upper pin and lower spring seat follow the same lift.

The plug radius is 1.05 u and the nominal shell-bore radial gap is 0.018 u. If interface error e is measured relative to the plug radius, a driver clears the plug for `e ≥ 0` and a key pin remains inside the shell bore for `e ≤ 0.018`. Every stack must pass, and the key shoulder must be seated. The supplied seated profiles have either exact nominal alignment or a ±0.18 u mismatch, so only the matching example can rotate. Requests do not move an obstructed plug.

A declared geometric idealization handles turning: lower-pin tops and driver bottoms follow the cylindrical plug boundary across their width. Their shared nominal interface therefore remains on a circular radial envelope when the plug turns. Drivers stay on that surface continuously, without a pin jump, a floating spring seat, or flat end corners penetrating the housing. Actual pin ends commonly use nearly flat faces and chamfers; production tolerances, deformable contact, friction and impact are outside this rigid illustration. The numerical clearance window is not a locksmith tolerance claim.

Springs use seven turns and two model-derived seats. Coil centerline endpoints are offset by the wire radius from the upper pin and fixed cap; the rendered wire reaches both seats. Throughout all supplied insertion paths the axial coil spacing exceeds wire diameter and the coil envelope stays inside its guide. Spring compression communicates contact geometry only; no force, stiffness or operating torque is invented.

The key, lower pins, plug guides and rear actuator share one X-axis rotation. Drivers, upper guides and spring seats stay in the fixed frame. Manual commands reject withdrawal while turned and key exchange before complete withdrawal. A full reset restores the matching key, zero insertion and request, first tracked stack and mechanism view. The 2D path uses the same pin heights and profiles; its end-view shear ends preserve the same circular envelope. No picking, bypass or individual-pin manipulation controls are included.

## Primary sources and provenance

Researched 2026-09-05. Sources support normal-operation principles; geometric formulas and renderers were independently authored.

- [Schlage component glossary and cylinder manual](https://www.schlage.com/content/dam/sch-us/documents/pdf/installation-manuals/P513-325.pdf): component names, paired pins and springs, simultaneous alignment, plug and tailpiece roles. Only relevant normal-operation definitions inform this scene.
- [ASSA ABLOY cylinder introduction](https://www.assaabloy.com/ng/en/solutions/locking-solutions/cylinders): matching-key lift permitting plug rotation and ordinary five/six-pin arrangements.
- [Yale heritage](https://www.yalehome.com/ke/en/stories/news/discover-the-heritage-of-yale): the flat-key pin-tumbler cylinder's design context. The scene is not a replica of a specific Yale or Schlage product.

The illustrated part names distinguish lower/key pins and upper/driver pins. The front material is an inspection cut, not a physically hollow production lock. Wards, master-key wafers, specialized pins, alternate key-removal positions and a complete door latch are omitted.

## Targeted verification and evidence limits

- `pnpm exec vitest run src/models/lock.test.ts`: **11 tests passed**, Vitest 5.0.0 / Node 24.19.0. Checks distinct bittings and profile continuity, analytic flat/slope contact, dense no-penetration samples across 151 insertions for all three profiles, fixed lengths, wrong-key blocking and the explicit shoulder-seated condition, the radial shear envelope through 0–75°, spring seats and coil spacing, rigid contact transforms, withdrawal/exchange guards, 1,001 insertion states, direct seeks and invalid inputs.
- Strict TypeScript over the five new TS/TSX entry files: zero diagnostics. Packet checks cover exact root/cue keys, eight bounded windows, required related slugs and primary sources, paths, all UI/metadata translations and unchanged existing shared wording. Astro cover compilation reports zero diagnostics. Both MDX files compile using the installed Astro Satteri renderer and use native formula blocks and inline code; neither contains raw TeX dollar delimiters.
- An isolated snapshot at `/tmp/vistep-lock-review` received an independent offline frozen-lockfile install: 379 packages, no `node_modules` symlink. Its private Vite 8.2.2 harness and Chrome 152 headless profile use separate ports and do not operate the parent's browser or write shared registration/build outputs.
- Desktop cutaway/contact stills and phone section/comparison/turning stills were inspected. The first phone comparison measured 956 px; removing the redundant global status and reducing status emphasis corrected it. At 320 CSS px the eight chapter midpoints measured **730–786.9 px Chinese** and **775.0–852.9 px English**, with document and scene widths of 320 px. The additional retained-key frame at 135.3 s measured 872.3 px in English, also without overflow. Main body text is 16 px; the section's transformed SVG labels measure 16.15 px. These stage bounds exclude the shared transport in the harness and do not establish physical-phone performance.
- Chrome accessibility inspection confirms two explicitly named, 44 px manual ranges. Keyboard End reaches full insertion and 75°; the insertion range and all key-exchange buttons then disable. The pin-section choice displays a working end view while turned. Reset restores both ranges to zero, the matching key, first stack and mechanism view. A wrong-key 75° request leaves actual plug angle at zero. Comparison returns the request to zero and holds both cases at home. Forced WebGL loss displays the end-view fallback at 775.1 px scene height / 320 px document width, with no runtime exceptions.
- Shared `Studio` supplies reduced-motion, offscreen/background handling and disposal; the new scene has no separate animation timer. These lifecycle claims are based on reuse and source inspection, not a device memory/performance profile. No recorded media is loaded by this harness: model/visual seek evidence does not establish media currentTime or synchronized audio seeking.

Not claimed: complete uninterrupted 176-second watching, synthesized audio listening, physical-phone timing, final integrated routes or complete player behavior. Parent owns final browser QA, voices, registration, global verification and production/preview builds. No previous topic, shared registry, dictionary, narration manifest, package file, ledger, guide, git state or deployment was changed by this worker.

The scene is registered in `src/data/topics.ts`, with authored bilingual cues in `src/data/narration.json`, measured windows in `src/data/film-timeline.json` and assets in `src/data/audio-tracks.json`. Authored wording was frozen before synthesis; measured integration is recorded below.

## Measured integration

Both recordings are 196 seconds. Earlier 176-second storyboards describe the production draft; the measured chapter windows below are authoritative. The film director follows these chapter windows and the media clock. Full integrated viewing and native listening remain separate review tasks.

Chinese: `/narration/lock-zh-16acf097163e.mp3`. English: `/narration/lock-en-5b82b3c3bca4.mp3`.

| Chapter | Window (s) | Focus                                      |
| ------- | ---------- | ------------------------------------------ |
| 1       | 0–24.5     | Start with a stack that blocks rotation    |
| 2       | 24.5–48    | The key advances through one keyway        |
| 3       | 48–73      | Rounded tips follow the continuous profile |
| 4       | 73–97.5    | Different lengths reach one boundary       |
| 5       | 97.5–123   | One mismatch still blocks the plug         |
| 6       | 123–148    | Clear the boundary, then turn the plug     |
| 7       | 148–172.5  | Return home before withdrawing             |
| 8       | 172.5–196  | Withdraw the key, restore the barrier      |
