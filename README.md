# vistep.ai

把日常，打开来看。

12 篇中文交互专题：自行车、冰箱、激光打印机、主动降噪、GPS、网页加载、JPEG、小型 Transformer、多维空间、钟摆、电梯调度、无事故堵车。

命名动画保留 **Visualize Every Step with AI → vis step ai → vistep ai → vistep.ai**，相邻两个 s 共用。动画融入首页文字，每次会话播放一次，支持重播和减少动态效果。

## 本地开发

需要 Node.js 22.12+（项目开发使用 Node 24）和 pnpm 11。

```sh
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm build
pnpm preview
```

本地默认地址：`http://127.0.0.1:4321/`。`pnpm check` 执行 Astro/TypeScript 检查；Vitest 覆盖核心数值模型；`dist/` 为静态发布产物。

## 制作结构

- `src/pages/index.astro`：首页，品牌文字动画、实时三维打印机和分层专题目录。
- `src/pages/explore/[slug].astro`：预生成的专题页面，支持直接访问、刷新和分享。
- `src/content/*.mdx`：中文讲解、实验任务、深入内容。
- `src/data/topics.ts`：专题元数据、来源、相关内容。
- `src/components/experiments/`：每篇独立交互与页面构图。
- `src/components/three/`：程序化器物模型、材质、阴影、环境照明、相机及直接操作。
- `src/models/`：物理、信号处理、数值定位、可复现模拟和自动微分模型。
- `src/workers/`：JPEG 运算和教学 Transformer 训练。
- `src/styles/editorial.css`：字体、版式与不同专题的视觉语言。

没有账号、后台、付费或在线 AI 服务。所有实验在读者的浏览器里运行。首页只加载首页所需的品牌和三维对象，专题计算引擎分别懒加载。

新增专题时登记 metadata，添加同 slug 的 MDX、模型与交互组件，在 `Experiment.tsx` 登记动态 import。先确定这篇独有的观看与操作方式，再实现。请遵守 `AGENTS.md` 的制作标准。

## 三维与降级

打印机包含扫描光路、感光鼓、充电与显影辊、传动齿轮、转印与定影、线路板和外壳；可开合外壳、切换俯视、跟随工序近看。自行车绘制齿形、链节、飞轮组和曲柄；钟摆可直接拖放实体摆球；冰箱显示剖面与完整循环管路；电梯使用建筑剖面和保留身份的乘客状态。

Three.js 场景在离屏和后台时暂停。移动端采用较低的像素比、阴影分辨率和 30fps 绘制上限，桌面上限 60fps；这些是调度策略，不是硬件性能保证。WebGL 创建失败时显示二维结构或模拟视图。键盘与表单操作覆盖主要实验。波形试听需要用户主动开启。

## 模型边界

- 单摆采用非线性运动方程与 RK4；周期公式注明小角近似。
- 自行车稳态模型包含滚阻、空气阻力、坡度、传动效率；视觉模型省略车架等与当前实验无关的部分。
- 冰箱 COP 是教学输入，能量满足 `Q_out = Q_in + W`；管路与粒子用于解释过程，不预测某个机型。
- 打印机为单色电子照相式教学剖面，部件比例、扫描与传纸时序经过简化。
- JPEG 实算 8×8 DCT、量化与 IDCT，报告误差和非零系数，不声称输出了完整 JPEG 文件。
- Transformer 是浏览器内真实训练的 8 维单层单头模型，使用因果注意力、反向传播和 Adam；生成阶段冻结权重。语料很小，目的是让每个中间状态可观察。
- GPS 是局部坐标中的伪距最小二乘教学模型；网络模拟明确采用 HTTP/2 over TCP + TLS 1.3，非实际测速。
- 电梯对比从同一组输入开始；车流采用确定性的 IDM 环路模型。

各专题底部提供原始资料链接。

## Cloudflare

预览部署到独立 Worker `vistep-preview`：

```sh
pnpm deploy:preview
```

正式 Worker 是 `vistep`，已存在的两个 custom domain 为 `vistep.ai` 和 `www.vistep.ai`。正式部署前先查看预览：

```sh
pnpm deploy
```

部署需要 `wrangler login` 或有效的 Cloudflare 凭据。凭据与 `.wrangler/` 不进入仓库。见 `docs/deployment.md`。

## 字体与资产

中文：Noto Sans SC Variable；拉丁字：Manrope Variable。字体本地托管，按 Unicode 区间加载；OFL 许可证与 Three.js MIT 许可证在 `public/licenses/`。所有器物与封面为代码构建，未使用外部图片或模型资产。
