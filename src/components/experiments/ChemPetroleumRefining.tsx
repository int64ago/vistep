import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  petroleumSpecies,
  oilPath,
  columnState,
  fractionationFrame,
  crackingFrame,
  oilFormula,
} from '../../models/chem-petroleum-refining';
import '../../styles/chem-petroleum-refining.css';
const names = [
  '进入加热炉',
  '沿温度梯度分离',
  '分子身份没有改变',
  '十六烷的裂化',
  '辛烷继续裂化',
  '丁烷的一种途径',
  '丁烷的另一种途径',
];
function Column({
  progress,
  focus,
  bottom,
  top,
}: {
  progress: number;
  focus: number;
  bottom: number;
  top: number;
}) {
  const id = useId().replace(/:/g, ''),
    parcels = fractionationFrame(progress, bottom, top),
    selected = petroleumSpecies[focus];
  const state = columnState(selected.bp, bottom, top),
    finished = parcels.filter((p) => p.arrived).length;
  return (
    <div className="cpr-column-layout">
      <svg
        className="cpr-column"
        viewBox="0 0 320 320"
        role="img"
        aria-label={t('同一批代表分子沿连通的管道进入分馏塔，按挥发性从不同高度离开')}
      >
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#cbd9c8" />
            <stop offset=".55" stopColor="#e1d8bb" />
            <stop offset="1" stopColor="#ccaa87" />
          </linearGradient>
        </defs>
        <ellipse cx="156" cy="303" rx="73" ry="9" fill="#8d967c" opacity=".09" />
        <rect
          x="116"
          y="18"
          width="80"
          height="282"
          rx="36"
          fill={`url(#${id})`}
          stroke="#8e9a87"
          strokeWidth="1.5"
        />
        <path d="M127 49 V268 M187 49 V268" stroke="#f7f5e6" strokeWidth="3" opacity=".55" />
        {[69, 109, 149, 189, 229, 269].map((y, i) => (
          <g key={y}>
            <path
              d={`M${i % 2 ? 125 : 138} ${y} H${i % 2 ? 174 : 186}`}
              stroke="#929d88"
              strokeWidth="2"
            />
            <path d={`M${i % 2 ? 174 : 138} ${y} v-8`} stroke="#929d88" fill="none" />
          </g>
        ))}
        <rect
          x="7"
          y="243"
          width="64"
          height="50"
          rx="14"
          fill="#ba9a72"
          fillOpacity=".17"
          stroke="#b49a76"
        />
        <path
          d="M14 278 Q20 258 26 278 Q32 258 38 278 Q44 258 50 278"
          stroke="#bf9260"
          strokeWidth="3"
          fill="none"
        />
        {petroleumSpecies.map((s, i) => {
          const path = oilPath(i, bottom, top),
            outlet = path[path.length - 1];
          return (
            <g key={s.n} opacity={i === focus ? 1 : 0.27}>
              <polyline
                points={path.map((v) => `${v.x},${v.y}`).join(' ')}
                fill="none"
                stroke={s.color}
                strokeWidth={i === focus ? 5 : 2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <rect
                x="249"
                y={outlet.y - 12}
                width="31"
                height="24"
                rx="8"
                fill="#f4f1e0"
                stroke={s.color}
              />
              <text
                x="300"
                y={outlet.y + 6}
                fill={s.color}
                textAnchor="middle"
                opacity={i === focus ? 1 : 0}
              >
                {s.n}
              </text>
            </g>
          );
        })}
        {parcels.map((p) => (
          <g key={p.id} opacity={p.species === focus ? 1 : 0.45}>
            {p.id === focus && (
              <circle cx={p.x} cy={p.y} r="7" fill="none" stroke="#946f42" strokeWidth="1.2" />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={p.id === focus ? 3.5 : 2}
              fill={petroleumSpecies[p.species].color}
            />
          </g>
        ))}
        <text x="13" y="40" fill="#7c9280">
          {top}°C
        </text>
        <text x="13" y="223" fill="#a57958">
          {bottom}°C
        </text>
        <path
          d="M43 52 V201 M38 192 L43 201 L48 192"
          fill="none"
          stroke="#b2b7a0"
          strokeWidth="2"
        />
      </svg>
      <div className="cpr-column-note">
        <strong>{oilFormula(selected.n)}</strong>
        <span>
          {t('常压沸点')} {selected.bp}°C
        </span>
        <b>
          {state.type === 'gas'
            ? t('保持气态，去往塔顶')
            : state.type === 'residue'
              ? t('未充分汽化，留在底部')
              : t('进入较冷区域，凝结分离')}
        </b>
        <span>
          {t('已抵达出口')} {finished} / 40
        </span>
        <p>{t('五种代表物示意 · 馏分仍是混合物')}</p>
      </div>
    </div>
  );
}
function Identity({ progress }: { progress: number }) {
  const x = 34 + 212 * progress;
  return (
    <div className="cpr-identity">
      <svg
        viewBox="0 0 320 240"
        role="img"
        aria-label={t('十六个碳原子仍以相同顺序相连，分馏没有拆开碳链')}
      >
        <path d="M30 182 Q160 151 290 182" fill="none" stroke="#bec4ac" strokeWidth="2" />
        <path d="M282 175 L290 182 L281 187" fill="none" stroke="#bec4ac" strokeWidth="2" />
        <rect x={x - 18} y="180" width="36" height="7" rx="3.5" fill="#ad825c" opacity=".5" />
        <g transform={`translate(${(-0.5 + progress) * 30} 0)`}>
          {Array.from({ length: 15 }, (_, i) => (
            <path
              key={i}
              d={`M${47 + i * 15} ${104 + (i % 2) * 16} L${62 + i * 15} ${104 + ((i + 1) % 2) * 16}`}
              stroke="#997e60"
              strokeWidth="3"
            />
          ))}
          {Array.from({ length: 16 }, (_, i) => (
            <circle
              key={i}
              cx={47 + i * 15}
              cy={104 + (i % 2) * 16}
              r="4.5"
              fill={i === 7 ? '#b08d4b' : '#8f9b83'}
            />
          ))}
          <circle cx="152" cy="120" r="9" fill="none" stroke="#b08d4b" strokeWidth="1.5" />
        </g>
        <text x="160" y="52" textAnchor="middle">
          C₁₆H₃₄
        </text>
        <text x="160" y="224" textAnchor="middle">
          16 C · 34 H
        </text>
      </svg>
      <p>{t('位置与物态改变，碳链连接保持不变')}</p>
    </div>
  );
}
function Cracking({ n, cut, progress }: { n: number; cut: number; progress: number }) {
  const s = crackingFrame(n, cut, progress),
    a = s.atoms;
  return (
    <div className="cpr-crack-layout">
      <svg
        viewBox="0 0 320 270"
        className="cpr-crack"
        role="img"
        aria-label={t('保留碳原子身份，断开一处连接，形成一条较短烷烃和一条烯烃')}
      >
        <text x="160" y="33" textAnchor="middle">
          {oilFormula(n)}
        </text>
        <path
          d="M160 113 V147 M155 140 L160 147 L165 140"
          stroke="#a7ae98"
          strokeWidth="2"
          fill="none"
        />
        {Array.from({ length: n - 1 }, (_, i) => {
          const isCut = i === cut - 1;
          return (
            <line
              key={i}
              x1={a[i].x}
              y1={a[i].y}
              x2={a[i + 1].x}
              y2={a[i + 1].y}
              stroke={isCut ? '#b48a59' : '#8d9984'}
              strokeWidth="3"
              opacity={isCut ? s.breakOpacity : 1}
            />
          );
        })}
        <line
          x1={a[cut].x}
          y1={a[cut].y + 6}
          x2={a[cut + 1].x}
          y2={a[cut + 1].y + 6}
          stroke="#ad835a"
          strokeWidth="2.5"
          opacity={s.doubleOpacity}
        />
        {a.map((v) => (
          <g key={v.id}>
            <circle cx={v.x} cy={v.y} r="5" fill={v.id < cut ? '#8b9e86' : '#b08f65'} />
            {v.id === cut - 1 && (
              <circle cx={v.x} cy={v.y} r="10" fill="none" stroke="#b08d4b" strokeWidth="1.5" />
            )}
          </g>
        ))}
        <g opacity={s.doubleOpacity}>
          <text x="80" y="250" textAnchor="middle">
            {oilFormula(s.products[0].c, s.products[0].h)}
          </text>
          <text x="240" y="250" textAnchor="middle">
            {oilFormula(s.products[1].c, s.products[1].h)}
          </text>
          <text x="160" y="250" textAnchor="middle">
            +
          </text>
        </g>
      </svg>
      <div className="cpr-crack-note">
        <strong>
          {n} C · {2 * n + 2} H
        </strong>
        <span>{t('反应前后，原子总数守恒')}</span>
        <p>{t('净反应示意；过渡画面不是反应中间体')}</p>
        <span>{t('氢以分子式计数，省略单独绘制')}</span>
      </div>
    </div>
  );
}
export default function ChemPetroleumRefining() {
  const f = useShowcase(),
    [mode, setMode] = useState(1),
    [progress, setProgress] = useState(0.65),
    [focus, setFocus] = useState(3),
    [bottom, setBottom] = useState(350),
    [top, setTop] = useState(45),
    [cut, setCut] = useState(8);
  const m = f.watch ? Math.min(6, f.chapter) : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.06, 0.9)) : progress;
  const n = m === 3 ? 16 : m === 4 ? 8 : 4,
    k = f.watch ? (m === 3 ? 8 : m === 4 ? 4 : m === 5 ? 1 : 2) : Math.min(cut, n - 2);
  return (
    <div className={`cpr ${f.watch ? 'is-watch' : ''}`}>
      <div className="cpr-stage">
        <div className="cpr-heading">{t(names[m])}</div>
        {m < 2 ? (
          <Column
            progress={m === 0 ? p * 0.25 : 0.25 + p * 0.75}
            focus={f.watch ? 3 : focus}
            bottom={f.watch ? 350 : bottom}
            top={f.watch ? 45 : top}
          />
        ) : m === 2 ? (
          <Identity progress={p} />
        ) : (
          <Cracking n={n} cut={k} progress={p} />
        )}
      </div>
      {!f.watch && (
        <div className="cpr-controls">
          <Segments
            label={t('观察步骤')}
            value={String(m)}
            options={names.map((v, i) => ({ value: String(i), label: t(v) }))}
            onChange={(v) => {
              const i = +v;
              setMode(i);
              setCut(i === 3 ? 8 : i === 4 ? 4 : i === 5 ? 1 : 2);
            }}
          />
          <Range
            label={t('观察进程')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {m < 2 && (
            <>
              <Segments
                label={t('追踪代表分子')}
                value={String(focus)}
                options={petroleumSpecies.map((v, i) => ({
                  value: String(i),
                  label: oilFormula(v.n),
                }))}
                onChange={(v) => setFocus(+v)}
              />
              <Range
                label={t('塔底示意温度（°C）')}
                value={bottom}
                min={250}
                max={420}
                step={1}
                onChange={setBottom}
              />
              <Range
                label={t('塔顶示意温度（°C）')}
                value={top}
                min={20}
                max={120}
                step={1}
                onChange={setTop}
              />
            </>
          )}
          {m >= 3 && (
            <Range
              label={t('较短烷烃中的碳原子数')}
              value={k}
              min={1}
              max={n - 2}
              step={1}
              onChange={setCut}
            />
          )}
          <p>
            {t(
              '改变分馏温度会改变出口；改变断裂位置会改变满足守恒的产物组合。示意模型不预测工业产率。',
            )}
          </p>
        </div>
      )}
    </div>
  );
}
