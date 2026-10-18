import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  ice,
  centralId,
  shellIds,
  center,
  rotate,
  sub,
  add,
  mul,
  rearranged,
  hydrogenLinks,
  pairGeometry,
  bulk,
  floatGeometry,
  type Water,
  type V,
} from '../../models/chem-hydrogen-bond-network';
import '../../styles/chem-hydrogen-bond-network.css';
const modes = ['pair', 'shell', 'ice', 'melt', 'float'] as const;
type Mode = (typeof modes)[number];
const names = [
  '分子内与分子间',
  '四个四面体邻居',
  '开放的六方网络',
  '融化仍保留水分子',
  '等质量体积与浮起',
];
function Molecules({
  waters,
  yaw,
  pitch,
  kind,
  reveal = 1,
  score = 1,
}: {
  waters: Water[];
  yaw: number;
  pitch: number;
  kind: string;
  reveal?: number;
  score?: number;
}) {
  const uid = useId().replace(/:/g, ''),
    network = kind === 'ice' || kind === 'melt',
    pair = kind === 'pair';
  const all = waters.flatMap((w) => [w.o, ...w.h]);
  const xs = all.map((v) => v.x),
    ys = all.map((v) => v.y);
  const origin = pair
    ? {
        x: (Math.max(...xs) + Math.min(...xs)) / 2,
        y: (Math.max(...ys) + Math.min(...ys)) / 2,
        z: 0,
      }
    : network
      ? center
      : ice.find((w) => w.id === centralId)!.o;
  const scale = pair
    ? Math.min(
        65,
        246 / (Math.max(...xs) - Math.min(...xs)),
        130 / (Math.max(...ys) - Math.min(...ys)),
      )
    : network
      ? 12.8
      : 32;
  const project = (v: V) => {
    const p = rotate(sub(v, origin), yaw, pitch);
    return { x: 160 + p.x * scale, y: 140 - p.y * scale, z: p.z };
  };
  type Item = {
    z: number;
    key: string;
    shape: 'atom' | 'bond' | 'hydrogen';
    a: ReturnType<typeof project>;
    b?: ReturnType<typeof project>;
    r?: number;
    element?: string;
    opacity?: number;
    central?: boolean;
    donor?: boolean;
  };
  const items: Item[] = [];
  const addLine = (
    a: V,
    b: V,
    shape: 'bond' | 'hydrogen',
    key: string,
    opacity: number,
    donor = false,
  ) => {
    for (let k = 0; k < 6; k++) {
      const u = project(add(a, mul(sub(b, a), k / 6))),
        v = project(add(a, mul(sub(b, a), (k + 1) / 6)));
      items.push({ key: key + k, shape, a: u, b: v, z: (u.z + v.z) / 2, opacity, donor });
    }
  };
  waters.forEach((w) => {
    const central = w.id === centralId;
    const opacity = kind === 'shell' && !central ? Math.max(0.12, reveal) : 1;
    w.h.forEach((h, i) => addLine(w.o, h, 'bond', w.id + 'b' + i, opacity));
    items.push({
      key: w.id,
      shape: 'atom',
      a: project(w.o),
      z: project(w.o).z,
      element: 'O',
      r: pair ? 14 : network ? 5.7 : 11,
      opacity,
      central,
    });
    w.h.forEach((h, i) =>
      items.push({
        key: w.id + 'H' + i,
        shape: 'atom',
        a: project(h),
        z: project(h).z,
        element: 'H',
        r: pair ? 8 : network ? 3.6 : 6.3,
        opacity,
      }),
    );
  });
  const links = pair
    ? [{ a: waters[0].h[0], b: waters[1].o, score, from: 'donor', to: 'acceptor' }]
    : hydrogenLinks(waters).filter(
        (l) => kind !== 'shell' || l.from === centralId || l.to === centralId,
      );
  links.forEach((l, i) =>
    addLine(l.a, l.b, 'hydrogen', 'hb' + i, l.score * reveal, l.from === centralId),
  );
  items.sort((a, b) => a.z - b.z);
  const p0 = project(waters[0].o),
    p1 = pair ? project(waters[1].o) : p0;
  return (
    <svg
      className={`chb-molecules ${pair ? 'chb-pair' : ''}`}
      viewBox="0 0 320 280"
      role="img"
      aria-label={t('真实三维坐标投影的水分子，实线是共价键，虚线是氢键')}
    >
      <defs>
        {[
          ['O', '#ba8073'],
          ['H', '#e9e4cd'],
        ].map(([e, c]) => (
          <radialGradient key={e} id={`${uid}-${e}`} cx="30%" cy="25%" r="75%">
            <stop offset="0" stopColor="#fff8e8" />
            <stop offset=".4" stopColor={c} />
            <stop offset="1" stopColor={e === 'O' ? '#9d685e' : '#c7ccb8'} />
          </radialGradient>
        ))}
      </defs>
      {items.map((v) =>
        v.shape === 'atom' ? (
          <g key={v.key} opacity={v.opacity}>
            {v.central && (
              <circle
                cx={v.a.x}
                cy={v.a.y}
                r={v.r! + 4}
                fill="none"
                stroke="#ac8b48"
                strokeWidth="1.6"
              />
            )}
            <circle
              cx={v.a.x}
              cy={v.a.y}
              r={v.r}
              fill={`url(#${uid}-${v.element})`}
              stroke={v.element === 'O' ? '#a47768' : '#b9c2ad'}
              strokeWidth=".6"
            />
          </g>
        ) : (
          <line
            key={v.key}
            x1={v.a.x}
            y1={v.a.y}
            x2={v.b!.x}
            y2={v.b!.y}
            stroke={v.shape === 'bond' ? '#9ea58d' : v.donor ? '#a88a43' : '#669a9f'}
            strokeWidth={
              v.shape === 'bond' ? (network ? 2.7 : pair ? 6 : 4.4) : network ? 1.4 : 2.4
            }
            strokeDasharray={v.shape === 'hydrogen' ? '2 3' : undefined}
            opacity={v.opacity}
            strokeLinecap="round"
          />
        ),
      )}
      {pair && (
        <>
          <path
            d={`M${p0.x} ${p0.y + 18} V${p0.y + 38} M${p1.x} ${p1.y + 18} V${p1.y + 38} M${p0.x} ${p0.y + 32} L${p1.x} ${p1.y + 32}`}
            fill="none"
            stroke="#899b83"
            strokeWidth="1.5"
          />
          <text x={(p0.x + p1.x) / 2} y="249">
            O···O
          </text>
          <text x={p0.x - 5} y={p0.y - 25}>
            δ−
          </text>
          <text x={project(waters[0].h[0]).x} y={project(waters[0].h[0]).y - 16}>
            δ+
          </text>
        </>
      )}
      {!pair && (
        <>
          <path d={`M24 251 H${24 + 2 * scale}`} fill="none" stroke="#899b83" strokeWidth="2" />
          <text x={24 + scale} y="274">
            0.2 nm
          </text>
        </>
      )}
    </svg>
  );
}
function Float({ p, density }: { p: number; density: number }) {
  const a = bulk(92, density, 1),
    { h, y, waterY, immersed } = floatGeometry(ease(p), density);
  const waterTop = 160 - a.waterVolume * 0.7,
    iceTop = 160 - a.iceVolume * 0.7;
  return (
    <div className="chb-bulk">
      <div className="chb-volumes">
        <svg viewBox="0 0 320 205" role="img" aria-label={t('等质量的冰和水按密度换算体积')}>
          <path
            d="M38 36 V166 Q38 177 49 177 H119 Q130 177 130 166 V36 M190 36 V166 Q190 177 201 177 H271 Q282 177 282 166 V36"
            fill="none"
            stroke="#a6b7a8"
            strokeWidth="2"
          />
          <rect
            x="43"
            y={iceTop}
            width="82"
            height={170 - iceTop}
            rx="5"
            fill="#b5cbd0"
            fillOpacity=".75"
          />
          <rect
            x="195"
            y={waterTop}
            width="82"
            height={170 - waterTop}
            rx="5"
            fill="#a8c7ba"
            fillOpacity=".65"
          />
          <path
            d={`M43 ${iceTop} H125 M195 ${waterTop} H277`}
            fill="none"
            stroke="#6b979c"
            strokeWidth="2"
          />
          <text x="84" y="30">
            {t('冰')}
          </text>
          <text x="236" y="30">
            {t('水')}
          </text>
          <text x="84" y="202">
            {a.iceVolume.toFixed(1)} mL
          </text>
          <text x="236" y="202">
            {a.waterVolume.toFixed(1)} mL
          </text>
        </svg>
        <strong>{t('各取 92 g')}</strong>
      </div>
      <div className="chb-float">
        <svg viewBox="0 0 320 255" role="img" aria-label={t('浮体浸没比例由两种密度之比计算')}>
          <path
            d="M35 54 V232 Q35 243 47 243 H273 Q285 243 285 232 V54"
            fill="none"
            stroke="#a6b7a8"
            strokeWidth="3"
          />
          <rect
            x="39"
            y={waterY}
            width="242"
            height={237 - waterY}
            rx="3"
            fill="#bed6ca"
            fillOpacity=".62"
          />
          <rect
            x="108"
            y={y}
            width="104"
            height={h}
            rx="7"
            fill="#c3d8df"
            stroke="#759ca5"
            strokeWidth="2"
          />
          <path
            d={`M113 ${y + 8} L206 ${y + h - 8} M205 ${y + 8} L113 ${y + h - 8}`}
            fill="none"
            stroke="#eef5ed"
            strokeWidth="2"
            opacity=".65"
          />
          <path d={`M39 ${waterY} H281`} fill="none" stroke="#729e9a" strokeWidth="2" />
        </svg>
        <strong>
          {a.floats
            ? `${t('浸没体积')} ${((immersed / h) * 100).toFixed(0)}%`
            : t('密度较大，沉底')}
        </strong>
      </div>
    </div>
  );
}
export default function ChemHydrogenBondNetwork() {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>('pair'),
    [progress, setProgress] = useState(0.6),
    [yaw, setYaw] = useState(0.35),
    [pitch, setPitch] = useState(0.55),
    [angle, setAngle] = useState(0),
    [distance, setDistance] = useState(2.76),
    [density, setDensity] = useState(0.92);
  const m = f.watch ? modes[Math.min(4, f.chapter)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.12, 0.88)) : progress;
  const pair = pairGeometry(
    f.watch ? (p < 0.6 ? 0 : 45 * Math.sin(((p - 0.6) / 0.4) * Math.PI)) : angle,
    f.watch ? 2.76 : distance,
  );
  const waters =
    m === 'pair'
      ? pair.waters
      : m === 'shell'
        ? ice.filter((w) => shellIds.includes(w.id))
        : m === 'melt'
          ? rearranged(p)
          : ice;
  const y = f.watch ? (m === 'pair' ? 0 : 0.35 + p * 0.75) : m === 'pair' ? 0 : yaw,
    x = f.watch ? (m === 'pair' ? 0 : 0.55) : m === 'pair' ? 0 : pitch;
  return (
    <div className={`chb ${f.watch ? 'is-watch' : ''}`}>
      <div className={`chb-stage ${m === 'float' ? 'chb-stage-bulk' : ''}`}>
        {m === 'float' ? (
          <Float p={p} density={f.watch ? 0.92 : density} />
        ) : (
          <>
            <Molecules
              waters={waters}
              yaw={y}
              pitch={x}
              kind={m}
              reveal={m === 'shell' ? Math.min(1, p * 2) : 1}
              score={pair.score}
            />
            <div className="chb-reading">
              {m === 'pair' ? (
                <>
                  <strong>{(pair.distance * 100).toFixed(0)} pm</strong>
                  <span>O···O</span>
                  <p>{pair.score > 0.5 ? t('方向接近时形成氢键') : t('转离后，相互作用减弱')}</p>
                </>
              ) : m === 'shell' ? (
                <>
                  <strong>2 + 2 = 4</strong>
                  <span>{t('中心水分子的氢键')}</span>
                  <div className="chb-keys">
                    <span>
                      <i className="chb-donor" />
                      {t('提供氢的两条')}
                    </span>
                    <span>
                      <i className="chb-acceptor" />
                      {t('接受氢的两条')}
                    </span>
                  </div>
                </>
              ) : m === 'ice' ? (
                <>
                  <strong>{t('六方冰 Ih')}</strong>
                  <span>{t('规则排列留下空隙')}</span>
                  <p>{t('边缘只显示截取的邻居')}</p>
                </>
              ) : (
                <>
                  <strong>36 H₂O → 36 H₂O</strong>
                  <span>{t('分子完整，网络重排')}</span>
                  <p>{t('构造的重排示意，非分子动力学')}</p>
                </>
              )}
            </div>
          </>
        )}
      </div>
      <div className="chb-legend">
        {m === 'float' ? (
          <span>{t('近熔点参考值：冰 0.92，水 1.00 g/mL')}</span>
        ) : (
          <>
            <span>
              <i className="chb-solid" />
              {t('共价键')}
            </span>
            <span>
              <i className="chb-dashed" />
              {t('氢键')}
            </span>
          </>
        )}
      </div>
      {!f.watch && (
        <div className="chb-controls">
          <Segments
            label={t('观察内容')}
            value={m}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          {m === 'pair' ? (
            <>
              <Range
                label={t('受体偏转角（°）')}
                value={angle}
                min={0}
                max={70}
                step={1}
                onChange={setAngle}
              />
              <Range
                label={t('氧间距离（Å）')}
                value={distance}
                min={2.6}
                max={4}
                step={0.01}
                onChange={setDistance}
              />
            </>
          ) : m === 'float' ? (
            <>
              <Range
                label={t('演示进程')}
                value={progress}
                min={0}
                max={1}
                step={0.01}
                onChange={setProgress}
              />
              <Range
                label={t('假设固体密度（g/mL）')}
                value={density}
                min={0.8}
                max={1.2}
                step={0.01}
                onChange={setDensity}
              />
            </>
          ) : (
            <>
              <Range
                label={t('水平观察角')}
                value={yaw}
                min={-3.14}
                max={3.14}
                step={0.02}
                onChange={setYaw}
              />
              <Range
                label={t('垂直观察角')}
                value={pitch}
                min={-1}
                max={1}
                step={0.02}
                onChange={setPitch}
              />
              {m === 'melt' && (
                <Range
                  label={t('结构重排示意')}
                  value={progress}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setProgress}
                />
              )}
            </>
          )}
          <p>{t('长度与方向来自坐标；球半径、重排路线和时间为示意。')}</p>
        </div>
      )}
    </div>
  );
}
