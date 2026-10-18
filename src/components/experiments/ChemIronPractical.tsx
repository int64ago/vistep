import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  practicalFrame,
  practicalAcidAtoms,
  practicalBinding,
  practicalFilm,
  practicalIndicator,
  practicalNet,
  practicalRouteGeometry,
  IRON_PRACTICAL_CASES,
  IRON_PRACTICAL_EQUATIONS,
  type PracticalShot,
  type PracticalMotion,
} from '../../models/chem-iron-practical';
import '../../styles/chem-iron-practical.css';
const say = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const colours = {
  iron: '#747e75',
  ferric: '#ac8247',
  ferrous: '#668f86',
  copper: '#b77b4b',
  zinc: '#85999d',
  iodine: '#877297',
  electron: '#b68c39',
  red: '#a55249',
  oxygen: '#a66158',
  hydrogen: '#8aa4a0',
  manganese: '#8a6b92',
};
const sampleNames = [
  ['铁丝与铜离子', 'Iron and copper ions'],
  ['铜片与三价铁', 'Copper and iron three'],
  ['碘离子与三价铁', 'Iodide and iron three'],
  ['锌与二价铁', 'Zinc and iron two'],
  ['酸性高锰酸根与二价铁', 'Acidified permanganate'],
  ['三价铁显色对照', 'Iron three colour control'],
  ['铁粉先反应，再检验', 'Iron first; test afterwards'],
] as const;
function Line({
  x,
  y,
  children,
  anchor = 'middle',
  fill,
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: 'middle' | 'start' | 'end';
  fill?: string;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} style={fill ? { fill } : undefined}>
      {children}
    </text>
  );
}
function ArrowRail({ x1, x2, y, id }: { x1: number; x2: number; y: number; id: string }) {
  return (
    <path
      d={`M${x1} ${y}C${x1} ${y - 13} ${x2} ${y - 13} ${x2} ${y}`}
      fill="none"
      stroke="#bcaa73"
      strokeWidth="1.5"
      strokeDasharray="3 4"
      markerEnd={`url(#${id})`}
    />
  );
}
function Transfer({
  chapter,
  preset,
  p,
  width,
  id,
  indicator = false,
  record = false,
  motion,
}: {
  chapter: number;
  preset: number;
  p: number;
  width: number;
  id: string;
  indicator?: boolean;
  record?: boolean;
  motion?: PracticalMotion;
}) {
  const m = practicalFrame(chapter, p, preset, width, motion),
    net = practicalNet(chapter, 1, preset),
    w = m.width,
    left = w < 440 ? 48 : 140,
    right = w < 440 ? w - 48 : w - 140;
  const test = practicalIndicator(chapter, preset, p >= 0.999 ? 1 : 0, indicator);
  const atomColour = (a: (typeof m.actors)[number]) =>
    a.element === 'Fe'
      ? a.formalCharge === 0
        ? colours.iron
        : a.formalCharge === 3
          ? colours.ferric
          : colours.ferrous
      : a.element === 'Cu'
        ? a.formalCharge === 0
          ? colours.copper
          : '#679ba9'
        : a.element === 'Zn'
          ? colours.zinc
          : colours.iodine;
  return (
    <g
      data-event-chapter={chapter}
      data-credit-charge={m.creditCharge}
      data-current-charge={m.charge}
      data-initial-charge={m.initialCharge}
    >
      <Line x={w / 2} y={19}>
        {test.blue
          ? say('碘收支示意，非显色结构', 'Iodine account, not a structure')
          : record
            ? say('教材观察 · 局部', 'Textbook observation')
            : say('净电子份额记账', 'Net electron-credit account')}
      </Line>
      {m.credits.length > 0 && <ArrowRail x1={left} x2={right} y={60} id={id} />}
      <path
        d={`M12 59H${w - 12}V190Q${w - 12} 202 ${w - 24} 202H24Q12 202 12 190Z`}
        fill="#dce9e432"
        stroke="#c3d2c84d"
      />
      {m.actors.some((a) => a.phaseBefore === 'solid' || a.phaseAfter === 'solid') && (
        <g>
          <path
            d={`M${left - 30} 121q25-8 59-1l-6 68q-27 8-57 0Z`}
            fill="#bcc6ba55"
            stroke="#99a998"
          />
          <Line x={left + 13} y={220}>
            {say('金属表面', 'Metal surface')}
          </Line>
        </g>
      )}
      {!m.actors.some((a) => a.phaseBefore === 'solid' || a.phaseAfter === 'solid') && (
        <Line x={left} y={220}>
          {chapter === 2
            ? m.departed
              ? 'I₂ + I⁻'
              : 'I⁻'
            : chapter === 4
              ? 'Fe²⁺ / Fe³⁺'
              : say('样品', 'Sample')}
        </Line>
      )}
      <Line x={right} y={220}>
        {say('水相', 'Water')}
      </Line>
      {test.blue && (
        <g data-iodine-host="true">
          <ellipse
            cx={left}
            cy="100"
            rx={w < 440 ? 43 : 70}
            ry="49"
            fill="#6877a22a"
            stroke="#64749b"
            strokeWidth="2"
          />
          <path
            d={`M${left - 31} 71q62 12 0 24t0 24t0 24`}
            fill="none"
            stroke="#7887ad"
            opacity=".65"
          />
        </g>
      )}
      {chapter === 2 &&
        m.departed &&
        m.actors.filter((a) => a.element === 'I' && a.changed).length >= 2 && (
          <path
            d={`M${m.actors[0]!.x} ${m.actors[0]!.y}L${m.actors[1]!.x} ${m.actors[1]!.y}`}
            stroke={colours.iodine}
            strokeWidth="3"
          />
        )}
      {m.actors.map((a, i) => {
        const count = m.actors.filter(
            (x) => x.element === a.element && x.phaseBefore === a.phaseBefore,
          ).length,
          r = count === 1 ? 21 : 11,
          marked = i === 0,
          red = test.red && a.element === 'Fe' && a.formalCharge === 3;
        return (
          <g
            key={a.id}
            data-practical-atom={a.id}
            data-element={a.element}
            data-formal-charge={a.formalCharge}
            data-phase={a.phase}
          >
            {marked && (
              <circle cx={a.x} cy={a.y} r={r + 5} fill="none" stroke="#bda574" strokeWidth="1.5" />
            )}
            {red && <circle cx={a.x} cy={a.y} r={r + 6} fill={colours.red} opacity=".18" />}
            <circle
              cx={a.x}
              cy={a.y}
              r={r}
              fill={atomColour(a)}
              stroke="#fff9e8"
              strokeWidth="1.3"
            />
            {
              <Line x={a.x} y={a.y + 5.5} fill="#fffaf0">
                {(r === 21 || a.element === 'I') && a.formalCharge !== 0
                  ? `${a.element}${a.formalCharge === 2 ? '²⁺' : a.formalCharge === 3 ? '³⁺' : a.formalCharge === -1 ? '⁻' : '⁺'}`
                  : a.element}
              </Line>
            }
          </g>
        );
      })}
      {m.credits.map((e) => (
        <g
          key={e.id}
          data-electron-id={e.id}
          data-electron-phase={e.phase}
          opacity={record ? 0 : 1}
        >
          <circle cx={e.x} cy={e.y} r="4.5" fill={colours.electron} />
        </g>
      ))}
      {chapter === 4 && (
        <g data-acidic-acceptor-charge={m.acceptorCharge}>
          <rect
            x={right - 38}
            y="77"
            width="76"
            height="87"
            rx="17"
            fill="#ece0ee"
            stroke="#b29abb"
          />
          <Line x={right} y={103}>
            {m.arrived ? 'Mn²⁺' : 'MnO₄⁻'}
          </Line>
          <Line x={right} y={131}>
            {m.arrived ? '4H₂O' : '+ 8H⁺'}
          </Line>
          {(net.state.MnO4 ?? 0) > 0 && m.arrived && (
            <Line x={right} y={185}>
              {say('另有剩余', 'Also remains')}
            </Line>
          )}
        </g>
      )}
      {indicator && (
        <Line x={w / 2} y={188} fill={test.blue ? '#52688e' : test.red ? colours.red : undefined}>
          {!test.requested
            ? say('未加检验试剂', 'Test reagent absent')
            : test.reactionPending
              ? say('先完成反应记账', 'Complete the reaction account')
              : test.pending
                ? say('仍有紫色：检验待定', 'Purple remains: test pending')
                : test.blue
                  ? say('淀粉 · 含碘体系', 'Starch · iodine system')
                  : test.red
                    ? say('SCN⁻ 显红', 'SCN⁻: red response')
                    : say('无同样显色', 'No same colour response')}
        </Line>
      )}
    </g>
  );
}
function Acid({ p, width }: { p: number; width: number }) {
  const m = practicalAcidAtoms(p, width),
    mn = m.atoms[0]!;
  return (
    <g data-acid-net-progress={m.progress}>
      <Line x={m.width / 2} y={19}>
        {say('酸性净账：4O + 8H', 'Acidic net account: 4O + 8H')}
      </Line>
      {m.atoms
        .filter((a) => a.element === 'O')
        .map((a) => (
          <path
            key={`old-${a.id}`}
            d={`M${mn.x} ${mn.y}L${a.x} ${a.y}`}
            stroke={colours.manganese}
            opacity={m.mnO}
            strokeWidth="2"
          />
        ))}
      {[0, 1, 2, 3].flatMap((i) => {
        const o = m.atoms.find((a) => a.id === `acid-O${i}`)!;
        return [0, 1].map((j) => {
          const h = m.atoms.find((a) => a.id === `acid-H${i * 2 + j}`)!;
          return (
            <path
              key={`water-${i}-${j}`}
              d={`M${o.x} ${o.y}L${h.x} ${h.y}`}
              stroke="#a1aaa2"
              opacity={m.waterBond}
              strokeWidth="2"
            />
          );
        });
      })}
      {m.atoms.map((a) => (
        <g key={a.id} data-net-atom={a.id} data-element={a.element} data-group={a.group}>
          <circle
            cx={a.x}
            cy={a.y}
            r={a.element === 'H' ? 10 : a.element === 'O' ? 13 : 19}
            fill={
              a.element === 'Mn'
                ? colours.manganese
                : a.element === 'O'
                  ? colours.oxygen
                  : colours.hydrogen
            }
          />
          <Line x={a.x} y={a.y + 5.5} fill="#fffaf0">
            {a.element}
          </Line>
        </g>
      ))}
      <Line x={m.width / 2} y={222}>
        {p >= 0.94 ? 'Mn²⁺ + 4H₂O' : 'MnO₄⁻ + 8H⁺ + 5e⁻'}
      </Line>
    </g>
  );
}
function Binding({ p, preset, width }: { p: number; preset: number; width: number }) {
  const m = practicalBinding(p, width, preset);
  return (
    <g data-binding-centre-oxidation={m.centreOxidation}>
      <Line x={width / 2} y={22}>
        {say('显色对照', 'Colour control')}
      </Line>
      <circle
        cx={m.fe.x}
        cy={m.fe.y}
        r={42}
        fill={m.red ? '#b95e4d22' : '#dfe8de'}
        stroke="#c4cdbd"
      />
      <path
        d={`M${m.fe.x} ${m.fe.y}L${m.water.x} ${m.water.y}`}
        opacity={m.active ? 1 - m.progress : 1}
        stroke="#a8b9ad"
      />
      <circle cx={m.water.x} cy={m.water.y} r="15" fill="#e1ece6" stroke="#b3c9bd" />
      <Line x={m.water.x} y={m.water.y + 5}>
        {'H₂O'}
      </Line>
      {m.ligand.present && (
        <>
          <path
            d={`M${m.fe.x} ${m.fe.y}L${m.ligand.x} ${m.ligand.y}`}
            stroke="#a598ad"
            opacity={m.active ? m.progress : 0}
            strokeWidth="2"
          />
          <rect
            x={m.ligand.x - 29}
            y={m.ligand.y - 14}
            width="58"
            height="28"
            rx="14"
            fill="#e4deea"
            stroke="#b7a9c2"
          />
          <Line x={m.ligand.x} y={m.ligand.y + 5}>
            {'SCN⁻'}
          </Line>
        </>
      )}
      <circle
        cx={m.fe.x}
        cy={m.fe.y}
        r="24"
        fill={m.centreOxidation === 3 ? '#eadac0' : '#d7e4dd'}
        stroke="#a68d64"
      />
      <Line x={m.fe.x} y={m.fe.y + 5.5}>
        {m.centreOxidation === 3 ? 'Fe³⁺' : 'Fe²⁺'}
      </Line>
      <Line x={width / 2} y={171}>
        {say('中心铁的氧化数', 'Central iron oxidation state')}
      </Line>
      <Line x={width / 2} y={201}>{`+${m.centreOxidation} → +${m.centreOxidation}`}</Line>
    </g>
  );
}
function RouteMap({
  chapter,
  reveal,
  width,
  id,
}: {
  chapter: number;
  reveal: boolean;
  width: number;
  id: string;
}) {
  const m = practicalRouteGeometry(chapter, reveal, width),
    current = m.records.find((r) => r.chapter === chapter),
    compare = chapter === 4 && reveal;
  return (
    <g
      data-practical-map-records={m.records.length}
      data-current-route-revealed={reveal}
      data-role-comparison={compare}
    >
      <Line x={width / 2} y={22}>
        {say('教材观察记录', 'Textbook observation record')}
      </Line>
      {m.records
        .filter((r) => r.from !== r.to)
        .map((r) => {
          const a = r.fromPoint,
            b = r.toPoint,
            dir = Math.sign(b.x - a.x),
            active = r.chapter === chapter || (compare && r.chapter === 3);
          return (
            <path
              key={r.chapter}
              d={`M${a.x + 22 * dir} ${a.y}C${a.x + 36 * dir} ${r.controlY} ${b.x - 36 * dir} ${r.controlY} ${b.x - 22 * dir} ${b.y}`}
              fill="none"
              stroke={active ? '#a78339' : '#9eb6a8'}
              strokeWidth={active ? 3 : 1.5}
              opacity={active ? 1 : 0.3}
              markerEnd={active ? `url(#${id})` : undefined}
            />
          );
        })}
      {m.nodes.map((n) => (
        <g key={n.oxidation}>
          <circle
            cx={n.x}
            cy={n.y}
            r="23"
            fill={n.oxidation === 0 ? '#e0e4da' : n.oxidation === 2 ? '#d9e8df' : '#eadebd'}
            stroke="#a3b2a0"
          />
          <Line x={n.x} y={n.y + 5.5}>
            {n.oxidation === 0 ? 'Fe⁰' : n.oxidation === 2 ? 'Fe²⁺' : 'Fe³⁺'}
          </Line>
        </g>
      ))}
      {current && current.kind === 'coordination' && (
        <g>
          <ellipse
            cx={current.toPoint.x}
            cy={106}
            rx="32"
            ry="36"
            fill="none"
            stroke={colours.red}
            strokeWidth="2"
          />
          <Line x={width / 2} y={172}>
            {say('同一价态 · 配位显色', 'Same state · colour response')}
          </Line>
        </g>
      )}
      {compare && (
        <>
          <Line x={width * 0.25} y={180}>
            Zn
          </Line>
          <Line x={width * 0.75} y={180}>
            MnO₄⁻ / H⁺
          </Line>
        </>
      )}
      {current && current.kind === 'redox' && !compare && (
        <Line x={width / 2} y={180}>
          {say('反应伙伴', 'Reaction partner')}: {current.partner}
        </Line>
      )}
      {!reveal && (
        <Line x={width / 2} y={180}>
          {say('是否需要新增箭头？', 'Does this need a new arrow?')}
        </Line>
      )}
      <Line x={width / 2} y={215}>
        {say('价态路径，不是能量图', 'Oxidation states, not energy')}
      </Line>
    </g>
  );
}
export default function ChemIronPractical() {
  const film = useShowcase(),
    locale = browserLocale(),
    container = useRef<HTMLDivElement>(null),
    uid = useId().replaceAll(':', '');
  const [width, setWidth] = useState(268),
    [chapter, setChapter] = useState(0),
    [preset, setPreset] = useState(0),
    [progress, setProgress] = useState(0.5),
    [view, setView] = useState<PracticalShot>('transfer'),
    [test, setTest] = useState(true);
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const update = () => setWidth(Math.max(248, Math.min(720, Math.floor(el.clientWidth))));
    update();
    const o = new ResizeObserver(update);
    o.observe(el);
    return () => o.disconnect();
  }, []);
  const d = film.watch
    ? practicalFilm(film.chapter, film.chapterTime, locale)
    : { chapter, preset, progress, shot: view, prediction: false, reveal: progress >= 1, test };
  const c = d.chapter,
    sp = d.preset,
    frameP =
      d.shot === 'acid' || d.shot === 'map'
        ? 1
        : film.watch &&
            (d.shot === 'surface' ||
              d.shot === 'test' ||
              d.shot === 'iodine' ||
              d.shot === 'binding')
          ? 1
          : d.progress;
  const motion = film.watch && d.shot === 'transfer' && 'motion' in d ? d.motion : undefined;
  const frame = practicalFrame(c, frameP, sp, width, motion),
    indicator = practicalIndicator(c, sp, frameP, d.test),
    actualFe = frame.actors.filter((a) => a.element === 'Fe');
  const fe0 = actualFe.filter((a) => a.formalCharge === 0).length,
    fe2 = actualFe.filter((a) => a.formalCharge === 2).length,
    fe3 = actualFe.filter((a) => a.formalCharge === 3).length;
  const modeNames = sampleNames.map((a, value) => ({
    value: String(value),
    label: say(a[0], a[1]),
  }));
  const recipeLabels =
    c === 6
      ? [
          say('1Fe + 5Fe³⁺', '1Fe + 5Fe³⁺'),
          say('1Fe + 2Fe³⁺', '1Fe + 2Fe³⁺'),
          say('2Fe + 5Fe³⁺', '2Fe + 5Fe³⁺'),
        ]
      : c === 4
        ? [
            say('5Fe²⁺ : 1MnO₄⁻', '5Fe²⁺ : 1MnO₄⁻'),
            say('高锰酸根过量', 'Excess permanganate'),
            say('二价铁过量', 'Excess iron two'),
          ]
        : c === 5
          ? [
              say('Fe³⁺ + SCN⁻', 'Fe³⁺ + SCN⁻'),
              say('不加SCN⁻', 'No SCN⁻'),
              say('Fe²⁺对照', 'Fe²⁺ control'),
            ]
          : [
              say('示例配比', 'Example ratio'),
              say('改变供给', 'Change supply'),
              say('缺少反应伙伴', 'Partner absent'),
            ];
  const render =
    d.shot === 'acid' ? (
      <Acid p={d.progress} width={width} />
    ) : d.shot === 'map' || (c === 5 && d.shot === 'predict') ? (
      <RouteMap chapter={c} reveal={d.reveal} width={width} id={uid} />
    ) : c === 5 ? (
      <Binding p={d.progress} preset={sp} width={width} />
    ) : (
      <Transfer
        chapter={c}
        preset={sp}
        p={frameP}
        motion={motion}
        width={width}
        id={uid}
        indicator={d.test && (d.shot === 'iodine' || d.shot === 'test')}
        record={d.shot === 'surface'}
      />
    );
  const aria = d.prediction
    ? say('预测阶段，反应结果尚未揭示', 'Prediction: the result is not yet revealed')
    : d.shot === 'acid'
      ? say(
          '同一锰、四个氧与八个氢的酸性净收支',
          'The acidic net account preserves one manganese, four oxygen and eight hydrogen identities',
        )
      : say(sampleNames[c]![0], sampleNames[c]![1]);
  return (
    <section
      className="ipx"
      data-watch={film.watch}
      data-practical-chapter={c}
      data-practical-shot={d.shot}
      data-preset={sp}
      data-prediction={d.prediction}
      data-diagnostic={
        d.shot !== 'test'
          ? undefined
          : !indicator.requested
            ? 'absent'
            : indicator.pending || indicator.reactionPending
              ? 'pending'
              : indicator.red
                ? 'red'
                : 'no-red'
      }
    >
      <div className="ipx-stage" ref={container}>
        <svg viewBox={`0 0 ${width} 230`} role="img" aria-label={aria}>
          <defs>
            <marker
              id={uid}
              viewBox="0 0 7 7"
              refX="6"
              refY="3.5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M0 0L7 3.5L0 7Z" fill="#b68c39" />
            </marker>
          </defs>
          {render}
        </svg>
      </div>
      <div className="ipx-ledger" aria-live="off" data-net-charge={frame.charge}>
        {d.prediction && c !== 5 ? (
          <span>
            {c === 6 ? '1Fe + 5Fe³⁺' : say('先预测，再看去向', 'Predict, then trace the change')}
          </span>
        ) : (
          <>
            <span>Fe⁰ {fe0}</span>
            <span>Fe²⁺ {fe2}</span>
            <span>Fe³⁺ {fe3}</span>
          </>
        )}
        {!d.prediction &&
          d.shot !== 'acid' &&
          d.shot !== 'map' &&
          c !== 5 &&
          frame.creditCharge !== 0 && (
            <span>
              {say('在途份额', 'Credits in transit')} {Math.abs(frame.creditCharge)} e⁻
            </span>
          )}
        {d.shot === 'acid' && (
          <span>{say('净组成示意', 'Net composition')} · Mn 1 / O 4 / H 8</span>
        )}
      </div>
      {!film.watch && (
        <div className="ipx-controls">
          <Segments
            label={say('教材实验', 'Textbook experiment')}
            value={String(chapter)}
            options={modeNames}
            onChange={(v) => {
              setChapter(Number(v));
              setPreset(0);
              setView(Number(v) === 5 ? 'binding' : 'transfer');
            }}
          />
          <Segments
            label={say('物料条件', 'Material conditions')}
            value={String(preset)}
            options={recipeLabels.map((label, i) => ({ value: String(i), label }))}
            onChange={(v) => setPreset(Number(v))}
          />
          <Segments
            label={say('观察视图', 'Observation view')}
            value={view}
            options={[
              {
                value: c === 5 ? 'binding' : 'transfer',
                label: say('跟踪变化', 'Trace the change'),
              },
              ...(c === 4 ? [{ value: 'acid', label: say('氧氢净账', 'O/H net account') }] : []),
              ...([2, 4, 6].includes(c)
                ? [{ value: c === 2 ? 'iodine' : 'test', label: say('后续检验', 'Follow-up test') }]
                : []),
              { value: 'map', label: say('教材路径图', 'Textbook route map') },
            ]}
            onChange={(v) => setView(v as PracticalShot)}
          />
          <Range
            label={say('教学进度', 'Teaching progress')}
            value={progress}
            min={0}
            max={1}
            step={0.005}
            onChange={setProgress}
          />
          {[2, 4, 6].includes(c) && (
            <Segments
              label={say('检验试剂', 'Test reagent')}
              value={test ? 'on' : 'off'}
              options={[
                { value: 'off', label: say('未加入', 'Not added') },
                { value: 'on', label: say('加入', 'Added') },
              ]}
              onChange={(v) => setTest(v === 'on')}
            />
          )}
        </div>
      )}
      <details className="ipx-limits">
        <summary>{say('模型与证据边界', 'Model and evidence limits')}</summary>
        <p>
          {say(
            '每章是新的独立样品。连线记录净电子份额，不是水中自由电子的轨迹；路径图记录教材中的反应，不是能量图或任意反应的可行性求解器。',
            'Each chapter is a fresh sample. The rail assigns net electron credits; it is not a path of free electrons in water. The map records textbook reactions, not energy or a general reaction-feasibility solver.',
          )}
        </p>
        <p>
          {say(
            '高锰酸根只显示酸性条件下生成Mn²⁺的净分支，氧氢路径不是逐步机理。显色是定性线索，省略Fe²⁺配位及完整的碘/淀粉与硫氰酸根平衡。',
            'Permanganate uses the acidic Mn²⁺ net branch; O/H paths are not elementary mechanisms. Colours are qualitative. Fe²⁺ coordination and full iodine/starch and thiocyanate speciation are omitted.',
          )}
        </p>
        <p>{IRON_PRACTICAL_EQUATIONS[IRON_PRACTICAL_CASES[c]!]}</p>
        <p>
          {say(
            '教学物料份数并非教材试剂用量，进度不是实测速率。',
            'Teaching amounts are not textbook reagent doses; progress is not a measured rate.',
          )}
        </p>
      </details>
    </section>
  );
}
