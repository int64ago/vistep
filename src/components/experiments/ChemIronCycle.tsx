import { useEffect, useRef, useState, type ReactNode } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  ironThiocyanate,
  ironEquilibriumPath,
  ironElectronFrame,
  ironAliquot,
  ironCoordination,
  ironCycleFilm,
  ironRamp,
  ironLigandRoute,
  ironEase,
  ironOxidantComparison,
  IRON_CYCLE_SECONDS,
} from '../../models/chem-iron-cycle';
import '../../styles/chem-iron-cycle.css';
const say = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const palette = {
  ferric: '#a57849',
  ferrous: '#66847c',
  metal: '#6c7268',
  red: '#a64642',
  ligand: '#817ba3',
  electron: '#c6993d',
};
function Frame({ w, children, label }: { w: number; children: ReactNode; label: string }) {
  return (
    <svg viewBox={`0 0 ${w} 240`} style={{ height: 240 }} role="img" aria-label={label}>
      {children}
    </svg>
  );
}
function Fe({
  x,
  y,
  charge = 3,
  id,
  metal = false,
  small = false,
}: {
  x: number;
  y: number;
  charge?: number;
  id?: string;
  metal?: boolean;
  small?: boolean;
}) {
  const r = small ? 11 : 25;
  return (
    <g data-iron-id={id} data-charge={charge}>
      <circle
        cx={x}
        cy={y}
        r={r + 5}
        fill={charge === 3 ? palette.ferric : palette.ferrous}
        opacity=".08"
      />
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={metal ? palette.metal : charge === 3 ? '#eadbc0' : '#d8e5db'}
        stroke={metal ? '#626d63' : charge === 3 ? '#af895a' : '#7d9b88'}
        strokeWidth="1.4"
      />
      {!small && (
        <text x={x} y={y + 5.5} textAnchor="middle" className={metal ? 'icx-metal-text' : ''}>
          {metal ? 'Fe' : charge === 3 ? 'Fe³⁺' : 'Fe²⁺'}
        </text>
      )}
    </g>
  );
}
function Ligand({
  x,
  y,
  id,
  opacity = 1,
}: {
  x: number;
  y: number;
  id?: string;
  opacity?: number;
}) {
  return (
    <g opacity={opacity} data-ligand-id={id}>
      <rect x={x - 28} y={y - 13} width="56" height="26" rx="13" fill="#e7e1ec" stroke="#a59bb4" />
      <text x={x} y={y + 5.5} textAnchor="middle">
        SCN⁻
      </text>
    </g>
  );
}
function Well({
  x,
  y = 45,
  w = 80,
  h = 125,
  red = 0,
  metal = false,
  portion = 1,
}: {
  x: number;
  y?: number;
  w?: number;
  h?: number;
  red?: number;
  metal?: boolean;
  portion?: number;
}) {
  const surface = y + h - 18 - (h - 60) * portion;
  return (
    <g>
      <path
        d={`M${x - w / 2} ${y}v${h - 18}q0 18 ${w / 2} 18t${w / 2}-18V${y}`}
        fill="#d7ddd11c"
        stroke="#94a496"
        strokeWidth="1.6"
      />
      <path
        d={`M${x - w / 2 + 3} ${surface}h${w - 6}V${y + h - 21}q0 18 ${-w / 2 + 3} 18t${-w / 2 + 3}-18Z`}
        fill="#bacbb5"
        opacity={portion > 0 ? 0.25 : 0}
      />
      <path
        d={`M${x - w / 2 + 3} ${surface}h${w - 6}V${y + h - 21}q0 18 ${-w / 2 + 3} 18t${-w / 2 + 3}-18Z`}
        fill={palette.red}
        opacity={portion > 0 ? red * 0.82 : 0}
      />
      <ellipse cx={x} cy={y} rx={w / 2} ry="5" fill="none" stroke="#a0ad9a" />
      {metal &&
        [0, 1, 2, 3, 4].map((i) => (
          <ellipse
            key={i}
            cx={x - 22 + i * 11}
            cy={y + h - 8 + (i % 2) * 3}
            rx="6"
            ry="3"
            fill={palette.metal}
          />
        ))}
    </g>
  );
}
function Binding({
  w,
  progress,
  mixed = false,
  question = false,
}: {
  w: number;
  progress: number;
  mixed?: boolean;
  question?: boolean;
}) {
  const cx = w * 0.44,
    cy = 108,
    p = ironEase(progress),
    lx = cx + 100 - 30 * p,
    ly = 166 - 58 * p;
  return (
    <Frame
      w={w}
      label={
        question
          ? say('混合样品：等待显色检验', 'Mixed sample: predict the test result')
          : say(
              '三价铁结合硫氰酸根，二价铁仍留在溶液中',
              'Iron(III) binds thiocyanate; iron(II) remains in solution',
            )
      }
    >
      <ellipse cx={cx + 15} cy={cy} rx="53" ry="42" fill={palette.red} opacity={p * 0.12} />
      {p > 0.02 && (
        <path
          d={`M${cx + 25} ${cy}L${lx - 28} ${ly}`}
          stroke={palette.ligand}
          strokeWidth="2"
          opacity={p}
        />
      )}
      <Fe x={cx} y={cy} id="test-FeIII" />
      <Ligand x={lx} y={ly} id="test-SCN" />
      {mixed && (
        <>
          <Fe x={w * 0.24} y={190} charge={2} id="mixed-FeII" />
          <text x={w * 0.24 + 35} y="196">
            {say('仍在水中', 'still present')}
          </text>
        </>
      )}
      <circle cx={w - 32} cy="47" r="17" fill={palette.red} opacity={p * 0.65} />
      <text x={w / 2} y="30" textAnchor="middle">
        {question
          ? say('混合样品会显红吗？', 'Will the mixture turn red?')
          : p === 1
            ? say('有色配合物', 'Coloured complex')
            : say('同一份 SCN⁻', 'The same SCN⁻')}
      </text>
    </Frame>
  );
}
export function IronElectronView({
  w,
  p,
  direction,
  test = false,
  withReference = false,
}: {
  w: number;
  p: number;
  direction: 'reduce' | 'oxidize';
  test?: boolean;
  withReference?: boolean;
}) {
  const m = ironElectronFrame(direction, p, w, withReference);
  return (
    <>
      <Frame
        w={w}
        label={say(
          '电子份额记账；包含转移中的电子，同一铁和氯身份保持',
          'Electron-credit account, including credits in transit. Iron and chlorine identities persist.',
        )}
      >
        <path
          d={`M20 26V210q0 12 12 12H${w - 32}q12 0 12-12V26`}
          fill="#d6e1d618"
          stroke="#b3c0ad"
        />
        {direction === 'reduce' && (
          <>
            <ellipse cx={w / 2} cy="211" rx="45" ry="7" fill="#c9c6b5" />
            {[0, 1, 2].map((i) => (
              <ellipse
                key={i}
                cx={w / 2 - 34 + i * 34}
                cy="209"
                rx="7"
                ry="4"
                fill={palette.metal}
              />
            ))}
          </>
        )}
        {m.chlorineBond && (
          <path d={`M${w * 0.4 + 20} 175H${w * 0.6 - 20}`} stroke="#91a47e" strokeWidth="3" />
        )}
        {m.atoms.map((a) =>
          a.element === 'Fe' ? (
            <Fe
              key={a.id}
              x={a.x}
              y={a.y}
              charge={a.charge}
              id={a.id}
              metal={a.phase === 'metal'}
            />
          ) : (
            <g key={a.id} data-atom-id={a.id} data-charge={a.charge}>
              <circle cx={a.x} cy={a.y} r="23" fill="#e1e6c8" stroke="#99a17b" />
              <text x={a.x} y={a.y + 5.5} textAnchor="middle">
                {a.charge === -1 ? 'Cl⁻' : 'Cl'}
              </text>
            </g>
          ),
        )}
        {m.electrons.map((e) => (
          <g key={e.id} data-electron-id={e.id} data-phase={e.phase}>
            <circle
              cx={e.x}
              cy={e.y}
              r="7"
              fill={palette.electron}
              stroke="#fff5cf"
              strokeWidth="2"
            />
          </g>
        ))}
        {withReference && (
          <g data-reference-complex="unchanged">
            <ellipse cx={w * 0.79} cy={118} rx="36" ry="53" fill={palette.red} opacity=".08" />
            <Fe x={w * 0.79} y={102} id="unchanged-complex-Fe" />
            <path d={`M${w * 0.79} 127V137`} stroke={palette.ligand} strokeWidth="2" />
            <Ligand x={w * 0.79} y={151} id="unchanged-bound-SCN" />
            <text x={w * 0.79} y={53} textAnchor="middle">
              {say('暂不变', 'Unchanged')}
            </text>
          </g>
        )}
        {test && (
          <>
            <Ligand x={w * 0.22} y={171} id="post-SCN-0" />
            <Ligand x={w * 0.78} y={171} id="post-SCN-1" />
          </>
        )}
      </Frame>
      <div className="icx-ledger">
        <span>
          {say('转移中', 'In transit')} <b>{m.inTransit} e⁻</b>
        </span>
        {!withReference && (
          <span>
            {direction === 'reduce' ? say('水中铁', 'Dissolved Fe') : say('已接收', 'Accepted')}{' '}
            <b>{direction === 'reduce' ? `${m.aqueousIron} / 3` : `${m.deposited} e⁻`}</b>
          </span>
        )}
      </div>
    </>
  );
}
function Separation({ w, p, metalCompare }: { w: number; p: number; metalCompare: boolean }) {
  const ions = ironAliquot(p, w);
  return (
    <Frame
      w={w}
      label={say(
        '三个标记离子随清液移动；金属铁留在原管',
        'Three tagged ions move with the clear aliquot; metal stays in the original tube',
      )}
    >
      <Well x={w * 0.25} w={w < 500 ? 102 : 145} h={150} metal portion={1 - 0.7 * p} />
      <Well x={w * 0.75} w={w < 500 ? 102 : 145} h={150} portion={0.7 * p} />
      {ions.map((a, i) => (
        <g key={a.id} data-iron-id={a.id} data-phase={a.phase}>
          <Fe x={a.x} y={a.y} charge={2} small />
          <text x={a.x} y={a.y + 5} textAnchor="middle">
            {['A', 'B', 'C'][i]}
          </text>
        </g>
      ))}
      <text x={w * 0.25} y="27" textAnchor="middle">
        {say('原管', 'Original')}
      </text>
      <text x={w * 0.75} y="27" textAnchor="middle">
        {say('清液', 'Aliquot')}
      </text>
      <text x={w / 2} y="228" textAnchor="middle">
        {metalCompare
          ? say('留下潜在电子供体', 'Leave the electron donor behind')
          : 'A · B · C = Fe²⁺'}
      </text>
      {metalCompare && (
        <g>
          <circle
            cx={w * 0.25}
            cy="191"
            r="26"
            fill="none"
            stroke={palette.electron}
            strokeWidth="2"
          />
          <circle cx={w * 0.25 - 7} cy="185" r="5" fill={palette.electron} />
          <circle cx={w * 0.25 + 7} cy="185" r="5" fill={palette.electron} />
        </g>
      )}
    </Frame>
  );
}
function LimitedComparison({ w, reveal }: { w: number; reveal: boolean }) {
  return (
    <Frame
      w={w}
      label={
        reveal
          ? say(
              '限量氧化剂的两种净账本；不表示反应先后或速率',
              'Two limited-oxidant net accounts, not an elementary reaction order or rate',
            )
          : say(
              '同量氧化剂，有无剩余金属铁，先预测',
              'Same oxidant dose, with or without metal: predict first',
            )
      }
    >
      {[false, true].map((metal, i) => {
        const x = w * (i ? 0.75 : 0.25),
          m = ironOxidantComparison(metal);
        return (
          <g key={i}>
            <text x={x} y="24" textAnchor="middle">
              {metal ? say('有铁粉', 'Metal retained') : say('清液', 'Clear aliquot')}
            </text>
            <Well
              x={x}
              y={45}
              w={w < 500 ? 100 : 150}
              h={125}
              red={reveal && !metal ? 0.55 : 0}
              metal={!reveal && metal}
            />
            <text x={x} y="105" textAnchor="middle">
              {reveal ? `${metal ? m.feII : m.feIII} ${metal ? 'Fe²⁺' : 'Fe³⁺'}` : '2 Fe²⁺'}
            </text>
            <text x={x} y="144" textAnchor="middle">
              {reveal ? '2 Cl⁻' : metal ? '+ Fe' : ' '}
            </text>
            <text x={x} y="199" textAnchor="middle">
              1 Cl₂
            </text>
          </g>
        );
      })}
      <text x={w / 2} y="231" textAnchor="middle">
        {reveal
          ? say('可能的净结果 · 非反应速率', 'Possible net result · not kinetics')
          : say('显色一定相同吗？', 'Must the colour be the same?')}
      </text>
    </Frame>
  );
}
function Reference({ w, progress, beat }: { w: number; progress: number; beat: number }) {
  const p = progress,
    left = w * 0.28,
    right = w * 0.72;
  return beat === 0 ? (
    <Frame
      w={w}
      label={say('三份同源溶液，a保留参照', 'Three matched samples; a is kept unchanged')}
    >
      {['a', 'b', 'c'].map((id, i) => (
        <g key={id}>
          <Well
            x={(w * (i + 1)) / 4}
            w={w < 500 ? 65 : 110}
            red={ironThiocyanate(0.0025, 0.001).red}
          />
          <text x={(w * (i + 1)) / 4} y="205" textAnchor="middle">
            {id}
          </text>
        </g>
      ))}
    </Frame>
  ) : (
    <Frame
      w={w}
      label={say(
        '选定的成对交换：一份配体离开，另一份结合；总体分布稳定',
        'Selected paired exchanges: one ligand leaves while another binds; the overall distribution is steady',
      )}
    >
      <Fe x={left} y={74} id="exchange-Fe-0" />
      <Fe x={right} y={74} id="exchange-Fe-1" />
      <path
        d={`M${left} 100V${122 + 42 * p}M${right} 100V${164 - 42 * p}`}
        stroke={palette.ligand}
        opacity=".5"
        strokeDasharray="3 4"
      />
      <Ligand x={left} y={122 + 62 * p} id="exchange-SCN-A" />
      <Ligand x={right} y={184 - 62 * p} id="exchange-SCN-B" />
      <text x={left} y="224" textAnchor="middle">
        A
      </text>
      <text x={right} y="224" textAnchor="middle">
        B
      </text>
      <text x={w / 2} y="25" textAnchor="middle">
        {beat < 2
          ? say('局部交换 · 不是速率模型', 'Selected exchange · not a rate law')
          : 'Q₁ = K₁'}
      </text>
    </Frame>
  );
}
function Distribution({
  w,
  kind,
  perturb,
  relax,
  predict,
  reveal,
}: {
  w: number;
  kind: 'remove' | 'add';
  perturb: number;
  relax: number;
  predict: boolean;
  reveal: boolean;
}) {
  const m = ironEquilibriumPath(kind, perturb, relax),
    cx = w * 0.42,
    cy = 110,
    route = ironLigandRoute(kind, perturb, relax, w),
    lx = route.x,
    ly = route.y;
  const q = m.quotient.first;
  return (
    <>
      <Frame
        w={w}
        label={
          predict && !reveal
            ? say(
                '预测：配体增加后，铁总量会增加吗？',
                'Predict: does adding ligand increase total iron?',
              )
            : say(
                '自由与结合的硫氰酸根来自同一物料账本；数值为理想示例',
                'Free and bound thiocyanate share one material account; numbers are an ideal example',
              )
        }
      >
        <Fe x={cx} y={cy} id="equilibrium-centre" />
        <path
          d={`M${cx + 25} ${cy}L${lx - 28} ${ly}`}
          stroke={palette.ligand}
          strokeWidth="2"
          opacity={route.bond}
        />
        <g data-ligand-phase={route.phase}>
          <Ligand x={lx} y={ly} id="tracked-equilibrium-SCN" />
        </g>
        {kind === 'add' && (
          <>
            {perturb === 0 && (
              <rect
                x={w - 116}
                y={34}
                width="113"
                height="38"
                rx="15"
                fill="none"
                stroke="#b3aa98"
                strokeDasharray="3 4"
              />
            )}
            <text
              x={route.potassium.x}
              y={route.potassium.y + 5.5}
              textAnchor="middle"
              data-spectator="K"
            >
              K⁺
            </text>
          </>
        )}
        <text x={w / 2} y="24" textAnchor="middle">
          {predict && !reveal
            ? say('铁总量也增加了吗？', 'More total iron, too?')
            : q === null
              ? 'Q₁ —'
              : `Q₁ / K₁ = ${q.toFixed(2)}`}
        </text>
        <circle cx={w * 0.16} cy="91" r="14" fill={palette.red} opacity={m.reference.red} />
        <circle cx={w * 0.16} cy="128" r="14" fill={palette.red} opacity={m.state.red} />
        <text x={w * 0.16} y="62" textAnchor="middle">
          a
        </text>
        <text x={w * 0.16} y="164" textAnchor="middle">
          {kind === 'remove' ? 'b' : 'c'}
        </text>
        <text x={w / 2} y="192" textAnchor="middle">
          {predict && !reveal
            ? say('先预测，再核对铁账本', 'Predict before checking iron')
            : reveal && kind === 'add'
              ? say('铁总量不变', 'Total iron stays fixed')
              : say('自由 + 结合 = 总 SCN⁻', 'Free + bound = total SCN⁻')}
        </text>
        <text x={w / 2} y="216" textAnchor="middle">
          {(m.state.ligand * 1000).toFixed(3)} +{' '}
          {((m.state.mono + 2 * m.state.bis) * 1000).toFixed(3)} ={' '}
          {(m.state.ligandTotal * 1000).toFixed(3)}
        </text>
        <text x={w / 2} y="239" textAnchor="middle">
          {say('溶液 SCN⁻ / mmol·L⁻¹', 'Solution SCN⁻ / mmol·L⁻¹')}
        </text>
      </Frame>
    </>
  );
}
export function IronCoordinationView({
  w,
  first,
  second,
  question = false,
}: {
  w: number;
  first: number;
  second: number;
  question?: boolean;
}) {
  const m = ironCoordination(first, second, w),
    cx = m.center.x,
    cy = m.center.y;
  return (
    <Frame
      w={w}
      label={
        question
          ? say(
              '配离子总电荷为正二，中心铁的形式氧化数是多少？',
              'Complex charge is plus two. What is the central iron oxidation state?',
            )
          : say(
              '氮端配位，水配体离开；中心铁形式氧化数始终正三',
              'Nitrogen binds as a water ligand leaves; the central iron remains formally plus three',
            )
      }
    >
      <ellipse cx={cx} cy={cy} rx="65" ry="57" fill={palette.red} opacity={first * 0.08} />
      {[-1, 1].flatMap((s) =>
        [-1, 1].map((t) => (
          <g key={`${s}${t}`} opacity=".55">
            <path
              d={`M${cx + s * 17} ${cy + t * 22}L${cx + s * 29} ${cy + t * 45}`}
              stroke="#a7b6aa"
            />
            <circle cx={cx + s * 31} cy={cy + t * 49} r="7" fill="#dce4d6" />
            <path
              d={`M${cx + s * 31} ${cy + t * 49}l-8 ${t * 8}m8 ${-t * 8}l8 ${t * 8}`}
              stroke="#b9c2ad"
            />
          </g>
        )),
      )}
      <circle cx={cx} cy={cy} r="25" fill="#eadbc0" stroke="#ae8c60" />
      <text x={cx} y={cy + 6} textAnchor="middle">
        Fe
      </text>
      {m.ligands.map((l, i) => (
        <g key={l.id} data-ligand-id={l.id}>
          <path
            d={`M${cx + (i ? -25 : 25)} ${cy}L${l.nitrogen.x} ${l.nitrogen.y}`}
            stroke={palette.ligand}
            strokeWidth="2"
            opacity={l.progress}
          />
          <path
            d={`M${l.nitrogen.x} ${l.nitrogen.y}H${l.sulfur.x}`}
            stroke="#968ba7"
            strokeWidth="2"
          />
          {[
            ['N', l.nitrogen],
            ['C', l.carbon],
            ['S', l.sulfur],
          ].map(([name, point]) => {
            const a = point as { x: number; y: number };
            return (
              <g key={String(name)}>
                <circle cx={a.x} cy={a.y} r="11" fill="#f5f0e8" />
                <text x={a.x} y={a.y + 5.5} textAnchor="middle">
                  {String(name)}
                </text>
              </g>
            );
          })}
          <g data-water-id={l.water.id}>
            <path
              d={`M${cx + (i ? -25 : 25)} ${cy}L${l.water.x} ${l.water.y}`}
              stroke="#a7b6aa"
              opacity={1 - l.progress}
            />
            <text x={l.water.x} y={l.water.y + 5.5} textAnchor="middle" fill="#6e8b84">
              H₂O
            </text>
          </g>
          {l.progress > 0 && (
            <g data-bond-pair={l.id} fill={palette.ligand}>
              <circle
                cx={(cx + (i ? -14 : 14) + l.nitrogen.x) / 2}
                cy={(cy + l.nitrogen.y) / 2 - 4}
                r="3"
              />
              <circle
                cx={(cx + (i ? -14 : 14) + l.nitrogen.x) / 2}
                cy={(cy + l.nitrogen.y) / 2 + 4}
                r="3"
              />
            </g>
          )}
        </g>
      ))}
      <text x={w / 2} y="23" textAnchor="middle">
        {say('水合环境 · 配位示意', 'Hydrated centre · schematic')}
      </text>
      <text x={w / 2} y="213" textAnchor="middle">
        {say('配离子电荷', 'Complex charge')} +{m.complexCharge}
      </text>
      <text x={w / 2} y="237" textAnchor="middle">
        {say('铁的形式氧化数', 'Iron oxidation state')} {question ? '?' : '+3'}
      </text>
    </Frame>
  );
}
export default function ChemIronCycle() {
  const film = useShowcase(),
    ref = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(280);
  const initial =
    film.variant === 'redox'
      ? 1
      : film.variant === 'equilibrium'
        ? 4
        : film.variant === 'coordination'
          ? 7
          : 0;
  const [chapter, setChapter] = useState(initial),
    [progress, setProgress] = useState(1),
    [mixed, setMixed] = useState(false),
    [reveal, setReveal] = useState(false),
    [amount, setAmount] = useState(0.5);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const ro = new ResizeObserver(([e]) =>
      setWidth(Math.max(240, Math.floor(e.contentRect.width))),
    );
    ro.observe(element);
    return () => ro.disconnect();
  }, []);
  const c = film.watch ? film.chapter : chapter,
    t = film.watch ? film.chapterTime : progress * IRON_CYCLE_SECONDS[c];
  const d = ironCycleFilm(c, t, browserLocale()),
    w = width,
    showAnswer = film.watch ? d.reveal : reveal,
    act = film.watch ? d.action : progress;
  let view: ReactNode,
    note = '';
  if (c === 0) {
    const isMixed = film.watch ? d.beat >= 2 : mixed;
    if (!isMixed && d.beat === 0 && film.watch) {
      view = (
        <Frame
          w={w}
          label={say('同条件的三价铁与二价铁检验对照', 'Matched iron(III) and iron(II) tests')}
        >
          {[3, 2].map((n, i) => (
            <g key={n}>
              <Well x={w * (i ? 0.73 : 0.27)} red={n === 3 ? ironRamp(t, 1, 5) * 0.65 : 0} />
              <text x={w * (i ? 0.73 : 0.27)} y="207" textAnchor="middle">
                {n === 3 ? 'Fe³⁺' : 'Fe²⁺'}
              </text>
            </g>
          ))}
          <text x={w / 2} y="28" textAnchor="middle">
            + SCN⁻
          </text>
        </Frame>
      );
    } else
      view = (
        <Binding
          w={w}
          progress={isMixed ? (showAnswer ? 1 : 0) : film.watch ? d.action : progress}
          mixed={isMixed}
          question={isMixed && !showAnswer}
        />
      );
    note =
      isMixed && showAnswer
        ? say('显红色 ≠ 只有 Fe³⁺', 'Red ≠ iron(III) only')
        : say('相同的检验条件', 'Matched test conditions');
  } else if (c === 1) {
    view = (
      <IronElectronView
        w={w}
        p={act}
        direction="reduce"
        test={film.watch ? d.beat === 3 : progress === 1}
      />
    );
    note =
      d.beat === 3
        ? say('反应后检验：无相同红色响应', 'Subsequent test: no red response')
        : say('金色点：电子份额记账', 'Gold dots: electron-credit account');
  } else if (c === 2) {
    view = <Separation w={w} p={act} metalCompare={d.beat === 1} />;
    note =
      d.beat === 1
        ? say('金属也可能消耗氧化能力', 'Metal can consume oxidizing capacity')
        : say('移取不改变 Fe²⁺ 的价态', 'Transfer does not change Fe²⁺');
  } else if (c === 3) {
    view =
      d.beat >= 2 ? (
        <LimitedComparison w={w} reveal={showAnswer} />
      ) : d.beat === 1 ? (
        <Binding w={w} progress={d.binding} />
      ) : (
        <IronElectronView w={w} p={act} direction="oxidize" />
      );
    note =
      d.beat >= 2
        ? say('同样的限量氧化剂', 'Same limited oxidant dose')
        : d.beat === 1
          ? say('原有 SCN⁻ 重新结合', 'Existing SCN⁻ binds again')
          : say('金色点：电子份额记账', 'Gold dots: electron-credit account');
  } else if (c === 4) {
    view = <Reference w={w} progress={d.exchange} beat={d.beat} />;
    note = say('参照 a 始终保持原条件', 'Reference a stays unchanged');
  } else if (c === 5) {
    if (d.beat === 0) {
      view = (
        <IronElectronView
          w={w}
          p={film.watch ? d.perturb : progress}
          direction="reduce"
          withReference
        />
      );
      note = say('先还原游离 Fe³⁺', 'First reduce free Fe³⁺');
    } else {
      view = (
        <Distribution
          w={w}
          kind="remove"
          perturb={film.watch ? d.perturb : amount}
          relax={film.watch ? d.relax : progress}
          predict={false}
          reveal
        />
      );
      note = 'Fe³⁺ + SCN⁻ ⇌ FeSCN²⁺';
    }
  } else if (c === 6) {
    view = (
      <Distribution
        w={w}
        kind="add"
        perturb={film.watch ? d.perturb : amount}
        relax={film.watch ? d.relax : progress}
        predict={d.beat >= 2}
        reveal={showAnswer}
      />
    );
    note = 'Fe³⁺ + SCN⁻ ⇌ FeSCN²⁺';
  } else {
    view = (
      <IronCoordinationView
        w={w}
        first={film.watch ? act : ironRamp(progress, 0, 0.35)}
        second={film.watch ? d.second : ironRamp(progress, 0.65, 1)}
        question={d.beat === 2 && !showAnswer}
      />
    );
    note = say('紫色双点：共享成键电子对', 'Purple pair: shared bonding electrons');
  }
  return (
    <section className="icx" data-chapter={c} data-beat={d.beat} data-revealed={showAnswer}>
      <div className="icx-stage" ref={ref}>
        {view}
        <div className="icx-note">{note}</div>
      </div>
      {!film.watch && (
        <div className="icx-controls">
          <Segments
            label={say('因果过程', 'Causal process')}
            value={String(chapter)}
            options={[
              [0, '显色', 'Test'],
              [1, '还原', 'Reduction'],
              [2, '清液', 'Aliquot'],
              [3, '氧化', 'Oxidation'],
              [4, '平衡', 'Exchange'],
              [5, '减少铁', 'Reduce FeIII'],
              [6, '增加配体', 'Add ligand'],
              [7, '配位', 'Coordination'],
            ].map(([v, a, b]) => ({ value: String(v), label: say(String(a), String(b)) }))}
            onChange={(v) => {
              setChapter(Number(v));
              setProgress(0);
              setReveal(false);
            }}
          />
          <Range
            label={say('过程位置', 'Process position')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {c === 0 && (
            <Segments
              label={say('样品', 'Sample')}
              value={mixed ? 'mixed' : 'ferric'}
              options={[
                { value: 'ferric', label: 'Fe³⁺' },
                { value: 'mixed', label: 'Fe³⁺ + Fe²⁺' },
              ]}
              onChange={(v) => {
                setMixed(v === 'mixed');
                setReveal(false);
              }}
            />
          )}
          {(c === 5 || c === 6) && (
            <Range
              label={
                c === 5
                  ? say('还原扰动程度', 'Reduction perturbation')
                  : say('配体增加量比例', 'Fraction of ligand addition')
              }
              value={amount}
              min={0}
              max={1}
              step={0.05}
              onChange={setAmount}
            />
          )}
          {[0, 3, 6, 7].includes(c) && (
            <button className="icx-answer" onClick={() => setReveal(!reveal)}>
              {reveal ? say('重新预测', 'Predict again') : say('揭晓预测', 'Reveal prediction')}
            </button>
          )}
          <details>
            <summary>{say('模型范围与物料账本', 'Model scope and material accounts')}</summary>
            <p>
              {say(
                '金色点是电子份额的记账，不是水中自由电子的飞行。微观对象是选定事件，不是一颗代表固定摩尔数。配位数值采用25°C的理想两配合物模型；水合配体、离子活度和Fe(II)配位未完整展开。颜色不对应实测吸收度。',
                'Gold dots are electron credits, not free electrons flying through water. Microscopic objects depict selected events, not fixed mole-count markers. The ideal two-complex model uses 25 °C constants; hydration, activities and Fe(II) complexation are not fully represented. Colour is not measured absorbance.',
              )}
            </p>
            <p>
              {say(
                '平衡镜头先作有限扰动，再用守恒的组成路径连接新平衡；时间不代表真实速率。这里的初始浓度为 Fe(III) 2.5 mmol/L、SCN⁻ 1 mmol/L，区别于教材配液与滴加量。',
                'Equilibrium shots apply a finite perturbation and a conservative compositional path to a new equilibrium, not a kinetic prediction. The illustrative initial concentrations are 2.5 mmol/L Fe(III) and 1 mmol/L SCN⁻, distinct from the textbook recipe and drop volume.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
