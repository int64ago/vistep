# Showcase artwork and narration defaults

[简体中文](zh-CN/qa-showcase-audio.md) · [Review index](README.md)

Reviewed 2026-09-05, following `57da38e`. Preview Worker: `6ba3209d-86fa-479f-9d14-3161da1b4af6`. This covers the README artwork, shared narration policy and skill review, not all twelve films again.

## Original artwork

Both READMEs use a new SVG-rendered composition of meshing gears, DCT image reconstruction and a projected four-dimensional cube, importing the site's actual models. The old screenshots were removed.

The final GIF is 900 × 500, 225 frames, 15 seconds and 4,251,743 bytes, looping continuously. A 128-color palette is followed by lossless Gifsicle optimization; a grain-producing lossy pass was rejected. Manrope and the arrow fallback load from the repository with system fonts disabled. A 1080 × 600 PNG provides a still alternative.

Source and encoded samples near 1, 7.5, 12.5 and 14.93 seconds were inspected for text, framing and object boundaries. Browser snapshots confirmed animated playback. Teeth and bolt symmetry return the closing mechanical pose to the opening. Full GIF decoding completed without errors.

[render-showcase.mjs](../scripts/render-showcase.mjs) retains the reproducible source. It uses project Node dependencies, FFmpeg 7.1 and Gifsicle 1.93. `VISTEP_FFMPEG` and `VISTEP_GIFSICLE` select local executables; the existing voice environment provides an FFmpeg fallback. `--frame <seconds>` exports a still; `--keep-frames` retains intermediate frames. Ordinary builds do not run these production tools.

## Narration behavior

Chrome and in-app browser observations covered English and Chinese pendulum pages, including a 390 px viewport:

- A fresh origin attempted narration. Autoplay rejection left the silent film running with a clear sound control; clicking it started speech at the current visual position.
- Language navigation after user activation loaded and automatically played the Chinese recording.
- Manual mute persisted through language navigation and refresh; muted loads created no audio element.
- Moving the film fully outside the viewport paused its recording. A partially visible film correctly remained eligible for playback.
- The narrow page had no horizontal overflow and its sound control remained usable.

Four preference tests cover first visits, unavailable storage, manual mute precedence, legacy session choices and persistence fallback. Autoplay rejection does not save a manual mute. Initial visibility now waits for the intersection observer before playback.

Recordings were not regenerated. This is not a new listening review, physical-phone performance measurement or Safari autoplay result. The separate noise-experiment tone remains opt-in.

## Skill and checks

Reviewed the entrypoint, interface metadata, production guide, project instructions and retrospective. The new [coverage map](../.agents/skills/vistep-scene/references/coverage.md) connects scene direction, models, bilingual voices, language/SEO, Search Console, branding, promotional artwork, lifecycle, accessibility, review and delivery. The installed personal skill points to this repository copy.

The skill validator passed. `pnpm verify` passed with 49 tests in nine files and no type-check errors. `pnpm build:preview` passed its separate noindex artifact audit; the preview response returned `X-Robots-Tag: noindex, nofollow`. Main publishing uses the existing checked-artifact Actions workflow, whose run and deployment record provide release evidence.
