# 部署与回滚

[English](../deployment.md) · [中文文档](README.md)

正式站使用既有 Cloudflare Worker **`vistep`**，绑定 `vistep.ai` 与 `www.vistep.ai`。预览使用 **`vistep-preview`**，不绑定正式域名。保留现有域名绑定和 Search Console 验证 TXT。

## GitHub 自动发布

原仓库 `int64ago/vistep` 推送或合并到 `main` 后运行 [CI and deploy](https://github.com/int64ago/vistep/actions/workflows/ci.yml)。`codex/**` 分支与 PR 只运行检查。Actions 的 **Run workflow** 选择 `main` 也能重新检查并发布当前代码。

1. 拉取 Git LFS 配音文件，安装锁定依赖，运行 `pnpm verify`，再用 `pnpm build:preview` 单独构建并审计预览。LFS 对象按对象 ID 缓存；配音文件缺失仍会导致检查失败。
2. 保存检查通过的生产 `dist/`，发布任务下载同一次运行的这份产物，不重新构建，也不使用 `dist-preview/`。
3. `deploy` 进入 GitHub `production` 环境。工作流和发布脚本都将发布限制在原仓库的 `main`；环境分支规则也应配置为相同范围。发布前再次查询 main，过时的运行直接跳过。
4. 保存旧版本后部署既有 Worker `vistep`，版本标记带提交 SHA，发布消息链接到 Actions 运行记录。
5. `scripts/audit-live.mjs` 检查线上 HTML 的标题、canonical / alternate 链接和构建资源引用；对非 HTML 资产逐文件比较 SHA-256；检查生产索引响应头、robots.txt 的 sitemap 声明和未知路径 404。Cloudflare 可能注入交付或统计脚本，因此 HTML 不逐字节比较。短暂 HTTP 失败重试两次。

运行摘要展示前后版本和回滚命令。生产构建 artifact 保留 7 天，发布记录保留 90 天；Cloudflare 另有部署历史。上线审计失败不会自动回滚，先区分“上传失败”和“已经发布但线上检查失败”。

main 正在进行的发布不会被新推送中断，待运行队列只保留最近一次推送；快速连续 push 可能合并为最新一次发布。视觉、配音与完整演示应在合并前审看；CI 不能判断这些质量。

## 凭据

GitHub **Settings → Environments → production** 的必要配置如下；环境规则与 token 权限保存在仓库之外。

| 设置                   | 值                           |
| ---------------------- | ---------------------------- |
| Secret                 | `CLOUDFLARE_API_TOKEN`       |
| Variable               | `CLOUDFLARE_ACCOUNT_ID`      |
| Deployment branch rule | 仅 branch `main`，不允许 tag |

生产 token 需要指定账户的 **Workers Scripts: Edit**，以及仅 `vistep.ai` 站点的 **Workers Routes: Edit** 和 **Zone: Read**。Workers 权限按账户范围授予，不能声称只可操作单个 Worker。该 token 不应含 DNS 修改、计费或语音权限。不把本地 Wrangler OAuth、Google 或配音凭据放进 CI。

轮换时创建同范围的新 token，替换 environment secret，运行 main 发布确认有效，再撤销旧 token。维护期间可在 Actions 禁用 **CI and deploy**，完成后重新启用；暂停期间该工作流的检查也暂停。

## 预览与应急发布

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm deploy:preview
```

在[预览站](https://vistep-preview.int64ago.workers.dev/)审看后，合并到 main 让 Actions 发布。Actions 已发布时不再手动重复部署。

应急本地 `pnpm deploy` 前，先暂停自动工作流并取消排队和正在运行的发布，避免并发覆盖。先执行 `pnpm verify` 并完成审看：`pnpm deploy` 本身只执行构建和部署。需要有效的本地 Wrangler 登录或环境凭据；GitHub environment secret 不能读回本地。

生产资产在 `dist/`；预览资产在 `dist-preview/`。预览发送 `X-Robots-Tag: noindex, nofollow`，允许爬虫读取该头，robots.txt 不宣传 sitemap；但 sitemap 文件和 HTML 的 sitemap 链接仍存在，不应向 Google 提交预览主机。两个构建都保留生产 canonical。Static Assets 强制 HTML 尾斜杠并返回真实 404，没有自定义 Worker 运行时脚本。两个环境目前都启用 `workers.dev` 地址，只有正式 Worker 配置两个自定义域名路由。

## 访问统计与搜索

2026-09-06 核查确认，`vistep.ai` 已启用 Cloudflare Web Analytics。Cloudflare 在正式响应 HTML 中注入 `static.cloudflareinsights.com/beacon.min.js`，`src/layouts/Base.astro` 没有对应脚本。配置保存在 Cloudflare，不能仅凭仓库源码没有脚本判断未接入统计，也不要在布局中再加一份 beacon。

有权限的维护者可打开[访问次数](https://dash.cloudflare.com/221bc02d2824802216740354699556c8/vistep.ai/analytics/web/overview/visits)或[页面浏览](https://dash.cloudflare.com/221bc02d2824802216740354699556c8/vistep.ai/analytics/web/overview/page-views)，按时间、国家、路径、来源、设备和浏览器查看汇总。导出报告时记录时间范围和筛选条件，不在本手册维护实时计数。

- **Visits** 统计外部来源或直接链接进入页面的次数。一次访问可以包含多次页面浏览，不等于去重人数。
- **Web Analytics** 通过 beacon 记录浏览器活动。广告拦截、禁用 JavaScript 或上报失败会造成漏记。可查看此前 6 个月已采集的数据；超过 7 天的数据会聚合，查询可能采样。现在开启无法补出此前从未发送的浏览器记录。
- **HTTP 流量** 统计抵达 Cloudflare 的请求，包含资源与自动化流量。**Workers 指标** 统计 Worker 调用；静态资产可不执行 Worker 直接返回。这两类请求总量都不能代替访问次数或页面浏览量。
- **Search Console** 记录 Google 搜索表现与索引情况，不记录全站所有访问。域名属性通过 DNS 验证，无需前端跟踪脚本。操作见 [Search Console](search-console.md)。

构建和上线审计检查交付与索引契约，不验证 beacon 是否成功入库或面板计数。统计为空时，分别检查所选站点、时间范围、生产脚本、浏览器上报请求和面板。依据 Cloudflare 的[指标定义](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/)、[筛选维度](https://developers.cloudflare.com/web-analytics/data-metrics/dimensions/)、[采集与限制](https://developers.cloudflare.com/web-analytics/faq/)和[Workers 指标](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/)。

## 回滚

在相关 Actions 摘要中找到 **Before**，禁用工作流并取消排队和正在运行的发布，再执行记录中的回滚命令：

```sh
pnpm exec wrangler rollback VERSION_ID --name vistep
```

对照目标版本构建检查线上结果。修复或 revert main 中的问题后再恢复自动发布，否则下一次推送会再次发布缺陷。使用 `pnpm exec wrangler deployments list --name vistep` 查阅部署历史。

以下是历史恢复点，并非当前版本：

| 版本                                   | 含义                       |
| -------------------------------------- | -------------------------- |
| `d31022c8-a4ad-446c-898e-19a7298503e1` | 完整专题站发布前的原品牌站 |
| `740c58e2-4c63-488c-b1a5-c7546f89a836` | 2026-09-05 首次完整正式站  |

回滚恢复代码和资产，不改变域名绑定。如果恢复原品牌站，也应恢复有效的 sitemap 响应，不删除域名验证 TXT。当前版本以 [Actions](https://github.com/int64ago/vistep/actions/workflows/ci.yml)和 [production 环境](https://github.com/int64ago/vistep/deployments/activity_log?environments_filter=production)为准。

历史预览记录中的“未发布正式站”只描述对应日期的构建，不代表今天的生产状态。参见[自动演示检查](qa-automatic-demos.md)、[双语配音检查](qa-bilingual-narration.md)和[首次正式发布检查](qa-production.md)。

## 自行部署 Fork

Fork 不继承凭据，工作流也将生产发布限制在原仓库。自行部署时修改 Astro、`src/data/seo.ts`、审计脚本和 robots.txt 中的正式 origin，以及 Wrangler 的 Worker 与域名；调整 CI 和 `scripts/ci-deploy.mjs` 的仓库、分支、Worker 和网址限制。先在独立预览中验证，不占用原项目域名或复用其凭据。

依据：[Cloudflare GitHub Actions 部署](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)、[GitHub 部署控制](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments)。
