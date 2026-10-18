import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  copperEtching,
  copperEtchDirector,
  copperProtected,
  COPPER_TRACE,
} from '../../models/chem-copper-etching';
import '../../styles/chem-copper-etching.css';
export default function ChemCopperEtching() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [extent, setExtent] = useState(0.6),
    [ferric, setFerric] = useState(2),
    [mask, setMask] = useState(true),
    [view, setView] = useState('section');
  const d = film.watch
    ? copperEtchDirector(film.chapter, film.chapterProgress)
    : {
        extent,
        ferric,
        mask,
        maskVisible: view !== 'final',
        section: view === 'section',
        account: false,
        progress: extent,
      };
  const m = copperEtching(d.extent, d.ferric, d.mask);
  const section = (mobile: boolean) => {
    const w = mobile ? 320 : 680,
      x = 20,
      y = 170,
      cw = (w - 40) / 40,
      depth = 36 * (1 - m.depth);
    return (
      <svg
        className={mobile ? 'chem-etch-mobile' : 'chem-etch-desktop'}
        viewBox={`0 0 ${w} 280`}
        role="img"
        aria-label={say(
          '保护层下铜箔保留，裸露铜箔厚度减少的剖面',
          'Cross section: copper remains beneath the mask as exposed foil becomes thinner',
        )}
      >
        <rect x={x} y={y + 36} width={w - 40} height="34" rx="3" fill="#b8bc98" />
        {Array.from({ length: 40 }, (_, i) => {
          const protectedCell = copperProtected(i + 0.5, 12.5, d.mask),
            h = protectedCell ? 36 : depth;
          return (
            <g key={i}>
              <rect x={x + i * cw} y={y + 36 - h} width={cw + 0.15} height={h} fill="#bb8158" />
              {protectedCell && d.maskVisible && (
                <rect x={x + i * cw} y={y - 10} width={cw + 0.15} height="10" fill="#586b60" />
              )}
            </g>
          );
        })}
        <path d={`M${x} 95H${w - x}`} stroke="#ceb87d" strokeWidth="2" opacity=".5" />
        {m.removed > 0 &&
          Array.from({ length: 8 }, (_, i) => {
            const xx = x + 10 + ((w - 60) * (i + 0.5)) / 8;
            if (copperProtected((xx - x) / cw, 12.5, d.mask)) return null;
            return (
              <g key={i}>
                <path
                  d={`M${xx} ${y + 36 - depth - 8}V${105 + (i % 2) * 15}`}
                  stroke="#7eaaa6"
                  opacity=".45"
                  strokeDasharray="3 5"
                />
                <circle cx={xx} cy={105 + (i % 2) * 15} r="6" fill="#80aaa6" />
              </g>
            );
          })}
        <text x={w / 2} y="50" textAnchor="middle" fontSize={mobile ? 20 : 26} fill="#7f744b">
          FeCl₃(aq)
        </text>
      </svg>
    );
  };
  const top = (
    <svg
      viewBox="0 0 440 290"
      className="chem-etch-top"
      role="img"
      aria-label={say(
        '同一覆铜板的保护图案与蚀刻后的铜线',
        'The same board with its resist pattern and resulting copper trace',
      )}
    >
      <rect x="15" y="15" width="410" height="250" rx="10" fill="#7f9a7c" />
      <path d="M15 255q0 10 10 10h390q10 0 10-10v10q0 10-10 10H25q-10 0-10-10Z" fill="#b7b58f" />
      {m.depth < 0.99999 ? (
        <rect x="20" y="20" width="400" height="240" fill="#bd885e" />
      ) : (
        d.mask && (
          <>
            <path
              d={COPPER_TRACE.map(
                (p, i) => `${i ? 'L' : 'M'}${20 + p[0] * 10} ${20 + p[1] * 10}`,
              ).join(' ')}
              stroke="#bd885e"
              strokeWidth="28"
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
            />
            {[COPPER_TRACE[0], COPPER_TRACE.at(-1)!].map((p, i) => (
              <circle key={i} cx={20 + p[0] * 10} cy={20 + p[1] * 10} r="26" fill="#bd885e" />
            ))}
          </>
        )
      )}
      {d.mask && d.maskVisible && (
        <>
          <path
            d={COPPER_TRACE.map(
              (p, i) => `${i ? 'L' : 'M'}${20 + p[0] * 10} ${20 + p[1] * 10}`,
            ).join(' ')}
            stroke="#53695e"
            strokeWidth="28"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
          {[COPPER_TRACE[0], COPPER_TRACE.at(-1)!].map((p, i) => (
            <circle key={i} cx={20 + p[0] * 10} cy={20 + p[1] * 10} r="26" fill="#53695e" />
          ))}
        </>
      )}
    </svg>
  );
  return (
    <section className="chem-copper-etching">
      {d.section ? (
        <>
          {section(false)}
          {section(true)}
          <div className="chem-etch-legend">
            <span>
              <i style={{ background: '#586b60' }} />
              {say('保护层', 'Resist')}
            </span>
            <span>
              <i style={{ background: '#bb8158' }} />
              Cu
            </span>
            <span>
              <i style={{ background: '#b8bc98' }} />
              {say('绝缘板', 'Insulator')}
            </span>
          </div>
        </>
      ) : (
        top
      )}
      {d.account ? (
        <div className="chem-etch-account">
          <div>
            <span>Cu → Cu²⁺</span>
            <strong>
              {m.removed.toFixed(2)} → {m.copperIon.toFixed(2)}
            </strong>
          </div>
          <div>
            <span>Fe³⁺ → Fe²⁺</span>
            <strong>
              {m.ferrous.toFixed(2)} → {m.ferrous.toFixed(2)}
            </strong>
          </div>
          <p>{say('相对物质的量 · 初始铜为1', 'Relative amounts · initial copper = 1')}</p>
        </div>
      ) : (
        <div className="chem-etch-equation">Cu + 2Fe³⁺ → Cu²⁺ + 2Fe²⁺</div>
      )}
      {!film.watch && (
        <div className="chem-etch-controls">
          <Segments
            label={say('观察面', 'View')}
            value={view}
            options={[
              { value: 'section', label: say('剖面', 'Section') },
              { value: 'top', label: say('保护图案', 'Resist') },
              { value: 'final', label: say('去掉保护层', 'Remove resist') },
            ]}
            onChange={setView}
          />
          <Segments
            label={say('保护条件', 'Mask condition')}
            value={mask ? 'mask' : 'none'}
            options={[
              { value: 'mask', label: say('保留图案', 'Pattern protected') },
              { value: 'none', label: say('无保护层', 'No resist') },
            ]}
            onChange={(v) => setMask(v === 'mask')}
          />
          <Range
            label={say('蚀刻完成比例', 'Etch extent')}
            value={extent}
            min={0}
            max={1}
            step={0.01}
            onChange={setExtent}
          />
          <Range
            label={say('可用Fe³⁺（初始铜为1）', 'Available Fe³⁺ (initial copper = 1)')}
            value={ferric}
            min={0}
            max={3}
            step={0.05}
            onChange={setFerric}
          />
          <p>
            {say('剩余铜', 'Remaining copper')}: {m.copperSolid.toFixed(3)} · Fe³⁺:{' '}
            {m.ferricLeft.toFixed(3)}
          </p>
          <p>
            {say(
              '理想垂直蚀刻；厚度放大，不计算真实速率、侧蚀或制造尺寸。',
              'Ideal vertical etching with exaggerated thickness; no rate, undercut or manufacturing dimensions are calculated.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
