import { useState } from 'react';
import { t } from '../../i18n';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import ScrewJackStudio from '../three/ScrewJackStudio';
import { screwDefaults, screwState, screwShot, screwHelixPoint } from '../../models/screw-jack';
import '../../styles/screw-jack.css';
export default function ScrewJack() {
  const film = useShowcase(),
    [manual, setManual] = useState(screwDefaults()),
    [unrolled, setUnrolled] = useState(false),
    p = film.watch ? screwShot(film.chapter, film.chapterProgress) : manual,
    s = screwState(p),
    c = film.watch ? film.chapter : 5,
    showUnrolled = film.watch ? c === 1 : unrolled;
  const flat = (
    <svg viewBox="0 0 340 300" role="img" aria-label={t('方牙丝杆的螺旋侧视与固定螺母剖面')}>
      <path
        d="M78 266H262M102 266V169M238 266V169"
        stroke="#526f72"
        strokeWidth="15"
        strokeLinejoin="round"
      />
      <rect x="136" y={90 - s.lift * 2500} width="68" height="171" rx="5" fill="#c1cccb" />
      {Array.from({ length: Math.floor(0.06 / p.lead) }, (_, i) => {
        const points = Array.from({ length: 41 }, (_, j) => {
          const a = i * Math.PI * 2 + (j / 40) * Math.PI * 2,
            v = screwHelixPoint(a, 0.022, p.lead, s.lift);
          return `${170 + 0.022 * Math.cos(a + s.rotation) * 1600},${250 - v.y * 2500}`;
        });
        return (
          <polyline
            key={i}
            points={points.join(' ')}
            fill="none"
            stroke="#7f9293"
            strokeWidth="3"
          />
        );
      })}
      <path d="M105 160V206H134M235 160V206H206" stroke="#b88d56" strokeWidth="18" fill="none" />
      <path
        d={`M${170 - p.handle * 1600} ${85 - s.lift * 2500}H${170 + p.handle * 1600}`}
        stroke="#ae8754"
        strokeWidth="6"
      />
      <rect x="125" y={42 - s.lift * 2500} width="90" height="30" rx="5" fill="#6b806e" />
      <path
        d={`M170 ${72 - s.lift * 2500}V${90 - s.lift * 2500}`}
        stroke="#7f9293"
        strokeWidth="12"
      />
    </svg>
  );
  return (
    <div className="screw-film">
      <div className="screw-object">
        {showUnrolled ? (
          <div className="screw-unrolled">
            <p>{t('把一个整圈的螺旋展开')}</p>
            <svg viewBox="0 0 340 200" role="img" aria-label={t('一圈圆周长度对应一个导程')}>
              <path
                d={`M35 134L305 ${134 - (p.lead * 270) / (2 * Math.PI * p.radius)}V134Z`}
                fill="#dec9a5"
              />
              <path
                d={`M35 134L305 ${134 - (p.lead * 270) / (2 * Math.PI * p.radius)}`}
                stroke="#b68c56"
                strokeWidth="4"
              />
              <path d="M35 153V164H305V153" stroke="#9caa9a" fill="none" />
              <text x="170" y="190" textAnchor="middle">
                2πr = {(2 * Math.PI * p.radius * 1000).toFixed(1)} mm
              </text>
              <text x="170" y="69" textAnchor="middle">
                {t('导程')} {(p.lead * 1000).toFixed(1)} mm
              </text>
              <text x="170" y="100" textAnchor="middle">
                α = {((s.angle * 180) / Math.PI).toFixed(2)}°
              </text>
            </svg>
            <p>{t('单线方牙：转一圈，轴向前进一个导程。')}</p>
          </div>
        ) : (
          <ScrewJackStudio parameters={p} fallback={flat} />
        )}
      </div>
      <div className="screw-readout">
        <span>
          {t('转过圈数')}
          <b>{p.turns.toFixed(2)}</b>
        </span>
        <span>
          {t('轴向升高')}
          <b>{(s.lift * 1000).toFixed(1)} mm</b>
        </span>
        <span>
          {c >= 5 ? t('下降所需力矩') : t('提升所需力矩')}
          <b>{(c >= 5 ? s.lowerTorque : s.raiseTorque).toFixed(2)} N·m</b>
        </span>
      </div>
      {c >= 4 ? (
        <p className="screw-consequence">
          {c === 4 ? (
            <>
              {t('一圈输入功')} {s.inputWork.toFixed(1)} J = {s.outputWork.toFixed(1)} J +{' '}
              {s.heat.toFixed(1)} J {t('摩擦热')}
            </>
          ) : (
            <>
              {s.selfLocking
                ? t('摩擦角大于导程角：此模型可自锁。')
                : t('导程角达到或超过摩擦角：不能假定会自锁。')}
            </>
          )}
        </p>
      ) : (
        <p className="screw-consequence">
          {t('每圈升高')} {(p.lead * 1000).toFixed(1)} mm · {t('轴向负载')} 1000 N
        </p>
      )}
      {!film.watch && (
        <div className="screw-controls">
          <button className="btn" onClick={() => setUnrolled(!unrolled)}>
            {unrolled ? t('查看螺纹配合') : t('展开一圈螺纹')}
          </button>
          <Range
            label={t('丝杆导程')}
            value={p.lead * 1000}
            min={2}
            max={8}
            unit="mm"
            onChange={(v) => setManual({ ...manual, lead: v / 1000 })}
          />
          <Range
            label={t('转过圈数')}
            value={p.turns}
            min={0}
            max={2}
            step={0.01}
            onChange={(turns) => setManual({ ...manual, turns })}
          />
          <Range
            label={t('螺纹摩擦系数')}
            value={p.friction}
            min={0}
            max={0.2}
            step={0.01}
            onChange={(friction) => setManual({ ...manual, friction })}
          />
        </div>
      )}
      <details className="screw-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '单线方牙螺纹，准静态，忽略止推轴承摩擦、变形与强度；自锁判据不是现实起重设备的安全保证。',
          )}
        </p>
      </details>
    </div>
  );
}
