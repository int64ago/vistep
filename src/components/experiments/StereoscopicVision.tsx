import { useState } from 'react';
import { t } from '../../i18n';
import {
  stereoPoint,
  stereoShot,
  stereoMatches,
  stereoTriangulate,
} from '../../models/stereoscopic-vision';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/stereoscopic-vision.css';
export default function StereoscopicVision() {
  const film = useShowcase(),
    phone = useCompact();
  const [baseline, setBaseline] = useState(64),
    [fixation, setFixation] = useState(800),
    [depth, setDepth] = useState(600),
    [matching, setMatching] = useState(false),
    [wrong, setWrong] = useState(false);
  const shot = film.watch
      ? stereoShot(film.chapter, film.chapterProgress)
      : { baseline, fixation, depth, matching, wrong },
    point = stereoPoint(shot.depth, 0, shot),
    match = stereoMatches(shot.wrong, shot, shot.depth),
    W = phone ? 340 : 760,
    H = phone ? 160 : 220,
    x = (v: number) => W / 2 + v * (phone ? 1.6 : 2.7),
    y = (z: number) => H - 30 - (z / 2500) * (H - 52),
    views = shot.matching ? match.points : [point],
    imageX = (u: number) => W / 2 + u * (phone ? 44 : 100),
    rows = phone ? [40, 106] : [48, 122],
    VH = phone ? 128 : 148,
    estimate = stereoTriangulate(point.left, point.right, shot),
    glyph = phone ? 26 : 18;
  return (
    <section className="stereo-study" data-watch={film.watch}>
      <header>
        <span>{t(shot.matching ? '先认出同一点，才能比较视差' : '两只眼睛，同一个空间物点')}</span>
        <b>{t('俯视几何')}</b>
      </header>
      <svg
        className="stereo-plan"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('两眼基线注视点与空间物点的俯视连接，横向夸大')}
      >
        <path
          d={`M${x(-shot.baseline / 2)} ${y(0)}H${x(shot.baseline / 2)}`}
          stroke="#8c9b93"
          strokeDasharray="3 4"
        />
        {[-1, 1].map((sign) => (
          <g key={sign}>
            <path
              d={`M${x((sign * shot.baseline) / 2)} ${y(0)}L${x(0)} ${y(shot.fixation)}`}
              stroke="#a8ad9e"
              strokeDasharray="3 5"
            />
            {(shot.matching ? [-20, 20] : [0]).map((target, i) => (
              <path
                key={i}
                d={`M${x((sign * shot.baseline) / 2)} ${y(0)}L${x(target)} ${y(shot.depth)}`}
                stroke={i === 0 ? '#bd7953' : '#598d95'}
                strokeWidth="1.6"
              />
            ))}
            <ellipse
              cx={x((sign * shot.baseline) / 2)}
              cy={y(0)}
              rx="9"
              ry="6"
              fill="#dce4d4"
              stroke="#677f74"
            />
          </g>
        ))}
        <circle cx={x(0)} cy={y(shot.fixation)} r="5" fill="#b3c0a3" />
        {(shot.matching ? [-20, 20] : [0]).map((target, i) => (
          <circle
            key={i}
            cx={x(target)}
            cy={y(shot.depth)}
            r="5"
            fill={i === 0 ? '#bd7953' : '#598d95'}
          />
        ))}
        <text x={x(shot.baseline / 2) + 15} y={y(0) + 7} fontSize={glyph} fill="#607467">
          B
        </text>
      </svg>
      <div className="stereo-plan-note">
        <span>
          <i style={{ background: '#b3c0a3' }} />
          {t('注视参照')}
        </span>
        <span>
          <i style={{ background: '#bd7953' }} />
          {t('空间物点')}
        </span>
        <span>{t('横向放大')}</span>
      </div>
      <div className="stereo-view-label">{t('登记到共同注视点，虚拟像平面局部放大')}</div>
      <svg
        className="stereo-views"
        viewBox={`0 0 ${W} ${VH}`}
        role="img"
        aria-label={t('登记后的左右图位置与物点对应关系')}
      >
        {rows.map((row, k) => (
          <g key={k}>
            <text x="18" y={row - 15} fontSize={glyph} fill="#536a5c">
              {t(k === 0 ? '左图' : '右图')}
            </text>
            <path d={`M20 ${row}H${W - 20}`} stroke="#b2bdad" />
            <path d={`M${W / 2} ${row - 8}v16`} stroke="#798e75" strokeDasharray="2 3" />
            {views.map((p, j) => (
              <circle
                key={j}
                cx={imageX(k === 0 ? p.left : p.right)}
                cy={row}
                r="5"
                fill={shot.matching && shot.wrong ? '#777f73' : j === 0 ? '#bd7953' : '#598d95'}
              />
            ))}
          </g>
        ))}
        {(shot.matching ? match.pairs : [[0, 0]]).map(([l, r], i) => (
          <path
            key={i}
            d={`M${imageX(views[l].left)} ${rows[0]}L${imageX(views[r].right)} ${rows[1]}`}
            stroke={shot.wrong ? '#b56765' : i === 0 ? '#bd7953' : '#598d95'}
            strokeDasharray="4 4"
            fill="none"
          />
        ))}
      </svg>
      {shot.matching ? (
        <div className="stereo-result">
          <span>{t(shot.wrong ? '交叉配对的推算深度' : '正确配对的推算深度')}</span>
          <b>
            {match.depths.map((d) => (d === null ? t('无法确定') : d.toFixed(0))).join(' / ')} mm
          </b>
        </div>
      ) : (
        <div className="stereo-values">
          <span>
            {t('相对视差')}
            <b>{point.disparity.toFixed(3)} mm</b>
          </span>
          <span>
            {t('反推深度')}
            <b>{estimate === null ? t('无法确定') : `${estimate.toFixed(0)} mm`}</b>
          </span>
        </div>
      )}
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('像平面与知觉边界')}</summary>
          <p>
            {t(
              '上图横向夸大，不按屏幕角度读数。下图为对齐注视点的理想针孔校正视图，不是眼球解剖或真实视网膜方向；毫米属于f=17mm的虚拟像平面并局部放大。几何三角测量假定对应同一物点，不模拟融合舒适度、知觉阈值、遮挡或个体视力。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="stereo-controls">
          <Range
            label={t('基线间距')}
            value={baseline}
            min={0}
            max={80}
            unit="mm"
            onChange={setBaseline}
          />
          <Range
            label={t('物点深度')}
            value={depth}
            min={300}
            max={2200}
            unit="mm"
            onChange={setDepth}
          />
          <Range
            label={t('注视距离')}
            value={fixation}
            min={400}
            max={1800}
            unit="mm"
            onChange={setFixation}
          />
          <button type="button" aria-pressed={matching} onClick={() => setMatching(!matching)}>
            {t(matching ? '回到单点几何' : '比较两点匹配')}
          </button>
          {matching && (
            <button type="button" aria-pressed={wrong} onClick={() => setWrong(!wrong)}>
              {t(wrong ? '恢复正确配对' : '交换右图配对')}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
