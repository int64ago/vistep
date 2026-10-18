import { useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  compressionFire,
  jouleCalorimeter,
  cloudBottle,
  rumfordHeating,
} from '../../models/thermodynamic-work-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
const labels = ['压缩引火', '重物搅水', '发电机电热量热', '瓶中膨胀起雾', '伦福德镗孔'];
export default function ThermodynamicWorkLab() {
  const film = useShowcase();
  const initial = film.variant?.includes('compression')
    ? 0
    : film.variant?.includes('paddle')
      ? 1
      : film.variant?.includes('electrical')
        ? 2
        : film.variant?.includes('cloud')
          ? 3
          : film.variant?.includes('rumford')
            ? 4
            : 0;
  const [mode, setMode] = useState(String(initial)),
    [progress, setProgress] = useState(0.7),
    [process, setProcess] = useState('fast'),
    [mass, setMass] = useState(10),
    [height, setHeight] = useState(1),
    [duration, setDuration] = useState(12);
  const stage = film.chapter,
    p = film.watch ? film.chapterProgress : progress,
    kind = film.watch ? Math.floor(stage / 2) : Number(mode),
    fast = film.watch ? stage === 0 : process === 'fast',
    compression = compressionFire(p, fast),
    m = film.watch ? (stage === 3 ? 5 : 10) : mass,
    h = film.watch ? (stage === 3 ? 2 : 1) : height,
    seconds = film.watch ? (stage === 5 ? 24 : 12) : duration,
    joule = jouleCalorimeter(p, m, h, seconds),
    cloud = cloudBottle(film.watch && stage === 6 ? 0 : p),
    rumford = rumfordHeating(film.watch ? (stage === 8 ? p * 1800 : 1800 + p * 2200) : p * 4000),
    piston = 250 - 180 / compression.ratio,
    weightY = 98 + joule.drop * 70,
    corkRise = film.watch && stage === 6 ? 0 : p * 57;
  return (
    <div className="textbook-em thermodynamic-work-lab">
      <div className="textbook-em-state">
        <span>{t(labels[kind])}</span>
        <span>
          {kind === 0
            ? `${(compression.temperature - 273.15).toFixed(1)} °C`
            : kind < 3
              ? `${joule.temperature.toFixed(3)} °C`
              : kind === 3
                ? `${((film.watch && stage === 6 ? 101325 + 18675 * p : cloud.pressure) / 1000).toFixed(1)} kPa`
                : `${rumford.temperature.toFixed(1)} °C`}
        </span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 320"
        role="img"
        aria-label={t('压缩、机械量热、电热量热、瓶中云与摩擦生热五套装置')}
      >
        {kind === 0 && (
          <>
            <path d="M126 56V254H234V56" fill="#e4ecda" stroke="#a4b995" strokeWidth="4" />
            <path
              d={`M130 ${piston}H230V250H130Z`}
              fill={compression.ignited ? '#e4d8b5' : '#d5e2c8'}
            />
            <rect x="129" y={piston - 10} width="102" height="10" rx="3" fill="#a6b797" />
            <path
              d={`M180 ${piston - 10}V${piston - 43}m-27 0h54`}
              stroke="#8ea280"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path d="M163 248q3-8 8-4q4-11 9-1q5-7 11 5Z" fill="#ede8ce" stroke="#c8bd95" />
            {compression.ignited && (
              <path d="M170 247q-9-9 0-20q0 8 7 9q-1-9 5-15q8 17 3 26Z" fill="#c8a16b" />
            )}
            {Array.from({ length: 20 }, (_, i) => (
              <circle
                key={i}
                cx={139 + ((i * 37) % 82)}
                cy={piston + 3 + (((i * 23) % 93) / 100) * Math.max(2, 245 - piston)}
                r="2"
                fill="#a6bb8f"
              />
            ))}
            <path d="M251 250V70m-5 0h10m-10 180h10" stroke="#afc29d" fill="none" />
          </>
        )}
        {kind === 1 && (
          <>
            <path
              d="M111 148V251Q111 262 122 262H238Q249 262 249 251V148"
              fill="#dee7d1"
              stroke="#a6ba95"
              strokeWidth="4"
            />
            <path d="M116 180H244V250Q244 257 236 257H124Q116 257 116 250Z" fill="#c1d8c9" />
            <path
              d={`M46 ${weightY}V80A14 14 0 0 1 60 66H180M180 94H300A14 14 0 0 0 314 80V${weightY}`}
              stroke="#b39b69"
              fill="none"
              strokeWidth="2"
            />
            {[60, 300].map((cx) => (
              <g key={cx}>
                <circle cx={cx} cy="80" r="14" stroke="#9baf88" strokeWidth="3" fill="none" />
                <circle cx={cx} cy="80" r="3" fill="#a4b693" />
              </g>
            ))}
            <path d="M180 45V224" stroke="#8fa180" strokeWidth="4" />
            <rect x="165" y="58" width="30" height="47" rx="6" fill="#d0c096" stroke="#af9867" />
            {Array.from({ length: 5 }, (_, i) => (
              <path key={i} d={`M166 ${63 + i * 8}q14 5 28 0`} fill="none" stroke="#a89060" />
            ))}
            {[46, 314].map((cx) => (
              <g key={cx}>
                <rect
                  x={cx - 16}
                  y={weightY}
                  width="32"
                  height="26"
                  rx="4"
                  fill="#b3bea4"
                  stroke="#96aa83"
                />
                <text
                  className="em-small"
                  x={cx}
                  y={weightY + 44}
                  textAnchor="middle"
                >{`${m / 2} kg`}</text>
              </g>
            ))}
            {[0, 1, 2, 3].map((i) => {
              const a = joule.angle + (i * Math.PI) / 2,
                x = 180 + 46 * Math.cos(a),
                depth = 12 * Math.sin(a);
              return (
                <path
                  key={i}
                  d={`M180 195L${x} ${195 + depth}V${215 + depth}L180 215Z`}
                  fill={Math.sin(a) > 0 ? '#9eb18e' : '#b3c2a3'}
                  stroke="#8fa681"
                />
              );
            })}
            <rect x="231" y="148" width="6" height="89" rx="3" fill="#eff2e4" stroke="#a3b795" />
            <path
              d={`M234 233V${233 - (joule.temperature - 20) * 80}`}
              stroke="#bb9063"
              strokeWidth="2"
            />
          </>
        )}
        {kind === 2 && (
          <>
            <path
              d={`M62 ${weightY + 14}V90A14 14 0 0 1 76 76H148`}
              stroke="#b49d6d"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="76" cy="90" r="14" stroke="#9caf88" strokeWidth="3" fill="none" />
            <rect
              x="45"
              y={weightY + 14}
              width="34"
              height="28"
              rx="4"
              fill="#b4bea5"
              stroke="#98ac86"
            />
            <text
              className="em-small"
              x="62"
              y={weightY + 60}
              textAnchor="middle"
            >{`${m} kg`}</text>
            <circle cx="148" cy="105" r="28" fill="#d9e2cb" stroke="#9fb58e" strokeWidth="3" />
            <path
              d={`M${148 - Math.cos(joule.angle) * 24} ${105 - Math.sin(joule.angle) * 24}L${148 + Math.cos(joule.angle) * 24} ${105 + Math.sin(joule.angle) * 24}`}
              stroke="#aebf9b"
              strokeWidth="4"
            />
            <rect x="160" y="92" width="29" height="48" rx="5" fill="#c2d0b1" stroke="#98ae85" />
            <text x="148" y="171" textAnchor="middle">
              {t('发电机')}
            </text>
            <path
              d="M175 103H251V207M175 124H215V156H291V207"
              stroke="#a18c62"
              strokeWidth="2.5"
              fill="none"
            />
            <path
              d="M228 168V253Q228 260 235 260H313Q320 260 320 253V168"
              fill="#e1e9d7"
              stroke="#a8bb9b"
              strokeWidth="3"
            />
            <path d="M232 190H316V251Q316 256 311 256H237Q232 256 232 251Z" fill="#c1d8c9" />
            <path
              d="M251 207l4-7 5 14 5-14 5 14 5-14 5 14 5-14 6 7"
              stroke="#b68f5f"
              strokeWidth="3"
              fill="none"
            />
            <path d="M251 168V207M291 168V207" stroke="#a18c62" strokeWidth="2.5" />
            <rect x="304" y="149" width="6" height="89" rx="3" fill="#eff2e4" stroke="#a3b795" />
            <path
              d={`M307 234V${234 - (joule.temperature - 20) * 80}`}
              stroke="#bb9063"
              strokeWidth="2"
            />
          </>
        )}
        {kind === 3 && (
          <>
            <path
              d="M162 77V108Q129 119 129 144V253Q129 263 139 263H221Q231 263 231 253V144Q231 119 198 108V77"
              fill="#e5edde"
              stroke="#a7bc9a"
              strokeWidth="3"
            />
            <path d="M133 240H227V252Q227 259 220 259H140Q133 259 133 252Z" fill="#b7d2c5" />
            <g transform={`translate(0 ${-corkRise})`}>
              <path d="M157 77h46l-4 18h-38Z" fill="#bca779" stroke="#a58f63" />
              <path d="M180 68v24" stroke="#94a38a" strokeWidth="4" />
            </g>
            {film.watch && stage === 6 && (
              <>
                <path d="M180 68Q105 32 69 134V164" stroke="#a9ba9b" strokeWidth="3" fill="none" />
                <rect
                  x="59"
                  y="164"
                  width="20"
                  height="72"
                  rx="4"
                  fill="#c7d4b8"
                  stroke="#9caf88"
                />
                <path
                  d={`M69 164V${142 - 18 * Math.sin(p * Math.PI * 8)}m-14 0h28`}
                  stroke="#9bad89"
                  strokeWidth="4"
                />
              </>
            )}
            {(!film.watch || stage === 7) &&
              Array.from({ length: 70 }, (_, i) => (
                <circle
                  key={i}
                  cx={141 + ((i * 41) % 78)}
                  cy={128 + ((i * 31) % 101)}
                  r={2 + (i % 3)}
                  fill="#f5f6ee"
                  opacity={cloud.fog * 0.75}
                />
              ))}
          </>
        )}
        {kind === 4 && (
          <>
            <path d="M68 111V256H316V111" fill="#e5ebd9" stroke="#a8bc97" strokeWidth="3" />
            <path d="M72 146H312V252H72Z" fill="#c0d8c8" />
            <path d="M110 125H276V215H110Z" fill="#bbb79a" stroke="#9c9d82" strokeWidth="3" />
            <ellipse cx="110" cy="170" rx="12" ry="45" fill="#c8c4a8" stroke="#979b7e" />
            <path d="M108 151H210V189H108Z" fill="#eceddc" stroke="#a9aa8e" />
            <path d="M21 170H201" stroke="#9b9e89" strokeWidth="9" />
            <path
              d={film.watch && stage === 8 ? 'M196 151L210 170 196 189Z' : 'M201 155H210V185H201Z'}
              fill="#989e87"
            />
            <path
              d={`M216 ${170 + Math.cos(rumford.displayAngle) * 35}H273`}
              stroke="#a5a68c"
              strokeWidth="4"
            />
            <path d="M34 150v40m-10-30 10-10 10 10" stroke="#b69e70" fill="none" strokeWidth="3" />
            <rect x="296" y="103" width="6" height="112" rx="3" fill="#eff1e5" stroke="#a5b896" />
            <path
              d={`M299 211V${211 - (rumford.temperature - 20)}`}
              stroke="#bb9063"
              strokeWidth="2"
            />
            {rumford.boiling &&
              [0, 1, 2].map((i) => (
                <path
                  key={i}
                  d={`M${235 + i * 22} 137q-8-11 0-21q8-10 0-19`}
                  fill="none"
                  stroke="#b7cfbc"
                  strokeWidth="2"
                />
              ))}
          </>
        )}
      </svg>
      <p className="lab-apparatus-caption">
        {kind === 0
          ? t(fast ? '快速压缩：做功使气体升温' : '缓慢压缩：向环境传热')
          : kind === 3
            ? t(film.watch && stage === 6 ? '少量水使瓶内空气湿润' : '压强降低，水汽发生凝结')
            : kind === 4
              ? t('炮筒剖面：接触处持续摩擦')
              : null}
      </p>
      <div className="textbook-em-meters">
        {kind === 0 ? (
          <>
            <span>
              W <b>{compression.work.toFixed(2)} J</b>
            </span>
            <span>
              ΔU <b>{compression.internalChange.toFixed(2)} J</b>
            </span>
          </>
        ) : kind < 3 ? (
          <>
            <span>
              W <b>{joule.work.toFixed(1)} J</b>
            </span>
            <span>
              ΔT <b>{(joule.temperature - 20).toFixed(3)} K</b>
            </span>
            {kind === 2 && (
              <span>
                I <b>{joule.current.toFixed(2)} A</b>
              </span>
            )}
          </>
        ) : kind === 3 ? (
          <span>
            {t('理想化降压温度')} <b>{(cloud.temperature - 273.15).toFixed(1)} °C</b>
          </span>
        ) : (
          <>
            <span>
              P <b>{rumford.power.toFixed(0)} W</b>
            </span>
            <span>
              W <b>{(rumford.work / 1000).toFixed(0)} kJ</b>
            </span>
          </>
        )}
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <Segments
            label={t('选择功与热实验')}
            value={mode}
            onChange={setMode}
            options={labels.map((label, i) => ({ value: String(i), label: t(label) }))}
          />
          <Range
            label={t('演示进度')}
            value={progress}
            min={0}
            max={1}
            step={0.002}
            onChange={setProgress}
          />
          {kind === 0 && (
            <Segments
              label={t('压缩过程')}
              value={process}
              onChange={setProcess}
              options={[
                { value: 'fast', label: t('快速绝热') },
                { value: 'slow', label: t('缓慢等温') },
              ]}
            />
          )}
          {(kind === 1 || kind === 2) && (
            <>
              <Range
                label={t('重物总质量')}
                value={mass}
                min={5}
                max={10}
                step={1}
                onChange={setMass}
              />
              <Range
                label={t('重物下降高度')}
                value={height}
                min={0.5}
                max={2}
                step={0.1}
                onChange={setHeight}
              />
              {kind === 2 && (
                <Range
                  label={t('完整下降所用时间')}
                  value={duration}
                  min={12}
                  max={30}
                  step={1}
                  onChange={setDuration}
                />
              )}
            </>
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('能量模型与演示边界')}</summary>
        <p>
          {t(
            '压缩用理想空气比热比1.4，500开尔文仅为点燃的示意阈值，忽略燃烧反馈。焦耳装置理想地把重物势能全部转为水与杯的内能，忽略轴承和发电机损耗。瓶中降压按理想绝热排气近似，气体量减少，雾滴只表示凝结趋势，未计潜热反馈。伦福德示例按恒定摩擦功率计能量，转动放慢显示，不是原始实验数据。',
          )}
        </p>
      </details>
    </div>
  );
}
