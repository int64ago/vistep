# 部署与回滚

## 正式站与发布记录

2026-09-05，完整站点首次发布至 [vistep.ai](https://vistep.ai/) 与 [www.vistep.ai](https://www.vistep.ai/)。首次完整站版本为 `740c58e2-4c63-488c-b1a5-c7546f89a836`，代码基于 `259d443`。后续版本以 [Actions 发布记录](https://github.com/int64ago/vistep/actions/workflows/ci.yml) 和 [production 环境](https://github.com/int64ago/vistep/deployments/activity_log?environments_filter=production) 为准。下方预览记录中的“未发布正式站”描述的是当时状态。

发布检查见 [首次正式发布记录](qa-production.md)。如需恢复发布前的原品牌站，仍使用下方记录的旧版本；不需要修改 DNS 或删除 Search Console 验证 TXT。

## 保留的现有配置

正式服务：`vistep`。自定义域名 `vistep.ai`、`www.vistep.ai` 均绑定该服务。不要删除或重新创建 DNS 记录。生产和预览分别使用不同 Worker，预览不绑定正式域名。

本次制作前的生产版本：`d31022c8-a4ad-446c-898e-19a7298503e1`（2026-08-13）。原网站 HTML 存于 `docs/reference/original-brand.html`，包含原始命名动画。敏感凭据不应保存到仓库。

## GitHub 自动发布

原仓库 `int64ago/vistep` 推送或合并到 `main` 后自动发布。其他受支持分支（`codex/**`）与所有 PR 只运行检查，不取得生产凭据。Actions 的 **Run workflow** 选择 `main` 也能重新检查并发布当前代码。

1. `verify` 安装锁定依赖，执行格式、文档链接、类型、模型和内容测试、生产构建、产物审计，以及独立预览构建检查。
2. 检查通过后保存生产 `dist/`，发布任务下载同一次运行的这份产物，不重新构建，也不使用 `dist-preview/`。
3. `deploy` 在 GitHub `production` 环境运行；该环境只允许 `main` 分支。发布前再次查询 main，过时的运行直接跳过。
4. 保存旧版本后部署既有 Worker `vistep`，版本标记带提交 SHA，发布消息链接到 Actions 运行记录。
5. 对正式站执行 HTTP 审计：中英文页面元数据与资源引用、静态资源逐文件 SHA-256、sitemap、robots、noindex 和未知路径 404。短暂网络或传播失败重试两次；仍失败则运行标红。

运行摘要展示发布状态、提交、前后版本和回滚命令。生产构建 artifact 保留 7 天，`deployment-…` 记录保留 90 天；Cloudflare 部署记录另行保留。上线审计失败不会自动回滚，先查看记录区分“上传失败”和“已经发布但线上检查失败”。

main 正在进行的运行不会被新推送中断，待运行队列只保留最近一次推送；因此快速连续 push 可能合并为最新一次发布。已过时的手动重跑也不能覆盖新版本。视觉、配音与完整演示仍应在合并前审看；CI 不能判断场景是否精致。

### 凭据与维护

GitHub → Settings → Environments → `production`：

- Environment secret：`CLOUDFLARE_API_TOKEN`。
- Environment variable：`CLOUDFLARE_ACCOUNT_ID`。
- Deployment branches and tags：仅允许 branch `main`，不允许 tag，不要求人工批准。

Cloudflare 专用 token 名称为 `vistep GitHub production deploy`。所需权限是指定账户的 **Workers Scripts: Edit**，以及仅 `vistep.ai` 站点的 **Workers Routes: Edit** 和 **Zone: Read**。它没有 DNS 修改、计费或语音权限；Workers 权限目前按账户范围授予，不能声称只可操作单个 Worker。账户 ID 是配置，token 是秘密；不把短期 Wrangler OAuth、Google 或配音凭据放进发布流程。

轮换时在 Cloudflare 创建同范围的新 token，替换 environment secret，运行 main 发布确认有效，再撤销旧 token。维护期间可在 Actions 的 **CI and deploy** 工作流菜单中 Disable workflow，完成后 Enable workflow；暂停期间该工作流的检查也暂停。

这是 Cloudflare 官方支持的 [GitHub Actions 部署方式](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)，这里使用项目锁定版本的 Wrangler。权限与并发行为见 [GitHub 部署控制文档](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments)。

## 预览与手动发布

1. `pnpm install --frozen-lockfile`
2. `pnpm verify`（格式、类型、模型与发布契约、构建、产物审计）
3. `pnpm deploy:preview`
4. 在预览检查最终视觉、核心交互和中英文实播，随后推送或合并 main，让 Actions 发布。
5. 查看 Actions 结果。sitemap 每次构建自动更新，无需每次向 Google 重复提交；索引状态按 [Search Console 手册](search-console.md) 查看。

应急本地发布仍可用 `pnpm deploy`，但先暂停自动工作流并取消排队的发布，避免手动版本与自动发布相互覆盖。需要有效的 Wrangler 本地登录或环境变量；CI 的 environment secret 不能从 GitHub 读回本地。

`wrangler.jsonc` 显式记录两个生产 custom domain；预览环境的 `routes` 为空。生产资产从 `dist/` 发布；`pnpm build:preview` 单独构建 `dist-preview/`，所有预览路径通过响应头设置 `noindex, nofollow`，预览允许爬虫读取该指令。两个目录不能混用。静态资产由 Workers Static Assets 托管，没有自定义运行时后端。HTML 强制尾斜杠，未知路径返回构建的 404 页。

## 回滚

优先在 Actions 运行摘要找到 **Before** 和回滚命令。先暂停工作流、取消排队及仍在运行的发布，再回滚。回滚后对照目标版本的构建运行线上检查；修复或 revert main 中的问题后再恢复工作流，否则下一次 main 推送会再次发布问题代码。

回到上面记录的原站版本：

```sh
pnpm exec wrangler rollback d31022c8-a4ad-446c-898e-19a7298503e1 --name vistep
```

后续版本用对应的 ID 替换。可用 `pnpm exec wrangler deployments list --name vistep` 查阅部署记录。回滚恢复目标版本的代码和资产，不需要改动域名绑定。

## 本次预览

2026-09-05 自动演示与机械细节改版：`vistep-preview` 版本 `e856b90b-558a-461a-8541-9312d068da06`。预览地址：<https://vistep-preview.int64ago.workers.dev/>。本次未发布正式 Worker。检查范围与结果见 [自动演示检查记录](qa-automatic-demos.md)。

2026-09-05 中英文与同步语音：`vistep-preview` 版本 `6b038697-c5c2-4bf3-b294-e37b89ad012f`。包含 26 个中英文内容页面、双语 404、24 条静态配音与字幕稳定排版。此版本取代上面的自动演示预览，仍未发布正式 Worker。详情见 [双语与讲解检查记录](qa-bilingual-narration.md)。回滚预览可执行：

```sh
pnpm exec wrangler rollback e856b90b-558a-461a-8541-9312d068da06 --name vistep-preview
```

## 其他维护者自行部署

Fork 不会继承 Cloudflare 登录或 environment secret，工作流也通过原仓库名称限制自动发布。部署到自己的账户时，修改 `astro.config.mjs` 的 site、两个 audit 脚本的 origin、`public/robots.txt` 的 sitemap 和 `wrangler.jsonc` 的服务名、域名配置，再生成产物。先用独立预览 Worker 验证。如需自动部署，同时调整工作流与 `scripts/ci-deploy.mjs` 中的仓库、main、Worker 和网址限制，并在自己的 production 环境配置权限。不要使用原仓库的生产配置去占用并不属于自己的域名。Google 和配音凭据始终不进入 CI。

2026-09-05 搜索与维护配套：`vistep-preview` 版本 `06c011e9-7589-49f0-b924-0145b601209b`，生产仍未更新。新增独立预览产物与 noindex 响应头。回退本次预览可用：

```sh
pnpm exec wrangler rollback 6b038697-c5c2-4bf3-b294-e37b89ad012f --name vistep-preview
```
