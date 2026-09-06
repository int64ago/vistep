# 贡献指南

[English](../../CONTRIBUTING.md) · [中文文档](README.md)

欢迎科学纠错、演示、无障碍、翻译与新选题。需要讨论的大改动先开 Issue，小修复可直接提交 PR。

## 开发

先安装 [Git LFS](https://git-lfs.com/)，再 Fork 并克隆仓库（`public/narration/` 的配音 MP3 是 LFS 对象，没装 LFS 只会得到指针文件，构建审计会失败），使用 Node 24 与 pnpm 11.25.0，运行 `pnpm install --frozen-lockfile`、`pnpm dev`。使用聚焦的分支，避免混入无关格式或生成文件。完整场景与共享运行时改动执行 `pnpm verify` 和 `pnpm build:preview`；纯文字改动只对相关文件运行 Prettier 并执行 `pnpm audit:docs`。文档审计只检查本地文件链接，改过的标题锚点和外部资料需另行核对。CI 仍验证全仓库。

`package.json` 的 private 防止误发布 npm，不限制 MIT 许可。普通构建无需凭据，不提交环境文件、token、Cloudflare 状态、语音缓存或本地配置。

## 场景贡献

遵循[制作手册](creating-a-scene.md)与[复盘](retrospective.md)。Codex 用户直接描述选题给 `$vistep-scene`，草稿命令只是内部辅助工具。

一次新增多个场景时，agent 必须主动使用 subagent，优先为各场景分配独立负责人。派发时明确目标、适用技能、负责文件和验收要求；主 agent 协调共享文件、集成并逐篇审看，不能把子任务完成声明当作验收证据。遵循 [AGENTS.md](../../AGENTS.md) 及制作手册的交接流程。

每篇有适合原理的独立表达。先完成 2–5 分钟静音主线，每章增加真正可见的观察或对照，再增加控件。图形与数字来自同一模型，简化与技术来源明确。双语正文和声音完整，旁白引导观察而不照读文本。

PR 写明问题、最终行为与实际验证，附桌面/手机关键帧、可用预览、两种语言的播放观察及模型检查。未检查的条件明确列出。构建通过不代表视觉或声音质量达标。

## 测试与资产

使用独立数值预期、守恒、有限差分与可复现输入，避免只重复实现常量的测试。CI 不调用外部语音。口语稿或声音变更、录音需要修复时只重生成受影响的语音，纯字幕改动不重录。讲解源文件、实测时间轴、声音清单与录音一起提交，并删除不再引用的旧音轨；生成器负责选中专题的元数据与旧音轨更新，转录报告只作为本地审看证据。

新增外部素材记录作者、来源与实际许可，加入[第三方说明](third-party-notices.md)。不无授权复制图、模型、代码或声音。贡献适用项目 MIT，兼容第三方材料保留各自许可，无需 CLA。

## Agent 提交署名

agent 创建或重写的每个提交（包括 amend、squash、合并提交），说明末尾都须带准确的 `Co-Authored-By: 名称 <邮箱>` trailer，与正文空一行。使用实际参与的 agent／模型及对应邮箱，不猜型号、不只写 `GPT`，不照抄无关历史署名。GPT-6 Astra 使用 `Co-Authored-By: GPT-6 Astra <noreply@openai.com>`；Claude 使用实际 Claude 型号及 `<noreply@anthropic.com>`。多个实际贡献者分别列出，保留原作者与已有的正确署名；提交后检查最终说明，确认没有缺漏或重复。当前契约见 [AGENTS.md](../../AGENTS.md)。

## 审核与发布

分别审看科学、视觉和实现。main 检查通过自动部署，合并前完成相应审看；分支和 PR 不取得生产凭据。预览与正式资产分开，见[部署](deployment.md)。

遵守[行为准则](code-of-conduct.md)，漏洞通过[安全政策](security.md)私下报告。
