# 浏览器巡检

[English](../browser-review.md) · [制作手册](creating-a-scene.md)

版本化工具记录暂停的章节关键帧和浏览器故障行为。它不等于完整观看、人工视觉验收、完整试听、真机性能或最低浏览器版本验收。`pnpm verify` 仍是独立的静态、模型与构建检查。

先执行 `pnpm build:preview`，用 `pnpm exec playwright install chromium` 安装锁定版本的测试浏览器，再执行 `pnpm browser:review`。工具在本机私有端口提供 `dist-preview/`，支持 MP3 字节范围请求并附 noindex。检查已有预览可传 `--base-url http://127.0.0.1:4325`。

默认覆盖首页、打印机、网页加载、钟摆、挖掘机、脉冲雷达、数据库索引和蜂窝切换，分别检查中英文及 320、390、1440 CSS 像素宽度；每篇抽取三个相关章节边界并暂停截图。

```sh
pnpm browser:review --slugs printer,radar-ranging --locale en --widths 320,390 --no-faults
pnpm browser:review --all
pnpm browser:review --all --all-chapters --no-faults
pnpm browser:review --faults-only
```

`--all` 覆盖全部时间线，每篇仍抽三个章节；`--all-chapters` 展开到所选专题的全部章节，会产生较多截图并花费更多时间。`--browser firefox` 或 `--browser webkit` 可选择已安装的浏览器；CI 只运行锁定版本的 Chromium。当前版本通过不能推导历史最低版本也通过。本机受信预览的 Chromium 显式使用 [SwiftShader 软件 WebGL](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/gpu/swiftshader.md)，报告记录该渲染条件，不能视为真机 GPU 性能证据；外部预览网址使用浏览器默认设置。

默认结果在 `artifacts/browser-review/latest/report.json` 及同目录的视口 PNG，可用 `--out-dir` 改路径。记录包含 Git 提交、当前已跟踪和未忽略新文件的内容树哈希、Git diff 哈希、浏览器及版本、视口、专题/章节/时间、DOM 边界、标明精确矩阵或 viewBox 估算方法的 SVG 字号、HTML 标签字号、播放控件尺寸、控制台与截图。构建输出及审查产物不进入源码哈希。每项标记 `passed`、`failed` 或 `not-run`；自动巡检通过后，仍需审看所列小字、长播放器等观察项及实际截图。

普通巡检把横向溢出、运行错误、非法 SVG 路径、错误 seek 状态及意外控制台错误视为失败。小于 16px 的 SVG 文字和小于 44px 的播放控件单独记录文字与边界，交由审看确认；DOM 测量不能判断标签的教学重要性，也不能证明三维部件的实际投影正确。

CI 另将音频请求保持挂起，验证应用等待超时后静音继续、保存的声音选择不变，并验证用户重试可恢复。WebGL 缺失时打印机须显示已有二维视图，纯 SVG 专题仍可用。Worker 创建失败时 Transformer 须显示可读错误；该错误状态不代表完整互动讲解。故障注入与正常画面分开记录。

CI 在静态检查前生成 `not-run` 报告，预览构建后执行巡检，并始终尝试上传 `browser-review-<commit>-<attempt>`。失败阻止正式发布；安装或检查中断、尚未进入浏览器时保留 `not-run`，原因见 CI 日志。工具不会发布或修改正式资产。

## 在 CUA 使用相同检查

`scripts/browser-review.mjs` 不包含文件系统、子进程或浏览器启动代码；`readBrowserState` 只读 DOM 状态。`inspectBrowserCase`、`runBrowserReview` 接收现有 tab 和适配回调：

- `tab.goto(url)`、`tab.playwright.evaluate(function)`、`tab.playwright.locator(selector)`、`tab.getScreenshot({emit:false})`。
- `setViewport({width,height})`：接浏览器 viewport capability 的 `set`。
- `pause(ms)`：CLI 使用短暂异步等待；CUA 的观察接口本身会等待，可传 `async () => {}`。
- `browserInfo`：适配器取得的可选版本/内核信息，不在 CUA evaluate 内读取非 DOM 全局变量。
- `observe()`：动作后调用 `tab.getAXState({emit:false})` 刷新可观察状态。
- `getLogs()`：接 `tab.dev.logs`，只返回本次新增 warning/error，避免把旧场景错误归给新场景。
- `saveScreenshot(name, bytes)`：将 PNG 字节保存到证据目录。

用 `createReviewPlan({films,slugs,locales,viewports})` 生成计划。为控制单次工具执行时长，可逐项调用 `inspectBrowserCase`；CLI 通过 Playwright 适配器调用同一函数。跳转和滚动使用原生 hash 导航，控件操作使用 locator，CUA evaluate 中不改 DOM、播放状态或存储。故障注入只在支持初始化脚本与网络拦截的 CI 适配器进行。

CUA 截图前用 `scripts/browser-review-node.mjs` 的 `sourceFingerprint()`，或 `pnpm browser:review --prepare-only --out-dir <证据目录>` 保存源码身份。记录真实浏览器版本；取不到时写 unknown。将 CUA、CI、完整观看和完整试听的证据分别保存。

实现依据官方 [Playwright page API](https://playwright.dev/docs/api/class-page)，浏览器安装跟随依赖锁文件中的确切版本。
