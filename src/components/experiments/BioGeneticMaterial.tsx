import { useState } from 'react';
import { t, browserLocale } from '../../i18n';
const short = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  materialFilmState,
  griffithGroups,
  averyState,
  treatments,
  phageDnaPoint,
  phageCoatOffset,
  fractionPositions,
  colonyPositions,
  hersheyChaseEvidence,
  type Treatment,
  type Isotope,
} from '../../models/bio-genetic-material';
import '../../styles/bio-genetic-material.css';
type Mode =
  'controls' | 'recovery' | 'extract' | 'remove' | 'label' | 'entry' | 'separate' | 'progeny';
const modes: Mode[] = [
  'controls',
  'recovery',
  'extract',
  'remove',
  'label',
  'entry',
  'separate',
  'progeny',
];
const names = [
  '四组感染对照',
  '分离与继续培养',
  '提取物与转化',
  '选择性去除成分',
  '通过宿主标记噬菌体',
  '吸附与主要进入路径',
  '搅拌、离心与分布',
  '标记与子代',
];
const groupNames = ['R型活菌', 'S型活菌', '热致死S型', 'R活菌＋热致死S型'];
const groupShort = [
  ['活R型', 'Live R'],
  ['活S型', 'Live S'],
  ['死S型', 'Killed S'],
  ['活R＋死S', 'R + killed S'],
];
const treatmentNames = ['未加酶', '蛋白酶', 'RNA酶', '酯酶', 'DNA酶'];
const colors = { DNA: '#748ea9', protein: '#b38b66', RNA: '#a499b4', lipid: '#a9ae79' };
function Coccus({
  s = false,
  killed = false,
  capsule = 1,
}: {
  s?: boolean;
  killed?: boolean;
  capsule?: number;
}) {
  return (
    <g opacity={killed ? 0.48 : 1}>
      <ellipse rx="17" ry="12" fill="#c7cfb5" stroke="#899978" />
      {s && (
        <ellipse rx="23" ry="17" fill="none" stroke="#cdb991" strokeWidth="5" opacity={capsule} />
      )}
      <path d="M0 -11V11" stroke="#869477" />
      {killed && <path d="M-10 -8L10 8M-10 8L10 -8" stroke="#797365" strokeWidth="2" />}
    </g>
  );
}
function Mouse({ alive }: { alive: boolean }) {
  return (
    <g fill="#d1c5bd" stroke="#a49a92" strokeWidth="1.5">
      <path d="M-34 4C-64 3 -60 28 -82 22" fill="none" />
      <ellipse rx="38" ry="23" />
      <ellipse cx="35" cy="-5" rx="23" ry="17" />
      <circle cx="29" cy="-20" r="10" />
      <circle cx="47" cy="-8" r="2" fill="#655f57" />
      <path d={alive ? 'M-16 20L-25 25M17 20L12 26' : 'M-16 20L-25 22M17 20L12 23'} fill="none" />
    </g>
  );
}
function Coat({ color = '#b38b66' }: { color?: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round">
      <path d="M0 -70L22 -55V-28L0 -13L-22 -28V-55Z" fill={`${color}18`} />
      <path d="M0 -13V30M-6 -11V23M6 -11V23M-10 24H10M-5 25L-24 39L-31 54M5 25L24 39L31 54M0 30V57" />
    </g>
  );
}
function Griffith({ recovery, p, selected }: { recovery: boolean; p: number; selected: number }) {
  const group = griffithGroups[selected];
  return recovery ? (
    <div className="bio-material-recovery">
      <svg viewBox="0 0 350 230" role="img" aria-label={t('从混合组回收的S型活菌继续产生S型后代')}>
        <ellipse
          cx="175"
          cy="125"
          rx="145"
          ry="86"
          fill="#f1edde"
          stroke="#c5bba5"
          strokeWidth="3"
        />
        {colonyPositions().map((c) => (
          <g
            key={c.id}
            transform={`translate(${c.x} ${c.y}) scale(${ease(ramp(p, 0.15 + c.id * 0.035, 0.45 + c.id * 0.035)) * 0.75})`}
          >
            <Coccus s />
          </g>
        ))}
        <path d="M30 32H116" stroke="#c5bba5" strokeWidth="2" />
        <g transform="translate(30 32) scale(.7)">
          <Coccus s />
        </g>
      </svg>
      <p>{short('回收活S → 培养 → S型后代', 'Live S → culture → S descendants')}</p>
      <p className="bio-material-note">
        {short('性状可遗传，成分仍待检验。', 'Heritable; chemical identity unresolved.')}
      </p>
    </div>
  ) : (
    <>
      <div className="bio-material-groups">
        {griffithGroups.map((g, i) => (
          <div key={g.id} className={selected === i ? 'is-current' : ''}>
            <p>{short(...(groupShort[i] as [string, string]))}</p>
            <svg viewBox="0 0 150 105" aria-hidden="true">
              <g transform="translate(75 23) scale(.63)">
                {g.liveR && (
                  <g transform={`translate(${g.killedS ? -36 : 0} 0)`}>
                    <Coccus />
                  </g>
                )}
                {(g.liveS || g.killedS) && (
                  <g transform={`translate(${g.liveR ? 36 : 0} 0)`}>
                    <Coccus s killed={g.killedS} />
                  </g>
                )}
              </g>
              <g transform="translate(80 77) scale(.65)">
                <Mouse alive={g.mouseSurvives} />
              </g>
            </svg>
            <strong>{t(g.mouseSurvives ? '小鼠存活' : '小鼠死亡')}</strong>
          </div>
        ))}
      </div>
      <p className="bio-material-note">
        {t(group.recoveredS ? '这一组可分离出S型活菌。' : '这一组不支持活S型的出现。')}
      </p>
    </>
  );
}
function Molecule({ id, broken }: { id: keyof typeof colors; broken: number }) {
  const c = colors[id];
  return (
    <g stroke={c} strokeWidth="4" fill="none" strokeLinecap="round">
      {[0, 1, 2].map((i) => (
        <g
          key={i}
          transform={`translate(${(i - 1) * broken * 11} ${i === 1 ? broken * 9 : -broken * 3})`}
        >
          <path
            d={
              id === 'protein'
                ? `M${-29 + i * 20} 0q-7 -18 5 -13q17 6 10 19`
                : id === 'lipid'
                  ? `M${-26 + i * 22} -12V15m7 -27V15`
                  : `M${-30 + i * 20} 2q5 -18 10 0t10 0`
            }
          />
        </g>
      ))}
    </g>
  );
}
function Avery({
  treatment,
  p,
  recipient,
}: {
  treatment: Treatment;
  p: number;
  recipient: boolean;
}) {
  const s = averyState(treatment, recipient);
  const develop = ease(ramp(p, 0.45, 0.9));
  return (
    <>
      <p className="bio-material-result">{t(treatmentNames[treatments.indexOf(treatment)])}</p>
      <div className="bio-material-molecules">
        {s.components.map((c) => (
          <div key={c.id}>
            <svg viewBox="0 0 92 72" aria-hidden="true">
              <g transform="translate(46 31)">
                <Molecule id={c.id} broken={c.intact ? 0 : ease(ramp(p, 0.05, 0.4))} />
              </g>
            </svg>
            <span>{c.id === 'protein' ? t('蛋白质') : c.id === 'lipid' ? t('脂质') : c.id}</span>
          </div>
        ))}
      </div>
      <svg
        className="bio-material-culture"
        viewBox="0 0 350 190"
        role="img"
        aria-label={t('选择性处理提取物后观察受体培养物')}
      >
        <path d="M165 9L175 24L185 9" fill="none" stroke="#b0ab91" strokeWidth="2" />
        <ellipse
          cx="175"
          cy="110"
          rx="139"
          ry="67"
          fill="#f3eddb"
          stroke="#c4b995"
          strokeWidth="2"
        />
        {recipient &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <g
              key={i}
              transform={`translate(${100 + (i % 3) * 75} ${88 + Math.floor(i / 3) * 43}) scale(.8)`}
            >
              <Coccus s={s.transformed && i % 2 === 0} capsule={develop} />
            </g>
          ))}
      </svg>
      <p className="bio-material-result">
        {t(
          !recipient
            ? '无R型受体，不能据此观察转化'
            : p < 0.45
              ? '处理同一来源的提取物'
              : s.transformed
                ? 'R型与S型同时出现'
                : '只出现R型',
        )}
      </p>
    </>
  );
}
function Interface({ p, detach, isotope }: { p: number; detach: number; isotope: Isotope }) {
  const shift = phageCoatOffset(detach);
  const points = Array.from({ length: 24 }, (_, i) => phageDnaPoint(i, p));
  return (
    <svg
      className="bio-material-interface"
      viewBox="0 0 350 300"
      role="img"
      aria-label={t('放大的噬菌体尾部与宿主界面，追踪DNA进入而外壳留在外侧')}
    >
      <path d="M15 200Q175 180 335 200V300H15Z" fill="#dbe0c6" />
      <path
        d="M15 200Q175 180 335 200M15 207Q175 187 335 207"
        fill="none"
        stroke="#9ea781"
        strokeWidth="3"
      />
      <path d="M169 190H181V204H169Z" fill="#dbe0c6" />
      <g transform={`translate(${175 + shift.x} ${133 + shift.y})`}>
        <Coat color={isotope === 'sulfur' ? '#b38b66' : '#aca99c'} />
        {isotope === 'sulfur' && (
          <path d="M-22 -55L-16 -61L-10 -55L-16 -49Z" fill="#b38b66" stroke="#faf5e9" />
        )}
      </g>
      <polyline
        points={points.map((v) => `${v.x},${v.y}`).join(' ')}
        fill="none"
        stroke={isotope === 'phosphorus' ? '#748ea9' : '#aaa998'}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {isotope === 'phosphorus' && (
        <circle
          cx={points[10].x}
          cy={points[10].y}
          r="6"
          fill="#748ea9"
          stroke="#f8f3e8"
          strokeWidth="2"
        />
      )}
      <text x="22" y="45" fontSize="24" fill="#757865">
        {isotope === 'sulfur' ? '³⁵S' : '³²P'}
      </text>
    </svg>
  );
}
function Fraction({ p, blended, isotope }: { p: number; blended: boolean; isotope: Isotope }) {
  const state = fractionPositions(p, blended);
  return (
    <div className="bio-material-fraction">
      <svg
        viewBox="0 0 350 295"
        role="img"
        aria-label={
          blended
            ? t('同一批细菌沉降至管底，脱落外壳主要留在上清液')
            : short(
                '省略搅拌的新样品：附着外壳随细菌沉降，沉淀信号混合。',
                'Fresh unblended sample: attached coats settle with bacteria, leaving a mixed pellet signal.',
              )
        }
      >
        <path
          d="M92 27V238Q92 280 175 280Q258 280 258 238V27"
          fill="#e9efe3"
          stroke="#b0b9aa"
          strokeWidth="3"
        />
        <path d="M94 52H256" stroke="#bdc9b6" strokeWidth="2" />
        <path
          d="M114 259Q175 290 236 259"
          fill="none"
          stroke="#b2b68d"
          strokeWidth={ease(p) * 13}
        />
        {state.cells.map((c) => (
          <g key={c.id} transform={`translate(${c.x} ${c.y})`}>
            <rect x="-16" y="-7" width="32" height="14" rx="7" fill="#cad4b3" stroke="#929f7c" />
            <path
              d="M-9 1q4 -7 8 0t9 0"
              fill="none"
              stroke={isotope === 'phosphorus' ? '#748ea9' : '#a3ab91'}
              strokeWidth="2"
            />
          </g>
        ))}
        {state.coats.map((c) => (
          <g key={c.id} transform={`translate(${c.x} ${c.y}) scale(.14)`}>
            <Coat color={isotope === 'sulfur' ? '#b38b66' : '#aaa99e'} />
          </g>
        ))}
        <text x="275" y="80" fontSize="27" fill="#757865">
          {isotope === 'sulfur' ? '³⁵S' : '³²P'}
        </text>
      </svg>
      <div className="bio-material-fraction-key">
        <span>
          {t('上清液')} ·{' '}
          {p < 0.98
            ? short('分离中', 'Separating')
            : t(blended ? (isotope === 'sulfur' ? '信号较高' : '信号较低') : '外壳尚未充分分离')}
        </span>
        <span>
          {t('沉淀物')} ·{' '}
          {p < 0.98
            ? short('分离中', 'Separating')
            : t(
                blended ? (isotope === 'phosphorus' ? '信号较高' : '信号较低') : '混合信号难以解释',
              )}
        </span>
      </div>
    </div>
  );
}
export default function BioGeneticMaterial() {
  const film = useShowcase();
  const [chosen, setChosen] = useState<Mode | null>(null);
  type Settings = {
    p: number;
    group: number;
    treatment: Treatment;
    recipient: boolean;
    isotope: Isotope;
    blended: boolean;
  };
  const [manual, setManual] = useState<Partial<Record<Mode, Partial<Settings>>>>({});
  const directedMode = modes[Math.min(7, film.chapter)];
  const mode = film.watch ? directedMode : (chosen ?? directedMode);
  const inherits = mode === directedMode;
  const d = materialFilmState(
    modes.indexOf(mode),
    inherits ? film.chapterTime : 0,
    browserLocale(),
  );
  const defaults: Settings = {
    p: inherits
      ? mode === 'separate'
        ? d.phase === 'detachment'
          ? d.p * 0.38
          : 0.38 + d.p * 0.62
        : d.p
      : 0.85,
    group: inherits ? d.selected : 3,
    treatment: inherits ? d.treatment : mode === 'remove' ? 'dnase' : 'none',
    recipient: true,
    isotope: inherits ? d.isotope : 'sulfur',
    blended: inherits ? d.blended : true,
  };
  const active = film.watch ? defaults : { ...defaults, ...manual[mode] };
  const update = (patch: Partial<Settings>) =>
    setManual((old) => ({ ...old, [mode]: { ...old[mode], ...patch } }));
  const { p, group: selected, treatment: tr, recipient, isotope: iso, blended } = active;
  const separationPhase = film.watch ? d.phase : p < 0.38 ? 'detachment' : 'fractions';
  const separationP = film.watch
    ? d.p
    : separationPhase === 'detachment'
      ? p / 0.38
      : (p - 0.38) / 0.62;
  return (
    <div
      className="bio-genetic-material bgm18"
      data-watch={film.watch}
      data-mode={mode}
      data-isotope={iso}
      data-progress={p}
      data-treatment={tr}
      data-blended={blended}
    >
      <p className="bio-material-kind">{t('经典研究重建；器物与细胞示意不按同一比例。')}</p>
      {mode === 'controls' || mode === 'recovery' ? (
        <Griffith recovery={mode === 'recovery'} p={p} selected={selected} />
      ) : mode === 'extract' || mode === 'remove' ? (
        <Avery treatment={tr} p={p} recipient={recipient} />
      ) : mode === 'label' ? (
        <div className="bio-material-label">
          <div className="bio-material-host">
            <svg viewBox="0 0 350 145" aria-hidden="true">
              <path
                d="M35 40H278A34 34 0 0 1 278 108H35A34 34 0 0 1 35 40"
                fill="#d8dec2"
                stroke="#9ba77f"
                strokeWidth="2"
              />
              {Array.from({ length: 8 }, (_, i) => (
                <circle
                  key={i}
                  cx={42 + i * 36}
                  cy={74 + Math.sin(i) * 18}
                  r="5"
                  fill={iso === 'sulfur' ? '#b38b66' : '#748ea9'}
                />
              ))}
            </svg>
            <p>{short('带标记宿主', 'Labeled host')}</p>
          </div>
          <div className="bio-material-labeled-phage">
            <svg viewBox="0 0 150 150" aria-hidden="true">
              <g transform="translate(75 78)">
                <Coat color={iso === 'sulfur' ? '#b38b66' : '#aaa99e'} />
                <path
                  d="M-9 -50q10 -16 18 0t-18 9t18 9"
                  fill="none"
                  stroke={iso === 'phosphorus' ? '#748ea9' : '#aaa99e'}
                  strokeWidth="3"
                />
              </g>
            </svg>
            <p>{iso === 'sulfur' ? '³⁵S · ' + t('蛋白质外壳') : '³²P · DNA'}</p>
          </div>
          <p className="bio-material-note">
            {short('两批独立培养，再感染新宿主。', 'Separate batches; fresh hosts next.')}
          </p>
        </div>
      ) : mode === 'entry' ? (
        <>
          <Interface p={p} detach={0} isotope={iso} />
          <p className="bio-material-note">
            {short('主要路径的解释模型。', 'Model of the dominant pathway.')}
          </p>
        </>
      ) : mode === 'separate' ? (
        <>
          <div className="bio-material-separation">
            {separationPhase === 'detachment' ? (
              <Interface p={1} detach={blended ? separationP : 0} isotope={iso} />
            ) : (
              <Fraction p={separationP} blended={blended} isotope={iso} />
            )}
          </div>
          <p className="bio-material-note">
            {short(
              !blended
                ? '新样品：省略搅拌。'
                : separationPhase === 'detachment'
                  ? '先把外壳分开。'
                  : '分离后，分别检测。',
              !blended
                ? 'Fresh sample: no blending.'
                : separationPhase === 'detachment'
                  ? 'Detach the coats first.'
                  : 'Separate, then assay each fraction.',
            )}
          </p>
        </>
      ) : (
        <div className="bio-material-progeny">
          <div className="bio-material-children">
            <svg viewBox="0 0 350 160" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <g key={i} transform={`translate(${58 + i * 78} 83) scale(.64)`}>
                  <Coat color="#aaa99e" />
                  <path
                    d="M-9 -50q10 -16 18 0t-18 9t18 9"
                    fill="none"
                    stroke="#aaa99e"
                    strokeWidth="3"
                  />
                </g>
              ))}
            </svg>
            <p>{short('子代培养物', 'Progeny culture')}</p>
          </div>
          <div
            className="bio-material-evidence"
            style={{ visibility: film.watch && !d.reveal ? 'hidden' : 'visible' }}
          >
            <strong>
              {iso === 'sulfur' ? '³⁵S' : '³²P'} {hersheyChaseEvidence[iso].progeny.operator}{' '}
              {hersheyChaseEvidence[iso].progeny.parentalFraction * 100}%
            </strong>
            <span>{short('分母：亲代总放射性', 'Denominator: parental radioactivity')}</span>
          </div>
          <p className="bio-material-note">
            {short('T2证据，不外推到全部病毒。', 'Evidence for T2, not all viruses.')}
          </p>
        </div>
      )}
      {!film.watch && (
        <div className="bio-material-controls">
          <label>
            {t('观察证据')}
            <select value={mode} onChange={(e) => setChosen(e.target.value as Mode)}>
              {modes.map((m, i) => (
                <option key={m} value={m}>
                  {t(names[i])}
                </option>
              ))}
            </select>
          </label>
          {mode === 'controls' ? (
            <Segments
              label={t('感染组合')}
              value={String(selected)}
              onChange={(v) => update({ group: Number(v) })}
              options={groupNames.map((name, i) => ({ value: String(i), label: t(name) }))}
            />
          ) : null}
          {(mode === 'extract' || mode === 'remove') && (
            <>
              <Segments
                label={t('提取物处理')}
                value={tr}
                onChange={(v) => update({ treatment: v as Treatment })}
                options={treatments.map((v, i) => ({ value: v, label: t(treatmentNames[i]) }))}
              />
              <button onClick={() => update({ recipient: !recipient })}>
                {t(recipient ? 'R型活受体：有' : 'R型活受体：无')}
              </button>
            </>
          )}
          {['label', 'entry', 'separate', 'progeny'].includes(mode) && (
            <Segments
              label={t('同位素批次')}
              value={iso}
              onChange={(v) => update({ isotope: v as Isotope })}
              options={[
                { value: 'sulfur', label: '³⁵S' },
                { value: 'phosphorus', label: '³²P' },
              ]}
            />
          )}{' '}
          {mode === 'separate' && (
            <button onClick={() => update({ blended: !blended })}>
              {t(blended ? '搅拌：完成' : '搅拌：省略')}
            </button>
          )}
          {['recovery', 'extract', 'remove', 'entry', 'separate'].includes(mode) && (
            <Range
              label={t('过程进度')}
              min={0}
              max={1}
              step={0.01}
              value={p}
              onChange={(v) => update({ p: v })}
            />
          )}
        </div>
      )}
    </div>
  );
}
