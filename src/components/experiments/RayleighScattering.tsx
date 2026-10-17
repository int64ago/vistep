import { useState } from 'react';
import { t } from '../../i18n';
import {
  rayleighSpectrum,
  rayleighCross,
  rayleighPhase,
  rayleighCie,
  rayleighColor,
  rayleighShot,
} from '../../models/rayleigh-scattering';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/rayleigh-scattering.css';
type View = 'spectrum' | 'ratio' | 'phase' | 'vision';
export default function RayleighScattering() {
  const film = useShowcase(),
    phone = useCompact();
  const [column, setColumn] = useState(1),
    [angle, setAngle] = useState(90),
    [mono, setMono] = useState(false),
    [view, setView] = useState<View>('spectrum');
  const shot = film.watch
      ? rayleighShot(film.chapter, film.chapterProgress)
      : { column, angle, mono, wavelength: 650, view },
    spectrum = rayleighSpectrum(shot),
    W = phone ? 340 : 760,
    H = phone ? 220 : 290,
    x = (w: number) => 24 + ((w - 380) / 400) * (W - 48),
    max = Math.max(...spectrum.map((s) => s.source)),
    y = (v: number) => H - 35 - (v / max) * (H - 65),
    trace = (key: 'source' | 'direct') =>
      spectrum.map((s) => `${x(s.wavelength)},${y(s[key])}`).join(' '),
    ratio = rayleighCross(450) / rayleighCross(650),
    labelSize = phone ? 26 : 18,
    phasePath = Array.from({ length: 241 }, (_, i) => {
      const a = (2 * Math.PI * i) / 240,
        r = (rayleighPhase((a * 180) / Math.PI) / rayleighPhase(0)) * (phone ? 80 : 105);
      return `${W / 2 + Math.cos(a) * r},${H / 2 - Math.sin(a) * r}`;
    }).join(' '),
    theta = (shot.angle * Math.PI) / 180,
    pr = (rayleighPhase(shot.angle) / rayleighPhase(0)) * (phone ? 80 : 105),
    selected = [W / 2 + Math.cos(theta) * pr, H / 2 - Math.sin(theta) * pr];
  return (
    <section className="rayleigh-study">
      <header>
        <span>
          {t(
            shot.mono
              ? '只给红光，仍然散射红光'
              : shot.view === 'phase'
                ? '散射到各个方向，并不平均'
                : shot.view === 'vision'
                  ? '眼睛把整段光谱合成颜色'
                  : shot.view === 'ratio'
                    ? '相同照明，短波长更容易散射'
                    : '同一束光，分成直达与偏离',
          )}
        </span>
        <b>{t('瑞利极限')}</b>
      </header>
      {shot.view === 'ratio' ? (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={t('相同输入能量下450与650纳米的相对散射截面对比')}
        >
          {[450, 650].map((w, i) => {
            const h = (rayleighCross(w) / rayleighCross(450)) * (H - 80),
              cx = W * (i === 0 ? 0.3 : 0.7);
            return (
              <g key={w}>
                <rect
                  x={cx - (phone ? 28 : 50)}
                  y={H - 42 - h}
                  width={phone ? 56 : 100}
                  height={h}
                  rx="10"
                  fill={i === 0 ? '#7cafd2' : '#d69978'}
                />
                <text x={cx} y={H - 8} textAnchor="middle" fontSize={labelSize} fill="#d6e0dc">
                  {w} nm
                </text>
              </g>
            );
          })}
        </svg>
      ) : shot.view === 'phase' ? (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={t('非偏振瑞利散射的角分布及当前观察方向')}
        >
          <polyline points={phasePath} fill="#83a6bf22" stroke="#96bfd2" strokeWidth="2" />
          <path
            d={`M15 ${H / 2}H${W / 2 - 80}m-7 -4l7 4 -7 4`}
            fill="none"
            stroke="#e2c89c"
            strokeWidth="2"
          />
          <path d={`M${W / 2} ${H / 2}L${selected}`} stroke="#e2c89c" strokeWidth="2" />
          <circle cx={selected[0]} cy={selected[1]} r="5" fill="#e2c89c" />
          <text x={W / 2 + (phone ? 100 : 130)} y={H / 2 + 8} fontSize={labelSize} fill="#d6e0dc">
            0°
          </text>
          <text x={W / 2} y="28" textAnchor="middle" fontSize={labelSize} fill="#d6e0dc">
            90°
          </text>
          <circle cx={W / 2} cy={H / 2} r="3" fill="#e2c89c" />
        </svg>
      ) : shot.view === 'vision' ? (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={t('CIE三条颜色匹配函数，紫端的响应不能由散射截面代替')}
        >
          <path d={`M24 ${H - 35}H${W - 24}`} stroke="#73808e" />
          {[0, 1, 2].map((k) => (
            <polyline
              key={k}
              points={spectrum
                .map(
                  (s) =>
                    `${x(s.wavelength)},${H - 35 - (rayleighCie(s.wavelength)[k] / 1.85) * (H - 65)}`,
                )
                .join(' ')}
              fill="none"
              stroke={['#d3a17c', '#afbf8d', '#93afd6'][k]}
              strokeWidth="2"
            />
          ))}
          <text x="24" y={H - 4} fontSize={labelSize} fill="#d6e0dc">
            380
          </text>
          <text x={W - 24} y={H - 4} textAnchor="end" fontSize={labelSize} fill="#d6e0dc">
            780 nm
          </text>
        </svg>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={t('每个波长的直达能量与离开直达光束的能量，相加保持入射光谱')}
        >
          <polygon
            points={`${x(380)},${y(0)} ${trace('direct')} ${x(780)},${y(0)}`}
            fill="#cda17c99"
          />
          <polygon
            points={`${trace('source')} ${spectrum
              .slice()
              .reverse()
              .map((s) => `${x(s.wavelength)},${y(s.direct)}`)
              .join(' ')}`}
            fill="#82acd199"
          />
          <polyline points={trace('source')} fill="none" stroke="#ecdfc4" strokeWidth="2" />
          {shot.mono && <path d={`M${x(650)} ${y(0)}V${y(1)}`} stroke="#e4b29d" strokeWidth="4" />}
          <text x="24" y={H - 4} fontSize={labelSize} fill="#d6e0dc">
            380
          </text>
          <text x={W - 24} y={H - 4} textAnchor="end" fontSize={labelSize} fill="#d6e0dc">
            780 nm
          </text>
        </svg>
      )}
      <div className="rayleigh-legend">
        {shot.view === 'vision' ? (
          <>
            <span style={{ color: '#d3a17c' }}>x̄</span>
            <span style={{ color: '#afbf8d' }}>ȳ</span>
            <span style={{ color: '#93afd6' }}>z̄</span>
          </>
        ) : shot.view === 'phase' ? (
          <>
            <span>θ {shot.angle.toFixed(0)}°</span>
            <span>
              {t('相对各向同性')} {(rayleighPhase(shot.angle) * 4 * Math.PI).toFixed(2)}×
            </span>
          </>
        ) : shot.view === 'ratio' ? (
          <>
            <span>σ450 / σ650</span>
            <b>{ratio.toFixed(2)}×</b>
          </>
        ) : (
          <>
            <span>
              <i style={{ background: '#cda17c' }} />
              {t('直达')}
            </span>
            <span>
              <i style={{ background: '#82acd1' }} />
              {t('离开直达光束')}
            </span>
            <span>
              <i style={{ background: '#ecdfc4' }} />
              {t('入射轮廓')}
            </span>
          </>
        )}
      </div>
      <div className="rayleigh-swatches">
        <span>
          <i style={{ background: rayleighColor(spectrum, 'direct') }} />
          {t('直达色调')}
        </span>
        <span>
          <i style={{ background: rayleighColor(spectrum, 'toward') }} />
          {t('首散射色调')}
        </span>
      </div>
      <p className="rayleigh-note">
        {t('色块独立归一化，只比较色调')} · m {shot.column.toFixed(1)}
      </p>
      <details>
        <summary>{t('光谱收支与大气边界')}</summary>
        <p>
          {t(
            '入射谱用5778K黑体近似，550nm单位路径光学厚度0.12；小粒子、无吸收、非偏振瑞利散射。离开直达束的能量分布到整个立体角，当前方向只占相函数给出的份额；未计散射后的遮挡与多次散射。CIE1931解析近似用于色调示意，色块分别归一化，不比较亮度，不预测完整天空颜色。',
          )}
        </p>
      </details>
      {!film.watch && (
        <div className="rayleigh-controls">
          <Range
            label={t('相对路径长度')}
            value={column}
            min={0}
            max={8}
            step={0.1}
            onChange={setColumn}
          />
          <Range
            label={t('散射观察角')}
            value={angle}
            min={0}
            max={180}
            unit="°"
            onChange={setAngle}
          />
          <div className="rayleigh-views">
            {(['spectrum', 'ratio', 'phase', 'vision'] as const).map((v, i) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
                {t(['光谱收支', '截面对比', '角分布', '视觉响应'][i])}
              </button>
            ))}
          </div>
          <button type="button" aria-pressed={mono} onClick={() => setMono(!mono)}>
            {t(mono ? '恢复宽谱照明' : '只输入650nm红光')}
          </button>
        </div>
      )}
    </section>
  );
}
