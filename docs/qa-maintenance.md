# 维护配套与搜索接入检查

日期：2026-09-05。范围：文档、场景制作工具、发布登记、索引配置与社区配套；本轮没有修改原理模型、几何、镜头或音轨。

## 已执行

- Search Console：Cloudflare 新增根域验证 TXT；Google 页面显示 Ownership verified，CLI 返回 `sc-domain:vistep.ai` / `siteOwner`。首页索引检查返回 `URL is unknown to Google`，sitemap 列表为空。
- 正式站 HTTP 检查：仍是原品牌页；sitemap 路径返回 HTML，未向 Google 提交错误内容。保留正式 Worker 及两个域名绑定。
- 类型检查：0 errors、0 warnings、0 hints。
- Vitest：6 个测试文件、36 项测试通过。新增检查覆盖发布登记一致性、文章锚点、相关链接、时间线，以及草稿生成的路径限制和不覆盖已有工作。
- 生产与预览构建审计：各 26 个规范中英文页面，另有 404；地图、页面内链/资源、描述与语言替代链接完整。生产无 noindex，预览有 noindex，输出目录分离。
- `pnpm scene:check`：3 个文件、7 项发布、双语与音轨契约测试通过。
- 场景技能通过 skill-creator 的 quick_validate；GitHub 工作流、Dependabot 与 Issue 表单 YAML 可解析。
- Chrome 对本地生产构建进行首页与打印机运行检查：自动加载、播放时间推进、声音状态和语言切换正常。此检查确认登记重构后的运行，不代表重新完成全部专题的审美验收。

- `pnpm verify` 整体通过；文档审计检查 21 个 Markdown 文件中的 81 个本地文件链接，未将其表述为外链和锚点验证。
- `pnpm audit --prod` 返回 No known vulnerabilities found；结果是本次注册表审计快照，不是未来安全保证。
- 预览版本 `06c011e9-7589-49f0-b924-0145b601209b` 已部署；线上检查 30 个地址（26 个页面、robots、sitemap、图标和不存在路径），状态码与 noindex 响应头正确，robots 为纯文本。正式域名仍保留原页面。

- GitHub Ubuntu CI [33952470175](https://github.com/int64ago/vistep/actions/runs/33952470175) 通过：从锁文件全新安装，执行完整 verify 与独立预览构建；无需部署、Google 或语音凭据。

## 交付边界

本次使用的 Cloudflare / Google 私密凭据没有写入源码或构建。公开维护邮箱来自维护者公开 GitHub 资料。验证 TXT 是域名证明记录，保留在 DNS 中，不作为运行时密钥使用。

新增技能与草稿生成器统一制作过程，未引入新专题、通用实验模板或虚构的“完成”演示。对新增场景仍要求独立构图、科学模型、双语实播及逐帧证据。

本轮未进行新的真机帧率测量、全套配音听感审听或 12 篇全流程视觉重验；参考之前两份检查记录，并对之后的具体改动安排相应验收。
