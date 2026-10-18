import { useId, useState } from 'react';
import { browserLocale, t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  accumulatedWire,
  lengthFilmState,
  micrometerContact,
  micrometerReading,
  vernierReading,
  type VernierDivisions,
} from '../../models/length-instruments';
import '../../styles/length-instruments.css';
function Metal({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-steel`}>
        <stop stopColor="#adb9b1" />
        <stop offset=".4" stopColor="#eff0de" />
        <stop offset="1" stopColor="#9aaa9f" />
      </linearGradient>
      <linearGradient id={`${id}-copper`}>
        <stop stopColor="#ae875f" />
        <stop offset=".4" stopColor="#e4c493" />
        <stop offset="1" stopColor="#b18e63" />
      </linearGradient>
    </defs>
  );
}
function Vernier({ length, divisions }: { length: number; divisions: VernierDivisions }) {
  const s = vernierReading(length, divisions),
    unit = 350 / (divisions + 2),
    zero = 44 + (s.indicated - s.main) * unit,
    aligned = zero + s.aligned * s.vernierPitch * unit;
  return (
    <div className="length-scale">
      <p>{t('同一刻度的放大图')}</p>
      <svg
        viewBox="0 0 440 166"
        role="img"
        aria-label={t('主尺与游标刻度，第几条对齐决定小数读数')}
      >
        <rect x="26" y="18" width="388" height="55" rx="9" fill="#edf0df" />
        <rect
          x={zero - 9}
          y="75"
          width={divisions * s.vernierPitch * unit + 20}
          height="72"
          rx="9"
          fill="#dce6d2"
        />
        <path d={`M${aligned} 32V127`} stroke="#bd9d64" strokeWidth="4" opacity=".32" />
        {Array.from({ length: divisions + 3 }, (_, j) => {
          const x = 44 + j * unit,
            major =
              j === 0 || j === divisions + 2 || (j === s.aligned && j >= 3 && j <= divisions - 1);
          return (
            <g key={j}>
              <path d={`M${x} 72V${major ? 49 : 58}`} stroke="#849279" strokeWidth="1.4" />
              {major && (
                <text x={x} y="40" textAnchor="middle">
                  {s.main + j}
                </text>
              )}
            </g>
          );
        })}
        {Array.from({ length: divisions + 1 }, (_, j) => {
          const x = zero + j * s.vernierPitch * unit,
            major =
              j === 0 ||
              j === divisions ||
              (j === s.aligned && j >= divisions * 0.25 && j <= divisions * 0.75);
          return (
            <g key={j}>
              <path
                d={`M${x} 76V${major ? 112 : 99}`}
                stroke={j === s.aligned ? '#aa874f' : '#849279'}
                strokeWidth={j === s.aligned ? 2.4 : 1.2}
              />
              {major && (
                <text x={x} y="139" textAnchor="middle">
                  {j}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="length-result">
        <span>{s.main} mm</span>
        <b>+</b>
        <span>
          {s.aligned} × {s.resolution.toFixed(2)} mm
        </span>
        <strong>= {s.indicated.toFixed(divisions === 10 ? 1 : 2)} mm</strong>
      </div>
    </div>
  );
}
function Caliper({
  gap,
  size,
  inside,
  id,
  divisions,
  focus,
}: {
  focus?: 'instrument' | 'scale';
  gap: number;
  size: number;
  inside: boolean;
  id: string;
  divisions: VernierDivisions;
}) {
  const left = 72,
    right = 72 + gap * 6,
    beam = inside ? 165 : 85,
    height = inside ? 325 : 300,
    contact = Math.abs(gap - size) < 0.025;
  return (
    <div className={focus ? `length-focus length-focus-${focus}` : undefined}>
      <svg
        className="length-apparatus"
        viewBox={`0 0 440 ${height}`}
        role="img"
        aria-label={t(inside ? '内测量爪撑住槽的内壁' : '外测量爪与小球两侧接触')}
      >
        <Metal id={id} />
        {inside ? (
          <path
            d={`M40 80H${left + size * 6 + 32}V140H${left + size * 6}V100H72V140H40Z`}
            fill="#c7c6aa"
            stroke="#aaa98a"
          />
        ) : (
          <circle
            cx={left + size * 3}
            cy="200"
            r={size * 3}
            fill={`url(#${id}-steel)`}
            stroke="#9daa9b"
          />
        )}
        <rect
          x="54"
          y={beam}
          width="364"
          height="26"
          rx="4"
          fill={`url(#${id}-steel)`}
          stroke="#96a58f"
        />
        <path
          d={`M54 ${beam}V${beam + 140}Q72 ${beam + 139} 72 ${beam + 124}V${beam + 26}`}
          fill={`url(#${id}-steel)`}
          stroke="#96a58f"
        />
        <path
          d={`M${right} ${beam + 22}V${beam + 124}L${right + 16} ${beam + 140}V${beam - 4}H${right - 7}V${beam + 22}Z`}
          fill={`url(#${id}-steel)`}
          stroke="#96a58f"
        />
        <path
          d={`M72 ${beam}V${beam - 60}L84 ${beam - 47}V${beam}M${right} ${beam}V${beam - 60}L${right - 12} ${beam - 47}V${beam}`}
          fill={`url(#${id}-steel)`}
          stroke="#96a58f"
        />
        <rect
          x={right - 9}
          y={beam - 5}
          width="91"
          height="42"
          rx="6"
          fill="#c3ceb7"
          stroke="#91a487"
        />
        <circle cx={right + 54} cy={beam - 8} r="7" fill="#a6b597" />
        {Array.from({ length: 52 }, (_, i) => (
          <path
            key={i}
            d={`M${72 + i * 6} ${beam + 3}v${i % 5 === 0 ? 15 : 8}`}
            stroke="#92a089"
            strokeWidth="1"
          />
        ))}
        <path d={`M${right + 5} ${beam + 28}h60`} stroke="#8da181" strokeWidth="1.5" />
      </svg>
      <div className="length-contact">
        {t(contact ? '测量面已经贴合，再读取刻度' : '测量面尚未贴合，先调整位置')}
      </div>
      <Vernier length={gap} divisions={divisions} />
      {focus === 'scale' && (
        <p className="length-mechanism">
          1 mm − {((divisions - 1) / divisions).toFixed(2)} mm = {(1 / divisions).toFixed(2)} mm
        </p>
      )}
    </div>
  );
}
function Micrometer({
  opening,
  object,
  zeroError,
  id,
  kind,
  focus,
}: {
  focus?: 'instrument' | 'scale' | 'contact';
  opening: number;
  object: number;
  zeroError: number;
  id: string;
  kind: string;
}) {
  const contact = micrometerContact(opening, object),
    s = micrometerReading(contact.opening, zeroError),
    tip = 94 + contact.opening * 12,
    edge = 220 + contact.opening * 12,
    index = s.thimble,
    near = Math.floor(index),
    zoomEdge = 110 + (s.indicated - s.sleeve) * 150,
    showClose = focus === 'contact' || (object > 0 && object < 1);
  return (
    <div className={focus ? `length-focus length-focus-${focus}` : undefined}>
      <svg
        className="length-apparatus length-micrometer"
        viewBox="0 0 440 280"
        role="img"
        aria-label={t('测微螺杆由同一螺纹运动，测砧与螺杆夹住被测物')}
      >
        <Metal id={id} />
        <path
          d="M72 120C21 120 19 231 89 243H172Q222 239 222 183V121"
          fill="none"
          stroke="#aab99a"
          strokeWidth="28"
          strokeLinecap="round"
        />
        <path
          d="M67 161C50 192 61 218 95 226H156"
          fill="none"
          stroke="#c9d4b6"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <rect x="65" y="109" width="29" height="22" rx="4" fill={`url(#${id}-steel)`} />
        <rect x={tip} y="112" width={235 - tip} height="16" rx="2" fill={`url(#${id}-steel)`} />
        {object > 0 && (
          <rect
            x="94"
            y="101"
            width={object * 12}
            height="38"
            rx={kind === 'hair' ? object * 6 : 0}
            fill={kind === 'hair' ? '#8d8064' : '#e0d6b5'}
            stroke="#b8ae8b"
            strokeWidth=".5"
          />
        )}
        <rect x="210" y="101" width="147" height="38" rx="4" fill={`url(#${id}-steel)`} />
        {Array.from({ length: 25 }, (_, i) => (
          <path
            key={i}
            d={`M${220 + i * 6} 119v${i % 2 === 0 ? -13 : 10}`}
            stroke="#91a18a"
            strokeWidth="1"
          />
        ))}
        <rect
          x={edge}
          y="91"
          width="66"
          height="58"
          rx="8"
          fill={`url(#${id}-steel)`}
          stroke="#94a58d"
        />
        {Array.from({ length: 14 }, (_, i) => {
          const angle = s.angle + (i * Math.PI * 2) / 14;
          return Math.cos(angle) > 0 ? (
            <path
              key={i}
              d={`M${edge + 23} ${120 + 26 * Math.sin(angle)}H${edge + 60}`}
              stroke={i === 0 ? '#aa8045' : '#94a58a'}
              strokeWidth={i === 0 ? 3 : 1}
            />
          ) : null;
        })}
        <rect x={edge + 65} y="102" width="28" height="36" rx="9" fill="#aebd9e" stroke="#97aa88" />
        <path d={`M${edge + 75} 108V132M${edge + 83} 108V132`} stroke="#cfd8bc" strokeWidth="2" />
      </svg>
      {focus === 'instrument' && (
        <p className="length-mechanism">
          360° → 0.50 mm
          <br />
          0.50 mm ÷ 50 = 0.01 mm
        </p>
      )}
      {showClose && (
        <div className="length-close">
          <span>{t('接触处放大')}</span>
          <svg viewBox="0 0 440 82" role="img" aria-label={t('放大的测量面与薄样品')}>
            <rect x="104" y="16" width="76" height="50" rx="6" fill="#b8c5ad" />
            <rect
              x={180 + contact.opening * 160}
              y="16"
              width="76"
              height="50"
              rx="6"
              fill="#b8c5ad"
            />
            <rect
              x="180"
              y="8"
              width={object * 160}
              height="66"
              fill={kind === 'hair' ? '#918467' : '#e6ddbd'}
            />
          </svg>
        </div>
      )}
      <div className="length-contact">
        {t(contact.contact ? '已接触：继续转动微调钮不会压入样品' : '螺杆尚未接触样品')}
      </div>
      <div className="length-scale">
        <p>{t('固定刻度与可动刻度')}</p>
        <svg
          viewBox="0 0 440 166"
          role="img"
          aria-label={t('固定半毫米刻度加上微分筒读数，并保留估读位')}
        >
          <rect x="28" y="31" width="242" height="110" rx="12" fill="#e3ead7" />
          <path d={`M45 82H${zoomEdge + 110}`} stroke="#7e9174" strokeWidth="1.5" />
          {[-1, 0, 1]
            .filter((i) => s.sleeve + i * 0.5 >= 0)
            .map((i) => (
              <g key={i}>
                <path
                  d={`M${110 + i * 75} 82V${(Math.round(s.sleeve * 2) + i) % 2 === 0 ? 53 : 106}`}
                  stroke="#83967a"
                  strokeWidth="1.5"
                />
                <text
                  x={110 + i * 75}
                  y={(Math.round(s.sleeve * 2) + i) % 2 === 0 ? 43 : 133}
                  textAnchor="middle"
                >
                  {(s.sleeve + i * 0.5).toFixed(1)}
                </text>
              </g>
            ))}
          <rect x={zoomEdge} y="14" width="220" height="140" rx="12" fill="#c9d8bb" />
          {Array.from({ length: 7 }, (_, i) => {
            const tick = near - 3 + i,
              yy = 82 + (tick - index) * 34;
            return yy > 22 && yy < 149 ? (
              <g key={i}>
                <path
                  d={`M${zoomEdge} ${yy}H${zoomEdge + (tick % 5 === 0 ? 36 : 23)}`}
                  stroke="#83967a"
                  strokeWidth="1.6"
                />
                <text x={zoomEdge + 100} y={yy + 7} textAnchor="middle">
                  {((tick % 50) + 50) % 50}
                </text>
              </g>
            ) : null;
          })}
          <path d={`M${zoomEdge - 12} 82H${zoomEdge + 42}`} stroke="#aa8c54" strokeWidth="2.2" />
        </svg>
        <div className="length-result">
          <span>{s.sleeve.toFixed(1)} mm</span>
          <b>+</b>
          <span>{s.thimble.toFixed(1)} × 0.01 mm</span>
          <strong>= {s.indicated.toFixed(3)} mm</strong>
        </div>
        {zeroError !== 0 && (
          <div className="length-zero">
            {focus === 'contact' ? (
              <>
                {s.indicated.toFixed(3)} − {zeroError.toFixed(3)} ={' '}
                <b>{s.corrected.toFixed(3)} mm</b>
              </>
            ) : (
              <>
                {t('扣除零点读数')} {zeroError.toFixed(3)} mm → <b>{s.corrected.toFixed(3)} mm</b>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
function Accumulation({
  turns,
  gap,
  id,
  compact = false,
}: {
  turns: number;
  gap: number;
  id: string;
  compact?: boolean;
}) {
  const s = accumulatedWire(turns, 1.3, gap),
    unit = Math.min(12, 350 / s.span),
    rulerMax = Math.ceil(Math.max(30, s.span) / 5) * 5,
    pitch = (1.3 + gap) * unit,
    end = 65 + s.span * unit;
  return (
    <>
      <svg
        className="length-apparatus"
        viewBox="0 0 440 245"
        role="img"
        aria-label={t('铜丝密绕木棒，测量多个直径的总长后除以圈数')}
      >
        <Metal id={id} />
        <rect x="27" y="85" width="386" height="68" rx="26" fill="#d2c1a0" stroke="#b4a686" />
        <path d="M48 100H391M48 137H391" stroke="#b9a988" strokeWidth="1" opacity=".45" />
        {Array.from({ length: turns }, (_, i) => {
          const cx = 65 + 0.65 * unit + i * pitch;
          return (
            <g key={i}>
              {gap > 0 && i < turns - 1 && (
                <rect x={cx + 0.65 * unit} y="83" width={gap * unit} height="72" fill="#aa743e" />
              )}
              <path
                d={`M${cx} 83V155`}
                stroke={`url(#${id}-copper)`}
                strokeWidth={1.3 * unit}
                strokeLinecap="butt"
              />
              <path d={`M${cx - 3} 87V151`} stroke="#f0d4a1" strokeWidth="2" opacity=".7" />
            </g>
          );
        })}
        <rect x="53" y="183" width="378" height="46" rx="6" fill="#eee4c8" stroke="#c5ba9b" />
        {Array.from({ length: rulerMax + 1 }, (_, i) => (
          <g key={i}>
            <path
              d={`M${65 + i * unit} 183V${i % 5 === 0 ? 203 : 195}`}
              stroke="#9b9577"
              strokeWidth="1.2"
            />
            {i % (rulerMax > 35 ? 10 : 5) === 0 && (
              <text x={65 + i * unit} y="222" textAnchor="middle">
                {i}
              </text>
            )}
          </g>
        ))}
        <path d={`M65 159V184M${end} 159V184M65 170H${end}`} stroke="#ae8f58" strokeWidth="1.8" />
      </svg>
      <div className="length-result">
        <span>L = {s.span.toFixed(1)} mm</span>
        <span>N = {turns}</span>
        <strong>d ≈ {s.estimate.toFixed(2)} mm</strong>
      </div>
      <div className="length-error">
        {compact ? (
          <>
            ±0.1 mm ÷ {turns} = ±{s.diameterError.toFixed(3)} mm
          </>
        ) : (
          <>
            {t('若总长读数误差为 ±0.1 mm')}
            <br />
            {t('平均到每圈')} ±{s.diameterError.toFixed(3)} mm
          </>
        )}
      </div>
      {gap > 0 && !compact && (
        <div className="length-zero">{t('圈间留缝，会把直径估得偏大。')}</div>
      )}
    </>
  );
}
export default function LengthInstruments() {
  const film = useShowcase(),
    id = useId().replaceAll(':', '');
  const [mode, setMode] = useState(
      film.variant === 'r3-screw-micrometer'
        ? 'micrometer'
        : film.variant === 'required-1-wire-diameter'
          ? 'accumulation'
          : 'caliper',
    ),
    [jaw, setJaw] = useState('outside'),
    [size, setSize] = useState(23.7),
    [divisions, setDivisions] = useState('10'),
    [specimen, setSpecimen] = useState('paper'),
    [opening, setOpening] = useState(0.105),
    [zero, setZero] = useState(0),
    [turns, setTurns] = useState(10),
    [gap, setGap] = useState(0);
  const c = film.chapter,
    shot = lengthFilmState(c, film.chapterTime, browserLocale()),
    active = film.watch ? (c < 3 ? 'caliper' : c < 6 ? 'micrometer' : 'accumulation') : mode,
    inside = film.watch ? shot.inside : jaw === 'inside',
    sample = film.watch ? shot.sample : size,
    jawGap = film.watch ? shot.jawGap : size,
    kind = film.watch ? shot.kind : specimen,
    obj = film.watch
      ? shot.object
      : specimen === 'paper'
        ? 0.105
        : specimen === 'hair'
          ? 0.075
          : 6.725,
    microGap = film.watch ? shot.opening : opening,
    error = film.watch ? shot.zeroError : zero / 1000,
    count = film.watch ? shot.turns : turns,
    activeGap = film.watch ? shot.gap : gap;
  return (
    <section
      className="length-film"
      data-watch={film.watch || undefined}
      data-chapter={film.chapter}
    >
      <p className="length-kicker">
        {t(
          active === 'caliper'
            ? '先让测量面贴合，再找刻度的对齐'
            : active === 'micrometer'
              ? '同一螺纹，把旋转变成细小的直线位移'
              : '把一次难读的小长度，累积成清楚的总长度',
        )}
      </p>
      {active === 'caliper' ? (
        <Caliper
          gap={jawGap}
          size={sample}
          inside={inside}
          divisions={film.watch ? 10 : (Number(divisions) as VernierDivisions)}
          focus={film.watch ? shot.caliperFocus : undefined}
          id={id}
        />
      ) : active === 'micrometer' ? (
        <Micrometer
          opening={microGap}
          object={obj}
          zeroError={error}
          id={id}
          kind={kind}
          focus={film.watch ? (c === 3 ? 'instrument' : c === 4 ? 'scale' : 'contact') : undefined}
        />
      ) : (
        <Accumulation turns={count} gap={activeGap} id={id} compact={film.watch} />
      )}
      <div className="length-note">
        {t(
          active === 'accumulation'
            ? '圈数增加能减小读数影响；不保证消除系统误差。'
            : '模型保留刻度几何；真实测量还需对正、控力与重复读数。',
        )}
      </div>
      {!film.watch && (
        <div className="length-controls">
          <Segments
            label={t('选择长度测量方法')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'caliper', label: t('游标卡尺') },
              { value: 'micrometer', label: t('螺旋测微器') },
              { value: 'accumulation', label: t('累积测量') },
            ]}
          />
          {mode === 'caliper' ? (
            <>
              <Segments
                label={t('选择测量爪')}
                value={jaw}
                onChange={setJaw}
                options={[
                  { value: 'outside', label: t('外径') },
                  { value: 'inside', label: t('槽宽') },
                ]}
              />
              <Segments
                label={t('游标分度数')}
                value={divisions}
                onChange={setDivisions}
                options={[
                  { value: '10', label: '10' },
                  { value: '20', label: '20' },
                  { value: '50', label: '50' },
                ]}
              />
              <Range
                label={t('被测长度')}
                value={size}
                min={8}
                max={25}
                step={1 / Number(divisions)}
                unit="mm"
                onChange={setSize}
              />
            </>
          ) : mode === 'micrometer' ? (
            <>
              <Segments
                label={t('被测样品')}
                value={specimen}
                onChange={(v) => {
                  setSpecimen(v);
                  setOpening(v === 'paper' ? 0.105 : v === 'hair' ? 0.075 : 6.725);
                }}
                options={[
                  { value: 'paper', label: t('纸张') },
                  { value: 'hair', label: t('头发') },
                  { value: 'block', label: t('读数示例') },
                ]}
              />
              <Range
                label={t('螺杆请求开口')}
                value={opening}
                min={0}
                max={8}
                step={0.005}
                unit="mm"
                onChange={setOpening}
              />
              <Range
                label={t('零点读数')}
                value={zero}
                min={0}
                max={30}
                step={5}
                unit="μm"
                onChange={setZero}
              />
            </>
          ) : (
            <>
              <Range
                label={t('密绕圈数')}
                value={turns}
                min={1}
                max={20}
                step={1}
                onChange={setTurns}
              />
              <Range
                label={t('圈间缝隙')}
                value={gap}
                min={0}
                max={0.1}
                step={0.01}
                unit="mm"
                onChange={setGap}
              />
            </>
          )}
        </div>
      )}
      <details className="length-details">
        <summary>{t('刻度、接触与误差的边界')}</summary>
        <p>
          {t(
            '游标几何由主尺 1 mm 与游标小分度的差值得出。测微器每转前进 0.5 mm，50 分度给出 0.01 mm，并估读到下一位；接触后模型不允许螺杆穿入样品。累积法采用密排圆形线截面的近似，忽略螺旋倾角与形变。±0.1 mm 是指定的总长读数误差假设，间隙、零点和形变等系统误差不会自动随圈数消失。',
          )}
        </p>
      </details>
    </section>
  );
}
