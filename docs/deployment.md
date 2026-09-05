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
