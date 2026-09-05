export type Film = { duration: number; chapters: { at: number; caption: string }[] };
export const films: Record<string, Film> = {
  printer: {
    duration: 34,
    chapters: [
      { at: 0, caption: '打开外壳，跟随一个像素。' },
      { at: 4, caption: '充电：鼓面先获得均匀的电位。' },
      { at: 9, caption: '曝光：激光把图案写成电位差。' },
      { at: 14, caption: '显影：碳粉留在需要成像的位置。' },
      { at: 19, caption: '转印：图案从鼓面来到纸上。' },
      { at: 24, caption: '定影：热与压力，让碳粉留得住。' },
      { at: 29, caption: '清洁复位，准备下一张纸。' },
    ],
  },
  bicycle: {
    duration: 34,
    chapters: [
      { at: 0, caption: '跟随金色链节，看动力怎样绕一圈。' },
      { at: 9, caption: '每一颗齿，都接住同一节距的链条。' },
      { at: 17, caption: '换小飞轮：同样踩一圈，后轴转得更多。' },
      { at: 26, caption: '换大飞轮：速度降低，上坡更省力。' },
    ],
  },
  pendulum: {
    duration: 32,
    chapters: [
      { at: 0, caption: '松手。高度变成速度。' },
      { at: 8, caption: '最低处最快；两端停住，再返回。' },
      { at: 16, caption: '换一条长线，往返就慢下来。' },
      { at: 24, caption: '增加阻尼，摆幅逐渐变小。' },
    ],
  },
  refrigerator: {
    duration: 32,
    chapters: [
      { at: 0, caption: '电能驱动压缩机，蒸气升温、升压。' },
      { at: 8, caption: '冷凝器向房间放热，蒸气变成液体。' },
      { at: 16, caption: '经过毛细管，压力下降，部分液体闪蒸。' },
      { at: 24, caption: '在箱内蒸发吸热，再流回压缩机。' },
    ],
  },
  noise: {
    duration: 30,
    chapters: [
      { at: 0, caption: '环境声，是不断起伏的声压。' },
      { at: 6, caption: '加入同样的波，声音反而变强。' },
      { at: 13, caption: '把波峰对准波谷，叠加结果变平。' },
      { at: 22, caption: '只晚到一点点，抵消就不再完整。' },
    ],
  },
  gps: {
    duration: 32,
    chapters: [
      { at: 0, caption: '一个距离，只能确定一个圆。' },
      { at: 7, caption: '两个距离，通常还留下两个交点。' },
      { at: 14, caption: '第三个距离，把位置确定下来。' },
      { at: 22, caption: '在三维中用球面定位，还要校正时钟。' },
      { at: 25, caption: '扣掉时钟偏差，四个球面交于同一个位置。' },
    ],
  },
  network: {
    duration: 30,
    chapters: [
      { at: 0, caption: '第一次访问：先查地址，再建立加密连接。' },
      { at: 10, caption: '内容抵达后，浏览器把代码画成页面。' },
      { at: 16, caption: '再次访问：复用连接，少等几次往返。' },
      { at: 23, caption: '资源仍在缓存中，几乎整段网络过程都省下。' },
    ],
  },
  jpeg: {
    duration: 30,
    chapters: [
      { at: 0, caption: '一块图像，可以拆成不同方向的明暗起伏。' },
      { at: 7, caption: '只保留整体亮度，图像变成一片灰。' },
      { at: 12, caption: '先加低频：大轮廓回来了。' },
      { at: 20, caption: '再加高频：边缘与细节逐渐恢复。' },
      { at: 26, caption: '量化越粗，丢掉的信息越多。' },
    ],
  },
  transformer: {
    duration: 38,
    chapters: [
      { at: 0, caption: '训练前，模型还不知道“猫爱吃”后面是什么。' },
      { at: 6, caption: '对照答案算误差，再用梯度更新权重。' },
      { at: 18, caption: '继续训练，正确答案的概率逐渐上升。' },
      { at: 28, caption: '现在生成：每次选一个字，再放回上下文。' },
      { at: 34, caption: '生成只使用学到的权重，不再更新它们。' },
    ],
  },
  dimensions: {
    duration: 32,
    chapters: [
      { at: 0, caption: '线段沿新方向移动，扫出一个正方形。' },
      { at: 7, caption: '正方形沿第三个方向移动，扫出立方体。' },
      { at: 14, caption: '再多一个独立方向，得到四维超立方体。' },
      { at: 24, caption: '我们看到的是它的三维投影，转动时形状会改变。' },
    ],
  },
  elevator: {
    duration: 42,
    chapters: [
      { at: 0, caption: '同一批乘客，先按到达顺序安排任务。' },
      { at: 14, caption: '原样重播客流，这次优先响应最近任务。' },
      { at: 28, caption: '再试顺路停靠，比较所有乘客的等待时间。' },
      { at: 39, caption: '同样的输入，才能公平比较不同策略。' },
    ],
  },
  traffic: {
    duration: 34,
    chapters: [
      { at: 0, caption: '环路没有路口，车辆原本匀速前进。' },
      { at: 6, caption: '金色车辆轻踩刹车，后车跟着减速。' },
      { at: 14, caption: '车向前走，减速波却向后传播。' },
      { at: 25, caption: '时空图里的斜纹，留下拥堵传播的轨迹。' },
    ],
  },
};
