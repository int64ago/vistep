import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import {
  RIPPLE_DEFAULT,
  rippleAngularFrequency,
  refractionParameters,
  rippleValue,
  rippleComplex,
  paperRipple,
  movingRipples,
  movingWavelengths,
  quietProbe,
  type RippleMode,
} from '../../models/ripple-tank-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
import '../../styles/ripple-tank-lab.css';
import { useRippleField } from './useRippleField';
const kinds: RippleMode[] = [
  'paper',
  'reflection',
  'refraction',
  'diffraction',
  'interference',
  'moving',
];
const labels = ['水面纸屑', '反射挡板', '深浅水域', '狭缝衍射', '双源干涉', '移动波源'];
const variants = [
  'e1-water-wave-paper',
  'e1-water-reflection',
  'e1-water-refraction',
  'e1-water-diffraction',
  'e1-water-interference',
  'e1-moving-water-source',
];
export default function RippleTankLab() {
  const film = useShowcase(),
    uid = useId().replace(/:/g, ''),
    canvas = useRef<HTMLCanvasElement>(null),
    [mode, setMode] = useState(Math.max(0, variants.indexOf(film.variant ?? ''))),
    [time, setTime] = useState(2),
    [angle, setAngle] = useState(30),
    [gap, setGap] = useState(0.08),
    [wavelength, setWavelength] = useState(0.14),
    [depthRatio, setDepthRatio] = useState(0.5),
    [phase, setPhase] = useState(0),
    [detune, setDetune] = useState(0),
    [speed, setSpeed] = useState(0.1),
    [periodic, setPeriodic] = useState(true),
    [canvasAvailable, setCanvasAvailable] = useState(true),
    stage = film.watch ? film.chapter : mode * 2 + 1,
    index = Math.min(5, Math.floor(stage / 2)),
    p = film.chapterProgress,
    kind = kinds[index],
    clock = film.watch
      ? index === 0
        ? stage === 0
          ? p * 2.3
          : 2 + p * 5
        : index === 5
          ? p * 3.8
          : p * 5
      : Math.min(time, index === 5 ? 3.8 : 6),
    repeat = film.watch ? stage === 1 : periodic;
  const requestedSettings = useMemo(
    () => ({
      ...RIPPLE_DEFAULT,
      mode: kind,
      angle: film.watch ? (stage === 3 ? 15 + 30 * p : 35) : angle,
      gap: film.watch ? (stage === 6 ? 0.2 - 0.16 * p : 0.1) : gap,
      wavelength: film.watch ? (stage === 7 ? 0.03 + 0.12 * p : 0.14) : wavelength,
      depthRatio: film.watch ? (stage === 5 ? 0.8 - 0.55 * p : 0.5) : depthRatio,
      phase: film.watch ? (stage === 9 && p < 0.5 ? Math.PI * p * 2 : 0) : phase,
      frequencyDifference: film.watch ? (stage === 9 && p >= 0.5 ? 0.35 : 0) : detune,
      sourceSpeed: film.watch ? (stage === 10 ? 0 : 0.1) : speed,
    }),
    [kind, film.watch, stage, p, angle, gap, wavelength, depthRatio, phase, detune, speed],
  );
  const computed = useRippleField(requestedSettings),
    settings = computed.input,
    field = computed.field,
    refraction = refractionParameters(settings),
    quiet = useMemo(
      () => quietProbe({ ...settings, mode: 'interference', phase: 0, frequencyDifference: 0 }),
      [settings.wavelength],
    ),
    float = paperRipple(0.38, 0.22, clock, repeat),
    omega = rippleAngularFrequency(settings),
    waves = movingRipples(clock, settings.sourceSpeed),
    sourceX = 0.08 + settings.sourceSpeed * clock,
    spaces = movingWavelengths(settings.sourceSpeed),
    coherent = settings.phase === 0 && settings.frequencyDifference === 0,
    theta = (settings.angle * Math.PI) / 180,
    normal = kind === 'reflection' ? 265 : 180;
  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!context) {
      setCanvasAvailable(false);
      return;
    }
    const image = context.createImageData(96, 72),
      c1 = Math.cos(omega * clock),
      s1 = Math.sin(omega * clock),
      c2 = Math.cos((omega + 2 * Math.PI * settings.frequencyDifference) * clock),
      s2 = Math.sin((omega + 2 * Math.PI * settings.frequencyDifference) * clock);
    for (let y = 0; y < 72; y++)
      for (let x = 0; x < 96; x++) {
        const at = (y * 96 + x) * 4,
          value =
            kind === 'paper'
              ? paperRipple(((x + 0.5) / 96) * 0.6, ((y + 0.5) / 72) * 0.44, clock, repeat).height /
                0.0005
              : kind === 'moving'
                ? 0
                : field[at] * c1 + field[at + 1] * s1 + field[at + 2] * c2 + field[at + 3] * s2,
          z = Math.tanh(value * 1.5),
          target = z >= 0 ? [179, 197, 146] : [145, 183, 180],
          weight = Math.abs(z) * 0.72;
        image.data[at] = 232 + (target[0] - 232) * weight;
        image.data[at + 1] = 239 + (target[1] - 239) * weight;
        image.data[at + 2] = 220 + (target[2] - 220) * weight;
        image.data[at + 3] = 255;
      }
    context.putImageData(image, 0, 0);
  }, [field, clock, repeat, kind, settings]);
  const px = (x: number) => 30 + x * 500,
    py = (y: number) => 55 + y * 500;
  return (
    <div className="textbook-em ripple-tank-lab">
      <div className="textbook-em-state">
        <span>{t(labels[index])}</span>
        <span>
          {t(
            index === 5
              ? '波峰轨迹'
              : index === 0
                ? '局部运动与向外传播'
                : '俯视波场：颜色表示位移',
          )}
        </span>
      </div>
      <div className="ripple-visual">
        <canvas
          ref={canvas}
          width="96"
          height="72"
          className={kind === 'paper' ? 'ripple-round' : ''}
          aria-hidden="true"
        />
        <svg
          viewBox="0 0 360 340"
          className="ripple-overlay"
          role="img"
          aria-label={t('不同水波实验的真实挡板、浅水板、振源与漂浮纸屑')}
        >
          <defs>
            <clipPath id={uid + 'tank'}>
              <rect x="30" y="55" width="300" height="220" rx="9" />
            </clipPath>
          </defs>
          {kind === 'paper' ? (
            <>
              <ellipse
                cx="180"
                cy="165"
                rx="151"
                ry="111"
                stroke="#a7bdab"
                strokeWidth="3"
                fill="none"
              />
              <path
                transform={`translate(0 ${-5 * Math.sin(4 * Math.PI * clock) * (repeat || clock < 0.5 ? 1 : 0)})`}
                d={`M${px(0.13) - 23} 113l15 42 8 10 3-13-16-42Z`}
                fill="#c4af7d"
                stroke="#9d946e"
              />
              <circle cx={px(0.13)} cy="165" r="4" fill="#b3c7a6" />
              <circle
                cx={px(0.38)}
                cy="165"
                r="13"
                fill="none"
                stroke="#b69668"
                strokeDasharray="3 3"
              />
              <path
                d="M-9-5L8-3L6 6L-6 5Z"
                transform={`translate(${px(0.38 + float.radial)} 165)`}
                fill="#f5efcd"
                stroke="#b49f6e"
              />
              <path
                d={`M${Array.from({ length: 121 }, (_, i) => {
                  const x = 0.02 + i * 0.0046;
                  return `${px(x)},${309 - paperRipple(x, 0.22, clock, repeat).height * 7500}`;
                }).join('L')}`}
                stroke="#9ebeb0"
                strokeWidth="2"
                fill="none"
              />
              <path d="M41 309V327H318V309" stroke="#bccdbb" fill="none" />
              <path
                d="M-10-3L9-2L7 4L-7 3Z"
                transform={`translate(${px(0.38 + float.radial)} ${309 - float.height * 7500})`}
                fill="#eee4b6"
                stroke="#a89160"
              />

              <text x="63" y="296" className="em-small">
                {t('侧面放大')}
              </text>
            </>
          ) : (
            <>
              <rect
                x="29"
                y="54"
                width="302"
                height="222"
                rx="11"
                stroke="#a7bba4"
                strokeWidth="3"
                fill="none"
              />
              {kind === 'reflection' || kind === 'refraction' ? (
                <>
                  {kind === 'reflection' ? (
                    <path d="M265 57V273" stroke="#9eaa87" strokeWidth="9" strokeLinecap="round" />
                  ) : (
                    <>
                      <rect x="180" y="57" width="148" height="216" fill="#cbbb81" opacity=".14" />
                      <path d="M180 57V273" stroke="#b4b18a" strokeWidth="2" />
                    </>
                  )}
                  <path
                    d={`M${normal - 95 * Math.cos(theta)} ${165 - 95 * Math.sin(theta)}L${normal} 165L${normal + (kind === 'reflection' ? -95 * Math.cos(theta) : 115 * Math.cos(refraction.transmitted))} ${165 + (kind === 'reflection' ? 95 * Math.sin(theta) : 115 * Math.sin(refraction.transmitted))}`}
                    fill="none"
                    stroke="#ab8e5d"
                    strokeWidth="2.5"
                  />
                  <path
                    d={`M${normal - 65} 165H${normal + 22}`}
                    stroke="#8f9f82"
                    strokeDasharray="4 4"
                  />
                  <path
                    d={`M${normal - 95 * Math.cos(theta) - 23 * Math.sin(theta)} ${165 - 95 * Math.sin(theta) + 23 * Math.cos(theta)}L${normal - 95 * Math.cos(theta) + 23 * Math.sin(theta)} ${165 - 95 * Math.sin(theta) - 23 * Math.cos(theta)}`}
                    stroke="#8d9d7a"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <text x={normal - 57} y="149" className="em-small">
                    {settings.angle.toFixed(0)}°
                  </text>
                  <text
                    x={kind === 'reflection' ? normal - 57 : normal + 33}
                    y="188"
                    className="em-small"
                  >
                    {(kind === 'reflection'
                      ? settings.angle
                      : (refraction.transmitted * 180) / Math.PI
                    ).toFixed(0)}
                    °
                  </text>

                  {kind === 'refraction' && (
                    <>
                      <text x="100" y="300" textAnchor="middle" className="em-small">
                        h₁ = 8 mm
                      </text>
                      <text x="255" y="300" textAnchor="middle" className="em-small">
                        h₂ = {(8 * settings.depthRatio).toFixed(1)} mm
                      </text>
                    </>
                  )}
                </>
              ) : kind === 'diffraction' ? (
                <>
                  <path
                    d={`M145 57V${165 - settings.gap * 250}M145 ${165 + settings.gap * 250}V273`}
                    stroke="#9eaa86"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M${49 + 2 * Math.sin(omega * clock)} 81V250`}
                    stroke="#9aaa85"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M156 ${165 - settings.gap * 250}H166M161 ${165 - settings.gap * 250}V${165 + settings.gap * 250}M156 ${165 + settings.gap * 250}H166`}
                    stroke="#aa9166"
                    fill="none"
                  />
                  <text x="176" y="170" className="em-small">
                    a
                  </text>
                </>
              ) : kind === 'interference' ? (
                <>
                  {coherent ? (
                    <>
                      <path
                        d="M67 119V211M67 125H110M67 205H110"
                        stroke="#9eab86"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                      <rect
                        x="48"
                        y="149"
                        width="36"
                        height="32"
                        rx="6"
                        fill="#cbd7b9"
                        stroke="#99ad83"
                      />
                    </>
                  ) : (
                    <>
                      {[125, 205].map((y) => (
                        <g key={y}>
                          <rect
                            x="48"
                            y={y - 15}
                            width="36"
                            height="30"
                            rx="5"
                            fill="#d1d9bc"
                            stroke="#9aab83"
                          />
                          <path d={`M84 ${y}H110`} stroke="#9eab86" strokeWidth="4" />
                        </g>
                      ))}
                    </>
                  )}
                  {[0.14, 0.3].map((y, i) => (
                    <circle
                      key={y}
                      cx="110"
                      cy={py(y)}
                      r={
                        4 +
                        1.5 *
                          Math.sin(
                            (omega + i * 2 * Math.PI * settings.frequencyDifference) * clock -
                              i * settings.phase,
                          )
                      }
                      fill="#b3a47a"
                      stroke="#8a9e7a"
                    />
                  ))}
                  <circle
                    cx={px(0.43)}
                    cy={py(0.22)}
                    r="5"
                    fill="none"
                    stroke="#b08d59"
                    strokeWidth="2"
                  />
                  <text x={px(0.43) + 10} y={py(0.22) + 4} className="em-small">
                    M
                  </text>
                  <circle
                    cx={px(quiet.x)}
                    cy={py(quiet.y)}
                    r="5"
                    fill="none"
                    stroke="#839c8e"
                    strokeWidth="2"
                  />
                  <text x={px(quiet.x) + 10} y={py(quiet.y) + 4} className="em-small">
                    N
                  </text>
                </>
              ) : (
                <>
                  <g clipPath={`url(#${uid}tank)`}>
                    {waves.map((a, i) => (
                      <circle
                        key={i}
                        cx={px(a.x)}
                        cy={py(a.y)}
                        r={a.radius * 500}
                        fill="none"
                        stroke="#8eafa0"
                        strokeWidth="1.8"
                        opacity={Math.max(0.15, 0.8 - a.radius * 0.6)}
                      />
                    ))}
                    <path d={`M${px(sourceX)} 103V165`} stroke="#a29773" strokeWidth="3" />
                    <circle cx={px(sourceX)} cy="165" r="5" fill="#b5a071" />
                  </g>
                  <path
                    d={`M${px(sourceX) - 22} 79H${px(sourceX) + 22}m-5-4 5 4-5 4`}
                    stroke="#b69a63"
                    fill="none"
                    opacity={settings.sourceSpeed > 0 ? 1 : 0}
                  />
                </>
              )}
            </>
          )}
        </svg>
      </div>
      {!canvasAvailable && <p>{t('波场颜色不可用，仍可查看装置与正文。')}</p>}
      <p className="lab-apparatus-caption">
        {kind === 'paper'
          ? t(repeat ? '周期性轻点同一处' : '笔尖轻点一次')
          : kind === 'reflection'
            ? t('斜向入射与挡板反射')
            : kind === 'refraction'
              ? t('浅水板改变传播速度')
              : kind === 'diffraction'
                ? t(film.watch && stage === 6 ? '固定波长，改变缝宽' : '固定缝宽，改变波长')
                : kind === 'interference'
                  ? t(coherent ? '同一振动片带动两根细杆' : '分开驱动，比较相位与频率')
                  : t(
                      settings.sourceSpeed === 0
                        ? '静止振源发出同心波峰'
                        : '每个波峰从发射位置向外走',
                    )}
      </p>
      <div className="textbook-em-meters">
        {index === 0 ? (
          <span>
            {t('纸屑相对原位')}{' '}
            <b>
              {(float.radial * 1000).toFixed(1)} mm · {(float.height * 1000).toFixed(1)} mm
            </b>
          </span>
        ) : index === 1 ? (
          <span>
            i = r = <b>{settings.angle.toFixed(0)}°</b>
          </span>
        ) : index === 2 ? (
          <>
            <span>
              v₂/v₁ <b>{Math.sqrt(settings.depthRatio).toFixed(2)}</b>
            </span>
            <span>
              λ₂/λ₁ <b>{Math.sqrt(settings.depthRatio).toFixed(2)}</b>
            </span>
          </>
        ) : index === 3 ? (
          <>
            <span>
              a <b>{(settings.gap * 100).toFixed(1)} cm</b>
            </span>
            <span>
              λ <b>{(settings.wavelength * 100).toFixed(1)} cm</b>
            </span>
            <span>
              a/λ <b>{(settings.gap / settings.wavelength).toFixed(2)}</b>
            </span>
          </>
        ) : index === 4 ? (
          <>
            <span>
              Δφ <b>{((settings.phase * 180) / Math.PI).toFixed(0)}°</b>
            </span>
            <span>
              Δf <b>{settings.frequencyDifference.toFixed(2)} Hz</b>
            </span>
            <span>
              N{' '}
              <b>
                {rippleValue(rippleComplex(settings, quiet.x, quiet.y), clock, settings).toFixed(2)}
              </b>
            </span>
          </>
        ) : (
          <>
            <span>
              λ {t('前')} <b>{(spaces.front * 100).toFixed(1)} cm</b>
            </span>
            <span>
              λ {t('后')} <b>{(spaces.back * 100).toFixed(1)} cm</b>
            </span>
          </>
        )}
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <div className="segmented">
            {labels.map((z, i) => (
              <button key={z} aria-pressed={mode === i} onClick={() => setMode(i)}>
                {t(z)}
              </button>
            ))}
          </div>
          <Range
            label={t('观察时间')}
            min={0}
            max={index === 5 ? 3.8 : 6}
            step={0.01}
            value={Math.min(time, index === 5 ? 3.8 : 6)}
            onChange={setTime}
          />
          {index === 0 ? (
            <div className="segmented">
              {[false, true].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => setPeriodic(v)}
                  aria-pressed={periodic === v}
                >
                  {t(v ? '周期性轻点同一处' : '笔尖轻点一次')}
                </button>
              ))}
            </div>
          ) : index === 1 || index === 2 ? (
            <>
              <Range
                label={t('入射角')}
                min={10}
                max={50}
                step={1}
                value={angle}
                onChange={setAngle}
              />
              {index === 2 && (
                <Range
                  label={t('浅水与深水的深度比')}
                  min={0.25}
                  max={1}
                  step={0.05}
                  value={depthRatio}
                  onChange={setDepthRatio}
                />
              )}
            </>
          ) : index === 3 ? (
            <>
              <Range
                label={t('狭缝宽度')}
                min={0.03}
                max={0.22}
                step={0.005}
                value={gap}
                onChange={setGap}
              />
              <Range
                label={t('波长')}
                min={0.03}
                max={0.16}
                step={0.005}
                value={wavelength}
                onChange={setWavelength}
              />
            </>
          ) : index === 4 ? (
            <>
              <Range
                label={t('两振源相位差')}
                min={0}
                max={Math.PI}
                step={0.05}
                value={phase}
                onChange={setPhase}
              />
              <Range
                label={t('两振源频率差')}
                min={0}
                max={0.6}
                step={0.02}
                value={detune}
                onChange={setDetune}
              />
            </>
          ) : (
            <Range
              label={t('波源移动速度')}
              min={0}
              max={0.12}
              step={0.01}
              value={speed}
              onChange={setSpeed}
            />
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('水波模型与颜色含义')}</summary>
        <p>
          {t(
            '水槽采用线性重力波与长波近似，常规基准水深8毫米，衍射采用1毫米浅水，速度为√gh；忽略黏性、表面张力和槽边回波。反射与折射匹配边界条件；衍射用狭缝次波积分表示方向展开，近缝区域与绝对振幅不作精密预测。颜色表示瞬时高低，不是水流方向或能量。纸屑局部运动采用小振幅近似并放大侧面起伏，移动振源的每个波峰保留各自发射圆心。',
          )}
        </p>
      </details>
    </div>
  );
}
