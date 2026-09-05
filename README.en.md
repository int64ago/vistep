# vistep.ai

**Open up the everyday.** · [简体中文](README.md)

Carefully made visual explanations of the mechanisms behind everyday life and work. Watch a process unfold, then explore the details that interest you.

[Try the preview](https://vistep-preview.int64ago.workers.dev/en/) · [Contribute](CONTRIBUTING.md) · [Scene production guide](docs/creating-a-scene.md) · [Documentation](docs/README.md)

> The complete site currently runs at the preview URL. The production domain, `vistep.ai`, still serves the original brand page. This repository is prepared for open collaboration under MIT; its visibility remains the owner's choice.

## Experience

Twelve bilingual explorations: bicycle gearing, refrigeration, laser printing, active noise cancellation, GPS, web loading, JPEG, language-model training and generation, dimensions, pendulums, elevator scheduling and traffic waves.

Each has a 30–42 second guided demonstration, optional experiments and deeper reading. Chinese and English narration is written separately and synchronized with the visuals. Sound starts only after the reader enables it. Models run in the browser, with no account, API key or live AI service required.

Physical mechanisms use procedural 3D where spatial structure matters; waves, image blocks and timelines use representations suited to the phenomenon. Scenes share navigation and playback infrastructure, while retaining their own composition. Two-dimensional views support WebGL failure, and the silent film remains understandable.

**Visualize Every Step with AI → vis step ai → merge the adjacent s characters → vistep ai → vistep.ai.** The compact homepage animation preserves this derivation, with replay and reduced-motion support.

## Run locally

Node.js 22.12+ is required; Node 24 is recommended (`.nvmrc`). Use the pinned pnpm version. No Cloudflare login is needed for development.

```sh
npm install --global pnpm@11.25.0
git clone https://github.com/int64ago/vistep.git
cd vistep
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:4321](http://127.0.0.1:4321/). Recorded audio is committed to the repository. Normal builds do not call a speech service.

```sh
pnpm scene:check                              # Check scene, language and audio contracts
pnpm verify                                  # Format, types, tests, build and artifact audit
pnpm build:preview                           # Separate output with noindex headers
pnpm preview                                 # Serve the production build locally
```

## Creating an explanation

Use the [vistep-scene skill](.agents/skills/vistep-scene/SKILL.md) with a natural-language request:

> Use $vistep-scene to create an explanation of why an induction motor turns.

The skill handles research, storyboarding, an independent visual design, modeling, implementation, Chinese and English narration, and review. Describe the subject and any preferences; the skill runs its production tools internally.

Start with one question, one object to follow and the initial, turning and final frames. Choose 3D, SVG, Canvas, audio or a combination because it explains the subject. Implement one complete causal sequence before adding optional controls. Keep numerical models independent and make teaching simplifications explicit.

The [scene guide](docs/creating-a-scene.md) documents the exact integration files and checks. It is currently maintained in Chinese; source identifiers and generated draft headings are bilingual. The repository includes a Codex skill at `.agents/skills/vistep-scene/SKILL.md`. Ordinary contributors can follow the same workflow without an AI tool.

Astro builds static pages; React loads each experiment on demand. SVG, Canvas and Three.js render model state. Workers handle JPEG calculations and the small teaching Transformer. Static audio tracks drive the shared playback clock. See [architecture](docs/architecture.md), [the retrospective](docs/retrospective.md), [deployment](docs/deployment.md) and [Search Console setup](docs/search-console.md).

Automated checks establish numerical and publishing contracts. They do not certify visual quality, natural speech or real-device performance. Reviews must record the actual frames, playback observations and remaining limits.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md), the [Code of Conduct](CODE_OF_CONDUCT.md) and the private [security reporting policy](SECURITY.md). Contributions can improve scientific accuracy, rendering, accessibility, translation or topic coverage.

Original code and documentation are available under the [MIT License](LICENSE). Fonts, libraries and generated-audio provenance are documented in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Preserve applicable third-party notices; the license does not grant permission to impersonate the official site.
