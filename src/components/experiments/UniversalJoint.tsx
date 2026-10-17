import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import UniversalJointStudio from '../three/UniversalJointStudio';
import { universalJointState, universalJointShot } from '../../models/universal-joint';
import '../../styles/universal-joint.css';
export default function UniversalJoint() {
  const film = useShowcase(),
    [angle, setAngle] = useState(0),
    [bend, setBend] = useState(30),
    [second, setSecond] = useState(30),
    [paired, setPaired] = useState(false),
    s = film.watch
      ? universalJointShot(film.chapter, film.chapterProgress)
      : universalJointState(angle, bend, paired, second),
    c = film.watch ? film.chapter : 6;
  const curve = Array.from({ length: 121 }, (_, i) =>
    universalJointState((i / 120) * Math.PI * 2, s.bend, s.paired, s.secondBend),
  );
  const flat = (
    <svg
      viewBox="0 0 340 220"
      role="img"
      aria-label={t('万向节运动学投影，角度与速度关系保持一致')}
    >
      <path d="M20 135H135" stroke="#b68154" strokeWidth="17" strokeLinecap="round" />
      <path
        d={`M135 135L${135 + s.middleAxis.x * (s.paired ? 85 : 160)} ${135 - s.middleAxis.y * (s.paired ? 85 : 160)}`}
        stroke="#5f9597"
        strokeWidth="17"
        strokeLinecap="round"
      />
      {s.paired && (
        <path
          d={`M${135 + s.middleAxis.x * 85} ${135 - s.middleAxis.y * 85}l${s.outputAxis.x * 95} ${-s.outputAxis.y * 95}`}
          stroke="#b68154"
          strokeWidth="17"
          strokeLinecap="round"
        />
      )}
      {[0, ...(s.paired ? [1] : [])].map((i) => {
        const ox = 135 + s.middleAxis.x * 85 * i,
          oy = 135 - s.middleAxis.y * 85 * i,
          u = i ? s.middlePin : s.inputPin,
          v = i ? s.outputPin : s.middlePin;
        return (
          <g key={i}>
            <circle cx={ox} cy={oy} r="26" fill="#eef2e8" stroke="#bdc9bc" />
            <path
              d={`M${ox - u.y * 22} ${oy - u.z * 22}L${ox + u.y * 22} ${oy + u.z * 22}M${ox - v.y * 22} ${oy - v.z * 22}L${ox + v.y * 22} ${oy + v.z * 22}`}
              stroke="#82999a"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </g>
        );
      })}
      <text x="170" y="195" textAnchor="middle">
        β = {s.bend.toFixed(0)}°{s.paired ? ` / ${s.secondBend.toFixed(0)}°` : ''}
      </text>
    </svg>
  );
  return (
    <div className="joint-film">
      <div className="joint-object">
        <UniversalJointStudio state={s} fallback={flat} />
      </div>
      <p className="joint-unit">{t('转速（rpm）')}</p>
      <div className="joint-readout">
        <span>
          {t('输入')}
          <b>120.0</b>
        </span>
        {s.paired && (
          <span>
            {t('中间')}
            <b>{(120 * s.middleRatio).toFixed(1)}</b>
          </span>
        )}
        <span>
          {t('输出')}
          <b>{(120 * s.ratio).toFixed(1)}</b>
        </span>
      </div>
      <div className="joint-trace">
        <svg viewBox="0 0 340 125" role="img" aria-label={t('一圈内的输出与输入角速度比')}>
          <path d="M30 21V95H320M30 58H320" stroke="#becbbd" fill="none" />
          <polyline
            points={curve
              .map((v, i) => `${30 + (i * 290) / 120},${58 - (v.ratio - 1) * 150}`)
              .join(' ')}
            stroke="#528f91"
            strokeWidth="3"
            fill="none"
          />
          {s.paired && (
            <polyline
              points={curve
                .map((v, i) => `${30 + (i * 290) / 120},${58 - (v.middleRatio - 1) * 150}`)
                .join(' ')}
              stroke="#b69a70"
              strokeWidth="2"
              strokeDasharray="4 4"
              fill="none"
            />
          )}
          <circle
            cx={30 + ((s.input % (2 * Math.PI)) / (2 * Math.PI)) * 290}
            cy={58 - (s.ratio - 1) * 150}
            r="5"
            fill="#528f91"
          />
          <text x="21" y="64" textAnchor="end">
            1
          </text>
          <text x="30" y="119">
            0°
          </text>
          <text x="320" y="119" textAnchor="end">
            360°
          </text>
          <text x="35" y="19">
            ωout / ωin
          </text>
        </svg>
      </div>
      <p className="joint-observation">
        {c === 4 ? (
          <>
            {t('累计输入圈数')} {(s.input / (Math.PI * 2)).toFixed(2)} · {t('累计输出圈数')}{' '}
            {(s.output / (Math.PI * 2)).toFixed(2)}
          </>
        ) : (
          <>
            {t('轴线夹角')} {s.bend.toFixed(0)}° {s.paired ? ` / ${s.secondBend.toFixed(0)}°` : ''}{' '}
            {s.paired && (
              <>
                <br />
                <span className="joint-legend">{t('虚线：中间 · 实线：输出')}</span>
              </>
            )}
          </>
        )}
      </p>
      {!film.watch && (
        <div className="joint-controls">
          <Segments
            label={t('万向节组合')}
            value={s.paired ? 'pair' : 'single'}
            options={[
              { value: 'single', label: t('单万向节') },
              { value: 'pair', label: t('双万向节') },
            ]}
            onChange={(v) => setPaired(v === 'pair')}
          />
          <Range
            label={t('输入转角')}
            value={(angle * 180) / Math.PI}
            min={0}
            max={720}
            unit="°"
            onChange={(v) => setAngle((v * Math.PI) / 180)}
          />
          <Range
            label={t('第一节夹角')}
            value={bend}
            min={0}
            max={35}
            unit="°"
            onChange={setBend}
          />
          {s.paired && (
            <Range
              label={t('第二节夹角')}
              value={second}
              min={0}
              max={35}
              unit="°"
              onChange={setSecond}
            />
          )}
        </div>
      )}
      <details className="joint-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '刚体、无间隙的十字轴运动学；动画慢放，转速读数按输入120 rpm计算；不计算扭矩、摩擦、惯量或结构干涉；中间叉头固定同相，双节抵消还需要相等夹角。',
          )}
        </p>
      </details>
    </div>
  );
}
