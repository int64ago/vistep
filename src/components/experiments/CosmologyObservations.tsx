import { useMemo, useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  hubbleSpectrum,
  antennaTemperature,
  skyFluctuation,
  mollweide,
} from '../../models/cosmology-observations';
import '../../styles/modern-labs.css';
import '../../styles/astronomy-labs.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
export function CosmologyArtwork({
  mode = 0,
  phase = 0,
  value = 0.5,
  H0 = 70,
}: {
  mode?: number;
  phase?: number;
  value?: number;
  H0?: number;
}) {
  const spec = hubbleSpectrum(5 + 195 * value, H0),
    temp = antennaTemperature(phase === 1 ? 60 : 30 + 60 * value),
    map = useMemo(
      () =>
        Array.from({ length: 1200 }, (_, i) => {
          const a = i % 60,
            b = Math.floor(i / 60),
            lon = -Math.PI + (a / 60) * Math.PI * 2,
            lat = -Math.PI / 2 + (b / 20) * Math.PI,
            dl = Math.PI / 30,
            dp = Math.PI / 20,
            points = [
              [lon, lat],
              [lon + dl, lat],
              [lon + dl, lat + dp],
              [lon, lat + dp],
            ].map(([l, p]) => mollweide(l, p)),
            signal = skyFluctuation(lon + dl / 2, lat + dp / 2);
          return {
            d: points.map((p, j) => `${j ? 'L' : 'M'}${p.x} ${p.y}`).join(' ') + 'Z',
            color:
              signal > 0
                ? `hsl(${43 - signal * 0.35} 42% ${65 - Math.abs(signal) * 0.2}%)`
                : `hsl(${194 - signal * 0.12} 33% ${65 - Math.abs(signal) * 0.2}%)`,
          };
        }),
      [],
    ),
    background = phase === 1 ? 1 - value : 1,
    elevation = phase === 1 ? 60 : 30 + 60 * value,
    hornAngle = (elevation * Math.PI) / 180,
    hornEnd = {
      x: 142 + 78 * Math.cos(hornAngle),
      y: 120 + 78 * Math.sin(hornAngle),
    },
    selected = mollweide(-Math.PI + value * 2 * Math.PI, 0.2);
  return (
    <svg
      className="astronomy-art"
      viewBox="0 0 340 300"
      role="img"
      aria-label={tr(
        '星系谱线、距离关系与微波天空',
        'Galaxy spectra, distance relation and microwave sky',
      )}
    >
      {mode === 0 && (
        <>
          {phase === 0 ? (
            <>
              <ellipse
                cx="74"
                cy="67"
                rx="34"
                ry="13"
                fill="#adbbad"
                opacity=".2"
                transform="rotate(-22 74 67)"
              />
              {Array.from({ length: 34 }, (_, j) => (
                <circle
                  key={j}
                  cx={74 + Math.cos(j * 2.4) * Math.sqrt(j) * 5}
                  cy={67 + Math.sin(j * 2.4) * Math.sqrt(j) * 2}
                  r="1"
                  fill="#d6dbbe"
                />
              ))}
              <path d="M105 67H195L233 104" stroke="#789b9f" strokeDasharray="3 4" />
              <path d="M216 78L248 98L226 125L196 106Z" fill="#829b9c" />
              <path d="M225 114V143M205 143H245" stroke="#a6b9ad" strokeWidth="3" />
            </>
          ) : (
            <>
              <path d="M49 28V135H299" stroke="#78949b" fill="none" />
              <path d={`M49 135L299 ${135 - ((H0 * 200) / 18000) * 100}`} stroke="#c4ae80" />
              {[20, 40, 60, 80, 100, 120, 140, 160, 180].map((d) => (
                <circle
                  key={d}
                  cx={49 + (d / 200) * 250}
                  cy={135 - ((d * H0) / 18000) * 100}
                  r="3.5"
                  fill="#a8c4ba"
                />
              ))}
              <circle
                cx={49 + (spec.distance / 200) * 250}
                cy={135 - (spec.velocity / 18000) * 100}
                r="5"
                fill="#debd84"
              />
              <text x="296" y="158" textAnchor="end" fill="#c7d4c7" fontSize="18">
                {tr('教学样本 · d / Mpc', 'Model samples · d / Mpc')}
              </text>
            </>
          )}
          {[0, 1].map((j) => (
            <g key={j}>
              <rect
                x="31"
                y={178 + j * 63}
                width="279"
                height="32"
                rx="6"
                fill="#162a34"
                stroke="#557781"
              />
              {spec.lines.map((l, i) => (
                <rect
                  key={i}
                  x={31 + (((j ? l.observed : l.rest) - 420) / 290) * 279}
                  y={180 + j * 63}
                  width="3"
                  height="28"
                  fill={['#a9a6c3', '#81b9bf', '#d0977d'][i]}
                />
              ))}
              <text x="31" y={233 + j * 63} fontSize="18" fill="#c6d5c8">
                {j
                  ? tr('星系：整体移向长波', 'Galaxy: redshifted')
                  : tr('实验室谱线', 'Laboratory lines')}
              </text>
            </g>
          ))}
        </>
      )}
      {mode === 1 && phase < 2 && (
        <>
          <g transform={`rotate(${elevation} 142 120)`}>
            <path d="M49 66L186 100V140L49 174Z" fill="#7e999e" stroke="#becac0" />
            <path d="M49 66L69 120L49 174" fill="none" stroke="#a0b6b1" />
            <rect x="186" y="108" width="34" height="24" rx="6" fill="#97ada9" />
            {[0, 1, 2].map((j) => (
              <path
                key={j}
                d={`M${17 + j * 18} 91L77 109M${17 + j * 18} 151L77 132`}
                fill="none"
                stroke="#d1bc8b"
                opacity=".6"
              />
            ))}
          </g>
          <path d="M145 147V215M110 215H180" stroke="#9cb2ab" strokeWidth="5" />
          <path d={`M${hornEnd.x} ${hornEnd.y}L289 121V178`} fill="none" stroke="#b6c5b9" />
          <text x="284" y="170" textAnchor="middle" fontSize="18" fill="#c7d4c6">
            TΣ
          </text>
          <rect x="249" y="178" width="71" height="42" rx="9" fill="#304c56" stroke="#99b2ad" />
          <text x="284" y="205" textAnchor="middle" fontSize="18" fill="#d4ddc8">
            {temp.total.toFixed(2)} K
          </text>
          <path d="M31 254H309" stroke="#5a7c88" />
          {[temp.receiver * background, temp.atmosphere * background, temp.sky].map((v, j) => (
            <rect
              key={j}
              x={
                31 +
                [0, temp.receiver * background, (temp.receiver + temp.atmosphere) * background][j] *
                  36
              }
              y="239"
              width={v * 36}
              height="27"
              fill={['#546e7a', '#89a5a5', '#c3ad7f'][j]}
            />
          ))}
          <text x="170" y="291" textAnchor="middle" fontSize="18" fill="#c7d4c6">
            {phase === 0
              ? tr('接收机 + 大气 + 天空', 'Receiver + atmosphere + sky')
              : tr('校准后，保留天空分量', 'After calibration: sky component')}
          </text>
        </>
      )}
      {mode === 1 && phase === 2 && (
        <>
          <text x="170" y="44" textAnchor="middle" fontSize="20" fill="#c7d4c6">
            {tr('平均温度约2.725 K', 'Mean temperature ≈2.725 K')}
          </text>
          <text x="170" y="75" textAnchor="middle" fontSize="18" fill="#c7d4c6">
            {tr('合成示意图 · 非实测', 'Synthetic map · Not measured')}
          </text>
          {map.map((p, i) => (
            <path key={i} d={p.d} fill={p.color} stroke={p.color} strokeWidth=".5" />
          ))}
          <circle
            cx={selected.x}
            cy={selected.y}
            r="5"
            fill="none"
            stroke="#e3e4d1"
            strokeWidth="2"
          />
          <text x="170" y="286" textAnchor="middle" fontSize="20" fill="#c7d4c6">
            ΔT = {skyFluctuation(-Math.PI + value * 2 * Math.PI, 0.2).toFixed(1)} μK
          </text>
        </>
      )}
    </svg>
  );
}
export default function CosmologyObservations() {
  const film = useShowcase(),
    [selected, setSelected] = useState(film.variant === 'required-2-cmb' ? 1 : 0),
    [manual, setManual] = useState(0.6),
    [H0, setH0] = useState(70),
    [view, setView] = useState(0);
  const mode = film.watch ? (film.chapter < 2 ? 0 : 1) : selected,
    phase = film.watch ? (mode === 0 ? film.chapter : film.chapter - 2) : view,
    value = film.watch ? film.chapterProgress : manual,
    effectiveH0 = film.watch ? 70 : H0,
    spec = hubbleSpectrum(5 + 195 * value, effectiveH0),
    temp = antennaTemperature(phase === 1 ? 60 : 30 + 60 * value);
  return (
    <div className="astronomy-lab">
      {!film.watch && (
        <div className="modern-paths">
          <button
            type="button"
            aria-pressed={mode === 0}
            onClick={() => {
              setSelected(0);
              setView(0);
            }}
          >
            {tr('哈勃关系', 'Hubble relation')}
          </button>
          <button
            type="button"
            aria-pressed={mode === 1}
            onClick={() => {
              setSelected(1);
              setView(0);
            }}
          >
            {tr('微波背景', 'Microwave background')}
          </button>
        </div>
      )}
      <div className="modern-readout">
        {mode === 0
          ? `d = ${spec.distance.toFixed(0)} Mpc · z ≈ ${spec.z.toFixed(4)}`
          : phase < 2
            ? `${tr('模型天线温度', 'Model antenna temperature')} ${(temp.total - (phase === 1 ? (temp.receiver + temp.atmosphere) * value : 0)).toFixed(3)} K`
            : `T = ${(2.725 + skyFluctuation(-Math.PI + value * 2 * Math.PI, 0.2) * 1e-6).toFixed(6)} K`}
      </div>
      <CosmologyArtwork mode={mode} phase={phase} value={value} H0={effectiveH0} />
      <p className="modern-key">
        {mode === 0
          ? tr(
              '红移与独立距离估计相比较，才构成膨胀关系的观测检验。',
              'Comparing redshift with independent distances tests the expansion relation.',
            )
          : phase === 2
            ? tr(
                '平均背景几乎均匀，微小温差需要极度放大后才能看见。',
                'The mean background is nearly uniform; tiny temperature differences need magnification.',
              )
            : tr(
                '逐项校准接收机与环境背景，才能解释剩余的天空信号。',
                'Calibrating receiver and environmental backgrounds is essential to interpreting the sky signal.',
              )}
      </p>
      {!film.watch && (
        <div className="modern-explore">
          <Range
            label={
              mode === 0
                ? tr('星系距离', 'Galaxy distance')
                : phase === 2
                  ? tr('所选天区方向', 'Selected sky direction')
                  : phase === 1
                    ? tr('已知背景扣除进度', 'Known-background subtraction')
                    : tr('天线仰角', 'Antenna elevation')
            }
            value={manual}
            min={0}
            max={1}
            step={0.005}
            onChange={setManual}
          />
          {mode === 0 && (
            <Range
              label={tr('示例H₀ / (km/s)/Mpc', 'Example H₀ / (km/s)/Mpc')}
              value={H0}
              min={50}
              max={90}
              step={1}
              onChange={setH0}
            />
          )}
          <button type="button" onClick={() => setView((view + 1) % (mode === 0 ? 2 : 3))}>
            {tr('切换观察视图', 'Switch observation view')}
          </button>
        </div>
      )}
    </div>
  );
}
