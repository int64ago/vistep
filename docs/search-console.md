# Google Search Console

## 接入状态（2026-09-05）

- 属性：`sc-domain:vistep.ai`，覆盖该域名及其协议、子域名。
- 已通过 Cloudflare 根域 TXT 完成域名所有权验证；Google 页面显示 **Ownership verified**，CLI 返回 **siteOwner**。
- 只新增 `google-site-verification=…` TXT，保留现有 `vistep.ai` 和 `www.vistep.ai` Worker 绑定。不要删除此 TXT；Google 会持续检查所有权。
- 管理入口：[vistep.ai Search Console](https://search.google.com/search-console?resource_id=sc-domain%3Avistep.ai)。
- 新版正式站已上线，索引地图与子地图均返回正确 XML，包含 26 个中英文页面。
- 已于 `2026-09-05T08:06:10.481Z` 提交 `https://vistep.ai/sitemap-index.xml`。提交后列表可查，初始状态为 `isPending: true`、0 errors、0 warnings，等待 Google 处理。

正式发布前的首页 URL 检查返回 `URL is unknown to Google`。现在地图已提交，但提交成功不代表页面已收录，也不保证排名。新属性没有数据属于可能的正常状态，后续以 Google 的抓取和索引报告为准。

## 本机命令

维护使用 [google-search-console-cli](https://github.com/Bin-Huang/google-search-console-cli)。凭据保存在本机工具配置或 `GOOGLE_APPLICATION_CREDENTIALS` 指向的位置，不进入此仓库、构建或 CI。

```sh
google-search-console-cli site sc-domain:vistep.ai
google-search-console-cli sitemaps sc-domain:vistep.ai
google-search-console-cli inspect sc-domain:vistep.ai https://vistep.ai/
```

添加属性不等于验证所有权。本次现有 OAuth 凭据可访问 Search Console，但没有 Site Verification API 的授权范围，因此通过已经登录的 Google 页面取得 TXT，并在 Cloudflare 页面新增记录后完成验证。无需把验证接口权限扩大到日常工具，也无需在网站上增加访客跟踪脚本。

## 后续发布与地图维护

1. 按 [部署手册](deployment.md) 发布确认过的版本，并记录回滚 ID。
2. 检查 `https://vistep.ai/sitemap-index.xml` 与它引用的子地图都返回 200、XML 内容；检查 `robots.txt` 为纯文本规则，没有误混入 HTML。
3. 验证地图中的中文、英文页面均可直接访问，规范网址指向自身，语言替代链接成对存在。生产响应不得带 `noindex`；未知地址应为真实 404。
4. 提交正式地图：

```sh
google-search-console-cli sitemap-submit sc-domain:vistep.ai https://vistep.ai/sitemap-index.xml
google-search-console-cli sitemaps sc-domain:vistep.ai
```

5. 在 URL 检查中抽查首页和至少一对中英文专题，查看抓取与规范网址结果。Google 的索引数据可能延后，不将一次提交成功写成“已全部收录”。

构建时的 `pnpm audit:build` 会检查页面与地图、内链、规范网址和语言替代链接；不能替代上线后的 HTTP 响应检查。Cloudflare 可能在 robots.txt 前附加托管规则，因此还要检查最终线上响应。

## 预览与日常维护

`pnpm build:preview` 输出到 `dist-preview/`，所有路径附 `X-Robots-Tag: noindex, nofollow`，保留生产规范网址，不在 robots 中宣传地图。允许爬虫访问，以便读到 noindex 响应头。预览 URL 只用于审看，不提交到此域名属性。

新增场景上线后，Astro 自动重建 sitemap，无需为每个 URL 再创建属性。日常查看页面索引错误、抓取异常、规范网址冲突和移动端 Core Web Vitals；有数据后再分析查询词和点击率。不要因短期无流量随意改动 URL 或删除内容。

## 官方依据

- [Google：域名所有权验证](https://support.google.com/webmasters/answer/9008080)
- [Search Console API：添加属性](https://developers.google.com/webmaster-tools/v1/sites/add)
- [Search Console API：提交 sitemap](https://developers.google.com/webmaster-tools/v1/sitemaps/submit)
- [Google：使用 noindex 阻止索引](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
