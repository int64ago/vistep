import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  carbonTrack,
  carbonDiffusion,
  waterAlcoholMix,
  oilFilm,
  oilBoundary,
  molecularShot,
} from '../../models/molecular-measurement-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
export default function MolecularMeasurementLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, '');
  const [mode, setMode] = useState(
      film.variant?.includes('alcohol')
        ? 'mix'
        : film.variant?.includes('oleic')
          ? 'oil'
          : 'brownian',
    ),
    [temperature, setTemperature] = useState(20),
    [radius, setRadius] = useState(0.5),
    [time, setTime] = useState(50),
    [progress, setProgress] = useState(1),
    [drops, setDrops] = useState(50),
    [dilution, setDilution] = useState(500),
    [area, setArea] = useState(200),
    [oilStep, setOilStep] = useState('3');
  const s = film.watch
    ? molecularShot(film.chapter, film.chapterProgress)
    : {
        mode,
        temperature: temperature + 273.15,
        time,
        progress,
        mixed: true,
        oilStage: Number(oilStep),
      };
  const particleRadius = film.watch ? 0.5 : radius,
    dropCount = film.watch ? 50 : drops,
    dilutionRatio = film.watch ? 500 : dilution,
    filmArea = film.watch ? 200 : area;
  const tracks = useMemo(
    () =>
      Array.from({ length: 19 }, (_, i) =>
        carbonTrack(137 + i * 19, s.temperature, particleRadius * 1e-6),
      ),
    [s.temperature, particleRadius],
  );
  const mix = waterAlcoholMix(s.mixed ? s.progress : 0),
    oil = oilFilm(1, dropCount, dilutionRatio, filmArea),
    boundary = oilBoundary(200),
    n = Math.min(300, Math.floor(s.time));
  const outline =
    boundary.map((p, i) => `${i ? 'L' : 'M'}${180 + p.x * 10} ${155 + p.y * 10}`).join(' ') + 'Z';
  const cylinder = (x: number, volume: number, label: string) => (
    <g>
      <path
        d={`M${x - 31} 43V236Q${x - 31} 245 ${x - 22} 245H${x + 22}Q${x + 31} 245 ${x + 31} 236V43`}
        fill="#edf4e8"
        fillOpacity=".4"
        stroke="#a4bca0"
        strokeWidth="2"
      />
      <path
        d={`M${x - 28} ${241 - volume * 1.7}H${x + 28}V235Q${x + 28} 242 ${x + 20} 242H${x - 20}Q${x - 28} 242 ${x - 28} 235Z`}
        fill="#c7dccc"
        fillOpacity=".75"
      />
      {[20, 40, 60, 80, 100].map((v) => (
        <g key={v}>
          <path d={`M${x + 15} ${241 - v * 1.7}h15`} stroke="#a4b797" />
          <text className="em-small" x={x - 12} y={246 - v * 1.7}>
            {v}
          </text>
        </g>
      ))}
      <path d={`M${x - 42} 250H${x + 42}`} stroke="#b1c3a7" strokeWidth="7" strokeLinecap="round" />
      <text x={x} y="284" textAnchor="middle">
        {t(label)}
      </text>
    </g>
  );
  return (
    <div className="textbook-em molecular-measurement-lab">
      <div className="textbook-em-state">
        <span>
          {t(
            s.mode === 'brownian'
              ? '显微镜下的炭粒'
              : s.mode === 'mix'
                ? '水与酒精的体积对照'
                : '单分子油膜的间接测量',
          )}
        </span>
        <span>
          {s.mode === 'brownian'
            ? `${(s.temperature - 273.15).toFixed(0)} °C · ${s.time.toFixed(0)} s`
            : s.mode === 'mix'
              ? '50 mL + 50 mL'
              : `1 : ${dilutionRatio}`}
        </span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 310"
        role="img"
        aria-label={t('可见炭粒、量筒与油膜面积的三种实验装置')}
      >
        <defs>
          <clipPath id={`${id}-scope`}>
            <circle cx="180" cy="147" r="117" />
          </clipPath>
          <clipPath id={`${id}-film`}>
            <path d={outline} />
          </clipPath>
        </defs>
        {s.mode === 'brownian' && (
          <>
            <circle cx="180" cy="147" r="125" fill="#d6e0cd" />
            <circle cx="180" cy="147" r="117" fill="#f0f4e8" stroke="#b8cbae" />
            <g clipPath={`url(#${id}-scope)`}>
              {tracks.map((track, i) => {
                const p = track[n],
                  x = 180 + (p.x + ((i % 5) - 2) * 11) * 2.5,
                  y = 147 + (p.y + (Math.floor(i / 5) - 1.5) * 12) * 2.5;
                return (
                  <g key={i}>
                    {i === 0 && (
                      <path
                        d={track
                          .slice(0, n + 1)
                          .filter((_, j) => j % 30 === 0 || j === n)
                          .map(
                            (a, j) =>
                              `${j ? 'L' : 'M'}${180 + (a.x - 22) * 2.5} ${147 + (a.y - 18) * 2.5}`,
                          )
                          .join(' ')}
                        fill="none"
                        stroke="#b3975d"
                        strokeWidth="1.4"
                      />
                    )}
                    <path
                      d={`M${x - particleRadius * 3} ${y}l${particleRadius * 1.5} ${-particleRadius * 3} ${particleRadius * 3} ${particleRadius * 0.5} ${particleRadius * 1.2} ${particleRadius * 3} ${-particleRadius * 3} ${particleRadius * 2}Z`}
                      fill={i === 0 ? '#a58c57' : '#788678'}
                      opacity={i === 0 ? 1 : 0.72}
                    />
                  </g>
                );
              })}
            </g>
            <path d="M214 260h50m-50-3v6m50-6v6" stroke="#869b7b" strokeWidth="2" />
            <text x="239" y="286" textAnchor="middle">
              20 μm
            </text>
          </>
        )}
        {s.mode === 'mix' && (
          <>
            {cylinder(101, mix.water, '水')}
            {cylinder(257, mix.mixture, s.mixed ? '混合液' : '酒精')}
            {s.mixed && s.progress < 0.6 && (
              <path
                d="M125 64Q180 16 237 71"
                stroke="#9bbda9"
                strokeWidth="4"
                strokeDasharray="6 6"
                fill="none"
              />
            )}
            <path d="M219 71H295" stroke="#b49760" strokeDasharray="4 4" />
          </>
        )}
        {s.mode === 'oil' && s.oilStage === 0 && (
          <>
            <path d="M140 35H202V139H140Z" fill="#e9f0e2" stroke="#abc09e" strokeWidth="2" />
            <path d="M171 10V35M145 10H197M171 139V177" stroke="#96ad8b" strokeWidth="4" />
            <path d="M143 79H199V136H143Z" fill="#d8c596" opacity=".7" />
            {Array.from({ length: 6 }, (_, i) => (
              <path key={i} d={`M140 ${45 + i * 14}h17`} stroke="#a2b694" />
            ))}
            <path d="M123 211V273H219V211" fill="#edf2e3" stroke="#adc19f" strokeWidth="2" />
            <circle cx="171" cy={181 + ((s.progress * dropCount) % 1) * 27} r="4" fill="#c1a468" />
            <text x="180" y="303" textAnchor="middle">
              1 mL ÷ {dropCount} = {oil.dropMl.toFixed(3)} mL
            </text>
          </>
        )}
        {s.mode === 'oil' && s.oilStage > 0 && s.oilStage < 3 && (
          <>
            <rect
              x="24"
              y="43"
              width="312"
              height="233"
              rx="22"
              fill="#d9e7d7"
              stroke="#b2c7a8"
              strokeWidth="3"
            />
            {Array.from({ length: 160 }, (_, i) => {
              const x = 38 + ((i * 67) % 284),
                y = 57 + ((i * 43) % 203);
              return <circle key={i} cx={x} cy={y} r="1.2" fill="#f5f5e8" />;
            })}
            <path
              d={outline}
              transform={
                s.oilStage === 1
                  ? `translate(180 155) scale(${0.1 + 0.9 * s.progress}) translate(-180 -155)`
                  : undefined
              }
              fill="#e9d8a1"
              fillOpacity="1"
              stroke="#baa36b"
              strokeWidth="1.5"
            />
            {s.oilStage >= 2 && (
              <>
                {Array.from({ length: 31 }, (_, i) => (
                  <path
                    key={`v${i}`}
                    d={`M${30 + i * 10} 45V275`}
                    stroke="#a7ba9b"
                    strokeWidth=".65"
                  />
                ))}
                {Array.from({ length: 24 }, (_, i) => (
                  <path
                    key={`h${i}`}
                    d={`M25 ${45 + i * 10}H335`}
                    stroke="#a7ba9b"
                    strokeWidth=".65"
                  />
                ))}
              </>
            )}
          </>
        )}
        {s.mode === 'oil' && s.oilStage === 3 && (
          <>
            <rect x="37" y="166" width="286" height="90" rx="10" fill="#cbded0" />
            {Array.from({ length: 14 }, (_, i) => (
              <g key={i}>
                <circle cx={52 + i * 19} cy="164" r="6" fill="#9cb99d" />
                <path
                  d={`M${52 + i * 19} 158l3-9-4-9 4-9-3-11`}
                  fill="none"
                  stroke="#b39a61"
                  strokeWidth="3"
                />
              </g>
            ))}
            <path d="M328 120V164m-5-44h10m-10 44h10" stroke="#a68d56" strokeWidth="2" />

            <text x="180" y="287" textAnchor="middle">
              d = V / S
            </text>
          </>
        )}
      </svg>
      <p className="lab-apparatus-caption">
        {s.mode === 'mix'
          ? t('虚线：直接相加的100毫升')
          : s.mode === 'oil' && s.oilStage === 2
            ? t('每小格1平方厘米，边界按半格估计')
            : s.mode === 'oil' && s.oilStage === 3
              ? t('局部放大：单层铺展')
              : null}
      </p>
      <div className="textbook-em-meters">
        <span>
          {s.mode === 'brownian'
            ? `D = ${(carbonDiffusion(s.temperature, particleRadius * 1e-6) * 1e12).toFixed(3)} μm²/s`
            : s.mode === 'mix'
              ? `${mix.mixture.toFixed(1)} mL · ${t('总质量不变')}`
              : `V油 = ${(oil.volumeMl * 1000).toFixed(3)} μL · S = ${filmArea} cm²`}
        </span>
        {s.mode === 'oil' && s.oilStage === 3 && (
          <span>d = {(oil.thickness * 1e9).toFixed(2)} nm</span>
        )}
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <Segments
            label={t('选择分子实验')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'brownian', label: t('显微镜下的炭粒') },
              { value: 'mix', label: t('水与酒精的体积对照') },
              { value: 'oil', label: t('单分子油膜的间接测量') },
            ]}
          />
          {mode === 'brownian' ? (
            <>
              <Range
                label={t('悬浊液温度')}
                value={temperature}
                min={5}
                max={70}
                step={1}
                unit="°C"
                onChange={setTemperature}
              />
              <Range
                label={t('等效炭粒半径')}
                value={radius}
                min={0.2}
                max={1.5}
                step={0.1}
                unit="μm"
                onChange={setRadius}
              />
              <Range
                label={t('观察时间')}
                value={time}
                min={0}
                max={300}
                step={1}
                unit="s"
                onChange={setTime}
              />
            </>
          ) : mode === 'mix' ? (
            <Range
              label={t('倒入并待混合稳定的进度')}
              value={progress}
              min={0}
              max={1}
              step={0.01}
              onChange={setProgress}
            />
          ) : (
            <>
              <Segments
                label={t('油膜实验步骤')}
                value={oilStep}
                onChange={setOilStep}
                options={[
                  { value: '0', label: t('校准滴数') },
                  { value: '1', label: t('油膜展开') },
                  { value: '2', label: t('方格测面积') },
                  { value: '3', label: t('计算厚度') },
                ]}
              />
              <Range
                label={t('1毫升溶液的滴数读数')}
                value={drops}
                min={30}
                max={80}
                step={1}
                onChange={setDrops}
              />
              <Range
                label={t('配液稀释倍数读数')}
                value={dilution}
                min={250}
                max={1000}
                step={50}
                onChange={setDilution}
              />
              <Range
                label={t('油膜面积读数')}
                value={area}
                min={160}
                max={240}
                step={1}
                unit="cm²"
                onChange={setArea}
              />
            </>
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('间接观察与估测边界')}</summary>
        <p>
          {t(
            '显微镜看见的是炭粒，不是水分子；采用无对流二维布朗扩散与水的黏度近似，形状按等效水动力半径计算。轨迹每30秒连点，不代表期间真实路径。水醇50加50约96毫升是近室温代表值，收缩来自混合后的相互作用与堆积，不能只理解成刚性球填空隙。油膜固定示意面积200平方厘米，探索中的滴数、稀释和面积是测量读数，用于分析误差；单层均匀铺展是估测前提。',
          )}
        </p>
      </details>
    </div>
  );
}
