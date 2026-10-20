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
    slug: 'chem-pigment-chromatography',
    name: '色素柱色谱',
    title: '同一股液流，为什么色带分开？',
    question: '同一股液流，为什么色带分开？',
    description: '追踪碳酸钙柱中的停留、迁移和分带，再从历史实验的固体色层提取色素。',
    color: '#b8caa0',
    tag: '吸附与迁移',
    related: ['rayleigh-scattering'],
    sources: [
      {
        title: 'Tswett: primary papers in translation',
        url: 'https://webserver.lemoyne.edu/giunta/tswett.html',
      },
      {
        title: 'IUPAC Gold Book: retention factor',
        url: 'https://goldbook.iupac.org/terms/view/R05359',
      },
    ],
    number: '435',
  },
  {
    slug: 'chem-host-guest-recognition',
    name: '主客体分子识别',
    title: '分子怎样认出合适的客体？',
    question: '同样是碳笼，为什么能选择性分离？',
    description: '跟踪杯酚与富勒烯的结合、过滤和释放，再比较冠醚的空腔与离子尺寸。',
    color: '#e7ede3',
    tag: '物质结构',
    related: ['chem-coordination-colors', 'chem-chirality-evidence'],
    sources: [
      {
        title: 'Atwood et al. (1994): selective fullerene complexation',
        url: 'https://www.nature.com/articles/368229a0',
      },
      {
        title: 'H. Kroto fullerene coordinates via Beloit College',
        url: 'https://chem.beloit.edu/edetc/pmks/pages/bucky.html',
      },
      {
        title: 'IUPAC fullerene nomenclature',
        url: 'https://publications.iupac.org/pac/74/4/0629/index.html',
      },
      {
        title: '1987 Nobel Prize: molecular recognition',
        url: 'https://www.nobelprize.org/prizes/chemistry/1987/speedread/',
      },
      {
        title: 'Charles Pedersen Nobel lecture',
        url: 'https://www.nobelprize.org/uploads/2018/06/pedersen-lecture.pdf',
      },
    ],
    number: '434',
  },
  {
    slug: 'chem-corrosion-protection',
    name: '金属腐蚀、防护与暖贴研究',
    title: '同样的金属氧化，怎样让它少腐蚀或持续发热？',
    question: '同样的金属氧化，怎样让它少腐蚀或持续发热？',
    description:
      '用耗氧水柱、铜加速析氢和凝胶显色追踪腐蚀，再用有对照的供氧与热量模型设计暖贴研究。',
    color: '#d6ddbe',
    tag: '电化学腐蚀 · 阴极保护 · 暖贴研究',
    related: ['chem-galvanic-cells', 'chem-electrolysis-plating', 'chem-reaction-rates'],
    sources: [
      {
        title: 'Nuffield — Change and decay, original corrosion and indicator experiments',
        url: 'https://assets.ctfassets.net/pc40tpn1u6ef/file-14167/107922fffcb6d08aa56775d4f02b55a5/8389-Revised_Nuffield_chemistry_options__option_6_change_and_decay__edited_.pdf',
      },
      {
        title: 'Taira — Experimental-type lectures on air-activated disposable hand warmers',
        url: 'https://www.jstage.jst.go.jp/article/krev/27/0/27_1_1/_article/-char/en',
      },
      {
        title: 'Klarzak et al. — Temperature and humidity effects on commercial chemical warmers',
        url: 'https://www.sciencedirect.com/science/article/pii/S2451904917304389',
      },
      {
        title: 'NIST-JANAF — Hematite thermochemistry',
        url: 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C1317608&Mask=A',
      },
    ],
    number: '433',
  },
  {
    slug: 'chem-benzoic-recrystallization',
    name: '苯甲酸重结晶',
    title: '晶体变纯，为什么质量变少？',
    question: '晶体变纯，为什么质量变少？',
    description: '用教材溶解度数据追踪热溶、过滤、冷析晶、洗涤与收率，分清盐和苯甲酸的去向。',
    color: '#c1cba8',
    tag: '溶解与析晶',
    related: ['rayleigh-scattering', 'chem-pigment-chromatography'],
    sources: [
      {
        title: 'University of York: recrystallisation',
        url: 'https://chemtl.york.ac.uk/techniques/purification/recrystallisation/single-solvents',
      },
      {
        title: 'Lisa Nichols: crystallization procedure',
        url: 'https://chem.libretexts.org/Bookshelves/Organic_Chemistry/Organic_Chemistry_Lab_Techniques_%28Nichols%29/03%3A_Crystallization/3.05%3A_Procedural_Generalities/3.5A%3A_General_Procedure',
      },
    ],
    number: '432',
  },
  {
    slug: 'chem-coordination-colors',
    name: '配位改变颜色与溶解',
    title: '从沉淀到配离子',
    question: '同一金属换了配体，性质怎样改变？',
    description: '用铜、银和铁的对照观察配体、颜色、沉淀与配合平衡。',
    color: '#7f9eb5',
    tag: '物质结构',
    related: ['chem-phenol-properties', 'chem-crystal-growth', 'chem-host-guest-recognition'],
    sources: [
      {
        title: 'RSC — Copper(II) and ammonia equilibrium',
        url: 'https://edu.rsc.org/experiments/an-equilibrium-using-copperii-and-ammonia/1711.article',
      },
      {
        title: 'University laboratory manual — Tetraamminecopper sulfate',
        url: 'https://www.pssou.ac.in/naac/1.3.3/2.%20MANUAL%20FOR%20FIELD%20WORK%2C%20PROJECTS%2C%20INTERNSHIP/BSC_CHEMISTRY.pdf',
      },
      {
        title: 'Yamaguchi and Ohtaki — Aqueous tetraamminecopper geometry',
        url: 'https://academic.oup.com/bcsj/article-abstract/52/2/415/7358133',
      },
      {
        title: 'Truman University — Silver solubility and formation constants',
        url: 'https://chemlab.truman.edu/chemical-principles/inorganic-quantitative-analysis/',
      },
      {
        title: 'Indiana University — Solubility of silver chloride',
        url: 'https://www.chem.indiana.edu/faculty-research/faculty-resources/chemistry-demos/demo/solubility-of-silver-chloride/',
      },
      {
        title: 'Buffalo State — Iron thiocyanate equilibrium',
        url: 'https://staff.buffalostate.edu/nazareay/che112/ex6.htm',
      },
    ],
    number: '431',
  },
  {
    slug: 'chem-electrolysis-plating',
    name: '电解与铜电镀',
    title: '怎样把铜留在指定的电极上？',
    question: '怎样把铜留在指定的电极上？',
    description:
      '沿电源、导线、离子和电极界面追踪氯化铜电解，再比较铁件表面处理、电镀、反接与断路置换。',
    color: '#cbdcd1',
    tag: '电解 · 铜电镀 · 电量守恒',
    related: [
      'chem-galvanic-cells',
      'chem-acid-evidence',
      'chem-ionic-conduction',
      'chem-corrosion-protection',
    ],
    sources: [
      {
        title: 'RSC — Microscale copper chloride electrolysis',
        url: 'https://edu.rsc.org/experiments/electrolysis-on-a-microscale-14-16-years/4020615.article',
      },
      {
        title: 'University of Arizona — Copper electrolysis',
        url: 'https://superfund.arizona.edu/resources/learning-modules-english/copper-mining-and-processing/hands-activity-guide-copper',
      },
      {
        title: 'University of Wisconsin — Metal displacement',
        url: 'https://www2.chem.wisc.edu/deptfiles/genchem/sstutorial/Text8/Tx82/tx82.html',
      },
    ],
    number: '430',
  },
  {
    slug: 'chem-solvent-extraction',
    name: '萃取与分液',
    title: '溶质去了哪一层？',
    question: '溶质去了哪一层？',
    description: '分清溶质分配、密度分层与分液通气，比较分次萃取和固液萃取。',
    color: '#c2c9a4',
    tag: '两相分配',
    related: ['rayleigh-scattering', 'chem-benzoic-recrystallization'],
    sources: [
      {
        title: 'Lisa Nichols: extraction theory',
        url: 'https://chem.libretexts.org/Bookshelves/Organic_Chemistry/Organic_Chemistry_Lab_Techniques_%28Nichols%29/04%3A_Extraction/4.05%3A_Extraction_Theory',
      },
      {
        title: 'Lisa Nichols: extraction procedures',
        url: 'https://chem.libretexts.org/Bookshelves/Organic_Chemistry/Organic_Chemistry_Lab_Techniques_%28Nichols%29/04%3A_Extraction/4.06%3A_Step-by-Step_Procedures_For_Extractions',
      },
    ],
    number: '429',
  },
  {
    slug: 'chem-metal-and-graphite',
    name: '金属与石墨的电子结构',
    title: '结合、滑移与定向导电',
    question: '都会导电，内部的连接也一样吗？',
    description: '从金属共有电子到石墨层状结构，比较滑移与导电方向。',
    color: '#8caa9c',
    tag: '物质结构',
    related: ['chem-crystal-bonding', 'chem-crystal-diffraction', 'chem-coordination-colors'],
    sources: [
      {
        title: 'University of Texas — Metallic solids',
        url: 'https://ch301.cm.utexas.edu/imfs/solids/metallic-solids.html',
      },
      {
        title: 'Cambridge DoITPoMS — Slip and crystallographic planes',
        url: 'https://www.doitpoms.ac.uk/tlplib/miller_indices/uses.php',
      },
      {
        title: 'UCSB — Drude transport lecture',
        url: 'https://web.physics.ucsb.edu/~phys123B/w2015/lecture1.pdf',
      },
      {
        title: 'Primak and Fuchs — C-axis electrical conductivity of graphite',
        url: 'https://journals.aps.org/pr/abstract/10.1103/PhysRev.103.544',
      },
      {
        title: 'Nature Communications — Stacking-fault scattering in graphite',
        url: 'https://www.nature.com/articles/ncomms6837',
      },
    ],
    number: '428',
  },
  {
    slug: 'chem-distillation',
    name: '蒸馏与馏分',
    title: '蒸气为什么与瓶里的液体不同？',
    question: '蒸气为什么与瓶里的液体不同？',
    description: '沿连续装置追踪汽化、冷凝和收集，比较三种氯代甲烷在汽相、液相与馏分中的组成。',
    color: '#b4c5b3',
    tag: '挥发性差异',
    related: ['rayleigh-scattering', 'chem-solvent-extraction'],
    sources: [
      {
        title: 'NIST: dichloromethane phase changes',
        url: 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C75092&Mask=4',
      },
      {
        title: 'NIST: chloroform phase changes',
        url: 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C67663&Mask=4',
      },
      {
        title: 'NIST: carbon tetrachloride phase changes',
        url: 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C56235&Mask=4',
      },
    ],
    number: '427',
  },
  {
    slug: 'chem-hydrolysis-applications',
    name: '盐的水解与实验条件',
    title: '盐溶于水，为什么不一定呈中性？',
    question: '盐溶于水，为什么不一定呈中性？',
    description: '从六种盐的酸碱性到铁盐水解，再用连续颗粒、胶体制备和冷热冲洗观察水解的应用。',
    color: '#ced6b9',
    tag: '盐类水解 · 凝聚 · 实验对照',
    related: [
      'chem-acid-evidence',
      'chem-colloid-light',
      'chem-equilibrium-response',
      'chem-electrolysis-plating',
    ],
    sources: [
      {
        title: 'Colorado Boulder — Salts as acids and bases',
        url: 'https://www.colorado.edu/lab/lecture-demo-manual/e780-acidbase-salts-acids-and-bases',
      },
      {
        title: 'Wisconsin — Salt hydrolysis',
        url: 'https://www2.chem.wisc.edu/deptfiles/genchem/sstutorial/Text12/Tx1210/tx1210.html',
      },
      {
        title: 'Iron(III) hydrolysis and solubility at25C',
        url: 'https://pubs.acs.org/doi/10.1021/es070174h',
      },
      {
        title: 'EPA — Coagulation mechanisms and water conditions',
        url: 'https://www.epa.gov/pesticide-science-and-assessing-pesticide-risks/finalization-guidance-incorporation-water-treatment',
      },
      {
        title: 'RSC — Alkaline hydrolysis of lipids',
        url: 'https://edu.rsc.org/exhibition-chemistry/soap-from-bacon-the-dangers-of-alkaline-solutions/2020068.article',
      },
    ],
    number: '426',
  },
  {
    slug: 'chem-crystal-bonding',
    name: '晶体中的连接层次',
    title: '从独立分子到共价网络',
    question: '晶体分开时，到底断开什么连接？',
    description: '追踪碘、水、金刚石和石英中的真实连接关系。',
    color: '#8b9b7b',
    tag: '物质结构',
    related: ['chem-hydrogen-bond-network', 'chem-crystal-diffraction', 'chem-metal-and-graphite'],
    sources: [
      {
        title: 'OpenStax — Bonding in crystalline solids',
        url: 'https://openstax.org/books/chemistry-2e/pages/10-5-the-solid-state-of-matter',
      },
      {
        title: 'NIST — Iodine diatomic constants',
        url: 'https://webbook.nist.gov/cgi/cbook.cgi?Mask=1000&Source=1973TEL849',
      },
      {
        title: 'Sutter et al. — α-quartz coordinates at 298 K',
        url: 'https://journals.iucr.org/j/issues/2022/04/00/te5094/index.html',
      },
      {
        title: 'GIA — Hardness, toughness and diamond cleavage',
        url: 'https://www.gia.edu/gia-news-research/how-protect-diamond-chipping',
      },
    ],
    number: '425',
  },
  {
    slug: 'chem-seawater-membranes',
    name: '海水与分离膜',
    title: '水穿过，盐留下什么？',
    question: '水穿过，盐留下什么？',
    description: '从蒸馏到反渗透，追踪水、盐与浓缩液，再比较四类高分子分离膜。',
    color: '#b5c3a4',
    tag: '选择性分离',
    related: ['rayleigh-scattering', 'chem-distillation'],
    sources: [
      {
        title: 'DuPont: reverse osmosis',
        url: 'https://www.dupont.com/water/technologies/reverse-osmosis-ro.html',
      },
      {
        title: 'US EPA: treatment technologies',
        url: 'https://www.epa.gov/sdwa/overview-drinking-water-treatment-technologies',
      },
    ],
    number: '424',
  },
  {
    slug: 'chem-crystal-diffraction',
    name: '晶胞与衍射的证据',
    title: '从共享空间，到重建结构',
    question: '亮斑怎样告诉我们看不见的排列？',
    description: '算清晶胞中的共享份额，比较周期、准周期与无序，再从公开坐标测量有机结构。',
    color: '#dce8df',
    tag: '物质结构',
    related: ['chem-crystal-growth', 'chem-infrared-structure', 'chem-crystal-bonding'],
    sources: [
      {
        title: 'IUCr — Crystal definition',
        url: 'https://dictionary.iucr.org/Crystal',
      },
      {
        title: 'Frank — A primer of substitution tilings',
        url: 'https://pages.vassar.edu/nafrank/files/2012/08/substitutions.pdf',
      },
      {
        title: 'IUCr — Calculation of structure factors',
        url: 'https://www.iucr.org/what-we-do/education/pamphlets/introduction-calculation-of-structure-factors',
      },
      {
        title: 'Fetah et al. — Published artemisinin coordinate and geometry tables',
        url: 'https://journals.iucr.org/b/issues/2026/03/00/aw5104/index.html',
      },
    ],
    number: '423',
  },
  {
    slug: 'chem-metal-extraction',
    name: '金属冶炼的还原路线',
    title: '矿物中的金属怎样回到单质？',
    question: '矿物中的金属怎样回到单质？',
    description: '比较热分解、还原剂与熔盐电解，追踪元素和电子的去向。',
    color: '#8f9686',
    tag: '冶炼原理',
    related: ['chem-electron-transfer', 'chem-ionic-conduction', 'chem-seawater-membranes'],
    sources: [
      {
        title: 'OpenStax representative metals',
        url: 'https://openstax.org/books/chemistry-2e/pages/18-2-occurrence-and-preparation-of-the-representative-metals',
      },
      {
        title: 'OpenStax metallurgy',
        url: 'https://openstax.org/books/chemistry-2e/pages/19-1-occurrence-preparation-and-properties-of-transition-metals-and-their-compounds',
      },
      {
        title: 'OpenStax electrolysis',
        url: 'https://openstax.org/books/chemistry-2e/pages/17-7-electrolysis',
      },
    ],
    number: '422',
  },
  {
    slug: 'chem-petroleum-refining',
    name: '石油的分离与裂化',
    title: '分开分子，还是拆开分子',
    question: '分馏与裂化，都得到小分子吗？',
    description:
      '追踪同一批代表分子经过分馏塔，再用保留碳原子身份的净反应，区分物理分离与化学转化。',
    color: '#e7e9d9',
    tag: '石油化工',
    related: ['chem-unsaturated-hydrocarbons', 'chem-carbon-frameworks', 'chem-metal-extraction'],
    sources: [
      {
        title: 'EIA — The refining process',
        url: 'https://www.eia.gov/energyexplained/oil-and-petroleum-products/refining-crude-oil-the-refining-process.php',
      },
      {
        title: 'NIST Chemistry WebBook — Hexadecane',
        url: 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C544763&Mask=4',
      },
      {
        title: 'NIST Chemistry WebBook — Tetracosane',
        url: 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C646311&Mask=4',
      },
      {
        title: 'OpenStax — Industrial preparation and use of alkenes',
        url: 'https://openstax.org/books/organic-chemistry/pages/7-1-industrial-preparation-and-use-of-alkenes',
      },
    ],
    number: '421',
  },
  {
    slug: 'chem-acid-base-titration',
    name: '最后半滴与滴定读数',
    title: '最后半滴，为什么能改变测量结果？',
    question: '最后半滴，为什么能改变测量结果？',
    description: '从滴定曲线和实际液路出发，观察润洗、量取、半滴、终点、重复读数与浓度计算。',
    color: '#d9d5bd',
    tag: '中和滴定 · 读数 · 误差',
    related: ['chem-acid-evidence', 'chem-equilibrium-response', 'chem-hydrolysis-applications'],
    sources: [
      {
        title: 'Purdue — Use of the buret',
        url: 'https://chemed.chem.purdue.edu/genchem/lab/equipment/buret/use.html',
      },
      {
        title: 'Purdue — Performing the titration',
        url: 'https://chemed.chem.purdue.edu/genchem/lab/techniques/titration/perform.html',
      },
      {
        title: 'Harper College — Performing titrations',
        url: 'https://dept.harpercollege.edu/chemistry/chm/100/dgodambe/thedisk/labtech/titrate2.htm',
      },
      {
        title: 'Boston College — Titration laboratory procedure',
        url: 'https://dev.bc.edu/content/dam/bc1/schools/mcas/Chemistry/pdf/undergrad/lab-courses/gen/fall/Titration.pdf',
      },
    ],
    number: '420',
  },
  {
    slug: 'chem-tofu-coagulation',
    name: '豆腐的制作',
    title: '豆浆怎样变成含水的豆腐？',
    question: '豆浆怎样变成含水的豆腐？',
    description: '沿着泡豆、磨豆、过滤、煮浆、点卤和压制，追踪蛋白质网络与水分去向。',
    color: '#a29470',
    tag: '食品化学',
    related: ['chem-protein-states', 'chem-colloid-light'],
    sources: [
      {
        title: 'Li et al.2024 soybean coagulation',
        url: 'https://ift.onlinelibrary.wiley.com/doi/10.1111/1750-3841.17498',
      },
      {
        title: 'Zhao et al.2016 calcium sulfate gels',
        url: 'https://doi.org/10.1111/ijfs.13010',
      },
    ],
    number: '419',
  },
  {
    slug: 'chem-protein-structure',
    name: '蛋白质的多级结构',
    title: '同一条链，为什么有不同层次的结构？',
    question: '同一条链，为什么有不同层次的结构？',
    description: '从真实序列、螺旋与折叠，追踪到完整蛋白质和四链血红蛋白。',
    color: '#8c786e',
    tag: '分子结构',
    related: ['chem-protein-states', 'bio-dna-structure'],
    sources: [
      {
        title: 'RCSB PDB 1CRN',
        url: 'https://www.rcsb.org/structure/1CRN',
      },
      {
        title: 'RCSB PDB 4HHB',
        url: 'https://www.rcsb.org/structure/4HHB',
      },
      {
        title: 'PDB-101 biological assemblies',
        url: 'https://pdb101.rcsb.org/learn/guide-to-understanding-pdb-data/biological-assemblies',
      },
    ],
    number: '418',
  },
  {
    slug: 'chem-crystal-growth',
    name: '晶体从哪里长出来',
    title: '留下形状，也留下生长的层次',
    question: '结晶一定要先把物质溶进水里吗？',
    description: '追踪熔体、蒸气、溶液三条路径，再养大一颗保留原核的明矾晶体。',
    color: '#e4ebe2',
    tag: '物质结构',
    related: ['chem-liquid-crystal', 'chem-hydrogen-bond-network', 'chem-crystal-diffraction'],
    sources: [
      {
        title: 'UW–Madison — Precipitating sodium chloride',
        url: 'https://demolab.chem.wisc.edu/analytical-chemistry-demonstrations/dissociation-and-solubility-precipitating-sodium-chloride-from-its-solution-2/',
      },
      {
        title: 'University of Colorado — Sublimation demonstration',
        url: 'https://www.colorado.edu/lab/lecture-demo-manual/t560-prep-notes',
      },
      {
        title: 'IUCr — Crystal growing guidance',
        url: 'https://www.iucr.org/__data/assets/pdf_file/0010/155944/CG_brochure.pdf',
      },
      {
        title: 'National Taiwan University — Preparation of alum',
        url: 'https://teaching.ch.ntu.edu.tw/gclab/eng/wp-content/uploads/5_M07_Preparation-of-alum.pdf',
      },
    ],
    number: '417',
  },
  {
    slug: 'chem-acid-evidence',
    name: '弱酸的三种证据',
    title: '弱酸为什么也能放出一样多的氢气？',
    question: '弱酸为什么也能放出一样多的氢气？',
    description:
      '分开离子浓度、反应速率与酸的总量，用 pH、导电、碳酸盐和镁的压强曲线比较盐酸与醋酸。',
    color: '#cbd9bd',
    tag: '弱酸 · 电离 · 实验证据',
    related: ['chem-reaction-rates', 'chem-equilibrium-response', 'chem-acid-base-titration'],
    sources: [
      {
        title: 'RSC — The acidic reactions of ethanoic acid',
        url: 'https://edu.rsc.org/experiments/the-acidic-reactions-of-ethanoic-acid/462.article',
      },
      {
        title: 'Purdue — Weak acids and pH',
        url: 'https://chemed.chem.purdue.edu/genchem/topicreview/bp/ch17/ph.php',
      },
      {
        title: 'Conductance measurements, Current Separations 18:3',
        url: 'https://citeseerx.ist.psu.edu/document?doi=3dab888c40a36852c81dbf9ba98c328887921a36&repid=rep1&type=pdf',
      },
    ],
    number: '416',
  },
  {
    slug: 'chem-protein-states',
    name: '蛋白质的盐析与变性',
    title: '同样浑浊，加水后为什么不同？',
    question: '同样浑浊，加水后为什么不同？',
    description: '比较盐析复溶、三种变性处理、铅盐凝聚与硝酸显色，并区分灼烧。',
    color: '#b9c2a3',
    tag: '蛋白质实验',
    related: [
      'chem-sugar-tests',
      'chem-colloid-light',
      'chem-protein-structure',
      'chem-tofu-coagulation',
    ],
    sources: [
      {
        title: 'University of Maryland: ammonium sulfate precipitation',
        url: 'https://terpconnect.umd.edu/~nsw/ench485/lab6a.htm',
      },
      {
        title: 'Merck: protein precipitation and resuspension',
        url: 'https://www.sigmaaldrich.com/CX/en/technical-documents/technical-article/protein-biology/protein-lysis-and-extraction/precipitation-procedures',
      },
      {
        title: 'OpenStax: proteins',
        url: 'https://openstax.org/books/biology-2e/pages/3-4-proteins',
      },
    ],
    number: '415',
  },
  {
    slug: 'chem-liquid-crystal',
    name: '液晶的两次变化',
    title: '已经能流动，为什么还不一样',
    question: '位置和方向的有序，必须同时消失吗？',
    description: '从历史样品的熔点与澄清点，走向可分开的有序性与受边界约束的电场取向。',
    color: '#e1e9d2',
    tag: '物质结构',
    related: ['chem-molecular-shapes', 'chem-chirality-evidence', 'chem-crystal-growth'],
    sources: [
      {
        title: 'Kent State — History of liquid-crystal research',
        url: 'https://www.kent.edu/amlci/our-legacy',
      },
      {
        title: 'Andrienko — Introduction to liquid crystals, Max Planck author copy',
        url: 'https://pages-andrienko-10bcaa2045685d6c9509367c68ef5f030a701b968e1f8e8.pages.mpip-mainz.mpg.de/teaching/liquid_crystals/liquid_crystals.pdf',
      },
    ],
    number: '414',
  },
  {
    slug: 'chem-sugar-tests',
    name: '糖类的检验与水解',
    title: '水解前后，检验为什么会变？',
    question: '水解前后，检验为什么会变？',
    description: '分开观察溶解、碘显色、银镜与铜沉淀，追踪水解改变的样品与检验条件。',
    color: '#b7bca3',
    tag: '糖类实验',
    related: ['chem-aldehyde-tests', 'chem-ester-reaction', 'chem-protein-states'],
    sources: [
      {
        title: 'OpenStax: monosaccharide reactions',
        url: 'https://openstax.org/books/organic-chemistry/pages/25-6-reactions-of-monosaccharides',
      },
      {
        title: 'OpenStax: disaccharides',
        url: 'https://openstax.org/books/organic-chemistry/pages/25-8-disaccharides',
      },
      {
        title: 'RSC: detecting starch in food',
        url: 'https://edu.rsc.org/experiments/detecting-starch-in-food-on-a-microscale/563.article',
      },
    ],
    number: '413',
  },
  {
    slug: 'chem-equilibrium-response',
    name: '平衡改变之前，颜色先发生了什么',
    title: '平衡不动，为什么反应还在继续？',
    question: '平衡不动，为什么反应还在继续？',
    description: '从双向反应到气体压缩、冷热交换与溶液颜色，追踪条件改变、瞬时效应和新的平衡。',
    color: '#d8ceb6',
    tag: '化学平衡 · 压强 · 温度',
    related: ['chem-reaction-rates', 'chem-galvanic-cells', 'chem-acid-evidence'],
    sources: [
      {
        title: 'Purdue — Nitrogen oxide pressure equilibrium',
        url: 'https://chemed.chem.purdue.edu/demos/demosheets/16.2.html',
      },
      {
        title: 'Purdue — Temperature and NO2/N2O4',
        url: 'https://chemed.chem.purdue.edu/demos/demosheets/16.3.html',
      },
      {
        title: 'Purdue — Iron thiocyanate equilibria',
        url: 'https://chemed.chem.purdue.edu/demos/demosheets/18.5.html',
      },
      {
        title: 'RSC — Chromate–dichromate equilibrium',
        url: 'https://edu.rsc.org/experiments/a-chromate-dichromate-equilibrium/1710.article',
      },
      {
        title: 'University of Sydney — Chemistry demonstrations',
        url: 'https://scilearn.sydney.edu.au/fychemistry/demonstrations/files/fullset.pdf',
      },
      {
        title: 'BASF — Fertilizer out of thin air',
        url: 'https://www.basf.com/gb/en/media/science-around-us/fertilizer-out-of-thin-air',
      },
    ],
    number: '412',
  },
  {
    slug: 'chem-chirality-evidence',
    name: '手性、晶体与旋光证据',
    title: '镜像能转成同一个吗',
    question: '从不能重合的基团排列，怎样走到巴斯德的实验结论？',
    description: '保留基团与晶体身份，用旋转、分选、溶解和旋光检验空间结构。',
    color: '#e4e9d5',
    tag: '物质结构',
    related: ['chem-molecular-shapes', 'chem-wohler-isomers', 'chem-liquid-crystal'],
    sources: [
      {
        title: 'IUPAC — Enantiomer',
        url: 'https://goldbook.iupac.org/terms/view/E02069',
      },
      {
        title: 'University of Illinois — Pasteur 1848 paper and figures',
        url: 'https://xray-exhibit.scs.illinois.edu/books/pasteur.php',
      },
      {
        title: 'IUPAC — Angle of optical rotation',
        url: 'https://old.goldbook.iupac.org/pdf/A00348.pdf',
      },
      {
        title: 'OpenStax — Polarization and Malus’s law',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/1-7-polarization',
      },
    ],
    number: '411',
  },
  {
    slug: 'chem-ester-reaction',
    name: '乙酸乙酯的制备与水解',
    title: '酯从哪里收集，又怎样水解？',
    question: '酯从哪里收集，又怎样水解？',
    description: '从综合性质证据走进连通的制酯装置，再控制介质与温度比较水解。',
    color: '#b9b38c',
    tag: '酯化与水解',
    related: ['chem-alcohol-oxidation', 'chem-sodium-alcohol', 'chem-sugar-tests'],
    sources: [
      {
        title: 'OpenStax: chemistry of esters',
        url: 'https://openstax.org/books/organic-chemistry/pages/21-6-chemistry-of-esters',
      },
      {
        title: 'OpenStax: carboxylic-acid reactions',
        url: 'https://openstax.org/books/organic-chemistry/pages/21-3-reactions-of-carboxylic-acids',
      },
      {
        title: 'NIOSH: ethyl acetate',
        url: 'https://www.cdc.gov/niosh/npg/npgd0260.html',
      },
    ],
    number: '410',
  },
  {
    slug: 'chem-reaction-rates',
    name: '怎样比较化学反应的快慢',
    title: '反应更快，是相遇更多还是更容易成功？',
    question: '反应更快，是相遇更多还是更容易成功？',
    description: '从固定教材条件与同一观测标准，追踪相遇、能量门槛和催化路径，再检验新条件的预测。',
    color: '#c8d9c5',
    tag: '反应速率 · 控制变量 · 有效碰撞',
    related: ['chem-galvanic-cells', 'bio-enzyme-investigations', 'chem-equilibrium-response'],
    sources: [
      {
        title: 'RSC — Monitoring reactions',
        url: 'https://edu.rsc.org/cpd/monitoring-reactions-teaching-practical-science/3009854.article',
      },
      {
        title: 'RSC — temperature reaction-rate experiment',
        url: 'https://edu.rsc.org/experiments/the-effect-of-temperature-on-reaction-rate/448.article',
      },
      {
        title: 'IUPAC Gold Book — catalyst',
        url: 'https://goldbook.iupac.org/terms/view/C00876',
      },
      {
        title: 'IUPAC Gold Book — Activation energy',
        url: 'https://goldbook.iupac.org/terms/view/A00102',
      },
      {
        title: 'IUPAC Gold Book — activation energy',
        url: 'https://old.goldbook.iupac.org/html/A/A00102.html',
      },
      {
        title: 'RSC — teacher notes',
        url: 'https://edu.rsc.org/download?ac=523271',
      },
    ],
    number: '409',
  },
  {
    slug: 'chem-hydrogen-bond-network',
    name: '氢键与冰的开放结构',
    title: '分子完整，排列改变',
    question: '冰为什么比液态水更疏松？',
    description: '从氧间距离、四面体邻居到六方网络，区分融化中的分子与连接。',
    color: '#dfe8d6',
    tag: '物质结构',
    related: ['chem-molecular-shapes', 'chem-infrared-structure', 'chem-chirality-evidence'],
    sources: [
      {
        title: 'Caltech — Physical properties of ice',
        url: 'https://www.its.caltech.edu/~atomic/snowcrystals/ice/ice.htm',
      },
      {
        title: 'Georgia Tech — Molecular interactions',
        url: 'https://williams.chemistry.gatech.edu/structure/molecular_interactions/mol_int.html',
      },
      {
        title: 'USGS — Water density',
        url: 'https://www.usgs.gov/water-science-school/science/water-density',
      },
    ],
    number: '408',
  },
  {
    slug: 'chem-alcohol-oxidation',
    name: '乙醇的两种氧化',
    title: '铜丝为什么变黑又变红？',
    question: '铜丝为什么变黑又变红？',
    description: '追踪同一根铜丝的催化循环，再比较酸性重铬酸钾的氧化证据。',
    color: '#b6a07b',
    tag: '有机氧化',
    related: ['chem-sodium-alcohol', 'chem-aldehyde-tests', 'chem-ester-reaction'],
    sources: [
      {
        title: 'University of Göttingen: ethanal from ethanol',
        url: 'https://unterrichtsmaterialien-chemie.uni-goettingen.de/exp_neu.php?id=2137',
      },
      {
        title: 'OpenStax: oxidation of alcohols',
        url: 'https://openstax.org/books/organic-chemistry/pages/17-7-oxidation-of-alcohols',
      },
    ],
    number: '407',
  },
  {
    slug: 'chem-sodium-alcohol',
    name: '钠与乙醇的证据链',
    title: '气泡里的氢来自乙醇的哪里？',
    question: '气泡里的氢来自乙醇的哪里？',
    description: '从气体、燃烧产物和羟基氢追踪钠与乙醇反应，再与钠水反应作相同条件对照。',
    color: '#b6c5a4',
    tag: '羟基 · 气体检验 · 对照',
    related: ['chem-sodium-reactions', 'chem-carbon-frameworks', 'chem-alcohol-oxidation'],
    sources: [
      {
        title: 'RSC — Properties of alcohols',
        url: 'https://edu.rsc.org/experiments/the-properties-of-alcohols/463.article',
      },
      {
        title: 'RSC — Sodium density and properties',
        url: 'https://periodic-table.rsc.org/element/11/sodium',
      },
      {
        title: 'OpenStax — Alcohol and phenol properties, original author text',
        url: 'https://openstax.org/books/organic-chemistry/pages/17-2-properties-of-alcohols-and-phenols',
      },
      {
        title: '人教版必修二77—78页、选必三7页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '406',
  },
  {
    slug: 'chem-mass-spectrometry',
    name: '质谱分离与分子式证据',
    title: '先分开离子，再解释峰',
    question: '最高的峰、最右的峰，哪一个能说明分子质量？',
    description: '从电子电离、磁场曲率到碎片与同位素，检查分子质量推断所需的条件。',
    color: '#dde5ce',
    tag: '物质结构',
    related: ['chem-elemental-analysis', 'chem-infrared-structure'],
    sources: [
      {
        title: 'IUPAC Gold Book — Mass-to-charge ratio',
        url: 'https://goldbook.iupac.org/terms/view/M03752.html',
      },
      {
        title: 'NIST Chemistry WebBook — Ethanol mass spectrum',
        url: 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C64175&Mask=200',
      },
      {
        title: 'University of Arizona — Alcohol mass-spectrometry example',
        url: 'https://cbc.arizona.edu/education/mass-spectrometry-tutorial/mass-spectrometry-examples/quiz-alcohols',
      },
      {
        title: 'NIST — Carbon isotopic compositions',
        url: 'https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ascii=html&ele=C&isotype=all',
      },
    ],
    number: '405',
  },
  {
    slug: 'chem-galvanic-cells',
    name: '原电池中的两条电荷通路',
    title: '电子绕过溶液，电路怎样闭合？',
    question: '电子绕过溶液，电路怎样闭合？',
    description: '从锌铜稀酸、水果与湿纸到盐桥和简易燃料电池，追踪真实连接、离子补偿和有限反应物。',
    color: '#c1d6cb',
    tag: '原电池 · 盐桥 · 燃料电池',
    related: ['chem-ionic-conduction', 'chem-electron-transfer', 'battery-emf-lab'],
    sources: [
      {
        title: 'Purdue Chemistry — Electrochemical reactions',
        url: 'https://chemed.chem.purdue.edu/genchem/topicreview/bp/ch20/electro.php',
      },
      {
        title: 'RSC Education — Batteries and electrochemical cells',
        url: 'https://edu.rsc.org/feature/batteries-and-electrochemical-cells/3007554.article',
      },
      {
        title: 'University of Washington — Electrolysis of water',
        url: 'https://chem.washington.edu/lecture-demos/electrolysis-water',
      },
      {
        title: 'RSC Periodic Table — Zinc',
        url: 'https://periodic-table.rsc.org/element/30/zinc',
      },
      {
        title: 'RSC Periodic Table — Copper',
        url: 'https://periodic-table.rsc.org/element/29/copper',
      },
    ],
    number: '404',
  },
  {
    slug: 'chem-unsaturated-hydrocarbons',
    name: '乙烯与乙炔的性质证据',
    title: '两次褪色，解释为什么不同？',
    question: '两次褪色，解释为什么不同？',
    description: '按教材顺序比较燃烧、氧化与加成，再追踪乙炔从发生到净化和性质检验的完整气路。',
    color: '#b4c3a4',
    tag: '氧化 · 加成 · 排除干扰',
    related: ['chem-methane-substitution', 'chem-carbon-frameworks', 'chem-petroleum-refining'],
    sources: [
      {
        title: 'OpenStax — Reactions of alkynes, original author text',
        url: 'https://openstax.org/books/organic-chemistry/pages/9-3-reactions-of-alkynes-addition-of-hx-and-x2',
      },
      {
        title: 'UW-Madison — Organic chemistry carbide lamp',
        url: 'https://demolab.chem.wisc.edu/general-chemistry-demonstrations-topic-page/organic-chemistry-carbide-lamp-2/',
      },
      {
        title: 'RSC — Preparing ethyne on a microscale',
        url: 'https://edu.rsc.org/experiments/preparing-ethyne-on-a-microscale/551.article',
      },
      {
        title: '人教版必修二67—68页、选必三37—38页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '403',
  },
  {
    slug: 'chem-infrared-structure',
    name: '红外吸收与结构证据',
    title: '透过光变弱，结构线索浮现',
    question: '怎样从一段红外吸收推断分子里的官能团？',
    description: '沿同一光路比较强度，连接振动、透过率谱与乙醇和二甲醚的结构证据。',
    color: '#dce5ce',
    tag: '物质结构',
    related: ['chem-nmr-hydrogen', 'chem-organic-detection', 'chem-mass-spectrometry'],
    sources: [
      {
        title: 'OpenStax — Infrared spectroscopy',
        url: 'https://openstax.org/books/organic-chemistry/pages/12-6-infrared-spectroscopy',
      },
      {
        title: 'OpenStax — Spectroscopy of alcohols and phenols',
        url: 'https://openstax.org/books/organic-chemistry/pages/17-11-spectroscopy-of-alcohols-and-phenols',
      },
      {
        title: 'NIST — Infrared studies for atmospheric atlases',
        url: 'https://www.nist.gov/pml/sensor-science/optical-radiation/infrared-studies-atmospheric-atlases',
      },
    ],
    number: '402',
  },
  {
    slug: 'chem-noble-gas-evidence',
    name: '稀有气体的发现证据',
    title: '一条谱线，一点质量差，一次新反应',
    question: '科学家如何从微小差别发现元素，再修正“惰性”的判断？',
    description: '对齐氦谱线，追踪氩的分离，再观察密封容器中氙参与反应的证据。',
    color: '#dce5d1',
    tag: '物质结构',
    related: ['chem-flame-spectra', 'chem-periodic-practical', 'chem-infrared-structure'],
    sources: [
      {
        title: 'NIST — Persistent lines of neutral helium',
        url: 'https://www.physics.nist.gov/PhysRefData/Handbook/Tables/heliumtable3.htm',
      },
      {
        title: 'NIST — Strong lines of sodium',
        url: 'https://www.physics.nist.gov/PhysRefData/Handbook/Tables/sodiumtable2.htm',
      },
      {
        title: 'Nobel Prize — William Ramsay',
        url: 'https://www.nobelprize.org/prizes/chemistry/1904/ramsay/facts/',
      },
      {
        title: 'American Chemical Society — Neil Bartlett and reactive noble gases',
        url: 'https://www.acs.org/education/whatischemistry/landmarks/bartlettnoblegases.html',
      },
      {
        title: 'NIST — Atomic xenon data',
        url: 'https://physics.nist.gov/PhysRefData/Handbook/Tables/xenontable1.htm',
      },
      {
        title: 'NIST Chemistry WebBook — Molecular oxygen ionization energy',
        url: 'https://webbook.nist.gov/cgi/cbook.cgi?Formula=O2&NoIon=on&cIE=on&cTG=on',
      },
      {
        title: 'Lawrence Berkeley Laboratory — Oxidation products of xenon and platinum fluorides',
        url: 'https://escholarship.org/content/qt46b5r4v5/qt46b5r4v5.pdf',
      },
    ],
    number: '401',
  },
  {
    slug: 'chem-methane-substitution',
    name: '甲烷的光照取代',
    title: '为什么一侧褪色、出现液滴并抬高液面？',
    question: '为什么一侧褪色、出现液滴并抬高液面？',
    description: '比较甲烷与氯气的光照和遮光样本，追踪原子取代与多种可见证据。',
    color: '#bdc59f',
    tag: '对照 · 取代 · 产物混合物',
    related: ['chem-carbon-frameworks', 'chem-hydrogen-chlorine', 'chem-unsaturated-hydrocarbons'],
    sources: [
      {
        title: 'OpenStax — Radical halogenation, original author textbook',
        url: 'https://openstax.org/books/organic-chemistry/pages/10-2-preparing-alkyl-halides-from-alkanes-radical-halogenation',
      },
      {
        title: 'NIST — Chloromethane boiling point',
        url: 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C74873&Type=TBOIL',
      },
      {
        title: '人教版必修第二册第64—65页实验7-1',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '400',
  },
  {
    slug: 'bio-biotechnology-investigation',
    name: '转基因产品的证据调查',
    title: '一张证书或一行标签，究竟能说明什么？',
    question: '一张证书或一行标签，究竟能说明什么？',
    description: '对照原始批准条目、包装原文和调查记录，识别用途边界、缺失信息及营销推断。',
    color: '#ced8bc',
    tag: '社会调查 · 证据与标识',
    related: ['bio-protein-design', 'bio-dna-engineering', 'bio-fermentation-pathways'],
    sources: [
      {
        title: 'MARA —2024 imported-processing certificate list',
        url: 'https://www.moa.gov.cn/ztzl/zjyqwgz/spxx/202410/P020241011735468898553.pdf',
      },
      {
        title: 'MARA —2024 production-application certificate list',
        url: 'https://www.moa.gov.cn/ztzl/zjyqwgz/spxx/202410/P020241011735470924167.pdf',
      },
      {
        title: 'MARA — Agricultural GMO labelling rules,2017 revision',
        url: 'https://kjs.moa.gov.cn/zcjd/201904/t20190418_6184800.htm',
      },
      {
        title: 'MARA — Agricultural GMO safety regulation,2017 revision',
        url: 'https://kjs.moa.gov.cn/zcjd/201904/t20190418_6184797.htm',
      },
      {
        title: 'FDA —100 Years of Insulin',
        url: 'https://www.fda.gov/about-fda/fda-history-exhibits/100-years-insulin',
      },
      {
        title: 'MARA — Approval information',
        url: 'https://www.moa.gov.cn/ztzl/zjyqwgz/spxx/',
      },
    ],
    number: '399',
  },
  {
    slug: 'chem-polymer-networks',
    name: '聚合物连接与吸水网络',
    title: '从单体连接到吸水称量',
    question: '为什么连成网络的树脂能吸水，却不会像小分子一样散开？',
    description: '追踪加聚与缩聚的连接，比较酚醛树脂条件，再用守恒称量检查吸水率。',
    color: '#d7dfc8',
    tag: '有机化学',
    related: ['chem-soap-assembly', 'chem-phenol-properties'],
    sources: [
      {
        title: 'OpenStax — Chain-growth polymers',
        url: 'https://openstax.org/books/organic-chemistry/pages/31-1-chain-growth-polymers',
      },
      {
        title: 'OpenStax — Polymer structure and physical properties',
        url: 'https://openstax.org/books/organic-chemistry/pages/31-7-polymer-structure-and-physical-properties',
      },
      {
        title: 'Purdue University — Superabsorbent materials demonstration',
        url: 'https://chemed.chem.purdue.edu/genchem/demosheets/25.5.html',
      },
    ],
    number: '398',
  },
  {
    slug: 'chem-calorimetry',
    name: '温差与融冰量热',
    title: '怎样把反应热变成可测量的读数？',
    question: '怎样把反应热变成可测量的读数？',
    description: '从教材中和反应量热探究出发，追踪温差、热量和误差，再拆开历史冰量热计的独立水路。',
    color: '#b8c7b1',
    tag: '温差 · 能量归属 · 融冰',
    related: ['chem-reaction-heat', 'chem-bond-energy'],
    sources: [
      {
        title: 'RSC — Measuring energy changes',
        url: 'https://edu.rsc.org/cpd/measuring-energy-changes-teaching-practical-science/4010499.article',
      },
      {
        title: 'NBS — Vapor Pressure Formulation for Ice, latent heat reference',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5295832/',
      },
      {
        title: 'Lavoisier — Elements of Chemistry, original calorimeter description',
        url: 'https://www.gutenberg.org/files/30775/30775-h/30775-h.htm',
      },
      {
        title: 'Science Museum — Replica of Lavoisier’s calorimeter',
        url: 'https://collection.sciencemuseumgroup.org.uk/objects/co2543/replica-of-lavoisiers-calorimeter',
      },
      {
        title: '人教版选择性必修1第5—6、16页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '397',
  },
  {
    slug: 'bio-protein-design',
    name: '从蛋白质功能到序列证据',
    title: '交换两个氨基酸，怎样证明改造有效？',
    question: '交换两个氨基酸，怎样证明改造有效？',
    description: '沿真实胰岛素坐标找到改造位置，比较编码简并、条件化测定及带版本的成熟链序列。',
    color: '#d3d6b8',
    tag: '蛋白质工程 · 结构与序列',
    related: [
      'bio-dna-engineering',
      'bio-animal-cell-engineering',
      'bio-microbial-culture',
      'bio-biotechnology-investigation',
    ],
    sources: [
      {
        title: 'RCSB PDB — Human insulin structure1TRZ',
        url: 'https://www.rcsb.org/structure/1TRZ',
      },
      {
        title: 'RCSB PDB — Lispro hexamer structure1LPH',
        url: 'https://www.rcsb.org/structure/1LPH',
      },
      {
        title: 'NCBI Protein — Human insulin precursor NP_000198.1',
        url: 'https://www.ncbi.nlm.nih.gov/protein/NP_000198.1',
      },
      {
        title: 'NCBI Protein — Pig insulin precursor NP_001103242.1',
        url: 'https://www.ncbi.nlm.nih.gov/protein/NP_001103242.1',
      },
      {
        title: 'NCBI Protein — Bovine insulin precursor P01317.2',
        url: 'https://www.ncbi.nlm.nih.gov/protein/P01317.2',
      },
      {
        title: 'NCBI — BLAST glossary',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK62051/',
      },
    ],
    number: '396',
  },
  {
    slug: 'chem-bond-energy',
    name: '键能账本与盖斯路径',
    title: '断键吸能，反应为什么仍能放热？',
    question: '断键吸能，反应为什么仍能放热？',
    description: '追踪同一组原子的断键成键收支，再用石墨—一氧化碳—二氧化碳路径检验盖斯定律。',
    color: '#bfc8aa',
    tag: '键能 · 焓变 · 盖斯定律',
    related: ['chem-reaction-heat', 'chem-bond-overlap', 'chem-calorimetry'],
    sources: [
      {
        title: 'NIST — Hydrogen chloride thermochemistry',
        url: 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C7647010&Mask=1',
      },
      {
        title: 'NIST — Carbon monoxide thermochemistry',
        url: 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C630080&Mask=1',
      },
      {
        title: 'NIST — Carbon dioxide thermochemistry',
        url: 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C124389&Mask=1',
      },
      {
        title: 'IUPAC — Enthalpy',
        url: 'https://old.goldbook.iupac.org/html/E/E02141.html',
      },
      {
        title: '人教版必修第二册33页、选择性必修1第14—16页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '395',
  },
  {
    slug: 'chem-organic-detection',
    name: '有机结构与鉴别证据',
    title: '从目标倒推，从观察排除',
    question: '怎样把结构、反应条件和检验结果连接成可检查的推理？',
    description: '追踪逆合成的六个碳，并组合四类检验、阿司匹林水解与氢谱证据。',
    color: '#ccd6bd',
    tag: '有机化学',
    related: ['chem-aldehyde-tests', 'chem-nmr-hydrogen', 'chem-polymer-networks'],
    sources: [
      {
        title: 'E. J. Corey — Nobel lecture on retrosynthetic analysis',
        url: 'https://www.nobelprize.org/uploads/2018/06/corey-lecture.pdf',
      },
      {
        title: 'Royal Society of Chemistry — Microscale aspirin analysis',
        url: 'https://edu.rsc.org/experiments/analysis-of-aspirin-tablets-on-a-microscale/557.article',
      },
      {
        title: 'Royal Society of Chemistry — Aspirin preparation and phenolic impurities',
        url: 'https://edu.rsc.org/resources/the-preparation-of-aspirin-16-18-years/4017328.article',
      },
      {
        title: 'KFUPM — Organic classification tests',
        url: 'https://faculty.kfupm.edu.sa/Chem/hmuallem/courses/Chem303/Chem-303%20Classification%20Tests%20Handout.pdf',
      },
    ],
    number: '394',
  },
  {
    slug: 'chem-soap-assembly',
    name: '肥皂的形成与去污',
    title: '从三条酯键，到一个油水界面',
    question: '肥皂怎样从油脂中形成，又怎样帮助油污离开？',
    description: '连接皂化、盐析、洗涤、界面排列与硬水计量，保留制备研究的证据边界。',
    color: '#d4d1ab',
    tag: '有机化学',
    related: ['chem-elimination-substitution', 'chem-phenol-properties', 'chem-organic-detection'],
    sources: [
      {
        title: 'OpenStax — Soap',
        url: 'https://openstax.org/books/organic-chemistry/pages/27-2-soap',
      },
      {
        title: 'OpenStax — Ester hydrolysis',
        url: 'https://openstax.org/books/organic-chemistry/pages/21-6-chemistry-of-esters',
      },
      {
        title: 'Royal Society of Chemistry — Soap salting out',
        url: 'https://edu.rsc.org/exhibition-chemistry/soap-from-bacon-the-dangers-of-alkaline-solutions/2020068.article',
      },
    ],
    number: '393',
  },
  {
    slug: 'chem-reaction-heat',
    name: '反应热与冷热证据',
    title: '吸热为什么反而让杯底结冰？',
    question: '吸热为什么反而让杯底结冰？',
    description: '比较镁与盐酸的温升、反应后的散热，以及晶体反应吸热造成的界面结冰。',
    color: '#c7c9ac',
    tag: '反应热 · 相变 · 能量去向',
    related: ['chem-ammonium-cycle', 'chem-sulfur-transformations', 'chem-bond-energy'],
    sources: [
      {
        title: 'RSC — Exothermic metal–acid reactions',
        url: 'https://edu.rsc.org/experiments/exothermic-metal-acid-reactions/1731.article',
      },
      {
        title: 'University of Wisconsin — Endothermic barium hydroxide/ammonium salt reactions',
        url: 'https://www2.chem.wisc.edu/deptfiles/genchem/demonstrations/Gen_Chem_Pages/06thermopage/endothermic_reactions_of_b.htm',
      },
      {
        title: 'UC San Diego — Hydrated barium hydroxide and ammonium chloride',
        url: 'https://prod.chem.ucsd.edu/undergraduate/teaching-labs/demos/demo45.html',
      },
      {
        title: '人教版必修第二册32—33页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '392',
  },
  {
    slug: 'bio-dna-engineering',
    name: '从DNA分子到电泳条带',
    title: '剪开、提取、扩增后，怎样判断得到的DNA？',
    question: '剪开、提取、扩增后，怎样判断得到的DNA？',
    description: '追踪限制酶切点、粗提取对照、表达载体和PCR引物，用实际长度模型阅读凝胶条带。',
    color: '#c2cdbf',
    tag: 'DNA工具 · PCR · 电泳证据',
    related: [
      'bio-animal-cell-engineering',
      'bio-microbial-culture',
      'bio-plant-cell-engineering',
      'bio-protein-design',
    ],
    sources: [
      {
        title: 'NEB — EcoRI recognition and cleavage',
        url: 'https://www.neb.com/en-us/products/r0101-ecori',
      },
      {
        title: 'Addgene — Molecular biology reference',
        url: 'https://www.addgene.org/mol-bio-reference/',
      },
      {
        title: 'Addgene — Polymerase chain reaction',
        url: 'https://www.addgene.org/protocols/pcr/',
      },
      {
        title: 'Addgene — Agarose gel electrophoresis',
        url: 'https://www.addgene.org/protocols/gel-electrophoresis/',
      },
    ],
    number: '391',
  },
  {
    slug: 'chem-aldehyde-tests',
    name: '醛的两种还原检验',
    title: '银镜和砖红沉淀，电子去了哪里？',
    question: '同一个醛基，为什么给出两种不同的固体证据？',
    description: '从新制试剂到内壁银镜与氧化亚铜，按电子计量连接宏观现象。',
    color: '#cbd2bf',
    tag: '有机化学',
    related: ['chem-phenol-properties', 'chem-elimination-substitution', 'chem-soap-assembly'],
    sources: [
      {
        title: 'Royal Society of Chemistry — Silver mirror test',
        url: 'https://edu.rsc.org/experiments/the-silver-mirror-test-with-tollens-reagent/822.article',
      },
      {
        title: 'Rutgers University — Silver mirror formation',
        url: 'https://chem.rutgers.edu/cldf-demos/1032-cldf-demo-silver-mirror',
      },
      {
        title: 'CCEA — Further physical and organic chemistry',
        url: 'https://ccea.org.uk/downloads/docs/Support/eGuide/2020/A2%201%20Chemistry%20eGuide%3A%20Further%20Physical%20and%20Organic%20Chemistry.pdf',
      },
    ],
    number: '390',
  },
  {
    slug: 'chem-phenol-properties',
    name: '苯酚的多种证据',
    title: '一支试管的变化，需要哪一种解释？',
    question: '酸碱、取代与显色怎样分别支持结论？',
    description: '用可逆析出、邻对位溴代、铁盐显色和净化对照，追踪苯酚与羧酸的证据。',
    color: '#ccd0b4',
    tag: '有机化学',
    related: ['chem-aromatic-comparison', 'chem-elimination-substitution', 'chem-aldehyde-tests'],
    sources: [
      {
        title: 'University of Calgary — Phenol structure and acidity',
        url: 'https://www.chem.ucalgary.ca/courses/350/Carey5th/Ch24/ch24-1.html',
      },
      {
        title: 'KFUPM — Organic classification tests',
        url: 'https://faculty.kfupm.edu.sa/Chem/hmuallem/courses/Chem303/Chem-303%20Classification%20Tests%20Handout.pdf',
      },
      {
        title: 'Science Museum Group — Joseph Lister',
        url: 'https://collection.sciencemuseumgroup.org.uk/people/cp37522/joseph-lister',
      },
      {
        title: 'University of Massachusetts — Ionization constants at 25 °C',
        url: 'https://owl.oit.umass.edu/departments/Demo/appendix/chemistry/ion.html',
      },
    ],
    number: '389',
  },
  {
    slug: 'chem-rainwater-ph',
    name: '雨水pH与测量证据',
    title: '一次pH读数能说明多少？',
    question: '一次pH读数能说明多少？',
    description: '从直接取样、参照和校准出发，比较测量分辨率、连续记录与平均酸度的含义。',
    color: '#b9d0c3',
    tag: '环境测量 · 证据边界',
    related: ['chem-sulfur-dioxide', 'chem-nitrogen-oxides', 'chem-reaction-heat'],
    sources: [
      {
        title: 'US EPA — What is Acid Rain?',
        url: 'https://www.epa.gov/acidrain/what-acid-rain',
      },
      {
        title: 'USGS — pH measurement of low-conductivity waters',
        url: 'https://www.usgs.gov/publications/ph-measurement-low-conductivity-waters',
      },
      {
        title: 'NADP — National Trends Network sampling and quality checks',
        url: 'https://nadp.slh.wisc.edu/networks/national-trends-network/',
      },
      {
        title: 'NADP — precipitation-weighted concentration metadata',
        url: 'https://nadp.slh.wisc.edu/wp-content/uploads/2022/03/ntn-annual-Meta.pdf',
      },
      {
        title: '人教版必修第二册16—17页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '388',
  },
  {
    slug: 'chem-elimination-substitution',
    name: '取代、消去与证据',
    title: '产物出现之前，证据先要净化',
    question: '同一种卤代烃，条件怎样改变反应与检验？',
    description: '跟踪水相取样、净键变化与两套洗气装置，分清产物检验和杂质干扰。',
    color: '#c2d1b9',
    tag: '有机化学',
    related: ['chem-aromatic-comparison', 'chem-nmr-hydrogen', 'chem-phenol-properties'],
    sources: [
      {
        title: 'University of Calgary — Substitution and elimination competition',
        url: 'https://www.chem.ucalgary.ca/courses/353/Carey5th/useful/subelim.html',
      },
      {
        title: 'University of Calgary — Alkene formation by elimination',
        url: 'https://www.chem.ucalgary.ca/courses/350/Carey5th/Ch05/ch5-0.html',
      },
      {
        title: 'Royal Society of Chemistry — Dehydration of ethanol to ethene',
        url: 'https://edu.rsc.org/experiments/dehydration-of-ethanol-to-form-ethene/1718.article',
      },
    ],
    number: '387',
  },
  {
    slug: 'bio-embryo-engineering',
    name: '胚胎的形成、转移与分割',
    title: '一个胚胎怎样形成，又怎样移植和分割？',
    question: '一个胚胎怎样形成，又怎样移植和分割？',
    description: '从成熟与获能到子宫角移植，追踪同一胚胎和囊胚内细胞团，区分技术过程与发育结果。',
    color: '#d9c7b3',
    tag: '体外受精 · 胚胎移植 · 内细胞团',
    related: [
      'bio-animal-cell-engineering',
      'bio-plant-cell-engineering',
      'bio-endocrine-evidence',
      'bio-dna-engineering',
    ],
    sources: [
      {
        title: 'FAO — Training manual for embryo transfer in cattle: embryo transfer and synchrony',
        url: 'https://www.fao.org/4/t0117e/t0117e08.htm',
      },
      {
        title: 'FAO — Evaluation of bovine embryos',
        url: 'https://www.fao.org/4/t0117e/t0117e07.htm',
      },
      {
        title: 'Velásquez et al. — Splitting bovine blastocysts and resulting demi-embryos (2014)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25496989/',
      },
    ],
    number: '386',
  },
  {
    slug: 'chem-salt-purification',
    name: '粗盐提纯的离子去向',
    title: '怎样除掉杂质，又不留下新的杂质？',
    question: '怎样除掉杂质，又不留下新的杂质？',
    description: '追踪沉淀、过滤、加酸和蒸发中的物质去向，比较过量试剂与步骤顺序。',
    color: '#becab3',
    tag: '离子去向 · 化学提纯',
    related: ['chem-precipitation-paths', 'chem-anion-tests', 'chem-rainwater-ph'],
    sources: [
      {
        title: 'RSC — Dissolved solids in seawater',
        url: 'https://edu.rsc.org/experiments/what-are-the-dissolved-solids-in-seawater/1785.article',
      },
      {
        title: 'RSC — Removing hardness with sodium carbonate',
        url: 'https://edu.rsc.org/experiments/how-can-hardness-in-water-be-removed/1734.article',
      },
      {
        title: 'RSC — Properties of group 2 elements',
        url: 'https://edu.rsc.org/experiments/properties-of-group-2-elements/513.article',
      },
      {
        title: '人教版必修第二册实验活动4（29页）',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '385',
  },
  {
    slug: 'bio-animal-cell-engineering',
    name: '动物细胞的培养与工程',
    title: '培养、筛选和核移植，分别改变了什么？',
    question: '培养、筛选和核移植，分别改变了什么？',
    description: '追踪传代液量、杂交瘤两层筛选和核移植的细胞来源，区分生长、特异性与克隆证据。',
    color: '#d4bfd2',
    tag: '传代 · 杂交瘤 · 核移植',
    related: [
      'bio-plant-cell-engineering',
      'bio-immune-pathways',
      'bio-body-fluid-balance',
      'bio-embryo-engineering',
    ],
    sources: [
      {
        title: 'ATCC — Guide to subculturing cell line monolayers',
        url: 'https://www.atcc.org/resources/technical-documents/guide-to-subculturing-cell-line-monolayers',
      },
      {
        title:
          'Köhler and Milstein — Continuous cultures of fused cells secreting antibody of predefined specificity (1975)',
        url: 'https://www.nature.com/articles/256495a0',
      },
      {
        title:
          'Wilmut et al. — Viable offspring derived from fetal and adult mammalian cells (1997)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/9039911/',
      },
    ],
    number: '384',
  },
  {
    slug: 'chem-aromatic-comparison',
    name: '萃取还是反应',
    title: '颜色变浅，物质去了哪里？',
    question: '苯和甲苯的褪色现象，能说明同一件事吗？',
    description: '用分层、分配守恒与氧化对照，区分溴的萃取和侧链反应。',
    color: '#c5bf9b',
    tag: '有机化学',
    related: ['chem-wohler-isomers', 'chem-precipitation-paths', 'chem-elimination-substitution'],
    sources: [
      {
        title: 'Michigan State University — Aromaticity and characteristic reactivity',
        url: 'https://www2.chemistry.msu.edu/faculty/reusch/virttxtjml/react3.htm',
      },
      {
        title: 'OpenStax — Oxidation of aromatic side chains',
        url: 'https://openstax.org/books/organic-chemistry/pages/16-8-oxidation-of-aromatic-compounds',
      },
      {
        title: 'University of Calgary — Oxidation of alkylbenzenes',
        url: 'https://www.chem.ucalgary.ca/courses/351/Carey5th/Ch19/ch19-2-5.html',
      },
      {
        title: 'IUPAC Gold Book — Partition ratio',
        url: 'https://goldbook.iupac.org/terms/view/P04440',
      },
    ],
    number: '383',
  },
  {
    slug: 'chem-ammonium-cycle',
    name: '铵根检验与氨的收集',
    title: '怎样确认氨被释放并收集？',
    question: '怎样确认氨被释放并收集？',
    description: '从三种铵盐的湿润试纸证据，追踪氨的发生、排空气收集与吸收讨论。',
    color: '#bbc6a4',
    tag: '铵根 · 气体证据 · 排空气',
    related: ['chem-ammonia-fountain', 'chem-ammonium-smoke', 'chem-salt-purification'],
    sources: [
      {
        title: 'RSC — reactions of positive ions with sodium hydroxide',
        url: 'https://edu.rsc.org/resources/reactions-of-positive-ions-with-sodium-hydroxide/4018529.article',
      },
      {
        title: 'RSC — Ammonia fountain demonstration',
        url: 'https://edu.rsc.org/experiments/ammonia-fountain-demonstration/979.article',
      },
      {
        title: 'RSC — ammonia collection and limits of a mouth indicator test',
        url: 'https://edu.rsc.org/states-of-matter/demonstrate-changes-of-state-using-volume-differences/4017698.article',
      },
      {
        title: '人教版必修第二册14—15页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '382',
  },
  {
    slug: 'chem-nmr-hydrogen',
    name: '氢谱里的结构线索',
    title: '同样六个氢，为什么出现不同的谱？',
    question: '怎样用氢谱区分乙醇和二甲醚？',
    description: '追踪六个氢的环境、信号面积与分裂，理解OH交换的限定条件。',
    color: '#b9c5a8',
    tag: '有机化学',
    related: ['chem-wohler-isomers', 'chem-elemental-analysis', 'chem-aromatic-comparison'],
    sources: [
      {
        title: 'JEOL — Reading NMR chemical shift, integration and coupling',
        url: 'https://www.jeol.com/column/detail005.php',
      },
      {
        title: 'University of Wisconsin — Proton NMR lecture notes',
        url: 'https://www2.chem.wisc.edu/deptfiles/chem345-gellman/Sp13/LecNotes/sp14_345-1_gellman_01312014.pdf',
      },
      {
        title: 'University of California, Berkeley — Pulsed NMR and free-induction decay',
        url: 'https://experimentationlab.berkeley.edu/PulsedNMR',
      },
    ],
    number: '381',
  },
  {
    slug: 'chem-ammonium-smoke',
    name: '氨与氯化氢的白烟',
    title: '两种无色气体，为什么会冒出白烟？',
    question: '两种无色气体，为什么会冒出白烟？',
    description: '在玻璃棒之间追踪气体扩散、接触反应与固体微粒形成，分清烟和雾。',
    color: '#9dad9c',
    tag: '接触反应 · 固体微粒 · 白烟',
    related: ['chem-ammonia-fountain', 'chem-colloid-light', 'chem-ammonium-cycle'],
    sources: [
      {
        title: 'Thompson et al. — HCl/NH3 counterdiffusion, JCP 2019',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31005123/',
      },
      {
        title: 'UW–Madison — Ammonium Chloride Ring',
        url: 'https://demolab.chem.wisc.edu/physical-chemistry-demonstrations/kinetics-rate-of-diffusion-the-ammonium-chloride-ring-2/',
      },
      {
        title: '人教版必修第二册14页图5-12',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '380',
  },
  {
    slug: 'bio-plant-cell-engineering',
    name: '植物细胞的再生与融合',
    title: '一段组织怎样长成植株，两枚细胞怎样成为杂种？',
    question: '一段组织怎样长成植株，两枚细胞怎样成为杂种？',
    description: '追踪同一外植体的再生、原生质体膜与核的融合，以及激素比例和浓度的对照。',
    color: '#c5d1ad',
    tag: '外植体 · 原生质体 · 再分化',
    related: [
      'bio-plant-growth-regulators',
      'bio-microbial-culture',
      'bio-auxin-evidence',
      'bio-animal-cell-engineering',
    ],
    sources: [
      {
        title: 'Skoog and Miller — Chemical regulation of growth and organ formation (1957)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/13486467/',
      },
      {
        title: 'Pernisová et al. — Cytokinins modulate auxin-induced organogenesis (2009)',
        url: 'https://www.pnas.org/doi/10.1073/pnas.0811539106',
      },
      {
        title: 'Melchers, Sacristán and Holder — Potato–tomato somatic hybrids (1978)',
        url: 'https://link.springer.com/article/10.1007/BF02906548',
      },
    ],
    number: '379',
  },
  {
    slug: 'chem-elemental-analysis',
    name: '称出碳与氢',
    title: '产物的增重，怎样揭示有机物组成？',
    question: '为什么要先收集水，再收集二氧化碳？',
    description: '沿李比希元素分析的连续气路，分别捕获水和二氧化碳，再从称量推回元素比例。',
    color: '#bdc8a4',
    tag: '有机化学',
    related: ['chem-wohler-isomers', 'chem-ionic-conduction', 'chem-nmr-hydrogen'],
    sources: [
      {
        title: 'Science History Institute — Liebig’s kaliapparat',
        url: 'https://archives.sciencehistory.org/repositories/3/archival_objects/51152',
      },
      {
        title: 'OpenStax — Quantitative chemical analysis',
        url: 'https://openstax.org/books/chemistry/pages/4-5-quantitative-chemical-analysis',
      },
      {
        title: 'Yale University — Combustion analysis and historical development',
        url: 'https://oyc.yale.edu/chemistry/chem-125a/lecture-21',
      },
    ],
    number: '378',
  },
  {
    slug: 'chem-wohler-isomers',
    name: '组成相同，结构不同',
    title: '分子式相同，为什么会是不同物质？',
    question: '分子式能告诉我们怎样连接吗？',
    description: '从维勒制得尿素的证据，比较碳架、位置、官能团与顺反异构。',
    color: '#b8c1a1',
    tag: '有机化学',
    related: ['chem-molecular-shapes', 'bio-protein-machines', 'chem-elemental-analysis'],
    sources: [
      {
        title: 'ACS — Urea and Wöhler’s synthesis',
        url: 'https://www.acs.org/molecule-of-the-week/archive/u/urea.html',
      },
      {
        title: 'IUPAC — Stereochemical definitions and terminology',
        url: 'https://publications.iupac.org/pac/1976/pdf/4501x0011.pdf',
      },
      {
        title: 'Tsipis & Karipidis 2003 — Mechanism of the Wöhler synthesis',
        url: 'https://doi.org/10.1021/ja020656n',
      },
    ],
    number: '377',
  },
  {
    slug: 'chem-ammonia-fountain',
    name: '氨的喷泉',
    title: '水为什么会向上喷入烧瓶？',
    question: '水为什么会向上喷入烧瓶？',
    description: '把氨溶解、压强下降、连续进水和酚酞变色接成一条可追踪的过程。',
    color: '#b8c2a4',
    tag: '溶解 · 压差 · 水相碱性',
    related: ['chem-sulfur-dioxide', 'chem-nitrogen-oxides', 'chem-ammonium-smoke'],
    sources: [
      {
        title: 'Indiana University — The Ammonia Fountain',
        url: 'https://www.chem.indiana.edu/faculty-research/faculty-resources/chemistry-demos/demo/the-ammonia-fountain/',
      },
      {
        title: 'Purdue University — Ammonia Fountain',
        url: 'https://chemed.chem.purdue.edu/genchem/demosheets/17.2.html',
      },
      {
        title: '人教版必修第二册13—14页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '376',
  },
  {
    slug: 'bio-microbial-culture',
    name: '从分散菌体到培养证据',
    title: '一个菌落能告诉我们多少，又不能告诉我们什么？',
    question: '一个菌落能告诉我们多少，又不能告诉我们什么？',
    description: '跟随接种环、稀释液和微孔板，从纯培养走到选择计数与检测方法调查。',
    color: '#c4cbaa',
    tag: '划线 · CFU · 复筛',
    related: [
      'bio-fermentation-pathways',
      'bio-population-growth',
      'bio-soil-decomposition',
      'bio-plant-cell-engineering',
    ],
    sources: [
      {
        title: 'ASM — The Streak Plate Protocol',
        url: 'https://asm.org/protocols/the-streak-plate-protocol',
      },
      {
        title: 'ASM — Colony Morphology Protocol',
        url: 'https://asm.org/protocols/colony-morphology-protocol',
      },
      {
        title: 'FDA — BAM Chapter 3: Aerobic Plate Count',
        url: 'https://www.fda.gov/food/laboratory-methods-food/bam-chapter-3-aerobic-plate-count',
      },
      {
        title: 'CDC — Environmental sampling: air volume and settling',
        url: 'https://www.cdc.gov/infection-control/hcp/environmental-control/environmental-sampling.html',
      },
    ],
    number: '375',
  },
  {
    slug: 'bio-evolution-evidence',
    name: '进化证据与种群变化',
    title: '不同证据，怎样指向共同由来？',
    question: '不同证据，怎样指向共同由来？',
    description: '从化石与前肢连接，走到等位基因计数、克隆选择和生殖检验。',
    color: '#94a57b',
    tag: '生物学',
    related: ['bio-mutation-evidence', 'bio-linked-inheritance'],
    sources: [
      {
        title: 'Hu et al. (2009): Anchiornis feathered hind limbs',
        url: 'https://www.nature.com/articles/nature08322',
      },
      {
        title: 'Gillis et al. (2013): developmental homology of pharyngeal arches',
        url: 'https://www.nature.com/articles/ncomms2429',
      },
      {
        title: 'Graham and Smith (2013): pharyngeal apparatus development',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3564725/',
      },
      {
        title:
          'Cook et al. (2012), Selective bird predation on the peppered moth: the last experiment of Michael Majerus',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3391436/',
      },
      {
        title: 'Lederberg and Lederberg (1952): replica plating and indirect selection',
        url: 'https://journals.asm.org/doi/10.1128/jb.63.3.399-406.1952',
      },
      {
        title: 'UC Berkeley: mechanisms of speciation',
        url: 'https://ib.berkeley.edu/courses/bio1b/evolutionspring11/pdfs/MoritzNotes9.pdf',
      },
      {
        title:
          'Hu et al. (2009), A pre-Archaeopteryx troodontid theropod from China with long feathers on the metatarsus',
        url: 'https://www.ivpp.ac.cn/sourcedb/zw/rck/yjy/200908/P020140313545720736756.pdf',
      },
      {
        title:
          'Lederberg & Lederberg (1952), Replica plating and indirect selection of bacterial mutants',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC169282/',
      },
      {
        title:
          'Richardson et al. (1997), There is no highly conserved embryonic stage in the vertebrates',
        url: 'https://pubmed.ncbi.nlm.nih.gov/9278154/',
      },
    ],
    number: '374',
  },
  {
    slug: 'chem-nitrogen-oxides',
    name: '氮氧化物的颜色与去向',
    title: '气体变回无色，就已经消失了吗？',
    question: '气体变回无色，就已经消失了吗？',
    description: '用密闭注射器的物质守恒区分变色与吸收，再比较浓、稀硝酸与铜的主要气体产物。',
    color: '#aebf94',
    tag: 'NO与NO₂ · 氧气限制 · 产物鉴别',
    related: ['chem-sulfur-dioxide', 'chem-sulfur-transformations', 'chem-ammonia-fountain'],
    sources: [
      {
        title: 'University of Wisconsin — nitric acid acts on copper',
        url: 'https://www2.chem.wisc.edu/deptfiles/genchem/demonstrations/Gen_Chem_Pages/04chemrxnpage/nitric_acid_acts_on_copper.htm',
      },
      {
        title: 'Sytsma et al. — gas-phase analysis of copper/nitric acid, 2018',
        url: 'https://doi.org/10.1333/s00897182790a',
      },
      {
        title: '人教版必修第二册13、15页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '373',
  },
  {
    slug: 'bio-fermentation-pathways',
    name: '发酵的容器与条件',
    title: '同样是发酵，为什么有的隔绝空气，有的持续通气？',
    question: '同样是发酵，为什么有的隔绝空气，有的持续通气？',
    description: '从泡菜水封、亚硝酸盐取样到果酒果醋与工业罐，追踪气液路径和条件调控。',
    color: '#c8c7a4',
    tag: '水封 · 发酵 · 传质',
    related: [
      'bio-soil-decomposition',
      'bio-population-growth',
      'bio-conservation-evidence',
      'bio-microbial-culture',
    ],
    sources: [
      {
        title: 'NCHFP — Suitable containers, covers and weights',
        url: 'https://nchfp.uga.edu/how/ferment/general-information-on-fermenting/suitable-containers-covers-and-weights-for-fermenting-food/',
      },
      {
        title: 'UC Davis — Fermentation management practices',
        url: 'https://wine.ucdavis.edu/industry-info/enology/fermentation-management-guides/wine-fermentation/fermentation-management-practices',
      },
      {
        title: 'UC Davis Food Safety — Vinegar fermentation',
        url: 'https://ucfoodsafety.ucdavis.edu/sites/g/files/dgvnsk7366/files/inline-files/192137_0.pdf',
      },
      {
        title:
          'US EPA — Method 353.2 (aqueous nitrite calibration principles, not food preparation)',
        url: 'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P101D1VY.txt',
      },
    ],
    number: '372',
  },
  {
    slug: 'chem-sulfur-transformations',
    name: '不同价态硫的转化',
    title: '换个伙伴，硫的电子去了哪里？',
    question: '换个伙伴，硫的电子去了哪里？',
    description: '从实验现象追到同一批硫与电子，比较硫酸中的两条硫去向、有限氧化剂和铁硫热前沿。',
    color: '#b2bc92',
    tag: '氧化还原 · 连续证据 · 热传播',
    related: ['chem-sulfur-dioxide', 'chem-electron-transfer', 'chem-nitrogen-oxides'],
    sources: [
      {
        title: 'University of Wisconsin — Reaction of iron and sulfur',
        url: 'https://www2.chem.wisc.edu/deptfiles/genchem/demonstrations/Gen_Chem_Pages/02atomsmolpage/reaction_of_iron_and_sulfu.htm',
      },
      {
        title: 'OpenStax Chemistry 2e — 17.1 Redox chemistry',
        url: 'https://openstax.org/books/chemistry-2e/pages/17-1-review-of-redox-chemistry',
      },
      {
        title: '人教版必修第二册5、8、30页',
        url: 'https://jc.pep.com.cn/',
      },
      {
        title: 'IUPAC Gold Book — Oxidation state',
        url: 'https://goldbook.iupac.org/terms/view/O04365',
      },
      {
        title: 'A comparative study on sulfide removal by HClO and KMnO4 in drinking water',
        url: 'https://pubs.rsc.org/en/content/articlelanding/2020/ew/d0ew00629g',
      },
    ],
    number: '371',
  },
  {
    slug: 'bio-conservation-evidence',
    name: '环境调查与生态保护证据',
    title: '从一次观察，怎样走到保护方案？',
    question: '从一次观察，怎样走到保护方案？',
    description: '从水质与保护案例到庭院路径和碳样方，追踪调查证据、模型边界与区域汇总。',
    color: '#bfc9a7',
    tag: '野外记录 · 生态工程 · 碳调查',
    related: ['bio-community-survey', 'bio-ecosystem-stability', 'bio-ecosystem-energy'],
    sources: [
      {
        title: 'Ministry of Ecology and Environment — GB 3838-2002',
        url: 'https://www.mee.gov.cn/ywgz/fgbz/bz/bzwb/shjbh/shjzlbz/200206/t20020601_66497.shtml',
      },
      {
        title: 'Sawaya et al. — Genetic connectivity at Banff wildlife crossings',
        url: 'https://doi.org/10.1098/rspb.2013.1705',
      },
      {
        title: 'US EPA — Basic Information about Anaerobic Digestion',
        url: 'https://www.epa.gov/anaerobic-digestion/basic-information-about-anaerobic-digestion',
      },
      {
        title: 'Tang et al. — Carbon pools in China’s terrestrial ecosystems',
        url: 'https://doi.org/10.1073/pnas.1700291115',
      },
      {
        title: 'Fang et al. — Climate change, human impacts, and carbon sequestration in China',
        url: 'https://doi.org/10.1073/pnas.1700304115',
      },
    ],
    number: '370',
  },
  {
    slug: 'bio-mutation-evidence',
    name: '变异与实验判据',
    title: '变化发生在哪一层？',
    question: '突变、染色体变化与相关性证据，怎样分清？',
    description: '追踪后代检出、病例对照分母、低温根尖处理和具有身份的染色体片段。',
    color: '#a18ca7',
    tag: '生物学',
    related: ['bio-gene-expression', 'bio-meiosis', 'bio-evolution-evidence'],
    sources: [
      {
        title: 'Muller (1927), original Science paper record',
        url: 'https://pubmed.ncbi.nlm.nih.gov/17802387/',
      },
      {
        title: 'Muller: The Production of Mutations, Nobel lecture',
        url: 'https://www.nobelprize.org/prizes/medicine/1946/muller/lecture/',
      },
      {
        title: 'NCI: tobacco and cancer evidence',
        url: 'https://www.cancer.gov/about-cancer/causes-prevention/risk/tobacco',
      },
      {
        title: 'NHGRI: chromosome abnormalities',
        url: 'https://www.genome.gov/about-genomics/fact-sheets/Chromosome-Abnormalities-Fact-Sheet',
      },
      {
        title: 'NHGRI: structural variation',
        url: 'https://www.genome.gov/genetics-glossary/Structural-Variation',
      },
    ],
    number: '369',
  },
  {
    slug: 'bio-gene-expression',
    name: '基因表达与性状证据',
    title: '基因还在，表达改变了',
    question: 'DNA相同，为什么细胞与性状仍会不同？',
    description: '从鸡细胞检测表、柳穿鱼和小鼠的表观遗传，到残翅果蝇的发育温度对照。',
    color: '#a8b494',
    tag: '生物学',
    related: ['bio-genetic-code', 'bio-cell-fates', 'bio-mutation-evidence'],
    sources: [
      {
        title: 'Cubas, Vincent and Coen (1999): natural epigenetic floral variation',
        url: 'https://pubmed.ncbi.nlm.nih.gov/10490023/',
      },
      {
        title: 'Waterland and Jirtle (2003): epigenetic regulation at the Avy locus',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/165709/',
      },
      {
        title: 'Harnly (1936): temperature-effective periods of vestigial wings',
        url: 'https://pubmed.ncbi.nlm.nih.gov/17246789/',
      },
      {
        title: 'FlyBase: Harnly original vestigial-wing temperature research',
        url: 'https://flybase.org/reports/FBrf0002002',
      },
    ],
    number: '368',
  },
  {
    slug: 'chem-sugar-carbonization',
    name: '蔗糖的脱水与膨胀',
    title: '黑色柱体变大，是碳变多了吗？',
    question: '黑色柱体变大，是碳变多了吗？',
    description: '区分浓硫酸的脱水与氧化作用，再用元素守恒和孔隙体积解释变黑、产气与膨胀。',
    color: '#b1b797',
    tag: '脱水 · 元素守恒 · 多孔结构',
    related: ['chem-sulfur-dioxide', 'chem-electron-transfer', 'chem-sulfur-transformations'],
    sources: [
      {
        title: 'University of Wisconsin — dehydration of sugar by sulfuric acid',
        url: 'https://www2.chem.wisc.edu/deptfiles/genchem/demonstrations/Gen_Chem_Pages/22organicpage/dehydration_of_sugar_by_su.htm',
      },
      {
        title: 'RSC — the dehydration of sucrose',
        url: 'https://edu.rsc.org/exhibition-chemistry/the-dehydration-of-sucrose/2020073.article',
      },
      {
        title: '人教版必修第二册5页正文及10页练习4',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '367',
  },
  {
    slug: 'bio-ecosystem-stability',
    name: '信息传递与生态系统稳定性',
    title: '一个生态系统怎样回应变化？',
    question: '一个生态系统怎样回应变化？',
    description: '隔离昆虫信息线索，区分抵抗与恢复，并在有昼夜收支的生态缸中持续观察。',
    color: '#bcc8a7',
    tag: '信息对照 · 反馈限制 · 生态缸',
    related: [
      'bio-community-interactions',
      'bio-ecosystem-energy',
      'bio-soil-decomposition',
      'bio-conservation-evidence',
    ],
    sources: [
      {
        title: 'Sakurai et al. — Sex pheromone receptor and silkmoth behavior',
        url: 'https://doi.org/10.1371/journal.pgen.1002115',
      },
      {
        title: 'USGS — Daily variation in dissolved oxygen and carbon dioxide',
        url: 'https://pubs.usgs.gov/fs/FS-060-99/',
      },
      {
        title: 'National Park Service — Aquatic Ecology Teacher Guide',
        url: 'https://www.nps.gov/romo/learn/education/upload/Aquatic-Ecology-Teacher-Guide-Final.pdf',
      },
    ],
    number: '366',
  },
  {
    slug: 'bio-genetic-code',
    name: '遗传密码与蛋白质合成',
    title: '从三个字母，到一条肽链',
    question: '一个碱基的位置，怎样改变后面的信息？',
    description: '把阅读框实验、合成RNA证据与连续转录翻译联系起来，追踪同一段信息的去向。',
    color: '#b4876e',
    tag: '生物学',
    related: ['bio-dna-replication', 'bio-protein-machines', 'bio-gene-expression'],
    sources: [
      {
        title: 'Crick et al. (1961), original Nature paper, NLM archive',
        url: 'https://digirepo.nlm.nih.gov/ext/document/101584582X412/PDF/101584582X412.pdf',
      },
      {
        title: 'Nirenberg and Matthaei (1961), original PNAS paper',
        url: 'https://njc.rockefeller.edu/pdf3/NirenbergMatthaeiPNAS1961.pdf',
      },
      {
        title: 'NHGRI: genetic code deciphering',
        url: 'https://www.genome.gov/25520300/online-education-kit-1966-genetic-code-cracked',
      },
      {
        title: 'NCBI Bookshelf: from RNA to protein',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK26829/',
      },
      {
        title: 'NCBI Bookshelf: translation phases in eukaryotes',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK586875/',
      },
    ],
    number: '365',
  },
  {
    slug: 'chem-sulfur-dioxide',
    name: '二氧化硫的连续观察',
    title: '颜色消失了，还能回来吗？',
    question: '颜色消失了，还能回来吗？',
    description: '沿同一份溶液观察气体溶解、酸性、品红褪色与加热复色，分清现象和结论。',
    color: '#a8bb9a',
    tag: '溶解 · 酸性 · 可逆褪色',
    related: ['chem-chlorine-bleaching', 'chem-ionic-conduction', 'chem-sugar-carbonization'],
    sources: [
      {
        title: 'University of Wisconsin — preparation and properties of sulfur dioxide',
        url: 'https://www2.chem.wisc.edu/deptfiles/genchem/demonstrations/Gen_Chem_Pages/1819group1-8page/preparation_sulfurdioxide.htm',
      },
      {
        title: '人教版必修第二册3–4页：实验5-1、5-2',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '364',
  },
  {
    slug: 'bio-soil-decomposition',
    name: '土壤微生物的分解作用',
    title: '落叶与淀粉的变化，怎样成为证据？',
    question: '落叶与淀粉的变化，怎样成为证据？',
    description: '比较处理土与自然土，追踪淀粉培养液的分样和显色，并检验产物继续被消耗的反例。',
    color: '#c9c6a7',
    tag: '土壤对照 · 独立分样 · 检测边界',
    related: [
      'bio-community-survey',
      'bio-ecosystem-energy',
      'bio-enzyme-investigations',
      'bio-fermentation-pathways',
    ],
    sources: [
      {
        title: 'USDA NRCS — Soil Respiration',
        url: 'https://www.nrcs.usda.gov/state-offices/illinois/soil-tech-note-17a-soil-respiration',
      },
      {
        title: 'University of Maryland — Starch Hydrolysis by Amylase',
        url: 'https://user.eng.umd.edu/~nsw/ench485/lab5.htm',
      },
      {
        title: 'Austin Community College — Starch Hydrolysis',
        url: 'https://sites.google.com/austincc.edu/microbugz/lab-exercises/differential-tests/starch-hydrolysis',
      },
    ],
    number: '363',
  },
  {
    slug: 'chem-molecular-shapes',
    name: '分子的空间形状',
    title: '有极性键，分子就一定有极性吗？',
    question: '有极性键，分子就一定有极性吗？',
    description: '从六种教材模型与四气球类比走向电子对几何，再用三维向量检验分子极性。',
    color: '#a6bcb5',
    tag: '空间模型 · VSEPR · 分子极性',
    related: ['chem-carbon-frameworks', 'chem-bond-overlap', 'chem-hydrogen-bond-network'],
    sources: [
      {
        title: 'OpenStax — molecular structure and polarity',
        url: 'https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity',
      },
      {
        title: 'IUPAC Gold Book — electric dipole moment',
        url: 'https://goldbook.iupac.org/terms/view/E01929',
      },
      {
        title: '人教版选择性必修2 43–53页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '362',
  },
  {
    slug: 'bio-dna-replication',
    name: 'DNA复制的证据与过程',
    title: '一条旧链，配一条新链',
    question: '一道中间条带，为什么还要再等一代？',
    description: '从稳定同位素与密度梯度预测，走到可追踪母链、引物和5′到3′延伸的机制。',
    color: '#99a58c',
    tag: '生物学',
    related: ['bio-dna-structure', 'bio-cell-division', 'bio-genetic-code'],
    sources: [
      {
        title: 'Meselson and Stahl (1958), Caltech original-paper record',
        url: 'https://authors.library.caltech.edu/records/pggy5-n0t48',
      },
      {
        title: 'Meselson and Stahl (1958), PNAS/PMC',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC528642/',
      },
      {
        title: 'Nagoya University: Okazaki fragments and original research',
        url: 'https://www.itbm.nagoya-u.ac.jp/okazaki_award/okazaki_fragment.html',
      },
      {
        title: 'Nobel Prize: primer dependence and the end-replication problem',
        url: 'https://www.nobelprize.org/prizes/medicine/2009/advanced-information/',
      },
    ],
    number: '361',
  },
  {
    slug: 'bio-ecosystem-energy',
    name: '生态系统的能量与物质',
    title: '能量流过以后，物质去了哪里？',
    question: '能量流过以后，物质去了哪里？',
    description: '核对湖泊年能量收支，建立有证据的调查图，追踪碳循环与污染物积累。',
    color: '#bdc9a8',
    tag: '能量账本 · 碳标记 · 浓度变化',
    related: [
      'bio-community-interactions',
      'bio-community-survey',
      'bio-population-growth',
      'bio-ecosystem-stability',
    ],
    sources: [
      {
        title: 'Lindeman — The Trophic-Dynamic Aspect of Ecology (1942)',
        url: 'https://doi.org/10.2307/1930126',
      },
      {
        title: 'NOAA — Carbon cycle basics',
        url: 'https://gml.noaa.gov/outreach/carbon_toolkit/basics.html',
      },
      {
        title: 'US EPA — Toxics in the Food Web',
        url: 'https://www.epa.gov/salish-sea/toxics-food-web',
      },
    ],
    number: '360',
  },
  {
    slug: 'chem-carbon-frameworks',
    name: '碳骨架与空间结构',
    title: '同样是碳成键，怎样搭出不同分子？',
    question: '同样是碳成键，怎样搭出不同分子？',
    description: '通过真实三维球棍坐标比较四面体、平面与直线；用旋转重合和价数守恒区分摆法与结构。',
    color: '#a9b997',
    tag: '球棍模型 · σ与π · 同分异构',
    related: [
      'chem-bond-overlap',
      'chem-atomic-models',
      'chem-molecular-shapes',
      'chem-wohler-isomers',
    ],
    sources: [
      {
        title: 'OpenStax — hybrid orbitals and molecular geometry',
        url: 'https://openstax.org/books/chemistry-2e/pages/8-2-hybrid-atomic-orbitals',
      },
      {
        title: 'OpenStax — ethane bonding and near-tetrahedral angles',
        url: 'https://openstax.org/books/organic-chemistry/pages/1-7-sp3-hybrid-orbitals-and-the-structure-of-ethane',
      },
      {
        title: '人教版必修第二册70、95页、选择性必修2 36页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '359',
  },
  {
    slug: 'bio-dna-structure',
    name: 'DNA结构的约束与模型',
    title: 'DNA的搭档为什么不能随便换？',
    question: 'DNA的搭档为什么不能随便换？',
    description: '跟住同一批碱基，比较计数、氢键接触与完整双螺旋，再从保留的一条链预测另一条。',
    color: '#b3a27f',
    tag: '生物学',
    related: ['bio-genetic-material', 'bio-protein-machines', 'bio-dna-replication'],
    sources: [
      {
        title: 'Watson and Crick, Nature (1953)',
        url: 'https://www.nature.com/articles/171737a0',
      },
      {
        title: 'Franklin and Gosling, Nature (1953)',
        url: 'https://www.nature.com/articles/171740a0',
      },
      {
        title: 'Cochran, Crick and Vand: transform of atoms on a helix (1952)',
        url: 'https://doi.org/10.1107/S0365110X52001635',
      },
      {
        title: 'RCSB PDB 1BNA: measured B-DNA dodecamer',
        url: 'https://www.rcsb.org/structure/1BNA',
      },
      {
        title: 'NHGRI: DNA fact sheet',
        url: 'https://www.genome.gov/about-genomics/fact-sheets/Deoxyribonucleic-Acid-Fact-Sheet',
      },
    ],
    number: '358',
  },
  {
    slug: 'bio-community-survey',
    name: '群落调查与演替',
    title: '先看见什么，才能解释一个群落？',
    description: '从湿地水鸟观察和土壤小动物采集，到不同起点与环境条件下的群落演替。',
    color: '#bbcaab',
    tag: '野外记录 · 采集通路 · 环境改变',
    related: [
      'bio-population-sampling',
      'bio-community-interactions',
      'bio-plant-environment',
      'bio-soil-decomposition',
    ],
    sources: [
      {
        title: 'Harvard Arnold Arboretum — Fieldwork Techniques',
        url: 'https://arboretum.harvard.edu/wp-content/uploads/2020/07/Fieldwork-Techniques.pdf',
      },
      {
        title: 'Jing et al. — Foraging strategies and shorebird habitat use at Chongming Dongtan',
        url: 'https://doi.org/10.1007/s11284-006-0302-7',
      },
      {
        title: 'National Park Service — Plant Succession, Kenai Fjords',
        url: 'https://www.nps.gov/kefj/learn/nature/plant-succession.htm',
      },
      {
        title: 'National Park Service — Plant Succession, Glacier Bay',
        url: 'https://home.nps.gov/glba/learn/nature/succession.htm',
      },
    ],
    question: '先看见什么，才能解释一个群落？',
    number: '357',
  },
  {
    slug: 'chem-bond-overlap',
    name: '电子式与轨道重叠',
    title: '怎样区分电子转移、共用与轨道重叠？',
    question: '怎样区分电子转移、共用与轨道重叠？',
    description: '从NaCl的电子记账与六配位局部，转向Cl₂、HCl共用电子，再用计算剖面比较σ与π。',
    color: '#a6ba8f',
    tag: '化学键 · 电子式 · 轨道对称性',
    related: ['chem-atomic-models', 'chem-electron-transfer', 'chem-carbon-frameworks'],
    sources: [
      {
        title: 'IUPAC physical-organic glossary — sigma and pi symmetry',
        url: 'https://iupac.qmul.ac.uk/gtpoc/SaSp.html',
      },
      {
        title: 'OpenStax — valence bond theory',
        url: 'https://openstax.org/books/chemistry-2e/pages/8-1-valence-bond-theory',
      },
      {
        title: 'OpenStax — ionic crystal neighborhoods',
        url: 'https://openstax.org/books/chemistry-2e/pages/10-6-lattice-structures-in-crystalline-solids',
      },
      {
        title: '人教版必修第一册113—115页、选择性必修2 34—35页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '356',
  },
  {
    slug: 'bio-genetic-material',
    name: '遗传物质的三条证据',
    title: '把转化因子追踪到DNA',
    question: '是改变了性状，还是找到了传递性状的物质？',
    description: '从四组肺炎链球菌对照、选择性去除，到噬菌体同位素的进入、分离与子代检测。',
    color: '#b49c7c',
    tag: '生物学',
    related: ['bio-linked-inheritance', 'bio-membrane-evidence', 'bio-dna-structure'],
    sources: [
      {
        title: 'Griffith (1928), original paper record',
        url: 'https://pubmed.ncbi.nlm.nih.gov/20474956/',
      },
      {
        title: 'Avery, MacLeod and McCarty (1944)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/19871359/',
      },
      {
        title: 'McCarty and Avery (1946), DNase treatment',
        url: 'https://pubmed.ncbi.nlm.nih.gov/19871520/',
      },
      {
        title: 'Hershey and Chase (1952), original abstract and paper',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2147348/',
      },
    ],
    number: '355',
  },
  {
    slug: 'bio-community-interactions',
    name: '竞争、捕食与群落',
    title: '少一个捕食者，为什么不只是多一些猎物？',
    description: '比较草履虫培养、雪兔猞猁长期证据与海星移除，追踪竞争和捕食的间接效应。',
    color: '#aebea5',
    tag: '历史实验 · 循环因果 · 岩面占位',
    related: [
      'bio-population-sampling',
      'bio-population-growth',
      'bio-community-survey',
      'bio-ecosystem-energy',
    ],
    sources: [
      {
        title: 'Mühlbauer et al. — gauseR digitized Gause experiments',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7713957/',
      },
      {
        title: 'gauseR author data repository',
        url: 'https://github.com/adamtclark/gauseR',
      },
      {
        title: 'ecostudy — lynxhare supplementary historical compilation',
        url: 'https://github.com/jarioksa/ecostudy/blob/master/man/lynxhare.Rd',
      },
      {
        title: 'Stenseth et al. — Population regulation in snowshoe hare and Canadian lynx',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC24646/',
      },
      {
        title: 'Krebs et al. — Impact of Food and Predation on the Snowshoe Hare Cycle',
        url: 'https://www.zoology.ubc.ca/~krebs/papers/122.pdf',
      },
      {
        title: 'Paine — Food Web Complexity and Species Diversity',
        url: 'https://www.journals.uchicago.edu/doi/abs/10.1086/282400',
      },
    ],
    question: '少一个捕食者，为什么不只是多一些猎物？',
    number: '354',
  },
  {
    slug: 'chem-periodic-patterns',
    name: '周期表与性质趋势',
    title: '周期规律为什么会转弯？',
    question: '周期规律为什么会转弯？',
    description: '从固定元素数据到轨道占据，追踪周期规律中的相等、缺失与下降。',
    color: '#a5b68e',
    tag: '周期表 · 电子排布 · 数据',
    related: ['chem-atomic-models', 'chem-periodic-practical'],
    sources: [
      {
        title: 'IUPAC periodic table guidance',
        url: 'https://iupac.org/what-we-do/periodic-table-of-elements/',
      },
      {
        title: 'NIST ASD: neutral ground configurations and first ionization energies',
        url: 'https://physics.nist.gov/cgi-bin/ASD/ie.pl?at_num_out=on&biblio=on&e_out=0&el_name_out=on&level_out=on&shells_out=on&spectra=H-DS+i&unc_out=on&units=1',
      },
      {
        title: '人教版必修第一册105页、选择性必修2 20—26页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '353',
  },
  {
    slug: 'bio-linked-inheritance',
    name: '性连锁、系谱与人群调查',
    title: '同一个比例，可能隐藏什么',
    question: '把性别、家系和抽样分母放回遗传证据里。',
    description: '重建果蝇白眼杂交，推断教材家系中的可能基因型，并比较家系证据与合成人群调查。',
    color: '#b29cab',
    tag: '生物学',
    related: ['bio-mendel-crosses', 'bio-meiosis', 'bio-genetic-material'],
    sources: [
      {
        title: 'Morgan 1910, Sex limited inheritance in Drosophila: original publication record',
        url: 'https://pubmed.ncbi.nlm.nih.gov/17759620/',
      },
      {
        title: 'Dalton’s original color observations, Science History Institute',
        url: 'https://digital.sciencehistory.org/works/fb4949523',
      },
      {
        title: 'NHGRI: pedigree',
        url: 'https://www.genome.gov/genetics-glossary/Pedigree',
      },
      {
        title: 'MedlinePlus Genetics: color vision deficiency',
        url: 'https://medlineplus.gov/genetics/condition/color-vision-deficiency/',
      },
    ],
    number: '352',
  },
  {
    slug: 'chem-atomic-models',
    name: '原子模型与证据',
    title: '看不见原子，凭什么改变原子模型？',
    question: '看不见原子，凭什么改变原子模型？',
    description: '从偏转光点、折返粒子和固定谱线，走到一个电子的概率分布。',
    color: '#aabd91',
    tag: '历史模型 · 概率 · 原子轨道',
    related: [
      'chem-flame-spectra',
      'chem-electron-transfer',
      'chem-bond-overlap',
      'chem-periodic-patterns',
      'chem-noble-gas-evidence',
    ],
    sources: [
      {
        title: 'MIT OpenCourseWare — hydrogen-atom wavefunctions and radial distributions',
        url: 'https://www.ocw.mit.edu/courses/5-61-physical-chemistry-fall-2007/c2078ff25c61c136e67ceb6fd8eb9b34_lecture21to22.pdf',
      },
      {
        title: 'Niels Bohr Institute — historical atomic model',
        url: 'https://nbi.ku.dk/english/www/niels/bohr/bohratomet/',
      },
      {
        title: 'Nobel Foundation — Thomson and electrons',
        url: 'https://www.nobelprize.org/prizes/physics/1906/thomson/facts/',
      },
      {
        title: '人教版高中化学必修第一册94页、选择性必修2 12—13页',
        url: 'https://jc.pep.com.cn/',
      },
      {
        title: 'J. J. Thomson, Cathode Rays (1897)',
        url: 'https://en.wikisource.org/wiki/Cathode_Rays',
      },
      {
        title:
          'E. Rutherford, The Scattering of α and β Particles by Matter and the Structure of the Atom (1911)',
        url: 'https://personal.math.ubc.ca/~cass/rutherford/r.pdf',
      },
      {
        title: 'N. Bohr, On the Constitution of Atoms and Molecules, Part I (1913)',
        url: 'https://www.gutenberg.org/cache/epub/72787/pg72787-images.html',
      },
      {
        title: 'NIST strong hydrogen lines',
        url: 'https://physics.nist.gov/PhysRefData/Handbook/Tables/hydrogentable2.htm',
      },
      {
        title: 'NIST CODATA recommended constants',
        url: 'https://physics.nist.gov/cuu/Constants/Table/allascii.txt',
      },
      {
        title: 'NIST ASD wavelength and refractive-index help',
        url: 'https://physics.nist.gov/PhysRefData/ASD/Html/lineshelp.html',
      },
      {
        title: 'MIT 5.61 hydrogen atom lecture',
        url: 'https://ocw.mit.edu/courses/5-61-physical-chemistry-fall-2007/c2078ff25c61c136e67ceb6fd8eb9b34_lecture21to22.pdf',
      },
    ],
    number: '351',
  },
  {
    slug: 'bio-population-growth',
    name: '种群增长与培养计数',
    title: '增长曲线的每一个点从哪里来？',
    description: '从细菌分裂规则、高斯培养证据到酵母计数室与真实记录，区分模型预测和观察。',
    color: '#c1ccaa',
    tag: '数学模型 · 显微计数 · 调查证据',
    related: ['bio-population-sampling', 'bio-plant-environment', 'bio-community-interactions'],
    sources: [
      {
        title: 'OpenStax — Population Growth and Regulation',
        url: 'https://openstax.org/books/concepts-biology/pages/19-2-population-growth-and-regulation',
      },
      {
        title: 'Thermo Fisher — Counting Cells in a Hemocytometer',
        url: 'https://www.thermofisher.com/be/en/home/references/gibco-cell-culture-basics/cell-culture-protocols/counting-cells-in-a-hemacytometer.html',
      },
      {
        title: 'Bio-Rad — Cell Counting with a Hemocytometer',
        url: 'https://www.bio-rad.com/webroot/web/pdf/lsr/literature/Bulletin_6235.pdf',
      },
    ],
    question: '增长曲线的每一个点从哪里来？',
    number: '350',
  },
  {
    slug: 'chem-periodic-practical',
    name: '元素性质与证据',
    title: '从变色到周期性：怎样让比较成为证据？',
    question: '怎样从反应现象推出元素的性质？',
    description: '跟住电子、氧和氢，从卤素置换和氢氧化物比较建立可检验的元素性质规律。',
    color: '#b9bd92',
    tag: '卤素 · 镁与水 · 两性氢氧化物',
    related: ['chem-sodium-reactions', 'chem-aluminium-film', 'chem-anion-tests'],
    sources: [
      {
        title: 'RSC: Halogen displacement',
        url: 'https://edu.rsc.org/experiments/halogens-in-aqueous-solution-and-their-displacement-reactions/733.article',
      },
      {
        title: 'RSC Education — magnesium and water comparison context',
        url: 'https://edu.rsc.org/exhibition-chemistry/the-reaction-of-magnesium-with-steam/4012602.article',
      },
      {
        title: 'OpenStax — precipitation, solubility and multiple equilibria',
        url: 'https://openstax.org/books/chemistry/pages/15-3-multiple-equilibria',
      },
      {
        title: '人教版高中化学必修第一册104、109、122页',
        url: 'https://jc.pep.com.cn/',
      },
      {
        title: 'University of Washington: Amphoteric Nature of Aluminum Hydroxide',
        url: 'https://chem.washington.edu/lecture-demos/amphoteric-nature-aluminum-hydroxide',
      },
      {
        title: 'OpenStax Chemistry 2e §15.3 Coupled equilibria',
        url: 'https://openstax.org/books/chemistry-2e/pages/15-3-coupled-equilibria',
      },
      {
        title: 'OpenStax: Equilibrium calculations, I2/I−/I3− example',
        url: 'https://openstax.org/books/chemistry-atoms-first-2e/pages/13-4-equilibrium-calculations',
      },
      {
        title:
          'Taub et al. (2002), Mechanism of Dihydrogen Formation in the Magnesium–Water Reaction',
        url: 'https://scholarworks.brandeis.edu/esploro/outputs/journalArticle/Mechanism-of-Dihydrogen-Formation-in-the/9923989475601921',
      },
    ],
    number: '349',
  },
  {
    slug: 'bio-meiosis',
    name: '减数分裂与染色体传递',
    title: '先分同源，再分姐妹',
    question: '一次复制、两次分裂，怎样留下各不相同的一套？',
    description: '追踪同源染色体、非姐妹互换和独立分配，再区分固定装片观察与染色体遗传假说。',
    color: '#ad9aaf',
    tag: '生物学',
    related: ['bio-cell-division', 'bio-mendel-crosses'],
    sources: [
      {
        title: 'NHGRI: meiosis',
        url: 'https://www.genome.gov/genetics-glossary/Meiosis',
      },
      {
        title: 'NHGRI: crossing over',
        url: 'https://www.genome.gov/genetics-glossary/Crossing-Over',
      },
      {
        title: 'NHGRI: chromosome theory of heredity',
        url: 'https://www.genome.gov/25520242/online-education-kit-1902-chromosome-theory-of-heredity',
      },
    ],
    number: '348',
  },
  {
    slug: 'bio-population-sampling',
    name: '种群调查与取样',
    title: '只看见一部分，怎样估计整个种群？',
    description: '让灯诱捕、标记重捕、样方计数和非损伤记录真正发生在固定个体与空间中。',
    color: '#b1c49b',
    tag: '真实取样过程 · 个体身份 · 检测偏差',
    related: ['bio-plant-environment', 'bio-auxin-evidence'],
    sources: [
      {
        title: 'Surveying Moths Using Light Traps: Effects of Weather and Time of Year',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3956935/',
      },
      {
        title: 'USGS — Capture-recapture and removal methods for sampling closed populations',
        url: 'https://www.usgs.gov/publications/capture-recapture-and-removal-methods-sampling-closed-populations',
      },
      {
        title: 'British Ecological Society — Maths in Ecology',
        url: 'https://www.britishecologicalsociety.org/learning-and-resources/learning-resources/mathsinecology/',
      },
      {
        title: 'National Park Service — Evolving Research Technologies',
        url: 'https://home.nps.gov/subjects/bears/evolvingtechnologies.htm',
      },
      {
        title: 'Individuality and Stability in Male Songs of Cao Vit Gibbons',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4008529/',
      },
    ],
    question: '只看见一部分，怎样估计整个种群？',
    number: '347',
  },
  {
    slug: 'chem-iron-practical',
    name: '铁的电子去向',
    title: '二价铁为什么既能得电子，也能失电子？',
    question: '二价铁为什么既能得电子，也能失电子？',
    description:
      '让七个实验成为一张价态转化图：跟住同一个铁、电子和显色对象，再预测铁粉不足时会剩下什么。',
    color: '#aeb99b',
    tag: '章末活动 · 铁价态 · 证据链',
    related: ['chem-iron-cycle', 'chem-copper-etching', 'chem-iron-hydroxides'],
    sources: [
      {
        title: 'RSC Education — oxidation states of iron',
        url: 'https://edu.rsc.org/experiments/oxidation-states-of-iron/517.article',
      },
      {
        title: 'University of Delaware — copper etching with ferric ions',
        url: 'https://research.me.udel.edu/~prasad/papers/2006_JMM_Zhang.pdf',
      },
      {
        title: 'Fe(III)–thiocyanate coordination study',
        url: 'https://doi.org/10.1016/j.ica.2017.06.017',
      },
      {
        title: '人教版高中化学必修第一册90页实验活动2',
        url: 'https://jc.pep.com.cn/',
      },
      {
        title: 'Iron(III) chloride etching of copper (2006)',
        url: 'https://doi.org/10.1088/0960-1317/16/11/N02',
      },
      {
        title: 'SUNY Buffalo State — iron(II) and permanganate titration',
        url: 'https://staff.buffalostate.edu/nazareay/che112/manganate.htm',
      },
      {
        title: 'Iodine–iodide–amylose complexes (2022)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/36558106/',
      },
    ],
    number: '346',
  },
  {
    slug: 'chem-food-iron',
    name: '食品中铁元素的检验',
    title: '滤液变红之前，每一步做了什么？',
    question: '滤液变红之前，每一步做了什么？',
    description: '沿研磨、过滤、氧化和显色追踪可检出的铁，区分样品处理与结论边界。',
    color: '#a9b88a',
    tag: '样品处理 · 铁检验 · 证据',
    related: ['chem-iron-cycle', 'chem-solution-preparation'],
    sources: [
      {
        title: 'NJIT teaching laboratory — extraction and analysis of iron in food',
        url: 'https://web.njit.edu/~mitra/green_chemistry/EXP_6.htm',
      },
      {
        title: 'RSC Education — oxidation states and thiocyanate test',
        url: 'https://edu.rsc.org/experiments/oxidation-states-of-iron/517.article',
      },
      {
        title: '人教版高中化学必修第一册76页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '345',
  },
  {
    slug: 'chem-aluminium-film',
    name: '铝表面的氧化膜与酸碱反应',
    title: '同样的铝，为什么有时要等一会儿才冒泡？',
    question: '同样的铝，为什么有时要等一会儿才冒泡？',
    description: '从表面氧化膜的放大剖面，区分膜的溶解、金属产氢和酸碱中的铝物种。',
    color: '#bac5b6',
    tag: '氧化膜 · 铝 · 两性氧化物',
    related: ['chem-iron-steam', 'chem-electron-transfer'],
    sources: [
      {
        title: 'Original study — dissolution and barrier properties of alumina films',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7801786/',
      },
      {
        title: 'RSC Education — reacting aluminium foil with acid',
        url: 'https://edu.rsc.org/resources/reacting-aluminium-foil-with-acid/652.article',
      },
      {
        title: '人教版高中化学必修第一册82页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '344',
  },
  {
    slug: 'chem-copper-etching',
    name: '覆铜板蚀刻与图案保留',
    title: '覆铜板上的图案为什么能留下来？',
    question: '覆铜板上的图案为什么能留下来？',
    description: '从保护层和铜箔剖面追踪腐蚀边界，再用铁、铜的物料守恒解释图案形成。',
    color: '#bfa27d',
    tag: '铜箔 · 氧化还原 · 选择性去除',
    related: ['chem-iron-cycle', 'chem-electron-transfer'],
    sources: [
      {
        title: 'University of Delaware original study — wet etching of copper foil',
        url: 'https://research.me.udel.edu/~prasad/papers/2006_JMM_Zhang.pdf',
      },
      {
        title: 'Georgia Tech — ferric chloride etching research',
        url: 'https://hdl.handle.net/1853/43026',
      },
      {
        title: '人教版高中化学必修第一册74—75页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '343',
  },
  {
    slug: 'bio-plant-environment',
    name: '植物的环境感知',
    title: '植物怎样把光、温度和重力变成生长信号？',
    description: '从细胞内光受体、低温经历和年轮，到淀粉体沉降、根茎弯曲及根冠对照实验。',
    color: '#b7c89d',
    tag: '光信号 · 春化 · 根冠感知',
    related: ['bio-auxin-evidence', 'bio-plant-growth-regulators'],
    sources: [
      {
        title: 'Phytochrome- and Gibberellin-Mediated Regulation during Lettuce Germination',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2259076/',
      },
      {
        title: 'VERNALIZATION1 controls developmental responses of winter wheat',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6382010/',
      },
      {
        title: 'Laser ablation of root cap cells: implications for models of graviperception',
        url: 'https://pubmed.ncbi.nlm.nih.gov/11542616/',
      },
      {
        title: 'Arabidopsis: a model for root and shoot gravitropism',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3243349/',
      },
    ],
    question: '植物怎样把光、温度和重力变成生长信号？',
    number: '342',
  },
  {
    slug: 'bio-mendel-crosses',
    name: '孟德尔的豌豆杂交',
    title: '消失的矮茎，为什么又回来了？',
    question: '子一代都是高茎，矮茎的遗传因子去了哪里？',
    description: '固定教材记录、遗传因子身份与独立概率计算，区分解释已有结果和预测新组合。',
    color: '#a8b68b',
    tag: '生物学',
    related: ['bio-cell-division', 'bio-engineered-genomes'],
    sources: [
      {
        title:
          'Mendel (1866), Experiments in Plant Hybridization — original text in English translation',
        url: 'https://cs.brown.edu/people/rblumber/MendelWeb/Mendel.html',
      },
      {
        title: 'Mendel 1866: original publication digitized by the Smithsonian Libraries',
        url: 'https://library.si.edu/digital-library/book/versucheberpflan00mend',
      },
    ],
    number: '341',
  },
  {
    slug: 'chem-iron-hydroxides',
    name: '铁的氢氧化物与空气氧化',
    title: '浅色沉淀为什么会变成红褐色？',
    question: '浅色沉淀为什么会变成红褐色？',
    description: '对照两种铁盐与碱的反应，再追踪氧气参与时同一批铁的价态和沉淀变化。',
    color: '#a8b69a',
    tag: '沉淀 · 空气氧化 · 对照',
    related: ['chem-iron-cycle', 'chem-precipitation-paths'],
    sources: [
      {
        title: 'RSC Education — Oxidation states of iron',
        url: 'https://edu.rsc.org/experiments/oxidation-states-of-iron/517.article',
      },
      {
        title: 'Original study — aerial oxidation products depend on conditions',
        url: 'https://doi.org/10.1039/DT9860001243',
      },
      {
        title: '人教版高中化学必修第一册71—72页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '340',
  },
  {
    slug: 'bio-cell-fates',
    name: '细胞的分化、衰老与凋亡',
    title: '细胞命运：信息、来源与执行',
    question: '细胞命运：信息、来源与执行',
    description: '由再生、培养和遗传干预的证据，区分分化、衰老与死亡。',
    color: '#a5b48b',
    tag: '生物学',
    related: ['bio-nuclear-evidence', 'bio-cell-division'],
    sources: [
      {
        title:
          'Steward, Mapes & Mears (1958), Organization in cultures grown from freely suspended cells',
        url: 'https://bsapubs.onlinelibrary.wiley.com/doi/10.1002/j.1537-2197.1958.tb10599.x',
      },
      {
        title: 'Muggleton-Harris & Hayflick (1976), Cellular aging studied by reconstruction',
        url: 'https://www.sciencedirect.com/science/article/pii/001448277690269X',
      },
      {
        title: 'Drescher-Lincoln & Smith (1983), Inhibition by senescent cytoplasts',
        url: 'https://pubmed.ncbi.nlm.nih.gov/6301866/',
      },
      {
        title: 'Sulston and Horvitz 1977: post-embryonic cell lineages',
        url: 'https://pubmed.ncbi.nlm.nih.gov/838129/',
      },
      {
        title: 'Horvitz laboratory original publications on programmed cell death',
        url: 'https://web.mit.edu/horvitz/www/pubtopic.html',
      },
      {
        title: 'Steward & Mapes (1963), The totipotency of cultured carrot cells',
        url: 'https://indianbotsoc.org/assets/upload/uploaded/1963%20Vol%2042%20A%20%20F.C.%20Steward%20%26%20Marion%20O.%20Mapes%20237-247.pdf',
      },
      {
        title: 'Ellis & Horvitz (1986), Genetic control of programmed cell death',
        url: 'https://pubmed.ncbi.nlm.nih.gov/3955651/',
      },
      {
        title: 'Chinnaiyan et al. (1997), Role of CED-4 in the activation of CED-3',
        url: 'https://www.nature.com/articles/41913',
      },
    ],
    number: '339',
  },
  {
    slug: 'chem-iron-steam',
    name: '铁与水蒸气的反应',
    title: '气体离开，固体为什么会增重？',
    question: '气体离开，固体为什么会增重？',
    description: '跟住水中的氧进入固体，再用完整质量账与限水预测解释铁和水蒸气的反应。',
    color: '#b8c3a4',
    tag: '水蒸气 · 铁氧化 · 气体证据',
    related: ['chem-iron-cycle', 'chem-hydrogen-chlorine'],
    sources: [
      {
        title: 'Karlsruhe Institute of Technology — Iron–steam–hydrogen cycle',
        url: 'https://vbt.ebi.kit.edu/english/28_1127.php',
      },
      {
        title: 'ETH Zürich original study — Steam–iron process',
        url: 'https://doi.org/10.1039/D3SE01228J',
      },
      {
        title: '人教版高中化学必修第一册70页图3-5',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '338',
  },
  {
    slug: 'bio-plant-growth-regulators',
    name: '植物生长调节剂的探究',
    title: '植物变长、生根或成熟，怎样确定处理的作用？',
    description: '追踪无菌体滤液，逐根记录插条，并用乙烯释放与成熟指标检验处理和对照。',
    color: '#bccaa4',
    tag: '滤液证据 · 生根记录 · 水果成熟',
    related: ['bio-auxin-evidence', 'bio-chemical-signals'],
    sources: [
      {
        title: 'A Century of Gibberellin Research',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4622167/',
      },
      {
        title: 'University of Florida — Common rooting hormones',
        url: 'https://irrecenvhort.ifas.ufl.edu/Propagation/labs/Module-3-Asexual-propagation-labs/Rooting-hormones/Module3-rooting-hormones-lab-script.pdf',
      },
      {
        title: 'University of Maryland — Ethylene and the Regulation of Fruit Ripening',
        url: 'https://extension.umd.edu/resource/ethylene-and-regulation-fruit-ripening',
      },
    ],
    question: '植物变长、生根或成熟，怎样确定处理的作用？',
    number: '337',
  },
  {
    slug: 'chem-iron-cycle',
    name: '铁离子的显色与转化',
    title: '同样的铁，为什么红色会消失又回来？',
    question: '红色究竟在报告什么？',
    description: '追踪铁与氯的电子收支、配体的解离与重组，分清显色、氧化还原与配合平衡。',
    color: '#baaa85',
    tag: '电子收支 · 配体重组 · 显色证据',
    related: [
      'chem-electron-transfer',
      'chem-precipitation-paths',
      'chem-iron-practical',
      'chem-food-iron',
    ],
    sources: [
      {
        title:
          'de Berg, Maeder & Clifford (2017), The thermodynamic formation constants for iron(III) thiocyanate complexes at zero ionic strength',
        url: 'https://doi.org/10.1016/j.ica.2017.06.017',
      },
      {
        title:
          'University of Delaware CHEM445 Experiment5, Formation Constant for Monothiocyanatoiron(III)',
        url: 'https://udel.edu/~dougr/Exp5.pdf',
      },
      {
        title: '人教版高中化学必修一72—73页、选择必修一36—37页、选择必修二97页',
        url: 'https://jc.pep.com.cn/',
      },
      {
        title:
          'Elijošiūtė2014 dissertation, iron(III) isothiocyanate structural/spectroscopic sections',
        url: 'https://epubl.ktu.edu/object/elaba%3A2192910/2192910.pdf',
      },
    ],
    number: '336',
  },
  {
    slug: 'bio-cell-division',
    name: '细胞分裂与固定观察',
    title: '细胞分裂：形态、顺序与计数',
    question: '细胞分裂：形态、顺序与计数',
    description: '追踪姐妹身份，再区分固定装片、活细胞记录和群体比例能提供的证据。',
    color: '#b09eac',
    tag: '生物学',
    related: ['bio-cell-microscopy', 'bio-nuclear-evidence', 'bio-cell-fates'],
    sources: [
      {
        title: 'Practical Biology: investigating mitosis in a root-tip squash',
        url: 'https://practicalbiology.org/cells-to-systems/cell-division/investigating-mitosis-in-a-root-tip-squash.html',
      },
      {
        title: 'Science & Plants for Schools: root-tip preparations',
        url: 'https://www.saps.org.uk/teaching-resources/resources/5915/using-spider-plants-to-prepare-root-tip-squashes/',
      },
      {
        title:
          'Pietra et al. (2013), Arabidopsis SABRE and CLASP interact to stabilize cell division plane orientation and planar polarity',
        url: 'https://www.nature.com/articles/ncomms3779.pdf',
      },
      {
        title: 'Week-long imaging of cell divisions in Arabidopsis root meristem (2019)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6446972/',
      },
    ],
    number: '335',
  },
  {
    slug: 'bio-auxin-evidence',
    name: '生长素的证据链',
    title: '植物弯向光，怎样一步步找到原因？',
    description: '从感光部位、琼脂传递和偏置来源，到剂量比较与运输设计，逐步区分观察和推断。',
    color: '#b6c99e',
    tag: '向光性 · 历史对照 · 生长素',
    related: ['bio-chemical-signals', 'bio-endocrine-evidence'],
    sources: [
      {
        title: 'Darwin — The Power of Movement in Plants',
        url: 'https://darwin-online.org.uk/converted/published/1880_Movement_F1325/1880_Movement_F1324.html',
      },
      {
        title:
          'Boysen-Jensen (1913) — Über die Leitung des phototropischen Reizes in der Avenakoleoptile',
        url: 'https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1438-8677.1913.tb06990.x',
      },
      {
        title: 'Briggs — Phototropism: Some History, Some Puzzles, and a Look Ahead',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3875795/',
      },
      {
        title: 'Polar Auxin Transport and Asymmetric Auxin Distribution',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3243298/',
      },
    ],
    question: '植物弯向光，怎样一步步找到原因？',
    number: '334',
  },
  {
    slug: 'bio-photosynthesis-evidence',
    name: '光合作用的证据链',
    title: '光合作用：氧从哪来，光怎样驱动合成？',
    question: '光怎样变成推动合成的能量？',
    description: '从独立对照、同位素和固定记录，追踪氧、质子梯度与碳的去向。',
    color: '#a4b97b',
    tag: '生物学',
    related: ['bio-leaf-pigments', 'bio-respiration'],
    sources: [
      {
        title: 'Hill (1937): oxygen evolved by isolated chloroplasts',
        url: 'https://www.nature.com/articles/139881a0',
      },
      {
        title: 'Ruben et al. (1941), Heavy Oxygen (O18) as a Tracer in the Study of Photosynthesis',
        url: 'https://doi.org/10.1021/ja01848a512',
      },
      {
        title: 'Arnon, Whatley and Allen (1954): photosynthetic phosphorylation',
        url: 'https://pubs.acs.org/doi/abs/10.1021/ja01653a025',
      },
      {
        title: 'Calvin: The Path of Carbon in Photosynthesis, Nobel lecture',
        url: 'https://escholarship.org/uc/item/70q925dw',
      },
      {
        title: 'SAPS, Investigating photosynthesis with leaf discs',
        url: 'https://www.saps.org.uk/teaching-resources/resources/284/student-sheet-3-investigating-photosynthesis-with-leaf-discs/',
      },
      {
        title: 'University of Hamburg: historical Engelmann material and algae distinction',
        url: 'https://www-archiv.fdm.uni-hamburg.de/b-online/d24/24.htm',
      },
      {
        title: 'Hill (1937), Oxygen evolved by isolated chloroplasts',
        url: 'https://doi.org/10.1038/139881a0',
      },
      {
        title: 'Arnon, Allen & Whatley (1954), Photosynthesis by Isolated Chloroplasts',
        url: 'https://doi.org/10.1021/ja01653a025',
      },
      {
        title:
          'Jagendorf & Uribe (1966), ATP formation caused by acid-base transition of spinach chloroplasts',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC285771/',
      },
      {
        title:
          'Hahn et al. (2018), Structure, mechanism, and regulation of the chloroplast ATP synthase',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29748256/',
      },
      {
        title: 'Calvin (1961), The Path of Carbon in Photosynthesis, original UCRL-9966 report',
        url: 'https://digital.library.unt.edu/ark:/67531/metadc902187/',
      },
      {
        title: 'Dynamic photosynthetic labeling and carbon-positional mass spectrometry (2025)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11809591/',
      },
    ],
    number: '333',
  },
  {
    slug: 'chem-hydrogen-chlorine',
    name: '氢气在氯气中燃烧',
    title: '燃烧一定需要氧气吗？',
    question: '燃烧一定需要氧气吗？',
    description: '观察苍白色火焰，区分无色HCl气体与湿空气中的酸雾，再追踪H₂和Cl₂的原子重组。',
    color: '#bbc6a5',
    tag: '燃烧 · 氯化氢 · 白雾',
    related: ['chem-chlorine-discovery', 'chem-electron-transfer'],
    sources: [
      {
        title: 'University of Wisconsin–Madison — Reaction of chlorine with hydrogen',
        url: 'https://www2.chem.wisc.edu/deptfiles/genchem/demonstrations/Inorganic/pages/Group67/chlorine_and_hydrogen.htm',
      },
      {
        title: 'NIST Chemistry WebBook — Hydrogen chloride gas thermochemistry',
        url: 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C7647010&Mask=1',
      },
      {
        title: '人教版高中化学必修第一册45页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '332',
  },
  {
    slug: 'chem-chlorine-discovery',
    name: '氯气：证据与解释',
    title: '产物里有氧，就能断定气体含氧吗？',
    question: '产物里有氧，就能断定气体含氧吗？',
    description: '水中的氧原来在哪里？从戴维的论证，到现代装置中每一份氯的去向。',
    color: '#bbc6a3',
    tag: '化学史 · 气体装置 · 尾气',
    related: ['chem-chlorine-bleaching', 'chem-anion-tests'],
    sources: [
      {
        title: 'Royal Society of Chemistry — Chlorine, history and properties',
        url: 'https://periodic-table.rsc.org/element/17/chlorine',
      },
      { title: '人教版高中化学必修第一册44、47—49页', url: 'https://jc.pep.com.cn/' },
      {
        title: 'H. Davy, Researches on the oxymuriatic acid, its nature and combinations,1810',
        url: 'https://doi.org/10.1098/rstl.1810.0016',
      },
    ],
    number: '331',
  },
  {
    slug: 'bio-leaf-pigments',
    name: '叶片的色带与光谱',
    title: '绿色叶片里，为什么会分出几条色带？',
    question: '同一滴绿色，为什么会分成几条色带？',
    description: '让色素在两相之间不断交换，看见迁移差异；再用真实光谱解释绿色透过与浓度变化。',
    color: '#9fab75',
    tag: '生物学',
    related: ['bio-food-tests', 'bio-cell-microscopy', 'bio-photosynthesis-evidence'],
    sources: [
      {
        title: 'Royal Society of Chemistry: leaf chromatography',
        url: 'https://edu.rsc.org/mixtures-and-separation/leaf-chromatography/389.article',
      },
      {
        title: 'PhotochemCAD: chlorophyll a in diethyl ether',
        url: 'https://omlc.org/spectra/PhotochemCAD/html/123.html',
      },
      {
        title: 'PhotochemCAD: chlorophyll b in diethyl ether',
        url: 'https://omlc.org/spectra/PhotochemCAD/html/125.html',
      },
      {
        title: 'PhotochemCAD: beta-carotene in hexane',
        url: 'https://omlc.org/spectra/PhotochemCAD/html/041.html',
      },
      {
        title: 'Martin and Synge (1941) — two-phase chromatography',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1265645/',
      },
      {
        title: 'IUPAC Gold Book — chromatography',
        url: 'https://goldbook.iupac.org/terms/view/C01075',
      },
      {
        title: 'PhotochemCAD — measured chlorophyll a absorption',
        url: 'https://omlc.org/spectra/PhotochemCAD/data/123-abs.txt',
      },
      {
        title: 'PhotochemCAD — measured chlorophyll b absorption',
        url: 'https://omlc.org/spectra/PhotochemCAD/data/125-abs.txt',
      },
      {
        title: 'PhotochemCAD — measured beta-carotene absorption',
        url: 'https://omlc.org/spectra/PhotochemCAD/data/041-abs.txt',
      },
    ],
    number: '330',
  },
  {
    slug: 'chem-chlorine-photolysis',
    name: '氯水光解：从光到读数',
    title: '光怎样让三路读数一起变化？',
    question: '光怎样让三路读数一起变化？',
    description: '跟随光吸收和同一批原子，解释三路探头，再用顶空变化检验比例与产量。',
    color: '#b6c4a1',
    tag: '数字实验 · 传感器 · 守恒',
    related: ['chem-chlorine-bleaching', 'chem-anion-tests', 'chem-methane-substitution'],
    sources: [
      {
        title: 'JACS Au — HOCl net photodecomposition, equation 8',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10207101/',
      },
      {
        title: 'Water Research — Wavelength-dependent chlorine photolysis',
        url: 'https://doi.org/10.1016/j.watres.2018.06.018',
      },
      {
        title: 'Watts and Linden (2007) — aqueous chlorine photolysis under UV',
        url: 'https://doi.org/10.1016/j.watres.2007.03.032',
      },
      {
        title: '人教版高中化学必修第一册48页图2-16',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '329',
  },
  {
    slug: 'bio-immune-pathways',
    name: '免疫路径与证据',
    title: '认出一种标记，怎样连到一条免疫路径？',
    description: '区分脑膜淋巴管的结构与运输证据，再追踪抗原呈递、克隆扩增、抗体和感染细胞。',
    color: '#b1c69f',
    tag: '标记身份 · 抗原匹配 · 免疫记忆',
    related: ['bio-neural-evidence', 'bio-chemical-signals', 'bio-protein-machines'],
    sources: [
      {
        title:
          'Louveau et al. (2015) — Structural and functional features of central nervous system lymphatic vessels',
        url: 'https://www.nature.com/articles/nature14432',
      },
      {
        title: 'OpenStax — Adaptive Immune Response',
        url: 'https://openstax.org/books/biology-2e/pages/42-2-adaptive-immune-response',
      },
    ],
    question: '认出一种标记，怎样连到一条免疫路径？',
    number: '328',
  },
  {
    slug: 'chem-chlorine-bleaching',
    name: '干湿对照与氯气漂白',
    title: '同样的氯气，为什么纸条表现不同？',
    question: '同样的氯气，为什么纸条表现不同？',
    description: '比较干燥纸条、湿润纸条和鲜花，识别水在教材漂白实验中的作用。',
    color: '#bbc8a5',
    tag: '对照实验 · 次氯酸 · 氧化',
    related: [
      'chem-anion-tests',
      'chem-precipitation-paths',
      'chem-chlorine-photolysis',
      'chem-sulfur-dioxide',
    ],
    sources: [
      {
        title: 'Royal Society of Chemistry — Reactions of chlorine with water or halide ions',
        url: 'https://edu.rsc.org/experiments/reactions-of-chlorine-with-water-or-halide-ions/530.article',
      },
      {
        title: 'JACS Au — Hypochlorous acid generation and bleaching observations',
        url: 'https://pubs.acs.org/doi/abs/10.1021/jacsau.3c00066',
      },
      {
        title: '人教版高中化学必修第一册46—47页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '327',
  },
  {
    slug: 'bio-respiration',
    name: '呼吸的气路与碳路径',
    title: '两瓶酵母，能量从哪里来？',
    question: '发酵究竟让什么重新流动起来？',
    description: '从气体和乙醇的对照结果，追踪碳、电子载体与ATP的不同账目。',
    color: '#adb995',
    tag: '生物学',
    related: ['bio-enzyme-investigations', 'bio-cellular-logistics'],
    sources: [
      {
        title: 'NCBI Bookshelf: metabolic energy',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK9903/',
      },
      {
        title: 'OpenStax: fermentation',
        url: 'https://openstax.org/books/microbiology/pages/8-4-fermentation',
      },
      {
        title: 'IUBMB EC 2.7.1.1 hexokinase',
        url: 'https://iubmb.qmul.ac.uk/enzyme/EC2/7/1/1.html',
      },
      {
        title: 'Rhea 17825: D-glucose + ATP = D-glucose 6-phosphate + ADP + H+',
        url: 'https://www.rhea-db.org/rhea/17825',
      },
      {
        title: 'IUBMB EC 1.2.1.12 glyceraldehyde-3-phosphate dehydrogenase',
        url: 'https://iubmb.qmul.ac.uk/enzyme/EC1/2/1/12.html',
      },
      {
        title: 'IUBMB EC 1.1.1.1 alcohol dehydrogenase',
        url: 'https://iubmb.qmul.ac.uk/enzyme/EC1/1/1/1.html',
      },
      {
        title: 'Gilbert et al. (2011), intramolecular carbon isotope distribution in ethanol',
        url: 'https://onlinelibrary.wiley.com/doi/10.1111/j.1365-3040.2011.02308.x',
      },
      {
        title:
          'Peter Mitchell, Nobel Lecture (1978), David Keilin’s Respiratory Chain Concept and Its Chemiosmotic Consequences',
        url: 'https://www.nobelprize.org/uploads/2018/06/mitchell-lecture.pdf',
      },
      {
        title:
          'Hagman & Piškur (2015), A Study on the Fundamental Mechanism and the Evolutionary Driving Forces behind Aerobic Fermentation in Yeast',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4305316/',
      },
      {
        title:
          'Luttik et al. (1998), The Saccharomyces cerevisiae NDE1 and NDE2 genes encode separate mitochondrial NADH dehydrogenases catalyzing the oxidation of cytosolic NADH',
        url: 'https://pubmed.ncbi.nlm.nih.gov/9733747/',
      },
      {
        title: 'Ndi1 associates with the III2IV supercomplex in Saccharomyces cerevisiae (2015)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/26173916/',
      },
      {
        title: 'Bennett & Steitz (1978), Glucose-induced conformational change in yeast hexokinase',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC336218/',
      },
    ],
    number: '326',
  },
  {
    slug: 'chem-solution-preparation',
    name: '容量瓶与定量配液',
    title: '洗涤和定容，分别控制了什么？',
    question: '洗涤和定容，分别控制了什么？',
    description: '追踪称量、溶解、转移、洗涤、定容和稀释，把溶质量与最终体积连接到浓度。',
    color: '#b0c3a8',
    tag: '物质的量 · 容量瓶 · 稀释',
    related: ['chem-ionic-conduction', 'chem-anion-tests', 'bio-buffer-comparison'],
    sources: [
      {
        title: 'University of Wisconsin–Madison — Dissolving a solute',
        url: 'https://www2.chem.wisc.edu/deptfiles/genchem/lab/labdocs/modules/volflask/volflaskdisol.htm',
      },
      {
        title: 'University of Wisconsin–Madison — Filling a volumetric flask',
        url: 'https://www2.chem.wisc.edu/deptfiles/genchem/lab/labdocs/modules/volflask/volflaskfill.htm',
      },
      {
        title: 'NIST — Volumetric calibrations and meniscus reading',
        url: 'https://nvlpubs.nist.gov/nistpubs/ir/2019/NIST.IR.7383-2019.pdf',
      },
      {
        title: '人教版高中化学必修第一册59、65—66页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '325',
  },
  {
    slug: 'bio-enzyme-investigations',
    name: '酶的证据与条件',
    title: '细胞为什么靠酶加速反应？',
    question: '细胞为什么靠酶加速反应？',
    description: '从对照现象追到能垒、催化构型与状态历史，再用恢复条件作预测。',
    color: '#aab28a',
    tag: '生物学',
    related: ['bio-food-tests', 'bio-protein-machines', 'bio-respiration'],
    sources: [
      {
        title: 'Eduard Buchner: Nobel lecture',
        url: 'https://www.nobelprize.org/prizes/chemistry/1907/buchner/lecture/',
      },
      {
        title: 'James Sumner: Nobel lecture',
        url: 'https://www.nobelprize.org/prizes/chemistry/1946/sumner/lecture/',
      },
      {
        title: 'Practical Biology: investigating catalase and hydrogen peroxide',
        url: 'https://practicalbiology.org/bio-molecules/factors-affecting-enzyme-activity/investigating-an-enzyme-controlled-reaction-catalase-and-hydrogen-peroxide-concentration.html',
      },
      { title: '人教版高中生物学必修1，76—84页', url: 'https://jc.pep.com.cn/' },
      { title: 'IUPAC Gold Book — Catalyst', url: 'https://goldbook.iupac.org/terms/view/C00876' },
      {
        title: 'RCSB PDB 1CPU — Human pancreatic alpha-amylase binding subsites',
        url: 'https://www.rcsb.org/structure/1CPU',
      },
      {
        title: 'Neves et al. (2022) — Alpha-amylase dynamics and catalysis',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9778734/',
      },
      {
        title: 'Rodriguez Sanoja et al. (2000) — Amylase activity and stability',
        url: 'https://journals.asm.org/doi/10.1128/AEM.66.8.3350-3356.2000',
      },
    ],
    number: '324',
  },
  {
    slug: 'bio-neural-evidence',
    name: '神经研究与病例证据',
    title: '一次反应、一次刺激、一个病例，各能说明什么？',
    description: '分别组织条件学习、运动皮层定位和语言病例的观察，让干预与推断保持边界。',
    color: '#b7b9a1',
    tag: '条件学习 · 皮层定位 · 病例',
    related: ['bio-nerve-signals', 'bio-chemical-signals'],
    sources: [
      {
        title: 'Pavlov — Nobel Lecture',
        url: 'https://www.nobelprize.org/prizes/medicine/1904/pavlov/lecture/',
      },
      {
        title: 'Neuroscience — Functional Organization of the Primary Motor Cortex',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK11095/',
      },
      {
        title: 'Neuroscience — Aphasias',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK10972/',
      },
    ],
    question: '一次反应、一次刺激、一个病例，各能说明什么？',
    number: '323',
  },
  {
    slug: 'chem-anion-tests',
    name: '阴离子的两步证据',
    title: '出现白色沉淀，就足以认出阴离子吗？',
    question: '出现白色沉淀，就足以认出阴离子吗？',
    description: '并排比较氯化物、硫酸盐和碳酸盐，追踪加试剂、加酸两步形成的证据。',
    color: '#b1c2ac',
    tag: '定性分析 · 沉淀 · 对照',
    related: [
      'chem-precipitation-paths',
      'chem-ionic-conduction',
      'chem-solution-preparation',
      'chem-chlorine-bleaching',
    ],
    sources: [
      {
        title: 'Truman State University — Inorganic qualitative analysis',
        url: 'https://chemlab.truman.edu/chemical-principles/inorganic-quantitative-analysis/',
      },
      {
        title: 'Royal Society of Chemistry — Testing salts for anions and cations',
        url: 'https://edu.rsc.org/experiments/testing-salts-for-anions-and-cations/464.article',
      },
      {
        title: '人教版高中化学必修第一册49页、第二册6页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '322',
  },
  {
    slug: 'chem-precipitation-paths',
    name: '沉淀的生成、溶解与转化',
    title: '沉淀变了，怎样证明离子的去向？',
    question: '沉淀变了，怎样证明离子的去向？',
    description:
      '从固液界面追踪离子：用酸耗OH⁻、银盐再形成与铁沉淀对照，把颜色变化变成可检验的解释。',
    color: '#b7c6a5',
    tag: '离子反应 · 沉淀 · 溶解平衡',
    related: ['chem-ionic-conduction', 'chem-carbonate-comparison', 'chem-anion-tests'],
    sources: [
      {
        title: 'UMass Chemistry — Solubility product table',
        url: 'https://owl.oit.umass.edu/departments/Chemistry/appendix/ksp.html',
      },
      {
        title: 'UMass Chemistry — Common-ion effect, barium sulfate benchmark',
        url: 'https://genchem.chem.umass.edu/whelan/Lectures_Chem_112/Spring_2019/Lecture_18.pdf',
      },
      {
        title: 'OpenStax Chemistry 2e — Precipitation and dissolution',
        url: 'https://openstax.org/books/chemistry-2e/pages/15-1-precipitation-and-dissolution',
      },
      { title: '人教版高中化学必修一17页、选必一82—83页', url: 'https://jc.pep.com.cn/' },
      {
        title: 'Rutgers Chemistry — Milk of magnesia: hydroxide consumption and dissolution',
        url: 'https://www.chem.rutgers.edu/cldf-demos/1023-cldf-demo-milk-of-magnesia',
      },
      {
        title: 'IUPAC Gold Book — Solubility product',
        url: 'https://goldbook.iupac.org/terms/view/S05742',
      },
    ],
    number: '321',
  },
  {
    slug: 'bio-nuclear-evidence',
    name: '细胞核的七组证据',
    title: '换一个细胞核，会改变什么',
    question: '核、细胞质与发育环境，各自留下什么证据？',
    description: '比较核移植、横缢、去核恢复与伞藻再生，追踪细胞核的来源和作用。',
    color: '#aaa086',
    tag: '生物学',
    related: ['bio-cellular-logistics', 'bio-engineered-genomes'],
    sources: [
      {
        title: 'Gurdon (1962): developmental capacity of tadpole intestinal nuclei',
        url: 'https://journals.biologists.com/dev/article-pdf/10/4/622/2653611/develop_10_4_622.pdf',
      },
      {
        title: 'Liu et al. (2018): cloning macaque monkeys by somatic cell nuclear transfer',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29395327/',
      },
      {
        title: 'Hämmerling (1953): nucleo-cytoplasmic relationships in Acetabularia',
        url: 'https://www.sciencedirect.com/science/chapter/bookseries/pii/S0074769608610426',
      },
      {
        title: 'Hans Spemann: Nobel lecture',
        url: 'https://www.nobelprize.org/prizes/medicine/1935/spemann/lecture/',
      },
      {
        title: 'Nobel Committee: developmental reprogramming evidence',
        url: 'https://www.nobelprize.org/prizes/medicine/2012/advanced-information/',
      },
    ],
    number: '320',
  },
  {
    slug: 'bio-endocrine-evidence',
    name: '激素研究的对照证据',
    title: '拿走一种信号，再补回来，能说明什么？',
    question: '拿走一种信号，再补回来，能说明什么？',
    description: '区分胰岛素供体与受体、摘除与移植、兔胚胎观察与预测，再检验血糖和甲状腺反馈。',
    color: '#bbbc9e',
    tag: '减法与加法 · 内分泌反馈',
    related: ['bio-chemical-signals', 'diffusion'],
    sources: [
      {
        title: 'Banting — Nobel Lecture',
        url: 'https://www.nobelprize.org/prizes/medicine/1923/banting/lecture/',
      },
      {
        title: 'Endotext — Sexual Differentiation',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK279001/',
      },
      {
        title: 'OpenStax — Regulation of Body Processes',
        url: 'https://openstax.org/books/biology-2e/pages/37-3-regulation-of-body-processes',
      },
    ],
    number: '319',
  },
  {
    slug: 'bio-body-fluid-balance',
    name: '体液交换与稳态记录',
    title: '环境不断变化，细胞如何仍生活在稳定范围？',
    question: '环境不断变化，细胞如何仍生活在稳定范围？',
    description: '在体液路径中核对示踪量，编辑家庭体温调查记录，再比较热量、水和钠的反馈收支。',
    color: '#b4c7a2',
    tag: '体液联系 · 调查记录 · 稳态',
    related: ['osmosis', 'diffusion', 'bio-buffer-comparison'],
    sources: [
      {
        title: 'OpenStax — Body Fluids and Fluid Compartments',
        url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/26-1-body-fluids-and-fluid-compartments',
      },
      {
        title: 'OpenStax — Homeostasis',
        url: 'https://openstax.org/books/biology-2e/pages/33-3-homeostasis',
      },
      {
        title: 'OpenStax — Regulation of Body Processes',
        url: 'https://openstax.org/books/biology-2e/pages/37-3-regulation-of-body-processes',
      },
    ],
    number: '318',
  },
  {
    slug: 'bio-engineered-genomes',
    name: '合成基因组与活细胞',
    title: '合成DNA，为什么还不等于合成细胞？',
    question: '合成了DNA，为什么还不能说合成了整个细胞？',
    description:
      '从显色与DNA标记追到基因表达，再用单染色体酵母的固定生长记录，分清信息、机器和真实功能。',
    color: '#a6ad8c',
    tag: '生物学',
    related: ['bio-protein-machines', 'bio-cellular-logistics'],
    sources: [
      {
        title:
          'Gibson et al. (2010): a bacterial cell controlled by a chemically synthesized genome',
        url: 'https://doi.org/10.1126/science.1190719',
      },
      {
        title: 'Shao et al. (2018): creating a functional single-chromosome yeast',
        url: 'https://www.nature.com/articles/s41586-018-0382-x',
      },
    ],
    number: '317',
  },
  {
    slug: 'chem-electron-transfer',
    name: '电子得失与电子对偏移',
    title: '电子账本怎样决定反应配比？',
    question: '电子账本怎样决定反应配比？',
    description: '追踪电子归属，区分离子得失与共价共享，再用同一账本预测铁能还原多少铜。',
    color: '#b5c6a5',
    tag: '氧化还原 · 电子归属 · 极性',
    related: [
      'chem-ionic-conduction',
      'electrolysis',
      'chem-sodium-reactions',
      'chem-galvanic-cells',
      'chem-reaction-rates',
    ],
    sources: [
      {
        title: 'IUPAC Gold Book — Oxidation state',
        url: 'https://goldbook.iupac.org/terms/view/O04365',
      },
      {
        title: 'IUPAC — Comprehensive definition of oxidation state',
        url: 'https://iupac.org/recommendation/comprehensive-definition-of-oxidation-state/',
      },
      { title: '人教版高中化学必修第一册，23—24页', url: 'https://jc.pep.com.cn/' },
      {
        title: 'IUPAC (2016) — Comprehensive definition of oxidation state, full paper',
        url: 'https://www.cup.uni-muenchen.de/ac/kluefers/homepage/L/kc2/literature/iupac_oxidation_state_2016.pdf',
      },
    ],
    number: '316',
  },
  {
    slug: 'bio-cellular-logistics',
    name: '细胞里的分泌路线',
    title: '没有拍到全过程，怎样知道蛋白质走过哪里？',
    question: '没有拍到全过程，怎样知道蛋白质走过哪里？',
    description: '由三次定位推断路径，再用真实膜边界和出口阻断检验解释。',
    color: '#a4ac82',
    tag: '生物学',
    related: ['bio-nuclear-evidence'],
    sources: [
      {
        title: 'Jamieson and Palade (1967): intracellular transport of secretory proteins',
        url: 'https://rupress.org/jcb/article-abstract/34/2/577/16998/INTRACELLULAR-TRANSPORT-OF-SECRETORY-PROTEINS-IN?redirectedFrom=PDF',
      },
      {
        title: 'Jamieson and Palade: original paper hosted by Rockefeller University',
        url: 'https://shahamlab.rockefeller.edu/ET_readings/JamiesonPalade1967.pdf',
      },
      {
        title:
          'Caro & Palade (1964) — Protein synthesis, storage, and discharge in the pancreatic exocrine cell (abstract)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2106415/',
      },
      {
        title:
          'Jamieson & Palade (1967) — Intracellular transport of secretory proteins, I (abstract)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2107305/',
      },
      {
        title:
          'Jamieson & Palade (1967) — Intracellular transport of secretory proteins, II (abstract and indexed methods)',
        url: 'https://doi.org/10.1083/jcb.34.2.597',
      },
    ],
    number: '315',
  },
  {
    slug: 'chem-flame-spectra',
    name: '焰色与原子光谱',
    title: '原子为什么只发出特定颜色的光？',
    question: '原子为什么只发出特定颜色的光？',
    description: '把火焰的颜色拆成谱线，追踪光子与原子之间的能量交换，再用固定谱线推断未知样品。',
    color: '#a9b7b3',
    tag: '焰色 · 能级 · 原子光谱',
    related: ['atomic-spectrum-lab', 'prism-dispersion'],
    sources: [
      {
        title: 'RSC Education — Flame tests using metal salts',
        url: 'https://edu.rsc.org/resources/flame-tests-using-metal-salts/1875.article',
      },
      {
        title: 'NIST — Sodium strong lines',
        url: 'https://physics.nist.gov/PhysRefData/Handbook/Tables/sodiumtable2.htm',
      },
      {
        title: 'NIST — Potassium strong lines',
        url: 'https://physics.nist.gov/PhysRefData/Handbook/Tables/potassiumtable2.htm',
      },
      {
        title: 'NIST — Lithium strong lines',
        url: 'https://physics.nist.gov/PhysRefData/Handbook/Tables/lithiumtable2.htm',
      },
      {
        title: 'NIST — Helium strong lines',
        url: 'https://physics.nist.gov/PhysRefData/Handbook/Tables/heliumtable2.htm',
      },
      {
        title: 'NIST — Mercury strong lines',
        url: 'https://physics.nist.gov/PhysRefData/Handbook/Tables/mercurytable2.htm',
      },
      {
        title: '人教版高中化学必修一40页、选必二7—8页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '314',
  },
  {
    slug: 'bio-protein-machines',
    name: '蛋白质的连接与功能',
    title: '51个残基，为什么还不能证明它能工作？',
    question: '数量和外形都对了，蛋白质就一定能工作吗？',
    description: '用牛胰岛素追踪肽键、两条链与三处二硫键，再把结构参照与有来源的功能证据分开检验。',
    color: '#8da18d',
    tag: '生物学',
    related: ['bio-food-tests', 'bio-engineered-genomes', 'bio-immune-pathways'],
    sources: [
      {
        title: 'RCSB PDB 2A3G: experimentally determined T6 bovine insulin',
        url: 'https://www.rcsb.org/structure/2A3G',
      },
      {
        title: 'RCSB PDB-101: insulin structure and disulfide connections',
        url: 'https://pdb101.rcsb.org/learn/paper-models/insulin-activity-page',
      },
      {
        title:
          'Tsou Cheng-Lu — Firsthand recollection of total insulin synthesis (2015 reprint of 1998 article)',
        url: 'https://lifescience.sinh.ac.cn/webadmin/upload/20156777.pdf',
      },
    ],
    number: '313',
  },
  {
    slug: 'chem-sodium-reactions',
    name: '钠、氧化物与过氧化物',
    title: '同样含钠，为什么反应产物不同？',
    question: '同样含钠，为什么反应产物不同？',
    description:
      '从表面接触对照追到氧的价态与水中氢的去向，用原子和电子账本预测不同气体，再比较钠和钾的等量产氢。',
    color: '#c1c7a3',
    tag: '金属 · 氧化 · 气体检验',
    related: [
      'chem-carbonate-comparison',
      'chem-ionic-conduction',
      'chem-electron-transfer',
      'chem-sodium-alcohol',
    ],
    sources: [
      {
        title: 'RSC — Sodium: element information',
        url: 'https://periodic-table.rsc.org/element/11/Sodium',
      },
      {
        title: 'RSC Education — Alkali metals and water',
        url: 'https://edu.rsc.org/lesson-plans/how-do-alkali-metals-react-with-water-14-16-years/89.article',
      },
      {
        title: 'ACS Journal of Chemical Education — Sodium peroxide and water demonstration',
        url: 'https://pubs.acs.org/doi/10.1021/acs.jchemed.4c00375',
      },
      {
        title: 'NIH PubChem — Sodium peroxide',
        url: 'https://pubchem.ncbi.nlm.nih.gov/compound/Sodium-peroxide',
      },
      { title: '人教版高中化学必修第一册，34—37、100页', url: 'https://jc.pep.com.cn/' },
      {
        title: 'RSC — Potassium: density and properties',
        url: 'https://periodic-table.rsc.org/element/19/potassium',
      },
      {
        title: 'IUPAC Gold Book: peroxides',
        url: 'https://goldbook.iupac.org/terms/view/P04510/html',
      },
      {
        title: 'NIST Handbook: Atomic Data for Lithium',
        url: 'https://physics.nist.gov/PhysRefData/Handbook/Tables/lithiumtable1.htm',
      },
      {
        title: 'NIST Handbook: Atomic Data for Sodium',
        url: 'https://physics.nist.gov/PhysRefData/Handbook/Tables/sodiumtable1.htm',
      },
      {
        title: 'NIST Handbook: Atomic Data for Potassium',
        url: 'https://physics.nist.gov/PhysRefData/Handbook/Tables/potassiumtable1.htm',
      },
      {
        title:
          'A Simple, Safe, and Easy Demonstration of the Reaction between Sodium Peroxide and Water',
        url: 'https://pubs.acs.org/doi/abs/10.1021/acs.jchemed.4c00375',
      },
      {
        title: 'NOAA CAMEO: Sodium peroxide',
        url: 'https://cameochemicals.noaa.gov/chemical/1516',
      },
    ],
    number: '312',
  },
  {
    slug: 'bio-osmosis',
    name: '水为什么穿过细胞膜',
    title: '盐让细胞变瘪，水却从未停止运动',
    question: '水一直在来回，细胞为什么还会变瘪？',
    description:
      '从墨滴的无规则运动到膜两侧的双向交换，用漏斗水柱与细胞变形推导渗透、动平衡和膨压，再预测水通道反转外液后的结果。',
    color: '#8aa197',
    tag: '生物学',
    related: ['bio-membrane-evidence', 'osmosis'],
    sources: [
      {
        title: 'IUPAC Gold Book — Chemical potential',
        url: 'https://goldbook.iupac.org/terms/view/C01032',
      },
      {
        title: 'OpenStax Biology 2e: passive transport',
        url: 'https://openstax.org/books/biology-2e/pages/5-2-passive-transport',
      },
      {
        title: 'Preston et al. (1992): water channels in Xenopus oocytes expressing CHIP28',
        url: 'https://pubmed.ncbi.nlm.nih.gov/1373524/',
      },
      {
        title: 'Royal Swedish Academy: advanced information for the 2003 chemistry prize',
        url: 'https://www.nobelprize.org/uploads/2018/06/advanced-chemistryprize2003-1.pdf',
      },
    ],
    number: '311',
  },
  {
    slug: 'chem-carbonate-comparison',
    name: '两种碳酸盐的对照',
    title: '名字里有氢，为什么还是碱性的？',
    question: '名字里有氢，为什么还是碱性的？',
    description: '从加水、显色与加热的对照，追踪水、离子和产物，把现象变成可检验的解释。',
    color: '#c5c9a2',
    tag: '水合 · 碱性 · 热分解',
    related: ['chem-ionic-conduction', 'latent-heat', 'chem-sodium-reactions'],
    sources: [
      {
        title: 'ACS — Temperature Changes in Dissolving',
        url: 'https://www.acs.org/middleschoolchemistry/lessonplans/chapter5/lesson9.html',
      },
      {
        title: 'College of Alameda — Thermal Decomposition of Sodium Bicarbonate',
        url: 'https://alameda.edu/hubfs/Chem-1A-Exp.-7-Decomposition-of-Sodium-Carbonate.pdf',
      },
      {
        title: 'NIH PubChem — Sodium bicarbonate, solubility',
        url: 'https://pubchem.ncbi.nlm.nih.gov/compound/Sodium-bicarbonate',
      },
      {
        title: 'NIH PubChem — Sodium carbonate, solubility',
        url: 'https://pubchem.ncbi.nlm.nih.gov/compound/Sodium-carbonate',
      },
      {
        title: 'USGS — Carbonate speciation and nominal equilibrium constants',
        url: 'https://water.usgs.gov/water-resources/memos/memo.php?id=2098',
      },
      {
        title: 'Pines et al. — How Acidic Is Carbonic Acid?',
        url: 'https://pubmed.ncbi.nlm.nih.gov/26862781/',
      },
      {
        title: '人教版高中化学必修第一册，38—39页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '310',
  },
  {
    slug: 'bio-membrane-evidence',
    name: '细胞膜的证据链',
    title: '看不清细胞膜，怎样知道它长什么样？',
    question: '看不清细胞膜，怎样知道它长什么样？',
    description: '用面积、界面、图像和标记运动逐步检验膜结构假说。',
    color: '#81996e',
    tag: '生物学',
    related: ['bio-cell-microscopy', 'bio-osmosis'],
    sources: [
      {
        title: 'Gorter and Grendel (1925): bimolecular lipid layers',
        url: 'https://rupress.org/jem/article-abstract/41/4/439/26091/ON-BIMOLECULAR-LAYERS-OF-LIPOIDS-ON-THE?redirectedFrom=PDF',
      },
      {
        title: 'Frye and Edidin (1970): intermixing cell-surface antigens',
        url: 'https://journals.biologists.com/jcs/article-abstract/7/2/319/59409/The-rapid-intermixing-of-cell-surface-antigens?redirectedFrom=PDF',
      },
      {
        title: 'Singer and Nicolson (1972): the fluid mosaic model',
        url: 'https://pubmed.ncbi.nlm.nih.gov/4333397/',
      },
      {
        title: 'Danielli and Davson (1935): permeability of thin films',
        url: 'https://onlinelibrary.wiley.com/doi/pdf/10.1002/jcp.1030050409',
      },
      {
        title: 'Gorter & Grendel (1925) — Original paper and area measurements',
        url: 'https://www.rpgroup.caltech.edu/cshl_pboc_2026/assets/pdfs/Gorter1924.pdf',
      },
      {
        title: 'Singer & Nicolson (1972) — Original fluid mosaic model',
        url: 'https://dasher.wustl.edu/bio5357/discussion/science-175-720-72.pdf',
      },
      {
        title: 'Walter & Gutknecht — Permeability of small nonelectrolytes',
        url: 'https://link.springer.com/article/10.1007/BF01870127',
      },
    ],
    number: '309',
  },
  {
    slug: 'bio-chemical-signals',
    name: '可转移的化学信号',
    title: '神经没有接通，另一颗心为什么也慢了？',
    question: '神经没有接通，另一颗心为什么也慢了？',
    description: '追踪蛙心营养液中的同一份示踪物，并用促胰液素实验区分神经路径与血液路径。',
    color: '#c6b09a',
    tag: '营养液转移 · 化学信使',
    related: ['diffusion', 'osmosis', 'bio-endocrine-evidence'],
    sources: [
      {
        title: 'Otto Loewi — Nobel Lecture',
        url: 'https://www.nobelprize.org/prizes/medicine/1936/loewi/lecture/',
      },
      {
        title: 'Bayliss and Starling (1902) — The mechanism of pancreatic secretion',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1540572/',
      },
    ],
    number: '308',
  },
  {
    slug: 'bio-nerve-signals',
    name: '神经信号的实验线索',
    title: '电表的两次偏转，怎样连到神经之间的传递？',
    question: '电表的两次偏转，怎样连到神经之间的传递？',
    description: '从两个表面电极追踪同一束兴奋，再观察膜电位、突触释放和生物电历史对照。',
    color: '#9ab3c0',
    tag: '差分电位 · 突触 · 实验解释',
    related: ['rc-circuit', 'diffusion', 'bio-neural-evidence'],
    sources: [
      {
        title: 'OpenStax — How Neurons Communicate',
        url: 'https://openstax.org/books/biology-2e/pages/35-2-how-neurons-communicate',
      },
      {
        title: 'Nobel Prize — Nerve Signaling',
        url: 'https://educationalgames.nobelprize.org/educational/medicine/nerve_signaling/overview/index.php',
      },
    ],
    number: '307',
  },
  {
    slug: 'bio-buffer-comparison',
    name: '内环境的缓冲实验',
    title: '同样加入酸，三份样液为何变化不同？',
    question: '同样加入酸，三份样液为何变化不同？',
    description: '用相同滴加量比较水、磷酸盐与生物材料的模型曲线，追踪缓冲对的转化和有限容量。',
    color: '#9ab49b',
    tag: '酸碱扰动 · 缓冲容量',
    related: ['osmosis', 'diffusion', 'bio-body-fluid-balance', 'chem-solution-preparation'],
    sources: [
      {
        title: 'OpenStax — Buffers',
        url: 'https://openstax.org/books/chemistry-2e/pages/14-6-buffers',
      },
    ],
    number: '306',
  },
  {
    slug: 'chem-ionic-conduction',
    name: '电解质与电流',
    title: '有离子，为什么不一定能导电？',
    question: '有离子，为什么不一定能导电？',
    description: '比较干燥盐、蒸馏水与两种盐溶液，追踪晶格离子的解离、定向移动和检测阈值。',
    color: '#b9c9a6',
    tag: '电离 · 离子移动 · 导电',
    related: ['electrolysis', 'resistivity-lab', 'chem-electron-transfer'],
    sources: [
      {
        title: 'OpenStax Chemistry 2e — Electrolytes',
        url: 'https://openstax.org/books/chemistry-2e/pages/11-2-electrolytes',
      },
      {
        title: 'UMass Environmental Engineering — Conductivity, Table 18.3',
        url: 'https://www.ecs.umass.edu/cee/reckhow/courses/572/572bk18/572BK18.html',
      },
      {
        title: 'USGS — Specific Conductance',
        url: 'https://www.usgs.gov/publications/chapter-a63-specific-conductance',
      },
      {
        title: '人教版高中化学必修第一册，14—16页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '305',
  },
  {
    slug: 'chem-colloid-light',
    name: '看见光的条件',
    title: '光穿过去了，为什么侧面看不见？',
    question: '光穿过去了，为什么侧面看不见？',
    description:
      '从两块亮着的光屏出发，追踪微粒如何把光送入眼睛，再用遮挡、关光和稀释检验散射解释。',
    color: '#9fbbac',
    tag: '胶体 · 散射 · 光路',
    related: ['rayleigh-scattering'],
    sources: [
      {
        title: 'Feynman Lectures — Radiation Damping. Light Scattering',
        url: 'https://www.feynmanlectures.caltech.edu/I_32.html#Ch32-S5',
      },
      {
        title: 'OpenStax Chemistry 2e — Colloids',
        url: 'https://openstax.org/books/chemistry-2e/pages/11-5-colloids',
      },
      {
        title: 'NIST SCATMECH — RayleighScatterer',
        url: 'https://pages.nist.gov/SCATMECH/docs/rayscat.htm',
      },
      {
        title: '人教版高中化学必修第一册，实验1-1，9页',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '304',
  },
  {
    slug: 'bio-food-tests',
    name: '食物中的三种证据',
    title: '变红、变橙、变紫：颜色能证明什么？',
    question: '变红、变橙、变紫：颜色能证明什么？',
    description: '从同样处理的样品与对照出发，追踪铜、染料和蛋白长链，分清三种显色的原因。',
    color: '#b39360',
    tag: '生物学',
    related: ['bio-enzyme-investigations', 'bio-protein-machines'],
    sources: [
      {
        title: 'National Institute of Education: Biology Practical Handbook, Practical 1',
        url: 'https://nie.lk/pdffiles/other/eALOM%20Biology%20Practical%20Handbook.pdf',
      },
      {
        title: 'IUPAC–IUBMB — Reducing and non-reducing disaccharides',
        url: 'https://iupac.qmul.ac.uk/2carb/noGreek/36.html',
      },
      {
        title: 'Biological Stain Commission — Lipid staining and partition',
        url: 'https://biologicalstaincommission.org/glossary/',
      },
      {
        title: 'Kroneck et al. — Peptide nitrogen coordination of copper(II)',
        url: 'https://febs.onlinelibrary.wiley.com/doi/abs/10.1111/j.1432-1033.1980.tb04833.x',
      },
    ],
    number: '303',
  },
  {
    slug: 'bio-cell-microscopy',
    name: '显微镜中的细胞',
    title: '显微镜里，细胞和图像怎样变化？',
    question: '显微镜里，细胞和图像怎样变化？',
    description:
      '从细胞的边界追踪分裂，在同一标本上比较视野与图像放大，再用细胞壁作参照辨认内部运动。',
    color: '#719870',
    tag: '生物学',
    related: ['microscope', 'bio-membrane-evidence'],
    sources: [
      {
        title: 'Florida State University: microscopy field number and magnification',
        url: 'https://micro.magnet.fsu.edu/primer/faq.html',
      },
      {
        title: 'Nikon MicroscopyU: calibrated micrometry',
        url: 'https://www.microscopyu.com/microscopy-basics/linear-measurements-micrometry',
      },
      {
        title: 'Nikon MicroscopyU — Field of view',
        url: 'https://www.microscopyu.com/microscopy-basics/field-of-view',
      },
      {
        title: 'Nikon MicroscopyU — Resolution',
        url: 'https://www.microscopyu.com/microscopy-basics/resolution',
      },
      {
        title: 'Robert Hooke — Micrographia, Observation XVIII',
        url: 'https://ocw.mit.edu/courses/sts-003-the-rise-of-modern-science-fall-2010/aace2313aa705710ac016d583ef50dce_MITSTS_003F10_read14_hooke.pdf',
      },
    ],
    number: '302',
  },
  {
    slug: 'singing-basin',
    name: '摩擦铜盆的振动与水花',
    title: '慢慢摩擦盆耳，为什么会出现水花？',
    question: '慢慢摩擦盆耳，为什么会出现水花？',
    description: '从摩擦供能到振幅增长，比较四处与六处水花对应的盆水耦合模态。',
    color: '#b5a16e',
    tag: '手很慢，盆却振得很快',
    related: ['resonance', 'mechanical-wave-lab'],
    sources: [
      {
        title:
          'Liu et al. (1995) — Self-excited vibration of the shell-liquid coupled system induced by dry friction',
        url: 'https://pubs-en.cstam.org.cn/article/id/ams_128837',
      },
      {
        title:
          'Acta Mechanica Sinica (1998) — Self-excited vibration caused by dry friction between two elastic structures',
        url: 'https://pubs-en.cstam.org.cn/article/id/ams_128878',
      },
      {
        title:
          'Wang (2005) — Modern Scientific Information Hidden in Ancient Chinese Science and Technology, Section 3',
        url: 'https://journals.ub.ovgu.de/index.php/techmech/article/download/890/866/2444',
      },
    ],
    number: '301',
  },
  {
    slug: 'pendulum-measurement-lab',
    name: '单摆的记录与测量',
    title: '怎样从摆动的记录中测出长度、周期和重力？',
    question: '怎样从摆动的记录中测出长度、周期和重力？',
    description: '把滴墨记录、累计计时、误差检验和倾斜杆线摆连接成完整测量路径。',
    color: '#c1ccaf',
    tag: '单摆 · 计时 · 等效重力',
    related: ['pendulum', 'spring-oscillation-lab'],
    sources: [
      {
        title: 'OpenStax — Pendulums',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/15-4-pendulums',
      },
    ],
    number: '300',
  },
  {
    slug: 'forced-oscillation-lab',
    name: '电机驱动与共振摆',
    title: '为什么不同的振子会跟随同一个频率？',
    question: '为什么不同的振子会跟随同一个频率？',
    description: '用实际电机滑槽和公共横梁，区分受迫稳态、共振响应与有限能量交换。',
    color: '#c0caae',
    tag: '受迫振动 · 共振 · 耦合',
    related: ['resonance', 'spring-oscillation-lab'],
    sources: [
      {
        title: 'OpenStax — Forced Oscillations',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/15-6-forced-oscillations',
      },
    ],
    number: '299',
  },
  {
    slug: 'recoil-lab',
    name: '气球与喷水容器的反冲',
    title: '喷出去的东西，怎样改变自身运动？',
    question: '喷出去的东西，怎样改变自身运动？',
    description: '从自由气球喷气到悬挂圆锥容器喷水，分别追踪平动动量和绕轴角动量。',
    color: '#c3d0b0',
    tag: '喷气反冲 · 角动量流 · 排水',
    related: ['force-pairs-lab', 'centripetal-force-lab'],
    sources: [
      {
        title: 'OpenStax — Rocket Propulsion',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/9-7-rocket-propulsion',
      },
      {
        title: 'MIT — Rotating lawn sprinkler control-volume problem',
        url: 'https://ocw.mit.edu/ans7870/2/2.25/assignments/sec5/5-26/index.html',
      },
    ],
    number: '298',
  },
  {
    slug: 'floating-oscillator',
    name: '浮筷的上下振动',
    title: '一根浮在水中的木筷，为什么会来回振动？',
    question: '一根浮在水中的木筷，为什么会来回振动？',
    description: '从浸入长度计算浮力，比较小振动、阻力衰减与完全浸没的边界。',
    color: '#b7cdbd',
    tag: '浮力 · 回复力 · 振动',
    related: ['buoyancy', 'spring-oscillation-lab'],
    sources: [
      {
        title: 'OpenStax — Archimedes’ Principle and Buoyancy',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/14-4-archimedes-principle-and-buoyancy',
      },
    ],
    number: '297',
  },
  {
    slug: 'doppler-lab',
    name: '旋转蜂鸣器与行进队列',
    title: '声源没改音调，听到的频率为什么会变？',
    question: '声源没改音调，听到的频率为什么会变？',
    description:
      '用竹竿端蜂鸣器的旋转与路旁观察者的行走，分别追踪声源运动和接收者运动改变波峰到达频率的过程。',
    color: '#a6b58f',
    tag: '每次到达都来自一次发出',
    related: ['doppler', 'wave-interference'],
    sources: [
      {
        title: 'OpenStax — The Doppler Effect',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/17-7-the-doppler-effect',
      },
    ],
    number: '296',
  },
  {
    slug: 'spring-oscillation-lab',
    name: '弹簧振动的记录与测量',
    title: '怎样把来回运动变成可比较的实验记录？',
    question: '怎样把来回运动变成可比较的实验记录？',
    description: '从频闪与录像到拖纸、计时和变量控制，让每一种记录对应真实装置。',
    color: '#bbc8aa',
    tag: '记录 · 周期 · 相位',
    related: ['pendulum', 'resonance'],
    sources: [
      {
        title: 'OpenStax — Simple Harmonic Motion',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/15-1-simple-harmonic-motion',
      },
    ],
    number: '295',
  },
  {
    slug: 'ramp-collision-lab',
    name: '斜槽小球碰撞实验',
    title: '不直接测速度，怎样检验动量守恒？',
    question: '不直接测速度，怎样检验动量守恒？',
    description: '同直径、不同质量的两球在水平斜槽末端碰撞，用铅垂原点和三组落点比较质量加权射程。',
    color: '#c3c5a1',
    tag: '正碰 · 平抛测量 · 动量守恒',
    related: ['projectile-motion-lab', 'elastic-collision'],
    sources: [
      {
        title: 'OpenStax — Types of Collisions',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/9-4-types-of-collisions',
      },
      {
        title: 'OpenStax — Projectile Motion',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/4-3-projectile-motion',
      },
    ],
    number: '294',
  },
  {
    slug: 'momentum-collision-lab',
    name: '碰撞中的不变量',
    title: '碰撞前后，究竟什么量保持不变？',
    question: '碰撞前后，究竟什么量保持不变？',
    description:
      '从不同质量悬球到粘连小车和气垫导轨，用真实教材数据与可追踪测速分别检验动量和动能。',
    color: '#bdc9ae',
    tag: '碰撞 · 动量 · 测量',
    related: ['elastic-collision', 'pendulum'],
    sources: [
      {
        title: 'OpenStax — Types of Collisions',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/9-4-types-of-collisions',
      },
    ],
    number: '293',
  },
  {
    slug: 'sound-interference-lab',
    name: '双扬声器的声音干涉',
    title: '多开一个扬声器，为什么有些地方反而更安静？',
    question: '多开一个扬声器，为什么有些地方反而更安静？',
    description: '追踪两条传播路径，在同一个点把声压逐时相加，再预测固定弱点遇到新频率会怎样。',
    color: '#a3b38c',
    tag: '路程差改变叠加结果',
    related: ['wave-interference', 'noise'],
    sources: [
      {
        title: 'University Physics Vol. 1 — 16.5 Interference of Waves',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/16-5-interference-of-waves',
      },
      {
        title: 'Brüel & Kjær — Sound Intensity (BR0476), pp.3–9',
        url: 'https://www.bksv.com/doc/br0476.pdf',
      },
    ],
    number: '292',
  },
  {
    slug: 'sound-measurement-lab',
    name: '声音的频率与传播测量',
    title: '从一段波形到一湖钟声，怎样测量声音？',
    question: '从一段波形到一湖钟声，怎样测量声音？',
    description:
      '按相同时间窗比较do与sol的频率，主动采集自己的声音，再用闪光和水下钟声复现教材测速。',
    color: '#92a286',
    tag: '把次数和时间真正对齐',
    related: ['mechanical-wave-lab', 'ultrasound'],
    sources: [
      {
        title: 'Geneva Science History Museum — Jean-Daniel Colladon',
        url: 'https://institutions.ville-geneve.ch/fileadmin/user_upload/mhn/documents/Musee_histoire_des_sciences/8_Colladon_Angl_2.pdf',
      },
      {
        title: 'MDN — Time-domain audio samples',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getFloatTimeDomainData',
      },
      {
        title: 'OpenStax — Sound waves',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/17-1-sound-waves',
      },
    ],
    number: '291',
  },
  {
    slug: 'arm-motion-lab',
    name: '甩手与投掷的运动研究',
    title: '指尖为什么能获得很大的速度？',
    question: '指尖为什么能获得很大的速度？',
    description: '从视频比例标定、关节速度合成到手机交叉测量，保留教材原始估算与标枪研究提案。',
    color: '#c4c5a5',
    tag: '关节运动 · 视频测量 · 速度合成',
    related: ['wax-motion-composition', 'phone-accelerometer-lab', 'centripetal-force-lab'],
    sources: [
      {
        title: 'OpenStax — Relative Motion in One and Two Dimensions',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/4-5-relative-motion-in-one-and-two-dimensions',
      },
      {
        title: 'Android Developers — Motion sensors',
        url: 'https://developer.android.com/develop/sensors-and-location/sensors/sensors_motion',
      },
    ],
    number: '290',
  },
  {
    slug: 'impulse-contact-lab',
    name: '接住与停下的力',
    title: '同样停下来，为什么感觉到的力不同？',
    question: '同样停下来，为什么感觉到的力不同？',
    description: '比较充气与放气气球，再分开车辆和理想乘员的停止过程。',
    color: '#aebfa8',
    tag: '动量与冲量',
    related: ['elastic-collision', 'force-pairs-lab'],
    sources: [
      {
        title: 'OpenStax — Impulse and collisions',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/9-2-impulse-and-collisions',
      },
      {
        title: 'NHTSA — Vehicle safety ratings and testing',
        url: 'https://www.nhtsa.gov/ratings',
      },
    ],
    number: '289',
  },
  {
    slug: 'ripple-tank-lab',
    name: '水波槽中的传播与叠加',
    title: '同一片水面，为什么会出现不同的波纹？',
    question: '同一片水面，为什么会出现不同的波纹？',
    description: '从漂浮纸屑到反射、折射、衍射、双源干涉与移动波源，逐一更换真实器材观察水波。',
    color: '#91aa8a',
    tag: '让每道波纹都有来处',
    related: ['surface-waves', 'wave-interference', 'doppler'],
    sources: [
      {
        title: 'MIT — Wave propagation lecture notes',
        url: 'https://ocw.mit.edu/courses/2-062j-wave-propagation-spring-2017/pages/lecture-notes/',
      },
      {
        title: 'OpenStax — Huygens principle and diffraction',
        url: 'https://openstax.org/books/college-physics-2e/pages/27-2-huygenss-principle-diffraction',
      },
      {
        title: 'OpenStax — Interference of waves',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/16-5-interference-of-waves',
      },
    ],
    number: '288',
  },
  {
    slug: 'mechanical-energy-lab',
    name: '验证机械能守恒',
    title: '减少的重力势能，都变成动能了吗？',
    question: '减少的重力势能，都变成动能了吗？',
    description: '从纸带、光电门与气垫导轨出发，独立测量高度和速度，并正确选择研究系统。',
    color: '#b9c9aa',
    tag: '位置测量 · 能量比较 · 误差',
    related: ['ticker-tape-lab', 'newton-second-law-lab', 'pendulum'],
    sources: [
      {
        title: 'Vernier — Photogate User Manual',
        url: 'https://www.vernier.com/manuals/vpg-btd',
      },
      {
        title: 'OpenStax — Conservation of Energy',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/8-3-conservation-of-energy',
      },
    ],
    number: '287',
  },
  {
    slug: 'ellipse-string-lab',
    name: '细绳绘制椭圆',
    title: '为什么拉紧一根绳，就能画出椭圆？',
    question: '为什么拉紧一根绳，就能画出椭圆？',
    description: '两枚图钉、一根不可伸长的细绳和一支铅笔，观察距离和不变与焦点靠近时的形状变化。',
    color: '#c7bea1',
    tag: '几何约束 · 焦点 · 恒定绳长',
    related: ['kepler-orbits', 'orbital-transfer'],
    sources: [
      {
        title: 'OpenStax — The Ellipse',
        url: 'https://openstax.org/books/precalculus-2e/pages/10-1-the-ellipse',
      },
    ],
    number: '286',
  },
  {
    slug: 'centripetal-force-lab',
    name: '向心力实验',
    title: '是什么力让物体不断转弯？',
    question: '是什么力让物体不断转弯？',
    description: '剪绳、旋转沙袋、双球向心力演示器与玻璃漏斗，从不同装置辨认向心合力并控制变量。',
    color: '#b9c8a7',
    tag: '向心合力 · 控制变量 · 测力',
    related: ['bicycle-circular-motion', 'force-pairs-lab'],
    sources: [
      {
        title: 'OpenStax — Uniform and Nonuniform Circular Motion',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/4-4-uniform-and-nonuniform-circular-motion',
      },
      {
        title: 'OpenStax — Solving Problems with Newton’s Laws',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/6-1-solving-problems-with-newtons-laws',
      },
    ],
    number: '285',
  },
  {
    slug: 'phone-energy-research',
    name: '手机耗电因素研究',
    title: '耗电不同，怎样判断是哪一个因素造成的？',
    question: '耗电不同，怎样判断是哪一个因素造成的？',
    description: '用同一模型手机设计亮度、音量、任务与网络的对照，记录合成数据并识别混杂因素。',
    color: '#bdc9ae',
    tag: '研究设计 · 功率 · 能量',
    related: ['battery-emf-lab', 'thermal-process-lab'],
    sources: [
      {
        title: 'Android Open Source Project — Measure power values',
        url: 'https://source.android.com/docs/core/power/values',
      },
    ],
    number: '284',
  },
  {
    slug: 'electromagnetic-wave-receiver',
    name: '捕捉电磁波',
    title: '放电之后，远处为什么有了响应？',
    question: '放电之后，远处为什么有了响应？',
    description: '保留教材的平行铜管天线，追踪发射波包、传播延迟、距离变化与接收检波。',
    color: '#bdc9ae',
    tag: '电磁波 · 天线 · 接收',
    related: ['induction-conditions-lab', 'magnetic-field-survey'],
    sources: [
      {
        title: 'OpenStax — Plane Electromagnetic Waves',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/16-2-plane-electromagnetic-waves',
      },
      {
        title: 'OpenStax — Energy Carried by Electromagnetic Waves',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/16-3-energy-carried-by-electromagnetic-waves',
      },
      {
        title: 'Analog Devices — Square-law RF detection',
        url: 'https://www.analog.com/en/resources/technical-articles/max22058212detecting-high-peaktoaverage-ratio-signals.html',
      },
    ],
    number: '283',
  },
  {
    slug: 'thermal-process-lab',
    name: '电热、冷却与热辐射',
    title: '温度的变化，揭示了怎样的能量过程？',
    question: '温度的变化，揭示了怎样的能量过程？',
    description: '从电阻量热、热鸡蛋冷却到铁块发光，分别追踪电热、能量转移与辐射光谱。',
    color: '#c6c7ab',
    tag: '能量 · 温度 · 辐射',
    related: ['heat-radiation', 'battery-emf-lab'],
    sources: [
      {
        title: 'OpenStax — Electrical Energy and Power',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/9-5-electrical-energy-and-power',
      },
      {
        title: 'OpenStax — Calorimetry',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/1-4-heat-transfer-specific-heat-and-calorimetry',
      },
      {
        title: 'OpenStax — Blackbody Radiation',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/6-1-blackbody-radiation',
      },
    ],
    number: '282',
  },
  {
    slug: 'mechanical-wave-lab',
    name: '绳波、人浪与弹簧波',
    title: '波向前传播时，介质去了哪里？',
    question: '波向前传播时，介质去了哪里？',
    description: '跟踪绳上的红色标记、原地起蹲的学生和往复移动的弹簧圈，比较横波与纵波的状态传播。',
    color: '#9dab7d',
    tag: '运动状态向前，介质局部往复',
    related: ['wave-interference', 'seismic-waves', 'sound-measurement-lab'],
    sources: [
      {
        title: 'OpenStax — Travelling waves',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/16-1-traveling-waves',
      },
      {
        title: 'OpenStax — Mathematics of waves',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/16-2-mathematics-of-waves',
      },
    ],
    number: '281',
  },
  {
    slug: 'polarization-evidence-lab',
    name: '从绳的方向到光的偏振',
    title: '转动一道狭缝，能筛选什么？',
    question: '转动一道狭缝，能筛选什么？',
    description: '比较绳与弹簧，再观察窗中自然光、玻璃、桌面和液晶屏。',
    color: '#aebfa8',
    tag: '波动光学',
    related: ['polarization', 'wave-interference'],
    sources: [
      {
        title: 'OpenStax — Polarization',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/1-7-polarization',
      },
      {
        title: 'TU Delft — Polarisation',
        url: 'https://interactivetextbooks.tudelft.nl/tn2421/content/Chap4_Polarisation/Polarization_2022_01Clean.html',
      },
    ],
    number: '280',
  },
  {
    slug: 'optical-diffraction-lab',
    name: '从狭缝到阴影中的亮点',
    title: '缝变窄，光为什么反而铺得更开？',
    question: '缝变窄，光为什么反而铺得更开？',
    description: '把可调狭缝、圆孔、铅笔、卡尺与泊松亮斑放回各自装置。',
    color: '#aebfa8',
    tag: '波动光学',
    related: ['diffraction', 'double-slit', 'matter-wave-lab'],
    sources: [
      {
        title: 'Richard Fitzpatrick, University of Texas — Diffraction from a circular disk',
        url: 'https://farside.ph.utexas.edu/teaching/315/Waves/node106.html',
      },
      {
        title: 'Richard Fitzpatrick, University of Texas — Circular aperture diffraction',
        url: 'https://farside.ph.utexas.edu/teaching/315/Waves/node105.html',
      },
      {
        title: 'OpenStax — Single-slit diffraction',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/4-1-single-slit-diffraction',
      },
    ],
    number: '279',
  },
  {
    slug: 'double-slit-measurement-lab',
    name: '把干涉条纹变成测量',
    title: '如何从几个亮纹读出光的波长？',
    question: '如何从几个亮纹读出光的波长？',
    description: '在光具座记录多条亮纹，用固定线阵读取强度，再比较洛埃镜。',
    color: '#aebfa8',
    tag: '波动光学',
    related: ['double-slit', 'thin-film-interference'],
    sources: [
      {
        title: 'OpenStax — Young’s double slit',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/3-1-youngs-double-slit-experiment',
      },
      {
        title: 'TU Delft — Interference and coherence',
        url: 'https://interactivetextbooks.tudelft.nl/tn2421/content/Chap5_Interference/InterferenceCoherence_2022_01Clean.html',
      },
    ],
    number: '278',
  },
  {
    slug: 'thin-film-lab',
    name: '膜厚写出的明暗',
    title: '肥皂膜与劈尖的条纹为什么移动？',
    question: '肥皂膜与劈尖的条纹为什么移动？',
    description: '保留黄光灯、肥皂膜和纸片劈尖，计算反射相位与条纹。',
    color: '#aebfa8',
    tag: '波动光学',
    related: ['thin-film-interference', 'double-slit'],
    sources: [
      {
        title: 'OpenStax — Interference in thin films',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/3-4-interference-in-thin-films',
      },
    ],
    number: '277',
  },
  {
    slug: 'induction-conditions-lab',
    name: '感应电流的产生条件',
    title: '有磁场，为什么还没有电流？',
    question: '有磁场，为什么还没有电流？',
    description: '用闭合滑杆与内外线圈逐项比较：静止、沿场运动、切割、开关、变阻器和插拔。',
    color: '#b7c7ad',
    tag: '磁通量 · 感应 · 对照',
    related: ['magnetic-field-survey', 'magnetic-force-lab', 'electromagnetic-wave-receiver'],
    sources: [
      {
        title: 'OpenStax — Faraday’s Law',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/13-1-faradays-law',
      },
      {
        title: 'OpenStax — Motional Emf',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/13-3-motional-emf',
      },
      {
        title: 'OpenStax — Mutual Inductance',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/14-1-mutual-inductance',
      },
    ],
    number: '276',
  },
  {
    slug: 'total-reflection-lab',
    name: '沿界面追踪全反射',
    title: '光为什么能沿弯棒和水流前进？',
    question: '光为什么能沿弯棒和水流前进？',
    description: '从半圆玻璃块到弯棒、水流与软木塞，逐次计算反射和漏光。',
    color: '#aebfa8',
    tag: '几何光学',
    related: ['total-internal-reflection', 'geometric-optics-lab'],
    sources: [
      {
        title: 'OpenStax — Total internal reflection',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/1-4-total-internal-reflection',
      },
      {
        title: 'OpenStax — Bernoulli equation',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/14-6-bernoullis-equation',
      },
    ],
    number: '275',
  },
  {
    slug: 'gas-efficiency-lab',
    name: '燃气加热的效率研究',
    title: '大火、中火与高温出水，怎样公平比较效率？',
    question: '大火、中火与高温出水，怎样公平比较效率？',
    description: '重读教材的真实耗气和冷却记录，再用等水量、温升与实测耗气量设计热水器效率实验。',
    color: '#b5a273',
    tag: '先量清楚，再谈省气',
    related: ['thermal-measurement-lab', 'thermodynamic-work-lab'],
    sources: [
      {
        title: 'OpenStax — Heat transfer, specific heat and calorimetry',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/1-4-heat-transfer-specific-heat-and-calorimetry',
      },
    ],
    number: '274',
  },
  {
    slug: 'bicycle-circular-motion',
    name: '自行车上的圆周运动',
    title: '大齿轮和小齿轮，到底哪个更快？',
    question: '大齿轮和小齿轮，到底哪个更快？',
    description:
      '用架起后轮的自行车比较链传动的共同线速度、不同角速度，以及同轴车轮不同半径处的速度。',
    color: '#bccaa8',
    tag: '链传动 · 线速度 · 角速度',
    related: ['bicycle', 'curved-motion-lab'],
    sources: [
      {
        title: 'OpenStax — Rotational Variables',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/10-1-rotational-variables',
      },
      {
        title: 'Renold — Chain Designer Guide: Polygonal Effect',
        url: 'https://www.renold.com/media/165418/transmission-i-and-m-ren12-eng-10-10.pdf',
      },
    ],
    number: '273',
  },
  {
    slug: 'wire-force-factors-lab',
    name: '通电导线受力因素',
    title: '导线更长，受力一定更大吗？',
    question: '导线更长，受力一定更大吗？',
    description: '切换四个接点，比较电流、有效浸场长度和磁感应强度怎样决定悬线偏转。',
    color: '#b7c7ad',
    tag: '磁力 · 有效长度 · 控制变量',
    related: ['magnetic-force-lab', 'magnetic-field-survey'],
    sources: [
      {
        title: 'OpenStax — Magnetic Force on a Current-Carrying Conductor',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/11-4-magnetic-force-on-a-current-carrying-conductor',
      },
    ],
    number: '272',
  },
  {
    slug: 'diffusion-microstates-lab',
    name: '扩散与微观状态',
    title: '混匀的颜料为什么不会自行聚回一滴？',
    question: '混匀的颜料为什么不会自行聚回一滴？',
    description: '从水中颜料的持续随机运动，到四个气体粒子的16种分布，区分微观运动与宏观不可逆性。',
    color: '#ac8d7d',
    tag: '均匀状态拥有更多可能',
    related: ['diffusion', 'statistical-motion-lab'],
    sources: [
      {
        title: 'OpenStax — Molecular transport and diffusion',
        url: 'https://openstax.org/books/college-physics-2e/pages/12-7-molecular-transport-phenomena-diffusion-osmosis-and-related-processes',
      },
      {
        title: 'OpenStax — Entropy on a microscopic scale',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/4-7-entropy-on-a-microscopic-scale',
      },
    ],
    number: '271',
  },
  {
    slug: 'projectile-motion-lab',
    name: '平抛：同一时钟，两个方向',
    title: '水平抛得更快，会更晚落地吗？',
    question: '水平抛得更快，会更晚落地吗？',
    description: '跟住同一时钟下的钢球，从等时位置与速度分量解释平抛，再预测新高度的落点。',
    color: '#b9c8aa',
    tag: '平抛 · 描迹 · 测量',
    related: ['wax-motion-composition', 'motion-sensor-lab', 'ramp-collision-lab'],
    sources: [
      {
        title: 'OpenStax — Projectile Motion',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/4-3-projectile-motion',
      },
      {
        title: 'Vernier — How does a Motion Detector work?',
        url: 'https://www.vernier.com/til/2961',
      },
      {
        title: 'MIT OCW 8.01SC, Projectile Motion transcript',
        url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/8733a0224555eed5677ba9fa7fe4f06e_83NmtaE7fEk.pdf',
      },
      {
        title: 'Physics with Vernier, Computer8B Projectile Motion',
        url: 'https://www.vernier.com/files/training/nsta-2017/physics_with_vernier.pdf',
      },
    ],
    number: '270',
  },
  {
    slug: 'drinking-bird-lab',
    name: '饮水鸭的热机循环',
    title: '饮水鸭为何会不断点头？',
    question: '饮水鸭为何会不断点头？',
    description: '追踪湿头蒸发、压强差、液柱上升与倾倒排液，解释一个由环境热量驱动的小热机。',
    color: '#92aa95',
    tag: '湿头降温，液体搬家',
    related: ['thermal-measurement-lab', 'thermodynamic-work-lab'],
    sources: [
      {
        title: 'Exploratorium — The Dipping Bird',
        url: 'https://annex.exploratorium.edu/wsw/progress_snacks/dippingbird/',
      },
      {
        title: 'University of Colorado — Drinking Bird',
        url: 'https://www.colorado.edu/lab/lecture-demo-manual/g440-evaporation-and-expansion-drinking-bird',
      },
    ],
    number: '269',
  },
  {
    slug: 'geometric-optics-lab',
    name: '从光路重建折射与像',
    title: '看到的针、筷子和文字，在哪里？',
    question: '看到的针、筷子和文字，在哪里？',
    description: '用插针测量折射率，追踪圆柱水杯与厚玻璃板的成像。',
    color: '#aebfa8',
    tag: '几何光学',
    related: ['refraction', 'total-internal-reflection'],
    sources: [
      {
        title: 'OpenStax — Images formed by refraction',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/2-3-images-formed-by-refraction',
      },
      {
        title: 'OpenStax — Snell refraction',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/1-3-refraction',
      },
      {
        title: 'The Physics Classroom — Refraction and sight through a glass',
        url: 'https://www.physicsclassroom.com/mmedia/optics/bp.cfm',
      },
    ],
    number: '268',
  },
  {
    slug: 'magnetic-field-survey',
    name: '电流与磁场分布',
    title: '看不见的磁场，怎样让它的方向显现？',
    question: '看不见的磁场，怎样让它的方向显现？',
    description: '从奥斯特磁针到铁屑分布，比较条形、蹄形磁体与直线、环形、螺线管电流的磁场。',
    color: '#b7c7ad',
    tag: '磁场 · 电流 · 探测',
    related: ['magnetic-force-lab', 'electrostatic-applications-lab'],
    sources: [
      {
        title: 'OpenStax — Magnetic Field Due to a Thin Straight Wire',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/12-2-magnetic-field-due-to-a-thin-straight-wire',
      },
      {
        title: 'OpenStax — Magnetic Field of a Current Loop',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/12-4-magnetic-field-of-a-current-loop',
      },
      {
        title: 'OpenStax — Solenoids and Toroids',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/12-6-solenoids-and-toroids',
      },
    ],
    number: '267',
  },
  {
    slug: 'wax-motion-composition',
    name: '蜡块运动的合成与分解',
    title: '蜡块向上，玻璃管向右，合起来往哪里走？',
    question: '蜡块向上，玻璃管向右，合起来往哪里走？',
    description:
      '密封水管中的红蜡块与横向移管使用同一个时钟，对比两个匀速分运动与横向加速时的轨迹。',
    color: '#c3ceb3',
    tag: '分运动 · 同时性 · 合成',
    related: ['curved-motion-lab', 'ticker-tape-lab', 'arm-motion-lab'],
    sources: [
      {
        title: 'OpenStax — Displacement and Velocity Vectors',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/4-1-displacement-and-velocity-vectors',
      },
    ],
    number: '266',
  },
  {
    slug: 'thermodynamic-work-lab',
    name: '功、热与内能实验',
    title: '做功为什么能升温，膨胀又为什么会降温？',
    question: '做功为什么能升温，膨胀又为什么会降温？',
    description: '追踪压缩引火、焦耳机械和电热量热、瓶中起雾与伦福德镗孔中的能量转化。',
    color: '#899b70',
    tag: '同一能量，不同路径',
    related: ['thermal-measurement-lab', 'ideal-gas'],
    sources: [
      {
        title: 'OpenStax — Adiabatic processes for an ideal gas',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/3-6-adiabatic-processes-for-an-ideal-gas',
      },
      {
        title: 'OpenStax — Calorimetry and Joule’s experiment',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/1-4-heat-transfer-specific-heat-and-calorimetry',
      },
      {
        title: 'Royal Society — Rumford and the original 1798 paper',
        url: 'https://royalsociety.org/blog/2015/03/rumford-the-colourful-count/',
      },
    ],
    number: '265',
  },
  {
    slug: 'curved-motion-lab',
    name: '曲线运动的速度方向',
    title: '离开弯道的一瞬间，物体会朝哪里走？',
    question: '离开弯道的一瞬间，物体会朝哪里走？',
    description:
      '弧形轨道的红色印迹、磁铁改变的钢球轨迹与带尾翼飞镖，分别展示切线方向和转弯的条件。',
    color: '#bdcbb0',
    tag: '切线 · 合力 · 轨迹',
    related: ['galileo-inclines', 'newton-second-law-lab'],
    sources: [
      {
        title: 'OpenStax — Motion in Two and Three Dimensions',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/4-summary',
      },
      {
        title: 'MIT — Magnetization force densities',
        url: 'https://web.mit.edu/6.013_book/www/chapter9/9.8.html',
      },
    ],
    number: '264',
  },
  {
    slug: 'cosmology-observations',
    name: '星系红移与微波天空',
    title: '怎样从光读出膨胀的宇宙？',
    question: '怎样从光读出膨胀的宇宙？',
    description: '追踪同一组谱线与波峰，用固定星系记录和微波频谱检验宇宙膨胀与冷却。',
    color: '#94a9b5',
    tag: '宇宙观测',
    related: ['atomic-spectrum-lab', 'celestial-observations'],
    sources: [
      {
        title: 'NASA — Cosmological redshift',
        url: 'https://science.nasa.gov/mission/hubble/science/science-behind-the-discoveries/hubble-cosmological-redshift/',
      },
      {
        title: 'NASA — Hubble’s original relation',
        url: 'https://imagine.gsfc.nasa.gov/features/yba/M31_velocity/hubble_law/hubble_meaning.html',
      },
      {
        title: 'ESA — Planck and the cosmic microwave background',
        url: 'https://www.esa.int/Science_Exploration/Space_Science/Planck/Planck_and_the_cosmic_microwave_background',
      },
      {
        title: 'Penzias — Commentary on the original antenna-temperature measurement',
        url: 'https://garfield.library.upenn.edu/classics1981/A1981LL57400001.pdf',
      },
      {
        title: 'A relation between distance and radial velocity among extra-galactic nebulae',
        url: 'https://doi.org/10.1073/pnas.15.3.168',
      },
      {
        title: 'A Measurement of Excess Antenna Temperature at 4080 Mc/s',
        url: 'https://doi.org/10.1086/148307',
      },
      {
        title: 'Cosmic Black-Body Radiation',
        url: 'https://doi.org/10.1086/148306',
      },
      {
        title: 'The Cosmic Microwave Background Spectrum from the Full COBE FIRAS Data Set',
        url: 'https://arxiv.org/abs/astro-ph/9605054',
      },
      {
        title: 'COBE/FIRAS CMB monopole spectrum v1',
        url: 'https://lambda.gsfc.nasa.gov/data/cobe/firas/monopole_spec/firas_monopole_spec_v1.txt',
      },
      {
        title: 'What Is Cosmological Redshift?',
        url: 'https://science.nasa.gov/asset/webb/what-is-cosmological-redshift/',
      },
      {
        title: 'Strong Lines of Hydrogen (H)',
        url: 'https://physics.nist.gov/PhysRefData/Handbook/Tables/hydrogentable2.htm',
      },
    ],
    number: '263',
  },
  {
    slug: 'electrostatic-applications-lab',
    name: '静电应用实验',
    title: '同样的电荷，怎样既屏蔽干扰又收集烟尘？',
    question: '同样的电荷，怎样既屏蔽干扰又收集烟尘？',
    description: '先比较金属网罩与绝缘网，再追踪烟粒荷电、迁移和沉积，看到两种不同的静电应用。',
    color: '#b9cbb4',
    tag: '静电 · 屏蔽 · 除尘',
    related: ['electrostatic-induction', 'electric-field-mapping'],
    sources: [
      {
        title: 'OpenStax — Conductors in Electrostatic Equilibrium',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/6-4-conductors-in-electrostatic-equilibrium',
      },
      {
        title: 'US EPA — Electrostatic Precipitators',
        url: 'https://www.epa.gov/air-emissions-monitoring-knowledge-base/monitoring-control-technique-electrostatic-precipitators',
      },
      {
        title: 'US EPA — Electrostatic Precipitator Training Manual',
        url: 'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P1000G9Q.TXT',
      },
    ],
    number: '262',
  },
  {
    slug: 'gravitational-wave-lab',
    name: '引力波证据的三条路径',
    title: '极微小的变化，怎样变成可信的读数？',
    question: '极微小的变化，怎样变成可信的读数？',
    description: '从共振响应、脉冲星计时走到回程相位与光学读出，对照真实观测记录。',
    color: '#94a9b5',
    tag: '引力波',
    related: ['gravity-measurements', 'relativity-experiments'],
    sources: [
      {
        title: 'LIGO — Review of gravitational-wave detectors and Weber claims',
        url: 'https://labcit.ligo.caltech.edu/~ajw/gwaves_review.pdf',
      },
      { title: 'LIGO — Binary-pulsar evidence', url: 'https://www.ligo.caltech.edu/LA/page/faq' },
      {
        title: 'LIGO and Virgo — First binary-black-hole observation',
        url: 'https://arxiv.org/abs/1602.03837',
      },
      {
        title: 'Nobel Prize — Hulse and Taylor',
        url: 'https://www.nobelprize.org/prizes/physics/1993/summary/',
      },
      {
        title:
          'J. Weber, Evidence for Discovery of Gravitational Radiation, Physical Review Letters 22, 1320 (1969)',
        url: 'https://doi.org/10.1103/PhysRevLett.22.1320',
      },
      {
        title:
          'J. L. Levine and R. L. Garwin, New negative result for gravitational wave detection, and comparison with reported detection (1974)',
        url: 'https://research.ibm.com/publications/new-negative-result-for-gravitational-wave-detection-and-comparison-with-reported-detection',
      },
      {
        title:
          'P. C. Peters and J. Mathews, Gravitational Radiation from Point Masses in a Keplerian Orbit, Physical Review 131, 435 (1963)',
        url: 'https://doi.org/10.1103/PhysRev.131.435',
      },
      {
        title:
          'J. M. Weisberg and Y. Huang, Relativistic Measurements from Timing the Binary Pulsar PSR B1913+16, ApJ 829, 55 (2016)',
        url: 'https://arxiv.org/abs/1606.02744',
      },
      {
        title: 'J. Aasi et al., Advanced LIGO, Classical and Quantum Gravity 32, 074001 (2015)',
        url: 'https://arxiv.org/abs/1411.4547',
      },
      {
        title: 'LIGO-G1600204-v6, Data for Fig. 1 of the GW150914 discovery paper',
        url: 'https://dcc.ligo.org/LIGO-G1600204-v6/public',
      },
      {
        title:
          'B. P. Abbott et al., Calibration of the Advanced LIGO detectors for the discovery of GW150914',
        url: 'https://arxiv.org/abs/1602.03845',
      },
    ],
    number: '261',
  },
  {
    slug: 'balloon-drag-lab',
    name: '气球空气阻力研究',
    title: '先测出数据，再决定阻力与速度是什么关系',
    question: '先测出数据，再决定阻力与速度是什么关系',
    description:
      '保留教材七组气球数据，从视频等间距帧判断终端运动，比较线性与平方拟合，并检查浮力与适用范围。',
    color: '#c9c299',
    tag: '视频 · 终端速度 · 拟合',
    related: ['newton-tube', 'stokes-drag'],
    sources: [
      {
        title: '人教版普通高中物理必修第一册（2019）课题研究，117—119页',
        url: 'https://jc.pep.com.cn/',
      },
      {
        title: 'NASA — Drag of a Sphere',
        url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/drag-of-a-sphere/',
      },
    ],
    number: '260',
  },
  {
    slug: 'magdeburg-bowls-lab',
    name: '钢碗中的马德堡实验',
    title: '两只冷却后的钢碗，为什么难以拉开？',
    question: '两只冷却后的钢碗，为什么难以拉开？',
    description: '由密封气体的等容冷却计算内外压强差，比较钢碗的吸合力与两侧拉力。',
    color: '#8e9d77',
    tag: '外面的空气在压紧',
    related: ['ideal-gas', 'thermal-measurement-lab'],
    sources: [
      {
        title: 'OpenStax — Pressure',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/14-1-fluids-density-and-pressure',
      },
      {
        title: 'OpenStax — Ideal gas law',
        url: 'https://openstax.org/books/chemistry-2e/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law',
      },
    ],
    number: '259',
  },
  {
    slug: 'surface-tension-lab',
    name: '液体表面张力实验',
    title: '水面怎样托住针，又怎样拉动一根线？',
    question: '水面怎样托住针，又怎样拉动一根线？',
    description:
      '用满杯加针、肥皂膜棉线、浸润水滴和纸托缝衣针，追踪表面张力改变形状与支持物体的过程。',
    color: '#8d9f75',
    tag: '从界面形状读出力',
    related: ['capillary', 'molecular-measurement-lab'],
    sources: [
      {
        title: 'OpenStax — Surface tension and capillary action',
        url: 'https://openstax.org/books/college-physics-2e/pages/11-8-cohesion-and-adhesion-in-liquids-surface-tension-and-capillary-action',
      },
      {
        title: 'MIT 18.357 — Interfacial phenomena lectures',
        url: 'https://ocw.mit.edu/courses/18-357-interfacial-phenomena-fall-2010/04759cfc15c79928ca9f72a18b3864dd_MIT18_357F10_lec_all.pdf',
      },
    ],
    number: '258',
  },
  {
    slug: 'relativity-experiments',
    name: '光、事件与时钟',
    title: '同一次实验，为什么时间不同？',
    question: '同一次实验，为什么时间不同？',
    description: '从列车闪光、μ子存活和四台飞行钟，看参考系与固有时间怎样接受检验。',
    color: '#94a9b5',
    tag: '相对论',
    related: ['gravity-measurements', 'celestial-observations'],
    sources: [
      {
        title: 'OpenStax — Relativity of simultaneity',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/5-2-relativity-of-simultaneity',
      },
      {
        title: 'OpenStax — Time dilation and muons',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/5-3-time-dilation',
      },
      {
        title: 'NIST — Relativity and optical clocks',
        url: 'https://www.nist.gov/publications/relativity-and-optical-clocks',
      },
      {
        title: 'NIST — Time and reference frames on rotating Earth',
        url: 'https://tf.nist.gov/general/pdf/711.pdf',
      },
      {
        title: 'On the Relative Motion of the Earth and the Luminiferous Ether (1887)',
        url: 'https://history.aip.org/exhibits/gap/PDF/michelson.pdf',
      },
      {
        title: 'Einstein: On the Electrodynamics of Moving Bodies (1905), English translation',
        url: 'https://www.fourmilab.ch/etexts/einstein/specrel/www/',
      },
      {
        title:
          'Frisch and Smith: Measurement of the Relativistic Time Dilation Using μ-Mesons (1963)',
        url: 'https://doi.org/10.1119/1.1969508',
      },
      {
        title: 'Hafele and Keating: Predicted Relativistic Time Gains (1972)',
        url: 'https://doi.org/10.1126/science.177.4044.166',
      },
      {
        title: 'Hafele and Keating: Observed Relativistic Time Gains (1972)',
        url: 'https://doi.org/10.1126/science.177.4044.168',
      },
      {
        title: 'Particle Data Group: Muon listing (2025)',
        url: 'https://pdg.lbl.gov/2025/listings/rpp2025-list-muon.pdf',
      },
    ],
    number: '257',
  },
  {
    slug: 'motion-sensor-lab',
    name: '传感器测位置与速度',
    title: '传感器如何把一次声波变成速度？',
    question: '传感器如何把一次声波变成速度？',
    description: '对照红外同步的单程超声与往返反射超声，从飞行时间得到位置，再从连续位置得到速度。',
    color: '#bac7a8',
    tag: '超声 · 计时 · 测速',
    related: ['ticker-tape-lab', 'ultrasound'],
    sources: [
      {
        title: 'Vernier — How does a Motion Detector work?',
        url: 'https://www.vernier.com/til/2961',
      },
      {
        title: 'Vernier — Motion Detector User Manual',
        url: 'https://www.vernier.com/manuals/md-btd/',
      },
    ],
    number: '256',
  },
  {
    slug: 'gravity-measurements',
    name: '苹果、月球和一束会移动的光',
    title: '看不见的引力，怎样被测出来？',
    question: '苹果会落地，月球为什么一直绕行？',
    description: '用月球运动检验地面引力，再从细丝扭转和真实光点记录反求引力常量。',
    color: '#94a9b5',
    tag: '万有引力',
    related: ['kepler-orbits', 'celestial-observations', 'gravitational-wave-lab'],
    sources: [
      {
        title: 'Moon Fact Sheet',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html',
      },
      {
        title: 'Earth Fact Sheet',
        url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html',
      },
      {
        title: 'Automation of the Cavendish Experiment to ‘Weigh the Earth’',
        url: 'https://arxiv.org/abs/1812.07644',
      },
      {
        title: 'Cavendish Gravitational Torsion Balance, Model AP-8215A, manual012-11032D',
        url: 'https://cdn.pasco.com/product_document/Cavendish-Torsion-Balance-Manual-AP-8215A.pdf',
      },
      {
        title: 'Experiments to Determine the Density of the Earth',
        url: 'https://archive.org/download/jstor-106988/106988.pdf',
      },
    ],
    number: '255',
  },
  {
    slug: 'franklin-electricity-evidence',
    name: '富兰克林的电学证据',
    title: '雷电与摩擦电，怎样建立实验上的联系？',
    question: '雷电与摩擦电，怎样建立实验上的联系？',
    description: '比较储存、带电指示与放电的共同表现，理解富兰克林历史研究中的证据逻辑。',
    color: '#bbcbb2',
    tag: '电学 · 历史 · 证据',
    related: ['electrostatic-induction', 'parallel-plate-capacitor-lab'],
    sources: [
      {
        title: 'The Papers of Benjamin Franklin — The Kite Experiment, 19 October 1752',
        url: 'https://franklinpapers.org/framedVolumes.jsp?vol=4&page=360a',
      },
      {
        title: 'Franklin’s 1752 statement — primary text reprint',
        url: 'https://ushistory.org/historic-personages/franklin/science/kite2',
      },
      {
        title: 'OpenStax — Capacitors and Capacitance',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/8-1-capacitors-and-capacitance',
      },
    ],
    number: '254',
  },
  {
    slug: 'celestial-observations',
    name: '从观测到天体预言',
    title: '一个偏离预测的星点，能告诉我们什么？',
    question: '一个偏离预测的星点，能告诉我们什么？',
    description: '固定记录、比较轨道与引力候选，再让未使用的记录和独立观测检验预言。',
    color: '#94a9b5',
    tag: '天文观测',
    related: ['kepler-orbits', 'telescope'],
    sources: [
      {
        title: 'NASA — Galileo discovers Jupiter’s moons',
        url: 'https://www.nasa.gov/history/410-years-ago-galileo-discovers-jupiters-moons/',
      },
      {
        title: 'JPL — Planetary discovery circumstances',
        url: 'https://ssd.jpl.nasa.gov/planets/discovery.html',
      },
      { title: 'NASA — 1P/Halley', url: 'https://science.nasa.gov/solar-system/comets/1p-halley/' },
      {
        title: 'NASA — Halley’s return and its history',
        url: 'https://www.nasa.gov/history/955-years-ago-halleys-comet-and-the-battle-of-hastings/',
      },
      {
        title:
          'Johannes Kepler, Astronomia nova (1609), Chapter XIX, printed113–114; ETH-Bibliothek Zürich Rar4482, public domain',
        url: 'https://doi.org/10.3931/e-rara-558',
      },
      {
        title:
          'J. F. Encke, letter Berlin26 September1846, Astronomische Nachrichten25 no580, columns49–52',
        url: 'https://articles.adsabs.harvard.edu/pdf/1846AN.....25...49E',
      },
    ],
    number: '253',
  },
  {
    slug: 'apparent-weight-lab',
    name: '超重与失重实验',
    title: '身体没变重，体重计为何忽高忽低？',
    question: '身体没变重，体重计为何忽高忽低？',
    description: '从蹲起和电梯中的支持力，走到自由下落水瓶的压差，分清加速度、重力与测量读数。',
    color: '#b7c5a6',
    tag: '支持力 · 加速度 · 压差',
    related: ['phone-accelerometer-lab', 'dynamic-mass-lab'],
    sources: [
      {
        title: 'OpenStax — Solving Problems with Newton’s Laws',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/6-1-solving-problems-with-newtons-laws',
      },
      {
        title: 'OpenStax — Bernoulli’s Equation',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/14-6-bernoullis-equation',
      },
    ],
    number: '252',
  },
  {
    slug: 'diamagnetic-levitation-lab',
    name: '水滴与青蛙的抗磁悬浮',
    title: '没有磁铁的水滴，为什么也能悬浮？',
    question: '没有磁铁的水滴，为什么也能悬浮？',
    description: '在强磁体的竖直孔中追踪水滴受力，区分磁场强度、空间梯度与稳定平衡。',
    color: '#8a9c70',
    tag: '强场还要有梯度',
    related: ['hall-effect', 'solid-structure-lab'],
    sources: [
      {
        title: 'Berry and Geim (1997) — Of flying frogs and levitrons',
        url: 'https://www.physics.umd.edu/grt/taj/411c/FlyingFrogs.pdf',
      },
    ],
    number: '251',
  },
  {
    slug: 'battery-emf-lab',
    name: '电源电动势与内阻实验',
    title: '电源有电，为什么接上负载电压就变了？',
    question: '电源有电，为什么接上负载电压就变了？',
    description: '从并联灯泡到干电池、水果电池和充电宝，沿不同测量电路追踪电源的输出变化。',
    color: '#b8c7a3',
    tag: '电源 · 电动势 · 内阻',
    related: ['resistivity-lab', 'multimeter-lab', 'phone-energy-research'],
    sources: [
      {
        title: 'OpenStax — Electromotive Force',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/10-1-electromotive-force',
      },
      {
        title:
          'Texas Instruments — Power-bank output current sensing and limiting reference design',
        url: 'https://www.ti.com/tool/PMP9776',
      },
    ],
    number: '250',
  },
  {
    slug: 'solid-structure-lab',
    name: '晶体结构与各向异性实验',
    title: '外形和导热方向，怎样透露固体的结构？',
    question: '外形和导热方向，怎样透露固体的结构？',
    description: '观察盐与松香、玻璃和云母上的石蜡熔化边界，并追踪胶带剥离石墨薄层。',
    color: '#87996d',
    tag: '从外形到原子层',
    related: ['thermal-expansion', 'thermal-measurement-lab'],
    sources: [
      {
        title: 'OpenStax — Lattice structures in crystalline solids',
        url: 'https://openstax.org/books/chemistry-2e/pages/10-6-lattice-structures-in-crystalline-solids',
      },
      {
        title: 'Nobel Prize 2010 — Pencil, paper and sticky tape',
        url: 'https://www.nobelprize.org/uploads/2018/06/popular-physicsprize2010.pdf',
      },
      {
        title: 'Stokes — On the conduction of heat in crystals',
        url: 'https://www.cambridge.org/core/books/abs/mathematical-and-physical-papers/on-the-conduction-of-heat-in-crystals/F4E775EEA87AE93B831348544302F9A7',
      },
    ],
    number: '249',
  },
  {
    slug: 'dynamic-mass-lab',
    name: '太空测质量',
    title: '失重时，怎样测出宇航员的质量？',
    question: '失重时，怎样测出宇航员的质量？',
    description: '用恒定拉力和光栅计时重建加速度，扣除随动平台的质量，理解失重仍有惯性。',
    color: '#b8c7ac',
    tag: '恒力 · 光栅 · 惯性',
    related: ['newton-second-law-lab', 'phone-accelerometer-lab'],
    sources: [
      {
        title: '中国载人航天 — 质量测量（2013太空授课）',
        url: 'https://en-conference2018.cmse.gov.cn/ztbd/xwzt/tksk/sysp/201306/t20130620_43137.html',
      },
      {
        title: 'NASA — Space Linear Acceleration Mass Measurement Device',
        url: 'https://www.nasa.gov/image-article/astronaut-shannon-walker-works-columbus-laboratory-module/',
      },
    ],
    number: '248',
  },
  {
    slug: 'thermal-measurement-lab',
    name: '热平衡与气体定律实验',
    title: '怎样把温度、压强和体积联系起来？',
    question: '怎样把温度、压强和体积联系起来？',
    description: '通过混合法量热、注射器等温实验和烧瓶水柱实验，控制条件并读取同一模型的测量结果。',
    color: '#85986d',
    tag: '控制条件，再读数据',
    related: ['ideal-gas', 'thermal-expansion', 'gas-efficiency-lab', 'drinking-bird-lab'],
    sources: [
      {
        title: 'OpenStax — Heat transfer, specific heat and calorimetry',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/1-4-heat-transfer-specific-heat-and-calorimetry',
      },
      {
        title: 'OpenStax — Ideal gas law',
        url: 'https://openstax.org/books/chemistry-2e/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law',
      },
    ],
    number: '247',
  },
  {
    slug: 'particle-evidence-lab',
    name: '粒子发现的证据链',
    title: '看不见的粒子，怎样留下可测的痕迹？',
    question: '看不见的粒子，怎样留下可测的痕迹？',
    description: '从轨迹弯曲、光子能量与核反冲出发，重建质量和动量，再让固定记录检验解释。',
    color: '#aebfa8',
    tag: '近代物理',
    related: ['nuclear-evidence-lab', 'cathode-ray-lab'],
    sources: [
      {
        title: 'CERN — How the Higgs boson was discovered',
        url: 'https://home.cern/science/physics/higgs-boson/how/',
      },
      {
        title: 'NIST — The reversal of parity law',
        url: 'https://www.nist.gov/pml/fall-parity/reversal-parity-law-nuclear-physics',
      },
      {
        title: 'Brookhaven — Discovery of the J particle',
        url: 'https://www.bnl.gov/bnlweb/history/nobel/1976.php',
      },
      {
        title: 'Nobel Prize — The two J/psi experiments',
        url: 'https://www.nobelprize.org/prizes/physics/1976/press-release/',
      },
      {
        title: '清华大学 — 王淦昌的实验工作',
        url: 'https://xsg.tsinghua.edu.cn/info/1004/2187.htm',
      },
      {
        title: '中国科学院高能所 — 泡室事例与反超子',
        url: 'https://ihep.cas.cn/kxcb/kpcg/lztt/kpyd_yzsx/kpyd_ihepyzx/200909/t20090914_2482174.html',
      },
      {
        title: 'BeEST — Electron-capture recoil spectroscopy',
        url: 'https://beest.mines.edu/wp-content/uploads/sites/345/2022/07/BeEST_v1_KimPoster.pdf',
      },
      {
        title: 'ATLAS — Observation of a new particle (2012)',
        url: 'https://arxiv.org/abs/1207.7214',
      },
      { title: 'CMS — Observation of a new boson (2012)', url: 'https://arxiv.org/abs/1207.7235' },
      {
        title: 'Acta Physica Sinica — Anti-Sigma event (1960)',
        url: 'https://wulixb.iphy.ac.cn/article/doi/10.7498/aps.16.365',
      },
      {
        title: 'Samuel Ting — Nobel lecture (1976)',
        url: 'https://www.nobelprize.org/uploads/2018/06/ting-lecture.pdf',
      },
      {
        title: 'Burton Richter — Nobel lecture (1976)',
        url: 'https://www.nobelprize.org/uploads/2018/06/richter-lecture.pdf',
      },
    ],
    number: '246',
  },
  {
    slug: 'newton-second-law-lab',
    name: '力怎样改变速度',
    title: '为什么有推力，却不一定加速？',
    question: '为什么有推力，却不一定加速？',
    description:
      '从匀速推车出发，比较相同时间的速度增量，用控制变量和撤力反例理解F合=Ma，并检验槽码重力近似的边界。',
    color: '#b3be9b',
    tag: '合力 · 加速度 · 控制变量',
    related: ['ticker-tape-lab', 'force-pairs-lab'],
    sources: [
      {
        title: 'OpenStax — Applying Newton’s Laws',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/6-1-solving-problems-with-newtons-laws',
      },
    ],
    number: '245',
  },
  {
    slug: 'multimeter-lab',
    name: '多用电表实验',
    title: '一根指针，为什么能测三种量？',
    question: '一根指针，为什么能测三种量？',
    description:
      '打开多用电表的等效电路，跟随同一表头的分压、分流和内电池路径，再用真实加载解释灯不亮的故障。',
    color: '#c4cbb0',
    tag: '测量 · 电表 · 故障',
    related: ['resistivity-lab', 'length-instruments'],
    sources: [
      {
        title: 'HIOKI 3007 instruction manual, resistance polarity and LI/LV sections',
        url: 'https://www.hioki.com/download/29783',
      },
      {
        title: 'HIOKI — Analog tester input resistance FAQ',
        url: 'https://www.hioki.com/us-en/support/faq/detail/id_121',
      },
      {
        title: 'OpenStax — Electrical Measuring Instruments',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/10-4-electrical-measuring-instruments',
      },
      {
        title: '人民教育出版社 — 高中物理必修第三册，P68–77',
        url: 'https://jc.pep.com.cn/',
      },
    ],
    number: '244',
  },
  {
    slug: 'statistical-motion-lab',
    name: '随机事件与统计实验',
    title: '每次结果不确定，为什么整体有规律？',
    question: '每次结果不确定，为什么整体有规律？',
    description: '通过伽尔顿板、四枚硬币与落豆台秤，区分随机结果、统计分布和平均撞击。',
    color: '#799066',
    tag: '单次与整体',
    related: ['brownian-motion', 'ideal-gas'],
    sources: [
      {
        title: 'OpenStax — Binomial distribution',
        url: 'https://openstax.org/books/introductory-statistics-2e/pages/4-3-binomial-distribution',
      },
      {
        title: 'OpenStax — Molecular model of an ideal gas',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/2-1-molecular-model-of-an-ideal-gas',
      },
    ],
    number: '243',
  },
  {
    slug: 'nuclear-evidence-lab',
    name: '核反应的实验线索',
    title: '看不见核内部，怎样从产物判断发生了什么？',
    question: '看不见核内部，怎样从产物判断发生了什么？',
    description: '从闪烁、反冲和化学分离，到共同顶点与中子去向，让固定证据约束核模型和下一步预测。',
    color: '#aebfa8',
    tag: '近代物理',
    related: ['atomic-scattering-lab', 'particle-evidence-lab'],
    sources: [
      {
        title: 'Blackett — Cloud chamber researches (1948 Nobel lecture)',
        url: 'https://www.nobelprize.org/uploads/2018/06/blackett-lecture.pdf',
      },
      {
        title: 'Chadwick — The neutron and its properties (1935 Nobel lecture)',
        url: 'https://www.nobelprize.org/uploads/2018/06/chadwick-lecture.pdf',
      },
      {
        title: '中国科学院高能所 — 核乳胶',
        url: 'https://www.ihep.ac.cn/kxcb/kpcg/lztcq/201004/t20100415_2822448.html',
      },
      {
        title: 'IAEA — Fermi and uranium fission',
        url: 'https://www.iaea.org/sites/default/files/publications/magazines/bulletin/bull4-0/04004700911su.pdf',
      },
      {
        title:
          'Hahn — From the natural transmutations of uranium to its artificial fission (Nobel lecture)',
        url: 'https://www.nobelprize.org/uploads/2018/06/hahn-lecture.pdf',
      },
      {
        title:
          'Meitner and Frisch — Disintegration of Uranium by Neutrons: a New Type of Nuclear Reaction (1939)',
        url: 'https://www.nature.com/articles/143239a0',
      },
      {
        title:
          'Tsien, Ho, Vigneron and Chastel — Ternary and Quaternary Fission of Uranium Nuclei (1947)',
        url: 'https://www.nature.com/articles/159773a0',
      },
      {
        title:
          'National Archives — Notebook recording the first controlled self-sustaining chain reaction (1942)',
        url: 'https://www.archives.gov/milestone-documents/manhattan-project-notebook',
      },
    ],
    number: '242',
  },
  {
    slug: 'molecular-measurement-lab',
    name: '分子的间接观察与测量',
    title: '看不见分子，怎样测出它的尺度？',
    question: '看不见分子，怎样测出它的尺度？',
    description: '用炭粒运动、量筒混合和单分子油膜，把可见观察连接到微观解释。',
    color: '#799066',
    tag: '从宏观估测微观',
    related: ['brownian-motion', 'diffusion'],
    sources: [
      {
        title: 'NIST — Dynamic light scattering',
        url: 'https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=854412',
      },
      {
        title: 'University of Göttingen — Ethanol and water',
        url: 'https://www.unterrichtsmaterialien-chemie.uni-goettingen.de/exp_neu.php?id=765',
      },
      {
        title: 'UMass — Oleic-acid thin films',
        url: 'https://www.umass.edu/agriculture-food-environment/sites/ag.umass.edu/files/pdf-doc-ppt/2009_oleic_acid_thin_films.pdf',
      },
    ],
    number: '241',
  },
  {
    slug: 'inertial-frames-lab',
    name: '抽纸与参考系',
    title: '球几乎没动，为什么纸上的观察者看到它后退？',
    question: '球几乎没动，为什么纸上的观察者看到它后退？',
    description: '同一颗钢球和同一段抽纸过程，在桌面与纸面坐标中对照，分清真实摩擦和参考系效应。',
    color: '#b7c0a5',
    tag: '抽纸 · 坐标 · 惯性',
    related: ['galileo-inclines', 'friction-lab'],
    sources: [
      {
        title: 'OpenStax — Newton’s First Law',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/5-2-newtons-first-law',
      },
      {
        title: 'OpenStax — Rolling Motion',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/11-1-rolling-motion',
      },
    ],
    number: '240',
  },
  {
    slug: 'decay-measurement-lab',
    name: '衰变的统计与用途',
    title: '不确定的单次衰变，怎样成为可测的时间与路径？',
    question: '不确定的单次衰变，怎样成为可测的时间与路径？',
    description: '从氡的半衰期计数，理解磷示踪和碳14理想测年的信号与偏差。',
    color: '#aebfa8',
    tag: '近代物理',
    related: ['radiation-evidence-lab', 'nuclear-evidence-lab'],
    sources: [
      {
        title: 'NIST — Radon-222 emanation standard',
        url: 'https://tsapps.nist.gov/srmext/certificates/archives/4973.pdf',
      },
      {
        title: 'IAEA — Phosphorus isotope tracer techniques',
        url: 'https://www-pub.iaea.org/MTCD/Publications/PDF/TE1805web.pdf',
      },
      {
        title: 'IAEA — Nuclear techniques for cultural heritage',
        url: 'https://www-pub.iaea.org/MTCD/publications/PDF/p1501CD/PDF/Pub_1501.pdf',
      },
      {
        title: 'IAEA — Accelerator mass spectrometry applications',
        url: 'https://nucleus.iaea.org/sites/accelerators/AMS/SitePages/AMS-applications.aspx',
      },
    ],
    number: '239',
  },
  {
    slug: 'resistivity-lab',
    name: '电阻与电阻率实验',
    title: '电阻变化，究竟是哪一个条件变了？',
    question: '电阻变化，究竟是哪一个条件变了？',
    description: '从 U–I 图像到四段导体的控制变量比较，再追踪加热与电表接法，测出金属丝的电阻率。',
    color: '#b6c2a1',
    tag: '电阻 · 电阻率 · 测量',
    related: ['length-instruments', 'rc-circuit'],
    sources: [
      {
        title: 'OpenStax — Resistivity and Resistance',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/9-3-resistivity-and-resistance',
      },
      {
        title: 'OpenStax — Electrical Measuring Instruments',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/10-4-electrical-measuring-instruments',
      },
    ],
    number: '238',
  },
  {
    slug: 'radiation-evidence-lab',
    name: '发现看不见的射线',
    title: '感光、电离与径迹，怎样成为看不见粒子的证据？',
    question: '感光、电离与径迹，怎样成为看不见粒子的证据？',
    description: '重建天然放射性、居里测量、磁偏转、膨胀云室与X射线的证据链。',
    color: '#aebfa8',
    tag: '近代物理',
    related: ['nuclear-evidence-lab', 'decay-measurement-lab'],
    sources: [
      {
        title: 'Henri Becquerel — Nobel lecture',
        url: 'https://www.nobelprize.org/uploads/2018/06/becquerel-lecture.pdf',
      },
      {
        title: 'Marie Curie — Nobel lecture',
        url: 'https://www.nobelprize.org/prizes/chemistry/1911/marie-curie/lecture/',
      },
      {
        title: 'Ernest Rutherford — Nobel lecture',
        url: 'https://www.nobelprize.org/prizes/chemistry/1908/rutherford/lecture/',
      },
      {
        title: 'Nobel Prize — The Wilson expansion chamber',
        url: 'https://educationalgames.nobelprize.org/educational/physics/observing/cloud-1.html',
      },
      {
        title: 'Charles Wilson — Nobel lecture',
        url: 'https://www.nobelprize.org/uploads/2018/06/wilson-lecture.pdf',
      },
    ],
    number: '237',
  },
  {
    slug: 'galileo-inclines',
    name: '伽利略斜面研究',
    title: '把运动变慢，怎样看出自由落体与惯性的线索？',
    question: '把运动变慢，怎样看出自由落体与惯性的线索？',
    description: '从缓坡流水计时到双斜面理想推理，区分历史实验、滚动模型与后续机械能观察。',
    color: '#b8b596',
    tag: '计时 · 理想化 · 守恒',
    related: ['free-fall-activities', 'inclined-plane', 'inertial-frames-lab'],
    sources: [
      {
        title: 'Museo Galileo — Inclined Plane',
        url: 'https://catalogue.museogalileo.it/object/InclinedPlane.html',
      },
      {
        title: 'OpenStax — Rolling Motion',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/11-1-rolling-motion',
      },
      {
        title: 'Rice University — Inclined Plane Reconstruction',
        url: 'https://galileo.library.rice.edu/lib/student_work/experiment95/inclined_plane.html',
      },
    ],
    number: '236',
  },
  {
    slug: 'sensor-control-lab',
    name: '传感器测量与自动控制',
    title: '怎样让光、温度和压力控制一盏灯？',
    question: '怎样让光、温度和压力控制一盏灯？',
    description: '从电表读数到晶体管和继电器，逐项还原教材中的传感与控制实验。',
    color: '#799066',
    tag: '测量、放大与执行',
    related: ['hall-effect', 'relay'],
    sources: [
      {
        title: 'TDK — NTC thermistor technical information',
        url: 'https://www.tdk-electronics.tdk.com/download/531116/19643b7ea798d7c4670141a88cd993f9/pdf-general-technical-information.pdf',
      },
      {
        title: 'Littelfuse — Magnetic sensing',
        url: 'https://www.littelfuse.com/assetdocs/sensing-products-selection-guide?assetguid=7fff98e7-9335-445a-831e-992b4f1fb8a5',
      },
    ],
    number: '235',
  },
  {
    slug: 'matter-wave-lab',
    name: '电子与晶体衍射',
    title: '粒子留下的图样，为什么像波？',
    question: '粒子留下的图样，为什么像波？',
    description: '比较单晶反射、薄膜衍射环、电子干涉与X射线晶体斑点。',
    color: '#aebfa8',
    tag: '近代物理',
    related: ['optical-diffraction-lab', 'double-slit'],
    sources: [
      {
        title: 'Clinton Davisson — Nobel lecture',
        url: 'https://www.nobelprize.org/uploads/2018/06/davisson-lecture.pdf',
      },
      {
        title: 'Louis de Broglie — Nobel lecture',
        url: 'https://www.nobelprize.org/uploads/2016/04/broglie-lecture.pdf',
      },
      {
        title: 'IUCr — Laue equations',
        url: 'https://dictionary.iucr.org/Laue_equations',
      },
      {
        title: 'IUCr — The reciprocal lattice',
        url: 'https://www.iucr.org/what-we-do/education/pamphlets/reciprocal-lattice',
      },
    ],
    number: '234',
  },
  {
    slug: 'force-resultant-lab',
    name: '力的合成与分解实验',
    title: '两个斜着拉的力，怎样换成一个力？',
    question: '两个斜着拉的力，怎样换成一个力？',
    description: '保留橡皮条同一形变，从双测力计与单测力计的等效替换建立矢量合成，再反向研究分解。',
    color: '#b2bf9e',
    tag: '同效 · 替换 · 矢量',
    related: ['force-pairs-lab', 'elasticity-lab'],
    sources: [
      {
        title: 'OpenStax — Scalars and Vectors',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/2-1-scalars-and-vectors',
      },
      {
        title: 'OpenStax — Conditions for Static Equilibrium',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/12-1-conditions-for-static-equilibrium',
      },
    ],
    number: '233',
  },
  {
    slug: 'length-instruments',
    name: '长度测量与精细读数',
    title: '怎样把看不清的小长度，变成可靠的读数？',
    question: '怎样把看不清的小长度，变成可靠的读数？',
    description:
      '看两套刻度的差怎样揭示微小位移、螺距怎样把转动变成微小位移，再分清多圈累积能减小什么误差。',
    color: '#b6c2a2',
    tag: '测量 · 刻度 · 误差',
    related: ['coulomb-torsion', 'lever'],
    sources: [
      {
        title: 'Mitutoyo — Caliper scale reading and measurement applications',
        url: 'https://www.mitutoyo.com/webfoo/wp-content/uploads/D_section.pdf',
      },
      {
        title: 'Mitutoyo — Micrometer quick guide',
        url: 'https://www2.mitutoyo.co.jp/eng/products/menu/QuickGuide_Micrometers.pdf',
      },
    ],
    number: '232',
  },
  {
    slug: 'wireless-interference-lab',
    name: 'Wi-Fi与蓝牙干扰实验',
    title: '连接蓝牙以后，Wi-Fi一定会变慢吗？',
    question: '连接蓝牙以后，Wi-Fi一定会变慢吗？',
    description: '把频率重叠、传输时间、自适应跳频与真实重复测速区分开。',
    color: '#799066',
    tag: '频段与受控对照',
    related: ['packet-routing', 'network'],
    sources: [
      {
        title: 'Bluetooth SIG — Adaptive frequency hopping',
        url: 'https://www.bluetooth.com/blog/how-bluetooth-technology-uses-adaptive-frequency-hopping-to-overcome-packet-interference/',
      },
      {
        title: 'Silicon Labs — Wi-Fi coexistence fundamentals',
        url: 'https://www.silabs.com/documents/public/user-guides/ug103-17-wi-fi-coexistence-fundamentals.pdf',
      },
    ],
    number: '231',
  },
  {
    slug: 'atomic-spectrum-lab',
    name: '光谱中的原子证据',
    title: '把光展开，怎样认出物质与理论的细小偏差？',
    question: '把光展开，怎样认出物质与理论的细小偏差？',
    description: '从食盐焰色、氢线光谱和太阳暗线，走到精密测量发现的能级差。',
    color: '#aebfa8',
    tag: '近代物理',
    related: [
      'photoelectric-lab',
      'prism-dispersion',
      'cosmology-observations',
      'chem-flame-spectra',
    ],
    sources: [
      {
        title: 'NIST — Strong lines of sodium',
        url: 'https://www.physics.nist.gov/PhysRefData/Handbook/Tables/sodiumtable2.htm',
      },
      {
        title: 'NIST — Critical compilation of hydrogen spectral data',
        url: 'https://www.nist.gov/publications/critical-compilation-experimental-data-spectral-lines-and-energy-levels-hydrogen',
      },
      {
        title: 'Lamb and Retherford — Fine structure of the hydrogen atom (1947)',
        url: 'https://web.mit.edu/8.13/8.13c/references-fall/spectroscopy/lamb-1947.pdf',
      },
      {
        title: 'Willis Lamb — Nobel lecture',
        url: 'https://www.nobelprize.org/uploads/2018/06/lamb-lecture.pdf',
      },
    ],
    number: '230',
  },
  {
    slug: 'hertz-wave-lab',
    name: '赫兹与电磁波实验',
    title: '两处没有相连的间隙，为什么都出现火花？',
    question: '两处没有相连的间隙，为什么都出现火花？',
    description: '从火花发射与接收，逐项观察反射干涉、折射、偏振和衍射的证据。',
    color: '#799066',
    tag: '波动的多重证据',
    related: ['polarization', 'wave-interference'],
    sources: [
      {
        title: 'OpenStax — Electromagnetic waves',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/16-1-maxwells-equations-and-electromagnetic-waves',
      },
    ],
    number: '229',
  },
  {
    slug: 'force-pairs-lab',
    name: '作用力与反作用力实验',
    title: '谁拉谁，两只测力计会给出不同答案吗？',
    question: '谁拉谁，两只测力计会给出不同答案吗？',
    description:
      '连接两只测力计或传感器，改变伸长、劲度与位置，按同一时刻辨认作用在不同对象上的力。',
    color: '#b1bca2',
    tag: '连接 · 配对 · 同时',
    related: ['elasticity-lab', 'friction-lab', 'force-resultant-lab', 'recoil-lab'],
    sources: [
      {
        title: 'OpenStax — Newton’s Third Law',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/5-5-newtons-third-law',
      },
    ],
    number: '228',
  },
  {
    slug: 'ac-circuit-lab',
    name: '交流电与LC振荡实验',
    title: '电流换方向时，灯泡与线圈怎样响应？',
    question: '电流换方向时，灯泡与线圈怎样响应？',
    description: '用示波器、反并联LED、交流元件和LC回路逐步比较变化的电流。',
    color: '#799066',
    tag: '交流与储能交换',
    related: ['transformer-electric', 'inductor-transient'],
    sources: [
      {
        title: 'OpenStax — Simple AC circuits',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/15-2-simple-ac-circuits',
      },
      {
        title: 'OpenStax — LC oscillations',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/14-5-oscillations-in-an-lc-circuit',
      },
    ],
    number: '227',
  },
  {
    slug: 'friction-lab',
    name: '摩擦力测量实验',
    title: '木块还没动，摩擦力为什么已经变了？',
    question: '木块还没动，摩擦力为什么已经变了？',
    description: '匀速拖动比较压力，再用纸团峰值和力传感器跟踪静止到滑动的全过程。',
    color: '#b8bd9b',
    tag: '静止 · 起滑 · 匀速',
    related: ['elasticity-lab', 'inclined-plane'],
    sources: [
      {
        title: 'OpenStax — Friction',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/6-2-friction',
      },
    ],
    number: '226',
  },
  {
    slug: 'capacitor-current-lab',
    name: '从电流面积测电荷',
    title: '一条下降的电流曲线，怎样告诉我们放出了多少电？',
    question: '一条下降的电流曲线，怎样告诉我们放出了多少电？',
    description: '观察电容放电的 I–t 曲线，从面积求电荷，再用相同空电容器逐次分电作对照。',
    color: '#a9bea4',
    tag: '电流积分 · 电荷守恒',
    related: ['rc-circuit', 'parallel-plate-capacitor-lab'],
    sources: [
      {
        title: 'OpenStax — RC Circuits',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/10-5-rc-circuits',
      },
      {
        title: 'OpenStax — Energy Stored in a Capacitor',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/8-3-energy-stored-in-a-capacitor',
      },
    ],
    number: '225',
  },
  {
    slug: 'eddy-current-lab',
    name: '涡流与电磁阻尼',
    title: '没有接触，磁体怎样让运动慢下来？',
    question: '没有接触，磁体怎样让运动慢下来？',
    description: '分别追踪指针、铝框、铜盘、落磁和弹簧振子的机械能去向。',
    color: '#799066',
    tag: '阻尼与驱动',
    related: ['eddy-current-brake', 'induction-motor'],
    sources: [
      {
        title: 'OpenStax — Eddy currents',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/13-5-eddy-currents',
      },
    ],
    number: '224',
  },
  {
    slug: 'cathode-ray-lab',
    name: '阴极射线与电子',
    title: '一束看不见的射线，怎样显露电荷与质量？',
    question: '一束看不见的射线，怎样显露电荷与质量？',
    description: '对照电场、磁场与薄金属窗中的电子束，区分可观察证据与历史推断。',
    color: '#aebfa8',
    tag: '近代物理',
    related: ['oil-drop-lab', 'charged-particle-lab'],
    sources: [
      {
        title: 'Nobel Prize — Thomson’s cathode-ray apparatus',
        url: 'https://educationalgames.nobelprize.org/educational/physics/vacuum/experiment-2.html',
      },
      {
        title: 'Nobel Prize — Lenard’s metal window',
        url: 'https://educationalgames.nobelprize.org/educational/physics/vacuum/tube-3.html',
      },
      {
        title: 'NIST — Fundamental-constant experiments',
        url: 'https://physics.nist.gov/cuu/Constants/histindex.html',
      },
    ],
    number: '223',
  },
  {
    slug: 'elasticity-lab',
    name: '弹性测量实验',
    title: '伸长一倍，拉力一定增加一倍吗？',
    question: '伸长一倍，拉力一定增加一倍吗？',
    description: '从原长、砝码和记录点建立弹簧关系，再沿橡皮筋的加载、卸载与重复循环检验边界。',
    color: '#b7bc98',
    tag: '伸长 · 加载 · 滞回',
    related: ['pendulum', 'suspension-center-of-gravity'],
    sources: [
      {
        title: 'OpenStax — Elasticity and Plasticity',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/12-4-elasticity-and-plasticity',
      },
      {
        title: 'Penn State — Rubber Band Elastic Hysteresis',
        url: 'https://phys23p.sl.psu.edu/~mrg3/interactives/EJSS_mrg/ejss_model_Bungee_Hysteresis_Thermal_V2/ElasticHysteresisIntroduction.html',
      },
    ],
    number: '222',
  },
  {
    slug: 'parallel-plate-capacitor-lab',
    name: '平行板电容的控制变量',
    title: '电压变了，是电荷变了，还是电容变了？',
    question: '电压变了，是电荷变了，还是电容变了？',
    description: '先隔离电源，再改变板距、正对面积与介质，用静电计观察固定电荷下的电容变化。',
    color: '#b6c0a0',
    tag: '电容 · 控制变量',
    related: ['capacitor-fields', 'electric-field-mapping'],
    sources: [
      {
        title: 'OpenStax — Capacitors and Capacitance',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/8-1-capacitors-and-capacitance',
      },
      {
        title: 'OpenStax — Capacitor with a Dielectric',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/8-4-capacitor-with-a-dielectric',
      },
    ],
    number: '221',
  },
  {
    slug: 'self-induction-lab',
    name: '自感与两灯实验',
    title: '断开电源以后，灯泡为什么还会亮？',
    question: '断开电源以后，灯泡为什么还会亮？',
    description: '比较两种真实接线，跟踪通电延迟、断电反向与有条件的闪亮。',
    color: '#799066',
    tag: '电流的连续变化',
    related: ['inductor-transient', 'transformer-electric'],
    sources: [
      {
        title: 'OpenStax — Inductance',
        url: 'https://openstax.org/books/college-physics-2e/pages/23-9-inductance',
      },
    ],
    number: '220',
  },
  {
    slug: 'small-deformation-lab',
    name: '微小形变观察',
    title: '桌面几乎看不出弯曲，光点为什么动了？',
    question: '桌面几乎看不出弯曲，光点为什么动了？',
    description: '让两面镜与同一条弹性梁联动，用真实反射光路把微小转角转成远处光点的位移。',
    color: '#b8ba9e',
    tag: '形变 · 反射 · 放大',
    related: ['retroreflector', 'suspension-center-of-gravity'],
    sources: [
      {
        title: 'University of Wisconsin — Optical Lever',
        url: 'https://www.physics.wisc.edu/instructional/phys109/yoshi/physlab/testing/working207.pdf',
      },
      {
        title: 'Purdue University — Beam Formulas',
        url: 'https://engineering.purdue.edu/~ce474/Docs/DA6-BeamFormulas.pdf',
      },
    ],
    number: '219',
  },
  {
    slug: 'atomic-scattering-lab',
    name: '微观散射实验',
    title: '看不见的内部，怎样由偏转留下证据？',
    question: '看不见的内部，怎样由偏转留下证据？',
    description: '比较α粒子的偏转与X射线的波长改变，区分核结构证据和光子动量证据。',
    color: '#aebfa8',
    tag: '近代物理',
    related: ['atomic-spectrum-lab', 'nuclear-evidence-lab'],
    sources: [
      {
        title: 'Fermilab — Rutherford and the nucleus',
        url: 'https://www.fnal.gov/pub/inquiring/timeline/03.html',
      },
      {
        title: 'OpenStax — The Compton Effect',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/6-3-the-compton-effect',
      },
    ],
    number: '218',
  },
  {
    slug: 'oil-drop-lab',
    name: '油滴与元电荷',
    title: '怎样从油滴的运动称出电荷？',
    question: '怎样从油滴的运动称出电荷？',
    description: '跟踪同一颗未知油滴，用终速和电压反求电荷，再以密立根固定计时记录检验共同小增量。',
    color: '#aebfa8',
    tag: '近代物理',
    related: ['cathode-ray-lab', 'electric-field-mapping'],
    sources: [
      {
        title: 'NIST — Millikan and the fundamental constants',
        url: 'https://physics.nist.gov/cuu/Constants/historical1.html',
      },
      {
        title: 'University of Toronto — Millikan experiment manual',
        url: 'https://www.physics.utoronto.ca/~phy224_324/LabManuals/MillikanExperiment.pdf',
      },
      {
        title: 'On the Elementary Electrical Charge and the Avogadro Constant',
        url: 'https://doi.org/10.1103/PhysRev.2.109',
      },
      {
        title: 'Millikan Oil Drop Apparatus AP-8210A Instruction Manual',
        url: 'https://web.physics.ucsb.edu/~phys128/experiments/electron/Millikan-Oil-Drop-Manual-AP-8210A.pdf',
      },
      {
        title: 'Definitions of SI Base Units — Ampere',
        url: 'https://www.nist.gov/si-redefinition/definitions-si-base-units',
      },
    ],
    number: '217',
  },
  {
    slug: 'mutual-induction-lab',
    name: '互感实验室',
    title: '两组导线没有接通，信号怎样传过去？',
    question: '两组导线没有接通，信号怎样传过去？',
    description: '在铁环与套入线圈中，追踪原电流、共享磁通和副线圈电动势。',
    color: '#799066',
    tag: '共享的变化磁通',
    related: ['transformer-electric', 'inductor-transient'],
    sources: [
      {
        title: 'OpenStax — Mutual inductance',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/14-1-mutual-inductance',
      },
    ],
    number: '216',
  },
  {
    slug: 'electric-field-mapping',
    name: '油盘中的电场图样',
    title: '没有箭头的碎屑，能告诉我们怎样的电场？',
    question: '没有箭头的碎屑，能告诉我们怎样的电场？',
    description: '从油中头发碎屑的取向出发，比较单电荷、双电荷和平行板，区分观察图样与计算电场线。',
    color: '#c6c69b',
    tag: '电场图样 · 叠加',
    related: ['coulomb-torsion', 'capacitor-fields'],
    sources: [
      {
        title: 'OpenStax — Electric Field Lines',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/5-6-electric-field-lines',
      },
      {
        title: 'OpenStax — Electric Dipoles',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/5-7-electric-dipoles',
      },
    ],
    number: '215',
  },
  {
    slug: 'suspension-center-of-gravity',
    name: '悬挂法找重心',
    title: '换了悬点，为什么仍找到同一点？',
    question: '换了悬点，为什么仍找到同一点？',
    description: '从重力的力臂看薄板转动，用两条固定墨迹定位重心，再预测加配重后的新位置。',
    color: '#b2bd9d',
    tag: '力臂 · 墨迹 · 质量分布',
    related: ['center-of-mass', 'pendulum'],
    sources: [
      {
        title: 'Simon Fraser University — Centre of Mass L',
        url: 'https://www.sfu.ca/physics/demos/demos-experiments/centre-of-mass-l-burnaby.html',
      },
      {
        title: 'OpenStax — Conditions for Static Equilibrium',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/12-1-conditions-for-static-equilibrium',
      },
      {
        title: 'OpenStax — Physical pendulums',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/15-4-pendulums',
      },
      {
        title: 'OpenStax — Centre of mass and mass weighting',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/9-6-center-of-mass',
      },
      { title: '人教版高中物理必修第一册，58页与61页', url: 'https://jc.pep.com.cn/' },
    ],
    number: '214',
  },
  {
    slug: 'induction-coil-lab',
    name: '电磁感应实验室',
    title: '磁体一直在场，为什么指针只在运动时偏转？',
    question: '改变的是磁场，还是穿过线圈的磁通？',
    description: '从四种方向证据出发，追踪磁通变化、闭合电流与力，再预测落磁脉冲和圆盘发电。',
    color: '#799066',
    tag: '磁通与电动势',
    related: ['transformer-electric', 'eddy-current-brake'],
    sources: [
      {
        title: 'OpenStax — Faraday and Lenz laws',
        url: 'https://openstax.org/books/college-physics/pages/23-2-faradays-law-of-induction-lenzs-law',
      },
      {
        title: 'OpenStax — Electromagnetic induction',
        url: 'https://openstax.org/books/physics/pages/20-3-electromagnetic-induction',
      },
      {
        title: 'OpenStax — Motional Emf, rotating rod and energy (Example 13.5)',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/13-3-motional-emf',
      },
    ],
    number: '213',
  },
  {
    slug: 'coulomb-torsion',
    name: '库仑扭秤',
    title: '怎样把微小的静电力变成可比较的扭角？',
    question: '怎样把微小的静电力变成可比较的扭角？',
    description: '从悬球偏转到扭秤回零，控制球心距离与电荷，检验平方反比关系。',
    color: '#b6bc91',
    tag: '静电力 · 控制变量',
    related: ['electrostatic-induction', 'capacitor-fields'],
    sources: [
      {
        title: 'OpenStax — Coulomb’s Law',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/5-3-coulombs-law',
      },
    ],
    number: '212',
  },
  {
    slug: 'free-fall-activities',
    name: '自由落体小实验',
    title: '一张纸、一对石头、一把尺，分别能回答什么？',
    question: '一张纸、一对石头、一把尺，分别能回答什么？',
    description: '从纸片与纸团的受控比较，到两石反证与反应尺，区分观察、推理和测量。',
    color: '#aab992',
    tag: '观察 · 推理 · 测量',
    related: ['newton-tube', 'ticker-tape-lab'],
    sources: [
      {
        title: 'NASA Glenn — Falling Object with Air Resistance',
        url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/falling-object-with-air-resistance/',
      },
      {
        title: 'OpenStax University Physics — Free Fall',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/3-5-free-fall',
      },
    ],
    number: '211',
  },
  {
    slug: 'blackbody-lab',
    name: '黑体辐射测量',
    title: '升温时，辐射曲线的峰值为什么向短波移动？',
    question: '升温时，辐射曲线的峰值为什么向短波移动？',
    description: '从热腔小孔到分光测量，在同一强度刻度下比较不同温度的辐射光谱。',
    color: '#aebfa8',
    tag: '近代物理',
    related: ['photoelectric-lab', 'thermal-process-lab'],
    sources: [
      {
        title: 'OpenStax — Blackbody Radiation',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/6-1-blackbody-radiation',
      },
      {
        title: 'NIST — SI constants',
        url: 'https://www.nist.gov/si-redefinition/meet-constants',
      },
    ],
    number: '210',
  },
  {
    slug: 'photoelectric-lab',
    name: '光电效应实验室',
    title: '更亮的光，为什么仍打不出电子？',
    question: '更亮的光，为什么仍打不出电子？',
    description: '从锌板验电器到光电管，分别改变频率、光强与电压，读懂光电子的能量。',
    color: '#aebfa8',
    tag: '近代物理',
    related: ['blackbody-lab', 'atomic-spectrum-lab'],
    sources: [
      {
        title: 'OpenStax — Photoelectric Effect',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/6-2-photoelectric-effect',
      },
      {
        title: 'NIST — Historical determinations of constants',
        url: 'https://physics.nist.gov/cuu/Constants/historical1.html',
      },
    ],
    number: '209',
  },
  {
    slug: 'charged-particle-lab',
    name: '带电粒子实验室',
    title: '一条弯曲轨迹，能告诉我们什么？',
    question: '一条弯曲轨迹，能告诉我们什么？',
    description: '用电子束、质谱落点和铅板两侧径迹，把磁力方向变成可核对的证据。',
    color: '#608575',
    tag: '磁场中的粒子',
    related: ['hall-effect', 'magnetic-force-lab'],
    sources: [
      {
        title: 'OpenStax — Charged particles in magnetic fields',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/11-3-motion-of-a-charged-particle-in-a-magnetic-field',
      },
      {
        title: 'OpenStax — Mass spectrometry',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/11-7-applications-of-magnetic-forces-and-fields',
      },
      {
        title: 'Anderson — Nobel lecture',
        url: 'https://www.nobelprize.org/uploads/2018/06/anderson-lecture.pdf',
      },
    ],
    number: '208',
  },
  {
    slug: 'electrostatic-induction',
    name: '静电起电与验电器',
    title: '不接触，怎样让两个导体带上相反的电？',
    question: '不接触，怎样让两个导体带上相反的电？',
    description: '从玻璃棒和丝绸到双导体、验电器与带电细丝，跟踪电子的去向和始终守恒的电荷。',
    color: '#afbd9b',
    tag: '电荷转移 · 等势',
    related: ['capacitor-fields', 'diode-junction', 'franklin-electricity-evidence'],
    sources: [
      {
        title: 'OpenStax — Conductors, Insulators, and Charging by Induction',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/5-2-conductors-insulators-and-charging-by-induction',
      },
      {
        title: 'OpenStax — Conductors and Insulators: the electroscope',
        url: 'https://openstax.org/books/college-physics-2e/pages/18-2-conductors-and-insulators',
      },
    ],
    number: '207',
  },
  {
    slug: 'phone-accelerometer-lab',
    name: '手机怎样感觉加速度',
    title: '没动读9.8，下落为什么读零？',
    question: '没动读9.8，下落为什么读零？',
    description: '放大手机里的悬挂质量块，从支撑、释放与接住理解读数，再用电梯和测力计推导加速度。',
    color: '#abbca0',
    tag: '支撑 · 位移 · 加速度',
    related: ['newton-tube', 'gyroscope', 'apparent-weight-lab'],
    sources: [
      {
        title: 'phyphox — Acceleration with g',
        url: 'https://phyphox.org/experiment/acceleration-with-g/',
      },
      {
        title: 'Android Sensors — Motion sensors',
        url: 'https://developer.android.com/develop/sensors-and-location/sensors/sensors_motion',
      },
      {
        title: 'Analog Devices — Accelerometer sensing mechanisms',
        url: 'https://www.analog.com/en/resources/technical-articles/accelerometer-and-gyroscopes-sensors-operation-sensing-and-applications.html',
      },
      {
        title: 'Analog Devices — Suspended mass and differential capacitance',
        url: 'https://www.analog.com/en/resources/analog-dialogue/articles/dual-axis-low-g-fully-integrated-accelerometers.html',
      },
    ],
    number: '206',
  },
  {
    slug: 'magnetic-force-lab',
    name: '磁力实验室',
    title: '电流方向变了，受力怎样跟着变？',
    question: '电流方向变了，受力怎样跟着变？',
    description: '从悬挂导体棒到通电弹簧，用真实装置对照追踪电流、磁场与受力。',
    color: '#64826a',
    tag: '磁场与电流',
    related: ['hall-effect', 'induction-motor', 'wire-force-factors-lab'],
    sources: [
      {
        title: 'OpenStax — Force on a current-carrying conductor',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/11-4-magnetic-force-on-a-current-carrying-conductor',
      },
      {
        title: 'OpenStax — Force between parallel currents',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/12-3-magnetic-force-between-two-parallel-currents',
      },
    ],
    number: '205',
  },
  {
    slug: 'ticker-tape-lab',
    name: '纸带怎样记录运动',
    title: '同样的节拍，为什么点越来越疏？',
    question: '同样的节拍，为什么点越来越疏？',
    description:
      '跟踪同一串等时点，从点距读出速度变化，用等时位移差推导加速度，再预测小车和下落重物的下一点。',
    color: '#a5b88e',
    tag: '点距 · 速度 · 预测',
    related: ['newton-tube', 'sampling-aliasing', 'mechanical-energy-lab'],
    sources: [
      {
        title: 'OpenStax University Physics — Instantaneous Velocity and Speed',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/3-2-instantaneous-velocity-and-speed',
      },
      {
        title: 'OpenStax University Physics — Average and Instantaneous Acceleration',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/3-3-average-and-instantaneous-acceleration',
      },
      {
        title: 'Institute of Physics — Ticker timers: investigating speed',
        url: 'https://spark.iop.org/ticker-timers-investigating-speed',
      },
    ],
    number: '204',
  },
  {
    slug: 'newton-tube',
    name: '牛顿管实验',
    title: '羽毛落得慢，是因为比较轻吗？',
    question: '羽毛落得慢，是因为比较轻吗？',
    description:
      '同一片铁片和羽毛，先在空气中下落，再抽去空气。只改变一个条件，看见自由落体的共同规律。',
    color: '#859d76',
    tag: '自由落体 · 控制变量',
    related: ['pendulum', 'stokes-drag', 'balloon-drag-lab'],
    sources: [
      {
        title: 'NASA Glenn — Motion of Free Falling Object',
        url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/motion-of-free-falling-object/',
      },
      {
        title: 'NASA — The Apollo 15 Hammer-Feather Drop',
        url: 'https://science.nasa.gov/resource/the-apollo-15-hammer-feather-drop/',
      },
      {
        title: 'NASA Glenn — Modern Drag Equation',
        url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/modern-drag-equation/',
      },
    ],
    number: '203',
  },
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
    related: ['fuel-cell', 'rc-circuit', 'diode-junction', 'chem-ionic-conduction'],
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
    related: ['hall-effect', 'induction-motor', 'inductor-transient', 'eddy-current-lab'],
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
    related: ['wave-interference', 'vortex-ring', 'hydrostatic-pressure', 'ripple-tank-lab'],
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
    related: [
      'eddy-current-brake',
      'diode-junction',
      'capacitor-fields',
      'induction-motor',
      'diamagnetic-levitation-lab',
      'sensor-control-lab',
    ],
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
    related: ['convection', 'hydraulic-brake', 'water-hammer', 'floating-oscillator'],
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
    related: [
      'relay',
      'rc-circuit',
      'capacitor-fields',
      'transformer-electric',
      'self-induction-lab',
    ],
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
    related: [
      'thermal-expansion',
      'brownian-motion',
      'heat-conduction',
      'adiabatic-compression',
      'magdeburg-bowls-lab',
    ],
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
    related: [
      'angular-momentum',
      'flywheel',
      'lever',
      'center-of-mass',
      'momentum-collision-lab',
      'impulse-contact-lab',
    ],
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
    related: ['rainbow', 'polarization', 'prism-dispersion', 'chem-colloid-light'],
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
    related: [
      'total-internal-reflection',
      'lidar-ranging',
      'polarization',
      'small-deformation-lab',
    ],
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
    related: ['refraction', 'optical-fiber', 'polarization', 'total-reflection-lab'],
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
    related: ['seasons', 'moon-phases', 'gps', 'orbital-transfer', 'ellipse-string-lab'],
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
    related: [
      'piezoelectricity',
      'rectifier',
      'buck-converter',
      'lithium-battery',
      'capacitor-current-lab',
    ],
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
    related: ['wave-interference', 'double-slit', 'polarization', 'thin-film-lab'],
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
    related: ['osmosis', 'siphon', 'surface-tension-lab'],
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
    related: ['diffusion', 'capillary', 'bio-osmosis'],
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
    related: ['standing-wave', 'beats', 'singing-basin', 'forced-oscillation-lab'],
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
    related: [
      'diffraction',
      'wave-interference',
      'polarization',
      'diffraction-grating',
      'double-slit-measurement-lab',
    ],
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
    related: [
      'tcp-reliability',
      'network',
      'mobile-roaming',
      'dijkstra',
      'wireless-interference-lab',
    ],
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
    related: [
      'brownian-motion',
      'osmosis',
      'capillary',
      'random-walk',
      'diffusion-microstates-lab',
    ],
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
    related: ['camera-lens', 'myopia-lens', 'diffraction', 'bio-cell-microscopy'],
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
    related: ['radar-ranging', 'lidar-ranging', 'ultrasound', 'doppler-lab'],
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
    related: ['surface-waves', 'beats', 'standing-wave', 'double-slit', 'sound-interference-lab'],
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
    related: [
      'optical-fiber',
      'camera-lens',
      'noise',
      'polarization-evidence-lab',
      'hertz-wave-lab',
    ],
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
    related: [
      'ground-fault-breaker',
      'rectifier',
      'wireless-charging',
      'nfc',
      'ac-circuit-lab',
      'mutual-induction-lab',
      'induction-coil-lab',
    ],
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
    related: ['bicycle', 'noise', 'newton-tube', 'pendulum-measurement-lab'],
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
