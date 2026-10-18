import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  chlorinePhotolysis,
  photolysisTrace,
  photolysisDirector,
} from '../../models/chem-chlorine-photolysis';
import '../../styles/chem-chlorine-photolysis.css';
export default function ChemChlorinePhotolysis() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [extent, setExtent] = useState(1),
    [light, setLight] = useState(true),
    [headspace, setHeadspace] = useState(500);
  const d = film.watch
    ? photolysisDirector(film.chapter, film.chapterProgress)
    : { extent, light, headspace, ledger: true };
  const m = chlorinePhotolysis(d.extent, d.headspace, d.light),
    trace = photolysisTrace(d.extent, d.headspace, d.light),
    liquidY = 325 - (190 * 100) / (d.headspace + 100);
  const channels = [
    {
      key: 'pH' as const,
      label: 'pH',
      value: m.pH.toFixed(2),
      min: 1.4,
      max: 2.2,
      color: '#a67f79',
    },
    {
      key: 'chlorideMgL' as const,
      label: 'Cl⁻ / mg·L⁻¹',
      value: m.chlorideMgL.toFixed(0),
      min: 200,
      max: 1000,
      color: '#729c87',
    },
    {
      key: 'oxygenPercent' as const,
      label: 'O₂ / %',
      value: m.oxygenPercent.toFixed(2),
      min: 18,
      max: Math.max(23, m.oxygenPercent + 1),
      color: '#ae9b65',
    },
  ];
  return (
    <section className="chem-chlorine-photolysis" data-watch={film.watch}>
      <p className="chem-photo-model">{say('计量预测 · 非实测曲线', 'Stoichiometric model')}</p>
      <div className="chem-photo-grid">
        <figure className="chem-photo-bottle">
          <svg
            viewBox="0 0 360 365"
            role="img"
            aria-label={say(
              '氯水瓶：pH和氯离子探头在液体中，氧气探头在上方气体中，全部连接采集器',
              'Chlorine-water bottle with pH and chloride probes in liquid, oxygen probe in headspace, and leads to the data logger',
            )}
          >
            <path
              d="M105 90V115L80 135V307Q80 325 97 325H247Q265 325 265 307V135L240 115V90"
              fill="#c6d29d18"
              stroke="#8a9c80"
              strokeWidth="2"
            />
            <path
              d={`M82 ${liquidY}H263V306Q263 323 246 323H98Q82 323 82 306Z`}
              fill="#c1ce8b"
              opacity={0.14 + 0.2 * (1 - m.p)}
            />
            <ellipse cx="172.5" cy={liquidY} rx="90" ry="9" fill="#b7c883" opacity=".2" />
            <path d="M102 84H243V100H102Z" fill="#afbea3" stroke="#839579" />
            {[
              { x: 125, end: liquidY + (325 - liquidY) * 0.5, c: '#a67f79' },
              { x: 170, end: liquidY + (325 - liquidY) * 0.65, c: '#729c87' },
              { x: 215, end: 169, c: '#ae9b65' },
            ].map((p, i) => (
              <g key={i}>
                <path
                  d={`M${p.x} 86V${p.end}`}
                  stroke={p.c}
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d={`M${p.x} 82V${42 - i * 12}Q${p.x} ${30 - i * 12} ${p.x + 12} ${30 - i * 12}H${295 + i * 12}V${64 + i * 15}`}
                  fill="none"
                  stroke={p.c}
                  strokeWidth="2"
                />
                <circle cx={p.x} cy={p.end} r="6" fill="#e3e4cf" stroke={p.c} />
              </g>
            ))}
            <rect x="286" y="64" width="60" height="63" rx="9" fill="#c7d2bb" stroke="#8a9c80" />
            <path d="M294 109h8l5-13 7 8 8-20 9 10h7" stroke="#6a856d" fill="none" />
            <path d="M20 135L48 157V197L20 219Z" fill="#b0bca2" stroke="#819477" />
            {d.light && <path d="M48 157L83 141V263L48 197Z" fill="#e8d99d" opacity=".45" />}
            {Array.from({ length: 8 }, (_, i) => (
              <circle
                key={i}
                cx={105 + ((i * 31) % 134)}
                cy={liquidY + 8 + ((i * 17 + d.extent * 20) % Math.max(1, 315 - liquidY))}
                r={3 + (i % 2)}
                fill="none"
                stroke="#a8b6a0"
                opacity={m.p * 0.8}
              />
            ))}
            <text x="110" y="349" textAnchor="middle" fontSize="34" fill="#8e6e68">
              pH
            </text>
            <text x="184" y="349" textAnchor="middle" fontSize="34" fill="#628974">
              Cl⁻
            </text>
            <text x="215" y="152" textAnchor="middle" fontSize="34" fill="#8d7c4f">
              O₂
            </text>
          </svg>
          <figcaption>{say('液相两通道 · 气相一通道', 'Liquid and gas probes')}</figcaption>
        </figure>
        <div className="chem-photo-charts">
          {channels.map((c) => {
            const path = trace
              .map(
                (s, i) =>
                  `${i ? 'L' : 'M'}${25 + (230 * d.extent * i) / 60} ${95 - ((s[c.key] - c.min) / (c.max - c.min)) * 75}`,
              )
              .join(' ');
            return (
              <figure key={c.key}>
                <figcaption>
                  <span style={{ color: c.color }}>{c.label}</span>
                  <strong>{c.value}</strong>
                </figcaption>
                <svg viewBox="0 0 280 115" role="img" aria-label={`${c.label}: ${c.value}`}>
                  <path d="M25 15V95H260" fill="none" stroke="#a7b5a0" />
                  <path d="M25 55H260" stroke="#a7b5a0" opacity=".3" strokeDasharray="3 5" />
                  <path d={path} fill="none" stroke={c.color} strokeWidth="2.5" />
                  <circle
                    cx={25 + 230 * d.extent}
                    cy={95 - ((m[c.key] - c.min) / (c.max - c.min)) * 75}
                    r="4"
                    fill={c.color}
                  />
                </svg>
              </figure>
            );
          })}
          <span className="chem-photo-axis">
            {say('横轴：归一化光照反应进程', 'Axis: reaction extent')}
          </span>
        </div>
      </div>
      {d.ledger && (
        <div className="chem-photo-ledger">
          <span>2HClO → 2H⁺ + 2Cl⁻ + O₂</span>
          <div className="chem-photo-amounts">
            <b>Δn(Cl⁻) = {(m.decomposed * 1000).toFixed(2)} mmol</b>
            <b>Δn(O₂) = {(m.oxygen * 1000).toFixed(2)} mmol</b>
          </div>
        </div>
      )}
      {!film.watch && (
        <div className="chem-photo-controls">
          <Segments
            label={say('独立样品比较', 'Independent sample comparison')}
            value={light ? 'light' : 'dark'}
            options={[
              { value: 'light', label: say('光照模型', 'Illuminated model') },
              { value: 'dark', label: say('理想避光对照', 'Ideal dark control') },
            ]}
            onChange={(v) => setLight(v === 'light')}
          />
          <Range
            label={say('反应进程', 'Reaction extent')}
            value={extent}
            min={0}
            max={1}
            step={0.01}
            onChange={setExtent}
          />
          <Range
            label={say('气相体积', 'Headspace volume')}
            value={headspace}
            min={50}
            max={1000}
            step={10}
            unit="mL"
            onChange={setHeadspace}
          />
          <p>
            {say(
              '三条曲线共享同一反应量。初始浓度和气相组成是示例设定，未拟合教材150秒曲线；避光模型省略缓慢暗反应。',
              'All traces use the same reaction amount. Initial concentrations and gas composition are illustrative and are not fitted to the textbook 150-second traces. The dark model omits slow dark reactions.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
