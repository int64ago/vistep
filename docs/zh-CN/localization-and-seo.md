# 语言与搜索

[English](../localization-and-seo.md) · [中文文档](README.md)

## 默认语言的多因子判断

中立入口 `/` 在首屏绘制前进行本地判断，再用 `location.replace` 打开 `/zh/` 或 `/en/`，保留查询参数和锚点。明确请求和保存的手动选择优先；其余信号合并计分，并非逐项回退：

| 信号                    | 处理方式                                      |
| ----------------------- | --------------------------------------------- |
| `?lang=zh` / `?lang=en` | 明确请求，最高优先级                          |
| 手动切换记录            | `localStorage['vistep:language']`，优先于推断 |
| `navigator.languages`   | 按偏好顺序加权，同语言不同地区不重复投票      |
| `navigator.language`    | 未被列表覆盖时补充浏览器偏好                  |
| `Intl` 格式语言         | 辅助格式语言信号                              |
| 同站来源页面            | 延续已有语言的弱信号                          |
| 时区                    | 地区弱提示，不能覆盖明确的浏览器偏好          |
| 无有效信息或平分        | 英文                                          |

不使用 IP 查询、定位授权、指纹识别或第三方语言服务。存储或 Intl 不可用也能进入页面。推断结果不写成永久偏好，只有手动切换保存选择；切换保留专题和锚点。

中文首页为 `/zh/`，英文首页为 `/en/`；原有中文 `/explore/<slug>/` 不变，英文为 `/en/explore/<slug>/`。明确语言的地址不根据设备设置自动跳转，便于分享和搜索。关闭 JavaScript 时根页仍提供英文内容和两种语言链接。

## 搜索元数据

中立入口、中英文首页和专题页具有自指向 canonical、互相对应的 `zh-CN` 与 `en` 链接、x-default、语言、Open Graph / Twitter 信息，以及 1200 × 630 的 PNG 分享图。专题标题与描述来自本地化登记数据。中立入口与 `/en/` 共用英文回退标题和描述，并非另一篇文章。

首页 x-default 指向 `/`，专题 x-default 指向英文专题。`/404.html` 是双语错误页，带 noindex meta，不输出结构化数据，不属于可索引内容路由。元数据和结构化数据主要来自 `src/layouts/Base.astro` 与 `src/data/seo.ts`；`astro.config.mjs` 为 sitemap 设置对应的语言链接，并排除分享图地址。

首页结构化数据描述网站与专题集合；专题使用 `LearningResource`、面包屑、章节与带完整讲解稿的 `AudioObject`。交互场景不冒充视频。结构化数据对应可见内容，不保证搜索结果获得特殊样式。

正文和分段讲解预生成，每段可链接至 `#t=秒数` 回到对应镜头。主画面保持短字幕，完整讲解可不运行实验直接阅读。

每次构建自动更新路由和 sitemap；已登记专题及翻译提供元数据、语言替代链接、结构化数据和分享图。没有伪造每日更新时间、更新频率或优先级。Search Console 已读取稳定的 sitemap 地址，普通推送无需重复提交。读取地图不代表页面已收录或出现在搜索结果中，核查日期与状态见 [Search Console](search-console.md)。

正式站允许收录；预览通过响应头设置 `noindex, nofollow`，并允许爬虫读取该头。预览 robots.txt 不宣传 sitemap，但地图文件和 HTML 链接仍存在。不存在的路径实际返回 404 并设置 noindex。生产与预览使用不同产物目录和 Worker，两个构建都保留生产 canonical。

Search Console 与全站访问统计是两项服务。Cloudflare 在交付时注入正式站 Web Analytics beacon；布局没有配置 Google Analytics 或 Google Tag Manager 脚本。访问面板入口和指标边界见[部署手册](deployment.md#访问统计与搜索)。

## 检查

`pnpm audit:build` 检查规范网址、sitemap 覆盖、替代语言、描述、分享图尺寸、结构化数据、分段讲解数量和内链资源。语言测试覆盖偏好冲突、地区变体重复、不支持语言与降级。持久化和首屏行为另做浏览器检查。

维护操作见 [Search Console](search-console.md)。依据 Google 的[本地化版本](https://developers.google.com/search/docs/specialty/international/localized-versions)、[多语言站点](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)和[结构化数据说明](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)。
