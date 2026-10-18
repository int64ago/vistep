import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  structure,
  wohler,
  nodeLabel,
  alkene,
  piOverlap,
  type Structure,
  type Isomer,
} from '../../models/chem-wohler-isomers';
import '../../styles/chem-wohler-isomers.css';
const modes = ['origin', 'atoms', 'skeleton', 'position', 'functional', 'overlap', 'cis'] as const;
type Mode = (typeof modes)[number];
const names = [
  '实验室里的尿素',
  '组成相同，连接改变',
  '碳骨架的三种连接',
  '双键换了位置',
  '氧连接谁',
  '双键的旋转限制',
  '同侧与异侧',
];
const moleculeNames = {
  pentane: '正戊烷',
  isopentane: '异戊烷',
  neopentane: '新戊烷',
  but1: '1-丁烯',
  but2: '2-丁烯',
  ethanol: '乙醇',
  ether: '二甲醚',
};
const chemicalLabel = (value: string) =>
  value.replace(/[0-9]/g, (digit) => '₀₁₂₃₄₅₆₇₈₉'[Number(digit)]);
const color = { C: '#63736d', H: '#bda36e', O: '#bc7972', N: '#758aa8' };
function Molecule({ s, focus = '' }: { s: Structure; focus?: string }) {
  return (
    <svg viewBox="0 0 310 220" role="img" aria-label={t('按真实连接关系绘制的结构示意')}>
      {s.bonds.map((b) => {
        const a = s.atoms.find((x) => x.id === b.a)!,
          d = s.atoms.find((x) => x.id === b.b)!,
          len = Math.hypot(d.x - a.x, d.y - a.y),
          nx = -(d.y - a.y) / len,
          ny = (d.x - a.x) / len;
        return (
          <g key={b.a + b.b} opacity={!focus || [a.id, d.id].includes(focus) ? 1 : 0.3}>
            {Array.from({ length: b.order }, (_, i) => {
              const k = (i - (b.order - 1) / 2) * 6;
              return (
                <path
                  key={i}
                  d={`M${a.x + nx * k} ${a.y + ny * k}L${d.x + nx * k} ${d.y + ny * k}`}
                  stroke="#8d9990"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        );
      })}
      {s.atoms.map((a) => (
        <g
          key={a.id}
          opacity={
            !focus ||
            a.id === focus ||
            s.bonds.some((b) => [b.a, b.b].includes(focus) && [b.a, b.b].includes(a.id))
              ? 1
              : 0.4
          }
        >
          <rect x={a.x - 23} y={a.y - 19} width="46" height="38" rx="15" fill="#f4f2e9" />
          <text
            x={a.x}
            y={a.y + 7}
            textAnchor="middle"
            fontSize="23"
            fontWeight="600"
            fill={color[a.element]}
          >
            {chemicalLabel(nodeLabel(a))}
          </text>
          {a.charge && (
            <text x={a.x + 17} y={a.y - 12} fontSize="21" fill={color[a.element]}>
              {a.charge > 0 ? '+' : '−'}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
function History({ product, p, atoms }: { product: boolean; p: number; atoms: boolean }) {
  return (
    <div className="chem-wi-history">
      <div className="chem-wi-specimen">
        <svg viewBox="0 0 310 160" aria-hidden="true">
          <defs>
            <linearGradient id="chem-wi-glass" x2="1">
              <stop stopColor="#d9e4df" stopOpacity=".6" />
              <stop offset=".35" stopColor="#fff" stopOpacity=".25" />
              <stop offset="1" stopColor="#9ab7b0" stopOpacity=".35" />
            </linearGradient>
          </defs>
          <path
            d="M95 21V108Q95 139 155 139T215 108V21"
            fill="url(#chem-wi-glass)"
            stroke="#a5b7ae"
            strokeWidth="2"
          />
          <ellipse cx="155" cy="21" rx="60" ry="9" fill="none" stroke="#a5b7ae" strokeWidth="2" />
          <path d="M98 81Q155 91 212 81V108Q212 136 155 136T98 108Z" fill="#e0ded0" opacity=".4" />
          {Array.from({ length: 14 }, (_, i) => (
            <path
              key={i}
              d={`M${111 + ((i * 29) % 86)} ${103 + ((i * 11) % 24)}l8 -3 4 6 -9 4Z`}
              fill={product ? '#fafaf5' : '#eeede1'}
              stroke="#bfbba5"
              opacity={product ? ease(ramp(p, 0, 0.45)) : 1}
            />
          ))}
          <path d="M124 149H186" stroke="#b5a479" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <b>{t(product ? '尿素' : '氰酸铵')}</b>
        <span>{t('1828 · 维勒的转化证据')}</span>
      </div>
      <div className="chem-wi-structure">
        <Molecule s={wohler(product)} focus={atoms ? (p < 0.45 ? 'N-a' : 'N-b') : ''} />
        <strong>CH₄N₂O</strong>
      </div>
      <p className="chem-wi-boundary">
        {t('晶体外观不能鉴定结构；这里对照反应物与产物，不把连接图当作反应路径。')}
      </p>
    </div>
  );
}
function Pair({ items, focus }: { items: Isomer[]; focus: string }) {
  return (
    <div className="chem-wi-pair">
      {items.map((k) => (
        <div key={k}>
          <Molecule s={structure(k)} focus={focus} />
          <b>{t(moleculeNames[k])}</b>
        </div>
      ))}
    </div>
  );
}
function Overlap({ twist }: { twist: number }) {
  const r = (twist * Math.PI) / 180,
    y = 36 * Math.cos(r),
    z = 36 * Math.sin(r),
    right = (sign: number) => ({ x: 210 + sign * z * 0.65, y: 100 - sign * y });
  return (
    <div className="chem-wi-overlap">
      <svg viewBox="0 0 320 210" role="img" aria-label={t('两个p轨道侧向重叠与假想扭转')}>
        {[1, -1].map((sign) => {
          const pt = right(sign);
          return (
            <g key={sign}>
              <path
                d={`M110 ${100 - sign * 36}Q160 ${90 - sign * 40} ${pt.x} ${pt.y}`}
                stroke={sign === 1 ? '#a2b99c' : '#b69dab'}
                strokeWidth="24"
                fill="none"
                opacity={0.35 * piOverlap(twist)}
              />
              <ellipse
                cx="110"
                cy={100 - sign * 36}
                rx="19"
                ry="32"
                fill={sign === 1 ? '#a2b99c' : '#b69dab'}
                opacity=".65"
              />
              <ellipse
                cx={pt.x}
                cy={pt.y}
                rx="19"
                ry={15 + 17 * Math.abs(Math.cos(r))}
                fill={sign === 1 ? '#a2b99c' : '#b69dab'}
                opacity=".65"
              />
            </g>
          );
        })}
        <path d="M110 100H210" stroke="#77877d" strokeWidth="5" />
        {[110, 210].map((x) => (
          <g key={x}>
            <circle cx={x} cy="100" r="17" fill="#f6f4ed" stroke="#a1ada1" />
            <text x={x} y="107" textAnchor="middle" fontSize="22" fill="#53685e">
              C
            </text>
          </g>
        ))}
        <path
          d="M205 38Q255 63 257 105"
          fill="none"
          stroke="#b5a47d"
          strokeWidth="2"
          strokeDasharray="4 5"
        />
        <text x="160" y="180" textAnchor="middle" fontSize="22" fill="#6f7767">
          {Math.round(twist)}° · cos²θ = {piOverlap(twist).toFixed(2)}
        </text>
      </svg>
      <b>
        {t(
          twist > 85 ? '正交时，侧向重叠消失' : twist < 5 ? '平行时，侧向重叠存在' : '尚有侧向重叠',
        )}
      </b>
      <small>{t('假想扭转的几何示意；cos²θ仅表示重叠趋势，不是反应能量或转化率。')}</small>
    </div>
  );
}
function Stereo({
  cis,
  angle,
  terminal = false,
}: {
  cis: boolean;
  angle: number;
  terminal?: boolean;
}) {
  const a = alkene(cis, angle, terminal),
    p = (i: number) => ({ x: 155 + a[i].x * 70, y: 110 - a[i].y * 65 });
  const edges = [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 4],
    [1, 5],
  ];
  return (
    <svg viewBox="0 0 310 220" role="img" aria-label={t(cis ? '顺式烯烃结构' : '反式烯烃结构')}>
      <path d="M20 110H290" stroke="#cecdbd" strokeDasharray="4 6" />
      {edges.map(([i, j], k) => {
        const u = p(i),
          v = p(j);
        return (
          <g key={k}>
            <path
              d={`M${u.x} ${u.y + (k === 0 ? -4 : 0)}L${v.x} ${v.y + (k === 0 ? -4 : 0)}`}
              stroke="#8d9990"
              strokeWidth="3"
            />
            {k === 0 && (
              <path d={`M${u.x} ${u.y + 4}L${v.x} ${v.y + 4}`} stroke="#8d9990" strokeWidth="3" />
            )}
          </g>
        );
      })}
      {a.map((x, i) => {
        const pt = p(i);
        return (
          <g key={x.id}>
            <rect
              x={pt.x - 26}
              y={pt.y - 18}
              width="52"
              height="36"
              rx="14"
              fill={x.label === 'CH3' ? '#e4e9d5' : '#f4f2e9'}
            />
            <text
              x={pt.x}
              y={pt.y + 7}
              textAnchor="middle"
              fontSize="22"
              fontWeight={x.label === 'CH3' ? 600 : 400}
              fill="#55685d"
            >
              {chemicalLabel(x.label)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
export default function ChemWohlerIsomers({ variant }: { variant?: string }) {
  const f = useShowcase();
  const [mode, setMode] = useState<Mode>(
    modes.includes(variant as Mode) ? (variant as Mode) : 'origin',
  );
  const [kind, setKind] = useState<Isomer>('pentane');
  const [angle, setAngle] = useState(0);
  const [twist, setTwist] = useState(0);
  const [product, setProduct] = useState(false);
  const [terminal, setTerminal] = useState(false);
  const m = f.watch ? modes[Math.min(6, f.chapter)] : mode,
    p = f.watch ? f.chapterProgress : 1;
  const currentKind = f.watch
    ? (['pentane', 'isopentane', 'neopentane'] as const)[Math.min(2, Math.floor(p * 3))]
    : kind;
  const view = f.watch ? 25 * Math.sin(p * Math.PI * 2) : angle;
  return (
    <div className={`chem-wi ${f.watch ? 'is-watch' : ''}`}>
      <div className="chem-wi-stage">
        {(m === 'origin' || m === 'atoms') && (
          <History
            atoms={m === 'atoms'}
            product={f.watch ? m === 'atoms' || p > 0.55 : product}
            p={m === 'atoms' ? p : ramp(p, 0.55, 1)}
          />
        )}
        {m === 'skeleton' && (
          <div className="chem-wi-skeleton">
            <Molecule
              s={structure(currentKind)}
              focus={currentKind === 'neopentane' ? 'a0' : 'a1'}
            />
            <b>{t(moleculeNames[currentKind])}</b>
            <strong>C₅H₁₂</strong>
            <div className="chem-wi-bond-key">
              {['pentane', 'isopentane', 'neopentane'].map((k) => (
                <span key={k} className={k === currentKind ? 'active' : ''}>
                  {t(moleculeNames[k as Isomer])}
                </span>
              ))}
            </div>
          </div>
        )}
        {m === 'position' && (
          <>
            <Pair items={['but1', 'but2']} focus={p < 0.5 ? 'a0' : 'a1'} />
            <strong className="chem-wi-formula">C₄H₈</strong>
          </>
        )}
        {m === 'functional' && (
          <>
            <Pair items={['ethanol', 'ether']} focus="a1" />
            <strong className="chem-wi-formula">C₂H₆O</strong>
            <div className="chem-wi-key">
              <span>C—O—H</span>
              <span>C—O—C</span>
            </div>
          </>
        )}
        {m === 'overlap' && <Overlap twist={f.watch ? 90 * ease(ramp(p, 0.2, 0.75)) : twist} />}
        {m === 'cis' && (
          <>
            <div className="chem-wi-pair">
              <div>
                <Stereo cis angle={view} terminal={!f.watch && terminal} />
                <b>{t(!f.watch && terminal ? '一端连两个氢' : '顺-2-丁烯')}</b>
              </div>
              <div>
                <Stereo cis={false} angle={view} terminal={!f.watch && terminal} />
                <b>{t(!f.watch && terminal ? '同一结构的另一画法' : '反-2-丁烯')}</b>
              </div>
            </div>
            <p className="chem-wi-conclusion">
              {t(
                !f.watch && terminal
                  ? '一端连接相同基团，就不构成顺反异构。'
                  : '整体换观察角度，同侧和异侧的关系仍不同。',
              )}
            </p>
          </>
        )}
      </div>
      {!f.watch && (
        <div className="chem-wi-controls">
          <Segments
            label={t('观察内容')}
            value={mode}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          {(m === 'origin' || m === 'atoms') && (
            <Segments
              label={t('历史证据对象')}
              value={product ? 'product' : 'salt'}
              options={[
                { value: 'salt', label: t('氰酸铵') },
                { value: 'product', label: t('尿素') },
              ]}
              onChange={(v) => setProduct(v === 'product')}
            />
          )}
          {m === 'skeleton' && (
            <Segments
              label={t('碳骨架')}
              value={kind}
              options={(['pentane', 'isopentane', 'neopentane'] as Isomer[]).map((value) => ({
                value,
                label: t(moleculeNames[value]),
              }))}
              onChange={(v) => setKind(v as Isomer)}
            />
          )}
          {m === 'overlap' && (
            <Range
              label={t('假想轨道扭转')}
              value={twist}
              min={0}
              max={90}
              step={1}
              unit="°"
              onChange={setTwist}
            />
          )}
          {m === 'cis' && (
            <>
              <Range
                label={t('整体观察角度')}
                value={angle}
                min={-50}
                max={50}
                step={1}
                unit="°"
                onChange={setAngle}
              />
              <Segments
                label={t('双键两端')}
                value={terminal ? 'terminal' : 'internal'}
                options={[
                  { value: 'internal', label: t('2-丁烯') },
                  { value: 'terminal', label: t('丙烯反例') },
                ]}
                onChange={(v) => setTerminal(v === 'terminal')}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
