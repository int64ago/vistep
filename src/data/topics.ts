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
    slug: 'excavator',
    name: '挖掘机',
    title: '一股油，怎样举起一斗土？',
    question: '一股油，怎样举起一斗土？',
    description:
      '跟随液压油进入油缸，再沿动臂、斗杆和铲斗连杆，看压力、流量与力矩怎样共同决定动作。',
    category: '器物与机械',
    duration: '4 分钟',
    color: '#c39a4c',
    number: '63',
    tag: '力与运动',
    related: ['hydraulic-brake', 'suspension', 'bicycle'],
    sources: [
      {
        title:
          'Komatsu — PC200/PC200LC-8 hydraulic excavator brochure AESS688-01: cylinder bores, relief setting, pump flow',
        url: 'https://panafricangroup.com/pdf/PC200_200LC-8_.pdf',
      },
      {
        title:
          'Bosch Rexroth — Hydraulics Basic Principles: load-dependent pressure and pressure relief',
        url: 'https://dc-mkt-prod.cloud.bosch.tech/xrm/media/global/training_1/digital_media/reference_books/knowledge-in-detail-hydraulics-basic-principles.pdf',
      },
      {
        title:
          'Parker — Mobile Cylinder Products, HY18-1000: cylinder force, speed and effective areas',
        url: 'https://www.parker.com/content/dam/Parker-com/Literature/Industrial-Cylinder/cylinder/cat/english/Parker_Mobile_Cylinder_Products_Catalog_HY18-1000.pdf',
      },
      {
        title: 'Caterpillar — CA2175409C, Excavator bucket linkage (H-link four-bar)',
        url: 'https://patents.google.com/patent/CA2175409C/en',
      },
      {
        title:
          'Bosch Rexroth — Check and metering valves for boom holding and hose-burst protection (ISO 8643)',
        url: 'https://apps.boschrexroth.com/products/compact-hydraulics/CH-Catalog/pdf/Check_and_metering.pdf',
      },
    ],
  },
  {
    slug: 'tides',
    name: '潮汐',
    title: '远侧的海水，为什么也会鼓起？',
    question: '月球只在一边，为什么海面会在两边升高？',
    description: '在地球自由落体的参照系里，逐点相减引力，再从同一潮汐势构造平衡海面。',
    category: '空间与波动',
    duration: '3 分钟',
    color: '#83b6b2',
    tag: '引力 · 平衡海洋',
    related: ['moon-phases', 'seasons', 'bernoulli'],
    sources: [
      {
        title: 'NOAA NESDIS — What Causes Tides? Differential Gravity',
        url: 'https://www.nesdis.noaa.gov/about/k-12-education/oceans-coasts/what-causes-tides',
      },
      {
        title: 'NOAA — What Are Spring and Neap Tides?',
        url: 'https://oceanservice.noaa.gov/facts/springtide.html',
      },
      {
        title: 'NOAA — Are Tides Higher When the Moon Is Directly Overhead?',
        url: 'https://oceanservice.noaa.gov/facts/moon-tide.html',
      },
      {
        title: 'Utrecht University, H. E. de Swart — Ocean Waves, Chapter 9: Tides',
        url: 'https://webspace.science.uu.nl/~swart104/owaves_docs/owaves15_lnotes.pdf',
      },
      {
        title: 'NASA JPL — Astrodynamic Parameters, DE440',
        url: 'https://ssd.jpl.nasa.gov/astro_par.html',
      },
    ],
    number: '62',
  },
  {
    slug: 'zipper',
    name: '拉链',
    title: '拉链怎样一拉就合上？',
    question: '横着拉不开的齿，为什么拉头能轻轻分开？',
    description:
      '剖开一副注塑蘑菇头拉链，跟随一颗齿穿过 Y 形导道，看错位、齿窝与宽肩怎样连接两条织带。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#54817c',
    tag: '齿形与导道',
    related: ['sewing-machine', 'lock', 'escapement'],
    sources: [
      {
        title: 'YKK — The Craftsmanship of YKK, Vol. 1: zipper structure and Y-shaped tunnel',
        url: 'https://www.ykk.com/english/ykk/tech/01.html',
      },
      {
        title: 'YKK — Zipper Usage Instruction Manual: closed-end components',
        url: 'https://ykkamericas.com/wp-content/uploads/2021/10/ykk-zipper-instruction-manual-compressed.pdf',
      },
      {
        title:
          'US3886634 — Zip-fastener, New Japan Slide Fastener Manufacturing Co. (1975), head grooves and neck wings',
        url: 'https://www.freepatentsonline.com/3886634.html',
      },
      {
        title: 'YKK — Asia Slider Catalogue: slider body, diamond, flanges and non-lock sliders',
        url: 'https://ykk.pl/wp-content/uploads/2021/02/asia-slider-catalog.pdf',
      },
    ],
    number: '61',
  },
  {
    slug: 'packet-routing',
    name: '网络分组路由',
    title: '分组怎样穿过不断变化的网络？',
    question: '一份本地路由表，怎样决定分组的下一步？',
    description: '跟随同一批分组，观察最短路径、排队、TTL、故障收敛与接收重排。',
    category: '数字世界',
    duration: '3 分钟',
    color: '#79b7ad',
    tag: '网络 · 路由与队列',
    related: ['network', 'memory-cache', 'cpu-pipeline'],
    sources: [
      {
        title: 'RFC 2328: OSPF Version 2 — flooding and shortest-path calculation',
        url: 'https://www.rfc-editor.org/rfc/rfc2328.html',
      },
      {
        title: 'RFC 1812: Requirements for IP Version 4 Routers — forwarding and TTL',
        url: 'https://www.rfc-editor.org/rfc/rfc1812.html',
      },
      {
        title: 'RFC 791: Internet Protocol — service scope',
        url: 'https://www.rfc-editor.org/rfc/rfc791.html',
      },
    ],
    number: '60',
  },
  {
    slug: 'diffusion',
    name: '扩散',
    title: '没有水流，颜色为什么还会散开？',
    question: '一条静止介质中的浓度带，怎样把物质从集中变成均匀？',
    description: '从浓度曲线计算净通量、局部收支和扩散宽度，比较扩散系数、长度与边界。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#6eafd0',
    tag: '浓度与通量',
    related: ['convection', 'bernoulli'],
    sources: [
      {
        title: 'MIT — Conceptual Model for Diffusion',
        url: 'https://web.mit.edu/1.061/www/diffuse/theory.htm',
      },
      {
        title: 'MIT 3.21 — Finite-body diffusion, instructor solution (2006)',
        url: 'https://ocw.mit.edu/courses/3-21-kinetic-processes-in-materials-spring-2006/633e72338764b7247cf43e481d546e2a_exam1_sol.pdf',
      },
      {
        title: 'MIT 3.185 — Fourier-series diffusion and boundary conditions (2003)',
        url: 'https://ocw.mit.edu/courses/3-185-transport-phenomena-in-materials-engineering-fall-2003/d9abff527d0533d61bfc5a2987c531ce_recitation3.pdf',
      },
    ],
    number: '59',
  },
  {
    slug: 'brownian-motion',
    name: '布朗运动',
    title: '没有水流，粒子为什么还在走？',
    question: '随机的单条轨迹，怎样留下稳定的统计规律？',
    description:
      '跟随一颗微球，从热浴冲量与惯性记忆走到 Stokes–Einstein 关系，分清单条轨迹、均方位移与平均位置。',
    category: '空间与系统',
    duration: '3 分钟',
    color: '#b18a50',
    tag: '热涨落 · 单粒子与统计',
    related: ['diffusion', 'convection', 'lithium-battery'],
    sources: [
      {
        title: 'NIST — SI defining constants, Boltzmann constant',
        url: 'https://www.nist.gov/pml/special-publication-330/sp-330-section-2',
      },
      {
        title: 'University of Padova / INFN — Langevin equation lecture notes',
        url: 'https://userswww.pd.infn.it/~orlandin/fisica_sis_comp/langevin.pdf',
      },
      {
        title:
          'Li et al., Science (2010) — Measurement of the instantaneous velocity of a Brownian particle',
        url: 'https://pubmed.ncbi.nlm.nih.gov/20488989/',
      },
      {
        title: 'Li and Raizen — Brownian motion at short time scales',
        url: 'https://arxiv.org/abs/1211.1458',
      },
      {
        title: 'Florin — Ballistic Brownian motion and hydrodynamic memory in liquids',
        url: 'https://meetings-archive.aps.org/mar/2012/t48/7/',
      },
    ],
    number: '58',
  },
  {
    slug: 'database-index',
    name: '数据库索引',
    title: '不用翻遍整张表，数据库怎样找到一行？',
    question: '跟着页号与分隔键，找回同一条记录。',
    description:
      '走进真实计算的微型 B+ 树：全扫与索引公平对照，范围查询串起叶页，插入分裂一路传播到新根。',
    category: '数字世界',
    duration: '3 分钟',
    color: '#33657a',
    tag: '数据 · 页与记录',
    related: ['memory-cache', 'hash', 'cpu-pipeline'],
    sources: [
      {
        title: 'CMU 15-445 · Lecture 08: Indexes & Filters I',
        url: 'https://15445.courses.cs.cmu.edu/fall2024/notes/08-indexes1.pdf',
      },
      {
        title: 'PostgreSQL 18 · B-Tree Indexes',
        url: 'https://www.postgresql.org/docs/18/btree.html',
      },
      {
        title: 'PostgreSQL 18 · Index-Only Scans and Covering Indexes',
        url: 'https://www.postgresql.org/docs/18/indexes-index-only-scans.html',
      },
    ],
    number: '57',
  },
  {
    slug: 'escapement',
    name: '机械钟擒纵',
    title: '擒纵怎样让钟走得有节拍？',
    question: '钟摆一直在摆，为什么齿轮只走一小步？',
    description: '跟随格雷厄姆静止式擒纵的一枚齿尖，看锁定、冲量与放行怎样把持续供能分成节拍。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#9a7950',
    tag: '锁定与放行',
    related: ['pendulum', 'sewing-machine', 'differential'],
    sources: [
      {
        title: 'Princeton TimeTeam — Graham escapement project',
        url: 'https://www.princeton.edu/~timeteam/graham.html',
      },
      {
        title:
          'Laurie Penman, Clockmaking Elements Part 6 — Horological Times, July 2010, pp. 14–18',
        url: 'https://www.awci.com/wp-content/uploads/ht/July2010.pdf',
      },
      {
        title: 'OpenStax University Physics 15.4 — Pendulums',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/15-4-pendulums',
      },
      {
        title: 'OpenStax University Physics 15.5 — Damped Oscillations',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/15-5-damped-oscillations',
      },
    ],
    number: '56',
  },
  {
    slug: 'lithium-battery',
    name: '锂离子电池',
    title: '电池充电时，究竟存进了什么？',
    question: '锂离子和电子为什么要分开走？',
    description: '跟随石墨与磷酸铁锂之间的锂和外部电荷，看清充放电、压降、发热与休息回升。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#789a88',
    tag: '可逆储能 · 电化学',
    related: ['induction-cooktop', 'speaker', 'transformer-electric'],
    sources: [
      {
        title: 'DOE — Batteries and separated ionic/electronic paths',
        url: 'https://www.energy.gov/science/doe-explainsbatteries',
      },
      {
        title: 'DOE — Critical Materials Assessment, lithium-ion cell components',
        url: 'https://www.energy.gov/sites/default/files/2023-07/doe-critical-material-assessment_07312023.pdf',
      },
      {
        title: 'Sandia — Lithium insertion in LFP particles',
        url: 'https://newsreleases.sandia.gov/popcorn_batteries/',
      },
      {
        title: 'Nature Communications — LFP insertion reaction and charge balance',
        url: 'https://www.nature.com/articles/ncomms2705',
      },
      {
        title: 'MathWorks — Passive battery equivalent circuit and polarization dynamics',
        url: 'https://www.mathworks.com/help/simscape-battery/ref/batteryequivalentcircuit.html',
      },
      {
        title: 'DOE — Copper and aluminum current collectors, porous separator',
        url: 'https://www.energy.gov/eere/vehicles/articles/propulsion-materials-rd-2010-annual-progress-report',
      },
    ],
    number: '55',
  },
  {
    slug: 'logic-gates',
    name: '逻辑门',
    title: '逻辑门：电压如何变成零和一',
    question: '晶体管怎样把输入变成逻辑，为什么还需要时间？',
    description: '沿 CMOS 的上拉与下拉通路，观察电容电压、传播延迟和翻转能量。',
    category: '数字世界',
    duration: '3 分钟',
    color: '#4c8795',
    tag: '晶体管与电荷',
    related: ['binary-adder', 'cpu-pipeline', 'buck-converter'],
    sources: [
      {
        title: 'MIT 6.004: CMOS Technology — Annotated Slides',
        url: 'https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c3/c3s1/',
      },
      {
        title: 'Texas Instruments: CMOS Power Consumption and CPD Calculation',
        url: 'https://www.ti.com/lit/an/scaa035b/scaa035b.pdf',
      },
    ],
    number: '54',
  },
  {
    slug: 'public-key',
    name: '公钥密码',
    title: '公钥可以公开，消息怎样只让收件人解开？',
    question: '把 42 送出去，再用另一种指数带回来。',
    description:
      '用刻意不安全的小整数走完 RSA：造钥匙、求逆元、平方乘法、加密与解密，并亲眼看见教具的安全边界。',
    category: '数字世界',
    duration: '3 分钟',
    color: '#944e50',
    tag: '信息 · 公钥与私钥',
    related: ['hash', 'network', 'error-correction'],
    sources: [
      {
        title: 'RFC 8017 · PKCS #1 v2.2',
        url: 'https://www.rfc-editor.org/rfc/rfc8017.html',
      },
      {
        title:
          'Rivest, Shamir & Adleman · A Method for Obtaining Digital Signatures and Public-Key Cryptosystems',
        url: 'https://people.csail.mit.edu/rivest/Rsapaper.pdf',
      },
      {
        title: 'NIST SP 800-56B Rev. 2 · RSA key establishment',
        url: 'https://csrc.nist.gov/pubs/sp/800/56/b/r2/final',
      },
    ],
    number: '53',
  },
  {
    slug: 'solar-cell',
    name: '太阳能电池',
    title: '阳光怎样走完一条电路？',
    question: '一束光照上硅片，为什么能让外面的电流流动？',
    description:
      '跟住一个被吸收的光子，穿过结区与闭合回路，再用实际求解的 I–V 曲线核算输出与损失。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#8c9b72',
    tag: '光伏 · 电荷与能量',
    related: ['electric-generator', 'seasons', 'rainbow'],
    sources: [
      {
        title: 'U.S. DOE — Solar Photovoltaic Cell Basics',
        url: 'https://www.energy.gov/cmei/systems/solar-photovoltaic-cell-basics',
      },
      {
        title: 'U.S. DOE — Solar Photovoltaic Performance and Efficiency Basics',
        url: 'https://www.energy.gov/cmei/systems/solar-photovoltaic-performance-and-efficiency-basics',
      },
      {
        title: 'Sandia / NIST PVPMC — Single Diode Equivalent Circuit Models',
        url: 'https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/single-diode-equivalent-circuit-models/',
      },
      {
        title: 'Sandia / NIST PVPMC — De Soto Five-Parameter Model',
        url: 'https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/single-diode-equivalent-circuit-models/de-soto-five-parameter-module-model/',
      },
      {
        title: 'pvlib — Calculating a Module’s IV Curves, CS5P-220M Reference Example',
        url: 'https://pvlib-python.readthedocs.io/en/stable/gallery/iv-modeling/plot_singlediode.html',
      },
    ],
    number: '52',
  },
  {
    slug: 'convection',
    name: '热对流',
    title: '热，怎样开始自己流动？',
    question: '为什么从下面加热会形成循环，从上面加热却不一样？',
    description: '在封闭格子里计算温度、浮力与流动，追踪热量怎样被携带。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#ad8455',
    tag: '温度与浮力',
    related: ['bernoulli', 'siphon', 'water-hammer'],
    sources: [
      {
        title: 'University College Dublin — Rayleigh–Bénard convection lecture notes',
        url: 'https://maths.ucd.ie/~onaraigh/acm40740/acm_40890_jan2018_v2.pdf',
      },
      {
        title: 'Dedalus — Rayleigh–Bénard convection (2D IVP)',
        url: 'https://dedalus-project.readthedocs.io/en/latest/pages/examples/ivp_2d_rayleigh_benard.html',
      },
      {
        title: 'Bridson and Müller-Fischer — Fluid Simulation course notes',
        url: 'https://www.cs.ubc.ca/~rbridson/fluidsimulation/fluids_notes.pdf',
      },
    ],
    number: '51',
  },
  {
    slug: 'rectifier',
    name: '整流器',
    title: '交流换向，负载为什么不换向？',
    question: '四只二极管怎样选路，电容又何时得到电流？',
    description:
      '沿单相桥式整流的两个导通回路，观察电容充放电、纹波、负载与频率，以及源电阻限制的浪涌。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#467f91',
    tag: '电力电子 · 单向导通与储能',
    related: ['buck-converter', 'transformer-electric', 'electric-generator'],
    sources: [
      {
        title: 'Analog Devices StudentZone — ADALM2000 Diodes and Diode Circuits',
        url: 'https://www.analog.com/en/resources/analog-dialogue/studentzone/studentzone-august-2019.html',
      },
      {
        title: 'MIT 6.117 — Lecture 3: Power Supplies and Regulation',
        url: 'https://web.mit.edu/6.117/www/lec3.pdf',
      },
      {
        title:
          'Analog Devices — Activity: Active Rectifiers, Capacitor Filter and Source Resistance',
        url: 'https://wiki.analog.com/university/courses/alm1k/alm-active-rectifiers',
      },
    ],
    number: '50',
  },
  {
    slug: 'sewing-machine',
    name: '缝纫机',
    title: '一根针，怎样缝出两根线的交锁？',
    question: '针只会上下动，布底下的线迹是怎样留下的？',
    description: '跟随一个上线环，绕过梭心、收紧，再随织物前进。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#b88b68',
    tag: '线迹与机构时序',
    related: ['printer', 'ball-bearing', 'differential'],
    sources: [
      {
        title: 'JUKI — Basic Knowledge of Sewing: Lockstitching',
        url: 'https://www.juki.co.jp/industrial_e/service_e/elearning/detail02.php',
      },
      {
        title: 'SCHMETZ — Sewing Machine Needle Dictionary (loop stroke, eye and scarf)',
        url: 'https://www.schmetzneedles.com/pages/sewing-machine-needle-dictionary',
      },
      {
        title: 'Groz-Beckert — Loop Position Control and loop formation',
        url: 'https://www.groz-beckert.com/en/news/newsletter/sewing/2010/m2_sewing_lpc.html',
      },
      {
        title: 'JUKI — DDL-8700 instruction manual: thread route, needle/hook and feed timing',
        url: 'https://juki.com/pub/media/wysiwyg/products/DDL-8700_manual.pdf',
      },
    ],
    number: '49',
  },
  {
    slug: 'induction-cooktop',
    name: '电磁炉',
    title: '热为什么先出现在锅底？',
    question: '没有火焰，电能怎样跨过玻璃？',
    description: '沿着完整线圈回路，看交变磁通怎样在锅底建立涡流，再比较集肤、材料、间距和余热。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#ae7a43',
    tag: '电磁感应 · 热传递',
    related: ['transformer-electric', 'induction-motor', 'speaker'],
    sources: [
      {
        title: 'MIT · Electromagnetic Forces and Loss Mechanisms',
        url: 'https://www.ocw.mit.edu/courses/6-061-introduction-to-electric-power-systems-spring-2011/c26f6204e05bd4c47875a96452982b6f_MIT6_061S11_ch8.pdf',
      },
      {
        title: 'COMSOL · Eddy Currents',
        url: 'https://doc.comsol.com/6.3/doc/com.comsol.help.models.acdc.eddy_currents/eddy_currents.html',
      },
      {
        title: 'Infineon · Induction heating principles and equivalent circuit',
        url: 'https://community.infineon.com/t5/博客/感应加热原理与IGBT应用拓扑分析-上/ba-p/668476',
      },
      {
        title: 'Panasonic · All-metal induction cooking',
        url: 'https://news.panasonic.com/global/press/en201118-3',
      },
      {
        title: 'SCHOTT CERAN · Induction and residual heat',
        url: 'https://www.schott-ceran.com/en/service',
      },
    ],
    number: '48',
  },
  {
    slug: 'hash',
    name: '哈希',
    title: '只改一个位，为什么整段摘要都变了？',
    question: '跟住一个输入位，走完真正的 SHA-256。',
    description:
      '从 UTF-8、填充与消息扩展，到 64 轮压缩、链值加回和 256 位摘要，比较只差一位的两次真实计算。',
    category: '数字世界',
    duration: '3 分钟',
    color: '#738a9d',
    tag: '信息 · 摘要与完整性',
    related: ['qr-code', 'error-correction', 'network'],
    sources: [
      {
        title: 'NIST — FIPS 180-4, Secure Hash Standard',
        url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf',
      },
      {
        title: 'NIST — SHA-256 one-block and two-block intermediate examples',
        url: 'https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/documents/examples/SHA256.pdf',
      },
      {
        title: 'NIST — Secure Hashing validation and test vectors',
        url: 'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/secure-hashing',
      },
    ],
    number: '47',
  },
  {
    slug: 'buck-converter',
    name: '降压变换器',
    title: '脉冲怎样变成平稳的低电压？',
    question: '开关只会通断，为什么输出不会跟着断？',
    description: '沿两条真实导通回路，跟随电感电流、电容纹波、负载突变与不连续导通，逐份核对能量。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#287887',
    tag: '电力电子 · 开关与储能',
    related: ['transformer-electric', 'induction-motor', 'electric-generator'],
    sources: [
      {
        title:
          'Analog Devices AN-140 — Basic Concepts of Linear Regulator and Switching Mode Power Supplies',
        url: 'https://www.analog.com/en/resources/app-notes/an-140.html',
      },
      {
        title: 'MIT 6.200 — Buck Converter Laboratory',
        url: 'https://circuits.mit.edu/F25/labs/buck',
      },
      {
        title:
          'Analog Devices — Practical Design Techniques for Power and Thermal Management, Section 3',
        url: 'https://www.analog.com/media/en/training-seminars/design-handbooks/power-thermal-mgmt-sect3.pdf',
      },
    ],
    number: '46',
  },
  {
    slug: 'microscope',
    name: '显微镜',
    title: '看得更大，就一定看得更清楚吗？',
    question: '物镜先成像，目镜再把它放大。',
    description:
      '沿有限共轭显微镜的真实光路，理解倒立中间像、目镜角放大、粗细调焦、景深与数值孔径，并用计算点像辨别分辨率和空放大。',
    category: '空间与波动',
    duration: '3 分钟',
    color: '#9baac3',
    tag: '光学 · 成像与分辨率',
    related: ['camera-lens', 'diffraction', 'optical-fiber'],
    sources: [
      {
        title: 'MIT · Geometric Optics, C. Warde',
        url: 'https://web.mit.edu/6.161/www/Geometric-Optics-9-07.pdf',
      },
      {
        title: 'Nikon MicroscopyU · The Microscope Optical Train',
        url: 'https://www.microscopyu.com/microscopy-basics/components',
      },
      {
        title: 'Nikon MicroscopyU · Resolution',
        url: 'https://www.microscopyu.com/microscopy-basics/resolution',
      },
      {
        title: 'Nikon MicroscopyU · Depth of Field and Depth of Focus',
        url: 'https://www.microscopyu.com/microscopy-basics/depth-of-field-and-depth-of-focus',
      },
      {
        title: 'Stanford ISETCam · Calculating Defocused Images',
        url: 'https://stanford.edu/~wandell/data/isetcam/optics/s_opticsDefocusWVF.html',
      },
      {
        title: 'Leica Microsystems · What is Empty Magnification?',
        url: 'https://www.leica-microsystems.com/science-lab/microscopy-basics/what-is-empty-magnification/',
      },
    ],
    number: '45',
  },
  {
    slug: 'airfoil',
    name: '机翼升力',
    title: '空气没有约定在翼尾重逢',
    question: '机翼两侧的空气，必须在翼尾重逢吗？',
    description: '跟随同一速度场里的空气示踪点，把整圈表面压力加成升力。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#88aeb0',
    tag: '势流与升力',
    related: ['bernoulli', 'siphon', 'water-hammer'],
    sources: [
      {
        title: 'NASA Glenn — Incorrect Lift Theory',
        url: 'https://www.grc.nasa.gov/WWW/k-12/VirtualAero/BottleRocket/airplane/wrong1.html',
      },
      {
        title: 'NASA Glenn — Bernoulli and Newton',
        url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/bernoulli-and-newton/',
      },
      {
        title: 'University of Sydney / Cambridge — Joukowski Transformations and Aerofoils',
        url: 'https://www-mdp.eng.cam.ac.uk/web/library/enginfo/aerothermal_dvd_only/aero/jouk/jouk.html',
      },
      {
        title: 'Complex Analysis — The Joukowski Airfoil',
        url: 'https://complexanalysis.org/web/sec_joukowski-airfoil.html',
      },
    ],
    number: '44',
  },
  {
    slug: 'qr-code',
    name: '二维码',
    title: '小小的方阵，怎么装下一整段网址？',
    question: '跟住网址中的一位，看它成为一个黑白模块。',
    description:
      '从字节、RS 校验到功能图形、折返放置、八种掩码与格式信息，生成真正能读出 https://vistep.ai 的二维码。',
    category: '数字世界',
    duration: '3 分钟',
    color: '#6a8a87',
    tag: '信息 · 编码与机器识别',
    related: ['error-correction', 'network', 'jpeg'],
    sources: [
      {
        title: 'DENSO WAVE — QR Code versions and capacity',
        url: 'https://www.qrcode.com/en/about/version.html',
      },
      {
        title: 'DENSO WAVE — Making a QR Code: the four-module margin',
        url: 'https://www.qrcode.com/en/howto/code.html',
      },
      {
        title: 'DENSO WAVE — Error correction',
        url: 'https://www.qrcode.com/en/about/error_correction.html',
      },
      {
        title: 'Project Nayuki — QR Code generator library and implementation notes',
        url: 'https://www.nayuki.io/page/qr-code-generator-library',
      },
      {
        title: 'ZXing — CharacterSetECI (UTF-8 assignment 26)',
        url: 'https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/common/CharacterSetECI.java',
      },
    ],
    number: '43',
  },
  {
    slug: 'speaker',
    name: '扬声器',
    title: '电流怎样让空气发声？',
    question: '从一圈铜线，到一片振动的空气。',
    description: '走进相连的扬声器剖面，跟随电流、推力与反电动势，再看稳态响应和空气质点。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#b7784c',
    tag: '声学 · 电机与振动',
    related: ['wave-interference', 'noise', 'electric-generator'],
    sources: [
      {
        title: 'KLIPPEL · Small-Signal Modeling',
        url: 'https://klippel.de/manuals/transducer-parameter-identification/fastlsi/fastlsi.html',
      },
      {
        title: 'COMSOL · Loudspeaker Driver — Frequency-Domain Analysis',
        url: 'https://doc.comsol.com/6.4/doc/com.comsol.help.models.aco.loudspeaker_driver/loudspeaker_driver.html',
      },
      {
        title: 'COMSOL · Loudspeaker Driver — Transient Analysis',
        url: 'https://doc.comsol.com/6.3/doc/com.comsol.help.models.aco.loudspeaker_driver_transient/loudspeaker_driver_transient.html',
      },
      {
        title: 'Caltech · The Feynman Lectures, I–47: Sound. The wave equation',
        url: 'https://www.feynmanlectures.caltech.edu/I_47.html',
      },
    ],
    number: '42',
  },
  {
    slug: 'wireless-charging',
    name: '无线充电',
    title: '无线充电：电能怎样跨过间隙？',
    question: '隔着空气，电能怎样到达另一侧？',
    description: '追踪两只线圈共享的磁链，比较间距、错位、谐振和铜耗如何改变交流负载功率。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#427f98',
    tag: '近场传能',
    related: ['transformer-electric', 'electric-generator'],
    sources: [
      {
        title: 'Analog Devices AN-138 — Wireless Power User Guide',
        url: 'https://www.analog.com/en/resources/app-notes/an-138fc.html',
      },
      {
        title: 'Texas Instruments BQ500210 — Typical Wireless Power Transfer System',
        url: 'https://www.ti.com/lit/ds/slusal8c/slusal8c.pdf',
      },
      {
        title: 'Wireless Power Consortium — Magnetic Induction',
        url: 'https://www.wirelesspowerconsortium.com/knowledge-base/magnetic-induction/',
      },
    ],
    number: '41',
  },
  {
    slug: 'lock',
    name: '弹子锁',
    title: '为什么一把小钥匙，能让锁芯转起来？',
    question: '六组弹子怎样同时让开同一条边界？',
    description: '沿连续齿形追踪圆头接触，看匹配钥匙抬起六组弹子，再让锁芯转动、回正和退出。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#58727c',
    tag: '机械 · 接触与约束',
    related: ['ball-bearing', 'planetary-gears'],
    sources: [
      {
        title: 'Schlage · Cylinder components and pin-tumbler glossary',
        url: 'https://www.schlage.com/content/dam/sch-us/documents/pdf/installation-manuals/P513-325.pdf',
      },
      {
        title: 'ASSA ABLOY · Mechanical cylinder operation',
        url: 'https://www.assaabloy.com/ng/en/solutions/locking-solutions/cylinders',
      },
      {
        title: 'Yale · Heritage of the flat-key pin-tumbler cylinder',
        url: 'https://www.yalehome.com/ke/en/stories/news/discover-the-heritage-of-yale',
      },
    ],
    number: '40',
  },
  {
    slug: 'ultrasound',
    name: '超声成像',
    title: '一串回声，怎样组成内部的图像？',
    question: '透过表面，靠的是声音的往返。',
    description:
      '从分层体模的真实延迟回波出发，理解反射与透射、RF 和包络、B 模式扫描、轴向分辨率、衰减阴影及声速假设带来的深度误差。',
    category: '空间与波动',
    duration: '3 分钟',
    color: '#7c9f91',
    tag: '声学 · 回波与成像',
    related: ['doppler', 'noise', 'camera-lens'],
    sources: [
      {
        title: 'University of Michigan · Ultrasound and Photoacoustic Imaging',
        url: 'https://socr.umich.edu/BPAD1/BPAD1_notes/BPAD1_Chap03_UltrasoundPhotoacoustic.html',
      },
      {
        title: 'University of Washington · BEE 531 Ultrasound Pulse-echo',
        url: 'https://staff.washington.edu/mbruce/pres/pulse_echo.html',
      },
      {
        title: 'Evident · A-scans and Cross-sectional B-scans',
        url: 'https://ims.evidentscientific.com/en/learn/ndt-tutorials/instrumententation/phased-array-scans',
      },
    ],
    number: '39',
  },
  {
    slug: 'differential',
    name: '汽车差速器',
    title: '为什么转弯时，两只驱动轮能转得不一样快？',
    question: '外侧多走一点，齿轮怎样把这段差补上？',
    description: '剖开开放式差速器，追踪共顶点的锥齿轮、两侧平均转速和弱侧牵引力带来的扭矩上限。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#69838a',
    tag: '机械 · 差速与扭矩',
    related: ['suspension', 'planetary-gears', 'ball-bearing'],
    sources: [
      {
        title: 'MathWorks · Differential kinematic constraints and power balance',
        url: 'https://www.mathworks.com/help/sdl/ref/differential.html',
      },
      {
        title: 'MathWorks · Bevel pairs and ideal equal differential torques',
        url: 'https://www.mathworks.com/help/sdl/ug/custom-gear-library.html',
      },
      {
        title: 'Eaton · Open differential operation and traction limits',
        url: 'https://www.eaton.com/gb/en-gb/products/differentials-traction-control/open-differential.html',
      },
      {
        title: 'KHK · Bevel gears and intersecting axes',
        url: 'https://khkgears.net/product-category/bevel-gears/',
      },
      {
        title: 'Lee, Lee & Chung · Spherical-involute bevel-gear kinematics (2010)',
        url: 'https://journals.sagepub.com/doi/10.1243/09544062JMES1624',
      },
      {
        title: 'US20160047454A1 · Spherical-involute straight bevel geometry',
        url: 'https://patents.google.com/patent/US20160047454A1/en',
      },
    ],
    number: '38',
  },
  {
    slug: 'error-correction',
    name: '纠错编码',
    title: '数据翻错一位，为什么还能找回来？',
    question: '把校验交织起来，让错误留下位置指纹。',
    description:
      '沿着同一组数据，构造 Hamming 码、观察信道翻转与综合征定位，再用真实双错反例理解扩展 SECDED 的纠错边界。',
    category: '数字世界',
    duration: '3 分钟',
    color: '#7b9078',
    tag: '信息 · 奇偶校验与可靠传输',
    related: ['memory-cache', 'network', 'binary-adder'],
    sources: [
      {
        title: 'R. W. Hamming · Error Detecting and Error Correcting Codes (1950), §§3–5',
        url: 'https://ineffectivetheory.com/edu/papers/hamming-codes-1950.pdf',
      },
      {
        title: 'MIT 6.02 · Error Correction Codes, Hamming distance and double-error detection',
        url: 'https://web.mit.edu/6.02/www/s2010/handouts/lectures/L6.pdf',
      },
      {
        title: 'MIT 6.111 · Information theory tutorial: Hamming checks and overall parity',
        url: 'https://web.mit.edu/6.111/www/f2004/tutprobs/temp/info.htm',
      },
    ],
    number: '37',
  },
  {
    slug: 'bernoulli',
    name: '流速与压强',
    title: '水流越快，压强就一定越小吗？',
    question: '沿一条水路，跟着同一份水记一笔能量账。',
    description: '追踪文丘里管中的守恒水体、相连测压口和水头变化，区分速度、压强、高程与沿程损失。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#759798',
    tag: '流体 · 连续性与能量',
    related: ['siphon', 'water-hammer', 'hydraulic-brake'],
    sources: [
      {
        title: 'NASA Glenn · Mass Flow Rate',
        url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/mass-flow-rate/',
      },
      {
        title: 'NASA Glenn · Bernoulli’s Equation',
        url: 'https://www.grc.nasa.gov/www/k-12/airplane/bern.html',
      },
      {
        title: 'US Bureau of Reclamation · Differential Head Flowmeters',
        url: 'https://www.usbr.gov/tsc/techreferences/mands/wmm/chap14_03.html',
      },
      {
        title: 'US EPA · SWMM Hydraulics Reference Manual, §7.3.2',
        url: 'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P100S9AS.txt',
      },
      {
        title: 'NIST · Water vapor-pressure equation, 0–100 °C',
        url: 'https://nvlpubs.nist.gov/nistpubs/jres/75A/jresv75An3p213_A1b.pdf',
      },
    ],
    number: '36',
  },
  {
    slug: 'doppler',
    name: '多普勒效应',
    title: '声源没变调，为什么听起来忽高忽低？',
    question: '波峰的出发点在移动，到达的节拍就变了。',
    description:
      '追踪每个波峰的发射位置与到达时刻，分开理解移动声源、移动接收者和离轴经过时的声学多普勒效应。',
    category: '空间与波动',
    duration: '3 分钟',
    color: '#7591a0',
    tag: '声学 · 波峰与到达时刻',
    related: ['noise', 'diffraction', 'pendulum'],
    sources: [
      {
        title: 'OpenStax · The Doppler Effect (University Physics, 17.7)',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/17-7-the-doppler-effect',
      },
      {
        title: 'UNSW Physclips · The Doppler Effect',
        url: 'https://www.animations.physics.unsw.edu.au/jw/doppler.htm',
      },
      {
        title: 'OpenStax · Shock Waves (University Physics, 17.8)',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/17-8-shock-waves',
      },
    ],
    number: '35',
  },
  {
    slug: 'induction-motor',
    name: '感应电动机',
    title: '感应电动机：为什么总要慢半步？',
    question: '不接电的转子，为什么会跟着磁场转？',
    description: '走进三相定子与闭合鼠笼，看转差怎样产生电流、转矩与热。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#3a897b',
    tag: '电流与转动',
    related: ['electric-generator', 'transformer-electric', 'ball-bearing'],
    sources: [
      {
        title: 'MIT 6.061 — Analytic Design Evaluation of Induction Machines (J. L. Kirtley)',
        url: 'https://ocw.mit.edu/courses/6-061-introduction-to-electric-power-systems-spring-2011/01f878366fe651f1b95e9ed7fc24c644_MIT6_061S11_ch10.pdf',
      },
      {
        title: 'ABB — Softstarter Handbook, About Motors',
        url: 'https://library.e.abb.com/public/2985284834bcff7fc1256f3a00274038/1SFC132002M0201.pdf',
      },
      {
        title: 'ABB — Changing motor direction by swapping two motor leads',
        url: 'https://new.abb.com/news/detail/116436/stop-swapping-wires-change-motor-direction-in-8-seconds-with-this-trick',
      },
    ],
    number: '34',
  },
  {
    slug: 'wave-interference',
    name: '波的干涉',
    title: '绳子平了，波去哪了？',
    question: '两列波相遇，物质点怎样运动？',
    description: '跟随绳上的一个点，看脉冲相消又穿过，再从相位与振幅走到驻波和能量流。',
    category: '空间与波动',
    duration: '3 分钟',
    color: '#87cbd6',
    tag: '波动 · 叠加与能量',
    related: ['diffraction', 'noise', 'polarization'],
    sources: [
      {
        title: 'Caltech · The Feynman Lectures, I–49: Modes',
        url: 'https://www.feynmanlectures.caltech.edu/I_49.html',
      },
      {
        title: 'UT Austin · Energy Conservation',
        url: 'https://farside.ph.utexas.edu/teaching/315/Waveshtml/node43.html',
      },
      {
        title: 'Caltech · The Feynman Lectures, I–47: Sound. The wave equation',
        url: 'https://www.feynmanlectures.caltech.edu/I_47.html',
      },
    ],
    number: '33',
  },
  {
    slug: 'rainbow',
    name: '彩虹',
    title: '彩虹，为什么偏偏出现在那个方向？',
    question: '一束光的转弯，汇成天空中的弧。',
    description:
      '追踪阳光在水滴中的折射与一次内反射，再从观察者的视线看见色散、方向集中与地平线以上的彩色弧段。',
    category: '空间与波动',
    duration: '3 分钟',
    color: '#809eaa',
    tag: '光学 · 色散与观察方向',
    related: ['polarization', 'optical-fiber', 'diffraction'],
    sources: [
      {
        title: 'IAPWS · Refractive index of ordinary water, R9-97',
        url: 'https://iapws.org/documents/release/Rindex.download',
      },
      {
        title: 'Harvard · Rainbows and stationary directions',
        url: 'https://www.physics.harvard.edu/sites/g/files/omnuum6476/files/physics/files/sol81.pdf',
      },
      {
        title: 'NOAA NESDIS · What causes a rainbow?',
        url: 'https://www.nesdis.noaa.gov/about/k-12-education/optical-phenomena/what-causes-rainbow',
      },
    ],
    number: '32',
  },
  {
    slug: 'water-hammer',
    name: '水锤',
    title: '为什么突然关阀，水管会猛地一震？',
    question: '阀门停下，压力变化才开始旅行。',
    description: '追踪弹性管中的压力波，比较快关与慢关，理解反射、焦科夫斯基关系和汽化边界。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#ce9e66',
    tag: '流体 · 压力波与弹性',
    related: ['siphon', 'hydraulic-brake'],
    sources: [
      {
        title: 'USACE HEC · Pressurized Pipe Flow',
        url: 'https://www.hec.usace.army.mil/confluence/rasdocs/ras1dtechref/6.5/overview-of-optional-capabilities/pressurized-pipe-flow',
      },
      {
        title: 'Simpson & Wylie · Large water-hammer pressure for column separation in pipelines',
        url: 'https://digital.library.adelaide.edu.au/dspace/handle/2440/80903',
      },
      {
        title: 'Bergant, Simpson & Tijsseling · Water column separation: review of research',
        url: 'https://research.tue.nl/files/2010395/587547.pdf',
      },
      {
        title: 'NIST · Vapor pressure equation for water, 0–100 °C',
        url: 'https://nvlpubs.nist.gov/nistpubs/jres/75A/jresv75An3p213_A1b.pdf',
      },
    ],
    number: '31',
  },
  {
    slug: 'suspension',
    name: '汽车悬架',
    title: '越软的悬架，坐起来就越舒服吗？',
    question: '接住一次颠簸，还要收住下一次振荡。',
    description: '跟随路面凸起穿过轮胎、弹簧和减振器，比较车身运动、能量耗散与轮胎接触的边界。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#a77e60',
    tag: '机械 · 振动与阻尼',
    sources: [
      {
        title: 'MathWorks · Quarter-car suspension dynamics and equations',
        url: 'https://www.mathworks.com/help/mpc/ug/admm-based-mpc-control-for-quarter-car-suspension.html',
      },
      {
        title: 'MathWorks · Suspension design through system-level simulation',
        url: 'https://www.mathworks.com/company/technical-articles/optimizing-vehicle-suspension-design-through-system-level-simulation.html',
      },
      {
        title: 'Monroe · What shocks and struts do',
        url: 'https://www.monroe.com/technical-resources/shocks-101/shocks-vs-struts.html',
      },
      {
        title: 'MathWorks · Automotive suspension and nonlinear model limits',
        url: 'https://www.mathworks.com/help/simulink/slref/automotive-suspension.html',
      },
    ],
    related: ['pendulum', 'hydraulic-brake', 'four-stroke-engine'],
    number: '30',
  },
  {
    slug: 'diffraction',
    name: '衍射',
    title: '光穿过窄缝，为什么反而散开？',
    question: '一道开口，许多场贡献。',
    description: '从狭缝各段的相位相加，看到暗纹、中央峰和波长与缝宽的尺度关系。',
    category: '空间与波动',
    duration: '3 分钟',
    color: '#799173',
    tag: '光学 · 波场与衍射',
    related: ['polarization', 'optical-fiber', 'camera-lens'],
    sources: [
      {
        title: 'UT Austin · Single-Slit Diffraction',
        url: 'https://farside.ph.utexas.edu/teaching/315/Waves/node96.html',
      },
      {
        title: 'The Feynman Lectures · Diffraction',
        url: 'https://www.feynmanlectures.caltech.edu/I_30.html',
      },
      {
        title: 'MIT · Fresnel and Fraunhofer diffraction',
        url: 'https://www.mit.edu/~birge/fresnel/',
      },
      {
        title: 'TU Delft · Scalar Diffraction Optics',
        url: 'https://interactivetextbooks.tudelft.nl/interactive-optics/content/Chap6_Diffraction/DiffractiveOptics_2022_01Clean.html',
      },
    ],
    number: '29',
  },
  {
    slug: 'memory-cache',
    name: '内存与缓存',
    title: '明明还有空位，缓存为什么仍然未命中？',
    question: '数据在什么位置，比看起来有多近更重要。',
    description:
      '走进一张带地址的内存地图，追踪缓存行、标签、局部性与替换，公平比较相同容量里的不同安排。',
    category: '数字世界',
    duration: '3 分钟',
    color: '#547a80',
    tag: '计算机 · 地址与局部性',
    related: ['cpu-pipeline', 'binary-adder', 'network'],
    sources: [
      {
        title: 'Cornell CS3410 · Caches',
        url: 'https://www.cs.cornell.edu/courses/cs3410/2026sp/notes/caches.html',
      },
      {
        title: 'Cornell CS3410 · Cache tag/index/offset calculations',
        url: 'https://www.cs.cornell.edu/courses/cs3410/2019sp/projects/cache/',
      },
      {
        title: 'Intel · Loop optimizations and locality',
        url: 'https://www.intel.com/content/www/us/en/developer/articles/technical/loop-optimizations-where-blocks-are-required.html',
      },
    ],
    number: '28',
  },
  {
    slug: 'electric-generator',
    name: '发电机',
    title: '转动一圈铜线，为什么会发电？',
    question: '电流出现时，为什么轴更难转？',
    description: '追踪旋转线圈、滑环与电刷，把磁通变化、交流电压、反向力矩和机械能转换接起来。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#4b8197',
    tag: '电磁 · 运动与能量',
    related: ['transformer-electric', 'ball-bearing'],
    sources: [
      {
        title: 'MIT 8.02 · Faraday’s law and generators',
        url: 'https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/ce1720fd4b21def8c2189ff4779f27f7_cha10faraday_law.pdf',
      },
      {
        title: 'OpenStax · Electric generators and back EMF',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/13-6-electric-generators-and-back-emf',
      },
      {
        title: 'OpenStax · Force and torque on a current loop',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/11-5-force-and-torque-on-a-current-loop',
      },
      {
        title: 'Moog · Slip rings and stationary brushes',
        url: 'https://www.moog.com/products/slip-rings/slip-ring-faqs.html',
      },
    ],
    number: '27',
  },
  {
    slug: 'siphon',
    name: '虹吸',
    title: '水为什么能先爬高，再流向低处？',
    question: '水柱连通，落差才有路可走。',
    description: '跟随透明弯管里的水，连接预充、水头、压力分布、进气断流与顶部高度的边界。',
    category: '空间与系统',
    duration: '3 分钟',
    color: '#70a38b',
    tag: '流体 · 水头与连续液柱',
    related: ['hydraulic-brake', 'refrigerator'],
    sources: [
      {
        title: 'USBR · Small Tubes or Siphons',
        url: 'https://www.usbr.gov/tsc/techreferences/mands/wmm/chap14_14.html',
      },
      {
        title: 'OpenStax · Bernoulli’s Equation',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/14-6-bernoullis-equation',
      },
      {
        title: 'NIST Chemistry WebBook · Water vapor pressure',
        url: 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Mask=4&Type=ANTOINE&Plot=on',
      },
      {
        title: 'NIST · Vapor pressure equation for water, 0–100 °C',
        url: 'https://nvlpubs.nist.gov/nistpubs/jres/75A/jresv75An3p213_A1b.pdf',
      },
    ],
    number: '26',
  },
  {
    slug: 'ball-bearing',
    name: '滚珠轴承',
    title: '一颗滚珠，怎样让转轴轻快地转动？',
    question: '两处接触，一起滚动。',
    description: '跟随一颗球穿过承载区，从无滑动几何推导保持架与自转，再放大真实接触中的损耗。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#b59b73',
    tag: '机械 · 接触与滚动',
    related: ['bicycle', 'planetary-gears', 'four-stroke-engine'],
    sources: [
      {
        title: 'SKF · Rolling bearings catalogue',
        url: 'https://www.skf.com/binaries/pub12/Images/0901d196802809de-Rolling-bearings---17000_1-EN_tcm_12-121486.pdf',
      },
      {
        title: 'SKF · Wear and surface fatigue in rolling bearings',
        url: 'https://evolution.skf.com/wear-and-surface-fatigue-in-rolling-bearings/',
      },
      {
        title: 'SKF · Using a friction model as an engineering tool',
        url: 'https://evolution.skf.com/en/using-a-friction-model-as-an-engineering-tool-3/',
      },
      {
        title: 'SKF · Grease lubrication mechanisms in rolling bearing systems',
        url: 'https://evolution.skf.com/grease-lubrication-mechanisms-in-rolling-bearing-systems/',
      },
      {
        title: 'Schaeffler · Technical pocket guide, cages',
        url: 'https://www.schaeffler.com/remotemedien/media/_shared_media/08_media_library/01_publications/schaeffler_2/catalogue_1/downloads_6/stt_de_en.pdf',
      },
    ],
    number: '25',
  },
  {
    slug: 'seasons',
    name: '季节',
    title: '地轴一倾斜，为什么就有了四季？',
    question: '跟随一根影子，读懂两半球的季节。',
    description: '从太阳高度、白昼长短与日影出发，连接地轴倾斜、分至点、极昼极夜和零倾角对照。',
    category: '空间与系统',
    duration: '3 分钟',
    color: '#b8bd91',
    tag: '天文 · 倾角与日照',
    related: ['moon-phases', 'camera-lens'],
    sources: [
      {
        title: 'NASA Space Place · What Causes the Seasons?',
        url: 'https://spaceplace.nasa.gov/seasons/en/',
      },
      {
        title: 'NOAA GML · General Solar Position Calculations',
        url: 'https://gml.noaa.gov/grad/solcalc/solareqns.PDF',
      },
      {
        title: 'NASA Science · Earth Facts',
        url: 'https://science.nasa.gov/earth/facts/',
      },
    ],
    number: '24',
  },
  {
    slug: 'polarization',
    name: '偏振',
    title: '多放一片偏振片，为什么反而透光？',
    question: '两片变暗，三片透光。',
    description: '跟随电场穿过三片滤光片，连接偏振方向、马吕斯定律与每一步的能量去向。',
    category: '空间与波动',
    duration: '3 分钟',
    color: '#88aaa9',
    tag: '光学 · 电场与投影',
    related: ['optical-fiber', 'camera-lens', 'noise'],
    sources: [
      {
        title: 'The Feynman Lectures on Physics · Polarization, §33–4',
        url: 'https://www.feynmanlectures.caltech.edu/I_33.html',
      },
      {
        title: 'OpenStax · University Physics III: Polarization',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/1-7-polarization',
      },
    ],
    number: '23',
  },
  {
    slug: 'cpu-pipeline',
    name: 'CPU 指令流水线',
    title: '一条指令没变快，程序为什么更快了？',
    question: '让不同指令，占据不同工位。',
    description:
      '追踪同一份程序里的指令身份，逐拍看清重叠、数据前递、加载停顿和分支清除，再核对最终结果。',
    category: '数字世界',
    duration: '3 分钟',
    color: '#527b70',
    tag: '计算机 · 时序与依赖',
    related: ['binary-adder', 'transformer', 'network'],
    sources: [
      {
        title: 'Harris & Harris · RISC-V Microarchitecture, five-stage pipeline',
        url: 'https://pages.hmc.edu/harris/class/e85/old/fall21/lect22.pdf',
      },
      {
        title: 'Brown CSCI1952y · Building a five-stage pipelined CPU',
        url: 'https://cs.brown.edu/courses/csci1952y/2024/notes/pipelined_cpu.html',
      },
      {
        title: 'RISC-V International · RV32I Base Integer Instruction Set',
        url: 'https://docs.riscv.org/reference/isa/v20260120/unpriv/rv32.html',
      },
    ],
    number: '22',
  },
  {
    slug: 'transformer-electric',
    name: '变压器',
    title: '铜线没有相连，电压怎样传过去？',
    question: '一个磁路，连接两个电路。',
    description: '跟随闭合铁芯里的变化磁通，理解感应电压、匝数比、负载电流和损耗。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#b17b52',
    tag: '电磁 · 变化与传递',
    related: ['noise', 'optical-fiber'],
    sources: [
      {
        title: 'MIT 8.02 · Mutual inductance and transformers',
        url: 'https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/1762da3d55d1798e584c08bddb29235c_summary_w09d3.pdf',
      },
      {
        title: 'OpenStax · Transformers',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/15-6-transformers',
      },
      {
        title: 'OpenStax · RL circuits',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/14-4-rl-circuits',
      },
      {
        title: 'TDK · Inductance, DC transients and laminations',
        url: 'https://www.tdk.com/en/tech-mag/electronics_primer/2',
      },
      {
        title: 'Texas Instruments · Power transformer design',
        url: 'https://www.ti.com/lit/ml/slup126/slup126.pdf',
      },
    ],
    number: '21',
  },
  {
    slug: 'moon-phases',
    name: '月相',
    title: '月亮为什么一会儿弯，一会儿圆？',
    question: '同一颗月亮，不同的视角。',
    description: '跟随月球的轨道与日照，连接盈亏、月食、同步自转和两种月长。',
    category: '空间与系统',
    duration: '3 分钟',
    color: '#aeb9cf',
    number: '20',
    tag: '天文 · 光与视角',
    related: ['dimensions', 'camera-lens'],
    sources: [
      { title: 'NASA · Moon phases', url: 'https://science.nasa.gov/moon/moon-phases/' },
      { title: 'NASA · Moon questions', url: 'https://science.nasa.gov/moon/top-moon-questions/' },
      { title: 'NASA · Eclipse geometry', url: 'https://science.nasa.gov/eclipses/geometry/' },
      { title: 'NASA SVS · CGI Moon Kit (LROC / LOLA)', url: 'https://svs.gsfc.nasa.gov/4720/' },
      { title: 'JPL · Astrodynamic parameters', url: 'https://ssd.jpl.nasa.gov/astro_par.html' },
      {
        title: 'JPL · Satellite physical parameters',
        url: 'https://ssd.jpl.nasa.gov/sats/phys_par/',
      },
    ],
  },
  {
    slug: 'hydraulic-brake',
    name: '液压刹车',
    title: '轻轻一捏，怎样夹紧远处的碟片？',
    question: '一条油路，传递压力。',
    description: '打开主缸与对置活塞卡钳，跟随排液、接触、加压和释放，理解力、行程与制动能量。',
    category: '生活器物',
    duration: '3 分钟',
    color: '#a1765b',
    number: '19',
    tag: '液压 · 力与位移',
    related: ['bicycle', 'four-stroke-engine'],
    sources: [
      {
        title: 'OpenStax · Pascal’s principle and hydraulics',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/14-3-pascals-principle-and-hydraulics',
      },
      {
        title: 'Shimano · The easy-to-understand guide to brakes',
        url: 'https://bike.shimano.com/en-SG/stories/article/the-easy-to-understand-guide-to-brakes.html',
      },
      {
        title: 'Brembo · Master-cylinder free stroke',
        url: 'https://www.brembo.com/en/news-archive/brembo-brake-master-cylinder',
      },
      {
        title: 'Brembo · Factors behind braking torque',
        url: 'https://www.brembo.com/en/news-archive/5-factors-that-make-a-brembo-braking-system-unbeatable',
      },
    ],
  },
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
