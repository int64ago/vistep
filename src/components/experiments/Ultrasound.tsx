import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  ultrasoundDefaults,
  ultrasoundDepth,
  ultrasoundImage,
  ultrasoundLine,
  ultrasoundColumn,
  ultrasoundPackets,
  ultrasoundPulseDuration,
  ultrasoundShot,
  type UltrasoundFocus,
  type UltrasoundShot,
} from '../../models/ultrasound';
import { useShowcase } from '../lab/Showcase';
import { useCompact } from '../lab/useCompact';
import { Range } from '../lab/Controls';
import {
  UltrasoundBMode,
  UltrasoundPhantom,
  UltrasoundPolarity,
  UltrasoundResolutionScope,
  UltrasoundScope,
} from '../lab/UltrasoundBench';
import '../../styles/ultrasound.css';

const captions: Record<UltrasoundFocus, string> = {
  pulse: '发射的是一小段振动；同一个探头随后接收回波。',
  range: '回波走了一个来回：深度等于声速乘以时间，再除以二。',
  split: '界面只反射一部分能量，其余继续传播，产生更深处的回波。',
  envelope: '反射可以翻转 RF 的符号；显示亮度用的是非负包络。',
  scan: '探头换一个位置，就添一列真实计算的回波亮度。',
  resolution: '两界面相隔 0.64 mm；短脉冲让这组重叠回波分开。',
  shadow: '嵌块前表面的回波不变，后方回波因往返衰减而变暗。',
  speed: '回波时刻没有变；改正假定声速，界面才回到正确深度。',
};
const initial = {
  x: 0,
  cycles: 2,
  attenuation: 2.2,
  assumedSpeed: 1540,
  time: 18,
  view: 'bench' as 'bench' | 'scan' | 'resolution',
};

export default function Ultrasound() {
  const director = useShowcase(),
    compact = useCompact();
  const [manual, setManual] = useState(initial);
  let shot: UltrasoundShot;
  if (director.watch) shot = ultrasoundShot(director.chapter, director.chapterProgress);
  else {
    const config = {
      ...ultrasoundDefaults,
      cycles: manual.cycles,
      insertAttenuation: manual.attenuation,
      assumedSpeed: manual.assumedSpeed,
    };
    const x = manual.view === 'resolution' ? -8 : manual.x;
    const line = ultrasoundLine(ultrasoundColumn(x, config), config);
    shot = {
      config,
      x,
      line,
      time: manual.time,
      scanColumns: 73,
      progress: 1,
      focus:
        manual.view === 'resolution' ? 'resolution' : manual.view === 'scan' ? 'scan' : 'range',
      packets: ultrasoundPackets(line, manual.time),
    };
  }
  const { config, focus } = shot;
  const imaging = ['scan', 'shadow', 'speed'].includes(focus);
  const image = useMemo(
    () => (imaging ? ultrasoundImage(config) : null),
    [
      imaging,
      config.frequency,
      config.cycles,
      config.speed,
      config.assumedSpeed,
      config.attenuation,
      config.insertAttenuation,
      config.gap,
    ],
  );
  const deep = shot.line.echoes.find((echo) => echo.depth === 56)!;
  const chosen =
    [...shot.line.echoes].reverse().find((echo) => echo.time <= shot.time) ?? shot.line.echoes[0];
  return (
    <div className="ultrasound-scene" data-focus={focus} data-watch={director.watch}>
      <div className="ultrasound-strip">
        <span>{t('分层体模 · 脉冲回波')}</span>
        <span>
          {config.frequency.toFixed(1)} MHz · {config.cycles.toFixed(1)} {t('个周期')}
        </span>
      </div>
      <div className={`ultrasound-stage ${focus === 'resolution' ? 'ultrasound-wide' : ''}`}>
        {focus === 'resolution' ? (
          <UltrasoundResolutionScope shot={shot} compact={compact} />
        ) : (
          <>
            {(!compact || !['scan', 'shadow', 'speed', 'envelope'].includes(focus)) && (
              <div className="ultrasound-known">
                <UltrasoundPhantom shot={shot} compact={compact} />
              </div>
            )}
            <div className="ultrasound-display">
              {image ? (
                <UltrasoundBMode image={image} shot={shot} compact={compact} />
              ) : focus === 'envelope' ? (
                <UltrasoundPolarity shot={shot} compact={compact} />
              ) : (
                <UltrasoundScope shot={shot} compact={compact} />
              )}
            </div>
          </>
        )}
      </div>
      <div className="ultrasound-measure">
        {focus === 'pulse' ? (
          <>
            <span>{t('发射脉冲时长')}</span>
            <strong>τ = {ultrasoundPulseDuration(config).toFixed(2)} µs</strong>
          </>
        ) : focus === 'resolution' ? (
          <>
            <span>{t('已知界面间距')}</span>
            <strong>0.64 mm</strong>
          </>
        ) : focus === 'shadow' ? (
          <>
            <span>{t('嵌块额外衰减')}</span>
            <strong>{config.insertAttenuation.toFixed(1)} dB/(cm·MHz)</strong>
          </>
        ) : focus === 'speed' ? (
          <>
            <span>{t('56 mm 界面的显示深度')}</span>
            <strong>{ultrasoundDepth(deep.time, config.assumedSpeed).toFixed(1)} mm</strong>
          </>
        ) : focus === 'scan' ? (
          <>
            <span>{t('固定增益 · 对数亮度')}</span>
            <strong>B mode</strong>
          </>
        ) : focus === 'split' ? (
          <>
            <span>{t('无损界面能量守恒')}</span>
            <strong>R + T = 1</strong>
          </>
        ) : focus === 'envelope' ? (
          <>
            <span>{t('回波中心对齐')}</span>
            <strong>RF → |IQ|</strong>
          </>
        ) : (
          <>
            <span>
              {t('回波时刻')} {chosen.time.toFixed(2)} µs
            </span>
            <strong>d = {ultrasoundDepth(chosen.time, config.assumedSpeed).toFixed(1)} mm</strong>
          </>
        )}
      </div>
      <p className="ultrasound-explanation">{t(captions[focus])}</p>
      {focus === 'speed' && (
        <p className="ultrasound-calibration">
          {t('实际 {0} · 假定 {1} m/s', config.speed.toFixed(0), config.assumedSpeed.toFixed(0))}
        </p>
      )}
      {!director.watch && (
        <div className="ultrasound-explore">
          <div className="ultrasound-presets" role="group" aria-label={t('超声体模实验预设')}>
            <button type="button" onClick={() => setManual(initial)}>
              {t('重置实验')}
            </button>
            <button
              type="button"
              onClick={() =>
                setManual({ ...initial, x: -8, view: 'resolution', cycles: 8, time: 80 })
              }
            >
              {t('分开薄片两面')}
            </button>
            <button
              type="button"
              onClick={() => setManual({ ...initial, x: 10, view: 'scan', time: 80 })}
            >
              {t('检查嵌块阴影')}
            </button>
          </div>
          <div className="ultrasound-tabs" role="group" aria-label={t('超声显示方式')}>
            {(['bench', 'scan', 'resolution'] as const).map((view) => (
              <button
                type="button"
                key={view}
                aria-pressed={manual.view === view}
                onClick={() =>
                  setManual((m) => ({ ...m, view, x: view === 'resolution' ? -8 : m.x }))
                }
              >
                {t(
                  view === 'bench' ? '体模与 A 线' : view === 'scan' ? 'B 模式扫描' : '轴向分辨率',
                )}
              </button>
            ))}
          </div>
          {manual.view !== 'resolution' && (
            <Range
              label={t('探头横向位置')}
              min={-18}
              max={18}
              step={0.5}
              unit="mm"
              value={manual.x}
              onChange={(x) =>
                setManual((m) => ({ ...m, x, view: m.view === 'resolution' ? 'bench' : m.view }))
              }
            />
          )}
          <Range
            label={t('脉冲包含的周期数')}
            min={2}
            max={8}
            step={1}
            value={manual.cycles}
            onChange={(cycles) => setManual((m) => ({ ...m, cycles }))}
          />
          {(manual.view === 'scan' ||
            (manual.view === 'bench' && manual.x >= 6 && manual.x < 15)) && (
            <Range
              label={t('嵌块额外衰减')}
              min={0}
              max={3}
              step={0.1}
              unit="dB/(cm·MHz)"
              value={manual.attenuation}
              onChange={(attenuation) => setManual((m) => ({ ...m, attenuation }))}
            />
          )}
          {manual.view !== 'resolution' && (
            <Range
              label={t('重建假定声速')}
              min={1400}
              max={1700}
              step={10}
              unit="m/s"
              value={manual.assumedSpeed}
              onChange={(assumedSpeed) => setManual((m) => ({ ...m, assumedSpeed }))}
            />
          )}
          {manual.view === 'bench' && (
            <Range
              label={t('一次发射后的观察时间')}
              min={-1.5}
              max={86}
              step={0.1}
              unit="µs"
              value={manual.time}
              onChange={(time) => setManual((m) => ({ ...m, time }))}
              help={t('以发射包络中心为零时刻；方向键、Home 和 End 可调节。')}
            />
          )}
          <details>
            <summary>{t('模型、增益与适用范围')}</summary>
            <p>
              {t(
                '每个位置只计算一条垂直声线，探头停驻后发射和接收。界面均按法向入射处理，忽略列间传播、垂直侧壁、衍射、折射、波束形成、散斑和多次反射。',
              )}
            </p>
            <p>
              {t(
                '体模的压强反射系数为 r=(Z₂−Z₁)/(Z₂+Z₁)。回波包含去程与回程的透射，衰减按中心频率计算，并在整个脉冲带宽内视为常数。',
              )}
            </p>
            <p>
              {t(
                '背景衰减为 0.35 dB/(cm·MHz)，嵌块再加上滑块设定值。包络用理想相干正交分量求模；亮度使用固定 0.25 压强参考和 45 dB 范围，不逐列自动增益。',
              )}
            </p>
            <p>
              {t(
                'cτ/2 表示有限脉冲支撑长度的一半，是本实验的分离尺度；实际可辨程度还取决于包络、相位、带宽和噪声。体模不是人体解剖图，探头匹配层和耦合层只示意理想接触。',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
