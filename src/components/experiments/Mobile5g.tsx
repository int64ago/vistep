import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { Range, Segments } from '../lab/Controls';
import {
  Band,
  BeamField,
  Constellation,
  Layers,
  Ofdm,
  PathLoss,
  RateBox,
  ShareGrid,
  Slots,
  rateText,
  STAGE_HEIGHT,
  shareModel,
} from '../lab/Mobile5gInstruments';
import {
  MODULATION_NAME,
  arrayGainDb,
  halfPowerBeamwidth,
  lteEquivalentRate,
  nrBandwidths,
  nrPeakRate,
  nrResourceBlocks,
  occupiedMHz,
  shannonBits,
  type Material,
  type Modulation,
} from '../../models/mobile-5g';
import { boxStages, m5gShot, type M5gView } from '../../models/mobile-5g-film';
import '../../styles/mobile-5g.css';

type Explore = {
  view: M5gView;
  bandwidth: number;
  scs: number;
  modulation: Modulation;
  layers: number;
  cursor: number;
  snr: number;
  material: Material | 'none';
  panel: boolean;
  elements: number;
  steer: number;
  arrival: number;
  slotScs: number;
  users: number;
  backhaul: number;
};
const INITIAL: Explore = {
  view: 'box',
  bandwidth: 100,
  scs: 30,
  modulation: 8,
  layers: 4,
  cursor: 0,
  snr: 22,
  material: 'none',
  panel: false,
  elements: 8,
  steer: 20,
  arrival: 0.3,
  slotScs: 30,
  users: 5,
  backhaul: 1,
};

const CONTEXT: Record<M5gView, string> = {
  box: '峰值按 TS 38.306 近似公式；4G 用同一形式估算。',
  ofdm: '真实符号前还有循环前缀；频谱按理想矩形符号计算。',
  qam: '未编码的判决；真实系统靠纠错码在更低信噪比工作。',
  band: '网格线每 10 个资源块一条；护带不计入占用宽度。',
  path: '自由空间加一堵墙；手机端按单天线计算。',
  beam: '二维示意；等总功率，亮度补偿了距离衰减。',
  layers: '层数受收发天线数和信道中独立路径的限制。',
  share: '平均分配、固定回传；真实调度会随信道变化。',
};

export default function Mobile5g() {
  const film = useShowcase(),
    host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(880);
  const [ex, setEx] = useState<Explore>(INITIAL);
  const set = <K extends keyof Explore>(key: K, value: Explore[K]) =>
    setEx((s) => ({ ...s, [key]: value }));
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([e]) =>
      setWidth(Math.max(200, Math.floor(e.contentRect.width))),
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const shot = m5gShot(film.chapter, film.chapterProgress);
  const watch = film.watch;
  const view: M5gView = watch ? shot.view : ex.view;
  const w = Math.min(width, 980);
  const stages = boxStages();

  let tag = '',
    readout = '',
    stage: ReactElement | null = null,
    context = CONTEXT[view];

  if (view === 'box') {
    if (watch) {
      const b = shot.box;
      // One state for header, labels and number: the rate is the product of the three factors,
      // each advanced by the same eased progress that draws its dimension (exact at every step).
      const rate =
        stages[0].rate *
        stages[1].factor ** b.width *
        stages[2].factor ** b.depth *
        stages[3].factor ** b.height;
      const done = (k: number) => k >= 0.999;
      tag =
        b.width <= 0.001
          ? t('4G LTE · 20 MHz · 15 kHz')
          : done(b.width)
            ? t('5G NR · 100 MHz · 30 kHz')
            : t('4G → 5G · 拉宽频带');
      readout = '';
      stage = (
        <RateBox
          w={w}
          s={{
            ...b,
            rate,
            lteRate: stages[0].rate,
            factors: [
              done(b.width)
                ? t(
                    '× {0} 带宽 · × {1} 开销',
                    stages[1].bandwidth!.toFixed(2),
                    stages[1].overhead!.toFixed(2),
                  )
                : null,
              done(b.depth) ? `× ${stages[2].factor.toFixed(2)}` : null,
              done(b.height) ? `× ${stages[3].factor.toFixed(2)}` : null,
            ],
          }}
        />
      );
    } else {
      const nRb = nrResourceBlocks(ex.bandwidth, 30);
      const rate = nrPeakRate({
        bandwidthMHz: ex.bandwidth,
        scsKHz: 30,
        layers: ex.layers,
        modulation: ex.modulation,
      });
      const lte = stages[0].rate;
      tag = t('5G NR · {0} MHz · 30 kHz', ex.bandwidth);
      stage = (
        <RateBox
          w={w}
          s={{
            width: 1,
            depth: 1,
            height: 1,
            fill: 1,
            ghost: 1,
            rate,
            lteRate: lte,
            factors: [null, null, null],
            mhz: occupiedMHz(nRb, 30),
            nRb,
            bits: ex.modulation,
            layers: ex.layers,
          }}
        />
      );
    }
  } else if (view === 'ofdm') {
    const o = shot.ofdm;
    tag = t('4G LTE · Δf 15 kHz');
    readout = watch && o.grid > 0.5 ? t('{0} 个资源单元', 168) : '';
    stage = watch ? (
      <Ofdm w={w} {...o} />
    ) : (
      <Ofdm w={w} carriers={7} cursor={ex.cursor} cursorOn={1} grid={0} filled={0} />
    );
  } else if (view === 'qam') {
    const q = watch ? shot.qam : { modulation: ex.modulation, snrDb: ex.snr, count: 460 };
    tag = t('同一串噪声 · 未编码');
    readout = t('香农上限 {0} bit', shannonBits(q.snrDb).toFixed(1));
    stage = <Constellation w={w} {...q} />;
  } else if (view === 'band') {
    const lte = lteEquivalentRate({ bandwidthMHz: 20, layers: 4, modulation: 8 });
    const nr = watch
      ? nrPeakRate({ bandwidthMHz: 100, scsKHz: 30, layers: 4, modulation: 8 })
      : nrPeakRate({ bandwidthMHz: ex.bandwidth, scsKHz: ex.scs, layers: 4, modulation: 8 });
    tag = t('同样 4 层 · 256QAM');
    // shown only for a settled configuration: the ratio describes the drawn carrier
    const bwRatio = watch
      ? (273 * 12 * 30) / (100 * 12 * 15)
      : (nrResourceBlocks(ex.bandwidth, ex.scs) * 12 * ex.scs) / (100 * 12 * 15);
    const settled = !(watch && shot.band.widen < 0.999);
    if (settled && w < 640) {
      tag = t('5G ÷ 4G = {0}', (nr / lte).toFixed(2));
      readout = t('带宽 ×{0} · 开销 ×{1}', bwRatio.toFixed(2), (nr / lte / bwRatio).toFixed(2));
    } else
      readout = settled
        ? t(
            '5G ÷ 4G = {0}（带宽 × {1} · 开销 × {2}）',
            (nr / lte).toFixed(2),
            bwRatio.toFixed(2),
            (nr / lte / bwRatio).toFixed(2),
          )
        : '';
    stage = watch ? (
      <Band w={w} {...shot.band} />
    ) : (
      <Band w={w} widen={1} aggregate={0} bandwidthMHz={ex.bandwidth} scsKHz={ex.scs} />
    );
  } else if (view === 'path') {
    const pth = watch
      ? shot.path
      : {
          panel: ex.panel ? 1 : 0,
          material: ex.material === 'none' ? null : ex.material,
          wall: 1,
        };
    tag = t('基站 → 280 m 外的手机');
    readout = pth.panel > 0.5 ? t('两个频段的基站面板一样大') : t('基站用单天线');
    stage = <PathLoss w={w} {...pth} />;
  } else if (view === 'beam') {
    const b = watch
      ? shot.beam
      : { elements: ex.elements, steerDeg: ex.steer, target: ex.steer, planar: 0 };
    const planarNow = b.planar >= 0.5;
    tag = planarNow ? t('8 × 8 平面阵 · 64 个单元') : t('{0} 个单元 · 半波长间距', b.elements);
    readout = planarNow
      ? t(
          w < 640 ? '增益 {0} dB · 波束宽 {1}°' : '增益 {0} dB · 这一行的波束宽 {1}°',
          arrayGainDb(64).toFixed(1),
          halfPowerBeamwidth(8, b.steerDeg).toFixed(0),
        )
      : b.elements > 1
        ? t(
            '增益 {0} dB · 波束宽 {1}°',
            arrayGainDb(b.elements).toFixed(1),
            halfPowerBeamwidth(b.elements, b.steerDeg).toFixed(0),
          )
        : t('单个天线：各方向一样');
    stage = (
      <BeamField
        w={w}
        elements={b.elements}
        steerDeg={b.steerDeg}
        targetDeg={b.target}
        planar={b.planar}
        wavePhase={watch ? film.time * Math.PI * 1.2 : 0}
      />
    );
  } else if (view === 'layers') {
    const l = shot.layers;
    const slotsView = watch ? l.slots > 0.5 : false;
    const count = watch ? l.count : ex.layers;
    if (watch && slotsView) {
      tag = t('子载波越宽，时隙越短');
      readout = '';
      stage = <Slots w={w} rows={l.rows} arrivalMs={0.3} arrival={l.arrival} />;
    } else if (watch) {
      tag = t('{0} 层 · 100 MHz · 256QAM', count);
      readout = rateText(
        nrPeakRate({ bandwidthMHz: 100, scsKHz: 30, layers: count, modulation: 8 }),
      );
      stage = <Layers w={w} count={count} stack={l.stack} />;
    } else {
      tag = t('{0} 层 · 100 MHz · 256QAM', count);
      readout = rateText(
        nrPeakRate({ bandwidthMHz: 100, scsKHz: 30, layers: count, modulation: 8 }),
      );
      stage = (
        <div className="m5g-pair">
          <Layers w={w} count={count} stack={1} />
          <Slots w={w} rows={[1]} arrivalMs={ex.arrival} scsList={[ex.slotScs]} />
        </div>
      );
      context = CONTEXT.layers;
    }
    if (watch && slotsView) context = '只算等下一个时隙边界；处理时间与重传未计入。';
  } else {
    const s = watch
      ? { ...shot.share, backhaulBps: 1e9 }
      : { users: ex.users, snrDb: ex.snr, backhaulBps: ex.backhaul * 1e9, backhaul: 1, lte: 1 };
    const m = shareModel({ ...s, system: 'NR' });
    tag =
      s.backhaul >= 0.5
        ? t('回传 {0} Gbit/s', (s.backhaulBps / 1e9).toFixed(1))
        : t('{0} 人分享', s.users);
    // before the backhaul is introduced the headline is the radio share alone
    readout = t('你拿到 {0}', rateText(s.backhaul >= 0.5 ? m.rate : m.radio));
    stage = <ShareGrid w={w} {...s} />;
  }

  return (
    <section className="m5g-study" data-view={view} data-watch={watch}>
      <header className="m5g-heading">
        <span>{tag}</span>
        {readout && <b>{readout}</b>}
      </header>
      <div ref={host} className="m5g-main">
        <div className="m5g-stage" key={view} style={watch ? { height: STAGE_HEIGHT } : undefined}>
          {stage}
        </div>
      </div>
      <p className="m5g-context">{t(context)}</p>
      {!watch && (
        <div className="m5g-controls">
          <Segments
            label={t('观察的仪器')}
            className="m5g-views"
            value={ex.view}
            onChange={(v) => set('view', v)}
            options={[
              { value: 'box', label: t('速率盒') },
              { value: 'ofdm', label: t('子载波') },
              { value: 'qam', label: t('星座图') },
              { value: 'band', label: t('频带') },
              { value: 'path', label: t('传播') },
              { value: 'beam', label: t('波束') },
              { value: 'layers', label: t('层与时隙') },
              { value: 'share', label: t('分享') },
            ]}
          />
          <div className="m5g-control-grid">
            {view === 'box' && (
              <>
                <Range
                  label={t('信道带宽')}
                  value={ex.bandwidth}
                  min={10}
                  max={100}
                  step={10}
                  unit="MHz"
                  onChange={(v) => set('bandwidth', v)}
                />
                <ModulationPicker value={ex.modulation} onChange={(v) => set('modulation', v)} />
                <LayerPicker value={ex.layers} onChange={(v) => set('layers', v)} />
              </>
            )}
            {view === 'ofdm' && (
              <Range
                label={t('取样频率（以 Δf 为单位）')}
                value={ex.cursor}
                min={-3}
                max={3}
                step={0.05}
                onChange={(v) => set('cursor', v)}
              />
            )}
            {view === 'qam' && (
              <>
                <ModulationPicker value={ex.modulation} onChange={(v) => set('modulation', v)} />
                <Range
                  label={t('信噪比')}
                  value={ex.snr}
                  min={0}
                  max={40}
                  step={1}
                  unit="dB"
                  onChange={(v) => set('snr', v)}
                />
              </>
            )}
            {view === 'band' && (
              <>
                <Segments
                  label={t('子载波间隔')}
                  value={String(ex.scs)}
                  onChange={(v) => {
                    const scs = Number(v);
                    const list = nrBandwidths(scs);
                    setEx((s) => ({
                      ...s,
                      scs,
                      bandwidth: list.includes(s.bandwidth) ? s.bandwidth : list[list.length - 1],
                    }));
                  }}
                  options={[15, 30, 60].map((v) => ({ value: String(v), label: `${v} kHz` }))}
                />
                <BandwidthPicker
                  scs={ex.scs}
                  value={ex.bandwidth}
                  onChange={(v) => set('bandwidth', v)}
                />
              </>
            )}
            {view === 'path' && (
              <>
                <Segments
                  label={t('路径上的墙')}
                  value={ex.material}
                  onChange={(v) => set('material', v)}
                  options={[
                    { value: 'none', label: t('无') },
                    { value: 'glass', label: t('玻璃') },
                    { value: 'irrGlass', label: t('节能玻璃') },
                    { value: 'wood', label: t('木板') },
                    { value: 'concrete', label: t('混凝土') },
                  ]}
                />
                <Segments
                  label={t('基站天线')}
                  value={ex.panel ? 'panel' : 'single'}
                  onChange={(v) => set('panel', v === 'panel')}
                  options={[
                    { value: 'single', label: t('单天线') },
                    { value: 'panel', label: t('同尺寸面板') },
                  ]}
                />
              </>
            )}
            {view === 'beam' && (
              <>
                <Segments
                  label={t('天线单元数')}
                  value={String(ex.elements)}
                  onChange={(v) => set('elements', Number(v))}
                  options={[1, 2, 4, 8, 16].map((v) => ({ value: String(v), label: String(v) }))}
                />
                <Range
                  label={t('波束方向')}
                  value={ex.steer}
                  min={-60}
                  max={60}
                  step={1}
                  unit="°"
                  onChange={(v) => set('steer', v)}
                />
              </>
            )}
            {view === 'layers' && (
              <>
                <LayerPicker value={ex.layers} onChange={(v) => set('layers', v)} />
                <Segments
                  label={t('时隙的子载波间隔')}
                  value={String(ex.slotScs)}
                  onChange={(v) => set('slotScs', Number(v))}
                  options={[15, 30, 60, 120].map((v) => ({ value: String(v), label: `${v} kHz` }))}
                />
                <Range
                  label={t('数据到达时刻')}
                  value={ex.arrival}
                  min={0}
                  max={0.95}
                  step={0.01}
                  unit="ms"
                  onChange={(v) => set('arrival', v)}
                />
              </>
            )}
            {view === 'share' && (
              <>
                <Range
                  label={t('同时使用的人数')}
                  value={ex.users}
                  min={1}
                  max={20}
                  step={1}
                  onChange={(v) => set('users', v)}
                />
                <Range
                  label={t('你所在位置的信噪比')}
                  value={ex.snr}
                  min={0}
                  max={35}
                  step={1}
                  unit="dB"
                  onChange={(v) => set('snr', v)}
                />
                <Range
                  label={t('基站回传容量')}
                  value={ex.backhaul}
                  min={0.5}
                  max={10}
                  step={0.5}
                  unit="Gbit/s"
                  onChange={(v) => set('backhaul', v)}
                />
              </>
            )}
          </div>
          <button className="m5g-reset" onClick={() => setEx({ ...INITIAL, view: ex.view })}>
            {t('恢复初始设置')}
          </button>
          <details className="m5g-notes">
            <summary>{t('模型边界')}</summary>
            <p>
              {t(
                '5G 峰值使用 3GPP TS 38.306 的近似公式：层数 × 调制比特 × 948/1024 × 每秒资源单元 × (1 − 开销)，FR1 下行开销 0.14。资源块数取自 TS 38.101-1。4G 没有同样的公式；这里用同一形式、15 kHz 与 100 个资源块，并把开销校准到 20 MHz、2 层、64QAM 的 150.752 Mbit/s 传输块峰值。',
              )}
            </p>
            <p>
              {t(
                '星座图是未编码的正方形 QAM 加高斯噪声，噪声序列固定。调制门槛取“符号误判不超过 1%”，只是教学规则；真实系统用信道编码和 CQI 表，会在更低信噪比使用同样的调制。',
              )}
            </p>
            <p>
              {t(
                '传播只含自由空间损耗和 TR 38.901 的单层材料穿透损耗，不含地面反射、衍射、雨衰与人体遮挡。波束图是二维线阵，按等总功率画出，亮度补偿了距离衰减。',
              )}
            </p>
            <p>
              {t(
                '分享按轮流平均分配资源格；位置只改变调制，不改变层数；回传被同样的人数平均分享。这些都是可比较的简化，不预测某张 SIM 卡在某个地点的实测速度。',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}

function ModulationPicker({
  value,
  onChange,
}: {
  value: Modulation;
  onChange: (v: Modulation) => void;
}) {
  return (
    <Segments
      label={t('调制方式')}
      value={String(value)}
      onChange={(v) => onChange(Number(v) as Modulation)}
      options={([2, 4, 6, 8] as Modulation[]).map((m) => ({
        value: String(m),
        label: MODULATION_NAME[m],
      }))}
    />
  );
}
function LayerPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Segments
      label={t('空间层数')}
      value={String(value)}
      onChange={(v) => onChange(Number(v))}
      options={[1, 2, 4].map((v) => ({ value: String(v), label: t('{0} 层', v) }))}
    />
  );
}
function BandwidthPicker({
  scs,
  value,
  onChange,
}: {
  scs: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const list = nrBandwidths(scs);
  const index = Math.max(0, list.indexOf(value));
  return (
    <label className="control">
      <span className="control-top">
        <span>{t('信道带宽')}</span>
        <output>
          {list[index]} MHz · {nrResourceBlocks(list[index], scs)} RB
        </output>
      </span>
      <input
        aria-label={t('信道带宽')}
        type="range"
        min={0}
        max={list.length - 1}
        step={1}
        value={index}
        style={{ '--range-fill': `${(index / (list.length - 1)) * 100}%` } as CSSProperties}
        onChange={(e) => onChange(list[Number(e.target.value)])}
      />
    </label>
  );
}
