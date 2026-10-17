# Browser review

[简体中文](zh-CN/browser-review.md) · [Production guide](creating-a-scene.md)

The versioned runner records paused chapter samples and browser failure behavior. It does not certify complete playback, human visual review, listening, phone performance or the minimum supported browser versions. `pnpm verify` remains the separate static/model/build suite.

Build once with `pnpm build:preview`. Install the pinned test browser with `pnpm exec playwright install chromium`, then run `pnpm browser:review`. The runner serves `dist-preview/` on a private local port with MP3 byte-range support and noindex headers. To inspect an existing preview, pass `--base-url http://127.0.0.1:4325`.

The default samples home, printer, network, pendulum, excavator, radar, database index and cell handover in both languages at 320, 390 and 1440 CSS pixels. Three relevant chapter boundaries per film are paused and captured. Examples:

```sh
pnpm browser:review --slugs printer,radar-ranging --locale en --widths 320,390 --no-faults
pnpm browser:review --all
pnpm browser:review --all --all-chapters --no-faults
pnpm browser:review --faults-only
```

`--all` includes every registered timeline, using three chapter samples. `--all-chapters` expands that selection to every chapter. It can generate many screenshots and take substantially longer. `--browser firefox` or `--browser webkit` selects an installed engine; CI runs only its pinned Chromium. Current-engine checks do not establish historical-version compatibility. For the trusted local preview, Chromium explicitly uses [SwiftShader software WebGL](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/gpu/swiftshader.md); the report records this renderer condition. That is not physical-GPU performance evidence. External preview URLs use the browser defaults.

Results are in `artifacts/browser-review/latest/report.json` and viewport PNGs. `--out-dir` selects another directory. The report records the Git commit, the hash of current tracked and non-ignored untracked files, the Git diff hash, browser/version, viewport, scene/chapter/time, DOM bounds, SVG font sizes with an exact-matrix or explicitly marked viewBox-estimate method, HTML label font sizes, transport targets, console errors and screenshots. Generated outputs and review artifacts are outside the hash domain. Each case uses `passed`, `failed` or `not-run`. A passing smoke means its automated assertions passed; visual observations such as small labels or a tall player remain recorded for review.

Horizontal overflow, runtime error states, invalid SVG paths, wrong seek state and unexpected console errors fail normal smoke cases. Small SVG labels and small controls are reported separately with their measured text/bounds, because a DOM measurement cannot decide which labels are pedagogically essential or establish correct 3D framing. Review those observations and the actual screenshots before acceptance.

CI also withholds audio until the application timeout, checks silent progress and the saved sound choice, then allows a user retry to recover. Missing WebGL must expose the printer's existing 2D fallback while leaving a pure SVG lesson usable. Worker creation failure must expose the Transformer's readable error state; that error is not a complete interactive Transformer lesson. These injected conditions are recorded separately from ordinary rendering.

The CI job initializes a `not-run` report before verification, executes the browser runner after the preview build and always attempts to upload `browser-review-<commit>-<attempt>`. A failed run blocks production publication. If setup never reached browser execution, the initialized report remains `not-run`; the CI logs explain why. The tool never publishes or changes production assets.

## Use the same checks through CUA

`scripts/browser-review.mjs` contains no filesystem, subprocess or browser-launch code. Its `readBrowserState` callback reads DOM-backed state only. `inspectBrowserCase` and `runBrowserReview` accept an existing tab plus adapters:

- `tab.goto(url)`, `tab.playwright.evaluate(function)`, `tab.playwright.locator(selector)` and `tab.getScreenshot({emit:false})`.
- `setViewport({width,height})`: use the browser viewport capability's `set` method.
- `pause(ms)`: the CLI uses a short asynchronous delay; CUA may pass `async () => {}` because its observation API already waits.
- `browserInfo`: optional version/engine metadata collected by the adapter, without reading non-DOM globals inside CUA evaluate.
- `observe()`: refresh the accessibility state with `tab.getAXState({emit:false})` after actions.
- `getLogs()`: return this case's new warning/error logs from `tab.dev.logs`; filter or drain earlier cases so old errors are not attributed to a new scene.
- `saveScreenshot(name, bytes)`: save the returned PNG bytes in the chosen evidence directory.

Create a plan with `createReviewPlan({films, slugs, locales, viewports})`. For bounded tool turns, call `inspectBrowserCase` for one sample at a time; the CLI calls the same function through its Playwright adapter. It uses native hash navigation for seeks and scrolling and locators for controls. It never mutates DOM, playback state or storage inside CUA `evaluate`. Fault injection is deliberately confined to the CI Playwright adapter, where browser initialization and network interception are available.

Before capturing CUA evidence, retain source metadata from `sourceFingerprint()` in `scripts/browser-review-node.mjs` or `pnpm browser:review --prepare-only --out-dir <evidence-directory>`. Record the actual CUA browser version if available, otherwise mark it unknown. Keep CUA observations separate from CI runs and from complete watching or listening.

The implementation uses the official [Playwright page API](https://playwright.dev/docs/api/class-page). Browser installation follows the exact version pinned in the package lockfile.
