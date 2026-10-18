import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  leafChloroplast,
  microscopeOptics,
  visibleCells,
  type Specimen,
} from '../../models/bio-cell-microscopy';
import '../../styles/bio-cell-microscopy.css';
export default function BioCellMicroscopy() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [specimen, setSpecimen] = useState<Specimen>(film.variant === 'history' ? 'cork' : 'leaf'),
    [power, setPower] = useState(40),
    [focus, setFocus] = useState(0),
    [offset, setOffset] = useState(0),
    [time, setTime] = useState(18);
  const chapter = film.chapter,
    p = film.chapterProgress;
  const sample = film.watch
    ? chapter === 0
      ? 'cork'
      : chapter === 1
        ? 'cheek'
        : 'leaf'
    : specimen;
  const objective = film.watch
    ? chapter < 2
      ? 40
      : chapter === 2
        ? 10
        : chapter === 3
          ? 10 + 30 * ease(ramp(p, 0.12, 0.55))
          : 40
    : power;
  const stage = film.watch ? (chapter === 2 ? 180 * (1 - ease(ramp(p, 0.1, 0.8))) : 0) : offset;
  const blur = film.watch
    ? chapter === 3
      ? 2 * (1 - ease(ramp(p, 0.6, 0.85)))
      : 0
    : Math.abs(focus);
  const moving = film.watch ? chapter === 5 : sample === 'leaf';
  const seconds = film.watch ? (chapter === 5 ? film.chapterTime : 0) : time;
  const optics = microscopeOptics(objective),
    cells = visibleCells(sample, optics.fieldUm, stage);
  const chloroplasts = Array.from({ length: 18 }, (_, i) => leafChloroplast(i, seconds, moving));
  return (
    <section className="bio-microscope" data-watch={film.watch || undefined}>
      <div className="bio-micro-layout">
        <div className="bio-micro-instrument" aria-hidden="true">
          <svg viewBox="0 0 180 270">
            <defs>
              <linearGradient id={`${id}-metal`}>
                <stop stopColor="#617d76" />
                <stop offset=".45" stopColor="#dae3d4" />
                <stop offset="1" stopColor="#8a9e8f" />
              </linearGradient>
            </defs>
            <path d="M44 240H145Q157 242 158 253H29Q29 242 44 240" fill="#49675f" />
            <path
              d="M119 240V188C163 147 141 71 97 73"
              fill="none"
              stroke={`url(#${id}-metal)`}
              strokeWidth="25"
            />
            <path d="M86 58L110 75L89 111L65 94Z" fill="#526d68" />
            <path d="M90 48L112 62L103 78L81 63Z" fill="#2a4943" />
            <ellipse cx="89" cy="112" rx="25" ry="8" fill="#a4ad97" />
            <path d="M78 116V141M96 119V153" stroke="#e1cf98" strokeWidth="9" />
            <path d="M40 159H126" stroke="#3d5751" strokeWidth="12" />
            <path d="M55 151H105" stroke="#9ccbbd" strokeWidth="3" />
            <path d="M78 167V209" stroke="#f0dfa3" strokeWidth="12" opacity=".25" />
            <circle cx="78" cy="216" r="12" fill="#f2dc9d" />
            <circle cx="131" cy="161" r="17" fill="#38554d" />
            <circle cx="131" cy="161" r="9" fill="#c6ceb6" />
          </svg>
          <p>
            {objective > 10 && objective < 40
              ? `${t('换镜过渡')} · 10× → 40×`
              : `${t('目镜')} 10× · ${t('物镜')} ${Math.round(objective)}×`}
          </p>
        </div>
        <div className="bio-micro-view">
          <svg
            viewBox="0 0 360 360"
            role="img"
            aria-label={t('以微米为单位的显微视野，叶绿体的运动保留同一身份')}
          >
            <defs>
              <clipPath id={`${id}-field`}>
                <circle cx="180" cy="180" r="160" />
              </clipPath>
              <filter id={`${id}-focus`}>
                <feGaussianBlur stdDeviation={blur * 0.6} />
              </filter>
              <radialGradient id={`${id}-light`}>
                <stop stopColor="#f7f5cf" />
                <stop offset=".82" stopColor="#e1e6b9" />
                <stop offset="1" stopColor="#a6bca1" />
              </radialGradient>
            </defs>
            <circle cx="180" cy="180" r="168" fill="#3c5c50" />
            <circle cx="180" cy="180" r="160" fill={`url(#${id}-light)`} />
            <g clipPath={`url(#${id}-field)`}>
              <g filter={`url(#${id}-focus)`}>
                <g
                  transform={`translate(180 180) scale(${optics.pixelsPerUm}) translate(${-stage} 0)`}
                >
                  {cells.map((c) => (
                    <g key={c.id} transform={`translate(${c.x} ${c.y})`}>
                      {sample === 'cheek' ? (
                        <>
                          <path
                            d={`M${-c.width * 0.48} 0Q${-c.width * 0.4} ${-c.height * 0.6} 7 ${-c.height * 0.4}Q${c.width * 0.6} -20 ${c.width * 0.42} 16Q10 ${c.height * 0.6} ${-c.width * 0.4} 15Z`}
                            fill="#ddd6bd"
                            fillOpacity=".6"
                            stroke="#a59c88"
                            strokeWidth="1"
                          />
                          <ellipse cx="3" cy="2" rx="6" ry="5" fill="#9b8fa0" opacity=".8" />
                        </>
                      ) : (
                        <>
                          <rect
                            x={-c.width / 2}
                            y={-c.height / 2}
                            width={c.width}
                            height={c.height}
                            rx={sample === 'leaf' ? 9 : 4}
                            fill={sample === 'leaf' ? '#dce6a4' : '#c9b788'}
                            fillOpacity=".4"
                            stroke={sample === 'leaf' ? '#7c9764' : '#8f825d'}
                            strokeWidth="2"
                          />
                          {sample === 'leaf' && (
                            <>
                              <rect
                                x={-c.width / 2 + 12}
                                y={-c.height / 2 + 12}
                                width={c.width - 24}
                                height={c.height - 24}
                                rx="16"
                                fill="#eef1c5"
                                stroke="#b4c690"
                                strokeWidth=".8"
                              />
                              {chloroplasts.map((q, i) => {
                                return (
                                  <g
                                    key={i}
                                    transform={`translate(${q.x} ${q.y}) rotate(${q.angle})`}
                                  >
                                    <ellipse
                                      rx="4.6"
                                      ry="2.8"
                                      fill={i === 3 && c.id === 462 ? '#296c43' : '#5f963d'}
                                    />
                                    {i === 3 && c.id === 462 && (
                                      <ellipse
                                        rx="11"
                                        ry="8.5"
                                        stroke="#9b5f16"
                                        fill="none"
                                        strokeWidth="2"
                                        vectorEffect="non-scaling-stroke"
                                      />
                                    )}
                                  </g>
                                );
                              })}
                            </>
                          )}
                        </>
                      )}
                    </g>
                  ))}
                </g>
              </g>
            </g>
            <path d="M180 170V190M170 180H190" stroke="#385f4b" strokeWidth=".7" opacity=".6" />
            <path
              d={`M${330 - 100 * optics.pixelsPerUm} 321H330`}
              stroke="#34543f"
              strokeWidth="3"
            />
          </svg>
          <div className="bio-micro-scale">
            <span>
              {t('视野直径')} {Math.round(optics.fieldUm)} μm
            </span>
            <span>{t('比例尺')} 100 μm</span>
          </div>
        </div>
      </div>
      {!film.watch && (
        <p className="bio-micro-observation">{t('改变倍率不会改变细胞本身的尺寸。')}</p>
      )}
      {!film.watch && (
        <div className="bio-micro-controls">
          <Segments
            value={specimen}
            onChange={setSpecimen}
            label={t('观察材料')}
            options={[
              { value: 'cork', label: t('木栓') },
              { value: 'cheek', label: t('口腔上皮') },
              { value: 'leaf', label: t('黑藻叶') },
            ]}
          />
          <Range
            label={t('物镜倍率')}
            value={power}
            min={10}
            max={40}
            step={30}
            unit="×"
            onChange={setPower}
          />
          <Range
            label={t('细准焦偏移')}
            value={focus}
            min={-4}
            max={4}
            step={0.5}
            onChange={setFocus}
          />
          <Range
            label={t('载物台横移')}
            value={offset}
            min={-300}
            max={300}
            step={10}
            unit="μm"
            onChange={setOffset}
          />
          {sample === 'leaf' && (
            <Range
              label={t('追踪时间')}
              value={time}
              min={0}
              max={60}
              unit="s"
              onChange={setTime}
            />
          )}
        </div>
      )}
      {!film.watch && (
        <p className="bio-micro-note">
          {t('示意重建，非显微照片；尺寸为代表值，流速为教学设定。')}
        </p>
      )}
    </section>
  );
}
