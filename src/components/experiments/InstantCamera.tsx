import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { Range, Segments } from '../lab/Controls';
import InstantCameraStudio from '../three/InstantCameraStudio';
import InstantCameraDiagram from '../three/InstantCameraDiagram';
import {
  IC,
  IC_FEED_MAX,
  icDirtPositions,
  icImagePixels,
  icShot,
  type IcShot,
  type IcView,
} from '../../models/instant-camera';
import '../../styles/instant-camera.css';
const teal = '#397d79',
  paste = '#7e98bd';
function Photo({ shot, comparison = false }: { shot: IcShot; comparison?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pixels = useMemo(
    () => icImagePixels(shot.feedMm, shot.seconds, shot.dirty),
    [shot.feedMm, shot.seconds, shot.dirty],
  );
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (ctx) ctx.putImageData(new ImageData(new Uint8ClampedArray(pixels), 48, 48), 0, 0);
  }, [pixels]);
  return (
    <div
      className={`instant-print ${comparison ? 'instant-print-small' : ''}`}
      style={{ aspectRatio: `${IC.width} / ${IC.length}` }}
      aria-label={t('同一杯子的彩色成像模拟')}
      data-instant-print-dirty={shot.dirty}
    >
      <canvas
        ref={canvas}
        width="48"
        height="48"
        style={{ aspectRatio: `${IC.imageWidth} / ${IC.imageLength}` }}
      />
      <div className="instant-print-border">
        <span>{t(comparison ? (shot.dirty ? '脏滚轮处理' : '清洁滚轮处理') : '同一张相纸')}</span>
      </div>
    </div>
  );
}
function Spread({ shot, width }: { shot: IcShot; width: number }) {
  const cardW = width < 600 ? 160 : 220,
    cardH = (cardW * IC.length) / IC.width,
    x = (width - cardW) / 2,
    y = 12;
  const scale = cardW / IC.width,
    margin = shot.transport.imageMargin,
    front = shot.transport.front;
  const imageX = x + margin * scale,
    imageY = y + (IC.length - IC.imageStart - IC.imageLength) * scale;
  const imageW = IC.imageWidth * scale,
    imageH = IC.imageLength * scale,
    wetH = Math.max(0, front - IC.imageStart) * scale;
  const rollerY = y + (IC.length - Math.min(Math.max(shot.transport.lead, 0), IC.length)) * scale;
  return (
    <svg
      viewBox={`0 0 ${width} 318`}
      role="img"
      aria-label={t('从药囊边到远端的试剂铺展，铺展前沿由同一张相纸经过滚轮的位置决定')}
    >
      <rect x={x} y={y} width={cardW} height={cardH} rx="4" fill="#fbf5e6" stroke="#d6cbb3" />
      <rect x={imageX} y={imageY} width={imageW} height={imageH} fill="#d4d8c7" />
      <rect
        x={imageX}
        y={imageY + imageH - wetH}
        width={imageW}
        height={wetH}
        fill={paste}
        opacity=".92"
      />
      <path
        d={`M${imageX} ${imageY + imageH - wetH}H${imageX + imageW}`}
        stroke={teal}
        strokeWidth="2"
      />
      <rect
        x={imageX}
        y={y + cardH - 14 * scale}
        width={imageW}
        height={8 * scale}
        rx="4"
        fill={shot.transport.ruptured ? '#b8ab8b' : '#c5ae72'}
      />
      {shot.transport.contact && (
        <g>
          <rect x={x - 18} y={rollerY - 5} width={cardW + 36} height="10" rx="5" fill="#818f81" />
          <path
            d={`M${x - 12} ${rollerY - 2}H${x + cardW + 12}`}
            stroke="#d4d5c2"
            strokeWidth="2"
          />
        </g>
      )}
      {shot.dirty &&
        icDirtPositions()
          .filter((u) => u <= shot.transport.front)
          .map((u) => (
            <rect
              key={u}
              x={x + (IC.dirtV - IC.dirtHalfSize) * scale}
              y={y + (IC.length - u - IC.dirtHalfSize) * scale}
              width={IC.dirtHalfSize * 2 * scale}
              height={IC.dirtHalfSize * 2 * scale}
              fill="#ece0c4"
            />
          ))}
    </svg>
  );
}
function Layers({ shot, width }: { shot: IcShot; width: number }) {
  const p = shot.sample,
    w = width - 32,
    x = 16;
  const colors = ['#dce3d4', '#efe1bd', paste, '#649e9d', '#b57591', '#ccb65e'];
  const labels = [
    '透明覆盖片',
    '图像接收层',
    '试剂与遮光层',
    '感光负片 · C',
    '感光负片 · M',
    '感光负片 · Y',
  ];
  const yTop = 25,
    rowH = 42;
  return (
    <svg
      viewBox={`0 0 ${width} 318`}
      role="img"
      aria-label={t('积分式相纸层间示意：负片中的染料受曝光控制，迁入接收层形成正像')}
    >
      {labels.map((label, i) => (
        <g key={label}>
          <rect
            x={x}
            y={yTop + i * rowH}
            width={w}
            height="31"
            rx="8"
            fill={colors[i]}
            opacity={i === 2 ? 0.85 : 0.65}
          />
          <text x={x + 12} y={yTop + i * rowH + 22}>
            {t(label)}
          </text>
        </g>
      ))}
      {[0, 1, 2].map((k) => {
        const mobile = p.received[k],
          fixed = p.fixed[k],
          cx = width - 39 - k * 18;
        return (
          <g key={k}>
            <path
              d={`M${cx} ${yTop + (3 + k) * rowH - 4}V${yTop + rowH + 16}`}
              fill="none"
              stroke={colors[3 + k]}
              strokeWidth="2"
              opacity=".6"
            />
            <circle cx={cx} cy={yTop + (3 + k) * rowH + 15} r={3 + fixed * 3} fill="#4c5548" />
            <circle cx={cx} cy={yTop + rowH + 15} r={3 + mobile * 4} fill={colors[3 + k]} />
          </g>
        );
      })}
      <text x={width / 2} y="310" textAnchor="middle">
        {t('层厚与迁移速度为教学示意')}
      </text>
    </svg>
  );
}
const viewLabels: Record<IcView, string> = {
  exposure: '曝光与潜像',
  transport: '同一张相纸',
  rollers: '滚轮与药囊',
  spread: '铺展试剂',
  layers: '层间显影',
  develop: '慢慢成像',
  care: '同样曝光，两种处理',
};
export default function InstantCamera() {
  const film = useShowcase(),
    host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(700),
    [view, setView] = useState<IcView>('transport'),
    [feed, setFeed] = useState(50),
    [minutes, setMinutes] = useState(5),
    [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const o = new ResizeObserver(([e]) => setWidth(Math.max(240, Math.round(e.contentRect.width))));
    o.observe(host.current);
    return () => o.disconnect();
  }, []);
  const views = Object.keys(viewLabels) as IcView[],
    index = views.indexOf(view);
  const shot = icShot(
    film.watch ? film.chapter : index,
    film.watch ? film.chapterProgress : 0.85,
    film.watch ? undefined : { feedMm: feed, seconds: minutes * 60, dirty },
  );
  const physical = ['exposure', 'transport', 'rollers'].includes(shot.view);
  const elapsed = Math.floor(shot.seconds / 60),
    elapsedSeconds = Math.floor(shot.seconds % 60);
  const choose = (next: IcView) => {
    setView(next);
    if (['spread', 'layers', 'develop', 'care'].includes(next)) setFeed(IC_FEED_MAX);
    else if (next === 'exposure') setFeed(0);
    else if (next === 'rollers') setFeed(20);
    else setFeed(50);
  };
  return (
    <div
      className="instant-camera-scene"
      ref={host}
      data-instant-view={shot.view}
      data-instant-feed={shot.feedMm.toFixed(3)}
      data-instant-seconds={shot.seconds.toFixed(2)}
      data-instant-dirty={shot.dirty}
    >
      <div className="instant-film-stage">
        <div className="instant-film-heading">
          <span>Polaroid i-Type</span>
          <span>
            {shot.view === 'layers'
              ? t(
                  '模型时间 {0}',
                  `${String(elapsed).padStart(2, '0')}:${String(elapsedSeconds).padStart(2, '0')}`,
                )
              : t('积分式彩色相纸')}
          </span>
        </div>
        <div className="instant-film-art">
          {physical && shot.view !== 'rollers' && <InstantCameraStudio shot={shot} width={width} />}
          {shot.view === 'rollers' && <InstantCameraDiagram shot={shot} width={width} />}
          {shot.view === 'spread' && <Spread shot={shot} width={width} />}
          {shot.view === 'layers' && <Layers shot={shot} width={width} />}
          {shot.view === 'develop' && (
            <div className="instant-development">
              <Photo shot={shot} />
              <div className="instant-time">
                <span>{t('化学过程已过去')}</span>
                <strong>
                  {String(elapsed).padStart(2, '0')}:{String(elapsedSeconds).padStart(2, '0')}
                </strong>
                <span>{t('分 : 秒 · 时间压缩')}</span>
              </div>
            </div>
          )}
          {shot.view === 'care' && (
            <div className="instant-care">
              <div className="instant-compare">
                <Photo shot={{ ...shot, dirty: false }} comparison />
                <Photo shot={{ ...shot, dirty: true }} comparison />
              </div>
              <p>{t(shot.dirty ? '同一污点，转一圈再压一次' : '污点留在这张；清洁用于下一张')}</p>
            </div>
          )}
        </div>
        <p className="instant-object-status">
          {t(
            shot.view === 'exposure'
              ? shot.latent
                ? '曝光留下潜像；肉眼尚看不到'
                : shot.shutterOpen
                  ? '光穿过覆盖片，记录在感光层'
                  : '等待曝光，药囊仍封闭'
              : shot.view === 'transport'
                ? '相纸连续前进，没有换成另一张'
                : shot.view === 'rollers'
                  ? shot.transport.ruptured
                    ? '药囊已破，试剂仍在相纸内部'
                    : '滚轮从两面压向药囊'
                  : shot.view === 'spread'
                    ? '滚轮把试剂铺成一层薄膜'
                    : shot.view === 'layers'
                      ? '染料迁入接收层，不是喷墨打印'
                      : shot.view === 'develop'
                        ? '彩色 i-Type 通常需要 10–15 分钟'
                        : '保护成像：避强光，不甩、不挤压',
          )}
        </p>
      </div>
      {!film.watch && (
        <div className="instant-explore">
          <div className="instant-view-picker" role="group" aria-label={t('选择观察尺度')}>
            {views.map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => choose(v)}>
                {t(viewLabels[v])}
              </button>
            ))}
          </div>
          {['transport', 'rollers', 'spread'].includes(view) && (
            <Range
              label={t('相纸走过的距离')}
              value={feed}
              min={0}
              max={IC_FEED_MAX}
              unit="mm"
              step={0.5}
              onChange={setFeed}
            />
          )}
          {['layers', 'develop', 'care'].includes(view) && (
            <Range
              label={t('显影已经过去')}
              value={minutes}
              min={0}
              max={15}
              unit={t('分钟')}
              step={0.25}
              onChange={setMinutes}
            />
          )}
          {view !== 'care' && (
            <Segments
              value={dirty ? 'dirty' : 'clean'}
              onChange={(v) => setDirty(v === 'dirty')}
              label={t('同一组滚轮')}
              options={[
                { value: 'clean', label: t('清洁') },
                { value: 'dirty', label: t('一处污点') },
              ]}
            />
          )}
          <p className="instant-accounting">
            {t(
              '试剂覆盖：{0}%；层间图示不代表完整配方。',
              Math.round(shot.transport.coverage * 100),
            )}
          </p>
        </div>
      )}
      <details className="instant-model-notes">
        <summary>{t('这个相纸模型的范围')}</summary>
        <p>
          {t(
            '采用 Polaroid 彩色 i-Type 的积分式结构与染料迁移原理，不混用 Instax。相纸尺寸来自官方；机身、滚轮半径、药液厚度与 CMY 动力学是教学参数，不预测实际照片颜色或显影速度。',
          )}
        </p>
        <p>
          {t(
            '机械走纸与化学成像分别压缩时间。微观层厚被放大；遮光层不代表可以把刚排出的相纸暴露在强光下。无需剥离相纸，也不应甩动。',
          )}
        </p>
      </details>
    </div>
  );
}
