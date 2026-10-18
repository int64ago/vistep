import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { foodIron, foodIronDirector, foodIronMarkerPoint } from '../../models/chem-food-iron';
import '../../styles/chem-food-iron.css';
export default function ChemFoodIron() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [recovery, setRecovery] = useState(0.75),
    [oxidation, setOxidation] = useState(1),
    [scn, setScn] = useState(1),
    [ironPresent, setIronPresent] = useState(true),
    [stage, setStage] = useState('3');
  const d = film.watch
    ? foodIronDirector(film.chapter, film.chapterProgress)
    : { stage: Number(stage), recovery, oxidation, scn, ironPresent, progress: 1 };
  const m = foodIron(d.recovery, d.oxidation, d.scn, d.ironPresent);
  const markers = Array.from({ length: m.total }, (_, i) =>
    foodIronMarkerPoint(i, d.recovery, d.progress),
  );
  const collected = markers.filter((t) => t.collected).length;
  const tube = (blank: boolean) => (
    <div className="chem-food-tube">
      <div>{blank ? say('试剂空白示意', 'Reagent blank') : say('样品滤液', 'Sample filtrate')}</div>
      <svg
        viewBox="0 0 140 240"
        role="img"
        aria-label={blank ? 'Reagent blank' : 'Sample with thiocyanate'}
      >
        <path
          d="M35 20V182a35 35 0 0 0 70 0V20"
          fill="#cbd8c822"
          stroke="#93a28c"
          strokeWidth="2"
        />
        <path
          d="M38 85H102V182a32 32 0 0 1-64 0Z"
          fill={blank ? '#e2e8d7' : '#bac98f'}
          opacity={blank ? 0.6 : 0.45}
        />
        {!blank && (
          <path d="M38 85H102V182a32 32 0 0 1-64 0Z" fill="#ac4435" opacity={m.signal * 0.85} />
        )}
        <path d="M43 32V180q0 23 15 28" fill="none" stroke="white" strokeWidth="4" opacity=".5" />
      </svg>
    </div>
  );
  return (
    <section className="chem-food-iron">
      {d.stage === 0 ? (
        <div className="chem-food-extraction">
          <div className="chem-food-object-label">
            {say('菠菜 · 研磨与水提取', 'Spinach · grinding and water extraction')}
          </div>
          <svg
            viewBox="0 0 360 275"
            role="img"
            aria-label={say('研钵中的菠菜与研杵', 'Spinach and a pestle in a mortar')}
          >
            <path
              d="M55 140Q60 235 180 240Q300 235 305 140Z"
              fill="#d9ddc8"
              stroke="#a4ae94"
              strokeWidth="2"
            />
            <ellipse cx="180" cy="140" rx="125" ry="27" fill="#abb796" />
            {Array.from({ length: 16 }, (_, i) => (
              <path
                key={i}
                d={`M${85 + ((i * 37) % 175)} ${125 + ((i * 13) % 30)}q15-20 32 0q-20 20-32 0`}
                fill={i % 2 ? '#6d8d52' : '#87a264'}
                transform={`rotate(${i * 23} ${100 + ((i * 37) % 175)} ${125 + ((i * 13) % 30)})`}
              />
            ))}
            <g transform={`rotate(${14 * Math.sin(d.progress * Math.PI * 4)} 180 135)`}>
              <path
                d="M195 40q4-15 20-10t10 22l-33 100q-7 17-25 9t-8-26Z"
                fill="#c5ccb4"
                stroke="#96a58b"
                strokeWidth="2"
              />
              <path d="M208 46l-30 88" stroke="#e3e8d7" strokeWidth="5" />
            </g>
          </svg>
        </div>
      ) : d.stage === 1 ? (
        <div className="chem-food-filter">
          <div className="chem-food-object-label">
            {say('过滤 · 追踪同一批示例铁标记', 'Filtration · track the iron markers')}
          </div>
          <svg
            viewBox="0 0 360 340"
            role="img"
            aria-label={say(
              '滤渣保留部分铁，滤液只带走可提取部分',
              'Some iron remains with residue; only recovered iron reaches the filtrate',
            )}
          >
            <path
              d="M70 40H290L195 160V205H165V160Z"
              fill="#d7dfcf33"
              stroke="#98a88e"
              strokeWidth="2"
            />
            <path d="M82 48H278L180 157Z" fill="#e5e4cf" stroke="#b7b99d" />
            <path
              d="M115 205V303q0 12 12 12H233q12 0 12-12V205"
              fill="#cbd8c822"
              stroke="#93a28c"
              strokeWidth="2"
            />
            <path d="M118 260H242V303q0 9-9 9H127q-9 0-9-9Z" fill="#b8c68c" opacity=".4" />
            {markers.map((t) => (
              <circle
                key={t.id}
                cx={t.x}
                cy={t.y}
                r="4.5"
                fill={t.inFiltrate ? '#a8814e' : '#6e7f55'}
              />
            ))}
          </svg>
          <div className="chem-food-ledger">
            <span>
              {say('滤渣中', 'In residue')}: {m.residue.toFixed(0)}
            </span>
            <span>
              {say('已收集', 'Collected')}: {collected}
            </span>
          </div>
        </div>
      ) : d.stage === 2 ? (
        <div className="chem-food-oxidation">
          <div className="chem-food-object-label">
            {say('稀HNO₃ · 氧化步骤', 'Dilute HNO₃ · oxidation step')}
          </div>
          <svg
            viewBox="0 0 340 250"
            role="img"
            aria-label={say(
              '示例滤液中二价铁逐渐转成三价铁',
              'Illustrative extracted Fe(II) is converted to Fe(III)',
            )}
          >
            <path
              d="M20 25V215q0 15 15 15H305q15 0 15-15V25"
              fill="#b9c69033"
              stroke="#95a58a"
              strokeWidth="2"
            />
            {Array.from({ length: m.extracted > 0 ? 12 : 0 }, (_, i) => {
              const ferric = (i + 0.5) / 12 < 0.25 + 0.75 * d.oxidation;
              return (
                <g
                  key={i}
                  transform={`translate(${65 + (i % 4) * 70} ${62 + Math.floor(i / 4) * 62})`}
                >
                  <circle r="24" fill={ferric ? '#c2a965' : '#b9c8a9'} />
                  <text y="6" textAnchor="middle" fontSize="23" fill="#53634e">
                    {ferric ? 'Fe³⁺' : 'Fe²⁺'}
                  </text>
                </g>
              );
            })}
          </svg>
          <p>
            {say(
              '示例价态分配；并非菠菜中真实比例',
              'Illustrative oxidation-state distribution, not a measured ratio in spinach',
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="chem-food-object-label">KSCN</div>
          <div className="chem-food-pair">
            {tube(false)}
            {tube(true)}
          </div>
        </>
      )}
      {!film.watch && (
        <div className="chem-food-controls">
          <Segments
            label={say('观察步骤', 'Stage')}
            value={stage}
            options={[
              { value: '0', label: say('研磨', 'Grinding') },
              { value: '1', label: say('过滤', 'Filtration') },
              { value: '2', label: say('氧化', 'Oxidation') },
              { value: '3', label: say('显色', 'Colour') },
            ]}
            onChange={setStage}
          />
          <Segments
            label={say('示例样品', 'Illustrative sample')}
            value={ironPresent ? 'iron' : 'none'}
            options={[
              { value: 'iron', label: say('含铁', 'Iron present') },
              { value: 'none', label: say('无铁对照', 'No iron control') },
            ]}
            onChange={(v) => setIronPresent(v === 'iron')}
          />
          <Range
            label={say('示例提取比例', 'Illustrative recovered fraction')}
            value={recovery}
            min={0}
            max={1}
            step={0.05}
            onChange={setRecovery}
          />
          <Range
            label={say('氧化完成比例', 'Oxidation extent')}
            value={oxidation}
            min={0}
            max={1}
            step={0.05}
            onChange={setOxidation}
          />
          <Range
            label={say('显色步骤完成比例', 'Colour-development extent')}
            value={scn}
            min={0}
            max={1}
            step={0.05}
            onChange={setScn}
          />
          <p>
            {say(
              '数量是教学标记，颜色不是浓度测定；无显色可来自未提取到铁或未完成显色步骤。',
              'Counts are teaching markers and colour is not a concentration measurement. A missing signal can result from failed recovery or incomplete colour development.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
