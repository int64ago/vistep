import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  electronLedger,
  electronDirector,
  transferPosition,
  bondDensity,
  type ElectronBond,
} from '../../models/chem-electron-transfer';
import '../../styles/chem-electron-transfer.css';
export default function ChemElectronTransfer() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [bond, setBond] = useState<ElectronBond>('ionic'),
    [progress, setProgress] = useState(0.9),
    d = film.watch
      ? electronDirector(film.chapter, film.chapterProgress)
      : { bond, progress, formed: bond === 'polar' || progress > 0.85, ledger: true },
    s = electronLedger(d.bond, d.formed),
    moving = transferPosition(d.progress),
    polar = d.bond === 'polar';
  return (
    <section className="chem-electron-transfer" data-watch={film.watch}>
      <header>
        <p>
          {say(
            polar ? '共用电子对偏向氯，仍然是共价键' : '把同一个电子从出发处追到归属处',
            polar
              ? 'A shared pair favours chlorine but remains a covalent bond'
              : 'Follow the same electron from donor to recipient',
          )}
        </p>
        <span>
          {say('微观记账模型 · 非实验录像', 'Microscopic bookkeeping · Not experimental footage')}
        </span>
      </header>
      <div className="chem-electron-map">
        <svg
          viewBox="60 40 360 190"
          role="img"
          aria-label={say(
            polar
              ? '氯化氢的共用电子对偏向氯一侧，氧化数用规则分配'
              : '钠的一个价电子转移给氯，形成正负离子',
            polar
              ? 'The shared hydrogen-chlorine pair favours chlorine; oxidation states use allocation rules'
              : 'A tracked sodium valence electron is transferred to chlorine, forming opposite ions',
          )}
        >
          <defs>
            <radialGradient id={`${id}core`}>
              <stop stopColor="#eadbbb" />
              <stop offset="1" stopColor="#b6bea1" />
            </radialGradient>
          </defs>
          {polar &&
            Array.from({ length: 65 }, (_, i) => {
              const x = i / 64;
              return (
                <ellipse
                  key={i}
                  cx={155 + x * 175}
                  cy="135"
                  rx="3.5"
                  ry={18 + 37 * bondDensity(x, d.progress)}
                  fill="#a2bdab"
                  opacity={0.04 + 0.13 * bondDensity(x, d.progress)}
                />
              );
            })}
          <circle cx={polar ? 160 : 121} cy="135" r={polar ? 24 : 34} fill={`url(#${id}core)`} />
          <circle cx="340" cy="135" r="40" fill="#b0c2a7" />
          {!polar && (
            <>
              <circle cx="121" cy="135" r="52" stroke="#b5bfa4" fill="none" strokeDasharray="3 6" />
              <circle cx="340" cy="135" r="62" stroke="#a4b69a" fill="none" />
              {Array.from({ length: 7 }, (_, i) => {
                const a = ((i + 1) * Math.PI) / 4;
                return (
                  <circle
                    key={i}
                    cx={340 + Math.cos(a) * 62}
                    cy={135 + Math.sin(a) * 62}
                    r="4"
                    fill="#78998a"
                  />
                );
              })}
              <path
                d={Array.from({ length: 51 }, (_, i) => {
                  const point = transferPosition(i / 50);
                  return `${i ? 'L' : 'M'}${point.x} ${point.y}`;
                }).join(' ')}
                stroke="#bba37c"
                strokeDasharray="4 6"
                fill="none"
              />
              <circle
                cx={moving.x}
                cy={moving.y}
                r="6"
                fill="#c3955e"
                stroke="#e8cf99"
                strokeWidth="2"
              />
            </>
          )}
          {polar && (
            <>
              <circle cx={240 + 27 * d.progress} cy="130" r="5" fill="#c3955e" />
              <circle cx={240 + 27 * d.progress} cy="141" r="5" fill="#78998a" />
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <circle
                    cx={340 + Math.cos(((i - 1) * Math.PI) / 2) * 55}
                    cy={135 + Math.sin(((i - 1) * Math.PI) / 2) * 55 - 4}
                    r="4"
                    fill="#78998a"
                  />
                  <circle
                    cx={340 + Math.cos(((i - 1) * Math.PI) / 2) * 55}
                    cy={135 + Math.sin(((i - 1) * Math.PI) / 2) * 55 + 4}
                    r="4"
                    fill="#78998a"
                  />
                </g>
              ))}
            </>
          )}
          <text x={polar ? 160 : 121} y="141" textAnchor="middle" fill="#526850" fontSize="22">
            {polar ? 'H' : d.formed ? 'Na⁺' : 'Na'}
          </text>
          <text x="340" y="141" textAnchor="middle" fill="#526850" fontSize="22">
            {!polar && d.formed ? 'Cl⁻' : 'Cl'}
          </text>
          {polar && (
            <>
              <text x="160" y="87" textAnchor="middle" fill="#a18462" fontSize="22">
                δ+
              </text>
              <text x="340" y="74" textAnchor="middle" fill="#698b7b" fontSize="22">
                δ−
              </text>
            </>
          )}
        </svg>
      </div>
      <div className="chem-electron-equation">
        {polar ? 'H₂ + Cl₂ → 2HCl' : '2Na + Cl₂ → 2NaCl'}
        <span>
          {say(
            '只追踪一对原子的成键电子，非完整基元反应路径',
            'One atom pair’s bonding-electron bookkeeping, not a full elementary reaction path',
          )}
        </span>
      </div>
      {(d.ledger || polar) && (
        <div className="chem-electron-ledger">
          <div>
            <span>{polar ? 'H' : 'Na'}</span>
            <p>{say('氧化数', 'Oxidation state')} 0 → +1</p>
          </div>
          <div>
            <span>Cl</span>
            <p>{say('氧化数', 'Oxidation state')} 0 → −1</p>
          </div>
          <p>
            {say(
              polar
                ? '形式氧化数为 ±1，不表示分子里真的存在完整 H⁺ 和 Cl⁻。'
                : '电子得失数相等，总电荷不因转移而产生或消失。',
              polar
                ? 'Formal states ±1 do not mean a molecule contains fully separated H⁺ and Cl⁻.'
                : 'Equal electron loss and gain preserve total charge.',
            )}
          </p>
        </div>
      )}
      {!film.watch && (
        <div className="chem-electron-controls">
          <Segments
            label={say('比较成键类型', 'Bond comparison')}
            value={bond}
            onChange={setBond}
            options={[
              { value: 'ionic', label: say('钠—氯', 'Sodium–chlorine') },
              { value: 'polar', label: say('氢—氯', 'Hydrogen–chlorine') },
            ]}
          />
          <Range
            label={say('示意进度', 'Illustration progress')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
        </div>
      )}
      <details>
        <summary>{say('电子图与氧化数的边界', 'Model and oxidation states')}</summary>
        <p>
          {say(
            '小圆点追踪电子归属，不代表可观测的经典轨道。共用电子云仅作偏向示意，不是量子化学密度或部分电荷计算。氧化数按照异核键电子归属规则记账；离子化合物最终为晶格，本图抽取局部离子对。',
            'Dots track electron allocation, not observable classical paths. The shared-cloud envelope is illustrative, not a quantum density or partial-charge calculation. Oxidation states use bond-allocation rules. The ionic solid forms a lattice; this diagram extracts a local ion pair.',
          )}
        </p>
      </details>
    </section>
  );
}
