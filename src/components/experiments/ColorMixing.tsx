import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import {
  mixingShot,
  mixingFilters,
  mixingCss,
  mixingLuminance,
  mixingBeam,
  mixingEncode,
  type LinearRgb,
} from '../../models/color-mixing';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/color-mixing.css';
const encode = Array.from({ length: 1025 }, (_, i) => Math.round(255 * mixingEncode(i / 1024)));
export default function ColorMixing() {
  const film = useShowcase(),
    phone = useCompact(),
    canvas = useRef<HTMLCanvasElement>(null);
  const [lights, setLights] = useState<LinearRgb>([1, 1, 1]),
    [filters, setFilters] = useState<LinearRgb>([1, 0, 1]),
    [subtract, setSubtract] = useState(false),
    [redInput, setRedInput] = useState(false),
    [unavailable, setUnavailable] = useState(false);
  const shot = film.watch
      ? mixingShot(film.chapter, film.chapterProgress)
      : { lights, filters, subtract, input: (redInput ? [1, 0, 0] : [1, 1, 1]) as LinearRgb },
    state = mixingFilters(shot.input, shot.filters),
    output = shot.subtract ? state.output : shot.lights,
    W = phone ? 340 : 660,
    H = phone ? 215 : 270,
    field = useMemo(() => {
      const w = phone ? 300 : 480,
        h = phone ? 190 : 240,
        centers = phone
          ? [
              [0.36, 0.38],
              [0.64, 0.38],
              [0.5, 0.62],
            ]
          : [
              [0.4, 0.42],
              [0.6, 0.42],
              [0.5, 0.6],
            ],
        radius = phone ? w * 0.22 : w * 0.19;
      const masks = centers.map(([cx, cy]) =>
        Float32Array.from({ length: w * h }, (_, i) =>
          mixingBeam(Math.hypot((i % w) - cx * w, Math.floor(i / w) - cy * h) / radius),
        ),
      );
      return { w, h, masks };
    }, [phone]);
  useEffect(() => {
    if (shot.subtract) return;
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) {
      setUnavailable(true);
      return;
    }
    const image = ctx.createImageData(field.w, field.h);
    for (let i = 0; i < field.w * field.h; i++) {
      for (let k = 0; k < 3; k++)
        image.data[4 * i + k] = encode[Math.round(1024 * field.masks[k][i] * shot.lights[k])];
      image.data[4 * i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }, [shot.subtract, shot.lights[0], shot.lights[1], shot.lights[2], field]);
  return (
    <section className="mixing-study">
      <header>
        <span>{t(shot.subtract ? '同一束光，依次通过滤片' : '不同色光，到达同一位置')}</span>
        <b>{shot.subtract ? 'CMY' : 'RGB'}</b>
      </header>
      {shot.subtract ? (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={t('白光的三个理想RGB通道依次穿过CMY滤片，线宽跟随剩余能量')}
        >
          {state.stages.map((v, j) =>
            v.map((power, k) => (
              <path
                key={`${j}-${k}`}
                d={`M${20 + (j * (W - 40)) / 4} ${H * 0.4 + k * 24}H${20 + ((j + 1) * (W - 40)) / 4}`}
                stroke={['#ef826b', '#a8d493', '#8aabef'][k]}
                strokeWidth={power * 10 + 0.5}
                opacity={power > 0 ? 1 : 0.1}
              />
            )),
          )}
          {shot.filters.map((amount, j) => {
            const x = 20 + ((j + 1) * (W - 40)) / 4;
            return (
              <g key={j}>
                <rect
                  x={x - 5}
                  y={H * 0.4 - 22}
                  width="10"
                  height="96"
                  rx="5"
                  fill={['#88d7d5', '#d9a0d0', '#e0cf85'][j]}
                  fillOpacity={0.2 + 0.6 * amount}
                  stroke="#e7e3ca"
                />
                <text
                  x={x}
                  y={H * 0.4 - 38}
                  fontSize={phone ? 26 : 18}
                  textAnchor="middle"
                  fill="#e4e7de"
                >
                  {['C', 'M', 'Y'][j]}
                </text>
              </g>
            );
          })}
          <rect
            x={W / 2 - 30}
            y={H - 39}
            width="60"
            height="22"
            rx="10"
            fill={mixingCss(output)}
            stroke="#b5c1b166"
          />
        </svg>
      ) : (
        <div className="mixing-pools">
          {unavailable ? (
            <p role="status">{t('当前无法绘制光斑，通道读数仍可探索。')}</p>
          ) : (
            <canvas
              ref={canvas}
              width={field.w}
              height={field.h}
              role="img"
              aria-label={t('在线性光强中逐像素叠加的红绿蓝柔边光斑')}
            />
          )}
        </div>
      )}
      <div className="mixing-channels">
        {output.map((power, k) => (
          <div key={k}>
            <span>{['R', 'G', 'B'][k]}</span>
            <i>
              <b
                style={{
                  width: `${power * 100}%`,
                  background: ['#ef826b', '#a8d493', '#8aabef'][k],
                }}
              />
            </i>
            <em>{(power * 100).toFixed(0)}%</em>
          </div>
        ))}
      </div>
      <div className="mixing-result">
        <i style={{ background: mixingCss(output) }} />
        <span>
          {t('输出相对亮度')} {(100 * mixingLuminance(output)).toFixed(0)}%
        </span>
        {!shot.subtract && film.watch && film.chapter === 2 && (
          <b>sRGB {Math.round(mixingEncode(0.5) * 255)}</b>
        )}
      </div>
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('三通道与滤片的简化')}</summary>
          <p>
            {t(
              '光强在线性sRGB通道中相加，显示前才做sRGB编码。滤片按理想CMY通道透射率相乘，未预测真实颜料、宽带滤片或视觉适应。主光斑是有限柔边光束，通道读数对应共同平台区。黄色外观不代表产生了单一黄色波长。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="mixing-controls">
          <button type="button" aria-pressed={subtract} onClick={() => setSubtract(!subtract)}>
            {t(subtract ? '改为色光相加' : '改为滤片串联')}
          </button>
          {(shot.subtract ? shot.filters : shot.lights).map((v, k) => (
            <Range
              key={`${subtract}-${k}`}
              label={`${shot.subtract ? ['C', 'M', 'Y'][k] : ['R', 'G', 'B'][k]} ${t(shot.subtract ? '滤除比例' : '相对光强')}`}
              value={v}
              min={0}
              max={1}
              step={0.01}
              onChange={(q) => {
                const next = [...(shot.subtract ? filters : lights)] as LinearRgb;
                next[k] = q;
                shot.subtract ? setFilters(next) : setLights(next);
              }}
            />
          ))}
          {subtract && (
            <button type="button" aria-pressed={redInput} onClick={() => setRedInput(!redInput)}>
              {t(redInput ? '恢复白色照明' : '改用红色照明')}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
