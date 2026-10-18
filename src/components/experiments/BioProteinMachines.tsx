import { useState } from 'react';
import { t } from '../../i18n';
import { Range } from '../lab/Controls';
import { useShowcase, ramp, ease } from '../lab/FilmContext';
import {
  insulinGeometry,
  disulfideEdges,
  peptideAccounting,
} from '../../models/bio-protein-machines';
import '../../styles/bio-protein-machines.css';
export default function BioProteinMachines() {
  const f = useShowcase(),
    [fold, setFold] = useState(1),
    [angle, setAngle] = useState(20),
    [bonds, setBonds] = useState(true);
  const p = ease(ramp(f.chapterProgress, 0.1, 0.8)),
    condensation = f.watch && f.chapter === 0,
    folding = f.watch ? (f.chapter === 1 ? 0 : f.chapter === 2 ? p : 1) : fold,
    rotation = f.watch ? (f.chapter === 3 ? 15 + 28 * p : 15) : angle,
    points = insulinGeometry(folding, rotation),
    edges = disulfideEdges(folding, rotation),
    account = peptideAccounting(51, 2);
  return (
    <section className="bio-protein">
      {condensation ? (
        <>
          <svg
            viewBox="0 0 360 240"
            className="bio-protein-molecule"
            role="img"
            aria-label={t('羧基与氨基之间形成肽键并脱去一分子水')}
          >
            <g stroke="#8a987e" strokeWidth="2">
              <path d="M39 132H65M101 132H121M83 146V174M130 115V88M135 115V88" />
              <path
                d={`M${230 - 28 * p} 132H${236 - 28 * p}M${272 - 28 * p} 132H${288 - 28 * p}M${254 - 28 * p} 146V174`}
              />
              <path d={`M142 132H${190 - 28 * p}`} stroke="#b68c50" strokeWidth="4" opacity={p} />
            </g>
            <g fontSize="28" fill="#52634f" textAnchor="middle">
              <text x="25" y="140">
                …
              </text>
              <text x="83" y="140">
                CH
              </text>
              <text x="132" y="140">
                C
              </text>
              <text x="135" y="83">
                O
              </text>
              <text x="83" y="195">
                R₁
              </text>
              <text x={210 - 28 * p} y="140">
                NH
              </text>
              <text x={254 - 28 * p} y="140">
                CH
              </text>
              <text x={302 - 28 * p} y="140">
                …
              </text>
              <text x={254 - 28 * p} y="195">
                R₂
              </text>
            </g>
            <g>
              <path
                d={`M142 132L${165 + 10 * p} ${132 - 90 * p}`}
                stroke="#8a987e"
                strokeWidth="2"
                opacity={1 - p}
              />
              <path
                d={`M${210 - 28 * p} 132L${202 - 37 * p} ${113 - 66 * p}`}
                stroke="#8a987e"
                strokeWidth="2"
                opacity={1 - p}
              />
              <path
                d={`M${176 + 9 * p} ${137 - 90 * p}L${165 + 10 * p} ${132 - 90 * p}`}
                fill="none"
                stroke="#9eb7b2"
                strokeWidth="2"
              />
              <path
                d={`M${165 + 10 * p} ${132 - 90 * p}L${202 - 37 * p} ${113 - 66 * p}`}
                fill="none"
                stroke="#9eb7b2"
                strokeWidth="2"
                opacity={p}
              />
              <circle cx={165 + 10 * p} cy={132 - 90 * p} r="7" fill="#b7796c" />
              <circle cx={176 + 9 * p} cy={137 - 90 * p} r="4" fill="#c9d8d2" />
              <circle cx={202 - 37 * p} cy={113 - 66 * p} r="4" fill="#c9d8d2" />
            </g>
          </svg>
          <p className="bio-protein-account">
            {t('一个新肽键')} · {t('一分子水')}
          </p>
        </>
      ) : (
        <>
          <svg
            className="bio-protein-molecule"
            viewBox="0 0 360 270"
            role="img"
            aria-label={t('来自实测结构的牛胰岛素两条肽链与三处二硫键')}
          >
            <g transform="translate(180 140) scale(8 -8)">
              {['A', 'B'].map((chain) => (
                <path
                  key={chain}
                  d={points
                    .filter((a) => a.chain === chain)
                    .map((a, i) => `${i ? 'L' : 'M'}${a.x} ${a.y}`)
                    .join(' ')}
                  fill="none"
                  stroke={chain === 'A' ? '#719b87' : '#aa8eae'}
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}
              {(f.watch ? f.chapter >= 2 : bonds) &&
                edges.map((e) => (
                  <path
                    key={e.from.id}
                    d={`M${e.from.x} ${e.from.y}L${e.to.x} ${e.to.y}`}
                    stroke="#c7a15a"
                    strokeWidth=".8"
                    strokeDasharray={folding < 0.9 ? '.7 1' : undefined}
                  />
                ))}
              {points
                .toSorted((a, b) => a.z - b.z)
                .map((a) => (
                  <circle
                    key={a.id}
                    cx={a.x}
                    cy={a.y}
                    r={a.name === 'CYS' ? 0.72 : 0.32}
                    fill={a.name === 'CYS' ? '#d3af63' : a.chain === 'A' ? '#86ae99' : '#b8a1bc'}
                    stroke={a.name === 'CYS' ? '#aa8c52' : undefined}
                    strokeWidth=".15"
                  />
                ))}
            </g>
          </svg>
          <div className="bio-protein-account">
            <span>A · 21 {t('残基')}</span>
            <span>B · 30 {t('残基')}</span>
            <span>
              {account.peptideBonds} {t('肽键')}
            </span>
            <span>3 {t('二硫键')}</span>
          </div>
          {f.watch && f.chapter === 3 && (
            <p className="bio-protein-evidence">
              {t('结构来自PDB 2A3G；1965年合成产物的活性由独立实验检验。')}
            </p>
          )}
        </>
      )}
      {!f.watch && (
        <div className="bio-protein-controls">
          <Range
            label={t('展开与折叠示意')}
            value={fold}
            min={0}
            max={1}
            step={0.01}
            onChange={setFold}
          />
          <Range
            label={t('观察角度')}
            value={angle}
            min={-180}
            max={180}
            unit="°"
            onChange={setAngle}
          />
          <button type="button" aria-pressed={bonds} onClick={() => setBonds(!bonds)}>
            {t(bonds ? '显示二硫键' : '隐藏二硫键')}
          </button>
          <p>{t('连线表示Cα骨架与二硫键的连接关系；展开动画不是分子动力学。')}</p>
        </div>
      )}
    </section>
  );
}
