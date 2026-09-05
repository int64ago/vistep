<div align="center">

[![vistep.ai — original motion artwork](docs/media/vistep-showcase.gif)](https://vistep.ai/en/)

**Visualize Every Step with AI**

Visual explanations of the mechanisms behind everyday life.

[Explore the site](https://vistep.ai/en/) · [Documentation](docs/README.md) · [Contributing](CONTRIBUTING.md) · [简体中文](README.zh-CN.md)

[![CI](https://github.com/int64ago/vistep/actions/workflows/ci.yml/badge.svg)](https://github.com/int64ago/vistep/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-83956f)](LICENSE)
[![Astro](https://img.shields.io/badge/Astro-7-5a6354?logo=astro&logoColor=white)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-50758b?logo=typescript&logoColor=white)](tsconfig.json)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-b88953?logo=cloudflare&logoColor=white)](docs/deployment.md)
[![Languages](https://img.shields.io/badge/languages-English%20%2B%20中文-827393)](docs/localization-and-seo.md)

[Still artwork](docs/media/vistep-showcase-poster.png)

</div>

Watch a mechanism unfold, follow an object through its hidden stages, then experiment with the model yourself. vistep combines directed animation, carefully built 3D mechanisms and browser-based scientific models. Each exploration has its own visual language.

## Featured explorations

[Browse the complete source catalog](docs/catalog.md) · [Current preview and review status](docs/expansion-50.md)

| Everyday mechanisms                                         | Information and computation                                      | Space and systems                                             |
| ----------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| [Bicycle gearing](https://vistep.ai/en/explore/bicycle/)    | [Active noise cancellation](https://vistep.ai/en/explore/noise/) | [Dimensions](https://vistep.ai/en/explore/dimensions/)        |
| [Refrigeration](https://vistep.ai/en/explore/refrigerator/) | [GPS positioning](https://vistep.ai/en/explore/gps/)             | [Pendulums](https://vistep.ai/en/explore/pendulum/)           |
| [Laser printing](https://vistep.ai/en/explore/printer/)     | [Web loading](https://vistep.ai/en/explore/network/)             | [Elevator scheduling](https://vistep.ai/en/explore/elevator/) |

- **Watch first.** Chaptered explanations run for 2–5 minutes, with pause, replay and seeking. Optional controls let you test an idea after seeing it.
- **Follow real calculations.** Geometry, motion and readouts share a model. JPEG transforms and a small Transformer run in Web Workers; physical and system simulations use explicit teaching assumptions.
- **Read or listen.** English and Chinese have separate writing and recorded narration on a shared timeline. Narration is on by default and remembers your choice. If the browser blocks autoplay, one click enables it; captions and transcripts remain available.
- **Keep it local.** Experiments run in your browser. No account, API key or live AI service is required. Language preferences stay in local storage.
- **Adapt to the reader.** Responsive compositions, keyboard controls, reduced-motion support and 2D alternatives for WebGL scenes.

## Development

Use Node.js 24 (see [.nvmrc](.nvmrc)) and pnpm 11.25.0. Cloudflare access is unnecessary for local development.

```sh
git clone https://github.com/int64ago/vistep.git
cd vistep
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:4321](http://127.0.0.1:4321/). Recorded audio is included; installation and builds do not call a speech provider.

| Command              | Purpose                                                                            |
| -------------------- | ---------------------------------------------------------------------------------- |
| `pnpm verify`        | Formatting, documentation links, types, tests, production build and artifact audit |
| `pnpm build:preview` | Separate preview build with noindex headers                                        |
| `pnpm preview`       | Serve the production build locally                                                 |
| `pnpm scene:check`   | Scene registry, bilingual content and audio contracts                              |

## Architecture

Astro prerenders articles, transcripts and search metadata. React loads one experiment at a time. Independent TypeScript models drive SVG, Canvas and Three.js renderers. Recorded audio and animations share the chapter clock; simulations reconstruct state when seeking.

```text
Topic registry + bilingual MDX ──→ Static pages, sitemap, social cards
Storyboard + recorded speech  ──→ Shared playback clock
Scientific model              ──→ Scene-specific SVG / Canvas / Three.js
```

See [architecture](docs/architecture.md), [localization and SEO](docs/localization-and-seo.md), and [deployment](docs/deployment.md). Changes merged into `main` are checked and automatically deployed through GitHub Actions. Preview and production assets remain separate.

## Create an exploration

The [vistep-scene skill](.agents/skills/vistep-scene/SKILL.md) accepts a natural-language brief:

> Use $vistep-scene to explain why an induction motor turns.

It covers research, storyboarding, models, rendering, bilingual narration and review. Contributors can also follow the [production guide](docs/creating-a-scene.md) directly. Reuse the production process and infrastructure; choose the composition and interaction for the phenomenon.

## Contribute

Scientific corrections, new explanations, accessibility improvements and translations are welcome. Read the [contribution guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md). Report vulnerabilities through the private channel in [SECURITY.md](SECURITY.md).

Validation records distinguish automated checks, browser observations and listening reviews. See the [review index](docs/README.md#review-records) for scope and limitations.

## License

Original code and documentation are [MIT licensed](LICENSE). Fonts, dependencies and generated-audio provenance are documented in [Third-party notices](THIRD_PARTY_NOTICES.md).
