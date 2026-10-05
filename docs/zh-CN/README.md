# 中文文档

[项目首页](../../README.zh-CN.md) · [English](../README.md)

## 制作与维护

- [专题目录](catalog.md)：全部登记专题、影片时长和文章源码。
- [制作手册](creating-a-scene.md)：研究、分镜、模型、双语讲解和审看。
- [体脂秤案例](examples/body-fat-scale-brief.md)：四电极、独立称重与阻抗信号，以及受水分影响的估算。
- [耳温枪案例](examples/ear-thermometer-brief.md)：被动红外辐射、几何视场、热电堆参考温度与标定。
- [CPU、GPU、NPU 案例](examples/cpu-gpu-npu-brief.md)：同一矩阵任务、CPU 控制、GPU 通道与掩码、脉动 NPU 调度。
- [eSIM 案例](examples/esim-brief.md)：受保护的运营商 profile、消费类远程配置、芯片绑定与独立网络认证。
- [儿童近视防控镜片案例](examples/myopia-lens-brief.md)：矫正与微透镜光束、瞳孔接收、计算焦点及独立临床证据。
- [单反与无反案例](examples/slr-mirrorless-brief.md)：反光镜、对焦屏与棱镜、电子取景及独立快门帘。
- [拍立得案例](examples/instant-camera-brief.md)：同一张 Polaroid 积分式相纸、连续走纸、试剂铺展与染料迁移。
- [水母案例](examples/jellyfish-brief.md)：伞下体积、水通量、反向涡环及有界能量回收。
- [蜂窝网络与切换案例](examples/cell-handover-brief.md)：信号比较出的小区边界、A3 迟滞、X2 切换与寻呼。
- [4G 与 5G 案例](examples/mobile-5g-brief.md)：带宽、调制、层数、路径损耗与波束赋形。
- [手机漫游案例](examples/mobile-roaming-brief.md)：IMSI 寻址、MILENAGE 认证、漫游数据与来电路由。
- [机械键盘轴体案例](examples/keyboard-switch-brief.md)：段落轮廓、发声套件、接点检测、霍尔检测与光闸。
- [直升机案例](examples/helicopter-brief.md)：旋转机翼、总距与周期变距、倾斜推力和反扭矩。
- [AK-47 案例](examples/ak47-brief.md)：相连实物部件、运动与弹性能量。
- [地雷案例](examples/landmine-brief.md)：完整外壳、遮挡与长期风险。
- [原子弹案例](examples/atomic-bomb-brief.md)：裂变能量、中子增殖与临界几何。
- [氢弹案例](examples/hydrogen-bomb-brief.md)：库仑势垒、隧穿、反应率与约束。
- [NFC 案例](examples/nfc-brief.md)：被动供能、耦合电路与负载调制回传。
- [挖掘机案例](examples/excavator-brief.md)：液压油路、刚性连杆几何与教学边界。
- [自行车案例](examples/bicycle-brief.md)：分镜、几何与证据的对应关系。
- [架构](architecture.md)：数据流、资源生命周期和模型边界。
- [语言与 SEO](localization-and-seo.md)：多因子默认语言与自动生成的搜索元数据。
- [部署](deployment.md)：GitHub Actions、Cloudflare 预览、凭据与回滚。
- [Search Console 与访问统计](search-console.md)：所有权、sitemap、索引维护与 Cloudflare 访问报表。
- [制作复盘](retrospective.md)：问题、根因和后续制作要求。
- [场景技能](../../.agents/skills/vistep-scene/SKILL.md)：通过自然语言制作专题。

## 扩展发布与审看

- [新增五十个完整专题](expansion-50.md)：已发布范围、制作清单及尚未覆盖的审看。

## 检查记录

记录只对应具体版本与条件，不是对未来改动的保证。旧语音的解码和播放检查未证明中文可理解性，后续发现的问题见复盘。部分历史提交编号早于 Git 历史改写，可能无法在新克隆中解析；原始 Actions 与部署引用的阅读方式见[制作记录](expansion-50.md)。

- [六篇新专题审看](qa-six-explorations.md)：第 75–80 篇的独立模型复核、实测录音、浏览器观察及完整观看、试听和真机缺口。
- [身体测量专题审看](qa-body-measurement.md)：第 81–82 篇的模型边界、双语录音及分别记录的视觉、播放和设备证据。
- [运行时修补](qa-runtime-repairs.md)：语音重试、活动生命周期、蜂窝计算、404 与分项证据边界。
- [移动通信审看](qa-mobile-networks.md)：三篇并行专题的模型测试、停帧、录音与分项证据缺口。
- [机械键盘轴体审看](qa-keyboard-switch.md)：实体连接、确定性检测与分项交付证据。
- [直升机、AK-47 与地雷审看](qa-helicopter-ak47-landmine.md)：独立制作、模型交叉复核与分项交付证据。
- [原子弹审看](qa-atomic-bomb.md)：裂变模型、中子行走可重放性、浏览器停帧与完整播放、剩余缺口。
- [氢弹审看](qa-hydrogen-bomb.md)：反应率与燃烧模型校验、浏览器停帧与完整播放、剩余缺口。
- [NFC 审看](qa-nfc.md)：耦合电路、信号解码、实体几何与分项审看证据。
- [双缝干涉审看](qa-double-slit.md)：光场、衍射、可重现探测与浏览器证据。
- [挖掘机审看](qa-excavator.md)：液压与连杆核查、浏览器审看及证据边界。
- [机械细节与自动演示](qa-automatic-demos.md)
- [初版双语播放](qa-bilingual-narration.md)
- [维护与搜索接入](qa-maintenance.md)
- [首次正式发布](qa-production.md)
- [扩展修订审看](qa-expansion-refinements.md)：修复、录音修订及证据边界。
- [长演示、语言与 SEO](qa-longform.md)
- [首页一体化开场](qa-home-opening.md)
- [宣传动图与默认讲解](qa-showcase-audio.md)

## 社区

[贡献指南](contributing.md) · [行为准则](code-of-conduct.md) · [安全](security.md) · [许可证](../../LICENSE) · [第三方说明](third-party-notices.md) · [更新记录](changelog.md)
