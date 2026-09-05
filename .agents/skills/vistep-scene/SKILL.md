---
name: vistep-scene
description: Create or substantially revise a vistep.ai visual explanation, including its scientific model, directed demonstration, bilingual content and synchronized narration. Use for new scenes and scene quality work in the vistep repository.
---

# vistep scene production

Work from the repository root. Read `AGENTS.md` and `docs/creating-a-scene.md`; consult `docs/retrospective.md` when choosing a visual or interaction approach. These are repository files, not global design rules.

Start a new scene with `pnpm scene:new <slug> --medium <three|svg|canvas|audio|hybrid>`. Fill its brief, select a trackable object and sketch the initial, turning and resulting states before implementing. Drafts remain unpublished. Choose the representation from the phenomenon; never default to another scene's panel layout.

Make one complete causal sequence work first. The reader should understand it while watching silently. Keep manual experiments optional, use model-derived state for geometry and readouts, and expose teaching simplifications. Share the director and lifecycle utilities; retain independent scene composition. Preserve the exact compact brand derivation described in `AGENTS.md` when touching the homepage.

Integrate the files listed in the scene guide. Author Chinese and English explanations and spoken scripts separately; preserve the shared timeline. Use the existing narration generator only when audio actually changes. Ordinary builds must not need provider credentials. Do not replace recorded narration with browser text-to-speech.

Run `pnpm scene:check`, then the checks appropriate to the change. Use `pnpm verify` and `pnpm build:preview` before a scene handoff. Inspect the complete film, key still frames, mobile composition and both spoken tracks. Tests establish numerical and publishing contracts; they do not establish visual polish or vocal quality. Record real observations and untested limits in the draft review sheet. Do not mark a placeholder draft finished or publish it to fill a catalog slot.

For publication use `docs/deployment.md` and the authorization already given in the task. This skill grants no additional permission to change production, repository visibility or external account settings.
