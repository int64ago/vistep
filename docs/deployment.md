# 部署与回滚

## 保留的现有配置

正式服务：`vistep`。自定义域名 `vistep.ai`、`www.vistep.ai` 均绑定该服务。不要删除或重新创建 DNS 记录。生产和预览分别使用不同 Worker，预览不绑定正式域名。

本次制作前的生产版本：`d31022c8-a4ad-446c-898e-19a7298503e1`（2026-08-13）。原网站 HTML 存于 `docs/reference/original-brand.html`，包含原始命名动画。敏感凭据不应保存到仓库。

## 发布

1. `pnpm install --frozen-lockfile`
2. `pnpm check`，需要调整模型时执行 `pnpm test`
3. `pnpm deploy:preview`
4. 在预览检查最终视觉与核心交互后，执行 `pnpm deploy`
5. 检查正式域名、深链接与不存在路径的 404 行为，并记录 Wrangler 输出的版本 ID。

`wrangler.jsonc` 显式记录两个生产 custom domain；预览环境的 `routes` 为空。静态资产由 Workers Static Assets 托管，没有自定义运行时后端。HTML 强制尾斜杠，未知路径返回构建的 404 页。

## 回滚

部署前保存当前生产版本 ID。回到上面记录的原站版本：

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
