# Mobile networks review — 2026-09-26

[简体中文](zh-CN/qa-mobile-networks.md) · [Review index](README.md#review-records)

This record covers scenes 72–74 added on parent commit `72ca2bb`: [cells and handover](examples/cell-handover-brief.md), [4G and 5G](examples/mobile-5g-brief.md) and [mobile roaming](examples/mobile-roaming-brief.md). Each scene had its own owner; one integrator owned registries, translations, recordings and documents. Three further agents that authored none of the scenes performed read-only independent reviews. Evidence types are recorded separately; untested conditions are listed at the end.

## Scope and films

| Scene              | Film | Main argument                                                                                                                                                                                                             |
| ------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cells and handover | 2:51 | One phone on a bus: spectrum reuse, best-server boundaries from path loss and shadowing, A3 hysteresis and time-to-trigger, an X2 handover with forwarded packets, idle reselection and paging.                           |
| 4G and 5G          | 3:47 | Rate = bandwidth × bits per resource element × layers: OFDM orthogonality, QAM against noise, wider carriers, millimetre-wave loss and blockage, array gain, layers and numerology, then sharing, position and backhaul.  |
| Mobile roaming     | 3:03 | PLMN selection from the SIM list, IMSI routing, S6a authentication vectors over IPX, MILENAGE AKA with AUTN/XMAC and RES/XRES, location update, home-routed versus local-breakout data and circuit-switched call routing. |

## Numerical checks

| Evidence                  | Result and scope                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Model tests               | 113 tests in 10 files passed for the three scenes' models, directors and covers. They include TS 36.331 time-to-trigger values, deterministic shadowing, ping-pong counting, handover message order and packet delivery; the TS 38.306 peak rate (100 MHz, 30 kHz, 4 layers, 256QAM = 2.337 Gbit/s); FIPS-197 AES, both TS 35.208 MILENAGE test sets and RFC 4231 HMAC cases. These are author tests.                    |
| Independent recomputation | The roaming reviewer recomputed MILENAGE with a separate node:crypto implementation and matched test set 1 (f1–f5, f1*, f5*), AUTN, RES, AUTS and the TS 33.401 K_ASME derivation. The 5G reviewer re-derived the TBS-calibrated LTE figures, FSPL, TR 38.901 penetration losses, beam gains and slot waits. The cell reviewer checked A3, the L3 filter, the TS 36.133 interruption form and the TS 36.304 R-criterion. |
| Full verification         | `pnpm scene:check` (20 tests) and `pnpm verify` passed: formatting, documentation links, `astro check` with 0 errors and 0 warnings, 1,182 tests, production build and build audit. `pnpm build:preview` passed its noindex audit. One ignored local file under `artifacts/` timed out once under load and passed on rerun; it is not part of the repository.                                                            |

## Independent review findings and repairs

| Scene     | Main findings                                                                                                                                                                                                              | Repair                                                                                                                                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cells     | The "nearest is not strongest" probe differed by 3 m; ch6 path switch preceded its sentence; the core column hid S-GW/UPF; the gap could be read as the TS 36.133 interruption; tracking-area chips sat on the wrong area. | The probe now requires a 1.3× distance ratio (227 m vs 297 m, both drawn); ladder keyframes follow the recorded sentences; labels read MME·S-GW / AMF·UPF and "downlink gap"; chips anchor inside their area. |
| 4G and 5G | Three picture/speech mismatches (ch3, ch5, ch8); a 12 × 14 "resource block"; ×5.81 mixed bandwidth and overhead; unequal user shares; 4G estimates unlabelled.                                                             | Beats retimed to measured pauses; 12 × 7 blocks per 0.5 ms; ×5.46 bandwidth × 1.06 overhead; rotating allocation gives exactly 1/N (58.4 Mbit/s); estimates labelled. Chapters 2 and 8 were re-recorded.      |
| Roaming   | Ch1 and ch4 visuals 2–6 s off the speech; AUTN check not visible; ch7 local caller mislabelled; ch6 tunnel appeared to use the public internet; explore replay contradicted itself; negative SVG radius errors.            | Per-language beat tables from measured pauses; AUTN split into SQN⊕AK · AMF · MAC with XMAC; friend call re-routed; tunnel through a labelled IPX node; AUTS and SQN shown for replay; phase wrapped.         |

## Browser evidence

Headless Chrome 153.0.8010.54 on macOS drove the local development server over the DevTools protocol. The integrator, owners and reviewers inspected stills at 1280, 390 and 320 px in both languages for every chapter, explore mode, reduced motion and the 400 × 230 catalog card and social image. Reported measurements found no horizontal overflow and no text below 16 px after SVG scaling. Each reviewer ran 66–75 s of real-time playback with narration across chapter boundaries: the film clock and audio stayed together, pause froze both and replay restarted with audio. The cell scene's Worker was disabled and blocked separately; its main-thread fallback produced the same results without console errors.

## Narration

Both languages were synthesized with the existing edge-tts pipeline and measured without time stretching. Local independent transcription (`--backend mlx`, no language hint) passed every chapter of all three scenes. This checks intelligibility and complete endings only; it is not a listening review.

## Untested conditions

- No native listening review of warmth, pronunciation or rhythm.
- No complete continuous viewing of all three films in both languages; playback evidence is 66–75 s per scene plus sampled stills.
- Beat timing follows sentence pauses measured in the recordings, not word-level alignment.
- No physical-phone performance measurement; viewport emulation is not a device test.
- Offscreen pausing, disposal and autoplay-refusal prompts were not exercised specifically for these scenes.
- Deployment and live-site verification are outside this record.
