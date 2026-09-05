---
name: vistep-scene
description: Turn a natural-language scene request into a complete vistep.ai visual explanation, including research, an independent visual design, a scientific model, automatic demonstration, Chinese and English narration, implementation and review. Use when asked to add a scene or improve an existing vistep explanation.
---

# vistep scene production

Work from the repository root. Read `AGENTS.md` and `docs/creating-a-scene.md`; consult `docs/retrospective.md` when choosing a visual or interaction approach. These are repository files, not global design rules.

Accept a natural-language request such as “新增一个感应电机原理的场景” or “Improve the printer's internal demonstration.” The user supplies the subject and any preferences; choose the slug, representation and implementation details yourself. The entry point is this skill. Do not hand the user a shell command or ask them to create scaffolding, fill a brief or run checks as a prerequisite.

Carry a scene request through research, a brief and storyboard, a working model and renderer, bilingual writing and narration, integration, review and the publication scope already authorized. A plan or generated draft is an intermediate artifact, not the completed scene. If a required external dependency is unavailable, complete independent work and report the specific missing dependency rather than implying the scene is finished.

Select a trackable object and sketch the initial, turning and resulting states before implementing. Choose the representation from the phenomenon; never default to another scene's panel layout. You may run `pnpm scene:new <slug> --medium <three|svg|canvas|audio|hybrid>` internally to prepare a draft, or prepare the same files directly. The helper is optional, and the user does not need to see or execute it. Drafts remain unpublished.

Plan a 2–5 minute film, preferably 2–3 minutes, with five minutes as the ceiling. Every chapter must add visible explanatory work: a causal step, a close observation or a controlled comparison. Never extend a short loop by adding narration. Record what changes on screen and what that change proves before producing speech.

Make one complete causal sequence work first. The reader should understand it while watching silently. Keep manual experiments optional, use model-derived state for geometry and readouts, and expose teaching simplifications. Share the director and lifecycle utilities; retain independent scene composition. Preserve the exact compact brand derivation described in `AGENTS.md` when touching the homepage.

Integrate the files listed in the scene guide. Author Chinese and English explanations and spoken scripts separately; preserve the shared timeline. Direct shots from chapter-relative time; seeking must reconstruct simulation history and training progress, not only update the caption. Settle presentation transitions to the requested state on a paused seek. Use the existing narration generator only when audio actually changes. Use measured speech windows without time stretching. Independent transcription can detect wrong-language or unintelligible output; it is separate from a listening review. Ordinary builds must not need provider credentials. Do not replace recorded narration with browser text-to-speech.

Run `pnpm scene:check`, then the checks appropriate to the change. Use `pnpm verify` and `pnpm build:preview` before a scene handoff. Inspect the complete film, key still frames, mobile composition and both spoken tracks. Tests establish numerical and publishing contracts; they do not establish visual polish or vocal quality. Record real observations and untested limits in the draft review sheet. Do not mark a placeholder draft finished or publish it to fill a catalog slot.

Keep generated transcripts, search schema, social covers and bilingual documentation current with the topic registry. Maintain English-default documentation and its Chinese counterpart.

Hand off the actual scene and its preview or changed files, with concise evidence and any remaining limitations. Keep internal scaffolding commands out of the handoff unless the user asks about implementation tooling.

For publication use `docs/deployment.md` and the authorization already given in the task. This skill grants no additional permission to change production, repository visibility or external account settings.
