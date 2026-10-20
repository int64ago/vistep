import { useId, useMemo, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  SULFUR_IDS,
  sulfurFilmState,
  sulfurElectronLedger,
  copperNetAtoms,
  copperSulfurInventory,
  permanganateBudget,
  ironSulfurMass,
  simulateIronSulfur,
  heatFrameAt,
  type SulfurRoute,
} from '../../models/chem-sulfur-transformations';
import '../../styles/chem-sulfur-transformations.css';
const say = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const C = { s: '#b49b49', cu: '#aa7455', fe: '#718174', o: '#8b9f9c', h: '#e6e7dc', e: '#658b92' };
const sign = (n: number) => (n > 0 ? `+${n}` : n === 0 ? '0' : `−${-n}`);
function StateMap({ width, active = 0 }: { width: number; active?: number }) {
  return (
    <svg
      viewBox={`0 0 ${width} 172`}
      role="img"
      aria-label={say(
        '硫的价态位置，不是实际反应步骤',
        'Sulfur oxidation states, not reaction steps',
      )}
    >
      <path d={`M32 75H${width - 32}`} fill="none" stroke="#c4cbb9" strokeWidth="2" />
      {[-2, 0, 4, 6].map((v, i) => {
        const x = 32 + (i * (width - 64)) / 3;
        return (
          <g key={v}>
            <circle cx={x} cy="75" r="23" fill={i === active ? '#e8d9a1' : '#e6eadf'} />
            <text x={x} y="82" textAnchor="middle" fontSize="21">
              {sign(v)}
            </text>
            <text x={x} y="123" textAnchor="middle">
              {['H₂S', 'S', 'SO₂', 'H₂SO₄'][i]}
            </text>
          </g>
        );
      })}
      <text x={width / 2} y="25" textAnchor="middle">
        {say('价态是电子归属的记账', 'Oxidation state is electron accounting')}
      </text>
      <text x={width / 2} y="161" textAnchor="middle">
        {say('失电子 → 升高；得电子 → 降低', 'Lose electrons ↑ · gain electrons ↓')}
      </text>
    </svg>
  );
}
function Evidence({
  kind,
  width,
  progress,
}: {
  kind: 'sulfide' | 'permanganate';
  width: number;
  progress: number;
}) {
  const x = width / 2,
    p = Math.max(0, Math.min(1, progress));
  return (
    <svg
      viewBox={`0 0 ${width} 215`}
      role="img"
      aria-label={say(
        '选定反应的现象示意，颜色不表示浓度',
        'Qualitative appearance of a selected pathway; colour is not concentration',
      )}
    >
      <text x={x} y="22" textAnchor="middle">
        {kind === 'sulfide' ? 'Na₂S + H₂SO₃' : 'Na₂S + KMnO₄ / H⁺'}
      </text>
      <path
        d={`M${x - 31} 52V167Q${x - 31} 195 ${x} 195Q${x + 31} 195 ${x + 31} 167V52`}
        fill="#e5eadd55"
        stroke="#9ba990"
        strokeWidth="2"
      />
      <path
        d={`M${x - 27} 107V166Q${x - 27} 191 ${x} 191Q${x + 27} 191 ${x + 27} 166V107Z`}
        fill={kind === 'permanganate' ? `rgba(149,100,143,${0.08 + 0.45 * (1 - p)})` : '#e4e7d1'}
      />
      {Array.from({ length: 14 }, (_, i) => (
        <circle
          key={i}
          cx={x - 21 + ((i * 19) % 42)}
          cy={121 + ((i * 23) % 57)}
          r={2 + p}
          fill={C.s}
          opacity={p * 0.8}
        />
      ))}
      <path
        d={`M${x - 32} 48q10-9 20-2q12-8 21 0q12-7 23 2v11q-15 6-30 0q-17 6-34 0Z`}
        fill="#dfe3d4"
        stroke="#aab49d"
      />
      <path d={`M${x - 20} 69V162`} stroke="white" strokeWidth="3" opacity=".7" />
      <text x={x + 48} y="77">
        {say('湿棉团', 'Cotton')}
      </text>
    </svg>
  );
}
function ElectronLedger({
  route,
  progress,
  width,
}: {
  route: SulfurRoute;
  progress: number;
  width: number;
}) {
  const s = sulfurElectronLedger(route, progress, width);
  return (
    <div data-ledger={route} data-transit={s.inTransit}>
      <div className="csx15-unit">
        {say('净电子账 · 不是微观轨迹', 'Net electron account · not a microscopic path')}
      </div>
      <svg
        viewBox={`0 0 ${width} 205`}
        role="img"
        aria-label={say(
          '持久的反应中心与两电子份额',
          'Persistent reaction centres and two-electron packets',
        )}
      >
        {s.packets.map((packet) => {
          const a = s.centers.find((c) => c.id === packet.donor)!,
            b = s.centers.find((c) => c.id === packet.receiver)!;
          return (
            <path
              key={packet.id + 'lane'}
              d={`M${a.x + 25} ${a.y}Q${width / 2} ${Math.min(a.y, b.y) - 40} ${b.x - 25} ${b.y}`}
              fill="none"
              stroke="#c0cdc4"
              strokeWidth="1.5"
              strokeDasharray="3 5"
            />
          );
        })}
        {s.centers.map((a) => (
          <g key={a.id} data-center={a.id} data-oxidation={a.oxidation}>
            <circle
              cx={a.x}
              cy={a.y}
              r="25"
              fill={a.symbol === 'S' ? '#e8ddb6' : a.symbol === 'Cu' ? '#d5b39b' : '#c6cec0'}
            />
            <text x={a.x} y={a.y + 6} textAnchor="middle" fontSize="20">
              {a.symbol}
            </text>
            <text x={a.x} y={a.y + 49} textAnchor="middle">
              {sign(a.start)} → {sign(a.end)}
            </text>
            <text x={a.x} y={a.y - 33} textAnchor="middle" fill={C.e}>
              {sign(a.oxidation)}
            </text>
          </g>
        ))}
        {s.packets
          .filter((p) => p.phase === 'transit')
          .map((p) => (
            <g key={p.id} data-electron-packet={p.id} data-phase={p.phase}>
              <rect
                x={p.x - 24}
                y={p.y - 14}
                width="48"
                height="28"
                rx="14"
                fill="#edf3ed"
                stroke="#779a9f"
              />
              <text x={p.x} y={p.y + 6} fill={C.e} textAnchor="middle">
                2 e⁻
              </text>
            </g>
          ))}
      </svg>
      <div className="csx15-ledger" aria-label={say('电子份额账本', 'Electron packet ledger')}>
        <span>
          {say('已给出', 'Given')} {s.departed}
        </span>
        <span>
          {say('转移中', 'In transit')} {s.inTransit}
        </span>
        <span>
          {say('已接收', 'Received')} {s.accepted}
        </span>
      </div>
    </div>
  );
}
function CopperApparatus({
  width,
  progress,
  lift = 0,
  heated = true,
  practical = false,
}: {
  width: number;
  progress: number;
  lift?: number;
  heated?: boolean;
  practical?: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    a = width * 0.23,
    b = width * 0.76,
    liquid = 112,
    cuY = 158 - lift * 76,
    path = [
      { x: a + 10, y: 49 },
      { x: a + 10, y: 25 },
      { x: b, y: 25 },
      { x: b, y: 157 },
    ],
    lengths = [24, b - a - 10, 132],
    total = lengths.reduce((x, y) => x + y, 0);
  const gas = (q: number) => {
    let d = q * total;
    for (let i = 0; i < 3; i++) {
      if (d <= lengths[i]) {
        const f = d / lengths[i];
        return {
          x: path[i].x + (path[i + 1].x - path[i].x) * f,
          y: path[i].y + (path[i + 1].y - path[i].y) * f,
        };
      }
      d -= lengths[i];
    }
    return path[3];
  };
  return (
    <svg
      viewBox={`0 0 ${width} 236`}
      role="img"
      aria-label={say(
        '反应管与品红管由同一条导气管连接',
        'One connected gas tube joins the reaction and fuchsin vessels',
      )}
    >
      <defs>
        <linearGradient id={id}>
          <stop stopColor="#dce4d7" stopOpacity=".6" />
          <stop offset=".45" stopColor="#fff" stopOpacity=".1" />
          <stop offset="1" stopColor="#a9b8a0" stopOpacity=".3" />
        </linearGradient>
      </defs>
      {[a, b].map((x, i) => (
        <g key={i}>
          <path
            d={`M${x - 24} ${i ? 68 : 49}V180Q${x - 24} 203 ${x} 203Q${x + 24} 203 ${x + 24} 180V${i ? 68 : 49}`}
            fill={`url(#${id})`}
            stroke="#9caa91"
            strokeWidth="2"
          />
          <path
            d={`M${x - 20} ${i ? 134 : liquid}V180Q${x - 20} 199 ${x} 199Q${x + 20} 199 ${x + 20} 180V${i ? 134 : liquid}Z`}
            fill={i ? `rgba(183,100,134,${0.09 + 0.45 * (1 - progress)})` : '#dcdec6'}
          />
          <path d={`M${x - 15} ${i ? 85 : 65}V175`} stroke="white" strokeWidth="3" opacity=".65" />
        </g>
      ))}
      <path d={`M${a - 27} 43H${a + 27}L${a + 22} 58H${a - 22}Z`} fill="#b7a58d" stroke="#988c78" />
      <path
        d={`M${a + 10} 49V25H${b}V157`}
        fill="none"
        stroke="#a2af9b"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d={`M${a + 10} 49V25H${b}V157`}
        fill="none"
        stroke="#e6ece0"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d={`M${b - 25} 63q10-8 20-2q13-7 30 2v11q-17 6-27 0q-15 7-23 0Z`}
        fill="#dfe5d6"
        stroke="#a4b098"
      />
      {practical ? (
        <path data-copper="piece" d={`M${a - 13} 170l24 5-5 12-24-5Z`} fill={C.cu} />
      ) : (
        <g data-copper="wire">
          <path
            d={`M${a - 6} ${32 - lift * 16}V${cuY}`}
            fill="none"
            stroke={C.cu}
            strokeWidth="3"
          />
          <path
            d={Array.from(
              { length: 31 },
              (_, i) =>
                `${i ? 'L' : 'M'}${a - 6 + 10 * Math.cos((i * Math.PI) / 5)} ${cuY + i * 0.7}`,
            ).join(' ')}
            fill="none"
            stroke={C.cu}
            strokeWidth="3"
          />
        </g>
      )}
      {heated && lift === 0 && progress < 0.99
        ? Array.from({ length: 3 }, (_, i) => {
            const p = gas((progress * 0.8 + i * 0.25) % 1);
            return <circle key={i} cx={p.x} cy={p.y} r="3" fill="#a4a686" />;
          })
        : null}
      {heated ? (
        <path
          d={`M${a - 12} 225q0-13 12-13q12 0 12 13M${a} 211q-9-8 0-17q9 9 0 17`}
          fill="#c39c70"
        />
      ) : (
        <path d={`M${a - 10} 222H${a + 10}`} stroke="#a6ae9b" />
      )}
      <text x={a} y="235" textAnchor="middle">
        {say('反应所得物', 'Reaction material')}
      </text>
      <text x={b} y="235" textAnchor="middle">
        {say('品红', 'Fuchsin')}
      </text>
    </svg>
  );
}
function BlueTransfer({
  width,
  progress,
  practical,
}: {
  width: number;
  progress: number;
  practical: boolean;
}) {
  const p = Math.max(0, Math.min(1, progress)),
    source = { x: width * 0.27, y: 57 },
    angle = (120 * Math.PI) / 180,
    mouth = { x: source.x + 32 * Math.sin(angle), y: source.y - 32 * Math.cos(angle) },
    receiver = width * 0.69,
    token = { x: mouth.x + (receiver - mouth.x) * p, y: mouth.y + (153 - mouth.y) * p };
  return (
    <>
      <div className="csx15-unit">
        {practical
          ? say('借用前文P5的溶液证据', 'Solution evidence from earlier P5')
          : say('同一所得物，冷却后观察', 'The same material, observed after cooling')}
      </div>
      <svg
        viewBox={`0 0 ${width} 215`}
        role="img"
        aria-label={say(
          '冷却所得物进入原有水中，出现蓝色溶液',
          'Cooled reaction material enters existing water and gives a blue solution',
        )}
      >
        <g transform={`translate(${source.x} ${source.y}) rotate(120)`}>
          <path
            d="M-15-32V20Q-15 36 0 36Q15 36 15 20V-32"
            fill="#d9e2d655"
            stroke="#9aaa93"
            strokeWidth="2"
          />
          <path d={`M-12-29H12V${-29 + 60 * (1 - p)}H-12Z`} fill="#a8bdbe" opacity=".6" />
          <ellipse cx="0" cy="-32" rx="15" ry="3" fill="#f1f4ec" stroke="#9aaa93" />
        </g>
        <path
          d={`M${receiver - 28} 102V179Q${receiver - 28} 205 ${receiver} 205Q${receiver + 28} 205 ${receiver + 28} 179V102`}
          fill="#e0e8dc55"
          stroke="#9aaa93"
          strokeWidth="2"
        />
        <path
          d={`M${receiver - 24} ${166 - 22 * p}V178Q${receiver - 24} 201 ${receiver} 201Q${receiver + 24} 201 ${receiver + 24} 178V${166 - 22 * p}Z`}
          fill={p === 0 ? '#dce9e5' : `rgba(137,180,191,${0.25 + 0.4 * p})`}
        />
        {p > 0 && p < 1 ? (
          <path
            d={`M${mouth.x} ${mouth.y}Q${receiver} ${mouth.y + 12} ${receiver} ${166 - 22 * p}`}
            fill="none"
            stroke="#a5c0bf"
            strokeWidth="3"
          />
        ) : null}
        <g data-sample-id="cooled-copper-sample" transform={`translate(${token.x} ${token.y})`}>
          <rect x="-26" y="-13" width="52" height="26" rx="13" fill="#e8f1ec" stroke="#88aab0" />
          <text x="0" y="6" textAnchor="middle" fill="#638993">
            Cu²⁺
          </text>
        </g>
        <text x={width * 0.2} y="193" textAnchor="middle">
          {say('原有水', 'Water')}
        </text>
      </svg>
    </>
  );
}
function CopperNet({ width, progress }: { width: number; progress: number }) {
  const s = copperNetAtoms(progress, width),
    p = s.progress,
    end = p >= 0.85;
  return (
    <>
      <div className="csx15-unit">
        {say('组成净账 · 同一批原子', 'Net composition · the same atoms')}
      </div>
      <svg
        viewBox={`0 0 ${width} 222`}
        role="img"
        aria-label={say(
          '同一批铜、硫、氧、氢的净分配',
          'Net allocation of the same copper, sulfur, oxygen and hydrogen atoms',
        )}
      >
        {end ? (
          <>
            <rect
              x={width * 0.25 - 44}
              y="35"
              width="88"
              height="126"
              rx="24"
              fill="#d8e4df66"
              stroke="#a9bbb1"
              strokeDasharray="3 4"
            />
            <rect
              x={width * 0.75 - 44}
              y="25"
              width="88"
              height="76"
              rx="24"
              fill="#ede4c366"
              stroke="#b8a66e"
              strokeDasharray="3 4"
            />
          </>
        ) : (
          <>
            {[0.25, 0.75].map((x) => (
              <rect
                key={x}
                x={width * x - 53}
                y="34"
                width="106"
                height="105"
                rx="25"
                fill="#ebe8d655"
                stroke="#c3b994"
                strokeDasharray="3 4"
              />
            ))}
          </>
        )}
        {s.atoms.map((a) => (
          <g
            key={a.id}
            data-atom-id={a.id}
            data-element={a.element}
            data-oxidation={a.oxidation}
            data-destination={a.destination}
            data-phase={a.phase}
          >
            <circle
              cx={a.x}
              cy={a.y}
              r={a.element === 'S' || a.element === 'Cu' ? 17 : 11}
              fill={
                a.element === 'S'
                  ? '#dfcb80'
                  : a.element === 'Cu'
                    ? '#c99674'
                    : a.element === 'O'
                      ? '#d4dfd8'
                      : '#f6f6ed'
              }
              stroke={a.id === 's-gas' ? '#a58b39' : '#a8b39e'}
              strokeWidth={a.id === 's-gas' ? 2 : 1}
            />
            <text x={a.x} y={a.y + 5.5} textAnchor="middle">
              {a.element}
            </text>
          </g>
        ))}
        {end ? (
          <>
            <text x={width * 0.25} y="23" textAnchor="middle">
              CuSO₄
            </text>
            <text x={width * 0.75} y="16" textAnchor="middle">
              SO₂
            </text>
            <text x={width * 0.75} y="150" textAnchor="middle">
              2 H₂O
            </text>
            <text x={width * 0.25} y="184" textAnchor="middle">
              S: +6
            </text>
            <text x={width * 0.75} y="124" textAnchor="middle">
              S: +4
            </text>
          </>
        ) : (
          <>
            <text x={width * 0.25} y="23" textAnchor="middle">
              {p <= 0.15 ? 'H₂SO₄ · A' : say('起点A', 'Origin A')}
            </text>
            <text x={width * 0.75} y="23" textAnchor="middle">
              {p <= 0.15 ? 'H₂SO₄ · B' : say('起点B', 'Origin B')}
            </text>
          </>
        )}
      </svg>
      <div className="csx15-net-total">Cu 1 · S 2 · O 8 · H 4</div>
    </>
  );
}
function Budget({
  kind,
  reveal,
  secondReveal = reveal,
  sulfide = 5,
  mn = 2,
  copper = 1,
  acid = 1,
}: {
  kind: 'permanganate' | 'copper';
  reveal: boolean;
  secondReveal?: boolean;
  sulfide?: number;
  mn?: number;
  copper?: number;
  acid?: number;
}) {
  const a = permanganateBudget('sulfur', sulfide, mn),
    b = permanganateBudget('sulfate', sulfide, mn),
    cu = copperSulfurInventory(copper, acid);
  return (
    <div
      className="csx15-budget"
      data-answer-visible={reveal}
      data-second-answer-visible={secondReveal}
    >
      <div className="csx15-budget-source">
        {kind === 'permanganate' ? (
          <>
            {mn} MnO₄⁻ {say('能接受', 'accepts')} {mn * 5} e⁻
            <small>{say('酸性、Mn²⁺终点 · 份额', 'Acidic, Mn²⁺ endpoint · amount units')}</small>
          </>
        ) : (
          <>
            {copper} Cu + {acid} H₂SO₄
            <small>
              {say('所选净反应 · 物质的量份额', 'Selected net reaction · amount units')}
            </small>
          </>
        )}
      </div>
      {kind === 'permanganate' ? (
        <>
          <div className="csx15-compare">
            <div>
              <b>S(0)</b>
              <span>2 e⁻ / S</span>
              <strong>{reveal ? a.conversion.toFixed(2) : '?'}</strong>
            </div>
            <div>
              <b>S(+6)</b>
              <span>8 e⁻ / S</span>
              <strong>{secondReveal ? b.conversion.toFixed(2) : '?'}</strong>
            </div>
          </div>
          <p>
            {secondReveal
              ? say('相同氧化剂份额，不同转化上限', 'Same oxidant budget, different upper limits')
              : say('能转化同样多的硫化物吗？', 'Can both convert the same amount of sulfide?')}
          </p>
          <small>{say('两个假设终点', 'Two assumed endpoints')}</small>
        </>
      ) : (
        <>
          <div className="csx15-compare">
            <div>
              <b>{say('反应的Cu', 'Cu reacted')}</b>
              <strong>{reveal ? cu.extent.toFixed(2) : '?'}</strong>
            </div>
            <div>
              <b>{say('留下的Cu', 'Cu left')}</b>
              <strong>{reveal ? cu.copper.toFixed(2) : '?'}</strong>
            </div>
          </div>
          <p>
            {reveal
              ? say('2份酸，才配齐1份铜的净反应', 'The net equation needs 2 acid units per Cu')
              : say('铜能全部反应吗？', 'Can all the copper react?')}
          </p>
        </>
      )}
    </div>
  );
}
function HeatStrip({
  width,
  time,
  ratio = 1.15,
  ignition = true,
  release = 1.4,
}: {
  width: number;
  time: number;
  ratio?: number;
  ignition?: boolean;
  release?: number;
}) {
  const frames = useMemo(
      () => simulateIronSulfur({ ironRatio: ratio, ignition, heatRelease: release }),
      [ratio, ignition, release],
    ),
    h = heatFrameAt(frames, time),
    left = 24,
    dx = (width - 48) / 35;
  return (
    <svg
      viewBox={`0 0 ${width} 215`}
      role="img"
      aria-label={say(
        '邻域热传递和局部反应生成的红热前沿',
        'A glowing front from local reaction and neighbouring heat transfer',
      )}
    >
      <path
        d={`M15 145L33 123H${width - 33}L${width - 15} 145V166H15Z`}
        fill="#d4cdb8"
        stroke="#aab094"
      />
      {h.reacted.map((r, i) => {
        const glow = Math.max(0, Math.min(1, (h.temperature[i] - 0.4) / 0.9)),
          x = left + i * dx;
        return (
          <g key={i} data-cell={i} data-reacted={r} data-temperature={h.temperature[i]}>
            <ellipse cx={x} cy="117" rx="9" ry="21" fill="#d58d4e" opacity={glow * 0.35} />
            <circle
              cx={x}
              cy={128 + (i % 3) * 2}
              r="5"
              fill={
                glow > 0.05
                  ? `rgb(${78 + glow * 139},${74 + glow * 43},${56 + glow * 7})`
                  : r > 0.5
                    ? '#64705d'
                    : i % 2
                      ? '#d8bf6c'
                      : '#93988a'
              }
            />
          </g>
        );
      })}
      {ignition && time < 1.1 ? (
        <g
          transform={`translate(${-Math.max(0, time - 0.7) * 60} ${-Math.max(0, time - 0.7) * 60})`}
        >
          <path d="M4 31L27 125" stroke="#bbc7b3" strokeWidth="6" strokeLinecap="round" />
          <path d="M24 112L27 125" stroke="#c69463" strokeWidth="6" strokeLinecap="round" />
        </g>
      ) : null}
      <text x={width / 2} y="30" textAnchor="middle">
        {!ignition
          ? say('未点火', 'No ignition')
          : time < 0.7
            ? say('局部热源接触', 'Local heat contact')
            : time < 1.1
              ? say('热源移开中', 'Removing the source')
              : say('外部热源已移开', 'External heat removed')}
      </text>
      <text x={width / 2} y="191" textAnchor="middle">
        Fe + S → FeS
      </text>
      <text x={width / 2} y="213" textAnchor="middle">
        {say('无量纲热模型', 'Dimensionless heat model')}
      </text>
    </svg>
  );
}
function MassEnd({
  reveal,
  air,
  iron = 1,
  sulfur = 0.5,
}: {
  reveal: boolean;
  air: boolean;
  iron?: number;
  sulfur?: number;
}) {
  const s = ironSulfurMass(iron, sulfur);
  return (
    <div className="csx15-mass" data-answer-visible={reveal}>
      <div className="csx15-budget-source">
        Fe {iron.toFixed(2)} g + S {sulfur.toFixed(2)} g
      </div>
      {!reveal ? (
        <>
          <div className="csx15-black-pile" />
          <p>{say('黑色就代表纯FeS吗？', 'Does black mean pure FeS?')}</p>
        </>
      ) : (
        <>
          <div className="csx15-mass-bar">
            <span style={{ flex: s.ironSulfideG, background: '#65715e' }} />
            <span style={{ flex: s.ironLeftG, background: '#b0b7a7' }} />
            <span style={{ flex: s.sulfurLeftG, background: '#c8af62' }} />
          </div>
          <div className="csx15-mass-read">
            <span>
              FeS <b>{s.ironSulfideG.toFixed(3)} g</b>
            </span>
            <span>
              {say('余Fe', 'Fe left')} <b>{s.ironLeftG.toFixed(3)} g</b>
            </span>
            <span>
              {say('余S', 'S left')} <b>{s.sulfurLeftG.toFixed(3)} g</b>
            </span>
          </div>
          <small>
            {say('理想主反应的净量，不是产物分析', 'Ideal main-reaction amounts, not an analysis')}
          </small>
        </>
      )}
      {air ? (
        <div className="csx15-air">
          <b>+ O₂</b>
          <span>
            S → SO₂
            <br />
            {say('Fe → 铁的氧化物', 'Fe → iron oxides')}
          </span>
        </div>
      ) : null}
    </div>
  );
}
export default function ChemSulfurTransformations() {
  const film = useShowcase(),
    { host, width } = useSignalWidth(),
    w = Math.max(256, Math.min(680, width)),
    practical = film.variant === 'sulfur-practical';
  const [mode, setMode] = useState<number | null>(null),
    [event, setEvent] = useState(0),
    [manualShot, setManualShot] = useState('atoms'),
    [mn, setMn] = useState(2),
    [sulfide, setSulfide] = useState(5),
    [copper, setCopper] = useState(1),
    [acid, setAcid] = useState(2),
    [stop, setStop] = useState(0.7),
    [time, setTime] = useState(4),
    [ratio, setRatio] = useState(1.15),
    [ignite, setIgnite] = useState(true),
    [release, setRelease] = useState(true),
    [feMass, setFeMass] = useState(1),
    [sMass, setSMass] = useState(0.5);
  const d = sulfurFilmState(
      film.watch ? film.chapter : (mode ?? film.chapter),
      film.chapterProgress,
      film.chapterTime,
      practical,
      browserLocale() === 'en' ? 'en' : 'zh',
    ),
    c = d.chapter;
  const progress = film.watch ? d.event : event;
  let shot = d.shot;
  if (!film.watch)
    shot =
      c === 0
        ? 'state-map'
        : c === 1
          ? 'comproportionation'
          : c === 2
            ? 'budget-answer'
            : c === 3
              ? 'copper-electrons'
              : c === 4
                ? 'stop'
                : c === 5
                  ? manualShot === 'atoms'
                    ? 'copper-net'
                    : 'copper-answer'
                  : c === 6 || c === 7
                    ? 'heat-front'
                    : 'mass-answer';
  const gasProgress = film.watch ? d.extent : Math.min(event, stop),
    massReveal = film.watch ? d.reveal : true;
  return (
    <section
      className="csx15"
      ref={host}
      data-watch={film.watch}
      data-chapter={SULFUR_IDS[c]}
      data-shot={shot}
    >
      {shot === 'observations' ? (
        <div className="csx15-opening">
          <div className="csx15-observe-yellow" />
          <div>
            <b>{say('黄色分散物', 'Yellow dispersion')}</b>
            <span>{say('硫的生成路径', 'Sulfur-forming pathway')}</span>
          </div>
          <div className="csx15-observe-gas">SO₂</div>
          <div>
            <b>{say('气体使品红褪色', 'Gas fades fuchsin')}</b>
            <span>{say('教材P5的反应证据', 'Textbook P5 evidence')}</span>
          </div>
          <div className="csx15-observe-heat" />
          <div>
            <b>{say('红热带继续前进', 'A moving glow')}</b>
            <span>{say('局部热源已经移开', 'The heater is removed')}</span>
          </div>
        </div>
      ) : shot === 'state-map' ? (
        <StateMap width={w} active={Math.min(3, Math.floor(progress * 4))} />
      ) : shot === 'sulfide-evidence' || shot === 'permanganate-evidence' ? (
        <Evidence
          kind={shot === 'sulfide-evidence' ? 'sulfide' : 'permanganate'}
          width={w}
          progress={Math.min(1, d.time / 5)}
        />
      ) : shot === 'comproportionation' ? (
        <ElectronLedger route="comproportionation" width={w} progress={progress} />
      ) : shot === 'mn-electrons' ? (
        <div className="csx15-mn">
          <b>2 Mn: +7 → +2</b>
          <div>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} style={{ opacity: i < Math.ceil(progress * 10) ? 1 : 0.18 }}>
                e⁻
              </span>
            ))}
          </div>
          <p>{say('每个Mn接收5份电子', 'Each Mn accepts 5 electron units')}</p>
        </div>
      ) : shot === 'budget-question' || shot === 'budget-answer' ? (
        <Budget
          kind="permanganate"
          reveal={film.watch ? d.reveal : true}
          secondReveal={film.watch ? d.secondReveal : true}
          mn={film.watch ? 2 : mn}
          sulfide={film.watch ? 5 : sulfide}
        />
      ) : shot === 'copper-apparatus' || shot === 'stop' ? (
        <>
          <CopperApparatus
            width={w}
            progress={gasProgress}
            practical={practical}
            lift={film.watch ? d.lift : shot === 'stop' && event >= stop ? 1 : 0}
            heated={shot === 'copper-apparatus' || (!film.watch && shot === 'stop' && event < stop)}
          />
          {shot === 'stop' ? (
            <div className="csx15-note">
              {!film.watch && event < stop
                ? say('接触仍在继续', 'Contact continues')
                : say('接触结束；已有产物仍保留', 'Contact ends; formed products remain')}
            </div>
          ) : null}
        </>
      ) : shot === 'copper-electrons' ? (
        <ElectronLedger route="copper" width={w} progress={progress} />
      ) : shot === 'blue-evidence' ? (
        <BlueTransfer width={w} progress={Math.min(1, d.time / 6)} practical={practical} />
      ) : shot === 'copper-net' ? (
        <CopperNet width={w} progress={progress} />
      ) : shot === 'copper-question' || shot === 'copper-answer' ? (
        <Budget
          kind="copper"
          reveal={film.watch ? d.reveal : true}
          copper={film.watch ? 1 : copper}
          acid={film.watch ? 1 : acid}
        />
      ) : shot === 'ignition' || shot === 'heat-front' ? (
        <HeatStrip
          width={w}
          time={film.watch ? d.heatTime : time}
          ratio={film.watch ? 1.15 : ratio}
          ignition={film.watch ? true : ignite}
          release={film.watch ? 1.4 : release ? 1.4 : 0}
        />
      ) : shot === 'iron-electrons' ? (
        <ElectronLedger route="iron" width={w} progress={progress} />
      ) : (
        <MassEnd
          reveal={massReveal}
          air={shot === 'air-boundary'}
          iron={film.watch ? 1 : feMass}
          sulfur={film.watch ? 0.5 : sMass}
        />
      )}
      {!film.watch ? (
        <div className="csx15-controls">
          <Segments
            label={say('比较主题', 'Comparison')}
            value={String(c === 6 ? 7 : c)}
            onChange={(v) => setMode(Number(v))}
            options={[
              [0, '价态图', 'States'],
              [1, '归中', 'Meet at zero'],
              [2, '氧化剂份额', 'Oxidant budget'],
              [3, '铜的电子', 'Copper electrons'],
              [4, '停止接触', 'Stop contact'],
              [5, '两个硫', 'Two sulfurs'],
              [7, '热前沿', 'Heat front'],
              [8, '过量物质', 'Excess material'],
            ].map(([v, zh, en]) => ({ value: String(v), label: say(String(zh), String(en)) }))}
          />
          {[0, 1, 3].includes(c) ? (
            <Range
              label={say('净账进程', 'Account progress')}
              min={0}
              max={1}
              step={0.01}
              value={event}
              onChange={setEvent}
            />
          ) : null}
          {c === 2 ? (
            <>
              <Range
                label={say('硫化物起始份额', 'Initial sulfide units')}
                min={0}
                max={5}
                step={0.25}
                value={sulfide}
                onChange={setSulfide}
              />
              <Range
                label={say('高锰酸根起始份额', 'Initial permanganate units')}
                min={0}
                max={4}
                step={0.1}
                value={mn}
                onChange={setMn}
              />
            </>
          ) : null}
          {c === 4 ? (
            <>
              <Range
                label={say('拟比较的反应进程', 'Compared reaction progress')}
                min={0}
                max={1}
                step={0.01}
                value={event}
                onChange={setEvent}
              />
              <Range
                label={say('本次比较的停止点', 'Stopping point for this comparison')}
                min={0}
                max={1}
                step={0.01}
                value={stop}
                onChange={setStop}
              />
              <div className="csx15-note">
                SO₂ {copperSulfurInventory(1, 2, event, stop).sulfurDioxide.toFixed(2)} · CuSO₄{' '}
                {copperSulfurInventory(1, 2, event, stop).copperSulfate.toFixed(2)}
              </div>
            </>
          ) : null}
          {c === 5 ? (
            <>
              <Segments
                label={say('比较内容', 'Compare')}
                value={manualShot}
                onChange={setManualShot}
                options={[
                  { value: 'atoms', label: say('同一批原子', 'Same atoms') },
                  { value: 'amounts', label: say('有限试剂', 'Finite reagents') },
                ]}
              />
              {manualShot === 'atoms' ? (
                <Range
                  label={say('净原子分配进程', 'Net atom-allocation progress')}
                  min={0}
                  max={1}
                  step={0.01}
                  value={event}
                  onChange={setEvent}
                />
              ) : (
                <>
                  <Range
                    label={say('铜的份额', 'Copper units')}
                    min={0}
                    max={3}
                    step={0.25}
                    value={copper}
                    onChange={setCopper}
                  />
                  <Range
                    label={say('硫酸的份额', 'Sulfuric-acid units')}
                    min={0}
                    max={4}
                    step={0.25}
                    value={acid}
                    onChange={setAcid}
                  />
                </>
              )}
            </>
          ) : null}
          {c === 6 || c === 7 ? (
            <>
              <Segments
                label={say('外部触发', 'External trigger')}
                value={ignite ? 'yes' : 'no'}
                onChange={(v) => setIgnite(v === 'yes')}
                options={[
                  { value: 'yes', label: say('局部点火', 'Local ignition') },
                  { value: 'no', label: say('不点火', 'No ignition') },
                ]}
              />
              <Segments
                label={say('模型热反馈', 'Model heat feedback')}
                value={release ? 'yes' : 'no'}
                onChange={(v) => setRelease(v === 'yes')}
                options={[
                  { value: 'yes', label: say('保留放热', 'Keep heat release') },
                  { value: 'no', label: say('假设无放热', 'No heat release') },
                ]}
              />
              <Range
                label={say('无量纲模型时间', 'Dimensionless model time')}
                min={0}
                max={20}
                step={0.1}
                value={time}
                onChange={setTime}
              />
              <Range
                label={say('Fe/S物质的量比', 'Fe/S amount ratio')}
                min={0}
                max={2}
                step={0.05}
                value={ratio}
                onChange={setRatio}
              />
            </>
          ) : null}
          {c === 8 ? (
            <>
              <Range
                label={say('Fe起始质量 / g', 'Initial Fe mass / g')}
                min={0}
                max={2}
                step={0.05}
                value={feMass}
                onChange={setFeMass}
              />
              <Range
                label={say('S起始质量 / g', 'Initial S mass / g')}
                min={0}
                max={1}
                step={0.05}
                value={sMass}
                onChange={setSMass}
              />
            </>
          ) : null}
          <details>
            <summary>{say('模型的范围', 'Model boundaries')}</summary>
            <p>
              {say(
                '颜色是定性现象，不换算浓度。电子胶囊、原子移动和组成框表示选定净反应的守恒账，不是溶液中游离电子、真实盐分子或逐步机理。硫化物水相的酸碱与中间产物未逐一展开。两种高锰酸根终点在酸性、Mn²⁺终点下分别假设，不由条件自动预言。铁硫传播是无量纲模型，空气副反应不计算。',
                'Colours are qualitative, not concentration readings. Electron packets, moving atoms and composition groups express a selected net balance, not solvated electrons, isolated salt molecules or a stepwise mechanism. Sulfide acid–base speciation and intermediate products are not resolved. The two permanganate routes separately assume acidic conditions and Mn²⁺; controls do not predict a unique product. Heat propagation is dimensionless, and air side reactions are not computed.',
              )}
            </p>
          </details>
        </div>
      ) : null}
    </section>
  );
}
