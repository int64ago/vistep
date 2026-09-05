<div align="center">

[![vistep.ai 原创品牌动图](docs/media/vistep-showcase.gif)](https://vistep.ai/zh/)

**Visualize Every Step with AI**

用可视化，看懂日常事物背后的原理。

[开始探索](https://vistep.ai/zh/) · [文档](docs/zh-CN/README.md) · [参与贡献](docs/zh-CN/contributing.md) · [English](README.md)

[![CI](https://github.com/int64ago/vistep/actions/workflows/ci.yml/badge.svg)](https://github.com/int64ago/vistep/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-83956f)](LICENSE)
[![Astro](https://img.shields.io/badge/Astro-7-5a6354?logo=astro&logoColor=white)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-50758b?logo=typescript&logoColor=white)](tsconfig.json)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-b88953?logo=cloudflare&logoColor=white)](docs/zh-CN/deployment.md)
[![Languages](https://img.shields.io/badge/languages-English%20%2B%20中文-827393)](docs/zh-CN/localization-and-seo.md)

[查看静态画面](docs/media/vistep-showcase-poster.png)

</div>

跟随一个对象，看见隐藏的中间过程，再亲手验证。vistep 将自动分镜、精细的三维机构和浏览器内科学模型结合起来，每篇按现象选择自己的表达方式。

## 探索内容

| 生活器物                                            | 信息与计算                                                 | 空间与系统                                        |
| --------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| [自行车变速](https://vistep.ai/explore/bicycle/)    | [主动降噪](https://vistep.ai/explore/noise/)               | [多维空间](https://vistep.ai/explore/dimensions/) |
| [冰箱制冷](https://vistep.ai/explore/refrigerator/) | [GPS 定位](https://vistep.ai/explore/gps/)                 | [钟摆](https://vistep.ai/explore/pendulum/)       |
| [激光打印机](https://vistep.ai/explore/printer/)    | [网页加载](https://vistep.ai/explore/network/)             | [电梯调度](https://vistep.ai/explore/elevator/)   |
|                                                     | [JPEG 压缩](https://vistep.ai/explore/jpeg/)               | [无事故堵车](https://vistep.ai/explore/traffic/)  |
|                                                     | [大模型训练与生成](https://vistep.ai/explore/transformer/) |                                                   |

- **先观看，再实验。** 每篇 2–5 分钟，支持章节、暂停、重播与定位；调参按需展开。
- **计算驱动画面。** 机构几何、运动和读数使用同一模型。JPEG 与小型 Transformer 在 Worker 中实际计算，明确标注教学简化。
- **双语阅读与讲解。** 中英文分别撰稿与录音，共用镜头时间线。语音讲解默认开启，并记住你的选择；浏览器限制自动播放时，点击即可开启。字幕和分段讲解始终可用。
- **浏览器内运行。** 无需账号、API 密钥或实时 AI 服务。语言偏好保存在本地。
- **适配不同使用方式。** 分别安排桌面与手机构图，支持键盘、减少动态效果，以及 WebGL 场景的二维替代视图。

## 本地开发

使用 Node.js 24（[.nvmrc](.nvmrc)）与 pnpm 11.25.0。本地开发不需要 Cloudflare 权限。

```sh
git clone https://github.com/int64ago/vistep.git
cd vistep
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

打开 [localhost:4321](http://127.0.0.1:4321/)。音轨已经包含在仓库内，安装与构建不调用语音服务。

| 命令                 | 用途                                           |
| -------------------- | ---------------------------------------------- |
| `pnpm verify`        | 格式、文档链接、类型、测试、生产构建与产物审计 |
| `pnpm build:preview` | 独立预览构建及 noindex 检查                    |
| `pnpm preview`       | 本地查看生产构建                               |
| `pnpm scene:check`   | 专题登记、双语内容与音频契约                   |

## 架构

Astro 预生成正文、分段讲解和搜索元数据，React 按专题加载实验。独立 TypeScript 模型驱动 SVG、Canvas 和 Three.js。音轨与动画共用章节时钟，跳转时重建模拟状态。

详见[架构](docs/zh-CN/architecture.md)、[语言与 SEO](docs/zh-CN/localization-and-seo.md)和[部署说明](docs/zh-CN/deployment.md)。合并到 `main` 后，GitHub Actions 检查通过即自动部署。预览和生产资产分开管理。

## 新增专题

向 [vistep-scene 技能](.agents/skills/vistep-scene/SKILL.md)直接描述选题：

> 使用 $vistep-scene，解释感应电机为什么会转。

技能负责研究、分镜、模型、渲染、双语声音和审看。普通贡献者也可直接遵循[制作手册](docs/zh-CN/creating-a-scene.md)。复用制作过程与基础设施，根据原理选择构图和交互。

## 贡献与许可

欢迎科学纠错、新专题、无障碍和翻译贡献。请阅读[贡献指南](docs/zh-CN/contributing.md)和[行为准则](docs/zh-CN/code-of-conduct.md)。安全问题使用[私下报告渠道](docs/zh-CN/security.md)。

[检查记录](docs/zh-CN/README.md#检查记录)分别说明自动测试、浏览器观察、试听与未覆盖项。

原创代码与文档采用 [MIT 许可证](LICENSE)。字体、依赖与生成语音的来源见[第三方说明](docs/zh-CN/third-party-notices.md)。
