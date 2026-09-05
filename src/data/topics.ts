export type Topic = {
  slug: string;
  name: string;
  title: string;
  question: string;
  description: string;
  category: string;
  duration: string;
  color: string;
  number: string;
  tag: string;
  related: string[];
  sources: { title: string; url: string }[];
};
export const topics: Topic[] = [
  {
    slug: 'binary-adder',
    name: '二进制加法',
    title: '只靠零和一，计算机怎样做加法？',
    question: '一位相加，一路进位。',
    description: '拆开一位加法的逻辑，再追踪进位穿过整串数字，区分位宽、进位与溢出。',
    category: '数字世界',
    duration: '3 分钟',
    color: '#a98662',
    number: '18',
    tag: '计算 · 逻辑门与进位',
    related: ['transformer', 'network'],
    sources: [
      {
        title: 'MIT 6.004 · Design Tradeoffs',
        url: 'https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c8/c8s1/',
      },
      {
        title: 'Computation Structures · CMOS Adder',
        url: 'https://computationstructures.org/exercises/adder/lab.html',
      },
      { title: 'Nand2Tetris · Boolean Arithmetic', url: 'https://www.nand2tetris.org/project02' },
    ],
  },
  {
    slug: 'optical-fiber',
    name: '光纤',
    title: '玻璃里，光为什么跑不出去？',
    question: '一束光，一条信息的路。',
    description: '跟随光线跨越边界、改变入射方向，再观察脉冲如何携带信息与逐渐展宽。',
    category: '空间与波动',
    duration: '3 分钟',
    color: '#849dbe',
    number: '17',
    tag: '光通信 · 全反射与脉冲',
    related: ['camera-lens', 'network'],
    sources: [
      {
        title: 'OpenStax · Total Internal Reflection',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/1-4-total-internal-reflection',
      },
      {
        title: 'Corning · Optical Fiber Glossary',
        url: 'https://www.corning.com/optical-communications/worldwide/en/home/products/fiber/optical-fiber-resource-center/glossary-of-terms.html',
      },
      {
        title: 'MIT 2.710 · Fresnel Coefficients',
        url: 'https://web.mit.edu/2.710/Fall06/2.710-wk7-b-sl.pdf',
      },
    ],
  },
  {
    slug: 'planetary-gears',
    name: '行星齿轮',
    title: '同一组齿轮，怎样换出不同速度？',
    question: '固定谁，结果就不同。',
    description: '沿着同一颗行星轮，区分自转与公转，观察固定部件如何改变速度、方向与理想转矩。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#6d98a4',
    number: '16',
    tag: '传动 · 自转与公转',
    related: ['bicycle', 'four-stroke-engine'],
    sources: [
      {
        title: 'KHK · Gear Systems',
        url: 'https://khkchilun.com/gearknowledge/gear_technical_reference/gear_systems.html',
      },
      {
        title: 'KHK · Calculation of Gear Dimensions',
        url: 'https://khkchilun.com/gearknowledge/gear_technical_reference/calculation_gear_dimensions.html',
      },
    ],
  },
  {
    slug: 'four-stroke-engine',
    name: '四冲程发动机',
    title: '一次燃烧，怎样变成转动？',
    question: '四个行程，一次做功。',
    description: '剖开一个气缸，跟住气门、活塞、连杆和曲轴，把压力变化与转动接起来。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#9a956e',
    number: '15',
    tag: '机械 · 热与功',
    related: ['bicycle', 'refrigerator'],
    sources: [
      {
        title: 'NASA Glenn · Internal Combustion Engine Stages',
        url: 'https://www.grc.nasa.gov/www/k-12/airplane/engstage.html',
      },
      {
        title: 'NASA Glenn · Engine Thermodynamic Analysis',
        url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/engine-thermodynamic-analysis/',
      },
    ],
  },
  {
    slug: 'camera-lens',
    name: '镜头成像',
    title: '一束光，怎样成为一幅像？',
    question: '清楚，发生在光线相遇的地方。',
    description: '移动光学台上的物体与成像屏，追踪合焦、倒像和虚像的形成。',
    category: '空间与波动',
    duration: '3 分钟',
    color: '#8d9d79',
    number: '13',
    tag: '光路 · 对焦与成像',
    related: ['aperture', 'printer'],
    sources: [
      {
        title: 'OpenStax · University Physics 3: Thin Lenses',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/2-4-thin-lenses',
      },
      {
        title: 'OpenStax · Image Formation by Lenses',
        url: 'https://openstax.org/books/college-physics-2e/pages/25-6-image-formation-by-lenses',
      },
    ],
  },
  {
    slug: 'aperture',
    name: '光圈与景深',
    title: '背景虚化，究竟发生在哪里？',
    question: '同一朵花，两种清晰的选择。',
    description: '从一张花与灯光的画面出发，看见光圈、景深、曝光与衍射之间的关系。',
    category: '空间与波动',
    duration: '3 分钟',
    color: '#9a9863',
    number: '14',
    tag: '摄影 · 清晰范围',
    related: ['camera-lens', 'jpeg'],
    sources: [
      {
        title: 'Edmund Optics · System Throughput, f/#, and Numerical Aperture',
        url: 'https://www.edmundoptics.com/knowledge-center/application-notes/imaging/lens-iris-aperture-setting/',
      },
      {
        title: 'Edmund Optics · Gauging Depth of Field',
        url: 'https://www.edmundoptics.com/knowledge-center/application-notes/testing-and-detection/gauging-depth-of-field-in-your-imaging-system/',
      },
      {
        title: 'Nikon · What is Aperture?',
        url: 'https://www.nikonusa.com/learn-and-explore/c/tips-and-techniques/what-is-aperture',
      },
    ],
  },
  {
    slug: 'bicycle',
    name: '自行车变速',
    title: '换一个齿轮，为什么就省力了？',
    question: '小齿轮，大不同。',
    description: '沿着踏板、链条和后轮，看看力如何换一种方式传递。',
    category: '生活器物',
    duration: '6 分钟',
    color: '#e47c37',
    number: '01',
    tag: '转动 · 传动比',
    related: ['pendulum', 'traffic'],
    sources: [
      { title: 'Bartosz Ciechanowski · Bicycle', url: 'https://ciechanow.ski/bicycle/' },
      {
        title: 'Renold · Tooth Chain Drives',
        url: 'https://www.renoldtoothchain.com/media/677689/Drive_Tooth_Chain_EN_0405.pdf',
      },
    ],
  },
  {
    slug: 'refrigerator',
    name: '冰箱制冷',
    title: '冰箱里的热，都去了哪里？',
    question: '冷，是热的搬家。',
    description: '打开冰箱背后的管路，跟随制冷剂完成一次循环。',
    category: '生活器物',
    duration: '6 分钟',
    color: '#1c9bb0',
    number: '02',
    tag: '剖开 · 热力循环',
    related: ['printer', 'pendulum'],
    sources: [
      {
        title: 'Danfoss · How does a refrigerator work?',
        url: 'https://www.danfoss.com/en-in/about-danfoss/our-businesses/cooling/the-fridge-how-it-works/',
      },
    ],
  },
  {
    slug: 'printer',
    name: '激光打印机',
    title: '一束光，怎样变成纸上的字？',
    question: '跟着一个像素去旅行。',
    description: '从看不见的电荷，到摸得到的碳粉，拆开每一步。',
    category: '生活器物',
    duration: '7 分钟',
    color: '#7559dc',
    number: '03',
    tag: '追踪 · 静电成像',
    related: ['jpeg', 'refrigerator'],
    sources: [
      {
        title: 'Canon · Laser Printers and MFPs',
        url: 'https://global.canon/en/technology/canon-tech/tech/laser-printer/',
      },
      {
        title: 'KHK · Calculation of Gear Dimensions',
        url: 'https://khkgears.net/gear-knowledge/gear-technical-reference/calculation-gear-dimensions/',
      },
    ],
  },
  {
    slug: 'noise',
    name: '主动降噪',
    title: '加上一段声音，反而更安静？',
    question: '声音，还能抵消声音。',
    description: '亲手对齐两道声波，听见「加法」如何带来安静。',
    category: '空间与波动',
    duration: '5 分钟',
    color: '#138a77',
    number: '04',
    tag: '试听 · 波的叠加',
    related: ['jpeg', 'gps'],
    sources: [
      {
        title: 'Sony · What is noise canceling?',
        url: 'https://helpguide.sony.net/dmp/nwa20/v1/en/contents/TP0000999706.html',
      },
      {
        title: 'Sony · What can I expect from noise cancellation?',
        url: 'https://www.sony.com/electronics/support/articles/00203389',
      },
    ],
  },
  {
    slug: 'gps',
    name: 'GPS 定位',
    title: '天上的卫星，怎么找到你？',
    question: '蓝点的位置，是算出来的。',
    description: '让几段距离相遇，再看看时间出一点错会怎样。',
    category: '空间与波动',
    duration: '7 分钟',
    color: '#387bdd',
    number: '05',
    tag: '定位 · 距离与时间',
    related: ['dimensions', 'network'],
    sources: [
      { title: 'NASA · How does GPS work?', url: 'https://spaceplace.nasa.gov/gps/en/index.html' },
      { title: 'GPS.gov · GPS and telling time', url: 'https://www.gps.gov/gps-and-telling-time' },
    ],
  },
  {
    slug: 'network',
    name: '网页加载',
    title: '按下回车之后，发生了什么？',
    question: '一次点击，一场接力。',
    description: '从寻找地址到画出页面，把毫秒间的旅程慢放。',
    category: '数字世界',
    duration: '6 分钟',
    color: '#2a69ce',
    number: '06',
    tag: '慢放 · 请求的旅程',
    related: ['jpeg', 'transformer'],
    sources: [
      {
        title: 'MDN · How browsers work',
        url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work',
      },
      { title: 'RFC 9113 · HTTP/2', url: 'https://www.rfc-editor.org/rfc/rfc9113' },
    ],
  },
  {
    slug: 'jpeg',
    name: 'JPEG 压缩',
    title: '照片变小了，什么被留下？',
    question: '看看像素背后的频率。',
    description: '放大一小块图像，在细节和压缩之间亲手做取舍。',
    category: '数字世界',
    duration: '8 分钟',
    color: '#cd667b',
    number: '07',
    tag: '拆解 · 图像与频率',
    related: ['noise', 'printer'],
    sources: [
      {
        title: 'ITU T.81 · Digital compression and coding of continuous-tone still images',
        url: 'https://www.w3.org/Graphics/JPEG/itu-t81.pdf',
      },
    ],
  },
  {
    slug: 'transformer',
    name: '大模型训练与生成',
    title: '下一个字，是怎样学会的？',
    question: '走进一次预测的内部。',
    description: '从词元到注意力，从一次错误到一次权重更新。',
    category: '数字世界',
    duration: '8 分钟',
    color: '#8563dc',
    number: '08',
    tag: '训练 · 注意力机制',
    related: ['dimensions', 'network'],
    sources: [
      {
        title: 'Vaswani et al. · Attention Is All You Need',
        url: 'https://arxiv.org/abs/1706.03762',
      },
      { title: 'Andrej Karpathy · micrograd', url: 'https://github.com/karpathy/micrograd' },
    ],
  },
  {
    slug: 'dimensions',
    name: '多维空间',
    title: '多一个维度，多了什么？',
    question: '换个角度，看见更多。',
    description: '从一条线到一个超立方体，在切片与投影间建立直觉。',
    category: '空间与波动',
    duration: '7 分钟',
    color: '#8963d1',
    number: '09',
    tag: '旋转 · 切片与投影',
    related: ['gps', 'transformer'],
    sources: [
      { title: 'MathWorld · Tesseract', url: 'https://mathworld.wolfram.com/Tesseract.html' },
    ],
  },
  {
    slug: 'pendulum',
    name: '钟摆',
    title: '一来一回，时间藏在哪里？',
    question: '拉起，松手，看能量流动。',
    description: '改变摆长和重力，找出让钟摆快一点、慢一点的秘密。',
    category: '运动与系统',
    duration: '5 分钟',
    color: '#d89837',
    number: '10',
    tag: '释放 · 能量与周期',
    related: ['bicycle', 'noise'],
    sources: [
      {
        title: 'OpenStax · University Physics: Pendulums',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/15-4-pendulums',
      },
    ],
  },
  {
    slug: 'elevator',
    name: '电梯调度',
    title: '明明有电梯，为什么还要等？',
    question: '每个人的顺路，不太一样。',
    description: '当一次楼宇调度员，让相同的乘客试试不同策略。',
    category: '运动与系统',
    duration: '7 分钟',
    color: '#438975',
    number: '11',
    tag: '调度 · 等待与效率',
    related: ['traffic', 'network'],
    sources: [
      {
        title: 'KONE · Destination control',
        url: 'https://support.kone.com/office-flow/introduction/how-kone-office-flow-works.aspx',
      },
    ],
  },
  {
    slug: 'traffic',
    name: '无事故堵车',
    title: '没出事故，为什么也堵车？',
    question: '一脚刹车，堵住整条路。',
    description: '在一条环形公路上，看看小小扰动如何变成拥堵。',
    category: '运动与系统',
    duration: '6 分钟',
    color: '#dc754a',
    number: '12',
    tag: '扰动 · 系统涌现',
    related: ['elevator', 'pendulum'],
    sources: [
      {
        title: 'Martin Treiber · Intelligent Driver Model',
        url: 'https://traffic-simulation.de/info/info_IDM.html',
      },
    ],
  },
];
export const categories = ['生活器物', '数字世界', '空间与波动', '运动与系统'];
export const getTopic = (slug: string) => topics.find((t) => t.slug === slug)!;
