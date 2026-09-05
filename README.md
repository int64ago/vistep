# vistep.ai

**把日常，打开来看。** · [English](README.en.md)

用精细的视觉演示，解释生活和工作背后的原理。先看变化如何发生，再按自己的兴趣探索细节。

[体验新版预览](https://vistep-preview.int64ago.workers.dev/) · [制作一个场景](docs/creating-a-scene.md) · [贡献指南](CONTRIBUTING.md) · [文档目录](docs/README.md)

> 当前完整站点在预览地址；`vistep.ai` 正式域名仍保留原品牌页。仓库按开源协作方式整理，许可证为 MIT；仓库是否公开由所有者决定。

## 可以看到什么

12 个中英文专题，包含 30–42 秒自动引导演示、按需深入阅读和独立实验。讲解声音默认关闭，由用户开启；中英文分别撰写配音稿，与镜头同步。计算在浏览器运行，阅读和实验不需要账号、API 密钥或实时 AI 服务。

| 生活器物   | 信息与计算                  | 空间与系统 |
| ---------- | --------------------------- | ---------- |
| 自行车变速 | 主动降噪                    | 多维空间   |
| 冰箱制冷   | GPS 定位                    | 钟摆       |
| 激光打印机 | 网页加载                    | 电梯调度   |
|            | JPEG 压缩、大模型训练与生成 | 无事故堵车 |

实体机制使用程序化 3D 和可追踪部件；信号、像素、网络与交通用适合各自现象的表达形式。页面和基础控件共享品牌，每篇保留自己的构图与交互。WebGL 不可用时提供二维视图，静音也能理解主线。

名字来自 **Visualize Every Step with AI → vis step ai → 相邻两个 s 合并 → vistep ai → vistep.ai**。首页以紧凑的文字动画保留这一演变，支持重播与减少动态效果。

## 新增场景

直接使用 [vistep-scene 技能](.agents/skills/vistep-scene/SKILL.md)，告诉它想解释什么：

> 使用 $vistep-scene，新增一个“感应电机为什么会转”的演示。

技能负责资料、分镜、独立视觉设计、模型、实现、中英文讲解与配音，以及完整验收。只需描述选题和偏好，制作工具由技能内部调用。

## 本地运行

需要 Node.js 22.12+（推荐 Node 24，见 `.nvmrc`）与 `pnpm@11.25.0`。无需 Cloudflare 登录。

```sh
npm install --global pnpm@11.25.0
git clone https://github.com/int64ago/vistep.git
cd vistep
pnpm install --frozen-lockfile
pnpm dev
```

打开 [localhost:4321](http://127.0.0.1:4321/)。音轨已提交，日常安装和构建不生成语音、不调用供应商服务。

```sh
pnpm scene:check                              # 专题、双语和配音登记
pnpm verify                                  # 格式、类型、测试、生产构建与产物审计
pnpm build:preview                           # 独立预览构建与 noindex 检查
pnpm preview                                 # 查看 dist/ 中的生产构建
```

## 制作与架构

Astro 预生成讲解，React 按专题加载，TypeScript 独立模型驱动 SVG / Canvas / Three.js。JPEG 与教学 Transformer 在 Worker 中计算。配音通过静态音轨和共享时间线同步。

- [场景制作手册](docs/creating-a-scene.md)：从主问题、分镜、模型到双语声音和逐项验收。
- [全过程复盘](docs/retrospective.md)：用户反馈、根因、实际改进与仍需验证的边界。
- [架构与模型范围](docs/architecture.md)：文件职责、生命周期和教学简化。
- [部署与回滚](docs/deployment.md)：独立 Cloudflare 预览、正式域名和版本记录。
- [Search Console](docs/search-console.md)：域名验证、站点地图、日常查看与上线步骤。

自动化检查能拦住数值、语言和发布漏项；视觉精致程度、镜头可理解性与声音自然程度需要实际审看和试听。性能上限策略不等于普通手机的实测帧率，具体覆盖范围保留在 [检查记录](docs/README.md#检查记录)。

## 贡献与许可

欢迎修正原理、改进演示、完善翻译与提出新选题。提交前读 [CONTRIBUTING.md](CONTRIBUTING.md)；问题和建议使用仓库 Issue 模板。参与需遵守 [行为准则](CODE_OF_CONDUCT.md)，安全问题使用 [私下报告渠道](SECURITY.md)。

原创代码与文档采用 [MIT License](LICENSE)。字体、依赖及音频来源见 [第三方说明](THIRD_PARTY_NOTICES.md)。许可证不代表可以移除第三方许可，也不授予冒充官方网站的权利。
