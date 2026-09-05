# 安全政策

[English](../../SECURITY.md) · [中文文档](README.md)

当前维护 `main` 及其部署版本，不同时维护多个发行线，也不保证响应时间。

## 私下报告

发送至 **int64ago@gmail.com**，主题为 `vistep security report`。包含受影响地址或提交、影响和最小复现，不附有效凭据或其他人的个人信息。不要通过公开 Issue 披露未修复漏洞。维护者会调查并协调修复和披露；泄露凭据应向提供方撤销，仅删除提交不足以处理。

## 项目边界

站点为静态资产，实验在浏览器计算，无访客账号、服务器用户数据或访客 API 密钥。Cloudflare 凭据只用于部署与可选独立语音审计。Google 凭据仅用于本地维护。CI 验证无需部署和语音秘密，不使用可写 token 执行 PR 代码。

只有原仓库 main 的 production 任务取得该环境的 Cloudflare token；环境仅允许 main。权限是指定账户的 Workers Scripts Edit，以及 vistep.ai 区域的 Workers Routes Edit、Zone Read，不含 DNS 编辑、计费或语音。Workers 权限按账户范围授予，不能声称仅控制单个 Worker。轮换时创建同范围 token、替换环境 secret、验证后撤销旧 token，不把 Wrangler OAuth 放入 CI。

科学纠错、排版和普通缺陷使用 Issue 模板，社区问题按[行为准则](code-of-conduct.md)处理。
