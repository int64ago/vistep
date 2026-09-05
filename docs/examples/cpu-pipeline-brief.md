# CPU pipeline — instruction workshop

[简体中文](../zh-CN/examples/cpu-pipeline-brief.md)

## Question and visual argument

Why can a program finish sooner when its first instruction still takes five cycles? Follow the same instruction IDs through a carefully spaced paper workshop and a timing record. The object of attention is an instruction and its actual operands, not a decorative processor enclosure.

The opening isolates I1. The turning point is cycle 5: I3 receives four and seven from different pipeline latches, computes eleven, and still has not written r3. A later close view distinguishes an unavailable load value from an already computed ALU value. The conclusion reruns the identical program against a sequential schedule and checks every architectural value and useful instruction in order.

Desktop composition has five horizontal stations, persistent coloured instruction tickets, actual forwarding arcs and a selected set of timing rows. The phone uses five vertical stations with full-size labels, textual forwarding receipts and a four-cycle timing window. It does not shrink the desktop coordinate system. Exploration restores the full desktop timing ledger and exposes cycle stepping, the initial memory input and the forwarding switch.

## Eight authored chapters

Planned duration: 176 seconds, eight 22-second chapters. The component reads `useShowcase().chapter` and `chapterProgress`, so measured audio can change chapter windows without changing the model. The scripts are separately authored in Chinese and English in the integration packet.

| Chapter             | Model state shown                                 | New observation                                                               |
| ------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1 · One instruction | Sequential cycles 1–5                             | I1 retains its ID across all stages; arithmetic passes MEM without an access. |
| 2 · Overlap         | Pipeline cycles 1–6                               | Younger instructions occupy stations freed by older ones.                     |
| 3 · Throughput      | Both schedules, common elapsed cycles 0–40        | Completed IDs arrive closer together; I1 latency remains five cycles.         |
| 4 · Missing value   | Forwarding disabled, cycles 3–8                   | I3 waits in ID while older writers advance; no stale operand is consumed.     |
| 5 · Forwarding      | Enabled, cycles 3–7, long hold at 5               | I3 gets r1=4 from WB and r2=7 from EX/MEM; r3 has not yet changed.            |
| 6 · Load-use        | Cycles 5–9, close holds at 7 and 8                | IF/ID hold, EX contains a bubble, and the loaded eleven arrives next cycle.   |
| 7 · Taken branch    | Cycles 8–12, long hold at 9                       | I7 and I8 are visibly cancelled; I9 restarts fetch and M[4] stays zero.       |
| 8 · Verify          | Both schedules to completion; final decomposition | Eight useful instructions, identical result, 15 versus 40 cycles.             |

Every chapter reconstructs its complete preceding architectural history. Seeking is not a caption-only reset. No topic timer, network request, audio instance, observer, renderer or worker is created. Playback lifecycle, reduced-motion pause, narration permission and narration disposal remain with the shared Showcase player. CSS movement runs only while its `playing` state is true; a paused seek has no lingering transition.

## Scientific specification

The independent model implements ADDI, ADD, SUB, LW, SW and BEQ with eight signed-display 32-bit registers and fixed-zero r0. Arithmetic wraps to 32 bits. Memory is byte-addressed, aligned, single-cycle word storage; unwritten addresses read zero. Branch targets are instruction indices and instructions are predecoded. This is a pedagogical RISC-V-like subset, not a binary-compatible emulator.

Snapshots show stage occupants during a cycle and values at its end. WB writes before ID reads. Forwarding into EX prioritizes EX/MEM over MEM/WB and excludes r0. An immediate load consumer stalls for one cycle; disabled forwarding waits for writeback. Store operands and branch operands use the same dependency rules. A taken branch resolves in EX and squashes the younger IF and ID occupants before any side effects. Stores update memory in MEM. Useful instructions, including stores and branches, finish in WB.

The sequential reference schedule uses the same five equal-duration stages without overlap. A separate direct interpreter checks architectural correctness independently of the pipeline implementation. The model does not claim real clock frequency, hardware speedup, cache behaviour, exceptions, multiple issue or out-of-order execution.

Primary sources checked on 2026-09-05:

- [Harris & Harris, Microarchitecture lecture](https://pages.hmc.edu/harris/class/e85/old/fall21/lect22.pdf), particularly slides 53–56: load-use interlocks and the EX-stage branch decision with two younger instructions flushed.
- [Brown CSCI1952y, five-stage CPU](https://cs.brown.edu/courses/csci1952y/2024/notes/pipelined_cpu.html): forwarding latches, newest-value priority, register-file read/write timing and stalls. Brown resolves its branch later and flushes three instructions; that specific count is deliberately not used here.
- [RISC-V International, RV32I specification](https://docs.riscv.org/reference/isa/v20260120/unpriv/rv32.html): arithmetic, loads/stores and branch instruction semantics. The teaching model's smaller register file and branch notation are explicit departures.

## Provenance and integration

All artwork is original DOM/CSS/SVG, generated from the independent model. There are no downloaded assets or runtime scientific services. The cover accepts optional `color` and renders its own complete 400×230 SVG, including actual cycle-5 occupants and actual timing cells.

The handoff used a temporary integration packet. Its exact keys are `topic`, `component`, `cover`, `translations` and `narration`. Topic number is omitted. Shared translations `3 分钟` and `完成` retain `3 minutes` and `Complete`. No shared registry, narration source/manifest, global CSS, deployment file or lockfile was edited. The parent owns central registration, synthesis, measured timing, shared verification and release.

## Review evidence and limits

Environment: macOS, Node 24.19.0, repository Vitest 5.0.0, independent headless Google Chrome 152.0.7977.76 via the bundled Playwright package. The worker's cwd is the shared repository, so only the assigned unique files were written; no branch operations, push, deployment or parent browser operation occurred.

- `pnpm exec vitest run src/models/cpu-pipeline.test.ts`: 11 passing tests. Includes 150 deterministic mixed programs across forwarding, interlock-only and sequential schedules; exact architectural equality; one-cycle load stall; wrong-path store suppression; newest-producer priority; r0; store and branch consumers; backwards branches; empty and bounded nonterminating programs; 32-bit boundary inputs; and every frame reconstructed by reverse-order direct seeks.
- TypeScript diagnostics filtered to the three CPU source/test entry points: zero. Unrelated integration diagnostics are not reported as this topic's failures or silently fixed.
- Static packet scan: every Chinese component string has a dictionary entry; shared dictionary collisions agree. Eight cues have the required fields, two languages and contiguous 22-second windows.
- Component browser stills inspected at 1080 px (forwarding and final comparison), 390 px (load stall and final comparison), and 320 px (English branch flush). No page errors or document horizontal overflow; paragraph/label text measured at least 16 px. Inspection found an English timing-column heading collision at 320 px; the compact heading now uses `#`, and watch mode's desktop timing paper shows the chapter's focused instructions.
- Final browser sweep: 96 sampled states (eight chapters × four progress positions × three widths), with zero document/ticket overflow, zero undersized paragraphs and zero page errors. Reduced-motion checks found no active animations. All seven primary button/range/toggle targets measured 44 px high. Keyboard reset/step reached cycle 1; keyboard input changed M[0] to 5, retained both branch-path instructions and produced M[4]=16. Completion checks matched the sequential reference with forwarding on, off, and the changed input. This audit also found and fixed implicit labels attaching to numeric outputs: both sliders now have explicit unique label/input associations.
- The standalone cover passed Astro compiler validation with no diagnostics. Only the ten topic files were formatted; no production/preview build or shared formatter was run. Narration text, captions, chapter count and director timing were not changed after parent preflight began recording voices.
- These are isolated component checks with the packet merged into localization in memory, not a production route review. Screenshots live only in the temporary QA directory `/tmp/vistep-cpu-qa/`; they are not site assets.

Not yet evidenced: real-time complete 176-second viewing in the registered player, listening to either synthesized language, blocked/missing audio behaviour for the new manifest, real physical-phone performance, and central production/preview build checks. The parent must complete these after integration. Do not treat successful model tests, silent stills or a viewport emulation as substitutes for those reviews.

## Parent integration — 2026-09-05

The packet has been consumed into `src/data/topics.ts`, `src/data/experiments.ts`, `src/i18n/en.json` and `src/data/narration.json`. It is not retained as a duplicate source. Recorded Chinese and English tracks both measure **187.0 seconds**, with eight shared chapter windows. The earlier 176-second table is the pre-recording storyboard, not the final transport timeline. Actual windows are in `src/data/film-timeline.json`.

All 16 chapter/language pairs passed independent ASR, minimum similarity 0.8764. Assets: `cpu-pipeline-zh-9e7fdde66a67.mp3` and `cpu-pipeline-en-e6725829422a.mp3`. ASR does not establish vocal naturalness or listening. The six-topic parent model run passed 58 tests; route/phone refinements and final shared checks are recorded in the expansion log. Full continuous viewing and physical-phone evidence remain outstanding.
