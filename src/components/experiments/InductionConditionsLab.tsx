import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  rodInduction,
  coilInduction,
  inductionProjection as P,
  type RodPath,
  type CoilPath,
} from '../../models/induction-conditions-lab';
import '../../styles/induction-conditions-lab.css';
const CP = (x: number, y: number, z: number) =>
  [200 + 650 * x + 250 * z, 175 - 700 * y - 120 * z] as const;
function coilPath(center: number, length: number, radius: number, turns: number, front: boolean) {
  let d = '',
    pen = false;
  for (let i = 0; i <= turns * 48; i++) {
    const phi = (2 * Math.PI * i) / 48,
      z = radius * Math.sin(phi),
      point = CP(center - length / 2 + (length * i) / (turns * 48), radius * Math.cos(phi), z);
    if (!front || z >= 0) {
      d += `${pen ? 'L' : 'M'}${point}`;
      pen = true;
    } else pen = false;
  }
  return d;
}
function Galvanometer({
  x,
  y,
  current,
  scale = 40e-6,
}: {
  x: number;
  y: number;
  current: number;
  scale?: number;
}) {
  const a = Math.max(-1, Math.min(1, current / scale)) * 0.95;
  return (
    <g>
      <circle cx={x} cy={y} r="28" fill="#edf1df" stroke="#b4c2a0" strokeWidth="1.5" />
      <path
        d={`M${x - 22} ${y - 5}Q${x} ${y - 27} ${x + 22} ${y - 5}`}
        fill="none"
        stroke="#c2cbb2"
      />
      <path
        d={`M${x} ${y + 7}L${x + 23 * Math.sin(a)} ${y + 7 - 23 * Math.cos(a)}`}
        stroke="#ab9165"
        strokeWidth="2.1"
      />
      <circle cx={x} cy={y + 7} r="2.5" fill="#a58e68" />
      <text x={x} y={y + 25} textAnchor="middle">
        G
      </text>
    </g>
  );
}
function RodView({ path, time, speed }: { path: RodPath; time: number; speed: number }) {
  const s = rodInduction(path, time, 0.3, speed),
    a = P(s.x, 0.09, s.z),
    b = P(s.x, -0.09, s.z),
    g = P(0, 0, s.z);
  return (
    <>
      <svg
        viewBox="0 0 400 290"
        className="ic-apparatus"
        role="img"
        aria-label={t('闭合导轨回路与滑杆，沿磁场整体平移时接触保持闭合')}
      >
        <path d="M45 100L305 100L365 240L105 240Z" fill="#e2ebd8" opacity=".55" />
        {Array.from({ length: 15 }, (_, i) => {
          const q = P(0.03 + 0.06 * (i % 5), -0.07 + 0.07 * Math.floor(i / 5), 0);
          return (
            <g key={i} stroke="#b3c3a5" strokeWidth="1.4">
              <path d={`M${q}l11-8m-3 7 3-7-8 1`} />
            </g>
          );
        })}
        <text x="332" y="115">
          B
        </text>
        <path
          d={`M${P(0.33, 0.09, s.z)}L${P(0, 0.09, s.z)}L${P(0, 0.045, s.z)}M${P(0, -0.045, s.z)}L${P(0, -0.09, s.z)}L${P(0.33, -0.09, s.z)}`}
          stroke="#a4b598"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={`M${P(0, 0.09, s.z)}L${a}L${b}L${P(0, -0.09, s.z)}Z`}
          fill="#c9d8b8"
          opacity=".22"
        />
        <path d={`M${a}L${b}`} stroke="#bb9f6a" strokeWidth="7" strokeLinecap="round" />
        <circle cx={a[0]} cy={a[1]} r="5" fill="#a38e63" />
        <circle cx={b[0]} cy={b[1]} r="5" fill="#a38e63" />
        <text x={a[0] + 12} y={a[1] - 8}>
          A
        </text>
        <text x={b[0] + 12} y={b[1] + 22}>
          B
        </text>
        <Galvanometer x={g[0]} y={g[1]} current={s.current} scale={0.002} />
        {Math.abs(s.vx) + Math.abs(s.vz) > 0 && (
          <path
            d={`M${P(s.x, 0.125, s.z)}l${s.vx ? Math.sign(s.vx) * 42 : Math.sign(s.vz) * 24} ${s.vx ? 0 : -Math.sign(s.vz) * 17}`}
            stroke="#9caf8e"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
      </svg>
      <p className="ic-subtitle">
        {path === 'along-field'
          ? t('整个闭合回路沿 B 平移')
          : path === 'cutting'
            ? t('滑杆改变回路面积')
            : t('滑杆静止，磁通量不变')}
      </p>
      <div className="ic-readings">
        <span>Φ = {(s.flux * 1000).toFixed(2)} mWb</span>
        <span>ε = {(s.emf * 1000).toFixed(2)} mV</span>
        <span>I = {(s.current * 1000).toFixed(2)} mA</span>
      </div>
    </>
  );
}
function CoilView({ path, time, speed }: { path: CoilPath; time: number; speed: number }) {
  const s = coilInduction(path, time, speed),
    a = CP(s.offset - 0.02, 0.02, 0),
    b = CP(s.offset + 0.02, 0.02, 0),
    outerA = CP(-0.05, 0.055, 0),
    outerB = CP(0.05, 0.055, 0),
    wiper = 170 + 80 * (s.rheostat / 20);
  return (
    <>
      <svg
        viewBox="0 0 400 365"
        className="ic-apparatus"
        role="img"
        aria-label={t('线圈 A 通过电源开关变阻器供电，线圈 B 独立接灵敏电流表')}
      >
        <path
          d={`M${outerA}C90 120 80 65 172 65M228 65C320 65 310 120 ${outerB}`}
          stroke="#a8b89b"
          strokeWidth="2.5"
          fill="none"
        />
        <Galvanometer x={200} y={65} current={s.current} />
        <path d={coilPath(0, 0.1, 0.055, 9, false)} stroke="#bdc9ad" strokeWidth="3" fill="none" />
        <path
          d={coilPath(s.offset, 0.04, 0.02, 6, false)}
          stroke="#b69d73"
          strokeWidth="3"
          fill="none"
        />
        <path
          d={coilPath(s.offset, 0.04, 0.02, 6, true)}
          stroke="#b69d73"
          strokeWidth="3"
          fill="none"
        />
        <path d={coilPath(0, 0.1, 0.055, 9, true)} stroke="#9eaf8e" strokeWidth="3" fill="none" />
        <text x="137" y="179">
          B
        </text>
        <text x={CP(s.offset, 0, 0)[0]} y="229" textAnchor="middle">
          A
        </text>
        <path
          d={`M${a}C70 215 25 235 25 300H50M90 300H100M140 300H170M${wiper} 280H374V245Q375 220 ${b}`}
          stroke="#b5a27e"
          strokeWidth="2.2"
          fill="none"
        />
        <path
          d={`M50 300L${s.closed ? 90 : 85} ${s.closed ? 300 : 280}`}
          stroke="#9aaa89"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="50" cy="300" r="3" fill="#9aaa89" />
        <circle cx="90" cy="300" r="3" fill="#9aaa89" />
        <rect x="100" y="285" width="40" height="30" rx="8" fill="#c4ceae" />
        <text x="107" y="307">
          +
        </text>
        <text x="126" y="307">
          −
        </text>
        <rect x="170" y="291" width="80" height="18" rx="5" fill="#e1e7d3" stroke="#adba98" />
        <path
          d="M176 295l5 10 5-10 5 10 5-10 5 10 5-10 5 10 5-10 5 10 5-10 5 10 5-10 5 10"
          stroke="#b4a583"
          fill="none"
        />
        <path d={`M${wiper} 280v13m-4-6 4 6 4-6`} stroke="#a18f6c" strokeWidth="2" fill="none" />
        <text x="73" y="340" textAnchor="middle">
          S
        </text>
        <text x="210" y="340" textAnchor="middle">
          R
        </text>
        {s.transition && (path === 'close' || path === 'open') && (
          <circle cx="89" cy="298" r="10" fill="#c4ab7d" opacity=".16" />
        )}
      </svg>
      <div className="ic-readings">
        <span>I₁ = {s.primary.toFixed(2)} A</span>
        <span>N₂Φ = {(s.fluxLinkage * 1000).toFixed(3)} mWb</span>
        <span>I₂ = {(s.current * 1e6).toFixed(1)} µA</span>
      </div>
    </>
  );
}
const rodOptions = [
  { value: 'still' as const, label: '静止' },
  { value: 'along-field' as const, label: '沿磁场运动' },
  { value: 'cutting' as const, label: '切割磁场' },
];
const coilOptions = [
  { value: 'close' as const, label: '闭合开关' },
  { value: 'open' as const, label: '断开开关' },
  { value: 'rheostat' as const, label: '移动变阻器滑片' },
  { value: 'insert' as const, label: '插入与拔出线圈' },
];
export default function InductionConditionsLab() {
  const film = useShowcase(),
    [apparatus, setApparatus] = useState<'rod' | 'coils'>(
      film.variant === 'r3-induced-current-conditions' ? 'coils' : 'rod',
    ),
    [rod, setRod] = useState<RodPath>('cutting'),
    [coil, setCoil] = useState<CoilPath>('close'),
    [time, setTime] = useState(2.5),
    [speed, setSpeed] = useState(1);
  const c = film.chapter,
    mode = film.watch ? (c < 3 ? 'rod' : 'coils') : apparatus,
    rp = film.watch ? (['still', 'along-field', 'cutting'][Math.min(c, 2)] as RodPath) : rod,
    cp = film.watch
      ? (['close', 'open', 'rheostat', 'insert'][Math.max(0, c - 3)] as CoilPath)
      : coil,
    seconds = film.watch ? film.chapterProgress * 10 : time,
    rate = film.watch ? 1 : speed;
  const label =
    mode === 'rod'
      ? rp === 'still'
        ? '静止时没有磁通量变化'
        : rp === 'along-field'
          ? '沿 B 平移，面积和磁通量保持不变'
          : '切割磁场，改变回路面积'
      : cp === 'close'
        ? '电流增长时偏转，稳定后归零'
        : cp === 'open'
          ? '电流减小时，感应方向相反'
          : cp === 'rheostat'
            ? '滑片移动改变电流，停下后不再感应'
            : '供电电流不变，插拔仍改变磁通量';
  return (
    <section className="ic-film" data-watch={film.watch || undefined} data-chapter={film.chapter}>
      <p className="ic-kicker">{t(label)}</p>
      {mode === 'rod' ? (
        <RodView path={rp} time={seconds} speed={rate} />
      ) : (
        <CoilView path={cp} time={seconds} speed={rate} />
      )}
      {!film.watch && (
        <div className="ic-controls">
          <Segments
            label={t('选择感应装置')}
            value={apparatus}
            onChange={setApparatus}
            options={[
              { value: 'rod', label: t('滑杆回路') },
              { value: 'coils', label: t('内外线圈') },
            ]}
          />
          {mode === 'rod' ? (
            <Segments
              label={t('滑杆运动路径')}
              value={rod}
              onChange={setRod}
              options={rodOptions.map((o) => ({ ...o, label: t(o.label) }))}
            />
          ) : (
            <Segments
              label={t('线圈实验路径')}
              value={coil}
              onChange={setCoil}
              options={coilOptions.map((o) => ({ ...o, label: t(o.label) }))}
            />
          )}
          <Range
            label={t('观察路径时间')}
            value={time}
            min={0}
            max={10 / speed}
            step={0.05}
            unit="s"
            onChange={setTime}
          />
          <Range
            label={t('动作速度倍率')}
            value={speed}
            min={0.5}
            max={2}
            step={0.25}
            unit="×"
            onChange={(v) => {
              setSpeed(v);
              setTime(Math.min(time, 10 / v));
            }}
          />
        </div>
      )}
      <details className="ic-details">
        <summary>{t('磁通量与示意时间的边界')}</summary>
        <p>
          {t(
            '滑杆沿磁场对照中，整个导轨回路一起平移以保持接触闭合；切割时只有杆沿轨滑动。线圈采用小半径内线圈对外螺线管轴向场的平均近似，绘出的匝数为代表匝。开关电流变化窗口被平滑放慢，不重建真实开断火花、自感瞬态或电流表机械振荡。其余数值由 ε = −d(NΦ)/dt 与 I₂ = ε/R₂ 计算，不能把大磁通量本身当成感应条件。',
          )}
        </p>
      </details>
    </section>
  );
}
