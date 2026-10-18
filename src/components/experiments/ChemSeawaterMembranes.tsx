import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  seawaterDirector,
  membraneFlux,
  reverseOsmosis,
  distillSeawater,
  membranePartition,
  membraneClasses,
  passage,
  type MembraneClass,
} from '../../models/chem-seawater-membranes';
import '../../styles/chem-seawater-membranes.css';
export default function ChemSeawaterMembranes() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState(film.variant === 'polymer-membranes' ? 'classes' : 'pressure'),
    [pressure, setPressure] = useState(60),
    [salinity, setSalinity] = useState(35),
    [hours, setHours] = useState(1),
    [kind, setKind] = useState<MembraneClass>('RO'),
    [recovery, setRecovery] = useState(0.5);
  const d = film.watch
    ? seawaterDirector(film.chapter, film.chapterProgress)
    : {
        ...seawaterDirector(view === 'classes' ? 5 : view === 'juice' ? 7 : 3, 1),
        pressure,
        salinity,
        hours,
        recovery,
      };
  const m = reverseOsmosis(d.pressure, d.salinity, d.hours),
    f = d.chapter === 3 ? m.flux : membraneFlux(d.pressure, d.salinity),
    dist = distillSeawater(d.p);
  const labels = [
    say('蒸发后，还要冷凝收集', 'Evaporation needs condensation'),
    say('自然渗透的方向', 'The direction of natural osmosis'),
    say('压力超过渗透压差', 'Pressure overcomes osmosis'),
    say('产水与浓缩液同时出现', 'Permeate and concentrate'),
    say('盐留下，资源仍有去向', 'Retained salts remain resources'),
    say('不同膜，保留对象不同', 'Membranes retain different components'),
    say('反渗透不是普通筛孔', 'RO is not a coarse molecular sieve'),
    say('需要的产品也可以是浓缩液', 'The concentrate can be the product'),
  ];
  return (
    <section className="chem-sea">
      <div className="chem-sea-title">{labels[d.chapter]}</div>
      {d.chapter === 0 ? (
        <>
          <svg className="chem-sea-svg" viewBox="0 0 320 260" role="img" aria-label={labels[0]}>
            <path
              d="M35 85Q35 64 55 64H113Q133 64 133 85V220H35Z"
              fill="#e9e7d5"
              stroke="#99a89a"
              strokeWidth="2"
            />
            <path d={`M38 ${138 + dist.collected * 0.8}H130V217H38Z`} fill="#9ebfb6" />
            {Array.from({ length: 10 }, (_, i) => (
              <circle
                key={i}
                cx={50 + (i % 5) * 17}
                cy={186 + Math.floor(i / 5) * 19}
                r="4"
                fill="#b2986e"
              />
            ))}
            <path d="M84 64V29H222V63" stroke="#a2afa3" strokeWidth="8" fill="none" />
            <path d="M84 64V29H222V63" stroke="#e5eee7" strokeWidth="4" fill="none" />
            <rect
              x="183"
              y="62"
              width="78"
              height="114"
              rx="16"
              fill="#d5e7e1"
              stroke="#91aca4"
              strokeWidth="2"
            />
            <path
              d="M222 62V77q-30 9 0 18t0 18 0 18 0 18v36"
              stroke="#94aaa3"
              strokeWidth="7"
              fill="none"
            />
            <path
              d="M222 62V77q-30 9 0 18t0 18 0 18 0 18v36"
              stroke="#edf3e7"
              strokeWidth="3"
              fill="none"
            />
            <path d="M191 193V235H253V193" fill="#e4eee6" stroke="#99aaa1" strokeWidth="2" />
            <path d={`M194 ${232 - dist.collected}H250V232H194Z`} fill="#acd1c5" />
            <path d="M43 238q12-13 24 0t24 0 24 0" fill="none" stroke="#cba17c" strokeWidth="3" />
            <path d="M275 165V85m-5 9 5-9 5 9" fill="none" stroke="#81a6ac" strokeWidth="3" />
            {Array.from({ length: 5 }, (_, i) => (
              <circle
                key={i}
                cx={90 + ((d.p * 140 + i * 29) % 130)}
                cy="29"
                r="3"
                fill="#9abcb3"
                opacity={d.p}
              />
            ))}
            <text x="84" y="105" textAnchor="middle" fontSize="20" fill="#67897d">
              {say('海水', 'Seawater')}
            </text>
          </svg>
          <div className="chem-sea-evidence">H₂O(g) → H₂O(l)</div>
        </>
      ) : null}
      {(d.chapter >= 1 && d.chapter <= 3) || d.chapter === 6 ? (
        <>
          <MembraneView
            p={d.p}
            pressure={d.pressure}
            salinity={d.chapter === 3 ? m.concentrateSalinity : d.salinity}
            dense={d.chapter === 6}
            batch={d.chapter === 3 ? m : undefined}
          />
          <div className="chem-sea-evidence">
            ΔP {d.pressure.toFixed(0)} bar · Δπ {f.osmotic.toFixed(1)} bar
          </div>
          {d.chapter === 3 ? (
            <div className="chem-sea-pair">
              <span>
                {say('浓缩液', 'Concentrate')}
                <b>{m.feedVolume.toFixed(1)} L</b>
              </span>
              <span>
                {say('产水', 'Permeate')}
                <b>{m.permeateVolume.toFixed(1)} L</b>
              </span>
            </div>
          ) : d.chapter === 6 ? (
            <div className="chem-sea-evidence">
              {say('盐透过量并非严格为零', 'Salt passage is not exactly zero')}
            </div>
          ) : null}
        </>
      ) : null}
      {d.chapter === 4 ? (
        <div className="chem-sea-resources">
          <div>{say('海水', 'Seawater')}</div>
          <span>↓</span>
          <div className="chem-sea-branches">
            <span>{say('淡水', 'Freshwater')}</span>
            <span>{say('盐与母液', 'Salts and mother liquor')}</span>
          </div>
          <span className="chem-sea-brine-arrow">↓</span>
          <div className="chem-sea-products">
            {['NaCl', 'Mg²⁺', 'Br⁻'].map((v, i) => (
              <div key={v} style={{ opacity: d.p > i * 0.2 ? 0.95 : 0.25 }}>
                {v}
                <span>→</span>
                {['NaOH / Na₂CO₃', say('镁及其化合物', 'Magnesium compounds'), 'Br₂'][i]}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {d.chapter === 5 ? (
        <>
          <div className="chem-sea-classes">
            {membraneClasses.map((k, i) => (
              <div
                className="chem-sea-class"
                key={k}
                style={{ opacity: film.watch ? (d.p < i * 0.18 ? 0.4 : 1) : kind === k ? 1 : 0.35 }}
              >
                <strong>{k}</strong>
                <svg viewBox="0 0 240 44" aria-label={k}>
                  <path
                    d="M92 3V41"
                    stroke="#a6aa89"
                    strokeWidth={k === 'RO' ? 12 : 8}
                    strokeDasharray={
                      k === 'RO' ? undefined : k === 'MF' ? '6 10' : k === 'UF' ? '9 5' : '12 3'
                    }
                  />
                  {[0, 1, 2, 3].map((j) => (
                    <g key={j}>
                      <circle
                        cx={25 + j * 13}
                        cy={22 + Math.sin(j) * 8}
                        r={[8, 6, 4, 3][j]}
                        fill={['#bda87b', '#ad8b79', '#9daa7c', '#82b6b2'][j]}
                      />
                      <circle
                        cx={125 + j * 26}
                        cy="22"
                        r={[8, 6, 4, 3][j]}
                        fill={['#bda87b', '#ad8b79', '#9daa7c', '#82b6b2'][j]}
                        opacity={passage[k][j] * (film.watch ? 1 : recovery / 0.8)}
                      />
                    </g>
                  ))}
                  <path d="M68 22H82m-5-4 5 4-5 4" stroke="#94a69a" fill="none" />
                </svg>
              </div>
            ))}
          </div>
          <div className="chem-sea-legend">
            {[
              say('胶体', 'Colloid'),
              say('大分子', 'Macromolecule'),
              say('盐', 'Salt'),
              say('水', 'Water'),
            ].map((v, i) => (
              <span key={v}>
                <i style={{ background: ['#bda87b', '#ad8b79', '#9daa7c', '#82b6b2'][i] }} />
                {v}
              </span>
            ))}
          </div>
        </>
      ) : null}
      {d.chapter === 7 ? (
        <>
          <svg className="chem-sea-svg" viewBox="0 0 320 260" role="img" aria-label={labels[7]}>
            <path
              d="M40 35V211H135V35M190 35V211H280V35"
              fill="#f0e5c8"
              stroke="#aaa285"
              strokeWidth="2"
            />
            <path d={`M43 ${60 + 95 * d.recovery}H132V208H43Z`} fill="#d3b77d" />
            <path d={`M193 ${208 - 150 * d.recovery}H277V208H193Z`} fill="#b3d1c7" />
            {Array.from({ length: 14 }, (_, i) => (
              <circle
                key={i}
                cx={54 + (i % 4) * 21}
                cy={75 + 95 * d.recovery + (Math.floor(i / 4) * (125 - 95 * d.recovery)) / 4}
                r="4"
                fill="#a58a52"
              />
            ))}
            <path d="M135 185H190" stroke="#99b8a8" strokeWidth="8" />
            <path d="M157 161V209" stroke="#a4a27f" strokeWidth="10" />
            <path d="M168 172h13m-5-4 5 4-5 4" stroke="#739e99" fill="none" strokeWidth="2" />
            <text x="85" y="245" textAnchor="middle" fontSize="20" fill="#967f50">
              {say('浓缩液', 'Concentrate')}
            </text>
            <text x="235" y="245" textAnchor="middle" fontSize="20" fill="#739e99">
              {say('透过液', 'Permeate')}
            </text>
          </svg>
          <div className="chem-sea-evidence">c / c₀ = {(1 / (1 - d.recovery)).toFixed(2)}</div>
        </>
      ) : null}
      {!film.watch ? (
        <div className="chem-sea-controls">
          <Segments
            label={say('观察', 'View')}
            value={view}
            onChange={setView}
            options={[
              { value: 'pressure', label: say('反渗透', 'Reverse osmosis') },
              { value: 'classes', label: say('膜的种类', 'Membrane classes') },
              { value: 'juice', label: say('浓缩', 'Concentration') },
            ]}
          />
          {view === 'pressure' ? (
            <>
              <Range
                label={say('压力差 / bar', 'Pressure difference / bar')}
                min={0}
                max={90}
                step={1}
                value={pressure}
                onChange={setPressure}
              />
              <Range
                label={say('NaCl等效盐度 / g L⁻¹', 'NaCl-equivalent salt / g L⁻¹')}
                min={0}
                max={60}
                step={1}
                value={salinity}
                onChange={setSalinity}
              />
              <Range
                label={say('模型运行时长 / h', 'Model duration / h')}
                min={0}
                max={2}
                step={0.05}
                value={hours}
                onChange={setHours}
              />
              <div>
                {say('浓缩液盐度', 'Concentrate salinity')}: {m.concentrateSalinity.toFixed(1)} g/L
                <br />
                {say('产水盐度', 'Permeate salinity')}: {m.permeateSalinity.toFixed(3)} g/L
              </div>
            </>
          ) : (
            <>
              <Range
                label={say('水回收份额', 'Water recovery')}
                min={0}
                max={0.8}
                step={0.01}
                value={recovery}
                onChange={setRecovery}
              />
              {view === 'classes' ? (
                <>
                  <Segments
                    label={say('核算膜种类', 'Accounted membrane')}
                    value={kind}
                    onChange={(v) => setKind(v as MembraneClass)}
                    options={membraneClasses.map((v) => ({ value: v, label: v }))}
                  />
                  <div>
                    {say('透过液中盐 / 起始盐（示意）', 'Permeated / initial salt (model)')}:{' '}
                    {(100 * membranePartition(kind, recovery)[2].permeate).toFixed(2)}%
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
function MembraneView({
  p,
  pressure,
  salinity,
  dense,
  batch,
}: {
  p: number;
  pressure: number;
  salinity: number;
  dense: boolean;
  batch?: ReturnType<typeof reverseOsmosis>;
}) {
  const en = browserLocale() === 'en',
    f = membraneFlux(pressure, salinity),
    forward = f.signedWater >= 0,
    leftTop = batch ? 217 - batch.feedVolume * 1.27 : 90,
    rightTop = batch ? 217 - batch.permeateVolume * 1.27 : 90;
  return (
    <svg
      className="chem-sea-svg"
      viewBox="0 0 320 255"
      role="img"
      aria-label={
        en
          ? 'Pressure and osmotic pressure set water-flow direction through the membrane'
          : '压力与渗透压差决定跨膜水流方向'
      }
    >
      <path d="M30 60V220H290V60" fill="#e1e9db" stroke="#a2b2a3" strokeWidth="2" />
      <path d={`M33 ${leftTop}H155V217H33Z`} fill="#b5c9b4" />
      <path d={`M166 ${rightTop}H287V217H166Z`} fill="#c7ded1" />
      <rect x={dense ? 140 : 154} y="55" width={dense ? 42 : 12} height="165" fill="#bec2a3" />
      {dense
        ? Array.from({ length: 7 }, (_, i) => (
            <path
              key={i}
              d={`M${145 + i * 5} 57q-7 21 0 42t0 42 0 42 0 35`}
              stroke="#8d9d82"
              strokeWidth="1.3"
              fill="none"
            />
          ))
        : null}
      {Array.from({ length: 12 }, (_, i) => (
        <circle
          key={i}
          cx={48 + (i % 4) * 25}
          cy={leftTop + 14 + (Math.floor(i / 4) * (203 - leftTop)) / 3}
          r="4"
          fill="#a68e62"
          opacity={Math.min(1, salinity / 35)}
        />
      ))}
      {Array.from({ length: 6 }, (_, i) => {
        const q = (p * 1.5 + i / 6) % 1,
          x = forward ? 63 + 194 * q : 257 - 194 * q;
        return (
          <circle
            key={i}
            cx={x}
            cy={batch ? 205 - (i % 3) * 4 : 113 + (i % 3) * 36}
            r="3"
            fill="#6caba8"
            opacity={Math.abs(f.signedWater) < 0.05 ? 0 : 1}
          />
        );
      })}
      {pressure > 0 ? (
        <path
          d="M91 15V49m-8-10 8 10 8-10"
          stroke="#7e9d8c"
          fill="none"
          strokeWidth={2 + pressure / 30}
        />
      ) : null}
      <path
        d={`M${forward ? 195 : 126} 236h${forward ? 45 : -45}m${forward ? -7 : 7}-5 ${forward ? 7 : -7} 5 ${forward ? -7 : 7} 5`}
        stroke="#6caaa7"
        strokeWidth="3"
        fill="none"
      />
      <text x="91" y="80" textAnchor="middle" fontSize="20" fill="#6c8470">
        {en ? 'saline' : '盐水'}
      </text>
      <text x="230" y="80" textAnchor="middle" fontSize="20" fill="#789e8b">
        {batch ? (en ? 'permeate' : '产水') : en ? 'dilute' : '稀溶液'}
      </text>
    </svg>
  );
}
