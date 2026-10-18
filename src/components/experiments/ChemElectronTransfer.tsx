import { useEffect, useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range, Segments } from '../lab/Controls';
import {
  bondDensity,
  electronFilm,
  ionicGeometry,
  ironCopperGeometry,
  electronClamp,
} from '../../models/chem-electron-transfer';
import '../../styles/chem-electron-transfer.css';
type Say = (zh: string, en: string) => string;
type View = 'local' | 'whole' | 'sharing' | 'predict';
function Ionic({
  width,
  progress,
  pairs,
  short,
  say,
  uid,
}: {
  width: number;
  progress: number;
  pairs: number;
  short: boolean;
  say: Say;
  uid: string;
}) {
  const g = ionicGeometry(width, progress, pairs, short),
    s = g.state;
  return (
    <>
      <p className="cet-kicker">
        {pairs === 1
          ? say('跟住金色的电子份额', 'Follow the gold electron unit')
          : say('两个氯，需要两份电子', 'Two Cl need two electrons')}
      </p>
      <svg
        viewBox={`0 0 ${width} ${g.height}`}
        role="img"
        aria-label={say(
          pairs === 1 ? '一对钠氯原子的八个价电子账本' : '两个钠和两个氯的十六个价电子账本',
          pairs === 1
            ? 'Eight valence electrons of a sodium–chlorine pair'
            : 'Sixteen valence electrons of two sodium and two chlorine atoms',
        )}
      >
        <defs>
          <radialGradient id={`${uid}-atom`}>
            <stop stopColor="#f4e9cd" />
            <stop offset="1" stopColor="#c1c9ad" />
          </radialGradient>
        </defs>
        {pairs === 2 && progress === 0 && (
          <g className="cet-origin">
            <path
              d={`M${g.rows[0].right} ${g.rows[0].y + 23}V${g.rows[1].y - 23}`}
              stroke="#829b85"
              strokeWidth="2"
            />
            <text x={width * 0.77} y="18" textAnchor="middle">
              Cl₂
            </text>
          </g>
        )}
        {g.rows.map((r) => (
          <g key={r.id} data-pair={r.id}>
            <path
              d={r.path}
              fill="none"
              stroke="#c5b487"
              strokeWidth="1.2"
              strokeDasharray="3 5"
              opacity=".65"
            />
            <circle cx={r.left} cy={r.y} r={g.compact ? 24 : 31} fill={`url(#${uid}-atom)`} />
            <circle cx={r.right} cy={r.y} r={g.compact ? 25 : 32} fill="#b6cbb6" />
            <circle
              cx={r.left}
              cy={r.y}
              r={r.radius}
              fill="none"
              stroke="#b7c2aa"
              strokeDasharray="2 5"
            />
            <circle cx={r.right} cy={r.y} r={r.radius} fill="none" stroke="#9db59e" />
            <text
              data-atom={`Na-${r.id}`}
              data-charge={r.sodiumCharge}
              x={r.left}
              y={r.y + 6}
              className="cet-atom-label"
              textAnchor="middle"
            >
              {r.sodiumCharge ? 'Na⁺' : 'Na'}
            </text>
            <text
              data-atom={`Cl-${r.id}`}
              data-charge={r.chlorineCharge}
              x={r.right}
              y={r.y + 6}
              className="cet-atom-label"
              textAnchor="middle"
            >
              {r.chlorineCharge ? 'Cl⁻' : 'Cl'}
            </text>
            {r.chlorine.map((e) => (
              <circle key={e.id} data-electron={e.id} cx={e.x} cy={e.y} r="3.5" fill="#628d79" />
            ))}
            <g
              data-electron={`Na-${r.id}-e`}
              data-allocation={r.phase}
              transform={`translate(${r.moving.x} ${r.moving.y})`}
            >
              <circle r="9" fill="none" stroke="#ac7a33" strokeWidth="1.5" />
              <circle r="4.5" fill="#b7863d" />
            </g>
            {r.phase === 'ledger' && (
              <text
                x={(r.left + r.right) / 2}
                y={r.y + (pairs === 2 ? 32 : 44)}
                textAnchor="middle"
                className="cet-ledger-label"
              >
                {say('记账转移', 'Allocation')}
              </text>
            )}
          </g>
        ))}
        {pairs === 1 && progress >= 1 && (
          <g opacity=".55" aria-hidden="true">
            <path
              d={`M${g.rows[0].left - 20} ${g.height - 30}h${width * 0.54 + 40}`}
              stroke="#91a591"
              strokeDasharray="2 6"
            />
            <text x={width / 2} y={g.height - 7} textAnchor="middle">
              {say('局部离子对 · 晶格继续延伸', 'Local pair · lattice continues')}
            </text>
          </g>
        )}
        {pairs === 2 && (
          <text x={width / 2} y={g.height - 7} textAnchor="middle" className="cet-equation">
            2Na + Cl₂ → 2NaCl
          </text>
        )}
      </svg>
      <div
        className="cet-account"
        data-valence-total={s.totalElectrons}
        data-net-charge={s.chargeIncludingLedger}
      >
        <span>
          {short ? 'e⁻' : say('追踪电子', 'Tracked e⁻')} <strong>{s.totalElectrons}</strong>
        </span>
        <span>
          {short ? say('账本电荷', 'Charge') : say('总账电荷', 'Account charge')}{' '}
          <strong>{s.chargeIncludingLedger}</strong>
        </span>
      </div>
      {s.ledgerElectrons > 0 && !short && (
        <p className="cet-footnote">
          {say('转移中的电子也计入总账', 'Moving units stay in the account')}
        </p>
      )}
    </>
  );
}
function Sharing({
  width,
  progress,
  formal,
  short,
  say,
}: {
  width: number;
  progress: number;
  formal: boolean;
  short: boolean;
  say: Say;
}) {
  const compact = width < 560,
    h = short ? 202 : compact ? 240 : 280,
    left = width * 0.3,
    right = width * 0.7,
    y = h * 0.38,
    centre = (left + right) / 2 + (right - left) * 0.14 * progress;
  return (
    <>
      <p className="cet-kicker">{say('共用电子对始终保留', 'The pair stays shared')}</p>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        role="img"
        aria-label={say(
          '氯化氢共用电子对偏向氯，形式分配层与分子分开',
          'The HCl shared pair favours chlorine; formal allocation is a separate layer',
        )}
      >
        {Array.from({ length: 61 }, (_, i) => {
          const x = i / 60,
            d = bondDensity(x, progress);
          return (
            <ellipse
              key={i}
              cx={left + x * (right - left)}
              cy={y}
              rx={compact ? 2.3 : 3.7}
              ry={12 + 27 * d}
              fill="#84ad99"
              opacity={0.06 + 0.17 * d}
            />
          );
        })}
        <circle cx={left} cy={y} r="23" fill="#dfd5b6" />
        <circle cx={right} cy={y} r="27" fill="#a9c3ab" />
        <text x={left} y={y + 6} textAnchor="middle" className="cet-atom-label">
          H
        </text>
        <text x={right} y={y + 6} textAnchor="middle" className="cet-atom-label">
          Cl
        </text>
        <g data-shared-pair="true">
          <circle data-electron="shared-H" cx={centre} cy={y - 6} r="4.5" fill="#b7863d" />
          <circle data-electron="shared-Cl" cx={centre} cy={y + 6} r="4.5" fill="#5a8676" />
        </g>
        {[-1, 0, 1].flatMap((j) =>
          [0, 1].map((k) => (
            <circle
              key={`${j}-${k}`}
              data-electron={`Cl-lone-${j}-${k}`}
              cx={right + Math.cos((j * Math.PI) / 2) * 38}
              cy={y + Math.sin((j * Math.PI) / 2) * 38 + (k - 0.5) * 9}
              r="3.3"
              fill="#668f79"
            />
          )),
        )}
        <text x={left} y={y - 40} textAnchor="middle">
          δ+
        </text>
        <text x={right} y={y - 47} textAnchor="middle">
          δ−
        </text>
        <text x={width / 2} y={y + 56} textAnchor="middle">
          {say('HCl 分子仍然中性', 'The HCl molecule stays neutral')}
        </text>
        {formal && (
          <g data-formal-allocation="true">
            <path d={`M${width * 0.12} ${h - 58}H${width * 0.88}`} stroke="#bac3a8" />
            <text x={width / 2} y={h - 36} textAnchor="middle">
              {say('氧化数记账', 'Oxidation-state account')}
            </text>
            <text x={left} y={h - 9} textAnchor="middle">
              H: +1
            </text>
            <text x={right} y={h - 9} textAnchor="middle">
              Cl: −1
            </text>
          </g>
        )}
      </svg>
      <div className="cet-account">
        <span>
          {say('共用电子', 'Shared e⁻')} <strong>2</strong>
        </span>
        <span>
          {say('追踪电子', 'Tracked e⁻')} <strong>8</strong>
        </span>
      </div>
    </>
  );
}
function Prediction({
  width,
  iron,
  copper,
  progress,
  short,
  reveal,
  say,
}: {
  width: number;
  iron: number;
  copper: number;
  progress: number;
  short: boolean;
  reveal: boolean;
  say: Say;
}) {
  const g = ironCopperGeometry(width, iron, copper, progress, short),
    s = g.state;
  return (
    <>
      <p className="cet-kicker">
        {!reveal
          ? say('1 Fe 能还原几个 Cu²⁺？', 'How many Cu²⁺ can 1 Fe reduce?')
          : iron === 0
            ? say('没有 Fe，无法供给电子', 'No Fe supplies electrons')
            : copper === 0
              ? say('没有 Cu²⁺ 可被还原', 'No Cu²⁺ is available')
              : iron === 1
                ? say('两份电子，只够一个 Cu²⁺', 'Two electron units reduce one Cu²⁺')
                : say('比较供给与需求', 'Compare supply and demand')}
      </p>
      <svg
        viewBox={`0 0 ${width} ${g.height}`}
        role="img"
        aria-label={say(
          '铁和铜的两电子净反应计量，过量铜离子保留',
          'Two-electron iron–copper net accounting with excess copper ions retained',
        )}
      >
        {g.atoms.map((a) => (
          <g key={a.id} data-atom={a.id} data-charge={a.charge}>
            <circle
              cx={a.x}
              cy={a.y}
              r="26"
              fill={
                a.kind === 'Fe'
                  ? a.charge
                    ? '#a9c5af'
                    : '#a4aaa0'
                  : a.charge
                    ? '#a6c8cd'
                    : '#c3926d'
              }
            />
            {a.id === 'Cu-0' && (
              <circle cx={a.x} cy={a.y} r="31" fill="none" stroke="#bd9b54" strokeWidth="1.6" />
            )}
            <text x={a.x} y={a.y + 6} textAnchor="middle" className="cet-atom-label">
              {a.kind}
              {a.charge ? '²⁺' : ''}
            </text>
          </g>
        ))}
        {!reveal && (
          <g data-prediction-premises="true">
            <text x={g.left} y={g.rowY[0] - 36} textAnchor="middle">
              0 → +2
            </text>
            <text x={g.right} y={g.rowY[0] - 36} textAnchor="middle">
              +2 → 0
            </text>
            <text x={g.left} y={g.rowY[0] + 43} textAnchor="middle">
              −2e⁻
            </text>
            <text x={g.right} y={g.rowY[0] + 43} textAnchor="middle">
              +2e⁻
            </text>
          </g>
        )}
        {reveal &&
          g.packets.map((p) => (
            <g key={p.id} data-packet={p.id} data-allocation={p.phase}>
              <path d={p.path} stroke="#bfaa7e" strokeDasharray="3 4" fill="none" />
              <g transform={`translate(${p.x} ${p.y})`}>
                <rect
                  x="-10"
                  y="-16"
                  width="20"
                  height="32"
                  rx="10"
                  fill="#f2e6c8"
                  stroke="#bd9651"
                />
                <circle data-electron={`Fe-${p.id}-e-0`} cy="-5" r="3.7" fill="#ad7831" />
                <circle data-electron={`Fe-${p.id}-e-1`} cy="5" r="3.7" fill="#ad7831" />
              </g>
              <text x={width / 2} y={g.rowY[p.id] + 38} textAnchor="middle">
                {say('2e⁻ 账本', '2e⁻ account')}
              </text>
            </g>
          ))}
        {s.initialCopper > s.copperMetal && progress >= 1 && !short && (
          <text x={g.right} y={g.rowY[s.copperMetal] + 45} textAnchor="middle">
            {say('仍留在水中', 'Still dissolved')}
          </text>
        )}
        <text x={width / 2} y={g.height - 7} textAnchor="middle">
          {s.sulfate} SO₄²⁻ · {say('不变', 'unchanged')}
        </text>
      </svg>
      <div className="cet-account" data-charge-total={s.chargeIncludingLedgerAndSulfate}>
        <span>
          {say('生成 Cu', 'Cu formed')} <strong>{s.copperMetal}</strong>
        </span>
        <span>
          {say('剩余 Cu²⁺', 'Cu²⁺ left')} <strong>{s.copperII}</strong>
        </span>
      </div>
    </>
  );
}
export default function ChemElectronTransfer() {
  const film = useShowcase(),
    { host, width: measuredWidth, compact } = useSignalWidth(),
    uid = useId().replace(/:/g, ''),
    en = browserLocale() === 'en',
    say: Say = (zh, enText) => (en ? enText : zh);
  const [shortViewport, setShortViewport] = useState(false),
    [view, setView] = useState<View>('local'),
    [progress, setProgress] = useState(0),
    [formal, setFormal] = useState(true),
    [iron, setIron] = useState(1),
    [copper, setCopper] = useState(2);
  useEffect(() => {
    const m = window.matchMedia('(max-height: 700px)');
    const change = () => setShortViewport(m.matches);
    change();
    m.addEventListener('change', change);
    return () => m.removeEventListener('change', change);
  }, []);
  const width = Math.min(measuredWidth, 800),
    short = compact && shortViewport,
    d = electronFilm(film.chapter, film.chapterTime, en ? 'en' : 'zh'),
    v = film.watch ? (['local', 'whole', 'sharing', 'predict'] as const)[d.chapter] : view,
    p = film.watch ? d.progress : progress;
  return (
    <section className="cet" data-watch={film.watch} data-short={short} ref={host}>
      {(v === 'local' || v === 'whole') && (
        <Ionic
          width={width}
          progress={p}
          pairs={v === 'whole' ? 2 : 1}
          short={short}
          say={say}
          uid={uid}
        />
      )}
      {v === 'sharing' && (
        <Sharing
          width={width}
          progress={p}
          formal={film.watch ? d.formal : formal}
          short={short}
          say={say}
        />
      )}
      {v === 'predict' && (
        <Prediction
          width={width}
          progress={p}
          iron={film.watch ? d.iron : iron}
          copper={film.watch ? d.copper : copper}
          reveal={film.watch ? d.predictReveal : p > 0 || iron !== 1 || copper !== 2}
          short={short}
          say={say}
        />
      )}
      {!film.watch && (
        <div className="cet-controls">
          <Segments
            label={say('电子图像', 'Electron picture')}
            value={view}
            onChange={setView}
            options={[
              { value: 'local', label: say('一对钠氯', 'One Na–Cl pair') },
              { value: 'whole', label: say('整个配比', 'Whole ratio') },
              { value: 'sharing', label: say('共价共享', 'Covalent sharing') },
              { value: 'predict', label: say('预测铜', 'Predict copper') },
            ]}
          />
          {v === 'sharing' && (
            <button type="button" aria-pressed={formal} onClick={() => setFormal(!formal)}>
              {say('形式分配层', 'Formal allocation layer')} ·{' '}
              {formal ? say('显示', 'Shown') : say('隐藏', 'Hidden')}
            </button>
          )}
          {v === 'predict' && (
            <>
              <Range
                label={say('Fe 份数', 'Fe units')}
                min={0}
                max={2}
                step={1}
                value={iron}
                onChange={setIron}
              />
              <Range
                label={say('Cu²⁺ 份数', 'Cu²⁺ units')}
                min={0}
                max={2}
                step={1}
                value={copper}
                onChange={setCopper}
              />
            </>
          )}
          <Range
            label={say('说明进度', 'Explanation progress')}
            min={0}
            max={1}
            step={0.01}
            value={electronClamp(progress)}
            onChange={setProgress}
          />
        </div>
      )}
      <details className="cet-details">
        <summary>{say('记账模型的边界', 'Limits of this account')}</summary>
        <p>
          {say(
            '圆点是可追踪的电子份额，不是经典轨道。转移中的份额计入账本，不表示可测得的自由电子池。HCl云只示意偏向，氧化数不是实际部分电荷。钠氯局部离子对属于延伸晶格；铁铜是教材净反应的近完全计量，没有模拟速率、活度或必经中间体。',
            'Dots are tracked electron units, not classical trajectories. Moving units remain in the account; they do not represent a measured free-electron pool. The HCl envelope only illustrates polarity; oxidation states are not physical partial charges. The NaCl pair belongs to an extended lattice. Iron–copper uses the textbook near-complete net account, with no rates, activities or mandatory intermediates.',
          )}
        </p>
      </details>
    </section>
  );
}
