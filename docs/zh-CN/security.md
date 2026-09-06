# 安全政策

[English](../../SECURITY.md) · [中文文档](README.md)

当前维护 `main` 及其部署版本，不同时维护多个发行线，也不保证响应时间。

## 私下报告

发送至 **int64ago@gmail.com**，主题为 `vistep security report`。包含受影响地址或提交、影响和最小复现，不附有效凭据或其他人的个人信息。不要通过公开 Issue 披露未修复漏洞。维护者会调查并协调修复和披露；泄露凭据应向提供方撤销，仅删除提交不足以处理。

## 项目边界

站点使用 Cloudflare Workers Static Assets，没有自定义 Worker 运行时脚本，实验在浏览器计算。应用不提供访客账号、用户数据库或访客 API 密钥。语言和讲解偏好保存在浏览器，切换语言时临时播放状态也只在本地传递。

Cloudflare 托管站点并提供汇总的 Web Analytics，在正式响应中注入浏览器 beacon；静态托管不等于没有流量遥测。Cloudflare 说明其 Web Analytics 不收集访客个人数据。请求指标与浏览器统计范围不同，不应将其说成逐个访客的访问档案。参见 [Cloudflare Web Analytics 说明](https://developers.cloudflare.com/web-analytics/about/)与[访问统计维护](deployment.md#访问统计与搜索)。

Cloudflare 凭据用于获授权的部署和账户维护；可选 Cloudflare 转录审计另需语音权限。Search Console 凭据仅用于本地维护。这些凭据不属于站点资产，也不要求访客提供。CI 验证无需部署和语音秘密，不使用可写 token 执行 PR 代码。

只有原仓库 main 的 production 任务取得该环境的 Cloudflare token；环境应保持仅允许 main。部署需要指定账户的 Workers Scripts Edit，以及 vistep.ai 区域的 Workers Routes Edit、Zone Read，不应授予 DNS 编辑、计费或语音权限。Workers 权限按账户范围授予，不能声称仅控制单个 Worker。环境规则与实际 token 权限属于外部配置，仓库检查无法证明其状态。轮换时在 Cloudflare 创建新 token 并替换加密的环境 secret，不把本地 Wrangler OAuth 放入 CI。

科学纠错、排版和普通缺陷使用 Issue 模板，社区问题按[行为准则](code-of-conduct.md)处理。
