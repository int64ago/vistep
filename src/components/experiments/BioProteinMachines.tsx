import { useState } from 'react';
import { t, browserLocale } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  insulinGeometry,
  insulinSidechains,
  insulinDisulfides,
  disulfideEdges,
  peptideAccounting,
  peptideNet,
  sequenceStrip,
  sequenceCandidate,
  connectivityState,
  insulinFunctionReport,
  proteinDirector,
  proteinChapters,
  proteinProjection,
} from '../../models/bio-protein-machines';
import '../../styles/bio-protein-machines.css';
const colors = { A: '#668f7d', B: '#9a7ca3', sulfur: '#b78b35' };
const path = (ps: { x: number; y: number }[]) =>
  ps.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
function Note({ children }: { children: React.ReactNode }) {
  return <p className="bpm9-note">{children}</p>;
}
function NetComposition({ progress }: { progress: number }) {
  const s = peptideNet(progress),
    at = (id: string) => s.atoms.find((a) => a.id === id)!;
  return (
    <div className="bpm9-net">
      <div className="bpm9-kicker">{t('净组成示意')}</div>
      <svg viewBox="0 0 300 185" aria-label={t('同一组原子')} role="img">
        <path
          d={`M45 115H82M${at('amino-N').x + 16} 115H${at('amino-N').x + 53}`}
          fill="none"
          stroke="#93a295"
          strokeWidth="3"
        />
        <text x="30" y="122" textAnchor="middle">
          R
        </text>
        <text x={at('amino-N').x + 66} y="122" textAnchor="middle">
          R′
        </text>
        {s.bonds.map((b) => {
          const a = at(b.from),
            z = at(b.to),
            dx = z.x - a.x,
            dy = z.y - a.y,
            n = Math.hypot(dx, dy) || 1,
            ux = dx / n,
            uy = dy / n;
          return (
            <g key={b.from + b.to} opacity={b.opacity} data-bond={b.from + '-' + b.to}>
              {Array.from({ length: b.order }, (_, i) => (
                <path
                  key={i}
                  d={`M${a.x + ux * 15 - uy * (i ? 3 : -3) * (b.order === 2 ? 1 : 0)} ${a.y + uy * 15 + ux * (i ? 3 : -3) * (b.order === 2 ? 1 : 0)}L${z.x - ux * 15 - uy * (i ? 3 : -3) * (b.order === 2 ? 1 : 0)} ${z.y - uy * 15 + ux * (i ? 3 : -3) * (b.order === 2 ? 1 : 0)}`}
                  fill="none"
                  stroke={b.from === 'carbonyl-C' && b.to === 'amino-N' ? '#b78b35' : '#87998c'}
                  strokeWidth={b.from === 'carbonyl-C' && b.to === 'amino-N' ? 5 : 2.5}
                />
              ))}
            </g>
          );
        })}
        {s.atoms.map((a) => (
          <g key={a.id} data-atom-id={a.id} data-element={a.element}>
            <circle
              cx={a.x}
              cy={a.y}
              r="14"
              fill={
                a.id === 'carboxyl-O' || a.id === 'carboxyl-H' || a.id === 'amino-H'
                  ? '#f4e3ca'
                  : '#f1f2e9'
              }
            />
            <text
              x={a.x}
              y={a.y + 7}
              textAnchor="middle"
              fill={a.element === 'O' ? '#9e6154' : a.element === 'N' ? '#5b7691' : '#40594c'}
            >
              {a.element}
            </text>
          </g>
        ))}
      </svg>
      <Note>{progress > 0.98 ? <>C—N · {t('一个新肽键')} + H₂O</> : t('跟住一个氧和两个氢')}</Note>
    </div>
  );
}
function FiveChain({ joins }: { joins: number }) {
  const count = Math.min(4, Math.floor(joins * 4 + 0.001));
  return (
    <div className="bpm9-five">
      <div className="bpm9-kicker">{t('开放肽链')}</div>
      <svg viewBox="0 0 300 160" role="img" aria-label={t('五个残基，四个相邻接头')}>
        {Array.from({ length: 4 }, (_, i) => (
          <line
            key={i}
            x1={42 + i * 54}
            y1="78"
            x2={96 + i * 54}
            y2="78"
            stroke={i < count ? '#668f7d' : '#d3dace'}
            strokeWidth="6"
            data-peptide-edge={i}
          />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <g key={i}>
            <circle
              cx={42 + i * 54}
              cy="78"
              r="19"
              fill="#e7eee3"
              stroke="#668f7d"
              strokeWidth="2"
            />
            <text x={42 + i * 54} y="85" textAnchor="middle">
              {i + 1}
            </text>
          </g>
        ))}
        <path d="M42 110V120H258V110" fill="none" stroke="#a6b3a3" strokeWidth="2" />
      </svg>
      <Note>
        <b>{count === 4 ? '5 − 1 = 4' : `${count} / 4`}</b> {t('肽键')}
      </Note>
    </div>
  );
}
function Chains({ joins, swap }: { joins: number; swap: number }) {
  const a = peptideAccounting(51, 2),
    c = sequenceCandidate(swap > 0.5);
  return (
    <div className="bpm9-chains">
      {(['A', 'B'] as const).map((chain, j) => {
        const pts = sequenceStrip(chain, swap),
          base = sequenceStrip(chain, 0),
          n = pts.length - 1,
          lit = Math.min(n, Math.max(0, Math.round(joins * 49 - (j ? 20 : 0))));
        return (
          <div className="bpm9-chain-row" key={chain}>
            <div className="bpm9-chain-label">
              <strong style={{ color: colors[chain] }}>{chain}</strong>
              <span>
                {pts.length} {t('残基')} → <b>{lit}</b> {t('肽键')}
              </span>
            </div>
            <svg viewBox="0 0 300 86" role="img" aria-label={`${chain}: ${pts.length} / ${n}`}>
              {base.slice(1).map((p, i) => (
                <path
                  key={i}
                  d={path([base[i], p])}
                  stroke={i < lit ? colors[chain] : '#d9ded3'}
                  strokeWidth="3"
                  fill="none"
                  data-chain-edge={`${chain}-${i + 1}`}
                />
              ))}
              {pts.map((p) => (
                <circle
                  key={p.id}
                  data-residue-id={p.id}
                  data-slot={p.slot}
                  cx={p.x}
                  cy={p.y}
                  r={p.id === 'A2' || p.id === 'A3' ? 6 : 4.5}
                  fill={p.id === 'A2' ? '#d9a24a' : p.id === 'A3' ? '#7194ad' : colors[chain]}
                  stroke="#eef1e6"
                  strokeWidth="1.5"
                />
              ))}
              <text x="22" y="17">
                {chain}1
              </text>
              <text x={base.at(-1)!.x} y="84" textAnchor="middle">
                {chain}
                {pts.length}
              </text>
            </svg>
          </div>
        );
      })}
      {swap > 0 ? (
        <div className="bpm9-swap" data-candidate={c.id}>
          <div className="bpm9-swap-atoms">
            <span>{t('位置')} 2</span>
            <span>{t('位置')} 3</span>
            <b
              style={{ transform: `translateX(${swap * 100}%)`, color: '#956923' }}
              data-tracked-id="A2"
            >
              Ile
            </b>
            <b
              style={{ transform: `translateX(${-swap * 100}%)`, color: '#547a96' }}
              data-tracked-id="A3"
            >
              Val
            </b>
          </div>
          <Note>
            {t('只改排列')} · {t('活性待测')}
          </Note>
        </div>
      ) : (
        <Note>
          {Math.min(20, Math.round(joins * 49))} + {Math.max(0, Math.round(joins * 49) - 20)} ={' '}
          <b>{Math.min(a.peptideBonds, Math.round(joins * 49))}</b> {t('链内肽键')}
        </Note>
      )}
    </div>
  );
}
function Topology({ selected }: { selected: number }) {
  const p = (id: string) => ({
    x: 22 + ((Number(id.slice(1)) - 1) * 256) / (id[0] === 'A' ? 20 : 29),
    y: id[0] === 'A' ? 64 : 146,
  });
  const pair = insulinDisulfides[selected];
  return (
    <div className="bpm9-topology">
      <div className="bpm9-kicker">{t(selected === 0 ? '一处链内连接' : '两处跨链连接')}</div>
      <svg viewBox="0 0 300 184" role="img" aria-label={t('六个半胱氨酸，三处二硫键')}>
        {(['A', 'B'] as const).map((chain) => (
          <g key={chain}>
            <path
              d={`M22 ${chain === 'A' ? 64 : 146}H278`}
              stroke={colors[chain]}
              strokeWidth="5"
              fill="none"
            />
            {sequenceStrip(chain).map((a) => (
              <circle key={a.id} cx={p(a.id).x} cy={p(a.id).y} r="3.5" fill={colors[chain]} />
            ))}
          </g>
        ))}
        {insulinDisulfides.map(([from, to], i) => {
          const a = p(from),
            b = p(to);
          return (
            <g key={from} opacity={i === selected ? 1 : 0.2}>
              <path
                d={
                  i === 0
                    ? `M${a.x} ${a.y}C${a.x} 6 ${b.x} 6 ${b.x} ${b.y}`
                    : `M${a.x} ${a.y}Q${(a.x + b.x) / 2 + 10} 105 ${b.x} ${b.y}`
                }
                fill="none"
                stroke={colors.sulfur}
                strokeWidth={i === selected ? 5 : 3}
              />
              {[a, b].map((v, k) => (
                <circle
                  key={k}
                  cx={v.x}
                  cy={v.y}
                  r="7"
                  fill="#e5bc69"
                  stroke="#f7f6ed"
                  strokeWidth="2"
                />
              ))}
            </g>
          );
        })}
        <text x="7" y="47">
          A
        </text>
        <text x="7" y="177">
          B
        </text>
      </svg>
      <Note>
        <b>
          {pair[0]} — {pair[1]}
        </b>{' '}
        · S—S
      </Note>
    </div>
  );
}
function SulfurCloseup({ remove = false, hide = false }: { remove?: boolean; hide?: boolean }) {
  return <NativeProtein angle={-61} whole={0} remove={remove} hide={hide} />;
}
function NativeProtein({
  angle = 25,
  remove = false,
  hide = false,
  small = false,
  whole = 1,
}: {
  angle?: number;
  remove?: boolean;
  hide?: boolean;
  small?: boolean;
  whole?: number;
}) {
  const pts = insulinGeometry(1, angle),
    side = insulinSidechains(angle),
    edges = disulfideEdges(angle),
    state = connectivityState(remove);
  const camera = proteinProjection(angle, whole);
  const p = (a: { x: number; y: number }) => ({
    x: 150 + (a.x - camera.cx) * camera.scale,
    y: camera.y - (a.y - camera.cy) * camera.scale,
  });
  const detailIds = ['A7-CA', 'A7-CB', 'A7-SG', 'B7-CA', 'B7-CB', 'B7-SG'];
  return (
    <div
      className={`bpm9-native ${small ? 'bpm9-native-small' : ''}`}
      data-disulfides={state.disulfides}
    >
      {!small && (
        <div className="bpm9-kicker">
          {whole < 0.98 ? <>A7 — B7 · {t('侧链上的硫')}</> : <>2A3G · 2005 · {t('结构参照')}</>}
        </div>
      )}
      <svg viewBox="0 0 300 200" role="img" aria-label={t('牛胰岛素两条链的实测结构参照')}>
        {(['A', 'B'] as const).map((chain) => (
          <path
            key={chain}
            opacity={whole}
            d={path(pts.filter((a) => a.chain === chain).map(p))}
            fill="none"
            stroke={colors[chain]}
            strokeWidth="4.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {insulinDisulfides.flat().flatMap((id) =>
          [
            ['CA', 'CB'],
            ['CB', 'SG'],
          ].map(([f, z]) => {
            const a = side.find((v) => v.id === `${id}-${f}`)!,
              b = side.find((v) => v.id === `${id}-${z}`)!;
            return (
              <path
                key={id + f}
                opacity={id === 'A7' || id === 'B7' ? 1 : whole}
                d={path([p(a), p(b)])}
                fill="none"
                stroke={id[0] === 'A' ? colors.A : colors.B}
                strokeWidth="2.3"
              />
            );
          }),
        )}
        {!remove &&
          !hide &&
          edges.map((e) => (
            <path
              key={e.from.id}
              data-ss-bond={e.from.id}
              opacity={e.from.id === 'A7-SG' ? 1 : whole}
              d={path([p(e.from), p(e.to)])}
              fill="none"
              stroke={colors.sulfur}
              strokeWidth="4"
            />
          ))}
        {pts
          .toSorted((a, b) => a.z - b.z)
          .map((a) => (
            <circle
              key={a.id}
              data-residue-id={a.id}
              opacity={whole}
              cx={p(a).x}
              cy={p(a).y}
              r="2.6"
              fill={a.chain === 'A' ? '#89b29b' : '#b89cbb'}
            />
          ))}
        {side
          .filter((a) => a.atom === 'SG')
          .map((a) => (
            <circle key={a.id} cx={p(a).x} cy={p(a).y} r="3.5" opacity={whole} fill="#d6aa50" />
          ))}
        {(whole < 0.98 ? side : [])
          .filter((a) => detailIds.includes(a.id))
          .map((a) => (
            <g key={a.id} opacity={1 - whole} data-pdb-atom={a.id}>
              <circle
                cx={p(a).x}
                cy={p(a).y}
                r="16"
                fill={a.atom === 'SG' ? '#e3bb6b' : '#f0f2e8'}
                stroke={a.chain === 'A' ? colors.A : colors.B}
                strokeWidth="2"
              />
              <text x={p(a).x} y={p(a).y + 7} textAnchor="middle">
                {a.atom === 'SG' ? 'S' : a.atom === 'CA' ? 'Cα' : 'Cβ'}
              </text>
            </g>
          ))}
      </svg>
      {!small && (
        <Note>
          {whole < 0.98 ? (
            t('二硫键不是肽键')
          ) : (
            <>
              <b>49</b> {t('肽键')} · <b>{state.disulfides}</b> S—S
            </>
          )}
          {remove && <span className="bpm9-note-line">{t('只移除二硫键')}</span>}
        </Note>
      )}
    </div>
  );
}
function Evidence({ reveal, candidate }: { reveal: number; candidate: boolean }) {
  const report = insulinFunctionReport;
  return (
    <div className="bpm9-evidence" data-report-kind={report.recordKind}>
      <div className="bpm9-kicker">1965 · {t('小鼠生物测定')}</div>
      <div className="bpm9-evidence-rows">
        {[report.reference, report.synthetic].map((s, i) => (
          <div key={s.id} className="bpm9-evidence-row" data-sample-id={s.id}>
            <div className="bpm9-sample">
              <span className={`bpm9-vial bpm9-vial-${i}`} aria-hidden="true">
                <i />
              </span>
              <strong>{t(i ? '纯化全合成产物' : '天然参照')}</strong>
            </div>
            <svg className="bpm9-arrow" viewBox="0 0 36 20" aria-hidden="true">
              <path
                d="M3 10H30M24 4L30 10L24 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <div
              className={`bpm9-report-result ${reveal > i ? 'bpm9-revealed' : ''}`}
              data-result={reveal > i ? s.result : 'unrevealed'}
            >
              {reveal > i ? (
                <>
                  <span aria-hidden="true">✓</span>
                  {t('报告有活性')}
                </>
              ) : (
                <span>{t('独立测定')}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {candidate ? (
        <div className="bpm9-candidate" data-sample-id="candidate-swapped-A2-A3">
          <strong>{t('新序列候选')}</strong>
          <span className="bpm9-candidate-count">51 / 49</span>
          <span>{t('活性待测')}</span>
        </div>
      ) : (
        <div className="bpm9-result-relation">
          {reveal === 2 ? (
            <>
              <b>{t('活性相同')}</b>
              <span>{t('研究者记述')}</span>
            </>
          ) : (
            t('两份样品，分别取证')
          )}
        </div>
      )}
      <Note>{t('定性重构，非原始数值')}</Note>
    </div>
  );
}
export default function BioProteinMachines() {
  const f = useShowcase(),
    [selected, setSelected] = useState<string | null>(null),
    [net, setNet] = useState(1),
    [swapped, setSwapped] = useState(false),
    [angle, setAngle] = useState(25),
    [removed, setRemoved] = useState(false),
    [hidden, setHidden] = useState(false),
    [detail, setDetail] = useState(false),
    [candidate, setCandidate] = useState(false);
  const chapter = f.watch ? f.chapter : selected === null ? f.chapter : Number(selected),
    d = proteinDirector(chapter, f.chapterTime, browserLocale()),
    watch = f.watch;
  const shot = watch
    ? d.shot
    : chapter === 0
      ? 'net'
      : chapter === 1
        ? 'chains'
        : chapter === 2
          ? detail
            ? 'sulfur'
            : 'native'
          : 'evidence';
  return (
    <section
      className="bpm9"
      data-shot={shot}
      data-watch={watch}
      data-chapter={proteinChapters[chapter]}
    >
      <div className="bpm9-stage">
        {shot === 'net' ? (
          <NetComposition progress={watch ? d.net : net} />
        ) : shot === 'five' ? (
          <FiveChain joins={d.joins} />
        ) : shot === 'chains' ? (
          <Chains joins={watch ? d.joins : 1} swap={watch ? d.swap : swapped ? 1 : 0} />
        ) : shot === 'topology' ? (
          <Topology selected={d.selected} />
        ) : shot === 'sulfur' ? (
          <SulfurCloseup remove={!watch && removed} hide={!watch && hidden} />
        ) : shot === 'native' ? (
          <NativeProtein
            angle={watch ? -61 : angle}
            whole={watch ? d.fold : 1}
            remove={watch ? d.removed : removed}
            hide={!watch && hidden}
          />
        ) : (
          <Evidence reveal={watch ? d.reveal : 2} candidate={watch ? d.candidate : candidate} />
        )}
      </div>
      {!watch && (
        <div className="bpm9-controls">
          <Segments
            label={t('观察主题')}
            value={String(chapter)}
            onChange={setSelected}
            options={[
              { value: '0', label: t('原子账本') },
              { value: '1', label: t('两条链') },
              { value: '2', label: t('侧链连接') },
              { value: '3', label: t('功能证据') },
            ]}
          />
          {chapter === 0 && (
            <Range
              label={t('净组成进度')}
              value={net}
              min={0}
              max={1}
              step={0.01}
              onChange={setNet}
            />
          )}
          {chapter === 1 && (
            <button type="button" onClick={() => setSwapped(!swapped)} aria-pressed={swapped}>
              {t(swapped ? '还原原序列' : '只改排列')}
            </button>
          )}
          {chapter === 2 && (
            <>
              <Range
                label={t('观察角度')}
                value={angle}
                min={-180}
                max={180}
                unit="°"
                onChange={setAngle}
              />
              <div className="bpm9-options">
                <button type="button" aria-pressed={detail} onClick={() => setDetail(!detail)}>
                  {t(detail ? '返回完整结构' : '放大硫原子')}
                </button>
                <button type="button" aria-pressed={removed} onClick={() => setRemoved(!removed)}>
                  {t(removed ? '恢复二硫连接' : '只移除二硫键')}
                </button>
                <button type="button" aria-pressed={hidden} onClick={() => setHidden(!hidden)}>
                  {t(hidden ? '显示二硫键' : '隐藏二硫键')}
                </button>
              </div>
              <Note>{t('骨架参照；移除连接不模拟解折叠')}</Note>
            </>
          )}
          {chapter === 3 && (
            <button type="button" onClick={() => setCandidate(!candidate)} aria-pressed={candidate}>
              {t(candidate ? '回看历史结果' : '换成新序列候选')}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
