import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range, Segments } from '../lab/Controls';
import {
  extracellularTracer,
  practiceTemperatureRecords,
  practiceHousehold,
  practiceAirTemperature,
  temperatureTimes,
  temperatureSummary,
  thermalRegulation,
  waterRegulation,
  sodiumRegulation,
  renalGeometry,
  aqpInsertion,
  waterMarkers,
  sodiumCycle,
  fluidDirector,
} from '../../models/bio-body-fluid-balance';
import '../../styles/bio-body-fluid-balance.css';
type Say = (zh: string, en: string) => string;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const names = [
  ['血浆与组织液', 'Plasma & tissue'],
  ['淋巴回流', 'Lymph return'],
  ['体温记录', 'Record temperature'],
  ['比较记录', 'Compare records'],
  ['热量收支', 'Heat balance'],
  ['水的回收', 'Water recovery'],
  ['钠的回收', 'Sodium recovery'],
];
function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = '#859c83',
  width = 2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  width?: number;
}) {
  const a = Math.atan2(y2 - y1, x2 - x1),
    x = x2 - 7 * Math.cos(a),
    y = y2 - 7 * Math.sin(a);
  return (
    <path
      d={`M${x1} ${y1}L${x2} ${y2}M${x - 4 * Math.sin(a)} ${y + 4 * Math.cos(a)}L${x2} ${y2}L${x + 4 * Math.sin(a)} ${y - 4 * Math.cos(a)}`}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
function Exchange({ w, t, lymph, s }: { w: number; t: number; lymph: boolean; s: Say }) {
  const f = extracellularTracer(t, lymph),
    labels = [s('血浆', 'Plasma'), s('组织液', 'Tissue fluid'), s('淋巴液', 'Lymph')],
    ys = [46, 143, 230];
  return (
    <>
      <svg
        viewBox={`0 0 ${w} 260`}
        role="img"
        aria-label={s('三个区室中守恒的示踪物', 'Conserved tracer in three compartments')}
      >
        <rect x="18" y="31" width={w - 48} height="42" rx="21" fill="#ead2cc" stroke="#bb9289" />
        <rect x="18" y="208" width={w - 48} height="42" rx="21" fill="#e0e8d2" stroke="#9cad8d" />
        <rect x="18" y="92" width={w - 48} height="96" rx="26" fill="#f4eee0" />
        {[0.25, 0.5, 0.75].map((q, i) => (
          <g key={i}>
            <ellipse
              cx={(w - 30) * q}
              cy="126"
              rx={Math.min(25, w * 0.085)}
              ry="22"
              fill="#dce6d5"
              stroke="#a4b797"
            />
            <ellipse cx={(w - 30) * q + 5} cy="125" rx="7" ry="8" fill="#a5ba9b" />
          </g>
        ))}
        <Arrow x1={w * 0.22} y1={76} x2={w * 0.22} y2={93} />
        <Arrow x1={w * 0.65} y1={93} x2={w * 0.65} y2={76} />
        <g opacity={lymph ? 1 : 0.2}>
          <Arrow x1={w * 0.49} y1={190} x2={w * 0.49} y2={207} />
          <path
            d={`M${w - 30} 230H${w - 9}V52H${w - 29}`}
            fill="none"
            stroke="#91a47f"
            strokeWidth="2"
          />
          <Arrow x1={w - 9} y1={52} x2={w - 29} y2={52} />
        </g>
        {[0, 1, 2].map((i) => (
          <g key={i} data-tracer-region={i}>
            {Array.from({ length: Math.round(f.concentration[i] * 144) }, (_, n) => (
              <circle
                key={n}
                cx={30 + ((n * 37) % (w - 74))}
                cy={i === 0 ? 47 + (n % 2) * 12 : i === 1 ? 158 + (n % 2) * 12 : 221 + (n % 2) * 12}
                r="2.6"
                fill="#90713f"
              />
            ))}
          </g>
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <ellipse
            key={i}
            data-rbc={`RBC-${i}`}
            cx={38 + (i * (w - 98)) / 5}
            cy="54"
            rx="6"
            ry="4"
            fill="#c17c77"
            stroke="#a96e68"
          />
        ))}
        {labels.map((label, i) => (
          <text key={label} x="20" y={ys[i] - 29}>
            {label}
          </text>
        ))}
      </svg>
      <div className="bbf17-foot">
        <span>
          {s('总量', 'Total')} {f.total.toFixed(3)}
        </span>
        <span>{s('等面积密度示意', 'Equal-area samples')}</span>
      </div>
    </>
  );
}
function Records({
  w,
  chapter,
  progress,
  household,
  s,
}: {
  w: number;
  chapter: number;
  progress: number;
  household: (number | null)[][];
  s: Say;
}) {
  const series =
    chapter === 2
      ? [household[0].map((v, i) => (i <= Math.floor(progress * 6) ? v : null))]
      : household;
  const X = (i: number) => 33 + ((w - 59) * i) / 6,
    Y = (v: number) => 156 - (v - 35.5) * 36,
    colors = ['#648770', '#ad936f', '#7793b2'];
  return (
    <>
      <div className="bbf17-kicker">
        {s('练习数据 · 非调查结果', 'Practice data · not a survey')}
      </div>
      <svg
        viewBox={`0 0 ${w} ${chapter === 2 ? 200 : 252}`}
        role="img"
        aria-label={s(
          '体温记录，缺测保留为空',
          'Temperature observations with missing values left empty',
        )}
      >
        {[36, 37, 38].map((v) => (
          <g key={v}>
            <path d={`M32 ${Y(v)}H${w - 18}`} stroke="#dedfd4" />
            <text x="26" y={Y(v) + 5} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <text x={w - 18} y="20" textAnchor="end">
          °C
        </text>
        {chapter === 3 &&
          ['A', 'B', 'C'].map((v, i) => (
            <text key={v} x={45 + i * 40} y="20" style={{ fill: colors[i] }}>
              {v}
            </text>
          ))}
        {series.map((row, j) => (
          <g key={j}>
            {row.map((v, i) =>
              v === null ? null : (
                <g key={i}>
                  {i > 0 && row[i - 1] !== null && (
                    <path
                      d={`M${X(i - 1)} ${Y(row[i - 1]!)}L${X(i)} ${Y(v)}`}
                      fill="none"
                      stroke={colors[j]}
                      strokeWidth="2"
                    />
                  )}
                  <circle cx={X(i)} cy={Y(v)} r="4" fill={colors[j]} />
                </g>
              ),
            )}
          </g>
        ))}
        {temperatureTimes.map((t, i) => (
          <text key={t} x={X(i)} y="180" textAnchor="middle">
            {i === 6 ? s('睡前', 'Bed') : t}
          </text>
        ))}
        {chapter === 2 ? (
          <text x="18" y="195">
            {s('记录数', 'Count')} {temperatureSummary(series[0]).count} / 7
          </text>
        ) : (
          <>
            <text x="18" y="207">
              {s('气温另尺度', 'Air, own scale')}: 18–28 °C
            </text>
            <path
              d={practiceAirTemperature
                .map((v, i) => `${i ? 'L' : 'M'}${X(i)} ${250 - (v - 18) * 3.2}`)
                .join(' ')}
              fill="none"
              stroke="#b79a73"
              strokeWidth="2"
            />
          </>
        )}
      </svg>
    </>
  );
}
function Heat({
  w,
  t,
  loss,
  feedback,
  s,
}: {
  w: number;
  t: number;
  loss: number;
  feedback: boolean;
  s: Say;
}) {
  const f = thermalRegulation(t, loss, feedback),
    x = w / 2;
  return (
    <>
      <svg
        viewBox={`0 0 ${w} 236`}
        role="img"
        aria-label={s('热输入与散热决定储热', 'Heat input and heat loss determine storage')}
      >
        <ellipse cx={x} cy="43" rx="21" ry="24" fill="#e5d8bf" stroke="#b7a98f" />
        <path
          d={`M${x - 16} 66Q${x - 49} 75 ${x - 47} 117L${x - 37} 168L${x - 23} 168L${x - 21} 217H${x - 3}L${x} 168L${x + 3} 217H${x + 21}L${x + 23} 168H${x + 37}L${x + 47} 117Q${x + 49} 75 ${x + 16} 66Z`}
          fill="#ebe0ca"
          stroke="#b7a98f"
        />
        <rect
          x={x - 18}
          y={145 - Math.max(0, f.deviation) * 42}
          width="36"
          height={Math.max(2, Math.max(0, f.deviation) * 42)}
          rx="8"
          fill="#c78c66"
          opacity=".65"
        />
        <g opacity={f.drive ? 1 : 0.3}>
          <Arrow
            x1={16}
            y1={110}
            x2={x - 50}
            y2={110}
            color="#bc845b"
            width={2 + Math.abs(f.drive) * 5}
          />
        </g>
        <Arrow
          x1={x + 50}
          y1={110}
          x2={w - 16}
          y2={110}
          color="#81a6a5"
          width={2 + Math.abs(f.response) * 5}
        />
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M${x + 40 + i * 8} 72q-6 10 0 12q6-2 0-12Z`}
            fill="#78a6b6"
            opacity={clamp(Math.abs(f.response) * 3)}
          />
        ))}
        <text x="16" y="88">
          {f.drive ? s('输入', 'Input') : s('已停止', 'Stopped')}
        </text>
        <text x={w - 16} y="139" textAnchor="end">
          {s('散热', 'Heat loss')}
        </text>
        <text x={x} y="158" textAnchor="middle">
          Δ {f.deviation.toFixed(2)}
        </text>
      </svg>
      <div className="bbf17-foot">
        <span>{s('归一化收支', 'Relative balance')}</span>
        <span>
          {f.input.toFixed(2)} − {f.removed.toFixed(2)}
        </span>
      </div>
    </>
  );
}
function StockLoss({ w, stock, s, salt }: { w: number; stock: number; s: Say; salt: boolean }) {
  const xs = [w * 0.26, w * 0.74],
    values = [1, stock],
    bottom = 210,
    h = 142;
  return (
    <>
      <div className="bbf17-kicker">
        {salt
          ? s('水量固定，比较钠量', 'Fixed water; compare sodium')
          : s('溶质固定，水量下降', 'Fixed solute; less water')}
      </div>
      <svg
        viewBox={`0 0 ${w} 254`}
        role="img"
        aria-label={
          salt
            ? s('初始与扰动后的相对钠量', 'Initial and disturbed relative sodium amounts')
            : s('水减少但同一份溶质保留', 'Less water with the same solute retained')
        }
      >
        {values.map((v, i) => (
          <g key={i}>
            <text x={xs[i]} y="27" textAnchor="middle">
              {i ? s('现在', 'Now') : s('初始', 'Initial')}
            </text>
            {!salt && (
              <path
                d={`M${xs[i] - 34} 48V${bottom - 9}Q${xs[i] - 34} ${bottom} ${xs[i] - 25} ${bottom}H${xs[i] + 25}Q${xs[i] + 34} ${bottom} ${xs[i] + 34} ${bottom - 9}V48`}
                fill="none"
                stroke="#b5b29b"
                strokeWidth="2"
              />
            )}
            {!salt && (
              <rect
                x={xs[i] - 31}
                y={bottom - h * (salt ? 1 : v)}
                width="62"
                height={h * (salt ? 1 : v) - 2}
                rx="7"
                fill="#dce9e9"
              />
            )}
            {salt ? (
              <g>
                <path
                  d={`M${xs[i] - 34} 48V${bottom}H${xs[i] + 34}`}
                  fill="none"
                  stroke="#b5b29b"
                  strokeWidth="2"
                />
                <rect
                  x={xs[i] - 20}
                  y={bottom - h * v}
                  width="40"
                  height={h * v - 2}
                  rx="5"
                  fill="#d2b17e"
                />
              </g>
            ) : (
              Array.from({ length: 5 }, (_, j) => (
                <circle
                  key={j}
                  data-stock-solute={`${i}-${j}`}
                  cx={xs[i] + (j % 2 ? 12 : -12)}
                  cy={bottom - 20 - j * 22 * v}
                  r="4"
                  fill="#a28a63"
                />
              ))
            )}
            <text x={xs[i]} y="239" textAnchor="middle">
              {v.toFixed(3)}
            </text>
          </g>
        ))}
        <Arrow x1={w * 0.5 - 12} y1={64} x2={w * 0.5 + 12} y2={64} color="#ac9876" />
      </svg>
    </>
  );
}
function Signal({
  w,
  s,
  salt,
  signal,
  loss,
  stock,
}: {
  w: number;
  s: Say;
  salt: boolean;
  signal: number;
  loss: boolean;
  stock: number;
}) {
  const x = w / 2;
  if (loss) return <StockLoss w={w} stock={stock} s={s} salt={salt} />;
  return (
    <>
      <div className="bbf17-kicker">
        {loss
          ? s('同样的外部损失', 'The same external loss')
          : salt
            ? s('肾上腺皮质：醛固酮', 'Adrenal cortex: aldosterone')
            : s('下丘脑合成 → 后叶释放', 'Made in hypothalamus; released from posterior pituitary')}
      </div>
      <svg
        viewBox={`0 0 ${w} 240`}
        role="img"
        aria-label={
          salt
            ? s('钠反馈路径示意', 'Sodium feedback schematic')
            : s('水反馈路径示意', 'Water feedback schematic')
        }
      >
        <ellipse cx={x} cy="34" rx="22" ry="25" fill="#e7dcc6" stroke="#bba98a" />
        <path
          d={`M${x - 16} 58Q${x - 48} 68 ${x - 43} 110L${x - 34} 165L${x - 24} 165L${x - 22} 225H${x - 4}L${x} 166L${x + 4} 225H${x + 22}L${x + 24} 165H${x + 34}L${x + 43} 110Q${x + 48} 68 ${x + 16} 58Z`}
          fill="#eee4d2"
          stroke="#bba98a"
        />
        {[-1, 1].map((a) => (
          <g key={a}>
            <path
              d={`M${x + a * 25} 116q${a * 20}-17 ${a * 23} 8q${a * 2} 20 ${-a * 22} 13q${a * 12}-12 ${-a} -21Z`}
              fill="#b58c78"
              stroke="#987360"
            />
            {salt && <path d={`M${x + a * 25 - 11} 108q11-12 22 0Z`} fill="#a6bc8b" />}
          </g>
        ))}
        {!salt && (
          <>
            <circle cx={x - 3} cy="28" r="5" fill="#87a281" />
            <circle cx={x + 4} cy="43" r="4" fill="#78968b" />
            <path
              d={`M${x - 3} 32L${x + 4} 40M${x + 4} 48V97L${x + 27} 115`}
              stroke="#7d9986"
              strokeWidth="2"
              fill="none"
              strokeDasharray="3 4"
            />
          </>
        )}
        {salt && <path d={`M${x + 26} 109V136`} stroke="#7d9986" strokeWidth="3" fill="none" />}
        <Arrow x1={x + 32} y1={157} x2={w - 16} y2={188} color="#88a1b5" />
        {loss && <Arrow x1={x - 29} y1={86} x2={18} y2={86} color="#b38762" />}
        <text x="15" y="192">
          {salt ? s('钠量下降', 'Na amount falls') : s('溶质暂不变', 'Solute fixed')}
        </text>
        <text x="15" y="218">
          {salt ? s('调节信号', 'Signal') : s('ADH信号', 'ADH signal')} {signal.toFixed(2)}
        </text>
      </svg>
    </>
  );
}
function Channel({ x, y, name }: { x: number; y: number; name?: string }) {
  return (
    <g>
      <path
        d={`M${x - 5} ${y - 18}V${y - 8}M${x + 5} ${y - 18}V${y - 8}M${x - 5} ${y + 8}V${y + 18}M${x + 5} ${y + 8}V${y + 18}`}
        stroke="#638b90"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {name && (
        <text x={x} y={y - 25} textAnchor="middle">
          {name}
        </text>
      )}
    </g>
  );
}
function WaterCell({
  w,
  p,
  gradient,
  s,
  counter = false,
}: {
  w: number;
  p: number;
  gradient: number;
  s: Say;
  counter?: boolean;
}) {
  const insertion = counter ? 1 : clamp(p / 0.38),
    f = aqpInsertion(insertion, w),
    trace = counter ? p : clamp((p - 0.42) / 0.5),
    markers = waterMarkers(trace, gradient, w),
    g = renalGeometry(w);
  return (
    <>
      <div className="bbf17-columns">
        <span>{s('管腔', 'Lumen')}</span>
        <span>{s('集合管细胞', 'Duct cell')}</span>
        <span>{s('体内侧', 'Body side')}</span>
      </div>
      <svg
        viewBox={`0 0 ${w} 254`}
        role="img"
        aria-label={s(
          '同一水通道插入膜后双向透水',
          'The same channel enters the membrane; water crosses in both directions',
        )}
      >
        <rect
          x="4"
          y={g.top}
          width={g.apical - 4}
          height={g.bottom - g.top}
          rx="10"
          fill="#e6f0f1"
        />
        <rect
          x={g.apical}
          y={g.top}
          width={g.basal - g.apical}
          height={g.bottom - g.top}
          fill="#f3e6cb"
        />
        <rect
          x={g.basal}
          y={g.top}
          width={w - g.basal - 4}
          height={g.bottom - g.top}
          rx="10"
          fill="#e4eddc"
        />
        <path
          d={`M${g.apical} ${g.top}V${g.centerY - (f.inserted ? 11 : f.halfGap)}M${g.apical} ${g.centerY + (f.inserted ? 11 : f.halfGap)}V${g.bottom}M${g.basal} ${g.top}V${g.centerY - 11}M${g.basal} ${g.centerY + 11}V${g.bottom}`}
          stroke="#b69b6c"
          strokeWidth="5"
          fill="none"
        />
        {!f.inserted && (
          <path
            d={f.arc.map((v, i) => `${i ? 'L' : 'M'}${v.x} ${v.y}`).join(' ')}
            fill="none"
            stroke="#b69b6c"
            strokeWidth="4"
          />
        )}
        {[0, 1].map((region) => (
          <g key={region}>
            {Array.from({ length: gradient ? (region ? 6 : 2) : 4 }, (_, i) => (
              <rect
                x={(region ? g.basal + 14 : 18) + (i % 2) * 16}
                y={58 + Math.floor(i / 2) * 17}
                width="4"
                height="4"
                rx="1"
                fill="#a99579"
                opacity=".7"
              />
            ))}
          </g>
        ))}
        <g data-channel={f.channel.id}>
          <Channel x={f.channel.x} y={f.channel.y} />
          <text x={f.channel.x} y="110" textAnchor="middle">
            AQP2
          </text>
        </g>
        <Channel x={g.basal} y={g.centerY} />
        {insertion >= 1 &&
          markers.map((m, i) => (
            <g key={m.id} data-water={m.id}>
              <circle
                cx={m.x}
                cy={m.y}
                r="4.5"
                fill={i ? '#e9f0f4' : '#83a7bf'}
                stroke="#567f95"
                strokeWidth="1.5"
              />
            </g>
          ))}
        {insertion >= 1 && (
          <>
            <Arrow x1={25} y1={15} x2={w - 25} y2={15} color="#799bac" width={gradient ? 3 : 2} />
            <Arrow x1={w - 25} y1={31} x2={25} y2={31} color="#799bac" width={2} />
          </>
        )}
        <text x={w / 2} y="241" textAnchor="middle">
          {insertion < 1
            ? s('同一通道进入膜', 'The same channel enters')
            : gradient
              ? s('水势差 → 净回收', 'Gradient → net recovery')
              : s('无水势差 → 净回收为零', 'No gradient: net flow 0')}
        </text>
      </svg>
    </>
  );
}
function SodiumCell({ w, p, pump, s }: { w: number; p: number; pump: boolean; s: Say }) {
  const f = sodiumCycle(p, pump, w),
    g = renalGeometry(w);
  return (
    <>
      <div className="bbf17-columns">
        <span>{s('管腔', 'Lumen')}</span>
        <span>{s('细胞', 'Cell')}</span>
        <span>{s('体内侧', 'Body side')}</span>
      </div>
      <svg
        viewBox={`0 0 ${w} 254`}
        role="img"
        aria-label={s(
          '同一批钠经通道入细胞，再由钠钾泵送回体内',
          'The same sodium ions enter through channels and leave through the sodium-potassium pump',
        )}
      >
        <rect x="4" y="44" width={g.apical - 4} height="172" rx="10" fill="#e6f0f1" />
        <rect x={g.apical} y="44" width={g.basal - g.apical} height="172" fill="#f3e6cb" />
        <rect x={g.basal} y="44" width={w - g.basal - 4} height="172" rx="10" fill="#e4eddc" />
        <path
          d={`M${g.apical} 44V64M${g.apical} 100V114M${g.apical} 150V164M${g.apical} 200V216M${g.basal} 44V60M${g.basal} 202V216`}
          fill="none"
          stroke="#b69b6c"
          strokeWidth="5"
        />
        {[82, 132, 182].map((y) => (
          <Channel key={y} x={g.apical} y={y} />
        ))}
        <rect
          x={g.basal - 10}
          y="60"
          width="20"
          height="142"
          rx="10"
          fill={pump ? '#b4be99' : '#d2cebd'}
          stroke="#7f8f6e"
          strokeWidth="2"
        />
        <text x={g.apical} y="29" textAnchor="middle">
          ENaC
        </text>
        <text x={g.basal} y="29" textAnchor="middle">
          {s('钠钾泵', 'Na/K pump')}
        </text>
        {f.ions.map((ion) => (
          <g key={ion.id} data-ion={ion.id} data-compartment={ion.compartment}>
            <ellipse
              cx={ion.x}
              cy={ion.y}
              rx="16"
              ry="11"
              fill={ion.species === 'Na' ? '#dfb789' : '#bacbd2'}
              stroke={ion.species === 'Na' ? '#ae8254' : '#7395a6'}
            />
            <text x={ion.x} y={ion.y + 5.5} textAnchor="middle">
              {ion.species === 'Na' ? 'Na⁺' : 'K⁺'}
            </text>
          </g>
        ))}
        <text x={w / 2} y="242" textAnchor="middle">
          {!pump
            ? s('新比较：泵停止', 'New comparison: pump off')
            : f.atpUsed
              ? 'ATP → ADP + Pi'
              : s('通道先让钠进入', 'Channels admit sodium')}
        </text>
      </svg>
    </>
  );
}
function Budget({
  w,
  s,
  salt,
  loss,
  response,
  driver,
  t,
}: {
  w: number;
  s: Say;
  salt: boolean;
  loss: number;
  response: boolean;
  driver: boolean;
  t: number;
}) {
  const current = salt
      ? sodiumRegulation(t, loss, response, driver)
      : waterRegulation(t, loss, response, driver ? 1 : 0),
    blocked = salt
      ? sodiumRegulation(t, loss, false, driver)
      : waterRegulation(t, loss, false, driver ? 1 : 0),
    r = current.route;
  const stock = salt ? 'sodium' : 'water',
    a = stock in current ? Number(current[stock as keyof typeof current]) : 0,
    b = stock in blocked ? Number(blocked[stock as keyof typeof blocked]) : 0;
  return (
    <>
      <div className="bbf17-kicker">
        {s('同一末段输入，分成两路', 'One terminal delivery, two routes')}
      </div>
      <svg
        viewBox={`0 0 ${w} 210`}
        role="img"
        aria-label={s(
          '回收加尿中排出等于小管输入',
          'Reabsorbed plus urinary output equals tubular delivery',
        )}
      >
        <path
          d={`M22 64H${w * 0.4}Q${w * 0.52} 64 ${w * 0.58} 42L${w - 22} 42`}
          fill="none"
          stroke="#a3b38c"
          strokeWidth={5 + r.reabsorbed * 100}
          strokeLinecap="round"
        />
        <path
          d={`M${w * 0.4} 64Q${w * 0.52} 64 ${w * 0.58} 115L${w - 22} 115`}
          fill="none"
          stroke="#98b3bd"
          strokeWidth={5 + r.urine * 100}
          strokeLinecap="round"
        />
        <text x="18" y="37">
          {s('输入', 'In')} {r.delivery.toFixed(3)}
        </text>
        <text x={w - 16} y="25" textAnchor="end">
          {s('回收', 'Back')} {r.reabsorbed.toFixed(3)}
        </text>
        <text x={w - 16} y="143" textAnchor="end">
          {s('尿中', 'Urine')} {r.urine.toFixed(3)}
        </text>
        <text x="18" y="178">
          {s('体内剩余', 'Body stock')}
        </text>
        <text x={w - 18} y="178" textAnchor="end">
          {a.toFixed(3)}
        </text>
        <text x="18" y="205">
          {s('不响应激素', 'No response')}
        </text>
        <text x={w - 18} y="205" textAnchor="end">
          {b.toFixed(3)}
        </text>
      </svg>
      <div className="bbf17-kicker">
        {s('归一化模型，非生理测量', 'Normalized model, not measurements')}
      </div>
    </>
  );
}
export default function BioBodyFluidBalance() {
  const film = useShowcase(),
    { host, width } = useSignalWidth(),
    w = Math.max(250, Math.min(720, width)),
    en = browserLocale() === 'en',
    s: Say = (a, b) => (en ? b : a);
  const [selected, setSelected] = useState<number | null>(null),
    [manualTime, setManualTime] = useState<number | null>(null),
    [detail, setDetail] = useState<string | null>(null),
    [lymph, setLymph] = useState(true),
    [responses, setResponses] = useState<Record<number, boolean>>({ 4: true, 5: true, 6: true }),
    [drivers, setDrivers] = useState<Record<number, boolean>>({}),
    [loss, setLoss] = useState(1),
    [records, setRecords] = useState<(number | null)[][]>(practiceHousehold.map((r) => [...r])),
    [person, setPerson] = useState(0),
    [index, setIndex] = useState(0);
  const chapter = film.watch ? film.chapter : (selected ?? film.chapter),
    response = responses[chapter] ?? true,
    inheritsCurrentChapter = chapter === film.chapter,
    directedTime = inheritsCurrentChapter ? film.chapterTime : 0,
    d = fluidDirector(chapter, directedTime, en ? 'en' : 'zh'),
    progress = film.watch ? d.progress : (manualTime ?? d.progress),
    actualLoss = film.watch ? 1 : loss,
    actualResponse = film.watch ? true : response;
  const shot = film.watch ? d.shot : (detail ?? d.shot),
    cell = film.watch ? d.cell : (manualTime ?? d.cell),
    inheritedDriver = d.driver,
    driver = drivers[chapter] ?? inheritedDriver,
    actualDriver = film.watch ? inheritedDriver : driver;
  const water = waterRegulation(progress * 10, actualLoss, actualResponse, actualDriver ? 1 : 0),
    salt = sodiumRegulation(progress * 10, actualLoss, actualResponse, actualDriver);
  const setTheme = (v: string) => {
    setSelected(Number(v));
    setDetail(null);
    setManualTime(null);
  };
  return (
    <div
      ref={host}
      className="bbf17"
      data-chapter={chapter}
      data-shot={shot}
      data-response={actualResponse}
      data-driver={actualDriver}
      data-loss={actualLoss}
    >
      <div className="bbf17-scene">
        {chapter < 2 ? (
          <Exchange
            w={w}
            t={chapter === 0 ? progress * 10 : 10 + progress * 30}
            lymph={film.watch ? true : lymph}
            s={s}
          />
        ) : chapter < 4 ? (
          <Records
            w={w}
            chapter={chapter}
            progress={film.watch ? progress : 1}
            household={film.watch ? practiceHousehold : chapter === 2 ? [records[person]] : records}
            s={s}
          />
        ) : chapter === 4 ? (
          <Heat w={w} t={progress * 12} loss={actualLoss} feedback={actualResponse} s={s} />
        ) : shot === 'water-cell' || shot === 'no-gradient' ? (
          <WaterCell
            w={w}
            p={cell}
            gradient={actualDriver ? 1 : 0}
            s={s}
            counter={shot === 'no-gradient'}
          />
        ) : shot === 'sodium-cell' || shot === 'pump-off' ? (
          <SodiumCell w={w} p={cell} pump={actualDriver} s={s} />
        ) : shot === 'budget' || shot === 'salt-budget' ? (
          <Budget
            w={w}
            s={s}
            salt={chapter === 6}
            loss={actualLoss}
            response={actualResponse}
            driver={actualDriver}
            t={progress * 10}
          />
        ) : (
          <Signal
            w={w}
            s={s}
            salt={chapter === 6}
            loss={shot === 'loss' || shot === 'salt-loss'}
            signal={chapter === 6 ? salt.signal : water.signal}
            stock={chapter === 6 ? salt.sodium : water.water}
          />
        )}
      </div>
      {!film.watch && (
        <div className="bbf17-controls">
          <Segments
            label={s('观察主题', 'View')}
            value={String(chapter)}
            options={names.map(([a, b], i) => ({ value: String(i), label: s(a, b) }))}
            onChange={setTheme}
          />
          {chapter >= 5 && (
            <Segments
              label={s('观察层级', 'Observation level')}
              value={
                shot === 'water-cell' ||
                shot === 'sodium-cell' ||
                shot === 'pump-off' ||
                shot === 'no-gradient'
                  ? 'cell'
                  : shot.includes('budget')
                    ? 'budget'
                    : 'signal'
              }
              options={[
                { value: 'signal', label: s('反馈信号', 'Signal') },
                { value: 'cell', label: s('膜内路径', 'Membrane path') },
                { value: 'budget', label: s('收支比较', 'Balance') },
              ]}
              onChange={(v) =>
                setDetail(
                  v === 'cell'
                    ? chapter === 5
                      ? 'water-cell'
                      : 'sodium-cell'
                    : v === 'budget'
                      ? chapter === 5
                        ? 'budget'
                        : 'salt-budget'
                      : chapter === 5
                        ? 'signal'
                        : 'adrenal',
                )
              }
            />
          )}
          {chapter === 2 || chapter === 3 ? (
            <>
              <Segments
                label={s('记录对象', 'Person')}
                value={String(person)}
                options={['A', 'B', 'C'].map((v, i) => ({ value: String(i), label: v }))}
                onChange={(v) => setPerson(Number(v))}
              />
              <Segments
                label={s('记录时刻', 'Record time')}
                value={String(index)}
                options={temperatureTimes.map((v, i) => ({
                  value: String(i),
                  label: i === 6 ? s('睡前', 'Bed') : `${v}:00`,
                }))}
                onChange={(v) => setIndex(Number(v))}
              />
              <Range
                label={s('体温记录', 'Temperature record')}
                value={records[person][index] ?? 36.5}
                min={35.5}
                max={38.5}
                step={0.1}
                unit="°C"
                onChange={(v) =>
                  setRecords((r) =>
                    r.map((row, i) =>
                      i === person ? row.map((x, j) => (j === index ? v : x)) : row,
                    ),
                  )
                }
              />
              <div className="bbf17-buttons">
                <button
                  onClick={() =>
                    setRecords((r) =>
                      r.map((row, i) =>
                        i === person ? row.map((x, j) => (j === index ? null : x)) : row,
                      ),
                    )
                  }
                >
                  {s('标记缺测', 'Mark missing')}
                </button>
                <button onClick={() => setRecords(practiceHousehold.map((r) => [...r]))}>
                  {s('恢复练习记录', 'Restore practice records')}
                </button>
              </div>
            </>
          ) : (
            <>
              <Range
                label={s('过程进度', 'Process progress')}
                value={Math.round(
                  (shot.includes('cell') || shot === 'no-gradient' || shot === 'pump-off'
                    ? cell
                    : progress) * 100,
                )}
                min={0}
                max={100}
                unit="%"
                onChange={(v) => setManualTime(v / 100)}
              />
              {chapter < 2 ? (
                <button aria-pressed={lymph} onClick={() => setLymph((v) => !v)}>
                  {s('淋巴路径开放', 'Lymph route open')}
                </button>
              ) : (
                <>
                  {(chapter === 4 ||
                    (!shot.includes('cell') && shot !== 'no-gradient' && shot !== 'pump-off')) && (
                    <Range
                      label={s('外部扰动', 'External disturbance')}
                      value={loss}
                      min={0}
                      max={2}
                      step={0.1}
                      onChange={setLoss}
                    />
                  )}
                  <div className="bbf17-buttons">
                    {(chapter === 4 ||
                      (!shot.includes('cell') &&
                        shot !== 'no-gradient' &&
                        shot !== 'pump-off')) && (
                      <button
                        aria-pressed={response}
                        onClick={() => setResponses((v) => ({ ...v, [chapter]: !v[chapter] }))}
                      >
                        {chapter === 4
                          ? s('反馈响应', 'Feedback response')
                          : s('肾脏响应激素', 'Kidney responds')}
                      </button>
                    )}
                    {chapter >= 5 && (
                      <button
                        aria-pressed={driver}
                        onClick={() => setDrivers((v) => ({ ...v, [chapter]: !driver }))}
                      >
                        {chapter === 5
                          ? s('保留水势差', 'Water gradient')
                          : s('钠钾泵工作', 'Na/K pump on')}
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
          <details>
            <summary>{s('模型的边界', 'Model limits')}</summary>
            <p>
              {s(
                '示踪点显示三个固定体积区室中的相对密度，不是单分子轨迹。体温为练习数据，缺测不补值。热、水与钠分别用归一化收支；固定溶质或固定水量是为隔离变量。肾小管图只解释末段转运，水通道不供能；离子图只选取一个泵循环，省略电势、其他转运和调节路径，不能用于健康判断。',
                'Tracer dots show relative density in three fixed-volume compartments, not individual molecules. Temperatures are practice records; missing values stay missing. Heat, water and sodium use separate normalized balances. Fixed solute or water isolates variables. Tubular views explain terminal transport, not whole-kidney clearance. Water channels supply no energy; the ion view selects one pump cycle. Electrical gradients, other transporters and regulatory paths are omitted. This is not a health assessment.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
