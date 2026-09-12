<div align="center">

# vistep.ai

**Visualize Every Step with AI**

Watch how things work. Then experiment with the model.

[Explore](https://vistep.ai/en/) · [Documentation](docs/README.md) · [Contribute](CONTRIBUTING.md) · [简体中文](README.zh-CN.md)

[![CI](https://github.com/int64ago/vistep/actions/workflows/ci.yml/badge.svg)](https://github.com/int64ago/vistep/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-83956f)](LICENSE)
[![Astro](https://img.shields.io/badge/Astro-7-5a6354?logo=astro&logoColor=white)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-50758b?logo=typescript&logoColor=white)](tsconfig.json)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-b88953?logo=cloudflare&logoColor=white)](docs/deployment.md)
[![Languages](https://img.shields.io/badge/languages-English%20%2B%20中文-827393)](docs/localization-and-seo.md)

[![Animated scenes from vistep.ai](docs/media/vistep-showcase.gif)](https://vistep.ai/en/)

[Still image](docs/media/vistep-showcase-poster.png)

</div>

vistep.ai explains everyday mechanisms, science and computation through short visual stories. Follow a moving part, a signal or a calculation, then change the inputs to see what happens.

- **Watch, pause, explore.** Chaptered films with replay, seeking and optional experiments.
- **Models drive the picture.** Independent calculations connect geometry, motion and readouts; articles explain assumptions and cite sources.
- **Find your next question.** Search in either language; narrow by interest, running time and suggested starting age.
- **English and Chinese.** Authored narration, captions and transcripts. Experiments run in your browser without an account, API key or live AI service.

**Release:** the collection now contains **71 scenes**. Production publishes from `main` through [GitHub Actions](https://github.com/int64ago/vistep/actions/workflows/ci.yml?query=branch%3Amain). The [collection expansion record](docs/expansion-50.md) and [scene review records](docs/README.md#review-records) distinguish delivery from the remaining coverage of complete viewing, native listening and physical-phone testing.

## Start exploring

| Mechanisms                                                  | Information                                                        | Systems                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| [Bicycle gearing](https://vistep.ai/en/explore/bicycle/)    | [JPEG compression](https://vistep.ai/en/explore/jpeg/)             | [Dimensions](https://vistep.ai/en/explore/dimensions/)        |
| [Refrigeration](https://vistep.ai/en/explore/refrigerator/) | [Training & generation](https://vistep.ai/en/explore/transformer/) | [Pendulums](https://vistep.ai/en/explore/pendulum/)           |
| [Laser printing](https://vistep.ai/en/explore/printer/)     | [Web loading](https://vistep.ai/en/explore/network/)               | [Elevator scheduling](https://vistep.ai/en/explore/elevator/) |

[Complete source catalog](docs/catalog.md)

## Run locally

Use [Node.js 24](.nvmrc) and pnpm 11.25.0. The configured browser baseline is Chrome 108, Edge 108, Firefox 121 and Safari 15.4; a [feature check](docs/architecture.md#browser-support) shows a notice instead of loading experiments when required capabilities are unavailable. Narration recordings are stored in [Git LFS](https://git-lfs.com/), so install it before cloning.

```sh
git lfs install
git clone https://github.com/int64ago/vistep.git
cd vistep
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:4321](http://127.0.0.1:4321/). Recorded audio is included; local development needs no Cloudflare credentials or speech service.

| Command              | Purpose                                                                            |
| -------------------- | ---------------------------------------------------------------------------------- |
| `pnpm verify`        | Formatting, documentation links, types, tests, production build and artifact audit |
| `pnpm build:preview` | Separate preview build with noindex checks                                         |
| `pnpm preview`       | Serve the production build locally                                                 |
| `pnpm scene:check`   | Scene, bilingual content and audio contracts                                       |

Astro prerenders the articles; React experiments use TypeScript models with SVG, Canvas or Three.js. Animation and recorded narration share a chapter clock. See [architecture](docs/architecture.md), [localization](docs/localization-and-seo.md) and [deployment](docs/deployment.md).

## Contribute

Scientific corrections, new scenes, translations and accessibility improvements are welcome. Follow the [production guide](docs/creating-a-scene.md), or give the [vistep-scene skill](.agents/skills/vistep-scene/SKILL.md) a brief such as “Explain why an induction motor turns.” [Review records](docs/README.md#review-records) separate automated checks, browser observations and listening evidence.

[Contribution guide](CONTRIBUTING.md) · [Code of Conduct](CODE_OF_CONDUCT.md) · [Report a vulnerability privately](SECURITY.md)

Original code and documentation are [MIT licensed](LICENSE). See [third-party notices](THIRD_PARTY_NOTICES.md) for fonts, dependencies and audio provenance.
