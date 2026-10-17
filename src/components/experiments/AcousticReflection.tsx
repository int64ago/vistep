import { useState } from 'react';
import { t } from '../../i18n';
import { acousticField, acousticInterface, acousticShot } from '../../models/acoustic-reflection';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/acoustic-reflection.css';
export default function AcousticReflection() {
  const film = useShowcase(),
    phone = useCompact();
  const [ratio, setRatio] = useState(4),
    [speed, setSpeed] = useState(1),
    [time, setTime] = useState(0.0028),
    [velocity, setVelocity] = useState(false);
  const shot = film.watch
      ? acousticShot(film.chapter, film.chapterProgress)
      : { ratio, speedRatio: speed, time, velocity },
    s = acousticInterface(shot),
    W = phone ? 340 : 760,
    H = phone ? 210 : 300,
    x = (q: number) => 20 + ((q + 1) / 2) * (W - 40),
    y = (v: number) => H / 2 - v * (phone ? 50 : 72),
    samples = Array.from({ length: 401 }, (_, i) => ({
      x: -1 + i / 200,
      ...acousticField(-1 + i / 200, shot.time, shot),
    })),
    trace = (key: 'pressure' | 'incident' | 'reflected' | 'transmitted' | 'velocity') =>
      samples
        .filter((p) =>
          key === 'incident' || key === 'reflected'
            ? p.x <= 0
            : key === 'transmitted'
              ? p.x >= 0
              : true,
        )
        .map((p) => `${x(p.x)},${y(key === 'velocity' ? p.velocity * s.Z1 : p[key])}`)
        .join(' ');
  return (
    <section className="acoustic-study" data-watch={film.watch}>
      <header>
        <span>{t(shot.velocity ? '反向传播时，压力与速度反相' : '压力波在阻抗边界分成两路')}</span>
        <b>{t('正入射平面波')}</b>
      </header>
      <div className="acoustic-media">
        <span>Z₁ · 1</span>
        <span>
          Z₂ · {s.Z2 / s.Z1 === 1 ? '1' : (s.Z2 / s.Z1).toFixed(2)} · c₂/c₁{' '}
          {shot.speedRatio.toFixed(2)}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t(
          shot.velocity
            ? '同一入射反射透射场的粒子速度剖面'
            : '相同物理坐标内的入射反射透射压力与合成压力',
        )}
      >
        <rect x="20" y="12" width={(W - 40) / 2} height={H - 24} fill="#91b1be19" rx="16" />
        <rect x={W / 2} y="12" width={(W - 40) / 2} height={H - 24} fill="#c1c9a31c" rx="16" />
        <path d={`M20 12H${W - 20}M20 ${H - 12}H${W - 20}`} stroke="#81978e" strokeWidth="2" />
        <path
          d={`M20 ${H / 2}H${W - 20}M${W / 2} 12V${H - 12}`}
          stroke="#b7c8b16b"
          strokeDasharray="3 5"
        />
        {shot.velocity ? (
          <>
            <polyline
              points={trace('pressure')}
              fill="none"
              stroke="#91b9ce"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <polyline points={trace('velocity')} fill="none" stroke="#eadcaf" strokeWidth="2.5" />
          </>
        ) : (
          <>
            <polyline points={trace('incident')} fill="none" stroke="#87b7d3" strokeWidth="1.5" />
            <polyline points={trace('reflected')} fill="none" stroke="#e3a477" strokeWidth="1.8" />
            <polyline
              points={trace('transmitted')}
              fill="none"
              stroke="#d0d5a6"
              strokeWidth="2.5"
            />
            <polyline
              points={samples
                .filter((p) => p.x <= 0)
                .map((p) => `${x(p.x)},${y(p.pressure)}`)
                .join(' ')}
              fill="none"
              stroke="#e9e4c8"
              strokeWidth="1.2"
            />
          </>
        )}
      </svg>
      <div className="acoustic-legend">
        {shot.velocity ? (
          <>
            <span>{t('实线：归一化粒子速度')}</span>
            <span>{t('虚线：压力参考')}</span>
          </>
        ) : (
          <>
            <span>
              <i style={{ background: '#87b7d3' }} />
              {t('入射')}
            </span>
            <span>
              <i style={{ background: '#e3a477' }} />
              {t('反射')}
            </span>
            <span>
              <i style={{ background: '#d0d5a6' }} />
              {t('透射')}
            </span>
            <span>
              <i style={{ background: '#e9e4c8' }} />
              {t('左侧合成')}
            </span>
          </>
        )}
      </div>
      <div className="acoustic-energy">
        <div>
          <i style={{ width: `${s.R * 100}%`, background: '#c99770' }} />
          <i style={{ width: `${s.T * 100}%`, background: '#a7b98d' }} />
        </div>
        <p>
          <span>
            {t('反射能量')} {(100 * s.R).toFixed(0)}%
          </span>
          <span>
            {t('透射能量')} {(100 * s.T).toFixed(0)}%
          </span>
        </p>
      </div>
      <p className="acoustic-parameters">
        rP {s.r.toFixed(2)} · tP {s.tp.toFixed(2)} · t {(shot.time * 1000).toFixed(2)} ms
      </p>
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('压力、速度与能流条件')}</summary>
          <p>
            {t(
              '正入射、等截面、两侧无损流体，特性比声阻抗Z=ρc；不是管口的复输入阻抗。压力单位入射峰值1Pa，速度按同一入射速度归一化。压缩与稀疏在纵轴表示，不是横向弯曲或整体气流。时间放慢，忽略吸收、斜入射、有限墙体和多次反射；不播放测试音。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="acoustic-controls">
          <Range
            label={t('特性阻抗比Z₂/Z₁')}
            value={ratio}
            min={0.1}
            max={10}
            step={0.1}
            onChange={setRatio}
          />
          <Range
            label={t('声速比c₂/c₁')}
            value={speed}
            min={0.5}
            max={2}
            step={0.05}
            onChange={setSpeed}
          />
          <Range
            label={t('脉冲时刻')}
            value={time * 1000}
            min={0}
            max={4}
            step={0.01}
            unit="ms"
            onChange={(v) => setTime(v / 1000)}
          />
          <button type="button" aria-pressed={velocity} onClick={() => setVelocity(!velocity)}>
            {t(velocity ? '看压力剖面' : '看粒子速度剖面')}
          </button>
        </div>
      )}
    </section>
  );
}
