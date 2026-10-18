import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  meiosisState,
  meioticGametes,
  exchangeGeometry,
  fixedMeioticCells,
  fixedMeioticSelection,
  restoredPloidy,
  type MeiosisChromatid,
} from '../../models/bio-meiosis';
import '../../styles/bio-meiosis.css';
type Mode =
  'homologs' | 'exchange' | 'first' | 'second' | 'assortment' | 'fertilize' | 'fixed' | 'sutton';
const modes: Mode[] = [
  'homologs',
  'exchange',
  'first',
  'second',
  'assortment',
  'fertilize',
  'fixed',
  'sutton',
];
const names = [
  '复制与联会',
  '非姐妹片段互换',
  '第一次分裂',
  '第二次分裂',
  '比较独立分配',
  '受精恢复配套',
  '固定装片观察',
  '基因与染色体的平行关系',
];
const colors = ['#b58a91', '#829bb6'];
function Chromatid({ c, markers = false }: { c: MeiosisChromatid; markers?: boolean }) {
  const cut = 0.42;
  return (
    <g opacity={c.visibility}>
      <path
        d={`M${c.x + c.arm} ${c.y - c.length}L${c.x} ${c.y}L${c.x + c.arm * cut} ${c.y + c.length * cut}`}
        fill="none"
        stroke={colors[c.proximalOrigin]}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d={`M${c.x + c.arm * cut} ${c.y + c.length * cut}L${c.x + c.arm} ${c.y + c.length}`}
        fill="none"
        stroke={colors[c.distalOrigin]}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle cx={c.x} cy={c.y} r="2.9" fill="#6d6880" />
      {markers && (
        <path
          d={`M${c.x + c.arm * 0.7 - 4} ${c.y + c.length * 0.7}h8`}
          stroke="#f4eddd"
          strokeWidth="2"
        />
      )}
    </g>
  );
}
function Process({
  stage,
  crossover = true,
  orientation = 0,
  small = false,
}: {
  stage: number;
  crossover?: boolean;
  orientation?: 0 | 1;
  small?: boolean;
}) {
  const s = meiosisState(stage, crossover, orientation),
    cytoI = Math.max(0, Math.min(1, (s.first - 0.72) / 0.28)),
    cytoII = Math.max(0, Math.min(1, (s.second - 0.72) / 0.28));
  return (
    <g>
      <ellipse
        cx="175"
        cy="150"
        rx="148"
        ry="130"
        fill="#dedecb"
        stroke="#a7ad91"
        strokeWidth="2"
        opacity={1 - cytoI}
      />
      {[95, 255].map((x) => (
        <g key={x}>
          <ellipse
            cx={x}
            cy="150"
            rx="69"
            ry="123"
            fill="#dedecb"
            stroke="#a7ad91"
            strokeWidth="2"
            opacity={cytoI * (1 - cytoII)}
          />
          {[80, 220].map((y) => (
            <ellipse
              key={y}
              cx={x}
              cy={y}
              rx="62"
              ry="61"
              fill="#dedecb"
              stroke="#a7ad91"
              strokeWidth="2"
              opacity={cytoII}
            />
          ))}
        </g>
      ))}
      {!small &&
        s.chromatids.map((c) => (
          <g key={`sp-${c.id}`}>
            {c.sister === 0 && (
              <path
                d={`M${c.cell < 2 ? 30 : 320} 150L${c.x} ${c.y}`}
                stroke="#bbc2a5"
                strokeWidth="1.2"
                opacity={Math.max(0, Math.min(1, (stage - 1.2) * 3)) * (1 - s.secondAlignment)}
              />
            )}
            <path
              d={`M${c.cell < 2 ? 95 : 255} ${c.sister ? 272 : 28}L${c.x} ${c.y}`}
              stroke="#bbc2a5"
              strokeWidth="1.2"
              opacity={s.secondAlignment * (1 - cytoII)}
            />
          </g>
        ))}
      {s.chromatids.map((c) => (
        <Chromatid key={c.id} c={c} markers={!small} />
      ))}
    </g>
  );
}
function Gamete({ chromatids, gene = false }: { chromatids: MeiosisChromatid[]; gene?: boolean }) {
  return (
    <svg viewBox="0 0 90 95" aria-hidden="true">
      <ellipse cx="45" cy="47" rx="38" ry="40" fill="#dfe0cb" stroke="#abb293" />
      {chromatids.map((c, i) => (
        <g key={c.id}>
          {gene && i === 0 && (
            <text x="12" y="28" fontSize="18" fill={colors[c.homolog]}>
              {c.homolog ? 'd' : 'D'}
            </text>
          )}
          <Chromatid
            key={c.id}
            c={{ ...c, x: 32 + i * 26, y: 47, arm: 0, length: c.length * 0.8 }}
            markers
          />
        </g>
      ))}
    </svg>
  );
}
export default function BioMeiosis() {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(
      modes.includes(f.variant as Mode) ? (f.variant as Mode) : 'homologs',
    ),
    [progress, setProgress] = useState(0.7),
    [crossover, setCrossover] = useState(true),
    [orientation, setOrientation] = useState<0 | 1>(0),
    [selected, setSelected] = useState(2);
  const m = f.watch ? modes[Math.min(7, f.chapter)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.04, 0.9)) : progress,
    stage =
      m === 'homologs' ? p * 1.2 : m === 'first' ? 1.5 + p : m === 'second' ? 2.5 + p * 1.5 : 4,
    state = meiosisState(stage, f.watch || crossover, f.watch ? 0 : orientation),
    observed = fixedMeioticSelection(f.watch ? Math.min(11, Math.floor(p * 12)) : selected),
    ploidy = restoredPloidy(2, 2);
  return (
    <section className="bio-meiosis" data-watch={f.watch}>
      <p className="bio-meiosis-kind">{t(names[modes.indexOf(m)])}</p>
      {m === 'exchange' ? (
        <>
          <svg
            className="bio-meiosis-stage"
            viewBox="0 0 350 270"
            role="img"
            aria-label={t('四分体中仅两条非姐妹染色单体交换相应片段')}
          >
            <ellipse cx="175" cy="135" rx="112" ry="119" fill="#e0dfcf" stroke="#b0b598" />
            {exchangeGeometry(p).map((c) => (
              <g key={c.id}>
                <path
                  d={c.proximal}
                  fill="none"
                  stroke={colors[c.origin]}
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                {c.distal && (
                  <path
                    d={c.distal}
                    fill="none"
                    stroke={colors[c.origin]}
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                )}
                <circle cx={c.centromere.x} cy={c.centromere.y} r="4" fill="#756b82" />
                {c.distal && (
                  <path
                    d={`M${c.distalEndpoint.x - 5} ${c.distalEndpoint.y - 14}h10`}
                    stroke="#f2e9dc"
                    strokeWidth="2"
                  />
                )}
              </g>
            ))}
          </svg>
          <div className="bio-meiosis-key">
            <span>{t('另外两条染色单体保留原组合')}</span>
            <span>{t('两个远端片段保留身份并互换位置')}</span>
          </div>
        </>
      ) : m === 'assortment' ? (
        <div className="bio-meiosis-orientations">
          {([0, 1] as const).map((o) => (
            <div key={o}>
              <p>{t(o ? '第二对朝向交换' : '第一种朝向')}</p>
              <div className="bio-meiosis-gametes">
                {meioticGametes(false, o).map((g, i) => (
                  <Gamete key={i} chromatids={g} />
                ))}
              </div>
            </div>
          ))}
          <p className="bio-meiosis-note">
            {t('未发生互换时，一次分裂产生两种互补配子；比较两种朝向才得到四种可能组合。')}
          </p>
        </div>
      ) : m === 'fertilize' || m === 'sutton' ? (
        <>
          <div className="bio-meiosis-union">
            <div>
              <p>{t(m === 'sutton' ? '配子中只取同源对的一条' : '来自卵细胞的一套')}</p>
              <Gamete chromatids={meioticGametes(false, 0)[0]} gene={m === 'sutton'} />
              <strong>n = {ploidy.maternal}</strong>
            </div>
            <b>+</b>
            <div>
              <p>{t(m === 'sutton' ? '另一配子提供对应的一条' : '来自精子的一套')}</p>
              <Gamete chromatids={meioticGametes(false, 0)[2]} gene={m === 'sutton'} />
              <strong>n = {ploidy.paternal}</strong>
            </div>
          </div>
          <div className="bio-meiosis-zygote">
            <svg
              viewBox="0 0 300 160"
              role="img"
              aria-label={t('两套染色体汇合，受精卵恢复成对状态')}
            >
              <ellipse
                cx="150"
                cy="79"
                rx="125"
                ry="70"
                fill="#dedec9"
                stroke="#a6ae91"
                strokeWidth="2"
              />
              {[0, 2].flatMap((cell, j) =>
                meioticGametes(false, 0)[cell].map((c, i) => {
                  const x = 150 + (j ? 1 : -1) * (62 - 32 * p) + (i - 0.5) * 20,
                    y = 79 + (i - 0.5) * 26;
                  return (
                    <g key={c.id}>
                      <Chromatid c={{ ...c, x, y, arm: 0, length: c.length * 0.75 }} />
                      {m === 'sutton' && i === 0 && (
                        <text x={x - 12} y={y - 25} fill={colors[c.homolog]} fontSize="20">
                          {j ? 'd' : 'D'}
                        </text>
                      )}
                    </g>
                  );
                }),
              )}
            </svg>
            <strong>2n = {ploidy.total}</strong>
          </div>
          <p className="bio-meiosis-note">
            {t(
              m === 'sutton'
                ? '基因与染色体成对、分离和重组的平行关系支持假说，仍需实验检验。'
                : '染色体配套示意；不描绘精子穿膜或所有物种的前核膜融合。',
            )}
          </p>
        </>
      ) : m === 'fixed' ? (
        <>
          <div className="bio-meiosis-fixed">
            <svg
              className="bio-meiosis-field"
              viewBox="0 0 350 265"
              role="img"
              aria-label={t('装片细胞各自固定在不同阶段，观察位置移动而阶段不变')}
            >
              <rect width="350" height="265" rx="24" fill="#dfd5c9" />
              {fixedMeioticCells.map((c) => (
                <g key={c.id}>
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="34"
                    fill="#eadfd1"
                    stroke={observed.id === c.id ? '#957a91' : '#c6b7a7'}
                    strokeWidth={observed.id === c.id ? 2.5 : 1}
                  />
                  <g transform={`translate(${c.x - 175 * 0.17} ${c.y - 150 * 0.17}) scale(.17)`}>
                    <Process stage={c.stage} small crossover={false} />
                  </g>
                </g>
              ))}
            </svg>
            <svg
              className="bio-meiosis-fixed-detail"
              viewBox="0 0 350 310"
              role="img"
              aria-label={t('放大当前固定细胞，比较同源配对与姐妹分离')}
            >
              <Process stage={observed.stage} crossover={false} />
            </svg>
          </div>
          <p className="bio-meiosis-note">
            {t('当前固定位置')} {observed.id + 1} · {t('2n=4辨认模式图，非真实蝗虫显微照片。')}
          </p>
        </>
      ) : (
        <>
          <svg
            className="bio-meiosis-stage"
            viewBox="0 0 350 310"
            role="img"
            aria-label={t('同源染色体先分离，姐妹染色单体随后分离，每个配子各得一条同源染色体')}
          >
            <Process
              stage={stage}
              crossover={f.watch || crossover}
              orientation={f.watch ? 0 : orientation}
            />
          </svg>
          <div className="bio-meiosis-key">
            <span>{t('起始')} 2n = 4</span>
            <span>
              {t('当前细胞数')} {state.cellCount}
            </span>
            <span>
              {t('整个谱系DNA总量')} {state.totalDNAInC.toFixed(1)} C
            </span>
          </div>
        </>
      )}
      {!f.watch && (
        <div className="bio-meiosis-controls">
          <Segments
            label={t('观察对象')}
            value={mode}
            onChange={setMode}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          {m === 'fixed' ? (
            <Range
              label={t('观察细胞编号')}
              value={selected}
              min={0}
              max={11}
              step={1}
              onChange={setSelected}
            />
          ) : m !== 'assortment' ? (
            <Range
              label={t('过程进度')}
              value={progress}
              min={0}
              max={1}
              step={0.001}
              onChange={setProgress}
            />
          ) : null}{' '}
          {['homologs', 'first', 'second'].includes(m) && (
            <>
              {m !== 'homologs' && (
                <button
                  type="button"
                  aria-pressed={crossover}
                  onClick={() => setCrossover(!crossover)}
                >
                  {t(crossover ? '非姐妹互换：有' : '非姐妹互换：无')}
                </button>
              )}
              <button
                type="button"
                aria-pressed={orientation === 1}
                onClick={() => setOrientation(orientation === 0 ? 1 : 0)}
              >
                {t('改变第二对同源染色体的朝向')}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
