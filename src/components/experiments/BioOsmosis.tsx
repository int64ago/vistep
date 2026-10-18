import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ramp, ease } from '../lab/FilmContext';
import {
  diffuseInk,
  cellOsmosis,
  funnelOsmosis,
  transportState,
  transportParticle,
  redCellOutline,
} from '../../models/bio-osmosis';
import '../../styles/bio-osmosis.css';
type Mode =
  'diffusion' | 'funnel' | 'red-cell' | 'plant' | 'recovery' | 'aquaporin' | 'passive' | 'active';
const keys: Mode[] = [
  'diffusion',
  'funnel',
  'red-cell',
  'plant',
  'recovery',
  'aquaporin',
  'passive',
  'active',
];
const names = [
  '墨水扩散',
  '半透膜漏斗',
  '红细胞',
  '质壁分离',
  '质壁分离复原',
  '水通道证据',
  '被动运输',
  '主动运输',
];
function Plant({ volume }: { volume: number }) {
  const scale = Math.min(1, Math.pow(volume, 1 / 3)),
    w = 250 * scale,
    h = 135 * scale;
  return (
    <svg
      viewBox="0 0 320 210"
      role="img"
      aria-label={t('固定细胞壁内，原生质层和中央液泡随失水收缩')}
    >
      <rect
        x="23"
        y="28"
        width="274"
        height="157"
        rx="20"
        fill="#dbe2bf"
        stroke="#7c9770"
        strokeWidth="6"
      />
      <rect
        x={160 - w / 2}
        y={106 - h / 2}
        width={w}
        height={h}
        rx="26"
        fill="#c8bdcf"
        stroke="#877892"
        strokeWidth="2"
      />
      <rect
        x={160 - w * 0.43}
        y={106 - h * 0.38}
        width={w * 0.86}
        height={h * 0.76}
        rx="24"
        fill="#b78bb0"
        fillOpacity={Math.min(0.9, 0.45 / volume)}
        stroke="#9a7ba0"
      />
      <ellipse cx={160 - w * 0.4} cy="107" rx="10" ry="14" fill="#8f7f9b" />
    </svg>
  );
}
function RedCell({ volume, lysed, id }: { volume: number; lysed: boolean; id: string }) {
  return (
    <svg viewBox="0 0 160 160" role="img" aria-label={t('红细胞体积与膜破裂状态')}>
      <defs>
        <radialGradient id={id}>
          <stop stopColor="#dba297" />
          <stop offset={Math.max(0.05, 0.45 - (volume - 1) * 0.6)} stopColor="#d99b8c" />
          <stop offset=".75" stopColor="#bc776a" />
          <stop offset="1" stopColor="#a96d63" />
        </radialGradient>
      </defs>
      <path
        d={redCellOutline(volume)}
        fill={`url(#${id})`}
        fillOpacity={lysed ? 0.25 : 1}
        stroke="#b36f65"
        strokeWidth="2"
        strokeDasharray={lysed ? '5 9' : undefined}
      />
      {lysed &&
        [0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M${25 + i * 30} 65q8 10 0 30`}
            stroke="#cb8a7b"
            opacity=".4"
            fill="none"
          />
        ))}
    </svg>
  );
}
export default function BioOsmosis() {
  const f = useShowcase(),
    id = useId().replace(/:/g, ''),
    [mode, setMode] = useState<Mode>(
      keys.includes(f.variant as Mode) ? (f.variant as Mode) : 'plant',
    ),
    [progress, setProgress] = useState(0.7),
    [outside, setOutside] = useState(f.variant === 'funnel' ? 0 : 1.8),
    [selective, setSelective] = useState(true),
    [atp, setAtp] = useState(true);
  const m = f.watch ? keys[Math.min(7, f.chapter)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.05, 0.85)) : progress,
    time = p * 12;
  const c = f.watch ? 1.8 : outside,
    plantBefore = cellOsmosis(c, 12, true),
    plant = cellOsmosis(
      m === 'recovery' ? 0.3 : c,
      time,
      true,
      0.35,
      m === 'recovery' ? plantBefore.volume : 1,
    ),
    funnel = funnelOsmosis(time * 2, f.watch ? true : selective, f.watch ? 0 : outside),
    height = funnel.height * 55;
  return (
    <section className="bio-osmosis">
      <p className="bio-osmosis-mode">{t(names[keys.indexOf(m)])}</p>
      {m === 'diffusion' ? (
        <svg
          className="bio-osmosis-main"
          viewBox="0 0 350 240"
          role="img"
          aria-label={t('封闭容器中墨水浓度的扩散，溶质总量守恒')}
        >
          <path
            d="M40 24V218Q40 228 50 228H300Q310 228 310 218V24"
            fill="#e5ece3"
            stroke="#8caaa4"
            strokeWidth="3"
          />
          {diffuseInk(p).map((v, i) => (
            <rect
              key={i}
              x={43 + (i * 264) / 51}
              y="65"
              width={264 / 51 + 0.3}
              height="160"
              fill="#bf746b"
              opacity={Math.min(0.95, v * 20)}
            />
          ))}
          <path d="M44 64H306" stroke="#bacdc5" />
          <path
            d={diffuseInk(p)
              .map(
                (v, i) => `${i ? 'L' : 'M'}${44 + (i * 264) / 50} ${205 - Math.min(130, v * 4000)}`,
              )
              .join(' ')}
            fill="none"
            stroke="#a96761"
            strokeWidth="2"
          />
        </svg>
      ) : m === 'funnel' ? (
        <>
          <svg
            className="bio-osmosis-main"
            viewBox="0 0 350 270"
            role="img"
            aria-label={t('漏斗水柱升高，静水压抵消渗透压差')}
          >
            <defs>
              <clipPath id={`${id}-funnel`}>
                <path d="M170 20H180V161L231 216H119L170 161Z" />
              </clipPath>
            </defs>
            <path
              d="M60 80V241Q60 249 70 249H280Q290 249 290 241V80"
              fill="#dfe9dc"
              stroke="#91aaa0"
              strokeWidth="2"
            />
            <path d={`M62 ${140 + height / 22}H288V246H62Z`} fill="#bad8d4" opacity=".7" />
            <g clipPath={`url(#${id}-funnel)`}>
              <rect x="117" y={140 - height} width="116" height="220" fill="#b9bf8d" />
              {Array.from({ length: 16 }, (_, i) => (
                <rect
                  key={i}
                  x={133 + ((i * 37) % 79)}
                  y={193 + ((i * 13) % 19)}
                  width="4"
                  height="4"
                  rx="1"
                  fill="#8e9668"
                />
              ))}
            </g>
            <path
              d="M170 20V161L119 216H231L180 161V20"
              stroke="#829f96"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M119 216H231"
              stroke="#a58b67"
              strokeWidth="4"
              strokeDasharray={selective || f.watch ? undefined : '2 6'}
            />
            <path
              d={`M247 ${140 - height}V${140 + height / 22}`}
              stroke="#917e50"
              strokeWidth="2"
            />
            <path d={`M242 ${140 - height}H252M242 ${140 + height / 22}H252`} stroke="#917e50" />
          </svg>
          <div className="bio-osmosis-readings">
            <span>
              {t('渗透驱动力')} {funnel.osmotic.toFixed(2)}
            </span>
            <span>
              {t('静水压阻力')} {funnel.hydrostatic.toFixed(2)}
            </span>
          </div>
        </>
      ) : m === 'red-cell' ? (
        <div className="bio-red-comparison">
          {[0.45, 1, 1.8].map((ext, i) => {
            const cell = cellOsmosis(ext, time);
            return (
              <div key={ext}>
                <RedCell volume={cell.volume} lysed={cell.lysed} id={`${id}-r-${i}`} />
                <p>{t(i === 0 ? '低渗' : i === 1 ? '等渗' : '高渗')}</p>
                <p>{cell.lysed ? t('膜破裂') : t('体积比') + ' ' + cell.volume.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      ) : m === 'plant' || m === 'recovery' ? (
        <>
          <Plant volume={plant.volume} />
          <div className="bio-osmosis-readings">
            <span>{t('细胞壁外形固定')}</span>
            <span>
              {t('原生质体积比')} {plant.volume.toFixed(2)}
            </span>
          </div>
        </>
      ) : m === 'aquaporin' ? (
        <div className="bio-aqp-comparison">
          {[0.025, 0.5].map((perm, i) => {
            const cell = cellOsmosis(0.45, time, false, perm);
            return (
              <div key={perm}>
                <svg
                  viewBox="0 0 160 180"
                  role="img"
                  aria-label={t('相同低渗环境中，有无水通道的体积变化')}
                >
                  <circle
                    cx="80"
                    cy="85"
                    r={40 * Math.cbrt(cell.volume)}
                    fill="#d7c8a1"
                    fillOpacity={cell.lysed ? 0.3 : 1}
                    stroke="#a4966e"
                    strokeWidth="3"
                    strokeDasharray={cell.lysed ? '5 8' : undefined}
                  />
                  {i === 1 &&
                    Array.from({ length: 8 }, (_, j) => {
                      const a = (j * Math.PI) / 4,
                        r = 40 * Math.cbrt(cell.volume);
                      return (
                        <rect
                          key={j}
                          x={77 + r * Math.cos(a)}
                          y={81 + r * Math.sin(a)}
                          width="6"
                          height="8"
                          rx="2"
                          fill="#7b9b9a"
                        />
                      );
                    })}
                  <path
                    d="M12 85H31m-5-5 5 5-5 5M148 85H129m5-5-5 5 5 5"
                    stroke="#80a7aa"
                    strokeWidth={i === 1 ? 4 : 1}
                  />
                </svg>
                <p>{t(i === 0 ? '对照：低水通透性' : '表达水通道蛋白')}</p>
                <p>
                  {cell.lysed ? t('达到膜破裂边界') : t('体积比') + ' ' + cell.volume.toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bio-transport-grid">
          {(m === 'active' ? (['active'] as const) : (['simple', 'carrier'] as const)).map(
            (kind, i) => {
              const state = transportState(time, kind, f.watch ? true : atp);
              return (
                <div key={kind}>
                  <svg
                    viewBox="0 0 250 250"
                    role="img"
                    aria-label={t('膜两侧物质守恒，载体或泵改变转运方式')}
                  >
                    <rect x="18" y="109" width="214" height="32" fill="#c2ce9f" />
                    {kind !== 'simple' && (
                      <path
                        d={`M110 96Q94 110 ${102 + Math.sin(time) * 5} 126Q94 151 113 155H138Q153 143 143 126Q156 108 137 96Z`}
                        fill="#8e8ba5"
                      />
                    )}
                    {Array.from({ length: 24 }, (_, j) => {
                      const q = transportParticle(j, state.inside, kind);
                      return (
                        <circle
                          key={j}
                          cx={q.x}
                          cy={q.y}
                          r="5"
                          fill={j === 0 ? '#b58148' : '#719b94'}
                        />
                      );
                    })}
                    <path d="M207 90V160m-5-5 5 5 5-5" stroke="#8a9272" strokeWidth="2" />
                    {kind === 'active' && (
                      <path
                        d="M75 174L92 149L83 150L98 129"
                        fill="none"
                        stroke={atp || f.watch ? '#c49e50' : '#bac3ad'}
                        strokeWidth="4"
                      />
                    )}
                  </svg>
                  <p>
                    {t(
                      kind === 'simple'
                        ? '自由扩散'
                        : kind === 'carrier'
                          ? '载体协助扩散'
                          : 'ATP驱动的泵',
                    )}
                  </p>
                  <p>
                    {t('胞内 / 胞外')} {state.inside.toFixed(2)} / {state.outside.toFixed(2)}
                  </p>
                  {kind === 'active' && (
                    <p>
                      {t('能量消耗指标')} {state.energy.toFixed(2)}
                    </p>
                  )}
                </div>
              );
            },
          )}
        </div>
      )}
      {!f.watch && (
        <div className="bio-osmosis-controls">
          <Segments
            value={mode}
            onChange={(v) => {
              setMode(v);
              setOutside(v === 'funnel' ? 0 : 1.8);
            }}
            label={t('选择观察')}
            options={keys.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          <Range
            label={t('过程进度')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {(m === 'plant' || m === 'recovery' || m === 'funnel') && (
            <Range
              label={t('外液相对浓度')}
              value={outside}
              min={m === 'funnel' ? 0 : 0.3}
              max={m === 'funnel' ? 1 : 2.5}
              step={0.1}
              onChange={setOutside}
            />
          )}{' '}
          {m === 'funnel' && (
            <button type="button" aria-pressed={selective} onClick={() => setSelective(!selective)}>
              {t(selective ? '半透膜：保留蔗糖' : '纱布：蔗糖可通过')}
            </button>
          )}
          {m === 'active' && (
            <button type="button" aria-pressed={atp} onClick={() => setAtp(!atp)}>
              {t(atp ? 'ATP供应：有' : 'ATP供应：无')}
            </button>
          )}
          <p>{t('相对单位原理模型；细胞图为示意，不能据此测量真实样本。')}</p>
        </div>
      )}
    </section>
  );
}
