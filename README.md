# vistep.ai

把日常，打开来看。

重做版预览：https://vistep-preview.int64ago.workers.dev

12 篇中英文专题，默认播放约半分钟的引导演示，保留暂停、重播与「自己试试」。长讲解、公式与来源收在「深入了解」中。

专题包括：自行车、冰箱、激光打印机、主动降噪、GPS、网页加载、JPEG、小型 Transformer、多维空间、钟摆、电梯调度、无事故堵车。

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
- `src/content/*.mdx` 与 `src/content/en/*.mdx`：两种语言各自预生成的讲解、实验任务、深入内容。
- `src/i18n/`：页面与实验标注的语言映射；`/en/` 与中文路径互相对应。
- `src/data/narration.json`：按镜头编写的中英文口语讲解，独立于屏幕字幕。
- `src/data/audio-manifest.json`：24 条音轨与 108 个片段的时间、文稿和生成参数。
- `public/narration/`：带内容哈希的 MP3 音轨，按需加载并长期缓存。
- `src/data/films.ts`：各篇自己的镜头时序和短字幕。
- `src/components/lab/Showcase.tsx`：可见时播放的时钟、暂停、重播和探索模式。
- `src/data/topics.ts`：专题元数据、来源、相关内容。
- `src/components/experiments/`：每篇独立交互与页面构图。
- `src/components/three/`：程序化器物模型、材质、阴影、环境照明、相机及直接操作。
- `src/models/`：物理、信号处理、数值定位、可复现模拟和自动微分模型。
- `src/workers/`：JPEG 运算和教学 Transformer 训练。
- `src/styles/showcase.css`：演示优先的布局、手机构图和播放控件。
- `src/styles/editorial.css`：字体、版式与不同专题的视觉语言。

没有账号、后台、付费或访客端在线 AI 调用。所有实验在读者的浏览器里运行。首页只加载首页所需的品牌和三维对象，专题计算引擎分别懒加载。

新增专题时登记 metadata，添加同 slug 的 MDX、模型与交互组件，在 `Experiment.tsx` 登记动态 import。先确定这篇独有的观看与操作方式，再实现。请遵守 `AGENTS.md` 的制作标准。

## 三维与降级

打印机包含扫描光路、感光鼓、充电与显影辊、传动齿轮、转印与定影、线路板和外壳；可开合外壳、切换俯视、跟随工序近看。自行车以两轴试验架展示同节距链轮、闭合的偶数链节、内外链板、轴承和曲柄；钟摆可直接拖放实体摆球；冰箱显示剖面与完整循环管路；电梯使用建筑剖面和保留身份的乘客状态。

Three.js 场景在离屏和后台时暂停。移动端采用较低的像素比、阴影分辨率和 30fps 绘制上限，桌面上限 60fps；这些是调度策略，不是硬件性能保证。WebGL 创建失败或上下文丢失时显示二维结构或模拟视图；自由探索中也可主动切到二维，切换会释放三维资源。键盘与表单操作覆盖主要实验。波形试听需要用户主动开启。

## 模型边界

- 单摆采用非线性运动方程与 RK4；周期公式注明小角近似。
- 自行车稳态模型包含滚阻、空气阻力、坡度、传动效率；三维使用两轴链传动试验架，通过微调轴距闭合偶数链节；换挡以场景切换展示两种已张紧配置，不模拟拨链器。
- 冰箱 COP 是教学输入，能量满足 `Q_out = Q_in + W`；管路与粒子用于解释过程，不预测某个机型。
- 打印机为单色电子照相式教学剖面，部件比例、扫描与传纸时序经过简化。齿轮采用共同模数的渐开线，皮带为闭合实体，纸张与滚筒使用同一表面速度。
- JPEG 实算 8×8 DCT、量化与 IDCT，报告误差和非零系数，不声称输出了完整 JPEG 文件。
- Transformer 是浏览器内真实训练的 8 维单层单头模型，使用因果注意力、反向传播和 Adam；生成阶段冻结权重。语料很小，目的是让每个中间状态可观察。
- GPS 是局部坐标中的伪距最小二乘教学模型；网络模拟明确采用 HTTP/2 over TCP + TLS 1.3，非实际测速。
- 电梯对比从同一组输入开始；车流采用确定性的 IDM 环路模型。默认演示为 36 辆车、500 米环路、一次 1.5 秒刹车；两种系统均用固定积分步长。

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

中文：Noto Sans SC Variable；拉丁字：Manrope Variable。字体本地托管，按 Unicode 区间加载；OFL 许可证与 Three.js MIT 许可证在 `public/licenses/`。所有器物与封面为代码构建，未使用外部图片或模型资产。讲解音频由单独编写的中英文稿件生成，使用 Cloudflare 托管的 MeloTTS；不是页面文字的自动朗读。

## 双语与声音

右上角 `EN / 中文` 切换同一专题，并保留阅读锚点。语言存于本地浏览器，之后从首页进入时沿用选择。两种语言都有独立 URL、规范网址、语言替代链接和预生成正文。教学 Transformer 共用同一九字符中文词表与权重；英文界面显示词元含义，模型说明明确这一边界。

默认静音。点「听讲解」从头播放当前语言的配音；本次会话内后续专题沿用声音选择。浏览器若阻止自动播放，会提示再次点一下声音按钮。音频播放时间驱动镜头和字幕；暂停、重播、缓冲等待、离屏、后台与自由探索都同步处理。声音加载失败时静默演示继续，可直接重试。翻页释放旧音频。主动降噪的实验试听与讲解分别控制，讲解开启时降低合成纯音音量。

稿件按观察对象、动作和因果关系编排，句间与镜头之间留出观察空隙。每种语言分别生成，不调用浏览器的 `speechSynthesis` 朗读字幕。

音轨已在仓库内，日常安装、构建、部署不需要语音服务权限。修改稿件后再生成：

```sh
python3 -m venv .venv-voice
.venv-voice/bin/pip install -r scripts/requirements-voice.txt
.venv-voice/bin/python scripts/generate-narration.py --account YOUR_CLOUDFLARE_ACCOUNT_ID
# 只修改一篇时，追加 --only printer
pnpm test
pnpm build
```

生成时使用 `CLOUDFLARE_API_TOKEN` 或本机 Wrangler OAuth 登录。凭据不会进入音频、页面或仓库。语音服务为 [Cloudflare MeloTTS](https://developers.cloudflare.com/workers-ai/models/melotts/)，仅制作阶段使用；请按账户实际服务额度运行。脚本缓存原始语音、统一响度、保留句内停顿，再按 `films.ts` 的章节拼接。过长片段会让生成检查失败，需要改短稿件，而不是任意加速。重生成后清理未被清单引用的旧音轨。
