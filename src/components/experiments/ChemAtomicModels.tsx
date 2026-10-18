import { useState } from 'react';
import { useSignalWidth } from '../lab/SignalFigure';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  atomicDirector,
  cathodeRay,
  cathodeView,
  THOMSON_RECORDS,
  HYDROGEN_LINE_RECORDS,
  scatteringAccount,
  scatteringSequence,
  diffuseHeadOn,
  pointHeadOn,
  hydrogenLine,
  spectralEnergyTransfer,
  atomicHistoryShot,
  ORBITAL_SAMPLES,
  orbitalRadius,
  radialProbability,
  projectOrbital,
  type HydrogenOrbital,
} from '../../models/chem-atomic-models';
import '../../styles/chem-atomic-models.css';
const words = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const ink = '#4f665e',
  copper = '#b47d55',
  green = '#669b82';
function AtomHypothesis({ width }: { width: number }) {
  const x = width / 2;
  return (
    <div className="cam12-history" data-evidence="hypothesis">
      <div className="cam12-label">
        {words('1803 · 不可再分的假设', '1803 · Indivisible hypothesis')}
      </div>
      <svg
        width={width}
        height="190"
        viewBox={`0 0 ${width} 190`}
        role="img"
        aria-label={words(
          '道尔顿实心球是待检验的历史假设',
          'Dalton’s solid sphere is a historical hypothesis to test',
        )}
      >
        <defs>
          <radialGradient id="cam12-dalton" cx="32%" cy="25%">
            <stop stopColor="#d9dfc5" />
            <stop offset=".65" stopColor="#9eaf8d" />
            <stop offset="1" stopColor="#738872" />
          </radialGradient>
        </defs>
        <ellipse cx={x} cy="168" rx="58" ry="8" fill="#52664b" opacity=".07" />
        <circle cx={x} cy="89" r="68" fill="url(#cam12-dalton)" />
        <path
          d={`M${x - 38} 49Q${x - 12} 21 ${x + 22} 32`}
          fill="none"
          stroke="#e9edda"
          strokeWidth="3"
          opacity=".4"
        />
      </svg>
      <div className="cam12-small">
        {words('证据能让它改变吗？', 'What evidence could change it?')}
      </div>
    </div>
  );
}
function CathodeEvidence({
  width,
  polarity,
  charge,
  speed,
  negative,
}: {
  width: number;
  polarity: number;
  charge: number;
  speed: number;
  negative: boolean;
}) {
  const ray = cathodeRay(polarity, charge, speed),
    view = cathodeView(width),
    { x, y } = view,
    path = ray.points.map((p, i) => `${i ? 'L' : 'M'}${x(p.x)},${y(p.y)}`).join(' '),
    top = y(0.0075),
    bottom = y(-0.0075),
    plus = polarity > 0.05 ? '+' : polarity < -0.05 ? '−' : '0';
  return (
    <div data-evidence="cathode-field" data-polarity={polarity} data-charge={charge}>
      <div className="cam12-label">
        {words('射线 → 狭缝 → 极板 → 光点', 'Ray → slit → plates → spot')}
      </div>
      <svg
        width={width}
        height="205"
        viewBox={`0 0 ${width} 205`}
        role="img"
        aria-label={words(
          '均匀电场中的射线路径与荧光屏光点',
          'Beam and screen spot in a uniform electric field',
        )}
      >
        <path
          d={`M22 42Q8 42 8 60V152Q8 170 22 170H${width - 21}V42Z`}
          fill="#cbdcd21b"
          stroke="#9bad9d"
          strokeWidth="1.4"
        />
        <path
          d={`M15 92V122M${x(-0.006)} 57V102M${x(-0.006)} 112V158`}
          stroke="#799089"
          strokeWidth="4"
        />
        <path
          d={`M${x(0)} ${top}H${x(0.05)}M${x(0)} ${bottom}H${x(0.05)}`}
          stroke={copper}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <text x={(x(0) + x(0.05)) / 2} y={top - 10} textAnchor="middle">
          {plus}
        </text>
        <text x={(x(0) + x(0.05)) / 2} y={bottom + 24} textAnchor="middle">
          {polarity > 0.05 ? '−' : polarity < -0.05 ? '+' : '0'}
        </text>
        <path
          d={`M${x(0.14)} ${view.screenTop}V${view.screenBottom}`}
          stroke="#a1b7a0"
          strokeWidth="7"
        />
        <path
          d={`M${x(-0.025)} 107H${x(0.14)}`}
          stroke="#98a69b"
          strokeDasharray="3 5"
          opacity=".45"
        />
        <path d={path} fill="none" stroke={green} strokeWidth="3" />
        <circle cx={x(0.14)} cy={y(ray.spot.y)} r="7" fill="#88b78d" opacity=".7" />
        <circle cx={x(0.14)} cy={y(ray.spot.y)} r="3" fill="#d6e9a9" />
        {negative && (
          <text x={width - 44} y="193" textAnchor="end">
            {charge < 0
              ? words('负电成分', 'Negative charge')
              : charge > 0
                ? words('正电候选', 'Positive candidate')
                : words('中性候选', 'Neutral candidate')}
          </text>
        )}
      </svg>
      <div className="cam12-small">
        {words('偏转放大 · 教学计算', 'Deflection enlarged · model')}
      </div>
    </div>
  );
}
function MaterialEvidence({
  count,
  neutral,
  progress,
  width,
}: {
  count: number;
  neutral: boolean;
  progress: number;
  width: number;
}) {
  if (neutral) {
    const cx = width / 2;
    return (
      <div data-evidence="neutrality">
        <div className="cam12-label">
          {words('电中性：正负总量平衡', 'Neutrality: equal charge totals')}
        </div>
        <svg
          width={width}
          height="195"
          viewBox={`0 0 ${width} 195`}
          role="img"
          aria-label={words(
            '代表性的三份负电荷与弥散正电荷平衡',
            'Three representative negative charges balance diffuse positive charge',
          )}
        >
          <circle cx={cx} cy="93" r="74" fill="#cfbd8e" opacity={0.2 + 0.25 * progress} />
          <text x={cx} y="62" textAnchor="middle" fill={copper}>
            +3e
          </text>
          {[-1, 0, 1].map((k, i) => (
            <g
              key={i}
              data-negative-unit={i}
              transform={`translate(${cx + k * 43},${103 + Math.abs(k) * 15})`}
            >
              <circle r="14" fill={green} />
              <text y="6" textAnchor="middle" fill="#fff">
                −
              </text>
            </g>
          ))}
          <text x={cx} y="190" textAnchor="middle">
            {words('分布位置：仍是假设', 'Charge location: still a hypothesis')}
          </text>
        </svg>
      </div>
    );
  }
  return (
    <div className="cam12-records" data-evidence="fixed-thomson-records" data-count={count}>
      <div className="cam12-label">{words('1897 · 原报告记录', '1897 · Reported records')}</div>
      {count === 0 ? (
        <div className="cam12-predict">
          {words('换气体、换阴极，会怎样？', 'Change gas and cathode. What follows?')}
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{words('气体', 'Gas')}</th>
              <th>{words('阴极', 'Cathode')}</th>
              <th>m/e</th>
            </tr>
          </thead>
          <tbody>
            {THOMSON_RECORDS.slice(0, count).map((r) => (
              <tr key={r.id} data-record-id={r.id}>
                <td>
                  {r.gas === 'air' ? words('空气', 'Air') : r.gas === 'hydrogen' ? 'H₂' : 'CO₂'}
                </td>
                <td>{r.cathode}</td>
                <td>{r.massCharge.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="cam12-small">
        {words('原表数值 ×10⁻⁷ · 非SI', 'Original values ×10⁻⁷ · not SI')}
      </div>
    </div>
  );
}
function ScatteringEvidence({
  width,
  shot,
  progress,
  reveal,
  energy,
  time,
}: {
  width: number;
  shot: string;
  progress: number;
  reveal: boolean;
  energy: number;
  time?: number;
}) {
  const compact = width < 560,
    cell = compact ? width : (width - 24) / 2,
    base = scatteringAccount(5),
    higher = scatteringAccount(energy);
  if (shot === 'observation')
    return (
      <div data-evidence="fixed-large-angle-record">
        <div className="cam12-label">{words('1911 · 历史观察', '1911 · Historical evidence')}</div>
        <svg
          width={width}
          height="170"
          viewBox={`0 0 ${width} 170`}
          role="img"
          aria-label={words(
            '穿透与少数大角度散射的定性记录',
            'Qualitative record of transmission and occasional large-angle scattering',
          )}
        >
          <path
            d={`M${width * 0.14} 85H${width * 0.8}M${width * 0.5} 85L${width * 0.31} 36`}
            fill="none"
            stroke={green}
            strokeWidth="2.5"
          />
          <path d={`M${width * 0.5} 43V130`} stroke={copper} strokeWidth="6" />
          <text x={width * 0.17} y="109">
            α
          </text>
          <text x={width * 0.66} y="114">
            {words('多数', 'Most')}
          </text>
          <text x={width * 0.31} y="26" textAnchor="middle">
            {words('少数大角度', 'Some large angles')}
          </text>
        </svg>
        <div className="cam12-small">
          {words('定性记录 · 不表示次数比例', 'Qualitative record · not counts')}
        </div>
      </div>
    );
  const prediction = shot === 'energy-predict';
  const sequence =
    time === undefined
      ? { diffuseProgress: progress, pointProgress: progress }
      : scatteringSequence(time, browserLocale());
  const lane = (kind: 'diffuse' | 'point', index: number) => {
    const a =
        kind === 'diffuse'
          ? diffuseHeadOn(prediction ? 1 : sequence.diffuseProgress, energy)
          : pointHeadOn(prediction && reveal ? 0.5 : sequence.pointProgress, energy),
      height = compact ? 100 : 200,
      cy = compact ? 49 : 94,
      cx = kind === 'diffuse' ? cell / 2 : cell - 24,
      position =
        kind === 'diffuse'
          ? cx + ((a as ReturnType<typeof diffuseHeadOn>).xRadius * (cell - 68)) / 4
          : cx + (a.xFm * (cell - 52)) / 350,
      yy = compact ? 20 : 30,
      barY = compact ? 77 : 152,
      barX = 16,
      barW = cell - 32,
      frac = a.potentialMeV / a.energyMeV;
    return (
      <svg
        key={kind}
        width={cell}
        height={height}
        viewBox={`0 0 ${cell} ${height}`}
        data-charge-distribution={kind}
        data-kinetic={a.kineticMeV}
        data-potential={a.potentialMeV}
        role="img"
        aria-label={words(
          kind === 'diffuse' ? '弥散电荷：粒子穿过势垒' : '集中电荷：粒子动能变势能并折返',
          kind === 'diffuse'
            ? 'Diffuse charge: the particle crosses the barrier'
            : 'Concentrated charge: kinetic energy converts to potential and the particle turns',
        )}
      >
        <text x="16" y={yy}>
          {kind === 'diffuse'
            ? words('弥散 · R=100 pm', 'Diffuse · R=100 pm')
            : words('集中 · fm放大', 'Centre · fm zoom')}
        </text>
        <path d={`M16 ${cy}H${cell - 16}`} stroke="#a0aea1" strokeDasharray="3 5" />
        {kind === 'diffuse' ? (
          <circle cx={cx} cy={cy} r={compact ? 23 : 48} fill="#cfbd8e" opacity=".45" />
        ) : (
          <circle cx={cx} cy={cy} r="4" fill={copper} />
        )}
        {prediction && kind === 'point' && (
          <path
            d={`M${cx - (base.turningFm * (cell - 52)) / 350} ${cy - 15}V${cy + 15}`}
            stroke="#9eaaa2"
            strokeDasharray="2 3"
          />
        )}
        <circle data-alpha-id={kind} cx={position} cy={cy} r="6" fill={green} />
        <rect x={barX} y={barY} width={barW} height="7" rx="3.5" fill="#8dad98" />
        <rect x={barX} y={barY} width={barW * frac} height="7" rx="3.5" fill="#c5996c" />
        <text x={16} y={barY + 22}>
          {kind === 'diffuse'
            ? `U ≤ ${(a.barrierMeV * 1000).toFixed(2)} keV`
            : `K ${a.kineticMeV.toFixed(1)} + U ${a.potentialMeV.toFixed(1)} MeV`}
        </text>
      </svg>
    );
  };
  return (
    <div data-evidence="same-charge-comparison" data-prediction={prediction && !reveal}>
      <div className="cam12-label">
        {prediction
          ? reveal
            ? `5 → ${energy.toFixed(0)} MeV`
            : words('更多能量 → 更近，还是更远？', 'More energy → nearer or farther?')
          : `${words('同样', 'Same')} +79e · ${energy.toFixed(0)} MeV`}
      </div>
      {prediction && !reveal ? (
        <div className="cam12-predict">
          <span>5 → {energy.toFixed(0)} MeV</span>
          <strong>{words('转折位置？', 'Turning point?')}</strong>
          <span>{words('历史记录保持原样', 'Historical record stays fixed')}</span>
        </div>
      ) : (
        <>
          <div className="cam12-scattering">
            {lane('diffuse', 0)}
            {lane('point', 1)}
          </div>
          <div className="cam12-small">
            {prediction
              ? `${base.turningFm.toFixed(1)} → ${higher.turningFm.toFixed(1)} fm`
              : words('分开慢放 · 不同长度标尺', 'Separate slow views · different scales')}
          </div>
        </>
      )}
    </div>
  );
}
function SpectrumEvidence({
  width,
  shot,
  progress,
  reveal,
  upper,
}: {
  width: number;
  shot: string;
  progress: number;
  reveal: boolean;
  upper: number;
}) {
  const compact = width < 560,
    n = shot === 'blue-predict' ? upper : 3,
    line = hydrogenLine(n),
    event = spectralEnergyTransfer(progress, n),
    x = (nm: number) => 25 + ((nm - 410) / 280) * (width - 50),
    baseline = 178,
    levelY = (e: number) => 44 + (-0.35 - e) * 22,
    atomX = width * 0.3;
  const emission = shot !== 'fixed-spectrum',
    show = emission && reveal;
  return (
    <div data-evidence="fixed-lines-energy-gap" data-prediction={emission && !reveal}>
      <div className="cam12-label">
        {shot === 'fixed-spectrum'
          ? words('固定谱线 · NIST空气值', 'Fixed lines · NIST air values')
          : words('允许能级假设 → 可检验的光', 'Allowed energies → testable light')}
      </div>
      <svg
        width={width}
        height="220"
        viewBox={`0 0 ${width} 220`}
        role="img"
        aria-label={words(
          '固定氢谱线与独立能级差预测',
          'Fixed hydrogen lines and independent energy-gap predictions',
        )}
      >
        {emission && (
          <>
            <path
              d={`M${atomX - 38} ${levelY(line.upperEV)}H${atomX + 38}M${atomX - 38} ${levelY(line.lowerEV)}H${atomX + 38}`}
              stroke="#8c9e91"
              strokeWidth="2"
            />
            <text x={atomX - 43} y={levelY(line.upperEV) + 5} textAnchor="end">
              {n}
            </text>
            <text x={atomX - 43} y={levelY(line.lowerEV) + 5} textAnchor="end">
              2
            </text>
            <circle cx={atomX} cy={levelY(event.atomEV)} r="5" fill={green} />
            <text x={width - 16} y="52" textAnchor="end">
              ΔE = hν
            </text>
            <text x={width - 16} y="76" textAnchor="end">
              {line.photonEV.toFixed(2)} eV
            </text>
            {show && event.released && (
              <>
                <circle
                  data-photon-id={event.eventId}
                  cx={atomX + (width * 0.64 - atomX) * event.photonTravel}
                  cy={levelY(line.lowerEV) - 35 * event.photonTravel}
                  r="6"
                  fill={n === 3 ? '#bb6554' : '#3a8e97'}
                />
                <text x={width - 16} y="105" textAnchor="end">
                  {Math.round(line.vacuumNm)} nm
                </text>
                <text x={width - 16} y="128" textAnchor="end">
                  {words('真空预测', 'Vacuum prediction')}
                </text>
              </>
            )}
            {!reveal && (
              <text x={width / 2} y="141" textAnchor="middle">
                {words('波长更长，还是更短？', 'Longer or shorter wavelength?')}
              </text>
            )}
          </>
        )}
        {!emission && (
          <text x={width / 2} y="80" textAnchor="middle">
            {words('记录不随模型改变', 'Records do not follow the model')}
          </text>
        )}
        <rect x="14" y={baseline - 22} width={width - 28} height="28" rx="8" fill="#263d39" />
        {HYDROGEN_LINE_RECORDS.map((r) => (
          <g key={r.id} data-spectral-record={r.id} data-air-nm={r.airNm}>
            <path
              d={`M${x(r.airNm)} ${baseline - 18}V${baseline + 1}`}
              stroke={r.colour}
              strokeWidth="4"
            />
            <text x={x(r.airNm)} y={baseline + 27} textAnchor="middle">
              {Math.round(r.airNm)}
            </text>
          </g>
        ))}
        {show && event.released && (
          <path
            data-vacuum-marker={line.vacuumNm}
            d={`M${x(line.vacuumNm) - 5} ${baseline - 31}l5 6 5-6`}
            fill="none"
            stroke={green}
            strokeWidth="2"
          />
        )}
      </svg>
      <div className="cam12-small">
        {words('空气记录 / 真空预测 · 1 nm显示', 'Air records / vacuum model · 1 nm display')}
      </div>
    </div>
  );
}

function RadialProfiles({ width }: { width: number }) {
  const w = Math.min(width, 620),
    x = (r: number) => 30 + (r / 12) * (w - 48),
    y = (p: number) => 72 - (p / 0.6) * 46;
  const curve = (o: HydrogenOrbital) =>
    Array.from({ length: 241 }, (_, i) => {
      const r = i / 20;
      return `${i ? 'L' : 'M'}${x(r)},${y(radialProbability(o, r))}`;
    }).join(' ');
  return (
    <svg
      className="cam12-radial"
      width={w}
      height="108"
      viewBox={`0 0 ${w} 108`}
      role="img"
      aria-label={words(
        '共同半径标尺上的径向概率；2s在2a₀处为零',
        'Radial probability on one radius scale; 2s is zero at 2a₀',
      )}
    >
      <text x="12" y="17">
        {words('径向概率', 'Radial probability')}
      </text>
      <text x={w - 66} y="17" style={{ fill: green }}>
        1s
      </text>
      <text x={w - 28} y="17" style={{ fill: copper }}>
        2s
      </text>
      <path d={`M30 25V72H${w - 18}`} fill="none" stroke="#a3b1a4" />
      <path d={curve('1s')} fill="none" stroke={green} strokeWidth="2" />
      <path d={curve('2s')} fill="none" stroke={copper} strokeWidth="2" />
      <path d={`M${x(2)} 61V79`} stroke={copper} strokeDasharray="2 3" />
      <circle data-radial-node="2" cx={x(2)} cy="72" r="3" fill="#f6f5ed" stroke={copper} />
      <text x={x(2)} y="99" textAnchor="middle">
        2a₀
      </text>
      <text x={w - 18} y="99" textAnchor="end">
        12a₀
      </text>
    </svg>
  );
}
export default function ChemAtomicModels() {
  const { host, width } = useSignalWidth();
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [mode, setMode] = useState(film.variant === 'model-history' ? 'dalton' : 'quantum'),
    [orbital, setOrbital] = useState<HydrogenOrbital>('1s'),
    [probability, setProbability] = useState(0.9),
    [count, setCount] = useState(900),
    [level, setLevel] = useState(4),
    [polarity, setPolarity] = useState(1),
    [charge, setCharge] = useState(-1),
    [speed, setSpeed] = useState(15e6),
    [energy, setEnergy] = useState(10),
    [pathTime, setPathTime] = useState(0.5),
    [recordCount, setRecordCount] = useState(7),
    [materialView, setMaterialView] = useState('records'),
    [pAxis, setPAxis] = useState<'x' | 'y' | 'z'>('y');
  const d = film.watch
    ? atomicDirector(film.chapter, film.chapterProgress)
    : {
        chapter:
          mode === 'dalton'
            ? 0
            : mode === 'thomson'
              ? 1
              : mode === 'nuclear'
                ? 2
                : mode === 'bohr'
                  ? 3
                  : orbital === '2p'
                    ? 7
                    : orbital === '2s'
                      ? 6
                      : 5,
        progress: 1,
        orbital,
        probability,
        count,
        contour: true,
        bohrN: level,
      };
  const activeAxis = film.watch
    ? (['x', 'y', 'z'] as const)[Math.min(2, Math.floor(d.progress * 3))]
    : pAxis;
  const radius = orbitalRadius(d.orbital, d.probability);
  const h = atomicHistoryShot(d.chapter, film.chapterTime, en ? 'en' : 'zh');
  const stageWidth = Math.min(780, width);
  const history =
    d.chapter === 0 ? (
      <CathodeEvidence
        width={stageWidth}
        polarity={film.watch ? h.polarity : polarity}
        charge={film.watch ? -1 : charge}
        speed={film.watch ? 15e6 : speed}
        negative={film.watch ? h.negative : true}
      />
    ) : d.chapter === 1 ? (
      <MaterialEvidence
        width={stageWidth}
        count={film.watch ? h.records : recordCount}
        neutral={film.watch ? h.shot === 'neutrality' : materialView === 'neutrality'}
        progress={film.watch ? h.progress : 1}
      />
    ) : d.chapter === 2 ? (
      <ScatteringEvidence
        width={stageWidth}
        shot={film.watch ? h.shot : 'charge-compare'}
        progress={film.watch ? h.progress : pathTime}
        reveal={film.watch ? h.reveal : true}
        energy={film.watch ? (h.shot === 'energy-predict' ? 10 : 5) : energy}
        time={film.watch ? film.chapterTime : undefined}
      />
    ) : (
      <SpectrumEvidence
        width={stageWidth}
        shot={film.watch ? h.shot : 'blue-predict'}
        progress={film.watch ? h.progress : 1}
        reveal={film.watch ? h.reveal : true}
        upper={film.watch ? 4 : level}
      />
    );
  const cloud = (o: HydrogenOrbital, axis: 'x' | 'y' | 'z' = 'y', small = false) => {
    const size = small ? 180 : 320,
      mid = size / 2,
      extent = d.chapter === 6 ? 22 : o === '1s' ? 6.5 : o === '2s' ? 22 : 20,
      scale = (mid - 12) / extent,
      rr = orbitalRadius(o, d.probability);
    return (
      <svg
        className={small ? 'chem-atom-small' : 'chem-atom-cloud'}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={say(
          `${o}${o === '2p' ? axis : ''} 氢原子概率密度投影`,
          `${o}${o === '2p' ? axis : ''} hydrogen probability density projection`,
        )}
      >
        {d.contour && o !== '2p' && (
          <circle
            cx={mid}
            cy={mid}
            r={rr * scale}
            fill="#acb9940c"
            stroke="#98aa7d"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
        )}
        {ORBITAL_SAMPLES[o].slice(0, d.count).map((p, i) => {
          const q = projectOrbital(p, axis);
          return (
            <circle
              key={i}
              cx={mid + q.x * scale}
              cy={mid - q.y * scale}
              r={small ? 1.1 : 1.5}
              fill={d.contour && p.r > rr ? '#a9b3a2' : '#768b56'}
              opacity={d.contour && p.r > rr ? 0.2 : 0.55}
            />
          );
        })}
        <circle cx={mid} cy={mid} r={small ? 2 : 3} fill="#b67d54" />
        {o === '2p' && (
          <>
            <path
              d={`M${mid - 42} ${mid + 30}L${mid + 42} ${mid - 30}M${mid} ${mid - 52}V${mid + 52}`}
              fill="none"
              stroke="#a7b59b"
              opacity=".35"
            />
          </>
        )}
      </svg>
    );
  };
  return (
    <section className="chem-atomic-models cam12" ref={host} data-watch={film.watch}>
      {d.chapter < 4 ? (
        <div className="cam12-history">
          {film.watch && d.chapter === 0 && h.shot === 'hypothesis' ? (
            <AtomHypothesis width={stageWidth} />
          ) : (
            history
          )}
        </div>
      ) : d.chapter === 7 ? (
        <>
          <div className="chem-atom-heading">H · 2p</div>
          <div className="chem-atom-p-orientations">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis} data-active={axis === activeAxis}>
                {cloud('2p', axis, true)}
                <span>
                  2p<sub>{axis}</sub>
                </span>
              </div>
            ))}
          </div>
          <div className="chem-atom-p-labels">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <span key={axis} data-active={axis === activeAxis}>
                2p<sub>{axis}</sub>
              </span>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="chem-atom-heading">H · {d.chapter === 6 ? '1s / 2s' : d.orbital}</div>
          {d.chapter === 6 ? (
            <div className="chem-atom-s-comparison">
              <div>
                {cloud('1s', 'y', true)}
                <span>1s</span>
              </div>
              <div>
                {cloud('2s', 'y', true)}
                <span>2s</span>
              </div>
            </div>
          ) : (
            cloud(d.orbital)
          )}
          {d.chapter === 6 && <RadialProfiles width={stageWidth} />}
          <div className="chem-atom-note">
            {d.chapter === 4
              ? say(`${d.count}个采样点`, `${d.count} probability samples`)
              : d.chapter === 5
                ? `${(d.probability * 100).toFixed(0)}% · r = ${radius.toFixed(2)} a₀`
                : say('共用同一长度标尺', 'One shared length scale')}
          </div>
        </>
      )}
      {!film.watch && (
        <div className="chem-atom-controls">
          {mode === 'quantum' && orbital === '2p' && (
            <Segments
              label={say('取向', 'Orientation')}
              value={pAxis}
              onChange={(v) => setPAxis(v as 'x' | 'y' | 'z')}
              options={['x', 'y', 'z'].map((value) => ({ value, label: `2p${value}` }))}
            />
          )}
          <Segments
            label={say('模型', 'Model')}
            value={mode}
            options={[
              { value: 'dalton', label: say('射线偏转', 'Beam deflection') },
              { value: 'thomson', label: say('材料对照', 'Material comparison') },
              { value: 'nuclear', label: say('核式', 'Nuclear') },
              { value: 'bohr', label: say('玻尔', 'Bohr') },
              { value: 'quantum', label: say('概率分布', 'Probability') },
            ]}
            onChange={setMode}
          />
          {mode === 'dalton' ? (
            <>
              <Segments
                label={say('上极板', 'Upper plate')}
                value={String(polarity)}
                options={[
                  { value: '1', label: '+' },
                  { value: '0', label: '0' },
                  { value: '-1', label: '−' },
                ]}
                onChange={(v) => setPolarity(Number(v))}
              />
              <Segments
                label={say('候选电荷', 'Candidate charge')}
                value={String(charge)}
                options={[
                  { value: '-1', label: '−' },
                  { value: '0', label: '0' },
                  { value: '1', label: '+' },
                ]}
                onChange={(v) => setCharge(Number(v))}
              />
              <Range
                label={say('入射速度 (Mm/s)', 'Speed (Mm/s)')}
                value={speed / 1e6}
                min={12}
                max={20}
                step={1}
                onChange={(v) => setSpeed(v * 1e6)}
              />
            </>
          ) : mode === 'thomson' ? (
            <>
              <Segments
                label={say('证据与假设', 'Evidence and hypothesis')}
                value={materialView}
                options={[
                  { value: 'records', label: say('固定记录', 'Fixed records') },
                  { value: 'neutrality', label: say('电中性假设', 'Neutrality hypothesis') },
                ]}
                onChange={setMaterialView}
              />
              <Range
                label={say('显示记录条数', 'Records shown')}
                value={recordCount}
                min={1}
                max={7}
                step={1}
                onChange={setRecordCount}
              />
            </>
          ) : mode === 'nuclear' ? (
            <>
              <Range
                label={say('轨迹时间', 'Trajectory time')}
                value={pathTime}
                min={0}
                max={1}
                step={0.01}
                onChange={setPathTime}
              />
              <Range
                label={say('入射总能量 (MeV)', 'Total energy (MeV)')}
                value={energy}
                min={3}
                max={10}
                step={1}
                onChange={setEnergy}
              />
            </>
          ) : mode === 'quantum' ? (
            <>
              <Segments
                label={say('氢原子状态', 'Hydrogen state')}
                value={orbital}
                options={(['1s', '2s', '2p'] as const).map((value) => ({ value, label: value }))}
                onChange={(v) => setOrbital(v as HydrogenOrbital)}
              />
              <Range
                label={say('采样点数量', 'Number of sample dots')}
                value={count}
                min={1}
                max={900}
                step={1}
                onChange={setCount}
              />
              {orbital !== '2p' && (
                <Range
                  label={say('球内累计概率', 'Cumulative probability inside sphere')}
                  value={probability}
                  min={0.5}
                  max={0.99}
                  step={0.01}
                  onChange={setProbability}
                />
              )}
            </>
          ) : mode === 'bohr' ? (
            <Range
              label={say('初始能级 n → 2', 'Initial level n → 2')}
              value={level}
              min={3}
              max={5}
              step={1}
              onChange={setLevel}
            />
          ) : null}
          <p>
            {say(
              '历史图不是实测原子照片；核与电子尺寸夸大。电子云使用氢原子非相对论概率模型，三维采样投影没有连续运动轨迹。',
              'Historical views are not atomic photographs; nucleus and electron sizes are exaggerated. Clouds project samples of nonrelativistic hydrogen probability, without a continuous trajectory.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
