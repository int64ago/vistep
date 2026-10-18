import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  saponify,
  saltOut,
  washCurd,
  hardWater,
  amphiphile,
  oilLift,
  esterGeometry,
} from '../../models/chem-soap-assembly';
import '../../styles/chem-soap-assembly.css';
const modes = ['hydrolysis', 'salting', 'washing', 'interface', 'cleaning', 'families'] as const;
type Mode = (typeof modes)[number];
const labels = [
  '三条酯键的皂化',
  '盐析分离',
  '洗涤与成形',
  '油水界面上的肥皂',
  '去污与硬水对照',
  '表面活性剂的类型',
];
function Ester({ p }: { p: number }) {
  return (
    <>
      <svg
        className="csa-ester"
        viewBox="0 0 365 220"
        role="img"
        aria-label={t('甘油骨架保留，三条酯键水解形成脂肪酸盐')}
      >
        <path d="M45 70V94M45 135V159" stroke="#8c9d80" strokeWidth="3" />
        {[0, 1, 2].map((i) => {
          const a = esterGeometry(i, p);
          return (
            <g key={a.id}>
              <path d={`M62 ${a.glycerolCarbon.y}H85`} stroke="#8c9d80" strokeWidth="3" />
              <path
                d={`M115 ${a.glycerolOxygen.y}L${a.acylCarbon.x - 15} ${a.acylCarbon.y}`}
                stroke="#bf9b69"
                strokeWidth="3"
                opacity={a.bond}
              />
              <path
                d={`M${a.acylCarbon.x - 3} ${a.acylCarbon.y - 12}V${a.carbonylOxygen.y + 8}M${a.acylCarbon.x + 3} ${a.acylCarbon.y - 12}V${a.carbonylOxygen.y + 8}M${a.acylCarbon.x + 15} ${a.acylCarbon.y}L${a.chainEnd.x} ${a.chainEnd.y}`}
                stroke="#8c9d80"
                strokeWidth="2.3"
              />
              <path
                d={`M${a.acylCarbon.x + 8} ${a.acylCarbon.y + 10}L${a.incomingOxygen.x - 4} ${a.incomingOxygen.y - 10}`}
                stroke="#b39374"
                strokeWidth="2.3"
                opacity={p}
              />
              <g textAnchor="middle">
                <text x="45" y={a.glycerolCarbon.y + 7}>
                  {i === 1 ? 'CH' : 'CH₂'}
                </text>
                <text x="100" y={a.glycerolOxygen.y + 7} fill="#aa7d68">
                  {p > 0.75 ? 'OH' : 'O'}
                </text>
                <text x={a.acylCarbon.x} y={a.acylCarbon.y + 7}>
                  C
                </text>
                <text x={a.carbonylOxygen.x} y={a.carbonylOxygen.y + 5} fill="#aa7d68">
                  O
                </text>
                <text x={a.chainEnd.x + 15} y={a.chainEnd.y + 7}>
                  R{i + 1}
                </text>
                <text x={a.incomingOxygen.x} y={a.incomingOxygen.y + 7} opacity={p} fill="#aa7d68">
                  O⁻
                </text>
              </g>
            </g>
          );
        })}
      </svg>
      <p className="csa-ester-note">{t('净连接变化，非基元反应轨迹')}</p>
    </>
  );
}
function Curd({ salt, wash, forming }: { salt: number; wash: number; forming: boolean }) {
  const s = saltOut(3, salt),
    id = useId().replace(/:/g, ''),
    c = s.curd / 3,
    residual = washCurd(wash);
  return (
    <>
      <svg
        className="csa-curd"
        viewBox="0 0 330 260"
        role="img"
        aria-label={t('上层皂块与含甘油的水相分开')}
      >
        <defs>
          <clipPath id={id}>
            <path d="M65 35V215Q65 235 85 235H245Q265 235 265 215V35Z" />
          </clipPath>
        </defs>
        {forming ? (
          <>
            <path d="M45 165H285L250 220H80Z" fill="#e5e2c6" stroke="#b2b397" strokeWidth="2" />
            <path
              d="M70 160Q90 142 112 154Q140 135 167 150Q197 137 220 152Q246 145 263 165L245 194H88Z"
              fill="#e5d9a7"
              stroke="#c6b88d"
            />
            <path d="M75 200H253" stroke="#97a68e" strokeWidth="3" strokeDasharray="3 5" />
            {[0, 1, 2, 3].map((i) => (
              <path
                key={i}
                d={`M${115 + i * 25} 40V${130 + (i % 2) * 10}`}
                stroke="#b6d2c3"
                strokeWidth="4"
                strokeDasharray="8 12"
                opacity={Math.min(1, wash / 2)}
              />
            ))}
            <g opacity={residual}>
              {Array.from({ length: 8 }, (_, i) => (
                <circle key={i} cx={101 + i * 18} cy={173 + (i % 3) * 5} r="4" fill="#a5bba2" />
              ))}
            </g>
          </>
        ) : (
          <>
            <g clipPath={`url(#${id})`}>
              <rect x="65" y="80" width="200" height="160" fill="#d1dfcd" />
              {Array.from({ length: 25 }, (_, i) => (
                <ellipse
                  key={i}
                  cx={79 + ((i * 31) % 172)}
                  cy={90 + ((i * 7) % 43)}
                  rx={9 + (i % 4)}
                  ry={4 + (i % 3)}
                  fill="#eee2b7"
                  opacity={c}
                />
              ))}
              {Array.from({ length: 14 }, (_, i) => (
                <circle
                  key={i}
                  cx={81 + ((i * 39) % 165)}
                  cy={150 + ((i * 23) % 65)}
                  r="3"
                  fill="#8fa88d"
                  opacity=".5"
                />
              ))}
            </g>
            <path
              d="M61 30V215Q61 239 85 239H245Q269 239 269 215V30"
              fill="none"
              stroke="#a1b39d"
              strokeWidth="2"
            />
          </>
        )}
      </svg>
      <p className="csa-ester-note">
        {t(forming ? '滤去母液，再洗涤和成形' : '甘油与盐主要留在母液中')}
      </p>
    </>
  );
}
function Interface({ p, agitation, active }: { p: number; agitation: number; active: number }) {
  const o = oilLift(p, agitation, active),
    assembly = p * Math.min(1, active / 3);
  return (
    <svg
      className="csa-interface"
      viewBox="0 0 320 280"
      role="img"
      aria-label={t('亲水头朝水，疏水链朝油，油滴从织物表面脱离')}
    >
      <rect x="5" y="6" width="310" height="265" rx="30" fill="#dce9dc" />
      <path d="M12 231Q40 223 65 232T118 231T171 232T225 232T307 233V270H12Z" fill="#c7bc98" />
      {Array.from({ length: 8 }, (_, i) => (
        <path
          key={i}
          d={`M15 ${238 + i * 4}Q80 ${230 + i * 4} 155 ${238 + i * 4}T305 ${238 + i * 4}`}
          stroke="#ac9f7a"
          strokeWidth="1"
          fill="none"
        />
      ))}
      <path
        d={`M143 ${o.y + 32}Q148 218 130 232H190Q172 218 177 ${o.y + 32}Z`}
        fill="#c9ad6e"
        opacity={1 - agitation * o.coverage}
      />
      <circle cx={o.x} cy={o.y} r={o.radius} fill="#c9ad6e" />
      <ellipse cx={o.x - 10} cy={o.y - 12} rx="24" ry="18" fill="#e2c78b" opacity=".5" />
      {Array.from({ length: 18 }, (_, i) => {
        const a = amphiphile(i, 18, assembly, o);
        return (
          <g key={a.id} opacity={active > 0 ? 1 : 0.18}>
            <path
              d={a.tail.map((v, j) => `${j ? 'L' : 'M'}${v.x} ${v.y}`).join(' ')}
              fill="none"
              stroke="#a89165"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            <circle
              cx={a.head.x}
              cy={a.head.y}
              r="5.5"
              fill="#779b82"
              stroke="#eef7e9"
              strokeWidth="1.3"
            />
          </g>
        );
      })}
      <text x="26" y="32">
        {t('水')}
      </text>
      <text x={o.x} y={o.y + 7} textAnchor="middle" fill="#f8efd3">
        {t('油')}
      </text>
      <text x="160" y="263" textAnchor="middle">
        {t('织物表面')}
      </text>
    </svg>
  );
}
const familyNames = ['阴离子型', '阳离子型', '非离子型', '两性型'];
function Families({ kind }: { kind: number }) {
  return (
    <div className="csa-families">
      <svg viewBox="0 0 330 170" role="img" aria-label={t('同一两亲结构，比较亲水基团类型')}>
        <path
          d="M35 95L60 83L85 95L110 83L135 95L160 83L185 95L210 83"
          fill="none"
          stroke="#b39a68"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <rect x="211" y="58" width="85" height="60" rx="28" fill="#cadccb" />
        <text x="254" y="98" textAnchor="middle">
          {['−', '+', '○', '±'][kind]}
        </text>
      </svg>
      <b>{t(familyNames[kind])}</b>
      <p>
        {t(
          [
            '羧酸盐肥皂：RCOO⁻',
            '季铵盐类：带正电亲水头',
            '聚氧乙烯类：不带净电荷',
            '甜菜碱类：同时具有正负电荷',
          ][kind],
        )}
      </p>
    </div>
  );
}
export default function ChemSoapAssembly({ variant }: { variant?: string }) {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(
      modes.includes(variant as Mode) ? (variant as Mode) : 'hydrolysis',
    ),
    [p0, setP] = useState(1),
    [salt, setSalt] = useState(1),
    [wash, setWash] = useState(3),
    [calcium, setCalcium] = useState(0),
    [agitation, setAgitation] = useState(1),
    [family, setFamily] = useState('0');
  const m = f.watch ? modes[Math.min(5, f.chapter)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.12, 0.88)) : p0,
    h = saponify(p),
    ca = f.watch ? 0 : calcium,
    hard = hardWater(3, ca),
    sal = f.watch ? p : salt,
    w = f.watch ? 3 * p : wash;
  return (
    <div className={`csa ${f.watch ? 'is-watch' : ''}`}>
      <div className="csa-stage">
        {m === 'hydrolysis' ? (
          <>
            <Ester p={p} />
            <div className="csa-balance">
              <span>
                {t('甘油')} <b>{h.glycerol.toFixed(1)}</b>
              </span>
              <span>
                {t('脂肪酸盐')} <b>{h.soap.toFixed(1)}</b>
              </span>
            </div>
          </>
        ) : m === 'salting' || m === 'washing' ? (
          <>
            <Curd salt={m === 'washing' ? 1 : sal} wash={w} forming={m === 'washing'} />
            <div className="csa-balance">
              {m === 'salting' ? (
                <span>
                  {t('分离皂相')} <b>{((saltOut(3, sal).curd / 3) * 100).toFixed(0)}%</b>
                </span>
              ) : (
                <span>
                  {t('示意母液杂质剩余')} <b>{(washCurd(w) * 100).toFixed(0)}%</b>
                </span>
              )}
            </div>
          </>
        ) : m === 'families' ? (
          <Families
            kind={f.watch ? Math.min(3, Math.floor(f.chapterProgress * 4)) : Number(family)}
          />
        ) : (
          <>
            <Interface
              p={m === 'interface' ? p : 1}
              agitation={m === 'cleaning' ? (f.watch ? p : agitation) : 0}
              active={hard.active}
            />
            <div className="csa-interface-key">
              <span>
                <i />
                {t('亲水头朝向水')}
              </span>
              <span>
                <i className="tail" />
                {t('疏水链进入油相')}
              </span>
            </div>
            {!f.watch && (
              <p className="csa-hard">
                {t('可用肥皂相对量')} {hard.active.toFixed(1)} / 3
              </p>
            )}
          </>
        )}
      </div>
      {!f.watch && (
        <div className="csa-controls">
          <Segments
            label={t('从制备到去污')}
            value={mode}
            options={modes.map((value, i) => ({ value, label: t(labels[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          {m === 'families' ? (
            <Segments
              label={t('亲水基团类型')}
              value={family}
              options={familyNames.map((label, i) => ({ value: String(i), label: t(label) }))}
              onChange={setFamily}
            />
          ) : (
            <Range label={t('教学进程')} value={p0} min={0} max={1} step={0.01} onChange={setP} />
          )}{' '}
          {m === 'salting' && (
            <Range
              label={t('模型盐加入程度')}
              value={salt}
              min={0}
              max={2}
              step={0.05}
              onChange={setSalt}
            />
          )}{' '}
          {m === 'washing' && (
            <Range
              label={t('模型洗液体积比')}
              value={wash}
              min={0}
              max={5}
              step={0.1}
              onChange={setWash}
            />
          )}{' '}
          {(m === 'cleaning' || m === 'interface') && (
            <>
              <Range
                label={t('Ca²⁺ 相对量')}
                value={calcium}
                min={0}
                max={1.5}
                step={0.05}
                onChange={setCalcium}
              />
              {m === 'cleaning' && (
                <Range
                  label={t('界面润湿后的扰动')}
                  value={agitation}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setAgitation}
                />
              )}
            </>
          )}
        </div>
      )}
      <small className="csa-note">
        {t('界面排列与条件化分离模型；不是实际皂方、临界胶束浓度或去污率预测。')}
      </small>
    </div>
  );
}
