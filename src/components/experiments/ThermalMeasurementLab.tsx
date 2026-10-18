import { useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { mixingCalorimeter, syringeGas, flaskPlug } from '../../models/thermal-measurement-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
export default function ThermalMeasurementLab() {
  const film = useShowcase();
  const [mode, setMode] = useState(
      film.variant?.includes('boyle')
        ? 'syringe'
        : film.variant?.includes('flask')
          ? 'flask'
          : 'mixing',
    ),
    [progress, setProgress] = useState(0.7),
    [cup, setCup] = useState(60),
    [volume, setVolume] = useState(15),
    [process, setProcess] = useState('slow'),
    [temperature, setTemperature] = useState(27);
  const stage = film.chapter,
    p = film.watch ? film.chapterProgress : progress,
    kind = film.watch ? (stage < 3 ? 'mixing' : stage < 6 ? 'syringe' : 'flask') : mode;
  const cupC = film.watch ? (stage === 2 && p < 0.5 ? 0 : 60) : cup,
    time = film.watch
      ? stage === 0
        ? 0
        : stage === 1
          ? Math.max(0, p - 0.15) * 120
          : 100
      : p * 120,
    mix = mixingCalorimeter(time, cupC);
  const transfer = film.watch ? (stage === 0 ? 0 : stage === 1 ? Math.min(1, p / 0.15) : 1) : 1;
  const v = film.watch ? 20 - 8 * Math.sin(p * Math.PI * 2) : volume,
    exponent = film.watch ? (stage === 5 ? 1.4 : 1) : process === 'slow' ? 1 : 1.4,
    gas = syringeGas(v, exponent),
    temp = film.watch ? (stage === 6 ? 20 : stage === 7 ? 20 + 10 * p : 30 - 10 * p) : temperature,
    plug = flaskPlug(temp);
  const pistonY = 200 - v * 4,
    metalX = 82 + transfer * 160,
    metalY = 179 + transfer * 35 - Math.sin(transfer * Math.PI) * 110;
  return (
    <div className="textbook-em thermal-measurement-lab">
      <div className="textbook-em-state">
        <span>
          {t(
            kind === 'mixing'
              ? '混合法量热'
              : kind === 'syringe'
                ? '注射器研究等温变化'
                : '烧瓶与水柱',
          )}
        </span>
        <span>
          {kind === 'mixing'
            ? `${mix.cold.toFixed(1)} °C`
            : kind === 'syringe'
              ? `${gas.pressure.toFixed(1)} kPa`
              : `${temp.toFixed(1)} °C`}
        </span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 320"
        role="img"
        aria-label={t('量热杯、注射器与烧瓶三种热学测量装置')}
      >
        {kind === 'mixing' && (
          <>
            <path
              d="M35 130V239Q35 247 43 247H122Q130 247 130 239V130"
              fill="#eaf0e3"
              stroke="#a8bca0"
              strokeWidth="3"
            />
            <path d="M38 168H127V238Q127 244 119 244H46Q38 244 38 238Z" fill="#c0d8d0" />
            <path
              d="M197 157V249Q197 260 208 260H282Q293 260 293 249V157"
              fill="#dce6cf"
              stroke="#a6b995"
              strokeWidth="4"
            />
            <path
              d="M205 165V247Q205 252 212 252H278Q285 252 285 247V165"
              fill="#f0f3e6"
              stroke="#b7c8a6"
            />
            <path d="M207 194H283V246Q283 250 277 250H213Q207 250 207 246Z" fill="#c0d8d0" />
            <rect
              x={metalX - 15}
              y={metalY - 14}
              width="30"
              height="28"
              rx="4"
              fill="#b5a47f"
              stroke="#938663"
            />
            <path d={`M${metalX} ${metalY - 14}V${metalY - 55}`} stroke="#b9b090" />
            <rect x="267" y="121" width="6" height="108" rx="3" fill="#f1f3e7" stroke="#a6b994" />
            <path d={`M270 223V${223 - mix.cold * 1.1}`} stroke="#bd875f" strokeWidth="2" />
            <circle cx="270" cy="227" r="5" fill="#bd875f" />
            <path
              d="M55 268q10-18 20 0q10-18 20 0q10-18 20 0"
              fill="none"
              stroke="#c5a16b"
              strokeWidth="4"
            />
            <text x="82" y="110" textAnchor="middle">
              100 °C
            </text>
            <text x="245" y="289" textAnchor="middle">
              {t('保温量热杯')}
            </text>
            {transfer === 1 && (
              <>
                <path
                  d="M224 210q-12-18 0-31m26 32q12-18 0-30"
                  stroke="#b59963"
                  fill="none"
                  strokeDasharray="3 4"
                />
                <text
                  x="180"
                  y="40"
                  textAnchor="middle"
                >{`${mix.hot.toFixed(1)} °C → ${mix.cold.toFixed(1)} °C`}</text>
              </>
            )}
          </>
        )}
        {kind === 'syringe' && (
          <>
            <path d="M75 51V213H143V51" stroke="#b4c8a8" strokeWidth="4" fill="#edf3e6" />
            <path d={`M79 ${pistonY + 9}H139V209H79Z`} fill="#d2e1c5" />
            <rect x="77" y={pistonY} width="64" height="9" rx="2" fill="#8c9e7b" />
            <path
              d={`M109 ${pistonY}V${pistonY - 30}m-23 0h46`}
              stroke="#a6b895"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {Array.from({ length: 7 }, (_, i) => (
              <g key={i}>
                <path d={`M145 ${209 - i * 20}h8`} stroke="#8ea580" />
                <text className="em-small" x="158" y={214 - i * 20}>
                  {i * 5}
                </text>
              </g>
            ))}
            <path d="M109 214V228H243V145" fill="none" stroke="#a5b993" strokeWidth="4" />
            <circle cx="243" cy="106" r="40" fill="#f3f5e9" stroke="#a9bc99" strokeWidth="3" />
            <path
              d={`M243 106l${Math.sin((gas.pressure / 300 - 0.5) * Math.PI * 1.5) * 29} ${-Math.cos((gas.pressure / 300 - 0.5) * Math.PI * 1.5) * 29}`}
              stroke="#b18e53"
              strokeWidth="3"
            />
            <circle cx="243" cy="106" r="4" fill="#b18e53" />
            <text x="243" y="166" textAnchor="middle">
              {t('绝对压强')}
            </text>
            <path d="M49 296V252M49 296H300" stroke="#b2c5a3" />
            <path
              d={Array.from({ length: 70 }, (_, i) => {
                const vv = 8 + (i * 24) / 69,
                  g = syringeGas(vv, exponent);
                return `${i ? 'L' : 'M'}${stage === 4 ? 49 + (190 * (1 / (vv + 1))) / (1 / 9) : 49 + vv * 7} ${296 - g.pressure * 0.16}`;
              }).join(' ')}
              fill="none"
              stroke="#92ad7b"
              strokeWidth="2"
            />
            <circle
              cx={stage === 4 ? 49 + 190 / (v + 1) / (1 / 9) : 49 + v * 7}
              cy={296 - gas.pressure * 0.16}
              r="4"
              fill="#b29157"
            />
            <text className="em-small" x="315" y="298">
              {stage === 4 ? '1/V' : 'V'}
            </text>
            <text className="em-small" x="38" y="253">
              p
            </text>
          </>
        )}
        {kind === 'flask' && (
          <>
            <path
              d="M102 73V137C43 172 38 255 96 270H163C218 253 207 172 148 137V73"
              fill="#e5efdd"
              stroke="#a6bd9b"
              strokeWidth="3"
            />
            <path d="M99 79H151V101H99Z" fill="#baa783" />
            <path
              d="M125 126V61Q125 52 136 52H322M135 126V66Q135 62 142 62H322"
              fill="none"
              stroke="#a7c1af"
              strokeWidth="2"
            />
            <path d={`M${210 + plug.displacement * 8} 53h17v8h-17Z`} fill="#79aba8" />
            <path d="M210 38V44M265 38V44M320 38V44" stroke="#9caf8f" />
            <text x="210" y="29" textAnchor="middle">
              0
            </text>
            <text x="265" y="29" textAnchor="middle">
              {t('向外')}
            </text>
            {temp > 20.1 && (
              <path
                d="M57 178q-14 12-13 39q0 30 18 39m-4-9q-20-11-27-33q-9-24 2-29q8-2 14 17"
                fill="none"
                stroke="#cbb48b"
                strokeWidth="9"
                strokeLinecap="round"
              />
            )}
            {Array.from({ length: 22 }, (_, i) => (
              <circle
                key={i}
                cx={91 + ((i * 47) % 78) + Math.sin(p * 10 + i) * 3}
                cy={166 + ((i * 31) % 80) + Math.cos(p * 10 + i) * 3}
                r="2.6"
                fill="#a3ba8c"
              />
            ))}
            <text x="252" y="104" textAnchor="middle">
              {t('轻小水柱')}
            </text>
          </>
        )}
      </svg>
      <p className="lab-apparatus-caption">
        {kind === 'flask' ? t('水柱自由移动，压强近似不变') : null}
      </p>
      <div className="textbook-em-meters">
        {kind === 'mixing' ? (
          <>
            <span>
              {t('杯的热容')} <b>{cupC} J/K</b>
            </span>
            <span>
              {t('平衡温度')} <b>{mix.equilibrium.toFixed(2)} °C</b>
            </span>
          </>
        ) : kind === 'syringe' ? (
          <>
            <span>
              V <b>{gas.totalVolume.toFixed(1)} mL</b>
            </span>
            <span>
              T <b>{gas.temperature.toFixed(1)} K</b>
            </span>
            <span>
              pV <b>{gas.pv.toFixed(0)} kPa·mL</b>
            </span>
          </>
        ) : (
          <>
            <span>
              V <b>{plug.volume.toFixed(2)} mL</b>
            </span>
            <span>
              Δx <b>{plug.displacement.toFixed(2)} cm</b>
            </span>
          </>
        )}
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <Segments
            label={t('选择热学测量')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'mixing', label: t('混合法量热') },
              { value: 'syringe', label: t('注射器研究等温变化') },
              { value: 'flask', label: t('烧瓶与水柱') },
            ]}
          />
          {kind === 'mixing' ? (
            <>
              <Range
                label={t('热交换进度')}
                value={progress}
                min={0}
                max={1}
                step={0.001}
                onChange={setProgress}
              />
              <Range
                label={t('杯的热容')}
                value={cup}
                min={0}
                max={120}
                step={5}
                onChange={setCup}
              />
            </>
          ) : kind === 'syringe' ? (
            <>
              <Range
                label={t('注射器刻度体积')}
                value={volume}
                min={8}
                max={32}
                step={0.1}
                onChange={setVolume}
              />
              <Segments
                label={t('过程近似')}
                value={process}
                onChange={setProcess}
                options={[
                  { value: 'slow', label: t('缓慢等温') },
                  { value: 'fast', label: t('快速绝热') },
                ]}
              />
            </>
          ) : (
            <Range
              label={t('烧瓶温度')}
              value={temperature}
              min={20}
              max={30}
              step={0.1}
              onChange={setTemperature}
            />
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('测量条件与模型')}</summary>
        <p>
          {t(
            '量热模型忽略向环境散热，分别计算金属与水杯的热容；注射器用绝对压强，并计入1毫升连接管体积。快速压缩采用空气绝热指数1.4。烧瓶按理想气体等压膨胀计算，水柱摩擦、蒸发和两侧毛细压差忽略，管截面积为0.5平方厘米。',
          )}
        </p>
      </details>
    </div>
  );
}
