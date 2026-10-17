export type Topic = {
  slug: string;
  name: string;
  title: string;
  question: string;
  description: string;
  color: string;
  number: string;
  tag: string;
  related: string[];
  sources: { title: string; url: string }[];
};
export const topics: Topic[] = [
  {
    slug: 'electric-fuse',
    name: '保险丝',
    title: '相同峰值电流，为什么有时熔化、有时不熔化？',
    question: '保险丝响应的是瞬时电流，还是一段热历史？',
    description: '从细丝温度分布、端帽散热和短脉冲，理解开始熔化与真正开断的区别。',
    color: '#b9c5a6',
    tag: '热历史',
    related: ['heat-conduction', 'latent-heat', 'rc-circuit'],
    sources: [
      {
        title: 'Eaton · High-speed fuses application guide',
        url: 'https://www.eaton.com/content/dam/eaton/products/electrical-circuit-protection/bussmann-iec-high-speed-semi-conductors-fuses/eaton-bussmann-series-high-speed-fuses-application-guide-br132015en-en-us.pdf',
      },
      {
        title: 'Eaton · Fuse terminology, specifications and selection',
        url: 'https://www.eaton.com/content/dam/eaton/products/electronic-components/resources/technical/eaton-fuse-technology-terminology-specifications-device-selection.pdf',
      },
      {
        title: 'Littelfuse · Fuse thermal behavior and selection',
        url: 'https://www.littelfuse.com/products/fuses-overcurrent-protection/fuses',
      },
      {
        title: 'NIST · Silver physical properties',
        url: 'https://nvlpubs.nist.gov/nistpubs/Legacy/TN/nbstechnicalnote1363.pdf',
      },
    ],
    number: '202',
  },
  {
    slug: 'current-transformer',
    name: '电流互感器',
    title: '一百安培怎样变成一安培，还会在哪失真？',
    question: '二次侧电流为零，为什么端电压反而可能升高？',
    description: '从穿心导体、二次安匝与非线性磁芯，观察匝数比、负担和开路边界。',
    color: '#b8c5a7',
    tag: '安匝平衡',
    related: ['transformer-electric', 'hall-effect', 'three-phase-power'],
    sources: [
      {
        title: 'SEL · Selecting CTs to optimize relay performance',
        url: 'https://cdn.selinc.com/assets/Literature/Publications/Technical%20Papers/6027_SelectingCTsOptimize_JR-SZ_20110627_Web.pdf',
      },
      {
        title: 'SEL · Determine current transformer suitability',
        url: 'https://cdn.selinc.com/assets/Literature/Publications/Technical%20Papers/6096_DetermineCurrent_991007_Web.pdf',
      },
      {
        title: 'Schneider Electric · CT open-secondary hazards',
        url: 'https://www.se.com/us/en/faqs/FA125574/',
      },
    ],
    number: '201',
  },
  {
    slug: 'relay',
    name: '继电器',
    title: '线圈只施力，负载能量从另一条回路来',
    question: '同样 2 V，为什么吸不动，却能在吸合后保持？',
    description:
      '跟随常开直流柱塞继电器的电流、变气隙磁力与真实接触，区分吸合、保持、释放和独立负载供能。',
    color: '#a9bec5',
    tag: '电磁开关',
    related: ['inductor-transient', 'ground-fault-breaker', 'transformer-electric'],
    sources: [
      {
        title: 'OMRON: Technical Explanation for General-purpose Relays',
        url: 'https://www.ia.omron.com/data_pdf/guide/36/generalrelay_tg_e_10_6.pdf',
      },
      {
        title: 'OMRON: Relay Technology',
        url: 'https://components.omron.com/us-en/products/basic-knowledge/relays/technology',
      },
      {
        title: 'OMRON: FAQ02804 — Coil Surge Absorption',
        url: 'https://www.ia.omron.com/support/faq/answer/36/faq02804/index.html',
      },
    ],
    number: '200',
  },
  {
    slug: 'ground-fault-breaker',
    name: '漏电保护器',
    title: '不是只看电流多大，而是谁没有一起回来',
    question: '去、回电流几乎一样，为什么几十毫安的差也会跳开？',
    description:
      '让 L/N 在同一检测环内相抵，再追踪环外返回、内部测试旁路与跳闸锁扣，分清差流与过流。',
    color: '#c4b397',
    tag: '差流检测',
    related: ['transformer-electric', 'rc-circuit'],
    sources: [
      {
        title: 'ABB: RCD Application Manual — Mechanical Operation',
        url: 'https://library.e.abb.com/public/54c9c24f0bf34927ad336702fd3ce4a0/1SXU000023C0202_15.pdf',
      },
      {
        title: 'ABB: Protection Against Earth Faults with RCDs',
        url: 'https://library.e.abb.com/public/9f0e99de3bc740288bc41ab95667f72f/RCD%20Technical%20Guide%20EN.pdf',
      },
    ],
    number: '199',
  },
  {
    slug: 'pressure-cooker',
    name: '高压锅',
    title: '高压锅为什么能让水超过一百度？',
    question: '配重阀、绝对压力和排汽，怎样共同决定沸腾温度？',
    description:
      '剖开理想配重阀，跟踪液面到阀口的连续通道，核对压差受力、饱和温压和刚性容器的质量能量账。',
    tag: '压力与相变',
    color: '#82927b',
    related: ['latent-heat', 'hydrostatic-pressure', 'ideal-gas'],
    sources: [
      {
        title: 'IAPWS-IF97 R7-97(2012), §8, Eqs.29–31 and Tables34–36',
        url: 'https://iapws.org/technical-guidance/release/IF97-Rev.download',
      },
      {
        title: 'NIST Steam Tables: saturation properties',
        url: 'https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=906704',
      },
      {
        title: 'Presto: Pressure regulator, vent pipe, seal and cover-lock functions',
        url: 'https://www.gopresto.com/content/pressure-cooking/pressure-cooking-how-to-use',
      },
      {
        title: 'NASA Glenn: Mass Flow Choking, ideal-gas nozzle derivation',
        url: 'https://www.grc.nasa.gov/www/k-12/airplane/mflchk.html',
      },
    ],
    number: '198',
  },
  {
    slug: 'three-phase-power',
    name: '三相电力',
    title: '三条起伏的功率，怎样加成一条水平线？',
    question: '各相都在交变，总功率为什么可以不变？',
    description: '比较相电压与线电压、单相功率起伏、三相平衡与中性线返回电流。',
    color: '#b9c4aa',
    tag: '三相平衡',
    related: [
      'current-transformer',
      'induction-motor',
      'transformer-electric',
      'inductor-transient',
    ],
    sources: [
      {
        title: 'MIT6.061 · Polyphase networks',
        url: 'https://www.ocw.mit.edu/courses/6-061-introduction-to-electric-power-systems-spring-2011/c6393a58319200a5344752de0cf47ec4_MIT6_061S11_ch3.pdf',
      },
      {
        title: 'Oregon State ENGR202 · Three-phase fundamentals',
        url: 'https://web.engr.oregonstate.edu/~webbky/ENGR202_files/SECTION%207%20Three%20Phase%20Circuit%20Fundamentals.pdf',
      },
      {
        title: 'Schneider Electric · Neutral conductor and harmonics',
        url: 'https://www.electrical-installation.org/enwiki/Sizing_the_neutral_conductor',
      },
    ],
    number: '197',
  },
  {
    slug: 'fuel-cell',
    name: '燃料电池',
    title: '电子绕路做功，为什么电流更大不一定输出更多？',
    question: '膜挡住电子，反而怎样让氢与氧的反应输出电能？',
    description:
      '沿 PEM 膜与负载分追质子和电子，核对供料、产水、功率和放热，再用近短路反例分清功率与效率。',
    color: '#b8c7b9',
    tag: '电化学供能',
    related: ['electrolysis', 'rc-circuit', 'diode-junction'],
    sources: [
      {
        title: 'DOE: Fuel Cells',
        url: 'https://www.energy.gov/cmei/fuels/fuel-cells',
      },
      {
        title: 'DOE: Parts of a Fuel Cell',
        url: 'https://www.energy.gov/cmei/fuels/parts-fuel-cell',
      },
      {
        title: 'NETL: Fuel Cell Handbook, Section 2',
        url: 'https://www.netl.doe.gov/sites/default/files/netl-file/FCHandbook7.pdf',
      },
      {
        title: 'NIST: 2022 CODATA constants',
        url: 'https://physics.nist.gov/constants',
      },
    ],
    number: '196',
  },
  {
    slug: 'piezoelectricity',
    name: '压电效应',
    title: '一直压着，电压为什么反而消失？',
    question: '持续受压的压电片，为什么不适合直接静态称重？',
    description: '观察纳米形变、电荷泄漏、卸载反向脉冲与逆压电伸缩。',
    color: '#b5c4a5',
    tag: '力与电荷',
    related: ['rc-circuit', 'capacitor-fields', 'op-amp-feedback'],
    sources: [
      {
        title: 'PI Ceramic · Fundamental equations and piezoelectric coefficients',
        url: 'https://www.piceramic.com/fileadmin/user_upload/pi_ceramic/files/catalog_CAT/PI_CAT125E_R3_Piezoelectric_Ceramic_Products.pdf',
      },
      {
        title: 'PIEZO.com · Piezoelectric generators',
        url: 'https://piezo.com/pages/piezoelectric-generators',
      },
      {
        title: 'PIEZO.com · Electronics overview',
        url: 'https://support.piezo.com/article/130-electronics-overview',
      },
      {
        title: 'PCB Piezotronics · Introduction to force sensors',
        url: 'https://www.pcb.com/resources/technical-information/introduction-to-force-sensors',
      },
    ],
    number: '195',
  },
  {
    slug: 'dew-point',
    name: '露点',
    title: '冷玻璃为什么到某个温度才结露？',
    question: '露点、相对湿度和水汽多少，是同一件事吗？',
    description: '让冷镜面穿过饱和蒸气压交点，再核对定压空气冷却与复热过程中的水汽和液水总账。',
    tag: '湿度与相平衡',
    color: '#6f98a5',
    related: ['evaporative-cooling', 'latent-heat', 'adiabatic-compression'],
    sources: [
      {
        title: 'NIST Engineering Metrology Toolbox, humidity definitions, Appendix A-I and Table 2',
        url: 'https://emtoolbox.nist.gov/wavelength/documentation.asp',
      },
      {
        title: 'National Weather Service: Dry bulb, wet bulb and dew point temperatures',
        url: 'https://www.weather.gov/source/zhu/ZHU_Training_Page/definitions/dry_wet_bulb_definition/dry_wet_bulb.html',
      },
    ],
    number: '194',
  },
  {
    slug: 'electrolysis',
    name: '水电解',
    title: '同一份电荷，为什么产氢是产氧的两倍？',
    question: '膜里的质子和导线里的电子，怎样一起拆开水？',
    description: '沿 PEM 电解槽分追质子与外部电子，把电荷、产气比例、输入电能和有限水量逐项对齐。',
    color: '#a5bca9',
    tag: '电化学',
    related: ['fuel-cell', 'rc-circuit', 'diode-junction'],
    sources: [
      {
        title: 'DOE: Hydrogen Production — Electrolysis',
        url: 'https://www.energy.gov/cmei/fuels/hydrogen-production-electrolysis',
      },
      {
        title: 'NETL: Fuel Cell Handbook, Section 2',
        url: 'https://www.netl.doe.gov/sites/default/files/netl-file/FCHandbook7.pdf',
      },
      {
        title: 'NIST: 2022 CODATA constants',
        url: 'https://physics.nist.gov/constants',
      },
    ],
    number: '193',
  },
  {
    slug: 'thermocouple',
    name: '热电偶',
    title: '只知道毫伏读数，为什么还测不出温度？',
    question: '热端不变，接线端变暖为什么会影响读数？',
    description: '沿完整测量回路理解温差、K型参考函数、冷端补偿与等温连接。',
    color: '#bdc6aa',
    tag: '冷端补偿',
    related: ['hall-effect', 'op-amp-feedback', 'heat-conduction'],
    sources: [
      {
        title: 'NIST · Monograph175, type K reference functions',
        url: 'https://nvlpubs.nist.gov/nistpubs/Legacy/MONO/nistmonograph175.pdf',
      },
      {
        title: 'Analog Devices · Thermocouple measurement design essentials',
        url: 'https://www.analog.com/en/resources/technical-articles/thermocouple-temperature-measurement-system-design-essentials.html',
      },
      {
        title: 'Analog Devices · The basics of thermocouples',
        url: 'https://www.analog.com/en/resources/design-notes/the-basics-of-thermocouples.html',
      },
      {
        title: 'Keysight · Practical temperature measurements',
        url: 'https://www.keysight.com/us/en/assets/7018-06789/application-notes/5965-7822.pdf',
      },
    ],
    number: '192',
  },
  {
    slug: 'evaporative-cooling',
    name: '蒸发冷却',
    title: '水没有沸腾，为什么也能带走热？',
    question: '蒸发、空气补热和湿度，怎样共同决定水温？',
    description: '核对薄水膜的质量与能量账，比较湿度和换气速率，并用冷表面凝结检验相变热流的反向。',
    tag: '相变与传质',
    color: '#73958b',
    related: ['dew-point', 'latent-heat', 'convection', 'heat-conduction'],
    sources: [
      {
        title:
          'NIST Engineering Metrology Toolbox, §V, Appendix A-I and Table 2: IAPWS saturation pressure',
        url: 'https://emtoolbox.nist.gov/wavelength/documentation.asp',
      },
      {
        title: 'National Weather Service: Dry bulb, wet bulb and dew point temperatures',
        url: 'https://www.weather.gov/source/zhu/ZHU_Training_Page/definitions/dry_wet_bulb_definition/dry_wet_bulb.html',
      },
    ],
    number: '191',
  },
  {
    slug: 'greenhouse-effect',
    name: '温室效应',
    title: '表面更暖，为什么太空逸出仍能保持平衡？',
    question: '大气向下辐射，是不是额外创造了能量？',
    description: '逐项核对单层灰体的吸收、双向发射与顶层预算，再跟随正热容瞬态恢复平衡。',
    color: '#9db8a9',
    tag: '辐射平衡',
    related: ['heat-radiation', 'heat-conduction'],
    sources: [
      {
        title: 'NASA: Climate and Earth Energy Budget',
        url: 'https://science.nasa.gov/earth/earth-observatory/climate-and-earths-energy-budget/',
      },
      {
        title: 'Penn State: One-Layer Energy Balance Model',
        url: 'https://courses.ems.psu.edu/meteo469/book/export/html/198',
      },
    ],
    number: '190',
  },
  {
    slug: 'eddy-current-brake',
    name: '涡流制动',
    title: '没有接触，金属为什么会被刹慢？',
    question: '切几条缝，为什么能让磁制动力变小？',
    description: '从闭合电流、磁力与焦耳热，观察局部磁场和绝缘切缝如何改变制动。',
    color: '#b6c2a7',
    tag: '闭合涡流',
    related: ['hall-effect', 'induction-motor', 'inductor-transient'],
    sources: [
      {
        title: 'OpenStax · Eddy currents',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/13-5-eddy-currents',
      },
      {
        title: 'OpenStax · Eddy currents and magnetic damping',
        url: 'https://openstax.org/books/college-physics-2e/pages/23-4-eddy-currents-and-magnetic-damping',
      },
      {
        title: 'MIT · Moving magnet and conducting sheet',
        url: 'https://web.mit.edu/8.02t/www/802TEAL3D/visualizations/faraday/movingDipole/movingDipole.htm',
      },
    ],
    number: '189',
  },
  {
    slug: 'surface-waves',
    name: '水面波',
    title: '波浪向前，水也一直向前吗？',
    question: '水质点的轨道、波峰与波组，为什么有不同速度？',
    description: '跟住有限水深重力波中的水质点，比较深水圆轨道、浅水扁椭圆与两波叠加的包络速度。',
    tag: '波动与水深',
    color: '#59818d',
    related: ['wave-interference', 'vortex-ring', 'hydrostatic-pressure'],
    sources: [
      {
        title:
          'MIT Marine Hydrodynamics Lecture 20, §§6.2–6.3: Airy waves, dispersion and particle orbits',
        url: 'https://ocw.mit.edu/courses/2-20-marine-hydrodynamics-13-021-spring-2005/5d48a5937971d973fd8ca90c051a83f8_lecture20.pdf',
      },
      {
        title: 'MIT Marine Hydrodynamics Lecture 21, §§6.4–6.6: wave groups and energy propagation',
        url: 'https://ocw.mit.edu/courses/2-20-marine-hydrodynamics-13-021-spring-2005/b9fe0992f1502e0c704359a2f7ecc56c_lecture21.pdf',
      },
    ],
    number: '188',
  },
  {
    slug: 'vortex-ring',
    name: '涡环',
    title: '烟圈为什么能一边翻滚、一边向前？',
    question: '切面里两个反向涡核，怎样组成同一个前进的环？',
    description:
      '从闭合涡丝转入经线切面，跟踪流体标记，比较环量、半径、核宽与观察参考系对传播和局部运动的影响。',
    tag: '流体与涡量',
    color: '#426674',
    related: ['viscosity-layers', 'stokes-drag', 'bernoulli'],
    sources: [
      {
        title: 'MIT Unified Engineering F6 — Vortex filaments and Biot–Savart law',
        url: 'https://ocw.mit.edu/courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/c1bfd53262231a2e5e77b660b7085c16_f06_0304.pdf',
      },
      {
        title: 'H. K. Moffatt, Vortex dynamics: the legacy of Helmholtz and Kelvin (2011), §§2–3',
        url: 'https://www.damtp.cam.ac.uk/user/hkm2/PDFs/Moffatt_2011_WorldScientific_Abitvdat_1.pdf',
      },
    ],
    number: '187',
  },
  {
    slug: 'plate-boundaries',
    name: '板块边界',
    title: '板块都在移动，边界怎样分出张开、汇聚与错动？',
    question: '同样的汇聚速度，能不能直接决定谁会俯冲？',
    description:
      '分解真实相对速度，追踪新生宽度与连续物质路径，并检查斜向边界和大陆接触的模型边界。',
    color: '#9fb29d',
    tag: '板块运动',
    related: ['seismic-waves', 'coriolis'],
    sources: [
      {
        title: 'USGS: Understanding Plate Motions',
        url: 'https://pubs.usgs.gov/gip/dynamic/understanding.html',
      },
      {
        title: 'USGS: Main Types of Plate Boundaries',
        url: 'https://pubs.usgs.gov/gip/dynamic/Vigil.html',
      },
    ],
    number: '186',
  },
  {
    slug: 'stellar-parallax',
    name: '恒星视差',
    title: '地球换一个位置，怎样量出恒星距离？',
    question: '半年角位移为什么是 2p，而不是定义的视差 p？',
    description: '用真实视线投影分开视差半幅、观察基线、距离、黄纬投影与线性自行。',
    color: '#a4b4c8',
    tag: '天文测量',
    related: ['stereoscopic-vision', 'telescope', 'earth-day'],
    sources: [
      {
        title: 'NASA: Stellar Parallax',
        url: 'https://science.nasa.gov/asset/hubble/stellar-parallax/',
      },
      {
        title: 'ESA: Parallax and Proper Motion',
        url: 'https://www.esa.int/ESA_Multimedia/Videos/2018/04/Parallax_and_proper_motion/%28lang%29',
      },
      {
        title:
          'IAU 2015 Resolution B2 on Recommended Zero Points for the Absolute and Apparent Bolometric Magnitude Scales',
        url: 'https://arxiv.org/abs/1510.06262',
      },
    ],
    number: '185',
  },
  {
    slug: 'viscosity-layers',
    name: '黏性分层',
    title: '上下层速度不同，界面能突然滑开吗？',
    question: '连续速度、不同斜率与共同剪应力，怎样同时成立？',
    description:
      '从启动动量扩散到两液稳态剪切，追踪连续材料线，比较黏度、间隙、层序、耗散与整体平移反例。',
    tag: '剪切与连续',
    color: '#a0af87',
    related: ['stokes-drag', 'heat-conduction', 'diffusion'],
    sources: [
      {
        title: 'Cambridge DAMTP, John Hinch: Fluid Dynamics II, §3.1–3.3',
        url: 'https://www.damtp.cam.ac.uk/user/examples/D23Le.pdf',
      },
    ],
    number: '184',
  },
  {
    slug: 'hall-effect',
    name: '霍尔效应',
    title: '横向电压怎样揭示载流子的符号？',
    question: '电流方向相同，霍尔电压为什么会反号？',
    description: '固定电流、磁场与表笔方向，观察漂移、横向力平衡和载流子密度。',
    color: '#b6c1a2',
    tag: '横向电压',
    related: ['eddy-current-brake', 'diode-junction', 'capacitor-fields', 'induction-motor'],
    sources: [
      {
        title: 'OpenStax · The Hall effect',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/11-6-the-hall-effect',
      },
      {
        title: 'NIST · Resistivity and Hall measurements',
        url: 'https://www.nist.gov/pml/nanoscale-device-characterization-division/popular-links/hall-effect/resistivity-and-hall',
      },
      {
        title: 'NIST · Hall-effect principles',
        url: 'https://www.nist.gov/pml/nanoscale-device-characterization-division/popular-links/hall-effect/hall-effect',
      },
    ],
    number: '183',
  },
  {
    slug: 'lunar-eclipse',
    name: '月食',
    title: '为什么满月不总是月食？',
    question: '从半影到全食，要看月心还是整个月面投影？',
    description: '改变交点角、轨道倾角和月地距离，用真实影区相交区分无食、半影、偏食与全食。',
    color: '#aa9bb9',
    tag: '影与轨道',
    related: ['solar-eclipse', 'seasons', 'earth-day'],
    sources: [
      {
        title: 'NASA: Eclipses and the Moon',
        url: 'https://science.nasa.gov/Moon/eclipses/',
      },
      {
        title: 'NASA: Enlargement of Earth Shadows',
        url: 'https://eclipse.gsfc.nasa.gov/LEcat5/shadow.html',
      },
      {
        title: 'NASA: Moon Fact Sheet',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html',
      },
    ],
    number: '182',
  },
  {
    slug: 'stokes-drag',
    name: '斯托克斯阻力',
    title: '没有大尾涡，球为什么仍受阻力？',
    question: '低Re的线性阻力，怎样决定终端沉降并检验自己的边界？',
    description:
      '从真实三维球体解析流线追踪速度、黏度与半径，再用终端力平衡和雷诺数检查阻止公式外推。',
    tag: '黏性与沉降',
    color: '#95aa8b',
    related: ['buoyancy', 'bernoulli', 'brownian-motion'],
    sources: [
      {
        title: 'MIT OCW 1.63J, Chiang C. Mei: Stokes flow past a sphere',
        url: 'https://ocw.mit.edu/courses/1-63-advanced-fluid-dynamics-of-the-environment-fall-2002/359411f0a9d2cd5b7368dab9cc34cdd7_25Stokes.pdf',
      },
    ],
    number: '181',
  },
  {
    slug: 'op-amp-feedback',
    name: '运放负反馈',
    title: '运放的两个输入总是相等吗？',
    question: '虚短在哪些条件下成立，什么时候失效？',
    description: '用反馈分压、有限增益、输出饱和和转换速率，解释虚短的条件。',
    color: '#b9c2a4',
    tag: '误差与负反馈',
    related: ['bjt-amplifier', 'wheatstone-bridge', 'rc-circuit'],
    sources: [
      {
        title: 'Analog Devices MT-033 · Voltage feedback gain and bandwidth',
        url: 'https://www.analog.com/media/en/training-seminars/tutorials/MT-033.pdf',
      },
      {
        title: 'Analog Devices · Operational amplifiers',
        url: 'https://wiki.analog.com/university/courses/electronics/text/chapter-2',
      },
      {
        title: 'Analog Devices · Feedback amplifier configurations',
        url: 'https://wiki.analog.com/university/courses/electronics/text/chapter-3',
      },
      {
        title: 'Texas Instruments · Predicting slew-rate-limited response',
        url: 'https://www.ti.com/lit/pdf/snoa726',
      },
    ],
    number: '180',
  },
  {
    slug: 'orbital-transfer',
    name: '霍曼轨道转移',
    title: '到了目标高度，为什么还要再点火？',
    question: '升轨两次加速，中间的速度为什么反而下降？',
    description:
      '沿真实开普勒时间比较瞬时脉冲、无推力滑行、远端圆轨道速度与省略第二次点火后的返回。',
    color: '#baa27c',
    tag: '轨道机动',
    related: ['kepler-orbits', 'earth-day'],
    sources: [
      {
        title: 'NASA: Space Mathematics',
        url: 'https://science.nasa.gov/wp-content/uploads/2023/10/Space_Mathematics.pdf',
      },
      {
        title: 'a.i. solutions: Hohmann Transfer',
        url: 'https://ai-solutions.com/_freeflyeruniversityguide/hohmann_transfer.htm',
      },
    ],
    number: '179',
  },
  {
    slug: 'venturi-meter',
    name: '文丘里流量计',
    title: '不数水滴，怎样用压差测流量？',
    question: '两处静压口能告诉我们流量的大小和方向吗？',
    description:
      '从连续的双液差压管反推流量，用真实体积坐标追踪喉部加速、理想压力恢复、零流量与反向歧义。',
    tag: '差压测量',
    color: '#8ea69a',
    related: ['bernoulli', 'hydrostatic-pressure', 'water-hammer'],
    sources: [
      {
        title: 'USBR Water Measurement Manual, Chapter 2 §14 Tube-type flowmeters',
        url: 'https://www.usbr.gov/tsc/techreferences/mands/wmm/chap02_14.html',
      },
      {
        title: 'USBR Water Measurement Manual, Chapter 2 §15 Equation coefficients',
        url: 'https://www.usbr.gov/tsc/techreferences/mands/wmm/chap02_15.html',
      },
      {
        title: 'OpenStax University Physics 1, §14.6 Bernoulli equation',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/14-6-bernoullis-equation',
      },
    ],
    number: '178',
  },
  {
    slug: 'bjt-amplifier',
    name: '晶体管放大器',
    title: '小信号怎样控制更大的电压变化？',
    question: '反相、削顶与负反馈从哪里产生？',
    description: '沿共射极电路的偏置、电阻压降和功率流，比较小信号、饱和与发射极反馈。',
    color: '#b5bea0',
    tag: '偏置与放大',
    related: ['diode-junction', 'rc-circuit', 'rectifier'],
    sources: [
      {
        title: 'MIT · Bipolar transistors and the Ebers–Moll model',
        url: 'https://ocw.mit.edu/courses/2-141-modeling-and-simulation-of-dynamic-systems-fall-2006/37f99f992795609a21a878e612dca0bc_bipolar_transist.pdf',
      },
      {
        title: 'Analog Devices · Common emitter amplifier',
        url: 'https://ez.analog.com/adiacademy/university-program/a/studentzone-articles/SA964/adalm2000-activity-common-emitter-amplifier',
      },
    ],
    number: '177',
  },
  {
    slug: 'earth-day',
    name: '恒星日与太阳日',
    title: '转完一整圈，为什么还没回到正午？',
    question: '一天相对恒星和相对太阳，为什么长度不同？',
    description: '让自转与公转共享角速度模型，对照恒星重现、太阳正午、停止公转和反向自转。',
    color: '#99aec6',
    tag: '天文时间',
    related: ['seasons', 'kepler-orbits'],
    sources: [
      {
        title: 'NASA: Telling Time by the Stars',
        url: 'https://www.grc.nasa.gov/www/K-12/Numbers/Math/Mathematical_Thinking/telling_time_by_the_stars.htm',
      },
      {
        title: 'US Naval Observatory: Sidereal Time',
        url: 'https://aa.usno.navy.mil/data/siderealtime',
      },
    ],
    number: '176',
  },
  {
    slug: 'hydrostatic-pressure',
    name: '静水压',
    title: '容器装水更多，底压就一定更大吗？',
    question: '同深压强、容器形状与壁面承重，如何同时成立？',
    description: '用真实连通剖面比较同深读数，区分密度、液面气压和总液重，再放大膜片面积与作用力。',
    tag: '压力与边界',
    color: '#8da89b',
    related: ['buoyancy', 'hydraulic-brake', 'water-hammer'],
    sources: [
      {
        title: 'OpenStax University Physics 1, §14.1 Fluids, density and pressure',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/14-1-fluids-density-and-pressure',
      },
      {
        title: 'OpenStax University Physics 1, §14.2 Measuring pressure',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/14-2-measuring-pressure',
      },
    ],
    number: '175',
  },
  {
    slug: 'diode-junction',
    name: 'PN结二极管',
    title: '二极管真的到0.7伏才导通吗？',
    question: '耗尽区里有什么，偏置改变了什么？',
    description: '从固定离子、电势剖面和耗尽宽度，追踪偏置到端电流的联系。',
    color: '#bec4a0',
    tag: '势垒与载流子',
    related: ['rectifier', 'solar-cell', 'capacitor-fields', 'bjt-amplifier'],
    sources: [
      {
        title: 'MIT 6.012 · p–n junction electrostatics',
        url: 'https://ocw.mit.edu/courses/6-012-microelectronic-devices-and-circuits-fall-2009/resources/mit6_012f09_lec04/',
      },
      {
        title: 'MIT 6.012 · p–n junction I–V relationship',
        url: 'https://ocw.mit.edu/courses/6-012-microelectronic-devices-and-circuits-fall-2009/resources/mit6_012f09_lec06/',
      },
    ],
    number: '174',
  },
  {
    slug: 'voronoi',
    name: 'Voronoi 图',
    title: '怎样把每个位置分给最近的站点？',
    question: '距离相等、站点重合或途中有墙时，“最近”还唯一吗？',
    description: '用实际半平面求交生成区域，移动站点、检查等距边界，再对照直线最近与绕墙最短。',
    color: '#abb897',
    tag: '计算几何',
    related: ['astar-search', 'dijkstra'],
    sources: [
      {
        title: 'David Mount: Computational Geometry, Voronoi Diagrams',
        url: 'https://www.cs.cmu.edu/afs/cs/academic/class/15456-s14/Handouts/cmsc754-lects.pdf',
      },
      {
        title: 'MIT: Planar Voronoi Diagrams',
        url: 'https://groups.csail.mit.edu/graphics/classes/6.838/F01/lectures/Voronoi/Voronoi2D.pdf',
      },
    ],
    number: '173',
  },
  {
    slug: 'buoyancy',
    name: '浮力',
    title: '沉下去的物体，还有浮力吗？',
    question: '排液体积、压力差与浮沉，怎样用同一组力解释？',
    description:
      '追踪真实浸没高度与上下压力差，从定位下放、放手上浮到加重下沉，再比较不同液体中的平衡吃水。',
    tag: '排液与平衡',
    color: '#85a59a',
    related: ['convection', 'hydraulic-brake', 'water-hammer'],
    sources: [
      {
        title: 'OpenStax University Physics 1, §14.4 Archimedes principle and buoyancy',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/14-4-archimedes-principle-and-buoyancy',
      },
    ],
    number: '172',
  },
  {
    slug: 'growth-logistic',
    name: '逻辑斯谛增长',
    title: '接近承载量之前，为什么增长先快后慢？',
    question: '人均增速在下降，总增速为什么仍能上升？',
    description: '把连续数量曲线与即时增速对照，检查半承载量峰值、超载下降、承载量切换和零值边界。',
    color: '#98ad83',
    tag: '种群模型',
    related: ['diffusion', 'markov-chain'],
    sources: [
      {
        title: 'OpenStax Calculus: The Logistic Equation',
        url: 'https://openstax.org/books/calculus-volume-2/pages/4-4-the-logistic-equation',
      },
      {
        title: 'OpenStax Biology: Environmental Limits',
        url: 'https://openstax.org/books/biology-2e/pages/45-3-environmental-limits-to-population-growth',
      },
    ],
    number: '171',
  },
  {
    slug: 'adiabatic-compression',
    name: '绝热压缩',
    title: '没有传入热量，气体为什么会变热？',
    question: '活塞功、热边界与内能怎样一起决定温度？',
    description:
      '追踪隔热活塞、真实pV功面积与能量账本，比较等温边界、热容比、反向膨胀和真空自由膨胀反例。',
    tag: '做功与内能',
    color: '#ae9870',
    related: ['ideal-gas', 'heat-conduction', 'refrigerator'],
    sources: [
      {
        title: 'OpenStax University Physics 2, §3.6 Adiabatic processes for an ideal gas',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/3-6-adiabatic-processes-for-an-ideal-gas',
      },
      {
        title: 'OpenStax University Physics 2, §3.3 First law of thermodynamics',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics',
      },
    ],
    number: '170',
  },
  {
    slug: 'inductor-transient',
    name: '电感瞬态',
    title: '断开开关，电流真的停了吗？',
    question: '电流走哪条路，为什么线圈电压反转？',
    description: '沿真实续流回路观察电流连续、钳位电压与磁能释放。',
    color: '#b6b69a',
    tag: '电流与磁能',
    related: ['relay', 'rc-circuit', 'capacitor-fields', 'transformer-electric'],
    sources: [
      {
        title: 'OpenStax · RL circuits',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/14-4-rl-circuits',
      },
      {
        title: 'Texas Instruments · Inductive load discharge and clamping',
        url: 'https://www.ti.com/document-viewer/lit/html/snvaa45',
      },
    ],
    number: '169',
  },
  {
    slug: 'random-walk',
    name: '随机游走',
    title: '平均位置不动，为什么足迹还在散开？',
    question: '平方根扩散与单条路径、整体漂移有什么不同？',
    description: '沿单位步长的真实轨迹比较总体分布、RMS、偏置、奇偶可达性和吸收边界。',
    color: '#8eb0b2',
    tag: '随机过程',
    related: ['markov-chain', 'central-limit-theorem', 'diffusion'],
    sources: [
      {
        title: 'MIT: Random Walks and Diffusion',
        url: 'https://math.mit.edu/classes/18.366/lec06/',
      },
      {
        title: 'Doyle and Snell: Random Walks and Electric Networks',
        url: 'https://math.dartmouth.edu/~doyle/docs/walks/walks.pdf',
      },
    ],
    number: '168',
  },
  {
    slug: 'ideal-gas',
    name: '理想气体',
    title: '无数次撞壁，怎样形成压强？',
    question: '温度、数量和容积，分别改变了撞击的什么？',
    description: '用三维弹性反射轨迹累计壁面冲量，逐项比较温度、容积、粒子数量、表压与原子质量。',
    tag: '粒子与压强',
    color: '#8da69a',
    related: ['thermal-expansion', 'brownian-motion', 'heat-conduction', 'adiabatic-compression'],
    sources: [
      {
        title: 'OpenStax University Physics 2, §2.1 Molecular model of an ideal gas',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/2-1-molecular-model-of-an-ideal-gas',
      },
      {
        title: 'OpenStax University Physics 2, §2.2 Pressure, temperature and rms speed',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/2-2-pressure-temperature-and-rms-speed',
      },
    ],
    number: '167',
  },
  {
    slug: 'central-limit-theorem',
    name: '中央极限定理',
    title: '什么在趋近正态：原始数据，还是标准化的和？',
    question: '增加次数，为什么有时仍看不见钟形？',
    description: '从精确二项分布观察求和与标准化，再检查稀少事件和完全相关复制怎样限制正态近似。',
    color: '#ac9cbd',
    tag: '概率极限',
    related: ['monte-carlo', 'markov-chain'],
    sources: [
      {
        title: 'MIT: Central Limit Theorem Conditions',
        url: 'https://live.ocw.mit.edu/courses/res-6-012-introduction-to-probability-spring-2018/7f4bafaeaf3fc2b5e4f88afb273f7d3d_IrKUM3nNXJE.pdf',
      },
      {
        title: 'UC Berkeley: Normal Approximation and CLT',
        url: 'https://www.stat.berkeley.edu/~stark/SticiGui/Text/clt.htm',
      },
    ],
    number: '166',
  },
  {
    slug: 'capacitor-fields',
    name: '电容器电场',
    title: '放入介质，电场一定变弱吗？',
    question: '电荷固定与电压固定，会得到同一个结果吗？',
    description: '沿极板电荷、介质极化与电势剖面，比较固定电荷、固定电压和分层间隙。',
    color: '#b7bc95',
    tag: '电场边界条件',
    related: ['rc-circuit', 'wheatstone-bridge', 'transformer-electric'],
    sources: [
      {
        title: 'OpenStax · Capacitor with a dielectric',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/8-4-capacitor-with-a-dielectric',
      },
      {
        title: 'OpenStax · Molecular model of a dielectric',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/8-5-molecular-model-of-a-dielectric',
      },
    ],
    number: '165',
  },
  {
    slug: 'thermal-expansion',
    name: '热膨胀',
    title: '金属板受热，孔会变小吗？',
    question: '孔、塞子与固定杆，如何共享同一个热应变？',
    description: '追踪带孔板的材料标记，放大冷热零件的配合间隙，再比较自由伸长与固定两端的热应力。',
    tag: '尺寸与约束',
    color: '#b59c75',
    related: ['heat-conduction', 'convection', 'latent-heat'],
    sources: [
      {
        title: 'OpenStax University Physics 2, §1.3 Thermal expansion',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/1-3-thermal-expansion',
      },
    ],
    number: '164',
  },
  {
    slug: 'monte-carlo',
    name: '蒙特卡洛方法',
    title: '点越多，为什么不保证每一步都更准？',
    question: '增加样本能减小随机波动，却能修复错误抽样吗？',
    description: '用实际随机前缀估计圆面积，分开单次误差、标准误差、区间与非均匀抽样造成的偏差。',
    color: '#93a680',
    tag: '随机计算',
    related: ['bayes-updating', 'markov-chain'],
    sources: [
      {
        title: 'MIT: Sampling and Monte Carlo Simulation',
        url: 'https://ocw.mit.edu/courses/6-00sc-introduction-to-computer-science-and-programming-spring-2011/resources/mit6_00scs11_lec14/',
      },
      {
        title: 'NIST: Wilson Confidence Intervals',
        url: 'https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm',
      },
    ],
    number: '163',
  },
  {
    slug: 'heat-radiation',
    name: '热辐射',
    title: '同温时，物体还在辐射吗？',
    question: '发射、吸收与净热流，为什么要分开？',
    description:
      '在理想真空黑腔里核对双向辐射，比较同温平衡、四次方温标与灰体发射率，再追踪红外谱峰。',
    tag: '辐射与收支',
    color: '#a89370',
    related: ['greenhouse-effect', 'heat-conduction', 'convection', 'ear-thermometer'],
    sources: [
      {
        title: 'OpenStax University Physics 2, §1.6 Radiation',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/1-6-mechanisms-of-heat-transfer',
      },
      {
        title: 'OpenStax University Physics 3, §6.1 Blackbody radiation',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/6-1-blackbody-radiation',
      },
    ],
    number: '162',
  },
  {
    slug: 'markov-chain',
    name: '马尔可夫链',
    title: '分布稳定，为什么个体还在切换？',
    question: '有稳态，是否一定会从任意起点走向它？',
    description: '沿概率质量的流动理解转移矩阵与稳态，再用周期翻转和完全不转移检查收敛与唯一性。',
    color: '#8ea9bf',
    tag: '概率过程',
    related: ['bayes-updating', 'diffusion'],
    sources: [
      {
        title: 'MIT 18.445: Stationary Distributions',
        url: 'https://ocw.mit.edu/courses/18-445-introduction-to-stochastic-processes-spring-2015/2edaa8542469ce692226813a8bd1ec88_MIT18_445S15_lecture2.pdf',
      },
      {
        title: 'MIT RES.6-012: Markov Chains',
        url: 'https://ocw.mit.edu/courses/res-6-012-introduction-to-probability-spring-2018/resources/lecture-videos/',
      },
    ],
    number: '161',
  },
  {
    slug: 'center-of-mass',
    name: '质心',
    title: '配重向右走，平台为什么向左退？',
    question: '内部运动能把整个系统带走吗？',
    description: '在固定地面刻线前移动平台内的配重，追踪质量加权的位置、相反位移、匀速与外力加速。',
    color: '#a6b799',
    tag: '整体与内部运动',
    related: ['elastic-collision', 'angular-momentum', 'lever'],
    sources: [
      {
        title: 'OpenStax · Center of mass',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/9-6-center-of-mass',
      },
      {
        title: 'MIT OCW · Center of mass and motion of the center of mass',
        url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-5-momentum-and-impulse/',
      },
    ],
    number: '160',
  },
  {
    slug: 'helmholtz-resonator',
    name: '亥姆霍兹共鸣器',
    title: '往瓶子里装水，为什么音调会升高？',
    question: '颈部的一小段空气，怎样与整腔空气一起共鸣？',
    description:
      '从空气柱惯性与腔体压缩出发，逐项改变体积、颈长和截面积，再追踪端修正带来的有效质量。',
    tag: '空气弹簧',
    color: '#809c94',
    related: ['organ-pipe', 'resonance', 'acoustic-reflection'],
    sources: [
      {
        title: 'UNSW Music Acoustics: Helmholtz resonance',
        url: 'https://newt.phys.unsw.edu.au/jw/Helmholtz.html',
      },
    ],
    number: '159',
  },
  {
    slug: 'organ-pipe',
    name: '风琴管',
    title: '塞住顶端，为什么能低一个八度？',
    question: '开放端与封闭端，分别让空气怎样振动？',
    description:
      '将纵向粒子运动与压力剖面相连，比较开放、塞闭与奇数模态，再改变长度并放大管口的端修正。',
    tag: '声柱与边界',
    color: '#789784',
    related: ['standing-wave', 'acoustic-reflection', 'resonance', 'helmholtz-resonator'],
    sources: [
      {
        title: 'UNSW Music Acoustics: Pipes and harmonics, cylindrical and conical bores',
        url: 'https://newt.phys.unsw.edu.au/jw/pipes.html',
      },
      {
        title: 'UNSW Physclips: Acoustic impedance, intensity and power',
        url: 'https://www.animations.physics.unsw.edu.au/jw/sound-impedance-intensity.htm',
      },
    ],
    number: '158',
  },
  {
    slug: 'elastic-collision',
    name: '弹性碰撞',
    title: '弹性碰撞：能量在接触里去了哪里？',
    question: '碰撞时变慢的能量，会回来吗？',
    description: '近看两车弹簧压缩与回弹，追踪动量、暂存能量、质量差异和质心参考系。',
    color: '#afba92',
    tag: '碰撞与储能',
    related: ['angular-momentum', 'flywheel', 'lever', 'center-of-mass'],
    sources: [
      {
        title: 'OpenStax · Types of collisions',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/9-4-types-of-collisions',
      },
      {
        title: 'OpenStax · Center of mass',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/9-6-center-of-mass',
      },
    ],
    number: '157',
  },
  {
    slug: 'principal-components',
    name: '主成分分析',
    title: '投影到哪条轴，才能保留最多变化？',
    question: '保留最大方差，为什么也会最小化正交重建误差？',
    description: '中心化、旋转与重建真实点云，再用单位变换和等方差数据检查主轴的适用边界。',
    color: '#ba9c78',
    tag: '数据分析',
    related: ['dimensions', 'jpeg', 'gradient-descent'],
    sources: [
      {
        title: 'Stanford CS229: PCA and Reconstruction Error',
        url: 'https://cs229.stanford.edu/notes2022fall/pca-annotated.pdf',
      },
      {
        title: 'CMU: Principal Components Analysis',
        url: 'https://www.stat.cmu.edu/~cshalizi/dst/26/lectures/03/lecture-03.html',
      },
    ],
    number: '156',
  },
  {
    slug: 'gradient-descent',
    name: '梯度下降',
    title: '方向朝下，步子太大仍会越走越高',
    question: '为什么有的之字形逐渐收敛，有的反而放大？',
    description: '在可解析的二次损失上核对真实梯度、迭代、收敛之字形、发散与临界步长。',
    color: '#91ab84',
    tag: '优化',
    related: ['transformer', 'dimensions', 'noise', 'growth-logistic'],
    sources: [
      {
        title: 'Cornell: Gradient-based Optimization',
        url: 'https://www.cs.cornell.edu/courses/cs3780/2025sp/notes/lec10-gd-newton.pdf',
      },
      {
        title: 'Boyd and Vandenberghe: Convex Optimization, §9.3',
        url: 'https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf',
      },
    ],
    number: '155',
  },
  {
    slug: 'acoustic-reflection',
    name: '声反射',
    title: '声音返回时，什么翻转，什么守恒？',
    question: '透射压力更大，为什么不代表能量更多？',
    description: '用同一脉冲比较高低阻抗、压力与粒子速度，再核对能量和声速不同但阻抗匹配的反例。',
    tag: '阻抗与能流',
    color: '#7c9ca8',
    related: ['ultrasound', 'standing-wave', 'resonance'],
    sources: [
      {
        title: 'UNSW Physclips: Acoustic impedance, intensity and power',
        url: 'https://www.animations.physics.unsw.edu.au/jw/sound-impedance-intensity.htm',
      },
      {
        title: 'Daniel A. Russell, Penn State: Phase Between Pressure and Particle Velocity',
        url: 'https://www.acs.psu.edu/drussell/Demos/phase-p-u/phase-p-u.html',
      },
    ],
    number: '154',
  },
  {
    slug: 'angular-momentum',
    name: '角动量',
    title: '收拢就加速，能量从哪里来？',
    question: '角动量没增加，为什么转得更快？',
    description: '在同一转台上移动两个滑块，追踪转动惯量、角速度、内部做功与外力矩。',
    color: '#a1b593',
    tag: '守恒与做功',
    related: ['flywheel', 'gyroscope', 'lever'],
    sources: [
      {
        title: 'OpenStax · Conservation of angular momentum',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/11-3-conservation-of-angular-momentum',
      },
    ],
    number: '153',
  },
  {
    slug: 'convolution',
    name: '离散卷积',
    title: '翻转、滑动，相乘再相加',
    question: '为什么非对称核能看出卷积与相关的不同？',
    description: '从单位脉冲到逐项贡献，核对真实卷积、相关差异，以及裁剪和循环边界的结果。',
    color: '#aa97bd',
    tag: '信号处理',
    related: ['fourier-transform', 'wave-interference', 'noise'],
    sources: [
      {
        title: 'MIT Signals and Systems: Lecture 4 Convolution',
        url: 'https://ocw.mit.edu/courses/res-6-007-signals-and-systems-spring-2011/resources/lecture-4-convolution/',
      },
      {
        title: 'MIT Signals, Systems and Inference, Chapter 2',
        url: 'https://ocw.mit.edu/courses/6-011-introduction-to-communication-control-and-signal-processing-spring-2010/4599f6cff8a3890477f4c4986db032a2_MIT6_011S10_chap02.pdf',
      },
    ],
    number: '152',
  },
  {
    slug: 'mirage',
    name: '海市蜃楼',
    title: '热路面为什么看起来像有水？',
    question: '天空的光，怎样从接近路面的方向进入眼睛？',
    description:
      '追踪厘米级热空气薄层中的连续弯曲，比较真实光路与入眼切线，并测试角度和眼高的边界。',
    tag: '梯度折射与视线',
    color: '#9bb3ab',
    related: ['refraction', 'total-internal-reflection', 'heat-conduction'],
    sources: [
      {
        title: 'Michael J. Ruiz (2019), Road mirage angle, Physics Education 54, 065009',
        url: 'https://www.mjtruiz.com/publications/2019-11-mirage.pdf',
      },
      {
        title: 'Atmospheric Optics: Air Temperatures, Mirages & Green Flashes',
        url: 'https://www.atoptics.org.uk/atoptics/mirtemp.htm',
      },
    ],
    number: '151',
  },
  {
    slug: 'gyroscope',
    name: '陀螺仪',
    title: '陀螺：重力为什么让轴转向？',
    question: '重力向下，陀螺轴为什么绕着转？',
    description: '从支点、重力矩与角动量方向理解水平进动，比较自转快慢、反向和零重力矩。',
    color: '#93aaa2',
    tag: '空间转动',
    related: ['flywheel', 'centrifugal-governor', 'lever'],
    sources: [
      {
        title: 'OpenStax · Precession of a gyroscope',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/11-4-precession-of-a-gyroscope',
      },
      {
        title: 'MIT 8.01SC · Nutation and the full angular momentum of a gyroscope',
        url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/bf05a2580eca7a3a92d0a770e608af76_5oLLnCGStUc.pdf',
      },
    ],
    number: '150',
  },
  {
    slug: 'run-length-encoding',
    name: '游程编码',
    title: '一串相同字节，怎样变成次数和值？',
    question: '为什么长色带能缩小，细竖纹反而变大？',
    description: '扫描真实字节、序列化计数与值、完整解码，并比较长段、短段和变长计数边界。',
    color: '#aa9a68',
    tag: '无损编码',
    related: ['lz77', 'huffman', 'jpeg'],
    sources: [
      {
        title: 'Microsoft: Bitmap Compression RLE modes',
        url: 'https://learn.microsoft.com/en-us/windows/win32/gdi/bitmap-compression',
      },
      {
        title: 'WebAssembly: unsigned LEB128',
        url: 'https://webassembly.github.io/spec/core/binary/values.html#integers',
      },
    ],
    number: '149',
  },
  {
    slug: 'spherical-aberration',
    name: '球差',
    title: '为什么调焦之后，光仍聚不成一点？',
    question: '不同高度的光，为什么没有同一个最佳焦点？',
    description:
      '用真实三维反射追踪球面的焦区与光斑，分别测试接收面、有效口径和抛物面校正，再检查离轴边界。',
    tag: '面形与几何像差',
    color: '#708d83',
    related: ['camera-lens', 'telescope', 'fresnel-lens'],
    sources: [
      {
        title:
          'OpenStax University Physics 3, §2.2 Spherical Mirrors: spherical aberration and coma',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/2-2-spherical-mirrors',
      },
      {
        title: 'Nikon Sport Optics Guide: Aberrations',
        url: 'https://imaging.nikon.com/sport-optics/guide/binoculars/technologies/technologies_08/',
      },
    ],
    number: '148',
  },
  {
    slug: 'diffie-hellman',
    name: 'Diffie–Hellman 协商',
    title: '只交换公开值，怎样各自算出同一个秘密？',
    question: '算出相同共享值，为什么还不能确定对端是谁？',
    description: '逐项核对小群指数交换、共享值一致、穷举边界与主动替换公钥的中间人反例。',
    color: '#8fafad',
    tag: '密码学',
    related: ['digital-signature', 'hash', 'network'],
    sources: [
      {
        title: 'RFC 2631: Diffie–Hellman Key Agreement, §§2.1.1/2.1.5',
        url: 'https://www.rfc-editor.org/rfc/rfc2631.html',
      },
    ],
    number: '147',
  },
  {
    slug: 'digital-signature',
    name: '数字签名',
    title: '公开消息与公钥，怎样核对私钥签出的证明？',
    question: '签名没有隐藏消息，为何仍能检出被改动的内容？',
    description:
      '用明确不安全的小群 Schnorr 算术检查公开验签、消息与公钥绑定，以及 nonce 复用泄密。',
    color: '#b99b91',
    tag: '密码学',
    related: ['hash', 'merkle-tree', 'network', 'diffie-hellman'],
    sources: [
      {
        title: 'RFC 9591: Single-Party Schnorr Signatures, Appendix D',
        url: 'https://www.rfc-editor.org/rfc/rfc9591.html#appendix-D',
      },
      {
        title: 'RFC 8235: Schnorr Finite-Field Groups and Fiat–Shamir',
        url: 'https://www.rfc-editor.org/rfc/rfc8235.html',
      },
    ],
    number: '146',
  },
  {
    slug: 'flywheel',
    name: '飞轮',
    title: '飞轮：把多余能量留到下一刻',
    question: '输入忽强忽弱，飞轮怎样减小转速波动？',
    description: '沿转矩差与动能变化观察飞轮储能、同质量分布、有限续转和启动代价。',
    color: '#9caf94',
    tag: '转动储能',
    related: ['centrifugal-governor', 'four-stroke-engine', 'sewing-machine', 'angular-momentum'],
    sources: [
      {
        title: 'OpenStax · Moment of inertia and rotational kinetic energy',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/10-4-moment-of-inertia-and-rotational-kinetic-energy',
      },
      {
        title: 'NPTEL · Power smoothing by flywheels',
        url: 'https://archive.nptel.ac.in/content/storage2/courses/112101096/Mod%206/Lec1/6.1_5.html',
      },
    ],
    number: '145',
  },
  {
    slug: 'moire',
    name: '摩尔纹',
    title: '两层细纹，为什么长出更大的条纹？',
    question: '细纹轻轻一动，大条纹为什么移动那么多？',
    description:
      '在同一物理坐标中叠乘两层透射光栅，追踪周期、转角与平移如何产生差频及放大的重合运动。',
    tag: '空间差频与重合',
    color: '#889ba5',
    related: ['sampling-aliasing', 'wave-interference', 'diffraction-grating'],
    sources: [
      {
        title: 'University of Iowa Physics: Moiré Transparencies3B50.40',
        url: 'https://instructional-resources.physics.uiowa.edu/3b5040-moire-transparencies',
      },
    ],
    number: '144',
  },
  {
    slug: 'merkle-tree',
    name: 'Merkle 树',
    title: '不用传全部内容，怎样验证其中一项？',
    question: '两个兄弟哈希，怎样重建四项内容的可信根？',
    description: '用真实 SHA-256 构造有序哈希树，逐层核对包含证明，再区分内容篡改与根的来源信任。',
    color: '#b197a7',
    tag: '数据完整性',
    related: ['hash', 'bloom-filter', 'network'],
    sources: [
      {
        title: 'RFC 9162: Merkle Tree Hash and Inclusion Proofs',
        url: 'https://www.rfc-editor.org/rfc/rfc9162.html#section-2.1',
      },
    ],
    number: '143',
  },
  {
    slug: 'stereoscopic-vision',
    name: '双目立体视觉',
    title: '两幅稍有不同的图，怎样透露深度？',
    question: '视差的正负、大小和配对，分别告诉我们什么？',
    description:
      '把两眼视线与登记后的左右图连接，分别改变物距、基线和注视距离，再用错误配对检验深度推算。',
    tag: '投影与对应',
    color: '#9eae93',
    related: ['stellar-parallax', 'myopia-lens', 'camera-lens', 'lidar-ranging'],
    sources: [
      {
        title: 'OpenStax Psychology2e, §5.3 Vision: depth perception',
        url: 'https://openstax.org/books/psychology-2e/pages/5-3-vision',
      },
      {
        title: 'OpenCV: Depth Map from Stereo Images',
        url: 'https://docs.opencv.org/4.x/dd/d53/tutorial_py_depthmap.html',
      },
    ],
    number: '142',
  },
  {
    slug: 'raft-consensus',
    name: 'Raft 共识',
    title: '网络分成两半，谁还能确认下一条命令？',
    question: '复制到多数之后，为什么旧任期日志仍不能直接提交？',
    description: '追踪五节点选举、少数分区、日志修复，以及当前任期提交旧前缀的安全条件。',
    color: '#9ba8c3',
    tag: '分布式系统',
    related: ['network', 'write-ahead-log', 'database-transactions'],
    sources: [
      {
        title: 'Ongaro & Ousterhout: In Search of an Understandable Consensus Algorithm',
        url: 'https://raft.github.io/raft.pdf',
      },
    ],
    number: '141',
  },
  {
    slug: 'color-mixing',
    name: '色光混合',
    title: '加在一起变白，叠在一起却变暗？',
    question: '光束相加与滤片串联，究竟做了什么不同的运算？',
    description:
      '从真实线性光强叠加切到CMY串联过滤，跟踪三个通道的能量，再改变照明检验颜色的条件。',
    tag: '光强与透射',
    color: '#8cac94',
    related: ['printer', 'rayleigh-scattering', 'prism-dispersion'],
    sources: [
      {
        title: 'Stanford CS178: Additive versus subtractive color mixing',
        url: 'https://graphics.stanford.edu/courses/cs178/applets/colormixing.html',
      },
      {
        title: 'Exploratorium ColorFest: What Is Color?',
        url: 'https://annex.exploratorium.edu/colorfest/whatiscolor.html',
      },
      {
        title: 'W3C CSS Color4: Color conversion sample code',
        url: 'https://www.w3.org/TR/css-color-4/#color-conversion-code',
      },
    ],
    number: '140',
  },
  {
    slug: 'centrifugal-governor',
    name: '离心调速器',
    title: '离心调速器：稳定了，为何还没回到原速？',
    question: '飞球怎样通过阀门稳住转速？',
    description: '沿飞球、套筒和阀门追踪负反馈，比较断开连接、稳态偏差与响应滞后。',
    color: '#b19b6e',
    tag: '机械反馈',
    related: ['four-stroke-engine', 'cam-follower', 'escapement'],
    sources: [
      {
        title: 'J. C. Maxwell · On Governors (1868)',
        url: 'https://webhomes.maths.ed.ac.uk/~v1ranick/papers/maxwell1.pdf',
      },
      {
        title: 'IGNOU · Governors',
        url: 'https://egyankosh.ac.in/bitstream/123456789/31876/1/Unit-12.pdf',
      },
    ],
    number: '139',
  },
  {
    slug: 'write-ahead-log',
    name: '预写日志',
    title: '数据页还是旧值，为何已经可以确认成功？',
    question: '掉电后，日志怎样恢复尚未写入数据页的修改？',
    description: '沿内存、顺序日志与持久数据页检查五个故障边界，区分修改记录、提交与客户端确认。',
    color: '#b3a477',
    tag: '数据库',
    related: ['raft-consensus', 'database-transactions', 'database-index', 'lz77'],
    sources: [
      {
        title: 'PostgreSQL 18: Write-Ahead Logging',
        url: 'https://www.postgresql.org/docs/18/wal-intro.html',
      },
      {
        title: 'PostgreSQL 18: Asynchronous Commit',
        url: 'https://www.postgresql.org/docs/18/wal-async-commit.html',
      },
    ],
    number: '138',
  },
  {
    slug: 'fresnel-lens',
    name: '菲涅耳透镜',
    title: '透镜变薄，为什么仍能聚光？',
    question: '同心环带的哪一部分真正改变光的方向？',
    description:
      '从真实环带曲面求法线和折射路径，对比连续透镜的体积，再用折射率匹配与环间相位检验聚光的边界。',
    tag: '环带曲面与折射',
    color: '#8d9f85',
    related: ['refraction', 'camera-lens', 'diffraction'],
    sources: [
      {
        title: 'Edmund Optics: Advantages of Fresnel Lenses',
        url: 'https://www.edmundoptics.eu/knowledge-center/application-notes/optics/advantages-of-fresnel-lenses/',
      },
      {
        title: 'OpenStax University Physics 3, §1.3 Refraction',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/1-3-refraction',
      },
    ],
    number: '137',
  },
  {
    slug: 'rayleigh-scattering',
    name: '瑞利散射',
    title: '蓝天与暖色直达光，怎样来自同一束光？',
    question: '散射为什么偏爱短波长，却不会把红光变蓝？',
    description:
      '逐波长核对直达与散射收支，比较四次方选择、角分布与长路径，再把整段光谱和视觉响应连接。',
    tag: '光谱与散射',
    color: '#6d8fa7',
    related: ['rainbow', 'polarization', 'prism-dispersion'],
    sources: [
      {
        title: 'NASA GSFC: Rayleigh Scattering',
        url: 'https://acd-ext.gsfc.nasa.gov/anonftp/acd/daac_ozone/Lecture4/Text/Lecture_4/rayleigh.html',
      },
      {
        title: 'NASA Science: Wave Behaviors',
        url: 'https://science.nasa.gov/ems/03_behaviors/',
      },
      {
        title: 'American Meteorological Society: Rayleigh phase function',
        url: 'https://glossary.ametsoc.org/wiki/rayleigh-phase-function/',
      },
      {
        title:
          'Wyman, Sloan & Shirley (2013): Simple Analytic Approximations to the CIE XYZ Color Matching Functions',
        url: 'https://jcgt.org/published/0002/02/01/paper.pdf',
      },
      {
        title: 'OpenStax University Physics 3, §6.1 Blackbody Radiation',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/6-1-blackbody-radiation',
      },
    ],
    number: '136',
  },
  {
    slug: 'database-transactions',
    name: '数据库事务',
    title: '一起提交，为何仍会把一张票卖两次？',
    question: '原子性保护整笔修改，谁来保护并发读到的旧值？',
    description: '用公共库存和两笔私有草稿区分原子提交、回滚、旧读数覆盖与版本校验重试。',
    color: '#ad8fa1',
    tag: '数据库',
    related: ['write-ahead-log', 'database-index', 'bloom-filter', 'lz77'],
    sources: [
      {
        title: 'PostgreSQL: Transactions',
        url: 'https://www.postgresql.org/docs/current/tutorial-transactions.html',
      },
      {
        title: 'PostgreSQL: Transaction Isolation',
        url: 'https://www.postgresql.org/docs/current/transaction-iso.html',
      },
    ],
    number: '135',
  },
  {
    slug: 'ratchet',
    name: '棘轮',
    title: '棘轮：单向不等于没有空回',
    question: '能挡住反转，为什么还会退一点？',
    description: '沿斜面、陡面和滑动棘爪观察单向约束、空回角与抬起解锁。',
    color: '#a6b798',
    tag: '单向约束',
    related: ['bicycle', 'escapement', 'geneva-drive'],
    sources: [
      {
        title: 'NPTEL · Ratchet and pawl indexing',
        url: 'https://archive.nptel.ac.in/content/storage2/courses/112103174/module4/lec5/1.html',
      },
      {
        title: 'US7131353B2 · Sliding-pawl ratcheting tools',
        url: 'https://patents.google.com/patent/US7131353B2/en',
      },
    ],
    number: '134',
  },
  {
    slug: 'max-flow',
    name: '最大流',
    title: '撤回一次旧分配，总流量反而增加',
    question: '为什么正向看似堵死，反向残余还能把总量从 3 提到 4？',
    description: '逐步分配容量、撤回中间边的旧流量，再用等容量割证明网络已经达到上界。',
    color: '#8daab7',
    tag: '图算法',
    related: ['network', 'dijkstra', 'congestion-control'],
    sources: [
      {
        title: 'Princeton: Maxflow and Mincut Study Guide',
        url: 'https://www.cs.princeton.edu/courses/archive/fall15/cos226/lectures/study/64MaxFlow.html',
      },
      {
        title: 'MIT: Maximum Flow',
        url: 'https://ocw.mit.edu/courses/6-854j-advanced-algorithms-fall-2005/8346e77d563c80b0ae714a21bc9a4541_max_flow_dff.pdf',
      },
    ],
    number: '133',
  },
  {
    slug: 'retroreflector',
    name: '回归反射器',
    title: '三面镜子怎样把光送回来的方向？',
    question: '为什么返回的光不一定重走原路？',
    description:
      '逐次追踪有限直角镜中的真实碰撞，比较一面、两面、三面反射，并观察横向偏移和入口边界。',
    tag: '三维反射与追迹',
    color: '#5f8581',
    related: ['total-internal-reflection', 'lidar-ranging', 'polarization'],
    sources: [
      {
        title: 'Ansys Optics: How to model corner-cube retroreflectors',
        url: 'https://optics.ansys.com/hc/en-us/articles/43071088719763-How-to-model-corner-cube-retroreflectors',
      },
      {
        title: 'Edmund Optics: N-BK7 Corner Cube Retroreflectors',
        url: 'https://www.edmundoptics.com/f/n-bk7-corner-cube-retroreflectors/12447/',
      },
    ],
    number: '132',
  },
  {
    slug: 'telescope',
    name: '望远镜',
    title: '望远镜把什么放大，又把什么变小？',
    question: '看清远处，为什么眼睛还要站对位置？',
    description:
      '沿物镜、中间实像和目镜追踪成像，再把出瞳放大看，连接角放大率、光束直径与眼睛位置。',
    tag: '成像与出瞳',
    color: '#466d79',
    related: ['camera-lens', 'myopia-lens', 'refraction'],
    sources: [
      {
        title: 'OpenStax University Physics 3, §2.8 Microscopes and Telescopes',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/2-8-microscopes-and-telescopes',
      },
      {
        title: 'Edmund Optics: Telescope Optics for Hobbyists',
        url: 'https://www.edmundoptics.com/knowledge-center/application-notes/optics/telescope-optics-for-hobbyists/',
      },
    ],
    number: '131',
  },
  {
    slug: 'astar-search',
    name: 'A* 搜索',
    title: '朝向目标，还要算上已经付出的成本',
    question: '为什么把剩余距离估计放大，会找到更贵的路线？',
    description: '在有墙与不同进入成本的地图上追踪 g+h、合法下界、过高估计和不可达边界。',
    color: '#95a47c',
    tag: '图算法',
    related: ['dijkstra', 'network', 'database-index'],
    sources: [
      {
        title: 'Russell & Norvig: Informed Search',
        url: 'https://aima.cs.berkeley.edu/slides-pdf/chapter04a.pdf',
      },
    ],
    number: '130',
  },
  {
    slug: 'topological-sort',
    name: '拓扑排序',
    title: '前提全部解除，下一步才可执行',
    question: '为什么完成 A，还不能立即执行 D？',
    description: '跟随剩余入度逐项释放依赖，比较不同有效顺序，并用真实环解释阻塞。',
    color: '#b49b7b',
    tag: '图算法',
    related: ['cpu-pipeline', 'dijkstra', 'database-index'],
    sources: [
      {
        title: 'Princeton: Directed Graphs',
        url: 'https://algs4.cs.princeton.edu/42digraph/',
      },
      {
        title: 'Sedgewick & Wayne: Directed Graphs',
        url: 'https://algs4.cs.princeton.edu/lectures/keynote/42DirectedGraphs.pdf',
      },
    ],
    number: '129',
  },
  {
    slug: 'union-find',
    name: '并查集',
    title: '压短一条父链，为什么不会改变同组关系？',
    question: '查找经过的路径，怎样让下一次查找更短？',
    description: '从八个独立集合到按大小合并，再追踪路径压缩与重复合并的真实变化。',
    color: '#8da68f',
    tag: '数据结构',
    related: ['dijkstra', 'network', 'hash'],
    sources: [
      {
        title: 'Princeton: Union-Find',
        url: 'https://algs4.cs.princeton.edu/15uf/',
      },
      {
        title: 'Sedgewick & Wayne: Union-Find lecture',
        url: 'https://algs4.cs.princeton.edu/lectures/keynote/15UnionFind.pdf',
      },
    ],
    number: '128',
  },
  {
    slug: 'geneva-drive',
    name: '日内瓦机构',
    title: '日内瓦机构：输入不停，输出为何停歇？',
    question: '电机一直转，槽轮为什么一走一停？',
    description: '跟住驱动销进入径向槽，再看锁止圆弧接手，比较槽数与分度时间。',
    color: '#83a99b',
    tag: '分度与停歇',
    related: ['cam-follower', 'escapement', 'sewing-machine'],
    sources: [
      {
        title: 'NPTEL · Geneva indexing mechanism',
        url: 'https://archive.nptel.ac.in/content/storage2/courses/112103174/module4/lec5/2.html',
      },
      {
        title: 'NPTEL · Indexing applications',
        url: 'https://archive.nptel.ac.in/content/storage2/courses/112103174/module4/lec5/3.html',
      },
    ],
    number: '127',
  },
  {
    slug: 'heap-priority-queue',
    name: '堆优先队列',
    title: '最高优先级，怎样一直留在根上？',
    question: '为什么弹出根之后，必须与较大的孩子交换？',
    description: '沿同一个二叉堆追踪插入、上浮、弹出与下沉，区分局部堆序和全局排序。',
    color: '#94a9bb',
    tag: '数据结构',
    related: ['dijkstra', 'quicksort', 'cpu-pipeline'],
    sources: [
      {
        title: 'Princeton: Priority Queues',
        url: 'https://algs4.cs.princeton.edu/24pq/',
      },
    ],
    number: '126',
  },
  {
    slug: 'universal-joint',
    name: '万向节',
    title: '万向节：一圈相同，每一瞬间也相同吗？',
    question: '输入匀速转，拐弯后的轴还匀速吗？',
    description: '沿真实叉头和十字轴连接，观察单节变速、双节抵消及夹角不等的反例。',
    color: '#719693',
    tag: '空间传动',
    related: ['differential', 'bicycle', 'planetary-gears'],
    sources: [
      {
        title: 'SDP/SI · Universal joints: kinematics and phasing',
        url: 'https://sdp-si.com/Catalogs/D757-Couplings-Universal-Joints3.php',
      },
    ],
    number: '125',
  },
  {
    slug: 'diffraction-grating',
    name: '衍射光栅',
    title: '更多条缝，为什么亮线反而更窄？',
    question: '许多束波怎样只在少数方向增强？',
    description:
      '从有限宽度多缝的真实相量和强度出发，比较缝数、间距、波长与缺级，区分干涉主峰和单缝包络。',
    color: '#a5ad88',
    tag: '光学与相干',
    related: ['thin-film-interference', 'double-slit', 'diffraction', 'prism-dispersion'],
    sources: [
      {
        title: 'OpenStax University Physics3, §4.4 Diffraction Gratings',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/4-4-diffraction-gratings',
      },
      {
        title: 'OpenStax University Physics3, §4.3 Double-Slit Diffraction: finite-width envelope',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/4-3-double-slit-diffraction',
      },
    ],
    number: '124',
  },
  {
    slug: 'prism-dispersion',
    name: '棱镜色散',
    title: '棱镜把颜色造出来了吗？',
    question: '同一束白光为什么会走向不同方向？',
    description:
      '在真实三角几何中追踪N-BK7玻璃的两次折射，用厂商色散数据与无色散对照区分材料、形状和输入光谱。',
    color: '#a2b7ae',
    tag: '光学与光谱',
    related: ['refraction', 'rainbow', 'diffraction-grating'],
    sources: [
      {
        title:
          'SCHOTT N-BK7 optical-glass datasheet: refractive indices and Sellmeier coefficients',
        url: 'https://media.schott.com/api/public/content/41e799d0bf874807a0bb8e702fbb75b5?v=54856406',
      },
      {
        title: 'MIT2.71 Optics lecture2: prisms and dispersion',
        url: 'https://ocw.mit.edu/courses/2-71-optics-spring-2009/cf9bdaeff470532f4eee57629c4ca781_MIT2_71S09_lec02.pdf',
      },
    ],
    number: '123',
  },
  {
    slug: 'total-internal-reflection',
    name: '全反射',
    title: '透明界面什么时候会像镜子？',
    question: '光为什么有时无法传播到界面外侧？',
    description: '固定同一界面追踪临界角、反射功率和外侧消逝场，分别改变入射角、折射率与传播方向。',
    color: '#6a99a2',
    tag: '光学与边界',
    related: ['refraction', 'optical-fiber', 'polarization'],
    sources: [
      {
        title: 'OpenStax University Physics 3, §1.4 Total Internal Reflection',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/1-4-total-internal-reflection',
      },
      {
        title: 'MIT2.71 Optics: dielectric interfaces and evanescent waves',
        url: 'https://web.mit.edu/2.710/Fall06/2.710-wk7-b-sl.pdf',
      },
    ],
    number: '122',
  },
  {
    slug: 'refraction',
    name: '折射',
    title: '换了介质，光一定会转弯吗？',
    question: '光线与波前怎样一起通过界面？',
    description: '由同一斯涅尔状态连接波前、介质内波长和折射角，比较正入射、折射率变化与反向传播。',
    color: '#8dafad',
    tag: '光学与传播',
    related: [
      'camera-lens',
      'optical-fiber',
      'total-internal-reflection',
      'fresnel-lens',
      'mirage',
    ],
    sources: [
      {
        title: 'OpenStax University Physics 3, §1.3 Refraction',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/1-3-refraction',
      },
      {
        title: 'MIT OCW 2.71 Optics, lecture2: refraction and dispersion',
        url: 'https://ocw.mit.edu/courses/2-71-optics-spring-2009/cf9bdaeff470532f4eee57629c4ca781_MIT2_71S09_lec02.pdf',
      },
    ],
    number: '121',
  },
  {
    slug: 'quicksort',
    name: '快速排序',
    title: '分好三段，为什么还没有完全排好？',
    question: '交换之后，扫描指针该不该继续走？',
    description:
      '追踪带身份的三向分区，观察右交换为何不前进扫描指针、重复键怎样留在中间，再比较极端与均衡分区的工作量。',
    color: '#aa97bb',
    tag: '主元 · 三向分区 · 递归',
    related: ['merge-sort', 'binary-search', 'heap-priority-queue'],
    sources: [
      {
        title: 'Princeton — Quicksort and three-way partitioning',
        url: 'https://algs4.cs.princeton.edu/23quicksort/',
      },
      {
        title: 'Robert Sedgewick — Research overview',
        url: 'https://sedgewick.io/research/',
      },
    ],
    number: '120',
  },
  {
    slug: 'merge-sort',
    name: '归并排序',
    title: '只看两个头部，为什么不会漏掉更小的数？',
    question: '把两段排好的队伍，怎样合成一队？',
    description:
      '从单项有序段开始，追踪同一批带编号的对象如何稳定合并；再用藏在头部之后的 2 检验有序前提。',
    color: '#8aaca6',
    tag: '有序段 · 头部比较 · 稳定性',
    related: ['binary-search', 'quicksort', 'heap-priority-queue'],
    sources: [
      {
        title: 'Princeton — Mergesort',
        url: 'https://algs4.cs.princeton.edu/22mergesort/',
      },
      {
        title: 'Princeton — Merge API',
        url: 'https://algs4.cs.princeton.edu/code/javadoc/edu/princeton/cs/algs4/Merge.html',
      },
    ],
    number: '119',
  },
  {
    slug: 'binary-search',
    name: '二分查找',
    title: '一次比较，为什么能丢掉半边？',
    question: '没有逐个看过的数，凭什么可以跳过？',
    description:
      '保留同一个有序数组，跟踪闭区间怎样缩小、怎样确认不存在，再用乱序反例拆掉“丢半边”的前提。',
    color: '#bca16e',
    tag: '有序 · 区间 · 不变量',
    related: ['merge-sort', 'database-index', 'bloom-filter'],
    sources: [
      {
        title: 'Princeton — Sorting and Searching',
        url: 'https://introcs.cs.princeton.edu/java/42sort/',
      },
    ],
    number: '118',
  },
  {
    slug: 'cam-follower',
    name: '凸轮从动件',
    title: '凸轮从动件：接触能跟上转速吗？',
    question: '轮子匀速转，滚子就会匀速升降吗？',
    description: '从偏心圆的真实相切关系出发，观察非匀速升降、失去接触与弹簧预压。',
    color: '#b29869',
    tag: '接触与运动',
    related: ['four-stroke-engine', 'sewing-machine', 'escapement'],
    sources: [
      {
        title: 'NPTEL · Drives and Mechanisms: Cams',
        url: 'https://archive.nptel.ac.in/content/storage2/courses/112103174/module4/lec3/1.html',
      },
      {
        title: 'NPTEL · Force-closed cam followers',
        url: 'https://archive.nptel.ac.in/content/storage2/courses/112103174/module4/lec3/3.html',
      },
    ],
    number: '117',
  },
  {
    slug: 'screw-jack',
    name: '螺旋千斤顶',
    title: '螺旋千斤顶：一圈变成一点升高',
    question: '小小的转动力矩，为什么能抬起重物？',
    description: '剖开方牙螺纹，跟踪每圈导程、输入功、摩擦与有条件的自锁。',
    color: '#ad8a59',
    tag: '螺旋与自锁',
    related: ['inclined-plane', 'lever', 'excavator'],
    sources: [
      {
        title: 'NPTEL · Mechanics: Friction in Screws',
        url: 'https://archive.nptel.ac.in/content/storage2/courses/112105164/lec17.pdf',
      },
    ],
    number: '116',
  },
  {
    slug: 'inclined-plane',
    name: '斜面',
    title: '斜面：更省力，未必更省功',
    question: '坡道越缓，搬运就越省能量吗？',
    description: '把同一负载送到同一高度，分清拉力、路径长度、重力势能与摩擦耗能。',
    color: '#9ea78c',
    tag: '力与能量',
    related: ['lever', 'pulley', 'hydraulic-brake', 'screw-jack'],
    sources: [
      {
        title: 'OpenStax · Friction',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/6-2-friction',
      },
      {
        title: 'OpenStax · Simple Machines',
        url: 'https://openstax.org/books/physics/pages/9-3-simple-machines',
      },
    ],
    number: '115',
  },
  {
    slug: 'bayes-updating',
    name: '贝叶斯更新',
    title: '同样一枚星标，为什么会得到不同答案？',
    question: '看到证据以后，应该换哪一个分母？',
    description:
      '用一万张纸签的自然频数和面积筛选，看基准率怎样改变同一证据的后验，再分清新证据与重复观察。',
    color: '#8d91b2',
    tag: '基准率 · 自然频数 · 后验',
    related: ['bloom-filter', 'sampling-aliasing', 'hash', 'markov-chain'],
    sources: [
      {
        title: 'NIST Engineering Statistics Handbook — Bayes Formula',
        url: 'https://www.itl.nist.gov/div898/handbook/apr/section2/apr1a.htm',
      },
    ],
    number: '114',
  },
  {
    slug: 'kepler-orbits',
    name: '开普勒轨道',
    title: '走得有快有慢，怎样仍然保持等时？',
    question: '行星为什么靠近太阳时走得更快？',
    description:
      '从圆到椭圆，固定焦点并同步生长两块等时面积；改变偏心率与半长轴，看速度和周期分别受谁控制。',
    color: '#7da6b3',
    tag: '焦点 · 等时面积 · 轨道周期',
    related: ['seasons', 'moon-phases', 'gps', 'orbital-transfer'],
    sources: [
      {
        title: 'NASA — Orbits and Kepler’s Laws',
        url: 'https://science.nasa.gov/solar-system/orbits-and-keplers-laws/',
      },
    ],
    number: '113',
  },
  {
    slug: 'latent-heat',
    name: '潜热',
    title: '温度没升，热量去哪了？',
    question: '冰在融化时，为什么还能继续吸收能量？',
    description:
      '用纯水的定压焓账本追踪冰升温、固液共存、融化结束和逆向凝固，区分温度、相态比例与加热功率。',
    color: '#8eaeb2',
    tag: '热学与相变',
    related: ['pressure-cooker', 'refrigerator', 'heat-conduction', 'convection'],
    sources: [
      {
        title: 'OpenStax University Physics 2, §1.5 Phase Changes',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/1-5-phase-changes',
      },
      {
        title: 'NIST: Properties of Ice and Supercooled Water',
        url: 'https://www.nist.gov/publications/properties-ice-and-supercooled-water',
      },
    ],
    number: '112',
  },
  {
    slug: 'heat-conduction',
    name: '热传导',
    title: '物质没流走，热怎样传过去？',
    question: '一根固体杆为什么能把能量传到另一端？',
    description:
      '用固定晶格、温度剖面和边界能量账本区分传导、稳态与平衡，比较导热率、长度和反向温度梯度。',
    color: '#a68d62',
    tag: '热学与能量',
    related: ['electric-fuse', 'thermocouple', 'convection', 'diffusion'],
    sources: [
      {
        title: 'OpenStax College Physics 2e, §14.5 Conduction',
        url: 'https://openstax.org/books/college-physics-2e/pages/14-5-conduction',
      },
      {
        title: 'MIT OCW 18.03 Heat Equation interactive notes',
        url: 'https://ocw.mit.edu/ans7870/18/18.03/s06/tools/HeatEquationHelp.html',
      },
    ],
    number: '111',
  },
  {
    slug: 'rc-circuit',
    name: 'RC 充放电',
    title: 'RC 充放电：电流慢下来，电压升上去',
    question: '电流越来越小，电容为什么还在充电？',
    description: '跟踪电容的连续电压，比较电阻、电容、充放电方向与能量去向。',
    color: '#9d87b2',
    tag: '瞬态与储能',
    related: ['piezoelectricity', 'rectifier', 'buck-converter', 'lithium-battery'],
    sources: [
      {
        title: 'OpenStax · RC Circuits',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/10-5-rc-circuits',
      },
    ],
    number: '110',
  },
  {
    slug: 'wheatstone-bridge',
    name: '惠斯通电桥',
    title: '惠斯通电桥：零读数不是零电流',
    question: '仪表指针回到零，电流都消失了吗？',
    description: '比较两个节点的电势，区分桥路平衡、支路电流与仪表带来的测量负载。',
    color: '#839b87',
    tag: '差分与平衡',
    related: ['rectifier', 'body-fat-scale', 'buck-converter'],
    sources: [
      {
        title: 'Analog Devices · Resistive Bridge Basics: Part One',
        url: 'https://www.analog.com/en/resources/technical-articles/resistive-bridge-basics-part-one--maxim-integrated.html',
      },
    ],
    number: '109',
  },
  {
    slug: 'pinhole-camera',
    name: '小孔成像',
    title: '孔越小，像一定越清楚吗？',
    question: '没有透镜，光怎样排成一幅倒像？',
    description:
      '从直线光路推出倒像与有限孔径的几何斑，再比较通光量、衍射尺度和屏距，说明无限缩孔的边界。',
    color: '#86a8ae',
    tag: '光学与成像',
    related: ['camera-lens', 'aperture', 'diffraction'],
    sources: [
      {
        title: 'OpenStax University Physics 3, §4.5 Circular Apertures and Resolution',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/4-5-circular-apertures-and-resolution',
      },
      {
        title: 'OpenStax University Physics 3, §1.2 The Law of Reflection (ray model)',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/1-2-the-law-of-reflection',
      },
    ],
    number: '108',
  },
  {
    slug: 'dijkstra',
    name: 'Dijkstra 最短路',
    title: '哪一个距离，现在终于可以定案？',
    question: '眼前最短的一条边，会通向最短的路吗？',
    description:
      '让暂定距离从 22 改为 13 再到 7，追踪全局最小点怎样定案，并用一条负边拆开证明的前提。',
    color: '#8da383',
    tag: '最短路 · 暂定距离 · 非负边',
    related: [
      'packet-routing',
      'congestion-control',
      'network',
      'heap-priority-queue',
      'astar-search',
      'union-find',
      'voronoi',
    ],
    sources: [
      {
        title: 'Dijkstra — A note on two problems in connexion with graphs (1959)',
        url: 'https://doi.org/10.1007/BF01386390',
      },
      {
        title: 'MIT 6.006 — Lecture 16: Dijkstra',
        url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/6277a1f06100c26a7ff21031af6757b5_MIT6_006F11_lec16.pdf',
      },
    ],
    number: '107',
  },
  {
    slug: 'pulley',
    name: '滑轮组',
    title: '滑轮组：省下的力去哪了？',
    question: '多一个轮子，就能再省一半力吗？',
    description: '沿一根连续绳索数承重绳段，同时核对拉力、位移与移动滑轮组的自重。',
    color: '#718c8a',
    tag: '绳长与功',
    related: ['bicycle', 'excavator', 'hydraulic-brake'],
    sources: [
      {
        title: 'OpenStax · Simple Machines',
        url: 'https://openstax.org/books/college-physics-2e/pages/9-5-simple-machines',
      },
    ],
    number: '106',
  },
  {
    slug: 'thin-film-interference',
    name: '薄膜干涉',
    title: '薄膜为什么会忽亮忽暗？',
    question: '膜越厚，反射就越亮吗？',
    description:
      '追踪表面与底面的反射，把往返光程与反射相位分开，再比较空气背面和玻璃背面的亮暗条件。',
    tag: '光学与相位',
    color: '#739eab',
    related: ['wave-interference', 'double-slit', 'polarization'],
    sources: [
      {
        title: 'OpenStax University Physics 3, §3.4 Interference in Thin Films',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/3-4-interference-in-thin-films',
      },
      {
        title: 'University of Toronto PHY326: Thin Film Interference',
        url: 'https://www.physics.utoronto.ca/~phy326/film/film.htm',
      },
    ],
    number: '105',
  },
  {
    slug: 'dns-resolution',
    name: 'DNS 分层查找',
    title: '一个名字，怎样找到负责回答的人？',
    question: 'DNS 是层层转发，还是不断问路？',
    description: '跟踪递归解析器如何追踪根、顶级域和权威的转介，再让地址 TTL 与委派缓存各自到期。',
    color: '#95799c',
    tag: '转介 · 缓存 · TTL',
    related: ['network', 'packet-routing', 'public-key'],
    sources: [
      {
        title: 'RFC 1034 — Domain names, concepts and facilities',
        url: 'https://www.rfc-editor.org/rfc/rfc1034.html',
      },
      {
        title: 'RFC 2181 — Time to Live',
        url: 'https://www.rfc-editor.org/rfc/rfc2181.html',
      },
      {
        title: 'RFC 2606 — Reserved Top Level DNS Names',
        url: 'https://www.rfc-editor.org/rfc/rfc2606.html',
      },
    ],
    number: '104',
  },
  {
    slug: 'lever',
    name: '杠杆',
    title: '杠杆：力臂不是杆长',
    question: '长杆一定省力吗？',
    description: '沿着同一个负载，辨认力的作用线、垂直力臂与输入输出的功。',
    color: '#ad8555',
    tag: '力矩与功',
    related: ['planetary-gears', 'bicycle', 'excavator', 'inclined-plane'],
    sources: [
      {
        title: 'OpenStax · Torque',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/10-6-torque',
      },
      {
        title: 'OpenStax · Simple Machines',
        url: 'https://openstax.org/books/college-physics-2e/pages/9-5-simple-machines',
      },
    ],
    number: '103',
  },
  {
    slug: 'consistent-hashing',
    name: '一致性哈希',
    title: '节点换了，为什么不用搬走所有键？',
    question: '扩容一台机器，哪些数据需要换家？',
    description:
      '保持键与节点的哈希位置固定，沿环找后继，实际比较取模、节点增删与虚拟节点的归属变化。',
    color: '#9a94b5',
    tag: '信息与系统',
    related: ['hash', 'bloom-filter'],
    sources: [
      {
        title: 'Karger et al., Consistent Hashing and Random Trees (1997)',
        url: 'https://people.csail.mit.edu/karger/Papers/web.pdf',
      },
      {
        title: 'Karger, Consistent Hashing: Load Balancing in a Changing World',
        url: 'https://people.csail.mit.edu/karger/Talks/Hash/index.htm',
      },
    ],
    number: '102',
  },
  {
    slug: 'congestion-control',
    name: '拥塞控制',
    title: '发送得更多，为什么反而要收手？',
    question: '网络堵了，发送者怎样感知并退让？',
    description:
      '在同一出口容量与有限 FIFO 队列中跟踪逐确认增窗、溢出、乘性回退和加性增长，区分吞吐与排队。',
    color: '#99a57a',
    tag: '信息与系统',
    related: ['tcp-reliability', 'packet-routing'],
    sources: [
      {
        title: 'RFC 5681: TCP Congestion Control',
        url: 'https://www.rfc-editor.org/rfc/rfc5681',
      },
      {
        title: 'RFC 6928: Increasing TCP’s Initial Window',
        url: 'https://www.rfc-editor.org/rfc/rfc6928',
      },
    ],
    number: '101',
  },
  {
    slug: 'tcp-reliability',
    name: 'TCP 可靠传输',
    title: '丢了、乱了，为什么还能按序读完？',
    question: '网络不可靠，字节流怎样可靠？',
    description:
      '沿着同一组字节序号观察乱序缓存、累计确认、超时重传与重复抑制，重建一条完整有序的应用字节流。',
    color: '#7a9fa6',
    tag: '信息与系统',
    related: ['packet-routing', 'congestion-control'],
    sources: [
      {
        title: 'RFC 9293: Transmission Control Protocol',
        url: 'https://www.rfc-editor.org/rfc/rfc9293',
      },
      {
        title: 'RFC 6298: Computing TCP Retransmission Timer',
        url: 'https://www.rfc-editor.org/rfc/rfc6298',
      },
    ],
    number: '100',
  },
  {
    slug: 'bloom-filter',
    name: '布隆过滤器',
    title: '它说“可能有”，到底知道什么？',
    question: '为什么确定没有，却只能说可能有？',
    description:
      '看真实哈希地址如何共享位阵列，寻找一个确实不存在的误报键，并观察直接删除为什么会误伤。',
    color: '#86a277',
    tag: '信息与系统',
    related: ['hash', 'huffman', 'bayes-updating'],
    sources: [
      {
        title: 'Bloom, Space/time trade-offs in hash coding with allowable errors (1970)',
        url: 'https://pages.cs.wisc.edu/~markhill/restricted/cacm70_bloom.pdf',
      },
    ],
    number: '99',
  },
  {
    slug: 'lidar-ranging',
    name: '激光雷达',
    title: '一束光怎样扫出房间？',
    question: '距离与方向怎样变成点云？',
    description: '从纳秒往返到逐束扫描，看点云的密度、遮挡与缺口。',
    color: '#9bd5e4',
    tag: '信号与成像',
    related: ['radar-ranging', 'gps', 'ultrasound', 'retroreflector'],
    sources: [
      {
        title: 'Ouster · What is lidar?',
        url: 'https://ouster.com/insights/what-is-lidar',
      },
      {
        title: 'Ouster · Coordinate system, firmware 3.2',
        url: 'https://docs.ouster.com/sensor-docs/firmware/3.2/coordinate-system',
      },
    ],
    number: '98',
  },
  {
    slug: 'radar-ranging',
    name: '脉冲雷达',
    title: '雷达怎样把回波变成距离？',
    question: '发出到返回的几微秒，能告诉我们什么？',
    description: '跟踪同一脉冲的往返，分清距离、分辨率与距离歧义。',
    color: '#f2d89c',
    tag: '信号与成像',
    related: ['lidar-ranging', 'ultrasound', 'doppler'],
    sources: [
      {
        title: 'MathWorks · Simulating radar receiver test signals',
        url: 'https://www.mathworks.com/help/phased/ug/designing-a-basic-monostatic-pulse-radar.html',
      },
      {
        title: 'MathWorks · Pulse waveform analyzer',
        url: 'https://www.mathworks.com/help/phased/ref/pulsewaveformanalyzer-app.html',
      },
    ],
    number: '97',
  },
  {
    slug: 'bayer-sensor',
    name: '拜耳传感器',
    title: '一个像素怎样得到完整颜色？',
    question: '只测一种颜色，怎样补出另外两种？',
    description: '跟住同一个红格，看RGGB采样、邻域插值与细纹假色。',
    color: '#a8d3a4',
    tag: '信号与成像',
    related: ['rolling-shutter', 'camera-lens', 'jpeg'],
    sources: [
      {
        title: 'Bryce Bayer · Color imaging array, US3971065A',
        url: 'https://patents.google.com/patent/US3971065A/en',
      },
      {
        title: 'Microsoft Research · Linear interpolation for demosaicing',
        url: 'https://www.microsoft.com/en-us/research/publication/high-quality-linear-interpolation-for-demosaicing-of-bayer-patterned-color-images/',
      },
    ],
    number: '96',
  },
  {
    slug: 'capillary',
    name: '毛细现象',
    title: '细管没有水泵，水为什么往上爬？',
    question: '细管没有水泵，水为什么往上爬？',
    description: '从接触线的表面张力出发，解释细管液柱、接触角与毛细下降。',
    color: '#7b9e82',
    tag: '接触线与液柱',
    related: ['osmosis', 'siphon'],
    sources: [
      {
        title: 'OpenStax · Cohesion, Adhesion and Capillary Action',
        url: 'https://openstax.org/books/college-physics-2e/pages/11-8-cohesion-and-adhesion-in-liquids-surface-tension-and-capillary-action',
      },
    ],
    number: '95',
  },
  {
    slug: 'osmosis',
    name: '渗透',
    title: '膜挡住溶质，为什么水面会变高？',
    question: '膜挡住溶质，为什么水面会变高？',
    description: '跟住穿过半透膜的水，看浓度、液柱压力与外加压力怎样共同决定净流动。',
    color: '#6f9c94',
    tag: '膜与压差',
    related: ['diffusion', 'capillary'],
    sources: [
      {
        title: 'OpenStax · Colligative Properties: Osmosis',
        url: 'https://openstax.org/books/chemistry-2e/pages/11-4-colligative-properties',
      },
    ],
    number: '94',
  },
  {
    slug: 'seismic-waves',
    name: '地震纵横波',
    title: '波传过去，岩石也跟着跑吗？',
    question: '波传过去，岩石也跟着跑吗？',
    description: '追踪同一物质点的纵向压缩与横向剪切，再用 P、S 到时差读懂传播。',
    color: '#738a78',
    tag: '粒子与传播',
    related: ['plate-boundaries', 'standing-wave', 'ultrasound'],
    sources: [
      {
        title: 'USGS · Body waves inside the earth',
        url: 'https://earthquake.usgs.gov/earthquakes/events/1906calif/18april/earthwaves.php',
      },
      {
        title: 'US EPA · Seismic Velocities',
        url: 'https://www.epa.gov/environmental-geophysics/seismic-velocities',
      },
      {
        title: 'USGS · P-wave and S-wave paths through the earth',
        url: 'https://www.usgs.gov/media/images/p-wave-and-s-wave-paths-through-earth',
      },
    ],
    number: '93',
  },
  {
    slug: 'rolling-shutter',
    name: '卷帘快门',
    title: '为什么照片里的直杆会倾斜？',
    question: '一张照片真的是同一个瞬间吗？',
    description: '逐行曝光，把移动物体的不同时刻拼进同一张照片。',
    color: '#9bd5e4',
    tag: '信号与成像',
    related: ['jpeg', 'bayer-sensor', 'sampling-aliasing'],
    sources: [
      {
        title: 'Basler · Electronic shutter types',
        url: 'https://docs.baslerweb.com/electronic-shutter-types',
      },
      {
        title: 'Basler · CMOS rolling shutter cameras',
        url: 'https://www.baslerweb.com/en/learning/cmos-rolling-shutter-cameras/',
      },
    ],
    number: '92',
  },
  {
    slug: 'lz77',
    name: '滑动窗口压缩',
    title: '看过的文字，能不能只指一次？',
    question: '重复出现，为什么不用再写一遍？',
    description: '在真实字符流中寻找向后引用，滑动有限历史窗口，并逐字演示允许重叠的解码回抄。',
    color: '#7fa69a',
    tag: '信息与系统',
    related: ['huffman', 'jpeg', 'run-length-encoding'],
    sources: [
      {
        title: 'RFC 1951 §3.2.3: length and backward distance',
        url: 'https://www.rfc-editor.org/rfc/rfc1951#section-3.2.3',
      },
    ],
    number: '91',
  },
  {
    slug: 'huffman',
    name: '哈夫曼编码',
    title: '常见字母，为什么值得走更短的路？',
    question: '不丢一个字，怎样少写一些位？',
    description: '从同一条消息的频数出发，合并最小权重，构造前缀树，再逐位无歧义还原。',
    color: '#b88d5f',
    tag: '信息与系统',
    related: ['lz77', 'qr-code', 'jpeg'],
    sources: [
      {
        title: 'Huffman, A Method for the Construction of Minimum-Redundancy Codes (1952)',
        url: 'https://www.cse.iitd.ac.in/~pkalra/siv864/huffman_1952.pdf',
      },
      {
        title: 'RFC 1951 §3.2.1: prefix and Huffman coding',
        url: 'https://www.rfc-editor.org/rfc/rfc1951#section-3.2.1',
      },
    ],
    number: '90',
  },
  {
    slug: 'fourier-transform',
    name: '傅里叶分解',
    title: '复杂波形怎样拆成简单节奏？',
    question: '一条波形里藏着哪些频率？',
    description: '从逐项相加到相关累加，看同一份记录的时间与频率。',
    color: '#c6b5ed',
    tag: '信号与成像',
    related: ['sampling-aliasing', 'jpeg', 'beats', 'convolution'],
    sources: [
      {
        title: 'NI · Using FFTs and power spectra',
        url: 'https://www.ni.com/en/shop/labview/using-fast-fourier-transforms-and-power-spectra-in-labview.html',
      },
    ],
    number: '89',
  },
  {
    slug: 'sampling-aliasing',
    name: '采样混叠',
    title: '为什么车轮会倒着转？',
    question: '高速信号怎样伪装成慢变化？',
    description: '固定时刻留下的点，如何让不同频率变成同一份记录。',
    color: '#9bd5e4',
    tag: '信号与成像',
    related: ['fourier-transform', 'rolling-shutter', 'doppler', 'moire'],
    sources: [
      {
        title: 'Analog Devices · Anti-aliasing filter basics',
        url: 'https://www.analog.com/en/resources/technical-articles/guide-to-antialiasing-filter-basics.html',
      },
    ],
    number: '88',
  },
  {
    slug: 'standing-wave',
    name: '驻波',
    title: '波在前进，为什么图形不走？',
    question: '波在前进，为什么图形不走？',
    description: '把反向行波分开再相加，跟住固定节点，理解琴弦为何只选择一些频率。',
    color: '#697f68',
    tag: '边界与谐波',
    related: ['sampling-aliasing', 'resonance', 'seismic-waves'],
    sources: [
      {
        title: 'OpenStax · Standing Waves and Resonance',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/16-6-standing-waves-and-resonance',
      },
    ],
    number: '87',
  },
  {
    slug: 'beats',
    name: '拍频',
    title: '两个稳定的音，为什么忽强忽弱？',
    question: '两个稳定的音，为什么忽强忽弱？',
    description: '把两个相近频率叠在一起，看相位滑动怎样形成缓慢的强弱起伏。',
    color: '#ac8257',
    tag: '频差与相位',
    related: ['resonance', 'standing-wave'],
    sources: [
      {
        title: 'OpenStax · Beats',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/17-6-beats',
      },
    ],
    number: '86',
  },
  {
    slug: 'resonance',
    name: '共振',
    title: '小小推力，为何越推越大？',
    question: '小小推力，为何越推越大？',
    description: '跟住弹簧上的质量块，观察节拍、相位与能量怎样建立共振。',
    color: '#4b826b',
    tag: '节拍与能量',
    related: ['standing-wave', 'beats'],
    sources: [
      {
        title: 'OpenStax · Forced Oscillations',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/15-6-forced-oscillations',
      },
    ],
    number: '85',
  },
  {
    slug: 'solar-eclipse',
    name: '日食',
    title: '每月都有新月，为什么没有每月日食？',
    question: '前后排齐以后，还差哪个方向？',
    description:
      '把轨道高度、视圆面和影锥接在同一组几何上，追踪同一观测点怎样看见偏食、全食与环食。',
    color: '#ae8a58',
    tag: '天体与影子',
    related: ['lunar-eclipse', 'moon-phases', 'seasons', 'camera-lens'],
    sources: [
      {
        title: 'NASA Science — Why Do Eclipses Happen?',
        url: 'https://science.nasa.gov/eclipses/geometry/',
      },
      {
        title: 'NASA Science — Types of Solar Eclipses',
        url: 'https://science.nasa.gov/eclipses/types/',
      },
      {
        title: 'NASA Science — Eclipses and the Moon',
        url: 'https://science.nasa.gov/moon/eclipses/',
      },
    ],
    number: '84',
  },
  {
    slug: 'coriolis',
    name: '科里奥利效应',
    title: '滑块走直线，为什么镜头里会弯？',
    question: '改变的是运动，还是观察坐标？',
    description:
      '跟随同一枚自由滑块，对照固定与随盘相机，逐步分清旋转坐标、初始切向速度与两项表观加速度。',
    color: '#598e80',
    tag: '旋转与参照系',
    related: ['seasons', 'tides', 'pendulum'],
    sources: [
      {
        title: 'MIT OpenCourseWare — Rotating Frames of Reference',
        url: 'https://ocw.mit.edu/courses/res-tll-004-stem-concept-videos-fall-2013/resources/rotating-frames-of-reference/',
      },
      {
        title: 'MIT — Relative Motion using Rotating Axes',
        url: 'https://ocw.mit.edu/courses/16-07-dynamics-fall-2009/resources/mit16_07f09_lec08/',
      },
    ],
    number: '83',
  },
  {
    slug: 'ear-thermometer',
    name: '耳温枪',
    title: '不用发射光，也能读到温度',
    question: '探头接收到的，到底是谁的温度？',
    description:
      '沿耳道组织发出的热红外，进入窄口探头、吸收膜与参考电路；保持温度不变，转动视场，观察混合信号如何改变读数。',
    color: '#b89262',
    tag: '热辐射',
    related: ['body-fat-scale', 'ultrasound', 'camera-lens', 'heat-radiation'],
    sources: [
      {
        title: 'Braun — ThermoScan infrared reception from eardrum and surrounding tissue',
        url: 'https://www.braunhealthcare.com/us_en/thermometer/thermoscan-5/',
      },
      {
        title: 'Analog Devices — Important Design Considerations for Digital Thermometers',
        url: 'https://www.analog.com/en/resources/technical-articles/important-design-considerations-for-digital-thermometers.html',
      },
      {
        title: 'Hamamatsu — Thermopile detectors technical note',
        url: 'https://www.hamamatsu.com/content/dam/hamamatsu-photonics/sites/documents/99_SALES_LIBRARY/ssd/thermopile_kird9005e.pdf',
      },
      {
        title: 'Melexis — Eliminating Thermal Disturbances in Non-Contact Temperature Measurement',
        url: 'https://www.melexis.com/en/news/tech-talks/eliminating-thermal-disturbances-in-non-contact-temperature-measurement',
      },
      {
        title: 'NIST — Radiance Temperature Calibrations, SP 250-43',
        url: 'https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication250-43.pdf',
      },
      {
        title: 'Yeoh et al. 2017 — Tympanic membrane vicinity and temperature nonuniformity',
        url: 'https://doi.org/10.1371/journal.pone.0174120',
      },
      {
        title: 'US6435711B1 — Infrared ear thermometer probe and reference sensor',
        url: 'https://patents.google.com/patent/US6435711B1/en',
      },
    ],
    number: '82',
  },
  {
    slug: 'body-fat-scale',
    name: '体脂秤',
    title: '脚下的四片金属，怎样变成体脂率？',
    question: '体脂秤真的“看见”脂肪了吗？',
    description:
      '从四角称重与四电极交流测量，追踪阻抗、相位、水分和去脂体重的估算，看看脂肪质量固定时水分怎样改变读数。',
    color: '#679b8c',
    tag: '四电极 · 阻抗 · 身体组成估算',
    related: ['ear-thermometer', 'rectifier', 'wheatstone-bridge'],
    sources: [
      {
        title:
          'Texas Instruments — AFE4300 weight-scale and body-composition measurement signal chains',
        url: 'https://www.ti.com/lit/ds/symlink/afe4300.pdf',
      },
      {
        title: 'Texas Instruments — SBAA562, How to Measure Body Composition',
        url: 'https://www.ti.com/document-viewer/lit/html/SBAA562',
      },
      {
        title: 'Analog Devices — Bioimpedance RC equivalent model and quadrature demodulation',
        url: 'https://www.analog.com/en/resources/analog-dialogue/articles/adopting-a-better-bioimpedance-afe.html',
      },
      {
        title: 'Texas Instruments — Resistive bridge in a load cell, SBAA290',
        url: 'https://www.ti.com/document-viewer/lit/html/SBAA290',
      },
      {
        title:
          'Lukaski et al. (1985) — Assessment of fat-free mass using bioelectrical impedance measurements',
        url: 'https://pubmed.ncbi.nlm.nih.gov/3984933/',
      },
      {
        title: 'Wang, Deurenberg and Heymsfield (2000) — Fat-free mass hydration model',
        url: 'https://pubmed.ncbi.nlm.nih.gov/10865761/',
      },
      {
        title: 'Tanita — How drinking water affects body-composition readings',
        url: 'https://support.tanita.eu/support/solutions/articles/60000690203-how-will-drinking-water-affect-my-body-composition-readings-',
      },
    ],
    number: '81',
  },
  {
    slug: 'jellyfish',
    name: '水母',
    title: '伞已经不动，为什么还能再游一段？',
    question: '伞已经不动，为什么还能再游一段？',
    description: '跟随月水母的一次脉动，看排水、涡环与弹性回弹怎样带来完全舒张后的二次推力。',
    color: '#82a6bc',
    tag: '伞缘 · 涡环 · 能量回收',
    related: ['airfoil', 'convection', 'water-hammer'],
    sources: [
      {
        title:
          'Gemmell et al. (2013) — Passive energy recapture in jellyfish contributes to propulsive advantage over other metazoans',
        url: 'https://doi.org/10.1073/pnas.1306983110',
      },
      {
        title:
          'Gemmell, Costello and Colin (2014) — Vortex enhancement and manipulation in Aurelia aurita',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4203578/',
      },
      {
        title: 'Monterey Bay Aquarium — Moon jelly anatomy (Aurelia labiata, a related species)',
        url: 'https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/moon-jelly',
      },
      {
        title: 'University of Michigan Animal Diversity Web — Aurelia aurita morphology',
        url: 'https://animaldiversity.org/accounts/Aurelia_aurita/',
      },
    ],
    number: '80',
  },
  {
    slug: 'instant-camera',
    name: '拍立得',
    title: '相纸里，藏着一间暗房',
    question: '照片是相机打印的，还是相纸显出来的？',
    description:
      '跟着同一张 Polaroid 积分式相纸，从曝光、走纸与药囊破开，到试剂铺展、染料迁移和慢慢成像。',
    color: '#397d79',
    tag: '摄影与化学',
    related: ['camera-lens', 'printer', 'jpeg'],
    sources: [
      {
        title: 'Polaroid — What happens after loading an integral film pack?',
        url: 'https://support.polaroid.com/hc/en-us/articles/115012396647-What-happens-when-I-insert-a-Polaroid-film-pack-into-my-camera',
      },
      {
        title: 'Polaroid — Inside integral film',
        url: 'https://support.polaroid.com/hc/en-us/articles/115012554908-What-s-inside-a-Polaroid-film-box',
      },
      {
        title: 'Polaroid — Color i-Type film specification',
        url: 'https://shop-us.polaroid.com/products/color-itype-instant-film',
      },
      {
        title: 'Polaroid — Precise photo dimensions',
        url: 'https://support.polaroid.com/hc/en-us/articles/115012363647-What-are-Polaroid-photo-dimensions',
      },
      {
        title: 'Polaroid — The Reclaimed Blue story and CMY layers',
        url: 'https://www.polaroid.com/en_gb/blog/journal/the-reclaimed-blue-story',
      },
      {
        title: 'Polaroid Corporation — US 5,449,586, integral diffusion transfer',
        url: 'https://patents.justia.com/patent/5449586',
      },
      {
        title: 'Polaroid — Cleaning camera rollers',
        url: 'https://support.polaroid.com/hc/en-us/articles/115012564148-How-do-I-clean-my-camera-rollers',
      },
      {
        title: 'Polaroid — Shielding and handling film',
        url: 'https://support.polaroid.com/hc/en-us/articles/115012519828-How-to-get-the-most-out-of-Polaroid-film',
      },
      {
        title: 'Polaroid — Shaking and pressure damage',
        url: 'https://support.polaroid.com/hc/en-us/articles/4507821657106-Why-do-my-photos-have-distortions-and-blobs-on-them',
      },
    ],
    number: '79',
  },
  {
    slug: 'slr-mirrorless',
    name: '单反、无反',
    title: '捕捉之前，先怎样看见？',
    question: '为什么单反按快门时会黑一下？',
    description: '打开两种相机，追踪反光镜、快门与电子取景的不同路线。',
    color: '#72929a',
    tag: '光路与取景',
    related: ['camera-lens', 'polarization', 'jpeg'],
    sources: [
      {
        title: 'Canon — Digital SLR Cameras',
        url: 'https://global.canon/en/technology/canon-tech/tech/dslr/',
      },
      {
        title: 'Canon — Mirrorless Cameras',
        url: 'https://global.canon/en/technology/canon-tech/tech/mcamera/',
      },
      {
        title: 'Nikon — Mirrorless versus DSLR: key differences',
        url: 'https://www.nikonusa.com/learn-and-explore/c/products-and-innovation/mirrorless-versus-dslr-exploring-key-differences',
      },
      {
        title: 'Sony — Electronic front curtain and mechanical shutter',
        url: 'https://www.sony.com/electronics/support/e-mount-body-ilce-9-series/articles/00018997',
      },
    ],
    number: '78',
  },
  {
    slug: 'myopia-lens',
    name: '儿童近视防控镜片',
    title: '看清楚以后，为什么还要另一种光学信号？',
    question: '同一光点的两种成分，怎样到达视网膜？',
    description: '追踪真实计算的矫正与微透镜光路，再单独阅读原始随机试验的组平均结果。',
    color: '#368a9a',
    tag: '眼睛与光学',
    related: ['microscope', 'double-slit', 'solar-cell'],
    sources: [
      {
        title: 'Lam et al. — DIMS two-year randomized trial',
        url: 'https://ira.lib.polyu.edu.hk/bitstream/10397/82284/1/Lam_DIMS_Spectacle_Lenses.pdf',
      },
      {
        title: 'National Eye Institute — Nearsightedness',
        url: 'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/nearsightedness-myopia',
      },
      {
        title: 'OpenStax — The Eye',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/2-5-the-eye',
      },
    ],
    number: '77',
  },
  {
    slug: 'esim',
    name: 'eSIM',
    title: '没有卡槽，SIM 到哪儿去了？',
    question: '扫码怎样把一份订阅送进安全芯片？',
    description:
      '追踪同一份运营商 profile，从激活码、双向认证和绑定封包，到芯片中的安装、启用与网络认证。',
    color: '#237b75',
    tag: '通信与身份',
    related: ['mobile-roaming', 'cell-handover', 'nfc'],
    sources: [
      {
        title: 'GSMA SGP.21 v2.6 — Consumer RSP Architecture',
        url: 'https://www.gsma.com/solutions-and-impact/technologies/esim/wp-content/uploads/2024/09/SGP.21-v2.6.pdf',
      },
      {
        title: 'GSMA SGP.22 v2.2.2 — Consumer RSP Technical Specification',
        url: 'https://www.gsma.com/solutions-and-impact/technologies/esim/wp-content/uploads/2020/06/SGP.22-v2.2.2.pdf',
      },
      {
        title: 'Apple — Use Dual SIM on iPhone',
        url: 'https://support.apple.com/en-euro/guide/iphone/iph9c5776d3c/ios',
      },
    ],
    number: '76',
  },
  {
    slug: 'cpu-gpu-npu',
    name: 'CPU、GPU、NPU',
    title: '同一道计算题，为什么需要三种芯片？',
    question: '同一道计算题，为什么需要三种芯片？',
    description: '跟住同一组数字，走过程序控制、成组并行和矩阵数据流，逐项核对三种安排的结果。',
    color: '#6b999b',
    tag: '乘加 · 并行 · 专用计算',
    related: ['cpu-pipeline', 'transformer', 'jpeg'],
    sources: [
      {
        title:
          'NVIDIA — CUDA Programming Model: heterogeneous systems, SIMT, tile programming and memory',
        url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html',
      },
      {
        title:
          'Google Research — In-Datacenter Performance Analysis of a Tensor Processing Unit (ISCA 2017)',
        url: 'https://research.google/pubs/in-datacenter-performance-analysis-of-a-tensor-processing-unit/',
      },
      {
        title: 'Intel — Neural Processing Unit: MAC engines, near-compute memory and scheduler',
        url: 'https://edc.intel.com/content/www/us/en/design/products/platforms/details/arrow-lake-s/core-ultra-200s-series-processors-datasheet-volume-1-of-2/intel-neural-processing-unit-intel-npu/',
      },
    ],
    number: '75',
  },
  {
    slug: 'cell-handover',
    name: '蜂窝网络与切换',
    title: '边走边打电话，为什么不断线？',
    question: '边走边打电话，为什么不断线？',
    description:
      '跟着一部行进中的手机，看信号强弱怎样画出小区边界，网络又怎样在合适的时刻把它交给下一座基站。',
    color: '#6fa7c9',
    number: '72',
    tag: '蜂窝 · 测量 · 切换',
    related: ['mobile-5g', 'mobile-roaming', 'packet-routing'],
    sources: [
      {
        title:
          '3GPP TS 36.331 — E-UTRA RRC: layer-3 filtering, event A3, hysteresis and time-to-trigger',
        url: 'https://www.3gpp.org/DynaReport/36331.htm',
      },
      {
        title: '3GPP TS 36.300 — E-UTRA overall description: X2 handover and data forwarding',
        url: 'https://www.3gpp.org/DynaReport/36300.htm',
      },
      {
        title: '3GPP TS 38.300 — NR overall description: Xn handover',
        url: 'https://www.3gpp.org/DynaReport/38300.htm',
      },
      {
        title: '3GPP TS 36.133 — E-UTRA radio resource management: handover interruption time',
        url: 'https://www.3gpp.org/DynaReport/36133.htm',
      },
      {
        title: '3GPP TS 36.304 — UE procedures in idle mode: cell reselection ranking',
        url: 'https://www.3gpp.org/DynaReport/36304.htm',
      },
      {
        title: '3GPP TS 23.401 — EPS architecture: tracking areas and paging',
        url: 'https://www.3gpp.org/DynaReport/23401.htm',
      },
      {
        title: '3GPP TR 36.814 — E-UTRA further advancements: evaluation antenna pattern',
        url: 'https://www.3gpp.org/DynaReport/36814.htm',
      },
      {
        title: '3GPP TR 25.814 — physical layer aspects: macro path loss and shadowing assumptions',
        url: 'https://www.3gpp.org/DynaReport/25814.htm',
      },
      {
        title: '3GPP TR 36.839 — mobility enhancements: ping-pong definition',
        url: 'https://www.3gpp.org/DynaReport/36839.htm',
      },
    ],
  },
  {
    slug: 'mobile-5g',
    name: '4G 与 5G',
    title: '5G 的速度从哪里来？',
    question: '5G 的速度从哪里来？',
    description:
      '把速率拆成频带宽度、每个资源单元的比特和并行层数，再看子载波、星座图、天线阵列和多人分享各自改变了什么。',
    color: '#8f86c9',
    number: '73',
    tag: '频谱 · 调制 · 波束',
    related: ['cell-handover', 'wave-interference', 'error-correction'],
    sources: [
      {
        title:
          '3GPP TS 38.306 — NR UE radio access capabilities, §4.1.2 approximate peak data rate',
        url: 'https://www.3gpp.org/DynaReport/38306.htm',
      },
      {
        title:
          '3GPP TS 38.211 — NR physical channels and modulation: numerology, resource grid and QAM mapping',
        url: 'https://www.3gpp.org/DynaReport/38211.htm',
      },
      {
        title:
          '3GPP TS 38.101-1 — NR UE radio transmission and reception, FR1: maximum transmission bandwidth configuration N_RB',
        url: 'https://www.3gpp.org/DynaReport/38101-1.htm',
      },
      {
        title: '3GPP TS 36.213 — E-UTRA physical layer procedures: transport block size tables',
        url: 'https://www.3gpp.org/DynaReport/36213.htm',
      },
      {
        title: '3GPP TR 38.901 — Channel model for 0.5–100 GHz: material penetration loss',
        url: 'https://www.3gpp.org/DynaReport/38901.htm',
      },
      {
        title: 'ITU-R M.2410 — Minimum requirements for IMT-2020 radio interface performance',
        url: 'https://www.itu.int/pub/R-REP-M.2410',
      },
      {
        title: 'Ericsson — Advanced antenna systems for 5G networks (white paper)',
        url: 'https://www.ericsson.com/en/reports-and-papers/white-papers/advanced-antenna-systems-for-5g-networks',
      },
    ],
  },
  {
    slug: 'mobile-roaming',
    name: '手机漫游',
    title: '出了国，手机怎么还认得你？',
    question: '出了国，手机怎么还认得你？',
    description:
      '跟着 SIM 卡里的一串号码出国：当地网络怎样找到你家、用挑战与应答确认你，又让电话和数据走哪条路。',
    color: '#c99a6f',
    number: '74',
    tag: '身份 · 认证 · 路由',
    related: ['cell-handover', 'hash', 'packet-routing'],
    sources: [
      {
        title: '3GPP TS 33.102 — 3G security architecture: authentication and key agreement (AKA)',
        url: 'https://www.3gpp.org/DynaReport/33102.htm',
      },
      {
        title: '3GPP TS 33.401 — EPS security architecture: EPS AKA and K_ASME derivation',
        url: 'https://www.3gpp.org/DynaReport/33401.htm',
      },
      {
        title: '3GPP TS 35.206 — MILENAGE algorithm set: algorithm specification',
        url: 'https://www.3gpp.org/DynaReport/35206.htm',
      },
      {
        title: '3GPP TS 35.208 — MILENAGE algorithm set: design conformance test data',
        url: 'https://www.3gpp.org/DynaReport/35208.htm',
      },
      {
        title:
          '3GPP TS 23.122 — NAS functions related to Mobile Station in idle mode: PLMN selection',
        url: 'https://www.3gpp.org/DynaReport/23122.htm',
      },
      {
        title:
          '3GPP TS 23.003 — Numbering, addressing and identification: IMSI and home network realm',
        url: 'https://www.3gpp.org/DynaReport/23003.htm',
      },
      {
        title: '3GPP TS 29.272 — MME and SGSN related interfaces based on Diameter (S6a)',
        url: 'https://www.3gpp.org/DynaReport/29272.htm',
      },
      {
        title: '3GPP TS 23.401 — GPRS enhancements for E-UTRAN access: roaming architectures',
        url: 'https://www.3gpp.org/DynaReport/23401.htm',
      },
      {
        title: '3GPP TS 23.018 — Basic call handling: mobile-terminated calls and roaming numbers',
        url: 'https://www.3gpp.org/DynaReport/23018.htm',
      },
      {
        title: '3GPP TS 33.501 — Security architecture for 5G: 5G AKA and SUCI',
        url: 'https://www.3gpp.org/DynaReport/33501.htm',
      },
      {
        title:
          'ITU-T E.212 — international identification plan for public networks and subscriptions',
        url: 'https://www.itu.int/rec/T-REC-E.212',
      },
      {
        title: 'GSMA IR.88 — EPS roaming guidelines',
        url: 'https://www.gsma.com/newsroom/wp-content/uploads//IR.88-v27.0.pdf',
      },
      {
        title: 'GSMA IR.34 — guidelines for IPX provider networks',
        url: 'https://www.gsma.com/newsroom/wp-content/uploads//IR.34-v20.0.pdf',
      },
    ],
  },
  {
    slug: 'keyboard-switch',
    name: '机械键盘轴体',
    title: '同样按一下，轴体到底差在哪？',
    question: '同样按一下，轴体到底差在哪？',
    description: '从轴心、弹簧和触点出发，分清线性与段落、点击与缓冲，再看磁轴和光轴怎样检测按压。',
    color: '#cf8970',
    tag: '手感 · 声音 · 检测',
    related: ['suspension', 'logic-gates', 'nfc'],
    sources: [
      {
        title: 'CHERRY MX2A Red — structure, actuation force and travel',
        url: 'https://www.cherry.de/en-gb/product/mx2a-red',
      },
      {
        title: 'CHERRY MX2A Black — stronger linear spring and travel',
        url: 'https://www.cherry.de/en-gb/product/mx2a-black',
      },
      {
        title: 'CHERRY MX2A Brown — tactile stem profile; actuation versus pressure-point force',
        url: 'https://www.cherry.de/en-gb/product/mx2a-brown',
      },
      {
        title: 'CHERRY MX2A Blue — two-piece stem and click mechanism',
        url: 'https://www.cherry.de/en-gb/product/mx2a-blue',
      },
      {
        title: 'CHERRY MX2A Blue technical data — 50 cN actuation, 60 cN pressure point',
        url: 'https://www.cherry.de/fileadmin/media/Industrial/Switch/MX_BLUE/Data_sheet_MX2A_Blue.pdf',
      },
      {
        title: 'CHERRY MX2A Speed Silver — shorter pre-travel and total travel',
        url: 'https://www.cherry.de/en-gb/product/mx2a-speed-silver',
      },
      {
        title: 'CHERRY MX2A Silent Red — integrated damping and travel',
        url: 'https://www.cherry.de/en-gb/product/mx2a-silent-red',
      },
      {
        title: 'CHERRY MX switches at a glance — bottom-out and top-out damping',
        url: 'https://www.cherry.de/it-it/lazienda/notizie/cherry-blog/article/cherry-mx-switches-at-a-glance',
      },
      {
        title: 'Wooting — Hall effect keyboard switches',
        url: 'https://wooting.io/post/what-are-hall-effect-keyboard-switches',
      },
      {
        title: 'Wooting — Rapid Trigger setup and operating rules',
        url: 'https://help.wooting.io/article/102-how-to-set-up-rapid-trigger',
      },
      {
        title: 'Razer — optical switch operation via transmitted light',
        url: 'https://www.razer.com/razer-optical-switch',
      },
    ],
    number: '71',
  },
  {
    slug: 'landmine',
    name: '地雷',
    title: '战争结束了，危险为何还在？',
    question: '地雷怎样把一次外部事件与能量释放联系起来，为什么危险还能长期遗留？',
    description: '观察完整地雷外壳、土层接触与植被变化，分清外部触发、储能释放和长期遗留风险。',
    color: '#8a7858',
    tag: '储能 · 遗留风险',
    related: ['ak47', 'pendulum', 'lithium-battery'],
    sources: [
      {
        title: 'Smithsonian NMAH — German Model 43 Tellermine exterior',
        url: 'https://americanhistory.si.edu/collections/nmah_407167',
      },
      {
        title: 'ICRC — The enduring human cost of landmines and explosive remnants',
        url: 'https://www.icrc.org/en/article/landmines-and-explosive-remnants-enduring-human-cost-measured-decades',
      },
      {
        title: 'ICRC — Landmines: weapons of long-term suffering',
        url: 'https://www.icrc.org/en/article/landmines-impact-communities',
      },
      {
        title: 'UNMAS — Life-saving explosive ordnance risk education',
        url: 'https://unmas.org/en/news/unmas-south-sudan-provides-life-saving-risk-education-to-sudanese-refugees',
      },
    ],
    number: '70',
  },
  {
    slug: 'ak47',
    name: 'AK-47',
    title: '一股燃气，怎样变成一次往返？',
    question: '一股燃气，怎样变成一次往返？',
    description: '跟住同一组部件，看燃气如何做功、弹簧如何储能，再把能量交还给回程。',
    color: '#c7d2b5',
    tag: '导气 · 能量转移',
    related: ['landmine', 'suspension', 'four-stroke-engine'],
    sources: [
      {
        title: 'Smithsonian National Museum of American History — AK-47 Automatic Rifle',
        url: 'https://americanhistory.si.edu/collections/object/nmah_439260',
      },
      {
        title: 'Royal Museums Greenwich — AK-47 family collection object, gas operation',
        url: 'https://www.rmg.co.uk/collections/objects/rmgc-object-227949',
      },
      {
        title:
          'Historical Breechloading Smallarms Association — AKM, long-stroke gas-operated classification',
        url: 'https://hbsa-uk.org/knowledge-and-research/hbsa-dvd-index-and-content/hbsa-historic-machine-guns-dvd/akm-7-62x39mm-automatic-rifle/',
      },
      {
        title: 'OpenStax University Physics Volume 1, 15.2 — energy in a mass–spring system',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/15-2-energy-in-simple-harmonic-motion',
      },
    ],
    number: '69',
  },
  {
    slug: 'helicopter',
    name: '直升机',
    title: '不用跑道，机翼怎样起飞？',
    question: '机身停在原地，旋翼为什么还能把它托起来？',
    description: '跟随一片桨叶，拆开总距、周期变距、倾斜推力与尾桨反扭矩。',
    color: '#82a5a1',
    tag: '旋翼 · 升力',
    related: ['airfoil', 'bernoulli', 'excavator'],
    sources: [
      {
        title: 'FAA Helicopter Flying Handbook · Flight Controls (Chapter 3)',
        url: 'https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch03.pdf',
      },
      {
        title: 'FAA Helicopter Flying Handbook · Aerodynamics of Flight (Chapter 2)',
        url: 'https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch02.pdf',
      },
      {
        title: 'NASA NDARC Theory · Rotor inflow (§11-4.1)',
        url: 'https://rotorcraft.arc.nasa.gov/Publications/files/NASA%20TP-2009-215402-app3.pdf',
      },
    ],
    number: '68',
  },
  {
    slug: 'hydrogen-bomb',
    name: '氢弹',
    title: '热核武器为什么使用裂变初级？',
    question: '热核武器为什么使用裂变初级？',
    description: '从库仑势垒、隧穿与反应率出发，区分聚变点火的一般条件与热核武器中的裂变初级。',
    color: '#c7a6ff',
    tag: '核物理 · 势垒与温度',
    related: ['atomic-bomb', 'brownian-motion', 'diffusion'],
    sources: [
      {
        title:
          'NRL Plasma Formulary (2019) — fusion reactivity, Gamow energies and ion sound speed',
        url: 'https://library.psfc.mit.edu/catalog/online_pubs/NRL_FORMULARY_19.pdf',
      },
      {
        title:
          'Bosch & Hale, Nuclear Fusion 32 (1992) 611 — improved formulas for fusion cross-sections and thermal reactivities',
        url: 'https://doi.org/10.1088/0029-5515/32/4/I07',
      },
      {
        title: 'OpenStax University Physics Volume 3, 10.6 — Nuclear Fusion',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/10-6-nuclear-fusion',
      },
      {
        title: 'IAEA Atomic Mass Data Center — AME2020 binding energies',
        url: 'https://www-nds.iaea.org/amdc/',
      },
      {
        title: 'LLNL — National Ignition Facility achieves fusion ignition (December 2022)',
        url: 'https://www.llnl.gov/news/national-ignition-facility-achieves-fusion-ignition',
      },
    ],
    number: '67',
  },
  {
    slug: 'atomic-bomb',
    name: '原子弹',
    title: '链式反应为什么能持续并加快？',
    question: '中子怎样让裂变一代接着一代？',
    description:
      '跟踪中子的产生、俘获与漏出，区分自持、功率增长和爆炸性释放，并说明模型的适用边界。',
    color: '#e2a15a',
    tag: '核能 · 链式反应',
    related: ['hydrogen-bomb', 'diffusion', 'brownian-motion'],
    sources: [
      {
        title: 'OpenStax University Physics, Volume 3, 10.2 — Nuclear Binding Energy',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/10-2-nuclear-binding-energy',
      },
      {
        title: 'OpenStax University Physics, Volume 3, 10.5 — Fission',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/10-5-fission',
      },
      {
        title:
          'MIT OpenCourseWare 22.05 — Neutron Science and Reactor Physics: diffusion, criticality and delayed neutrons',
        url: 'https://ocw.mit.edu/courses/22-05-neutron-science-and-reactor-physics-fall-2009/pages/lecture-notes/',
      },
      {
        title: 'IAEA AMDC — AME2020 atomic mass evaluation',
        url: 'https://www-nds.iaea.org/amdc/ame2020/mass_1.mas20.txt',
      },
    ],
    number: '66',
  },
  {
    slug: 'nfc',
    name: 'NFC',
    title: '没有电池，标签怎么回话？',
    question: '没有电池，标签怎么回话？',
    description: '跟着标签线圈取得能量，再看芯片怎样切换负载，让读卡器听见同一个场里的回答。',
    color: '#76c8bb',
    number: '65',
    tag: '互感 · 通信',
    related: ['wireless-charging', 'transformer-electric', 'rectifier'],
    sources: [
      {
        title: 'NFC Forum — NFC Technology: operating modes and energy transfer',
        url: 'https://nfc-forum.org/learn/nfc-technology/',
      },
      {
        title:
          'STMicroelectronics — TN1216, ST25 NFC guide: inductive coupling, load modulation and NFC-A signaling',
        url: 'https://www.st.com/resource/en/technical_note/dm00190233-st25-nfc-guide-stmicroelectronics.pdf',
      },
      {
        title: 'NXP — NTAG213/215/216 data sheet: passive tag RF interface and contactless power',
        url: 'https://www.nxp.com/docs/en/data-sheet/NTAG213_215_216.pdf',
      },
      {
        title:
          'Texas Instruments — TRF79xxA Antenna Design Guide: antenna placement, tuning and material limits',
        url: 'https://www.ti.com/lit/an/sloa241b/sloa241b.pdf',
      },
    ],
  },
  {
    slug: 'double-slit',
    name: '双缝干涉',
    title: '多开一道缝，为什么反而更暗？',
    question: '多开一道缝，为什么反而更暗？',
    description: '跟住屏幕上的一个点，从两路光程差走到亮暗条纹，再看单次探测如何积累成图。',
    color: '#85d8cd',
    number: '64',
    tag: '光 · 相位',
    related: ['diffraction', 'wave-interference', 'polarization', 'diffraction-grating'],
    sources: [
      {
        title: 'OpenStax University Physics, Volume 3, 4.3 — Double-Slit Diffraction',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/4-3-double-slit-diffraction',
      },
      {
        title: 'Feynman Lectures, Volume III, Chapter 1 — Quantum Behavior',
        url: 'https://www.feynmanlectures.caltech.edu/III_01.html',
      },
      {
        title: 'Richard Fitzpatrick, UT Austin — Two-Slit Interference',
        url: 'https://farside.ph.utexas.edu/teaching/315/Waves/node91.html',
      },
    ],
  },
  {
    slug: 'excavator',
    name: '挖掘机',
    title: '一股油，怎样举起一斗土？',
    question: '一股油，怎样举起一斗土？',
    description:
      '跟随液压油进入油缸，再沿动臂、斗杆和铲斗连杆，看压力、流量与力矩怎样共同决定动作。',
    color: '#c39a4c',
    number: '63',
    tag: '力与运动',
    related: ['hydraulic-brake', 'suspension', 'bicycle', 'pulley'],
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
    color: '#79b7ad',
    tag: '网络 · 路由与队列',
    related: ['tcp-reliability', 'network', 'mobile-roaming', 'dijkstra'],
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
    color: '#6eafd0',
    tag: '浓度与通量',
    related: ['brownian-motion', 'osmosis', 'capillary', 'random-walk'],
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
    color: '#33657a',
    tag: '数据 · 页与记录',
    related: ['memory-cache', 'hash', 'cpu-pipeline', 'binary-search'],
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
    color: '#ad8455',
    tag: '温度与浮力',
    related: ['bernoulli', 'jellyfish', 'refrigerator', 'heat-conduction'],
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
    color: '#467f91',
    tag: '电力电子 · 单向导通与储能',
    related: ['buck-converter', 'transformer-electric', 'electric-generator', 'rc-circuit'],
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
    color: '#b88b68',
    tag: '线迹与机构时序',
    related: ['zipper', 'escapement', 'printer'],
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
    color: '#738a9d',
    tag: '信息 · 摘要与完整性',
    related: ['bloom-filter', 'consistent-hashing', 'public-key', 'merkle-tree'],
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
    color: '#9baac3',
    tag: '光学 · 成像与分辨率',
    related: ['camera-lens', 'myopia-lens', 'diffraction'],
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
    color: '#88aeb0',
    tag: '势流与升力',
    related: ['helicopter', 'jellyfish', 'bernoulli'],
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
    color: '#7c9f91',
    tag: '声学 · 回波与成像',
    related: ['radar-ranging', 'seismic-waves', 'doppler', 'acoustic-reflection'],
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
    color: '#69838a',
    tag: '机械 · 差速与扭矩',
    related: ['suspension', 'planetary-gears', 'ball-bearing', 'universal-joint'],
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
    color: '#7b9078',
    tag: '信息 · 奇偶校验与可靠传输',
    related: ['qr-code', 'public-key', 'memory-cache'],
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
    color: '#759798',
    tag: '流体 · 连续性与能量',
    related: ['siphon', 'water-hammer', 'hydraulic-brake', 'venturi-meter'],
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
    color: '#7591a0',
    tag: '声学 · 波峰与到达时刻',
    related: ['radar-ranging', 'lidar-ranging', 'ultrasound'],
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
    color: '#3a897b',
    tag: '电流与转动',
    related: ['three-phase-power', 'electric-generator', 'transformer-electric', 'ball-bearing'],
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
    color: '#87cbd6',
    tag: '波动 · 叠加与能量',
    related: ['surface-waves', 'beats', 'standing-wave', 'double-slit'],
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
    color: '#809eaa',
    tag: '光学 · 色散与观察方向',
    related: ['polarization', 'optical-fiber', 'diffraction', 'prism-dispersion'],
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
    related: ['resonance', 'keyboard-switch', 'hydraulic-brake'],
    number: '30',
  },
  {
    slug: 'diffraction',
    name: '衍射',
    title: '光穿过窄缝，为什么反而散开？',
    question: '一道开口，许多场贡献。',
    description: '从狭缝各段的相位相加，看到暗纹、中央峰和波长与缝宽的尺度关系。',
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
    color: '#547a80',
    tag: '计算机 · 地址与局部性',
    related: ['database-index', 'cpu-pipeline', 'consistent-hashing'],
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
    color: '#b8bd91',
    tag: '天文 · 倾角与日照',
    related: ['solar-eclipse', 'coriolis', 'tides', 'kepler-orbits'],
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
    color: '#527b70',
    tag: '计算机 · 时序与依赖',
    related: ['logic-gates', 'cpu-gpu-npu', 'memory-cache', 'topological-sort'],
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
    color: '#b17b52',
    tag: '电磁 · 变化与传递',
    related: ['ground-fault-breaker', 'rectifier', 'wireless-charging', 'nfc'],
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
    color: '#aeb9cf',
    number: '20',
    tag: '天文 · 光与视角',
    related: ['solar-eclipse', 'seasons', 'dimensions'],
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
    color: '#849dbe',
    number: '17',
    tag: '光通信 · 全反射与脉冲',
    related: ['camera-lens', 'network', 'total-internal-reflection'],
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
    color: '#6d98a4',
    number: '16',
    tag: '传动 · 自转与公转',
    related: ['bicycle', 'four-stroke-engine', 'lever'],
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
    color: '#9a956e',
    number: '15',
    tag: '机械 · 热与功',
    related: ['bicycle', 'refrigerator', 'cam-follower', 'centrifugal-governor'],
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
    color: '#8d9d79',
    number: '13',
    tag: '光路 · 对焦与成像',
    related: [
      'aperture',
      'slr-mirrorless',
      'instant-camera',
      'myopia-lens',
      'pinhole-camera',
      'refraction',
      'stereoscopic-vision',
      'telescope',
      'spherical-aberration',
    ],
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
    color: '#9a9863',
    number: '14',
    tag: '摄影 · 清晰范围',
    related: ['bayer-sensor', 'camera-lens', 'jpeg'],
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
    color: '#e47c37',
    number: '01',
    tag: '转动 · 传动比',
    related: ['pendulum', 'traffic', 'ratchet'],
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
    color: '#1c9bb0',
    number: '02',
    tag: '剖开 · 热力循环',
    related: ['printer', 'pendulum', 'latent-heat'],
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
    color: '#7559dc',
    number: '03',
    tag: '追踪 · 静电成像',
    related: ['jpeg', 'refrigerator', 'color-mixing'],
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
    color: '#138a77',
    number: '04',
    tag: '试听 · 波的叠加',
    related: ['beats', 'sampling-aliasing', 'resonance'],
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
    color: '#2a69ce',
    number: '06',
    tag: '慢放 · 请求的旅程',
    related: ['packet-routing', 'esim', 'cell-handover', 'dns-resolution', 'max-flow'],
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
    color: '#cd667b',
    number: '07',
    tag: '拆解 · 图像与频率',
    related: ['bayer-sensor', 'rolling-shutter', 'lz77', 'huffman'],
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
    color: '#8963d1',
    number: '09',
    tag: '旋转 · 切片与投影',
    related: ['gps', 'transformer', 'principal-components'],
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
export const getTopic = (slug: string) => topics.find((t) => t.slug === slug)!;
