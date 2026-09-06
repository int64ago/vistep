# Google Search Console

[English](../search-console.md) · [中文文档](README.md)

## 属性与所有权

`sc-domain:vistep.ai` 覆盖该域名的协议和子域名。2026-09-05 通过 Cloudflare 根域 TXT 完成所有权验证，2026-09-06 本机 CLI 复核权限为 **siteOwner**。保留验证 TXT，Google 会重新检查。现有 Worker 和域名绑定不变。

管理入口：[vistep.ai Search Console](https://search.google.com/search-console?resource_id=sc-domain%3Avistep.ai)。`https://vistep.ai/sitemap-index.xml` 于 `2026-09-05T08:06:10.481Z` 提交。2026-09-06 检查返回 `isPending: false`、0 errors、0 warnings，`lastDownloaded: 2026-09-06T05:21:37.344Z`。地图已读取，初始 pending 属于历史状态。地图接受成功和发现的 URL 数量不代表页面已收录或获得排名；收录情况要看 URL 检查和页面索引报告。

## 搜索数据与全站访问

Search Console 记录 Google 搜索曝光、点击、查询词与索引情况，不统计所有到站访客；通过 DNS 验证的属性无需浏览器跟踪脚本。访问次数、页面浏览、来源和国家请查看已接入的 [Cloudflare Web Analytics](deployment.md#访问统计与搜索)。统计脚本由 Cloudflare 注入正式响应，不能用仓库源码没有 beacon 判断统计未启用。

搜索报告不是实时访问日志。Google 说明，新站或新添加属性最多可能需要一周显示数据，已采集数据通常延后两至三天可见。所选时间范围过短或尚未完整、没有搜索活动、确有索引问题是不同情况；先检查报告日期和页面状态，再判断原因。标记为不完整的查询结果可能继续变化。不能仅凭 sitemap 的 `indexed` 计数断言全站都未收录。

## 本机维护

使用 [google-search-console-cli](https://github.com/Bin-Huang/google-search-console-cli)。凭据保存在本机工具配置或 `GOOGLE_APPLICATION_CREDENTIALS` 指向的位置，不进入仓库、构建产物或 CI。

```sh
google-search-console-cli site sc-domain:vistep.ai
google-search-console-cli sitemaps sc-domain:vistep.ai
google-search-console-cli inspect sc-domain:vistep.ai https://vistep.ai/en/
google-search-console-cli inspect sc-domain:vistep.ai https://vistep.ai/zh/
```

添加属性和验证所有权是两个动作。原有 OAuth 可访问 Search Console，但没有 Site Verification API 的授权范围；所有权验证通过已登录 Google 页面和 Cloudflare DNS 完成。无需访客跟踪脚本，也无需扩大日常 CLI 的权限。

## 发布后的检查

检查线上 sitemap index 与引用的 XML、纯文本 robots.txt、中英文路由、canonical / alternate 链接、索引响应头和真实 404。构建审计不能代替线上 HTTP 检查；Cloudflare 可能在 robots.txt 前附加托管规则。

稳定 sitemap 已提交后无需每次推送重复提交，Astro 会随专题变化重新生成。地址改变或需要修复登记时执行：

```sh
google-search-console-cli sitemap-submit sc-domain:vistep.ai https://vistep.ai/sitemap-index.xml
```

抽查首页和至少一对中英文专题，先查看索引排除、抓取失败和规范网址冲突，再解释曝光与点击率。URL 检查的存储结果描述 Google 索引记录，并非即时抓取。`URL is unknown to Google` 表示 Google 尚未见过该 URL；其他未收录状态需要看具体原因。即使实时可用性测试通过，也不保证收录。一次 API 成功不能证明所有页面已收录。

预览设置 noindex，不向 Google 提交。参见[语言与搜索](localization-and-seo.md)和[部署手册](deployment.md)。

依据：[所有权验证](https://support.google.com/webmasters/answer/9008080)、[Search Console 数据与延迟](https://support.google.com/webmasters/answer/96568)、[sitemap 报告含义](https://support.google.com/webmasters/answer/7451001)、[URL 检查](https://support.google.com/webmasters/answer/9012289)、[提交 sitemap](https://developers.google.com/webmaster-tools/v1/sitemaps/submit)、[noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)。
