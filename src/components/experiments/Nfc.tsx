import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { Range, Segments } from '../lab/Controls';
import NfcStudio from '../three/NfcStudio';
import {
  NFC,
  NFC_EXAMPLE_BITS,
  nfcLink,
  nfcInstant,
  nfcMagnitude,
  nfcMillerQuarters,
  nfcReplyState,
  nfcReplyTrace,
  nfcDecodeReply,
  type NfcLink,
  type NfcSolution,
  type NfcComplex,
} from '../../models/nfc';
import { nfcShot, nfcRectifierTrace, type NfcView } from '../../models/nfc-film';
import '../../styles/nfc.css';

const copper = '#a85e33',
  teal = '#236f72',
  ink = '#344944',
  muted = '#73827b';
const fmt = (n: number, places = 2) => (Math.abs(n) < 0.5 * 10 ** -places ? 0 : n).toFixed(places);
const samplesPerBit = 64;
function pathOf(values: readonly number[], width: number, base: number, scale: number, pad = 12) {
  return values
    .map(
      (v, i) =>
        `${i ? 'L' : 'M'}${pad + (i / (values.length - 1)) * (width - 2 * pad)},${base - v * scale}`,
    )
    .join(' ');
}
function stepped(values: readonly number[], width: number, base: number, scale: number, pad = 12) {
  const dx = (width - pad * 2) / values.length;
  return values
    .map((v, i) => `${i ? 'L' : 'M'}${pad + i * dx},${base - v * scale}H${pad + (i + 1) * dx}`)
    .join(' ');
}

export function NfcInduction({
  state,
  phase,
  width,
}: {
  state: NfcSolution;
  phase: number;
  width: number;
}) {
  const flux: NfcComplex = {
    re: state.mutualH * state.readerCurrent.re,
    im: state.mutualH * state.readerCurrent.im,
  };
  const w = Math.PI * 2 * NFC.carrierHz;
  const induced = { re: w * flux.im, im: -w * flux.re };
  const rows = [
    { name: 'Φ₂₁', value: flux, color: teal },
    { name: 'e₂', value: induced, color: copper },
  ];
  const plotWidth = width < 600 ? width : (width - 24) / 2;
  const x = 12 + ((phase / (Math.PI * 2)) % 1) * (plotWidth - 24);
  return (
    <div className="nfc-induction">
      {rows.map((row, j) => {
        const max = Math.SQRT2 * nfcMagnitude(row.value) || 1;
        const data = Array.from(
          { length: 129 },
          (_, i) => nfcInstant(row.value, (i / 128) * Math.PI * 2) / max,
        );
        return (
          <div key={row.name}>
            <span style={{ color: row.color }}>
              {row.name} <small>{t(j ? '感应电压' : '来自读卡器的磁链')}</small>
            </span>
            <svg
              viewBox={`0 0 ${plotWidth} 50`}
              role="img"
              aria-label={t(
                j ? '感应电压与磁链相差四分之一周期' : '标签线圈中由读卡电流产生的磁链',
              )}
            >
              <path d={`M12 25H${plotWidth - 12}`} stroke="#c9d1c7" />
              <path
                d={pathOf(data, plotWidth, 25, 19)}
                fill="none"
                stroke={row.color}
                strokeWidth="2"
              />
              <path d={`M${x} 3V47`} stroke={ink} strokeDasharray="3 4" opacity=".5" />
              <circle
                cx={x}
                cy={25 - (nfcInstant(row.value, phase) / max) * 19}
                r="3"
                fill={row.color}
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}

function Diode({ a, b, on }: { a: [number, number]; b: [number, number]; on: boolean }) {
  const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  return (
    <g>
      <path d={`M${a}L${b}`} stroke={on ? copper : '#aeb9ad'} strokeWidth="2" />
      <g transform={`translate(${(a[0] + b[0]) / 2},${(a[1] + b[1]) / 2}) rotate(${angle})`}>
        <path
          d="M-7 -6L5 0L-7 6Z M6 -7V7"
          stroke={on ? copper : muted}
          fill={on ? '#edc39b' : '#f6f5ed'}
          strokeWidth="1.5"
        />
      </g>
    </g>
  );
}

export function NfcPower({ width, progress }: { width: number; progress: number }) {
  const data = useMemo(() => nfcRectifierTrace(), []);
  const i = Math.min(data.length - 1, Math.floor(progress * (data.length - 1))),
    sample = data[i];
  const cx = Math.max(98, width * 0.32),
    top: [number, number] = [cx, 51],
    bottom: [number, number] = [cx, 121];
  const left: [number, number] = [cx - 32, 86],
    right: [number, number] = [cx + 32, 86];
  const cap = width - 80,
    chip = width - 25,
    positive = sample.ac >= 0;
  return (
    <div className="nfc-power">
      <svg
        className="nfc-circuit"
        viewBox={`0 0 ${width} 204`}
        role="img"
        aria-label={t('理想全波整流桥、储能电容与芯片供电支路')}
      >
        <path
          d={`M22 72H${cx - 50}V86H${cx - 32} M22 112V155H${cx + 51}V86H${cx + 32}`}
          stroke={teal}
          strokeWidth="2"
          fill="none"
        />
        <circle cx="22" cy="92" r="20" fill="#f5f5ec" stroke={teal} strokeWidth="2" />
        <path d="M9 92Q15 76 22 92T35 92" fill="none" stroke={teal} strokeWidth="2" />
        <Diode a={left} b={top} on={positive && sample.conducting} />
        <Diode a={right} b={top} on={!positive && sample.conducting} />
        <Diode a={bottom} b={left} on={!positive && sample.conducting} />
        <Diode a={bottom} b={right} on={positive && sample.conducting} />
        <path
          d={`M${cx} 51V22H${chip}V65 M${cx} 121V178H${chip}V115 M${cap} 22V78 M${cap} 94V178`}
          stroke={copper}
          strokeWidth="2"
          fill="none"
        />
        <path
          d={`M${cap - 13} 78H${cap + 13}M${cap - 13} 94H${cap + 13}`}
          stroke={copper}
          strokeWidth="3"
        />
        <rect x={chip - 13} y="65" width="26" height="50" rx="6" fill="#385d56" />
        <rect
          x={chip - 8}
          y={110 - sample.stored * 39}
          width="16"
          height={sample.stored * 39}
          rx="3"
          fill="#a8d2b2"
        />
        <text x={chip - 18} y="139" textAnchor="end">
          {t('芯片')}
        </text>
        <text x={cap + 20} y="92">
          C
        </text>
        <text x="5" y="193">
          AC
        </text>
        <text x={cx} y="202" textAnchor="middle">
          {t('整流')}
        </text>
        <text x={width - 10} y="202" textAnchor="end">
          DC
        </text>
        <text x={cx + 10} y="43" fill={copper}>
          +
        </text>
      </svg>
      <div className="nfc-trace-key">
        <span style={{ color: teal }}>{t('输入交流')}</span>
        <span style={{ color: copper }}>{t('电容电压')}</span>
      </div>
      <svg
        className="nfc-power-trace"
        viewBox={`0 0 ${width} 100`}
        role="img"
        aria-label={t('归一化交流输入与理想储能电容电压')}
      >
        <path d={`M12 55H${width - 12}`} stroke="#c7cfc3" />
        <path
          d={pathOf(
            data.map((d) => d.ac),
            width,
            55,
            36,
          )}
          stroke={teal}
          strokeWidth="1.4"
          opacity=".55"
          fill="none"
        />
        <path
          d={pathOf(
            data.map((d) => d.stored),
            width,
            55,
            36,
          )}
          stroke={copper}
          strokeWidth="2.5"
          fill="none"
        />
        <path d={`M${12 + progress * (width - 24)} 8V94`} stroke={ink} strokeDasharray="3 4" />
        <circle
          cx={12 + progress * (width - 24)}
          cy={55 - sample.stored * 36}
          r="3.5"
          fill={copper}
        />
      </svg>
    </div>
  );
}

export function NfcLoad({ width, on, state }: { width: number; on: boolean; state: NfcSolution }) {
  const tag = width - 93,
    branch = width - 17,
    chip = width - 49;
  const coil = (x: number, sign: number) =>
    `M${x} 55${Array.from({ length: 4 }, () => `q${sign * 14} 9 0 18`).join(' ')}`;
  return (
    <div className="nfc-load-detail">
      <div className="nfc-endpoints">
        <span>{t('读卡线圈')}</span>
        <span>{t('标签线圈')}</span>
      </div>
      <svg
        className="nfc-load-circuit"
        viewBox={`0 0 ${width} 206`}
        role="img"
        aria-label={t('标签并联负载开关通过互感改变读卡线圈电流')}
      >
        <path d="M18 76V39H77V55M18 114V147H77V127" fill="none" stroke={teal} strokeWidth="2" />
        <circle cx="18" cy="95" r="18" fill="#edf2e9" stroke={teal} strokeWidth="2" />
        <path d="M6 95Q12 81 18 95T30 95" stroke={teal} strokeWidth="2" fill="none" />
        <path d={coil(77, 1)} stroke={teal} strokeWidth="3" fill="none" />
        <path d={coil(tag, -1)} stroke={copper} strokeWidth="3" fill="none" />
        <path
          d={`M${tag} 55V39H${branch}V70 M${tag} 127V147H${branch}V119 M${chip} 39V72M${chip} 117V147`}
          stroke={copper}
          strokeWidth="2"
          fill="none"
        />
        <rect x={chip - 9} y="72" width="18" height="45" rx="4" fill="#3f6257" />
        <path
          data-nfc-switch={on ? 'closed' : 'open'}
          d={`M${branch} 70L${branch - (on ? 0 : 19)} 91`}
          stroke={on ? copper : muted}
          strokeWidth="3"
        />
        <circle cx={branch} cy="70" r="3" fill={copper} />
        <circle cx={branch} cy="94" r="3" fill={copper} />
        <path d={`M${branch} 94V99`} stroke={copper} strokeWidth="2" />
        <rect
          x={branch - 6}
          y="99"
          width="12"
          height="20"
          rx="2"
          stroke={copper}
          fill={on ? '#e0b487' : '#f4f3e8'}
          strokeWidth="2"
        />
        <path
          d={`M99 77Q${(99 + tag - 20) / 2} 55 ${tag - 20} 77 M99 113Q${(99 + tag - 20) / 2} 136 ${tag - 20} 113`}
          stroke="#7b9e91"
          fill="none"
          strokeDasharray="3 5"
        />
        <text x={(99 + tag - 20) / 2} y="101" textAnchor="middle">
          M
        </text>
        <text x="43" y="174" textAnchor="middle">
          {t('读卡器')}
        </text>
        <text x={(tag + branch) / 2} y="174" textAnchor="middle">
          {t('芯片与负载')}
        </text>
        <text x={width / 2} y="204" textAnchor="middle" fill={on ? copper : muted}>
          {t(on ? '附加负载接入' : '附加负载断开')}
        </text>
      </svg>
      <div className="nfc-ammeter">
        <span>{t('读卡器电流')}</span>
        <strong>
          {fmt(state.readerCurrentRmsA * 1000)} <small>mA</small>
        </strong>
        <span>RMS</span>
      </div>
      <div className="nfc-current-track">
        <i style={{ width: `${Math.min(100, (state.readerCurrentRmsA / 0.08) * 100)}%` }} />
      </div>
      <div className="nfc-tag-current">
        {t('标签线圈电流')} {fmt(state.tagCurrentRmsA * 1000)} mA · RMS
      </div>
    </div>
  );
}

export function NfcPacket({
  width,
  progress,
  bits,
  link,
  request = false,
}: {
  width: number;
  progress: number;
  bits: string;
  link: NfcLink;
  request?: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    pad = 12,
    usable = width - 24,
    count = bits.length;
  const trace = useMemo(() => nfcReplyTrace(link, samplesPerBit, bits), [link, bits]);
  const decoded = useMemo(
    () =>
      nfcDecodeReply(
        trace.map((s) => s.readerCurrentRmsA),
        samplesPerBit,
      ),
    [trace],
  );
  const x = pad + progress * usable,
    completed = Math.floor(progress * count + 1e-9);
  const values = request
    ? nfcMillerQuarters(bits)
        .flat()
        .map((v) => v * link.unloaded.carrierEnvelope)
    : trace.map((s) => (s.loadOn ? 1 : 0));
  const baseline = link.unloaded.readerCurrentRmsA;
  // Fixed 10 mA full-scale across poses: weak coupling must not look equally strong.
  const delta = link.currentDifferenceA;
  const currentValues = trace.map((s) => s.readerCurrentRmsA - baseline);
  const rowY = [49, 158, 265];
  return (
    <div className="nfc-packet">
      <div className="nfc-endpoints">
        <span>{t(request ? '读卡器 → 标签' : '标签 → 读卡器')}</span>
        <b>106 kbit/s</b>
      </div>
      <svg
        viewBox={`0 0 ${width} 314`}
        role="img"
        aria-label={t(
          request ? '短暂停顿编码的读卡器载波包络' : '同一比特序列、负载切换与读卡器电流包络',
        )}
      >
        <defs>
          <clipPath id={id}>
            <rect x={pad} y="0" width={Math.max(0, x - pad)} height="314" />
          </clipPath>
        </defs>
        <text x={pad} y="19">
          {t(request ? '发送的比特' : '标签中的比特')}
        </text>
        {[...bits].map((bit, i) => (
          <g key={i}>
            <rect
              x={pad + (i * usable) / count + 1}
              y="29"
              width={usable / count - 2}
              height="35"
              rx="7"
              fill={i < completed ? '#d5e4d7' : '#e8ece1'}
            />
            <text
              x={pad + ((i + 0.5) * usable) / count}
              y={rowY[0] + 5}
              textAnchor="middle"
              fill={ink}
            >
              {bit}
            </text>
          </g>
        ))}
        <text x={pad} y="106">
          {t(request ? '读卡场包络' : '标签负载开关')}
        </text>
        <path d={`M${pad} ${rowY[1]}H${width - pad}`} stroke="#cbd3c6" />
        <path
          d={stepped(values, width, rowY[1], 32)}
          stroke={copper}
          strokeWidth="1.5"
          opacity=".18"
          fill="none"
        />
        <path
          d={stepped(values, width, rowY[1], 32)}
          stroke={copper}
          strokeWidth="1.8"
          fill="none"
          clipPath={`url(#${id})`}
        />
        <text x={pad} y="184" className="nfc-svg-muted">
          {request ? '100% ASK · Modified Miller' : '847.5 kHz · Manchester'}
        </text>
        <text x={pad} y="221">
          {t(
            request
              ? link.unloaded.carrierEnvelope
                ? '暂停位置携带信息'
                : '读卡场已关闭'
              : '读卡器电流的变化',
          )}
        </text>
        {!request && (
          <>
            <path d={`M${pad} ${rowY[2]}H${width - pad}`} stroke="#cbd3c6" />
            <path
              d={stepped(currentValues, width, rowY[2], 28 / 0.01)}
              fill="none"
              stroke={teal}
              strokeWidth="1.5"
              opacity=".16"
            />
            <path
              d={stepped(currentValues, width, rowY[2], 28 / 0.01)}
              fill="none"
              stroke={teal}
              strokeWidth="1.8"
              clipPath={`url(#${id})`}
            />
            <text x={pad} y="301" fill={teal}>
              ΔI = {fmt((link.powered ? delta : 0) * 1000)} mA
            </text>
            <text x={width - pad} y="301" textAnchor="end" className="nfc-svg-muted">
              ↕ 10 mA
            </text>
          </>
        )}
        {request && (
          <g>
            <text x={pad} y="260" fill={teal}>
              {t('信息与能量共用通道')}
            </text>
            <text x={pad} y="301" className="nfc-svg-muted">
              0 → {fmt((count / NFC.bitRate) * 1e6, 1)} μs
            </text>
          </g>
        )}
        <path
          d={`M${x} 25V${request ? 167 : 272}`}
          stroke={ink}
          strokeWidth="1"
          strokeDasharray="3 5"
        />
      </svg>
      {!request && (
        <div className="nfc-decoded" aria-label={t('从电流包络恢复的比特')}>
          <span>{t('读回')}</span>
          <div>
            {decoded.map((bit, i) => (
              <b key={i} data-complete={i < completed}>
                {i < completed ? (bit ?? '—') : '·'}
              </b>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Nfc() {
  const film = useShowcase(),
    host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800),
    [gapMm, setGap] = useState(8),
    [tiltDeg, setTilt] = useState(0),
    [fieldOn, setField] = useState(true);
  const [mode, setMode] = useState<NfcView>('coupling'),
    [loadOn, setLoad] = useState(false),
    [bits, setBits] = useState(NFC_EXAMPLE_BITS);
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([e]) => setWidth(Math.max(200, e.contentRect.width)));
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const shot = nfcShot(film.chapter, film.chapterProgress, film.time);
  const gap = film.watch ? shot.gapMm : gapMm,
    tilt = film.watch ? shot.tiltDeg : tiltDeg,
    field = film.watch ? shot.fieldOn : fieldOn;
  const view = film.watch ? shot.view : mode,
    phase = film.watch ? shot.phase : Math.PI * 0.3;
  const link = useMemo(
    () => nfcLink({ gapM: gap / 1000, tiltDeg: tilt }, field ? 1 : 0),
    [gap, tilt, field],
  );
  const packet = film.watch ? shot.packetProgress : 1;
  const effectiveBits = film.watch ? NFC_EXAMPLE_BITS : bits;
  const activeLoad =
    link.powered &&
    (film.watch
      ? view === 'reply'
        ? nfcReplyState((packet * effectiveBits.length) / NFC.bitRate, effectiveBits).loadOn
        : shot.loadOn
      : loadOn);
  const state = activeLoad ? link.loaded : link.unloaded;
  const physical = ['tap', 'coupling', 'induction'].includes(view);
  const narrow = width < 600;
  return (
    <section className="nfc-study" data-view={view} data-watch={film.watch}>
      <header className="nfc-heading">
        <span>NFC · 13.56 MHz</span>
        <b>
          <i data-powered={state.powered} />
          {t(state.powered ? '标签已供电' : '标签等待供电')}
        </b>
      </header>
      <div ref={host} className="nfc-main">
        {physical && (
          <>
            <div className={`nfc-apparatus ${view === 'induction' ? 'nfc-apparatus-short' : ''}`}>
              <NfcStudio
                narrow={narrow}
                visual={{
                  gapMm: gap,
                  tiltDeg: tilt,
                  phase,
                  powered: state.powered,
                  fieldOn: field,
                  loadOn: activeLoad,
                  showInternals: film.watch ? shot.reveal : 1,
                  readerCurrentA: nfcInstant(state.readerCurrent, phase),
                  tagCurrentA: nfcInstant(state.tagCurrent, phase),
                  fluxNormalized:
                    view === 'induction'
                      ? (state.mutualH * nfcInstant(state.readerCurrent, phase)) /
                        (Math.abs(state.mutualH) * Math.SQRT2 * nfcMagnitude(state.readerCurrent) ||
                          1)
                      : undefined,
                  closeup:
                    view === 'induction'
                      ? (() => {
                          const p = Math.min(1, film.chapterProgress / 0.12);
                          return p * p * (3 - 2 * p);
                        })()
                      : 0,
                }}
              />
            </div>
            {view === 'induction' && <NfcInduction state={state} phase={phase} width={width} />}
          </>
        )}
        {view === 'power' && <NfcPower width={Math.min(width, 540)} progress={packet} />}
        {view === 'load' && <NfcLoad width={Math.min(width, 440)} on={activeLoad} state={state} />}
        {(view === 'request' || view === 'reply') && (
          <NfcPacket
            width={Math.min(width, 850)}
            progress={packet}
            bits={effectiveBits}
            link={link}
            request={view === 'request'}
          />
        )}
      </div>
      {physical && view !== 'induction' && (
        <div className="nfc-readings">
          <span>
            {t('标签可用功率')}
            <b>
              {fmt(state.dcPowerW * 1000)} <small>mW</small>
            </b>
          </span>
          <span>
            {t('回传电流变化')}
            <b>
              {fmt((link.powered ? link.signalAmplitudeA : 0) * 1000)} <small>mA</small>
            </b>
          </span>
        </div>
      )}
      {film.watch && view === 'coupling' && (
        <div className="nfc-link-status" data-readable={link.readable}>
          {t(link.readable ? '可读' : !link.powered ? '供电不足' : '信号过弱')}
        </div>
      )}
      <p className="nfc-context">
        {t(
          view === 'induction'
            ? '慢相位；两条曲线分别归一化。'
            : view === 'power'
              ? '理想整流与储能示意，幅值归一化。'
              : view === 'request'
                ? '放慢包络；不含完整通信帧。'
                : view === 'reply'
                  ? '电流包络放大；省略谐振瞬态。'
                  : view === 'load'
                    ? '电路功能示意；调谐元件省略。'
                    : '模型门槛，仅用于比较。',
        )}
      </p>
      {!film.watch && (
        <div className="nfc-controls">
          <Segments
            label={t('NFC 观察方式')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'coupling', label: t('线圈') },
              { value: 'load', label: t('负载') },
              { value: 'reply', label: t('回传') },
              { value: 'request', label: t('发问') },
            ]}
          />
          <Range
            label={t('标签最近间隙')}
            value={gapMm}
            min={4}
            max={60}
            step={1}
            unit="mm"
            onChange={setGap}
          />
          <Range
            label={t('标签倾角')}
            value={tiltDeg}
            min={0}
            max={80}
            step={1}
            unit="°"
            onChange={setTilt}
          />
          <button className="nfc-toggle" aria-pressed={fieldOn} onClick={() => setField((v) => !v)}>
            {t(fieldOn ? '关闭读卡场' : '开启读卡场')}
          </button>
          {mode === 'load' && (
            <button className="nfc-toggle" aria-pressed={loadOn} onClick={() => setLoad((v) => !v)}>
              {t(loadOn ? '断开附加负载' : '接入附加负载')}
            </button>
          )}
          {(mode === 'reply' || mode === 'request') && (
            <div className="nfc-bit-controls">
              <span>{t('点按改变发送内容')}</span>
              <div>
                {[...bits].map((bit, i) => (
                  <button
                    key={i}
                    aria-label={t('第 {0} 位：{1}', i + 1, bit)}
                    onClick={() =>
                      setBits((s) => s.slice(0, i) + (bit === '1' ? '0' : '1') + s.slice(i + 1))
                    }
                  >
                    {bit}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="nfc-link-status" data-readable={link.readable}>
            {t(
              link.readable
                ? '供电与检测均达到教学门槛'
                : !link.powered
                  ? '供电不足，标签不能回答'
                  : '回传低于教学检测门槛',
            )}
          </div>
          <button
            className="nfc-reset"
            onClick={() => {
              setGap(8);
              setTilt(0);
              setField(true);
              setLoad(false);
              setBits(NFC_EXAMPLE_BITS);
              setMode('coupling');
            }}
          >
            {t('恢复 NFC 初始状态')}
          </button>
          <details className="nfc-notes">
            <summary>{t('NFC 模型边界')}</summary>
            <p>
              {t(
                '本文选用无电池标签的 NFC-A 106 kbit/s 信号子集。固定的比特从左向右发送，不是完整指令、身份凭据或支付交易。',
              )}
            </p>
            <p>
              {t(
                '互感按等效圆环计算，电路采用稳态阻抗与固定整流效率；忽略金属、铁氧体、匝距、芯片限幅和供电瞬态。倾斜时抬高标签中心以保持最近间隙。',
              )}
            </p>
            <p>
              {t(
                '供电门槛为 0.6 mW，接收包络变化门槛为 0.15 mA，仅用于本模型；真实读取距离取决于天线、匹配、接收器与环境。',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
