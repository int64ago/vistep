import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { fuseDefaults, fuseRun, fuseAt, fuseShot, FUSE_SILVER } from '../../models/electric-fuse';
import '../../styles/electric-fuse.css';
const thermal = (v: number) =>
  `hsl(${96 - Math.min(1, v / 1000) * 64} ${22 + Math.min(1, v / 1000) * 32}% ${48 + Math.min(1, v / 1000) * 7}%)`;
export default function ElectricFuse() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [current, setCurrent] = useState(2.2),
    [diameter, setDiameter] = useState(50),
    [ambient, setAmbient] = useState(20),
    [pulse, setPulse] = useState('held'),
    [position, setPosition] = useState(0.5),
    c = film.watch ? film.chapter : -1,
    manual = useMemo(
      () =>
        fuseRun({
          ...fuseDefaults(),
          current,
          diameter: diameter * 1e-6,
          ambient,
          pulse: pulse === 'held' ? Infinity : 0.008,
        }),
      [current, diameter, ambient, pulse],
    ),
    shot = film.watch
      ? fuseShot(c, film.chapterProgress)
      : { run: manual, state: fuseAt(manual, position * manual.frames.at(-1)!.time) },
    r = shot.run,
    s = shot.state,
    ref = useMemo(
      () =>
        c === 2
          ? fuseRun({ ...fuseDefaults(), current: 4, duration: 0.15 })
          : c === 3 || c === 4
            ? fuseRun(fuseDefaults())
            : c === 5
              ? fuseRun({ ...fuseDefaults(), current: 8, duration: 0.025 })
              : null,
      [c],
    ),
    end = Math.max(r.frames.at(-1)!.time, ref?.frames.at(-1)!.time ?? 0),
    melted = r.meltingTime !== null && s.time >= r.meltingTime - 1e-10,
    wireWidth = (r.parameters.diameter / 0.01) * 244,
    py = (v: number) => 96 - (v / 1000) * 70,
    px = (time: number) => 52 + (time / end) * 266,
    plot = (run: typeof r) =>
      run.frames.map((q, i) => `${i ? 'L' : 'M'}${px(q.time)} ${py(q.maximum)}`).join(' ');
  return (
    <div className="fuse-film" data-watch={film.watch}>
      <p className="fuse-context">
        {melted
          ? t('停在开始熔化：尚未模拟电弧熄灭')
          : c === 2
            ? s.time >= r.parameters.pulse
              ? t('短脉冲结束，余热向两端散去')
              : t('短脉冲仍在加热，尚未结束')
            : c === 4
              ? t('相同电流，较粗熔丝升温更慢')
              : t('电流持续发热，金属端帽持续导热')}
      </p>
      <svg
        className="fuse-body"
        viewBox="0 0 340 218"
        role="img"
        aria-label={t('玻璃管内的细银丝、端帽和由热模型计算的温度分布')}
      >
        <defs>
          <linearGradient id={`${id}-glass`} x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#eef1e5" stopOpacity=".6" />
            <stop offset=".45" stopColor="#dce4d0" stopOpacity=".15" />
            <stop offset="1" stopColor="#c6d3b5" stopOpacity=".35" />
          </linearGradient>
          <linearGradient id={`${id}-cap`} x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#c7cfb9" />
            <stop offset=".4" stopColor="#e3e7d7" />
            <stop offset="1" stopColor="#b2bfa0" />
          </linearGradient>
        </defs>
        <text x="19" y="24">
          I {s.current.toFixed(1)} A
        </text>
        <text x="321" y="24" textAnchor="end">
          Ø {(r.parameters.diameter * 1e6).toFixed(0)} µm
        </text>
        <rect
          x="28"
          y="48"
          width="284"
          height="65"
          rx="22"
          fill={`url(#${id}-glass)`}
          stroke="#c7d1bb"
        />
        <path d="M56 58H282" stroke="#eef2e5" strokeWidth="3" opacity=".9" />
        {s.temperature.map((temp, i) => {
          const x = 48 + (i / s.temperature.length) * 244,
            width = 244 / s.temperature.length;
          return (
            <g key={i}>
              <path
                d={`M${x} 81h${width + 0.3}`}
                stroke={thermal(temp)}
                strokeWidth="12"
                opacity={0.04 + (temp / 1000) * 0.2}
              />
              <path d={`M${x} 81h${width + 0.25}`} stroke={thermal(temp)} strokeWidth={wireWidth} />
            </g>
          );
        })}
        <rect
          x="16"
          y="45"
          width="38"
          height="71"
          rx="9"
          fill={`url(#${id}-cap)`}
          stroke="#b6c3a7"
        />
        <rect
          x="286"
          y="45"
          width="38"
          height="71"
          rx="9"
          fill={`url(#${id}-cap)`}
          stroke="#b6c3a7"
        />
        {s.loss > 0.001 && (
          <>
            <path
              d="M133 102H80l7 -4m-7 4 7 4M207 102h53l-7 -4m7 4-7 4"
              stroke="#94aa81"
              fill="none"
              strokeWidth="1.7"
            />
          </>
        )}
        {melted && <circle cx="170" cy="81" r="6" fill="none" stroke="#c09b62" strokeWidth="1.6" />}
        <text x="170" y="142" textAnchor="middle">
          {t('沿熔丝温度')}
        </text>
        <path d="M48 158V208H292" fill="none" stroke="#c6d0b9" />
        <path
          d={`M48 ${207 - (FUSE_SILVER.melting / 1000) * 47}H292`}
          fill="none"
          stroke="#baa67d"
          strokeDasharray="3 4"
        />
        <text x="0" y="166">
          1000
        </text>
        <text x="17" y="213">
          0
        </text>
        <text x="300" y="176">
          °C
        </text>
        <path
          d={`M48 ${207 - (r.parameters.ambient / 1000) * 47} ${s.temperature.map((temp, i) => `L${48 + ((i + 0.5) / s.temperature.length) * 244} ${207 - (temp / 1000) * 47}`).join(' ')} L292 ${207 - (r.parameters.ambient / 1000) * 47}`}
          fill="none"
          stroke="#8c9e78"
          strokeWidth="2.5"
        />
      </svg>
      <div className="fuse-readings">
        <span>
          {t('最热处')}
          <b>{s.maximum.toFixed(0)}°C</b>
        </span>
        <span>
          {t('已过时间')}
          <b>{(s.time * 1000).toFixed(1)} ms</b>
        </span>
      </div>
      {c === 0 ? (
        <div className="fuse-energy">
          <span>
            {t('发热')} {s.joule.toFixed(3)} W
          </span>
          <span>
            {t('导出')} {s.loss.toFixed(3)} W
          </span>
        </div>
      ) : (
        <div className="fuse-history">
          <svg viewBox="0 0 340 121" role="img" aria-label={t('最热点温度与首次熔化时间的对照')}>
            <path d="M52 18V100H318" fill="none" stroke="#c4ceb7" />
            <path
              d={`M52 ${py(FUSE_SILVER.melting)}H318`}
              fill="none"
              stroke="#c5b489"
              strokeDasharray="3 4"
            />
            <text x="300" y="19">
              °C
            </text>
            <text x="0" y="33">
              1000
            </text>
            <text x="21" y="101">
              0
            </text>
            <text x="52" y="120">
              0
            </text>
            <text x="318" y="120" textAnchor="end">
              {(end * 1000).toFixed(0)} ms
            </text>
            {ref && (
              <path
                d={plot(ref)}
                fill="none"
                stroke="#baa77d"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            )}
            <path d={plot(r)} stroke="#7e9978" fill="none" strokeWidth="2.6" />
            <circle cx={px(s.time)} cy={py(s.maximum)} r="4" fill="#7e9978" />
            {r.meltingTime !== null && (
              <circle cx={px(r.meltingTime)} cy={py(FUSE_SILVER.melting)} r="4" fill="#b29460" />
            )}
          </svg>
          {ref && (
            <p>
              {c === 2
                ? t('虚线：持续4 A；实线：8 ms脉冲')
                : c === 3
                  ? t('虚线：20°C；实线：80°C')
                  : c === 4
                    ? t('虚线：50 µm；实线：70 µm')
                    : t('虚线：8 A；实线：4 A')}
            </p>
          )}
        </div>
      )}
      {c === 5 && ref && (
        <p className="fuse-integral">
          I²t: 4 A → {r.meltingI2t!.toFixed(2)} · 8 A → {ref.meltingI2t!.toFixed(2)} A²s
        </p>
      )}
      {!film.watch && (
        <div className="fuse-controls">
          <Range
            label={t('规定电流')}
            value={current}
            min={0.5}
            max={8}
            step={0.1}
            unit="A"
            onChange={setCurrent}
          />
          <Range
            label={t('熔丝直径')}
            value={diameter}
            min={40}
            max={80}
            step={5}
            unit="µm"
            onChange={setDiameter}
          />
          <Range
            label={t('环境与端帽温度')}
            value={ambient}
            min={0}
            max={100}
            step={5}
            unit="°C"
            onChange={setAmbient}
          />
          <Segments
            label={t('电流持续方式')}
            value={pulse}
            options={[
              { value: 'held', label: t('持续') },
              { value: 'pulse', label: t('8 ms脉冲') },
            ]}
            onChange={setPulse}
          />
          <Range
            label={t('热过程位置')}
            value={position}
            min={0}
            max={1}
            step={0.01}
            onChange={setPosition}
          />
        </div>
      )}
      <details className="fuse-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '10 mm银丝的一维导热模型，端帽恒温；电阻随温度变化，其他物性取常数。计算止于最热处首次达到961.9°C，不计算熔化潜热、电弧、总开断时间或产品额定值。温度用伪彩表示。',
          )}
        </p>
      </details>
    </div>
  );
}
