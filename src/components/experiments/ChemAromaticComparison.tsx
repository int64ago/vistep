import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  partition,
  oxidize,
  tracer,
  layerColors,
  ringGeometry,
  tubeInterface,
  type Arene,
} from '../../models/chem-aromatic-comparison';
import '../../styles/chem-aromatic-comparison.css';
const modes = ['benzene-br', 'benzene-mn', 'paired-br', 'paired-mn', 'sidechain'] as const;
type Mode = (typeof modes)[number];
const names = [
  '苯中溴的去向',
  '苯与酸性高锰酸钾',
  '苯与甲苯：萃取对照',
  '苯与甲苯：氧化对照',
  '被氧化的是哪一部分',
];
function Tube({
  arene,
  reagent,
  contact,
  extent,
  k,
  volume,
  track = false,
}: {
  arene: Arene;
  reagent: 'bromine' | 'permanganate';
  contact: number;
  extent: number;
  k: number;
  volume: number;
  track?: boolean;
}) {
  const uid = useId().replace(/:/g, ''),
    part = partition(1, volume, 1, k, contact),
    rxn = oxidize(arene, extent),
    organicColor =
      reagent === 'bromine' ? layerColors(part.organicConcentration, 'bromine') : '#e7e9d2',
    waterColor =
      reagent === 'bromine'
        ? layerColors(part.waterConcentration, 'bromine')
        : layerColors(rxn.permanganate / 0.6, 'permanganate'),
    mark = tracer(contact),
    mix = 4 * contact * (1 - contact),
    top = 60,
    bottom = 270,
    inter = tubeInterface(volume);
  return (
    <div className="chem-ar-tube">
      <svg viewBox="0 0 200 310" role="img" aria-label={t('上层芳香烃，下层水相的试管')}>
        <defs>
          <clipPath id={uid}>
            <path d="M56 30V247Q56 283 100 283T144 247V30Z" />
          </clipPath>
          <linearGradient id={uid + 'glass'}>
            <stop stopColor="#c0d2c7" stopOpacity=".5" />
            <stop offset=".35" stopColor="#fff" stopOpacity=".08" />
            <stop offset="1" stopColor="#9db8a6" stopOpacity=".35" />
          </linearGradient>
        </defs>
        <g clipPath={`url(#${uid})`}>
          <rect x="56" y={top} width="88" height={inter - top} fill={organicColor} />
          <rect x="56" y={inter} width="88" height="240" fill={waterColor} />
          {Array.from({ length: 9 }, (_, i) => (
            <g key={i} opacity={mix * 0.45}>
              <ellipse
                cx={66 + ((i * 19) % 70)}
                cy={inter + (i % 2 ? 1 : -1) * (12 + ((i * 11) % 56)) * mix}
                rx={3 + (i % 3)}
                ry={4 + (i % 3)}
                fill={i % 2 ? organicColor : waterColor}
              />
            </g>
          ))}
          <path
            d={`M56 ${inter}Q100 ${inter + 3 * mix} 144 ${inter}`}
            stroke="#8b9d7e"
            strokeOpacity=".55"
            fill="none"
          />
          {track && reagent === 'bromine' && (
            <g
              transform={`translate(${mark.x} ${inter + (mark.y - 165) * Math.min((inter - top) / 105, (bottom - inter) / 105)})`}
            >
              <path d="M-6 0H6" stroke="#986a41" strokeWidth="3" />
              {mark.atoms.map((a) => (
                <circle
                  key={a.id}
                  cx={a.offset}
                  r="6"
                  fill="#a56d3b"
                  stroke="#fcf0cf"
                  strokeWidth="1.5"
                />
              ))}
            </g>
          )}
        </g>
        <path
          d="M52 23V248Q52 287 100 287T148 248V23"
          fill={`url(#${uid}glass)`}
          stroke="#a2b8a4"
          strokeWidth="2"
        />
        <ellipse cx="100" cy="23" rx="48" ry="8" fill="none" stroke="#a2b8a4" strokeWidth="2" />
        <path
          d="M63 40V246Q63 267 75 275"
          fill="none"
          stroke="#fafcf2"
          strokeOpacity=".75"
          strokeWidth="3"
        />
        <path
          d={`M150 ${top + (inter - top) / 2}H178M150 ${inter + (bottom - inter) / 2}H178`}
          stroke="#a5b292"
          strokeWidth="1.5"
        />
        <text
          x="176"
          y={top + (inter - top) / 2 - 5}
          textAnchor="middle"
          fontSize="22"
          fill="#6b7c61"
        >
          ①
        </text>
        <text
          x="176"
          y={inter + (bottom - inter) / 2 - 5}
          textAnchor="middle"
          fontSize="22"
          fill="#6b7c61"
        >
          ②
        </text>
      </svg>
      <b>{t(arene === 'benzene' ? '苯' : arene === 'toluene' ? '甲苯' : '叔丁基苯')}</b>
    </div>
  );
}
function Ring({ kind, product = false }: { kind: Arene; product?: boolean }) {
  const nodes = ringGeometry();
  return (
    <svg viewBox="25 15 290 180" role="img" aria-label={t('保持苯环，比较苄位碳的净变化')}>
      <path
        d={nodes.map((n, i) => `${i ? 'L' : 'M'}${n.x} ${n.y}`).join(' ') + 'Z'}
        fill="none"
        stroke="#7c947d"
        strokeWidth="3"
      />
      <circle cx="100" cy="100" r="26" stroke="#97aa87" strokeWidth="2" fill="none" />
      {kind !== 'benzene' && (
        <>
          <path d="M143 100H205" stroke="#899c7f" strokeWidth="3" />
          <circle cx="205" cy="100" r="27" fill="#dce4cd" stroke="#b1ba95" />
          {kind === 'toluene' && product ? (
            <>
              <path d="M205 76V45M211 76V45M229 100H265" stroke="#9f927c" strokeWidth="2.5" />
              <text x="205" y="108" textAnchor="middle" fontSize="23" fill="#7c845d">
                C
              </text>
              <text x="207" y="38" textAnchor="middle" fontSize="23" fill="#b18073">
                O
              </text>
              <text x="281" y="108" textAnchor="middle" fontSize="23" fill="#b18073">
                OH
              </text>
            </>
          ) : (
            <text x="205" y="108" textAnchor="middle" fontSize="23" fill="#7c845d">
              {kind === 'tertbutyl' ? 'C' : 'CH₃'}
            </text>
          )}
          {kind === 'tertbutyl' && (
            <>
              <path d="M205 74V45M205 126V155M231 100H267" stroke="#899c7f" strokeWidth="2.5" />
              <text x="205" y="38" textAnchor="middle" fontSize="22" fill="#70836a">
                CH₃
              </text>
              <text x="205" y="178" textAnchor="middle" fontSize="22" fill="#70836a">
                CH₃
              </text>
              <text x="284" y="108" textAnchor="middle" fontSize="22" fill="#70836a">
                CH₃
              </text>
            </>
          )}
        </>
      )}
    </svg>
  );
}
export default function ChemAromaticComparison({ variant }: { variant?: string }) {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(
      modes.includes(variant as Mode) ? (variant as Mode) : 'benzene-br',
    ),
    [contact, setContact] = useState(1),
    [extent, setExtent] = useState(1),
    [k, setK] = useState(8),
    [volume, setVolume] = useState(1),
    [kind, setKind] = useState<Arene>('toluene');
  const m = f.watch ? modes[Math.min(4, f.chapter)] : mode,
    p = f.watch ? f.chapterProgress : 1,
    br = m.includes('br'),
    paired = m.startsWith('paired'),
    c = f.watch ? ease(ramp(p, 0.18, 0.72)) : contact,
    e = f.watch ? ease(ramp(p, 0.3, 0.95)) : extent,
    K = f.watch ? 8 : k,
    v = f.watch ? 1 : volume,
    selected = f.watch ? 'toluene' : kind,
    part = partition(1, v, 1, K, c),
    r = oxidize('toluene', e);
  return (
    <div className={`chem-ar ${f.watch ? 'is-watch' : ''}`}>
      <div className="chem-ar-stage">
        {m === 'sidechain' ? (
          <div className="chem-ar-sidechain">
            <div className="chem-ar-structures">
              <div>
                <Ring kind={selected} />
                <b>
                  {t(selected === 'benzene' ? '苯' : selected === 'toluene' ? '甲苯' : '叔丁基苯')}
                </b>
              </div>
              <span className="chem-ar-arrow">→</span>
              <div style={{ opacity: !f.watch ? 1 : ramp(p, 0.2, 0.6) }}>
                <Ring kind={selected} product={selected === 'toluene'} />
                <b>{t(selected === 'toluene' ? '苄位碳成为羧基碳' : '该模型下不发生侧链氧化')}</b>
              </div>
            </div>
            <div className="chem-ar-reactive">
              <span>{t('苄位氢')}</span>
              <strong>{selected === 'toluene' ? 3 : 0}</strong>
            </div>
            <p>{t('净变化示意，不是基元反应路径；充分氧化需要相应条件。')}</p>
          </div>
        ) : (
          <>
            <div className={`chem-ar-tubes ${paired ? 'paired' : ''}`}>
              <Tube
                arene="benzene"
                reagent={br ? 'bromine' : 'permanganate'}
                contact={c}
                extent={e}
                k={K}
                volume={v}
                track={br}
              />
              {paired && (
                <Tube
                  arene="toluene"
                  reagent={br ? 'bromine' : 'permanganate'}
                  contact={c}
                  extent={e}
                  k={K}
                  volume={v}
                  track={br}
                />
              )}
            </div>
            <div className="chem-ar-phase-labels">
              <span>① {t('有机层')}</span>
              <span>② {t('水层')}</span>
            </div>
            <div className="chem-ar-readout">
              {br ? (
                <>
                  <span>
                    {t('水相中的溴')} <b>{(part.water * 100).toFixed(0)}%</b>
                  </span>
                  <span>
                    {t('有机相中的溴')} <b>{(part.organic * 100).toFixed(0)}%</b>
                  </span>
                  <strong>{t('总量守恒，没有化学消耗')}</strong>
                </>
              ) : paired ? (
                <>
                  <span>
                    {t('苯：MnO₄⁻保留')} <b>100%</b>
                  </span>
                  <span>
                    {t('甲苯：MnO₄⁻剩余')} <b>{((r.permanganate / 0.6) * 100).toFixed(0)}%</b>
                  </span>
                </>
              ) : (
                <strong>{t('所示条件下，苯不使紫色消失')}</strong>
              )}
            </div>
          </>
        )}
      </div>
      {!f.watch && (
        <div className="chem-ar-controls">
          <Segments
            label={t('观察内容')}
            value={mode}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          {m === 'sidechain' ? (
            <Segments
              label={t('苄位结构')}
              value={kind}
              options={[
                { value: 'toluene', label: t('甲苯') },
                { value: 'benzene', label: t('苯') },
                { value: 'tertbutyl', label: t('叔丁基苯反例') },
              ]}
              onChange={(v) => setKind(v as Arene)}
            />
          ) : br ? (
            <>
              <Range
                label={t('接触与分配进程')}
                value={contact}
                min={0}
                max={1}
                step={0.01}
                onChange={setContact}
              />
              <Range
                label={t('模型分配系数K')}
                value={k}
                min={1}
                max={12}
                step={0.5}
                onChange={setK}
              />
              <Range
                label={t('有机相与水相体积比')}
                value={volume}
                min={0.4}
                max={2.5}
                step={0.1}
                onChange={setVolume}
              />
            </>
          ) : (
            <Range
              label={t('模型氧化进程')}
              value={extent}
              min={0}
              max={1}
              step={0.01}
              onChange={setExtent}
            />
          )}
        </div>
      )}
      <small className="chem-ar-note">
        {t('颜色与进程为条件化教学模型；K与百分数不代表教材实测或反应时间。')}
      </small>
    </div>
  );
}
