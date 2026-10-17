import { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import { moireSetup, moireAt, moireContour, moireShot } from '../../models/moire';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/moire.css';
export default function Moire() {
  const film = useShowcase(),
    phone = useCompact(),
    canvas = useRef<HTMLCanvasElement>(null);
  const [pitch, setPitch] = useState(4.4),
    [angle, setAngle] = useState(0),
    [offset, setOffset] = useState(0),
    [single, setSingle] = useState(false),
    [slow, setSlow] = useState(false),
    [unavailable, setUnavailable] = useState(false);
  const shot = film.watch
      ? moireShot(film.chapter, film.chapterProgress)
      : { pitch1: 4, pitch2: pitch, angle, offset, single, track: true },
    s = moireSetup(shot),
    W = phone ? 340 : 760,
    H = phone ? 210 : 280,
    physicalH = (90 * H) / W,
    x = (v: number) => W / 2 + (v / 90) * W,
    y = (v: number) => H / 2 - (v / 90) * W,
    fine = moireContour(s.q2, -s.offset / s.pitch2, 90, physicalH),
    coarse = moireContour(s.difference, s.offset / s.pitch2, 90, physicalH),
    modeSlow = !film.watch && slow && !shot.single;
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) {
      setUnavailable(true);
      return;
    }
    const w = canvas.current!.width,
      h = canvas.current!.height,
      image = ctx.createImageData(w, h),
      phase = (2 * Math.PI * s.offset) / s.pitch2;
    const cols = Array.from({ length: w }, (_, i) => {
      const X = ((i + 0.5 - w / 2) / w) * 90,
        A = (2 * Math.PI * X) / s.pitch1,
        B = 2 * Math.PI * s.q2.x * X - phase;
      return {
        a: (1 + Math.cos(A)) / 2,
        A,
        c: Math.cos(B),
        si: Math.sin(B),
        cosA: Math.cos(A),
        sinA: Math.sin(A),
      };
    });
    for (let j = 0; j < h; j++) {
      const Y = ((h / 2 - j - 0.5) / h) * physicalH,
        B = 2 * Math.PI * s.q2.y * Y,
        c = Math.cos(B),
        si = Math.sin(B);
      for (let i = 0; i < w; i++) {
        const v = cols[i],
          cosB = v.c * c - v.si * si,
          sinB = v.si * c + v.c * si,
          transmission = modeSlow
            ? (1 + v.cosA * cosB + v.sinA * sinB) / 2
            : shot.single
              ? v.a
              : (v.a * (1 + cosB)) / 2,
          shade = Math.round(45 + 195 * transmission),
          k = (j * w + i) * 4;
        image.data[k] = shade;
        image.data[k + 1] = shade + Math.round((255 - shade) * 0.025);
        image.data[k + 2] = shade + Math.round((255 - shade) * 0.035);
        image.data[k + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }, [s.pitch1, s.pitch2, s.angle, s.offset, shot.single, modeSlow, physicalH]);
  const slice = Array.from({ length: 181 }, (_, i) => {
    const X = -45 + i * 0.5,
      v = moireAt(X, 0, s);
    return `${x(X)},${44 - (shot.single ? v.first : v.slow) * 32}`;
  }).join(' ');
  return (
    <section className="moire-study">
      <header>
        <span>
          {t(
            shot.single
              ? '一张细纹，还没有差频'
              : modeSlow
                ? '单独看差频成分'
                : '两张细纹，显出更大的周期',
          )}
        </span>
        <b>{t('几何叠纹')}</b>
      </header>
      <div className="moire-field">
        {unavailable ? (
          <p role="status">{t('当前无法绘制叠纹，可继续查看差频曲线与周期。')}</p>
        ) : (
          <canvas
            ref={canvas}
            width={phone ? 320 : 560}
            height={phone ? 198 : 206}
            role="img"
            aria-label={t(
              modeSlow
                ? '分离出的归一化差频场'
                : shot.single
                  ? '单层正弦透射光栅'
                  : '两张正弦透射光栅在同一物理坐标中相乘产生的摩尔纹',
            )}
          />
        )}
        {shot.track && !shot.single && (
          <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            {[fine, coarse].map(
              (points, i) =>
                points.length === 2 && (
                  <path
                    key={i}
                    d={`M${x(points[0].x)} ${y(points[0].y)}L${x(points[1].x)} ${y(points[1].y)}`}
                    stroke={i === 0 ? '#68c5df' : '#f4bd79'}
                    strokeWidth={i === 0 ? 2 : 3}
                    strokeDasharray={i === 0 ? '3 4' : undefined}
                  />
                ),
            )}
          </svg>
        )}
      </div>
      <div className="moire-slice-label">
        {t(shot.single ? '第一层横切线透射率' : '中央横切线的差频成分（归一化）')}
      </div>
      <svg
        className="moire-slice"
        viewBox={`0 0 ${W} 50`}
        role="img"
        aria-label={t('与主图同坐标的中央横切曲线')}
      >
        <polyline points={slice} fill="none" stroke="#b69162" strokeWidth="2" />
      </svg>
      <div className="moire-values">
        <span>
          p₁ {s.pitch1.toFixed(1)}
          {!shot.single && <> · p₂ {s.pitch2.toFixed(2)}</>} mm
        </span>
        {!shot.single && <span>θ {s.angle.toFixed(1)}°</span>}
        <b>
          {!shot.single && (
            <>
              {t('差频周期')} {s.period === null ? t('无独立周期') : `${s.period.toFixed(1)} mm`}
            </>
          )}
        </b>
      </div>
      {shot.track && !shot.single && (
        <div className="moire-markers">
          <span>
            <i style={{ background: '#68c5df' }} />
            {t('被追踪细纹')}
          </span>
          <span>
            <i style={{ background: '#f4bd79' }} />
            {t('差频峰')}
          </span>
        </div>
      )}
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('透射乘积与采样边界')}</summary>
          <p>
            {t(
              '使用两张理想正弦透射光栅的乘积，粗纹来自空间频率向量之差；下方曲线仅分离差频项并归一化，不是总透射率。主图灰阶为单调示意映射。光栅周期按固定90mm视野计算，不是由屏幕像素混叠造出的摩尔纹；不模拟波动衍射、材料间距或相机传感器。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="moire-controls">
          {!single && (
            <>
              <Range
                label={t('第二层细纹周期')}
                value={pitch}
                min={4}
                max={5}
                step={0.02}
                unit="mm"
                onChange={setPitch}
              />
              <Range
                label={t('第二层转角')}
                value={angle}
                min={0}
                max={15}
                step={0.1}
                unit="°"
                onChange={setAngle}
              />
              <Range
                label={t('第二层法向平移')}
                value={offset}
                min={0}
                max={4.4}
                step={0.02}
                unit="mm"
                onChange={setOffset}
              />
            </>
          )}
          <button type="button" aria-pressed={single} onClick={() => setSingle(!single)}>
            {t(single ? '叠上第二层' : '只看第一层')}
          </button>
          {!single && (
            <button type="button" aria-pressed={slow} onClick={() => setSlow(!slow)}>
              {t(slow ? '恢复完整乘积' : '单独看差频项')}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
