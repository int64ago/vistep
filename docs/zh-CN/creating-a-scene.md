# 制作一个专题

[English](../creating-a-scene.md) · [中文文档](README.md)

用一条可追踪的视觉因果链解释一个问题。复用制作流程、播放器和生命周期基础设施，每篇根据现象选择自己的构图和媒介。

## 从问题开始

使用 Codex 时，向 [vistep-scene 技能](../../.agents/skills/vistep-scene/SKILL.md)直接描述选题。技能负责研究到实现、双语声音与审看；用户不需要填表或执行脚手架命令。普通贡献者也可直接按本手册制作。

先确定观众原来的直觉、一个全程追踪的对象、改变理解的关键观察，以及模型边界。记录一手技术来源。感应电机的例子应追踪旋转磁场、转子感应电流和转矩，而不只是展示外壳。

内部可选辅助工具 `pnpm scene:new induction-motor --medium three` 创建未发布草稿。支持 `three`、`svg`、`canvas`、`audio`、`hybrid`。创建草稿不登记页面，也不表示专题已完成。

## 先分镜，后旁白

自动演示 **2–5 分钟，推荐 2–3 分钟，5 分钟封顶**。每章必须增加一个可见观察、因果步骤或受控对照。在原来的短循环上延长讲解不能交付。

每章明确追踪对象、关注细节、可见变化、驱动变化的模型状态、它证明的结论、镜头与手机构图、短字幕和对应口语稿。编码前画出初始、认知转折、结果三个关键画面。

内部结构、接触和遮挡可以使用 3D；矩阵、波形、像素、时序和切片应直接表达。参考[自行车案例](examples/bicycle-brief.md)和[复盘](retrospective.md)，不要复制另一篇的面板布局。

## 实现完整静音主线

方程、单位和约束放在 `src/models/`，重计算放入 Worker。图形、读数与标注来自同一状态。机械检查节距、切向、相位和闭合；系统比较保持相同输入和对象身份。

`useShowcase()` 提供 `chapter`、`chapterTime`、`chapterProgress`、`chapters`、`time`、`run`、`watch`、`playing`。按章节相对进度安排镜头，不绑定旧片的绝对秒数。有历史的模拟用确定性回放，前后跳转应与连续播放一致，暂停时不能继续积分。

先完成静音也能看懂的因果过程，再增加自由探索。明确教学简化；JPEG 系数数量不是文件大小，Transformer 生成不能更新权重。

## 双语写作与音轨

中英文分别写成自然口语，指出此时该看哪里，给观众反应时间，再解释变化。不要照读 UI，也不要用更多文字填充缺少画面的时段。

语音讲解默认开启，遵循已保存的手动选择及页面语言。浏览器阻止有声自动播放时，保留明确的主动开启入口，静音演示仍可继续。降噪实验的纯音仍须单独主动开启。

源文件为 `src/data/narration.json`。每段包含 `id`、`title`、`titleEn`、`caption`、`captionEn`、`zh`、`en`、`seconds`（最低计划窗口）、`chapterAt`、`at`。生成器测量两种语音并留出停顿，共同生成 `film-timeline.json`、`audio-tracks.json`、`audio-manifest.json` 与内容哈希 MP3。**不对语音变速。**

```sh
python3 -m venv .venv-voice
.venv-voice/bin/pip install -r scripts/requirements-voice.txt
.venv-voice/bin/python scripts/generate-narration.py --only induction-motor
```

制作使用 Microsoft Edge 在线语音与锁定版本 `edge-tts`，需要联网，普通构建与访客不调用此服务。详见[来源说明](third-party-notices.md)。实测超过五分钟时修改分镜和稿件。只生成改动专题，稿件、清单和录音一起提交。

两种声音都要检查清晰度、术语、语气和镜头同步。可选的 `scripts/audit-narration.py` 使用 Workers AI 独立转写每段录音，不提供语言提示或参考稿，识别错误语言和乱码。它不能认证自然度，不能称作真人试听。凭据只用于本地制作，不进入 CI 或站点。

## 接入

| 文件                 | 要求                                                             |
| -------------------- | ---------------------------------------------------------------- |
| `topics.ts`          | 唯一 slug 和编号、元数据、资料、相关专题                         |
| `experiments.ts`     | 显式按需导入                                                     |
| 两份 MDX             | 完整正文及 `understand`、`try`、`deeper` 锚点                    |
| `en.json`            | 标注、字幕和元数据，保留插值占位符                               |
| 讲解源文件和生成文件 | 两种音轨、对应段落和实测窗口                                     |
| 封面                 | 独立的 `TopicCover.astro` 表达；精选器物另接 `ObjectCover.astro` |

路由、分段讲解、结构化数据、语言替代链接、PNG 分享图和 sitemap 随构建生成。新封面也要检查分享图的构图。登记测试只能查缺项，不能判断表达是否精致。

## 审看与发布

执行 `pnpm scene:check`、`pnpm verify`、`pnpm build:preview`，分别记录实际版本、环境和证据：

1. 完整静音主线、暂停、重播、每章跳转和自由探索。
2. 双语音轨、缓冲、播放受阻、语言切换、离屏暂停。
3. 关键停帧、机械接触、闭合路径、极值、标注对齐和镜头边界。
4. 桌面、390px、320px；键盘和触控目标；减少动态效果、WebGL / Worker 失败、深链接与 404。

正文至少 16px，主要操作目标至少 44px。缩窗不是手机硬件性能实测，未覆盖条件必须明确记录。新发现应改进流程，避免堆积无关检查。

交付包含实际场景、预览与证据。推送 main 会自动上线，应先完成科学、视觉和配音审看。按[部署手册](deployment.md)及会话已有授权推进，普通内容贡献不改变域名归属或仓库可见性。
