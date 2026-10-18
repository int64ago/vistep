import { learningKeywords } from './learning-paths';

/** One source of truth for every catalog card, filter, breadcrumb and source catalog.
 * Classify by the main explanation; weapons have a dedicated context group.
 * Age is an editorial starting point, not certification or an access restriction.
 * Keep category IDs stable so existing shared filter links continue to work.
 */
export type DiscoveryCategory =
  | 'mechanisms'
  | 'electricity'
  | 'light-sound'
  | 'thermal-fluids'
  | 'computing'
  | 'nature'
  | 'matter'
  | 'chemistry'
  | 'life'
  | 'math-systems'
  | 'weapons-safety';
export const discoveryCategories: { id: DiscoveryCategory; label: { zh: string; en: string } }[] = [
  { id: 'matter', label: { zh: '原子与物质', en: 'Atoms & matter' } },
  { id: 'chemistry', label: { zh: '化学与反应', en: 'Chemistry & reactions' } },
  { id: 'life', label: { zh: '生命与生态', en: 'Life & ecology' } },
  {
    id: 'mechanisms',
    label: {
      zh: '机械与运动',
      en: 'Mechanisms & motion',
    },
  },
  {
    id: 'electricity',
    label: {
      zh: '电与磁',
      en: 'Electricity & magnetism',
    },
  },
  {
    id: 'light-sound',
    label: {
      zh: '光与波动',
      en: 'Light & waves',
    },
  },
  {
    id: 'thermal-fluids',
    label: {
      zh: '热学与流体',
      en: 'Heat & fluids',
    },
  },
  {
    id: 'computing',
    label: {
      zh: '计算与通信',
      en: 'Computing & communication',
    },
  },
  {
    id: 'nature',
    label: {
      zh: '地球与天文',
      en: 'Earth & astronomy',
    },
  },
  {
    id: 'math-systems',
    label: {
      zh: '数学与系统',
      en: 'Math & systems',
    },
  },
  {
    id: 'weapons-safety',
    label: {
      zh: '武器与安全',
      en: 'Weapons & safety',
    },
  },
];

export type DiscoveryMetadata = {
  category: DiscoveryCategory;
  minAge: 8 | 10 | 12 | 14;
  keywords: { zh: string[]; en: string[] };
};

/** Shared by the rendered catalog and query tests: categories and cross-subject
 * learning concepts are searchable in either language, alongside the aliases.
 */
export function discoverySearchKeywords(slug: string): string {
  const item = discoveryMetadata[slug];
  const category = discoveryCategories.find((entry) => entry.id === item.category)!;
  return [
    category.label.zh,
    category.label.en,
    ...item.keywords.zh,
    ...item.keywords.en,
    ...learningKeywords(slug),
  ].join(' ');
}

export const discoveryMetadata: Record<string, DiscoveryMetadata> = {
  'chem-pigment-chromatography': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['色素柱色谱', '色谱', '茨韦特', '植物色素'],
      en: ['Pigment column chromatography', 'chromatography', 'Tswett', 'plant pigments'],
    },
  },
  'chem-host-guest-recognition': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['主客体分子识别', '超分子', '杯酚', '富勒烯', '冠醚', '分子识别'],
      en: ['Host–guest molecular recognition', 'structure of matter', 'chemical evidence'],
    },
  },
  'chem-corrosion-protection': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: [
        '金属腐蚀、防护与暖贴研究',
        '吸氧腐蚀',
        '牺牲阳极',
        '铁氰化钾',
        '酚酞',
        '暖贴',
        '金属接触腐蚀',
      ],
      en: [
        'Corrosion, protection and warmer research',
        'oxygen absorption corrosion',
        'sacrificial anode',
        'ferricyanide',
        'phenolphthalein',
        'hand warmer',
        'galvanic contact',
      ],
    },
  },
  'chem-benzoic-recrystallization': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['苯甲酸重结晶', '苯甲酸', '重结晶', '溶解度'],
      en: ['Benzoic acid recrystallization', 'benzoic acid', 'recrystallization', 'solubility'],
    },
  },
  'chem-coordination-colors': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['配位改变颜色与溶解', '配合物', '铜氨', '氯化银', '配位键', '硫氰化铁', '配体'],
      en: ['Coordination changes color and solubility', 'structure of matter', 'chemical evidence'],
    },
  },
  'chem-electrolysis-plating': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['电解与铜电镀', '氯化铜电解', '铁件镀铜', '表面处理', '法拉第电解定律', '电镀极性'],
      en: [
        'Electrolysis and copper plating',
        'copper chloride electrolysis',
        'copper plating iron',
        'surface preparation',
        'Faraday electrolysis law',
        'electroplating polarity',
      ],
    },
  },
  'chem-solvent-extraction': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['萃取与分液', '萃取', '分液漏斗', '分配比'],
      en: [
        'Extraction and layer separation',
        'extraction',
        'separatory funnel',
        'distribution ratio',
      ],
    },
  },
  'chem-metal-and-graphite': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['金属与石墨的电子结构', '金属键', '电子气', '石墨', '各向异性', '位错', '电导', 'p轨道'],
      en: [
        'Electronic structure in metals and graphite',
        'structure of matter',
        'chemical evidence',
      ],
    },
  },
  'chem-distillation': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['蒸馏与馏分', '蒸馏', '馏分', '汽液平衡'],
      en: ['Distillation and fractions', 'distillation', 'fractions', 'vapour liquid equilibrium'],
    },
  },
  'chem-hydrolysis-applications': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['盐的水解与实验条件', '盐类水解', '硫酸铁', '净水', '氢氧化铁胶体', '纯碱去油'],
      en: [
        'Salt hydrolysis and experimental conditions',
        'salt hydrolysis',
        'ferric sulfate',
        'clarification',
        'iron hydroxide colloid',
        'carbonate cleaning',
      ],
    },
  },
  'chem-crystal-bonding': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['晶体中的连接层次', '分子晶体', '共价晶体', '金刚石', '石英', '解理', '氢键'],
      en: ['Bonding levels in crystals', 'structure of matter', 'chemical evidence'],
    },
  },
  'chem-seawater-membranes': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['海水与分离膜', '海水淡化', '反渗透', '高分子膜'],
      en: ['Seawater and separation membranes', 'desalination', 'osmosis', 'polymer membrane'],
    },
  },
  'chem-crystal-diffraction': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['晶胞与衍射的证据', '晶胞', '面心立方', '准晶', '彭罗斯', 'X射线', '衍射', '青蒿素'],
      en: ['Unit cells and diffraction evidence', 'structure of matter', 'chemical evidence'],
    },
  },
  'chem-metal-extraction': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['金属冶炼的还原路线', '金属冶炼', '还原', '电解', '铝热反应'],
      en: ['Metal extraction routes', 'metallurgy', 'reduction', 'electrolysis', 'thermite'],
    },
  },
  'chem-petroleum-refining': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['石油的分离与裂化', '原油', '分馏', '裂化', '裂解', '乙烯', '丙烯', '沸点'],
      en: [
        'Separating and cracking petroleum',
        'crude oil',
        'fractionation',
        'cracking',
        'pyrolysis',
        'ethene',
        'propene',
        'boiling point',
      ],
    },
  },
  'chem-acid-base-titration': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['最后半滴与滴定读数', '酸碱滴定', '酚酞', '滴定管', '当量点', '半滴'],
      en: [
        'The last half-drop and the burette reading',
        'acid-base titration',
        'phenolphthalein',
        'burette',
        'equivalence',
        'partial drop',
      ],
    },
  },
  'chem-tofu-coagulation': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['豆腐的制作', '豆腐', '蛋白质', '凝胶', '凝固剂'],
      en: ['Making tofu', 'tofu', 'protein', 'gel', 'coagulant'],
    },
  },
  'chem-protein-structure': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['蛋白质的多级结构', '蛋白质', '肽链', '二级结构', '四级结构', '血红蛋白'],
      en: [
        'Levels of protein structure',
        'protein',
        'peptide',
        'secondary structure',
        'quaternary structure',
        'hemoglobin',
      ],
    },
  },
  'chem-crystal-growth': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['晶体从哪里长出来', '结晶', '明矾', '晶种', '碘', '凝华', '同离子效应', '套色晶体'],
      en: ['Where crystals grow from', 'structure of matter', 'chemical evidence'],
    },
  },
  'chem-acid-evidence': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['弱酸的三种证据', '醋酸', '盐酸', '电离平衡', '压强传感器', '碳酸钠'],
      en: [
        'Three kinds of weak-acid evidence',
        'acetic acid',
        'hydrochloric acid',
        'ionization equilibrium',
        'pressure transducer',
        'sodium carbonate',
      ],
    },
  },
  'chem-protein-states': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['蛋白质的盐析与变性', '蛋白质', '盐析', '变性', '硫酸铵', '显色'],
      en: [
        'Protein salting out and denaturation',
        'protein',
        'salting out',
        'denaturation',
        'ammonium sulfate',
        'xanthoproteic',
      ],
    },
  },
  'chem-liquid-crystal': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['液晶的两次变化', '液晶', '莱尼采尔', '澄清点', '取向序', '相变', '显示器'],
      en: ['The two transitions of liquid crystals', 'structure of matter', 'chemical evidence'],
    },
  },
  'chem-sugar-tests': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['糖类的检验与水解', '还原糖', '淀粉', '葡萄糖', '蔗糖', '麦芽糖', '纤维素'],
      en: [
        'Sugar tests and hydrolysis',
        'reducing sugar',
        'starch',
        'glucose',
        'sucrose',
        'maltose',
        'cellulose',
      ],
    },
  },
  'chem-equilibrium-response': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['平衡改变之前，颜色先发生了什么', '化学平衡', '勒夏特列', '二氧化氮', '铜盐', '合成氨'],
      en: [
        'What changes before equilibrium shifts?',
        'chemical equilibrium',
        'Le Chatelier',
        'nitrogen dioxide',
        'copper complexes',
        'ammonia synthesis',
      ],
    },
  },
  'chem-chirality-evidence': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['手性、晶体与旋光证据', '手性', '对映体', '旋光', '巴斯德', '外消旋', '晶体分选'],
      en: ['Chirality, crystals and optical evidence', 'structure of matter', 'chemical evidence'],
    },
  },
  'chem-ester-reaction': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['乙酸乙酯的制备与水解', '乙酸乙酯', '乙酸', '酯化', '水解', '碳酸钠'],
      en: [
        'Preparing and hydrolysing an ester',
        'ethyl acetate',
        'ethanoic acid',
        'esterification',
        'hydrolysis',
        'sodium carbonate',
      ],
    },
  },
  'chem-reaction-rates': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['怎样比较化学反应的快慢', '化学反应速率', '硫代硫酸钠', '气体注射器', '催化剂'],
      en: [
        'How to compare reaction rates',
        'reaction rate',
        'thiosulfate',
        'gas syringe',
        'catalyst',
      ],
    },
  },
  'chem-hydrogen-bond-network': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['氢键与冰的开放结构', '氢键', '冰', '水', '四面体', '晶体', '密度'],
      en: [
        'Hydrogen bonds and the open structure of ice',
        'structure of matter',
        'chemical evidence',
      ],
    },
  },
  'chem-alcohol-oxidation': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['乙醇的两种氧化', '乙醇', '铜丝', '氧化铜', '重铬酸钾'],
      en: ['Two oxidation routes for ethanol', 'ethanol', 'copper', 'copper oxide', 'dichromate'],
    },
  },
  'chem-sodium-alcohol': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['钠与乙醇的证据链', '乙醇', '钠', '羟基', '氢气', '石灰水', '对照'],
      en: [
        'Evidence from sodium and ethanol',
        'ethanol',
        'sodium',
        'hydroxyl',
        'hydrogen',
        'limewater',
        'comparison',
      ],
    },
  },
  'chem-mass-spectrometry': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['质谱分离与分子式证据', '质谱', '分子离子', '碎片离子', '质荷比', '同位素', '分子式'],
      en: [
        'Mass separation and molecular-formula evidence',
        'structure of matter',
        'chemical evidence',
      ],
    },
  },
  'chem-galvanic-cells': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['原电池中的两条电荷通路', '锌铜原电池', '盐桥', '水果电池', '燃料电池'],
      en: [
        'Two charge pathways in a galvanic cell',
        'zinc copper cell',
        'salt bridge',
        'fruit battery',
        'fuel cell',
      ],
    },
  },
  'chem-unsaturated-hydrocarbons': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['乙烯与乙炔的性质证据', '乙烯', '乙炔', '高锰酸钾', '溴', '加成', '电石', '净化'],
      en: [
        'Evidence from ethene and ethyne',
        'ethene',
        'ethyne',
        'permanganate',
        'bromine',
        'addition',
        'calcium carbide',
        'purification',
      ],
    },
  },
  'chem-infrared-structure': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['红外吸收与结构证据', '红外光谱', '透过率', '吸光度', '振动', '羟基', '同分异构体'],
      en: [
        'Infrared absorption and structural evidence',
        'structure of matter',
        'chemical evidence',
      ],
    },
  },
  'chem-noble-gas-evidence': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['稀有气体的发现证据', '稀有气体', '氦', '氩', '氙', '光谱', '密度', '科学史'],
      en: ['Evidence behind noble-gas discoveries', 'structure of matter', 'chemical evidence'],
    },
  },
  'chem-methane-substitution': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['甲烷的光照取代', '甲烷', '氯气', '光照', '取代反应', '液滴'],
      en: [
        'Light-induced methane substitution',
        'methane',
        'chlorine',
        'light',
        'substitution',
        'droplets',
      ],
    },
  },
  'bio-biotechnology-investigation': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['转基因产品的证据调查', '转基因产品', '标识调查', '安全证书', '科普计划', '营销证据'],
      en: [
        'Investigating evidence about GM products',
        'GM products',
        'label investigation',
        'biosafety certificates',
        'science communication',
        'marketing evidence',
      ],
    },
  },
  'chem-polymer-networks': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['聚合物连接与吸水网络', '有机化学', '化学实验'],
      en: ['Polymer links and absorbing networks', 'organic chemistry', 'chemical evidence'],
    },
  },
  'chem-calorimetry': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['温差与融冰量热', '量热计', '中和热', '温差', '融冰', '拉瓦锡', '误差'],
      en: [
        'Temperature-rise and ice calorimetry',
        'calorimeter',
        'neutralisation',
        'temperature rise',
        'melting ice',
        'Lavoisier',
        'error',
      ],
    },
  },
  'bio-protein-design': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['从蛋白质功能到序列证据', '胰岛素', '赖脯胰岛素', '蛋白质工程', '序列比对', 'BLAST'],
      en: [
        'From protein function to sequence evidence',
        'insulin',
        'lispro',
        'protein engineering',
        'sequence alignment',
        'BLAST',
      ],
    },
  },
  'chem-bond-energy': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['键能账本与盖斯路径', '键能', '断键', '成键', '盖斯定律', '焓', '反应热'],
      en: [
        'Bond-energy accounts and Hess paths',
        'bond energy',
        'bond breaking',
        'bond formation',
        'Hess law',
        'enthalpy',
        'reaction heat',
      ],
    },
  },
  'chem-organic-detection': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['有机结构与鉴别证据', '有机化学', '化学实验'],
      en: [
        'Organic structures and identification evidence',
        'organic chemistry',
        'chemical evidence',
      ],
    },
  },
  'chem-soap-assembly': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['肥皂的形成与去污', '有机化学', '化学实验'],
      en: ['Soap formation and cleaning', 'organic chemistry', 'chemical evidence'],
    },
  },
  'chem-reaction-heat': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['反应热与冷热证据', '放热', '吸热', '反应热', '镁', '氯化铵', '氢氧化钡', '结冰'],
      en: [
        'Reaction heat and thermal evidence',
        'exothermic',
        'endothermic',
        'reaction heat',
        'magnesium',
        'ammonium chloride',
        'barium hydroxide',
        'freezing',
      ],
    },
  },
  'bio-dna-engineering': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['从DNA分子到电泳条带', '限制酶', 'DNA连接酶', 'DNA粗提取', 'PCR', '琼脂糖凝胶电泳'],
      en: [
        'From DNA molecules to gel bands',
        'restriction enzymes',
        'DNA ligase',
        'DNA extraction',
        'PCR',
        'agarose gel electrophoresis',
      ],
    },
  },
  'chem-aldehyde-tests': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['醛的两种还原检验', '有机化学', '化学实验'],
      en: ['Two reducing tests for aldehydes', 'organic chemistry', 'chemical evidence'],
    },
  },
  'chem-phenol-properties': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['苯酚的多种证据', '有机化学', '化学实验'],
      en: ['Phenol through several kinds of evidence', 'organic chemistry', 'chemical evidence'],
    },
  },
  'chem-rainwater-ph': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['雨水pH与测量证据', '雨水', '酸雨', 'pH', '参照', '校准', '平均酸度'],
      en: [
        'Rainwater pH and measurement evidence',
        'rainwater',
        'acid rain',
        'pH',
        'calibration',
        'uncertainty',
        'average acidity',
      ],
    },
  },
  'chem-elimination-substitution': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['取代、消去与证据', '有机化学', '化学实验'],
      en: ['Substitution, elimination and evidence', 'organic chemistry', 'chemical evidence'],
    },
  },
  'bio-embryo-engineering': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['胚胎的形成、转移与分割', '体外受精', '胚胎移植', '胚胎分割', '内细胞团'],
      en: [
        'Embryo formation, transfer and splitting',
        'in vitro fertilization',
        'embryo transfer',
        'embryo splitting',
        'inner cell mass',
      ],
    },
  },
  'chem-salt-purification': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['粗盐提纯的离子去向', '粗盐', '精盐', '沉淀', '过滤', '氯化钡', '碳酸钠'],
      en: [
        'Where ions go during salt purification',
        'crude salt',
        'purification',
        'precipitation',
        'filtration',
        'barium',
        'carbonate',
      ],
    },
  },
  'bio-animal-cell-engineering': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['动物细胞的培养与工程', '动物细胞培养', '单克隆抗体', '杂交瘤', '体细胞核移植'],
      en: [
        'Animal-cell culture and engineering',
        'animal cell culture',
        'monoclonal antibodies',
        'hybridomas',
        'somatic nuclear transfer',
      ],
    },
  },
  'chem-aromatic-comparison': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['萃取还是反应', '芳香烃', '苯', '甲苯', '溴水', '萃取', '侧链氧化'],
      en: ['Extraction or reaction', 'organic chemistry', 'chemical evidence'],
    },
  },
  'chem-ammonium-cycle': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['铵根检验与氨的收集', '铵根', '氨', '石蕊', '气体收集', '倒吸'],
      en: [
        'Testing ammonium and collecting ammonia',
        'ammonium',
        'ammonia',
        'litmus',
        'gas collection',
        'suck-back',
      ],
    },
  },
  'chem-nmr-hydrogen': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['氢谱里的结构线索', '核磁共振', '氢谱', '乙醇', '二甲醚', '积分'],
      en: ['Structural clues in proton NMR', 'organic chemistry', 'chemical evidence'],
    },
  },
  'chem-ammonium-smoke': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['氨与氯化氢的白烟', '氨', '氯化氢', '氯化铵', '白烟', '气溶胶'],
      en: [
        'Ammonia and hydrogen chloride: white smoke',
        'ammonia',
        'hydrogen chloride',
        'ammonium chloride',
        'white smoke',
        'aerosol',
      ],
    },
  },
  'bio-plant-cell-engineering': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['植物细胞的再生与融合', '菊花组织培养', '原生质体融合', '植物体细胞杂交', '激素配比'],
      en: [
        'Plant-cell regeneration and fusion',
        'chrysanthemum tissue culture',
        'protoplast fusion',
        'somatic hybridization',
        'hormone ratio',
      ],
    },
  },
  'chem-elemental-analysis': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['称出碳与氢', '李比希', '元素分析', '燃烧分析', '实验式'],
      en: ['Weighing carbon and hydrogen', 'organic chemistry', 'chemical evidence'],
    },
  },
  'chem-wohler-isomers': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['组成相同，结构不同', '同分异构', '维勒', '尿素', '顺反异构'],
      en: ['Same composition, different structures', 'organic chemistry', 'chemical evidence'],
    },
  },
  'chem-ammonia-fountain': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['氨的喷泉', '氨', '喷泉', '酚酞', '压差', '溶解'],
      en: [
        'The ammonia fountain',
        'ammonia',
        'fountain',
        'phenolphthalein',
        'pressure',
        'solubility',
      ],
    },
  },
  'bio-microbial-culture': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['从分散菌体到培养证据', '酵母纯培养', '微生物筛选', '尿素分解菌', '菌落计数'],
      en: [
        'From dispersed cells to culture evidence',
        'yeast pure culture',
        'microbial screening',
        'urea-degrading bacteria',
        'colony counting',
      ],
    },
  },
  'bio-evolution-evidence': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['进化证据与种群变化', '共同祖先', '进化', '自然选择', '基因频率', '抗生素', '隔离'],
      en: ['Evolutionary evidence and population change', 'cell biology', 'biology experiments'],
    },
  },
  'chem-nitrogen-oxides': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['氮氧化物的颜色与去向', '一氧化氮', '二氧化氮', '注射器', '硝酸', '铜', '氧气限制'],
      en: [
        'Nitrogen oxides: colour and fate',
        'nitric oxide',
        'nitrogen dioxide',
        'syringe',
        'nitric acid',
        'copper',
        'limiting oxygen',
      ],
    },
  },
  'bio-fermentation-pathways': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['发酵的容器与条件', '泡菜', '果酒果醋', '亚硝酸盐检测', '发酵罐'],
      en: [
        'Vessels and conditions in fermentation',
        'pickles',
        'wine and vinegar',
        'nitrite calibration',
        'bioreactor',
      ],
    },
  },
  'chem-sulfur-transformations': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: [
        '不同价态硫的转化',
        '硫',
        '价态',
        '硫化钠',
        '亚硫酸',
        '高锰酸钾',
        '铜',
        '浓硫酸',
        '硫化亚铁',
      ],
      en: [
        'Sulfur across oxidation states',
        'sulfur',
        'oxidation states',
        'sulfide',
        'permanganate',
        'copper',
        'sulfuric acid',
        'iron sulfide',
      ],
    },
  },
  'bio-conservation-evidence': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: [
        '环境调查与生态保护证据',
        '环境调查',
        '生物多样性保护',
        '沼气池',
        '生态工程',
        '碳汇样方',
      ],
      en: [
        'Evidence for environmental conservation',
        'environmental survey',
        'biodiversity conservation',
        'biogas digester',
        'ecological engineering',
        'carbon inventory',
      ],
    },
  },
  'bio-mutation-evidence': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['变异与实验判据', '突变', '染色体', '低温诱导', '病例对照', '倒位', '易位'],
      en: ['Variation and experimental evidence', 'cell biology', 'biology experiments'],
    },
  },
  'bio-gene-expression': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['基因表达与性状证据', '基因表达', '表观遗传', '甲基化', '柳穿鱼', '果蝇', '性状'],
      en: ['Gene expression and trait evidence', 'cell biology', 'biology experiments'],
    },
  },
  'chem-sugar-carbonization': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['蔗糖的脱水与膨胀', '浓硫酸', '蔗糖', '脱水性', '氧化性', '碳', '孔隙'],
      en: [
        'Sucrose dehydration and expansion',
        'concentrated sulfuric acid',
        'sucrose',
        'dehydration',
        'oxidation',
        'carbon',
        'porosity',
      ],
    },
  },
  'bio-ecosystem-stability': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['信息传递与生态系统稳定性', '化学信息', '蚕蛾醇', '负反馈', '抵抗力稳定性', '生态缸'],
      en: [
        'Information and ecosystem stability',
        'pheromone',
        'bombykol',
        'negative feedback',
        'resistance',
        'ecological tank',
      ],
    },
  },
  'bio-genetic-code': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['遗传密码与蛋白质合成', '遗传密码', '转录', '翻译', '移码', '多聚U', '核糖体'],
      en: ['Genetic code and protein synthesis', 'cell biology', 'biology experiments'],
    },
  },
  'chem-sulfur-dioxide': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['二氧化硫的连续观察', '二氧化硫', '品红', '漂白', '加热复色', '酸性'],
      en: [
        'Following sulfur dioxide',
        'sulfur dioxide',
        'fuchsin',
        'bleaching',
        'colour recovery',
        'acidity',
      ],
    },
  },
  'bio-soil-decomposition': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['土壤微生物的分解作用', '落叶腐烂', '淀粉分解', '土壤浸出液', '斐林试剂', '碘液'],
      en: [
        'Decomposition by soil microbes',
        'litter decay',
        'starch hydrolysis',
        'soil extract',
        'Fehling reagent',
        'iodine test',
      ],
    },
  },
  'chem-molecular-shapes': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: [
        '分子的空间形状',
        '分子空间结构',
        '价层电子对互斥',
        '气球模型',
        '键角',
        '偶极',
        '分子极性',
      ],
      en: [
        'Molecular shapes',
        'molecular shape',
        'VSEPR',
        'balloon analogy',
        'bond angle',
        'dipole',
        'polarity',
      ],
    },
  },
  'bio-dna-replication': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['DNA复制的证据与过程', '细胞', '生物实验'],
      en: ['Evidence and mechanism of DNA replication', 'cell biology', 'biology experiments'],
    },
  },
  'bio-ecosystem-energy': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['生态系统的能量与物质', '林德曼', '能量流动', '碳循环', '生物富集', '食物网调查'],
      en: [
        'Energy and matter in ecosystems',
        'Lindeman',
        'energy flow',
        'carbon cycle',
        'bioaccumulation',
        'food web investigation',
      ],
    },
  },
  'chem-carbon-frameworks': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: [
        '碳骨架与空间结构',
        '球棍模型',
        '甲烷',
        '乙烷',
        '乙烯',
        '乙炔',
        '二氯甲烷',
        '丁烷',
        '同分异构',
      ],
      en: [
        'Carbon frameworks in space',
        'ball and stick',
        'methane',
        'ethane',
        'ethene',
        'ethyne',
        'dichloromethane',
        'butane',
        'isomerism',
      ],
    },
  },
  'bio-dna-structure': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: [
        'DNA的搭档为什么不能随便换？',
        '互补配对',
        '氢键供体',
        '氢键受体',
        '碱基组成',
        '衍射',
        'DNA结构的约束与模型',
        '细胞',
        '生物实验',
      ],
      en: [
        'Why can DNA bases not take any partner?',
        'complementary pairing',
        'hydrogen bond donor',
        'hydrogen bond acceptor',
        'base composition',
        'diffraction',
        'DNA constraints and structural models',
        'cell biology',
        'biology experiments',
      ],
    },
  },
  'bio-community-survey': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['群落调查与演替', '生态位', '诱虫器', '土壤动物', '初生演替', '次生演替'],
      en: [
        'Community surveys and succession',
        'ecological niche',
        'Berlese funnel',
        'soil fauna',
        'primary succession',
        'secondary succession',
      ],
    },
  },
  'chem-bond-overlap': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['电子式与轨道重叠', '离子键', '共价键', '电子式', 'σ键', 'π键', '轨道重叠'],
      en: [
        'Lewis diagrams and orbital overlap',
        'ionic bond',
        'covalent bond',
        'Lewis diagram',
        'sigma',
        'pi',
        'orbital overlap',
      ],
    },
  },
  'bio-genetic-material': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['遗传物质的三条证据', '细胞', '生物实验'],
      en: ['Three lines of evidence for genetic material', 'cell biology', 'biology experiments'],
    },
  },
  'bio-community-interactions': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['竞争、捕食与群落', '草履虫竞争', '雪兔猞猁', '海星移除', '关键物种'],
      en: [
        'Competition, predation and communities',
        'Paramecium competition',
        'hare lynx',
        'sea star removal',
        'keystone predator',
      ],
    },
  },
  'chem-periodic-patterns': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['周期表与性质趋势', '周期表', '电子排布', '电负性', '电离能', '铬', '铜'],
      en: [
        'Periodic tables and property trends',
        'periodic table',
        'electron configuration',
        'electronegativity',
        'ionization energy',
        'chromium',
        'copper',
      ],
    },
  },
  'bio-linked-inheritance': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['性连锁、系谱与人群调查', '细胞', '生物实验'],
      en: ['Sex linkage, pedigrees and population surveys', 'cell biology', 'biology experiments'],
    },
  },
  'chem-atomic-models': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: [
        '原子模型与电子云',
        '原子模型',
        '道尔顿',
        '汤姆孙',
        '卢瑟福',
        '玻尔',
        '电子云',
        '原子轨道',
        '原子模型与证据',
        '看不见原子，凭什么改变原子模型？',
      ],
      en: [
        'Atomic models and electron clouds',
        'atomic models',
        'Dalton',
        'Thomson',
        'Rutherford',
        'Bohr',
        'electron cloud',
        'orbital',
        'Atomic models and evidence',
        'What evidence can change an atomic model?',
      ],
    },
  },
  'bio-population-growth': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['种群增长与培养计数', '酵母菌', '血细胞计数板', '种群增长', '郁闭度'],
      en: [
        'Population growth and culture counts',
        'yeast',
        'hemocytometer',
        'population growth',
        'carrying capacity',
      ],
    },
  },
  'chem-periodic-practical': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: [
        '同周期与同主族的实验比较',
        '实验4-1',
        '实验活动3',
        '第三周期',
        '氯溴碘',
        '镁',
        '氢氧化铝',
        '元素性质与证据',
        '怎样从反应现象推出元素的性质？',
      ],
      en: [
        'Experimental comparisons across a period and a group',
        'periodic trends',
        'halogen displacement',
        'magnesium water',
        'aluminium hydroxide',
        'spotting tile',
        'Element properties and evidence',
        'How can reactions reveal element properties?',
      ],
    },
  },
  'bio-meiosis': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['减数分裂与染色体传递', '细胞', '生物实验'],
      en: ['Meiosis and chromosome transmission', 'cell biology', 'biology experiments'],
    },
  },
  'bio-population-sampling': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['种群调查与取样', '样方', '标记重捕', '黑光灯', '种群密度'],
      en: [
        'Population surveys and sampling',
        'quadrats',
        'mark recapture',
        'light traps',
        'population density',
      ],
    },
  },
  'chem-iron-practical': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: [
        '铁及其化合物的实验活动',
        '实验活动2',
        '铁丝',
        '铜片',
        '碘化钾',
        '锌片',
        '高锰酸钾',
        '铁的电子去向',
        '二价铁为什么既能得电子，也能失电子？',
      ],
      en: [
        'Practical investigations of iron and its compounds',
        'iron practical',
        'copper displacement',
        'iodide starch',
        'zinc',
        'permanganate',
        'Where iron’s electrons go',
        'Why can iron two both accept and donate electrons?',
      ],
    },
  },
  'chem-food-iron': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['食品中铁元素的检验', '菠菜', '食品检铁', '过滤', '硫氰化钾'],
      en: ['Testing for iron in food', 'spinach', 'food iron test', 'filtration', 'thiocyanate'],
    },
  },
  'chem-aluminium-film': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['铝表面的氧化膜与酸碱反应', '铝片', '氧化铝', '盐酸', '氢氧化钠', '实验3-4', '实验3-5'],
      en: [
        'Aluminium oxide films in acid and base',
        'aluminium',
        'aluminum',
        'oxide film',
        'hydrochloric acid',
        'sodium hydroxide',
      ],
    },
  },
  'chem-copper-etching': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['覆铜板蚀刻与图案保留', '覆铜板', '蚀刻', '氯化铁', '印刷电路板'],
      en: [
        'Copper etching and protected patterns',
        'copper clad board',
        'etching',
        'ferric chloride',
        'printed circuit board',
      ],
    },
  },
  'bio-plant-environment': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['植物的环境感知', '光敏色素', '春化', '重力', '根冠'],
      en: [
        'Environmental sensing in plants',
        'phytochrome',
        'vernalization',
        'gravitropism',
        'root cap',
      ],
    },
  },
  'bio-mendel-crosses': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['孟德尔的豌豆杂交', '细胞', '生物实验'],
      en: ['Mendel’s pea crosses', 'cell biology', 'biology experiments'],
    },
  },
  'chem-iron-hydroxides': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['铁的氢氧化物与空气氧化', '氢氧化亚铁', '氢氧化铁', '实验3-1', '沉淀颜色'],
      en: [
        'Iron hydroxides and oxidation by air',
        'ferrous hydroxide',
        'ferric hydroxide',
        'oxygen',
        'precipitate',
      ],
    },
  },
  'bio-cell-fates': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['细胞的分化、衰老与凋亡', '细胞', '生物实验'],
      en: ['Differentiation, senescence and cell death', 'cell biology', 'biology experiments'],
    },
  },
  'chem-iron-steam': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: [
        '铁与水蒸气的反应',
        '铁粉',
        '水蒸气',
        '四氧化三铁',
        '氢气',
        '气体离开，固体为什么会增重？',
      ],
      en: [
        'Iron reacting with steam',
        'iron powder',
        'steam',
        'magnetite',
        'hydrogen',
        'Why can the solid gain mass as gas leaves?',
      ],
    },
  },
  'bio-plant-growth-regulators': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['植物生长调节剂的探究', '赤霉素', '插条生根', '乙烯利'],
      en: ['Investigating plant growth regulators', 'gibberellin', 'rooting cuttings', 'ethephon'],
    },
  },
  'chem-iron-cycle': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: [
        '铁离子的显色与转化',
        '铁离子',
        '亚铁离子',
        '硫氰酸根',
        '配合平衡',
        '红色究竟在报告什么？',
      ],
      en: [
        'Iron-ion colour, redox and coordination',
        'iron III',
        'iron II',
        'thiocyanate',
        'coordination equilibrium',
        'Iron colour, redox and coordination',
        'What does red actually report?',
      ],
    },
  },
  'bio-cell-division': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: [
        '细胞分裂与固定观察',
        '有丝分裂',
        '根尖',
        '细胞周期',
        'mitosis',
        '细胞分裂：形态、顺序与计数',
      ],
      en: [
        'Cell division and fixed specimens',
        'cell biology',
        'biology experiments',
        'Cell division: shape, order and counting',
      ],
    },
  },
  'bio-auxin-evidence': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['生长素的证据链', '向光性', '胚芽鞘', '极性运输'],
      en: ['Evidence for auxin', 'phototropism', 'coleoptile', 'polar transport'],
    },
  },
  'bio-photosynthesis-evidence': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: [
        '光合作用的证据链',
        '光合作用',
        '恩格尔曼',
        '希尔反应',
        '卡尔文',
        '光怎样变成推动合成的能量？',
      ],
      en: [
        'Evidence for photosynthesis',
        'cell biology',
        'biology experiments',
        'How can light supply energy for synthesis?',
      ],
    },
  },
  'chem-hydrogen-chlorine': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['氢气在氯气中燃烧', '氢气', '氯气', '氯化氢', '白雾'],
      en: [
        'Hydrogen burning in chlorine',
        'hydrogen',
        'chlorine',
        'hydrogen chloride',
        'acid mist',
      ],
    },
  },
  'chem-chlorine-discovery': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: [
        '氯气：证据与解释',
        '产物里有氧，就能断定气体含氧吗？',
        '氧的来源',
        '元素守恒',
        '氧化铅',
        '戴维',
        '解释与证据',
        '氯气：发现、收集与尾气',
        '舍勒',
        '氯气',
        '尾气吸收',
      ],
      en: [
        'Chlorine: evidence and explanation',
        'Does oxygen in a product prove that the gas contained oxygen?',
        'oxygen source',
        'atom conservation',
        'lead oxide',
        'Davy',
        'evidence and explanation',
        'Chlorine: discovery, collection and tail gas',
        'Scheele',
        'chlorine',
        'tail gas absorption',
      ],
    },
  },
  'bio-leaf-pigments': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: [
        '叶片的色带与光谱',
        '叶绿素',
        '层析',
        '吸收光谱',
        'chromatography',
        '同一滴绿色，为什么会分成几条色带？',
      ],
      en: [
        'Leaf bands and spectra',
        'cell biology',
        'biology experiments',
        'Why does one green spot separate into several bands?',
      ],
    },
  },
  'chem-chlorine-photolysis': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: [
        '氯水光照的三路证据',
        '氯水',
        '光照分解',
        '次氯酸',
        'pH传感器',
        '氯水光解：从光到读数',
        '光怎样让三路读数一起变化？',
      ],
      en: [
        'Three channels of chlorine-water photolysis evidence',
        'chlorine water',
        'photolysis',
        'hypochlorous acid',
        'pH sensor',
        'Chlorine-water photolysis: from light to readings',
        'How can light change all three readings?',
      ],
    },
  },
  'bio-immune-pathways': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['免疫路径与证据', '脑膜淋巴管', '抗体', '特异性免疫'],
      en: [
        'Immune pathways and evidence',
        'meningeal lymphatics',
        'antibodies',
        'adaptive immunity',
      ],
    },
  },
  'chem-chlorine-bleaching': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['干湿对照与氯气漂白', '氯气', '漂白', '干湿纸条', '次氯酸'],
      en: [
        'Dry and damp controls in chlorine bleaching',
        'chlorine',
        'bleaching',
        'dry and damp paper',
        'hypochlorous acid',
      ],
    },
  },
  'bio-respiration': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: [
        '呼吸的气路与碳路径',
        '呼吸作用',
        '酵母菌',
        'ATP',
        'respiration',
        '发酵究竟让什么重新流动起来？',
      ],
      en: [
        'Respiratory gas and carbon pathways',
        'cell biology',
        'biology experiments',
        'What does fermentation set flowing again?',
      ],
    },
  },
  'chem-solution-preparation': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['容量瓶与定量配液', '容量瓶', '定容', '洗涤', '稀释'],
      en: [
        'Volumetric preparation and dilution',
        'volumetric flask',
        'quantitative transfer',
        'meniscus',
        'dilution',
      ],
    },
  },
  'bio-enzyme-investigations': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['细胞为什么靠酶加速反应？', '酶的证据与条件', '酶', '过氧化氢酶', '专一性', 'enzyme'],
      en: [
        'Why do cells rely on enzymes to speed reactions?',
        'Enzyme evidence and conditions',
        'cell biology',
        'biology experiments',
      ],
    },
  },
  'bio-neural-evidence': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['神经研究与病例证据', '条件反射', '脑损伤病例', '皮层运动区'],
      en: ['Neural research and clinical evidence', 'conditioning', 'cortical mapping', 'aphasia'],
    },
  },
  'chem-anion-tests': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['阴离子的两步证据', '氯离子', '硫酸根', '碳酸根干扰', '硝酸银'],
      en: [
        'Two-step evidence for anions',
        'chloride',
        'sulfate',
        'carbonate interference',
        'silver nitrate',
      ],
    },
  },
  'chem-precipitation-paths': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: [
        '沉淀的生成、溶解与转化',
        '沉淀变了，怎样证明离子的去向？',
        '沉淀转化',
        '硫酸钡',
        '氢氧化镁溶解',
      ],
      en: [
        'Precipitation, dissolution and conversion',
        'When a precipitate changes, how can we trace its ions?',
        'precipitate conversion',
        'barium sulfate',
        'magnesium hydroxide dissolution',
      ],
    },
  },
  'bio-nuclear-evidence': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['细胞核的七组证据', '细胞核', '核移植', '伞藻'],
      en: ['Seven lines of evidence about the nucleus', 'cell biology', 'biology experiments'],
    },
  },
  'bio-endocrine-evidence': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['激素研究的对照证据', '减法与加法 · 内分泌反馈', '人教版高中生物'],
      en: [
        'Controlled evidence for hormone action',
        'Removal and rescue · endocrine feedback',
        'PEP high school biology',
      ],
    },
  },
  'bio-body-fluid-balance': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['体液交换与稳态记录', '体液联系 · 调查记录 · 稳态', '人教版高中生物'],
      en: [
        'Fluid exchange and homeostasis records',
        'Fluid connections · records · homeostasis',
        'PEP high school biology',
      ],
    },
  },
  'bio-engineered-genomes': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: [
        '合成基因组与活细胞',
        '合成生物学',
        '染色体',
        '酵母',
        '合成了DNA，为什么还不能说合成了整个细胞？',
        '基因表达',
        '细胞机器',
        '固定生长记录',
      ],
      en: [
        'Synthetic genomes and living cells',
        'cell biology',
        'biology experiments',
        'Why does synthesizing DNA not mean synthesizing a whole cell?',
        'gene expression',
        'cellular machinery',
        'published growth data',
      ],
    },
  },
  'chem-electron-transfer': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: [
        '电子得失与电子对偏移',
        '电子账本怎样决定反应配比？',
        '氧化还原',
        '电子转移',
        '共用电子对',
      ],
      en: [
        'Electron transfer and polar sharing',
        'How does electron counting fix reaction ratios?',
        'oxidation reduction',
        'electron transfer',
        'polar shared pair',
      ],
    },
  },
  'bio-cellular-logistics': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: [
        '没有拍到全过程，怎样知道蛋白质走过哪里？',
        '细胞里的分泌路线',
        '分泌蛋白',
        '同位素示踪',
        '细胞器',
      ],
      en: [
        'Without filming the whole journey, how can we infer the route of a protein?',
        'The cellular secretion route',
        'cell biology',
        'biology experiments',
      ],
    },
  },
  'chem-flame-spectra': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: [
        '原子为什么只发出特定颜色的光？',
        '能级差',
        '光子能量',
        '吸收光谱',
        '钴玻璃',
        '钠钾焰色',
        '焰色与原子光谱',
        '焰色试验',
        '发射吸收光谱',
      ],
      en: [
        'Why do atoms emit particular colours of light?',
        'energy gaps',
        'photon energy',
        'absorption spectrum',
        'cobalt glass',
        'sodium and potassium flames',
        'Flame colours and atomic spectra',
        'flame test',
        'emission absorption spectra',
      ],
    },
  },
  'bio-protein-machines': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: [
        '从肽键到胰岛素',
        '胰岛素',
        '肽键',
        '二硫键',
        '蛋白质的连接与功能',
        '数量和外形都对了，蛋白质就一定能工作吗？',
      ],
      en: [
        'From peptide bonds to insulin',
        'cell biology',
        'biology experiments',
        'Protein connections and function',
        'Do matching counts and appearance establish a working protein?',
      ],
    },
  },
  'chem-sodium-reactions': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: [
        '钠、氧化物与过氧化物',
        '同样含钠，为什么反应产物不同？',
        '钠与过氧化钠的证据链',
        '钠与水',
        '过氧化钠',
        '碱金属',
      ],
      en: [
        'Sodium, oxide and peroxide',
        'Why do substances containing sodium give different products?',
        'Evidence from sodium and sodium peroxide',
        'sodium and water',
        'sodium peroxide',
        'alkali metals',
      ],
    },
  },
  'bio-osmosis': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: [
        '水为什么穿过细胞膜',
        '细胞怎样吸水',
        '渗透作用',
        '质壁分离',
        '水通道',
        '水势',
        '膨压',
        '盐水',
        '菜叶变软',
      ],
      en: [
        'Why water crosses a cell membrane',
        'How cells gain and lose water',
        'osmosis',
        'water potential',
        'turgor',
        'aquaporin',
        'limp leaves',
        'salt water',
      ],
    },
  },
  'chem-carbonate-comparison': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['两种碳酸盐的对照', '碳酸钠', '碳酸氢钠', '热稳定性'],
      en: [
        'Comparing carbonate and bicarbonate',
        'Comparing two carbonate salts',
        'sodium carbonate',
        'sodium bicarbonate',
        'thermal stability',
      ],
    },
  },
  'bio-membrane-evidence': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: [
        '看不清细胞膜，怎样知道它长什么样？',
        '细胞膜的证据链',
        '细胞膜',
        '流动镶嵌模型',
        '细胞融合',
      ],
      en: [
        'How can we infer a membrane too thin to see?',
        'Evidence for membrane structure',
        'cell biology',
        'biology experiments',
      ],
    },
  },
  'bio-chemical-signals': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['可转移的化学信号', '营养液转移 · 化学信使', '人教版高中生物'],
      en: [
        'A transferable chemical signal',
        'Fluid transfer · chemical messengers',
        'PEP high school biology',
      ],
    },
  },
  'bio-nerve-signals': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['神经信号的实验线索', '差分电位 · 突触 · 实验解释', '人教版高中生物'],
      en: [
        'Experimental clues to nerve signaling',
        'Differential voltage · synapses · evidence',
        'PEP high school biology',
      ],
    },
  },
  'bio-buffer-comparison': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['内环境的缓冲实验', '酸碱扰动 · 缓冲容量', '人教版高中生物'],
      en: [
        'Buffering the internal environment',
        'Acid–base disturbance · buffer capacity',
        'PEP high school biology',
      ],
    },
  },
  'chem-ionic-conduction': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: ['电解质与电流', '电解质', '氯化钠导电', '离子电离'],
      en: [
        'Electrolytes and current',
        'electrolyte',
        'sodium chloride conductivity',
        'ionic dissociation',
      ],
    },
  },
  'chem-colloid-light': {
    category: 'chemistry',
    minAge: 14,
    keywords: {
      zh: [
        '看见光的条件',
        '胶体中的光路',
        '丁达尔效应',
        '氢氧化铁',
        '侧向散射',
        '看见光',
        '入眼光路',
        '尘埃',
        '光柱',
      ],
      en: [
        'What makes light visible',
        'Light paths in a colloid',
        'Tyndall effect',
        'iron hydroxide',
        'side scattering',
        'visible light beam',
        'dust',
        'eye',
        'polarization',
      ],
    },
  },
  'bio-food-tests': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: ['食物中的三种证据', '还原糖', '苏丹Ⅲ', '双缩脲'],
      en: ['Three food assays', 'cell biology', 'biology experiments'],
    },
  },
  'bio-cell-microscopy': {
    category: 'life',
    minAge: 14,
    keywords: {
      zh: [
        '显微镜里，细胞和图像怎样变化？',
        '细胞学说',
        '细胞来源',
        '放大与分辨率',
        '视野',
        '装片漂移',
        '细胞质流动',
        '显微镜中的细胞',
        '显微镜',
        '叶绿体',
      ],
      en: [
        'What changes under the microscope: the cell or its image?',
        'cell theory',
        'cell origins',
        'magnification and resolution',
        'field of view',
        'slide drift',
        'cytoplasmic streaming',
        'Cells under the microscope',
        'cell biology',
        'biology experiments',
      ],
    },
  },
  'singing-basin': {
    category: 'light-sound',
    minAge: 14,
    keywords: {
      zh: ['摩擦铜盆的振动与水花', '龙洗', '铜盆喷水', '摩擦盆耳', '自激振动', '模态', '振动腹'],
      en: [
        'The singing bronze basin',
        'dragon washbasin',
        'friction excitation',
        'self-excited vibration',
        'water fountains',
        'antinodes',
      ],
    },
  },
  'pendulum-measurement-lab': {
    category: 'mechanisms',
    minAge: 14,
    keywords: {
      zh: ['单摆的记录与测量', '单摆测重力', '杆线摆', '滴墨摆'],
      en: [
        'Recording and Measuring Pendulums',
        'pendulum gravity measurement',
        'inclined pendulum',
        'ink pendulum',
      ],
    },
  },
  'forced-oscillation-lab': {
    category: 'mechanisms',
    minAge: 14,
    keywords: {
      zh: ['电机驱动与共振摆', '受迫振动', '共振', '共振摆'],
      en: [
        'Motor Drive and Resonance Pendulums',
        'forced oscillation',
        'resonance',
        'coupled pendulums',
      ],
    },
  },
  'recoil-lab': {
    category: 'thermal-fluids',
    minAge: 12,
    keywords: {
      zh: ['气球与喷水容器的反冲', '反冲气球', '喷水旋转容器', '弯管喷水'],
      en: [
        'Recoil of balloons and water rotors',
        'balloon recoil',
        'rotating water vessel',
        'tangential jets',
      ],
    },
  },
  'floating-oscillator': {
    category: 'thermal-fluids',
    minAge: 14,
    keywords: {
      zh: ['浮筷的上下振动', '浮力', '回复力', '简谐运动'],
      en: ['A Floating Chopstick Oscillator', 'buoyancy', 'restoring force', 'harmonic motion'],
    },
  },
  'doppler-lab': {
    category: 'light-sound',
    minAge: 14,
    keywords: {
      zh: [
        '旋转蜂鸣器与行进队列',
        '旋转蜂鸣器',
        '竹竿',
        '多普勒效应',
        '行进队列',
        '接收频率',
        '波峰',
      ],
      en: [
        'Rotating buzzer and marching queue',
        'rotating buzzer',
        'bamboo rod',
        'Doppler effect',
        'marching queue',
        'received frequency',
        'wave crests',
      ],
    },
  },
  'spring-oscillation-lab': {
    category: 'mechanisms',
    minAge: 14,
    keywords: {
      zh: ['弹簧振动的记录与测量', '简谐运动', '周期测量', '相位', '频闪照片'],
      en: [
        'Recording and Measuring Spring Oscillations',
        'simple harmonic motion',
        'period measurement',
        'phase',
        'strobe recording',
      ],
    },
  },
  'ramp-collision-lab': {
    category: 'mechanisms',
    minAge: 14,
    keywords: {
      zh: ['斜槽小球碰撞实验', '斜槽动量守恒', '平抛碰撞', '落点法'],
      en: [
        'Ball collisions at a ramp outlet',
        'ramp momentum',
        'projectile collision',
        'landing distances',
      ],
    },
  },
  'momentum-collision-lab': {
    category: 'mechanisms',
    minAge: 14,
    keywords: {
      zh: ['碰撞中的不变量', '动量守恒', '气垫导轨', '悬球碰撞', '粘连小车'],
      en: [
        'Invariants in Collisions',
        'momentum conservation',
        'air track',
        'hanging-ball collision',
        'sticking carts',
      ],
    },
  },
  'sound-interference-lab': {
    category: 'light-sound',
    minAge: 14,
    keywords: {
      zh: ['双扬声器的声音干涉', '相干', '扬声器', '声音干涉', '路程差', '强弱分布'],
      en: [
        'Sound interference from two speakers',
        'coherent speakers',
        'sound interference',
        'path difference',
        'loud quiet regions',
      ],
    },
  },
  'sound-measurement-lab': {
    category: 'light-sound',
    minAge: 14,
    keywords: {
      zh: [
        '声音的频率与传播测量',
        '录音波形',
        'do sol',
        '频率比',
        '日内瓦湖',
        '水中声速',
        '听音器',
      ],
      en: [
        'Measuring sound frequency and propagation',
        'recorded waveform',
        'do sol',
        'frequency ratio',
        'Lake Geneva',
        'underwater sound',
        'listening horn',
      ],
    },
  },
  'arm-motion-lab': {
    category: 'mechanisms',
    minAge: 14,
    keywords: {
      zh: ['甩手与投掷的运动研究', '甩手水滴', '标枪课题', '手机加速度'],
      en: [
        'Studying arm flicks and throwing',
        'hand flick',
        'javelin research',
        'phone acceleration',
      ],
    },
  },
  'impulse-contact-lab': {
    category: 'mechanisms',
    minAge: 14,
    keywords: {
      zh: ['接住与停下的力', '同样停下来，为什么感觉到的力不同？', '近代物理实验'],
      en: [
        'Forces in catching and stopping',
        'Why can stopping produce different forces?',
        'modern physics experiment',
      ],
    },
  },
  'ripple-tank-lab': {
    category: 'light-sound',
    minAge: 14,
    keywords: {
      zh: ['水波槽中的传播与叠加', '纸屑', '反射', '折射', '衍射', '相干', '水波多普勒'],
      en: [
        'Propagation and superposition in a ripple tank',
        'floating paper',
        'reflection',
        'refraction',
        'diffraction',
        'coherence',
        'moving ripple source',
      ],
    },
  },
  'mechanical-energy-lab': {
    category: 'mechanisms',
    minAge: 14,
    keywords: {
      zh: ['验证机械能守恒', '纸带机械能', '气垫导轨', '光电门'],
      en: [
        'Testing mechanical-energy conservation',
        'ticker tape energy',
        'air track',
        'photogate',
      ],
    },
  },
  'ellipse-string-lab': {
    category: 'math-systems',
    minAge: 12,
    keywords: {
      zh: ['细绳绘制椭圆', '椭圆焦点', '细绳作图', '开普勒轨道'],
      en: ['Drawing an ellipse with string', 'ellipse foci', 'string construction', 'Kepler orbit'],
    },
  },
  'centripetal-force-lab': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['向心力实验', '向心力演示器', '沙袋', '漏斗小球'],
      en: [
        'Centripetal-force experiments',
        'centripetal demonstrator',
        'conical pendulum',
        'funnel orbit',
      ],
    },
  },
  'phone-energy-research': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['手机耗电因素研究', '手机耗电', '控制变量', '能量积分', '课题研究'],
      en: [
        'Researching Phone Energy Use',
        'phone energy use',
        'controlled variables',
        'energy integration',
        'research design',
      ],
    },
  },
  'electromagnetic-wave-receiver': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['捕捉电磁波', '电磁波接收', '铜管天线', '射频检波'],
      en: [
        'Detecting Electromagnetic Waves',
        'RF reception',
        'copper-tube antennas',
        'RF detector',
      ],
    },
  },
  'thermal-process-lab': {
    category: 'thermal-fluids',
    minAge: 14,
    keywords: {
      zh: ['电热、冷却与热辐射', '焦耳定律', '热鸡蛋', '铁块发光', '量热器'],
      en: [
        'Heating, Cooling and Thermal Radiation',
        'Joule heating',
        'egg cooling',
        'glowing iron',
        'calorimetry',
      ],
    },
  },
  'mechanical-wave-lab': {
    category: 'light-sound',
    minAge: 14,
    keywords: {
      zh: ['绳波、人浪与弹簧波', '机械波', '横波', '纵波', '绳波', '人浪', '疏密波'],
      en: [
        'Ropes, human waves and spring waves',
        'mechanical waves',
        'transverse',
        'longitudinal',
        'rope pulse',
        'human wave',
        'compression',
      ],
    },
  },
  'polarization-evidence-lab': {
    category: 'light-sound',
    minAge: 14,
    keywords: {
      zh: ['从绳的方向到光的偏振', '转动一道狭缝，能筛选什么？', '教材光学实验'],
      en: [
        'From rope motion to optical polarization',
        'What can a rotating slit select?',
        'textbook optics experiment',
      ],
    },
  },
  'optical-diffraction-lab': {
    category: 'light-sound',
    minAge: 14,
    keywords: {
      zh: ['从狭缝到阴影中的亮点', '缝变窄，光为什么反而铺得更开？', '教材光学实验'],
      en: [
        'From a slit to light inside a shadow',
        'Why does a narrower gap spread light farther?',
        'textbook optics experiment',
      ],
    },
  },
  'double-slit-measurement-lab': {
    category: 'light-sound',
    minAge: 14,
    keywords: {
      zh: ['把干涉条纹变成测量', '如何从几个亮纹读出光的波长？', '教材光学实验'],
      en: [
        'Measure with interference fringes',
        'How can a few bright fringes reveal wavelength?',
        'textbook optics experiment',
      ],
    },
  },
  'thin-film-lab': {
    category: 'light-sound',
    minAge: 14,
    keywords: {
      zh: ['膜厚写出的明暗', '肥皂膜与劈尖的条纹为什么移动？', '教材光学实验'],
      en: [
        'Brightness written by film thickness',
        'Why do soap-film and wedge fringes move?',
        'textbook optics experiment',
      ],
    },
  },
  'induction-conditions-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['感应电流的产生条件', '电磁感应', '滑杆', '磁通量', '内外线圈'],
      en: [
        'Conditions for Induced Current',
        'electromagnetic induction',
        'sliding rod',
        'magnetic flux',
        'nested coils',
      ],
    },
  },
  'total-reflection-lab': {
    category: 'light-sound',
    minAge: 14,
    keywords: {
      zh: ['沿界面追踪全反射', '光为什么能沿弯棒和水流前进？', '教材光学实验'],
      en: [
        'Trace total reflection at boundaries',
        'How can light follow a curved rod or water jet?',
        'textbook optics experiment',
      ],
    },
  },
  'gas-efficiency-lab': {
    category: 'thermal-fluids',
    minAge: 14,
    keywords: {
      zh: ['燃气加热的效率研究', '燃气灶', '火力', '燃气表', '热水器', '热效率'],
      en: [
        'Investigating gas-heating efficiency',
        'gas stove',
        'flame setting',
        'gas meter',
        'water heater',
        'thermal efficiency',
      ],
    },
  },
  'bicycle-circular-motion': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['自行车上的圆周运动', '链条', '角速度', '同轴线速度'],
      en: ['Circular motion on a bicycle', 'chain drive', 'angular velocity', 'tangential speed'],
    },
  },
  'wire-force-factors-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['通电导线受力因素', '安培力', '有效长度', '磁感应强度'],
      en: [
        'Factors in Magnetic Force on a Wire',
        'magnetic force',
        'effective length',
        'magnetic flux density',
      ],
    },
  },
  'diffusion-microstates-lab': {
    category: 'thermal-fluids',
    minAge: 14,
    keywords: {
      zh: ['扩散与微观状态', '颜料', '自由扩散', '气体隔板', '熵', '热力学第二定律'],
      en: [
        'Diffusion and microstates',
        'dye',
        'gas expansion',
        'partition',
        'entropy',
        'irreversibility',
      ],
    },
  },
  'projectile-motion-lab': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: [
        '平抛运动实验',
        '平抛描迹',
        '同时落地',
        '复写纸',
        '测初速度',
        '平抛：同一时钟，两个方向',
        '水平抛得更快，会更晚落地吗？',
      ],
      en: [
        'Horizontal projectile experiments',
        'projectile tracing',
        'paired release',
        'carbon paper',
        'launch velocity',
        'Horizontal launch: one clock, two directions',
        'Does a faster sideways launch land later?',
      ],
    },
  },
  'drinking-bird-lab': {
    category: 'thermal-fluids',
    minAge: 14,
    keywords: {
      zh: ['饮水鸭的热机循环', '饮水鸟', '蒸发', '蒸气压', '热机'],
      en: [
        'The drinking bird heat engine',
        'dipping bird',
        'evaporation',
        'vapour pressure',
        'heat engine',
      ],
    },
  },
  'geometric-optics-lab': {
    category: 'light-sound',
    minAge: 14,
    keywords: {
      zh: ['从光路重建折射与像', '看到的针、筷子和文字，在哪里？', '教材光学实验'],
      en: [
        'Reconstruct refraction and images from rays',
        'Where are the pins, chopstick and text that we see?',
        'textbook optics experiment',
      ],
    },
  },
  'magnetic-field-survey': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['电流与磁场分布', '奥斯特实验', '铁屑磁场', '小磁针', '环形电流', '螺线管'],
      en: [
        'Current and Magnetic-Field Patterns',
        'Oersted experiment',
        'iron filings',
        'compass',
        'current loop',
        'solenoid',
      ],
    },
  },
  'wax-motion-composition': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['蜡块运动的合成与分解', '蜡块', '运动合成', '分运动'],
      en: [
        'Composing the motion of a wax float',
        'wax float',
        'motion composition',
        'velocity vectors',
      ],
    },
  },
  'thermodynamic-work-lab': {
    category: 'thermal-fluids',
    minAge: 14,
    keywords: {
      zh: ['功、热与内能实验', '压缩引火', '焦耳实验', '搅水', '热功当量', '瓶中云', '伦福德'],
      en: [
        'Work, heat and internal-energy experiments',
        'fire piston',
        'Joule calorimeter',
        'mechanical equivalent of heat',
        'cloud in a bottle',
        'Rumford',
      ],
    },
  },
  'curved-motion-lab': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['曲线运动的速度方向', '曲线切线', '弧形轨道', '磁铁钢球', '飞镖'],
      en: [
        'Velocity directions in curved motion',
        'tangent',
        'arc track',
        'magnetic deflection',
        'finned dart',
      ],
    },
  },
  'cosmology-observations': {
    category: 'nature',
    minAge: 14,
    keywords: {
      zh: [
        '星系红移与微波天空',
        '宇宙的历史，怎样藏在收到的光里？',
        '近代物理实验',
        '怎样从光读出膨胀的宇宙？',
      ],
      en: [
        'Galaxy redshifts and the microwave sky',
        'How does received light reveal cosmic history?',
        'modern physics experiment',
        'How can light reveal an expanding universe?',
      ],
    },
  },
  'electrostatic-applications-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['静电应用实验', '静电屏蔽', '金属网罩', '静电除尘', '烟粒荷电'],
      en: [
        'Electrostatic Applications',
        'Faraday cage',
        'electrostatic shielding',
        'electrostatic precipitator',
        'charged smoke',
      ],
    },
  },
  'gravitational-wave-lab': {
    category: 'nature',
    minAge: 14,
    keywords: {
      zh: [
        '极微小的变化，怎样变成可信的读数？',
        '引力波',
        '光程差',
        '光学读出',
        '回程相位',
        '独立观测',
        '引力波证据的三条路径',
        '极微小的时空变化，怎样被辨认？',
        '近代物理实验',
      ],
      en: [
        'How does a tiny change become a reliable measurement?',
        'gravitational waves',
        'optical path difference',
        'optical readout',
        'returning phase',
        'independent observations',
        'Three paths to gravitational-wave evidence',
        'How can extremely small spacetime changes be identified?',
        'modern physics experiment',
      ],
    },
  },
  'balloon-drag-lab': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['气球空气阻力研究', '气球终端速度', '阻力拟合', '视频分析'],
      en: [
        'Investigating balloon air drag',
        'terminal speed',
        'drag fitting',
        'video measurements',
      ],
    },
  },
  'magdeburg-bowls-lab': {
    category: 'thermal-fluids',
    minAge: 14,
    keywords: {
      zh: ['钢碗中的马德堡实验', '马德堡半球', '钢碗', '气体等容变化', '大气压'],
      en: [
        'The Magdeburg experiment with steel bowls',
        'Magdeburg hemispheres',
        'steel bowls',
        'atmospheric pressure',
        'constant volume cooling',
      ],
    },
  },
  'surface-tension-lab': {
    category: 'thermal-fluids',
    minAge: 14,
    keywords: {
      zh: ['液体表面张力实验', '曲别针满杯', '肥皂膜棉线', '浸润', '接触角', '浮针'],
      en: [
        'Liquid surface-tension experiments',
        'brim full glass',
        'soap film thread',
        'wetting',
        'contact angle',
        'floating needle',
      ],
    },
  },
  'relativity-experiments': {
    category: 'nature',
    minAge: 14,
    keywords: {
      zh: [
        '光、事件与时钟',
        '相对论怎样接受实验检验？',
        '近代物理实验',
        '同一次实验，为什么时间不同？',
      ],
      en: [
        'Light, events and clocks',
        'How is relativity tested experimentally?',
        'modern physics experiment',
        'Same experiment, different times?',
      ],
    },
  },
  'motion-sensor-lab': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['传感器测位置与速度', '位移传感器', '超声测速', '红外同步'],
      en: [
        'Position and velocity with sensors',
        'ultrasonic motion detector',
        'infrared reference',
        'time of flight',
      ],
    },
  },
  'gravity-measurements': {
    category: 'mechanisms',
    minAge: 14,
    keywords: {
      zh: [
        '从月地检验到扭秤',
        '微弱的引力，怎样成为可测量的量？',
        '近代物理实验',
        '苹果、月球和一束会移动的光',
        '苹果会落地，月球为什么一直绕行？',
      ],
      en: [
        'From the Moon–Earth test to the torsion balance',
        'How can weak gravitation become measurable?',
        'modern physics experiment',
        'An apple, the Moon and a moving spot of light',
        'Why does an apple fall while the Moon keeps orbiting?',
      ],
    },
  },
  'franklin-electricity-evidence': {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: ['富兰克林的电学证据', '富兰克林', '雷电与摩擦电', '历史实验', '电学证据'],
      en: [
        'Franklin’s Electrical Evidence',
        'Franklin',
        'lightning electricity',
        'historical experiments',
        'electrical evidence',
      ],
    },
  },
  'celestial-observations': {
    category: 'nature',
    minAge: 14,
    keywords: {
      zh: [
        '一个偏离预测的星点，能告诉我们什么？',
        '从观测到天体预言',
        '天空中的光点，怎样成为可检验的证据？',
        '近代物理实验',
      ],
      en: [
        'What can a misplaced planet tell us?',
        'From observations to celestial predictions',
        'How do points in the sky become testable evidence?',
        'modern physics experiment',
      ],
    },
  },
  'apparent-weight-lab': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['超重与失重实验', '蹲起', '体重计', '漏水瓶'],
      en: ['Apparent-weight experiments', 'normal force', 'squat', 'falling bottle'],
    },
  },
  'diamagnetic-levitation-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['水滴与青蛙的抗磁悬浮', '抗磁性', '青蛙悬浮', '水滴悬浮', '强磁场', '磁场梯度'],
      en: [
        'Diamagnetic levitation of water and a frog',
        'diamagnetism',
        'levitating frog',
        'water levitation',
        'field gradient',
      ],
    },
  },
  'battery-emf-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['电源电动势与内阻实验', '干电池', '水果电池', '橙汁电池', '充电宝', '电动势测量'],
      en: [
        'Source EMF and Internal Resistance',
        'battery emf',
        'internal resistance',
        'fruit battery',
        'power bank',
        'load curve',
      ],
    },
  },
  'solid-structure-lab': {
    category: 'thermal-fluids',
    minAge: 14,
    keywords: {
      zh: [
        '晶体结构与各向异性实验',
        '食盐松香',
        '晶体非晶体',
        '云母',
        '各向异性',
        '石墨烯',
        '胶带剥离',
      ],
      en: [
        'Crystal structure and anisotropy experiments',
        'crystals',
        'amorphous rosin',
        'mica anisotropy',
        'graphene',
        'tape exfoliation',
      ],
    },
  },
  'dynamic-mass-lab': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['太空测质量', '失重', '惯性质量', '光栅计时'],
      en: [
        'Measuring mass in microgravity',
        'mass in space',
        'microgravity',
        'inertial mass',
        'optical timing',
      ],
    },
  },
  'thermal-measurement-lab': {
    category: 'thermal-fluids',
    minAge: 14,
    keywords: {
      zh: [
        '热平衡与气体定律实验',
        '混合法',
        '量热杯',
        '玻意耳定律',
        '注射器',
        '气体等温变化',
        '烧瓶水柱',
      ],
      en: [
        'Thermal equilibrium and gas-law experiments',
        'calorimetry',
        'Boyle law',
        'syringe gas experiment',
        'constant pressure expansion',
      ],
    },
  },
  'particle-evidence-lab': {
    category: 'matter',
    minAge: 14,
    keywords: {
      zh: [
        '看不见的粒子，怎样留下可测的痕迹？',
        '不变质量',
        '粒子轨迹',
        '希格斯',
        '反西格马',
        'J/ψ',
        '粒子发现的证据链',
        '看不见的新粒子，怎样从信号里被认出来？',
        '近代物理实验',
      ],
      en: [
        'How do unseen particles leave measurable traces?',
        'invariant mass',
        'particle tracks',
        'Higgs',
        'anti-Sigma',
        'J/psi',
        'Evidence behind particle discoveries',
        'How can signals reveal an unseen new particle?',
        'modern physics experiment',
      ],
    },
  },
  'newton-second-law-lab': {
    category: 'mechanisms',
    minAge: 14,
    keywords: {
      zh: [
        '力怎样改变速度',
        '小车力与加速度实验',
        '牛顿第二定律',
        '阻力补偿',
        '双车位移比',
        '合力',
        '匀速',
        '撤力',
        '购物车',
      ],
      en: [
        'How force changes velocity',
        'Cart force and acceleration',
        'Newton second law',
        'resistance compensation',
        'paired cart ratio',
        'net force',
        'coasting',
        'shopping cart',
      ],
    },
  },
  'multimeter-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: [
        '多用电表实验',
        '多用电表',
        '欧姆调零',
        '二极管',
        '故障检测',
        '一根指针，为什么能测三种量？',
      ],
      en: [
        'Multimeter Experiments',
        'analog multimeter',
        'ohm zero',
        'diode',
        'circuit faults',
        'Why can one pointer measure three quantities?',
      ],
    },
  },
  'statistical-motion-lab': {
    category: 'math-systems',
    minAge: 14,
    keywords: {
      zh: ['随机事件与统计实验', '伽尔顿板', '四枚硬币', '抛硬币', '落豆', '统计规律'],
      en: [
        'Random events and statistical experiments',
        'Galton board',
        'four coins',
        'binomial distribution',
        'bean pressure analogy',
      ],
    },
  },
  'nuclear-evidence-lab': {
    category: 'matter',
    minAge: 14,
    keywords: {
      zh: ['核反应的实验线索', '一个核发生了什么，怎样从产物和径迹判断？', '近代物理实验'],
      en: [
        'Experimental clues to nuclear reactions',
        'How do products and tracks reveal a nuclear reaction?',
        'modern physics experiment',
      ],
    },
  },
  'molecular-measurement-lab': {
    category: 'thermal-fluids',
    minAge: 14,
    keywords: {
      zh: ['分子的间接观察与测量', '布朗运动', '炭粒', '油膜法', '油酸分子', '酒精体积'],
      en: [
        'Indirect observation and measurement of molecules',
        'Brownian motion',
        'carbon particles',
        'oleic acid film',
        'volume contraction',
      ],
    },
  },
  'inertial-frames-lab': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['抽纸与参考系', '惯性参考系', '钢球抽纸', '非惯性系'],
      en: [
        'Paper pull and reference frames',
        'inertial frame',
        'steel ball',
        'accelerating coordinates',
      ],
    },
  },
  'decay-measurement-lab': {
    category: 'matter',
    minAge: 14,
    keywords: {
      zh: ['衰变的统计与用途', '不确定的单次衰变，怎样成为可测的时间与路径？', '近代物理实验'],
      en: [
        'Decay statistics and applications',
        'How can unpredictable decays measure time and transport?',
        'modern physics experiment',
      ],
    },
  },
  'resistivity-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['电阻与电阻率实验', '导体电阻', '控制变量', '电阻率测量', '伏安法', '电表内阻'],
      en: [
        'Resistance and Resistivity Experiments',
        'wire resistance',
        'resistivity measurement',
        'controlled variables',
        'meter loading',
      ],
    },
  },
  'radiation-evidence-lab': {
    category: 'matter',
    minAge: 14,
    keywords: {
      zh: ['发现看不见的射线', '感光、电离与径迹，怎样成为看不见粒子的证据？', '近代物理实验'],
      en: [
        'Detecting invisible radiation',
        'How do plates, ionization and tracks reveal invisible radiation?',
        'modern physics experiment',
      ],
    },
  },
  'galileo-inclines': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['伽利略斜面研究', '流水计时', '双斜面理想实验', '滚动与惯性'],
      en: ['Galileo’s incline studies', 'water clock', 'ideal double incline', 'rolling inertia'],
    },
  },
  'sensor-control-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: [
        '传感器测量与自动控制',
        '干簧管',
        '光敏电阻',
        '热敏电阻',
        '压力传感器',
        '继电器',
        '双金属片',
      ],
      en: [
        'Sensor measurement and automatic control',
        'reed switch',
        'photoresistor',
        'NTC thermistor',
        'pressure sensor',
        'relay',
      ],
    },
  },
  'matter-wave-lab': {
    category: 'matter',
    minAge: 14,
    keywords: {
      zh: ['电子与晶体衍射', '粒子留下的图样，为什么像波？', '近代物理实验'],
      en: [
        'Electron and crystal diffraction',
        'Why do particles leave wave-like patterns?',
        'modern physics experiment',
      ],
    },
  },
  'force-resultant-lab': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['力的合成与分解实验', '平行四边形定则', '等效替换', '橡皮条'],
      en: [
        'Force composition laboratory',
        'parallelogram rule',
        'equivalent force',
        'force resolution',
      ],
    },
  },
  'length-instruments': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: [
        '刻度差',
        '螺距',
        '累积误差',
        '间隙偏差',
        '长度测量与精细读数',
        '游标卡尺',
        '螺旋测微器',
        '累积法',
        '铜丝直径',
        '有效数字',
      ],
      en: [
        'scale difference',
        'screw pitch',
        'accumulation error',
        'packing bias',
        'Length Instruments and Fine Readings',
        'vernier caliper',
        'micrometer',
        'wire diameter',
        'measurement uncertainty',
      ],
    },
  },
  'wireless-interference-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['Wi-Fi与蓝牙干扰实验', '无线干扰', '蓝牙', '跳频', 'Wi-Fi', '网速'],
      en: [
        'Wi-Fi and Bluetooth interference',
        'wireless coexistence',
        'adaptive frequency hopping',
        'network speed',
      ],
    },
  },
  'atomic-spectrum-lab': {
    category: 'matter',
    minAge: 14,
    keywords: {
      zh: ['光谱中的原子证据', '把光展开，怎样认出物质与理论的细小偏差？', '近代物理实验'],
      en: [
        'Atomic evidence in spectra',
        'What can a spectrum reveal about matter and theory?',
        'modern physics experiment',
      ],
    },
  },
  'hertz-wave-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['赫兹与电磁波实验', '赫兹', '电磁波', '火花', '偏振', '衍射'],
      en: [
        'Hertz and electromagnetic-wave experiments',
        'spark gap',
        'radio waves',
        'polarization',
        'diffraction',
      ],
    },
  },
  'force-pairs-lab': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['作用力与反作用力实验', '牛顿第三定律', '相互作用力', '双测力计'],
      en: ['Action and reaction laboratory', 'Newton third law', 'force pair', 'spring balances'],
    },
  },
  'ac-circuit-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['交流电与LC振荡实验', '交变电流', '示波器', '发电机', '感抗', '容抗', 'LC振荡'],
      en: [
        'AC and LC oscillation experiments',
        'alternating current',
        'oscilloscope',
        'inductive reactance',
        'capacitive reactance',
      ],
    },
  },
  'friction-lab': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['摩擦力测量实验', '静摩擦峰值', '滑动摩擦', '纸团标记'],
      en: ['Friction laboratory', 'static friction peak', 'kinetic friction', 'force sensor'],
    },
  },
  'capacitor-current-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['从电流面积测电荷', '电流传感器', '电容放电', '电流时间曲线', '电荷分配'],
      en: [
        'Charge from Current Area',
        'current sensor',
        'capacitor discharge',
        'current time area',
        'charge sharing',
      ],
    },
  },
  'eddy-current-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['涡流与电磁阻尼', '涡流', '电磁阻尼', '电磁驱动', '落磁', '铝管', '铜盘'],
      en: [
        'Eddy currents and magnetic damping',
        'magnetic braking',
        'falling magnet',
        'slit tube',
        'copper disc',
      ],
    },
  },
  'cathode-ray-lab': {
    category: 'matter',
    minAge: 14,
    keywords: {
      zh: ['阴极射线与电子', '一束看不见的射线，怎样显露电荷与质量？', '近代物理实验'],
      en: [
        'Cathode rays and electrons',
        'How can a beam reveal its charge and mass?',
        'modern physics experiment',
      ],
    },
  },
  'elasticity-lab': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['弹性测量实验', '胡克定律', '弹簧伸长', '橡皮筋滞回'],
      en: ['Elasticity laboratory', 'Hooke law', 'spring extension', 'rubber hysteresis'],
    },
  },
  'parallel-plate-capacitor-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['平行板电容的控制变量', '平行板电容器', '静电计', '固定电荷', '介质'],
      en: [
        'Controlling Parallel-Plate Capacitance',
        'parallel plate',
        'electrometer',
        'dielectric',
        'fixed charge',
      ],
    },
  },
  'self-induction-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['自感与两灯实验', '自感', '通电延迟', '断电闪亮', '电流反向', '电流传感器'],
      en: [
        'Self-induction lamp experiments',
        'self inductance',
        'lamp flash',
        'RL circuit',
        'current reversal',
      ],
    },
  },
  'small-deformation-lab': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['微小形变观察', '双平面镜', '桌面形变', '光杠杆'],
      en: ['Seeing small deformations', 'two mirrors', 'optical lever', 'beam deflection'],
    },
  },
  'atomic-scattering-lab': {
    category: 'matter',
    minAge: 14,
    keywords: {
      zh: ['微观散射实验', '看不见的内部，怎样由偏转留下证据？', '近代物理实验'],
      en: [
        'Microscopic scattering experiments',
        'How does scattering reveal an invisible interior?',
        'modern physics experiment',
      ],
    },
  },
  'oil-drop-lab': {
    category: 'matter',
    minAge: 14,
    keywords: {
      zh: [
        '油滴与元电荷',
        '怎样用一个油滴，量出电荷的最小单位？',
        '近代物理实验',
        '怎样从油滴的运动称出电荷？',
      ],
      en: [
        'Oil drops and elementary charge',
        'How can one oil drop reveal the unit of electric charge?',
        'modern physics experiment',
        'How can a moving oil drop reveal its charge?',
      ],
    },
  },
  'mutual-induction-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['互感实验室', '法拉第铁环', '互感', '套入线圈', '音频信号'],
      en: [
        'Mutual-induction experiments',
        'Faraday iron ring',
        'mutual inductance',
        'nested coils',
      ],
    },
  },
  'electric-field-mapping': {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: ['油盘中的电场图样', '模拟电场线', '蓖麻油', '头发碎屑', '等势线'],
      en: [
        'Electric Field Patterns in Oil',
        'electric field',
        'hair fragments',
        'castor oil',
        'equipotential',
      ],
    },
  },
  'suspension-center-of-gravity': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['悬挂法找重心', '换了悬点，为什么仍找到同一点？', '铅垂线', '三角形中线', '重心'],
      en: [
        'Finding the centre by suspension',
        'Why do different supports reveal the same point?',
        'Finding the center of gravity',
        'plumb line',
        'triangular lamina',
        'centroid',
      ],
    },
  },
  'induction-coil-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['电磁感应实验室', '楞次定律', '法拉第定律', '闭合铝环', '圆盘发电机'],
      en: [
        'Electromagnetic-induction experiments',
        'Lenz law',
        'Faraday law',
        'homopolar generator',
      ],
    },
  },
  'coulomb-torsion': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['库仑扭秤', '库仑定律', '扭秤', '控制变量', '平方反比'],
      en: [
        'Coulomb’s Torsion Balance',
        'Coulomb torsion balance',
        'inverse square',
        'electric force',
        'null method',
      ],
    },
  },
  'free-fall-activities': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['自由落体小实验', '纸片纸团', '两石反证', '反应时间尺', '伽利略'],
      en: ['Free-fall activities', 'crumpled paper', 'tied stones', 'reaction ruler', 'Galileo'],
    },
  },
  'blackbody-lab': {
    category: 'thermal-fluids',
    minAge: 14,
    keywords: {
      zh: ['黑体辐射测量', '升温时，辐射曲线的峰值为什么向短波移动？', '近代物理实验'],
      en: [
        'Measuring blackbody radiation',
        'Why does a hotter radiator peak at a shorter wavelength?',
        'modern physics experiment',
      ],
    },
  },
  'photoelectric-lab': {
    category: 'matter',
    minAge: 14,
    keywords: {
      zh: ['光电效应实验室', '更亮的光，为什么仍打不出电子？', '近代物理实验'],
      en: [
        'Photoelectric-effect laboratory',
        'Why can brighter light still fail to release electrons?',
        'modern physics experiment',
      ],
    },
  },
  'charged-particle-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['带电粒子实验室', '洛伦兹力', '质谱仪', '正电子', '阴极射线'],
      en: ['Charged-particle experiments', 'Lorentz force', 'mass spectrometer', 'positron'],
    },
  },
  'electrostatic-induction': {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: ['静电起电与验电器', '摩擦起电', '静电感应', '金属箔', '电荷守恒', '人教版物理'],
      en: [
        'Charging and the Electroscope',
        'electrostatic induction',
        'electroscope',
        'charge conservation',
        'friction',
      ],
    },
  },
  'phone-accelerometer-lab': {
    category: 'mechanisms',
    minAge: 14,
    keywords: {
      zh: [
        '手机怎样感觉加速度',
        '没动读9.8，下落为什么读零？',
        '手机加速度实验',
        '自由落体',
        '加速度传感器',
        '电梯加速度',
        '比力',
        '去重力',
      ],
      en: [
        'How a phone senses acceleration',
        'Still reads 9.8; why does falling read zero?',
        'Phone accelerometer experiments',
        'specific force',
        'free fall',
        'lift acceleration',
        'gravity correction',
      ],
    },
  },
  'magnetic-force-lab': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['磁力实验室', '安培力', '通电导线', '螺线管', '通电弹簧'],
      en: ['Magnetic-force experiments', 'Ampere force', 'solenoid', 'parallel currents'],
    },
  },
  'ticker-tape-lab': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: [
        '纸带怎样记录运动',
        '纸带运动实验室',
        '打点计时器',
        '瞬时速度',
        '加速度',
        '纸带',
        '自由落体',
      ],
      en: [
        'How tape records motion',
        'Ticker-tape laboratory',
        'ticker timer',
        'instantaneous velocity',
        'acceleration',
        'falling tape',
      ],
    },
  },
  'newton-tube': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['牛顿管实验', '自由落体', '羽毛和铁片', '空气阻力', '人教版高中物理', '控制变量'],
      en: [
        'Newton Tube',
        'free fall',
        'feather and iron',
        'air resistance',
        'PEP physics',
        'controlled comparison',
      ],
    },
  },
  'electric-fuse': {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: ['保险丝', '熔断器', '焦耳热', '热历史', '短脉冲'],
      en: ['Electric fuse', 'fuse link', 'Joule heating', 'thermal history', 'current pulse'],
    },
  },
  'current-transformer': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['电流互感器', '安匝平衡', '二次负担', '磁芯饱和'],
      en: ['Current transformer', 'ampere-turn balance', 'CT burden', 'core saturation'],
    },
  },
  relay: {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: ['继电器', '电磁开关', '常开触点', '线圈', '吸合', '释放', '电气隔离'],
      en: [
        'Relay',
        'electromagnetic switch',
        'normally open contacts',
        'coil',
        'pickup',
        'release',
        'galvanic isolation',
      ],
    },
  },
  'ground-fault-breaker': {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: ['漏电保护器', '漏电保护', '剩余电流', '差流', '零序互感器', 'RCD', 'RCCB', 'GFCI'],
      en: [
        'Residual-current breaker',
        'ground fault breaker',
        'residual current',
        'differential current',
        'RCD',
        'RCCB',
        'GFCI',
        'test button',
      ],
    },
  },
  'pressure-cooker': {
    category: 'thermal-fluids',
    minAge: 12,
    keywords: {
      zh: ['高压锅', '压力锅', '沸点', '表压', '饱和压力', '配重阀'],
      en: [
        'Pressure cooker',
        'boiling point',
        'gauge pressure',
        'saturation pressure',
        'weighted valve',
        'steam',
      ],
    },
  },
  'three-phase-power': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['三相电力', '相电压', '线电压', '中性线', '有功功率'],
      en: ['Three-phase power', 'phase voltage', 'line voltage', 'neutral current', 'active power'],
    },
  },
  'fuel-cell': {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: ['燃料电池', '质子交换膜', '电化学', '最大功率', '氢能', '法拉第定律'],
      en: [
        'Fuel cell',
        'PEM',
        'electrochemistry',
        'maximum power',
        'hydrogen energy',
        'Faraday law',
      ],
    },
  },
  piezoelectricity: {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['压电效应', '压电陶瓷', '力传感器', '逆压电效应'],
      en: ['Piezoelectricity', 'piezo ceramic', 'force sensor', 'inverse piezoelectric effect'],
    },
  },
  'dew-point': {
    category: 'thermal-fluids',
    minAge: 10,
    keywords: {
      zh: ['露点', '结露', '凝结', '湿度', '水汽', '饱和蒸气压'],
      en: [
        'Dew point',
        'condensation',
        'humidity',
        'water vapour',
        'saturation pressure',
        'cold mirror',
      ],
    },
  },
  electrolysis: {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: ['水电解', '质子交换膜', '法拉第定律', '阳极', '阴极', '制氢'],
      en: ['Water electrolysis', 'PEM', 'Faraday law', 'anode', 'cathode', 'hydrogen production'],
    },
  },
  thermocouple: {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['热电偶', '冷端补偿', '塞贝克效应', '温度测量'],
      en: ['Thermocouple', 'cold-junction compensation', 'Seebeck effect', 'temperature sensing'],
    },
  },
  'evaporative-cooling': {
    category: 'thermal-fluids',
    minAge: 10,
    keywords: {
      zh: ['蒸发冷却', '蒸发', '湿球', '湿度', '潜热', '凝结'],
      en: [
        'Evaporative cooling',
        'evaporation',
        'wet bulb',
        'humidity',
        'latent heat',
        'condensation',
      ],
    },
  },
  'greenhouse-effect': {
    category: 'nature',
    minAge: 12,
    keywords: {
      zh: ['温室效应', '温室气体', '辐射平衡', '灰体大气', '向下长波', '能量守恒', '热容'],
      en: [
        'Greenhouse effect',
        'greenhouse gases',
        'radiative balance',
        'gray atmosphere',
        'downward infrared',
        'energy conservation',
        'heat capacity',
      ],
    },
  },
  'eddy-current-brake': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['涡流制动', '电磁阻尼', '焦耳热', '楞次定律'],
      en: ['Eddy-current braking', 'magnetic damping', 'Joule heat', 'Lenz law'],
    },
  },
  'surface-waves': {
    category: 'thermal-fluids',
    minAge: 12,
    keywords: {
      zh: ['水面波', '海浪', '水波', '重力波', '群速度', '相速度'],
      en: [
        'Surface waves',
        'water waves',
        'ocean waves',
        'gravity wave',
        'group velocity',
        'phase velocity',
      ],
    },
  },
  'vortex-ring': {
    category: 'thermal-fluids',
    minAge: 12,
    keywords: {
      zh: ['涡环', '烟圈', '涡量', '毕奥萨伐尔', '环量', '涡旋'],
      en: ['Vortex ring', 'smoke ring', 'vorticity', 'Biot–Savart', 'circulation'],
    },
  },
  'plate-boundaries': {
    category: 'nature',
    minAge: 12,
    keywords: {
      zh: ['板块边界', '板块构造', '俯冲', '张裂边界', '转换断层', '相对运动', '大陆碰撞'],
      en: [
        'Plate boundaries',
        'plate tectonics',
        'subduction',
        'divergent boundary',
        'transform boundary',
        'relative motion',
        'continental collision',
      ],
    },
  },
  'stellar-parallax': {
    category: 'nature',
    minAge: 12,
    keywords: {
      zh: ['恒星视差', '周年视差', '天文测距', '秒差距', '自行', '黄纬', '基线'],
      en: [
        'Stellar parallax',
        'annual parallax',
        'astrometry',
        'parsec',
        'proper motion',
        'ecliptic latitude',
        'baseline',
      ],
    },
  },
  'viscosity-layers': {
    category: 'thermal-fluids',
    minAge: 12,
    keywords: {
      zh: ['黏性分层', '黏度', '库埃特流', '剪应力', '速度梯度', '动量扩散'],
      en: [
        'Viscous layers',
        'viscosity',
        'Couette flow',
        'shear stress',
        'velocity gradient',
        'momentum diffusion',
      ],
    },
  },
  'hall-effect': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['霍尔效应', '载流子', '霍尔电压', '磁场测量', '电子漂移'],
      en: ['Hall effect', 'charge carriers', 'Hall voltage', 'magnetic sensing', 'electron drift'],
    },
  },
  'lunar-eclipse': {
    category: 'nature',
    minAge: 10,
    keywords: {
      zh: ['月食', '月全食', '月偏食', '半影月食', '轨道交点', '本影', '满月'],
      en: [
        'Lunar eclipse',
        'lunar eclipses',
        'totality',
        'penumbral eclipse',
        'orbital node',
        'umbra',
        'full moon',
      ],
    },
  },
  'stokes-drag': {
    category: 'thermal-fluids',
    minAge: 12,
    keywords: {
      zh: ['斯托克斯阻力', '低雷诺数', '终端沉降', '黏度', '微粒沉降', '爬流'],
      en: [
        'Stokes drag',
        'low Reynolds number',
        'terminal settling',
        'viscosity',
        'particle sedimentation',
        'creeping flow',
      ],
    },
  },
  'op-amp-feedback': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['运放负反馈', '虚短', '运算放大器', '转换速率', '闭环增益'],
      en: [
        'Op-amp feedback',
        'virtual short',
        'operational amplifier',
        'slew rate',
        'closed-loop gain',
      ],
    },
  },
  'orbital-transfer': {
    category: 'nature',
    minAge: 12,
    keywords: {
      zh: ['霍曼轨道转移', '霍曼转移', 'Hohmann', '双脉冲', '轨道机动', '升轨', '圆化'],
      en: [
        'Hohmann orbital transfer',
        'Hohmann transfer',
        'two impulses',
        'orbit raising',
        'circularization',
        'vis-viva',
        'orbital maneuver',
      ],
    },
  },
  'venturi-meter': {
    category: 'thermal-fluids',
    minAge: 12,
    keywords: {
      zh: ['文丘里流量计', '差压', '流量测量', '喉部', '压差计', '伯努利'],
      en: [
        'Venturi meter',
        'differential pressure',
        'flow measurement',
        'throat',
        'manometer',
        'Bernoulli',
      ],
    },
  },
  'bjt-amplifier': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['晶体管放大器', '共射极', '偏置', '饱和', '发射极负反馈'],
      en: ['Transistor amplifier', 'common emitter', 'bias', 'saturation', 'emitter degeneration'],
    },
  },
  'earth-day': {
    category: 'nature',
    minAge: 10,
    keywords: {
      zh: ['恒星日与太阳日', '恒星日', '太阳日', '地球自转', '公转', '正午', '相对角速度'],
      en: [
        'Sidereal and solar day',
        'sidereal day',
        'solar day',
        'Earth rotation',
        'orbital motion',
        'noon',
        'relative angular velocity',
      ],
    },
  },
  'hydrostatic-pressure': {
    category: 'thermal-fluids',
    minAge: 10,
    keywords: {
      zh: ['静水压', '液体压强', '连通器', '静水悖论', '表压', '液压'],
      en: [
        'Hydrostatic pressure',
        'liquid pressure',
        'communicating vessels',
        'hydrostatic paradox',
        'gauge pressure',
        'pressure force',
      ],
    },
  },
  'diode-junction': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['PN结二极管', '耗尽区', '半导体', '势垒', '正向偏置'],
      en: [
        'PN junction diode',
        'depletion region',
        'semiconductor',
        'built-in potential',
        'forward bias',
      ],
    },
  },
  voronoi: {
    category: 'math-systems',
    minAge: 12,
    keywords: {
      zh: ['Voronoi 图', 'Voronoi', '泰森多边形', '最近邻', '垂直平分线', '半平面', '距离度量'],
      en: [
        'Voronoi diagram',
        'Voronoi',
        'nearest neighbor',
        'perpendicular bisector',
        'halfplane intersection',
        'distance metric',
      ],
    },
  },
  buoyancy: {
    category: 'thermal-fluids',
    minAge: 8,
    keywords: {
      zh: ['浮力', '阿基米德', '排水', '浮沉', '吃水', '液体密度'],
      en: ['Buoyancy', 'Archimedes principle', 'displaced liquid', 'floating', 'sinking', 'draft'],
    },
  },
  'growth-logistic': {
    category: 'math-systems',
    minAge: 12,
    keywords: {
      zh: ['逻辑斯谛增长', 'Logistic增长', '承载量', '种群增长', '密度限制', '微分方程'],
      en: [
        'Logistic growth',
        'logistic equation',
        'carrying capacity',
        'population growth',
        'density dependence',
        'differential equation',
      ],
    },
  },
  'adiabatic-compression': {
    category: 'thermal-fluids',
    minAge: 12,
    keywords: {
      zh: ['绝热压缩', '活塞', '绝热膨胀', '等温压缩', '内能', '自由膨胀'],
      en: [
        'Adiabatic compression',
        'piston work',
        'adiabatic expansion',
        'isothermal compression',
        'internal energy',
        'free expansion',
      ],
    },
  },
  'inductor-transient': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['电感瞬态', '续流', '钳位', '磁能', '电流连续'],
      en: ['Inductor transients', 'flyback', 'clamping', 'magnetic energy', 'current continuity'],
    },
  },
  'random-walk': {
    category: 'math-systems',
    minAge: 10,
    keywords: {
      zh: ['随机游走', '随机漫步', '扩散', '均方根位移', '吸收边界', '奇偶性'],
      en: [
        'Random walk',
        'random walking',
        'diffusion',
        'root mean square displacement',
        'absorbing boundary',
        'lattice parity',
      ],
    },
  },
  'ideal-gas': {
    category: 'thermal-fluids',
    minAge: 10,
    keywords: {
      zh: ['理想气体', '气体压强', '玻意耳定律', '绝对温度', '表压', '分子碰撞'],
      en: [
        'Ideal gas',
        'gas pressure',
        'Boyle law',
        'absolute temperature',
        'gauge pressure',
        'molecular collisions',
      ],
    },
  },
  'central-limit-theorem': {
    category: 'math-systems',
    minAge: 12,
    keywords: {
      zh: ['中央极限定理', '中心极限定理', 'CLT', '二项分布', '标准化', '独立同分布', '正态近似'],
      en: [
        'Central limit theorem',
        'CLT',
        'binomial distribution',
        'standardized sum',
        'normal approximation',
        'independence',
      ],
    },
  },
  'capacitor-fields': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['电容器电场', '介质极化', '固定电荷', '固定电压', '电势'],
      en: [
        'Capacitor fields',
        'dielectric polarization',
        'fixed charge',
        'fixed voltage',
        'electric potential',
      ],
    },
  },
  'thermal-expansion': {
    category: 'thermal-fluids',
    minAge: 10,
    keywords: {
      zh: ['热膨胀', '热胀冷缩', '孔径', '热应力', '膨胀缝', '过盈配合'],
      en: [
        'Thermal expansion',
        'heated hole',
        'thermal stress',
        'expansion joint',
        'clearance fit',
        'thermal contraction',
      ],
    },
  },
  'monte-carlo': {
    category: 'math-systems',
    minAge: 12,
    keywords: {
      zh: ['蒙特卡洛方法', '蒙特卡洛', '随机抽样', '标准误差', '采样偏差', '圆面积'],
      en: [
        'Monte Carlo',
        'Monte Carlo method',
        'random sampling',
        'standard error',
        'sampling bias',
        'area estimation',
      ],
    },
  },
  'heat-radiation': {
    category: 'thermal-fluids',
    minAge: 10,
    keywords: {
      zh: ['热辐射', '红外', '发射率', '热平衡', '黑体', '斯特藩玻尔兹曼'],
      en: [
        'Thermal radiation',
        'Heat radiation',
        'infrared',
        'emissivity',
        'thermal equilibrium',
        'blackbody',
        'Stefan Boltzmann',
      ],
    },
  },
  'markov-chain': {
    category: 'math-systems',
    minAge: 12,
    keywords: {
      zh: ['马尔可夫链', '马尔可夫', '转移矩阵', '稳态分布', '周期性', '概率质量'],
      en: [
        'Markov chain',
        'Markov',
        'transition matrix',
        'stationary distribution',
        'periodicity',
        'probability mass',
      ],
    },
  },
  'center-of-mass': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['质心', '质量加权', '内部运动', '平台反冲', '动量守恒'],
      en: [
        'Center of mass',
        'mass-weighted position',
        'internal motion',
        'platform recoil',
        'momentum conservation',
      ],
    },
  },
  'helmholtz-resonator': {
    category: 'light-sound',
    minAge: 10,
    keywords: {
      zh: ['亥姆霍兹共鸣器', '瓶子吹气', '空气弹簧', '腔体共鸣', '端修正', '瓶子装水'],
      en: [
        'Helmholtz resonator',
        'bottle tone',
        'air spring',
        'cavity resonance',
        'end correction',
        'bottle filling',
      ],
    },
  },
  'organ-pipe': {
    category: 'light-sound',
    minAge: 10,
    keywords: {
      zh: ['风琴管', '塞闭管', '开放管', '声柱', '奇数谐波', '端修正'],
      en: [
        'Organ pipe',
        'stopped pipe',
        'open pipe',
        'air column',
        'odd harmonics',
        'end correction',
      ],
    },
  },
  'elastic-collision': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['弹性碰撞', '碰撞动量', '弹簧储能', '质量比', '质心参考系'],
      en: [
        'Elastic collision',
        'collision momentum',
        'spring energy',
        'mass ratio',
        'center-of-mass frame',
      ],
    },
  },
  'principal-components': {
    category: 'math-systems',
    minAge: 12,
    keywords: {
      zh: ['主成分分析', 'PCA', '降维', '投影方差', '重建误差'],
      en: [
        'Principal components',
        'PCA',
        'principal component analysis',
        'dimension reduction',
        'projection variance',
        'reconstruction error',
      ],
    },
  },
  'gradient-descent': {
    category: 'math-systems',
    minAge: 12,
    keywords: {
      zh: ['梯度下降', '学习率', '步长', '优化', '损失函数'],
      en: ['Gradient descent', 'learning rate', 'step size', 'optimization', 'loss contours'],
    },
  },
  'acoustic-reflection': {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['声反射', '回声', '声阻抗', '透射', '压力波', '粒子速度'],
      en: [
        'Acoustic reflection',
        'echo',
        'specific acoustic impedance',
        'transmission',
        'pressure wave',
        'particle velocity',
      ],
    },
  },
  'angular-momentum': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['角动量', '转动惯量', '收拢加速', '内部做功', '外力矩'],
      en: [
        'Angular momentum',
        'moment of inertia',
        'inward motion',
        'internal work',
        'external torque',
      ],
    },
  },
  convolution: {
    category: 'math-systems',
    minAge: 12,
    keywords: {
      zh: ['离散卷积', '卷积', '冲激响应', '信号滤波', '相关运算'],
      en: [
        'Discrete convolution',
        'convolution',
        'impulse response',
        'FIR',
        'correlation',
        'circular convolution',
      ],
    },
  },
  mirage: {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['海市蜃楼', '下蜃景', '热路面', '折射率梯度', '路面像水'],
      en: ['Mirage', 'inferior mirage', 'hot road', 'index gradient', 'wet-road appearance'],
    },
  },
  gyroscope: {
    category: 'mechanisms',
    minAge: 14,
    keywords: {
      zh: ['陀螺仪', '陀螺进动', '角动量方向', '重力矩', '章动'],
      en: ['Gyroscope', 'precession', 'angular momentum direction', 'gravity torque', 'nutation'],
    },
  },
  'run-length-encoding': {
    category: 'computing',
    minAge: 10,
    keywords: {
      zh: ['游程编码', '行程编码', 'RLE', '无损压缩', '连续重复'],
      en: [
        'Run-length encoding',
        'RLE',
        'run length compression',
        'lossless coding',
        'byte runs',
        'run length encoding',
      ],
    },
  },
  'spherical-aberration': {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['球差', '球面像差', '抛物面镜', '焦散', '口径', '彗差'],
      en: [
        'Spherical aberration',
        'spherical mirror',
        'parabolic mirror',
        'caustic',
        'aperture',
        'coma',
      ],
    },
  },
  'diffie-hellman': {
    category: 'computing',
    minAge: 14,
    keywords: {
      zh: ['Diffie–Hellman 协商', 'DH协商', '迪菲赫尔曼', '密钥交换', '共享秘密', '中间人攻击'],
      en: [
        'Diffie–Hellman exchange',
        'Diffie Hellman',
        'DH key agreement',
        'shared secret',
        'key exchange',
        'man in the middle',
      ],
    },
  },
  'digital-signature': {
    category: 'computing',
    minAge: 14,
    keywords: {
      zh: ['数字签名', '公钥验签', 'Schnorr', '签名验证', 'nonce复用'],
      en: [
        'Digital signature',
        'digital signatures',
        'public verification',
        'Schnorr',
        'nonce reuse',
        'private key',
      ],
    },
  },
  flywheel: {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['飞轮', '转动惯量', '动能储存', '转速波动', '轮缘'],
      en: ['Flywheel', 'rotational inertia', 'kinetic energy', 'speed ripple', 'rim'],
    },
  },
  moire: {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['摩尔纹', '莫尔条纹', '叠纹', '光栅', '空间频率', '差频'],
      en: [
        'Moiré patterns',
        'moire',
        'grating overlay',
        'spatial frequency',
        'beat pattern',
        'translation magnification',
      ],
    },
  },
  'merkle-tree': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['Merkle 树', '默克尔树', '哈希树', '包含证明', '数据完整性', '可信根'],
      en: ['Merkle tree', 'hash tree', 'inclusion proof', 'data integrity', 'trusted root'],
    },
  },
  'stereoscopic-vision': {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['双目立体视觉', '视差', '双眼', '立体测量', '深度', '对应关系'],
      en: [
        'Stereoscopic vision',
        'binocular disparity',
        'stereo vision',
        'triangulation',
        'depth',
        'correspondence',
      ],
    },
  },
  'raft-consensus': {
    category: 'computing',
    minAge: 14,
    keywords: {
      zh: ['Raft 共识', 'Raft共识', '领导者选举', '任期', '多数派', '日志复制'],
      en: ['Raft consensus', 'Raft', 'consensus', 'leader election', 'term', 'log replication'],
    },
  },
  'color-mixing': {
    category: 'light-sound',
    minAge: 10,
    keywords: {
      zh: ['色光混合', '加色', '减色', 'RGB', 'CMY', '滤片'],
      en: ['Color mixing', 'additive colour', 'subtractive colour', 'RGB', 'CMY', 'filters'],
    },
  },
  'centrifugal-governor': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['离心调速器', '瓦特调速器', '飞球', '负反馈', '稳态偏差'],
      en: [
        'Centrifugal governor',
        'Watt governor',
        'flyball governor',
        'negative feedback',
        'speed droop',
      ],
    },
  },
  'write-ahead-log': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['预写日志', 'WAL', '崩溃恢复', '持久性', '重做日志'],
      en: [
        'Write-ahead log',
        'write ahead log',
        'WAL',
        'crash recovery',
        'durability',
        'redo logging',
      ],
    },
  },
  'fresnel-lens': {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['菲涅耳透镜', '环带透镜', '聚光', '折射面', '灯塔'],
      en: ['Fresnel lens', 'annular lens', 'concentrator', 'refracting surface', 'lighthouse'],
    },
  },
  'rayleigh-scattering': {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['瑞利散射', '蓝天', '日落', '分子散射', '波长', '光谱'],
      en: [
        'Rayleigh scattering',
        'blue sky',
        'sunset',
        'molecular scattering',
        'wavelength',
        'spectrum',
      ],
    },
  },
  'database-transactions': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['数据库事务', '原子性', '隔离性', '回滚', '丢失更新'],
      en: ['Database transactions', 'atomicity', 'isolation', 'rollback', 'lost update'],
    },
  },
  ratchet: {
    category: 'mechanisms',
    minAge: 10,
    keywords: {
      zh: ['棘轮', '棘爪', '单向机构', '空回角', '止逆'],
      en: ['Ratchet', 'pawl', 'one-way mechanism', 'lost motion', 'backstop'],
    },
  },
  'max-flow': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['最大流', '最小割', '残余网络', '增广路', '容量网络'],
      en: ['Maximum flow', 'max flow', 'minimum cut', 'residual network', 'augmenting path'],
    },
  },
  retroreflector: {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['回归反射器', '角锥', '角反射器', '反光标记', '激光测距', '反射'],
      en: [
        'Retroreflector',
        'corner cube',
        'corner reflector',
        'retroreflection',
        'laser ranging',
        'reflection',
      ],
    },
  },
  telescope: {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['望远镜', '开普勒望远镜', '物镜', '目镜', '出瞳', '放大率'],
      en: [
        'Telescope',
        'Keplerian telescope',
        'objective',
        'eyepiece',
        'exit pupil',
        'magnification',
      ],
    },
  },
  'astar-search': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['A* 搜索', 'A星', '启发式搜索', '寻路', '曼哈顿距离', '最短路'],
      en: ['A* search', 'astar', 'A-star', 'heuristic search', 'pathfinding', 'Manhattan distance'],
    },
  },
  'topological-sort': {
    category: 'computing',
    minAge: 10,
    keywords: {
      zh: ['拓扑排序', '有向无环图', '依赖', '入度', '循环依赖'],
      en: [
        'Topological sort',
        'topological sorting',
        'directed acyclic graph',
        'dependencies',
        'indegree',
        'cycle',
      ],
    },
  },
  'union-find': {
    category: 'computing',
    minAge: 10,
    keywords: {
      zh: ['并查集', '不相交集合', '路径压缩', '按大小合并'],
      en: ['Union–find', 'union find', 'disjoint sets', 'path compression', 'weighted union'],
    },
  },
  'geneva-drive': {
    category: 'mechanisms',
    minAge: 10,
    keywords: {
      zh: ['日内瓦机构', '槽轮机构', '间歇运动', '马耳他十字', '机械分度'],
      en: ['Geneva drive', 'Maltese cross', 'intermittent motion', 'indexing mechanism', 'dwell'],
    },
  },
  'heap-priority-queue': {
    category: 'computing',
    minAge: 10,
    keywords: {
      zh: ['堆优先队列', '优先队列', '最大堆', '二叉堆', '上浮', '下沉'],
      en: ['Heap priority queue', 'priority queue', 'max heap', 'binary heap', 'swim', 'sink'],
    },
  },
  'universal-joint': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['万向节', '十字轴', '传动轴', '叉头相位', '角速度波动'],
      en: [
        'Universal joint',
        'Cardan joint',
        'drive shaft',
        'yoke phasing',
        'angular speed variation',
      ],
    },
  },
  'diffraction-grating': {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['衍射光栅', '多缝', '光谱', '干涉级次', '缺级', '夫琅禾费'],
      en: [
        'Diffraction grating',
        'multiple slits',
        'spectrum',
        'diffraction order',
        'missing orders',
        'Fraunhofer',
      ],
    },
  },
  'prism-dispersion': {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['棱镜色散', '三棱镜', '白光', '光谱', 'Sellmeier', 'N-BK7'],
      en: ['Prism dispersion', 'prism', 'white light', 'spectrum', 'Sellmeier', 'N-BK7'],
    },
  },
  'total-internal-reflection': {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['全反射', '临界角', '消逝场', '光纤', '菲涅耳反射'],
      en: [
        'Total internal reflection',
        'critical angle',
        'evanescent field',
        'optical fiber',
        'Fresnel reflection',
      ],
    },
  },
  refraction: {
    category: 'light-sound',
    minAge: 10,
    keywords: {
      zh: ['折射', '斯涅尔定律', '法线', '介质波长', '光速'],
      en: ['Refraction', 'Snell law', 'normal', 'in-medium wavelength', 'phase speed'],
    },
  },
  quicksort: {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['快速排序', '三向切分', '主元', '分区', '重复键', '递归'],
      en: ['Quicksort', 'three-way partition', 'pivot', 'duplicate keys', 'recursion'],
    },
  },
  'merge-sort': {
    category: 'computing',
    minAge: 10,
    keywords: {
      zh: ['归并排序', '稳定排序', '分治', '有序段', '合并'],
      en: ['Merge sort', 'stable sort', 'divide and conquer', 'sorted runs', 'merging'],
    },
  },
  'binary-search': {
    category: 'computing',
    minAge: 10,
    keywords: {
      zh: ['二分查找', '折半查找', '有序数组', '搜索区间', '对数'],
      en: ['Binary search', 'sorted array', 'search interval', 'halving', 'logarithmic search'],
    },
  },
  'cam-follower': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['凸轮从动件', '偏心轮', '滚子', '弹簧预压', '气门机构'],
      en: ['Cam follower', 'eccentric cam', 'roller follower', 'spring preload', 'valvetrain'],
    },
  },
  'screw-jack': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['螺旋千斤顶', '丝杆', '导程', '方牙螺纹', '自锁'],
      en: ['Screw jack', 'power screw', 'lead screw', 'square thread', 'self-locking'],
    },
  },
  'inclined-plane': {
    category: 'mechanisms',
    minAge: 10,
    keywords: {
      zh: ['斜面', '坡道', '省力', '滑动摩擦', '机械功'],
      en: ['Inclined plane', 'ramp', 'kinetic friction', 'mechanical advantage', 'work'],
    },
  },
  'bayes-updating': {
    category: 'math-systems',
    minAge: 12,
    keywords: {
      zh: ['贝叶斯更新', '基准率', '自然频数', '后验概率', '条件概率', '条件独立'],
      en: [
        'Bayesian updating',
        'base rate',
        'natural frequencies',
        'posterior probability',
        'conditional probability',
        'conditional independence',
      ],
    },
  },
  'kepler-orbits': {
    category: 'nature',
    minAge: 10,
    keywords: {
      zh: ['开普勒轨道', '椭圆', '等面积定律', '偏心率', '公转周期', '行星运动'],
      en: [
        'Kepler orbits',
        'ellipse',
        'equal area law',
        'eccentricity',
        'orbital period',
        'planetary motion',
      ],
    },
  },
  'latent-heat': {
    category: 'thermal-fluids',
    minAge: 10,
    keywords: {
      zh: ['潜热', '熔化', '凝固', '相变平台', '冰水', '焓'],
      en: ['Latent heat', 'melting', 'freezing', 'phase plateau', 'ice water', 'enthalpy'],
    },
  },
  'heat-conduction': {
    category: 'thermal-fluids',
    minAge: 10,
    keywords: {
      zh: ['热传导', '导热', '傅里叶定律', '温度梯度', '保温', '稳态'],
      en: [
        'Heat conduction',
        'thermal conductivity',
        'Fourier law',
        'temperature gradient',
        'insulation',
        'steady state',
      ],
    },
  },
  'rc-circuit': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['RC 充放电', '电容充电', '电容放电', '时间常数', '指数衰减'],
      en: [
        'RC charging and discharging',
        'capacitor',
        'time constant',
        'exponential decay',
        'resistor capacitor',
      ],
    },
  },
  'wheatstone-bridge': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['惠斯通电桥', '电阻桥', '检流计', '电势差', '应变片'],
      en: [
        'Wheatstone bridge',
        'resistive bridge',
        'null detector',
        'strain gauge',
        'voltage divider',
      ],
    },
  },
  'pinhole-camera': {
    category: 'light-sound',
    minAge: 10,
    keywords: {
      zh: ['小孔成像', '针孔相机', '倒像', '几何模糊', '衍射'],
      en: ['Pinhole camera', 'camera obscura', 'inverted image', 'geometric blur', 'diffraction'],
    },
  },
  dijkstra: {
    category: 'math-systems',
    minAge: 12,
    keywords: {
      zh: ['Dijkstra 最短路', '最短路径', '迪杰斯特拉', '暂定距离', '贪心算法', '负权边'],
      en: [
        'Dijkstra’s shortest path',
        'shortest path',
        'Dijkstra algorithm',
        'tentative distance',
        'greedy',
        'negative edge',
      ],
    },
  },
  pulley: {
    category: 'mechanisms',
    minAge: 10,
    keywords: {
      zh: ['滑轮组', '定滑轮', '动滑轮', '承重绳段', '绳长'],
      en: ['Pulley systems', 'block and tackle', 'moving pulley', 'fixed pulley', 'rope length'],
    },
  },
  'thin-film-interference': {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['薄膜干涉', '肥皂膜', '油膜', '增透膜', '光程', '反射相位'],
      en: [
        'Thin-film interference',
        'soap film',
        'oil slick',
        'antireflection coating',
        'optical path',
        'reflection phase',
      ],
    },
  },
  'dns-resolution': {
    category: 'computing',
    minAge: 10,
    keywords: {
      zh: ['DNS 分层查找', '域名', '递归解析器', '迭代查询', 'DNS', 'TTL', '缓存过期'],
      en: [
        'DNS resolution',
        'domain name',
        'recursive resolver',
        'iterative query',
        'DNS',
        'TTL',
        'cache expiry',
      ],
    },
  },
  lever: {
    category: 'mechanisms',
    minAge: 10,
    keywords: {
      zh: ['杠杆', '力臂', '支点', '省力', '撬棍', '力矩'],
      en: ['moment arm', 'fulcrum', 'torque', 'crowbar', 'mechanical advantage', 'Lever'],
    },
  },
  'seismic-waves': {
    category: 'nature',
    minAge: 10,
    keywords: {
      zh: ['地震纵横波', '地震', '纵波', '横波', 'P波', 'S波', '到时差'],
      en: [
        'Seismic body waves',
        'earthquake',
        'P wave',
        'S wave',
        'compression',
        'shear',
        'arrival time',
      ],
    },
  },
  osmosis: {
    category: 'thermal-fluids',
    minAge: 12,
    keywords: {
      zh: ['渗透', '反渗透', '净水器', '半透膜', '渗透压', '水势'],
      en: [
        'Osmosis',
        'reverse osmosis',
        'water filter',
        'semipermeable membrane',
        'osmotic pressure',
        'water potential',
      ],
    },
  },
  capillary: {
    category: 'thermal-fluids',
    minAge: 10,
    keywords: {
      zh: ['毛细现象', '毛细管', '纸巾吸水', '表面张力', '接触角', 'Jurin定律'],
      en: [
        'Capillary action',
        'capillary tube',
        'paper towel',
        'surface tension',
        'contact angle',
        'Jurin law',
      ],
    },
  },
  'bayer-sensor': {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['拜耳传感器', '拜耳', '滤色阵列', 'RGGB', '去马赛克', '相机', '假色'],
      en: ['Bayer sensor', 'color filter array', 'RGGB', 'demosaicing', 'false color', 'camera'],
    },
  },
  'radar-ranging': {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['雷达', '脉冲雷达', '回波', '飞行时间', '距离分辨率', '距离歧义'],
      en: [
        'Pulsed radar',
        'radar',
        'pulse radar',
        'echo',
        'time of flight',
        'range resolution',
        'range ambiguity',
      ],
    },
  },
  'lidar-ranging': {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['激光雷达', '点云', '飞行时间', '扫描', '机器人', '遮挡'],
      en: [
        'Lidar ranging',
        'lidar',
        'point cloud',
        'time of flight',
        'laser scanner',
        'robotics',
        'occlusion',
      ],
    },
  },
  'bloom-filter': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['布隆过滤器', '为什么确定没有，却只能说可能有？', '集合查询', '误报', '位阵列'],
      en: ['bloom filter', 'BloomFilter', 'membership query', 'false positive', 'bit array'],
    },
  },
  'tcp-reliability': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['TCP 可靠传输', '网络不可靠，字节流怎样可靠？', '丢包重传', '累计确认', '字节流'],
      en: ['tcp reliability', 'TcpReliability', 'retransmission', 'cumulative ACK', 'byte stream'],
    },
  },
  'congestion-control': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: [
        '拥塞控制',
        '网络堵了，发送者怎样感知并退让？',
        '网络堵塞',
        '慢启动',
        '拥塞窗口',
        'AIMD',
      ],
      en: ['congestion control', 'CongestionControl', 'slow start', 'congestion window', 'AIMD'],
    },
  },
  'consistent-hashing': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: [
        '一致性哈希',
        '扩容一台机器，哪些数据需要换家？',
        '分布式缓存',
        '数据迁移',
        '虚拟节点',
        '哈希环',
      ],
      en: [
        'consistent hashing',
        'ConsistentHashing',
        'distributed cache',
        'virtual nodes',
        'hash ring',
      ],
    },
  },
  coriolis: {
    category: 'nature',
    minAge: 12,
    keywords: {
      zh: ['科里奥利效应', '旋转参照系', '转盘', '惯性', '偏转'],
      en: ['Coriolis effect', 'rotating reference frame', 'turntable', 'inertia', 'deflection'],
    },
  },
  'solar-eclipse': {
    category: 'nature',
    minAge: 10,
    keywords: {
      zh: ['日食', '日全食', '日环食', '本影', '半影', '轨道交点'],
      en: [
        'Solar eclipse',
        'total eclipse',
        'annular eclipse',
        'umbra',
        'penumbra',
        'orbital node',
      ],
    },
  },
  resonance: {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['秋千', '共振', '受迫振动', '阻尼', '固有频率'],
      en: ['swing', 'resonance', 'forced oscillation', 'damping', 'natural frequency'],
    },
  },
  beats: {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['调音', '拍频', '干涉', '包络', '相位差'],
      en: ['tuning', 'beats', 'interference', 'envelope', 'phase difference'],
    },
  },
  'standing-wave': {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['琴弦', '驻波', '谐波', '节点', '波腹'],
      en: ['guitar string', 'standing wave', 'harmonic', 'node', 'antinode'],
    },
  },
  'sampling-aliasing': {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['采样混叠', '采样', '混叠', '奈奎斯特', '车轮倒转', '低通滤波'],
      en: [
        'Sampling & aliasing',
        'sampling',
        'aliasing',
        'Nyquist',
        'wagon wheel',
        'anti alias filter',
      ],
    },
  },
  'fourier-transform': {
    category: 'math-systems',
    minAge: 14,
    keywords: {
      zh: ['傅里叶分解', '傅里叶', '频谱', '谐波', 'DFT', '相位', '频谱泄漏'],
      en: [
        'Fourier decomposition',
        'Fourier transform',
        'spectrum',
        'harmonics',
        'DFT',
        'phase',
        'spectral leakage',
      ],
    },
  },
  huffman: {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['哈夫曼编码', '不丢一个字，怎样少写一些位？', '无损压缩', '前缀码', '码树'],
      en: ['Huffman coding', 'huffman', 'lossless compression', 'prefix code', 'frequency tree'],
    },
  },
  lz77: {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['滑动窗口压缩', '重复出现，为什么不用再写一遍？', 'LZ77', '向后引用', '重叠复制'],
      en: ['Sliding-window compression', 'lz77', 'back reference', 'overlapping copy'],
    },
  },
  'rolling-shutter': {
    category: 'light-sound',
    minAge: 10,
    keywords: {
      zh: ['卷帘快门', '果冻效应', '电子快门', '全局快门', '扫描', '运动模糊'],
      en: ['rolling shutter', 'jello effect', 'global shutter', 'readout time', 'motion blur'],
    },
  },
  'body-fat-scale': {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: [
        '体脂秤',
        '体重秤',
        '生物电阻抗',
        'BIA',
        '四电极',
        '体脂率',
        '身体成分',
        '水分',
        '应变片',
        '称重传感器',
      ],
      en: [
        'Body fat scale',
        'bathroom scale',
        'bioelectrical impedance',
        'BIA',
        'four electrodes',
        'body fat percentage',
        'body composition',
        'hydration',
        'strain gauge',
        'load cell',
      ],
    },
  },
  'ear-thermometer': {
    category: 'light-sound',
    minAge: 10,
    keywords: {
      zh: [
        '耳温枪',
        '耳温计',
        '红外测温',
        '热电堆',
        '鼓膜',
        '耳道',
        '视场',
        '环境补偿',
        '温度传感器',
      ],
      en: [
        'Ear thermometer',
        'tympanic thermometer',
        'infrared thermometry',
        'thermopile',
        'eardrum',
        'ear canal',
        'field of view',
        'ambient compensation',
        'temperature sensor',
      ],
    },
  },
  jellyfish: {
    category: 'thermal-fluids',
    minAge: 10,
    keywords: {
      zh: [
        '水母',
        '月水母',
        '海月水母',
        'Aurelia aurita',
        '游动',
        '脉动',
        '透明伞',
        '涡环',
        '起始涡',
        '停止涡',
        '被动能量回收',
        '生物流体',
      ],
      en: [
        'Jellyfish',
        'moon jelly',
        'Aurelia aurita',
        'swimming',
        'bell pulsation',
        'vortex ring',
        'starting vortex',
        'stopping vortex',
        'passive energy recapture',
        'biological fluid mechanics',
      ],
    },
  },
  'instant-camera': {
    category: 'light-sound',
    minAge: 10,
    keywords: {
      zh: [
        '拍立得',
        '即时相机',
        '一次成像',
        '宝丽来',
        '积分式相纸',
        'i-Type',
        '药囊',
        '滚轮走纸',
        '染料迁移',
        '暗房',
      ],
      en: [
        'Instant camera',
        'Polaroid',
        'integral film',
        'i-Type',
        'instant photography',
        'reagent pod',
        'roller processing',
        'dye diffusion transfer',
        'latent image',
        'darkroom',
      ],
    },
  },
  'cpu-gpu-npu': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: [
        'CPU、GPU、NPU',
        'CPU',
        'GPU',
        'NPU',
        '中央处理器',
        '显卡',
        '神经网络处理器',
        'AI芯片',
        '矩阵乘法',
        '乘加',
        '并行计算',
        '脉动阵列',
        '分支掩码',
      ],
      en: [
        'CPU, GPU and NPU',
        'CPU',
        'GPU',
        'NPU',
        'central processing unit',
        'graphics processing unit',
        'neural processing unit',
        'AI chip',
        'matrix multiply',
        'multiply accumulate',
        'parallel computing',
        'systolic array',
        'branch mask',
      ],
    },
  },
  esim: {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: [
        'eSIM',
        '电子SIM',
        '嵌入式SIM',
        '二维码开卡',
        'eUICC',
        '远程SIM配置',
        'LPA',
        'SM-DP+',
        '绑定profile',
      ],
      en: [
        'eSIM',
        'embedded SIM',
        'QR activation',
        'eUICC',
        'remote SIM provisioning',
        'LPA',
        'SM-DP+',
        'bound profile package',
      ],
    },
  },
  'myopia-lens': {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: [
        '儿童近视防控镜片',
        '近视控制眼镜',
        '离焦镜片',
        'DIMS',
        '微透镜',
        '眼轴',
        '视网膜',
        '近视防控',
        '屈光矫正',
      ],
      en: [
        'Myopia-control lenses',
        'childhood myopia',
        'defocus spectacles',
        'DIMS',
        'lenslets',
        'axial length',
        'retina',
        'refractive correction',
      ],
    },
  },
  'slr-mirrorless': {
    category: 'light-sound',
    minAge: 10,
    keywords: {
      zh: [
        '单反、无反',
        '单反',
        '无反',
        '相机',
        '反光镜',
        '电子取景器',
        '光学取景',
        '快门',
        '五棱镜',
        '实时取景',
      ],
      en: [
        'SLR & mirrorless',
        'SLR',
        'DSLR',
        'mirrorless',
        'camera',
        'reflex mirror',
        'EVF',
        'optical viewfinder',
        'shutter curtains',
        'pentaprism',
        'live view',
      ],
    },
  },
  'cell-handover': {
    category: 'computing',
    minAge: 10,
    keywords: {
      zh: [
        '蜂窝网络与切换',
        '手机信号',
        '基站',
        '小区',
        '切换',
        '越区切换',
        '4G',
        '5G',
        '信号强度',
        'RSRP',
        '迟滞',
        '寻呼',
        '位置更新',
        '蜂窝网络',
        '打电话不断线',
      ],
      en: [
        'Cells and handover',
        'cell phone signal',
        'cell tower',
        'base station',
        'handover',
        'handoff',
        'cellular network',
        'LTE',
        '4G',
        '5G',
        'signal strength',
        'RSRP',
        'hysteresis',
        'paging',
        'tracking area',
        'dropped call',
      ],
    },
  },
  'mobile-5g': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: [
        '4G 与 5G',
        '5G',
        '4G',
        'LTE',
        'NR',
        '网速',
        '手机信号',
        '带宽',
        'OFDM',
        '子载波',
        'QAM',
        '星座图',
        '信噪比',
        '毫米波',
        '波束赋形',
        'MIMO',
        '载波聚合',
        '峰值速率',
      ],
      en: [
        '4G and 5G',
        '5G',
        '4G',
        'LTE',
        'NR',
        'mobile data speed',
        'phone signal',
        'bandwidth',
        'OFDM',
        'subcarrier',
        'QAM',
        'constellation',
        'SNR',
        'millimetre wave',
        'mmWave',
        'beamforming',
        'massive MIMO',
        'carrier aggregation',
        'peak data rate',
      ],
    },
  },
  'mobile-roaming': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: [
        '手机漫游',
        '漫游',
        '国际漫游',
        '出国上网',
        'SIM 卡',
        'IMSI',
        '鉴权',
        '认证',
        '运营商',
        '归属网络',
        '拜访网络',
        'IPX',
        'MILENAGE',
      ],
      en: [
        'Mobile roaming',
        'roaming',
        'international roaming',
        'data roaming abroad',
        'SIM card',
        'IMSI',
        'authentication',
        'AKA',
        'mobile operator',
        'home network',
        'visited network',
        'IPX',
        'MILENAGE',
      ],
    },
  },
  'keyboard-switch': {
    category: 'mechanisms',
    minAge: 10,
    keywords: {
      zh: [
        '机械键盘轴体',
        '机械键盘',
        '键盘轴体',
        '红轴',
        '黑轴',
        '茶轴',
        '青轴',
        '银轴',
        '静音轴',
        '磁轴',
        '光轴',
        '线性轴',
        '段落轴',
        '霍尔效应',
        '快速触发',
        '预行程',
        'RT',
      ],
      en: [
        'mechanical keyboard',
        'keyboard switches',
        'keyboard switch',
        'red switch',
        'black switch',
        'brown switch',
        'blue switch',
        'speed silver',
        'silent red',
        'linear switch',
        'tactile switch',
        'clicky switch',
        'Hall effect',
        'optical switch',
        'rapid trigger',
        'pre-travel',
        'RT',
      ],
    },
  },
  helicopter: {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['直升机', '旋翼', '悬停', '总距', '周期变距', '尾桨', '反扭矩', '下洗', '直升飞机'],
      en: [
        'helicopter',
        'rotorcraft',
        'rotary wing',
        'hover',
        'collective pitch',
        'cyclic pitch',
        'tail rotor',
        'anti torque',
        'downwash',
      ],
    },
  },
  ak47: {
    category: 'weapons-safety',
    minAge: 12,
    keywords: {
      zh: ['AK-47', 'AK47', '卡拉什尼科夫', '长行程导气', '活塞', '回位簧', '机械史', '能量转移'],
      en: [
        'AK-47',
        'Kalashnikov',
        'long stroke gas operation',
        'piston',
        'return spring',
        'mechanical history',
        'energy transfer',
      ],
    },
  },
  landmine: {
    category: 'weapons-safety',
    minAge: 12,
    keywords: {
      zh: [
        '地雷',
        '遗留爆炸物',
        '爆炸物风险教育',
        '外部触发',
        '能量释放',
        '地层剖面',
        '战后风险',
        '安全观察',
      ],
      en: [
        'Landmines',
        'landmine',
        'mine',
        'explosive remnants of war',
        'risk education',
        'triggering',
        'stored energy',
        'soil section',
        'post-conflict danger',
      ],
    },
  },
  'atomic-bomb': {
    category: 'weapons-safety',
    minAge: 12,
    keywords: {
      zh: [
        '原子弹',
        '核裂变',
        '链式反应',
        '临界质量',
        '临界半径',
        '中子',
        '结合能',
        '铀-235',
        '反应堆',
        '缓发中子',
        '增殖因子',
      ],
      en: [
        'Atomic bomb',
        'nuclear fission',
        'chain reaction',
        'critical mass',
        'critical radius',
        'neutron',
        'binding energy',
        'uranium-235',
        'reactor',
        'delayed neutrons',
        'multiplication factor',
        'k-effective',
      ],
    },
  },
  'hydrogen-bomb': {
    category: 'weapons-safety',
    minAge: 14,
    keywords: {
      zh: [
        '氢弹',
        '热核聚变',
        '核聚变',
        '氘氚',
        '库仑势垒',
        '隧穿',
        '伽莫夫峰',
        '点火',
        '氘化锂',
        '托卡马克',
        '惯性约束',
        '太阳为什么发光',
      ],
      en: [
        'Hydrogen bomb',
        'thermonuclear',
        'nuclear fusion',
        'deuterium tritium',
        'Coulomb barrier',
        'tunnelling',
        'Gamow peak',
        'ignition',
        'lithium deuteride',
        'tokamak',
        'inertial confinement',
        'why the Sun shines',
      ],
    },
  },
  nfc: {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: [
        'NFC',
        '近场通信',
        '碰一碰',
        '刷卡',
        '无源标签',
        '被动标签',
        '负载调制',
        '互感',
        '读卡器',
        '感应供电',
      ],
      en: [
        'NFC',
        'near-field communication',
        'tap',
        'contactless card',
        'passive tag',
        'battery-free tag',
        'load modulation',
        'mutual inductance',
        'NFC reader',
        'inductive power',
      ],
    },
  },
  'double-slit': {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['双缝干涉', '杨氏双缝', '光程差', '相位', '亮暗条纹', '光子', '单光子', '衍射包络'],
      en: [
        'Double-slit interference',
        'double slit',
        'Young experiment',
        'interference fringes',
        'path difference',
        'phase',
        'photon',
        'single photon',
        'diffraction envelope',
      ],
    },
  },
  tides: {
    category: 'nature',
    minAge: 12,
    keywords: {
      zh: ['潮汐', '涨潮', '退潮', '大潮', '小潮', '月球引力', '潮汐力', '近侧远侧'],
      en: [
        'Tides',
        'high tide',
        'low tide',
        'spring tide',
        'neap tide',
        'lunar gravity',
        'tidal force',
      ],
    },
  },
  zipper: {
    category: 'mechanisms',
    minAge: 8,
    keywords: {
      zh: ['拉链', '拉锁', '拉头', '拉链齿', '衣服拉链', '齿窝', '咬合'],
      en: [
        'Zipper',
        'zip fastener',
        'slider',
        'zipper teeth',
        'clothes fastener',
        'interlocking teeth',
      ],
    },
  },
  'packet-routing': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['网络分组路由', '数据包', '路由器', '网络拥塞', '丢包', '下一跳', '最短路径', 'TTL'],
      en: [
        'Packet routing',
        'data packets',
        'router',
        'next hop',
        'shortest path',
        'packet loss',
        'network congestion',
        'TTL',
      ],
    },
  },
  diffusion: {
    category: 'thermal-fluids',
    minAge: 10,
    keywords: {
      zh: ['扩散', '颜色散开', '浓度', '染料扩散', '扩散系数', '净通量', '混合'],
      en: [
        'Diffusion',
        'dye spreading',
        'concentration',
        'diffusion coefficient',
        'flux',
        'mixing',
        'mass conservation',
      ],
    },
  },
  'brownian-motion': {
    category: 'thermal-fluids',
    minAge: 12,
    keywords: {
      zh: ['布朗运动', '微粒乱动', '热运动', '随机游走', '朗之万', '热噪声', '均方位移'],
      en: [
        'Brownian motion',
        'random walk',
        'thermal motion',
        'Langevin',
        'thermal noise',
        'mean squared displacement',
        'Stokes Einstein',
      ],
    },
  },
  'database-index': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['数据库索引', '查找记录', '数据库查询', 'B+树', '索引页', '范围查询', '页分裂'],
      en: [
        'Database index',
        'B+ tree',
        'B plus tree',
        'database lookup',
        'range query',
        'page split',
        'table scan',
      ],
    },
  },
  escapement: {
    category: 'mechanisms',
    minAge: 10,
    keywords: {
      zh: ['机械钟擒纵', '摆钟', '机械钟', '擒纵轮', '重锤', '擒纵瓦', '钟表走时'],
      en: [
        'Clock escapement',
        'mechanical clock',
        'pendulum clock',
        'escape wheel',
        'pallet',
        'clock timing',
        'clock weight',
      ],
    },
  },
  'lithium-battery': {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: [
        '锂离子电池',
        '电池',
        '锂电池',
        '充电电池',
        '电量',
        '锂离子',
        '石墨负极',
        '磷酸铁锂',
        '隔膜',
      ],
      en: [
        'Lithium-ion battery',
        'rechargeable battery',
        'Li ion',
        'LFP',
        'lithium iron phosphate',
        'graphite anode',
        'state of charge',
        'separator',
      ],
    },
  },
  'logic-gates': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['逻辑门', '逻辑电路', '与非门', '或非门', '反相器', '晶体管', 'CMOS', '零和一'],
      en: [
        'Logic gates',
        'Boolean logic',
        'NAND',
        'NOR',
        'inverter',
        'transistor',
        'CMOS',
        'digital voltage',
      ],
    },
  },
  'public-key': {
    category: 'computing',
    minAge: 14,
    keywords: {
      zh: ['公钥密码', '公钥', '私钥', 'RSA', '非对称加密', '余数', '模幂', '消息加密'],
      en: [
        'Public-key cryptography',
        'public key',
        'private key',
        'RSA',
        'asymmetric encryption',
        'modular exponentiation',
        'remainder',
      ],
    },
  },
  'solar-cell': {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: [
        '太阳能电池',
        '太阳能发电',
        '光伏',
        '光伏电池',
        '硅电池',
        '光电转换',
        '带隙',
        '最大功率点',
      ],
      en: [
        'Solar cell',
        'photovoltaic',
        'PV',
        'silicon cell',
        'band gap',
        'electron hole pair',
        'maximum power point',
      ],
    },
  },
  convection: {
    category: 'thermal-fluids',
    minAge: 10,
    keywords: {
      zh: ['热对流', '热空气上升', '暖流', '热水流动', '浮力', '传导', '热循环'],
      en: [
        'Convection',
        'warm air rising',
        'buoyancy',
        'heat circulation',
        'conduction',
        'Rayleigh Benard',
        'fluid parcel',
      ],
    },
  },
  rectifier: {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: ['整流器', '整流桥', '二极管桥', '交流变直流', '全波整流', '滤波电容', '纹波', '浪涌'],
      en: [
        'Rectifier',
        'bridge rectifier',
        'diode bridge',
        'AC to DC',
        'full wave rectification',
        'smoothing capacitor',
        'ripple',
        'inrush current',
      ],
    },
  },
  'sewing-machine': {
    category: 'mechanisms',
    minAge: 10,
    keywords: {
      zh: ['缝纫机', '缝纫', '缝衣服', '针眼', '梭心', '旋梭', '挑线杆', '锁式线迹'],
      en: [
        'Sewing machine',
        'stitching',
        'lockstitch',
        'needle eye',
        'bobbin',
        'rotary hook',
        'take up lever',
        'feed dogs',
      ],
    },
  },
  'induction-cooktop': {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: ['电磁炉', '电磁灶', '电磁加热', '锅底发热', '涡流', '感应加热', '集肤效应'],
      en: [
        'Induction cooktop',
        'induction hob',
        'induction heating',
        'eddy current',
        'pan heating',
        'skin effect',
        'thermal lag',
      ],
    },
  },
  hash: {
    category: 'computing',
    minAge: 14,
    keywords: {
      zh: ['哈希', '散列', '哈希值', '消息摘要', 'SHA-256', '雪崩效应', '位运算'],
      en: [
        'Hash',
        'hash function',
        'SHA 256',
        'message digest',
        'avalanche effect',
        'bit rotation',
        'cryptographic hash',
      ],
    },
  },
  'buck-converter': {
    category: 'electricity',
    minAge: 14,
    keywords: {
      zh: ['降压变换器', '降压电路', '开关电源', 'DC-DC', '电感续流', '占空比', '降压斩波'],
      en: [
        'Buck converter',
        'step down converter',
        'DC DC',
        'switching regulator',
        'duty cycle',
        'freewheeling',
        'volt second balance',
      ],
    },
  },
  microscope: {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['显微镜', '复合显微镜', '物镜', '目镜', '标本', '放大与分辨率', '数值孔径'],
      en: [
        'Compound microscope',
        'objective lens',
        'eyepiece',
        'specimen',
        'optical resolution',
        'numerical aperture',
        'empty magnification',
      ],
    },
  },
  airfoil: {
    category: 'thermal-fluids',
    minAge: 12,
    keywords: {
      zh: ['机翼升力', '飞机机翼', '升力', '攻角', '迎角', '气流', '环量', '压力分布'],
      en: [
        'Airfoil lift',
        'airplane wing',
        'angle of attack',
        'airflow',
        'circulation',
        'Kutta condition',
        'pressure distribution',
      ],
    },
  },
  'qr-code': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['二维码', '二维码扫描', '扫码', '网址编码', '定位图案', '掩码', '纠错码'],
      en: [
        'QR Code',
        'QR',
        'quick response code',
        'scan a code',
        'finder pattern',
        'data masking',
        'Reed Solomon',
      ],
    },
  },
  speaker: {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['扬声器', '喇叭', '音箱', '音圈', '纸盆', '扬声器振膜', '反电动势'],
      en: [
        'Speaker',
        'loudspeaker',
        'voice coil',
        'speaker cone',
        'diaphragm',
        'back EMF',
        'frequency response',
      ],
    },
  },
  'wireless-charging': {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: ['无线充电', '无线充电器', '感应充电', '充电线圈', '互感', '磁耦合', '线圈对齐'],
      en: [
        'Wireless charging',
        'inductive charging',
        'charging pad',
        'mutual inductance',
        'magnetic coupling',
        'coil alignment',
        'resonance',
      ],
    },
  },
  lock: {
    category: 'mechanisms',
    minAge: 8,
    keywords: {
      zh: ['弹子锁', '钥匙', '锁芯', '门锁', '弹子', '剪切线', '钥匙齿形'],
      en: [
        'Pin-tumbler lock',
        'door lock',
        'key',
        'lock cylinder',
        'pins',
        'shear line',
        'key bitting',
      ],
    },
  },
  ultrasound: {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['超声成像', 'B超', '超声波', '医学成像', '回声', '超声探头', '往返时间'],
      en: [
        'Ultrasound imaging',
        'sonography',
        'ultrasound scan',
        'echo',
        'transducer',
        'time of flight',
        'acoustic impedance',
      ],
    },
  },
  differential: {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['汽车差速器', '差速齿轮', '汽车转弯', '左右车轮', '开放式差速器', '半轴齿轮', '扭矩'],
      en: [
        'Car differential',
        'differential gears',
        'turning wheels',
        'open differential',
        'side gear',
        'axle',
        'torque',
      ],
    },
  },
  'error-correction': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['纠错编码', '数据纠错', '汉明码', '奇偶校验', '校验位', '比特翻转', '单错双错'],
      en: [
        'Error correction',
        'Hamming code',
        'parity bit',
        'bit flip',
        'syndrome',
        'SECDED',
        'single error correction',
      ],
    },
  },
  bernoulli: {
    category: 'thermal-fluids',
    minAge: 12,
    keywords: {
      zh: ['流速与压强', '伯努利', '水流', '管道压强', '文丘里', '测压管', '水头'],
      en: [
        'Flow speed and pressure',
        'Bernoulli',
        'Venturi',
        'pipe pressure',
        'flow velocity',
        'piezometer',
        'hydraulic head',
      ],
    },
  },
  doppler: {
    category: 'light-sound',
    minAge: 10,
    keywords: {
      zh: ['多普勒效应', '救护车声音', '警笛变调', '声源移动', '频率变化', '波长', '多普勒频移'],
      en: [
        'Doppler effect',
        'moving siren',
        'Doppler shift',
        'moving source',
        'wavelength',
        'received frequency',
        'wavefront',
      ],
    },
  },
  'induction-motor': {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: ['感应电动机', '异步电动机', '三相电机', '鼠笼转子', '旋转磁场', '转差', '电动机'],
      en: [
        'Induction motor',
        'asynchronous motor',
        'three phase motor',
        'squirrel cage',
        'rotating magnetic field',
        'slip',
        'electric motor',
      ],
    },
  },
  'wave-interference': {
    category: 'light-sound',
    minAge: 10,
    keywords: {
      zh: ['波的干涉', '波叠加', '绳波', '相长干涉', '相消干涉', '驻波', '波节'],
      en: [
        'Wave interference',
        'superposition',
        'string pulses',
        'constructive interference',
        'destructive interference',
        'standing wave',
        'nodes',
      ],
    },
  },
  rainbow: {
    category: 'light-sound',
    minAge: 10,
    keywords: {
      zh: ['彩虹', '雨后彩虹', '水滴折射', '色散', '主虹', '太阳光', '彩虹角度'],
      en: [
        'Rainbows',
        'raindrop',
        'dispersion',
        'refraction',
        'primary rainbow',
        'sunlight',
        'rainbow angle',
      ],
    },
  },
  'water-hammer': {
    category: 'thermal-fluids',
    minAge: 12,
    keywords: {
      zh: ['水锤', '水管响', '突然关阀', '水击', '压力波', '管道震动', '阀门'],
      en: [
        'Water hammer',
        'pipe bang',
        'hydraulic shock',
        'pressure wave',
        'valve closure',
        'pipe vibration',
        'water surge',
      ],
    },
  },
  suspension: {
    category: 'mechanisms',
    minAge: 10,
    keywords: {
      zh: ['汽车悬架', '汽车减震', '减振器', '避震', '悬挂', '弹簧', '路面颠簸'],
      en: ['Car suspension', 'shock absorber', 'damper', 'spring', 'road bump', 'ride comfort'],
    },
  },
  diffraction: {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['衍射', '单缝衍射', '光穿狭缝', '暗纹', '波长', '远场', '夫琅禾费'],
      en: [
        'Diffraction',
        'single slit',
        'light through a slit',
        'Fraunhofer diffraction',
        'diffraction minima',
        'far field',
        'wavelength',
      ],
    },
  },
  'memory-cache': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['内存与缓存', 'CPU缓存', '高速缓存', '缓存行', '命中', '未命中', '局部性', 'LRU'],
      en: [
        'Memory and cache',
        'CPU cache',
        'cache line',
        'cache hit',
        'cache miss',
        'locality',
        'LRU',
        'tag and set',
      ],
    },
  },
  'electric-generator': {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: ['发电机', '发电', '线圈转动', '交流发电机', '磁通量', '滑环', '电磁感应'],
      en: [
        'Electric generator',
        'generator',
        'alternator',
        'rotating coil',
        'magnetic flux',
        'slip ring',
        'electromagnetic induction',
      ],
    },
  },
  siphon: {
    category: 'thermal-fluids',
    minAge: 10,
    keywords: {
      zh: ['虹吸', '吸水管', '虹吸管', '水往高处流', '排空气', '水位差', '连通水柱'],
      en: [
        'Siphon',
        'siphon tube',
        'priming',
        'water level difference',
        'continuous water column',
        'pressure head',
      ],
    },
  },
  'ball-bearing': {
    category: 'mechanisms',
    minAge: 10,
    keywords: {
      zh: ['滚珠轴承', '轴承', '滚珠', '钢珠', '内圈外圈', '保持架', '滚动摩擦'],
      en: [
        'Ball bearing',
        'bearing',
        'steel balls',
        'inner race',
        'outer race',
        'cage',
        'rolling contact',
      ],
    },
  },
  seasons: {
    category: 'nature',
    minAge: 10,
    keywords: {
      zh: ['季节', '四季', '地轴倾斜', '夏至冬至', '春分秋分', '白昼长短', '极昼'],
      en: [
        'Seasons',
        'axial tilt',
        'solstice',
        'equinox',
        'day length',
        'midnight sun',
        'hemispheres',
      ],
    },
  },
  polarization: {
    category: 'light-sound',
    minAge: 12,
    keywords: {
      zh: ['偏振', '偏振片', '偏光镜', '偏光太阳镜', '电场方向', '马吕斯定律', '交叉偏振'],
      en: [
        'Polarization',
        'polarizer',
        'polarized sunglasses',
        'electric field orientation',
        'Malus law',
        'crossed polarizers',
      ],
    },
  },
  'cpu-pipeline': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: [
        'CPU 指令流水线',
        '处理器',
        '指令流水线',
        '五级流水线',
        '数据前递',
        '流水线停顿',
        '分支预测',
      ],
      en: [
        'CPU instruction pipeline',
        'processor',
        'instruction pipeline',
        'forwarding',
        'pipeline stall',
        'data hazard',
        'branch flush',
      ],
    },
  },
  'transformer-electric': {
    category: 'electricity',
    minAge: 12,
    keywords: {
      zh: ['变压器', '电力变压器', '升压', '降压', '匝数', '绕组', '铁芯', '电磁感应'],
      en: [
        'Electrical transformer',
        'power transformer',
        'step up',
        'step down',
        'turns ratio',
        'winding',
        'magnetic core',
      ],
    },
  },
  'moon-phases': {
    category: 'nature',
    minAge: 8,
    keywords: {
      zh: ['月相', '月亮形状', '月牙', '满月', '新月', '盈亏', '月食', '月球'],
      en: [
        'Moon phases',
        'crescent moon',
        'full moon',
        'new moon',
        'lunar phases',
        'lunar eclipse',
        'Moon',
      ],
    },
  },
  excavator: {
    category: 'mechanisms',
    minAge: 10,
    keywords: {
      zh: ['挖掘机', '挖土机', '液压', '油缸', '动臂', '斗杆', '铲斗', '压力', '流量', '溢流阀'],
      en: [
        'Excavator',
        'digger',
        'hydraulics',
        'hydraulic cylinder',
        'boom',
        'stick',
        'bucket',
        'pressure',
        'flow',
        'relief valve',
      ],
    },
  },
  'hydraulic-brake': {
    category: 'mechanisms',
    minAge: 10,
    keywords: {
      zh: ['液压刹车', '液压制动', '碟刹', '刹车手柄', '刹车油', '主缸', '活塞面积'],
      en: [
        'Hydraulic brakes',
        'disc brake',
        'brake lever',
        'brake fluid',
        'master cylinder',
        'piston area',
        'brake pads',
      ],
    },
  },
  'binary-adder': {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['二进制加法', '二进制', '一加一', '半加器', '全加器', '进位', '溢出'],
      en: [
        'Binary addition',
        'binary',
        'half adder',
        'full adder',
        'carry',
        'ripple carry',
        'overflow',
      ],
    },
  },
  'optical-fiber': {
    category: 'light-sound',
    minAge: 10,
    keywords: {
      zh: ['光纤', '光缆', '玻璃导光', '全反射', '纤芯', '包层', '临界角', '光通信'],
      en: [
        'Optical fiber',
        'fiber optic cable',
        'total internal reflection',
        'core',
        'cladding',
        'critical angle',
        'optical communication',
      ],
    },
  },
  'planetary-gears': {
    category: 'mechanisms',
    minAge: 12,
    keywords: {
      zh: ['行星齿轮', '齿轮箱', '太阳轮', '行星轮', '内齿圈', '行星架', '减速器'],
      en: [
        'Planetary gearing',
        'epicyclic gearing',
        'sun gear',
        'planet gear',
        'ring gear',
        'planet carrier',
        'gearbox',
      ],
    },
  },
  'four-stroke-engine': {
    category: 'mechanisms',
    minAge: 10,
    keywords: {
      zh: ['四冲程发动机', '汽油发动机', '内燃机', '四冲程', '活塞', '曲轴', '进气压缩做功排气'],
      en: [
        'Four-stroke engine',
        'four stroke',
        'combustion engine',
        'piston',
        'crankshaft',
        'intake compression power exhaust',
        'connecting rod',
      ],
    },
  },
  'camera-lens': {
    category: 'light-sound',
    minAge: 10,
    keywords: {
      zh: ['镜头成像', '相机镜头', '凸透镜', '对焦', '倒像', '实像', '焦距'],
      en: [
        'Camera lenses',
        'camera lens',
        'convex lens',
        'focus',
        'inverted image',
        'real image',
        'focal length',
      ],
    },
  },
  aperture: {
    category: 'light-sound',
    minAge: 10,
    keywords: {
      zh: ['光圈与景深', '光圈', '背景虚化', '景深', '散景', '焦外模糊', 'f值'],
      en: [
        'Aperture and depth of field',
        'aperture',
        'bokeh',
        'depth of field',
        'defocus',
        'f number',
        'exposure',
      ],
    },
  },
  bicycle: {
    category: 'mechanisms',
    minAge: 10,
    keywords: {
      zh: ['自行车变速', '变速自行车', '脚踏车', '链条', '链盘', '飞轮', '上坡省力', '传动比'],
      en: [
        'Bicycle gears',
        'bicycle',
        'cycling gears',
        'chain',
        'chainring',
        'rear sprocket',
        'gear ratio',
        'cycling uphill',
      ],
    },
  },
  refrigerator: {
    category: 'thermal-fluids',
    minAge: 10,
    keywords: {
      zh: ['冰箱制冷', '冰箱', '热泵', '制冷剂', '压缩机', '蒸发冷凝', '冰箱背面发热'],
      en: [
        'Refrigeration',
        'fridge',
        'heat pump',
        'refrigerant',
        'compressor',
        'evaporation',
        'condensation',
        'heat transfer',
      ],
    },
  },
  printer: {
    category: 'electricity',
    minAge: 10,
    keywords: {
      zh: ['激光打印机', '打印机', '复印机', '激光打印', '感光鼓', '碳粉', '静电成像', '定影'],
      en: [
        'Laser printing',
        'laser printer',
        'photocopier',
        'photoconductor',
        'toner',
        'electrostatic printing',
        'fuser',
      ],
    },
  },
  noise: {
    category: 'light-sound',
    minAge: 10,
    keywords: {
      zh: ['主动降噪', '降噪耳机', '主动降噪耳机', '反相声波', '噪声抵消', '相位', '延迟'],
      en: [
        'Active noise control',
        'noise cancelling headphones',
        'ANC',
        'anti noise',
        'phase cancellation',
        'amplitude matching',
        'delay',
      ],
    },
  },
  gps: {
    category: 'math-systems',
    minAge: 12,
    keywords: {
      zh: ['GPS 定位', '卫星导航', '手机定位', '测距', '三边定位', '时钟误差', '伪距'],
      en: [
        'GPS positioning',
        'GPS',
        'satellite navigation',
        'trilateration',
        'ranging',
        'clock bias',
        'pseudorange',
      ],
    },
  },
  network: {
    category: 'computing',
    minAge: 10,
    keywords: {
      zh: ['网页加载', '打开网页', '上网', '浏览器', 'DNS', 'TCP', 'TLS', 'HTTP', '网络缓存'],
      en: [
        'Loading a webpage',
        'web browsing',
        'DNS',
        'TCP',
        'TLS',
        'HTTP',
        'browser cache',
        'web request',
      ],
    },
  },
  jpeg: {
    category: 'computing',
    minAge: 12,
    keywords: {
      zh: ['JPEG 压缩', '图片压缩', '照片压缩', 'JPG', 'DCT', '量化', '像素块', '有损压缩'],
      en: [
        'JPEG compression',
        'JPEG',
        'JPG',
        'image compression',
        'DCT',
        'quantization',
        'pixel block',
        'lossy compression',
      ],
    },
  },
  transformer: {
    category: 'computing',
    minAge: 14,
    keywords: {
      zh: [
        '大模型训练与生成',
        '大语言模型',
        '人工智能',
        'LLM',
        'Transformer',
        '注意力',
        '训练推理',
        '词元',
        '梯度',
      ],
      en: [
        'Training & generation',
        'AI',
        'artificial intelligence',
        'GPT',
        'neural network',
        'large language model',
        'LLM',
        'Transformer',
        'attention',
        'token',
        'gradient',
        'training',
        'inference',
      ],
    },
  },
  dimensions: {
    category: 'math-systems',
    minAge: 12,
    keywords: {
      zh: ['多维空间', '四维空间', '高维', '超立方体', '投影', '切片', '特征维度'],
      en: [
        'Higher dimensions',
        '4D',
        'higher dimensional space',
        'hypercube',
        'tesseract',
        'projection',
        'cross section',
        'feature dimension',
      ],
    },
  },
  pendulum: {
    category: 'mechanisms',
    minAge: 8,
    keywords: {
      zh: ['钟摆', '单摆', '摆钟', '秋千', '来回摆动', '周期', '阻尼'],
      en: ['The pendulum', 'pendulum', 'swing', 'oscillation', 'period', 'gravity', 'damping'],
    },
  },
  elevator: {
    category: 'math-systems',
    minAge: 10,
    keywords: {
      zh: ['电梯调度', '升降梯', '等电梯', '电梯排队', '最近优先', '顺路停靠', '调度算法'],
      en: [
        'Lift scheduling',
        'elevator',
        'waiting time',
        'queue',
        'nearest first',
        'collective control',
        'dispatch strategy',
      ],
    },
  },
  traffic: {
    category: 'math-systems',
    minAge: 10,
    keywords: {
      zh: ['无事故堵车', '堵车', '幽灵堵车', '拥堵波', '刹车反应', '车距', '跟车模型'],
      en: [
        'Phantom traffic jams',
        'traffic jam',
        'phantom jam',
        'stop and go wave',
        'car following',
        'reaction time',
        'headway',
      ],
    },
  },
};
