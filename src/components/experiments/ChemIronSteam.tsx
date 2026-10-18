import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { ironSteam, ironSteamDirector, steamPoint } from '../../models/chem-iron-steam';
import '../../styles/chem-iron-steam.css';
export default function ChemIronSteam() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [hot, setHot] = useState(true),
    [extent, setExtent] = useState(1),
    [water, setWater] = useState(0.5);
  const d = film.watch
    ? ironSteamDirector(film.chapter, film.chapterProgress)
    : { hot, extent, water, iron: 1, test: true, progress: extent };
  const m = ironSteam(d.iron, d.water, d.extent, d.hot);
  const apparatus = (mobile: boolean) => {
    const start = mobile ? 45 : 70,
      end = mobile ? 300 : 535,
      cotton = mobile ? 68 : 105,
      iron = mobile ? 219 : 380,
      cup = mobile ? 225 : 670,
      cy = mobile ? 330 : 245,
      points: [number, number][] = [
        [end, 100],
        [mobile ? 330 : 670, 100],
        [mobile ? 330 : 670, mobile ? 245 : 100],
        [cup, mobile ? 245 : 100],
        [cup, cy + 20],
      ];
    return (
      <svg
        className={mobile ? 'chem-steam-mobile' : 'chem-steam-desktop'}
        viewBox={mobile ? '0 35 360 395' : '0 0 800 360'}
        role="img"
        aria-label={say(
          '湿棉花、水蒸气、加热铁粉、导管与肥皂液气体检验的完整路径',
          'Complete path from damp cotton through heated iron and tubing to the soap-solution gas test',
        )}
      >
        <path
          d={`M${end} 80H${start}q-20 0-20 20t20 20H${end}`}
          stroke="#92a18c"
          strokeWidth="2"
          fill="#c8d6c122"
        />
        <path d={`M${end - 5} 78v44h15V78Z`} fill="#b5bea8" stroke="#8a977f" />
        {Array.from({ length: 14 }, (_, i) => (
          <ellipse
            key={i}
            cx={cotton - 10 + ((i * 7) % 35)}
            cy={87 + ((i * 11) % 26)}
            rx="7"
            ry="5"
            fill="#e0e7d7"
            stroke="#a7b49d"
            opacity=".8"
          />
        ))}
        {d.hot && <ellipse cx={iron} cy="119" rx="40" ry="5" fill="#b7714f" opacity=".45" />}
        {Array.from({ length: 25 }, (_, i) => (
          <ellipse
            key={i}
            cx={iron - 29 + ((i * 11) % 58)}
            cy={109 + ((i * 7) % 8)}
            rx="4"
            ry="3"
            fill={i / 25 < m.convertedFraction ? '#535c4b' : '#89907d'}
          />
        ))}
        {[cotton, iron].map((x, i) => (
          <g key={i}>
            <path d={`M${x - 22} 190h44l-9 29h-26Z`} fill="#becbb4" stroke="#8c9e80" />
            <path d={`M${x} 190V163`} stroke="#9a947a" strokeWidth="4" />
            <path
              d={`M${x} 168q-17-22 0-39q17 21 0 39`}
              fill="#d7b675"
              opacity={i === 0 ? (d.water > 0 ? 0.85 : 0.1) : d.hot ? 0.85 : 0.1}
            />
          </g>
        ))}
        <path
          d={points.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ')}
          fill="none"
          stroke="#92a18c"
          strokeWidth="5"
        />
        <path
          d={`M${cup - 50} ${cy - 50}V${cy + 48}Q${cup - 50} ${cy + 58} ${cup - 40} ${cy + 58}H${cup + 40}Q${cup + 50} ${cy + 58} ${cup + 50} ${cy + 48}V${cy - 50}`}
          stroke="#92a18c"
          fill="#c5d4bc22"
          strokeWidth="2"
        />
        <path
          d={`M${cup - 47} ${cy - 4}H${cup + 47}V${cy + 47}Q${cup + 47} ${cy + 55} ${cup + 40} ${cy + 55}H${cup - 40}Q${cup - 47} ${cy + 55} ${cup - 47} ${cy + 47}Z`}
          fill="#b9cfbf"
          opacity=".35"
        />
        {d.water > 0 &&
          Array.from({ length: 6 }, (_, i) => (
            <circle
              key={i}
              cx={cotton + 27 + (iron - cotton - 45) * ((i / 6 + d.progress * 0.8) % 1)}
              cy={98 + (i % 2) * 5}
              r="3"
              fill="#b5ced2"
            />
          ))}
        {m.hydrogen > 0 &&
          Array.from({ length: 7 }, (_, i) => {
            const p = steamPoint(points, (i / 7 + d.progress * 0.8) % 1);
            return <circle key={i} cx={p.x} cy={p.y} r="3" fill="#d4dcb3" />;
          })}
        {m.hydrogen > 0 &&
          Array.from({ length: 6 }, (_, i) => (
            <circle
              key={i}
              cx={cup - 25 + ((i * 17) % 55)}
              cy={cy - 13 - (i % 2) * 12}
              r={9 + (i % 3) * 2}
              stroke="#acbea2"
              fill="#e1e6ce"
              opacity=".7"
            />
          ))}
        {d.test && m.hydrogen > 0 && (
          <>
            <path
              d={`M${cup + 70} ${cy - 80}L${cup + 28} ${cy - 36}`}
              stroke="#b1a07e"
              strokeWidth="5"
            />
            <path
              d={`M${cup + 29} ${cy - 37}q-20-22-3-39q15 22 3 39`}
              fill="#d9ba80"
              opacity=".8"
            />
          </>
        )}
        <text x={cotton} y="60" textAnchor="middle" fontSize={mobile ? 24 : 24} fill="#52634b">
          {say('湿棉花', 'Damp cotton')}
        </text>
        <text x={iron} y="60" textAnchor="middle" fontSize={mobile ? 24 : 24} fill="#52634b">
          {m.convertedFraction > 0.95 ? 'Fe₃O₄' : 'Fe'}
        </text>
        <text x={cup} y={cy + 87} textAnchor="middle" fontSize={mobile ? 24 : 24} fill="#52634b">
          {say('肥皂液', 'Soap solution')}
        </text>
      </svg>
    );
  };
  return (
    <section className="chem-iron-steam">
      {apparatus(false)}
      {apparatus(true)}
      <div className="chem-steam-reaction">3Fe + 4H₂O(g) → Fe₃O₄ + 4H₂</div>
      {d.test && (
        <div className="chem-steam-evidence">
          <span>{say('黑色固体：Fe₃O₄', 'Black solid: Fe₃O₄')}</span>
          <span>{say('气泡中可燃气体：H₂', 'Combustible gas: H₂')}</span>
        </div>
      )}
      {!film.watch && (
        <div className="chem-steam-controls">
          <Segments
            label={say('铁粉条件', 'Iron condition')}
            value={hot ? 'hot' : 'cold'}
            options={[
              { value: 'hot', label: say('红热条件', 'Red-hot condition') },
              { value: 'cold', label: say('未加热对照', 'Unheated comparison') },
            ]}
            onChange={(v) => setHot(v === 'hot')}
          />
          <Range
            label={say('反应完成比例', 'Reaction extent')}
            value={extent}
            min={0}
            max={1}
            step={0.01}
            onChange={setExtent}
          />
          <Range
            label={say('可用水的示例质量', 'Illustrative available water mass')}
            value={water}
            min={0}
            max={0.6}
            step={0.01}
            unit="g"
            onChange={setWater}
          />
          <div className="chem-steam-amounts">
            <span>Fe₃O₄ {m.oxideGrams.toFixed(3)} g</span>
            <span>H₂ {(m.hydrogen * 1000).toFixed(2)} mmol</span>
          </div>
          <p>
            {say(
              '以1 g铁作计量示例；器物比例、火焰和流动为示意，未计算真实温度、速率或产气纯度。',
              'Stoichiometric example with 1 g of iron. Apparatus proportions, flames and flow are schematic; temperature, rate and gas purity are not calculated.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
