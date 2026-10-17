type Bilingual = { zh: string; en: string };
export type LearningPath = {
  id: string;
  title: Bilingual;
  before: Bilingual;
  keywords: Bilingual;
  steps: { slug: string; why: Bilingual }[];
};

/** Editorial sequences connect ideas across the stable subject categories.
 * Each step says what it adds; this is a suggested route, not a prerequisite gate.
 */
export const learningPaths: LearningPath[] = [
  {
    id: 'making-a-photo',
    title: { zh: '一张照片怎样产生', en: 'How a photograph takes shape' },
    before: {
      zh: '先知道：光会传播，照片由像素组成。',
      en: 'Start with: light travels, and a photo contains pixels.',
    },
    keywords: { zh: '相机 摄影 照片 图像 成像', en: 'camera photography photograph image imaging' },
    steps: [
      {
        slug: 'camera-lens',
        why: {
          zh: '从同一物点出发，看光在哪里会合。',
          en: 'Follow light from one object point to its image.',
        },
      },
      {
        slug: 'aperture',
        why: {
          zh: '保留成像关系，只改变进光口与清晰范围。',
          en: 'Keep the image geometry; change the opening and depth of field.',
        },
      },
      {
        slug: 'bayer-sensor',
        why: {
          zh: '光到达之后，像素先测一种颜色，再估计其余通道。',
          en: 'At the sensor, each pixel measures one colour and estimates the rest.',
        },
      },
      {
        slug: 'rolling-shutter',
        why: {
          zh: '再问时间：同一张照片的各行何时曝光？',
          en: 'Add time: when does each row of that photograph expose?',
        },
      },
      {
        slug: 'jpeg',
        why: {
          zh: '最后把像素变成频率系数，观察压缩的取舍。',
          en: 'Turn the pixels into frequency coefficients and inspect the compression trade-off.',
        },
      },
    ],
  },
  {
    id: 'reading-waves',
    title: { zh: '同一条波形的不同看法', en: 'Different views of a waveform' },
    before: {
      zh: '先知道：周期、振幅与频率的含义。',
      en: 'Start with: period, amplitude and frequency.',
    },
    keywords: { zh: '声音 声波 波形 频率 振动', en: 'sound wave waveform frequency vibration' },
    steps: [
      {
        slug: 'wave-interference',
        why: {
          zh: '先跟住一个物质点，看两列波怎样相加。',
          en: 'Track one material point as two waves add.',
        },
      },
      {
        slug: 'beats',
        why: {
          zh: '把频率稍微错开，观察缓慢的强弱起伏。',
          en: 'Separate the frequencies slightly to reveal a slow beat.',
        },
      },
      {
        slug: 'standing-wave',
        why: {
          zh: '让两列波反向传播，找出不动的节点。',
          en: 'Reverse one travelling wave and locate the stationary nodes.',
        },
      },
      {
        slug: 'sampling-aliasing',
        why: {
          zh: '只留下固定时刻的样本，看看会丢失什么区别。',
          en: 'Keep only regularly spaced samples and see which distinctions disappear.',
        },
      },
      {
        slug: 'fourier-transform',
        why: {
          zh: '再用频率与相位，重建同一份有限记录。',
          en: 'Reconstruct that finite record using frequencies and phases.',
        },
      },
    ],
  },
  {
    id: 'a-network-journey',
    title: { zh: '一个网页怎样到达手机', en: 'How a webpage reaches your phone' },
    before: {
      zh: '先知道：网络中有发送方、接收方与中间节点。',
      en: 'Start with: a network has senders, receivers and intermediate nodes.',
    },
    keywords: {
      zh: '手机 网络 通信 上网 数据包',
      en: 'phone internet network communication packet',
    },
    steps: [
      {
        slug: 'network',
        why: {
          zh: '先看地址查询、连接与请求的完整旅程。',
          en: 'Begin with the whole journey: lookup, connection and request.',
        },
      },
      {
        slug: 'packet-routing',
        why: {
          zh: '放大中间一步，看路由表怎样决定下一跳。',
          en: 'Zoom into the middle: a routing table chooses the next hop.',
        },
      },
      {
        slug: 'tcp-reliability',
        why: {
          zh: '允许丢失和乱序，仍按字节序号恢复内容。',
          en: 'Allow loss and reordering, then recover the stream by byte number.',
        },
      },
      {
        slug: 'congestion-control',
        why: {
          zh: '最后让发送者根据确认和丢失调整发送节奏。',
          en: 'Let acknowledgements and losses adjust the sending rate.',
        },
      },
    ],
  },
  {
    id: 'converting-electricity',
    title: { zh: '电能怎样被转换和送达', en: 'Converting and delivering electrical energy' },
    before: {
      zh: '先知道：电压、电流与储存能量的区别。',
      en: 'Start with: voltage, current and stored energy are different quantities.',
    },
    keywords: {
      zh: '电能 电力 电源 能量转换',
      en: 'electrical energy electric power power supply energy conversion',
    },
    steps: [
      {
        slug: 'electric-generator',
        why: {
          zh: '从轴的机械功开始，观察感应电压与反扭矩。',
          en: 'Start with shaft work, induced voltage and opposing torque.',
        },
      },
      {
        slug: 'transformer-electric',
        why: {
          zh: '沿共享磁通，比较两侧电压与电流。',
          en: 'Follow shared magnetic flux to compare voltage and current on both sides.',
        },
      },
      {
        slug: 'rectifier',
        why: {
          zh: '用二极管选择方向，再观察电容何时补充电荷。',
          en: 'Use diodes to choose a direction and see when the capacitor recharges.',
        },
      },
      {
        slug: 'buck-converter',
        why: {
          zh: '通过开关、电感与电容，把直流调到较低电压。',
          en: 'Use switching, an inductor and a capacitor to supply a lower DC voltage.',
        },
      },
    ],
  },
];

export function learningKeywords(slug: string) {
  return learningPaths
    .filter((path) => path.steps.some((step) => step.slug === slug))
    .flatMap((path) => [path.title.zh, path.title.en, path.keywords.zh, path.keywords.en]);
}

export function nextLearningStep(from: string, to: string) {
  for (const path of learningPaths) {
    const at = path.steps.findIndex((step) => step.slug === from);
    if (at >= 0 && path.steps[at + 1]?.slug === to)
      return { path: path.title, why: path.steps[at + 1].why };
  }
  return null;
}
