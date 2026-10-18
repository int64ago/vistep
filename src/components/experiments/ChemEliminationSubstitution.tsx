import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  silverTest,
  gasEvidence,
  apparatus,
  gasMarker,
  polyline,
  netChange,
  type Route,
  type Washer,
  type Gas,
} from '../../models/chem-elimination-substitution';
import '../../styles/chem-elimination-substitution.css';
const modes = [
  'hydrolysis',
  'sampling',
  'silver',
  'butanol',
  'elimination',
  'water-wash',
  'ethanol',
  'alkene-tests',
] as const;
type Mode = (typeof modes)[number];
const names = [
  '水相中的取代',
  '取上层水样',
  '排除氢氧根干扰',
  '确认醇类产物',
  '醇溶液中的消去',
  '水洗气的对照',
  '乙醇脱水与碱洗气',
  '净化后的烯烃检验',
];
function Net({ eliminate, p, butyl = false }: { eliminate: boolean; p: number; butyl?: boolean }) {
  const n = netChange(eliminate ? 'elimination' : 'substitution', p),
    H = eliminate ? n.H : { x: 110, y: 45 };
  return (
    <svg
      className="ces-net"
      viewBox="0 0 340 215"
      role="img"
      aria-label={t('保留碳骨架的净键变化，不表示基元过程')}
    >
      <g stroke="#859b8d" strokeWidth="3">
        <path d="M130 100H162" />
        <path d="M130 110H162" opacity={n.pi} />
        <path d={`M185 100L${n.Br.x} ${n.Br.y}`} opacity={n.cBr} />
        <path d={`M110 83L${H.x} ${H.y}`} opacity={n.cH} />
        <path d={`M185 100L${n.OH.x} ${n.OH.y}`} opacity={n.cO} />
        {eliminate && <path d={`M${H.x} ${H.y}L280 175`} opacity={p} />}
      </g>
      <g textAnchor="middle">
        <text x="110" y="108">
          {butyl ? 'CH' : 'CH₂'}
        </text>
        {butyl && (
          <>
            <path d="M88 100H38" stroke="#859b8d" strokeWidth="3" />
            <text x="35" y="85">
              C₂H₅
            </text>
          </>
        )}
        <text x="185" y="108">
          CH₂
        </text>
        <text x={n.Br.x} y={n.Br.y + 7} fill="#a88156">
          {p > 0.7 ? 'Br⁻' : 'Br'}
        </text>
        <text x={n.OH.x} y={n.OH.y + 7} fill="#a46f60">
          {p > 0.7 ? 'OH' : 'OH⁻'}
        </text>
        <text x={H.x} y={H.y + 7}>
          H
        </text>
      </g>
    </svg>
  );
}
function EvidenceTube({
  x,
  source = false,
  progress = 0,
  acid = true,
  water = true,
}: {
  x: number;
  source?: boolean;
  progress?: number;
  acid?: boolean;
  water?: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    r = silverTest(progress, acid, water);
  return (
    <g transform={`translate(${x} 0)`}>
      <defs>
        <clipPath id={id}>
          <path d="M-28 45V180Q-28 208 0 208T28 180V45Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <path d="M-28 82H28V220H-28Z" fill="#d8e6dd" />
        {source && <path d="M-28 151H28V220H-28Z" fill="#d4bc8c" />}
        {!source &&
          Array.from({ length: 24 }, (_, i) => (
            <circle
              key={i}
              cx={-21 + ((i * 13) % 43)}
              cy={195 - (i % 4) * 6}
              r={2.5}
              fill={r.ag2O > 0 ? '#8d7151' : '#e5d99f'}
              opacity={Math.min(1, (r.agBr + r.ag2O) * 1.5)}
            />
          ))}
      </g>
      <path d="M-32 40V180Q-32 212 0 212T32 180V40" stroke="#99ada1" strokeWidth="2" fill="none" />
      <path d="M-23 51V178" stroke="#fff" strokeWidth="3" opacity=".7" />
    </g>
  );
}
function Sampling({
  p,
  silver,
  acid,
  water,
  x,
}: {
  p: number;
  silver: boolean;
  acid: boolean;
  water: boolean;
  x: number;
}) {
  const sampleP = ease(ramp(p, 0.12, 0.68)),
    px = 75 + 180 * sampleP,
    py = 108 - 70 * Math.sin(Math.PI * sampleP),
    r = silverTest(x, acid, water);
  return (
    <div className="ces-sample">
      <svg viewBox="0 0 330 235" role="img" aria-label={t('由上层水相取样，转移到另一个试管')}>
        <EvidenceTube x={75} source />
        <EvidenceTube x={255} progress={silver ? x : 0} acid={acid} water={water} />
        {!silver && (
          <g transform={`translate(${px} ${py})`}>
            <path d="M0 0V-65" stroke="#92a99c" strokeWidth="8" strokeLinecap="round" />
            <path d="M0 -4V-32" stroke="#88a5b7" strokeWidth="3" />
            <ellipse cy="-70" rx="11" ry="8" fill="#a7b1a2" />
            <circle cy="8" r="4" fill="#88a5b7" opacity={ramp(p, 0.68, 0.9)} />
          </g>
        )}
        <text x="75" y="232" textAnchor="middle">
          ①
        </text>
        <text x="255" y="232" textAnchor="middle">
          ②
        </text>
      </svg>
      <div className="ces-labels">
        <span>① {t('上层水相')}</span>
        <span>② {t(silver ? (acid ? 'HNO₃ 后加 AgNO₃' : '未酸化：干扰未排除') : '转移水样')}</span>
      </div>
      {silver && (
        <strong className="ces-result">
          {t(
            r.ag2O > 0
              ? 'Ag₂O 干扰：不能只凭浑浊判断'
              : r.agBr > 0
                ? '浅黄色 AgBr：水样中有 Br⁻'
                : '没有 AgBr 阳性证据',
          )}
        </strong>
      )}
    </div>
  );
}
function GasTrain({
  mobile,
  route,
  washer,
  detector,
  p,
  alkene,
  impurity,
}: {
  mobile: boolean;
  route: Route;
  washer: Washer;
  detector: 'mn' | 'br';
  p: number;
  alkene: boolean;
  impurity: boolean;
}) {
  const a = apparatus(mobile),
    result = gasEvidence(route, washer, alkene, impurity, detector),
    uid = useId().replace(/:/g, ''),
    fade = ramp(p, 0.78, 0.98),
    gas: Gas = route === 'ethanol' ? 'sulfurDioxide' : 'ethanol';
  return (
    <svg
      className={mobile ? 'ces-mobile' : 'ces-desktop'}
      viewBox={mobile ? '0 0 300 345' : '0 0 530 280'}
      role="img"
      aria-label={t('发生装置、长进短出洗气管和单个检验管')}
    >
      <defs>
        <clipPath id={uid}>
          <circle cx={a.source.x} cy={a.source.y} r="38" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid})`}>
        <rect x={a.source.x - 40} y={a.source.y + 7} width="80" height="40" fill="#dccca2" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={a.source.x - 13 + i * 13} cy={a.source.y + 28} r="3" fill="#a69c83" />
        ))}
      </g>
      <path
        d={`M${a.source.x - 17} ${a.source.y - 68}V${a.source.y - 34}A38 38 0 1 0 ${a.source.x + 17} ${a.source.y - 34}V${a.source.y - 68}`}
        fill="none"
        stroke="#91a79b"
        strokeWidth="2.3"
      />
      <path
        d={`M${a.source.x - 19} ${a.source.y - 70}h38l-3 13h-32Z`}
        fill="#b9b09a"
        stroke="#9b9f8c"
      />
      <path
        d={`M${a.source.x - 24} ${a.source.y + 48}H${a.source.x + 24}`}
        stroke="#ba9874"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {route === 'ethanol' && (
        <>
          <path
            d={`M${a.source.x - 8} ${a.source.y - 80}V${a.source.y + 20}`}
            stroke="#9baca0"
            strokeWidth="5"
          />
          <path
            d={`M${a.source.x - 8} ${a.source.y - 55}V${a.source.y + 20}`}
            stroke="#b27c6c"
            strokeWidth="2"
          />
          <circle cx={a.source.x - 8} cy={a.source.y + 20} r="4" fill="#b27c6c" />
        </>
      )}
      {[a.wash, a.test].map((v, i) => (
        <g key={i}>
          {i === 0 && (
            <path d={`M${v.x - 34} ${v.y - 66}h68l-4 12h-60Z`} fill="#b9b09a" stroke="#9b9f8c" />
          )}
          <path
            d={`M${v.x - 32} ${v.y - 64}V${v.y + 29}Q${v.x - 32} ${v.y + 55} ${v.x} ${v.y + 55}T${v.x + 32} ${v.y + 29}V${v.y - 64}`}
            fill="none"
            stroke="#91a79b"
            strokeWidth="2"
          />
          <path
            d={`M${v.x - 28} ${v.y - 11}H${v.x + 28}V${v.y + 29}Q${v.x + 28} ${v.y + 51} ${v.x} ${v.y + 51}T${v.x - 28} ${v.y + 29}Z`}
            fill={i === 0 ? '#cdded3' : detector === 'mn' ? '#a680b3' : '#c6a26a'}
            opacity={i === 0 ? 0.8 : result.positive ? 1 - 0.9 * fade : 1}
          />
          <text x={v.x} y={v.y + 80} textAnchor="middle">
            {i === 0 ? '②' : '③'}
          </text>
        </g>
      ))}
      {[a.feed, a.outlet].map((path, i) => (
        <g key={i}>
          <path
            d={polyline(path)}
            stroke="#adc0b5"
            strokeWidth="10"
            fill="none"
            strokeLinejoin="round"
          />
          <path
            d={polyline(path)}
            stroke="#f6f6e9"
            strokeWidth="5"
            fill="none"
            strokeLinejoin="round"
          />
        </g>
      ))}
      {[...(alkene ? ['alkene' as Gas] : []), ...(impurity ? [gas] : [])].map((g, i) => {
        const m = gasMarker(mobile, Math.max(0, Math.min(1, (p - 0.08 * i) / 0.92)), g, washer);
        return (
          <g key={g} transform={`translate(${m.x} ${m.y})`}>
            <circle
              r={g === 'alkene' ? 6 : 5}
              fill={g === 'alkene' ? '#6d9a86' : '#be975c'}
              stroke="#fff"
              strokeWidth="1.5"
            />
            {m.captured && <circle r="10" fill="none" stroke="#be975c" opacity=".6" />}
          </g>
        );
      })}
      <text
        x={mobile ? a.source.x - 48 : a.source.x}
        y={a.source.y + (mobile ? 55 : 80)}
        textAnchor="middle"
      >
        ①
      </text>
    </svg>
  );
}
export default function ChemEliminationSubstitution({ variant }: { variant?: string }) {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(
      modes.includes(variant as Mode) ? (variant as Mode) : 'hydrolysis',
    ),
    [progress, setProgress] = useState(1),
    [acid, setAcid] = useState('yes'),
    [water, setWater] = useState('water'),
    [wash, setWash] = useState<Washer>('water'),
    [detector, setDetector] = useState<'mn' | 'br'>('mn'),
    [gas, setGas] = useState('both');
  const m = f.watch ? modes[Math.min(7, f.chapter)] : mode,
    p = f.watch ? f.chapterProgress : progress,
    route: Route = m === 'ethanol' || m === 'alkene-tests' ? 'ethanol' : 'bromobutane',
    w = f.watch ? (route === 'ethanol' ? 'base' : 'water') : wash,
    det = f.watch ? (m === 'alkene-tests' && p > 0.55 ? 'br' : 'mn') : detector,
    gp = f.watch
      ? ease(ramp(m === 'alkene-tests' ? (p > 0.55 ? (p - 0.55) / 0.45 : p / 0.55) : p, 0.06, 0.88))
      : p,
    gasMode = m === 'water-wash' || m === 'ethanol' || m === 'alkene-tests',
    x = f.watch ? ease(ramp(p, 0.1, 0.8)) : progress,
    result = gasEvidence(route, w, f.watch || gas !== 'impurity', f.watch || gas !== 'pure', det);
  return (
    <div className={`ces ${f.watch ? 'is-watch' : ''}`}>
      <div className="ces-stage">
        {m === 'elimination' ? (
          <>
            <Net eliminate p={x} butyl />
            <p className="ces-equation">C₄H₉Br + OH⁻ → C₄H₈ + Br⁻ + H₂O</p>
            <p className="ces-condition">{t('NaOH 醇溶液 · 加热')}</p>
          </>
        ) : gasMode ? (
          <>
            <GasTrain
              mobile={false}
              route={route}
              washer={w}
              detector={det}
              p={gp}
              alkene={f.watch || gas !== 'impurity'}
              impurity={f.watch || gas !== 'pure'}
            />
            <GasTrain
              mobile
              route={route}
              washer={w}
              detector={det}
              p={gp}
              alkene={f.watch || gas !== 'impurity'}
              impurity={f.watch || gas !== 'pure'}
            />
            <div className="ces-key">
              <span>
                ① {t(route === 'ethanol' ? '乙醇 / 浓硫酸 · 170°C' : '1-溴丁烷 / NaOH 醇溶液')}
              </span>
              <span>
                ②{' '}
                {t(
                  w === 'water'
                    ? '水：吸收乙醇蒸气'
                    : w === 'base'
                      ? 'NaOH：吸收酸性杂质'
                      : '空管：不净化',
                )}
              </span>
              <span>③ {t(det === 'mn' ? '酸性 KMnO₄' : 'Br₂ / CCl₄ · 分别检验')}</span>
            </div>
            <div className="ces-legend">
              <span>
                <i />
                {t('烯烃标记')}
              </span>
              <span>
                <i className="impurity" />
                {t(route === 'ethanol' ? 'SO₂ 杂质标记' : '乙醇蒸气标记')}
              </span>
            </div>
            {!f.watch && (
              <strong className="ces-result">
                {t(
                  !result.positive
                    ? '检验不褪色'
                    : result.falsePositive
                      ? '会褪色，但杂质也能造成阳性'
                      : '净化后烯烃使检验液褪色',
                )}
              </strong>
            )}
          </>
        ) : m === 'sampling' || m === 'silver' ? (
          <Sampling
            p={p}
            silver={m === 'silver'}
            acid={f.watch || acid === 'yes'}
            water={f.watch || water === 'water'}
            x={f.watch ? 1 : progress}
          />
        ) : m === 'butanol' ? (
          <>
            <Net eliminate={false} p={x} butyl />
            <div className="ces-evidence">
              <b>{t('先分离产物，再组合证据')}</b>
              <span>{t('红外：O—H 特征吸收')}</span>
              <span>{t('质谱：相对分子质量 74')}</span>
              <small>{t('单个 O—H 吸收峰不能区分丁醇与乙醇。')}</small>
            </div>
          </>
        ) : (
          <>
            <Net eliminate={false} p={x} />
            <p className="ces-equation">C₂H₅Br + OH⁻ → C₂H₅OH + Br⁻</p>
            <p className="ces-condition">{t('NaOH 水溶液 · 加热')}</p>
          </>
        )}
      </div>
      {!f.watch && (
        <div className="ces-controls">
          <Segments
            label={t('证据环节')}
            value={mode}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          <Range
            label={t('教学进程')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {m === 'silver' && (
            <>
              <Segments
                label={t('先用稀硝酸酸化')}
                value={acid}
                options={[
                  { value: 'yes', label: t('已酸化') },
                  { value: 'no', label: t('未酸化') },
                ]}
                onChange={setAcid}
              />
              <Segments
                label={t('所取液层')}
                value={water}
                options={[
                  { value: 'water', label: t('上层水相') },
                  { value: 'organic', label: t('下层有机相') },
                ]}
                onChange={setWater}
              />
            </>
          )}
          {gasMode && (
            <>
              <Segments
                label={t('洗气液')}
                value={wash}
                options={[
                  { value: 'water', label: t('水') },
                  { value: 'base', label: t('NaOH 溶液') },
                  { value: 'none', label: t('空管') },
                ]}
                onChange={(v) => setWash(v as Washer)}
              />
              <Segments
                label={t('检验试剂')}
                value={detector}
                options={[
                  { value: 'mn', label: t('酸性 KMnO₄') },
                  { value: 'br', label: t('溴的有机溶液') },
                ]}
                onChange={(v) => setDetector(v as 'mn' | 'br')}
              />
              <Segments
                label={t('模型输入气体')}
                value={gas}
                options={[
                  { value: 'both', label: t('烯烃与杂质') },
                  { value: 'pure', label: t('只有烯烃') },
                  { value: 'impurity', label: t('只有杂质') },
                ]}
                onChange={setGas}
              />
            </>
          )}
        </div>
      )}
      <small className="ces-note">
        {t('条件化净反应与理想有效洗气；进程不表示真实时间、产率或杂质比例。')}
      </small>
    </div>
  );
}
